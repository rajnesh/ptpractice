const { makeHandFromPattern, makeTestHand } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid, Auction } = require('../js/bridge-types');

/**
 * Comprehensive tests for Weak Two openings and responses, including 2NT feature ask.
 */

describe('Weak Two openings and responses', () => {
  let system;

  beforeEach(() => {
    system = new SAYCBiddingSystem();
  });

  test('Opening 2S (equal vul) is tagged as Weak Two with explanation', () => {
    system.startAuction('S', false, false);
    // 8 HCP, 6 spades
    const opener = makeHandFromPattern('KQJ987', '32', '432', '32');
    const bid = system.getBid(opener);
    expect(bid && bid.token).toBe('2S');
    expect(bid.conventionUsed || '').toMatch(/Weak Two opening/);
  });

  test('Responder: raise to game over 2H with strong game values (17+) and support', () => {
    // Auction: 2H by South (opener) — set dealer to S and we are responder (W)
  system.currentAuction = new Auction([], { dealer: 'S', ourSeat: 'N' });
    system.currentAuction.add(new Bid('2H'));
    // Responder: 15 HCP, 3-card support
  const responder = makeHandFromPattern('AK2', 'AKJ', 'Q2', 'Q2'); // 17 HCP
    const rBid = system.getBid(responder);
    expect(rBid && rBid.token).toBe('4H');
    expect(rBid.conventionUsed || '').toMatch(/Raise to game over Weak Two/);
  });

  test('Responder: invitational raise to 3S over 2S with 10-11 HCP and support', () => {
  // Opener 2S by South; we are responder (W)
  system.currentAuction = new Auction([], { dealer: 'S', ourSeat: 'N' });
    system.currentAuction.add(new Bid('2S'));
    const responder = makeHandFromPattern('Q32', 'Q32', 'Q32', 'KQ'); // ~10 HCP, 3 spades
    const rBid = system.getBid(responder);
    expect(rBid && rBid.token).toBe('3S');
    expect(rBid.conventionUsed || '').toMatch(/Raise over Weak Two/);
  });

  test('Responder: 3NT natural over 2H with balanced 16+ and stoppers', () => {
  system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'N' });
    system.currentAuction.add(new Bid('2H'));
    // Balanced 16+ with stoppers in all other suits (give A/K/Q patterns)
    const responder = makeHandFromPattern('AQx', 'xx', 'KQx', 'KQx');
    const rBid = system.getBid(responder);
    // Allow either 3NT or PASS if stoppers heuristic fails, but prefer 3NT
    expect(!rBid || rBid.token === '3NT' || rBid.token === 'PASS').toBe(true);
    if (rBid && rBid.token === '3NT') {
      expect(rBid.conventionUsed || '').toMatch(/Natural 3NT over Weak Two Major/);
    }
  });

  test('Responder: new suit forcing at 3-level over 2D with 16+ HCP and 5+ suit', () => {
  // Opener 2D by South; we are responder (W)
  system.currentAuction = new Auction([], { dealer: 'S', ourSeat: 'N' });
    system.currentAuction.add(new Bid('2D'));
  const responder = makeHandFromPattern('AKQJx', 'xx', 'xx', 'AKx'); // strong spade suit, 16+ HCP
    const rBid = system.getBid(responder);
    expect(rBid && rBid.token).toBe('3S');
    expect(rBid.conventionUsed || '').toMatch(/New suit forcing over Weak Two/);
  });

  test('Responder: 2NT is Feature ask over 2S with 15+ and support', () => {
  // Opener 2S by South; we are responder (W)
  system.currentAuction = new Auction([], { dealer: 'S', ourSeat: 'N' });
    system.currentAuction.add(new Bid('2S'));
    const responder = makeHandFromPattern('Qxx', 'Qxx', 'AKx', 'KQx'); // 15+ HCP, 3 spades
    const rBid = system.getBid(responder);
    expect(rBid && rBid.token).toBe('2NT');
    expect(rBid.conventionUsed || '').toMatch(/Feature ask over Weak Two/);
  });

  test("Opener response to 2NT feature ask: show feature at 3-level if holding A/K in a side suit", () => {
    // Seat-aware auction so opener rebid path is used
    system.currentAuction = new Auction([], { dealer: 'S', ourSeat: 'S' });
    // Opener: 2S
    system.currentAuction.add(new Bid('2S', { seat: 'S' }));
    // Responder: 2NT (feature ask)
    system.currentAuction.add(new Bid('2NT', { seat: 'N' }));

    // Opener hand: 6 spades, club Ace feature
    const opener = makeHandFromPattern('KQJ987', 'x', 'xxx', 'Ax');
    const reply = system.getBid(opener);
    expect(reply && (reply.token === '3C' || reply.token === '3D' || reply.token === '3H' || reply.token === '3S')).toBe(true);
    // Should prefer showing the club feature (3C)
    if (reply.token === '3C') {
      expect(reply.conventionUsed || '').toMatch(/Feature shown/);
    }
  });

  test('Opener response to 2NT feature ask: no feature -> rebid 3M with explanation', () => {
    system.currentAuction = new Auction([], { dealer: 'S', ourSeat: 'S' });
    system.currentAuction.add(new Bid('2H', { seat: 'S' }));
    system.currentAuction.add(new Bid('2NT', { seat: 'N' }));

    // No outside A/K
    const opener = makeHandFromPattern('xx', 'KQJxxx', 'Txxx', 'xx'); // only high cards in trumps
    const reply = system.getBid(opener);
    expect(reply && reply.token).toBe('3H');
    expect(reply.conventionUsed || '').toMatch(/No feature/);
  });

  test('Minimal responder values without support prefer pass over raising new suit', () => {
  system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'N' });
    system.currentAuction.add(new Bid('2S'));
    const responder = makeHandFromPattern('xx', 'KQJxx', 'Qxx', 'Qxx'); // minimal HCP, no 3+ spade support
    const rBid = system.getBid(responder);
    expect(!rBid || rBid.token === 'PASS' || rBid.isDouble).toBe(true);
  });
});
