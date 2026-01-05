/**
 * Test configuration knob: advancer jump raise min support.
 * Default is 4; when set to 3, allow 3M jump raise with only 3-card support.
 */

const { makeTestHand } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../assets/js/combined-bidding-system');
const { Bid, Auction } = require('../assets/js/bridge-types');

function setupAuctionFor1HOvercall() {
  const system = new SAYCBiddingSystem();
  system.startAuction('W');
  system.currentAuction = new Auction([], { dealer: 'S', ourSeat: 'W' });
  system.currentAuction.add(new Bid('PASS'));
  system.currentAuction.add(new Bid('PASS'));
  system.currentAuction.add(new Bid('1D'));
  system.currentAuction.add(new Bid('1H'));
  system.currentAuction.add(new Bid('PASS'));
  return system;
}

describe('Advancer jump raise support configurability', () => {
  test('Default: 12 HCP and 3 hearts over 1D–1H → not 3H (requires 4+)', () => {
    const system = setupAuctionFor1HOvercall();
    const hand = makeTestHand(3, 3, 4, 3, 12);
    const bid = system.getBid(hand);
    expect(bid && bid.token).not.toBe('3H');
  });

  test('With jump_min_support=3: 12 HCP and 3 hearts over 1D–1H → 3H', () => {
    const system = setupAuctionFor1HOvercall();
    // Toggle configuration
    system.conventions.config.competitive.advancer_raises.jump_min_support = 3;
    const hand = makeTestHand(3, 3, 4, 3, 12);
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('3H');
  });
});
