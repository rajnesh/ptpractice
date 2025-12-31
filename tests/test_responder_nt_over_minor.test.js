const { makeHandFromPattern } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid, Auction } = require('../js/bridge-types');

/**
 * Responder NT choices over minor openings (no interference), balanced with no 4-card major:
 * - 10–11 HCP -> 1NT
 * - 12–14 HCP -> 2NT
 * - 15+ HCP -> 3NT
 */

describe('Responder NT over minor openings (balanced, no 4-card major)', () => {
  let system;

  beforeEach(() => {
    system = new SAYCBiddingSystem();
    system.startAuction('E');
    system.currentAuction.reseat('S');
  });

  function setup1D() {
    system.currentAuction.add(new Bid(null)); // S PASS
    system.currentAuction.add(new Bid('1D')); // W opens 1D
    system.currentAuction.add(new Bid(null)); // N PASS
  }

  test('1D, responder 11 HCP balanced, no 4-card major -> 1NT', () => {
    setup1D();
    const eastHand = makeHandFromPattern('K32', 'Q32', 'Q32', 'K32'); // 10 HCP actually; adjust to 11
    // Tweak to 11 HCP: replace one Q with K
    const hand = makeHandFromPattern('K32', 'K32', 'Q32', 'K32'); // 11 HCP, 4-3-3-3, no 4-card major
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('1NT');
  });

  test('1D, responder 12 HCP balanced, no 4-card major -> 2NT', () => {
    setup1D();
    const hand = makeHandFromPattern('KQ2', 'K32', 'Q32', 'Q32'); // 12 HCP, 4-3-3-3
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2NT');
  });

  test('1D, responder 15 HCP balanced, no 4-card major -> 3NT', () => {
    setup1D();
    const hand = makeHandFromPattern('AK2', 'KJ2', 'Q32', 'Q32'); // 15 HCP (7+4+2+2), 4-3-3-3
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('3NT');
  });
});
