import { describe, it, expect } from 'vitest';
import {
  createInitialBankrollState,
  setBankrollStartingBalance,
  applyRoundToBankroll,
} from '../math/minesBankroll';

describe('Mines Paper-Trading Bankroll Simulator Engine', () => {
  it('Requirement 9: Initial bankroll is un-prefilled (null)', () => {
    const initial = createInitialBankrollState();
    expect(initial.startingBalance).toBeNull();
    expect(initial.currentBalance).toBeNull();
    expect(initial.targetReached).toBe(false);
  });

  it('Requirement 9: User entry sets starting balance and +10% target milestone', () => {
    const initial = createInitialBankrollState();
    const configured = setBankrollStartingBalance(initial, 500, 10);

    expect(configured.startingBalance).toBe(500);
    expect(configured.currentBalance).toBe(500);
    expect(configured.peakBalance).toBe(500);
    expect(configured.targetPercentage).toBe(10);
    // Target balance = 500 * (1 + 0.10) = 550
    expect(configured.targetBalance).toBe(550);
    expect(configured.targetReached).toBe(false);
    // Suggested 2% stake = $10
    expect(configured.hypotheticalStake).toBe(10);
  });

  it('Requirement 9: Round outcomes accurately track gross returns, net profit, and balance', () => {
    let state = setBankrollStartingBalance(createInitialBankrollState(), 100, 10);

    // Round 1: Win at 1.45x with $10 stake -> Gross $14.50, Net +$4.50
    state = applyRoundToBankroll(state, {
      stake: 10,
      multiplier: 1.45,
      outcome: 'cashout',
      picksCount: 3,
      successfulPicks: 3,
      failedPicks: 0,
    });

    expect(state.currentBalance).toBe(104.50);
    expect(state.grossReturnsTotal).toBe(14.50);
    expect(state.netProfitTotal).toBe(4.50);
    expect(state.currentWinStreak).toBe(1);
    expect(state.currentLossStreak).toBe(0);
    expect(state.targetReached).toBe(false);

    // Round 2: Loss with $10 stake -> Net -$10.00
    state = applyRoundToBankroll(state, {
      stake: 10,
      multiplier: 0,
      outcome: 'loss',
      picksCount: 2,
      successfulPicks: 1,
      failedPicks: 1,
    });

    expect(state.currentBalance).toBe(94.50);
    expect(state.netProfitTotal).toBe(-5.50);
    expect(state.currentWinStreak).toBe(0);
    expect(state.currentLossStreak).toBe(1);
    expect(state.peakBalance).toBe(104.50);
    // Drawdown = Peak (104.50) - Current (94.50) = 10.00
    expect(state.currentDrawdown).toBe(10.00);
    expect(state.maxDrawdown).toBe(10.00);
  });

  it('Requirement 9: Reaching +10% target activates targetReached notification flag', () => {
    let state = setBankrollStartingBalance(createInitialBankrollState(), 100, 10);
    expect(state.targetBalance).toBe(110);
    expect(state.targetReached).toBe(false);

    // Win with $20 stake at 1.68x -> Net +$13.60 -> Balance $113.60 >= $110
    state = applyRoundToBankroll(state, {
      stake: 20,
      multiplier: 1.68,
      outcome: 'cashout',
      picksCount: 4,
      successfulPicks: 4,
      failedPicks: 0,
    });

    expect(state.currentBalance).toBe(113.60);
    expect(state.targetReached).toBe(true);
  });
});
