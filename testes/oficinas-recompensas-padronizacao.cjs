// @ts-check
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

console.log('=== Iniciando Testes de Oficinas, Recompensas e TopBar Unificada ===\n');

// 1. Validar ausência estrita de emojis em todo o diretório src
console.log('1. Validando ausência estrita de emojis em src...');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(full));
    } else if (file.endsWith('.js') || file.endsWith('.html')) {
      results.push(full);
    }
  });
  return results;
}

const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
const srcFiles = walk('src');
const emojiOffenders = [];
srcFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((l, idx) => {
    if (emojiRegex.test(l)) {
      emojiOffenders.push(`${f}:${idx + 1}: ${l.trim()}`);
    }
  });
});

assert.equal(emojiOffenders.length, 0, `Emojis encontrados no projeto:\n${emojiOffenders.join('\n')}`);
console.log('✔ Ausência de emojis em 100% dos arquivos de src aprovada!');

// 2. Validar navegação direta em oficina.js para loja.html?oficina=...
console.log('\n2. Validando navegação direta nos cards de oficinas...');
const oficinaJs = fs.readFileSync('src/funcionalidades/oficina/00-00-oficina.js', 'utf8');
assert(oficinaJs.includes("window.location.href = 'loja.html?oficina=' + encodeURIComponent(divKey);"), 'navegarParaOficina deve redirecionar diretamente para loja.html?oficina=');
console.log('✔ Redirecionamento direto nos cards de oficina aprovado!');

// 3. Validar mochila recolhida por padrão em todas as oficinas e persistência
console.log('\n3. Validando mochila recolhida por padrão em todas as oficinas...');
const initialChoiceJs = fs.readFileSync('src/funcionalidades/loja/05-00-initialChoice.js', 'utf8');
assert(initialChoiceJs.includes('const startCollapsed = !Boolean(window.__workshopBackpackExpanded);'), 'startCollapsed deve ser true por padrão em todas as oficinas e respeitar window.__workshopBackpackExpanded');
assert(initialChoiceJs.includes('window.__workshopBackpackExpanded = true;'), 'deve persistir estado expandido da mochila');
assert(initialChoiceJs.includes('window.__workshopBackpackExpanded = false;'), 'deve persistir estado recolhido da mochila');
console.log('✔ Mochila recolhida por padrão e persistente aprovada!');

// 4. Validar botão de debug oculto para jogadores
console.log('\n4. Validando botão de debug oculto para jogadores...');
const lojaHtml = fs.readFileSync('src/paginas/loja.html', 'utf8');
assert(lojaHtml.includes('id="debugModeButton"') && lojaHtml.includes('display:none !important;'), 'debugModeButton deve estar com display:none !important; no HTML');
const registerCustomJs = fs.readFileSync('src/funcionalidades/loja/03-08-registerCustomItem.js', 'utf8');
assert(registerCustomJs.includes('verificarPermissaoMestreDebug'), 'registerCustomItem deve checar permissão de mestre para debug');
console.log('✔ Botão de debug protegido e oculto para jogadores aprovado!');

// 5. Validar verbos de produção por ofício (Alquimista: Preparar, Armeiro: Forjar, Demais: Fabricar)
console.log('\n5. Validando verbos de produção por ofício...');
assert(initialChoiceJs.includes('Preparar Poção'), 'Card de poções deve exibir "Preparar Poção"');
assert(initialChoiceJs.includes("const mundaneBtnText = isAlquimia ? 'Preparar Alquímico'"), 'Alquimista deve exibir "Preparar Alquímico" no catálogo');
assert(initialChoiceJs.includes("isArmeiro ? 'Forjar Mundano' : 'Fabricar Mundano'"), 'Armeiro deve forjar e demais devem fabricar');
assert(initialChoiceJs.includes('Fabricar e Acoplar') === false, 'Acoplamento genérico foi removido em favor do poder canônico Armadura Mecanizada');
assert(initialChoiceJs.includes('Costurar Novo Item') === false, 'Costurar Novo Item deve ser substituído por Fabricar Novo Item');
assert(initialChoiceJs.includes('Forjar em Madeira') === false, 'Forjar em Madeira deve ser substituído por Fabricar Novo Item');
console.log('✔ Verbos de produção estritamente padronizados por ofício aprovados!');

