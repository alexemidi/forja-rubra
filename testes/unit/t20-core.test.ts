/**
 * Suíte de Testes Unitários em TypeScript — Domínio e Componentes UI da Forja T20
 */

import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

import {
  normalizarVitais,
  alterarVital,
  aplicarDescanso,
  encerrarAventura,
  calcularBonusIncentivadorEconomia,
  estatisticas,
  moedas,
  espacosMoedas,
  calcularPrecoComModificador,
  calcularCustoFabricacao,
  tipoMochila,
  mochilaIsenta,
  beneficiosMochilas,
  bonusPoderesCarga,
  podeMontar,
  validarEquipamentoMontaria,
  penalidadesMontaria,
  bonusArmaduraMontaria,
  efeitosMarcas,
  stepUpDamage,
  damageAverage,
  addFlatDamageBonus,
  resolveEffectKey,
  calculateGolpePessoalCost,
  validateGolpePessoalBuild,
  intervalos,
  modificadores,
  limitar,
  RegrasCriacao,
  RegrasProgressao,
  RegrasEquipamento,
  RegrasInventario,
} from '../../src/lib/t20/index.ts';

import {
  exportarBackup,
  importarBackup,
  validarBackup,
  restaurarEstadoInterface,
  separarEstadoInterface,
  ArmazenamentoForja,
} from '../../src/lib/storage/index.ts';

import { criarCalculoPorOperacao } from '../../src/lib/calculation-cache.ts';

import {
  renderCardInventario,
  tracosCondicao,
  formatarReducaoDano,
  renderTransactionModalHtml,
  renderConfirmModalHtml,
  renderChoiceModalHtml,
} from '../../src/components/ui/index.ts';

console.log('=== SUÍTE DE TESTES UNITÁRIOS EM TYPESCRIPT (FORJA T20) ===\n');

// 1. Vitais, Temporários (Diários vs. Aventura), Descanso, Fim de Aventura e Incentivador da Economia
{
  console.log('1. Testando Vitais, Descanso, Fim de Aventura e Incentivador da Economia (TS)...');
  const base = Object.freeze({ pv: 7, pvMax: 10, pm: 0, pmMax: 5, pvTempMax: 0 });
  assert.equal(normalizarVitais(base, { pv: 15, pm: 5 }).pv, 12);
  assert.equal(alterarVital(base, 'pv', 'down', 3).pv, 4);
  assert.equal(alterarVital(base, 'pv', 'down', 100).pm, 0);

  // Temporários diários vs. aventura
  const comTemps = normalizarVitais(
    { pv: 15, pvMax: 10, pm: 8, pmMax: 5, pvTempDaily: 3, pvTempAdventure: 2, pmTempDaily: 1, pmTempAdventure: 2, pvTempMax: 5, pmTempMax: 3 },
    { pv: 10, pm: 5 }
  );
  assert.equal(comTemps.pvTempMax, 5);
  assert.equal(comTemps.pmTempMax, 3);

  // Regra T20: Dano reduz e remove PV temporários, impedindo cura sobre temporários perdidos
  const vitaisComTempPv = {
    pv: 35,
    pvMax: 30,
    pm: 10,
    pmMax: 10,
    pvTempDaily: 5,
    pvTempAdventure: 0,
    pvTempMax: 5,
  };
  const aposDano3 = alterarVital(vitaisComTempPv, 'pv', 'down', 3);
  assert.equal(aposDano3.pv, 32);
  assert.equal(aposDano3.pvTempMax, 2);
  assert.equal(aposDano3.pvTempDaily, 2);
  // Tentar curar 10: novo teto é 30 + 2 = 32; os 3 temporários perdidos NÃO podem ser curados
  const aposCura = alterarVital(aposDano3, 'pv', 'up', 10);
  assert.equal(aposCura.pv, 32);

  // Dano maior que o restante dos temporários: zera temporários e consome PV real
  const aposDanoMaior = alterarVital(aposDano3, 'pv', 'down', 10);
  assert.equal(aposDanoMaior.pv, 22);
  assert.equal(aposDanoMaior.pvTempMax, 0);
  // Cura posterior só recupera até o pvMax natural (30)
  const aposCuraTotal = alterarVital(aposDanoMaior, 'pv', 'up', 20);
  assert.equal(aposCuraTotal.pv, 30);

  // Descanso zera diários e preserva os de aventura
  const aposDescanso = aplicarDescanso(comTemps, { gainPv: 2, gainPm: 2 });
  assert.equal(aposDescanso.pvTempDaily, 0);
  assert.equal(aposDescanso.pvTempAdventure, 2);
  assert.equal(aposDescanso.pvTempMax, 2);
  assert.equal(aposDescanso.pmTempDaily, 0);
  assert.equal(aposDescanso.pmTempAdventure, 2);
  assert.equal(aposDescanso.pmTempMax, 2);

  // Fim de aventura zera todos os temporários e gastos
  const aposAventura = encerrarAventura({
    ...aposDescanso,
    adventureSpentTibars: 500,
    pmTempIncentivador: 2,
  });
  assert.equal(aposAventura.pvTempAdventure, 0);
  assert.equal(aposAventura.pmTempAdventure, 0);
  assert.equal(aposAventura.pvTempMax, 0);
  assert.equal(aposAventura.pmTempMax, 0);
  assert.equal(aposAventura.adventureSpentTibars, 0);
  assert.equal(aposAventura.pmTempIncentivador, 0);

  // Incentivador da Economia: 50 * nível do personagem
  assert.equal(calcularBonusIncentivadorEconomia(249, 5), 0);
  assert.equal(calcularBonusIncentivadorEconomia(250, 5), 1);
  assert.equal(calcularBonusIncentivadorEconomia(500, 5), 2);
  console.log('✔ Vitais, Descanso, Fim da Aventura e Incentivador da Economia aprovados!');
}

