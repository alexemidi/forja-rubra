const fs = require('fs');
const path = require('path');

const jsPath = 'Mapa Interativo de Tamura _ Fichas de Nimb_files/index-8ade9074.js.download';
if (!fs.existsSync(jsPath)) {
  console.log('Arquivo não encontrado:', jsPath);
  process.exit(1);
}

const content = fs.readFileSync(jsPath, 'utf8');
console.log('Tamanho do bundle JS:', content.length);

// Procurar URLs de tiles
const reTiles = /https:\/\/[^\s"'`]+map_tiles[^\s"'`]+/g;
const tileMatches = Array.from(new Set(content.match(reTiles) || []));
console.log('Tile URLs:', tileMatches);

// Procurar menções de 'Tamura', 'Lamnor', 'Doherimm', 'Moreania' em objetos ou arrays
const keywords = ['tamura', 'lamnor', 'doherimm', 'moreania'];
keywords.forEach(kw => {
  let idx = 0;
  let count = 0;
  while ((idx = content.toLowerCase().indexOf(kw, idx)) !== -1) {
    count++;
    if (count <= 3) {
      const start = Math.max(0, idx - 100);
      const end = Math.min(content.length, idx + 200);
      console.log(`\n--- Match [${kw}] (${idx}) ---`);
      console.log(content.substring(start, end));
    }
    idx += kw.length;
  }
  console.log(`Total de ocorrências de ${kw}:`, count);
});
