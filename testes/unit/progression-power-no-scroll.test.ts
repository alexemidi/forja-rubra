import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

test('Lista de Poderes de Classe - Preservação estrita de rolagem e bloqueio de saltos involuntários', () => {
  const progCode = readFileSync(resolve('src/funcionalidades/criador/fases/09-progressao.ts'), 'utf-8');
  const navValCode = readFileSync(resolve('src/compartilhado/criador/navegacao-validacao.ts'), 'utf-8');

  // 1. previewProgressionPower não deve ter o cálculo indevido de offsetTop que forçava scrollTop da lista
  assert.ok(!progCode.includes('if (top < listContainer.scrollTop)'), 'Não deve forçar listContainer.scrollTop com base em offsetTop');
  assert.ok(!progCode.includes('listContainer.scrollTop = bottom - listContainer.clientHeight'), 'Não deve alterar listContainer.scrollTop para o final no clique');

  // 2. Não deve chamar targetButton.focus() no clique (que causaria scroll involuntário no mobile/desktop)
  assert.ok(!progCode.includes('targetButton.focus?.({ preventScroll: true })'), 'Não deve invocar focus() durante seleção que dispara scroll no mobile');

  // 3. Deve tratar explicitamente rolagem apenas se a navegação foi feita via teclado
  assert.ok(progCode.includes('if (options?.fromKeyboard && targetButton)'), 'Rolagem só deve ser suavemente assistida se a navegação for via teclado');

  // 4. Manipulador de clique em class-power-preview deve prevenir saltos com preventDefault()
  assert.ok(navValCode.includes("else if(button.dataset.action==='class-power-preview'){event.preventDefault();previewProgressionPower"), 'Clique em class-power-preview deve conter preventDefault()');

  // 5. Navegação por teclado passa fromKeyboard: true
  assert.ok(navValCode.includes("fromKeyboard:true"), 'Navegação por setas do teclado deve sinalizar fromKeyboard');
});
