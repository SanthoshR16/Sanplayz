import { classifyNumber, validateRouletteInput } from '../math/mapping';
import { generatePreResultForecast } from '../math/adaptive';
import type { PredictionRecord, RouletteResult, Session, UserSettings } from '../types/roulette';
import { db, DEFAULT_USER_SETTINGS } from './dexie';

const SETTINGS_KEY = 'roulette_adaptive_settings_v1';
const CURRENT_SESSION_KEY = 'roulette_current_session_id_v1';

export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_USER_SETTINGS;
    return { ...DEFAULT_USER_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_USER_SETTINGS;
  }
}

export function saveSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings to localStorage:', err);
  }
}

export function getCurrentSessionId(): string {
  let id = localStorage.getItem(CURRENT_SESSION_KEY);
  if (!id) {
    id = `session-${Date.now()}`;
    localStorage.setItem(CURRENT_SESSION_KEY, id);
  }
  return id;
}

export function setCurrentSessionId(id: string): void {
  localStorage.setItem(CURRENT_SESSION_KEY, id);
}

/**
 * Ensures an active session exists in IndexedDB.
 */
export async function ensureActiveSession(): Promise<Session> {
  const currentId = getCurrentSessionId();
  const existing = await db.sessions.get(currentId);
  if (existing) {
    return existing;
  }

  const newSession: Session = {
    id: currentId,
    name: 'Main Session',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    minObservationWindow: 5,
  };
  await db.sessions.put(newSession);
  return newSession;
}

/**
 * Adds a new roulette outcome to the database.
 * CRITICAL REQUIREMENT: Records pre-result forecast BEFORE recording the new outcome.
 */
export async function addRouletteResult(
  num: number,
  sessionId: string,
  note?: string
): Promise<{ result: RouletteResult; prediction: PredictionRecord }> {
  const validation = validateRouletteInput(num);
  if (!validation.valid || validation.value === undefined) {
    throw new Error(validation.error || 'Invalid roulette number.');
  }

  const validNum = validation.value;
  const classification = classifyNumber(validNum);

  // 1. Get existing history for this session to forecast step N + 1
  const existingResults = await db.results.where('sessionId').equals(sessionId).sortBy('id');

  // 2. Generate pre-result prediction BEFORE entering outcome
  const settings = loadSettings();
  const prediction = generatePreResultForecast(
    existingResults,
    sessionId,
    settings.bayesianPriorAlpha,
    settings.bayesianPriorBeta
  );

  // Store prediction
  const predId = await db.predictions.add({
    ...prediction,
    actual: {
      number: classification.number,
      color: classification.color,
      parity: classification.parity,
    },
    evaluated: true,
  });
  prediction.id = predId;

  // 3. Store actual result
  const newResult: RouletteResult = {
    number: classification.number,
    color: classification.color,
    parity: classification.parity,
    joint: classification.joint,
    timestamp: Date.now(),
    sessionId,
    note,
  };

  const resultId = await db.results.add(newResult);
  newResult.id = resultId;

  // 4. Update session timestamp
  await db.sessions.update(sessionId, { updatedAt: Date.now() });

  // 5. Add audit log
  await db.auditLogs.add({
    action: 'insert',
    timestamp: Date.now(),
    details: `Added result #${validNum} (${classification.color}, ${classification.parity}) to session ${sessionId}`,
  });

  return { result: newResult, prediction };
}

/**
 * Undoes the most recent result for a session.
 */
export async function undoLastResult(sessionId: string): Promise<RouletteResult | null> {
  const sessionResults = await db.results.where('sessionId').equals(sessionId).sortBy('id');
  if (sessionResults.length === 0) return null;

  const lastResult = sessionResults[sessionResults.length - 1];
  if (lastResult.id !== undefined) {
    await db.results.delete(lastResult.id);

    // Also remove the corresponding prediction
    const predictions = await db.predictions
      .where('sessionId')
      .equals(sessionId)
      .and((p) => p.stepNumber === sessionResults.length)
      .toArray();
    for (const p of predictions) {
      if (p.id !== undefined) await db.predictions.delete(p.id);
    }

    await db.auditLogs.add({
      action: 'undo',
      timestamp: Date.now(),
      details: `Undid result #${lastResult.number} (id: ${lastResult.id}) from session ${sessionId}`,
    });
  }

  return lastResult;
}

