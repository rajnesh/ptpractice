const { SAYCBiddingSystem } = require('../assets/js/combined-bidding-system.js');

function makeCard(rank, suit) { return { rank, suit }; }
function makeHand({ S=0, H=0, D=0, C=0, hcp=0, dist=0, stopperSuit=null, stopperRank='A' } = {}) {
  const suitBuckets = { S: [], H: [], D: [], C: [] };
  const lengths = { S, H, D, C };
  // Populate buckets with filler ranks for length accounting; add stopper if requested
  for (const suit of ['S','H','D','C']) {
    const len = lengths[suit] || 0;
    for (let i = 0; i < len; i++) {
      suitBuckets[suit].push(makeCard('2', suit));
    }
  }
  if (stopperSuit) {
    // Ensure suit has at least one card, then assign the first to desired rank (A/K)
    if (suitBuckets[stopperSuit].length === 0) suitBuckets[stopperSuit].push(makeCard('2', stopperSuit));
    suitBuckets[stopperSuit][0] = makeCard(stopperRank, stopperSuit);
    // If K-stopper desired and length requirement applies, ensure 2+ cards exist
    if (stopperRank === 'K' && suitBuckets[stopperSuit].length < 2) {
      suitBuckets[stopperSuit].push(makeCard('3', stopperSuit));
      lengths[stopperSuit] += 1;
    }
  }
  return {
    suitBuckets,
    lengths,
    hcp,
    distributionPoints: dist,
    toString() { return `HCP ${hcp} ${JSON.stringify(lengths)}`; }
  };
}

function add(system, tok) {
  if (tok === 'PASS') {
    system.currentAuction.add({ token: 'PASS', seat: null });
  } else if (tok === 'X' || tok === 'XX') {
    system.currentAuction.add({ token: null, isDouble: tok === 'X', isRedouble: tok === 'XX', seat: null });
  } else {
    system.currentAuction.add({ token: tok, seat: null });
  }
}

describe('CBS coverage uplift: third-round reopen branches, 1M-1NT-2m restores, and ensureLegal', () => {

  test('Third round after 1-level overcall: 18–19 with stopper -> 2NT; 6+ trump no-stopper -> 2M', () => {
    // Pattern: We opened 1H; they overcall 1S; Pass; Pass; our turn
    const sys = new SAYCBiddingSystem();
    sys.startAuction('S', false, false);
    sys.currentAuction.reseat('S');
    add(sys, '1H'); add(sys, '1S'); add(sys, 'PASS'); add(sys, 'PASS');

    // With stopper and 18–19 -> 2NT
    const withStopper = makeHand({ S:2, H:4, D:4, C:3, hcp:18, stopperSuit:'S', stopperRank:'A' });
    const b1 = sys.getBid(withStopper);
    expect(b1 && b1.token).toBe('2NT');

    // Reset: aim for 6+ opened suit path (no stopper, not good for X because not short in overcall suit)
    sys.startAuction('S', false, false); sys.currentAuction.reseat('S');
    add(sys, '1H'); add(sys, '1S'); add(sys, 'PASS'); add(sys, 'PASS');
    const sixTrumpNoStop = makeHand({ S:3, H:6, D:2, C:2, hcp:15 });
    const b2 = sys.getBid(sixTrumpNoStop);
    expect(b2 && b2.token).toBe('2H');
  });

  test('1M – 1NT – 2m: with 3-card support and >=10 TP -> 3M; with <10 TP -> 2M preference', () => {
    const sys = new SAYCBiddingSystem();
    sys.startAuction('S', false, false);
    // Make partner dealer so they can open 1S and we respond 1NT, then partner 2C
    sys.currentAuction.reseat('N');
    add(sys, '1S'); add(sys, 'PASS'); add(sys, '1NT'); add(sys, 'PASS'); add(sys, '2C'); add(sys, 'PASS');

    // Our turn with 3 spades and 10 TP => 3S invitational
    const inv = makeHand({ S:3, H:3, D:4, C:3, hcp:9, dist:1 });
    let b = sys.getBid(inv);
    expect(b && b.token).toBe('3S');

    // Reset, same sequence, but low TP => 2S preference
    sys.startAuction('S', false, false); sys.currentAuction.reseat('N');
    add(sys, '1S'); add(sys, 'PASS'); add(sys, '1NT'); add(sys, 'PASS'); add(sys, '2C'); add(sys, 'PASS');
    const pref = makeHand({ S:3, H:3, D:4, C:3, hcp:6, dist:1 }); // 7 TP
    b = sys.getBid(pref);
    expect(b && b.token).toBe('2S');
  });

  describe('_ensureLegal guard cases', () => {
    test('Double is illegal when last contract was by our side (should PASS)', () => {
      const sys = new SAYCBiddingSystem();
      sys.startAuction('S', false, false);
      sys.currentAuction.reseat('S');
      // Our side bids: S:1H; W:PASS; N:2H; E:PASS; S to act
      add(sys, '1H'); add(sys, 'PASS'); add(sys, '2H'); add(sys, 'PASS');
      const passOnIllegal = sys._ensureLegal({ isDouble: true });
      expect(passOnIllegal && passOnIllegal.token).toBe('PASS');
    });

    test('Redouble illegal when last non-pass action is not Double (should PASS)', () => {
      const sys = new SAYCBiddingSystem();
      sys.startAuction('S', false, false);
      sys.currentAuction.reseat('S');
      // S:1H (contract); W:1S (not a double); N:PASS; now E to act
      add(sys, '1H'); add(sys, '1S'); add(sys, 'PASS');
      const rr = sys._ensureLegal({ isRedouble: true });
      expect(rr && rr.token).toBe('PASS');
    });

    test('Redouble illegal by wrong side (should PASS)', () => {
      const sys = new SAYCBiddingSystem();
      sys.startAuction('S', false, false);
      sys.currentAuction.reseat('S');
      // S:1H; W:X; N:PASS; current seat E (wrong side to redouble)
      add(sys, '1H'); add(sys, 'X'); add(sys, 'PASS');
      const rr = sys._ensureLegal({ isRedouble: true });
      expect(rr && rr.token).toBe('PASS');
    });

    test('Contract not higher than last → coerced to PASS by guard', () => {
      const sys = new SAYCBiddingSystem();
      sys.startAuction('S', false, false);
      sys.currentAuction.reseat('S');
      add(sys, '1D'); add(sys, 'PASS');
      const guarded = sys._ensureLegal({ token: '1C' }); // lower suit at same level
      expect(guarded && guarded.token).toBe('PASS');
    });
  });
});
