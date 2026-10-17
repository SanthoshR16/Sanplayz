/**
 * Dexie IndexedDB Database for Mines 5x5 Analyzer.
 */

import Dexie, { type Table } from 'dexie';
import type { MinesRoundRecord } from '../types/mines';

export class MinesDatabase extends Dexie {
  rounds!: Table<MinesRoundRecord, number>;

  constructor() {
    super('MinesAnalyzerDB');

    this.version(1).stores({
      rounds: '++id, roundId, timestamp, bombCount, outcome, sourceType, validationStatus',
    });
  }
}

export const minesDb = new MinesDatabase();
