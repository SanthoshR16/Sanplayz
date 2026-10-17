import type { RollingStats, RouletteResult } from '../types/roulette';
import { calculateObservedFrequencies } from './probability';

export interface RollingWindowConfig {
  size: number;
  label: string;
}

export const STANDARD_WINDOWS: RollingWindowConfig[] = [
  { size: 5, label: 'Latest 5' },
  { size: 6, label: 'Latest 6' },
  { size: 10, label: 'Latest 10' },
  { size: 25, label: 'Latest 25' },
];

/**
 * Computes rolling statistics for requested window size over the results array.
 * Results are assumed to be chronological (index 0 is oldest, last index is newest).
 */
export function computeRollingStats(
  results: RouletteResult[],
  windowSize: number,
  label: string
): RollingStats {
  const actualCount = results.length;
  const isSufficient = actualCount >= windowSize;
  const slice = results.slice(-windowSize);

  const freq = calculateObservedFrequencies(slice);

  return {
    label,
    windowSize,
    actualCount: slice.length,
    isSufficient,
    redCount: freq.redCount,
    blackCount: freq.blackCount,
    greenCount: freq.greenCount,
    redFreq: freq.redFreq,
    blackFreq: freq.blackFreq,
    greenFreq: freq.greenFreq,
    oddCount: freq.oddCount,
    evenCount: freq.evenCount,
    zeroCount: freq.zeroCount,
    oddFreq: freq.oddFreq,
    evenFreq: freq.evenFreq,
    zeroFreq: freq.zeroFreq,
    lowCount: freq.lowCount,
    highCount: freq.highCount,
    lowFreq: freq.lowFreq,
    highFreq: freq.highFreq,
    jointCounts: freq.jointCounts,
    jointFreqs: freq.jointFreqs,
  };
}

/**
 * Computes all standard rolling windows plus all-time session history.
 */
export function computeAllRollingWindows(results: RouletteResult[]): RollingStats[] {
  const list: RollingStats[] = [];

  for (const w of STANDARD_WINDOWS) {
    list.push(computeRollingStats(results, w.size, w.label));
  }

  // Entire session history
  list.push(computeRollingStats(results, results.length, 'All Session'));

  return list;
}
