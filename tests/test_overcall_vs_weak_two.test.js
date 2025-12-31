const { makeTestHand, buildAuction } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../js/combined-bidding-system');

describe('Overcall vs Weak Two', () => {
  let system;

  beforeEach(() => {
    system = new SAYCBiddingSystem();
  });

  test('East with 14 HCP and 5-card spades should overcall 2S over 2H opener', () => {
    // Dealer South; auction: S PASS, W PASS, N 2H -> E to act
    system.startAuction('E', false, false);
    system.currentAuction = buildAuction('S', 'E', ['PASS','PASS','2H']);

    // East hand: 5 spades, reasonable HCP ~14
    const eastHand = makeTestHand(5,3,3,2,14);

    const bid = system.getBid(eastHand);
    expect(bid && bid.token).toBe('2S');
  });
});
