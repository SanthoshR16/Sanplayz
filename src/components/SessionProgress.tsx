import React from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

interface SessionProgressProps {
  totalResults: number;
  minWindow: 5 | 6;
}

export const SessionProgress: React.FC<SessionProgressProps> = ({
  totalResults,
  minWindow,
}) => {
  const isComplete = totalResults >= minWindow;
  const progressPercent = Math.min(100, Math.round((totalResults / minWindow) * 100));

  if (isComplete) {
    return (
      <div style={{
        background: 'rgba(16, 185, 129, 0.08)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        borderRadius: 'var(--radius-md)',
        padding: '0.85rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <CheckCircle2 size={20} color="#34d399" />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#a7f3d0' }}>
              Minimum Observation Window Satisfied ({totalResults} / {minWindow} results recorded)
            </div>
            <div style={{ fontSize: '0.8rem', color: '#6ee7b7' }}>
              Rolling statistics, transition matrices, Bayesian models, and out-of-sample tracking are fully active.
            </div>
          </div>
        </div>

        <div style={{
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          background: 'rgba(15, 23, 42, 0.6)',
          padding: '0.3rem 0.65rem',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-card)',
        }}>
          Real-time updates enabled
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(245, 158, 11, 0.08)',
      border: '1px solid rgba(245, 158, 11, 0.3)',
      borderRadius: 'var(--radius-md)',
      padding: '1rem 1.25rem',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem',
        marginBottom: '0.6rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={18} color="#f59e0b" />
          <span style={{ fontWeight: 700, color: '#fde68a', fontSize: '0.95rem' }}>
            Results collected: {totalResults}/{minWindow}
          </span>
        </div>
        <span style={{ fontSize: '0.8rem', color: '#fcd34d', fontWeight: 600 }}>
          {progressPercent}% Complete
        </span>
      </div>

      {/* Progress Bar */}
      <div style={{
        height: 8,
        width: '100%',
        background: 'rgba(30, 41, 59, 0.7)',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: '0.75rem',
      }}>
        <div style={{
          height: '100%',
          width: `${progressPercent}%`,
          background: 'linear-gradient(90deg, #f59e0b 0%, #6366f1 100%)',
          borderRadius: 4,
          transition: 'width 0.3s ease',
        }} />
      </div>

      {/* Educational Uncertainty Explanation */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.5rem',
        fontSize: '0.8rem',
        color: 'var(--text-secondary)',
        lineHeight: 1.45,
      }}>
        <Info size={15} color="#94a3b8" style={{ flexShrink: 0, marginTop: 2 }} />
        <span>
          <strong>Sample Incomplete:</strong> Statistical estimations require a minimum initial window of {minWindow} valid observations. Early frequencies carry high variance and extreme uncertainty. Historical observations will activate full rolling assessments once {minWindow} results are submitted.
        </span>
      </div>
    </div>
  );
};
