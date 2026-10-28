const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const { transformSync } = require('esbuild');

type Roll20Helpers = {
  roll20FeatureRecord(feature: { nome: string; descricao: string }, kind: 'ability' | 'power'): Record<string, string> | null;
  expandRoll20CharacterFeatures(features: Array<{
    id?: string;
    nome?: string;
    descricao?: string;
    source?: string;
    origemRegional?: string;
    originDesc?: string;
    powerDesc?: string;
    chosenPower?: { nome?: string; descricao?: string };
  }>): {
    abilities: Array<Record<string, string>>;
    powers: Array<Record<string, string>>;
  };
  roll20SpellRecord(spell: { name: string; type: string; circle: number; school: string }, html: string): Record<string, string>;
  roll20AttackRecord(input: {
    name: string;
    totalAttack: number;
    skillTotal: number;
    skill: string;
    damageDice: string;
    damageExtra: number;
    damageAttribute: string;
    critical: string;
  }): Record<string, string>;
  roll20EquipmentRecord(name: string, quantity: number, spaces: number, description: string): Record<string, string>;
  roll20DefenseFields(input: {
    defenseAttribute: string;
    totalDefense: number;
    attributeBonus: number;
    shieldStyleBonus: number;
    shieldStyleActive: boolean;
    armorName: string;
    armorDefense: number;
    armorPenalty: number;
    shieldName: string;
    shieldDefense: number;
    shieldPenalty: number;
  }): Record<string, string>;
};

const root = path.resolve('.');
const helperSource = fs.readFileSync(path.join(root, 'src/integracoes/criador/exportacao-roll20.ts'), 'utf8');
const helperCode = transformSync(helperSource, { loader: 'ts', target: 'es2022' }).code;
const dom = new JSDOM('');
const context = vm.createContext({ DOMParser: dom.window.DOMParser });
const helpers = vm.runInContext(
  `${helperCode}\n({ roll20FeatureRecord, expandRoll20CharacterFeatures, roll20SpellRecord, roll20AttackRecord, roll20EquipmentRecord, roll20DefenseFields })`,
  context
) as Roll20Helpers;

const ability = helpers.roll20FeatureRecord({ nome: 'Essência Feérica', descricao: 'Descrição racial.' }, 'ability');
assert.equal(ability?.nameability, 'Essência Feérica');
assert.equal(ability?.abilitydescription, 'Descrição racial.');

const power = helpers.roll20FeatureRecord({ nome: 'Magia Ilimitada', descricao: 'Descrição do poder.' }, 'power');
assert.equal(power?.namepower, 'Magia Ilimitada');
assert.equal(power?.powerdescription, 'Descrição do poder.');

const featureRecords = helpers.expandRoll20CharacterFeatures([
  {
    id: 'cosmopolita',
    nome: 'Cosmopolita',
    source: 'origin',
    origemRegional: 'Cosmopolita',
    originDesc: 'Descrição da origem.',
    chosenPower: { nome: 'Magia Ilimitada', descricao: 'Poder escolhido.' },
    powerDesc: 'Poder escolhido.'
  }
]);
assert.equal(featureRecords.abilities[0]?.nameability, 'Cosmopolita');
assert.equal(featureRecords.powers.find(record => record.namepower === 'Cosmopolita')?.powerdescription.includes('Magia Ilimitada'), true);
assert.equal(featureRecords.powers.find(record => record.namepower === 'Magia Ilimitada')?.powerdescription, 'Poder escolhido.');

const cards = JSON.parse(fs.readFileSync(path.join(root, 'dados/magias-cards.json'), 'utf8'));
const spell = helpers.roll20SpellRecord(
  { name: 'Curar Ferimentos', type: 'divina', circle: 1, school: 'evocacao' },
  cards['curar-ferimentos']
);
assert.equal(spell.namespell, 'Curar Ferimentos');
assert.equal(spell.spelltipo, 'Divina 1 (Evocação)');
assert.equal(spell.spellexecucao, 'padrão');
assert.equal(spell.spellalcance, 'toque');
assert.equal(spell.spellduracao, 'instantânea');
assert.equal(spell.spellalvoarea, '1 criatura');
assert.equal(spell.spellcd, '0');
assert.equal(spell.spellresistencia, '');
assert.ok(spell.spelldescription.includes('Truque:'));
assert.ok(spell.spelldescription.includes('Aprimoramentos:'));

