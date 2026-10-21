const assert = require('assert');
const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const dom = new JSDOM('<!DOCTYPE html><html><body><div id="app"></div></body></html>', {
  url: 'http://localhost/'
});
const { window } = dom;

// Configuração do ambiente global no window e no globalThis
window.state = {
  identity: { plannedLevel: 5, raceId: 'humano' },
  origin: { mode: 'single', standard: 'acolito' },
  deity: { mode: 'none', power: '' },
  powers: { general: [], raceGroups: {} },
  skills: { class: ['luta', 'pontaria', 'percepcao'] },
  progression: [{ classId: 'guerreiro' }],
  inventory: []
};
window.finalAttrs = () => ({ for: 3, des: 2, con: 2, int: 1, sab: 4, car: 3 });
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
window.classById = id => ({ id, nome: id, caracteristicas: { proficiencias: ['armas_marciais', 'armaduras_pesadas', 'escudos'] } });
window.allTrainedSkills = () => ['luta', 'pontaria', 'percepcao'];
window.characterTrainingBonus = () => 2;
window.ensureProgression = () => {};
window.equipmentState = () => ({ dualAttack: false, wornIds: [] });
window.equippedArmorItem = () => null;
window.characterInventory = () => (typeof state !== 'undefined' && state?.inventory ? state.inventory : (window.state?.inventory || []));
window.sheetConditions = () => [];
window.characterClassLevel = () => 1;
window.racePowerGroups = () => [];
window.shouldSkipOriginPhase = () => false;
window.classLevelAt = () => 1;
window.progressionPowerById = id => window.DATA.classPowers.find(p => p.id === id) || window.DATA.generalPowers.find(p => p.id === id) || { id, nome: id };
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

// Sincroniza globais
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

console.log('=== TESTES DO LOTE 1 DE PODERES E AUTOMAÇÕES (T20) ===\n');

// 1. Validando contagem de poderes da Tormenta e Carapaça / Pele Corrompida
console.log('1. Validando contagem de poderes da Tormenta e Carapaça / Pele Corrompida...');
window.isChildCharacter = () => false;
isChildCharacter = () => false;
state = createState({
  identity: { raceId: 'humano', plannedLevel: 5 },
  progression: [
    { classId: 'guerreiro', powerId: 'carapaca' },
    { classId: 'guerreiro', powerId: 'antenas' },
    { classId: 'guerreiro', powerId: 'pele_corrompida' }
  ]
});

const passivesT3 = calculatePassiveCharacterEffects();
assert.strictEqual(characterTormentaPowersCount(), 3, 'Deveria contar 3 poderes da Tormenta');
assert.strictEqual(passivesT3.defenseBonus, 3, 'Carapaça com 3 poderes deve dar +3 Defesa (2 + floor(2/2))');
assert.strictEqual(passivesT3.skillBonuses['iniciativa'], 2, 'Antenas com 3 poderes deve dar +2 Iniciativa');
assert.strictEqual(passivesT3.skillBonuses['percepcao'], 2, 'Antenas com 3 poderes deve dar +2 Percepção');
assert.strictEqual(passivesT3.skillBonuses['vontade'], 2, 'Antenas com 3 poderes deve dar +2 Vontade');

const rdFogo = passivesT3.reductions.find(r => r.danoTipo === 'fogo');
assert.ok(rdFogo, 'Pele Corrompida deve conceder RD Fogo');
assert.strictEqual(rdFogo.valor, 4, 'Pele Corrompida com 3 poderes deve ter RD 4 (2 + 2*floor(2/2))');
console.log('✔ Contagem e escalonamento de poderes da Tormenta (Carapaça, Pele Corrompida, Antenas) validados!');

// 2. Validando Inexpugnável e Encouraçado com Armadura Pesada
console.log('\n2. Validando Inexpugnável e Encouraçado...');
state = createState({
  identity: { raceId: 'humano', plannedLevel: 6 },
  progression: [
    { classId: 'cavaleiro', powerId: 'encouracado' },
    { classId: 'cavaleiro', powerId: 'inexpugnavel' }
  ],
  inventory: [
    { itemId: 'armadura_completa', isEquipped: true, tipo: 'armadura_pesada' }
  ]
});

const passivesArmadura = calculatePassiveCharacterEffects();
assert.strictEqual(passivesArmadura.defenseBonus, 4, 'Encouraçado (+2) + Inexpugnável (+2) deve dar +4 Defesa');
assert.strictEqual(passivesArmadura.skillBonuses['fortitude'], 2, 'Inexpugnável deve dar +2 Fortitude');
assert.strictEqual(passivesArmadura.skillBonuses['reflexos'], 2, 'Inexpugnável deve dar +2 Reflexos');
assert.strictEqual(passivesArmadura.skillBonuses['vontade'], 2, 'Inexpugnável deve dar +2 Vontade');
console.log('✔ Inexpugnável e Encouraçado com armadura pesada validados com sucesso!');

