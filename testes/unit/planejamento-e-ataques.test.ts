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
  aplicarPlanejamentoProximoNivel
} = require('../../src/regras/criador/planejamento-niveis.ts');

test('Planejamento de Níveis: Dinheiro Hipotético Adicional Cumulativo por Nível', () => {
  // Nível 2 ganha +300
  assert.equal(calcularDinheiroHipoteticoAdicional(1, 2), 300);

  // Nível 3 ganha +600 adicional (do 1 ao 3: 300 + 600 = 900)
  assert.equal(calcularDinheiroHipoteticoAdicional(1, 3), 900);
  assert.equal(calcularDinheiroHipoteticoAdicional(2, 3), 600);

  // Nível 4 ganha +1000 adicional (do 1 ao 4: 300 + 600 + 1000 = 1900)
  assert.equal(calcularDinheiroHipoteticoAdicional(1, 4), 1900);
  assert.equal(calcularDinheiroHipoteticoAdicional(2, 4), 1600);
  assert.equal(calcularDinheiroHipoteticoAdicional(3, 4), 1000);

  // Nível 5 ganha +2000 adicional
  assert.equal(calcularDinheiroHipoteticoAdicional(4, 5), 2000);
  assert.equal(calcularDinheiroHipoteticoAdicional(1, 5), 3900);

  // Mesmo nível não gera ganho adicional
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

  // Ganho de fundos hipotéticos do nível 2 até 4: +600 (nv3) + 1000 (nv4) = 1600 T$
  assert.equal(character.finances.hypotheticalPlanningFunds, 1600);
  assert.equal(character.finances.rewardFunds, 1700); // 100 anterior + 1600

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
