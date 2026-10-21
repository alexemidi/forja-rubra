const fs = require('fs');

// 1. Limpar manufatura.js
let manu = fs.readFileSync('src/regras/nucleo/manufatura.js', 'utf8');
manu = manu.replace(/icon:\s*'[^']*'/g, "icon: 'tools'");
fs.writeFileSync('src/regras/nucleo/manufatura.js', manu, 'utf8');
console.log('manufatura.js limpo!');

// 2. Limpar oficina-oficios.js
let ofi = fs.readFileSync('src/funcionalidades/criador/ficha/oficina-oficios.js', 'utf8');
ofi = ofi.replace(/<span style="font-size: 1.5rem;">🛠️<\/span>/g, '<span style="font-size: 1.5rem;" class="oficina-header-icon"></span>');
ofi = ofi.replace(/<span style="font-size: 1.1rem;">👁️<\/span>/g, '');
ofi = ofi.replace(/<span style="font-size: 1.1rem;">🔨<\/span>/g, '');
ofi = ofi.replace(/<div style="font-size: 2rem; margin-bottom: 8px;">🛠️<\/div>/g, '<div style="font-size: 2rem; margin-bottom: 8px;"></div>');
ofi = ofi.replace(/<span>👁️<\/span>/g, '');
ofi = ofi.replace(/🔨 Entrar na Oficina \(Fabricar\) →/g, 'Entrar na Oficina (Fabricar) →');
ofi = ofi.replace(/\$\{sec\.icon \|\| '🛠️'\}/g, '');
ofi = ofi.replace(/<span style="font-size: 1.4rem;">⚙️<\/span>/g, '');
ofi = ofi.replace(/<span style="font-size: 1.25rem;">⚙️<\/span>/g, '');
ofi = ofi.replace(/<span style="font-size: 1.25rem;">🔨<\/span>/g, '');
ofi = ofi.replace(/<span>📜<\/span>/g, '');
ofi = ofi.replace(/<span style="font-size: 1rem;">🔗<\/span>/g, '');
ofi = ofi.replace(/🎒 Usando item da mochila \(sem custo ou tempo adicional\)/g, 'Usando item da mochila (sem custo ou tempo adicional)');
ofi = ofi.replace(/⚒️ Forjando novo item/g, 'Forjando novo item');
ofi = ofi.replace(/<span>🔨<\/span> Forjar em item/g, 'Forjar em item');
ofi = ofi.replace(/🛠️/g, '');
ofi = ofi.replace(/⚙️/g, '');
ofi = ofi.replace(/🔨/g, '');
ofi = ofi.replace(/✓ /g, '');
fs.writeFileSync('src/funcionalidades/criador/ficha/oficina-oficios.js', ofi, 'utf8');
console.log('oficina-oficios.js limpo!');

// 3. Limpar teste-oficio-modal.js
let testOfi = fs.readFileSync('src/funcionalidades/criador/ficha/teste-oficio-modal.js', 'utf8');
testOfi = testOfi.replace(/statusIcon = '✓';/g, "statusIcon = 'Sucesso';");
testOfi = testOfi.replace(/statusIcon = '✕';/g, "statusIcon = 'Falha';");
testOfi = testOfi.replace(/statusIcon = '☠';/g, "statusIcon = 'Falha Crítica';");
testOfi = testOfi.replace(/🎲 Rolar d20/g, 'Rolar d20');
testOfi = testOfi.replace(/⚙️ Engenhosidade/g, 'Engenhosidade');
testOfi = testOfi.replace(/✓ Engenhosidade Ativa/g, 'Engenhosidade Ativa');
fs.writeFileSync('src/funcionalidades/criador/ficha/teste-oficio-modal.js', testOfi, 'utf8');
console.log('teste-oficio-modal.js limpo!');

// 4. Limpar loja-taverna-recompensas.js
let rec = fs.readFileSync('src/funcionalidades/criador/ficha/loja-taverna-recompensas.js', 'utf8');
rec = rec.replace(/🧪 Laboratório do Alquimista/g, 'Laboratório do Alquimista');
rec = rec.replace(/📜 Escritório do Escriba/g, 'Escritório do Escriba');
rec = rec.replace(/✨ Estúdio do Tatuador/g, 'Estúdio do Tatuador');
rec = rec.replace(/⚙️ Oficina do Engenhoqueiro/g, 'Oficina do Engenhoqueiro');
rec = rec.replace(/\$\{sec\.icon \|\| '🛠️'\} \$\{sec\.title\}/g, '${sec.title}');
rec = rec.replace(/\$\{sec\.icon\|\|'🛠️'\} \$\{sec\.title\}/g, '${sec.title}');
rec = rec.replace(/icon:\s*'🛠️'/g, "icon: ''");
rec = rec.replace(/aria-label="Fechar">✕<\/button>/g, 'aria-label="Fechar">×<\/button>');
fs.writeFileSync('src/funcionalidades/criador/ficha/loja-taverna-recompensas.js', rec, 'utf8');
console.log('loja-taverna-recompensas.js limpo!');
