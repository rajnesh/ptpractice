/**
 * @jest-environment jsdom
 */
const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid } = require('../js/bridge-types');
const fs = require('fs');
const path = require('path');

// Minimal DOM for hint UI
function bootstrapDom() {
  document.body.innerHTML = `
    <div id="loadingIndicator" style="display:none;"></div>
    <div id="conventionCheckboxes"></div>
    <div id="generalSettings"></div>
    <div id="practiceConventionCheckboxes"></div>
    <div id="gameLayout"></div>
    <div id="northHandContent"></div>
    <div id="eastHandContent"></div>
    <div id="southHandContent"></div>
    <div id="westHandContent"></div>
    <div id="auctionStatus">
      <button id="hintBtn"></button>
    </div>
    <select id="dealer"><option value="S" selected>S</option></select>
    <select id="vulnerability"><option value="none" selected>None</option></select>
  `;
}

describe('Hint chip shows full explanation text', () => {
  beforeEach(() => {
    // Fresh DOM each test - but DON'T reset modules as it breaks global function registration
    bootstrapDom();
  });

  test('Opening 1NT hint shows 15–17 explanation rather than "Standard bid"', () => {
    // Load app.js if not already loaded to register global functions
    if (typeof global.window.getRecommendedBid !== 'function') {
      const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
      (global.window || global).eval(src);
    }

    // Build state: South to open, balanced 16 HCP hand
    // Expose globals from app.js
    const w = global.window || global;

    // Mock currentHands.S as balanced 16 HCP via simple buckets
    w.currentHands = w.currentHands || {};
    // Hand string: KQ2=5, QJ2=3, KJ2=4, Q32=2 => 14; add a K somewhere to reach 17 or use A for 18
    // Adjusting to 16 HCP: KQ2=5, QJ2=3, KJ2=4, J32=1 => 13; try KQ2 QJ2 KJ2 KJ2 => 5+3+4+4=16
    const { Hand } = require('../js/bridge-types');
    w.currentHands.S = new Hand('KQ2 QJ2 KJ2 KJ2');

    // Prepare auction state BEFORE calling initializeSystem to avoid random hand generation
    w.currentAuction = [];
    w.dealer = 'S';
    w.vulnerability = { ns: false, ew: false };
    w.currentTurn = 'S';
    w.auctionActive = false; // Opening bid, auction not started yet

    // Ensure system exists - this may generate random hands but we override South
    if (typeof w.initializeSystem === 'function') {
      w.initializeSystem();
      // Re-override South's hand after initialization
      w.currentHands.S = new Hand('KQ2 QJ2 KJ2 KJ2');
      w.currentAuction = [];
      w.currentTurn = 'S';
      w.auctionActive = false;
    }

    // Ensure system is initialized and has the correct hand
    if (!w.system || !w.system.currentAuction) {
      const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
      w.system = new SAYCBiddingSystem();
      // Start the auction so system.currentAuction exists
      w.system.startAuction('S', false, false);
      if (w.system.currentAuction && typeof w.system.currentAuction.reseat === 'function') {
        w.system.currentAuction.reseat('S');
      }
    }

    // Click Hint
    let hintBtn = document.getElementById('hintBtn');
    // app.js may have cleared auctionStatus.innerHTML, removing our bootstrap button; recreate if missing
    if (!hintBtn) {
      hintBtn = document.createElement('button');
      hintBtn.id = 'hintBtn';
      document.getElementById('auctionStatus').appendChild(hintBtn);
    }

    // Mock alert to capture any errors
    const alerts = [];
    w.alert = (msg) => { alerts.push(msg); console.log('TEST ALERT:', msg); };

    // Prefer direct listener over setAttribute for jsdom reliability
    hintBtn.addEventListener('click', () => {
      console.log('TEST: Hint button clicked, currentTurn=', w.currentTurn, 'currentHands.S=', !!w.currentHands.S);
      console.log('TEST: system=', !!w.system, 'system.currentAuction=', !!w.system?.currentAuction);
      console.log('TEST: getRecommendedBid function exists=', typeof w.getRecommendedBid);
      if (typeof w.getRecommendedBid === 'function') {
        try {
          const result = w.getRecommendedBid();
          console.log('TEST: getRecommendedBid returned=', result);
          const testChip = document.getElementById('inlineHint');
          console.log('TEST: inlineHint found=', !!testChip, 'content=', testChip?.textContent);
        } catch (e) {
          console.log('TEST: getRecommendedBid error:', e.message, e.stack);
        }
      } else {
        console.log('TEST: getRecommendedBid is not a function!');
      }
    });
    hintBtn.click();

    console.log('TEST: After click, alerts=', alerts);
    console.log('TEST: inlineHint element=', document.getElementById('inlineHint'));

    // Inspect inline hint chip content
    const chip = document.getElementById('inlineHint');
    expect(chip).toBeTruthy();
    const text = chip ? chip.textContent.toLowerCase() : '';
    expect(text).toContain('hint: 1nt');
    expect(text).toContain('15'); // "15–17 hcp, balanced" presence heuristic
    expect(text).not.toContain('standard bid');
  });
});
