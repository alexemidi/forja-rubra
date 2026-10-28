import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
const {
  resolveWeaponGrip,
  isSingleWeaponStyleActive,
  isTwoHandedWeaponStyleActive,
  isWeaponAndShieldStyleActive,
  isDualWeaponAttackReady
} = require('../../src/features/inventory/hands.ts');

test('Estilos de Combate: Estilo de Arma e Escudo aumenta em +2 o bônus na Defesa em Outros/Bônus apenas quando empunha arma + escudo', () => {
  const navCode = fs.readFileSync('src/compartilhado/criador/navegacao-validacao.ts', 'utf8');
  assert.ok(
    navCode.includes("characterHasFeature('estilo_de_arma_e_escudo')"),
    'calculatePassiveCharacterEffects deve verificar estilo_de_arma_e_escudo'
  );
  assert.ok(
    navCode.includes('weaponAndShieldStyleActive'),
    'calculatePassiveCharacterEffects deve verificar se arma e escudo estão empunhados simultaneamente (weaponAndShieldStyleActive)'
  );
  assert.ok(
    navCode.includes('result.defenseBonus+=2'),
    'calculatePassiveCharacterEffects deve adicionar +2 em defenseBonus (Outros/Bônus) com Estilo de Arma e Escudo e arma + escudo equipados'
  );

  const estCode = fs.readFileSync('src/compartilhado/criador/estado-e-catalogos.ts', 'utf8');
  assert.ok(
    !estCode.includes('shieldStyleBonus = 2'),
    'shieldPassiveStats não deve somar o +2 do Estilo de Arma e Escudo diretamente no campo de escudo'
  );

  const armaRecord = {
    id: 'inst_maca',
    entry: { instanceId: 'inst_maca', itemId: 'maca' },
    item: { id: 'maca', nome: 'Maça', tipo: 'arma', arma: { combateId: 'corpo_a_corpo', empunhaduraId: 'uma_mao' } },
    grip: 'uma_mao'
  };
  const arma2Record = {
    id: 'inst_adaga',
    entry: { instanceId: 'inst_adaga', itemId: 'adaga' },
    item: { id: 'adaga', nome: 'Adaga', tipo: 'arma', arma: { combateId: 'corpo_a_corpo', empunhaduraId: 'leve' } },
    grip: 'leve'
  };
  const escudoRecord = {
    id: 'inst_escudo',
    entry: { instanceId: 'inst_escudo', itemId: 'escudo_leve' },
    item: { id: 'escudo_leve', nome: 'Escudo Leve', tipo: 'escudo', escudo: { bonusDefesa: 1, penalidade: -1 } },
    grip: 'uma_mao'
  };

  // Arma + Escudo => true
  assert.equal(isWeaponAndShieldStyleActive([armaRecord, escudoRecord]), true);
  // Apenas Arma (mão vazia) => false
  assert.equal(isWeaponAndShieldStyleActive([armaRecord]), false);
  // Apenas Escudo (mão vazia) => false
  assert.equal(isWeaponAndShieldStyleActive([escudoRecord]), false);
  // Duas Armas => false
  assert.equal(isWeaponAndShieldStyleActive([armaRecord, arma2Record]), false);
  // Mãos vazias => false
  assert.equal(isWeaponAndShieldStyleActive([]), false);
});

test('Estilos de Combate: Estilo de Duas Mãos e Defesa Armada aplicam +5 no dano e +2 Defesa/Fortitude', () => {
  const passivesCode = fs.readFileSync('src/regras/criador/passivas-proficiencias.ts', 'utf8');
  assert.ok(
    passivesCode.includes("characterHasFeature('estilo_de_duas_maos')"),
    'weaponPassiveStats deve verificar estilo_de_duas_maos'
  );
  assert.ok(
    passivesCode.includes('extraDamage += 5'),
    'weaponPassiveStats deve somar +5 no dano quando Estilo de Duas Mãos estiver ativo com arma de duas mãos'
  );

  const navCode = fs.readFileSync('src/compartilhado/criador/navegacao-validacao.ts', 'utf8');
  assert.ok(
    navCode.includes("characterHasFeature('defesa_armada')"),
    'calculatePassiveCharacterEffects deve verificar defesa_armada'
  );

  const montanteEntry = { instanceId: 'inst_montante', itemId: 'montante' };
  const heldTwoHand = [
    {
      id: 'inst_montante',
      entry: montanteEntry,
      item: {
        id: 'montante',
        nome: 'Montante',
        tipo: 'arma',
        arma: { combateId: 'corpo_a_corpo', empunhaduraId: 'duas_maos' }
      },
      grip: 'duas_maos'
    }
  ];
  assert.equal(isTwoHandedWeaponStyleActive(heldTwoHand, montanteEntry), true);
  assert.equal(isSingleWeaponStyleActive(heldTwoHand, montanteEntry), false);
});

