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
      categoryLabel = `Red (${theo.redCount}/36 outcomes)`;
      break;
    case 'black':
      pWin = theo.pBlack;
      categoryLabel = `Black (${theo.blackCount}/36 outcomes)`;
      break;
    case 'odd':
      pWin = theo.pOdd;
      categoryLabel = `Odd (${theo.oddCount}/36 outcomes)`;
      break;
    case 'even':
      pWin = theo.pEven;
      categoryLabel = `Even (${theo.evenCount}/36 outcomes)`;
      break;
    case 'single':
      pWin = 1 / theo.totalOutcomes;
      categoryLabel = `Single Number (1/36 outcome)`;
      break;
    case 'joint_ro':
      pWin = theo.pJoint['red-odd'];
      categoryLabel = `Red & Odd (${theo.jointCounts['red-odd']}/36 outcomes)`;
      break;
    case 'joint_re':
      pWin = theo.pJoint['red-even'];
      categoryLabel = `Red & Even (${theo.jointCounts['red-even']}/36 outcomes)`;
      break;
    case 'joint_bo':
      pWin = theo.pJoint['black-odd'];
      categoryLabel = `Black & Odd (${theo.jointCounts['black-odd']}/36 outcomes)`;
      break;
    case 'joint_be':
      pWin = theo.pJoint['black-even'];
      categoryLabel = `Black & Even (${theo.jointCounts['black-even']}/36 outcomes)`;
      break;
    case 'custom': {
      const k = Math.min(36, Math.max(1, input.customWinCount || 1));
      pWin = k / theo.totalOutcomes;
      categoryLabel = `Custom Bet (${k}/36 outcomes)`;
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
    `Wheel contains 36 discrete, uniformly probable outcomes (1–36).`,
    `Theoretical probability for ${categoryLabel} is exactly ${pWin.toFixed(4)} (${(pWin * 100).toFixed(2)}%).`,
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
