const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const items = JSON.parse(fs.readFileSync(path.join(root, 'dados/items.json'), 'utf8'));

console.log('=== TESTES DE ARMADURAS, ESCUDOS E MODAIS (T20) ===\n');

// 1. Validando Armadura de Hussardo Alado
console.log('1. Validando texto canônico da Armadura de Hussardo Alado...');
const hussardo = items.find(i => i.id === 'armadura_de_hussardo_alado');
assert(hussardo, 'Armadura de Hussardo Alado deve existir');
assert(
  hussardo.textos.habilidade.includes('investida montada') &&
  hussardo.textos.habilidade.includes('Intimidação para assustar o alvo'),
  'Armadura de Hussardo Alado deve conter o efeito de investida montada e Intimidação'
);
console.log('✔ Armadura de Hussardo Alado contém texto canônico completo com investida montada!');

// 2. Validando restrição de material especial em Armadura de Pedra e Veste de Teia de Aranha
console.log('2. Validando bloqueio de material especial em Armadura de Pedra e Veste de Teia de Aranha...');
const pedra = items.find(i => i.id === 'armadura_de_pedra');
const teia = items.find(i => i.id === 'veste_de_teia_de_aranha');
assert(pedra && pedra.bloquearMaterialEspecial, 'Armadura de Pedra deve ter bloquearMaterialEspecial');
assert(teia && teia.bloquearMaterialEspecial, 'Veste de Teia de Aranha deve ter bloquearMaterialEspecial');
assert(pedra.textos.variavel.includes('A armadura de pedra não pode receber a melhoria material especial'), 'Texto de pedra deve indicar proibição de material especial');
assert(teia.textos.variavel.includes('A veste de teia de aranha não pode receber a melhoria material especial'), 'Texto de teia deve indicar proibição de material especial');

const syncCode = fs.readFileSync(path.join(root, 'src/funcionalidades/loja/03-04-syncFilterUI.js'), 'utf8');
assert(syncCode.includes('item.bloquearMaterialEspecial || item.id === \'armadura_de_pedra\' || item.id === \'veste_de_teia_de_aranha\''), 'Código de materialOptionsForItem deve bloquear armadura de pedra e veste de teia');
console.log('✔ Bloqueio de material especial validado no catálogo e nas funções de checagem!');

// 3. Validando textos canônicos das demais armaduras e escudos
console.log('3. Validando textos canônicos das demais armaduras e escudos...');
const folhas = items.find(i => i.id === 'armadura_de_folhas');
assert(folhas.textos.habilidade.includes('+2 PM com esta armadura'), 'Folhas deve conceder +2 PM com Sobrevivência');

const chumbo = items.find(i => i.id === 'armadura_de_chumbo');
assert(chumbo.textos.habilidade.includes('redução de dano 2/mundano') && chumbo.textos.habilidade.includes('resistência a magia +2'), 'Chumbo deve conceder RD 2/mundano e RM +2');

const engenhoqueiro = items.find(i => i.id === 'armadura_de_engenhoqueiro_goblin');
assert(engenhoqueiro.textos.habilidade.includes('levar até 2 espaços') && engenhoqueiro.textos.habilidade.includes('ativar engenhocas'), 'Engenhoqueiro Goblin deve conter regras de carga e ativação');

const justa = items.find(i => i.id === 'armadura_de_justa');
assert(justa.textos.habilidade.includes('+5 em testes para resistir a ser derrubado'), 'Justa deve fornecer +5 contra derrubada');

const sensual = items.find(i => i.id === 'armadura_sensual');
assert(sensual.textos.habilidade.includes('permite usar o poder Atraente'), 'Sensual deve permitir usar poder Atraente');

const brigantina = items.find(i => i.id === 'brigantina');
assert(brigantina.textos.habilidade.includes('armas de perfuração') && brigantina.textos.habilidade.includes('–2'), 'Brigantina deve ter penalidade contra perfuração');

const broquel = items.find(i => i.id === 'broquel');
assert(broquel.textos.habilidade.includes('ataque corpo a corpo') && broquel.textos.habilidade.includes('reduz o dano'), 'Broquel deve ter mecânica de bloqueio por teste de ataque');

