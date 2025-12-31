// Load model topology and weights from local filesystem and run a simple prediction
(async ()=>{
  try {
    // Prefer @tensorflow/tfjs (pure JS) for compatibility with this environment
    let tf = null;
    try { tf = require('@tensorflow/tfjs'); }
    catch (e) { console.error('Please install @tensorflow/tfjs'); process.exit(2); }

    const fs = require('fs');
    const path = require('path');

    const modelJsonPath = path.join(process.cwd(), 'models', 'bid_model.json');
    // Determine weight binary path from manifest if present; fall back to common names
    let weightsBinPath = null;
    if (Array.isArray(modelJson.weightsManifest) && modelJson.weightsManifest.length) {
      const candPaths = modelJson.weightsManifest.flatMap(g => g.paths || []);
      for (const p of candPaths) {
        const full = path.join(process.cwd(), 'models', p);
        if (fs.existsSync(full)) { weightsBinPath = full; break; }
      }
    }
    if (!weightsBinPath) {
      const alt1 = path.join(process.cwd(), 'models', 'weights.bin');
      const alt2 = path.join(process.cwd(), 'models', 'bid_weights.bin');
      if (fs.existsSync(alt1)) weightsBinPath = alt1;
      else if (fs.existsSync(alt2)) weightsBinPath = alt2;
    }
    const tokensPath = path.join(process.cwd(), 'models', 'bid_tokens.json');

    if (!fs.existsSync(modelJsonPath)) { console.error('Model JSON not found:', modelJsonPath); process.exit(2); }
    if (!fs.existsSync(weightsBinPath)) { console.error('Weights bin not found:', weightsBinPath); process.exit(2); }
    if (!fs.existsSync(tokensPath)) { console.error('Tokens not found:', tokensPath); process.exit(2); }

    const modelJson = JSON.parse(fs.readFileSync(modelJsonPath, 'utf8'));
    const tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));
    const weightDataBuffer = fs.readFileSync(weightsBinPath);

    // The Keras-converted tfjs model artifact stores modelTopology at modelJson.modelTopology
    // and weightSpecs inside modelJson.weightsManifest[0].weights (paths are relative and weights are in weights.bin)
    const modelTopology = modelJson.modelTopology || modelJson;

    // Extract weightSpecs by flattening all manifests
    const weightSpecs = [];
    if (Array.isArray(modelJson.weightsManifest)) {
      for (const group of modelJson.weightsManifest) {
        if (Array.isArray(group.weights)) {
          for (const w of group.weights) {
            weightSpecs.push(w);
          }
        }
      }
    }

    if (!weightSpecs.length) {
      console.error('No weight specs found in model JSON.');
      process.exit(3);
    }

    // weightData must be an ArrayBuffer
    const weightData = weightDataBuffer.buffer.slice(weightDataBuffer.byteOffset, weightDataBuffer.byteOffset + weightDataBuffer.byteLength);

    const modelArtifacts = {
      modelTopology: modelTopology,
      weightSpecs: weightSpecs,
      weightData: weightData
    };

    // Use tf.io.fromMemory to create IOHandler
    const handler = tf.io.fromMemory(modelArtifacts);
    console.log('Loading model from memory...');
    const model = await tf.loadLayersModel(handler);
    console.log('Model loaded from memory.');

    // Infer input size
    const inputShape = (model.inputs && model.inputs[0] && model.inputs[0].shape) ? model.inputs[0].shape[1] || 181 : 181;
    console.log('Input shape:', inputShape);

    // Create a zero vector placeholder; replace with encoder for real predictions
    const inputVec = new Array(inputShape).fill(0);
    const tensor = tf.tensor([inputVec], [1, inputVec.length], 'float32');

    const out = model.predict(tensor);
    let probs = null;
    if (out && typeof out.data === 'function') probs = await out.data();
    else if (Array.isArray(out)) probs = out[0];

    if (!probs) { console.error('No output from model'); process.exit(4); }

    let maxIdx = 0, maxV = -Infinity;
    for (let i = 0; i < probs.length; i++) { if (probs[i] > maxV) { maxV = probs[i]; maxIdx = i; } }

    console.log('Predicted token index:', maxIdx);
    console.log('Predicted token:', tokens[maxIdx]);

    process.exit(0);
  } catch (err) {
    console.error('Error in local model prediction test:', err);
    process.exit(1);
  }
})();
