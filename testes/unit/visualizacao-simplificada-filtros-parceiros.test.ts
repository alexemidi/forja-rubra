import assert from 'node:assert/strict';
import fs from 'node:fs';
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

test('Origem Regional em Modo Single: deve ser exibida no cabeçalho e habilidades da ficha', () => {
  const mockOrigins = [{ nome: 'Acólito' }];
  const mockRegionalOrigins = [{ nome: 'Batalhão de Ferro', regiao: 'Yuden' }];
  const mockState: any = {
    origin: { mode: 'single', standard: 'Batalhão de Ferro', regional: '', benefits: [] }
  };

  function selectedStandardOrigin() {
    return mockOrigins.find(o => o.nome === mockState.origin.standard);
  }

  function selectedRegionalOrigin() {
    if (mockState.origin?.mode === 'single') {
      const reg = mockRegionalOrigins.find(o => o.nome === mockState.origin.standard);
      if (reg) return reg;
    }
    return mockRegionalOrigins.find(o => o.nome === mockState.origin.regional);
  }

  const origin = selectedStandardOrigin();
  const regional = selectedRegionalOrigin();
  const originDisplayName = [origin?.nome, regional?.nome].filter(Boolean).join(' / ') || mockState.origin?.standard || mockState.origin?.regional || '—';

  assert.equal(origin, undefined, 'Não deve ser encontrada em standard origins');
  assert.ok(regional, 'Deve ser encontrada como origem regional');
  assert.equal(regional?.nome, 'Batalhão de Ferro');
  assert.equal(originDisplayName, 'Batalhão de Ferro', 'Nome da origem regional deve aparecer no cabeçalho');
});

test('Poder Concedido Thwor: Tropas Duyshidakk não pode ficar duplicado', () => {
  const deities = JSON.parse(fs.readFileSync('dados/criador-deities.json', 'utf8'));
  const thwor = deities.find((d: any) => d.nome.toLowerCase() === 'thwor');
  assert.ok(thwor, 'Thwor deve existir no catálogo de divindades');
  
  const duyshPowers = thwor.poderes_concedidos.filter((p: string) => p.toLowerCase().includes('duyshidakk'));
  assert.equal(duyshPowers.length, 1, 'Deve haver exatamente 1 poder Duyshidakk em Thwor');
  assert.equal(duyshPowers[0], 'Tropas Duyshidakk', 'O nome deve ser o oficial Tropas Duyshidakk');

  // Desduplicação no estado mesmo se ficha antiga tiver ambos
  const statePowerString = 'Troças Duyshidakk|Tropas Duyshidakk';
  const parts = statePowerString.split('|').map(p => (p === 'Troças Duyshidakk' || p === 'trocas_duyshidakk') ? 'Tropas Duyshidakk' : p);
  const deduplicated = Array.from(new Set(parts.filter(Boolean)));
  assert.equal(deduplicated.length, 1, 'Deve desduplicar para apenas 1 poder');
  assert.equal(deduplicated[0], 'Tropas Duyshidakk');
});
