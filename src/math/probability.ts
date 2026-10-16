import type { JointCategory, RouletteColor, RouletteParity, TheoreticalDistribution } from '../types/roulette';
import { ALL_ROULETTE_NUMBERS, classifyNumber } from './mapping';

/**
 * Computes the theoretical distribution by programmatically enumerating all 36 numbers.
 * Never hardcodes counts or assumes color and parity independence.
 */
export function getTheoreticalDistribution(): TheoreticalDistribution {
  let redCount = 0;
  let blackCount = 0;
  let oddCount = 0;
  let evenCount = 0;

  const jointCounts: Record<JointCategory, number> = {
    'red-odd': 0,
    'red-even': 0,
    'black-odd': 0,
    'black-even': 0,
  };

  for (const n of ALL_ROULETTE_NUMBERS) {
    const c = classifyNumber(n);
    if (c.color === 'red') redCount++;
    else blackCount++;

    if (c.parity === 'odd') oddCount++;
    else evenCount++;

    jointCounts[c.joint]++;
  }

  const total = ALL_ROULETTE_NUMBERS.length; // 36
  const pRed = redCount / total;
  const pBlack = blackCount / total;
  const pOdd = oddCount / total;
  const pEven = evenCount / total;

  const pJoint: Record<JointCategory, number> = {
    'red-odd': jointCounts['red-odd'] / total,
    'red-even': jointCounts['red-even'] / total,
    'black-odd': jointCounts['black-odd'] / total,
    'black-even': jointCounts['black-even'] / total,
  };

  // Color & parity independence check:
  // In independent events, P(Red & Odd) === P(Red) * P(Odd)
  const productRedOdd = pRed * pOdd;
  const areColorAndParityIndependent = Math.abs(pJoint['red-odd'] - productRedOdd) < 1e-6;

  return {
    totalOutcomes: total,
    redCount,
    blackCount,
    oddCount,
    evenCount,
    pRed,
    pBlack,
    pOdd,
    pEven,
    jointCounts,
    pJoint,
    areColorAndParityIndependent,
  };
}

/**
 * Calculates empirical observed frequencies for a sequence of classifications.
 * Clearly distinguishable from theoretical probabilities.
 */
export function calculateObservedFrequencies(results: Array<{ color: RouletteColor; parity: RouletteParity; joint: JointCategory }>): {
  total: number;
  redCount: number;
  blackCount: number;
  redFreq: number;
  blackFreq: number;
  oddCount: number;
  evenCount: number;
  oddFreq: number;
  evenFreq: number;
  jointCounts: Record<JointCategory, number>;
  jointFreqs: Record<JointCategory, number>;
} {
  const total = results.length;
  if (total === 0) {
    return {
      total: 0,
      redCount: 0,
      blackCount: 0,
      redFreq: 0,
      blackFreq: 0,
      oddCount: 0,
      evenCount: 0,
      oddFreq: 0,
      evenFreq: 0,
      jointCounts: { 'red-odd': 0, 'red-even': 0, 'black-odd': 0, 'black-even': 0 },
      jointFreqs: { 'red-odd': 0, 'red-even': 0, 'black-odd': 0, 'black-even': 0 },
    };
  }

  let redCount = 0;
  let blackCount = 0;
  let oddCount = 0;
  let evenCount = 0;

  const jointCounts: Record<JointCategory, number> = {
    'red-odd': 0,
    'red-even': 0,
    'black-odd': 0,
    'black-even': 0,
  };

  for (const r of results) {
    if (r.color === 'red') redCount++;
    else blackCount++;

    if (r.parity === 'odd') oddCount++;
    else evenCount++;

    if (jointCounts[r.joint] !== undefined) {
      jointCounts[r.joint]++;
    }
  }

  return {
    total,
    redCount,
    blackCount,
    redFreq: redCount / total,
    blackFreq: blackCount / total,
    oddCount,
    evenCount,
    oddFreq: oddCount / total,
    evenFreq: evenCount / total,
    jointCounts,
    jointFreqs: {
      'red-odd': jointCounts['red-odd'] / total,
      'red-even': jointCounts['red-even'] / total,
      'black-odd': jointCounts['black-odd'] / total,
      'black-even': jointCounts['black-even'] / total,
    },
  };
}
