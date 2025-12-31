# PT Practice Tool

Lightweight browser-based implementation of the Standard American Yellow Card (SAYC) bidding system with a small play-tab for card play.

Version: 0.9


# Bridge Bidding System (SAYC)

A comprehensive, test-backed implementation of the Standard American Yellow Card (SAYC) bidding system for contract bridge, featuring a modern browser UI and a Node/Jest test suite.

## Features

### Core Bidding Logic

- Opening Bids: 1NT (15–17 HCP), suit openings, weak twos
- Balanced Hand Detection: 4-3-3-3, 4-4-3-2, 5-3-3-2
  - Optional: treat 5-4-2-2 as semi-balanced (configurable)
- Rule of 20: Smart opening decisions based on HCP + two longest suits
- Better Minor: Intelligent choice between clubs and diamonds

### Major Conventions Supported

#### Slam Conventions

- Blackwood (4NT): Classic ace-asking with proper responses (0–4 aces)
- Roman Key Card Blackwood (RKCB 1430): Fixed to 1430 responses in this app
- Gerber (4♣): Ace-asking after notrump bids

#### Notrump Defenses

- DONT: Single-suited, two-suited, and three-suited patterns
- Meckwell: Single-suited and two-suited combinations
- Unusual Notrump (2NT overcall): Supported; “over minors” behavior is controlled via General Settings

#### Major Suit Responses

- Jacoby 2NT: Game-forcing raise showing 4+ support and 13+ HCP
- Splinter Bids: Game-forcing jump in a new suit with 4+ support and singleton/void
- Texas Transfers and Jacoby Transfers over NT
- Lebensohl over 1NT interference: fast/slow shows, stopper asking, cue-bid sequences
  - Optional “systems on” over interference (configurable): stolen-bid double and transfers over 2♣

#### Competitive Bidding

- Support Doubles: Exactly 3-card support in competitive auctions
- Negative Doubles: Takeout doubles after partner opens
- Responsive Doubles: Takeout after partner’s takeout double
- Reopening Doubles: When opponents stop at a low level
- Cue-Bid Raises: Limit+ raises showing 10+ HCP and 4+ support
- Michaels Cuebid: Two-suited overcalls
- Relaxed Takeout Doubles: Shape-based with 11+ HCP when short in opponent’s suit

#### Other Conventions

- Drury (passed hand)
- Passed Hand Variations

### Web Interface Features

- Interactive Hand Input with standard text format
- Visual Hand Display: Color-coded suits (♠ ♥ ♦ ♣)
- Live HCP Calculation
- Auction Tracker: Real-time history with seat tracking
- Bid Recommendations with convention attribution
- Explicit explanations for key conventions (e.g., Weak Twos feature-ask, Cue-Bid Raises, Reopening Doubles)
- Vulnerability Control for both sides
- Active Conventions drive the engine: Only selected conventions are used by logic and explanations
  - If Strong 2♣ is off, a 2♣ opening is natural (long clubs) and explained as such
- RKCB clarity: The app uses RKCB 1430 and displays it consistently (no responses selector in General Settings)
- Practice Focus generation: Hand generator tries all-selected conventions, then pairs, then single selections

#### Play Tab (Card Play and Scoring)

- Play out the hand after an auction is completed (new Play tab)
- Play decisions use built-in heuristic logic; no ML model is required for card play
- SVG card renderer with follow-suit enforcement and trick winner calculation
- Dummy is revealed after the opening lead; E/W can auto-play for quick simulations
- Undo/Clear Trick controls, Claim, Replay, and New Deal actions
- Duplicate scoring at end of hand: part-score/game/slam bonuses, over/undertricks, doubled/redoubled insult, vulnerability-aware
- Final contract banner with a separate score breakdown list (replaces inline bracketed breakdown)

### Auction Management

- Seat Tracking (dealer, positions)
- Vulnerability Awareness (ranges adjust with vulnerability)
- Convention Attribution on each bid



## Usage Guide

### 1) Enter Your Hand

- Format: Spades Hearts Diamonds Clubs (space-separated)
- Example: `AKQ2 J432 32 32`
- Click “Parse Hand”

