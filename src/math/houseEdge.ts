import type { HouseEdgeInput, HouseEdgeResult } from '../types/roulette';
import { getTheoreticalDistribution } from './probability';

/**
 * Calculates Expected Value, House Edge, and Break-Even Payout
 * based on user-supplied stakes, payouts, and theoretical probabilities of the 1–36 wheel.
 * 
 * EV_unit = p * b - (1 - p)
 * EV_S = S * [p * b - (1 - p)] - fees
 * House Edge H = - EV_S / S
 */
export function calculateHouseEdge(input: HouseEdgeInput): HouseEdgeResult {
  const S = Math.max(0.01, input.stake);
  const b = input.winningPayout; // net profit per 1 unit stake
  const fees = Math.max(0, input.fees || 0);

  const theo = getTheoreticalDistribution();

  let pWin = 0;
  let categoryLabel = '';

  switch (input.betCategory) {
    case 'red':
      pWin = theo.pRed;
      categoryLabel = `Red (${theo.redCount}/${theo.totalOutcomes} outcomes)`;
      break;
    case 'black':
      pWin = theo.pBlack;
      categoryLabel = `Black (${theo.blackCount}/${theo.totalOutcomes} outcomes)`;
      break;
    case 'odd':
      pWin = theo.pOdd;
      categoryLabel = `Odd (${theo.oddCount}/${theo.totalOutcomes} outcomes)`;
      break;
    case 'even':
      pWin = theo.pEven;
      categoryLabel = `Even (${theo.evenCount}/${theo.totalOutcomes} outcomes)`;
      break;
    case 'low':
      pWin = theo.pLow;
      categoryLabel = `Low 1–18 (${theo.lowCount}/${theo.totalOutcomes} outcomes)`;
      break;
    case 'high':
      pWin = theo.pHigh;
      categoryLabel = `High 19–36 (${theo.highCount}/${theo.totalOutcomes} outcomes)`;
      break;
    case 'zero':
      pWin = theo.pZero;
      categoryLabel = `Green Zero 0 (${theo.zeroCount}/${theo.totalOutcomes} outcomes)`;
      break;
    case 'single':
      pWin = 1 / theo.totalOutcomes;
      categoryLabel = `Single Number (1/${theo.totalOutcomes} outcome)`;
      break;
    case 'joint_ro':
      pWin = theo.pJoint['red-odd'];
      categoryLabel = `Red & Odd (${theo.jointCounts['red-odd']}/${theo.totalOutcomes} outcomes)`;
      break;
    case 'joint_re':
      pWin = theo.pJoint['red-even'];
      categoryLabel = `Red & Even (${theo.jointCounts['red-even']}/${theo.totalOutcomes} outcomes)`;
      break;
    case 'joint_bo':
      pWin = theo.pJoint['black-odd'];
      categoryLabel = `Black & Odd (${theo.jointCounts['black-odd']}/${theo.totalOutcomes} outcomes)`;
      break;
    case 'joint_be':
      pWin = theo.pJoint['black-even'];
      categoryLabel = `Black & Even (${theo.jointCounts['black-even']}/${theo.totalOutcomes} outcomes)`;
      break;
    case 'custom': {
      const k = Math.min(theo.totalOutcomes, Math.max(1, input.customWinCount || 1));
      pWin = k / theo.totalOutcomes;
      categoryLabel = `Custom Bet (${k}/${theo.totalOutcomes} outcomes)`;
      break;
    }
  }

  const pLose = 1 - pWin;
  const grossReturn = S * (1 + b);
  const netProfit = S * b;

  // EV per unit stake without fees
  const evUnitBase = pWin * b - (1 - pWin);

  // Total EV with stake and fees
  const evStake = S * evUnitBase - fees;
  const evUnit = evStake / S;

  // House edge defined as negative expected return to the player as a fraction of stake
  const houseEdge = -evUnit;
  const houseEdgePercentage = houseEdge * 100;

  // Break-even net payout b_be where EV = 0: p * b - (1 - p) = 0 => b = (1 - p) / p
  const breakEvenPayout = pWin > 0 ? (1 - pWin) / pWin : 0;

  const formula = `EV = S * [p * b - (1 - p)] - fees; House Edge H = -EV / S`;

  const assumptions = [
    `Wheel contains ${theo.totalOutcomes} discrete, uniformly probable outcomes (0–36 including Green Zero).`,
    `Theoretical probability for ${categoryLabel} is exactly ${pWin.toFixed(4)} (${(pWin * 100).toFixed(2)}%).`,
    `On standard 1:1 bets (Red/Black, Odd/Even, Low/High), the 2.70% house edge arises from the single Green Zero (0).`,
    `Player wagers stake S = $${S.toFixed(2)} with net winning payout b = ${b.toFixed(4)} : 1.`,
    fees > 0 ? `Deductions/Fees applied: $${fees.toFixed(2)} per wager.` : 'No additional fees or table rake applied.',
    `House edge is strictly theoretical and derived from mathematical expectations, not short-term observed spins.`,
  ];

  return {
    stake: S,
    pWin,
    pLose,
    winningPayout: b,
    grossReturn,
    netProfit,
    evUnit,
    evStake,
    houseEdge,
    houseEdgePercentage,
    breakEvenPayout,
    formula,
    assumptions,
  };
}
