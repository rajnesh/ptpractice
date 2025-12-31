const { makeHandFromRanks } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid } = require('../js/bridge-types');

/**
 * Responder with exactly 3 spades and 7 HCP after 1S should prefer a simple raise to 2S (fit-first),
 * not 1NT, when there is no interference.
 */

describe('Responder simple raise with 3-card support over 1S', () => {
  let system;

  beforeEach(() => {
    system = new SAYCBiddingSystem();
    system.startAuction('N');
  });

  test('1S – PASS; responder 7 HCP, exactly 3 spades -> 2S', () => {
    // Auction: opener 1S; RHO passes; our turn
    system.currentAuction.add(new Bid('1S'));
    system.currentAuction.add(new Bid(null));

    // Build a balanced hand with exactly 3 spades and ~7 HCP
    const hand = makeHandFromRanks({
      S: ['9', '7', '4'],   // 3-card support
      H: ['Q', '7', '3'],   // 2 HCP
      D: ['Q', '6'],        // 2 HCP
      C: ['K', '9', '2']    // 3 HCP
    }); // total ~7 HCP, balanced, exactly 3 spades

    const bid = system.getBid(hand);
    expect(bid).not.toBeNull();
    expect(bid.token).toBe('2S');
  });
});
