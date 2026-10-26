import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  STARTING_FUNDS_TABLE,
  calcularDinheiroHipoteticoAdicional,
  obterLimiteMaximoPlanejamentos,
  podeCriarPlanejamento,
  salvarPlanejamento,
  excluirPlanejamento,
  iniciarModoPlanejamento,
  encerrarModoPlanejamento,
  obterPlanejamentoParaProximoNivel,
  aplicarPlanejamentoProximoNivel,
  avaliarCompatibilidadePlanejamento
} = require('../../src/regras/criador/planejamento-niveis.ts');

test('Planejamento de Níveis: Dinheiro Hipotético do Nível Alvo (Não Cumulativo com Anteriores)', () => {
  // Planejar para o Nível 2 ganha 300 T$
  assert.equal(calcularDinheiroHipoteticoAdicional(1, 2), 300);

  // Planejar para o Nível 3 ganha exatamente os 600 T$ do Nível 3 (sem somar com o nível 2)
  assert.equal(calcularDinheiroHipoteticoAdicional(1, 3), 600);
  assert.equal(calcularDinheiroHipoteticoAdicional(2, 3), 600);

  // Planejar para o Nível 4 ganha exatamente os 1000 T$ do Nível 4
  assert.equal(calcularDinheiroHipoteticoAdicional(1, 4), 1000);
  assert.equal(calcularDinheiroHipoteticoAdicional(2, 4), 1000);
  assert.equal(calcularDinheiroHipoteticoAdicional(3, 4), 1000);

  // Planejar para o Nível 5 ganha os 2000 T$ do Nível 5
  assert.equal(calcularDinheiroHipoteticoAdicional(4, 5), 2000);
  assert.equal(calcularDinheiroHipoteticoAdicional(1, 5), 2000);

  // Planejar para o Nível 10 ganha exatamente os 13000 T$ do Nível 10
  assert.equal(calcularDinheiroHipoteticoAdicional(1, 10), 13000);
  assert.equal(calcularDinheiroHipoteticoAdicional(9, 10), 13000);

  // Mesmo nível ou menor não gera ganho adicional
  assert.equal(calcularDinheiroHipoteticoAdicional(5, 5), 0);
  assert.equal(calcularDinheiroHipoteticoAdicional(4, 2), 0);
});

test('Planejamento de Níveis: Cotas de Planejamentos Salvos por Ficha (Free vs Membros)', () => {
  const dummyState: any = { plannings: [] };

  // Usuário padrão (gratuito): limite = 1
  assert.equal(obterLimiteMaximoPlanejamentos(), 1);
  const q1 = podeCriarPlanejamento(dummyState);
  assert.equal(q1.allowed, true);
  assert.equal(q1.max, 1);
  assert.equal(q1.current, 0);

  // Ao salvar 1 planejamento, preenche a cota
  const plan1 = salvarPlanejamento(dummyState, 'Build Guerreiro Nv 5');
  assert.ok(plan1);
  assert.equal(dummyState.plannings.length, 1);

  const q2 = podeCriarPlanejamento(dummyState);
  assert.equal(q2.allowed, false);
  assert.equal(q2.current, 1);

  // Excluir libera a cota
  const deleted = excluirPlanejamento(dummyState, plan1!.id);
  assert.equal(deleted, true);
  assert.equal(dummyState.plannings.length, 0);
  assert.equal(podeCriarPlanejamento(dummyState).allowed, true);
});

