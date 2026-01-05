const { makeHandFromPattern } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../assets/js/combined-bidding-system');
const { Bid, Auction } = require('../assets/js/bridge-types');

/**
 * Minor-suit transfers (MST) toggles and opener acceptances over 1NT.
 */

describe('Minor-suit transfers toggles over 1NT', () => {
  let system;

  beforeEach(() => {
    system = new SAYCBiddingSystem();
    system.startAuction('N');
  });

  test('When MST enabled: responder with 6+ clubs uses 2S; opener accepts to 3C', () => {
    // Enable MST
    system.conventions.config.notrump_responses = system.conventions.config.notrump_responses || {};
    system.conventions.config.notrump_responses.minor_suit_transfers = { enabled: true };

    // Partner opens 1NT; we respond with MST
    system.currentAuction = new Auction([], { dealer: 'S', ourSeat: 'N' });
    // S opens
    system.currentAuction.add(new Bid('1NT'));
    system.currentAuction.add(new Bid(null));  // W passes

    const hand = makeHandFromPattern('32', '32', '32', 'KQJ987'); // 6+ clubs
    const resp = system.getBid(hand);
    expect(resp && resp.token).toBe('2S'); // transfer to clubs

  // Now as opener, accept 2S -> 3C
  system.currentAuction.add(resp); // N bids 2S
  const openerHand = makeHandFromPattern('Q32', 'Q32', 'Q32', 'Q32'); // balanced opener
  const accept = system._handle1NTOpenerRebid(openerHand);
    expect(accept && accept.token).toBe('3C');
  });

  test('When MST disabled: responder does not choose 2S/2NT MST paths', () => {
    // Disable MST explicitly
    system.conventions.config.notrump_responses = system.conventions.config.notrump_responses || {};
    system.conventions.config.notrump_responses.minor_suit_transfers = { enabled: false };

  system.currentAuction = new Auction([], { dealer: 'S', ourSeat: 'N' });
  system.currentAuction.add(new Bid('1NT'));

    const hand = makeHandFromPattern('32', '32', '32', 'KQJ987'); // 6+ clubs
    const resp = system.getBid(hand);
    // Should not pick 2S (clubs) or 2NT (diamonds) MST triggers
    expect(!resp || (resp.token !== '2S' && resp.token !== '2NT')).toBe(true);
  });
});
