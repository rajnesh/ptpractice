const { SAYCBiddingSystem } = require('../assets/js/combined-bidding-system');
const { Auction, Bid, Hand } = require('../assets/js/bridge-types');

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

// NOTE: The following higher-order responder rebid nuances are covered elsewhere in suites.
// This file focuses on Weak Two feature-ask coverage to bump targeted branches reliably.

describe('Targeted coverage: Weak Two feature ask (2M – 2NT)', () => {
  test('Opener shows feature with A/K in a side suit; else rebids trump', () => {
    // Case 1: Show feature in spades over 2H – 2NT
    {
      const sys = new SAYCBiddingSystem();
      sys.ourSeat = 'N';
      const auction = new Auction([], { dealer: 'N', ourSeat: 'N' });
      auction.add(new Bid('2H')); // N opens weak two hearts
      auction.add(new Bid('PASS'));
      auction.add(new Bid('2NT')); // S asks for feature
      sys.currentAuction = auction;

      // Have A in spades => show 3S
      const hand = makeHandFromStrings('A432', 'KQT987', '32', '32');
      const bid = sys.getBid(hand);
      expect(bid.token).toBe('3S');
      expect(bid.conventionUsed || '').toMatch(/Feature shown/i);
    }

    // Case 2: No side-suit A/K => rebid 3H
    {
      const sys = new SAYCBiddingSystem();
      sys.ourSeat = 'N';
      const auction = new Auction([], { dealer: 'N', ourSeat: 'N' });
      auction.add(new Bid('2H'));
      auction.add(new Bid('PASS'));
      auction.add(new Bid('2NT'));
      sys.currentAuction = auction;

      // No A/K in side suits
      const hand = makeHandFromStrings('Q432', 'KQT987', 'Q32', 'Q32'); // only queens/kings in trump ignored for feature
      const bid = sys.getBid(hand);
      expect(bid.token).toBe('3H');
      expect(bid.conventionUsed || '').toMatch(/No feature/i);
    }
  });
});
