/**
 * Mines Storage, Validation, and Import/Export Engine.
 *
 * Persists round records in IndexedDB via Dexie.
 * Enforces strict validation, detects duplicates, separates sources,
 * and supports complete JSON/CSV export and import.
 */

import type { MinesOutcome, MinesRoundRecord, MinesSourceType } from '../types/mines';
import { TOTAL_TILES } from '../math/minesProbability';
import { minesDb } from './minesDb';

export interface RoundValidationError {
  field: string;
  message: string;
}

/**
 * Validates a candidate round record against mathematical and board constraints.
 */
export function validateRoundRecord(data: Partial<MinesRoundRecord>): RoundValidationError[] {
  const errors: RoundValidationError[] = [];

  // Bomb count validation
  if (data.bombCount === undefined || data.bombCount < 1 || data.bombCount >= TOTAL_TILES) {
    errors.push({
      field: 'bombCount',
      message: `Bomb count must be between 1 and ${TOTAL_TILES - 1}, received ${data.bombCount}.`,
    });
  }

  // Outcome validation
  const validOutcomes: MinesOutcome[] = ['win', 'loss', 'cashout'];
  if (!data.outcome || !validOutcomes.includes(data.outcome)) {
    errors.push({
      field: 'outcome',
      message: `Outcome must be one of: ${validOutcomes.join(', ')}.`,
    });
  }

  // Source type validation
  const validSources: MinesSourceType[] = ['verified', 'manual', 'simulated'];
  if (!data.sourceType || !validSources.includes(data.sourceType)) {
    errors.push({
      field: 'sourceType',
      message: `Source type must be one of: ${validSources.join(', ')}.`,
    });
  }

  // Revealed safe coordinates validation
  const safeTiles = data.revealedSafeTiles || [];
  const safeSet = new Set<number>();
  for (const s of safeTiles) {
    if (typeof s !== 'number' || s < 0 || s >= TOTAL_TILES || !Number.isInteger(s)) {
      errors.push({
        field: 'revealedSafeTiles',
        message: `Tile coordinate ${s} is invalid (must be an integer from 0 to 24).`,
      });
    }
    if (safeSet.has(s)) {
      errors.push({
        field: 'revealedSafeTiles',
        message: `Duplicate safe coordinate ${s} found within same round.`,
      });
    }
    safeSet.add(s);
  }

  // Revealed bomb coordinates validation
  const bombTiles = data.revealedBombTiles || [];
  const bombSet = new Set<number>();
  for (const b of bombTiles) {
    if (typeof b !== 'number' || b < 0 || b >= TOTAL_TILES || !Number.isInteger(b)) {
      errors.push({
        field: 'revealedBombTiles',
        message: `Bomb coordinate ${b} is invalid (must be an integer from 0 to 24).`,
      });
    }
    if (bombSet.has(b)) {
      errors.push({
        field: 'revealedBombTiles',
        message: `Duplicate bomb coordinate ${b} found within same round.`,
      });
    }
    if (safeSet.has(b)) {
      errors.push({
        field: 'revealedBombTiles',
        message: `Tile ${b} cannot be simultaneously safe and a bomb.`,
      });
    }
    bombSet.add(b);
  }

  // Stake and payout validation
  if (data.stake !== undefined && data.stake < 0) {
    errors.push({ field: 'stake', message: 'Stake cannot be negative.' });
  }
  if (data.multiplierReached !== undefined && data.multiplierReached < 0) {
    errors.push({ field: 'multiplierReached', message: 'Multiplier cannot be negative.' });
  }

  return errors;
}

/**
 * Saves a new round to Dexie with duplicate checking.
 */
export async function saveMinesRound(
  round: Omit<MinesRoundRecord, 'id'>
): Promise<{ success: boolean; id?: number; error?: string }> {
  const errors = validateRoundRecord(round);
  if (errors.length > 0) {
    return {
      success: false,
      error: errors.map((e) => e.message).join(' '),
    };
  }

  // Check for duplicate roundId
  if (round.roundId) {
    const existingById = await minesDb.rounds.where('roundId').equals(round.roundId).first();
    if (existingById) {
      return { success: false, error: `Duplicate round ID '${round.roundId}' already exists.` };
    }
  }

  // Check for duplicate round fingerprint: identical timestamp, bombCount, outcome, safe tiles
  const safeSorted = [...round.revealedSafeTiles].sort().join(',');
  const bombSorted = [...round.revealedBombTiles].sort().join(',');

  const duplicates = await minesDb.rounds
    .where('timestamp')
    .equals(round.timestamp)
    .filter(
      (r) =>
        r.bombCount === round.bombCount &&
        r.outcome === round.outcome &&
        [...r.revealedSafeTiles].sort().join(',') === safeSorted &&
        [...r.revealedBombTiles].sort().join(',') === bombSorted
    )
    .toArray();

  if (duplicates.length > 0) {
    return { success: false, error: 'Identical round record already exists in database.' };
  }

  const id = await minesDb.rounds.add(round as MinesRoundRecord);
  return { success: true, id };
}

