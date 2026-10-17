import { describe, it, expect } from 'vitest';
import { ALL_ROULETTE_NUMBERS, classifyNumber } from '../math/mapping';
import { calculateObservedFrequencies, getTheoreticalDistribution } from '../math/probability';
import type { JointCategory } from '../types/roulette';

describe('Test 8 & 9: Probability Calculations and Joint Enumeration with 0 Green', () => {
  it('Requirement 8: Probability calculations sum correctly to 1.0', () => {
    const theo = getTheoreticalDistribution();

    // Outcomes count is 37 (0–36)
    expect(theo.totalOutcomes).toBe(37);

    // Color probabilities sum to 1.0
    expect(theo.pRed + theo.pBlack + theo.pGreen).toBeCloseTo(1.0, 6);

    // Parity probabilities sum to 1.0
    expect(theo.pOdd + theo.pEven + theo.pZero).toBeCloseTo(1.0, 6);

    // Halves probabilities sum to 1.0
    expect(theo.pLow + theo.pHigh + theo.pZero).toBeCloseTo(1.0, 6);

    // All joint probabilities sum to 1.0
    const sumJoint =
      theo.pJoint['red-odd'] +
      theo.pJoint['red-even'] +
      theo.pJoint['black-odd'] +
      theo.pJoint['black-even'] +
      theo.pJoint['green-zero'];
    expect(sumJoint).toBeCloseTo(1.0, 6);

    // European house edge derived from green 0 is ~2.70%
    expect(theo.houseEdgeEvenMoney).toBeCloseTo(1 / 37, 5);
  });

  it('Requirement 9: Joint category counts match enumeration of all 37 numbers', () => {
    const theo = getTheoreticalDistribution();

    // Manual enumeration directly across all 37 numbers
    const manualJointCounts: Record<JointCategory, number> = {
      'red-odd': 0,
      'red-even': 0,
      'black-odd': 0,
      'black-even': 0,
      'green-zero': 0,
    };

    for (const num of ALL_ROULETTE_NUMBERS) {
      const c = classifyNumber(num);
      manualJointCounts[c.joint]++;
    }

    expect(theo.jointCounts['red-odd']).toBe(manualJointCounts['red-odd']);
    expect(theo.jointCounts['red-even']).toBe(manualJointCounts['red-even']);
    expect(theo.jointCounts['black-odd']).toBe(manualJointCounts['black-odd']);
    expect(theo.jointCounts['black-even']).toBe(manualJointCounts['black-even']);
    expect(theo.jointCounts['green-zero']).toBe(manualJointCounts['green-zero']);

    // Check specific custom counts
    // Red-Odd is 10, Red-Even is 8, Black-Odd is 8, Black-Even is 10, Green-Zero is 1
    expect(theo.jointCounts['red-odd']).toBe(10);
    expect(theo.jointCounts['red-even']).toBe(8);
    expect(theo.jointCounts['black-odd']).toBe(8);
    expect(theo.jointCounts['black-even']).toBe(10);
    expect(theo.jointCounts['green-zero']).toBe(1);

    const totalCount =
      theo.jointCounts['red-odd'] +
      theo.jointCounts['red-even'] +
      theo.jointCounts['black-odd'] +
      theo.jointCounts['black-even'] +
      theo.jointCounts['green-zero'];
    expect(totalCount).toBe(37);

    // In this custom mapping, color and parity are NOT independent!
    expect(theo.areColorAndParityIndependent).toBe(false);
  });

  it('Observed frequencies sum correctly and preserve total including green zero', () => {
    const sample = [
      classifyNumber(3),
      classifyNumber(8),
      classifyNumber(0), // Green 0
      classifyNumber(23),
      classifyNumber(36),
    ];

    const obs = calculateObservedFrequencies(sample);
    expect(obs.total).toBe(5);
    expect(obs.redCount + obs.blackCount + obs.greenCount).toBe(5);
    expect(obs.oddCount + obs.evenCount + obs.zeroCount).toBe(5);
    expect(obs.lowCount + obs.highCount + obs.zeroCount).toBe(5);
    expect(obs.greenCount).toBe(1);
    expect(obs.zeroCount).toBe(1);
    expect(obs.redFreq + obs.blackFreq + obs.greenFreq).toBeCloseTo(1.0, 6);
    expect(obs.oddFreq + obs.evenFreq + obs.zeroFreq).toBeCloseTo(1.0, 6);
  });
});

