const { Hand, Bid, Auction } = require('../js/bridge-types');
const { SAYCBiddingSystem } = require('../js/combined-bidding-system');

// Ensure global window is available for constructors used in engine
global.window = global.window || {};
window.Hand = Hand;
window.Bid = Bid;
window.Auction = Auction;
window.SUITS = ['C','D','H','S'];

/**
 * Repro for: South passes, West opens 1H, North (15 HCP balanced) should not pass.
 * Expect a 1NT overcall with a balanced 15–18 and hearts length >= 2.
 */
test('North overcalls 1NT after S:Pass, W:1H with 15 HCP balanced', () => {
  const system = new SAYCBiddingSystem();
  system.startAuction('N');

  // Seat-aware auction: dealer South; sequence: S PASS, W 1H, N to act
  system.currentAuction = new Auction([], { dealer: 'S', ourSeat: 'N' });
  system.currentAuction.add(new Bid(null));       // S: PASS
  system.currentAuction.add(new Bid('1H'));       // W: 1H

  const north = new Hand('KQ74 A74 QJ7 K74'); // 4-3-3-3, 15 HCP, hearts length 3

  const bid = system.getBid(north);
  expect(bid).toBeTruthy();
  expect(bid.token).toBe('1NT');
});
