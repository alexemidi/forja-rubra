const fs = require('fs');
const path = require('path');

const workspace = path.resolve(__dirname, '..', '..');
const html = fs.readFileSync(path.join(workspace, 'Arsenal de Arton.html'), 'utf8');
const match = html.match(/<script>([\s\S]*?)<\/script>/);

if (!match) throw new Error('Script do catálogo não encontrado.');
const staticMarkup = html.slice(0, html.indexOf('<script>'));
const htmlIds = Array.from(staticMarkup.matchAll(/\bid="([^"]+)"/g), (entry) => entry[1]);
const duplicateIds = Array.from(new Set(htmlIds.filter((id, index) => htmlIds.indexOf(id) !== index)));
if (duplicateIds.length) throw new Error('IDs HTML duplicados: ' + duplicateIds.join(', '));
new Function(match[1]);

class FakeClassList {
  constructor() { this.values = new Set(); }
  add(...names) { names.forEach((name) => this.values.add(name)); }
  remove(...names) { names.forEach((name) => this.values.delete(name)); }
  toggle(name, force) {
    const enabled = force === undefined ? !this.values.has(name) : force;
    if (enabled) this.values.add(name);
    else this.values.delete(name);
    return enabled;
  }
  contains(name) { return this.values.has(name); }
}

class FakeElement {
  constructor(id) {
    this.id = id;
    this.dataset = {};
    this.classList = new FakeClassList();
    this.hidden = false;
    this.disabled = false;
    this.value = '';
    this.textContent = '';
    this.innerHTML = '';
  }
  addEventListener() {}
  setAttribute() {}
  querySelectorAll() { return []; }
  querySelector() { return null; }
  closest() { return null; }
}

const elements = new Map();
const document = {
  getElementById(id) {
    if (!elements.has(id)) elements.set(id, new FakeElement(id));
    return elements.get(id);
  },
  addEventListener() {},
  querySelectorAll() { return []; }
};
const storage = new Map();
const localStorage = {
  getItem(key) { return storage.has(key) ? storage.get(key) : null; },
  setItem(key, value) { storage.set(key, String(value)); }
};
const window = {
  localStorage,
  confirm: () => true,
  setTimeout(callback) { callback(); return 0; },
  clearTimeout() {}
};

global.document = document;
global.localStorage = localStorage;
global.window = window;

