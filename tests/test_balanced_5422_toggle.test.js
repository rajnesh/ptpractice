const { makeHandFromPattern } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../assets/js/combined-bidding-system');

/**
 * Balanced-shape toggle tests for including 5-4-2-2 as balanced.
 */

describe('Balanced 5-4-2-2 toggle', () => {
  let system;

  beforeEach(() => {
    system = new SAYCBiddingSystem();
    system.startAuction('N');
  });

  test('include_5422=false: 16 HCP 5-4-2-2 does NOT open 1NT', () => {
    // Default include_5422 is false
    system.conventions.config.general = system.conventions.config.general || {};
    system.conventions.config.general.balanced_shapes = { include_5422: false };

  // 16 HCP, 5S-4H-2D-2C shape
  const hand = makeHandFromPattern('AKQ52', 'AK32', '32', '32');
    const bid = system.getBid(hand);
    expect(bid && bid.token).not.toBe('1NT');
  });

  test('include_5422=true: 16 HCP 5-4-2-2 opens 1NT', () => {
    system.conventions.config.general = system.conventions.config.general || {};
    system.conventions.config.general.balanced_shapes = { include_5422: true };

    const hand = makeHandFromPattern('AKQ52', 'AK32', '32', '32');
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('1NT');
  });
});
