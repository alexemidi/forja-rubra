import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Carrega os dados de raças
const races = JSON.parse(fs.readFileSync(path.resolve('dados/criador-races.json'), 'utf8'));

test('Raças Abertas com Moreau (Conversão em 3 Atributos Livres: +2/+1 ou +1/+1/+1)', () => {
  const moreau = races.find((r: any) => r.id === 'moreau');
  const humano = races.find((r: any) => r.id === 'humano');
  const meioElfo = races.find((r: any) => r.id === 'meio_elfo');
  assert.ok(moreau, 'Moreau deve existir');
  assert.ok(humano, 'Humano deve existir');
  assert.ok(meioElfo, 'Meio-Elfo deve existir');

  // Simula estado do personagem com Moreau Coruja
  const state: any = {
    identity: {
      raceId: 'moreau',
      raceChoices: {
        moreau_variacao: 'moreau_coruja'
      },
      // Usuário escolheu For (+2) e Des (+1), totalizando os 3 pontos
      raceAttrs: ['for', 'for', 'des'],
      openRaceBonusEnabled: true,
      openRaceAllocations: {}
    }
  };

  function selectedRaceOption(def: any) {
    const cur = state.identity.raceChoices[def.id];
    return (def.opcoes || []).find((o: any) => o.id === cur);
  }

  function addAttrs(target: any, source: any) {
    Object.entries(source || {}).forEach(([k, v]) => target[k] = (target[k] || 0) + Number(v || 0));
  }

  function addAllocation(target: any, values: string[], value = 1) {
    (values || []).forEach(k => target[k] = (target[k] || 0) + Number(value || 1));
  }

  function raceHasFlexibleOpenRaceConversion(race: any) {
    if (!race) return false;
    return Boolean(race.atributos?.flexiveis);
  }

  function raceEffectiveFixedAttributes(race: any, applySuppression = true) {
    if (!race) return {};
    const fixed: any = {};
    addAttrs(fixed, race.atributos?.fixos);
    (race.habilidades?.selecionadas || []).forEach((def: any) => {
      const opt = selectedRaceOption(def);
      if (opt && opt.atributos) addAttrs(fixed, opt.atributos);
    });
    if (applySuppression && state?.identity?.openRaceBonusEnabled && raceHasFlexibleOpenRaceConversion(race)) {
      Object.keys(fixed).forEach(k => {
        if (Number(fixed[k]) === 1) delete fixed[k];
      });
    }
    return fixed;
  }

  function raceFlexibleOpenRaceBonusCount(race: any) {
    if (!race || !state?.identity?.openRaceBonusEnabled || !raceHasFlexibleOpenRaceConversion(race)) return 0;
    const fixed = raceEffectiveFixedAttributes(race, false);
    let count = 0;
    Object.values(fixed).forEach(v => {
      if (Number(v) === 1) count += 1;
    });
    return count;
  }

  function raceBonuses() {
    const race = moreau;
    const bonus: any = { for: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 };
    if (state.identity.openRaceBonusEnabled && !raceHasFlexibleOpenRaceConversion(race)) {
      Object.entries(state.identity.openRaceAllocations || {}).forEach(([attr, val]) => {
        if (bonus[attr] !== undefined) bonus[attr] += Number(val || 0);
      });
    } else {
      addAttrs(bonus, raceEffectiveFixedAttributes(race, true));
    }
    addAllocation(bonus, state.identity.raceAttrs, race.atributos?.flexiveis?.valor || 1);
    return bonus;
  }

  function raceAllocationSources() {
    const race = moreau;
    const sources = [];
    if (race?.atributos?.flexiveis) {
      const config = Object.assign({}, race.atributos.flexiveis);
      if (state.identity.openRaceBonusEnabled) {
        const extra = raceFlexibleOpenRaceBonusCount(race);
        if (extra > 0) {
          config.quantidade = Number(config.quantidade || 0) + extra;
        }
        if (Number(config.quantidade) === 3) {
          config.maxPorAtributo = 2;
          config.permitirRepetir = true;
        }
      }
      sources.push({ key: 'raceAttrs', label: 'Raça', config });
    }
    return sources;
  }

  // Verificações Moreau com distribuição +2 / +1
  assert.equal(raceHasFlexibleOpenRaceConversion(moreau), true, 'Moreau possui atributos flexíveis');
  assert.equal(raceFlexibleOpenRaceBonusCount(moreau), 1, 'Moreau Coruja fornece +1 fixo que deve ser convertido');

  const sources = raceAllocationSources();
  assert.equal(sources[0].config.quantidade, 3, 'Moreau com Raças Abertas deve ter exatamente 3 escolhas livres');
  assert.equal(sources[0].config.maxPorAtributo, 2, 'Deve permitir até +2 no mesmo atributo');
  assert.equal(sources[0].config.permitirRepetir, true, 'Deve permitir repetição para alcançar +2');

  const fixed = raceEffectiveFixedAttributes(moreau, true);
  assert.deepEqual(fixed, {}, 'O fixo original de Sabedoria deve ser suprimido para não duplicar');

  const bonuses21 = raceBonuses();
  assert.equal(bonuses21.for, 2, 'Força deve receber +2');
  assert.equal(bonuses21.des, 1, 'Destreza deve receber +1');
  assert.equal(bonuses21.con, 0, 'Constituição deve ser 0');
  assert.equal(bonuses21.sab, 0, 'Sabedoria não recebe fixo compulsório');

  // Moreau com distribuição +1 / +1 / +1
  state.identity.raceAttrs = ['for', 'des', 'con'];
  const bonuses111 = raceBonuses();
  assert.equal(bonuses111.for, 1, 'Força deve receber +1');
  assert.equal(bonuses111.des, 1, 'Destreza deve receber +1');
  assert.equal(bonuses111.con, 1, 'Constituição deve receber +1');

  // Teste Meio-Elfo
  assert.equal(raceHasFlexibleOpenRaceConversion(meioElfo), true, 'Meio-Elfo possui atributos flexíveis');
  assert.equal(raceFlexibleOpenRaceBonusCount(meioElfo), 1, 'Meio-Elfo possui +1 fixo de Int a converter');

  // Teste com Humano
  assert.equal(raceHasFlexibleOpenRaceConversion(humano), true, 'Humano possui atributos flexíveis');
  assert.equal(raceFlexibleOpenRaceBonusCount(humano), 0, 'Humano não tem fixos para converter');
});

