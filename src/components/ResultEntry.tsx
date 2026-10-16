import React, { useState, useId } from 'react';
import {
  PlusCircle,
  Undo2,
  AlertCircle,
  Sparkles,
  Grid,
  RotateCcw,
  Check,
  X,
} from 'lucide-react';
import { ALL_ROULETTE_NUMBERS, classifyNumber, validateRouletteInput } from '../math/mapping';
import type { Classification } from '../types/roulette';

interface ResultEntryProps {
  onAddResult: (num: number, note?: string) => Promise<void>;
  onUndoLastResult: () => Promise<void>;
  onClearActiveResults?: () => Promise<void>;
  totalResults: number;
  lastAddedNumber?: number;
}

export const ResultEntry: React.FC<ResultEntryProps> = ({
  onAddResult,
  onUndoLastResult,
  onClearActiveResults,
  totalResults,
}) => {
  const [inputValue, setInputValue] = useState<string>('');
  const [noteValue, setNoteValue] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [confirmClearActive, setConfirmClearActive] = useState<boolean>(false);

  const inputId = useId();

  // Real-time live classification preview
  let preview: Classification | null = null;
  const trimmed = inputValue.trim();
  if (trimmed !== '') {
    const check = validateRouletteInput(trimmed);
    if (check.valid && check.value !== undefined) {
      preview = classifyNumber(check.value);
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setErrorMessage(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const validation = validateRouletteInput(inputValue);
    if (!validation.valid || validation.value === undefined) {
      setErrorMessage(validation.error || 'Please enter a valid integer between 1 and 36.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddResult(validation.value, noteValue.trim() || undefined);
      setInputValue('');
      setNoteValue('');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to record result.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGridClick = async (num: number) => {
    setErrorMessage(null);
    try {
      setIsSubmitting(true);
      await onAddResult(num, noteValue.trim() || undefined);
      setInputValue('');
      setNoteValue('');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to record result.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="glass-panel" style={{ padding: '1.25rem' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        marginBottom: '1rem',
      }}>
        <div>
          <h2 className="panel-title">
            <PlusCircle size={18} color="#f43f5e" />
            <span>Enter Roulette Outcome (1–36)</span>
          </h2>
          <p className="panel-subtitle">
            Enter the drawn number only. Color (Red/Black) and parity (Odd/Even) are calculated automatically.
          </p>
        </div>

        <button
          onClick={() => setShowGrid(!showGrid)}
          className="btn-secondary"
          style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
          title="Toggle 1–36 Quick Selection Grid"
        >
          <Grid size={14} />
          <span>{showGrid ? 'Hide 1–36 Grid' : 'Show 1–36 Grid'}</span>
        </button>
      </div>

      {/* Main Input Form */}
      <form onSubmit={handleSubmit} style={{ marginBottom: '1.25rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          alignItems: 'start',
        }}>
          {/* Number Input Box */}
          <div>
            <label
              htmlFor={inputId}
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '0.4rem',
              }}
            >
              Roulette Number (Integer 1–36)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id={inputId}
                type="number"
                min="1"
                max="36"
                step="1"
                value={inputValue}
                onChange={handleInputChange}
                placeholder="e.g. 23"
                className="input-field font-mono"
                style={{
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  padding: '0.6rem 0.85rem',
                  borderColor: errorMessage ? '#f43f5e' : undefined,
                }}
                disabled={isSubmitting}
                autoFocus
              />
            </div>
          </div>

          {/* Optional Note Box */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '0.4rem',
              }}
            >
              Audit Note (Optional)
            </label>
            <input
              type="text"
              value={noteValue}
              onChange={(e) => setNoteValue(e.target.value)}
              placeholder="e.g. Spin #14, table 2"
              className="input-field"
              style={{ fontSize: '0.9rem', padding: '0.75rem 0.85rem' }}
              disabled={isSubmitting}
            />
          </div>

          {/* Action Buttons & Live Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="submit"
                onClick={handleSubmit}
                className="btn-primary"
                disabled={isSubmitting}
                id="add-result-btn"
                style={{ flex: 1, minWidth: 120 }}
              >
                <PlusCircle size={16} />
                <span>{isSubmitting ? 'Recording...' : 'Add Result'}</span>
              </button>

              <button
                type="button"
                onClick={onUndoLastResult}
                className="btn-secondary"
                disabled={totalResults === 0 || isSubmitting}
                id="undo-result-btn"
                title="Undo the most recent entered result"
                style={{ minWidth: 80 }}
              >
                <Undo2 size={15} />
                <span>Undo</span>
              </button>

              {onClearActiveResults && totalResults > 0 && (
                confirmClearActive ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.45)',
                    padding: '0.25rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                  }}>
                    <span style={{ fontSize: '0.75rem', color: '#fca5a5', fontWeight: 600 }}>
                      Clear all {totalResults}?
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        setConfirmClearActive(false);
                        await onClearActiveResults();
                      }}
                      className="btn-primary"
                      style={{
                        padding: '0.2rem 0.45rem',
                        background: '#ef4444',
                        borderColor: '#ef4444',
                        fontSize: '0.75rem',
                      }}
                      title="Confirm clear active spins"
                    >
                      <Check size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClearActive(false)}
                      className="btn-secondary"
                      style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem' }}
                      title="Cancel"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClearActive(true)}
                    className="btn-secondary"
                    disabled={isSubmitting}
                    id="clear-active-btn"
                    title="Clear all active table numbers for a fresh wheel session (preserves settings & training)"
                    style={{
                      borderColor: 'rgba(239, 68, 68, 0.35)',
                      color: '#fca5a5',
                      fontSize: '0.82rem',
                    }}
                  >
                    <RotateCcw size={14} />
                    <span>New Table</span>
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Live Preview Bar */}
        {preview && (
          <div style={{
            marginTop: '0.75rem',
            padding: '0.6rem 0.9rem',
            borderRadius: 'var(--radius-md)',
            background: preview.color === 'red' ? 'rgba(225, 29, 72, 0.12)' : 'rgba(30, 41, 59, 0.5)',
            border: `1px solid ${preview.color === 'red' ? 'var(--roulette-red-border)' : 'var(--roulette-black-border)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Sparkles size={16} color={preview.color === 'red' ? '#fb7185' : '#94a3b8'} />
              <span style={{ fontSize: '0.85rem', color: '#fff' }}>
                Preview classification for <strong>#{preview.number}</strong>:
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <span className={`badge ${preview.color === 'red' ? 'badge-red' : 'badge-black'}`}>
                {preview.color.toUpperCase()}
              </span>
              <span className={`badge ${preview.parity === 'odd' ? 'badge-odd' : 'badge-even'}`}>
                {preview.parity.toUpperCase()}
              </span>
              <span style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                alignSelf: 'center',
                marginLeft: '0.3rem',
              }}>
                ({preview.joint})
              </span>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div style={{
            marginTop: '0.75rem',
            padding: '0.6rem 0.9rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(225, 29, 72, 0.15)',
            border: '1px solid #f43f5e',
            color: '#fecdd3',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }} id="entry-error-msg">
            <AlertCircle size={16} color="#fb7185" />
            <span>{errorMessage}</span>
          </div>
        )}
      </form>

      {/* 1–36 Quick Selection Grid */}
      {showGrid && (
        <div style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '1rem',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.6rem',
          }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              1–36 Quick Selection Grid (Grouped by Dozens)
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Click any number to record instantly
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(46px, 1fr))',
            gap: '0.4rem',
          }}>
            {ALL_ROULETTE_NUMBERS.map((num) => {
              const c = classifyNumber(num);
              const isRed = c.color === 'red';
              return (
                <button
                  key={`num-chip-${num}`}
                  type="button"
                  className="grid-chip-btn"
                  onClick={() => handleGridClick(num)}
                  disabled={isSubmitting}
                  aria-label={`#${num} ${c.color} ${c.parity}`}
                  style={{
                    background: isRed
                      ? 'linear-gradient(135deg, rgba(225, 29, 72, 0.45) 0%, rgba(159, 18, 57, 0.55) 100%)'
                      : 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
                    border: `1px solid ${isRed ? 'rgba(244, 63, 94, 0.45)' : 'rgba(71, 85, 105, 0.45)'}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.5rem 0.2rem',
                    color: '#fff',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                  }}
                  title={`#${num} → ${c.color.toUpperCase()}, ${c.parity.toUpperCase()}`}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.08)';
                    e.currentTarget.style.borderColor = isRed ? '#f43f5e' : '#94a3b8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.borderColor = isRed ? 'rgba(244, 63, 94, 0.45)' : 'rgba(71, 85, 105, 0.45)';
                  }}
                >
                  <span>{num}</span>
                  <span style={{
                    fontSize: '0.55rem',
                    opacity: 0.7,
                    fontWeight: 500,
                    textTransform: 'uppercase',
                  }}>
                    {c.parity[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
