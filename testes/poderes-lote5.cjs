const assert = require('assert');
const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const dom = new JSDOM('<!DOCTYPE html><html><body><div id="app"></div></body></html>', {
  url: 'http://localhost/'
});
const { window } = dom;

// Configuração do ambiente global
window.state = {
  identity: { plannedLevel: 6, raceId: 'humano', raceChoices: {} },
  origin: { mode: 'single', standard: 'acolito' },
  deity: { mode: 'none', power: '' },
  powers: { general: [], raceGroups: {} },
  skills: { class: ['luta', 'pontaria', 'percepcao'] },
  progression: [{ classId: 'guerreiro' }],
  inventory: [],
  distinctions: { activeIds: [] }
};
window.finalAttrs = () => ({ for: 2, des: 3, con: 2, int: 2, sab: 4, car: 1 });
window.SKILLS = [
  ['acrobacia', 'Acrobacia', 'des'],
  ['atletismo', 'Atletismo', 'for'],
  ['fortitude', 'Fortitude', 'con'],
  ['furtividade', 'Furtividade', 'des'],
  ['iniciativa', 'Iniciativa', 'des'],
  ['intimidacao', 'Intimidação', 'car'],
  ['luta', 'Luta', 'for'],
  ['percepcao', 'Percepção', 'sab'],
  ['reflexos', 'Reflexos', 'des'],
  ['vontade', 'Vontade', 'sab']
];
window.slug = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
window.choiceId = item => (typeof item === 'string' ? item : item?.id || item?.nome || '');
window.choiceName = item => (typeof item === 'string' ? item : item?.nome || item?.id || '');
window.raceById = id => (window.DATA && Array.isArray(window.DATA.races) ? window.DATA.races.find(r => r.id === id) : null) || { id, nome: id };
window.classById = id => (window.DATA && Array.isArray(window.DATA.classes) ? window.DATA.classes.find(c => c.id === id) : null) || { id, nome: id };
window.classLevelAt = (index, clsId) => 1;
window.allTrainedSkills = () => ['luta', 'pontaria', 'percepcao'];
window.characterTrainingBonus = () => 2;
window.calculatedSkillTotal = sk => 2;
window.ensureProgression = () => {};
window.equipmentState = () => ({ dualAttack: false, wornIds: [], shieldId: null });
window.characterInventory = () => (typeof state !== 'undefined' && state?.inventory ? state.inventory : (window.state?.inventory || []));
window.sheetConditions = () => [];
window.characterClassLevel = () => 6;
window.racePowerGroups = () => [];
window.shouldSkipOriginPhase = () => false;
window.progressionPowerById = id => {
  if (String(id || '').startsWith('distincao:')) {
    const parts = id.split(':');
    const distId = parts[1], pId = parts[2];
    const dist = (window.DATA?.distinctions || []).find(d => d.id === distId);
    const p = dist?.poderes?.find(x => x.id === pId);
    return p ? { ...p, id, distinctionId: distId } : { id, nome: pId };
  }
  return window.DATA.generalPowers.find(p => p.id === id) || window.DATA.classPowers.find(p => p.id === id) || { id, nome: id };
};
window.selectedGeneralPowers = () => [];
window.selectedDeityFeatures = () => [];
window.selectedRaceOption = () => null;
window.characterRaceBody = () => ({ deslocamentoBase: 9 });
window.heldItemRecords = () => [];
window.singleWeaponStyleActive = () => false;

window.DATA = {
  generalPowers: JSON.parse(fs.readFileSync('dados/criador-generalPowers.json', 'utf8')),
  classPowers: JSON.parse(fs.readFileSync('dados/criador-classPowers.json', 'utf8')),
  classes: JSON.parse(fs.readFileSync('dados/criador-classes.json', 'utf8')),
  races: JSON.parse(fs.readFileSync('dados/criador-races.json', 'utf8')),
  distinctions: JSON.parse(fs.readFileSync('dados/distincoes.json', 'utf8')),
  pdfItems: JSON.parse(fs.readFileSync('dados/items.json', 'utf8'))
};

for (const k of Object.keys(window)) {
  try { globalThis[k] = window[k]; } catch (_) {}
}

const marcasModule = require('../src/nucleo/marcas-distincoes.mjs');
window.efeitosMarcas = marcasModule.efeitosMarcas;
globalThis.efeitosMarcas = marcasModule.efeitosMarcas;

const navCode = fs.readFileSync('src/compartilhado/criador/navegacao-validacao.js', 'utf8');
const passivasCode = fs.readFileSync('src/regras/criador/passivas-proficiencias.js', 'utf8');

