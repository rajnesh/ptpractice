const { SAYCBiddingSystem } = require('../assets/js/combined-bidding-system');
const { Bid, Auction } = require('../assets/js/bridge-types');
const { makeHandFromPattern, makeTestHand } = require('./test-helpers');

/**
 * Comprehensive checks for engine-provided explanation text (conventionUsed).
 * These tests verify that important bids carry clear, context-aware explanations.
 */

describe('Comprehensive explanation strings (engine-provided)', () => {
  test('Delayed natural overcall: favorable vulnerability allows 6-card suit and explains it', () => {
    const system = new SAYCBiddingSystem();
    // East perspective (we = EW); set favorable (we not vul, they vul)
    system.startAuction('E', false, true);
  system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'N' });
  system.currentAuction.reseat('S');
    // 1H - Pass - 1NT - ?
    system.currentAuction.add(new Bid('1H')); // they open 1H
    system.currentAuction.add(new Bid(null)); // partner pass
    system.currentAuction.add(new Bid('1NT')); // responder 1NT

    // Our hand: 6 spades, 9 HCP, 2 DP -> 11 total, should be allowed at favorable
    const east = makeTestHand(6, 2, 3, 2, 9);
    // Add two distribution points for a 6-card suit in this synthetic helper context
    east.distributionPoints = 2;

    const bid = system.getBid(east);
    expect(bid && bid.token).toBe('2S');
    const expl = bid.conventionUsed || '';
    expect(expl).toContain('Delayed natural overcall');
    expect(expl).toContain('vul=fav');
    expect(expl).toMatch(/6-card permitted/i);
  });

  test('Delayed natural overcall: equal vulnerability requires 7+; 6-card should not enter', () => {
    const system = new SAYCBiddingSystem();
    system.startAuction('E', false, false); // equal
  system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'N' });
  system.currentAuction.reseat('S');
    system.currentAuction.add(new Bid('1H'));
    system.currentAuction.add(new Bid(null));
    system.currentAuction.add(new Bid('1NT'));

    // 6 spades, 12 total points -> should NOT enter at equal by our conservative rule
    const east = makeTestHand(6, 2, 3, 2, 10);
    east.distributionPoints = 2;
    const bid = system.getBid(east);
    expect(!bid || bid.token !== '2S').toBe(true);
  });

  test('Delayed natural overcall: equal vulnerability with 7-card suit should enter and explain', () => {
    const system = new SAYCBiddingSystem();
    system.startAuction('E', false, false); // equal
  system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'N' });
  system.currentAuction.reseat('S');
    system.currentAuction.add(new Bid('1H'));
    system.currentAuction.add(new Bid(null));
    system.currentAuction.add(new Bid('1NT'));

    // 7 spades, 11 total points
    const east = makeTestHand(7, 2, 2, 2, 9);
    east.distributionPoints = 2;
    const bid = system.getBid(east);
    expect(bid && bid.token).toBe('2S');
    expect((bid.conventionUsed || '')).toContain('Delayed natural overcall');
  });

  test('Opener 2NT rebid explanation (18–19 balanced)', () => {
    const system = new SAYCBiddingSystem();
    // Opener is South (we = S)
    system.startAuction('S');
    const A = new Auction([], { dealer: 'S', ourSeat: 'S' });
  system.currentAuction = A;
  A.reseat('S');
    A.add(new Bid('1D')); // we open
    A.add(new Bid(null)); // LHO pass
    A.add(new Bid('1H')); // partner 1-level response
    A.add(new Bid(null)); // RHO pass

    // Our hand: 18 HCP balanced -> 2NT rebid with explanation
    const south = makeHandFromPattern('KQ2','KQ2','KQ2','KQ2'); // 16 HCP, bump to 18 by manual prop
    south.hcp = 18; // normalize to 18 for deterministic check
    const bid = system.getBid(south);
    expect(bid && bid.token).toBe('2NT');
    expect(bid.conventionUsed || '').toBe('2NT rebid: 18–19 HCP, balanced');
  });

  test('Michaels cue-bid explanation present', () => {
    const system = new SAYCBiddingSystem();
    system.startAuction('E');
  const A = new Auction([], { dealer: 'W', ourSeat: 'E' });
  system.currentAuction = A;
  A.add(new Bid('1H'));

    // East hand: Michaels over 1H -> spades + a minor (5-5)
    const east = makeTestHand(5, 1, 5, 2, 12);
    const bid = system.getBid(east);
    expect(bid && bid.token).toBe('2H');
    expect((bid.conventionUsed || '').toLowerCase()).toContain('michaels');
  });

  test('Unusual 2NT explanation present', () => {
    const system = new SAYCBiddingSystem();
    system.startAuction('E');
  const A = new Auction([], { dealer: 'W', ourSeat: 'E' });
  system.currentAuction = A;
  A.add(new Bid('1S'));

    // East hand: 5-5 in minors -> Unusual 2NT
    const east = makeTestHand(1, 2, 5, 5, 12);
    const bid = system.getBid(east);
    expect(bid && bid.token).toBe('2NT');
    expect((bid.conventionUsed || '').toLowerCase()).toContain('unusual nt');
  });
});
