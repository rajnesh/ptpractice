const { makeHandFromPattern } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../assets/js/combined-bidding-system');
const { Bid } = require('../assets/js/bridge-types');

/**
 * Responder 2NT (12–14) over 1m with no 4-card major and no 4-card support.
 */

describe('Responder: 2NT (12–14) over 1m, balanced without a 4-card major', () => {
  let system;

  beforeEach(() => {
    system = new SAYCBiddingSystem();
    system.startAuction('S'); // Dealer South
    // Auction: PASS (S), 1C (W), PASS (N) — our seat E to act
    system.currentAuction.add(new Bid('PASS'));
    system.currentAuction.add(new Bid('1C'));
    system.currentAuction.add(new Bid('PASS'));
  });

  test('Balanced 13 HCP, 3-3 majors, no 4-card support -> 2NT', () => {
    // Shape 3-3-4-3; no 4-card major; not 4+ clubs (avoid simple raise)
    // HCP: S A (4), H J (1), D KQ (5), C K (3) => 13
    const hand = makeHandFromPattern('A32', 'J32', 'KQ32', 'K32');
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2NT');
  });
});
