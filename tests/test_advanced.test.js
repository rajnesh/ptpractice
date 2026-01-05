/**
 * Advanced convention tests.
 * Port of test_advanced.py from Python version.
 */

const { makeHandFromRanks } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../assets/js/combined-bidding-system');
const { Bid, Auction } = require('../assets/js/bridge-types');

describe('Advanced Convention Tests', () => {
    let system;

    beforeEach(() => {
        system = new SAYCBiddingSystem('tests/test_conventions.json');
    });

    test('RKCB responses', () => {
    const auction = new Auction([], { dealer: 'N', ourSeat: 'N' });
        auction.add(new Bid('1S'));
        auction.add(new Bid(null));
        auction.add(new Bid('4S'));
        auction.add(new Bid(null));
        auction.add(new Bid('4NT')); // RKCB

        system.conventions.config.ace_asking = system.conventions.config.ace_asking || {};
        system.conventions.config.ace_asking.blackwood = { enabled: true, variant: 'rkcb', responses: '1430' };

        // Hand with 1 keycard (ace of spades)
        const hand1 = makeHandFromRanks({
            S: ['A', '2', '3', '4'],
            H: ['2'],
            D: ['2', '3'],
            C: []
        });

        const result = system.conventions.isAceAskingBid(auction, auction.bids[auction.bids.length - 1]);
        expect(result.isAceAsking).toBe(true);
        const resp = system.conventions.getAceAskingResponse(result.convention, hand1);
        expect(resp).toBe('5C'); // 1430: 5♣ shows 1 or 4

        // Hand with 2 keycards (ace + king of spades) and queen
        const hand2 = makeHandFromRanks({
            S: ['A', 'K', 'Q', '2'],
            H: ['2'],
            D: ['2', '3'],
            C: []
        });
        const resp2 = system.conventions.getAceAskingResponse(result.convention, hand2);
        expect(resp2).toBe('5S'); // 5♠ shows 2 + queen (per RKCB 1430 standard)
    });

    test('Michaels cuebid', () => {
        system.startAuction('N');
        system.currentAuction.add(new Bid('1H'));

        // Spades and clubs
        const hand = makeHandFromRanks({
            S: ['A', 'K', 'Q', '2', '3'],
            H: ['2'],
            C: ['K', 'Q', 'J', '2', '3'],
            D: []
        });

        const bid = system.getBid(hand);
        expect(bid.token).toBe('2H');
    });

    test('DONT over 1NT', () => {
        system.startAuction('N');
        system.currentAuction.add(new Bid('1NT'));

        // Good diamond suit
        const hand = makeHandFromRanks({
            S: ['2', '3'],
            H: ['2', '3'],
            D: ['A', 'K', 'Q', 'J', '2', '3'],
            C: ['2', '3']
        });

        const bid = system.getBid(hand);
        expect(bid.token).toBe('2D');
    });

    test('Lebensohl after interference', () => {
        system.startAuction('N');
        system.currentAuction.add(new Bid('1NT'));
        system.currentAuction.add(new Bid(null));
        system.currentAuction.add(new Bid('2H'));

        // Weak hand with long spades
        const hand = makeHandFromRanks({
            S: ['K', 'J', '10', '9', '8', '2'],
            H: ['2', '3'],
            D: ['2', '3'],
            C: ['2', '3']
        });

        const bid = system.getBid(hand);
        expect(bid.token).toBe('2NT');
    });

    test('Vulnerability adjustments', () => {
        // Vulnerable
        system.startAuction('N', true, false);

        // Borderline weak two hand
        const hand = makeHandFromRanks({
            S: ['K', 'Q', 'J', '10', '9', '8'],
            H: ['2', '3'],
            D: ['K', '2'],
            C: ['2', '3']
        });

    const bid = system.getBid(hand);
    expect(bid.token).toBe('PASS'); // Should pass when vulnerable

        // Same hand not vulnerable
        system.startAuction('N', false, true);
        const bid2 = system.getBid(hand);
        expect(bid2.token).toBe('2S');
    });

    test('Passed hand variations', () => {
        system.startAuction('N');
        system.currentAuction.add(new Bid(null)); // We pass
        system.currentAuction.add(new Bid(null)); // LHO passes
        system.currentAuction.add(new Bid('1S')); // Partner opens 1S
        system.currentAuction.add(new Bid(null)); // RHO passes

        // Drury hand: 3-card support and 10 HCP
        const hand = makeHandFromRanks({
            S: ['K', 'Q', '2'],
            H: ['K', 'Q'],
            D: ['K', 'Q'],
            C: ['J', '2', '3', '4']
        });

        const bid = system.getBid(hand);
        expect(bid.token).toBe('2C'); // Drury
    });
});
