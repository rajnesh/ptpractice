/** @jest-environment jsdom */

const fs = require('fs');
const path = require('path');

// Utility to eval a file into the window global scope (like a script tag)
function evalInWindow(win, filePath) {
  const src = fs.readFileSync(filePath, 'utf8');
  win.eval(src);
}

// Minimal Bid/Hand stubs used by app.js and our system stub
class StubBid {
  constructor(text, opts = {}) {
    if (opts.isDouble) {
      this.isDouble = true;
      this.token = 'X';
    } else if (opts.isRedouble) {
      this.isRedouble = true;
      this.token = 'XX';
    } else {
      this.token = text || 'PASS';
    }
  }
}

class StubHand {
  constructor(spec) {
    const parts = typeof spec === 'string' ? spec.trim().split(/\s+/) : [];
    const getLen = s => (s && s !== '-' ? s.length : 0);
    this.lengths = { S: getLen(parts[0]), H: getLen(parts[1]), D: getLen(parts[2]), C: getLen(parts[3]) };
    this.hcp = 10; // neutral default
  }
  toString() { return 'TEST HAND'; }
}

// Stub SAYCBiddingSystem that feeds a specific recommendation and legality map
function installStubSystem({ recommendation, legalityMap }) {
  window.SAYCBiddingSystem = class {
    constructor() {
      // Allow tests to override via global config if present
      const cfg = window.__testConfig || {};
      this._rec = recommendation || cfg.recommendation || '1C';
      this._legality = legalityMap || cfg.legalityMap || {};
      this.currentAuction = null;
      this.conventions = { config: {} };
    }
    startAuction(ourSeat /*we*/, _vulWe, _vulThey) {
      const self = this;
      this.currentAuction = {
        bids: [],
        dealer: null,
        ourSeat: ourSeat,
        reseat(d) { this.dealer = d; },
        add(bid) {
          const order = (window.Auction && window.Auction.TURN_ORDER) || ['N','E','S','W'];
          const base = this.dealer ? order.indexOf(this.dealer) : 0;
          const seat = order[(base + this.bids.length) % 4];
          bid.seat = seat;
          this.bids.push(bid);
        }
      };
    }
    getBid(/*hand*/) { return new window.Bid(this._rec); }
    isLegal(bid) {
      const token = bid?.isDouble ? 'X' : bid?.isRedouble ? 'XX' : (bid?.token || 'PASS');
      if (token === 'PASS') return true;
      return !!this._legality[token];
    }
  };
}

function buildPreviewDOM() {
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

describe('Preview legality filtering (system.isLegal) during system bid', () => {
  test('illegal engine recommendation is filtered to PASS and not rendered', () => {
    // Build DOM and install stubs
    buildPreviewDOM();
    window.Auction = { TURN_ORDER: ['N','E','S','W'] };
    window.Bid = StubBid;
    window.Hand = StubHand;

    // Install a stub system that recommends an illegal 1C
    installStubSystem({ recommendation: '1C', legalityMap: { '1C': false } });

    // Load app.js into the window context and initialize minimal state
    evalInWindow(window, path.join(__dirname, '..', 'js', 'app.js'));

    // Prevent unrelated UI flows from failing in tests
    window.switchTab = () => {};

    // Initialize to create the system instance and random hands
    window.initializeSystem();

    // Make it system's turn (e.g., North)
    expect(typeof window.__setCurrentTurnForTests).toBe('function');
    window.__setCurrentTurnForTests('N');

    // Execute the system bid (uses isLegal guard to filter)
    expect(typeof window.makeSystemBid).toBe('function');
    window.makeSystemBid();

    // Assert that the rendered auction does not show the illegal '1C', but shows PASS
    const auctionBids = document.getElementById('auctionBids');
    expect(auctionBids).toBeTruthy();
    const html = auctionBids.innerHTML;
    expect(html).toMatch(/PASS/);
    expect(html).not.toMatch(/>1C</);

    // Explanations list should have an entry for PASS (no token '1C')
    const expl = document.getElementById('explanationsList').textContent;
    expect(expl).toContain('PASS');
    expect(expl).not.toContain('1C');
  });
});
