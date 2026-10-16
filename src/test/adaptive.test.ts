import { describe, it, expect } from 'vitest';
import { evaluatePredictions, generatePreResultForecast } from '../math/adaptive';
import { classifyNumber } from '../math/mapping';
import type { PredictionRecord, RouletteResult } from '../types/roulette';

function makeResult(n: number, id: number): RouletteResult {
  const c = classifyNumber(n);
  return {
    id,
    number: c.number,
    color: c.color,
    parity: c.parity,
    joint: c.joint,
    timestamp: 1000 + id * 10,
    sessionId: 'test-session',
  };
}

describe('Test 12 & 13: Pre-Result Predictions and Zero Future-Data Leakage', () => {
  it('Requirement 12: Predictions are recorded before outcomes are entered', () => {
    const history: RouletteResult[] = [];

    // Before outcome 1 arrives, forecast for step 1 is generated
    const pred1 = generatePreResultForecast(history, 'test-session');
    expect(pred1.stepNumber).toBe(1);
    expect(pred1.forecast.pRed).toBe(0.5); // Beta(1,1) prior mean: 1 / (1 + 1) = 0.5
    expect(pred1.forecast.pOdd).toBe(0.5);

    // Now outcome 1 (number 3 -> Red, Odd) arrives
    history.push(makeResult(3, 1));

    // Before outcome 2 arrives, forecast for step 2 is generated
    const pred2 = generatePreResultForecast(history, 'test-session');
    expect(pred2.stepNumber).toBe(2);
    // Updated on 1 Red: Beta(1+1, 1+0) = Beta(2, 1) => mean = 2/3 = 0.6667
    expect(pred2.forecast.pRed).toBeCloseTo(2 / 3, 4);

    // Verify predictions were stamped before outcome
    expect(pred1.stepNumber).toBeLessThan(pred2.stepNumber);
  });

  it('Requirement 13: Historical model evaluation has no future-data leakage', () => {
    // Generate an experimental run of 5 steps
    const numbers = [3, 8, 6, 23, 36];
    const history: RouletteResult[] = [];
    const predictions: PredictionRecord[] = [];

    for (let step = 0; step < numbers.length; step++) {
      // 1. Prediction generated BEFORE result is added
      const pred = generatePreResultForecast(history, 'leak-test');
      expect(pred.stepNumber).toBe(step + 1);
      predictions.push(pred);

      // 2. Only then is result added to history
      history.push(makeResult(numbers[step], step + 1));
    }

    // Evaluate predictions
    const evalResult = evaluatePredictions(predictions, history);

    expect(evalResult.totalEvaluated).toBe(5);
    expect(evalResult.brierColor).toBeGreaterThan(0);
    expect(evalResult.brierParity).toBeGreaterThan(0);
    expect(evalResult.baselineBrierColor).toBeGreaterThan(0);
    expect(evalResult.warnings.length).toBeGreaterThan(0); // Small sample warning under N < 20
  });
});
