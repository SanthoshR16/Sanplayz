import type { Classification, JointCategory, RouletteColor, RouletteHalf, RouletteParity } from '../types/roulette';

/**
 * EXACT CUSTOM ROULETTE NUMBER MAPPING (0–36 Standard European Wheel)
 * 
 * Zero (0):
 * - Color: Green
 * - Parity: None (neither Odd nor Even)
 * - Half: None (does not belong to 1–18 Low or 19–36 High)
 * - Joint: green-zero
 * 
 * Red numbers:
 * 1–12: 1, 3, 5, 7, 9, 12
 * 13–24: 14, 16, 18, 19, 21, 23
 * 25–36: 25, 27, 30, 32, 34, 36
 * 
 * Black numbers: Every other integer from 1 through 36.
 * 
 * Odd/Even (1–36):
 * - Odd: n % 2 === 1
 * - Even: n % 2 === 0
 * 
 * Low/High (1–36):
 * - Low: 1–18
 * - High: 19–36
 */

export const RED_NUMBERS_SET = new Set<number>([
  // 1–12
  1, 3, 5, 7, 9, 12,
  // 13–24
  14, 16, 18, 19, 21, 23,
  // 25–36
  25, 27, 30, 32, 34, 36,
]);

/** Numbers 1 through 36 */
export const ROULETTE_1_36_NUMBERS: readonly number[] = Object.freeze(
  Array.from({ length: 36 }, (_, i) => i + 1)
);

/** Complete 37-outcome European Roulette Wheel: 0 through 36 */
export const ALL_ROULETTE_NUMBERS: readonly number[] = Object.freeze(
  Array.from({ length: 37 }, (_, i) => i)
);

export const RED_NUMBERS: readonly number[] = Object.freeze(
  ROULETTE_1_36_NUMBERS.filter((n) => RED_NUMBERS_SET.has(n))
);

export const BLACK_NUMBERS: readonly number[] = Object.freeze(
  ROULETTE_1_36_NUMBERS.filter((n) => !RED_NUMBERS_SET.has(n))
);

export const LOW_NUMBERS: readonly number[] = Object.freeze(
  ROULETTE_1_36_NUMBERS.filter((n) => n <= 18)
);

export const HIGH_NUMBERS: readonly number[] = Object.freeze(
  ROULETTE_1_36_NUMBERS.filter((n) => n >= 19)
);

/**
 * Validates whether an input is a valid roulette integer from 0 to 36.
 * Rejects empty values, non-integers, decimals, negatives (< 0), and numbers > 36.
 */
export function validateRouletteInput(input: unknown): {
  valid: boolean;
  value?: number;
  error?: string;
} {
  if (input === null || input === undefined || input === '') {
    return { valid: false, error: 'Please enter a number between 0 and 36.' };
  }

  const num = typeof input === 'number' ? input : Number(String(input).trim());

  if (Number.isNaN(num)) {
    return { valid: false, error: 'Input must be a valid number.' };
  }

  if (!Number.isInteger(num)) {
    return { valid: false, error: 'Decimals are not permitted. Only integers 0–36 are allowed.' };
  }

  if (num < 0 || num > 36) {
    return { valid: false, error: `Number ${num} is out of range. Must be between 0 and 36.` };
  }

  return { valid: true, value: num };
}

/**
 * Single authoritative classification function for a roulette number (0–36).
 * Must be reused everywhere; do not duplicate mapping.
 */
export function classifyNumber(num: number): Classification {
  const validation = validateRouletteInput(num);
  if (!validation.valid || validation.value === undefined) {
    throw new Error(validation.error ?? `Invalid roulette number: ${num}`);
  }

  const n = validation.value;

  // Single-zero green pocket
  if (n === 0) {
    return {
      number: 0,
      color: 'green',
      parity: 'none',
      half: 'none',
      joint: 'green-zero',
    };
  }

  const color: RouletteColor = RED_NUMBERS_SET.has(n) ? 'red' : 'black';
  const parity: RouletteParity = n % 2 === 1 ? 'odd' : 'even';
  const half: RouletteHalf = n <= 18 ? 'low' : 'high';
  const joint: JointCategory = `${color}-${parity}` as JointCategory;

  return {
    number: n,
    color,
    parity,
    half,
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

export function getHalfForNumber(n: number): RouletteHalf {
  return classifyNumber(n).half;
}

