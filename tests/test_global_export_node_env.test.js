/**
 * @jest-environment node
 */

// This test forces a pure Node environment (no window), covering the global export branch

test('combined-bidding-system global export branch sets globals in Node env', () => {
  // eslint-disable-next-line global-require
  const mod = require('../js/combined-bidding-system');
  // Ensure global assignments occurred
  expect(global.BiddingSystem).toBeDefined();
  expect(global.SAYCBiddingSystem).toBeDefined();
  expect(global.SUITS).toBeDefined();

  // And CommonJS export is also available
  expect(mod.SAYCBiddingSystem).toBeDefined();
});
