const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== TESTES DE FIM DA AVENTURA, DESCANSO E MODAL SOBREPOSTO DE COMPRA ===\n');

// 1. Validando o núcleo puro de vitais: aplicarDescanso e encerrarAventura
console.log('1. Validando regras puras de vitais: diários vs aventura e encerramento...');
async function testarNucleoVitais() {
  const nucleoPath = path.resolve(__dirname, '../src/nucleo/vitais.mjs');
  const { aplicarDescanso, encerrarAventura } = await import('file://' + nucleoPath.replace(/\\/g, '/'));

  // Ficha com vitais base, temporários diários e temporários de aventura
  const vitaisIniciais = {
    pv: 15,
    pvMax: 20,
    pm: 4,
    pmMax: 10,
    pvTempDaily: 5,
    pmTempDaily: 3,
    pvTempAdventure: 4,
    pmTempAdventure: 2,
    pvTempMax: 9,
    pmTempMax: 5,
    pvTempMode: true,
    pmTempMode: true,
    adventureSpentTibars: 150
  };

  // Descanso diário: recupera PV e PM, zera diários mas PRESERVA aventura!
  const aposDescanso = aplicarDescanso(vitaisIniciais, { gainPv: 3, gainPm: 4 });
  assert.strictEqual(aposDescanso.pvTempDaily, 0, 'Temporário diário de PV deve zerar após descanso');
  assert.strictEqual(aposDescanso.pmTempDaily, 0, 'Temporário diário de PM deve zerar após descanso');
  assert.strictEqual(aposDescanso.pvTempMax, 4, 'Teto temporário deve manter os 4 de aventura');
  assert.strictEqual(aposDescanso.pmTempMax, 2, 'Teto temporário deve manter os 2 de aventura');
  assert.strictEqual(aposDescanso.pv, 18, 'PV recuperado (15 + 3)');
  assert.strictEqual(aposDescanso.pm, 8, 'PM recuperado (4 + 4)');
  assert.strictEqual(aposDescanso.pvTempMode, true, 'Modo temporário deve permanecer ativo para aventura');

  // Encerramento da Aventura: zera todos os temporários e gastos da aventura
  const aposFimAventura = encerrarAventura(aposDescanso);
  assert.strictEqual(aposFimAventura.pvTempDaily, 0, 'Temporário diário deve ser 0');
  assert.strictEqual(aposFimAventura.pmTempDaily, 0, 'Temporário diário de PM deve ser 0');
  assert.strictEqual(aposFimAventura.pvTempAdventure, 0, 'Temporário de aventura de PV deve zerar');
  assert.strictEqual(aposFimAventura.pmTempAdventure, 0, 'Temporário de aventura de PM deve zerar');
  assert.strictEqual(aposFimAventura.pvTempMax, 0, 'pvTempMax deve ser 0');
  assert.strictEqual(aposFimAventura.pmTempMax, 0, 'pmTempMax deve ser 0');
  assert.strictEqual(aposFimAventura.pvTempMode, false, 'Modo temporário deve ser desligado');
  assert.strictEqual(aposFimAventura.adventureSpentTibars, 0, 'Despesas da aventura devem zerar');
  console.log('✔ Núcleo puro de vitais (diário vs aventura e fim de aventura) validado com sucesso!');
}

// 2. Validando ícones de aventura no catálogo
console.log('\n2. Validando catálogo de ícones SVG (compass e flag)...');
const iconesSrc = fs.readFileSync(path.resolve(__dirname, '../src/compartilhado/icones.js'), 'utf-8');
assert.ok(iconesSrc.includes('compass:'), 'Ícone compass deve estar presente em icones.js');
assert.ok(iconesSrc.includes('flag:'), 'Ícone flag deve estar presente em icones.js');
assert.ok(!iconesSrc.includes('🛏'), 'Emoji de cama não deve existir nos SVGs do projeto');
console.log('✔ Ícones vetoriais compass e flag validados sem emojis!');

