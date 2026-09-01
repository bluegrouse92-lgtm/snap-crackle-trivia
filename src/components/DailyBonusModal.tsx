import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Coins,
  Gift,
  CheckCircle2,
  Clock,
  Sparkles,
  Flame,
  X,
  Trophy,
  Award,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  getCoinWallet,
  canClaimDailyBonus,
  claimDailyBonus,
  getTimeUntilNextDailyBonus,
} from '../utils/coinManager';
import { playSoundFX } from '../utils/audioPlayer';
import { CoinWallet } from '../types';

interface DailyBonusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCoinsClaimed?: (newWallet: CoinWallet) => void;
}

export const DailyBonusModal: React.FC<DailyBonusModalProps> = ({
  isOpen,
  onClose,
  onCoinsClaimed,
}) => {
  const [wallet, setWallet] = useState<CoinWallet>(getCoinWallet());
  const [isEligible, setIsEligible] = useState<boolean>(canClaimDailyBonus());
  const [timeUntilNext, setTimeUntilNext] = useState<{ hours: number; minutes: number }>(
    getTimeUntilNextDailyBonus()
  );

  useEffect(() => {
    if (isOpen) {
      const currentWallet = getCoinWallet();
      setWallet(currentWallet);
      setIsEligible(canClaimDailyBonus());
      setTimeUntilNext(getTimeUntilNextDailyBonus());
    }
  }, [isOpen]);


  // Update countdown timer every minute
  useEffect(() => {
    if (!isEligible && isOpen) {
      const interval = setInterval(() => {
        setTimeUntilNext(getTimeUntilNextDailyBonus());
        setIsEligible(canClaimDailyBonus());
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [isEligible, isOpen]);

  const handleClaim = () => {
    if (!isEligible) return;

    const result = claimDailyBonus();
    setWallet(result.wallet);
    setIsEligible(false);
    setTimeUntilNext(getTimeUntilNextDailyBonus());

    // Trigger celebratory confetti
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#FBBF24', '#F59E0B', '#D97706', '#6366F1', '#10B981'],
    });

    playSoundFX('fanfare');
    onCoinsClaimed?.(result.wallet);
    
    // Close modal after a short delay so the user sees the reward
    setTimeout(onClose, 1000);
  };

  if (!isOpen) return null;

  const currentStreakDay = ((wallet.dailyStreak || 0) % 7) + 1;
  const streakRewards = [
    { day: 1, coins: 150, bonus: 0 },
    { day: 2, coins: 160, bonus: 10 },
    { day: 3, coins: 170, bonus: 20 },
    { day: 4, coins: 180, bonus: 30 },
    { day: 5, coins: 200, bonus: 50 },
    { day: 6, coins: 220, bonus: 70 },
    { day: 7, coins: 250, bonus: 100, isJackpot: true },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl shadow-amber-500/10 text-white"
        >
          {/* Header Glow Banner */}
          <div className="relative p-6 text-center bg-gradient-to-b from-amber-500/20 via-slate-900/60 to-slate-900 border-b border-slate-800">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <motion.div
              initial={{ rotate: -10, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', damping: 12 }}
              className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 shadow-lg shadow-amber-500/30 flex items-center justify-center mb-3"
            >
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Gift className="w-8 h-8 text-amber-400 animate-pulse" />
              </div>
            </motion.div>

            <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
              Daily Login Bonus
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Log in daily to claim free coins for match betting and room pots!
            </p>

            {/* Streak Counter Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-3 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>Current Check-in Streak: {wallet.dailyStreak || 0} Days</span>
            </div>
          </div>

          {/* 7-Day Reward Track */}
          <div className="p-6 space-y-6">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-medium">
                <span>7-Day Check-in Track</span>
                <span className="text-amber-400">Day {currentStreakDay} of 7</span>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {streakRewards.map((reward) => {
                  const isPast = reward.day < currentStreakDay;
                  const isCurrent = reward.day === currentStreakDay;

                  return (
                    <div
                      key={reward.day}
                      className={`relative flex flex-col items-center justify-between p-2 rounded-xl border text-center transition-all ${
                        isCurrent
                          ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/40 shadow-lg shadow-amber-500/20'
                          : isPast
                          ? 'bg-slate-800/40 border-slate-700/60 opacity-70'
                          : 'bg-slate-800/80 border-slate-700'
                      }`}
                    >
                      <span className="text-[10px] font-semibold text-slate-400 uppercase">
                        D{reward.day}
                      </span>

                      <div className="my-1">
                        {isPast ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" />
                        ) : reward.isJackpot ? (
                          <Trophy className="w-5 h-5 text-yellow-400 mx-auto animate-bounce" />
                        ) : (
                          <Coins className="w-4 h-4 text-amber-400 mx-auto" />
                        )}
                      </div>

                      <span
                        className={`text-[11px] font-bold ${
                          isCurrent ? 'text-amber-300' : 'text-slate-200'
                        }`}
                      >
                        +{reward.coins}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Claim Action Box */}
            {isEligible ? (
              <div className="space-y-3">
                <button
                  onClick={handleClaim}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold text-base shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]"
                >
                  <Gift className="w-5 h-5" />
                  <span>Claim 150 Daily Coins</span>
                  <Sparkles className="w-4 h-4" />
                </button>
                <p className="text-center text-[11px] text-slate-400">
                  Available once every 24 hours. Resets daily at midnight.
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 text-center space-y-2">
                <div className="flex items-center justify-center gap-1.5 text-amber-400 text-sm font-semibold">
                  <Clock className="w-4 h-4" />
                  <span>Already Claimed Today!</span>
                </div>
                <p className="text-xs text-slate-400">
                  Next daily bonus available in:{' '}
                  <span className="font-mono font-bold text-slate-200">
                    {timeUntilNext.hours}h {timeUntilNext.minutes}m
                  </span>
                </p>
              </div>
            )}

            {/* Wallet Stats Summary */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center text-xs">
              <div className="p-2.5 rounded-lg bg-slate-800/40">
                <span className="text-slate-400 block text-[10px]">Coin Balance</span>
                <span className="font-bold text-amber-400 text-sm">
                  {wallet.balance.toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-800/40">
                <span className="text-slate-400 block text-[10px]">Total Won</span>
                <span className="font-bold text-emerald-400 text-sm">
                  {wallet.totalCoinsWon.toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-800/40">
                <span className="text-slate-400 block text-[10px]">Total Wagered</span>
                <span className="font-bold text-purple-400 text-sm">
                  {wallet.totalCoinsBet.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
