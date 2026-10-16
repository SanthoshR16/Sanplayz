import { describe, it, expect } from 'vitest';
import { classifyNumber } from '../math/mapping';
import { getSlidingSlots } from '../math/slidingWindow';
import type { RouletteResult } from '../types/roulette';

function makeResult(n: number, id: number): RouletteResult {
  const c = classifyNumber(n);
  return {
    id,
    number: c.number,
    color: c.color,
    parity: c.parity,
    joint: c.joint,
    timestamp: 1000 + id * 100,
    sessionId: 'test-session',
  };
}

describe('Test 5 & 6: Five-Slot History Movement and Shift Behavior', () => {
  it('Requirement 5: Five-slot history movement exactly matches the specified example sequence', () => {
    // Initial state: [ EMPTY ] [ EMPTY ] [ EMPTY ] [ EMPTY ] [ EMPTY ]
    let history: RouletteResult[] = [];
    let slots = getSlidingSlots(history, 'chronological');
    expect(slots.map((s) => s?.number ?? null)).toEqual([null, null, null, null, null]);

    // After entering 3: [ EMPTY ] [ EMPTY ] [ EMPTY ] [ EMPTY ] [ 3 ]
    history = [makeResult(3, 1)];
    slots = getSlidingSlots(history, 'chronological');
    expect(slots.map((s) => s?.number ?? null)).toEqual([null, null, null, null, 3]);

    // After entering 8: [ EMPTY ] [ EMPTY ] [ EMPTY ] [ 3 ] [ 8 ]
    history.push(makeResult(8, 2));
    slots = getSlidingSlots(history, 'chronological');
    expect(slots.map((s) => s?.number ?? null)).toEqual([null, null, null, 3, 8]);

    // After entering 6: [ EMPTY ] [ EMPTY ] [ 3 ] [ 8 ] [ 6 ]
    history.push(makeResult(6, 3));
    slots = getSlidingSlots(history, 'chronological');
    expect(slots.map((s) => s?.number ?? null)).toEqual([null, null, 3, 8, 6]);

    // After entering 23: [ EMPTY ] [ 3 ] [ 8 ] [ 6 ] [ 23 ]
    history.push(makeResult(23, 4));
    slots = getSlidingSlots(history, 'chronological');
    expect(slots.map((s) => s?.number ?? null)).toEqual([null, 3, 8, 6, 23]);

    // After entering 36: [ 3 ] [ 8 ] [ 6 ] [ 23 ] [ 36 ]
    history.push(makeResult(36, 5));
    slots = getSlidingSlots(history, 'chronological');
    expect(slots.map((s) => s?.number ?? null)).toEqual([3, 8, 6, 23, 36]);
  });

  it('Requirement 6: A sixth result shifts the visible window without deleting earlier history', () => {
    const history: RouletteResult[] = [
      makeResult(3, 1),
      makeResult(8, 2),
      makeResult(6, 3),
      makeResult(23, 4),
      makeResult(36, 5),
    ];

    // Add 6th result (e.g. 17)
    history.push(makeResult(17, 6));

    // Visible window shifts to: [ 8 ] [ 6 ] [ 23 ] [ 36 ] [ 17 ]
    const slots = getSlidingSlots(history, 'chronological');
    expect(slots.map((s) => s?.number ?? null)).toEqual([8, 6, 23, 36, 17]);

    // CRITICAL: Complete history is fully retained! Earlier record #3 is NOT deleted!
    expect(history.length).toBe(6);
    expect(history[0].number).toBe(3);
    expect(history[0].id).toBe(1);
  });

  it('Also supports the Newest-on-Left layout mode correctly', () => {
    const history: RouletteResult[] = [
      makeResult(3, 1),
      makeResult(8, 2),
      makeResult(6, 3),
      makeResult(23, 4),
      makeResult(36, 5),
    ];

    const slots = getSlidingSlots(history, 'newest-left');
    // In newest-left, slot 0 is the newest (36), followed by 23, 6, 8, 3
    expect(slots.map((s) => s?.number ?? null)).toEqual([36, 23, 6, 8, 3]);

    // When 6th item arrives (17)
    history.push(makeResult(17, 6));
    const updatedSlots = getSlidingSlots(history, 'newest-left');
    expect(updatedSlots.map((s) => s?.number ?? null)).toEqual([17, 36, 23, 6, 8]);
    expect(history.length).toBe(6);
  });
});
