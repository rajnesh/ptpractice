const { makeHandFromPattern } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid, Auction } = require('../js/bridge-types');

/**
 * Texas transfers tests
 * - Over 1NT: 10+ HCP with 6+ major -> 4D (to 4H) / 4H (to 4S)
 * - Opener acceptance: 4D -> 4H, 4H -> 4S
 * - Over 2NT: 8+ HCP with 6+ major -> 4D/4H; opener accepts
 * - When Texas disabled, responder falls back to Jacoby (2D for hearts over 1NT)
 */

describe('Texas transfers over 1NT and 2NT', () => {
  let system;

  beforeEach(() => {
    system = new SAYCBiddingSystem();
    // Ensure notrump responder conventions are enabled
    system.conventions.config = system.conventions.config || {};
    system.conventions.config.notrump_responses = system.conventions.config.notrump_responses || {};
    system.conventions.config.notrump_responses.stayman = { enabled: true };
    system.conventions.config.notrump_responses.jacoby_transfers = { enabled: true };
    system.conventions.config.notrump_responses.texas_transfers = { enabled: true };
  });

  test('Responder over 1NT with 10+ HCP and 6 hearts -> 4D (Texas)', () => {
    system.startAuction('N');
    system.currentAuction.add(new Bid('1NT'));

    // 11 HCP, 6 hearts
    const hand = makeHandFromPattern('32', 'KQJ432', 'K2', 'Q2');
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('4D');
  });

  test('Responder over 1NT with 10+ HCP and 6 spades -> 4H (Texas)', () => {
    system.startAuction('N');
    system.currentAuction.add(new Bid('1NT'));

    // 11 HCP, 6 spades
    const hand = makeHandFromPattern('KQJ432', '32', 'K2', 'Q2');
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('4H');
  });

  test('Opener acceptance: 1NT - Pass - 4D -> 4H (accept before RHO acts)', () => {
    system.startAuction('N');
    // Assign seats so opener acceptance path is active
    system.currentAuction.reseat('N');
    system.currentAuction.add(new Bid('1NT')); // N opens
    system.currentAuction.add(new Bid(null));  // E passes
  system.currentAuction.add(new Bid('4D'));  // S Texas to hearts

    // Opener acceptance should be 4H regardless of hand distribution
  const openerHand = makeHandFromPattern('Q32', 'KQ2', 'Q32', 'Q32');
  const bid = system._handle1NTOpenerRebid(openerHand);
  expect(bid && bid.token).toBe('4H');
  });

  test('Opener acceptance: 1NT - Pass - 4H -> 4S (accept before RHO acts)', () => {
    system.startAuction('N');
    system.currentAuction.reseat('N');
    system.currentAuction.add(new Bid('1NT')); // N opens
    system.currentAuction.add(new Bid(null));  // E passes
  system.currentAuction.add(new Bid('4H'));  // S Texas to spades

  const openerHand = makeHandFromPattern('Q32', 'KQ2', 'Q32', 'Q32');
  const bid = system._handle1NTOpenerRebid(openerHand);
  expect(bid && bid.token).toBe('4S');
  });

  test('Responder over 2NT with 8+ HCP and 6 hearts -> 3D (Jacoby); opener accepts 3H', () => {
    system.startAuction('N');
    system.currentAuction.reseat('N');
    system.currentAuction.add(new Bid('2NT')); // N opens 2NT
    system.currentAuction.add(new Bid(null));  // E passes
    // S bids Texas
  const responderHand = makeHandFromPattern('32', 'KQJ432', 'Q2', '32'); // ~8 HCP
  const resp = system.getBid(responderHand);
  expect(resp && resp.token).toBe('3D');

  system.currentAuction.add(new Bid('3D'));

  const openerHand = makeHandFromPattern('Q32', 'KQ2', 'Q32', 'Q32');
  const bid = system._handle2NTOpenerRebid(openerHand);
  expect(bid && bid.token).toBe('3H');
  });

  test('Responder over 2NT with 8+ HCP and 6 spades -> 3H (Jacoby); opener accepts 3S', () => {
    system.startAuction('N');
    system.currentAuction.reseat('N');
    system.currentAuction.add(new Bid('2NT')); // N opens 2NT
    system.currentAuction.add(new Bid(null));  // E passes

  const responderHand = makeHandFromPattern('KQJ432', '32', 'Q2', '32'); // ~8 HCP
  const resp = system.getBid(responderHand);
  expect(resp && resp.token).toBe('3H');

  system.currentAuction.add(new Bid('3H'));

  const openerHand = makeHandFromPattern('Q32', 'KQ2', 'Q32', 'Q32');
  const bid = system._handle2NTOpenerRebid(openerHand);
  expect(bid && bid.token).toBe('3S');
  });

  test('Texas disabled over 1NT falls back to Jacoby (2D for hearts)', () => {
    system.startAuction('N');
    // Explicitly disable Texas
    system.conventions.config.notrump_responses.texas_transfers = { enabled: false };
    // Keep Jacoby enabled
    system.conventions.config.notrump_responses.jacoby_transfers = { enabled: true };

    system.currentAuction.add(new Bid('1NT'));

    const hand = makeHandFromPattern('32', 'KQJ432', 'K2', 'Q2');
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2D');
  });
});
