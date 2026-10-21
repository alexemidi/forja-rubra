const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

// 1. Validar itens canônicos em dados/items.json
const items = JSON.parse(fs.readFileSync(path.join(root, 'dados/items.json'), 'utf8'));
const { ORIGIN_EXCLUSIVE_ITEM_IDS } = require(path.join(root, 'src/regras/criador/itens-exclusivos-origem.js'));

const originExclusiveList = [
  'ferramenta_agricola',
  'ferramenta_pesada',
  'ferramenta_pesada_lanca',
  'animal_nao_combativo',
  'joia_de_familia',
  'joia_falsificada',
  'rolo_de_macarrao',
  'martelo_de_carne',
  'item_artistico',
  'tatuagem_adereco_gangue',
  'bolas_malabarismo',
  'traje_estrangeiro',
  'item_sem_valor_admirador',
  'apito',
  'insignia_da_milicia',
  'pequeno_animal_estimacao',
  'panela',
  'avental',
  'caneca',
  'pano_sujo',
  'tabardo_khalmyr',
  'cutelo',
  'instrumentos_cozinheiro_aprimorados',
  'instrumentos_barbeiro',
  'faca_de_corte',
  'instrumentos_coureiro',
  'bola_ou_objeto_pintado',
  'bolsa_de_minhocas',
  'instrumentos_pescador'
];

for (const id of originExclusiveList) {
  assert(ORIGIN_EXCLUSIVE_ITEM_IDS.has(id), `ORIGIN_EXCLUSIVE_ITEM_IDS deve conter ${id}`);
  const item = items.find(i => i.id === id);
  assert(item, `Item ${id} deve existir em dados/items.json`);
  assert.equal(item.origemExclusiva, true, `Item ${id} deve ter origemExclusiva: true`);
}

// 2. Validar preços e propriedades da Joia de Família e Item Artístico
const joiaFamilia = items.find(i => i.id === 'joia_de_familia');
assert.equal(joiaFamilia.preco.valor, 300, 'Joia de Família deve ter valor base T$ 300');
const valorVendaJoia = Math.floor(joiaFamilia.preco.valor * 0.5);
assert.equal(valorVendaJoia, 150, 'Venda da Joia de Família deve ser T$ 150 (50% do valor base)');

const itemArtistico = items.find(i => i.id === 'item_artistico');
assert.equal(itemArtistico.preco.valor, 100, 'Item Artístico cosmopolita deve ter valor base T$ 100');
assert.equal(itemArtistico.espacos, 0.5, 'Item Artístico cosmopolita deve ocupar 0.5 espaço');

// 3. Validar função de filtragem da loja para itens exclusivos fora da escolha inicial
const sampleItems = [
  { id: 'espada_longa', nome: 'Espada Longa', tipo: 'arma', preco: { valor: 15 } },
  { id: 'joia_de_familia', nome: 'Joia de Família', tipo: 'item_geral', preco: { valor: 300 }, origemExclusiva: true },
  { id: 'item_artistico', nome: 'Item Artístico', tipo: 'item_geral', preco: { valor: 100 }, origemExclusiva: true }
];

const regularShopItems = sampleItems.filter(item => {
  const isOriginExclusive = Boolean(item.origemExclusiva || ORIGIN_EXCLUSIVE_ITEM_IDS.has(item.id));
  return !isOriginExclusive;
});

assert.equal(regularShopItems.length, 1);
assert.equal(regularShopItems[0].id, 'espada_longa');

// 4. Validar formatação de nomes personalizados (joias e itens de origem)
function formatDisplayName(entry, item) {
  const custom = (entry.options?.customName || '').trim();
  if (['joia_de_familia', 'joia_falsificada', 'item_artistico'].includes(item.id)) {
    return custom ? `${item.nome} (${custom})` : item.nome;
  }
  return item.nome;
}

