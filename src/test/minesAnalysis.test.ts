import { describe, it, expect } from 'vitest';
import {
  computeTileFrequencies,
  calculateChiSquareUniformity,
  calculateRunsTest,
  calculateWilsonConfidenceInterval,
  generateProvablyFairOutcome,
  verifyProvablyFairRound,
} from '../math/minesAnalysis';
import { sha256Hex } from '../math/cryptoUtils';
import type { MinesRoundRecord } from '../types/mines';

describe('Mines Statistical Analysis Engine & Provably Fair Verifier', () => {
  it('Requirement 6: Tile frequency aggregation tracks bomb and safe exposures', () => {
    const dummyRounds: MinesRoundRecord[] = [
      {
        roundId: 'r1',
        timestamp: 1000,
        bombCount: 3,
        revealedSafeTiles: [0, 1, 2],
        revealedBombTiles: [3],
        allBombLocations: [3, 7, 14],
        outcome: 'loss',
        picksCount: 4,
        multiplierReached: 0,
        stake: 10,
        grossPayout: 0,
        netProfit: -10,
        sourceType: 'simulated',
        validationStatus: 'valid',
      },
      {
        roundId: 'r2',
        timestamp: 2000,
        bombCount: 3,
        revealedSafeTiles: [3, 4],
        revealedBombTiles: [],
        allBombLocations: [0, 7, 24],
        outcome: 'cashout',
        picksCount: 2,
        multiplierReached: 1.26,
        stake: 10,
        grossPayout: 12.6,
        netProfit: 2.6,
        sourceType: 'simulated',
        validationStatus: 'valid',
      },
    ];

    const stats = computeTileFrequencies(dummyRounds);
    expect(stats.length).toBe(25);

    // Tile index 7 had a bomb in both rounds
    expect(stats[7].bombCount).toBe(2);

    // Tile index 0 was safe in r1, bomb in r2
    expect(stats[0].safeCount).toBe(1);
    expect(stats[0].bombCount).toBe(1);
  });

  it('Requirement 6: Chi-Square uniformity test handles low sample size and uniform distributions', () => {
    // 0 sample size test
    const stats0 = computeTileFrequencies([]);
    const chi0 = calculateChiSquareUniformity(stats0);
    expect(chi0.sampleSize).toBe(0);
    expect(chi0.isUniform).toBe(true);
    expect(chi0.explanation).toContain('Insufficient data');

    // Synthetic perfectly uniform distribution (10 bombs per tile across all 25 tiles = 250 bombs)
    const uniformStats = stats0.map((s) => ({
      ...s,
      bombCount: 10,
      totalExposures: 20,
    }));
    const chiUniform = calculateChiSquareUniformity(uniformStats);
    expect(chiUniform.chiSquareStatistic).toBe(0);
    expect(chiUniform.pValue).toBe(1.0);
    expect(chiUniform.isUniform).toBe(true);
  });

  it('Requirement 6: Wald-Wolfowitz runs test evaluates outcome streakiness', () => {
    // Alternating wins and losses: W L W L W L W L W L W L
    const alternating: ('win' | 'loss')[] = [
      'win', 'loss', 'win', 'loss', 'win', 'loss', 'win', 'loss', 'win', 'loss', 'win', 'loss',
    ];
    const res = calculateRunsTest(alternating);
    expect(res.sampleSize).toBe(12);
    expect(res.runsCount).toBe(12);
    expect(res.isRandom).toBeDefined();

    // Insufficient sample size returns isRandom = true with explanation
    const shortList: ('win' | 'loss')[] = ['win', 'win', 'loss'];
    const resShort = calculateRunsTest(shortList);
    expect(resShort.explanation).toContain('Insufficient data');
  });

  it('Requirement 6: Wilson score 95% confidence interval calculates accurate bounds', () => {
    // 88 successes out of 100 trials
    const ci = calculateWilsonConfidenceInterval(88, 100);
    expect(ci.estimate).toBe(0.88);
    expect(ci.lower).toBeGreaterThan(0.79);
    expect(ci.upper).toBeLessThan(0.94);
  });

  it('Requirement 6: HMAC-SHA256 Provably Fair generator produces valid, unique bomb placements', () => {
    const serverSeed = 'sample_server_seed_d3b07384d113edec49eaa6238ad5ff00';
    const clientSeed = 'custom_client_seed_123';
    const nonce = 5;
    const bombCount = 3;

    const bombs = generateProvablyFairOutcome(serverSeed, clientSeed, nonce, bombCount);
    expect(bombs.length).toBe(3);

    // Ensure all coordinates are distinct and in range [0..24]
    const bombSet = new Set(bombs);
    expect(bombSet.size).toBe(3);
    for (const b of bombs) {
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThan(25);
    }

    // Deterministic replay: same inputs MUST produce identical bomb coordinates
    const bombsReplay = generateProvablyFairOutcome(serverSeed, clientSeed, nonce, bombCount);
    expect(bombs).toEqual(bombsReplay);
  });

  it('Requirement 6: Provably Fair verifier authenticates commitment hash and outcome layout', () => {
    const serverSeed = 'raw_unhashed_secret_server_seed_xyz789';
    const serverSeedHash = sha256Hex(serverSeed);
    const clientSeed = 'player_active_seed_456';
    const nonce = 12;
    const bombCount = 3;

    // Generate ground truth bombs
    const groundTruthBombs = generateProvablyFairOutcome(serverSeed, clientSeed, nonce, bombCount);

    // Verify with correct hash
    const verification = verifyProvablyFairRound(
      serverSeed,
      serverSeedHash,
      clientSeed,
      nonce,
      groundTruthBombs,
      bombCount
    );

    expect(verification.isValidCommitment).toBe(true);
    expect(verification.matchesRecordedOutcome).toBe(true);
    expect(verification.generatedBombs).toEqual(groundTruthBombs);

    // Verification with tampered hash
    const tampered = verifyProvablyFairRound(
      serverSeed,
      'tampered_hash_00000000000000000000000000000000',
      clientSeed,
      nonce,
      groundTruthBombs,
      bombCount
    );
    expect(tampered.isValidCommitment).toBe(false);
  });
});
