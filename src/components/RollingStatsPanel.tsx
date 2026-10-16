import React from 'react';
import { Layers, AlertCircle } from 'lucide-react';
import type { RollingStats } from '../types/roulette';

interface RollingStatsPanelProps {
  windows: RollingStats[];
}

export const RollingStatsPanel: React.FC<RollingStatsPanelProps> = ({ windows }) => {
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
            <Layers size={18} color="#06b6d4" />
            <span>Rolling Observation Windows</span>
          </h2>
          <p className="panel-subtitle">
            Temporal slices comparing short-term momentum against medium and full-session aggregates.
          </p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '0.85rem',
      }}>
        {windows.map((w, idx) => {
          return (
            <div
              key={`rolling-win-${w.label}-${idx}`}
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-card)',
                borderRadius: 'var(--radius-md)',
                padding: '0.9rem',
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.65rem',
              }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>
                  {w.label}
                </span>
                <span style={{
                  fontSize: '0.7rem',
                  padding: '0.15rem 0.45rem',
                  borderRadius: 4,
                  fontWeight: 600,
                  background: w.isSufficient ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: w.isSufficient ? '#6ee7b7' : '#fde68a',
                }}>
                  {w.actualCount} / {w.windowSize === w.actualCount ? w.actualCount : w.windowSize} obs
                </span>
              </div>

              {!w.isSufficient && w.actualCount < w.windowSize && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.7rem',
                  color: '#fcd34d',
                  marginBottom: '0.5rem',
                }}>
                  <AlertCircle size={12} />
                  <span>Partial sample (window requires {w.windowSize})</span>
                </div>
              )}

              {/* Red vs Black */}
              <div style={{ marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                  <span style={{ color: '#fda4af' }}>Red: {w.redCount} ({(w.redFreq * 100).toFixed(0)}%)</span>
                  <span style={{ color: '#cbd5e1' }}>Black: {w.blackCount} ({(w.blackFreq * 100).toFixed(0)}%)</span>
                </div>
                <div style={{ height: 6, display: 'flex', borderRadius: 3, overflow: 'hidden', background: '#1e293b' }}>
                  <div style={{ width: `${w.redFreq * 100}%`, background: '#e11d48' }} />
                  <div style={{ width: `${w.blackFreq * 100}%`, background: '#334155' }} />
                </div>
              </div>

              {/* Odd vs Even */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                  <span style={{ color: '#a5b4fc' }}>Odd: {w.oddCount} ({(w.oddFreq * 100).toFixed(0)}%)</span>
                  <span style={{ color: '#67e8f9' }}>Even: {w.evenCount} ({(w.evenFreq * 100).toFixed(0)}%)</span>
                </div>
                <div style={{ height: 6, display: 'flex', borderRadius: 3, overflow: 'hidden', background: '#1e293b' }}>
                  <div style={{ width: `${w.oddFreq * 100}%`, background: '#6366f1' }} />
                  <div style={{ width: `${w.evenFreq * 100}%`, background: '#06b6d4' }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
