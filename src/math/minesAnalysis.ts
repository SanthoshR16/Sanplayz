/**
 * Mines Statistical Analysis Engine.
 *
 * Implements:
 * - Tile frequency tracking (bombs and safe exposures).
 * - Pearson's Chi-Square Goodness-of-Fit test for uniform bomb distribution (24 df).
 * - Wald-Wolfowitz Runs Test for consecutive round independence.
 * - Wilson Score 95% confidence intervals.
 * - HMAC-SHA256 Provably Fair verification and deterministic outcome generator.
 *
 * CRITICAL RULE: Past tile outcomes do NOT influence future independent rounds.
 * Streakiness or hot/cold tiles in uniform independent RNG are purely retrospective noise.
 */

import type {
  ChiSquareUniformityResult,
  MinesRoundRecord,
  RunsTestResult,
  TileFrequencyStat,
} from '../types/mines';
import { hmacSha256, sha256Hex, stringToUtf8 } from './cryptoUtils';
import { TOTAL_TILES } from './minesProbability';

/**
 * Aggregates frequency statistics for each of the 25 tiles.
 */
export function computeTileFrequencies(
  rounds: MinesRoundRecord[],
  totalTiles: number = TOTAL_TILES
): TileFrequencyStat[] {
  const stats: TileFrequencyStat[] = Array.from({ length: totalTiles }, (_, index) => ({
    tileIndex: index,
    tileLabel: index + 1,
    bombCount: 0,
    safeCount: 0,
    totalExposures: 0,
    bombRate: 0,
  }));

  for (const round of rounds) {
    // If all bomb locations were recorded or revealed
    const bombs = round.allBombLocations && round.allBombLocations.length > 0
      ? round.allBombLocations
      : round.revealedBombTiles;

    for (const b of bombs) {
      if (b >= 0 && b < totalTiles) {
        stats[b].bombCount++;
        stats[b].totalExposures++;
      }
    }

    // Tally revealed safe tiles
    for (const s of round.revealedSafeTiles) {
      if (s >= 0 && s < totalTiles) {
        stats[s].safeCount++;
        stats[s].totalExposures++;
      }
    }
  }

  for (const stat of stats) {
    if (stat.totalExposures > 0) {
      stat.bombRate = Number((stat.bombCount / stat.totalExposures).toFixed(4));
    }
  }

  return stats;
}

/**
 * Pearson's Chi-Square Goodness-of-Fit test on tile bomb frequencies.
 * Tests H0: Bombs are uniformly distributed across all 25 tiles (E_i = TotalBombs / 25).
 * Degrees of freedom df = 24. Critical value at alpha=0.05 is ~36.415.
 */
export function calculateChiSquareUniformity(
  tileStats: TileFrequencyStat[],
  totalTiles: number = TOTAL_TILES
): ChiSquareUniformityResult {
  const totalBombsObserved = tileStats.reduce((sum, s) => sum + s.bombCount, 0);
  const df = totalTiles - 1; // 24
  const criticalValue05 = 36.415; // Chi-square critical value for df=24 at alpha=0.05

  if (totalBombsObserved === 0) {
    return {
      sampleSize: 0,
      chiSquareStatistic: 0,
      degreesOfFreedom: df,
      criticalValue05,
      pValue: 1.0,
      isUniform: true,
      expectedFrequencyPerTile: 0,
      explanation: 'Insufficient data: No bomb observations recorded yet.',
    };
  }

  const expected = totalBombsObserved / totalTiles;
  let chiSquare = 0;

  for (const stat of tileStats) {
    const diff = stat.bombCount - expected;
    chiSquare += (diff * diff) / expected;
  }

  chiSquare = Number(chiSquare.toFixed(4));

  // Approximate p-value using Wilson-Hilferty transformation
  const pValue = approximateChiSquarePValue(chiSquare, df);

  const isUniform = chiSquare <= criticalValue05;
  let explanation = '';

  if (expected < 5) {
    explanation = `Sample size is low (expected frequency per tile is ${expected.toFixed(1)} < 5). Chi-Square statistic is ${chiSquare} (critical: ${criticalValue05}, p ≈ ${pValue.toFixed(3)}). Statistical power is limited.`;
  } else if (isUniform) {
    explanation = `Chi-Square test (χ² = ${chiSquare}, df = 24, p = ${pValue.toFixed(3)}) does not reject uniform distribution at α = 0.05. Bomb placements are consistent with uniform randomness.`;
  } else {
    explanation = `Chi-Square test (χ² = ${chiSquare}, df = 24, p = ${pValue.toFixed(3)}) exceeds critical threshold (${criticalValue05}). Observed deviations from uniformity may indicate non-uniform generation or small-sample clustering.`;
  }

  return {
    sampleSize: totalBombsObserved,
    chiSquareStatistic: chiSquare,
    degreesOfFreedom: df,
    criticalValue05,
    pValue,
    isUniform,
    expectedFrequencyPerTile: Number(expected.toFixed(2)),
    explanation,
  };
}

