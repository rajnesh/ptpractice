const { makeHandFromPattern } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../assets/js/combined-bidding-system');
const { Bid, Auction } = require('../assets/js/bridge-types');

/**
 * Natural 2NT overcall over a minor opening: 19–21 balanced with stopper.
 */

describe('Natural 2NT overcall over minor openings', () => {
  let system;

  beforeEach(() => {
    system = new SAYCBiddingSystem();
    system.startAuction('N');
  });

  test('Balanced 20 HCP with club stopper over 1C -> 2NT overcall', () => {
  system.currentAuction = new Auction([], { dealer: 'E', ourSeat: 'N' });
  system.currentAuction.add(new Bid('1C'));

    // 20 HCP balanced with a club stopper (QJx counts as stopper)
    const hand = makeHandFromPattern('AK2', 'KQ2', 'KQ2', 'QJ2');
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2NT');
  });

  test('Balanced 19 HCP with diamond stopper over 1D -> 2NT overcall', () => {
  system.currentAuction = new Auction([], { dealer: 'E', ourSeat: 'N' });
  system.currentAuction.add(new Bid('1D'));

    const hand = makeHandFromPattern('AK2', 'KQ2', 'QJ2', 'KQ2'); // 19 HCP, D stopper QJ2
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2NT');
  });
});
