const { makeHandFromPattern } = require('../tests/test-helpers');
const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Bid, Auction } = require('../js/bridge-types');

const system = new SAYCBiddingSystem();
// System represents North
system.startAuction('N');
// Ensure conventions enabled
system.conventions.config.competitive = system.conventions.config.competitive || {};
system.conventions.config.competitive.reopening_doubles = { enabled: true };

// Build auction: N:1C, E:PASS, S:2C (support), W:X (negative double), back to N
system.currentAuction = new Auction([], { dealer: 'S', ourSeat: 'N' });
// Note: set seats explicitly so bids map correctly
system.currentAuction.add(new Bid('1C', { seat: 'N' }));
system.currentAuction.add(new Bid(null, { seat: 'E' }));
system.currentAuction.add(new Bid('2C', { seat: 'S' }));
system.currentAuction.add(new Bid(null, { seat: 'W', isDouble: true }));

// Create North's hand: 19 HCP, reasonably balanced
const hand = makeHandFromPattern('AKQ2', 'KQ3', 'KJ3', 'AJ2'); // roughly 19 HCP
console.log('hand.hcp=', hand.hcp, 'lengths=', hand.lengths);
const bid = system.getBid(hand);
console.log('RESULT=', bid && (bid.token || (bid.isDouble? 'X':'PASS')), 'convention=', bid && bid.conventionUsed);
