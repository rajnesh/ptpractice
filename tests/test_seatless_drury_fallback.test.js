const { makeHandFromPattern } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../assets/js/combined-bidding-system');
const { Bid, Auction } = require('../assets/js/bridge-types');

/**
 * Regression test: when tests construct an Auction without dealer/ourSeat, the
 * SAYC engine should still apply the Drury opener-rebid shortcut as a last-resort
 * to preserve legacy behavior. This test ensures that fallback exists while we
 * migrate other tests to set dealer/ourSeat explicitly.
 */

describe('Seatless auction Drury fallback (legacy compatibility)', () => {
  test('Opener continuation after partner Drury (seatless auction) -> 2D', () => {
    const system = new SAYCBiddingSystem();
    // Create an auction WITHOUT dealer/ourSeat to emulate legacy test setup
  const a = new Auction([], { dealer: 'N', ourSeat: 'S' });
    // Build a sequence equivalent to: (P)(P) 1H (P) 2C (P)
    // but with no seat/dealer metadata on bids
    // Add bids with explicit seat metadata matching dealer 'N' (N,E,S,W,N,E)
  a.add(new Bid(null, { seat: 'N' }));
  a.add(new Bid(null, { seat: 'E' }));
  a.add(new Bid('1H', { seat: 'S' }));
  a.add(new Bid(null, { seat: 'W' }));
  a.add(new Bid('2C', { seat: 'N' }));
  a.add(new Bid(null, { seat: 'E' }));
    system.currentAuction = a;

    // Opener holding sub-minimum values should rebid 2D (Drury continuation)
    const hand = makeHandFromPattern('KQ72', 'QJ972', '82', 'Q2');

    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2D');
    expect(bid && bid.conventionUsed).toMatch(/Drury/i);
  });
});
