import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { handleMultiplayerConnection, activeRooms } from './server/multiplayer';
import { TRIVIA_QUESTIONS } from './server/trivia';
import { weeklyQuestionManager } from './server/weeklyManager';
import logger, { logHttp, logWs, logError, logTrivia, logLeaderboard } from './server/logger';
import {
  validateGenerateTrivia,
  validateLeaderboardSubmission,
  validateHostBanterRequest,
  validateTTSRequest,
  validateLifelineSearch,
  sanitizeString,
  sanitizeIdentifier,
} from './server/middleware/validation';

dotenv.config();

// TODO(observability): Integrate distributed APM and error tracking (e.g. Sentry or OpenTelemetry)
// TODO(security): Add express-rate-limit to protect AI endpoints against high-volume abuse

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '1mb' }));

// HTTP Request Logging Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (!req.url.startsWith('/@') && !req.url.startsWith('/src') && !req.url.startsWith('/node_modules')) {
      logHttp(`${req.method} ${req.originalUrl} [${res.statusCode}] - ${duration}ms`);
    }
  });
  next();
});

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// File-backed Persistent Leaderboard
// TODO(tech-debt): Migrate file-based leaderboard (data/leaderboard.json) to SQLite or PostgreSQL for transactional atomicity
const DATA_DIR = path.join(process.cwd(), 'data');
const LEADERBOARD_FILE = path.join(DATA_DIR, 'leaderboard.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface StoredLeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  accuracyPct: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  highestStreak: number;
  hostName: string;
  hostId: string;
  totalQuestions: number;
  correctQuestions: number;
  timestamp: string;
}

const DEFAULT_SEEDED_SCORES: StoredLeaderboardEntry[] = [
  {
    id: 'seed-1',
    playerName: 'QuizMaster_X',
    score: 28450,
    accuracyPct: 100,
    difficulty: 'Hard',
    category: 'science_nature',
    highestStreak: 10,
    hostName: 'Prof. Archibald Sterling',
    hostId: 'sterling',
    totalQuestions: 10,
    correctQuestions: 10,
    timestamp: '2026-08-30T14:22:00.000Z',
  },
  {
    id: 'seed-2',
    playerName: 'NovaRider',
    score: 23100,
    accuracyPct: 90,
    difficulty: 'Hard',
    category: 'world_history',
    highestStreak: 8,
    hostName: 'Roxy Sparks',
    hostId: 'roxy',
    totalQuestions: 10,
    correctQuestions: 9,
    timestamp: '2026-08-29T19:45:00.000Z',
  },
  {
    id: 'seed-3',
    playerName: 'CosmicVoyager',
    score: 18900,
    accuracyPct: 100,
    difficulty: 'Medium',
    category: 'pop_culture_gaming',
    highestStreak: 8,
    hostName: 'Sunny Sparkle',
    hostId: 'sunny',
    totalQuestions: 8,
    correctQuestions: 8,
    timestamp: '2026-08-28T11:15:00.000Z',
  },
  {
    id: 'seed-4',
    playerName: 'Brainiac99',
    score: 15400,
    accuracyPct: 88,
    difficulty: 'Medium',
    category: 'all_mix',
    highestStreak: 6,
    hostName: 'UNIT-74 "TriviaPrime"',
    hostId: 'unit74',
    totalQuestions: 8,
    correctQuestions: 7,
    timestamp: '2026-08-27T16:30:00.000Z',
  },
  {
    id: 'seed-5',
    playerName: 'TriviaEnthusiast',
    score: 9800,
    accuracyPct: 100,
    difficulty: 'Easy',
    category: 'geography_wonders',
    highestStreak: 5,
    hostName: 'Sunny Sparkle',
    hostId: 'sunny',
    totalQuestions: 5,
    correctQuestions: 5,
    timestamp: '2026-08-26T09:00:00.000Z',
  },
  {
    id: 'seed-6',
    playerName: 'PixelPaladin',
    score: 8200,
    accuracyPct: 80,
    difficulty: 'Easy',
    category: 'pop_culture_gaming',
    highestStreak: 4,
    hostName: 'Roxy Sparks',
    hostId: 'roxy',
    totalQuestions: 5,
    correctQuestions: 4,
    timestamp: '2026-08-25T20:10:00.000Z',
  },
];

