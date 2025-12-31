const { makeTestHand } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid } = require('../js/bridge-types');

/**
 * Responder natural raises over minor openings (no interference).
 */

describe('Responder raises over 1m openings', () => {
  let system;

  beforeEach(() => {
    system = new SAYCBiddingSystem();
    system.startAuction('E');
    system.currentAuction.reseat('S');
  });

  function setup1D() {
    system.currentAuction.add(new Bid(null)); // S PASS
    system.currentAuction.add(new Bid('1D')); // W opens 1D
    system.currentAuction.add(new Bid(null)); // N PASS
  }

  function setup1C() {
    system.currentAuction.add(new Bid(null)); // S PASS
    system.currentAuction.add(new Bid('1C')); // W opens 1C
    system.currentAuction.add(new Bid(null)); // N PASS
  }

  test('1D – responder 8 TP with 4+ diamonds -> 2D', () => {
    setup1D();
    // 8 HCP, add 1 DP with doubleton to simulate 9 TP in logs; but totalPoints>=6 suffices for 2D
    const hand = makeTestHand(3, 3, 4, 3, 8); // 4 diamonds, 8 HCP
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2D');
  });

  test('1C – responder 8 TP with 4+ clubs -> 2C', () => {
    setup1C();
    const hand = makeTestHand(3, 3, 3, 4, 8); // 4 clubs, 8 HCP
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2C');
  });

  test('1D – responder 11 TP with 4+ diamonds -> 3D invitational', () => {
    setup1D();
    const hand = makeTestHand(3, 3, 4, 3, 10); // 10 HCP -> 10+ TP
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('3D');
  });
});
