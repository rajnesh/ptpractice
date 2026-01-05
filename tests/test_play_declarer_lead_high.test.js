/** @jest-environment jsdom */

const fs = require('fs');
const path = require('path');

function evalInWindow(win, filePath) { const src = fs.readFileSync(filePath, 'utf8'); win.eval(src); }
class StubCard { constructor(rank, suit) { this.rank = rank; this.suit = suit; } }
class StubHand { constructor(map) { this.suitBuckets = { S: [], H: [], D: [], C: [] }; if (!map) return;['S', 'H', 'D', 'C'].forEach(s => { const arr = map[s] || []; this.suitBuckets[s] = arr.map(r => new StubCard(r, s)); }); } }
function installCardSVG(win) { win.CardSVG = { render: (code, opts) => { const el = win.document.createElement('div'); el.className = 'card-svg-stub'; return el; } }; }
function loadApp(win) { win.Card = StubCard; win.Hand = StubHand; installCardSVG(win); win.document.body.innerHTML = '<div id="trickArea"></div>'; evalInWindow(win, path.join(__dirname, '..', 'assets', 'js', 'app.js')); }

describe('Repro: declarer leads high to establish winners', () => {
  test('Declarer (N) leads A when combined honors favor establishing', async () => {
    const win = window; loadApp(win);
    if (!win.currentHands) win.currentHands = { N: null, E: null, S: null, W: null };
    // Declarer N has A of diamonds, dummy S has K of diamonds
    win.currentHands.N = new StubHand({ D: ['A'] });
    win.currentHands.S = new StubHand({ D: ['K'] });
    win.currentHands.E = new StubHand({});
    win.currentHands.W = new StubHand({});
    // Set module-scoped playState for declarer/dummy and mark dummy revealed
    try { win.eval && win.eval("playState.declarer='N'; playState.dummy='S'; playState.dummyRevealed=true; playState.contractSide='NS'; playState.declarerPlan={phase:'establish'};"); } catch (_) { }

    console.log('--- START PLAY-LOG DECLARER LEAD CAPTURE ---');
    console.log('DBG currentHands.N:', JSON.stringify(win.currentHands.N && win.currentHands.N.suitBuckets));
    const pick = await win.pickAutoCardFor('N');
    console.log('DBG pick ->', pick);
    console.log('--- END PLAY-LOG DECLARER LEAD CAPTURE ---');

    expect(pick).toBe('AD');
  });
});