/**
 * Retrieves all rounds with optional filtering.
 */
export async function getMinesRounds(filters?: {
  sourceType?: string;
  outcome?: string;
  bombCount?: number;
  search?: string;
}): Promise<MinesRoundRecord[]> {
  let collection = minesDb.rounds.orderBy('timestamp').reverse();

  let rounds = await collection.toArray();

  if (filters?.sourceType && filters.sourceType !== 'all') {
    rounds = rounds.filter((r) => r.sourceType === filters.sourceType);
  }
  if (filters?.outcome && filters.outcome !== 'all') {
    rounds = rounds.filter((r) => r.outcome === filters.outcome);
  }
  if (filters?.bombCount && filters.bombCount > 0) {
    rounds = rounds.filter((r) => r.bombCount === filters.bombCount);
  }
  if (filters?.search && filters.search.trim()) {
    const term = filters.search.toLowerCase().trim();
    rounds = rounds.filter(
      (r) =>
        r.roundId.toLowerCase().includes(term) ||
        (r.notes && r.notes.toLowerCase().includes(term)) ||
        (r.provablyFair?.serverSeedHash && r.provablyFair.serverSeedHash.toLowerCase().includes(term))
    );
  }

  return rounds;
}

/**
 * Deletes a single round by ID.
 */
export async function deleteMinesRound(id: number): Promise<void> {
  await minesDb.rounds.delete(id);
}

/**
 * Clears all rounds from Dexie.
 */
export async function clearAllMinesRounds(): Promise<void> {
  await minesDb.rounds.clear();
}

/**
 * Exports all rounds as a formatted JSON document.
 */
export async function exportMinesJSON(): Promise<string> {
  const rounds = await minesDb.rounds.toArray();
  const exportData = {
    appName: 'Mines 5x5 AI Analyzer',
    exportedAt: new Date().toISOString(),
    totalRecords: rounds.length,
    records: rounds,
  };
  return JSON.stringify(exportData, null, 2);
}

/**
 * Exports rounds as CSV format.
 */
