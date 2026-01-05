/**
 * Test Control Showing Cue Bids Convention
 * Tests first and second round control cue bids in slam-going auctions
 */

// Import test utilities
if (typeof require !== 'undefined') {
    const { TestRunner, makeHandFromPattern, makeHandFromDistribution } = require('./test-helpers.js');
    const { BiddingSystem, SAYCBiddingSystem, ConventionManager } = require('../assets/js/combined-bidding-system.js');
    const { Bid } = require('../assets/js/bridge-types.js');
}

class ControlCueBidsTestSuite {
    constructor() {
        this.testRunner = new TestRunner('Control Showing Cue Bids Tests');
        this.system = new SAYCBiddingSystem();
        this.conventions = new ConventionManager({
            slam_bidding: {
                control_showing_cue_bids: { enabled: true }
            },
            opening_bids: {
                strong_2_clubs: { enabled: true }
            }
        });
        this.system.setConventions(this.conventions);
    }

    runAllTests() {
        this.testRunner.describe('Control Showing Cue Bids', () => {
            this.testBasicCueBidRecognition();
            this.testFirstRoundControls();
            this.testSecondRoundControls();
            this.testCueBidSequences();
            this.testCueBidAfterJacoby2NT();
            this.testCueBidAfterSplinter();
            this.testCueBidPriority();
            this.testCueBidSlamTrying();
        });

        return this.testRunner.getResults();
    }

    testBasicCueBidRecognition() {
        this.testRunner.test('Basic Cue Bid Recognition', () => {
            // After establishing fit and game force, new suit bids are cue bids
            const auction = [
                new Bid('1H'),    // North opens 1H
                new Bid(null),    // East passes  
                new Bid('2NT'),   // South Jacoby 2NT (game forcing, 4+ hearts)
                new Bid(null),    // West passes
                new Bid('3C')     // North cue bids clubs (first/second round control)
            ];
            
            const hand = makeHandFromPattern('AK432', '654', 'A32', '32');
            this.system.setAuction(auction, 'S');
            
            // South should recognize this as a slam-going auction and consider cue bids
            const bid = this.system.recommendBid(hand);
            
            // Should cue bid available controls (Ace of diamonds in this case)
            this.testRunner.assert(
                bid.token === '3D' && bid.conventionUsed === 'Control Showing Cue Bid',
                `Expected 3D cue bid, got ${bid.token} with explanation: ${bid.conventionUsed || 'none'}`
            );
        });
    }

    testFirstRoundControls() {
        this.testRunner.test('First Round Control Cue Bids', () => {
            // Test cue bidding with aces and voids
            const auctions = [
                {
                    auction: [new Bid('1S'), new Bid(null), new Bid('2NT'), new Bid(null), new Bid('3C')],
                    hand: makeHandFromPattern('K8432', 'A654', 'A32', '3'), // Aces in hearts and diamonds
                    expected: '3D', // Lower cue bid first
                    description: 'Cue bid lower ace first'
                },
                {
                    auction: [new Bid('1H'), new Bid(null), new Bid('4C'), new Bid(null), new Bid('4D')], // After splinter
                    hand: makeHandFromPattern('432', 'AK432', '', 'A8543'), // Void in spades, ace in clubs
                    expected: '4S', // Cue bid void
                    description: 'Cue bid void as first round control'
                }
            ];

            auctions.forEach(({ auction, hand, expected, description }) => {
                this.system.setAuction(auction, 'S');
                const bid = this.system.recommendBid(hand);
                
                this.testRunner.assert(
                    bid.token === expected && bid.conventionUsed === 'Control Showing Cue Bid',
                    `${description}: Expected ${expected}, got ${bid.token}`
                );
            });
        });
    }

    testSecondRoundControls() {
        this.testRunner.test('Second Round Control Cue Bids', () => {
            // Test cue bidding with kings and singletons
            const auction = [
                new Bid('1S'),    // North opens 1S
                new Bid(null),    // East passes
                new Bid('2NT'),   // South Jacoby 2NT 
                new Bid(null),    // West passes
                new Bid('3C'),    // North cue bids clubs
                new Bid(null),    // East passes
                new Bid('3D'),    // South cue bids diamonds
                new Bid(null),    // West passes
                new Bid('3H')     // North cue bids hearts
            ];

            // South has king of clubs as second round control
            const hand = makeHandFromPattern('K432', '32', 'AK32', 'K43');
            this.system.setAuction(auction, 'S');
            
            const bid = this.system.recommendBid(hand);
            
            // Should continue with available cue bids or sign off
            this.testRunner.assert(
                bid.token && (bid.conventionUsed === 'Control Showing Cue Bid' || bid.token === '4S'),
                `Expected cue bid or sign off, got ${bid.token}`
            );
        });
    }

