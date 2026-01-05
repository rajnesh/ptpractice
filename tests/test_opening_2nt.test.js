const { makeHandFromPattern } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../assets/js/combined-bidding-system');

/**
 * Opener NT ranges:
 * - 20–21 balanced -> 2NT
 * - 15–17 balanced with a 5-card major -> still 1NT in SAYC
 */

describe('Opening 2NT and 1NT choices', () => {
  let system;
  beforeEach(() => {
    system = new SAYCBiddingSystem();
    system.startAuction('N');
  });

  test('20–21 HCP balanced opens 2NT', () => {
    // 21 HCP balanced 4-3-3-3: AKQ2 / AQ2 / KQ2 / J32
    const hand = makeHandFromPattern('AKQ2', 'AQ2', 'KQ2', 'J32'); // 21 HCP
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2NT');
  });

  test('15–17 HCP balanced with 5-card major still opens 1NT', () => {
    // 16 HCP, balanced 5-3-3-2 with 5 spades: pad to 13 cards
    const hand = makeHandFromPattern('AKQJ2', 'Q32', 'Q32', 'Q2'); // 16 HCP, 5-3-3-2
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('1NT');
  });
});
