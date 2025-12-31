/**
 * Tests for opener continuations after a Strong 2C opening and partner's 2D waiting response.
 */

const { makeTestHand } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid, Auction } = require('../js/bridge-types');

function setupStrong2CWaitingAuction(ourSeat = 'W', dealer = 'W') {
  const system = new SAYCBiddingSystem();
  system.startAuction(ourSeat);
  system.currentAuction = new Auction([], { dealer, ourSeat });
  // Auction: 2C – PASS – 2D – PASS – (our turn)
  system.currentAuction.add(new Bid('2C')); // opener (us)
  system.currentAuction.add(new Bid('PASS'));
  system.currentAuction.add(new Bid('2D')); // partner's waiting response
  system.currentAuction.add(new Bid('PASS'));
  return system;
}

describe('Strong 2C: opener continuations over 2D waiting', () => {
  test('Balanced 22–24 HCP -> 2NT', () => {
    const system = setupStrong2CWaitingAuction('W', 'W');
    // 4-3-3-3 balanced, 22 HCP
    const hand = makeTestHand(4, 3, 3, 3, 22);
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2NT');

    // Explanation mapping should reflect classic 22–24 balanced rebid
    const exp = system.getExplanationFor(bid, system.currentAuction);
    expect(exp).toMatch(/2NT rebid over 2C: 22–24 HCP, balanced/);
  });

  test('Unbalanced with 6+ hearts -> 2H (natural)', () => {
    const system = setupStrong2CWaitingAuction('W', 'W');
    // Unbalanced with a good 6-card heart suit and strong values
    const hand = makeTestHand(3, 6, 2, 2, 22);
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2H');
    const exp = system.getExplanationFor(bid, system.currentAuction);
    expect(exp).toMatch(/Strong 2C continuation: natural hearts/);
  });
});
