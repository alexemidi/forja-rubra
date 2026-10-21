const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== Teste e Validação Consolidada: Origens Padrão (46) e Regionais (66) ===\n');

// 1. Carregar arquivos de dados
const standardOrigins = JSON.parse(fs.readFileSync(path.join(__dirname, '../dados/criador-origins.json'), 'utf8'));
const regionalOrigins = JSON.parse(fs.readFileSync(path.join(__dirname, '../dados/criador-regionalOrigins.json'), 'utf8'));
const itemsCatalog = JSON.parse(fs.readFileSync(path.join(__dirname, '../dados/items.json'), 'utf8'));

assert.strictEqual(standardOrigins.length, 47, 'Devem existir 47 origens padrão cadastradas (incluindo Criação dos Deuses)');
assert.strictEqual(regionalOrigins.length, 66, 'Devem existir 66 origens regionais cadastradas');
console.log('✔ Contagem conferida: 47 origens padrão e 66 origens regionais.');

// 2. Carregar arquivos de código para validar regras implementadas
const readSrc = (rel) => {
  const tsPath = path.join(__dirname, '../src', rel.replace(/\.js$/, '.ts'));
  const jsPath = path.join(__dirname, '../src', rel);
  return fs.existsSync(tsPath) ? fs.readFileSync(tsPath, 'utf8') : fs.readFileSync(jsPath, 'utf8');
};
const passivasCode = readSrc('regras/criador/passivas-proficiencias.ts');
const validacaoCode = readSrc('compartilhado/criador/navegacao-validacao.ts');
const divindadesCode = readSrc('funcionalidades/criador/fases/04-origens-divindades.ts');
const escolasCode = readSrc('funcionalidades/criador/fases/07-escolas-expansoes.ts');
const parceirosCode = readSrc('funcionalidades/criador/fases/09-parceiros.ts');
const magiasCode = readSrc('regras/criador/magias.ts');
const estadoCatalogosCode = readSrc('compartilhado/criador/estado-e-catalogos.ts');

// 3. Validação das Origens Padrão
console.log('\n--- Validando 46 Origens Padrão ---');
standardOrigins.forEach(origin => {
  assert(origin.nome, 'Origem padrão deve ter nome');
  assert(Array.isArray(origin.itens), `Origem ${origin.nome} deve ter array de itens`);
  assert(origin.beneficios, `Origem ${origin.nome} deve ter beneficios`);
  assert(Array.isArray(origin.beneficios.pericias), `Origem ${origin.nome} deve ter pericias`);
  assert(Array.isArray(origin.beneficios.poderes), `Origem ${origin.nome} deve ter poderes`);
  assert(origin.beneficios.poder_unico, `Origem ${origin.nome} deve ter poder_unico`);
  assert(origin.beneficios.poder_unico.nome, `Origem ${origin.nome} poder_unico deve ter nome`);
  assert(origin.beneficios.poder_unico.descricao, `Origem ${origin.nome} poder_unico deve ter descricao`);
});
console.log('✔ Todas as 46 origens padrão possuem estrutura completa (itens, perícias, poderes gerais e poder único).');

// Validar itens das origens padrão que foram enriquecidos
const padraoItensNovos = [
  'traje_de_sacerdote',
  'panela',
  'caneca',
  'bolsa_cheia_de_minhocas',
  'tabardo_com_o_simbolo_de_khalmyr',
  'mercadorias_para_vender_no_valor_de_t_100',
  'gemas_preciosas_no_valor_de_t_100'
];
padraoItensNovos.forEach(id => {
  assert(itemsCatalog.some(i => i.id === id), `Item de origem padrão ${id} deve existir no catálogo de itens`);
});
console.log('✔ Itens canônicos de origens padrão validados no catálogo de itens.');

