import { describe, it, expect } from 'vitest';
import {
  combinations,
  getInitialSafeProbability,
  getConditionalSafeProbability,
  getSurvivalProbability,
  calculateReturns,
  calculateExpectedValue,
  getProbabilityBreakdown,
} from '../math/minesProbability';

describe('Mines 5x5 Probability Engine', () => {
  it('Requirement 4: Combinations C(n, k) calculated correctly', () => {
    expect(combinations(25, 0)).toBe(1);
    expect(combinations(25, 1)).toBe(25);
    expect(combinations(25, 2)).toBe(300);
    expect(combinations(25, 3)).toBe(2300);
    expect(combinations(22, 1)).toBe(22);
    expect(combinations(22, 2)).toBe(231);
    expect(combinations(22, 3)).toBe(1540);
  });

  it('Requirement 4: Initial safe-tile probability for 3 bombs is 22/25 = 88%', () => {
    const initialProb = getInitialSafeProbability(3, 25);
    expect(initialProb).toBe(22 / 25);
    expect(initialProb).toBe(0.88);
  });

  it('Requirement 4: Conditional safe probabilities after k known-safe picks', () => {
    // After 1 known-safe tile revealed: 21/24 = 87.5%
    const probAfter1 = getConditionalSafeProbability(3, 1, 25);
    expect(probAfter1).toBe(21 / 24);
    expect(probAfter1).toBe(0.875);

    // After 2 known-safe tiles revealed: 20/23 ≈ 86.9565%
    const probAfter2 = getConditionalSafeProbability(3, 2, 25);
    expect(probAfter2).toBe(20 / 23);
    expect(Number((probAfter2 * 100).toFixed(2))).toBe(86.96);

    // After 21 known-safe tiles revealed: (22 - 21) / (25 - 21) = 1/4 = 25%
    const probAfter21 = getConditionalSafeProbability(3, 21, 25);
    expect(probAfter21).toBe(1 / 4);
    expect(probAfter21).toBe(0.25);
  });

  it('Requirement 4: Multiple-pick survival probability using product and combinations', () => {
    // 1st pick: 22/25 = 0.88
    expect(getSurvivalProbability(3, 1, 25)).toBe(0.88);

    // 2 consecutive picks: (22/25) * (21/24) = 462 / 600 = 0.77
    const prob2 = getSurvivalProbability(3, 2, 25);
    expect(prob2).toBeCloseTo(0.77, 4);

    // 3 consecutive picks: (22/25) * (21/24) * (20/23) = 9240 / 13800 ≈ 0.669565
    const prob3 = getSurvivalProbability(3, 3, 25);
    expect(prob3).toBeCloseTo(9240 / 13800, 5);

    // 22 consecutive picks (clearing board): C(22, 22) / C(25, 22) = 1 / 2300 ≈ 0.00043478
    const prob22 = getSurvivalProbability(3, 22, 25);
    expect(prob22).toBeCloseTo(1 / 2300, 7);
  });

  it('Requirement 4 & 5: Edge cases and input validation', () => {
    // Bomb count 1: initial safe prob 24/25 = 0.96
    expect(getInitialSafeProbability(1, 25)).toBe(24 / 25);

    // Bomb count 24: initial safe prob 1/25 = 0.04
    expect(getInitialSafeProbability(24, 25)).toBe(1 / 25);

    // 0 picks survival prob is 1.0
    expect(getSurvivalProbability(3, 0, 25)).toBe(1.0);

    // Invalid bomb counts throw errors
    expect(() => getInitialSafeProbability(0, 25)).toThrow();
    expect(() => getInitialSafeProbability(25, 25)).toThrow();
    expect(() => getConditionalSafeProbability(3, 22, 25)).toThrow();
  });

  it('Requirement 5: Gross return vs net profit arithmetic', () => {
    const stake = 10;
    const multiplier = 1.45;

    // On win/cashout
    const win = calculateReturns(stake, multiplier, 'cashout');
    expect(win.grossPayout).toBe(14.50);
    expect(win.netProfit).toBe(4.50);

    // On loss
    const loss = calculateReturns(stake, multiplier, 'loss');
    expect(loss.grossPayout).toBe(0);
    expect(loss.netProfit).toBe(-10);
  });

  it('Requirement 6: Expected value calculation under house edge', () => {
    const stake = 100;
    // For 1st pick: P = 0.88, multiplier = 1.10x
    // EV = 100 * (0.88 * 1.10 - 1) = 100 * (0.968 - 1) = -3.20 (matches ~3% house edge)
    const ev1 = calculateExpectedValue(stake, 1.10, 0.88);
    expect(ev1).toBeCloseTo(-3.20, 2);

    // For fair multiplier: M_fair = 1 / 0.88 = 1.13636
    // EV = 100 * (0.88 * (1/0.88) - 1) = 0.00
    const evFair = calculateExpectedValue(stake, 1 / 0.88, 0.88);
    expect(evFair).toBeCloseTo(0.00, 2);
  });

  it('Requirement 10: Complete probability breakdown generation', () => {
    const breakdown = getProbabilityBreakdown(3, 1, 50, 1.10, 1.26);
    expect(breakdown.bombCount).toBe(3);
    expect(breakdown.revealedSafeCount).toBe(1);
    expect(breakdown.remainingSafeTiles).toBe(21);
    expect(breakdown.remainingTiles).toBe(24);
    expect(breakdown.nextPickSafeProb).toBe(21 / 24);
    expect(breakdown.userMultiplierCurrent).toBe(1.10);
    expect(breakdown.nextPickMultiplier).toBe(1.26);
    expect(breakdown.nextGrossPayout).toBe(63.00); // 50 * 1.26
    expect(breakdown.nextNetProfit).toBe(13.00);  // 50 * 0.26
  });
});
