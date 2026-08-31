import React, { useState, useEffect } from 'react';
import { LeaderboardEntry, DifficultyLevel } from '../types';
import {
  Trophy,
  Medal,
  Flame,
  Search,
  Filter,
  RefreshCw,
  X,
  Sparkles,
  Award,
  Crown,
  Calendar
} from 'lucide-react';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  highlightEntryId?: string | null;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  highlightEntryId,
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true);
      const url =
        selectedDifficulty === 'All'
          ? '/api/leaderboard'
          : `/api/leaderboard?difficulty=${selectedDifficulty}`;
      const res = await fetch(url);
      const data = await res.json();
      setEntries(data.entries || []);
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen, selectedDifficulty]);

  if (!isOpen) return null;

  const filteredEntries = entries.filter((e) => {
    if (!searchQuery.trim()) return true;
    return (
      e.playerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.hostName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const topThree = filteredEntries.slice(0, 3);
  const remaining = filteredEntries.slice(3);

  const getDifficultyBadge = (diff: DifficultyLevel) => {
    switch (diff) {
      case 'Easy':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'Medium':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'Hard':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      default:
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-slate-950/85 backdrop-blur-2xl border border-white/15 rounded-3xl p-5 sm:p-8 shadow-2xl relative my-6 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Background ambient lighting */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/15 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-pink-500/10 blur-3xl pointer-events-none rounded-full" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-purple-500/20 text-amber-300 border border-amber-500/30 shadow-lg shadow-amber-500/10 backdrop-blur-md">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold font-sans text-white">
                  Global Hall of Fame
                </h2>
                <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Live Rankings
                </span>
              </div>
              <p className="text-xs text-white/60 mt-0.5">
                Top scores, speed records, and legendary trivia streaks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchLeaderboard}
              title="Refresh Leaderboard"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 hover:text-white border border-white/10 transition-colors backdrop-blur-md"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 hover:text-white border border-white/10 transition-colors backdrop-blur-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 relative z-10">
          {/* Difficulty Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-md">
            {['All', 'Easy', 'Medium', 'Hard'].map((diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedDifficulty === diff
                    ? 'bg-purple-500 text-white shadow-md shadow-purple-500/25'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search player, host, or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-purple-400 backdrop-blur-md"
            />
          </div>
        </div>

        {/* Podium Top 3 (if available) */}
        {!searchQuery && topThree.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 relative z-10">
            {/* 2nd Place */}
            {topThree[1] && (
              <div
                className={`p-3.5 rounded-2xl border backdrop-blur-xl flex flex-col justify-between order-2 sm:order-1 transition-all ${
                  topThree[1].id === highlightEntryId
                    ? 'bg-purple-500/20 border-purple-400 ring-2 ring-purple-400/40'
                    : 'bg-white/[0.04] border-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-full bg-slate-300 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">
                    2
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono font-bold ${getDifficultyBadge(topThree[1].difficulty)}`}>
                    {topThree[1].difficulty}
                  </span>
                </div>
                <div className="my-2">
                  <h4 className="font-bold text-sm text-white truncate">{topThree[1].playerName}</h4>
                  <span className="text-[11px] text-white/60 truncate block">{topThree[1].hostName}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                  <span className="font-mono font-bold text-purple-300">{topThree[1].score.toLocaleString()} pts</span>
                  <span className="text-[11px] text-pink-300 font-mono flex items-center gap-0.5">
                    <Flame className="w-3 h-3 fill-pink-400" /> {topThree[1].highestStreak}x
                  </span>
                </div>
              </div>
            )}

            {/* 1st Place Champion */}
            {topThree[0] && (
              <div
                className={`p-4 rounded-2xl border-2 backdrop-blur-xl flex flex-col justify-between order-1 sm:order-2 shadow-xl transition-all relative overflow-hidden ${
                  topThree[0].id === highlightEntryId
                    ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/40'
                    : 'bg-amber-500/10 border-amber-500/40 shadow-amber-500/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <Crown className="w-4 h-4 text-slate-950 fill-slate-950" />
                  </span>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-mono font-bold ${getDifficultyBadge(topThree[0].difficulty)}`}>
                    {topThree[0].difficulty}
                  </span>
                </div>
                <div className="my-2 text-center">
                  <span className="text-[10px] text-amber-300 uppercase tracking-widest font-mono font-bold">Champion</span>
                  <h3 className="font-black text-base text-white truncate">{topThree[0].playerName}</h3>
                  <span className="text-xs text-amber-200/70 truncate block">{topThree[0].hostName}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                  <span className="font-mono font-bold text-amber-300 text-sm">{topThree[0].score.toLocaleString()} pts</span>
                  <span className="text-xs text-pink-300 font-mono flex items-center gap-0.5 font-bold">
                    <Flame className="w-3.5 h-3.5 fill-pink-400" /> {topThree[0].highestStreak}x
                  </span>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {topThree[2] && (
              <div
                className={`p-3.5 rounded-2xl border backdrop-blur-xl flex flex-col justify-between order-3 sm:order-3 transition-all ${
                  topThree[2].id === highlightEntryId
                    ? 'bg-purple-500/20 border-purple-400 ring-2 ring-purple-400/40'
                    : 'bg-white/[0.04] border-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-full bg-amber-700 text-amber-100 font-black text-xs flex items-center justify-center shadow-md">
                    3
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono font-bold ${getDifficultyBadge(topThree[2].difficulty)}`}>
                    {topThree[2].difficulty}
                  </span>
                </div>
                <div className="my-2">
                  <h4 className="font-bold text-sm text-white truncate">{topThree[2].playerName}</h4>
                  <span className="text-[11px] text-white/60 truncate block">{topThree[2].hostName}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                  <span className="font-mono font-bold text-purple-300">{topThree[2].score.toLocaleString()} pts</span>
                  <span className="text-[11px] text-pink-300 font-mono flex items-center gap-0.5">
                    <Flame className="w-3 h-3 fill-pink-400" /> {topThree[2].highestStreak}x
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Full Table List */}
        <div className="flex-1 overflow-y-auto rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-md relative z-10">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-white/60">
              <span className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono">Fetching latest high scores...</span>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="py-16 text-center text-white/60">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-white/30" />
              <p className="text-sm font-medium">No scores found matching current filters.</p>
              <span className="text-xs text-white/40">Play a match and claim your spot!</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.04] text-[11px] font-mono text-white/60 uppercase tracking-wider sticky top-0 backdrop-blur-lg z-20">
                  <th className="py-2.5 px-4 font-semibold">Rank</th>
                  <th className="py-2.5 px-4 font-semibold">Contender</th>
                  <th className="py-2.5 px-4 font-semibold hidden sm:table-cell">Host & Topic</th>
                  <th className="py-2.5 px-4 font-semibold">Tier</th>
                  <th className="py-2.5 px-4 font-semibold hidden md:table-cell">Accuracy</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {filteredEntries.map((e, idx) => {
                  const isHighlighted = e.id === highlightEntryId;
                  const rankNum = e.rank || idx + 1;
                  return (
                    <tr
                      key={e.id}
                      className={`hover:bg-white/[0.06] transition-colors ${
                        isHighlighted ? 'bg-purple-500/20 font-semibold' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold">
                        {rankNum === 1 ? (
                          <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shadow">
                            1
                          </span>
                        ) : rankNum === 2 ? (
                          <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-950 flex items-center justify-center font-black text-xs shadow">
                            2
                          </span>
                        ) : rankNum === 3 ? (
                          <span className="w-6 h-6 rounded-full bg-amber-700 text-amber-100 flex items-center justify-center font-black text-xs shadow">
                            3
                          </span>
                        ) : (
                          <span className="text-white/60">#{rankNum}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white truncate max-w-[140px] sm:max-w-[180px]">
                            {e.playerName}
                          </span>
                          {isHighlighted && (
                            <span className="text-[10px] bg-purple-500 text-white px-1.5 py-0.2 rounded font-mono">
                              YOU
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-white/50 block sm:hidden">
                          {e.hostName}
                        </span>
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell">
                        <span className="text-white/90 font-medium block truncate max-w-[160px]">
                          {e.hostName}
                        </span>
                        <span className="text-[10px] text-white/50 font-mono capitalize truncate block max-w-[160px]">
                          {e.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono font-bold ${getDifficultyBadge(e.difficulty)}`}>
                          {e.difficulty}
                        </span>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell font-mono">
                        <span className="text-emerald-300 font-semibold">{e.accuracyPct}%</span>
                        <span className="text-white/40 text-[10px] ml-1">
                          ({e.correctQuestions}/{e.totalQuestions})
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-purple-300 text-sm">
                        {e.score.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 mt-3 border-t border-white/10 text-xs text-white/50 font-mono relative z-10">
          <span>Total Contenders: {filteredEntries.length}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 backdrop-blur-md transition-colors font-sans font-semibold"
          >
            Close Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
};
