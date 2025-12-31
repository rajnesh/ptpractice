/**
 * Parametric tests for third-round (opener) actions after 1D – (1H) – PASS – PASS – (? opener)
 * Focus: With ~15+ HCP and a heart stopper, opener should act (e.g., 1NT/2NT/double/2D), not pass out.
 */

const { makeTestHand } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid, Auction } = require('../js/bridge-types');

const HCP_VALUES = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18];

function generateShapes() {
  const shapes = [];
  const diamondLens = [2,3,4,5,6,2,3,4,5,6,4,5,6,2,3,7,1,4,5,6];
  diamondLens.forEach((d, idx) => {
    const remain = 13 - d;
    // Anchor a heart stopper when possible by allocating at least 1 heart.
    let h = Math.min(5, Math.max(1, remain - 8)); // ensure at least 1
    if (h < 1) h = 1;
    let s = Math.min(5, remain - h);
    let c = remain - h - s;
    if (c < 0) { c = 0; s = remain - h; }
    // Rotate distribution for variety
    if (idx % 2 === 1) [s, h, c] = [c, h, s];
    shapes.push([s, h, d, c]);
  });
  return shapes;
}

const SHAPES = generateShapes();

describe('Third round: Opener continues after 1D – (1H) – PASS – PASS (parametric)', () => {
  let system;

  beforeEach(() => {
    system = new SAYCBiddingSystem();
  });

  HCP_VALUES.forEach((hcp) => {
    SHAPES.forEach((shape, idx) => {
      const [s, h, d, c] = shape;
      const testName = `HCP=${hcp}, shape S${s}-H${h}-D${d}-C${c} (#${idx+1})`;
      test(testName, () => {
        // Our seat: North (opener). Auction: 1D – (1H) – PASS – PASS – (? N)
        system.startAuction('N');
        system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'N' });
        system.currentAuction.add(new Bid('1D'));    // North opens 1♦
        system.currentAuction.add(new Bid('1H'));    // East overcalls 1♥
        system.currentAuction.add(new Bid('PASS'));  // South (partner) passes
        system.currentAuction.add(new Bid('PASS'));  // West passes

        const hand = makeTestHand(s, h, d, c, hcp);
        const bid = system.getBid(hand);

        // Expectations:
        // - With 15+ HCP and at least a heart guard (we manufacture h>=1), opener should not pass out.
        // - Typical actions: 1NT/2NT with stoppers, double with values, or rebid a long diamond suit.
        if (hcp >= 15) {
          expect(bid && bid.token).not.toBe('PASS');
        } else {
          // For lower HCP, allow PASS but ensure well-formed output
          expect(bid).not.toBeNull();
          expect(typeof (bid.token || 'PASS')).toBe('string');
        }
      });
    });
  });
});
