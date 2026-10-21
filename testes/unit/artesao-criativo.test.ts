import test from 'node:test';
import assert from 'node:assert/strict';
import {
  temPoderArtesaoCriativo,
  isOficioConsideradoTreinado,
  satisfazPreRequisitoOficio,
  expandirOficiosTreinados,
  TODOS_OFICIOS_CANONICOS,
  normalizarChaveOficio
} from '../../src/lib/t20/artesao-criativo.ts';

test('Artesão Criativo: Detecção do poder', () => {
  assert.equal(temPoderArtesaoCriativo(null), false);
  assert.equal(temPoderArtesaoCriativo({}), false);

  const charComId = {
    progression: [{ powerId: 'inventor_artesao_criativo' }]
  };
  assert.equal(temPoderArtesaoCriativo(charComId), true);

  const charComNome = {
    powers: [{ nome: 'Artesão Criativo' }]
  };
  assert.equal(temPoderArtesaoCriativo(charComNome), true);

  const charComString = ['artesao_criativo'];
  assert.equal(temPoderArtesaoCriativo(charComString), true);
});

test('Artesão Criativo: É considerado treinado em todos os ofícios', () => {
  const charComPoder = {
    progression: [{ powerId: 'inventor_artesao_criativo' }]
  };
  const charSemPoder = {
    progression: []
  };

  // Sem poder: não é treinado se não estiver na lista
  assert.equal(isOficioConsideradoTreinado('armeiro', charSemPoder, ['oficio:artesao']), false);
  assert.equal(isOficioConsideradoTreinado('alquimista', charSemPoder, ['oficio:artesao']), false);
  assert.equal(isOficioConsideradoTreinado('artesao', charSemPoder, ['oficio:artesao']), true);

  // Com poder: considerado treinado em todos os ofícios
  for (const oficio of TODOS_OFICIOS_CANONICOS) {
    assert.equal(
      isOficioConsideradoTreinado(oficio, charComPoder),
      true,
      `Deveria ser considerado treinado em ${oficio}`
    );
    assert.equal(
      isOficioConsideradoTreinado(`oficio:${oficio}`, charComPoder),
      true,
      `Deveria ser considerado treinado em oficio:${oficio}`
    );
  }
});

test('Artesão Criativo: Satisfaz qualquer pré-requisito de Ofício', () => {
  const charComPoder = {
    progression: [{ powerId: 'inventor_artesao_criativo' }]
  };
  const charSemPoder = {
    progression: []
  };

  // Sem poder: falha em pré-requisitos de outros ofícios
  assert.equal(satisfazPreRequisitoOficio('oficio:armeiro', charSemPoder, ['oficio:artesao']), false);
  assert.equal(satisfazPreRequisitoOficio('oficio:alquimista', charSemPoder, ['oficio:artesao']), false);

  // Com poder: cumpre qualquer pré-requisito de ofício
  assert.equal(satisfazPreRequisitoOficio('oficio:armeiro', charComPoder), true);
  assert.equal(satisfazPreRequisitoOficio('oficio:alquimista', charComPoder), true);
  assert.equal(satisfazPreRequisitoOficio('oficio:culinaria', charComPoder), true);
  assert.equal(satisfazPreRequisitoOficio('oficio:engenhoqueiro', charComPoder), true);
  assert.equal(satisfazPreRequisitoOficio('oficio', charComPoder), true);
});

test('Artesão Criativo: Expansão de acesso a todas as oficinas', () => {
  const baseTrained = ['Artesão'];
  const charComPoder = {
    progression: [{ powerId: 'inventor_artesao_criativo' }]
  };
  const charSemPoder = {
    progression: []
  };

  // Sem poder: apenas a base
  const resultSem = expandirOficiosTreinados(baseTrained, charSemPoder);
  assert.equal(resultSem.length, 1);
  assert.equal(resultSem[0], 'Artesão');

  // Com poder: expandido para todos os ofícios canônicos
  const resultCom = expandirOficiosTreinados(baseTrained, charComPoder);
  assert(resultCom.length >= TODOS_OFICIOS_CANONICOS.length);
  assert(resultCom.some(o => normalizarChaveOficio(o) === 'armeiro'));
  assert(resultCom.some(o => normalizarChaveOficio(o) === 'alquimista'));
  assert(resultCom.some(o => normalizarChaveOficio(o) === 'engenhoqueiro'));
  assert(resultCom.some(o => normalizarChaveOficio(o) === 'alfaiate'));
});
