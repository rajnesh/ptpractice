/**
 * @jest-environment jsdom
 */
const fs = require('fs');
const path = require('path');
const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid } = require('../js/bridge-types');
const { makeHandFromPattern } = require('./test-helpers');

function evalInWindow(win, filePath) {
  const src = fs.readFileSync(filePath, 'utf8');
  win.eval(src);
}

function setupAuction(system, tokens, ourSeat = 'E', dealer = 'N') {
  system.startAuction(ourSeat);
  if (typeof system.currentAuction.reseat === 'function') system.currentAuction.reseat(dealer);
  tokens.forEach(t => system.currentAuction.add(new Bid(t)));
}

describe('One-level suit jump shifts: overcalls (weak) and responder (strong)', () => {
  let system;
  beforeEach(() => { system = new SAYCBiddingSystem(); });

  test('Weak jump overcall over 1D: 2H with 6+ hearts and <10 HCP', () => {
    // Opp opens 1D; it is our turn to overcall
    setupAuction(system, ['1D']);
    const hand = makeHandFromPattern('32', 'KQT987', '2', 'T32'); // 8 HCP, 6+ hearts
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2H');
    const exp = system.getExplanationFor(bid, system.currentAuction);
    expect((exp || '').toLowerCase()).toContain('jump overcall');
    expect((exp || '').toLowerCase()).toContain('weak');
  });

  test('Do not choose weak jump overcall when 11+ HCP', () => {
    setupAuction(system, ['1D']);
    const hand = makeHandFromPattern('A2', 'KQT987', 'Q2', '32'); // 11 HCP, 6+ hearts
    const bid = system.getBid(hand);
    // Engine should not select the weak jump overcall path
    expect(bid && bid.token).not.toBe('2H');
  });

  test('Responder jump shift over 1C: 2S with 5+ spades and 13+ HCP', () => {
    // Partner opens 1C; we respond (no interference)
    // Seat partner as dealer so the opening 1C is by our partner (W when ourSeat=E)
    setupAuction(system, ['1C'], 'E', 'W');
    const hand = makeHandFromPattern('KQJT9', 'AK2', 'Q2', '32'); // >=13 HCP, 5+ spades
    const bid = system.getBid(hand);
    expect(bid && bid.token).toBe('2S');
    const exp = system.getExplanationFor(bid, system.currentAuction);
    expect((exp || '').toLowerCase()).toContain('responder jump shift');
    expect((exp || '').toLowerCase()).toContain('strong');
  });
});

// UI footnote presence
describe('General Settings footnote for jump shifts', () => {
  test('Footnote renders in general settings UI', () => {
    // jsdom UI bootstrap
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
      <div id="auctionSetup"></div>
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

    // Load app UI; initializeSystem will create general settings
    evalInWindow(window, path.join(__dirname, '..', 'js', 'app.js'));
    if (typeof window.initializeSystem === 'function') {
      window.initializeSystem();
    }

    const gs = document.getElementById('generalSettings');
    expect(gs).toBeTruthy();
    const txt = (gs.textContent || '').toLowerCase();
    expect(txt).toContain('jump shift');
    expect(txt).toContain('overcalls are weak');
    expect(txt).toContain('responder jump shifts are strong');
  });
});
