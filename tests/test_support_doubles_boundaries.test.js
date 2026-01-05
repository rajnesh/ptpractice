const { makeHandFromPattern } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../assets/js/combined-bidding-system');
const { Bid, Auction } = require('../assets/js/bridge-types');

/**
 * Support Double boundaries: thru 2S by default
 */

describe('Support Double boundaries', () => {
  let system;

  beforeEach(() => {
    system = new SAYCBiddingSystem();
    system.startAuction('N');
    // Ensure support doubles enabled and thru 2S
    system.conventions.config.competitive = system.conventions.config.competitive || {};
    system.conventions.config.competitive.support_doubles = { enabled: true, thru: '2S' };
  });

  test('Applies when overcall is at or below 2S', () => {
  system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'N' });
    system.currentAuction.add(new Bid('1H')); // We opened a major
    system.currentAuction.add(new Bid('1D')); // They overcall at 1-level
    system.currentAuction.add(new Bid('1S')); // Partner bids a new suit at 1-level

  const hand = makeHandFromPattern('Q32', 'Q32', 'Q32', 'KQ2'); // 11 HCP, exactly 3 spades support
    const bid = system.getBid(hand);
    expect(bid && bid.isDouble).toBe(true);
  });

  test('Does not apply beyond 2S (e.g., 3C overcall)', () => {
  system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'N' });
    system.currentAuction.add(new Bid('1H'));
    system.currentAuction.add(new Bid('3C')); // Overcall beyond thru
    system.currentAuction.add(new Bid('1S'));

    const hand = makeHandFromPattern('Q32', 'K32', 'Q32', 'Q32'); // 13 HCP, 3 spades
    const bid = system.getBid(hand);
    expect(!bid || !bid.isDouble).toBe(true);
  });
});
