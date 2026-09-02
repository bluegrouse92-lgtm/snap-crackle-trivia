import { WebSocket } from 'ws';
import { GoogleGenAI } from '@google/genai';

interface MultiplayerPlayer {
  id: string;
  name: string;
  avatar: string;
  coins: number;
  bet: number;
  questionWager: number;
  score: number;
  streak: number;
  isReady: boolean;
  isConnected: boolean;
  isHost: boolean;
  hasAnsweredCurrent: boolean;
  currentAnswerIndex: number | null;
  lastAnswerCorrect: boolean | null;
  lastPointsEarned: number;
  isBot?: boolean;
  ws?: WebSocket;
}

interface RoomChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  time: string;
  isSystem?: boolean;
}

interface TriviaQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  correctAnswer: string;
  explanation: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  hostCommentary: string;
  funFact: string;
  groundingSources?: { title?: string; uri?: string }[];
}

export interface MultiplayerRoom {
  roomId: string;
  roomCode: string;
  status: 'lobby' | 'countdown' | 'in_question' | 'round_recap' | 'game_over';
  hostId: string;
  players: MultiplayerPlayer[];
  potTotal: number;
  settings: {
    personality: any;
    category: string;
    customTopic?: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    roundCount: number;
    timePerQuestion: number;
    betAmount: number;
    autoPlayVoice: boolean;
    enableLiveVoice: boolean;
  };
  questions: TriviaQuestion[];
  currentIndex: number;
  timeRemaining: number;
  maxTime: number;
  hostCommentary: string;
  hostMood: string;
  eliminatedOptions: number[];
  winner?: { player: MultiplayerPlayer; coinPrize: number };
  chatMessages: RoomChatMessage[];
  countdownSeconds?: number;
  timerInterval?: NodeJS.Timeout | null;
  recapTimeout?: NodeJS.Timeout | null;
}

// In-memory active rooms
export const activeRooms = new Map<string, MultiplayerRoom>();

// Helper to generate readable 6-character room codes (e.g. TRV-784)
export function generateRoomCode(): string {
  const num = Math.floor(100 + Math.random() * 900);
  return `TRV-${num}`;
}

const BOT_NAMES = [
  { name: 'CyberSage_AI', avatar: 'sparkles' },
  { name: 'QuantumBrain', avatar: 'zap' },
  { name: 'PixelPaladin', avatar: 'shield' },
  { name: 'NovaQuizzler', avatar: 'flame' },
  { name: 'DrTrivia_Bot', avatar: 'book' },
  { name: 'NeonNerd', avatar: 'moon' },
  { name: 'DataDestroyer', avatar: 'target' },
  { name: 'LogicLlama', avatar: 'smile' },
  { name: 'CodeCrusher', avatar: 'terminal' },
  { name: 'QuizQueen_Bot', avatar: 'crown' },
];

export function broadcastRoomState(room: MultiplayerRoom) {
  const sanitizedPlayers = room.players.map((p) => ({
    id: p.id,
    name: p.name,
    avatar: p.avatar,
    coins: p.coins,
    bet: p.bet,
    score: p.score,
    streak: p.streak,
    isReady: p.isReady,
    isConnected: p.isConnected,
    isHost: p.isHost,
    hasAnsweredCurrent: p.hasAnsweredCurrent,
    // Hide exact option chosen during live round so other players cannot copy
    currentAnswerIndex: room.status === 'round_recap' || room.status === 'game_over' ? p.currentAnswerIndex : null,
    lastAnswerCorrect: p.lastAnswerCorrect,
    lastPointsEarned: p.lastPointsEarned,
    isBot: p.isBot,
  }));

  // Hide correct answer from question payload while in_question
  const currentQ = room.questions[room.currentIndex];
  let clientQuestion = null;
  if (currentQ) {
    if (room.status === 'in_question') {
      clientQuestion = {
        id: currentQ.id,
        question: currentQ.question,
        options: currentQ.options,
        category: currentQ.category,
        difficulty: currentQ.difficulty,
        hostCommentary: currentQ.hostCommentary,
        groundingSources: currentQ.groundingSources,
        // correctIndex, correctAnswer, explanation hidden
      };
    } else {
      clientQuestion = currentQ;
    }
  }

  const payload = JSON.stringify({
    type: 'room_state',
    room: {
      roomId: room.roomId,
      roomCode: room.roomCode,
      status: room.status,
      hostId: room.hostId,
      players: sanitizedPlayers,
      potTotal: room.potTotal,
      settings: room.settings,
      currentIndex: room.currentIndex,
      currentQuestion: clientQuestion,
      totalQuestions: room.questions.length,
      timeRemaining: room.timeRemaining,
      maxTime: room.maxTime,
      hostCommentary: room.hostCommentary,
      hostMood: room.hostMood,
      eliminatedOptions: room.eliminatedOptions,
      winner: room.winner
        ? {
            player: {
              id: room.winner.player.id,
              name: room.winner.player.name,
              avatar: room.winner.player.avatar,
              score: room.winner.player.score,
            },
            coinPrize: room.winner.coinPrize,
          }
        : undefined,
      chatMessages: room.chatMessages.slice(-25),
      countdownSeconds: room.countdownSeconds,
    },
  });

  room.players.forEach((p) => {
    if (p.ws && p.ws.readyState === WebSocket.OPEN) {
      try {
        p.ws.send(payload);
      } catch (err) {
        console.error('Error sending room state to player:', p.id, err);
      }
    }
  });
}

