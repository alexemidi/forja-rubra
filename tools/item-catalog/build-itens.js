const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(__dirname, 'src', file), 'utf8');
const script = ['catalog-data.js', 'runtime.js'].map(read).join('');
new Function(script);
const html = read('interface.html').replace('/*__STYLES__*/', () => read('styles.css')).replace('/*__SCRIPT__*/', () => script);
fs.writeFileSync(path.join(root, 'Arsenal de Arton.html'), html);
console.log(JSON.stringify({output: 'Arsenal de Arton.html', bytes: Buffer.byteLength(html)}));
