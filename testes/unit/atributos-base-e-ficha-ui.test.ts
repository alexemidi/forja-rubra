import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Ficha: Alinhamento de Perícias, Botão Alterar em PV/PM, Ícone Pergaminho, Defesa com Sigla e Página Atributos Base', () => {
  const renderCode = fs.readFileSync(path.resolve('src/funcionalidades/criador/ficha/renderizacao.ts'), 'utf8');
  const cssCode = fs.readFileSync(path.resolve('src/estilos/criador/ficha-legada.css'), 'utf8');
  const navValCode = fs.readFileSync(path.resolve('src/compartilhado/criador/navegacao-validacao.ts'), 'utf8');
  const statsCode = fs.readFileSync(path.resolve('src/regras/criador/estatisticas.ts'), 'utf8');
  const originsCode = fs.readFileSync(path.resolve('src/funcionalidades/criador/fases/04-origens-divindades.ts'), 'utf8');
  const spellsCode = fs.readFileSync(path.resolve('src/funcionalidades/criador/ficha/habilidades-magias.ts'), 'utf8');
  const eventsCode = fs.readFileSync(path.resolve('src/integracoes/criador/eventos-e-servicos.ts'), 'utf8');
  const shopRewardCode = fs.readFileSync(path.resolve('src/funcionalidades/criador/ficha/loja-taverna-recompensas.ts'), 'utf8');

  // 1. Quadro de perícias alinhado na mesma altura que os quadros de atributos
  assert.ok(
    cssCode.includes('.sheet-preview-middle>.sheet-preview-skills{position:relative;top:auto;bottom:auto;align-self:start;transform:none;margin-top:0}'),
    'O quadro de perícias não deve ter margin-top extra para alinhar com os atributos'
  );
  assert.ok(
    cssCode.includes('.sheet-preview-attributes{grid-template-columns:repeat(6,minmax(0,1fr));gap:clamp(8px,2vw,30px);padding:0;margin-top:0}'),
    'O container .sheet-preview-attributes deve ter padding:0 e margin-top:0 para alinhar o topo com as perícias'
  );

  // 2. Botão Alterar dentro do quadro de PV e PM no canto superior esquerdo
  assert.ok(
    renderCode.includes('class="sheet-vitals-attr-toggle-wrap" style="position:absolute;top:10px;left:14px;'),
    'O botão Alterar deve estar posicionado no canto superior esquerdo dentro do quadro de PV e PM'
  );
  assert.ok(
    renderCode.includes("return '<section class=\"sheet-preview-vitals\">' +\n    attrToggleHtml +"),
    'attrToggleHtml deve ser renderizado dentro de .sheet-preview-vitals'
  );

  // 3. Ícone de pergaminho aberto no botão de Planejamento
  assert.ok(
    renderCode.includes("window.IconesForja ? window.IconesForja.get('scroll', 'sheet-action-icon-svg')"),
    'O botão de planejamento nos vitais deve usar o ícone scroll (pergaminho aberto)'
  );
  assert.ok(
    renderCode.includes("window.IconesForja ? window.IconesForja.get('scroll', 'sheet-action-btn-icon')"),
    'O botão de planejamento na barra de ações rápida também deve usar o ícone scroll'
  );

  // 4. Texto da Defesa com sigla do atributo (ex: Base 10 + 0 DES + 5 de armadura + 0 de escudo + 0 bônus)
  assert.ok(
    renderCode.includes('const defAttrLabel = `${defAttrMod} ${effectiveDefAttr.toUpperCase()}`;'),
    'A fórmula de defesa deve exibir o modificador seguido da sigla em maiúsculas do atributo de defesa (ex: 0 DES ou 2 CAR)'
  );

  // 5. Página Atributos Base visível, editável e com botão de voltar à configuração padrão
  assert.ok(
    renderCode.includes('function renderBaseAttributesPage()'),
    'Deve existir a função renderBaseAttributesPage()'
  );
  assert.ok(
    renderCode.includes('data-action="reset-base-attributes"'),
    'A página Atributos Base deve possuir o botão Voltar à Configuração Padrão'
  );
  assert.ok(
    renderCode.includes('Voltar à Configuração Padrão'),
    'O texto do botão de restaurar padrão deve estar presente'
  );
  assert.ok(
    renderCode.includes('data-base-attr-core='),
    'A página Atributos Base deve permitir editar os atributos-chave principais (pv, defense, load, spellKey)'
  );
  assert.ok(
    renderCode.includes('data-base-attr-skill='),
    'A página Atributos Base deve permitir editar o atributo-chave de cada perícia'
  );
  assert.ok(
    navValCode.includes('characterPvKeyAttribute') &&
    navValCode.includes('characterLoadKeyAttribute') &&
    navValCode.includes('defaultDefenseAttribute') &&
    navValCode.includes('defaultSkillEffectiveAttribute'),
    'Os helpers de atributos-chave customizados e padrões devem existir em navegacao-validacao.ts'
  );
  assert.ok(
    statsCode.includes('characterPvKeyAttribute()'),
    'O cálculo de PV em estatisticas.ts deve respeitar characterPvKeyAttribute()'
  );
  assert.ok(
    originsCode.includes('defaultSpellKeyAttribute') && originsCode.includes('state?.customBaseAttributes?.spellKey'),
    'characterSpellKeyAttribute deve respeitar state.customBaseAttributes.spellKey'
  );
  assert.ok(
    spellsCode.includes('state?.customBaseAttributes?.load') && spellsCode.includes('state?.customBaseAttributes?.spellKey'),
    'habilidades-magias.ts deve respeitar os atributos customizados de carga e magias/CD'
  );
  assert.ok(
    eventsCode.includes("if(action==='base-attributes')") && shopRewardCode.includes('baseAttributesViewContainer'),
    'O roteamento da view base-attributes deve estar conectado em eventos-e-servicos.ts e loja-taverna-recompensas.ts'
  );

  // 6. Acesso a Atributos Base no Menu Principal (Drawer)
  const drawerCode = fs.readFileSync(path.resolve('src/compartilhado/drawer/drawer-ui.ts'), 'utf8');
  assert.ok(
    drawerCode.includes('data-drawer-action="base-attributes"'),
    'O Menu Principal (Drawer) deve conter o item Atributos Base'
  );
  assert.ok(
    !renderCode.includes('data-sheet-action="base-attributes" title="Abrir página de Atributos Base'),
    'O botão de Atributos Base foi movido do quadro de PV/PM para o Menu Principal'
  );

  // 7. Barra de etapas superior (#phaseNav) com nome do personagem, raça e classe na fonte do Tormenta 20
  assert.ok(
    originsCode.includes('function renderNavHeroSummaryHtml()') &&
    originsCode.includes('phase-nav-hero-summary'),
    'renderNav deve incluir o resumo de nome do personagem, raça e classe na barra superior'
  );

  // 8. Proficiências do personagem e prevenção de falso positivo com o poder "Proficiência"
  const skillsPowersCode = fs.readFileSync(path.resolve('src/funcionalidades/criador/fases/03-pericias-oficios.ts'), 'utf8');
  assert.ok(
    skillsPowersCode.includes("candidate.id!=='proficiencia'&&slug(candidate.nome)!=='proficiencia'"),
    'generalPowerEligibility não deve confundir "proficiência com escudos" com o poder geral "Proficiência"'
  );
});