export function handleMultiplayerConnection(ws: WebSocket, ai: GoogleGenAI) {
  let currentPlayerId: string | null = null;
  let currentRoomId: string | null = null;

  ws.on('message', async (messageData: Buffer | string) => {
    try {
      const data = JSON.parse(messageData.toString());
      const { type } = data;

      // 1. CREATE ROOM
      if (type === 'create_room') {
        const { player, settings } = data;
        const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        const roomCode = generateRoomCode();

        const hostPlayer: MultiplayerPlayer = {
          id: player.id || `p_${Date.now()}`,
          name: player.name || 'Player 1',
          avatar: player.avatar || 'trophy',
          coins: typeof player.coins === 'number' ? player.coins : 500,
          bet: typeof settings?.betAmount === 'number' ? settings.betAmount : 50,
          questionWager: 0,
          score: 0,
          streak: 0,
          isReady: true,
          isConnected: true,
          isHost: true,
          hasAnsweredCurrent: false,
          currentAnswerIndex: null,
          lastAnswerCorrect: null,
          lastPointsEarned: 0,
          ws,
        };

        currentPlayerId = hostPlayer.id;
        currentRoomId = roomId;

        const newRoom: MultiplayerRoom = {
          roomId,
          roomCode,
          status: 'lobby',
          hostId: hostPlayer.id,
          players: [hostPlayer],
          potTotal: hostPlayer.bet,
          settings: {
            personality: settings?.personality || {
              name: 'Sunny Sparkle',
              title: 'The Energetic Game Host',
              archetype: 'enthusiastic_encouraging',
              catchphrase: "Let's shine bright and light up the scoreboard!",
              voice: 'Puck',
            },
            category: settings?.category || 'all_mix',
            customTopic: settings?.customTopic,
            difficulty: settings?.difficulty || 'Medium',
            roundCount: settings?.roundCount || 5,
            timePerQuestion: settings?.timePerQuestion || 20,
            betAmount: hostPlayer.bet,
            autoPlayVoice: true,
            enableLiveVoice: false,
          },
          questions: [],
          currentIndex: 0,
          timeRemaining: 20,
          maxTime: 20,
          hostCommentary: `Welcome to the arena! Get ready for high-stakes multiplayer trivia.`,
          hostMood: 'welcoming',
          eliminatedOptions: [],
          chatMessages: [
            {
              id: `msg_init`,
              senderId: 'system',
              senderName: 'Host Announcer',
              text: `Room created! Room Code: ${roomCode}. Invite contenders to join!`,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isSystem: true,
            },
          ],
        };

        activeRooms.set(roomId, newRoom);
        ws.send(JSON.stringify({ type: 'room_joined', roomId, roomCode, playerId: hostPlayer.id }));
        broadcastRoomState(newRoom);

        // Auto-add bot if alone after 5 seconds
        setTimeout(() => {
          const room = activeRooms.get(roomId);
          if (room && room.status === 'lobby' && room.players.length === 1) {
            // Logic to add bot (similar to add_bot case)
            const availableBots = BOT_NAMES.filter(
              (b) => !room.players.some((p) => p.name === b.name)
            );
            const botConfig = availableBots.length > 0 ? availableBots[0] : { name: `Bot_${room.players.length + 1}`, avatar: 'zap' };
            const botPlayer: MultiplayerPlayer = {
              id: `bot_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
              name: botConfig.name,
              avatar: botConfig.avatar,
              coins: 1000,
              bet: room.settings.betAmount,
              questionWager: 0,
              score: 0,
              streak: 0,
              isReady: true,
              isConnected: true,
              isHost: false,
              hasAnsweredCurrent: false,
              currentAnswerIndex: null,
              lastAnswerCorrect: null,
              lastPointsEarned: 0,
              isBot: true,
            };
            room.players.push(botPlayer);
            room.potTotal += botPlayer.bet;
            room.chatMessages.push({
              id: `msg_${Date.now()}`,
              senderId: 'system',
              senderName: 'Host Announcer',
              text: `🤖 ${botPlayer.name} joined automatically as an AI Contender! Pot: ${room.potTotal} coins.`,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isSystem: true,
            });
            broadcastRoomState(room);
          }
        }, 5000);
      }

      // 2. JOIN ROOM (via roomCode or roomId)
      else if (type === 'join_room') {
        const { roomCode, roomId, player } = data;
        let targetRoom: MultiplayerRoom | undefined;

        if (roomId) {
          targetRoom = activeRooms.get(roomId);
        } else if (roomCode) {
          const upper = String(roomCode).toUpperCase().trim();
          targetRoom = Array.from(activeRooms.values()).find(
            (r) => r.roomCode.toUpperCase() === upper && r.status === 'lobby'
          );
          if (!targetRoom) {
            // Also check running rooms
            targetRoom = Array.from(activeRooms.values()).find((r) => r.roomCode.toUpperCase() === upper);
          }
        }

        if (!targetRoom) {
          ws.send(JSON.stringify({ type: 'error', message: 'Room not found or game already finished.' }));
          return;
        }

        if (targetRoom.players.length >= 8) {
          ws.send(JSON.stringify({ type: 'error', message: 'Room is full (max 8 contenders).' }));
          return;
        }

        const newPlayer: MultiplayerPlayer = {
          id: player.id || `p_${Date.now()}`,
          name: player.name || `Contender ${targetRoom.players.length + 1}`,
          avatar: player.avatar || 'zap',
          coins: typeof player.coins === 'number' ? player.coins : 500,
          bet: targetRoom.settings.betAmount,
          questionWager: 0,
          score: 0,
          streak: 0,
          isReady: false,
          isConnected: true,
          isHost: false,
          hasAnsweredCurrent: false,
          currentAnswerIndex: null,
          lastAnswerCorrect: null,
          lastPointsEarned: 0,
          ws,
        };

        currentPlayerId = newPlayer.id;
        currentRoomId = targetRoom.roomId;

        // Check if player reconnected
        const existingIdx = targetRoom.players.findIndex((p) => p.id === newPlayer.id);
        if (existingIdx !== -1) {
          targetRoom.players[existingIdx].ws = ws;
          targetRoom.players[existingIdx].isConnected = true;
        } else {
          targetRoom.players.push(newPlayer);
          targetRoom.potTotal += newPlayer.bet;
          targetRoom.chatMessages.push({
            id: `msg_${Date.now()}`,
            senderId: 'system',
            senderName: 'Host Announcer',
            text: `${newPlayer.name} has entered the room! Wager: ${newPlayer.bet} coins.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isSystem: true,
          });
        }

        ws.send(
          JSON.stringify({
            type: 'room_joined',
            roomId: targetRoom.roomId,
            roomCode: targetRoom.roomCode,
            playerId: newPlayer.id,
          })
        );
        broadcastRoomState(targetRoom);
      }

      // 3. QUICK MATCH (Auto-find or create public lobby)
      else if (type === 'quick_match') {
        const { player } = data;
        // Find an open lobby room with < 4 players
        const openRoom = Array.from(activeRooms.values()).find(
          (r) => r.status === 'lobby' && r.players.length < 4
        );

        if (openRoom) {
          const newPlayer: MultiplayerPlayer = {
            id: player.id || `p_${Date.now()}`,
            name: player.name || `Player ${openRoom.players.length + 1}`,
            avatar: player.avatar || 'sparkles',
            coins: typeof player.coins === 'number' ? player.coins : 500,
            bet: openRoom.settings.betAmount,
            questionWager: 0,
            score: 0,
            streak: 0,
            isReady: false,
            isConnected: true,
            isHost: false,
            hasAnsweredCurrent: false,
            currentAnswerIndex: null,
            lastAnswerCorrect: null,
            lastPointsEarned: 0,
            ws,
          };
          currentPlayerId = newPlayer.id;
          currentRoomId = openRoom.roomId;
          openRoom.players.push(newPlayer);
          openRoom.potTotal += newPlayer.bet;
          openRoom.chatMessages.push({
            id: `msg_${Date.now()}`,
            senderId: 'system',
            senderName: 'Host Announcer',
            text: `${newPlayer.name} joined via Quick Match!`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isSystem: true,
          });
          ws.send(
            JSON.stringify({
              type: 'room_joined',
              roomId: openRoom.roomId,
              roomCode: openRoom.roomCode,
              playerId: newPlayer.id,
            })
          );
          broadcastRoomState(openRoom);
        } else {
          // Create new quick match lobby
          const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
          const roomCode = generateRoomCode();
          const hostPlayer: MultiplayerPlayer = {
            id: player.id || `p_${Date.now()}`,
            name: player.name || 'Player 1',
            avatar: player.avatar || 'trophy',
            coins: typeof player.coins === 'number' ? player.coins : 500,
            bet: 50,
            questionWager: 0,
            score: 0,
            streak: 0,
            isReady: true,
            isConnected: true,
            isHost: true,
            hasAnsweredCurrent: false,
            currentAnswerIndex: null,
            lastAnswerCorrect: null,
            lastPointsEarned: 0,
            ws,
          };
          currentPlayerId = hostPlayer.id;
          currentRoomId = roomId;

          const newRoom: MultiplayerRoom = {
            roomId,
            roomCode,
            status: 'lobby',
            hostId: hostPlayer.id,
            players: [hostPlayer],
            potTotal: hostPlayer.bet,
            settings: {
              personality: {
                name: 'Sunny Sparkle',
                title: 'The Energetic Game Host',
                archetype: 'enthusiastic_encouraging',
                catchphrase: "Let's shine bright and light up the scoreboard!",
                voice: 'Puck',
              },
              category: 'all_mix',
              difficulty: 'Medium',
              roundCount: 5,
              timePerQuestion: 20,
              betAmount: 50,
              autoPlayVoice: true,
              enableLiveVoice: false,
            },
            questions: [],
            currentIndex: 0,
            timeRemaining: 20,
            maxTime: 20,
            hostCommentary: `Quick Match Lobby ready! Waiting for contenders or start with AI bots.`,
            hostMood: 'welcoming',
            eliminatedOptions: [],
            chatMessages: [
              {
                id: `msg_init`,
                senderId: 'system',
                senderName: 'Host Announcer',
                text: `Quick Match Lobby created (${roomCode}). You can add AI contenders or invite friends!`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isSystem: true,
              },
            ],
          };

          activeRooms.set(roomId, newRoom);
          ws.send(JSON.stringify({ type: 'room_joined', roomId, roomCode, playerId: hostPlayer.id }));
          broadcastRoomState(newRoom);
        }
      }

      // 4. ADD BOT CONTENDER
      else if (type === 'add_bot') {
        if (!currentRoomId) return;
        const room = activeRooms.get(currentRoomId);
        if (!room || room.status !== 'lobby') return;

        const availableBots = BOT_NAMES.filter(
          (b) => !room.players.some((p) => p.name === b.name)
        );
        const botConfig = availableBots.length > 0 ? availableBots[0] : { name: `Bot_${room.players.length + 1}`, avatar: 'zap' };

        const botPlayer: MultiplayerPlayer = {
          id: `bot_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          name: botConfig.name,
          avatar: botConfig.avatar,
          coins: 1000,
          bet: room.settings.betAmount,
          questionWager: 0,
          score: 0,
          streak: 0,
          isReady: true,
          isConnected: true,
          isHost: false,
          hasAnsweredCurrent: false,
          currentAnswerIndex: null,
          lastAnswerCorrect: null,
          lastPointsEarned: 0,
          isBot: true,
        };

        room.players.push(botPlayer);
        room.potTotal += botPlayer.bet;
        room.chatMessages.push({
          id: `msg_${Date.now()}`,
          senderId: 'system',
          senderName: 'Host Announcer',
          text: `🤖 ${botPlayer.name} joined as an AI Contender! Pot: ${room.potTotal} coins.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSystem: true,
        });

        broadcastRoomState(room);
      }

      // 5. UPDATE SETTINGS (Host only)
      else if (type === 'update_settings') {
        if (!currentRoomId) return;
        const room = activeRooms.get(currentRoomId);
        if (!room || room.status !== 'lobby') return;
        if (room.hostId !== currentPlayerId) return;

        const { settings } = data;
        if (settings) {
          room.settings = { ...room.settings, ...settings };
          // If bet amount changed, update pot
          if (typeof settings.betAmount === 'number') {
            room.players.forEach((p) => {
              p.bet = settings.betAmount;
            });
            room.potTotal = room.players.length * settings.betAmount;
          }
          broadcastRoomState(room);
        }
      }

      // 6. TOGGLE READY
      else if (type === 'toggle_ready') {
        if (!currentRoomId || !currentPlayerId) return;
        const room = activeRooms.get(currentRoomId);
        if (!room || room.status !== 'lobby') return;

        const player = room.players.find((p) => p.id === currentPlayerId);
        if (player) {
          player.isReady = !player.isReady;
          broadcastRoomState(room);
        }
      }

      // 7. START MATCH (Host only)
      else if (type === 'start_match') {
        if (!currentRoomId || !currentPlayerId) return;
        const room = activeRooms.get(currentRoomId);
        if (!room || room.status !== 'lobby') return;
        if (room.hostId !== currentPlayerId) return;

        room.status = 'countdown';
        room.countdownSeconds = 3;
        room.hostMood = 'dramatic';
        room.hostCommentary = `All contenders in place! The battle begins in 3... 2... 1...!`;
        broadcastRoomState(room);

        // Fetch questions from Gemini
        fetchQuestionsForRoom(room, ai);

        let countdown = 3;
        const countdownTimer = setInterval(() => {
          countdown -= 1;
          room.countdownSeconds = countdown;
          if (countdown <= 0) {
            clearInterval(countdownTimer);
            startQuestionRound(room);
          } else {
            broadcastRoomState(room);
          }
        }, 1000);
      }

      // 8. SUBMIT ANSWER
      else if (type === 'submit_answer') {
        if (!currentRoomId || !currentPlayerId) return;
        const room = activeRooms.get(currentRoomId);
        if (!room || room.status !== 'in_question') return;

        const player = room.players.find((p) => p.id === currentPlayerId);
        if (!player || player.hasAnsweredCurrent) return;

        const { optionIndex } = data;
        const currentQ = room.questions[room.currentIndex];
        if (!currentQ) return;

        const isCorrect = optionIndex === currentQ.correctIndex;
        player.hasAnsweredCurrent = true;
        player.currentAnswerIndex = optionIndex;
        player.lastAnswerCorrect = isCorrect;

        if (isCorrect) {
          player.streak += 1;
          const baseDifficultyPoints =
            room.settings.difficulty === 'Easy' ? 1000 : room.settings.difficulty === 'Hard' ? 3000 : 2000;
          const speedFraction = Math.max(0, room.timeRemaining / room.maxTime);
          const speedBonus = Math.round(speedFraction * 500);
          const streakMultiplier = player.streak >= 3 ? 1.5 : player.streak >= 2 ? 1.25 : 1.0;
          const earned = Math.round((baseDifficultyPoints + speedBonus) * streakMultiplier);
          player.score += earned;
          player.lastPointsEarned = earned;
        } else {
          player.streak = 0;
          player.lastPointsEarned = 0;
        }

        // Check if all connected active players have answered
        const allAnswered = room.players.every((p) => p.hasAnsweredCurrent || !p.isConnected);
        if (allAnswered) {
          finishQuestionRound(room);
        } else {
          broadcastRoomState(room);
        }
      }

      // 9. SEND CHAT MESSAGE / EMOTE
      else if (type === 'send_chat') {
        if (!currentRoomId || !currentPlayerId) return;
        const room = activeRooms.get(currentRoomId);
        if (!room) return;

        const player = room.players.find((p) => p.id === currentPlayerId);
        const { text } = data;
        if (text && typeof text === 'string') {
          room.chatMessages.push({
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            senderId: currentPlayerId,
            senderName: player?.name || 'Contender',
            text: text.trim().slice(0, 120),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          });
          broadcastRoomState(room);
        }
      }

      // 10. LEAVE ROOM
      else if (type === 'leave_room') {
        handlePlayerLeave(currentRoomId, currentPlayerId);
      }
    } catch (err) {
      console.error('Error handling multiplayer message:', err);
    }
  });

  ws.on('close', () => {
    if (currentRoomId && currentPlayerId) {
      handlePlayerLeave(currentRoomId, currentPlayerId);
    }
  });
}

