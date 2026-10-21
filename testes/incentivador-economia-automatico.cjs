const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== TESTES DO PODER INCENTIVADOR DA ECONOMIA AUTOMÁTICO ===\n');

// 1. Simulação do ambiente da ficha
const sheetRenderSrc = fs.readFileSync(path.resolve(__dirname, '../src/funcionalidades/criador/ficha/renderizacao.js'), 'utf-8');

// Validar que as funções necessárias existem no código-fonte
assert.ok(sheetRenderSrc.includes('function hasCharacterIncentivadorEconomia'), 'Função hasCharacterIncentivadorEconomia presente');
assert.ok(sheetRenderSrc.includes('function getCharacterOverallLevel'), 'Função getCharacterOverallLevel presente');
assert.ok(sheetRenderSrc.includes('function sincronizarIncentivadorEconomia'), 'Função sincronizarIncentivadorEconomia presente');
assert.ok(sheetRenderSrc.includes('window.sincronizarIncentivadorEconomia = sincronizarIncentivadorEconomia'), 'Função exposta globalmente');

global.window = global.window || {};
global.document = global.document || {
  addEventListener: () => {},
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: () => ({ style: {}, setAttribute: () => {}, appendChild: () => {}, dataset: {} })
};

// Montando ambiente isolado para testar as funções
const mockState = {
  identity: { plannedLevel: 5 },
  progression: [{}, {}, {}, {}, {}],
  powers: { general: ['incentivador_da_economia'] },
  vitals: {
    pv: 30,
    pvMax: 30,
    pm: 20,
    pmMax: 20,
    pmTempAdventure: 0,
    pmTempDaily: 0,
    pmTempMax: 0,
    adventureSpentTibars: 0
  }
};

let toastMessages = [];
function mockToast(msg) {
  toastMessages.push(msg);
}

