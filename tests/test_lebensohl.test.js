/**
 * Lebensohl-specific tests.
 * Port of test_lebensohl.py from Python version.
 */

const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid, Auction, Hand } = require('../js/bridge-types');

describe('Lebensohl Tests', () => {
    let system;

    beforeEach(() => {
        system = new SAYCBiddingSystem();
    });

    test('Lebensohl fast denial', () => {
        system.startAuction('N');
        const hand = new Hand('AQxx KQxx AQx Kx'); // 17 HCP with stoppers
    system.currentAuction = new Auction([], { dealer: 'S', ourSeat: 'N' });
    system.currentAuction.add(new Bid('1NT'));
    system.currentAuction.add(new Bid(null));
    system.currentAuction.add(new Bid('2H'));

        const bid = system.getBid(hand);
        expect(bid.token).toBe('3NT');
    });

    test('Lebensohl slow sequences', () => {
        system.startAuction('N');
        const hand = new Hand('xxx xxx QJ10xxx x'); // Weak hand with long diamonds
    system.currentAuction = new Auction([], { dealer: 'S', ourSeat: 'N' });
    system.currentAuction.add(new Bid('1NT'));
    system.currentAuction.add(new Bid(null));
    system.currentAuction.add(new Bid('2H'));

        const bid = system.getBid(hand);
        expect(bid.token).toBe('2NT');
    });

    test('Lebensohl stopper asking', () => {
        system.startAuction('N');
        const hand = new Hand('xxxx AQxx AKx KQx'); // Strong hand without spade stopper
    system.currentAuction = new Auction([], { dealer: 'S', ourSeat: 'N' });
    system.currentAuction.add(new Bid('1NT'));
    system.currentAuction.add(new Bid(null));
    system.currentAuction.add(new Bid('2S'));

        const bid = system.getBid(hand);
        expect(bid.token).toBe('3S');
    });
});
