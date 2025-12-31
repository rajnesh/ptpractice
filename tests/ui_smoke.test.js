/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

describe('UI smoke test: initializeSystem boot', () => {
  beforeEach(() => {
    // Minimal DOM required by app.js during initializeSystem/displayHands
    document.body.innerHTML = `
      <div id="gameLayout" style="display:none"></div>
      <div id="northHand"></div>
      <div id="eastHand"></div>
      <div id="southHand"></div>
      <div id="westHand"></div>
      <div id="northHandContent"></div>
      <div id="eastHandContent"></div>
      <div id="southHandContent"></div>
      <div id="westHandContent"></div>
      <div class="hands-grid"></div>
      <button id="toggleHandsBtn"></button>
      <div id="auctionSetup" style="display:none"></div>
      <div id="auctionStatus" class="alert"></div>
      <div id="startAuctionBtn"></div>
      <div id="conventionCheckboxes"></div>
      <div id="practiceConventionCheckboxes"></div>
      <div id="generalSettings"></div>
      <div class="auction-grid">
        <div class="auction-position"></div>
        <div class="auction-position"></div>
        <div class="auction-position"></div>
        <div class="auction-position"></div>
      </div>
      <div id="auctionBids"></div>
      <select id="dealer"><option value="S">S</option><option value="W">W</option></select>
      <select id="vulnerability"><option value="none">none</option></select>
      <div id="dealerBadge"></div>
      <div id="vulnBadge"></div>
      <div id="handValidationError"></div>
    `;

    // Engine stubs
    global.window.SAYCBiddingSystem = class {
      constructor() {
        this.conventions = {
          config: {},
          getConventionSetting: () => '1430',
          isEnabled: () => true
        };
        this.currentAuction = null;
      }
      startAuction() { this.currentAuction = { bids: [], reseat: () => {} }; }
      getBid() { return { token: 'PASS', conventionUsed: 'Pass' }; }
    };

    global.window.Hand = class {
      constructor(handStr) {
        // handStr like "AKQ JT9 - 5432" but our generator passes compact strings
        const parts = (handStr || '').split(/\s+/);
        const toArr = (s) => (s === '-' ? '' : s || '').trim();
        const S = toArr(parts[0] || '');
        const H = toArr(parts[1] || '');
        const D = toArr(parts[2] || '');
        const C = toArr(parts[3] || '');
        this.lengths = { S: S.length, H: H.length, D: D.length, C: C.length };
        this.suitBuckets = {
          S: Array.from(S).map(r => ({ rank: r })),
          H: Array.from(H).map(r => ({ rank: r })),
          D: Array.from(D).map(r => ({ rank: r })),
          C: Array.from(C).map(r => ({ rank: r }))
        };
        const val = (r) => r==='A'?4:r==='K'?3:r==='Q'?2:r==='J'?1:0;
        this.hcp = Array.from(S+H+D+C).reduce((a,r)=>a+val(r),0);
        this.toString = () => handStr || '';
      }
    };

    global.window.Bid = class {
      constructor(tok) { this.token = tok || 'PASS'; }
    };
  });

  test('initializeSystem exists and renders a hand', () => {
    const appPath = path.resolve(__dirname, '../js/app.js');
    const code = fs.readFileSync(appPath, 'utf8');

    // Run app.js code in a VM context bound to window
    const context = vm.createContext({
      window: global.window,
      self: global.window,
      global: global.window,
      document: global.document,
      console,
      setTimeout,
      clearTimeout
    });
    vm.runInContext(code, context, { filename: 'app.js' });

    expect(typeof context.initializeSystem).toBe('function');

    // Call initialize directly to avoid relying on DOMContentLoaded timers
    context.initializeSystem();

    // After init, south hand content should have been rendered
    const south = document.getElementById('southHandContent');
    expect(south).toBeTruthy();
    expect((south.textContent || '').length).toBeGreaterThan(0);

    // Auction setup should be visible
    const auctionSetup = document.getElementById('auctionSetup');
    expect(auctionSetup && auctionSetup.style.display).toBe('block');
  });
});