export async function exportMinesCSV(): Promise<string> {
  const rounds = await minesDb.rounds.toArray();
  const headers = [
    'roundId',
    'timestamp',
    'date',
    'bombCount',
    'outcome',
    'picksCount',
    'multiplierReached',
    'stake',
    'grossPayout',
    'netProfit',
    'sourceType',
    'validationStatus',
    'revealedSafeTiles',
    'revealedBombTiles',
  ];

  const rows = rounds.map((r) => [
    `"${r.roundId}"`,
    r.timestamp,
    `"${new Date(r.timestamp).toISOString()}"`,
    r.bombCount,
    r.outcome,
    r.picksCount,
    r.multiplierReached,
    r.stake,
    r.grossPayout,
    r.netProfit,
    r.sourceType,
    r.validationStatus,
    `"${r.revealedSafeTiles.join(';')}"`,
    `"${r.revealedBombTiles.join(';')}"`,
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

export interface ImportResult {
  importedCount: number;
  skippedDuplicates: number;
  invalidCount: number;
  errors: string[];
}

/**
 * Imports rounds from a JSON string.
 */
export async function importMinesJSON(jsonString: string): Promise<ImportResult> {
  const result: ImportResult = {
    importedCount: 0,
    skippedDuplicates: 0,
    invalidCount: 0,
    errors: [],
  };

  let rawList: any[] = [];
  try {
    const parsed = JSON.parse(jsonString);
    if (Array.isArray(parsed)) {
      rawList = parsed;
    } else if (parsed && Array.isArray(parsed.records)) {
      rawList = parsed.records;
    } else {
      result.errors.push('Unrecognized JSON structure. Expected array or object with .records array.');
      return result;
    }
  } catch (err: any) {
    result.errors.push(`JSON parsing error: ${err.message}`);
    return result;
  }

  for (let i = 0; i < rawList.length; i++) {
    const item = rawList[i];
    const candidate: Omit<MinesRoundRecord, 'id'> = {
      roundId: item.roundId || `imported_${Date.now()}_${i}`,
      timestamp: item.timestamp || Date.now(),
      bombCount: Number(item.bombCount) || 3,
      revealedSafeTiles: Array.isArray(item.revealedSafeTiles) ? item.revealedSafeTiles.map(Number) : [],
      revealedBombTiles: Array.isArray(item.revealedBombTiles) ? item.revealedBombTiles.map(Number) : [],
      allBombLocations: Array.isArray(item.allBombLocations) ? item.allBombLocations.map(Number) : undefined,
      outcome: item.outcome || 'loss',
      picksCount: Number(item.picksCount) || 0,
      multiplierReached: Number(item.multiplierReached) || 1,
      stake: Number(item.stake) || 0,
      grossPayout: Number(item.grossPayout) || 0,
      netProfit: Number(item.netProfit) || 0,
      sourceType: item.sourceType === 'verified' ? 'verified' : (item.sourceType === 'simulated' ? 'simulated' : 'manual'),
      validationStatus: 'valid',
      provablyFair: item.provablyFair,
      notes: item.notes,
    };

    const valErrors = validateRoundRecord(candidate);
    if (valErrors.length > 0) {
      result.invalidCount++;
      result.errors.push(`Row ${i + 1}: ${valErrors.map((e) => e.message).join(' ')}`);
      continue;
    }

    const saveResult = await saveMinesRound(candidate);
    if (saveResult.success) {
      result.importedCount++;
    } else if (saveResult.error?.includes('Duplicate') || saveResult.error?.includes('exists')) {
      result.skippedDuplicates++;
    } else {
      result.invalidCount++;
      result.errors.push(`Row ${i + 1}: ${saveResult.error}`);
    }
  }

  return result;
}

/**
 * Imports rounds from a CSV string.
 */
export async function importMinesCSV(csvString: string): Promise<ImportResult> {
  const result: ImportResult = {
    importedCount: 0,
    skippedDuplicates: 0,
    invalidCount: 0,
    errors: [],
  };

  const lines = csvString.trim().split(/\r?\n/);
  if (lines.length < 2) {
    result.errors.push('CSV contains no data rows.');
    return result;
  }

  const headerLine = lines[0].toLowerCase();
  const headers = headerLine.split(',').map((h) => h.replace(/["']/g, '').trim());

  const getCol = (cols: string[], name: string): string => {
    const idx = headers.indexOf(name);
    if (idx === -1 || idx >= cols.length) return '';
    return cols[idx].replace(/^["']|["']$/g, '').trim();
  };

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    // Simple CSV row parser (handles quoted fields)
    const cols = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');

    const roundId = getCol(cols, 'roundid') || `csv_${Date.now()}_${i}`;
    const timestamp = Number(getCol(cols, 'timestamp')) || Date.now();
    const bombCount = Number(getCol(cols, 'bombcount')) || 3;
    const outcome = (getCol(cols, 'outcome') as MinesOutcome) || 'loss';
    const picksCount = Number(getCol(cols, 'pickscount')) || 0;
    const multiplierReached = Number(getCol(cols, 'multiplierreached')) || 1;
    const stake = Number(getCol(cols, 'stake')) || 0;
    const grossPayout = Number(getCol(cols, 'grosspayout')) || 0;
    const netProfit = Number(getCol(cols, 'netprofit')) || 0;
    const rawSource = getCol(cols, 'sourcetype');
    const sourceType: MinesSourceType = rawSource === 'verified' ? 'verified' : (rawSource === 'simulated' ? 'simulated' : 'manual');

    const safeStr = getCol(cols, 'revealedsafetiles');
    const bombStr = getCol(cols, 'revealedbombtiles');

    const revealedSafeTiles = safeStr ? safeStr.split(/[;|,]/).map((s) => Number(s.trim())).filter((n) => !isNaN(n)) : [];
    const revealedBombTiles = bombStr ? bombStr.split(/[;|,]/).map((s) => Number(s.trim())).filter((n) => !isNaN(n)) : [];

    const candidate: Omit<MinesRoundRecord, 'id'> = {
      roundId,
      timestamp,
      bombCount,
      outcome,
      picksCount,
      multiplierReached,
      stake,
      grossPayout,
      netProfit,
      sourceType,
      validationStatus: 'valid',
      revealedSafeTiles,
      revealedBombTiles,
    };

    const valErrors = validateRoundRecord(candidate);
    if (valErrors.length > 0) {
      result.invalidCount++;
      result.errors.push(`CSV Line ${i + 1}: ${valErrors.map((e) => e.message).join(' ')}`);
      continue;
    }

    const saveResult = await saveMinesRound(candidate);
    if (saveResult.success) {
      result.importedCount++;
    } else if (saveResult.error?.includes('Duplicate') || saveResult.error?.includes('exists')) {
      result.skippedDuplicates++;
    } else {
      result.invalidCount++;
      result.errors.push(`CSV Line ${i + 1}: ${saveResult.error}`);
    }
  }

  return result;
}
