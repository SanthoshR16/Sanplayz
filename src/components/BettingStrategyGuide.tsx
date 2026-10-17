import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Coins,
  ChevronDown,
  ChevronUp,
  Award,
} from 'lucide-react';

interface BettingStrategyGuideProps {
  startingCapital: number;
  minBet: number;
  currentBalance: number;
  currencySymbol?: string;
}

export const BettingStrategyGuide: React.FC<BettingStrategyGuideProps> = ({
  startingCapital,
  minBet,
  currentBalance: _currentBalance,
  currencySymbol = '₹',
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [selectedStrategy, setSelectedStrategy] = useState<'flat' | 'recovery' | 'martingale_warning'>('flat');

  const totalUnits = minBet > 0 ? Math.floor(startingCapital / minBet) : 0;
  const targetProfit = (startingCapital * 10) / 100;
  const winsNeeded = minBet > 0 ? Math.ceil(targetProfit / minBet) : 5;

  // Backup health classification
  let backupStatus: { label: string; color: string; bg: string; border: string; desc: string };
  if (totalUnits >= 50) {
    backupStatus = {
      label: `EXCELLENT SAFE BACKUP (${totalUnits} Units)`,
      color: '#6ee7b7',
      bg: 'rgba(16, 185, 129, 0.12)',
      border: 'rgba(16, 185, 129, 0.35)',
      desc: `With ${currencySymbol}${startingCapital} and a ${currencySymbol}${minBet} minimum bet, you have a massive 50+ unit buffer. Standard roulette variance will not threaten your bankroll.`,
    };
  } else if (totalUnits >= 25) {
    backupStatus = {
      label: `MODERATE BACKUP (${totalUnits} Units)`,
      color: '#fde047',
      bg: 'rgba(234, 179, 8, 0.12)',
      border: 'rgba(234, 179, 8, 0.35)',
      desc: `You have ${totalUnits} units of buffer. Flat betting is strictly required. For optimal 50-unit safety, consider a table with ${currencySymbol}${Math.max(1, Math.floor(startingCapital / 50))} minimum bet.`,
    };
  } else {
    backupStatus = {
      label: `VULNERABLE BACKUP (${totalUnits} Units)`,
      color: '#fca5a5',
      bg: 'rgba(239, 68, 68, 0.12)',
      border: 'rgba(239, 68, 68, 0.35)',
      desc: `Caution: ${totalUnits} units is below the recommended 50-unit safe threshold. Find a table with ${currencySymbol}${Math.max(1, Math.floor(startingCapital / 50))} min bet or deposit backup capital.`,
    };
  }

  return (
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.75)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        borderRadius: 'var(--radius-md)',
        marginTop: '0.85rem',
        overflow: 'hidden',
      }}
    >
      {/* Accordion Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'none',
          border: 'none',
          color: '#ffffff',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Coins size={18} color="#818cf8" />
          <div>
            <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>
              Gambler's Staking Strategy & Backup Advisory
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
              Should you Martingale or Flat Bet? Click to view optimal +10% blueprint.
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '0.2rem 0.5rem',
              borderRadius: 6,
              background: backupStatus.bg,
              color: backupStatus.color,
              border: `1px solid ${backupStatus.border}`,
            }}
          >
            {backupStatus.label}
          </span>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Accordion Body */}
      {isExpanded && (
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          {/* Strategy Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setSelectedStrategy('flat')}
              className="btn-secondary"
              style={{
                fontSize: '0.75rem',
                padding: '0.4rem 0.75rem',
                borderColor: selectedStrategy === 'flat' ? '#10b981' : undefined,
                color: selectedStrategy === 'flat' ? '#6ee7b7' : undefined,
                background: selectedStrategy === 'flat' ? 'rgba(16, 185, 129, 0.15)' : undefined,
                fontWeight: 700,
              }}
            >
              1. Flat Staking (Recommended)
            </button>
            <button
              type="button"
              onClick={() => setSelectedStrategy('recovery')}
              className="btn-secondary"
              style={{
                fontSize: '0.75rem',
                padding: '0.4rem 0.75rem',
                borderColor: selectedStrategy === 'recovery' ? '#6366f1' : undefined,
                color: selectedStrategy === 'recovery' ? '#c7d2fe' : undefined,
                background: selectedStrategy === 'recovery' ? 'rgba(99, 102, 241, 0.15)' : undefined,
                fontWeight: 700,
              }}
            >
              2. 1-1-2 Conservative Recovery
            </button>
            <button
              type="button"
              onClick={() => setSelectedStrategy('martingale_warning')}
              className="btn-secondary"
              style={{
                fontSize: '0.75rem',
                padding: '0.4rem 0.75rem',
                borderColor: selectedStrategy === 'martingale_warning' ? '#f43f5e' : undefined,
                color: selectedStrategy === 'martingale_warning' ? '#fca5a5' : undefined,
                background: selectedStrategy === 'martingale_warning' ? 'rgba(244, 63, 94, 0.15)' : undefined,
                fontWeight: 700,
              }}
            >
              ⚠️ Why NOT Martingale (10-20-40)
            </button>
          </div>

          {/* Strategy Details */}
          {selectedStrategy === 'flat' && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.85rem',
                marginBottom: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.4rem' }}>
                <ShieldCheck size={18} color="#10b981" />
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#6ee7b7' }}>
                  Disciplined Flat Staking: The Professional Player's Weapon
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#e2e8f0', margin: '0 0 0.5rem 0', lineHeight: 1.45 }}>
                <strong>The Strategy:</strong> Bet exactly 1 fixed unit ({currencySymbol}{minBet}) ONLY when the Sureshot signal fires. Never double down, never increase your bet after a loss.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.78rem', color: '#cbd5e1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={14} color="#10b981" />
                  <span><strong>The Math to +10%:</strong> You only need {winsNeeded} net Sureshot wins ({winsNeeded} × {currencySymbol}{minBet} = +{currencySymbol}{targetProfit.toFixed(0)} profit).</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={14} color="#10b981" />
                  <span><strong>Zero Ruin Risk:</strong> With a {totalUnits}-unit bankroll, a bad spin costs only {currencySymbol}{minBet} (1 unit), leaving your capital completely secure.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={14} color="#10b981" />
                  <span><strong>Disciplined Exit:</strong> As soon as the progress bar reaches 100% (+{currencySymbol}{targetProfit.toFixed(0)}), lock in your profit and leave the table!</span>
                </div>
              </div>
            </div>
          )}

          {selectedStrategy === 'recovery' && (
            <div
              style={{
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.85rem',
                marginBottom: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.4rem' }}>
                <TrendingUp size={18} color="#818cf8" />
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#c7d2fe' }}>
                  1-1-2 Conservative Recovery (Safe Alternative)
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#e2e8f0', margin: '0 0 0.5rem 0', lineHeight: 1.45 }}>
                <strong>The Strategy:</strong> Base bet is 1 unit ({currencySymbol}{minBet}). If a bet misses, you <strong>DO NOT</strong> double to {currencySymbol}{minBet * 2} immediately! You PAUSE during the post-loss cooldown.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.78rem', color: '#cbd5e1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={14} color="#818cf8" />
                  <span><strong>Step 1 (Base):</strong> Bet 1 unit ({currencySymbol}{minBet}) on Sureshot. If won, stay at 1 unit.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={14} color="#818cf8" />
                  <span><strong>Step 2 (After Loss):</strong> Wait through the 2-spin cooldown. On the next verified Sureshot, bet 1 unit ({currencySymbol}{minBet}).</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={14} color="#818cf8" />
                  <span><strong>Step 3 (Max Cap 2 Units):</strong> Only on an ultra-high confidence signal (92%+), wager 2 units ({currencySymbol}{minBet * 2}) to recover. Strictly cap at 2 units—never 4, never 8.</span>
                </div>
              </div>
            </div>
          )}

          {selectedStrategy === 'martingale_warning' && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.85rem',
                marginBottom: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.4rem' }}>
                <AlertTriangle size={18} color="#f43f5e" />
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fca5a5' }}>
                  Why You Should NEVER Play Pure Martingale (10 → 20 → 40 → 80...)
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#fecdd3', margin: '0 0 0.5rem 0', lineHeight: 1.45 }}>
                Casinos LOVE Martingale players because doubling after every loss creates exponential risk for tiny linear reward:
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '0.5rem',
                  fontSize: '0.75rem',
                  marginBottom: '0.5rem',
                }}
              >
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.4rem', borderRadius: 4 }}>
                  Spin 1: {currencySymbol}{minBet} (Loss)
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.4rem', borderRadius: 4 }}>
                  Spin 2: {currencySymbol}{minBet * 2} (Loss)
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.4rem', borderRadius: 4 }}>
                  Spin 3: {currencySymbol}{minBet * 4} (Loss)
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.4rem', borderRadius: 4 }}>
                  Spin 4: {currencySymbol}{minBet * 8} (Loss)
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.4rem', borderRadius: 4 }}>
                  Spin 5: {currencySymbol}{minBet * 16} (Loss)
                </div>
                <div style={{ background: 'rgba(239, 68, 68, 0.25)', padding: '0.4rem', borderRadius: 4, color: '#fca5a5', fontWeight: 700 }}>
                  Spin 6: {currencySymbol}{minBet * 32} (Wiped Out!)
                </div>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#fda4af', fontWeight: 600 }}>
                Total wagered to try to win just {currencySymbol}{minBet}: {currencySymbol}{minBet * 63}! A single cold run of 6 destroys your entire {currencySymbol}1,000 bankroll. Stick to Flat Staking!
              </div>
            </div>
          )}

          {/* Safe Backup Capital Guide */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.85rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Award size={16} color="#fbbf24" />
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#ffffff' }}>
                  Safe Backup Capital Blueprint
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', color: backupStatus.color, fontWeight: 700 }}>
                {backupStatus.desc}
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.65rem',
                fontSize: '0.75rem',
              }}
            >
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: 6 }}>
                <div style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>GOLD STANDARD (50 UNITS):</div>
                <div style={{ color: '#6ee7b7', fontWeight: 800, fontSize: '0.85rem' }}>
                  {currencySymbol}1,000 Capital (at {currencySymbol}20 Min Bet)
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                  Provides 50 bets of variance cushion. Safest path to +{currencySymbol}100 (+10%).
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: 6 }}>
                <div style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>IF YOU HAVE {currencySymbol}500 CAPITAL:</div>
                <div style={{ color: '#fbbf24', fontWeight: 800, fontSize: '0.85rem' }}>
                  Use {currencySymbol}10 Min Bet (50 Units) or {currencySymbol}20 Min Bet (25 Units)
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                  Target profit is +{currencySymbol}50 (+10%). Strictly require only 5 wins of {currencySymbol}10.
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: 6 }}>
                <div style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>IF YOU HAVE {currencySymbol}200 CAPITAL:</div>
                <div style={{ color: '#c7d2fe', fontWeight: 800, fontSize: '0.85rem' }}>
                  Use {currencySymbol}4 Min Bet Table
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                  Target profit is +{currencySymbol}20 (+10%). Never play {currencySymbol}20 min bets on {currencySymbol}200 capital!
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
