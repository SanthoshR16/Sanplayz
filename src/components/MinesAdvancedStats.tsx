import React, { useState } from 'react';
import {
  BarChart2,
  Sliders,
  ShieldCheck,
  Cpu,
  BookOpen,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import type {
  ChiSquareUniformityResult,
  ModelEvaluationReport,
  MultiplierStep,
  RunsTestResult,
  TileFrequencyStat,
} from '../types/mines';
import { PROVENANCE_SOURCES } from '../math/minesProvenance';
import { verifyProvablyFairRound } from '../math/minesAnalysis';

interface MinesAdvancedStatsProps {
  tileStats: TileFrequencyStat[];
  chiSquareResult: ChiSquareUniformityResult;
  runsTestResult: RunsTestResult;
  multiplierSteps: MultiplierStep[];
  modelReport: ModelEvaluationReport;
  onUpdateMultiplier?: (hitNumber: number, newMultiplier: number) => void;
  onResetMultipliers?: () => void;
  bombCount: number;
}

export const MinesAdvancedStats: React.FC<MinesAdvancedStatsProps> = ({
  tileStats,
  chiSquareResult,
  runsTestResult,
  multiplierSteps,
  modelReport,
  onUpdateMultiplier,
  onResetMultipliers,
  bombCount,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'uniformity' | 'multipliers' | 'provablyFair' | 'model' | 'provenance'>(
    'uniformity'
  );

  // Provably Fair Verifier Form State
  const [pfServerSeed, setPfServerSeed] = useState<string>('');
  const [pfSeedHash, setPfSeedHash] = useState<string>('');
  const [pfClientSeed, setPfClientSeed] = useState<string>('antigravity_player');
  const [pfNonce, setPfNonce] = useState<number>(1);
  const [pfRecordedBombs, setPfRecordedBombs] = useState<string>('3, 11, 24');
  const [pfVerificationResult, setPfVerificationResult] = useState<any>(null);

  const handleVerifyPF = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pfServerSeed.trim()) return;
    const bombArr = pfRecordedBombs
      .split(/[,;\s]+/)
      .map((s) => Number(s.trim()) - 1) // convert 1-based to 0-based
      .filter((n) => !isNaN(n) && n >= 0 && n < 25);

    const result = verifyProvablyFairRound(
      pfServerSeed.trim(),
      pfSeedHash.trim(),
      pfClientSeed.trim(),
      pfNonce,
      bombArr,
      bombCount
    );
    setPfVerificationResult(result);
  };

  return (
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.75)',
        border: '1px solid var(--border-card)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        width: '100%',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      {/* Accordion Toggle Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          padding: '0.9rem 1.25rem',
          background: 'none',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          color: '#fff',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <BarChart2 size={18} color="#818cf8" />
          <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>
            Advanced Statistical Assessment & Mathematical Verification
          </span>
          <span
            style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              background: 'rgba(255, 255, 255, 0.06)',
              padding: '0.15rem 0.5rem',
              borderRadius: '6px',
            }}
          >
            Optional Deep Analysis
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
          <span style={{ fontSize: '0.78rem' }}>{isExpanded ? 'Hide' : 'Expand'}</span>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Expandable Content Area */}
      {isExpanded && (
        <div
          style={{
            borderTop: '1px solid var(--border-subtle)',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          {/* Sub-Tabs */}
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '0.75rem',
              flexWrap: 'wrap',
            }}
          >
            {[
              { id: 'uniformity', label: 'Tile Distribution & Runs', icon: BarChart2 },
              { id: 'multipliers', label: 'Multiplier Schedule & House Edge', icon: Sliders },
              { id: 'provablyFair', label: 'Provably Fair Verifier', icon: ShieldCheck },
              { id: 'model', label: 'Model Evaluation (Brier Score)', icon: Cpu },
              { id: 'provenance', label: 'Open-Source Provenance & Rules', icon: BookOpen },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.4rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid',
                    borderColor: isActive ? 'var(--accent-indigo)' : 'transparent',
                    background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                    color: isActive ? '#fff' : 'var(--text-secondary)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Icon size={14} color={isActive ? '#818cf8' : 'currentColor'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: Uniformity & Runs Test */}
          {activeTab === 'uniformity' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>
                  Pearson's Chi-Square Goodness-of-Fit Test (df = 24)
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Evaluates whether observed bomb occurrences across the 25 tiles deviate from a uniform random
                  distribution ($p_i = 1/25$).
                </p>
              </div>

              {/* Chi-Square & Runs Summary Badges */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '1rem',
                }}
              >
                <div
                  style={{
                    background: 'rgba(30, 41, 59, 0.5)',
                    border: '1px solid var(--border-card)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Chi-Square Uniformity Test
                  </span>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginTop: '0.2rem' }}>
                    χ² = {chiSquareResult.chiSquareStatistic.toFixed(2)}{' '}
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      (critical α=0.05: {chiSquareResult.criticalValue05})
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                    p-value: <strong>{chiSquareResult.pValue.toFixed(3)}</strong> | Expected / tile:{' '}
                    <strong>{chiSquareResult.expectedFrequencyPerTile}</strong>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#c7d2fe', marginTop: '0.4rem', lineHeight: 1.4 }}>
                    {chiSquareResult.explanation}
                  </p>
                </div>

                <div
                  style={{
                    background: 'rgba(30, 41, 59, 0.5)',
                    border: '1px solid var(--border-card)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Wald-Wolfowitz Runs Test
                  </span>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginTop: '0.2rem' }}>
                    Runs = {runsTestResult.runsCount}{' '}
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      (Z = {runsTestResult.zScore.toFixed(2)})
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                    p-value: <strong>{runsTestResult.pValue.toFixed(3)}</strong> | Wins: {runsTestResult.winsCount} /
                    Losses: {runsTestResult.lossesCount}
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#c7d2fe', marginTop: '0.4rem', lineHeight: 1.4 }}>
                    {runsTestResult.explanation}
                  </p>
                </div>
              </div>

              {/* 25-Tile Frequency Grid Heatmap */}
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Tile Bomb Frequency Heatmap (Tiles 1 to 25)
                </h4>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: '0.45rem',
                    maxWidth: 420,
                  }}
                >
                  {tileStats.map((stat) => {
                    const maxBombCount = Math.max(1, ...tileStats.map((s) => s.bombCount));
                    const intensity = stat.bombCount / maxBombCount;
                    return (
                      <div
                        key={stat.tileIndex}
                        style={{
                          background: `rgba(225, 29, 72, ${0.08 + intensity * 0.4})`,
                          border: '1px solid rgba(225, 29, 72, 0.25)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.4rem',
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          #{stat.tileLabel}
                        </div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
                          {stat.bombCount} 💣
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                          {stat.totalExposures > 0 ? `${(stat.bombRate * 100).toFixed(0)}%` : '0%'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Multipliers & House Edge */}
          {activeTab === 'multipliers' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                    Multiplier Schedule & Implied House Edge
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Configured for {bombCount} bomb(s). Reference user table matches 97% RTP (3.00% house edge).
                  </p>
                </div>
                {onResetMultipliers && (
                  <button
                    type="button"
                    onClick={onResetMultipliers}
                    className="btn-secondary"
                    style={{ fontSize: '0.78rem', padding: '0.3rem 0.6rem' }}
                  >
                    Reset to Default 97% RTP
                  </button>
                )}
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.45rem 0.6rem' }}>Hit #</th>
                      <th style={{ padding: '0.45rem 0.6rem' }}>Configured Multiplier</th>
                      <th style={{ padding: '0.45rem 0.6rem' }}>Survival Prob P(S_k)</th>
                      <th style={{ padding: '0.45rem 0.6rem' }}>Theoretical Fair (1/P)</th>
                      <th style={{ padding: '0.45rem 0.6rem' }}>Implied RTP</th>
                      <th style={{ padding: '0.45rem 0.6rem' }}>House Edge</th>
                    </tr>
                  </thead>
                  <tbody>
                    {multiplierSteps.map((step) => {
                      const isUnusualEdge = step.impliedHouseEdge < 0 || step.impliedHouseEdge > 0.15;
                      return (
                        <tr
                          key={step.hitNumber}
                          style={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                            background: isUnusualEdge ? 'rgba(245, 158, 11, 0.08)' : 'transparent',
                          }}
                        >
                          <td style={{ padding: '0.45rem 0.6rem', fontWeight: 600, color: '#fff' }}>
                            Pick #{step.hitNumber}
                          </td>
                          <td style={{ padding: '0.45rem 0.6rem', fontFamily: 'var(--font-mono)' }}>
                            {onUpdateMultiplier ? (
                              <input
                                type="number"
                                step="any"
                                min="1.01"
                                value={step.multiplier}
                                onChange={(e) => {
                                  const v = parseFloat(e.target.value);
                                  if (!isNaN(v) && v > 0) onUpdateMultiplier(step.hitNumber, v);
                                }}
                                style={{
                                  width: 80,
                                  padding: '0.2rem 0.4rem',
                                  background: 'rgba(30, 41, 59, 0.8)',
                                  border: '1px solid var(--border-card)',
                                  borderRadius: '4px',
                                  color: '#34d399',
                                  fontWeight: 700,
                                  fontFamily: 'var(--font-mono)',
                                }}
                              />
                            ) : (
                              `${step.multiplier.toFixed(2)}x`
                            )}
                          </td>
                          <td style={{ padding: '0.45rem 0.6rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                            {(step.survivalProb * 100).toFixed(2)}%
                          </td>
                          <td style={{ padding: '0.45rem 0.6rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                            {step.fairMultiplier.toFixed(2)}x
                          </td>
                          <td style={{ padding: '0.45rem 0.6rem', fontFamily: 'var(--font-mono)', color: '#a5b4fc' }}>
                            {(step.impliedRtp * 100).toFixed(2)}%
                          </td>
                          <td
                            style={{
                              padding: '0.45rem 0.6rem',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 700,
                              color: step.impliedHouseEdge < 0 ? '#fb7185' : '#f59e0b',
                            }}
                          >
                            {(step.impliedHouseEdge * 100).toFixed(2)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Provably Fair Verifier */}
          {activeTab === 'provablyFair' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>
                  Cryptographic Provably Fair Verifier (HMAC-SHA256)
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Independently verifies that the casino determined bomb placements before the round started using the
                  standard HMAC-SHA256 Fisher-Yates shuffle algorithm.
                </p>
              </div>

              <form onSubmit={handleVerifyPF} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                      Unhashed Server Seed (revealed by casino after round)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 5d41402abc4b2a76b9719d911017c592..."
                      value={pfServerSeed}
                      onChange={(e) => setPfServerSeed(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.45rem 0.65rem',
                        background: 'rgba(30, 41, 59, 0.8)',
                        border: '1px solid var(--border-card)',
                        borderRadius: 'var(--radius-sm)',
                        color: '#fff',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.8rem',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                      Committed Server Seed Hash (SHA-256 given before bet)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. b2c3d4e5f6..."
                      value={pfSeedHash}
                      onChange={(e) => setPfSeedHash(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.45rem 0.65rem',
                        background: 'rgba(30, 41, 59, 0.8)',
                        border: '1px solid var(--border-card)',
                        borderRadius: 'var(--radius-sm)',
                        color: '#fff',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.8rem',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                      Client Seed (player-chosen string)
                    </label>
                    <input
                      type="text"
                      value={pfClientSeed}
                      onChange={(e) => setPfClientSeed(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.45rem 0.65rem',
                        background: 'rgba(30, 41, 59, 0.8)',
                        border: '1px solid var(--border-card)',
                        borderRadius: 'var(--radius-sm)',
                        color: '#fff',
                        fontSize: '0.8rem',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                      Nonce (Bet Counter)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={pfNonce}
                      onChange={(e) => setPfNonce(Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '0.45rem 0.65rem',
                        background: 'rgba(30, 41, 59, 0.8)',
                        border: '1px solid var(--border-card)',
                        borderRadius: 'var(--radius-sm)',
                        color: '#fff',
                        fontSize: '0.8rem',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                      Recorded Bomb Tiles (1–25, comma-separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 4, 12, 19"
                      value={pfRecordedBombs}
                      onChange={(e) => setPfRecordedBombs(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.45rem 0.65rem',
                        background: 'rgba(30, 41, 59, 0.8)',
                        border: '1px solid var(--border-card)',
                        borderRadius: 'var(--radius-sm)',
                        color: '#fff',
                        fontSize: '0.8rem',
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{ alignSelf: 'flex-start', padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                >
                  Verify Deterministic Fairness
                </button>
              </form>

              {/* Verification Output */}
              {pfVerificationResult && (
                <div
                  style={{
                    background: 'rgba(30, 41, 59, 0.6)',
                    border: '1px solid var(--border-card)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.9rem',
                    fontSize: '0.82rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {pfVerificationResult.isValidCommitment ? (
                      <span style={{ color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle size={15} /> Commitment Valid: Server Seed matches pre-bet Hash
                      </span>
                    ) : (
                      <span style={{ color: '#fb7185', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <AlertCircle size={15} /> Commitment Mismatch: Computed SHA-256 differs from expected hash
                      </span>
                    )}
                  </div>

                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Computed Hash: {pfVerificationResult.computedHash}
                  </div>

                  <div>
                    Generated Bomb Coordinates (1-based):{' '}
                    <strong style={{ color: '#f43f5e', fontFamily: 'var(--font-mono)' }}>
                      {pfVerificationResult.generatedBombs.map((b: number) => b + 1).join(', ')}
                    </strong>
                  </div>

                  <div>
                    Outcome Consistency:{' '}
                    {pfVerificationResult.matchesRecordedOutcome ? (
                      <span style={{ color: '#34d399', fontWeight: 600 }}>
                        Matches recorded bombs perfectly. Provably Fair verified.
                      </span>
                    ) : (
                      <span style={{ color: '#f59e0b', fontWeight: 600 }}>
                        Generated positions differ from user-entered coordinates. Check seeds, nonce, or recorded bombs.
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Model Evaluation (Brier Score) */}
          {activeTab === 'model' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>
                  Model Training & Out-of-Sample Calibration Report
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Evaluates whether empirical coordinate tracking ("hot/cold" spatial pattern matching) outperforms the
                  theoretical uniform baseline on unseen test data using proper scoring rules.
                </p>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '1rem',
                }}
              >
                <div
                  style={{
                    background: 'rgba(30, 41, 59, 0.5)',
                    border: '1px solid var(--border-card)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Theoretical Uniform Baseline
                  </span>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#34d399', marginTop: '0.2rem' }}>
                    Brier: {modelReport.baselineBrierScore}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                    Log Loss: <strong>{modelReport.baselineLogLoss}</strong>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                    Predicts P(safe) = (25 - B - k) / (25 - k) across all unopened tiles uniformly.
                  </p>
                </div>

                <div
                  style={{
                    background: 'rgba(30, 41, 59, 0.5)',
                    border: '1px solid var(--border-card)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Empirical Spatial Model (Hot/Cold)
                  </span>
                  <div
                    style={{
                      fontSize: '1.15rem',
                      fontWeight: 700,
                      color: modelReport.isBetterThanBaseline ? '#34d399' : '#fb7185',
                      marginTop: '0.2rem',
                    }}
                  >
                    Brier: {modelReport.modelBrierScore}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                    Log Loss: <strong>{modelReport.modelLogLoss}</strong>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                    Estimates tile probabilities from historical spatial frequencies.
                  </p>
                </div>
              </div>

              {/* Conclusion Banner */}
              <div
                style={{
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem',
                  fontSize: '0.82rem',
                  color: '#c7d2fe',
                  lineHeight: 1.5,
                }}
              >
                <strong>Scientific Finding: </strong> {modelReport.conclusion}
                <ul style={{ marginTop: '0.4rem', paddingLeft: '1.2rem', fontSize: '0.78rem' }}>
                  {modelReport.notes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* TAB 5: Provenance & Public Sources */}
          {activeTab === 'provenance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>
                  Verified Open-Source & Regulatory Provenance Registry
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Every reference source, certified ruleset, and verification algorithm used in this software:
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {PROVENANCE_SOURCES.map((src, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'rgba(30, 41, 59, 0.45)',
                      border: '1px solid var(--border-card)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem 1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem',
                      fontSize: '0.8rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                      <strong style={{ color: '#fff', fontSize: '0.88rem' }}>{src.title}</strong>
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          color: '#818cf8',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                          textDecoration: 'none',
                          fontSize: '0.75rem',
                        }}
                      >
                        {src.url} <ExternalLink size={11} />
                      </a>
                    </div>

                    <div style={{ color: 'var(--text-secondary)' }}>
                      <strong>Entity:</strong> {src.organization} | <strong>License/Terms:</strong> {src.licenseOrTerms}
                    </div>

                    <div style={{ color: 'var(--text-secondary)' }}>
                      <strong>Data Type:</strong> {src.dataType} | <strong>Collection:</strong> {src.collectionMethod}
                    </div>

                    <div style={{ color: '#fda4af' }}>
                      <strong>Limitations:</strong> {src.limitations}
                    </div>

                    <div style={{ color: '#a7f3d0' }}>
                      <strong>Implementation:</strong> {src.verifiedApplication}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