### 2) Start an Auction

- Pick Our Seat and Dealer
- Set vulnerability (NS/EW) if needed
- Click “Start New Auction”

### 3) Get Bidding Suggestion

- Click “Hint” to see the recommended bid and explanation
- The UI shows which convention was used when applicable

### Convention Explanations in the UI (examples)

- Weak Two feature-ask and replies
  - `2♠ — 2NT — 3♣` → “Feature shown over 2NT ask: clubs”
  - `2♥ — 2NT — 3♥` → “No feature over 2NT ask (rebid hearts at 3-level)”
- Other Weak Two continuations
  - `2♥ — 3NT` → “Natural 3NT over Weak Two Major”
  - `2♦ — 3♦` → “Raise over Weak Two”
  - `2♠ — 4♠` → “Raise to game over Weak Two”
- Cue-Bid Raise (after partner’s suit overcall)
  - `1♥ — 1♠ — 2♥` → “Cue Bid Raise (limit+ raise of partner’s suit)”
- Reopening Double (balancing)
  - `1♦ — PASS — PASS — X` → “Reopening Double (balancing position)”

## JavaScript API Usage

Browser (globals):

```javascript
// Initialize the system
const system = new window.SAYCBiddingSystem();

// Create a hand (format: "Spades Hearts Diamonds Clubs")
const hand = new window.Hand("AKJ3 Q54 K82 974");

// Start an auction (our seat 'N')
system.startAuction("N");

// Get a bid for the hand
const bid = system.getBid(hand);
console.log(`Bid: ${bid.token}`);
if (bid.conventionUsed) console.log(`Convention: ${bid.conventionUsed}`);
```

Advanced (with dealer tracking):

```javascript
// Start auction with dealer tracking
system.startAuctionWithDealer("E", "N"); // our seat = East, dealer = North

// Add opponent's opening bid
system.currentAuction.add(new window.Bid("1NT", { seat: "N" }));

// Get our response
const hand2 = new window.Hand("KQ65 J9843 72 85");
const bid2 = system.getBid(hand2);
```

Key toggles under `config`:

```js
window.DEFAULT_CONVENTIONS_CONFIG = {
  ace_asking: {
    gerber: {
      enabled: true,
      continuations: true,
      responses_map: ["4D", "4H", "4S", "4NT"],
    },
    blackwood: { enabled: true, variant: "rkcb", responses: "1430" },
  },
  notrump_responses: {
    stayman: { enabled: true },
    jacoby_transfers: { enabled: true },
    texas_transfers: { enabled: true },
    minor_suit_transfers: { enabled: false },
  },
  responses: {
    jacoby_2nt: { enabled: true },
    splinter_bids: { enabled: true },
    drury: { enabled: true },
  },
  notrump_defenses: {
    unusual_nt: { enabled: true, over_minors: true },
    dont: { enabled: true },
    meckwell: { enabled: true },
  },
  competitive: {
    michaels: { enabled: true },
    negative_doubles: { enabled: true, thru_level: 3 },
    responsive_doubles: { enabled: true, thru_level: 3 },
    support_doubles: { enabled: true, thru: "2S" },
    reopening_doubles: { enabled: true },
    // Advancer raises after partner's overcall (configurable thresholds)
    advancer_raises: {
      enabled: true,
      simple_min_support: 3, // simple raise to 2M with 3+ trumps
      simple_range: { min: 6, max: 10 },
      jump_min_support: 4, // jump raise to 3M requires 4+ trumps (default)
      jump_range: { min: 11, max: 12 },
      cuebid_min_support: 3, // cue-bid opener's suit as strong raise with 3+ trumps
      cuebid_min_hcp: 13, // 13+ HCP → cue-bid raise
    },
  },
  opening_bids: {
    strong_2_clubs: { enabled: true },
  },
  general: {
    vulnerability_adjustments: true,
    passed_hand_variations: true,
    balanced_shapes: { include_5422: false },
    systems_on_over_1nt_interference: {
      stayman: false,
      transfers: false,
      stolen_bid_double: false,
    },
  },
};
```

