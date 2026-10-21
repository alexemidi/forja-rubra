const fs = require('fs');
const path = require('path');

const dir = 'src/funcionalidades/loja';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));

const replacements = [
  { from: /🎁 Recompensa/g, to: 'Recompensa' },
  { from: /🏪 Loja/g, to: 'Loja' },
  { from: /🛒 Carrinho/g, to: 'Carrinho' },
  { from: /🎒 Mochila/g, to: 'Mochila' },
  { from: /👁️ Apenas Consulta/g, to: 'Apenas Consulta' },
  { from: /💰 Saldo disponível:/g, to: 'Saldo disponível:' },
  { from: /🪙 <strong>/g, to: '<strong>' },
  { from: /✨ <strong>/g, to: '<strong>' },
  { from: /⚙️ <strong>/g, to: '<strong>' },
  { from: /🎲 <strong>/g, to: '<strong>' },
  { from: /⏱️ <strong>/g, to: '<strong>' },
  { from: /🛡️ <strong>/g, to: '<strong>' },
  { from: /🔨 <strong>/g, to: '<strong>' },
  { from: /<span aria-hidden="true">🛒<\/span>/g, to: '' },
  { from: /<span aria-hidden="true">📖<\/span>/g, to: '' },
  { from: /<span aria-hidden="true">📜<\/span>/g, to: '' },
  { from: /<span aria-hidden="true">✨<\/span>/g, to: '' },
  { from: /<span aria-hidden="true">⚙️<\/span>/g, to: '' },
  { from: /<span aria-hidden="true">🎒<\/span>/g, to: '' },
  { from: /<span>🎒<\/span>/g, to: '' },
  { from: /<span>⚙️<\/span>/g, to: '' },
  { from: /<span>⚒️<\/span>/g, to: '' },
  { from: /⚙️ /g, to: '' },
  { from: /⚒️ /g, to: '' },
  { from: /🔨 /g, to: '' },
  { from: /✨ /g, to: '' },
  { from: /🔒 /g, to: '' },
  { from: /⚠️ /g, to: '' },
  { from: /🎒 /g, to: '' },
  { from: /🛒 /g, to: '' },
  { from: />🔨</g, to: '>Forjar<' },
  { from: />✨</g, to: '>Encantar<' },
  { from: />⚒️</g, to: '>Ofício<' },
  { from: /icon:\s*'📦'/g, to: "icon: ''" },
  { from: /icon:\s*'🎒'/g, to: "icon: ''" },
  { from: /icon:\s*'⚙️'/g, to: "icon: ''" },
  { from: />🧪</g, to: '><' },
  { from: />📜</g, to: '><' },
  { from: />✨</g, to: '><' },
  { from: />⚙️</g, to: '><' },
  { from: /✓ /g, to: '' },
  { from: /✓/g, to: '' }
];

files.forEach(file => {
  const fullPath = path.join(dir, file);
  let content = fs.readFileSync(fullPath, 'utf8');
  let count = 0;
  replacements.forEach(r => {
    const matches = (content.match(r.from) || []).length;
    if (matches > 0) {
      count += matches;
      content = content.replace(r.from, r.to);
    }
  });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`${file}: ${count} substituições realizadas`);
});
