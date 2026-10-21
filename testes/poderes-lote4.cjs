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
  identity: { plannedLevel: 6, raceId: 'humano' },
  origin: { mode: 'single', standard: 'acolito' },
  deity: { mode: 'none', power: '' },
  powers: { general: [], raceGroups: {} },
  skills: { class: ['luta', 'pontaria', 'percepcao'] },
  progression: [{ classId: 'guerreiro' }],
  inventory: []
};
window.finalAttrs = () => ({ for: 2, des: 4, con: 3, int: 3, sab: 1, car: 0 });
window.SKILLS = [
  ['acrobacia', 'Acrobacia', 'des'],
  ['adestramento', 'Adestramento', 'car'],
  ['atletismo', 'Atletismo', 'for'],
  ['atuacao', 'Atuação', 'car'],
  ['cavalgar', 'Cavalgar', 'des'],
  ['conhecimento', 'Conhecimento', 'int'],
  ['cura', 'Cura', 'sab'],
  ['diplomacia', 'Diplomacia', 'car'],
  ['enganacao', 'Enganação', 'car'],
  ['fortitude', 'Fortitude', 'con'],
  ['furtividade', 'Furtividade', 'des'],
  ['guerra', 'Guerra', 'int'],
  ['iniciativa', 'Iniciativa', 'des'],
  ['intimidacao', 'Intimidação', 'car'],
  ['intuicao', 'Intuição', 'sab'],
  ['investigacao', 'Investigação', 'int'],
  ['jogatina', 'Jogatina', 'car'],
  ['ladinagem', 'Ladinagem', 'des'],
  ['luta', 'Luta', 'for'],
  ['misticismo', 'Misticismo', 'int'],
  ['nobreza', 'Nobreza', 'int'],
  ['oficio', 'Ofício', 'int'],
  ['percepcao', 'Percepção', 'sab'],
  ['pilotagem', 'Pilotagem', 'des'],
  ['pontaria', 'Pontaria', 'des'],
  ['religiao', 'Religião', 'sab'],
  ['reflexos', 'Reflexos', 'des'],
  ['sobrevivencia', 'Sobrevivência', 'sab'],
  ['vontade', 'Vontade', 'sab']
];
window.slug = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
window.raceById = () => ({ nome: 'Humano' });
window.classById = id => (window.DATA && Array.isArray(window.DATA.classes) ? window.DATA.classes.find(c => c.id === id) : null) || { id, nome: id, caracteristicas: { proficiencias: ['armas_marciais', 'armaduras_pesadas', 'escudos'] } };
window.classLevelAt = (index, clsId) => {
  if (typeof state !== 'undefined' && Array.isArray(state?.progression)) {
    return state.progression.slice(0, index + 1).filter(r => r.classId === clsId).length;
  }
  return 1;
};
window.allTrainedSkills = () => ['luta', 'pontaria', 'percepcao'];
window.characterTrainingBonus = () => 2;
window.calculatedSkillTotal = sk => 2;
window.ensureProgression = () => {};
window.equipmentState = () => ({ dualAttack: false, wornIds: [], shieldId: null });
window.characterInventory = () => (typeof state !== 'undefined' && state?.inventory ? state.inventory : (window.state?.inventory || []));
window.sheetConditions = () => [];
window.characterClassLevel = clsId => {
  if (typeof state !== 'undefined') {
    const fromProg = (state.progression || []).filter(r => r.classId === clsId).length;
    if (fromProg > 0) return fromProg;
    if (state.identity?.classId === clsId) return Number(state.identity?.plannedLevel) || 1;
  }
  return 1;
};
window.racePowerGroups = () => [];
window.shouldSkipOriginPhase = () => false;
window.progressionPowerById = id => window.DATA.generalPowers.find(p => p.id === id) || window.DATA.classPowers.find(p => p.id === id) || { id, nome: id };
window.selectedGeneralPowers = () => [];
window.selectedDeityFeatures = () => [];
window.selectedRaceOption = () => null;
window.characterRaceBody = () => ({ deslocamentoBase: 9 });
window.suraggelHeritage = () => null;
window.heldItemRecords = () => [];
window.singleWeaponStyleActive = () => false;

window.DATA = {
  generalPowers: JSON.parse(fs.readFileSync('dados/criador-generalPowers.json', 'utf8')),
  classPowers: JSON.parse(fs.readFileSync('dados/criador-classPowers.json', 'utf8')),
  classes: JSON.parse(fs.readFileSync('dados/criador-classes.json', 'utf8')),
  races: JSON.parse(fs.readFileSync('dados/criador-races.json', 'utf8')),
  pdfItems: JSON.parse(fs.readFileSync('dados/items.json', 'utf8'))
};

for (const k of Object.keys(window)) {
  try { globalThis[k] = window[k]; } catch (_) {}
}

const navCode = fs.readFileSync('src/compartilhado/criador/navegacao-validacao.js', 'utf8');
const passivasCode = fs.readFileSync('src/regras/criador/passivas-proficiencias.js', 'utf8');

eval(navCode);
eval(passivasCode);

for (const k of Object.keys(window)) {
  try { globalThis[k] = window[k]; } catch (_) {}
}

function createState(overrides = {}) {
  const s = {
    identity: { plannedLevel: 1, raceId: 'humano' },
    origin: { mode: 'single', standard: 'acolito' },
    deity: { mode: 'none', power: '' },
    powers: { general: [], raceGroups: {} },
    skills: { class: [] },
    progression: [{ classId: 'guerreiro' }],
    inventory: [],
    ...overrides
  };
  window.state = s;
  globalThis.state = s;
  return s;
}

console.log('=== TESTES DO LOTE 4 DE PODERES GERAIS, DESTINO E DIVINDADES (T20) ===\n');

