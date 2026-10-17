/**
 * Domain types for Mines 5x5 AI Analyzer and Paper-Trading Simulator.
 */

export type MinesSourceType = 'verified' | 'manual' | 'simulated';

export type MinesOutcome = 'win' | 'loss' | 'cashout';

export interface TileState {
  index: number; // 0 to 24
  label: number; // 1 to 25
  row: number;   // 0 to 4
  col: number;   // 0 to 4
  status: 'unopened' | 'revealed-safe' | 'revealed-bomb';
  isIllustrativePick?: boolean;
}

export interface MultiplierStep {
  hitNumber: number; // 1 to (25 - bombCount)
  multiplier: number; // Gross multiplier (e.g. 1.10)
  survivalProb: number; // Exact cumulative survival probability
  fairMultiplier: number; // Theoretical fair multiplier = 1 / survivalProb
  impliedRtp: number; // multiplier / fairMultiplier
  impliedHouseEdge: number; // 1 - impliedRtp
  isUserOverridden?: boolean;
}

export interface ProvablyFairData {
  serverSeed?: string;
  serverSeedHash?: string;
  clientSeed?: string;
  nonce?: number;
  verified?: boolean;
  algorithm?: 'HMAC-SHA256-Fisher-Yates';
}

export interface MinesRoundRecord {
  id?: number;
  roundId: string;
  timestamp: number;
  bombCount: number; // 1 to 24
  revealedSafeTiles: number[]; // tile indices [0..24]
  revealedBombTiles: number[]; // tile indices [0..24]
  allBombLocations?: number[]; // all bomb positions on board if round finished
  outcome: MinesOutcome;
  picksCount: number;
  multiplierReached: number;
  stake: number;
  grossPayout: number;
  netProfit: number;
  sourceType: MinesSourceType;
  validationStatus: 'valid' | 'flagged' | 'invalid';
  provablyFair?: ProvablyFairData;
  notes?: string;
}

export interface ModelPrediction {
  id: string;
  timestamp: number;
  bombCount: number;
  suggestedTiles: number[]; // 0 to 24
  pickCount: number;
  theoreticalSafeProb: number;
  grossMultiplier: number;
  potentialGrossPayout: number;
  potentialNetProfit: number;
  signalType: 'theoretical_baseline' | 'unvalidated_heuristic' | 'experimental_signal';
  explanation: string;
}

export interface EvaluationRecord {
  id?: number;
  roundId: string;
  timestamp: number;
  provider: string; // e.g. "Spribe / BetInExchange247"
  bombCount: number;
  suggestedTiles: number[];
  actualBombTiles: number[];
  predictionSafe: boolean; // true if none of suggestedTiles were hit by actualBombTiles
  notes?: string;
}

export interface ProbabilityBreakdown {
  bombCount: number;
  totalTiles: number; // 25
  revealedSafeCount: number; // k
  remainingTiles: number; // 25 - k
  remainingSafeTiles: number; // 25 - B - k
  initialSafeProb: number; // (25 - B) / 25
  nextPickSafeProb: number; // (25 - B - k) / (25 - k)
  cumulativeSurvivalProb: number; // Product of survival probs
  fairMultiplierCurrent: number; // 1 / cumulativeSurvivalProb
  userMultiplierCurrent: number;
  nextPickMultiplier: number;
  nextGrossPayout: number;
  nextNetProfit: number;
  expectedValue: number; // Stake * (survivalProb * multiplier - 1)
}

export interface BankrollSessionEntry {
  id: string;
  timestamp: number;
  roundNumber: number;
  stake: number;
  picks: number;
  outcome: MinesOutcome;
  multiplier: number;
  grossPayout: number;
  netProfit: number;
  balanceAfter: number;
}

export interface BankrollState {
  startingBalance: number | null; // null until user explicitly enters it
  currentBalance: number | null;
  hypotheticalStake: number;
  targetPercentage: number; // default 10%
  targetReached: boolean;
  targetBalance: number | null;
  totalPicksMade: number;
  successfulPicks: number;
  failedPicks: number;
  grossReturnsTotal: number;
  netProfitTotal: number;
  peakBalance: number;
  maxDrawdown: number;
  maxDrawdownPercentage: number;
  currentDrawdown: number;
  currentWinStreak: number;
  currentLossStreak: number;
  maxWinStreak: number;
  maxLossStreak: number;
  sessionLog: BankrollSessionEntry[];
}

export interface TileFrequencyStat {
  tileIndex: number;
  tileLabel: number;
  bombCount: number;
  safeCount: number;
  totalExposures: number;
  bombRate: number; // bombCount / totalExposures
}

export interface ChiSquareUniformityResult {
  sampleSize: number;
  chiSquareStatistic: number;
  degreesOfFreedom: number;
  criticalValue05: number;
  pValue: number;
  isUniform: boolean;
  expectedFrequencyPerTile: number;
  explanation: string;
}

export interface RunsTestResult {
  sampleSize: number;
  runsCount: number;
  winsCount: number;
  lossesCount: number;
  expectedRuns: number;
  varianceRuns: number;
  zScore: number;
  pValue: number;
  isRandom: boolean;
  explanation: string;
}

export interface ModelEvaluationReport {
  modelName: string;
  trainSampleSize: number;
  testSampleSize: number;
  baselineBrierScore: number;
  modelBrierScore: number;
  baselineLogLoss: number;
  modelLogLoss: number;
  isBetterThanBaseline: boolean;
  conclusion: string;
  notes: string[];
}

export interface ProvenanceSource {
  title: string;
  organization: string;
  url: string;
  licenseOrTerms: string;
  dataType: 'Theoretical Rules' | 'Cryptographic Algorithm' | 'Statistical Benchmark' | 'Proper Scoring Rule';
  collectionMethod: string;
  limitations: string;
  verifiedApplication: string;
}
