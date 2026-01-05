/**
 * Tests for responder over 1H with 11 HCP and heart support.
 */

const { makeTestHand } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../assets/js/combined-bidding-system');
const { Bid } = require('../assets/js/bridge-types');

function setBergen(system, on) {
  system.conventions.config.responses = system.conventions.config.responses || {};
  system.conventions.config.responses.bergen_raises = { enabled: !!on };
}

function setJacoby(system, on) {
  system.conventions.config.responses = system.conventions.config.responses || {};
  system.conventions.config.responses.jacoby_2nt = { enabled: !!on };
}

describe('Responder over 1H with 11 HCP and heart support should not pass', () => {
  let system;

  beforeEach(() => {
    system = new SAYCBiddingSystem();
  });

  test('Bergen ON: 1H – PASS – 11 HCP, 4 hearts -> 3D (Bergen invitational)', () => {
    system.startAuction('N');
    system.currentAuction.add(new Bid('1H'));
    system.currentAuction.add(new Bid('PASS'));
    setBergen(system, true);
    setJacoby(system, true);
    // 4 hearts, 11 HCP, rest balanced
    const hand = makeTestHand(3, 4, 3, 3, 11);
    const bid = system.getBid(hand);
    expect(bid).not.toBeNull();
    expect(['3D','3H']).toContain(bid.token);
  });

  test('Bergen OFF: 1H – PASS – 11 HCP, 4 hearts -> natural raise (3H)', () => {
    system.startAuction('N');
    system.currentAuction.add(new Bid('1H'));
    system.currentAuction.add(new Bid('PASS'));
    setBergen(system, false);
    setJacoby(system, true);
    const hand = makeTestHand(3, 4, 3, 3, 11);
    const bid = system.getBid(hand);
    expect(bid).not.toBeNull();
    expect(bid.token).toBe('3H');
  });
});
