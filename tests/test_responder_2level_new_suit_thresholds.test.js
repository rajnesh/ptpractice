const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid, Hand } = require('../js/bridge-types');

// Helper: set up a simple auction with dealer/ourSeat for seat-aware logic
function setupAuction(system, sequence, dealer = 'S', ourSeat = 'N') {
  system.startAuction(ourSeat);
  system.currentAuction.reseat(dealer);
  for (const tok of sequence) {
    system.currentAuction.add(new Bid(tok));
  }
}

describe('Responder 2-level new-suit thresholds (no interference)', () => {
  test('Over 1S, responder 9 HCP, 5-5 in hearts/diamonds, void spades should not pass (bids 2H)', () => {
    const system = new SAYCBiddingSystem();
    // Auction: S:1S, W:PASS, N: ? (ourSeat=N)
    setupAuction(system, ['1S', 'PASS'], 'S', 'N');

    // Hand: void spades, 5 hearts (KQxxx), 5 diamonds (xxxxx), 3 clubs (Axx) -> 9 HCP, DP=3 (void spades) => total 12
    const hand = new Hand('- KQxxx xxxxx Axx');

    const bid = system.getBid(hand);
    expect(bid).not.toBeNull();
    expect(bid.token).toBe('2H');
  });

  test('Explanation maps 2-level new suit as natural constructive values', () => {
    const system = new SAYCBiddingSystem();
    setupAuction(system, ['1S', 'PASS'], 'S', 'N');
    const hand = new Hand('- KQxxx xxxxx Axx');
    const bid = system.getBid(hand);
    const expl = system.getExplanationFor(bid, system.currentAuction);
    expect(expl).toMatch(/New suit at 2-level: natural/);
  });
});