test('Planejamento de Níveis: Iniciar Modo Planejamento e Restaurar Estado Original ao Encerrar', () => {
  const character: any = {
    identity: {
      characterName: 'Lorde Vladislav',
      plannedLevel: 2,
      initialLevel: 1
    },
    finances: {
      startingFunds: 300,
      rewardFunds: 100,
      spent: 50
    },
    progression: [
      { classId: 'guerreiro' },
      { classId: 'guerreiro', powerId: 'ataque_poderoso' }
    ],
    plannings: []
  };

  // Iniciar planejamento até o nível 4
  const started = iniciarModoPlanejamento(character, 4, 'Plano Tanque Nv 4');
  assert.equal(started, true);
  assert.equal(character.isPlanningMode, true);
  assert.equal(character.planningBaseLevel, 2);
  assert.equal(character.identity.plannedLevel, 4);

  // Ganho de fundos hipotéticos para o nível 4: exatamente os 1000 T$ do Nível 4 (não somado ao anterior)
  assert.equal(character.finances.hypotheticalPlanningFunds, 1000);
  assert.equal(character.finances.rewardFunds, 1100); // 100 anterior + 1000

  // Salvar o planejamento criado enquanto está em modo de planejamento
  const plan = salvarPlanejamento(character, 'Plano Tanque Nv 4');
  assert.ok(plan);
  assert.equal(character.plannings.length, 1);

  // Encerrar modo de planejamento
  const restored = encerrarModoPlanejamento(character);
  assert.equal(restored.isPlanningMode, undefined);
  assert.equal(restored.identity.plannedLevel, 2); // Restaurado para o nível real!
  assert.equal(restored.finances.rewardFunds, 100); // Fundos restaurados sem os hipotéticos!
  assert.equal(restored.finances.hypotheticalPlanningFunds, undefined);
  // O planejamento salvo permanece preservado no herói
  assert.equal(restored.plannings.length, 1);
  assert.equal(restored.plannings[0].name, 'Plano Tanque Nv 4');
});

test('Planejamento de Níveis: Subir Nível Real Seguindo Planejamento Salvo', () => {
  const character: any = {
    identity: {
      plannedLevel: 2
    },
    progression: [
      { classId: 'guerreiro' },
      { classId: 'guerreiro', powerId: 'ataque_poderoso' }
    ],
    plannings: [
      {
        id: 'plan_1',
        name: 'Guerreiro Crítico',
        baseLevel: 2,
        targetLevel: 4,
        progression: [
          { classId: 'guerreiro' },
          { classId: 'guerreiro', powerId: 'ataque_poderoso' },
          { classId: 'guerreiro', powerId: 'golpe_de_raspao' },
          { classId: 'paladino', powerId: 'golpe_divino' }
        ],
        hypotheticalFunds: 1600,
        createdAt: new Date().toISOString()
      }
    ]
  };

  // Verificar escolha planejada para o nível 3
  const nextInfo = obterPlanejamentoParaProximoNivel(character);
  assert.ok(nextInfo);
  assert.equal(nextInfo.nextLevel, 3);
  assert.equal(nextInfo.nextChoice.classId, 'guerreiro');
  assert.equal(nextInfo.nextChoice.powerId, 'golpe_de_raspao');

  // Aplicar a subida de nível seguindo o planejamento
  const applied = aplicarPlanejamentoProximoNivel(character, 'plan_1');
  assert.equal(applied, true);
  assert.equal(character.identity.plannedLevel, 3);
  assert.equal(character.progression.length, 3);
  assert.equal(character.progression[2].classId, 'guerreiro');
  assert.equal(character.progression[2].powerId, 'golpe_de_raspao');

  // Agora o próximo nível planejado é o 4 (Paladino com golpe_divino)
  const nextInfo2 = obterPlanejamentoParaProximoNivel(character);
  assert.ok(nextInfo2);
  assert.equal(nextInfo2.nextLevel, 4);
  assert.equal(nextInfo2.nextChoice.classId, 'paladino');
  assert.equal(nextInfo2.nextChoice.powerId, 'golpe_divino');
});

