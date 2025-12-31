const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid, Auction } = require('../js/bridge-types');

describe('Explanation strings sanity checks', () => {
  let system;
  beforeEach(() => {
    system = new SAYCBiddingSystem();
    // ensure conventions exist
    system.conventions.config = system.conventions.config || {};
  });

  test('1NT responder explanation mentions no 3-card support', () => {
    const auction = new Auction([new Bid('1H')], { dealer: 'S', ourSeat: 'N' });
    const ex = system.getExplanationFor(new Bid('1NT'), auction);
    expect(typeof ex).toBe('string');
    expect(ex.toLowerCase()).toContain('no 3-card');
  });

  test('1C opening explanation references best minor', () => {
    // pass an empty auction-like array so function treats this as an opening
    const ex = system.getExplanationFor(new Bid('1C'), []);
    expect(typeof ex).toBe('string');
    expect(ex.toLowerCase()).toContain('best minor');
  });

  test('2NT over 1NT explanation is invitational', () => {
    const auction = new Auction([new Bid('1NT')], { dealer: 'S', ourSeat: 'N' });
    const ex = system.getExplanationFor(new Bid('2NT'), auction);
    expect(typeof ex).toBe('string');
    expect(ex.toLowerCase()).toContain('invitational');
    expect(ex).toMatch(/2NT/);
  });

  test('Feature ask over Weak Two (2NT) is described', () => {
    const auction = new Auction([new Bid('2H')], { dealer: 'S', ourSeat: 'N' });
    const ex = system.getExplanationFor(new Bid('2NT'), auction);
    expect(typeof ex).toBe('string');
    expect(ex.toLowerCase()).toContain('feature ask');
  });
});
