import React from 'react';
import { Network, HelpCircle } from 'lucide-react';
import type { BayesianEstimate } from '../types/roulette';

interface BayesianPanelProps {
  redBayes: BayesianEstimate;
  oddBayes: BayesianEstimate;
}

export const BayesianPanel: React.FC<BayesianPanelProps> = ({
  redBayes,
  oddBayes,
}) => {
  const renderBayesCard = (est: BayesianEstimate, title: string, colorHex: string) => {
    const [lowerCI, upperCI] = est.credibleInterval95;
    const meanPercent = (est.posteriorMean * 100).toFixed(1);
    const lowerPercent = (lowerCI * 100).toFixed(1);
    const upperPercent = (upperCI * 100).toFixed(1);

    return (
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
          marginBottom: '0.75rem',
        }}>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
            {title} Rate Estimate
          </span>
          <span style={{
            fontSize: '0.7rem',
            background: 'rgba(99, 102, 241, 0.15)',
            color: '#a5b4fc',
            padding: '0.15rem 0.5rem',
            borderRadius: 4,
            fontWeight: 600,
          }}>
            Prior: Beta({est.priorAlpha}, {est.priorBeta})
          </span>
        </div>

        {/* Math Breakdown */}
        <div style={{
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          marginBottom: '0.75rem',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.4rem',
        }}>
          <div>Observed Successes: <strong style={{ color: '#fff' }}>{est.successes}</strong></div>
          <div>Observed Failures: <strong style={{ color: '#fff' }}>{est.failures}</strong></div>
          <div>Posterior α: <strong style={{ color: '#fff' }}>{est.posteriorAlpha.toFixed(1)}</strong></div>
          <div>Posterior β: <strong style={{ color: '#fff' }}>{est.posteriorBeta.toFixed(1)}</strong></div>
        </div>

        {/* Posterior Mean Display */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.5)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.65rem 0.85rem',
          marginBottom: '0.85rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Posterior Mean E[p | D]:</span>
            <span className="font-mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: colorHex }}>
              {meanPercent}%
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>95% Credible Interval:</span>
            <span className="font-mono" style={{ color: '#e2e8f0', fontWeight: 600 }}>
              [{lowerPercent}%, {upperPercent}%]
            </span>
          </div>
        </div>

        {/* Visual CI Scale */}
        <div style={{ position: 'relative', height: 16, background: '#1e293b', borderRadius: 8, overflow: 'hidden' }}>
          {/* Theoretical 50% line */}
          <div style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            bottom: 0,
            width: 2,
            background: 'rgba(255, 255, 255, 0.4)',
            zIndex: 2,
          }} title="Theoretical 50%" />

          {/* Credible Interval Span */}
          <div style={{
            position: 'absolute',
            left: `${lowerCI * 100}%`,
            width: `${Math.max(2, (upperCI - lowerCI) * 100)}%`,
            top: 3,
            bottom: 3,
            background: colorHex,
            opacity: 0.35,
            borderRadius: 4,
          }} />

          {/* Posterior Mean Point */}
          <div style={{
            position: 'absolute',
            left: `calc(${est.posteriorMean * 100}% - 4px)`,
            top: 2,
            width: 8,
            height: 12,
            background: colorHex,
            borderRadius: 2,
            zIndex: 3,
            boxShadow: `0 0 6px ${colorHex}`,
          }} />
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.65rem',
          color: 'var(--text-muted)',
          marginTop: '0.25rem',
        }}>
          <span>0%</span>
          <span>50% (Theoretical)</span>
          <span>100%</span>
        </div>
      </div>
    );
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
            <Network size={18} color="#818cf8" />
            <span>Bayesian Uncertainty Estimation</span>
          </h2>
          <p className="panel-subtitle">
            Beta-Binomial conjugate posterior modeling quantifying epistemic uncertainty about the underlying parameter.
          </p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1rem',
        marginBottom: '1rem',
      }}>
        {renderBayesCard(redBayes, 'Color (Red)', '#fb7185')}
        {renderBayesCard(oddBayes, 'Parity (Odd)', '#818cf8')}
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
          <strong>Epistemic Uncertainty vs. Future Outcome:</strong> The Bayesian credible interval describes our state of knowledge regarding the true rate parameter under the chosen prior. It does <em>not</em> guarantee that the next physical spin will land in any particular subset.
        </span>
      </div>
    </section>
  );
};
