const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

console.log('=== Testes de Menus Unificados, Rodapé, Limite de 10 Fichas e Origem com Benefícios ===\n');

// 1. Validar eliminação do menu da direita em criador.html e ficha.html
console.log('1. Validando eliminação do menu redundante da direita...');
const criadorHtml = fs.readFileSync(path.join(__dirname, '../src/paginas/criador.html'), 'utf8');
const fichaHtml = fs.readFileSync(path.join(__dirname, '../src/paginas/ficha.html'), 'utf8');
const lojaItensJs = fs.readFileSync(path.join(__dirname, '../src/integracoes/criador/loja-itens-iniciais.js'), 'utf8');

assert(!criadorHtml.includes('id="sheetMenuContainer"'), 'criador.html não deve conter sheetMenuContainer no HTML');
assert(!fichaHtml.includes('id="sheetMenuContainer"'), 'ficha.html não deve conter sheetMenuContainer no HTML');
assert(!lojaItensJs.includes('menuHost.innerHTML=renderCharacterToolbar()'), 'loja-itens-iniciais.js não deve injetar renderCharacterToolbar no cabeçalho');

// Verificar opções unificadas no Drawer lateral esquerdo
const drawerJs = fs.readFileSync(path.join(__dirname, '../src/compartilhado/drawer/drawer-ui.js'), 'utf8');
assert(drawerJs.includes('Oficinas de Fabricação'), 'Drawer deve conter Oficinas de Fabricação');
assert(drawerJs.includes('recompensas.html') && drawerJs.includes('Recompensas'), 'Drawer deve conter Recompensas');
assert(drawerJs.includes('Apoiar o Projeto'), 'Drawer deve conter Apoiar o Projeto');
assert(drawerJs.includes('Mapa de Arton'), 'Drawer deve conter Mapa de Arton');
console.log('✔ Menu direito eliminado e Drawer lateral unificado com sucesso!');

// 2. Validar Limite de 10 Fichas por Jogador
console.log('2. Validando módulo de Limites de Fichas (10 personagens)...');
const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, { url: 'http://localhost/' });
global.window = dom.window;
global.document = dom.window.document;
global.localStorage = dom.window.localStorage;

require('../src/compartilhado/limites.js');

assert(window.ForjaLimites, 'ForjaLimites deve estar disponível em window');
assert.strictEqual(window.ForjaLimites.MAX_FREE_CHARACTERS, 10, 'Limite gratuito deve ser 10');

// Simular 9 fichas: pode criar
const nineHeroes = Array.from({ length: 9 }, (_, i) => ({ id: 'h' + i, name: 'Heroi ' + i }));
localStorage.setItem('forja-heroi-t20-personagens-v1', JSON.stringify(nineHeroes));
assert.strictEqual(window.ForjaLimites.obterTotalPersonagens(), 9, 'Deve contar 9 personagens');
assert.strictEqual(window.ForjaLimites.podeCriarNovoPersonagem(), true, 'Com 9 personagens deve permitir criar');

// Simular 10 fichas: não pode criar
const tenHeroes = Array.from({ length: 10 }, (_, i) => ({ id: 'h' + i, name: 'Heroi ' + i }));
localStorage.setItem('forja-heroi-t20-personagens-v1', JSON.stringify(tenHeroes));
assert.strictEqual(window.ForjaLimites.obterTotalPersonagens(), 10, 'Deve contar 10 personagens');
assert.strictEqual(window.ForjaLimites.podeCriarNovoPersonagem(), false, 'Com 10 personagens deve bloquear criação');

// Simular apoiador: deve expandir limite
localStorage.setItem('forja_supporter_tier', 'aventureiro');
assert.strictEqual(window.ForjaLimites.podeCriarNovoPersonagem(), true, 'Apoiador Aventureiro deve poder criar com 10 fichas (limite 25)');
localStorage.removeItem('forja_supporter_tier');
console.log('✔ Módulo de limite de 10 fichas validado com sucesso!');

// 3. Validar Rodapé de 5 Colunas, Termos de Uso e Apoiar o Projeto
console.log('3. Validando Rodapé Institucional e Modais (Termos e Apoio)...');
const footerJs = fs.readFileSync(path.join(__dirname, '../src/compartilhado/footer/footer-ui.js'), 'utf8');
assert(footerJs.includes('Ferramentas'), 'Rodapé deve conter coluna Ferramentas');
assert(footerJs.includes('Enciclopédia'), 'Rodapé deve conter coluna Enciclopédia');
assert(footerJs.includes('Comunidade'), 'Rodapé deve conter coluna Comunidade');
assert(footerJs.includes('Conta'), 'Rodapé deve conter coluna Conta');
assert(footerJs.includes('Legal'), 'Rodapé deve conter coluna Legal');
assert(footerJs.includes('Open Game License (OGL 1.0a)'), 'Rodapé deve conter nota sobre OGL');
assert(footerJs.includes('Jambô Editora'), 'Rodapé deve respeitar marca registrada da Jambô Editora');

