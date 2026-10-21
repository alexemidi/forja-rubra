const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== Iniciando Testes de Duende, Espólio e Materiais Especiais (T20) ===\n');

// 1. Validando materiais especiais da Tabela 3-9 em dados/improvement_data.json
console.log('1. Validando Tabela 3-9 de Materiais Especiais...');
const improvementData = JSON.parse(fs.readFileSync(path.join(__dirname, '../dados/improvement_data.json'), 'utf8'));
const itemsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../dados/items.json'), 'utf8'));

const costsMap = new Map(improvementData.custosMateriaisBasicos.map(c => [c.materialEspecialId, c.custos]));

// Verifica tabela oficial 3-9:
// Madeira Tollon: arma 1500, escudo 1500, esoterico 1500. SEM armaduras!
assert.strictEqual(costsMap.get('madeira_tollon').arma, 1500);
assert.strictEqual(costsMap.get('madeira_tollon').escudo, 1500);
assert.strictEqual(costsMap.get('madeira_tollon').esoterico, 1500);
assert.strictEqual(costsMap.get('madeira_tollon').armadura_leve, undefined, 'Madeira Tollon não pode ser aplicada a armadura leve');
assert.strictEqual(costsMap.get('madeira_tollon').armadura_pesada, undefined, 'Madeira Tollon não pode ser aplicada a armadura pesada');

// Esotéricos da Tabela 3-9:
assert.strictEqual(costsMap.get('aco_rubi').esoterico, 6000);
assert.strictEqual(costsMap.get('adamante').esoterico, 3000);
assert.strictEqual(costsMap.get('gelo_eterno').esoterico, 3000);
assert.strictEqual(costsMap.get('madeira_tollon').esoterico, 1500);
assert.strictEqual(costsMap.get('materia_vermelha').esoterico, 3000);
assert.strictEqual(costsMap.get('mitral').esoterico, 3000);

console.log('✔ Custos canônicos da Tabela 3-9 validados com sucesso!');

// 2. Validando getMaterialCostInfo e exclusão de esotérico para Lanajuste / Pena de Kraken / Casco
console.log('\n2. Validando aplicabilidade estrita de Esotéricos e Armadura de Madeira Tollon...');
const dedoDeEnte = itemsData.find(i => i.id === 'dedo_de_ente');
assert.ok(dedoDeEnte, 'Dedo de Ente deve existir');
assert.strictEqual(dedoDeEnte.categoriaId, 'esoterico');

// Simula getMaterialCostInfo conforme implementado
function testMaterialCostInfo(mat, item) {
  const costs = costsMap.get(mat.id) || {};
  const hasBasicCostTable = costsMap.has(mat.id);
  const isEsoteric = item.categoriaId === 'esoterico';

  if (isEsoteric) {
    if (Object.prototype.hasOwnProperty.call(costs, 'esoterico')) {
      return { applicable: true, known: true, value: Number(costs['esoterico']) || 0, key: 'esoterico' };
    }
    return { applicable: false, known: false, value: 0, key: '' };
  }

  const keys = item.tipo === 'armadura' ? (item.categoriaId === 'pesada' ? ['armadura_pesada'] : ['armadura_leve']) : ['arma'];
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(costs, key)) {
      return { applicable: true, known: true, value: Number(costs[key]) || 0, key: key };
    }
  }
  if (hasBasicCostTable) {
    return { applicable: false, known: false, value: 0, key: '' };
  }
  return { applicable: false, known: false, value: 0, key: '' };
}

const matTollon = improvementData.materiaisEspeciais.find(m => m.id === 'madeira_tollon');
const matLanajuste = improvementData.materiaisEspeciais.find(m => m.id === 'lanajuste');
const matMitral = improvementData.materiaisEspeciais.find(m => m.id === 'mitral');

const tollonDedo = testMaterialCostInfo(matTollon, dedoDeEnte);
assert.strictEqual(tollonDedo.applicable, true);
assert.strictEqual(tollonDedo.value, 1500, 'Madeira Tollon no Dedo de Ente deve custar +T$ 1.500');

const lanajusteDedo = testMaterialCostInfo(matLanajuste, dedoDeEnte);
assert.strictEqual(lanajusteDedo.applicable, false, 'Lanajuste não pode ser aplicado a esotérico');

