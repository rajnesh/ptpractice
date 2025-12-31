const { makeHandFromPattern } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid, Auction } = require('../js/bridge-types');

/**
 * Responder NT ranges when Jacoby 2NT disabled, balanced and <4-card support:
 * - 10–11 HCP -> 1NT
 * - 12–14 HCP -> 2NT
 */

describe('Responder NT ranges over 1M (Jacoby disabled)', () => {
  let system;

  beforeEach(() => {
    system = new SAYCBiddingSystem();
    system.startAuction('N');
    system.conventions.config.responses = system.conventions.config.responses || {};
    system.conventions.config.responses.jacoby_2nt = { enabled: false };
  });

  test('10–11 HCP balanced, no 4-card support -> 1NT', () => {
  // Dealer N, we are responder (S) — partner is N
  system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'S' });
    system.currentAuction.add(new Bid('1H'));
    // 10 HCP, balanced 4-3-3-3
    const hand = makeHandFromPattern('K32', 'Q32', 'Q32', 'K32'); // 10 HCP
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('1NT');
  });

  test('12–14 HCP balanced, no 4-card support -> 2NT', () => {
  // Dealer N, we are responder (S) — partner is N
  system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'S' });
    system.currentAuction.add(new Bid('1S'));
    const hand = makeHandFromPattern('KQ2', 'K32', 'Q32', 'Q32'); // 12 HCP, balanced
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2NT');
  });
});