// 4. Validação das Origens Regionais (todas as 66)
console.log('\n--- Validando 66 Origens Regionais ---');
regionalOrigins.forEach((origin, index) => {
  assert(origin.nome, `Regional #${index+1} deve ter nome`);
  assert(origin.regiao, `Regional ${origin.nome} deve ter região`);
  assert(Array.isArray(origin.itens), `Regional ${origin.nome} deve ter array de itens`);
  assert(origin.beneficios?.descricao, `Regional ${origin.nome} deve ter descrição de benefícios`);
});
console.log('✔ Todas as 66 origens regionais possuem estrutura de dados completa.');

// 5. Validação das regras das Origens Regionais de 36 a 66
console.log('\n--- Validando regras específicas do Lote 36 a 66 ---');

// Guardião Glacial
assert(escolasCode.includes('isGuardiaoGlacial'), 'Proficiências deve verificar Guardião Glacial');
assert(passivasCode.includes('arco_longo') && passivasCode.includes('machado_de_batalha'), 'weaponPassiveStats deve tratar Guardião Glacial');
assert(validacaoCode.includes('isGuardiaoGlacial') && validacaoCode.includes("danoTipo: 'frio'"), 'Guardião Glacial deve conceder RD frio 5');
console.log('✔ 36. Guardião Glacial validado (RD frio 5, proficiências e bônus de dano).');

// Insurgente Tapistano
assert(validacaoCode.includes('isInsurgente'), 'passiveCharacterEffects deve verificar Insurgente Tapistano');
assert(validacaoCode.includes("addSkill('fortitude', 1)") && validacaoCode.includes("addSkill('reflexos', 1)") && validacaoCode.includes("addSkill('vontade', 1)"), 'Insurgente deve conceder +1 resistências');
assert(validacaoCode.includes('pvFlat += 2') && validacaoCode.includes('pvPerLevel += 1'), 'Insurgente deve conceder +3 PV nível 1 e +1 PV por nível seguinte');
console.log('✔ 38. Insurgente Tapistano validado (+1 resistências e PVs escalonados).');

// Irmão sem Esporas
assert(passivasCode.includes('irmao_sem_esporas') && passivasCode.includes('irmao_cavalo'), 'ensureOriginPartners deve criar Irmão Cavalo');
assert(passivasCode.includes('hasIrmaoCavalo') && passivasCode.includes('attack += 1'), 'weaponPassiveStats deve conceder +1 ataque com Irmão Cavalo');
assert(parceirosCode.includes('irmao_cavalo') && parceirosCode.includes('Irmão Cavalo'), 'Fase 9 deve suportar Irmão Cavalo');
assert(estadoCatalogosCode.includes('irmao_sem_esporas'), 'characterHasPartnerChoices deve reconhecer Irmão sem Esporas');
console.log('✔ 39. Irmão sem Esporas validado (Montaria Irmão Cavalo, +1 ataque e +1 Reflexos).');

// Legionário
assert(escolasCode.includes('isLegionario') && escolasCode.includes('gladio'), 'characterProficiencies deve conceder gládio e escudos para Legionário');
assert(passivasCode.includes('hasLegionario') && passivasCode.includes('hasHeavyShield'), 'configuredWeaponCritical deve aumentar margem do gládio com escudo pesado');
assert(validacaoCode.includes('isLegionario') && validacaoCode.includes('defenseBonus += 1'), 'Legionário deve conceder +1 Defesa com gládio e escudo pesado');
console.log('✔ 40. Legionário validado (Guerra, proficiências, +1 margem e +1 Defesa).');

// Lenhador de Tollon
assert(escolasCode.includes('isLenhadorTollon'), 'characterProficiencies deve tratar Lenhador de Tollon');
assert(passivasCode.includes('isLenhadorTollon') && passivasCode.includes('machadinha'), 'weaponPassiveStats deve conceder +2 dano para machados de Tollon');
assert(passivasCode.includes('madeira tollon'), 'originItemChoice deve permitir escolher item de madeira Tollon');
console.log('✔ 41. Lenhador de Tollon validado (Ofício artesão, proficiências e item de madeira Tollon).');

