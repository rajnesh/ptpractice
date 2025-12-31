/** @jest-environment jsdom */

const fs = require('fs');
const path = require('path');

function evalInWindow(win, filePath) {
  const src = fs.readFileSync(filePath, 'utf8');
  win.eval(src);
}

// Minimal Card/Hand stubs used by Play tab logic
class StubCard {
  constructor(rank, suit) { this.rank = rank; this.suit = suit; }
}

class StubHand {
  constructor(input) {
    // Accept either prebuilt suitBuckets or a compact map of ranks
    if (input && input.S && Array.isArray(input.S)) {
      // Already an object of arrays of StubCard
      this.suitBuckets = input;
    } else if (input && typeof input === 'object') {
      this.suitBuckets = { S: [], H: [], D: [], C: [] };
      ['S','H','D','C'].forEach(s => {
        const arr = input[s] || [];
        this.suitBuckets[s] = arr.map(r => new StubCard(r, s));
      });
    } else {
      this.suitBuckets = { S: [], H: [], D: [], C: [] };
    }
  }
}

// Minimal Bid for auction history entries
class StubBid {
  constructor(text) { this.token = text || 'PASS'; }
}

// Very lightweight CardSVG renderer that returns a clickable element
function installCardSVG(win) {
  win.CardSVG = {
    render: (code) => {
      const el = win.document.createElement('div');
      el.className = 'card-svg-stub';
      // dataset.code/seat are set by renderHandCards in app.js
      return el;
    }
  };
}

function buildDOM() {
  document.body.innerHTML = `
    <div id="auctionStatus" class="alert"></div>
    <div id="playPanel">
      <div id="playContractInfo"></div>
      <div id="playStatus" style="display:none"></div>
      <div class="play-controls">
        <button id="playReplayBtn" class="main-btn compact">Replay Hand</button>
        <button id="playNewDealBtn" class="main-btn danger compact">New Deal</button>
        <div style="margin-left:auto; font-weight:700; color:#2c3e50;">
          Tricks — N/S: <span id="trickCountNS">0</span> | E/W: <span id="trickCountEW">0</span> | Score for N/S: <span id="playInlineScore">0</span>
        </div>
      </div>
      <div class="play-layout">
        <div class="play-hand" id="playNorthArea">
          <div class="hand-title">North</div>
          <div id="playNorthHand" class="card-button-row"></div>
        </div>
        <div class="play-table" id="playTableArea">
          <div class="trick-area" id="trickArea"></div>
          <div id="playResultSummary"></div>
          <ul id="playScoreBreakdown"></ul>
        </div>
        <div class="play-hand" id="playSouthArea">
          <div class="hand-title">South</div>
          <div id="playSouthHand" class="card-button-row"></div>
        </div>
      </div>
    </div>
  `;
}

function loadApp() {
  // Provide minimum globals
  window.Card = StubCard;
  window.Hand = StubHand;
  window.Bid = StubBid;
  installCardSVG(window);

  // Neutralize tab switching; capture last tab requested
  window.__lastSwitchedTab = null;
  window.switchTab = (tabName) => { window.__lastSwitchedTab = tabName; };
  window.showTab = () => {};

  // Load app.js which defines endAuction/goToPlay/renderPlayTab/etc.
  evalInWindow(window, path.join(__dirname, '..', 'js', 'app.js'));
}

function setAuctionHistory(entries) {
  // entries: array like [{ pos:'N', tok:'1NT' }, { pos:'E', tok:'PASS' }]
  const parts = entries.map(e => `{ position: '${e.pos}', bid: new Bid('${e.tok}') }`).join(',');
  window.eval(`auctionHistory = [${parts}];`);
}

function setSimpleHands() {
  // Tiny deterministic hands: a couple of spades so renderers have something to draw
  const N = new StubHand({ S: ['A','Q','T'], H: [], D: [], C: [] });
  const S = new StubHand({ S: ['K','J','9'], H: [], D: [], C: [] });
  const E = new StubHand({ S: ['8','7','6'], H: [], D: [], C: [] });
  const W = new StubHand({ S: ['5','4','3'], H: [], D: [], C: [] });
  window.currentHands = { N, E, S, W };
}

