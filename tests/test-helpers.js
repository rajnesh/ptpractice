/**
 * Test helper functions for bridge bidding tests.
 */

// Node.js requires for testing
if (typeof require !== 'undefined') {
    global.Card = require('../assets/js/bridge-types.js').Card;
    global.Hand = require('../assets/js/bridge-types.js').Hand;
    global.Bid = require('../assets/js/bridge-types.js').Bid;
    global.Auction = require('../assets/js/bridge-types.js').Auction;
    global.ConventionCard = require('../assets/js/convention-manager.js').ConventionCard;
    const combinedSystem = require('../assets/js/combined-bidding-system.js');
    global.BiddingSystem = combinedSystem.BiddingSystem;
    global.SAYCBiddingSystem = combinedSystem.SAYCBiddingSystem;
}

/**
 * Create a Hand from a mapping of suits to arrays of ranks.
 * Pads with '2's to reach 13 cards.
 */
function makeHandFromRanks(ranksBySuit) {
    const SUITS = ['C', 'D', 'H', 'S'];
    const buckets = {};
    let total = 0;

    // Initialize all suits
    for (const suit of SUITS) {
        buckets[suit] = [];
    }

    // Add specified cards
    for (const [suit, ranks] of Object.entries(ranksBySuit)) {
        for (const rank of ranks) {
            buckets[suit].push(new Card(rank, suit));
        }
        total += ranks.length;
    }

    // Pad with 2s of clubs if needed
    while (total < 13) {
        buckets['C'].push(new Card('2', 'C'));
        total++;
    }

    return new Hand(buckets);
}

/**
 * Create a hand from string patterns like 'AKQ32' for each suit.
 * Order is: Spades, Hearts, Diamonds, Clubs.
 */
function makeHandFromPattern(spades, hearts, diamonds, clubs) {
    const suits = { S: spades, H: hearts, D: diamonds, C: clubs };
    const buckets = { C: [], D: [], H: [], S: [] };

    for (const [suit, pattern] of Object.entries(suits)) {
        for (const rank of pattern) {
            buckets[suit].push(new Card(rank, suit));
        }
    }

    return new Hand(buckets);
}

/**
 * Create a test hand with specified suit lengths and HCP.
 */
function makeTestHand(spades, hearts, diamonds, clubs, hcp = 10) {
    // Start with all 2s
    const hand = {
        S: Array(spades).fill('2'),
        H: Array(hearts).fill('2'),
        D: Array(diamonds).fill('2'),
        C: Array(clubs).fill('2')
    };

    // Add high cards to approximate the requested HCP.
    // Previous implementation capped at ~16 HCP; this distributes honors round-robin without overwriting.
    const suits = ['S', 'H', 'D', 'C'];
    const honorSteps = [
        { rank: 'A', pts: 4 },
        { rank: 'K', pts: 3 },
        { rank: 'Q', pts: 2 },
        { rank: 'J', pts: 1 }
    ];

    let remaining = Math.max(0, Math.floor(hcp));
    // Track next slot to fill in each suit
    const nextIdx = { S: 0, H: 0, D: 0, C: 0 };
    let suitPtr = 0;

    // Soft cap to avoid infinite loops if HCP request exceeds available slots*4 (max 4+3+2+1 per slot realistically stacks)
    const maxIterations = 200;
    let iter = 0;
    while (remaining > 0 && iter < maxIterations) {
        iter++;
        const s = suits[suitPtr];
        suitPtr = (suitPtr + 1) % suits.length;

        // If this suit has no cards or we've filled all its slots, skip
        if (hand[s].length === 0 || nextIdx[s] >= hand[s].length) continue;

        // Place the highest honor we can fit for the remaining budget at the next available slot
        let placed = false;
        for (const step of honorSteps) {
            if (remaining >= step.pts) {
                hand[s][nextIdx[s]] = step.rank;
                remaining -= step.pts;
                nextIdx[s]++;
                placed = true;
                break;
            }
        }
        // If we couldn't place even a J, break to avoid spinning
        if (!placed) break;
    }

    return makeHandFromPattern(
        hand.S.join(''),
        hand.H.join(''),
        hand.D.join(''),
        hand.C.join('')
    );
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        makeHandFromRanks,
        makeHandFromPattern,
            makeTestHand,
            buildAuction,
            seatOfLastToken,
            makeCurrentBidAligned
    };
}

    /**
     * Build an Auction with dealer/ourSeat and a sequence of tokens (strings).
     * Seats are auto-assigned in rotation from the dealer.
     */
    function buildAuction(dealer, ourSeat, tokens) {
        const a = new Auction([], { dealer, ourSeat });
        for (const t of tokens) a.add(new Bid(t));
        return a;
    }

    /**
     * Find the seat of the last occurrence of a given token in the auction.
     */
    function seatOfLastToken(auction, token) {
        for (let i = auction.bids.length - 1; i >= 0; i--) {
            const b = auction.bids[i];
            if (b && b.token === token) return b.seat;
        }
        return null;
    }

    /**
     * Create a Bid for the current turn, but align its seat to match the seat
     * of a previous token (e.g., 5C should match the earlier 4C asker for Gerber).
     */
    function makeCurrentBidAligned(auction, token, alignToToken) {
        const b = new Bid(token);
        b.seat = seatOfLastToken(auction, alignToToken);
        return b;
    }
