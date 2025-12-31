const { makeHandFromRanks } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid } = require('../js/bridge-types');

/**
 * Ensure responder with 4+ spade support and 6-9 points raises over 1S (does not pass).
 */

describe('Responder simple raise over 1S', () => {
  let system;

  beforeEach(() => {
    system = new SAYCBiddingSystem('tests/test_conventions.json');
    system.startAuction('N');
  });

  test('With 5 spades and 7 HCP, raise to 2S over 1S (after one pass)', () => {
    // Auction: 1S (opener) — PASS (RHO) — our turn
    system.currentAuction.add(new Bid('1S'));
    system.currentAuction.add(new Bid(null)); // Pass by next hand

    const hand = makeHandFromRanks({
      S: ['K', 'J', '9', '7', '4'], // 4 HCP, 5-card support
      H: ['Q', '7', '3'],           // 2 HCP
      D: ['J', '6'],                // 1 HCP
      C: ['9', '8', '2']            // 0 HCP
    });

    const bid = system.getBid(hand);
    expect(bid).not.toBeNull();
    expect(bid.token).toBe('2S');
  });

  test('Still raises to 2S when Jacoby 2NT is enabled (low points)', () => {
    system.currentAuction.add(new Bid('1S'));
    system.currentAuction.add(new Bid(null));

    // Ensure Jacoby 2NT is enabled
    system.conventions.config.responses = system.conventions.config.responses || {};
    system.conventions.config.responses.jacoby_2nt = { enabled: true };

    const hand = makeHandFromRanks({
      S: ['K', 'J', '9', '7', '4'],
      H: ['Q', '7', '3'],
      D: ['J', '6'],
      C: ['9', '8', '2']
    });

    const bid = system.getBid(hand);
    expect(bid).not.toBeNull();
    expect(bid.token).toBe('2S');
  });
});
