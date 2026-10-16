import React, { useState } from 'react';
import { Calculator, ShieldCheck } from 'lucide-react';
import { calculateHouseEdge } from '../math/houseEdge';
import type { HouseEdgeInput } from '../types/roulette';

export const HouseEdgeCalculator: React.FC = () => {
  const [stake, setStake] = useState<number>(10);
  const [betCategory, setBetCategory] = useState<HouseEdgeInput['betCategory']>('red');
  const [winningPayout, setWinningPayout] = useState<number>(1.0); // 1.0 means 1:1 net profit
  const [fees, setFees] = useState<number>(0);
  const [customWinCount, setCustomWinCount] = useState<number>(18);

  // Auto-fill suggested typical payouts when bet category changes
  const handleCategoryChange = (cat: HouseEdgeInput['betCategory']) => {
    setBetCategory(cat);
    switch (cat) {
      case 'red':
      case 'black':
      case 'odd':
      case 'even':
        setWinningPayout(1.0); // 1:1
        break;
      case 'single':
        setWinningPayout(35.0); // 35:1
        break;
      case 'joint_ro':
      case 'joint_be':
        setWinningPayout(2.6); // 10/36 => break-even is 2.6:1
        break;
      case 'joint_re':
      case 'joint_bo':
        setWinningPayout(3.5); // 8/36 => break-even is 3.5:1
        break;
      case 'custom':
        setWinningPayout(1.0);
        break;
    }
  };

  const result = calculateHouseEdge({
    stake,
    betCategory,
    winningPayout,
    fees,
    customWinCount,
  });

  const isHouseAdvantage = result.houseEdge > 0.0001;
  const isPlayerAdvantage = result.houseEdge < -0.0001;

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
            <Calculator size={18} color="#e11d48" />
            <span>House Edge & Expected Value (EV) Calculator</span>
          </h2>
          <p className="panel-subtitle">
            Theoretical mathematical expectation derived strictly from 1–36 wheel geometry and custom payout rules.
          </p>
        </div>
      </div>

      {/* Input Form Controls */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.25rem',
      }}>
        {/* Bet Category Select */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
            Bet Category
          </label>
          <select
            value={betCategory}
            onChange={(e) => handleCategoryChange(e.target.value as HouseEdgeInput['betCategory'])}
            className="input-field"
            style={{ fontSize: '0.85rem' }}
          >
            <option value="red">Red (18 / 36)</option>
            <option value="black">Black (18 / 36)</option>
            <option value="odd">Odd (18 / 36)</option>
            <option value="even">Even (18 / 36)</option>
            <option value="single">Single Number (1 / 36)</option>
            <option value="joint_ro">Red & Odd (10 / 36 numbers)</option>
            <option value="joint_re">Red & Even (8 / 36 numbers)</option>
            <option value="joint_bo">Black & Odd (8 / 36 numbers)</option>
            <option value="joint_be">Black & Even (10 / 36 numbers)</option>
            <option value="custom">Custom Win Count (k / 36)</option>
          </select>
        </div>

        {/* Stake Amount ($) */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
            Stake Amount ($)
          </label>
          <input
            type="number"
            min="0.1"
            step="1"
            value={stake}
            onChange={(e) => setStake(Math.max(0.1, Number(e.target.value)))}
            className="input-field font-mono"
            style={{ fontSize: '0.9rem' }}
          />
        </div>

        {/* Winning Payout (b : 1) */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
            Net Payout Ratio (b : 1)
          </label>
          <input
            type="number"
            min="0"
            step="0.05"
            value={winningPayout}
            onChange={(e) => setWinningPayout(Math.max(0, Number(e.target.value)))}
            className="input-field font-mono"
            style={{ fontSize: '0.9rem' }}
          />
        </div>

        {/* Table Fee or Commission */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
            Table Deduction / Fee ($)
          </label>
          <input
            type="number"
            min="0"
            step="0.25"
            value={fees}
            onChange={(e) => setFees(Math.max(0, Number(e.target.value)))}
            className="input-field font-mono"
            style={{ fontSize: '0.9rem' }}
          />
        </div>

        {/* Custom Out-of-36 Win Count */}
        {betCategory === 'custom' && (
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Winning Outcomes (k out of 36)
            </label>
            <input
              type="number"
              min="1"
              max="35"
              value={customWinCount}
              onChange={(e) => setCustomWinCount(Math.min(35, Math.max(1, Number(e.target.value))))}
              className="input-field font-mono"
              style={{ fontSize: '0.9rem' }}
            />
          </div>
        )}
      </div>

      {/* Output Results Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '0.85rem',
        marginBottom: '1.25rem',
      }}>
        {/* House Edge Card */}
        <div style={{
          background: isHouseAdvantage
            ? 'rgba(225, 29, 72, 0.12)'
            : isPlayerAdvantage
            ? 'rgba(16, 185, 129, 0.12)'
            : 'rgba(99, 102, 241, 0.12)',
          border: `1px solid ${isHouseAdvantage ? 'var(--roulette-red-border)' : isPlayerAdvantage ? 'rgba(16, 185, 129, 0.3)' : 'rgba(99, 102, 241, 0.3)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
            Theoretical House Edge
          </div>
          <div className="font-mono" style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: isHouseAdvantage ? '#fda4af' : isPlayerAdvantage ? '#6ee7b7' : '#a5b4fc',
          }}>
            {result.houseEdgePercentage > 0 ? `+${result.houseEdgePercentage.toFixed(2)}%` : `${result.houseEdgePercentage.toFixed(2)}%`}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {isHouseAdvantage ? 'Casino holds mathematical edge' : isPlayerAdvantage ? 'Player holds theoretical edge' : 'Purely zero-sum fair wager'}
          </div>
        </div>

        {/* Expected Value for Stake */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
            Expected Return (EV_S)
          </div>
          <div className="font-mono" style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: result.evStake < 0 ? '#fda4af' : result.evStake > 0 ? '#6ee7b7' : '#fff',
          }}>
            {result.evStake >= 0 ? `+$${result.evStake.toFixed(2)}` : `-$${Math.abs(result.evStake).toFixed(2)}`}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            EV per unit stake: {result.evUnit.toFixed(4)}
          </div>
        </div>

        {/* Win/Loss Probabilities */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
            Win / Loss Probabilities
          </div>
          <div className="font-mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginTop: '0.3rem' }}>
            <span style={{ color: '#6ee7b7' }}>{(result.pWin * 100).toFixed(2)}%</span>
            <span style={{ color: 'var(--text-muted)', margin: '0 0.35rem' }}>/</span>
            <span style={{ color: '#fda4af' }}>{(result.pLose * 100).toFixed(2)}%</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Break-even payout: <strong className="font-mono" style={{ color: '#fff' }}>{result.breakEvenPayout.toFixed(3)} : 1</strong>
          </div>
        </div>

        {/* Net / Gross Returns */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
            Winning Payoff
          </div>
          <div className="font-mono" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#67e8f9', marginTop: '0.3rem' }}>
            Net: +${result.netProfit.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Gross return: ${result.grossReturn.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Assumptions & Formula */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.5)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-sm)',
        padding: '0.85rem',
        fontSize: '0.75rem',
        color: 'var(--text-secondary)',
      }}>
        <div style={{ fontWeight: 700, color: '#fff', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <ShieldCheck size={14} color="#6366f1" />
          <span>Formula: {result.formula}</span>
        </div>
        <ul style={{ paddingLeft: '1.2rem', lineHeight: 1.5 }}>
          {result.assumptions.map((asm, i) => (
            <li key={`asm-${i}`}>{asm}</li>
          ))}
        </ul>
      </div>
    </section>
  );
};
