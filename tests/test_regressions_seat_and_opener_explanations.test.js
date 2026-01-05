const { makeHandFromPattern } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../assets/js/combined-bidding-system');
const { Bid, Auction } = require('../assets/js/bridge-types');

describe('Regression: seat-awareness and opener-rebid explanations', () => {
  test('Explicit-seat opener -> responder prefers natural 2-level new suit (no Michaels)', () => {
    const system = new SAYCBiddingSystem();
    // Create an auction where opener seat is explicit (partner/opponent detection possible)
    const auction = new Auction([], { dealer: 'N', ourSeat: 'E' });
    // Provide explicit seat on the opener so the system treats it as an explicitly-seated opener
    auction.add(new Bid('1S', { seat: 'N' }));
    system.currentAuction = auction;

    // Responder hand: void spades, 5 hearts, 5 diamonds (approx 9 HCP)
    const hand = makeHandFromPattern('-', 'KQ432', 'QJ432', '22');
    hand.hcp = 9;

    const bid = system.getBid(hand);
    expect(bid).not.toBeNull();
    // Expect a natural new-suit at 2-level rather than a conventional Michaels cue-bid
    expect(bid.token).toBe('2H');
    expect((bid.conventionUsed || '').toLowerCase()).not.toContain('michaels');
    const expl = system.getExplanationFor(bid, system.currentAuction);
    expect(typeof expl).toBe('string');
    expect(expl.toLowerCase()).toMatch(/new suit at 2-level|new suit/);
  });

  test("Opener's rebid in competition is described as an opener's rebid", () => {
    const system = new SAYCBiddingSystem();
    const auction = new Auction([
      new Bid('1H'),
      new Bid('2C'),
      new Bid('PASS'),
      new Bid('2H')
    ], { dealer: 'N', ourSeat: 'S' });

    const expl = system.getExplanationFor(new Bid('2H'), auction);
    expect(typeof expl).toBe('string');
    expect(expl).toMatch(/Opener's rebid|opener's rebid|Opener.*rebid/i);
  });
});
