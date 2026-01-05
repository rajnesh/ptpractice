const { makeHandFromPattern } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../assets/js/combined-bidding-system');
const { Bid } = require('../assets/js/bridge-types');

/**
 * 1NT opening responder tests:
 * - 10 HCP with a 4-card major -> Stayman (2C)
 * - 10 HCP without a 4-card major -> 3NT
 * - 8 HCP with a 6-card major -> Jacoby transfer
 */

describe('1NT responder basics', () => {
  let system;

  beforeEach(() => {
    system = new SAYCBiddingSystem();
    // Ensure NT responses are enabled
    system.conventions.config = system.conventions.config || {};
    system.conventions.config.notrump_responses = system.conventions.config.notrump_responses || {};
    system.conventions.config.notrump_responses.stayman = { enabled: true };
    system.conventions.config.notrump_responses.jacoby_transfers = { enabled: true };

    system.startAuction('N');
    system.currentAuction.add(new Bid('1NT')); // Partner opens 1NT (15-17)
  });

  test('Responder: 10 HCP with a 4-card major uses Stayman (2C)', () => {
    // 10 HCP, 4 spades (KQJ2 = 6), Q in hearts (2), Q in diamonds (2)
    const hand = makeHandFromPattern('KQJ2', 'Q32', 'Q2', '32');
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2C');
  });

  test('Responder: 10 HCP without a 4-card major bids 3NT', () => {
    // 10 HCP, no 4-card major: 3-3 majors
    const hand = makeHandFromPattern('KQ2', 'KQ2', '432', '432');
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('3NT');
  });

  test('Responder: 8 HCP with a 6-card major uses transfer', () => {
    // 8 HCP with 6 hearts -> transfer via 2D
    const hand = makeHandFromPattern('32', 'KQJ432', '32', 'Q2');
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2D');
  });

  test('Responder: 8-9 HCP balanced without a 4-card major invites with 2NT even when minor transfers are on', () => {
    // Enable minor-suit transfers; with no 6+ minor, invitational balanced hand should still use 2NT
    system.conventions.config.notrump_responses.minor_suit_transfers = { enabled: true };

    // 8 HCP, balanced, no 4-card major: 3-3 majors, 4-3 minors (4-3-3-3 shape)
    // S: KQ2 (5), H: Q32 (2), D: J32 (1), C: 4322 (0) => 8 HCP
    const hand = makeHandFromPattern('KQ2', 'Q32', 'J32', '4322');
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2NT');
  });
});
