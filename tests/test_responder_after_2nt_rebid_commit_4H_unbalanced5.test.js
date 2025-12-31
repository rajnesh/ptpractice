const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid } = require('../js/bridge-types');
const { makeHandFromPattern } = require('./test-helpers');

/**
 * After 1D - PASS - 1H - PASS - 2NT, responder with an unbalanced hand and only 5 hearts
 * (e.g., 5-4-3-1) should commit to 4H instead of 3NT.
 */

describe('Responder after opener 2NT rebid commits to 4H with unbalanced 5 hearts', () => {
  test('Sequence 1D-P-1H-P-2NT; North with 5 hearts and unbalanced shape bids 4H', () => {
    const system = new SAYCBiddingSystem();
    system.startAuction('N');
    system.currentAuction.reseat('S');

    // Auction: S 1D, W PASS, N 1H, E PASS, S 2NT
    system.currentAuction.add(new Bid('1D'));
    system.currentAuction.add(new Bid(null));
    system.currentAuction.add(new Bid('1H'));
    system.currentAuction.add(new Bid(null));
    system.currentAuction.add(new Bid('2NT'));

    // North hand: 5 hearts, clearly unbalanced (5-4-3-1), ~12 HCP
    // Example: S:KQ3 H:KQJ54 D:Q32 C:2
    const north = makeHandFromPattern('KQ3', 'KQJ54', 'Q32', '2');

    const bid = system.getBid(north);
    expect(bid && bid.token).toBe('4H');
    expect((bid.conventionUsed || '').toLowerCase()).toContain('commit to game in hearts');
  });
});
