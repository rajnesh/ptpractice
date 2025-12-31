const { makeTestHand } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid } = require('../js/bridge-types');

/**
 * Negative doubles after our opening and their overcall.
 * We verify behavior across HCP ranges and major suit distributions.
 */

describe('Negative Doubles after overcall', () => {
  let system;

  beforeEach(() => {
    system = new SAYCBiddingSystem();
    system.startAuction('N');
    // Ensure negative doubles are enabled (default is true)
    system.conventions.config.competitive = system.conventions.config.competitive || {};
    system.conventions.config.competitive.negative_doubles = { enabled: true, thru_level: 3 };
  });

  test('6 HCP with one 4-card major (hearts) over 1C - 1S -> Double', () => {
    system.currentAuction.add(new Bid('1C')); // Partner opens minor
    system.currentAuction.add(new Bid('1S')); // RHO overcalls spades
    const hand = makeTestHand(2, 4, 4, 3, 6); // 4 hearts
    const bid = system.getBid(hand);
    expect(bid.isDouble).toBe(true);
  });

  test('8 HCP with one 4-card major (hearts) over 1C - 1S -> Double', () => {
    system.currentAuction = new (require('../js/bridge-types').Auction)();
    system.currentAuction.add(new Bid('1C'));
    system.currentAuction.add(new Bid('1S'));
    const hand = makeTestHand(2, 4, 4, 3, 8); // 4 hearts
    const bid = system.getBid(hand);
    expect(bid.isDouble).toBe(true);
  });

  test('10 HCP with one 4-card major (hearts) over 1C - 2S -> Double', () => {
    system.currentAuction = new (require('../js/bridge-types').Auction)();
    system.currentAuction.add(new Bid('1C'));
    system.currentAuction.add(new Bid('2S'));
    const hand = makeTestHand(2, 4, 4, 3, 10); // 4 hearts
    const bid = system.getBid(hand);
    expect(bid.isDouble).toBe(true);
  });

  test('12 HCP with one 4-card major (hearts) over 1C - 2S -> Double', () => {
    system.currentAuction = new (require('../js/bridge-types').Auction)();
    system.currentAuction.add(new Bid('1C'));
    system.currentAuction.add(new Bid('2S'));
    const hand = makeTestHand(2, 4, 4, 3, 12); // 4 hearts
    const bid = system.getBid(hand);
    expect(bid.isDouble).toBe(true);
  });

  test('16 HCP with 4 hearts over 1C - 1S -> Negative Double (responder should not pass)', () => {
    system.currentAuction = new (require('../js/bridge-types').Auction)();
    system.currentAuction.add(new Bid('1C'));
    system.currentAuction.add(new Bid('1S'));
    const hand = makeTestHand(2, 4, 4, 3, 16);
    const bid = system.getBid(hand);
    expect(bid && bid.isDouble).toBe(true);
  });

  test('Both 4-card majors over 1C - 1D -> Double (shows both majors)', () => {
    system.currentAuction = new (require('../js/bridge-types').Auction)();
    system.currentAuction.add(new Bid('1C'));
    system.currentAuction.add(new Bid('1D'));
    const hand = makeTestHand(4, 4, 3, 2, 8); // 4-4 majors
    const bid = system.getBid(hand);
    expect(bid.isDouble).toBe(true);
  });

  test('No 4-card major over 1C - 1S -> Not a Double', () => {
    system.currentAuction = new (require('../js/bridge-types').Auction)();
    system.currentAuction.add(new Bid('1C'));
    system.currentAuction.add(new Bid('1S'));
    const hand = makeTestHand(3, 3, 4, 3, 10); // No 4-card major
    const bid = system.getBid(hand);
    expect(bid.isDouble).toBe(false);
  });

  test('5-card major biddable at 1-level over 1C - 1D -> Natural 1S, not Double', () => {
    // Use seat context so responder logic is applied before interference
    system.startAuction('N');
    system.currentAuction.reseat('N');
    system.currentAuction.add(new Bid('1C'));
    system.currentAuction.add(new Bid('1D'));
    const hand = makeTestHand(5, 3, 3, 2, 10); // 5 spades
    const bid = system.getBid(hand);
    expect(bid.isDouble).toBe(false);
    expect(bid.token).toBe('1S');
  });

  test('5-card major not biddable at 1-level over 1C - 1S -> Double', () => {
    system.currentAuction = new (require('../js/bridge-types').Auction)();
    system.currentAuction.add(new Bid('1C'));
    system.currentAuction.add(new Bid('1S'));
    const hand = makeTestHand(2, 5, 3, 3, 10); // 5 hearts; cannot bid 1H at this point
    const bid = system.getBid(hand);
    expect(bid.isDouble).toBe(true);
  });
});
