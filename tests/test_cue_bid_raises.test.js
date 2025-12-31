const { makeTestHand } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid, Auction } = require('../js/bridge-types');

/**
 * Comprehensive tests for Cue-bid Raises (limit+ raises via cue of opponents' suit).
 */

describe('Cue-bid Raises (limit+ strong raises)', () => {
  let system;

  beforeEach(() => {
    system = new SAYCBiddingSystem();
  });

  test('1H (1S) with 4 hearts and 11 HCP -> 2S cue-bid raise with explanation', () => {
    system.startAuction('N');
  system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'N' });
    system.currentAuction.add(new Bid('1H'));
    system.currentAuction.add(new Bid('1S'));

    const hand = makeTestHand(2, 4, 3, 4, 11); // 4 hearts, 11 HCP
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2S');
    expect(bid.conventionUsed || '').toMatch(/Cue Bid Raise/);
  });

  test('1S (2C) with 4 spades and 12 HCP -> 3C cue-bid raise with explanation', () => {
    system.startAuction('N');
  system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'N' });
    system.currentAuction.add(new Bid('1S'));
    system.currentAuction.add(new Bid('2C'));

    const hand = makeTestHand(4, 3, 3, 3, 12); // 4 spades, 12 HCP
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('3C');
    expect(bid.conventionUsed || '').toMatch(/Cue Bid Raise/);
  });

  test('1D (1H) with 4 diamonds and 10 HCP -> 2H cue-bid raise with explanation', () => {
    system.startAuction('N');
  system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'N' });
    system.currentAuction.add(new Bid('1D'));
    system.currentAuction.add(new Bid('1H'));

    const hand = makeTestHand(3, 2, 4, 4, 10); // 4 diamonds, 10 HCP
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2H');
    expect(bid.conventionUsed || '').toMatch(/Cue Bid Raise/);
  });

  test('Insufficient strength (8 HCP) with 4-card support -> no cue-bid raise', () => {
    system.startAuction('N');
  system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'N' });
    system.currentAuction.add(new Bid('1H'));
    system.currentAuction.add(new Bid('1S'));

    const hand = makeTestHand(2, 4, 4, 3, 8);
    const bid = system.getBid(hand);
    // Should not be 2S cue-bid raise with 8 HCP
    expect(!bid || bid.token !== '2S' || (bid.conventionUsed || '') !== 'Cue Bid Raise').toBe(true);
  });

  test('Only 3-card support (12 HCP) -> no cue-bid raise', () => {
    system.startAuction('N');
  system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'N' });
    system.currentAuction.add(new Bid('1H'));
    system.currentAuction.add(new Bid('1S'));

    const hand = makeTestHand(2, 3, 4, 4, 12); // only 3 hearts
    const bid = system.getBid(hand);
    expect(!bid || bid.token !== '2S').toBe(true);
  });

  test('Seat-aware (dealer W, ourSeat S): 1H (E overcalls 1S), South cue-bids 2S with 4 hearts/11 HCP', () => {
    system.startAuction('S');
    system.currentAuction = new Auction([], { dealer: 'W', ourSeat: 'S' });
    // Seats in order from dealer W: W, N, E, S
    system.currentAuction.add(new Bid('1H', { seat: 'N' })); // partner opened 1H
    system.currentAuction.add(new Bid('1S', { seat: 'E' })); // opponent overcalls 1S
    // Now it's South's turn

    const hand = makeTestHand(2, 4, 3, 4, 11);
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2S');
    expect(bid.conventionUsed || '').toMatch(/Cue Bid Raise/);
  });

  test('Convention disabled: no cue-bid raise when cue_bid_raises is off', () => {
    system.conventions.config.competitive = system.conventions.config.competitive || {};
    system.conventions.config.competitive.cue_bid_raises = { enabled: false };
    system.startAuction('N');

  system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'N' });
    system.currentAuction.add(new Bid('1H'));
    system.currentAuction.add(new Bid('1S'));
    const hand = makeTestHand(2, 4, 3, 4, 12);
    const bid = system.getBid(hand);
    // Should not cue-bid raise 2S when convention disabled
    expect(!bid || bid.token !== '2S' || (bid.conventionUsed || '') !== 'Cue Bid Raise').toBe(true);
  });
});
