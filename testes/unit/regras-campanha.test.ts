/**
 * Testes Unitários: Regras da Campanha e Idade do Livro Básico (Tormenta 20)
 */

import assert from 'node:assert/strict';
import {
  REGRAS_CAMPANHA_PADRAO,
  MODIFICADORES_IDADE_BASICO,
  obterRegrasCampanha,
  atualizarRegrasCampanha,
  modificadoresIdade
} from '../../src/lib/t20/regras-campanha.ts';

// 1. Validar valores padrão canônicos da Forja Rubra
assert.equal(REGRAS_CAMPANHA_PADRAO.devocoesAbertas, true, 'Devoções Abertas deve ser a única regra habilitada por padrão');
assert.equal(REGRAS_CAMPANHA_PADRAO.idade, 'desativada', 'Regras de idade devem começar desativadas por padrão');
assert.equal(REGRAS_CAMPANHA_PADRAO.racasAbertas, false, 'Raças Abertas deve começar desabilitada por padrão');
assert.equal(REGRAS_CAMPANHA_PADRAO.complicacoes, false, 'Complicações deve começar desabilitada por padrão');
assert.equal(REGRAS_CAMPANHA_PADRAO.origemModo, 'single', 'Modo de origem padrão deve ser uma só');

// 2. Validar modificadores cumulativos de idade do Livro Básico
assert.deepEqual(MODIFICADORES_IDADE_BASICO.adulto, { for: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 });
assert.deepEqual(MODIFICADORES_IDADE_BASICO.maduro, { for: -1, des: -1, con: -1, int: 1, sab: 1, car: 1 });
// Velho: cumulativo com maduro => For -3, Des -3, Con -3, Int +2, Sab +2, Car +2
assert.deepEqual(MODIFICADORES_IDADE_BASICO.velho, { for: -3, des: -3, con: -3, int: 2, sab: 2, car: 2 });

// 3. Validar inicialização em estado vazio
const mockState: any = {
  identity: {},
  origin: {},
  deity: {},
  age: {}
};
const regras = obterRegrasCampanha(mockState);
assert.equal(regras.devocoesAbertas, true);
assert.equal(regras.idade, 'desativada');

// 4. Validar ativação da idade do Livro Básico
atualizarRegrasCampanha(mockState, { idade: 'basico', faixaBasico: 'maduro' });
assert.equal(mockState.regrasCampanha.idade, 'basico');
const modsMaduro = modificadoresIdade(mockState);
assert.equal(modsMaduro.for, -1);
assert.equal(modsMaduro.int, 1);

atualizarRegrasCampanha(mockState, { idade: 'basico', faixaBasico: 'velho' });
const modsVelho = modificadoresIdade(mockState);
assert.equal(modsVelho.for, -3);
assert.equal(modsVelho.des, -3);
assert.equal(modsVelho.con, -3);
assert.equal(modsVelho.int, 2);
assert.equal(modsVelho.sab, 2);
assert.equal(modsVelho.car, 2);

console.log('✔ Todos os testes de Regras da Campanha e Idade Básica passaram com sucesso!');
