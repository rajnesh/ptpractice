const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Auction, Bid } = require('../js/bridge-types');
const { makeHandFromPattern } = require('./test-helpers');

/**
 * Exercise opener acceptance of Jacoby transfers over 1NT via the direct helper.
 * We set the auction so the last bid is by partner on our side with 2D/2H,
 * then call _handle1NTOpenerRebid to assert 2H/2S acceptance.
 */

describe('Opener acceptance over 1NT: Jacoby transfers (2D->2H, 2H->2S)', () => {
  let system;

  beforeEach(() => {
    system = new SAYCBiddingSystem();
    system.conventions.config = system.conventions.config || {};
    system.conventions.config.notrump_responses = system.conventions.config.notrump_responses || {};
    system.conventions.config.notrump_responses.jacoby_transfers = { enabled: true };
  });

  function setup1NTWithLastPartnerAsk(lastToken) {
    system.startAuction('N');
    const auction = new Auction([], { dealer: 'N', ourSeat: 'N' });
    // N:1NT, E:PASS, S:lastToken (partner on our side)
    auction.add(new Bid('1NT'));  // N (our side)
    auction.add(new Bid('PASS')); // E
    auction.add(new Bid(lastToken)); // S (partner)
    system.currentAuction = auction;
  }

  test('Accept 2D -> 2H', () => {
    setup1NTWithLastPartnerAsk('2D');
    const openerHand = makeHandFromPattern('Q32', 'KQ2', 'Q32', 'Q32');
    const bid = system._handle1NTOpenerRebid(openerHand);
    expect(bid && bid.token).toBe('2H');
    expect((bid.conventionUsed || '').toLowerCase()).toContain('jacoby transfer accepted');
  });

  test('Accept 2H -> 2S', () => {
    setup1NTWithLastPartnerAsk('2H');
    const openerHand = makeHandFromPattern('Q32', 'KQ2', 'Q32', 'Q32');
    const bid = system._handle1NTOpenerRebid(openerHand);
    expect(bid && bid.token).toBe('2S');
    expect((bid.conventionUsed || '').toLowerCase()).toContain('jacoby transfer accepted');
  });
});
