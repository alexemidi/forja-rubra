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
  identity: { plannedLevel: 6, raceId: 'humano', classId: 'guerreiro', raceChoices: {} },
  origin: { mode: 'single', standard: 'acolito' },
  deity: { mode: 'none', power: '' },
  powers: { general: [], raceGroups: {} },
  skills: { class: ['luta', 'pontaria', 'percepcao'] },
  progression: [
    { classId: 'guerreiro' },
    { classId: 'guerreiro' },
    { classId: 'guerreiro' },
    { classId: 'guerreiro' },
    { classId: 'guerreiro' },
    { classId: 'guerreiro' }
  ],
  inventory: []
};
window.finalAttrs = (trained = false) => ({ for: 3, des: 2, con: 1, int: 2, sab: 4, car: 0 });
window.SKILLS = [
  ['acrobacia', 'Acrobacia', 'des'],
  ['atletismo', 'Atletismo', 'for'],
  ['fortitude', 'Fortitude', 'con'],
  ['furtividade', 'Furtividade', 'des'],
  ['iniciativa', 'Iniciativa', 'des'],
  ['intimidacao', 'Intimidação', 'car'],
  ['luta', 'Luta', 'for'],
  ['percepcao', 'Percepção', 'sab'],
  ['pontaria', 'Pontaria', 'des'],
  ['reflexos', 'Reflexos', 'des'],
  ['vontade', 'Vontade', 'sab']
];
window.slug = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
window.raceById = id => (window.DATA && Array.isArray(window.DATA.races) ? window.DATA.races.find(r => r.id === id) : null) || { id, nome: id };
window.classById = id => (window.DATA && Array.isArray(window.DATA.classes) ? window.DATA.classes.find(c => c.id === id) : null) || {
  id,
  nome: id,
  caracteristicas: {
    pv: { inicial: 20, porNivel: 5 },
    pm: { inicial: 3, porNivel: 3 },
    proficiencias: ['armas_marciais', 'armaduras_pesadas', 'escudos']
  }
};
window.classLevelAt = (index, clsId) => index + 1;
window.allTrainedSkills = () => ['luta', 'pontaria', 'percepcao'];
window.characterTrainingBonus = () => 4;
window.calculatedSkillTotal = sk => (sk === 'luta' ? 10 : 8);
window.ensureProgression = () => {};
window.equipmentState = () => ({ dualAttack: false, wornIds: [], shieldId: null });
window.characterInventory = () => (typeof state !== 'undefined' && state?.inventory ? state.inventory : (window.state?.inventory || []));
window.sheetConditions = () => [];
window.characterClassLevel = () => 6;
window.racePowerGroups = () => [];
window.shouldSkipOriginPhase = () => false;
window.progressionPowerById = id => window.DATA.generalPowers.find(p => p.id === id) || window.DATA.classPowers.find(p => p.id === id) || { id, nome: id };
window.selectedGeneralPowers = () => (window.state?.powers?.general || []).map(id => window.progressionPowerById(id)).filter(Boolean);
window.selectedDeityFeatures = () => [];
window.selectedRaceOption = () => null;
window.characterRaceBody = () => ({ deslocamentoBase: 9 });
window.heldItemRecords = () => [];
window.singleWeaponStyleActive = () => false;
window.suraggelHeritage = () => null;
window.characterSpellKeyAttribute = () => null;

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

const RegrasPersonagem = require('../src/regras/nucleo/personagem.js');
window.RegrasPersonagem = RegrasPersonagem;
globalThis.RegrasPersonagem = RegrasPersonagem;

const navCode = fs.readFileSync('src/compartilhado/criador/navegacao-validacao.js', 'utf8');
const passivasCode = fs.readFileSync('src/regras/criador/passivas-proficiencias.js', 'utf8');
const estatisticasCode = fs.readFileSync('src/regras/criador/estatisticas.js', 'utf8');

eval(navCode);
eval(passivasCode);
eval(estatisticasCode);

for (const k of Object.keys(window)) {
  try { globalThis[k] = window[k]; } catch (_) {}
}

function resetState(overrides = {}) {
  window.state = {
    identity: { plannedLevel: 6, raceId: 'humano', classId: 'guerreiro', raceChoices: {} },
    origin: { mode: 'single', standard: 'acolito' },
    deity: { mode: 'none', power: '' },
    powers: { general: [], raceGroups: {} },
    skills: { class: ['luta', 'pontaria', 'percepcao'] },
    progression: [
      { classId: 'guerreiro' },
      { classId: 'guerreiro' },
      { classId: 'guerreiro' },
      { classId: 'guerreiro' },
      { classId: 'guerreiro' },
      { classId: 'guerreiro' }
    ],
    inventory: [],
    ...overrides
  };
  globalThis.state = window.state;
}

console.log('--- EXECUTANDO TESTES DO LOTE 6: DEVOÇÃO, ESCALONAMENTO E COMBATE ---');

