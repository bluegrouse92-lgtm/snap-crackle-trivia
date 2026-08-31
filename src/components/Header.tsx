import React from 'react';
import { HostPersonality, DifficultyLevel } from '../types';
import {
  Volume2,
  VolumeX,
  Mic,
  RotateCcw,
  Sparkles,
  Users,
  Flame,
  Trophy,
  Coins,
  Gift,
  Gamepad2,
  Smartphone,
} from 'lucide-react';
import { getAudioMuted, setAudioMuted } from '../utils/audioPlayer';

interface HeaderProps {
  personality: HostPersonality;
  score: number;
  streak: number;
  difficulty?: DifficultyLevel;
  roundCurrent?: number;
  roundTotal?: number;
  isHostSpeaking: boolean;
  coinBalance: number;
  canClaimDaily: boolean;
  onOpenDailyBonus: () => void;
  onOpenMultiplayer: () => void;
  onOpenPersonalitySelector: () => void;
  onOpenLiveVoice: () => void;
  onOpenLeaderboard: () => void;
  onOpenGooglePlayExport?: () => void;
  onRestartGame: () => void;
  liveVoiceConnected: boolean;
  autoPlayVoice: boolean;
  onToggleAutoPlay: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  personality,
  score,
  streak,
  difficulty,
  roundCurrent,
  roundTotal,
  isHostSpeaking,
  coinBalance,
  canClaimDaily,
  onOpenDailyBonus,
  onOpenMultiplayer,
  onOpenPersonalitySelector,
  onOpenLiveVoice,
  onOpenLeaderboard,
  onOpenGooglePlayExport,
  onRestartGame,
  liveVoiceConnected,
  autoPlayVoice,
  onToggleAutoPlay,
}) => {
  const [isMuted, setIsMuted] = React.useState(getAudioMuted());

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    setAudioMuted(nextMuted);
  };

  const getDifficultyBadge = (diff?: DifficultyLevel) => {
    switch (diff) {
      case 'Easy':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'Hard':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'Medium':
      default:
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    }
  };

  return (
    <header className="w-full bg-white/[0.04] backdrop-blur-xl border-b border-white/10 sticky top-0 z-30 px-3 sm:px-4 py-3 shadow-lg shadow-black/20">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
        {/* Left: Brand & Host Profile Badge */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            id="header-personality-btn"
            onClick={onOpenPersonalitySelector}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-white/[0.06] hover:bg-white/10 border border-white/15 hover:border-purple-400/40 backdrop-blur-lg transition-all text-left group shadow-sm"
            title="Change Host Personality"
          >
            <div className={`w-8 h-8 rounded-xl ${personality.avatarBg} flex items-center justify-center font-bold text-sm shadow-inner relative border border-white/20`}>
              <Sparkles className="w-4 h-4" />
              {isHostSpeaking && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                </span>
              )}
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-xs text-white group-hover:text-purple-300 leading-tight">
                  {personality.name}
                </span>
                <span className="text-[10px] text-purple-300/80 bg-purple-500/15 border border-purple-500/25 px-1.5 py-0.5 rounded-full font-mono">
                  {personality.voice}
                </span>
              </div>
              <span className="text-[11px] text-white/60 block leading-tight">
                {personality.title}
              </span>
            </div>
          </button>

          {/* Difficulty Badge */}
          {difficulty && (
            <span className={`hidden md:inline-flex text-[11px] font-mono font-bold px-2.5 py-1 rounded-full border ${getDifficultyBadge(difficulty)}`}>
              {difficulty}
            </span>
          )}

          {/* Round Indicator */}
          {roundCurrent !== undefined && roundTotal !== undefined && (
            <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-md text-xs font-medium text-white/90">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-white/60 uppercase text-[10px] tracking-wider font-mono">Round</span>
              <span className="text-purple-300 font-bold font-mono">{String(roundCurrent).padStart(2, '0')}</span>
              <span className="text-white/40 font-mono">/</span>
              <span className="text-white/60 font-mono">{String(roundTotal).padStart(2, '0')}</span>
            </div>
          )}
        </div>

        {/* Center: Coin Balance, Daily Bonus & Multiplayer Arena Launcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Coin Wallet Button */}
          <button
            id="header-coins-btn"
            onClick={onOpenDailyBonus}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 transition-all backdrop-blur-md shadow-sm group"
            title="Coin Wallet & Daily 150 Login Bonus"
          >
            <Coins className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="font-mono text-xs sm:text-sm font-bold">
              {coinBalance.toLocaleString()}
            </span>
            {canClaimDaily && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            )}
          </button>

          {/* Daily Bonus Button */}
          <button
            id="header-daily-gift-btn"
            onClick={onOpenDailyBonus}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              canClaimDaily
                ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border-amber-500/40 animate-pulse shadow-md shadow-amber-500/10'
                : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
            }`}
            title="Claim 150 Daily Login Coins"
          >
            <Gift className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">150 Free</span>
          </button>

          {/* Multiplayer Launcher Button */}
          <button
            id="header-multiplayer-btn"
            onClick={onOpenMultiplayer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-200 border border-indigo-500/40 hover:border-indigo-400 transition-all backdrop-blur-md shadow-md shadow-indigo-600/10"
            title="Multiplayer Arena - Bet Coins & Play with Friends / Bots"
          >
            <Gamepad2 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">Multiplayer</span>
          </button>

          {/* Single Player Score */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-lg">
            <span className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">Score</span>
            <span className="font-mono text-xs sm:text-sm font-bold text-purple-300">
              {score.toLocaleString()}
            </span>
          </div>

          {streak > 1 && (
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-2xl bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-400/40 backdrop-blur-md animate-pulse">
              <Flame className="w-3.5 h-3.5 text-pink-400 fill-pink-400" />
              <span className="font-mono text-xs font-bold text-pink-200">
                {streak}x
              </span>
            </div>
          )}
        </div>

        {/* Right: Leaderboard, Audio Controls & Live Voice */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Hall of Fame Leaderboard */}
          <button
            id="header-leaderboard-btn"
            onClick={onOpenLeaderboard}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-all backdrop-blur-md shadow-sm"
            title="Global Leaderboard & Hall of Fame"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Leaderboard</span>
          </button>

          {/* Export to Google Play Button */}
          {onOpenGooglePlayExport && (
            <button
              id="header-google-play-btn"
              onClick={onOpenGooglePlayExport}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 transition-all backdrop-blur-md shadow-sm"
              title="Export to Google Play Store (PWA / TWA / APK)"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden lg:inline">Google Play</span>
            </button>
          )}

          {/* Live Voice API Button */}
          <button
            id="header-live-voice-btn"
            onClick={onOpenLiveVoice}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border backdrop-blur-md ${
              liveVoiceConnected
                ? 'bg-rose-500/25 text-rose-200 border-rose-400/60 shadow-lg shadow-rose-500/20 animate-pulse'
                : 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border-purple-500/40 hover:border-purple-400/60'
            }`}
            title="Live Voice Conversation with Host via Gemini Live API"
          >
            <Mic className={`w-3.5 h-3.5 ${liveVoiceConnected ? 'text-rose-400' : 'text-purple-400'}`} />
            <span className="hidden xl:inline">
              {liveVoiceConnected ? 'Live Active' : 'Live Host'}
            </span>
          </button>

          {/* Auto Narrate Toggle */}
          <button
            id="header-tts-toggle-btn"
            onClick={onToggleAutoPlay}
            className={`p-2 rounded-xl text-xs font-medium border backdrop-blur-md transition-all ${
              autoPlayVoice
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-500/10'
                : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10'
            }`}
            title={autoPlayVoice ? 'Auto-Voice Narration ON' : 'Auto-Voice Narration OFF'}
          >
            <span className="text-[10px] font-mono font-bold px-1">TTS</span>
          </button>

          {/* Mute Button */}
          <button
            id="header-mute-btn"
            onClick={handleToggleMute}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 transition-all backdrop-blur-md"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-white/40" /> : <Volume2 className="w-4 h-4 text-white/90" />}
          </button>

          {/* Restart Game */}
          <button
            id="header-restart-btn"
            onClick={onRestartGame}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-purple-300 transition-all backdrop-blur-md"
            title="Restart Match / New Setup"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

