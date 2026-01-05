const { makeHandFromPattern } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../assets/js/combined-bidding-system');
const { Bid, Auction } = require('../assets/js/bridge-types');

/**
 * Guard: the seat-unknown higher-major 1-level fallback must NOT apply when seat info is present.
 * Seat-aware balancing example after 1H - PASS - PASS: with only a 4-card spade suit and not short in hearts,
 * engine should not use the no-seat 1S fallback.
 */

describe('Seat-aware guard against no-seat higher-major fallback', () => {
  let system;

  beforeEach(() => {
    system = new SAYCBiddingSystem();
    // Provide seat context so no-seat fallback should not be used
    system.currentAuction = new Auction([], { dealer: 'S', ourSeat: 'E' });
  });

  test('After 1H - PASS - PASS, balanced 12 HCP with only 4 spades does not use 1S fallback', () => {
    // Seat-aware sequence: South opens, West passes, North passes; East to act
    system.currentAuction.add(new Bid('1H', { seat: 'S' }));
    system.currentAuction.add(new Bid(null, { seat: 'W' }));
    system.currentAuction.add(new Bid(null, { seat: 'N' }));

    const hand = makeHandFromPattern(
      'KQ32', // 4 spades
      'Q32',  // 3 hearts (not short)
      'K32',  // 3 diamonds
      'Q32'   // 3 clubs
    );

    const bid = system.getBid(hand);
    // The test-only 1S fallback should not trigger in seat-aware context
    expect(!bid || bid.token !== '1S').toBe(true);
  });
});
