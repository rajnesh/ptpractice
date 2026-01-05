const { SAYCBiddingSystem } = require('../assets/js/combined-bidding-system');
const { Bid } = require('../assets/js/bridge-types');
const { makeHandFromPattern } = require('./test-helpers');

/**
 * After 1C - PASS - 1H - PASS - 2NT, responder (North) with a balanced hand
 * and only a 5-card heart suit should prefer 3NT, allowing opener to correct to 4H
 * with 3-card support.
 */

describe('Responder after opener 2NT rebid prefers 3NT with only 5-card hearts', () => {
  test('Sequence 1C-P-1H-P-2NT; North balanced 5 hearts chooses 3NT', () => {
    const system = new SAYCBiddingSystem();
    system.startAuction('N');
    system.currentAuction.reseat('S');

    // Auction: S 1C, W PASS, N 1H, E PASS, S 2NT
    system.currentAuction.add(new Bid('1C'));
    system.currentAuction.add(new Bid(null));
    system.currentAuction.add(new Bid('1H'));
    system.currentAuction.add(new Bid(null));
    system.currentAuction.add(new Bid('2NT'));

    // North hand: balanced 5-3-3-2 with 5 hearts, ~12-14 HCP
    // Example: S:KQ3 H:KQJ32 D:Q32 C:Q2 (~14 HCP)
    const north = makeHandFromPattern('KQ3', 'KQJ32', 'Q32', 'Q2');

    const bid = system.getBid(north);
    expect(bid && bid.token).toBe('3NT');
    expect((bid.conventionUsed || '').toLowerCase()).toContain('prefer 3nt');
  });
});
