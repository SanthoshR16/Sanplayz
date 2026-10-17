import type { AdaptiveEvaluation, PredictionRecord, RouletteResult } from '../types/roulette';
import { calculateBayesianEstimate } from './bayesian';
import { getTheoreticalDistribution } from './probability';

/**
 * Generates an out-of-sample forecast for the upcoming step (stepNumber = history.length + 1)
 * strictly using data available up to the current history.
 * 
 * Uses Beta(1,1) conjugate update on historical counts as the adaptive model,
 * providing calibrated probabilistic predictions.
 */
export function generatePreResultForecast(
  history: RouletteResult[],
  sessionId: string,
  priorAlpha: number = 1,
  priorBeta: number = 1
): PredictionRecord {
  const stepNumber = history.length + 1;

  let redCount = 0;
  let blackCount = 0;
  let oddCount = 0;
  let evenCount = 0;

  for (const r of history) {
    if (r.color === 'red') redCount++;
    else if (r.color === 'black') blackCount++;
    if (r.parity === 'odd') oddCount++;
    else if (r.parity === 'even') evenCount++;
  }

  const redBayes = calculateBayesianEstimate('Red', redCount, blackCount, priorAlpha, priorBeta);
  const oddBayes = calculateBayesianEstimate('Odd', oddCount, evenCount, priorAlpha, priorBeta);

  const pRed = redBayes.posteriorMean;
  const pBlack = 1 - pRed;
  const pOdd = oddBayes.posteriorMean;
  const pEven = 1 - pOdd;

  return {
    stepNumber,
    sessionId,
    predictedAt: Date.now(),
    forecast: {
      pRed,
      pBlack,
      pOdd,
      pEven,
    },
    evaluated: false,
  };
}

/**
 * Evaluates stored predictions against actual results in strict temporal sequence.
 * Guarantees zero future data leakage.
 */
export function evaluatePredictions(
  predictions: PredictionRecord[],
  results: RouletteResult[]
): AdaptiveEvaluation {
  const warnings: string[] = [];

  // Match predictions with actual outcomes by stepNumber
  // Results are 0-indexed, so stepNumber 1 corresponds to results[0]
  const evaluatedPairs: Array<{
    pred: PredictionRecord;
    actual: RouletteResult;
  }> = [];

  for (const pred of predictions) {
    const idx = pred.stepNumber - 1;
    if (idx >= 0 && idx < results.length) {
      evaluatedPairs.push({
        pred,
        actual: results[idx],
      });
    }
  }

  const N = evaluatedPairs.length;

  if (N === 0) {
    return {
      totalEvaluated: 0,
      brierColor: 0,
      brierParity: 0,
      baselineBrierColor: 0.25,
      baselineBrierParity: 0.25,
      logLossColor: null,
      logLossParity: null,
      calibrationBinsColor: [],
      calibrationBinsParity: [],
      warnings: ['No paired pre-result predictions and actual outcomes have been evaluated yet.'],
    };
  }

  if (N < 20) {
    warnings.push(`Small evaluation sample (${N} predictions). Brier scores and log loss are highly volatile under N < 20.`);
  }

  let sumBrierColor = 0;
  let sumBrierParity = 0;
  let sumLogLossColor = 0;
  let sumLogLossParity = 0;

  // Theoretical baseline Brier (predicting 0.5 for fair binary)
  const theo = getTheoreticalDistribution();
  let sumBaseBrierColor = 0;
  let sumBaseBrierParity = 0;

  const EPS = 1e-15;

  for (const { pred, actual } of evaluatedPairs) {
    const isRed = actual.color === 'red' ? 1 : 0;
    const isOdd = actual.parity === 'odd' ? 1 : 0;

    // Color Brier: (pRed - isRed)^2
    sumBrierColor += Math.pow(pred.forecast.pRed - isRed, 2);
    sumBaseBrierColor += Math.pow(theo.pRed - isRed, 2);

    // Parity Brier: (pOdd - isOdd)^2
    sumBrierParity += Math.pow(pred.forecast.pOdd - isOdd, 2);
    sumBaseBrierParity += Math.pow(theo.pOdd - isOdd, 2);

    // Log loss
    const pRedClip = Math.max(EPS, Math.min(1 - EPS, pred.forecast.pRed));
    sumLogLossColor -= isRed * Math.log(pRedClip) + (1 - isRed) * Math.log(1 - pRedClip);

    const pOddClip = Math.max(EPS, Math.min(1 - EPS, pred.forecast.pOdd));
    sumLogLossParity -= isOdd * Math.log(pOddClip) + (1 - isOdd) * Math.log(1 - pOddClip);
  }

  const brierColor = sumBrierColor / N;
  const brierParity = sumBrierParity / N;
  const baselineBrierColor = sumBaseBrierColor / N;
  const baselineBrierParity = sumBaseBrierParity / N;
  const logLossColor = sumLogLossColor / N;
  const logLossParity = sumLogLossParity / N;

  // Calibration bins for Color [0-0.2, 0.2-0.4, 0.4-0.6, 0.6-0.8, 0.8-1.0]
  const bins = [
    { label: '0.0 – 0.2', min: 0.0, max: 0.2 },
    { label: '0.2 – 0.4', min: 0.2, max: 0.4 },
    { label: '0.4 – 0.6', min: 0.4, max: 0.6 },
    { label: '0.6 – 0.8', min: 0.6, max: 0.8 },
    { label: '0.8 – 1.0', min: 0.8, max: 1.0 },
  ];

  const calibrationBinsColor = bins.map((bin) => {
    const matches = evaluatedPairs.filter(
      (pair) => pair.pred.forecast.pRed >= bin.min && pair.pred.forecast.pRed < (bin.max === 1.0 ? 1.01 : bin.max)
    );
    const count = matches.length;
    const predictedAvg = count > 0 ? matches.reduce((s, m) => s + m.pred.forecast.pRed, 0) / count : 0;
    const observedFreq = count > 0 ? matches.filter((m) => m.actual.color === 'red').length / count : 0;

    return {
      binLabel: bin.label,
      predictedAvg,
      observedFreq,
      count,
    };
  });

  const calibrationBinsParity = bins.map((bin) => {
    const matches = evaluatedPairs.filter(
      (pair) => pair.pred.forecast.pOdd >= bin.min && pair.pred.forecast.pOdd < (bin.max === 1.0 ? 1.01 : bin.max)
    );
    const count = matches.length;
    const predictedAvg = count > 0 ? matches.reduce((s, m) => s + m.pred.forecast.pOdd, 0) / count : 0;
    const observedFreq = count > 0 ? matches.filter((m) => m.actual.parity === 'odd').length / count : 0;

    return {
      binLabel: bin.label,
      predictedAvg,
      observedFreq,
      count,
    };
  });

  if (Math.abs(brierColor - baselineBrierColor) < 0.01) {
    warnings.push('Adaptive model performance is statistically indistinguishable from the theoretical baseline (0.5).');
  }

  return {
    totalEvaluated: N,
    brierColor,
    brierParity,
    baselineBrierColor,
    baselineBrierParity,
    logLossColor,
    logLossParity,
    calibrationBinsColor,
    calibrationBinsParity,
    warnings,
  };
}
