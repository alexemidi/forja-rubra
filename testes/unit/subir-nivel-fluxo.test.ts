import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

test('Subir de nível - Validação dos fluxos, ocultação de comprar itens e remoção de banner superior', () => {
  const progCode = readFileSync(resolve('src/funcionalidades/criador/fases/09-progressao.ts'), 'utf-8');
  const lojaCode = readFileSync(resolve('src/integracoes/criador/loja-itens-iniciais.ts'), 'utf-8');
  const navValCode = readFileSync(resolve('src/compartilhado/criador/navegacao-validacao.ts'), 'utf-8');
  const idChoicesCode = readFileSync(resolve('src/funcionalidades/criador/fases/01-identidade-escolhas.ts'), 'utf-8');
  const navLegadaCode = readFileSync(resolve('src/aplicacao/navegacao-legada.ts'), 'utf-8');

  // 1. syncProgressionFooter oculta previousButton e buyMoreBtn em isLevelingUp
  assert.ok(progCode.includes('if(state.isLevelingUp){'), 'Deve tratar isLevelingUp especificamente em syncProgressionFooter');
  assert.ok(progCode.includes('if(previous) previous.hidden = true;'), 'previousButton deve ficar oculto no passo 10 durante subida de nível');
  assert.ok(progCode.includes('if(buyMore) buyMore.hidden = true;'), 'buyMoreItemsBtn deve ficar oculto no passo 10');

  // 2. Banner de Fabricar Item Superior do Inventor foi removido da tela de progressão
  assert.ok(!progCode.includes('go-to-inventor-grant'), 'Banner antigo de Fabricar Item Superior com botão go-to-inventor-grant não deve ser renderizado na tela de progressão');

  // 3. buyMoreBtn aparece exclusivamente na criação do personagem
  assert.ok(lojaCode.includes('const canShowBuyMore = !state.isLevelingUp && !state.editingCharacter && !state.isEditingFinishedSheet;'), 'Comprar itens deve ser restrito exclusivamente à criação inicial de personagem');
  assert.ok(lojaCode.includes('buyMoreBtn.hidden = arsenalShopOpen || !canShowBuyMore;'), 'buyMoreBtn deve ficar oculto em subida de nível ou edição');

  // 4. getNextLevelUpPendingPhase implementada e respeitando a ordem canônica
  assert.ok(navValCode.includes('function getNextLevelUpPendingPhase()'), 'getNextLevelUpPendingPhase deve existir');
  assert.ok(navValCode.includes('if(nextPending === 7){'), 'Deve encaminhar para magias (fase 7) se houver pendência');
  assert.ok(navValCode.includes('if(nextPending === 8){'), 'Deve encaminhar para itens (fase 8) se houver item de classe/poder pendente');
  assert.ok(navValCode.includes('if(nextPending === 9){'), 'Deve encaminhar para parceiros (fase 9) se houver parceiro pendente');

  // 5. Encadeamento da Fase 7 para próxima pendência (Fase 8) em isLevelingUp
  assert.ok(idChoicesCode.includes('if(nextPending && nextPending > 7){'), 'Fase 7 deve encaminhar para itens (8) ou parceiros (9) na subida de nível');

  // 6. Encadeamento da Fase 8 para próxima pendência (Fase 9) em isLevelingUp
  assert.ok(lojaCode.includes('if(nextPending && nextPending > 8){'), 'Fase 8 deve encaminhar para parceiros (9) na subida de nível');

  // 7. Navegação de retorno (previousButton) em isLevelingUp
  assert.ok(idChoicesCode.includes("state.step = hasSpells ? 7 : 10;"), 'Voltar da fase 8 deve levar a magias (se conjurador) ou poderes de classe (10)');

  // 8. Barra de etapas (renderNav) em isLevelingUp mostra apenas etapas relevantes
  assert.ok(idChoicesCode.includes("const isLevelUp = Boolean(state.isLevelingUp);"), 'renderNav deve tratar isLevelingUp');
  assert.ok(idChoicesCode.includes("nav.innerHTML='<div class=\"phase-nav-title\">'+(isLevelUp?'Subida de nível':'Etapas')"), 'Título da barra deve refletir subida de nível');

  // 9. Blindagem no renderStage de navegacao-legada.ts
  assert.ok(navLegadaCode.includes("if(state.isLevelingUp&&safeStep===10)prevBtnEl.hidden=true;"), 'previousButton deve ser forçado como hidden no passo 10');
  assert.ok(navLegadaCode.includes("if(buyMoreEl)buyMoreEl.hidden=true;"), 'buyMoreItemsBtn deve ser forçado como hidden no renderStage');
});
