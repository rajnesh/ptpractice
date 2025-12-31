// Jest setup: allow CommonJS/jsdom tests to eval js/app.js by stripping ESM imports
const fs = require('fs');
const gfs = require('graceful-fs');
const path = require('path');
const Module = require('module');

const realReadFileSync = fs.readFileSync;
const realGfsReadFileSync = gfs.readFileSync;
const appPath = path.normalize(path.join(__dirname, '..', 'js', 'app.js'));

function buildPatchedSource() {
    const original = realReadFileSync(appPath, 'utf8');
    const stripped = original.replace(/^\s*import[^;]+;\s*/gm, '');
    const stubs = `
    // Test stubs replacing stripped module imports
    globalThis.loadBiddingModel = globalThis.loadBiddingModel || (async () => ({}));
    globalThis.getModelBid = globalThis.getModelBid || (async () => 'PASS');
  `;
    return `${stubs}\n${stripped}`;
}

function maybeReturnPatched(filePath, options) {
    const normalized = path.normalize(filePath);
    const wantsString = options === 'utf8' || (options && options.encoding === 'utf8');
    if (normalized === appPath) {
        const src = buildPatchedSource();
        if (wantsString || options === undefined) {
            return src;
        }
        // If a Buffer was requested, return UTF-8 buffer
        return Buffer.from(src, 'utf8');
    }
    return null;
}

fs.readFileSync = function patchedReadFileSync(filePath, options) {
    const patched = maybeReturnPatched(filePath, options);
    if (patched !== null) return patched;
    return realReadFileSync.apply(fs, arguments);
};

// Jest runtime reads files through graceful-fs, so patch that path too
gfs.readFileSync = function patchedGracefulReadFileSync(filePath, options) {
    const patched = maybeReturnPatched(filePath, options);
    if (patched !== null) return patched;
    return realGfsReadFileSync.apply(gfs, arguments);
};

// Also hook Node's CJS loader so require('../js/app.js') receives the patched source
const originalJsLoader = Module._extensions['.js'];
Module._extensions['.js'] = function patchedModuleLoader(module, filename) {
    const normalized = path.normalize(filename);
    if (normalized === appPath) {
        const content = buildPatchedSource();
        return module._compile(content, filename);
    }
    return originalJsLoader(module, filename);
};