## Notes:

- Vulnerability adjustments tighten/loosen preempts
- Support/Negative/Responsive doubles honor their configured levels
- Minor Suit Transfers (MST) opener acceptance:
  - `1NT – 2S` → `3C`
  - `1NT – 2NT` → `3D`
- “Systems on” over 1NT interference (when enabled):
  - Stolen-bid double: after (2♣) over our 1NT, X = Stayman with 8+ HCP and a 4-card major
  - Transfers after (2♣): 2♦/2♥ act as transfers to ♥/♠
  - Negative doubles apply after our 1-level suit openings (not after 1NT)
- RKCB is 1430 and the label is fixed in the UI
- Active Conventions selections directly control which conventions the engine uses

## Features

### Core Bidding Logic

- **Opening Bids**: 1NT (15-17 HCP), suit openings, weak twos
- **Balanced Hand Detection**: 4-3-3-3, 4-4-3-2, 5-3-3-2 distributions
  - Optional: treat 5-4-2-2 as “semi-balanced” (configurable)
- **Rule of 20**: Smart opening decisions based on HCP + longest two suits
- **Better Minor**: Intelligent choice between clubs and diamonds

### Major Conventions Supported

#### Slam Conventions

- **Blackwood (4NT)**: Classic ace-asking with proper responses (0-4 aces)
- **Roman Key Card Blackwood (RKCB)**: 1430 and 3014 variants
- **Gerber (4C)**: Ace-asking after notrump bids

#### Notrump Defenses

- **DONT** (Disturbing Opponents' NoTrump): Single-suited, two-suited, and three-suited patterns
- **Meckwell**: Comprehensive defense including single-suited and two-suited combinations

#### Major Suit Responses

- **Jacoby 2NT**: Game-forcing raise showing 4+ card support and 13+ HCP
- **Splinter Bids**: Jump bids in new suits showing game-forcing values with 4+ support and singleton/void
- **Texas Transfers** and **Jacoby Transfers** over NT
- **Lebensohl**: Complex sequences after opponent interference over 1NT
  - Fast vs slow denial of stopper
  - Stopper asking with proper detection (A, Kx+, Qxx+)
  - Cue bid sequences
  - Optional systems-on over interference (configurable): stolen-bid double and transfers over 2♣

#### Competitive Bidding

- **Support Doubles**: Show exactly 3-card support in competitive auctions
- **Negative Doubles**: Takeout doubles after partner opens
- **Responsive Doubles**: Takeout after partner's takeout double
- **Reopening Doubles**: When opponents stop at low level
- **Cue Bid Raises**: Limit+ raises showing 10+ HCP and 4+ support
- **Michaels Cuebid**: Two-suited overcalls
- **Relaxed Takeout Doubles**: Shape-based with 11+ HCP when short in opponent's suit

#### Other Conventions

- **Drury**: Passed hand evaluation (when enabled)
- **Passed Hand Variations**: Adjusted bidding after initial pass

### Web Interface Features

- **Interactive Hand Input**: Enter hands in standard format
- **Visual Hand Display**: Color-coded suits with symbols (♠ ♥ ♦ ♣)
- **Live HCP Calculation**: Automatic point counting
- **Auction Tracker**: Real-time auction history with seat tracking
- **Bid Recommendations**: Get AI-powered bidding suggestions
- **Convention Attribution**: See which convention was used for each bid
- **Explicit Explanations for Key Conventions**: The UI now explains Weak Two (including 2NT feature ask and opener replies), Cue Bid Raises, and Reopening Doubles for both computer and your own bids.
- **Vulnerability Control**: Set vulnerability for both sides
- **Live RKCB Label Update**: When changing the RKCB response structure (1430/3014) in General Settings, the convention label updates immediately with a subtle highlight to draw attention.

### Auction Management

- **Seat Tracking**: Proper dealer and position tracking
- **Vulnerability Awareness**: Adjusts bidding ranges based on vulnerability
- **Convention Attribution**: Each bid tracks which convention was used


## Author

Rajnesh Kathuria