// 3. Validando Arqueiro e Estilo de Disparo
console.log('\n3. Validando Arqueiro e Estilo de Disparo em armas à distância...');
finalAttrs = () => ({ for: 2, des: 3, con: 1, int: 0, sab: 4, car: 0 });
state = createState({
  identity: { raceId: 'humano', plannedLevel: 3 }, // nível 3 (Sab 4 limitada a 3)
  progression: [
    { classId: 'cacador', powerId: 'cacador_arqueiro' },
    { classId: 'cacador', powerId: 'estilo_de_disparo' }
  ]
});

const arcoLongo = {
  id: 'arco_longo',
  nome: 'Arco Longo',
  arma: { combateId: 'a_distancia', propriedadesIds: ['disparo'], dano: { principal: '1d8' } }
};

// Arco Longo tem Força inerente no dano (+2), Arqueiro soma Sab limitada pelo nível (+3), Estilo de Disparo soma Des (+3)
// Total bônus dano = 2 (for) + 3 (sab arqueiro nível 3) + 3 (des estilo disparo) = 8
const statsArco = weaponPassiveStats(arcoLongo, {});
assert.strictEqual(statsArco.damage, '1d8+8', 'Dano do arco longo deve ser 1d8+8 com For, Sab(limitada ao nível) e Des');
console.log('✔ Arqueiro e Estilo de Disparo validados com sucesso!');

// 4. Validando Esgrimista
console.log('\n4. Validando Esgrimista em armas leves e ágeis...');
finalAttrs = () => ({ for: 1, des: 3, con: 0, int: 4, sab: 0, car: 0 });
state = createState({
  identity: { raceId: 'humano', plannedLevel: 2 }, // nível 2 (Int 4 limitada a 2)
  progression: [
    { classId: 'bucaneiro', powerId: 'bucaneiro_esgrimista' }
  ]
});

const florete = {
  id: 'florete',
  nome: 'Florete',
  arma: { combateId: 'corpo_a_corpo', empunhaduraId: 'leve', propriedadesIds: ['agil'], dano: { principal: '1d6' } }
};

// Florete: For 1 + Int limitada pelo nível (min(4, 2) = 2) = 1 + 2 = 3
const statsFlorete = weaponPassiveStats(florete, {});
assert.strictEqual(statsFlorete.damage, '1d6+3', 'Dano do florete deve ser 1d6+3 com Força + Inteligência do Esgrimista');
console.log('✔ Esgrimista validado com sucesso!');

// 5. Validando Ataque Preciso
console.log('\n5. Validando Ataque Preciso...');
state = createState({
  identity: { raceId: 'humano', plannedLevel: 4 },
  progression: [
    { classId: 'guerreiro', powerId: 'estilo_de_uma_arma' },
    { classId: 'guerreiro', powerId: 'ataque_preciso' }
  ]
});

singleWeaponStyleActive = () => true;

const espadaLonga = {
  id: 'espada_longa',
  nome: 'Espada Longa',
  arma: { combateId: 'corpo_a_corpo', critico: { margem: 19, multiplicador: 2 } }
};

const crit = configuredWeaponCritical(espadaLonga, {});
// Margem base 19 - 2 = 17, Multiplicador 2 + 1 = 3x
assert.strictEqual(crit.margem, 17, 'Margem de ameaça com Ataque Preciso deve ser 17');
assert.strictEqual(crit.multiplicador, 3, 'Multiplicador com Ataque Preciso deve ser 3x');
console.log('✔ Ataque Preciso (+2 margem e +1 multiplicador) validado com sucesso!');

// 6. Validando Mochileiro e Grandão no núcleo de mochilas
console.log('\n6. Validando Mochileiro e Grandão na capacidade de carga...');
const { bonusPoderesCarga } = require('../src/nucleo/mochilas.mjs');
const cargaBonus = bonusPoderesCarga([
  { id: 'mochileiro', nome: 'Mochileiro' },
  { id: 'grandao', nome: 'Grandão' }
]);
assert.strictEqual(cargaBonus, 10, 'Mochileiro (+5) e Grandão (+5) devem somar +10 espaços');
console.log('✔ Mochileiro e Grandão validados com sucesso no núcleo de mochilas!');

console.log('\n======================================================');
console.log('🎉 SUCESSO TOTAL: Todos os testes do Lote 1 passaram!');
console.log('======================================================');
