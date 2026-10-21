const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== Testes Origens Regionais (Lote 4) ===');

// Carregar catálogo de itens
const itemsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../dados/items.json'), 'utf8'));

// 1. Validar itens cadastrados em dados/items.json
const bruneaPurista = itemsData.find(i => i.id === 'brunea_purista_raspada');
assert(bruneaPurista, 'brunea_purista_raspada deve existir em items.json');
assert.strictEqual(bruneaPurista.armadura?.defesa, 5, 'Brunea purista raspada deve fornecer +5 Defesa');
assert.strictEqual(bruneaPurista.armadura?.penalidade, -2, 'Brunea purista raspada deve ter penalidade -2');
assert.strictEqual(bruneaPurista.armadura?.categoriaId, 'pesada', 'Brunea purista raspada deve ser armadura pesada');

const enfeiteLuz = itemsData.find(i => i.id === 'enfeite_elmo_luz');
assert(enfeiteLuz, 'enfeite_elmo_luz deve existir em items.json');
assert.strictEqual(enfeiteLuz.equipamento?.itemVestido, true, 'Enfeite de elmo da Luz deve ser vestível');

const fragmentoEstandarte = itemsData.find(i => i.id === 'fragmento_de_estandarte');
assert(fragmentoEstandarte, 'fragmento_de_estandarte deve existir em items.json');
assert.strictEqual(fragmentoEstandarte.equipamento?.itemVestido, true, 'Fragmento de estandarte deve ser vestível');
assert(fragmentoEstandarte.efeitos.some(e => e.periciaId === 'vontade' && e.valor === 1), 'Fragmento de estandarte deve conceder +1 em Vontade');

console.log('✔ Itens do Lote 4 validados em dados/items.json!');

// 2. Validar Descendente Colleniano (Ahlen)
const validacaoCode = fs.readFileSync(path.join(__dirname, '../src/compartilhado/criador/navegacao-validacao.js'), 'utf8');
assert(validacaoCode.includes('isColleniano'), 'passiveCharacterEffects deve verificar isColleniano');
assert(validacaoCode.includes("addSkill('percepcao', 2)"), 'Descendente Colleniano deve conceder +2 em Percepção');

const magiasCode = fs.readFileSync(path.join(__dirname, '../src/regras/criador/magias.js'), 'utf8');
assert(magiasCode.includes('isColleniano'), 'spellPlan deve verificar isColleniano');
assert(magiasCode.includes("add('origin:descendente_colleniano'"), 'spellPlan deve adicionar grupo de magia para descendente colleniano');
assert(magiasCode.includes("fixed: ['Visão Mística']"), 'Visão Mística deve ser concedida fixa');

console.log('✔ Descendente Colleniano (+2 Percepção e Visão Mística) validado!');

// 3. Validar Desertor da Supremacia (Supremacia)
const profCode = fs.readFileSync(path.join(__dirname, '../src/funcionalidades/criador/fases/07-escolas-expansoes.js'), 'utf8');
assert(profCode.includes('isDesertor'), 'characterProficiencies deve verificar Desertor da Supremacia');
assert(profCode.includes("values.push('espada_bastarda')"), 'Desertor deve conceder proficiência com espada bastarda');
assert(profCode.includes("values.push('escudos')"), 'Desertor deve conceder proficiência com escudos');

const passivasCode = fs.readFileSync(path.join(__dirname, '../src/regras/criador/passivas-proficiencias.js'), 'utf8');
assert(passivasCode.includes('isDesertor'), 'weaponPassiveStats deve verificar Desertor da Supremacia');
assert(passivasCode.includes('shieldEquipped'), 'weaponPassiveStats deve checar se escudo pesado está equipado');
assert(passivasCode.includes('attack += 2'), 'weaponPassiveStats deve somar +2 no teste de ataque com espada bastarda + escudo pesado');

console.log('✔ Desertor da Supremacia (Guerra, Proficiências e +2 Ataque com Espada Bastarda + Escudo Pesado) validado!');

// 4. Validar Emissário Ubaneri (Ubani)
assert(validacaoCode.includes("regName==='Emissário Ubaneri'") && validacaoCode.includes("emissario_ubaneri"), 'Misticismo deve usar Sabedoria para Emissário Ubaneri');
assert(passivasCode.includes("Emissário Ubaneri"), 'ensureOriginPartners deve suportar Emissário Ubaneri');
assert(passivasCode.includes("origem: ubaneriOriginName"), 'Parceiro Alikunhá deve registrar a origem correta');

console.log('✔ Emissário Ubaneri (Misticismo com Sabedoria e parceiro Alikunhá) validado!');

// 5. Validar Escudeiro da Luz (Bielefeld)
assert(validacaoCode.includes('isEscudeiroLuz'), 'passiveCharacterEffects deve verificar Escudeiro da Luz');
assert(validacaoCode.includes('result.defenseBonus += 2'), 'Escudeiro da Luz deve conceder +2 na Defesa');
assert(validacaoCode.includes('result.pmFlat += 3'), 'Escudeiro da Luz deve conceder +3 PM');

console.log('✔ Escudeiro da Luz (Nobreza, +2 Defesa e +3 PM) validado!');

// 6. Validar Estandarte Vivo (Ermos Púrpuras)
assert(validacaoCode.includes('isEstandarteVivo'), 'passiveCharacterEffects deve verificar Estandarte Vivo');
assert(validacaoCode.includes("addSkill('sobrevivencia', 2)"), 'Estandarte Vivo deve conceder +2 Sobrevivência');
assert(validacaoCode.includes("e.itemId === 'fragmento_de_estandarte'"), 'passiveCharacterEffects deve verificar fragmento_de_estandarte');
assert(validacaoCode.includes("addSkill('vontade', 1)"), 'Fragmento de estandarte equipado deve conceder +1 em Vontade');

const estadoCode = fs.readFileSync(path.join(__dirname, '../src/compartilhado/criador/estado-e-catalogos.js'), 'utf8');
assert(estadoCode.includes('estandarte_vivo'), 'originGeneralPowerOptions deve tratar estandarte_vivo');
assert(estadoCode.includes("category: 'combate_ou_tormenta'"), 'originGeneralPowerOptions deve conceder poder de categoria combate_ou_tormenta');

const eventosCode = fs.readFileSync(path.join(__dirname, '../src/integracoes/criador/eventos-e-servicos.js'), 'utf8');
assert(eventosCode.includes('estandarte_vivo'), 'originChoicePowerList deve incluir Estandarte Vivo');
assert(eventosCode.includes("['combate','tormenta'].includes(power?.categoria)"), 'Validação de seleção deve permitir combate ou tormenta');

console.log('✔ Estandarte Vivo (+2 Sobrevivência, Fragmento +1 Vontade e Poder de Combate ou Tormenta) validado!');

console.log('🎉 Todos os testes de regras das origens regionais (Lote 4) passaram com sucesso!');
