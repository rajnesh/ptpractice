/**
 * Responder after three leading passes: partner opens 1C, we should not pass with 4+ major at 6+ points.
 */

const { makeTestHand } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../assets/js/combined-bidding-system');
const { Bid } = require('../assets/js/bridge-types');

function setupAuctionWithDealer(system, sequence, dealer = 'S', ourSeat = 'W') {
  system.startAuction(ourSeat);
  // Assign dealer to enable seat-aware logic
  system.currentAuction.reseat(dealer);
  for (const tok of sequence) {
    system.currentAuction.add(new Bid(tok));
  }
}

describe('Responder after three passes over partner\'s 1C opening', () => {
  let system;

  beforeEach(() => {
    system = new SAYCBiddingSystem();
  });

  test('Pass Pass Pass 1C Pass — responder with 5 spades, 4 hearts, 8 HCP bids 1S', () => {
    // Sequence: S:PASS, W:PASS, N:PASS, E:1C, S:PASS, W:?
    setupAuctionWithDealer(system, ['PASS','PASS','PASS','1C','PASS'], 'S', 'W');

    // 5 spades, 4 hearts, others low; 8 HCP
    const hand = makeTestHand(5, 4, 2, 2, 8);
    const bid = system.getBid(hand);
    expect(bid).not.toBeNull();
    expect(bid.token).toBe('1S');
  });

  test('Pass Pass Pass 1C Pass — responder with 4 hearts (no spades), 8 HCP bids 1H', () => {
    setupAuctionWithDealer(system, ['PASS','PASS','PASS','1C','PASS'], 'S', 'W');

    // 4 hearts, 3 spades (no 4 spades), 8 HCP
    const hand = makeTestHand(3, 4, 3, 3, 8);
    const bid = system.getBid(hand);
    expect(bid).not.toBeNull();
    expect(bid.token).toBe('1H');
  });
});
