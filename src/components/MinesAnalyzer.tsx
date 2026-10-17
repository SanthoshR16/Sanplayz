import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Bomb,
  Sparkles,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  ClipboardCheck,
  ShieldCheck,
  Target,
} from 'lucide-react';
import type {
  MinesRoundRecord,
  ModelPrediction,
} from '../types/mines';
import {
  TOTAL_TILES,
} from '../math/minesProbability';
import {
  buildMultiplierSchedule,
  USER_3_BOMB_MULTIPLIERS,
} from '../math/minesMultiplier';
import {
  calculateChiSquareUniformity,
  calculateRunsTest,
  computeTileFrequencies,
} from '../math/minesAnalysis';
import { evaluateCoordinatePredictor } from '../math/minesModel';
import {
  loadBankrollState,
  saveBankrollState,
  setBankrollStartingBalance,
  createInitialBankrollState,
} from '../math/minesBankroll';
import { generateModelPrediction } from '../math/minesPredictor';
import {
  clearAllMinesRounds,
  deleteMinesRound,
  exportMinesCSV,
  exportMinesJSON,
  getMinesRounds,
  saveMinesRound,
} from '../db/minesStorage';

import { MinesGrid } from './MinesGrid';
import { MinesBankrollBar } from './MinesBankrollBar';
import { MinesHistory } from './MinesHistory';
import { MinesAdvancedStats } from './MinesAdvancedStats';
import {
  MinesHelpModal,
  MinesImportExportModal,
  MinesManualEntryModal,
} from './MinesModals';

