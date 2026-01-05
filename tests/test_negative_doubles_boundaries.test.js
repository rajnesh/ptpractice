const { makeHandFromPattern } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../assets/js/combined-bidding-system');
const { Bid, Auction } = require('../assets/js/bridge-types');

/**
 * Negative Double boundaries via thru_level
 */

describe('Negative Double boundaries', () => {
  let system;

  beforeEach(() => {
    system = new SAYCBiddingSystem();
    system.startAuction('N');
    system.conventions.config.competitive = system.conventions.config.competitive || {};
    system.conventions.config.competitive.negative_doubles = { enabled: true, thru_level: 2 };
  });

  test('Allowed at or below thru_level (2-level)', () => {
  system.currentAuction = new Auction([], { dealer: 'S', ourSeat: 'N' });
  system.currentAuction.add(new Bid('1C')); // Partner opened
  system.currentAuction.add(new Bid('2S')); // They overcall at 2-level

    const hand = makeHandFromPattern('Q32', 'KQ32', 'Q32', '32'); // 4 hearts, 10+ HCP
    const bid = system.getBid(hand);
    expect(bid && bid.isDouble).toBe(true);
  });

  test('Disallowed beyond thru_level (3-level)', () => {
  system.currentAuction = new Auction([], { dealer: 'S', ourSeat: 'N' });
  system.currentAuction.add(new Bid('1C'));
  system.currentAuction.add(new Bid('3S')); // Overcall beyond thru_level

    const hand = makeHandFromPattern('Q32', 'KQ32', 'Q32', '32');
    const bid = system.getBid(hand);
    expect(!bid || !bid.isDouble).toBe(true);
  });
});
