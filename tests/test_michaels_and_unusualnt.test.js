const { makeHandFromPattern } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../assets/js/combined-bidding-system');
const { Bid, Auction } = require('../assets/js/bridge-types');

/**
 * Michaels cuebids and Unusual Notrump coverage.
 */

describe('Michaels and Unusual NT', () => {
  let system;

  beforeEach(() => {
    system = new SAYCBiddingSystem();
    system.startAuction('N');
    // Ensure conventions enabled
    system.conventions.config.competitive = system.conventions.config.competitive || {};
    system.conventions.config.competitive.michaels = { enabled: true };
    system.conventions.config.notrump_defenses = system.conventions.config.notrump_defenses || {};
    system.conventions.config.notrump_defenses.unusual_nt = { enabled: true, direct: true, passed_hand: false };
  });

  test('Michaels over minor: 5-5 majors over 1C -> 2C', () => {
  system.currentAuction = new Auction([], { dealer: 'S', ourSeat: 'N' });
  system.currentAuction.add(new Bid('1C'));

    const hand = makeHandFromPattern('KQJ32', 'KQJ32', '32', '32'); // 5-5 majors
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2C');
  });

  test('Michaels over major: spades+clubs over 1H -> 2H', () => {
  system.currentAuction = new Auction([], { dealer: 'S', ourSeat: 'N' });
  system.currentAuction.add(new Bid('1H'));

    const hand = makeHandFromPattern('KQJ32', '32', '32', 'KQJ32'); // 5 spades + 5 clubs
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2H');
  });

  test('Unusual NT over major: 5-5 minors over 1S -> 2NT', () => {
  system.currentAuction = new Auction([], { dealer: 'S', ourSeat: 'N' });
  system.currentAuction.add(new Bid('1S'));

    const hand = makeHandFromPattern('32', '32', 'KQJ32', 'KQJ32'); // 5-5 minors
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2NT');
  });

  test('Seat-aware: as East, over 1S by North -> 2NT still applies', () => {
    system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'E' });
    system.currentAuction.add(new Bid('1S', { seat: 'N' }));

    const hand = makeHandFromPattern('32', '32', 'KQJ32', 'KQJ32');
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2NT');
  });
});
