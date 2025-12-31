const { makeTestHand, buildAuction } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../js/combined-bidding-system');

describe('Fix 1NT responder labeling', () => {
  let system;

  beforeEach(() => {
    system = new SAYCBiddingSystem();
  });

  test('North responds 3NT to 1NT and is not labeled as Texas Transfer', () => {
    // Auction: South opened 1NT, West passed -> North to act
    system.startAuction('N', false, false);
    system.currentAuction = buildAuction('S', 'N', ['1NT','PASS']);

    // North hand: balanced, ~14 HCP so system likely bids 3NT
    const north = makeTestHand(3,3,4,3,14);

    const bid = system.getBid(north);

    expect(bid).toBeDefined();
    expect(bid.token).toBe('3NT');
    // Ensure conventionUsed is not incorrectly set to 'Texas Transfer'
    expect(bid.conventionUsed).not.toBe('Texas Transfer');
  });
});
