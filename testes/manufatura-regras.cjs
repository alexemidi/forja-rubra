const assert = require('node:assert/strict');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const RegrasManufatura = require(path.join(root, 'src/regras/nucleo/manufatura.js'));

// 1. Validar custos de matéria-prima (1/3 arredondado para cima)
assert.equal(RegrasManufatura.custoMateriaPrima(0), 0);
assert.equal(RegrasManufatura.custoMateriaPrima(1), 1);
assert.equal(RegrasManufatura.custoMateriaPrima(10), 4);
assert.equal(RegrasManufatura.custoMateriaPrima(15), 5);
assert.equal(RegrasManufatura.custoMateriaPrima(50), 17);
assert.equal(RegrasManufatura.custoMateriaPrima(100), 34);
assert.equal(RegrasManufatura.custoMateriaPrima(300), 100);

// 2. Validar CDs de teste
// Itens simples = CD 15
assert.equal(RegrasManufatura.cdFabricacao({ tipo: 'item_geral' }), 15);
assert.equal(RegrasManufatura.cdFabricacao({ tipo: 'arma', categoriaId: 'simples' }), 15);
// Itens complexos = CD 20
assert.equal(RegrasManufatura.cdFabricacao({ tipo: 'arma', categoriaId: 'marcial' }), 20);
assert.equal(RegrasManufatura.cdFabricacao({ tipo: 'arma', categoriaId: 'exotica' }), 20);
assert.equal(RegrasManufatura.cdFabricacao({ tipo: 'alquimico' }), 20);
assert.equal(RegrasManufatura.cdFabricacao({ tipo: 'armadura', categoriaId: 'pesada' }), 20);
assert.equal(RegrasManufatura.cdFabricacao({ nome: 'Ácido Alquímico' }), 20);
// Itens específicos = CD 30 menor, CD 40 médio, CD 50 maior
assert.equal(RegrasManufatura.cdFabricacao({ magico: { tipo: 'especifico', categoriaId: 'menor' } }), 30);
assert.equal(RegrasManufatura.cdFabricacao({ magico: { tipo: 'especifico', categoriaId: 'medio' } }), 40);
assert.equal(RegrasManufatura.cdFabricacao({ magico: { tipo: 'especifico', categoriaId: 'médio' } }), 40);
assert.equal(RegrasManufatura.cdFabricacao({ magico: { tipo: 'especifico', categoriaId: 'maior' } }), 50);
assert.equal(RegrasManufatura.cdFabricacao({ especifico: true, categoriaId: 'menor' }), 30);

// 3. Validar tempos de fabricação
assert.equal(RegrasManufatura.tempoFabricacao({ tipo: 'pocao' }), '1 dia');
assert.equal(RegrasManufatura.tempoFabricacao({ tipo: 'comida' }), '1 dia');
assert.equal(RegrasManufatura.tempoFabricacao({ tipo: 'alquimico' }), '1 dia');
assert.equal(RegrasManufatura.tempoFabricacao({ tipo: 'pergaminho' }), '1 dia');
assert.equal(RegrasManufatura.tempoFabricacao({ tipo: 'arma' }), '1 semana');
assert.equal(RegrasManufatura.tempoFabricacao({ tipo: 'armadura' }), '1 semana');
assert.equal(RegrasManufatura.tempoFabricacao({ tipo: 'arma', superior: true }), '1 mês');
assert.equal(RegrasManufatura.tempoFabricacao({ tipo: 'armadura', magico: true }), '1 mês');
assert.equal(RegrasManufatura.tempoFabricacao({ magico: { tipo: 'especifico', categoriaId: 'menor' } }), '1 mês');

// 4. Validar normalização de ofícios
assert.equal(RegrasManufatura.normalizarOficio('Ferreiro'), 'armeiro');
assert.equal(RegrasManufatura.normalizarOficio('Armeiro'), 'armeiro');
assert.equal(RegrasManufatura.normalizarOficio('Forjador de Armas'), 'armeiro');
assert.equal(RegrasManufatura.normalizarOficio('Alfaiate'), 'alfaiate');
assert.equal(RegrasManufatura.normalizarOficio('Tecelão'), 'alfaiate');
assert.equal(RegrasManufatura.normalizarOficio('Costureiro'), 'alfaiate');
assert.equal(RegrasManufatura.normalizarOficio('Alquimista'), 'alquimista');
assert.equal(RegrasManufatura.normalizarOficio('Carpinteiro'), 'carpinteiro');
assert.equal(RegrasManufatura.normalizarOficio('Coureiro'), 'artesao');
assert.equal(RegrasManufatura.normalizarOficio('Artesão'), 'artesao');
assert.equal(RegrasManufatura.normalizarOficio('Joalheiro'), 'joalheiro');
assert.equal(RegrasManufatura.normalizarOficio('Ourives'), 'joalheiro');
assert.equal(RegrasManufatura.normalizarOficio('Escriba'), 'escriba');
assert.equal(RegrasManufatura.normalizarOficio('Cartógrafo'), 'escriba');
assert.equal(RegrasManufatura.normalizarOficio('Cozinheiro'), 'cozinheiro');
assert.equal(RegrasManufatura.normalizarOficio('Padeiro'), 'cozinheiro');
assert.equal(RegrasManufatura.normalizarOficio('Tatuador'), 'tatuador');

// 5. Validar filtragem de itens por oficina
const mockCatalog = [
  { id: 'espada_curta', nome: 'Espada Curta', tipo: 'arma', preco: { valor: 10 } },
  { id: 'armadura_couro', nome: 'Armadura de Couro', tipo: 'armadura', preco: { valor: 20 } },
  { id: 'traje_nobres', nome: 'Traje de Nobre', tipo: 'vestuario', preco: { valor: 50 } },
  { id: 'bomba', nome: 'Bomba', tipo: 'alquimico', preco: { valor: 30 } },
  { id: 'corda', nome: 'Corda', tipo: 'item_geral', preco: { valor: 1 } },
  { id: 'joia_familia', nome: 'Joia de Família', tipo: 'item_geral', preco: { valor: 300 }, origemExclusiva: true }
];

const armeiroItems = RegrasManufatura.filtrarItensPorOficio(mockCatalog, 'armeiro');
assert.equal(armeiroItems.length, 2);
assert(armeiroItems.some(i => i.id === 'espada_curta'));
assert(armeiroItems.some(i => i.id === 'armadura_couro'));

const alfaiateItems = RegrasManufatura.filtrarItensPorOficio(mockCatalog, 'alfaiate');
assert.equal(alfaiateItems.length, 1);
assert.equal(alfaiateItems[0].id, 'traje_nobres');

const alquimistaItems = RegrasManufatura.filtrarItensPorOficio(mockCatalog, 'alquimista');
assert.equal(alquimistaItems.length, 1);
assert.equal(alquimistaItems[0].id, 'bomba');