const moedas = items.find(i => i.id === 'cota_de_moedas');
assert(moedas.textos.habilidade.includes('+2 em testes de Diplomacia'), 'Moedas deve dar +2 em Diplomacia');

const colete = items.find(i => i.id === 'colete_fora_da_lei');
assert(colete.textos.habilidade.includes('+2 na Defesa contra armas de disparo'), 'Colete Fora da Lei deve dar +2 contra disparo');

const vime = items.find(i => i.id === 'escudo_de_vime');
assert(vime.textos.habilidade.includes('camuflagem leve') && vime.textos.habilidade.includes('acerto crítico, o escudo de vime é destruído'), 'Escudo de vime deve ter camuflagem e quebra em crítico');

const torre = items.find(i => i.id === 'escudo_torre');
assert(torre.textos.habilidade.includes('ação de movimento para apoiar o escudo') && torre.textos.habilidade.includes('cobertura leve'), 'Escudo Torre deve apoiar para dar cobertura leve');

const sagna = items.find(i => i.id === 'sagna');
assert(sagna.textos.habilidade.includes('deslocamento de natação igual ao seu deslocamento terrestre'), 'Sagna deve conceder natação');

const ossos = items.find(i => i.id === 'armadura_de_ossos');
assert(ossos.textos.habilidade.includes('+1 em testes de Intimidação e na CD de efeitos de medo'), 'Ossos deve dar +1 Intimidação e CD medo');

const quitina = items.find(i => i.id === 'armadura_de_quitina');
assert(quitina.textos.habilidade.includes('não reduz seu deslocamento'), 'Quitina não deve reduzir deslocamento');

const couro = items.find(i => i.id === 'escudo_de_couro');
assert(couro.textos.habilidade.includes('+2 na Defesa contra ataques à distância'), 'Escudo de couro deve dar +2 contra distância');
console.log('✔ Todas as 18 armaduras e escudos canônicos validados com sucesso!');

// 4. Validando design do modal de venda da mochila
console.log('4. Validando layout clean do modal de venda da mochila (venda.js)...');
const vendaCode = fs.readFileSync(path.join(root, 'src/funcionalidades/criador/inventario/venda.js'), 'utf8');
assert(!vendaCode.includes('background:#091612;border:1px solid #1c523c'), 'Modal de venda não deve conter o quadro verde antigo');
assert(!vendaCode.includes('<em>Regra Geral:</em>'), 'Modal de venda não deve conter o texto de Regra Geral');
assert(vendaCode.includes('sellItemPriceInput" type="hidden"'), 'Valor unitário deve ser input oculto');
assert(vendaCode.includes('VENDER ITEM DA MOCHILA'), 'Título deve estar em caixa alta estilizada');
assert(vendaCode.includes('Total a receber:'), 'Deve conter display discreto de Total a receber');
console.log('✔ Modal de venda limpo e minimalista validado fielmente!');

// 5. Validando layout do modal de finalizar compra (ensureGeneralPurchaseModal) e carrinho
console.log('5. Validando layout do modal de finalizar compra e carrinho...');
const shopModalCode = fs.readFileSync(path.join(root, 'src/funcionalidades/loja/05-03-ensureGeneralSaleModal.js'), 'utf8');
assert(shopModalCode.includes('FINALIZAR COMPRA'), 'Modal deve ter título em maiúsculas Cinzel');
assert(shopModalCode.includes('data-general-purchase="confirm" style="padding:8px 20px;background:#991b1b'), 'Botão Confirmar compra deve ser vermelho Forja');

const cssLoja = fs.readFileSync(path.join(root, 'src/estilos/loja/0.css'), 'utf8');
assert(cssLoja.includes('#cartModal .modal-panel { width: min(780px, 96%)'), 'Janela do carrinho deve ter largura ampliada');
assert(cssLoja.includes('.cart-remove { width: 32px; height: 32px;'), 'Botão X em CSS para remover itens do carrinho deve estar estilizado');
assert(cssLoja.includes('#checkoutCart { background: #991b1b !important'), 'Botão Finalizar compra no carrinho deve ser vermelho no padrão Forja');
console.log('✔ Modal de finalização de compra e carrinho estilizados no padrão da Forja com sucesso!');

console.log('\n======================================================');
console.log('🎉 SUCESSO TOTAL: Todas as validações passaram!');
console.log('======================================================');