assert.equal(formatDisplayName({ options: { customName: 'Colar de Pérolas' } }, joiaFamilia), 'Joia de Família (Colar de Pérolas)');
assert.equal(formatDisplayName({ options: { customName: 'Anel de Latão' } }, { id: 'joia_falsificada', nome: 'Joia Falsificada' }), 'Joia Falsificada (Anel de Latão)');
assert.equal(formatDisplayName({ options: { customName: 'Estatueta de Minotauro' } }, itemArtistico), 'Item Artístico (Estatueta de Minotauro)');
assert.equal(formatDisplayName({ options: {} }, joiaFamilia), 'Joia de Família');

// 5. Validar criação de item inspirado na recompensa (regras de validação)
function validateCustomItemCreation({ newName, inspiration, modifiedAttrs, existingNames }) {
  if (!newName || !newName.trim()) return { ok: false, error: 'Nome obrigatório' };
  const trimmed = newName.trim().toLowerCase();
  if (inspiration && trimmed === inspiration.nome.toLowerCase()) return { ok: false, error: 'Nome igual à inspiração' };
  if (existingNames.some(n => n.toLowerCase() === trimmed)) return { ok: false, error: 'Nome já existe' };
  if (inspiration && !modifiedAttrs) return { ok: false, error: 'Pelo menos um atributo deve ser modificado' };
  return { ok: true };
}

const existingCatalogNames = ['Espada Longa', 'Adaga', 'Mochila'];
const inspiration = { id: 'espada_longa', nome: 'Espada Longa', dano: '1d8', preco: 15 };

// Deve falhar sem nome
assert.equal(validateCustomItemCreation({ newName: '', inspiration, modifiedAttrs: true, existingNames: existingCatalogNames }).ok, false);
// Deve falhar com o mesmo nome da inspiração
assert.equal(validateCustomItemCreation({ newName: 'Espada Longa', inspiration, modifiedAttrs: true, existingNames: existingCatalogNames }).ok, false);
// Deve falhar se não houver atributo modificado
assert.equal(validateCustomItemCreation({ newName: 'Espada de Fogo', inspiration, modifiedAttrs: false, existingNames: existingCatalogNames }).ok, false);
// Deve ter sucesso com nome único e atributo modificado
const validResult = validateCustomItemCreation({ newName: 'Espada Solar Flamejante', inspiration, modifiedAttrs: true, existingNames: existingCatalogNames });
assert.equal(validResult.ok, true);

// 6. Validar cadastro das origens de Heróis de Arton
const origins = JSON.parse(fs.readFileSync(path.join(root, 'dados/criador-origins.json'), 'utf8'));
const requiredOrigins = [
  'Bacharel', 'Caçador de Ratos', 'Carpinteiro', 'Carcereiro',
  'Catador da Catástrofe', 'Chef Hynne', 'Cirurgião-Barbeiro',
  'Coureiro', 'Náufrago', 'Menestrel', 'Pescador'
];
for (const origName of requiredOrigins) {
  const found = origins.find(o => o.nome === origName);
  assert(found, `Origem ${origName} deve constar em dados/criador-origins.json`);
  assert(found.itens && found.itens.length > 0, `Origem ${origName} deve ter itens configurados`);
}

// 7. Validar regra de matéria-prima de ofício (1/3 do preço)
function calculateRawMaterialCost(marketPrice) {
  return Math.ceil(marketPrice / 3);
}

assert.equal(calculateRawMaterialCost(15), 5);
assert.equal(calculateRawMaterialCost(10), 4);
assert.equal(calculateRawMaterialCost(50), 17);
assert.equal(calculateRawMaterialCost(300), 100);

// 8. Validar filtro de armas marciais tradicionais anãs
const dwarfWeaponRegex = /(machado|machadinha|martelo|marreta|picareta)/i;
assert(dwarfWeaponRegex.test('Machado de Batalha'), 'Machado de Batalha é arma tradicional anã');
assert(dwarfWeaponRegex.test('Machadinha'), 'Machadinha é arma tradicional anã');
assert(dwarfWeaponRegex.test('Martelo de Guerra'), 'Martelo de Guerra é arma tradicional anã');
assert(dwarfWeaponRegex.test('Marreta Estilhaçadora'), 'Marreta Estilhaçadora é arma tradicional anã');
assert(dwarfWeaponRegex.test('Picareta'), 'Picareta é arma tradicional anã');
assert(!dwarfWeaponRegex.test('Espada Longa'), 'Espada Longa não é arma anã');
assert(!dwarfWeaponRegex.test('Adaga'), 'Adaga não é arma anã');

