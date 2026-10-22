

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
    CATEGORY_LABELS[item.categoriaId],
    item.magico && (item.tipo === 'arma' ? ('arma especifica ' + item.magico.categoriaId) : item.tipo === 'armadura' ? ('armadura especifica ' + item.magico.categoriaId) : ('acessorio ' + item.magico.categoriaId)),
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
  const normName = normalizeText(item.nome);
  const rawNameLower = (item.nome || '').trim().toLowerCase();
  return Object.assign({}, item, {
    _books: getBooks(item),
    _search: normalizeText(searchParts.join(' ')),
    _searchName: normName,
    _rawNameLower: rawNameLower,
    _rawTokens: rawNameLower.split(/[\s\-–—/]+/),
    _normTokens: normName.split(/[\s\-–—/]+/)
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
  if (item.id === 'instrumentos_de_oficio') {
    const ofVal = options.oficio || '';
    const dynName = ofVal ? (typeof formatCraftToolName === 'function' ? formatCraftToolName(ofVal) : `Instrumentos do ${ofVal}`) : 'Instrumentos de Ofício';
    return Object.assign({}, item, {
      nome: dynName,
      displayName: dynName
    });
  }
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
      if (!entry || !entry.itemId) return false;
      const name = String(entry.displayName || entry.itemName || entry.itemId || '').toLowerCase();
      if (/adaga.*emissora.*ps[íi]quica/i.test(name) || /adaga.*ps[íi]quica/i.test(name) || /emissora.*ps[íi]quica/i.test(name) || entry.isEngenhoca || entry.contraptionId || /engenhoca_/i.test(entry.itemId)) {
        return false;
      }
      return true;
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
    const raw = forjaArsenalStorage.getItem(BACKPACK_STORAGE_KEY);
    return normalizeBackpackEntries(raw ? JSON.parse(raw) : []);
  } catch (error) {
    return [];
  }
}

