const { Hand, Bid, Auction } = require('../js/bridge-types');
const { SAYCBiddingSystem } = require('../js/combined-bidding-system');

function makeTestHand(spadesLen, heartsLen, diamondsLen, clubsLen, hcp) {
  const ranks = ['A','K','Q','J','T','9','8','7','6','5','4','3','2'];
  function suitCards(len, suit) {
    const arr = [];
    for (let i=0;i<len;i++) arr.push({rank:ranks[i%ranks.length], suit});
    return arr;
  }
  const weights = {A:4,K:3,Q:2,J:1};
  let s = suitCards(spadesLen,'S'); let h=suitCards(heartsLen,'H'); let d=suitCards(diamondsLen,'D'); let c=suitCards(clubsLen,'C');
  function setHcp(target){
    // crude: assign honors in S/H first
    let acc=0;
    function place(arr){
      for (let i=0;i<arr.length && acc<target;i++){
        if (!weights[arr[i].rank]) { arr[i].rank = 'A'; acc+=4; }
      }
    }
    place(s); place(h); place(d); place(c);
  }
  setHcp(hcp);
  const hand = new Hand({S:s,H:h,D:d,C:c});
  return hand;
}

const system = new SAYCBiddingSystem('tests/test_conventions.json');
system.startAuction('N');

const a = new Auction();
a.add(new Bid('1D'));
a.add(new Bid('1S'));
a.add(new Bid('1H'));
system.currentAuction = a;
const hand = makeTestHand(2,3,5,3,13);
// REMOVED: debug_support_double tool cleaned up. Recreate from VCS history if needed.
