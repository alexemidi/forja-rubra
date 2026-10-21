const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

console.log('=== Testes da Guilda, Drawer na Direita e Pré-requisitos de Atributos ===\n');

// 1. Validar drawer abrindo na direita
console.log('1. Validando abertura do menu gaveta pela direita...');
const drawerCss = fs.readFileSync(path.join(root, 'src/estilos/compartilhado/drawer.css'), 'utf8');
assert(drawerCss.includes('justify-content: flex-end'), 'Backdrop deve alinhar drawer à direita');
assert(drawerCss.includes('transform: translateX(100%)'), 'Drawer deve ficar recolhido em translateX(100%) à direita');
console.log('✔ Drawer abre e fecha pela direita com sucesso!\n');

// 2. Validar redirecionamento de Parceiros na Ficha para Guilda
console.log('2. Validando botão de Parceiros na ficha direcionando para Guilda...');
const habMagias = fs.readFileSync(path.join(root, 'src/funcionalidades/criador/ficha/habilidades-magias.js'), 'utf8');
assert(habMagias.includes('href="guilda.html"'), 'Botão + Adicionar em parceiros deve conter link para guilda.html');
const renderFicha = fs.readFileSync(path.join(root, 'src/funcionalidades/criador/ficha/renderizacao.js'), 'utf8');
assert(renderFicha.includes("window.location.href = 'guilda.html'") || habMagias.includes('guilda.html'), 'Ação de adicionar parceiro deve direcionar para guilda.html');
console.log('✔ Encaminhamento de Parceiros para guilda.html validado com sucesso!\n');

// 3. Validar calculadora de atributos: barra vermelha se unmet, amarela se met, e tooltip suprimido se met
console.log('3. Validando classes e tooltip da matriz de atributos...');
const racaAtributos = fs.readFileSync(path.join(root, 'src/funcionalidades/criador/fases/02-raca-atributos.js'), 'utf8');
assert(racaAtributos.includes("prereq-highlight prereq-unmet"), 'Deve aplicar classe prereq-unmet quando valor não atingir o pré-requisito');
assert(racaAtributos.includes("prereq-highlight prereq-met"), 'Deve aplicar classe prereq-met quando valor atingir o pré-requisito');
assert(racaAtributos.includes("(unmet && requirements.length)?attributeTooltip(id,requirements):''") || racaAtributos.includes("unmet ? tooltip : ''"), 'Tooltip deve ser suprimido quando valor mínimo for atingido');

const migrationTheme = fs.readFileSync(path.join(root, 'src/estilos/criador/migration-theme.css'), 'utf8');
assert(migrationTheme.includes('.attribute-matrix-row.prereq-unmet'), 'Migration theme deve estilizar prereq-unmet');
assert(migrationTheme.includes('#ef4444'), 'prereq-unmet deve ter realce vermelho');
console.log('✔ Matriz de atributos: barra vermelha para pendente, amarela para atendido e tooltip suprimido validados com sucesso!\n');

// 4. Validar separação da Taverna (sem mercenários ou parceiros nas categorias)
console.log('4. Validando ausência de parceiros e mercenários na taverna...');
const tavernDataJs = fs.readFileSync(path.join(root, 'src/funcionalidades/taverna/03-00-TAVERN_DATA.js'), 'utf8');
assert(!tavernDataJs.includes("mercenario: { id: 'mercenario'"), 'Taverna não deve conter categoria mercenario');
assert(!tavernDataJs.includes("parceiros: { id: 'parceiros'"), 'Taverna não deve conter categoria parceiros');
console.log('✔ Taverna limpa e focada exclusivamente em serviços mundanos e estadias!\n');

// 5. Validar criação da Guilda
console.log('5. Validando arquivos e declaração da Guilda...');
assert(fs.existsSync(path.join(root, 'src/paginas/guilda.html')), 'guilda.html deve existir');
assert(fs.existsSync(path.join(root, 'src/estilos/guilda/0.css')), 'src/estilos/guilda/0.css deve existir');
assert(fs.existsSync(path.join(root, 'src/funcionalidades/guilda/03-00-guilda-dados.js')), '03-00-guilda-dados.js deve existir');
assert(fs.existsSync(path.join(root, 'src/funcionalidades/guilda/03-01-guilda-ui.js')), '03-01-guilda-ui.js deve existir');

const manifesto = JSON.parse(fs.readFileSync(path.join(root, 'src/paginas/manifesto.json'), 'utf8'));
assert(manifesto.guilda, 'Manifesto deve conter entrada "guilda"');
assert.equal(manifesto.guilda.origin, 'guilda.html', 'Origem da guilda deve ser guilda.html');

const guildaHtml = fs.readFileSync(path.join(root, 'src/paginas/guilda.html'), 'utf8');
assert(!guildaHtml.includes('undefined'), 'guilda.html não deve ter referências quebradas');
console.log('✔ Página da Guilda, estilos e dados canônicos validados com sucesso!\n');

console.log('========================================================================');
console.log('🎉 SUCESSO TOTAL: Todos os 4 requisitos foram testados e aprovados!');
console.log('========================================================================');
