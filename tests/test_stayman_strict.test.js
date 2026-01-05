const { SAYCBiddingSystem } = require('../assets/js/combined-bidding-system');
const { Bid } = require('../assets/js/bridge-types');
const { makeHandFromPattern, buildAuction } = require('./test-helpers');

/*
 * Stricter Stayman tests over 1NT and 2NT openings:
 * Scenarios:
 * 1. 1NT opener: Responder with exactly one 4-card major (8+ HCP) -> 2C Stayman.
 * 2. 1NT opener: Responder with BOTH majors 4-4 and invitational values (10-11) -> 2C Stayman (not transfer).
 * 3. 1NT opener: Responder with 5-4 majors (spades 5, hearts 4) and invitational values prefers Stayman (seeking 4-4 fit) rather than immediate transfer.
 * 4. 1NT opener: Responder with 5-card major but no other 4-card major and weak (6-7 HCP) -> transfer (no Stayman).
 * 5. 1NT opener: Responder with no 4-card major and 8-9 HCP balanced -> 2NT (no Stayman).
 * 6. 2NT opener: Responder with a 4-card major and game values (6+ HCP per system logic for staying) -> 3C Stayman.
 * 7. 2NT opener: Responder with 5-card major (no other 4-card major) -> Jacoby transfer over 2NT (3-level transfer), not Stayman.
 * 8. Stolen-bid double scenario: 1NT – (2C) – X with Stayman enabled and 4-card major.
 */

describe('Strict Stayman decision matrix', () => {
  let system;
  beforeEach(() => {
    system = new SAYCBiddingSystem();
    system.conventions.config = system.conventions.config || {};
    system.conventions.config.notrump_responses = system.conventions.config.notrump_responses || {};
    system.conventions.config.notrump_responses.stayman = { enabled: true };
    system.conventions.config.notrump_responses.jacoby_transfers = { enabled: true };
    system.conventions.config.notrump_responses.texas_transfers = { enabled: true };
  });

  test('1NT: single 4-card major (spades) and 9 HCP -> 2C Stayman', () => {
    system.startAuction('N');
    system.currentAuction.add(new Bid('1NT'));
    const hand = makeHandFromPattern('KQJ2', 'Q32', 'Q2', '32'); // 9 HCP, only spade 4-card major
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2C');
    expect(bid.conventionUsed || '').toMatch(/stayman/i);
  });

  test('1NT: 4-4 majors with invitational 10 HCP -> 2C Stayman (seeking 4-4 fit)', () => {
    system.startAuction('N');
    system.currentAuction.add(new Bid('1NT'));
    const hand = makeHandFromPattern('KQ32', 'QJ32', 'Q2', '32'); // 10 HCP, 4-4 majors
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2C');
    expect(bid.conventionUsed || '').toMatch(/stayman/i);
  });

  test('1NT: 5-4 majors invitational (spades 5, hearts 4) -> prefers Stayman over direct transfer', () => {
    system.startAuction('N');
    system.currentAuction.add(new Bid('1NT'));
    const hand = makeHandFromPattern('KQJ32', 'QJ32', 'Q2', '32'); // 11 HCP, 5S/4H
    const bid = system.getBid(hand);
    // Ensure still 2C (Stayman) not 2D/2H transfer
    expect(bid && bid.token).toBe('2C');
    expect(bid.conventionUsed || '').toMatch(/stayman/i);
  });

  test('1NT: 5-card spade suit, weak 7 HCP -> Jacoby transfer (2H to transfer to spades)', () => {
    system.startAuction('N');
    system.currentAuction.add(new Bid('1NT'));
    const hand = makeHandFromPattern('KQJ32', '32', 'Q2', '32'); // 7 HCP, 5 spades only
    const bid = system.getBid(hand);
    // Expect transfer: For spades length, hearts shorter -> transfer via 2H? Implementation uses hearts first then spades.
    // Code likely chooses 2H for spade transfer or 2D for heart transfer; check for a transfer token (2D or 2H) but NOT 2C.
    expect(bid && bid.token).toBe('2H');
    expect(bid.conventionUsed || '').toMatch(/jacoby transfer/i);
  });

  test('1NT: no 4-card major, 9 HCP balanced -> 2NT (not Stayman)', () => {
    system.startAuction('N');
    system.currentAuction.add(new Bid('1NT'));
    const hand = makeHandFromPattern('KJ2', 'QJ2', 'J32', 'J32'); // 9 HCP balanced, no 4-card major (KJ=4, QJ=3, J=1, J=1)
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2NT');
  });

  test('2NT: responder with 4-card major and 6+ HCP -> 3C Stayman', () => {
    system.startAuction('N');
    system.currentAuction.add(new Bid('2NT'));
    const hand = makeHandFromPattern('KQ32', 'Q32', '32', '32'); // 8 HCP with 4 spades
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('3C');
    expect(bid.conventionUsed || '').toMatch(/stayman/i);
  });

  test('2NT: responder with 5-card spade suit prefers transfer over Stayman', () => {
    system.startAuction('N');
    system.currentAuction.add(new Bid('2NT'));
    const hand = makeHandFromPattern('KQJ32', 'Q2', 'Q2', '32'); // 10 HCP, 5 spades only
    const bid = system.getBid(hand);
    // Expect Jacoby transfer: 3H to spades or 3D to hearts depending suit lengths. For spade transfer over 2NT -> 3H.
    expect(bid && bid.token).toBe('3H');
    expect(bid.conventionUsed || '').toMatch(/jacoby transfer/i);
  });

  test('Stolen-bid double: 1NT – (2C) – X with 4-card major -> Double shows Stayman', () => {
    // Configure interference Stayman system on over 1NT
    system.conventions.config.general = system.conventions.config.general || {};
    system.conventions.config.general.systems_on_over_1nt_interference = {
      stayman: true,
      transfers: true,
      stolen_bid_double: true
    };

    // Auction: 1NT (us) – 2C (them) – ? (our seat is N, opener is N, 2C overcall is E, responder seat S now acts)
    system.startAuction('N');
    system.currentAuction.add(new Bid('1NT'));
    system.currentAuction.add(new Bid('2C')); // Opponent overcall
    const hand = makeHandFromPattern('KQ32', 'Q32', 'Q2', '32'); // 9 HCP, 4 spades
    const bid = system.getBid(hand);
    // Expect double with stolen-bid mapping
    expect(bid && bid.isDouble).toBe(true);
    expect(bid.conventionUsed || '').toMatch(/stolen bid/i);
    expect(bid.conventionUsed || '').toMatch(/stayman/i);
  });

  test('1NT opener: answers Stayman after a pass in between', () => {
    system.startAuction('N');
    system.currentAuction = buildAuction('N', 'N', ['1NT', 'PASS', '2C', 'PASS']);
    const hand = makeHandFromPattern('AQ4', 'KQ83', 'KQ3', 'J32'); // Balanced 1NT opener with 4 hearts
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2H');
    expect(bid.conventionUsed || '').toMatch(/stayman response/i);
  });
});
