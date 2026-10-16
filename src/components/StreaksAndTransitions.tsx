import React from 'react';
import { Flame, Repeat, Info } from 'lucide-react';
import type { StreakInfo, TransitionStats } from '../types/roulette';
import { getTransitionProbabilities } from '../math/transitions';

interface StreaksAndTransitionsProps {
  streaks: StreakInfo;
  transitions: TransitionStats;
  totalResults: number;
}

export const StreaksAndTransitions: React.FC<StreaksAndTransitionsProps> = ({
  streaks,
  transitions,
  totalResults,
}) => {
  const { parityProbabilities, colorProbabilities } = getTransitionProbabilities(transitions);

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
            <Flame size={18} color="#f59e0b" />
            <span>Streak Analysis & Markov Transitions</span>
          </h2>
          <p className="panel-subtitle">
            Historical consecutive cluster tracking and empirical first-order conditional transition matrix.
          </p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.25rem',
        marginBottom: '1.25rem',
      }}>
        {/* Active & Historical Streaks */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <Flame size={16} color="#fb7185" />
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>
              Observed Consecutive Streaks
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
            {/* Current Color Streak */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Current Color Streak</div>
              <div style={{
                fontSize: '1.6rem',
                fontWeight: 800,
                color: streaks.currentColorStreak.color === 'red' ? '#fda4af' : '#cbd5e1',
                margin: '0.2rem 0',
              }}>
                {streaks.currentColorStreak.length > 0
                  ? `${streaks.currentColorStreak.length}× ${streaks.currentColorStreak.color?.toUpperCase()}`
                  : 'None'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Max: Red {streaks.currentColorMax.red} | Black {streaks.currentColorMax.black}
              </div>
            </div>

            {/* Current Parity Streak */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Current Parity Streak</div>
              <div style={{
                fontSize: '1.6rem',
                fontWeight: 800,
                color: streaks.currentParityStreak.parity === 'odd' ? '#a5b4fc' : '#67e8f9',
                margin: '0.2rem 0',
              }}>
                {streaks.currentParityStreak.length > 0
                  ? `${streaks.currentParityStreak.length}× ${streaks.currentParityStreak.parity?.toUpperCase()}`
                  : 'None'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Max: Odd {streaks.currentParityMax.odd} | Even {streaks.currentParityMax.even}
              </div>
            </div>
          </div>

          {/* Educational Note */}
          <div style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            lineHeight: 1.4,
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '0.6rem',
          }}>
            <strong>The Monte Carlo Fallacy:</strong> Observing a streak of 6 Reds does not increase the probability of Black on spin 7. The roulette wheel has no restoring force or memory.
          </div>
        </div>

        {/* First-Order Markov Transition Matrices */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <Repeat size={16} color="#06b6d4" />
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>
              Empirical Transition Frequencies
            </span>
          </div>

          {totalResults < 2 ? (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '1rem 0', textAlign: 'center' }}>
              At least 2 consecutive outcomes required to calculate state transitions.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {/* Parity Transition Matrix */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Parity (Prev → Next)
                </div>
                <div style={{ fontSize: '0.75rem', background: 'rgba(30, 41, 59, 0.4)', borderRadius: 'var(--radius-sm)', padding: '0.4rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}>
                    <span>Odd → Odd:</span>
                    <span className="font-mono">{transitions.parityTransitions['odd->odd']} ({parityProbabilities['odd->odd'] !== null ? `${(parityProbabilities['odd->odd']! * 100).toFixed(0)}%` : '—'})</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}>
                    <span>Odd → Even:</span>
                    <span className="font-mono">{transitions.parityTransitions['odd->even']} ({parityProbabilities['odd->even'] !== null ? `${(parityProbabilities['odd->even']! * 100).toFixed(0)}%` : '—'})</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}>
                    <span>Even → Odd:</span>
                    <span className="font-mono">{transitions.parityTransitions['even->odd']} ({parityProbabilities['even->odd'] !== null ? `${(parityProbabilities['even->odd']! * 100).toFixed(0)}%` : '—'})</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}>
                    <span>Even → Even:</span>
                    <span className="font-mono">{transitions.parityTransitions['even->even']} ({parityProbabilities['even->even'] !== null ? `${(parityProbabilities['even->even']! * 100).toFixed(0)}%` : '—'})</span>
                  </div>
                </div>
              </div>

              {/* Color Transition Matrix */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Color (Prev → Next)
                </div>
                <div style={{ fontSize: '0.75rem', background: 'rgba(30, 41, 59, 0.4)', borderRadius: 'var(--radius-sm)', padding: '0.4rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}>
                    <span>Red → Red:</span>
                    <span className="font-mono">{transitions.colorTransitions['red->red']} ({colorProbabilities['red->red'] !== null ? `${(colorProbabilities['red->red']! * 100).toFixed(0)}%` : '—'})</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}>
                    <span>Red → Black:</span>
                    <span className="font-mono">{transitions.colorTransitions['red->black']} ({colorProbabilities['red->black'] !== null ? `${(colorProbabilities['red->black']! * 100).toFixed(0)}%` : '—'})</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}>
                    <span>Black → Red:</span>
                    <span className="font-mono">{transitions.colorTransitions['black->red']} ({colorProbabilities['black->red'] !== null ? `${(colorProbabilities['black->red']! * 100).toFixed(0)}%` : '—'})</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}>
                    <span>Black → Black:</span>
                    <span className="font-mono">{transitions.colorTransitions['black->black']} ({colorProbabilities['black->black'] !== null ? `${(colorProbabilities['black->black']! * 100).toFixed(0)}%` : '—'})</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            marginTop: '0.65rem',
          }}>
            <Info size={12} />
            <span>Small transitions carry high statistical variance. Empirical differences do not establish state dependence.</span>
          </div>
        </div>
      </div>
    </section>
  );
};