function loadLeaderboard(): StoredLeaderboardEntry[] {
  try {
    if (fs.existsSync(LEADERBOARD_FILE)) {
      const data = fs.readFileSync(LEADERBOARD_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    logError('Error reading leaderboard file, using defaults', err, 'LEADERBOARD');
  }
  // Initialize with seeded entries
  saveLeaderboard(DEFAULT_SEEDED_SCORES);
  return DEFAULT_SEEDED_SCORES;
}

function saveLeaderboard(entries: StoredLeaderboardEntry[]): void {
  try {
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(entries, null, 2), 'utf-8');
  } catch (err) {
    logError('Error saving leaderboard file', err, 'LEADERBOARD');
  }
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

function decodeHtmlEntities(text: string): string {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&eacute;/g, 'é')
    .replace(/&Eacute;/g, 'É')
    .replace(/&aacute;/g, 'á')
    .replace(/&iacute;/g, 'í')
    .replace(/&oacute;/g, 'ó')
    .replace(/&uacute;/g, 'ú')
    .replace(/&ntilde;/g, 'ñ')
    .replace(/&uuml;/g, 'ü')
    .replace(/&deg;/g, '°')
    .replace(/&#(\d+);/g, (_match, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_match, hex) => String.fromCharCode(parseInt(hex, 16)));
}

// Category Mapping for Open Trivia Database
const CATEGORY_MAP: Record<string, number> = {
  'science_nature': 17,
  'world_history': 23,
  'geography_wonders': 22,
  'literature_arts': 10,
  'pop_culture_gaming': 15, // Entertainment: Video Games
  'breaking_news': 9, // General Knowledge
};

function getLocalQuestions(category: string, difficulty: string, count: number) {
  let pool = TRIVIA_QUESTIONS.filter((q) => {
    const matchCat = category === 'all_mix' || !category || q.category === category;
    const matchDiff = difficulty === 'All' || !difficulty || q.difficulty === difficulty;
    return matchCat && matchDiff;
  });

  if (pool.length < count) {
    const catPool = TRIVIA_QUESTIONS.filter((q) => category === 'all_mix' || !category || q.category === category);
    pool = catPool.length >= count ? catPool : [...TRIVIA_QUESTIONS];
  }

  return [...pool].sort(() => Math.random() - 0.5).slice(0, count);
}

// 1. Generate Trivia Questions - Instant local serving from the 500-question weekly bank
app.post('/api/generate-trivia', validateGenerateTrivia, async (req, res) => {
  try {
    const { category, customTopic, difficulty, count: targetCount, hostVoiceName } = req.body;
    logTrivia(`Serving trivia questions (count: ${targetCount}, category: ${category}, diff: ${difficulty})`);

    // Tier 1: Local Weekly Question Vault (500 Questions Bank)
    const weeklyQuestions = weeklyQuestionManager.getQuestions(category, difficulty, targetCount, hostVoiceName);
    if (weeklyQuestions.length > 0) {
      return res.json({
        questions: weeklyQuestions,
        source: 'weekly_bank',
        week: weeklyQuestionManager.getMetadata().weekNumber,
      });
    }

    // Tier 2: Open Trivia Database API (Secondary Fallback)
    if (category !== 'custom') {
      try {
        const otdbCategory = CATEGORY_MAP[category];
        const diffParam = difficulty === 'All' ? '' : `&difficulty=${difficulty.toLowerCase()}`;
        const catParam = otdbCategory ? `&category=${otdbCategory}` : '';
        const otdbUrl = `https://opentdb.com/api.php?amount=${targetCount}${catParam}${diffParam}&type=multiple`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const response = await fetch(otdbUrl, { signal: controller.signal });
        clearTimeout(timeout);

        if (response.ok) {
          const data = await response.json();
          if (data.response_code === 0 && Array.isArray(data.results) && data.results.length > 0) {
            const questions = data.results.map((q: any, idx: number) => {
              const decodedCorrect = decodeHtmlEntities(q.correct_answer);
              const decodedIncorrect = (q.incorrect_answers || []).map((ans: string) => decodeHtmlEntities(ans));
              const allOptions = [...decodedIncorrect, decodedCorrect].sort(() => Math.random() - 0.5);
              const correctIdx = allOptions.indexOf(decodedCorrect);

              return {
                id: `otdb_${Date.now()}_${idx}`,
                question: decodeHtmlEntities(q.question),
                options: allOptions,
                correctIndex: correctIdx >= 0 ? correctIdx : 0,
                correctAnswer: decodedCorrect,
                explanation: `Verified fact: "${decodedCorrect}" is the correct answer.`,
                category,
                difficulty: (q.difficulty ? q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1) : difficulty) as any,
                hostCommentary: `${hostVoiceName} says: Think carefully on this one!`,
                funFact: `Categorized under ${decodeHtmlEntities(q.category)}.`,
              };
            });
            return res.json({ questions, source: 'otdb' });
          }
        }
      } catch (otdbErr) {
        console.warn('OpenTriviaDB fetch timed out or failed, falling back to local vault:', otdbErr);
      }
    }

    // Tier 3: High-Quality Static Vault Fallback
    const fallbackQuestions = getLocalQuestions(category, difficulty, targetCount);
    res.json({ questions: fallbackQuestions, source: 'offline_vault' });
  } catch (error: any) {
    console.error('Error generating trivia:', error);
    const ultimate = getLocalQuestions('all_mix', 'Medium', 5);
    res.json({ questions: ultimate, source: 'emergency_fallback' });
  }
});

// Weekly Bank Status & Metadata
app.get('/api/weekly-status', (req, res) => {
  res.json(weeklyQuestionManager.getMetadata());
});

// Admin endpoint to reload weekly questions from disk
app.post('/api/admin/refresh-questions', (req, res) => {
  const success = weeklyQuestionManager.reload();
  res.json({ success, metadata: weeklyQuestionManager.getMetadata() });
});


// 2. Host Text-to-Speech (TTS) using gemini-3.1-flash-tts-preview or instant fallback
app.post('/api/host-tts', validateTTSRequest, async (req, res) => {
  try {
    const { text, voice = 'Puck' } = req.body;
    const validVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr', 'Aoede'];
    const chosenVoice = validVoices.includes(voice) ? voice : 'Puck';

    // If no API key configured, advise client to use Web Speech API immediately
    if (!process.env.GEMINI_API_KEY) {
      return res.json({ fallback: true, voice: chosenVoice, message: 'Local TTS active' });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-tts-preview',
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: chosenVoice },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        res.setHeader('Content-Type', 'application/json');
        return res.json({ audio: base64Audio, voice: chosenVoice });
      }
    } catch (ttsErr: any) {
      logger.warn('Gemini TTS request bypassed, using local speech fallback', { error: ttsErr.message });
    }

    res.setHeader('Content-Type', 'application/json');
    res.json({ fallback: true, voice: chosenVoice });
  } catch (error: any) {
    logError('Error in /api/host-tts', error, 'TTS');
    res.setHeader('Content-Type', 'application/json');
    res.json({ fallback: true, voice: 'Puck' });
  }
});

