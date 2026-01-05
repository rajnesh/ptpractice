/**
 * Parametric tests for second-round (advancer) raises after partner's 1H overcall.
 * Focus: With ~6–10 HCP and 3+ hearts, West should raise to 2H over 1H.
 */

const { makeTestHand } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../assets/js/combined-bidding-system');
const { Bid, Auction } = require('../assets/js/bridge-types');

// Generate 10 representative HCP values (ranges proxy)
const HCP_VALUES = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18];

// Generate 20 suit length shapes for (S,H,D,C) summing to 13
function generateShapes() {
  const shapes = [];
  const heartLens = [0,1,2,3,3,3,4,4,5,5,2,1,6,0,7,3,4,2,5,6];
  heartLens.forEach((h, idx) => {
    const remain = 13 - h;
    // Distribute remaining roughly as 4-4- (rest)
    let s = Math.min(4, remain);
    let d = Math.min(4, remain - s);
    let c = remain - s - d;
    // Rotate distribution a bit to diversify
    if (idx % 3 === 1) [s, d, c] = [d, c, s];
    if (idx % 3 === 2) [s, d, c] = [c, s, d];
    shapes.push([s, h, d, c]);
  });
  return shapes;
}

const SHAPES = generateShapes();

describe('Second round: Advancer raises after partner\'s 1H overcall (parametric)', () => {
  let system;

  beforeEach(() => {
    system = new SAYCBiddingSystem();
  });

  HCP_VALUES.forEach((hcp) => {
    SHAPES.forEach((shape, idx) => {
      const [s, h, d, c] = shape;
      const testName = `HCP=${hcp}, shape S${s}-H${h}-D${d}-C${c} (#${idx+1})`;
      test(testName, () => {
        // Our seat: West (advancer). Context: 1D (N) – 1H (E) – PASS (S) – (? W)
        system.startAuction('W');
        system.currentAuction = new Auction([], { dealer: 'S', ourSeat: 'W' });
        system.currentAuction.add(new Bid('PASS'));  // South
        system.currentAuction.add(new Bid('PASS'));  // West (pre-opening pass; not critical)
        system.currentAuction.add(new Bid('1D'));    // North opens
        system.currentAuction.add(new Bid('1H'));    // East overcalls hearts
        system.currentAuction.add(new Bid('PASS'));  // South

        const hand = makeTestHand(s, h, d, c, hcp);
        const bid = system.getBid(hand);

        // Expectations:
        // - With 3+ hearts and 6..10 HCP, prefer a simple raise to 2H.
        // - Otherwise, do not enforce a strict action; PASS or other bids may occur.
        if (h >= 3 && hcp >= 6 && hcp <= 10) {
          expect(bid && bid.token).toBe('2H');
        } else {
          // Loose guard: just ensure the bid is well-formed
          expect(bid).not.toBeNull();
          expect(typeof (bid.token || 'PASS')).toBe('string');
        }
      });
    });
  });
});
