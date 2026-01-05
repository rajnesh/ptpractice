/**
 * Regression: opener should open after two passes with 19 HCP (North after S and W pass).
 */

const { SAYCBiddingSystem } = require('../assets/js/combined-bidding-system');
const { Bid } = require('../assets/js/bridge-types');
const { makeHandFromPattern } = require('./test-helpers');

describe('Opening after two passes', () => {
    test('North opens in third seat with 19 HCP after two passes', () => {
        const system = new SAYCBiddingSystem();
        // Start auction (dealer not critical for this regression)
        system.startAuction('N');
        // South passes, West passes (represented as null pass tokens in engine)
        system.currentAuction.add(new Bid(null));
        system.currentAuction.add(new Bid(null));

        // North hand: 19 HCP, no 5-card major, 4 spades (should open 1S per logic)
        // Spades AKQ2 (9), Hearts AK2 (7), Diamonds K2 (3), Clubs 4321 (0) => 19 HCP
        const northHand = makeHandFromPattern('AKQ2', 'AK2', 'K2', '4321');

        const bid = system.getBid(northHand);
        expect(bid).toBeTruthy();
        expect(bid.token).not.toBeNull(); // not a PASS
        // With 4 spades and no 5-card major, opener prefers 1S over minors
        expect(bid.token).toBe('1S');
    });
});
