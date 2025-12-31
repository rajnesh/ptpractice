const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid } = require('../js/bridge-types');
const { makeHandFromPattern } = require('../tests/test-helpers');

const system = new SAYCBiddingSystem();
system.startAuction('N');
const auction = system.currentAuction;
auction.add(new Bid('1C'));

const hands = [
    makeHandFromPattern('KQ432', '432', '432', '32'),
    makeHandFromPattern('KJ432', '432', '432', '32'),
    makeHandFromPattern('KQ32', '432', '4332', '32')
];

let i=0;
for (const h of hands) {
    i++;
    console.log('\n---- CASE', i, 'hcp=', h.hcp, 'lengths=', h.lengths);
    try {
        const twoSuit = system._checkTwoSuitedConvention(auction, h);
        console.log(' _checkTwoSuitedConvention ->', twoSuit && (twoSuit.token || (twoSuit.isDouble?'X':'PASS')), (twoSuit && twoSuit.conventionUsed) || '');
    } catch (e) { console.log(' _checkTwoSuitedConvention err', e); }
    try {
        const support = system._handleSupportDouble(auction, h);
        console.log(' _handleSupportDouble ->', support && (support.token || (support.isDouble?'X':'PASS')), (support && support.conventionUsed) || '');
    } catch (e) { console.log(' _handleSupportDouble err', e); }
    try {
        const inter = system._handleInterference(auction, h);
        console.log(' _handleInterference ->', inter && (inter.token || (inter.isDouble?'X':'PASS')), (inter && inter.conventionUsed) || '');
    } catch (e) { console.log(' _handleInterference err', e); }
    try {
        const resp = system._getResponseToSuit('1C', h);
        console.log(' _getResponseToSuit ->', resp && (resp.token || (resp.isDouble?'X':'PASS')), (resp && resp.conventionUsed) || '');
    } catch (e) { console.log(' _getResponseToSuit err', e); }
    try {
        const bid = system.getBid(h);
        console.log(' FINAL getBid ->', bid && (bid.token || (bid.isDouble?'X':'PASS')), (bid && bid.conventionUsed) || '');
    } catch (e) { console.log(' getBid err', e); }
}
