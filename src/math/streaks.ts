import type { RouletteColor, RouletteParity, RouletteResult, StreakInfo } from '../types/roulette';

/**
 * Calculates current streaks, maximum historical streaks, and streak length distributions
 * for both parity (odd/even) and color (red/black).
 */
export function calculateStreaks(results: RouletteResult[]): StreakInfo {
  if (results.length === 0) {
    return {
      currentParityStreak: { parity: null, length: 0 },
      currentParityMax: { odd: 0, even: 0 },
      parityDistribution: {},
      currentColorStreak: { color: null, length: 0 },
      currentColorMax: { red: 0, black: 0 },
      colorDistribution: {},
    };
  }

  // Current streaks (starting from newest, moving backwards)
  const newest = results[results.length - 1];

  let currentParityLength = 0;
  for (let i = results.length - 1; i >= 0; i--) {
    if (results[i].parity === newest.parity) {
      currentParityLength++;
    } else {
      break;
    }
  }

  let currentColorLength = 0;
  for (let i = results.length - 1; i >= 0; i--) {
    if (results[i].color === newest.color) {
      currentColorLength++;
    } else {
      break;
    }
  }

  // Full history analysis for max streaks and frequency of lengths
  const parityDistribution: Record<string, number> = {};
  const colorDistribution: Record<string, number> = {};

  let maxOdd = 0;
  let maxEven = 0;
  let maxRed = 0;
  let maxBlack = 0;

  // Parity pass
  let activeParity: RouletteParity | null = null;
  let activeParityCount = 0;

  for (let i = 0; i < results.length; i++) {
    const p = results[i].parity;
    if (p === activeParity) {
      activeParityCount++;
    } else {
      if (activeParity !== null) {
        const key = `${activeParity}-${activeParityCount}`;
        parityDistribution[key] = (parityDistribution[key] || 0) + 1;
        if (activeParity === 'odd' && activeParityCount > maxOdd) maxOdd = activeParityCount;
        if (activeParity === 'even' && activeParityCount > maxEven) maxEven = activeParityCount;
      }
      activeParity = p;
      activeParityCount = 1;
    }
  }
  if (activeParity !== null) {
    const key = `${activeParity}-${activeParityCount}`;
    parityDistribution[key] = (parityDistribution[key] || 0) + 1;
    if (activeParity === 'odd' && activeParityCount > maxOdd) maxOdd = activeParityCount;
    if (activeParity === 'even' && activeParityCount > maxEven) maxEven = activeParityCount;
  }

  // Color pass
  let activeColor: RouletteColor | null = null;
  let activeColorCount = 0;

  for (let i = 0; i < results.length; i++) {
    const c = results[i].color;
    if (c === activeColor) {
      activeColorCount++;
    } else {
      if (activeColor !== null) {
        const key = `${activeColor}-${activeColorCount}`;
        colorDistribution[key] = (colorDistribution[key] || 0) + 1;
        if (activeColor === 'red' && activeColorCount > maxRed) maxRed = activeColorCount;
        if (activeColor === 'black' && activeColorCount > maxBlack) maxBlack = activeColorCount;
      }
      activeColor = c;
      activeColorCount = 1;
    }
  }
  if (activeColor !== null) {
    const key = `${activeColor}-${activeColorCount}`;
    colorDistribution[key] = (colorDistribution[key] || 0) + 1;
    if (activeColor === 'red' && activeColorCount > maxRed) maxRed = activeColorCount;
    if (activeColor === 'black' && activeColorCount > maxBlack) maxBlack = activeColorCount;
  }

  return {
    currentParityStreak: {
      parity: newest.parity,
      length: currentParityLength,
    },
    currentParityMax: {
      odd: maxOdd,
      even: maxEven,
    },
    parityDistribution,
    currentColorStreak: {
      color: newest.color,
      length: currentColorLength,
    },
    currentColorMax: {
      red: maxRed,
      black: maxBlack,
    },
    colorDistribution,
  };
}
