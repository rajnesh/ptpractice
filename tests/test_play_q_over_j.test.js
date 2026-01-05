/** @jest-environment jsdom */

const fs = require('fs');
const path = require('path');

function evalInWindow(win, filePath) {
  const src = fs.readFileSync(filePath, 'utf8');
  win.eval(src);
}

class StubCard {
  constructor(rank, suit) { this.rank = rank; this.suit = suit; }
}

class StubHand {
  constructor(map) {
    this.suitBuckets = { S: [], H: [], D: [], C: [] };
    if (!map) return;
    ['S', 'H', 'D', 'C'].forEach(s => {
      const arr = map[s] || [];
      this.suitBuckets[s] = arr.map(r => new StubCard(r, s));
    });
  }
}

function installCardSVG(win) {
  win.CardSVG = { render: (code, opts) => { const el = win.document.createElement('div'); el.className = 'card-svg-stub'; return el; } };
}

function loadApp(win) {
  win.Card = StubCard;
  win.Hand = StubHand;
  installCardSVG(win);
  win.document.body.innerHTML = '<div id="trickArea"></div>';
  evalInWindow(win, path.join(__dirname, '..', 'assets', 'js', 'app.js'));
}

describe('Repro: partner-led J then East should not overtake with Q', () => {
  test('East ducks Q over partner J (plays small heart)', async () => {
    const win = window; // jsdom global
    loadApp(win);

    // Setup hands: West led J♥; East holds Q,9 of hearts and K of clubs
    // Mutate module-scoped `window.currentHands` rather than replacing the object
    if (!win.currentHands) win.currentHands = { N: null, E: null, S: null, W: null };
    win.currentHands.N = new StubHand({});
    win.currentHands.E = new StubHand({ H: ['Q', '9'], C: ['K'] });
    win.currentHands.S = new StubHand({ H: ['A'] });
    // Make West lead JH by placing it in West's hand and playing it
    win.currentHands.W = new StubHand({ H: ['J'] });
    // Enable debug logs inside pickAutoCardFor for capture
    win.__DEBUG_DISCARD = true;
    // Play the lead
    win.playCardToTrick('W', 'JH');
    // Ensure contractSide is set so defender/declarer logic treats East as a defender
    try { win.eval && win.eval("playState.contractSide = 'NS';"); } catch (_) { }

    console.log('--- START PLAY-LOG CAPTURE ---');
    console.log('DBG currentHands.E:', JSON.stringify(win.currentHands.E && win.currentHands.E.suitBuckets));
    console.log('DBG playState:', JSON.stringify(win.playState));
    const pick = await win.pickAutoCardFor('E');
    console.log('DBG pick ->', pick);
    console.log('--- END PLAY-LOG CAPTURE ---');

    // Expect East to duck (play the small heart '9H'), not overtake with 'QH'
    expect(pick).toBe('9H');
  });
});
