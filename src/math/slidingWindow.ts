import type { RouletteResult } from '../types/roulette';

export type SlidingSlot = RouletteResult | null;

/**
 * Computes the 5-slot visual window.
 * 
 * Order 'chronological' (matches the concrete numeric example in prompt):
 * Initial: [null, null, null, null, null]
 * After 3: [null, null, null, null, 3]
 * After 8: [null, null, null, 3, 8]
 * After 6: [null, null, 3, 8, 6]
 * After 23: [null, 3, 8, 6, 23]
 * After 36: [3, 8, 6, 23, 36]
 * After 6th (e.g. 17): [8, 6, 23, 36, 17]
 * 
 * Order 'newest-left' (matches the text label [NEWEST SLOT] [PREV] [PREV] [PREV] [OLDEST SLOT]):
 * Initial: [null, null, null, null, null]
 * After 3: [3, null, null, null, null]
 * After 36: [36, 23, 6, 8, 3]
 * After 6th (17): [17, 36, 23, 6, 8]
 */
export function getSlidingSlots(
  results: RouletteResult[],
  order: 'chronological' | 'newest-left' = 'chronological'
): SlidingSlot[] {
  const windowSize = 5;
  const recent = results.slice(-windowSize);

  if (order === 'chronological') {
    // Fill from right to left as new items arrive
    const slots: SlidingSlot[] = Array(windowSize).fill(null);
    const startIdx = windowSize - recent.length;
    for (let i = 0; i < recent.length; i++) {
      slots[startIdx + i] = recent[i];
    }
    return slots;
  } else {
    // Newest is at index 0 (far-left)
    const reversed = [...recent].reverse();
    const slots: SlidingSlot[] = Array(windowSize).fill(null);
    for (let i = 0; i < reversed.length; i++) {
      slots[i] = reversed[i];
    }
    return slots;
  }
}
