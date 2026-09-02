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

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = 3000;

app.use(express.json());

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
    console.error('Error reading leaderboard file, using defaults:', err);
  }
  // Initialize with seeded entries
  saveLeaderboard(DEFAULT_SEEDED_SCORES);
  return DEFAULT_SEEDED_SCORES;
}

function saveLeaderboard(entries: StoredLeaderboardEntry[]): void {
  try {
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(entries, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving leaderboard file:', err);
  }
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Category Mapping for Open Trivia Database
const CATEGORY_MAP: Record<string, number> = {
  'science_nature': 17,
  'world_history': 23,
  'geography_wonders': 22,
  'literature_arts': 10,
  'pop_culture_gaming': 11, // Using Entertainment: Film as a proxy for pop culture
  'breaking_news': 9, // Using General Knowledge as a proxy
};

// 1. Generate Trivia Questions
app.post('/api/generate-trivia', async (req, res) => {
  try {
    const { category, difficulty = 'Medium', count = 5 } = req.body;
    
    // Filter by category and difficulty if needed
    let questions = TRIVIA_QUESTIONS.filter(q => 
        (category === 'all_mix' || q.category === category) &&
        (difficulty === 'All' || q.difficulty === difficulty)
    );

    // Shuffle and slice
    questions = questions.sort(() => Math.random() - 0.5).slice(0, Math.min(count, questions.length));

    res.json({ questions });
  } catch (error: any) {
    console.error('Error generating trivia:', error);
    res.status(500).json({ error: error.message || 'Failed to generate trivia' });
  }
});


// 2. Host Text-to-Speech (TTS) using gemini-3.1-flash-tts-preview
app.post('/api/host-tts', async (req, res) => {
  try {
    const { text, voice = 'Puck' } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Clean text to avoid reading markdown symbols out loud
    const cleanText = text
      .replace(/[*_#`~[\]()]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .trim();

    const validVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr', 'Aoede'];
    const chosenVoice = validVoices.includes(voice) ? voice : 'Puck';

    const generateWithRetry = async (text: string, voice: string, retries = 5, delay = 5000): Promise<any> => {
      try {
        return await ai.models.generateContent({
          model: 'gemini-3.1-flash-tts-preview',
          contents: [{ parts: [{ text }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voice },
              },
            },
          },
        });
      } catch (error: any) {
        if (retries > 0 && error.status === 429) {
          console.warn(`TTS quota exceeded, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return generateWithRetry(text, voice, retries - 1, delay * 2);
        }
        throw error;
      }
    };

    const response = await generateWithRetry(cleanText, chosenVoice);

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      return res.status(500).json({ error: 'No audio returned from TTS model' });
    }

    // Send response strictly as JSON
    res.setHeader('Content-Type', 'application/json');
    res.json({ audio: base64Audio, voice: chosenVoice });
  } catch (error: any) {
    console.error('Error in host TTS:', error);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: error.message || 'Failed to generate host speech' });
  }
});

// 3. Dynamic Host Banter / Reaction to Game Events
app.post('/api/host-banter', async (req, res) => {
  try {
    const { eventType, personality, context } = req.body;

    const systemInstruction = personality?.systemInstruction || 'You are an engaging trivia game show host.';
    const hostName = personality?.name || 'The Host';

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
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.9,
      },
    });

    const line = response.text?.trim() || personality?.catchphrase || 'Let us proceed!';
    res.json({ text: line });
  } catch (error: any) {
    console.error('Error in host banter:', error);
    res.status(500).json({ error: error.message || 'Failed to generate banter' });
  }
});

// 4. Lifeline Search Grounded Deep-Dive Fact
app.post('/api/lifeline-search', async (req, res) => {
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
    console.error('Error in lifeline search:', error);
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
    console.error('Error retrieving leaderboard:', error);
    res.status(500).json({ error: 'Failed to retrieve leaderboard' });
  }
});

app.post('/api/leaderboard', (req, res) => {
  try {
    const {
      playerName,
      score,
      accuracyPct,
      difficulty = 'Medium',
      category = 'all_mix',
      highestStreak = 0,
      hostName = 'The Host',
      hostId = 'roxy',
      totalQuestions = 5,
      correctQuestions = 0,
    } = req.body;

    if (!playerName || typeof score !== 'number') {
      return res.status(400).json({ error: 'Invalid score payload' });
    }

    const newEntry: StoredLeaderboardEntry = {
      id: `score_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      playerName: String(playerName).trim().slice(0, 24),
      score: Math.max(0, Math.round(score)),
      accuracyPct: Math.round(Number(accuracyPct) || 0),
      difficulty: difficulty === 'Easy' ? 'Easy' : difficulty === 'Hard' ? 'Hard' : 'Medium',
      category: String(category),
      highestStreak: Number(highestStreak) || 0,
      hostName: String(hostName),
      hostId: String(hostId),
      totalQuestions: Number(totalQuestions) || 5,
      correctQuestions: Number(correctQuestions) || 0,
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

    res.json({ success: true, entry: { ...newEntry, rank }, totalCount: trimmed.length });
  } catch (error: any) {
    console.error('Error saving leaderboard score:', error);
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
      console.error('Error handling WebSocket message:', err);
    }
  });

  clientWs.on('close', () => {
    console.log('Client disconnected from Live WebSocket');
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
    console.log(`PersonaTrivia server listening on http://0.0.0.0:${PORT}`);
  });
}

start();
