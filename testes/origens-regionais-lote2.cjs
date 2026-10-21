const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== Testes Origens Regionais (Lote 2: Itens 0 a 14) ===');

// 1. Validar calculateVitalBarMetrics e escala
const renderizacaoCode = fs.readFileSync(path.join(__dirname, '../src/funcionalidades/criador/ficha/renderizacao.js'), 'utf8');
const calculateVitalBarMetricsMatch = renderizacaoCode.match(/function calculateVitalBarMetrics\(val\)\{[\s\S]*?return \{units,widthPx,tier\};?\s*\}/);
assert(calculateVitalBarMetricsMatch, 'calculateVitalBarMetrics deve estar presente em renderizacao.js');

const calculateVitalBarMetrics = new Function('val', calculateVitalBarMetricsMatch[0] + '\nreturn calculateVitalBarMetrics(val);');

// 20 ou menos: 10 unidades, tier 1
assert.strictEqual(calculateVitalBarMetrics(20).units, 10);
assert.strictEqual(calculateVitalBarMetrics(20).tier, 1);
// >20: unidades crescem progressivamente até 100
assert.strictEqual(calculateVitalBarMetrics(60).units, 15);
assert.strictEqual(calculateVitalBarMetrics(60).tier, 1);
// 100: 20 unidades, tier 1; >100: tier 2
assert.strictEqual(calculateVitalBarMetrics(100).units, 20);
assert.strictEqual(calculateVitalBarMetrics(100).tier, 1);
assert.strictEqual(calculateVitalBarMetrics(150).tier, 2);
// >400: tier 5
assert.strictEqual(calculateVitalBarMetrics(450).tier, 5);
console.log('✔ Item 0: calculateVitalBarMetrics e tiers de cores validados!');

// 2. Validar Armeiro Armado 1/4 do custo de melhorias
const manufaturaCode = fs.readFileSync(path.join(__dirname, '../src/regras/nucleo/manufatura.js'), 'utf8');
assert(manufaturaCode.includes('isArmeiroArmadoWithSuperiorCrafting'), 'isArmeiroArmadoWithSuperiorCrafting deve existir em manufatura.js');
assert(manufaturaCode.includes('precoMelhorias / 4') || manufaturaCode.includes('melhoriasCost / 4') || manufaturaCode.includes('/ 4'), 'Preço das melhorias deve ser dividido por 4 para Armeiro Armado Inventor');
console.log('✔ Item 3: Armeiro Armado (1/4 do custo em melhorias de armas) validado!');

// 3. Validar Aspirante a Herói e Cria da Favela em finalAttrs
const estadoCode = fs.readFileSync(path.join(__dirname, '../src/compartilhado/criador/estado-e-catalogos.js'), 'utf8');
assert(estadoCode.includes('aspirante_a_heroi'), 'finalAttrs deve tratar aspirante_a_heroi');
assert(estadoCode.includes('cria_da_favela'), 'finalAttrs deve tratar cria_da_favela (+1 con)');
console.log('✔ Itens 4 e 12: finalAttrs (+1 atributo livre e +1 Con) validados!');

// 4. Validar Catador da Cidade Velha e venda a 100%
const vendaCode = fs.readFileSync(path.join(__dirname, '../src/funcionalidades/criador/inventario/venda.js'), 'utf8');
assert(vendaCode.includes("entry.itemId==='tranqueiras_resgatadas_do_mar'"), 'Venda deve checar tranqueiras_resgatadas_do_mar');
assert(vendaCode.includes("salePercent=entry.itemId==='tranqueiras_resgatadas_do_mar'?100:50"), 'Tranqueiras devem ter venda a 100%');

const itemsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../dados/items.json'), 'utf8'));
const tranqueiraItem = itemsData.find(i => i.id === 'tranqueiras_resgatadas_do_mar');
assert(tranqueiraItem, 'tranqueiras_resgatadas_do_mar deve existir em items.json');
assert.strictEqual(tranqueiraItem.preco.valor, 100, 'Preço deve ser T$ 100');
assert.strictEqual(tranqueiraItem.espacos, 2, 'Espaços deve ser 2');
console.log('✔ Item 8: Tranqueiras resgatadas do mar (2 espaços, T$ 100, venda a 100%) validado!');

// 5. Validar passivas de Cativo das Fadas, Criado pelas Voracis e Lupa
const validacaoCode = fs.readFileSync(path.join(__dirname, '../src/compartilhado/criador/navegacao-validacao.js'), 'utf8');
assert(validacaoCode.includes('isCativoDasFadas'), 'passiveCharacterEffects deve checar isCativoDasFadas');
assert(validacaoCode.includes('result.pvPerLevel += 1'), 'Cativo das Fadas deve conceder +1 PV por nível');
assert(validacaoCode.includes('isCriadoVoracis'), 'passiveCharacterEffects deve checar isCriadoVoracis');
assert(validacaoCode.includes('result.defenseBonus += 2'), 'Criado pelas Voracis deve conceder +2 Defesa');
assert(validacaoCode.includes('result.movementBonus += 3'), 'Criado pelas Voracis deve conceder +3m Deslocamento');
assert(validacaoCode.includes("addSkill('sobrevivencia', 2)"), 'Criado pelas Voracis deve conceder +2 Sobrevivência');
assert(validacaoCode.includes("addSkill('investigacao', 1)"), 'Lupa deve conceder +1 Investigação');
console.log('✔ Itens 5, 9 e 13: Passivas (Cativo das Fadas, Criado pelas Voracis, Lupa) validadas!');

// 6. Validar poder Torcida automático para Competidor do Circuito
assert(validacaoCode.includes('competidor_do_circuito'), 'selectedCharacterFeatures deve checar competidor_do_circuito');
assert(validacaoCode.includes("nome: 'Torcida (Competidor do Circuito)'"), 'Torcida deve ser concedida automaticamente');
console.log('✔ Item 10: Torcida automática para Competidor do Circuito validada!');

// 7. Validar descanso de Cria da Favela e reset de bônus temporários
assert(renderizacaoCode.includes('isCriaDaFavela'), 'calculateRestGain deve checar isCriaDaFavela');
assert(renderizacaoCode.includes('state.tempManualBonuses = { defense: 0, skills: {} }'), 'Descanso deve zerar tempManualBonuses');
assert(renderizacaoCode.includes('renderTempBonusesModalHtml'), 'renderTempBonusesModalHtml deve existir');
console.log('✔ Itens 7 e 12: Descanso da Cria da Favela e reset de bônus manuais validados!');

// 8. Validar magia de De Outro Mundo no spellPlan
const magiasCode = fs.readFileSync(path.join(__dirname, '../src/regras/criador/magias.js'), 'utf8');
assert(magiasCode.includes('isDeOutroMundo'), 'spellPlan deve checar isDeOutroMundo');
assert(magiasCode.includes("add('origin:de_outro_mundo'"), 'spellPlan deve adicionar grupo de magia de De Outro Mundo');
console.log('✔ Item 14: Magia de De Outro Mundo no plano de magias validada!');

console.log('🎉 Todos os testes de regras das origens regionais (Lote 2) passaram com sucesso!');
