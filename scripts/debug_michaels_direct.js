const { makeHandFromPattern } = require('../tests/test-helpers');
const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid, Auction } = require('../js/bridge-types');

const system = new SAYCBiddingSystem();
system.startAuction('N');
system.conventions.config.competitive = system.conventions.config.competitive || {};
system.conventions.config.competitive.michaels = { enabled: true };

system.currentAuction = new Auction([], { dealer: 'S', ourSeat: 'N' });
system.currentAuction.add(new Bid('1C'));

const hand = makeHandFromPattern('KQJ32', 'KQJ32', '32', '32');
console.log('hand:', hand.lengths, 'hcp=', hand.hcp);
const inter = system._handleInterference(system.currentAuction, hand);
console.log('interference result=', inter && (inter.token || (inter.isDouble? 'X':'PASS')) , 'convention=', inter && inter.conventionUsed);
const bid = system.getBid(hand);
console.log('getBid result=', bid && (bid.token || (bid.isDouble? 'X':'PASS')) , 'convention=', bid && bid.conventionUsed);
