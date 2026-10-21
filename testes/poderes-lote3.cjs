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
  identity: { plannedLevel: 5, raceId: 'humano' },
  origin: { mode: 'single', standard: 'acolito' },
  deity: { mode: 'none', power: '' },
  powers: { general: [], raceGroups: {} },
  skills: { class: ['luta', 'pontaria', 'percepcao'] },
  progression: [{ classId: 'arcanista' }],
  inventory: []
};
window.finalAttrs = () => ({ for: 0, des: 2, con: 2, int: 4, sab: 3, car: 3 });
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
window.classById = id => (window.DATA && Array.isArray(window.DATA.classes) ? window.DATA.classes.find(c => c.id === id) : null) || { id, nome: id, caracteristicas: { proficiencias: ['armas_simples', 'armaduras_leves'] } };
window.classLevelAt = (index, clsId) => {
  if (typeof state !== 'undefined' && Array.isArray(state?.progression)) {
    return state.progression.slice(0, index + 1).filter(r => r.classId === clsId).length;
  }
  return 1;
};
window.allTrainedSkills = () => ['pontaria', 'percepcao', 'misticismo'];
window.characterTrainingBonus = () => 2;
window.calculatedSkillTotal = sk => sk === 'pontaria' ? (window.finalAttrs().des + 2 + 2) : 2; // mod + treino + metade nivel
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
    progression: [{ classId: 'arcanista' }],
    inventory: [],
    ...overrides
  };
  window.state = s;
  globalThis.state = s;
  return s;
}

console.log('=== TESTES DO LOTE 3 DE CONJURADORES E ESPECIALISTAS (T20) ===\n');

// 1. Validando Arcanista: Poder Mágico (+1 PM por nível de arcanista)
console.log('1. Validando Arcanista: Poder Mágico (+1 PM por nível)...');
state = createState({
  identity: { classId: 'arcanista', plannedLevel: 6 },
  progression: [
    { classId: 'arcanista', level: 1 },
    { classId: 'arcanista', level: 2, powerId: 'arcanista_poder_magico' },
    { classId: 'arcanista', level: 3 },
    { classId: 'arcanista', level: 4 },
    { classId: 'arcanista', level: 5 },
    { classId: 'arcanista', level: 6 }
  ]
});

const passivesArc = calculatePassiveCharacterEffects();
assert.strictEqual(passivesArc.pmFlat, 6, 'Poder Mágico no 6º nível deve conceder +6 PM');
console.log('✔ Arcanista: Poder Mágico validado com sucesso!');

// 2. Validando Druida: Xamã Místico (+1 PM/nível), Penhascos (+2 Fort), Pradaria (+2 Refl), Lagos (+2 Vont)
console.log('\n2. Validando Druida: Xamã Místico e bônus elementais de resistência...');
state = createState({
  identity: { classId: 'druida', plannedLevel: 5 },
  progression: [
    { classId: 'druida', level: 1 },
    { classId: 'druida', level: 2, powerId: 'druida_xama_mistico' },
    { classId: 'druida', level: 3, powerId: 'druida_forca_dos_penhascos' },
    { classId: 'druida', level: 4, powerId: 'druida_liberdade_da_pradaria' },
    { classId: 'druida', level: 5, powerId: 'druida_tranquilidade_dos_lagos' }
  ]
});

const passivesDruid = calculatePassiveCharacterEffects();
assert.strictEqual(passivesDruid.pmFlat, 5, 'Xamã Místico no 5º nível deve conceder +5 PM');
assert.strictEqual(passivesDruid.skillBonuses['fortitude'], 2, 'Força dos Penhascos deve dar +2 Fortitude');
assert.strictEqual(passivesDruid.skillBonuses['reflexos'], 2, 'Liberdade da Pradaria deve dar +2 Reflexos');
assert.strictEqual(passivesDruid.skillBonuses['vontade'], 2, 'Tranquilidade dos Lagos deve dar +2 Vontade');
console.log('✔ Druida: Xamã Místico, Penhascos, Pradaria e Lagos validados com sucesso!');

// 3. Validando Inventor: Couraceiro (Int na Defesa) e Balística (Int no ataque e dano com Estilo de Disparo)
console.log('\n3. Validando Inventor: Couraceiro e Balística...');
finalAttrs = () => ({ for: 0, des: 1, con: 2, int: 5, sab: 1, car: 1 });
state = createState({
  identity: { classId: 'inventor', plannedLevel: 5 },
  progression: [
    { classId: 'inventor', level: 1 },
    { classId: 'inventor', level: 2, powerId: 'inventor_couraceiro' },
    { classId: 'inventor', level: 3, powerId: 'inventor_balistica' },
    { classId: 'inventor', level: 4, powerId: 'estilo_de_disparo' }
  ],
  inventory: [
    { itemId: 'armadura_de_couro', isEquipped: true, tipo: 'armadura_leve' }
  ]
});

const passivesInv = calculatePassiveCharacterEffects();
assert.strictEqual(passivesInv.defenseAttribute, 'int', 'Couraceiro deve permitir usar Inteligência na Defesa');

const arcoCurto = { id: 'arco_curto', nome: 'Arco Curto', arma: { dano: { principal: '1d6' }, combateId: 'a_distancia', empunhaduraId: 'duas_maos', propriedadesIds: ['disparo'] } };
const statsArco = weaponPassiveStats(arcoCurto, {});
// Des=1, Int=5. Com Balística o ataque soma +4 (Int - Des = 5 - 1 = 4)
// Com Estilo de Disparo e Balística, soma Int(5) no dano
assert.strictEqual(statsArco.damageBonus, 5, 'Balística com Estilo de Disparo deve somar Inteligência (+5) no dano');
assert.strictEqual(statsArco.damage, '1d6+5', 'Dano deve ser 1d6 + 5 (Inteligência)');
console.log('✔ Inventor: Couraceiro e Balística validados com sucesso!');

// 4. Validando Nobre (Líder Enérgico) e Místico (Visão Noturna)
console.log('\n4. Validando Nobre (Líder Enérgico) e Místico (Visão Noturna)...');
finalAttrs = () => ({ for: 0, des: 2, con: 1, int: 2, sab: 3, car: 4 });
state = createState({
  identity: { classId: 'nobre', plannedLevel: 4 },
  progression: [
    { classId: 'nobre', level: 1 },
    { classId: 'nobre', level: 2, powerId: 'nobre_lider_energico' },
    { classId: 'mistico', level: 3, powerId: 'mistico_visao_noturna' }
  ]
});

const passivesNobreMistico = calculatePassiveCharacterEffects();
assert.strictEqual(passivesNobreMistico.skillBonuses['iniciativa'], 4, 'Líder Enérgico deve somar Carisma (+4) em Iniciativa');
assert.strictEqual(passivesNobreMistico.skillBonuses['percepcao'], 2, 'Visão Noturna deve dar +2 em Percepção');
console.log('✔ Nobre: Líder Enérgico e Místico: Visão Noturna validados com sucesso!');

console.log('\n======================================================');
console.log('🎉 SUCESSO TOTAL: Todos os testes do Lote 3 passaram!');
console.log('======================================================\n');
