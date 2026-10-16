import React from 'react';
import { Activity, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';
import type { GoodnessOfFitResult, RunsTestResult } from '../types/roulette';

interface RandomnessPanelProps {
  chiColor: GoodnessOfFitResult;
  runsColor: RunsTestResult;
  runsParity: RunsTestResult;
  totalResults: number;
}

export const RandomnessPanel: React.FC<RandomnessPanelProps> = ({
  chiColor,
  runsColor,
  runsParity,
  totalResults,
}) => {
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
            <Activity size={18} color="#10b981" />
            <span>Randomness & Goodness-of-Fit Testing</span>
          </h2>
          <p className="panel-subtitle">
            Formal statistical hypothesis tests evaluating categorical deviations and sequential independence.
          </p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1rem',
        marginBottom: '1rem',
      }}>
        {/* Chi-Square Test Card */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.65rem',
          }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>
              Pearson's χ² Goodness-of-Fit (Color)
            </span>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '0.15rem 0.5rem',
              borderRadius: 4,
              background: chiColor.assumptionsMet ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: chiColor.assumptionsMet ? '#6ee7b7' : '#fde68a',
            }}>
              {chiColor.assumptionsMet ? 'Assumptions Met' : 'Approximation Fragile'}
            </span>
          </div>

          <div style={{
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.4rem',
            marginBottom: '0.65rem',
          }}>
            <div>χ² Statistic: <strong className="font-mono" style={{ color: '#fff' }}>{chiColor.chiSquareStat.toFixed(4)}</strong></div>
            <div>Deg. of Freedom: <strong className="font-mono" style={{ color: '#fff' }}>{chiColor.degreesOfFreedom}</strong></div>
            <div>p-value: <strong className="font-mono" style={{ color: chiColor.pValue < 0.05 ? '#fb7185' : '#6ee7b7' }}>{chiColor.pValue.toFixed(4)}</strong></div>
            <div>Null Hypothesis H₀: <strong style={{ color: '#fff' }}>Fair 1:1</strong></div>
          </div>

          {chiColor.warning ? (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.4rem',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.5rem',
              fontSize: '0.7rem',
              color: '#fde68a',
            }}>
              <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{chiColor.warning}</span>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.75rem',
              color: '#6ee7b7',
            }}>
              <CheckCircle size={14} />
              <span>Sample size is adequate for asymptotic Pearson's chi-square test.</span>
            </div>
          )}
        </div>

        {/* Wald-Wolfowitz Runs Test Card */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.65rem',
          }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>
              Wald-Wolfowitz Runs Test (N = {totalResults})
            </span>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '0.15rem 0.5rem',
              borderRadius: 4,
              background: 'rgba(99, 102, 241, 0.15)',
              color: '#a5b4fc',
            }}>
              2-Tailed Normal Z
            </span>
          </div>

          <div style={{
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.4rem',
            marginBottom: '0.65rem',
          }}>
            <div>Runs (Color): <strong className="font-mono" style={{ color: '#fff' }}>{runsColor.observedRuns}</strong> (Z: {runsColor.zScore.toFixed(2)})</div>
            <div>Runs (Parity): <strong className="font-mono" style={{ color: '#fff' }}>{runsParity.observedRuns}</strong> (Z: {runsParity.zScore.toFixed(2)})</div>
            <div>Color p-value: <strong className="font-mono" style={{ color: '#fff' }}>{runsColor.pValue.toFixed(4)}</strong></div>
            <div>Parity p-value: <strong className="font-mono" style={{ color: '#fff' }}>{runsParity.pValue.toFixed(4)}</strong></div>
          </div>

          {(runsColor.warning || runsParity.warning) && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.4rem',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.5rem',
              fontSize: '0.7rem',
              color: '#fde68a',
            }}>
              <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{runsColor.warning || runsParity.warning}</span>
            </div>
          )}
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.5rem',
        background: 'rgba(30, 41, 59, 0.4)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-sm)',
        padding: '0.75rem',
        fontSize: '0.75rem',
        color: 'var(--text-secondary)',
        lineHeight: 1.4,
      }}>
        <HelpCircle size={15} color="#94a3b8" style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          <strong>Methodological Clarification:</strong> Hypothesis tests test compatibility with random generation. A high p-value (p &gt; 0.05) indicates that observed fluctuations are consistent with chance. No statistical test can ever prove that a random process has become predictable.
        </span>
      </div>
    </section>
  );
};
