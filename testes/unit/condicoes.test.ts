import test from 'node:test';
import assert from 'node:assert/strict';
import { calcularPenalidadeCondicoesPericia } from '../../src/lib/t20/condicoes.ts';

test('Condições T20: Abalado aplica -2 em todas as perícias', () => {
  const rLuta = calcularPenalidadeCondicoesPericia(['Abalado'], 'luta', 'for');
  assert.equal(rLuta.penalidadeTotal, -2);
  assert.equal(rLuta.detalhes[0].condicao, 'Abalado');

  const rMisticismo = calcularPenalidadeCondicoesPericia(['Abalado'], 'misticismo', 'int');
  assert.equal(rMisticismo.penalidadeTotal, -2);

  const rPercepcao = calcularPenalidadeCondicoesPericia(['Abalado'], 'percepcao', 'sab');
  assert.equal(rPercepcao.penalidadeTotal, -2);
});

test('Condições T20: Apavorado substitui Abalado (-5 em perícias)', () => {
  const res = calcularPenalidadeCondicoesPericia(['Abalado', 'Apavorado'], 'reflexos', 'des');
  assert.equal(res.penalidadeTotal, -5);
  assert.equal(res.detalhes.length, 1);
  assert.equal(res.detalhes[0].condicao, 'Apavorado');
});

test('Condições T20: Fraco e Esmorecido afetam atributos respectivos', () => {
  // Fraco afeta For, Des, Con (-2)
  const rFor = calcularPenalidadeCondicoesPericia(['Fraco'], 'atletismo', 'for');
  assert.equal(rFor.penalidadeTotal, -2);

  // Fraco não afeta Int, Sab, Car
  const rInt = calcularPenalidadeCondicoesPericia(['Fraco'], 'conhecimento', 'int');
  assert.equal(rInt.penalidadeTotal, 0);

  // Esmorecido afeta Int, Sab, Car (-2)
  const rCar = calcularPenalidadeCondicoesPericia(['Esmorecido'], 'diplomacia', 'car');
  assert.equal(rCar.penalidadeTotal, -2);

  // Abalado + Fraco em Força acumula (-2 + -2 = -4)
  const rAmbos = calcularPenalidadeCondicoesPericia(['Abalado', 'Fraco'], 'fortitude', 'con');
  assert.equal(rAmbos.penalidadeTotal, -4);
});