// 3. Dynamic Host Banter / Reaction to Game Events
app.post('/api/host-banter', validateHostBanterRequest, async (req, res) => {
  const { eventType, personality, context } = req.body;
  const hostName = personality?.name || 'The Host';

  if (!process.env.GEMINI_API_KEY) {
    return res.json({ text: personality?.catchphrase || 'On to the next round, contenders!' });
  }

  try {
    const systemInstruction = personality?.systemInstruction || 'You are an engaging trivia game show host.';
    const prompt = `You are ${hostName}.
System Instruction: ${systemInstruction}

Event: ${eventType}
Context Details: ${JSON.stringify(context || {})}

Generate a short, punchy 1 to 2 sentence commentary strictly in your personality voice and archetype.
- If event is "correct_streak", celebrate with your signature style.
- If event is "wrong_answer", deliver your in-character roast, encouraging cheer, or academic explanation.
- If event is "lifeline_5050", react to the 50/50 lifeline.
- If event is "hint_request", give a clever clue without spoiling the direct answer.
- If event is "game_start", welcome the contender with your catchphrase style.
- If event is "game_over", give your grand closing verdict and score appraisal.

Return ONLY the spoken line text. No quotation marks or meta commentary.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.85,
      },
    });

    const line = response.text?.trim() || personality?.catchphrase || 'Let us proceed!';
    res.json({ text: line });
  } catch (error: any) {
    logger.warn('Host banter AI unavailable, using in-character fallback', { error: error.message });
    res.json({ text: personality?.catchphrase || 'The game show continues!' });
  }
});

// 4. Lifeline Search Grounded Deep-Dive Fact
app.post('/api/lifeline-search', validateLifelineSearch, async (req, res) => {
  try {
    const { question, options, category } = req.body;

    const prompt = `Use Google Search to find a verified hint and contextual background for this trivia question without bluntly giving away the exact answer directly.
Question: "${question}"
Options: ${JSON.stringify(options)}
Category: ${category}

Provide:
1. A 1-2 sentence verified clue/fact discovered via Search.
2. The key connection to the topic.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const factText = response.text?.trim() || 'A search revealed notable connections to this topic.';
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: { title?: string; uri?: string }[] = [];

    for (const chunk of chunks) {
      if (chunk.web?.uri) {
        sources.push({
          title: chunk.web.title || 'Search Citation',
          uri: chunk.web.uri,
        });
      }
    }

    res.json({ fact: factText, sources: sources.slice(0, 3) });
  } catch (error: any) {
    logError('Error in lifeline search', error, 'SEARCH');
    res.status(500).json({ error: error.message || 'Failed to perform search lifeline' });
  }
});

