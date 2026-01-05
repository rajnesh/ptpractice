/**
 * Bergen Raises tests.
 */

const { makeTestHand } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../assets/js/combined-bidding-system');
const { Bid } = require('../assets/js/bridge-types');

function enableBergen(system, on = true) {
    system.conventions.config.responses = system.conventions.config.responses || {};
    system.conventions.config.responses.bergen_raises = { enabled: !!on };
}

function enableJacoby(system, on = true) {
    system.conventions.config.responses = system.conventions.config.responses || {};
    system.conventions.config.responses.jacoby_2nt = { enabled: !!on };
}

describe('Bergen Raises', () => {
    let system;

    beforeEach(() => {
        system = new SAYCBiddingSystem();
    });

    test('3C shows 7-10 with 4-card support over 1S', () => {
        system.startAuction('N');
        system.currentAuction.add(new Bid('1S'));
        enableBergen(system, true);
        enableJacoby(system, true); // default
        // 4 spades, 8 HCP -> 3C Bergen
        const hand = makeTestHand(4, 2, 4, 3, 8);
        const bid = system.getBid(hand);
        expect(bid).not.toBeNull();
        expect(bid.token).toBe('3C');
        expect((bid.conventionUsed || '').toLowerCase()).toContain('bergen');
    });

    test('3D shows 11-12 with 4-card support over 1S', () => {
        system.startAuction('N');
        system.currentAuction.add(new Bid('1S'));
        enableBergen(system, true);
        const hand = makeTestHand(4, 3, 3, 3, 12);
        const bid = system.getBid(hand);
        expect(bid).not.toBeNull();
        expect(bid.token).toBe('3D');
        expect((bid.conventionUsed || '').toLowerCase()).toContain('bergen');
    });

    test('3M preemptive with 0-6 and 4-card support over 1H', () => {
        system.startAuction('N');
        system.currentAuction.add(new Bid('1H'));
        enableBergen(system, true);
        const hand = makeTestHand(2, 4, 4, 3, 6);
        const bid = system.getBid(hand);
        expect(bid).not.toBeNull();
        expect(bid.token).toBe('3H');
        expect((bid.conventionUsed || '').toLowerCase()).toContain('bergen');
    });

    test('Jacoby 2NT still takes precedence at 13+ with 4-card support', () => {
        system.startAuction('N');
        system.currentAuction.add(new Bid('1S'));
        enableBergen(system, true);
        enableJacoby(system, true);
        const hand = makeTestHand(4, 2, 4, 3, 13);
        const bid = system.getBid(hand);
        expect(bid).not.toBeNull();
        expect(bid.token).toBe('2NT');
        expect((bid.conventionUsed || '').toLowerCase()).toContain('jacoby');
    });

    test('With Bergen off, sub-GF immediate response stays natural/suppressed per existing logic', () => {
        system.startAuction('N');
        system.currentAuction.add(new Bid('1S'));
        enableBergen(system, false);
        enableJacoby(system, true); // Default behavior suppresses immediate natural simple raise
        const hand = makeTestHand(4, 3, 3, 3, 8);
        const bid = system.getBid(hand);
        expect(bid).not.toBeNull();
        // Historically this path returned PASS when Jacoby on and no opponent action
        expect(bid.token).toBe('PASS');
    });

    test('After a PASS by RHO, 3C still applies with Bergen on', () => {
        system.startAuction('N');
        system.currentAuction.add(new Bid('1S'));
        system.currentAuction.add(new Bid('PASS'));
        enableBergen(system, true);
        const hand = makeTestHand(4, 3, 3, 3, 8);
        const bid = system.getBid(hand);
        expect(bid).not.toBeNull();
        expect(bid.token).toBe('3C');
    });
});
