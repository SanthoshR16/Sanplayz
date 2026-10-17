/**
 * Mines Real-Data Provenance & Open-Source Research Citations.
 *
 * Implements Section 2 requirements:
 * - Exhaustive provenance registry of legitimate public sources.
 * - Records provider documentation, URLs, licenses, data types, collection methods, and limitations.
 * - Explicit disclosure of data veracity (Provably Fair vs Manual vs Simulated).
 */

import type { ProvenanceSource } from '../types/mines';

export const PROVENANCE_SOURCES: ProvenanceSource[] = [
  {
    title: 'Spribe Mines Official Rules and Payout Specifications',
    organization: 'Spribe Gaming Ltd',
    url: 'https://spribe.co/games/mines',
    licenseOrTerms: 'Proprietary Commercial Gaming Specification / UKGC & MGA Certified Rules',
    dataType: 'Theoretical Rules',
    collectionMethod: 'Public documentation of certified game payout mathematics and combinatorial rules.',
    limitations:
      'Provides theoretical formulas and multiplier schedules (standard 97% RTP); does not provide an open public API for live outcome feeds without operator-level integration.',
    verifiedApplication:
      'Used to verify the user multiplier table (22 hits for 3 bombs matching 97% RTP) and standard 5x5 board rules.',
  },
  {
    title: 'BetInExchange247 / FunInExchange Spribe Mines Documentation & Platform Specs',
    organization: 'BetInExchange247 / FunInExchange',
    url: 'https://betinexchange247.in/',
    licenseOrTerms: 'Platform Gaming Rules & Spribe Provider Integration Specs',
    dataType: 'Theoretical Rules',
    collectionMethod: 'Analysis of Spribe Mines 5x5 rules, 97% RTP payouts, and independent RNG seed pairs on BetInExchange247.',
    limitations:
      'Operates with independent uniform random placement per round. Does not leak future hidden bomb coordinates or allow pattern-based coordinate exploitation.',
    verifiedApplication:
      'Referenced for Indian iGaming exchange integration of Spribe Mines, confirming payout schedules, round verification mechanics, and independent trial distribution.',
  },
  {
    title: 'Stake Provably Fair Cryptographic Verification Framework',
    organization: 'Stake.com (Medium Rare N.V.)',
    url: 'https://stake.com/provably-fair/overview',
    licenseOrTerms: 'Public Open Verification Specification / MIT Reference Implementations',
    dataType: 'Cryptographic Algorithm',
    collectionMethod: 'Analysis of public HMAC-SHA256 seed-pair verification algorithms and Fisher-Yates byte extraction.',
    limitations:
      'Validates historical fairness after server seed is revealed. Does not allow predicting future rounds due to SHA-256 pre-image resistance and independent client-seed nonces.',
    verifiedApplication:
      'Integrated as our independent Provably Fair Verifier, allowing users to verify authentic round outcomes from Server Seed + Client Seed + Nonce.',
  },
  {
    title: 'Rollbit Provably Fair Mines System Architecture',
    organization: 'Bull Gaming N.V. (Rollbit)',
    url: 'https://rollbit.com/help/provably-fair',
    licenseOrTerms: 'Public Provably Fair Documentation',
    dataType: 'Cryptographic Algorithm',
    collectionMethod: 'Public cryptographic algorithm documentation for 25-tile mines layouts.',
    limitations:
      'Demonstrates that mine coordinates are determined before the first pick; does not provide coordinate prediction without the unhashed server seed.',
    verifiedApplication:
      'Corroborates standard 25-tile byte-to-index mapping algorithms.',
  },
  {
    title: 'NIST Special Publication 800-22 Rev. 1a: Randomness Testing',
    organization: 'National Institute of Standards and Technology (NIST)',
    url: 'https://csrc.nist.gov/publications/detail/sp/800-22/rev-1a/final',
    licenseOrTerms: 'Public Domain (U.S. Federal Government)',
    dataType: 'Statistical Benchmark',
    collectionMethod: 'Empirical statistical tests for cryptographic and pseudorandom number generators.',
    limitations:
      'Statistical tests evaluate macroscopic randomness; passing tests does not guarantee predictability of specific coordinates.',
    verifiedApplication:
      'Supplies the Chi-Square Goodness-of-Fit test (df=24) and Wald-Wolfowitz Runs Test for detecting serial correlation.',
  },
  {
    title: 'Verification of Forecasts Expressed in Terms of Probability',
    organization: 'Glenn W. Brier, U.S. Weather Bureau (Monthly Weather Review, 78(1), 1-3)',
    url: 'https://journals.ametsoc.org/view/journals/mwre/78/1/1520-0493_1950_078_0001_vofei_2_0_co_2.xml',
    licenseOrTerms: 'Academic Reference / Public Domain',
    dataType: 'Proper Scoring Rule',
    collectionMethod: 'Mathematical formulation of the Brier Score metric for probabilistic model calibration.',
    limitations:
      'Measures calibration and refinement against observed binary outcomes; cannot extract signal where true underlying process is pure noise.',
    verifiedApplication:
      'Used in Section 8 model validation to objectively compare heuristic coordinate predictors against the theoretical uniform baseline.',
  },
];

export interface DataProvenanceStatus {
  hasLiveCasinoConnection: boolean;
  provenanceStatement: string;
  sourceBreakdown: {
    verifiedCount: number;
    manualCount: number;
    simulatedCount: number;
  };
}

export function getDataProvenanceStatus(counts: {
  verifiedCount: number;
  manualCount: number;
  simulatedCount: number;
}): DataProvenanceStatus {
  return {
    hasLiveCasinoConnection: false,
    provenanceStatement:
      'Transparent Honesty Guarantee: This application connects to NO live casino web socket or scraping feed (doing so without credentials violates operator terms). Authentic data is supported exclusively via Provably Fair cryptographic seed verification or manual user entry. Simulated data is strictly used for testing mathematics and software.',
    sourceBreakdown: counts,
  };
}
