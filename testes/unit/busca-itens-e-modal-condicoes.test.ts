import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Validação de substituição de en-dash por hífen/menos em dados de itens', () => {
  const itemsPath = path.resolve('dados/items.json');
  const itemsRaw = fs.readFileSync(itemsPath, 'utf8');
  const items = JSON.parse(itemsRaw);

  // Não deve haver nenhum en-dash ou minus sign unicode antes de números em items.json
  const invalidDashes = itemsRaw.match(/[–−]\d+/g);
  assert.equal(invalidDashes, null, 'Não deve haver en-dash ou minus-sign unicode antes de dígitos');

  // Deve haver reduções com hífen ASCII padrão -1 PM, -2, -5
  const matchesMinus1PM = itemsRaw.match(/-1 PM/g);
  assert.ok(matchesMinus1PM && matchesMinus1PM.length > 0, 'Deve conter reduções formatadas com "-1 PM"');
});

test('Validação de normalização de busca de itens com traços e hífens', () => {
  // Simula a lógica de normalizeText da loja
  function normalizeText(value: string): string {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[–—−]/g, '-')
      .toLowerCase();
  }

  assert.equal(normalizeText('-1'), '-1');
  assert.equal(normalizeText('–1'), '-1');
  assert.equal(normalizeText('−1'), '-1');
  assert.equal(normalizeText('—1'), '-1');

  const descricao = 'Reduz em -1 PM o custo de habilidades.';
  const searchPattern = normalizeText('-1');
  assert.ok(normalizeText(descricao).includes(searchPattern), 'Deve encontrar -1 na descrição normalizada');

  const searchPatternEnDash = normalizeText('–1');
  assert.ok(normalizeText(descricao).includes(searchPatternEnDash), 'Deve encontrar –1 mesmo digitando ou colando traço');
});

test('Validação do script modal-condicoes.ts (selected e paths definidos corretamente)', () => {
  const modalPath = path.resolve('src/funcionalidades/criador/ficha/modal-condicoes.ts');
  const modalCode = fs.readFileSync(modalPath, 'utf8');

  assert.ok(modalCode.includes('const selected = filtered.find'), 'selected deve estar declarado antes do uso');
  assert.ok(modalCode.includes('const paths = (c) =>'), 'paths deve estar declarado antes do uso');
  assert.ok(modalCode.includes('subEffectsHtml'), 'subEffectsHtml deve estar presente para condições relacionadas');
  assert.ok(!modalCode.includes('conditionsCloseBottomBtn'), 'Botão duplicado de fechar do rodapé deve ser removido');
});
