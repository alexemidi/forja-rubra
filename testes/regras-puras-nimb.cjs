const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('Iniciando testes de Regras Puras (Passos de Dano e Golpe Pessoal)...');

const PassosDano = require('../src/regras/nucleo/passos-dano.js');
const GolpePessoal = require('../src/regras/nucleo/golpe-pessoal.js');
const dadosGolpePessoal = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../dados/golpe-pessoal.json'), 'utf8')
);

// ----------------------------------------------------
// 1. TESTES DE PASSOS DE DANO DE ARMAS (Tabela 3-2 T20)
// ----------------------------------------------------
console.log('1. Validando subida de passos na escala primária...');
assert.strictEqual(PassosDano.stepUpDamage('1d6', 1), '1d8', '1d6 + 1 passo deve ser 1d8');
assert.strictEqual(PassosDano.stepUpDamage('1d6', 2), '1d10', '1d6 + 2 passos deve ser 1d10');
assert.strictEqual(PassosDano.stepUpDamage('1d6', 3), '1d12', '1d6 + 3 passos deve ser 1d12');
assert.strictEqual(PassosDano.stepUpDamage('1d6', 4), '3d6', '1d6 + 4 passos deve ser 3d6');
assert.strictEqual(PassosDano.stepUpDamage('1d6', 5), '4d6', '1d6 + 5 passos deve ser 4d6');
assert.strictEqual(PassosDano.stepUpDamage('1d6', 6), '4d8', '1d6 + 6 passos deve ser 4d8');
assert.strictEqual(PassosDano.stepUpDamage('1d6', 7), '4d10', '1d6 + 7 passos deve ser 4d10');
assert.strictEqual(PassosDano.stepUpDamage('1d6', 8), '4d12', '1d6 + 8 passos deve ser 4d12');
assert.strictEqual(PassosDano.stepUpDamage('1d6', 20), '4d12', 'Passos acima do teto devem travar em 4d12');
console.log('✔ Subida de passos na escala primária validada!');

console.log('2. Validando redução de passos na escala primária...');
assert.strictEqual(PassosDano.stepUpDamage('1d6', -1), '1d4', '1d6 - 1 passo deve ser 1d4');
assert.strictEqual(PassosDano.stepUpDamage('1d6', -2), '1d3', '1d6 - 2 passos deve ser 1d3');
assert.strictEqual(PassosDano.stepUpDamage('1d6', -3), '1d2', '1d6 - 3 passos deve ser 1d2');
assert.strictEqual(PassosDano.stepUpDamage('1d6', -4), '1', '1d6 - 4 passos deve ser 1 fixo');
assert.strictEqual(PassosDano.stepUpDamage('1d6', -10), '1', 'Passos abaixo do piso devem travar em 1');
console.log('✔ Redução de passos na escala primária validada!');

console.log('3. Validando armas compostas / versáteis e danos compostos...');
assert.strictEqual(PassosDano.stepUpDamage('1d8/1d10', 1), '1d10/1d12', '1d8/1d10 + 1 passo deve ser 1d10/1d12');
assert.strictEqual(PassosDano.stepUpDamage('1d8/1d10', -1), '1d6/1d8', '1d8/1d10 - 1 passo deve ser 1d6/1d8');
assert.strictEqual(PassosDano.stepUpDamage('-', 1), '-', 'Dano nulo ou travessão não deve ser alterado');
console.log('✔ Armas com múltiplos modos validadas!');

console.log('4. Validando ramo alternativo 2dX (TWO_DICE_LADDER)...');
assert.strictEqual(PassosDano.stepUpDamage('2d6', 1, { allowAltLadder: true }), '2d8', '2d6 + 1 passo no ramo alt deve ser 2d8');
assert.strictEqual(PassosDano.stepUpDamage('2d8', 1, { allowAltLadder: true }), '2d10', '2d8 + 1 passo no ramo alt deve ser 2d10');
assert.strictEqual(PassosDano.stepUpDamage('2d10', 1, { allowAltLadder: true }), '3d10', '2d10 + 1 passo no ramo alt deve ser 3d10');
assert.strictEqual(PassosDano.stepUpDamage('3d10', 1, { allowAltLadder: true }), '4d10', '3d10 + 1 passo no ramo alt deve ser 4d10');
assert.strictEqual(PassosDano.stepUpDamage('2d6', -1, { allowAltLadder: true }), '1d10', '2d6 - 1 passo no ramo alt deve cair em 1d10');
console.log('✔ Ramo alternativo 2dX validado!');

