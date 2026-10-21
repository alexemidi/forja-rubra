const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Validação de Ícones de Condições (SVG limpos, sem rostos bizarros)', () => {
  const iconesCode = fs.readFileSync(path.join(__dirname, '../src/components/ui/condition-badges.ts'), 'utf8');
  assert.ok(iconesCode.includes('fraco:'), 'Deve conter ícone de fraco');
  assert.ok(iconesCode.includes('enredado:'), 'Deve conter ícone de enredado');
  assert.ok(iconesCode.includes('sangrando:'), 'Deve conter ícone de sangrando');

  // Verifica que fraco usa traços de braço magro e não círculo de rosto
  assert.ok(!iconesCode.includes('fraco: rosto'), 'Fraco não deve usar o molde de rosto');
  assert.ok(!iconesCode.includes('enredado: rosto'), 'Enredado não deve usar o molde de rosto');
  assert.ok(!iconesCode.includes('sangrando: rosto'), 'Sangrando não deve usar o molde de rosto');
});

test('Validação de Card dos Parceiros Limpo (sem botão alterar perícia nem tags amarelas soltas)', () => {
  const habCode = fs.readFileSync(path.join(__dirname, '../src/funcionalidades/criador/ficha/habilidades-magias.js'), 'utf8');
  assert.ok(!habCode.includes('sheet-partner-config-skills-btn'), 'Não deve conter botão de alterar perícias no card da ficha');
  assert.ok(!habCode.includes('Alterar perícias'), 'Não deve conter texto de alterar perícias');
  assert.ok(habCode.includes('sheet-mount-status-row'), 'Deve conter linha de status limpa da montaria');
  assert.ok(habCode.includes('sheet-mount-toggle-btn'), 'Deve conter botão de montar/desmontar');
});

test('Validação de Botões de Equipar de Animais na Mochila', () => {
  const mochilaCode = fs.readFileSync(path.join(__dirname, '../src/funcionalidades/criador/inventario/mochila-heroi-moedas-consumo.js'), 'utf8');
  assert.ok(mochilaCode.includes('data-equip-action="equip-mount-gear"'), 'Deve conter ação de equipar na montaria');
  assert.ok(mochilaCode.includes('data-equip-action="unequip-mount-gear"'), 'Deve conter ação de desequipar da montaria');

  const acoesCode = fs.readFileSync(path.join(__dirname, '../src/funcionalidades/criador/inventario/acoes-equipamento.js'), 'utf8');
  assert.ok(acoesCode.includes("action==='equip-mount-gear'"), 'acoes-equipamento deve tratar equip-mount-gear');
  assert.ok(acoesCode.includes("action==='unequip-mount-gear'"), 'acoes-equipamento deve tratar unequip-mount-gear');
});

test('Validação de Alforje e Carga (+10 espaços para o herói e PDF)', () => {
  const habCode = fs.readFileSync(path.join(__dirname, '../src/funcionalidades/criador/ficha/habilidades-magias.js'), 'utf8');
  assert.ok(habCode.includes('mountAlforjeBonus'), 'habilidades-magias.js deve conter cálculo de mountAlforjeBonus');

  const pdfCode = fs.readFileSync(path.join(__dirname, '../src/integracoes/criador/pdf-exportacao.js'), 'utf8');
  assert.ok(pdfCode.includes('mountAlforjeBonus'), 'pdf-exportacao.js deve incluir mountAlforjeBonus no BônusCarga');

  const pdfCamposCode = fs.readFileSync(path.join(__dirname, '../src/integracoes/criador/pdf-campos.js'), 'utf8');
  assert.ok(pdfCamposCode.includes('activeMountContext(false)'), 'pdf-campos.js deve considerar activeMountContext em pdfMovement');
});

test('Validação de Estilo do Botão + e Alinhamento de RD', () => {
  const css = fs.readFileSync(path.join(__dirname, '../src/estilos/criador/migration-theme.css'), 'utf8');
  assert.ok(css.includes('.sheet-defense-rd{margin:0!important;padding:10px 11px!important;color:var(--text);font:600 .72rem Inter,Arial,sans-serif;background:transparent;border:0;display:flex!important;align-items:center!important;flex-wrap:wrap!important;gap:6px!important;line-height:1!important}'), 'RD deve estar alinhado flex com line-height 1');
  assert.ok(css.includes('.sheet-add-condition-btn,'), 'sheet-add-condition-btn e sheet-partner-add-btn devem compartilhar estilização idêntica');

  const modalCss = fs.readFileSync(path.join(__dirname, '../src/estilos/criador/modal-condicoes.css'), 'utf8');
  assert.ok(modalCss.includes('font-family: inherit;'), 'sheet-add-condition-btn deve usar font-family inherit');
});

