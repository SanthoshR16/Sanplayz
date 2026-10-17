import { describe, it, expect } from 'vitest';
import {
  ALL_ROULETTE_NUMBERS,
  ROULETTE_1_36_NUMBERS,
  classifyNumber,
  RED_NUMBERS_SET,
  validateRouletteInput,
} from '../math/mapping';

describe('Test 1, 2, 3: Custom 1–36 Number Mapping and 0 Green Classification', () => {
  it('Requirement 1: Every number from 1 to 36 has the correct custom color and 0 is green', () => {
    // Exact Red numbers specified in prompt:
    // 1–12: 1, 3, 5, 7, 9, 12
    // 13–24: 14, 16, 18, 19, 21, 23
    // 25–36: 25, 27, 30, 32, 34, 36
    const expectedReds = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    expect(expectedReds.length).toBe(18);

    for (const num of ROULETTE_1_36_NUMBERS) {
      const c = classifyNumber(num);
      if (expectedReds.includes(num)) {
        expect(c.color).toBe('red');
        expect(RED_NUMBERS_SET.has(num)).toBe(true);
      } else {
        expect(c.color).toBe('black');
        expect(RED_NUMBERS_SET.has(num)).toBe(false);
      }
    }

    // 0 is Green
    const zeroClass = classifyNumber(0);
    expect(zeroClass.color).toBe('green');
    expect(zeroClass.number).toBe(0);
  });

  it('Requirement 2: Every number from 1 to 36 has the correct parity and 0 is none', () => {
    for (const num of ROULETTE_1_36_NUMBERS) {
      const c = classifyNumber(num);
      const expectedParity = num % 2 === 1 ? 'odd' : 'even';
      expect(c.parity).toBe(expectedParity);
    }

    // 0 is neither odd nor even
    expect(classifyNumber(0).parity).toBe('none');
  });

  it('Requirement 3: Every number belongs to exactly one color, parity, and half category', () => {
    for (const num of ALL_ROULETTE_NUMBERS) {
      const c = classifyNumber(num);
      expect(['red', 'black', 'green']).toContain(c.color);
      expect(['odd', 'even', 'none']).toContain(c.parity);
      expect(['low', 'high', 'none']).toContain(c.half);
      expect(c.number).toBe(num);
      if (num === 0) {
        expect(c.joint).toBe('green-zero');
        expect(c.color).toBe('green');
        expect(c.parity).toBe('none');
        expect(c.half).toBe('none');
      } else {
        expect(c.joint).toBe(`${c.color}-${c.parity}`);
      }
    }
  });

  it('Requirement 7: Empty, decimal, negative, and out-of-range entries are rejected; 0-36 are valid', () => {
    expect(validateRouletteInput('').valid).toBe(false);
    expect(validateRouletteInput(null).valid).toBe(false);
    expect(validateRouletteInput(undefined).valid).toBe(false);
    expect(validateRouletteInput('abc').valid).toBe(false);

    // Decimals
    expect(validateRouletteInput(3.14).valid).toBe(false);
    expect(validateRouletteInput('7.5').valid).toBe(false);

    // Negative numbers
    expect(validateRouletteInput(-1).valid).toBe(false);
    expect(validateRouletteInput(-5).valid).toBe(false);

    // Out of range > 36
    expect(validateRouletteInput(37).valid).toBe(false);
    expect(validateRouletteInput(100).valid).toBe(false);

    // Valid inputs (0 through 36)
    expect(validateRouletteInput(0).valid).toBe(true);
    expect(validateRouletteInput('0').valid).toBe(true);
    expect(validateRouletteInput(1).valid).toBe(true);
    expect(validateRouletteInput('36').valid).toBe(true);
  });
});