test('Estilos de Combate: Estilo de Duas Armas e Arma Secundária Grande', () => {
  const espada1 = {
    id: 'inst_1',
    entry: { instanceId: 'inst_1', itemId: 'espada_longa' },
    item: {
      id: 'espada_longa',
      nome: 'Espada Longa',
      tipo: 'arma',
      arma: { combateId: 'corpo_a_corpo', empunhaduraId: 'uma_mao' }
    },
    grip: 'uma_mao'
  };
  const espada2 = {
    id: 'inst_2',
    entry: { instanceId: 'inst_2', itemId: 'espada_longa' },
    item: {
      id: 'espada_longa',
      nome: 'Espada Longa',
      tipo: 'arma',
      arma: { combateId: 'corpo_a_corpo', empunhaduraId: 'uma_mao' }
    },
    grip: 'uma_mao'
  };
  const adaga = {
    id: 'inst_3',
    entry: { instanceId: 'inst_3', itemId: 'adaga' },
    item: {
      id: 'adaga',
      nome: 'Adaga',
      tipo: 'arma',
      arma: { combateId: 'corpo_a_corpo', empunhaduraId: 'leve' }
    },
    grip: 'leve'
  };

  // Sem Arma Secundária Grande, duas espadas longas não ativam ataque duplo sem arma leve
  assert.equal(isDualWeaponAttackReady([espada1, espada2], true, false), false);
  // Com uma arma leve (adaga), ativa normalmente
  assert.equal(isDualWeaponAttackReady([espada1, adaga], true, false), true);
  // Com Arma Secundária Grande, duas armas de uma mão ativam normalmente
  assert.equal(isDualWeaponAttackReady([espada1, espada2], true, true), true);
});

test('Estilos de Combate: Estilo de Arma Longa, Estilo de Arremesso, Estilo Desarmado, Estilo Clássico e Precisão Letal', () => {
  const passivesCode = fs.readFileSync('src/regras/criador/passivas-proficiencias.ts', 'utf8');

  assert.ok(
    passivesCode.includes("characterHasFeature('estilo_de_arma_longa')"),
    'Deve implementar Estilo de Arma Longa (+2 em ataque com armas alongadas)'
  );
  assert.ok(
    passivesCode.includes("characterHasFeature('estilo_de_arremesso')"),
    'Deve implementar Estilo de Arremesso (+2 no dano e +2 no ataque com Saque Rápido)'
  );
  assert.ok(
    passivesCode.includes("characterHasFeature('arremesso_potente')"),
    'Deve implementar Arremesso Potente (Força em ataque de arremesso)'
  );
  assert.ok(
    passivesCode.includes("characterHasFeature('estilo_desarmado')"),
    'Deve implementar Estilo Desarmado (dano desarmado base 1d6)'
  );
  assert.ok(
    passivesCode.includes("characterHasFeature('estilo_classico')"),
    'Deve implementar Estilo Clássico (+2 dano com espada + escudo)'
  );
  assert.ok(
    passivesCode.includes("characterHasFeature('precisao_letal')"),
    'Deve implementar Precisão Letal (+1 na margem de ameaça)'
  );
});

test('Exportação Roll20: exporta individualmente origens regionais e poderes obtidos (ex: Cosmopolita) além de magias, itens e defesaoutros', () => {
  const roll20ExportCode = fs.readFileSync('src/integracoes/criador/exportacao-roll20.ts', 'utf8');
  assert.ok(
    roll20ExportCode.includes('expandRoll20CharacterFeatures'),
    'exportacao-roll20.ts deve definir expandRoll20CharacterFeatures para exportar individualmente origens, complicações e poderes obtidos'
  );
  assert.ok(
    roll20ExportCode.includes('Poder obtido:'),
    'expandRoll20CharacterFeatures deve indicar qual poder foi obtido via Cosmopolita e exportar o poder obtido como entrada individual'
  );
  assert.ok(
    roll20ExportCode.includes('sobrevivencia_treinada'),
    'roll20EquipmentRecord deve exportar o estado equipado/vestido em sobrevivencia_treinada e o peso em equipslot'
  );
  assert.ok(
    roll20ExportCode.includes('defesaoutros'),
    'roll20DefenseFields deve exportar o campo defesaoutros para bônus na Defesa como Estilo de Arma e Escudo'
  );
});
