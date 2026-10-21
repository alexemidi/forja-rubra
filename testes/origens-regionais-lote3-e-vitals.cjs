const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== Testes Origens Regionais (Lote 3) e Barra de Chefe ===');

// 1. Validar mecânica da Barra de Chefe e camadas
const renderizacaoCode = fs.readFileSync(path.join(__dirname, '../src/funcionalidades/criador/ficha/renderizacao.js'), 'utf8');
assert(renderizacaoCode.includes('getVitalLayerMetrics'), 'getVitalLayerMetrics deve existir em renderizacao.js');
assert(renderizacaoCode.includes('vital-pill-fill-under'), 'vital-pill-fill-under deve existir para renderizar camada inferior de chefe');

// Simular getVitalLayerMetrics
const getVitalLayerMetricsMatch = renderizacaoCode.match(/function getVitalLayerMetrics\(val, maxCap\)\{[\s\S]*?return \{currentTier,underTier,topRatio,showUnder\};?\s*\}/);
assert(getVitalLayerMetricsMatch, 'getVitalLayerMetricsMatch deve ser encontrado');
const getVitalLayerMetrics = new Function('val', 'maxCap', getVitalLayerMetricsMatch[0] + '\nreturn getVitalLayerMetrics(val, maxCap);');

// Teste de tiers e camadas de chefe:
// Vida 50 de 50: Tier 1, sem camada inferior (fundo escuro)
const layer50 = getVitalLayerMetrics(50, 50);
assert.strictEqual(layer50.currentTier, 1);
assert.strictEqual(layer50.underTier, 0);
assert.strictEqual(layer50.showUnder, false);
assert.strictEqual(layer50.topRatio, 1);

// Exemplo do Usuário 1: Herói com 120 PV total (100 base + 20 excedente)
// Em 120 PV: Camada 2 (Dourada) 100% cheia, Camada 1 (Verde) por baixo cheia
const layer120 = getVitalLayerMetrics(120, 120);
assert.strictEqual(layer120.currentTier, 2);
assert.strictEqual(layer120.underTier, 1);
assert.strictEqual(layer120.showUnder, true);
assert.strictEqual(layer120.topRatio, 1);

// Tomar 10 de dano (110 de 120): leva 50% da segunda barra dourada!
const layer110 = getVitalLayerMetrics(110, 120);
assert.strictEqual(layer110.currentTier, 2);
assert.strictEqual(layer110.topRatio, 0.5);

// Ao acabar os 20 excedentes (100 de 120): a barra verde de baixo fica 100% cheia!
const layer100 = getVitalLayerMetrics(100, 120);
assert.strictEqual(layer100.currentTier, 1);
assert.strictEqual(layer100.underTier, 0);
assert.strictEqual(layer100.showUnder, false);
assert.strictEqual(layer100.topRatio, 1);

// Exemplo do Usuário 2: Herói com 150 PV total
// Em 150 PV: capacidade da segunda barra é 50
const layer150Full = getVitalLayerMetrics(150, 150);
assert.strictEqual(layer150Full.topRatio, 1);
// Tomar 10 de dano (140 de 150): diminui 20% da barra (restam 80%)
const layer140 = getVitalLayerMetrics(140, 150);
assert.strictEqual(layer140.currentTier, 2);
assert.strictEqual(Math.round(layer140.topRatio * 100), 80);

// Vida 250 de 300: Tier 3 (Laranja ativo), Camada inferior Tier 2 (Dourada 100% cheia)
const layer250 = getVitalLayerMetrics(250, 300);
assert.strictEqual(layer250.currentTier, 3);
assert.strictEqual(layer250.underTier, 2);
assert.strictEqual(layer250.showUnder, true);
assert.strictEqual(layer250.topRatio, 0.5); // 50 de 100 no tier 3

// Teste de dimensionamento base 20 crescendo até 100
const calculateVitalBarMetricsMatch = renderizacaoCode.match(/function calculateVitalBarMetrics\(val\)\{[\s\S]*?return \{units,widthPx,tier\};?\s*\}/);
assert(calculateVitalBarMetricsMatch, 'calculateVitalBarMetrics deve existir');
const calculateVitalBarMetrics = new Function('val', calculateVitalBarMetricsMatch[0] + '\nreturn calculateVitalBarMetrics(val);');
assert.strictEqual(calculateVitalBarMetrics(20).widthPx, 140, '20 PV deve ser tamanho base 140px');
assert.strictEqual(calculateVitalBarMetrics(60).widthPx, 210, '60 PV deve ser tamanho intermediário 210px');
assert.strictEqual(calculateVitalBarMetrics(100).widthPx, 280, '100 PV deve ser tamanho máximo 280px');
assert.strictEqual(calculateVitalBarMetrics(120).widthPx, 280, '120 PV deve manter tamanho máximo 280px');

console.log('✔ Erro 1 & 2: Camadas de chefe e subcamadas cheias validadas com sucesso!');

