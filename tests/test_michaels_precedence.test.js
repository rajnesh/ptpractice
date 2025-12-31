const { Hand, Bid, Auction } = require('../js/bridge-types');
const { SAYCBiddingSystem } = require('../js/combined-bidding-system');

// Ensure global window is available for constructors used in engine
global.window = global.window || {};
window.Hand = Hand;
window.Bid = Bid;
window.Auction = Auction;
window.SUITS = ['C','D','H','S'];

/**
 * Ensure that when opponents open 1C (seatless/auto-assigned) and we hold
 * 5-5 in the majors, the system prefers the Michaels 2C conventional over
 * a natural 1-level overcall (e.g. 1S).
 */
test('Michaels (2C) preferred over natural 1-level when holding 5-5 majors vs 1C opener', () => {
  const system = new SAYCBiddingSystem();
  system.startAuction('N');

  // Seat-aware auction: dealer South; sequence: S PASS, W 1C, N to act
  system.currentAuction = new Auction([], { dealer: 'S', ourSeat: 'N' });
  system.currentAuction.add(new Bid(null));       // S: PASS
  system.currentAuction.add(new Bid('1C'));       // W: 1C

  // Hand: Spades 5, Hearts 5, Diamonds 2, Clubs 1 (5-5 in majors)
  const north = new Hand('AKQJ9 AKQJ9 32 4');

  const bid = system.getBid(north);
  expect(bid).toBeTruthy();
  // Expect a Michaels cue-bid over clubs (2C)
  expect(bid.token).toBe('2C');
  expect(bid.conventionUsed).toMatch(/Michaels/i);
});
