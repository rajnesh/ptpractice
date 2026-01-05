#!/usr/bin/env node
/*
 * Generate a pool of practice deals tagged with all applicable conventions.
 * Produces assets/data/practice_deals.json (5000 unique deals by default).
 */
const fs = require('fs');
const path = require('path');
const Module = require('module');
const { Hand } = require('../assets/js/bridge-types.js');

const TARGET_DEALS = 5000;
const MAX_ATTEMPTS = 120000; // upper bound to avoid runaway loops
const OUTPUT_PATH = path.join(__dirname, '..', 'assets', 'data', 'practice_deals.json');
const PRACTICE_CONVENTIONS = [
    'Strong 2 Clubs',
    'Weak 2 Bids',
    'Stayman',
    'Jacoby Transfers',
    'Texas Transfers',
    'Minor Suit Transfers',
    'Gerber',
    'Regular Blackwood',
    'RKC Blackwood 1430',
    'Control Showing Cue Bids',
    'DONT',
    'Meckwell',
    'Jacoby 2NT',
    'Splinter Bids',
    'Bergen Raises',
    'Lebensohl',
    'Unusual NT',
    'Michaels',
    'Responsive Doubles',
    'Negative Doubles',
    'Takeout Doubles',
    'Support Doubles',
    'Reopening Doubles',
    'Cue Bid Raises',
    'Drury'
];

function handToString(hand) {
    const order = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
    const suits = ['S', 'H', 'D', 'C'];
    return suits.map(suit => {
        const cards = (hand?.suitBuckets?.[suit] || []).slice().sort((a, b) => order.indexOf(a.rank) - order.indexOf(b.rank));
        const ranks = cards.map(c => c.rank).join('');
        return ranks || '-';
    }).join(' ');
}

function loadPracticeCore() {
    const appPath = path.normalize(path.join(__dirname, '..', 'assets', 'js', 'app.js'));
    const raw = fs.readFileSync(appPath, 'utf8');
    const stripped = raw.replace(/^[\t ]*import[^;]+;\s*/gm, '');
    const startIdx = stripped.indexOf('function createDeck()');
    const endIdx = stripped.indexOf('function addPracticeIndicator');
    if (startIdx === -1 || endIdx === -1) {
        throw new Error('Unable to locate practice generation slice in app.js');
    }
    const slice = stripped.slice(startIdx, endIdx);
    const stubs = `
    const bridgeTypes = require('./bridge-types.js');
    globalThis.window = globalThis.window || {};
    globalThis.document = globalThis.document || { querySelectorAll: () => [], getElementById: () => null };
    globalThis.navigator = globalThis.navigator || {};
    globalThis.window.Hand = bridgeTypes.Hand;
    globalThis.window.Bid = bridgeTypes.Bid;
    globalThis.window.Card = bridgeTypes.Card;
    globalThis.window.Auction = bridgeTypes.Auction;
    let system = { conventions: { config: { general: { balanced_shapes: { include_5422: false } } } }, isLegal: () => true };
    const pageLog = () => {};
    let currentHands = { N: null, E: null, S: null, W: null };
  `;
    const wrapper = `${stubs}\n${slice}\nmodule.exports = { generateBasicRandomHands, validateDealForConvention, currentHands };`;
    const m = new Module(appPath, module.parent);
    m.filename = appPath;
    m.paths = Module._nodeModulePaths(path.dirname(appPath));
    m._compile(wrapper, appPath);
    return m.exports;
}

function ensureDir(filepath) {
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function main() {
    const { generateBasicRandomHands, validateDealForConvention, currentHands } = loadPracticeCore();
    const deals = [];
    const seen = new Set();

    for (let attempt = 0; attempt < MAX_ATTEMPTS && deals.length < TARGET_DEALS; attempt += 1) {
        generateBasicRandomHands();
        const conventions = PRACTICE_CONVENTIONS.filter(conv => {
            try { return validateDealForConvention(currentHands, conv); } catch (_) { return false; }
        });
        if (!conventions.length) continue;

        const key = ['N', 'E', 'S', 'W'].map(pos => handToString(currentHands[pos])).join('|');
        if (seen.has(key)) continue;
        seen.add(key);

        deals.push({
            hands: {
                N: handToString(currentHands.N),
                E: handToString(currentHands.E),
                S: handToString(currentHands.S),
                W: handToString(currentHands.W)
            },
            conventions,
            hcp: {
                N: currentHands.N?.hcp || 0,
                E: currentHands.E?.hcp || 0,
                S: currentHands.S?.hcp || 0,
                W: currentHands.W?.hcp || 0
            }
        });

        if (deals.length % 500 === 0) {
            console.log(`Collected ${deals.length} deals after ${attempt + 1} attempts...`);
        }
    }

    if (deals.length < TARGET_DEALS) {
        console.warn(`Warning: only generated ${deals.length} unique deals after ${MAX_ATTEMPTS} attempts`);
    }

    ensureDir(OUTPUT_PATH);
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(deals, null, 2), 'utf8');
    console.log(`Wrote ${deals.length} deals to ${OUTPUT_PATH}`);
}

if (require.main === module) {
    main();
}