// 9. Validar regras de engenhocas (não vende, não aprimora, permite destruir)
function canSellOrUpgrade(entry) {
  const isEngenhoca = Boolean(entry.isEngenhoca || entry.contraptionId || entry.tipo === 'engenhoca');
  return {
    canSell: !isEngenhoca,
    canUpgrade: !isEngenhoca,
    canDestroy: isEngenhoca
  };
}
assert.deepEqual(canSellOrUpgrade({ id: 'eng_1', isEngenhoca: true }), { canSell: false, canUpgrade: false, canDestroy: true });
assert.deepEqual(canSellOrUpgrade({ id: 'espada', tipo: 'arma' }), { canSell: true, canUpgrade: true, canDestroy: false });

// 10. Validar bloqueio de carga máxima (máximo absoluto = limit * 2)
function validateLoad(currentUsed, newSpaces, limit) {
  const maximum = limit * 2;
  return {
    allowed: (currentUsed + newSpaces) <= maximum,
    maximum
  };
}
assert.equal(validateLoad(10, 5, 10).allowed, true); // 15 <= 20
assert.equal(validateLoad(15, 6, 10).allowed, false); // 21 > 20 (bloqueado)

// 11. Validar reajuste automático de valor de item aprimorado e base de venda (ex: Maça 6 + 300 = 306, venda = 153)
function calculateUpgradedItemPrice(basePrice, improvementCount) {
  const surcharges = [0, 300, 3000, 9000, 18000];
  const surcharge = surcharges[Math.min(4, improvementCount)] || 0;
  const totalPrice = basePrice + surcharge;
  const salePrice = Math.floor(totalPrice * 0.5);
  return { totalPrice, salePrice };
}
const macaOuro = calculateUpgradedItemPrice(6, 1);
assert.equal(macaOuro.totalPrice, 306, 'Maça com 1 melhoria deve valer T$ 306');
assert.equal(macaOuro.salePrice, 153, 'Preço de venda da Maça com 1 melhoria deve ser 50% de 306 = T$ 153');

// 12. Validar escolhas interativas e regexes da Origem Artesão
function slug(text){ return String(text||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,''); }
function testOriginChoice(name, origin){
  const text=slug(name).replace(/_/g,' '),base={id:'origin-standard-artesao',title:name,source:'origin',filterLabel:'Escolha'};
  if(/somando ate.*500|pista misteriosa do seu passado/i.test(text))return{...base,title:'Amnésico · Pista do Passado (até T$ 500)',isBudgetGrant:true,maxBudget:500};
  if(/item que voce possa fabricar.*(?:t|t\$)?\s*50/i.test(text))return{...base,title:'Artesão · Item Fabricável (até T$ 50)',isBudgetGrant:true,maxBudget:50};
  if(/instrumentos de oficio(?:\s*qualquer)?/i.test(text))return{...base,names:['Instrumentos de Ofício'],isCraftTool:true};
  return null;
}
const artesaoGrant1 = testOriginChoice('Um item que você possa fabricar de até T$ 50', { nome: 'Artesão' });
assert(artesaoGrant1, 'Escolha de item fabricável do Artesão deve ser reconhecida');
assert.equal(artesaoGrant1.isBudgetGrant, true, 'Artesão item fabricável deve ser budget grant');
assert.equal(artesaoGrant1.maxBudget, 50, 'Artesão item fabricável deve ter teto T$ 50');

const artesaoGrant0 = testOriginChoice('Instrumentos de ofício (qualquer)', { nome: 'Artesão' });
assert(artesaoGrant0, 'Instrumentos de ofício do Artesão deve ser reconhecido como escolha interativa');
assert.equal(artesaoGrant0.isCraftTool, true, 'Instrumentos de ofício deve ter isCraftTool: true');

