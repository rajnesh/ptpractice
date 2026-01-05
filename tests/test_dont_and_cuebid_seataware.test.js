const { makeHandFromPattern } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../assets/js/combined-bidding-system');
const { Bid, Auction } = require('../assets/js/bridge-types');

/**
 * Seat-aware tests for DONT over 1NT and cue-bid raises after our opening.
 */

describe('DONT and Cue-bid raises across seats', () => {
  let system;

  beforeEach(() => {
    system = new SAYCBiddingSystem();
  });

  test('East over North 1NT with 6 hearts -> 2H (DONT)', () => {
    system.startAuction('E');
    system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'E' });

    system.currentAuction.add(new Bid('1NT', { seat: 'N' }));
    const hand = makeHandFromPattern('32', 'KQJ987', '32', '32'); // 6 hearts
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2H');
    expect(bid.conventionUsed || '').toContain('DONT');
  });

  test('South after 1H (N) – 1S (E): 4 hearts and 11 HCP -> Cue-bid raise to 2S', () => {
    system.startAuction('S');
    system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'S' });
    // Our partner (North) opens 1H, East overcalls 1S. We are South.
    system.currentAuction.add(new Bid('1H', { seat: 'N' }));
    system.currentAuction.add(new Bid('1S', { seat: 'E' }));

  const hand = makeHandFromPattern('32', 'AKQ2', 'Q32', '32'); // 11 HCP, 4 hearts support
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2S'); // Cue-bid at one level above their suit
  });
});
