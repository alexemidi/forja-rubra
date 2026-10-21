const assert = require('node:assert');
const CodigoCompartilhamentoItem = require('../src/regras/nucleo/codigo-compartilhamento.js');

console.log('=== Testes do Código de Compartilhamento de Itens T20 ===');

// 1. Item Mundano Convencional
const espadaMundana = {
  id: 'espada_longa',
  nome: 'Espada Longa',
  tipo: 'arma',
  categoriaId: 'armas'
};
const codEspada = CodigoCompartilhamentoItem.gerar(espadaMundana);
console.log('Código Espada Mundana:', codEspada);
assert.strictEqual(codEspada, 'T20:ARM:espada_longa:MUN:0:0', 'Código de item mundano incorreto');

// 2. Item Superior com Melhorias
const machadoSuperior = {
  id: 'machado_de_batalha',
  nome: 'Machado de Batalha',
  tipo: 'arma',
  improvements: [{ id: 'certeira' }, { id: 'pungente' }, { id: 'material_especial', materialId: 'mitral' }]
};
const codMachado = CodigoCompartilhamentoItem.gerar(machadoSuperior);
console.log('Código Machado Superior:', codMachado);
assert.strictEqual(codMachado, 'T20:ARM:machado_de_batalha:SUP:MEL.certeira.pungente.material_mitral:0', 'Código de item superior incorreto');

// 3. Item Mágico com Encantamento
const gibaoMagico = {
  id: 'gibao_de_peles',
  nome: 'Gibão de Peles',
  tipo: 'armadura',
  categoriaId: 'armaduras',
  enchantments: [{ id: 'defensora' }, { id: 'guardia' }]
};
const codGibao = CodigoCompartilhamentoItem.gerar(gibaoMagico);
console.log('Código Gibão Mágico:', codGibao);
assert.strictEqual(codGibao, 'T20:ARMAD:gibao_de_peles:MAG:0:ENC.defensora.guardia', 'Código de item mágico incorreto');

// 4. Item Específico (Menor / Médio / Maior)
const itemEspecificoMaior = {
  id: 'armadura_da_luz',
  nome: 'Armadura da Luz',
  tipo: 'especifico',
  categoriaId: 'especifico',
  isEspecifico: true,
  raridade: 'maior'
};
const codEspMaior = CodigoCompartilhamentoItem.gerar(itemEspecificoMaior);
console.log('Código Item Específico Maior:', codEspMaior);
assert.strictEqual(codEspMaior, 'T20:ESP:armadura_da_luz:ESP-MAI:0:0', 'Código de item específico maior incorreto');

// 5. Engenhoca Simples (Desvinculada)
const engenhocaSimples = {
  isEngenhoca: true,
  tipo: 'engenhoca',
  engenhocaInfo: {
    circulo: 1,
    pm: 1,
    spellId: 'adaga-mental',
    formaUso: 'empunhada'
  }
};
const codEngSimples = CodigoCompartilhamentoItem.gerar(null, engenhocaSimples);
console.log('Código Engenhoca Simples:', codEngSimples);
assert.strictEqual(codEngSimples, 'T20:ENG:CIR1:PM1:adaga-mental:empunhada', 'Código de engenhoca simples incorreto');

// 6. Engenhoca Acoplada em Item (ex: Traje ou Machado)
const engenhocaAcopladaTraje = {
  isEngenhoca: true,
  formaUso: 'vestida',
  attachedItem: {
    id: 'traje_de_viajante',
    nome: 'Traje de Viajante',
    tipo: 'vestuario',
    categoriaId: 'vestuario'
  },
  engenhocaInfo: {
    circulo: 1,
    pm: 1,
    spellId: 'adaga-mental',
    formaUso: 'vestida'
  }
};
const codEngTraje = CodigoCompartilhamentoItem.gerar(null, engenhocaAcopladaTraje);
console.log('Código Engenhoca Acoplada Traje:', codEngTraje);
assert.strictEqual(codEngTraje, 'T20:VEST:traje_de_viajante:MUN:0:0+T20:ENG:CIR1:PM1:adaga-mental:vestida', 'Código de engenhoca acoplada incorreto');

// 7. Interpretação Reversa (Decodificação)
const itemDecodificado = CodigoCompartilhamentoItem.interpretar(codEngTraje);
console.log('Item Decodificado:', itemDecodificado.nome, '| Tipo:', itemDecodificado.tipo, '| Forma:', itemDecodificado.formaUso);
assert(itemDecodificado.isEngenhoca, 'Deveria ser reconhecido como engenhoca');
assert.strictEqual(itemDecodificado.formaUso, 'vestida', 'Deveria ser forma vestida');
assert.strictEqual(itemDecodificado.attachedItem.id, 'traje_de_viajante', 'Item acoplado deveria ser traje_de_viajante');

console.log('🎉 Todos os testes de Código de Compartilhamento passaram com sucesso!');
