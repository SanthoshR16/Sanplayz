import React, { useState } from 'react';
import {
  Wallet,
  TrendingUp,
  Percent,
  RotateCcw,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import type { BankrollState } from '../types/mines';

interface MinesBankrollBarProps {
  bankrollState: BankrollState;
  onSetStartingBalance: (amount: number, targetPct?: number) => void;
  onUpdateStake: (stake: number) => void;
  onResetBankroll: () => void;
}

export const MinesBankrollBar: React.FC<MinesBankrollBarProps> = ({
  bankrollState,
  onSetStartingBalance,
  onUpdateStake,
  onResetBankroll,
}) => {
  const [inputBalance, setInputBalance] = useState<string>('');
  const [inputTargetPct, setInputTargetPct] = useState<number>(bankrollState.targetPercentage || 10);
  const [customStake, setCustomStake] = useState<string>(
    bankrollState.hypotheticalStake ? String(bankrollState.hypotheticalStake) : '10'
  );

  const isConfigured = bankrollState.startingBalance !== null && bankrollState.startingBalance > 0;

  const handleInitialize = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(inputBalance);
    if (!isNaN(val) && val > 0) {
      onSetStartingBalance(val, inputTargetPct);
    }
  };

  const handleStakeChange = (newStake: number) => {
    if (newStake > 0) {
      setCustomStake(String(newStake));
      onUpdateStake(newStake);
    }
  };

  return (
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.75)',
        border: '1px solid var(--border-card)',
        borderRadius: 'var(--radius-lg)',
        padding: '1rem 1.25rem',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        width: '100%',
      }}
    >
      {/* Top Bar: Bankroll Setup / Current Metrics */}
      {!isConfigured ? (
        <form
          onSubmit={handleInitialize}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '0.85rem',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(99, 102, 241, 0.2)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Wallet size={20} color="#818cf8" />
            </div>
            <div>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                Paper-Trading Bankroll
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                Enter your initial hypothetical starting balance (not prefilled)
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                }}
              >
                $
              </span>
              <input
                type="number"
                min="1"
                step="any"
                required
                placeholder="Starting Balance"
                value={inputBalance}
                onChange={(e) => setInputBalance(e.target.value)}
                style={{
                  padding: '0.45rem 0.65rem 0.45rem 1.6rem',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid var(--border-card)',
                  borderRadius: 'var(--radius-md)',
                  color: '#fff',
                  width: 150,
                  fontSize: '0.88rem',
                  fontFamily: 'var(--font-mono)',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Target:</span>
              <select
                value={inputTargetPct}
                onChange={(e) => setInputTargetPct(Number(e.target.value))}
                style={{
                  padding: '0.45rem 0.6rem',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid var(--border-card)',
                  borderRadius: 'var(--radius-md)',
                  color: '#fff',
                  fontSize: '0.82rem',
                }}
              >
                <option value={5}>+5%</option>
                <option value={10}>+10% (Standard)</option>
                <option value={15}>+15%</option>
                <option value={20}>+20%</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem', fontWeight: 600 }}
            >
              Start Simulator
            </button>
          </div>
        </form>
      ) : (
        /* Configured Bankroll Live Bar */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Target Milestone Alert */}
          {bankrollState.targetReached && (
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.3) 100%)',
                border: '1px solid #10b981',
                borderRadius: 'var(--radius-md)',
                padding: '0.65rem 0.95rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.6rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} color="#34d399" />
                <span style={{ color: '#ecfdf5', fontWeight: 700, fontSize: '0.88rem' }}>
                  Target Reached! (+{bankrollState.targetPercentage}% simulated gain reached)
                </span>
              </div>
              <span style={{ fontSize: '0.78rem', color: '#a7f3d0' }}>
                Recommended Action: <strong>STOP Session</strong>. Discipline prevents giving back gains to house edge.
              </span>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            {/* Balance & P/L Metrics */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Simulated Balance
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                  <span
                    style={{
                      fontSize: '1.45rem',
                      fontWeight: 800,
                      color:
                        (bankrollState.currentBalance ?? 0) >= (bankrollState.startingBalance ?? 0)
                          ? '#34d399'
                          : '#fb7185',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    ${(bankrollState.currentBalance ?? 0).toFixed(2)}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    (Start: ${(bankrollState.startingBalance ?? 0).toFixed(2)})
                  </span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Net Profit / Loss
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <TrendingUp
                    size={16}
                    color={bankrollState.netProfitTotal >= 0 ? '#34d399' : '#fb7185'}
                    style={{
                      transform: bankrollState.netProfitTotal < 0 ? 'rotate(180deg)' : 'none',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      color: bankrollState.netProfitTotal >= 0 ? '#34d399' : '#fb7185',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {bankrollState.netProfitTotal >= 0 ? '+' : ''}${bankrollState.netProfitTotal.toFixed(2)}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    (Gross: ${bankrollState.grossReturnsTotal.toFixed(2)})
                  </span>
                </div>
              </div>

              {/* Target Goal Progress */}
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Target (+{bankrollState.targetPercentage}%)
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Percent size={14} color="#818cf8" />
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: '#c7d2fe', fontFamily: 'var(--font-mono)' }}>
                    ${(bankrollState.targetBalance ?? 0).toFixed(2)}
                  </span>
                  {bankrollState.targetReached ? (
                    <span style={{ color: '#34d399', fontSize: '0.78rem', fontWeight: 600 }}>Achieved</span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      (${(Math.max(0, (bankrollState.targetBalance ?? 0) - (bankrollState.currentBalance ?? 0))).toFixed(2)} away)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stake Controller and Reset */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Stake:</span>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  value={customStake}
                  onChange={(e) => {
                    setCustomStake(e.target.value);
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val > 0) onUpdateStake(val);
                  }}
                  style={{
                    width: 75,
                    padding: '0.35rem 0.5rem',
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid var(--border-card)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fff',
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-mono)',
                  }}
                />
              </div>

              {/* Quick % Buttons */}
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {[1, 2, 5].map((pct) => {
                  const calculated = Math.max(1, Number(((bankrollState.currentBalance ?? 0) * (pct / 100)).toFixed(2)));
                  return (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleStakeChange(calculated)}
                      title={`Set stake to ${pct}% of current balance ($${calculated})`}
                      style={{
                        padding: '0.25rem 0.45rem',
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid var(--border-card)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-secondary)',
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                      }}
                    >
                      {pct}%
                    </button>
                  );
                })}
              </div>

              {/* Reset Bankroll Button */}
              <button
                type="button"
                onClick={onResetBankroll}
                title="Reset paper bankroll to unconfigured state"
                style={{
                  background: 'none',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.35rem 0.55rem',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.78rem',
                }}
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Secondary Stats Row: Drawdown, Streaks, Picks */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.25rem',
              flexWrap: 'wrap',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '0.5rem',
            }}
          >
            <div>
              <span>Picks: </span>
              <strong style={{ color: '#fff' }}>{bankrollState.totalPicksMade}</strong> (
              <span style={{ color: '#34d399' }}>{bankrollState.successfulPicks} safe</span> /{' '}
              <span style={{ color: '#fb7185' }}>{bankrollState.failedPicks} bomb</span>)
            </div>

            <div>
              <span>Max Drawdown: </span>
              <strong style={{ color: bankrollState.maxDrawdown > 0 ? '#fb7185' : 'var(--text-muted)' }}>
                ${bankrollState.maxDrawdown.toFixed(2)} ({bankrollState.maxDrawdownPercentage.toFixed(1)}%)
              </strong>
            </div>

            <div>
              <span>Streaks: </span>
              <span>
                Win: {bankrollState.currentWinStreak} (Max: {bankrollState.maxWinStreak}) | Loss:{' '}
                {bankrollState.currentLossStreak} (Max: {bankrollState.maxLossStreak})
              </span>
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <ShieldAlert size={13} color="#f59e0b" />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                Hypothetical Paper-Trading Only. Never chase losses or use Martingale.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
