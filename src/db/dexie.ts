import Dexie, { type Table } from 'dexie';
import type { PredictionRecord, RouletteResult, Session, UserSettings } from '../types/roulette';

export interface AuditLogEntry {
  id?: number;
  action: 'insert' | 'undo' | 'update' | 'clear' | 'import';
  timestamp: number;
  details: string;
}

export interface PayoutConfigEntry {
  id: string;
  category: string;
  payout: number;
  fees: number;
}

export class RouletteDatabase extends Dexie {
  results!: Table<RouletteResult, number>;
  sessions!: Table<Session, string>;
  predictions!: Table<PredictionRecord, number>;
  auditLogs!: Table<AuditLogEntry, number>;
  payoutConfigs!: Table<PayoutConfigEntry, string>;

  constructor() {
    super('RouletteAdaptiveDB');

    // Schema version 1
    this.version(1).stores({
      results: '++id, number, color, parity, joint, timestamp, sessionId',
      sessions: 'id, name, createdAt, updatedAt',
      predictions: '++id, stepNumber, sessionId, predictedAt, evaluated',
      auditLogs: '++id, action, timestamp',
      payoutConfigs: 'id, category',
    });

    // Version 2 upgrade demonstrating migration capability
    this.version(2).stores({
      results: '++id, number, color, parity, joint, timestamp, sessionId',
      sessions: 'id, name, createdAt, updatedAt',
      predictions: '++id, stepNumber, sessionId, predictedAt, evaluated',
      auditLogs: '++id, action, timestamp',
      payoutConfigs: 'id, category',
    });
  }
}

export const db = new RouletteDatabase();

export const DEFAULT_USER_SETTINGS: UserSettings = {
  minObservationWindow: 5,
  slidingOrder: 'newest-left',
  reducedMotion: false,
  bayesianPriorAlpha: 1,
  bayesianPriorBeta: 1,
};