// 1. Armas da Ambição: +1 ataque e +1 margem de ameaça
resetState({});
const espadaSemAmbicao = weaponPassiveStats({ id: 'espada_longa', arma: { combateId: 'corpo_a_corpo', empunhaduraId: 'uma_mao', critico: { margem: 19, multiplicador: 2 } } }, {});
resetState({
  powers: { general: ['armas_da_ambicao'], raceGroups: {} }
});
const espada = { id: 'espada_longa', arma: { combateId: 'corpo_a_corpo', empunhaduraId: 'uma_mao', critico: { margem: 19, multiplicador: 2 } } };
const espadaStats = weaponPassiveStats(espada, {});
assert.strictEqual(espadaStats.attack, espadaSemAmbicao.attack + 1, 'Armas da Ambição deve conceder +1 no teste de ataque');
const espadaCrit = configuredWeaponCritical(espada, {});
assert.strictEqual(espadaCrit.margem, 18, 'Armas da Ambição deve melhorar a margem de ameaça em 1 (19 vira 18)');
console.log('✓ Armas da Ambição: +1 no ataque e +1 na margem de ameaça validados');

// 2. Tradição de Lin-Wu: +1 margem de ameaça com katana
resetState({
  powers: { general: ['tradicao_de_lin_wu'], raceGroups: {} }
});
const katana = { id: 'katana', nome: 'Katana', arma: { combateId: 'corpo_a_corpo', empunhaduraId: 'uma_mao', critico: { margem: 19, multiplicador: 2 } } };
const katanaCrit = configuredWeaponCritical(katana, {});
assert.strictEqual(katanaCrit.margem, 18, 'Tradição de Lin-Wu deve melhorar a margem de ameaça da Katana para 18');
console.log('✓ Tradição de Lin-Wu: +1 na margem de ameaça com Katana validado');

// 3. Escamas Dracônicas: +2 Defesa e +2 Fortitude
resetState({
  powers: { general: ['escamas_draconicas'], raceGroups: {} }
});
const escamasPassives = passiveCharacterEffects();
assert.strictEqual(escamasPassives.defenseBonus, 2, 'Escamas Dracônicas deve dar +2 Defesa');
assert.strictEqual(escamasPassives.skillBonuses['fortitude'], 2, 'Escamas Dracônicas deve dar +2 Fortitude');
console.log('✓ Escamas Dracônicas: +2 Defesa e +2 Fortitude validados');

// 4. Habitante do Deserto: RD 10 fogo
resetState({
  powers: { general: ['habitante_do_deserto'], raceGroups: {} }
});
const desertoPassives = passiveCharacterEffects();
assert(desertoPassives.reductions.some(r => r.danoTipo === 'fogo' && r.valor === 10), 'Habitante do Deserto concede RD 10 fogo');
console.log('✓ Habitante do Deserto: RD 10 fogo validado');

// 5. Carapaça Corrompida: RD 1 geral + (tCount - 1)/2
resetState({
  powers: { general: ['carapaca_corrompida', 'antenas', 'olhos_vermelhos'], raceGroups: {} }
});
const carapacaCorrompidaPassives = passiveCharacterEffects();
// 3 poderes da tormenta: tCount = 3 -> 1 + Math.floor(2 / 2) = RD 2 geral
assert(carapacaCorrompidaPassives.reductions.some(r => r.danoTipo === 'todos' && r.valor === 2), 'Carapaça Corrompida com 3 poderes da Tormenta concede RD 2 geral');
console.log('✓ Carapaça Corrompida: RD progressiva por poderes da Tormenta validada');

// 6. Encouraçado e Encastelado com Armadura Pesada
const heavyArmorItem = { id: 'armadura_completa', categoriaId: 'pesada', tipo: 'armadura_pesada' };
resetState({
  inventory: [{ itemId: 'armadura_completa', equipped: true, item: heavyArmorItem }],
  powers: { general: ['encouracado', 'inexpugnavel', 'encastelado'], raceGroups: {} }
});
const heavyPassives = passiveCharacterEffects();
// Encouraçado: 2 base + 2 por inexpugnável + 2 por encastelado = +6 Defesa
assert.strictEqual(heavyPassives.defenseBonus, 6, 'Encouraçado com 2 dependentes deve dar +6 Defesa');
// Encastelado: 2 base + 1 por inexpugnável = RD 3 geral
assert(heavyPassives.reductions.some(r => r.danoTipo === 'todos' && r.valor === 3), 'Encastelado com dependente deve dar RD 3 geral');
console.log('✓ Encouraçado e Encastelado: escalonamento completo com armadura pesada validado');

// 7. Dom da Esperança: Sabedoria no lugar de Constituição nos PV
// baseAttrs: con = 1, sab = 4. Guerreiro nv 6: inicial 20 + 5 por nível (x5) = 45 de classe.
// Sem Dom da Esperança: 45 + 6*1 = 51 PV base.
resetState({});
const normalStats = progressionStats();
assert.strictEqual(normalStats.pv, 51, 'PV normal com Con 1 deve ser 51');

// Com Dom da Esperança: 45 + 6*4 (Sab) = 69 PV base!
resetState({
  powers: { general: ['dom_da_esperanca'], raceGroups: {} }
});
const esperancaStats = progressionStats();
assert.strictEqual(esperancaStats.pv, 69, 'PV com Dom da Esperança (Sab 4 em vez de Con 1) deve ser 69');
console.log('✓ Dom da Esperança: substituição de Constituição por Sabedoria em PV validada com sucesso');

console.log('\nTODOS OS TESTES DO LOTE 6 PASSARAM COM SUCESSO!');