// 1. Validando Vitalidade (+1 PV/nível e +2 Fortitude) e Vontade de Ferro (+1 PM a cada 2 níveis e +2 Vontade)
console.log('1. Validando Vitalidade e Vontade de Ferro...');
state = createState({
  identity: { plannedLevel: 6, raceId: 'humano' },
  progression: [
    { classId: 'guerreiro', level: 1 },
    { classId: 'guerreiro', level: 2, powerId: 'vitalidade' },
    { classId: 'guerreiro', level: 3, powerId: 'vontade_de_ferro' },
    { classId: 'guerreiro', level: 4 },
    { classId: 'guerreiro', level: 5 },
    { classId: 'guerreiro', level: 6 }
  ]
});

const passivesVitVont = calculatePassiveCharacterEffects();
assert.strictEqual(passivesVitVont.pvPerLevel, 1, 'Vitalidade deve dar +1 PV por nível');
assert.strictEqual(passivesVitVont.skillBonuses['fortitude'], 2, 'Vitalidade deve dar +2 Fortitude');
assert.strictEqual(passivesVitVont.pmFlat, 3, 'Vontade de Ferro no 6º nível deve dar +3 PM (6 / 2)');
assert.strictEqual(passivesVitVont.skillBonuses['vontade'], 2, 'Vontade de Ferro deve dar +2 Vontade');
console.log('✔ Vitalidade e Vontade de Ferro validados com sucesso!');

// 2. Validando Esquiva (+2 Defesa e +2 Reflexos) e Atlético (+2 Atletismo e +3m deslocamento)
console.log('\n2. Validando Esquiva e Atlético...');
state = createState({
  identity: { plannedLevel: 4, raceId: 'humano' },
  progression: [
    { classId: 'guerreiro', level: 1 },
    { classId: 'guerreiro', level: 2, powerId: 'esquiva' },
    { classId: 'guerreiro', level: 3, powerId: 'atletico' },
    { classId: 'guerreiro', level: 4 }
  ]
});

const passivesEsqAtl = calculatePassiveCharacterEffects();
assert.strictEqual(passivesEsqAtl.defenseBonus, 2, 'Esquiva deve conceder +2 na Defesa');
assert.strictEqual(passivesEsqAtl.skillBonuses['reflexos'], 2, 'Esquiva deve conceder +2 em Reflexos');
assert.strictEqual(passivesEsqAtl.skillBonuses['atletismo'], 2, 'Atlético deve conceder +2 em Atletismo');
assert.strictEqual(passivesEsqAtl.movementBonus, 3, 'Atlético deve conceder +3m no deslocamento');
console.log('✔ Esquiva e Atlético validados com sucesso!');

// 3. Validando Investigador (+2 Investigação e +Int em Intuição) e Bênção do Mana (+1 PM por nível ímpar)
console.log('\n3. Validando Investigador e Bênção do Mana...');
finalAttrs = () => ({ for: 0, des: 2, con: 1, int: 4, sab: 2, car: 0 });
state = createState({
  identity: { plannedLevel: 5, raceId: 'humano' },
  progression: [
    { classId: 'arcanista', level: 1 },
    { classId: 'arcanista', level: 2, powerId: 'investigador' },
    { classId: 'arcanista', level: 3, powerId: 'bencao_do_mana' },
    { classId: 'arcanista', level: 4 },
    { classId: 'arcanista', level: 5 }
  ]
});

const passivesInvBenc = calculatePassiveCharacterEffects();
assert.strictEqual(passivesInvBenc.skillBonuses['investigacao'], 2, 'Investigador deve dar +2 em Investigação');
assert.strictEqual(passivesInvBenc.skillBonuses['intuicao'], 4, 'Investigador deve somar Inteligência (+4) em Intuição');
// Nível 5: níveis ímpares 1, 3, 5 = 3 PM
assert.strictEqual(passivesInvBenc.pmFlat, 3, 'Bênção do Mana no 5º nível deve conceder 3 PM');
console.log('✔ Investigador e Bênção do Mana validados com sucesso!');

// 4. Validando Acrobático (Destreza em Atletismo) e Foco em Arma (+2 no ataque)
console.log('\n4. Validando Acrobático e Foco em Arma...');
state = createState({
  identity: { plannedLevel: 4, raceId: 'humano' },
  progression: [
    { classId: 'guerreiro', level: 1 },
    { classId: 'guerreiro', level: 2, powerId: 'acrobatico' },
    { classId: 'guerreiro', level: 3, powerId: 'foco_em_arma', powerChoice: 'espada_longa' },
    { classId: 'guerreiro', level: 4 }
  ]
});

const attrAtletismo = skillEffectiveAttribute('atletismo');
assert.strictEqual(attrAtletismo, 'des', 'Acrobático deve alterar atributo de Atletismo para Destreza (des)');

const espada = { id: 'espada_longa', nome: 'Espada Longa', arma: { dano: { principal: '1d8' }, combateId: 'corpo_a_corpo', empunhaduraId: 'uma_mao', propriedadesIds: [] } };
const statsEspada = weaponPassiveStats(espada, {});
// calculatedSkillTotal real calcula Força(2) + metade do nível 4(2) = 4. Com Foco em Arma (+2), total = 6
assert.strictEqual(statsEspada.attack, 6, 'Foco em Arma deve conceder +2 no teste de ataque com a arma escolhida (base 4 + 2 = 6)');
console.log('✔ Acrobático e Foco em Arma validados com sucesso!');

console.log('\n======================================================');
console.log('🎉 SUCESSO TOTAL: Todos os testes do Lote 4 passaram!');
console.log('======================================================\n');
