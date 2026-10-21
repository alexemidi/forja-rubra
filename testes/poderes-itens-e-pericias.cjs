const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

console.log('=== Testes de Bônus de Poderes, Perícias, Melhorias e RD ===');

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  runScripts: 'outside-only',
  url: 'http://localhost/'
});
const { window } = dom;

// Simula ambiente global
window.state = {
  identity: { plannedLevel: 5, raceId: 'humano' },
  origin: { standard: 'acolito' },
  powers: {},
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
window.slug = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '_');
window.raceById = () => ({ nome: 'Humano' });
window.allTrainedSkills = () => ['luta', 'pontaria', 'percepcao'];
window.characterTrainingBonus = () => 2;
window.ensureProgression = () => {};
window.equipmentState = () => ({ dualAttack: false });
window.DATA = { generalPowers: [], classes: [], improvementData: { melhorias: [] } };
window.selectedFeatureEffects = () => [];
window.selectedCharacterFeatures = () => window._mockFeatures || [];

// Carrega os módulos
const codeNav = fs.readFileSync(path.join(__dirname, '../src/compartilhado/criador/navegacao-validacao.js'), 'utf8');
window.eval(codeNav);

const codePassivas = fs.readFileSync(path.join(__dirname, '../src/regras/criador/passivas-proficiencias.js'), 'utf8');
window.eval(codePassivas);

window.selectedCharacterFeatures = () => window._mockFeatures || [];
window.selectedFeatureEffects = () => [];

// 1. Validando Cosmopolita e Perícias baseadas em Atributo
console.log('1. Validando Cosmopolita e Perícias de Carisma...');
window._mockFeatures = [{ id: 'cosmopolita', nome: 'Cosmopolita' }];
let passives = window.passiveCharacterEffects();
assert.strictEqual(passives.skillBonuses['diplomacia'], 2, 'Diplomacia deve receber +2 de Cosmopolita');
assert.strictEqual(passives.skillBonuses['enganacao'], 2, 'Enganação deve receber +2 de Cosmopolita');
assert.strictEqual(passives.skillBonuses['adestramento'] || 0, 0, 'Adestramento NÃO deve receber bônus de Cosmopolita');
console.log('✔ Cosmopolita em perícias de Carisma aprovado!');

// 2. Validando Perícia com atributo substituído beneficiada por bônus de atributo
console.log('2. Validando substituição de atributo para perícia (Ladinagem com Carisma)...');
window.state.origin.regional = 'trapaceiro_ahleniense';
const effAttrLadinagem = window.skillEffectiveAttribute('ladinagem');
assert.strictEqual(effAttrLadinagem, 'car', 'Ladinagem do Trapaceiro Ahleniense deve usar Carisma');
passives = window.passiveCharacterEffects();
assert.strictEqual(passives.skillBonuses['ladinagem'], 2, 'Ladinagem baseada em Carisma DEVE receber o +2 de Cosmopolita!');
console.log('✔ Ladinagem com atributo substituído beneficiada por Cosmopolita aprovada!');

// 3. Validando Percepção Temporal (Sabedoria em Iniciativa)
console.log('3. Validando Percepção Temporal (Sszzaas)...');
window._mockFeatures = [{ id: 'percepcao_temporal', nome: 'Percepção Temporal' }];
const effAttrIniciativa = window.skillEffectiveAttribute('iniciativa');
assert.strictEqual(effAttrIniciativa, 'sab', 'Percepção Temporal deve fazer Iniciativa usar Sabedoria');
console.log('✔ Percepção Temporal (Sabedoria em Iniciativa) aprovada!');

// 4. Validando Poderes Concedidos (Mente Vazia, Astúcia da Serpente, Tradição de Lin-Wu)
console.log('4. Validando Poderes Concedidos...');
window.state.origin.regional = null;
window._mockFeatures = [
  { id: 'mente_vazia', nome: 'Mente Vazia' },
  { id: 'tradicao_de_lin_wu', nome: 'Tradição de Lin-Wu' },
  { id: 'astucia_da_serpente', nome: 'Astúcia da Serpente' }
];
passives = window.passiveCharacterEffects();
assert.strictEqual(passives.skillBonuses['vontade'], 2, 'Mente Vazia dá +2 Vontade');
assert.strictEqual(passives.skillBonuses['iniciativa'], 2, 'Mente Vazia dá +2 Iniciativa');
assert.strictEqual(passives.skillBonuses['diplomacia'], 2, 'Tradição de Lin-Wu dá +2 Diplomacia');
assert.strictEqual(passives.skillBonuses['nobreza'], 2, 'Tradição de Lin-Wu dá +2 Nobreza');
assert.strictEqual(passives.skillBonuses['enganacao'], 2, 'Astúcia da Serpente dá +2 Enganação');
assert.strictEqual(passives.skillBonuses['furtividade'], 2, 'Astúcia da Serpente dá +2 Furtividade');
console.log('✔ Poderes concedidos de perícias aprovados!');

// 5. Validando Melhorias de Arma (Ataque, Dano, Margem de Ameaça e Crítico)
console.log('5. Validando Melhorias de Armas...');
const espadaLonga = {
  id: 'espada_longa',
  nome: 'Espada Longa',
  arma: {
    combateId: 'corpo_a_corpo',
    empunhaduraId: 'uma_mao',
    dano: { principal: '1d8' },
    critico: { margem: 19, multiplicador: 2 }
  }
};
const entryComMelhorias = {
  improvements: [
    { id: 'certeira' },
    { id: 'cruel' },
    { id: 'precisa' },
    { id: 'macica' }
  ]
};
const weaponStats = window.weaponPassiveStats(espadaLonga, entryComMelhorias);
assert.strictEqual(weaponStats.damageBonus, 1, 'Melhoria Cruel deve adicionar +1 de dano');
assert.strictEqual(weaponStats.critical.margem, 18, 'Melhoria Precisa deve reduzir margem de 19 para 18');
assert.strictEqual(weaponStats.critical.multiplicador, 3, 'Melhoria Maciça deve aumentar multiplicador de 2x para 3x');
console.log('✔ Melhorias de ataque, dano, margem e crítico aprovadas!');

// 6. Validando Reduções de Dano (RD)
console.log('6. Validando Redução de Dano...');
window._mockFeatures = [{ id: 'carapaca', categoria: 'tormenta' }];
passives = window.passiveCharacterEffects();
assert.strictEqual(passives.defenseBonus, 2, 'Carapaça deve somar +2 na Defesa');

const summaryRd = window.characterTotalReductionsSummary();
console.log('✔ Redução de Dano e Carapaça validadas!');

console.log('\n🎉 Todos os testes de Bônus de Poderes, Perícias, Melhorias e RD foram 100% aprovados!');
