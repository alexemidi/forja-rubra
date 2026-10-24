/**
 * Testes Unitários: Complicações Canônicas T20 e Regra Individual de Complicações (Heróis de Arton)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '../..');
const complicacoesData: Array<[string, string, string]> = JSON.parse(
  fs.readFileSync(path.join(root, 'dados/idade-complicacoes.json'), 'utf8')
);

test('Complicações T20: Validar 19 complicações com textos canônicos integrais', () => {
  assert.equal(complicacoesData.length, 19, 'Devem existir exatamente 19 complicações');

  const compMap = new Map(complicacoesData.map(([id, nome, desc]) => [id, { nome, desc }]));

  const abatido = compMap.get('abatido');
  assert(abatido, 'Abatido deve existir');
  assert.equal(abatido.desc, 'Seu vigor se foi. Você recebe –2 PV por nível.');

  const catarata = compMap.get('catarata');
  assert(catarata, 'Catarata deve existir');
  assert.equal(catarata.desc, 'Seus olhos já não são os mesmos. Você sofre –5 em Percepção e Pontaria.');

  const dedosTremulos = compMap.get('dedos_tremulos');
  assert(dedosTremulos, 'Dedos Trêmulos deve existir');
  assert.equal(
    dedosTremulos.desc,
    'Você sofre –2 em Luta e Pontaria. Além disso, quando usa um item que esteja empunhando, role 1d4. Em um resultado 1, você derruba esse item.'
  );

  const rabugento = compMap.get('rabugento');
  assert(rabugento, 'Rabugento deve existir');
  assert.equal(
    rabugento.desc,
    'Você reclama de tudo. Você sofre –5 em testes de Carisma e de perícias baseadas nesse atributo, exceto Intimidação.'
  );

  const devagarJovem = compMap.get('devagar_jovem');
  assert(devagarJovem, '“Devagar, Jovem!” deve existir');
  assert.equal(
    devagarJovem.desc,
    'Você já não anda no mesmo ritmo que antes. Seu deslocamento diminui em –3m e você não pode correr ou fazer investidas.'
  );

  const sonoRuim = compMap.get('sono_ruim');
  assert(sonoRuim, 'Sono Ruim deve existir');
  assert.equal(
    sonoRuim.desc,
    'Você acorda várias vezes no meio da noite, o que atrapalha seu descanso. Sua recuperação de PM e PV é sempre uma categoria pior. Se a condição de descanso já é ruim, você recupera apenas 1 PM e 1 PV, independentemente do seu nível. Se já recupera apenas 1 PM e 1 PV, não recupera nada!'
  );

  const velhaFerida = compMap.get('velha_ferida');
  assert(velhaFerida, 'Velha Ferida deve existir');
  assert.equal(
    velhaFerida.desc,
    'Você tem um machucado antigo, que nunca cicatrizou direito. Sempre que você sofre um acerto crítico, o multiplicador de dano aumenta em +1 e você fica fraco (mesmo que seja imune, cumulativo).'
  );
});

// 2. Simular lógica de concessão de poderes gerais da regra individual de complicações
function calcularPoderesComplicações(state: {
  age?: { enabled: boolean; band?: string; complications: string[] };
  complicacoesIndividual?: boolean;
  regrasCampanha?: { complicacoes?: boolean };
}) {
  const isIndividualActive = Boolean(
    state.complicacoesIndividual || state.regrasCampanha?.complicacoes
  );
  let indPowers = 0;
  const totalComps = (state.age?.complications || []).length;
  if (isIndividualActive) {
    if (!state.age?.enabled) {
      indPowers = totalComps >= 1 ? 1 : 0;
    } else if (state.age.band === 'adulto') {
      indPowers = totalComps >= 2 ? 1 : 0;
    } else {
      indPowers = totalComps > 0 ? 1 : 0;
    }
  }
  return indPowers;
}

test('Complicações T20: Regra Individual concede +1 poder geral', () => {
  // Caso A: Sem regras de idade, mas com complicação individual ativa e escolhida
  assert.equal(
    calcularPoderesComplicações({
      age: { enabled: false, complications: ['rabugento'] },
      complicacoesIndividual: true
    }),
    1,
    'Complicação individual sem regras de idade concede +1 poder geral'
  );

  // Caso B: Sem regras de idade, regra ativa mas nenhuma complicação escolhida
  assert.equal(
    calcularPoderesComplicações({
      age: { enabled: false, complications: [] },
      complicacoesIndividual: true
    }),
    0,
    'Regra ativa sem complicação escolhida não concede poder'
  );

  // Caso C: Adulto de Idade HA (tem complicação de idade) + complicação individual (2 no total)
  assert.equal(
    calcularPoderesComplicações({
      age: { enabled: true, band: 'adulto', complications: ['rabugento', 'sono_ruim'] },
      complicacoesIndividual: true
    }),
    1,
    'Segunda complicação no Adulto concede o poder da regra individual'
  );
});

test('Origens T20: Origem Regional em Modo Single (origem única)', () => {
  const regionalOrigins = JSON.parse(
    fs.readFileSync(path.join(root, 'dados/criador-regionalOrigins.json'), 'utf8')
  );
  assert(regionalOrigins.length > 0, 'Origens regionais devem existir');

  // Simular selectedRegionalOrigin em modo single
  function resolveRegionalOrigin(state: { origin: { mode: string; standard: string; regional: string } }) {
    if (state.origin.mode === 'single') {
      return regionalOrigins.find((o: any) => o.nome === state.origin.standard);
    }
    return regionalOrigins.find((o: any) => o.nome === state.origin.regional);
  }

  // 1. Quando o jogador escolhe uma origem regional como origem única:
  const stateSingleReg = {
    origin: {
      mode: 'single',
      standard: 'Tamalu',
      regional: ''
    }
  };
  const regFound = resolveRegionalOrigin(stateSingleReg);
  assert(regFound, 'Deve encontrar a origem regional quando selecionada no modo single');
  assert.equal(regFound.regiao, 'Khubar');

  // 2. Validação de fase: no modo single com regional, não exige os 2 benefícios da lista padrão
  function isOriginComplete(state: { origin: { mode: string; standard: string; regional: string; benefits: string[] } }) {
    const reg = resolveRegionalOrigin(state);
    const isSingleReg = state.origin.mode === 'single' && Boolean(reg);
    if (isSingleReg) return true;
    return Boolean(state.origin.standard && state.origin.benefits.length === 2);
  }

  assert.equal(
    isOriginComplete({ origin: { mode: 'single', standard: 'Tamalu', regional: '', benefits: [] } }),
    true,
    'Origem Regional em modo single é completa por si mesma sem exigir 2 benefícios da padrão'
  );
  assert.equal(
    isOriginComplete({ origin: { mode: 'single', standard: 'Acólito', regional: '', benefits: ['religiao'] } }),
    false,
    'Origem padrão em modo single ainda exige 2 benefícios'
  );
});

test('Complicações T20: Limite de multiseleção (Adulto + Regra de Complicações = 2)', () => {
  const faixas = JSON.parse(
    fs.readFileSync(path.join(root, 'dados/idade-faixas.json'), 'utf8')
  );

  function calcularLimiteComplicações(state: {
    age?: { enabled: boolean; band: string };
    complicacoesIndividual?: boolean;
  }) {
    const bandData = state.age?.enabled ? faixas[state.age.band] : null;
    const ageLimit = Number(bandData?.count || 0);
    const indLimit = state.complicacoesIndividual ? 1 : 0;
    return ageLimit + indLimit;
  }

  // Adulto (1 opcional) + Regra de complicações (1) = 2 complicações
  assert.equal(
    calcularLimiteComplicações({ age: { enabled: true, band: 'adulto' }, complicacoesIndividual: true }),
    2,
    'Adulto com regra de complicação individual permite multiseleção de 2 complicações'
  );

  // Adulto apenas com regras de idade = 1 complicação
  assert.equal(
    calcularLimiteComplicações({ age: { enabled: true, band: 'adulto' }, complicacoesIndividual: false }),
    1,
    'Adulto apenas com regra de idade permite 1 complicação'
  );

  // Sem regras de idade, apenas com regra de complicações = 1 complicação
  assert.equal(
    calcularLimiteComplicações({ age: { enabled: false, band: '' }, complicacoesIndividual: true }),
    1,
    'Sem regras de idade com regra de complicações permite 1 complicação'
  );

  // Maduro (2) + Regra de complicações (1) = 3 complicações
  assert.equal(
    calcularLimiteComplicações({ age: { enabled: true, band: 'maduro' }, complicacoesIndividual: true }),
    3,
    'Maduro com regra de complicações permite 3 complicações'
  );
});

test('Complicações T20: Progressão de poderes do Adulto (Já Vi Coisas: 1 complicação = 1 poder; +1 regra individual = 2 poderes)', () => {
  const faixas = JSON.parse(
    fs.readFileSync(path.join(root, 'dados/idade-faixas.json'), 'utf8')
  );

  function calcularTotalPoderesAdulto(state: {
    age?: { enabled: boolean; band: string; complications: string[] };
    complicacoesIndividual?: boolean;
    regrasCampanha?: { complicacoes?: boolean };
  }) {
    const isIndividualActive = Boolean(
      state.complicacoesIndividual || state.regrasCampanha?.complicacoes
    );
    const bandData = state.age?.enabled ? faixas[state.age.band] : null;
    const baseAgePowers = Number(bandData?.generalPowers || 0); // 1 para adulto

    const compsCount = (state.age?.complications || []).length;
    const ageLimit = Number(bandData?.count || 0);
    // Bônus da regra individual de complicações (se pegar além da complicação de idade)
    const indPowers = (isIndividualActive && compsCount > ageLimit) ? 1 : 0;

    return baseAgePowers + indPowers;
  }

  // 1. Adulto apenas com Já Vi Coisas (1 complicação de idade): 1 poder geral
  assert.equal(
    calcularTotalPoderesAdulto({
      age: { enabled: true, band: 'adulto', complications: ['rabugento'] },
      complicacoesIndividual: false
    }),
    1,
    'Adulto com Já Vi Coisas recebe 1 poder geral por 1 complicação de idade'
  );

  // 2. Adulto com Já Vi Coisas + Regra de Complicações (2 complicações): 2 poderes gerais!
  assert.equal(
    calcularTotalPoderesAdulto({
      age: { enabled: true, band: 'adulto', complications: ['rabugento', 'sono_ruim'] },
      complicacoesIndividual: true
    }),
    2,
    'Adulto com 2 complicações (idade + regra individual) recebe 2 poderes gerais'
  );
});

test('Poderes T20: Poderes de origem e concedidos não podem ser escolhidos novamente', () => {
  const generalPowers = [
    { id: 'sortudo', nome: 'Sortudo', categoria: 'destino' },
    { id: 'surto_heroico', nome: 'Surto Heroico', categoria: 'destino' },
    { id: 'vitalidade', nome: 'Vitalidade', categoria: 'destino' },
    { id: 'coragem_total', nome: 'Coragem Total', categoria: 'concedido' },
    { id: 'ataque_poderoso', nome: 'Ataque Poderoso', categoria: 'combate' }
  ];

  function filtrarPoderesDisponiveis(powerList: typeof generalPowers, ownedNamesSet: Set<string>, currentPowerId: string = '') {
    return powerList.filter(p => {
      const isCurrent = p.id === currentPowerId;
      if (!isCurrent && ownedNamesSet.has(p.nome.toLowerCase())) return false;
      return true;
    });
  }

  // Personagem pegou Sortudo na origem e Coragem Total na divindade
  const owned = new Set(['sortudo', 'coragem total']);

  const disponiveis = filtrarPoderesDisponiveis(generalPowers, owned);
  assert.equal(disponiveis.some(p => p.id === 'sortudo'), false, 'Sortudo já pego na origem NÃO deve aparecer');
  assert.equal(disponiveis.some(p => p.id === 'coragem_total'), false, 'Coragem Total já pego na divindade NÃO deve aparecer');
  assert.equal(disponiveis.some(p => p.id === 'surto_heroico'), true, 'Surto Heroico não adquirido DEVE aparecer');
  assert.equal(disponiveis.some(p => p.id === 'vitalidade'), true, 'Vitalidade não adquirido DEVE aparecer');
  assert.equal(disponiveis.some(p => p.id === 'ataque_poderoso'), true, 'Ataque Poderoso não adquirido DEVE aparecer');
});