/**
 * Wilson-Hilferty transformation for Chi-Square distribution p-value approximation.
 */
function approximateChiSquarePValue(x: number, df: number): number {
  if (x <= 0) return 1.0;
  // Wilson-Hilferty normal approximation for chi-square
  const z = (Math.pow(x / df, 1 / 3) - (1 - 2 / (9 * df))) / Math.sqrt(2 / (9 * df));
  // Standard normal survival function 1 - Phi(z)
  return Math.max(0, Math.min(1, 1 - standardNormalCdf(z)));
}

function standardNormalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

/**
 * Wald-Wolfowitz Runs Test on round outcomes ('win' / 'cashout' vs 'loss').
 * Tests whether outcomes occur independently without clustering or serial correlation.
 */
export function calculateRunsTest(outcomes: ('win' | 'loss' | 'cashout')[]): RunsTestResult {
  const binarySequence = outcomes.map((o) => (o === 'loss' ? 0 : 1));
  const n = binarySequence.length;

  const winsCount = binarySequence.filter((b) => b === 1).length;
  const lossesCount = binarySequence.filter((b) => b === 0).length;

  if (winsCount === 0 || lossesCount === 0 || n < 10) {
    return {
      sampleSize: n,
      runsCount: 0,
      winsCount,
      lossesCount,
      expectedRuns: 0,
      varianceRuns: 0,
      zScore: 0,
      pValue: 1.0,
      isRandom: true,
      explanation: 'Insufficient data for runs test (requires both wins and losses and at least 10 rounds).',
    };
  }

  // Count runs
  let runsCount = 1;
  for (let i = 1; i < n; i++) {
    if (binarySequence[i] !== binarySequence[i - 1]) {
      runsCount++;
    }
  }

  const expectedRuns = (2 * winsCount * lossesCount) / n + 1;
  const numerator = 2 * winsCount * lossesCount * (2 * winsCount * lossesCount - n);
  const denominator = n * n * (n - 1);
  const varianceRuns = denominator > 0 ? numerator / denominator : 0;

  const stdDev = Math.sqrt(Math.max(0, varianceRuns));
  const zScore = stdDev > 0 ? (runsCount - expectedRuns) / stdDev : 0;
  // Two-tailed p-value
  const pValue = 2 * (1 - standardNormalCdf(Math.abs(zScore)));
  const isRandom = Math.abs(zScore) < 1.96; // Fail to reject H0 at alpha=0.05

  const explanation = isRandom
    ? `Runs test (Runs = ${runsCount}, Expected = ${expectedRuns.toFixed(1)}, Z = ${zScore.toFixed(2)}, p = ${pValue.toFixed(3)}): Outcomes show no statistically significant streak clustering; consistent with independent trials.`
    : `Runs test (Runs = ${runsCount}, Expected = ${expectedRuns.toFixed(1)}, Z = ${zScore.toFixed(2)}, p = ${pValue.toFixed(3)}): Outcome sequence departs from expected run distribution at α = 0.05.`;

  return {
    sampleSize: n,
    runsCount,
    winsCount,
    lossesCount,
    expectedRuns: Number(expectedRuns.toFixed(2)),
    varianceRuns: Number(varianceRuns.toFixed(4)),
    zScore: Number(zScore.toFixed(4)),
    pValue: Number(pValue.toFixed(4)),
    isRandom,
    explanation,
  };
}

/**
 * Calculates Wilson Score 95% Confidence Interval for a proportion.
 */
