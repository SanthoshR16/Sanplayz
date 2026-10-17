import type { JointCategory, RouletteColor, RouletteParity, TheoreticalDistribution } from '../types/roulette';
import { ALL_ROULETTE_NUMBERS, classifyNumber } from './mapping';

/**
 * Computes the theoretical distribution across all 37 outcomes (0–36 European wheel).
 * Accounts for 0 Green, Parity None, and 1–18 Low / 19–36 High.
 */
export function getTheoreticalDistribution(): TheoreticalDistribution {
  let redCount = 0;
  let blackCount = 0;
  let greenCount = 0;
  let zeroCount = 0;
  let oddCount = 0;
  let evenCount = 0;
  let lowCount = 0;
  let highCount = 0;

  const jointCounts: Record<JointCategory, number> = {
    'red-odd': 0,
    'red-even': 0,
    'black-odd': 0,
    'black-even': 0,
    'green-zero': 0,
  };

  for (const n of ALL_ROULETTE_NUMBERS) {
    const c = classifyNumber(n);
    if (c.color === 'red') redCount++;
    else if (c.color === 'black') blackCount++;
    else if (c.color === 'green') greenCount++;

    if (c.parity === 'odd') oddCount++;
    else if (c.parity === 'even') evenCount++;
    else if (c.parity === 'none') zeroCount++;

    if (c.half === 'low') lowCount++;
    else if (c.half === 'high') highCount++;

    jointCounts[c.joint]++;
  }

  const total = ALL_ROULETTE_NUMBERS.length; // 37
  const pRed = redCount / total;
  const pBlack = blackCount / total;
  const pGreen = greenCount / total;
  const pZero = zeroCount / total;
  const pOdd = oddCount / total;
  const pEven = evenCount / total;
  const pLow = lowCount / total;
  const pHigh = highCount / total;

  const pJoint: Record<JointCategory, number> = {
    'red-odd': jointCounts['red-odd'] / total,
    'red-even': jointCounts['red-even'] / total,
    'black-odd': jointCounts['black-odd'] / total,
    'black-even': jointCounts['black-even'] / total,
    'green-zero': jointCounts['green-zero'] / total,
  };

  // Color & parity independence check
  const productRedOdd = pRed * pOdd;
  const areColorAndParityIndependent = Math.abs(pJoint['red-odd'] - productRedOdd) < 1e-6;

  // Exact European casino house edge: 1/37 ≈ 2.7027%
  const houseEdgeEvenMoney = 1 / total;
  const houseEdgeSingleNumber = 1 / total;

  return {
    totalOutcomes: total,
    hasZero: true,
    redCount,
    blackCount,
    greenCount,
    zeroCount,
    oddCount,
    evenCount,
    lowCount,
    highCount,
    pRed,
    pBlack,
    pGreen,
    pZero,
    pOdd,
    pEven,
    pLow,
    pHigh,
    jointCounts,
    pJoint,
    areColorAndParityIndependent,
    houseEdgeEvenMoney,
    houseEdgeSingleNumber,
  };
}

/**
 * Calculates empirical observed frequencies for a sequence of classifications.
 * Clearly distinguishable from theoretical probabilities.
 */
export function calculateObservedFrequencies(
  results: Array<{ number?: number; color: RouletteColor; parity: RouletteParity; joint: JointCategory; half?: string }>
): {
  total: number;
  redCount: number;
  blackCount: number;
  greenCount: number;
  redFreq: number;
  blackFreq: number;
  greenFreq: number;
  oddCount: number;
  evenCount: number;
  zeroCount: number;
  oddFreq: number;
  evenFreq: number;
  zeroFreq: number;
  lowCount: number;
  highCount: number;
  lowFreq: number;
  highFreq: number;
  jointCounts: Record<JointCategory, number>;
  jointFreqs: Record<JointCategory, number>;
} {
  const total = results.length;
  if (total === 0) {
    return {
      total: 0,
      redCount: 0,
      blackCount: 0,
      greenCount: 0,
      redFreq: 0,
      blackFreq: 0,
      greenFreq: 0,
      oddCount: 0,
      evenCount: 0,
      zeroCount: 0,
      oddFreq: 0,
      evenFreq: 0,
      zeroFreq: 0,
      lowCount: 0,
      highCount: 0,
      lowFreq: 0,
      highFreq: 0,
      jointCounts: {
        'red-odd': 0,
        'red-even': 0,
        'black-odd': 0,
        'black-even': 0,
        'green-zero': 0,
      },
      jointFreqs: {
        'red-odd': 0,
        'red-even': 0,
        'black-odd': 0,
        'black-even': 0,
        'green-zero': 0,
      },
    };
  }

  let redCount = 0;
  let blackCount = 0;
  let greenCount = 0;
  let oddCount = 0;
  let evenCount = 0;
  let zeroCount = 0;
  let lowCount = 0;
  let highCount = 0;

  const jointCounts: Record<JointCategory, number> = {
    'red-odd': 0,
    'red-even': 0,
    'black-odd': 0,
    'black-even': 0,
    'green-zero': 0,
  };

  for (const r of results) {
    if (r.color === 'red') redCount++;
    else if (r.color === 'black') blackCount++;
    else if (r.color === 'green' || r.number === 0) greenCount++;

    if (r.parity === 'odd') oddCount++;
    else if (r.parity === 'even') evenCount++;
    else if (r.parity === 'none' || r.number === 0) zeroCount++;

    if (r.number !== undefined) {
      if (r.number >= 1 && r.number <= 18) lowCount++;
      else if (r.number >= 19 && r.number <= 36) highCount++;
    }

    if (jointCounts[r.joint] !== undefined) {
      jointCounts[r.joint]++;
    }
  }

  return {
    total,
    redCount,
    blackCount,
    greenCount,
    redFreq: redCount / total,
    blackFreq: blackCount / total,
    greenFreq: greenCount / total,
    oddCount,
    evenCount,
    zeroCount,
    oddFreq: oddCount / total,
    evenFreq: evenCount / total,
    zeroFreq: zeroCount / total,
    lowCount,
    highCount,
    lowFreq: lowCount / total,
    highFreq: highCount / total,
    jointCounts,
    jointFreqs: {
      'red-odd': jointCounts['red-odd'] / total,
      'red-even': jointCounts['red-even'] / total,
      'black-odd': jointCounts['black-odd'] / total,
      'black-even': jointCounts['black-even'] / total,
      'green-zero': jointCounts['green-zero'] / total,
    },
  };
}

