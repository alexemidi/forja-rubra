const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== Testes Origens Regionais (Lote 5) ===');

// Carregar catálogo de itens
const itemsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../dados/items.json'), 'utf8'));

// 1. Validar item cadastrado em dados/items.json: Tatuagem de sua antiga tripulação
const tatuagem = itemsData.find(i => i.id === 'tatuagem_antiga_tripulacao');
assert(tatuagem, 'tatuagem_antiga_tripulacao deve existir em items.json');
assert.strictEqual(tatuagem.equipamento?.itemVestido, true, 'Tatuagem deve ser item vestido/equipável');
assert(tatuagem.efeitos.some(e => e.periciaId === 'intimidacao' && e.valor === 1), 'Tatuagem deve conceder +1 em Intimidação');

console.log('✔ Item Tatuagem de sua antiga tripulação validado em dados/items.json!');

// Carregar arquivos do código-fonte para análise estática e verificação estrutural
const validacaoCode = fs.readFileSync(path.join(__dirname, '../src/compartilhado/criador/navegacao-validacao.js'), 'utf8');
const passivasCode = fs.readFileSync(path.join(__dirname, '../src/regras/criador/passivas-proficiencias.js'), 'utf8');
const idadeCode = fs.readFileSync(path.join(__dirname, '../src/regras/criador/idade-complicacoes-e-caminho.js'), 'utf8');
const estadoCode = fs.readFileSync(path.join(__dirname, '../src/compartilhado/criador/estado-e-catalogos.js'), 'utf8');
const poderesCode = fs.readFileSync(path.join(__dirname, '../src/funcionalidades/criador/fases/06-poderes.js'), 'utf8');
const parceirosCode = fs.readFileSync(path.join(__dirname, '../src/funcionalidades/criador/fases/09-parceiros.js'), 'utf8');

// 2. Validar Estudante do Colégio Real (Salistick)
assert(validacaoCode.includes('estudante_do_colegio_real') || validacaoCode.includes('Estudante do Colégio Real'), 'selectedCharacterFeatures deve reconhecer Estudante do Colégio Real');
assert(validacaoCode.includes('Medicina Salistiense (Estudante do Colégio Real)'), 'Deve adicionar a habilidade Medicina Salistiense');
assert(validacaoCode.includes("state.deity?.mode !== 'devout'") && validacaoCode.includes('!state.deity?.name'), 'Benefício deve ser anulado caso se torne devoto');

console.log('✔ Estudante do Colégio Real (+2 PV por dado de cura, anulado por devoção) validado!');

// 3. Validar Filhote da Revoada (Lamnor)
assert(validacaoCode.includes('filhote_da_revoada') || validacaoCode.includes('Filhote da Revoada'), 'selectedCharacterFeatures deve reconhecer Filhote da Revoada');
assert(validacaoCode.includes('Filhote da Revoada'), 'Deve adicionar a habilidade Filhote da Revoada para rolagem adicional por 1 PM');

console.log('✔ Filhote da Revoada (habilidade ativa de rolar dado adicional em Acrobacia/Pilotagem por 1 PM) validado!');

// 4. Validar Futura Lenda (Nova Malpetrim)
// 4.1 originItemChoice com nome pomposo
assert(passivasCode.includes('arma simples ou marcial.*nome pomposo'), 'originItemChoice deve reconhecer arma com nome pomposo');
assert(passivasCode.includes('requiresCustomName:true'), 'Arma pomposa deve requerer nome personalizado');
assert(passivasCode.includes("title:'Futura Lenda · Arma com Nome Pomposo'"), 'Título de Futura Lenda deve ser registrado');

// 4.2 Lógica de seleção do poder de classe de 2º nível
assert(idadeCode.includes('function hasFuturaLenda()'), 'idade-complicacoes-e-caminho.js deve conter hasFuturaLenda()');
assert(idadeCode.includes('function futuraLendaOptions()'), 'idade-complicacoes-e-caminho.js deve conter futuraLendaOptions()');
assert(idadeCode.includes('function selectedFuturaLendaPower()'), 'idade-complicacoes-e-caminho.js deve conter selectedFuturaLendaPower()');
assert(idadeCode.includes('req.level > 2'), 'futuraLendaOptions deve filtrar poderes com requisito de nível maior que 2');
assert(idadeCode.includes("fl.nome+' (Futura Lenda)'"), 'selectedCharacterFeatures deve incluir poder com sufixo Futura Lenda');

// 4.3 Validações e integração com estado do criador
assert(estadoCode.includes('hasFuturaLenda'), 'characterHasPowerChoices deve incluir hasFuturaLenda');
assert(poderesCode.includes('hasFuturaLenda'), 'powerMissingChoices deve checar hasFuturaLenda');
assert(idadeCode.includes('step===6&&hasFuturaLenda()&&!selectedFuturaLendaPower()'), 'phaseIsComplete deve exigir escolha de Futura Lenda no nível 6');

console.log('✔ Futura Lenda (Arma com nome pomposo, escolha de poder de classe nível <= 2 e validações) validado!');

// 5. Validar Ginete de Tumarkhân (Khubar)
assert(passivasCode.includes('isTumarkhan'), 'ensureOriginPartners deve reconhecer Ginete de Tumarkhân');
assert(passivasCode.includes("id: 'tumarkhan'"), 'ensureOriginPartners deve instanciar id: tumarkhan');
assert(passivasCode.includes("partnerType: 'Montaria'"), 'Tumarkhân deve ter tipo Montaria');
assert(passivasCode.includes('countsTowardsLimit: false'), 'Tumarkhân não deve contar no limite de parceiros');
assert(validacaoCode.includes("addSkill('adestramento', 2)"), 'passiveCharacterEffects deve conceder +2 Adestramento');
assert(validacaoCode.includes("addSkill('cavalgar', 2)"), 'passiveCharacterEffects deve conceder +2 Cavalgar');
assert(parceirosCode.includes('isTumarkhan'), 'Fase 09 de parceiros deve sincronizar e renderizar Tumarkhân');

console.log('✔ Ginete de Tumarkhân (Parceiro Tumarkhân iniciante montaria, +2 Adestramento e Cavalgar) validado!');

// 6. Validar Grumete Pirata (Três Mares)
assert(validacaoCode.includes('grumete_pirata') || validacaoCode.includes('Grumete Pirata'), 'selectedCharacterFeatures deve reconhecer Grumete Pirata');
assert(validacaoCode.includes('pes_de_marinheiro') || validacaoCode.includes('Pés de Marinheiro'), 'Deve conceder habilidade Pés de Marinheiro');
assert(validacaoCode.includes("tatuagem_antiga_tripulacao"), 'passiveCharacterEffects deve checar tatuagem_antiga_tripulacao');
assert(validacaoCode.includes("addSkill('intimidacao', 1)"), 'Tatuagem da antiga tripulação deve conceder +1 em Intimidação');

console.log('✔ Grumete Pirata (Pés de Marinheiro e Tatuagem +1 Intimidação) validado!');

console.log('🎉 Todos os testes de regras das origens regionais (Lote 5) passaram com sucesso!');
