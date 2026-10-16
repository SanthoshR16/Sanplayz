import React, { useState } from 'react';
import {
  X,
  Sliders,
  Download,
  Upload,
  AlertTriangle,
  FileDown,
  Layers,
  HelpCircle,
  Edit3,
} from 'lucide-react';
import { classifyNumber, validateRouletteInput } from '../math/mapping';
import type { RouletteResult, UserSettings } from '../types/roulette';

// -------------------------------------------------------------
// SETTINGS MODAL
// -------------------------------------------------------------
interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSaveSettings: (settings: UserSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [minWindow, setMinWindow] = useState<5 | 6>(settings.minObservationWindow);
  const [order, setOrder] = useState<'newest-left' | 'newest-right'>(settings.slidingOrder);
  const [reducedMotion, setReducedMotion] = useState<boolean>(settings.reducedMotion);
  const [priorAlpha, setPriorAlpha] = useState<number>(settings.bayesianPriorAlpha);
  const [priorBeta, setPriorBeta] = useState<number>(settings.bayesianPriorBeta);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings({
      minObservationWindow: minWindow,
      slidingOrder: order,
      reducedMotion,
      bayesianPriorAlpha: Math.max(0.1, Number(priorAlpha) || 1),
      bayesianPriorBeta: Math.max(0.1, Number(priorBeta) || 1),
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sliders size={20} color="#6366f1" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>Analysis Settings</h3>
          </div>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '0.35rem' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* Minimum Observation Window */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#fff', marginBottom: '0.3rem' }}>
              Minimum Observation Window
            </label>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Specifies the required initial sample threshold before full statistical assessments and rolling assessments unlock.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setMinWindow(5)}
                className={minWindow === 5 ? 'btn-primary' : 'btn-secondary'}
                style={{ flex: 1, padding: '0.5rem' }}
              >
                5 Results (Default)
              </button>
              <button
                type="button"
                onClick={() => setMinWindow(6)}
                className={minWindow === 6 ? 'btn-primary' : 'btn-secondary'}
                style={{ flex: 1, padding: '0.5rem' }}
              >
                6 Results
              </button>
            </div>
          </div>

          {/* Sliding Direction */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#fff', marginBottom: '0.3rem' }}>
              Sliding History Visual Layout
            </label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setOrder('newest-right')}
                className={order === 'newest-right' ? 'btn-primary' : 'btn-secondary'}
                style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem' }}
              >
                Oldest → Newest (L to R)
              </button>
              <button
                type="button"
                onClick={() => setOrder('newest-left')}
                className={order === 'newest-left' ? 'btn-primary' : 'btn-secondary'}
                style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem' }}
              >
                Newest on Left
              </button>
            </div>
          </div>

          {/* Reduced Motion Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0' }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>Reduced Motion</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Disables sliding CSS transitions for accessibility</div>
            </div>
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={(e) => setReducedMotion(e.target.checked)}
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
          </div>

          {/* Bayesian Prior Parameters */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.9rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#fff', marginBottom: '0.3rem' }}>
              Bayesian Beta Prior Parameters
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Prior Alpha (α):</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={priorAlpha}
                  onChange={(e) => setPriorAlpha(Number(e.target.value))}
                  className="input-field font-mono"
                  style={{ fontSize: '0.85rem', padding: '0.45rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Prior Beta (β):</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={priorBeta}
                  onChange={(e) => setPriorBeta(Number(e.target.value))}
                  className="input-field font-mono"
                  style={{ fontSize: '0.85rem', padding: '0.45rem' }}
                />
              </div>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.3rem' }}>
              Beta(1, 1) represents a non-informative uniform prior. Beta(18, 18) represents strong theoretical grounding.
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} className="btn-primary">Save Settings</button>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// CUSTOM MAPPING MODAL
// -------------------------------------------------------------
interface MappingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MappingModal: React.FC<MappingModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 750, padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={20} color="#f43f5e" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>Authoritative Custom 1–36 Number Mapping</h3>
          </div>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '0.35rem' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{
          background: 'rgba(225, 29, 72, 0.1)',
          border: '1px solid var(--roulette-red-border)',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem',
          fontSize: '0.8rem',
          color: '#fecdd3',
          marginBottom: '1.25rem',
          lineHeight: 1.45,
        }}>
          <strong>CRITICAL ARCHITECTURE NOTICE:</strong> This application executes an exact custom 1–36 mapping rather than conventional European or American roulette.
          The 36 outcomes are strictly allocated across three dozens.
        </div>

        {/* 3 Dozen Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
          {/* 1–12 */}
          <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff', marginBottom: '0.4rem' }}>
              Numbers 1–12: Red = [1, 3, 5, 7, 9, 12] | Black = [2, 4, 6, 8, 10, 11]
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => {
                const c = classifyNumber(num);
                const isRed = c.color === 'red';
                return (
                  <span
                    key={`map-d1-${num}`}
                    className={`badge ${isRed ? 'badge-red' : 'badge-black'}`}
                    style={{ fontSize: '0.8rem', minWidth: 46, justifyContent: 'center' }}
                  >
                    #{num} ({c.parity[0].toUpperCase()})
                  </span>
                );
              })}
            </div>
          </div>

          {/* 13–24 */}
          <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff', marginBottom: '0.4rem' }}>
              Numbers 13–24: Red = [14, 16, 18, 19, 21, 23] | Black = [13, 15, 17, 20, 22, 24]
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {Array.from({ length: 12 }, (_, i) => i + 13).map((num) => {
                const c = classifyNumber(num);
                const isRed = c.color === 'red';
                return (
                  <span
                    key={`map-d2-${num}`}
                    className={`badge ${isRed ? 'badge-red' : 'badge-black'}`}
                    style={{ fontSize: '0.8rem', minWidth: 46, justifyContent: 'center' }}
                  >
                    #{num} ({c.parity[0].toUpperCase()})
                  </span>
                );
              })}
            </div>
          </div>

          {/* 25–36 */}
          <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff', marginBottom: '0.4rem' }}>
              Numbers 25–36: Red = [25, 27, 30, 32, 34, 36] | Black = [26, 28, 29, 31, 33, 35]
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {Array.from({ length: 12 }, (_, i) => i + 25).map((num) => {
                const c = classifyNumber(num);
                const isRed = c.color === 'red';
                return (
                  <span
                    key={`map-d3-${num}`}
                    className={`badge ${isRed ? 'badge-red' : 'badge-black'}`}
                    style={{ fontSize: '0.8rem', minWidth: 46, justifyContent: 'center' }}
                  >
                    #{num} ({c.parity[0].toUpperCase()})
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-primary">Close Details</button>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// EXPORT & IMPORT MODAL
// -------------------------------------------------------------
interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportJSON: () => Promise<void>;
  onExportCSV: () => Promise<void>;
  onImportJSON: (jsonStr: string) => Promise<{ importedResults: number; skippedDuplicates: number }>;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  onExportJSON,
  onExportCSV,
  onImportJSON,
}) => {
  const [importJsonText, setImportJsonText] = useState<string>('');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleImport = async () => {
    if (!importJsonText.trim()) {
      setImportStatus('Please paste valid JSON content.');
      return;
    }
    try {
      setIsProcessing(true);
      const res = await onImportJSON(importJsonText);
      setImportStatus(`Successfully imported ${res.importedResults} results (${res.skippedDuplicates} duplicates skipped).`);
      setImportJsonText('');
    } catch (err: unknown) {
      setImportStatus(err instanceof Error ? err.message : 'Import failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Download size={20} color="#06b6d4" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>Data Management & Backups</h3>
          </div>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '0.35rem' }}>
            <X size={18} />
          </button>
        </div>

        {/* Export Actions */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.9rem', color: '#fff', marginBottom: '0.4rem' }}>Export Data</h4>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            Download complete IndexedDB data or tabular CSV format for spreadsheets and offline analysis.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={onExportJSON} className="btn-secondary" style={{ flex: 1 }}>
              <Download size={14} />
              <span>Export Full JSON</span>
            </button>
            <button onClick={onExportCSV} className="btn-secondary" style={{ flex: 1 }}>
              <FileDown size={14} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Import Action */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
          <h4 style={{ fontSize: '0.9rem', color: '#fff', marginBottom: '0.4rem' }}>Import JSON Backup</h4>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            Paste exported JSON data below. Results will be validated and merged, with duplicate records safely ignored.
          </p>
          <textarea
            value={importJsonText}
            onChange={(e) => setImportJsonText(e.target.value)}
            placeholder="Paste exported JSON payload here..."
            className="input-field font-mono"
            rows={5}
            style={{ fontSize: '0.75rem', marginBottom: '0.75rem', width: '100%' }}
          />

          {importStatus && (
            <div style={{
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.5rem',
              fontSize: '0.75rem',
              color: '#c7d2fe',
              marginBottom: '0.75rem',
            }}>
              {importStatus}
            </div>
          )}

          <button
            onClick={handleImport}
            className="btn-primary"
            disabled={isProcessing}
            style={{ width: '100%' }}
          >
            <Upload size={14} />
            <span>{isProcessing ? 'Validating...' : 'Validate & Import Data'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// CLEAR CONFIRMATION MODAL
// -------------------------------------------------------------
interface ClearConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmClear: () => Promise<void>;
}

export const ClearConfirmModal: React.FC<ClearConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirmClear,
}) => {
  const [isClearing, setIsClearing] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleClear = async () => {
    setIsClearing(true);
    await onConfirmClear();
    setIsClearing(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '1.5rem', maxWidth: 480 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#fb7185', marginBottom: '1rem' }}>
          <AlertTriangle size={24} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Confirm Complete Reset</h3>
        </div>

        <p style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.5, marginBottom: '0.75rem' }}>
          Are you sure you want to erase all stored outcomes, pre-result predictions, sessions, and audit logs?
        </p>

        <div style={{
          background: 'rgba(225, 29, 72, 0.12)',
          border: '1px solid var(--roulette-red-border)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.75rem',
          fontSize: '0.75rem',
          color: '#fecdd3',
          marginBottom: '1.25rem',
        }}>
          <strong>Backup Reminder:</strong> Browser-local IndexedDB storage cannot be recovered once cleared. If you need this data later, please export your JSON or CSV file first.
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button onClick={onClose} className="btn-secondary" disabled={isClearing}>
            Cancel
          </button>
          <button onClick={handleClear} className="btn-danger" disabled={isClearing}>
            {isClearing ? 'Clearing...' : 'Confirm & Wipe Data'}
          </button>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// EDIT RESULT MODAL
// -------------------------------------------------------------
interface EditResultModalProps {
  isOpen: boolean;
  result: RouletteResult | null;
  onClose: () => void;
  onSaveCorrection: (id: number, newNumber: number, note?: string) => Promise<void>;
}

export const EditResultModal: React.FC<EditResultModalProps> = ({
  isOpen,
  result,
  onClose,
  onSaveCorrection,
}) => {
  const [newNum, setNewNum] = useState<number>(result?.number || 1);
  const [newNote, setNewNote] = useState<string>(result?.note || '');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !result) return null;

  const handleSave = async () => {
    const v = validateRouletteInput(newNum);
    if (!v.valid || v.value === undefined) {
      setError(v.error || 'Invalid number.');
      return;
    }
    if (result.id === undefined) return;

    await onSaveCorrection(result.id, v.value, newNote.trim() || undefined);
    onClose();
  };

  const preview = classifyNumber(newNum >= 1 && newNum <= 36 ? newNum : 1);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '1.5rem', maxWidth: 440 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Edit3 size={18} color="#6366f1" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Correct Result #{result.id}</h3>
          </div>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '0.35rem' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
              Corrected Number (1–36)
            </label>
            <input
              type="number"
              min="1"
              max="36"
              value={newNum}
              onChange={(e) => setNewNum(Number(e.target.value))}
              className="input-field font-mono"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
              Audit Note
            </label>
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Reason for correction..."
              className="input-field"
            />
          </div>

          {/* New classification preview */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.5)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.65rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Recalculated:</span>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <span className={`badge ${preview.color === 'red' ? 'badge-red' : 'badge-black'}`}>
                {preview.color.toUpperCase()}
              </span>
              <span className={`badge ${preview.parity === 'odd' ? 'badge-odd' : 'badge-even'}`}>
                {preview.parity.toUpperCase()}
              </span>
            </div>
          </div>

          {error && <div style={{ fontSize: '0.75rem', color: '#fb7185' }}>{error}</div>}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} className="btn-primary">Save Correction</button>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// HELP & EDUCATIONAL GUIDE MODAL
// -------------------------------------------------------------
interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 680, padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HelpCircle size={20} color="#6366f1" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>Mathematical Principles & Guide</h3>
          </div>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '0.35rem' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '0.25rem' }}>1. Custom 1–36 Mapping & Independence</h4>
            <p>
              Unlike standard roulette, this system maps 18 Red and 18 Black numbers according to exact specifications. In this mapping, Red-Odd has 10 outcomes while Red-Even has 8. Thus, Color and Parity are mathematically <strong>dependent</strong>: P(Red ∩ Odd) = 27.78% ≠ 25.00%.
            </p>
          </div>

          <div>
            <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '0.25rem' }}>2. Gambler's Fallacy & Independent Trials</h4>
            <p>
              Every physical spin of a fair roulette wheel is an independent event. Observing 10 consecutive Reds does not alter the physical probability of the next spin (it remains exactly 18/36 = 50.0%). The application displays observed frequencies as historical descriptions, never as guaranteed predictions.
            </p>
          </div>

          <div>
            <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '0.25rem' }}>3. House Edge & Expected Value</h4>
            <p>
              The house edge is defined mathematically as \(H = -EV_S / S\). For a fair 1:1 wager on 18/36 outcomes, EV is zero and the house edge is 0.00%. If payouts are less than break-even or deductions are applied, the house edge is positive.
            </p>
          </div>

          <div>
            <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '0.25rem' }}>4. Out-of-Sample Evaluation</h4>
            <p>
              Before every result is recorded, the model logs its prospective forecast for step \(N+1\). Once actual data arrives, it evaluates Brier score and log loss. This strict temporal ordering prevents future data leakage.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button onClick={onClose} className="btn-primary">Close Guide</button>
        </div>
      </div>
    </div>
  );
};
