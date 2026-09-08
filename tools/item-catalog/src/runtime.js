function normalizeText(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function humanize(value) {
  const text = String(value || '').replace(/_/g, ' ');
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : 'Outros';
}

function getBooks(item) {
  let books = Array.isArray(item.livrosOrigemIds) ? item.livrosOrigemIds.filter(Boolean) : [];
  if (!books.length && item.livroOrigemId) books = [item.livroOrigemId];
  return books.length ? Array.from(new Set(books)) : ['sem_livro'];
}

const ITEM_CHOICE_DEFINITIONS = {
  instrumentos_de_oficio: {
    fields: [{ id: 'oficio', label: 'Ofício', type: 'select', options: [
      ['alquimia', 'Ofício (Alquimia)'], ['armeiro', 'Ofício (Armeiro)'], ['artesao', 'Ofício (Artesão)'],
      ['culinaria', 'Ofício (Culinária)'], ['alfaiate', 'Ofício (Alfaiate)'], ['alvenaria', 'Ofício (Alvenaria)'],
      ['carpinteiro', 'Ofício (Carpinteiro)'], ['joalheiro', 'Ofício (Joalheiro)'], ['fazendeiro', 'Ofício (Fazendeiro)'],
      ['pescador', 'Ofício (Pescador)'], ['estalajadeiro', 'Ofício (Estalajadeiro)'], ['escriba', 'Ofício (Escriba)'],
      ['escultor', 'Ofício (Escultor)'], ['engenhoqueiro', 'Ofício (Engenhoqueiro)'], ['pintor', 'Ofício (Pintor)'],
      ['minerador', 'Ofício (Minerador)']
    ] }]
  },
  ferramenta_pesada: {
    fields: [{ id: 'customName', label: 'Nome da ferramenta', type: 'text', placeholder: 'Ex. Malho' }]
  },
  ferramenta_pesada_lanca: {
    fields: [
      { id: 'customName', label: 'Nome da ferramenta', type: 'text', placeholder: 'Ex. Picareta' },
      { id: 'weaponModel', label: 'Usar estatísticas de', type: 'select', options: [['lanca', 'Lança'], ['maca', 'Maça']] }
    ]
  },
  ferramenta_agricola: {
    fields: [{ id: 'customName', label: 'Nome da ferramenta', type: 'text', placeholder: 'Ex. Forcado' }]
  },
  colecao_de_livros: {
    fields: [{ id: 'knowledge', label: 'Perícia beneficiada', type: 'select', options: [
      ['conhecimento', 'Conhecimento'], ['guerra', 'Guerra'], ['misticismo', 'Misticismo'], ['nobreza', 'Nobreza'], ['religiao', 'Religião']
    ] }]
  },
  instrumento_musical: {
    fields: [{ id: 'customName', label: 'Nome do instrumento', type: 'text', placeholder: 'Ex. Bandolim, flauta ou lira' }]
  },
  instrumento_musical_exotico: {
    fields: [
      { id: 'customName', label: 'Nome do instrumento', type: 'text', placeholder: 'Ex. Sanfona' },
      { id: 'customSpaces', label: 'Espaços definidos pelo mestre', type: 'number', placeholder: 'Ex. 2' }
    ]
  },
  animal_nao_combativo: {
    fields: [{ id: 'customName', label: 'Nome do animal', type: 'text', placeholder: 'Ex. Galinha, porco ou ovelha' }]
  },
  joia_de_familia: {
    fields: [{ id: 'customName', label: 'Nome da joia', type: 'text', placeholder: 'Ex. Colar, pingente, bracelete ou anel' }]
  }
};

function normalizeItemOptions(itemId, raw) {
  const definition = ITEM_CHOICE_DEFINITIONS[itemId];
  if (!definition) return {};
  const source = raw && typeof raw === 'object' ? raw : {};
  return definition.fields.reduce(function(result, field) {
    if (field.type === 'select') {
      const allowed = field.options.map(function(option) { return option[0]; });
      result[field.id] = allowed.includes(source[field.id]) ? source[field.id] : allowed[0];
    } else if (field.type === 'number') {
      result[field.id] = source[field.id] === '' || source[field.id] == null ? '' : Math.max(0, Number(source[field.id]) || 0);
    } else {
      result[field.id] = String(source[field.id] || '').trim().slice(0, 80);
    }
    return result;
  }, {});
}

function itemOptionsKey(itemId, raw) {
  const options = normalizeItemOptions(itemId, raw);
  return Object.keys(options).sort().map(function(key) { return key + ':' + options[key]; }).join('|');
}

function loadCustomItems() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CUSTOM_ITEMS_STORAGE_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    const allowedTypes = new Set(['arma', 'municao', 'armadura', 'escudo', 'item_geral', 'acessorio']);
    return parsed.filter(function(item) {
      return item && String(item.id || '').startsWith('adicionado_') && item.nome && allowedTypes.has(item.tipo);
    }).map(function(item) {
      item.adicionado = true;
      item.livroOrigemId = 'adicionado';
      item.livrosOrigemIds = ['adicionado'];
      item.preco = { valor: Math.max(0, Number(item.preco && item.preco.valor) || 0), moeda: 'T$' };
      item.espacos = Math.max(0, Number(item.espacos) || 0);
      return item;
    });
  } catch (error) {
    return [];
  }
}

function loadDebugItemOverrides() {
  try {
    const parsed = JSON.parse(localStorage.getItem(DEBUG_ITEM_OVERRIDES_STORAGE_KEY) || '{}');
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') return {};
    return Object.keys(parsed).reduce(function(result, itemId) {
      const patch = parsed[itemId];
      if (!patch || typeof patch !== 'object') return result;
      result[itemId] = {
        nome: String(patch.nome || '').trim().slice(0, 100),
        textos: {
          habilidade: String(patch.textos && patch.textos.habilidade || '').slice(0, 4000),
          variavel: String(patch.textos && patch.textos.variavel || '').slice(0, 8000),
          descricao: String(patch.textos && patch.textos.descricao || '').slice(0, 8000)
        }
      };
      return result;
    }, {});
  } catch (error) {
    return {};
  }
}

function applyDebugItemOverride(sourceItem) {
  const patch = debugItemOverrides[sourceItem.id];
  if (!patch) return sourceItem;
  return Object.assign({}, sourceItem, {
    nome: patch.nome || sourceItem.nome,
    textos: Object.assign({}, sourceItem.textos || {}, patch.textos || {}),
    debugEdited: true
  });
}

function prepareCatalogItem(sourceItem) {
  let item = sourceItem;
  if (!sourceItem.debugEdited && sourceItem.id === 'ferramenta_pesada') {
    item = Object.assign({}, sourceItem, { nome: 'Ferramenta Pesada (Escravo)' });
  } else if (!sourceItem.debugEdited && sourceItem.id === 'ferramenta_pesada_lanca') {
    item = Object.assign({}, sourceItem, {
      nome: 'Ferramenta Pesada (Trabalhador)',
      textos: Object.assign({}, sourceItem.textos || {}, { habilidade: 'Mesmas estatísticas de uma maça ou lança, a sua escolha.' })
    });
  } else if (!sourceItem.debugEdited && sourceItem.id === 'ferramenta_agricola') {
    item = Object.assign({}, sourceItem, { nome: 'Ferramenta Agrícola (Fazendeiro)' });
  }
  const baseItem = item.magico && item.magico.baseItemId
    ? ITEMS.find(function(candidate) { return candidate.id === item.magico.baseItemId; })
    : null;
  const searchParts = [
    item.nome, item.tipo, item.categoriaId,
    item.textos && item.textos.habilidade,
    item.textos && item.textos.variavel,
    item.textos && item.textos.descricao,
    item.arma && item.arma.combateId,
    item.arma && item.arma.empunhaduraId,
    item.arma && item.arma.propriedadesIds && item.arma.propriedadesIds.join(' '),
    item.arma && item.arma.tipoDanoIds && item.arma.tipoDanoIds.join(' '),
    item.magico && item.magico.tipo,
    item.magico && item.magico.categoriaId,
    item.magico && item.magico.encantosFixosIds && item.magico.encantosFixosIds.join(' '),
    item.magico && item.magico.melhoriasFixasIds && item.magico.melhoriasFixasIds.join(' '),
    item.magico && item.magico.encantosFixosIds && item.magico.encantosFixosIds.map(humanize).join(' '),
    item.magico && item.magico.melhoriasFixasIds && item.magico.melhoriasFixasIds.map(humanize).join(' '),
    item.magico && item.magico.materialEspecialId,
    item.magico && item.magico.materialEspecialId && humanize(item.magico.materialEspecialId),
    item.magico && item.magico.divindade,
    item.magico && item.magico.manifestacaoLiturgica,
    item.magico && item.magico.tipo === 'liturgico' && LITURGICAL_IDENTIFICATION_RULE,
    baseItem && baseItem.nome,
    item.magico && item.magico.faixaD100,
    item.origem,
    item.precoAparente && ('valor aparente T$ ' + item.precoAparente),
    item.semValorReal && 'sem valor real'
  ];
  return Object.assign({}, item, {
    _books: getBooks(item),
    _search: normalizeText(searchParts.join(' ')),
    _searchName: normalizeText(item.nome)
  });
}

const customItems = loadCustomItems();
const canonicalItems = ITEMS.concat(EXTRA_MAGIC_ITEMS, ADDITIONAL_STANDARD_ITEMS);
const canonicalItemById = new Map(canonicalItems.map(function(item) { return [item.id, item]; }));
const debugItemOverrides = loadDebugItemOverrides();
const preparedItems = canonicalItems.map(applyDebugItemOverride).concat(customItems).map(prepareCatalogItem);

const allBooks = Array.from(new Set(preparedItems.flatMap(function(item) { return item._books; }))).sort(function(a, b) {
  const ai = BOOK_ORDER.indexOf(a);
  const bi = BOOK_ORDER.indexOf(b);
  return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi) || String(a).localeCompare(String(b), 'pt-BR');
});

const itemById = new Map(preparedItems.map(function(item) { return [item.id, item]; }));
const improvements = (IMPROVEMENT_DATA.melhorias || []).slice().sort(function(a, b) {
  return a.nome.localeCompare(b.nome, 'pt-BR');
});
const improvementById = new Map(improvements.map(function(improvement) { return [improvement.id, improvement]; }));
const materials = (IMPROVEMENT_DATA.materiaisEspeciais || []).slice().sort(function(a, b) {
  return a.nome.localeCompare(b.nome, 'pt-BR');
});
const materialById = new Map(materials.map(function(material) { return [material.id, material]; }));
const materialCosts = new Map((IMPROVEMENT_DATA.custosMateriaisBasicos || []).map(function(entry) {
  return [entry.materialEspecialId, entry.custos || {}];
}));
const enchantments = (ENCHANTMENT_DATA.encantamentos || []).slice().sort(function(a, b) {
  return a.nome.localeCompare(b.nome, 'pt-BR');
});
const enchantmentById = new Map(enchantments.map(function(enchantment) { return [enchantment.id, enchantment]; }));
const magicCategories = new Map((MAGIC_RULES.categorias || []).map(function(category) {
  return [Number(category.quantidade), category];
}));

function createInstanceId() {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
}

function itemChoiceLabel(itemId, fieldId, value) {
  const definition = ITEM_CHOICE_DEFINITIONS[itemId];
  const field = definition && definition.fields.find(function(candidate) { return candidate.id === fieldId; });
  const option = field && field.options && field.options.find(function(candidate) { return candidate[0] === value; });
  return option ? option[1] : String(value || '');
}

function effectiveItemForOptions(item, holder) {
  if (!item) return item;
  const options = normalizeItemOptions(item.id, holder && holder.options);
  if (item.id === 'instrumento_musical_exotico') return Object.assign({}, item, { espacos: options.customSpaces === '' ? 0 : Number(options.customSpaces) });
  if (item.id !== 'ferramenta_pesada_lanca') return item;
  const base = itemById.get(options.weaponModel === 'maca' ? 'maca' : 'lanca');
  if (!base) return item;
  return Object.assign({}, item, {
    categoriaId: base.categoriaId,
    preco: Object.assign({}, base.preco),
    espacos: base.espacos,
    equipamento: Object.assign({}, base.equipamento || {}),
    arma: Object.assign({}, base.arma || {}),
    textos: Object.assign({}, item.textos || {}, {
      habilidade: 'Mesmas estatísticas de uma ' + (options.weaponModel === 'maca' ? 'maça.' : 'lança.')
    })
  });
}

function ammoPackageSize(item) {
  return item && item.tipo === 'municao' ? 20 : 0;
}

function normalizeStrength(value) {
  const number = Math.trunc(Number(value));
  return Number.isFinite(number) ? number : 0;
}

function normalizeStoredImprovement(value) {
  if (typeof value === 'string') return improvementById.has(value) ? { id: value, materialId: '' } : null;
  if (!value || !improvementById.has(value.id)) return null;
  return {
    id: value.id,
    materialId: value.id === 'material_especial' && materialById.has(value.materialId) ? value.materialId : ''
  };
}

function normalizeStoredEnchantment(value) {
  const id = typeof value === 'string' ? value : value && value.id;
  return enchantmentById.has(id) ? id : null;
}

function normalizeBackpackEntries(parsed) {
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(function(entry) {
      return entry && entry.itemId;
    }).map(function(entry) {
      if (!itemById.has(entry.itemId)) {
        itemById.set(entry.itemId, prepareCatalogItem(entry.itemSnapshot || {id:entry.itemId,nome:entry.displayName || entry.itemId,tipo:'item_geral',categoriaId:'equipamento_aventura',espacos:0,preco:{valor:0,moeda:'T$'},descricao:'Referência não encontrada no catálogo. Os dados salvos foram preservados; confira o preço e os espaços antes de usar os totais.'}));
        return {...entry,instanceId:entry.instanceId || createInstanceId(),quantity:Math.max(1,Number(entry.quantity)||1),improvements:entry.improvements||[],enchantments:entry.enchantments||[]};
      }
      const item = itemById.get(entry.itemId);
      const quantity = Math.max(1, Math.min(9999, Math.floor(Number(entry.quantity) || 1)));
      const packageSize = ammoPackageSize(item);
      return {
        ...entry,
        instanceId: String(entry.instanceId || createInstanceId()),
        itemId: entry.itemId,
        quantity: quantity,
        options: normalizeItemOptions(entry.itemId, entry.options),
        ammoRemaining: packageSize
          ? Math.max(0, Math.min(quantity * packageSize, Math.floor(Number(entry.ammoRemaining) >= 0 ? Number(entry.ammoRemaining) : quantity * packageSize)))
          : undefined,
        improvements: (Array.isArray(entry.improvements) ? entry.improvements : [])
          .map(normalizeStoredImprovement).filter(Boolean).slice(0, 4),
        enchantments: (Array.isArray(entry.enchantments) ? entry.enchantments : [])
          .map(normalizeStoredEnchantment).filter(Boolean).slice(0, MAX_ENCHANTMENTS)
      };
    });
}

function loadBackpack() {
  try {
    const raw = localStorage.getItem(BACKPACK_STORAGE_KEY);
    return normalizeBackpackEntries(raw ? JSON.parse(raw) : []);
  } catch (error) {
    return [];
  }
}

function loadCharacterProfiles() {
  try {
    const raw = localStorage.getItem(CHARACTER_PROFILES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const profiles = (Array.isArray(parsed.profiles) ? parsed.profiles : []).map(function(profile) {
        return {
          ...profile,
          id: String(profile.id || ('personagem-' + createInstanceId())),
          name: String(profile.name || 'Personagem').trim().slice(0, 60) || 'Personagem',
          strength: normalizeStrength(profile.strength),
          backpack: normalizeBackpackEntries(profile.backpack)
        };
      });
      const activeId = profiles.some(function(profile) { return profile.id === parsed.activeId; }) ? parsed.activeId : null;
      return { activeId: activeId, profiles: profiles };
    }
  } catch (error) {}
  const legacy = loadBackpack();
  if (legacy.length) {
    const id = 'personagem-' + createInstanceId();
    return { activeId: id, profiles: [{ id: id, name: 'Personagem 1', strength: 0, backpack: legacy }] };
  }
  return { activeId: null, profiles: [] };
}

function loadCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(function(entry) { return entry && itemById.has(entry.itemId); }).map(function(entry) {
      return {
        entryId: String(entry.entryId || ('carrinho-' + createInstanceId())),
        itemId: entry.itemId,
        quantity: Math.max(1, Math.min(9999, Math.floor(Number(entry.quantity) || 1))),
        options: normalizeItemOptions(entry.itemId, entry.options),
        improvements: (Array.isArray(entry.improvements) ? entry.improvements : []).map(normalizeStoredImprovement).filter(Boolean).slice(0,4),
        enchantments: (Array.isArray(entry.enchantments) ? entry.enchantments : []).map(normalizeStoredEnchantment).filter(Boolean).slice(0,MAX_ENCHANTMENTS)
      };
    });
  } catch (error) {
    return [];
  }
}

function loadBackpackMode() {
  try { return localStorage.getItem(BACKPACK_MODE_STORAGE_KEY) === 'cards' ? 'cards' : 'list'; }
  catch (error) { return 'list'; }
}

let characterProfiles = loadCharacterProfiles();
let backpackItems = [];
let cartItems = loadCart();
const purchaseDrafts = new Map();
let expandedBackpackInstanceId = null;
let reopenCartAfterCharacter = false;
let editingCharacterId = null;
const initialCharacter = characterProfiles.profiles.find(function(profile) { return profile.id === characterProfiles.activeId; });
if (initialCharacter) backpackItems = initialCharacter.backpack;
const openImprovementPanels = new Set();
const openEnchantmentPanels = new Set();
const catalogOptionDrafts = new Map();
let customItemInspirationTemplate = null;
let customItemDraftBeforeInspiration = null;
let customItemTemplateBeforeInspiration = null;
let editingCustomItemId = null;
let debugEditingItemId = null;

const state = {
  books: new Set(allBooks),
  type: 'todos',
  specific: 'convencional',
  category: 'todos',
  combat: 'todos',
  grip: 'todos',
  search: '',
  searchNameOnly: false,
  debugMode: false,
  inspirationMode: false,
  sort: 'name',
  view: 'catalog',
  backpackMode: loadBackpackMode()
};

