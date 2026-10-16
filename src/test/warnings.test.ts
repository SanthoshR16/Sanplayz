import { describe, it, expect } from 'vitest';
import { calculateObservedFrequencies } from '../math/probability';
import { calculateChiSquareTest, calculateRunsTest } from '../math/randomness';
import { evaluatePredictions } from '../math/adaptive';
import { calculateStreaks } from '../math/streaks';

describe('Test 18 & 19: Empty State Honesty and Small-Sample Statistical Warnings', () => {
  it('Requirement 18: Empty history does not produce fabricated analysis or false data', () => {
    const emptyObs = calculateObservedFrequencies([]);
    expect(emptyObs.total).toBe(0);
    expect(emptyObs.redCount).toBe(0);
    expect(emptyObs.blackCount).toBe(0);
    expect(emptyObs.redFreq).toBe(0);
    expect(emptyObs.blackFreq).toBe(0);
    expect(emptyObs.oddCount).toBe(0);
    expect(emptyObs.evenCount).toBe(0);

    const emptyStreaks = calculateStreaks([]);
    expect(emptyStreaks.currentParityStreak.length).toBe(0);
    expect(emptyStreaks.currentParityStreak.parity).toBeNull();
    expect(emptyStreaks.currentColorStreak.length).toBe(0);
    expect(emptyStreaks.currentColorStreak.color).toBeNull();

    const emptyEval = evaluatePredictions([], []);
    expect(emptyEval.totalEvaluated).toBe(0);
    expect(emptyEval.warnings).toContain(
      'No paired pre-result predictions and actual outcomes have been evaluated yet.'
    );
  });

  it('Requirement 19: Statistical warnings appear when sample sizes are inadequate', () => {
    // 1. Chi-Square test with small N = 6
    const smallObserved = { red: 4, black: 2 };
    const theoProbs = { red: 0.5, black: 0.5 };
    const chiResult = calculateChiSquareTest('Red/Black Fit', smallObserved, theoProbs);

    expect(chiResult.assumptionsMet).toBe(false);
    expect(chiResult.warning).toBeDefined();
    expect(chiResult.warning).toContain('Sample size (6) is very small');

    // 2. Runs test with tiny sequence
    const smallSeq = ['red', 'red', 'black'];
    const runsResult = calculateRunsTest('Red/Black Runs', smallSeq);
    expect(runsResult.warning).toBeDefined();
    expect(runsResult.warning).toContain('Sub-group counts');

    // 3. Adaptive evaluation warning on small samples
    const evalResult = evaluatePredictions(
      [
        {
          stepNumber: 1,
          sessionId: 's',
          predictedAt: 1,
          forecast: { pRed: 0.5, pBlack: 0.5, pOdd: 0.5, pEven: 0.5 },
          evaluated: true,
        },
      ],
      [
        {
          number: 3,
          color: 'red',
          parity: 'odd',
          joint: 'red-odd',
          timestamp: 1,
          sessionId: 's',
        },
      ]
    );

    expect(evalResult.warnings.some((w) => w.includes('Small evaluation sample'))).toBe(true);
  });
});