export function calculateWilsonConfidenceInterval(
  successes: number,
  total: number,
  z: number = 1.96
): { lower: number; estimate: number; upper: number } {
  if (total <= 0) return { lower: 0, estimate: 0, upper: 0 };
  const p = successes / total;
  const z2 = z * z;
  const denominator = 1 + z2 / total;
  const center = (p + z2 / (2 * total)) / denominator;
  const spread = (z * Math.sqrt((p * (1 - p)) / total + z2 / (4 * total * total))) / denominator;

  return {
    lower: Math.max(0, Number((center - spread).toFixed(4))),
    estimate: Number(p.toFixed(4)),
    upper: Math.min(1, Number((center + spread).toFixed(4))),
  };
}

/**
 * Standard Provably Fair HMAC-SHA256 Outcome Generator.
 * Used by Stake, Spribe, and crypto casinos to place bombs deterministically.
 *
 * Algorithm:
 * 1. Seed HMAC: HMAC-SHA256(key = serverSeed, message = `${clientSeed}:${nonce}`)
 * 2. Parses byte stream into 32-bit floats.
 * 3. Uses Fisher-Yates sampling without replacement to pick distinct bomb tile indices from 0..24.
 */
export function generateProvablyFairOutcome(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  bombCount: number,
  totalTiles: number = TOTAL_TILES
): number[] {
  if (bombCount < 1 || bombCount >= totalTiles) {
    throw new Error(`Bomb count must be between 1 and ${totalTiles - 1}`);
  }

  const message = `${clientSeed}:${nonce}`;
  let hashBytes = hmacSha256(stringToUtf8(serverSeed), stringToUtf8(message));

  const tiles = Array.from({ length: totalTiles }, (_, i) => i);
  const bombLocations: number[] = [];

  let byteOffset = 0;
  let roundCounter = 0;

  while (bombLocations.length < bombCount) {
    // If we run out of 32 bytes, generate next block with suffix
    if (byteOffset + 4 > hashBytes.length) {
      roundCounter++;
      const nextMessage = `${clientSeed}:${nonce}:${roundCounter}`;
      hashBytes = hmacSha256(stringToUtf8(serverSeed), stringToUtf8(nextMessage));
      byteOffset = 0;
    }

    // Convert 4 bytes into 32-bit float [0, 1)
    const b0 = hashBytes[byteOffset];
    const b1 = hashBytes[byteOffset + 1];
    const b2 = hashBytes[byteOffset + 2];
    const b3 = hashBytes[byteOffset + 3];
    byteOffset += 4;

    const floatVal =
      b0 / 256 +
      b1 / (256 * 256) +
      b2 / (256 * 256 * 256) +
      b3 / (256 * 256 * 256 * 256);

    const remainingTilesCount = tiles.length;
    const selectedIndex = Math.floor(floatVal * remainingTilesCount);
    const chosenTile = tiles.splice(selectedIndex, 1)[0];
    bombLocations.push(chosenTile);
  }

  return bombLocations.sort((a, b) => a - b);
}

/**
 * Verifies a Provably Fair round against its pre-committed hash and seeds.
 */
export function verifyProvablyFairRound(
  serverSeed: string,
  expectedServerSeedHash: string,
  clientSeed: string,
  nonce: number,
  recordedBombs: number[],
  bombCount: number
): {
  isValidCommitment: boolean;
  matchesRecordedOutcome: boolean;
  computedHash: string;
  expectedHash: string;
  generatedBombs: number[];
} {
  const computedHash = sha256Hex(serverSeed);
  const isValidCommitment = computedHash.toLowerCase() === expectedServerSeedHash.trim().toLowerCase();

  const generatedBombs = generateProvablyFairOutcome(
    serverSeed,
    clientSeed,
    nonce,
    bombCount,
    TOTAL_TILES
  );

  const sortedRecorded = [...recordedBombs].sort((a, b) => a - b);
  const matchesRecordedOutcome =
    sortedRecorded.length === generatedBombs.length &&
    sortedRecorded.every((val, idx) => val === generatedBombs[idx]);

  return {
    isValidCommitment,
    matchesRecordedOutcome,
    computedHash,
    expectedHash: expectedServerSeedHash,
    generatedBombs,
  };
}
