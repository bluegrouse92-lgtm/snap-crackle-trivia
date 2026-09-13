/**
 * Comprehensive Test Runner for Snap Crackle Pop Trivia 💥⚡🍿
 * 
 * Exercises all REST APIs, validation middleware, and WebSocket multiplayer
 * state transitions while verifying Winston structured logging in the background.
 */

import { WebSocket } from 'ws';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
const WS_URL = 'ws://localhost:3000/ws/multiplayer';

interface TestResult {
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

async function runTest(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    const durationMs = Date.now() - start;
    results.push({ name, passed: true, durationMs });
    console.log(`  ✅ [PASS] ${name} (${durationMs}ms)`);
  } catch (err: any) {
    const durationMs = Date.now() - start;
    results.push({ name, passed: false, durationMs, error: err.message || String(err) });
    console.error(`  ❌ [FAIL] ${name} (${durationMs}ms): ${err.message || err}`);
  }
}

function expect(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  console.log('\n🚀 Starting Snap Crackle Pop Trivia Automated Test Suite...\n');

  // ==========================================
  // SUITE 1: Health & Static Serving
  // ==========================================
  console.log('--- Suite 1: Health & Static Serving ---');

  await runTest('GET /api/health should return ok', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    expect(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    expect(data.status === 'ok', `Expected status 'ok', got ${data.status}`);
  });

  await runTest('GET / should serve index.html with title', async () => {
    const res = await fetch(`${BASE_URL}/`);
    expect(res.status === 200, `Expected 200, got ${res.status}`);
    const html = await res.text();
    expect(html.includes('Snap Crackle Pop Trivia'), 'HTML must include game title');
    expect(html.includes('id="root"'), 'HTML must include root element');
  });

  await runTest('GET /api/weekly-status should return active week metadata', async () => {
    const res = await fetch(`${BASE_URL}/api/weekly-status`);
    expect(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    expect(typeof data.weekNumber === 'number', 'Expected weekNumber');
    expect(data.totalQuestions >= 500, `Expected >= 500 questions, got ${data.totalQuestions}`);
  });

  // ==========================================
  // SUITE 2: Trivia Generation & Validation
  // ==========================================
  console.log('\n--- Suite 2: Trivia Generation & Validation ---');

  await runTest('POST /api/generate-trivia should serve questions from local bank', async () => {
    const res = await fetch(`${BASE_URL}/api/generate-trivia`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: 'science_nature', difficulty: 'Medium', count: 3 }),
    });
    expect(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    expect(Array.isArray(data.questions), 'Expected questions array');
    expect(data.questions.length === 3, `Expected 3 questions, got ${data.questions.length}`);
    expect(data.source === 'weekly_bank', `Expected source weekly_bank, got ${data.source}`);
  });

  await runTest('POST /api/generate-trivia should clamp count within bounds [1, 50]', async () => {
    // Huge count clamp to 50
    const resHuge = await fetch(`${BASE_URL}/api/generate-trivia`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: 'all_mix', difficulty: 'All', count: 9999 }),
    });
    expect(resHuge.status === 200, `Expected 200 for huge count`);
    const dataHuge = await resHuge.json();
    expect(dataHuge.questions.length <= 50, `Expected max 50 questions, got ${dataHuge.questions.length}`);

    // Negative count clamp to 1
    const resNeg = await fetch(`${BASE_URL}/api/generate-trivia`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: 'all_mix', difficulty: 'Medium', count: -5 }),
    });
    expect(resNeg.status === 200, `Expected 200 for negative count`);
    const dataNeg = await resNeg.json();
    expect(dataNeg.questions.length >= 1, `Expected at least 1 question, got ${dataNeg.questions.length}`);
  });

  await runTest('POST /api/generate-trivia should succeed across all 7 categories', async () => {
    const categories = [
      'science_nature',
      'world_history',
      'geography_wonders',
      'pop_culture_gaming',
      'literature_arts',
      'breaking_news',
      'all_mix',
    ];

    for (const cat of categories) {
      const res = await fetch(`${BASE_URL}/api/generate-trivia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: cat, difficulty: 'Medium', count: 2 }),
      });
      expect(res.status === 200, `Failed for category ${cat}, status: ${res.status}`);
      const data = await res.json();
      expect(data.questions && data.questions.length > 0, `No questions returned for category ${cat}`);
    }
  });

  // ==========================================
  // SUITE 3: Host TTS & Banter
  // ==========================================
  console.log('\n--- Suite 3: Host TTS & Banter ---');

  await runTest('POST /api/host-tts with valid text should succeed', async () => {
    const res = await fetch(`${BASE_URL}/api/host-tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Welcome to the ultimate trivia battle!', voice: 'Puck' }),
    });
    expect(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    expect(data.fallback === true || Boolean(data.audio), 'Expected fallback or audio');
  });

  await runTest('POST /api/host-tts with empty text should return 400 Bad Request', async () => {
    const res = await fetch(`${BASE_URL}/api/host-tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '' }),
    });
    expect(res.status === 400, `Expected 400 for empty text, got ${res.status}`);
    const data = await res.json();
    expect(data.error === 'VALIDATION_ERROR', `Expected VALIDATION_ERROR, got ${data.error}`);
  });

  await runTest('POST /api/host-banter should return in-character quip', async () => {
    const res = await fetch(`${BASE_URL}/api/host-banter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'correct_streak',
        personality: { name: 'Roxy Roast', archetype: 'sarcastic_witty', catchphrase: 'Boom!' },
        context: { streak: 5 },
      }),
    });
    expect(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    expect(typeof data.text === 'string' && data.text.length > 0, 'Expected non-empty banter text');
  });

  // ==========================================
  // SUITE 4: Leaderboard API
  // ==========================================
  console.log('\n--- Suite 4: Leaderboard API ---');

  await runTest('GET /api/leaderboard should return ranked list', async () => {
    const res = await fetch(`${BASE_URL}/api/leaderboard?limit=10`);
    expect(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    expect(Array.isArray(data.entries), 'Expected entries array');
    expect(typeof data.totalCount === 'number', 'Expected totalCount');
    if (data.entries.length > 0) {
      expect(data.entries[0].rank === 1, 'Top entry should have rank 1');
    }
  });

  await runTest('POST /api/leaderboard with empty name should return 400', async () => {
    const res = await fetch(`${BASE_URL}/api/leaderboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName: '', score: 5000 }),
    });
    expect(res.status === 400, `Expected 400, got ${res.status}`);
    const data = await res.json();
    expect(data.error === 'VALIDATION_ERROR', `Expected VALIDATION_ERROR, got ${data.error}`);
  });

  await runTest('POST /api/leaderboard with valid entry should record and rank score', async () => {
    const testPlayerName = `AutoTest_${Date.now().toString(36)}`;
    const res = await fetch(`${BASE_URL}/api/leaderboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerName: testPlayerName,
        score: 17500,
        accuracyPct: 85,
        difficulty: 'Medium',
        category: 'science_nature',
        highestStreak: 5,
        hostName: 'Sunny Spark',
        hostId: 'sunny',
        totalQuestions: 10,
        correctQuestions: 8,
      }),
    });
    expect(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    expect(data.success === true, 'Expected success: true');
    expect(typeof data.entry.rank === 'number', 'Expected rank number');
    expect(data.entry.playerName === testPlayerName, 'Player name mismatch');
  });

  // ==========================================
  // SUITE 5: Multiplayer WebSocket & Resilience
  // ==========================================
  console.log('\n--- Suite 5: Multiplayer WebSocket Engine & Resilience ---');

  await runTest('WebSocket connection and heartbeat ping/pong', async () => {
    return new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(WS_URL);
      const timer = setTimeout(() => {
        ws.close();
        reject(new Error('WebSocket connection timed out'));
      }, 5000);

      ws.on('open', () => {
        ws.send(JSON.stringify({ type: 'heartbeat_ping' }));
      });

      ws.on('message', (msgData) => {
        const msg = JSON.parse(msgData.toString());
        if (msg.type === 'heartbeat_pong') {
          clearTimeout(timer);
          ws.close();
          resolve();
        }
      });

      ws.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  });

  await runTest('Create room, toggle ready, chat, and test 60s disconnect grace period', async () => {
    return new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(WS_URL);
      const testPlayerId = `test_player_${Date.now()}`;
      let createdRoomId = '';
      let createdRoomCode = '';

      const timer = setTimeout(() => {
        ws.close();
        reject(new Error('Multiplayer room test timed out'));
      }, 8000);

      ws.on('open', () => {
        ws.send(
          JSON.stringify({
            type: 'create_room',
            player: { id: testPlayerId, name: 'Tester Alpha', coins: 500 },
            settings: { betAmount: 50, roundCount: 3 },
          })
        );
      });

      let step = 1;

      ws.on('message', (msgData) => {
        const msg = JSON.parse(msgData.toString());

        if (msg.type === 'room_joined' && step === 1) {
          createdRoomId = msg.roomId;
          createdRoomCode = msg.roomCode;
          step = 2;
          // Send chat message
          ws.send(JSON.stringify({ type: 'send_chat', text: 'Hello Arena!' }));
        } else if (msg.type === 'room_state' && step === 2) {
          step = 3;
          // Toggle ready
          ws.send(JSON.stringify({ type: 'toggle_ready' }));
        } else if (msg.type === 'room_state' && step === 3) {
          const player = msg.state?.players?.find((p: any) => p.id === testPlayerId);
          if (player && player.isReady) {
            step = 4;
            // Now simulate unexpected disconnect (close without leave_room)
            ws.close();

            // Open new socket to test reconnect_room
            setTimeout(() => {
              const ws2 = new WebSocket(WS_URL);

              ws2.on('open', () => {
                ws2.send(
                  JSON.stringify({
                    type: 'reconnect_room',
                    roomId: createdRoomId,
                    roomCode: createdRoomCode,
                    playerId: testPlayerId,
                  })
                );
              });

              ws2.on('message', (msg2Data) => {
                const msg2 = JSON.parse(msg2Data.toString());
                if (msg2.type === 'room_joined' && msg2.reconnected) {
                  // Explicitly leave to clean up
                  ws2.send(JSON.stringify({ type: 'leave_room' }));
                  ws2.close();
                  clearTimeout(timer);
                  resolve();
                }
              });

              ws2.on('error', (err) => {
                clearTimeout(timer);
                reject(err);
              });
            }, 500);
          }
        }
      });

      ws.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  });

  // ==========================================
  // SUITE 6: Winston Background Logging Audit
  // ==========================================
  console.log('\n--- Suite 6: Winston Background Log Audit ---');

  await runTest('Winston log files should exist and record structured events', async () => {
    const combinedLogPath = path.join(process.cwd(), 'logs', 'combined.log');
    const errorLogPath = path.join(process.cwd(), 'logs', 'error.log');

    expect(fs.existsSync(combinedLogPath), 'logs/combined.log must exist');
    expect(fs.existsSync(errorLogPath), 'logs/error.log must exist');

    const combinedContent = fs.readFileSync(combinedLogPath, 'utf-8').trim();
    expect(combinedContent.length > 0, 'logs/combined.log must not be empty');

    const lines = combinedContent.split('\n');
    let hasHttpTag = false;
    let hasTriviaTag = false;
    let hasLeaderboardTag = false;

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        if (parsed.tag === 'HTTP') hasHttpTag = true;
        if (parsed.tag === 'TRIVIA') hasTriviaTag = true;
        if (parsed.tag === 'LEADERBOARD') hasLeaderboardTag = true;
      } catch {}
    }

    expect(hasHttpTag, 'Log should contain HTTP tag entries');
    expect(hasTriviaTag, 'Log should contain TRIVIA tag entries');
    expect(hasLeaderboardTag, 'Log should contain LEADERBOARD tag entries');
  });

  // ==========================================
  // SUMMARY
  // ==========================================
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log('\n==========================================');
  console.log(`📊 Test Summary: ${passed}/${total} Passed (${failed} Failed)`);
  console.log('==========================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
