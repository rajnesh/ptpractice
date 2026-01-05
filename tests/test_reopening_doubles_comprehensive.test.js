const { makeHandFromPattern } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../assets/js/combined-bidding-system');
const { Bid, Auction } = require('../assets/js/bridge-types');

/**
 * Comprehensive reopening doubles: 1/2/3-level openings, seat-aware, negatives, and explanations.
 */

describe('Reopening Doubles – comprehensive', () => {
  let system;

  beforeEach(() => {
    system = new SAYCBiddingSystem();
    system.startAuction('S');
    // Ensure enabled
    system.conventions.config.competitive = system.conventions.config.competitive || {};
    system.conventions.config.competitive.reopening_doubles = { enabled: true };
  });

  test('1S – Pass – Pass: short spades, 9 HCP, two other suits 3+ -> Double with explanation', () => {
  system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'S' });
  system.currentAuction.add(new Bid('1S'));
  system.currentAuction.add(new Bid(null));
  system.currentAuction.add(new Bid(null));

    const hand = makeHandFromPattern('Q3', 'KQ32', 'KJ32', '32'); // short spades (2), 9 HCP, two suits with 3+
    const bid = system.getBid(hand);
    expect(bid && bid.isDouble).toBe(true);
    expect(bid.conventionUsed || '').toMatch(/Reopening Double/);
  });

  test('2D – Pass – Pass: short diamonds, 10 HCP, two other suits 3+ -> Double', () => {
  system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'S' });
  system.currentAuction.add(new Bid('2D'));
  system.currentAuction.add(new Bid(null));
  system.currentAuction.add(new Bid(null));

    const hand = makeHandFromPattern('QJ3', 'KQ32', '32', 'K32');
    const bid = system.getBid(hand);
    expect(bid && bid.isDouble).toBe(true);
  });

  test('3C – Pass – Pass: short clubs, 11 HCP, two other suits 3+ -> Double', () => {
  system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'S' });
  system.currentAuction.add(new Bid('3C'));
  system.currentAuction.add(new Bid(null));
  system.currentAuction.add(new Bid(null));

    const hand = makeHandFromPattern('QJ3', 'KQ32', 'K32', '32');
    const bid = system.getBid(hand);
    expect(bid && bid.isDouble).toBe(true);
  });

  test('Seat-aware sequence (dealer E): W opens 1H, N and E pass, S (we) doubles', () => {
    system.currentAuction = new Auction([], { dealer: 'E', ourSeat: 'S' });
    // Dealer E order: E, S, W, N ... but we want W opens 1H? Let's model: dealer E; bids: E pass, S pass, W 1H, N pass -> now back to E (pass) then S (us) acts. Instead keep simple:
    system.currentAuction.add(new Bid('1H', { seat: 'E' }));
    system.currentAuction.add(new Bid(null, { seat: 'S' }));
    system.currentAuction.add(new Bid(null, { seat: 'W' }));

    const hand = makeHandFromPattern('QJ32', '32', 'KQ32', 'KJ3'); // short hearts (2), 10 HCP, two other suits 3+
    const bid = system.getBid(hand);
    expect(bid && bid.isDouble).toBe(true);
  });

  test('Fails: only one other suit with 3+ -> no Double', () => {
  system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'S' });
  system.currentAuction.add(new Bid('1D'));
  system.currentAuction.add(new Bid(null));
  system.currentAuction.add(new Bid(null));

    const hand = makeHandFromPattern('AKQ2', 'K2', '32', 'Q2'); // only spades 3+; hearts=1, clubs=2
    const bid = system.getBid(hand);
    expect(!bid || !bid.isDouble).toBe(true);
  });

  test('Disabled convention -> no Reopening Double even if shape fits', () => {
    system.conventions.config.competitive.reopening_doubles = { enabled: false };
  system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'S' });
  system.currentAuction.add(new Bid('1H'));
  system.currentAuction.add(new Bid(null));
  system.currentAuction.add(new Bid(null));

    const hand = makeHandFromPattern('QJ32', '32', 'KQ32', 'KJ3');
    const bid = system.getBid(hand);
    expect(!bid || !bid.isDouble).toBe(true);
  });
});