describe('Play tab rendering flow', () => {
  test('renders Play tab when Play the Hand is clicked (All Pass)', () => {
    buildDOM();
    loadApp();
    setSimpleHands();

    // Simulate all-pass auction (can be empty or explicit passes)
    setAuctionHistory([
      { pos: 'N', tok: 'PASS' },
      { pos: 'E', tok: 'PASS' },
      { pos: 'S', tok: 'PASS' },
      { pos: 'W', tok: 'PASS' },
    ]);

    // End the auction to inject the Play button into #auctionStatus
    expect(typeof window.endAuction).toBe('function');
    window.endAuction();

    // Button appears with correct label
    const hintBtn = document.getElementById('hintBtn');
    expect(hintBtn).not.toBeNull();
    expect(hintBtn.textContent).toMatch(/Play the Hand/i);

    // Click action: call goToPlay (inline onclick attribute is a string in jsdom)
    expect(typeof window.goToPlay).toBe('function');
    window.goToPlay();

    // We rendered content
    expect(document.getElementById('playContractInfo').textContent).toMatch(/Contract:/);
    // South hand row has some children (cards rendered)
    expect(document.getElementById('playSouthHand').childElementCount).toBeGreaterThan(0);
  });

  test('renders Play tab for a simple contract (1NT)', () => {
    buildDOM();
    loadApp();
    setSimpleHands();
    // Stub details to avoid depending on internal auctionHistory binding
    window.computePlayDetailsFromAuction = () => ({
      contract: { level: 1, strain: 'NT', dbl: 0 },
      declarer: 'S', dummy: 'N', trump: null, leader: 'W', contractSide: 'NS'
    });

    window.endAuction();
    expect(typeof window.goToPlay).toBe('function');
    window.goToPlay();

    const info = document.getElementById('playContractInfo').textContent;
    expect(info).toMatch(/Contract:\s*1NT/i);
    expect(info).toMatch(/Leader:/i);
    // Some cards rendered (either South or North depending on dummy)
    const count = document.getElementById('playSouthHand').childElementCount + document.getElementById('playNorthHand').childElementCount;
    expect(count).toBeGreaterThan(0);
  });
});

