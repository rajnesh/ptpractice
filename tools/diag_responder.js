const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid, Auction } = require('../js/bridge-types');
const { makeHandFromPattern } = require('../tests/test-helpers');

const system = new SAYCBiddingSystem();
// mimic test case 1: opening 1C, dealer N, ourSeat N, add bid without seat
system.startAuction('N');
system.currentAuction = new Auction([], { dealer: 'N', ourSeat: 'N' });
system.currentAuction.add(new Bid('1C'));
const hand = makeHandFromPattern('Q32', 'KQJ2', 'Q2', '32'); // 11 HCP, 4H
// Debug output suppressed in repo; run locally to inspect
// console.log('Auction:', system.currentAuction.bids.map(b => ({tok: b.token, seat: b.seat})), 'dealer=', system.currentAuction.dealer, 'ourSeat=', system.currentAuction.ourSeat);
// console.log('Hand hcp=', hand.hcp, 'lengths=', hand.lengths);
try {
    const bid = system.getBid(hand);
    // console.log('getBid returned:', bid && (bid.token || (bid.isDouble ? 'X' : '')), bid && bid.conventionUsed);
} catch (e) { /* suppressed */ }
try {
    const inter = system._handleInterference(system.currentAuction, hand);
    // console.log('_handleInterference returned:', inter && (inter.token || (inter.isDouble ? 'X' : '')), inter && inter.conventionUsed);
} catch (e) { /* suppressed */ }
try {
    const resp = system._getResponseToSuit(system.currentAuction.bids[0].token, hand);
    // console.log('_getResponseToSuit returned:', resp && (resp.token || (resp.isDouble ? 'X' : '')), resp && resp.conventionUsed);
} catch (e) { /* suppressed */ }

// Also run modified scenario where opening bid includes explicit seat
// console.log('\nNow test with explicit seat on opening (seat W, ourSeat E):');
const sys2 = new SAYCBiddingSystem();
sys2.startAuction('E');
sys2.currentAuction = new Auction([], { dealer: 'W', ourSeat: 'E' });
sys2.currentAuction.add(new Bid('1C', { seat: 'W' }));
const hand2 = makeHandFromPattern('Q32', 'KJ42', '762', '983'); // 6 HCP, 4H
// console.log('Auction2:', sys2.currentAuction.bids.map(b => ({tok: b.token, seat: b.seat})), 'dealer=', sys2.currentAuction.dealer, 'ourSeat=', sys2.currentAuction.ourSeat);
// console.log('Hand2 hcp=', hand2.hcp, 'lengths=', hand2.lengths);
try {
    const bid2 = sys2.getBid(hand2);
    // console.log('getBid2 returned:', bid2 && (bid2.token || (bid2.isDouble ? 'X' : '')), bid2 && bid2.conventionUsed);
} catch (e) { /* suppressed */ }