const typeFilters = document.getElementById('typeFilters');
const specificFilters = document.getElementById('specificFilters');
const contextFilters = document.getElementById('contextFilters');
const categoryFilters = document.getElementById('categoryFilters');
const weaponFilters = document.getElementById('weaponFilters');
const combatFilters = document.getElementById('combatFilters');
const gripFilters = document.getElementById('gripFilters');
const searchInput = document.getElementById('searchInput');
const nameOnlySearchButton = document.getElementById('nameOnlySearchButton');
const advancedFiltersButton = document.getElementById('advancedFiltersButton');
const advancedFiltersContent = document.getElementById('advancedFiltersContent');
const debugModeButton = document.getElementById('debugModeButton');
const sortSelect = document.getElementById('sortSelect');
const itemsGrid = document.getElementById('itemsGrid');
const resultCount = document.getElementById('resultCount');
const catalogTitle = document.getElementById('catalogTitle');
const inspirationBar = document.getElementById('inspirationBar');
const cancelInspirationButton = document.getElementById('cancelInspirationButton');
const emptyState = document.getElementById('emptyState');
const filtersPanel = document.getElementById('filtersPanel');
const catalogView = document.getElementById('catalogView');
const backpackView = document.getElementById('backpackView');
const catalogViewBtn = document.getElementById('catalogViewBtn');
const backpackViewBtn = document.getElementById('backpackViewBtn');
const backpackViewCount = document.getElementById('backpackViewCount');
const strengthInput = document.getElementById('strengthInput');
const loadStats = document.getElementById('loadStats');
const backpackSummary = document.getElementById('backpackSummary');
const backpackList = document.getElementById('backpackList');
const backpackEmpty = document.getElementById('backpackEmpty');
const clearBackpack = document.getElementById('clearBackpack');
const backpackListModeBtn = document.getElementById('backpackListModeBtn');
const backpackCardsModeBtn = document.getElementById('backpackCardsModeBtn');
const characterButton = document.getElementById('characterButton');
const characterButtonLabel = document.getElementById('characterButtonLabel');
const characterModal = document.getElementById('characterModal');
const characterForm = document.getElementById('characterForm');
const characterNameInput = document.getElementById('characterNameInput');
const characterList = document.getElementById('characterList');
const cartButton = document.getElementById('cartButton');
const cartCount = document.getElementById('cartCount');
const cartModal = document.getElementById('cartModal');
const cartDecisionNote = document.getElementById('cartDecisionNote');
const cartList = document.getElementById('cartList');
const cartSummary = document.getElementById('cartSummary');
const clearCart = document.getElementById('clearCart');
const cartReturnCatalog = document.getElementById('cartReturnCatalog');
const cartViewBackpack = document.getElementById('cartViewBackpack');
const checkoutCart = document.getElementById('checkoutCart');
const resetFilters = document.getElementById('resetFilters');
const statusToast = document.getElementById('statusToast');
const customItemButton = document.getElementById('customItemButton');
const customItemModal = document.getElementById('customItemModal');
const customItemModalTitle = document.getElementById('customItemModalTitle');
const customItemNote = document.getElementById('customItemNote');
const customItemForm = document.getElementById('customItemForm');
const searchInspirationButton = document.getElementById('searchInspirationButton');
const customItemName = document.getElementById('customItemName');
const customItemType = document.getElementById('customItemType');
const customItemCategory = document.getElementById('customItemCategory');
const customItemSpecific = document.getElementById('customItemSpecific');
const customMagicTierField = document.getElementById('customMagicTierField');
const customMagicComposition = document.getElementById('customMagicComposition');
const customFixedMaterialField = document.getElementById('customFixedMaterialField');
const saveCustomItemButton = document.getElementById('saveCustomItemButton');
const customWeaponFields = document.getElementById('customWeaponFields');
const customProtectionFields = document.getElementById('customProtectionFields');
const debugItemModal = document.getElementById('debugItemModal');
const debugItemForm = document.getElementById('debugItemForm');
const debugItemName = document.getElementById('debugItemName');
const debugItemGrant = document.getElementById('debugItemGrant');
const debugItemRules = document.getElementById('debugItemRules');
const debugItemDescription = document.getElementById('debugItemDescription');
const restoreDebugItemButton = document.getElementById('restoreDebugItemButton');

function countType(type) {
  return preparedItems.filter(function(item) { return item.tipo === type; }).length;
}

function openModal(modal) {
  if (!modal) return;
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
  if (!modal) return;
  modal.hidden = true;
  if (characterModal.hidden && cartModal.hidden && customItemModal.hidden && debugItemModal.hidden) document.body.style.overflow = '';
}

function syncCharacterUI() {
  const active = activeCharacterProfile();
  characterButtonLabel.textContent = active ? active.name + ' · Mudar personagem' : 'Cadastrar personagem';
  characterButton.title = active ? 'Mudar o personagem e a mochila ativa' : 'Cadastrar um personagem';
  strengthInput.disabled = !active;
  strengthInput.value = String(active ? normalizeStrength(active.strength) : 0);
}

function renderCharacterList() {
  if (!characterProfiles.profiles.length) {
    characterList.innerHTML = '<p class="modal-empty">Nenhum personagem cadastrado.</p>';
    return;
  }
  characterList.innerHTML = characterProfiles.profiles.map(function(profile) {
    const quantity = profile.backpack.reduce(function(total, entry) { return total + entry.quantity; }, 0);
    const active = profile.id === characterProfiles.activeId;
    if (editingCharacterId === profile.id) {
      return '<div class="character-entry' + (active ? ' active' : '') + '"><form class="character-rename-form" data-character-id="' +
        escapeHtml(profile.id) + '"><input class="modal-input" name="characterName" maxlength="60" autocomplete="off" value="' +
        escapeHtml(profile.name) + '" aria-label="Novo nome do personagem"><button class="primary-button" type="submit">Salvar</button>' +
        '<button class="secondary-button rename-cancel" type="button" data-action="cancel-rename">Cancelar</button></form></div>';
    }
    return '<div class="character-entry' + (active ? ' active' : '') + '"><div><strong>' + escapeHtml(profile.name) +
      '</strong><small>Força ' + normalizeStrength(profile.strength) + ' · ' + quantity + (quantity === 1 ? ' item na mochila' : ' itens na mochila') + '</small></div>' +
      '<div class="character-entry-actions">' +
      '<button class="secondary-button" type="button" data-action="select-character" data-character-id="' + escapeHtml(profile.id) + '"' +
      (active ? ' disabled' : '') + '>' + (active ? 'Em uso' : 'Abrir mochila') + '</button>' +
      '<button class="secondary-button rename-character-button" type="button" data-action="edit-character" data-character-id="' +
      escapeHtml(profile.id) + '" title="Mudar nome" aria-label="Mudar o nome de ' + escapeHtml(profile.name) + '">✎</button></div></div>';
  }).join('');
}

function renameCharacter(characterId, name) {
  const profile = characterProfiles.profiles.find(function(entry) { return entry.id === characterId; });
  const cleanName = String(name || '').trim().slice(0, 60);
  if (!profile || !cleanName) return;
  profile.name = cleanName;
  editingCharacterId = null;
  persistCharacterProfiles();
  syncCharacterUI();
  renderCharacterList();
  showToast('Personagem renomeado para ' + cleanName + '.');
}

function selectCharacter(characterId) {
  const profile = characterProfiles.profiles.find(function(entry) { return entry.id === characterId; });
  if (!profile) return;
  persistBackpack();
  characterProfiles.activeId = profile.id;
  backpackItems = profile.backpack;
  expandedBackpackInstanceId = null;
  openImprovementPanels.clear();
  openEnchantmentPanels.clear();
  persistCharacterProfiles();
  syncCharacterUI();
  renderCharacterList();
  refreshInventoryUI();
  closeModal(characterModal);
  showToast('Mochila de ' + profile.name + ' aberta.');
  if (reopenCartAfterCharacter) {
    reopenCartAfterCharacter = false;
    openCartDecision(false);
  }
}

function createCharacter(name) {
  const cleanName = String(name || '').trim().slice(0, 60);
  if (!cleanName) return;
  persistBackpack();
  const profile = { id: 'personagem-' + createInstanceId(), name: cleanName, strength: 0, backpack: [] };
  characterProfiles.profiles.push(profile);
  characterProfiles.activeId = profile.id;
  backpackItems = profile.backpack;
  expandedBackpackInstanceId = null;
  persistCharacterProfiles();
  syncCharacterUI();
  renderCharacterList();
  refreshInventoryUI();
  characterNameInput.value = '';
  closeModal(characterModal);
  showToast(cleanName + ' cadastrado com uma mochila vazia.');
  if (reopenCartAfterCharacter) {
    reopenCartAfterCharacter = false;
    openCartDecision(false);
  }
}

function renderTypeFilters() {
  const order = ['todos', 'arma', 'municao', 'armadura', 'escudo', 'acessorio', 'item_geral'];
  typeFilters.innerHTML = '<span class="filter-label">Tipo</span>' + order.map(function(type) {
    const count = type === 'todos' ? preparedItems.length : countType(type);
    return '<button class="chip type-chip" type="button" data-value="' + type + '">' +
      '<span aria-hidden="true">' + TYPE_META[type].icon + '</span>' + TYPE_META[type].label +
      '<span class="chip-count">' + count + '</span></button>';
  }).join('');
}

function renderSpecificFilters() {
  const options = [
    { id: 'todos', label: 'Todos', count: preparedItems.length },
    { id: 'convencional', label: 'Convencionais', count: preparedItems.filter(function(item) { return !isNamedFixedMagicItem(item); }).length },
    { id: 'especifico', label: 'Específicos', count: preparedItems.filter(isSpecificMagicItem).length },
    { id: 'liturgico', label: 'Litúrgicos', count: preparedItems.filter(isLiturgicalItem).length }
  ];
  specificFilters.innerHTML = '<span class="filter-label">Natureza</span>' + options.map(function(option) {
    return '<button class="chip specific-chip" type="button" data-value="' + option.id + '">' + option.label +
      '<span class="chip-count">' + option.count + '</span></button>';
  }).join('');
}

function categoryValuesForType(type) {
  return Array.from(new Set(preparedItems.filter(function(item) { return item.tipo === type; }).map(function(item) {
    return item.categoriaId || 'sem_categoria';
  }))).sort(function(a, b) {
    return (CATEGORY_LABELS[a] || humanize(a)).localeCompare(CATEGORY_LABELS[b] || humanize(b), 'pt-BR');
  });
}

function renderContextFilters() {
  const categories = state.type === 'todos' ? [] : categoryValuesForType(state.type);
  const shouldShowCategories = categories.length > 1;
  contextFilters.hidden = !shouldShowCategories;
  if (shouldShowCategories) {
    categoryFilters.innerHTML = '<span class="filter-label">Subtipo</span>' +
      '<button class="chip category-chip" type="button" data-value="todos">Todos</button>' +
      categories.map(function(category) {
        const count = preparedItems.filter(function(item) {
          return item.tipo === state.type && (item.categoriaId || 'sem_categoria') === category;
        }).length;
        return '<button class="chip category-chip" type="button" data-value="' + escapeHtml(category) + '">' +
          escapeHtml(CATEGORY_LABELS[category] || humanize(category)) + '<span class="chip-count">' + count + '</span></button>';
      }).join('');
  } else {
    categoryFilters.innerHTML = '';
  }

  const isWeapon = state.type === 'arma';
  weaponFilters.hidden = !isWeapon;
  if (isWeapon) {
    const combatOrder = ['todos', 'corpo_a_corpo', 'a_distancia', 'corpo_a_corpo_e_distancia'];
    combatFilters.innerHTML = '<span class="filter-label">Combate</span>' + combatOrder.map(function(value) {
      return '<button class="chip combat-chip" type="button" data-value="' + value + '">' + COMBAT_LABELS[value] + '</button>';
    }).join('');
    const gripOrder = ['todos', 'leve', 'uma_mao', 'duas_maos'];
    gripFilters.innerHTML = '<span class="filter-label">Empunhadura</span>' + gripOrder.map(function(value) {
      return '<button class="chip grip-chip" type="button" data-value="' + value + '">' + GRIP_LABELS[value] + '</button>';
    }).join('');
  } else {
    combatFilters.innerHTML = '';
    gripFilters.innerHTML = '';
  }
}

function syncFilterUI() {
  nameOnlySearchButton.classList.toggle('active', state.searchNameOnly);
  nameOnlySearchButton.setAttribute('aria-pressed', String(state.searchNameOnly));
  debugModeButton.classList.toggle('active', state.debugMode);
  debugModeButton.setAttribute('aria-pressed', String(state.debugMode));
  document.querySelectorAll('.type-chip').forEach(function(button) {
    button.classList.toggle('active', button.dataset.value === state.type);
  });
  document.querySelectorAll('.specific-chip').forEach(function(button) {
    button.classList.toggle('active', button.dataset.value === state.specific);
  });
  document.querySelectorAll('.category-chip').forEach(function(button) {
    button.classList.toggle('active', button.dataset.value === state.category);
  });
  document.querySelectorAll('.combat-chip').forEach(function(button) {
    button.classList.toggle('active', button.dataset.value === state.combat);
  });
  document.querySelectorAll('.grip-chip').forEach(function(button) {
    button.classList.toggle('active', button.dataset.value === state.grip);
  });
  syncAdvancedFiltersButton();
}

function activeFilterSummary() {
  const parts = [];
  if (state.type !== 'todos') {
    let label = TYPE_META[state.type] && TYPE_META[state.type].label || humanize(state.type);
    if (state.category !== 'todos') {
      const category = CATEGORY_LABELS[state.category] || humanize(state.category);
      const agreement = {leve:state.type==='arma'?'leves':'leves',pesada:'pesadas',simples:'simples',marcial:'marciais',exotica:'exóticas'};
      label += ' ' + (agreement[state.category] || String(category).toLocaleLowerCase('pt-BR'));
    }
    parts.push(label);
  }
  if (state.type === 'arma' && state.combat !== 'todos') parts.push(COMBAT_LABELS[state.combat] || humanize(state.combat));
  if (state.type === 'arma' && state.grip !== 'todos') parts.push(GRIP_LABELS[state.grip] || humanize(state.grip));
  if (state.specific !== 'convencional' && state.specific !== 'todos') parts.push(state.specific === 'especifico' ? 'Específicos' : 'Litúrgicos');
  return parts.join(' · ');
}

function syncAdvancedFiltersButton(forcedLabel) {
  if (!advancedFiltersButton) return;
  const summary = forcedLabel || activeFilterSummary();
  advancedFiltersButton.textContent = '⚙ ' + (summary || 'Filtros avançados');
  advancedFiltersButton.title = summary ? 'Filtros aplicados: ' + summary : 'Abrir filtros avançados';
  advancedFiltersButton.classList.toggle('has-filters', Boolean(summary));
}

function formatSpaces(value) {
  return Number(value || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
}

function formatCurrencyValue(value, currency) {
  return (currency || 'T$') + ' ' + Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: Number(value || 0) % 1 ? 2 : 0,
    maximumFractionDigits: 2
  });
}

function formatPrice(item) {
  if (item.semValorReal) return 'Sem valor real';
  const value = Number(item.preco && item.preco.valor || 0);
  const currency = item.preco && item.preco.moeda || 'T$';
  return formatCurrencyValue(value, currency);
}

function itemImprovementCategory(item) {
  if (item.tipo === 'arma' || item.tipo === 'municao') return 'arma';
  if (item.tipo === 'armadura') return 'armadura';
  if (item.tipo === 'escudo') return 'escudo';
  if (item.tipo === 'item_geral' && ['esoterico', 'ferramenta', 'vestuario'].includes(item.categoriaId)) {
    return item.categoriaId;
  }
  return '';
}

function isSpecificMagicItem(item) {
  return Boolean(item && item.magico && item.magico.tipo === 'especifico');
}

function isLiturgicalItem(item) {
  return Boolean(item && item.magico && item.magico.tipo === 'liturgico');
}

function isNamedFixedMagicItem(item) {
  return isSpecificMagicItem(item) || isLiturgicalItem(item);
}

function materialApplicationKeys(item) {
  if (item.tipo === 'arma' || item.tipo === 'municao') return ['arma'];
  if (item.tipo === 'armadura') {
    return item.categoriaId === 'pesada' ? ['armadura_pesada', 'armadura'] : ['armadura_leve', 'armadura'];
  }
  if (item.tipo === 'escudo') return ['escudo'];
  if (item.categoriaId === 'esoterico') return ['esoterico'];
  if (item.categoriaId === 'ferramenta') return ['ferramenta'];
  if (item.categoriaId === 'vestuario') return ['vestuario'];
  return [];
}

function getMaterialCostInfo(material, item) {
  const costs = materialCosts.get(material.id) || {};
  const applications = material.aplicacoes || {};
  const keys = materialApplicationKeys(item);
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(costs, key)) {
      return { applicable: true, known: true, value: Number(costs[key]) || 0, key: key };
    }
  }
  for (const key of keys) {
    const application = applications[key];
    if (application && (application.restricoes || []).every(function(restriction) {
      return restrictionMatches(restriction, item);
    })) {
      return { applicable: true, known: false, value: 0, key: key };
    }
  }
  return { applicable: false, known: false, value: 0, key: '' };
}

function materialOptionsForItem(item) {
  return materials.filter(function(material) { return getMaterialCostInfo(material, item).applicable; });
}

function restrictionMatches(restriction, item) {
  if (!restriction || !restriction.tipo) return true;
  if (restriction.tipo === 'categoria_armadura') {
    return item.tipo === 'armadura' && item.categoriaId === restriction.categoriaId;
  }
  if (restriction.tipo === 'tipo_dano') {
    const damageTypes = item.arma && item.arma.tipoDanoIds || [];
    return (restriction.tipoDanoIds || []).some(function(type) { return damageTypes.includes(type); });
  }
  if (restriction.tipo === 'municao') return item.tipo === 'municao';
  if (restriction.tipo === 'item_modifica_pericia') {
    return item.categoriaId === 'ferramenta' || item.categoriaId === 'vestuario';
  }
  return true;
}

function improvementAppliesToItem(improvement, item) {
  if (isNamedFixedMagicItem(item)) return false;
  const category = itemImprovementCategory(item);
  if (!category || !(improvement.categoriasIds || []).includes(category)) return false;
  if (!(improvement.restricoes || []).every(function(restriction) { return restrictionMatches(restriction, item); })) return false;
  if (improvement.id === 'material_especial' && materialOptionsForItem(item).length === 0) return false;
  return true;
}

function requirementsMet(improvement, selectedIds) {
  return (improvement.preRequisitos || []).every(function(requirement) {
    if (requirement.tipo === 'melhoria') return selectedIds.has(requirement.melhoriaId);
    if (requirement.tipo === 'uma_das_melhorias') {
      return (requirement.melhoriasIds || []).some(function(id) { return selectedIds.has(id); });
    }
    return true;
  });
}

function improvementsConflict(candidate, acceptedIds) {
  if ((candidate.incompatibilidades || []).some(function(id) { return acceptedIds.has(id); })) return true;
  return Array.from(acceptedIds).some(function(id) {
    const selected = improvementById.get(id);
    return selected && (selected.incompatibilidades || []).includes(candidate.id);
  });
}

function improvementRequirementLabel(improvement) {
  const labels = (improvement.preRequisitos || []).map(function(requirement) {
    if (requirement.tipo === 'melhoria') {
      const required = improvementById.get(requirement.melhoriaId);
      return required ? required.nome : humanize(requirement.melhoriaId);
    }
    if (requirement.tipo === 'uma_das_melhorias') {
      return (requirement.melhoriasIds || []).map(function(id) {
        const required = improvementById.get(id);
        return required ? required.nome : humanize(id);
      }).join(' ou ');
    }
    return '';
  }).filter(Boolean);
  return labels.join(', ');
}

function sanitizeInstanceImprovements(instance, item) {
  const seen = new Set();
  let clean = (instance.improvements || []).map(normalizeStoredImprovement).filter(function(choice) {
    if (!choice || seen.has(choice.id)) return false;
    const improvement = improvementById.get(choice.id);
    if (!improvement || !improvementAppliesToItem(improvement, item)) return false;
    seen.add(choice.id);
    return true;
  }).slice(0, 4);

  let previousLength = -1;
  while (clean.length !== previousLength) {
    previousLength = clean.length;
    const allIds = new Set(clean.map(function(choice) { return choice.id; }));
    clean = clean.filter(function(choice) {
      return requirementsMet(improvementById.get(choice.id), allIds);
    });
    const accepted = [];
    const acceptedIds = new Set();
    clean.forEach(function(choice) {
      const improvement = improvementById.get(choice.id);
      if (!improvementsConflict(improvement, acceptedIds)) {
        accepted.push(choice);
        acceptedIds.add(choice.id);
      }
    });
    clean = accepted;
  }

  clean.forEach(function(choice) {
    if (choice.id !== 'material_especial') return;
    const available = materialOptionsForItem(item);
    if (!available.some(function(material) { return material.id === choice.materialId; })) {
      choice.materialId = available.length ? available[0].id : '';
    }
  });
  instance.improvements = clean;
}

function selectedImprovementIds(instance) {
  return new Set((instance.improvements || []).map(function(choice) { return choice.id; }));
}

