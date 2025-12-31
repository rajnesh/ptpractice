const { makeHandFromPattern } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid, Auction } = require('../js/bridge-types');

/**
 * Minor Suit Transfers over 1NT (Four-way transfers):
 * - When enabled: 2S transfers to clubs; 2NT transfers to diamonds.
 * - Opener accepts: 2S -> 3C, 2NT -> 3D.
 * Priority: major suit transfers and Stayman take precedence; MST considered after majors.
 * When disabled: 2NT remains invitational (8-9 HCP balanced with no 4-card major).
 */

describe('Minor Suit Transfers over 1NT', () => {
  let system;

  beforeEach(() => {
    system = new SAYCBiddingSystem();
    system.conventions.config = system.conventions.config || {};
    system.conventions.config.notrump_responses = system.conventions.config.notrump_responses || {};
    system.conventions.config.notrump_responses.stayman = { enabled: true };
    system.conventions.config.notrump_responses.jacoby_transfers = { enabled: true };
    system.conventions.config.notrump_responses.texas_transfers = { enabled: true };
    system.conventions.config.notrump_responses.minor_suit_transfers = { enabled: true };
  });

  test('Responder: 6+ clubs over 1NT -> 2S (transfer to clubs)', () => {
    system.startAuction('N');
    system.currentAuction.add(new Bid('1NT'));
    const hand = makeHandFromPattern('32', '32', 'K2', 'KQJ432');
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2S');
  });

  test('Responder: 6+ diamonds over 1NT -> 2NT (transfer to diamonds)', () => {
    system.startAuction('N');
    system.currentAuction.add(new Bid('1NT'));
    const hand = makeHandFromPattern('32', '32', 'KQJ432', 'K2');
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2NT');
  });

  test('Opener acceptance: 1NT - Pass - 2S -> 3C', () => {
    system.startAuction('N');
    system.currentAuction.reseat('N');
  system.currentAuction.add(new Bid('1NT'));
  system.currentAuction.add(new Bid(null)); // RHO passes
  system.currentAuction.add(new Bid('2S'));

    const openerHand = makeHandFromPattern('Q32', 'KQ2', 'Q32', 'Q32');
    const accept = system._handle1NTOpenerRebid(openerHand);
    expect(accept && accept.token).toBe('3C');
  });

  test('Opener acceptance: 1NT - Pass - 2NT -> 3D', () => {
    system.startAuction('N');
    system.currentAuction.reseat('N');
  system.currentAuction.add(new Bid('1NT'));
  system.currentAuction.add(new Bid(null)); // RHO passes
  system.currentAuction.add(new Bid('2NT'));

    const openerHand = makeHandFromPattern('Q32', 'KQ2', 'Q32', 'Q32');
    const accept = system._handle1NTOpenerRebid(openerHand);
    expect(accept && accept.token).toBe('3D');
  });

  test('Priority: with 5+ spades and 6+ clubs, prefer Jacoby (2H) to minor transfer', () => {
    system.startAuction('N');
    system.currentAuction.add(new Bid('1NT'));
    const hand = makeHandFromPattern('KQJ32', '32', '2', 'KQJ432'); // 5S and 6C
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2H'); // Jacoby to spades beats minor transfer
  });

  test('Disabled MST: 2NT remains invitational when balanced 8-9 without a major', () => {
    system.conventions.config.notrump_responses.minor_suit_transfers = { enabled: false };

    system.startAuction('N');
    system.currentAuction.add(new Bid('1NT'));
    const hand = makeHandFromPattern('Q32', 'Q32', 'Q32', 'Q32'); // 8 HCP balanced, no 4-card major
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2NT');
  });
});
