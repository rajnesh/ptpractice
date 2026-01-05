const { SAYCBiddingSystem } = require('../assets/js/combined-bidding-system');
const { makeTestHand } = require('./test-helpers');

/**
 * Enforce SAYC 5-card majors on opening: with 12 HCP and 5♦/4♥, opener should not bid 1H.
 * Correct opening is 1D in first/second seat when no 5-card major exists.
 */
describe('SAYC opening with 5♦ and 4♥, 12 HCP', () => {
  test('Opens 1D (not 1H) when first to act', () => {
    const system = new SAYCBiddingSystem();
    system.startAuction('S'); // South deals; no prior passes

    // Shape: S=3, H=4, D=5, C=1; HCP=12; no 5-card major
    const southHand = makeTestHand(3, 4, 5, 1, 12);

    const bid = system.getBid(southHand);
    expect(bid).toBeTruthy();
    expect(bid.token).toBe('1D');
  });
});
