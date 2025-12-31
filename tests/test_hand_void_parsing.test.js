const { Hand } = require('../js/bridge-types');

describe('Hand parsing with voids', () => {
  test('Dash "-" denotes a true void (0 cards) and awards 3 DP', () => {
    const hand = new Hand('- AKQJT 987 65432');
    expect(hand.lengths.S).toBe(0);
    expect(hand.distributionPoints).toBeGreaterThanOrEqual(3);
    // With exactly one void and no other shortness, DP should be 3
    expect(hand.lengths.H).toBe(5);
    expect(hand.lengths.D).toBe(3);
    expect(hand.lengths.C).toBe(5);
    const expectedDP = 3; // one void only
    expect(hand.distributionPoints).toBe(expectedDP);
  });
});