export const MinesAnalyzer: React.FC = () => {
  // Model Configuration State
  const [bombCount, setBombCount] = useState<number>(3);
  const [pickCount, setPickCount] = useState<number>(3);
  const [customMultipliers, setCustomMultipliers] = useState<Record<number, number>>(USER_3_BOMB_MULTIPLIERS);

  // Model Prediction Output State (Model-driven, not playable game)
  const [currentPrediction, setCurrentPrediction] = useState<ModelPrediction | null>(() =>
    generateModelPrediction(3, 3, 10, [])
  );
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Interactive Actual Outcome Reporting State
  const [markedBombTiles, setMarkedBombTiles] = useState<number[]>([]);
  const [saveStatusMsg, setSaveStatusMsg] = useState<string>('');

  // Bankroll Simulator State
  const [bankrollState, setBankrollState] = useState(() => loadBankrollState());

  // Database Rounds State
  const [rounds, setRounds] = useState<MinesRoundRecord[]>([]);

  // Modals
  const [isManualEntryOpen, setIsManualEntryOpen] = useState<boolean>(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);

  // Load rounds from IndexedDB
  const refreshRounds = useCallback(async () => {
    try {
      const data = await getMinesRounds();
      setRounds(data);
    } catch (e) {
      console.error('Failed to load rounds from Dexie:', e);
    }
  }, []);

  useEffect(() => {
    refreshRounds();
  }, [refreshRounds]);

  // Persist bankroll state whenever changed
  useEffect(() => {
    saveBankrollState(bankrollState);
  }, [bankrollState]);

  // Compute Multiplier Steps for currently configured bombCount
  const multiplierSteps = useMemo(() => {
    return buildMultiplierSchedule(bombCount, bombCount === 3 ? customMultipliers : undefined);
  }, [bombCount, customMultipliers]);

  // Aggregated Statistical Computations
  const tileStats = useMemo(() => computeTileFrequencies(rounds), [rounds]);
  const chiSquareResult = useMemo(() => calculateChiSquareUniformity(tileStats), [tileStats]);
  const runsTestResult = useMemo(() => {
    const outcomes = rounds.map((r) => r.outcome);
    return calculateRunsTest(outcomes);
  }, [rounds]);
  const modelReport = useMemo(() => evaluateCoordinatePredictor(rounds), [rounds]);

  // Pipeline Execution: Generate Prediction
  const handleGenerateAnalysis = useCallback(() => {
    setIsGenerating(true);
    const stake = bankrollState.hypotheticalStake || 10;
    const prediction = generateModelPrediction(bombCount, pickCount, stake, rounds);
    setCurrentPrediction(prediction);
    setMarkedBombTiles([]);
    setSaveStatusMsg('');
    setIsGenerating(false);
  }, [bombCount, pickCount, bankrollState.hypotheticalStake, rounds]);

  // Toggle bomb coordinate report on grid click
  const handleToggleBombTile = (tileIndex: number) => {
    setMarkedBombTiles((prev) =>
      prev.includes(tileIndex) ? prev.filter((i) => i !== tileIndex) : [...prev, tileIndex]
    );
    setSaveStatusMsg('');
  };

  // Submit marked bombs directly to train model and save observation
  const handleSaveMarkedOutcome = async () => {
    if (markedBombTiles.length === 0) return;
    const stake = bankrollState.hypotheticalStake || 10;
    const suggested = currentPrediction?.suggestedTiles || [];
    const hitTiles = suggested.filter((t) => markedBombTiles.includes(t));
    const isLoss = hitTiles.length > 0;
    const safePicks = suggested.filter((t) => !markedBombTiles.includes(t));
    const mult = isLoss ? 0 : (currentPrediction?.grossMultiplier || 1);
    const gross = isLoss ? 0 : Number((stake * mult).toFixed(2));
    const net = isLoss ? -stake : Number((stake * (mult - 1)).toFixed(2));

    const newRound: Omit<MinesRoundRecord, 'id'> = {
      roundId: `obs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      bombCount: Math.max(bombCount, markedBombTiles.length),
      revealedSafeTiles: safePicks,
      revealedBombTiles: markedBombTiles,
      allBombLocations: markedBombTiles,
      outcome: isLoss ? 'loss' : 'cashout',
      picksCount: safePicks.length + (isLoss ? 1 : 0),
      multiplierReached: mult,
      stake,
      grossPayout: gross,
      netProfit: net,
      sourceType: 'manual',
      validationStatus: 'valid',
      notes: isLoss
        ? `Reported Bomb on Tile ${hitTiles.map((t) => t + 1).join(', ')} (Prediction Failed)`
        : `Reported Bombs at ${markedBombTiles.map((t) => t + 1).join(', ')} (Prediction Safe)`,
    };

    const res = await saveMinesRound(newRound);
    if (res.success) {
      const updatedRounds = await getMinesRounds();
      setRounds(updatedRounds);
      // Immediately recalibrate and re-generate prediction with new empirical data
      const nextPred = generateModelPrediction(bombCount, pickCount, stake, updatedRounds);
      setCurrentPrediction(nextPred);
      setMarkedBombTiles([]);
      setSaveStatusMsg(
        `Observation recorded! Tile ${markedBombTiles.map((t) => t + 1).join(', ')} saved as bomb. Model recalibrated to avoid high-risk bomb coordinates.`
      );
    }
  };

  // Export handlers
  const handleExportJSON = async () => {
    const jsonStr = await exportMinesJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mines_rounds_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = async () => {
    const csvStr = await exportMinesCSV();
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mines_rounds_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to delete all historical Mines rounds from database?')) {
      await clearAllMinesRounds();
      await refreshRounds();
      setSaveStatusMsg('Database history cleared. Model reset to theoretical baseline.');
    }
  };

  return (
    <div
      style={{
        maxWidth: 1300,
        margin: '0 auto',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        color: '#fff',
      }}
    >
      {/* App Header Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #e11d48 0%, #4f46e5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(225, 29, 72, 0.35)',
            }}
          >
            <Bomb size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                Mines 5×5 AI Prediction & Probability Engine
              </h1>
              <span
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '6px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                Model-Controlled Dashboard
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
              Combinatorial Conditional Odds, 97% RTP Schedule (Spribe / BetInExchange247), Honest Statistical Baselines
            </p>
          </div>
        </div>

        {/* Global Guide and Record Result Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setIsManualEntryOpen(true)}
            className="btn-primary"
            style={{
              fontSize: '0.8rem',
              padding: '0.4rem 0.75rem',
              background: '#4f46e5',
              borderColor: '#6366f1',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
            title="Record real observed round in full detail to evaluate prediction accuracy"
          >
            <ClipboardCheck size={14} />
            <span>Record Actual Outcome</span>
          </button>

          <button
            type="button"
            onClick={() => setIsHelpOpen(true)}
            className="btn-secondary"
            title="Read mathematical foundations & disclaimers"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
          >
            <HelpCircle size={14} />
            <span>Math & Rules Guide</span>
          </button>
        </div>
      </div>

      {/* 1. Paper-Trading Bankroll Bar */}
      <MinesBankrollBar
        bankrollState={bankrollState}
        onSetStartingBalance={(bal, targetPct) =>
          setBankrollState((prev) => setBankrollStartingBalance(prev, bal, targetPct))
        }
        onUpdateStake={(stake) =>
          setBankrollState((prev) => ({ ...prev, hypotheticalStake: stake }))
        }
        onResetBankroll={() => {
          if (window.confirm('Reset simulated bankroll balance?')) {
            setBankrollState(createInitialBankrollState());
          }
        }}
      />

      {/* Main Screen Center Stage: Grid + Model Prediction Dashboard */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.25rem',
          alignItems: 'start',
        }}
      >
        {/* Left Column: 5x5 Prediction Display Grid & Model Configuration */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid var(--border-card)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          {/* Model Configuration Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              maxWidth: 460,
              flexWrap: 'wrap',
              gap: '0.6rem',
            }}
          >
            {/* Bombs Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Bomb size={16} color="#fb7185" />
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Bombs:
              </span>
              <select
                aria-label="Bomb count selector"
                value={bombCount}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setBombCount(val);
                  if (pickCount > TOTAL_TILES - val) {
                    setPickCount(Math.max(1, TOTAL_TILES - val));
                  }
                }}
                style={{
                  padding: '0.3rem 0.5rem',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid var(--border-card)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#fb7185',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                }}
              >
                {Array.from({ length: 24 }, (_, i) => i + 1).map((b) => (
                  <option key={b} value={b}>
                    {b} bomb{b > 1 ? 's' : ''} ({TOTAL_TILES - b} safe)
                  </option>
                ))}
              </select>
            </div>

            {/* Target Picks Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Target size={16} color="#818cf8" />
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Picks:
              </span>
              <select
                aria-label="Picks count selector"
                value={pickCount}
                onChange={(e) => setPickCount(Number(e.target.value))}
                style={{
                  padding: '0.3rem 0.5rem',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid var(--border-card)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#818cf8',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                }}
              >
                {Array.from({ length: Math.min(10, TOTAL_TILES - bombCount) }, (_, i) => i + 1).map((p) => (
                  <option key={p} value={p}>
                    {p} pick{p > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Generate Analysis Button */}
            <button
              type="button"
              onClick={handleGenerateAnalysis}
              disabled={isGenerating}
              className="btn-primary"
              style={{
                padding: '0.4rem 0.9rem',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                borderColor: '#6366f1',
              }}
            >
              {currentPrediction ? (
                <>
                  <RefreshCw size={14} className={isGenerating ? 'spin' : ''} />
                  <span>GENERATE NEW ANALYSIS</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>GENERATE ANALYSIS</span>
                </>
              )}
            </button>
          </div>

          {/* 5x5 Model Output Grid with Click-to-Mark Bomb capability */}
          <MinesGrid
            suggestedTiles={currentPrediction ? currentPrediction.suggestedTiles : []}
            markedBombTiles={markedBombTiles}
            onTileClick={handleToggleBombTile}
          />

          {/* Grid Footer Coordinates & Mark Outcome Action Bar */}
          <div
            style={{
              width: '100%',
              maxWidth: 460,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                padding: '0 0.25rem',
              }}
            >
              <span>
                Suggested: {currentPrediction ? currentPrediction.suggestedTiles.length : 0} tile(s)
              </span>
              <span>
                Coordinates:{' '}
                {currentPrediction && currentPrediction.suggestedTiles.length > 0
                  ? currentPrediction.suggestedTiles.map((t) => t + 1).join(', ')
                  : 'None'}
              </span>
            </div>

            {/* Interactive Grid Bomb-Reporting Bar */}
            <div
              style={{
                background: 'rgba(30, 41, 59, 0.65)',
                border: '1px solid var(--border-card)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Click tiles above to report actual bomb locations:
                </span>
                {markedBombTiles.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setMarkedBombTiles([])}
                    className="btn-secondary"
                    style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                  >
                    Clear
                  </button>
                )}
              </div>

              {markedBombTiles.length > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.8rem', color: '#fb7185', fontWeight: 700 }}>
                    Marked Bomb: Tile {markedBombTiles.map((t) => t + 1).join(', ')}
                    {currentPrediction && currentPrediction.suggestedTiles.some((t) => markedBombTiles.includes(t)) && (
                      <span style={{ color: '#fca5a5', fontWeight: 600, marginLeft: '0.4rem' }}>
                        (Hit predicted coordinate)
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveMarkedOutcome}
                    className="btn-primary"
                    style={{
                      background: '#e11d48',
                      borderColor: '#f43f5e',
                      fontSize: '0.8rem',
                      padding: '0.35rem 0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <Bomb size={14} />
                    <span>Save Outcome & Train Model</span>
                  </button>
                </div>
              ) : (
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Tip: If tile 7 was a bomb in your round, click tile 7 on the board above and click "Save Outcome & Train Model" to recalibrate the model.
                </div>
              )}

              {saveStatusMsg && (
                <div
                  style={{
                    fontSize: '0.76rem',
                    color: '#34d399',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '0.4rem 0.6rem',
                    borderRadius: 4,
                  }}
                >
                  {saveStatusMsg}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Model Analysis & Scientific Honesty Panel */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid var(--border-card)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {/* Status Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
              Model Probability & Return Analysis
            </h2>
            <span
              style={{
                fontSize: '0.72rem',
                color: currentPrediction?.signalType === 'experimental_signal' ? '#38bdf8' : '#34d399',
                background: currentPrediction?.signalType === 'experimental_signal' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                border: `1px solid ${currentPrediction?.signalType === 'experimental_signal' ? 'rgba(56, 189, 248, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              Signal: {currentPrediction?.signalType?.replace('_', ' ') || 'Theoretical Baseline'}
            </span>
          </div>

          {/* Probability Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.75rem',
            }}
          >
            {/* Survival Probability */}
            <div
              style={{
                background: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid var(--border-card)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem',
              }}
            >
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Survival Probability P(S_k)
              </span>
              <div
                style={{
                  fontSize: '1.45rem',
                  fontWeight: 800,
                  color: '#34d399',
                  fontFamily: 'var(--font-mono)',
                  marginTop: '0.2rem',
                }}
              >
                {currentPrediction
                  ? `${(currentPrediction.theoreticalSafeProb * 100).toFixed(2)}%`
                  : '—'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Target: {pickCount} safe pick(s) ({bombCount} bombs)
              </div>
            </div>

            {/* Target Multiplier */}
            <div
              style={{
                background: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid var(--border-card)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem',
              }}
            >
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Gross Multiplier
              </span>
              <div
                style={{
                  fontSize: '1.45rem',
                  fontWeight: 800,
                  color: '#818cf8',
                  fontFamily: 'var(--font-mono)',
                  marginTop: '0.2rem',
                }}
              >
                {currentPrediction ? `${currentPrediction.grossMultiplier.toFixed(2)}x` : '—'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                97% RTP schedule payout
              </div>
            </div>

            {/* Potential Payout */}
            <div
              style={{
                background: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid var(--border-card)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem',
              }}
            >
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Potential Gross Payout
              </span>
              <div
                style={{
                  fontSize: '1.45rem',
                  fontWeight: 800,
                  color: '#fff',
                  fontFamily: 'var(--font-mono)',
                  marginTop: '0.2rem',
                }}
              >
                {currentPrediction
                  ? `$${currentPrediction.potentialGrossPayout.toFixed(2)}`
                  : '—'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Stake ${(bankrollState.hypotheticalStake || 10).toFixed(2)}
              </div>
            </div>

            {/* Potential Net Profit */}
            <div
              style={{
                background: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid var(--border-card)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem',
              }}
            >
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Potential Net Profit
              </span>
              <div
                style={{
                  fontSize: '1.45rem',
                  fontWeight: 800,
                  color:
                    currentPrediction && currentPrediction.potentialNetProfit >= 0
                      ? '#34d399'
                      : '#fb7185',
                  fontFamily: 'var(--font-mono)',
                  marginTop: '0.2rem',
                }}
              >
                {currentPrediction
                  ? `${currentPrediction.potentialNetProfit >= 0 ? '+' : ''}$${currentPrediction.potentialNetProfit.toFixed(2)}`
                  : '—'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Net after deduction of stake
              </div>
            </div>
          </div>

          {/* Model Explanation Box */}
          <div
            style={{
              background: 'rgba(30, 41, 59, 0.4)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#c7d2fe', fontWeight: 600 }}>
              <ShieldCheck size={16} color="#818cf8" />
              <span>Model Prediction Explanation</span>
            </div>
            <p style={{ margin: 0 }}>
              {currentPrediction?.explanation}
            </p>
          </div>

          {/* Transparent Mathematical Honesty Explanation Box */}
          <div
            style={{
              background: 'rgba(225, 29, 72, 0.08)',
              border: '1px solid rgba(225, 29, 72, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fb7185', fontWeight: 600 }}>
              <AlertCircle size={15} color="#fb7185" />
              <span>Predictive Reality & Scientific Honesty Guarantee</span>
            </div>
            <p style={{ margin: 0, color: '#fca5a5' }}>
              <strong>Important:</strong> Under uniform random bomb placement, no unopened coordinate is inherently safer
              than any other coordinate. Highlighted tiles are <strong>unranked illustrative selections</strong> produced
              by the model under the theoretical baseline, not guaranteed-safe tiles. The user cannot click tiles to play a game;
              enter actual outcomes after real rounds have finished to evaluate model calibration.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Optional Expandable Advanced Statistical Section */}
      <MinesAdvancedStats
        tileStats={tileStats}
        chiSquareResult={chiSquareResult}
        runsTestResult={runsTestResult}
        multiplierSteps={multiplierSteps}
        modelReport={modelReport}
        onUpdateMultiplier={(hit, mult) => {
          setCustomMultipliers((prev) => ({ ...prev, [hit]: mult }));
        }}
        onResetMultipliers={() => setCustomMultipliers(USER_3_BOMB_MULTIPLIERS)}
        bombCount={bombCount}
      />

      {/* 3. History of Previous Observed Rounds */}
      <MinesHistory
        rounds={rounds}
        onDeleteRound={async (id) => {
          await deleteMinesRound(id);
          await refreshRounds();
        }}
        onClearHistory={handleClearHistory}
        onOpenManualEntry={() => setIsManualEntryOpen(true)}
        onOpenImport={() => setIsImportExportOpen(true)}
        onExportJSON={handleExportJSON}
        onExportCSV={handleExportCSV}
      />

      {/* Modals */}
      <MinesManualEntryModal
        isOpen={isManualEntryOpen}
        onClose={() => setIsManualEntryOpen(false)}
        onSaved={refreshRounds}
        defaultBombCount={bombCount}
        currentPrediction={currentPrediction}
      />

      <MinesImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        onImportComplete={refreshRounds}
      />

      <MinesHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
};
