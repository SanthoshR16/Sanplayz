/**
 * Mines Paper-Trading Bankroll Simulator Engine.
 *
 * Implements:
 * - Un-prefilled bankroll state (requires explicit user entry).
 * - Hypothetical stake accounting (gross returns vs net profit/loss).
 * - Configurable profit target percentage (default 10% optional stopping goal).
 * - Peak balance tracking and maximum drawdown calculation.
 * - Win streak and loss streak tracking.
 * - Complete session event logging.
 *
 * CRITICAL RULE: Paper-trading is 100% hypothetical simulation.
 * The 10% target is an optional risk management stopping discipline, NOT a guaranteed return.
 * Martingale and progressive loss chasing are explicitly discouraged due to negative EV.
 */

import type { BankrollSessionEntry, BankrollState, MinesOutcome } from '../types/mines';
import { calculateReturns } from './minesProbability';

export const DEFAULT_TARGET_PERCENTAGE = 10; // +10% target
export const BANKROLL_STORAGE_KEY = 'mines_paper_bankroll_state_v1';

export function createInitialBankrollState(
  startingBalance: number | null = null,
  targetPercentage: number = DEFAULT_TARGET_PERCENTAGE
): BankrollState {
  const targetBalance = startingBalance !== null
    ? Number((startingBalance * (1 + targetPercentage / 100)).toFixed(2))
    : null;

  return {
    startingBalance,
    currentBalance: startingBalance,
    hypotheticalStake: startingBalance !== null ? Math.max(1, Math.round(startingBalance * 0.02)) : 10,
    targetPercentage,
    targetReached: false,
    targetBalance,
    totalPicksMade: 0,
    successfulPicks: 0,
    failedPicks: 0,
    grossReturnsTotal: 0,
    netProfitTotal: 0,
    peakBalance: startingBalance ?? 0,
    maxDrawdown: 0,
    maxDrawdownPercentage: 0,
    currentDrawdown: 0,
    currentWinStreak: 0,
    currentLossStreak: 0,
    maxWinStreak: 0,
    maxLossStreak: 0,
    sessionLog: [],
  };
}

/**
 * Initializes or updates bankroll starting balance when entered by user.
 */
export function setBankrollStartingBalance(
  currentState: BankrollState,
  newBalance: number,
  targetPercentage: number = currentState.targetPercentage
): BankrollState {
  if (newBalance <= 0) {
    throw new Error('Starting bankroll must be greater than zero.');
  }

  const targetBalance = Number((newBalance * (1 + targetPercentage / 100)).toFixed(2));
  const suggestedStake = Math.max(1, Number((newBalance * 0.02).toFixed(2))); // 2% suggested initial stake

  return {
    ...currentState,
    startingBalance: newBalance,
    currentBalance: newBalance,
    peakBalance: newBalance,
    hypotheticalStake: suggestedStake,
    targetPercentage,
    targetBalance,
    targetReached: false,
    currentDrawdown: 0,
    maxDrawdown: 0,
    maxDrawdownPercentage: 0,
    currentWinStreak: 0,
    currentLossStreak: 0,
    maxWinStreak: 0,
    maxLossStreak: 0,
    grossReturnsTotal: 0,
    netProfitTotal: 0,
    totalPicksMade: 0,
    successfulPicks: 0,
    failedPicks: 0,
    sessionLog: [],
  };
}

/**
 * Applies a simulated round outcome to the paper-trading bankroll.
 */
export function applyRoundToBankroll(
  currentState: BankrollState,
  round: {
    stake: number;
    multiplier: number;
    outcome: MinesOutcome;
    picksCount: number;
    successfulPicks: number;
    failedPicks: number;
  }
): BankrollState {
  if (currentState.startingBalance === null || currentState.currentBalance === null) {
    return currentState;
  }

  const { stake, multiplier, outcome, picksCount, successfulPicks, failedPicks } = round;
  const { grossPayout, netProfit } = calculateReturns(stake, multiplier, outcome);

  const newBalance = Number((currentState.currentBalance + netProfit).toFixed(2));
  const newPeak = Math.max(currentState.peakBalance, newBalance);

  const currentDrawdown = Math.max(0, Number((newPeak - newBalance).toFixed(2)));
  const newMaxDrawdown = Math.max(currentState.maxDrawdown, currentDrawdown);
  const maxDrawdownPercentage = newPeak > 0 ? Number(((newMaxDrawdown / newPeak) * 100).toFixed(2)) : 0;

  // Streak tracking
  let currentWinStreak = currentState.currentWinStreak;
  let currentLossStreak = currentState.currentLossStreak;
  let maxWinStreak = currentState.maxWinStreak;
  let maxLossStreak = currentState.maxLossStreak;

  if (outcome === 'loss') {
    currentLossStreak++;
    currentWinStreak = 0;
    maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
  } else {
    currentWinStreak++;
    currentLossStreak = 0;
    maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
  }

  // Target milestone check (+10% default)
  const targetReached = currentState.targetBalance !== null && newBalance >= currentState.targetBalance;

  const sessionEntry: BankrollSessionEntry = {
    id: `entry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    roundNumber: currentState.sessionLog.length + 1,
    stake,
    picks: picksCount,
    outcome,
    multiplier,
    grossPayout,
    netProfit,
    balanceAfter: newBalance,
  };

  return {
    ...currentState,
    currentBalance: newBalance,
    peakBalance: newPeak,
    targetReached,
    totalPicksMade: currentState.totalPicksMade + picksCount,
    successfulPicks: currentState.successfulPicks + successfulPicks,
    failedPicks: currentState.failedPicks + failedPicks,
    grossReturnsTotal: Number((currentState.grossReturnsTotal + grossPayout).toFixed(2)),
    netProfitTotal: Number((currentState.netProfitTotal + netProfit).toFixed(2)),
    currentDrawdown,
    maxDrawdown: newMaxDrawdown,
    maxDrawdownPercentage,
    currentWinStreak,
    currentLossStreak,
    maxWinStreak,
    maxLossStreak,
    sessionLog: [sessionEntry, ...currentState.sessionLog].slice(0, 50), // keep latest 50
  };
}

/**
 * Loads persisted paper bankroll state from localStorage.
 */
export function loadBankrollState(): BankrollState {
  if (typeof window === 'undefined') return createInitialBankrollState();
  try {
    const raw = localStorage.getItem(BANKROLL_STORAGE_KEY);
    if (!raw) return createInitialBankrollState();
    const parsed = JSON.parse(raw);
    return {
      ...createInitialBankrollState(),
      ...parsed,
    };
  } catch (e) {
    console.error('Failed to parse bankroll state from storage:', e);
    return createInitialBankrollState();
  }
}

/**
 * Saves paper bankroll state to localStorage.
 */
export function saveBankrollState(state: BankrollState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BANKROLL_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save bankroll state to storage:', e);
  }
}
