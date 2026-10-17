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
  let blackCount = 0;
  let greenCount = 0;
  let oddCount = 0;
  let evenCount = 0;
  let zeroCount = 0;
  let lowCount = 0;
  let highCount = 0;

  for (const r of results) {
    if (r.color === 'red') redCount++;
    else if (r.color === 'black') blackCount++;
    else if (r.color === 'green' || r.number === 0) greenCount++;

    if (r.parity === 'odd') oddCount++;
    else if (r.parity === 'even') evenCount++;
    else if (r.parity === 'none' || r.number === 0) zeroCount++;

    if (r.number >= 1 && r.number <= 18) lowCount++;
    else if (r.number >= 19 && r.number <= 36) highCount++;
  }

  const redPct = Math.round((redCount / total) * 100);
  const blackPct = Math.round((blackCount / total) * 100);
  const greenPct = Math.round((greenCount / total) * 100);
  const oddPct = Math.round((oddCount / total) * 100);
  const evenPct = Math.round((evenCount / total) * 100);
  const lowPct = Math.round((lowCount / total) * 100);
  const highPct = Math.round((highCount / total) * 100);

  // Last 5
  const last5 = results.slice(-5);
  let l5Red = 0;
  let l5Black = 0;
  let l5Green = 0;
  let l5Odd = 0;
  let l5Even = 0;
  for (const r of last5) {
    if (r.color === 'red') l5Red++;
    else if (r.color === 'black') l5Black++;
    else if (r.color === 'green' || r.number === 0) l5Green++;

    if (r.parity === 'odd') l5Odd++;
    else if (r.parity === 'even') l5Even++;
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
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
          <span style={{ fontSize: '0.75rem', color: greenCount > 0 ? '#34d399' : 'var(--text-muted)' }}>
            🟢 0: {greenCount} ({greenPct}%)
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
          <span style={{ color: '#fda4af' }}>Red: {redCount} ({redPct}%)</span>
          <span style={{ color: '#cbd5e1' }}>Black: {blackCount} ({blackPct}%)</span>
        </div>

        <div style={{ height: 6, display: 'flex', borderRadius: 3, overflow: 'hidden', background: '#1e293b' }}>
          <div style={{ width: `${redPct}%`, background: '#e11d48' }} />
          <div style={{ width: `${greenPct}%`, background: '#10b981' }} />
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
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Zero: {zeroCount}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
          <span style={{ color: '#a5b4fc' }}>Odd: {oddCount} ({oddPct}%)</span>
          <span style={{ color: '#67e8f9' }}>Even: {evenCount} ({evenPct}%)</span>
        </div>

        <div style={{ height: 6, display: 'flex', borderRadius: 3, overflow: 'hidden', background: '#1e293b' }}>
          <div style={{ width: `${oddPct}%`, background: '#6366f1' }} />
          <div style={{ width: `${greenPct}%`, background: '#10b981' }} />
          <div style={{ width: `${evenPct}%`, background: '#06b6d4' }} />
        </div>
      </div>

      {/* Halves 1-18 vs 19-36 Card */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid var(--border-card)',
        borderRadius: 'var(--radius-md)',
        padding: '0.85rem 1rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Halves: 1–18 vs 19–36
          </span>
          <span style={{ fontSize: '0.75rem', color: '#a7f3d0' }}>0 excluded</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>
          <span style={{ color: '#f59e0b' }}>1–18: {lowCount} ({lowPct}%)</span>
          <span style={{ color: '#38bdf8' }}>19–36: {highCount} ({highPct}%)</span>
        </div>

        <div style={{ height: 6, display: 'flex', borderRadius: 3, overflow: 'hidden', background: '#1e293b' }}>
          <div style={{ width: `${lowPct}%`, background: '#f59e0b' }} />
          <div style={{ width: `${greenPct}%`, background: '#10b981' }} />
          <div style={{ width: `${highPct}%`, background: '#38bdf8' }} />
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
          <span style={{ fontSize: '0.75rem', color: l5Green > 0 ? '#34d399' : '#6ee7b7' }}>
            {l5Green > 0 ? '🟢 0 Hit!' : 'Active'}
          </span>
        </div>

        <div style={{ fontSize: '0.85rem', color: '#fff', lineHeight: 1.4, marginTop: '0.2rem' }}>
          <div>Colors: <strong style={{ color: '#fda4af' }}>{l5Red} Red</strong>, <strong style={{ color: '#cbd5e1' }}>{l5Black} Black</strong>{l5Green > 0 && <span style={{ color: '#34d399' }}>, {l5Green} Zero</span>}</div>
          <div>Parity: <strong style={{ color: '#a5b4fc' }}>{l5Odd} Odd</strong>, <strong style={{ color: '#67e8f9' }}>{l5Even} Even</strong></div>
        </div>
      </div>
    </div>
  );
};
