const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid } = require('../js/bridge-types');
const { makeHandFromPattern } = require('../tests/test-helpers');

const system = new SAYCBiddingSystem();
system.conventions.config.notrump_defenses = system.conventions.config.notrump_defenses || {};
system.conventions.config.notrump_defenses.dont = { enabled: false };
system.conventions.config.notrump_defenses.meckwell = { enabled: true };
system.conventions.config.strong_club_defenses = system.conventions.config.strong_club_defenses || {};
system.conventions.config.strong_club_defenses.meckwell = { enabled: true, direct_only: true };

system.startAuction('N');
const b = new Bid('1NT');
system.currentAuction.add(b);

const hand = makeHandFromPattern('AKQ432','32','432','32');
console.log('CALL _handleInterference ->');
const inter = system._handleInterference(system.currentAuction, hand);
console.log('INTERFERENCE RETURNED:', inter && (inter.token || (inter.isDouble?'X':'PASS')), inter && inter.conventionUsed);

console.log('\nCALL _handle1NTResponse ->');
const resp = system._handle1NTResponse(hand);
console.log('1NT RESPONSE RETURNED:', resp && (resp.token || (resp.isDouble?'X':'PASS')), resp && resp.conventionUsed);

console.log('\nCALL getBid ->');
const out = system.getBid(hand);
console.log('getBid RETURNED:', out && (out.token || (out.isDouble?'X':'PASS')), out && out.conventionUsed);