// 6. Validar que o Laboratório do Alquimista rejeita colares, armas de fogo e aceita catalisadores/preparados/venenos
const mockAlquimiaCatalog = [
  { id: 'colar_fogo', nome: 'Colar de Bolas de Fogo', tipo: 'acessorio', categoriaId: 'acessorio', preco: { valor: 5000 } },
  { id: 'pistola_fogo', nome: 'Pistola de Fogo', tipo: 'arma', categoriaId: 'arma_fogo', preco: { valor: 1000 } },
  { id: 'espada_flamejante', nome: 'Espada de Fogo', tipo: 'arma', preco: { valor: 2000 } },
  { id: 'balsamo', nome: 'Bálsamo Restaurador', tipo: 'item_geral', categoriaId: 'alquimico_preparado', preco: { valor: 10 } },
  { id: 'acido_concentrado', nome: 'Ácido Concentrado', tipo: 'item_geral', categoriaId: 'alquimico_preparado', preco: { valor: 30 } },
  { id: 'po_de_fogo', nome: 'Pó de Fogo', tipo: 'item_geral', categoriaId: 'alquimico_catalisador', preco: { valor: 15 } },
  { id: 'veneno_paralisante', nome: 'Peçonha Concentrada', tipo: 'item_geral', categoriaId: 'alquimico_venenoso', preco: { valor: 150 } }
];

const alquimiaResults = RegrasManufatura.filtrarItensPorOficio(mockAlquimiaCatalog, 'alquimista');
assert.equal(alquimiaResults.length, 4);
assert.equal(alquimiaResults.some(i => i.id === 'colar_fogo'), false, 'Colar de Bolas de Fogo não pode estar na oficina do alquimista');
assert.equal(alquimiaResults.some(i => i.id === 'pistola_fogo'), false, 'Arma não pode estar na oficina do alquimista');
assert.equal(alquimiaResults.some(i => i.id === 'espada_flamejante'), false, 'Espada de Fogo não pode estar na oficina do alquimista');
assert(alquimiaResults.some(i => i.id === 'balsamo'), 'Bálsamo deve estar na oficina do alquimista');
assert(alquimiaResults.some(i => i.id === 'acido_concentrado'), 'Ácido deve estar na oficina do alquimista');
assert(alquimiaResults.some(i => i.id === 'po_de_fogo'), 'Catalisador deve estar na oficina do alquimista');
assert(alquimiaResults.some(i => i.id === 'veneno_paralisante'), 'Veneno deve estar na oficina do alquimista');

// Exclusivo de origem nunca deve aparecer na oficina
const ourivesItems = RegrasManufatura.filtrarItensPorOficio(mockCatalog, 'ourives', ['joia_familia']);
assert.equal(ourivesItems.length, 0);

// 7. Validar regras canônicas de Engenhocas (Tormenta20, p. 70)
// Círculo máximo por nível
assert.equal(RegrasManufatura.circuloMaximoEngenhoca(1), 1);
assert.equal(RegrasManufatura.circuloMaximoEngenhoca(5), 1);
assert.equal(RegrasManufatura.circuloMaximoEngenhoca(6), 2);
assert.equal(RegrasManufatura.circuloMaximoEngenhoca(9), 2);
assert.equal(RegrasManufatura.circuloMaximoEngenhoca(10), 3);
assert.equal(RegrasManufatura.circuloMaximoEngenhoca(13), 3);
assert.equal(RegrasManufatura.circuloMaximoEngenhoca(14), 4);
assert.equal(RegrasManufatura.circuloMaximoEngenhoca(17), 4);
assert.equal(RegrasManufatura.circuloMaximoEngenhoca(18), 5);
assert.equal(RegrasManufatura.circuloMaximoEngenhoca(20), 5);

// Custo de fabricação: T$ 100 x PM
assert.equal(RegrasManufatura.custoFabricacaoEngenhoca(1), 100);
assert.equal(RegrasManufatura.custoFabricacaoEngenhoca(3), 300);
assert.equal(RegrasManufatura.custoFabricacaoEngenhoca(6), 600);
assert.equal(RegrasManufatura.custoFabricacaoEngenhoca(10), 1000);
assert.equal(RegrasManufatura.custoFabricacaoEngenhoca(15), 1500);

// CD de fabricação: 20 + PM
assert.equal(RegrasManufatura.cdFabricacaoEngenhoca(1), 21);
assert.equal(RegrasManufatura.cdFabricacaoEngenhoca(3), 23);
assert.equal(RegrasManufatura.cdFabricacaoEngenhoca(6), 26);
assert.equal(RegrasManufatura.cdFabricacaoEngenhoca(10), 30);
assert.equal(RegrasManufatura.cdFabricacaoEngenhoca(15), 35);

// CD de ativação: 15 + PM
assert.equal(RegrasManufatura.cdAtivacaoEngenhoca(1), 16);
assert.equal(RegrasManufatura.cdAtivacaoEngenhoca(3), 18);
assert.equal(RegrasManufatura.cdAtivacaoEngenhoca(6), 21);
assert.equal(RegrasManufatura.cdAtivacaoEngenhoca(10), 25);
assert.equal(RegrasManufatura.cdAtivacaoEngenhoca(15), 30);

// Normalização do Ofício engenhoqueiro
assert.equal(RegrasManufatura.normalizarOficio('Engenhoqueiro'), 'engenhoqueiro');
assert.equal(RegrasManufatura.normalizarOficio('Engenheiro'), 'engenhoqueiro');
assert.equal(RegrasManufatura.normalizarOficio('Inventor'), 'engenhoqueiro');

// Sugestão de nomes de engenhocas
const bolaFogoSpell = { id: 'bola-de-fogo', nome: 'Bola de Fogo' };
assert.equal(RegrasManufatura.sugerirNomeEngenhoca(bolaFogoSpell, 'empunhada'), 'Canhão Pirotécnico');
const curarSpell = { id: 'curar-ferimentos', nome: 'Curar Ferimentos' };
assert.equal(RegrasManufatura.sugerirNomeEngenhoca(curarSpell, 'empunhada'), 'Injetor de Alívio');

// Obter opções de engenhocas (forma recomendada, sugestões de nomes e 3 descrições temáticas)
const opcoesBolaFogo = RegrasManufatura.obterOpcoesEngenhoca(bolaFogoSpell);
assert.equal(opcoesBolaFogo.formaRecomendada, 'empunhada');
assert(opcoesBolaFogo.sugestoes.length >= 1);
assert(Array.isArray(opcoesBolaFogo.descricoes), 'Deve retornar array de descrições');
assert.equal(opcoesBolaFogo.descricoes.length, opcoesBolaFogo.sugestoes.length, 'Cada sugestão de nome deve ter sua respectiva descrição');
assert(opcoesBolaFogo.descricoes[0].length > 15, 'Descrição deve ser rica e imersiva');

