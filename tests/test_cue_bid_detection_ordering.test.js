/** @jest-environment jsdom */

const fs = require('fs');
const path = require('path');

function evalApp(win) {
    const src = fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'app.js'), 'utf8');
    win.eval(`(function(){${src}\nwindow.__cbTestHooks = { isCueBidOfOpponentsSuit };}).call(window);`);
}

describe('isCueBidOfOpponentsSuit only considers prior opponent bids', () => {
    beforeEach(() => {
        // fresh jsdom per test; functions will be attached to window
    });

    test('does not treat a bid as cue when opponents show the suit later', () => {
        evalApp(window);
        const { isCueBidOfOpponentsSuit } = window.__cbTestHooks;
        expect(typeof isCueBidOfOpponentsSuit).toBe('function');

        const history = [
            { position: 'S', bid: { token: '1H' } },
            { position: 'W', bid: { token: '2D' } },
            { position: 'N', bid: { token: '3D' } }, // opponent shows diamonds after 2D
        ];

        const result = isCueBidOfOpponentsSuit('W', history[1].bid, history);
        expect(result).toBe(false);
    });

    test('still detects a true cue over opponents\' suit bid earlier', () => {
        evalApp(window);
        const { isCueBidOfOpponentsSuit } = window.__cbTestHooks;

        const history = [
            { position: 'S', bid: { token: '1H' } },
            { position: 'W', bid: { token: '2H' } }, // over opponents' heart opening
        ];

        const result = isCueBidOfOpponentsSuit('W', history[1].bid, history);
        expect(result).toBe(true);
    });
});