// 2. Economia, Moedas, Compra/Venda (±10%) e Fabricação (1/3 e 1/4 arredondando para cima)
{
  console.log('2. Testando Economia, Moedas e Arredondamento para cima (TS)...');
  const stats = estatisticas(
    { pv: 20, pm: 8 },
    { pvPerLevel: 2, pvFlat: 1, pmPerLevel: 1, pmFlat: 3, defenseAttribute: 'des', defenseBonus: 6 },
    { des: 1 },
    4
  );
  assert.deepEqual(stats, { pv: 29, pm: 15, defense: 17 });
  assert.deepEqual(moedas(10, {}).moedas, { tc: 0, ts: 10, to: 0 });
  assert.equal(espacosMoedas({ tc: 1000, ts: 0, to: 0 }), 1);

  // Arredondamento para cima (Math.ceil) em descontos/acréscimos e fabricação
  assert.equal(calcularPrecoComModificador(15, -1, 100), 14); // 15 * 90% = 13.5 -> 14
  assert.equal(calcularPrecoComModificador(15, +1, 100), 17); // 15 * 110% = 16.5 -> 17
  assert.equal(calcularCustoFabricacao(10, 3), 4); // 10 / 3 = 3.33 -> 4
  assert.equal(calcularCustoFabricacao(10, 4), 3); // 10 / 4 = 2.5 -> 3
  console.log('✔ Economia, Moedas e Arredondamentos canônicos aprovados!');
}

// 3. Carga, Mochilas, Montarias e Marcas de Distinção
{
  console.log('3. Testando Carga, Mochilas, Montarias e Marcas de Distinção (TS)...');
  assert.equal(tipoMochila('mochila'), 'comum');
  assert.equal(mochilaIsenta('aventureiro', ['Andarilho Carregado']), true);
  assert.equal(beneficiosMochilas(['aventureiro', 'armacao'], [], { for: 1 }).bonus, 6);
  assert.equal(bonusPoderesCarga([{ id: 'guerreiro_soldado_de_infantaria' }]), 6);

  assert.equal(podeMontar('Médio', 'Médio', 'cao_de_caca', 'iniciante'), false);
  assert.equal(podeMontar('Pequeno', 'Médio', 'cao_de_caca', 'iniciante'), true);
  assert.equal(validarEquipamentoMontaria(['sela'], 'alforje', false), '');
  assert.deepEqual(penalidadesMontaria(false, true), {
    cavalgar: -5,
    ataqueDistancia: 0,
    magiaCondicaoRuim: false,
  });
  assert.equal(bonusArmaduraMontaria(['armadura_de_montaria_pesada']), 2);

  assert.deepEqual(efeitosMarcas(['senador']).skills, { nobreza: 2 });
  assert.equal(efeitosMarcas(['amazona'], { heavyArmor: false }).defense, 2);
  console.log('✔ Carga, Mochilas, Montarias e Marcas de Distinção aprovados!');
}