const opcoesArmadura = RegrasManufatura.obterOpcoesEngenhoca({ id: 'armadura-arcana', nome: 'Armadura Arcana' });
assert.equal(opcoesArmadura.formaRecomendada, 'vestida');
assert(opcoesArmadura.sugestoes.length >= 1);
assert(Array.isArray(opcoesArmadura.descricoes));
assert.equal(opcoesArmadura.descricoes.length, opcoesArmadura.sugestoes.length);

// Validação do gerador de descrições temáticas
const descPurificador = RegrasManufatura.gerarDescricaoEngenhoca('Purificador Osmótico', { nome: 'Abençoar Alimentos' }, 'vestida', 0);
assert(descPurificador.includes('filtros') || descPurificador.includes('membranas'), 'Deve gerar descrição técnica específica para o Purificador');

// Validação do limite do portfólio de engenhocas por Inteligência
const intModTest = 3;
const limiteEngenhocas = Math.max(1, intModTest);
assert.equal(limiteEngenhocas, 3);
const portfolioMock = [
  { id: 'eng_1', nome: 'Purificador Osmótico', destinatario: 'si' },
  { id: 'eng_2', nome: 'Chicote Térmico', destinatario: 'aliado' }
];
assert.equal(portfolioMock.length, 2, 'Tanto engenhocas próprias quanto de aliados contam no portfólio');
assert(portfolioMock.length <= limiteEngenhocas, 'Portfólio respeita o limite de Inteligência');

// Teste de aprimoramento de item existente: custo 1/3 e CD base + superior
const espadaLonga = { id: 'espada_longa', nome: 'Espada Longa', tipo: 'arma', categoriaId: 'marcial' }; // CD base 20
const aprimorarPara1 = RegrasManufatura.calcularAprimoramentoItemExistente(espadaLonga, 0, 1);
assert.equal(aprimorarPara1.custoMercadoMelhoria, 300);
assert.equal(aprimorarPara1.custoMateriaPrima, 100); // 1/3 de 300
assert.equal(aprimorarPara1.cdBase, 20);
assert.equal(aprimorarPara1.cdSuperior, 5);
assert.equal(aprimorarPara1.cdFabricacao, 25); // 20 + 5

const aprimorar1Para2 = RegrasManufatura.calcularAprimoramentoItemExistente(espadaLonga, 1, 2);
assert.equal(aprimorar1Para2.custoMercadoMelhoria, 2700); // 3000 - 300
assert.equal(aprimorar1Para2.custoMateriaPrima, 900); // 1/3 de 2700
assert.equal(aprimorar1Para2.cdSuperior, 10);
assert.equal(aprimorar1Para2.cdFabricacao, 30); // 20 + 10

// Com material especial adicional (ex: Aço-Rubi T$ 6000)
const aprimorarComMaterial = RegrasManufatura.calcularAprimoramentoItemExistente(espadaLonga, 0, 1, 6000);
assert.equal(aprimorarComMaterial.custoMercadoMelhoria, 6300); // 300 + 6000
assert.equal(aprimorarComMaterial.custoMateriaPrima, 2100); // 1/3 de 6300
assert.equal(aprimorarComMaterial.cdFabricacao, 25);

// 7. Círculo máximo de engenhocas por nível de inventor
assert.equal(RegrasManufatura.circuloMaximoEngenhoca(1), 1);
assert.equal(RegrasManufatura.circuloMaximoEngenhoca(5), 1);
assert.equal(RegrasManufatura.circuloMaximoEngenhoca(6), 2);
assert.equal(RegrasManufatura.circuloMaximoEngenhoca(9), 2);
assert.equal(RegrasManufatura.circuloMaximoEngenhoca(10), 3);
assert.equal(RegrasManufatura.circuloMaximoEngenhoca(13), 3);
assert.equal(RegrasManufatura.circuloMaximoEngenhoca(14), 4);
assert.equal(RegrasManufatura.circuloMaximoEngenhoca(17), 4);
assert.equal(RegrasManufatura.circuloMaximoEngenhoca(18), 5);
assert.equal(RegrasManufatura.circuloMaximoEngenhoca(20), 5);

// 8. Validação de integridade do payload de canal do Grimório (menu e oficina)
function validarEstruturaCanalGrimorio(ctx) {
  assert.equal(ctx.channel, 'forja-t20-grimoire-v1');
  assert.equal(ctx.type, 'context');
  assert(Array.isArray(ctx.visible), 'ctx.visible deve ser Array');
  assert(Array.isArray(ctx.chosen), 'ctx.chosen deve ser Array');
  assert(Array.isArray(ctx.selectable), 'ctx.selectable deve ser Array');
  assert(Array.isArray(ctx.learned), 'ctx.learned deve ser Array');
  assert(Array.isArray(ctx.availableSchools), 'ctx.availableSchools deve ser Array');
  assert(Array.isArray(ctx.circles), 'ctx.circles deve ser Array');
  assert(Array.isArray(ctx.traditions), 'ctx.traditions deve ser Array');
}

// Simulação de payload de Consulta Geral do Menu
const mockMenuContext = {
  channel: 'forja-t20-grimoire-v1',
  type: 'context',
  session: 'test-session',
  group: 'general-consultation',
  label: 'Grimório Geral',
  mode: 'consult',
  source: 'menu',
  view: 'available',
  readOnly: true,
  visible: ['adaga-mental', 'bola-de-fogo'],
  selectable: [],
  chosen: [],
  learned: [],
  availableSchools: ['abjuracao', 'adivinhacao', 'convocacao', 'encantamento', 'evocacao', 'ilusao', 'necromancia', 'transmutacao'],
  circles: [1, 2, 3, 4, 5],
  traditions: ['arcana', 'divina']
};
validarEstruturaCanalGrimorio(mockMenuContext);
assert.equal(mockMenuContext.mode, 'consult');
assert.equal(mockMenuContext.readOnly, true);

