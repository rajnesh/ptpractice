/** @jest-environment node */

const { SAYCBiddingSystem } = require('../js/combined-bidding-system');

// Minimal stubs for global window/Auction used by the bidding system
if (!global.window) global.window = {};
window.Auction = { TURN_ORDER: ['N', 'E', 'S', 'W'] };
window.Bid = function Bid(token) { this.token = token; };

function buildHand(hcp, lengths) {
    return {
        hcp,
        lengths,
        suitBuckets: Object.fromEntries(Object.keys(lengths).map(k => [k, Array(lengths[k]).fill({ rank: 'A', suit: k })]))
    };
}

describe('Strong 2C overcall rule', () => {
    test('direct seat overcaller with 5+ spades and 10+ HCP bids 2S naturally', () => {
        const sys = new SAYCBiddingSystem();
        sys.ourSeat = 'E';
        sys.conventions = {
            isEnabled: (key, cat) => key === 'strong_2_clubs' && cat === 'opening_bids',
            getConventionSetting: () => null,
            isTwoSuitedOvercall: () => null,
            isAceAskingBid: () => ({ isAceAsking: false, convention: null }),
            getAceAskingResponse: () => null
        };

        sys.currentAuction = {
            dealer: 'S',
            bids: [
                { token: 'PASS', seat: 'S' },
                { token: 'PASS', seat: 'W' },
                { token: '2C', seat: 'N' }
            ],
            ourSeat: 'E'
        };

        const hand = buildHand(12, { S: 5, H: 3, D: 3, C: 2 });
        const bid = sys.getBid(hand);
        expect(bid.token).toBe('2S');
        expect(bid.conventionUsed).toBe('Natural overcall vs Strong 2C');
    });
});