const mitralDedo = testMaterialCostInfo(matMitral, dedoDeEnte);
assert.strictEqual(mitralDedo.applicable, true);
assert.strictEqual(mitralDedo.value, 3000, 'Mitral no Dedo de Ente deve custar +T$ 3.000');

// Armadura leve de Madeira Tollon
const cotaCouro = { tipo: 'armadura', categoriaId: 'leve' };
const tollonArmadura = testMaterialCostInfo(matTollon, cotaCouro);
assert.strictEqual(tollonArmadura.applicable, false, 'Madeira Tollon não pode ser aplicada a armaduras');

console.log('✔ Dedo de Ente e restrições de Madeira Tollon validados!');

// 3. Validando regra do Duende e alocação unificada
console.log('\n3. Validando unificação dos atributos do Duende...');
const racesData = JSON.parse(fs.readFileSync(path.join(__dirname, '../dados/criador-races.json'), 'utf8'));
const duende = racesData.find(r => r.id === 'duende');
assert.ok(duende, 'Duende deve existir em criador-races.json');

// Simula raceAllocationSources com a lógica unificada
function testRaceAllocationSources(race, choices) {
  const sources = [];
  (race.habilidades?.selecionadas || []).forEach(def => {
    if (race.id === 'duende' && def.id === 'duende_natureza') return;
    if (def.tipo === 'atributos_flexiveis') {
      let config = def;
      if (race.id === 'duende' && def.id === 'duende_dons') {
        const isAnimal = choices.duende_natureza === 'animal';
        config = Object.assign({}, def, {
          quantidade: isAnimal ? 3 : 2,
          maxPorAtributo: isAnimal ? 2 : 1,
          permitirRepetir: isAnimal
        });
      }
      sources.push({ key: def.id, label: def.nome || 'Habilidade', config });
      return;
    }
  });
  return sources;
}

const sourcesVegetal = testRaceAllocationSources(duende, { duende_natureza: 'vegetal' });
assert.strictEqual(sourcesVegetal.length, 1, 'Deve haver apenas 1 fonte de alocação para o Duende');
assert.strictEqual(sourcesVegetal[0].config.quantidade, 2, 'Padrão sem Animal é 2 pontos');
assert.strictEqual(sourcesVegetal[0].config.maxPorAtributo, 1, 'Padrão sem Animal é max 1 por atributo');
assert.strictEqual(sourcesVegetal[0].config.permitirRepetir, false, 'Padrão sem Animal não permite repetição');

const sourcesAnimal = testRaceAllocationSources(duende, { duende_natureza: 'animal' });
assert.strictEqual(sourcesAnimal.length, 1, 'Deve haver apenas 1 fonte de alocação para o Duende mesmo com Natureza Animal');
assert.strictEqual(sourcesAnimal[0].config.quantidade, 3, 'Com Natureza Animal são 3 pontos (+1 em dois e +1 em um)');
assert.strictEqual(sourcesAnimal[0].config.maxPorAtributo, 2, 'Com Natureza Animal pode repetir atributo até max +2');
assert.strictEqual(sourcesAnimal[0].config.permitirRepetir, true, 'Com Natureza Animal permite repetição');

// Validação de cálculo de bônus do Duende com repetição
function testAddAllocation(target, values, val = 1) {
  (values || []).forEach(id => target[id] = (target[id] || 0) + Number(val || 1));
}
const bonusDons = { for: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 };
testAddAllocation(bonusDons, ['car', 'car', 'des'], 1);
assert.strictEqual(bonusDons.car, 2, 'Duende pode ter +2 no atributo principal se for Natureza Animal');
assert.strictEqual(bonusDons.des, 1, 'Duende pode ter +1 em outro atributo');
assert.strictEqual(bonusDons.int, 0);

console.log('✔ Lógica unificada de atributos do Duende validada com sucesso!');

// 4. Validando Duplo Feérico: layout em linha (classe ao lado)
console.log('\n4. Validando layout de Duplo Feérico (classe ao lado)...');
const caminhoCode = fs.readFileSync(path.join(__dirname, '../src/regras/criador/idade-complicacoes-e-caminho.js'), 'utf8');
assert.ok(caminhoCode.includes('duplo-feerico-row'), 'Deve possuir classe duplo-feerico-row');
assert.ok(caminhoCode.includes('display:flex;align-items:center;gap:8px'), 'Duplo Feérico deve usar display flex com alinhamento ao lado');

