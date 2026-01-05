const { makeHandFromPattern } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../assets/js/combined-bidding-system');
const { Bid, Auction } = require('../assets/js/bridge-types');

/**
 * Responsive Double boundaries via thru_level
 */

describe('Responsive Double boundaries', () => {
  let system;

  beforeEach(() => {
    system = new SAYCBiddingSystem();
    system.startAuction('N');
    system.conventions.config.competitive = system.conventions.config.competitive || {};
    system.conventions.config.competitive.responsive_doubles = { enabled: true, thru_level: 2 };
    // Disable negative doubles to isolate responsive double behavior
    system.conventions.config.competitive.negative_doubles = { enabled: false, thru_level: 3 };
  });

  test('Allowed at or below thru_level', () => {
  system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'N' });
    system.currentAuction.add(new Bid('1C')); // We opened minor
    system.currentAuction.add(new Bid('X', { isDouble: true })); // They double
    system.currentAuction.add(new Bid('2C')); // Partner raises

    const hand = makeHandFromPattern('Q32', 'KQ32', 'Q32', '32');
    const bid = system.getBid(hand);
    expect(bid && bid.isDouble).toBe(true);
  });

  test('Disallowed beyond thru_level', () => {
  system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'N' });
    system.currentAuction.add(new Bid('1C'));
    system.currentAuction.add(new Bid('X', { isDouble: true }));
    system.currentAuction.add(new Bid('3C')); // Beyond thru_level

    const hand = makeHandFromPattern('Q32', 'KQ32', 'Q32', '32');
    const bid = system.getBid(hand);
    expect(!bid || !bid.isDouble).toBe(true);
  });
});