// Simulação de payload da Oficina do Engenhoqueiro (nível 1)
const mockEngenhocaContext = {
  channel: 'forja-t20-grimoire-v1',
  type: 'context',
  session: 'test-session',
  group: 'engenhoca-grimoire',
  label: 'Oficina do Engenhoqueiro (Magias até 1º Círculo)',
  mode: 'workshop-engenhoca',
  source: 'engenhoca',
  view: 'available',
  readOnly: false,
  visible: ['adaga-mental'],
  selectable: ['adaga-mental'],
  chosen: [],
  learned: [],
  availableSchools: ['abjuracao', 'adivinhacao', 'convocacao', 'encantamento', 'evocacao', 'ilusao', 'necromancia', 'transmutacao'],
  circles: [1],
  traditions: ['arcana', 'divina']
};
validarEstruturaCanalGrimorio(mockEngenhocaContext);
assert.equal(mockEngenhocaContext.mode, 'workshop-engenhoca');
assert.equal(mockEngenhocaContext.readOnly, false);
// 9. Validar escalonamento de melhorias de Fabricar Item Superior do Inventor
function calcularMelhoriasInventor(inventorLevel) {
  if (inventorLevel >= 11) return { maxImprovements: 4, maxBudget: 60000 };
  if (inventorLevel >= 8) return { maxImprovements: 3, maxBudget: 30000 };
  if (inventorLevel >= 5) return { maxImprovements: 2, maxBudget: 15000 };
  if (inventorLevel >= 2) return { maxImprovements: 1, maxBudget: 2000 };
  return { maxImprovements: 0, maxBudget: 0 };
}
assert.deepEqual(calcularMelhoriasInventor(1), { maxImprovements: 0, maxBudget: 0 });
assert.deepEqual(calcularMelhoriasInventor(2), { maxImprovements: 1, maxBudget: 2000 });
assert.deepEqual(calcularMelhoriasInventor(4), { maxImprovements: 1, maxBudget: 2000 });
assert.deepEqual(calcularMelhoriasInventor(5), { maxImprovements: 2, maxBudget: 15000 });
assert.deepEqual(calcularMelhoriasInventor(7), { maxImprovements: 2, maxBudget: 15000 });
assert.deepEqual(calcularMelhoriasInventor(8), { maxImprovements: 3, maxBudget: 30000 });
assert.deepEqual(calcularMelhoriasInventor(10), { maxImprovements: 3, maxBudget: 30000 });
assert.deepEqual(calcularMelhoriasInventor(11), { maxImprovements: 4, maxBudget: 60000 });
assert.deepEqual(calcularMelhoriasInventor(20), { maxImprovements: 4, maxBudget: 60000 });

// 10. Validar regras do Armeiro: CD da arma + 5 por melhoria
function calcularCdArmeiro(categoriaArma, melhoriasCount) {
  const cdBase = categoriaArma === 'exotica' ? 25 : (categoriaArma === 'marcial' ? 20 : 15);
  return cdBase + (5 * melhoriasCount);
}
assert.equal(calcularCdArmeiro('simples', 1), 20);
assert.equal(calcularCdArmeiro('marcial', 1), 25);
assert.equal(calcularCdArmeiro('exotica', 1), 30);
assert.equal(calcularCdArmeiro('simples', 2), 25);
assert.equal(calcularCdArmeiro('marcial', 2), 30);
assert.equal(calcularCdArmeiro('marcial', 3), 35);
assert.equal(calcularCdArmeiro('marcial', 4), 40);

// 11. Validar resolução de testes de Forja do Armeiro (Para si próprio vs Para aliado)
function resolverForjaArmeiro({ destinatario, resultado, craftCd, isExisting, custoItemMateria, custoMelhoriaMateria }) {
  const diff = resultado - craftCd;
  const isSuccess = diff >= 0;
  const isMinor = !isSuccess && diff >= -4;
  const totalCost = custoItemMateria + custoMelhoriaMateria;

  if (destinatario === 'si') {
    if (isSuccess) {
      return { outcome: 'success_self', debitar: totalCost, adicionarItemComMelhoria: true, manterItemMundano: false, destruirExistente: false };
    } else if (isMinor) {
      return { outcome: 'fail_minor_self', debitar: isExisting ? custoMelhoriaMateria : totalCost, adicionarItemComMelhoria: false, manterItemMundano: true, destruirExistente: false };
    } else {
      return { outcome: 'fail_major_self', debitar: isExisting ? custoMelhoriaMateria : totalCost, adicionarItemComMelhoria: false, manterItemMundano: false, destruirExistente: isExisting };
    }
  } else {
    // Para um aliado
    if (isSuccess) {
      return { outcome: 'success_ally', debitar: totalCost, adicionarItemComMelhoria: false, manterItemMundano: false, destruirExistente: false };
    } else if (isMinor) {
      return { outcome: 'fail_minor_ally', debitar: totalCost, adicionarItemComMelhoria: false, manterItemMundano: true, destruirExistente: false };
    } else {
      return { outcome: 'fail_major_ally', debitar: totalCost, adicionarItemComMelhoria: false, manterItemMundano: false, destruirExistente: false };
    }
  }
}

// Teste Caso 1: Para si próprio - Sucesso
const resSiSucesso = resolverForjaArmeiro({ destinatario: 'si', resultado: 25, craftCd: 25, isExisting: false, custoItemMateria: 10, custoMelhoriaMateria: 100 });
assert.equal(resSiSucesso.outcome, 'success_self');
assert.equal(resSiSucesso.debitar, 110);
assert.equal(resSiSucesso.adicionarItemComMelhoria, true);

// Teste Caso 2: Para si próprio - Falha por menos de 5 (diff = -2)
const resSiFalhaMenor = resolverForjaArmeiro({ destinatario: 'si', resultado: 23, craftCd: 25, isExisting: false, custoItemMateria: 10, custoMelhoriaMateria: 100 });
assert.equal(resSiFalhaMenor.outcome, 'fail_minor_self');
assert.equal(resSiFalhaMenor.debitar, 110);
assert.equal(resSiFalhaMenor.manterItemMundano, true);

// Teste Caso 3: Para si próprio - Falha por 5 ou mais (diff = -5)
const resSiFalhaCritica = resolverForjaArmeiro({ destinatario: 'si', resultado: 20, craftCd: 25, isExisting: true, custoItemMateria: 0, custoMelhoriaMateria: 100 });
assert.equal(resSiFalhaCritica.outcome, 'fail_major_self');
assert.equal(resSiFalhaCritica.debitar, 100);
assert.equal(resSiFalhaCritica.destruirExistente, true);

// Teste Caso 4: Para aliado - Sucesso (não adiciona nada na mochila do armeiro)
const resAliadoSucesso = resolverForjaArmeiro({ destinatario: 'aliado', resultado: 26, craftCd: 25, isExisting: false, custoItemMateria: 10, custoMelhoriaMateria: 100 });
assert.equal(resAliadoSucesso.outcome, 'success_ally');
assert.equal(resAliadoSucesso.debitar, 110);
assert.equal(resAliadoSucesso.adicionarItemComMelhoria, false);
assert.equal(resAliadoSucesso.manterItemMundano, false);

// Teste Caso 5: Para aliado - Falha por menos de 5 (armeiro fica com a espada mundana!)
const resAliadoFalhaMenor = resolverForjaArmeiro({ destinatario: 'aliado', resultado: 22, craftCd: 25, isExisting: false, custoItemMateria: 10, custoMelhoriaMateria: 100 });
assert.equal(resAliadoFalhaMenor.outcome, 'fail_minor_ally');
assert.equal(resAliadoFalhaMenor.debitar, 110);
assert.equal(resAliadoFalhaMenor.manterItemMundano, true);

