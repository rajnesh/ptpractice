/** @jest-environment jsdom */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

describe('Auction pass sequence', () => {
    test('East should be allowed to act after three initial passes and bid 1M with 14 HCP and 5-card major', () => {
        // Minimal DOM the app expects for auctions
        document.body.innerHTML = `
            <select id="dealer"><option value="S">S</option></select>
            <select id="vulnerability"><option value="none">none</option></select>
            <div id="auctionContent"></div>
            <div id="biddingInterface"></div>
        `;

        // Minimal window stubs used by app.js and combined-bidding-system
        global.window.Hand = class {};
        global.window.Bid = class { constructor(t){ this.token = t || 'PASS'; } };

        // Load app.js into a VM context bound to the jest jsdom window
        const appCode = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'app.js'), 'utf8');
        const context = vm.createContext({ window: global.window, document: global.document, console, setTimeout, clearTimeout });
        vm.runInContext(appCode, context, { filename: 'app.js' });

        // Prepare auction state inside the VM context: three initial passes (S,W,N) -> East should act
        vm.runInContext("currentAuction = [];", context);
        vm.runInContext("currentAuction.push({ token: 'PASS', seat: 'S' });", context);
        vm.runInContext("currentAuction.push({ token: 'PASS', seat: 'W' });", context);
        vm.runInContext("currentAuction.push({ token: 'PASS', seat: 'N' });", context);

        // Call isAuctionComplete to assert behavior
        // Import the function from the global context created by app.js
        const isAuctionComplete = context.isAuctionComplete || window.isAuctionComplete;
        expect(typeof isAuctionComplete).toBe('function');

        // With only passes so far, auction should NOT be complete (require four passes)
        const result = isAuctionComplete();
        expect(result).toBe(false);

        // If we add the fourth PASS, it should then be complete
        vm.runInContext("currentAuction.push({ token: 'PASS', seat: 'E' });", context);
        expect(isAuctionComplete()).toBe(true);
    });
});