function handlePlayerLeave(roomId: string | null, playerId: string | null) {
  if (!roomId || !playerId) return;
  const room = activeRooms.get(roomId);
  if (!room) return;

  const playerIdx = room.players.findIndex((p) => p.id === playerId);
  if (playerIdx !== -1) {
    const leavingPlayer = room.players[playerIdx];
    if (room.status === 'lobby') {
      room.players.splice(playerIdx, 1);
      room.potTotal = Math.max(0, room.potTotal - leavingPlayer.bet);
    } else {
      leavingPlayer.isConnected = false;
    }

    // Pass host if leaving player was host
    if (leavingPlayer.isHost && room.players.length > 0) {
      const nextHost = room.players.find((p) => p.isConnected && !p.isBot);
      if (nextHost) {
        nextHost.isHost = true;
        room.hostId = nextHost.id;
      }
    }

    room.chatMessages.push({
      id: `msg_${Date.now()}`,
      senderId: 'system',
      senderName: 'Host Announcer',
      text: `${leavingPlayer.name} has left the match.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSystem: true,
    });

    if (room.players.filter((p) => !p.isBot && p.isConnected).length === 0) {
      // Clean up timers
      if (room.timerInterval) clearInterval(room.timerInterval);
      if (room.recapTimeout) clearTimeout(room.recapTimeout);
      activeRooms.delete(roomId);
    } else {
      broadcastRoomState(room);
    }
  }
}

async function fetchQuestionsForRoom(room: MultiplayerRoom, ai: GoogleGenAI) {
  try {
    const { category, customTopic, difficulty, roundCount, personality } = room.settings;
    const count = roundCount || 5;

    const topicDescription =
      category === 'custom' && customTopic
        ? `Custom Topic: "${customTopic}"`
        : category === 'breaking_news'
        ? `Recent 2025-2026 World, Tech & Science Events (Use Google Search grounding)`
        : `Category: ${category}`;

    const hostInstructions = personality
      ? `The AI host is ${personality.name} (${personality.title}). Archetype: ${personality.archetype || 'Custom'}. Catchphrase: "${personality.catchphrase}".`
      : 'The AI host is an engaging game show master.';

    const prompt = `You are the lead question writer for a high-stakes multiplayer trivia match.
${hostInstructions}

TASK:
Generate exactly ${count} unique, captivating, factually accurate multiple-choice trivia questions for multiplayer competition.
Topic: ${topicDescription}
Difficulty: ${difficulty}

You MUST return ONLY a valid JSON array matching this exact JSON structure:
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
    "difficulty": "${difficulty}",
    "hostCommentary": "Host intro strictly in character...",
    "funFact": "Intriguing verified fact..."
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
    let jsonStr = responseText;
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || responseText.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1] || jsonMatch[0];
    }

    const parsedQuestions = JSON.parse(jsonStr);
    room.questions = parsedQuestions.map((q: any, idx: number) => ({
      id: q.id || `q_${Date.now()}_${idx}`,
      question: q.question || 'Multiplayer Question',
      options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ['A', 'B', 'C', 'D'],
      correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
      correctAnswer: q.correctAnswer || (q.options ? q.options[q.correctIndex || 0] : 'A'),
      explanation: q.explanation || 'Verified factual trivia detail.',
      category: q.category || category,
      difficulty: difficulty,
      hostCommentary: q.hostCommentary || 'Eyes on the prize, contenders!',
      funFact: q.funFact || 'Here is an extraordinary fact.',
      groundingSources: [],
    }));
  } catch (err) {
    console.error('Error fetching questions for multiplayer room, using fallback questions:', err);
    room.questions = generateFallbackQuestions(room.settings.difficulty, room.settings.roundCount);
  }
}

