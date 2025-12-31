const { makeTestHand } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid, Auction } = require('../js/bridge-types');

/**
 * Additional variants for cue-bid raises (minors, higher overcall levels).
 */

describe('Cue-bid Raises – minor openings and higher-level overcalls', () => {
  let system;

  beforeEach(() => {
    system = new SAYCBiddingSystem();
    system.startAuction('N');
  });

  test('1C (1H) with 4 clubs and 11 HCP -> 2H cue-bid raise', () => {
  system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'N' });
    system.currentAuction.add(new Bid('1C'));
    system.currentAuction.add(new Bid('1H'));

    const hand = makeTestHand(3, 2, 4, 4, 11); // 4 clubs
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2H');
    expect(bid.conventionUsed || '').toMatch(/Cue Bid Raise/);
  });

  test('1D (2H) with 4 diamonds and 12 HCP -> 3H cue-bid raise', () => {
  system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'N' });
    system.currentAuction.add(new Bid('1D'));
    system.currentAuction.add(new Bid('2H'));

    const hand = makeTestHand(3, 2, 4, 4, 12);
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('3H');
    expect(bid.conventionUsed || '').toMatch(/Cue Bid Raise/);
  });

  test('1S (2D) with 4 spades and 10 HCP -> 3D cue-bid raise', () => {
  system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'N' });
    system.currentAuction.add(new Bid('1S'));
    system.currentAuction.add(new Bid('2D'));

    const hand = makeTestHand(4, 3, 3, 3, 10);
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('3D');
    expect(bid.conventionUsed || '').toMatch(/Cue Bid Raise/);
  });
});