// 3. Validando CSS do modal de descanso no padrão Forja Rubra
console.log('\n3. Validando estilos minimalistas do modal de descanso (DESCANSAR)...');
const cssEquip = fs.readFileSync(path.resolve(__dirname, '../src/estilos/criador/equipamento.css'), 'utf-8');
assert.ok(cssEquip.includes('.vital-rest-cancel-btn'), 'Botão cancelar com estilo minimalista presente');
assert.ok(cssEquip.includes('.vital-rest-cortesia-btn'), 'Botão cortesia presente');
assert.ok(cssEquip.includes('.vital-rest-confirm-btn'), 'Botão pagar estadia vermelho Forja presente');
assert.ok(cssEquip.includes('#991b1b'), 'Cor vermelha Forja aplicada no botão de estadia');
const restCardBlock = cssEquip.match(/\.vital-rest-confirm-btn\s*\{[^}]*\}/)?.[0] || '';
assert.ok(!restCardBlock.includes('#d97706'), 'Cores laranja chamativas removidas do botão de descanso');
const cortesiaBlock = cssEquip.match(/\.vital-rest-cortesia-btn\s*\{[^}]*\}/)?.[0] || '';
assert.ok(!cortesiaBlock.includes('#0284c7'), 'Cores ciano gritantes removidas do botão cortesia');
console.log('✔ Estilos elegantes, minimalistas e temáticos do modal de descanso validados!');

// 4. Validando integração do modal sobreposto de compra e remoção de item por CSS
console.log('\n4. Validando modal sobreposto de compras com botão de remoção por item...');
const lojaModalSrc = fs.readFileSync(path.resolve(__dirname, '../src/funcionalidades/loja/05-03-ensureGeneralSaleModal.js'), 'utf-8');
assert.ok(lojaModalSrc.includes('data-general-purchase-remove'), 'Botão de remoção por item presente no modal');
assert.ok(lojaModalSrc.includes('cartTotalsInfo().value'), 'Recálculo dinâmico baseado no carrinho restante presente');
assert.ok(lojaModalSrc.includes('currentPurchaseItems'), 'Gerenciamento reativo dos itens da compra presente');
assert.ok(lojaModalSrc.includes('O carrinho está vazio.'), 'Mensagem de carrinho vazio presente');

const lojaFilterSrc = fs.readFileSync(path.resolve(__dirname, '../src/funcionalidades/loja/03-04-syncFilterUI.js'), 'utf-8');
assert.ok(lojaFilterSrc.includes('checkoutWithAmmo(false)'), 'openCartDecision redireciona diretamente para o fluxo de compra');
console.log('✔ Janela sobreposta de compra e remoção com recálculo instantâneo validados!');

// 5. Validando botão Fim da Aventura e modal na ficha do personagem
console.log('\n5. Validando ação Fim da Aventura e cálculo do Incentivador da Economia...');
const sheetRenderSrc = fs.readFileSync(path.resolve(__dirname, '../src/funcionalidades/criador/ficha/renderizacao.js'), 'utf-8');
assert.ok(sheetRenderSrc.includes('sheet-adventure-btn'), 'Botão de fim da aventura presente na barra de vitais');
assert.ok(sheetRenderSrc.includes('renderAdventureEndModalHtml'), 'Renderização do modal de fim da aventura presente');
assert.ok(sheetRenderSrc.includes('getIncentivadorBonusPm'), 'Cálculo de bônus do Incentivador da Economia implementado');
assert.ok(sheetRenderSrc.includes('forja-taverna-contracts-v1'), 'Limpeza de contratos de mercenários no fim da aventura implementada');
assert.ok(!sheetRenderSrc.includes('rest-card-moon'), 'Emoji/ícone poluído removido do cabeçalho de descanso');
console.log('✔ Integração completa da ficha, descanso e fim da aventura validada com sucesso!');

// 6. Validando modal expandido sem rolagem e auto-hide do footer de checkout
console.log('\n6. Validando modal expandido sem rolagem e auto-hide do footer da loja...');
assert.ok(lojaModalSrc.includes('max-width:720px'), 'Modal de compra com largura expandida');
assert.ok(lojaModalSrc.includes('notifyShopFooterVisibility'), 'Notificação de visibilidade do footer de compra presente');
assert.ok(lojaModalSrc.includes('toggle-shop-footer'), 'Canal de toggle-shop-footer implementado');

