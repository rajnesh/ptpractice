const { makeHandFromPattern, makeTestHand, buildAuction } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../assets/js/combined-bidding-system');
const { Bid, Hand, Auction } = require('../assets/js/bridge-types');

describe('Additional SAYC branches coverage', () => {
  describe('Responder after opener\'s 2NT rebid (1m - 1M - 2NT)', () => {
    let system;
    beforeEach(() => {
      system = new SAYCBiddingSystem();
      system.startAuction('S');
    });

    test('With 6+ trumps or unbalanced shape, commit to 4M', () => {
      // Auction: N:1C E:PASS S:1H W:PASS N:2NT E:PASS -> S to act
      const a = buildAuction('N', 'S', ['1C', 'PASS', '1H', 'PASS', '2NT', 'PASS']);
      system.currentAuction = a;
      // 6 hearts, 8+ HCP -> 4H
      const hand = makeTestHand(2, 6, 3, 2, 8);
      const bid = system.getBid(hand);
      expect(bid && bid.token).toBe('4H');
    });

    test('Balanced with exactly 5-card major prefers 3NT', () => {
      const a = buildAuction('N', 'S', ['1D', 'PASS', '1S', 'PASS', '2NT', 'PASS']);
      system.currentAuction = a;
      // Balanced 5 spades, ~10 HCP -> 3NT
      const hand = makeHandFromPattern('KQJ32', 'Q32', 'Q2', '432'); // 5-3-3-2 balanced-ish
      const bid = system.getBid(hand);
      expect(bid && bid.token).toBe('3NT');
    });
  });

  describe('Responder after opener\'s 3M jump following 1M - 1NT', () => {
    let system;
    beforeEach(() => { system = new SAYCBiddingSystem(); system.startAuction('S'); });

    test('With 3-card support and 10+ total points -> 4M', () => {
      const a = buildAuction('N', 'S', ['1S', 'PASS', '1NT', 'PASS', '3S', 'PASS']);
      system.currentAuction = a;
      // 3 spades, HCP 8 + distribution 2 = 10 TP => 4S
      const hand = makeHandFromPattern('Q32', 'QJ32', 'Q32', 'Q2');
      expect(hand.hcp).toBeGreaterThanOrEqual(8);
      const bid = system.getBid(hand);
      expect(bid && bid.token).toBe('4S');
    });

    test('With <3 support, balanced and 10+ HCP -> 3NT', () => {
      const a = buildAuction('N', 'S', ['1H', 'PASS', '1NT', 'PASS', '3H', 'PASS']);
      system.currentAuction = a;
      // 2 hearts, balanced 4-4-3-2 (hearts=2), >=10 HCP -> 3NT
      const hand = makeHandFromPattern('KQJ2', 'Q2', 'KQ32', 'Q32');
      const bid = system.getBid(hand);
      expect(bid && bid.token).toBe('3NT');
    });
  });

  describe('Responder after opener\'s 2m rebid following 1M - 1NT', () => {
    let system;
    beforeEach(() => { system = new SAYCBiddingSystem(); system.startAuction('S'); });

    test('Restore to 3M with 3-card support and 10+ TP', () => {
      const a = buildAuction('N', 'S', ['1S', 'PASS', '1NT', 'PASS', '2D', 'PASS']);
      system.currentAuction = a;
      // 3 spades, ~10 TP -> 3S
      const hand = makeHandFromPattern('Q32', 'QJ32', 'Q32', 'Q2');
      const bid = system.getBid(hand);
      expect(bid && bid.token).toBe('3S');
    });

    test('Prefer 2M (preference) with 3-card support and <10 TP', () => {
      const a = buildAuction('N', 'S', ['1H', 'PASS', '1NT', 'PASS', '2C', 'PASS']);
      system.currentAuction = a;
      // 3 hearts, weak total -> 2H
      const hand = makeTestHand(4, 3, 3, 3, 6);
      const bid = system.getBid(hand);
      expect(bid && bid.token).toBe('2H');
    });
  });

  describe('Opener rebids after partner\'s 2NT feature ask over our Weak Two', () => {
    let system;
    beforeEach(() => { system = new SAYCBiddingSystem(); system.startAuction('S'); });

    test('Show feature with A/K in a side suit', () => {
      // Sequence: (Dealer N) N:PASS E:PASS S:2H W:PASS N:2NT -> opener S to rebid
      const a = buildAuction('N', 'S', ['PASS', 'PASS', '2H', 'PASS', '2NT']);
      system.currentAuction = a;
      // Hand: A in clubs as feature
      const hand = new Hand({
        S: [ ],
        H: Array(6).fill(null).map(() => ({ rank: '2', suit: 'H' })),
        D: Array(2).fill(null).map(() => ({ rank: '2', suit: 'D' })),
        C: [ { rank: 'A', suit: 'C' }, { rank: '2', suit: 'C' }, { rank: '2', suit: 'C' } ]
      });
      const bid = system.getBid(hand);
      expect(bid && /^3[CDS]$/.test(bid.token)).toBe(true);
      // Specifically 3C due to A in clubs
      expect(bid.token).toBe('3C');
    });

    test('No feature -> rebid trump at 3-level', () => {
      const a = buildAuction('N', 'S', ['PASS', 'PASS', '2S', 'PASS', '2NT']);
      system.currentAuction = a;
      const hand = new Hand({
        S: Array(6).fill(null).map(() => ({ rank: '2', suit: 'S' })),
        H: Array(2).fill(null).map(() => ({ rank: '2', suit: 'H' })),
        D: Array(3).fill(null).map(() => ({ rank: '2', suit: 'D' })),
        C: Array(2).fill(null).map(() => ({ rank: '2', suit: 'C' }))
      });
      const bid = system.getBid(hand);
      expect(bid && bid.token).toBe('3S');
    });
  });

  describe('Seat-unknown fallback: last-resort higher-ranking 1-level major overcall', () => {
    let system;
    beforeEach(() => { system = new SAYCBiddingSystem(); system.startAuction('S'); });

    test('Over 1C, with 4 spades and 12+ HCP -> 1S', () => {
      // Provide explicit dealer/ourSeat so seat-aware logic runs deterministically
      const a = new Auction([], { dealer: 'N', ourSeat: 'S' });
      a.add(new Bid('1C'));
      system.currentAuction = a;
      const hand = makeHandFromPattern('KQJ2', 'Q32', 'Q2', '432'); // 12+ HCP, 4 spades
      const bid = system.getBid(hand);
      expect(bid && bid.token).toBe('1S');
    });
  });
});

