const fs = require('fs');
const vm = require('vm');
const path = require('path');
const file = path.resolve(__dirname, '..', 'js', 'app.js');
const code = fs.readFileSync(file, 'utf8');
try {
  new vm.Script(code, { filename: 'app.js' });
  // console.log('Parse OK');
} catch (e) {
  // console.log('Parse error:', e.message);
  // if (e.stack) console.log(String(e.stack).split('\n')[0]);
}
