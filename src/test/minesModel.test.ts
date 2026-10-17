import { describe, it, expect } from 'vitest';
import { evaluateCoordinatePredictor } from '../math/minesModel';
import type { MinesRoundRecord } from '../types/mines';

describe('Mines Model Training, Validation, and Calibration', () => {
  it('Requirement 8: Returns sample size notification when fewer than 10 rounds are present', () => {
    const report = evaluateCoordinatePredictor([]);
    expect(report.conclusion).toContain('Insufficient historical sample size');
  });

  it('Requirement 8: Out-of-sample evaluation calculates Brier score and documents negative results', () => {
    // Generate 20 synthetic rounds with uniformly random bomb placements
    const syntheticRounds: MinesRoundRecord[] = [];
    for (let i = 0; i < 20; i++) {
      const bombs: number[] = [];
      while (bombs.length < 3) {
        const rand = Math.floor(Math.random() * 25);
        if (!bombs.includes(rand)) bombs.push(rand);
      }

      syntheticRounds.push({
        roundId: `synth_${i}`,
        timestamp: 1000 + i * 60000, // chronological ordering
        bombCount: 3,
        revealedSafeTiles: [0, 1, 2].filter((t) => !bombs.includes(t)),
        revealedBombTiles: bombs.slice(0, 1),
        allBombLocations: bombs,
        outcome: 'loss',
        picksCount: 3,
        multiplierReached: 0,
        stake: 10,
        grossPayout: 0,
        netProfit: -10,
        sourceType: 'simulated',
        validationStatus: 'valid',
      });
    }

    const report = evaluateCoordinatePredictor(syntheticRounds, 0.7);

    expect(report.trainSampleSize).toBeGreaterThanOrEqual(10);
    expect(report.testSampleSize).toBeGreaterThan(0);
    expect(report.baselineBrierScore).toBeGreaterThan(0);
    expect(report.modelBrierScore).toBeGreaterThan(0);
    expect(report.baselineLogLoss).toBeGreaterThan(0);
    expect(report.modelLogLoss).toBeGreaterThan(0);
    expect(report.notes.length).toBeGreaterThan(0);
  });
});