/**
 * Corrects / updates an existing result.
 */
export async function updateResult(
  id: number,
  newNumber: number,
  note?: string
): Promise<RouletteResult> {
  const existing = await db.results.get(id);
  if (!existing) {
    throw new Error(`Result with ID ${id} not found.`);
  }

  const classification = classifyNumber(newNumber);
  const updated: RouletteResult = {
    ...existing,
    number: classification.number,
    color: classification.color,
    parity: classification.parity,
    joint: classification.joint,
    note: note !== undefined ? note : existing.note,
  };

  await db.results.put(updated);

  await db.auditLogs.add({
    action: 'update',
    timestamp: Date.now(),
    details: `Corrected result id ${id} from #${existing.number} to #${newNumber}`,
  });

  return updated;
}

/**
 * Deletes a specific result by ID.
 */
export async function deleteResultById(id: number): Promise<void> {
  const existing = await db.results.get(id);
  if (!existing) return;

  await db.results.delete(id);
  await db.auditLogs.add({
    action: 'undo',
    timestamp: Date.now(),
    details: `Deleted result #${existing.number} (id: ${id})`,
  });
}

/**
 * Gets all results for a session.
 */
export async function getSessionResults(sessionId: string): Promise<RouletteResult[]> {
  return await db.results.where('sessionId').equals(sessionId).sortBy('id');
}

/**
 * Gets all predictions for a session.
 */
export async function getSessionPredictions(sessionId: string): Promise<PredictionRecord[]> {
  return await db.predictions.where('sessionId').equals(sessionId).sortBy('stepNumber');
}

/**
 * Clears active numbers/results and predictions for a specific session (e.g. New Table / Reset active spins).
 * Keeps user settings and audit logs intact.
 */
export async function clearSessionResults(sessionId: string): Promise<number> {
  const results = await db.results.where('sessionId').equals(sessionId).toArray();
  const count = results.length;
  for (const r of results) {
    if (r.id !== undefined) await db.results.delete(r.id);
  }
  const predictions = await db.predictions.where('sessionId').equals(sessionId).toArray();
  for (const p of predictions) {
    if (p.id !== undefined) await db.predictions.delete(p.id);
  }
  await db.auditLogs.add({
    action: 'undo',
    timestamp: Date.now(),
    details: `Cleared ${count} active results for session ${sessionId} (New Table / Return Reset)`,
  });
  return count;
}

/**
 * Retrieves all stored results across all tables/sessions in database history.
 * Used for persistent model learning, global adaptation, and cumulative training.
 */
export async function getAllHistoricalResults(): Promise<RouletteResult[]> {
  return await db.results.orderBy('id').toArray();
}

/**
 * Starts a fresh table session.
 * CRITICAL ADAPTIVE FEATURE:
 * All previous table spins remain permanently stored in IndexedDB so the adaptive model
 * continues learning and improving. The active table view resets to 0 spins for the new wheel.
 */
export async function startNewTableSession(): Promise<Session> {
  const allSessions = await db.sessions.toArray();
  const nextNumber = allSessions.length + 1;
  const newSessionId = `session-${Date.now()}`;
  const newSession: Session = {
    id: newSessionId,
    name: `Table Session #${nextNumber}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    minObservationWindow: 5,
  };
  await db.sessions.put(newSession);
  setCurrentSessionId(newSessionId);

  await db.auditLogs.add({
    action: 'insert',
    timestamp: Date.now(),
    details: `Started fresh Table Session #${nextNumber} (${newSessionId}). All previous spins preserved for model training.`,
  });

  return newSession;
}

/**
 * Clears all data with confirmation.
 */
