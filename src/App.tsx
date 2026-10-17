import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Header } from './components/Header';
import { SlidingHistory } from './components/SlidingHistory';
import { ResultEntry } from './components/ResultEntry';
import { SessionProgress } from './components/SessionProgress';
import { SmartBetSignal } from './components/SmartBetSignal';
import { BankrollTargetBar, type BetOutcomeEvent } from './components/BankrollTargetBar';
import { SimpleSummaryBar } from './components/SimpleSummaryBar';
import { StatisticalAssessment } from './components/StatisticalAssessment';
import { RollingStatsPanel } from './components/RollingStatsPanel';
import { StreaksAndTransitions } from './components/StreaksAndTransitions';
import { BayesianPanel } from './components/BayesianPanel';
import { RandomnessPanel } from './components/RandomnessPanel';
import { HouseEdgeCalculator } from './components/HouseEdgeCalculator';
import { AdaptiveEvaluationPanel } from './components/AdaptiveEvaluationPanel';
import { HistoryTable } from './components/HistoryTable';
import {
  SettingsModal,
  MappingModal,
  ExportImportModal,
  ClearConfirmModal,
  EditResultModal,
  HelpModal,
} from './components/Modals';

import {
  addRouletteResult,
  clearAllDatabaseData,
  deleteResultById,
  ensureActiveSession,
  exportDatabaseJSON,
  exportResultsCSV,
  getAllHistoricalResults,
  getSessionPredictions,
  getSessionResults,
  importDatabaseJSON,
  loadSettings,
  saveSettings,
  startNewTableSession,
  undoLastResult,
  updateResult,
} from './db/storage';
import { classifyNumber } from './math/mapping';
import { computeAllRollingWindows, computeRollingStats } from './math/rolling';
import { calculateStreaks } from './math/streaks';
import { calculateTransitions } from './math/transitions';
import { calculateBayesianEstimate } from './math/bayesian';
import { calculateChiSquareTest, calculateRunsTest } from './math/randomness';
import { evaluatePredictions } from './math/adaptive';
import { generateRecommendations } from './math/recommendations';
import { calculateDynamicWager, loadBankrollFromStorage } from './math/bankrollStorage';
import { BarChart3, ChevronDown, ChevronUp, Cpu, History, Sparkles, Zap } from 'lucide-react';
import { MinesAnalyzer } from './components/MinesAnalyzer';
import type { PredictionRecord, RouletteResult, Session, UserSettings } from './types/roulette';

interface AppProps {
  defaultMode?: 'mines' | 'roulette';
}

