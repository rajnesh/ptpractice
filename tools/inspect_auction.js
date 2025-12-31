const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid, Auction } = require('../js/bridge-types');
const { makeHandFromPattern } = require('../tests/test-helpers');

const system = new SAYCBiddingSystem();
const a = new Auction([new Bid(null), new Bid(null), new Bid('1H'), new Bid(null), new Bid('2C'), new Bid(null)], { dealer: 'N', ourSeat: 'S' });
system.currentAuction = a;
const hand = makeHandFromPattern('KQ72', 'QJ972', '82', 'Q2');
// Debug output suppressed in repo; use this file locally for inspection
// console.log('Auction bids:');
// a.bids.forEach((b, i) => console.log(i, b && (b.token || (b.isDouble?'X':(b.isRedouble?'XX':'PASS'))), 'seat=', b.seat));
// console.log('Our seat:', a.ourSeat, 'Dealer:', a.dealer);
// console.log('Get bid:');
const bid = system.getBid(hand);
// console.log('Result:', bid && (bid.token || (bid.isDouble?'X':'')), bid && bid.conventionUsed);
// Direct call to _handleDruryOpenerRebid to inspect return
try {
	const dr = system._handleDruryOpenerRebid(a, hand);
	// console.log('_handleDruryOpenerRebid direct:', dr && (dr.token || (dr.isDouble?'X':'')), dr && dr.conventionUsed);
} catch (e) { /* suppressed in repo */ }
