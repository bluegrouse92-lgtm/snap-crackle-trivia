import React, { useEffect } from 'react';
import { TriviaQuestion, LifelineState, GroundingSource, ScoreBreakdown } from '../types';
import {
  HelpCircle,
  Sparkles,
  ExternalLink,
  Flame,
  Search,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  Split,
  Award
} from 'lucide-react';

interface TriviaQuestionCardProps {
  question: TriviaQuestion;
  selectedOption: number | null;
  hasAnswered: boolean;
  onSelectOption: (index: number) => void;
  onNextQuestion: () => void;
  lifelines: LifelineState;
  eliminatedOptions: number[];
  onUse5050: () => void;
  onUseHint: () => void;
  onUseSearchGrounding: () => void;
  onToggleDoubleDown: () => void;
  currentHint: string | null;
  searchFact: { fact: string; sources: GroundingSource[] } | null;
  isLoadingLifeline: boolean;
  timeRemaining: number;
  maxTime: number;
  isDoubleDownActive: boolean;
  scoreBreakdown?: ScoreBreakdown | null;
}

export const TriviaQuestionCard: React.FC<TriviaQuestionCardProps> = ({
  question,
  selectedOption,
  hasAnswered,
  onSelectOption,
  onNextQuestion,
  lifelines,
  eliminatedOptions,
  onUse5050,
  onUseHint,
  onUseSearchGrounding,
  onToggleDoubleDown,
  currentHint,
  searchFact,
  isLoadingLifeline,
  timeRemaining,
  maxTime,
  isDoubleDownActive,
  scoreBreakdown,
}) => {
  const optionLabels = ['A', 'B', 'C', 'D'];

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (hasAnswered) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onNextQuestion();
        }
        return;
      }

      const key = e.key.toUpperCase();
      if (['A', '1'].includes(key) && !eliminatedOptions.includes(0)) onSelectOption(0);
      if (['B', '2'].includes(key) && !eliminatedOptions.includes(1)) onSelectOption(1);
      if (['C', '3'].includes(key) && !eliminatedOptions.includes(2)) onSelectOption(2);
      if (['D', '4'].includes(key) && !eliminatedOptions.includes(3)) onSelectOption(3);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasAnswered, onSelectOption, onNextQuestion, eliminatedOptions]);

  const timerPercentage = maxTime > 0 ? (timeRemaining / maxTime) * 100 : 100;
  const isTimerCritical = maxTime > 0 && timeRemaining <= 5;

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'Easy':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'Hard':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'Medium':
      default:
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    }
  };

  return (
    <div id="trivia-question-card" className="w-full bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-7 shadow-2xl relative flex flex-col gap-6">
      {/* Top Meta Bar: Category, Difficulty, Search Grounding Badge, Timer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/10 border border-white/15 text-white/90 backdrop-blur-md">
            {question.category}
          </span>
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full border backdrop-blur-md font-mono ${getDifficultyBadge(question.difficulty)}`}
          >
            {question.difficulty} Tier
          </span>

          {/* Search Grounded Tag */}
          <span className="flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-400/30 backdrop-blur-md">
            <Search className="w-3 h-3 text-blue-300" />
            <span>Search-Grounded</span>
          </span>
        </div>

        {/* Countdown Timer */}
        {maxTime > 0 && (
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1 rounded-full backdrop-blur-md">
            <Clock className={`w-4 h-4 ${isTimerCritical ? 'text-rose-400 animate-spin' : 'text-purple-300'}`} />
            <div className="flex items-center gap-1 font-mono font-bold text-sm">
              <span className={isTimerCritical ? 'text-rose-400 animate-pulse text-base' : 'text-white'}>
                {timeRemaining}s
              </span>
            </div>
            <div className="w-20 sm:w-28 h-2 rounded-full bg-white/10 overflow-hidden ml-1">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  isTimerCritical ? 'bg-rose-500 animate-pulse' : 'bg-gradient-to-r from-purple-500 to-pink-500'
                }`}
                style={{ width: `${timerPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Lifelines Toolbar */}
      {!hasAnswered && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
          <span className="text-[11px] font-bold text-white/60 uppercase tracking-widest px-2">Lifelines:</span>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* 50/50 */}
            <button
              id="lifeline-5050-btn"
              onClick={onUse5050}
              disabled={lifelines.fiftyFiftyUsed || isLoadingLifeline}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border backdrop-blur-md transition-all ${
                lifelines.fiftyFiftyUsed
                  ? 'bg-white/[0.02] text-white/30 border-white/5 cursor-not-allowed line-through'
                  : 'bg-white/10 hover:bg-white/15 text-purple-200 border-white/15 hover:border-purple-400/60 shadow-sm'
              }`}
              title="Eliminate two wrong answers"
            >
              <Split className="w-3.5 h-3.5" />
              <span>50/50</span>
            </button>

            {/* Ask Host for Clue */}
            <button
              id="lifeline-hint-btn"
              onClick={onUseHint}
              disabled={lifelines.hintUsed || isLoadingLifeline}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border backdrop-blur-md transition-all ${
                lifelines.hintUsed
                  ? 'bg-white/[0.02] text-white/30 border-white/5 cursor-not-allowed line-through'
                  : 'bg-white/10 hover:bg-white/15 text-purple-200 border-white/15 hover:border-purple-400/60 shadow-sm'
              }`}
              title="Ask the AI Host for a cryptic hint"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask Host Hint</span>
            </button>

            {/* Google Search Grounding Deep-Dive */}
            <button
              id="lifeline-search-btn"
              onClick={onUseSearchGrounding}
              disabled={lifelines.searchUsed || isLoadingLifeline}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border backdrop-blur-md transition-all ${
                lifelines.searchUsed
                  ? 'bg-white/[0.02] text-white/30 border-white/5 cursor-not-allowed line-through'
                  : 'bg-white/10 hover:bg-white/15 text-cyan-200 border-white/15 hover:border-cyan-400/60 shadow-sm'
              }`}
              title="Use Google Search to pull an up-to-date background fact"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search Fact</span>
            </button>

            {/* Double Down */}
            <button
              id="lifeline-doubledown-btn"
              onClick={onToggleDoubleDown}
              disabled={lifelines.doubleDownUsed}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border backdrop-blur-md transition-all ${
                lifelines.doubleDownUsed
                  ? 'bg-white/[0.02] text-white/30 border-white/5 cursor-not-allowed line-through'
                  : isDoubleDownActive
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold border-pink-400 shadow-md shadow-pink-500/20 animate-pulse'
                  : 'bg-white/10 hover:bg-white/15 text-pink-200 border-white/15 hover:border-pink-400/60'
              }`}
              title="Risk double points on this question"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>{isDoubleDownActive ? '2x Double Active!' : 'Double Down'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Active Hint / Search Clues Banner */}
      {currentHint && (
        <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-xs sm:text-sm text-purple-200 backdrop-blur-md flex items-start gap-2.5 animate-fadeIn shadow-lg">
          <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-purple-300">Host's Secret Clue: </span>
            <span>"{currentHint}"</span>
          </div>
        </div>
      )}

      {searchFact && (
        <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs sm:text-sm text-cyan-200 backdrop-blur-md flex flex-col gap-2 animate-fadeIn shadow-lg">
          <div className="flex items-start gap-2.5">
            <Search className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-cyan-300">Search Grounding Insight: </span>
              <span>{searchFact.fact}</span>
            </div>
          </div>
          {searchFact.sources && searchFact.sources.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap pl-6 pt-1 border-t border-cyan-500/20">
              <span className="text-[10px] text-cyan-300/70 font-mono">Sources:</span>
              {searchFact.sources.map((s, idx) => (
                <a
                  key={idx}
                  href={s.uri}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-cyan-300 hover:text-white underline flex items-center gap-1 font-medium truncate max-w-[200px]"
                >
                  <ExternalLink className="w-2.5 h-2.5" />
                  {s.title || 'Verified Reference'}
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Question Text */}
      <div className="py-2">
        <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-sans text-white tracking-tight leading-snug drop-shadow-lg">
          {question.question}
        </h3>
      </div>

      {/* 4 Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
        {question.options.map((option, idx) => {
          const isEliminated = eliminatedOptions.includes(idx);
          const isSelected = selectedOption === idx;
          const isCorrect = idx === question.correctIndex;

          let buttonStyle = 'bg-white/[0.05] hover:bg-white/10 border-white/10 hover:border-purple-400/50 text-white/90 backdrop-blur-lg';
          let icon = null;

          if (isEliminated) {
            buttonStyle = 'bg-white/[0.02] border-white/5 text-white/20 cursor-not-allowed opacity-30';
          } else if (hasAnswered) {
            if (isCorrect) {
              buttonStyle = 'bg-emerald-500/20 border-emerald-400/80 text-emerald-100 ring-2 ring-emerald-400/40 shadow-lg shadow-emerald-500/20';
              icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
            } else if (isSelected) {
              buttonStyle = 'bg-rose-500/20 border-rose-400/80 text-rose-100 ring-2 ring-rose-400/40 shadow-lg shadow-rose-500/20';
              icon = <XCircle className="w-5 h-5 text-rose-400 shrink-0" />;
            } else {
              buttonStyle = 'bg-white/[0.02] border-white/5 text-white/40 opacity-50';
            }
          } else if (isSelected) {
            buttonStyle = 'bg-purple-500/25 border-purple-400 text-white ring-2 ring-purple-400/40 shadow-lg shadow-purple-500/20';
          }

          return (
            <button
              key={idx}
              id={`trivia-option-${idx}`}
              onClick={() => !isEliminated && !hasAnswered && onSelectOption(idx)}
              disabled={isEliminated || hasAnswered}
              className={`p-4 rounded-2xl border-2 text-left font-sans transition-all flex items-center justify-between gap-3 group relative overflow-hidden ${buttonStyle}`}
            >
              <div className="flex items-center gap-3.5">
                <span
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 font-mono transition-all ${
                    isEliminated
                      ? 'bg-white/5 text-white/20'
                      : hasAnswered && isCorrect
                      ? 'bg-emerald-400 text-slate-950 font-black'
                      : hasAnswered && isSelected
                      ? 'bg-rose-400 text-slate-950 font-black'
                      : 'bg-white/10 text-purple-300 border border-white/10 group-hover:bg-purple-500/30 group-hover:text-white'
                  }`}
                >
                  {optionLabels[idx]}
                </span>
                <span className="text-base sm:text-lg font-medium leading-tight">
                  {option}
                </span>
              </div>
              {icon}
            </button>
          );
        })}
      </div>

      {/* Post-Answer Result Breakdown & Grounding Citations */}
      {hasAnswered && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/10 flex flex-col gap-3 animate-fadeIn shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full border backdrop-blur-md ${
                    selectedOption === question.correctIndex
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}
                >
                  {selectedOption === question.correctIndex ? 'Correct Answer!' : 'Incorrect'}
                </span>
                <span className="text-xs text-white/60 font-mono">
                  Correct Answer: <strong className="text-emerald-300">{question.correctAnswer}</strong>
                </span>
              </div>

              {/* Point breakdown badges */}
              {scoreBreakdown && scoreBreakdown.totalEarned > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px] font-mono">
                  <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Base: +{scoreBreakdown.basePoints}
                  </span>
                  {scoreBreakdown.speedBonus > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Speed: +{scoreBreakdown.speedBonus}
                    </span>
                  )}
                  {scoreBreakdown.streakMultiplier > 1 && (
                    <span className="px-2 py-0.5 rounded-md bg-pink-500/20 text-pink-300 border border-pink-500/30 flex items-center gap-1">
                      <Flame className="w-3 h-3 fill-pink-400" /> Streak: {scoreBreakdown.streakMultiplier}x
                    </span>
                  )}
                  {scoreBreakdown.doubleDownMultiplier > 1 && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                      Double Down: 2x
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 font-bold">
                    Earned: +{scoreBreakdown.totalEarned.toLocaleString()} pts
                  </span>
                </div>
              )}

              <p className="text-sm text-white/90 leading-relaxed font-sans pt-1">
                {question.explanation}
              </p>
            </div>

            {/* Next Question / Final Results Button */}
            <button
              id="next-question-btn"
              onClick={onNextQuestion}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-bold text-sm shadow-lg shadow-purple-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0 flex items-center gap-2 self-start sm:self-auto"
            >
              <span>Next Question</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/20 text-white/80">↵ Space</span>
            </button>
          </div>

          {/* Fun Fact / Search Grounding Sources */}
          {question.funFact && (
            <div className="pt-2 border-t border-white/10 flex items-start gap-2 text-xs text-white/70">
              <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">Did You Know? </strong>
                {question.funFact}
              </span>
            </div>
          )}

          {question.groundingSources && question.groundingSources.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap text-[11px] text-white/50 font-mono pt-1">
              <span>Verified Search Grounding Sources:</span>
              {question.groundingSources.map((s, idx) => (
                <a
                  key={idx}
                  href={s.uri}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-300 hover:text-white underline flex items-center gap-0.5 font-medium truncate max-w-[220px]"
                >
                  <ExternalLink className="w-2.5 h-2.5" />
                  {s.title || 'Source Reference'}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
