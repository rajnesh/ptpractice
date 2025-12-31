const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid } = require('../js/bridge-types');
const { makeHandFromPattern } = require('../tests/test-helpers');

const system = new SAYCBiddingSystem();
system.startAuction('N');
const auction = system.currentAuction;
auction.add(new Bid('1NT'));

const hands = [
    makeHandFromPattern('AKQ432','2','2','2'),
    makeHandFromPattern('KQ32','AKQ32','Q32','32')
];

hands.forEach((h, idx) => {
    const inter = system._handleInterference(auction, h);
    console.log(`case ${idx+1}: hcp=${h.hcp}, lengths=${JSON.stringify(h.lengths)}, inter=${inter && (inter.token || (inter.isDouble?'X':'PASS'))}, convention=${inter && inter.conventionUsed}`);
});