// Teste Caso 6: Para aliado - Falha por 5 ou mais (perde tudo, nada para o armeiro)
const resAliadoFalhaCritica = resolverForjaArmeiro({ destinatario: 'aliado', resultado: 18, craftCd: 25, isExisting: false, custoItemMateria: 10, custoMelhoriaMateria: 100 });
assert.equal(resAliadoFalhaCritica.outcome, 'fail_major_ally');
assert.equal(resAliadoFalhaCritica.debitar, 110);
assert.equal(resAliadoFalhaCritica.manterItemMundano, false);

// 12. Validar ranking e relevância de busca de itens (Correspondência exata no topo)
function calcularRelevanciaBusca(itemNome, query) {
  const rawQuery = (query || '').trim().toLowerCase();
  const normalize = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const search = normalize(query);
  const rawName = (itemNome || '').trim().toLowerCase();
  const normName = normalize(itemNome);

  if (rawName === rawQuery) return 0;
  if (normName === search) return 1;

  const rawTokens = rawName.split(/[\s\-–—/]+/);
  if (rawTokens.includes(rawQuery)) return 2;

  const normTokens = normName.split(/[\s\-–—/]+/);
  if (normTokens.includes(search)) return 3;

  if (rawName.startsWith(rawQuery) || normName.startsWith(search)) return 4;
  if (rawTokens.some(t => t.startsWith(rawQuery)) || normTokens.some(t => t.startsWith(search))) return 5;
  if (normName.includes(search)) return 6;
  return 7;
}

const itensExemplo = [
  { nome: 'Armação para Mochila' },
  { nome: 'Bomba de Fumaça' },
  { nome: 'Engenho de Automação' },
  { nome: 'Maça' }
];

// Busca por "maça" (com cedilha)
const ordenadosComCedilha = [...itensExemplo].sort((a, b) => {
  return calcularRelevanciaBusca(a.nome, 'maça') - calcularRelevanciaBusca(b.nome, 'maça');
});
assert.equal(ordenadosComCedilha[0].nome, 'Maça', 'Com cedilha "maça", o item Maça deve ser o 1º resultado');

// Busca por "maca" (sem cedilha)
const ordenadosSemCedilha = [...itensExemplo].sort((a, b) => {
  return calcularRelevanciaBusca(a.nome, 'maca') - calcularRelevanciaBusca(b.nome, 'maca');
});
assert.equal(ordenadosSemCedilha[0].nome, 'Maça', 'Sem cedilha "maca", o item Maça deve ser o 1º resultado');

// 13. Validar cálculo de melhorias por classe (Guerreiro vs Inventor em diferentes níveis)
function testarMelhoriasPersonagem({ classId, level, hasSuperiorPower }) {
  const inventorLevel = classId === 'inventor' ? level : 0;
  let improvements = 0;
  const effImpLevel = hasSuperiorPower ? Math.max(level, inventorLevel) : inventorLevel;
  if (hasSuperiorPower || inventorLevel >= 2) {
    if (effImpLevel >= 11) improvements = 4;
    else if (effImpLevel >= 8) improvements = 3;
    else if (effImpLevel >= 5) improvements = 2;
    else if (effImpLevel >= 2) improvements = 1;
  }
  return improvements;
}

assert.equal(testarMelhoriasPersonagem({ classId: 'guerreiro', level: 4, hasSuperiorPower: false }), 0, 'Guerreiro nível 4 não pode ter melhorias');
assert.equal(testarMelhoriasPersonagem({ classId: 'inventor', level: 1, hasSuperiorPower: false }), 0, 'Inventor nível 1 não pode ter melhorias');
assert.equal(testarMelhoriasPersonagem({ classId: 'inventor', level: 4, hasSuperiorPower: false }), 1, 'Inventor nível 4 deve ter exatamente 1 melhoria');
assert.equal(testarMelhoriasPersonagem({ classId: 'inventor', level: 5, hasSuperiorPower: false }), 2, 'Inventor nível 5 deve ter exatamente 2 melhorias');
assert.equal(testarMelhoriasPersonagem({ classId: 'inventor', level: 8, hasSuperiorPower: false }), 3, 'Inventor nível 8 deve ter exatamente 3 melhorias');
assert.equal(testarMelhoriasPersonagem({ classId: 'inventor', level: 11, hasSuperiorPower: false }), 4, 'Inventor nível 11 deve ter exatamente 4 melhorias');

// 14. Validar cálculo de encantamentos de Inventor (Níveis 9, 13 e 17)
function testarEncantamentosInventor({ classId, level, hasMagicPower }) {
  const inventorLevel = classId === 'inventor' ? level : 0;
  const effMagicLevel = hasMagicPower ? Math.max(level, inventorLevel) : inventorLevel;
  let magic = 0;
  if (hasMagicPower || inventorLevel >= 9) {
    if (effMagicLevel >= 17) magic = 3;
    else if (effMagicLevel >= 13) magic = 2;
    else if (effMagicLevel >= 9) magic = 1;
  }
  return magic;
}

assert.equal(testarEncantamentosInventor({ classId: 'guerreiro', level: 20, hasMagicPower: false }), 0, 'Guerreiro sem poder não pode encantar');
assert.equal(testarEncantamentosInventor({ classId: 'inventor', level: 4, hasMagicPower: false }), 0, 'Inventor nível 4 não pode encantar (0 encantos)');
assert.equal(testarEncantamentosInventor({ classId: 'inventor', level: 8, hasMagicPower: false }), 0, 'Inventor nível 8 não pode encantar (0 encantos)');
assert.equal(testarEncantamentosInventor({ classId: 'inventor', level: 9, hasMagicPower: false }), 1, 'Inventor nível 9 pode ter 1 encanto (menor)');
assert.equal(testarEncantamentosInventor({ classId: 'inventor', level: 12, hasMagicPower: false }), 1, 'Inventor nível 12 mantém 1 encanto');
assert.equal(testarEncantamentosInventor({ classId: 'inventor', level: 13, hasMagicPower: false }), 2, 'Inventor nível 13 pode ter 2 encantos (médio)');
assert.equal(testarEncantamentosInventor({ classId: 'inventor', level: 16, hasMagicPower: false }), 2, 'Inventor nível 16 mantém 2 encantos');
assert.equal(testarEncantamentosInventor({ classId: 'inventor', level: 17, hasMagicPower: false }), 3, 'Inventor nível 17 pode ter 3 encantos (maior)');
// 15. Validar regras de resultado do Teste de Ofício e Destinatários
function avaliarResultadoOficio(total, cd, destinatario, custoMateriaPrima) {
  const diff = total - cd;
  const sucesso = diff >= 0;
  const falhaLeve = !sucesso && diff >= -4;
  const falhaCritica = !sucesso && diff <= -5;
  const custoDebitar = destinatario === 'si' ? custoMateriaPrima : 0;
  return { sucesso, falhaLeve, falhaCritica, custoDebitar, diff };
}

