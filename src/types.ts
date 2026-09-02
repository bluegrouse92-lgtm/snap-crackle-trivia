export type HostVoiceName = 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr' | 'Aoede';

export type HostMood = 'welcoming' | 'thinking' | 'excited' | 'roasting' | 'dramatic' | 'praising' | 'facepalm';

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export type PersonalityArchetype =
  | 'sarcastic_witty'
  | 'enthusiastic_encouraging'
  | 'formal_educational'
  | 'cyber_logic'
  | 'theatrical_dramatic'
  | 'cosmic_mystic'
  | 'custom';

export interface HostPersonality {
  id: string;
  name: string;
  title: string;
  archetype?: PersonalityArchetype;
  avatarIcon: string; // Lucide icon identifier
  avatarBg: string;
  themeColor: string; // Tailwind color class
  accentGradient: string;
  voice: HostVoiceName;
  catchphrase: string;
  bio: string;
  systemInstruction: string;
  roastIntensity: 'mild' | 'spicy' | 'scorching';
  isCustom?: boolean;
}

export interface GroundingSource {
  title?: string;
  uri?: string;
}

export interface TriviaQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  correctAnswer: string;
  explanation: string;
  category: string;
  difficulty: DifficultyLevel;
  hostCommentary: string; // Spoken intro in character
  funFact: string;
  groundingSources?: GroundingSource[];
}

export interface GameSettings {
  personality: HostPersonality;
  category: string;
  customTopic?: string;
  difficulty: DifficultyLevel;
  roundCount: number;
  timePerQuestion: number; // in seconds, e.g. 20, 30, 0 for untimed
  autoPlayVoice: boolean;
  enableLiveVoice: boolean;
  betAmount: number; // Coins wagered for the match
  isSinglePlayer: boolean;
}

export interface ScoreBreakdown {
  basePoints: number;
  speedBonus: number;
  streakMultiplier: number;
  doubleDownMultiplier: number;
  totalEarned: number;
}

export interface PlayerAnswerRecord {
  questionId: string;
  questionText: string;
  selectedOptionIndex: number;
  selectedText: string;
  correctOptionIndex: number;
  correctAnswer: string;
  isCorrect: boolean;
  timeSpentSeconds: number;
  pointsEarned: number;
  scoreBreakdown?: ScoreBreakdown;
  hostReaction: string;
  explanation: string;
  groundingSources?: GroundingSource[];
}

export interface LifelineState {
  fiftyFiftyUsed: boolean;
  hintUsed: boolean;
  searchUsed: boolean;
  doubleDownActive: boolean;
  doubleDownUsed: boolean;
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  accuracyPct: number;
  difficulty: DifficultyLevel;
  category: string;
  highestStreak: number;
  hostName: string;
  hostId: string;
  totalQuestions: number;
  correctQuestions: number;
  timestamp: string;
  rank?: number;
}

// ----------------- Coin & Wagering System Types ----------------- //

export interface CoinWallet {
  balance: number;
  lastDailyClaimDate: string | null; // ISO YYYY-MM-DD
  dailyStreak: number;
  totalCoinsWon: number;
  totalCoinsBet: number;
}

export interface MatchCoinReward {
  betAmount: number;
  coinsEarned: number;
  netProfit: number;
  reason: string;
  multiplier: number;
}

// ----------------- Multiplayer Room & Player Types ----------------- //

export interface MultiplayerPlayer {
  id: string;
  name: string;
  avatar: string;
  coins: number;
  bet: number;
  questionWager: number; // Current question bet
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
}

export interface RoomChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  time: string;
  isSystem?: boolean;
}

export interface MultiplayerRoomState {
  roomId: string;
  roomCode: string;
  status: 'lobby' | 'countdown' | 'in_question' | 'round_recap' | 'game_over';
  hostId: string;
  players: MultiplayerPlayer[];
  potTotal: number;
  settings: GameSettings;
  questions: TriviaQuestion[];
  currentIndex: number;
  timeRemaining: number;
  maxTime: number;
  hostCommentary: string;
  hostMood: HostMood;
  eliminatedOptions: number[];
  winner?: { player: MultiplayerPlayer; coinPrize: number };
  chatMessages: RoomChatMessage[];
  countdownSeconds?: number;
}

// ----------------- Overall Game State ----------------- //

export interface GameState {
  mode: 'single' | 'multiplayer';
  status: 'idle' | 'setup' | 'loading' | 'playing' | 'question_result' | 'game_over';
  questions: TriviaQuestion[];
  currentIndex: number;
  score: number;
  streak: number;
  highestStreak: number;
  answersHistory: PlayerAnswerRecord[];
  lifelines: LifelineState;
  eliminatedOptions: number[]; // For 50/50
  currentHint: string | null;
  currentSearchFact: { fact: string; sources: GroundingSource[] } | null;
  hostMood: HostMood;
  hostSpeechText: string;
  isHostSpeaking: boolean;
  liveVoiceConnected: boolean;
  currentScoreBreakdown?: ScoreBreakdown | null;
  currentWager: number;
  coinRewardSummary?: MatchCoinReward | null;
}

