/** @jest-environment jsdom */

const fs = require('fs');
const path = require('path');

function evalInWindow(win, filePath) {
    const src = fs.readFileSync(filePath, 'utf8');
    win.eval(src);
}

class StubBid {
    constructor(text, opts = {}) {
        if (opts.isDouble) { this.isDouble = true; this.token = 'X'; }
        else if (opts.isRedouble) { this.isRedouble = true; this.token = 'XX'; }
        else { this.token = text || 'PASS'; }
    }
}

class StubHand {
    constructor(spec) {
        const parts = typeof spec === 'string' ? spec.trim().split(/\s+/) : [];
        const getLen = s => (s && s !== '-' ? s.length : 0);
        this.lengths = { S: getLen(parts[0]), H: getLen(parts[1]), D: getLen(parts[2]), C: getLen(parts[3]) };
        this.hcp = 12;
    }
    toString() { return 'TEST HAND'; }
}

// Stub engine: recommendation comes from window.__testConfig.recommendation (default PASS)
function installStubSystem() {
    window.SAYCBiddingSystem = class {
        constructor() {
            this.currentAuction = null;
            this.conventions = { config: { competitive: { michaels: { enabled: true, direct_only: true } } } };
        }
        startAuction(ourSeat /*we*/, _vulWe, _vulThey) {
            this.currentAuction = {
                bids: [],
                dealer: null,
                ourSeat: ourSeat,
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
        getBid(/*hand*/) {
            const rec = (window.__testConfig && window.__testConfig.recommendation) || 'PASS';
            return new window.Bid(rec);
        }
        isLegal(_bid) { return true; }
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

function setDealer(value) {
    const sel = document.getElementById('dealer');
    sel.value = value;
    sel.dispatchEvent(new window.Event('change', { bubbles: true }));
}

describe('UI guard: partner cue-bid is forcing one round', () => {
    test('After partner cues opponents\' hearts, West is forced to continue (not PASS)', () => {
        buildDOM();
        window.Auction = { TURN_ORDER: ['N', 'E', 'S', 'W'] };
        window.Bid = StubBid;
        window.Hand = StubHand;

        installStubSystem();

        evalInWindow(window, path.join(__dirname, '..', 'js', 'app.js'));
        window.switchTab = () => { };
        window.initializeSystem();

        setDealer('S');

        // Auction: S PASS, W 1C, N 2H (opponents), E 3C, S PASS, W 3NT, N PASS, E 4H (cue of opponents' suit)
        expect(typeof window.__setCurrentTurnForTests).toBe('function');

        window.__setCurrentTurnForTests('S');
        window.makeBid('PASS');

        window.__setCurrentTurnForTests('W');
        window.__testConfig = { recommendation: '1C' };
        window.makeSystemBid();

        window.__setCurrentTurnForTests('N');
        window.__testConfig = { recommendation: '2H' };
        window.makeSystemBid();

        window.__setCurrentTurnForTests('E');
        window.__testConfig = { recommendation: '3C' };
        window.makeSystemBid();

        window.__setCurrentTurnForTests('S');
        window.makeBid('PASS');

        window.__setCurrentTurnForTests('W');
        window.__testConfig = { recommendation: '3NT' };
        window.makeSystemBid();

        window.__setCurrentTurnForTests('N');
        window.__testConfig = { recommendation: 'PASS' };
        window.makeSystemBid();

        window.__setCurrentTurnForTests('E');
        window.__testConfig = { recommendation: '4H' };
        window.makeSystemBid();

        // West would PASS per engine, but UI guard should force a game-level contract (here 4NT)
        window.__setCurrentTurnForTests('W');
        window.__testConfig = { recommendation: 'PASS' };
        window.makeSystemBid();

        expect(typeof window.__getAuctionHistoryForTests).toBe('function');
        const hist = window.__getAuctionHistoryForTests();
        const last = hist[hist.length - 1];
        expect(last && last.bid && last.bid.token).toMatch(/^[4-7]/);

        // Quick DOM sanity: last bid text should include 4NT and not PASS
        const bidsEl = document.getElementById('auctionBids');
        const text = bidsEl ? bidsEl.textContent || '' : '';
        // Ensure we advanced past a pass into a game-level contract
        expect(text).not.toMatch(/PASS$/);
    });
});