function startQuestionRound(room: MultiplayerRoom) {
  if (room.timerInterval) clearInterval(room.timerInterval);
  if (room.recapTimeout) clearTimeout(room.recapTimeout);

  if (room.currentIndex >= room.questions.length) {
    endMatch(room);
    return;
  }

  const currentQ = room.questions[room.currentIndex];
  room.status = 'in_question';
  room.timeRemaining = room.settings.timePerQuestion || 20;
  room.maxTime = room.settings.timePerQuestion || 20;
  room.hostMood = 'thinking';
  room.hostCommentary = currentQ?.hostCommentary || `Round ${room.currentIndex + 1}! Lock in your answers now!`;
  room.eliminatedOptions = [];

  // Reset player per-question flags
  room.players.forEach((p) => {
    p.hasAnsweredCurrent = false;
    p.currentAnswerIndex = null;
    p.lastAnswerCorrect = null;
    p.lastPointsEarned = 0;
  });

  broadcastRoomState(room);

  // Trigger Bot simulated answers with realistic delay
  room.players.forEach((p) => {
    if (p.isBot && p.isConnected) {
      scheduleBotAnswer(room, p, currentQ);
    }
  });

  // Start round timer countdown
  room.timerInterval = setInterval(() => {
    room.timeRemaining -= 1;
    if (room.timeRemaining <= 0) {
      if (room.timerInterval) clearInterval(room.timerInterval);
      finishQuestionRound(room);
    } else {
      broadcastRoomState(room);
    }
  }, 1000);
}