const lojaItensIniciaisSrc = fs.readFileSync(path.resolve(__dirname, '../src/integracoes/criador/loja-itens-iniciais.js'), 'utf-8');
assert.ok(lojaItensIniciaisSrc.includes('toggle-shop-footer'), 'Host trata evento toggle-shop-footer');
assert.ok(lojaItensIniciaisSrc.includes('registrarDespesaAventura'), 'acceptArsenalOperation registra despesas na aventura');

// 7. Validando registro automático de despesas na aventura e poções padronizadas
console.log('\n7. Validando registro automático de despesas e modal padronizado de poções...');
const eventosServicosSrc = fs.readFileSync(path.resolve(__dirname, '../src/integracoes/criador/eventos-e-servicos.js'), 'utf-8');
assert.ok(eventosServicosSrc.includes('registrarDespesaAventura(totalFinal)'), 'Compra de poção registra despesa na aventura');
assert.ok(eventosServicosSrc.includes('registrarDespesaAventura(cost)'), 'Contrato de taverna registra despesa na aventura');
assert.ok(!eventosServicosSrc.includes('#4ce499'), 'Verde neon removido do modal de poções');
assert.ok(!eventosServicosSrc.includes('#091612'), 'Fundo verde musgo removido do modal de poções');
assert.ok(eventosServicosSrc.includes('COMPRAR POÇÃO MÁGICA'), 'Título em Cinzel dourado padronizado');

// 8. Validando controles de temporários com input na linha inferior e transformação dos botões
console.log('\n8. Validando controles de temporários (transformação dos botões e modal limpo)...');
assert.ok(sheetRenderSrc.includes('button-vital-add-temp'), 'Transformação para botão Adicionar presente');
assert.ok(sheetRenderSrc.includes('button-vital-clear-temp'), 'Transformação para botão Encerrar presente');
assert.ok(sheetRenderSrc.includes('confirm-temp-duration-daily'), 'Ação de adicionar temporário para o dia presente');
assert.ok(sheetRenderSrc.includes('confirm-temp-duration-adventure'), 'Ação de adicionar temporário para a aventura presente');
assert.ok(!sheetRenderSrc.includes('data-vital-temp-row'), 'Linha duplicada de botões inferiores de temporários removida');

// 9. Validando que normalizarVitais preserva pvTempAdventure e pmTempAdventure
console.log('\n9. Validando preservação de campos de aventura em normalizarVitais...');
async function testarNormalizarVitaisPreservaAventura() {
  const nucleoPath = path.resolve(__dirname, '../src/nucleo/vitais.mjs');
  const { normalizarVitais, aplicarDescanso } = await import('file://' + nucleoPath.replace(/\\/g, '/'));
  const fichaComAventura = {
    pv: 26,
    pvMax: 26,
    pm: 36,
    pmMax: 26,
    pmTempAdventure: 10,
    pmTempMax: 10,
    pmTempMode: true
  };
  const normalizada = normalizarVitais(fichaComAventura, { pv: 26, pm: 26 });
  assert.strictEqual(normalizada.pmTempAdventure, 10, 'pmTempAdventure deve ser preservado por normalizarVitais');
  assert.strictEqual(normalizada.pmTempMax, 10, 'pmTempMax deve ser preservado por normalizarVitais');
  const aposDescanso = aplicarDescanso(normalizada, { gainPv: 26, gainPm: 26 });
  assert.strictEqual(aposDescanso.pmTempAdventure, 10, 'pmTempAdventure deve continuar 10 após o descanso!');
  assert.strictEqual(aposDescanso.pmTempMax, 10, 'pmTempMax deve continuar 10 após o descanso!');
  assert.strictEqual(aposDescanso.pm, 36, 'PM máximo atingível deve incluir o bônus de aventura!');
  console.log('✔ Preservação de temporários de aventura após descanso e normalização aprovada 100%!');
}

(async () => {
  await testarNucleoVitais();
  await testarNormalizarVitaisPreservaAventura();
  console.log('\n======================================================');
  console.log('🎉 SUCESSO TOTAL: Todas as validações passaram com 100% de êxito!');
  console.log('======================================================');
})();
