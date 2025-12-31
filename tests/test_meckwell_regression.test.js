const { makeHandFromPattern } = require('./test-helpers');
const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid } = require('../js/bridge-types');

describe('Meckwell regression', () => {
    test('single-suited 6+ over 1NT prefers 2C (Meckwell) when DONT disabled', () => {
        const system = new SAYCBiddingSystem();
        // Configure conventions: Meckwell enabled, DONT disabled
        system.conventions.config.notrump_defenses = system.conventions.config.notrump_defenses || {};
        system.conventions.config.notrump_defenses.dont = { enabled: false };
        system.conventions.config.notrump_defenses.meckwell = { enabled: true };

        system.startAuction('N');
        system.currentAuction.add(new Bid('1NT'));

        const hand = makeHandFromPattern('AKQ432', '32', '432', '32');
        const bid = system.getBid(hand);
        expect(bid && bid.token).toBe('2C');
    });
});
