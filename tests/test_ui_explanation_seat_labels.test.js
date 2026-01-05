/** @jest-environment jsdom */

const fs = require('fs');
const path = require('path');

function evalInWindow(win, filePath) {
    const src = fs.readFileSync(filePath, 'utf8');
    win.eval(src);
}

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

class StubHand {
    constructor(spec) {
        const parts = typeof spec === 'string' ? spec.trim().split(/\s+/) : [];
        const getLen = s => (s && s !== '-' ? s.length : 0);
        this.lengths = { S: getLen(parts[0]), H: getLen(parts[1]), D: getLen(parts[2]), C: getLen(parts[3]) };
        this.hcp = 10;
    }
    toString() { return 'TEST HAND'; }
}

function installStubSystem({ recommendation = '1C' } = {}) {
    window.SAYCBiddingSystem = class {
        constructor() {
            const cfg = window.__testConfig || {};
            this._rec = cfg.recommendation || recommendation;
            this.currentAuction = null;
            this.conventions = { config: {} };
        }
        startAuction(ourSeat /*we*/, _vulWe, _vulThey) {
            this.currentAuction = {
                bids: [],
                dealer: null,
                ourSeat,
                reseat(d) { this.dealer = d; },
                add(bid) {
                    const order = (window.Auction && window.Auction.TURN_ORDER) || ['N', 'E', 'S', 'W'];
                    const base = this.dealer ? order.indexOf(this.dealer) : 0;
                    const seat = order[(base + this.bids.length) % 4];
                    bid.seat = seat;
                    this.bids.push(bid);
                }
            };
        }
        getBid(/*hand*/) { return new window.Bid(this._rec); }
        isLegal() { return true; }
    };
}

function buildDOM() {
    document.body.innerHTML = `
    <div id="auctionContent"></div>
    <div id="biddingInterface"></div>
    <div id="explanationsList"></div>
    <div class="auction-grid">
      <div class="auction-position"></div>
      <div class="auction-position"></div>
      <div class="auction-position"></div>
      <div class="auction-position"></div>
      <div id="auctionBids"></div>
    </div>
    <div id="auctionStatus"></div>
    <select id="dealer"><option value="S">S</option><option value="N">N</option></select>
  `;
}

describe('Seat-aware explanation labels', () => {
    test('System bids do not render as "Your bid" when South passes', async () => {
        buildDOM();
        window.Auction = { TURN_ORDER: ['N', 'E', 'S', 'W'] };
        window.Bid = StubBid;
        window.Hand = StubHand;

        installStubSystem({ recommendation: '1C' });

        evalInWindow(window, path.join(__dirname, '..', 'assets', 'js', 'app.js'));
        window.switchTab = () => { };
        window.initializeSystem();

        expect(typeof window.__setCurrentTurnForTests).toBe('function');

        // South passes, then West (system) bids
        window.__setCurrentTurnForTests('S');
        window.makeBid('PASS');

        window.__setCurrentTurnForTests('W');
        window.__testConfig = { recommendation: '1C' };
        await window.makeSystemBid();

        const explText = document.getElementById('explanationsList').textContent;
        expect(explText).not.toContain('Opponent bid');
        expect(explText).not.toContain('Your bid');
        expect(explText).not.toContain('Partner bid');
        expect(explText).toContain('1C');

        const explSpans = document.querySelectorAll('#explanationsList .explanation-text');
        expect(explSpans.length).toBe(0);
    });
});