eval(navCode);
eval(passivasCode);

for (const k of Object.keys(window)) {
  try { globalThis[k] = window[k]; } catch (_) {}
}

function resetState(overrides = {}) {
  window.state = {
    identity: { plannedLevel: 6, raceId: 'humano', raceChoices: {} },
    origin: { mode: 'single', standard: 'acolito' },
    deity: { mode: 'none', power: '' },
    powers: { general: [], raceGroups: {} },
    skills: { class: ['luta', 'pontaria', 'percepcao'] },
    progression: [{ classId: 'guerreiro' }],
    inventory: [],
    distinctions: { activeIds: [] },
    ...overrides
  };
  globalThis.state = window.state;
}

console.log('--- EXECUTANDO TESTES DO LOTE 5: RAÇAS AVANÇADAS E DISTINÇÕES ---');

// 1. Lefou: Deformidade conta no mínimo 2 poderes da Tormenta
resetState({ identity: { plannedLevel: 1, raceId: 'lefou', raceChoices: {} } });
const lefouCount = characterTormentaPowersCount();
assert.strictEqual(lefouCount, 2, 'Lefou deve contar com no mínimo 2 poderes da Tormenta por causa da Deformidade');
console.log('✓ Lefou: Deformidade conta corretamente como 2 poderes da Tormenta');

// 2. Osteon: Armadura Óssea concede RD 5 para corte, frio e perfuração
resetState({ identity: { plannedLevel: 1, raceId: 'osteon', raceChoices: {} } });
const osteonPassives = passiveCharacterEffects();
const osteonReds = osteonPassives.reductions;
assert(osteonReds.some(r => r.danoTipo === 'corte' && r.valor === 5), 'Osteon deve ter RD 5 corte');
assert(osteonReds.some(r => r.danoTipo === 'perfuracao' && r.valor === 5), 'Osteon deve ter RD 5 perfuração');
assert(osteonReds.some(r => r.danoTipo === 'frio' && r.valor === 5), 'Osteon deve ter RD 5 frio');
const osteonSummary = characterTotalReductionsSummary();
assert(osteonSummary.includes('RD 5/corte') && osteonSummary.includes('RD 5/frio'), 'characterTotalReductionsSummary deve listar RD 5 para cada tipo');
console.log('✓ Osteon: Armadura Óssea desmembra RD 5 (corte, perfuração, frio) corretamente');

// 3. Qareen: Resistência Elemental
resetState({ identity: { plannedLevel: 1, raceId: 'qareen', raceChoices: { qareen_resistencia_elemental: 'frio' } } });
const qareenPassives = passiveCharacterEffects();
assert(qareenPassives.reductions.some(r => (r.danoTipo === 'frio' || r.tipos?.includes('frio')) && r.valor === 10), 'Qareen deve ter RD 10 frio');
console.log('✓ Qareen: Resistência Elemental concede RD 10 ao elemento escolhido');

// 4. Golem: Chassi de metal (+5 Defesa) e pedra (+4 Defesa)
resetState({ identity: { plannedLevel: 1, raceId: 'golem', raceChoices: { golem_chassi: 'metal' } } });
const golemMetalPassives = passiveCharacterEffects();
assert.strictEqual(golemMetalPassives.defenseBonus, 5, 'Golem com chassi de metal deve ter +5 de Defesa');

resetState({ identity: { plannedLevel: 1, raceId: 'golem', raceChoices: { golem_chassi: 'pedra' } } });
const golemPedraPassives = passiveCharacterEffects();
assert.strictEqual(golemPedraPassives.defenseBonus, 4, 'Golem com chassi de pedra deve ter +4 de Defesa');
console.log('✓ Golem: Chassi de metal (+5) e pedra (+4) aplicados com sucesso');

// 5. Ceratops (Paquidérmico) e Kappa (Carapaça Kappa)
resetState({ identity: { plannedLevel: 1, raceId: 'ceratops', raceChoices: {} } });
const ceratopsPassives = passiveCharacterEffects();
assert.strictEqual(ceratopsPassives.defenseBonus, 2, 'Ceratops Paquidérmico concede +2 Defesa');

resetState({ identity: { plannedLevel: 1, raceId: 'kappa', raceChoices: {} } });
const kappaPassives = passiveCharacterEffects();
assert.strictEqual(kappaPassives.defenseBonus, 2, 'Kappa Carapaça concede +2 Defesa');
console.log('✓ Ceratops e Kappa: bônus de Defesa raciais aplicados');

