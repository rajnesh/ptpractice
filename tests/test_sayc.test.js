/**
 * Basic SAYC bidding tests.
 * Port of test_sayc.py from Python version.
 */

const { makeHandFromRanks } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid, Auction } = require('../js/bridge-types');

describe('SAYC Basic Tests', () => {
    let system;

    beforeEach(() => {
        system = new SAYCBiddingSystem();
    });

    test('Rule of 20 opens', () => {
        // Hand with HCP 10 and two longest suits lengths 6 and 4 -> 10+6+4=20
        const hand = makeHandFromRanks({
            S: ['A', 'K', 'Q', 'J', '2', '3'],
            H: ['A', 'K', 'Q', '2'],
            D: ['2', '3'],
            C: []
        });

        system.startAuction('N');
        const bid = system.getBid(hand);

        expect(bid).not.toBeNull();
        expect(bid.token).toBe('1S');
    });

    test('Overcall with 6 HCP allowed', () => {
        system.startAuction('N');
        system.currentAuction.add(new Bid('1C'));

        // Hand with 6 HCP and 5-card heart suit
        const hand = makeHandFromRanks({
            S: ['2', '3'],
            H: ['A', 'K', '2', '3', '4'],
            D: ['2', '3', '4'],
            C: ['2', '3', '4']
        });

        const bid = system.getBid(hand);
        expect(bid).not.toBeNull();
        expect(bid.token).toBe('1H');
    });

    test('Relaxed takeout double', () => {
        system.startAuction('N');
        system.currentAuction.add(new Bid('1H'));

        // Hand with 12 HCP, short in hearts
        const hand = makeHandFromRanks({
            S: ['K', '2', '3'],
            H: ['2'],
            D: ['A', '2'],
            C: ['K', 'Q', '2', '3']
        });

        const bid = system.getBid(hand);
        expect(bid).not.toBeNull();
        expect(bid.isDouble).toBe(true);
    });

    test('Jacoby 2NT toggle', () => {
        // Partner opened 1S; responder has 4-card support and 13 HCP
        system.startAuction('N');
        system.currentAuction.add(new Bid('1S'));

        const hand = makeHandFromRanks({
            S: ['A', 'K', 'Q', '2'],
            H: ['A', '2'],
            D: ['2', '3'],
            C: ['2', '3', '4']
        });

        // Ensure jacoby enabled
        system.conventions.config.responses = system.conventions.config.responses || {};
        system.conventions.config.responses.jacoby_2nt = { enabled: true };

        const bid = system.getBid(hand);
        expect(bid).not.toBeNull();
        expect(bid.token).toBe('2NT');

        // Disable and expect a different response
        system.conventions.config.responses.jacoby_2nt.enabled = false;
        const bid2 = system.getBid(hand);
        expect(bid2.token).not.toBe('2NT');
    });

    test('Gerber responses from config', () => {
        // Build hand with 2 aces
        const hand = makeHandFromRanks({
            S: ['A'],
            H: ['A'],
            D: [],
            C: []
        });

        const resp = system.conventions.getAceAskingResponse('gerber', hand);
        expect(resp).toBe('4S'); // 2 aces -> 4S
    });

    test('Blackwood response', () => {
    const auction = new Auction([], { dealer: 'N', ourSeat: 'N' });
        auction.add(new Bid('1S'));
        auction.add(new Bid('4NT')); // Asking bid

        const result = system.conventions.isAceAskingBid(auction, auction.bids[1]);
        expect(result.isAceAsking).toBe(true);
        expect(result.convention).toContain('blackwood');

        // Hand with 3 key cards (A/K counts in RKCB)
        const hand = makeHandFromRanks({
            S: ['A', 'K'],
            H: ['A'],
            D: [],
            C: []
        });

        const resp = system.conventions.getAceAskingResponse(result.convention, hand);
        expect(typeof resp).toBe('string');
    });
});
