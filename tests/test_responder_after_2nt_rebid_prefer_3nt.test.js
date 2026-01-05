const { SAYCBiddingSystem } = require('../assets/js/combined-bidding-system');
const { Bid } = require('../assets/js/bridge-types');
const { makeHandFromPattern } = require('./test-helpers');

/**
 * After 1C - PASS - 1S - PASS - 2NT, responder (North) with a balanced hand
 * and only a 5-card spade suit should prefer 3NT, allowing opener to correct to 4S
 * with 3-card support.
 */

describe('Responder after opener 2NT rebid prefers 3NT with only 5-card major', () => {
  test('Sequence 1C-P-1S-P-2NT; North balanced 5 spades chooses 3NT', () => {
    const system = new SAYCBiddingSystem();
    system.startAuction('N');
    // South deals for clarity; turn order S, W, N, E
    system.currentAuction.reseat('S');

    // Auction: S 1C, W PASS, N 1S, E PASS, S 2NT
    system.currentAuction.add(new Bid('1C')); // S
    system.currentAuction.add(new Bid(null)); // W PASS
    system.currentAuction.add(new Bid('1S')); // N
    system.currentAuction.add(new Bid(null)); // E PASS
    system.currentAuction.add(new Bid('2NT')); // S rebid

    // North hand: balanced 5-3-3-2 with 5 spades, ~12-14 HCP
    // Example: S:KQJ32 H:A32 D:K32 C:Q2 (~14 HCP, 5-3-3-2)
    const north = makeHandFromPattern('KQJ32', 'A32', 'K32', 'Q2');

    console.log('TEST-DBG ctx before getBid =', system._seatContext());
    const bid = system.getBid(north);
    expect(bid && bid.token).toBe('3NT');
    // Also ensure explanation is set in conventionUsed for UI clarity
    expect(bid.conventionUsed || '').toMatch(/Prefer 3NT/);
  });
});
