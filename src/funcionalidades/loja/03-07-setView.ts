

function setView(view) {
  state.view = view === 'backpack' ? 'backpack' : 'catalog';
  const showBackpack = state.view === 'backpack';
  catalogView.hidden = showBackpack;
  backpackView.hidden = !showBackpack;
  const isEngenhoqueiro = typeof arsenalInitialState !== 'undefined' && arsenalInitialState?.mode === 'workshop' && arsenalInitialState?.workshopSection === 'engenhoqueiro';
  const isContraptionAttach = typeof arsenalInitialState !== 'undefined' && Boolean(arsenalInitialState?.contraptionAttach);
  const hideFilters = showBackpack || isEngenhoqueiro || isContraptionAttach;
  filtersPanel.hidden = hideFilters;
  if (hideFilters) {
    filtersPanel.style.display = 'none';
  } else {
    filtersPanel.style.display = '';
  }
  resetFilters.hidden = hideFilters;
  catalogViewBtn?.classList.toggle('active', !showBackpack);
  backpackViewBtn?.classList.toggle('active', showBackpack);
  catalogViewBtn?.setAttribute('aria-pressed', String(!showBackpack));
  backpackViewBtn?.setAttribute('aria-pressed', String(showBackpack));
  if (typeof syncEmbeddedShopActions === 'function') {
    syncEmbeddedShopActions();
  }
  if (showBackpack) renderBackpack();
  else applyFilters();
}

