import React, { useState } from 'react';
import {
  History,
  Download,
  Upload,
  PlusCircle,
  Trash2,
  Search,
  CheckCircle,
  Cpu,
} from 'lucide-react';
import type { MinesRoundRecord, MinesSourceType } from '../types/mines';

interface MinesHistoryProps {
  rounds: MinesRoundRecord[];
  onDeleteRound: (id: number) => void;
  onClearHistory: () => void;
  onOpenManualEntry: () => void;
  onExportJSON: () => void;
  onExportCSV: () => void;
  onOpenImport: () => void;
}

export const MinesHistory: React.FC<MinesHistoryProps> = ({
  rounds,
  onDeleteRound,
  onClearHistory,
  onOpenManualEntry,
  onExportJSON,
  onExportCSV,
  onOpenImport,
}) => {
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredRounds = rounds.filter((r) => {
    if (sourceFilter !== 'all' && r.sourceType !== sourceFilter) return false;
    if (outcomeFilter !== 'all' && r.outcome !== outcomeFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const matchId = r.roundId.toLowerCase().includes(q);
      const matchNotes = r.notes?.toLowerCase().includes(q) ?? false;
      const matchHash = r.provablyFair?.serverSeedHash?.toLowerCase().includes(q) ?? false;
      if (!matchId && !matchNotes && !matchHash) return false;
    }
    return true;
  });

  const getSourceBadge = (source: MinesSourceType) => {
    switch (source) {
      case 'verified':
        return (
          <span
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '4px',
              padding: '0.1rem 0.4rem',
              fontSize: '0.68rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.2rem',
            }}
          >
            <CheckCircle size={10} /> Verified
          </span>
        );
      case 'manual':
        return (
          <span
            style={{
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#fbbf24',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '4px',
              padding: '0.1rem 0.4rem',
              fontSize: '0.68rem',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            Manual
          </span>
        );
      case 'simulated':
        return (
          <span
            style={{
              background: 'rgba(99, 102, 241, 0.15)',
              color: '#a5b4fc',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '4px',
              padding: '0.1rem 0.4rem',
              fontSize: '0.68rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.2rem',
            }}
          >
            <Cpu size={10} /> Simulated
          </span>
        );
    }
  };

  return (
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.75)',
        border: '1px solid var(--border-card)',
        borderRadius: 'var(--radius-lg)',
        padding: '1rem 1.25rem',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        width: '100%',
      }}
    >
      {/* Header and Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <History size={18} color="#818cf8" />
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
            Round History
          </h2>
          <span
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              padding: '0.1rem 0.5rem',
              borderRadius: '12px',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {rounds.length} rounds
          </span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onOpenManualEntry}
            className="btn-secondary"
            title="Record real round outcome manually"
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
          >
            <PlusCircle size={13} color="#34d399" />
            <span>Record Round</span>
          </button>

          <button
            type="button"
            onClick={onOpenImport}
            className="btn-secondary"
            title="Import rounds from JSON or CSV"
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
          >
            <Upload size={13} />
            <span>Import</span>
          </button>

          <button
            type="button"
            onClick={onExportJSON}
            className="btn-secondary"
            title="Export rounds as JSON"
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
          >
            <Download size={13} />
            <span>JSON</span>
          </button>

          <button
            type="button"
            onClick={onExportCSV}
            className="btn-secondary"
            title="Export rounds as CSV"
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
          >
            <Download size={13} />
            <span>CSV</span>
          </button>

          {rounds.length > 0 && (
            <button
              type="button"
              onClick={onClearHistory}
              className="btn-danger"
              title="Clear all stored rounds"
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
            >
              <Trash2 size={13} />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          flexWrap: 'wrap',
          background: 'rgba(30, 41, 59, 0.4)',
          padding: '0.5rem 0.75rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 140 }}>
          <Search
            size={13}
            style={{
              position: 'absolute',
              left: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            placeholder="Search ID, notes, seeds..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.3rem 0.5rem 0.3rem 1.65rem',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--border-card)',
              borderRadius: 'var(--radius-sm)',
              color: '#fff',
              fontSize: '0.78rem',
            }}
          />
        </div>

        {/* Source Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Source:</span>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            style={{
              padding: '0.3rem 0.5rem',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--border-card)',
              borderRadius: 'var(--radius-sm)',
              color: '#fff',
              fontSize: '0.78rem',
            }}
          >
            <option value="all">All Sources</option>
            <option value="verified">Verified (Provably Fair)</option>
            <option value="manual">Manual Entry</option>
            <option value="simulated">Simulated Only</option>
          </select>
        </div>

        {/* Outcome Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Outcome:</span>
          <select
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value)}
            style={{
              padding: '0.3rem 0.5rem',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--border-card)',
              borderRadius: 'var(--radius-sm)',
              color: '#fff',
              fontSize: '0.78rem',
            }}
          >
            <option value="all">All Outcomes</option>
            <option value="win">Win / Cashout</option>
            <option value="loss">Hit Bomb (Loss)</option>
          </select>
        </div>
      </div>

      {/* Rounds Table */}
      {filteredRounds.length === 0 ? (
        <div
          style={{
            padding: '2rem 1rem',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
            background: 'rgba(30, 41, 59, 0.2)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-subtle)',
          }}
        >
          {rounds.length === 0
            ? 'No rounds recorded yet. Play a paper-trading simulation or record manual observations.'
            : 'No rounds match the selected filters.'}
        </div>
      ) : (
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.8rem',
              textAlign: 'left',
            }}
          >
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.5rem 0.6rem' }}>Round / Time</th>
                <th style={{ padding: '0.5rem 0.6rem' }}>Source</th>
                <th style={{ padding: '0.5rem 0.6rem' }}>Bombs</th>
                <th style={{ padding: '0.5rem 0.6rem' }}>Picks</th>
                <th style={{ padding: '0.5rem 0.6rem' }}>Multiplier</th>
                <th style={{ padding: '0.5rem 0.6rem' }}>Stake</th>
                <th style={{ padding: '0.5rem 0.6rem' }}>Net P/L</th>
                <th style={{ padding: '0.5rem 0.6rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRounds.slice(0, 30).map((r) => {
                const isLoss = r.outcome === 'loss';
                const timeStr = new Date(r.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });

                return (
                  <tr
                    key={r.roundId || r.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '0.5rem 0.6rem' }}>
                      <div style={{ fontWeight: 600, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                        {r.roundId.length > 14 ? `${r.roundId.slice(0, 14)}...` : r.roundId}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{timeStr}</div>
                    </td>

                    <td style={{ padding: '0.5rem 0.6rem' }}>{getSourceBadge(r.sourceType)}</td>

                    <td style={{ padding: '0.5rem 0.6rem', fontFamily: 'var(--font-mono)' }}>
                      {r.bombCount} bombs
                    </td>

                    <td style={{ padding: '0.5rem 0.6rem', fontFamily: 'var(--font-mono)' }}>
                      {r.picksCount} tiles
                    </td>

                    <td
                      style={{
                        padding: '0.5rem 0.6rem',
                        fontWeight: 700,
                        color: isLoss ? '#fb7185' : '#34d399',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {isLoss ? '0.00x' : `${r.multiplierReached.toFixed(2)}x`}
                    </td>

                    <td style={{ padding: '0.5rem 0.6rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      ${r.stake.toFixed(2)}
                    </td>

                    <td
                      style={{
                        padding: '0.5rem 0.6rem',
                        fontWeight: 700,
                        color: r.netProfit >= 0 ? '#34d399' : '#fb7185',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {r.netProfit >= 0 ? '+' : ''}${r.netProfit.toFixed(2)}
                    </td>

                    <td style={{ padding: '0.5rem 0.6rem', textAlign: 'right' }}>
                      {r.id !== undefined && (
                        <button
                          type="button"
                          onClick={() => onDeleteRound(r.id!)}
                          title="Delete this round"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '0.2rem',
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredRounds.length > 30 && (
            <div style={{ textAlign: 'center', padding: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              Showing latest 30 of {filteredRounds.length} rounds. Use export for complete records.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
