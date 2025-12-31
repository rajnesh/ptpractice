const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'js', 'combined-bidding-system.js');
const OUT_JSON = path.join(ROOT, 'docs', 'bidding-tree.json');
const OUT_MD = path.join(ROOT, 'docs', 'bidding-tree.md');
const OUT_DOT = path.join(ROOT, 'docs', 'bidding-tree.dot');
const OUT_HTML = path.join(ROOT, 'docs', 'bidding-tree.html');

function readSource() {
  try {
    return fs.readFileSync(SRC, 'utf8');
  } catch (e) {
    console.error('Failed to read', SRC, e.message);
    process.exit(1);
  }
}

function extractSections(src) {
  // Heuristic scanning: look for comment headings and key strings
  const lines = src.split(/\r?\n/);
  const sections = [];
  const headingRe = /^\s*\/\/\s*([A-Za-z0-9 -:(),]+)$/;
  const smallRe = /\b(weak two|2NT|Michaels|Unusual NT|Bergen|cue raise|support double|overcall|takeout double|balancing)\b/i;
  // BTREE annotation formats supported (supporting optional metadata after a '|'):
  // // BTREE: nodeId -> Label text | shape=box,color=#eef3ff,rank=1
  // // BTREE-EDGE: fromId -> toId [optionalLabel] | color=red,style=dashed
  const btreeNodeRe = /^\s*\/\/\s*BTREE:\s*([A-Za-z0-9_\-]+)\s*->\s*(.+?)(?:\s*\|\s*(.+))?$/;
  const btreeEdgeRe = /^\s*\/\/\s*BTREE-EDGE:\s*([A-Za-z0-9_\-]+)\s*->\s*([A-Za-z0-9_\-]+)(?:\s*\[(.+?)\])?(?:\s*\|\s*(.+))?$/;

  function parseMeta(metaStr) {
    const meta = {};
    if (!metaStr) return meta;
    // split on commas, support key=value pairs
    for (const part of metaStr.split(',')) {
      const p = part.trim();
      if (!p) continue;
      const kv = p.split('=');
      if (kv.length === 2) {
        meta[kv[0].trim()] = kv[1].trim();
      } else {
        // boolean flag
        meta[p] = true;
      }
    }
    return meta;
  }

  for (let i = 0; i < lines.length; i++) {
    // check for explicit BTREE annotations first
    const bn = lines[i].match(btreeNodeRe);
    if (bn) {
      sections.push({ btreeNode: { id: bn[1].trim(), label: bn[2].trim(), meta: parseMeta(bn[3]) } });
      continue;
    }
    const be = lines[i].match(btreeEdgeRe);
    if (be) {
      sections.push({ btreeEdge: { from: be[1].trim(), to: be[2].trim(), label: be[3] ? be[3].trim() : null, meta: parseMeta(be[4]) } });
      continue;
    }
    const m = lines[i].match(headingRe);
    if (m) {
      // capture a small block after the heading for context
      const heading = m[1].trim();
      const context = [];
      for (let j = i+1; j < Math.min(i+20, lines.length); j++) {
        const l = lines[j].trim();
        if (l.startsWith('//')) context.push(l.replace(/^\/\//, '').trim());
        if (l === '' && context.length > 0) break;
      }
      sections.push({ heading, context });
    } else if (smallRe.test(lines[i])) {
      // add lightweight matches as implicit sections
      const snippet = lines[i].trim().replace(/\s+/g, ' ');
      sections.push({ heading: snippet, context: [] });
    }
  }

  // Reduce duplicates and cluster
  const seen = new Set();
  const out = [];
  for (const s of sections) {
    const k = s.heading.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      out.push(s);
    }
  }
  return out;
}

function buildJsonTree(sections) {
  // Build a structured tree. Prefer explicit BTREE annotations when present.
  const tree = {
    title: 'SAYC Combined Bidding System',
    source: path.relative(ROOT, SRC),
    nodes: [],
    edges: []
  };

  // First pass: extract explicit btree nodes/edges (including metadata)
  for (const s of sections) {
    if (s.btreeNode) {
      tree.nodes.push({ id: s.btreeNode.id, label: s.btreeNode.label, notes: [], meta: s.btreeNode.meta || {} });
    } else if (s.btreeEdge) {
      tree.edges.push({ from: s.btreeEdge.from, to: s.btreeEdge.to, label: s.btreeEdge.label, meta: s.btreeEdge.meta || {} });
    }
  }

  // Second pass: fall back to heuristic headings for any remaining nodes
  for (const s of sections) {
    if (s.heading) {
      // avoid duplicates by label
      const label = s.heading;
      if (!tree.nodes.some(n => n.label === label)) {
        tree.nodes.push({ id: null, label, notes: s.context || [] });
      }
    }
  }

  return tree;
}

function writeJson(tree) {
  fs.writeFileSync(OUT_JSON, JSON.stringify(tree, null, 2), 'utf8');
  console.log('Wrote', OUT_JSON);
}

function writeMd(tree) {
  const lines = [];
  lines.push('# Bidding Tree — SAYC Combined Bidding System');
  lines.push('');
  lines.push(`Source: \`${tree.source}\``);
  lines.push('');
  for (const n of tree.nodes) {
    lines.push(`## ${n.title}`);
    if (n.notes && n.notes.length) {
      for (const t of n.notes) {
        lines.push(`- ${t}`);
      }
    }
    lines.push('');
  }
  fs.writeFileSync(OUT_MD, lines.join('\n'), 'utf8');
  console.log('Wrote', OUT_MD);
}

function writeDot(tree) {
  // Create a DOT file. Use explicit IDs when available from BTREE annotations.
  let dot = 'digraph BiddingTree {\n  rankdir=LR;\n  node [shape=box, style=rounded, fontsize=11, fontname="Helvetica"];\n\n';
  dot += `  root [label="${tree.title}\\n(${tree.source})", shape=oval, style=filled, fillcolor=\"#eef3ff\"];\n`;

  // Map nodes to ids (create auto ids for nodes without explicit ids)
  const nodeMap = new Map();
  let autoIdx = 0;
  for (const n of tree.nodes) {
    const nid = n.id || ('n_auto_' + (autoIdx++));
    nodeMap.set(nid, { nid, label: n.label, meta: n.meta || {} });
  }

  // Emit nodes
  for (const [k, v] of nodeMap.entries()) {
    const safeLabel = String(v.label).replace(/"/g, '\\"');
    const attrs = [];
    // Support suits metadata by prepending suit glyphs if requested
    let labelText = safeLabel;
    if (v.meta && v.meta.suits) {
      const suitMap = { 'S': '♠', 'H': '♥', 'D': '♦', 'C': '♣' };
      const parts = String(v.meta.suits).split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
      const glyphs = parts.map(p => suitMap[p] || p).join('');
      labelText = `${glyphs} ${labelText}`;
    }
    attrs.push(`label=\"${labelText}\"`);
    // apply meta attributes if present
    if (v.meta) {
      if (v.meta.shape) attrs.push(`shape=${v.meta.shape}`);
      if (v.meta.color) { attrs.push(`color=\"${v.meta.color}\"`); attrs.push('style=filled'); }
      if (v.meta.fill) attrs.push(`fillcolor=\"${v.meta.fill}\"`);
      if (v.meta.style) attrs.push(`style=\"${v.meta.style}\"`);
      if (v.meta.font) attrs.push(`fontname=\"${String(v.meta.font).replace(/"/g, '\\"')}\"`);
      if (v.meta.fontsize) attrs.push(`fontsize=${String(v.meta.fontsize)}`);
      if (v.meta.cluster) {
        v.cluster = String(v.meta.cluster);
        v.clusterColor = v.meta.clusterColor || null;
      }
    }
    dot += `  ${k} [${attrs.join(', ')}];\n`;
  }

  // If explicit edges exist, emit them; otherwise connect root to each node
  if (tree.edges && tree.edges.length) {
    for (const e of tree.edges) {
      const from = nodeMap.has(e.from) ? e.from : 'root';
      const to = nodeMap.has(e.to) ? e.to : (nodeMap.keys().next().value || 'root');
      const edgeAttrs = [];
      if (e.label) edgeAttrs.push(`label="${String(e.label).replace(/"/g, '\\"')}"`);
      if (e.meta) {
        if (e.meta.color) edgeAttrs.push(`color=\"${e.meta.color}\"`);
        if (e.meta.style) edgeAttrs.push(`style=\"${e.meta.style}\"`);
        if (e.meta.arrowhead) edgeAttrs.push(`arrowhead=\"${e.meta.arrowhead}\"`);
        if (e.meta.dir) edgeAttrs.push(`dir=\"${e.meta.dir}\"`);
      }
      const lbl = edgeAttrs.length ? ` [${edgeAttrs.join(', ')}]` : '';
      dot += `  ${from} -> ${to}${lbl};\n`;
    }
  } else {
    dot += '\n';
    for (const k of nodeMap.keys()) {
      dot += `  root -> ${k};\n`;
    }
  }

  // Emit rank subgraphs if nodes have 'rank' metadata
  const rankGroups = {};
  for (const [k, v] of nodeMap.entries()) {
    if (v.meta && v.meta.rank) {
      const r = String(v.meta.rank);
      rankGroups[r] = rankGroups[r] || [];
      rankGroups[r].push(k);
    }
  }
  for (const r of Object.keys(rankGroups)) {
    dot += `  { rank = same; ${rankGroups[r].join('; ')}; }\n`;
  }
  // Emit clusters (subgraphs) if nodes specified a cluster id
  const clusters = {};
  for (const [k, v] of nodeMap.entries()) {
    if (v.cluster) {
      clusters[v.cluster] = clusters[v.cluster] || { nodes: [], color: v.clusterColor };
      clusters[v.cluster].nodes.push(k);
      if (!clusters[v.cluster].color && v.clusterColor) clusters[v.cluster].color = v.clusterColor;
    }
  }
  for (const cid of Object.keys(clusters)) {
    const c = clusters[cid];
    dot += `  subgraph cluster_${cid} {\n    label = \"${cid}\";\n`;
    if (c.color) dot += `    style=filled; fillcolor=\"${c.color}\";\n`;
    dot += `    ${c.nodes.join('; ')};\n  }\n`;
  }

  dot += '\n}\n';
  fs.writeFileSync(OUT_DOT, dot, 'utf8');
  console.log('Wrote', OUT_DOT);
}

async function writeHtml() {
  let dotContent = '';
  try {
    dotContent = fs.readFileSync(OUT_DOT, 'utf8');
  } catch (e) {
    console.warn('Could not read DOT file for embedding:', e.message);
  }

  // Try to render the DOT to SVG at generation time using the installed @viz-js/viz
  // Node.js interface. If successful, embed the SVG directly into the HTML so
  // the page needs no runtime Viz dependency.
  let svg = null;
  try {
    let vizModule = null;
    try {
      vizModule = require('@viz-js/viz');
    } catch (e) {
      // fallback to explicit path
      try {
        vizModule = require(path.join(ROOT, 'node_modules', '@viz-js', 'viz', 'dist', 'viz.cjs'));
      } catch (e2) {
        vizModule = null;
      }
    }

    if (!vizModule) throw new Error('Could not require @viz-js/viz');

    // Prefer the documented instance() factory when available
    let vizInstance = null;
    const factory = vizModule.instance || (vizModule.default && vizModule.default.instance);
    if (typeof factory === 'function') {
      vizInstance = await factory();
    } else if (typeof vizModule === 'function') {
      vizInstance = new vizModule();
    } else if (vizModule.default && typeof vizModule.default === 'function') {
      vizInstance = new vizModule.default();
    } else {
      throw new Error('Could not find instance() or constructor on @viz-js/viz module');
    }

    // Render to SVG string. Use renderString when available, otherwise render.
    if (typeof vizInstance.renderString === 'function') {
      svg = vizInstance.renderString(dotContent, { format: 'svg' });
      if (svg && typeof svg.then === 'function') svg = await svg;
    } else if (typeof vizInstance.render === 'function') {
      const res = vizInstance.render(dotContent, { format: 'svg' });
      if (res && res.status === 'success') svg = res.output;
      else if (typeof res === 'string') svg = res;
      else svg = null;
    } else {
      throw new Error('Viz instance has no renderString/render method');
    }
  } catch (e) {
    console.error('Failed to render SVG at generation time:', e && e.stack ? e.stack : e);
    svg = null;
  }

  // If we have an SVG, embed it directly into the generated HTML. Otherwise
  // fall back to writing an HTML that uses the runtime viewer (bidding-tree-viewer.js).
  if (svg) {
    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Bidding Tree Viewer</title>
  <style>body{font-family:Arial,Helvetica,sans-serif;padding:16px;} #graph{border:1px solid #ddd;padding:12px;background:#fff}</style>
</head>
<body>
  <h1>Bidding Tree</h1>
  <p>Auto-generated from <code>${path.relative(ROOT, SRC)}</code>.</p>
  <div id="graph">${svg}</div>
</body>
</html>`;
    fs.writeFileSync(OUT_HTML, html, 'utf8');
    console.log('Wrote', OUT_HTML, '(embedded SVG)');
  } else {
    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Bidding Tree Viewer</title>
  <style>body{font-family:Arial,Helvetica,sans-serif;padding:16px;} #graph{border:1px solid #ddd;padding:12px;background:#fff}</style>
</head>
<body>
  <h1>Bidding Tree</h1>
  <p>Auto-generated from <code>${path.relative(ROOT, SRC)}</code>.</p>
  <div id="graph">Rendering...</div>
  <!-- External viewer script (will attempt dynamic import of viz builds then fall back to global) -->
  <script src="bidding-tree-viewer.js"></script>
</body>
</html>`;
    fs.writeFileSync(OUT_HTML, html, 'utf8');
    console.log('Wrote', OUT_HTML, '(viewer fallback)');
  }

  // No runtime viewer fallback is written — HTML embeds SVG when render succeeds.
}

async function main() {
  const src = readSource();
  const sections = extractSections(src);
  const tree = buildJsonTree(sections);
  writeJson(tree);
  writeMd(tree);
  writeDot(tree);
  await writeHtml();
}

main().catch(err => { console.error(err); process.exit(1); });
            // duplicate content removed