function itemEnchantmentApplicationIds(item) {
  const ids = [item.tipo];
  if (item.tipo === 'item_geral') {
    ids.push(item.categoriaId === 'esoterico' ? 'esoterico' : 'acessorio');
  }
  return ids;
}

function enchantmentAppliesToItem(enchantment, item) {
  const applications = itemEnchantmentApplicationIds(item);
  const categoryIds = enchantment.categoriasItemIds || [];
  return !isNamedFixedMagicItem(item) &&
    (enchantment.aplicacoesIds || []).some(function(id) { return applications.includes(id); }) &&
    (!categoryIds.length || categoryIds.includes(item.categoriaId)) &&
    (enchantment.restricoes || []).every(function(restriction) {
      if (restriction.tipo === 'combate') {
        return item.arma && (restriction.valores || []).includes(item.arma.combateId);
      }
      return restrictionMatches(restriction, item);
    });
}

function enchantmentRequirementsMet(enchantment, selectedIds) {
  return (enchantment.preRequisitosIds || []).every(function(id) {
    return id === 'outro_encanto' ? selectedIds.size > 1 : selectedIds.has(id);
  });
}

function enchantmentRequirementLabel(enchantment) {
  return (enchantment.preRequisitosIds || []).map(function(id) {
    if (id === 'outro_encanto') return 'outro encanto';
    const required = enchantmentById.get(id);
    return required ? required.nome : humanize(id);
  }).join(', ');
}

function enchantmentSlotCost(enchantment) {
  return Math.max(1, Number(enchantment && enchantment.custoEncantos) || 1);
}

function enchantmentSlotsUsed(ids) {
  return (ids || []).reduce(function(total, id) {
    return total + enchantmentSlotCost(enchantmentById.get(id));
  }, 0);
}

function enchantmentsConflict(enchantment, selectedIds) {
  if (!enchantment) return false;
  const ownConflicts = enchantment.incompatibilidadesIds || [];
  if (ownConflicts.some(function(id) { return selectedIds.has(id); })) return true;
  return Array.from(selectedIds).some(function(id) {
    const selected = enchantmentById.get(id);
    return selected && (selected.incompatibilidadesIds || []).includes(enchantment.id);
  });
}

function sanitizeInstanceEnchantments(instance, item) {
  if (isNamedFixedMagicItem(item)) {
    instance.enchantments = [];
    return;
  }
  const seen = new Set();
  let clean = (instance.enchantments || []).map(normalizeStoredEnchantment).filter(function(id) {
    if (!id || seen.has(id)) return false;
    const enchantment = enchantmentById.get(id);
    if (!enchantment || !enchantmentAppliesToItem(enchantment, item)) return false;
    seen.add(id);
    return true;
  });
  const accepted = [];
  const acceptedIds = new Set();
  let occupiedSlots = 0;
  clean.forEach(function(id) {
    const enchantment = enchantmentById.get(id);
    const cost = enchantmentSlotCost(enchantment);
    if (enchantmentsConflict(enchantment, acceptedIds) || occupiedSlots + cost > MAX_ENCHANTMENTS) return;
    accepted.push(id);
    acceptedIds.add(id);
    occupiedSlots += cost;
  });
  clean = accepted;
  let previousLength = -1;
  while (clean.length !== previousLength) {
    previousLength = clean.length;
    const selectedIds = new Set(clean);
    clean = clean.filter(function(id) {
      return enchantmentRequirementsMet(enchantmentById.get(id), selectedIds);
    });
  }
  instance.enchantments = clean;
}

function magicCategoryFor(instance, item) {
  if (isNamedFixedMagicItem(item)) {
    const categoryId = item.magico.categoriaId || 'maior';
    return Array.from(magicCategories.values()).find(function(category) { return category.id === categoryId; }) || null;
  }
  return magicCategories.get(Math.min(MAX_ENCHANTMENTS, enchantmentSlotsUsed(instance.enchantments || []))) || null;
}

function improvementSpacePerUnit(instance, item) {
  const specificBase = isNamedFixedMagicItem(item) && item.magico.baseItemId && itemById.get(item.magico.baseItemId);
  const fixedSpaces = isNamedFixedMagicItem(item) ? item.magico.espacosFixos : null;
  let spaces = Number(fixedSpaces != null ? fixedSpaces : specificBase ? specificBase.espacos : item.espacos) || 0;
  const choices = isNamedFixedMagicItem(item)
    ? (item.magico.melhoriasFixasIds || []).map(function(id) {
        return { id: id, materialId: id === 'material_especial' ? item.magico.materialEspecialId || '' : '' };
      })
    : (instance.improvements || []);
  choices.forEach(function(choice) {
    if (choice.id === 'material_especial' && choice.materialId === 'mitral') spaces = Math.max(1, spaces - 1);
    const improvement = improvementById.get(choice.id);
    (improvement && improvement.efeitos || []).forEach(function(effect) {
      if (effect.tipo === 'reduzir_espacos_item') {
        spaces = Math.max(Number(effect.minimo) || 0, spaces - (Number(effect.valor) || 0));
      }
    });
  });
  return spaces;
}

function entryValueInfo(instance, item) {
  const count = Math.min(4, (instance.improvements || []).length);
  const enchantmentCount = isNamedFixedMagicItem(item) ? 0 : Math.min(MAX_ENCHANTMENTS, enchantmentSlotsUsed(instance.enchantments || []));
  let materialValue = 0;
  let unknownMaterials = 0;
  (instance.improvements || []).forEach(function(choice) {
    if (choice.id !== 'material_especial' || !choice.materialId) return;
    const material = materialById.get(choice.materialId);
    if (!material) return;
    const info = getMaterialCostInfo(material, item);
    if (info.known) materialValue += info.value;
    else if (info.applicable) unknownMaterials += 1;
  });
  const currency = item.preco && item.preco.moeda || 'T$';
  const improvementSurcharge = isNamedFixedMagicItem(item) ? 0 : IMPROVEMENT_SURCHARGES[count];
  const enchantmentSurcharge = isNamedFixedMagicItem(item) ? 0 : ENCHANTMENT_SURCHARGES[enchantmentCount];
  const unitKnown = Number(item.preco && item.preco.valor || 0) + improvementSurcharge + enchantmentSurcharge + materialValue;
  const magicCategory = magicCategoryFor(instance, item);
  const specificRules = MAGIC_RULES.itensEspecificos || {};
  const specificCd = specificRules.cdPorCategoria && item.magico && specificRules.cdPorCategoria[item.magico.categoriaId];
  const craftCd = isNamedFixedMagicItem(item)
    ? item.magico.fabricavel === false ? null : Number(specificCd || 50)
    : enchantmentCount
      ? Number(MAGIC_RULES.cdBaseItemEncantado || 20) + IMPROVEMENT_CRAFT_BONUSES[count] + ENCHANTMENT_CRAFT_BONUSES[enchantmentCount]
      : null;
  return {
    currency: currency,
    noRealValue: Boolean(item.semValorReal),
    apparentValue: Math.max(0, Number(item.precoAparente) || 0),
    apparentTotal: Math.max(0, Number(item.precoAparente) || 0) * instance.quantity,
    unitKnown: unitKnown,
    totalKnown: unitKnown * instance.quantity,
    unknownMaterials: unknownMaterials * instance.quantity,
    surcharge: improvementSurcharge,
    craftBonus: IMPROVEMENT_CRAFT_BONUSES[count],
    enchantmentSurcharge: enchantmentSurcharge,
    enchantmentCraftBonus: ENCHANTMENT_CRAFT_BONUSES[enchantmentCount],
    enchantmentCount: enchantmentCount,
    magicCategory: magicCategory,
    craftCd: craftCd,
    craftCost: craftCd ? unitKnown / Number(MAGIC_RULES.divisorCustoFabricacao || 3) : null
  };
}

function formatEntryValue(info, total) {
  const value = total ? info.totalKnown : info.unitKnown;
  if (info.noRealValue && value === 0) {
    const apparentValue = total ? info.apparentTotal : info.apparentValue;
    const apparent = apparentValue ? ' · aparenta ' + formatCurrencyValue(apparentValue, info.currency) : '';
    return 'Sem valor real' + apparent;
  }
  if (info.noRealValue) return formatCurrencyValue(value, info.currency) + ' (base sem valor real)' + (info.unknownMaterials ? ' + material' : '');
  return formatCurrencyValue(value, info.currency) + (info.unknownMaterials ? ' + material' : '');
}

function cartTotalsInfo() {
  return cartItems.reduce(function(total, entry) {
    const originalItem = itemById.get(entry.itemId);
    if (!originalItem) return total;
    const item = effectiveItemForOptions(originalItem, entry);
    const value = entryValueInfo(entry, item);
    total.packages += entry.quantity;
    total.spaces += improvementSpacePerUnit(entry, item) * entry.quantity;
    total.value += value.totalKnown;
    return total;
  }, { packages: 0, spaces: 0, value: 0 });
}

function syncCartUI() {
  const totals = cartTotalsInfo();
  cartCount.textContent = String(totals.packages);
  cartButton.classList.toggle('has-items', totals.packages > 0);
}

function renderCart() {
  const totals = cartTotalsInfo();
  cartList.innerHTML = cartItems.length ? cartItems.map(function(entry) {
    const originalItem = itemById.get(entry.itemId);
    if (!originalItem) return '';
    const item = effectiveItemForOptions(originalItem, entry);
    const value = entryValueInfo(entry, item);
    const packageSize = ammoPackageSize(item);
    const upgrades=[...(entry.improvements||[]).map(choice=>improvementById.get(choice.id)?.nome),...(entry.enchantments||[]).map(id=>enchantmentById.get(id)?.nome)].filter(Boolean);
    return '<div class="cart-entry" data-cart-entry-id="' + escapeHtml(entry.entryId) + '"><div class="cart-entry-name"><strong>' + escapeHtml(configuredItemName(entry, originalItem)) +
      '</strong><small>' + escapeHtml(formatEntryValue(value, true)) + ' · ' + formatSpaces(improvementSpacePerUnit(entry, item) * entry.quantity) +
      ' espaços'+(upgrades.length?' · '+escapeHtml(upgrades.join(', ')):'')+(packageSize ? ' · pacote com ' + packageSize : '') + '</small></div>' +
      '<div class="cart-quantity"><button type="button" data-action="cart-decrease" aria-label="Diminuir quantidade">−</button><span>' + entry.quantity +
      '</span><button type="button" data-action="cart-increase" aria-label="Aumentar quantidade">+</button></div>' +
      '<button class="cart-remove" type="button" data-action="cart-remove" aria-label="Remover ' + escapeHtml(configuredItemName(entry, originalItem)) + ' do carrinho">×</button></div>';
  }).join('') : '<p class="modal-empty">O carrinho está vazio.</p>';
  cartSummary.innerHTML = '<div><strong>' + totals.packages + '</strong><small>' + (totals.packages === 1 ? 'Item/pacote' : 'Itens/pacotes') +
    '</small></div><div><strong>' + formatSpaces(totals.spaces) + '</strong><small>Espaços usados</small></div><div><strong>' +
    escapeHtml(formatCurrencyValue(totals.value, 'T$')) + '</strong><small>Valor total</small></div>';
  clearCart.disabled = !cartItems.length;
  checkoutCart.disabled = !cartItems.length;
  syncCartUI();
}

function openCartDecision(fromBackpack) {
  renderCart();
  cartDecisionNote.textContent = cartItems.length
    ? (fromBackpack
      ? 'Há itens aguardando compra. Revise a lista e escolha se deseja finalizar, voltar ao catálogo ou ver a mochila.'
      : 'Revise os itens da compra e escolha se deseja finalizar, voltar ao catálogo ou ver a mochila.')
    : 'O carrinho está vazio. Você pode voltar ao catálogo ou ver a mochila.';
  openModal(cartModal);
}

function ammunitionForWeapon(item) {
  if (!item || item.tipo !== 'arma' || item.arma?.combateId !== 'a_distancia') return null;
  const id=String(item.id||''), text=(id+' '+String(item.nome||'')).toLowerCase();
  if (/arco/.test(text) && !/poder/.test(text)) return 'flechas';
  if (/besta|balestra/.test(text)) return 'virotes';
  if (/funda/.test(text)) return 'pedras';
  if (/zarabatana/.test(text)) return 'dardos';
  if (/canh[aã]o/.test(text)) return 'bola_de_ferro';
  if (/pistola|mosquete|arcabuz|bacamarte|garrucha/.test(text) && !/demon/.test(text)) return 'balas';
  return null;
}

function addItemToCart(itemId, rawOptions, settings) {
  const item = itemById.get(itemId);
  if (!item) return;
  const options = normalizeItemOptions(itemId, rawOptions);
  const configured=purchaseDrafts.get(itemId)||{improvements:[],enchantments:[]},improvements=(configured.improvements||[]).map(choice=>({...choice})),enchantments=[...(configured.enchantments||[])],optionKey=itemOptionsKey(itemId, options),upgradeKey=JSON.stringify([improvements,enchantments]);
  const existing = cartItems.find(function(entry) {
    return entry.itemId === itemId && itemOptionsKey(itemId, entry.options) === optionKey && JSON.stringify([entry.improvements||[],entry.enchantments||[]])===upgradeKey;
  });
  if (existing) existing.quantity = Math.min(9999, existing.quantity + 1);
  else cartItems.push({ entryId: 'carrinho-' + createInstanceId(), itemId: itemId, quantity: 1, options: options, improvements, enchantments });
  persistCart();
  syncCartUI();
  showToast(configuredItemName({ options, improvements, enchantments }, item) + ' adicionado ao carrinho.');
  const ammunitionId=!settings?.skipAmmunitionOffer&&ammunitionForWeapon(item);
  if(ammunitionId){const ammunition=itemById.get(ammunitionId);if(ammunition)catalogDecision('Deseja adicionar também '+ammunition.nome+' para esta arma?',[{value:'keep',label:'Não'},{value:'add',label:'Sim, adicionar',primary:true}],'Munição').then(choice=>{if(choice==='add')addItemToCart(ammunition.id,{}, {skipAmmunitionOffer:true})})}
}

function setCartQuantity(entryId, quantity) {
  const entry = cartItems.find(function(candidate) { return candidate.entryId === entryId; });
  if (!entry) return;
  const next = Math.max(0, Math.min(9999, Math.floor(Number(quantity) || 0)));
  if (!next) cartItems = cartItems.filter(function(candidate) { return candidate.entryId !== entryId; });
  else entry.quantity = next;
  persistCart();
  renderCart();
}

function countBackpackItem(itemId) {
  return backpackItems.reduce(function(total, entry) {
    return total + (entry.itemId === itemId ? entry.quantity : 0);
  }, 0);
}

function backpackTotals() {
  return backpackItems.reduce(function(total, instance) {
    const originalItem = itemById.get(instance.itemId);
    if (!originalItem) return total;
    const item = effectiveItemForOptions(originalItem, instance);
    sanitizeInstanceImprovements(instance, item);
    sanitizeInstanceEnchantments(instance, item);
    const value = entryValueInfo(instance, item);
    total.entries += 1;
    total.quantity += instance.quantity;
    total.spaces += improvementSpacePerUnit(instance, item) * instance.quantity;
    total.value += value.totalKnown;
    total.unknownMaterials += value.unknownMaterials;
    return total;
  }, { entries: 0, quantity: 0, spaces: 0, value: 0, unknownMaterials: 0 });
}

function carryingLimits(strength, capacityBonus) {
  const score = normalizeStrength(strength);
  const normal = Math.max(0, score >= 0 ? 10 + score * 2 : 10 + score) + Math.max(0, Number(capacityBonus) || 0);
  return { normal: normal, maximum: normal * 2 };
}

function renderLoadStats(totals) {
  const active = activeCharacterProfile();
  const used = Number(totals && totals.spaces || 0);
  const limits = carryingLimits(active ? active.strength : 0, active ? active.capacityBonus : 0);
  const status = !active
    ? { label: 'Sem personagem', className: '' }
    : used > limits.maximum
      ? { label: 'Acima do máximo', className: 'load-exceeded' }
      : used > limits.normal
        ? { label: 'Sobrecarregado', className: 'load-overloaded' }
        : { label: 'Carga normal', className: 'load-normal' };
  loadStats.innerHTML = [
    [formatSpaces(used), 'Carga usada', status.className],
    [formatSpaces(limits.normal), 'Limite de carga', ''],
    [formatSpaces(limits.maximum), 'Carga máxima', ''],
    [status.label, 'Situação', status.className]
  ].map(function(stat) {
    return '<div class="load-stat ' + stat[2] + '"><strong>' + escapeHtml(stat[0]) + '</strong><small>' + escapeHtml(stat[1]) + '</small></div>';
  }).join('');
}

function activeCharacterProfile() {
  return characterProfiles.profiles.find(function(profile) { return profile.id === characterProfiles.activeId; }) || null;
}

function persistCharacterProfiles() {
  try {
    localStorage.setItem(CHARACTER_PROFILES_STORAGE_KEY, JSON.stringify(characterProfiles));
  } catch (error) {
    showToast('Não foi possível salvar os personagens neste navegador.');
  }
}

function persistBackpack() {
  const active = activeCharacterProfile();
  if (!active) return;
  backpackItems.forEach(entry => {
    const item = itemById.get(entry.itemId);
    if (item) { entry.displayName = configuredItemName(entry, item); if (!canonicalItemById.has(item.id)) entry.itemSnapshot = item; }
  });
  active.backpack = backpackItems;
  persistCharacterProfiles();
}

function persistCart() {
  try { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems)); }
  catch (error) { showToast('Não foi possível salvar o carrinho neste navegador.'); }
}