const attack = helpers.roll20AttackRecord({
  name: 'Maça',
  totalAttack: 8,
  skillTotal: 5,
  skill: 'luta',
  damageDice: '1d8',
  damageExtra: 2,
  damageAttribute: 'for',
  critical: '19/x3'
});
assert.equal(attack.nomeataque, 'Maça');
assert.equal(attack.bonusataque, '3');
assert.equal(attack.danoataque, '1d8');
assert.equal(attack.danoextraataque, '2');
assert.equal(attack.modatributodano, '@{for_mod}');
assert.equal(attack.margemcriticoataque, '19');
assert.equal(attack.multiplicadorcriticoataque, '3');
assert.equal(attack.ataquepericia, '@{lutatotal}+@{condicaomodataquecc}+@{condicaomodataque}');

const equipment = helpers.roll20EquipmentRecord('Brunea', 1, 2, 'Armadura pesada.');
assert.equal(equipment.equipname, 'Brunea');
assert.equal(equipment.equipquantity, '1');
assert.equal(equipment.equipslot, '2');
assert.equal(equipment.equipweight, '2');
assert.equal(equipment.eqpdescription, 'Armadura pesada.');
assert.equal(equipment.sobrevivencia_treinada, '0');

const defense = helpers.roll20DefenseFields({
  defenseAttribute: 'des',
  totalDefense: 19,
  attributeBonus: 1,
  shieldStyleBonus: 2,
  shieldStyleActive: true,
  armorName: 'Brunea',
  armorDefense: 5,
  armorPenalty: -4,
  shieldName: 'Escudo Leve',
  shieldDefense: 1,
  shieldPenalty: -1
});
assert.equal(defense.defesaatributo, '1');
assert.equal(defense.modatributodefesa, 'des_mod');
assert.equal(defense.armadura1, 'Brunea');
assert.equal(defense.armaduradefesa1, '5');
assert.equal(defense.armadurapenalidade1, '-4');
assert.equal(defense.armadura2, 'Escudo Leve');
assert.equal(defense.armaduradefesa2, '1');
assert.equal(defense.armadurapenalidade2, '-1');
assert.equal(defense.defesaoutros, '2');

const inactiveShieldStyle = helpers.roll20DefenseFields({
  defenseAttribute: 'des',
  totalDefense: 19,
  attributeBonus: 1,
  shieldStyleBonus: 2,
  shieldStyleActive: false,
  armorName: 'Brunea',
  armorDefense: 5,
  armorPenalty: -4,
  shieldName: 'Escudo Leve',
  shieldDefense: 1,
  shieldPenalty: -1
});
assert.equal(inactiveShieldStyle.armaduradefesa2, '1');
assert.equal(inactiveShieldStyle.defesaoutros, '0');

const renderSource = fs.readFileSync(path.join(root, 'src/funcionalidades/criador/ficha/renderizacao.ts'), 'utf8');
const clearTempAction = renderSource.slice(renderSource.indexOf("if(action==='clear-all-temp'){"));
assert.match(clearTempAction, /state\.tempManualBonuses=\{\.\.\.state\.tempManualBonuses,defense:0,skills:\{\},attrs:\{\}\}/);
assert.match(clearTempAction, /persistTempBonusChanges\(\)/);
assert.match(renderSource, /if\(sVal===0\)delete state\.tempManualBonuses\.skills\[id\]/);

const manifest = JSON.parse(fs.readFileSync(path.join(root, 'src/paginas/manifesto.json'), 'utf8'));
assert.equal(manifest.criador.data['DATA.spellCards'], 'dados/magias-cards.json');

dom.window.close();
console.log('✔ Exportação Roll20: poderes, magias, ataques, equipamentos e Defesa mapeados.');