function loadCharacterProfiles() {
  try {
    const raw = forjaArsenalStorage.getItem(CHARACTER_PROFILES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      let modified = false;
      const profiles = (Array.isArray(parsed.profiles) ? parsed.profiles : []).map(function(profile) {
        const originalBackpack = Array.isArray(profile.backpack) ? profile.backpack : [];
        const cleaned = normalizeBackpackEntries(originalBackpack);
        if (cleaned.length !== originalBackpack.length) modified = true;
        return {
          ...profile,
          id: String(profile.id || ('personagem-' + createInstanceId())),
          name: String(profile.name || 'Personagem').trim().slice(0, 60) || 'Personagem',
          strength: normalizeStrength(profile.strength),
          backpack: cleaned
        };
      });
      const activeId = profiles.some(function(profile) { return profile.id === parsed.activeId; }) ? parsed.activeId : null;
      if (modified) {
        try {
          forjaArsenalStorage.setItem(CHARACTER_PROFILES_STORAGE_KEY, JSON.stringify({ activeId: activeId, profiles: profiles }));
        } catch (e) {}
      }
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
    const parsed = JSON.parse(forjaArsenalStorage.getItem(CART_STORAGE_KEY) || '[]');
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
  try { return forjaArsenalStorage.getItem(BACKPACK_MODE_STORAGE_KEY) === 'cards' ? 'cards' : 'list'; }
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

const urlParams = typeof window !== 'undefined' && window.location ? new URLSearchParams(window.location.search) : null;
const isContraptionAttach = Boolean(urlParams && (
  urlParams.get('modo') === 'contraption-attach' ||
  urlParams.get('sessao') === 'contraption-attach' ||
  urlParams.has('contraption-attach')
));
const initialOficinaFilter = urlParams ? (urlParams.get('oficina') || (isContraptionAttach ? 'armeiro' : '')).toLowerCase().trim() : '';

const state = {
  books: new Set(allBooks),
  type: initialOficinaFilter === 'armeiro' ? 'arma' : 'todos',
  oficinaFilter: initialOficinaFilter,
  specific: 'convencional',
  magicTier: 'todos',
  category: 'todos',
  combat: 'todos',
  grip: 'todos',
  search: '',
  searchNameOnly: true,
  debugMode: false,
  inspirationMode: false,
  sort: 'name',
  view: 'catalog',
  backpackMode: loadBackpackMode()
};

if (isContraptionAttach && typeof document !== 'undefined') {
  document.body.classList.add('mode-oficina');
  document.body.classList.add('mode-contraption-attach');
  const headerEl = document.querySelector('.site-header');
  if (headerEl) {
    headerEl.style.display = 'none';
    headerEl.setAttribute('hidden', '');
  }
  const sActions = document.querySelector('.embedded-shop-actions');
  if (sActions) {
    sActions.style.display = 'none';
    sActions.setAttribute('hidden', '');
  }
  const homeEl = document.querySelector('.forja-home');
  if (homeEl) {
    homeEl.style.display = 'none';
    homeEl.setAttribute('hidden', '');
  }
  const fPanel = document.getElementById('filtersPanel');
  if (fPanel) {
    fPanel.style.display = 'none';
    fPanel.setAttribute('hidden', '');
  }

  // Barra de navegação dedicada para Acoplamento de Engenhoca
  const navBarId = 'contraptionAttachNavBar';
  if (!document.getElementById(navBarId)) {
    const sMagia = urlParams?.get('magia');
    const voltarEngenhocaUrl = sMagia ? ('engenhoca.html?magia=' + encodeURIComponent(sMagia)) : 'engenhoca.html';
    const fundsFormatted = Number(arsenalInitialState?.funds || 0).toLocaleString('pt-BR');
    const coinSvg = window.IconesForja ? window.IconesForja.get('coin', 'icon-sm') : '<svg class="forja-svg icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"></circle><path d="M18.09 10.37A6 6 0 1 1 10.34 18"></path><path d="M7 6h1v4"></path><path d="m16.71 13.88.7.71-2.82 2.82"></path></svg>';
    const navBarHtml = '<nav id="' + navBarId + '" style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 18px;background:linear-gradient(110deg,#181016f5,#0e0d12f5);border-bottom:1px solid #81503f;box-shadow:0 6px 20px rgba(0,0,0,0.5);margin-bottom:14px;box-sizing:border-box;">' +
      '<div style="display:flex;align-items:center;gap:10px;">' +
        '<a href="' + voltarEngenhocaUrl + '" class="button secondary" style="display:inline-flex;align-items:center;gap:6px;font-size:0.82rem;font-weight:600;padding:6px 14px;background:#1a141d;border:1px solid #674549;color:#f3d99c;text-decoration:none;border-radius:6px;cursor:pointer;">← Voltar à Engenhoca</a>' +
        '<a href="ficha.html" class="button secondary" style="display:inline-flex;align-items:center;gap:6px;font-size:0.82rem;font-weight:600;padding:6px 14px;background:#1a141d;border:1px solid #674549;color:#f3d99c;text-decoration:none;border-radius:6px;cursor:pointer;">Voltar à Ficha</a>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:8px;font-size:0.85rem;color:#cbd5e1;background:#141217;border:1px solid #3d3039;padding:5px 12px;border-radius:6px;">' +
        '<span style="color:#a19595;font-size:0.75rem;">Saldo disponível:</span>' +
        '<strong id="contraptionAttachFundsVal" style="color:#dfb666;display:inline-flex;align-items:center;gap:4px;">' + coinSvg + ' T$ ' + fundsFormatted + '</strong>' +
      '</div>' +
    '</nav>';
    document.body.insertAdjacentHTML('afterbegin', navBarHtml);
  }

  const catTitle = document.getElementById('catalogTitle');
  if (catTitle) {
    catTitle.textContent = `FORJAR EM ITEM · ${initialOficinaFilter.toUpperCase()}`;
  }
  const catNote = document.querySelector('.catalog-note');
  if (catNote) {
    catNote.textContent = 'Escolha um item mundano da sua mochila para acoplar ou forje um novo item mundano para a engenhoca.';
  }
} else if (initialOficinaFilter && typeof document !== 'undefined') {
  document.body.classList.add('mode-oficina');
  const headerEl = document.querySelector('.site-header');
  if (headerEl) {
    headerEl.style.display = 'none';
    headerEl.setAttribute('hidden', '');
  }
  const homeEl = document.querySelector('.forja-home');
  if (homeEl) {
    homeEl.href = 'oficina.html';
    homeEl.textContent = '← Voltar às Oficinas';
    homeEl.setAttribute('aria-label', 'Voltar às Oficinas de Fabricação');
  }
}

const typeFilters = document.getElementById('typeFilters');
const specificFilters = document.getElementById('specificFilters');
const magicTierFilters = document.getElementById('magicTierFilters');
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
  return preparedItems.filter(function(item) {
    if (item.tipo !== type || item.categoriaId === 'servico') return false;
    const specificOk = typeof state === 'undefined' || !state.specific || state.specific === 'todos' ||
      (state.specific === 'especifico' && isSpecificMagicItem(item)) ||
      (state.specific === 'liturgico' && isLiturgicalItem(item)) ||
      (state.specific === 'convencional' && !isNamedFixedMagicItem(item));
    return specificOk;
  }).length;
}

function openModal(modal) {
  if (!modal) return;
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
  if (!modal) return;
  modal.hidden = true;
  const anyOpen = document.querySelector('.app-modal:not([hidden]), .modal-backdrop:not([hidden])');
  if (!anyOpen) {
    document.body.style.overflow = '';
  }
}

function syncCharacterUI() {
  const active = activeCharacterProfile();
  if (characterButtonLabel) characterButtonLabel.textContent = active ? active.name + ' · Mudar personagem' : 'Cadastrar personagem';
  if (characterButton) characterButton.title = active ? 'Mudar o personagem e a mochila ativa' : 'Cadastrar um personagem';
  if (strengthInput) {
    strengthInput.disabled = !active;
    strengthInput.value = String(active ? normalizeStrength(active.strength) : 0);
  }
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
      escapeHtml(profile.id) + '" title="Mudar nome" aria-label="Mudar o nome de ' + escapeHtml(profile.name) + '">Editar</button></div></div>';
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

function isItemCraftableByOffices(item: any, offices: string[]): boolean {
  if (!item || !offices || !offices.length) return false;
  const itemType = String(item.tipo || '').toLowerCase();
  const itemCat = String(item.categoriaId || '').toLowerCase();
  const itemDesc = `${itemType} ${itemCat} ${item.nome || ''} ${(item.textos?.descricao || item.descricao || '')}`.toLowerCase();

  for (const rawOffice of offices) {
    const of = typeof slug === 'function' ? slug(rawOffice) : String(rawOffice).toLowerCase().replace(/[^a-z0-9]/g, '_');
    if (of === 'armeiro') {
      if (itemType === 'arma' || itemType === 'armadura' || itemType === 'escudo' || itemType === 'municao') return true;
    } else if (of === 'alfaiate' || of === 'tecelao') {
      if (itemCat === 'vestuario' || /vestu|traje|manto|capa/i.test(itemDesc)) return true;
    } else if (of === 'alquimista') {
      if (itemType === 'alquimico' || itemCat.startsWith('alquimico_')) return true;
    } else if (of === 'artesao') {
      if (itemType === 'item_geral' && ['equipamento_aventura', 'instrumento', 'ferramenta', 'esoterico', 'itens_gerais'].includes(itemCat)) return true;
    } else if (of === 'cozinheiro' || of === 'culinaria') {
      if (itemCat === 'alimentacao' || itemCat === 'bebida' || /comida|refeic|prato|racao|alimento|bebida/i.test(itemDesc)) return true;
    } else if (of === 'carpinteiro') {
      if ((itemType === 'arma' && /arco|besta|bordao|cajado|flecha|virote/i.test(item.nome || '')) || (itemType === 'escudo' && /leve/i.test(itemCat))) return true;
    } else if (of === 'joalheiro' || of === 'ourives') {
      if (itemType === 'acessorio' || /anel|amuleto|colar|brinco|joia|gema/i.test(itemDesc)) return true;
    } else if (of === 'escriba') {
      if (itemCat === 'documento' || /pergaminho|livro|mapa|tinta/i.test(itemDesc)) return true;
    } else if (of === 'engenhoqueiro') {
      if (item.isEngenhoca || /engenhoca|aparato/i.test(itemDesc)) return true;
    } else if (of === 'pedreiro') {
      if (/pedra|marreta|picareta|argamassa|tijolo/i.test(itemDesc)) return true;
    } else if (of === 'pescador') {
      if (/pesca|rede|anzol|vara/i.test(itemDesc)) return true;
    } else if (of === 'minerador') {
      if (/picareta|pa |miner|pedra|ferro|carvao/i.test(itemDesc)) return true;
    } else if (of === 'tatuador') {
      if (/tatuagem|pigmento/i.test(itemDesc)) return true;
    }
  }
  return false;
}
if (typeof window !== 'undefined') {
  (window as any).isItemCraftableByOffices = isItemCraftableByOffices;
}

function getEligibleCatalogItems(): any[] {
  const effChoice = typeof (window as any).effectiveInitialChoice === 'function' ? (window as any).effectiveInitialChoice() : null;
  const exclusiveIds = typeof (window as any).ORIGIN_EXCLUSIVE_ITEM_IDS !== 'undefined' ? (window as any).ORIGIN_EXCLUSIVE_ITEM_IDS : new Set(['rolo_de_macarrao', 'martelo_de_carne', 'ferramenta_pesada', 'ferramenta_pesada_lanca', 'ferramenta_agricola', 'animal_nao_combativo', 'joia_de_familia', 'joia_falsificada', 'item_artistico', 'cutelo', 'bolas_malabarismo', 'dente_falso']);

  if (effChoice && effChoice.isBudgetGrant) {
    const hasUnlimitedBudget = Boolean(effChoice.unlimitedBudget || effChoice.maxBudget === Infinity);
    const maxBudget = hasUnlimitedBudget ? Infinity : Number(effChoice.maxBudget || 1000);
    const allowedTypes = effChoice.types ? new Set(effChoice.types) : null;
    const isCraftChoice = Boolean(effChoice.isCraftableChoice || (maxBudget === 50 && /fabricar/i.test(effChoice.title || '')));
    const rawOffices = (typeof (window as any).allTrainedOffices === 'function' ? (window as any).allTrainedOffices() : null) || (typeof (window as any).arsenalInitialState !== 'undefined' ? (window as any).arsenalInitialState?.trainedOffices : null) || [];
    const trainedOffices = rawOffices.length > 0 ? rawOffices : ['artesao'];

    return preparedItems.filter(function(item: any) {
      if (item.categoriaId === 'servico') return false;
      if (item.origemExclusiva || exclusiveIds.has(item.id)) return false;
      const price = Number(item.preco?.valor ?? item.price ?? 0);
      if (!hasUnlimitedBudget && Number.isFinite(maxBudget) && price > maxBudget) return false;
      if (allowedTypes && !allowedTypes.has(item.tipo)) return false;
      if (isCraftChoice) {
        if (isSpecificMagicItem(item) || isLiturgicalItem(item) || isNamedFixedMagicItem(item)) return false;
        if (!isItemCraftableByOffices(item, trainedOffices)) return false;
      }
      return true;
    });
  }

  return preparedItems.filter(function(item: any) {
    return item.categoriaId !== 'servico';
  });
}
if (typeof window !== 'undefined') {
  (window as any).getEligibleCatalogItems = getEligibleCatalogItems;
}

function renderTypeFilters() {
  const isAlquimista = typeof state !== 'undefined' && state.oficinaFilter === 'alquimista';
  if (isAlquimista) {
    if (typeFilters) {
      typeFilters.style.display = 'none';
      const row = typeFilters.closest('.filter-row-control');
      if (row) row.style.display = 'none';
    }
    return;
  }
  if (typeFilters) {
    typeFilters.style.display = '';
    const row = typeFilters.closest('.filter-row-control');
    if (row) row.style.display = '';
  }
  const isArmeiro = typeof state !== 'undefined' && state.oficinaFilter === 'armeiro';
  const order = isArmeiro
    ? ['arma', 'armadura', 'escudo']
    : ['todos', 'arma', 'municao', 'armadura', 'escudo', 'acessorio', 'item_geral'];

  const baseItems = getEligibleCatalogItems();
  const totalCount = baseItems.filter(function(item) {
    const specificOk = typeof state === 'undefined' || !state.specific || state.specific === 'todos' ||
      (state.specific === 'especifico' && isSpecificMagicItem(item)) ||
      (state.specific === 'liturgico' && isLiturgicalItem(item)) ||
      (state.specific === 'convencional' && !isNamedFixedMagicItem(item));
    return specificOk;
  }).length;

  typeFilters.innerHTML = '<span class="filter-label">Tipo</span>' + order.map(function(type) {
    const count = type === 'todos' ? totalCount : baseItems.filter(function(i){
      if (i.tipo !== type) return false;
      const specificOk = typeof state === 'undefined' || !state.specific || state.specific === 'todos' ||
        (state.specific === 'especifico' && isSpecificMagicItem(i)) ||
        (state.specific === 'liturgico' && isLiturgicalItem(i)) ||
        (state.specific === 'convencional' && !isNamedFixedMagicItem(i));
      return specificOk;
    }).length;
    const isDisabled = count === 0 && type !== 'todos';
    return '<button class="chip type-chip' + (state.type === type ? ' active' : '') + '" type="button" data-value="' + type + '"' + (isDisabled ? ' disabled style="opacity:0.35;cursor:not-allowed;"' : '') + '>' +
      '<span aria-hidden="true">' + TYPE_META[type].icon + '</span>' + TYPE_META[type].label +
      '<span class="chip-count">' + count + '</span></button>';
  }).join('');
}

function renderSpecificFilters() {
  const isAlquimista = typeof state !== 'undefined' && state.oficinaFilter === 'alquimista';
  if (isAlquimista) {
    if (specificFilters) {
      specificFilters.style.display = 'none';
      const row = specificFilters.closest('.filter-row-control');
      if (row) row.style.display = 'none';
    }
    return;
  }
  if (specificFilters) {
    specificFilters.style.display = '';
    const row = specificFilters.closest('.filter-row-control');
    if (row) row.style.display = '';
  }
  const baseItems = getEligibleCatalogItems();
  const typeFiltered = baseItems.filter(function(item) {
    return typeof state === 'undefined' || !state.type || state.type === 'todos' || item.tipo === state.type;
  });
  const options = [
    { id: 'todos', label: 'Todos', count: typeFiltered.length },
    { id: 'convencional', label: 'Convencionais', count: typeFiltered.filter(function(item) { return !isNamedFixedMagicItem(item) && !isSpecificMagicItem(item) && !isLiturgicalItem(item); }).length },
    { id: 'especifico', label: 'Específicos', count: typeFiltered.filter(isSpecificMagicItem).length },
    { id: 'liturgico', label: 'Litúrgicos', count: typeFiltered.filter(isLiturgicalItem).length }
  ];
  specificFilters.innerHTML = '<span class="filter-label">Natureza</span>' + options.map(function(option) {
    const isDisabled = option.count === 0 && option.id !== 'todos';
    return '<button class="chip specific-chip' + (state.specific === option.id ? ' active' : '') + '" type="button" data-value="' + option.id + '"' + (isDisabled ? ' disabled style="opacity:0.35;cursor:not-allowed;"' : '') + '>' + option.label +
      '<span class="chip-count">' + option.count + '</span></button>';
  }).join('');
}

function getItemMagicTier(item) {
  if (!item) return '';
  const tier = item.magico && (item.magico.categoriaId || item.magico.grau);
  if (tier) {
    const t = String(tier).toLowerCase();
    if (t === 'menor' || t.includes('menor')) return 'menor';
    if (t === 'medio' || t === 'médio' || t.includes('medi')) return 'medio';
    if (t === 'maior' || t.includes('maior')) return 'maior';
  }
  const cat = String(item.categoriaId || '').toLowerCase();
  if (cat.includes('menor')) return 'menor';
  if (cat.includes('medio') || cat.includes('médio')) return 'medio';
  if (cat.includes('maior')) return 'maior';
  return '';
}

function renderMagicTierFilters() {
  if (!magicTierFilters) return;
  const isMagicSpecificOrLiturgical = typeof state !== 'undefined' && (state.specific === 'especifico' || state.specific === 'liturgico');
  if (!isMagicSpecificOrLiturgical) {
    magicTierFilters.hidden = true;
    magicTierFilters.style.display = 'none';
    if (typeof state !== 'undefined') state.magicTier = 'todos';
    return;
  }
  magicTierFilters.hidden = false;
  magicTierFilters.style.display = 'inline-flex';

  const relevantItems = preparedItems.filter(function(item) {
    if (item.categoriaId === 'servico') return false;
    if (state.specific === 'especifico') return isSpecificMagicItem(item);
    if (state.specific === 'liturgico') return isLiturgicalItem(item);
    return false;
  });

  const tierOptions = [
    { id: 'todos', label: 'Todos', count: relevantItems.length },
    { id: 'menor', label: 'Menor', count: relevantItems.filter(function(i) { return getItemMagicTier(i) === 'menor'; }).length },
    { id: 'medio', label: 'Médio', count: relevantItems.filter(function(i) { return getItemMagicTier(i) === 'medio'; }).length },
    { id: 'maior', label: 'Maior', count: relevantItems.filter(function(i) { return getItemMagicTier(i) === 'maior'; }).length }
  ];

  magicTierFilters.innerHTML = '<span class="filter-label">Grau</span>' + tierOptions.map(function(opt) {
    const activeClass = (state.magicTier || 'todos') === opt.id ? ' active' : '';
    return '<button class="chip tier-chip' + activeClass + '" type="button" data-value="' + opt.id + '">' +
      opt.label + '<span class="chip-count">' + opt.count + '</span></button>';
  }).join('');
}

function categoryValuesForType(type) {
  return Array.from(new Set(preparedItems.filter(function(item) {
    if (item.tipo !== type || item.categoriaId === 'servico') return false;
    const specificOk = typeof state === 'undefined' || !state.specific || state.specific === 'todos' ||
      (state.specific === 'especifico' && isSpecificMagicItem(item)) ||
      (state.specific === 'liturgico' && isLiturgicalItem(item)) ||
      (state.specific === 'convencional' && !isNamedFixedMagicItem(item));
    return specificOk;
  }).map(function(item) {
    return item.categoriaId || 'sem_categoria';
  }))).sort(function(a, b) {
    return (CATEGORY_LABELS[a] || humanize(a)).localeCompare(CATEGORY_LABELS[b] || humanize(b), 'pt-BR');
  });
}

function renderContextFilters() {
  if (typeof state !== 'undefined' && state.oficinaFilter === 'alquimista') {
    if (typeof weaponFilters !== 'undefined' && weaponFilters) {
      weaponFilters.hidden = true;
      weaponFilters.style.display = 'none';
    }
    contextFilters.hidden = false;
    contextFilters.style.display = '';

    const alchemCats = [
      { id: 'todos', label: 'Todos os Alquímicos' },
      { id: 'alquimico_catalisador', label: 'Catalisadores' },
      { id: 'alquimico_preparado', label: 'Preparados' },
      { id: 'alquimico_venenoso', label: 'Venenos' }
    ];

    const alchemItems = preparedItems.filter(function(item) {
      if (item.categoriaId === 'servico') return false;
      const price = Number(item.preco?.valor ?? item.price ?? 0);
      if (price <= 0) return false;
      const cat = String(item.categoriaId || '').toLowerCase();
      return item.tipo === 'alquimico' || cat === 'alquimico_catalisador' || cat === 'alquimico_preparado' || cat === 'alquimico_venenoso' || (cat.startsWith('alquimico_') && cat !== 'alquimico');
    });

    categoryFilters.innerHTML = '<span class="filter-label">Alquímicos</span>' +
      alchemCats.map(function(opt) {
        const count = opt.id === 'todos' ? alchemItems.length : alchemItems.filter(i => (i.categoriaId || '') === opt.id).length;
        return '<button class="chip category-chip' + (state.category === opt.id ? ' active' : '') + '" type="button" data-value="' + opt.id + '">' +
          opt.label + '<span class="chip-count">' + count + '</span></button>';
      }).join('');

    categoryFilters.querySelectorAll('.category-chip').forEach(function(button) {
      button.addEventListener('click', function() {
        state.category = button.dataset.value;
        applyFilters();
      });
    });
    return;
  }
  const categories = state.type === 'todos' ? [] : categoryValuesForType(state.type);
  const shouldShowCategories = categories.length > 1;
  contextFilters.hidden = !shouldShowCategories;
  if (shouldShowCategories) {
    const totalTypeCount = countType(state.type);
    categoryFilters.innerHTML = '<span class="filter-label">Subtipo</span>' +
      '<button class="chip category-chip" type="button" data-value="todos">Todos<span class="chip-count">' + totalTypeCount + '</span></button>' +
      categories.map(function(category) {
        const count = preparedItems.filter(function(item) {
          const specificOk = typeof state === 'undefined' || !state.specific || state.specific === 'todos' ||
            (state.specific === 'especifico' && isSpecificMagicItem(item)) ||
            (state.specific === 'liturgico' && isLiturgicalItem(item)) ||
            (state.specific === 'convencional' && !isNamedFixedMagicItem(item));
          return specificOk && item.tipo === state.type && (item.categoriaId || 'sem_categoria') === category;
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
