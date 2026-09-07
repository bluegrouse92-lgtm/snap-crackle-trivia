import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import {
  GameState,
  GameSettings,
  HostPersonality,
  HostMood,
  TriviaQuestion,
  ScoreBreakdown,
  MultiplayerRoomState,
} from './types';
import { PRESET_PERSONALITIES } from './data/personalities';
import {
  generateQuestionSpeech,
  generateSmackTalk,
  generateLifelineSmack,
  generateGameOverSmack,
} from './utils/hostBrain';
import { Header } from './components/Header';
import { HostStage } from './components/HostStage';
import { TriviaQuestionCard } from './components/TriviaQuestionCard';
import { PersonalitySelector } from './components/PersonalitySelector';
import { GameSetupModal } from './components/GameSetupModal';
import { GameOverSummary } from './components/GameOverSummary';
import { GameView } from './components/GameView';
import { LeaderboardModal } from './components/LeaderboardModal';
import { DailyBonusModal } from './components/DailyBonusModal';
import { useToast } from './components/Toast';
import { playSoundFX, stopCurrentAudio } from './utils/audioPlayer';
import {
  getCoinWallet,
  checkCanClaimDailyBonus,
  placeMatchBet,
} from './utils/coinManager';

const LiveVoiceModal = lazy(() => import('./components/LiveVoiceModal').then((m) => ({ default: m.LiveVoiceModal })));
const MultiplayerJoinModal = lazy(() => import('./components/MultiplayerJoinModal').then((m) => ({ default: m.MultiplayerJoinModal })));
const MultiplayerArena = lazy(() => import('./components/MultiplayerArena').then((m) => ({ default: m.MultiplayerArena })));
const GooglePlayExportModal = lazy(() => import('./components/GooglePlayExportModal').then((m) => ({ default: m.GooglePlayExportModal })));

