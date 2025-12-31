/**
 * Tests for responder over 1H with balanced hand and no 4-card support.
 */

const { makeTestHand } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid } = require('../js/bridge-types');

function setBergen(system, on) {
  system.conventions.config.responses = system.conventions.config.responses || {};
  system.conventions.config.responses.bergen_raises = { enabled: !!on };
}

describe('Responder over 1H: balanced, no 4-card support', () => {
  let system;

  beforeEach(() => {
    system = new SAYCBiddingSystem();
  });

  test('1H – PASS – responder 11 HCP balanced with no 4-card spades bids 1NT', () => {
    system.startAuction('N');
    system.currentAuction.add(new Bid('1H'));
    system.currentAuction.add(new Bid('PASS'));

    // Balanced 4-3-3-3 with no 4 spades and <4 hearts: S=3, H=3, D=3, C=4; 11 HCP
    const hand = makeTestHand(3, 3, 3, 4, 11);
    const bid = system.getBid(hand);
    expect(bid).not.toBeNull();
    expect(bid.token).toBe('1NT');
  });
});