describe('Global legality guard _ensureLegal', () => {
  test('Downgrades illegal lower contract to PASS', () => {
    const system = new SAYCBiddingSystem();
    system.startAuction('S');
    const a = new Auction([], { dealer: 'N', ourSeat: 'S' });
    a.add(new Bid('1D'));
    a.add(new Bid('PASS'));
    a.add(new Bid('PASS'));
    system.currentAuction = a;
    const lowered = new Bid('1C'); // lower than 1D
    const v = system._ensureLegal(lowered);
    expect(v && v.token).toBe('PASS');
  });

  test('Double legality without seats: allowed only if no X/XX since last contract', () => {
    const system = new SAYCBiddingSystem();
    system.startAuction('S');
  const a = new Auction([], { dealer: 'N', ourSeat: 'S' }); // explicit dealer and ourSeat
    a.add(new Bid('1H'));
    system.currentAuction = a;
    let v = system._ensureLegal(new Bid(null, { isDouble: true }));
    expect(v && v.isDouble).toBe(true);

    // Add a Double after last contract, now further Double should be downgraded
    a.add(new Bid(null, { isDouble: true }));
    v = system._ensureLegal(new Bid(null, { isDouble: true }));
    expect(v && v.token).toBe('PASS');
  });

  test('Redouble legality with seats: only after opponents Double of our contract', () => {
    const system = new SAYCBiddingSystem();
    system.startAuction('S');
    const a = new Auction([], { dealer: 'N', ourSeat: 'S' });
    // N(Partner):1S, E(Opponents):Double -> S(Us) to act with Redouble
    a.add(new Bid('1S')); // partner opened
    a.add(new Bid(null, { isDouble: true })); // opponents doubled
    system.currentAuction = a;
    // It is our side's turn (S) to Redouble — legality should allow it
    const v = system._ensureLegal(new Bid(null, { isRedouble: true }));
    expect(v && v.isRedouble).toBe(true);
  });

  test('Higher contract remains as-is', () => {
    const system = new SAYCBiddingSystem();
    system.startAuction('S');
    const a = new Auction([], { dealer: 'N', ourSeat: 'S' });
    a.add(new Bid('1H'));
    a.add(new Bid('PASS'));
    system.currentAuction = a;
    const v = system._ensureLegal(new Bid('1S'));
    expect(v && v.token).toBe('1S');
  });
});

