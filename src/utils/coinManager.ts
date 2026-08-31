import { CoinWallet, MatchCoinReward } from '../types';
import { playSoundFX } from './audioPlayer';

const COIN_WALLET_KEY = 'personatrivia_coin_wallet';
const DEFAULT_INITIAL_BALANCE = 500;
const DAILY_LOGIN_BASE_REWARD = 150;

/**
 * Get current date string in local YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Load Coin Wallet from persistent storage
 */
export function getCoinWallet(): CoinWallet {
  try {
    const raw = localStorage.getItem(COIN_WALLET_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        balance: typeof parsed.balance === 'number' ? parsed.balance : DEFAULT_INITIAL_BALANCE,
        lastDailyClaimDate: parsed.lastDailyClaimDate || null,
        dailyStreak: typeof parsed.dailyStreak === 'number' ? parsed.dailyStreak : 0,
        totalCoinsWon: typeof parsed.totalCoinsWon === 'number' ? parsed.totalCoinsWon : 0,
        totalCoinsBet: typeof parsed.totalCoinsBet === 'number' ? parsed.totalCoinsBet : 0,
      };
    }
  } catch (err) {
    console.error('Error loading coin wallet:', err);
  }

  const initialWallet: CoinWallet = {
    balance: DEFAULT_INITIAL_BALANCE,
    lastDailyClaimDate: null,
    dailyStreak: 0,
    totalCoinsWon: 0,
    totalCoinsBet: 0,
  };
  saveCoinWallet(initialWallet);
  return initialWallet;
}

/**
 * Save Coin Wallet and dispatch reactive update event
 */
export function saveCoinWallet(wallet: CoinWallet): void {
  try {
    localStorage.setItem(COIN_WALLET_KEY, JSON.stringify(wallet));
    window.dispatchEvent(new CustomEvent('coin_wallet_updated', { detail: wallet }));
  } catch (err) {
    console.error('Error saving coin wallet:', err);
  }
}

/**
 * Check if the player is eligible to claim the ~150 daily login coins
 */
export function canClaimDailyBonus(): boolean {
  const wallet = getCoinWallet();
  const today = getTodayDateString();
  return wallet.lastDailyClaimDate !== today;
}

export const checkCanClaimDailyBonus = canClaimDailyBonus;

/**
 * Convenience helper to award single player match prize
 */
export function awardSinglePlayerPrize(
  wager: number,
  accuracyPct: number,
  difficulty: string,
  highestStreak: number
): number {
  const result = settleSinglePlayerMatch(
    wager,
    accuracyPct,
    accuracyPct * 20,
    5,
    highestStreak
  );
  return result.coinsEarned;
}

/**
 * Get the hours/minutes remaining until the next daily bonus
 */
export function getTimeUntilNextDailyBonus(): { hours: number; minutes: number } {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const diffMs = tomorrow.getTime() - now.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return { hours, minutes };
}

/**
 * Claim Daily Login Reward (150 coins + streak bonus)
 */
export function claimDailyBonus(): { claimedAmount: number; newStreak: number; wallet: CoinWallet } {
  const wallet = getCoinWallet();
  const today = getTodayDateString();

  if (wallet.lastDailyClaimDate === today) {
    return { claimedAmount: 0, newStreak: wallet.dailyStreak, wallet };
  }

  // Calculate streak: if claimed yesterday, increment; otherwise reset to 1
  let nextStreak = 1;
  if (wallet.lastDailyClaimDate) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    if (wallet.lastDailyClaimDate === yStr) {
      nextStreak = wallet.dailyStreak + 1;
    }
  }

  // Streak bonus: +10 extra coins for each consecutive streak day (capped at +100 bonus)
  const streakBonus = Math.min(100, (nextStreak - 1) * 10);
  const totalAward = DAILY_LOGIN_BASE_REWARD + streakBonus;

  const updatedWallet: CoinWallet = {
    ...wallet,
    balance: wallet.balance + totalAward,
    lastDailyClaimDate: today,
    dailyStreak: nextStreak,
    totalCoinsWon: wallet.totalCoinsWon + totalAward,
  };

  saveCoinWallet(updatedWallet);
  playSoundFX('coin');

  return { claimedAmount: totalAward, newStreak: nextStreak, wallet: updatedWallet };
}

/**
 * Place a wager for a match (deducts coins if available)
 */
