const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('Validação de ausência de texto Estábulo no card de parceiros', () => {
  const content = fs.readFileSync(path.join(__dirname, '../src/funcionalidades/criador/ficha/habilidades-magias.js'), 'utf8');
  assert.doesNotMatch(content, /Estábulo \+/i, 'Não deve haver texto "Estábulo +" no card de parceiros');
  assert.doesNotMatch(content, /sheet-partner-stable-link/i, 'Não deve haver classe obsoleta sheet-partner-stable-link');
  assert.match(content, /href="guilda\.html"/, 'Deve conter link direto para a guilda');
});

test('Validação do bloco de poderes trocáveis abaixo de proficiências', () => {
  const renderContent = fs.readFileSync(path.join(__dirname, '../src/funcionalidades/criador/ficha/renderizacao.js'), 'utf8');
  assert.match(renderContent, /function renderSheetSwapPowersBlock\(\)/, 'Deve existir renderSheetSwapPowersBlock');
  assert.match(renderContent, /function renderSheetDistinctionBlock\(\)/, 'Deve existir renderSheetDistinctionBlock');
  assert.match(renderContent, /sheet-swap-powers-box/, 'Deve conter container sheet-swap-powers-box');
  assert.match(renderContent, /Poderes Adaptáveis/, 'Deve conter título temático');
  assert.match(renderContent, /open-cosmopolita-swap/, 'Deve conter ação para troca do cosmopolita');
  assert.match(renderContent, /open-agente-elite-swap/, 'Deve conter ação para troca do agente de elite');
  assert.match(renderContent, /proficienciesColumn\s*=\s*'<div class="sheet-preview-proficiencies-column"/, 'Deve agrupar proficiências, distinção e bloco de troca na mesma coluna vertical');
});

test('Validação de poderes de distinção integrados na lista de poderes de classe', () => {
  const listaPoderesContent = fs.readFileSync(path.join(__dirname, '../src/funcionalidades/criador/fases/09-lista-poderes.js'), 'utf8');
  assert.match(listaPoderesContent, /progressionDistinctionOptions\(index\)/, 'Deve buscar poderes de distinções ativas');
  assert.match(listaPoderesContent, /classPowersWithDistinctions/, 'Deve compor lista de classe com poderes de distinções obtidas');
  assert.match(listaPoderesContent, /distIconSvg/, 'Deve incluir ícone vetorial de distinção nos poderes e botão');
  assert.match(listaPoderesContent, /is-distinction-power/, 'Deve incluir classe is-distinction-power na linha do poder');
  assert.doesNotMatch(listaPoderesContent, /<span class="tag gold">Distinção<\/span>/, 'Não deve exibir a tag com a palavra Distinção');
});

test('Progression footer: ícone de distinção ao confirmar poder de distinção', () => {
  const progressaoContent = fs.readFileSync(path.join(__dirname, '../src/funcionalidades/criador/fases/09-progressao.js'), 'utf8');
  assert.match(progressaoContent, /isDistinction\s*=\s*candidate\s*&&/, 'Deve verificar se candidato é poder de distinção');
  assert.match(progressaoContent, /distIconMini\s*\+\s*'Confirmar poder →'/, 'Deve renderizar ícone vetorial de distinção no botão de confirmação');
});

test('Exportação PDF: distinção em Proficiências, parceiros/montaria em Anotações e alforje no bônus de carga', () => {
  const pdfContent = fs.readFileSync(path.join(__dirname, '../src/integracoes/criador/pdf-exportacao.js'), 'utf8');
  assert.match(pdfContent, /Distinção:\s*'\s*\+\s*distNames\.join/, 'Deve incluir título da distinção em Proficiências no PDF');
  assert.match(pdfContent, /mountAlforjeBonus\s*=/, 'Deve calcular bônus de 10 de carga para alforje');
  assert.match(pdfContent, /entry\.mountPartnerId\)\s*continue/, 'Não deve poluir slots de inventário do herói com itens equipados na montaria');

  const notesContent = fs.readFileSync(path.join(__dirname, '../src/regras/criador/passivas-proficiencias.js'), 'utf8');
  assert.match(notesContent, /Parceiros e Montarias:/, 'Deve adicionar parceiros e montarias ao texto de anotações');
  assert.match(notesContent, /\[Montaria\]/, 'Deve identificar montaria nas anotações');
  assert.match(notesContent, /\[Parceiro\]/, 'Deve identificar parceiro nas anotações');

  const sheetContent = fs.readFileSync(path.join(__dirname, '../src/funcionalidades/criador/ficha/renderizacao.js'), 'utf8');
  assert.doesNotMatch(sheetContent, /<section class="sheet-preview-identity">[^<]*<span[^>]*><small>Distinção<\/small>/, 'Cabeçalho superior identity não deve ter bloco de distinção');
});

