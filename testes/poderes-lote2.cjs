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
window.classById = id => (window.DATA && Array.isArray(window.DATA.classes) ? window.DATA.classes.find(c => c.id === id) : null) || { id, nome: id, caracteristicas: { proficiencias: ['armas_marciais', 'armaduras_pesadas', 'escudos'] } };
window.classLevelAt = (index, clsId) => {
  if (typeof state !== 'undefined' && Array.isArray(state?.progression)) {
    return state.progression.slice(0, index + 1).filter(r => r.classId === clsId).length;
  }
  return 1;
};
window.allTrainedSkills = () => ['luta', 'pontaria', 'percepcao'];
window.characterTrainingBonus = () => 2;
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
    progression: [{ classId: 'guerreiro' }],
    inventory: [],
    ...overrides
  };
  window.state = s;
  globalThis.state = s;
  return s;
}

console.log('=== TESTES DO LOTE 2 DE PODERES E COMBATENTES (T20) ===\n');

// 1. Validando Bárbaro: Pele de Ferro (+4), Pele de Aço (+8), Totem Espiritual (+Sab PM) e RD progressiva
console.log('1. Validando Bárbaro: Pele de Ferro, Pele de Aço, Totem Espiritual e RD progressiva...');
finalAttrs = () => ({ for: 4, des: 2, con: 3, int: 0, sab: 3, car: 1 });
state = createState({
  identity: { classId: 'barbaro', plannedLevel: 8 },
  progression: [
    { classId: 'barbaro', level: 1 },
    { classId: 'barbaro', level: 2, powerId: 'barbaro_pele_de_ferro' },
    { classId: 'barbaro', level: 3 },
    { classId: 'barbaro', level: 4, powerId: 'barbaro_totem_espiritual' },
    { classId: 'barbaro', level: 5 },
    { classId: 'barbaro', level: 6 },
    { classId: 'barbaro', level: 7 },
    { classId: 'barbaro', level: 8, powerId: 'barbaro_pele_de_aco' }
  ]
});

const passivesBarb = calculatePassiveCharacterEffects();
assert.strictEqual(passivesBarb.defenseBonus, 8, 'Pele de Ferro com Pele de Aço sem armadura pesada deve conceder +8 Defesa');
assert.strictEqual(passivesBarb.pmFlat, 3, 'Totem Espiritual deve somar Sabedoria (+3) no PM');
const barbRd = passivesBarb.reductions.find(r => r.tipo === 'reducao_dano');
assert.ok(barbRd, 'Bárbaro de 8º nível deve ter Redução de Dano');
assert.strictEqual(barbRd.valor, 4, 'Bárbaro de 8º nível deve ter RD 4 (2 no 5º + 2 no 8º)');
console.log('✔ Bárbaro: Pele de Ferro, Pele de Aço, Totem Espiritual e RD progressiva validados!');

// 2. Validando Lutador: Casca Grossa (+Con Defesa e progressão), Sarado (+For em PV e Fortitude), Briga e Trincado
console.log('\n2. Validando Lutador: Casca Grossa, Sarado, Briga e Trincado...');
finalAttrs = () => ({ for: 5, des: 2, con: 4, int: 0, sab: 1, car: 0 });
state = createState({
  identity: { classId: 'lutador', plannedLevel: 7 },
  progression: [
    { classId: 'lutador', level: 1 },
    { classId: 'lutador', level: 2, powerId: 'lutador_sarado' },
    { classId: 'lutador', level: 3 },
    { classId: 'lutador', level: 4, powerId: 'lutador_trincado' },
    { classId: 'lutador', level: 5 },
    { classId: 'lutador', level: 6 },
    { classId: 'lutador', level: 7 }
  ]
});

const passivesLut = calculatePassiveCharacterEffects();
// Casca grossa soma Con (+4) + 1 no nível 7 = +5 Defesa
assert.strictEqual(passivesLut.defenseBonus, 5, 'Casca Grossa no 7º nível deve conceder +5 na Defesa (+4 Con + 1 pelo 7º nível)');
assert.strictEqual(passivesLut.pvFlat, 5, 'Sarado deve somar Força (+5) no total de PV');
assert.strictEqual(passivesLut.skillBonuses['fortitude'], 5, 'Sarado deve somar Força (+5) em Fortitude');