let toastTimer = 0;
function showToast(message) {
  statusToast.textContent = message;
  statusToast.classList.add('visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(function() { statusToast.classList.remove('visible'); }, 2200);
}

function catalogDecision(message, actions, title) {
  return new Promise(function(resolve) {
    let modal=document.getElementById('catalogDecisionModal');
    if(!modal){modal=document.createElement('div');modal.id='catalogDecisionModal';modal.className='app-modal';modal.hidden=true;document.body.appendChild(modal)}
    modal.innerHTML='<section class="modal-panel" role="dialog" aria-modal="true"><header class="modal-header"><h2>'+escapeHtml(title||'Confirmação')+'</h2></header><div class="modal-body"><p class="modal-note">'+escapeHtml(message)+'</p><div class="decision-actions">'+actions.map(function(action){return '<button type="button" class="'+(action.danger?'danger-button':action.primary?'primary-button':'secondary-button')+'" data-catalog-decision="'+escapeHtml(action.value)+'">'+escapeHtml(action.label)+'</button>'}).join('')+'</div></div></section>';
    modal.onclick=function(event){const button=event.target.closest?.('[data-catalog-decision]');if(!button)return;modal.hidden=true;document.body.style.overflow='';resolve(button.dataset.catalogDecision)};
    openModal(modal);window.setTimeout(function(){modal.querySelector('button')?.focus()},20);
  });
}

function formatCritical(critical) {
  if (!critical) return '—';
  if (critical.texto && critical.margem == null && critical.multiplicador == null) {
    return String(critical.texto).replace(/^x(\d+)$/i, '$1x');
  }
  const margin = Number(critical.margem || 20);
  const multiplier = Number(critical.multiplicador || 2);
  if (margin >= 20) return multiplier + 'x';
  if (multiplier <= 2) return String(margin);
  return margin + ',' + multiplier + 'x';
}

function statTile(label, value) {
  return '<div class="item-stat"><span class="stat-name">' + escapeHtml(label) + '</span><span class="stat-data">' + escapeHtml(value == null || value === '' ? '—' : value) + '</span></div>';
}

function itemStats(item) {
  const stats = [statTile('Preço', formatPrice(item)), statTile('Espaços', formatSpaces(item.espacos))];
  if (item.precoAparente) stats.push(statTile('Valor aparente', formatCurrencyValue(item.precoAparente, item.preco && item.preco.moeda || 'T$')));
  if (item.tipo === 'arma' && item.arma) {
    const damage = item.arma.dano && item.arma.dano.principal || '—';
    const alternatives = item.arma.dano && Array.isArray(item.arma.dano.alternativas) ? item.arma.dano.alternativas.filter(Boolean) : [];
    stats.push(statTile('Dano', alternatives.length ? damage + ' / ' + alternatives.join(' / ') : damage));
    stats.push(statTile('Crítico', formatCritical(item.arma.critico)));
    stats.push(statTile('Combate', COMBAT_LABELS[item.arma.combateId] || humanize(item.arma.combateId)));
    stats.push(statTile('Empunhadura', GRIP_LABELS[item.arma.empunhaduraId] || humanize(item.arma.empunhaduraId)));
    stats.push(statTile('Alcance', RANGE_LABELS[item.arma.alcanceId] || (item.arma.alcanceId ? humanize(item.arma.alcanceId) : '—')));
    stats.push(statTile('Tipo de dano', (item.arma.tipoDanoIds || []).map(function(value) { return DAMAGE_LABELS[value] || humanize(value); }).join(' / ') || '—'));
  } else if (item.tipo === 'armadura' && item.armadura) {
    stats.push(statTile('Defesa', '+' + Number(item.armadura.defesa || 0)));
    stats.push(statTile('Penalidade', String(Number(item.armadura.penalidade || 0))));
    stats.push(statTile('Destreza', item.armadura.usaDestrezaNaDefesa ? 'Aplica na Defesa' : 'Não aplica'));
  } else if (item.tipo === 'escudo' && item.escudo) {
    stats.push(statTile('Defesa', '+' + Number(item.escudo.bonusDefesa || 0)));
    stats.push(statTile('Penalidade', String(Number(item.escudo.penalidade || 0))));
    if (item.escudo.ataque) {
      stats.push(statTile('Ataque', item.escudo.ataque.dano && (item.escudo.ataque.dano.texto || item.escudo.ataque.dano.principal) || '—'));
      stats.push(statTile('Crítico', formatCritical(item.escudo.ataque.critico)));
    }
  } else {
    const slots = item.equipamento && Array.isArray(item.equipamento.slotsPermitidos) ? Array.from(new Set(item.equipamento.slotsPermitidos.map(function(value) {
      return SLOT_LABELS[value] || humanize(value);
    }))) : [];
    if (slots.length) stats.push(statTile('Uso', slots.join(' / ')));
    if (item.equipamento && item.equipamento.itemVestido) stats.push(statTile('Equipamento', 'Item vestido'));
  }
  if (isLiturgicalItem(item)) {
    const category = magicCategoryFor({ enchantments: [] }, item);
    stats.push(statTile('Item mágico', 'Litúrgico ' + (category ? category.nome.toLowerCase() : humanize(item.magico.categoriaId).toLowerCase())));
    stats.push(statTile('Divindade', item.magico.divindade || '—'));
  } else if (isSpecificMagicItem(item)) {
    const category = magicCategoryFor({ enchantments: [] }, item);
    const specificRules = MAGIC_RULES.itensEspecificos || {};
    const cd = specificRules.cdPorCategoria && specificRules.cdPorCategoria[item.magico.categoriaId];
    stats.push(statTile('Item mágico', 'Específico ' + (category ? category.nome.toLowerCase() : humanize(item.magico.categoriaId).toLowerCase())));
    if (item.magico.faixaD100) stats.push(statTile('Faixa d%', item.magico.faixaD100));
    stats.push(item.magico.fabricavel === false
      ? statTile('Fabricação', 'Não fabricável')
      : statTile('CD fabricação', String(cd || 50)));
  }
  return stats.join('');
}

function propertiesHtml(item) {
  if (!item.arma) return '';
  const values = [];
  (item.arma.propriedadesIds || []).forEach(function(value) { values.push(PROPERTY_LABELS[value] || humanize(value)); });
  (item.arma.gruposArmaIds || []).forEach(function(value) { values.push(humanize(value)); });
  if (!values.length) return '';
  return '<div class="properties-row">' + values.map(function(value) {
    return '<span class="property-tag">' + escapeHtml(value) + '</span>';
  }).join('') + '</div>';
}

function renderInfoBlock(title, text, className) {
  if (!text) return '';
  return '<div class="info-block ' + className + '">' +
    (title ? '<span class="info-block-title">' + escapeHtml(title) + '</span>' : '') +
    '<p>' + escapeHtml(text) + '</p></div>';
}

function catalogOptionsForItem(item) {
  if (!ITEM_CHOICE_DEFINITIONS[item.id]) return {};
  if (!catalogOptionDrafts.has(item.id)) catalogOptionDrafts.set(item.id, normalizeItemOptions(item.id, {}));
  return catalogOptionDrafts.get(item.id);
}

function itemChoiceFieldsHtml(item, rawOptions) {
  const definition = ITEM_CHOICE_DEFINITIONS[item.id];
  if (!definition) return '';
  const options = normalizeItemOptions(item.id, rawOptions);
  const fields = definition.fields.map(function(field) {
    const id = 'choice_' + item.id + '_' + field.id;
    if (field.type === 'select') {
      const choices = field.options.map(function(option) {
        return '<option value="' + escapeHtml(option[0]) + '"' + (options[field.id] === option[0] ? ' selected' : '') + '>' + escapeHtml(option[1]) + '</option>';
      }).join('');
      return '<div class="item-choice-field"><label for="' + escapeHtml(id) + '">' + escapeHtml(field.label) + '</label><select id="' + escapeHtml(id) + '" data-item-option="' + escapeHtml(field.id) + '">' + choices + '</select></div>';
    }
    return '<div class="item-choice-field"><label for="' + escapeHtml(id) + '">' + escapeHtml(field.label) + '</label><input id="' + escapeHtml(id) + '" data-item-option="' + escapeHtml(field.id) + '" type="' + (field.type === 'number' ? 'number' : 'text') + '" min="0" step="0.5" maxlength="80" autocomplete="off" value="' + escapeHtml(options[field.id]) + '" placeholder="' + escapeHtml(field.placeholder || '') + '"></div>';
  }).join('');
  return '<div class="item-choice-panel"><span class="item-choice-title">Escolhas deste item</span><div class="item-choice-grid">' + fields + '</div></div>';
}

function configuredOptionsSummaryHtml(holder, item) {
  const definition = ITEM_CHOICE_DEFINITIONS[item.id];
  if (!definition) return '';
  const options = normalizeItemOptions(item.id, holder && holder.options);
  const rows = definition.fields.map(function(field) {
    const value = field.type === 'select' ? itemChoiceLabel(item.id, field.id, options[field.id]) : options[field.id];
    return value ? '<span><strong>' + escapeHtml(field.label) + ':</strong> ' + escapeHtml(value) + '</span>' : '';
  }).filter(Boolean).join('');
  return rows ? '<div class="configured-options">' + rows + '</div>' : '';
}

function configuredItemName(instance, item) {
  const options = normalizeItemOptions(item.id, instance && instance.options);
  let baseName = options.customName || item.nome;
  if (item.id === 'instrumentos_de_oficio') baseName += ' — ' + itemChoiceLabel(item.id, 'oficio', options.oficio);
  if (item.id === 'colecao_de_livros') baseName += ' — ' + itemChoiceLabel(item.id, 'knowledge', options.knowledge);
  if (item.id === 'ferramenta_pesada_lanca') baseName += ' (' + itemChoiceLabel(item.id, 'weaponModel', options.weaponModel).toLocaleLowerCase('pt-BR') + ')';
  if (isNamedFixedMagicItem(item)) return baseName;
  const labels = [];
  (instance && instance.improvements || []).forEach(function(choice) {
    if (choice.id === 'material_especial' && choice.materialId) {
      const material = materialById.get(choice.materialId);
      labels.push(material ? material.nome : humanize(choice.materialId));
    } else {
      const improvement = improvementById.get(choice.id);
      if (improvement) labels.push(improvement.nome);
    }
  });
  (instance && instance.enchantments || []).forEach(function(id) {
    const enchantment = enchantmentById.get(id);
    if (enchantment) labels.push(enchantment.nome);
  });
  const qualifiers = Array.from(new Set(labels)).map(function(label) { return label.toLocaleLowerCase('pt-BR'); });
  return baseName + (qualifiers.length ? ' ' + qualifiers.join(' ') : '');
}

const catalogCardCache = new WeakMap();
function itemCard(originalItem) {
  const key = JSON.stringify([catalogOptionsForItem(originalItem),countBackpackItem(originalItem.id),state.debugMode,state.inspirationMode]);
  const cached = catalogCardCache.get(originalItem);
  if (cached && cached.key === key) return cached.html;
  const html = buildItemCard(originalItem);
  catalogCardCache.set(originalItem, {key,html});
  return html;
}

function buildItemCard(originalItem) {
  const options = catalogOptionsForItem(originalItem);
  const item = effectiveItemForOptions(originalItem, { options: options });
  const typeMeta = TYPE_META[item.tipo] || { label: humanize(item.tipo), icon: '◆' };
  const category = item.categoriaId || 'sem_categoria';
  const acquiredCount = countBackpackItem(item.id);
  const books = item._books.map(function(book) {
    return '<span class="badge ' + (book === 'adicionado' ? 'badge-added' : 'badge-book') + '">' + escapeHtml(BOOK_LABELS[book] || humanize(book)) + '</span>';
  }).join('');
  const tierLabel = item.magico && ({ menor: 'menor', medio: 'médio', maior: 'maior' }[item.magico.categoriaId] || humanize(item.magico.categoriaId).toLowerCase());
  const magicBadge = isLiturgicalItem(item)
    ? '<span class="badge badge-liturgical">Litúrgico · ' + escapeHtml(item.magico.divindade || tierLabel) + '</span>'
    : isSpecificMagicItem(item)
      ? '<span class="badge badge-magic">Específico ' + escapeHtml(tierLabel) + '</span>'
      : '';
  const originBadge = item.origem ? '<span class="badge badge-origin">Origem · ' + escapeHtml(item.origem) + '</span>' : '';
  const debugBadge = item.debugEdited ? '<span class="badge badge-debug">Editado · debug</span>' : '';
  const texts = item.textos || {};
  let body = renderInfoBlock('', texts.habilidade, 'info-grant');
  body += renderInfoBlock('Regras e uso', texts.variavel, 'info-rule');
  if (texts.descricao) {
    const descriptionLabel = isLiturgicalItem(item) ? 'Descrição litúrgica' : isSpecificMagicItem(item) ? 'Descrição específica' : 'Descrição';
    body += '<p class="description"><span class="description-label">' +
      descriptionLabel + '</span><br>' + escapeHtml(texts.descricao) + '</p>';
  }
  if (!body) body = '<p class="no-description">Sem descrição textual cadastrada; consulte as estatísticas acima.</p>';
  const upgradeActions = state.inspirationMode ? '' : purchaseUpgradeButtons(item);
  const primaryAction = state.inspirationMode
    ? '<button class="acquire-button inspiration-select-button" type="button" data-action="select-inspiration" data-item-id="' + escapeHtml(item.id) + '"><span aria-hidden="true">✦</span> Escolher inspiração</button>'
    : upgradeActions+'<button class="acquire-button" type="button" data-action="add-to-cart" data-item-id="' + escapeHtml(item.id) + '"><span aria-hidden="true">🛒</span> Adicionar ao carrinho</button>';
  const acquisitionStatus = state.inspirationMode ? '' : '<span class="acquired-indicator' + (acquiredCount ? ' has-items' : '') + '" data-acquired-count>' +
    (acquiredCount ? '×' + acquiredCount : '') + '</span>';
  let managementControls = '';
  if (item.adicionado && !state.inspirationMode) {
    managementControls = '<div class="custom-item-management"><button class="custom-management-button" type="button" data-action="edit-custom-item" data-item-id="' + escapeHtml(item.id) + '" title="Editar ou renomear" aria-label="Editar ou renomear ' + escapeHtml(item.nome) + '">✎</button>' +
      '<button class="custom-management-button delete" type="button" data-action="delete-custom-item" data-item-id="' + escapeHtml(item.id) + '" title="Apagar item" aria-label="Apagar ' + escapeHtml(item.nome) + '">×</button></div>';
  } else if (state.debugMode && !state.inspirationMode) {
    managementControls = '<div class="custom-item-management"><button class="custom-management-button" type="button" data-action="debug-edit-item" data-item-id="' + escapeHtml(item.id) + '" title="Corrigir nome ou textos no modo debug" aria-label="Editar ' + escapeHtml(item.nome) + ' no modo debug">✎</button></div>';
  }
  return '<article class="item-card' + (acquiredCount ? ' acquired' : '') + '" data-type="' + escapeHtml(item.tipo) + '" data-item-id="' + escapeHtml(item.id) + '">' +
    '<div class="card-header"><div class="title-row"><span class="item-icon" aria-hidden="true">' + typeMeta.icon + '</span>' +
    '<h3 class="item-title">' + escapeHtml(item.nome) + '</h3>' + managementControls + '</div>' +
    '<div class="badges"><span class="badge badge-type-' + escapeHtml(item.tipo) + '">' + escapeHtml(typeMeta.label) + '</span>' +
    '<span class="badge">' + escapeHtml(CATEGORY_LABELS[category] || humanize(category)) + '</span>' + magicBadge + originBadge + debugBadge + books + '</div></div>' +
    '<div class="item-stats">' + itemStats(item) + '</div>' + itemChoiceFieldsHtml(originalItem, options) +
    '<div class="item-card-detail">' + propertiesHtml(item) + '<div class="card-body">' + body + '</div>' + specificMagicHtml({ improvements: [], enchantments: [], quantity: 1 }, item) + '</div>' +
    '<div class="card-overlay"><button class="expand-item-button" type="button" data-action="toggle-item" aria-expanded="false">Ver item completo</button>' +
    '<div class="card-actions">' + primaryAction + acquisitionStatus + '</div></div></article>';
}

function improvementOptionsHtml(instance, item, slotIndex) {
  const current = instance.improvements[slotIndex] && instance.improvements[slotIndex].id || '';
  const otherIds = new Set(instance.improvements.filter(function(choice, index) {
    return index !== slotIndex && choice && choice.id;
  }).map(function(choice) { return choice.id; }));
  const options = improvements.filter(function(improvement) {
    return improvementAppliesToItem(improvement, item);
  }).map(function(improvement) {
    const combinedIds = new Set(otherIds);
    combinedIds.add(improvement.id);
    let reason = '';
    if (otherIds.has(improvement.id)) reason = 'já escolhida';
    else if (!requirementsMet(improvement, combinedIds)) reason = 'requer ' + improvementRequirementLabel(improvement);
    else if (improvementsConflict(improvement, otherIds)) reason = 'incompatível';
    const disabled = reason && improvement.id !== current;
    return '<option value="' + escapeHtml(improvement.id) + '"' +
      (improvement.id === current ? ' selected' : '') + (disabled ? ' disabled' : '') + '>' +
      escapeHtml(improvement.nome + (reason && improvement.id !== current ? ' (' + reason + ')' : '')) + '</option>';
  }).join('');
  return '<select class="improvement-select" data-action="improvement" data-slot="' + slotIndex + '" aria-label="' +
    (slotIndex + 1) + 'ª melhoria"><option value="">Nenhuma</option>' + options + '</select>';
}

const BASE_MATERIAL_SUMMARIES = {
  aco_rubi: {
    arma: 'Ignora 10 pontos de redução de dano e a imunidade a acertos críticos de lefeu.',
    armadura_leve: 'Há 25% de chance de ignorar o dano adicional de acertos críticos e ataques furtivos.',
    armadura_pesada: 'Há 50% de chance de ignorar o dano adicional de acertos críticos e ataques furtivos.',
    escudo: 'Há 25% de chance de ignorar o dano adicional de acertos críticos e ataques furtivos.',
    esoterico: 'Magias de dano ignoram 10 pontos de redução de dano e imunidades a dano de lefeu.'
  },
  adamante: {
    arma: 'Aumenta o dano da arma em um passo.',
    armadura_leve: 'Fornece redução de dano 2.',
    armadura_pesada: 'Fornece redução de dano 5.',
    escudo: 'Fornece redução de dano 2.',
    esoterico: 'Ao lançar uma magia de dano, você pode gastar +1 PM para rolar novamente qualquer resultado 1 nos dados de dano.'
  },
  gelo_eterno: {
    arma: 'Causa +2 pontos de dano de frio.',
    armadura_leve: 'Fornece redução de fogo 5.',
    armadura_pesada: 'Fornece redução de fogo 10.',
    escudo: 'Fornece redução de fogo 5.',
    esoterico: 'Ao lançar uma magia de frio, você pode rolar novamente qualquer resultado 1 nos dados de dano.'
  },
  madeira_tollon: {
    arma: 'Conta como mágica para vencer redução de dano e reduz em –1 PM o custo de habilidades ativadas ao atacar ou usar a ação agredir.',
    escudo: 'Fornece resistência a magia +2.',
    esoterico: 'Fornece resistência a magia +2.'
  },
  materia_vermelha: {
    arma: 'Você sofre –2 em perícias baseadas em Carisma, exceto Intimidação. A arma causa +1d6 de dano, mas você perde 1 PV sempre que acerta um ataque; lefeu e lefou são imunes a esse dano.',
    armadura_leve: 'Você sofre –2 em perícias baseadas em Carisma, exceto Intimidação. A armadura fornece 10% de chance de falha contra ataques.',
    armadura_pesada: 'Você sofre –2 em perícias baseadas em Carisma, exceto Intimidação. A armadura fornece 25% de chance de falha contra ataques.',
    escudo: 'Você sofre –2 em perícias baseadas em Carisma, exceto Intimidação. O escudo fornece 10% de chance de falha contra ataques.',
    esoterico: 'Você sofre –2 em perícias baseadas em Carisma, exceto Intimidação. Você e inimigos em alcance curto sofrem –2 em testes de resistência contra efeitos mágicos.'
  },
  mitral: {
    arma: 'Ocupa –1 espaço (mínimo 1) e aumenta a margem de ameaça em 1.',
    armadura_leve: 'Ocupa –1 espaço (mínimo 1) e reduz a penalidade de armadura em 2.',
    armadura_pesada: 'Ocupa –1 espaço (mínimo 1), reduz a penalidade de armadura em 2 e permite aplicar até 2 pontos de Destreza na Defesa.',
    escudo: 'Ocupa –1 espaço (mínimo 1) e reduz a penalidade de armadura em 2.',
    esoterico: 'Ocupa –1 espaço (mínimo 1). Você pode gastar +2 PM para aumentar a CD da magia em +2.'
  }
};

function materialSummary(material, item) {
  const baseItem = isNamedFixedMagicItem(item) && item.magico.baseItemId && itemById.get(item.magico.baseItemId);
  const applicationItem = baseItem || item;
  const applications = material.aplicacoes || {};
  const keys = materialApplicationKeys(applicationItem);
  for (const key of keys) {
    if (applications[key] && applications[key].resumo) return applications[key].resumo;
  }
  const summaries = BASE_MATERIAL_SUMMARIES[material.id] || {};
  for (const key of keys) {
    if (summaries[key]) return summaries[key];
  }
  return '';
}

function materialFieldHtml(instance, item) {
  const choice = (instance.improvements || []).find(function(entry) { return entry.id === 'material_especial'; });
  if (!choice) return '';
  const options = materialOptionsForItem(item).map(function(material) {
    const info = getMaterialCostInfo(material, item);
    const costLabel = info.known ? ' (+' + formatCurrencyValue(info.value, 'T$') + ')' : ' (custo não cadastrado)';
    return '<option value="' + escapeHtml(material.id) + '"' + (material.id === choice.materialId ? ' selected' : '') + '>' +
      escapeHtml(material.nome + costLabel) + '</option>';
  }).join('');
  return '<div class="improvement-field material-field"><label>Material especial</label>' +
    '<select class="improvement-select" data-action="material" aria-label="Material especial">' + options + '</select></div>';
}

function improvementDetailsHtml(instance, item) {
  const value = entryValueInfo(instance, item);
  const descriptions = (instance.improvements || []).map(function(choice) {
    const improvement = improvementById.get(choice.id);
    if (!improvement) return '';
    let name = improvement.nome;
    let summary = improvement.resumo || '';
    if (choice.id === 'material_especial' && choice.materialId) {
      const material = materialById.get(choice.materialId);
      if (material) {
        name += ': ' + material.nome;
        const specificSummary = materialSummary(material, item);
        if (specificSummary) summary = specificSummary;
      }
    }
    return '<p class="improvement-description"><strong>' + escapeHtml(name) + '.</strong> ' + escapeHtml(summary) + '</p>';
  }).join('');
  const count = instance.improvements.length;
  const cost = count
    ? 'Custo de item superior: +' + formatCurrencyValue(value.surcharge, value.currency) +
      '. Modificador na CD de fabricação: +' + value.craftBonus + '.'
    : 'Escolha até quatro melhorias. O custo superior é calculado pela quantidade escolhida.';
  const unknown = value.unknownMaterials
    ? ' O preço do material escolhido não está cadastrado e aparece separado do total.'
    : '';
  return '<div class="improvement-details">' + descriptions +
    '<p class="improvement-cost-note">' + escapeHtml(cost + unknown) + '</p></div>';
}

function enchantmentOptionsHtml(instance, item, slotIndex) {
  const current = instance.enchantments[slotIndex] || '';
  const otherIds = new Set(instance.enchantments.filter(function(id, index) {
    return index !== slotIndex && id;
  }));
  const options = enchantments.filter(function(enchantment) {
    return enchantmentAppliesToItem(enchantment, item);
  }).map(function(enchantment) {
    const selectedIds = new Set(otherIds);
    selectedIds.add(enchantment.id);
    let reason = '';
    if (otherIds.has(enchantment.id)) reason = 'já escolhido';
    else if (enchantmentsConflict(enchantment, otherIds)) reason = 'incompatível com outro encanto';
    else if (enchantmentSlotsUsed(Array.from(selectedIds)) > MAX_ENCHANTMENTS) reason = 'excede o limite de encantos';
    else if (!enchantmentRequirementsMet(enchantment, selectedIds)) {
      reason = 'requer ' + enchantmentRequirementLabel(enchantment);
    }
    const disabled = reason && enchantment.id !== current;
    const costLabel = enchantmentSlotCost(enchantment) > 1 ? ' [conta como 2]' : '';
    return '<option value="' + escapeHtml(enchantment.id) + '"' +
      (enchantment.id === current ? ' selected' : '') + (disabled ? ' disabled' : '') + '>' +
      escapeHtml(enchantment.nome + costLabel + (reason && enchantment.id !== current ? ' (' + reason + ')' : '')) + '</option>';
  }).join('');
  return '<select class="improvement-select" data-action="enchantment" data-slot="' + slotIndex + '" aria-label="' +
    (slotIndex + 1) + 'º encanto"><option value="">Nenhum</option>' + options + '</select>';
}

function magicRuleStatsHtml(category, value, office) {
  if (!category) return '';
  const stats = [
    ['Categoria', category.nome],
    ['CD de fabricação', value.craftCd],
    ['Custo para fabricar', formatCurrencyValue(value.craftCost, value.currency)],
    ['Sacrifício permanente', category.custoPm + ' PM'],
    ['PV e RD do item', '+' + category.bonusPv + ' PV / +' + category.bonusRd + ' RD'],
    ['Resistência do item', '+' + category.resistencia]
  ];
  if (office) stats.splice(1, 0, ['Perícia', office]);
  return '<div class="magic-rule-grid">' + stats.map(function(stat) {
    return '<div class="magic-rule-stat"><span class="stat-name">' + escapeHtml(stat[0]) + '</span><strong>' +
      escapeHtml(stat[1]) + '</strong></div>';
  }).join('') + '</div>';
}

function enchantmentDetailsHtml(instance, item) {
  const value = entryValueInfo(instance, item);
  const descriptions = instance.enchantments.map(function(id) {
    const enchantment = enchantmentById.get(id);
    return enchantment
      ? '<p class="improvement-description"><strong>' + escapeHtml(enchantment.nome) + '.</strong> ' + escapeHtml(enchantment.descricao) + '</p>'
      : '';
  }).join('');
  if (!value.enchantmentCount) {
    return '<div class="improvement-details"><p class="magic-note">Escolha até três encantos. Um encanto torna o item menor, dois o tornam médio e três o tornam maior. Energética, Lancinante, Magnífica e Guardião contam como dois encantos.</p></div>';
  }
  const pricing = 'Encantos: +' + formatCurrencyValue(value.enchantmentSurcharge, value.currency) +
    '. O preço final já soma item base, melhorias, material e encantos. Bônus iguais fornecidos por encantos não se acumulam.';
  const permanence = 'Os PM sacrificados são perdidos permanentemente e retornam apenas se o criador destruir o item; o mestre pode permitir um ingrediente raro no lugar dos PM. Quando não está em uso, o item faz seus próprios testes de resistência com o bônus indicado. Em uso, pode usar esse valor ou o do portador.';
  return '<div class="improvement-details">' + descriptions + magicRuleStatsHtml(value.magicCategory, value, '') +
    '<p class="improvement-cost-note">' + escapeHtml(pricing) + '</p><p class="magic-note">' + escapeHtml(permanence) + '</p></div>';
}

function enchantmentEditorHtml(instance, item) {
  const available = enchantments.some(function(enchantment) { return enchantmentAppliesToItem(enchantment, item); });
  if (!available) return '';
  const shouldOpen = openEnchantmentPanels.has(instance.instanceId) || instance.enchantments.length > 0;
  const slots = Array.from({ length: MAX_ENCHANTMENTS }, function(_, slotIndex) {
    return '<div class="improvement-field"><label>' + (slotIndex + 1) + 'º encanto</label>' +
      enchantmentOptionsHtml(instance, item, slotIndex) + '</div>';
  }).join('');
  return '<details class="enchantments-panel" data-instance-id="' + escapeHtml(instance.instanceId) + '"' + (shouldOpen ? ' open' : '') + '>' +
    '<summary><span>Encantos</span><span class="improvement-counter">' + enchantmentSlotsUsed(instance.enchantments) + '/' + MAX_ENCHANTMENTS + '</span></summary>' +
    '<div class="improvement-editor"><div class="improvement-slots">' + slots + '</div>' + enchantmentDetailsHtml(instance, item) + '</div></details>';
}

function purchaseUpgradeButtons(item) {
  if (isNamedFixedMagicItem(item) || document.body?.classList.contains('initial-equipment')) return '';
  const hasImprovements=improvements.some(choice=>improvementAppliesToItem(choice,item)),hasEnchantments=enchantments.some(choice=>enchantmentAppliesToItem(choice,item));
  return (hasImprovements?'<button class="upgrade-purchase-button" type="button" data-action="configure-purchase" data-kind="improvements" data-item-id="'+escapeHtml(item.id)+'" title="Adicionar melhorias" aria-label="Adicionar melhorias">🔨</button>':'')+(hasEnchantments?'<button class="upgrade-purchase-button" type="button" data-action="configure-purchase" data-kind="enchantments" data-item-id="'+escapeHtml(item.id)+'" title="Adicionar encantos" aria-label="Adicionar encantos">✨</button>':'');
}
function purchaseDraft(itemId){if(!purchaseDrafts.has(itemId))purchaseDrafts.set(itemId,{instanceId:'compra-'+itemId,itemId,quantity:1,options:catalogOptionsForItem(itemById.get(itemId)),improvements:[],enchantments:[]});return purchaseDrafts.get(itemId)}
function purchaseUpgradeEditor(itemId,kind){
  const original=itemById.get(itemId),draft=purchaseDraft(itemId),item=effectiveItemForOptions(original,draft);if(!item)return '';
  if(kind==='enchantments')return enchantmentEditorHtml(draft,item);
  const slots=[0,1,2,3].map(index=>'<div class="improvement-field"><label>'+(index+1)+'ª melhoria</label>'+improvementOptionsHtml(draft,item,index)+'</div>').join('');
  return '<details class="improvements-panel" open><summary><span>Melhorias</span><span class="improvement-counter">'+draft.improvements.length+'/4</span></summary><div class="improvement-editor"><div class="improvement-slots">'+slots+materialFieldHtml(draft,item)+'</div>'+improvementDetailsHtml(draft,item)+'</div></details>';
}
function openPurchaseUpgrade(itemId,kind){
  let modal=document.getElementById('purchaseUpgradeModal');if(!modal){modal=document.createElement('div');modal.id='purchaseUpgradeModal';modal.className='app-modal';document.body.appendChild(modal)}
  const item=itemById.get(itemId);modal.dataset.itemId=itemId;modal.dataset.kind=kind;modal.innerHTML='<section class="modal-panel purchase-upgrade-panel" role="dialog" aria-modal="true"><header class="modal-header"><h2>'+(kind==='enchantments'?'✨ Encantos':'🔨 Melhorias')+' · '+escapeHtml(item.nome)+'</h2><button class="modal-close" type="button" data-action="close-purchase-upgrade" aria-label="Fechar">×</button></header><div class="modal-body" data-purchase-upgrade-body>'+purchaseUpgradeEditor(itemId,kind)+'</div><footer class="modal-actions"><button class="secondary-button" type="button" data-action="close-purchase-upgrade">Voltar</button><button class="primary-button" type="button" data-action="add-configured-to-cart" data-item-id="'+escapeHtml(itemId)+'">Adicionar ao carrinho</button></footer></section>';openModal(modal)
}
function refreshPurchaseUpgrade(){const modal=document.getElementById('purchaseUpgradeModal');if(!modal)return;modal.querySelector('[data-purchase-upgrade-body]').innerHTML=purchaseUpgradeEditor(modal.dataset.itemId,modal.dataset.kind)}

function specificBaseSummaryHtml(item) {
  const baseId = item.magico && item.magico.baseItemId;
  const base = baseId && itemById.get(baseId);
  if (!base) return '';
  const details = [];
  if (base.tipo === 'arma' && base.arma) {
    details.push('Dano ' + (base.arma.dano && base.arma.dano.principal || '—'));
    details.push('Crítico ' + formatCritical(base.arma.critico));
    details.push(GRIP_LABELS[base.arma.empunhaduraId] || humanize(base.arma.empunhaduraId));
  } else if (base.tipo === 'armadura' && base.armadura) {
    details.push('Defesa +' + Number(base.armadura.defesa || 0));
    details.push('Penalidade ' + Number(base.armadura.penalidade || 0));
  } else if (base.tipo === 'escudo' && base.escudo) {
    details.push('Defesa +' + Number(base.escudo.bonusDefesa || 0));
    details.push('Penalidade ' + Number(base.escudo.penalidade || 0));
  } else {
    details.push(CATEGORY_LABELS[base.categoriaId] || humanize(base.categoriaId));
  }
  const fixedTraits = (item.magico && item.magico.caracteristicasFixas || []).map(function(trait) {
    return '<small><strong>' + escapeHtml(trait.name) + '.</strong> ' + escapeHtml(trait.description || '') + '</small>';
  }).join('');
  return '<div class="specific-base-summary"><span class="specific-base-label">Item-base</span><span class="specific-base-data"><strong>' +
    escapeHtml(base.nome) + '</strong><small>' + escapeHtml(details.join(' · ')) + '</small>' + fixedTraits + '</span></div>';
}

function fixedSpecificImprovementEntries(item) {
  const magic = item.magico || {};
  const ids = (magic.melhoriasFixasIds || []).slice();
  if (magic.materialEspecialId && !ids.includes('material_especial')) ids.unshift('material_especial');
  return ids.map(function(id) {
    const improvement = improvementById.get(id);
    if (id === 'material_especial' && magic.materialEspecialId) {
      const material = materialById.get(magic.materialEspecialId);
      return {
        name: material ? material.nome : humanize(magic.materialEspecialId),
        description: material ? materialSummary(material, item) : 'Material especial fixo deste item.'
      };
    }
    return {
      name: improvement ? improvement.nome : humanize(id),
      description: improvement && improvement.resumo || 'Melhoria fixa deste item.'
    };
  });
}

function fixedSpecificEnchantmentEntries(item) {
  const magic = item.magico || {};
  const fixed = (magic.encantosFixosIds || []).map(function(id) {
    const enchantment = enchantmentById.get(id);
    const slotCost = enchantmentSlotCost(enchantment);
    const cost = slotCost > 1 ? ' Conta como dois encantos.' : '';
    return {
      id: id,
      name: enchantment ? enchantment.nome : humanize(id),
      description: (enchantment && enchantment.descricao || 'Encanto fixo deste item.') + cost,
      slotCost: slotCost
    };
  });
  return fixed.concat((magic.encantosEspeciais || []).map(function(enchantment) {
    return {
      id: '',
      name: enchantment.name || 'Encanto especial',
      description: enchantment.description || 'Encanto próprio deste item.',
      slotCost: Math.max(1, Number(enchantment.slotCost) || 1)
    };
  }));
}

function expandedSpecificEnchantmentSlots(entries) {
  const slots = [];
  entries.forEach(function(entry) {
    if (slots.length >= MAX_ENCHANTMENTS) return;
    const cost = Math.max(1, Number(entry.slotCost) || 1);
    slots.push(entry);
    for (let index = 1; index < cost && slots.length < MAX_ENCHANTMENTS; index += 1) {
      slots.push({
        name: entry.name + ' · ' + (index + 1) + 'º espaço',
        description: 'Continuação do mesmo encanto; este espaço também fica ocupado.'
      });
    }
  });
  return slots;
}

function fixedSpecificSlotsHtml(entries, maximum, emptyLabel) {
  return Array.from({ length: maximum }, function(_, slotIndex) {
    const entry = entries[slotIndex];
    if (!entry) {
      return '<div class="specific-fixed-slot locked"><span class="specific-slot-number">' + (slotIndex + 1) +
        '</span><span class="specific-slot-content">' + escapeHtml(emptyLabel) + '<small>Composição fechada deste item.</small></span></div>';
    }
    return '<div class="specific-fixed-slot"><span class="specific-slot-number">' + (slotIndex + 1) +
      '</span><span class="specific-slot-content">' + escapeHtml(entry.name) + '<small>' + escapeHtml(entry.description) + '</small></span></div>';
  }).join('');
}

function specificMagicHtml(instance, item) {
  if (!isNamedFixedMagicItem(item)) return '';
  const base = specificBaseSummaryHtml(item);
  const fixedImprovements = fixedSpecificImprovementEntries(item);
  const fixedEnchantments = fixedSpecificEnchantmentEntries(item);
  const liturgicalRules = isLiturgicalItem(item)
    ? '<div class="specific-rules">' +
      renderInfoBlock('Identificação litúrgica', LITURGICAL_IDENTIFICATION_RULE, 'info-rule') +
      renderInfoBlock('Vínculo com ' + (item.magico.divindade || 'a divindade'), item.magico.manifestacaoLiturgica, 'info-grant') + '</div>'
    : '';
  if (!base && !fixedImprovements.length && !fixedEnchantments.length && !liturgicalRules) return '';
  let sections = '';
  if (fixedImprovements.length) {
    sections += '<section class="specific-fixed-section"><div class="specific-fixed-heading"><span>Melhorias fixas</span><small>' +
      fixedImprovements.length + '/4</small></div><div class="specific-fixed-slots">' +
      fixedSpecificSlotsHtml(fixedImprovements, 4, 'Sem outra melhoria fixa') + '</div></section>';
  }
  if (fixedEnchantments.length) {
    const used = Math.min(MAX_ENCHANTMENTS, fixedEnchantments.reduce(function(total, entry) {
      return total + Math.max(1, Number(entry.slotCost) || 1);
    }, 0));
    const enchantmentSlots = expandedSpecificEnchantmentSlots(fixedEnchantments);
    sections += '<section class="specific-fixed-section"><div class="specific-fixed-heading"><span>Encantos fixos</span><small>' +
      used + '/' + MAX_ENCHANTMENTS + '</small></div><div class="specific-fixed-slots">' +
      fixedSpecificSlotsHtml(enchantmentSlots, MAX_ENCHANTMENTS, 'Sem outro encanto fixo') + '</div></section>';
  }
  return '<div class="specific-composition">' + base + (sections ? '<div class="specific-fixed-grid">' + sections + '</div>' : '') + liturgicalRules + '</div>';
}

function ammoCounterHtml(instance, item) {
  const packageSize = ammoPackageSize(item);
  if (!packageSize) return '';
  const maximum = instance.quantity * packageSize;
  const remaining = Math.max(0, Math.min(maximum, Number(instance.ammoRemaining) || 0));
  return '<div class="ammo-row"><span class="quantity-label">Munição restante</span><div class="ammo-counter">' +
    '<button type="button" data-action="use-ammo" aria-label="Gastar uma unidade"' + (remaining <= 0 ? ' disabled' : '') + '>−</button>' +
    '<output>' + remaining + ' / ' + maximum + '</output>' +
    '<button type="button" data-action="restore-ammo" aria-label="Recuperar uma unidade"' + (remaining >= maximum ? ' disabled' : '') + '>+</button></div></div>';
}

function backpackItemHtml(instance) {
  const originalItem = itemById.get(instance.itemId);
  if (!originalItem) return '';
  const item = effectiveItemForOptions(originalItem, instance);
  sanitizeInstanceImprovements(instance, item);
  sanitizeInstanceEnchantments(instance, item);
  const typeMeta = TYPE_META[item.tipo] || { label: humanize(item.tipo), icon: '◆' };
  const category = CATEGORY_LABELS[item.categoriaId] || humanize(item.categoriaId);
  const value = entryValueInfo(instance, item);
  const unitSpaces = improvementSpacePerUnit(instance, item);
  const totalSpaces = unitSpaces * instance.quantity;
  const displayName = configuredItemName(instance, originalItem);
  const availableImprovements = improvements.some(function(improvement) {
    return improvementAppliesToItem(improvement, item);
  });
  const shouldOpen = openImprovementPanels.has(instance.instanceId) || instance.improvements.length > 0;
  const slots = [0, 1, 2, 3].map(function(slotIndex) {
    return '<div class="improvement-field"><label>' + (slotIndex + 1) + 'ª melhoria</label>' +
      improvementOptionsHtml(instance, item, slotIndex) + '</div>';
  }).join('');

  const editor = availableImprovements
    ? '<details class="improvements-panel" data-instance-id="' + escapeHtml(instance.instanceId) + '"' + (shouldOpen ? ' open' : '') + '>' +
      '<summary><span>Melhorias</span><span class="improvement-counter">' + instance.improvements.length + '/4</span></summary>' +
      '<div class="improvement-editor"><div class="improvement-slots">' + slots + materialFieldHtml(instance, item) + '</div>' +
      improvementDetailsHtml(instance, item) + '</div></details>'
    : isNamedFixedMagicItem(item) ? '' : '<p class="no-improvements">Este tipo de item não possui melhorias compatíveis cadastradas.</p>';
  const customization = editor + enchantmentEditorHtml(instance, item) + specificMagicHtml(instance, item);

  return '<article class="backpack-item" data-instance-id="' + escapeHtml(instance.instanceId) + '">' +
    '<header class="backpack-item-header"><div class="backpack-item-title"><span class="item-icon" aria-hidden="true">' + typeMeta.icon + '</span>' +
    '<div><h3>' + escapeHtml(displayName) + '</h3><div class="badges"><span class="badge badge-type-' + escapeHtml(item.tipo) + '">' +
    escapeHtml(typeMeta.label) + '</span><span class="badge">' + escapeHtml(category) + '</span>' + (item.adicionado ? '<span class="badge badge-added">Adicionado</span>' : '') + (item.debugEdited ? '<span class="badge badge-debug">Editado · debug</span>' : '') + '</div></div></div>' +
    '<button class="icon-button" type="button" data-action="remove" title="Remover da mochila" aria-label="Remover ' + escapeHtml(displayName) + '">×</button></header>' +
    '<div class="backpack-item-body"><div class="inventory-column"><div class="inventory-metrics">' +
    '<div class="inventory-metric"><span class="stat-name">Valor unitário</span><strong>' + escapeHtml(formatEntryValue(value, false)) + '</strong></div>' +
    '<div class="inventory-metric"><span class="stat-name">Valor total</span><strong>' + escapeHtml(formatEntryValue(value, true)) + '</strong></div>' +
    '<div class="inventory-metric"><span class="stat-name">Espaços por item</span><strong>' + formatSpaces(unitSpaces) + '</strong></div>' +
    '<div class="inventory-metric"><span class="stat-name">Espaços no total</span><strong>' + formatSpaces(totalSpaces) + '</strong></div></div>' + configuredOptionsSummaryHtml(instance, originalItem) +
    '<div class="quantity-row"><span class="quantity-label">Quantidade</span><div class="quantity-control">' +
    '<button type="button" data-action="decrease" aria-label="Diminuir quantidade">−</button>' +
    '<input type="number" min="1" max="9999" step="1" value="' + instance.quantity + '" data-action="quantity" aria-label="Quantidade de ' + escapeHtml(item.nome) + '">' +
    '<button type="button" data-action="increase" aria-label="Aumentar quantidade">+</button></div></div>' + ammoCounterHtml(instance, item) + '</div>' +
    '<div class="customization-column">' + customization + '</div></div></article>';
}

function backpackCompactHtml(instance) {
  const originalItem = itemById.get(instance.itemId);
  if (!originalItem) return '';
  const item = effectiveItemForOptions(originalItem, instance);
  const isOpen = expandedBackpackInstanceId === instance.instanceId;
  const totalSpaces = improvementSpacePerUnit(instance, item) * instance.quantity;
  const packageSize = ammoPackageSize(item);
  const ammo = packageSize
    ? '<span class="compact-metric metric-ammo"><small>Munição</small><strong>' + Math.max(0, Number(instance.ammoRemaining) || 0) + '/' + (instance.quantity * packageSize) + '</strong></span>'
    : '';
  return '<div class="backpack-compact-entry" data-instance-id="' + escapeHtml(instance.instanceId) + '"><div class="backpack-compact-row">' +
    '<button class="compact-open-button" type="button" data-action="open-details" aria-expanded="' + String(isOpen) + '"><strong>' +
    escapeHtml(configuredItemName(instance, originalItem)) + '</strong></button><span class="compact-metric metric-quantity"><small>Qtd.</small><strong>' + instance.quantity +
    '</strong></span>' + ammo + '<span class="compact-metric metric-spaces"><small>Espaços</small><strong>' + formatSpaces(totalSpaces) +
    '</strong></span><button class="compact-remove" type="button" data-action="remove" aria-label="Remover ' + escapeHtml(configuredItemName(instance, originalItem)) + ' da mochila">×</button></div>' +
    (isOpen ? '<div class="compact-detail">' + backpackItemHtml(instance) + '</div>' : '') + '</div>';
}

function renderBackpackSummary() {
  const totals = backpackTotals();
  renderLoadStats(totals);
  const valueText = formatCurrencyValue(totals.value, 'T$') + (totals.unknownMaterials ? ' + materiais' : '');
  const stats = [
    [totals.entries, totals.entries === 1 ? 'Entrada' : 'Entradas'],
    [totals.quantity, totals.quantity === 1 ? 'Item' : 'Itens'],
    [formatSpaces(totals.spaces), 'Espaços usados'],
    [valueText, 'Valor da mochila']
  ];
  backpackSummary.innerHTML = stats.map(function(stat) {
    return '<div class="summary-stat"><span class="summary-value">' + escapeHtml(stat[0]) + '</span><span class="summary-label">' +
      escapeHtml(stat[1]) + '</span></div>';
  }).join('');
}

function syncCatalogAcquiredUI() {
  itemsGrid.querySelectorAll('.item-card').forEach(function(card) {
    const count = countBackpackItem(card.dataset.itemId);
    card.classList.toggle('acquired', count > 0);
    const indicator = card.querySelector('[data-acquired-count]');
    if (!indicator) return;
    indicator.classList.toggle('has-items', count > 0);
    indicator.textContent = count ? '×' + count : '';
  });
}

function syncBackpackHeader() {
  const totals = backpackTotals();
  backpackViewCount.textContent = String(totals.quantity);
  clearBackpack.disabled = totals.entries === 0 || !activeCharacterProfile();
}

function syncBackpackModeButtons() {
  const listMode = state.backpackMode === 'list';
  backpackListModeBtn.classList.toggle('active', listMode);
  backpackCardsModeBtn.classList.toggle('active', !listMode);
  backpackListModeBtn.setAttribute('aria-pressed', String(listMode));
  backpackCardsModeBtn.setAttribute('aria-pressed', String(!listMode));
}

function setBackpackMode(mode) {
  state.backpackMode = mode === 'cards' ? 'cards' : 'list';
  expandedBackpackInstanceId = null;
  try { localStorage.setItem(BACKPACK_MODE_STORAGE_KEY, state.backpackMode); } catch (error) {}
  renderBackpack();
}

function renderBackpack() {
  backpackItems.forEach(function(instance) {
    const item = itemById.get(instance.itemId);
    if (item) {
      sanitizeInstanceImprovements(instance, item);
      sanitizeInstanceEnchantments(instance, item);
    }
  });
  const listMode = state.backpackMode === 'list';
  backpackList.classList.toggle('list-mode', listMode);
  backpackList.classList.toggle('cards-mode', !listMode);
  backpackList.innerHTML = backpackItems.map(listMode ? backpackCompactHtml : backpackItemHtml).join('');
  backpackEmpty.classList.toggle('visible', backpackItems.length === 0);
  const emptyText = backpackEmpty.querySelector('p');
  if (emptyText) emptyText.textContent = activeCharacterProfile()
    ? 'Adquira itens no catálogo para começar.'
    : 'Cadastre ou abra um personagem para usar uma mochila.';
  renderBackpackSummary();
  syncBackpackHeader();
  syncBackpackModeButtons();
  backpackList.querySelectorAll('.improvements-panel').forEach(function(panel) {
    panel.addEventListener('toggle', function() {
      if (panel.open) openImprovementPanels.add(panel.dataset.instanceId);
      else openImprovementPanels.delete(panel.dataset.instanceId);
    });
  });
  backpackList.querySelectorAll('.enchantments-panel').forEach(function(panel) {
    panel.addEventListener('toggle', function() {
      if (panel.open) openEnchantmentPanels.add(panel.dataset.instanceId);
      else openEnchantmentPanels.delete(panel.dataset.instanceId);
    });
  });
}

function refreshInventoryUI() {
  persistBackpack();
  syncBackpackHeader();
  if (state.view === 'backpack') renderBackpack();
  else syncCatalogAcquiredUI();
}

function addPackagesToBackpack(itemId, packageQuantity, rawOptions, acquisition, configuration) {
  const item = itemById.get(itemId);
  if (!item) return;
  const amount = Math.max(1, Math.floor(Number(packageQuantity) || 1));
  const options = normalizeItemOptions(itemId, rawOptions);
  const optionKey = itemOptionsKey(itemId, options);
  const configuredImprovements=(configuration?.improvements||[]).map(choice=>({...choice})),configuredEnchantments=[...(configuration?.enchantments||[])];
  let instance = backpackItems.find(function(entry) {
    return entry.itemId === itemId && JSON.stringify(entry.acquisition || {source: 'unknown'}) === JSON.stringify(acquisition || {source: 'unknown'}) && itemOptionsKey(itemId, entry.options) === optionKey && JSON.stringify(entry.improvements||[])===JSON.stringify(configuredImprovements) && JSON.stringify(entry.enchantments||[])===JSON.stringify(configuredEnchantments) && entry.quantity < 9999;
  });
  const packageSize = ammoPackageSize(item);
  if (instance) {
    const accepted = Math.min(amount, 9999 - instance.quantity);
    if (packageSize) instance.ammoRemaining = Math.min((instance.quantity + accepted) * packageSize, (Number(instance.ammoRemaining) || 0) + accepted * packageSize);
    instance.quantity += accepted;
  } else {
    const quantity = Math.min(9999, amount);
    backpackItems.push({
      instanceId: createInstanceId(), itemId: itemId, quantity: quantity,
      acquisition: acquisition || {source: 'unknown'},
      displayName: item.nome,
      options: options,
      ammoRemaining: packageSize ? quantity * packageSize : undefined,
      improvements: configuredImprovements, enchantments: configuredEnchantments
    });
  }
}

function checkoutCartToBackpack() {
  const active = activeCharacterProfile();
  if (!active) {
    reopenCartAfterCharacter = true;
    closeModal(cartModal);
    renderCharacterList();
    openModal(characterModal);
    showToast('Cadastre ou abra um personagem antes de finalizar o carrinho.');
    return;
  }
  const total = cartItems.reduce(function(sum, entry) { return sum + entry.quantity; }, 0);
  cartItems.forEach(function(entry) { addPackagesToBackpack(entry.itemId, entry.quantity, entry.options,undefined,entry); });
  cartItems = [];
  persistCart();
  refreshInventoryUI();
  renderCart();
  closeModal(cartModal);
  setView('backpack');
  showToast(total + (total === 1 ? ' item guardado' : ' itens guardados') + ' na mochila de ' + active.name + '.');
}

function setView(view) {
  state.view = view === 'backpack' ? 'backpack' : 'catalog';
  const showBackpack = state.view === 'backpack';
  catalogView.hidden = showBackpack;
  backpackView.hidden = !showBackpack;
  filtersPanel.hidden = showBackpack;
  resetFilters.hidden = showBackpack;
  catalogViewBtn.classList.toggle('active', !showBackpack);
  backpackViewBtn.classList.toggle('active', showBackpack);
  catalogViewBtn.setAttribute('aria-pressed', String(!showBackpack));
  backpackViewBtn.setAttribute('aria-pressed', String(showBackpack));
  if (showBackpack) renderBackpack();
  else applyFilters();
}

let catalogRevision = 0;
let cachedFilterKey = '';
let cachedFilterResults = [];
function filteredItems() {
  const key = JSON.stringify([catalogRevision,preparedItems.length,state.type,state.specific,state.category,state.combat,state.grip,state.search,state.searchNameOnly,state.sort]);
  if (key === cachedFilterKey) return cachedFilterResults;
  const search = normalizeText(state.search);
  const results = preparedItems.filter(function(item) {
    const typeOk = state.type === 'todos' || item.tipo === state.type;
    const specificOk = state.specific === 'todos' ||
      (state.specific === 'especifico' && isSpecificMagicItem(item)) ||
      (state.specific === 'liturgico' && isLiturgicalItem(item)) ||
      (state.specific === 'convencional' && !isNamedFixedMagicItem(item));
    const categoryOk = state.category === 'todos' || (item.categoriaId || 'sem_categoria') === state.category;
    const combatOk = state.combat === 'todos' || item.arma && item.arma.combateId === state.combat;
    const gripOk = state.grip === 'todos' || item.arma && item.arma.empunhaduraId === state.grip;
    const searchOk = !search || (state.searchNameOnly ? item._searchName : item._search).includes(search);
    return typeOk && specificOk && categoryOk && combatOk && gripOk && searchOk;
  });

  results.sort(function(a, b) {
    if (state.sort === 'price-asc') return Number(a.preco.valor) - Number(b.preco.valor) || a.nome.localeCompare(b.nome, 'pt-BR');
    if (state.sort === 'price-desc') return Number(b.preco.valor) - Number(a.preco.valor) || a.nome.localeCompare(b.nome, 'pt-BR');
    if (state.sort === 'space-asc') return Number(a.espacos) - Number(b.espacos) || a.nome.localeCompare(b.nome, 'pt-BR');
    if (state.sort === 'type') return (TYPE_META[a.tipo] && TYPE_META[a.tipo].label || a.tipo).localeCompare(TYPE_META[b.tipo] && TYPE_META[b.tipo].label || b.tipo, 'pt-BR') || a.nome.localeCompare(b.nome, 'pt-BR');
    return a.nome.localeCompare(b.nome, 'pt-BR');
  });
  cachedFilterKey = key;
  cachedFilterResults = results;
  return results;
}

function updateTitle() {
  if (state.type === 'todos') catalogTitle.textContent = 'Todos os itens';
  else if (state.category !== 'todos') catalogTitle.textContent = CATEGORY_LABELS[state.category] || humanize(state.category);
  else catalogTitle.textContent = TYPE_META[state.type] && TYPE_META[state.type].label || humanize(state.type);
}

function checkCatalogOverflow() {
  const cards = Array.from(itemsGrid.querySelectorAll('.item-card')).filter(card => !card.classList.contains('expanded') && !card.closest('.catalog-list-entry'));
  cards.forEach(card => { card.classList.remove('is-truncated'); card.style.maxHeight = 'none'; });
  const heights = cards.map(card => card.scrollHeight);
  cards.forEach((card, index) => {
    card.style.maxHeight = '';
    card.classList.toggle('is-truncated', heights[index] > 450);
    const button = card.querySelector('.expand-item-button');
    if (button) button.style.display = heights[index] > 450 ? 'block' : 'none';
  });
}

let catalogPageSize = 48;
let catalogQueryKey = '';
let catalogMarkup = '';
let searchTimer = 0;
function applyFilters(loadMore = false) {
  window.clearTimeout(searchTimer);
  syncFilterUI();
  updateTitle();
  const results = filteredItems();
  const key = JSON.stringify([state.type,state.specific,state.category,state.combat,state.grip,state.search,state.searchNameOnly,state.sort,state.debugMode,state.inspirationMode]);
  if (key !== catalogQueryKey) catalogPageSize = 48;
  if (loadMore === true) catalogPageSize += 48;
  catalogQueryKey = key;
  const markup = results.slice(0, catalogPageSize).map(itemCard).join('') + (results.length > catalogPageSize ? '<button type="button" class="view-button" data-load-more style="grid-column:1/-1;justify-self:center">Carregar mais</button>' : '');
  if (markup !== catalogMarkup || itemsGrid.querySelector('.catalog-list-entry')) {
    const expanded = new Set(Array.from(itemsGrid.querySelectorAll('.item-card.expanded')).map(card => card.dataset.itemId));
    if (loadMore === true && itemsGrid.insertAdjacentHTML) {
      itemsGrid.querySelector('[data-load-more]')?.remove();
      itemsGrid.insertAdjacentHTML('beforeend', results.slice(catalogPageSize - 48, catalogPageSize).map(itemCard).join('') + (results.length > catalogPageSize ? '<button type="button" class="view-button" data-load-more style="grid-column:1/-1;justify-self:center">Carregar mais</button>' : ''));
    } else itemsGrid.innerHTML = markup;
    itemsGrid.querySelectorAll('.item-card').forEach(card => {
      if (expanded.has(card.dataset.itemId)) {card.classList.add('expanded');const button=card.querySelector('.expand-item-button');if(button){button.textContent='Recolher';button.setAttribute('aria-expanded','true')}}
    });
    catalogMarkup = markup;
    checkCatalogOverflow();
  }
  resultCount.textContent = results.length + (results.length === 1 ? ' item' : ' itens');
  emptyState.classList.toggle('visible', results.length === 0);
}

function getBackpackInstance(instanceId) {
  return backpackItems.find(function(entry) { return entry.instanceId === instanceId; });
}

function setInstanceQuantity(instance, quantity) {
  const item = itemById.get(instance.itemId);
  const packageSize = ammoPackageSize(item);
  const previous = instance.quantity;
  const next = Math.max(1, Math.min(9999, Math.floor(Number(quantity) || 1)));
  if (packageSize) {
    const currentAmmo = Math.max(0, Number(instance.ammoRemaining) || 0);
    instance.ammoRemaining = next > previous
      ? Math.min(next * packageSize, currentAmmo + (next - previous) * packageSize)
      : Math.min(next * packageSize, currentAmmo);
  }
  instance.quantity = next;
  refreshInventoryUI();
}

function changeAmmo(instance, delta) {
  const item = itemById.get(instance.itemId);
  const packageSize = ammoPackageSize(item);
  if (!packageSize) return;
  const maximum = instance.quantity * packageSize;
  instance.ammoRemaining = Math.max(0, Math.min(maximum, (Number(instance.ammoRemaining) || 0) + delta));
  refreshInventoryUI();
}

function setInstanceImprovement(instance, item, slotIndex, improvementId) {
  const choices = (instance.improvements || []).slice();
  if (!improvementId) {
    choices.splice(slotIndex, 1);
  } else {
    const previous = choices[slotIndex];
    choices[slotIndex] = {
      id: improvementId,
      materialId: previous && previous.id === improvementId ? previous.materialId : ''
    };
  }
  instance.improvements = choices.filter(Boolean);
  sanitizeInstanceImprovements(instance, item);
  openImprovementPanels.add(instance.instanceId);
  refreshInventoryUI();
}

function setInstanceEnchantment(instance, item, slotIndex, enchantmentId) {
  const choices = (instance.enchantments || []).slice();
  if (!enchantmentId) choices.splice(slotIndex, 1);
  else choices[slotIndex] = enchantmentId;
  instance.enchantments = choices.filter(Boolean);
  sanitizeInstanceEnchantments(instance, item);
  openEnchantmentPanels.add(instance.instanceId);
  refreshInventoryUI();
}

const CUSTOM_CATEGORY_OPTIONS = {
  arma: [['simples', 'Simples'], ['marcial', 'Marcial'], ['exotica', 'Exótica'], ['fogo', 'Arma de fogo']],
  municao: [['municao', 'Munição']],
  armadura: [['leve', 'Leve'], ['pesada', 'Pesada']],
  escudo: [['leve', 'Leve'], ['pesado', 'Pesado']],
  acessorio: [['acessorio_menor', 'Acessório menor'], ['acessorio_medio', 'Acessório médio'], ['acessorio_maior', 'Acessório maior']],
  item_geral: [
    ['equipamento_aventura', 'Equipamento de aventura'], ['vestuario', 'Vestuário'], ['ferramenta', 'Ferramenta'],
    ['instrumento', 'Instrumento'], ['esoterico', 'Esotérico'], ['alquimico_catalisador', 'Alquímico · Catalisador'],
    ['alquimico_preparado', 'Alquímico · Preparado'], ['alquimico_venenoso', 'Alquímico · Veneno'],
    ['animal', 'Animal'], ['servico', 'Serviço'], ['alimentacao', 'Alimentação'], ['bebida', 'Bebida'],
    ['aparato', 'Aparato'], ['veiculo', 'Veículo'], ['sem_categoria', 'Outro']
  ]
};

function updateCustomItemFields() {
  const type = customItemType.value;
  const options = CUSTOM_CATEGORY_OPTIONS[type] || CUSTOM_CATEGORY_OPTIONS.item_geral;
  customItemCategory.innerHTML = options.map(function(option) {
    return '<option value="' + escapeHtml(option[0]) + '">' + escapeHtml(option[1]) + '</option>';
  }).join('');
  customWeaponFields.hidden = !['arma', 'municao'].includes(type);
  customProtectionFields.hidden = !['armadura', 'escudo'].includes(type);
  customMagicTierField.hidden = !customItemSpecific.checked;
  customMagicComposition.hidden = !customItemSpecific.checked;
  renderCustomMagicCompositionOptions();
}

const CUSTOM_FORM_FIELD_NAMES = [
  'name', 'type', 'category', 'price', 'spaces', 'grant', 'ability', 'description',
  'weaponDamage', 'criticalMargin', 'criticalMultiplier', 'combat', 'grip', 'range',
  'damageType', 'defense', 'armorPenalty', 'magicTier',
  'fixedImprovement1', 'fixedImprovement2', 'fixedImprovement3', 'fixedImprovement4',
  'fixedMaterial', 'fixedEnchantment1', 'fixedEnchantment2', 'fixedEnchantment3'
];

function customFormControl(name) {
  return customItemForm.elements.namedItem(name);
}

function setCustomFormValue(name, value) {
  const control = customFormControl(name);
  if (control) control.value = value == null ? '' : String(value);
}

function customCompatibilityItem() {
  const type = customItemType.value || 'item_geral';
  const category = customItemCategory.value || 'sem_categoria';
  const item = {
    id: 'rascunho_item_adicionado', tipo: type, categoriaId: category,
    preco: { valor: 0, moeda: 'T$' }, espacos: 1,
    equipamento: { equipavel: true, slotsPermitidos: [], ocupaMao: ['arma', 'municao', 'escudo'].includes(type) }
  };
  if (['arma', 'municao'].includes(type)) {
    item.arma = {
      combateId: customFormControl('combat') && customFormControl('combat').value || (type === 'municao' ? 'a_distancia' : 'corpo_a_corpo'),
      empunhaduraId: customFormControl('grip') && customFormControl('grip').value || 'uma_mao',
      dano: { principal: customFormControl('weaponDamage') && customFormControl('weaponDamage').value || '1d6', alternativas: [] },
      critico: { margem: 20, multiplicador: 2 },
      alcanceId: customFormControl('range') && customFormControl('range').value || null,
      tipoDanoIds: [customFormControl('damageType') && customFormControl('damageType').value || 'impacto'],
      propriedadesIds: [], gruposArmaIds: []
    };
  } else if (type === 'armadura') {
    item.armadura = { categoriaId: category };
  } else if (type === 'escudo') {
    item.escudo = { categoriaId: category };
  }
  return item;
}

function selectedCustomCompositionIds(prefix, maximum) {
  return Array.from({ length: maximum }, function(_, index) {
    const control = customFormControl(prefix + (index + 1));
    return control && control.value || '';
  }).filter(Boolean);
}

function renderCustomMagicCompositionOptions() {
  const item = customCompatibilityItem();
  const materialControl = customFormControl('fixedMaterial');
  const selectedMaterial = materialControl && materialControl.value || '';
  const improvementInstance = {
    improvements: selectedCustomCompositionIds('fixedImprovement', 4).map(function(id) {
      return { id: id, materialId: id === 'material_especial' ? selectedMaterial : '' };
    }),
    enchantments: []
  };
  sanitizeInstanceImprovements(improvementInstance, item);
  const allowedImprovements = improvements.filter(function(improvement) {
    return improvementAppliesToItem(improvement, item);
  });
  Array.from({ length: 4 }, function(_, index) {
    const control = customFormControl('fixedImprovement' + (index + 1));
    if (!control) return;
    const current = improvementInstance.improvements[index] && improvementInstance.improvements[index].id || '';
    control.innerHTML = '<option value="">Nenhuma</option>' + allowedImprovements.map(function(improvement) {
      return '<option value="' + escapeHtml(improvement.id) + '">' + escapeHtml(improvement.nome) + '</option>';
    }).join('');
    control.value = current;
  });

  const materialChoice = improvementInstance.improvements.find(function(choice) { return choice.id === 'material_especial'; });
  const allowedMaterials = materialOptionsForItem(item);
  customFixedMaterialField.hidden = !materialChoice || !allowedMaterials.length;
  if (materialControl) {
    materialControl.innerHTML = allowedMaterials.map(function(material) {
      return '<option value="' + escapeHtml(material.id) + '">' + escapeHtml(material.nome) + '</option>';
    }).join('');
    if (materialChoice && allowedMaterials.some(function(material) { return material.id === materialChoice.materialId; })) {
      materialControl.value = materialChoice.materialId;
    }
  }

  const enchantmentInstance = { improvements: [], enchantments: selectedCustomCompositionIds('fixedEnchantment', 3) };
  sanitizeInstanceEnchantments(enchantmentInstance, item);
  const allowedEnchantments = enchantments.filter(function(enchantment) {
    return enchantmentAppliesToItem(enchantment, item);
  });
  Array.from({ length: 3 }, function(_, index) {
    const control = customFormControl('fixedEnchantment' + (index + 1));
    if (!control) return;
    const current = enchantmentInstance.enchantments[index] || '';
    control.innerHTML = '<option value="">Nenhum</option>' + allowedEnchantments.map(function(enchantment) {
      const cost = enchantmentSlotCost(enchantment);
      return '<option value="' + escapeHtml(enchantment.id) + '">' + escapeHtml(enchantment.nome + (cost > 1 ? ' · ' + cost + ' espaços' : '')) + '</option>';
    }).join('');
    control.value = current;
  });
}

function captureCustomItemDraft() {
  const values = {};
  CUSTOM_FORM_FIELD_NAMES.forEach(function(name) {
    const control = customFormControl(name);
    if (control) values[name] = control.value;
  });
  values.specific = customItemSpecific.checked;
  return values;
}

function applyCustomItemDraft(draft) {
  const values = draft || {};
  customItemForm.reset();
  customItemType.value = values.type || 'item_geral';
  customItemSpecific.checked = Boolean(values.specific);
  updateCustomItemFields();
  CUSTOM_FORM_FIELD_NAMES.forEach(function(name) {
    if (name === 'type' || name === 'category' || values[name] == null) return;
    setCustomFormValue(name, values[name]);
  });
  setCustomFormValue('category', values.category || customItemCategory.value);
  updateCustomItemFields();
  setCustomFormValue('category', values.category || customItemCategory.value);
  setCustomFormValue('magicTier', values.magicTier || 'menor');
}

function cloneInspirationItem(item) {
  const copy = JSON.parse(JSON.stringify(item));
  delete copy._books;
  delete copy._search;
  delete copy._searchName;
  delete copy.adicionado;
  return copy;
}

function updateCustomItemDialogCopy(inspirationName) {
  customItemModalTitle.textContent = editingCustomItemId ? 'Editar item adicionado' : 'Cadastrar novo item';
  saveCustomItemButton.textContent = editingCustomItemId ? 'Salvar alterações' : 'Cadastrar item';
  customItemNote.textContent = inspirationName
    ? 'Inspirado em “' + inspirationName + '”. Revise e modifique livremente os atributos, textos, melhorias e encantos.'
    : editingCustomItemId
      ? 'Altere o nome ou qualquer outra informação do item. O mesmo item será atualizado no catálogo, carrinho e mochilas.'
      : 'Preencha as informações conhecidas. O item será salvo neste navegador e receberá a tag “Adicionado”.';
}

function fillCustomItemFormFromInspiration(originalItem) {
  const item = effectiveItemForOptions(originalItem, { options: catalogOptionsForItem(originalItem) });
  const texts = item.textos || {};
  const weapon = item.arma || {};
  const critical = weapon.critico || {};
  const protection = item.armadura || item.escudo || {};
  customItemForm.reset();
  customItemType.value = item.tipo;
  customItemSpecific.checked = isNamedFixedMagicItem(item);
  updateCustomItemFields();
  setCustomFormValue('name', item.nome);
  setCustomFormValue('category', item.categoriaId || 'sem_categoria');
  setCustomFormValue('price', item.preco && item.preco.valor || 0);
  setCustomFormValue('spaces', item.espacos == null ? 1 : item.espacos);
  setCustomFormValue('grant', texts.habilidade || '');
  setCustomFormValue('ability', texts.variavel || '');
  setCustomFormValue('description', texts.descricao || '');
  if (item.arma) {
    setCustomFormValue('weaponDamage', weapon.dano && weapon.dano.principal || '1d6');
    setCustomFormValue('criticalMargin', critical.margem || 20);
    setCustomFormValue('criticalMultiplier', critical.multiplicador || 2);
    setCustomFormValue('combat', weapon.combateId || (item.tipo === 'municao' ? 'a_distancia' : 'corpo_a_corpo'));
    setCustomFormValue('grip', weapon.empunhaduraId || 'uma_mao');
    setCustomFormValue('range', weapon.alcanceId || '');
    setCustomFormValue('damageType', weapon.tipoDanoIds && weapon.tipoDanoIds[0] || 'impacto');
  }
  if (item.armadura) {
    setCustomFormValue('defense', protection.defesa || 0);
    setCustomFormValue('armorPenalty', protection.penalidade || 0);
  } else if (item.escudo) {
    setCustomFormValue('defense', protection.bonusDefesa || 0);
    setCustomFormValue('armorPenalty', protection.penalidade || 0);
  }
  const fixedImprovements = item.magico && item.magico.melhoriasFixasIds || [];
  const fixedEnchantments = item.magico && item.magico.encantosFixosIds || [];
  Array.from({ length: 4 }, function(_, index) {
    setCustomFormValue('fixedImprovement' + (index + 1), fixedImprovements[index] || '');
  });
  renderCustomMagicCompositionOptions();
  setCustomFormValue('fixedMaterial', item.magico && item.magico.materialEspecialId || '');
  Array.from({ length: 3 }, function(_, index) {
    setCustomFormValue('fixedEnchantment' + (index + 1), fixedEnchantments[index] || '');
  });
  renderCustomMagicCompositionOptions();
  setCustomFormValue('magicTier', item.magico && item.magico.categoriaId || 'menor');
  customItemInspirationTemplate = cloneInspirationItem(item);
  updateCustomItemDialogCopy(item.nome);
}

function syncInspirationModeUI() {
  inspirationBar.hidden = !state.inspirationMode;
}

function beginInspirationSelection() {
  customItemDraftBeforeInspiration = captureCustomItemDraft();
  customItemTemplateBeforeInspiration = customItemInspirationTemplate;
  state.inspirationMode = true;
  closeModal(customItemModal);
  syncInspirationModeUI();
  setView('catalog');
  showToast('Escolha no catálogo o item que servirá de inspiração.');
}

function cancelInspirationSelection() {
  state.inspirationMode = false;
  syncInspirationModeUI();
  customItemInspirationTemplate = customItemTemplateBeforeInspiration;
  applyCustomItemDraft(customItemDraftBeforeInspiration);
  updateCustomItemDialogCopy(customItemInspirationTemplate && customItemInspirationTemplate.nome);
  customItemDraftBeforeInspiration = null;
  customItemTemplateBeforeInspiration = null;
  applyFilters();
  openModal(customItemModal);
  window.setTimeout(function() { customItemName.focus(); }, 0);
}

function selectItemInspiration(itemId) {
  const item = itemById.get(itemId);
  if (!item) return;
  state.inspirationMode = false;
  syncInspirationModeUI();
  fillCustomItemFormFromInspiration(item);
  customItemDraftBeforeInspiration = null;
  customItemTemplateBeforeInspiration = null;
  applyFilters();
  openModal(customItemModal);
  showToast(item.nome + ' importado como inspiração.');
  window.setTimeout(function() { customItemName.focus(); customItemName.select(); }, 0);
}

function resetCustomItemCreation() {
  editingCustomItemId = null;
  customItemInspirationTemplate = null;
  customItemDraftBeforeInspiration = null;
  customItemTemplateBeforeInspiration = null;
  customItemForm.reset();
  updateCustomItemFields();
  updateCustomItemDialogCopy('');
}

function persistCustomItems() {
  try { localStorage.setItem(CUSTOM_ITEMS_STORAGE_KEY, JSON.stringify(customItems)); }
  catch (error) { showToast('Não foi possível salvar o item personalizado neste navegador.'); }
}

function buildCustomItem(form) {
  const data = new FormData(form);
  const type = String(data.get('type') || 'item_geral');
  const category = String(data.get('category') || 'sem_categoria');
  const inspiration = customItemInspirationTemplate && customItemInspirationTemplate.tipo === type
    ? cloneInspirationItem(customItemInspirationTemplate)
    : null;
  const item = Object.assign({}, inspiration || {}, {
    id: editingCustomItemId || 'adicionado_' + createInstanceId(),
    nome: String(data.get('name') || '').trim().slice(0, 80),
    tipo: type,
    categoriaId: category,
    livroOrigemId: 'adicionado',
    livrosOrigemIds: ['adicionado'],
    adicionado: true,
    preco: { valor: Math.max(0, Number(data.get('price')) || 0), moeda: 'T$' },
    espacos: Math.max(0, Number(data.get('spaces')) || 0),
    equipamento: Object.assign({}, inspiration && inspiration.equipamento || {}, { equipavel: !(type === 'item_geral' && category === 'servico'), slotsPermitidos: [], ocupaMao: ['arma', 'municao', 'escudo'].includes(type), itemVestido: ['armadura', 'acessorio'].includes(type) }),
    textos: {
      habilidade: String(data.get('grant') || '').trim().slice(0, 500),
      variavel: String(data.get('ability') || '').trim().slice(0, 1600),
      descricao: String(data.get('description') || '').trim().slice(0, 1200)
    },
    efeitos: inspiration && Array.isArray(inspiration.efeitos) ? inspiration.efeitos : []
  });
  delete item.magico;
  if (['arma', 'municao'].includes(type)) {
    item.equipamento.slotsPermitidos = ['mao_direita', 'mao_esquerda'];
    const inspiredWeapon = inspiration && inspiration.arma || {};
    item.arma = Object.assign({}, inspiredWeapon, {
      combateId: String(data.get('combat') || (type === 'municao' ? 'a_distancia' : 'corpo_a_corpo')),
      empunhaduraId: String(data.get('grip') || 'uma_mao'),
      dano: Object.assign({}, inspiredWeapon.dano || {}, { principal: String(data.get('weaponDamage') || '1d6').trim().slice(0, 20), alternativas: inspiredWeapon.dano && Array.isArray(inspiredWeapon.dano.alternativas) ? inspiredWeapon.dano.alternativas : [] }),
      critico: Object.assign({}, inspiredWeapon.critico || {}, { margem: Math.max(1, Math.min(20, Number(data.get('criticalMargin')) || 20)), multiplicador: Math.max(2, Number(data.get('criticalMultiplier')) || 2) }),
      alcanceId: String(data.get('range') || '') || null,
      tipoDanoIds: [String(data.get('damageType') || 'impacto')],
      propriedadesIds: Array.isArray(inspiredWeapon.propriedadesIds) ? inspiredWeapon.propriedadesIds : [],
      gruposArmaIds: Array.isArray(inspiredWeapon.gruposArmaIds) ? inspiredWeapon.gruposArmaIds : []
    });
  } else if (type === 'armadura') {
    item.equipamento.slotsPermitidos = ['armadura'];
    item.armadura = Object.assign({}, inspiration && inspiration.armadura || {}, { categoriaId: category, defesa: Number(data.get('defense')) || 0, penalidade: Number(data.get('armorPenalty')) || 0, usaDestrezaNaDefesa: category === 'leve' });
  } else if (type === 'escudo') {
    item.equipamento.slotsPermitidos = ['mao_direita', 'mao_esquerda'];
    item.escudo = Object.assign({}, inspiration && inspiration.escudo || {}, { categoriaId: category, bonusDefesa: Number(data.get('defense')) || 0, penalidade: Number(data.get('armorPenalty')) || 0 });
  } else if (type === 'acessorio') {
    item.equipamento.slotsPermitidos = ['vestuario'];
  }
  const fixedComposition = {
    improvements: Array.from({ length: 4 }, function(_, index) {
      const id = String(data.get('fixedImprovement' + (index + 1)) || '');
      return id ? { id: id, materialId: id === 'material_especial' ? String(data.get('fixedMaterial') || '') : '' } : null;
    }).filter(Boolean),
    enchantments: Array.from({ length: 3 }, function(_, index) {
      return String(data.get('fixedEnchantment' + (index + 1)) || '');
    }).filter(Boolean)
  };
  sanitizeInstanceImprovements(fixedComposition, item);
  sanitizeInstanceEnchantments(fixedComposition, item);
  const fixedMaterialChoice = fixedComposition.improvements.find(function(choice) { return choice.id === 'material_especial'; });
  if (data.get('specific')) {
    item.magico = Object.assign({}, inspiration && inspiration.magico || {}, {
      tipo: 'especifico', categoriaId: String(data.get('magicTier') || 'menor'),
      baseItemId: inspiration && inspiration.magico && inspiration.magico.baseItemId || null,
      melhoriasFixasIds: fixedComposition.improvements.map(function(choice) { return choice.id; }),
      materialEspecialId: fixedMaterialChoice && fixedMaterialChoice.materialId || null,
      encantosFixosIds: fixedComposition.enchantments,
      caracteristicasFixas: inspiration && inspiration.magico && inspiration.magico.caracteristicasFixas || [],
      encantosEspeciais: inspiration && inspiration.magico && inspiration.magico.encantosEspeciais || [],
      espacosFixos: item.espacos,
      fabricavel: inspiration && inspiration.magico && inspiration.magico.fabricavel !== undefined ? inspiration.magico.fabricavel : true
    });
  } else delete item.magico;
  return item;
}

function registerCustomItem(form) {
  const item = buildCustomItem(form);
  if (!item.nome) return;
  const prepared = prepareCatalogItem(item);
  const wasEditing = Boolean(editingCustomItemId);
  if (wasEditing) {
    const customIndex = customItems.findIndex(function(candidate) { return candidate.id === item.id; });
    const preparedIndex = preparedItems.findIndex(function(candidate) { return candidate.id === item.id; });
    if (customIndex >= 0) customItems[customIndex] = item;
    else customItems.push(item);
    if (preparedIndex >= 0) preparedItems[preparedIndex] = prepared;
    else preparedItems.push(prepared);
  } else {
    customItems.push(item);
    preparedItems.push(prepared);
  }
  persistCustomItems();
  itemById.set(prepared.id, prepared);
  catalogRevision++;
  state.type = 'todos';
  state.specific = 'convencional';
  state.category = 'todos';
  state.combat = 'todos';
  state.grip = 'todos';
  state.search = '';
  searchInput.value = '';
  renderTypeFilters();
  renderSpecificFilters();
  renderContextFilters();
  closeModal(customItemModal);
  state.inspirationMode = false;
  syncInspirationModeUI();
  resetCustomItemCreation();
  setView('catalog');
  showToast(wasEditing ? item.nome + ' atualizado no catálogo.' : item.nome + ' cadastrado e adicionado ao catálogo.');
}

function editCustomItem(itemId) {
  const item = itemById.get(itemId);
  if (!item || !item.adicionado) return;
  editingCustomItemId = item.id;
  fillCustomItemFormFromInspiration(item);
  updateCustomItemDialogCopy('');
  openModal(customItemModal);
  window.setTimeout(function() { customItemName.focus(); customItemName.select(); }, 0);
}

async function deleteCustomItem(itemId) {
  const item = itemById.get(itemId);
  if (!item || !item.adicionado) return;
  if (await catalogDecision('Apagar “' + item.nome + '”? O item também será removido do carrinho e das mochilas em que estiver.', [{value:'keep',label:'Não, manter'},{value:'remove',label:'Sim, apagar',danger:true}], 'Apagar item') !== 'remove') return;
  const customIndex = customItems.findIndex(function(candidate) { return candidate.id === itemId; });
  if (customIndex >= 0) customItems.splice(customIndex, 1);
  const preparedIndex = preparedItems.findIndex(function(candidate) { return candidate.id === itemId; });
  if (preparedIndex >= 0) preparedItems.splice(preparedIndex, 1);
  catalogRevision++;
  itemById.delete(itemId);
  catalogOptionDrafts.delete(itemId);
  cartItems = cartItems.filter(function(entry) { return entry.itemId !== itemId; });
  characterProfiles.profiles.forEach(function(profile) {
    profile.backpack = profile.backpack.filter(function(entry) { return entry.itemId !== itemId; });
  });
  const active = activeCharacterProfile();
  backpackItems = active ? active.backpack : [];
  persistCustomItems();
  persistCart();
  persistCharacterProfiles();
  renderTypeFilters();
  renderSpecificFilters();
  renderContextFilters();
  syncCartUI();
  syncBackpackHeader();
  setView('catalog');
  showToast(item.nome + ' apagado do catálogo.');
}

function persistDebugItemOverrides() {
  try {
    localStorage.setItem(DEBUG_ITEM_OVERRIDES_STORAGE_KEY, JSON.stringify(debugItemOverrides));
  } catch (error) {
    showToast('Não foi possível salvar a correção do modo debug neste navegador.');
  }
}

function rebuildCanonicalPreparedItem(itemId) {
  const canonical = canonicalItemById.get(itemId);
  if (!canonical) return null;
  const prepared = prepareCatalogItem(applyDebugItemOverride(canonical));
  const index = preparedItems.findIndex(function(item) { return item.id === itemId; });
  if (index >= 0) preparedItems[index] = prepared;
  else preparedItems.push(prepared);
  itemById.set(itemId, prepared);
  catalogRevision++;
  return prepared;
}

function openDebugItemEditor(itemId) {
  const canonical = canonicalItemById.get(itemId);
  const item = itemById.get(itemId);
  if (!canonical || !item || item.adicionado) return;
  debugEditingItemId = itemId;
  const texts = item.textos || {};
  debugItemName.value = item.nome || '';
  debugItemGrant.value = texts.habilidade || '';
  debugItemRules.value = texts.variavel || '';
  debugItemDescription.value = texts.descricao || '';
  restoreDebugItemButton.hidden = !debugItemOverrides[itemId];
  openModal(debugItemModal);
  window.setTimeout(function() { debugItemName.focus(); debugItemName.select(); }, 0);
}

function saveDebugItemCorrection() {
  const canonical = canonicalItemById.get(debugEditingItemId);
  if (!canonical) return;
  const baseline = prepareCatalogItem(canonical);
  const correction = {
    nome: String(debugItemName.value || '').trim().slice(0, 100),
    textos: {
      habilidade: String(debugItemGrant.value || '').trim().slice(0, 4000),
      variavel: String(debugItemRules.value || '').trim().slice(0, 8000),
      descricao: String(debugItemDescription.value || '').trim().slice(0, 8000)
    }
  };
  if (!correction.nome) return;
  const baselineTexts = baseline.textos || {};
  const unchanged = correction.nome === baseline.nome &&
    correction.textos.habilidade === String(baselineTexts.habilidade || '') &&
    correction.textos.variavel === String(baselineTexts.variavel || '') &&
    correction.textos.descricao === String(baselineTexts.descricao || '');
  if (unchanged) delete debugItemOverrides[debugEditingItemId];
  else debugItemOverrides[debugEditingItemId] = correction;
  persistDebugItemOverrides();
  const prepared = rebuildCanonicalPreparedItem(debugEditingItemId);
  debugEditingItemId = null;
  closeModal(debugItemModal);
  applyFilters();
  showToast(unchanged ? 'O item já corresponde ao texto canônico.' : prepared.nome + ' corrigido no modo debug.');
}

function restoreCanonicalItemText() {
  if (!debugEditingItemId || !canonicalItemById.has(debugEditingItemId)) return;
  const restoredId = debugEditingItemId;
  delete debugItemOverrides[restoredId];
  persistDebugItemOverrides();
  const prepared = rebuildCanonicalPreparedItem(restoredId);
  debugEditingItemId = null;
  closeModal(debugItemModal);
  applyFilters();
  showToast(prepared.nome + ' restaurado para o texto canônico.');
}

itemsGrid.addEventListener('click', function(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  if (button.dataset.action === 'toggle-item') {
    const card = button.closest('.item-card');
    if (!card) return;
    const expanded = card.classList.toggle('expanded');
    button.textContent = expanded ? 'Recolher' : 'Ver item completo';
    button.setAttribute('aria-expanded', String(expanded));
    if (!expanded) window.scrollTo({ top: card.offsetTop - 100, behavior: 'smooth' });
    return;
  }
  if (button.dataset.action === 'select-inspiration') {
    selectItemInspiration(button.dataset.itemId);
    return;
  }
  if (button.dataset.action === 'edit-custom-item') {
    editCustomItem(button.dataset.itemId);
    return;
  }
  if (button.dataset.action === 'debug-edit-item') {
    openDebugItemEditor(button.dataset.itemId);
    return;
  }
  if (button.dataset.action === 'delete-custom-item') {
    deleteCustomItem(button.dataset.itemId);
    return;
  }
  if (button.dataset.action === 'add-to-cart') {
    addItemToCart(button.dataset.itemId, catalogOptionsForItem(itemById.get(button.dataset.itemId)));
    return;
  }
  if(button.dataset.action==='configure-purchase'){
    openPurchaseUpgrade(button.dataset.itemId,button.dataset.kind);return;
  }
});

document.addEventListener('click',function(event){const button=event.target.closest?.('#purchaseUpgradeModal button[data-action]');if(!button)return;const modal=document.getElementById('purchaseUpgradeModal');if(button.dataset.action==='close-purchase-upgrade'){closeModal(modal);return}if(button.dataset.action==='add-configured-to-cart'){addItemToCart(button.dataset.itemId,purchaseDraft(button.dataset.itemId).options);closeModal(modal)}});
document.addEventListener('change',function(event){const modal=event.target.closest?.('#purchaseUpgradeModal');if(!modal)return;const draft=purchaseDraft(modal.dataset.itemId),item=itemById.get(modal.dataset.itemId),control=event.target,index=Number(control.dataset.slot);if(control.dataset.action==='improvement'){const choices=draft.improvements.slice();if(!control.value)choices.splice(index,1);else choices[index]={id:control.value,materialId:choices[index]?.id===control.value?choices[index].materialId:''};draft.improvements=choices.filter(Boolean);sanitizeInstanceImprovements(draft,item)}else if(control.dataset.action==='enchantment'){const choices=draft.enchantments.slice();if(!control.value)choices.splice(index,1);else choices[index]=control.value;draft.enchantments=choices.filter(Boolean);sanitizeInstanceEnchantments(draft,item)}else if(control.dataset.action==='material'){const choice=draft.improvements.find(entry=>entry.id==='material_especial');if(choice)choice.materialId=control.value}else return;refreshPurchaseUpgrade()});

itemsGrid.addEventListener('input', function(event) {
  const control = event.target.closest('[data-item-option]');
  const card = control && control.closest('[data-item-id]');
  const item = card && itemById.get(card.dataset.itemId);
  if (!control || !item) return;
  const options = Object.assign({}, catalogOptionsForItem(item));
  options[control.dataset.itemOption] = control.value;
  catalogOptionDrafts.set(item.id, normalizeItemOptions(item.id, options));
});

itemsGrid.addEventListener('change', function(event) {
  const control = event.target.closest('select[data-item-option]');
  if (!control) return;
  const card = control.closest('[data-item-id]');
  const item = card && itemById.get(card.dataset.itemId);
  if (!item) return;
  const options = Object.assign({}, catalogOptionsForItem(item));
  options[control.dataset.itemOption] = control.value;
  catalogOptionDrafts.set(item.id, normalizeItemOptions(item.id, options));
  if (control.dataset.itemOption === 'weaponModel') applyFilters();
});

catalogViewBtn.addEventListener('click', function() { setView('catalog'); });
backpackViewBtn.addEventListener('click', function() {
  if (cartItems.length) openCartDecision(true);
  else setView('backpack');
});
backpackListModeBtn.addEventListener('click', function() { setBackpackMode('list'); });
backpackCardsModeBtn.addEventListener('click', function() { setBackpackMode('cards'); });
document.getElementById('emptyBackpackCatalogBtn').addEventListener('click', function() { setView('catalog'); });

backpackList.addEventListener('click', async function(event) {
  const actionButton = event.target.closest('button[data-action]');
  if (!actionButton) return;
  const card = actionButton.closest('[data-instance-id]');
  const instance = card && getBackpackInstance(card.dataset.instanceId);
  if (!instance) return;
  const action = actionButton.dataset.action;
  if (action === 'open-details') {
    expandedBackpackInstanceId = expandedBackpackInstanceId === instance.instanceId ? null : instance.instanceId;
    renderBackpack();
  } else if (action === 'remove') {
    const item = itemById.get(instance.itemId);
    const choices=[{value:'keep',label:'Não, manter'}];
    if(Number(instance.quantity)>1)choices.push({value:'one',label:'Remover apenas um'});
    choices.push({value:'all',label:'Sim, remover tudo',danger:true});
    const decision=await catalogDecision('Deseja realmente remover '+(item ? configuredItemName(instance,item) : 'este item')+' da mochila?',choices,'Remover item');
    if(decision==='keep')return;
    if(decision==='one'){setInstanceQuantity(instance,Number(instance.quantity)-1);showToast('Uma unidade/pacote foi removida da mochila.');return}
    if(decision!=='all')return;
    backpackItems = backpackItems.filter(function(entry) { return entry.instanceId !== instance.instanceId; });
    const active = activeCharacterProfile();
    if (active) active.backpack = backpackItems;
    if (expandedBackpackInstanceId === instance.instanceId) expandedBackpackInstanceId = null;
    openImprovementPanels.delete(instance.instanceId);
    openEnchantmentPanels.delete(instance.instanceId);
    refreshInventoryUI();
    showToast((item ? configuredItemName(instance, item) : 'Item') + ' removido da mochila.');
  } else if (action === 'decrease') {
    setInstanceQuantity(instance, instance.quantity - 1);
  } else if (action === 'increase') {
    setInstanceQuantity(instance, instance.quantity + 1);
  } else if (action === 'use-ammo') {
    changeAmmo(instance, -1);
  } else if (action === 'restore-ammo') {
    changeAmmo(instance, 1);
  }
});

backpackList.addEventListener('change', function(event) {
  const control = event.target;
  const card = control.closest('.backpack-item');
  const instance = card && getBackpackInstance(card.dataset.instanceId);
  if (!instance) return;
  const item = itemById.get(instance.itemId);
  if (!item) return;
  if (control.dataset.action === 'quantity') {
    setInstanceQuantity(instance, control.value);
  } else if (control.dataset.action === 'improvement') {
    setInstanceImprovement(instance, item, Number(control.dataset.slot), control.value);
  } else if (control.dataset.action === 'enchantment') {
    setInstanceEnchantment(instance, item, Number(control.dataset.slot), control.value);
  } else if (control.dataset.action === 'material') {
    const choice = instance.improvements.find(function(entry) { return entry.id === 'material_especial'; });
    if (!choice || !materialById.has(control.value)) return;
    choice.materialId = control.value;
    openImprovementPanels.add(instance.instanceId);
    refreshInventoryUI();
  }
});

clearBackpack.addEventListener('click', async function() {
  if (!backpackItems.length) return;
  if (await catalogDecision('Remover todos os itens adquiridos da mochila?', [{value:'keep',label:'Não, manter'},{value:'all',label:'Sim, esvaziar',danger:true}], 'Esvaziar mochila') !== 'all') return;
  backpackItems = [];
  const active = activeCharacterProfile();
  if (active) active.backpack = backpackItems;
  expandedBackpackInstanceId = null;
  openImprovementPanels.clear();
  openEnchantmentPanels.clear();
  refreshInventoryUI();
  showToast('Mochila esvaziada.');
});

document.addEventListener('click',function(event){const button=event.target.closest?.('button');if(!button||button.disabled)return;button.classList.remove('catalog-clicked');void button.offsetWidth;button.classList.add('catalog-clicked');window.setTimeout(function(){button.classList.remove('catalog-clicked')},360)},true);

characterButton.addEventListener('click', function() {
  reopenCartAfterCharacter = false;
  editingCharacterId = null;
  renderCharacterList();
  openModal(characterModal);
  window.setTimeout(function() { characterNameInput.focus(); }, 0);
});

characterForm.addEventListener('submit', function(event) {
  event.preventDefault();
  createCharacter(characterNameInput.value);
});

characterList.addEventListener('click', function(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  if (button.dataset.action === 'select-character') {
    selectCharacter(button.dataset.characterId);
  } else if (button.dataset.action === 'edit-character') {
    editingCharacterId = button.dataset.characterId;
    renderCharacterList();
    window.setTimeout(function() {
      const input = characterList.querySelector('.character-rename-form input');
      if (input) { input.focus(); input.select(); }
    }, 0);
  } else if (button.dataset.action === 'cancel-rename') {
    editingCharacterId = null;
    renderCharacterList();
  }
});

characterList.addEventListener('submit', function(event) {
  const form = event.target.closest('.character-rename-form');
  if (!form) return;
  event.preventDefault();
  const input = form.querySelector('[name="characterName"]');
  renameCharacter(form.dataset.characterId, input && input.value);
});

strengthInput.addEventListener('change', function() {
  const active = activeCharacterProfile();
  if (!active) return;
  active.strength = normalizeStrength(strengthInput.value);
  strengthInput.value = String(active.strength);
  persistCharacterProfiles();
  renderLoadStats(backpackTotals());
  showToast('Força de ' + active.name + ' atualizada para ' + active.strength + '.');
});

cartButton.addEventListener('click', function() {
  openCartDecision(false);
});

cartList.addEventListener('click', function(event) {
  const button = event.target.closest('button[data-action]');
  const entry = button && button.closest('[data-cart-entry-id]');
  if (!button || !entry) return;
  const entryId = entry.dataset.cartEntryId;
  const current = cartItems.find(function(candidate) { return candidate.entryId === entryId; });
  if (!current) return;
  if (button.dataset.action === 'cart-increase') setCartQuantity(entryId, current.quantity + 1);
  else if (button.dataset.action === 'cart-decrease') setCartQuantity(entryId, current.quantity - 1);
  else if (button.dataset.action === 'cart-remove') setCartQuantity(entryId, 0);
});

clearCart.addEventListener('click', function() {
  if (!cartItems.length) return;
  cartItems = [];
  persistCart();
  renderCart();
  showToast('Carrinho esvaziado.');
});

checkoutCart.addEventListener('click', checkoutCartToBackpack);
cartReturnCatalog.addEventListener('click', function() {
  closeModal(cartModal);
  setView('catalog');
});
cartViewBackpack.addEventListener('click', function() {
  closeModal(cartModal);
  setView('backpack');
});

customItemButton.addEventListener('click', function() {
  if (state.inspirationMode) {
    cancelInspirationSelection();
    return;
  }
  resetCustomItemCreation();
  openModal(customItemModal);
  window.setTimeout(function() { customItemName.focus(); }, 0);
});

searchInspirationButton.addEventListener('click', beginInspirationSelection);
cancelInspirationButton.addEventListener('click', cancelInspirationSelection);
customItemType.addEventListener('change', updateCustomItemFields);
customItemSpecific.addEventListener('change', updateCustomItemFields);
customItemForm.addEventListener('change', function(event) {
  const control = event.target;
  if (control === customItemType || control === customItemSpecific) return;
  if (control.matches('[data-custom-improvement], [data-custom-enchantment], [name="fixedMaterial"], [name="category"], [name="combat"], [name="grip"], [name="damageType"]')) {
    renderCustomMagicCompositionOptions();
  }
});
customItemForm.addEventListener('submit', function(event) {
  event.preventDefault();
  registerCustomItem(customItemForm);
});
debugItemForm.addEventListener('submit', function(event) {
  event.preventDefault();
  saveDebugItemCorrection();
});
restoreDebugItemButton.addEventListener('click', restoreCanonicalItemText);

document.querySelectorAll('[data-close-modal]').forEach(function(button) {
  button.addEventListener('click', function() {
    const modal = document.getElementById(button.dataset.closeModal);
    if (modal === characterModal) {
      reopenCartAfterCharacter = false;
      editingCharacterId = null;
    }
    closeModal(modal);
  });
});

[characterModal, cartModal, customItemModal, debugItemModal].forEach(function(modal) {
  modal.addEventListener('click', function(event) {
    if (event.target !== modal) return;
    if (modal === characterModal) {
      reopenCartAfterCharacter = false;
      editingCharacterId = null;
    }
    closeModal(modal);
  });
});

document.addEventListener('keydown', function(event) {
  if (event.key !== 'Escape') return;
  if (!debugItemModal.hidden) closeModal(debugItemModal);
  else if (!customItemModal.hidden) closeModal(customItemModal);
  else if (!cartModal.hidden) closeModal(cartModal);
  else if (!characterModal.hidden) {
    reopenCartAfterCharacter = false;
    editingCharacterId = null;
    closeModal(characterModal);
  } else if (state.inspirationMode) cancelInspirationSelection();
});

typeFilters.addEventListener('click', function(event) {
  const button = event.target.closest('.type-chip');
  if (!button) return;
  state.type = button.dataset.value;
  state.category = 'todos';
  state.combat = 'todos';
  state.grip = 'todos';
  renderContextFilters();
  applyFilters();
});

specificFilters.addEventListener('click', function(event) {
  const button = event.target.closest('.specific-chip');
  if (!button) return;
  state.specific = button.dataset.value;
  applyFilters();
});

categoryFilters.addEventListener('click', function(event) {
  const button = event.target.closest('.category-chip');
  if (!button) return;
  state.category = button.dataset.value;
  applyFilters();
});

combatFilters.addEventListener('click', function(event) {
  const button = event.target.closest('.combat-chip');
  if (!button) return;
  state.combat = button.dataset.value;
  applyFilters();
});

gripFilters.addEventListener('click', function(event) {
  const button = event.target.closest('.grip-chip');
  if (!button) return;
  state.grip = button.dataset.value;
  applyFilters();
});

searchInput.addEventListener('input', function(event) {
  state.search = event.target.value;
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(function() { applyFilters(); }, 120);
});

itemsGrid.addEventListener('click', function(event) {
  if (event.target.closest('[data-load-more]')) applyFilters(true);
});

nameOnlySearchButton.addEventListener('click', function() {
  state.searchNameOnly = !state.searchNameOnly;
  searchInput.placeholder = state.searchNameOnly ? 'Buscar somente pelo nome do item...' : 'Buscar por nome, efeito, propriedade ou descrição...';
  applyFilters();
});

advancedFiltersButton.addEventListener('click', function() {
  const open = advancedFiltersContent.hidden;
  advancedFiltersContent.hidden = !open;
  advancedFiltersButton.setAttribute('aria-expanded', String(open));
  filtersPanel.classList.toggle('advanced-open', open);
  syncAdvancedFiltersButton();
});

debugModeButton.addEventListener('click', function() {
  state.debugMode = !state.debugMode;
  applyFilters();
  showToast(state.debugMode ? 'Modo debug ativo: use o lápis para corrigir um item.' : 'Modo debug desativado.');
});

sortSelect.addEventListener('change', function(event) {
  state.sort = event.target.value;
  applyFilters();
});

resetFilters.addEventListener('click', function() {
  state.books = new Set(allBooks);
  state.type = 'todos';
  state.specific = 'convencional';
  state.category = 'todos';
  state.combat = 'todos';
  state.grip = 'todos';
  state.search = '';
  state.searchNameOnly = false;
  state.sort = 'name';
  searchInput.value = '';
  searchInput.placeholder = 'Buscar por nome, efeito, propriedade ou descrição...';
  sortSelect.value = 'name';
  renderContextFilters();
  applyFilters();
});

renderTypeFilters();
renderSpecificFilters();
renderContextFilters();
syncInspirationModeUI();
persistCharacterProfiles();
syncCharacterUI();
syncCartUI();
if (typeof arsenalInitialState === 'undefined') setView('catalog');
