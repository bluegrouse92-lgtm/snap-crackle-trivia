import React, { useState } from 'react';
import { GameSettings, HostPersonality, DifficultyLevel } from '../types';
import { TRIVIA_CATEGORIES, ARCHETYPE_INFO } from '../data/personalities';
import { CoinWagerSelector } from './CoinWagerSelector';
import { getCoinWallet } from '../utils/coinManager';
import {
  Sparkles,
  Shuffle,
  Globe,
  Atom,
  Gamepad2,
  Scroll,
  Compass,
  Palette,
  Clock,
  Volume2,
  Check,
  ArrowRight,
  Search,
  ShieldAlert,
  Zap,
  BookOpen,
  Coins
} from 'lucide-react';

interface GameSetupModalProps {
  personality: HostPersonality;
  onStartGame: (settings: GameSettings) => void;
  onOpenPersonalitySelector: () => void;
  onOpenDailyBonus?: () => void;
  isLoading: boolean;
}

export const GameSetupModal: React.FC<GameSetupModalProps> = ({
  personality,
  onStartGame,
  onOpenPersonalitySelector,
  onOpenDailyBonus,
  isLoading,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('breaking_news');
  const [customTopic, setCustomTopic] = useState<string>('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Medium');
  const [roundCount, setRoundCount] = useState<number>(5);
  const [timePerQuestion, setTimePerQuestion] = useState<number>(45);
  const [autoPlayVoice, setAutoPlayVoice] = useState<boolean>(true);
  const [isSinglePlayer, setIsSinglePlayer] = useState<boolean>(true);
  const [wager, setWager] = useState<number>(50);
  const [wallet, setWallet] = useState(getCoinWallet());

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Shuffle':
        return <Shuffle className="w-4 h-4 text-amber-400" />;
      case 'Globe':
        return <Globe className="w-4 h-4 text-blue-400" />;
      case 'Atom':
        return <Atom className="w-4 h-4 text-cyan-400" />;
      case 'Gamepad2':
        return <Gamepad2 className="w-4 h-4 text-pink-400" />;
      case 'Scroll':
        return <Scroll className="w-4 h-4 text-amber-500" />;
      case 'Compass':
        return <Compass className="w-4 h-4 text-emerald-400" />;
      case 'Palette':
        return <Palette className="w-4 h-4 text-purple-400" />;
      case 'Sparkles':
      default:
        return <Sparkles className="w-4 h-4 text-purple-300" />;
    }
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    onStartGame({
      personality,
      category: selectedCategory,
      customTopic: selectedCategory === 'custom' ? customTopic.trim() : undefined,
      difficulty,
      roundCount,
      timePerQuestion,
      autoPlayVoice,
      enableLiveVoice: true,
      betAmount: wager,
      isSinglePlayer,
    });
  };

  const difficultyTiers: {
    level: DifficultyLevel;
    title: string;
    description: string;
    basePoints: string;
    badgeColor: string;
    borderActive: string;
    bgActive: string;
  }[] = [
    {
      level: 'Easy',
      title: 'Easy',
      description: 'Common knowledge & recognizable foundational facts. Accessible to everyone.',
      basePoints: '1,000 pts / Q',
      badgeColor: 'text-emerald-300 bg-emerald-500/20 border-emerald-500/30',
      borderActive: 'border-emerald-400 ring-2 ring-emerald-400/30',
      bgActive: 'bg-emerald-500/15',
    },
    {
      level: 'Medium',
      title: 'Medium',
      description: 'Specific domain knowledge, nuanced details, and balanced challenge.',
      basePoints: '2,000 pts / Q',
      badgeColor: 'text-amber-300 bg-amber-500/20 border-amber-500/30',
      borderActive: 'border-amber-400 ring-2 ring-amber-400/30',
      bgActive: 'bg-amber-500/15',
    },
    {
      level: 'Hard',
      title: 'Hard',
      description: 'Challenging trivia for experts, obscure details & deep academic mastery.',
      basePoints: '3,000 pts / Q',
      badgeColor: 'text-rose-300 bg-rose-500/20 border-rose-500/30',
      borderActive: 'border-rose-400 ring-2 ring-rose-400/30',
      bgActive: 'bg-rose-500/15',
    },
  ];

  const archetype = personality.archetype ? ARCHETYPE_INFO[personality.archetype] : null;

  return (
    <div className="w-full max-w-4xl mx-auto bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-9 shadow-2xl relative overflow-hidden max-h-[70vh] overflow-y-auto">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500/10 blur-3xl pointer-events-none rounded-full" />

      <form onSubmit={handleStart} className="space-y-7 relative z-10">
        {/* Host Header Card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md shadow-inner">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-xl ${personality.avatarBg} border border-white/20 flex items-center justify-center font-bold text-lg shadow-inner`}>
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-purple-300 uppercase font-mono font-bold tracking-widest">
                  {archetype ? archetype.label : 'Active Host'}
                </span>
                <span className="text-[10px] bg-white/10 text-white/80 px-2 py-0.5 rounded-full border border-white/15 font-mono">
                  Voice: {personality.voice}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">{personality.name}</h3>
              <p className="text-xs text-purple-200/70 italic">"{personality.catchphrase}"</p>
            </div>
          </div>

          <button
            id="change-personality-btn"
            type="button"
            onClick={onOpenPersonalitySelector}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white border border-white/15 hover:border-purple-400/40 backdrop-blur-md transition-all shadow-sm"
          >
            Change Personality Archetype
          </button>
        </div>

        {/* Weekly Questions Status Banner */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500/15 via-pink-500/15 to-amber-500/15 border border-purple-500/30 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-white">🗓️ Weekly Question Bank Active</span>
            <span className="text-white/60">• 500 Verified Local Questions</span>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
            ⚡ Zero Runtime API • 100% Offline Fast
          </span>
        </div>

        {/* Step 1: Interactive Category Selection Grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-bold text-white font-sans flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-xs font-mono font-black border border-amber-500/40">1</span>
              <span>Choose Your Showdown Category</span>
            </label>
            <span className="text-xs text-white/50 font-mono hidden sm:inline">Tap any category card</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {TRIVIA_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  type="button"
                  key={cat.id}
                  id={`cat-card-${cat.id}`}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2.5 relative group overflow-hidden ${
                    isSelected
                      ? 'bg-gradient-to-b from-purple-500/25 to-pink-500/20 border-purple-400 ring-2 ring-purple-400/40 shadow-lg shadow-purple-500/25'
                      : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08] hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-xl ${isSelected ? 'bg-purple-500/30 text-white' : 'bg-white/10 text-purple-300'}`}>
                      {getCategoryIcon(cat.icon)}
                    </div>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-white group-hover:text-purple-200 transition-colors leading-snug">
                      {cat.name}
                    </h4>
                    <p className="text-[10px] text-white/60 line-clamp-2 mt-1 leading-relaxed hidden sm:block">
                      {cat.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom Search Topic Input & Inspiration Chips */}
          {selectedCategory === 'custom' && (
            <div className="mt-3.5 p-4 sm:p-5 rounded-2xl bg-white/[0.04] border border-cyan-500/40 backdrop-blur-xl animate-fadeIn space-y-3">
              <label className="block text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <Search className="w-4 h-4 text-cyan-400" />
                <span>Specify Any Custom Topic or Obsession:</span>
              </label>
              <input
                type="text"
                id="custom-topic-input"
                placeholder="e.g. 90s Retro Video Games, Quantum Physics, Formula 1 Champions"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/20 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400 font-sans backdrop-blur-md"
              />
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-cyan-300/70 font-mono">Quick Suggestions:</span>
                {['James Webb Space Telescope', 'Classic 90s Gaming', 'Ancient Roman Dynasties', 'Modern AI Inventions'].map((suggestion) => (
                  <button
                    type="button"
                    key={suggestion}
                    onClick={() => setCustomTopic(suggestion)}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-200 transition-all font-sans"
                  >
                    + {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Difficulty Level Selection */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-bold text-white font-sans flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-xs font-mono font-black border border-purple-500/40">2</span>
              <span>Select Difficulty Level</span>
            </label>
            <span className="text-xs text-white/50 font-mono hidden sm:inline">
              Higher tiers yield greater base points
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {difficultyTiers.map((tier) => {
              const isSelected = difficulty === tier.level;
              return (
                <button
                  type="button"
                  key={tier.level}
                  id={`difficulty-${tier.level.toLowerCase()}-btn`}
                  onClick={() => setDifficulty(tier.level)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between gap-3 backdrop-blur-lg relative ${
                    isSelected
                      ? `${tier.bgActive} ${tier.borderActive} shadow-lg`
                      : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08] hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full border font-mono font-bold ${tier.badgeColor}`}>
                      {tier.title}
                    </span>
                    <span className="text-xs font-mono font-bold text-white/90">
                      {tier.basePoints}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-white">
                      {tier.title} Level
                    </h4>
                    <p className="text-xs text-white/70 mt-1 leading-relaxed">
                      {tier.description}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="flex items-center gap-1.5 text-xs text-white font-semibold pt-2 border-t border-white/10">
                      <Check className="w-3.5 h-3.5 text-purple-300" />
                      <span>Selected Tier</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

            {/* 3. Match Coin Wager */}
            <div>
              <CoinWagerSelector
                currentWager={wager}
                onWagerChange={setWager}
                userBalance={wallet.balance}
                onOpenDailyBonus={onOpenDailyBonus}
              />
            </div>

            {/* 4. Match Parameters (Questions & Timer) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Rounds Count */}
              <div>
                <label className="block text-xs font-bold text-white/70 uppercase tracking-widest mb-2 font-mono">
                  Questions per Match
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[5, 8, 10].map((cnt) => (
                    <button
                      type="button"
                      key={cnt}
                      id={`round-count-${cnt}-btn`}
                      onClick={() => setRoundCount(cnt)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-semibold border backdrop-blur-md transition-all ${
                        roundCount === cnt
                          ? 'bg-purple-500 text-white font-bold border-purple-400 shadow-md shadow-purple-500/30'
                          : 'bg-white/[0.04] border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      {cnt} Questions
                    </button>
                  ))}
                </div>
              </div>

              {/* Timer */}
              <div>
                <label className="block text-xs font-bold text-white/70 uppercase tracking-widest mb-2 font-mono">
                  Timer per Question (Speed Bonus)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { val: 15, label: '15s' },
                    { val: 30, label: '30s' },
                    { val: 45, label: '45s' },
                    { val: 0, label: 'Untimed' },
                  ].map((t) => (
                    <button
                      type="button"
                      key={t.val}
                      id={`timer-${t.val}-btn`}
                      onClick={() => setTimePerQuestion(t.val)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-semibold border backdrop-blur-md transition-all ${
                        timePerQuestion === t.val
                          ? 'bg-purple-500 text-white font-bold border-purple-400 shadow-md shadow-purple-500/30'
                          : 'bg-white/[0.04] border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Audio & Narration Toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    <Volume2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-white block">
                      AI Host Voice Narration (TTS)
                    </span>
                    <span className="text-xs text-white/60">
                      Spoken commentary
                    </span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="autoplay-voice-toggle"
                    checked={autoPlayVoice}
                    onChange={(e) => setAutoPlayVoice(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/10 border border-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                </label>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    <Gamepad2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-white block">
                      Single Player Mode
                    </span>
                    <span className="text-xs text-white/60">
                      Play against the AI Host
                    </span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="single-player-toggle"
                    checked={isSinglePlayer}
                    onChange={(e) => setIsSinglePlayer(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/10 border border-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>
            </div>

            {/* Start Game Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || (selectedCategory === 'custom' && !customTopic.trim())}
                id="start-trivia-match-btn"
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white font-black text-lg sm:text-xl shadow-xl shadow-purple-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <span className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Spinning Up {difficulty} Questions...</span>
                  </>
                ) : (
                  <>
                    <span>💥 LAUNCH SNAP CRACKLE POP TRIVIA 🚀</span>
                    <ArrowRight className="w-6 h-6" />
                  </>
                )}
              </button>
            </div>
      </form>
    </div>
  );
};
