const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid, Auction } = require('../js/bridge-types');
const { makeTestHand } = require('./test-helpers');

/**
 * Verify suit-specific explanation strings for Negative Doubles.
 */

describe('Negative Double explanation strings', () => {
  test('1C - (1S) - X => shows hearts', () => {
    const system = new SAYCBiddingSystem();
    system.startAuction('N');
    // Ensure Negative Doubles are enabled and within range
    system.conventions.config.competitive = system.conventions.config.competitive || {};
    system.conventions.config.competitive.negative_doubles = { enabled: true, thru_level: 3 };
  // Use seat-unknown context (no dealer reseat) like other negative-double tests
  system.currentAuction = new Auction([], { dealer: 'S', ourSeat: 'N' });
    system.currentAuction.add(new Bid('1C')); // South opens
    system.currentAuction.add(new Bid('1S')); // West overcalls spades

    // North hand: 4 hearts, no 5-card major
    const north = makeTestHand(2, 4, 4, 3, 12);
    const bid = system.getBid(north);
    expect(bid && bid.isDouble).toBe(true);
    const expl = bid.conventionUsed || '';
    expect(expl).toMatch(/Negative Double/i);
    expect(expl).toMatch(/shows hearts/i);
  });

  test('1C - (1D) - X => shows hearts and spades', () => {
    const system = new SAYCBiddingSystem();
    system.startAuction('N');
    system.conventions.config.competitive = system.conventions.config.competitive || {};
    system.conventions.config.competitive.negative_doubles = { enabled: true, thru_level: 3 };
  system.currentAuction = new Auction([], { dealer: 'S', ourSeat: 'N' });
    system.currentAuction.add(new Bid('1C'));
    system.currentAuction.add(new Bid('1D'));

    // North hand: 4-4 majors
    const north = makeTestHand(4, 4, 3, 2, 10);
    const bid = system.getBid(north);
    expect(bid && bid.isDouble).toBe(true);
    const expl = bid.conventionUsed || '';
    expect(expl).toMatch(/Negative Double/i);
    expect(expl).toMatch(/hearts and spades/i);
  });
});