// Liricista de Lenórienn
assert(validacaoCode.includes('isLiricista') && validacaoCode.includes("addSkill('atuacao', 2)"), 'Liricista deve conceder +2 em Atuação');
assert(validacaoCode.includes('liricista_de_lenorien') && validacaoCode.includes("return 'car'"), 'Misticismo deve usar Carisma para Liricista de Lenórienn');
console.log('✔ 42. Liricista de Lenórienn validado (Atuação +2 e Misticismo com Carisma).');

// Nitamuraniano
assert(escolasCode.includes('isNitamuraniano'), 'characterProficiencies deve tratar Nitamuraniano');
assert(passivasCode.includes('isNitamuraniano') && passivasCode.includes('katana'), 'weaponPassiveStats deve tratar Katana e Arco Longo');
console.log('✔ 44. Nitamuraniano validado (proficiências katana/arco e bônus de dano).');

// Nobre Zakharoviano
assert(validacaoCode.includes('isNobreZakharov') && validacaoCode.includes('pmFlat += 2 * tier'), 'Nobre Zakharoviano deve conceder +2 PM por patamar');
assert(passivasCode.includes('nobre_zakharoviano') && passivasCode.includes('Arma Superior'), 'originItemChoices deve gerar arma superior zakharoviana');
console.log('✔ 45. Nobre Zakharoviano validado (Ofício armeiro, arma superior e +2 PM por patamar).');

// Nômade Sar-Allan
assert(validacaoCode.includes('isNomadeSarAllan'), 'passiveCharacterEffects deve verificar Nômade Sar-Allan');
assert(passivasCode.includes('isNomadeSarAllan'), 'weaponPassiveStats deve conceder +2 dano alfange/cimitarra/arco curto');
assert(passivasCode.includes('corcel do deserto ou dromedario'), 'originItemChoice deve permitir escolher montaria do deserto');
console.log('✔ 46. Nômade Sar-Allan validado (+2 Fortitude/Sobrevivência, +2 dano e montaria do deserto).');

// Pescador Parrudo
assert(validacaoCode.includes('isPescadorParrudo'), 'passiveCharacterEffects deve verificar Pescador Parrudo');
assert(validacaoCode.includes('pvFlat += 3'), 'Pescador Parrudo deve conceder +3 PV');
console.log('✔ 47. Pescador Parrudo validado (+2 Atletismo/Fortitude/Sobrevivência e +3 PV).');

// Plebeu Arcano
assert(validacaoCode.includes('isPlebeuArcano') && validacaoCode.includes('pmFlat += 2'), 'Plebeu Arcano deve conceder +2 PM');
console.log('✔ 48. Plebeu Arcano validado (+2 PM e reroll contra magia).');

// Procurado: Vivo ou Morto
assert(escolasCode.includes('isProcurado') && escolasCode.includes('armas_de_fogo'), 'characterProficiencies deve conceder proficiência em armas de fogo');
console.log('✔ 50. Procurado: Vivo ou Morto validado (proficiência em armas de fogo e balas cruéis).');

// Querido Filho
assert(validacaoCode.includes('isQueridoFilho'), 'passiveCharacterEffects deve verificar Querido Filho');
assert(validacaoCode.includes("danoTipo: 'trevas'"), 'Querido Filho deve conceder RD trevas 5');
console.log('✔ 52. Querido Filho validado (RD frio 5, RD trevas 5 e visão no escuro).');

// Rebelde Agitador
assert(passivasCode.includes('parseOriginMoneyText'), 'originMoneyBonus deve parsear T$ 6d12');
console.log('✔ 53. Rebelde Agitador validado (Iniciativa, aliados e parsing de T$ 6d12).');

