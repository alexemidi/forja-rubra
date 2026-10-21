const fs = require('fs');

const path = 'src/funcionalidades/criador/ficha/renderizacao.js';
let s = fs.readFileSync(path, 'utf8');

s = s.replace(/skillTotalVal = '<span aria-label="Exige treinamento">❌<\/span>';/g, `skillTotalVal = '<span aria-label="Exige treinamento" style="color:var(--red,#ef4444);font-weight:700">—</span>';`);
s = s.replace(/<span class="rest-card-moon">🌙<\/span>/g, `<span class="rest-card-moon">\${window.IconesForja ? window.IconesForja.get('bed', 'icon-sm') : ''}</span>`);
s = s.replace(/>✕<\/button>/g, '>×<\/button>');
s = s.replace(/✎ Trocar/g, 'Trocar');
s = s.replace(/✕ Fechar Temp/g, '× Fechar Temp');
s = s.replace(/title="Editar '\+label\+' manualmente">✎<\/button>/g, `title="Editar '+label+' manualmente">Modificar<\/button>`);
s = s.replace(/>✕<\/span>/g, '>×<\/span>');
s = s.replace(/>✕ /g, '>× ');
s = s.replace(/style="background:[^"]*">✕<\/button>/g, match => match.replace('✕', '×'));

fs.writeFileSync(path, s, 'utf8');
console.log('renderizacao.js 100% limpo!');
