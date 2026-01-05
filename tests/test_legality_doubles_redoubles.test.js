const { SAYCBiddingSystem } = require('../assets/js/combined-bidding-system');
const { Bid } = require('../assets/js/bridge-types');

function setup(system, dealer = 'N', ourSeat = 'N') {
  system.startAuction(ourSeat);
  system.currentAuction.reseat(dealer);
}

describe('Legality guard: Double and Redouble', () => {
  test('Disallow Double of partner\'s own contract (must be opponents\' contract)', () => {
    const system = new SAYCBiddingSystem();
    setup(system, 'N', 'N');
    // N:1H (our side), E:PASS, S:PASS, W:PASS -> currentSeat back to N (our side)
    system.currentAuction.add(new Bid('1H'));
    system.currentAuction.add(new Bid('PASS'));
    system.currentAuction.add(new Bid('PASS'));
    system.currentAuction.add(new Bid('PASS'));

    const attempt = new Bid(null, { isDouble: true });
    const res = system._ensureLegal(attempt);
    expect(res).toBeTruthy();
    expect(res.isDouble).toBeFalsy();
    expect(res.token).toBe('PASS');
  });

  test('Allow Double of opponents\' contract (no prior X/XX)', () => {
    const system = new SAYCBiddingSystem();
    setup(system, 'N', 'N');
    // N:PASS, E:1S (opponents), S:PASS, W:PASS -> currentSeat N (our side)
    system.currentAuction.add(new Bid('PASS'));
    system.currentAuction.add(new Bid('1S'));
    system.currentAuction.add(new Bid('PASS'));
    system.currentAuction.add(new Bid('PASS'));

    const attempt = new Bid(null, { isDouble: true });
    const res = system._ensureLegal(attempt);
    expect(res).toBeTruthy();
    expect(res.isDouble).toBeTruthy();
    expect(res.token).toBeNull();
  });

  test('Disallow Redouble when last non-pass action is not a Double', () => {
    const system = new SAYCBiddingSystem();
    setup(system, 'N', 'N');
    // N:1D, E:PASS, S:PASS -> currentSeat W (opponents), no Double has occurred
    system.currentAuction.add(new Bid('1D'));
    system.currentAuction.add(new Bid('PASS'));
    system.currentAuction.add(new Bid('PASS'));

    const attempt = new Bid(null, { isRedouble: true });
    const res = system._ensureLegal(attempt);
    expect(res).toBeTruthy();
    expect(res.isRedouble).toBeFalsy();
    expect(res.token).toBe('PASS');
  });

  test('Allow Redouble immediately after opponents\' Double of our contract', () => {
    const system = new SAYCBiddingSystem();
    setup(system, 'N', 'N');
    // Sequence: N:1C (our), E:PASS, S:PASS, W:PASS -> back to N (not necessary but fine)
    // Simpler: N:1C (our), E:PASS, S:PASS, W:DOUBLE -> actor seat N (after three actions)
    system.currentAuction.add(new Bid('1C')); // N
    system.currentAuction.add(new Bid('PASS')); // E
    system.currentAuction.add(new Bid('PASS')); // S
    // W doubles our 1C
    system.currentAuction.add(new Bid(null, { isDouble: true }));

    // Actor seat is now N; attempt Redouble should be allowed
    const attempt = new Bid(null, { isRedouble: true });
    const res = system._ensureLegal(attempt);
    expect(res).toBeTruthy();
    expect(res.isRedouble).toBeTruthy();
    expect(res.token).toBeNull();
  });

  test('Disallow a second Double since the last contract (already doubled)', () => {
    const system = new SAYCBiddingSystem();
    setup(system, 'N', 'N');
    // Opponents make a contract: E:1S
    system.currentAuction.add(new Bid('PASS')); // N
    system.currentAuction.add(new Bid('1S'));   // E
    system.currentAuction.add(new Bid('PASS')); // S
    system.currentAuction.add(new Bid('PASS')); // W -> actor N

    // First Double by our side is legal; simulate it on the table
    system.currentAuction.add(new Bid(null, { isDouble: true })); // N doubles

    // Now next actor (E) attempts another Double (not legal)—engine should return PASS
    const attempt = new Bid(null, { isDouble: true });
    const res = system._ensureLegal(attempt);
    expect(res).toBeTruthy();
    expect(res.isDouble).toBeFalsy();
    expect(res.token).toBe('PASS');
  });

  test('Disallow Redouble after a Redouble (only one XX allowed after X)', () => {
    const system = new SAYCBiddingSystem();
    setup(system, 'N', 'N');
    // Our side makes a contract, opponents double, we redouble
    system.currentAuction.add(new Bid('1C'));                   // N (our)
    system.currentAuction.add(new Bid('PASS'));                 // E
    system.currentAuction.add(new Bid('PASS'));                 // S
    system.currentAuction.add(new Bid(null, { isDouble: true })); // W doubles
    system.currentAuction.add(new Bid(null, { isRedouble: true })); // N redoubles

    // Next actor (E) attempts another Redouble—should be illegal and return PASS
    const attempt = new Bid(null, { isRedouble: true });
    const res = system._ensureLegal(attempt);
    expect(res).toBeTruthy();
    expect(res.isRedouble).toBeFalsy();
    expect(res.token).toBe('PASS');
  });
});
