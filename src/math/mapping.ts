import type { Classification, JointCategory, RouletteColor, RouletteParity } from '../types/roulette';

/**
 * EXACT CUSTOM ROULETTE NUMBER MAPPING
 * 
 * Red numbers:
 * 1–12: 1, 3, 5, 7, 9, 12
 * 13–24: 14, 16, 18, 19, 21, 23
 * 25–36: 25, 27, 30, 32, 34, 36
 * 
 * Black numbers: Every other integer from 1 through 36.
 * 
 * Odd/Even:
 * - Odd: n % 2 === 1
 * - Even: n % 2 === 0
 */

export const RED_NUMBERS_SET = new Set<number>([
  // 1–12
  1, 3, 5, 7, 9, 12,
  // 13–24
  14, 16, 18, 19, 21, 23,
  // 25–36
  25, 27, 30, 32, 34, 36,
]);

export const ALL_ROULETTE_NUMBERS: readonly number[] = Object.freeze(
  Array.from({ length: 36 }, (_, i) => i + 1)
);

export const RED_NUMBERS: readonly number[] = Object.freeze(
  ALL_ROULETTE_NUMBERS.filter((n) => RED_NUMBERS_SET.has(n))
);

export const BLACK_NUMBERS: readonly number[] = Object.freeze(
  ALL_ROULETTE_NUMBERS.filter((n) => !RED_NUMBERS_SET.has(n))
);

/**
 * Validates whether an input is a valid roulette integer from 1 to 36.
 * Rejects empty values, non-integers, decimals, negatives, and out-of-range numbers.
 */
export function validateRouletteInput(input: unknown): {
  valid: boolean;
  value?: number;
  error?: string;
} {
  if (input === null || input === undefined || input === '') {
    return { valid: false, error: 'Please enter a number between 1 and 36.' };
  }

  const num = typeof input === 'number' ? input : Number(String(input).trim());

  if (Number.isNaN(num)) {
    return { valid: false, error: 'Input must be a valid number.' };
  }

  if (!Number.isInteger(num)) {
    return { valid: false, error: 'Decimals are not permitted. Only integers 1–36 are allowed.' };
  }

  if (num < 1 || num > 36) {
    return { valid: false, error: `Number ${num} is out of range. Must be between 1 and 36.` };
  }

  return { valid: true, value: num };
}

/**
 * Single authoritative classification function for a roulette number.
 * Must be reused everywhere; do not duplicate mapping.
 */
export function classifyNumber(num: number): Classification {
  const validation = validateRouletteInput(num);
  if (!validation.valid || validation.value === undefined) {
    throw new Error(validation.error ?? `Invalid roulette number: ${num}`);
  }

  const n = validation.value;
  const color: RouletteColor = RED_NUMBERS_SET.has(n) ? 'red' : 'black';
  const parity: RouletteParity = n % 2 === 1 ? 'odd' : 'even';
  const joint: JointCategory = `${color}-${parity}` as JointCategory;

  return {
    number: n,
    color,
    parity,
    joint,
  };
}

/**
 * Check if color and parity mappings are predefined.
 */
export function getColorForNumber(n: number): RouletteColor {
  return classifyNumber(n).color;
}

export function getParityForNumber(n: number): RouletteParity {
  return classifyNumber(n).parity;
}