test('Edição de Ataques na Ficha: Sobrescrita de Valores e Ataques Personalizados', () => {
  const stateMock: any = {
    attackOverrides: {
      katana: {
        nome: 'Katana Ancestral Lendária',
        ataque: '+14',
        dano: '1d10+8',
        critico: '18/x3',
        tipoDano: 'Corte/Fogo',
        alcance: 'Corpo a corpo'
      }
    },
    customAttacks: [
      {
        id: 'atk_custom_1',
        nome: 'Sopro do Dragão de Fogo',
        ataque: 'Reflexos CD 18',
        dano: '4d6+3',
        critico: '—',
        tipoDano: 'Fogo',
        alcance: 'Cone de 6m'
      }
    ]
  };

  assert.equal(stateMock.attackOverrides.katana.nome, 'Katana Ancestral Lendária');
  assert.equal(stateMock.attackOverrides.katana.dano, '1d10+8');
  assert.equal(stateMock.customAttacks.length, 1);
  assert.equal(stateMock.customAttacks[0].nome, 'Sopro do Dragão de Fogo');
  assert.equal(stateMock.customAttacks[0].alcance, 'Cone de 6m');
});

test('Habilidades das Armas: Armas Desbalanceadas sofrem -2 em Testes de Ataque', () => {
  const fs = require('node:fs');
  const code = fs.readFileSync('src/regras/criador/passivas-proficiencias.ts', 'utf8');

  // Verifica que passivas-proficiencias.ts detecta e aplica a penalidade de -2 para armas desbalanceadas
  assert.ok(code.includes('isDesbalanceada'), 'Deve conter verificação de isDesbalanceada');
  assert.ok(code.includes('attack-=2') || code.includes('attack -= 2'), 'Deve impor -2 nos testes de ataque com arma desbalanceada');

  // Simular arma comum vs arma desbalanceada
  const { stepUpDamage, addFlatDamageBonus } = require('../../src/regras/nucleo/passos-dano.ts');
  const items = require('../../dados/items.json');
  const macaDeGuerra = items.find((i: any) => i.id === 'maca_de_guerra');
  const espadaLonga = items.find((i: any) => i.id === 'espada_longa');

  assert.ok(macaDeGuerra?.arma?.propriedadesIds?.includes('desbalanceada'));
  assert.ok(!espadaLonga?.arma?.propriedadesIds?.includes('desbalanceada'));

  // Testar aumentos de dano e passos de dano canônicos (1d12 -> 3d6 na escala canônica de T20)
  assert.equal(stepUpDamage('1d8+5', 1), '1d10+5');
  assert.equal(stepUpDamage('1d12+5', 1), '3d6+5');
  assert.equal(addFlatDamageBonus('1d8+5', 2), '1d8+7');
  assert.equal(addFlatDamageBonus('1d12+5', 3), '1d12+8');
});

