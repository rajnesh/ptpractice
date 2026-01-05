const fs = require('fs');
const path = require('path');

// Criteria:
// - South can open a major: 12+ HCP and a 5+ card major; prefer longer major, spades on ties.
// - West is weak (<= 10 HCP) so likely to pass.
// - North has 4+ card support in South's major.

function parseHand(handStr) {
    if (!handStr || typeof handStr !== 'string') return null;
    const suits = handStr.trim().split(/\s+/);
    const order = ['S', 'H', 'D', 'C'];
    while (suits.length < 4) suits.push('');
    const rankMap = { A: 4, K: 3, Q: 2, J: 1 };
    const lengths = {};
    let hcp = 0;
    order.forEach((suit, idx) => {
        const cards = (suits[idx] || '').replace(/\s+/g, '');
        lengths[suit] = cards.length;
        for (const ch of cards.toUpperCase()) {
            hcp += rankMap[ch] || 0;
        }
    });
    return { lengths, hcp };
}

function pickOpeningMajor(hand) {
    if (!hand || !hand.lengths) return null;
    const spades = hand.lengths.S || 0;
    const hearts = hand.lengths.H || 0;
    const hcp = hand.hcp || 0;
    if (hcp < 12) return null;
    const maxLen = Math.max(spades, hearts);
    if (maxLen < 5) return null;
    if (spades > hearts) return 'S';
    if (hearts > spades) return 'H';
    if (spades >= 5) return 'S';
    if (hearts >= 5) return 'H';
    return null;
}

function isBergenDeal(deal) {
    if (!deal || !deal.hands) return false;
    const seats = {};
    for (const seat of ['N', 'E', 'S', 'W']) {
        const parsed = parseHand(deal.hands[seat]);
        if (!parsed) return false;
        const hcpFromData = deal.hcp && typeof deal.hcp[seat] === 'number' ? deal.hcp[seat] : null;
        seats[seat] = { lengths: parsed.lengths, hcp: hcpFromData ?? parsed.hcp };
    }

    const major = pickOpeningMajor(seats.S);
    if (!major) return false;
    const westWeak = (seats.W.hcp || 0) <= 10;
    if (!westWeak) return false;
    const northSupport = seats.N.lengths[major] || 0;
    return northSupport >= 4;
}

function main() {
    const filePath = path.resolve(__dirname, '../assets/data/practice_deals.json');
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);

    let touched = 0;
    data.forEach((deal) => {
        if (!deal || !Array.isArray(deal.conventions)) return;
        if (!deal.conventions.includes('Bergen Raises')) return;
        if (isBergenDeal(deal)) return;
        deal.conventions = deal.conventions.filter((c) => c !== 'Bergen Raises');
        touched += 1;
    });

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
    console.log(`Removed Bergen Raises from ${touched} deal(s).`);
}

main();
