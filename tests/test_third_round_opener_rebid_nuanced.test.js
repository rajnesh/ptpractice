/**
 * Nuanced tests for third-round opener actions in competition.
 * Patterns:
 * - 1D – (1H) – PASS – PASS – (? opener)
 *   - With heart stopper and 15–17 HCP: 1NT
 *   - With heart stopper and 18–19 HCP: 2NT
 *   - Without stopper but 15+ HCP: do not pass (X or 2D acceptable)
 * - 1C – (1S) – PASS – PASS – (? opener) mirrors the same expectations.
 */

const { makeHandFromRanks } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../assets/js/combined-bidding-system');
const { Bid, Auction } = require('../assets/js/bridge-types');

function setupAuction(opening, overcall) {
  const system = new SAYCBiddingSystem();
  system.startAuction('N');
  system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'N' });
  system.currentAuction.add(new Bid(opening)); // North opens
  system.currentAuction.add(new Bid(overcall)); // East overcalls
  system.currentAuction.add(new Bid('PASS')); // South
  system.currentAuction.add(new Bid('PASS')); // West
  return system;
}

describe('Third round: Opener continues with stopper vs. overcall (nuanced)', () => {
  test('1D–(1H) with 16 HCP and heart stopper -> 1NT', () => {
    const system = setupAuction('1D', '1H');
    // Build a 16 HCP balanced hand with a heart stopper (A♥), decent diamonds
    const hand = makeHandFromRanks({
      H: ['A', '2'],
      D: ['A', 'K', '2', '2'],
      S: ['Q', '2'],
      C: ['Q', '2', '2', '2', '2']
    });
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('1NT');
  });

  test('1D–(1H) with 19 HCP and heart stopper -> 2NT', () => {
    const system = setupAuction('1D', '1H');
    // 19 HCP, stopper in hearts
    const hand = makeHandFromRanks({
      H: ['K', '2'],
      D: ['A', 'K', 'Q', '2'],
      S: ['A', '2'],
      C: ['Q', '2', '2', '2']
    });
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2NT');
  });

  test('1D–(1H) with 16 HCP and no heart stopper -> not PASS (double or 2D ok)', () => {
    const system = setupAuction('1D', '1H');
    // 16 HCP, no H stopper, short hearts, support elsewhere for double shape
    const hand = makeHandFromRanks({
      H: ['2', '2'],
      D: ['A', 'K', 'J', '2', '2'],
      S: ['Q', '2', '2'],
      C: ['Q', '2', '2']
    });
    const bid = system.getBid(hand);
    expect(bid && (bid.token || bid.isDouble)).toBeTruthy();
    expect((bid && bid.token) || (bid && bid.isDouble && 'X')).not.toBe('PASS');
  });

  test('1C–(1S) with 16 HCP and spade stopper -> 1NT', () => {
    const system = setupAuction('1C', '1S');
    const hand = makeHandFromRanks({
      S: ['A', '2'],
      C: ['A', 'K', '2', '2'],
      D: ['Q', '2', '2'],
      H: ['Q', '2', '2', '2']
    });
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('1NT');
  });

  test('1C–(1S) with 19 HCP and spade stopper -> 2NT', () => {
    const system = setupAuction('1C', '1S');
    const hand = makeHandFromRanks({
      S: ['K', '2'],
      C: ['A', 'K', 'Q', '2'],
      D: ['A', '2'],
      H: ['Q', '2']
    });
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2NT');
  });
});