test('Validação de Guilda no Topo e Correção da Atmosfera', () => {
  const css1 = fs.readFileSync(path.join(__dirname, '../src/estilos/guilda/1.css'), 'utf8');
  assert.ok(css1.includes('.forja-atmosphere'), 'Guilda 1.css deve conter estilo para .forja-atmosphere');
  assert.ok(css1.includes('position: fixed;'), '.forja-atmosphere deve ter position fixed');
  assert.ok(css1.includes('inset: 0;'), '.forja-atmosphere deve cobrir a janela sem empurrar elementos');

  const manifesto = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/paginas/manifesto.json'), 'utf8'));
  const guildaScripts = manifesto.guilda.scripts.flat();
  assert.ok(guildaScripts.some(s => s.includes('src/compartilhado/drawer/drawer-ui')), 'Manifesto da guilda deve incluir drawer-ui');
  assert.ok(guildaScripts.some(s => s.includes('src/compartilhado/icones')), 'Manifesto da guilda deve incluir icones');
});

test('Validação de Regras de Compra de Montaria (Apenas Iniciante à Venda)', () => {
  const uiCode = fs.readFileSync(path.join(__dirname, '../src/funcionalidades/guilda/03-01-guilda-ui.js'), 'utf8');
  assert.ok(uiCode.includes('Apenas Iniciante à Venda'), 'Deve bloquear compra quando tier selecionado não for iniciante');
  assert.ok(uiCode.includes("st.tier && st.tier !== 'iniciante'"), 'handleBuyMount deve rejeitar compra fora de iniciante');
});

test('Validação do Bloco Minimalista de Poderes Adaptáveis (Sem quadro azul)', () => {
  const renderCode = fs.readFileSync(path.join(__dirname, '../src/funcionalidades/criador/ficha/renderizacao.js'), 'utf8');
  assert.ok(!renderCode.includes('border:1px solid rgba(56,189,248,0.22)'), 'Não deve ter borda azul ciano em poderes adaptáveis');
  assert.ok(!renderCode.includes('background:rgba(56,189,248,0.06)'), 'Não deve ter fundo azul em poderes adaptáveis');
  assert.ok(renderCode.includes('Poderes Adaptáveis'), 'Deve renderizar título de Poderes Adaptáveis');
});

test('Validação de Botões Menores nos Itens de Montaria e Padrão Compacto', () => {
  const habCode = fs.readFileSync(path.join(__dirname, '../src/funcionalidades/criador/ficha/habilidades-magias.js'), 'utf8');
  assert.ok(habCode.includes('min-height:24px;height:24px;line-height:1;cursor:pointer;'), 'Botão equipar no modal de montaria deve ter 24px de altura');
  
  const css = fs.readFileSync(path.join(__dirname, '../src/estilos/criador/migration-theme.css'), 'utf8');
  assert.ok(css.includes('.button.small,.btn.small'), 'migration-theme.css deve definir .button.small com padrão compacto');
  assert.ok(css.includes('min-height:24px!important;height:24px!important;'), 'Botões pequenos devem ter min-height e height de 24px');
  assert.ok(css.includes('clip-path:polygon(0 0,calc(100% - 4px) 0,100% 4px,100% 100%,4px 100%,0 calc(100% - 4px))!important'), 'Botões pequenos devem ter chanfro reduzido de 4px');
});

test('Validação de Botão Único ao Subir de Nível (Apenas Confirmar Poder)', () => {
  const poderesCode = fs.readFileSync(path.join(__dirname, '../src/funcionalidades/criador/fases/09-lista-poderes.js'), 'utf8');
  assert.ok(!poderesCode.includes('Aprender poder'), 'Não deve conter botão "Aprender poder" no painel de detalhes do poder');

  const progCode = fs.readFileSync(path.join(__dirname, '../src/funcionalidades/criador/fases/09-progressao.js'), 'utf8');
  assert.ok(progCode.includes('if(state.isLevelingUp){'), 'syncProgressionFooter deve tratar isLevelingUp especificamente');
  assert.ok(progCode.includes('if(next) next.hidden = true;'), 'Finalizar ficha deve ficar oculto ao subir de nível');
  assert.ok(progCode.includes("stepNext.innerHTML = distIconMini + 'Confirmar poder →';"), 'stepNext deve exibir Confirmar poder');
});


