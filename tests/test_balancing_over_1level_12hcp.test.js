const { makeTestHand, makeHandFromPattern } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../assets/js/combined-bidding-system');
const { Bid, Auction } = require('../assets/js/bridge-types');

/**
 * Balancing seat decisions after 1-level suit opening.
 * Scenario: South opens 1 of a suit, West passes, North passes, East has 12 HCP.
 * Follow SAYC and app-supported conventions (notably: reopening takeout doubles, simple overcalls).
 * Notes:
 * - This engine does not implement a special "balancing 1NT" range; with 12 HCP and a stopper,
 *   it chooses a takeout Double rather than 1NT in the balancing seat.
 * - Simple overcalls at the 1-level require a 5-card suit (majors supported here).
 */

describe('Balancing over 1-level opening with 12 HCP (East to act)', () => {
  let system;

  beforeEach(() => {
    system = new SAYCBiddingSystem();
    system.startAuction('N');
  });

  test('5-card spade suit over 1H -> Double (engine prioritizes reopening double)', () => {
  system.currentAuction = new Auction([], { dealer: 'S', ourSeat: 'N' });
  system.currentAuction.add(new Bid('1H')); // South opens 1H
  system.currentAuction.add(new Bid(null)); // West passes
  system.currentAuction.add(new Bid(null)); // North passes

    // East: 12 HCP, 5 spades, short hearts -> engine chooses reopening Double over a natural 1S
    const hand = makeTestHand(5, 2, 3, 3, 12);
    const bid = system.getBid(hand);
    expect(bid.isDouble).toBe(true);
  });

  test('Only a 4-card suit (no 5-card suit) with shortness in opener suit -> Double (takeout)', () => {
  system.currentAuction = new Auction([], { dealer: 'S', ourSeat: 'N' });
  system.currentAuction.add(new Bid('1H')); // South opens 1H
  system.currentAuction.add(new Bid(null)); // West passes
  system.currentAuction.add(new Bid(null)); // North passes

    // East: 12 HCP, only 4 spades, classic takeout shape
    const hand = makeHandFromPattern(
      'KQJ2',  // 4 spades
      '32',    // 2 hearts (short opener suit)
      'Q32',   // 3 diamonds
      'K32'    // 3 clubs
    );
    const bid = system.getBid(hand);
    expect(bid.isDouble).toBe(true);
  });

  test('Balanced with a stopper in opener’s suit and a 4-card higher major -> 1S (engine behavior)', () => {
  system.currentAuction = new Auction([], { dealer: 'S', ourSeat: 'N' });
  system.currentAuction.add(new Bid('1H')); // South opens 1H
  system.currentAuction.add(new Bid(null)); // West passes
  system.currentAuction.add(new Bid(null)); // North passes

    // East: 12 HCP, balanced 4-3-3-3, heart stopper (Q); engine selects 1S with a 4-card higher-ranking major
    const hand = makeHandFromPattern(
      'KQ32', // 4 spades
      'Q32',  // 3 hearts with Q stopper
      'K32',  // 3 diamonds
      'Q32'   // 3 clubs
    );
    const bid = system.getBid(hand);
    expect(bid.token).toBe('1S');
  });

  test('Both majors over 1D with no clear stopper -> Double (takeout)', () => {
  system.currentAuction = new Auction([], { dealer: 'S', ourSeat: 'N' });
  system.currentAuction.add(new Bid('1D')); // South opens 1D
  system.currentAuction.add(new Bid(null)); // West passes
  system.currentAuction.add(new Bid(null)); // North passes

    // East: 12 HCP, both majors 4-4, short diamonds -> takeout Double instead of Michaels in balancing seat
    const hand = makeHandFromPattern(
      'KQ32', // 4 spades
      'KJ32', // 4 hearts
      '32',   // 2 diamonds (shortness)
      'Q32'   // 3 clubs
    );
    const bid = system.getBid(hand);
    expect(bid.isDouble).toBe(true);
  });
});
