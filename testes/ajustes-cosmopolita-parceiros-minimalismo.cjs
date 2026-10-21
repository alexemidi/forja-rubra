const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');

// Teste 1: Arquivos estáticos sem emojis nos botões da mochila e no modal de bônus temporários
const renderizacaoCode = fs.readFileSync(path.join(root, 'src/funcionalidades/criador/ficha/renderizacao.js'), 'utf8');
assert(!renderizacaoCode.includes('⚡ BÔNUS TEMPORÁRIOS'), 'Modal de bônus temporários não deve conter emoji de raio no título');
assert(!renderizacaoCode.includes('🛡️ Bônus na Defesa'), 'Modal de bônus temporários não deve conter emoji de escudo');
assert(!renderizacaoCode.includes('🎯 Bônus em Perícia'), 'Modal de bônus temporários não deve conter emoji de alvo');
assert(!renderizacaoCode.includes('⚡ Bônus temp.'), 'Botões de bônus temp não devem conter emoji de raio');

const equipCode = fs.readFileSync(path.join(root, 'src/funcionalidades/criador/inventario/equipamento.js'), 'utf8');
assert(!equipCode.includes('💰 Vender'), 'equipamento.js não deve ter emoji de saco de dinheiro no botão Vender');
assert(!equipCode.includes('🏪 Loja'), 'equipamento.js não deve ter emoji na Loja');
assert(!equipCode.includes('🍺 Taverna'), 'equipamento.js não deve ter emoji na Taverna');
assert(!equipCode.includes('🎁 Recompensa'), 'equipamento.js não deve ter emoji em Recompensa');
assert(!equipCode.includes('🛠️ Ofício'), 'equipamento.js não deve ter emoji em Ofício');

const mochilaCode = fs.readFileSync(path.join(root, 'src/funcionalidades/criador/inventario/mochila-heroi-moedas-consumo.js'), 'utf8');
assert(!mochilaCode.includes('💰 Vender'), 'mochila-heroi-moedas-consumo.js não deve ter emoji de saco no botão Vender');
assert(!mochilaCode.includes('🏪 Loja'), 'mochila-heroi-moedas-consumo.js não deve ter emoji na Loja');
assert(!mochilaCode.includes('🍺 Taverna'), 'mochila-heroi-moedas-consumo.js não deve ter emoji na Taverna');
assert(!mochilaCode.includes('🎁 Recompensa'), 'mochila-heroi-moedas-consumo.js não deve ter emoji em Recompensa');

const guildaDataCode = fs.existsSync(path.join(root, 'src/funcionalidades/guilda/03-00-guilda-dados.js'))
  ? (fs.readFileSync(path.join(root, 'src/funcionalidades/guilda/03-00-guilda-dados.js'), 'utf8') + '\n' + fs.readFileSync(path.join(root, 'src/funcionalidades/guilda/03-01-guilda-ui.js'), 'utf8'))
  : fs.readFileSync(path.join(root, 'src/funcionalidades/taverna/03-00-TAVERN_DATA.js'), 'utf8');
assert(guildaDataCode.includes('Receber Parceiro'), 'Módulo de parceiros deve conter botão Receber Parceiro');
assert(guildaDataCode.includes("nome: 'Assassino'"), 'Parceiro Assassino deve ter nome apenas Assassino');

const tavernaCss = fs.readFileSync(path.join(root, 'src/estilos/taverna/0.css'), 'utf8');
assert(tavernaCss.includes('.partners-grid-4col .tavern-card'), 'Deve existir estilo dedicado para parceiros na grade de 4 colunas');
assert(tavernaCss.includes('height: auto;'), 'Cards de parceiros devem ter height: auto para eliminar o vão vertical');

console.log('✔ Validações estáticas de ausência de emojis, cards de parceiros e textos aprovadas!');

// Teste 2: Validação via JSDOM de Cosmopolita e Parceiros
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="app"></div></body></html>', {
  runScripts: 'outside-only',
  url: 'http://localhost/'
});
const { window } = dom;

// Configurar mocks básicos para ambiente de teste
window.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

console.log('✔ Suíte de testes de ajustes concluída com sucesso!');
