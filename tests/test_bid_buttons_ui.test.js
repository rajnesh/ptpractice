/** @jest-environment jsdom */

const fs = require('fs');
const path = require('path');

// Utility to inject a script's source into the window context like a classic <script> tag
function evalInWindow(win, filePath) {
  const src = fs.readFileSync(filePath, 'utf8');
  // Execute in the window's context so top-level function declarations are attached to window
  win.eval(src);
}

// Minimal stub Bid that app.js will construct
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

// Fake system with configurable legality
class FakeSystem {
  constructor(map = {}) {
    this.map = map; // e.g., { '1H': true, '1S': false, X: true, XX: false, PASS: true }
  }
  isLegal(bid) {
    const token = bid?.isDouble ? 'X' : bid?.isRedouble ? 'XX' : (bid?.token || 'PASS');
    // Default to false if not specified, PASS always allowed in app.js path
    if (token === 'PASS') return true;
    return !!this.map[token];
  }
}

function buildBasicDOM() {
  // Create minimal containers referenced by app.js functions
  document.body.innerHTML = `
    <div id="auctionContent" style="display:none"></div>
    <div id="biddingInterface" style="display:none"></div>
    <select id="dealer"><option value="S">S</option><option value="N">N</option></select>
    <div id="bidPad">
      <button class="bid-button" id="passBtn" onclick="makeBid('PASS')">PASS</button>
      <button class="bid-button" id="oneH" onclick="makeBid('1H')">1H</button>
      <button class="bid-button" id="oneS" onclick="makeBid('1S')">1S</button>
      <button class="bid-button" id="doubleBtn" onclick="makeBid('X')">X</button>
      <button class="bid-button" id="redoubleBtn" onclick="makeBid('XX')">XX</button>
    </div>
  `;
}

// Helper to change dealer select and fire change event so app.js syncs its internal dealer variable
function setDealer(value) {
  const sel = document.getElementById('dealer');
  sel.value = value;
  sel.dispatchEvent(new window.Event('change', { bubbles: true }));
}

// Load engine (to populate window.* if needed) BEFORE app.js, and then load app.js into window
function loadAppWithStubs(legalityMap) {
  // Provide stubs required by app.js
  window.Bid = StubBid;
  // Create a stub class mounted at window for initializeSystem to instantiate
  window.SAYCBiddingSystem = class { constructor() { this._impl = new FakeSystem(legalityMap); } isLegal(bid) { return this._impl.isLegal(bid); } startAuction() {} };

  // Evaluate app.js so globals like initializeSystem/startAuction/updateBidButtons are attached to window
  evalInWindow(window, path.join(__dirname, '..', 'assets', 'js', 'app.js'));

  // Neutralize tab switching helpers that expect full DOM
  window.switchTab = () => {};
  window.showTab = () => {};

  // Run minimal init to create internal `system` and wire selectors
  window.initializeSystem();
}

describe('Bid button enablement and visual state (updateBidButtons)', () => {
  test('enables only legal bids and marks them with legal-bid when it is South\'s turn', () => {
    buildBasicDOM();

    // Map: 1H legal, 1S illegal, X legal, XX illegal; PASS always legal per app.js
    loadAppWithStubs({ '1H': true, '1S': false, 'X': true, 'XX': false });

  // Force it to be South's turn using the test hook
  expect(typeof window.__setCurrentTurnForTests).toBe('function');
  window.__setCurrentTurnForTests('S');

    // Run the update explicitly (processTurn may have done it already)
    expect(typeof window.updateBidButtons).toBe('function');
    window.updateBidButtons();

    const oneH = document.getElementById('oneH');
    const oneS = document.getElementById('oneS');
    const xBtn = document.getElementById('doubleBtn');
    const xxBtn = document.getElementById('redoubleBtn');

    // 1H is legal
    expect(oneH.disabled).toBe(false);
    expect(oneH.classList.contains('legal-bid')).toBe(true);

    // 1S is illegal
    expect(oneS.disabled).toBe(true);
    expect(oneS.classList.contains('legal-bid')).toBe(false);

    // X is legal
    expect(xBtn.disabled).toBe(false);
    expect(xBtn.classList.contains('legal-bid')).toBe(true);

    // XX is illegal
    expect(xxBtn.disabled).toBe(true);
    expect(xxBtn.classList.contains('legal-bid')).toBe(false);

    // PASS is always legal/enabled and marked
    const passBtn = document.getElementById('passBtn');
    expect(passBtn.disabled).toBe(false);
    expect(passBtn.classList.contains('legal-bid')).toBe(true);
  });

  test('disables all bid buttons when it is not South\'s turn', () => {
    buildBasicDOM();

    // Make everything legal in the engine, but UI should still disable when not our turn
    loadAppWithStubs({ '1H': true, '1S': true, 'X': true, 'XX': true });

  // Force it to be NOT South's turn
  expect(typeof window.__setCurrentTurnForTests).toBe('function');
  window.__setCurrentTurnForTests('N');

    // Directly update buttons
    window.updateBidButtons();

    // All bid buttons should be disabled regardless of engine legality
    document.querySelectorAll('.bid-button').forEach(btn => {
      expect(btn.disabled).toBe(true);
    });
  });
});
