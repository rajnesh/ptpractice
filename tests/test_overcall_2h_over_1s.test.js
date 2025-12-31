const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid } = require('../js/bridge-types');
const { makeHandFromPattern } = require('./test-helpers');

/**
 * East should overcall 2H over North's 1S with 15 HCP and 5 hearts.
 * Sequence: South PASS, West PASS, North 1S, East ? -> 2H
 */

describe('Natural 2H overcall over 1S opening after two passes', () => {
  test('E with 15 HCP and 5 hearts bids 2H', () => {
    const system = new SAYCBiddingSystem();
    system.startAuction('E');
    // Dealer South for clarity; set turn order S,W,N,E
    system.currentAuction.reseat('S');

    // South PASS, West PASS, North 1S
    system.currentAuction.add(new Bid(null)); // S PASS
    system.currentAuction.add(new Bid(null)); // W PASS
    system.currentAuction.add(new Bid('1S')); // N 1S opening

    // East hand: 5 hearts, 15 HCP, balanced-ish
    const east = makeHandFromPattern('Q32', 'AKT75', 'QJ3', 'Q2'); // ~15 HCP, 5 hearts

    const bid = system.getBid(east);
    expect(bid && bid.token).toBe('2H');
  });
});