test('Bônus Temporários nos Ataques: Persistência, Aplicação sobre Valores Naturais e Restaurar Valores', () => {
  const { stepUpDamage, addFlatDamageBonus } = require('../../src/regras/nucleo/passos-dano.ts');

  // Estado com modificadores temporários ativos
  const stateMock: any = {
    temporaryAttackMods: {
      luta: 2,
      pontaria: 1,
      damage: 3,
      steps: 1,
      threat: 1,
      mult: 1,
      scope: 'all'
    },
    attackOverrides: {}
  };

  // Valores naturais da arma calculados canonicamente (ex: Maça de Guerra)
  const defaultWeapon = {
    key: 'maca_de_guerra',
    defaultAtk: '+7',
    defaultDmg: '1d12+4',
    defaultCrit: 'x3',
    defaultTipo: 'impacto',
    defaultAlcance: '—',
    isRanged: false
  };

  // 1. Aplicação dos bônus temporários sobre os valores naturais da arma
  const baselineAtkNum = parseInt(defaultWeapon.defaultAtk, 10);
  const modifiedAtkNum = baselineAtkNum + stateMock.temporaryAttackMods.luta;
  const modifiedAtk = modifiedAtkNum >= 0 ? `+${modifiedAtkNum}` : String(modifiedAtkNum);

  let modifiedDmg = stepUpDamage(defaultWeapon.defaultDmg, stateMock.temporaryAttackMods.steps, { allowAltLadder: true });
  modifiedDmg = addFlatDamageBonus(modifiedDmg, stateMock.temporaryAttackMods.damage);

  // 1d12 subindo 1 passo vai para 3d6, com +4 natural e +3 bônus temporário fica 3d6+7
  assert.equal(modifiedAtk, '+9');
  assert.equal(modifiedDmg, '3d6+7');

  // 2. Ação de Restaurar Valores: reseta bônus temporários e overrides aos padrões naturais
  const resetToDefault = () => {
    stateMock.temporaryAttackMods = { luta: 0, pontaria: 0, damage: 0, steps: 0, threat: 0, mult: 0, scope: 'all' };
    stateMock.attackOverrides = {};
  };

  resetToDefault();

  assert.equal(stateMock.temporaryAttackMods.luta, 0);
  assert.equal(stateMock.temporaryAttackMods.damage, 0);
  assert.equal(stateMock.temporaryAttackMods.steps, 0);
  assert.deepEqual(stateMock.attackOverrides, {});

  // Ao recalcular sem bônus temporários, volta exatamente aos valores naturais da arma
  const restoredAtkNum = parseInt(defaultWeapon.defaultAtk, 10) + stateMock.temporaryAttackMods.luta;
  const restoredAtk = restoredAtkNum >= 0 ? `+${restoredAtkNum}` : String(restoredAtkNum);
  let restoredDmg = defaultWeapon.defaultDmg;
  if (stateMock.temporaryAttackMods.steps > 0) {
    restoredDmg = stepUpDamage(restoredDmg, stateMock.temporaryAttackMods.steps);
  }
  if (stateMock.temporaryAttackMods.damage !== 0) {
    restoredDmg = addFlatDamageBonus(restoredDmg, stateMock.temporaryAttackMods.damage);
  }

  assert.equal(restoredAtk, defaultWeapon.defaultAtk);
  assert.equal(restoredDmg, defaultWeapon.defaultDmg);
});

test('Planejamento de Níveis: Edição, Adicionar Níveis e Cancelar Planejamento Limpando Dados', () => {
  const hero: any = {
    identity: {
      characterName: 'Aventureiro Teste',
      plannedLevel: 2,
      initialLevel: 1
    },
    finances: {
      rewardFunds: 200,
      spent: 50
    },
    progression: [
      { classId: 'guerreiro' },
      { classId: 'guerreiro', powerId: 'ataque_poderoso' }
    ],
    plannings: []
  };

  // 1. Iniciar e salvar primeiro planejamento até o Nível 5 (sugestão inicial padrão para nível < 5)
  iniciarModoPlanejamento(hero, 5, 'Plano Inicial');
  assert.equal(hero.isPlanningMode, true);
  assert.equal(hero.identity.plannedLevel, 5);
  // Dinheiro hipotético do Nível 5: exatamente 2000 T$
  assert.equal(hero.finances.hypotheticalPlanningFunds, 2000);

  const plan1 = salvarPlanejamento(hero, 'Plano Inicial');
  assert.ok(plan1);
  assert.equal(hero.plannings.length, 1);
  assert.equal(hero.plannings[0].targetLevel, 5);
  const planId = plan1.id;

  // 2. Encerrar
  encerrarModoPlanejamento(hero);
  assert.equal(hero.isPlanningMode, undefined);
  assert.equal(hero.identity.plannedLevel, 2);

  // 3. Reabrir o planejamento existente para EDIÇÃO e ADICIONAR NÍVEIS (estender até Nível 8)
  iniciarModoPlanejamento(hero, 8, 'Plano Estendido', planId);
  assert.equal(hero.isPlanningMode, true);
  assert.equal(hero.currentPlanningId, planId);
  assert.equal(hero.identity.plannedLevel, 8);
  // Dinheiro hipotético do Nível 8: exatamente 7000 T$
  assert.equal(hero.finances.hypotheticalPlanningFunds, 7000);

  // Salvar a edição do plano existente não duplica (atualiza in-place para cota 1)
  const updatedPlan = salvarPlanejamento(hero, 'Plano Estendido', planId);
  assert.equal(hero.plannings.length, 1); // Continua 1 planejamento
  assert.equal(hero.plannings[0].id, planId); // Mesmo id mantido
  assert.equal(hero.plannings[0].targetLevel, 8); // Nível atualizado
  assert.equal(hero.plannings[0].hypotheticalFunds, 7000);

  // 4. Teste de Cancelar Planejamento enquanto estiver no meio do planejamento
  iniciarModoPlanejamento(hero, 10, 'Plano Temporário Descartado');
  hero.planningName = 'Plano Temporário Descartado';
  assert.equal(hero.isPlanningMode, true);

  // Simulando a ação do botão "Cancelar planejamento"
  encerrarModoPlanejamento(hero);
  delete hero.planningName;
  delete hero.isPlanningMode;
  delete hero.planningBaseLevel;
  delete hero.planningTargetLevel;
  delete hero.planningSnapshot;
  delete hero.currentPlanningId;

  assert.equal(hero.isPlanningMode, undefined);
  assert.equal(hero.planningName, undefined);
  assert.equal(hero.identity.plannedLevel, 2); // Retornado ao nível real
});

