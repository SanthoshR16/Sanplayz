import { describe, it, expect } from 'vitest';
import { ALL_ROULETTE_NUMBERS, classifyNumber } from '../math/mapping';
import { calculateObservedFrequencies, getTheoreticalDistribution } from '../math/probability';
import type { JointCategory } from '../types/roulette';

describe('Test 8 & 9: Probability Calculations and Joint Enumeration', () => {
  it('Requirement 8: Probability calculations sum correctly to 1.0', () => {
    const theo = getTheoreticalDistribution();

    // Color probabilities sum to 1.0
    expect(theo.pRed + theo.pBlack).toBeCloseTo(1.0, 6);

    // Parity probabilities sum to 1.0
    expect(theo.pOdd + theo.pEven).toBeCloseTo(1.0, 6);

    // All four joint probabilities sum to 1.0
    const sumJoint =
      theo.pJoint['red-odd'] +
      theo.pJoint['red-even'] +
      theo.pJoint['black-odd'] +
      theo.pJoint['black-even'];
    expect(sumJoint).toBeCloseTo(1.0, 6);
  });

  it('Requirement 9: Joint category counts match enumeration of all 36 numbers', () => {
    const theo = getTheoreticalDistribution();

    // Manual enumeration directly across all 36 numbers
    const manualJointCounts: Record<JointCategory, number> = {
      'red-odd': 0,
      'red-even': 0,
      'black-odd': 0,
      'black-even': 0,
    };

    for (const num of ALL_ROULETTE_NUMBERS) {
      const c = classifyNumber(num);
      manualJointCounts[c.joint]++;
    }

    expect(theo.jointCounts['red-odd']).toBe(manualJointCounts['red-odd']);
    expect(theo.jointCounts['red-even']).toBe(manualJointCounts['red-even']);
    expect(theo.jointCounts['black-odd']).toBe(manualJointCounts['black-odd']);
    expect(theo.jointCounts['black-even']).toBe(manualJointCounts['black-even']);

    // Check specific custom counts
    // Red-Odd is 10, Red-Even is 8, Black-Odd is 8, Black-Even is 10
    expect(theo.jointCounts['red-odd']).toBe(10);
    expect(theo.jointCounts['red-even']).toBe(8);
    expect(theo.jointCounts['black-odd']).toBe(8);
    expect(theo.jointCounts['black-even']).toBe(10);

    const totalCount =
      theo.jointCounts['red-odd'] +
      theo.jointCounts['red-even'] +
      theo.jointCounts['black-odd'] +
      theo.jointCounts['black-even'];
    expect(totalCount).toBe(36);

    // In this custom mapping, color and parity are NOT independent!
    // P(Red & Odd) = 10/36 = 0.2778
    // P(Red) * P(Odd) = 0.5 * 0.5 = 0.25
    expect(theo.areColorAndParityIndependent).toBe(false);
  });

  it('Observed frequencies sum correctly and preserve total', () => {
    const sample = [
      classifyNumber(3),
      classifyNumber(8),
      classifyNumber(6),
      classifyNumber(23),
      classifyNumber(36),
    ];

    const obs = calculateObservedFrequencies(sample);
    expect(obs.total).toBe(5);
    expect(obs.redCount + obs.blackCount).toBe(5);
    expect(obs.oddCount + obs.evenCount).toBe(5);
    expect(obs.redFreq + obs.blackFreq).toBeCloseTo(1.0, 6);
    expect(obs.oddFreq + obs.evenFreq).toBeCloseTo(1.0, 6);
  });
});
