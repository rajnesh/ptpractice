const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid, Auction, Hand } = require('../js/bridge-types');

/**
 * Repro for auction: S Pass, W Pass, N 1S, E ?
 * East, with classic takeout-double shape and values, should not pass.
 */
describe('East action over North 1S after two passes (direct seat)', () => {
  let system;

  beforeEach(() => {
    system = new SAYCBiddingSystem();
    system.startAuction('E');
    system.currentAuction = new Auction([], { dealer: 'S', ourSeat: 'E' });
  });

  test('East makes a takeout double with short spades and 11 HCP', () => {
    // Auction: S Pass, W Pass, N 1S, E ?
    system.currentAuction.add(new Bid('PASS')); // S
    system.currentAuction.add(new Bid('PASS')); // W
    system.currentAuction.add(new Bid('1S'));   // N

    // East hand: short spades, support for other suits, and ~11 HCP
    // Example: S:Qx H:KQxx D:KQxx C:xx => 12 HCP, 2 spades, at least 3 in two other suits
    const hand = new Hand({
      S: [{ rank: 'Q', suit: 'S' }, { rank: '2', suit: 'S' }],
      H: [{ rank: 'K', suit: 'H' }, { rank: 'Q', suit: 'H' }, { rank: '7', suit: 'H' }, { rank: '4', suit: 'H' }],
      D: [{ rank: 'K', suit: 'D' }, { rank: 'Q', suit: 'D' }, { rank: '8', suit: 'D' }, { rank: '3', suit: 'D' }],
      C: [{ rank: '7', suit: 'C' }, { rank: '5', suit: 'C' }]
    });

    const bid = system.getBid(hand);
    // Expect classic takeout double over 1S
    expect(bid).toBeTruthy();
    expect(bid.isDouble).toBe(true);
  });

  test('East overcalls naturally with a 5-card suit and 12+ HCP', () => {
    system.currentAuction.add(new Bid('PASS')); // S
    system.currentAuction.add(new Bid('PASS')); // W
    system.currentAuction.add(new Bid('1S'));   // N

    // East hand: 5+ diamonds, 12 HCP, suitable for 2D overcall
    const hand = new Hand({
      S: [{ rank: '4', suit: 'S' }, { rank: '3', suit: 'S' }],
      H: [{ rank: 'Q', suit: 'H' }, { rank: '3', suit: 'H' }, { rank: '2', suit: 'H' }],
      D: [
        { rank: 'A', suit: 'D' }, { rank: 'K', suit: 'D' }, { rank: 'Q', suit: 'D' },
        { rank: '9', suit: 'D' }, { rank: '5', suit: 'D' }
      ],
      C: [{ rank: 'J', suit: 'C' }, { rank: '8', suit: 'C' }, { rank: '2', suit: 'C' }]
    });

    const bid = system.getBid(hand);
    expect(bid).toBeTruthy();
    expect(bid.token === '2D' || bid.isDouble).toBe(true);
  });

  test('East makes a takeout double with exactly 11 HCP and classic shape', () => {
    // Auction: S Pass, W Pass, N 1S, E ?
    system.currentAuction = new Auction([], { dealer: 'S', ourSeat: 'E' });
    system.currentAuction.add(new Bid('PASS')); // S
    system.currentAuction.add(new Bid('PASS')); // W
    system.currentAuction.add(new Bid('1S'));   // N

    // 11 HCP, short spades (2), 3+ in two other suits
    // S: Qx (2 HCP), H: KQxx (5 HCP), D: KJxx (4 HCP), C: xx (0) => 11
    const hand = new Hand({
      S: [{ rank: 'Q', suit: 'S' }, { rank: '4', suit: 'S' }],
      H: [{ rank: 'K', suit: 'H' }, { rank: 'Q', suit: 'H' }, { rank: '8', suit: 'H' }, { rank: '3', suit: 'H' }],
      D: [{ rank: 'K', suit: 'D' }, { rank: 'J', suit: 'D' }, { rank: '7', suit: 'D' }, { rank: '2', suit: 'D' }],
      C: [{ rank: '8', suit: 'C' }, { rank: '4', suit: 'C' }]
    });

    const bid = system.getBid(hand);
    expect(bid).toBeTruthy();
    expect(bid.isDouble).toBe(true);
    // Explanation should include the relaxed direct-seat hint for learners
    expect(bid.conventionUsed || '').toContain('direct seat after two passes');
  });
});