describe('Opener third round action after 1-level overcall and two passes', () => {
  let system;
  beforeEach(() => { system = new SAYCBiddingSystem(); system.startAuction('N'); });

  function buildThirdRoundAuction(openingToken, overcallToken) {
    // N(Us): openingToken, E(Opp): overcallToken, S: PASS, W: PASS -> back to N (us)
    const a = new Auction([], { dealer: 'N', ourSeat: 'N' });
    a.add(new Bid(openingToken));
    a.add(new Bid(overcallToken));
    a.add(new Bid('PASS'));
    a.add(new Bid('PASS'));
    return a;
  }

  test('With stopper and 18–19 HCP -> 2NT; with 15–17 -> 1NT', () => {
    // Overcall in hearts; provide heart stopper
    system.currentAuction = buildThirdRoundAuction('1C', '1H');
    // 18 HCP, include Ace of hearts to mark stopper; shapes arbitrary
    const hand18 = makeHandFromPattern('AKQ2', 'A2', 'QJ2', 'Q32'); // HCP >= 18, hearts stopper
    let bid = system.getBid(hand18);
    expect(bid && bid.token).toBe('2NT');

    system.currentAuction = buildThirdRoundAuction('1D', '1S');
    // 16 HCP, include King and small in spades for stopper (K + len>=2)
    const hand16 = makeHandFromPattern('K2', 'KQJ2', 'KQ2', 'Q32');
    bid = system.getBid(hand16);
    expect(bid && bid.token).toBe('1NT');
  });

  test('No stopper: prefer reopening Double with shortness and two other suits 3+', () => {
    system.currentAuction = buildThirdRoundAuction('1D', '1H');
    // No heart stopper, hearts length <=2, and at least two other suits with 3+
    const hand = new Hand({
      S: [ { rank: '2', suit: 'S' }, { rank: '2', suit: 'S' }, { rank: '2', suit: 'S' } ],
      H: [ { rank: '2', suit: 'H' }, { rank: '2', suit: 'H' } ],
      D: [ { rank: 'A', suit: 'D' }, { rank: 'K', suit: 'D' }, { rank: 'Q', suit: 'D' } ],
      C: [ { rank: 'K', suit: 'C' }, { rank: 'Q', suit: 'C' }, { rank: 'J', suit: 'C' } ]
    });
    expect(hand.hcp).toBeGreaterThanOrEqual(15);
    const bid = system.getBid(hand);
    expect(!!bid && !!bid.isDouble).toBe(true);
  });

  test('No stopper but 6+ in our opening suit -> rebid 2(openedSuit)', () => {
    system.currentAuction = buildThirdRoundAuction('1C', '1H');
    // 6+ clubs, no heart stopper, HCP >=15
    const hand = new Hand({
      S: [ { rank: 'Q', suit: 'S' }, { rank: '2', suit: 'S' } ],
      // Make hearts length 3 without honors so no stopper and not "shortOver"
      H: [ { rank: '2', suit: 'H' }, { rank: '2', suit: 'H' }, { rank: '2', suit: 'H' } ],
      D: [ { rank: 'K', suit: 'D' }, { rank: 'Q', suit: 'D' }, { rank: 'J', suit: 'D' } ],
      C: [ { rank: 'A', suit: 'C' }, { rank: 'K', suit: 'C' }, { rank: 'Q', suit: 'C' }, { rank: 'J', suit: 'C' }, { rank: '2', suit: 'C' }, { rank: '2', suit: 'C' } ]
    });
    expect(hand.hcp).toBeGreaterThanOrEqual(15);
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2C');
  });
});