function scheduleBotAnswer(room: MultiplayerRoom, bot: MultiplayerPlayer, question: TriviaQuestion) {
  const minDelay = 3000;
  const maxDelay = Math.min((room.settings.timePerQuestion - 2) * 1000, 14000);
  const randomDelay = Math.floor(minDelay + Math.random() * (maxDelay - minDelay));

  setTimeout(() => {
    if (room.status !== 'in_question' || bot.hasAnsweredCurrent) return;

    // Bot accuracy based on difficulty
    const targetAccuracy = room.settings.difficulty === 'Easy' ? 0.85 : room.settings.difficulty === 'Hard' ? 0.55 : 0.7;
    const choosesCorrect = Math.random() < targetAccuracy;

    let chosenOption = question.correctIndex;
    if (!choosesCorrect) {
      const wrongIndices = [0, 1, 2, 3].filter((i) => i !== question.correctIndex);
      chosenOption = wrongIndices[Math.floor(Math.random() * wrongIndices.length)];
    }

    bot.hasAnsweredCurrent = true;
    bot.currentAnswerIndex = chosenOption;
    bot.lastAnswerCorrect = choosesCorrect;

    if (choosesCorrect) {
      bot.streak += 1;
      const basePoints = room.settings.difficulty === 'Easy' ? 1000 : room.settings.difficulty === 'Hard' ? 3000 : 2000;
      const speedBonus = Math.round((room.timeRemaining / room.maxTime) * 500);
      const mult = bot.streak >= 3 ? 1.5 : bot.streak >= 2 ? 1.25 : 1.0;
      const earned = Math.round((basePoints + speedBonus) * mult);
      bot.score += earned;
      bot.lastPointsEarned = earned;
    } else {
      bot.streak = 0;
      bot.lastPointsEarned = 0;
    }

    const allAnswered = room.players.every((p) => p.hasAnsweredCurrent || !p.isConnected);
    if (allAnswered) {
      finishQuestionRound(room);
    } else {
      broadcastRoomState(room);
    }
  }, randomDelay);
}

