const { makeHandFromPattern } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid, Auction } = require('../js/bridge-types');

/**
 * Focused tests ensuring Michaels is chosen for immediate opponent overcalls
 * but that a seat-aware responder to partner prefers a natural 2-level new suit.
 */

describe('Michaels seat-awareness guard', () => {
  test('Seat-aware responder (opener is partner) prefers natural 2-level new suit instead of Michaels', () => {
    const system = new SAYCBiddingSystem();
    system.startAuction('E');
    // Opener is North and ourSeat is East => we are responder to partner
  // Make the auction seat-aware and ensure the opener (North) is our PARTNER
  system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'S' });
  // Provide explicit seat on the opener so system can detect partner/opponent
  system.currentAuction.add(new Bid('1S', { seat: 'N' }));

    // Responder hand: void spades, 5 hearts, 5 diamonds, small clubs; ~9 HCP
    const hand = makeHandFromPattern('', 'KQ432', 'QJ432', '22');
    // Normalize HCP to match the intended test shape (not strictly required for shape checks)
    hand.hcp = 9;

    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2H'); // natural new-suit at 2-level
  });

  test('Seatless immediate overcall chooses Michaels when shape matches (5-5 majors over 1C)', () => {
    const system = new SAYCBiddingSystem();
    system.startAuction('N');
    // Seatless auction (no per-bid seat info) with only an opening present
    system.currentAuction = new Auction([], { dealer: 'S', ourSeat: 'N' });
    system.currentAuction.add(new Bid('1C')); // no seat provided

    // Hand with 5-5 majors
    const hand = makeHandFromPattern('KQJ32', 'KQJ32', '32', '32');
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2C'); // Michaels cue-bid over minor
  });
});
