import type { RouletteResult, TransitionStats } from '../types/roulette';

/**
 * Calculates first-order state transition frequencies for consecutive observations.
 * E.g. Odd -> Odd, Odd -> Even, Red -> Red, Red -> Black, etc.
 */
export function calculateTransitions(results: RouletteResult[]): TransitionStats {
  const stats: TransitionStats = {
    parityTransitions: {
      'odd->odd': 0,
      'odd->even': 0,
      'even->odd': 0,
      'even->even': 0,
    },
    parityTotals: { odd: 0, even: 0 },
    colorTransitions: {
      'red->red': 0,
      'red->black': 0,
      'black->red': 0,
      'black->black': 0,
    },
    colorTotals: { red: 0, black: 0 },
  };

  if (results.length < 2) {
    return stats;
  }

  for (let i = 0; i < results.length - 1; i++) {
    const prev = results[i];
    const curr = results[i + 1];

    // Parity transition
    const parityKey = `${prev.parity}->${curr.parity}` as keyof TransitionStats['parityTransitions'];
    if (stats.parityTransitions[parityKey] !== undefined) {
      stats.parityTransitions[parityKey]++;
      if (prev.parity === 'odd' || prev.parity === 'even') {
        stats.parityTotals[prev.parity]++;
      }
    }

    // Color transition
    const colorKey = `${prev.color}->${curr.color}` as keyof TransitionStats['colorTransitions'];
    if (stats.colorTransitions[colorKey] !== undefined) {
      stats.colorTransitions[colorKey]++;
      if (prev.color === 'red' || prev.color === 'black') {
        stats.colorTotals[prev.color]++;
      }
    }
  }

  return stats;
}

/**
 * Calculates empirical conditional probabilities for transitions.
 * Returns null if denominator is 0.
 */
export function getTransitionProbabilities(stats: TransitionStats): {
  parityProbabilities: Record<keyof TransitionStats['parityTransitions'], number | null>;
  colorProbabilities: Record<keyof TransitionStats['colorTransitions'], number | null>;
} {
  const pOddTotal = stats.parityTotals.odd;
  const pEvenTotal = stats.parityTotals.even;

  const parityProbabilities = {
    'odd->odd': pOddTotal > 0 ? stats.parityTransitions['odd->odd'] / pOddTotal : null,
    'odd->even': pOddTotal > 0 ? stats.parityTransitions['odd->even'] / pOddTotal : null,
    'even->odd': pEvenTotal > 0 ? stats.parityTransitions['even->odd'] / pEvenTotal : null,
    'even->even': pEvenTotal > 0 ? stats.parityTransitions['even->even'] / pEvenTotal : null,
  };

  const cRedTotal = stats.colorTotals.red;
  const cBlackTotal = stats.colorTotals.black;

  const colorProbabilities = {
    'red->red': cRedTotal > 0 ? stats.colorTransitions['red->red'] / cRedTotal : null,
    'red->black': cRedTotal > 0 ? stats.colorTransitions['red->black'] / cRedTotal : null,
    'black->red': cBlackTotal > 0 ? stats.colorTransitions['black->red'] / cBlackTotal : null,
    'black->black': cBlackTotal > 0 ? stats.colorTransitions['black->black'] / cBlackTotal : null,
  };

  return { parityProbabilities, colorProbabilities };
}
