const { makeHandFromPattern } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../assets/js/combined-bidding-system');
const { Bid, Auction } = require('../assets/js/bridge-types');

/**
 * Seat-aware competitive bidding across positions (E/S/W).
 */

describe('Seat-aware competitive actions across seats', () => {
  let system;

  beforeEach(() => {
    system = new SAYCBiddingSystem();
  });

  test('East over North 1S with 5-5 minors -> 2NT (Unusual NT)', () => {
    system.startAuction('E');
    system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'E' });
    system.conventions.config.notrump_defenses = system.conventions.config.notrump_defenses || {};
    system.conventions.config.notrump_defenses.unusual_nt = { enabled: true, direct: true };

    system.currentAuction.add(new Bid('1S', { seat: 'N' }));

    const hand = makeHandFromPattern('32', '32', 'KQJ32', 'KQJ32');
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2NT');
    expect(bid.conventionUsed).toContain('Unusual NT');
  });

  test('South over West 1C with 5-5 majors -> 2C (Michaels)', () => {
    system.startAuction('S');
    system.currentAuction = new Auction([], { dealer: 'W', ourSeat: 'S' });
    system.conventions.config.competitive = system.conventions.config.competitive || {};
    system.conventions.config.competitive.michaels = { enabled: true, strength: 'wide_range' };

    system.currentAuction.add(new Bid('1C', { seat: 'W' }));

    const hand = makeHandFromPattern('KQJ32', 'KQJ32', '32', '32');
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2C');
    expect(bid.conventionUsed).toContain('Michaels');
  });

  test('West over South 1H with 5 spades + 5 clubs -> 2H (Michaels)', () => {
    system.startAuction('W');
    system.currentAuction = new Auction([], { dealer: 'S', ourSeat: 'W' });
    system.conventions.config.competitive = system.conventions.config.competitive || {};
    system.conventions.config.competitive.michaels = { enabled: true };

    system.currentAuction.add(new Bid('1H', { seat: 'S' }));

    const hand = makeHandFromPattern('KQJ32', '32', '32', 'KQJ32');
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2H');
    expect(bid.conventionUsed).toContain('Michaels');
  });
});
