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
  // Provide minimal DOM hooks used by app.js
  win.document.body.innerHTML = '<div id="trickArea"></div>';
  evalInWindow(win, path.join(__dirname, '..', 'js', 'app.js'));
}

describe('Discard behavior (unit)', () => {
  test('non-follow discard prefers smallest spot from shortest suit', async () => {
    const win = window; // jsdom global
    loadApp(win);

    // East has no diamonds (lead is diamonds). East holds K,4,3 of hearts.
    win.currentHands = {
      N: new StubHand({}),
      E: new StubHand({ H: ['K', '4', '3'] }),
      S: new StubHand({}),
      W: new StubHand({})
    };

    // Setup playState: lead is diamonds by North so East cannot follow
    // Put the lead card into North's hand and play it so the module-scoped playState is updated
    win.currentHands.N = new StubHand({ D: ['2'] });
    // Enable debug logs inside pickAutoCardFor for easier diagnostics
    win.__DEBUG_DISCARD = true;
    // Ensure the module-scoped play state records the played card
    win.playCardToTrick('N', '2D');

    console.log('DBG pickAutoCardFor exists?', typeof win.pickAutoCardFor);
    console.log('DBG pickAutoCardFor fn:', win.pickAutoCardFor.toString().slice(0, 200));
    console.log('DBG currentHands.E:', JSON.stringify(win.currentHands.E && win.currentHands.E.suitBuckets));
    console.log('DBG playState:', JSON.stringify(win.playState));
    const pick = await win.pickAutoCardFor('E');
    console.log('DBG pick ->', pick);
    expect(pick).toBe('3H');
  });

  test('defender ruff prefers lowest trump (small spot)', async () => {
    const win = window;
    loadApp(win);

    // East has 2 trumps and only one non-trump card (so nonTrumpCount <=1)
    win.currentHands = {
      N: new StubHand({}),
      E: new StubHand({ S: ['K', '4'], H: ['6'] }),
      S: new StubHand({}),
      W: new StubHand({})
    };

    // Lead is diamonds (East void), trump is spades
    win.currentHands.N = new StubHand({ D: ['2'] });
    win.playCardToTrick('N', '2D');
    // Set trump and contract side via small helper: use renderPlayTab to initialize playState fields then set trump
    try { win.renderPlayTab(); } catch (_) { }
    // Update trump and contractSide directly on the module-scoped playState via a small helper function if available
    try { win.eval && win.eval("playState.trump = 'S'; playState.contractSide = 'NS';"); } catch (_) { }

    console.log('DBG pickAutoCardFor exists?', typeof win.pickAutoCardFor);
    console.log('DBG currentHands.E:', JSON.stringify(win.currentHands.E && win.currentHands.E.suitBuckets));
    console.log('DBG playState:', JSON.stringify(win.playState));
    const pick = await win.pickAutoCardFor('E');
    console.log('DBG pick ->', pick);
    expect(pick).toBe('4S');
  });

  test('partner-led signaling: play minimal winning honor to encourage', async () => {
    const win = window;
    loadApp(win);

    // West (partner) led 5H. East has KH,4H,3H and can beat 5H with KH.
    win.currentHands = {
      N: new StubHand({}),
      E: new StubHand({ H: ['K', '4', '3'] }),
      S: new StubHand({}),
      W: new StubHand({})
    };

    // Make West lead 5H by placing it in West's hand and playing it
    win.currentHands.W = new StubHand({ H: ['5'] });
    win.playCardToTrick('W', '5H');

    console.log('DBG pickAutoCardFor exists?', typeof win.pickAutoCardFor);
    console.log('DBG currentHands.E:', JSON.stringify(win.currentHands.E && win.currentHands.E.suitBuckets));
    console.log('DBG playState:', JSON.stringify(win.playState));
    const pick = await win.pickAutoCardFor('E');
    console.log('DBG pick ->', pick);
    expect(pick).toBe('KH');
  });
});
