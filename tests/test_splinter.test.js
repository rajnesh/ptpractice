/**
 * Splinter bid tests.
 * Tests the implementation of splinter bids - jump bids showing game-forcing values
 * with 4+ support for partner's major and singleton/void in the bid suit.
 */

const { makeHandFromRanks } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid, Auction } = require('../js/bridge-types');

describe('Splinter Bid Tests', () => {
    let system;

    beforeEach(() => {
        system = new SAYCBiddingSystem('tests/test_conventions.json');
        system.startAuction(1); // East responding to South's opening
    });

    test('4D splinter after 1H opening - singleton diamond', () => {
        // South opens 1H, East has 4+ hearts, 13+ HCP, singleton diamond
        // Diamonds are lower than hearts, so bid at 4-level
    const auction = new Auction([new Bid('1H')], { dealer: 'S', ourSeat: 'E' });
        system.currentAuction = auction;

        const hand = makeHandFromRanks({
            S: ['A', 'K', '3'],
            H: ['Q', 'J', '10', '9'], // 4 hearts
            D: ['2'], // singleton diamond
            C: ['A', 'K', 'Q', '7', '4'] // 5 clubs
        });
        // HCP: A(4) + K(3) + Q(2) + J(1) + A(4) + K(3) + Q(2) = 19 HCP

        const bid = system.getBid(hand);
        expect(bid.token).toBe('4D');
        expect(bid.conventionUsed).toBe('Splinter Bid');
    });

    test('4C splinter after 1S opening - singleton club', () => {
        // South opens 1S, East has 4+ spades, 13+ HCP, singleton club
        // Clubs are lower than spades, so bid at 4-level
    const auction = new Auction([new Bid('1S')], { dealer: 'S', ourSeat: 'E' });
        system.currentAuction = auction;

        const hand = makeHandFromRanks({
            S: ['A', 'Q', 'J', '8'], // 4 spades
            H: ['K', 'Q', '10', '9', '7'], // 5 hearts
            D: ['A', 'K', '6'], // 3 diamonds
            C: ['2'] // singleton club
        });
        // HCP: A(4) + Q(2) + J(1) + K(3) + Q(2) + A(4) + K(3) = 19 HCP

        const bid = system.getBid(hand);
        expect(bid.token).toBe('4C');
        expect(bid.conventionUsed).toBe('Splinter Bid');
    });

    test('4C splinter after 1H opening - club lower than hearts', () => {
        // South opens 1H, East has 4+ hearts, 13+ HCP, singleton club
        // Since clubs are lower ranking than hearts, need to bid at 4-level
    const auction = new Auction([new Bid('1H')], { dealer: 'S', ourSeat: 'E' });
        system.currentAuction = auction;

        const hand = makeHandFromRanks({
            S: ['A', 'K', 'Q', '5'], // 4 spades
            H: ['J', '10', '9', '8'], // 4 hearts
            D: ['A', 'K', '7', '6'], // 4 diamonds
            C: ['2'] // singleton club
        });
        // HCP: A(4) + K(3) + Q(2) + J(1) + A(4) + K(3) = 17 HCP

        const bid = system.getBid(hand);
        expect(bid.token).toBe('4C');
        expect(bid.conventionUsed).toBe('Splinter Bid');
    });

    test('4D splinter after 1H opening - diamond lower than hearts', () => {
        // South opens 1H, East has 4+ hearts, 13+ HCP, singleton diamond
    const auction = new Auction([new Bid('1H')], { dealer: 'S', ourSeat: 'E' });
        system.currentAuction = auction;

        const hand = makeHandFromRanks({
            S: ['A', 'Q', '8', '7'], // 4 spades
            H: ['K', 'J', '10', '9'], // 4 hearts
            D: ['2'], // singleton diamond
            C: ['A', 'K', 'Q', '6', '5'] // 5 clubs
        });
        // HCP: A(4) + Q(2) + K(3) + J(1) + A(4) + K(3) + Q(2) = 19 HCP

        const bid = system.getBid(hand);
        expect(bid.token).toBe('4D');
        expect(bid.conventionUsed).toBe('Splinter Bid');
    });

    test('4H splinter after 1S opening - singleton hearts', () => {
        // South opens 1S, East has 4+ spades, 13+ HCP, singleton heart
        // Hearts are lower than spades, so bid at 4-level
    const auction = new Auction([new Bid('1S')], { dealer: 'S', ourSeat: 'E' });
        system.currentAuction = auction;

        const hand = makeHandFromRanks({
            S: ['A', 'K', 'Q', '8'], // 4 spades
            H: ['2'], // singleton heart
            D: ['A', 'J', '10', '9', '7'], // 5 diamonds
            C: ['K', 'Q', '6'] // 3 clubs
        });
        // HCP: A(4) + K(3) + Q(2) + A(4) + J(1) + K(3) + Q(2) = 19 HCP

        const bid = system.getBid(hand);
        expect(bid.token).toBe('4H');
        expect(bid.conventionUsed).toBe('Splinter Bid');
    });

    test('3S splinter after 1H opening - singleton spades', () => {
        // South opens 1H, East has 4+ hearts, 13+ HCP, singleton spade
        // Spades are higher than hearts, so bid at 3-level
    const auction = new Auction([new Bid('1H')], { dealer: 'S', ourSeat: 'E' });
        system.currentAuction = auction;

        const hand = makeHandFromRanks({
            S: ['2'], // singleton spade
            H: ['A', 'K', 'Q', '8'], // 4 hearts
            D: ['A', 'J', '10', '9', '7'], // 5 diamonds  
            C: ['K', 'Q', '6'] // 3 clubs
        });
        // HCP: A(4) + K(3) + Q(2) + A(4) + J(1) + K(3) + Q(2) = 19 HCP

        const bid = system.getBid(hand);
        expect(bid.token).toBe('3S');
        expect(bid.conventionUsed).toBe('Splinter Bid');
    });

    test('void splinter - 4C after 1S opening', () => {
        // South opens 1S, East has 4+ spades, 13+ HCP, void in clubs
        // Clubs are lower than spades, so bid at 4-level
    const auction = new Auction([new Bid('1S')], { dealer: 'S', ourSeat: 'E' });
        system.currentAuction = auction;

        const hand = makeHandFromRanks({
            S: ['A', 'K', 'J', '8'], // 4 spades
            H: ['Q', '10', '9', '7'], // 4 hearts
            D: ['A', 'K', 'Q', '6', '5'], // 5 diamonds
            C: [] // void in clubs
        });
        // HCP: A(4) + K(3) + J(1) + Q(2) + A(4) + K(3) + Q(2) = 19 HCP

        const bid = system.getBid(hand);
        expect(bid.token).toBe('4C');
        expect(bid.conventionUsed).toBe('Splinter Bid');
    });

    test('no splinter with insufficient HCP', () => {
        // South opens 1H, East has 4+ hearts but only 10 HCP, singleton diamond
    const auction = new Auction([new Bid('1H')], { dealer: 'S', ourSeat: 'E' });
        system.currentAuction = auction;

        const hand = makeHandFromRanks({
            S: ['K', '8', '7'], // 3 spades
            H: ['Q', 'J', '10', '9'], // 4 hearts
            D: ['2'], // singleton diamond
            C: ['K', '8', '7', '6', '5'] // 5 clubs
        });
        // HCP: K(3) + Q(2) + J(1) + K(3) = 9 HCP (insufficient)

        const bid = system.getBid(hand);
        expect(bid.token).not.toBe('3D');
        expect(bid.conventionUsed).not.toBe('Splinter Bid');
    });

    test('no splinter with insufficient support', () => {
        // South opens 1H, East has only 3 hearts, 13+ HCP, singleton diamond
    const auction = new Auction([new Bid('1H')], { dealer: 'S', ourSeat: 'E' });
        system.currentAuction = auction;

        const hand = makeHandFromRanks({
            S: ['A', 'K', '8', '7'], // 4 spades
            H: ['Q', 'J', '10'], // only 3 hearts
            D: ['2'], // singleton diamond
            C: ['A', 'K', 'Q', '6'] // 4 clubs
        });
        // HCP: A(4) + K(3) + Q(2) + J(1) + A(4) + K(3) + Q(2) = 19 HCP

        const bid = system.getBid(hand);
        expect(bid.token).not.toBe('3D');
        expect(bid.conventionUsed).not.toBe('Splinter Bid');
    });

    test('no splinter with no singleton or void', () => {
        // South opens 1H, East has 4+ hearts, 13+ HCP, but no singleton/void
    const auction = new Auction([new Bid('1H')], { dealer: 'S', ourSeat: 'E' });
        system.currentAuction = auction;

        const hand = makeHandFromRanks({
            S: ['A', 'K', '8'], // 3 spades
            H: ['Q', 'J', '10', '9'], // 4 hearts
            D: ['A', 'K'], // 2 diamonds (not singleton)
            C: ['K', 'Q', '7', '6'] // 4 clubs
        });
        // HCP: A(4) + K(3) + Q(2) + J(1) + A(4) + K(3) + K(3) + Q(2) = 22 HCP

        const bid = system.getBid(hand);
        expect(bid.conventionUsed).not.toBe('Splinter Bid');
    });

    test('splinter takes priority over Jacoby 2NT when both enabled', () => {
        // Both splinter and Jacoby 2NT are enabled, splinter should take priority
    const auction = new Auction([new Bid('1H')], { dealer: 'S', ourSeat: 'E' });
        system.currentAuction = auction;

        const hand = makeHandFromRanks({
            S: ['A', 'K', '8'],
            H: ['Q', 'J', '10', '9'], // 4 hearts
            D: ['2'], // singleton diamond - splinter condition
            C: ['A', 'K', 'Q', '7', '6'] // 5 clubs
        });
        // HCP: A(4) + K(3) + Q(2) + J(1) + A(4) + K(3) + Q(2) = 19 HCP

        const bid = system.getBid(hand);
        expect(bid.token).toBe('4D'); // Diamonds lower than hearts, so 4-level
        expect(bid.conventionUsed).toBe('Splinter Bid');
        expect(bid.token).not.toBe('2NT'); // Should not be Jacoby 2NT
    });

    test('splinter disabled - falls back to Jacoby 2NT', () => {
        // Disable splinter bids and ensure Jacoby 2NT is used instead
        system.conventions.config.responses.splinter_bids.enabled = false;
        
        const auction = new Auction([new Bid('1H')]);
        system.currentAuction = auction;

        const hand = makeHandFromRanks({
            S: ['A', 'K', '8'],
            H: ['Q', 'J', '10', '9'], // 4 hearts
            D: ['2'], // singleton diamond
            C: ['A', 'K', 'Q', '7', '6'] // 5 clubs
        });
        // HCP: A(4) + K(3) + Q(2) + J(1) + A(4) + K(3) + Q(2) = 19 HCP

        const bid = system.getBid(hand);
        expect(bid.token).toBe('2NT');
        expect(bid.conventionUsed).toBe('Jacoby 2NT');
        expect(bid.conventionUsed).not.toBe('Splinter Bid');
    });
});
