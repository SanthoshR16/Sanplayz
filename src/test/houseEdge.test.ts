import { describe, it, expect } from 'vitest';
import { calculateHouseEdge } from '../math/houseEdge';

describe('Test 11: House-Edge and Expected-Value Calculations (37-Pocket European Space)', () => {
  it('Requirement 11: House-edge calculations use the supplied payouts and probabilities with 0 green', () => {
    // Case 1: Standard 1:1 bet on Red in 37-number wheel (18 red, 18 black, 1 green zero)
    // p = 18/37, b = 1.0, Stake = $10
    const redBet = calculateHouseEdge({
      stake: 10,
      betCategory: 'red',
      winningPayout: 1.0,
      fees: 0,
    });

    expect(redBet.pWin).toBeCloseTo(18 / 37, 5);
    expect(redBet.pLose).toBeCloseTo(19 / 37, 5);
    expect(redBet.evUnit).toBeCloseTo(-1 / 37, 5);
    expect(redBet.evStake).toBeCloseTo(-10 / 37, 4);
    expect(redBet.houseEdge).toBeCloseTo(1 / 37, 5);
    expect(redBet.houseEdgePercentage).toBeCloseTo((1 / 37) * 100, 3); // 2.703%
    expect(redBet.breakEvenPayout).toBeCloseTo(19 / 18, 4); // 1.0556:1

    // Case 2: Single number paying 35:1 (standard roulette payout)
    // p = 1/37, b = 35, S = 100
    // EV_unit = (1/37)*35 - (36/37) = -1/37 = -0.027027...
    // House edge = 1/37 = 2.7027%
    const singleStandard = calculateHouseEdge({
      stake: 100,
      betCategory: 'single',
      winningPayout: 35.0,
      fees: 0,
    });

    expect(singleStandard.pWin).toBeCloseTo(1 / 37, 6);
    expect(singleStandard.evUnit).toBeCloseTo(-1 / 37, 5);
    expect(singleStandard.evStake).toBeCloseTo(-100 / 37, 4);
    expect(singleStandard.houseEdgePercentage).toBeCloseTo((1 / 37) * 100, 3);
    expect(singleStandard.breakEvenPayout).toBeCloseTo(36.0, 4);

    // Case 3: Green Zero direct bet
    const zeroBet = calculateHouseEdge({
      stake: 50,
      betCategory: 'zero',
      winningPayout: 35.0,
      fees: 0,
    });
    expect(zeroBet.pWin).toBeCloseTo(1 / 37, 6);
    expect(zeroBet.houseEdgePercentage).toBeCloseTo((1 / 37) * 100, 3);

    // Case 4: Joint category (Red & Odd)
    // In our custom wheel, Red & Odd has 10 numbers out of 37
    // p = 10/37
    const redOdd = calculateHouseEdge({
      stake: 50,
      betCategory: 'joint_ro',
      winningPayout: 2.5,
      fees: 0,
    });

    expect(redOdd.pWin).toBeCloseTo(10 / 37, 5);
    // Break-even payout: (37 - 10) / 10 = 27/10 = 2.7 : 1
    expect(redOdd.breakEvenPayout).toBeCloseTo(2.7, 5);
    // With payout 2.5: EV_unit = (10/37)*2.5 - (27/37) = (25 - 27)/37 = -2/37
    expect(redOdd.evUnit).toBeCloseTo(-2 / 37, 5);
  });

  it('Accurately incorporates table fees and commission', () => {
    // $10 stake, 1:1 on Even, with $0.50 table fee
    const feeBet = calculateHouseEdge({
      stake: 10,
      betCategory: 'even',
      winningPayout: 1.0,
      fees: 0.5,
    });

    // Base EV = -10/37 (-0.2703), with $0.50 fee => EV_stake = -0.7703
    expect(feeBet.evStake).toBeCloseTo(-10 / 37 - 0.5, 4);
    expect(feeBet.houseEdge).toBeCloseTo((10 / 37 + 0.5) / 10, 4);
  });
});