// 4. Passos de Dano, Golpe Pessoal, Idade, Criação, Progressão e Equipamento
{
  console.log('4. Testando Passos de Dano, Golpe Pessoal, Idade e Progressão (TS)...');
  assert.equal(stepUpDamage('1d6', 1), '1d8');
  assert.equal(stepUpDamage('2d6', 1, { allowAltLadder: true }), '2d8');
  assert.equal(addFlatDamageBonus('1d8', 3), '1d8+3');
  assert.equal(damageAverage('2d6'), 7);

  const mockEffects = {
    BRUTAL: { name: 'Brutal', cost: 1, canRepeat: false },
    LETAL: { name: 'Letal', cost: 2, canRepeat: true, maxRepeats: 2 },
  };
  assert.equal(resolveEffectKey('brutal', mockEffects), 'BRUTAL');
  const cost = calculateGolpePessoalCost(
    [{ effectName: 'BRUTAL', repeats: 1 }, { effectName: 'LETAL', repeats: 1 }],
    mockEffects
  );
  assert.equal(cost, 3);
  assert.equal(
    validateGolpePessoalBuild(
      { weapon: 'Espada Longa', effects: [{ effectName: 'BRUTAL', repeats: 1 }], totalCost: 1 },
      mockEffects
    ).isValid,
    true
  );

  const faixas = {
    jovem: { start: 18, mods: {} },
    maduro: { start: 40, mods: { for: -1 } },
  };
  const ints = intervalos(faixas);
  assert.deepEqual(ints.jovem, { min: 18, max: 39 });
  assert.deepEqual(modificadores(faixas.maduro), { for: -1 });
  assert.equal(limitar('10', ints.maduro)?.years, '40');

  assert.deepEqual(
    RegrasCriacao.atributos(['for', 'des'], { for: 2, des: 1 }, { for: 1, des: 0 }),
    { for: 3, des: 1 }
  );
  assert.equal(RegrasProgressao.patamar(5), 'veterano');
  assert.equal(
    RegrasEquipamento.aplicar({}, 'equip-armor', 'armadura_de_couro', { count: 0, limit: 4 }).alterado,
    true
  );
  assert.equal(RegrasInventario.precoVenda(100, 50), 50);
  console.log('✔ Passos de Dano, Golpe Pessoal, Idade, Criação e Equipamento aprovados!');
}

// 5. Armazenamento, Backup, Estado de Interface e Cache por Operação
{
  console.log('5. Testando Storage, Backup, UI State e Operation Cache (TS)...');
  const calc = criarCalculoPorOperacao();
  let calls = 0;
  calc.executar(() => {
    calc.obter('k', () => ++calls);
    calc.obter('k', () => ++calls);
  });
  assert.equal(calls, 1);

  const storeMap = new Map<string, string>([
    ['forja-heroi-t20-v1', JSON.stringify({ identity: { characterName: 'Valente' }, extra: 42 })],
  ]);
  const port = {
    get length() {
      return storeMap.size;
    },
    key: (i: number) => [...storeMap.keys()][i] ?? null,
    getItem: (k: string) => storeMap.get(k) ?? null,
    setItem: (k: string, v: string) => {
      storeMap.set(k, v);
    },
    removeItem: (k: string) => {
      storeMap.delete(k);
    },
  };
  const bkp = exportarBackup(port);
  assert.equal(validarBackup(bkp).formato, 'forja-backup');
  assert.equal(importarBackup(port, bkp), 1);

  const separated = separarEstadoInterface({
    step: 6,
    identity: { characterName: 'Ayla', editingLevel: 2 },
  });
  assert.equal('step' in separated, false);
  const restored = restaurarEstadoInterface(separated);
  assert.equal(restored.step, 6);
  assert.equal(restored.identity.editingLevel, 2);

  const adapter = ArmazenamentoForja.criar(port);
  assert.equal(
    adapter.ler('forja-heroi-t20-v1', () => ({ identity: { characterName: '' } })).identity.characterName,
    'Valente'
  );
  console.log('✔ Storage, Backup, UI State e Operation Cache aprovados!');
}