// 6. Validar padronização visual dos cabeçalhos (TopBar e AppHeader)
console.log('\n6. Validando padronização visual completa dos cabeçalhos (Print 2)...');
const migrationThemeCss = fs.readFileSync('src/estilos/criador/migration-theme.css', 'utf8');
assert(migrationThemeCss.includes('#0d1117'), 'app-header deve usar fundo escuro #0d1117');
assert(migrationThemeCss.includes('#1a2230'), 'app-header deve ter borda #1a2230');
assert(migrationThemeCss.includes('#94a3b8'), 'brand small deve usar #94a3b8 em vez de cor vermelha');
assert(migrationThemeCss.includes('#d4af37'), 'brand h1 deve usar #d4af37 em vez de fonte antiga');
assert(migrationThemeCss.includes("'Cinzel',serif"), 'brand h1 deve usar fonte Cinzel');
assert(migrationThemeCss.includes('.app-header .hero-status-pill'), 'app-header deve suportar hero-status-pill padronizada');

const topbarJs = fs.readFileSync('src/compartilhado/topbar-unificada.js', 'utf8');
assert(topbarJs.includes('#dc2626') || topbarJs.includes('#d4af37'), 'topbar unificada deve usar cor da marca (#dc2626)');
assert(topbarJs.includes("'Cinzel',serif"), 'topbar unificada deve usar Cinzel serif');
assert(topbarJs.includes('text-transform:uppercase;'), 'topbar unificada deve renderizar nome em caixa alta');
assert(topbarJs.includes('renderBottombarIfNeeded'), 'topbarJs deve conter renderBottombarIfNeeded');
assert(topbarJs.includes('STARTING_FUNDS_TABLE[level]'), 'topbarJs deve resolver patrimônio mínimo de nível > 1');
// 7. Validar remoção de agua_benta_2 de dados/items.json
console.log('\n7. Validando ausência de agua_benta_2 duplicada em dados/items.json...');
const itemsJson = fs.readFileSync('dados/items.json', 'utf8');
const itemsData = JSON.parse(itemsJson);
const hasAguaBenta2 = itemsData.some(i => i.id === 'agua_benta_2');
assert.equal(hasAguaBenta2, false, 'agua_benta_2 duplicada não deve existir em dados/items.json');
console.log('✔ Ausência de agua_benta_2 duplicada confirmada!');

// 8. Validar Cabeçalho Ultra Limpo (Forja Rubra centralizado + 3 linhas vermelhas no menu + sem botão subir nível)
console.log('\n8. Validando Cabeçalho Ultra Limpo (centralizado, menu vermelho, sem subir nível)...');
const migrationCss = fs.readFileSync('src/estilos/criador/migration-theme.css', 'utf8');
assert(topbarJs.includes('<a href="index.html" class="topbar-unified-brand"'), 'Topbar deve ter link Forja Rubra para index.html');
assert(!topbarJs.includes('Assistente de criação'), 'Topbar não deve ter texto Assistente de criação');
assert(topbarJs.includes('left:50%') && topbarJs.includes('translateX(-50%)'), 'Topbar deve centralizar Forja Rubra');
assert(migrationCss.includes('left:50%!important') && migrationCss.includes('translateX(-50%)!important'), 'CSS deve centralizar Forja Rubra');
assert(topbarJs.includes('#dc2626'), 'Topbar deve ter 3 linhas vermelhas no menu (#dc2626)');
assert(migrationCss.includes('#dc2626!important'), 'CSS deve colorir 3 linhas do menu de vermelho (#dc2626)');
const lojaItensJs = fs.readFileSync('src/integracoes/criador/loja-itens-iniciais.js', 'utf8');
assert(lojaItensJs.includes('levelUpBtn.hidden=true') || lojaItensJs.includes('levelUpBtn.remove()'), 'syncSheetHeadingMenu deve ocultar/remover botão subir de nível do cabeçalho');
assert(migrationCss.includes('.app-header #levelUpButton') && migrationCss.includes('display:none!important'), 'CSS deve ocultar botão subir de nível no app-header');
console.log('✔ Cabeçalho Ultra Limpo (centralizado, menu com 3 linhas vermelhas, sem subir nível) aprovado!');

