const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid } = require('../js/bridge-types');

const system = new SAYCBiddingSystem();
system.conventions.config.notrump_defenses = system.conventions.config.notrump_defenses || {};
system.conventions.config.notrump_defenses.dont = { enabled: false };
system.conventions.config.notrump_defenses.meckwell = { enabled: true };
system.conventions.config.strong_club_defenses = system.conventions.config.strong_club_defenses || {};
system.conventions.config.strong_club_defenses.meckwell = { enabled: true, direct_only: true };

system.startAuction('N');
const b = new Bid('1NT');
system.currentAuction.add(b);
console.log('ourSeat=', system.ourSeat, 'auction.dealer=', system.currentAuction.dealer, 'firstBidSeat=', b.seat, 'lastSide=', system.currentAuction.lastSide());

const hand1 = require('../tests/test-helpers').makeHandFromPattern('AKQ432','32','432','32');
const out = system.getBid(hand1);
console.log('bid=', out && (out.token || (out.isDouble ? 'X':'PASS')), 'convention=', out && out.conventionUsed);
