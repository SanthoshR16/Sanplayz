import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Target,
  Trophy,
  RotateCcw,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import type { SureshotSignal } from '../math/recommendations';
import {
  type BankrollState,
  loadBankrollFromStorage,
  saveBankrollToStorage,
} from '../math/bankrollStorage';
import { BettingStrategyGuide } from './BettingStrategyGuide';

export interface BetOutcomeEvent {
  id: number;
  won: boolean;
  selection: string;
  numberLanded: number;
}

interface BankrollTargetBarProps {
  sureshot: SureshotSignal;
  currencySymbol?: string;
  lastOutcome?: BetOutcomeEvent | null;
}

export const BankrollTargetBar: React.FC<BankrollTargetBarProps> = ({
  sureshot,
  currencySymbol = '₹',
  lastOutcome,
}) => {
  const [bankroll, setBankroll] = useState<BankrollState>(loadBankrollFromStorage);
  const [isEditingCapital, setIsEditingCapital] = useState<boolean>(false);
  const [inputCapital, setInputCapital] = useState<string>(bankroll.startingCapital.toString());
  const [inputMinBet, setInputMinBet] = useState<string>(bankroll.minBet.toString());
  const [recentAlert, setRecentAlert] = useState<{
    won: boolean;
    selection: string;
    amount: number;
    numberLanded: number;
  } | null>(null);

  // Auto-settle bet when a new outcome is provided from a sureshot trigger
  useEffect(() => {
    if (!lastOutcome) return;
    const betAmount = bankroll.minBet;
    setBankroll((prev) => ({
      ...prev,
      currentBalance: lastOutcome.won
        ? prev.currentBalance + betAmount
        : Math.max(0, prev.currentBalance - betAmount),
      totalBetsPlaced: prev.totalBetsPlaced + 1,
      betsWon: lastOutcome.won ? prev.betsWon + 1 : prev.betsWon,
      betsLost: !lastOutcome.won ? prev.betsLost + 1 : prev.betsLost,
    }));
    setRecentAlert({
      won: lastOutcome.won,
      selection: lastOutcome.selection,
      amount: betAmount,
      numberLanded: lastOutcome.numberLanded,
    });
    const timer = setTimeout(() => {
      setRecentAlert(null);
    }, 7000);
    return () => clearTimeout(timer);
  }, [lastOutcome, bankroll.minBet]);

  // Save to localStorage on change
  useEffect(() => {
    saveBankrollToStorage(bankroll);
  }, [bankroll]);

  const profitAmount = bankroll.currentBalance - bankroll.startingCapital;
  const targetProfitAmount = (bankroll.startingCapital * bankroll.targetPercent) / 100;
  const targetBankroll = bankroll.startingCapital + targetProfitAmount;
  const profitPercent = bankroll.startingCapital > 0
    ? (profitAmount / bankroll.startingCapital) * 100
    : 0;
  const isTargetAchieved = profitAmount >= targetProfitAmount;

  // Progress percentage (0% to 100%)
  const progressRatio = Math.max(0, Math.min(100, (profitAmount / targetProfitAmount) * 100));

  const handleSaveInputs = () => {
    const parsedCap = parseFloat(inputCapital);
    const parsedBet = parseFloat(inputMinBet);
    if (!isNaN(parsedCap) && parsedCap > 0 && !isNaN(parsedBet) && parsedBet > 0) {
      setBankroll((prev) => {
        // If starting capital changed, adjust current balance proportionally or reset
        const prevProfit = prev.currentBalance - prev.startingCapital;
        const nextState = {
          ...prev,
          startingCapital: parsedCap,
          currentBalance: Math.max(0, parsedCap + prevProfit),
          minBet: parsedBet,
        };
        saveBankrollToStorage(nextState);
        return nextState;
      });
      setIsEditingCapital(false);
    }
  };

  const handleManualWin = (amount = bankroll.minBet) => {
    setBankroll((prev) => ({
      ...prev,
      currentBalance: prev.currentBalance + amount,
      totalBetsPlaced: prev.totalBetsPlaced + 1,
      betsWon: prev.betsWon + 1,
    }));
  };

  const handleManualLoss = (amount = bankroll.minBet) => {
    setBankroll((prev) => ({
      ...prev,
      currentBalance: Math.max(0, prev.currentBalance - amount),
      totalBetsPlaced: prev.totalBetsPlaced + 1,
      betsLost: prev.betsLost + 1,
    }));
  };

  const handleResetSession = () => {
    if (window.confirm('Reset bankroll tracker to starting capital?')) {
      setBankroll((prev) => ({
        ...prev,
        currentBalance: prev.startingCapital,
        totalBetsPlaced: 0,
        betsWon: 0,
        betsLost: 0,
      }));
    }
  };

  // Win rate of placed bets
  const sessionWinRate = bankroll.totalBetsPlaced > 0
    ? Math.round((bankroll.betsWon / bankroll.totalBetsPlaced) * 100)
    : 100;

  return (
    <div
      className="glass-panel"
      style={{
        padding: '1.25rem',
        marginBottom: '1.25rem',
        background: isTargetAchieved
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(15, 23, 42, 0.95) 100%)'
          : 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 27, 75, 0.95) 100%)',
        border: isTargetAchieved
          ? '1px solid rgba(16, 185, 129, 0.6)'
          : '1px solid rgba(99, 102, 241, 0.4)',
        boxShadow: isTargetAchieved
          ? '0 8px 32px rgba(16, 185, 129, 0.25), 0 0 15px rgba(245, 158, 11, 0.2)'
          : '0 8px 30px rgba(99, 102, 241, 0.15)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Target Achieved Top Ribbon Banner */}
      {isTargetAchieved && (
        <div
          style={{
            background: 'linear-gradient(90deg, #10b981 0%, #059669 50%, #f59e0b 100%)',
            color: '#ffffff',
            padding: '0.45rem 1rem',
            margin: '-1.25rem -1.25rem 1rem -1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
            fontWeight: 800,
            fontSize: '0.85rem',
            letterSpacing: '0.02em',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Trophy size={18} color="#ffffff" />
            <span>🎯 10% PROFIT TARGET ACHIEVED (+{currencySymbol}{profitAmount.toFixed(2)})!</span>
          </div>
          <span style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.25)', padding: '0.2rem 0.5rem', borderRadius: 4 }}>
            DISCIPLINED GAMBLER RULE: TAKE PROFIT & WALK AWAY!
          </span>
        </div>
      )}

      {/* Recent Bet Outcome Notification */}
      {recentAlert && (
        <div
          style={{
            background: recentAlert.won
              ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.15) 100%)'
              : 'linear-gradient(90deg, rgba(244, 63, 94, 0.25) 0%, rgba(225, 29, 72, 0.15) 100%)',
            border: `1px solid ${recentAlert.won ? 'rgba(16, 185, 129, 0.5)' : 'rgba(244, 63, 94, 0.5)'}`,
            borderRadius: 'var(--radius-sm)',
            padding: '0.45rem 0.85rem',
            marginBottom: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: recentAlert.won ? '#6ee7b7' : '#fca5a5',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {recentAlert.won ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>
              {recentAlert.won
                ? `🎯 Sureshot WON! Spin #${recentAlert.numberLanded} matched BET ${recentAlert.selection} (+${currencySymbol}${recentAlert.amount})`
                : `⚠️ Sureshot Missed: Spin #${recentAlert.numberLanded} was not ${recentAlert.selection} (-${currencySymbol}${recentAlert.amount})`}
            </span>
          </div>
          <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>Auto-tracked in Bankroll</span>
        </div>
      )}

      {/* Main Header Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1rem',
        }}
      >
        {/* Left: Bankroll & Goal Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: '10px',
              background: isTargetAchieved
                ? 'linear-gradient(135deg, #10b981 0%, #f59e0b 100%)'
                : 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isTargetAchieved
                ? '0 4px 14px rgba(16, 185, 129, 0.4)'
                : '0 4px 14px rgba(99, 102, 241, 0.4)',
            }}
          >
            {isTargetAchieved ? <Trophy size={22} color="#fff" /> : <Wallet size={22} color="#fff" />}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                Gambler's Bankroll & 10% Profit Target Engine
              </h3>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.5rem',
                  borderRadius: 6,
                  background: isTargetAchieved ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                  color: isTargetAchieved ? '#6ee7b7' : '#c7d2fe',
                  border: `1px solid ${isTargetAchieved ? 'rgba(16, 185, 129, 0.4)' : 'rgba(99, 102, 241, 0.4)'}`,
                  textTransform: 'uppercase',
                }}
              >
                {isTargetAchieved ? 'Goal Complete (+10%)' : 'Goal: +10% Profit'}
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
              Target: Reach +10% profit ({currencySymbol}{targetProfitAmount.toFixed(0)}) &bull; Min Bet: {currencySymbol}{bankroll.minBet} &bull; Disciplined Staking
            </p>
          </div>
        </div>

        {/* Right: Quick Settings Toggle & Reset */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => {
              if (isEditingCapital) {
                handleSaveInputs();
              } else {
                setInputCapital(bankroll.startingCapital.toString());
                setInputMinBet(bankroll.minBet.toString());
                setIsEditingCapital(true);
              }
            }}
            className="btn-secondary"
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
          >
            {isEditingCapital ? 'Save Capital & Bet' : 'Edit Capital / Bet'}
          </button>
          <button
            onClick={handleResetSession}
            className="btn-secondary"
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
            title="Reset bankroll tracking"
          >
            <RotateCcw size={13} style={{ marginRight: 4 }} />
            Reset
          </button>
        </div>
      </div>

      {/* Capital & Min Bet Edit Form (Toggleable) */}
      {isEditingCapital && (
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem',
            marginBottom: '1rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Your Capital / Amount Available ({currencySymbol}):
            </label>
            <input
              type="number"
              min="100"
              step="50"
              value={inputCapital}
              onChange={(e) => setInputCapital(e.target.value)}
              className="input-field font-mono"
              style={{ width: 150, padding: '0.4rem 0.6rem', fontSize: '0.9rem' }}
              placeholder="e.g. 1000"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Table Minimum Bet ({currencySymbol}):
            </label>
            <input
              type="number"
              min="1"
              step="5"
              value={inputMinBet}
              onChange={(e) => setInputMinBet(e.target.value)}
              className="input-field font-mono"
              style={{ width: 120, padding: '0.4rem 0.6rem', fontSize: '0.9rem' }}
              placeholder="e.g. 20"
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'flex-end' }}>
            <button
              onClick={handleSaveInputs}
              className="btn-primary"
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
            >
              Apply Settings
            </button>
            <button
              onClick={() => setIsEditingCapital(false)}
              className="btn-secondary"
              style={{ padding: '0.4rem 0.65rem', fontSize: '0.8rem' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Grid: 4 Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.85rem',
          marginBottom: '1rem',
        }}
      >
        {/* Card 1: Current Bankroll */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.75rem 1rem',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.2rem' }}>
            CURRENT BANKROLL
          </div>
          <div
            style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              color: isTargetAchieved ? '#10b981' : '#ffffff',
              fontFamily: 'monospace',
            }}
          >
            {currencySymbol}{bankroll.currentBalance.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
            Started: {currencySymbol}{bankroll.startingCapital.toFixed(2)}
          </div>
        </div>

        {/* Card 2: Profit / Loss */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: `1px solid ${profitAmount >= 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
            borderRadius: 'var(--radius-sm)',
            padding: '0.75rem 1rem',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.2rem' }}>
            NET PROFIT / LOSS
          </div>
          <div
            style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              color: profitAmount >= 0 ? '#10b981' : '#f43f5e',
              fontFamily: 'monospace',
            }}
          >
            {profitAmount >= 0 ? '+' : ''}{currencySymbol}{profitAmount.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.7rem', color: profitAmount >= 0 ? '#6ee7b7' : '#fca5a5', fontWeight: 700 }}>
            {profitAmount >= 0 ? '+' : ''}{profitPercent.toFixed(1)}% of Capital
          </div>
        </div>

        {/* Card 3: 10% Target Goal */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.75rem 1rem',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600, marginBottom: '0.2rem' }}>
            +10% TARGET GOAL
          </div>
          <div
            style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              color: '#fbbf24',
              fontFamily: 'monospace',
            }}
          >
            {currencySymbol}{targetBankroll.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            Target Profit: +{currencySymbol}{targetProfitAmount.toFixed(2)}
          </div>
        </div>

        {/* Card 4: Sureshot Hit Rate */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.75rem 1rem',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.2rem' }}>
            SESSION RECORD
          </div>
          <div
            style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              color: '#c7d2fe',
              fontFamily: 'monospace',
            }}
          >
            {bankroll.betsWon}W &bull; {bankroll.betsLost}L
          </div>
          <div style={{ fontSize: '0.7rem', color: '#a5b4fc', fontWeight: 700 }}>
            Win Rate: {sessionWinRate}% ({bankroll.totalBetsPlaced} bets)
          </div>
        </div>
      </div>

      {/* Progress Bar towards 10% Goal */}
      <div style={{ marginBottom: '1rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            marginBottom: '0.35rem',
          }}
        >
          <span>Progress toward +10% Profit Target</span>
          <span style={{ fontWeight: 800, color: isTargetAchieved ? '#10b981' : '#fbbf24' }}>
            {progressRatio.toFixed(0)}% ({currencySymbol}{Math.max(0, profitAmount).toFixed(0)} / {currencySymbol}{targetProfitAmount.toFixed(0)})
          </span>
        </div>
        <div
          style={{
            width: '100%',
            height: 10,
            background: 'rgba(15, 23, 42, 0.8)',
            borderRadius: 9999,
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div
            style={{
              width: `${progressRatio}%`,
              height: '100%',
              background: isTargetAchieved
                ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
                : 'linear-gradient(90deg, #4f46e5 0%, #06b6d4 50%, #f59e0b 100%)',
              borderRadius: 9999,
              transition: 'width 0.4s ease',
              boxShadow: isTargetAchieved ? '0 0 10px #10b981' : 'none',
            }}
          />
        </div>
      </div>

      {/* Action / Signal Strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
          background: sureshot.isTriggered
            ? 'rgba(245, 158, 11, 0.12)'
            : 'rgba(15, 23, 42, 0.5)',
          border: `1px solid ${sureshot.isTriggered ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255, 255, 255, 0.05)'}`,
          borderRadius: 'var(--radius-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {sureshot.isTriggered ? (
            <Zap size={20} color="#fbbf24" style={{ flexShrink: 0 }} />
          ) : sureshot.status === 'POST_LOSS_COOLDOWN' ? (
            <AlertTriangle size={20} color="#f43f5e" style={{ flexShrink: 0 }} />
          ) : (
            <Target size={20} color="#818cf8" style={{ flexShrink: 0 }} />
          )}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: sureshot.status === 'POST_LOSS_COOLDOWN' ? '#fca5a5' : '#fff' }}>
              {isTargetAchieved
                ? 'TARGET ACHIEVED (+10%): LOCK IN WINNINGS & EXIT'
                : sureshot.status === 'POST_LOSS_COOLDOWN'
                ? `🛑 ${sureshot.primaryDirective}`
                : sureshot.isTriggered
                ? `OPPORTUNITY DETECTED: BET ${sureshot.targetSelection} (${sureshot.confidence}%)`
                : 'HUNTING CONVERGENT OPPORTUNITY — WAIT FOR SURESHOT'}
            </div>
            <div style={{ fontSize: '0.7rem', color: sureshot.status === 'POST_LOSS_COOLDOWN' ? '#fecdd3' : 'var(--text-secondary)' }}>
              {isTargetAchieved
                ? 'You have secured the desired +10% profit. Do not gamble further.'
                : sureshot.status === 'POST_LOSS_COOLDOWN'
                ? 'Previous prediction missed. Wheel is currently defying standard statistical pull. Do not chase. Observing next moves to realign.'
                : sureshot.isTriggered
                ? `Recommended Wager: ${currencySymbol}${(bankroll.minBet * (sureshot.recommendedUnits || 1)).toFixed(0)} (${sureshot.recommendedUnits || 1} Unit) on ${sureshot.targetSelection}`
                : `Model is tracking wheel entropy. Bet size will be ${currencySymbol}${bankroll.minBet} when high-probability setup locks in.`}
            </div>
          </div>
        </div>

        {/* Quick Log Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => handleManualWin(bankroll.minBet)}
            className="btn-primary"
            style={{
              fontSize: '0.75rem',
              padding: '0.35rem 0.65rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderColor: '#10b981',
            }}
            title="Log a winning bet"
          >
            <Plus size={14} style={{ marginRight: 2 }} />
            Won +{currencySymbol}{bankroll.minBet}
          </button>
          <button
            onClick={() => handleManualLoss(bankroll.minBet)}
            className="btn-secondary"
            style={{
              fontSize: '0.75rem',
              padding: '0.35rem 0.65rem',
              borderColor: 'rgba(244, 63, 94, 0.4)',
              color: '#fecdd3',
            }}
            title="Log a losing bet"
          >
            <Minus size={14} style={{ marginRight: 2 }} />
            Lost -{currencySymbol}{bankroll.minBet}
          </button>
        </div>
      </div>

      {/* Gambler's Strategy & Backup Advisory */}
      <BettingStrategyGuide
        startingCapital={bankroll.startingCapital}
        minBet={bankroll.minBet}
        currentBalance={bankroll.currentBalance}
        currencySymbol={currencySymbol}
      />
    </div>
  );
};
