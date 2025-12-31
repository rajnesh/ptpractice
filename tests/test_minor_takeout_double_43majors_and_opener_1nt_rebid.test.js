const { makeHandFromPattern, buildAuction } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid, Auction } = require('../js/bridge-types');

/**
 * Mirrors the observed UI sequence:
 * - Two passes; North opens 1C; East holds 13 HCP with majors 4-3 → should make a takeout double.
 * - Later, opener rebids notrumps: with ~14 HCP balanced over a 1-level response, should be 1NT (not 2NT 18–19).
 */

describe('Minor opening: East 4-3 majors takeout X; opener 12–14 rebids 1NT', () => {
  test('After PASS, PASS, 1C, East 13 HCP 4-3 majors -> Double', () => {
    const system = new SAYCBiddingSystem();
    // East is actor; South deals so seats align S,W,N,E
    const a = new Auction([], { dealer: 'S', ourSeat: 'E' });
    a.add(new Bid(null)); // S PASS
    a.add(new Bid(null)); // W PASS
    a.add(new Bid('1C')); // N 1C
    system.currentAuction = a;

    // East hand: 4-3-3-3 with 13 HCP; not long in clubs
    const hand = makeHandFromPattern(
      'AQJ2', // 4 spades (7 HCP)
      'KJ2',  // 3 hearts (4 HCP)
      'Q32',  // 3 diamonds (2 HCP)
      '432'   // 3 clubs (0 HCP)
    );

    const bid = system.getBid(hand);
    expect(!!bid && !!bid.isDouble).toBe(true);
    expect((bid.conventionUsed || '').toLowerCase()).toContain('takeout');
  });

  test('Opener rebid after 1C - 1D with ~14 HCP balanced -> 1NT, not 2NT', () => {
    const system = new SAYCBiddingSystem();
    // North is our seat (opener)
    const a = new Auction([], { dealer: 'S', ourSeat: 'N' });
    a.add(new Bid('1C')); // N opens
    a.add(new Bid(null)); // E PASS
    a.add(new Bid('1D')); // S responds 1D
    a.add(new Bid(null)); // W PASS
    system.currentAuction = a;

    // North opener ~14 HCP balanced
    const hand = makeHandFromPattern(
      'KQ2', // 5 HCP
      'QJ2', // 3 HCP
      'K32', // 3 HCP
      'Q32'  // 2 HCP → total 13 (close to 14, sufficient for 12–14 band)
    );

    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('1NT');
    expect((bid.conventionUsed || '').toLowerCase()).toContain('12–14');
  });
});
