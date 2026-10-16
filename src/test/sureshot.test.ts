import { describe, it, expect, beforeEach } from 'vitest';
import { generateRecommendations } from '../math/recommendations';
import { clearSessionResults, addRouletteResult, ensureActiveSession, clearAllDatabaseData, getSessionResults } from '../db/storage';
import type { RouletteResult } from '../types/roulette';

describe('Sureshot AI Signal & Table Reset Engine', () => {
  beforeEach(async () => {
    await clearAllDatabaseData();
  });

  it('Instructs user to WAIT when spins are balanced or insufficient', () => {
    // 0 spins
    const emptyRec = generateRecommendations([]);
    expect(emptyRec.sureshot.isTriggered).toBe(false);
    expect(emptyRec.sureshot.status).toBe('WAITING_FOR_TRIGGER');
    expect(emptyRec.sureshot.primaryDirective).toContain('DO NOT BET YET');
    expect(emptyRec.sureshot.focusType).toBe('NONE');
    expect(emptyRec.sureshot.targetSelection).toBe('WAIT');

    // 2 alternating spins: 1 Red Odd, 1 Black Even
    const mockResults: RouletteResult[] = [
      { number: 3, color: 'red', parity: 'odd', joint: 'red-odd', timestamp: Date.now(), sessionId: 's1', id: 1 },
      { number: 2, color: 'black', parity: 'even', joint: 'black-even', timestamp: Date.now() + 10, sessionId: 's1', id: 2 },
    ];
    const rec2 = generateRecommendations(mockResults);
    expect(rec2.sureshot.isTriggered).toBe(false);
    expect(rec2.sureshot.status).toBe('WAITING_FOR_TRIGGER');
    expect(rec2.sureshot.primaryDirective).toContain('DO NOT BET YET');
  });

  it('Triggers SURESHOT on 3x Black streak, strictly focusing on COLOR RED (never both)', () => {
    // 3 consecutive blacks: 11 (black odd), 35 (black odd), 2 (black even)
    const mockResults: RouletteResult[] = [
      { number: 11, color: 'black', parity: 'odd', joint: 'black-odd', timestamp: 1000, sessionId: 's1', id: 1 },
      { number: 35, color: 'black', parity: 'odd', joint: 'black-odd', timestamp: 2000, sessionId: 's1', id: 2 },
      { number: 2, color: 'black', parity: 'even', joint: 'black-even', timestamp: 3000, sessionId: 's1', id: 3 },
    ];

    const rec = generateRecommendations(mockResults);
    expect(rec.sureshot.isTriggered).toBe(true);
    expect(rec.sureshot.status).toBe('SURESHOT_ACTIVE');
    expect(rec.sureshot.focusType).toBe('COLOR'); // Strictly Color!
    expect(rec.sureshot.targetSelection).toBe('RED');
    expect(rec.sureshot.primaryDirective).toBe('🔥 STRIKE NOW: BET RED');
    expect(rec.sureshot.confidence).toBeGreaterThanOrEqual(86);
    expect(rec.sureshot.recommendedUnits).toBeGreaterThanOrEqual(2);
    expect(rec.sureshot.triggerFactors.length).toBeGreaterThan(0);
    expect(rec.sureshot.triggerFactors[0]).toContain('consecutive Black streak');
  });

  it('Triggers SURESHOT on 3x Even streak, strictly focusing on PARITY ODD (never both)', () => {
    // 3 consecutive evens with alternating colors: 36 (red even), 2 (black even), 12 (red even)
    const mockResults: RouletteResult[] = [
      { number: 36, color: 'red', parity: 'even', joint: 'red-even', timestamp: 1000, sessionId: 's1', id: 1 },
      { number: 2, color: 'black', parity: 'even', joint: 'black-even', timestamp: 2000, sessionId: 's1', id: 2 },
      { number: 12, color: 'red', parity: 'even', joint: 'red-even', timestamp: 3000, sessionId: 's1', id: 3 },
    ];

    const rec = generateRecommendations(mockResults);
    expect(rec.sureshot.isTriggered).toBe(true);
    expect(rec.sureshot.status).toBe('SURESHOT_ACTIVE');
    expect(rec.sureshot.focusType).toBe('PARITY'); // Strictly Parity!
    expect(rec.sureshot.targetSelection).toBe('ODD');
    expect(rec.sureshot.primaryDirective).toBe('⚡ STRIKE NOW: BET ODD');
    expect(rec.sureshot.confidence).toBeGreaterThanOrEqual(86);
    expect(rec.sureshot.recommendedUnits).toBeGreaterThanOrEqual(2);
  });

  it('Verifies single focus selection: picks the higher score between Color and Parity', () => {
    // 4 consecutive Evens vs 2 consecutive Blacks
    const mockResults: RouletteResult[] = [
      { number: 32, color: 'red', parity: 'even', joint: 'red-even', timestamp: 1000, sessionId: 's1', id: 1 },
      { number: 36, color: 'red', parity: 'even', joint: 'red-even', timestamp: 2000, sessionId: 's1', id: 2 },
      { number: 2, color: 'black', parity: 'even', joint: 'black-even', timestamp: 3000, sessionId: 's1', id: 3 },
      { number: 20, color: 'black', parity: 'even', joint: 'black-even', timestamp: 4000, sessionId: 's1', id: 4 },
    ];

    const rec = generateRecommendations(mockResults);
    // Parity has streak 4 (score >= 4), Color has streak 2 (score 1)
    expect(rec.sureshot.focusType).toBe('PARITY');
    expect(rec.sureshot.targetSelection).toBe('ODD');
    expect(rec.sureshot.primaryDirective).toContain('BET ODD');
  });

  it('clearSessionResults removes all active spins for the table while preserving the session', async () => {
    const session = await ensureActiveSession();
    await addRouletteResult(3, session.id);
    await addRouletteResult(11, session.id);
    await addRouletteResult(27, session.id);

    const beforeClear = await getSessionResults(session.id);
    expect(beforeClear.length).toBe(3);

    const clearedCount = await clearSessionResults(session.id);
    expect(clearedCount).toBe(3);

    const afterClear = await getSessionResults(session.id);
    expect(afterClear.length).toBe(0);
  });
});
