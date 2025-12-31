const { makeTestHand } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid, Auction } = require('../js/bridge-types');

/**
 * Competitive raises by responder across openings after interference:
 * Pattern: 1X – (2Y) – ?
 * With exactly 3-card support for opener's suit and low values (TP ~6–9) -> 2X
 * With invitational values (TP >= 10) -> 3X
 */

describe('Responder competitive raises across openings after interference', () => {
  let system;

  beforeEach(() => {
    system = new SAYCBiddingSystem();
    system.startAuction('N');
    system.currentAuction = new Auction([], { dealer: 'S', ourSeat: 'N' });
  });

  function setup(opening, overcall) {
    system.currentAuction.add(new Bid(opening)); // S opens 1X (our side)
    system.currentAuction.add(new Bid(overcall)); // W overcalls 2Y (their side)
  }

  // Minor: 1C – (2D)
  test('1C – (2D): exactly 3 clubs and ~8 TP -> 3C', () => {
    setup('1C', '2D');
    // Shape: S=3, H=3, D=4, C=3 (no 4-card major; exactly 3 clubs)
    const northHand = makeTestHand(3, 3, 4, 3, 8);
    const bid = system.getBid(northHand);
  expect(bid && bid.token).toBe('3C');
    expect((bid.conventionUsed || '').toLowerCase()).toContain('competitive raise');
  });

  test('1C – (2D): exactly 3 clubs and ~11 TP -> 3C', () => {
    setup('1C', '2D');
    const northHand = makeTestHand(3, 3, 4, 3, 11);
    const bid = system.getBid(northHand);
    expect(bid && bid.token).toBe('3C');
    expect((bid.conventionUsed || '').toLowerCase()).toContain('competitive raise');
  });

  // Major: 1H – (2S)
  test('1H – (2S): exactly 3 hearts and ~8 TP -> 3H', () => {
    setup('1H', '2S');
    // Shape: S=3, H=3, D=4, C=3 => exactly 3 hearts; no 4-card spade to avoid Negative Double distraction
    const northHand = makeTestHand(3, 3, 4, 3, 8);
    const bid = system.getBid(northHand);
  expect(bid && bid.token).toBe('3H');
    expect((bid.conventionUsed || '').toLowerCase()).toContain('competitive raise');
  });

  test('1H – (2S): exactly 3 hearts and ~11 TP -> 3H', () => {
    setup('1H', '2S');
    const northHand = makeTestHand(3, 3, 4, 3, 11);
    const bid = system.getBid(northHand);
    expect(bid && bid.token).toBe('3H');
    expect((bid.conventionUsed || '').toLowerCase()).toContain('competitive raise');
  });

  // Major: 1S – (2H)
  test('1S – (2H): exactly 3 spades and ~8 TP -> 2S', () => {
    setup('1S', '2H');
    // Shape: give spades exactly 3; no 4-card hearts; use D=4 to hold the 4-card suit in a minor
    const northHand = makeTestHand(3, 3, 4, 3, 8);
    const bid = system.getBid(northHand);
    expect(bid && bid.token).toBe('2S');
    expect((bid.conventionUsed || '').toLowerCase()).toContain('competitive raise');
  });

  test('1S – (2H): exactly 3 spades and ~11 TP -> 3S', () => {
    setup('1S', '2H');
    const northHand = makeTestHand(3, 3, 4, 3, 11);
    const bid = system.getBid(northHand);
    expect(bid && bid.token).toBe('3S');
    expect((bid.conventionUsed || '').toLowerCase()).toContain('competitive raise');
  });

  // Symmetric minor: 1D – (2C)
  test('1D – (2C): exactly 3 diamonds and ~8 TP -> 2D', () => {
    setup('1D', '2C');
    const northHand = makeTestHand(3, 3, 3, 4, 8);
    const bid = system.getBid(northHand);
    expect(bid && bid.token).toBe('2D');
    expect((bid.conventionUsed || '').toLowerCase()).toContain('competitive raise');
  });

  test('1D – (2C): exactly 3 diamonds and ~11 TP -> 3D', () => {
    setup('1D', '2C');
    const northHand = makeTestHand(3, 3, 3, 4, 11);
    const bid = system.getBid(northHand);
    expect(bid && bid.token).toBe('3D');
    expect((bid.conventionUsed || '').toLowerCase()).toContain('competitive raise');
  });

  // Guardrails: do NOT competitively raise with only 2-card support
  test('1C – (2D): only 2 clubs (~8 TP) should not raise to 2C/3C', () => {
    setup('1C', '2D');
    // Avoid 4-card majors to sidestep Negative Double; exactly 2 clubs
    const northHand = makeTestHand(3, 3, 5, 2, 8);
    const bid = system.getBid(northHand);
    expect(bid && bid.token).not.toBe('2C');
    expect(bid && bid.token).not.toBe('3C');
    expect((bid.conventionUsed || '').toLowerCase()).not.toContain('competitive raise');
  });

  test('1D – (2C): only 2 diamonds (~8 TP) should not raise to 2D/3D', () => {
    setup('1D', '2C');
    const northHand = makeTestHand(3, 3, 2, 5, 8);
    const bid = system.getBid(northHand);
    expect(bid && bid.token).not.toBe('2D');
    expect(bid && bid.token).not.toBe('3D');
    expect((bid.conventionUsed || '').toLowerCase()).not.toContain('competitive raise');
  });

  test('1H – (2S): only 2 hearts (~8 TP) should not raise to 2H/3H', () => {
    setup('1H', '2S');
    // Keep both majors <4 to avoid Negative Double bias; exactly 2 hearts
    const northHand = makeTestHand(3, 2, 4, 4, 8);
    const bid = system.getBid(northHand);
    expect(bid && bid.token).not.toBe('2H');
    expect(bid && bid.token).not.toBe('3H');
    expect((bid.conventionUsed || '').toLowerCase()).not.toContain('competitive raise');
  });

  test('1S – (2H): only 2 spades (~8 TP) should not raise to 2S/3S', () => {
    setup('1S', '2H');
    const northHand = makeTestHand(2, 3, 4, 4, 8);
    const bid = system.getBid(northHand);
    expect(bid && bid.token).not.toBe('2S');
    expect(bid && bid.token).not.toBe('3S');
    expect((bid.conventionUsed || '').toLowerCase()).not.toContain('competitive raise');
  });
});
