const { makeHandFromPattern } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../assets/js/combined-bidding-system');
const { Bid } = require('../assets/js/bridge-types');

describe('Auction regression coverage for Rule-of-20 and Drury handling', () => {
  let system;

  beforeEach(() => {
    system = new SAYCBiddingSystem();
    system.conventions.config.general = system.conventions.config.general || {};
    system.conventions.config.responses = system.conventions.config.responses || {};
    system.conventions.config.general.passed_hand_variations = true;
    system.conventions.config.responses.drury = { enabled: true };
  });

  test('Rule-of-19 hand in first seat passes', () => {
    system.startAuction('W');
    const hand = makeHandFromPattern('KQ72', 'QJ972', '82', 'Q2'); // 10 HCP, 5-4 shape -> Rule-of-19 only
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('PASS');
  });

  test('Responder prefers natural 2D over takeout double with 12 HCP and 5 diamonds', () => {
    system.startAuction('W');
    system.currentAuction.ourSeat = 'N';
    system.currentAuction.add(new Bid('1H', { seat: 'W' }));

    const hand = makeHandFromPattern('KQ93', '82', 'AJT75', 'Q3'); // 12 HCP, 5-card diamonds, short hearts
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2D');
  });

  test('Drury not triggered when opener acts in first seat', () => {
    system.startAuction('N');
    system.currentAuction.ourSeat = 'S';
    system.currentAuction.add(new Bid('1S', { seat: 'N' }));
    system.currentAuction.add(new Bid(null, { seat: 'E' }));

    const hand = makeHandFromPattern('KQ2', 'QJ2', 'QJ32', 'J32');
    const bid = system.getBid(hand);
    expect(bid && bid.token).not.toBe('2C');
  });

  test('Opener continues after partner uses Drury 2C', () => {
    system.startAuction('N');
    system.currentAuction.ourSeat = 'S';
    system.currentAuction.add(new Bid(null, { seat: 'N' }));
    system.currentAuction.add(new Bid(null, { seat: 'E' }));
    system.currentAuction.add(new Bid('1H', { seat: 'S' }));
    system.currentAuction.add(new Bid(null, { seat: 'W' }));
    system.currentAuction.add(new Bid('2C', { seat: 'N' }));
    system.currentAuction.add(new Bid(null, { seat: 'E' }));

    const hand = makeHandFromPattern('KQ72', 'QJ972', '82', 'Q2'); // sub-minimum opening values
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2D');
    expect(bid.conventionUsed).toMatch(/Drury/i);
  });
});
