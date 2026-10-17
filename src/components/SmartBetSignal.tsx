import React from 'react';
import {
  Target,
  Zap,
  AlertCircle,
  Flame,
  Hourglass,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import type { BetRecommendation } from '../math/recommendations';
import { calculateDynamicWager, loadBankrollFromStorage } from '../math/bankrollStorage';

interface SmartBetSignalProps {
  recommendation: BetRecommendation;
  totalResults: number;
}

export const SmartBetSignal: React.FC<SmartBetSignalProps> = ({
  recommendation,
  totalResults,
}) => {
  const { sureshot, colorAdvice, parityAdvice, sectorAdvice } = recommendation;
  const isTriggered = sureshot.isTriggered;
  const isColorFocus = sureshot.focusType === 'COLOR';
  const isParityFocus = sureshot.focusType === 'PARITY';

  // Load live bankroll state to dynamically calculate the smart wager
  const bankroll = loadBankrollFromStorage();
  const dynamicWager = calculateDynamicWager(bankroll, sureshot.confidence, isTriggered);

  // Determine styling theme based on the target selection
  const isRed = sureshot.targetSelection === 'RED';
  const isOdd = sureshot.targetSelection === 'ODD';

  return (
    <section
      className="glass-panel"
      style={{
        padding: '1.5rem',
        background: isTriggered
          ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(20, 16, 35, 0.98) 100%)'
          : 'linear-gradient(135deg, rgba(16, 23, 42, 0.95) 0%, rgba(24, 24, 38, 0.95) 100%)',
        border: isTriggered
          ? '1px solid rgba(245, 158, 11, 0.55)'
          : '1px solid rgba(99, 102, 241, 0.35)',
        boxShadow: isTriggered
          ? '0 12px 40px rgba(245, 158, 11, 0.22), 0 0 20px rgba(225, 29, 72, 0.15)'
          : '0 8px 32px rgba(99, 102, 241, 0.18)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background glow decoration */}
      <div
        style={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 220,
          height: 220,
          background: isTriggered
            ? 'radial-gradient(circle, rgba(245, 158, 11, 0.2) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Top Banner / Section Header (Preserves text for UI tests) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '1.25rem',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              background: isTriggered
                ? 'linear-gradient(135deg, #f59e0b 0%, #e11d48 100%)'
                : 'linear-gradient(135deg, #4f46e5 0%, #0891b2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isTriggered
                ? '0 4px 14px rgba(245, 158, 11, 0.45)'
                : '0 4px 12px rgba(79, 70, 229, 0.35)',
            }}
          >
            {isTriggered ? <Flame size={22} color="#ffffff" /> : <Target size={20} color="#ffffff" />}
          </div>
          <div>
            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: '#fff',
                letterSpacing: '-0.01em',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                margin: 0,
              }}
            >
              <span>Next Spin Recommendation & Signals</span>
              {isTriggered && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    background: 'rgba(245, 158, 11, 0.25)',
                    color: '#fbbf24',
                    border: '1px solid rgba(245, 158, 11, 0.5)',
                    padding: '0.15rem 0.5rem',
                    borderRadius: 9999,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                  }}
                >
                  Sureshot Active
                </span>
              )}
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
              {isTriggered
                ? `High-accuracy single focus confirmed from ${totalResults} spins. Strike now on ${sureshot.focusType}.`
                : `Active surveillance across ${totalResults} spins. Sureshot algorithm triggers only upon verified convergence.`}
            </p>
          </div>
        </div>

        {/* Live Status Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {sureshot.historicalPerformance.totalSureshots > 0 && (
            <span
              style={{
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#6ee7b7',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '0.25rem 0.65rem',
                borderRadius: 9999,
                fontSize: '0.75rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
              title="Verified Sureshot hit rate throughout this session"
            >
              <ShieldCheck size={13} color="#10b981" />
              <span>Sureshot Hit Rate: {sureshot.historicalPerformance.winRate}% ({sureshot.historicalPerformance.sureshotWins}/{sureshot.historicalPerformance.totalSureshots})</span>
            </span>
          )}

          <span
            style={{
              background: isTriggered ? 'rgba(245, 158, 11, 0.2)' : 'rgba(99, 102, 241, 0.15)',
              color: isTriggered ? '#fbbf24' : '#a5b4fc',
              border: `1px solid ${isTriggered ? 'rgba(245, 158, 11, 0.45)' : 'rgba(99, 102, 241, 0.35)'}`,
              padding: '0.25rem 0.65rem',
              borderRadius: 9999,
              fontSize: '0.75rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            {isTriggered ? <Zap size={13} /> : <Hourglass size={13} />}
            <span>{isTriggered ? 'SURESHOT LIVE' : 'CONVERGENCE FILTER ACTIVE'}</span>
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* CASE 1: SURESHOT TRIGGER ACTIVATED (STRIKE NOW)               */}
      {/* ============================================================ */}
      {isTriggered ? (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%)',
            border: '2px solid rgba(245, 158, 11, 0.6)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            marginBottom: '1.25rem',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.45)',
          }}
        >
          {/* Header Row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1rem',
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#fbbf24',
                  marginBottom: '0.3rem',
                }}
              >
                <Sparkles size={16} color="#fbbf24" />
                <span>Single Sureshot Focus: {sureshot.focusType} (Do not split bets)</span>
              </div>

              {/* Big bold directive */}
              <div
                style={{
                  fontSize: '2.4rem',
                  fontWeight: 900,
                  color: isRed
                    ? '#fda4af'
                    : sureshot.targetSelection === 'BLACK'
                    ? '#cbd5e1'
                    : isOdd
                    ? '#c7d2fe'
                    : '#a5f3fc',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.15,
                  margin: '0.2rem 0',
                }}
              >
                {sureshot.primaryDirective}
              </div>

              {/* Exact Recommended Wager Badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  padding: '0.45rem 1rem',
                  borderRadius: 8,
                  fontWeight: 900,
                  fontSize: '1.18rem',
                  fontFamily: 'monospace',
                  marginTop: '0.5rem',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                }}
              >
                <span>🎯 PLACE BET: ₹{dynamicWager.amount} ON {sureshot.targetSelection}</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#fde68a', marginTop: '0.35rem', fontWeight: 600 }}>
                {dynamicWager.reasoning}
              </div>
            </div>

            {/* Confidence & Staking Badge */}
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(225, 29, 72, 0.25) 100%)',
                  color: '#fef08a',
                  border: '1px solid rgba(245, 158, 11, 0.5)',
                  padding: '0.45rem 0.95rem',
                  borderRadius: 10,
                  fontSize: '0.9rem',
                  fontWeight: 900,
                  letterSpacing: '0.02em',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <Flame size={16} color="#f59e0b" />
                <span>{sureshot.confidence}% CONFIDENCE ({sureshot.confidenceLabel})</span>
              </div>
              <div
                style={{
                  fontSize: '0.85rem',
                  color: '#fbbf24',
                  marginTop: '0.4rem',
                  fontWeight: 700,
                }}
              >
                Calculated Stake:{' '}
                <strong style={{ color: '#6ee7b7', fontFamily: 'monospace', fontSize: '1rem' }}>₹{dynamicWager.amount}</strong> ({dynamicWager.units} Units) • Payout:{' '}
                <strong style={{ color: '#fff' }}>{sureshot.payout}</strong>
              </div>
            </div>
          </div>

          {/* Mathematical Proof Factors */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              marginTop: '0.75rem',
            }}
          >
            <div
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <TrendingUp size={15} color="#6366f1" />
              <span>Mathematical Verification & Trigger Factors ({sureshot.conditionsMet} Alignments):</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {sureshot.triggerFactors.map((factor, idx) => (
                <div
                  key={`factor-${idx}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.55rem',
                    fontSize: '0.88rem',
                    color: '#e2e8f0',
                  }}
                >
                  <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0 }} />
                  <span>{factor}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ============================================================ */
        /* CASE 2: WAITING FOR SURESHOT (DO NOT BET YET)                 */
        /* ============================================================ */
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            marginBottom: '1.25rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1rem',
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#93c5fd',
                  marginBottom: '0.3rem',
                }}
              >
                <Hourglass size={15} color="#93c5fd" />
                <span>Disciplined Betting Guardrail</span>
              </div>
              <div
                style={{
                  fontSize: '1.85rem',
                  fontWeight: 900,
                  color: '#f8fafc',
                  letterSpacing: '-0.02em',
                  margin: '0.15rem 0',
                }}
              >
                {sureshot.primaryDirective}
              </div>
              <p
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  margin: '0.35rem 0 0 0',
                  maxWidth: 620,
                  lineHeight: 1.45,
                }}
              >
                Our AI avoids uncalculated 50/50 guesses. Keep feeding spin numbers into the
                system. The Sureshot signal will activate automatically when streak exhaustion,
                Bayesian drift, and Markov transitions line up.
              </p>
            </div>

            {/* Convergence Progress Bar */}
            <div style={{ minWidth: 220, textAlign: 'right' }}>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  marginBottom: '0.3rem',
                }}
              >
                Convergence Progress
              </div>
              <div
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  color: '#fff',
                  fontFamily: 'var(--font-mono)',
                  marginBottom: '0.4rem',
                }}
              >
                {sureshot.conditionsMet} of 2 Triggers Met
              </div>
              <div
                style={{
                  height: 8,
                  background: 'rgba(0, 0, 0, 0.4)',
                  borderRadius: 4,
                  overflow: 'hidden',
                  width: '100%',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, (sureshot.conditionsMet / 2) * 100)}%`,
                    background:
                      sureshot.conditionsMet >= 1
                        ? 'linear-gradient(90deg, #f59e0b, #10b981)'
                        : 'linear-gradient(90deg, #6366f1, #38bdf8)',
                    borderRadius: 4,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  marginTop: '0.35rem',
                }}
              >
                Requires streak $\ge 3$ or 5-window skew $\ge 80\%$
              </div>
            </div>
          </div>

          {/* Current Surveillance Notes */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.65)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
            }}
          >
            {sureshot.triggerFactors.map((factor, idx) => (
              <div
                key={`wait-factor-${idx}`}
                style={{
                  fontSize: '0.82rem',
                  color: '#cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <AlertCircle size={14} color="#6366f1" style={{ flexShrink: 0 }} />
                <span>{factor}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3 SECONDARY COMPARISON CARDS: Color, Parity, High-EV Sector   */}
      {/* ============================================================ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1rem',
        }}
      >
        {/* Color Metric Card */}
        <div
          style={{
            background: isColorFocus && isTriggered ? 'rgba(225, 29, 72, 0.16)' : 'rgba(30, 41, 59, 0.45)',
            border: `1px solid ${
              isColorFocus && isTriggered
                ? 'rgba(244, 63, 94, 0.6)'
                : colorAdvice.pick === 'red'
                ? 'var(--roulette-red-border)'
                : 'var(--roulette-black-border)'
            }`,
            borderRadius: 'var(--radius-md)',
            padding: '1.1rem',
            position: 'relative',
          }}
        >
          {isColorFocus && isTriggered && (
            <span
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: '#e11d48',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: 800,
                padding: '0.1rem 0.4rem',
                borderRadius: 4,
                textTransform: 'uppercase',
              }}
            >
              Primary Focus
            </span>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Color Analysis
            </span>
            <span className={`badge ${colorAdvice.isActionable ? (colorAdvice.pick === 'red' ? 'badge-red' : 'badge-black') : 'badge-black'}`}>
              {colorAdvice.isActionable ? colorAdvice.pick.toUpperCase() : 'NEUTRAL'}
            </span>
          </div>

          <div style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            color: colorAdvice.isActionable
              ? (colorAdvice.pick === 'red' ? '#fda4af' : '#cbd5e1')
              : '#94a3b8',
            marginBottom: '0.35rem',
          }}>
            {colorAdvice.isActionable
              ? `${colorAdvice.actionText} (${colorAdvice.confidence}%)`
              : 'NEUTRAL — NO BET (<75%)'}
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            {colorAdvice.reason}
          </div>
        </div>

        {/* Parity Metric Card */}
        <div
          style={{
            background: isParityFocus && isTriggered ? 'rgba(99, 102, 241, 0.16)' : 'rgba(30, 41, 59, 0.45)',
            border: `1px solid ${
              isParityFocus && isTriggered
                ? 'rgba(99, 102, 241, 0.6)'
                : parityAdvice.isActionable
                ? (parityAdvice.pick === 'odd' ? 'rgba(99, 102, 241, 0.35)' : 'rgba(6, 182, 212, 0.35)')
                : 'var(--border-card)'
            }`,
            borderRadius: 'var(--radius-md)',
            padding: '1.1rem',
            position: 'relative',
          }}
        >
          {isParityFocus && isTriggered && (
            <span
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: '#4f46e5',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: 800,
                padding: '0.1rem 0.4rem',
                borderRadius: 4,
                textTransform: 'uppercase',
              }}
            >
              Primary Focus
            </span>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Parity Analysis
            </span>
            <span className={`badge ${parityAdvice.isActionable ? (parityAdvice.pick === 'odd' ? 'badge-odd' : 'badge-even') : 'badge-black'}`}>
              {parityAdvice.isActionable ? parityAdvice.pick.toUpperCase() : 'NEUTRAL'}
            </span>
          </div>

          <div style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            color: parityAdvice.isActionable
              ? (parityAdvice.pick === 'odd' ? '#a5b4fc' : '#67e8f9')
              : '#94a3b8',
            marginBottom: '0.35rem',
          }}>
            {parityAdvice.isActionable
              ? `${parityAdvice.actionText} (${parityAdvice.confidence}%)`
              : 'NEUTRAL — NO BET (<75%)'}
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            {parityAdvice.reason}
          </div>
        </div>

        {/* High-Coverage Sector Card */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid var(--border-card)',
            borderRadius: 'var(--radius-md)',
            padding: '1.1rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Highest Sector Coverage
            </span>
            <span
              style={{
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#c7d2fe',
                padding: '0.15rem 0.45rem',
                borderRadius: 4,
                fontSize: '0.7rem',
                fontWeight: 700,
              }}
            >
              Payout: {sectorAdvice.payout}
            </span>
          </div>

          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '0.35rem' }}>
            {sectorAdvice.name}
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            {sectorAdvice.reason}
          </div>
        </div>
      </div>
    </section>
  );
};
