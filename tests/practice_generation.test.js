/** @jest-environment jsdom */

const fs = require('fs');
const path = require('path');
const Module = require('module');
const documentStubElement = {
    addEventListener: () => { },
    removeEventListener: () => { },
    querySelector: () => null,
    querySelectorAll: () => [],
    appendChild: () => { },
    classList: { add: () => { }, remove: () => { } },
    style: {},
    remove: () => { },
    setAttribute: () => { },
    getBoundingClientRect: () => ({})
};

const documentStub = {
    addEventListener: () => { },
    removeEventListener: () => { },
    querySelector: () => documentStubElement,
    querySelectorAll: () => [],
    getElementById: () => documentStubElement,
    createElement: () => documentStubElement
};

global.window = {
    document: documentStub,
    addEventListener: () => { },
    removeEventListener: () => { },
    getComputedStyle: () => ({})
};
global.document = documentStub;
global.navigator = {};
global.HTMLElement = function () { };
global.Node = function () { };
globalThis.window = global.window;
globalThis.document = global.document;

const bridgeTypes = require('../assets/js/bridge-types.js');
Object.assign(global.window, bridgeTypes);
globalThis.Hand = bridgeTypes.Hand;

// Manually load a patched copy of app.js with ESM imports stripped (mirrors jest-setup-strip-app.js)
function loadPatchedApp() {
    const appPath = path.normalize(path.join(__dirname, '..', 'assets', 'js', 'app.js'));
    const original = fs.readFileSync(appPath, 'utf8');
    const stripped = original.replace(/^[\t ]*import[^;]+;\s*/gm, '');

    const startIdx = stripped.indexOf('function createDeck()');
    const endIdx = stripped.indexOf('function addPracticeIndicator');
    const slice = stripped.slice(startIdx, endIdx);
    if (!global.window || !global.window.Hand) {
        throw new Error('window.Hand not available for practice generation tests');
    }
    const stubs = `
    globalThis.loadBiddingModel = globalThis.loadBiddingModel || (async () => ({}));
    globalThis.getModelBid = globalThis.getModelBid || (async () => 'PASS');
    var window = globalThis.window || global;
    var document = globalThis.document || {};
    let system = { conventions: { config: { general: { balanced_shapes: { include_5422: false } } } }, isLegal: () => true };
    const bridgeTypes = require('./bridge-types.js');
    window.Card = window.Card || bridgeTypes.Card;
    window.Hand = window.Hand || bridgeTypes.Hand;
    window.Bid = window.Bid || bridgeTypes.Bid;
    window.Auction = window.Auction || bridgeTypes.Auction;
    window.VulnerabilityState = window.VulnerabilityState || bridgeTypes.VulnerabilityState;
    globalThis.Card = window.Card;
    globalThis.Hand = window.Hand;
    globalThis.Bid = window.Bid;
    globalThis.Auction = window.Auction;
    globalThis.VulnerabilityState = window.VulnerabilityState;
    const pageLog = () => {};
    let currentHands = { N: null, E: null, S: null, W: null };
  `;
    const moduleWrapper = `${stubs}\n${slice}\nmodule.exports = { generateConventionTargetedHand, validateDealForConvention, currentHands };`;

    const m = new Module(appPath, module.parent);
    m.filename = appPath;
    m.paths = Module._nodeModulePaths(path.dirname(appPath));
    m._compile(moduleWrapper, appPath);
    return m.exports;
}

const {
    generateConventionTargetedHand,
    validateDealForConvention,
    currentHands
} = loadPatchedApp();

// Increase timeout slightly because some conventions (e.g., 22+ HCP Strong 2C) are rare
jest.setTimeout(30000);

typeof Hand; // ensure Hand is loaded to satisfy app.js Hand references

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

describe('Practice Focus hand generation', () => {
    PRACTICE_CONVENTIONS.forEach(conventionName => {
        test(`generates a valid practice hand for ${conventionName}`, () => {
            let success = false;
            const maxRuns = 3; // retry the generator a few times for rare shapes

            for (let i = 0; i < maxRuns && !success; i += 1) {
                const generated = generateConventionTargetedHand(conventionName);
                if (!generated) continue;
                success = validateDealForConvention(currentHands, conventionName);
            }

            expect(success).toBe(true);
        });
    });
});