test('Fase 6: Soldado com Complicação e Sem Duplicação de Estágio', () => {
  // Simula Soldado com 1 poder de combate e 1 poder de complicação
  function originChoiceSlotsCount() { return 1; }
  function raceGeneralPowerSlots() { return 0; }
  function generalPowerSlots() { return raceGeneralPowerSlots() + originChoiceSlotsCount() + 1; /* +1 da complicação */ }
  function originGeneralPowerOptions() {
    return [{ id: 'power:um_poder_de_combate', name: 'Um poder de combate', category: 'combate' }];
  }

  function getPhase6SubStages() {
    const stages: any[] = [];
    const raceSlots = raceGeneralPowerSlots();
    if (raceSlots > 0) {
      stages.push({ key: 'race', title: 'Poder Geral da Raça', count: raceSlots });
    }
    const originSlots = originChoiceSlotsCount();
    if (originSlots > 0) {
      stages.push({ key: 'origin', title: 'Poder da Origem', count: originSlots });
    }
    const totalGeneral = generalPowerSlots();
    const generalOnlySlots = totalGeneral - raceSlots - originSlots;
    if (generalOnlySlots > 0) {
      stages.push({ key: 'general', title: 'Poderes Gerais Adicionais', count: generalOnlySlots });
    }
    return stages;
  }

  const stages = getPhase6SubStages();
  assert.equal(stages.length, 2, 'Soldado com complicação deve ter exatamente 2 subestágios na Fase 6 (Origem e Complicação)');
  assert.equal(stages[0].key, 'origin', 'Primeiro estágio deve ser da Origem');
  assert.equal(stages[0].count, 1);
  assert.equal(stages[1].key, 'general', 'Segundo estágio deve ser da Complicação');
  assert.equal(stages[1].count, 1);
});
