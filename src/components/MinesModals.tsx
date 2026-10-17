import React, { useState } from 'react';
import { X, BookOpen } from 'lucide-react';
import type { MinesOutcome, MinesRoundRecord, ModelPrediction } from '../types/mines';
import { saveMinesRound, importMinesJSON, importMinesCSV } from '../db/minesStorage';

/* -------------------------------------------------------------------------- */
/* Manual Entry / Evaluation Modal                                           */
/* -------------------------------------------------------------------------- */

interface MinesManualEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  defaultBombCount?: number;
  currentPrediction?: ModelPrediction | null;
}

export const MinesManualEntryModal: React.FC<MinesManualEntryModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  defaultBombCount = 3,
  currentPrediction = null,
}) => {
  const [bombCount, setBombCount] = useState<number>(defaultBombCount);
  const [provider, setProvider] = useState<string>('Spribe / BetInExchange247');
  const [customRoundId, setCustomRoundId] = useState<string>('');
  const [outcome, setOutcome] = useState<MinesOutcome>('cashout');
  const [safeTilesStr, setSafeTilesStr] = useState<string>(
    currentPrediction ? currentPrediction.suggestedTiles.map((t) => t + 1).join(', ') : '1, 5, 12'
  );
  const [bombTilesStr, setBombTilesStr] = useState<string>('');
  const [stake, setStake] = useState<number>(10);
  const [multiplier, setMultiplier] = useState<number>(1.45);
  const [notes, setNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const safeTiles = safeTilesStr
      .split(/[,;\s]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => Number(s) - 1); // 1-based to 0-based

    const bombTiles = bombTilesStr
      .split(/[,;\s]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => Number(s) - 1);

    const grossPayout = outcome === 'loss' ? 0 : Number((stake * multiplier).toFixed(2));
    const netProfit = outcome === 'loss' ? -stake : Number((stake * (multiplier - 1)).toFixed(2));

    // Determine if model prediction was safe
    let predictionHitNote = '';
    if (currentPrediction && currentPrediction.suggestedTiles.length > 0) {
      const hitBomb = currentPrediction.suggestedTiles.some((t) => bombTiles.includes(t));
      predictionHitNote = hitBomb
        ? `[Model Evaluation: FAILED - Bomb hit on predicted coordinate]`
        : `[Model Evaluation: SUCCESS - All predicted tiles safe]`;
    }

    const fullNotes = [
      provider ? `Provider: ${provider}` : '',
      predictionHitNote,
      notes.trim(),
    ]
      .filter(Boolean)
      .join(' | ');

    const candidate: Omit<MinesRoundRecord, 'id'> = {
      roundId: customRoundId.trim() || `manual_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      bombCount,
      revealedSafeTiles: safeTiles,
      revealedBombTiles: bombTiles,
      outcome,
      picksCount: safeTiles.length + (outcome === 'loss' ? 1 : 0),
      multiplierReached: outcome === 'loss' ? 0 : multiplier,
      stake,
      grossPayout,
      netProfit,
      sourceType: 'manual',
      validationStatus: 'valid',
      notes: fullNotes || undefined,
    };

    const res = await saveMinesRound(candidate);
    if (res.success) {
      onSaved();
      onClose();
    } else {
      setErrorMsg(res.error || 'Failed to save round');
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-content" style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
            Record Observed Round Manually
          </h2>
          <button type="button" onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {errorMsg && (
            <div style={{ background: 'rgba(225, 29, 72, 0.15)', border: '1px solid #e11d48', padding: '0.6rem', borderRadius: 6, color: '#fca5a5', fontSize: '0.8rem' }}>
              {errorMsg}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Provider / Platform
              </label>
              <input
                type="text"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                placeholder="e.g. Spribe / BetInExchange247"
                style={{ width: '100%', padding: '0.4rem 0.6rem', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid var(--border-card)', borderRadius: 6, color: '#fff' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Round Identifier (optional)
              </label>
              <input
                type="text"
                value={customRoundId}
                onChange={(e) => setCustomRoundId(e.target.value)}
                placeholder="e.g. round_#892147"
                style={{ width: '100%', padding: '0.4rem 0.6rem', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid var(--border-card)', borderRadius: 6, color: '#fff' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Bomb Count (1–24)
              </label>
              <input
                type="number"
                min="1"
                max="24"
                required
                value={bombCount}
                onChange={(e) => setBombCount(Number(e.target.value))}
                style={{ width: '100%', padding: '0.4rem 0.6rem', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid var(--border-card)', borderRadius: 6, color: '#fff' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Outcome
              </label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value as MinesOutcome)}
                style={{ width: '100%', padding: '0.4rem 0.6rem', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid var(--border-card)', borderRadius: 6, color: '#fff' }}
              >
                <option value="cashout">Cashed Out (Win)</option>
                <option value="win">Cleared Board (Win)</option>
                <option value="loss">Hit Bomb (Loss)</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              Revealed Safe Tiles (1–25, comma-separated)
            </label>
            <input
              type="text"
              placeholder="e.g. 1, 7, 14, 22"
              value={safeTilesStr}
              onChange={(e) => setSafeTilesStr(e.target.value)}
              style={{ width: '100%', padding: '0.4rem 0.6rem', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid var(--border-card)', borderRadius: 6, color: '#fff' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              Revealed Bomb Tiles (1–25, comma-separated, if known)
            </label>
            <input
              type="text"
              placeholder="e.g. 4, 18"
              value={bombTilesStr}
              onChange={(e) => setBombTilesStr(e.target.value)}
              style={{ width: '100%', padding: '0.4rem 0.6rem', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid var(--border-card)', borderRadius: 6, color: '#fff' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Stake ($)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={stake}
                onChange={(e) => setStake(Number(e.target.value))}
                style={{ width: '100%', padding: '0.4rem 0.6rem', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid var(--border-card)', borderRadius: 6, color: '#fff' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Multiplier Reached (e.g. 1.45)
              </label>
              <input
                type="number"
                min="1"
                step="any"
                value={multiplier}
                onChange={(e) => setMultiplier(Number(e.target.value))}
                disabled={outcome === 'loss'}
                style={{ width: '100%', padding: '0.4rem 0.6rem', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid var(--border-card)', borderRadius: 6, color: '#fff' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              Session Notes (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Live observation on Spribe Mines"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ width: '100%', padding: '0.4rem 0.6rem', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid var(--border-card)', borderRadius: 6, color: '#fff' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Manual Observation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Import / Export Modal                                                      */
/* -------------------------------------------------------------------------- */

interface MinesImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export const MinesImportExportModal: React.FC<MinesImportExportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [rawText, setRawText] = useState<string>('');
  const [importType, setImportType] = useState<'json' | 'csv'>('json');
  const [importStatus, setImportStatus] = useState<string>('');

  if (!isOpen) return null;

  const handleImport = async () => {
    setImportStatus('Processing import...');
    try {
      if (importType === 'json') {
        const res = await importMinesJSON(rawText);
        setImportStatus(
          `Imported ${res.importedCount} rounds, skipped ${res.skippedDuplicates} duplicates, ${res.invalidCount} invalid.`
        );
        if (res.importedCount > 0) onImportComplete();
      } else {
        const res = await importMinesCSV(rawText);
        setImportStatus(
          `Imported ${res.importedCount} rounds, skipped ${res.skippedDuplicates} duplicates, ${res.invalidCount} invalid.`
        );
        if (res.importedCount > 0) onImportComplete();
      }
    } catch (err: any) {
      setImportStatus(`Import failed: ${err.message}`);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-content" style={{ maxWidth: 540 }}>
        <div className="modal-header">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
            Import / Export Rounds
          </h2>
          <button type="button" onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button
              type="button"
              className={importType === 'json' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setImportType('json')}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
            >
              JSON Import
            </button>
            <button
              type="button"
              className={importType === 'csv' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setImportType('csv')}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
            >
              CSV Import
            </button>
          </div>

          <textarea
            rows={8}
            placeholder={
              importType === 'json'
                ? 'Paste JSON export array here...'
                : 'Paste CSV text with headers (roundId,timestamp,bombCount,outcome...)'
            }
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem',
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid var(--border-card)',
              borderRadius: 6,
              color: '#fff',
              fontSize: '0.78rem',
              fontFamily: 'var(--font-mono)',
            }}
          />

          {importStatus && (
            <div
              style={{
                fontSize: '0.8rem',
                color: '#c7d2fe',
                background: 'rgba(99, 102, 241, 0.15)',
                padding: '0.5rem',
                borderRadius: 6,
              }}
            >
              {importStatus}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Close
            </button>
            <button type="button" onClick={handleImport} className="btn-primary" disabled={!rawText.trim()}>
              Execute Import
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Help & Mathematical Disclaimers Modal                                      */
/* -------------------------------------------------------------------------- */

interface MinesHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MinesHelpModal: React.FC<MinesHelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-content" style={{ maxWidth: 620, maxHeight: '85vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={20} color="#818cf8" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0 }}>
              Mines Analysis & Probability Foundations
            </h2>
          </div>
          <button type="button" onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <section>
            <h3 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.3rem' }}>
              1. Conditional Safe Probabilities (No Spatial Memory)
            </h3>
            <p>
              In a standard 25-tile Mines board with $B$ uniformly placed bombs, the probability of selecting an unopened
              safe tile after $k$ safe tiles have been revealed is exactly:
            </p>
            <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '0.5rem 0.8rem', borderRadius: 6, fontFamily: 'var(--font-mono)', color: '#34d399', margin: '0.4rem 0' }}>
              P(Safe_{`{k+1}`} | k safe) = (25 - B - k) / (25 - k)
            </div>
            <p>
              For 3 bombs: Initial pick = 22/25 (88.00%). Pick 2 = 21/24 (87.50%). Pick 3 = 20/23 (86.96%).
              Crucially, <strong>every unopened tile shares the exact same probability</strong>. Past rounds do not
              leave "hot" or "cold" coordinates on independent uniform random number generators.
            </p>
          </section>

          <section>
            <h3 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.3rem' }}>
              2. Payout Multipliers and House Edge
            </h3>
            <p>
              Fair multipliers equal the reciprocal of survival probability: $M_{`{fair}`} = 1 / P(S_k)$. Casinos apply
              a Return to Player (RTP) factor (typically 97% for Spribe, 99% for Stake):
            </p>
            <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '0.5rem 0.8rem', borderRadius: 6, fontFamily: 'var(--font-mono)', color: '#a5b4fc', margin: '0.4rem 0' }}>
              Multiplier = RTP × C(25, k) / C(25 - B, k)
            </div>
            <p>
              Because the house edge is positive (3% to 1%), the mathematical Expected Value (EV) of every round is
              negative. No betting progression can mathematically invert negative EV.
            </p>
          </section>

          <section>
            <h3 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.3rem' }}>
              3. The +10% Target Paper-Trading Discipline
            </h3>
            <p>
              The +10% target is an <em>optional psychological stopping rule</em>, designed to lock in short-term
              positive fluctuations before prolonged exposure to the house edge erodes gains. It is <strong>never</strong> a
              guaranteed profit.
            </p>
          </section>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn-primary">
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