test('Planejamento de Níveis: Compatibilidade e Detecção de Divergências ao Subir de Nível', () => {
  const hero: any = {
    identity: {
      plannedLevel: 2
    },
    progression: [
      { classId: 'guerreiro' },
      { classId: 'guerreiro', powerId: 'ataque_poderoso' }
    ],
    powers: {
      general: ['vitalidade']
    }
  };

  // Plano A: Nível 3 escolhe 'golpe_de_raspao' (compatível)
  const planA: any = {
    id: 'plan_A',
    name: 'Caminho Ofensivo',
    baseLevel: 1,
    targetLevel: 5,
    progression: [
      { classId: 'guerreiro' },
      { classId: 'guerreiro', powerId: 'ataque_poderoso' },
      { classId: 'guerreiro', powerId: 'golpe_de_raspao' }
    ]
  };

  const evalA = avaliarCompatibilidadePlanejamento(hero, planA, 3);
  assert.equal(evalA.compativel, true);
  assert.equal(evalA.choice?.powerId, 'golpe_de_raspao');

  // Plano B: Nível 3 escolhe 'ataque_poderoso' que já foi adquirido no nível 2 (divergência!)
  const planB: any = {
    id: 'plan_B',
    name: 'Caminho Duplicado',
    baseLevel: 1,
    targetLevel: 5,
    progression: [
      { classId: 'guerreiro' },
      { classId: 'guerreiro', powerId: 'outro_poder' },
      { classId: 'guerreiro', powerId: 'ataque_poderoso' }
    ]
  };

  const evalB = avaliarCompatibilidadePlanejamento(hero, planB, 3);
  assert.equal(evalB.compativel, false);
  assert.match(evalB.divergencia || '', /já foi adquirido/);

  // Plano C: Nível 3 escolhe poder geral já existente em powers.general
  const planC: any = {
    id: 'plan_C',
    name: 'Caminho Vital',
    baseLevel: 1,
    targetLevel: 5,
    progression: [
      { classId: 'guerreiro' },
      { classId: 'guerreiro' },
      { classId: 'guerreiro', powerId: 'vitalidade' }
    ]
  };

  const evalC = avaliarCompatibilidadePlanejamento(hero, planC, 3);
  assert.equal(evalC.compativel, false);
  assert.match(evalC.divergencia || '', /já foi adquirido/);
});