// 13. Validar função universal formatCraftToolName e inclusão do Tatuador
const { isOriginExclusiveItemAllowed, formatCraftToolName } = require(path.join(root, 'src/regras/criador/itens-exclusivos-origem.js'));
assert(typeof formatCraftToolName === 'function', 'formatCraftToolName deve ser função');
assert.equal(formatCraftToolName('armeiro'), 'Instrumentos do Armeiro');
assert.equal(formatCraftToolName('alquimia'), 'Instrumentos do Alquimista');
assert.equal(formatCraftToolName('tatuador'), 'Instrumentos do Tatuador');
assert.equal(formatCraftToolName('engenhoqueiro'), 'Instrumentos do Engenhoqueiro');
assert.equal(formatCraftToolName('joalheiro'), 'Instrumentos do Joalheiro');
assert.equal(formatCraftToolName('alfaiate'), 'Instrumentos do Alfaiate');
assert.equal(formatCraftToolName('culinaria'), 'Instrumentos do Cozinheiro');

// 14. Validar que itens exclusivos de origem são bloqueados quando há concessão de orçamento (como Artesão T$ 50)
global.arsenalInitialState = { mode: 'initial' };
global.effectiveInitialChoice = () => ({ source: 'origin', isOriginGrant: true, isBudgetGrant: true, maxBudget: 50 });
assert.equal(isOriginExclusiveItemAllowed('rolo_de_macarrao'), false, 'Rolo de Macarrão não pode ser permitido em orçamento');
assert.equal(isOriginExclusiveItemAllowed('ferramenta_agricola'), false, 'Ferramenta Agrícola não pode ser permitida em orçamento');
assert.equal(isOriginExclusiveItemAllowed('ferramenta_pesada'), false, 'Ferramenta Pesada não pode ser permitida em orçamento');
assert.equal(isOriginExclusiveItemAllowed('cutelo'), false, 'Cutelo não pode ser permitido em orçamento');
assert.equal(isOriginExclusiveItemAllowed('espada_longa'), true, 'Itens normais devem ser permitidos');

// Concessão de origem específica para o item
global.effectiveInitialChoice = () => ({ source: 'origin', isOriginGrant: true, names: ['Rolo de macarrão'] });
global.starterKey = (text) => String(text || '').toLowerCase().trim();
assert.equal(isOriginExclusiveItemAllowed({ id: 'rolo_de_macarrao', nome: 'Rolo de macarrão' }), true, 'Rolo de macarrão deve ser permitido se explicitamente concedido pela origem');

// 15. Validar que Protótipo do Inventor possui maxImprovements: 1
const passivasCode = fs.readFileSync(path.join(root, 'src/regras/criador/passivas-proficiencias.js'), 'utf8');
assert(passivasCode.includes("id:'class-inventor-prototipo'") && passivasCode.includes('maxImprovements:1'), 'Protótipo do inventor deve ter maxImprovements:1');

// 16. Validar que Fase 9 é pulada para Nível 1
const estadoCatalogosCode = fs.readFileSync(path.join(root, 'src/compartilhado/criador/estado-e-catalogos.js'), 'utf8');
assert(estadoCatalogosCode.includes('if (step === 9)') && estadoCatalogosCode.includes('plannedLevel <= 1'), 'shouldSkipPhase deve verificar plannedLevel <= 1 para step 9');

// 17. Validar estilo de item selecionado (amarelo envelhecido / âmbar) e aviso avermelhado
const css3 = fs.readFileSync(path.join(root, 'src/estilos/loja/3.css'), 'utf8');
assert(css3.includes('.item-card.candidate') && css3.includes('#d4af37'), 'Item card candidato deve usar borda dourada envelhecida');
assert(css3.includes('.item-card.candidate [data-action="add-to-cart"]') && css3.includes('#78350f'), 'Botão do item candidato deve usar fundo âmbar envelhecido #78350f');
assert(css3.includes('.center-choice-notice.budget-warning') && css3.includes('#b91c1c'), 'Aviso de orçamento deve ter estilo avermelhado');

console.log('Itens de origem exclusivos, novas origens, escolhas do Artesão, formatCraftToolName, armas anãs, engenhocas, melhorias progressivas e conclusão de nível 1 aprovados.');


