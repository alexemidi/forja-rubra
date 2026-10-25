import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  calcularKmPorDia,
  calcularDiasViagemTerrestre,
  gerarOpcoesDeslocamentoViagem
} = require('../../src/nucleo/viagem-deslocamento.ts');

test('Deslocamento e Marcha de Viagem: Velocidade diária canônica baseada no deslocamento (metros * 4 = km/dia)', () => {
  assert.equal(calcularKmPorDia(4.5), 18);
  assert.equal(calcularKmPorDia(6), 24);
  assert.equal(calcularKmPorDia(9), 36);
  assert.equal(calcularKmPorDia(12), 48); // +3m (+1 PM)
  assert.equal(calcularKmPorDia(15), 60); // +6m (+2 PM)
  assert.equal(calcularKmPorDia(18), 72); // +9m (+3 PM)
  assert.equal(calcularKmPorDia(21), 84); // +12m (+4 PM)
});

test('Deslocamento e Marcha de Viagem: Dias de viagem terrestre respeitando a velocidade diária selecionada', () => {
  const kmTotal = 72;
  // Base 9m (36 km/dia) -> 72 / 36 = 2 dias
  assert.equal(calcularDiasViagemTerrestre(kmTotal, 36), 2);

  // Com +3m (12m · 48 km/dia, 1 PM) -> 72 / 48 = 1.5 dias
  assert.equal(calcularDiasViagemTerrestre(kmTotal, 48), 1.5);

  // Com +9m (18m · 72 km/dia, 3 PM) -> 72 / 72 = 1 dia
  assert.equal(calcularDiasViagemTerrestre(kmTotal, 72), 1);
});

test('Deslocamento e Marcha de Viagem: Opções de velocidade para carroça e carruagem limitadas exatamente pelos PM do usuário', () => {
  // Para 3 PM disponíveis: deve conter base (9m) + 3 passos de +3m (12m, 15m, 18m)
  const opcoesCarroca = gerarOpcoesDeslocamentoViagem('carroca', 3);
  assert.equal(opcoesCarroca.length, 4);
  assert.deepEqual(opcoesCarroca[0], {
    deslocamentoMetros: 9,
    kmPorDia: 36,
    pmInvestidos: 0,
    rotulo: '9m · 36 km/dia (Base)'
  });
  assert.deepEqual(opcoesCarroca[1], {
    deslocamentoMetros: 12,
    kmPorDia: 48,
    pmInvestidos: 1,
    rotulo: '12m · 48 km/dia (+3m · 1 PM)'
  });
  assert.deepEqual(opcoesCarroca[2], {
    deslocamentoMetros: 15,
    kmPorDia: 60,
    pmInvestidos: 2,
    rotulo: '15m · 60 km/dia (+6m · 2 PM)'
  });
  assert.deepEqual(opcoesCarroca[3], {
    deslocamentoMetros: 18,
    kmPorDia: 72,
    pmInvestidos: 3,
    rotulo: '18m · 72 km/dia (+9m · 3 PM)'
  });

  // Mesmo comportamento para carruagem
  const opcoesCarruagem = gerarOpcoesDeslocamentoViagem('carruagem', 2);
  assert.equal(opcoesCarruagem.length, 3);
  assert.deepEqual(opcoesCarruagem.map((o: any) => o.deslocamentoMetros), [9, 12, 15]);
});

test('Deslocamento e Marcha de Viagem: Marcha a pé inclui opções menores (4.5m, 6m, 7.5m), base 9m e aumentos de +3m por PM', () => {
  const opcoesPe = gerarOpcoesDeslocamentoViagem('pe', 2);
  assert.deepEqual(opcoesPe.map((o: any) => o.deslocamentoMetros), [4.5, 6, 7.5, 9, 12, 15]);
});

test('Deslocamento e Marcha de Viagem: Se o usuário tiver 0 PM, só exibe as opções base sem aumentos mágicos', () => {
  const opcoesCarrocaZeroPm = gerarOpcoesDeslocamentoViagem('carroca', 0);
  assert.equal(opcoesCarrocaZeroPm.length, 1);
  assert.equal(opcoesCarrocaZeroPm[0].deslocamentoMetros, 9);

  const opcoesPeZeroPm = gerarOpcoesDeslocamentoViagem('pe', 0);
  assert.deepEqual(opcoesPeZeroPm.map((o: any) => o.deslocamentoMetros), [4.5, 6, 7.5, 9]);
});