// 6. Componentes Visuais Padronizados (Cards e 3 Modelos de Modal)
{
  console.log('6. Testando Componentes UI e os 3 Modelos Padronizados de Modal (TS)...');
  const xss = '<img src=x onerror=alert(1)>';
  const cardHtml = renderCardInventario({
    id: 'inst_1',
    itemId: 'espada_longa',
    tipo: 'arma',
    titulo: xss,
    tipoLabel: 'Arma',
    categoria: 'Marcial',
    livro: 'Básico',
    iconeHtml: '',
    statsHtml: '',
    propriedadesHtml: '',
    corpoHtml: '',
    melhoriasHtml: '',
    acoesHtml: '',
  });
  const dom = new JSDOM(cardHtml);
  assert.equal(dom.window.document.querySelector('.item-title')?.textContent, xss);
  assert.equal(dom.window.document.querySelectorAll('img').length, 0);

  assert.match(tracosCondicao('envenenado'), /fill="currentColor"/);
  assert.equal(formatarReducaoDano('RD 5/fogo'), 'Redução de Dano de fogo 5');

  const txModal = renderTransactionModalHtml({
    title: 'Finalizar Compra',
    mode: 'buy',
    items: [{ id: '1', itemId: 'espada_longa', name: 'Espada Longa', basePrice: 15, quantity: 1 }],
    modifierSteps: -1, // -10% => 15 * 0.9 = 13.5 => 14
  });
  assert.match(txModal, /T\$ 14/);
  assert.match(txModal, /data-remove-cart-item="1"/);

  const confirmModal = renderConfirmModalHtml({
    title: 'Subir de Nível',
    messageHtml: '<p>Confirmar avanço para o nível 2?</p>',
  });
  assert.match(confirmModal, /Subir de Nível/);

  const choiceModal = renderChoiceModalHtml({
    title: 'Duração dos Pontos Temporários',
    choices: [
      { id: 'daily', label: 'Para o Dia (encerra no descanso)' },
      { id: 'adventure', label: 'Para a Aventura (encerra no fim da aventura)' },
    ],
  });
  assert.match(choiceModal, /data-choice-id="adventure"/);
  dom.window.close();
  console.log('✔ Componentes UI e Modais Padronizados aprovados!');
}

// 7. Código de Compartilhamento (Share Code) e Sub-Estágios da Fase 6 (Features/Creator)
import {
  gerarCodigoCompartilhamento,
  interpretarCodigoCompartilhamento,
} from '../../src/lib/t20/share-code.ts';
import {
  computePhase6SubStages,
  checkPhase6StageComplete,
} from '../../src/features/creator/powers/phase6-stages.ts';

{
  console.log('7. Testando Share Code T20 e Sub-Estágios da Fase 6 (TS)...');
  const code = gerarCodigoCompartilhamento(
    { id: 'espada_longa', tipo: 'arma', nome: 'Espada Longa' },
    { improvements: [{ id: 'certeira' }] }
  );
  assert.equal(code, 'T20:ARM:espada_longa:SUP:MEL.certeira:0');
  const parsed = interpretarCodigoCompartilhamento(code);
  assert.equal(parsed?.itemId, 'espada_longa');
  assert.equal(parsed?.grau, 'SUP');

  const mockCharState: any = {
    step: 6,
    completed: [],
    identity: { characterName: 'Herói', playerName: '', raceId: 'humano', classId: 'clerigo', initialLevel: 1, plannedLevel: 1 },
    attributes: { for: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 },
    skills: { class: [], race: [], int: [] },
    origin: { regional: 'futura_lenda', benefits: [] },
    deity: { mode: '', name: '', power: '', previewPower: '', previewDeity: '', activePowerIndex: 0 },
    powers: { general: [], raceGroups: {}, futuraLendaClassPower: 'bencao_fortalecedora' },
    progression: [],
  };

  const stages = computePhase6SubStages({
    state: mockCharState,
    hasFuturaLenda: () => true,
  });
  assert.equal(stages.length, 1);
  assert.equal(stages[0].type, 'futura_lenda');
  assert.equal(
    checkPhase6StageComplete(stages[0], 0, {
      state: mockCharState,
      selectedFuturaLendaPower: () => mockCharState.powers.futuraLendaClassPower,
    }),
    true
  );
  console.log('✔ Share Code T20 e Sub-Estágios da Fase 6 aprovados!');
}

console.log('\n===============================================================');
console.log('🎉 SUCESSO TOTAL: Suíte TypeScript (Domínio + UI + Features) 100% aprovada!');
console.log('===============================================================');
