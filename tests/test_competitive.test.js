/**
 * Competitive bidding convention tests.
 * Port of test_competitive.py from Python version.
 */

const { makeTestHand } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid, Auction } = require('../js/bridge-types');

describe('Competitive Bidding Tests', () => {
    test('Meckwell defense', () => {
        const system = new SAYCBiddingSystem();
        // Disable DONT, enable Meckwell
        system.conventions.config.notrump_defenses = system.conventions.config.notrump_defenses || {};
        system.conventions.config.notrump_defenses.dont = { enabled: false };
        system.conventions.config.strong_club_defenses = system.conventions.config.strong_club_defenses || {};
        system.conventions.config.strong_club_defenses.meckwell = { enabled: true, direct_only: true };
        
        system.startAuction('N');

        // Single-suited hand (we are defending over 1NT as next seat)
        system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'E' });
        system.currentAuction.add(new Bid('1NT'));
        let hand = makeTestHand(6, 2, 2, 3, 10);
        let bid = system.getBid(hand);
        expect(bid.token).toBe('2C');

        // Both majors
    system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'E' });
        system.currentAuction.add(new Bid('1NT'));
        hand = makeTestHand(4, 4, 3, 2, 10);
        bid = system.getBid(hand);
        expect(bid.token).toBe('2D');
    });

    test('Support doubles', () => {
        const system = new SAYCBiddingSystem('tests/test_conventions.json');
        system.startAuction('N');

    system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'N' });
        system.currentAuction.add(new Bid('1D'));
        system.currentAuction.add(new Bid('1S'));
        system.currentAuction.add(new Bid('1H'));

        const hand = makeTestHand(2, 3, 5, 3, 13);
        const bid = system.getBid(hand);
        expect(bid.isDouble).toBe(true);
    });

    test('Cue bid raises', () => {
        const system = new SAYCBiddingSystem('tests/test_conventions.json');
        system.startAuction('N');

    system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'N' });
        system.currentAuction.add(new Bid('1H'));
        system.currentAuction.add(new Bid('1S'));

        const hand = makeTestHand(2, 4, 3, 4, 11);
        const bid = system.getBid(hand);
        expect(bid.token).toBe('2S');
    });

    test('Reopening doubles', () => {
        const system = new SAYCBiddingSystem('tests/test_conventions.json');
        system.startAuction('N');

    system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'N' });
        system.currentAuction.add(new Bid('1H'));
        system.currentAuction.add(new Bid(null));
        system.currentAuction.add(new Bid(null));

        const hand = makeTestHand(3, 2, 4, 4, 10);
        const bid = system.getBid(hand);
        expect(bid.isDouble).toBe(true);
    });

    test('Responsive doubles', () => {
        const system = new SAYCBiddingSystem();
        system.startAuction('N');

    system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'N' });
        system.currentAuction.add(new Bid('1H'));
        system.currentAuction.add(new Bid(null, { isDouble: true }));
        system.currentAuction.add(new Bid('2H'));

        const hand = makeTestHand(3, 2, 4, 4, 8);
        const bid = system.getBid(hand);
        expect(bid.isDouble).toBe(true);
    });
});
