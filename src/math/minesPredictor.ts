/**
 * Mines Prediction and Probability Analysis Pipeline.
 *
 * Implements the prediction generation pipeline requested in the master correction:
 * 1. User configures bombs and picks.
 * 2. Model computes theoretical baseline survival probability and gross returns.
 * 3. Model analyzes empirical historical rounds (if available) to identify hot/cold bomb coordinates
 *    and avoids high-frequency bomb locations.
 * 4. Transparently labels output with signal type, explanation, and sample size.
 */

import type { MinesRoundRecord, ModelPrediction } from '../types/mines';
import { getSurvivalProbability, TOTAL_TILES } from './minesProbability';
import { buildMultiplierSchedule } from './minesMultiplier';

export function generateModelPrediction(
  bombCount: number,
  pickCount: number = 3,
  stake: number = 10,
  history: MinesRoundRecord[] = []
): ModelPrediction {
  const maxPicks = Math.min(10, TOTAL_TILES - bombCount);
  const safePickCount = Math.max(1, Math.min(pickCount, maxPicks));

  // Combinatorial survival probability P(S_k) = C(25 - B, k) / C(25, k)
  const theoreticalSafeProb = getSurvivalProbability(bombCount, safePickCount, TOTAL_TILES);

  // Multiplier from verified schedule
  const schedule = buildMultiplierSchedule(bombCount);
  const step = schedule.find((s) => s.hitNumber === safePickCount);
  const grossMultiplier = step ? step.multiplier : 1.0;

  const potentialGrossPayout = Number((stake * grossMultiplier).toFixed(2));
  const potentialNetProfit = Number((stake * (grossMultiplier - 1)).toFixed(2));

  const availableTiles = Array.from({ length: TOTAL_TILES }, (_, i) => i);
  const suggestedTiles: number[] = [];

  // Empirical learning from recorded rounds:
  const validHistory = history.filter((r) => r.validationStatus !== 'invalid');

  if (validHistory.length > 0) {
    // Count observed bomb hits per tile
    const bombHitsPerTile = new Array(TOTAL_TILES).fill(0);
    let totalBombsRecorded = 0;

    validHistory.forEach((round) => {
      const bombs = (round.allBombLocations && round.allBombLocations.length > 0)
        ? round.allBombLocations
        : round.revealedBombTiles || [];
      bombs.forEach((bIdx) => {
        if (bIdx >= 0 && bIdx < TOTAL_TILES) {
          bombHitsPerTile[bIdx] += 1;
          totalBombsRecorded += 1;
        }
      });
    });

    // Score tiles using empirical Bayesian smoothing:
    // bombRate = (bombHits + prior) / (rounds + priorWeight)
    // Lower bombRate => statistically safer coordinate according to empirical observations
    const scoredTiles = availableTiles.map((idx) => {
      const hits = bombHitsPerTile[idx];
      // Add slight jitter for tie-breaking
      const jitter = ((idx * 17 + 3) % 100) / 10000;
      return {
        idx,
        hits,
        bombRate: (hits + 0.5) / (validHistory.length + 1) + jitter,
      };
    });

    // Sort ascending by bomb rate (safest empirical coordinates first)
    scoredTiles.sort((a, b) => a.bombRate - b.bombRate);
    suggestedTiles.push(...scoredTiles.slice(0, safePickCount).map((t) => t.idx));
    suggestedTiles.sort((a, b) => a - b);

    const signalType = validHistory.length >= 5 ? 'experimental_signal' : 'unvalidated_heuristic';
    const explanation = `Adaptive Empirical Model (trained on N=${validHistory.length} observed rounds, ${totalBombsRecorded} bomb occurrences): Coordinates with lower observed bomb frequencies (${suggestedTiles.map((t) => t + 1).join(', ')}) were selected while actively avoiding recently reported bomb coordinates. Theoretical survival probability is ${(theoreticalSafeProb * 100).toFixed(2)}%.`;

    return {
      id: `pred_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      bombCount,
      suggestedTiles,
      pickCount: safePickCount,
      theoreticalSafeProb,
      grossMultiplier,
      potentialGrossPayout,
      potentialNetProfit,
      signalType,
      explanation,
    };
  }

  // Baseline when no history is yet recorded: unranked uniform random selection
  const pool = [...availableTiles];
  for (let i = 0; i < safePickCount; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    suggestedTiles.push(pool.splice(idx, 1)[0]);
  }
  suggestedTiles.sort((a, b) => a - b);

  const signalType = 'theoretical_baseline';
  const explanation = `Theoretical Baseline: For ${bombCount} bombs, the exact probability of surviving ${safePickCount} consecutive safe pick(s) is ${(theoreticalSafeProb * 100).toFixed(2)}%. Because Spribe and certified providers use independent uniform RNG, no coordinate is inherently safer than any other. Highlighted tiles (${suggestedTiles.map((t) => t + 1).join(', ')}) are unranked illustrative selections for this evaluation trial.`;

  return {
    id: `pred_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    bombCount,
    suggestedTiles,
    pickCount: safePickCount,
    theoreticalSafeProb,
    grossMultiplier,
    potentialGrossPayout,
    potentialNetProfit,
    signalType,
    explanation,
  };
}
