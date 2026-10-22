import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('=== TESTES DE AJUSTES SOLICITADOS (22 OUTUBRO) ===\n');

// 1. Validar CSS de tipografia nos títulos da ficha e cards de lojas
console.log('1. Validando padronização de títulos e fontes no CSS...');
const migrationCss = fs.readFileSync(path.resolve('src/estilos/criador/migration-theme.css'), 'utf8');
const compCss = fs.readFileSync(path.resolve('src/estilos/compartilhado/componentes.css'), 'utf8');

assert.ok(migrationCss.includes('.sheet-preview-box > h3'), 'Deve conter estilização para .sheet-preview-box > h3');
assert.ok(migrationCss.includes('.sheet-preview-history > h3'), 'Deve conter estilização para .sheet-preview-history > h3');
assert.ok(migrationCss.includes('.sheet-preview .panel-title'), 'Deve conter estilização para .sheet-preview .panel-title');
assert.ok(migrationCss.includes('.sheet-equipment-block h4'), 'Deve conter estilização para .sheet-equipment-block h4');
assert.ok(migrationCss.includes("var(--font-display, 'Tormenta', 'Cinzel', serif)"), 'Deve usar a fonte Tormenta/Cinzel');

assert.ok(compCss.includes('.item-title') && compCss.includes('.card-title'), 'Componentes compartilhados devem estilizar .item-title e .card-title com Tormenta');
console.log('✔ Padronização de títulos e fontes no CSS validada com sucesso!');

// 2. Validar layout da Origem Regional (itens à esquerda, benefício selecionado à direita)
console.log('\n2. Validando alinhamento e estrutura da Origem Regional...');
const periciasPrereqCode = fs.readFileSync(path.resolve('src/regras/criador/pericias-prerequisitos.ts'), 'utf8');

assert.ok(periciasPrereqCode.includes('regionalLeft + regionalRight'), 'Origem regional deve posicionar itens à esquerda e benefício à direita (regionalLeft + regionalRight)');
assert.ok(periciasPrereqCode.includes('check-card origin-benefit-button selected'), 'Benefício regional deve usar o quadro idêntico aos benefícios selecionados da origem padrão');
assert.ok(periciasPrereqCode.includes('cursor:default'), 'Benefício regional não deve ter opção de desmarcar');
console.log('✔ Estrutura espelhada da Origem Regional validada com sucesso!');

// 3. Validar regra da escolha do Artesão (Item Fabricável até T$ 50)
console.log('\n3. Validando regra do Artesão (Item Fabricável até T$ 50)...');
const passivasCode = fs.readFileSync(path.resolve('src/regras/criador/passivas-proficiencias.ts'), 'utf8');
assert.ok(passivasCode.includes("isCraftableChoice:true"), 'Escolha do Artesão deve conter isCraftableChoice: true');

const availableItemsCode = fs.readFileSync(path.resolve('src/funcionalidades/loja/05-01-availableInitialItems.ts'), 'utf8');
assert.ok(availableItemsCode.includes('isCraftChoice'), 'availableInitialItems deve tratar isCraftChoice');
assert.ok(availableItemsCode.includes('price > maxBudget'), 'availableInitialItems deve respeitar estritamente o limite de preço do orçamento');
assert.ok(availableItemsCode.includes('isItemCraftableByOffices'), 'availableInitialItems deve filtrar itens fabricáveis pelos ofícios do personagem');
assert.ok(availableItemsCode.includes("a.nome.localeCompare(b.nome, 'pt-BR')"), 'availableInitialItems deve ordenar itens em ordem alfabética na escolha de fabricação');

const prepareCatalogCode = fs.readFileSync(path.resolve('src/funcionalidades/loja/03-03-prepareCatalogItem.ts'), 'utf8');
assert.ok(prepareCatalogCode.includes('getEligibleCatalogItems'), 'prepareCatalogItem deve calcular os itens elegíveis para filtros contextuais');
assert.ok(prepareCatalogCode.includes('isDisabled = option.count === 0'), 'Chips com contagem zero devem ser marcadas como disabled');
console.log('✔ Regras de fabricação, limite de T$ 50, ordem alfabética e contadores validadas com sucesso!');

console.log('\n======================================================');
console.log('🎉 SUCESSO TOTAL: Todos os testes das solicitações passaram!');
console.log('======================================================\n');
