const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Auction, Bid, Hand } = require('../js/bridge-types');

function makeHandFromStrings(s, h, d, c) {
  return new Hand({
    'S': Array.from(s).map(r => ({ rank: r, suit: 'S' })),
    'H': Array.from(h).map(r => ({ rank: r, suit: 'H' })),
    'D': Array.from(d).map(r => ({ rank: r, suit: 'D' })),
    'C': Array.from(c).map(r => ({ rank: r, suit: 'C' })),
  });
}

describe('Responder over 1C should not pass with 12 HCP', () => {
  test("PASS – 1C – PASS; ourSeat=E; 12 HCP with 4 spades => 1S (not PASS)", () => {
    const sys = new SAYCBiddingSystem();

    // Build auction: South dealer; sequence PASS (S), 1C (W), PASS (N)
    const auction = new Auction([], { dealer: 'S', ourSeat: 'E' });
    auction.add(new Bid('PASS')); // S
    auction.add(new Bid('1C'));   // W
    auction.add(new Bid('PASS')); // N

    sys.currentAuction = auction;
    sys.ourSeat = 'E';

    // Sanity: lastSide should see partner's 1C as 'we'
    expect(auction.lastSide()).toBe('we');

    // Hand: 12 HCP, 4 spades, balanced-ish, no 4 hearts; should respond 1S
    const hand = makeHandFromStrings('AQ74', 'Q32', 'K32', 'J2'); // HCP 12, S=4

    const bid = sys.getBid(hand);
    expect(bid).toBeTruthy();
    expect(bid.token).toBe('1S');
    // Extra guard: definitely not PASS
    expect(bid.token).not.toBe('PASS');
  });
});
