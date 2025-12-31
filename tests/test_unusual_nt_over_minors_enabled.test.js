const { makeHandFromPattern } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid, Auction } = require('../js/bridge-types');

/**
 * Unusual 2NT over minor openings when explicitly enabled via config.
 * Over 1C: shows D+H (two lowest unbid suits) 5-5.
 * Over 1D: shows C+H (two lowest unbid suits) 5-5.
 */

describe('Unusual NT over minors (enabled)', () => {
  let system;

  beforeEach(() => {
    system = new SAYCBiddingSystem();
    system.startAuction('N');
    // Enable Unusual NT with over_minors
    system.conventions.config.notrump_defenses = system.conventions.config.notrump_defenses || {};
    system.conventions.config.notrump_defenses.unusual_nt = { enabled: true, direct: true, passed_hand: false, over_minors: true };
  });

  test('Over 1C: 5D+5H shape -> 2NT (Unusual)', () => {
  system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'N' });
    system.currentAuction.add(new Bid('1C'));

    const hand = makeHandFromPattern('32', 'KQJ32', 'KQJ32', '32'); // 5 hearts + 5 diamonds
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2NT');
  });

  test('Over 1D: 5C+5H shape -> 2NT (Unusual)', () => {
  system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'N' });
    system.currentAuction.add(new Bid('1D'));

    const hand = makeHandFromPattern('32', 'KQJ32', '32', 'KQJ32'); // 5 hearts + 5 clubs
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2NT');
  });
});