export function placeMatchBet(amount: number): { success: boolean; wallet: CoinWallet; message?: string } {
  const wallet = getCoinWallet();
  if (amount <= 0) {
    return { success: true, wallet };
  }

  if (wallet.balance < amount) {
    return {
      success: false,
      wallet,
      message: `Insufficient coins! You have ${wallet.balance} coins, but need ${amount} coins to place this bet.`,
    };
  }

  const updatedWallet: CoinWallet = {
    ...wallet,
    balance: wallet.balance - amount,
    totalCoinsBet: wallet.totalCoinsBet + amount,
  };

  saveCoinWallet(updatedWallet);
  return { success: true, wallet: updatedWallet };
}

/**
 * Calculate and award coins based on single-player match performance & wager
 */
export function settleSinglePlayerMatch(
  wager: number,
  accuracyPct: number,
  score: number,
  totalQuestions: number,
  highestStreak: number
): MatchCoinReward {
  const wallet = getCoinWallet();
  let multiplier = 0;
  let reason = '';

  // Calculate base coins for completing the match (performance reward)
  const participationReward = Math.min(50, Math.round(score / 500));

  if (wager === 0) {
    // Free / Practice match
    const coinsEarned = Math.max(10, Math.round(accuracyPct * 0.5) + participationReward);
    const updatedWallet: CoinWallet = {
      ...wallet,
      balance: wallet.balance + coinsEarned,
      totalCoinsWon: wallet.totalCoinsWon + coinsEarned,
    };
    saveCoinWallet(updatedWallet);
    playSoundFX('coin');
    return {
      betAmount: 0,
      coinsEarned,
      netProfit: coinsEarned,
      reason: 'Practice match completed! Performance bonus awarded.',
      multiplier: 1,
    };
  }

  // Wagered match payout logic
  if (accuracyPct === 100) {
    multiplier = 2.5;
    reason = 'PERFECT 100% ACCURACY! 2.5x JACKPOT PAYOUT!';
  } else if (accuracyPct >= 80) {
    multiplier = 2.0;
    reason = 'HIGH ACCURACY (80%+)! 2.0x WAGER DOUBLED!';
  } else if (accuracyPct >= 60) {
    multiplier = 1.5;
    reason = 'SOLID PERFORMANCE (60%+)! 1.5x WAGER RETURNED!';
  } else if (accuracyPct >= 40) {
    multiplier = 0.8;
    reason = 'PARTIAL RECOVERY (40%+)! 80% Wager Refunded.';
  } else {
    multiplier = 0;
    reason = 'Match lost! Accuracy below 40%. Better luck next time!';
  }

  // Streak bonus coins
  const streakCoinBonus = highestStreak >= 5 ? 25 : highestStreak >= 3 ? 10 : 0;
  const coinsEarned = Math.round(wager * multiplier) + streakCoinBonus;
  const netProfit = coinsEarned - wager;

  const updatedWallet: CoinWallet = {
    ...wallet,
    balance: wallet.balance + coinsEarned,
    totalCoinsWon: wallet.totalCoinsWon + Math.max(0, netProfit),
  };

  saveCoinWallet(updatedWallet);
  if (coinsEarned > 0) {
    playSoundFX('coin');
  }

  return {
    betAmount: wager,
    coinsEarned,
    netProfit,
    reason,
    multiplier,
  };
}

/**
 * Award multiplayer pot winnings
 */
export function awardMultiplayerPrize(
  prizeAmount: number,
  betAmount: number,
  rank: number
): MatchCoinReward {
  const wallet = getCoinWallet();
  const netProfit = prizeAmount - betAmount;

  const updatedWallet: CoinWallet = {
    ...wallet,
    balance: wallet.balance + prizeAmount,
    totalCoinsWon: wallet.totalCoinsWon + Math.max(0, netProfit),
  };

  saveCoinWallet(updatedWallet);
  if (prizeAmount > 0) {
    playSoundFX('coin');
  }

  return {
    betAmount,
    coinsEarned: prizeAmount,
    netProfit,
    reason: rank === 1 ? '🥇 1st Place Champion! Pot Claimed!' : `🥈 Rank #${rank} Prize Awarded!`,
    multiplier: betAmount > 0 ? Number((prizeAmount / betAmount).toFixed(2)) : 1,
  };
}