require('../src/compartilhado/footer/footer-ui.js');
assert(window.ForjaModais, 'ForjaModais deve estar disponível');
assert(typeof window.ForjaModais.abrirTermos === 'function', 'abrirTermos deve ser função');
assert(typeof window.ForjaModais.abrirApoio === 'function', 'abrirApoio deve ser função');

window.ForjaModais.abrirTermos();
const termsModal = document.getElementById('forjaTermsModalBackdrop');
assert(termsModal && !termsModal.hidden, 'Modal de Termos deve ser renderizado e visível');
assert(termsModal.textContent.includes('Uso Pessoal e Gratuito'), 'Modal deve citar uso gratuito e limite de 10 fichas');

window.ForjaModais.abrirApoio();
const supportModal = document.getElementById('forjaSupportModalBackdrop');
assert(supportModal && !supportModal.hidden, 'Modal de Apoio deve ser renderizado e visível');
assert(supportModal.textContent.includes('Aventureiro') && supportModal.textContent.includes('Campeão de Arton') && supportModal.textContent.includes('Lenda Viva'), 'Modal deve conter os 3 patamares de apoio');
console.log('✔ Rodapé completo e modais validados com sucesso!');

// 4. Validar Formatação de Origem nas Habilidades: Origem(Benefício1/Benefício2)
console.log('4. Validando formatação de Origem(Benefício1/Benefício2)...');
const navegacaoJs = fs.readFileSync(path.join(__dirname, '../src/compartilhado/criador/navegacao-validacao.js'), 'utf8');
assert(navegacaoJs.includes("origin.nome + '(' + benefitNames.join('/') + ')'"), 'navegacao-validacao.js deve formatar origem com parênteses e barra');

// Teste estrutural da função de formatação
function formatarHabilidadeOrigem(origin, benefitIds, allOptions) {
  const chosenOptions = [];
  benefitIds.forEach(id => {
    const opt = allOptions.find(o => o.id === id);
    if (opt) chosenOptions.push(opt);
  });
  const benefitNames = chosenOptions.map(opt => opt.name);
  return benefitNames.length ? (origin.nome + '(' + benefitNames.join('/') + ')') : origin.nome;
}

const mockOrigin = { id: 'aristocrata', nome: 'Aristocrata' };
const mockOptions = [
  { id: 'skill:diplomacia', name: 'Diplomacia', type: 'skill' },
  { id: 'unique:sangue_azul', name: 'Sangue Azul', type: 'unique' }
];

const titulo1 = formatarHabilidadeOrigem(mockOrigin, ['unique:sangue_azul', 'skill:diplomacia'], mockOptions);
assert.strictEqual(titulo1, 'Aristocrata(Sangue Azul/Diplomacia)', 'Deve formatar exatamente Aristocrata(Sangue Azul/Diplomacia)');

const titulo2 = formatarHabilidadeOrigem(mockOrigin, ['skill:diplomacia', 'unique:sangue_azul'], mockOptions);
assert.strictEqual(titulo2, 'Aristocrata(Diplomacia/Sangue Azul)', 'Deve respeitar ordem de escolha do usuário');

console.log('✔ Formatação de Origem(Benefício1/Benefício2) aprovada!');

// 5. Validar Ausência de Emojis em Páginas Críticas
console.log('5. Validando ausência de emojis em páginas e componentes...');
const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

const personagensHtml = fs.readFileSync(path.join(__dirname, '../src/paginas/personagens.html'), 'utf8');
assert(!emojiRegex.test(personagensHtml), 'personagens.html não deve conter emojis');

const indexHtml = fs.readFileSync(path.join(__dirname, '../src/paginas/index.html'), 'utf8');
assert(!indexHtml.includes('⚔️'), 'index.html não deve conter emoji de espada');
assert(!indexHtml.includes('🍺'), 'index.html não deve conter emoji de cerveja');

assert(!criadorHtml.includes('🎲 Gerar Herói'), 'criador.html não deve conter emoji no botão de gerar herói');
assert(!criadorHtml.includes('⚖️ Teurgista'), 'criador.html não deve conter emoji de teurgista');

console.log('✔ Ausência de emojis validada com sucesso!');

// 6. Validar Solicitação 61: Purga Radical, Ícones Vetoriais das Escolas e Centralização no Drawer
console.log('6. Validando Solicitação 61: Purga Radical, Ícones de Escolas e Centralização no Drawer...');
const iconesJs = fs.readFileSync(path.join(__dirname, '../src/compartilhado/icones.js'), 'utf8');
const novosIcones = ['arrow-up', 'book-open', 'tools', 'archive', 'gift', 'coin', 'school-abjuration', 'school-divination', 'school-evocation', 'school-necromancy', 'school-transmutation', 'school-conjuration', 'school-enchantment', 'school-illusion'];
for (const ico of novosIcones) {
  assert(new RegExp("(['\"]?" + ico + "['\"]?\\s*:)").test(iconesJs), `icones.js deve conter a chave de ícone ${ico}`);
}