function finishQuestionRound(room: MultiplayerRoom) {
  if (room.timerInterval) clearInterval(room.timerInterval);

  room.status = 'round_recap';
  const currentQ = room.questions[room.currentIndex];

  // Count how many got it right
  const correctPlayers = room.players.filter((p) => p.lastAnswerCorrect);
  if (correctPlayers.length === 0) {
    room.hostMood = 'facepalm';
    room.hostCommentary = `Ouch! Zero correct answers! The correct response was "${currentQ?.correctAnswer}".`;
  } else if (correctPlayers.length === room.players.length) {
    room.hostMood = 'praising';
    room.hostCommentary = `Incredible! A clean sweep! Every single contender got "${currentQ?.correctAnswer}" right!`;
  } else {
    room.hostMood = 'excited';
    room.hostCommentary = `Time's up! The correct answer was "${currentQ?.correctAnswer}". ${correctPlayers.length} out of ${room.players.length} contenders scored!`;
  }

  broadcastRoomState(room);

  // 5 second recap delay before next question
  room.recapTimeout = setTimeout(() => {
    room.currentIndex += 1;
    if (room.currentIndex >= room.questions.length) {
      endMatch(room);
    } else {
      startQuestionRound(room);
    }
  }, 5000);
}

function endMatch(room: MultiplayerRoom) {
  if (room.timerInterval) clearInterval(room.timerInterval);
  if (room.recapTimeout) clearTimeout(room.recapTimeout);

  room.status = 'game_over';
  room.hostMood = 'dramatic';

  // Sort players descending by score
  const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];

  if (winner) {
    // 1st place wins the pot (or 75% pot if >=2 players, 2nd gets 25%)
    const winnerPrize = room.players.length >= 3 ? Math.round(room.potTotal * 0.75) : room.potTotal;
    room.winner = {
      player: winner,
      coinPrize: winnerPrize,
    };
    room.hostCommentary = `GRAND FINALE! ${winner.name} claims the championship crown and takes home ${winnerPrize} coins from the pot!`;
  } else {
    room.hostCommentary = `Match finished! Outstanding competition from all contenders!`;
  }

  broadcastRoomState(room);
}