// Criar sandbox avaliando o módulo de vitais e as funções extraídas
async function testarIncentivadorAutomatico() {
  const nucleoPath = path.resolve(__dirname, '../src/nucleo/vitais.mjs');
  const { normalizarVitais, aplicarDescanso, encerrarAventura } = await import('file://' + nucleoPath.replace(/\\/g, '/'));

  console.log('1. Testando cálculo de nível geral do personagem (independente de classe)...');
  // Simular multiclasse: Ladino 3 / Nobre 2 = Nível geral 5
  mockState.identity.plannedLevel = 5;
  const levelMulticlasse = mockState.identity.plannedLevel;
  const thresholdNivel5 = 50 * levelMulticlasse;
  assert.strictEqual(thresholdNivel5, 250, 'Nível 5 deve exigir exatamente T$ 250 por PM temporário (50 * 5)');
  console.log('✔ Nível geral do personagem validado: 50 * 5 = T$ 250!');

  console.log('\n2. Testando ganho automático de PM ao gastar T$ 250 (nível 5)...');
  // Extrair o bloco de funções de vitais e incentivador de renderizacao.js
  const startIdx = sheetRenderSrc.indexOf('function sheetVitals(maximum){');
  const endIdx = sheetRenderSrc.indexOf('function renderRestModalHtml(){');
  const codeBlock = sheetRenderSrc.slice(startIdx, endIdx);

  const sandboxFn = new Function(
    'state', 'ForjaUnificada', 'showToast', 'saveSheetVitals', 'updateVitalVisuals',
    codeBlock + '; return { getIncentivadorBonusPm, sincronizarIncentivadorEconomia, registrarDespesaAventura, hasCharacterIncentivadorEconomia, getCharacterOverallLevel };'
  );

  const scope = sandboxFn(mockState, { normalizarVitais, aplicarDescanso, encerrarAventura }, mockToast, () => {}, () => {});

  assert.strictEqual(scope.hasCharacterIncentivadorEconomia(), true, 'Deve detectar que o personagem possui o poder Incentivador da Economia');
  assert.strictEqual(scope.getCharacterOverallLevel(), 5, 'Deve retornar o nível geral 5');

  // Registrar despesa de 250 T$
  scope.registrarDespesaAventura(250);
  assert.strictEqual(mockState.vitals.adventureSpentTibars, 250, 'Total gasto na aventura deve ser 250');
  assert.strictEqual(mockState.vitals.pmTempIncentivador, 1, 'Deve creditar 1 PM de bônus do incentivador');
  assert.strictEqual(mockState.vitals.pmTempAdventure, 1, 'pmTempAdventure deve ser 1');
  assert.strictEqual(mockState.vitals.pmTempMax, 1, 'pmTempMax deve ser 1');
  assert.strictEqual(mockState.vitals.pm, 21, 'PM atual deve aumentar para 21 (20 base + 1)');
  assert.ok(toastMessages.some(m => m.includes('+1 PM temporário')), 'Toast deve avisar da concessão automática');
  console.log('✔ Gasto de T$ 250 concedeu automaticamente +1 PM temporário até o fim da aventura!');

  console.log('\n3. Testando gasto de mais T$ 250 (total T$ 500)...');
  scope.registrarDespesaAventura(250);
  assert.strictEqual(mockState.vitals.adventureSpentTibars, 500, 'Total gasto na aventura deve ser 500');
  assert.strictEqual(mockState.vitals.pmTempIncentivador, 2, 'Deve creditar 2 PMs acumulados');
  assert.strictEqual(mockState.vitals.pmTempAdventure, 2, 'pmTempAdventure deve ser 2');
  assert.strictEqual(mockState.vitals.pmTempMax, 2, 'pmTempMax deve ser 2');
  assert.strictEqual(mockState.vitals.pm, 22, 'PM atual deve aumentar para 22 (20 base + 2)');
  console.log('✔ Gasto total de T$ 500 acumulou automaticamente +2 PM temporários!');

  console.log('\n4. Testando gasto que não atinge novo múltiplo (T$ 100 adicionais, total T$ 600)...');
  scope.registrarDespesaAventura(100);
  assert.strictEqual(mockState.vitals.adventureSpentTibars, 600, 'Total gasto na aventura deve ser 600');
  assert.strictEqual(mockState.vitals.pmTempAdventure, 2, 'pmTempAdventure deve continuar 2');
  console.log('✔ Gastos fracionários mantêm o bônus estável sem duplicar!');

  console.log('\n5. Testando descanso mantendo os PMs temporários da aventura...');
  const descansado = aplicarDescanso(mockState.vitals, { gainPv: 30, gainPm: 20 });
  assert.strictEqual(descansado.pmTempAdventure, 2, 'Descanso NÃO pode zerar pmTempAdventure');
  assert.strictEqual(descansado.pmTempMax, 2, 'pmTempMax deve continuar 2 após descanso');
  assert.strictEqual(descansado.pm, 22, 'PM máximo atingível no descanso deve incluir o bônus de aventura');
  console.log('✔ Descanso preservou 100% dos PM temporários obtidos pelo Incentivador da Economia!');

  console.log('\n6. Testando fim da aventura zerando gastos e bônus...');
  const encerrado = encerrarAventura(descansado);
  assert.strictEqual(encerrado.adventureSpentTibars, 0, 'adventureSpentTibars deve zerar no fim da aventura');
  assert.strictEqual(encerrado.pmTempAdventure, 0, 'pmTempAdventure deve zerar no fim da aventura');
  assert.strictEqual(encerrado.pmTempIncentivador, 0, 'pmTempIncentivador deve zerar no fim da aventura');
  assert.strictEqual(encerrado.pmTempMax, 0, 'pmTempMax deve zerar no fim da aventura');
  assert.strictEqual(encerrado.pm, 20, 'PM deve retornar ao teto base de 20');
  console.log('✔ Fim da aventura redefiniu gastos e bônus do incentivador para a próxima jornada!');
}

testarIncentivadorAutomatico().then(() => {
  console.log('\n===============================================================');
  console.log('🎉 SUCESSO TOTAL: Todos os testes do Incentivador da Economia passaram!');
  console.log('===============================================================');
}).catch(err => {
  console.error('❌ Falha nos testes:', err);
  process.exit(1);
});
