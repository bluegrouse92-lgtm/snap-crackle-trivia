import React from 'react';
import { Coins, Sparkles, AlertCircle, TrendingUp, Gift } from 'lucide-react';
import { playSoundFX } from '../utils/audioPlayer';

interface CoinWagerSelectorProps {
  currentWager: number;
  onWagerChange: (newWager: number) => void;
  userBalance: number;
  onOpenDailyBonus?: () => void;
  isMultiplayer?: boolean;
}

const WAGER_TIERS = [
  { amount: 0, label: 'Free Play', multiplierDesc: 'Earn base + streak coins' },
  { amount: 25, label: '25 Coins', multiplierDesc: 'Up to 2.5x payout (62 coins)' },
  { amount: 50, label: '50 Coins', multiplierDesc: 'Up to 2.5x payout (125 coins)' },
  { amount: 100, label: '100 Coins', multiplierDesc: 'Up to 2.5x payout (250 coins)' },
  { amount: 250, label: '250 Coins', multiplierDesc: 'Up to 2.5x payout (625 coins)' },
  { amount: 500, label: '500 Coins', multiplierDesc: 'High Roller Jackpot (1,250 coins)' },
];

export const CoinWagerSelector: React.FC<CoinWagerSelectorProps> = ({
  currentWager,
  onWagerChange,
  userBalance,
  onOpenDailyBonus,
  isMultiplayer = false,
}) => {
  const handleSelect = (amount: number) => {
    if (amount > userBalance) {
      playSoundFX('wrong');
      return;
    }
    playSoundFX('bet');
    onWagerChange(amount);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
          <Coins className="w-4 h-4 text-amber-400" />
          <span>{isMultiplayer ? 'Match Wager per Player' : 'Match Coin Bet'}</span>
        </label>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            Balance:{' '}
            <span className="font-bold text-amber-300">
              {userBalance.toLocaleString()} coins
            </span>
          </span>
          {userBalance < 50 && onOpenDailyBonus && (
            <button
              onClick={onOpenDailyBonus}
              type="button"
              className="px-2 py-0.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold border border-amber-500/40 flex items-center gap-1 transition-colors"
            >
              <Gift className="w-3 h-3" />
              <span>+150 Free</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {WAGER_TIERS.map((tier) => {
          const isSelected = currentWager === tier.amount;
          const isAffordable = userBalance >= tier.amount || tier.amount === 0;

          return (
            <button
              key={tier.amount}
              type="button"
              disabled={!isAffordable}
              onClick={() => handleSelect(tier.amount)}
              className={`relative flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-md shadow-amber-500/20 ring-1 ring-amber-400/50'
                  : isAffordable
                  ? 'bg-slate-800/80 border-slate-700/80 hover:border-slate-600 text-slate-300 hover:bg-slate-800'
                  : 'bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed opacity-50'
              }`}
            >
              <div className="flex items-center gap-1 mb-0.5">
                {tier.amount > 0 ? (
                  <Coins
                    className={`w-3.5 h-3.5 ${
                      isSelected ? 'text-amber-400 fill-amber-400/40' : 'text-amber-500/70'
                    }`}
                  />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span className="font-bold text-xs">
                  {tier.amount === 0 ? 'Free' : tier.amount}
                </span>
              </div>
              <span className="text-[9px] text-slate-400 uppercase font-semibold tracking-wider">
                {tier.amount === 0 ? 'Practice' : 'Bet'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Payout / Pot Explanation */}
      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2 text-xs text-slate-300">
        <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5 text-[11px] leading-relaxed">
          {isMultiplayer ? (
            <p>
              <span className="font-semibold text-amber-300">Multiplayer Match Pot:</span> All
              contender bets enter the pot. 1st place champion wins up to 75-100% of the pot!
            </p>
          ) : currentWager > 0 ? (
            <p>
              <span className="font-semibold text-amber-300">Accuracy Multipliers:</span> 100%
              accuracy wins <span className="text-emerald-400 font-bold">2.5x</span> (
              {Math.round(currentWager * 2.5)} coins), 80%+ wins{' '}
              <span className="text-emerald-400 font-bold">2.0x</span> (
              {Math.round(currentWager * 2)} coins), 60%+ wins{' '}
              <span className="text-emerald-400 font-bold">1.5x</span>.
            </p>
          ) : (
            <p>
              <span className="font-semibold text-emerald-300">Practice Mode:</span> No coin risk.
              Earn participation coins and speed streaks!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