export async function clearAllDatabaseData(): Promise<void> {
  await db.results.clear();
  await db.predictions.clear();
  await db.sessions.clear();
  await db.auditLogs.clear();
  await db.payoutConfigs.clear();

  // Recreate default session
  await ensureActiveSession();
}

/**
 * Exports all data to a structured JSON string.
 */
export async function exportDatabaseJSON(): Promise<string> {
  const results = await db.results.toArray();
  const sessions = await db.sessions.toArray();
  const predictions = await db.predictions.toArray();
  const auditLogs = await db.auditLogs.toArray();

  const exportPayload = {
    version: 2,
    exportedAt: new Date().toISOString(),
    sessions,
    results,
    predictions,
    auditLogs,
  };

  return JSON.stringify(exportPayload, null, 2);
}

/**
 * Exports results to CSV format.
 */
export async function exportResultsCSV(sessionId?: string): Promise<string> {
  const results: RouletteResult[] = sessionId
    ? await db.results.where('sessionId').equals(sessionId).sortBy('id')
    : await db.results.toArray();

  const headers = ['id', 'timestamp', 'date_iso', 'sessionId', 'number', 'color', 'parity', 'joint', 'note'];
  const rows = results.map((r: RouletteResult) => [
    r.id ?? '',
    r.timestamp,
    new Date(r.timestamp).toISOString(),
    `"${r.sessionId}"`,
    r.number,
    r.color,
    r.parity,
    r.joint,
    `"${(r.note || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((row: (string | number)[]) => row.join(','))].join('\n');
}

/**
 * Imports data from JSON with strict validation and duplicate rejection.
 */
export async function importDatabaseJSON(jsonStr: string): Promise<{
  importedResults: number;
  importedSessions: number;
  skippedDuplicates: number;
}> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error('Invalid JSON format.');
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('JSON root must be an object.');
  }

  const data = parsed as {
    version?: number;
    results?: RouletteResult[];
    sessions?: Session[];
    predictions?: PredictionRecord[];
  };

  if (!Array.isArray(data.results)) {
    throw new Error('Missing or invalid "results" array in imported JSON.');
  }

  let importedResults = 0;
  let skippedDuplicates = 0;

  // Import sessions
  if (Array.isArray(data.sessions)) {
    for (const s of data.sessions) {
      if (s.id && s.name) {
        await db.sessions.put({
          id: String(s.id),
          name: String(s.name),
          createdAt: Number(s.createdAt) || Date.now(),
          updatedAt: Number(s.updatedAt) || Date.now(),
          minObservationWindow: s.minObservationWindow === 6 ? 6 : 5,
          notes: s.notes ? String(s.notes) : undefined,
        });
      }
    }
  }

  // Import results with validation
  for (const item of data.results) {
    const val = validateRouletteInput(item.number);
    if (!val.valid || val.value === undefined) {
      continue; // Skip invalid numbers
    }

    const c = classifyNumber(val.value);
    const sessionId = item.sessionId ? String(item.sessionId) : getCurrentSessionId();
    const timestamp = Number(item.timestamp) || Date.now();

    // Check duplicate: exact same number, timestamp, and sessionId
    const duplicate = await db.results
      .where('sessionId')
      .equals(sessionId)
      .and((r) => r.number === val.value && Math.abs(r.timestamp - timestamp) < 1000)
      .first();

    if (duplicate) {
      skippedDuplicates++;
      continue;
    }

    await db.results.add({
      number: c.number,
      color: c.color,
      parity: c.parity,
      joint: c.joint,
      timestamp,
      sessionId,
      note: item.note ? String(item.note) : undefined,
    });
    importedResults++;
  }

  await db.auditLogs.add({
    action: 'import',
    timestamp: Date.now(),
    details: `Imported ${importedResults} results, skipped ${skippedDuplicates} duplicates`,
  });

  return {
    importedResults,
    importedSessions: data.sessions?.length || 0,
    skippedDuplicates,
  };
}