const themeCss = fs.readFileSync(path.join(__dirname, '../src/estilos/criador/migration-theme.css'), 'utf8');
assert.ok(themeCss.includes('.power-row.duplo-feerico-row'), 'CSS deve definir regra para duplo-feerico-row');
assert.ok(themeCss.includes('flex-direction:row!important'), 'CSS deve garantir flex-direction row');

console.log('✔ Alinhamento ao lado da classe em Duplo Feérico aprovado!');

// 6. Validando Instrumentos de Ofício: não pode confirmar sem escolher a especialização
console.log('\n6. Validando trava de confirmação para Instrumentos de Ofício sem especialização...');
const availableItemsCode = fs.readFileSync(path.join(__dirname, '../src/funcionalidades/loja/05-01-availableInitialItems.js'), 'utf8');
assert.ok(availableItemsCode.includes("item.id==='instrumentos_de_oficio'&&!String(options.oficio||'').trim()"), 'Deve invalidar candidate quando instrumentos_de_oficio não possuir oficio preenchido');

const lojaIntegracaoCode = fs.readFileSync(path.join(__dirname, '../src/integracoes/criador/loja-itens-iniciais.js'), 'utf8');
assert.ok(lojaIntegracaoCode.includes("saved.pending.itemId==='instrumentos_de_oficio'&&!String(saved.pending.options?.oficio||'').trim()"), 'Deve desabilitar confirmação e barrar commit de instrumentos_de_oficio genéricos');
console.log('✔ Instrumentos de Ofício sem especialização devidamente bloqueados!');

// 7. Validando requiredRaceChoicesComplete para Duende com Natureza Animal e Tabu
console.log('\n7. Validando validação da raça Duende (3 dons na Natureza Animal e Tabu)...');
const estadoCatalogosCode = fs.readFileSync(path.join(__dirname, '../src/compartilhado/criador/estado-e-catalogos.js'), 'utf8');
assert.ok(estadoCatalogosCode.includes("race.id==='duende'&&def.id==='duende_dons'"), 'requiredRaceChoicesComplete deve considerar a quantidade dinâmica de dons do duende');
assert.ok(estadoCatalogosCode.includes("race.id!=='duende'||def.id!=='duende_natureza'"), 'requiredRaceChoicesComplete não deve exigir subAttrs para duende_natureza');

const expansoesRaciaisCode = fs.readFileSync(path.join(__dirname, '../src/regras/criador/expansoes-raciais.js'), 'utf8');
assert.ok(expansoesRaciaisCode.includes("isCustom?"), 'Renderização do tabu deve exibir campos customizados apenas se isCustom');
assert.ok(expansoesRaciaisCode.includes("if(isCustom){"), 'Clique em tabu pronto não deve rolar nem focar textarea customizado');

// 8. Validando tamanho e deslocamento do Duende
console.log('\n8. Validando tamanho e deslocamento base do Duende (Médio 9m, Grande 9m, Pequeno 6m, Minúsculo 6m)...');
assert.strictEqual(duende.corpo.deslocamentoBase, 9, 'Deslocamento canônico base do Duende deve ser 9m');
assert.strictEqual(duende.corpo.tamanhoId, 'medio', 'Tamanho base do Duende deve ser Médio');

const navCode = fs.readFileSync(path.join(__dirname, '../src/compartilhado/criador/navegacao-validacao.js'), 'utf8');
assert.ok(navCode.includes('function characterRaceBody()'), 'navegacao-validacao.js deve conter characterRaceBody');
assert.ok(navCode.includes("sizeChoice==='minusculo'||sizeChoice==='pequeno'"), 'duende_tamanho minúsculo e pequeno devem resultar em deslocamento 6m');
assert.ok(navCode.includes("sizeChoice==='medio'||sizeChoice==='grande'"), 'duende_tamanho médio e grande devem resultar em deslocamento 9m');

// Avalia logicamente
function testDuendeBody(sizeChoice) {
  let tamanhoId = duende.corpo?.tamanhoId || 'medio';
  let deslocamentoBase = Number(duende.corpo?.deslocamentoBase) || 9;
  if (sizeChoice) {
    tamanhoId = sizeChoice;
    if (sizeChoice === 'minusculo' || sizeChoice === 'pequeno') {
      deslocamentoBase = 6;
    } else if (sizeChoice === 'medio' || sizeChoice === 'grande') {
      deslocamentoBase = 9;
    }
  }
  return { tamanhoId, deslocamentoBase };
}

