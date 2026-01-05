const { makeHandFromPattern } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../assets/js/combined-bidding-system');
const { Bid, Auction } = require('../assets/js/bridge-types');

describe('Balancing seat actions after a weak two opening', () => {
  let system;

  beforeEach(() => {
    system = new SAYCBiddingSystem();
    system.startAuction('E');
  });

  test('After 2S - Pass - Pass, 15 HCP balanced hand with stopper -> 2NT', () => {
    system.currentAuction = new Auction([], { dealer: 'S', ourSeat: 'E' });
    system.currentAuction.add(new Bid('2S'));
    system.currentAuction.add(new Bid(null));
    system.currentAuction.add(new Bid(null));

    // East hand: 15 HCP, balanced, spade stopper (A)
    const hand = makeHandFromPattern(
      'AQ2',  // Spades (A stopper)
      'KJ54', // Hearts
      'K32',  // Diamonds
      'Q98'   // Clubs
    );

    const bid = system.getBid(hand);
    expect(bid.token).toBe('2NT');
    expect((bid.conventionUsed || '').toLowerCase()).toContain('balancing 2nt');
  });
});