export default function App() {
  const { showToast } = useToast();

  const [isAppLoading, setIsAppLoading] = useState(true);
  const [personality, setPersonality] = useState<HostPersonality>(PRESET_PERSONALITIES[0]);
  const [isPersonalityModalOpen, setIsPersonalityModalOpen] = useState(false);
  const [isLiveVoiceModalOpen, setIsLiveVoiceModalOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isDailyBonusOpen, setIsDailyBonusOpen] = useState(false);
  const [isMultiplayerModalOpen, setIsMultiplayerModalOpen] = useState(false);
  const [isGooglePlayExportOpen, setIsGooglePlayExportOpen] = useState(false);
  const [highlightLeaderboardId, setHighlightLeaderboardId] = useState<string | undefined>(undefined);
  const [autoPlayVoice, setAutoPlayVoice] = useState(true);
  const [isLoadingTrivia, setIsLoadingTrivia] = useState(false);
  const [isLoadingVoice, setIsLoadingVoice] = useState(false);
  const [isLoadingLifeline, setIsLoadingLifeline] = useState(false);

  const [activeMode, setActiveMode] = useState<'single' | 'multiplayer'>('single');
  const [wallet, setWallet] = useState(getCoinWallet());
  const [canClaimDaily, setCanClaimDaily] = useState(checkCanClaimDailyBonus());
  const [lastGameSettings, setLastGameSettings] = useState<GameSettings | null>(null);
  const [savedMatchAvailable, setSavedMatchAvailable] = useState(false);

  const [multiplayerRoomState, setMultiplayerRoomState] = useState<MultiplayerRoomState | null>(null);
  const [myPlayerId] = useState<string>(() => {
    let id = localStorage.getItem('trivia_player_id');
    if (!id) {
      id = 'user_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('trivia_player_id', id);
    }
    return id;
  });
  const wsRef = useRef<WebSocket | null>(null);

  const [gameState, setGameState] = useState<GameState>({
    status: 'setup',
    questions: [],
    currentIndex: 0,
    score: 0,
    streak: 0,
    highestStreak: 0,
    answersHistory: [],
    lifelines: {
      fiftyFiftyUsed: false,
      hintUsed: false,
      searchUsed: false,
      doubleDownActive: false,
      doubleDownUsed: false,
    },
    eliminatedOptions: [],
    currentHint: null,
    currentSearchFact: null,
    hostMood: 'welcoming',
    hostSpeechText: PRESET_PERSONALITIES[0].catchphrase,
    isHostSpeaking: false,
    liveVoiceConnected: false,
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(25);
  const [maxTime, setMaxTime] = useState(25);
  const [timeSpentOnCurrent, setTimeSpentOnCurrent] = useState(0);
  const [currentScoreBreakdown, setCurrentScoreBreakdown] = useState<ScoreBreakdown | null>(null);

  // Ref mirror of hasAnswered to avoid stale closure in timer callback
  const hasAnsweredRef = useRef(false);
  useEffect(() => {
    hasAnsweredRef.current = hasAnswered;
  }, [hasAnswered]);

  // Ref mirror of gameState for use inside timer/timeout handlers
  const gameStateRef = useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Ref mirrors for values used inside async callbacks
  const personalityRef = useRef(personality);
  useEffect(() => {
    personalityRef.current = personality;
  }, [personality]);

  const autoPlayVoiceRef = useRef(autoPlayVoice);
  useEffect(() => {
    autoPlayVoiceRef.current = autoPlayVoice;
  }, [autoPlayVoice]);

  useEffect(() => {
    const loadingTimer = setTimeout(() => setIsAppLoading(false), 2000);

    try {
      const saved = localStorage.getItem('snap_crackle_pop_active_game');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.gameState?.status === 'playing' && parsed.gameState.questions?.length > 0) {
          setSavedMatchAvailable(true);
        }
      }
    } catch {
      // ignore malformed saved game
    }

    const w = getCoinWallet();
    setWallet(w);
    const eligible = checkCanClaimDailyBonus();
    setCanClaimDaily(eligible);
    let bonusTimer: ReturnType<typeof setTimeout> | undefined;
    if (eligible) {
      bonusTimer = setTimeout(() => {
        setIsDailyBonusOpen(true);
      }, 1000);
    }

    return () => {
      clearTimeout(loadingTimer);
      if (bonusTimer) clearTimeout(bonusTimer);
    };
  }, []);

  // Auto-save active match to localStorage for crash resilience
  useEffect(() => {
    if (gameState.status === 'playing' && gameState.questions.length > 0) {
      try {
        localStorage.setItem(
          'snap_crackle_pop_active_game',
          JSON.stringify({ gameState, lastGameSettings })
        );
      } catch (err) {
        console.warn('Failed to auto-save game session:', err);
      }
    } else if (gameState.status === 'game_over') {
      localStorage.removeItem('snap_crackle_pop_active_game');
      setSavedMatchAvailable(false);
    }
  }, [gameState, lastGameSettings]);

  const handleResumeSavedMatch = () => {
    try {
      const saved = localStorage.getItem('snap_crackle_pop_active_game');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.gameState) {
          setGameState(parsed.gameState);
          if (parsed.lastGameSettings) {
            setMaxTime(parsed.lastGameSettings.timeLimit || 25);
            setTimeRemaining(parsed.lastGameSettings.timeLimit || 25);
          }
          setSavedMatchAvailable(false);
          setHasAnswered(false);
          setSelectedOption(null);
          playSoundFX('click');
        }
      }
    } catch (err) {
      console.error('Failed to resume saved game:', err);
      localStorage.removeItem('snap_crackle_pop_active_game');
      setSavedMatchAvailable(false);
    }
  };

  const handleDismissSavedMatch = () => {
    localStorage.removeItem('snap_crackle_pop_active_game');
    setSavedMatchAvailable(false);
  };

  const refreshWallet = useCallback(() => {
    setWallet(getCoinWallet());
    setCanClaimDaily(checkCanClaimDailyBonus());
  }, []);

  // -------------------------------------------------------------
  // MULTIPLAYER WEBSOCKET CONNECTION & AUTO-RECONNECT
  // -------------------------------------------------------------
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connectMultiplayerWs = (onOpenCallback?: (ws: WebSocket) => void) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      if (onOpenCallback) onOpenCallback(wsRef.current);
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/multiplayer`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'heartbeat_ping' }));
        }
      }, 20000);

      if (onOpenCallback) onOpenCallback(ws);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'room_state') {
          setMultiplayerRoomState(msg.state);
          if (msg.state?.roomCode) {
            localStorage.setItem('trivia_active_room_code', msg.state.roomCode);
          }
          if (msg.state?.roomId) {
            localStorage.setItem('trivia_active_room_id', msg.state.roomId);
          }
        } else if (msg.type === 'room_joined') {
          if (msg.roomCode) localStorage.setItem('trivia_active_room_code', msg.roomCode);
          if (msg.roomId) localStorage.setItem('trivia_active_room_id', msg.roomId);
        } else if (msg.type === 'heartbeat_pong') {
          // Heartbeat acknowledged
        } else if (msg.type === 'error') {
          showToast(`Multiplayer Notice: ${msg.message}`, 'error');
        }
      } catch (err) {
        console.error('Error handling WS message:', err);
      }
    };

    ws.onclose = () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      const savedCode = localStorage.getItem('trivia_active_room_code');
      const savedId = localStorage.getItem('trivia_active_room_id');
      if (savedCode || savedId) {
        if (!reconnectTimeoutRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectTimeoutRef.current = null;
            connectMultiplayerWs((newWs) => {
              newWs.send(
                JSON.stringify({
                  type: 'reconnect_room',
                  roomId: savedId,
                  roomCode: savedCode,
                  playerId: myPlayerId,
                })
              );
            });
          }, 1500);
        }
      }
    };

    ws.onerror = () => {
      console.error('Multiplayer WS error');
    };
  };

  const sendMultiplayerAction = useCallback((action: unknown) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(action));
    }
  }, []);

  const handleCreateMultiplayerRoom = (settings: GameSettings, playerName: string) => {
    if (settings.betAmount && settings.betAmount > 0) {
      if (!placeMatchBet(settings.betAmount)) {
        showToast('Insufficient coin balance for this wager. Claim your daily bonus or choose a lower bet!', 'error');
        return;
      }
      refreshWallet();
    }

    connectMultiplayerWs((ws) => {
      setActiveMode('multiplayer');
      ws.send(
        JSON.stringify({
          type: 'create_room',
          playerId: myPlayerId,
          playerName,
          settings,
        })
      );
    });
  };

  const handleJoinMultiplayerRoom = (roomCode: string, playerName: string) => {
    connectMultiplayerWs((ws) => {
      setActiveMode('multiplayer');
      ws.send(
        JSON.stringify({
          type: 'join_room',
          playerId: myPlayerId,
          playerName,
          roomCode,
        })
      );
    });
  };

  const handleQuickMatch = (playerName: string) => {
    const bet = 50;
    if (wallet.balance >= bet) {
      placeMatchBet(bet);
      refreshWallet();
    }

    const settings: GameSettings = {
      personality,
      category: 'all_mix',
      difficulty: 'Medium',
      roundCount: 5,
      timePerQuestion: 20,
      betAmount: wallet.balance >= bet ? bet : 0,
      autoPlayVoice: true,
      enableLiveVoice: false,
      isSinglePlayer: false,
    };

    handleCreateMultiplayerRoom(settings, playerName);
  };

  const handleLeaveMultiplayer = useCallback(() => {
    localStorage.removeItem('trivia_active_room_code');
    localStorage.removeItem('trivia_active_room_id');
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    sendMultiplayerAction({ type: 'leave_room' });
    setMultiplayerRoomState(null);
    setActiveMode('single');
    refreshWallet();
  }, [sendMultiplayerAction, refreshWallet]);

  // Fast Local Speech Synthesis Engine
  const speakHostLine = useCallback(async (text: string, voiceName?: string) => {
    if (!text) return;
    setIsLoadingVoice(false);

    if (!('speechSynthesis' in window)) {
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find((v) => v.name.includes(voiceName || personalityRef.current.voice)) || voices[0];
      if (voice) utterance.voice = voice;

      const pid = personalityRef.current.id;
      if (pid === 'sunny') {
        utterance.pitch = 1.25;
        utterance.rate = 1.1;
      } else if (pid === 'roxy') {
        utterance.pitch = 1.05;
        utterance.rate = 1.15;
      } else if (pid === 'sterling') {
        utterance.pitch = 0.9;
        utterance.rate = 0.95;
      } else if (pid === 'unit74') {
        utterance.pitch = 0.75;
        utterance.rate = 1.05;
      } else if (pid === 'sage') {
        utterance.pitch = 0.95;
        utterance.rate = 0.9;
      }

      utterance.onstart = () => {
        setGameState((prev) => ({ ...prev, isHostSpeaking: true }));
        setIsLoadingVoice(false);
      };

      utterance.onend = () => {
        setGameState((prev) => ({ ...prev, isHostSpeaking: false }));
      };

      utterance.onerror = () => {
        setIsLoadingVoice(false);
        setGameState((prev) => ({ ...prev, isHostSpeaking: false }));
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Error in local TTS:', err);
      setIsLoadingVoice(false);
      setGameState((prev) => ({ ...prev, isHostSpeaking: false }));
    }
  }, []);

  // Start new match
  const handleStartGame = useCallback(async (settings: GameSettings) => {
    try {
      if (settings.betAmount && settings.betAmount > 0) {
        if (!placeMatchBet(settings.betAmount)) {
          showToast('Insufficient coin balance for this wager. Claim your daily bonus or choose a lower bet!', 'error');
          return;
        }
        refreshWallet();
      }

      setIsLoadingTrivia(true);
      setPersonality(settings.personality);
      setMaxTime(settings.timePerQuestion);
      setTimeRemaining(settings.timePerQuestion);
      setAutoPlayVoice(settings.autoPlayVoice);
      setCurrentScoreBreakdown(null);

      const res = await fetch('/api/generate-trivia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: settings.category,
          customTopic: settings.customTopic,
          difficulty: settings.difficulty,
          count: settings.roundCount,
          personality: settings.personality,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to generate trivia questions: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      const questions: TriviaQuestion[] = data.questions || [];

      if (questions.length === 0) {
        throw new Error('No questions received from generator');
      }

      const firstQ = questions[0];
      const initialSpeech = generateQuestionSpeech(firstQ, settings.personality, 0, questions.length);

      setLastGameSettings(settings);

      setGameState({
        mode: settings.isSinglePlayer ? 'single' : 'multiplayer',
        status: 'playing',
        questions,
        currentIndex: 0,
        score: 0,
        streak: 0,
        highestStreak: 0,
        answersHistory: [],
        lifelines: {
          fiftyFiftyUsed: false,
          hintUsed: false,
          searchUsed: false,
          doubleDownActive: false,
          doubleDownUsed: false,
        },
        eliminatedOptions: [],
        currentHint: null,
        currentSearchFact: null,
        hostMood: 'welcoming',
        hostSpeechText: initialSpeech,
        isHostSpeaking: false,
        liveVoiceConnected: false,
        currentWager: settings.betAmount,
        settings,
      });

      setSelectedOption(null);
      setHasAnswered(false);
      setTimeSpentOnCurrent(0);
      setIsLoadingTrivia(false);

      playSoundFX('host_intro');
      if (settings.autoPlayVoice) {
        speakHostLine(initialSpeech, settings.personality.voice);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Game start error:', err);
      setIsLoadingTrivia(false);
      showToast(`Error starting game: ${message}. Please check the API.`, 'error');
    }
  }, [refreshWallet, showToast, speakHostLine]);

  // Handle timeout (auto wrong answer) — uses refs to avoid stale closure
  const handleTimeOut = useCallback(() => {
    if (hasAnsweredRef.current) return;
    setHasAnswered(true);
    setSelectedOption(-1);

    playSoundFX('wrong');

    const gs = gameStateRef.current;
    const currentQ = gs.questions[gs.currentIndex];
    const isDoubleDown = gs.lifelines.doubleDownActive;

    const penalty = isDoubleDown ? -500 : 0;
    const nextScore = Math.max(0, gs.score + penalty);

    const breakdown: ScoreBreakdown = {
      basePoints: 0,
      speedBonus: 0,
      streakMultiplier: 1,
      doubleDownMultiplier: isDoubleDown ? 2 : 1,
      totalEarned: penalty,
    };
    setCurrentScoreBreakdown(breakdown);

    const reactionText = generateSmackTalk({
      personality: personalityRef.current,
      isTimeout: true,
      isCorrect: false,
      streak: gs.streak,
      highestStreak: gs.highestStreak,
      wager: gs.currentWager || 0,
      question: currentQ,
    }) + ` The correct answer was ${currentQ.correctAnswer}.`;

    setGameState((prev) => ({
      ...prev,
      score: nextScore,
      streak: 0,
      hostMood: 'roasting',
      hostSpeechText: reactionText,
      answersHistory: [
        ...prev.answersHistory,
        {
          questionId: currentQ.id,
          questionText: currentQ.question,
          selectedOptionIndex: -1,
          selectedText: 'Timed Out',
          correctOptionIndex: currentQ.correctIndex,
          correctAnswer: currentQ.correctAnswer,
          isCorrect: false,
          timeSpentSeconds: maxTime,
          pointsEarned: penalty,
          hostReaction: reactionText,
          explanation: currentQ.explanation,
          groundingSources: currentQ.groundingSources,
          scoreBreakdown: breakdown,
        },
      ],
      lifelines: { ...prev.lifelines, doubleDownActive: false },
    }));

    if (autoPlayVoiceRef.current) {
      speakHostLine(reactionText, personalityRef.current.voice);
    }
  }, [maxTime, speakHostLine]);

  // Timer countdown loop
  useEffect(() => {
    if (gameState.status !== 'playing' || hasAnswered || maxTime === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleTimeOut();
          return 0;
        }
        if (prev <= 6) {
          playSoundFX('tick');
        }
        return prev - 1;
      });
      setTimeSpentOnCurrent((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState.status, hasAnswered, maxTime, handleTimeOut]);

  // Select multiple choice answer
  const handleSelectOption = useCallback(async (optionIndex: number) => {
    if (hasAnswered || gameState.status !== 'playing') return;

    if (timerRef.current) clearInterval(timerRef.current);
    setHasAnswered(true);
    setSelectedOption(optionIndex);

    const currentQ = gameState.questions[gameState.currentIndex];
    const isCorrect = optionIndex === currentQ.correctIndex;
    const isDoubleDown = gameState.lifelines.doubleDownActive;

    let points = 0;
    let nextStreak = 0;
    let nextMood: HostMood = 'welcoming';
    let breakdown: ScoreBreakdown;

    if (isCorrect) {
      playSoundFX('correct');
      nextStreak = gameState.streak + 1;

      let basePoints = 1000;
      if (currentQ.difficulty === 'Hard' || currentQ.difficulty === 'Mind-Bender') {
        basePoints = 3000;
      } else if (currentQ.difficulty === 'Medium' || currentQ.difficulty === 'Champion') {
        basePoints = 2000;
      }

      const speedBonus = maxTime > 0 ? Math.round((timeRemaining / maxTime) * 500) : 250;
      const streakMultiplier = Math.min(2.5, 1 + (nextStreak - 1) * 0.25);
      const doubleDownMultiplier = isDoubleDown ? 2 : 1;

      points = Math.round((basePoints + speedBonus) * streakMultiplier * doubleDownMultiplier);
      nextMood = nextStreak >= 3 ? 'excited' : 'praising';

      breakdown = {
        basePoints,
        speedBonus,
        streakMultiplier: Number(streakMultiplier.toFixed(2)),
        doubleDownMultiplier,
        totalEarned: points,
      };
    } else {
      playSoundFX('wrong');
      nextStreak = 0;
      const penalty = isDoubleDown ? -500 : 0;
      points = penalty;
      nextMood = personality.roastIntensity === 'scorching' ? 'roasting' : 'dramatic';

      breakdown = {
        basePoints: 0,
        speedBonus: 0,
        streakMultiplier: 1,
        doubleDownMultiplier: isDoubleDown ? 2 : 1,
        totalEarned: points,
      };
    }

    setCurrentScoreBreakdown(breakdown);
    const nextScore = Math.max(0, gameState.score + points);
    const nextHighest = Math.max(gameState.highestStreak, nextStreak);

    const reactionText = generateSmackTalk({
      personality,
      isCorrect,
      streak: isCorrect ? nextStreak : gameState.streak,
      highestStreak: nextHighest,
      wager: isDoubleDown ? (gameState.currentWager || 0) * 2 : (gameState.currentWager || 0),
      question: currentQ,
      selectedText: currentQ.options[optionIndex],
      timeSpentSeconds: timeSpentOnCurrent,
    });

    setGameState((prev) => ({
      ...prev,
      score: nextScore,
      streak: nextStreak,
      highestStreak: nextHighest,
      hostMood: nextMood,
      hostSpeechText: reactionText,
      answersHistory: [
        ...prev.answersHistory,
        {
          questionId: currentQ.id,
          questionText: currentQ.question,
          selectedOptionIndex: optionIndex,
          selectedText: currentQ.options[optionIndex],
          correctOptionIndex: currentQ.correctIndex,
          correctAnswer: currentQ.correctAnswer,
          isCorrect,
          timeSpentSeconds: timeSpentOnCurrent,
          pointsEarned: points,
          hostReaction: reactionText,
          explanation: currentQ.explanation,
          groundingSources: currentQ.groundingSources,
          scoreBreakdown: breakdown,
        },
      ],
      lifelines: { ...prev.lifelines, doubleDownActive: false },
    }));

    if (autoPlayVoice) {
      speakHostLine(reactionText, personality.voice);
    }
  }, [gameState, maxTime, timeRemaining, timeSpentOnCurrent, personality, autoPlayVoice, speakHostLine]);

  // Next Question or End Game
  const handleNextQuestion = useCallback(async () => {
    stopCurrentAudio();
    const nextIdx = gameState.currentIndex + 1;

    if (nextIdx >= gameState.questions.length) {
      playSoundFX('fanfare');
      const correctCount = gameState.answersHistory.filter((a) => a.isCorrect).length;
      const total = gameState.questions.length;

      const accuracy = Math.round((correctCount / total) * 100);
      const finalClosing = generateGameOverSmack(personality, accuracy) + ` You scored ${gameState.score.toLocaleString()} points with ${correctCount} of ${total} correct answers!`;

      setGameState((prev) => ({
        ...prev,
        status: 'game_over',
        hostMood: correctCount / total >= 0.7 ? 'praising' : 'roasting',
        hostSpeechText: finalClosing,
      }));

      refreshWallet();

      if (autoPlayVoice) {
        speakHostLine(finalClosing, personality.voice);
      }
      return;
    }

    const nextQ = gameState.questions[nextIdx];
    const introSpeech = generateQuestionSpeech(nextQ, personality, nextIdx, gameState.questions.length);

    setGameState((prev) => ({
      ...prev,
      currentIndex: nextIdx,
      eliminatedOptions: [],
      currentHint: null,
      currentSearchFact: null,
      hostMood: 'welcoming',
      hostSpeechText: introSpeech,
    }));

    setSelectedOption(null);
    setHasAnswered(false);
    setCurrentScoreBreakdown(null);
    setTimeRemaining(maxTime);
    setTimeSpentOnCurrent(0);

    if (autoPlayVoice) {
      speakHostLine(introSpeech, personality.voice);
    }
  }, [gameState, personality, autoPlayVoice, speakHostLine, refreshWallet, maxTime]);

  // Lifeline 1: 50/50 Eliminator
  const handleUse5050 = useCallback(async () => {
    if (gameState.lifelines.fiftyFiftyUsed || hasAnswered) return;
    playSoundFX('lifeline');

    const currentQ = gameState.questions[gameState.currentIndex];
    const wrongIndices = [0, 1, 2, 3].filter((idx) => idx !== currentQ.correctIndex);
    const shuffled = wrongIndices.sort(() => 0.5 - Math.random());
    const toEliminate = shuffled.slice(0, 2);

    const banter = generateLifelineSmack(personality);

    setGameState((prev) => ({
      ...prev,
      eliminatedOptions: toEliminate,
      lifelines: { ...prev.lifelines, fiftyFiftyUsed: true },
      hostSpeechText: banter,
      hostMood: 'dramatic',
    }));

    if (autoPlayVoice) {
      speakHostLine(banter, personality.voice);
    }
  }, [gameState, hasAnswered, personality, autoPlayVoice, speakHostLine]);

  // Lifeline 2: Ask Host for a Clue
  const handleUseHint = useCallback(async () => {
    if (gameState.lifelines.hintUsed || hasAnswered) return;
    playSoundFX('lifeline');
    setIsLoadingLifeline(true);

    const currentQ = gameState.questions[gameState.currentIndex];
    const hintSmack = generateLifelineSmack(personality);
    const hintText = `${hintSmack} Clue: ${currentQ.funFact || currentQ.explanation}`;

    setIsLoadingLifeline(false);
    setGameState((prev) => ({
      ...prev,
      currentHint: hintText,
      lifelines: { ...prev.lifelines, hintUsed: true },
      hostSpeechText: hintText,
      hostMood: 'thinking',
    }));

    if (autoPlayVoice) {
      speakHostLine(hintText, personality.voice);
    }
  }, [gameState, hasAnswered, personality, autoPlayVoice, speakHostLine]);

  // Lifeline 3: Google Search Grounding Deep-Dive
  const handleUseSearchGrounding = useCallback(async () => {
    if (gameState.lifelines.searchUsed || hasAnswered) return;
    playSoundFX('lifeline');
    setIsLoadingLifeline(true);

    const currentQ = gameState.questions[gameState.currentIndex];
    try {
      const res = await fetch('/api/lifeline-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQ.question,
          options: currentQ.options,
          category: currentQ.category,
        }),
      });
      const data = await res.json();
      setIsLoadingLifeline(false);

      setGameState((prev) => ({
        ...prev,
        currentSearchFact: { fact: data.fact, sources: data.sources || [] },
        lifelines: { ...prev.lifelines, searchUsed: true },
        hostSpeechText: `Google Search Grounding has retrieved live verified intel for you!`,
        hostMood: 'excited',
      }));

      if (autoPlayVoice) {
        speakHostLine(`Search Grounding retrieved verified intel! ${data.fact}`, personality.voice);
      }
    } catch (err) {
      console.error('Search lifeline failed:', err);
      setIsLoadingLifeline(false);
      showToast('Search lifeline failed. Please try again.', 'error');
    }
  }, [gameState, hasAnswered, autoPlayVoice, speakHostLine, personality, showToast]);

  // Lifeline 4: Double Down
  const handleToggleDoubleDown = useCallback(() => {
    if (gameState.lifelines.doubleDownUsed || hasAnswered) return;
    playSoundFX('click');
    setGameState((prev) => ({
      ...prev,
      lifelines: {
        ...prev.lifelines,
        doubleDownActive: !prev.lifelines.doubleDownActive,
      },
    }));
  }, [gameState.lifelines.doubleDownUsed, hasAnswered]);

  const onPlayAgain = useCallback(() => {
    stopCurrentAudio();
    refreshWallet();
    if (lastGameSettings) {
      handleStartGame(lastGameSettings);
    } else {
      setGameState((prev) => ({ ...prev, status: 'setup' }));
    }
  }, [refreshWallet, lastGameSettings, handleStartGame]);

  const onReturnHome = useCallback(() => {
    stopCurrentAudio();
    localStorage.removeItem('snap_crackle_pop_active_game');
    setSavedMatchAvailable(false);
    refreshWallet();
    setSelectedOption(null);
    setHasAnswered(false);
    setCurrentScoreBreakdown(null);
    setGameState((prev) => ({
      ...prev,
      status: 'setup',
      currentIndex: 0,
      score: 0,
      streak: 0,
      highestStreak: 0,
      answersHistory: [],
      eliminatedOptions: [],
      currentHint: null,
      currentSearchFact: null,
      lifelines: {
        fiftyFiftyUsed: false,
        hintUsed: false,
        searchUsed: false,
        doubleDownActive: false,
        doubleDownUsed: false,
      },
    }));
  }, [refreshWallet]);

  const onSelectNewHost = useCallback(() => {
    stopCurrentAudio();
    setIsPersonalityModalOpen(true);
  }, []);

  const onReplaySpeech = useCallback(() => {
    speakHostLine(gameState.hostSpeechText, personality.voice);
  }, [speakHostLine, gameState.hostSpeechText, personality.voice]);

  const onOpenLeaderboard = useCallback((highlightId?: string) => {
    setHighlightLeaderboardId(highlightId);
    setIsLeaderboardOpen(true);
  }, []);

  const onRestartGame = useCallback(() => {
    stopCurrentAudio();
    localStorage.removeItem('snap_crackle_pop_active_game');
    setSavedMatchAvailable(false);
    if (activeMode === 'multiplayer') {
      handleLeaveMultiplayer();
    } else {
      setGameState((prev) => ({ ...prev, status: 'setup' }));
    }
  }, [activeMode, handleLeaveMultiplayer]);

  const onToggleAutoPlay = useCallback(() => setAutoPlayVoice((v) => !v), []);

  return (
    <>
      {isAppLoading ? (
        <div className="fixed inset-0 bg-[#0a0518] flex flex-col items-center justify-center gap-4 z-50">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <h1 className="text-xl font-bold text-indigo-200">Loading Trivia Arena...</h1>
        </div>
      ) : (
        <div className="min-h-screen bg-[#0a0518] text-white flex flex-col selection:bg-purple-500 selection:text-white font-sans relative overflow-x-hidden">
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-purple-600/25 rounded-full blur-[140px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[160px]" />
          <div className="absolute top-[30%] right-[10%] w-[35%] h-[35%] bg-pink-600/15 rounded-full blur-[120px]" />
          <div className="absolute bottom-[25%] left-[5%] w-[30%] h-[30%] bg-cyan-600/10 rounded-full blur-[130px]" />
        </div>

        <Header
          personality={personality}
          score={gameState.score}
          streak={gameState.streak}
          difficulty={gameState.questions[0]?.difficulty}
          roundCurrent={gameState.status === 'playing' ? gameState.currentIndex + 1 : undefined}
          roundTotal={gameState.status === 'playing' ? gameState.questions.length : undefined}
          isHostSpeaking={gameState.isHostSpeaking}
          coinBalance={wallet.balance}
          canClaimDaily={canClaimDaily}
          onOpenDailyBonus={() => setIsDailyBonusOpen(true)}
          onOpenMultiplayer={() => setIsMultiplayerModalOpen(true)}
          onOpenPersonalitySelector={() => setIsPersonalityModalOpen(true)}
          onOpenLiveVoice={() => setIsLiveVoiceModalOpen(true)}
          onOpenLeaderboard={() => {
            setHighlightLeaderboardId(undefined);
            setIsLeaderboardOpen(true);
          }}
          onOpenGooglePlayExport={() => setIsGooglePlayExportOpen(true)}
          onRestartGame={onRestartGame}
          liveVoiceConnected={gameState.liveVoiceConnected}
          autoPlayVoice={autoPlayVoice}
          onToggleAutoPlay={onToggleAutoPlay}
        />

        <main className="min-h-[calc(100vh-80px)] sm:h-[calc(100vh-100px)] overflow-y-auto max-w-lg sm:max-w-3xl lg:max-w-5xl w-full mx-auto p-2 sm:p-4 lg:p-8 flex flex-col gap-4 sm:gap-6 relative z-10">
          {savedMatchAvailable && gameState.status === 'setup' && (
            <div className="bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-purple-900/90 border border-purple-400/50 rounded-2xl p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-md animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-xl shrink-0">
                  ⚡
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                    Unfinished Match Detected!
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">Auto-Saved</span>
                  </h3>
                  <p className="text-xs text-purple-200/80">You have an in-progress round saved from your last session. Would you like to resume?</p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={handleResumeSavedMatch}
                  className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-black font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition transform active:scale-95 cursor-pointer"
                >
                  Resume Match
                </button>
                <button
                  onClick={handleDismissSavedMatch}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-xs rounded-xl transition cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {activeMode === 'multiplayer' ? (
            <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>}>
              <MultiplayerArena
                roomState={multiplayerRoomState}
                currentPlayerId={myPlayerId}
                onSendAction={sendMultiplayerAction}
                onLeaveRoom={handleLeaveMultiplayer}
                personalities={PRESET_PERSONALITIES}
                onOpenDailyBonus={() => setIsDailyBonusOpen(true)}
              />
            </Suspense>
          ) : (
            <GameView
              gameState={gameState}
              personality={personality}
              onStartGame={handleStartGame}
              onOpenPersonalitySelector={() => setIsPersonalityModalOpen(true)}
              onOpenDailyBonus={() => setIsDailyBonusOpen(true)}
              isLoadingTrivia={isLoadingTrivia}
              selectedOption={selectedOption}
              hasAnswered={hasAnswered}
              onSelectOption={handleSelectOption}
              onNextQuestion={handleNextQuestion}
              onUse5050={handleUse5050}
              onUseHint={handleUseHint}
              onUseSearchGrounding={handleUseSearchGrounding}
              onToggleDoubleDown={handleToggleDoubleDown}
              isLoadingLifeline={isLoadingLifeline}
              timeRemaining={timeRemaining}
              maxTime={maxTime}
              scoreBreakdown={currentScoreBreakdown}
              onPlayAgain={onPlayAgain}
              onReturnHome={onReturnHome}
              onSelectNewHost={onSelectNewHost}
              onReplaySpeech={onReplaySpeech}
              onOpenLiveVoice={() => setIsLiveVoiceModalOpen(true)}
              onOpenLeaderboard={onOpenLeaderboard}
            />
          )}
        </main>

        {isPersonalityModalOpen && (
          <PersonalitySelector
            currentPersonality={personality}
            onSelectPersonality={(newPersonality) => {
              setPersonality(newPersonality);
              setGameState((prev) => ({
                ...prev,
                hostSpeechText: newPersonality.catchphrase,
                hostMood: 'welcoming',
              }));
              playSoundFX('host_intro');
              if (autoPlayVoice) {
                speakHostLine(newPersonality.catchphrase, newPersonality.voice);
              }
            }}
            onClose={() => setIsPersonalityModalOpen(false)}
          />
        )}

        <DailyBonusModal
          isOpen={isDailyBonusOpen}
          onClose={() => {
            setIsDailyBonusOpen(false);
            refreshWallet();
          }}
          onCoinsClaimed={() => refreshWallet()}
        />

        {isMultiplayerModalOpen && (
          <Suspense fallback={null}>
            <MultiplayerJoinModal
              isOpen={isMultiplayerModalOpen}
              onClose={() => setIsMultiplayerModalOpen(false)}
              onCreateRoom={handleCreateMultiplayerRoom}
              onJoinRoom={handleJoinMultiplayerRoom}
              onQuickMatch={handleQuickMatch}
              personalities={PRESET_PERSONALITIES}
              onOpenDailyBonus={() => {
                setIsMultiplayerModalOpen(false);
                setIsDailyBonusOpen(true);
              }}
            />
          </Suspense>
        )}

        {isLeaderboardOpen && (
          <LeaderboardModal
            highlightEntryId={highlightLeaderboardId}
            onClose={() => setIsLeaderboardOpen(false)}
          />
        )}

        {isGooglePlayExportOpen && (
          <Suspense fallback={null}>
            <GooglePlayExportModal
              isOpen={isGooglePlayExportOpen}
              onClose={() => setIsGooglePlayExportOpen(false)}
            />
          </Suspense>
        )}

        {isLiveVoiceModalOpen && (
          <Suspense fallback={null}>
            <LiveVoiceModal
              personality={personality}
              currentQuestion={
                gameState.status === 'playing' && gameState.questions[gameState.currentIndex]
                  ? gameState.questions[gameState.currentIndex]
                  : undefined
              }
              isOpen={isLiveVoiceModalOpen}
              onClose={() => setIsLiveVoiceModalOpen(false)}
            />
          </Suspense>
        )}
      </div>
      )}
    </>
  );
}
