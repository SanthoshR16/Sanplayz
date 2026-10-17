import { describe, it, expect } from 'vitest';
import { classifyNumber } from '../math/mapping';

describe('Test 4: Specific Sample Sequence and Validation Examples', () => {
  it('Produces the exact specified classifications for the sequence [3, 8, 6, 23, 36]', () => {
    const seq = [3, 8, 6, 23, 36];
    const classifications = seq.map((n) => classifyNumber(n));

    // 3 → Odd, Red, Low
    expect(classifications[0]).toEqual({
      number: 3,
      color: 'red',
      parity: 'odd',
      half: 'low',
      joint: 'red-odd',
    });

    // 8 → Even, Black, Low
    expect(classifications[1]).toEqual({
      number: 8,
      color: 'black',
      parity: 'even',
      half: 'low',
      joint: 'black-even',
    });

    // 6 → Even, Black, Low
    expect(classifications[2]).toEqual({
      number: 6,
      color: 'black',
      parity: 'even',
      half: 'low',
      joint: 'black-even',
    });

    // 23 → Odd, Red, High
    expect(classifications[3]).toEqual({
      number: 23,
      color: 'red',
      parity: 'odd',
      half: 'high',
      joint: 'red-odd',
    });

    // 36 → Even, Red, High
    expect(classifications[4]).toEqual({
      number: 36,
      color: 'red',
      parity: 'even',
      half: 'high',
      joint: 'red-even',
    });
  });

  it('Matches Green Zero classification', () => {
    expect(classifyNumber(0)).toEqual({
      number: 0,
      color: 'green',
      parity: 'none',
      half: 'none',
      joint: 'green-zero',
    });
  });

  it('Matches all explicit validation examples from the prompt', () => {
    // 3 → Odd, Red
    expect(classifyNumber(3)).toMatchObject({ parity: 'odd', color: 'red' });
    // 8 → Even, Black
    expect(classifyNumber(8)).toMatchObject({ parity: 'even', color: 'black' });
    // 6 → Even, Black
    expect(classifyNumber(6)).toMatchObject({ parity: 'even', color: 'black' });
    // 23 → Odd, Red
    expect(classifyNumber(23)).toMatchObject({ parity: 'odd', color: 'red' });
    // 36 → Even, Red
    expect(classifyNumber(36)).toMatchObject({ parity: 'even', color: 'red' });
    // 12 → Even, Red
    expect(classifyNumber(12)).toMatchObject({ parity: 'even', color: 'red' });
    // 19 → Odd, Red
    expect(classifyNumber(19)).toMatchObject({ parity: 'odd', color: 'red' });
    // 25 → Odd, Red
    expect(classifyNumber(25)).toMatchObject({ parity: 'odd', color: 'red' });
    // 30 → Even, Red
    expect(classifyNumber(30)).toMatchObject({ parity: 'even', color: 'red' });
    // 2 → Even, Black
    expect(classifyNumber(2)).toMatchObject({ parity: 'even', color: 'black' });
  });
});
