import { describe, it, expect } from 'vitest';
import { ALL_ROULETTE_NUMBERS, classifyNumber, RED_NUMBERS_SET, validateRouletteInput } from '../math/mapping';

describe('Test 1, 2, 3: Custom 1–36 Number Mapping and Classification', () => {
  it('Requirement 1: Every number from 1 to 36 has the correct custom color', () => {
    // Exact Red numbers specified in prompt:
    // 1–12: 1, 3, 5, 7, 9, 12
    // 13–24: 14, 16, 18, 19, 21, 23
    // 25–36: 25, 27, 30, 32, 34, 36
    const expectedReds = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    expect(expectedReds.length).toBe(18);

    for (const num of ALL_ROULETTE_NUMBERS) {
      const c = classifyNumber(num);
      if (expectedReds.includes(num)) {
        expect(c.color).toBe('red');
        expect(RED_NUMBERS_SET.has(num)).toBe(true);
      } else {
        expect(c.color).toBe('black');
        expect(RED_NUMBERS_SET.has(num)).toBe(false);
      }
    }
  });

  it('Requirement 2: Every number from 1 to 36 has the correct parity', () => {
    for (const num of ALL_ROULETTE_NUMBERS) {
      const c = classifyNumber(num);
      const expectedParity = num % 2 === 1 ? 'odd' : 'even';
      expect(c.parity).toBe(expectedParity);
    }
  });

  it('Requirement 3: Every number belongs to exactly one color and one parity category', () => {
    for (const num of ALL_ROULETTE_NUMBERS) {
      const c = classifyNumber(num);
      expect(['red', 'black']).toContain(c.color);
      expect(['odd', 'even']).toContain(c.parity);
      expect(c.number).toBe(num);
      expect(c.joint).toBe(`${c.color}-${c.parity}`);
    }
  });

  it('Requirement 7: Empty, decimal, negative, and out-of-range entries are rejected', () => {
    expect(validateRouletteInput('').valid).toBe(false);
    expect(validateRouletteInput(null).valid).toBe(false);
    expect(validateRouletteInput(undefined).valid).toBe(false);
    expect(validateRouletteInput('abc').valid).toBe(false);

    // Decimals
    expect(validateRouletteInput(3.14).valid).toBe(false);
    expect(validateRouletteInput('7.5').valid).toBe(false);

    // Negative numbers and zero
    expect(validateRouletteInput(0).valid).toBe(false);
    expect(validateRouletteInput(-5).valid).toBe(false);

    // Out of range > 36
    expect(validateRouletteInput(37).valid).toBe(false);
    expect(validateRouletteInput(100).valid).toBe(false);

    // Valid inputs
    expect(validateRouletteInput(1).valid).toBe(true);
    expect(validateRouletteInput('36').valid).toBe(true);
  });
});