// Testando dano desarmado do Lutador (Briga nível 7 -> 1d8, Trincado -> +Con de dano)
const unarmedItem = { id: 'ataque_desarmado', nome: 'Ataque Desarmado', arma: { dano: { principal: '1d3' }, combateId: 'corpo_a_corpo', empunhaduraId: 'leve', propriedadesIds: [] } };
const statsUnarmed = weaponPassiveStats(unarmedItem, {});
assert.strictEqual(statsUnarmed.damageBonus, 4, 'Trincado deve somar Constituição (+4) no dano desarmado');
// Dano total esperado: 1d8 + For(5) + Con(4) = 1d8+9
assert.strictEqual(statsUnarmed.damage, '1d8+9', 'Briga no 7º nível causa 1d8 + Força + Trincado (Con)');
console.log('✔ Lutador: Casca Grossa, Sarado, Briga e Trincado validados com sucesso!');

// 3. Validando Cavaleiro: Bastião (RD 5), Especialização em Armadura (RD 5) e Solidez
console.log('\n3. Validando Cavaleiro: Bastião, Especialização em Armadura e Solidez...');
state = createState({
  identity: { classId: 'cavaleiro', plannedLevel: 12 },
  progression: [
    { classId: 'cavaleiro', level: 1 },
    { classId: 'cavaleiro', level: 2, powerId: 'cavaleiro_solidez' },
    { classId: 'cavaleiro', level: 5, powerChoice: 'bastiao' },
    { classId: 'cavaleiro', level: 12, powerId: 'cavaleiro_especializacao_em_armadura' }
  ],
  inventory: [
    { itemId: 'armadura_completa', isEquipped: true, tipo: 'armadura_pesada' },
    { itemId: 'escudo_pesado', isEquipped: true, tipo: 'escudo', armadura: { bonusDefesa: 2 } }
  ]
});

const passivesCav = calculatePassiveCharacterEffects();
const totalRD = passivesCav.reductions.reduce((sum, r) => sum + r.valor, 0);
assert.strictEqual(totalRD, 10, 'Bastião (5) + Especialização em Armadura (5) devem somar RD 10 com armadura pesada');
assert.strictEqual(passivesCav.skillBonuses['fortitude'], 2, 'Solidez deve somar +2 (escudo pesado) em Fortitude');
assert.strictEqual(passivesCav.skillBonuses['reflexos'], 2, 'Solidez deve somar +2 (escudo pesado) em Reflexos');
assert.strictEqual(passivesCav.skillBonuses['vontade'], 2, 'Solidez deve somar +2 (escudo pesado) em Vontade');
console.log('✔ Cavaleiro: Bastião, Especialização em Armadura e Solidez validados!');

// 4. Validando Paladino: Aura Sagrada (+Car em resistências) e Aura de Invencibilidade (RD 5)
console.log('\n4. Validando Paladino: Aura Sagrada e Aura de Invencibilidade...');
finalAttrs = () => ({ for: 3, des: 1, con: 2, int: 0, sab: 2, car: 4 });
state = createState({
  identity: { classId: 'paladino', plannedLevel: 10 },
  progression: [
    { classId: 'paladino', level: 1 },
    { classId: 'paladino', level: 6, powerId: 'paladino_aura_sagrada' },
    { classId: 'paladino', level: 10, powerId: 'paladino_aura_de_invencibilidade' }
  ]
});

const passivesPal = calculatePassiveCharacterEffects();
assert.strictEqual(passivesPal.skillBonuses['fortitude'], 4, 'Aura Sagrada deve somar Carisma (+4) em Fortitude');
assert.strictEqual(passivesPal.skillBonuses['reflexos'], 4, 'Aura Sagrada deve somar Carisma (+4) em Reflexos');
assert.strictEqual(passivesPal.skillBonuses['vontade'], 4, 'Aura Sagrada deve somar Carisma (+4) em Vontade');
const palRd = passivesPal.reductions.find(r => r.tipo === 'reducao_dano');
assert.ok(palRd && palRd.valor === 5, 'Aura de Invencibilidade deve conceder RD 5');
console.log('✔ Paladino: Aura Sagrada e Aura de Invencibilidade validados!');

