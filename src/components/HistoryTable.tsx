import React, { useState } from 'react';
import { Table, Search, Edit3, Trash2, Calendar } from 'lucide-react';
import type { RouletteResult } from '../types/roulette';

interface HistoryTableProps {
  results: RouletteResult[];
  onEditResult: (result: RouletteResult) => void;
  onDeleteResult: (id: number) => Promise<void>;
}

export const HistoryTable: React.FC<HistoryTableProps> = ({
  results,
  onEditResult,
  onDeleteResult,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [colorFilter, setColorFilter] = useState<'all' | 'red' | 'black'>('all');
  const [parityFilter, setParityFilter] = useState<'all' | 'odd' | 'even'>('all');

  const filtered = results.filter((r) => {
    if (colorFilter !== 'all' && r.color !== colorFilter) return false;
    if (parityFilter !== 'all' && r.parity !== parityFilter) return false;
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      const matchNum = String(r.number).includes(term);
      const matchNote = (r.note || '').toLowerCase().includes(term);
      if (!matchNum && !matchNote) return false;
    }
    return true;
  });

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
            <Table size={18} color="#6366f1" />
            <span>Complete Historical Audit Log</span>
          </h2>
          <p className="panel-subtitle">
            Permanent, audited chronological record of all recorded outcomes with timestamps and correction options.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search number/note..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem 0.35rem 1.8rem', width: 170 }}
            />
          </div>

          {/* Color Filter */}
          <select
            value={colorFilter}
            onChange={(e) => setColorFilter(e.target.value as 'all' | 'red' | 'black')}
            className="input-field"
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem', width: 'auto' }}
          >
            <option value="all">All Colors</option>
            <option value="red">Red Only</option>
            <option value="black">Black Only</option>
          </select>

          {/* Parity Filter */}
          <select
            value={parityFilter}
            onChange={(e) => setParityFilter(e.target.value as 'all' | 'odd' | 'even')}
            className="input-field"
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem', width: 'auto' }}
          >
            <option value="all">All Parities</option>
            <option value="odd">Odd Only</option>
            <option value="even">Even Only</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      {results.length === 0 ? (
        <div style={{
          background: 'rgba(15, 23, 42, 0.4)',
          border: '1px dashed var(--border-card)',
          borderRadius: 'var(--radius-md)',
          padding: '2.5rem 1rem',
          textAlign: 'center',
          color: 'var(--text-muted)',
        }}>
          <Calendar size={32} color="#475569" style={{ margin: '0 auto 0.5rem auto' }} />
          <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>No Recorded Outcomes Yet</div>
          <p style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>
            Enter numbers using the input above or the 1–36 grid to populate the historical log.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: 'rgba(15, 23, 42, 0.4)',
          borderRadius: 'var(--radius-md)',
          padding: '2rem 1rem',
          textAlign: 'center',
          color: 'var(--text-muted)',
        }}>
          No results match the current filters.
        </div>
      ) : (
        <div style={{ overflowX: 'auto', maxHeight: 420, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#0e1526', zIndex: 10 }}>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '0.6rem 0.75rem' }}>#</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Number</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Color</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Parity</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Joint</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Timestamp</th>
                <th style={{ padding: '0.6rem 0.75rem' }}>Note</th>
                <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Show reverse chronological in table (newest at top) */}
              {[...filtered].reverse().map((r, revIdx) => {
                const originalIndex = results.indexOf(r) + 1;
                const isGreen = r.color === 'green' || r.number === 0;
                const isRed = r.color === 'red';
                const isOdd = r.parity === 'odd';
                const formattedDate = new Date(r.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });

                return (
                  <tr
                    key={`hist-row-${r.id ?? revIdx}-${r.timestamp}`}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)' }}>
                      #{originalIndex}
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', fontWeight: 800, fontSize: '1.05rem', color: isGreen ? '#34d399' : '#fff' }} className="font-mono">
                      {r.number}
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      <span className={`badge ${isGreen ? 'badge-green' : isRed ? 'badge-red' : 'badge-black'}`}>
                        {r.color.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      <span className={`badge ${isGreen ? 'badge-zero' : isOdd ? 'badge-odd' : 'badge-even'}`}>
                        {r.parity === 'none' ? 'ZERO' : r.parity.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-secondary)' }}>
                      {r.joint}
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      {formattedDate}
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-secondary)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.note || '—'}
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          onClick={() => onEditResult(r)}
                          className="btn-secondary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                          title="Edit / correct this outcome"
                        >
                          <Edit3 size={12} />
                          <span>Edit</span>
                        </button>
                        {r.id !== undefined && (
                          <button
                            onClick={() => onDeleteResult(r.id!)}
                            className="btn-danger"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                            title="Delete this outcome"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
