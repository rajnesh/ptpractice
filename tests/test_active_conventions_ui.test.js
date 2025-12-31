/** @jest-environment jsdom */

const fs = require('fs');
const path = require('path');

// Evaluate app.js in an IIFE to mimic module scoping; explicitly expose hooks needed for the test
function evalAppModuleLike(win) {
    const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
    win.eval(`(function(){${src}\nwindow.__testHooks = { loadFallbackConventions, createConventionCheckboxes };}).call(window);`);
}

function buildConventionDom() {
    document.body.innerHTML = `
    <div id="conventionCheckboxes"></div>
    <div id="practiceConventionCheckboxes"></div>
  `;
}

describe('Active Conventions checkbox handlers', () => {
    test('change event triggers global handler without errors', () => {
        buildConventionDom();
        evalAppModuleLike(window);

        const hooks = window.__testHooks;
        expect(hooks).toBeDefined();
        expect(typeof hooks.loadFallbackConventions).toBe('function');
        expect(typeof hooks.createConventionCheckboxes).toBe('function');

        // Initialize fallback convention data and render the checkboxes
        hooks.loadFallbackConventions();
        hooks.createConventionCheckboxes();

        const target = document.getElementById('conv_Lebensohl');
        expect(target).toBeTruthy();
        expect(typeof window.updateConventionStatus).toBe('function');

        // Toggle the checkbox; previously this raised ReferenceError because handler wasn't global
        expect(() => {
            target.checked = !target.checked;
            target.dispatchEvent(new window.Event('change', { bubbles: true }));
        }).not.toThrow();
    });
});
