const { makeHandFromPattern } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../assets/js/combined-bidding-system');
const { Bid, Auction } = require('../assets/js/bridge-types');

/**
 * Responder new suit at 1-level requires 6+ points; at 2-level requires 13+ HCP.
 */

describe('Responder new-suit levels over 1-level openings', () => {
  let system;

  beforeEach(() => {
    system = new SAYCBiddingSystem();
    system.startAuction('N');
  });

  test('10+ HCP over 1C with 4 hearts -> 1H response', () => {
  // Opener is North; we want the system to act as responder (South)
  system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'S' });
    system.currentAuction.add(new Bid('1C', { seat: 'N' }));
    const hand = makeHandFromPattern('Q32', 'KQJ2', 'Q2', '32'); // 11 HCP, 4H
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('1H');
  });

  test('6 HCP over 1C with 4 hearts -> 1H response', () => {
    // Seat-aware: West opens 1C, we are East (responder)
  system.currentAuction = new Auction([], { dealer: 'W', ourSeat: 'E' });
    system.currentAuction.add(new Bid('1C', { seat: 'W' }));
    const hand = makeHandFromPattern('Q32', 'KJ42', '762', '983'); // 6 HCP, 4H
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('1H');
  });

  test('13 HCP over 1H with 5 diamonds -> 2D response at 2-level', () => {
  // Opener is North (1H); set ourSeat to South so system is responder to the 1H opening
  system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'S' });
    system.currentAuction.add(new Bid('1H', { seat: 'N' }));
  // Ensure relaxed takeout double preference remains enabled (default) so behavior is consistent
  system.conventions.config.general.relaxed_takeout_doubles = true;
    const hand = makeHandFromPattern('Q2', 'Q2', 'AKQJ2', '32'); // 13 HCP, 5D
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2D');
  });

  test('10 HCP over 1S with 5 diamonds -> no 2D (too weak)', () => {
  system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'N' });
    system.currentAuction.add(new Bid('1S'));
    const hand = makeHandFromPattern('Q2', 'Q2', 'KQJ32', '32'); // 10 HCP, 5D
    const bid = system.getBid(hand);
    // Engine returns null (pass) or something other than 2D
    expect(!bid || bid.token !== '2D' || bid.isDouble).toBe(true);
  });
});
