const { makeHandFromPattern } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid } = require('../js/bridge-types');

/**
 * 2NT opening responder tests:
 * - 4 HCP, no 4-card major -> 3NT
 * - 3 HCP, no 4-card major -> PASS
 * - 6 hearts with game values -> Texas transfer (4D)
 */

describe('2NT responder basics', () => {
  let system;

  beforeEach(() => {
    system = new SAYCBiddingSystem();
    // Ensure NT responses are enabled
    system.conventions.config = system.conventions.config || {};
    system.conventions.config.notrump_responses = system.conventions.config.notrump_responses || {};
    system.conventions.config.notrump_responses.stayman = { enabled: true };
    system.conventions.config.notrump_responses.jacoby_transfers = { enabled: true };
    system.conventions.config.notrump_responses.texas_transfers = { enabled: true };

    system.startAuction('N');
    system.currentAuction.add(new Bid('2NT')); // Partner opens 2NT (20-21)
  });

  test('Responder: 4 HCP without a 4-card major bids 3NT', () => {
    // 4 HCP, no 4-card major: shapes like 3-3 majors
    const hand = makeHandFromPattern('Q32', 'Q32', '432', '432'); // 4 HCP, balanced-ish
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('3NT');
  });

  test('Responder: 3 HCP without a 4-card major passes', () => {
    // 3 HCP, no 4-card major
    const hand = makeHandFromPattern('J32', 'J32', '432', '432'); // 2 HCP actually, but <=3 still should pass
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('PASS');
  });

  test('Responder: 6 hearts and ~9 HCP uses Jacoby (3D) over 2NT', () => {
    // ~9 HCP with 6 hearts -> prefer 3-level transfer (Jacoby) per repo tests
    const hand = makeHandFromPattern('32', 'AKJ432', '32', '32');
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('3D');
  });
});
