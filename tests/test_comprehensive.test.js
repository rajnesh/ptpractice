/**
 * Comprehensive bidding tests.
 * Port of test_comprehensive.py from Python version.
 */

const { makeHandFromPattern } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid, Auction } = require('../js/bridge-types');

describe('Comprehensive SAYC Tests', () => {
    let system;

    beforeEach(() => {
        system = new SAYCBiddingSystem();
    });

    test('Rule of 20', () => {
        const hands = [
            // Should open (11 HCP + 5 + 4 = 20)
            [makeHandFromPattern('AKQ32', 'J432', '32', '32'), true],
            // Should not open (11 HCP + 4 + 3 = 18)
            [makeHandFromPattern('AKQ2', 'J32', '432', '432'), false],
            // Should open balanced (12 HCP + 4 + 4 = 20)
            [makeHandFromPattern('AKQ2', 'KJ32', '432', '32'), true]
        ];

        for (const [hand, shouldOpen] of hands) {
            const bid = system._getOpeningBid(hand);
            expect(!!bid).toBe(shouldOpen);
        }
    });

    test('Six HCP overcalls', () => {
        system.startAuction('N');
        system.currentAuction.add(new Bid('1C'));

        const hands = [
            // 6 HCP, 5-card suit - should overcall
            [makeHandFromPattern('KQ432', '432', '432', '32'), true],
            // 5 HCP, 5-card suit - should not overcall
            [makeHandFromPattern('KJ432', '432', '432', '32'), false],
            // 6 HCP, 4-card suit - should not overcall
            [makeHandFromPattern('KQ32', '432', '4332', '32'), false]
        ];

        for (const [hand, shouldOvercall] of hands) {
            const bid = system.getBid(hand);
            const isContract = !!(bid && bid.token && /^[1-7](C|D|H|S|NT)$/.test(bid.token));
            expect(isContract).toBe(shouldOvercall);
        }
    });

    test('Relaxed takeout doubles', () => {
        system.startAuction('N');
        system.currentAuction.add(new Bid('1H'));

        const hands = [
            // Classic takeout double (4-4-3-2)
            [makeHandFromPattern('AKQ2', '2', 'KJ32', 'Q432'), 'X'],
            // Relaxed shape with two 3-card suits (3-3-3-4)
            [makeHandFromPattern('AK2', '2', 'KJ2', 'QJ432'), 'X'],
            // Minimum with two 2-card suits (2-2-4-5)
            [makeHandFromPattern('K2', '2', 'AKJ2', 'QJ432'), 'X'],
            // Too weak for relaxed double
            [makeHandFromPattern('Q2', '2', 'KJ32', 'J4332'), null]
        ];

        for (const [hand, expected] of hands) {
            const bid = system.getBid(hand);
            if (expected === 'X') {
                expect(bid.isDouble).toBe(true);
            } else {
                expect(bid.isDouble || false).toBe(false);
            }
        }
    });

    test('Jacoby 2NT', () => {
        system.startAuction('N');
        system.currentAuction.add(new Bid('1S'));

        system.conventions.config.responses = system.conventions.config.responses || {};
        system.conventions.config.responses.jacoby_2nt = { enabled: true };

        const hands = [
            // Perfect Jacoby 2NT (4 spades, 13 HCP)
            [makeHandFromPattern('KQ32', 'AK32', 'Q32', '32'), '2NT'],
            // Too weak for Jacoby 2NT
            [makeHandFromPattern('KQ32', 'K432', 'Q32', '32'), 'PASS'],
            // Not enough trump support
            [makeHandFromPattern('K32', 'AKQ2', 'QJ2', '432'), 'PASS']
        ];

        for (const [hand, expected] of hands) {
            const bid = system.getBid(hand);
            expect(bid.token).toBe(expected);
        }
    });

    test('Gerber responses', () => {
        system.conventions.config.ace_asking = system.conventions.config.ace_asking || {};
        system.conventions.config.ace_asking.gerber = { enabled: true };

        system.startAuction('N');
        system.currentAuction.add(new Bid('1NT'));
        system.currentAuction.add(new Bid(null)); // Pass
        system.currentAuction.add(new Bid('4C')); // Gerber

        const hands = [
            // 0 aces -> 4D
            [makeHandFromPattern('KQ32', 'KQ32', 'Q32', 'K2'), '4D'],
            // 1 ace -> 4H
            [makeHandFromPattern('A432', 'K432', 'Q32', 'K2'), '4H'],
            // 2 aces -> 4S
            [makeHandFromPattern('A432', 'A432', 'Q32', 'K2'), '4S'],
            // 3 aces -> 4NT
            [makeHandFromPattern('A432', 'A432', 'A32', 'K2'), '4NT'],
            // 4 aces -> 4D
            [makeHandFromPattern('A432', 'A432', 'A32', 'A2'), '4D']
        ];

        for (const [hand, expected] of hands) {
            const askingBid = system.currentAuction.bids[system.currentAuction.bids.length - 1];
            const result = system.conventions.isAceAskingBid(system.currentAuction, askingBid);
            expect(result.isAceAsking).toBe(true);
            expect(result.convention).toBe('gerber');
            
            const response = system.conventions.getAceAskingResponse(result.convention, hand);
            expect(response).toBe(expected);
        }
    });

    test('Balanced hands', () => {
        const hands = [
            // 4-3-3-3 is balanced
            [makeHandFromPattern('AKQ2', 'K32', 'Q32', '432'), true],
            // 4-4-3-2 is balanced
            [makeHandFromPattern('AKQ2', 'KJ32', 'Q32', '32'), true],
            // 5-3-3-2 is balanced
            [makeHandFromPattern('AKQ32', 'K32', 'Q32', '32'), true],
            // 5-4-2-2 is not balanced
            [makeHandFromPattern('AKQ32', 'KJ32', '32', '32'), false],
            // 6-3-2-2 is not balanced
            [makeHandFromPattern('AKQ432', 'K32', '32', '32'), false]
        ];

        for (const [hand, isBalanced] of hands) {
            expect(system._isBalanced(hand)).toBe(isBalanced);
        }
    });

    test('Meckwell defenses', () => {
        // Disable DONT and enable only Meckwell
        system.conventions.config.notrump_defenses = system.conventions.config.notrump_defenses || {};
        system.conventions.config.notrump_defenses.dont = { enabled: false };
        system.conventions.config.notrump_defenses.meckwell = { enabled: true };
        system.conventions.config.strong_club_defenses = system.conventions.config.strong_club_defenses || {};
        system.conventions.config.strong_club_defenses.meckwell = { enabled: true, direct_only: true };

        system.startAuction('N');
        system.currentAuction.add(new Bid('1NT'));

        const hands = [
            // Single-suited hand -> 2C
            [makeHandFromPattern('AKQ432', '32', '432', '32'), '2C'],
            // Both majors -> 2D
            [makeHandFromPattern('KQJ2', 'KQJ2', '432', '32'), '2D'],
            // Major + minor -> 2M
            [makeHandFromPattern('KQJ32', '32', 'KQJ32', '32'), '2S']
        ];

        for (const [hand, expected] of hands) {
            const bid = system.getBid(hand);
            expect(bid.token).toBe(expected);
        }
    });

    test('Lebensohl sequences', () => {
        system.conventions.config.notrump_defenses = system.conventions.config.notrump_defenses || {};
        system.conventions.config.notrump_defenses.lebensohl = {
            enabled: true,
            after_interference: true,
            fast_denies: true
        };

        system.startAuction('N');
        system.currentAuction.add(new Bid('1NT'));
        system.currentAuction.add(new Bid(null)); // Pass
        system.currentAuction.add(new Bid('2H')); // Interference

        const hands = [
            // Fast denial with stopper
            [makeHandFromPattern('AK32', 'KQ2', 'QJ32', '32'), '3NT'],
            // Slow sequence with weak hand
            [makeHandFromPattern('32', '32', 'QJ9432', '432'), '2NT'],
            // Game force without stopper
            [makeHandFromPattern('AKQ2', '2', 'KQJ32', '432'), '3H']
        ];

        for (const [hand, expected] of hands) {
            const bid = system.getBid(hand);
            expect(bid.token).toBe(expected);
        }
    });

    test('Support doubles', () => {
        system.conventions.config.competitive = system.conventions.config.competitive || {};
        system.conventions.config.competitive.support_doubles = { enabled: true, thru: '2S' };

        system.startAuction('N');
        system.currentAuction.add(new Bid('1D')); // We open
        system.currentAuction.add(new Bid('1S')); // They overcall
        system.currentAuction.add(new Bid('1H')); // Partner bids hearts

        const hands = [
            // Perfect support double
            [makeHandFromPattern('32', 'KQ2', 'AKJ32', '432'), true],
            // Four-card support -> natural raise
            [makeHandFromPattern('32', 'KQJ2', 'AKJ32', '32'), false],
            // Two-card support -> no double
            [makeHandFromPattern('432', '32', 'AKJ32', 'KQ2'), false]
        ];

        for (const [hand, shouldDouble] of hands) {
            const bid = system.getBid(hand);
            expect(bid.isDouble || false).toBe(shouldDouble);
        }
    });

    test('Strong 2 Club Opening', () => {
        // Enable Strong 2 Clubs convention
        system.conventions.config.opening_bids = system.conventions.config.opening_bids || {};
        system.conventions.config.opening_bids.strong_2_clubs = { enabled: true, min_hcp: 22 };

        const hands = [
            // 22 HCP balanced - should open 2C
            [makeHandFromPattern('AKQ2', 'AKQ2', 'AKQ2', '32'), '2C'],
            // 23 HCP unbalanced - should open 2C
            [makeHandFromPattern('AKQJ432', 'AK2', 'AK2', '3'), '2C'],
            // 15-17 HCP balanced - should open 1NT
            [makeHandFromPattern('AQJ2', 'KJ32', 'Q32', 'Q2'), '1NT'],
            // Game in hand - should open 2C
            [makeHandFromPattern('AKQJ4321', 'AK', 'AK', '3'), '2C']
        ];

        for (const [hand, expected] of hands) {
            system.startAuction('N');
            const bid = system._getOpeningBid(hand);
            expect(bid.token).toBe(expected);
        }
    });

    test('Strong 2 Club Responses', () => {
        system.conventions.config.opening_bids = system.conventions.config.opening_bids || {};
        system.conventions.config.opening_bids.strong_2_clubs = { enabled: true, min_hcp: 22 };

        const responseHands = [
            // 2D waiting response (under 8 HCP)
            [makeHandFromPattern('432', '432', '432', '4321'), '2D'],
            // 2D waiting response (8+ HCP but no 5-card suit)
            [makeHandFromPattern('KQ32', 'KQ32', 'K32', '32'), '2D'],
            // 2H positive (8+ HCP with 5+ hearts)
            [makeHandFromPattern('432', 'KQJ32', '432', '32'), '2H'],
            // 2S positive (8+ HCP with 5+ spades)
            [makeHandFromPattern('KQJ32', '432', '432', '32'), '2S'],
            // 3C positive (8+ HCP with 5+ clubs)
            [makeHandFromPattern('432', '432', '432', 'KQJ32'), '3C'],
            // 3D positive (8+ HCP with 5+ diamonds)
            [makeHandFromPattern('432', '432', 'KQJ32', '432'), '3D'],
            // 2NT positive (8-10 HCP balanced)
            [makeHandFromPattern('KQ32', 'KQ32', 'K32', '32'), '2D'], // Actually this should be 2D waiting
            // 3NT positive (11-13 HCP balanced)
            [makeHandFromPattern('KQJ2', 'KQJ2', 'K32', '32'), '3NT']
        ];

        for (const [hand, expected] of responseHands) {
            system.startAuction('N');
            system.currentAuction.add(new Bid('2C')); // Partner opens 2C
            const bid = system._getResponseToSuit('2C', hand);
            expect(bid.token).toBe(expected);
        }
    });

    test('Forced Response to Strong 2C', () => {
        system.conventions.config.opening_bids = system.conventions.config.opening_bids || {};
        system.conventions.config.opening_bids.strong_2_clubs = { enabled: true, min_hcp: 22 };

        // Test that responses to 2C are forced (cannot pass)
        const weakHands = [
            // 0 HCP - must still respond 2D
            makeHandFromPattern('432', '432', '432', '4321'),
            // 3 HCP - must still respond 2D  
            makeHandFromPattern('432', 'K32', '432', '4321'),
            // 5 HCP - must still respond 2D
            makeHandFromPattern('Q32', 'K32', '432', '4321')
        ];

        for (const hand of weakHands) {
            system.startAuction('N');
            system.currentAuction.add(new Bid('2C')); // Partner opens 2C
            const bid = system._getResponseToSuit('2C', hand);
            
            // Should never be null (pass) - must respond
            expect(bid).not.toBeNull();
            expect(bid.token).toBe('2D'); // Waiting response required
            expect(bid.conventionUsed).toBe('Strong 2C Waiting Response');
        }
    });

    test('Control Showing Cue Bids', () => {
        system.conventions.config.slam_bidding = system.conventions.config.slam_bidding || {};
        system.conventions.config.slam_bidding.control_showing_cue_bids = { enabled: true };

        // After Jacoby 2NT (game force + 4+ support), cue bids show controls
        system.startAuction('N');
        system.currentAuction.add(new Bid('1H')); // Open 1H
        system.currentAuction.add(new Bid(null)); // Pass
        system.currentAuction.add(new Bid('2NT')); // Jacoby 2NT
        system.currentAuction.add(new Bid(null)); // Pass

        const cueBidHands = [
            // Should cue bid 3C (ace of clubs)
            [makeHandFromPattern('432', 'AKQ32', '432', 'A32'), '3C'],
            // Should cue bid 3D (ace of diamonds)
            [makeHandFromPattern('432', 'AKQ32', 'A432', '32'), '3D'],
            // Should cue bid 3S (ace of spades)
            [makeHandFromPattern('A32', 'AKQ32', '432', '432'), '3S']
        ];

        for (const [hand, expected] of cueBidHands) {
            const bid = system._getResponseToSuit('2NT', hand); // Response after Jacoby
            expect(bid.token).toBe(expected);
            expect(bid.conventionUsed).toBe('Control Showing Cue Bid');
        }
    });
});
