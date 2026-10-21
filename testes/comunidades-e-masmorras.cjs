const assert = require('assert');
const RegrasComunidades = require('../src/regras/nucleo/comunidades.js');
const RegrasMasmorras = require('../src/regras/nucleo/masmorras.js');

console.log('=== Testes Puros de Comunidades (Ameaças de Arton / T20) ===');

// 1. Validando os 5 Tipos Canônicos de Comunidades
const tipos = ['aldeia', 'vila', 'cidade_media', 'cidade_grande', 'metropole'];
tipos.forEach(tipoId => {
  const com = RegrasComunidades.gerarComunidade(tipoId);
  assert(com, `Comunidade ${tipoId} deve ser gerada`);
  assert(com.tipo === tipoId, `Tipo deve corresponder a ${tipoId}`);
  assert(com.tamanhoGrid >= 1 && com.tamanhoGrid <= 5, `Grid deve estar entre 1 e 5`);
  assert(com.grid.length === com.tamanhoGrid, `Linhas da matriz devem ter tamanho ${com.tamanhoGrid}`);
  assert(com.grid[0].length === com.tamanhoGrid, `Colunas da matriz devem ter tamanho ${com.tamanhoGrid}`);
  assert(com.pontosDeInteresse.length > 0, `Deve possuir pontos de interesse`);
  assert(com.populacao > 0, `População deve ser positiva`);
  assert(com.guarda, `Guarda deve estar descrita`);
  assert(com.limiteCompraItem, `Limite de compra deve estar definido`);
  console.log(`✔ Comunidade ${com.tipoNome} (${com.gridDimensao}) validada com ${com.totalQuadros} quadros!`);
});

// 2. Validações Específicas de Aldeia (Grid 1x1)
const aldeia = RegrasComunidades.gerarComunidade('aldeia');
assert.strictEqual(aldeia.tamanhoGrid, 1, 'Aldeia deve ser 1x1');
assert.strictEqual(aldeia.totalQuadros, 1, 'Aldeia deve ter 1 quadro');
assert(aldeia.populacao <= 1000, 'Aldeia deve ter até 1.000 habitantes');

// 3. Validações Específicas de Vila (Grid 2x2)
const vila = RegrasComunidades.gerarComunidade('vila');
assert.strictEqual(vila.tamanhoGrid, 2, 'Vila deve ser 2x2');
assert.strictEqual(vila.totalQuadros, 4, 'Vila deve ter 4 quadros');
assert(vila.populacao <= 5000, 'Vila deve ter até 5.000 habitantes');

// 4. Validações Específicas de Metrópole (Grid 5x5)
const metropole = RegrasComunidades.gerarComunidade('metropole');
assert.strictEqual(metropole.tamanhoGrid, 5, 'Metrópole deve ser 5x5');
assert.strictEqual(metropole.totalQuadros, 25, 'Metrópole deve ter 25 quadros');
assert(metropole.limiteCompraItem.toLowerCase().includes('sem limite') || metropole.limiteCompraItem.includes('Infinity'), 'Metrópole não deve ter limite de compras comuns');

// 5. Validando Catálogo dos 40 Quadros Modulares
assert.strictEqual(RegrasComunidades.QUADROS_MODULARES.length, 40, 'Devem existir exatamente 40 quadros modulares canônicos');
RegrasComunidades.QUADROS_MODULARES.forEach((q, i) => {
  assert(q.id, `Quadro #${i} deve ter ID`);
  assert(q.nome, `Quadro #${i} deve ter nome`);
  assert(q.conectores, `Quadro #${i} deve ter conectores`);
  assert(['aberta', 'secundaria', 'fechada', 'muralha', 'rio'].includes(q.conectores.norte), `Conector norte válido`);
  assert(['aberta', 'secundaria', 'fechada', 'muralha', 'rio'].includes(q.conectores.sul), `Conector sul válido`);
  assert(['aberta', 'secundaria', 'fechada', 'muralha', 'rio'].includes(q.conectores.leste), `Conector leste válido`);
  assert(['aberta', 'secundaria', 'fechada', 'muralha', 'rio'].includes(q.conectores.oeste), `Conector oeste válido`);
  assert(Array.isArray(q.pontosDeInteresse) && q.pontosDeInteresse.length > 0, `Quadro #${i} deve ter pontos de interesse`);
});
console.log('✔ Todos os 40 quadros modulares validados com conexões cardeais e pontos de interesse!');

console.log('\n=== Testes Puros de Masmorras Modulares (T20) ===');

// 6. Validando Gerador de Masmorras
const portes = ['pequena', 'media', 'grande', 'epica'];
portes.forEach(porte => {
  const masm = RegrasMasmorras.gerarMasmorra({ porte, nd: 5 });
  assert(masm, `Masmorra do porte ${porte} deve ser gerada`);
  assert(masm.salas.length > 0, `Masmorra deve conter salas`);
  assert(masm.salas[0].isEntrada, `Primeira sala deve ser a entrada`);
  assert(masm.salas[masm.salas.length - 1].isChefe, `Última sala deve ser o chefe`);
  
  // Conexões de salas
  const todasTemConexoes = masm.salas.every(s => s.conexoes.length > 0);
  assert(todasTemConexoes, `Todas as salas devem ter ao menos uma passagem/conexão`);

  console.log(`✔ Masmorra ${masm.temaNome} (${masm.porte}) validada com ${masm.totalSalas} salas!`);
});

// 7. Validando Armadilhas por ND
assert(RegrasMasmorras.ARMADILHAS_CANONICAS.length >= 7, 'Deve ter catálogo de armadilhas canônicas');
RegrasMasmorras.ARMADILHAS_CANONICAS.forEach(arm => {
  assert(arm.cdPercepcao >= 10, 'CD de Percepção deve ser coerente');
  assert(arm.cdLadinagem >= 10, 'CD de Ladinagem deve ser coerente');
  assert(arm.dano, 'Armadilha deve ter fórmula de dano');
  assert(arm.gatilho, 'Armadilha deve ter gatilho especificado');
});
console.log('✔ Armadilhas canônicas balanceadas por ND validadas!');

console.log('\n🎉 Todas as regras de Comunidades e Masmorras foram 100% aprovadas!');
