const { makeHandFromPattern } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../assets/js/combined-bidding-system');
const { Bid, Auction } = require('../assets/js/bridge-types');

/**
 * Regression: After S PASS; W 1S; N 2H; E ?, East must not bid 2C (illegal under 2H),
 * and explanation for a hypothetical 2C must not claim "Opener's rebid".
 */
describe('East after 1S opening and 2H overcall should not bid 2C; no opener-rebid explanation', () => {
  let system;

  beforeEach(() => {
    system = new SAYCBiddingSystem();
    system.startAuction('E');
    system.currentAuction = new Auction([], { dealer: 'S', ourSeat: 'E' });
  });

  test('East action over 1S -(2H) is not 2C; 2C explanation not opener-rebid', () => {
    // Build the auction: S PASS; W 1S; N 2H
    system.currentAuction.add(new Bid('PASS', { seat: 'S' }));
    system.currentAuction.add(new Bid('1S', { seat: 'W' }));
    system.currentAuction.add(new Bid('2H', { seat: 'N' }));

    // East hand with club inclination (previously tempted engine to try 2C); exact HCP not critical
    const eastHand = makeHandFromPattern('QJ2', '32', 'KQ2', 'QJ432');

    const bid = system.getBid(eastHand);
    expect(bid).toBeTruthy();
    expect(bid.token || (bid.isDouble ? 'X' : bid.isRedouble ? 'XX' : 'PASS')).not.toBe('2C');

    // 2C should be illegal over 2H under standard ordering
    expect(system.isLegal(new Bid('2C'))).toBe(false);

    // And the explanation for a hypothetical 2C here should NOT be labeled as opener's rebid
    const expl = system.getExplanationFor(new Bid('2C'), system.currentAuction);
    expect(typeof expl).toBe('string');
    expect(expl).not.toMatch(/Opener's rebid/i);
  });
});
