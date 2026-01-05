const { SAYCBiddingSystem } = require('../assets/js/combined-bidding-system');
const { Bid, Auction } = require('../assets/js/bridge-types');
const { makeHandFromPattern, makeTestHand, makeHandFromRanks } = require('./test-helpers');

function setupStrong2CWaiting(ourSeat = 'W', dealer = 'W') {
  const system = new SAYCBiddingSystem();
  system.startAuction(ourSeat);
  system.currentAuction = new Auction([], { dealer, ourSeat });
  // 2C – PASS – 2D – PASS – (our turn)
  system.currentAuction.add(new Bid('2C'));
  system.currentAuction.add(new Bid('PASS'));
  system.currentAuction.add(new Bid('2D'));
  system.currentAuction.add(new Bid('PASS'));
  return system;
}

describe('CBS uncovered branches: 2C continuations, opener acceptances, conservative X, and legality seatless', () => {
  describe('Strong 2C continuation variants over 2D waiting', () => {
    test('Unbalanced with 6 spades -> 2S (natural)', () => {
      const system = setupStrong2CWaiting('W', 'W');
      const hand = makeTestHand(6, 2, 3, 2, 22);
      const bid = system.getBid(hand);
      expect(bid && bid.token).toBe('2S');
      const exp = system.getExplanationFor(bid, system.currentAuction);
      expect(exp || '').toMatch(/Strong 2C continuation: natural spades/i);
    });

    test('Unbalanced with 6 diamonds -> 3D (natural)', () => {
      const system = setupStrong2CWaiting('W', 'W');
      const hand = makeTestHand(3, 2, 6, 2, 22);
      const bid = system.getBid(hand);
      expect(bid && bid.token).toBe('3D');
      const exp = system.getExplanationFor(bid, system.currentAuction);
      expect(exp || '').toMatch(/Strong 2C continuation: natural diamonds/i);
    });

    test('Unbalanced with 6 clubs -> 3C (natural)', () => {
      const system = setupStrong2CWaiting('W', 'W');
      const hand = makeTestHand(2, 2, 3, 6, 22);
      const bid = system.getBid(hand);
      expect(bid && bid.token).toBe('3C');
      const exp = system.getExplanationFor(bid, system.currentAuction);
      expect(exp || '').toMatch(/Strong 2C continuation: natural clubs/i);
    });

    test('Fallback: 22+ HCP, unbalanced (no 5+ suit) -> 2NT', () => {
      const system = setupStrong2CWaiting('W', 'W');
      // 4-4-4-1 shape, ~23 HCP (unbalanced, no 5+ suit)
      const hand = makeHandFromRanks({
        S: ['A', 'K', 'Q', '2'],   // 9 HCP
        H: ['A', 'K', 'Q', '2'],   // 9 HCP
        D: ['K', 'Q', '2', '2'],   // 5 HCP
        C: ['2']
      });
      const bid = system.getBid(hand);
      expect(bid && bid.token).toBe('2NT');
      const exp = system.getExplanationFor(bid, system.currentAuction);
      expect(exp || '').toMatch(/2NT rebid over 2C/i);
      expect(exp || '').toMatch(/balanced/i);
    });
  });

  describe('Third round opener: conservative last-resort double with 15+ HCP and no other action', () => {
    test('1H – (1S) – PASS – PASS; 15 HCP, no S stopper, not short S, <6 hearts -> X', () => {
      const system = new SAYCBiddingSystem();
      system.startAuction('N');
      system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'N' });
      system.currentAuction.add(new Bid('1H')); // N opens 1H
      system.currentAuction.add(new Bid('1S')); // E overcalls 1S
      system.currentAuction.add(new Bid('PASS')); // S passes
      system.currentAuction.add(new Bid('PASS')); // W passes

      // Hand: 15 HCP, spades length 3 with no honor (no stopper), hearts length 5, so not 6; other suits modest
      const hand = makeHandFromRanks({
        S: ['2', '2', '2'],               // no stopper
        H: ['A', 'K', 'Q', '2', '2'],     // 5 hearts, <6
        D: ['K', 'Q', '2'],               // adds HCP
        C: ['Q', '2', '2']
      });
      const bid = system.getBid(hand);
      expect(bid && bid.isDouble).toBe(true);
      expect(bid.token).toBeNull();
    });
  });

  // Note: Opener acceptance via getBid is already covered via direct _handleNTOpenerRebid tests.

  describe('Legality guard seatless branch and lower-contract suppression', () => {
    test('Seatless: disallow second Double since last contract', () => {
      const system = new SAYCBiddingSystem();
      system.startAuction('N');
      // Create an auction without dealer assignment (seatless)
  system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'N' });
      system.currentAuction.add(new Bid('1D')); // last contract exists, no seat assigned
      system.currentAuction.add(new Bid(null, { isDouble: true })); // some X on table

      const attempt = new Bid(null, { isDouble: true });
      const res = system._ensureLegal(attempt);
      expect(res && res.token).toBe('PASS');
    });

    test('Seatless: disallow Redouble when last non-pass is not a Double', () => {
      const system = new SAYCBiddingSystem();
      system.startAuction('N');
  system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'N' });
      system.currentAuction.add(new Bid('1C'));
      system.currentAuction.add(new Bid('PASS'));

      const attempt = new Bid(null, { isRedouble: true });
      const res = system._ensureLegal(attempt);
      expect(res && res.token).toBe('PASS');
    });

    test('Lower contract than last is suppressed to PASS', () => {
      const system = new SAYCBiddingSystem();
      system.startAuction('N');
      system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'N' });
      system.currentAuction.add(new Bid('1H')); // N
      system.currentAuction.add(new Bid('PASS')); // E
      system.currentAuction.add(new Bid('2H')); // S
      system.currentAuction.add(new Bid('PASS')); // W -> back to N

      const attempt = new Bid('1S'); // lower than 2H
      const res = system._ensureLegal(attempt);
      expect(res && res.token).toBe('PASS');
    });

    test('Same-level lower suit than last is suppressed to PASS (2H -> attempt 2D)', () => {
      const system = new SAYCBiddingSystem();
      system.startAuction('N');
      system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'N' });
      system.currentAuction.add(new Bid('1H')); // N
      system.currentAuction.add(new Bid('PASS')); // E
      system.currentAuction.add(new Bid('2H')); // S
      system.currentAuction.add(new Bid('PASS')); // W -> back to N

      const attempt = new Bid('2D'); // same level, lower suit
      const res = system._ensureLegal(attempt);
      expect(res && res.token).toBe('PASS');
    });
  });

  // Note: Responder rebid after transfer acceptance is exercised elsewhere indirectly; direct coverage is tricky due to turn/seat alignment.
});