// 5. Validando Ladino (Mente Criminosa, Gatuno, Senhor do Submundo) e Bucaneiro (Pernas do Mar, Presença Paralisante)
console.log('\n5. Validando Ladino e Bucaneiro...');
finalAttrs = () => ({ for: 1, des: 4, con: 1, int: 3, sab: 0, car: 3 });
state = createState({
  identity: { classId: 'ladino', plannedLevel: 6 },
  progression: [
    { classId: 'ladino', powerId: 'ladino_mente_criminosa' },
    { classId: 'ladino', powerId: 'ladino_gatuno' },
    { classId: 'ladino', powerId: 'ladino_senhor_do_submundo' },
    { classId: 'bucaneiro', powerId: 'bucaneiro_pernas_do_mar' },
    { classId: 'bucaneiro', powerId: 'bucaneiro_presenca_paralisante' }
  ]
});

const passivesLadinoBuc = calculatePassiveCharacterEffects();
assert.strictEqual(passivesLadinoBuc.skillBonuses['ladinagem'], 3, 'Mente Criminosa deve somar Inteligência (+3) em Ladinagem');
assert.strictEqual(passivesLadinoBuc.skillBonuses['furtividade'], 3, 'Mente Criminosa deve somar Inteligência (+3) em Furtividade');
assert.strictEqual(passivesLadinoBuc.skillBonuses['atletismo'], 4, 'Gatuno (+2) e Pernas do Mar (+2) somam +4 em Atletismo');
assert.strictEqual(passivesLadinoBuc.skillBonuses['acrobacia'], 2, 'Pernas do Mar deve somar +2 em Acrobacia');
assert.strictEqual(passivesLadinoBuc.skillBonuses['intimidacao'], 5, 'Senhor do Submundo deve conceder +5 em Intimidação');
assert.strictEqual(passivesLadinoBuc.skillBonuses['iniciativa'], 3, 'Presença Paralisante deve somar Carisma (+3) em Iniciativa');
console.log('✔ Ladino e Bucaneiro validados com sucesso!');

// 6. Validando Guerreiro: Soldado de Infantaria (+3m deslocamento), Especialização em Arma e Mestre em Arma
console.log('\n6. Validando Guerreiro: Soldado de Infantaria, Especialização e Mestre em Arma...');
finalAttrs = () => ({ for: 4, des: 2, con: 2, int: 0, sab: 1, car: 0 });
state = createState({
  identity: { classId: 'guerreiro', plannedLevel: 12 },
  progression: [
    { classId: 'guerreiro', level: 2, powerId: 'guerreiro_soldado_de_infantaria' },
    { classId: 'guerreiro', level: 4, powerId: 'guerreiro_especializacao_em_arma', powerChoice: 'espada_longa' },
    { classId: 'guerreiro', level: 12, powerId: 'guerreiro_mestre_em_arma', powerChoice: 'espada_longa' }
  ]
});

const passivesGuerr = calculatePassiveCharacterEffects();
assert.strictEqual(passivesGuerr.movementBonus, 3, 'Soldado de Infantaria deve dar +3m no deslocamento');

const espadaLonga = { id: 'espada_longa', nome: 'Espada Longa', arma: { dano: { principal: '1d8' }, combateId: 'corpo_a_corpo', empunhaduraId: 'uma_mao', propriedadesIds: [] } };
const statsEspada = weaponPassiveStats(espadaLonga, {});
// Especialização (+2), Mestre sobe dano de 1d8 para 1d10
// Dano: 1d10 + For(4) + Esp(2) = 1d10+6
assert.strictEqual(statsEspada.damage, '1d10+6', 'Mestre em Arma sobe 1d8 para 1d10 e Especialização concede +2 no dano');
console.log('✔ Guerreiro: Soldado de Infantaria, Especialização e Mestre em Arma validados com sucesso!');

console.log('\n======================================================');
console.log('🎉 SUCESSO TOTAL: Todos os testes do Lote 2 passaram!');
console.log('======================================================\n');
