import React, { useState, useEffect, useRef } from 'react';
import {
  GameState,
  GameSettings,
  HostPersonality,
  HostMood,
  TriviaQuestion,
  GroundingSource,
  ScoreBreakdown,
  MultiplayerRoomState,
} from './types';
import { PRESET_PERSONALITIES } from './data/personalities';
import { Header } from './components/Header';
import { HostStage } from './components/HostStage';
import { TriviaQuestionCard } from './components/TriviaQuestionCard';
import { PersonalitySelector } from './components/PersonalitySelector';
import { GameSetupModal } from './components/GameSetupModal';
import { GameOverSummary } from './components/GameOverSummary';
import { GameView } from './components/GameView';
import { LiveVoiceModal } from './components/LiveVoiceModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { DailyBonusModal } from './components/DailyBonusModal';
import { MultiplayerJoinModal } from './components/MultiplayerJoinModal';
import { MultiplayerArena } from './components/MultiplayerArena';
import { GooglePlayExportModal } from './components/GooglePlayExportModal';
import { playPcmBase64, playSoundFX, stopCurrentAudio } from './utils/audioPlayer';
import {
  getCoinWallet,
  checkCanClaimDailyBonus,
  placeMatchBet,
  claimDailyBonus,
} from './utils/coinManager';
import { Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
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
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(25);
  const [maxTime, setMaxTime] = useState(25);
  const [timeSpentOnCurrent, setTimeSpentOnCurrent] = useState(0);
  const [currentScoreBreakdown, setCurrentScoreBreakdown] = useState<ScoreBreakdown | null>(null);

  // Mode and Coin Wallet state
  const [activeMode, setActiveMode] = useState<'single' | 'multiplayer'>('single');
  const [wallet, setWallet] = useState(getCoinWallet());
  const [canClaimDaily, setCanClaimDaily] = useState(checkCanClaimDailyBonus());

  // Multiplayer State
  const [multiplayerRoomState, setMultiplayerRoomState] = useState<MultiplayerRoomState | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string>(() => {
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

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync Coin Wallet & Auto-prompt daily bonus if eligible on initial visit
  useEffect(() => {
    const w = getCoinWallet();
    setWallet(w);
    const eligible = checkCanClaimDailyBonus();
    setCanClaimDaily(eligible);
    if (eligible) {
      // Prompt daily bonus gift
      const timer = setTimeout(() => {
        setIsDailyBonusOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const refreshWallet = () => {
    setWallet(getCoinWallet());
    setCanClaimDaily(checkCanClaimDailyBonus());
  };

  // -------------------------------------------------------------
  // MULTIPLAYER WEBSOCKET CONNECTION
  // -------------------------------------------------------------
  const connectMultiplayerWs = (onOpenCallback: (ws: WebSocket) => void) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      onOpenCallback(wsRef.current);
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/multiplayer`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Multiplayer WS Connected');
      onOpenCallback(ws);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'room_state') {
          setMultiplayerRoomState(msg.state);
        } else if (msg.type === 'error') {
          alert(`Multiplayer Notice: ${msg.message}`);
        }
      } catch (err) {
        console.error('Error handling WS message:', err);
      }
    };

    ws.onclose = () => {
      console.log('Multiplayer WS closed');
    };

    ws.onerror = (err) => {
      console.error('Multiplayer WS error:', err);
    };
  };

  const sendMultiplayerAction = (action: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(action));
    }
  };

  const handleCreateMultiplayerRoom = (settings: GameSettings, playerName: string) => {
    // Check bet balance
    if (settings.betAmount && settings.betAmount > 0) {
      if (!placeMatchBet(settings.betAmount)) {
        alert('Insufficient coin balance for this wager. Claim your daily bonus or choose a lower bet!');
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
    // Default 50 bet
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
    };

    handleCreateMultiplayerRoom(settings, playerName);
  };

  const handleLeaveMultiplayer = () => {
    sendMultiplayerAction({ type: 'leave_room' });
    setMultiplayerRoomState(null);
    setActiveMode('single');
    refreshWallet();
  };

  // Trigger Host Speech via TTS (gemini-3.1-flash-tts-preview)
  const speakHostLine = async (text: string, voiceName?: string) => {
    if (!text) return;
    try {
      setIsLoadingVoice(true);
      const res = await fetch('/api/host-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice: voiceName || personality.voice,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('TTS API error:', res.status, errorText);
        throw new Error(`TTS API failed: ${res.status}`);
      }

      const data = await res.json();
      setIsLoadingVoice(false);

      if (data.audio) {
        setGameState((prev) => ({ ...prev, isHostSpeaking: true }));
        await playPcmBase64(data.audio, 24000, () => {
          setGameState((prev) => ({ ...prev, isHostSpeaking: false }));
        });
      }
    } catch (err) {
      console.error('Error generating host speech:', err);
      setIsLoadingVoice(false);
      setGameState((prev) => ({ ...prev, isHostSpeaking: false }));
    }
  };

  // Start new match
  const handleStartGame = async (settings: GameSettings) => {
    try {
      // Handle Coin Bet
      if (settings.betAmount && settings.betAmount > 0) {
        if (!placeMatchBet(settings.betAmount)) {
          alert('Insufficient coin balance for this wager. Claim your daily bonus or choose a lower bet!');
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

      // Call Search Grounded Trivia Generation API
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
        const errorText = await res.text();
        console.error('Trivia API error response:', errorText);
        throw new Error(`Failed to generate trivia questions: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      const questions: TriviaQuestion[] = data.questions || [];

      if (questions.length === 0) {
        throw new Error('No questions received from generator');
      }

      const firstQ = questions[0];
      const initialSpeech = firstQ.hostCommentary || `Welcome, contenders! Let us begin our battle of wits with question number one.`;

      setGameState({
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
    } catch (err: any) {
      console.error('Game start error:', err);
      setIsLoadingTrivia(false);
      alert(`Error starting game: ${err.message}. Please check the API.`);
    }
  };

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
  }, [gameState.status, hasAnswered, maxTime]);

  // Handle timeout (auto wrong answer)
  const handleTimeOut = async () => {
    if (hasAnswered) return;
    setHasAnswered(true);
    setSelectedOption(-1);

    playSoundFX('wrong');

    const currentQ = gameState.questions[gameState.currentIndex];
    const isDoubleDown = gameState.lifelines.doubleDownActive;

    const penalty = isDoubleDown ? -500 : 0;
    const nextScore = Math.max(0, gameState.score + penalty);

    const breakdown: ScoreBreakdown = {
      basePoints: 0,
      speedBonus: 0,
      streakMultiplier: 1,
      doubleDownMultiplier: isDoubleDown ? 2 : 1,
      totalEarned: penalty,
    };
    setCurrentScoreBreakdown(breakdown);

    // Dynamic banter for timeout
    let reactionText = `Time has expired! The clock has run out. The correct answer was ${currentQ.correctAnswer}.`;
    try {
      const res = await fetch('/api/host-banter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'time_out',
          personality,
          context: { question: currentQ.question, correctAnswer: currentQ.correctAnswer },
        }),
      });
      const data = await res.json();
      if (data.text) reactionText = data.text;
    } catch {}

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

    if (autoPlayVoice) {
      speakHostLine(reactionText, personality.voice);
    }
  };

  // Select multiple choice answer
  const handleSelectOption = async (optionIndex: number) => {
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

      // Base points based on chosen difficulty
      let basePoints = 1000;
      if (currentQ.difficulty === 'Hard' || currentQ.difficulty === 'Mind-Bender') {
        basePoints = 3000;
      } else if (currentQ.difficulty === 'Medium' || currentQ.difficulty === 'Champion') {
        basePoints = 2000;
      }

      // Speed bonus
      const speedBonus = maxTime > 0 ? Math.round((timeRemaining / maxTime) * 500) : 250;
      // Streak Multiplier: +25% per streak level, capped at 2.5x (6+ streak)
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

    // Call dynamic Host reaction API
    let reactionText = isCorrect
      ? `Splendid! ${currentQ.correctAnswer} is undeniably correct.`
      : `Alas, that is incorrect. The true answer is ${currentQ.correctAnswer}.`;

    try {
      const res = await fetch('/api/host-banter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: isCorrect ? (nextStreak >= 3 ? 'correct_streak' : 'correct_answer') : 'wrong_answer',
          personality,
          context: {
            question: currentQ.question,
            userChoice: currentQ.options[optionIndex],
            correctAnswer: currentQ.correctAnswer,
            streak: nextStreak,
            isDoubleDown,
          },
        }),
      });
      const data = await res.json();
      if (data.text) reactionText = data.text;
    } catch {}

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
  };

  // Next Question or End Game
  const handleNextQuestion = async () => {
    stopCurrentAudio();
    const nextIdx = gameState.currentIndex + 1;

    if (nextIdx >= gameState.questions.length) {
      // Game Over
      playSoundFX('fanfare');
      const correctCount = gameState.answersHistory.filter((a) => a.isCorrect).length;
      const total = gameState.questions.length;

      let finalClosing = `That concludes our match! You scored ${gameState.score.toLocaleString()} points with ${correctCount} of ${total} correct answers.`;
      try {
        const res = await fetch('/api/host-banter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'game_over',
            personality,
            context: {
              finalScore: gameState.score,
              correctCount,
              total,
              highestStreak: gameState.highestStreak,
            },
          }),
        });
        const data = await res.json();
        if (data.text) finalClosing = data.text;
      } catch {}

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

    // Advance to next question
    const nextQ = gameState.questions[nextIdx];
    const introSpeech = nextQ.hostCommentary || `Onward to Question ${nextIdx + 1}!`;

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
  };

  // Lifeline 1: 50/50 Eliminator
  const handleUse5050 = async () => {
    if (gameState.lifelines.fiftyFiftyUsed || hasAnswered) return;
    playSoundFX('lifeline');

    const currentQ = gameState.questions[gameState.currentIndex];
    const wrongIndices = [0, 1, 2, 3].filter((idx) => idx !== currentQ.correctIndex);
    const shuffled = wrongIndices.sort(() => 0.5 - Math.random());
    const toEliminate = shuffled.slice(0, 2);

    let banter = "I have banished two decoy options into the ether. Choose wisely!";
    try {
      const res = await fetch('/api/host-banter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'lifeline_5050',
          personality,
          context: { question: currentQ.question },
        }),
      });
      const data = await res.json();
      if (data.text) banter = data.text;
    } catch {}

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
  };

  // Lifeline 2: Ask Host for a Clue
  const handleUseHint = async () => {
    if (gameState.lifelines.hintUsed || hasAnswered) return;
    playSoundFX('lifeline');
    setIsLoadingLifeline(true);

    const currentQ = gameState.questions[gameState.currentIndex];
    let hintText = `Focus on the historical context and eliminate obvious modern anomalies.`;

    try {
      const res = await fetch('/api/host-banter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'hint_request',
          personality,
          context: { question: currentQ.question, options: currentQ.options, correctAnswer: currentQ.correctAnswer },
        }),
      });
      const data = await res.json();
      if (data.text) hintText = data.text;
    } catch {}

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
  };

  // Lifeline 3: Google Search Grounding Deep-Dive
  const handleUseSearchGrounding = async () => {
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
    }
  };

  // Lifeline 4: Double Down
  const handleToggleDoubleDown = () => {
    if (gameState.lifelines.doubleDownUsed || hasAnswered) return;
    playSoundFX('click');
    setGameState((prev) => ({
      ...prev,
      lifelines: {
        ...prev.lifelines,
        doubleDownActive: !prev.lifelines.doubleDownActive,
      },
    }));
  };

  return (
    <div className="min-h-screen bg-[#0a0518] text-white flex flex-col selection:bg-purple-500 selection:text-white font-sans relative overflow-x-hidden">
      {/* Frosted Glass Ambient Lighting Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-purple-600/25 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[160px]" />
        <div className="absolute top-[30%] right-[10%] w-[35%] h-[35%] bg-pink-600/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-[25%] left-[5%] w-[30%] h-[30%] bg-cyan-600/10 rounded-full blur-[130px]" />
      </div>

      {/* Top Header */}
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
        onRestartGame={() => {
          stopCurrentAudio();
          if (activeMode === 'multiplayer') {
            handleLeaveMultiplayer();
          } else {
            setGameState((prev) => ({ ...prev, status: 'setup' }));
          }
        }}
        liveVoiceConnected={gameState.liveVoiceConnected}
        autoPlayVoice={autoPlayVoice}
        onToggleAutoPlay={() => setAutoPlayVoice(!autoPlayVoice)}
      />

      {/* Main Arena Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 relative z-10">
        {/* MULTIPLAYER ARENA VIEW */}
        {activeMode === 'multiplayer' ? (
          <MultiplayerArena
            roomState={multiplayerRoomState}
            currentPlayerId={myPlayerId}
            onSendAction={sendMultiplayerAction}
            onLeaveRoom={handleLeaveMultiplayer}
            personalities={PRESET_PERSONALITIES}
            onOpenDailyBonus={() => setIsDailyBonusOpen(true)}
          />
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
            onPlayAgain={() => {
              stopCurrentAudio();
              setGameState((prev) => ({ ...prev, status: 'setup' }));
            }}
            onSelectNewHost={() => {
              stopCurrentAudio();
              setIsPersonalityModalOpen(true);
            }}
            onReplaySpeech={() => speakHostLine(gameState.hostSpeechText, personality.voice)}
            onOpenLeaderboard={(highlightId) => {
              setHighlightLeaderboardId(highlightId);
              setIsLeaderboardOpen(true);
            }}
          />
        )}
      </main>

      {/* Host Personality Selection & Custom Host Studio Modal */}
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

      {/* Daily 150 Login Bonus Modal */}
      <DailyBonusModal
        isOpen={isDailyBonusOpen}
        onClose={() => {
          setIsDailyBonusOpen(false);
          refreshWallet();
        }}
        onClaimSuccess={() => refreshWallet()}
      />

      {/* Multiplayer Join & Matchmaking Modal */}
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

      {/* Hall of Fame Leaderboard Modal */}
      {isLeaderboardOpen && (
        <LeaderboardModal
          highlightEntryId={highlightLeaderboardId}
          onClose={() => setIsLeaderboardOpen(false)}
        />
      )}

      {/* Google Play Store Export & Packaging Modal */}
      <GooglePlayExportModal
        isOpen={isGooglePlayExportOpen}
        onClose={() => setIsGooglePlayExportOpen(false)}
      />

      {/* Gemini Live API Real-Time Voice Modal */}
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
    </div>
  );
}