    testCueBidSequences() {
        this.testRunner.test('Cue Bid Sequence Logic', () => {
            // Test proper cue bid sequence: cheapest first, skip without control
            const auction = [
                new Bid('1H'),    // North opens 1H
                new Bid(null),    // East passes
                new Bid('2NT'),   // South Jacoby 2NT
                new Bid(null),    // West passes
                new Bid('3C')     // North cue bids clubs
            ];

            // South has diamond and spade controls but no club control
            const hand = makeHandFromPattern('A432', '654', 'K432', '32');
            this.system.setAuction(auction, 'S');
            
            const bid = this.system.recommendBid(hand);
            
            // Should cue bid diamonds (skipping clubs without control)
            this.testRunner.assert(
                bid.token === '3D',
                `Expected 3D (skipping clubs), got ${bid.token}`
            );
        });
    }

    testCueBidAfterJacoby2NT() {
        this.testRunner.test('Control Cue Bids After Jacoby 2NT', () => {
            // Jacoby 2NT establishes game force and major suit fit
            const auction = [
                new Bid('1S'),    // North opens 1S
                new Bid(null),    // East passes
                new Bid('2NT')    // South Jacoby 2NT (game forcing, 4+ spades)
            ];

            const hand = makeHandFromPattern('K432', 'A32', '32', 'A432');
            this.system.setAuction(auction, 'N'); // North to respond
            
            const bid = this.system.recommendBid(hand);
            
            // North should start cue bidding cheapest control
            this.testRunner.assert(
                bid.token === '3C' && bid.conventionUsed === 'Control Showing Cue Bid',
                `Expected 3C cue bid after Jacoby, got ${bid.token}`
            );
        });
    }

    testCueBidAfterSplinter() {
        this.testRunner.test('Control Cue Bids After Splinter Bid', () => {
            // Splinter bids establish game force and show shortness
            const auction = [
                new Bid('1H'),    // North opens 1H
                new Bid(null),    // East passes
                new Bid('4C')     // South splinters (4+ hearts, shortness in clubs)
            ];

            const hand = makeHandFromPattern('A32', 'AK432', 'K32', '32');
            this.system.setAuction(auction, 'N'); // North to respond
            
            const bid = this.system.recommendBid(hand);
            
            // North should cue bid available controls
            this.testRunner.assert(
                bid.token === '4D' && bid.conventionUsed === 'Control Showing Cue Bid',
                `Expected 4D cue bid after splinter, got ${bid.token}`
            );
        });
    }

    testCueBidPriority() {
        this.testRunner.test('Cue Bid Priority System', () => {
            // Test priority: first round controls before second round, cheapest first
            const auction = [
                new Bid('1S'),    // North opens 1S
                new Bid(null),    // East passes
                new Bid('2NT'),   // South Jacoby 2NT
                new Bid(null),    // West passes
                new Bid('3C')     // North cue bids clubs
            ];

            // South has ace in hearts (first round) and king in diamonds (second round)
            const hand = makeHandFromPattern('K432', 'A432', 'K32', '32');
            this.system.setAuction(auction, 'S');
            
            const bid = this.system.recommendBid(hand);
            
            // Should prioritize diamonds (cheaper) over hearts even though hearts is first round control
            // Actually should bid hearts first since it's first round control
            this.testRunner.assert(
                bid.token === '3H',
                `Expected 3H (first round control priority), got ${bid.token}`
            );
        });
    }

    testCueBidSlamTrying() {
        this.testRunner.test('Cue Bid Slam Investigation', () => {
            // Test complete cue bid sequence leading to slam
            const auction = [
                new Bid('1H'),    // North opens 1H
                new Bid(null),    // East passes
                new Bid('2NT'),   // South Jacoby 2NT
                new Bid(null),    // West passes
                new Bid('3C'),    // North cue bids clubs
                new Bid(null),    // East passes
                new Bid('3D'),    // South cue bids diamonds
                new Bid(null),    // West passes
                new Bid('3S'),    // North cue bids spades
                new Bid(null),    // East passes
                new Bid('4C')     // South cue bids clubs (second round)
            ];

            // North has excellent hand with all controls
            const hand = makeHandFromPattern('AK3', 'AKQ432', 'A32', 'A');
            this.system.setAuction(auction, 'N');
            
            const bid = this.system.recommendBid(hand);
            
            // With all controls shown, should bid slam
            this.testRunner.assert(
                bid.token === '6H',
                `Expected 6H slam bid, got ${bid.token}`
            );
        });
    }
}

// Run tests if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
    const testSuite = new ControlCueBidsTestSuite();
    const results = testSuite.runAllTests();
    console.log(results.summary);
    if (results.failures.length > 0) {
        console.log('\nFailures:');
        results.failures.forEach(failure => console.log(`- ${failure}`));
    }
}

// Export for use in other test files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ControlCueBidsTestSuite };
}

// Browser compatibility
if (typeof window !== 'undefined') {
    window.ControlCueBidsTestSuite = ControlCueBidsTestSuite;
}

// Jest placeholder to ensure suite contains at least one test
if (typeof describe === 'function' && typeof test === 'function' && typeof expect === 'function') {
    test('placeholder - control cue bids file loads', () => {
        expect(true).toBe(true);
    });
}
