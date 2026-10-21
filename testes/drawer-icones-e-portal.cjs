/**
 * TESTE UNITÁRIO E DE INTEGRAÇÃO:
 * Validação do Menu Lateral Drawer, Catálogo de Ícones Vetoriais SVG (Sem emojis),
 * e Repaginação Limpa da Landing Page (Apenas Forja Rubra).
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert');
const { JSDOM } = require('jsdom');

const root = path.resolve(__dirname, '..');

console.log('=== Testes do Menu Drawer, Ícones Vetoriais e Portal Forja Rubra ===\n');

// -----------------------------------------------------------------------------
// 1. Validação da Landing Page (src/paginas/index.html)
// -----------------------------------------------------------------------------
console.log('1. Validando index.html (título, ausência de Tormenta20/Portal e emojis)...');
const indexHtml = fs.readFileSync(path.join(root, 'src/paginas/index.html'), 'utf8');

// Título principal deve ser Forja Rubra
assert.ok(indexHtml.includes('<h1 class="landing-main-title">Forja Rubra</h1>'), 'Título principal deve ser Forja Rubra');
assert.ok(!indexHtml.includes('Tormenta20 · Forja Rubra'), 'Não deve conter "Tormenta20 · Forja Rubra"');
assert.ok(!indexHtml.includes('>Portal do Aventureiro<'), 'Não deve conter "Portal do Aventureiro" como título');

// Proibição de emojis em textos e botões
const emojisProibidos = ['⚔️', '👥', '🔥', '📜', '🏛️', '📖', '🏪', '🍺', '🗑️', '🔮', '🪓', '🪕', '🗡️', '🏹', '🛡️', '✨', '🌿', '⚙️', '🗝️', '🥊', '👑', '⚜️'];
for (const emoji of emojisProibidos) {
  assert.ok(!indexHtml.includes(emoji), `index.html não deve conter o emoji ${emoji}`);
}

// Inclusão dos estilos e top bar
assert.ok(indexHtml.includes('src/estilos/compartilhado/icones.css'), 'Deve conter link para icones.css');
assert.ok(indexHtml.includes('src/estilos/compartilhado/drawer.css'), 'Deve conter link para drawer.css');
assert.ok(indexHtml.includes('class="portal-top-bar"'), 'Deve conter a barra superior portal-top-bar');
assert.ok(indexHtml.includes('id="drawerMenuBtn"'), 'Deve conter o botão hambúrguer do drawer');
assert.ok(indexHtml.includes('id="forjaAuthContainer"'), 'Deve conter o container de autenticação');
console.log('✔ index.html validado com sucesso!\n');

// -----------------------------------------------------------------------------
// 2. Validação do Catálogo de Ícones Vetoriais SVG (src/compartilhado/icones.js)
// -----------------------------------------------------------------------------
const iconesPath = fs.existsSync(path.join(root, 'src/compartilhado/icones.ts'))
  ? path.join(root, 'src/compartilhado/icones.ts')
  : path.join(root, 'src/compartilhado/icones.js');
const iconesCode = fs.readFileSync(iconesPath, 'utf8');

const domIcones = new JSDOM('<!DOCTYPE html><html><body></body></html>', { runScripts: 'dangerously' });
domIcones.window.eval(iconesCode);
const IconesForja = domIcones.window.IconesForja;

assert.ok(IconesForja, 'Objeto global IconesForja deve estar disponível');
assert.strictEqual(typeof IconesForja.get, 'function', 'IconesForja.get deve ser função');

const iconesObrigatorios = [
  'menu', 'close', 'door-exit', 'users', 'user', 'sword', 'flame',
  'book', 'store', 'beer', 'paw', 'wrench', 'dice', 'sync', 'plus',
  'axe', 'bow', 'shield', 'sparkles', 'crown', 'fist', 'music', 'trash', 'scroll'
];

for (const nome of iconesObrigatorios) {
  assert.ok(IconesForja.names.includes(nome), `Ícone "${nome}" deve estar no catálogo de ícones`);
  const svg = IconesForja.get(nome, 'icon-md icon-gold');
  assert.ok(svg.startsWith('<svg'), `Ícone "${nome}" deve retornar elemento SVG`);
  assert.ok(svg.includes('class="forja-svg icon-md icon-gold"'), `Ícone "${nome}" deve receber as classes customizadas`);
  assert.ok(svg.includes('viewBox="0 0 24 24"'), `Ícone "${nome}" deve possuir viewBox 24x24`);
}
console.log('✔ Catálogo de ícones vetoriais (24 ícones SVG) validado com sucesso!\n');

// -----------------------------------------------------------------------------
const drawerPath = fs.existsSync(path.join(root, 'src/compartilhado/drawer/drawer-ui.ts'))
  ? path.join(root, 'src/compartilhado/drawer/drawer-ui.ts')
  : path.join(root, 'src/compartilhado/drawer/drawer-ui.js');
const drawerCode = fs.readFileSync(drawerPath, 'utf8');

const domDrawer = new JSDOM(`
  <!DOCTYPE html>
  <html>
    <head></head>
    <body>
      <header class="app-header">
        <a class="brand" href="index.html"><h1>Forja Rubra</h1></a>
      </header>
    </body>
  </html>
`, { runScripts: 'dangerously' });

// Injetar ícones e mock do módulo de auth
domDrawer.window.eval(iconesCode);
domDrawer.window.ModuloAuth = {
  obterServicoAutenticacao: () => ({
    obterUsuarioAtual: () => ({
      email: 'heroi@arton.com',
      user_metadata: { full_name: 'Paladino de Khalmyr', avatar_url: 'https://exemplo.com/avatar.png' }
    }),
    logout: async () => { logoutChamado = true; },
    aoMudarEstado: () => {}
  })
};

let logoutChamado = false;
domDrawer.window.eval(drawerCode);
domDrawer.window.dispatchEvent(new domDrawer.window.Event('forja-ready'));

const ForjaDrawer = domDrawer.window.ForjaDrawer;
assert.ok(ForjaDrawer, 'Objeto window.ForjaDrawer deve estar disponível');
assert.strictEqual(typeof ForjaDrawer.abrir, 'function', 'ForjaDrawer.abrir deve ser função');
assert.strictEqual(typeof ForjaDrawer.fechar, 'function', 'ForjaDrawer.fechar deve ser função');

// Abrir a gaveta
ForjaDrawer.abrir();
const backdrop = domDrawer.window.document.getElementById('forjaDrawerBackdrop');
const drawer = domDrawer.window.document.getElementById('forjaDrawer');
assert.ok(backdrop, 'Backdrop do drawer deve existir no DOM');
assert.ok(drawer, 'Elemento aside do drawer deve existir no DOM');
assert.strictEqual(backdrop.hidden, false, 'Backdrop deve estar visível');
assert.ok(drawer.classList.contains('is-open'), 'Drawer deve possuir a classe is-open');

// Verificar dados do usuário logado renderizados no Drawer
const userName = drawer.querySelector('.drawer-user-name');
assert.strictEqual(userName.textContent, 'Paladino de Khalmyr', 'Nome do usuário deve ser exibido no drawer');

// Verificar botão de logout com a portinha
const logoutBtn = drawer.querySelector('#drawerDoorLogoutBtn');
assert.ok(logoutBtn, 'Botão de logout com a portinha (#drawerDoorLogoutBtn) deve existir');
assert.ok(logoutBtn.innerHTML.includes('door-exit') || logoutBtn.innerHTML.includes('<svg'), 'Botão deve conter o ícone SVG de saída');

// Executar logout imediato sem pop-up
logoutBtn.click();
assert.strictEqual(logoutChamado, true, 'Logout deve ser executado diretamente sem window.confirm');

// Fechar a gaveta
ForjaDrawer.fechar();
assert.strictEqual(drawer.classList.contains('is-open'), false, 'Drawer deve remover classe is-open ao fechar');
console.log('✔ Menu Drawer e Logout com a portinha validados com sucesso!\n');

// -----------------------------------------------------------------------------
// 4. Validação dos scripts do manifesto e 00-00-portal.js
// -----------------------------------------------------------------------------
console.log('4. Validando manifesto.json e scripts do portal...');
const manifesto = JSON.parse(fs.readFileSync(path.join(root, 'src/paginas/manifesto.json'), 'utf8'));

assert.ok(manifesto.index.scripts[0].some(s => s.includes('src/compartilhado/icones')), 'index deve carregar icones');
assert.ok(manifesto.index.scripts[0].some(s => s.includes('src/compartilhado/drawer/drawer-ui')), 'index deve carregar drawer-ui');
assert.ok(manifesto.criador.scripts[0].some(s => s.includes('src/compartilhado/icones')), 'criador deve carregar icones');
assert.ok(manifesto.criador.scripts[0].some(s => s.includes('src/compartilhado/drawer/drawer-ui')), 'criador deve carregar drawer-ui');
assert.ok(manifesto.ficha.scripts[0].some(s => s.includes('src/compartilhado/icones')), 'ficha deve carregar icones');
assert.ok(manifesto.ficha.scripts[0].some(s => s.includes('src/compartilhado/drawer/drawer-ui')), 'ficha deve carregar drawer-ui');

const portalPath = fs.existsSync(path.join(root, 'src/funcionalidades/index/00-00-portal.ts'))
  ? path.join(root, 'src/funcionalidades/index/00-00-portal.ts')
  : path.join(root, 'src/funcionalidades/index/00-00-portal.js');
const portalJs = fs.readFileSync(portalPath, 'utf8');
assert.ok(!portalJs.includes("'🔮'"), '00-00-portal.js não deve conter emojis nas classes');
assert.ok(!portalJs.includes('>🗑️<'), '00-00-portal.js não deve conter emoji de lixeira');
console.log('✔ Manifesto e scripts do portal validados com sucesso!\n');

console.log('======================================================');
console.log('🎉 SUCESSO TOTAL: Drawer, Ícones e Repaginação Aprovados!');
console.log('======================================================\n');
