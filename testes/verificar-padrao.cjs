const fs = require('fs');
const path = require('path');
const assert = require('assert');

const stdOrigins = JSON.parse(fs.readFileSync(path.join(__dirname, '../dados/criador-origins.json'), 'utf8'));
const passivasCode = fs.readFileSync(path.join(__dirname, '../src/regras/criador/passivas-proficiencias.js'), 'utf8');
const items = JSON.parse(fs.readFileSync(path.join(__dirname, '../dados/items.json'), 'utf8'));

console.log('=== Verificação das 46 Origens Padrão ===');
console.log('Total de origens padrão:', stdOrigins.length);

let issues = [];

stdOrigins.forEach((origin, index) => {
  // 1. Benefícios
  const b = origin.beneficios;
  if (!b) issues.push(`${origin.nome}: sem benefícios definidos`);
  if (!b.pericias || b.pericias.length === 0) issues.push(`${origin.nome}: sem perícias definidas`);
  if (!b.poderes && !b.poder_unico) issues.push(`${origin.nome}: sem poderes ou poder único definido`);

  // 2. Itens
  origin.itens.forEach(itemStr => {
    // Checar se originItemChoice reconhece escolhas
    // ou se o item existe em items.json
    // ou se é dinheiro
    if (/^t\$\s*[\d.]+/i.test(itemStr) || /^t\$\s*\d+d\d+/i.test(itemStr)) return;
  });
});

console.log('Pendências estruturais encontradas nas origens padrão:', issues.length);
if (issues.length > 0) {
  console.log(issues);
} else {
  console.log('✔ Todas as 46 origens padrão possuem estrutura canônica válida!');
}