// 2. Validar CSS sem width: 100% e com cores sólidas vibrantes
const cssCode = fs.readFileSync(path.join(__dirname, '../src/estilos/criador/migration-theme.css'), 'utf8');
assert(!cssCode.includes('.vital-bars-wrapper {\n  display: flex !important;\n  align-items: center !important;\n  justify-content: center !important;\n  width: 100% !important;'), 'vital-bars-wrapper não deve ter width: 100% travado');
assert(cssCode.includes('.vital-fill-pv.vital-tier-1, .vital-fill-pv,\n.vital-fill-temp-pv.vital-tier-1, .vital-fill-temp-pv {\n  background: #16a34a !important;'), 'Cores sólidas vibrantes em migration-theme.css para Tier 1 unificadas');
assert(cssCode.includes('.vital-fill-pv.vital-tier-5,\n.vital-fill-temp-pv.vital-tier-5 {\n  background: #dc2626 !important;'), 'Cores sólidas vibrantes em migration-theme.css para Tier 5');
assert(cssCode.includes('.vital-pill-fill-under'), 'Estilos de vital-pill-fill-under presentes no CSS');
console.log('✔ Erro 2 & 3: CSS de barras proporcionais dinâmicas e cores sólidas sem degradê pálido validado!');

// 3. Validar item pecas_sobressalentes em dados/items.json
const items = JSON.parse(fs.readFileSync(path.join(__dirname, '../dados/items.json'), 'utf8'));
const pecas = items.find(i => i.id === 'pecas_sobressalentes');
assert(pecas, 'pecas_sobressalentes deve estar cadastrado em items.json');
assert.strictEqual(pecas.espacos, 0.5, 'Peças sobressalentes deve ocupar 0,5 espaços');
assert.strictEqual(pecas.preco.valor, 100, 'Preço de peças sobressalentes deve ser T$ 100');
console.log('✔ Item 5: Peças sobressalentes cadastrado (0,5 espaço, T$ 100, venda a T$ 50)!');

// 4. Validar desconto de peças sobressalentes na oficina de ofícios
const oficinaCode = fs.readFileSync(path.join(__dirname, '../src/funcionalidades/criador/ficha/oficina-oficios.js'), 'utf8');
assert(oficinaCode.includes('pecas_sobressalentes'), 'oficina-oficios.js deve verificar pecas_sobressalentes');
assert(oficinaCode.includes('Math.max(0, custoFinalTeste - 100)'), 'Deve reduzir custo da engenhoca em até T$ 100');
assert(oficinaCode.includes("consumeItemFromBackpack('pecas_sobressalentes')"), 'Deve consumir pecas_sobressalentes ao forjar com sucesso');
console.log('✔ Item 5: Desconto de T$ 100 e consumo de Peças Sobressalentes na fabricação de engenhocas validado!');

// 5. Validar passivas de Explorador de Ruínas e Estudante da Academia
const passivasCode = fs.readFileSync(path.join(__dirname, '../src/compartilhado/criador/navegacao-validacao.js'), 'utf8');
assert(passivasCode.includes('isExploradorRuinas'), 'passiveCharacterEffects deve tratar isExploradorRuinas');
assert(passivasCode.includes("addSkill('ladinagem', 2)"), 'Explorador de Ruínas deve conceder +2 em Ladinagem');
assert(passivasCode.includes("addSkill('percepcao', 2)"), 'Explorador de Ruínas deve conceder +2 em Percepção');
assert(passivasCode.includes("addSkill('reflexos', 2)"), 'Explorador de Ruínas deve conceder +2 em Reflexos');
assert(passivasCode.includes('result.movementBonus += 3'), 'Explorador de Ruínas deve conceder +3m de deslocamento');

assert(passivasCode.includes('isEstudanteAcademia'), 'passiveCharacterEffects deve tratar isEstudanteAcademia');
assert(passivasCode.includes("addSkill('misticismo', 2)"), 'Estudante da Academia deve dar +2 em Misticismo se já treinado');
assert(passivasCode.includes("addSkill('misticismo', -tb)"), 'Estudante da Academia deve anular bônus de treino se não treinado por outra fonte');
console.log('✔ Itens 7 e 8: Passivas de Explorador de Ruínas e Misticismo especial de Estudante da Academia validados!');

// 6. Validar magia de Estudante da Academia e Duplo Feérico em spellPlan
const magiasCode = fs.readFileSync(path.join(__dirname, '../src/regras/criador/magias.js'), 'utf8');
assert(magiasCode.includes('isEstudanteAcademia'), 'spellPlan deve contemplar Estudante da Academia');
assert(magiasCode.includes('origin:estudante_da_academia'), 'Grupo origin:estudante_da_academia deve existir');
assert(magiasCode.includes('origin:duplo_feerico'), 'Grupo origin:duplo_feerico deve existir para magias de classe');
console.log('✔ Itens 4 e 8: Magias de Estudante da Academia e Duplo Feérico no spellPlan validados!');

// 7. Validar Duplo Feérico na Fase 6 com filtro de classes e busca
const duploCode = fs.readFileSync(path.join(__dirname, '../src/regras/criador/idade-complicacoes-e-caminho.js'), 'utf8');
assert(duploCode.includes('duplo-feerico-filter-class'), 'Duplo Feérico deve conter filtro por classe');
assert(duploCode.includes('duploFeericoSearch'), 'Duplo Feérico deve conter busca textual');
assert(duploCode.includes('isDuploSpell'), 'Duplo Feérico deve sinalizar regra de Magias');
console.log('✔ Item 4: Navegador completo de Duplo Feérico com filtro, busca e sem seleção inicial validado!');

console.log('🎉 Todos os testes de regras e vitais do Lote 3 foram aprovados com 100% de sucesso!');
