import { describe, it, expect, beforeEach } from 'vitest';
import {
  addRouletteResult,
  clearAllDatabaseData,
  ensureActiveSession,
  exportDatabaseJSON,
  exportResultsCSV,
  getSessionResults,
  importDatabaseJSON,
  undoLastResult,
  updateResult,
} from '../db/storage';
import { db } from '../db/dexie';

describe('Test 14, 15, 16, 17: Storage, Persistence, Undo, Import/Export', () => {
  const sessionId = 'test-storage-session';

  beforeEach(async () => {
    await clearAllDatabaseData();
    await ensureActiveSession();
  });

  it('Requirement 14: Undo and correction preserve data integrity', async () => {
    // Add two results: 3 and 8
    const { result: r1 } = await addRouletteResult(3, sessionId);
    await addRouletteResult(8, sessionId);

    let sessionResults = await getSessionResults(sessionId);
    expect(sessionResults.length).toBe(2);
    expect(sessionResults[0].number).toBe(3);
    expect(sessionResults[1].number).toBe(8);

    // Undo the most recent (8)
    const undone = await undoLastResult(sessionId);
    expect(undone?.number).toBe(8);

    sessionResults = await getSessionResults(sessionId);
    expect(sessionResults.length).toBe(1);
    expect(sessionResults[0].number).toBe(3);

    // Correction: change result 1 from 3 to 23
    if (r1.id !== undefined) {
      const corrected = await updateResult(r1.id, 23);
      expect(corrected.number).toBe(23);
      expect(corrected.color).toBe('red');
      expect(corrected.parity).toBe('odd');

      const reloaded = await db.results.get(r1.id);
      expect(reloaded?.number).toBe(23);
    }
  });

  it('Requirement 15: IndexedDB persistence survives querying and preserves audit logs', async () => {
    await addRouletteResult(12, sessionId);
    await addRouletteResult(36, sessionId);

    const results = await getSessionResults(sessionId);
    expect(results.length).toBe(2);

    const auditLogs = await db.auditLogs.toArray();
    expect(auditLogs.length).toBeGreaterThanOrEqual(2);
    expect(auditLogs[0].action).toBe('insert');
  });

  it('Requirement 16: Export/import preserves valid history and prevents duplicate collisions', async () => {
    await addRouletteResult(3, sessionId);
    await addRouletteResult(8, sessionId);
    await addRouletteResult(6, sessionId);

    // Export to JSON
    const exportedJson = await exportDatabaseJSON();
    expect(exportedJson).toContain('"number": 3');
    expect(exportedJson).toContain('"number": 8');
    expect(exportedJson).toContain('"number": 6');

    // Export to CSV
    const exportedCsv = await exportResultsCSV(sessionId);
    expect(exportedCsv).toContain('number,color,parity,joint');
    expect(exportedCsv).toContain('3,red,odd,red-odd');

    // Import into fresh state
    await clearAllDatabaseData();
    let countBefore = (await getSessionResults(sessionId)).length;
    expect(countBefore).toBe(0);

    const importStats = await importDatabaseJSON(exportedJson);
    expect(importStats.importedResults).toBe(3);

    const reloaded = await db.results.toArray();
    expect(reloaded.length).toBe(3);

    // Re-importing same JSON should detect duplicates
    const secondImport = await importDatabaseJSON(exportedJson);
    expect(secondImport.skippedDuplicates).toBe(3);
    expect(secondImport.importedResults).toBe(0);
  });

  it('Requirement 17: Clearing data properly resets IndexedDB tables and recreates default session', async () => {
    await addRouletteResult(7, sessionId);
    expect((await db.results.toArray()).length).toBe(1);

    await clearAllDatabaseData();
    expect((await db.results.toArray()).length).toBe(0);
    expect((await db.predictions.toArray()).length).toBe(0);

    // Default session is recreated
    const sessions = await db.sessions.toArray();
    expect(sessions.length).toBeGreaterThanOrEqual(1);
  });
});
