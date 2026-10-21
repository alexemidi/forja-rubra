import test from 'node:test';
import assert from 'node:assert/strict';
import {
  temPoderArmaduraMecanizada,
  limiteEngenhocasArmadura,
  podeAcoplarEngenhocaEmArmadura,
  acoplarEngenhocaEmArmadura,
  desacoplarEngenhocaDaArmadura,
  isEngenhocaAcopladaAtiva,
  CUSTO_ACOPLAMENTO_TIBAR,
  TEMPO_ACOPLAMENTO_DIAS
} from '../../src/lib/t20/armadura-mecanizada.ts';

test('Armadura Mecanizada: Detecção de poder canônico', () => {
  assert.equal(temPoderArmaduraMecanizada(null), false);
  assert.equal(temPoderArmaduraMecanizada({}), false);
  assert.equal(temPoderArmaduraMecanizada({ powers: [{ id: 'foco_em_arma' }] }), false);

  assert.equal(
    temPoderArmaduraMecanizada({
      powers: [{ id: 'inventor_armadura_mecanizada', nome: 'Armadura Mecanizada' }]
    }),
    true
  );

  assert.equal(
    temPoderArmaduraMecanizada({
      features: [{ id: 'armadura_mecanizada', nome: 'Armadura Mecanizada' }]
    }),
    true
  );

  assert.equal(
    temPoderArmaduraMecanizada({
      progression: [{ powerId: 'inventor_armadura_mecanizada' }]
    }),
    true
  );
});

test('Armadura Mecanizada: Limites canônicos por tipo de item', () => {
  // Armadura leve: 1
  const armaduraLeve = {
    id: 'gibao_de_peles',
    nome: 'Gibão de Peles',
    tipo: 'armadura',
    categoriaId: 'leve'
  };
  assert.equal(limiteEngenhocasArmadura(armaduraLeve), 1);

  const couraça = {
    id: 'couraca',
    nome: 'Couraça',
    tipo: 'armadura',
    armadura: { categoriaId: 'leve', defesa: 5, penalidade: -4 }
  };
  assert.equal(limiteEngenhocasArmadura(couraça), 1);

  // Armadura pesada: 3
  const armaduraPesada = {
    id: 'armadura_completa',
    nome: 'Armadura Completa',
    tipo: 'armadura',
    categoriaId: 'pesada'
  };
  assert.equal(limiteEngenhocasArmadura(armaduraPesada), 3);

  const cotaMalha = {
    id: 'cota_de_malha',
    nome: 'Cota de Malha',
    tipo: 'armadura',
    armadura: { categoriaId: 'pesada', defesa: 6, penalidade: -2 }
  };
  assert.equal(limiteEngenhocasArmadura(cotaMalha), 3);

  // Itens inválidos para acoplamento: limite 0
  const traje = { id: 'traje_viajante', nome: 'Traje de Viajante', tipo: 'vestuario', categoriaId: 'vestuario' };
  assert.equal(limiteEngenhocasArmadura(traje), 0);

  const escudo = { id: 'escudo_pesado', nome: 'Escudo Pesado', tipo: 'escudo', categoriaId: 'escudo' };
  assert.equal(limiteEngenhocasArmadura(escudo), 0);

  const espada = { id: 'espada_longa', nome: 'Espada Longa', tipo: 'arma', categoriaId: 'arma' };
  assert.equal(limiteEngenhocasArmadura(espada), 0);
});

test('Armadura Mecanizada: Custos canônicos de T$ 100 e 1 dia', () => {
  assert.equal(CUSTO_ACOPLAMENTO_TIBAR, 100);
  assert.equal(TEMPO_ACOPLAMENTO_DIAS, 1);
});

