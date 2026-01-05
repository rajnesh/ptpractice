const { Hand, Bid, Auction } = require('../assets/js/bridge-types');
const { SAYCBiddingSystem } = require('../assets/js/combined-bidding-system');

global.window = global.window || {};
window.Hand = Hand;
window.Bid = Bid;
window.Auction = Auction;
window.SUITS = ['C','D','H','S'];

test('North makes takeout double after S:Pass, W:1H with 16 HCP, short hearts', () => {
  const system = new SAYCBiddingSystem();
  system.startAuction('N');

  system.currentAuction = new Auction([], { dealer: 'S', ourSeat: 'N' });
  system.currentAuction.add(new Bid(null)); // S: PASS
  system.currentAuction.add(new Bid('1H')); // W: 1H

  // Short hearts (singleton), 16 HCP, other suits 4+ so classic takeout double
  const north = new Hand('KQ92 2 AJ85 QJ54');

  const bid = system.getBid(north);
  expect(bid).toBeTruthy();
  expect(bid.isDouble).toBe(true);
});