let catalogRevision = 0;
let cachedFilterKey = '';
let cachedFilterResults = [];
function filteredItems() {
  const key = `${catalogRevision}|${preparedItems.length}|${state.oficinaFilter||''}|${state.type}|${state.specific}|${state.magicTier||'todos'}|${state.category}|${state.combat}|${state.grip}|${state.search}|${state.searchNameOnly}|${state.sort}`;
  if (key === cachedFilterKey) return cachedFilterResults;
  const rawQuery = (state.search || '').trim().toLowerCase();
  const search = normalizeText(state.search);

  function getItemRelevance(item) {
    if (!search) return 0;
    const rawName = item._rawNameLower || (item.nome || '').trim().toLowerCase();
    const normName = item._searchName || normalizeText(item.nome || '');

    if (rawName === rawQuery) return 0;
    if (normName === search) return 1;

    const rawTokens = item._rawTokens || rawName.split(/[\s\-–—/]+/);
    if (rawTokens.includes(rawQuery)) return 2;

    const normTokens = item._normTokens || normName.split(/[\s\-–—/]+/);
    if (normTokens.includes(search)) return 3;

    if (rawName.startsWith(rawQuery) || normName.startsWith(search)) return 4;
    if (rawTokens.some(t => t.startsWith(rawQuery)) || normTokens.some(t => t.startsWith(search))) return 5;

    if (normName.includes(search)) return 6;
    return 7;
  }

  const results = preparedItems.filter(function(item) {
    if (item.categoriaId === 'servico') return false; // Serviços são atendidos na Taverna
    if (item.id !== 'instrumentos_de_oficio' && (item.id === 'instrumentos_cozinheiro_aprimorados' || item.id === 'instrumentos_barbeiro' || item.id === 'instrumentos_coureiro' || item.id === 'instrumentos_pescador')) {
      if (typeof isOriginExclusiveItemAllowed === 'function') {
        if (!isOriginExclusiveItemAllowed(item)) return false;
      } else {
        return false;
      }
    }
    if (typeof isOriginExclusiveItemAllowed === 'function') {
      if (!isOriginExclusiveItemAllowed(item)) return false;
    } else {
      const isOriginExclusive = Boolean(item.origemExclusiva || (typeof ORIGIN_EXCLUSIVE_ITEM_IDS !== 'undefined' && ORIGIN_EXCLUSIVE_ITEM_IDS.has(item.id)));
      if (isOriginExclusive) return false;
    }

    if (state.oficinaFilter) {
      const of = state.oficinaFilter;
      if (of === 'armeiro') {
        if (item.tipo !== 'arma' && item.tipo !== 'armadura' && item.tipo !== 'escudo') return false;
      } else if (of === 'alfaiate') {
        if (item.categoriaId !== 'vestuario' && !/vestu|traje|manto|capa/i.test(item.nome + ' ' + (item.categoriaId || ''))) return false;
      } else if (of === 'alquimista') {
        const cat = String(item.categoriaId || '').toLowerCase();
        const isAlq = item.tipo === 'alquimico' || cat === 'alquimico_catalisador' || cat === 'alquimico_preparado' || cat === 'alquimico_venenoso' || (cat.startsWith('alquimico_') && cat !== 'alquimico');
        if (!isAlq) return false;
      } else if (of === 'artesao') {
        const isArt = item.tipo === 'item_geral' && ['equipamento_aventura', 'instrumento', 'ferramenta', 'esoterico', 'itens_gerais'].includes(item.categoriaId);
        if (!isArt) return false;
      } else if (of === 'cozinheiro') {
        const isCoz = item.categoriaId === 'alimentacao' || item.categoriaId === 'bebida' || /comida|refeic|prato|racao|alimento|bebida/i.test(item.nome);
        if (!isCoz) return false;
      } else if (of === 'carpinteiro') {
        const isCarp = (item.tipo === 'arma' && /arco|besta|bordao|cajado|flecha|virote/i.test(item.nome)) || (item.tipo === 'escudo' && /leve/i.test(item.categoriaId || ''));
        if (!isCarp) return false;
      } else if (of === 'joalheiro') {
        const isJoia = item.tipo === 'acessorio' || /anel|amuleto|colar|brinco|joia|gema/i.test(item.nome);
        if (!isJoia) return false;
      } else if (of === 'pedreiro') {
        if (!/pedra|marreta|picareta|argamassa|tijolo/i.test(item.nome + ' ' + (item.textos?.descricao || ''))) return false;
      } else if (of === 'pescador') {
        if (!/pesca|rede|anzol|vara/i.test(item.nome + ' ' + (item.textos?.descricao || ''))) return false;
      } else if (of === 'minerador') {
        if (!/picareta|pa |miner|pedra|ferro|carvao/i.test(item.nome + ' ' + (item.textos?.descricao || ''))) return false;
      }
    }

    const typeOk = state.type === 'todos' || item.tipo === state.type;
    const specificOk = state.specific === 'todos' ||
      (state.specific === 'especifico' && isSpecificMagicItem(item)) ||
      (state.specific === 'liturgico' && isLiturgicalItem(item)) ||
      (state.specific === 'convencional' && !isNamedFixedMagicItem(item));
    const tierOk = !state.magicTier || state.magicTier === 'todos' || (
      (state.specific === 'especifico' || state.specific === 'liturgico') &&
      (typeof getItemMagicTier === 'function' ? getItemMagicTier(item) : (item.magico?.categoriaId || item.magico?.grau)) === state.magicTier
    );
    const categoryOk = state.category === 'todos' || (item.categoriaId || 'sem_categoria') === state.category;
    const combatOk = state.combat === 'todos' || item.arma && item.arma.combateId === state.combat;
    const gripOk = state.grip === 'todos' || item.arma && item.arma.empunhaduraId === state.grip;
    const searchOk = !search || (state.searchNameOnly ? item._searchName : item._search).includes(search);
    return typeOk && specificOk && tierOk && categoryOk && combatOk && gripOk && searchOk;
  });

  results.sort(function(a, b) {
    if (search) {
      const relA = getItemRelevance(a);
      const relB = getItemRelevance(b);
      if (relA !== relB) return relA - relB;
    }
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
  if (state.oficinaFilter) {
    const titles = {
      armeiro: 'Forja do Ferreiro · Armas, Armaduras e Escudos',
      alfaiate: 'Ateliê do Alfaiate · Vestuário e Trajes',
      alquimista: 'Laboratório do Alquimista · Alquimia, Poções e Venenos',
      artesao: 'Oficina do Artesão · Equipamentos, Ferramentas e Esotéricos',
      cozinheiro: 'Cozinha · Alimentação e Consumíveis',
      carpinteiro: 'Oficina do Carpinteiro · Itens de Madeira',
      joalheiro: 'Oficina do Joalheiro · Joias e Acessórios',
      pedreiro: 'Oficina do Pedreiro · Obras e Construções',
      pescador: 'Cais do Pescador · Redes e Acessórios de Pesca',
      minerador: 'Mina do Minerador · Prospecção e Extração'
    };
    if (titles[state.oficinaFilter]) {
      catalogTitle.textContent = titles[state.oficinaFilter];
      return;
    }
  }
  if (state.type === 'todos') catalogTitle.textContent = 'Todos os itens';
  else if (state.category !== 'todos') catalogTitle.textContent = CATEGORY_LABELS[state.category] || humanize(state.category);
  else catalogTitle.textContent = TYPE_META[state.type] && TYPE_META[state.type].label || humanize(state.type);
}

let overflowFrame = 0;
function checkCatalogOverflow() {
  if (typeof itemsGrid === 'undefined' || !itemsGrid) return;
  if (typeof window !== 'undefined' && window.cancelAnimationFrame) {
    window.cancelAnimationFrame(overflowFrame);
  }
  const schedule = typeof window !== 'undefined' && window.requestAnimationFrame ? window.requestAnimationFrame : (fn => setTimeout(fn, 16));
  overflowFrame = schedule(() => {
    const cards = Array.from(itemsGrid.querySelectorAll('.item-card')).filter(card => !card.classList.contains('expanded') && !card.closest('.catalog-list-entry'));
    if (!cards.length) return;

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const detail = card.querySelector('.item-card-detail');
      const body = card.querySelector('.card-body');
      const button = card.querySelector('.expand-item-button');

      // Verifica se o texto transborda a area de detalhes ou se o card como um todo transborda
      const isDetailOverflowing = detail ? (detail.scrollHeight > (detail.clientHeight + 4)) : false;
      const isBodyOverflowing = body ? (body.scrollHeight > (body.clientHeight + 4)) : false;
      const isCardOverflowing = card.scrollHeight > (card.clientHeight + 6);

      const truncated = isDetailOverflowing || isBodyOverflowing || isCardOverflowing;

      card.classList.toggle('is-truncated', truncated);
      if (button) {
        button.style.display = truncated ? 'inline-flex' : 'none';
      }
    }
  });
}
if (typeof window !== 'undefined') {
  window.addEventListener('resize', checkCatalogOverflow, { passive: true });
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
  const key = `${state.type}|${state.specific}|${state.category}|${state.combat}|${state.grip}|${state.search}|${state.searchNameOnly}|${state.sort}|${state.debugMode}|${state.inspirationMode}`;
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
    ['animal', 'Animal'], ['alimentacao', 'Alimentação'], ['bebida', 'Bebida'],
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
  try { forjaArsenalStorage.setItem(CUSTOM_ITEMS_STORAGE_KEY, JSON.stringify(customItems)); }
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