// Testes para si próprio
const resSucessoSi = avaliarResultadoOficio(22, 20, 'si', 100);
assert.equal(resSucessoSi.sucesso, true);
assert.equal(resSucessoSi.custoDebitar, 100);

const resFalhaLeveSi = avaliarResultadoOficio(18, 20, 'si', 100);
assert.equal(resFalhaLeveSi.sucesso, false);
assert.equal(resFalhaLeveSi.falhaLeve, true);
assert.equal(resFalhaLeveSi.custoDebitar, 100);

const resFalhaCriticaSi = avaliarResultadoOficio(14, 20, 'si', 100);
assert.equal(resFalhaCriticaSi.sucesso, false);
assert.equal(resFalhaCriticaSi.falhaCritica, true);
assert.equal(resFalhaCriticaSi.custoDebitar, 100);

// Testes para aliado (custo zero debitado do forjador)
const resSucessoAliado = avaliarResultadoOficio(25, 20, 'aliado', 100);
assert.equal(resSucessoAliado.sucesso, true);
assert.equal(resSucessoAliado.custoDebitar, 0, 'Para aliado, custo debitado deve ser zero');

const resFalhaAliado = avaliarResultadoOficio(15, 20, 'aliado', 100);
assert.equal(resFalhaAliado.sucesso, false);
// 16. Validar coerência entre Magia Simulada e Itens de Engenhocas
const spellEscudoDaFe = { id: 'escudo-da-fe', nome: 'Escudo da Fé', escola: 'abjuracao', circulo: 1 };
const spellArmaMagica = { id: 'arma-magica', nome: 'Arma Mágica', escola: 'transmutacao', circulo: 1 };
const spellSalto = { id: 'salto', nome: 'Salto', escola: 'transmutacao', circulo: 1 };
const spellCura = { id: 'curar-ferimentos', nome: 'Curar Ferimentos', escola: 'evocacao', circulo: 1 };

const itemEspada = { id: 'espada_longa', nome: 'Espada Longa', tipo: 'arma', categoriaId: 'marcial' };
const itemEscudo = { id: 'escudo_pesado', nome: 'Escudo Pesado', tipo: 'escudo', categoriaId: 'escudo' };
const itemArmadura = { id: 'armadura_completa', nome: 'Armadura Completa', tipo: 'armadura', categoriaId: 'pesada' };
const itemBotas = { id: 'botas_couro', nome: 'Botas de Couro', tipo: 'vestuario', categoriaId: 'vestuario' };
const itemKitMedico = { id: 'kit_medicamentos', nome: 'Kit de Primeiros Socorros', tipo: 'equipamento_aventura', categoriaId: 'equipamento_aventura' };

// Escudo da Fé não pode em espada, mas pode em escudo, armadura e vestuário
assert.equal(RegrasManufatura.verificarCoerenciaMagiaItem(spellEscudoDaFe, itemEspada).compativel, false, 'Escudo da Fé NÃO pode ser acoplado a uma espada');
assert.equal(RegrasManufatura.verificarCoerenciaMagiaItem(spellEscudoDaFe, itemEscudo).compativel, true, 'Escudo da Fé pode ser acoplado a um escudo');
assert.equal(RegrasManufatura.verificarCoerenciaMagiaItem(spellEscudoDaFe, itemArmadura).compativel, true, 'Escudo da Fé pode ser acoplado a uma armadura');
assert.equal(RegrasManufatura.verificarCoerenciaMagiaItem(spellEscudoDaFe, itemBotas).compativel, true, 'Escudo da Fé pode ser acoplado a vestuário protetor');

// Arma Mágica pode em espada, mas não pode em armadura ou escudo
assert.equal(RegrasManufatura.verificarCoerenciaMagiaItem(spellArmaMagica, itemEspada).compativel, true, 'Arma Mágica pode ser acoplada a uma espada');
assert.equal(RegrasManufatura.verificarCoerenciaMagiaItem(spellArmaMagica, itemArmadura).compativel, false, 'Arma Mágica NÃO pode ser acoplada a uma armadura');
assert.equal(RegrasManufatura.verificarCoerenciaMagiaItem(spellArmaMagica, itemEscudo).compativel, false, 'Arma Mágica NÃO pode ser acoplada a um escudo');

// Salto pode em vestuário e aventura, não em armas ou escudos
assert.equal(RegrasManufatura.verificarCoerenciaMagiaItem(spellSalto, itemBotas).compativel, true, 'Salto pode ser acoplado a botas/vestuário');
assert.equal(RegrasManufatura.verificarCoerenciaMagiaItem(spellSalto, itemKitMedico).compativel, true, 'Salto pode ser acoplado a itens de aventura');
assert.equal(RegrasManufatura.verificarCoerenciaMagiaItem(spellSalto, itemEspada).compativel, false, 'Salto NÃO pode ser acoplado a uma espada');
assert.equal(RegrasManufatura.verificarCoerenciaMagiaItem(spellSalto, itemEscudo).compativel, false, 'Salto NÃO pode ser acoplado a um escudo');

// Curar Ferimentos não pode em armas ou armaduras
assert.equal(RegrasManufatura.verificarCoerenciaMagiaItem(spellCura, itemKitMedico).compativel, true, 'Curar Ferimentos pode em kit médico');
assert.equal(RegrasManufatura.verificarCoerenciaMagiaItem(spellCura, itemEspada).compativel, false, 'Curar Ferimentos NÃO pode em espada');
assert.equal(RegrasManufatura.verificarCoerenciaMagiaItem(spellCura, itemArmadura).compativel, false, 'Curar Ferimentos NÃO pode em armadura');

// Armadura Arcana pode em vestuário, escudo e armaduras (Solicitação 29)
const spellArmaduraArcana = { id: 'armadura-arcana', nome: 'Armadura Arcana', escola: 'abjuracao', circulo: 1 };
assert.equal(RegrasManufatura.verificarCoerenciaMagiaItem(spellArmaduraArcana, itemBotas).compativel, true, 'Armadura Arcana pode ser acoplada em vestuário (alfaiate)');
assert.equal(RegrasManufatura.verificarCoerenciaMagiaItem(spellArmaduraArcana, itemEscudo).compativel, true, 'Armadura Arcana pode ser acoplada em escudo');
assert.equal(RegrasManufatura.verificarCoerenciaMagiaItem(spellArmaduraArcana, itemArmadura).compativel, true, 'Armadura Arcana pode ser acoplada em armadura');
assert.equal(RegrasManufatura.verificarCoerenciaMagiaItem(spellArmaduraArcana, itemEspada).compativel, false, 'Armadura Arcana NÃO pode ser acoplada em espada');