console.log('5. Validando soma de bônus fixo (addFlatDamageBonus) e médias...');
assert.strictEqual(PassosDano.addFlatDamageBonus('1d8', 3), '1d8+3', '1d8 + 3 deve ser 1d8+3');
assert.strictEqual(PassosDano.addFlatDamageBonus('2d6+2', 5), '2d6+7', '2d6+2 + 5 deve mesclar para 2d6+7');
assert.strictEqual(PassosDano.addFlatDamageBonus('1d6/1d6', 2), '1d6+2/1d6+2', '1d6/1d6 + 2 deve somar a ambos os modos');
assert.strictEqual(PassosDano.addFlatDamageBonus('1d8+4', -4), '1d8', '1d8+4 - 4 deve voltar a 1d8 puro');
assert.strictEqual(PassosDano.damageAverage('1d6'), 3.5, 'Média de 1d6 deve ser 3.5');
assert.strictEqual(PassosDano.damageAverage('2d6'), 7, 'Média de 2d6 deve ser 7');
assert.strictEqual(PassosDano.damageAverage('1'), 1, 'Média de 1 fixo deve ser 1');
console.log('✔ addFlatDamageBonus e damageAverage validados!');

// ----------------------------------------------------
// 2. TESTES DE REGRAS E CÁLCULO DE GOLPE PESSOAL
// ----------------------------------------------------
console.log('6. Validando catálogo e chaves legadas de Golpe Pessoal...');
const effects = dadosGolpePessoal.effects;
const legacyKeys = dadosGolpePessoal.legacyKeys;
assert.ok(effects.BRUTAL, 'Brutal deve existir no catalogo');
assert.ok(effects.LETAL, 'Letal deve existir no catalogo');
assert.ok(effects.CONJURADOR, 'Conjurador deve existir no catalogo');
assert.ok(effects.LENTO, 'Lento deve existir no catalogo');
assert.strictEqual(GolpePessoal.resolveEffectKey('IMPLACAVEL', effects, legacyKeys), 'IMPACTANTE', 'IMPLACAVEL deve resolver para IMPACTANTE');
assert.strictEqual(GolpePessoal.resolveEffectKey('TELEGUIO', effects, legacyKeys), 'TELEGUIADO', 'TELEGUIO deve resolver para TELEGUIADO');
console.log('✔ Catalogo e resolucao de chaves validados!');

console.log('7. Validando cálculo de custo em PM de Golpe Pessoal...');
const buildExemplo1 = [
  { effectName: 'BRUTAL', repeats: 1 },
  { effectName: 'LETAL', repeats: 1 }
];
assert.strictEqual(
  GolpePessoal.calculateGolpePessoalCost(buildExemplo1, effects, legacyKeys),
  3,
  'Brutal (1) + Letal (2) deve custar 3 PM'
);

const buildElemental = [
  { effectName: 'ELEMENTAL', repeats: 2, choices: ['fogo'] }
];
assert.strictEqual(
  GolpePessoal.calculateGolpePessoalCost(buildElemental, effects, legacyKeys),
  4,
  'Elemental 2x deve custar 4 PM'
);

const buildConjurador1 = [
  { effectName: 'CONJURADOR', repeats: 1, choices: ['Curar Ferimentos'] }
];
assert.strictEqual(
  GolpePessoal.calculateGolpePessoalCost(buildConjurador1, effects, legacyKeys, () => 1),
  2,
  'Conjurador com magia de 1º circulo deve custar 2 PM'
);

