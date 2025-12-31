const { makeHandFromPattern } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid, Auction } = require('../js/bridge-types');

/**
 * Balancing seat: opponents open at 1-level and it goes Pass-Pass back to us.
 * Ensure we do not pass out with strong balanced hands.
 */

describe('Balancing seat actions with strong balanced hands', () => {
  let system;

  beforeEach(() => {
    system = new SAYCBiddingSystem();
    // Seat-aware: South deals, we are East
    system.currentAuction = new Auction([], { dealer: 'S', ourSeat: 'E' });
  });

  test('After 1C - PASS - PASS, 18 HCP balanced with a club stopper -> 1NT (balancing)', () => {
    system.currentAuction.add(new Bid('1C')); // South opens
    system.currentAuction.add(new Bid(null)); // West passes
    system.currentAuction.add(new Bid(null)); // North passes

    // East: 18 HCP balanced with a club Ace stopper
    const hand = makeHandFromPattern(
      'AK2',  // spades
      'KQ2',  // hearts
      'KQ2',  // diamonds
      'A32'   // clubs (Ace = stopper)
    );

    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('1NT');
    expect((bid.conventionUsed || '').toLowerCase()).toContain('balancing 1nt');
  });

  test('After 1D - PASS - PASS, 18 HCP balanced without a clear diamond stopper -> Double (values)', () => {
    system.currentAuction.add(new Bid('1D')); // South opens
    system.currentAuction.add(new Bid(null)); // West passes
    system.currentAuction.add(new Bid(null)); // North passes

    // East: 18 HCP balanced but weak in diamonds (no A/K/Q-length stopper)
    const hand = makeHandFromPattern(
      'AK2',  // spades
      'KQ2',  // hearts
      'J32',  // diamonds (no stopper by our heuristic)
      'AK2'   // clubs
    );

    const bid = system.getBid(hand);
    expect(!!bid && !!bid.isDouble).toBe(true);
    expect((bid.conventionUsed || '').toLowerCase()).toContain('reopening double');
  });
});
