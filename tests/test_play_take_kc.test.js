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
  evalInWindow(win, path.join(__dirname, '..', 'js', 'app.js'));
}

describe('Repro: West leads small club, East should take K♣', () => {
  test('East overtakes with K♣ when partner led small club', async () => {
    const win = window;
    loadApp(win);

    // Prepare module-scoped currentHands in-place so app.js sees the same object
    if (!win.currentHands) win.currentHands = { N: null, E: null, S: null, W: null };
    win.currentHands.N = new StubHand({});
    // East holds K♣ and some other cards
    win.currentHands.E = new StubHand({ C: ['K'], H: ['9'] });
    win.currentHands.S = new StubHand({});
    // West leads a small club
    win.currentHands.W = new StubHand({ C: ['2'] });

    // Enable debug logs inside pickAutoCardFor for capture
    win.__DEBUG_DISCARD = true;
    // Play the lead
    win.playCardToTrick('W', '2C');
    // Ensure contractSide is set so East is treated as defender
    try { win.eval && win.eval("playState.contractSide = 'NS';"); } catch (_) { }

    console.log('--- START PLAY-LOG KC CAPTURE ---');
    console.log('DBG currentHands.E:', JSON.stringify(win.currentHands.E && win.currentHands.E.suitBuckets));
    console.log('DBG playState (module):', typeof win.playState === 'undefined' ? 'undefined' : JSON.stringify(win.playState));
    const pick = await win.pickAutoCardFor('E');
    console.log('DBG pick ->', pick);
    console.log('--- END PLAY-LOG KC CAPTURE ---');

    expect(pick).toBe('KC');
  });
});
