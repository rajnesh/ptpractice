const { SAYCBiddingSystem } = require('../assets/js/combined-bidding-system');
const { Bid, Auction } = require('../assets/js/bridge-types');

describe('Additional explanation string checks', () => {
  let system;
  beforeEach(() => {
    system = new SAYCBiddingSystem();
    system.conventions.config = system.conventions.config || {};
  });

  test('Gerber (4C after NT) explains as Gerber asking for aces', () => {
    const auction = new Auction([new Bid('1NT')], { dealer: 'N', ourSeat: 'S' });
    const ex = system.getExplanationFor(new Bid('4C'), auction);
    expect(typeof ex).toBe('string');
    expect(ex.toLowerCase()).toContain('gerber');
    expect(ex.toLowerCase()).toContain('aces');
  });

  test('4NT after a suit contract shows Blackwood/RKCB asking for keycards', () => {
    const auction = new Auction([new Bid('1S')], { dealer: 'N', ourSeat: 'E' });
    const ex = system.getExplanationFor(new Bid('4NT'), auction);
    expect(typeof ex).toBe('string');
    // implementation returns RKCB ... asking for keycards or Blackwood: asking for aces
    expect(ex.toLowerCase()).toMatch(/keycards|aces/);
    expect(ex.toLowerCase()).toContain('asking');
  });

  test('Negative Double mapping is explained (shows unbid majors)', () => {
    const auction = new Auction([new Bid('1C'), new Bid('1D')], { dealer: 'N', ourSeat: 'E' });
    const ex = system.getExplanationFor(new Bid('X'), auction);
    expect(typeof ex).toBe('string');
    expect(ex).toContain('Negative Double');
    // When clubs and diamonds opened, negative double usually shows hearts and spades
    expect(ex.toLowerCase()).toContain('hearts');
  });

  test('Reopening double (balancing) is described', () => {
    const auction = new Auction([new Bid('1S'), new Bid('PASS'), new Bid('PASS')], { dealer: 'N', ourSeat: 'E' });
    const ex = system.getExplanationFor(new Bid('X'), auction);
    expect(typeof ex).toBe('string');
    expect(ex).toContain('Reopening Double');
  });

  test('Cue-bid raise over opponent overcall returns Cue Bid Raise description', () => {
    // Setup: opener 1H, opponent overcalls 1S, then partner passes; the subsequent cue (3H)
    // should be recognized as a cue-raise of opponent's suit when timing/parity matches.
    const auction = new Auction([new Bid('1H'), new Bid('1S'), new Bid('PASS')], { dealer: 'N', ourSeat: 'E' });
    const ex = system.getExplanationFor(new Bid('3H'), auction);
    expect(typeof ex).toBe('string');
    expect(ex).toContain('Cue Bid Raise');
  });
});