const tests = String.raw`
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(backpackItems.length === 0, 'A mochila deveria iniciar vazia.');
characterProfiles = { activeId: 'test-character', profiles: [{ id: 'test-character', name: 'Teste', strength: 10, backpack: backpackItems }] };
addPackagesToBackpack('espada_longa', 1);
addPackagesToBackpack('espada_longa', 1);
assert(backpackItems.length === 1, 'Cópias sem melhoria deveriam ser agrupadas.');
assert(backpackItems[0].quantity === 2, 'A quantidade agrupada está incorreta.');

let instance = backpackItems[0];
let sword = itemById.get('espada_longa');
instance.quantity = 1;
instance.improvements = [
  { id: 'certeira', materialId: '' },
  { id: 'cruel', materialId: '' },
  { id: 'atroz', materialId: '' },
  { id: 'material_especial', materialId: 'mitral' }
];
sanitizeInstanceImprovements(instance, sword);
assert(instance.improvements.length === 4, 'Quatro melhorias válidas não foram preservadas.');
assert(entryValueInfo(instance, sword).unitKnown === 19515, 'O valor com quatro melhorias e mitral está incorreto.');
assert((backpackItemHtml(instance).match(/data-action="improvement"/g) || []).length === 4, 'A ficha do item não exibiu quatro seletores de melhoria.');

let shield = itemById.get('escudo_pesado');
let enchantedShield = { instanceId: 'shield', itemId: 'escudo_pesado', quantity: 1, improvements: [], enchantments: ['defensor'] };
sanitizeInstanceEnchantments(enchantedShield, shield);
let enchantedValue = entryValueInfo(enchantedShield, shield);
assert(enchantedShield.enchantments.length === 1, 'O encanto válido do escudo não foi preservado.');
assert(enchantedValue.unitKnown === 18015, 'O preço de um escudo com um encanto está incorreto.');
assert(enchantedValue.craftCd === 30, 'A CD de fabricação com um encanto está incorreta.');
assert(enchantedValue.craftCost === 6005, 'O custo de fabricação com um encanto está incorreto.');
assert(enchantmentDetailsHtml(enchantedShield, shield).includes('Menor'), 'A categoria mágica menor não foi exibida.');
const renderedEnchantmentSelectors = (backpackItemHtml(enchantedShield).match(/data-action="enchantment"/g) || []).length;
assert(renderedEnchantmentSelectors === 3, 'A ficha do escudo exibiu ' + renderedEnchantmentSelectors + ' seletores de encanto em vez de três.');

enchantedShield.enchantments = ['guardiao'];
sanitizeInstanceEnchantments(enchantedShield, shield);
assert(enchantedShield.enchantments.length === 0, 'Guardião sem Defensor deveria ser removido.');
enchantedShield.enchantments = ['defensor', 'guardiao'];
sanitizeInstanceEnchantments(enchantedShield, shield);
assert(enchantedShield.enchantments.length === 2, 'Guardião com Defensor deveria ser preservado.');

let maximumMagic = entryValueInfo({
  quantity: 1,
  improvements: [{ id: 'certeira' }, { id: 'cruel' }, { id: 'equilibrada' }, { id: 'guarda' }],
  enchantments: ['formidavel', 'magnifica', 'veloz']
}, sword);
assert(maximumMagic.unitKnown === 90015, 'O preço do exemplo com quatro melhorias e três encantos está incorreto.');
assert(maximumMagic.craftCd === 60, 'A CD do exemplo com quatro melhorias e três encantos está incorreta.');
assert(maximumMagic.craftCost === 30005, 'O custo do exemplo com quatro melhorias e três encantos está incorreto.');

let specificItem = itemById.get('armadura_da_luz');
let specificInstance = { instanceId: 'specific', itemId: 'armadura_da_luz', quantity: 1, improvements: [{ id: 'reforcada' }], enchantments: ['defensor'] };
sanitizeInstanceImprovements(specificInstance, specificItem);
sanitizeInstanceEnchantments(specificInstance, specificItem);
let specificValue = entryValueInfo(specificInstance, specificItem);
assert(specificInstance.improvements.length === 0 && specificInstance.enchantments.length === 0, 'Item específico não deveria aceitar personalizações adicionais.');
assert(specificValue.unitKnown === 150000 && specificValue.craftCd === 50, 'Preço ou CD do item específico está incorreto.');
assert(specificValue.magicCategory && specificValue.magicCategory.bonusPv === 40, 'A durabilidade de item maior está incorreta.');
assert(!backpackItemHtml(specificInstance).includes('data-action="enchantment"'), 'Item específico exibiu seletor de encantos.');

let weaponEnchantments = enchantments.filter(function(enchantment) { return enchantment.aplicacoesIds.includes('arma'); });
assert(weaponEnchantments.length === 50, 'O catálogo deveria conter 50 encantos de armas básicos e de Heróis de Arton.');
let enchantedSword = { instanceId: 'weapon', itemId: 'espada_longa', quantity: 1, improvements: [], enchantments: ['formidavel', 'magnifica'] };
sanitizeInstanceEnchantments(enchantedSword, sword);
assert(enchantedSword.enchantments.length === 2 && enchantmentSlotsUsed(enchantedSword.enchantments) === 3, 'Encantos de arma válidos não foram preservados.');
assert((backpackItemHtml(enchantedSword).match(/data-action="enchantment"/g) || []).length === 3, 'A arma não exibiu três seletores de encanto.');

let club = itemById.get('clava');
assert(!materialOptionsForItem(club).some(function(material) { return material.id === 'cristal_de_sol'; }), 'Cristal de Sol não deveria aceitar arma apenas de impacto.');
assert(materialOptionsForItem(sword).some(function(material) { return material.id === 'cristal_de_sol'; }), 'Cristal de Sol deveria aceitar arma de corte.');

instance.improvements = [{ id: 'atroz', materialId: '' }];
sanitizeInstanceImprovements(instance, sword);
assert(instance.improvements.length === 0, 'Uma melhoria sem pré-requisito deveria ser removida.');

instance.improvements = [{ id: 'macica', materialId: '' }, { id: 'precisa', materialId: '' }];
sanitizeInstanceImprovements(instance, sword);
assert(instance.improvements.length === 1 && instance.improvements[0].id === 'macica', 'A incompatibilidade não foi aplicada.');

instance.improvements = [
  { id: 'certeira', materialId: '' },
  { id: 'cruel', materialId: '' },
  { id: 'equilibrada', materialId: '' },
  { id: 'guarda', materialId: '' },
  { id: 'pressurizada', materialId: '' }
];
sanitizeInstanceImprovements(instance, sword);
assert(instance.improvements.length === 4, 'O limite de quatro melhorias não foi aplicado.');

let twoSpaceItem = preparedItems.find(function(item) {
  return item.espacos === 2 && itemImprovementCategory(item);
});
let discreteInstance = { quantity: 1, improvements: [{ id: 'discreto', materialId: '' }] };
assert(improvementSpacePerUnit(discreteInstance, twoSpaceItem) === 1, 'A melhoria Discreto não reduziu os espaços.');

assert(preparedItems.every(function(item) { return Number.isFinite(Number(item.espacos)) && Number(item.espacos) >= 0; }), 'Ha item sem espacos validos.');
let mace = itemById.get('maca');
assert(improvementSpacePerUnit({ improvements: [] }, mace) === 1, 'O espaco basico da maca deveria ser 1.');

['alforje', 'cao_de_caca', 'cavalo', 'estabulo_por_dia', 'ponei', 'trobo'].forEach(function(itemId) {
  const describedItem = itemById.get(itemId);
  assert(describedItem && describedItem.textos && describedItem.textos.descricao, itemId + ' deveria possuir descricao.');
});

let broadSearchCount;
let nameSearchCount;
state.search = 'item';
state.searchNameOnly = false;
broadSearchCount = filteredItems().length;
state.searchNameOnly = true;
nameSearchCount = filteredItems().length;
assert(broadSearchCount > nameSearchCount, 'A pesquisa ampla e a pesquisa somente por nome deveriam produzir resultados diferentes.');
state.search = '';
state.searchNameOnly = false;

let workerTool = itemById.get('ferramenta_pesada_lanca');
let workerChoice = { options: { customName: 'Malho', weaponModel: 'maca' }, improvements: [], enchantments: [] };
let effectiveWorkerTool = effectiveItemForOptions(workerTool, workerChoice);
assert(configuredItemName(workerChoice, workerTool) === 'Malho (maça)', 'O nome configurado da ferramenta do trabalhador esta incorreto.');
assert(effectiveWorkerTool.arma.dano.principal === mace.arma.dano.principal && effectiveWorkerTool.espacos === mace.espacos, 'A escolha de maca nao aplicou suas estatisticas.');
assert(ITEM_CHOICE_DEFINITIONS.instrumentos_de_oficio.fields[0].options.length === 16, 'A lista de oficios esta incompleta.');

let familyJewel = itemById.get('joia_de_familia');
assert(familyJewel && familyJewel.preco.valor === 300 && ITEM_CHOICE_DEFINITIONS.joia_de_familia, 'A Joia de Familia nao foi cadastrada corretamente.');
let fakeJewel = itemById.get('joia_falsificada');
assert(fakeJewel && fakeJewel.semValorReal && fakeJewel.preco.valor === 0 && fakeJewel.precoAparente === 100, 'A Joia Falsificada nao separou corretamente o valor real do aparente.');
assert(formatPrice(fakeJewel) === 'Sem valor real' && itemStats(fakeJewel).includes('Valor aparente'), 'O card da Joia Falsificada nao exibe seus valores corretamente.');
let fakeJewelValue = entryValueInfo({ quantity: 1, improvements: [], enchantments: [] }, fakeJewel);
assert(fakeJewelValue.totalKnown === 0 && formatEntryValue(fakeJewelValue, false).includes('aparenta T$ 100'), 'O valor de compra da Joia Falsificada deveria ser zero.');
let cardMarkup = itemCard(familyJewel);
assert(cardMarkup.includes('data-action="toggle-item"') && cardMarkup.includes('Ver item completo') && cardMarkup.includes('item-card-detail'), 'O cartao expansivel do catalogo esta incompleto.');
assert(!cardMarkup.includes('data-action="debug-edit-item"'), 'O controle debug apareceu com o modo desativado.');
state.debugMode = true;
assert(itemCard(familyJewel).includes('data-action="debug-edit-item"'), 'O modo debug nao exibiu a edicao de item canonico.');
state.debugMode = false;

debugItemOverrides.joia_de_familia = { nome: 'Joia Corrigida', textos: { habilidade: '', variavel: '', descricao: 'Descricao corrigida.' } };
let correctedFamilyJewel = rebuildCanonicalPreparedItem('joia_de_familia');
assert(correctedFamilyJewel.nome === 'Joia Corrigida' && correctedFamilyJewel.debugEdited, 'A sobreposicao debug nao foi aplicada.');
assert(canonicalItemById.get('joia_de_familia').nome === 'Joia de Família', 'O modo debug alterou o dado canonico embutido.');
delete debugItemOverrides.joia_de_familia;
let restoredFamilyJewel = rebuildCanonicalPreparedItem('joia_de_familia');
assert(restoredFamilyJewel.nome === 'Joia de Família' && !restoredFamilyJewel.debugEdited, 'A restauracao canonica do modo debug falhou.');

state.inspirationMode = true;
let inspirationCardMarkup = itemCard(familyJewel);
assert(inspirationCardMarkup.includes('inspiration-select-button') && inspirationCardMarkup.includes('Escolher inspiração'), 'O modo de inspiracao nao exibiu o botao azul.');
assert(!inspirationCardMarkup.includes('data-action="add-to-cart"'), 'O botao de compra continuou ativo durante a escolha de inspiracao.');
state.inspirationMode = false;

let dagger = itemById.get('adaga');
customItemInspirationTemplate = cloneInspirationItem(dagger);
const originalFormData = global.FormData;
global.FormData = function(form) {
  this.get = function(name) { return Object.prototype.hasOwnProperty.call(form.values, name) ? form.values[name] : null; };
};
let inspiredDagger = buildCustomItem({ values: {
  name: 'Adaga Inspirada', type: 'arma', category: 'simples', price: '25', spaces: '1',
  grant: 'Novo beneficio', ability: 'Nova regra', description: 'Nova descricao', weaponDamage: '1d6',
  criticalMargin: '18', criticalMultiplier: '3', combat: 'corpo_a_corpo', grip: 'leve',
  range: 'curto', damageType: 'perfuracao', specific: 'on', magicTier: 'medio',
  fixedImprovement1: 'certeira', fixedImprovement2: 'material_especial', fixedMaterial: 'mitral',
  fixedEnchantment1: 'formidavel'
} });
global.FormData = originalFormData;
customItemInspirationTemplate = null;
assert(inspiredDagger.nome === 'Adaga Inspirada' && inspiredDagger.arma.dano.principal === '1d6', 'Os campos modificados da inspiracao nao foram aplicados.');
assert(inspiredDagger.arma.propriedadesIds.includes('ocultavel') && inspiredDagger.efeitos.length === dagger.efeitos.length, 'As propriedades internas da inspiracao nao foram preservadas.');
assert(inspiredDagger.magico && inspiredDagger.magico.melhoriasFixasIds.includes('certeira') && inspiredDagger.magico.materialEspecialId === 'mitral', 'As melhorias fixas do item criado nao foram preservadas.');
assert(inspiredDagger.magico.encantosFixosIds.includes('formidavel'), 'Os encantos fixos do item criado nao foram preservados.');
let managedCustomCard = itemCard(prepareCatalogItem(inspiredDagger));
assert(managedCustomCard.includes('data-action="edit-custom-item"') && managedCustomCard.includes('data-action="delete-custom-item"'), 'Os controles de editar e apagar nao apareceram no item adicionado.');

persistBackpack();
assert(JSON.parse(storage.get(CHARACTER_PROFILES_STORAGE_KEY)).profiles[0].backpack.length === 1, 'A persistência da mochila falhou.');
assert(itemById.get('racao_de_viagem').preco.valor === 1 && itemById.get('racao_de_viagem').espacos === 0.5, 'Ração de viagem incorreta.');
assert(itemById.get('animal_nao_combativo').preco.valor === 1 && itemById.get('animal_nao_combativo').espacos === 0, 'Animal não combativo incorreto.');
assert(normalizeItemOptions('animal_nao_combativo',{customName:'Galinha'}).customName === 'Galinha', 'Nome do animal não foi preservado.');
const exotic = itemById.get('instrumento_musical_exotico');
assert(effectiveItemForOptions(exotic,{options:{customName:'Sanfona',customSpaces:2.5}}).espacos === 2.5, 'Espaços do instrumento exótico não foram aplicados.');

console.log(JSON.stringify({
  status: 'ok',
  item: sword.nome,
  valorComQuatroMelhorias: entryValueInfo({
    quantity: 1,
    improvements: [
      { id: 'certeira' },
      { id: 'cruel' },
      { id: 'atroz' },
      { id: 'material_especial', materialId: 'mitral' }
    ]
  }, sword).unitKnown,
  limite: instance.improvements.length,
  espacosComDiscreto: improvementSpacePerUnit(discreteInstance, twoSpaceItem)
}));
`;

eval(match[1] + '\n' + tests);
