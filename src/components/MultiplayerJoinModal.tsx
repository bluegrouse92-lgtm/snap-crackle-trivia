import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Plus,
  ArrowRight,
  Sparkles,
  Zap,
  Coins,
  X,
  Lock,
  Globe,
  Radio,
} from 'lucide-react';
import { HostPersonality, DifficultyLevel, GameSettings } from '../types';
import { CoinWagerSelector } from './CoinWagerSelector';
import { getCoinWallet } from '../utils/coinManager';
import { playSoundFX } from '../utils/audioPlayer';

interface MultiplayerJoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (settings: GameSettings, playerName: string) => void;
  onJoinRoom: (roomCode: string, playerName: string) => void;
  onQuickMatch: (playerName: string) => void;
  personalities: HostPersonality[];
  onOpenDailyBonus?: () => void;
}

export const MultiplayerJoinModal: React.FC<MultiplayerJoinModalProps> = ({
  isOpen,
  onClose,
  onCreateRoom,
  onJoinRoom,
  onQuickMatch,
  personalities,
  onOpenDailyBonus,
}) => {
  const [tab, setTab] = useState<'quick' | 'create' | 'join'>('quick');
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('trivia_player_name') || 'TriviaChampion';
  });
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [wallet, setWallet] = useState(getCoinWallet());

  // Create room settings
  const [selectedPersonality, setSelectedPersonality] = useState<HostPersonality>(
    personalities[0] || {
      id: 'sunny',
      name: 'Sunny Sparkle',
      title: 'The Energetic Game Host',
      archetype: 'enthusiastic_encouraging',
      avatarIcon: 'sparkles',
      avatarBg: 'bg-amber-500/20',
      themeColor: 'text-amber-400',
      accentGradient: 'from-amber-500 to-yellow-400',
      voice: 'Puck',
      catchphrase: "Let's shine bright!",
      bio: 'High-energy host.',
      systemInstruction: 'Enthusiastic trivia host.',
      roastIntensity: 'mild',
    }
  );
  const [category, setCategory] = useState('all_mix');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Medium');
  const [roundCount, setRoundCount] = useState(5);
  const [wager, setWager] = useState(50);
  const [publicRooms, setPublicRooms] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      setWallet(getCoinWallet());
      // Fetch open rooms
      fetch('/api/multiplayer/rooms')
        .then((res) => res.json())
        .then((data) => {
          if (data.rooms) setPublicRooms(data.rooms);
        })
        .catch((err) => console.error('Error fetching rooms:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSavePlayerName = (name: string) => {
    setPlayerName(name);
    localStorage.setItem('trivia_player_name', name);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    handleSavePlayerName(playerName.trim());
    playSoundFX('click');

    const settings: GameSettings = {
      personality: selectedPersonality,
      category,
      difficulty,
      roundCount,
      timePerQuestion: 20,
      betAmount: wager,
      autoPlayVoice: true,
      enableLiveVoice: false,
    };

    onCreateRoom(settings, playerName.trim());
    onClose();
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCodeInput.trim() || !playerName.trim()) return;
    handleSavePlayerName(playerName.trim());
    playSoundFX('click');
    onJoinRoom(roomCodeInput.trim(), playerName.trim());
    onClose();
  };

  const handleQuick = () => {
    if (!playerName.trim()) return;
    handleSavePlayerName(playerName.trim());
    playSoundFX('click');
    onQuickMatch(playerName.trim());
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl text-white max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-100">Live Multiplayer Arena</h2>
                <p className="text-xs text-slate-400">
                  Compete in real-time matches & win the Coin Pot!
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Player Name Banner */}
          <div className="px-6 py-3 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs text-slate-400 font-semibold">Your Handle:</span>
              <input
                type="text"
                value={playerName}
                onChange={(e) => handleSavePlayerName(e.target.value)}
                maxLength={20}
                placeholder="Enter handle"
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-bold"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold">
              <Coins className="w-4 h-4" />
              <span>{wallet.balance.toLocaleString()} coins</span>
            </div>
          </div>

          {/* Mode Navigation Tabs */}
          <div className="flex border-b border-slate-800 px-6 pt-3 gap-2">
            <button
              onClick={() => setTab('quick')}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
                tab === 'quick'
                  ? 'border-indigo-500 text-indigo-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Quick Match</span>
            </button>
            <button
              onClick={() => setTab('create')}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
                tab === 'create'
                  ? 'border-indigo-500 text-indigo-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Custom Room</span>
            </button>
            <button
              onClick={() => setTab('join')}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
                tab === 'join'
                  ? 'border-indigo-500 text-indigo-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Join with Code</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6 overflow-y-auto flex-1 space-y-5">
            {/* TAB 1: QUICK MATCH */}
            {tab === 'quick' && (
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/30 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center">
                    <Radio className="w-6 h-6 animate-pulse" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-100">
                    Instant Matchmaking
                  </h3>
                  <p className="text-xs text-slate-300 max-w-sm mx-auto">
                    Jump into an active open room or automatically match with contenders & AI bots with a standard 50-coin wager!
                  </p>
                  <button
                    onClick={handleQuick}
                    className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 font-bold text-sm text-white shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Find Match Now (50 Coins)</span>
                  </button>
                </div>

                {/* Open Rooms List */}
                {publicRooms.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">
                      Active Open Lobbies ({publicRooms.length})
                    </h4>
                    <div className="space-y-2">
                      {publicRooms.map((r) => (
                        <div
                          key={r.roomId}
                          className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold text-xs text-slate-200">
                              {r.hostName}'s Room ({r.roomCode})
                            </span>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2">
                              <span>{r.playerCount}/8 Players</span>
                              <span>•</span>
                              <span className="text-amber-400 font-medium">
                                Pot: {r.potTotal} coins
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              onJoinRoom(r.roomCode, playerName);
                              onClose();
                            }}
                            className="py-1 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-colors"
                          >
                            Join
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: CREATE CUSTOM ROOM */}
            {tab === 'create' && (
              <form onSubmit={handleCreate} className="space-y-4">
                {/* Wager Selector */}
                <CoinWagerSelector
                  currentWager={wager}
                  onWagerChange={setWager}
                  userBalance={wallet.balance}
                  onOpenDailyBonus={onOpenDailyBonus}
                  isMultiplayer={true}
                />

                {/* Difficulty Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Difficulty</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Easy', 'Medium', 'Hard'] as DifficultyLevel[]).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setDifficulty(lvl)}
                        className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                          difficulty === lvl
                            ? 'bg-indigo-500/20 border-indigo-400 text-indigo-200 ring-1 ring-indigo-400/40'
                            : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category & Rounds */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="all_mix">All-Mix Random</option>
                      <option value="science_nature">Science & Nature</option>
                      <option value="world_history">World History</option>
                      <option value="geography_wonders">Geography & Wonders</option>
                      <option value="pop_culture_gaming">Pop Culture & Gaming</option>
                      <option value="breaking_news">2025-2026 Grounded News</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Rounds</label>
                    <select
                      value={roundCount}
                      onChange={(e) => setRoundCount(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value={3}>3 Questions (Blitz)</option>
                      <option value={5}>5 Questions (Standard)</option>
                      <option value={8}>8 Questions (Showdown)</option>
                      <option value={10}>10 Questions (Grand Championship)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all mt-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Room & Generate Code</span>
                </button>
              </form>
            )}

            {/* TAB 3: JOIN WITH CODE */}
            {tab === 'join' && (
              <form onSubmit={handleJoinByCode} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300">
                    Enter 6-Character Room Code
                  </label>
                  <input
                    type="text"
                    value={roomCodeInput}
                    onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                    placeholder="e.g. TRV-784"
                    maxLength={10}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-lg font-mono text-amber-400 text-center tracking-widest uppercase focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[11px] text-slate-400 text-center">
                    Ask your friend for their room code or check your clipboard.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={!roomCodeInput.trim()}
                  className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Join Match Room</span>
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
