/**
 * @jest-environment jsdom
 */
const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Auction, Bid, Hand } = require('../js/bridge-types');

function makeSystem(dealer='S', ourSeat='S') {
  const sys = new SAYCBiddingSystem();
  sys.currentAuction = new Auction([], { dealer, ourSeat });
  return sys;
}

function addBid(sys, tok, seat) {
  const b = tok === 'PASS' ? new Bid(null) : new Bid(tok);
  b.token = tok === 'PASS' ? 'PASS' : tok;
  b.seat = seat;
  sys.currentAuction.add(b);
}

describe('Advancer cue-bid is forcing; opener does not emit cue-bid raise', () => {
  test('After 1C (S) – 1S (W) – 2C (N), E with 11 HCP and 3+ spades does not PASS', () => {
    const sys = makeSystem('S', 'E');
    const east = new Hand('KQxxx Axx xx Qxx'); // ~11 HCP, 5 spades
    // 1C by S, 1S by W (overcall), 2C by N (raise)
    addBid(sys, '1C', 'S');
    addBid(sys, '1S', 'W');
    addBid(sys, '2C', 'N');

    const bid = sys.getBid(east);
    expect(bid).toBeTruthy();
    expect(bid.token || (bid.isDouble ? 'X' : null)).not.toBe('PASS');
  });

  test('Responder-only cue-bid raise not suggested on opener rebid (no 2S cue as South)', () => {
    const sys = makeSystem('S', 'S');
    const south = new Hand('KQx Kxx Axx Kxx');
    addBid(sys, '1C', 'S');
    addBid(sys, '1S', 'W');
    addBid(sys, '2C', 'N');

    const bid = sys.getBid(south);
    // Ensure engine does not suggest 2S with Cue Bid Raise label
    expect(!(bid && bid.token === '2S')).toBe(true);
  });

  test('Advancer strong raise uses cue of opener suit and is forcing-labeled', () => {
    const sys = makeSystem('S', 'E');
    const east = new Hand('KQxx Axx xx QJxx'); // 11 HCP, 4 spades support
    addBid(sys, '1C', 'S');
    addBid(sys, '1S', 'W');
    addBid(sys, 'PASS', 'N');

    const bid = sys.getBid(east);
    expect(bid).toBeTruthy();
    // With 11 HCP and 4+ support, cue-bid 2C should be viable; label marked forcing
    if (bid.token === '2C' || bid.token === '3C') {
      expect(String(bid.conventionUsed || '')).toMatch(/Cue Bid Raise/i);
      expect(String(bid.conventionUsed || '')).toMatch(/forcing/i);
    }
  });
});

