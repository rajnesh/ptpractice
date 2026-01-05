/** @jest-environment jsdom */

const fs = require('fs');
const path = require('path');

function evalInWindow(win, filePath) {
  const src = fs.readFileSync(filePath, 'utf8');
  win.eval(src);
}

class StubBid {
  constructor(text, opts = {}) {
    if (opts.isDouble) { this.isDouble = true; this.token = 'X'; }
    else if (opts.isRedouble) { this.isRedouble = true; this.token = 'XX'; }
    else { this.token = text || 'PASS'; }
  }
}

class StubHand {
  constructor(spec) {
    // Simple parser: "S H D C" strings; lengths by characters
    const parts = typeof spec === 'string' ? spec.trim().split(/\s+/) : [];
    const getLen = s => (s && s !== '-' ? s.length : 0);
    this.lengths = { S: getLen(parts[0]), H: getLen(parts[1]), D: getLen(parts[2]), C: getLen(parts[3]) };
    this.hcp = 12; // neutral default; UI guard uses hcp only when on opponents' side
  }
  toString() { return 'TEST HAND'; }
}

// Stub engine allows dynamic recommendation override via window.__testConfig
function installStubSystem() {
  window.SAYCBiddingSystem = class {
    constructor() {
      this.currentAuction = null;
      this.conventions = { config: { competitive: { michaels: { enabled: true, direct_only: true } } } };
    }
    startAuction(ourSeat /*we*/, _vulWe, _vulThey) {
      const self = this;
      this.currentAuction = {
        bids: [], dealer: null, ourSeat: ourSeat,
        reseat(d) { this.dealer = d; },
        add(bid) {
          const order = (window.Auction && window.Auction.TURN_ORDER) || ['N', 'E', 'S', 'W'];
          const base = this.dealer ? order.indexOf(this.dealer) : 0;
          const seat = order[(base + this.bids.length) % 4];
          bid.seat = seat; this.bids.push(bid);
        }
      };
    }
    getBid(/*hand*/) {
      const rec = (window.__testConfig && window.__testConfig.recommendation) || 'PASS';
      return new window.Bid(rec);
    }
    isLegal(bid) { return true; }
  };
}

function buildDOM() {
  document.body.innerHTML = `
    <div id="auctionContent"></div>
    <div id="biddingInterface"></div>
    <div id="explanationsList"></div>
    <div class="auction-grid">
      <div class="auction-position"></div>
      <div class="auction-position"></div>
      <div class="auction-position"></div>
      <div class="auction-position"></div>
      <div id="auctionBids"></div>
    </div>
    <div id="auctionStatus"></div>
    <select id="dealer"><option value="S">S</option><option value="N">N</option></select>
  `;
}

// Helper to set dealer select so app.js syncs internal dealer var
function setDealer(value) {
  const sel = document.getElementById('dealer');
  sel.value = value;
  sel.dispatchEvent(new window.Event('change', { bubbles: true }));
}

describe('Responder raise is not misclassified as Michaels cue-bid', () => {
  test('1D — Pass — [engine recommends 2D as responder] is not blocked to PASS', () => {
    buildDOM();
    window.Auction = { TURN_ORDER: ['N', 'E', 'S', 'W'] };
    window.Bid = StubBid;
    window.Hand = StubHand;

    installStubSystem();

    // Load app and initialize
    evalInWindow(window, path.join(__dirname, '..', 'assets', 'js', 'app.js'));
    window.switchTab = () => { };
    window.initializeSystem();

    // South opens 1D (human)
    expect(typeof window.__setCurrentTurnForTests).toBe('function');
    setDealer('S');
    window.__setCurrentTurnForTests('S');
    expect(typeof window.makeBid).toBe('function');
    window.makeBid('1D');

    // West passes (system)
    window.__setCurrentTurnForTests('W');
    window.__testConfig = { recommendation: 'PASS' };
    expect(typeof window.makeSystemBid).toBe('function');
    window.makeSystemBid();

    // North is responder; engine recommends 2D (a simple raise). UI must NOT block this to PASS.
    window.__setCurrentTurnForTests('N');
    window.__testConfig = { recommendation: '2D' };
    window.makeSystemBid();

    // Verify last bid is 2D, not PASS
    // Assert from data source via test getter to avoid DOM brittleness
    expect(typeof window.__getAuctionHistoryForTests).toBe('function');
    const hist = window.__getAuctionHistoryForTests();
    expect(Array.isArray(hist)).toBe(true);
    const last = hist[hist.length - 1];
    expect(last && last.position).toBe('N');
    expect(last && last.bid && last.bid.token).toBe('2D');

    // Light DOM sanity check (non-normative)
    const bidsEl = document.getElementById('auctionBids');
    expect(bidsEl).toBeTruthy();
    const text = bidsEl.textContent || '';
    // Should render our auction entries; presence of 2D (or ♦ glyph) is the key signal
    expect(text).toMatch(/2(D|♦)/);
  });
});
