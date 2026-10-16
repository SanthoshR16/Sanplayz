import React from 'react';
import { Target, AlertTriangle, HelpCircle } from 'lucide-react';
import type { AdaptiveEvaluation, PredictionRecord } from '../types/roulette';

interface AdaptiveEvaluationPanelProps {
  evaluation: AdaptiveEvaluation;
  predictions: PredictionRecord[];
}

export const AdaptiveEvaluationPanel: React.FC<AdaptiveEvaluationPanelProps> = ({
  evaluation,
  predictions,
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
            <Target size={18} color="#6366f1" />
            <span>Adaptive Model & Out-of-Sample Performance Evaluation</span>
          </h2>
          <p className="panel-subtitle">
            Strictly out-of-sample audit: evaluates pre-result predictions logged before each spin occurred. Zero future-data leakage.
          </p>
        </div>

        <div style={{
          background: 'rgba(99, 102, 241, 0.12)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.3rem 0.65rem',
          fontSize: '0.75rem',
          color: '#c7d2fe',
          fontWeight: 600,
        }}>
          Logged: {predictions.length} | Evaluated: {evaluation.totalEvaluated}
        </div>
      </div>

      {evaluation.totalEvaluated === 0 ? (
        <div style={{
          background: 'rgba(15, 23, 42, 0.5)',
          border: '1px dashed var(--border-card)',
          borderRadius: 'var(--radius-md)',
          padding: '2rem',
          textAlign: 'center',
          color: 'var(--text-muted)',
        }}>
          <Target size={32} color="#64748b" style={{ margin: '0 auto 0.5rem auto' }} />
          <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Awaiting Pre-Result Predictions</div>
          <p style={{ fontSize: '0.8rem', marginTop: '0.3rem' }}>
            Whenever a spin is entered, the pre-spin probabilistic forecast is audited against the outcome.
          </p>
        </div>
      ) : (
        <>
          {/* Metric Comparison Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: '0.85rem',
            marginBottom: '1.25rem',
          }}>
            {/* Color Brier Score */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--border-card)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                Color Brier Score (Lower is Better)
              </div>
              <div className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fda4af' }}>
                {evaluation.brierColor.toFixed(4)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Theoretical baseline: <strong className="font-mono" style={{ color: '#fff' }}>{evaluation.baselineBrierColor.toFixed(4)}</strong>
              </div>
            </div>

            {/* Parity Brier Score */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--border-card)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                Parity Brier Score (Lower is Better)
              </div>
              <div className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#a5b4fc' }}>
                {evaluation.brierParity.toFixed(4)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Theoretical baseline: <strong className="font-mono" style={{ color: '#fff' }}>{evaluation.baselineBrierParity.toFixed(4)}</strong>
              </div>
            </div>

            {/* Cross-Entropy Log Loss */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--border-card)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                Color Cross-Entropy (Log Loss)
              </div>
              <div className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: '#6ee7b7' }}>
                {evaluation.logLossColor !== null ? evaluation.logLossColor.toFixed(4) : 'N/A'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Parity Log Loss: <strong className="font-mono" style={{ color: '#fff' }}>{evaluation.logLossParity !== null ? evaluation.logLossParity.toFixed(4) : 'N/A'}</strong>
              </div>
            </div>
          </div>

          {/* Calibration Curve Bins */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.5)',
            border: '1px solid var(--border-card)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            marginBottom: '1rem',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.75rem',
            }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>
                Probability Calibration Bins (Color: Red Forecast vs Actual Occurrence)
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Perfect calibration: Predicted Avg = Observed Freq
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '0.4rem 0.6rem' }}>Forecast Bin</th>
                    <th style={{ padding: '0.4rem 0.6rem' }}>Observations (Count)</th>
                    <th style={{ padding: '0.4rem 0.6rem' }}>Avg Predicted Probability</th>
                    <th style={{ padding: '0.4rem 0.6rem' }}>Observed Empirical Frequency</th>
                    <th style={{ padding: '0.4rem 0.6rem' }}>Calibration Error</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluation.calibrationBinsColor.map((bin) => {
                    const diff = bin.count > 0 ? Math.abs(bin.predictedAvg - bin.observedFreq) : 0;
                    return (
                      <tr key={`cal-bin-${bin.binLabel}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '0.4rem 0.6rem', fontWeight: 600, color: '#e2e8f0' }}>{bin.binLabel}</td>
                        <td style={{ padding: '0.4rem 0.6rem' }} className="font-mono">{bin.count}</td>
                        <td style={{ padding: '0.4rem 0.6rem' }} className="font-mono">
                          {bin.count > 0 ? `${(bin.predictedAvg * 100).toFixed(1)}%` : '—'}
                        </td>
                        <td style={{ padding: '0.4rem 0.6rem' }} className="font-mono">
                          {bin.count > 0 ? `${(bin.observedFreq * 100).toFixed(1)}%` : '—'}
                        </td>
                        <td style={{ padding: '0.4rem 0.6rem' }} className="font-mono">
                          {bin.count > 0 ? (
                            <span style={{ color: diff < 0.1 ? '#6ee7b7' : '#fcd34d' }}>
                              {(diff * 100).toFixed(1)}%
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Warnings List */}
          {evaluation.warnings.length > 0 && (
            <div style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem',
              marginBottom: '1rem',
            }}>
              {evaluation.warnings.map((w, i) => (
                <div key={`warn-${i}`} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.4rem',
                  fontSize: '0.75rem',
                  color: '#fde68a',
                  marginBottom: i === evaluation.warnings.length - 1 ? 0 : '0.35rem',
                }}>
                  <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}

          {/* Scientific Honesty Disclaimer */}
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
            lineHeight: 1.45,
          }}>
            <HelpCircle size={15} color="#94a3b8" style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              <strong>Model Verification Criterion:</strong> An adaptive model is never described as becoming more accurate merely because more data is stored. Genuine skill is demonstrated only if out-of-sample Brier score consistently exceeds the theoretical baseline (0.25). On independent trials, long-term Brier convergence to baseline is mathematically expected.
            </span>
          </div>
        </>
      )}
    </section>
  );
};
