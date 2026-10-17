import { describe, it, expect } from 'vitest';
import {
  detectBestGap,
  OPEN_SOURCE_BENCHMARK,
  SLEEPER_GAP_PROBABILITIES,
  CHOP_EXHAUSTION_PROBABILITIES,
  calculateEvenMoneyEV,
} from '../math/openSourceTrainingData';
import { generateRecommendations } from '../math/recommendations';
import type { RouletteResult } from '../types/roulette';

describe('Open-Source Training & Best Gap Detection Engine', () => {
  it('Validates open-source 100k empirical benchmarks and mathematical probabilities', () => {
    expect(OPEN_SOURCE_BENCHMARK.totalTrainingSpins).toBe(100000);
    expect(OPEN_SOURCE_BENCHMARK.pEvenMoneyWin).toBeCloseTo(18 / 37, 4);
    expect(OPEN_SOURCE_BENCHMARK.baselineTheoreticalEdge).toBeCloseTo(1 / 37, 4);

    // Verify sleeper gap termination probabilities
    expect(SLEEPER_GAP_PROBABILITIES[4].terminateProb).toBeGreaterThanOrEqual(0.93);
    expect(SLEEPER_GAP_PROBABILITIES[5].terminateProb).toBeGreaterThanOrEqual(0.96);
    expect(SLEEPER_GAP_PROBABILITIES[6].terminateProb).toBeGreaterThanOrEqual(0.98);

    // Verify chop break probabilities
    expect(CHOP_EXHAUSTION_PROBABILITIES[5].breakProb).toBeGreaterThanOrEqual(0.94);
  });

  it('Identifies normal variance (Gap <= 2) and refuses to declare Best Gap', () => {
    // 2 consecutive blacks (Red gap = 2)
    const spins: RouletteResult[] = [
      { number: 2, color: 'black', parity: 'even', joint: 'black-even', timestamp: 1000, sessionId: 's1', id: 1 },
      { number: 4, color: 'black', parity: 'even', joint: 'black-even', timestamp: 2000, sessionId: 's1', id: 2 },
    ];

    const gap = detectBestGap(spins);
    expect(gap.isBestGapReached).toBe(false);
    expect(gap.gapTier).toBe('NORMAL_VARIANCE');
    expect(gap.redGap).toBe(2);
    expect(gap.blackGap).toBe(0);
    expect(gap.spinsUntilBestGap).toBe(2);
  });

  it('Detects Tier 1 Best Gap when streak reaches 4 consecutive outcomes', () => {
    // 4 consecutive blacks: Red has been absent for 4 spins
    const spins: RouletteResult[] = [
      { number: 15, color: 'black', parity: 'odd', joint: 'black-odd', timestamp: 1000, sessionId: 's1', id: 1 },
      { number: 4, color: 'black', parity: 'even', joint: 'black-even', timestamp: 2000, sessionId: 's1', id: 2 },
      { number: 22, color: 'black', parity: 'even', joint: 'black-even', timestamp: 3000, sessionId: 's1', id: 3 },
      { number: 29, color: 'black', parity: 'odd', joint: 'black-odd', timestamp: 4000, sessionId: 's1', id: 4 },
    ];

    const gap = detectBestGap(spins);
    expect(gap.isBestGapReached).toBe(true);
    expect(gap.gapTier).toBe('BEST_GAP_TIER_1');
    expect(gap.targetSelection).toBe('RED');
    expect(gap.currentGapDepth).toBe(4);
    expect(gap.terminationProbability).toBeGreaterThanOrEqual(93);
    expect(gap.spinsUntilBestGap).toBe(0);
  });

  it('Strictly enforces Best Gap waiting when recovering from a missed prediction (awaitingBestGap)', () => {
    // 3 consecutive blacks: in normal play this is a developing gap, but after a loss
    // the system strictly waits until Gap reaches 4!
    const spins3: RouletteResult[] = [
      { number: 15, color: 'black', parity: 'odd', joint: 'black-odd', timestamp: 1000, sessionId: 's1', id: 1 },
      { number: 4, color: 'black', parity: 'even', joint: 'black-even', timestamp: 2000, sessionId: 's1', id: 2 },
      { number: 22, color: 'black', parity: 'even', joint: 'black-even', timestamp: 3000, sessionId: 's1', id: 3 },
    ];

    // With awaitingBestGap = true (post-loss mode)
    const recWaiting = generateRecommendations(spins3, undefined, true);
    expect(recWaiting.sureshot.isTriggered).toBe(false);
    expect(recWaiting.sureshot.status).toBe('AWAITING_BEST_GAP');
    expect(recWaiting.sureshot.primaryDirective).toContain('AWAITING BEST GAP');

    // Add 4th black: now Gap is 4, unlocking Sureshot!
    const spins4: RouletteResult[] = [
      ...spins3,
      { number: 29, color: 'black', parity: 'odd', joint: 'black-odd', timestamp: 4000, sessionId: 's1', id: 4 },
    ];

    const recTriggered = generateRecommendations(spins4, undefined, true);
    expect(recTriggered.sureshot.isTriggered).toBe(true);
    expect(recTriggered.sureshot.status).toBe('SURESHOT_ACTIVE');
    expect(recTriggered.sureshot.targetSelection).toBe('RED');
    expect(recTriggered.sureshot.confidence).toBeGreaterThanOrEqual(88);
  });

  it('Calculates EV and edge percentage accurately for even-money opportunities', () => {
    // Baseline 48.65% win probability has negative EV (-2.7%)
    const baseline = calculateEvenMoneyEV(18 / 37);
    expect(baseline.isPositiveEV).toBe(false);
    expect(baseline.edgePercentage).toBeCloseTo(-2.7, 1);

    // High confidence Best Gap setup (60% win probability) yields positive EV (+20%)
    const highEdge = calculateEvenMoneyEV(0.60);
    expect(highEdge.isPositiveEV).toBe(true);
    expect(highEdge.edgePercentage).toBe(20);
  });
});