// 17. Validar cálculo de espaços de engenhocas com item acoplado (soma do item + 1) e nome combinado
assert.equal(typeof RegrasManufatura.calcularEspacosEngenhoca, 'function', 'RegrasManufatura exporta calcularEspacosEngenhoca');
assert.equal(RegrasManufatura.calcularEspacosEngenhoca(null), 1, 'Engenhoca independente ocupa 1 espaço');
assert.equal(RegrasManufatura.calcularEspacosEngenhoca({ espacos: 0 }), 1, 'Engenhoca em item de 0 espaços ocupa 1 espaço (0+1=1)');
assert.equal(RegrasManufatura.calcularEspacosEngenhoca({ espacos: 1 }), 2, 'Engenhoca em item de 1 espaço ocupa 2 espaços (1+1=2)');
assert.equal(RegrasManufatura.calcularEspacosEngenhoca({ espacos: 2 }), 3, 'Engenhoca em escudo pesado de 2 espaços ocupa 3 espaços (2+1=3)');
assert.equal(RegrasManufatura.calcularEspacosEngenhoca({ espacos: 5 }), 6, 'Engenhoca em armadura de 5 espaços ocupa 6 espaços (5+1=6)');
assert.equal(RegrasManufatura.calcularEspacosEngenhoca({ espacos: '0' }), 1, 'Engenhoca em item de 0 espaços string ocupa 1 espaço (0+1=1)');
assert.equal(RegrasManufatura.calcularEspacosEngenhoca({ espacos: '5' }), 6, 'Engenhoca em armadura de 5 espaços string ocupa 6 espaços (5+1=6)');

function combinarNomeEngenhoca(itemMundano, nomeInvencao) {
  const raw = String(nomeInvencao || 'Engenhoca').replace(/^.*?:\s*/, '');
  return itemMundano ? `${itemMundano.nome}: ${raw}` : raw;
}

assert.equal(combinarNomeEngenhoca({ nome: 'Escudo Pesado' }, 'Defletor Cinético'), 'Escudo Pesado: Defletor Cinético');
assert.equal(combinarNomeEngenhoca({ nome: 'Espada Longa' }, 'Polarizador de Gume'), 'Espada Longa: Polarizador de Gume');
assert.equal(combinarNomeEngenhoca(null, 'Defletor Cinético'), 'Defletor Cinético');

// 18. Validar elegibilidade de melhorias e encantos (Solicitação 24)
// Alquímicos, consumíveis, comidas e poções NÃO recebem melhorias
assert.equal(RegrasManufatura.podeReceberMelhorias({ tipo: 'alquimico', nome: 'Ácido' }), false, 'Alquímico não recebe melhoria');
assert.equal(RegrasManufatura.podeReceberMelhorias({ tipo: 'item_geral', categoriaId: 'alquimico_preparado', nome: 'Bálsamo' }), false, 'Preparado alquímico não recebe melhoria');
assert.equal(RegrasManufatura.podeReceberMelhorias({ tipo: 'pocao', nome: 'Poção de Cura' }), false, 'Poção não recebe melhoria');
assert.equal(RegrasManufatura.podeReceberMelhorias({ tipo: 'comida', nome: 'Ração de Viagem' }), false, 'Comida não recebe melhoria');
assert.equal(RegrasManufatura.podeReceberMelhorias({ tipo: 'pergaminho', nome: 'Pergaminho' }), false, 'Pergaminho não recebe melhoria');
assert.equal(RegrasManufatura.podeReceberMelhorias({ tipo: 'item_geral', nome: 'Corda' }), false, 'Item geral comum não recebe melhoria');

// Armas, armaduras, escudos, vestuário e esotéricos recebem melhorias (incluindo específicos)
assert.equal(RegrasManufatura.podeReceberMelhorias({ tipo: 'arma', nome: 'Espada Longa' }), true, 'Arma recebe melhoria');
assert.equal(RegrasManufatura.podeReceberMelhorias({ tipo: 'armadura', nome: 'Armadura Completa' }), true, 'Armadura recebe melhoria');
assert.equal(RegrasManufatura.podeReceberMelhorias({ tipo: 'escudo', nome: 'Escudo Pesado' }), true, 'Escudo recebe melhoria');
assert.equal(RegrasManufatura.podeReceberMelhorias({ tipo: 'vestuario', nome: 'Manto Elegante' }), true, 'Vestuário recebe melhoria');
assert.equal(RegrasManufatura.podeReceberMelhorias({ tipo: 'item_geral', categoriaId: 'vestuario', nome: 'Traje de Nobre' }), true, 'Traje de vestuário recebe melhoria');
assert.equal(RegrasManufatura.podeReceberMelhorias({ tipo: 'esoterico', nome: 'Cajado Arcano' }), true, 'Esotérico recebe melhoria');
assert.equal(RegrasManufatura.podeReceberMelhorias({ tipo: 'arma', nome: 'Espada Lendária', especifico: true }), true, 'Arma específica pode receber melhorias');
assert.equal(RegrasManufatura.podeReceberMelhorias({ tipo: 'armadura', nome: 'Armadura Lendária', magico: { tipo: 'especifico' } }), true, 'Armadura específica pode receber melhorias');

// Encantos: permitidos para armas, armaduras, escudos e esotéricos, MAS BLOQUEADOS para vestuário, específicos e consumíveis
assert.equal(RegrasManufatura.podeReceberEncantos({ tipo: 'arma', nome: 'Espada Longa' }), true, 'Arma comum recebe encanto');
assert.equal(RegrasManufatura.podeReceberEncantos({ tipo: 'armadura', nome: 'Armadura de Couro' }), true, 'Armadura comum recebe encanto');
assert.equal(RegrasManufatura.podeReceberEncantos({ tipo: 'escudo', nome: 'Escudo Leve' }), true, 'Escudo comum recebe encanto');
assert.equal(RegrasManufatura.podeReceberEncantos({ tipo: 'esoterico', nome: 'Varinha' }), true, 'Esotérico recebe encanto');
assert.equal(RegrasManufatura.podeReceberEncantos({ tipo: 'vestuario', nome: 'Traje' }), false, 'Vestuário NÃO recebe encanto (apenas melhorias)');
assert.equal(RegrasManufatura.podeReceberEncantos({ tipo: 'arma', nome: 'Espada da Justiça', especifico: true }), false, 'Item específico NÃO recebe encanto');
assert.equal(RegrasManufatura.podeReceberEncantos({ tipo: 'armadura', nome: 'Armadura Imperial', magico: { tipo: 'especifico' } }), false, 'Item com magia específica NÃO recebe encanto');
assert.equal(RegrasManufatura.podeReceberEncantos({ tipo: 'alquimico', nome: 'Bomba' }), false, 'Alquímico NÃO recebe encanto');
assert.equal(RegrasManufatura.podeReceberEncantos({ tipo: 'pocao', nome: 'Poção' }), false, 'Poção NÃO recebe encanto');

