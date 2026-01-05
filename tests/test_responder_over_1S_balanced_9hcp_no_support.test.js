/**
 * Ensure responder bids 1NT with 8–9 HCP balanced and no 4-card support over 1S.
 */

const { makeTestHand } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../assets/js/combined-bidding-system');
const { Bid } = require('../assets/js/bridge-types');

describe('Responder over 1S: 9 HCP balanced, no 4-card support', () => {
  let system;

  beforeEach(() => {
    system = new SAYCBiddingSystem();
    system.startAuction('N');
  });

  test('1S – PASS – responder 9 HCP balanced with <4 spades bids 1NT', () => {
    system.currentAuction.add(new Bid('1S'));
    system.currentAuction.add(new Bid('PASS'));

    // Balanced 4-3-3-3 with <4 spades and <4 hearts: S=3, H=3, D=3, C=4; 9 HCP
    const hand = makeTestHand(3, 3, 3, 4, 9);
    const bid = system.getBid(hand);
    expect(bid).not.toBeNull();
    expect(bid.token).toBe('1NT');
  });
});
