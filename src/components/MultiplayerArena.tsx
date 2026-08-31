import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Trophy,
  Coins,
  Copy,
  Check,
  Bot,
  Play,
  Flame,
  Send,
  MessageSquare,
  Sparkles,
  Zap,
  ArrowRight,
  LogOut,
  Clock,
  ShieldAlert,
  Crown,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  MultiplayerRoomState,
  MultiplayerPlayer,
  RoomChatMessage,
  HostPersonality,
  DifficultyLevel,
} from '../types';
import { playSoundFX } from '../utils/audioPlayer';
import { awardMultiplayerPrize, placeMatchBet } from '../utils/coinManager';

interface MultiplayerArenaProps {
  roomState: MultiplayerRoomState | null;
  currentPlayerId: string;
  onSendAction: (action: any) => void;
  onLeaveRoom: () => void;
  personalities: HostPersonality[];
  onOpenDailyBonus?: () => void;
}

const QUICK_EMOTES = ['🧠 Big Brain', '🔥 On Fire!', '⚡ Super Fast!', '💀 Oof', '🎉 GG!', '👑 Crown Me'];

export const MultiplayerArena: React.FC<MultiplayerArenaProps> = ({
  roomState,
  currentPlayerId,
  onSendAction,
  onLeaveRoom,
  personalities,
  onOpenDailyBonus,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const hasSettledPrizeRef = useRef<boolean>(false);

  const me = roomState?.players.find((p) => p.id === currentPlayerId);
  const isHost = me?.isHost || false;

  // Scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roomState?.chatMessages]);

  // Reset selected option when question index changes
  useEffect(() => {
    setSelectedOption(null);
  }, [roomState?.currentIndex, roomState?.status]);

  // Sound effects on question start & game over
  useEffect(() => {
    if (roomState?.status === 'in_question') {
      playSoundFX('click');
    } else if (roomState?.status === 'round_recap') {
      playSoundFX(me?.lastAnswerCorrect ? 'correct' : 'wrong');
    } else if (roomState?.status === 'game_over' && !hasSettledPrizeRef.current) {
      hasSettledPrizeRef.current = true;
      playSoundFX('fanfare');
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.5 },
        colors: ['#FBBF24', '#6366F1', '#EC4899', '#10B981'],
      });

      // Award coins if winner
      if (roomState.winner?.player.id === currentPlayerId && roomState.winner.coinPrize > 0) {
        awardMultiplayerPrize(
          roomState.winner.coinPrize,
          roomState.settings.betAmount,
          1
        );
      }
    }
  }, [roomState?.status, roomState?.currentIndex]);

  const handleCopyCode = () => {
    if (!roomState?.roomCode) return;
    navigator.clipboard.writeText(roomState.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectOption = (idx: number) => {
    if (roomState?.status !== 'in_question' || me?.hasAnsweredCurrent || selectedOption !== null) {
      return;
    }
    setSelectedOption(idx);
    playSoundFX('click');
    onSendAction({
      type: 'submit_answer',
      optionIndex: idx,
    });
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendAction({
      type: 'send_chat',
      text: chatInput.trim(),
    });
    setChatInput('');
  };

  const handleSendQuickEmote = (emote: string) => {
    onSendAction({
      type: 'send_chat',
      text: emote,
    });
  };

  if (!roomState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center text-slate-400">
        <div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mb-4" />
        <p className="text-slate-300 font-medium">Connecting to Multiplayer Arena...</p>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 1. LOBBY VIEW
  // -------------------------------------------------------------
  if (roomState.status === 'lobby') {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-2">
                <Users className="w-3.5 h-3.5" />
                <span>Multiplayer Match Lobby</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                <span>Room Code:</span>
                <span className="font-mono text-amber-400 tracking-wider">
                  {roomState.roomCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Copy Room Code"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Share this room code with friends so they can join from any tab or device!
              </p>
            </div>

            {/* Match Pot Badge */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-slate-900 border border-amber-500/40 text-center sm:text-right shrink-0">
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
                Total Match Pot
              </span>
              <div className="flex items-center justify-center sm:justify-end gap-1.5 text-2xl font-black text-amber-400">
                <Coins className="w-6 h-6 text-amber-400 animate-pulse" />
                <span>{roomState.potTotal.toLocaleString()}</span>
              </div>
              <span className="text-[10px] text-slate-400">
                Wager: {roomState.settings.betAmount} coins / player
              </span>
            </div>
          </div>
        </div>

        {/* Contenders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>Contenders ({roomState.players.length}/8)</span>
              </h3>
              {isHost && roomState.players.length < 8 && (
                <button
                  onClick={() => onSendAction({ type: 'add_bot' })}
                  className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Bot className="w-4 h-4 text-indigo-400" />
                  <span>+ Add AI Contender</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {roomState.players.map((player) => {
                const isMe = player.id === currentPlayerId;

                return (
                  <motion.div
                    key={player.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`p-4 rounded-xl border flex items-center justify-between ${
                      isMe
                        ? 'bg-indigo-950/40 border-indigo-500/50 ring-1 ring-indigo-500/30'
                        : 'bg-slate-900/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-lg">
                        {player.isBot ? (
                          <Bot className="w-5 h-5 text-indigo-400" />
                        ) : player.isHost ? (
                          <Crown className="w-5 h-5 text-amber-400" />
                        ) : (
                          <Zap className="w-5 h-5 text-emerald-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-slate-200">
                            {player.name}
                          </span>
                          {isMe && (
                            <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold">
                              You
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span className="flex items-center gap-1 text-amber-400 font-medium">
                            <Coins className="w-3 h-3" />
                            <span>{player.bet} bet</span>
                          </span>
                          <span>•</span>
                          <span className={player.isReady ? 'text-emerald-400' : 'text-slate-500'}>
                            {player.isReady ? 'Ready' : 'Not Ready'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      {player.isReady ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <div className="w-3 h-3 rounded-full bg-slate-700 animate-pulse" />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Match Settings Info */}
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 text-xs text-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">
                  Difficulty
                </span>
                <span className="font-semibold text-indigo-400">
                  {roomState.settings.difficulty}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">
                  Category
                </span>
                <span className="font-semibold text-slate-200 capitalize">
                  {roomState.settings.category.replace(/_/g, ' ')}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">
                  Rounds
                </span>
                <span className="font-semibold text-slate-200">
                  {roomState.settings.roundCount} Questions
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">
                  Host
                </span>
                <span className="font-semibold text-amber-300">
                  {roomState.settings.personality.name}
                </span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={onLeaveRoom}
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Leave Lobby</span>
              </button>

              {!isHost && (
                <button
                  onClick={() => onSendAction({ type: 'toggle_ready' })}
                  className={`w-full sm:flex-1 py-3 px-6 rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all ${
                    me?.isReady
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>{me?.isReady ? 'Ready for Battle!' : 'Click when Ready'}</span>
                </button>
              )}

              {isHost && (
                <button
                  onClick={() => onSendAction({ type: 'start_match' })}
                  disabled={roomState.players.length < 1}
                  className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-base shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]"
                >
                  <Play className="w-5 h-5 fill-slate-950" />
                  <span>START MULTIPLAYER MATCH</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Side Chat & Banter */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col h-[400px]">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-xs font-bold text-slate-300">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <span>Lobby Banter</span>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1 text-xs">
              {roomState.chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-2 rounded-lg ${
                    msg.isSystem
                      ? 'bg-indigo-950/40 border border-indigo-500/20 text-indigo-300 italic text-[11px]'
                      : msg.senderId === currentPlayerId
                      ? 'bg-slate-800 text-slate-200 ml-4'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 mr-4'
                  }`}
                >
                  {!msg.isSystem && (
                    <span className="font-bold text-amber-400 block text-[10px]">
                      {msg.senderName}
                    </span>
                  )}
                  <span>{msg.text}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Emotes */}
            <div className="flex items-center gap-1 overflow-x-auto py-1.5 border-t border-slate-800 no-scrollbar">
              {QUICK_EMOTES.map((emote) => (
                <button
                  key={emote}
                  onClick={() => handleSendQuickEmote(emote)}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] whitespace-nowrap transition-colors"
                >
                  {emote}
                </button>
              ))}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChat} className="flex gap-2 pt-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. COUNTDOWN VIEW
  // -------------------------------------------------------------
  if (roomState.status === 'countdown') {
    return (
      <div className="w-full max-w-xl mx-auto min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
        <motion.div
          key={roomState.countdownSeconds}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.5, opacity: 0 }}
          className="w-32 h-32 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 p-1 shadow-2xl shadow-amber-500/40 flex items-center justify-center mb-6"
        >
          <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center">
            <span className="text-6xl font-black text-amber-400">
              {roomState.countdownSeconds || 3}
            </span>
          </div>
        </motion.div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Get Ready!</h2>
        <p className="text-sm text-slate-400 max-w-sm">
          {roomState.hostCommentary || 'Questions are locked and loaded. Fastest fingers win!'}
        </p>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 3. IN QUESTION / ACTIVE ROUND VIEW
  // -------------------------------------------------------------
  if (roomState.status === 'in_question' || roomState.status === 'round_recap') {
    const q = roomState.currentQuestion;
    const isRecap = roomState.status === 'round_recap';
    const timerFraction = Math.max(0, roomState.timeRemaining / roomState.maxTime);

    return (
      <div className="w-full max-w-5xl mx-auto space-y-6">
        {/* Top Arena Banner & Live Scoreboard Bar */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Question Counter & Category */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold">
              Q{roomState.currentIndex + 1}
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">
                Round {roomState.currentIndex + 1} of {roomState.totalQuestions}
              </span>
              <span className="text-sm font-bold text-slate-200 capitalize">
                {q?.category?.replace(/_/g, ' ') || 'General Trivia'}
              </span>
            </div>
          </div>

          {/* Synchronized Timer Ring */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 text-lg font-black font-mono text-amber-400">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>{roomState.timeRemaining}s</span>
              </div>
              <div className="w-28 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                <div
                  className={`h-full transition-all duration-1000 ${
                    roomState.timeRemaining <= 5 ? 'bg-red-500' : 'bg-amber-400'
                  }`}
                  style={{ width: `${timerFraction * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Pot Tracker */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-sm">
            <Coins className="w-4 h-4" />
            <span>Pot: {roomState.potTotal} coins</span>
          </div>
        </div>

        {/* Main Split: Left Question, Right Live Standings */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Question Box */}
          <div className="lg:col-span-2 space-y-4">
            <motion.div
              key={roomState.currentIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 sm:p-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl relative overflow-hidden"
            >
              {/* Host commentary speech bubble */}
              {roomState.hostCommentary && (
                <div className="mb-4 p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-xs flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed font-medium">
                    <span className="font-bold text-amber-300">
                      {roomState.settings.personality.name}:
                    </span>{' '}
                    "{roomState.hostCommentary}"
                  </p>
                </div>
              )}

              {/* Question Text */}
              <h3 className="text-xl sm:text-2xl font-bold text-slate-100 leading-snug mb-6">
                {q?.question || 'Preparing Question...'}
              </h3>

              {/* 4 Interactive Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {q?.options.map((option, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect = isRecap && q.correctIndex === idx;
                  const isWrong = isRecap && isSelected && q.correctIndex !== idx;

                  return (
                    <button
                      key={idx}
                      disabled={me?.hasAnsweredCurrent || isRecap}
                      onClick={() => handleSelectOption(idx)}
                      className={`p-4 rounded-xl border text-left font-medium text-sm transition-all flex items-center justify-between ${
                        isCorrect
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200 ring-2 ring-emerald-400/40'
                          : isWrong
                          ? 'bg-red-500/20 border-red-400 text-red-200'
                          : isSelected
                          ? 'bg-amber-500/20 border-amber-400 text-amber-200 ring-2 ring-amber-400/30'
                          : me?.hasAnsweredCurrent
                          ? 'bg-slate-900/40 border-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-slate-800/80 border-slate-700 hover:border-indigo-500 hover:bg-slate-800 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-slate-950/60 border border-slate-700/60 text-xs font-bold flex items-center justify-center text-slate-300">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{option}</span>
                      </div>

                      {isRecap && (
                        <div>
                          {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                          {isWrong && <XCircle className="w-5 h-5 text-red-400" />}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Status footer inside card */}
              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>
                  {me?.hasAnsweredCurrent ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Answer Locked In! Waiting for round end...
                    </span>
                  ) : (
                    <span>Tap an option before the timer expires!</span>
                  )}
                </span>

                {isRecap && q?.explanation && (
                  <span className="text-slate-300 font-medium max-w-md truncate">
                    💡 {q.explanation}
                  </span>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Live Standings & Contender Status */}
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Live Leaderboard</span>
                </h4>
                <span className="text-[10px] text-slate-500">Real-Time Sync</span>
              </div>

              <div className="mt-3 space-y-2">
                {[...roomState.players]
                  .sort((a, b) => b.score - a.score)
                  .map((player, rankIdx) => {
                    const isMe = player.id === currentPlayerId;

                    return (
                      <div
                        key={player.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                          isMe
                            ? 'bg-indigo-950/40 border-indigo-500/40 ring-1 ring-indigo-500/20'
                            : 'bg-slate-950/40 border-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                              rankIdx === 0
                                ? 'bg-amber-500 text-slate-950'
                                : rankIdx === 1
                                ? 'bg-slate-300 text-slate-950'
                                : rankIdx === 2
                                ? 'bg-amber-700 text-white'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {rankIdx + 1}
                          </span>
                          <div>
                            <span className="font-bold text-slate-200 block">
                              {player.name} {isMe && '(You)'}
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px]">
                              {player.hasAnsweredCurrent ? (
                                <span className="text-emerald-400 font-semibold">Locked In ⚡</span>
                              ) : (
                                <span className="text-slate-500">Thinking...</span>
                              )}
                              {player.streak > 1 && (
                                <span className="text-amber-400 font-bold flex items-center gap-0.5">
                                  <Flame className="w-2.5 h-2.5 fill-amber-400" /> {player.streak}x
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-bold text-amber-400 block">
                            {player.score.toLocaleString()} pts
                          </span>
                          {isRecap && player.lastPointsEarned > 0 && (
                            <span className="text-[10px] font-bold text-emerald-400">
                              +{player.lastPointsEarned}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Quick Emote Reactions */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
              {QUICK_EMOTES.map((emote) => (
                <button
                  key={emote}
                  onClick={() => handleSendQuickEmote(emote)}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] whitespace-nowrap transition-colors"
                >
                  {emote}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 4. GAME OVER / GRAND FINALE PODIUM
  // -------------------------------------------------------------
  if (roomState.status === 'game_over') {
    const sorted = [...roomState.players].sort((a, b) => b.score - a.score);
    const champion = sorted[0];
    const isWinner = champion?.id === currentPlayerId;

    return (
      <div className="w-full max-w-3xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 rounded-3xl bg-slate-900/95 border border-slate-700 shadow-2xl text-center relative overflow-hidden"
        >
          {/* Top Host Closing */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold mb-4">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Match Complete</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-slate-100 tracking-tight mb-2">
            {champion ? `${champion.name} is the Champion!` : 'Multiplayer Match Finished!'}
          </h2>
          <p className="text-sm text-slate-300 max-w-lg mx-auto mb-8">
            {roomState.hostCommentary}
          </p>

          {/* Podium Visual */}
          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto items-end mb-8 pt-4">
            {/* 2nd Place */}
            {sorted[1] && (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-slate-400 flex items-center justify-center font-bold text-slate-300 mb-2">
                  🥈
                </div>
                <span className="text-xs font-bold text-slate-300 truncate max-w-[90px]">
                  {sorted[1].name}
                </span>
                <span className="text-[11px] font-bold text-amber-400">
                  {sorted[1].score.toLocaleString()}
                </span>
                <div className="w-full h-16 bg-slate-800/80 rounded-t-xl mt-2 flex items-center justify-center font-black text-slate-500">
                  #2
                </div>
              </div>
            )}

            {/* 1st Place Champion */}
            {sorted[0] && (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 shadow-lg shadow-amber-500/40 mb-2 animate-bounce">
                  <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center text-2xl">
                    👑
                  </div>
                </div>
                <span className="text-sm font-bold text-amber-300 truncate max-w-[110px]">
                  {sorted[0].name}
                </span>
                <span className="text-xs font-bold text-amber-400">
                  {sorted[0].score.toLocaleString()} pts
                </span>
                <div className="w-full h-24 bg-gradient-to-t from-amber-500/30 to-amber-500/10 border-t border-amber-500/40 rounded-t-xl mt-2 flex items-center justify-center font-black text-amber-400">
                  #1
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {sorted[2] && (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-amber-700 flex items-center justify-center font-bold text-amber-600 mb-2">
                  🥉
                </div>
                <span className="text-xs font-bold text-slate-300 truncate max-w-[90px]">
                  {sorted[2].name}
                </span>
                <span className="text-[11px] font-bold text-amber-400">
                  {sorted[2].score.toLocaleString()}
                </span>
                <div className="w-full h-12 bg-slate-800/60 rounded-t-xl mt-2 flex items-center justify-center font-black text-slate-600">
                  #3
                </div>
              </div>
            )}
          </div>

          {/* Coin Payout Box */}
          {roomState.winner && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 max-w-md mx-auto mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Coins className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-semibold block uppercase">
                    Pot Winner Payout
                  </span>
                  <span className="text-sm font-bold text-amber-300">
                    {roomState.winner.player.name} takes the pot!
                  </span>
                </div>
              </div>
              <span className="text-xl font-black text-amber-400">
                +{roomState.winner.coinPrize} Coins
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onLeaveRoom}
              className="w-full sm:w-auto py-3 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-colors"
            >
              Return to Main Menu
            </button>
            {isHost && (
              <button
                onClick={() => onSendAction({ type: 'start_match' })}
                className="w-full sm:w-auto py-3 px-8 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Play Rematch</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
};