const buildConjurador2 = [
  { effectName: 'CONJURADOR', repeats: 1, choices: ['Bola de Fogo'] }
];
assert.strictEqual(
  GolpePessoal.calculateGolpePessoalCost(buildConjurador2, effects, legacyKeys, () => 2),
  4,
  'Conjurador com magia de 2º circulo deve custar 4 PM'
);

const buildComLimitacao = [
  { effectName: 'LENTO', repeats: 1 },       // -2 PM
  { effectName: 'DESTRUIDOR', repeats: 1 },  // +2 PM
  { effectName: 'BRUTAL', repeats: 1 }       // +1 PM
];
assert.strictEqual(
  GolpePessoal.calculateGolpePessoalCost(buildComLimitacao, effects, legacyKeys),
  1,
  'Lento (-2) + Destruidor (2) + Brutal (1) deve custar 1 PM'
);
console.log('✔ Calculo de custos em PM validado com sucesso!');

console.log('8. Validando regras de validação de Golpe Pessoal...');
// Inválido: sem arma
const semArma = {
  weapon: '',
  effects: [{ effectName: 'BRUTAL', repeats: 1 }],
  totalCost: 1
};
const valSemArma = GolpePessoal.validateGolpePessoalBuild(semArma, effects, legacyKeys);
assert.strictEqual(valSemArma.isValid, false, 'Build sem arma deve ser invalido');

// Inválido: custo zero ou negativo
const custoZero = {
  weapon: 'Espada Longa',
  effects: [
    { effectName: 'LENTO', repeats: 1 },
    { effectName: 'BRUTAL', repeats: 1 }
  ],
  totalCost: -1
};
const valCustoZero = GolpePessoal.validateGolpePessoalBuild(custoZero, effects, legacyKeys);
assert.strictEqual(valCustoZero.isValid, false, 'Build com custo < 1 deve ser invalido');

// Inválido: exceder repetições máximas de Letal (máx 2)
const excessoLetal = {
  weapon: 'Machado de Batalha',
  effects: [{ effectName: 'LETAL', repeats: 3 }],
  totalCost: 6
};
const valExcessoLetal = GolpePessoal.validateGolpePessoalBuild(excessoLetal, effects, legacyKeys);
assert.strictEqual(valExcessoLetal.isValid, false, 'Letal 3x deve ser invalido (max 2)');

// Inválido: repetir efeito não repetível (Destruidor)
const excessoDestruidor = {
  weapon: 'Montante',
  effects: [{ effectName: 'DESTRUIDOR', repeats: 2 }],
  totalCost: 4
};
const valExcessoDestruidor = GolpePessoal.validateGolpePessoalBuild(excessoDestruidor, effects, legacyKeys);
assert.strictEqual(valExcessoDestruidor.isValid, false, 'Destruidor 2x deve ser invalido');

// Válido: build completo
const buildValido = {
  weapon: 'Katana',
  effects: [
    { effectName: 'LETAL', repeats: 2 },
    { effectName: 'ELEMENTAL', repeats: 1, choices: ['eletricidade'] }
  ],
  totalCost: 6
};
const valValido = GolpePessoal.validateGolpePessoalBuild(buildValido, effects, legacyKeys, 10);
assert.strictEqual(valValido.isValid, true, 'Build valido deve ser aceito');

// Formatação descritiva
const descricao = GolpePessoal.formatGolpePessoalDescription(buildValido, effects, legacyKeys);
assert.ok(descricao.includes('Katana'), 'Descricao deve conter o nome da arma');
assert.ok(descricao.includes('Letal (2x)'), 'Descricao deve conter Letal (2x)');
assert.ok(descricao.includes('eletricidade'), 'Descricao deve conter eletricidade');
assert.ok(descricao.includes('[6 PM]'), 'Descricao deve conter [6 PM]');
console.log('✔ Validacoes e formatacao descritiva aprovadas!');

console.log('🎉 Todos os testes de Regras Puras (Passos de Dano e Golpe Pessoal) passaram com 100% de sucesso!');
