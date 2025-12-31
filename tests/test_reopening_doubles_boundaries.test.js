const { makeHandFromPattern } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid, Auction } = require('../js/bridge-types');

/**
 * Reopening double behavior: after opponent's 1-level suit opening and two passes.
 */

describe('Reopening Double behavior', () => {
  let system;

  beforeEach(() => {
    system = new SAYCBiddingSystem();
    system.startAuction('N');
    // Ensure reopening doubles are enabled
    system.conventions.config.competitive = system.conventions.config.competitive || {};
    system.conventions.config.competitive.reopening_doubles = { enabled: true };
  });

  test('With 8+ HCP, short in their suit, and two other suits 3+ -> Double', () => {
  system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'N' });
    system.currentAuction.add(new Bid('1D')); // Opponents open
    system.currentAuction.add(new Bid(null)); // Pass
    system.currentAuction.add(new Bid(null)); // Pass

    // Short in diamonds (2), 3+ in two other suits, 9 HCP
    const hand = makeHandFromPattern('QJ32', 'KQ3', '32', 'J32');
    const bid = system.getBid(hand);
    expect(bid && bid.isDouble).toBe(true);
  });

  test('Too few HCP (6) -> no reopening double', () => {
  system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'N' });
    system.currentAuction.add(new Bid('1H'));
    system.currentAuction.add(new Bid(null));
    system.currentAuction.add(new Bid(null));

    const hand = makeHandFromPattern('K32', '32', 'Q32', 'J32'); // 6 HCP, short hearts
    const bid = system.getBid(hand);
    expect(!bid || !bid.isDouble).toBe(true);
  });

  test('Not short in their suit (3 hearts) -> no reopening double', () => {
  system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'N' });
    system.currentAuction.add(new Bid('1H'));
    system.currentAuction.add(new Bid(null));
    system.currentAuction.add(new Bid(null));

    const hand = makeHandFromPattern('QJ3', 'QJ3', 'Q32', 'Q2'); // 3 hearts (not short)
    const bid = system.getBid(hand);
    expect(!bid || !bid.isDouble).toBe(true);
  });
});
