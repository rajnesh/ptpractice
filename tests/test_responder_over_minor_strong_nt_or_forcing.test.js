const { SAYCBiddingSystem } = require('../assets/js/combined-bidding-system.js');

function makeHand(spec, hcp) {
  // spec: "S H D C" using letters; length is characters count; hcp explicit
  const parts = spec.trim().split(/\s+/);
  const getLen = s => (s && s !== '-' ? s.length : 0);
  const hand = {
    lengths: { S: getLen(parts[0]), H: getLen(parts[1]), D: getLen(parts[2]), C: getLen(parts[3]) },
    hcp: hcp,
    distributionPoints: 0
  };
  // Bridge-types Hand replacement API subset the system uses
  return hand;
}

function startAuctionWith(system, dealer, ourSeat) {
  system.startAuction(ourSeat);
  if (system.currentAuction && typeof system.currentAuction.reseat === 'function') {
    system.currentAuction.reseat(dealer);
  } else {
    system.currentAuction.dealer = dealer;
  }
}

function add(system, token) {
  const bid = new global.window.Bid(token);
  system.currentAuction.add(bid);
}

describe('Responder over minor openings with strong values chooses forcing/NT, not a simple raise', () => {
  test('1D – Pass – (North, 17 HCP balanced, 4 diamonds, no 4-card major) → 3NT (not 2D)', () => {
    const system = new SAYCBiddingSystem();
    startAuctionWith(system, 'S', 'N');
    add(system, '1D'); // South opens 1D (dealer S)
    add(system, 'PASS'); // West passes

    // North: 4-3-3-3 with 4 diamonds, 17 HCP, no 4-card major
    const north = makeHand('KQJ QJx Qxx Qxx', 17);
    const bid = system.getBid(north);
    expect(bid).toBeTruthy();
    expect(bid.token).toBe('3NT');
  });

  test('1C – Pass – (North, 17 HCP balanced, 4 diamonds) prefers 3NT over 2D/2C raise', () => {
    const system = new SAYCBiddingSystem();
    startAuctionWith(system, 'S', 'N');
    add(system, '1C');
    add(system, 'PASS');
    const north = makeHand('KQJ QJx Qxxx Qxx', 17); // 4 diamonds, balanced, no 4-card major
    const bid = system.getBid(north);
    expect(bid).toBeTruthy();
    expect(bid.token).toBe('3NT');
  });
});