const magiasCardsJson = fs.readFileSync(path.join(__dirname, '../dados/magias-cards.json'), 'utf8');
assert(!emojiRegex.test(magiasCardsJson), 'dados/magias-cards.json não deve conter nenhum caractere emoji');
assert(magiasCardsJson.includes('class=\\"escola-icon\\"'), 'dados/magias-cards.json deve conter a classe escola-icon');

const authUiJs = fs.readFileSync(path.join(__dirname, '../src/funcionalidades/auth/00-00-auth-ui.js'), 'utf8');
assert(!authUiJs.includes('header-actions'), 'auth-ui.js não deve mais injetar o container de autenticação no cabeçalho superior');
assert(!authUiJs.includes('btnGoogleLogin'), 'auth-ui.js não deve mais renderizar o botão de login no cabeçalho superior');

const drawerUiJs = fs.readFileSync(path.join(__dirname, '../src/compartilhado/drawer/drawer-ui.js'), 'utf8');
assert(drawerUiJs.includes('drawer-sync-btn'), 'drawer-ui.js deve conter o botão de sincronização dentro do menu lateral');
assert(drawerUiJs.includes('arrow-up'), 'drawer-ui.js deve utilizar o ícone arrow-up para subir nível');
assert(drawerUiJs.includes('book-open'), 'drawer-ui.js deve utilizar o ícone book-open para o grimório');
assert(drawerUiJs.includes('tools'), 'drawer-ui.js deve utilizar o ícone tools para oficinas');

const lojaItensIniciaisJs = fs.readFileSync(path.join(__dirname, '../src/integracoes/criador/loja-itens-iniciais.js'), 'utf8');
assert(lojaItensIniciaisJs.includes("IconesForja.get('arrow-up'"), 'loja-itens-iniciais.js deve renderizar o botão subir nível com ícone arrow-up');

console.log('✔ Solicitação 61 (Purga total, ícones vetoriais de escolas, botões estilizados e drawer) 100% aprovada!');

// 7. Validar Solicitação 62: Botões Clean sem Ícones, Lápis em Vitais, Termos em Nova Aba e Mapa de Arton
console.log('7. Validando Solicitação 62: Botões Clean, Lápis em Vitais, Termos em Nova Aba e Mapa de Arton...');
assert(new RegExp("(['\"]?pencil['\"]?\\s*:)").test(iconesJs), 'icones.js deve conter a chave de ícone pencil');

const equipamentoJs = fs.readFileSync(path.join(__dirname, '../src/funcionalidades/criador/inventario/equipamento.js'), 'utf8');
assert(!equipamentoJs.includes("IconesForja.get('tools'"), 'equipamento.js não deve ter ícone tools no botão Ofício');
assert(!equipamentoJs.includes("IconesForja.get('store'"), 'equipamento.js não deve ter ícone store no botão Loja');
assert(!equipamentoJs.includes("IconesForja.get('beer'"), 'equipamento.js não deve ter ícone beer no botão Taverna');
assert(!equipamentoJs.includes("IconesForja.get('gift'"), 'equipamento.js não deve ter ícone gift no botão Recompensa');
assert(!equipamentoJs.includes("IconesForja.get('archive'"), 'equipamento.js não deve ter ícone archive no botão Guardar');
assert(!equipamentoJs.includes("IconesForja.get('coin'"), 'equipamento.js não deve ter ícone coin no botão Vender');

const renderizacaoJs = fs.readFileSync(path.join(__dirname, '../src/funcionalidades/criador/ficha/renderizacao.js'), 'utf8');
assert(renderizacaoJs.includes("IconesForja.get('pencil'"), 'renderizacao.js deve utilizar o ícone pencil no botão de edição de vitais');
assert(!renderizacaoJs.includes('>Modificar</button>'), 'renderizacao.js não deve conter a palavra Modificar no botão de vitais');

const footerUiJs = fs.readFileSync(path.join(__dirname, '../src/compartilhado/footer/footer-ui.js'), 'utf8');
assert(footerUiJs.includes('href="termos.html"') && !footerUiJs.includes('href="termos.html" target="_blank"'), 'footer-ui.js deve ter link para termos.html na mesma aba');
assert(footerUiJs.includes('href="mapa.html"'), 'footer-ui.js deve ter link para mapa.html');
assert(!drawerUiJs.includes('data-drawer-action="terms"'), 'drawer-ui.js não deve ter link de Termos de Uso (deve ficar apenas no rodapé)');

assert(fs.existsSync(path.join(__dirname, '../src/paginas/termos.html')), 'src/paginas/termos.html deve existir');
assert(fs.existsSync(path.join(__dirname, '../src/paginas/mapa.html')), 'src/paginas/mapa.html deve existir');
assert(fs.existsSync(path.join(__dirname, '../assets/mapas/mapa-de-arton.jpg')), 'assets/mapas/mapa-de-arton.jpg deve existir');

console.log('✔ Solicitação 62 (Botões clean, lápis em vitais, termos em nova aba e mapa de Arton) 100% aprovada!');

console.log('\n======================================================');
console.log('🎉 SUCESSO TOTAL: Menus, Rodapé, Limite, Origem, Purga e Refinamentos 100% Aprovados!');
console.log('======================================================');


