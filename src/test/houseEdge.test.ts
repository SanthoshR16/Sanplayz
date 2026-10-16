import { describe, it, expect } from 'vitest';
import { calculateHouseEdge } from '../math/houseEdge';

describe('Test 11: House-Edge and Expected-Value Calculations', () => {
  it('Requirement 11: House-edge calculations use the supplied payouts and probabilities', () => {
    // Case 1: Fair 1:1 bet on Red in 36-number wheel (18 red, 18 black)
    // p = 18/36 = 0.5, b = 1.0, Stake = $10
    const fairRed = calculateHouseEdge({
      stake: 10,
      betCategory: 'red',
      winningPayout: 1.0,
      fees: 0,
    });

    expect(fairRed.pWin).toBe(0.5);
    expect(fairRed.pLose).toBe(0.5);
    expect(fairRed.evUnit).toBeCloseTo(0, 6);
    expect(fairRed.evStake).toBeCloseTo(0, 6);
    expect(fairRed.houseEdge).toBeCloseTo(0, 6);
    expect(fairRed.breakEvenPayout).toBeCloseTo(1.0, 6);

    // Case 2: Sub-fair payout: Single number paying 34:1 (instead of 35:1)
    // p = 1/36, b = 34, S = 100
    // EV_unit = (1/36)*34 - (35/36) = -1/36 = -0.027777...
    // House edge = 1/36 = 0.027777... (2.78%)
    const singleSubFair = calculateHouseEdge({
      stake: 100,
      betCategory: 'single',
      winningPayout: 34.0,
      fees: 0,
    });

    expect(singleSubFair.pWin).toBeCloseTo(1 / 36, 6);
    expect(singleSubFair.evUnit).toBeCloseTo(-1 / 36, 5);
    expect(singleSubFair.evStake).toBeCloseTo(-100 / 36, 4);
    expect(singleSubFair.houseEdgePercentage).toBeCloseTo((1 / 36) * 100, 3);
    expect(singleSubFair.breakEvenPayout).toBeCloseTo(35.0, 4);

    // Case 3: Joint category (Red & Odd)
    // In our custom wheel, Red & Odd has 10 numbers out of 36
    // p = 10/36 = 5/18 = 0.27777...
    const redOdd = calculateHouseEdge({
      stake: 50,
      betCategory: 'joint_ro',
      winningPayout: 2.5,
      fees: 0,
    });

    expect(redOdd.pWin).toBeCloseTo(10 / 36, 5);
    // Break-even payout: (1 - 10/36) / (10/36) = 26/10 = 2.6 : 1
    expect(redOdd.breakEvenPayout).toBeCloseTo(2.6, 5);
    // With payout 2.5: EV_unit = (10/36)*2.5 - (26/36) = (25 - 26)/36 = -1/36
    expect(redOdd.evUnit).toBeCloseTo(-1 / 36, 5);
  });

  it('Accurately incorporates table fees and commission', () => {
    // $10 stake, 1:1 on Even, with $0.50 table fee
    const feeBet = calculateHouseEdge({
      stake: 10,
      betCategory: 'even',
      winningPayout: 1.0,
      fees: 0.5,
    });

    // Base EV = 0, with $0.50 fee => EV_stake = -$0.50
    expect(feeBet.evStake).toBeCloseTo(-0.5, 4);
    expect(feeBet.houseEdge).toBeCloseTo(0.5 / 10, 4); // 5% house edge from fee
  });
});
