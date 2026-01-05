const { makeHandFromPattern } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../assets/js/combined-bidding-system');
const { Bid, Auction } = require('../assets/js/bridge-types');

describe('Natural overcall over 1NT with 5-card suit', () => {
    test('East after PASS, PASS, 1NT bids 2C with 5 clubs and 16 HCP', () => {
        const system = new SAYCBiddingSystem();
        system.startAuction('E');
        system.currentAuction = new Auction([], { dealer: 'S', ourSeat: 'E' });

        system.currentAuction.add(new Bid('PASS', { seat: 'S' }));
        system.currentAuction.add(new Bid('PASS', { seat: 'W' }));
        system.currentAuction.add(new Bid('1NT', { seat: 'N' }));

        const hand = makeHandFromPattern('KQ3', 'A42', 'Q7', 'AJT95'); // 16 HCP, 5 clubs
        const bid = system.getBid(hand);

        expect(bid && bid.token).toBe('2C');
        expect(bid.conventionUsed || '').toMatch(/Natural overcall vs 1NT/i);
    });
});
