const { makeHandFromPattern } = require('./test-helpers');
const { makeTestHand } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../assets/js/combined-bidding-system');
const { Bid } = require('../assets/js/bridge-types');

/**
 * Seat-aware responder cases over minor openings.
 */

describe('Seat-aware responder over minor openings', () => {
  let system;

  beforeEach(() => {
    system = new SAYCBiddingSystem();
  });

  test('South PASS, West 1D, North PASS; East with 9 HCP and 5 spades -> 1S', () => {
    system.startAuction('E');
    system.currentAuction.reseat('S');
    system.currentAuction.add(new Bid(null));   // S PASS
    system.currentAuction.add(new Bid('1D'));   // W opens 1D
    system.currentAuction.add(new Bid(null));   // N PASS

    const eastHand = makeTestHand(5, 3, 3, 2, 9); // 9 HCP, 5 spades
    const bid = system.getBid(eastHand);
    expect(bid && bid.token).toBe('1S');
  });

  test('South PASS, West 1D, North PASS; East with 7 HCP and 4 spades -> 1S', () => {
    system.startAuction('E');
    system.currentAuction.reseat('S');
    system.currentAuction.add(new Bid(null));   // S PASS
    system.currentAuction.add(new Bid('1D'));   // W opens 1D
    system.currentAuction.add(new Bid(null));   // N PASS

    const eastHand = makeHandFromPattern('Q742', 'J32', 'Q32', 'Q2'); // ~7 HCP, 4 spades
    const bid = system.getBid(eastHand);
    expect(bid && bid.token).toBe('1S');
  });

  test('South PASS, West 1C, North PASS; East with 7 HCP and 4 hearts -> 1H', () => {
    system.startAuction('E');
    system.currentAuction.reseat('S');
    system.currentAuction.add(new Bid(null));   // S PASS
    system.currentAuction.add(new Bid('1C'));   // W opens 1C
    system.currentAuction.add(new Bid(null));   // N PASS

    const eastHand = makeHandFromPattern('Q32', 'QJ43', 'Q32', 'Q2'); // ~7 HCP, 4 hearts
    const bid = system.getBid(eastHand);
    expect(bid && bid.token).toBe('1H');
  });

  // 1D -> 1H at various HCP levels (4-card hearts)
  test('South PASS, West 1D, North PASS; East ~7 HCP and 4 hearts -> 1H', () => {
    system.startAuction('E');
    system.currentAuction.reseat('S');
    system.currentAuction.add(new Bid(null));   // S PASS
    system.currentAuction.add(new Bid('1D'));   // W opens 1D
    system.currentAuction.add(new Bid(null));   // N PASS

    const eastHand = makeTestHand(3, 4, 3, 3, 7);
    const bid = system.getBid(eastHand);
    expect(bid && bid.token).toBe('1H');
  });

  test('South PASS, West 1D, North PASS; East ~10 HCP and 4 hearts -> 1H', () => {
    system.startAuction('E');
    system.currentAuction.reseat('S');
    system.currentAuction.add(new Bid(null));   // S PASS
    system.currentAuction.add(new Bid('1D'));   // W opens 1D
    system.currentAuction.add(new Bid(null));   // N PASS

    const eastHand = makeTestHand(3, 4, 3, 3, 10);
    const bid = system.getBid(eastHand);
    expect(bid && bid.token).toBe('1H');
  });

  test('South PASS, West 1D, North PASS; East ~12 HCP and 4 hearts -> 1H', () => {
    system.startAuction('E');
    system.currentAuction.reseat('S');
    system.currentAuction.add(new Bid(null));   // S PASS
    system.currentAuction.add(new Bid('1D'));   // W opens 1D
    system.currentAuction.add(new Bid(null));   // N PASS

    const eastHand = makeTestHand(3, 4, 3, 3, 12);
    const bid = system.getBid(eastHand);
    expect(bid && bid.token).toBe('1H');
  });

  // 1C -> 1S at various HCP levels (4-card spades)
  test('South PASS, West 1C, North PASS; East ~7 HCP and 4 spades -> 1S', () => {
    system.startAuction('E');
    system.currentAuction.reseat('S');
    system.currentAuction.add(new Bid(null));   // S PASS
    system.currentAuction.add(new Bid('1C'));   // W opens 1C
    system.currentAuction.add(new Bid(null));   // N PASS

    const eastHand = makeTestHand(4, 3, 3, 3, 7);
    const bid = system.getBid(eastHand);
    expect(bid && bid.token).toBe('1S');
  });

  test('South PASS, West 1C, North PASS; East ~10 HCP and 4 spades -> 1S', () => {
    system.startAuction('E');
    system.currentAuction.reseat('S');
    system.currentAuction.add(new Bid(null));   // S PASS
    system.currentAuction.add(new Bid('1C'));   // W opens 1C
    system.currentAuction.add(new Bid(null));   // N PASS

    const eastHand = makeTestHand(4, 3, 3, 3, 10);
    const bid = system.getBid(eastHand);
    expect(bid && bid.token).toBe('1S');
  });

  test('South PASS, West 1C, North PASS; East ~12 HCP and 4 spades -> 1S', () => {
    system.startAuction('E');
    system.currentAuction.reseat('S');
    system.currentAuction.add(new Bid(null));   // S PASS
    system.currentAuction.add(new Bid('1C'));   // W opens 1C
    system.currentAuction.add(new Bid(null));   // N PASS

    const eastHand = makeTestHand(4, 3, 3, 3, 12);
    const bid = system.getBid(eastHand);
    expect(bid && bid.token).toBe('1S');
  });

  // 1C -> 1D at various HCP levels (5-card diamonds to avoid major preference)
  test('South PASS, West 1C, North PASS; East ~7 HCP and 4 diamonds -> 1D', () => {
    system.startAuction('E');
    system.currentAuction.reseat('S');
    system.currentAuction.add(new Bid(null));   // S PASS
    system.currentAuction.add(new Bid('1C'));   // W opens 1C
    system.currentAuction.add(new Bid(null));   // N PASS

  const eastHand = makeTestHand(3, 3, 4, 3, 7);
    const bid = system.getBid(eastHand);
    expect(bid && bid.token).toBe('1D');
  });

  test('South PASS, West 1C, North PASS; East ~10 HCP and 4 diamonds -> 1D', () => {
    system.startAuction('E');
    system.currentAuction.reseat('S');
    system.currentAuction.add(new Bid(null));   // S PASS
    system.currentAuction.add(new Bid('1C'));   // W opens 1C
    system.currentAuction.add(new Bid(null));   // N PASS

  const eastHand = makeTestHand(3, 3, 4, 3, 10);
    const bid = system.getBid(eastHand);
    expect(bid && bid.token).toBe('1D');
  });
});
