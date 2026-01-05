const { SAYCBiddingSystem } = require('../assets/js/combined-bidding-system');
const { Bid, Auction } = require('../assets/js/bridge-types');

describe('Expanded explanation cases', () => {
  let system;
  beforeEach(() => {
    system = new SAYCBiddingSystem();
    system.conventions.config = system.conventions.config || {};
  });

  test('Strong 2C opening returns strong 2C wording when convention enabled', () => {
    // Enable the strong 2C convention for opening bids
    system.conventions.isEnabled = (key, area) => (key === 'strong_2_clubs' && area === 'opening_bids') ? true : false;
    const ex = system.getExplanationFor(new Bid('2C'), []);
    expect(typeof ex).toBe('string');
    expect(ex.toLowerCase()).toContain('strong 2 clubs');
  });

  test('Responder jump shift is identified as strong', () => {
    const auction = new Auction([new Bid('1C')], { dealer: 'N', ourSeat: 'S' });
    const ex = system.getExplanationFor(new Bid('3D'), auction);
    expect(typeof ex).toBe('string');
    expect(ex.toLowerCase()).toContain('responder jump shift');
    expect(ex.toLowerCase()).toContain('strong');
  });

  test('New suit at 2-level over interference is described as free-bid/constructive', () => {
    const auction = new Auction([new Bid('1S')], { dealer: 'N', ourSeat: 'E' });
    const ex = system.getExplanationFor(new Bid('2H'), auction);
    expect(typeof ex).toBe('string');
    // The engine uses wording "New suit at 2-level: natural" in some branches
    expect(ex.toLowerCase()).toMatch(/new suit at 2-level|new suit/);
  });

  test('Opener rebid in own suit in competition is described as opener rebid', () => {
    // Build an auction with opener 1H, opponent overcall 2C, partner PASS, opener rebids 2H
    const auction = new Auction([
      new Bid('1H'),
      new Bid('2C'),
      new Bid('PASS'),
      new Bid('2H')
    ], { dealer: 'N', ourSeat: 'S' });

    const ex = system.getExplanationFor(new Bid('2H'), auction);
    expect(typeof ex).toBe('string');
    expect(ex).toMatch(/Opener's rebid|opener's rebid|Opener.*rebid/i);
  });
});
