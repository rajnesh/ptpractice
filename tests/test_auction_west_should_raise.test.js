/** @jest-environment node */

const path = require('path');

const types = require(path.join(__dirname, '..', 'assets', 'js', 'bridge-types.js'));
const conv = require(path.join(__dirname, '..', 'assets', 'js', 'convention-manager.js'));
const combined = require(path.join(__dirname, '..', 'assets', 'js', 'combined-bidding-system.js'));

class StubCard { constructor(rank, suit) { this.rank = rank; this.suit = suit; } }
class StubHand {
  constructor(map, hcp = 0) {
    this.suitBuckets = { S: [], H: [], D: [], C: [] };
    this.lengths = { S: 0, H: 0, D: 0, C: 0 };
    if (map) {
      ['S','H','D','C'].forEach(s => {
        const arr = map[s] || [];
        this.suitBuckets[s] = arr.map(r => new StubCard(r, s));
        this.lengths[s] = arr.length;
      });
    }
    this.hcp = hcp;
  }
  toString() { return JSON.stringify({ lengths: this.lengths, hcp: this.hcp }); }
}

describe('Auction repro (Node): West should raise rather than pass', () => {
  test('West bids after partner 1H when opener strong and has 4-card support', () => {
    // Create system instance
    const system = new combined.SAYCBiddingSystem();
    console.log('TEST-DEBUG system.constructor.name=', system.constructor.name);

    // Create stub hands
    const westHand = new StubHand({ H: ['K','Q','9','2'], C: ['A','3'] }, 15);
    const eastHand = new StubHand({ H: ['5','4','3','6'], D: ['7'] }, 10);
    const northHand = new StubHand({}, 0);
    const southHand = new StubHand({}, 0);

    // Create auction and seed bids with seats and dealer
    const Auction = types.Auction;
    const Bid = types.Bid;

    const auction = new Auction([], { ourSeat: 'W', dealer: 'S' });
    // Add bids in rotation (dealer S): S PASS, W 1C, N PASS, E 1H, S PASS
    const b0 = new Bid('PASS'); b0.seat = 'S'; auction.add(b0);
    const b1 = new Bid('1C'); b1.seat = 'W'; auction.add(b1);
    const b2 = new Bid('PASS'); b2.seat = 'N'; auction.add(b2);
    const b3 = new Bid('1H'); b3.seat = 'E'; auction.add(b3);
    const b4 = new Bid('PASS'); b4.seat = 'S'; auction.add(b4);

    // Give the system the auction context and set ourSeat to W (we are West)
    system.startAuction('W');
    system.currentAuction = auction;
    system.ourSeat = 'W';

    // Debugging: replicate the opener-rebid heuristic checks to verify conditions
    const bids = auction.bids;
    let firstIdx = -1;
    for (let i = 0; i < bids.length; i++) {
      const t = bids[i]?.token || (bids[i]?.isDouble ? 'X' : bids[i]?.isRedouble ? 'XX' : 'PASS');
      if (t && t !== 'PASS') { firstIdx = i; break; }
    }
    const openerSeat = firstIdx !== -1 ? (bids[firstIdx].seat || null) : null;
    const order = types.Auction.TURN_ORDER || ['N','E','S','W'];
    const openerIdx = openerSeat ? order.indexOf(openerSeat) : -1;
    const partnerSeat = openerIdx >= 0 ? order[(openerIdx + 2) % 4] : null;
    const resp = bids[firstIdx + 2];
    const respTok = resp ? resp.token : null;
    const respSuit = respTok && /^[1][CDHS]$/.test(respTok) ? respTok[1] : null;
    const support = respSuit ? (westHand.lengths[respSuit] || 0) : 0;
    console.log('DEBUG openerSeat=', openerSeat, 'ourSeat=', system.ourSeat, 'partnerSeat=', partnerSeat, 'respTok=', respTok, 'support=', support, 'hcp=', westHand.hcp);

    // Inspect getBid source (debug) and call it
    // console.log('getBid source:\n', system.getBid.toString().slice(0,2000));
    const pick = system.getBid(westHand);

    // Debug: show pick
    console.log('TEST-DEBUG pick=', pick && pick.token, pick);
    // Expect West not to pass
    expect(pick && pick.token).not.toBe('PASS');
  });
});