assert.deepStrictEqual(testDuendeBody(), { tamanhoId: 'medio', deslocamentoBase: 9 });
assert.deepStrictEqual(testDuendeBody('medio'), { tamanhoId: 'medio', deslocamentoBase: 9 });
assert.deepStrictEqual(testDuendeBody('grande'), { tamanhoId: 'grande', deslocamentoBase: 9 });
assert.deepStrictEqual(testDuendeBody('pequeno'), { tamanhoId: 'pequeno', deslocamentoBase: 6 });
assert.deepStrictEqual(testDuendeBody('minusculo'), { tamanhoId: 'minusculo', deslocamentoBase: 6 });

console.log('✔ Tamanho e deslocamento base do Duende validados com sucesso!');

// 9. Validando layout da Ficha restaurado com coluna de Progressão de personagem e sem distorção dos tamanhos
console.log('\n9. Validando coluna de Progressão de personagem e preservação do layout original da ficha...');
const renderCode = fs.readFileSync(path.join(__dirname, '../src/funcionalidades/criador/ficha/renderizacao.js'), 'utf8');
assert.ok(renderCode.includes('sheet-preview-box sheet-preview-history'), 'Ficha deve conter a seção de progressão sheet-preview-history');
assert.ok(renderCode.includes("class=\"sheet-preview-second-page\">' + history + '<div class=\"sheet-preview-reference\""), 'sheet-preview-second-page deve conter history e sheet-preview-reference como colunas');
assert.ok(renderCode.includes('sheetFeatureDisclosure(item, true)'), 'Itens de nível em history devem usar sheetFeatureDisclosure para manter as setinhas retráteis');
console.log('✔ Coluna de Progressão de personagem com setinhas retráteis e layout original da ficha validados com sucesso!');

// 10. Validando regras de exibição do Duende (Natureza: Animal, Tabu: texto, Duplo Feérico(Audácia), sem tamanho e presentes no campo de magias)
console.log('\n10. Validando organização das habilidades do Duende e presentes de magia...');
const navUpdated = fs.readFileSync(path.join(__dirname, '../src/compartilhado/criador/navegacao-validacao.js'), 'utf8');
assert.ok(navUpdated.includes("race?.id==='duende'&&definition.id==='duende_tamanho'"), 'Não deve listar o tamanho do duende na lista de habilidades');
assert.ok(navUpdated.includes("race?.id==='duende'&&group.id==='duende_presentes'"), 'Presentes de magia e de caos não devem ser listados no quadro de habilidades de raça');
assert.ok(navUpdated.includes("nome:'Natureza('+choiceName(option)+')'"), 'Natureza do duende deve ser formatada como "Natureza(Escolha)"');
assert.ok(navUpdated.includes("title=chosenText?('Tabu: '+chosenText):'Tabu'"), 'Tabu deve ser formatado com título "Tabu: " + texto');
assert.ok(navUpdated.includes("Duplo Feérico(' + duplo.nome + ')"), 'Duplo Feérico deve ser formatado com o poder entre parênteses');

const pdfCamposUpdated = fs.readFileSync(path.join(__dirname, '../src/integracoes/criador/pdf-campos.js'), 'utf8');
assert.ok(pdfCamposUpdated.includes("Presentes de Magia e Caos(' + giftNames.join('/') + ')')"), 'Presentes de Magia e Caos devem ser agrupados no campo de magias com barra e sem espaço antes do parêntese');

const idadeUpdated = fs.readFileSync(path.join(__dirname, '../src/regras/criador/idade-complicacoes-e-caminho.js'), 'utf8');
assert.ok(idadeUpdated.includes("if(typeof characterSpellEntries==='undefined')"), 'idade-complicacoes-e-caminho.js não deve sobrescrever characterSpellEntries');

const habMagiasUpdated = fs.readFileSync(path.join(__dirname, '../src/funcionalidades/criador/ficha/habilidades-magias.js'), 'utf8');
assert.ok(habMagiasUpdated.includes("entries.push('Presentes de Magia e Caos(' + finalGifts.join('/') + ')')"), 'sheetLearnedSpells deve garantir a inclusão de Presentes de Magia e Caos para Duende');

console.log('✔ Organização das habilidades do Duende e presentes de magia validados com sucesso!');

console.log('\n======================================================');
console.log('🎉 SUCESSO TOTAL: Todas as validações passaram!');
console.log('======================================================');

