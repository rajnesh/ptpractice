const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid, Auction } = require('../js/bridge-types');

describe('1NT responder explanation', () => {
  test('1NT response over partner 1H includes no 3-card wording', () => {
    const system = new SAYCBiddingSystem();
    // Partner opened 1H; ourSeat set as partner so this is a responder action
    const auction = new Auction([ new Bid('1H') ], { dealer: 'N', ourSeat: 'S' });
    const ex = system.getExplanationFor(new Bid('1NT'), auction);
    expect(typeof ex).toBe('string');
    expect(ex.toLowerCase()).toContain('no 3-card');
  });
});

