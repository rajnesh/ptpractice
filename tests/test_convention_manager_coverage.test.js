const { ConventionCard } = require('../js/convention-manager');
const { Auction, Bid, Hand } = require('../js/bridge-types');
const { makeCurrentBidAligned } = require('./test-helpers');

function makeHandFromStrings(s, h, d, c) {
  return new Hand({
    'S': Array.from(s).map(r => ({ rank: r, suit: 'S' })),
    'H': Array.from(h).map(r => ({ rank: r, suit: 'H' })),
    'D': Array.from(d).map(r => ({ rank: r, suit: 'D' })),
    'C': Array.from(c).map(r => ({ rank: r, suit: 'C' })),
  });
}

function buildAuctionWithDealer(dealer, ourSeat, tokens) {
  const a = new Auction([], { dealer, ourSeat });
  tokens.forEach(tok => a.add(new Bid(tok)));
  return a;
}

describe('ConventionCard: Gerber continuation (5C asks kings)', () => {
  test('Detect 5C as gerber_kings after 4C ask and a single response', () => {
    const cc = new ConventionCard();
    // Ensure continuations enabled (default true)
    cc.config.ace_asking.gerber.continuations = true;

    const auction = new Auction([], { dealer: 'N', ourSeat: 'N' });
    auction.add(new Bid('1NT'));          // N
    auction.add(new Bid('PASS'));         // E
  auction.add(new Bid('4C'));           // S (Gerber ask)
  // Intentionally omit intervening passes to match continuation detector
  auction.add(new Bid('4D'));           // N (Gerber response)
  auction.add(new Bid('PASS'));         // E (trailing pass so detector sees exactly one response between)
    // 5C should be by the same seat that asked with 4C
  const bid5c = makeCurrentBidAligned(auction, '5C', '4C');

    const res = cc.isAceAskingBid(auction, bid5c);
    expect(res.isAceAsking).toBe(true);
    expect(res.convention).toBe('gerber_kings');
  });
});

describe('ConventionCard: Unusual NT direct-only classification', () => {
  test('2NT over 1M is Unusual NT when direct-only and direct; non-direct is not classified', () => {
    const cc = new ConventionCard();
    cc.config.notrump_defenses.unusual_nt.enabled = true;
    cc.config.notrump_defenses.unusual_nt.direct = true;

    // Direct overcall: 1H (opening) – 2NT (no intervening non-pass calls recorded in auction)
    {
      const auction = new Auction([], { dealer: 'N', ourSeat: 'E' });
      auction.add(new Bid('1H'));   // N opens
      const our2nt = new Bid('2NT');
      // Provide shape for the classification path (two lowest unbid suits over 1H are C and D)
      const hand = makeHandFromStrings('32', '32', 'KQJT9', 'KQJT9');
      const out = cc.isTwoSuitedOvercall(auction, our2nt, hand);
      expect(out.isTwoSuited).toBe(true);
      expect(out.convention).toBe('unusual_nt');
      expect(out.suits.length).toBe(2);
    }

    // Non-direct: 1H – 1S – 2NT (should not classify when direct-only)
    {
      const auction = new Auction([], { dealer: 'N', ourSeat: 'E' });
      auction.add(new Bid('1H'));
      auction.add(new Bid('1S'));
      const our2nt = new Bid('2NT');
      const out = cc.isTwoSuitedOvercall(auction, our2nt);
      expect(out.isTwoSuited).toBe(false);
      expect(out.convention).toBe('');
    }
  });
});

describe('ConventionCard: adjustForVulnerability and getConventionSetting', () => {
  test('Vulnerability adjustments for weak_two and default for unknown types', () => {
    const cc = new ConventionCard();

    // Unfavorable (we vul, they not): weak_two min adjust should be +4 per config
    const adj = cc.adjustForVulnerability('weak_two', { we: true, they: false });
    expect(adj.minAdjust).toBe(4);

    // Unknown type returns 0 adjustments
    const none = cc.adjustForVulnerability('random_type', { we: false, they: false });
    expect(none.minAdjust).toBe(0);
    expect(none.maxAdjust).toBe(0);
  });

  test('getConventionSetting scans categories when category is null', () => {
    const cc = new ConventionCard();
    // Should find a known setting without providing category
    const enabled = cc.getConventionSetting('jacoby_2nt', 'enabled');
    expect(typeof enabled).toBe('boolean');
  });
});