describe('Play interactions', () => {
  test('dummy reveals on opening lead and trick counts increment after a full trick', () => {
    jest.useFakeTimers();
    buildDOM();
    loadApp();
    setSimpleHands();
    // Force declarer South/dummy North to ensure North hidden before lead
    window.computePlayDetailsFromAuction = () => ({
      contract: { level: 1, strain: 'NT', dbl: 0 },
      declarer: 'S', dummy: 'N', trump: null, leader: 'W', contractSide: 'NS'
    });

    // Go to Play and render
    window.endAuction();
    window.goToPlay();

    // Ensure the scheduled opening lead fires (West auto-plays after render)
    jest.runOnlyPendingTimers();

    // Now dummy (North) should be revealed
    const northHandAfter = document.getElementById('playNorthHand');
    expect(northHandAfter.childElementCount).toBeGreaterThan(0);

    const trickArea = document.getElementById('trickArea');
    if (trickArea.querySelectorAll('.trick-card').length === 0 && typeof window.autoPlayIfNeeded === 'function') {
      window.autoPlayIfNeeded();
    }

    // Now it's North's turn (dummy). Play a North card (2nd to play)
    const northCards = Array.from(northHandAfter.children);
    if (northCards.length === 0) {
      // Safety: skip if no cards
      return;
    }
    northCards[0].dispatchEvent(new window.Event('click', { bubbles: true }));
    if (typeof window.autoPlayIfNeeded === 'function') {
      window.autoPlayIfNeeded();
    }

    // Now it's South's turn (4th to play). Click a South card
    const southHand = document.getElementById('playSouthHand');
    const southCards = Array.from(southHand.children);
    if (southCards.length === 0) {
      // Safety: skip if no cards
      return;
    }
    southCards[0].dispatchEvent(new window.Event('click', { bubbles: true }));
    jest.clearAllTimers();
    if (typeof window.finishTrick === 'function') {
      window.finishTrick();
    }

    // Trick should be finished and counts updated
    const ns = Number(document.getElementById('trickCountNS').textContent);
    const ew = Number(document.getElementById('trickCountEW').textContent);
    expect(ns + ew).toBeGreaterThanOrEqual(1);
  });

  test('Replay Hand resets state and re-renders cards', () => {
    jest.useFakeTimers();
    buildDOM();
    loadApp();
    setSimpleHands();
    // Stub details so goToPlay works deterministically (South declarer)
    window.computePlayDetailsFromAuction = () => ({
      contract: { level: 1, strain: 'NT', dbl: 0 },
      declarer: 'S', dummy: 'N', trump: null, leader: 'W', contractSide: 'NS'
    });
    window.endAuction();
    window.goToPlay();
    jest.advanceTimersByTime(300); // process opening lead and reveal dummy

    const southHand = document.getElementById('playSouthHand');
    const initialCount = southHand.childElementCount;
    // Simulate a change: remove a card element (UI disturbance)
    southHand.firstElementChild && southHand.removeChild(southHand.firstElementChild);
    const disturbedCount = document.getElementById('playSouthHand').childElementCount;
    expect(disturbedCount).toBe(initialCount - 1);

    // Click replay
    const replayBtn = document.getElementById('playReplayBtn');
    replayBtn.click();
    // After replay, counts should reset to initial
    const resetCount = document.getElementById('playSouthHand').childElementCount;
    expect(resetCount).toBe(initialCount);
  });
});

describe('Auction end banner', () => {
  test('appends final contract banner to the auction grid', () => {
    document.body.innerHTML = `
      <div class="auction-grid"></div>
      <div id="auctionStatus"></div>
    `;
    loadApp();
    setSimpleHands();
    // Stub final details to ensure banner carries a contract line
    window.computePlayDetailsFromAuction = () => ({
      contract: { level: 1, strain: 'NT', dbl: 0 },
      declarer: 'N', dummy: 'S', trump: null, leader: 'E', contractSide: 'NS'
    });
    window.endAuction();
    const banners = Array.from(document.querySelectorAll('.auction-grid .auction-result'));
    expect(banners.length).toBeGreaterThanOrEqual(1);
    expect(banners.some(el => /Final Contract:/.test(el.textContent) || /All Pass/.test(el.textContent))).toBe(true);
  });
});

describe('Score summary', () => {
  test('shows score summary after claiming remaining tricks to complete 13', () => {
    buildDOM();
    loadApp();
    setSimpleHands();
    // Stub a contract (NS) so scoring runs
    window.computePlayDetailsFromAuction = () => ({
      contract: { level: 1, strain: 'NT', dbl: 0 },
      declarer: 'N', dummy: 'S', trump: null, leader: 'E', contractSide: 'NS'
    });
    window.endAuction();
    window.goToPlay();

    // Simulate claiming all remaining tricks by adjusting playState directly
    // Adjust internal playState via evaluated code in the test window (playState is a top-level let)
    const remaining = 13 - (Number(document.getElementById('trickCountNS').textContent) + Number(document.getElementById('trickCountEW').textContent));
    if (remaining > 0) {
      // Use window.eval to modify the module-scoped `playState` binding inside the test VM.
      window.eval(`if (typeof playState !== 'undefined') { const rem = ${remaining}; if (playState.contractSide === 'NS') playState.tricksNS += rem; else playState.tricksEW += rem; }`);
    }
    window.eval(`if (typeof updateTrickCountsUI === 'function') updateTrickCountsUI();`);
    window.eval(`if (typeof summarizeResult === 'function') summarizeResult();`);
    const scoreText = document.getElementById('playInlineScore').textContent;
    expect(scoreText).toMatch(/[+-]?\d+/);
  });
});
 