// 9. Validar que Armeiro, Alfaiate, Carpinteiro e Artesão não possuem cards de topo desnecessários
console.log('\n9. Validando ausência de cards especiais de topo em armeiro, alfaiate, carpinteiro e artesão...');
assert(!initialChoiceJs.includes("itemsGrid.insertAdjacentHTML('afterbegin', armeiroWorkshopCardHtml())"), 'Armeiro não deve injetar card de topo');
assert(!initialChoiceJs.includes("itemsGrid.insertAdjacentHTML('afterbegin', alfaiateWorkshopCardHtml())"), 'Alfaiate não deve injetar card de topo');
assert(!initialChoiceJs.includes("itemsGrid.insertAdjacentHTML('afterbegin', carpinteiroWorkshopCardHtml())"), 'Carpinteiro não deve injetar card de topo');
assert(!initialChoiceJs.includes("itemsGrid.insertAdjacentHTML('afterbegin', artesaoWorkshopCardHtml())"), 'Artesão não deve injetar card de topo');
assert(initialChoiceJs.includes("itemsGrid.querySelectorAll('.workshop-backpack-section, .workshop-divider').forEach(el => el.remove());"), 'Divisórias antigas devem ser limpas para impedir duplicação de Loja Loja Loja');
console.log('✔ Regras de cards de topo e limpeza de divisórias aprovadas!');

// 10. Validar card de poções integrado como serviço canônico na Taverna (sem banner roxo)
console.log('\n10. Validando card de poções integrado como serviço padrão na Taverna...');
const tavernDataJs = fs.readFileSync('src/funcionalidades/taverna/03-00-TAVERN_DATA.js', 'utf8');
assert(!tavernDataJs.includes('tavern-special-potion-card'), 'Banner roxo tavern-special-potion-card deve ter sido removido');
assert(tavernDataJs.includes('CANONICAL_POTION_SERVICE'), 'CANONICAL_POTION_SERVICE deve estar definido em TAVERN_DATA.js');
assert(tavernDataJs.includes('item.isPotionService'), 'renderCards deve renderizar item.isPotionService como card regular');
console.log('✔ Card de poções integrado na Taverna aprovado!');

// 11. Validar compra de melhorias e encantamentos na Loja vs Oficina e layout unificado
console.log('\n11. Validando compra de melhorias e encantamentos na Loja e layout unificado de encantamentos...');
const magicRuleStatsTs = fs.readFileSync('src/funcionalidades/loja/03-06-magicRuleStatsHtml.ts', 'utf8');
assert(!magicRuleStatsTs.includes('Adicionar melhorias (Forjar)'), 'Botão na Loja não deve exibir "(Forjar)"');
assert(!magicRuleStatsTs.includes('Adicionar encantos (Encantar)'), 'Botão na Loja não deve exibir "(Encantar)"');
assert(magicRuleStatsTs.includes('title="Adicionar melhorias"'), 'Botão de melhorias deve ter título limpo de compra');
assert(magicRuleStatsTs.includes('title="Adicionar encantamentos"'), 'Botão de encantamentos deve ter título limpo de compra');
assert(magicRuleStatsTs.includes('Encantamentos Disponíveis'), 'Modal de encantamentos deve usar barra lateral padronizada "Encantamentos Disponíveis"');
assert(magicRuleStatsTs.includes('select-sidebar-enchantment'), 'Modal de encantamentos deve ter botão de adicionar encantamento na barra lateral');
assert(magicRuleStatsTs.includes('remove-slot-enchantment'), 'Modal de encantamentos deve permitir remover encantamento no card de slot');
assert(magicRuleStatsTs.includes('Preço final de compra:'), 'Modal na Loja deve exibir preço final de compra sem CD de fabricação');
const registerCustomTs = fs.readFileSync('src/funcionalidades/loja/03-08-registerCustomItem.ts', 'utf8');
assert(registerCustomTs.includes("action==='select-sidebar-enchantment'"), 'Listener deve tratar select-sidebar-enchantment');
assert(registerCustomTs.includes("action==='remove-sidebar-enchantment'"), 'Listener deve tratar remove-sidebar-enchantment');
assert(registerCustomTs.includes("action==='remove-slot-enchantment'"), 'Listener deve tratar remove-slot-enchantment');
console.log('✔ Compra de melhorias/encantamentos na Loja e layout unificado aprovados!');

console.log('\n======================================================');
console.log('🎉 SUCESSO TOTAL: Todas as validações passaram com 100% de integridade!');
console.log('======================================================\n');

