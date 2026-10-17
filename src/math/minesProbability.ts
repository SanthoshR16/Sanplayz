/**
 * Mines 5x5 Probability Engine.
 * Exact theoretical combinatorial formulas for 25-tile Mines games.
 *
 * NOTE: Probabilities describe the game rules and board state.
 * They do NOT identify the coordinates of hidden bombs under independent uniform random placement.
 */

import type { ProbabilityBreakdown } from '../types/mines';

export const TOTAL_TILES = 25;
export const BOARD_ROWS = 5;
export const BOARD_COLS = 5;

/**
 * Calculates binomial coefficient C(n, k) = n! / (k! * (n - k)!).
 */
export function combinations(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  const c = Math.min(k, n - k);
  let result = 1;
  for (let i = 1; i <= c; i++) {
    result = (result * (n - c + i)) / i;
  }
  return Math.round(result);
}

/**
 * Calculates initial safe-tile probability for a given bomb count B:
 * P(safe_1) = (25 - B) / 25
 */
export function getInitialSafeProbability(bombCount: number, totalTiles: number = TOTAL_TILES): number {
  if (bombCount < 1 || bombCount >= totalTiles) {
    throw new Error(`Bomb count must be between 1 and ${totalTiles - 1}, received ${bombCount}`);
  }
  return (totalTiles - bombCount) / totalTiles;
}

/**
 * Calculates the conditional safe probability for the next pick after k known-safe tiles have been revealed:
 * P(safe_{k+1} | k safe revealed) = (25 - B - k) / (25 - k)
 */
export function getConditionalSafeProbability(
  bombCount: number,
  revealedSafeCount: number,
  totalTiles: number = TOTAL_TILES
): number {
  if (bombCount < 1 || bombCount >= totalTiles) {
    throw new Error(`Bomb count must be between 1 and ${totalTiles - 1}`);
  }
  const maxSafe = totalTiles - bombCount;
  if (revealedSafeCount < 0 || revealedSafeCount >= maxSafe) {
    throw new Error(`Revealed safe count must be between 0 and ${maxSafe - 1}`);
  }
  const remainingSafe = totalTiles - bombCount - revealedSafeCount;
  const remainingTiles = totalTiles - revealedSafeCount;
  return remainingSafe / remainingTiles;
}

/**
 * Calculates the exact probability of surviving k consecutive safe picks without replacement:
 * P(S_k) = Product_{i=0}^{k-1} ((25 - B - i) / (25 - i)) = C(25 - B, k) / C(25, k)
 */
export function getSurvivalProbability(
  bombCount: number,
  picksCount: number,
  totalTiles: number = TOTAL_TILES
): number {
  if (bombCount < 1 || bombCount >= totalTiles) {
    throw new Error(`Bomb count must be between 1 and ${totalTiles - 1}`);
  }
  if (picksCount === 0) return 1.0;
  const maxSafe = totalTiles - bombCount;
  if (picksCount < 0 || picksCount > maxSafe) {
    return 0.0;
  }

  // Exact combinatorial calculation C(25 - B, k) / C(25, k)
  const safeCombinations = combinations(totalTiles - bombCount, picksCount);
  const totalCombinations = combinations(totalTiles, picksCount);
  if (totalCombinations === 0) return 0;
  return safeCombinations / totalCombinations;
}

/**
 * Computes theoretical fair gross multiplier for surviving k picks:
 * M_fair = 1 / P(S_k)
 */
export function getTheoreticalFairMultiplier(
  bombCount: number,
  picksCount: number,
  totalTiles: number = TOTAL_TILES
): number {
  const prob = getSurvivalProbability(bombCount, picksCount, totalTiles);
  if (prob <= 0) return Infinity;
  return 1 / prob;
}

/**
 * Distinguishes gross payout from net profit:
 * - Gross Return: S * M
 * - Net Profit: S * (M - 1)
 * - Loss: -S
 */
export function calculateReturns(stake: number, grossMultiplier: number, outcome: 'win' | 'loss' | 'cashout') {
  if (stake < 0) throw new Error('Stake cannot be negative');
  if (outcome === 'loss') {
    return {
      grossPayout: 0,
      netProfit: -stake,
    };
  }
  const grossPayout = Number((stake * grossMultiplier).toFixed(2));
  const netProfit = Number((stake * (grossMultiplier - 1)).toFixed(2));
  return {
    grossPayout,
    netProfit,
  };
}

/**
 * Calculates expected value (EV) for surviving k picks at a given gross multiplier:
 * EV = P(S_k) * (Stake * M) - Stake = Stake * (P(S_k) * M - 1)
 */
export function calculateExpectedValue(stake: number, grossMultiplier: number, survivalProb: number): number {
  return Number((stake * (survivalProb * grossMultiplier - 1)).toFixed(4));
}

/**
 * Returns full probability breakdown for the current game state.
 */
export function getProbabilityBreakdown(
  bombCount: number,
  revealedSafeCount: number,
  stake: number,
  currentMultiplier: number,
  nextMultiplier: number
): ProbabilityBreakdown {
  const totalTiles = TOTAL_TILES;
  const maxSafe = totalTiles - bombCount;
  const remainingTiles = Math.max(0, totalTiles - revealedSafeCount);
  const remainingSafeTiles = Math.max(0, maxSafe - revealedSafeCount);
  const initialSafeProb = getInitialSafeProbability(bombCount, totalTiles);

  let nextPickSafeProb = 0;
  if (revealedSafeCount < maxSafe && remainingTiles > 0) {
    nextPickSafeProb = remainingSafeTiles / remainingTiles;
  }

  const cumulativeSurvivalProb = getSurvivalProbability(bombCount, revealedSafeCount, totalTiles);
  const nextCumulativeSurvivalProb = getSurvivalProbability(bombCount, revealedSafeCount + 1, totalTiles);
  const fairMultiplierCurrent = cumulativeSurvivalProb > 0 ? 1 / cumulativeSurvivalProb : Infinity;

  const { grossPayout: nextGrossPayout, netProfit: nextNetProfit } = calculateReturns(
    stake,
    nextMultiplier,
    'win'
  );

  const expectedValue = calculateExpectedValue(stake, nextMultiplier, nextCumulativeSurvivalProb);

  return {
    bombCount,
    totalTiles,
    revealedSafeCount,
    remainingTiles,
    remainingSafeTiles,
    initialSafeProb,
    nextPickSafeProb,
    cumulativeSurvivalProb,
    fairMultiplierCurrent,
    userMultiplierCurrent: currentMultiplier,
    nextPickMultiplier: nextMultiplier,
    nextGrossPayout,
    nextNetProfit,
    expectedValue,
  };
}