// 6. Kaijin: Couraça Rubra
resetState({ identity: { plannedLevel: 1, raceId: 'kaijin', raceChoices: {} } });
const kaijinPassives = passiveCharacterEffects();
assert(kaijinPassives.reductions.some(r => r.danoTipo === 'fisico' && r.valor === 2), 'Kaijin deve ter RD 2 físico');
console.log('✓ Kaijin: Couraça Rubra concede RD 2 físico');

// 7. Distinções: Campeão de Dojo
resetState({
  identity: { plannedLevel: 6, raceId: 'humano' },
  progression: [
    { classId: 'guerreiro', powerId: 'distincao:campeao_de_dojo:sentidos_do_tigre' },
    { classId: 'guerreiro', powerId: 'distincao:campeao_de_dojo:caminhar_do_dragao' }
  ]
});
const dojoPassives = passiveCharacterEffects();
// sab = 4, logo defesa deve somar +4 e reflexos deve somar +4
assert.strictEqual(dojoPassives.defenseBonus, 4, 'Sentidos do Tigre deve somar Sabedoria (+4) na Defesa');
assert.strictEqual(dojoPassives.skillBonuses['reflexos'], 4, 'Sentidos do Tigre deve somar Sabedoria (+4) em Reflexos');
assert.strictEqual(dojoPassives.skillBonuses['atletismo'], 5, 'Caminhar do Dragão deve conceder +5 em Atletismo');
console.log('✓ Distinção Campeão de Dojo: Sentidos do Tigre e Caminhar do Dragão aprovados');

// 8. Distinções: Chapéu-preto e Cavaleiro do Corvo
resetState({
  identity: { plannedLevel: 6, raceId: 'humano' },
  progression: [
    { classId: 'guerreiro', powerId: 'distincao:chapeu_preto:rapido_ou_morto' }
  ]
});
const chapeuPassives = passiveCharacterEffects();
assert.strictEqual(chapeuPassives.skillBonuses['iniciativa'], 2, 'Rápido ou Morto concede +2 em Iniciativa');
assert.strictEqual(chapeuPassives.movementBonus, 3, 'Rápido ou Morto concede +3m de deslocamento');
console.log('✓ Distinção Chapéu-preto: Rápido ou Morto (+2 Iniciativa, +3m deslocamento) aprovado');

// 9. Distinções: Aeronauta Goblin (Estou Bem, Pessoal!)
resetState({
  identity: { plannedLevel: 6, raceId: 'humano' },
  progression: [
    { classId: 'guerreiro', powerId: 'distincao:aeronauta_goblin:estou_bem_pessoal' }
  ]
});
const aeroPassives = passiveCharacterEffects();
assert(aeroPassives.reductions.some(r => r.danoTipo === 'fogo' && r.valor === 5), 'Estou Bem Pessoal deve ter RD 5 fogo');
assert(aeroPassives.reductions.some(r => r.danoTipo === 'impacto' && r.valor === 5), 'Estou Bem Pessoal deve ter RD 5 impacto');
console.log('✓ Distinção Aeronauta Goblin: Estou Bem, Pessoal! (RD 5 fogo e impacto) aprovado');

// 10. Módulo puro efeitosMarcas: integração direta
const marcasRes = efeitosMarcas(['guardiao_da_realidade', 'chapeu_preto', 'amazona'], {
  sab: 4,
  heavyArmor: false
});
assert.strictEqual(marcasRes.defense, 2, 'efeitosMarcas Amazona sem armadura pesada deve dar +2 na Defesa');
assert.strictEqual(marcasRes.skills['fortitude'], 5, 'efeitosMarcas Guardião da Realidade deve dar +5 Fortitude');
assert.strictEqual(marcasRes.skills['reflexos'], 5, 'efeitosMarcas Guardião da Realidade deve dar +5 Reflexos');
assert.strictEqual(marcasRes.skills['vontade'], 5, 'efeitosMarcas Guardião da Realidade deve dar +5 Vontade');
assert.strictEqual(marcasRes.skills['intimidacao'], 2, 'efeitosMarcas Chapéu-preto deve dar +2 Intimidação');
assert.strictEqual(marcasRes.skills['diplomacia'], -2, 'efeitosMarcas Chapéu-preto deve dar -2 Diplomacia');
console.log('✓ Módulo puro efeitosMarcas: todos os cálculos puros validados com 100% de sucesso');

console.log('\nTODOS OS TESTES DO LOTE 5 PASSARAM COM SUCESSO!');
