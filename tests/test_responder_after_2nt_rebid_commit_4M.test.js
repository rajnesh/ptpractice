const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid } = require('../js/bridge-types');
const { makeHandFromPattern } = require('./test-helpers');

/**
 * After 1C - PASS - 1S - PASS - 2NT, responder with 6+ trumps or an unbalanced hand
 * should commit to 4M instead of 3NT.
 */

describe('Responder after opener 2NT rebid commits to 4M with 6+ or unbalanced', () => {
  test('Sequence 1C-P-1S-P-2NT; North with 6 spades bids 4S', () => {
    const system = new SAYCBiddingSystem();
    system.startAuction('N');
    system.currentAuction.reseat('S');

    // Auction: S 1C, W PASS, N 1S, E PASS, S 2NT
    system.currentAuction.add(new Bid('1C'));
    system.currentAuction.add(new Bid(null));
    system.currentAuction.add(new Bid('1S'));
    system.currentAuction.add(new Bid(null));
    system.currentAuction.add(new Bid('2NT'));

    // North hand: 6 spades, unbalanced; ~11-13 HCP
    // Example: S:KQJ975 H:A3 D:K32 C:2 (~13 HCP, 6-2-3-1)
    const north = makeHandFromPattern('KQJ975', 'A3', 'K32', '2');

    const bid = system.getBid(north);
    expect(bid && bid.token).toBe('4S');
    expect((bid.conventionUsed || '').toLowerCase()).toContain('commit to game in spades');
  });
});
