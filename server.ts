import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { handleMultiplayerConnection, activeRooms } from './server/multiplayer';

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

// 1. Generate Trivia Questions with Search Grounding using gemini-3.5-flash
app.post('/api/generate-trivia', async (req, res) => {
  try {
    const { category, customTopic, difficulty = 'Medium', count = 5, personality } = req.body;

    const normalizedDifficulty: 'Easy' | 'Medium' | 'Hard' =
      difficulty === 'Easy' ? 'Easy' : difficulty === 'Hard' ? 'Hard' : 'Medium';

    const difficultyCriteria = {
      Easy: 'EASY LEVEL: Questions MUST be widely known common knowledge, recognizable pop culture/history/science, and accessible to broad general audiences (no obscure facts).',
      Medium: 'MEDIUM LEVEL: Questions MUST require specific domain knowledge, notable details, secondary historical figures, scientific principles, and intermediate trivia depth.',
      Hard: 'HARD LEVEL: Questions MUST be challenging for most players, obscure trivia, mind-bending historical nuances, deep scientific or cultural specifics, and tricky distinctions.',
    }[normalizedDifficulty];

    const topicDescription =
      category === 'custom' && customTopic
        ? `Custom Topic: "${customTopic}"`
        : category === 'breaking_news'
        ? `Recent 2025-2026 World, Tech & Science Events (Use Google Search grounding for latest facts)`
        : `Category: ${category}`;

    const hostInstructions = personality
      ? `The AI host is ${personality.name} (${personality.title}). Archetype: ${personality.archetype || 'Custom'}. Catchphrase: "${personality.catchphrase}". Bio: ${personality.bio}. System style: ${personality.systemInstruction}`
      : 'The AI host is an engaging game show master.';

    const prompt = `You are the lead question writer for a high-stakes AI-hosted trivia game show.
${hostInstructions}

TASK:
Generate exactly ${count} unique, captivating, factually accurate multiple-choice trivia questions.
Topic: ${topicDescription}
Difficulty: ${normalizedDifficulty}
${difficultyCriteria}

Requirements:
1. Verify accuracy using Google Search for real, verified facts, dates, and names.
2. Each question MUST have exactly 4 options.
3. Randomize the position of the correct answer among options (index 0 to 3).
4. Provide a punchy "hostCommentary" for each question written strictly in the host's personality tone (e.g. sarcastic witty banter, enthusiastic encouraging cheer, or formal educational scholarly framing).
5. Provide a fascinating "funFact" explaining the background.
6. Provide a clear "explanation".

You MUST return ONLY a valid JSON array matching this exact JSON structure (wrapped inside \`\`\`json and \`\`\` code fence):
\`\`\`json
[
  {
    "id": "q1",
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 1,
    "correctAnswer": "Option B",
    "explanation": "Why Option B is correct...",
    "category": "${category}",
    "difficulty": "${normalizedDifficulty}",
    "hostCommentary": "Host intro strictly in character here...",
    "funFact": "Fascinating verified fact here..."
  }
]
\`\`\``;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const responseText = response.text || '';
    
    // Extract grounding sources from Search Grounding
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const groundingSources: { title?: string; uri?: string }[] = [];
    
    for (const chunk of groundingChunks) {
      if (chunk.web?.uri) {
        groundingSources.push({
          title: chunk.web.title || 'Source Reference',
          uri: chunk.web.uri,
        });
      }
    }

    // Parse JSON array from response
    let jsonStr = responseText;
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || responseText.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1] || jsonMatch[0];
    }

    let questions = [];
    try {
      questions = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error('Failed to parse JSON directly, falling back:', parseErr);
      const cleaned = jsonStr.replace(/^[^{[]*/, '').replace(/[^}\]]*$/, '');
      questions = JSON.parse(cleaned);
    }

    // Attach grounding sources to questions
    const enrichedQuestions = questions.map((q: any, idx: number) => ({
      id: q.id || `q_${Date.now()}_${idx}`,
      question: q.question || 'Trivia Question',
      options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ['A', 'B', 'C', 'D'],
      correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
      correctAnswer: q.correctAnswer || (q.options ? q.options[q.correctIndex || 0] : 'A'),
      explanation: q.explanation || 'Verified fact.',
      category: q.category || category,
      difficulty: normalizedDifficulty,
      hostCommentary: q.hostCommentary || 'Let us see how you fare with this one!',
      funFact: q.funFact || 'Here is an intriguing trivia detail.',
      groundingSources: groundingSources.slice(0, 3),
    }));

    res.json({ questions: enrichedQuestions, groundingSources });
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

    const validVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
    const chosenVoice = validVoices.includes(voice) ? voice : 'Puck';

    const generateWithRetry = async (text: string, voice: string, retries = 3, delay = 2000): Promise<any> => {
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

    res.json({ audio: base64Audio, voice: chosenVoice });
  } catch (error: any) {
    console.error('Error in host TTS:', error);
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
