const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid } = require('../js/bridge-types');

function setupAuction(system, sequence, dealer = 'S', ourSeat = 'S') {
  system.startAuction(ourSeat);
  system.currentAuction.reseat(dealer);
  for (const tok of sequence) {
    system.currentAuction.add(new Bid(tok));
  }
}

describe('Responder 1-level new suit explanation (no interference)', () => {
  test("After partner opens 1D and next hand passes, East's 1H is explained as a 1-level response, not an overcall", () => {
    const system = new SAYCBiddingSystem();
    // Auction so far: S:PASS, W:1D, N:PASS; Now E to bid
    setupAuction(system, ['PASS', '1D', 'PASS'], 'S', 'S');

    const bid = new Bid('1H');
    const exp = system.getExplanationFor(bid, system.currentAuction);

    expect(exp).toMatch(/1-level response in hearts|1-level response in \w+/i);
    expect(exp.toLowerCase()).not.toContain('overcall');
  });
});
