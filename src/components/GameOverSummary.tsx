import React, { useState, useEffect, useRef } from 'react';
import { GameState, HostPersonality, LeaderboardEntry } from '../types';
import {
  Trophy,
  Sparkles,
  CheckCircle2,
  XCircle,
  Flame,
  RotateCcw,
  Users,
  ExternalLink,
  Volume2,
  Send,
  Award,
  Medal,
  Clock,
  Zap,
  Coins
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { awardSinglePlayerPrize } from '../utils/coinManager';
import { playSoundFX } from '../utils/audioPlayer';

interface GameOverSummaryProps {
  state: GameState;
  personality: HostPersonality;
  onPlayAgain: () => void;
  onReturnHome: () => void;
  onSelectNewHost: () => void;
  onReplayFinalSpeech: () => void;
  onOpenLeaderboard: (highlightId?: string) => void;
  onOpenDailyBonus?: () => void;
}

export const GameOverSummary: React.FC<GameOverSummaryProps> = ({
  state,
  personality,
  onPlayAgain,
  onReturnHome,
  onSelectNewHost,
  onReplayFinalSpeech,
  onOpenLeaderboard,
  onOpenDailyBonus,
}) => {
  const totalQuestions = state.questions.length;
  const correctCount = state.answersHistory.filter((a) => a.isCorrect).length;
  const accuracyPct = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const difficulty = state.questions[0]?.difficulty || 'Medium';
  const category = state.questions[0]?.category || 'all_mix';
  const wager = state.settings.betAmount || 0;

  // Leaderboard submission state
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('trivia_player_name') || '';
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submittedEntry, setSubmittedEntry] = useState<LeaderboardEntry | null>(null);
  const [coinsWon, setCoinsWon] = useState(0);
  const hasSettledRef = useRef(false);

  // Settle Coin Payout
  useEffect(() => {
    if (!hasSettledRef.current) {
      hasSettledRef.current = true;
      const prize = awardSinglePlayerPrize(
        wager,
        accuracyPct,
        difficulty,
        state.highestStreak
      );
      setCoinsWon(prize);
      if (prize > 0) {
        playSoundFX('coin');
      }
    }
  }, [wager, accuracyPct, difficulty, state.highestStreak]);

  // Trigger celebration confetti for solid performance
  useEffect(() => {
    if (accuracyPct >= 50) {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  }, [accuracyPct]);

  // Determine Rank Title
  const getRank = () => {
    if (accuracyPct === 100) return { title: 'Cosmic Grandmaster', badge: 'bg-amber-400 text-slate-950 font-black' };
    if (accuracyPct >= 80) return { title: 'Trivia Virtuoso', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
    if (accuracyPct >= 60) return { title: 'Astute Scholar', badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
    if (accuracyPct >= 40) return { title: 'Curious Contender', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
    return { title: 'Apprentice in Training', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
  };

  const rank = getRank();

  // Total speed bonus accumulated
  const totalSpeedBonus = state.answersHistory.reduce((acc, a) => {
    return acc + (a.scoreBreakdown?.speedBonus || 0);
  }, 0);

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || isSubmitting || hasSubmitted) return;

    try {
      setIsSubmitting(true);
      localStorage.setItem('trivia_player_name', playerName.trim());

      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: playerName.trim(),
          score: state.score,
          accuracyPct,
          difficulty,
          category,
          highestStreak: state.highestStreak,
          hostName: personality.name,
          hostId: personality.id,
          totalQuestions,
          correctQuestions: correctCount,
        }),
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (data.success && data.entry) {
        setHasSubmitted(true);
        setSubmittedEntry(data.entry);
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.5 },
        });
      }
    } catch (err) {
      console.error('Error submitting score to leaderboard:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Hero Victory / Result Card */}
      <div className="w-full bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-center flex flex-col items-center gap-5">
        {/* Background glow */}
        <div className="absolute -top-20 w-80 h-80 bg-purple-500/15 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute -bottom-20 w-80 h-80 bg-pink-500/15 blur-3xl pointer-events-none rounded-full" />

        <div className="w-20 h-20 rounded-3xl bg-purple-500/20 text-purple-300 border border-purple-500/30 backdrop-blur-md flex items-center justify-center shadow-xl">
          <Trophy className="w-10 h-10" />
        </div>

        <div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className={`text-xs px-3 py-1 rounded-full uppercase font-mono font-bold border backdrop-blur-md ${rank.badge}`}>
              {rank.title}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full uppercase font-mono font-bold bg-white/10 text-white/80 border border-white/15">
              {difficulty} Tier
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-sans text-white tracking-tight">
            Match Completed!
          </h2>
        </div>

        {/* Host Final Verdict Dialogue */}
        <div className="w-full max-w-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 flex flex-col gap-2 relative text-left shadow-inner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="font-bold text-xs text-purple-300 font-mono">
                {personality.name}'s Final Verdict:
              </span>
            </div>

            <button
              onClick={onReplayFinalSpeech}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 hover:text-purple-300 border border-white/10 transition-colors backdrop-blur-md"
              title="Hear Host Read Final Verdict"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          <p className="text-white/90 text-sm sm:text-base leading-relaxed italic font-sans">
            "{state.hostSpeechText || personality.catchphrase}"
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 w-full max-w-2xl pt-2">
          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-lg">
            <span className="text-[11px] text-white/50 uppercase tracking-widest font-mono block">Final Score</span>
            <span className="text-2xl font-bold font-mono text-purple-300">{state.score.toLocaleString()}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-lg">
            <span className="text-[11px] text-white/50 uppercase tracking-widest font-mono block">Accuracy</span>
            <span className="text-2xl font-bold font-mono text-emerald-300">{accuracyPct}%</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-lg">
            <span className="text-[11px] text-white/50 uppercase tracking-widest font-mono block">Correct</span>
            <span className="text-2xl font-bold font-mono text-cyan-300">
              {correctCount} / {totalQuestions}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-lg">
            <span className="text-[11px] text-white/50 uppercase tracking-widest font-mono block">Max Streak</span>
            <span className="text-2xl font-bold font-mono text-pink-300 flex items-center justify-center gap-1">
              <Flame className="w-5 h-5 text-pink-400 fill-pink-400" />
              {state.highestStreak}x
            </span>
          </div>
        </div>

        {/* Coin Wager Payout Banner */}
        {wager > 0 && (
          <div className="w-full max-w-2xl p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border border-amber-500/40 backdrop-blur-xl flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Coins className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">
                  Match Bet Settlement ({wager} coins wagered)
                </span>
                <span className="text-xs text-white/90">
                  {coinsWon > wager
                    ? `Great match! You profited +${coinsWon - wager} coins!`
                    : coinsWon > 0
                    ? `Cashback recovered: ${coinsWon} coins`
                    : `No coins recovered. Try again or claim your daily 150 bonus!`}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className={`text-xl font-black font-mono ${coinsWon >= wager ? 'text-amber-300' : 'text-slate-400'}`}>
                +{coinsWon.toLocaleString()} Coins
              </span>
            </div>
          </div>
        )}

        {/* Persistent Leaderboard Submission Form */}
        <div className="w-full max-w-2xl p-5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 border border-purple-500/30 backdrop-blur-xl shadow-lg">
          {!hasSubmitted ? (
            <form onSubmit={handleSubmitScore} className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Trophy className="w-5 h-5 text-amber-300 shrink-0" />
                <span className="text-xs font-bold text-white whitespace-nowrap">
                  Claim Hall of Fame:
                </span>
              </div>
              <input
                type="text"
                required
                maxLength={20}
                placeholder="Enter your player handle..."
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="flex-1 w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/20 text-sm text-white placeholder-white/40 focus:outline-none focus:border-purple-400"
              />
              <button
                type="submit"
                disabled={isSubmitting || !playerName.trim()}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs shadow-md shadow-purple-500/30 flex items-center justify-center gap-2 transition-all shrink-0 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Score</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center shadow-lg">
                  #{submittedEntry?.rank || 1}
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">
                    Score Logged to Global Leaderboard!
                  </span>
                  <span className="text-[11px] text-purple-200/80">
                    {submittedEntry?.playerName} earned rank #{submittedEntry?.rank} with {submittedEntry?.score.toLocaleString()} points.
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenLeaderboard(submittedEntry?.id)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all flex items-center gap-1.5 shrink-0"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-300" />
                <span>View Full Leaderboard</span>
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap justify-center pt-2">
          <button
            id="play-again-btn"
            onClick={onPlayAgain}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-bold text-sm shadow-lg shadow-purple-500/25 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Another Match</span>
          </button>

          <button
            id="return-home-btn"
            onClick={onReturnHome}
            className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold text-sm flex items-center gap-2 backdrop-blur-md transition-colors"
          >
            <span>Close & Return Home</span>
          </button>

          <button
            id="view-leaderboard-btn"
            onClick={() => onOpenLeaderboard()}
            className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold text-sm flex items-center gap-2 backdrop-blur-md transition-colors"
          >
            <Trophy className="w-4 h-4 text-amber-300" />
            <span>Hall of Fame Leaderboard</span>
          </button>

          <button
            id="switch-host-btn"
            onClick={onSelectNewHost}
            className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold text-sm flex items-center gap-2 backdrop-blur-md transition-colors"
          >
            <Users className="w-4 h-4" />
            <span>Switch AI Host</span>
          </button>
        </div>
      </div>

      {/* Question Recap & Search Grounding Citations */}
      <div className="w-full bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
        <h3 className="text-lg font-bold text-white font-sans border-b border-white/10 pb-3 flex items-center justify-between">
          <span>Question-by-Question Recap & Grounded Citations</span>
          <span className="text-xs font-mono text-white/50">{totalQuestions} Questions</span>
        </h3>

        <div className="space-y-4">
          {state.answersHistory.map((ans, idx) => (
            <div
              key={idx}
              className={`p-4 sm:p-5 rounded-2xl border backdrop-blur-lg ${
                ans.isCorrect
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-rose-500/10 border-rose-500/30'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-purple-300">Q{idx + 1}.</span>
                    <span className="font-bold text-sm sm:text-base text-white">
                      {ans.questionText}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs pt-1 flex-wrap font-sans">
                    <span className="text-white/70">
                      Your Answer: <strong className={ans.isCorrect ? 'text-emerald-300' : 'text-rose-300'}>{ans.selectedText}</strong>
                    </span>
                    {!ans.isCorrect && (
                      <span className="text-white/70">
                        Correct Answer: <strong className="text-emerald-300">{ans.correctAnswer}</strong>
                      </span>
                    )}
                    {ans.isCorrect && (
                      <span className="text-purple-300 font-mono font-bold">
                        +{ans.pointsEarned.toLocaleString()} pts
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  {ans.isCorrect ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <XCircle className="w-6 h-6 text-rose-400" />
                  )}
                </div>
              </div>

              {/* Host Reaction & Explanation */}
              <p className="text-xs text-white/80 leading-relaxed font-sans pt-2 border-t border-white/10 mt-2">
                {ans.explanation}
              </p>

              {ans.groundingSources && ans.groundingSources.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap text-[11px] text-white/50 font-mono pt-2">
                  <span>Verified Sources:</span>
                  {ans.groundingSources.map((s, sIdx) => (
                    <a
                      key={sIdx}
                      href={s.uri}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-300 hover:text-white underline flex items-center gap-0.5 font-medium truncate max-w-[200px]"
                    >
                      <ExternalLink className="w-2.5 h-2.5" />
                      {s.title || 'Citation'}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
