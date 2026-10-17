import { describe, it, expect } from 'vitest';
import {
  USER_3_BOMB_MULTIPLIERS,
  buildMultiplierSchedule,
  generateTheoreticalSchedule,
  validateMultiplierSchedule,
} from '../math/minesMultiplier';

describe('Mines Multiplier Schedule & House Edge Engine', () => {
  it('Requirement 5: User 3-bomb reference schedule matches 97% RTP structure', () => {
    const steps = buildMultiplierSchedule(3, USER_3_BOMB_MULTIPLIERS);
    expect(steps.length).toBe(22);

    // 1st hit: 1.10x
    expect(steps[0].hitNumber).toBe(1);
    expect(steps[0].multiplier).toBe(1.10);
    expect(steps[0].fairMultiplier).toBeCloseTo(1 / 0.88, 3);
    // Implied RTP = 1.10 / (1 / 0.88) = 1.10 * 0.88 = 0.968 ≈ 96.8%
    expect(steps[0].impliedRtp).toBeCloseTo(0.968, 2);

    // 22nd hit: 2,231.00x
    expect(steps[21].hitNumber).toBe(22);
    expect(steps[21].multiplier).toBe(2231.00);
    // Fair multiplier is 2,300x
    expect(steps[21].fairMultiplier).toBe(2300);
    // Implied RTP = 2231 / 2300 = exactly 0.97000 (97.00% RTP)
    expect(steps[21].impliedRtp).toBe(0.97);
    expect(steps[21].impliedHouseEdge).toBeCloseTo(0.03, 3);
  });

  it('Requirement 5: Generates theoretical schedule for other bomb counts', () => {
    // For 1 bomb, 24 safe picks
    const schedule1 = generateTheoreticalSchedule(1, 0.97);
    expect(Object.keys(schedule1).length).toBe(24);
    // Hit 1: 0.97 * (25/24) = 1.01x
    expect(schedule1[1]).toBe(1.01);

    // For 5 bombs, 20 safe picks
    const schedule5 = generateTheoreticalSchedule(5, 0.97);
    expect(Object.keys(schedule5).length).toBe(20);
    // Hit 1: 0.97 * (25/20) = 1.21x
    expect(schedule5[1]).toBe(1.21);
  });

  it('Requirement 5: Schedule inconsistency validation flags invalid multipliers', () => {
    // Normal valid schedule produces no errors
    const validSteps = buildMultiplierSchedule(3, USER_3_BOMB_MULTIPLIERS);
    const validIssues = validateMultiplierSchedule(validSteps);
    expect(validIssues.length).toBe(0);

    // Corrupted schedule with decreasing multiplier, multiplier < 1, and negative house edge
    const corruptedSteps = [...validSteps];
    corruptedSteps[0] = { ...corruptedSteps[0], multiplier: 0.95 }; // less than 1.0
    corruptedSteps[2] = { ...corruptedSteps[2], multiplier: 1.10 }; // non-increasing vs hit 2 (1.26)
    corruptedSteps[4] = { ...corruptedSteps[4], multiplier: 3.00, impliedHouseEdge: -0.15 }; // exceeds fair

    const issues = validateMultiplierSchedule(corruptedSteps);
    expect(issues.length).toBeGreaterThanOrEqual(3);

    const issueTypes = issues.map((i) => i.type);
    expect(issueTypes).toContain('less_than_one');
    expect(issueTypes).toContain('non_increasing');
    expect(issueTypes).toContain('negative_house_edge');
  });
});
