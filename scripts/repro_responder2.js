const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Hand, Bid, Auction } = require('../js/bridge-types');

function setupAuction(system, sequence, dealer = 'S', ourSeat = 'N') {
  system.startAuction(ourSeat);
  system.currentAuction.reseat(dealer);
  for (const tok of sequence) {
    system.currentAuction.add(new Bid(tok));
  }
}

const system = new SAYCBiddingSystem();
setupAuction(system, ['1S','PASS'], 'S', 'N');
const hand = new Hand('- KQxxx xxxxx Axx');
console.log('Hand lengths:', hand.lengths, 'hcp', hand.hcp, 'dp', hand.distributionPoints);
const bid = system.getBid(hand);
console.log('Returned bid:', bid && bid.token, 'conventionUsed=', bid && bid.conventionUsed);
console.log('Explanation:', system.getExplanationFor(bid, system.currentAuction));
