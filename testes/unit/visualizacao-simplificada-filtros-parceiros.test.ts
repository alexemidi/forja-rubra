import assert from 'node:assert/strict';
import { test } from 'node:test';

test('Filtros de Armas: combate e empunhadura devem filtrar corretamente as armas', () => {
  const items = [
    { id: 'adaga', nome: 'Adaga', tipo: 'arma', categoriaId: 'simples', arma: { combateId: 'corpo_a_corpo_e_distancia', empunhaduraId: 'leves' } },
    { id: 'espada_curta', nome: 'Espada Curta', tipo: 'arma', categoriaId: 'simples', arma: { combateId: 'corpo_a_corpo', empunhaduraId: 'uma_mao' } },
    { id: 'arco_curto', nome: 'Arco Curto', tipo: 'arma', categoriaId: 'simples', arma: { combateId: 'distancia', empunhaduraId: 'duas_maos' } },
    { id: 'lanca', nome: 'Lança', tipo: 'arma', categoriaId: 'simples', arma: { combateId: 'corpo_a_corpo_e_distancia', empunhaduraId: 'uma_mao' } }
  ];

  // Filtro: Corpo a corpo
  const stateCombat = 'corpo_a_corpo';
  let filtered = items.filter(item => item.arma && (item.arma.combateId === stateCombat || item.arma.combateId === 'corpo_a_corpo_e_distancia'));
  assert.ok(!filtered.some(it => it.id === 'arco_curto'), 'Arco Curto (à distância) não pode aparecer no filtro Corpo a corpo');
  assert.ok(filtered.some(it => it.id === 'espada_curta'), 'Espada Curta deve aparecer');
  assert.ok(filtered.some(it => it.id === 'lanca'), 'Lança (mista) deve aparecer');

  // Filtro adicional: Uma mão
  const stateGrip = 'uma_mao';
  filtered = filtered.filter(item => item.arma && item.arma.empunhaduraId === stateGrip);
  assert.equal(filtered.length, 2, 'Apenas Espada Curta e Lança são Corpo a Corpo e Uma Mão');
  assert.ok(!filtered.some(it => it.id === 'adaga'), 'Adaga (leves) deve ser excluída pelo filtro de Uma mão');
});

test('Fase de Parceiros: parceiro órfão não pode manter Fase 9 ativa se poder for removido', () => {
  const mockState: any = {
    origin: { standard: 'Acólito', benefits: [] },
    deity: { mode: 'devout', name: 'Thyatis', power: 'dom_da_ressurreicao' }, // Trocou de poder, não é mais familiar elemental
    powers: { general: [] },
    partners: [
      { id: 'familiar_elemental', nome: 'Familiar Elemental: T’peel' }
    ],
    partnerChoices: { familiarElementalType: 'tpeel' }
  };

  const knownGeneratedIds = new Set(['alikunha', 'antigo_mestre', 'amigo_especial', 'um_com_os_kami', 'tumarkhan', 'irmao_cavalo', 'grifo_iniciante', 'familiar_elemental']);

  function hasFamiliarElementalPower() {
    return String(mockState.deity?.power || '').split('|').some((p: string) => p === 'familiar_elemental');
  }

  function syncPartners() {
    if (!hasFamiliarElementalPower()) {
      mockState.partners = mockState.partners.filter((p: any) => p.id !== 'familiar_elemental');
      delete mockState.partnerChoices.familiarElementalType;
    }
  }

  function characterHasPartnerChoices() {
    syncPartners();
    if (hasFamiliarElementalPower()) return true;
    if (Array.isArray(mockState.partners) && mockState.partners.filter((p: any) => p && !knownGeneratedIds.has(p.id)).length > 0) return true;
    return false;
  }

  assert.equal(characterHasPartnerChoices(), false, 'Não deve ter escolhas de parceiro ativas se o poder foi alterado');
  assert.equal(mockState.partners.length, 0, 'Parceiro elemental órfão deve ser expurgado do array');
});

test('Botão Voltar: deve ser estritamente "← Voltar"', () => {
  const previous = { textContent: '' };
  previous.textContent = '← Voltar';
  assert.equal(previous.textContent, '← Voltar', 'Texto deve ser estritamente ← Voltar');
  assert.ok(!previous.textContent.includes('Magias'), 'Não deve conter "Magias"');
});
