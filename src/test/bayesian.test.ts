import { describe, it, expect } from 'vitest';
import { calculateBayesianEstimate } from '../math/bayesian';

describe('Test 10: Bayesian Beta-Binomial Updating', () => {
  it('Requirement 10: Bayesian updates use the correct counts and prior', () => {
    // Uniform Beta(1, 1) prior with 3 successes and 2 failures
    const estimate = calculateBayesianEstimate('Red', 3, 2, 1, 1);

    expect(estimate.priorAlpha).toBe(1);
    expect(estimate.priorBeta).toBe(1);
    expect(estimate.successes).toBe(3);
    expect(estimate.failures).toBe(2);

    // Posterior parameters: alpha + s = 1 + 3 = 4, beta + f = 1 + 2 = 3
    expect(estimate.posteriorAlpha).toBe(4);
    expect(estimate.posteriorBeta).toBe(3);

    // Posterior mean: 4 / (4 + 3) = 4/7 = 0.571428...
    expect(estimate.posteriorMean).toBeCloseTo(4 / 7, 5);

    // 95% Credible Interval should enclose the posterior mean
    const [lower, upper] = estimate.credibleInterval95;
    expect(lower).toBeGreaterThan(0);
    expect(upper).toBeLessThan(1);
    expect(lower).toBeLessThan(estimate.posteriorMean);
    expect(upper).toBeGreaterThan(estimate.posteriorMean);
  });

  it('Supports custom informatives priors (e.g. Beta(10, 10))', () => {
    // Strongly informative prior centered at 0.5
    const estimate = calculateBayesianEstimate('Odd', 5, 0, 10, 10);
    expect(estimate.posteriorAlpha).toBe(15);
    expect(estimate.posteriorBeta).toBe(10);
    expect(estimate.posteriorMean).toBeCloseTo(15 / 25, 4); // 0.60
  });
});