function generateFallbackQuestions(difficulty: 'Easy' | 'Medium' | 'Hard', count: number): TriviaQuestion[] {
  const pool = [
    {
      id: 'fb1',
      question: 'Which planetary body is known as the "Red Planet"?',
      options: ['Venus', 'Mars', 'Jupiter', 'Mercury'],
      correctIndex: 1,
      correctAnswer: 'Mars',
      explanation: 'Mars appears red due to iron oxide (rust) on its surface rocks and dust.',
      category: 'science_nature',
      difficulty: 'Easy' as const,
      hostCommentary: 'Let us start with a cosmic classic!',
      funFact: 'Mars has the largest volcano in the Solar System, Olympus Mons.',
    },
    {
      id: 'fb2',
      question: 'What is the chemical symbol for Gold on the Periodic Table?',
      options: ['Ag', 'Au', 'Fe', 'Gd'],
      correctIndex: 1,
      correctAnswer: 'Au',
      explanation: 'Au comes from the Latin word for gold, "aurum", meaning shining dawn.',
      category: 'science_nature',
      difficulty: 'Easy' as const,
      hostCommentary: 'Pure elemental knowledge on the line!',
      funFact: 'All the gold ever mined worldwide could fit in a cube just 22 meters on each side.',
    },
    {
      id: 'fb3',
      question: 'In what year did the Apollo 11 mission first land humans on the Moon?',
      options: ['1967', '1969', '1971', '1973'],
      correctIndex: 1,
      correctAnswer: '1969',
      explanation: 'Neil Armstrong and Buzz Aldrin landed the Apollo 11 Lunar Module Eagle on July 20, 1969.',
      category: 'world_history',
      difficulty: 'Medium' as const,
      hostCommentary: 'One small step for a contender, one giant leap for the scoreboard!',
      funFact: 'The original Apollo guidance computer had just 4 kilobytes of RAM.',
    },
    {
      id: 'fb4',
      question: 'Which of the following ocean trenches is the deepest known location on Earth?',
      options: ['Java Trench', 'Puerto Rico Trench', 'Mariana Trench', 'Tonga Trench'],
      correctIndex: 2,
      correctAnswer: 'Mariana Trench',
      explanation: 'The Challenger Deep in the Mariana Trench reaches approximately 10,994 meters deep.',
      category: 'geography_wonders',
      difficulty: 'Medium' as const,
      hostCommentary: 'Diving deep into the abyss for this point!',
      funFact: 'Pressure at the bottom of the Mariana Trench exceeds 1,000 times atmospheric pressure at sea level.',
    },
    {
      id: 'fb5',
      question: 'Which ancient wonder was located in Alexandria, Egypt and guided ships for centuries?',
      options: ['Colossus of Rhodes', 'Lighthouse of Alexandria', 'Mausoleum at Halicarnassus', 'Hanging Gardens'],
      correctIndex: 1,
      correctAnswer: 'Lighthouse of Alexandria',
      explanation: 'The Pharos of Alexandria stood over 100 meters tall on the island of Pharos.',
      category: 'world_history',
      difficulty: 'Hard' as const,
      hostCommentary: 'A beacon of ancient engineering!',
      funFact: 'It was built by the Ptolemaic Kingdom around 280 BC and survived for over a millennium.',
    },
    {
      id: 'fb6',
      question: 'What is the SI unit of electric capacitance named after Michael Faraday?',
      options: ['Henry', 'Farad', 'Tesla', 'Siemens'],
      correctIndex: 1,
      correctAnswer: 'Farad',
      explanation: 'The farad (symbol: F) is the SI derived unit of electrical capacitance.',
      category: 'science_nature',
      difficulty: 'Hard' as const,
      hostCommentary: 'High voltage intellectual challenge!',
      funFact: 'A one-farad capacitor is capable of storing one coulomb of electrical charge across one volt.',
    },
  ];

  return pool.slice(0, count);
}
