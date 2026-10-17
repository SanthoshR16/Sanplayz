/**
 * Mines Multiplier Schedule and House Edge Engine.
 *
 * Implements the user-provided 3-bomb reference schedule,
 * theoretical fair multiplier calculations, implied RTP / house edge verification,
 * dynamic schedule generation for any bomb count, and inconsistency detection.
 */

import type { MultiplierStep } from '../types/mines';
import { getSurvivalProbability, getTheoreticalFairMultiplier, TOTAL_TILES } from './minesProbability';

/**
 * User-supplied reference multiplier table for 3 bombs (22 possible safe picks).
 * Corresponds to standard 97% RTP (3.00% house edge) schedule.
 */
export const USER_3_BOMB_MULTIPLIERS: Record<number, number> = {
  1: 1.10,
  2: 1.26,
  3: 1.45,
  4: 1.68,
  5: 1.96,
  6: 2.30,
  7: 2.73,
  8: 3.28,
  9: 3.98,
  10: 4.90,
  11: 6.13,
  12: 7.80,
  13: 10.14,
  14: 13.52,
  15: 18.59,
  16: 26.56,
  17: 39.84,
  18: 63.74,
  19: 111.55,
  20: 223.10,
  21: 557.75,
  22: 2231.00,
};

export const DEFAULT_RTP = 0.97; // 97% Return to Player (3% house edge)

/**
 * Generates theoretical schedule for any bomb count B with a target RTP.
 * Formula: M(k) = RTP * (1 / P(S_k)) = RTP * (C(25, k) / C(25 - B, k))
 */
export function generateTheoreticalSchedule(
  bombCount: number,
  rtp: number = DEFAULT_RTP,
  totalTiles: number = TOTAL_TILES
): Record<number, number> {
  const maxSafe = totalTiles - bombCount;
  const schedule: Record<number, number> = {};

  for (let k = 1; k <= maxSafe; k++) {
    const survivalProb = getSurvivalProbability(bombCount, k, totalTiles);
    if (survivalProb <= 0) break;
    const fairMult = 1 / survivalProb;
    // Round to 2 decimal places as in standard provider displays
    const rawMult = rtp * fairMult;
    schedule[k] = rawMult >= 100 ? Number(rawMult.toFixed(2)) : Number(rawMult.toFixed(2));
  }

  return schedule;
}

/**
 * Builds full MultiplierStep array with survival probabilities, fair multipliers,
 * and implied house edge for each pick.
 */
export function buildMultiplierSchedule(
  bombCount: number,
  customOverrides?: Record<number, number>,
  rtp: number = DEFAULT_RTP,
  totalTiles: number = TOTAL_TILES
): MultiplierStep[] {
  const maxSafe = totalTiles - bombCount;
  const steps: MultiplierStep[] = [];

  // Default fallback schedule
  const baseSchedule = bombCount === 3
    ? USER_3_BOMB_MULTIPLIERS
    : generateTheoreticalSchedule(bombCount, rtp, totalTiles);

  for (let k = 1; k <= maxSafe; k++) {
    const survivalProb = getSurvivalProbability(bombCount, k, totalTiles);
    const fairMultiplier = getTheoreticalFairMultiplier(bombCount, k, totalTiles);

    let mult = customOverrides?.[k] ?? baseSchedule[k];
    if (mult === undefined) {
      mult = Number((rtp * fairMultiplier).toFixed(2));
    }

    const impliedRtp = fairMultiplier > 0 ? mult / fairMultiplier : 0;
    const impliedHouseEdge = 1 - impliedRtp;

    steps.push({
      hitNumber: k,
      multiplier: mult,
      survivalProb,
      fairMultiplier,
      impliedRtp,
      impliedHouseEdge,
      isUserOverridden: customOverrides?.[k] !== undefined,
    });
  }

  return steps;
}

export interface MultiplierInconsistency {
  hitNumber: number;
  type: 'non_increasing' | 'less_than_one' | 'negative_house_edge' | 'extreme_house_edge';
  message: string;
}

/**
 * Validates a multiplier schedule and flags inconsistencies.
 */
export function validateMultiplierSchedule(
  steps: MultiplierStep[]
): MultiplierInconsistency[] {
  const issues: MultiplierInconsistency[] = [];

  for (let i = 0; i < steps.length; i++) {
    const current = steps[i];
    const prev = i > 0 ? steps[i - 1] : null;

    if (current.multiplier <= 1.0) {
      issues.push({
        hitNumber: current.hitNumber,
        type: 'less_than_one',
        message: `Pick ${current.hitNumber}: Multiplier (${current.multiplier}x) must be greater than 1.0x.`,
      });
    }

    if (prev && current.multiplier <= prev.multiplier) {
      issues.push({
        hitNumber: current.hitNumber,
        type: 'non_increasing',
        message: `Pick ${current.hitNumber}: Multiplier (${current.multiplier}x) does not exceed previous pick (${prev.multiplier}x).`,
      });
    }

    if (current.impliedHouseEdge < -0.001) {
      issues.push({
        hitNumber: current.hitNumber,
        type: 'negative_house_edge',
        message: `Pick ${current.hitNumber}: Multiplier (${current.multiplier}x) exceeds fair multiplier (${current.fairMultiplier.toFixed(2)}x), implying negative house edge (${(current.impliedHouseEdge * 100).toFixed(2)}%). No commercial provider offers this.`,
      });
    } else if (current.impliedHouseEdge > 0.25) {
      issues.push({
        hitNumber: current.hitNumber,
        type: 'extreme_house_edge',
        message: `Pick ${current.hitNumber}: Multiplier implies an unusually steep house edge of ${(current.impliedHouseEdge * 100).toFixed(1)}%.`,
      });
    }
  }

  return issues;
}
