const { makeHandFromPattern } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid, Auction } = require('../js/bridge-types');

/**
 * Tests for systems-on options over interference of our 1NT opening.
 */

describe('Systems on over 1NT interference', () => {
  let system;

  beforeEach(() => {
    system = new SAYCBiddingSystem();
    // Enable options in General Settings
    system.conventions.config.general = system.conventions.config.general || {};
    system.conventions.config.general.systems_on_over_1nt_interference = {
      stayman: true,
      transfers: true,
      stolen_bid_double: true
    };
  });

  test('Stolen-bid double: 1NT (we) – (2C) – X denotes Stayman', () => {
    system.startAuction('N');
    system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'N' });

    // 1NT by North, 2C overcall by East
    system.currentAuction.add(new Bid('1NT', { seat: 'N' }));
    system.currentAuction.add(new Bid('2C', { seat: 'E' }));

    // Responder with 8+ HCP and a 4-card major
  const hand = makeHandFromPattern('KQ32', 'KQ32', '432', '32'); // 10 HCP, 4-4 majors
    const bid = system.getBid(hand);

    expect(bid.isDouble).toBe(true);
    expect(bid.conventionUsed || '').toContain('Stolen Bid');
    expect(bid.conventionUsed || '').toContain('Stayman');
  });

  test('Transfers on over 2C: 1NT – (2C) – 2H/2D as transfers', () => {
    system.startAuction('N');
    system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'N' });

    // 1NT by North, 2C overcall by East
    system.currentAuction.add(new Bid('1NT', { seat: 'N' }));
    system.currentAuction.add(new Bid('2C', { seat: 'E' }));

    // Responder with 5 spades -> 2H (transfer to spades)
    const spadeHand = makeHandFromPattern('KQJ32', '32', '432', '432');
    const bidSp = system.getBid(spadeHand);
  expect(bidSp.token).toBe('2H');

    // Responder with 5 hearts -> 2D (transfer to hearts)
    system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'N' });
    system.currentAuction.add(new Bid('1NT', { seat: 'N' }));
    system.currentAuction.add(new Bid('2C', { seat: 'E' }));
    const heartHand = makeHandFromPattern('32', 'KQJ32', '432', '432');
    const bidH = system.getBid(heartHand);
  expect(bidH.token).toBe('2D');
  });
});
