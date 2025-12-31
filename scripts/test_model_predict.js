let tf = null;
const path = require('path');
const fs = require('fs');

(async () => {
  try {
    // Prefer native tfjs-node for performance, but fallback to pure-js tfjs if
    // native bindings are unavailable on the current platform.
    let usingNodeNative = false;
    try {
      tf = require('@tensorflow/tfjs-node');
      usingNodeNative = true;
      console.log('Using @tensorflow/tfjs-node');
    } catch (e) {
      try {
        tf = require('@tensorflow/tfjs');
        usingNodeNative = false;
        console.log('Using @tensorflow/tfjs (pure JS)');
      } catch (e2) {
        console.error('No TensorFlow.js runtime available. Install @tensorflow/tfjs or @tensorflow/tfjs-node');
        process.exit(2);
      }
    }

    // When native bindings are available we can load via the filesystem using
    // the file:// scheme. When running with pure-js `@tensorflow/tfjs` we
    // instruct the loader to fetch over HTTP (start a local static server
    // before running this script) because `fetch` is used to pull both the
    // JSON manifest and the binary weights.
    let modelPath;
    if (usingNodeNative) {
      modelPath = 'file://' + path.join(process.cwd(), 'models', 'bid_model.json');
    } else {
      modelPath = 'http://localhost:8000/models/bid_model.json';
    }
    console.log('Loading model from', modelPath);
    const model = await tf.loadLayersModel(modelPath);
    console.log('Model loaded.');

    const tokensPath = path.join(process.cwd(), 'models', 'bid_tokens.json');
    if (!fs.existsSync(tokensPath)) {
      console.error('bid_tokens.json not found at', tokensPath);
      process.exit(2);
    }
    const tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));

    const inputShape = (model.inputs && model.inputs[0] && model.inputs[0].shape) ? (model.inputs[0].shape[1] || 181) : 181;
    console.log('Model input shape inferred:', inputShape);

    // Simple zero-vector input (placeholder). Replace with real encoder for meaningful results.
    const inputVec = new Array(inputShape).fill(0);
    const tensor = tf.tensor([inputVec], [1, inputVec.length], 'float32');

    const out = model.predict(tensor);
    let probs = null;
    if (Array.isArray(out)) {
      probs = await out[0].data();
    } else if (out && typeof out.data === 'function') {
      probs = await out.data();
    } else if (Array.isArray(out)) {
      probs = out;
    }

    if (!probs) {
      console.error('No prediction output');
      process.exit(3);
    }

    let maxIdx = 0, maxV = -Infinity;
    for (let i = 0; i < probs.length; i++) {
      if (probs[i] > maxV) { maxV = probs[i]; maxIdx = i; }
    }

    console.log('Predicted index:', maxIdx);
    console.log('Predicted token:', tokens[maxIdx]);

    // Cleanup
    if (typeof model.dispose === 'function') model.dispose();
    tf.disposeVariables();
    process.exit(0);
  } catch (err) {
    console.error('Error running model prediction:', err);
    process.exit(1);
  }
})();
