// Minimal repro for reopening-double 3C - PASS - PASS
const { SAYCBiddingSystem } = require('../js/combined-bidding-system');
const { Auction, Hand } = require('../js/bridge-types');

function makeAuction() {
    const a = new Auction([], { ourSeat: 'N', dealer: 'N' });
    // first bid 3C by North (dealer/anchor is N)
    a.add({ token: '3C', seat: 'N' });
    a.add({ token: 'PASS', seat: 'E' });
    a.add({ token: 'PASS', seat: 'S' });
    return a;
}

function main() {
    const system = new SAYCBiddingSystem();
    const auction = makeAuction();
    system.currentAuction = auction;
    // Create a hand: hcp ~11, short in clubs, two other suits 3+
    // Example: S: 432, H: KQ3, D: AJ3, C: 72 => HCP = K(3)+Q(2)+A(4)+J(1)=10? adjust
    const hand = new Hand('432 KQ3 AJ3 72');
    console.log('hand.hcp=', hand.hcp, 'lengths=', hand.lengths);
    const bid = system.getBid(hand);
    console.log('RESULT:', bid && (bid.isDouble ? 'X' : bid.token));
}

main();
