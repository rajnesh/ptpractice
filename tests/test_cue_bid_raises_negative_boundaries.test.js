const { makeTestHand } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid, Auction } = require('../js/bridge-types');

/**
 * Negative and boundary tests to ensure cue-bid raise preconditions hold.
 */

describe('Cue-bid Raises – negative and boundary cases', () => {
  let system;

  beforeEach(() => {
    system = new SAYCBiddingSystem();
    system.startAuction('N');
  });

  test('1H (1S) with 4 hearts but 9 HCP -> do not cue-bid raise', () => {
  system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'N' });
    system.currentAuction.add(new Bid('1H'));
    system.currentAuction.add(new Bid('1S'));
    const hand = makeTestHand(2, 4, 4, 3, 9);
    const bid = system.getBid(hand);
    expect(!bid || bid.token !== '2S').toBe(true);
  });

  test('1S (1NT) opponent overcall not at suit level -> not treated as cue-bid raise', () => {
  system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'N' });
    system.currentAuction.add(new Bid('1S'));
    system.currentAuction.add(new Bid('1NT'));

    const hand = makeTestHand(4, 3, 3, 3, 12);
    const bid = system.getBid(hand);
    // Should not mark as a cue-bid raise in any case
    expect(!bid || (bid.conventionUsed || '') !== 'Cue Bid Raise').toBe(true);
  });

  test('1H (2S) with only 3 hearts and 12 HCP -> no cue-bid raise to 3S', () => {
  system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'N' });
    system.currentAuction.add(new Bid('1H'));
    system.currentAuction.add(new Bid('2S'));

    const hand = makeTestHand(3, 3, 4, 3, 12);
    const bid = system.getBid(hand);
    expect(!bid || bid.token !== '3S').toBe(true);
  });
});
