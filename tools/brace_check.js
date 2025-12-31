const fs = require('fs');
const path = require('path');
const file = path.resolve(__dirname, '..', 'js', 'app.js');
const src = fs.readFileSync(file, 'utf8');
const stack = [];
const open = new Set(['{', '(', '[']);
const closeMap = new Map([["}","{"],[")","("],["]","["]]);

let i = 0;
let line = 1;
function advance(n=1){
  for(let k=0;k<n;k++){
    if (src[i] === '\n') line++;
    i++;
  }
}

while (i < src.length) {
  const ch = src[i];
  // Skip line comments
  if (ch === '/' && src[i+1] === '/') {
    while (i < src.length && src[i] !== '\n') advance();
    continue;
  }
  // Skip block comments
  if (ch === '/' && src[i+1] === '*') {
    advance(2);
    while (i < src.length && !(src[i] === '*' && src[i+1] === '/')) advance();
    advance(2);
    continue;
  }
  // Skip strings
  if (ch === '"' || ch === "'" || ch === '`') {
    const quote = ch;
    advance();
    while (i < src.length) {
      if (src[i] === '\\') { advance(2); continue; }
      if (src[i] === quote) { advance(); break; }
      // Template literal interpolation: skip ${...} content but still parse braces inside
      if (quote === '`' && src[i] === '$' && src[i+1] === '{') {
        advance(2);
        // parse until matching }
        const inner = [];
        while (i < src.length && !(src[i] === '}' && inner.length === 0)) {
          const c = src[i];
          if (c === '{') inner.push('{');
          else if (c === '}') inner.pop();
          else if (c === '"' || c === "'") {
            const q = c; advance();
            while (i < src.length) { if (src[i] === '\\') { advance(2); } else if (src[i] === q) { advance(); break; } else { advance(); } }
            continue;
          }
          advance();
        }
        if (src[i] === '}') advance();
        continue;
      }
      advance();
    }
    continue;
  }
  if (open.has(ch)) {
    stack.push({ ch, i, line });
    advance();
    continue;
  }
  if (closeMap.has(ch)) {
    if (!stack.length || stack[stack.length-1].ch !== closeMap.get(ch)) {
      console.log('Mismatch at line', line, 'index', i, 'char', ch, 'stackTop', stack[stack.length-1]);
      process.exit(1);
    }
    stack.pop();
    advance();
    continue;
  }
  advance();
}
if (stack.length) {
  const top = stack[stack.length-1];
  console.log('Unclosed starting at line', top.line, 'index', top.i, 'char', top.ch, 'openCount', stack.length);
  process.exit(2);
}
console.log('Balanced');
