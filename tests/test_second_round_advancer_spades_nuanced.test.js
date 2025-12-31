/**
 * Nuanced tests for second-round (advancer) raises after partner's 1S overcall.
 * Expectations:
 * - With 3+ spades and 6–10 HCP: raise to 2S
 * - With 3+ spades and 11–12 HCP: jump raise to 3S (invitational)
 */

const { makeTestHand } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid, Auction } = require('../js/bridge-types');

function setupAuctionFor1SOvercall() {
  const system = new SAYCBiddingSystem();
  system.startAuction('W');
  system.currentAuction = new Auction([], { dealer: 'S', ourSeat: 'W' });
  // Sequence: PASS (S) – PASS (W) – 1D (N) – 1S (E) – PASS (S) – (? W)
  system.currentAuction.add(new Bid('PASS'));
  system.currentAuction.add(new Bid('PASS'));
  system.currentAuction.add(new Bid('1D'));
  system.currentAuction.add(new Bid('1S'));
  system.currentAuction.add(new Bid('PASS'));
  return system;
}

describe('Second round: Advancer raises after partner\'s 1S overcall (nuanced)', () => {
  test('Raise to 2S with 6–10 HCP and 3+ spades', () => {
    const system = setupAuctionFor1SOvercall();
    const hand = makeTestHand(4, 3, 3, 3, 8); // 4 spades, 8 HCP
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2S');
  });

  test('Jump raise to 3S with 11–12 HCP and 3+ spades', () => {
    const system = setupAuctionFor1SOvercall();
    const hand = makeTestHand(4, 3, 3, 3, 12); // 4 spades, 12 HCP
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('3S');
  });
});
