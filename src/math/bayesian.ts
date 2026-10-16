import type { BayesianEstimate } from '../types/roulette';

/**
 * Log-gamma approximation via Lanczos formula for evaluating Beta function.
 */
function logGamma(z: number): number {
  const p = [
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];

  if (z < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  }

  z -= 1;
  let x = 0.99999999999980993;
  for (let i = 0; i < p.length; i++) {
    x += p[i] / (z + i + 1);
  }

  const t = z + p.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

/**
 * Continued fraction approximation for regularized incomplete beta function I_x(a, b).
 */
function betacf(a: number, b: number, x: number): number {
  const MAXIT = 100;
  const EPS = 3e-7;
  const FPMIN = 1e-30;

  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;

  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }

  return h;
}

/**
 * Regularized incomplete beta function I_x(a, b)
 */
export function incompleteBeta(a: number, b: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  const bt = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));

  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betacf(a, b, x)) / a;
  } else {
    return 1 - (bt * betacf(b, a, 1 - x)) / b;
  }
}

/**
 * Inverse of regularized incomplete beta function (quantile / CDF inverse) via bisection.
 */
export function betaQuantile(a: number, b: number, p: number): number {
  if (p <= 0) return 0;
  if (p >= 1) return 1;

  let low = 0;
  let high = 1;
  let guess = a / (a + b);

  for (let iter = 0; iter < 40; iter++) {
    const cdf = incompleteBeta(a, b, guess);
    if (Math.abs(cdf - p) < 1e-6) break;
    if (cdf < p) {
      low = guess;
    } else {
      high = guess;
    }
    guess = 0.5 * (low + high);
  }

  return guess;
}

/**
 * Calculates Bayesian Beta-Binomial update for binary successes and failures.
 * Prior: Beta(alpha, beta)
 * Posterior: Beta(alpha + successes, beta + failures)
 * Posterior Mean: (alpha + successes) / (alpha + beta + successes + failures)
 * 95% Credible Interval: [Q(0.025), Q(0.975)]
 */
export function calculateBayesianEstimate(
  category: string,
  successes: number,
  failures: number,
  priorAlpha: number = 1,
  priorBeta: number = 1
): BayesianEstimate {
  const safeAlpha = Math.max(0.1, priorAlpha);
  const safeBeta = Math.max(0.1, priorBeta);

  const postAlpha = safeAlpha + successes;
  const postBeta = safeBeta + failures;

  const posteriorMean = postAlpha / (postAlpha + postBeta);
  const lowerCI = betaQuantile(postAlpha, postBeta, 0.025);
  const upperCI = betaQuantile(postAlpha, postBeta, 0.975);

  return {
    category,
    priorAlpha: safeAlpha,
    priorBeta: safeBeta,
    successes,
    failures,
    posteriorAlpha: postAlpha,
    posteriorBeta: postBeta,
    posteriorMean,
    credibleInterval95: [lowerCI, upperCI],
  };
}
