import React from 'react';
import {
  BarChart3,
  ShieldAlert,
  Percent,
  GitBranch,
} from 'lucide-react';
import { getTheoreticalDistribution } from '../math/probability';
import type { RollingStats, RouletteResult } from '../types/roulette';

interface StatisticalAssessmentProps {
  results: RouletteResult[];
  latestRollingStats: RollingStats | null;
  minWindow: 5 | 6;
}

export const StatisticalAssessment: React.FC<StatisticalAssessmentProps> = ({
  results,
  latestRollingStats,
  minWindow,
}) => {
  const theo = getTheoreticalDistribution();
  const total = results.length;
  const isUnlocked = total >= minWindow;

  if (!isUnlocked) {
    return (
      <section className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
        <ShieldAlert size={36} color="#f59e0b" style={{ margin: '0 auto 0.75rem auto' }} />
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fde68a', marginBottom: '0.4rem' }}>
          Statistical Assessment Locked
        </h3>
        <p style={{ maxWidth: 640, margin: '0 auto', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Please enter at least <strong>{minWindow}</strong> results to unlock the formal statistical assessment. Preliminary counts are insufficient to evaluate rolling windows or empirical variance without misleading noise.
        </p>
      </section>
    );
  }

  const latestWindow = latestRollingStats || {
    label: `Latest ${minWindow}`,
    windowSize: minWindow,
    actualCount: minWindow,
    isSufficient: true,
    redCount: 0,
    blackCount: 0,
    redFreq: 0,
    blackFreq: 0,
    oddCount: 0,
    evenCount: 0,
    oddFreq: 0,
    evenFreq: 0,
    jointCounts: { 'red-odd': 0, 'red-even': 0, 'black-odd': 0, 'black-even': 0 },
    jointFreqs: { 'red-odd': 0, 'red-even': 0, 'black-odd': 0, 'black-even': 0 },
  };

  return (
    <section className="glass-panel" style={{ padding: '1.5rem' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        marginBottom: '1.25rem',
      }}>
        <div>
          <h2 className="panel-title">
            <BarChart3 size={20} color="#6366f1" />
            <span>Statistical Assessment & Category Projections</span>
          </h2>
          <p className="panel-subtitle">
            Rigorous comparison of observed empirical frequencies against deterministic theoretical probabilities.
          </p>
        </div>

        <div style={{
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '0.35rem 0.75rem',
          fontSize: '0.75rem',
          color: '#c7d2fe',
        }}>
          Sample: {total} total | Window: {latestWindow.actualCount}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.25rem',
        marginBottom: '1.5rem',
      }}>
        {/* Color Distribution Card */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-md)',
          padding: '1.1rem',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.85rem',
          }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
              Color Distribution ({latestWindow.label})
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Theo: 50.0% / 50.0%
            </span>
          </div>

          {/* Red Progress */}
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
              <span style={{ color: '#fda4af', fontWeight: 600 }}>Red ({latestWindow.redCount})</span>
              <span className="font-mono" style={{ color: '#fda4af' }}>
                {(latestWindow.redFreq * 100).toFixed(1)}% (P_theo = 50.0%)
              </span>
            </div>
            <div style={{ height: 8, background: 'rgba(30, 41, 59, 0.8)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${latestWindow.redFreq * 100}%`,
                background: 'linear-gradient(90deg, #e11d48, #f43f5e)',
                borderRadius: 4,
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>

          {/* Black Progress */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
              <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Black ({latestWindow.blackCount})</span>
              <span className="font-mono" style={{ color: '#cbd5e1' }}>
                {(latestWindow.blackFreq * 100).toFixed(1)}% (P_theo = 50.0%)
              </span>
            </div>
            <div style={{ height: 8, background: 'rgba(30, 41, 59, 0.8)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${latestWindow.blackFreq * 100}%`,
                background: 'linear-gradient(90deg, #334155, #64748b)',
                borderRadius: 4,
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        </div>

        {/* Parity Distribution Card */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-md)',
          padding: '1.1rem',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.85rem',
          }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
              Parity Distribution ({latestWindow.label})
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Theo: 50.0% / 50.0%
            </span>
          </div>

          {/* Odd Progress */}
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
              <span style={{ color: '#a5b4fc', fontWeight: 600 }}>Odd ({latestWindow.oddCount})</span>
              <span className="font-mono" style={{ color: '#a5b4fc' }}>
                {(latestWindow.oddFreq * 100).toFixed(1)}% (P_theo = 50.0%)
              </span>
            </div>
            <div style={{ height: 8, background: 'rgba(30, 41, 59, 0.8)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${latestWindow.oddFreq * 100}%`,
                background: 'linear-gradient(90deg, #4f46e5, #6366f1)',
                borderRadius: 4,
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>

          {/* Even Progress */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
              <span style={{ color: '#67e8f9', fontWeight: 600 }}>Even ({latestWindow.evenCount})</span>
              <span className="font-mono" style={{ color: '#67e8f9' }}>
                {(latestWindow.evenFreq * 100).toFixed(1)}% (P_theo = 50.0%)
              </span>
            </div>
            <div style={{ height: 8, background: 'rgba(30, 41, 59, 0.8)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${latestWindow.evenFreq * 100}%`,
                background: 'linear-gradient(90deg, #0891b2, #06b6d4)',
                borderRadius: 4,
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Joint Categories Table: Proving Color & Parity Non-Independence */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.5)',
        border: '1px solid var(--border-card)',
        borderRadius: 'var(--radius-md)',
        padding: '1.25rem',
        marginBottom: '1.25rem',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginBottom: '0.85rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <GitBranch size={17} color="#06b6d4" />
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
              Joint Category Enumeration & Non-Independence
            </span>
          </div>
          <span style={{
            fontSize: '0.75rem',
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#fca5a5',
            padding: '0.2rem 0.5rem',
            borderRadius: 4,
            fontWeight: 600,
          }}>
            Dependent Distribution
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '0.5rem' }}>Joint Category</th>
                <th style={{ padding: '0.5rem' }}>Count (36 Wheel)</th>
                <th style={{ padding: '0.5rem' }}>Theoretical P(E)</th>
                <th style={{ padding: '0.5rem' }}>Window Observed</th>
                <th style={{ padding: '0.5rem' }}>Session Total</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '0.5rem', fontWeight: 600, color: '#fda4af' }}>Red & Odd</td>
                <td style={{ padding: '0.5rem' }} className="font-mono">{theo.jointCounts['red-odd']} / 36</td>
                <td style={{ padding: '0.5rem' }} className="font-mono">{(theo.pJoint['red-odd'] * 100).toFixed(2)}%</td>
                <td style={{ padding: '0.5rem' }} className="font-mono">{latestWindow.jointCounts['red-odd']} ({((latestWindow.jointFreqs['red-odd'] || 0) * 100).toFixed(1)}%)</td>
                <td style={{ padding: '0.5rem' }} className="font-mono">{results.filter(r => r.joint === 'red-odd').length}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '0.5rem', fontWeight: 600, color: '#fda4af' }}>Red & Even</td>
                <td style={{ padding: '0.5rem' }} className="font-mono">{theo.jointCounts['red-even']} / 36</td>
                <td style={{ padding: '0.5rem' }} className="font-mono">{(theo.pJoint['red-even'] * 100).toFixed(2)}%</td>
                <td style={{ padding: '0.5rem' }} className="font-mono">{latestWindow.jointCounts['red-even']} ({((latestWindow.jointFreqs['red-even'] || 0) * 100).toFixed(1)}%)</td>
                <td style={{ padding: '0.5rem' }} className="font-mono">{results.filter(r => r.joint === 'red-even').length}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '0.5rem', fontWeight: 600, color: '#cbd5e1' }}>Black & Odd</td>
                <td style={{ padding: '0.5rem' }} className="font-mono">{theo.jointCounts['black-odd']} / 36</td>
                <td style={{ padding: '0.5rem' }} className="font-mono">{(theo.pJoint['black-odd'] * 100).toFixed(2)}%</td>
                <td style={{ padding: '0.5rem' }} className="font-mono">{latestWindow.jointCounts['black-odd']} ({((latestWindow.jointFreqs['black-odd'] || 0) * 100).toFixed(1)}%)</td>
                <td style={{ padding: '0.5rem' }} className="font-mono">{results.filter(r => r.joint === 'black-odd').length}</td>
              </tr>
              <tr>
                <td style={{ padding: '0.5rem', fontWeight: 600, color: '#cbd5e1' }}>Black & Even</td>
                <td style={{ padding: '0.5rem' }} className="font-mono">{theo.jointCounts['black-even']} / 36</td>
                <td style={{ padding: '0.5rem' }} className="font-mono">{(theo.pJoint['black-even'] * 100).toFixed(2)}%</td>
                <td style={{ padding: '0.5rem' }} className="font-mono">{latestWindow.jointCounts['black-even']} ({((latestWindow.jointFreqs['black-even'] || 0) * 100).toFixed(1)}%)</td>
                <td style={{ padding: '0.5rem' }} className="font-mono">{results.filter(r => r.joint === 'black-even').length}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{
          marginTop: '0.75rem',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          lineHeight: 1.4,
        }}>
          * Notice: In this custom 1–36 mapping, Red-Odd contains 10 numbers (27.78%) while Red-Even contains 8 numbers (22.22%).
          Because P(Red ∩ Odd) ≠ P(Red) × P(Odd) = 25.00%, Color and Parity are mathematically <strong>dependent</strong>.
        </div>
      </div>

      {/* Critical Scientific Disclaimer */}
      <div style={{
        background: 'rgba(99, 102, 241, 0.08)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        borderRadius: 'var(--radius-md)',
        padding: '0.9rem 1.1rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.65rem',
      }}>
        <Percent size={18} color="#818cf8" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: '0.8rem', color: '#c7d2fe', lineHeight: 1.45 }}>
          <strong>Probability Axiom & Gambler's Fallacy Warning:</strong> The roulette wheel has no physical memory. Under standard independent trial mechanics, historical observations do not alter the physical probability of the next spin (P(Red) = 18/36 = 50.0%). Observed frequencies describe sample history, not a guaranteed prediction or physical debt owed by the wheel.
        </div>
      </div>
    </section>
  );
};
