/**
 * Nuanced tests for second-round (advancer) raises after partner's 1H overcall.
 * - 6–10 HCP and 3+ hearts -> 2H
 * - 11–12 HCP and 4+ hearts -> 3H (default requires 4+ for jump)
 * - 13+ HCP and 3+ hearts -> cue-bid opener's suit (2m) to show strong raise
 */

const { makeTestHand } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../assets/js/combined-bidding-system');
const { Bid, Auction } = require('../assets/js/bridge-types');

function setupAuction(opening, overcall) {
  const system = new SAYCBiddingSystem();
  system.startAuction('W');
  system.currentAuction = new Auction([], { dealer: 'S', ourSeat: 'W' });
  system.currentAuction.add(new Bid('PASS'));
  system.currentAuction.add(new Bid('PASS'));
  system.currentAuction.add(new Bid(opening)); // North opens 1m
  system.currentAuction.add(new Bid(overcall)); // East overcalls 1H
  system.currentAuction.add(new Bid('PASS'));
  return system;
}

describe('Second round: Advancer over 1H overcall (nuanced)', () => {
  test('2H with 8 HCP and 3 hearts (1C–1H)', () => {
    const system = setupAuction('1C', '1H');
    const hand = makeTestHand(3, 3, 4, 3, 8);
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2H');
  });

  test('3H with 12 HCP and 4 hearts (1D–1H)', () => {
    const system = setupAuction('1D', '1H');
    const hand = makeTestHand(3, 4, 3, 3, 12);
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('3H');
  });

  test('Cue-bid 2D with 13 HCP and 3 hearts over 1D–1H', () => {
    const system = setupAuction('1D', '1H');
    const hand = makeTestHand(3, 3, 4, 3, 13);
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2D');
  });

  test('Cue-bid 2C with 13 HCP and 3 hearts over 1C–1H', () => {
    const system = setupAuction('1C', '1H');
    const hand = makeTestHand(3, 3, 4, 3, 13);
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2C');
  });
});