export function App({ defaultMode = 'mines' }: AppProps = {}) {
  const [appMode, setAppMode] = useState<'mines' | 'roulette'>(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#roulette') {
      return 'roulette';
    }
    return defaultMode;
  });
  const [results, setResults] = useState<RouletteResult[]>([]);
  const [allHistoricalResults, setAllHistoricalResults] = useState<RouletteResult[]>([]);
  const [predictions, setPredictions] = useState<PredictionRecord[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [settings, setSettings] = useState<UserSettings>(loadSettings);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAdvancedMath, setShowAdvancedMath] = useState<boolean>(false);
  const [dismissedOfflineBanner, setDismissedOfflineBanner] = useState<boolean>(false);
  const [mobileTab, setMobileTab] = useState<'sureshot' | 'history' | 'analytics'>('sureshot');
  const [lastBetOutcome, setLastBetOutcome] = useState<BetOutcomeEvent | null>(null);
  const [awaitingBestGap, setAwaitingBestGap] = useState<boolean>(false);
  const outcomeCounterRef = useRef<number>(1);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isMappingOpen, setIsMappingOpen] = useState<boolean>(false);
  const [isExportImportOpen, setIsExportImportOpen] = useState<boolean>(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [editingResult, setEditingResult] = useState<RouletteResult | null>(null);

  // Load session and data from IndexedDB
  const refreshData = useCallback(async () => {
    try {
      const activeSession = await ensureActiveSession();
      setSession(activeSession);
      const [res, preds, allRes] = await Promise.all([
        getSessionResults(activeSession.id),
        getSessionPredictions(activeSession.id),
        getAllHistoricalResults(),
      ]);
      setResults(res);
      setPredictions(preds);
      setAllHistoricalResults(allRes);
    } catch (err) {
      console.error('Failed to load session data from IndexedDB:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const activeSession = await ensureActiveSession();
        if (!isMounted) return;
        setSession(activeSession);
        const [res, preds, allRes] = await Promise.all([
          getSessionResults(activeSession.id),
          getSessionPredictions(activeSession.id),
          getAllHistoricalResults(),
        ]);
        if (!isMounted) return;
        setResults(res);
        setPredictions(preds);
        setAllHistoricalResults(allRes);
      } catch (err) {
        console.error('Initial load failed:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Settings updates
  const handleSaveSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleToggleSlidingOrder = () => {
    const nextOrder = settings.slidingOrder === 'newest-right' ? 'newest-left' : 'newest-right';
    handleSaveSettings({ ...settings, slidingOrder: nextOrder });
  };

  // Add Result
  const handleAddResult = async (num: number, note?: string) => {
    // If sureshot was triggered prior to this spin, automatically evaluate outcome
    if (recommendations.sureshot.isTriggered) {
      const target = recommendations.sureshot.targetSelection;
      const c = classifyNumber(num);
      let won = false;
      if (num !== 0) {
        if (target === 'RED' && c.color === 'red') won = true;
        else if (target === 'BLACK' && c.color === 'black') won = true;
        else if (target === 'ODD' && c.parity === 'odd') won = true;
        else if (target === 'EVEN' && c.parity === 'even') won = true;
        else if (target === '1-18 (LOW)' && c.half === 'low') won = true;
        else if (target === '19-36 (HIGH)' && c.half === 'high') won = true;
      }
      const currentBankroll = loadBankrollFromStorage();
      const dynamicWager = calculateDynamicWager(currentBankroll, recommendations.sureshot.confidence, true);

      setLastBetOutcome({
        id: outcomeCounterRef.current++,
        won,
        selection: target,
        numberLanded: num,
        amount: dynamicWager.amount,
      });

      // When a bet misses: Strictly require the next BEST GAP before issuing another Sureshot
      if (!won) {
        setAwaitingBestGap(true);
      } else {
        setAwaitingBestGap(false);
      }
    }

    const activeSession = session ?? (await ensureActiveSession());
    setSession(activeSession);
    await addRouletteResult(num, activeSession.id, note);
    await refreshData();
  };

  // Undo Last Result
  const handleUndoLastResult = async () => {
    const activeSession = session ?? (await ensureActiveSession());
    setSession(activeSession);
    await undoLastResult(activeSession.id);
    await refreshData();
  };

  // Edit Result
  const handleSaveCorrection = async (id: number, newNumber: number, note?: string) => {
    await updateResult(id, newNumber, note);
    await refreshData();
  };

  // Delete Result
  const handleDeleteResult = async (id: number) => {
    await deleteResultById(id);
    await refreshData();
  };

  // Clear all data
  const handleConfirmClear = async () => {
    await clearAllDatabaseData();
    await refreshData();
  };

  // Clear active table numbers / start new table session
  // CRITICAL REQUIREMENT: Previous table data is permanently preserved in IndexedDB
  // so the adaptive model continually learns and gets smarter from every single entered spin.
  const handleClearActiveResults = async () => {
    setAwaitingBestGap(false);
    await startNewTableSession();
    await refreshData();
  };

  // Export JSON
  const handleExportJSON = async () => {
    const jsonStr = await exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roulette-adaptive-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export CSV
  const handleExportCSV = async () => {
    const csvStr = await exportResultsCSV(session?.id);
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roulette-results-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON
  const handleImportJSON = async (jsonStr: string) => {
    const res = await importDatabaseJSON(jsonStr);
    await refreshData();
    return res;
  };

  // Mathematical computations
  const totalResults = results.length;
  const minWindow = settings.minObservationWindow;

  const allRollingWindows = useMemo(() => computeAllRollingWindows(results), [results]);

  const latestRollingStats = useMemo(() => {
    if (totalResults < minWindow) return null;
    return computeRollingStats(results, minWindow, `Latest ${minWindow}`);
  }, [results, minWindow, totalResults]);

  const streaks = useMemo(() => calculateStreaks(results), [results]);
  const transitions = useMemo(() => calculateTransitions(results), [results]);

  // Aggregate counts for all results
  const counts = useMemo(() => {
    let redCount = 0;
    let blackCount = 0;
    let greenCount = 0;
    let oddCount = 0;
    let evenCount = 0;
    let zeroCount = 0;
    let lowCount = 0;
    let highCount = 0;
    for (const r of results) {
      if (r.color === 'red') redCount++;
      else if (r.color === 'black') blackCount++;
      else if (r.color === 'green' || r.number === 0) greenCount++;

      if (r.parity === 'odd') oddCount++;
      else if (r.parity === 'even') evenCount++;
      else if (r.parity === 'none' || r.number === 0) zeroCount++;

      if (r.number >= 1 && r.number <= 18) lowCount++;
      else if (r.number >= 19 && r.number <= 36) highCount++;
    }
    return { redCount, blackCount, greenCount, oddCount, evenCount, zeroCount, lowCount, highCount };
  }, [results]);

  const redBayes = useMemo(() => {
    return calculateBayesianEstimate(
      'Red',
      counts.redCount,
      counts.blackCount,
      settings.bayesianPriorAlpha,
      settings.bayesianPriorBeta
    );
  }, [counts.redCount, counts.blackCount, settings.bayesianPriorAlpha, settings.bayesianPriorBeta]);

  const oddBayes = useMemo(() => {
    return calculateBayesianEstimate(
      'Odd',
      counts.oddCount,
      counts.evenCount,
      settings.bayesianPriorAlpha,
      settings.bayesianPriorBeta
    );
  }, [counts.oddCount, counts.evenCount, settings.bayesianPriorAlpha, settings.bayesianPriorBeta]);

  const chiColor = useMemo(() => {
    return calculateChiSquareTest(
      'Color Goodness of Fit',
      { red: counts.redCount, black: counts.blackCount },
      { red: 0.5, black: 0.5 }
    );
  }, [counts.redCount, counts.blackCount]);

  const runsColor = useMemo(() => {
    return calculateRunsTest('Color Randomness', results.map((r) => r.color));
  }, [results]);

  const runsParity = useMemo(() => {
    return calculateRunsTest('Parity Randomness', results.map((r) => r.parity));
  }, [results]);

  const adaptiveEvaluation = useMemo(() => {
    return evaluatePredictions(predictions, results);
  }, [predictions, results]);

  const recommendations = useMemo(() => {
    return generateRecommendations(results, allHistoricalResults, awaitingBestGap);
  }, [results, allHistoricalResults, awaitingBestGap]);

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-main)',
        color: 'var(--text-main)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Initializing Adaptive Statistical Engine...
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Loading IndexedDB schemas and verification tables
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Global Application Switcher Navigation Bar */}
      <nav
        aria-label="Application Selector"
        style={{
          background: 'rgba(6, 8, 14, 0.95)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0.45rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          position: 'sticky',
          top: 0,
          zIndex: 200,
          backdropFilter: 'blur(12px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            type="button"
            onClick={() => setAppMode('mines')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              background:
                appMode === 'mines'
                  ? 'linear-gradient(135deg, #e11d48 0%, #4f46e5 100%)'
                  : 'rgba(255, 255, 255, 0.05)',
              border: appMode === 'mines' ? '1px solid #e11d48' : '1px solid var(--border-subtle)',
              color: '#fff',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: appMode === 'mines' ? '0 2px 10px rgba(225, 29, 72, 0.35)' : 'none',
            }}
          >
            <span>💣 Mines 5×5 AI Analyzer</span>
          </button>

          <button
            type="button"
            onClick={() => setAppMode('roulette')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              background:
                appMode === 'roulette'
                  ? 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)'
                  : 'rgba(255, 255, 255, 0.05)',
              border: appMode === 'roulette' ? '1px solid #6366f1' : '1px solid var(--border-subtle)',
              color: '#fff',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: appMode === 'roulette' ? '0 2px 10px rgba(99, 102, 241, 0.35)' : 'none',
            }}
          >
            <span>🎡 Adaptive Roulette Mathematics</span>
          </button>
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Active Mode: <strong style={{ color: '#fff' }}>{appMode === 'mines' ? 'Mines 5×5' : 'Roulette'}</strong>
        </div>
      </nav>

      {appMode === 'mines' ? (
        <main style={{ flex: 1, padding: '0.5rem 0 3rem 0' }}>
          <MinesAnalyzer />
        </main>
      ) : (
        <div className={`mobile-view-${mobileTab} ${settings.reducedMotion ? 'reduced-motion' : ''}`} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Header
            session={session}
            totalResults={totalResults}
            settings={settings}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenExportImport={() => setIsExportImportOpen(true)}
            onOpenClearConfirm={() => setIsClearConfirmOpen(true)}
            onOpenMappingModal={() => setIsMappingOpen(true)}
            onOpenHelpModal={() => setIsHelpOpen(true)}
          />

          {/* Main Content Area */}
          <main style={{
            flex: 1,
            maxWidth: 1400,
            width: '100%',
            margin: '0 auto',
            padding: '1.5rem 1.25rem 3rem 1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}>
        {/* Mobile View Mode Navigation Tabs (< 768px Viewports) */}
        <div className="mobile-tab-bar" role="tablist" aria-label="Mobile Navigation">
          <button
            type="button"
            onClick={() => setMobileTab('sureshot')}
            className={`mobile-tab-btn ${mobileTab === 'sureshot' ? 'active' : ''}`}
            role="tab"
            aria-selected={mobileTab === 'sureshot'}
          >
            <Zap size={14} />
            <span>Sureshot Signal</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('history')}
            className={`mobile-tab-btn ${mobileTab === 'history' ? 'active' : ''}`}
            role="tab"
            aria-selected={mobileTab === 'history'}
          >
            <History size={14} />
            <span>Sliding & Logs</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('analytics')}
            className={`mobile-tab-btn ${mobileTab === 'analytics' ? 'active' : ''}`}
            role="tab"
            aria-selected={mobileTab === 'analytics'}
          >
            <BarChart3 size={14} />
            <span>Deep Math</span>
          </button>
        </div>

        {/* Offline Return Welcome Banner */}
        {totalResults > 0 && !dismissedOfflineBanner && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.75) 0%, rgba(15, 23, 42, 0.9) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Sparkles size={18} color="#818cf8" />
              <div>
                <span style={{ fontSize: '0.88rem', color: '#fff', fontWeight: 600 }}>
                  Active Table: {totalResults} spins recorded in local database ({allHistoricalResults.length} lifetime spins in training memory).
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                  At a new table? Start fresh while keeping all historical data to train the model.
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={handleClearActiveResults}
                className="btn-secondary"
                style={{
                  fontSize: '0.8rem',
                  padding: '0.35rem 0.75rem',
                  borderColor: 'rgba(239, 68, 68, 0.4)',
                  color: '#fca5a5',
                }}
              >
                New Table (Save & Train)
              </button>
              <button
                type="button"
                onClick={() => setDismissedOfflineBanner(true)}
                className="btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Top Operational Section: Result Entry + 5-Slot Sliding History */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.25rem',
          alignItems: 'start',
        }}>
          <div className="tab-history-hide tab-analytics-hide">
            <ResultEntry
              onAddResult={handleAddResult}
              onUndoLastResult={handleUndoLastResult}
              onClearActiveResults={handleClearActiveResults}
              totalResults={totalResults}
              lastAddedNumber={results.length > 0 ? results[results.length - 1].number : undefined}
            />
          </div>

          <div className="tab-sureshot-hide tab-analytics-hide" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <SlidingHistory
              results={results}
              settings={settings}
              onToggleOrder={handleToggleSlidingOrder}
            />

            <SessionProgress
              totalResults={totalResults}
              minWindow={minWindow}
            />
          </div>
        </div>

        {/* 💰 Gambler's Bankroll & +10% Profit Target Bar */}
        <div className="tab-history-hide tab-analytics-hide">
          <BankrollTargetBar
            sureshot={recommendations.sureshot}
            lastOutcome={lastBetOutcome}
            currencySymbol="₹"
          />
        </div>

        {/* 🎯 SMART BET SIGNAL HERO: What to Bet On (Clean, Simple, Fast) */}
        <div className="tab-history-hide tab-analytics-hide">
          <SmartBetSignal
            recommendation={recommendations}
            totalResults={totalResults}
          />
        </div>

        {/* Quick Balance Summary Bar */}
        <div className="tab-history-hide tab-analytics-hide">
          <SimpleSummaryBar
            results={results}
          />
        </div>

        {/* Complete Audited Results Log */}
        <div className="tab-sureshot-hide tab-analytics-hide">
          <HistoryTable
            results={results}
            onEditResult={(r) => setEditingResult(r)}
            onDeleteResult={handleDeleteResult}
          />
        </div>

        {/* Collapsible Section: Advanced Statistical Analytics & Proofs */}
        <div className="tab-sureshot-hide tab-history-hide" style={{ marginTop: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setShowAdvancedMath(!showAdvancedMath)}
            className="btn-secondary"
            style={{
              width: '100%',
              padding: '0.85rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: showAdvancedMath ? 'rgba(30, 41, 59, 0.85)' : 'rgba(15, 23, 42, 0.6)',
              borderColor: showAdvancedMath ? 'var(--border-focus)' : 'var(--border-card)',
              borderRadius: 'var(--radius-lg)',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Cpu size={18} color="#6366f1" />
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
                {showAdvancedMath
                  ? 'Hide Deep Mathematical & Statistical Analytics'
                  : 'Show Deep Mathematical & Statistical Analytics (χ², Bayes, Markov, EV, Brier)'}
              </span>
            </div>
            {showAdvancedMath ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {showAdvancedMath && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.25rem' }}>
              {/* Statistical Assessment & Category Projections */}
              <StatisticalAssessment
                results={results}
                latestRollingStats={latestRollingStats}
                minWindow={minWindow}
              />

              {/* Rolling Windows & Temporal Slices */}
              <RollingStatsPanel
                windows={allRollingWindows}
              />

              {/* Streaks & Markov State Transitions */}
              <StreaksAndTransitions
                streaks={streaks}
                transitions={transitions}
                totalResults={totalResults}
              />

              {/* Bayesian Estimation & Hypothesis Testing Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
                gap: '1.25rem',
              }}>
                <BayesianPanel
                  redBayes={redBayes}
                  oddBayes={oddBayes}
                />

                <RandomnessPanel
                  chiColor={chiColor}
                  runsColor={runsColor}
                  runsParity={runsParity}
                  totalResults={totalResults}
                />
              </div>

              {/* House Edge Calculator & Adaptive Out-of-Sample Evaluation */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
                gap: '1.25rem',
              }}>
                <HouseEdgeCalculator />

                <AdaptiveEvaluationPanel
                  evaluation={adaptiveEvaluation}
                  predictions={predictions}
                />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(8, 12, 22, 0.95)',
        padding: '1.25rem',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', lineHeight: 1.6 }}>
          <strong>Educational Mathematics Notice:</strong> Designed strictly for scientific research, probability calculations, house-edge analysis, and educational tracking.
          Past outcomes do not determine future independent trials. All data is processed and stored locally in browser IndexedDB.
        </div>
      </footer>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />

      <MappingModal
        isOpen={isMappingOpen}
        onClose={() => setIsMappingOpen(false)}
      />

      <ExportImportModal
        isOpen={isExportImportOpen}
        onClose={() => setIsExportImportOpen(false)}
        onExportJSON={handleExportJSON}
        onExportCSV={handleExportCSV}
        onImportJSON={handleImportJSON}
      />

      <ClearConfirmModal
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        onConfirmClear={handleConfirmClear}
      />

      <EditResultModal
        isOpen={editingResult !== null}
        result={editingResult}
        onClose={() => setEditingResult(null)}
        onSaveCorrection={handleSaveCorrection}
      />

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
        </div>
      )}
    </div>
  );
}

export default App;
