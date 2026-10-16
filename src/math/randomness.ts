import type { GoodnessOfFitResult, RunsTestResult } from '../types/roulette';

/**
 * Normal standard CDF approximation (error function erf).
 */
export function normalCdf(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

function erf(x: number): number {
  // A Chebyshev fitting approximation for erf(x)
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);

  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

  return sign * y;
}

/**
 * Lower incomplete gamma function for chi-square CDF.
 */
function lowerIncompleteGamma(s: number, x: number): number {
  if (x < 0) return 0;
  if (x === 0) return 0;

  // Series expansion
  let sum = 1.0 / s;
  let term = 1.0 / s;
  for (let n = 1; n < 100; n++) {
    term *= x / (s + n);
    sum += term;
    if (term < sum * 1e-12) break;
  }
  return sum * Math.pow(x, s) * Math.exp(-x);
}

function gamma(z: number): number {
  // Stirling / Lanczos
  const g = 7;
  const c = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];

  if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));

  z -= 1;
  let x = c[0];
  for (let i = 1; i < g + 2; i++) {
    x += c[i] / (z + i);
  }
  const t = z + g + 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

/**
 * Chi-Square Survival Function (p-value = 1 - CDF).
 */
export function chiSquarePValue(chi2: number, dof: number): number {
  if (chi2 <= 0 || dof <= 0) return 1;
  const s = dof / 2;
  const x = chi2 / 2;
  const gammaS = gamma(s);
  const lower = lowerIncompleteGamma(s, x);
  const pValue = 1 - lower / gammaS;
  return Math.max(0, Math.min(1, pValue));
}

/**
 * Chi-Square Goodness of Fit Test.
 */
export function calculateChiSquareTest(
  testName: string,
  observed: Record<string, number>,
  theoreticalProbs: Record<string, number>
): GoodnessOfFitResult {
  const categories = Object.keys(observed);
  const totalObserved = categories.reduce((sum, cat) => sum + (observed[cat] || 0), 0);

  const expected: Record<string, number> = {};
  let chiSquareStat = 0;
  let anyExpectedBelowFive = false;

  for (const cat of categories) {
    const p = theoreticalProbs[cat] ?? (1 / categories.length);
    const exp = totalObserved * p;
    expected[cat] = exp;
    if (exp < 5) {
      anyExpectedBelowFive = true;
    }
    const obs = observed[cat] || 0;
    if (exp > 0) {
      chiSquareStat += Math.pow(obs - exp, 2) / exp;
    }
  }

  const dof = Math.max(1, categories.length - 1);
  const pValue = totalObserved > 0 ? chiSquarePValue(chiSquareStat, dof) : 1;

  let warning: string | undefined;
  if (totalObserved < 20) {
    warning = `Sample size (${totalObserved}) is very small. Chi-square approximations require N ≥ 20. Results are preliminary and noisy.`;
  } else if (anyExpectedBelowFive) {
    warning = 'Some expected cell counts are below 5. The asymptotic chi-square approximation may be unreliable.';
  }

  return {
    testName,
    chiSquareStat,
    degreesOfFreedom: dof,
    pValue,
    isSignificant: pValue < 0.05,
    expectedCounts: expected,
    observedCounts: observed,
    assumptionsMet: !anyExpectedBelowFive && totalObserved >= 20,
    warning,
  };
}

/**
 * Wald-Wolfowitz Runs Test for Binary Sequence Randomness (e.g. Red/Black or Odd/Even).
 */
export function calculateRunsTest(
  categoryName: string,
  sequence: string[]
): RunsTestResult {
  const n = sequence.length;
  if (n === 0) {
    return {
      categoryName,
      observedRuns: 0,
      n1: 0,
      n2: 0,
      expectedRuns: 0,
      varianceRuns: 0,
      zScore: 0,
      pValue: 1,
      isIndependent: true,
      warning: 'No data available for runs test.',
    };
  }

  const firstVal = sequence[0];
  let n1 = 0;
  let n2 = 0;
  let runs = 1;

  for (let i = 0; i < n; i++) {
    if (sequence[i] === firstVal) {
      n1++;
    } else {
      n2++;
    }
    if (i > 0 && sequence[i] !== sequence[i - 1]) {
      runs++;
    }
  }

  if (n1 === 0 || n2 === 0) {
    return {
      categoryName,
      observedRuns: runs,
      n1,
      n2,
      expectedRuns: 1,
      varianceRuns: 0,
      zScore: 0,
      pValue: 1,
      isIndependent: false,
      warning: 'Only one category observed. Runs test requires both binary outcomes.',
    };
  }

  const expectedRuns = (2 * n1 * n2) / (n1 + n2) + 1;
  const numerator = 2 * n1 * n2 * (2 * n1 * n2 - n1 - n2);
  const denominator = Math.pow(n1 + n2, 2) * (n1 + n2 - 1);
  const varianceRuns = denominator > 0 ? numerator / denominator : 0;

  const zScore = varianceRuns > 0 ? (runs - expectedRuns) / Math.sqrt(varianceRuns) : 0;
  // Two-tailed p-value
  const pValue = 2 * (1 - normalCdf(Math.abs(zScore)));

  let warning: string | undefined;
  if (n1 < 10 || n2 < 10) {
    warning = `Sub-group counts (n1=${n1}, n2=${n2}) are under 10. Normal approximation for runs test is fragile on small sequences.`;
  }

  return {
    categoryName,
    observedRuns: runs,
    n1,
    n2,
    expectedRuns,
    varianceRuns,
    zScore,
    pValue,
    isIndependent: pValue >= 0.05,
    warning,
  };
}