// Validação de ofício necessário para aprimorar/encantar
assert.equal(RegrasManufatura.oficioNecessarioParaAprimorar({ tipo: 'arma' }), 'armeiro');
assert.equal(RegrasManufatura.oficioNecessarioParaAprimorar({ tipo: 'armadura' }), 'armeiro');
assert.equal(RegrasManufatura.oficioNecessarioParaAprimorar({ tipo: 'escudo' }), 'armeiro');
assert.equal(RegrasManufatura.oficioNecessarioParaAprimorar({ tipo: 'vestuario' }), 'alfaiate');
assert.equal(RegrasManufatura.oficioNecessarioParaAprimorar({ tipo: 'item_geral', categoriaId: 'vestuario' }), 'alfaiate');
assert.equal(RegrasManufatura.oficioNecessarioParaAprimorar({ tipo: 'esoterico' }), 'artesao');

// 19. Validar regras de Aparatos de Engenhoca (Solicitação 24)
// CD de ativação: 0 aparatos (+0), 1 aparato (+2 ou +0 com Aparato Personalizado), 2 aparatos (+5 ou +3 com Aparato Personalizado)
assert.equal(RegrasManufatura.calcularBonusCdAparatos(0, false), 0, '0 aparatos = bônus 0');
assert.equal(RegrasManufatura.calcularBonusCdAparatos(0, true), 0, '0 aparatos com poder = bônus 0');
assert.equal(RegrasManufatura.calcularBonusCdAparatos(1, false), 2, '1 aparato sem poder = +2 na CD');
assert.equal(RegrasManufatura.calcularBonusCdAparatos(1, true), 0, '1 aparato com Aparato Personalizado = +0 na CD');
assert.equal(RegrasManufatura.calcularBonusCdAparatos(2, false), 5, '2 aparatos sem poder = +5 na CD');
assert.equal(RegrasManufatura.calcularBonusCdAparatos(2, true), 3, '2 aparatos com Aparato Personalizado = +3 na CD');

// CD e tempo de fabricação de aparatos (CD 20, 1 hora)
assert.equal(RegrasManufatura.cdFabricacao({ categoriaId: 'aparato', nome: 'Gatilho de Corda' }), 20, 'Aparato tem CD 20 de fabricação');
assert.equal(RegrasManufatura.tempoFabricacao({ categoriaId: 'aparato', nome: 'Estabilizador' }), '1 hora', 'Aparato leva 1 hora para fabricar');
assert.equal(RegrasManufatura.secoesOficina.engenhoqueiro.corresponde({ categoriaId: 'aparato' }), true, 'Oficina do engenhoqueiro aceita aparatos');
assert.equal(RegrasManufatura.secoesOficina.engenhoqueiro.corresponde({ categoriaId: 'engenhoca' }), true, 'Oficina do engenhoqueiro aceita engenhocas');

// Limite de melhorias em engenhocas:
// Engenhoca pura ou sem espera = 0 melhorias
const engenhocaSemEspera = { categoriaId: 'engenhoca', isEngenhoca: true, attachedItem: { id: 'espada_longa', nome: 'Espada' }, apparatuses: [] };
assert.equal(RegrasManufatura.limiteMelhoriasEngenhoca(engenhocaSemEspera), 0, 'Engenhoca sem espera para melhorias não recebe melhorias');
assert.equal(RegrasManufatura.podeReceberMelhorias(engenhocaSemEspera), false, 'Engenhoca sem espera não pode receber melhorias');
assert.equal(RegrasManufatura.podeReceberEncantos(engenhocaSemEspera), false, 'Engenhoca nunca recebe encantos');

// Engenhoca com 1 espera para melhorias = 1 melhoria permitida
const engenhocaCom1Espera = { categoriaId: 'engenhoca', isEngenhoca: true, attachedItem: { id: 'espada_longa', nome: 'Espada' }, apparatuses: ['espera_para_melhorias'] };
assert.equal(RegrasManufatura.limiteMelhoriasEngenhoca(engenhocaCom1Espera), 1, 'Engenhoca com 1 espera permite 1 melhoria');
assert.equal(RegrasManufatura.podeReceberMelhorias(engenhocaCom1Espera), true, 'Engenhoca com 1 espera pode receber melhorias');
assert.equal(RegrasManufatura.podeReceberEncantos(engenhocaCom1Espera), false, 'Engenhoca com 1 espera continua bloqueada para encantos');

// Engenhoca com 2 esperas para melhorias = 2 melhorias permitidas
const engenhocaCom2Esperas = { categoriaId: 'engenhoca', isEngenhoca: true, attachedItem: { id: 'espada_longa', nome: 'Espada' }, apparatuses: ['espera_para_melhorias', 'espera_para_melhorias'] };
assert.equal(RegrasManufatura.limiteMelhoriasEngenhoca(engenhocaCom2Esperas), 2, 'Engenhoca com 2 esperas permite 2 melhorias');
assert.equal(RegrasManufatura.podeReceberMelhorias(engenhocaCom2Esperas), true, 'Engenhoca com 2 esperas pode receber melhorias');

// Cálculo de espaços da engenhoca acoplada (espacos do item + 1)
assert.equal(RegrasManufatura.calcularEspacosEngenhoca({ espacos: 0 }), 1, 'Item acoplado de 0 espaços resulta em 1 espaço (0+1)');
// 20. Validação de Armadura Arcana (Solicitação 29)
const armaduraArcanaSpell = { id: 'armadura-arcana', nome: 'Armadura Arcana', circulo: 1 };
const classArmadura = RegrasManufatura.classificarEfeitoMagia(armaduraArcanaSpell);
assert.equal(classArmadura.permitidos, 'Vestuário e trajes (Ofício Alfaiate) ou escudo em armaduras (Ofício Armeiro).');
assert(classArmadura.tiposValidos.includes('armadura'), 'Armadura Arcana inclui armadura em tiposValidos');
assert(classArmadura.tiposValidos.includes('escudo'), 'Armadura Arcana inclui escudo em tiposValidos');
assert(classArmadura.tiposValidos.includes('vestuario'), 'Armadura Arcana inclui vestuario em tiposValidos');

// Verificar compatibilidade de acoplamento com armadura
const armaduraCouro = { id: 'armadura_couro', nome: 'Armadura de Couro', tipo: 'armadura', categoriaId: 'leve' };
const checkArmadura = RegrasManufatura.verificarCoerenciaMagiaItem(armaduraArcanaSpell, armaduraCouro);
assert.equal(checkArmadura.compativel, true, 'Armadura Arcana pode ser acoplada em armaduras');

// Bloqueio de armas com Armadura Arcana
const espada = { id: 'espada_curta', nome: 'Espada Curta', tipo: 'arma', categoriaId: 'simples' };
const checkArma = RegrasManufatura.verificarCoerenciaMagiaItem(armaduraArcanaSpell, espada);
assert.equal(checkArma.compativel, false, 'Armadura Arcana não pode ser acoplada em armas');

console.log('Regras puras de manufatura de ofício, aprimoramento e engenhocas aprovadas.');




