import React from 'react';
import { Flame } from 'lucide-react';
import type { RouletteResult } from '../types/roulette';

interface SimpleSummaryBarProps {
  results: RouletteResult[];
}

export const SimpleSummaryBar: React.FC<SimpleSummaryBarProps> = ({ results }) => {
  const total = results.length;
  if (total === 0) return null;

  let redCount = 0;
  let oddCount = 0;
  for (const r of results) {
    if (r.color === 'red') redCount++;
    if (r.parity === 'odd') oddCount++;
  }
  const blackCount = total - redCount;
  const evenCount = total - oddCount;

  const redPct = Math.round((redCount / total) * 100);
  const blackPct = 100 - redPct;
  const oddPct = Math.round((oddCount / total) * 100);
  const evenPct = 100 - oddPct;

  // Last 5
  const last5 = results.slice(-5);
  let l5Red = 0;
  let l5Odd = 0;
  for (const r of last5) {
    if (r.color === 'red') l5Red++;
    if (r.parity === 'odd') l5Odd++;
  }
  const l5Black = last5.length - l5Red;
  const l5Even = last5.length - l5Odd;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '0.85rem',
    }}>
      {/* Color Balance Card */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid var(--border-card)',
        borderRadius: 'var(--radius-md)',
        padding: '0.85rem 1rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Color Record ({total} spins)
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target: 50/50</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
          <span style={{ color: '#fda4af' }}>Red: {redCount} ({redPct}%)</span>
          <span style={{ color: '#cbd5e1' }}>Black: {blackCount} ({blackPct}%)</span>
        </div>

        <div style={{ height: 6, display: 'flex', borderRadius: 3, overflow: 'hidden', background: '#1e293b' }}>
          <div style={{ width: `${redPct}%`, background: '#e11d48' }} />
          <div style={{ width: `${blackPct}%`, background: '#334155' }} />
        </div>
      </div>

      {/* Parity Balance Card */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid var(--border-card)',
        borderRadius: 'var(--radius-md)',
        padding: '0.85rem 1rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Parity Record ({total} spins)
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target: 50/50</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
          <span style={{ color: '#a5b4fc' }}>Odd: {oddCount} ({oddPct}%)</span>
          <span style={{ color: '#67e8f9' }}>Even: {evenCount} ({evenPct}%)</span>
        </div>

        <div style={{ height: 6, display: 'flex', borderRadius: 3, overflow: 'hidden', background: '#1e293b' }}>
          <div style={{ width: `${oddPct}%`, background: '#6366f1' }} />
          <div style={{ width: `${evenPct}%`, background: '#06b6d4' }} />
        </div>
      </div>

      {/* Last 5 Momentum Card */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid var(--border-card)',
        borderRadius: 'var(--radius-md)',
        padding: '0.85rem 1rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Flame size={13} color="#f59e0b" />
            <span>Recent 5 Momentum</span>
          </span>
          <span style={{ fontSize: '0.75rem', color: '#6ee7b7' }}>Active</span>
        </div>

        <div style={{ fontSize: '0.85rem', color: '#fff', lineHeight: 1.4, marginTop: '0.2rem' }}>
          <div>Colors: <strong style={{ color: '#fda4af' }}>{l5Red} Red</strong>, <strong style={{ color: '#cbd5e1' }}>{l5Black} Black</strong></div>
          <div>Parity: <strong style={{ color: '#a5b4fc' }}>{l5Odd} Odd</strong>, <strong style={{ color: '#67e8f9' }}>{l5Even} Even</strong></div>
        </div>
      </div>
    </div>
  );
};
