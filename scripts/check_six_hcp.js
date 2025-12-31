const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid } = require('../js/bridge-types');
const { makeHandFromPattern } = require('../tests/test-helpers');

const system = new SAYCBiddingSystem();
system.startAuction('N');
system.currentAuction.add(new Bid('1C'));

const hands = [
    [makeHandFromPattern('KQ432', '432', '432', '32'), true],
    [makeHandFromPattern('KJ432', '432', '432', '32'), false],
    [makeHandFromPattern('KQ32', '432', '4332', '32'), false]
];

let idx=0;
for (const [hand, expected] of hands) {
    idx++;
    const bid = system.getBid(hand);
    const isContract = !!(bid && bid.token && /^[1-7](C|D|H|S|NT)$/.test(bid.token));
    console.log(`case ${idx}: hcp=${hand.hcp}, dist=${hand.distributionPoints}, lengths=${JSON.stringify(hand.lengths)}, expected=${expected}, got=${isContract}, bid=${bid && (bid.token || (bid.isDouble? 'X':'PASS'))}`);
}