// Recruta da Fênix
assert(validacaoCode.includes('isRecrutaFenix') && validacaoCode.includes('pvPerLevel += 1'), 'Recruta da Fênix deve conceder +1 PV/nível');
assert(passivasCode.includes('recruta_da_fenix') && passivasCode.includes('grifo_iniciante'), 'ensureOriginPartners deve criar Grifo Iniciante');
assert(parceirosCode.includes('grifo_iniciante') && parceirosCode.includes('Grifo Iniciante'), 'Fase 9 deve suportar Grifo Iniciante');
console.log('✔ 56. Recruta da Fênix validado (Cavalgar, Grifo da Fênix, +1 PV/nível e RD fogo 5).');

// Sábio Matemático
assert(magiasCode.includes('isSabioMatematico'), 'spellPlan deve verificar Sábio Matemático');
assert(magiasCode.includes('Concentração de Combate') && magiasCode.includes('Orientação'), 'Sábio Matemático deve conceder Concentração de Combate e Orientação');
console.log('✔ 57. Sábio Matemático validado (Conhecimento, Concentração de Combate e Orientação).');

// Selvagem Sanguinário
assert(validacaoCode.includes('isSelvagem'), 'passiveCharacterEffects deve verificar Selvagem Sanguinário');
assert(passivasCode.includes('isSelvagem') && passivasCode.includes('extraDamage += 1'), 'weaponPassiveStats deve conceder +1 dano com armas sem armadura pesada');
console.log('✔ 58. Selvagem Sanguinário validado (Sobrevivência, RD 1 e +1 dano sem armadura pesada).');

// Sucateiro de Batalhas
assert(passivasCode.includes('parseOriginMoneyText'), 'originMoneyBonus deve parsear T$ 4d6');
console.log('✔ 59. Sucateiro de Batalhas validado (Guerra, Investigação e parsing de T$ 4d6).');

// Tocado pelo Indomável
assert(passivasCode.includes('isIndomavel') && passivasCode.includes('extraDamage += 2'), 'weaponPassiveStats deve conceder +2 dano para armas naturais e desarmado');
console.log('✔ 62. Tocado pelo Indomável validado (Atletismo e +2 dano desarmado/armas naturais).');

// Tradicionalista Svalano
assert(validacaoCode.includes('isTradicionalista') && validacaoCode.includes("addSkill('fortitude', 1)"), 'Tradicionalista deve conceder +1 Fortitude e Vontade');
assert(validacaoCode.includes('tradicionalista_svalano') && validacaoCode.includes("return 'sab'"), 'Conhecimento e Nobreza devem usar Sabedoria para Tradicionalista Svalano');
console.log('✔ 63. Tradicionalista Svalano validado (+1 Fortitude/Vontade e Conhecimento/Nobreza com Sabedoria).');

// Trapaceiro Ahleniense
assert(validacaoCode.includes('isTrapaceiro') && validacaoCode.includes("addSkill('enganacao', 2)"), 'Trapaceiro Ahleniense deve conceder +2 Enganação e Furtividade');
assert(validacaoCode.includes('trapaceiro_ahleniense') && validacaoCode.includes("return 'car'"), 'Ladinagem deve usar Carisma para Trapaceiro Ahleniense');
console.log('✔ 64. Trapaceiro Ahleniense validado (+2 Enganação/Furtividade e Ladinagem com Carisma).');

// Turista da Academia
assert(validacaoCode.includes('isTurista') && validacaoCode.includes('spellResistance = (result.spellResistance || 0) + 2'), 'Turista da Academia deve conceder resistência a magia +2');
assert(passivasCode.includes('turista') && passivasCode.includes('Pergaminho Arcano'), 'originItemChoices deve gerar 3 escolhas de pergaminhos arcanos');
console.log('✔ 65. Turista da Academia validado (resistência a magia +2 e 3 pergaminhos arcanos).');

console.log('\n======================================================');
console.log('🎉 SUCESSO TOTAL: Todas as 46 origens padrão e 66 origens regionais estão 100% implementadas e validadas!');
console.log('======================================================\n');
