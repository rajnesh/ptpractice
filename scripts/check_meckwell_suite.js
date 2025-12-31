const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid } = require('../js/bridge-types');
const { makeHandFromPattern } = require('../tests/test-helpers');

const system = new SAYCBiddingSystem();
system.conventions.config.notrump_defenses = system.conventions.config.notrump_defenses || {};
system.conventions.config.notrump_defenses.dont = { enabled: false };
system.conventions.config.notrump_defenses.meckwell = { enabled: true };
system.conventions.config.strong_club_defenses = system.conventions.config.strong_club_defenses || {};
system.conventions.config.strong_club_defenses.meckwell = { enabled: true, direct_only: true };

const hands = [
    [makeHandFromPattern('AKQ432', '32', '432', '32'), '2C'],
    [makeHandFromPattern('KQJ2', 'KQJ2', '432', '32'), '2D'],
    [makeHandFromPattern('KQJ32', '32', 'KQJ32', '32'), '2S']
];

for (const [hand, expected] of hands) {
    system.startAuction('N');
    system.currentAuction.add(new Bid('1NT'));
    const bid = system.getBid(hand);
    console.log('hand expected=', expected, ' got=', bid && bid.token, ' conv=', bid && bid.conventionUsed);
}
