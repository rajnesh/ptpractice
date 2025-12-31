const { makeHandFromPattern } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid, Auction } = require('../js/bridge-types');

/**
 * Ensure partner-of-Michaels responds with 2NT ask when advancer doubles.
 */
describe('Michaels advancer-double -> partner ask', () => {
  let system;

  beforeEach(() => {
    system = new SAYCBiddingSystem();
    system.startAuction('S');
    // Enable conventions used in engine
    system.conventions.config.competitive = system.conventions.config.competitive || {};
    system.conventions.config.competitive.michaels = { enabled: true };
  });

  test('1S - 2S (Michaels) - X (advancer) -> partner bids 2NT (ask)', () => {
    // Construct auction with explicit seats
    system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'W' });
    // Dealer N, bids: N=1S, E=2S (Michaels), S=X, W (we) should be asked to respond
    system.currentAuction.add(new Bid('1S', { seat: 'N' }));
    system.currentAuction.add(new Bid('2S', { seat: 'E' }));
    system.currentAuction.add(new Bid(null, { seat: 'S' , isDouble: true }));

    // West's hand (we are West) can be weak; we expect engine to return 2NT asking bid
    const hand = makeHandFromPattern('32', 'KJ32', 'KQ32', '32');
    // Debug info
    try { console.log('TEST-AUCTION BIDS=', system.currentAuction.bids.map(b => ({tok: b.token, dbl: b.isDouble, seat: b.seat}))); } catch(_) {}
    // The internal interference handler should detect the pattern and return a 2NT ask.
    const inter = system._handleInterference(system.currentAuction, hand);
    expect(inter && inter.token).toBe('2NT');
    expect((inter && inter.conventionUsed) || '').toMatch(/Michaels Ask/i);
  });
});
