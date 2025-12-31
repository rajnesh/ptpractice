const { makeHandFromPattern, makeTestHand } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid, Auction } = require('../js/bridge-types');

/**
 * Responder actions after our 1D opening and their 2C overcall (seat-aware):
 * - With 13+ HCP, balanced, club stopper, and no clear fit: bid 3NT.
 * - With 13+ HCP, balanced, no club stopper, and no clear fit: cue-bid 3C (values; asks for stopper).
 */

describe('Responder over 1D – (2C): choose NT or cue-bid instead of passing', () => {
  let system;

  beforeEach(() => {
    system = new SAYCBiddingSystem();
    system.startAuction('N');
    system.currentAuction = new Auction([], { dealer: 'S', ourSeat: 'N' });
  });

  function setup1D_over_2C() {
    system.currentAuction.add(new Bid('1D')); // S opens 1D
    system.currentAuction.add(new Bid('2C')); // W overcalls 2C
  }

  test('14 HCP balanced with club stopper -> 3NT', () => {
    setup1D_over_2C();
    // Shape 5-3-3-2 with D=2 (no 3-card diamond support), balanced, club stopper (A)
    // S: K32 (3 HCP), H: KQ2 (5 HCP), D: Q2 (2 HCP), C: A4322 (4 HCP) => 14 HCP
    const northHand = makeHandFromPattern('K32', 'KQ2', 'Q2', 'A4322');
    const bid = system.getBid(northHand);
    expect(bid && bid.token).toBe('3NT');
    expect(bid.conventionUsed || '').toMatch(/3NT|Natural/i);
  });

  test('14 HCP balanced without club stopper -> 3C cue-bid (values; asks for stopper)', () => {
    setup1D_over_2C();
    // Shape 5-3-3-2 with clubs length but no A/K/Q in clubs; game values
    // S: KQJ (6), H: KQ2 (5), D: K2 (3), C: 43222 (0) => 14 HCP; no club stopper
    const northHand = makeHandFromPattern('KQJ', 'KQ2', 'K2', '43222');
    const bid = system.getBid(northHand);
    expect(bid && bid.token).toBe('3C');
    expect((bid.conventionUsed || '').toLowerCase()).toContain('cue bid');
  });

  test('With 4-4 majors over 1D – (2C) -> Negative Double (shows majors)', () => {
    setup1D_over_2C();
    // 4-4 majors, no clear diamond fit, typical negative double hand
    // S: KQ74 (5), H: KQ74 (5), D: 432 (0), C: 32 (0) => 10 HCP
    const northHand = makeHandFromPattern('KQ74', 'KQ74', '432', '32');
    const bid = system.getBid(northHand);
    expect(bid && bid.isDouble).toBe(true);
    expect((bid.conventionUsed || '').toLowerCase()).toContain('negative double');
  });

  test('With only one 4-card major (4S, 3H) over 1D – (2C) -> Negative Double', () => {
    setup1D_over_2C();
    // S: KQ74 (5), H: KJ3 (4), D: 432 (0), C: 32 (0) => 9 HCP; still fine for a negative double style
    const northHand = makeHandFromPattern('KQ74', 'KJ3', '432', '32');
    const bid = system.getBid(northHand);
    expect(bid && bid.isDouble).toBe(true);
    expect((bid.conventionUsed || '').toLowerCase()).toContain('negative double');
  });

  test('With exactly 3-card diamond support and ~8 total points -> 2D competitive raise', () => {
    setup1D_over_2C();
    // 4-3-3-3 pattern avoids 4-card major to not trigger Negative Double; exactly 3 diamonds
    const northHand = makeTestHand(3, 3, 3, 4, 8); // HCP=8, DP=0 => TP=8
    const bid = system.getBid(northHand);
    // Low TP: expect a simple competitive raise to 2D
    expect(bid && bid.token).toBe('2D');
    expect((bid.conventionUsed || '').toLowerCase()).toContain('competitive raise');
  });

  test('With exactly 3-card diamond support and ~11 total points -> 3D competitive raise', () => {
    setup1D_over_2C();
    // Same 4-3-3-3 shape with exactly 3 diamonds and no 4-card major; HCP drives TP
    const northHand = makeTestHand(3, 3, 3, 4, 11); // HCP=11, DP=0 => TP=11
    const bid = system.getBid(northHand);
    expect(bid && bid.token).toBe('3D');
    expect((bid.conventionUsed || '').toLowerCase()).toContain('competitive raise');
  });
});
