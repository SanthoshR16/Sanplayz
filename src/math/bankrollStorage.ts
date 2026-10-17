export interface BankrollState {
  startingCapital: number;
  currentBalance: number;
  minBet: number;
  targetPercent: number; // default 10%
  totalBetsPlaced: number;
  betsWon: number;
  betsLost: number;
}

const STORAGE_KEY = 'roulette_bankroll_tracker_v1';

export function loadBankrollFromStorage(): BankrollState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.startingCapital === 'number' && parsed.startingCapital > 0) {
        return {
          startingCapital: parsed.startingCapital,
          currentBalance: parsed.currentBalance ?? parsed.startingCapital,
          minBet: parsed.minBet ?? 20,
          targetPercent: parsed.targetPercent ?? 10,
          totalBetsPlaced: parsed.totalBetsPlaced ?? 0,
          betsWon: parsed.betsWon ?? 0,
          betsLost: parsed.betsLost ?? 0,
        };
      }
    }
  } catch (e) {
    console.error('Failed to parse bankroll storage:', e);
  }
  return {
    startingCapital: 1000,
    currentBalance: 1000,
    minBet: 20,
    targetPercent: 10,
    totalBetsPlaced: 0,
    betsWon: 0,
    betsLost: 0,
  };
}

export function saveBankrollToStorage(state: BankrollState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save bankroll to storage:', e);
  }
}

export interface DynamicWagerInfo {
  amount: number;
  units: number;
  reasoning: string;
}

/**
 * Calculates the exact intelligent bet amount based on:
 * 1. Bankroll capacity & remaining profit needed to hit the +10% target.
 * 2. Statistical confidence / probability alignment of the Sureshot signal.
 * 3. Deficit recovery scaling (if recovering from a dip) without exponential Martingale risk.
 * 4. Strict safety caps (max 5% of balance, max 3x minBet) to preserve capital.
 */
export function calculateDynamicWager(
  bankroll: BankrollState,
  confidence: number,
  isTriggered: boolean
): DynamicWagerInfo {
  const { startingCapital, currentBalance, minBet, targetPercent } = bankroll;
  if (!isTriggered || minBet <= 0 || currentBalance <= 0) {
    return {
      amount: minBet,
      units: 1,
      reasoning: 'Standard 1-unit baseline wager.',
    };
  }

  const targetProfit = (startingCapital * targetPercent) / 100;
  const currentProfit = currentBalance - startingCapital;
  const remainingProfit = targetProfit - currentProfit;

  // Target already achieved
  if (remainingProfit <= 0) {
    return {
      amount: minBet,
      units: 1,
      reasoning: 'Goal complete (+10%). Lock in profit or bet minimum 1 unit.',
    };
  }

  let recommended = minBet;
  let reason = '';

  // 1. Close to +10% goal: Size specifically to cross the finish line in a single strike!
  if (remainingProfit <= minBet) {
    recommended = minBet;
    reason = `Only ${remainingProfit.toFixed(0)} needed for +10% target. 1 minimum bet completes goal.`;
  } else if (remainingProfit <= minBet * 1.5) {
    recommended = Math.ceil(remainingProfit / 5) * 5;
    reason = `Finish-line strike: ${remainingProfit.toFixed(0)} remaining. One win completes +10% goal!`;
  }
  // 2. Deficit recovery (if current balance is below starting capital)
  else if (currentProfit < 0) {
    const deficit = Math.abs(currentProfit);
    // Moderate proportional recovery sizing (never reckless exponential Martingale)
    const recoveryWager = minBet + Math.round((deficit * 0.4) / 5) * 5;
    recommended = Math.min(minBet * 2.5, Math.max(minBet, recoveryWager));
    reason = `Variance recovery sizing: calculated to recoup deficit while pursuing +10% target.`;
  }
  // 3. High confidence scaling
  else if (confidence >= 93) {
    // Ultra-high confidence wave: 1.5x units
    recommended = Math.round((minBet * 1.5) / 5) * 5;
    reason = `Ultra-high confidence (${confidence}%): scaled 1.5× to accelerate toward +10% goal.`;
  } else if (confidence >= 89) {
    // Solid confidence: 1.25x units
    recommended = Math.round((minBet * 1.25) / 5) * 5;
    reason = `High confidence (${confidence}%): 1.25× sizing calibrated for smooth progression.`;
  } else {
    // Base confidence: 1 unit
    recommended = minBet;
    reason = `Disciplined 1-unit bet on verified statistical opportunity.`;
  }

  // Safety caps:
  // - Max 5% of current balance (strict bankroll preservation)
  // - Max 3x table minimum bet
  const maxSafeWager = Math.min(
    Math.max(minBet, Math.floor(currentBalance * 0.05)),
    minBet * 3
  );

  const finalAmount = Math.max(minBet, Math.min(recommended, maxSafeWager));
  const units = Number((finalAmount / minBet).toFixed(2));

  return {
    amount: finalAmount,
    units,
    reasoning: reason,
  };
}
