const { SAYCBiddingSystem } = require('../js/combined-bidding-system');

describe('_isCueBidRaise helper', () => {
  let system;
  beforeEach(() => {
    system = new SAYCBiddingSystem();
  });

  test('returns true for a cue-raise of the overcall suit when parity matches', () => {
    const auction = {
      bids: [
        { token: '1H', seat: 'W' },
        { token: '1S', seat: 'N' },
        { token: 'PASS', seat: 'E' }
      ]
    };
    expect(system._isCueBidRaise(auction, '2S')).toBe(true);
  });

  test('returns false when parity does not indicate same side as overcaller', () => {
    const auction = {
      bids: [
        { token: '1H', seat: 'W' },
        { token: '1S', seat: 'N' }
      ]
    };
    expect(system._isCueBidRaise(auction, '2S')).toBe(false);
  });

  test('returns false for a non-matching target suit', () => {
    const auction = {
      bids: [
        { token: '1H', seat: 'W' },
        { token: '1S', seat: 'N' },
        { token: 'PASS', seat: 'E' }
      ]
    };
    expect(system._isCueBidRaise(auction, '2D')).toBe(false);
  });

  test('returns false for non-suit bid tokens (e.g., 2NT)', () => {
    const auction = {
      bids: [
        { token: '1C', seat: 'W' },
        { token: '1D', seat: 'N' },
        { token: 'PASS', seat: 'E' }
      ]
    };
    expect(system._isCueBidRaise(auction, '2NT')).toBe(false);
  });

  test('works when bids have no seat metadata (defaults to by-opponent inference)', () => {
    const auction = { bids: [{ token: '1H' }, { token: '1S' }, { token: 'PASS' }] };
    expect(system._isCueBidRaise(auction, '2S')).toBe(true);
  });

  test('returns false when the overcall is a double (X)', () => {
    const auction = { bids: [{ token: '1H', seat: 'W' }, { token: 'X', seat: 'N' }, { token: 'PASS', seat: 'E' }] };
    // Overcall is X (double) — helper should return false as there is no suit to cue
    expect(system._isCueBidRaise(auction, '2H')).toBe(false);
  });

  test('returns false when opener is NT (no suit opening)', () => {
    const auction = { bids: [{ token: '1NT', seat: 'W' }, { token: '1S', seat: 'N' }, { token: 'PASS', seat: 'E' }] };
    // Opener was NT so there is no suit opening to base cue-detection on
    expect(system._isCueBidRaise(auction, '2S')).toBe(false);
  });
});
