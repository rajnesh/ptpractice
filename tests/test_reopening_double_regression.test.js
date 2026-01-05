const { makeHandFromPattern } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../assets/js/combined-bidding-system');
const { Bid, Auction } = require('../assets/js/bridge-types');

describe('Regression: Reopening Double (3C opener)', () => {
  test('3C – Pass – Pass should produce a Reopening Double', () => {
    const system = new SAYCBiddingSystem();
    system.startAuction('S');
    // Ensure convention enabled
    system.conventions.config.competitive = system.conventions.config.competitive || {};
    system.conventions.config.competitive.reopening_doubles = { enabled: true };

    system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'S' });
    system.currentAuction.add(new Bid('3C'));
    system.currentAuction.add(new Bid(null));
    system.currentAuction.add(new Bid(null));

    // Hand from the original failing case
    const hand = makeHandFromPattern('QJ3', 'KQ32', 'K32', '32');
    const bid = system.getBid(hand);

    expect(bid && bid.isDouble).toBe(true);
    expect(bid.conventionUsed || '').toMatch(/Reopening Double/);
  });
});
