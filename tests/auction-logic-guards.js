// Legacy shim for tests: guard helpers now live inside app.js. Prefer importing from app.js directly.

function loadGuards() {
    try {
        // CommonJS path (used by Jest and Node-based tools)
        // eslint-disable-next-line global-require
        return require('../assets/js/app.js');
    } catch (err) {
        // Browser/ESM path: rely on globals populated by app.js
        if (typeof window !== 'undefined') {
            return {
                applyResponderMajorGuard: window.applyResponderMajorGuard,
                applyOvercallLengthGuard: window.applyOvercallLengthGuard,
                applyTwoLevelFreeBidGuard: window.applyTwoLevelFreeBidGuard
            };
        }
        return {};
    }
}

const guards = loadGuards();
const { applyResponderMajorGuard, applyOvercallLengthGuard, applyTwoLevelFreeBidGuard } = guards;

module.exports = {
    applyResponderMajorGuard,
    applyOvercallLengthGuard,
    applyTwoLevelFreeBidGuard
};
