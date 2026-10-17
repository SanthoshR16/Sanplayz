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
