export type RouletteColor = 'red' | 'black';
export type RouletteParity = 'odd' | 'even';
export type JointCategory = 'red-odd' | 'red-even' | 'black-odd' | 'black-even';

export interface Classification {
  number: number;
  color: RouletteColor;
  parity: RouletteParity;
  joint: JointCategory;
}

export interface RouletteResult {
  id?: number;
  number: number;
  color: RouletteColor;
  parity: RouletteParity;
  joint: JointCategory;
  timestamp: number;
  sessionId: string;
  note?: string;
}

export interface Session {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  minObservationWindow: 5 | 6;
  notes?: string;
}

export interface TheoreticalDistribution {
  totalOutcomes: number; // 36
  redCount: number;
  blackCount: number;
  oddCount: number;
  evenCount: number;
  pRed: number;
  pBlack: number;
  pOdd: number;
  pEven: number;
  jointCounts: Record<JointCategory, number>;
  pJoint: Record<JointCategory, number>;
  areColorAndParityIndependent: boolean;
}

export interface RollingStats {
  label: string;
  windowSize: number;
  actualCount: number;
  isSufficient: boolean;
  redCount: number;
  blackCount: number;
  redFreq: number;
  blackFreq: number;
  oddCount: number;
  evenCount: number;
  oddFreq: number;
  evenFreq: number;
  jointCounts: Record<JointCategory, number>;
  jointFreqs: Record<JointCategory, number>;
}

export interface StreakInfo {
  currentParityStreak: { parity: RouletteParity | null; length: number };
  currentParityMax: { odd: number; even: number };
  parityDistribution: Record<string, number>;
  currentColorStreak: { color: RouletteColor | null; length: number };
  currentColorMax: { red: number; black: number };
  colorDistribution: Record<string, number>;
}

export interface TransitionStats {
  parityTransitions: {
    'odd->odd': number;
    'odd->even': number;
    'even->odd': number;
    'even->even': number;
  };
  parityTotals: { odd: number; even: number };
  colorTransitions: {
    'red->red': number;
    'red->black': number;
    'black->red': number;
    'black->black': number;
  };
  colorTotals: { red: number; black: number };
}

export interface BayesianEstimate {
  category: string;
  priorAlpha: number;
  priorBeta: number;
  successes: number;
  failures: number;
  posteriorAlpha: number;
  posteriorBeta: number;
  posteriorMean: number;
  credibleInterval95: [number, number];
}

export interface GoodnessOfFitResult {
  testName: string;
  chiSquareStat: number;
  degreesOfFreedom: number;
  pValue: number;
  isSignificant: boolean;
  expectedCounts: Record<string, number>;
  observedCounts: Record<string, number>;
  assumptionsMet: boolean;
  warning?: string;
}

export interface RunsTestResult {
  categoryName: string;
  observedRuns: number;
  n1: number; // category 1 count
  n2: number; // category 2 count
  expectedRuns: number;
  varianceRuns: number;
  zScore: number;
  pValue: number;
  isIndependent: boolean;
  warning?: string;
}

export interface HouseEdgeInput {
  stake: number;
  betCategory: 'red' | 'black' | 'odd' | 'even' | 'single' | 'joint_ro' | 'joint_re' | 'joint_bo' | 'joint_be' | 'custom';
  winningPayout: number; // Net profit per 1 unit stake (e.g. 1 for 1:1, 35 for 35:1)
  fees: number;
  customWinCount?: number;
}

export interface HouseEdgeResult {
  stake: number;
  pWin: number;
  pLose: number;
  winningPayout: number;
  grossReturn: number;
  netProfit: number;
  evUnit: number;
  evStake: number;
  houseEdge: number; // Fraction, e.g. 0.0526 or 0.0
  houseEdgePercentage: number; // %
  breakEvenPayout: number;
  formula: string;
  assumptions: string[];
}

export interface PredictionRecord {
  id?: number;
  stepNumber: number; // 1-indexed step for which prediction is made
  predictedAt: number;
  sessionId: string;
  forecast: {
    pRed: number;
    pBlack: number;
    pOdd: number;
    pEven: number;
  };
  actual?: {
    number: number;
    color: RouletteColor;
    parity: RouletteParity;
  };
  evaluated: boolean;
}

export interface AdaptiveEvaluation {
  totalEvaluated: number;
  brierColor: number;
  brierParity: number;
  baselineBrierColor: number;
  baselineBrierParity: number;
  logLossColor: number | null;
  logLossParity: number | null;
  calibrationBinsColor: Array<{
    binLabel: string;
    predictedAvg: number;
    observedFreq: number;
    count: number;
  }>;
  calibrationBinsParity: Array<{
    binLabel: string;
    predictedAvg: number;
    observedFreq: number;
    count: number;
  }>;
  warnings: string[];
}

export interface UserSettings {
  minObservationWindow: 5 | 6;
  slidingOrder: 'newest-left' | 'newest-right';
  reducedMotion: boolean;
  bayesianPriorAlpha: number;
  bayesianPriorBeta: number;
}