test('Armadura Mecanizada: Validação de acoplamento', () => {
  const charComPoder = { powers: [{ id: 'inventor_armadura_mecanizada' }] };
  const charSemPoder = { powers: [{ id: 'engenhoqueiro' }] };

  const armaduraLeve = { id: 'gibao', nome: 'Gibão', tipo: 'armadura', categoriaId: 'leve' };
  const armaduraPesada = { id: 'armadura_completa', nome: 'Armadura Completa', tipo: 'armadura', categoriaId: 'pesada' };
  const engenhoca1 = { id: 'eng_1', nome: 'Emissor de Raio do Enfraquecimento', isEngenhoca: true };
  const engenhoca2 = { id: 'eng_2', nome: 'Injetor de Curar Ferimentos', isEngenhoca: true };
  const engenhoca3 = { id: 'eng_3', nome: 'Disparador Sônico', isEngenhoca: true };
  const engenhoca4 = { id: 'eng_4', nome: 'Gerador Elétrico', isEngenhoca: true };
  const espada = { id: 'espada_longa', nome: 'Espada Longa', tipo: 'arma' };

  // Sem o poder
  const resSemPoder = podeAcoplarEngenhocaEmArmadura(charSemPoder, armaduraLeve, engenhoca1);
  assert.equal(resSemPoder.permitido, false);

  // Em item que não é armadura
  const resItemInvalido = podeAcoplarEngenhocaEmArmadura(charComPoder, espada as any, engenhoca1);
  assert.equal(resItemInvalido.permitido, false);

  // Em armadura leve: 1ª engenhoca permitida
  const resOk1 = podeAcoplarEngenhocaEmArmadura(charComPoder, armaduraLeve, engenhoca1);
  assert.equal(resOk1.permitido, true);

  // Acopla 1ª engenhoca na leve
  const { armorAtualizada: leveCom1 } = acoplarEngenhocaEmArmadura(armaduraLeve, engenhoca1);
  assert.equal(leveCom1.attachedContraptions?.length, 1);

  // Tentar colocar 2ª engenhoca na armadura leve -> Bloqueado!
  const resBloqLeve = podeAcoplarEngenhocaEmArmadura(charComPoder, leveCom1, engenhoca2);
  assert.equal(resBloqLeve.permitido, false);

  // Armadura pesada comporta até 3 engenhocas
  const { armorAtualizada: pesada1 } = acoplarEngenhocaEmArmadura(armaduraPesada, engenhoca1);
  assert.equal(pesada1.attachedContraptions?.length, 1);

  const { armorAtualizada: pesada2 } = acoplarEngenhocaEmArmadura(pesada1, engenhoca2);
  assert.equal(pesada2.attachedContraptions?.length, 2);

  const { armorAtualizada: pesada3 } = acoplarEngenhocaEmArmadura(pesada2, engenhoca3);
  assert.equal(pesada3.attachedContraptions?.length, 3);

  // 4ª engenhoca na pesada -> Bloqueado!
  const resBloqPesada = podeAcoplarEngenhocaEmArmadura(charComPoder, pesada3, engenhoca4);
  assert.equal(resBloqPesada.permitido, false);

  // Desacoplamento da armadura
  const { armorAtualizada: pesadaAposDesacoplar, engenhocaRemovida } = desacoplarEngenhocaDaArmadura(pesada3, 'eng_2');
  assert.equal(pesadaAposDesacoplar.attachedContraptions?.length, 2);
  assert.equal(engenhocaRemovida?.id, 'eng_2');
});

test('Armadura Mecanizada: Engenhocas acopladas contam como equipadas se a armadura estiver vestida', () => {
  const armaduraVestida = {
    id: 'armadura_completa',
    nome: 'Armadura Completa',
    tipo: 'armadura',
    categoriaId: 'pesada',
    attachedContraptions: [{ id: 'eng_1', nome: 'Emissor' }]
  };
  const engenhoca = { id: 'eng_1', nome: 'Emissor' };

  // Se armadura estiver vestida -> Ativa!
  assert.equal(isEngenhocaAcopladaAtiva(engenhoca, armaduraVestida, true), true);

  // Se armadura estiver guardada na mochila -> Inativa!
  assert.equal(isEngenhocaAcopladaAtiva(engenhoca, armaduraVestida, false), false);
});
