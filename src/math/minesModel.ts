/**
 * Mines Model Training, Validation, and Calibration Engine.
 *
 * Implements:
 * - Chronological out-of-sample train/test splits.
 * - Theoretical uniform baseline vs empirical spatial models (Hot/Cold frequency).
 * - Proper scoring rules: Brier Score and Log Loss.
 * - Rigorous reporting of negative results (proving why uniform baseline is optimal
 *   for independent random events and debunking "pattern recognition" betting bots).
 */

import type { MinesRoundRecord, ModelEvaluationReport } from '../types/mines';
import { TOTAL_TILES } from './minesProbability';

/**
 * Evaluates an empirical spatial coordinate model against the theoretical uniform baseline.
 * Uses strict chronological train/test split to prevent data leakage.
 */
export function evaluateCoordinatePredictor(
  rounds: MinesRoundRecord[],
  trainRatio: number = 0.70
): ModelEvaluationReport {
  // Filter rounds that have verified or recorded bomb locations
  const validRounds = rounds.filter(
    (r) => (r.allBombLocations && r.allBombLocations.length > 0) || r.revealedBombTiles.length > 0
  );

  if (validRounds.length < 10) {
    return {
      modelName: 'Empirical Hot/Cold Spatial Predictor vs Theoretical Baseline',
      trainSampleSize: 0,
      testSampleSize: validRounds.length,
      baselineBrierScore: 0,
      modelBrierScore: 0,
      baselineLogLoss: 0,
      modelLogLoss: 0,
      isBetterThanBaseline: false,
      conclusion: 'Insufficient historical sample size for out-of-sample model evaluation (minimum 10 completed rounds with bomb locations required).',
      notes: [
        'Theoretical baseline: Every unopened tile has equal safe probability (25 - B - k) / (25 - k).',
        'In an independent uniform RNG, historical bomb positions provide zero predictive power for future rounds.',
      ],
    };
  }

  // Chronological sort
  const sorted = [...validRounds].sort((a, b) => a.timestamp - b.timestamp);
  const splitIndex = Math.max(5, Math.floor(sorted.length * trainRatio));
  const trainRounds = sorted.slice(0, splitIndex);
  const testRounds = sorted.slice(splitIndex);

  if (testRounds.length === 0) {
    return {
      modelName: 'Empirical Hot/Cold Spatial Predictor vs Theoretical Baseline',
      trainSampleSize: trainRounds.length,
      testSampleSize: 0,
      baselineBrierScore: 0,
      modelBrierScore: 0,
      baselineLogLoss: 0,
      modelLogLoss: 0,
      isBetterThanBaseline: false,
      conclusion: 'Test set is empty after split; more observations required.',
      notes: [],
    };
  }

  // 1. Train empirical model: count bomb occurrences per tile with Laplace smoothing
  const bombCounts = new Array(TOTAL_TILES).fill(0);
  let totalTrainBombs = 0;

  for (const r of trainRounds) {
    const bombs = r.allBombLocations || r.revealedBombTiles;
    for (const b of bombs) {
      if (b >= 0 && b < TOTAL_TILES) {
        bombCounts[b]++;
        totalTrainBombs++;
      }
    }
  }

  // Empirical safe probability estimate per tile with Laplace smoothing (alpha=1, beta=1)
  // Higher bomb count implies lower safe probability in the heuristic model
  const trainRoundsCount = trainRounds.length;
  const empiricalTileSafeProb = bombCounts.map((count) => {
    const empiricalBombRate = (count + 1) / (trainRoundsCount + 2);
    return 1 - empiricalBombRate;
  });

  // 2. Evaluate both models on test rounds
  let baselineBrierSum = 0;
  let modelBrierSum = 0;
  let baselineLogLossSum = 0;
  let modelLogLossSum = 0;
  let totalPredictions = 0;

  const EPSILON = 1e-7;

  for (const r of testRounds) {
    const bombSet = new Set(r.allBombLocations || r.revealedBombTiles);
    const B = r.bombCount;
    const theoreticalInitialSafeProb = (TOTAL_TILES - B) / TOTAL_TILES;

    // Normalizing empirical model probabilities to average to (25 - B) / 25
    const empiricalSum = empiricalTileSafeProb.reduce((a, b) => a + b, 0);
    const scalingFactor = ((TOTAL_TILES - B)) / (empiricalSum || 1);

    for (let tile = 0; tile < TOTAL_TILES; tile++) {
      const isActuallySafe = bombSet.has(tile) ? 0 : 1;

      // Baseline prediction (Uniform prior)
      const pBaseline = theoreticalInitialSafeProb;

      // Model prediction (Spatial frequency based)
      let pModel = Math.max(EPSILON, Math.min(1 - EPSILON, empiricalTileSafeProb[tile] * scalingFactor));

      // Brier score: (p - o)^2
      baselineBrierSum += Math.pow(pBaseline - isActuallySafe, 2);
      modelBrierSum += Math.pow(pModel - isActuallySafe, 2);

      // Log loss: -[o * ln(p) + (1-o) * ln(1-p)]
      baselineLogLossSum += -(
        isActuallySafe * Math.log(Math.max(EPSILON, pBaseline)) +
        (1 - isActuallySafe) * Math.log(Math.max(EPSILON, 1 - pBaseline))
      );
      modelLogLossSum += -(
        isActuallySafe * Math.log(pModel) +
        (1 - isActuallySafe) * Math.log(1 - pModel)
      );

      totalPredictions++;
    }
  }

  const baselineBrierScore = Number((baselineBrierSum / totalPredictions).toFixed(4));
  const modelBrierScore = Number((modelBrierSum / totalPredictions).toFixed(4));
  const baselineLogLoss = Number((baselineLogLossSum / totalPredictions).toFixed(4));
  const modelLogLoss = Number((modelLogLossSum / totalPredictions).toFixed(4));

  // A lower Brier score and Log Loss indicates a better, more calibrated model
  const isBetterThanBaseline = modelBrierScore < baselineBrierScore && modelLogLoss < baselineLogLoss;

  const conclusion = isBetterThanBaseline
    ? 'Empirical model showed marginal statistical advantage on this specific test partition, likely due to small-sample variance.'
    : 'Negative Result Confirmed: The theoretical uniform baseline outperformed or matched the empirical coordinate model (lower Brier Score and Log Loss). Under independent uniform random placement, historical tile frequencies fit noise and do not predict future bomb positions.';

  return {
    modelName: 'Empirical Hot/Cold Spatial Predictor vs Theoretical Baseline',
    trainSampleSize: trainRounds.length,
    testSampleSize: testRounds.length,
    baselineBrierScore,
    modelBrierScore,
    baselineLogLoss,
    modelLogLoss,
    isBetterThanBaseline,
    conclusion,
    notes: [
      `Evaluated on ${totalPredictions} out-of-sample tile observations across ${testRounds.length} test rounds.`,
      `Baseline Brier: ${baselineBrierScore} vs Model Brier: ${modelBrierScore} (lower is better).`,
      `Baseline Log Loss: ${baselineLogLoss} vs Model Log Loss: ${modelLogLoss} (lower is better).`,
      'Honest predictive limit: No machine learning or pattern-tracking algorithm can predict uniform independent RNG coordinates.',
    ],
  };
}
