import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateRoundRecord,
  saveMinesRound,
  getMinesRounds,
  clearAllMinesRounds,
  exportMinesJSON,
  importMinesJSON,
} from '../db/minesStorage';
import type { MinesRoundRecord } from '../types/mines';

describe('Mines Storage, Validation, and Persistence Engine', () => {
  beforeEach(async () => {
    await clearAllMinesRounds();
  });

  it('Requirement 7: Strict data validation rejects invalid coordinates and configurations', () => {
    // Valid candidate
    const valid: Partial<MinesRoundRecord> = {
      bombCount: 3,
      outcome: 'cashout',
      sourceType: 'manual',
      revealedSafeTiles: [0, 4, 12],
      revealedBombTiles: [18],
    };
    expect(validateRoundRecord(valid).length).toBe(0);

    // Invalid bomb count (0 or 25)
    expect(validateRoundRecord({ ...valid, bombCount: 0 }).length).toBeGreaterThan(0);
    expect(validateRoundRecord({ ...valid, bombCount: 25 }).length).toBeGreaterThan(0);

    // Out of range coordinates (e.g. 25, -1)
    expect(validateRoundRecord({ ...valid, revealedSafeTiles: [25] }).length).toBeGreaterThan(0);
    expect(validateRoundRecord({ ...valid, revealedSafeTiles: [-1] }).length).toBeGreaterThan(0);

    // Duplicate coordinates within same list
    expect(validateRoundRecord({ ...valid, revealedSafeTiles: [2, 2] }).length).toBeGreaterThan(0);

    // Coordinate simultaneously safe and bomb
    expect(
      validateRoundRecord({ ...valid, revealedSafeTiles: [5], revealedBombTiles: [5] }).length
    ).toBeGreaterThan(0);
  });

  it('Requirement 7: Saving round persists to Dexie and prevents duplicates', async () => {
    const round: Omit<MinesRoundRecord, 'id'> = {
      roundId: 'round_test_001',
      timestamp: 1700000000,
      bombCount: 3,
      revealedSafeTiles: [1, 2, 3],
      revealedBombTiles: [],
      outcome: 'cashout',
      picksCount: 3,
      multiplierReached: 1.45,
      stake: 10,
      grossPayout: 14.5,
      netProfit: 4.5,
      sourceType: 'verified',
      validationStatus: 'valid',
    };

    const save1 = await saveMinesRound(round);
    expect(save1.success).toBe(true);

    const rounds = await getMinesRounds();
    expect(rounds.length).toBe(1);
    expect(rounds[0].roundId).toBe('round_test_001');

    // Attempting to save duplicate roundId fails
    const saveDuplicate = await saveMinesRound(round);
    expect(saveDuplicate.success).toBe(false);
    expect(saveDuplicate.error).toContain('Duplicate');
  });

  it('Requirement 7: Source type separation and search filtering', async () => {
    await saveMinesRound({
      roundId: 'round_verified_1',
      timestamp: 1000,
      bombCount: 3,
      revealedSafeTiles: [0],
      revealedBombTiles: [],
      outcome: 'cashout',
      picksCount: 1,
      multiplierReached: 1.10,
      stake: 10,
      grossPayout: 11,
      netProfit: 1,
      sourceType: 'verified',
      validationStatus: 'valid',
    });

    await saveMinesRound({
      roundId: 'round_simulated_2',
      timestamp: 2000,
      bombCount: 5,
      revealedSafeTiles: [1],
      revealedBombTiles: [2],
      outcome: 'loss',
      picksCount: 2,
      multiplierReached: 0,
      stake: 10,
      grossPayout: 0,
      netProfit: -10,
      sourceType: 'simulated',
      validationStatus: 'valid',
    });

    // Filter by source type
    const verifiedOnly = await getMinesRounds({ sourceType: 'verified' });
    expect(verifiedOnly.length).toBe(1);
    expect(verifiedOnly[0].roundId).toBe('round_verified_1');

    const simulatedOnly = await getMinesRounds({ sourceType: 'simulated' });
    expect(simulatedOnly.length).toBe(1);
    expect(simulatedOnly[0].roundId).toBe('round_simulated_2');

    // Filter by bomb count
    const fiveBombs = await getMinesRounds({ bombCount: 5 });
    expect(fiveBombs.length).toBe(1);

    // Search filter
    const searched = await getMinesRounds({ search: 'simulated' });
    expect(searched.length).toBe(1);
  });

  it('Requirement 7: Complete JSON export and import cycle with duplicate handling', async () => {
    await saveMinesRound({
      roundId: 'exp_01',
      timestamp: 10000,
      bombCount: 3,
      revealedSafeTiles: [5, 6],
      revealedBombTiles: [],
      outcome: 'cashout',
      picksCount: 2,
      multiplierReached: 1.26,
      stake: 20,
      grossPayout: 25.2,
      netProfit: 5.2,
      sourceType: 'manual',
      validationStatus: 'valid',
    });

    const jsonStr = await exportMinesJSON();
    expect(jsonStr).toContain('exp_01');

    // Clear database
    await clearAllMinesRounds();
    expect((await getMinesRounds()).length).toBe(0);

    // Import
    const importRes = await importMinesJSON(jsonStr);
    expect(importRes.importedCount).toBe(1);
    expect(importRes.skippedDuplicates).toBe(0);

    const restored = await getMinesRounds();
    expect(restored.length).toBe(1);
    expect(restored[0].roundId).toBe('exp_01');

    // Re-importing same JSON skips duplicate
    const reimport = await importMinesJSON(jsonStr);
    expect(reimport.importedCount).toBe(0);
    expect(reimport.skippedDuplicates).toBe(1);
  });
});
