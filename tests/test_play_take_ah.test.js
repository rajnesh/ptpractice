/** @jest-environment jsdom */

const fs = require('fs');
const path = require('path');

function evalInWindow(win, filePath) {
  const src = fs.readFileSync(filePath, 'utf8');
  win.eval(src);
}

class StubCard { constructor(rank, suit) { this.rank = rank; this.suit = suit; } }
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

function installCardSVG(win) { win.CardSVG = { render: (code, opts) => { const el = win.document.createElement('div'); el.className = 'card-svg-stub'; return el; } }; }
function loadApp(win) { win.Card = StubCard; win.Hand = StubHand; installCardSVG(win); win.document.body.innerHTML = '<div id="trickArea"></div>'; evalInWindow(win, path.join(__dirname, '..', 'js', 'app.js')); }

describe('Repro: partner-led small heart then East should take A♥', () => {
  test('East overtakes with A♥ when partner led small heart', async () => {
    const win = window; loadApp(win);
    if (!win.currentHands) win.currentHands = { N: null, E: null, S: null, W: null };
    win.currentHands.N = new StubHand({});
    // East has A and 4 of hearts
    win.currentHands.E = new StubHand({ H: ['A', '4'] });
    win.currentHands.S = new StubHand({});
    // West leads 5H
    win.currentHands.W = new StubHand({ H: ['5'] });
    win.__DEBUG_DISCARD = true;
    win.playCardToTrick('W', '5H');
    try { win.eval && win.eval("playState.contractSide = 'NS';"); } catch (_) { }

    console.log('--- START PLAY-LOG AH CAPTURE ---');
    console.log('DBG currentHands.E:', JSON.stringify(win.currentHands.E && win.currentHands.E.suitBuckets));
    const pick = await win.pickAutoCardFor('E');
    console.log('DBG pick ->', pick);
    console.log('--- END PLAY-LOG AH CAPTURE ---');

    expect(pick).toBe('AH');
  });
});