// 5. Persistent Leaderboard Endpoints
app.get('/api/leaderboard', (req, res) => {
  try {
    const { difficulty, category, limit = 50 } = req.query;
    let entries = loadLeaderboard();

    if (difficulty && difficulty !== 'All') {
      entries = entries.filter((e) => e.difficulty === difficulty);
    }
    if (category && category !== 'all') {
      entries = entries.filter((e) => e.category === category);
    }

    // Sort descending by score
    entries.sort((a, b) => b.score - a.score);

    // Attach rank
    const rankedEntries = entries.slice(0, Number(limit)).map((e, index) => ({
      ...e,
      rank: index + 1,
    }));

    res.json({ entries: rankedEntries, totalCount: entries.length });
  } catch (error: any) {
    logError('Error retrieving leaderboard', error, 'LEADERBOARD');
    res.status(500).json({ error: 'Failed to retrieve leaderboard' });
  }
});

app.post('/api/leaderboard', validateLeaderboardSubmission, (req, res) => {
  try {
    const {
      playerName,
      score,
      accuracyPct,
      difficulty,
      category,
      highestStreak,
      hostName,
      hostId,
      totalQuestions,
      correctQuestions,
    } = req.body;

    const newEntry: StoredLeaderboardEntry = {
      id: `score_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      playerName,
      score,
      accuracyPct,
      difficulty,
      category,
      highestStreak,
      hostName,
      hostId,
      totalQuestions,
      correctQuestions,
      timestamp: new Date().toISOString(),
    };

    const entries = loadLeaderboard();
    entries.push(newEntry);
    entries.sort((a, b) => b.score - a.score);

    // Keep top 200 entries
    const trimmed = entries.slice(0, 200);
    saveLeaderboard(trimmed);

    // Determine rank of the new entry
    const rankIndex = trimmed.findIndex((e) => e.id === newEntry.id);
    const rank = rankIndex !== -1 ? rankIndex + 1 : trimmed.length;

    logLeaderboard(`New score registered: ${playerName} - ${score.toLocaleString()} pts (Rank #${rank})`);
    res.json({ success: true, entry: { ...newEntry, rank }, totalCount: trimmed.length });
  } catch (error: any) {
    logError('Error saving leaderboard score', error, 'LEADERBOARD');
    res.status(500).json({ error: 'Failed to save score' });
  }
});

// 6. Setup WebSocket Server for Live Voice & Multiplayer
const liveWss = new WebSocketServer({ noServer: true });
const multiplayerWss = new WebSocketServer({ noServer: true });

// Public multiplayer rooms overview
app.get('/api/multiplayer/rooms', (_req, res) => {
  const rooms = Array.from(activeRooms.values()).map((r) => ({
    roomId: r.roomId,
    roomCode: r.roomCode,
    status: r.status,
    playerCount: r.players.length,
    potTotal: r.potTotal,
    category: r.settings.category,
    difficulty: r.settings.difficulty,
    betAmount: r.settings.betAmount,
    hostName: r.players.find((p) => p.isHost)?.name || 'Host',
  }));
  res.json({ rooms });
});

server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;
  if (pathname === '/live' || pathname === '/api/live') {
    liveWss.handleUpgrade(request, socket, head, (ws) => {
      liveWss.emit('connection', ws, request);
    });
  } else if (pathname === '/multiplayer' || pathname === '/api/multiplayer' || pathname === '/ws/multiplayer') {
    multiplayerWss.handleUpgrade(request, socket, head, (ws) => {
      multiplayerWss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

multiplayerWss.on('connection', (clientWs: WebSocket) => {
  handleMultiplayerConnection(clientWs, ai);
});

liveWss.on('connection', async (clientWs: WebSocket) => {
  console.log('Client connected to Gemini Live API WebSocket');
  let session: any = null;

  clientWs.on('message', async (data: Buffer | string) => {
    try {
      const parsed = JSON.parse(data.toString());

      // Init Live session message
      if (parsed.type === 'init') {
        const { personality, currentQuestion } = parsed;
        const voiceName = personality?.voice || 'Puck';
        const hostSystemInstruction = `You are ${personality?.name || 'The Host'} (${personality?.title || 'Game Show Host'}).
${personality?.systemInstruction || ''}
You are actively hosting a live trivia game. The user can speak to you to answer questions, banter, ask for clues, or challenge your judgments.
Keep your responses conversational, spoken, concise (1-3 sentences max), and stay firmly in character!
Current Question context: ${currentQuestion ? JSON.stringify(currentQuestion) : 'General trivia banter'}.`;

        session = await ai.live.connect({
          model: 'gemini-3.1-flash-live-preview',
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName } },
            },
            systemInstruction: hostSystemInstruction,
          },
          callbacks: {
            onmessage: (message: any) => {
              // Send audio chunk to client
              const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (audio && clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({ type: 'audio', audio }));
              }
              if (message.serverContent?.interrupted && clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({ type: 'interrupted' }));
              }
              // Send any text transcription if provided
              const text = message.serverContent?.modelTurn?.parts?.find((p: any) => p.text)?.text;
              if (text && clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({ type: 'text', text }));
              }
            },
            onerror: (err: any) => {
              console.error('Live API Session Error:', err);
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({ type: 'error', error: err.message || 'Live session error' }));
              }
            },
            onclose: () => {
              console.log('Live API Session closed');
            },
          },
        });

        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({ type: 'ready' }));
        }
      }

      // Realtime Audio from Client Mic
      if (parsed.type === 'audio' && parsed.audio && session) {
        session.sendRealtimeInput({
          audio: {
            data: parsed.audio,
            mimeType: 'audio/pcm;rate=16000',
          },
        });
      }

      // Text input / question context update from client
      if (parsed.type === 'text_input' && parsed.text && session) {
        session.sendRealtimeInput({
          text: parsed.text,
        });
      }
    } catch (err: any) {
      logError('Error handling Live WebSocket message', err, 'LIVE_WS');
    }
  });

  clientWs.on('close', () => {
    logWs('Client disconnected from Live WebSocket');
    if (session) {
      try {
        session.close?.();
      } catch {
        // Ignore close error
      }
    }
  });
});

// Vite middleware for development & Static Serving for production
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    logger.info(`💥⚡🍿 Snap Crackle Pop Trivia server listening on http://0.0.0.0:${PORT}`, { port: PORT });
  });
}

start();
