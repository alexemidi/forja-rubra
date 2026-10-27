

function persistCharacterProfiles() {
  try {
    forjaArsenalStorage.setItem(CHARACTER_PROFILES_STORAGE_KEY, JSON.stringify(characterProfiles));
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
  try { forjaArsenalStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems)); }
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
  const stats = [];
  stats.push({ val: formatPrice(item), cls: 'stat-price' });
  stats.push({ val: formatSpaces(item.espacos) + ' esp.', cls: 'stat-spaces' });

  if (item.tipo === 'arma' && item.arma) {
    const damage = item.arma.dano && item.arma.dano.principal || '—';
    const alternatives = item.arma.dano && Array.isArray(item.arma.dano.alternativas) ? item.arma.dano.alternativas.filter(Boolean) : [];
    stats.push({ val: alternatives.length ? damage + ' / ' + alternatives.join(' / ') : damage, cls: 'stat-damage' });
    stats.push({ val: formatCritical(item.arma.critico), cls: 'stat-critical' });
    stats.push({ val: GRIP_LABELS[item.arma.empunhaduraId] || humanize(item.arma.empunhaduraId), cls: 'stat-grip' });
    stats.push({ val: COMBAT_LABELS[item.arma.combateId] || humanize(item.arma.combateId), cls: 'stat-combat' });
    stats.push({ val: (item.arma.tipoDanoIds || []).map(function(value) { return DAMAGE_LABELS[value] || humanize(value); }).join(' / ') || '—', cls: 'stat-damage-type' });
    stats.push({ val: RANGE_LABELS[item.arma.alcanceId] || (item.arma.alcanceId ? humanize(item.arma.alcanceId) : '—'), cls: 'stat-range' });
  } else if (item.tipo === 'armadura' && item.armadura) {
    stats.push({ val: 'Def. +' + Number(item.armadura.defesa || 0), cls: 'stat-defense' });
    stats.push({ val: 'Pen. ' + (Number(item.armadura.penalidade || 0) <= 0 ? Number(item.armadura.penalidade || 0) : '-' + Number(item.armadura.penalidade || 0)), cls: 'stat-penalty' });
    const isLeve = item.armadura.categoriaId === 'leve' || item.categoriaId === 'leve' || Boolean(item.armadura.usaDestrezaNaDefesa);
    stats.push({ val: isLeve ? 'Soma Atributo de Defesa' : 'NÃO Soma Atributo de Defesa', cls: 'stat-attr' });
  } else if (item.tipo === 'escudo' && item.escudo) {
    stats.push({ val: 'Def. +' + Number(item.escudo.bonusDefesa || 0), cls: 'stat-defense' });
    stats.push({ val: 'Pen. ' + (Number(item.escudo.penalidade || 0) <= 0 ? Number(item.escudo.penalidade || 0) : '-' + Number(item.escudo.penalidade || 0)), cls: 'stat-penalty' });
    if (item.escudo.ataque) {
      stats.push({ val: item.escudo.ataque.dano && (item.escudo.ataque.dano.texto || item.escudo.ataque.dano.principal) || '—', cls: 'stat-damage' });
      stats.push({ val: formatCritical(item.escudo.ataque.critico), cls: 'stat-critical' });
    }
  } else {
    const slots = item.equipamento && Array.isArray(item.equipamento.slotsPermitidos) ? Array.from(new Set(item.equipamento.slotsPermitidos.map(function(value) {
      return SLOT_LABELS[value] || humanize(value);
    }))) : [];
    if (slots.length) stats.push({ val: slots.join(' / '), cls: 'stat-slot' });
    if (item.equipamento && item.equipamento.itemVestido) stats.push({ val: 'Item vestido', cls: 'stat-worn' });
  }
  return stats.map(function(entry) {
    const val = typeof entry === 'object' && entry !== null ? entry.val : entry;
    const cls = typeof entry === 'object' && entry !== null && entry.cls ? ' ' + entry.cls : '';
    return '<span class="item-stat-val' + cls + '">' + escapeHtml(val == null || val === '' ? '—' : String(val)) + '</span>';
  }).join('');
}

function propertiesHtml(item) {
  if (!item.arma) return '';
  const values = [];
  (item.arma.propriedadesIds || []).forEach(function(value) { values.push(PROPERTY_LABELS[value] || humanize(value)); });
  (item.arma.gruposArmaIds || []).forEach(function(value) {
    const lbl = (typeof WEAPON_GROUP_LABELS !== 'undefined' && WEAPON_GROUP_LABELS[value]) ? WEAPON_GROUP_LABELS[value] : humanize(value);
    values.push(lbl);
  });
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
  if (item.id === 'instrumentos_de_oficio') {
    const ofVal = options.oficio || '';
    baseName = ofVal ? (typeof formatCraftToolName === 'function' ? formatCraftToolName(ofVal) : ('Instrumentos do ' + ofVal)) : 'Instrumentos de Ofício';
  }
  if (item.id === 'colecao_de_livros') {
    const raw = (options.customName || '').trim();
    if (raw && !/^cole[cç][aã]o de livros$/i.test(raw)) {
      baseName = raw;
    } else {
      const label = itemChoiceLabel(item.id, 'knowledge', options.knowledge);
      baseName = label ? ('Coleção de Livros — ' + label) : 'Coleção de Livros';
    }
  }
  if (item.id === 'ferramenta_pesada_lanca') baseName += ' (' + itemChoiceLabel(item.id, 'weaponModel', options.weaponModel).toLocaleLowerCase('pt-BR') + ')';
  if (isNamedFixedMagicItem(item)) return baseName;
  const labels = [];
  (instance && instance.improvements || []).forEach(function(choice) {
    if (choice.id === 'material_especial' && choice.materialId) {
      const material = materialById.get(choice.materialId);
      labels.push('de ' + (material ? material.nome : humanize(choice.materialId)));
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

let catalogCardCache = new WeakMap();
function clearCatalogCardCache() {
  catalogCardCache = new WeakMap();
}
function itemCard(originalItem) {
  const choiceId = (typeof effectiveInitialChoice === 'function' ? effectiveInitialChoice()?.id : null) || (typeof arsenalInitialState !== 'undefined' ? arsenalInitialState?.choice?.id : '') || '';
  const isBudget = Boolean((typeof effectiveInitialChoice === 'function' ? effectiveInitialChoice()?.isBudgetGrant : null) || (typeof arsenalInitialState !== 'undefined' ? arsenalInitialState?.choice?.isBudgetGrant : false));
  const mode = typeof arsenalInitialState !== 'undefined' ? (arsenalInitialState?.mode || '') : '';
  const isReward = Boolean(typeof arsenalInitialState !== 'undefined' && (arsenalInitialState?.isRewardMode || arsenalInitialState?.mode === 'reward'));
  const wsSection = typeof arsenalInitialState !== 'undefined' ? (arsenalInitialState?.workshopSection || '') : '';
  const key = JSON.stringify([catalogOptionsForItem(originalItem), countBackpackItem(originalItem.id), state.debugMode, state.inspirationMode, mode, isReward, choiceId, isBudget, wsSection]);
  const cached = catalogCardCache.get(originalItem);
  if (cached && cached.key === key) return cached.html;
  const html = buildItemCard(originalItem);
  catalogCardCache.set(originalItem, {key,html});
  return html;
}

function itemStatsHtmlBlock(item) {
  const content = itemStats(item);
  if (!content) return '';
  const count = (content.match(/item-stat-val/g) || []).length;
  const cls = count >= 5 ? 'has-many-stats' : 'has-few-stats';
  return '<div class="item-stats ' + cls + '">' + content + '</div>';
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
  const isReward = Boolean(typeof arsenalInitialState !== 'undefined' && (arsenalInitialState?.isRewardMode || arsenalInitialState?.mode === 'reward'));
  const isShopOrHero = Boolean(typeof arsenalInitialState !== 'undefined' && arsenalInitialState?.mode && arsenalInitialState.mode !== 'consult');
  const shareSvg = '<svg class="forja-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;pointer-events:none;"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>';
  const shareBtnHtml = '<button class="acquire-button share-item-btn" type="button" data-action="share-item" data-item-id="' + escapeHtml(item.id) + '" title="Compartilhar item" aria-label="Compartilhar ' + escapeHtml(item.nome) + '" style="background:var(--surface2);border-color:var(--border);color:var(--text);display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:0.85rem;font-weight:600;min-height:34px;width:100%;transition:all 0.15s ease;">' + shareSvg + '<span>Compartilhar</span></button>';
  const shareIconBtnHtml = '<button class="upgrade-purchase-button share-item-btn" type="button" data-action="share-item" data-item-id="' + escapeHtml(item.id) + '" title="Compartilhar item" aria-label="Compartilhar ' + escapeHtml(item.nome) + '">' + shareSvg + '</button>';

  const upgradeActions = (!isShopOrHero || state.inspirationMode) ? '' : purchaseUpgradeButtons(item);
  const isChoiceIncomplete = Boolean(item.id === 'instrumentos_de_oficio' && !options.oficio);
  const addToCartDisabled = isChoiceIncomplete ? ' disabled' : '';
  const addToCartDisabledClass = isChoiceIncomplete ? ' is-disabled' : '';
  const addToCartTitle = isChoiceIncomplete ? ' title="Selecione o ofício antes de adicionar ao carrinho"' : '';
  const addToCartBtn = '<button class="acquire-button' + addToCartDisabledClass + '" type="button" data-action="add-to-cart" data-item-id="' + escapeHtml(item.id) + '"' + addToCartDisabled + addToCartTitle + '> Adicionar ao carrinho</button>';

  const primaryAction = state.inspirationMode
    ? '<button class="acquire-button inspiration-select-button" type="button" data-action="select-inspiration" data-item-id="' + escapeHtml(item.id) + '">Escolher inspiração</button>'
    : (isReward
        ? '<button class="acquire-button" type="button" data-action="receive-reward-item" data-item-id="' + escapeHtml(item.id) + '">Receber Item</button>'
        : (isShopOrHero
            ? shareIconBtnHtml + upgradeActions + addToCartBtn
            : shareBtnHtml));
  const acquisitionStatus = (!isShopOrHero || state.inspirationMode) ? '' : '<span class="acquired-indicator' + (acquiredCount ? ' has-items' : '') + '" data-acquired-count>' +
    (acquiredCount ? '×' + acquiredCount : '') + '</span>';
  let managementControls = '';
  if (item.adicionado && !state.inspirationMode) {
    managementControls = '<div class="custom-item-management"><button class="custom-management-button" type="button" data-action="edit-custom-item" data-item-id="' + escapeHtml(item.id) + '" title="Editar ou renomear" aria-label="Editar ou renomear ' + escapeHtml(item.nome) + '">Editar</button>' +
      '<button class="custom-management-button delete" type="button" data-action="delete-custom-item" data-item-id="' + escapeHtml(item.id) + '" title="Apagar item" aria-label="Apagar ' + escapeHtml(item.nome) + '">×</button></div>';
  } else if (state.debugMode && !state.inspirationMode) {
    managementControls = '<div class="custom-item-management"><button class="custom-management-button" type="button" data-action="debug-edit-item" data-item-id="' + escapeHtml(item.id) + '" title="Corrigir nome ou textos no modo debug" aria-label="Editar ' + escapeHtml(item.nome) + ' no modo debug">Editar</button></div>';
  }
  const isRedundantTierCategory = Boolean(magicBadge && (
    category === 'acessorio_menor' ||
    category === 'acessorio_medio' ||
    category === 'acessorio_maior' ||
    category.startsWith('arma_especifica_') ||
    category.startsWith('armadura_especifica_')
  ));
  const categoryBadgeHtml = isRedundantTierCategory ? '' : ('<span class="badge">' + escapeHtml(CATEGORY_LABELS[category] || humanize(category)) + '</span>');

  return '<article class="item-card' + (acquiredCount ? ' acquired' : '') + '" data-type="' + escapeHtml(item.tipo) + '" data-item-id="' + escapeHtml(item.id) + '">' +
    '<div class="card-header"><div class="title-row"><span class="item-icon" aria-hidden="true">' + typeMeta.icon + '</span>' +
    '<h3 class="item-title">' + escapeHtml(item.nome) + '</h3>' + managementControls + '</div>' +
    '<div class="badges"><span class="badge badge-type-' + escapeHtml(item.tipo) + '">' + escapeHtml(typeMeta.label) + '</span>' +
    categoryBadgeHtml + magicBadge + originBadge + debugBadge + books + '</div></div>' +
    itemStatsHtmlBlock(item) + itemChoiceFieldsHtml(originalItem, options) +
    '<div class="item-card-detail">' + propertiesHtml(item) + '<div class="card-body">' + body + '</div>' + specificMagicHtml({ improvements: [], enchantments: [], quantity: 1 }, item) + '</div>' +
    '<div class="card-overlay"><button class="expand-item-button" type="button" data-action="toggle-item" aria-expanded="false"><span class="expand-arrow">▾</span> <span class="expand-text">Ver item completo</span></button>' +
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
    const costLabel = info.known ? ' (+' + formatCurrencyValue(info.value, 'T$') + ')' : ' (raro · sem preço de venda)';
    return '<option value="' + escapeHtml(material.id) + '"' + (material.id === choice.materialId ? ' selected' : '') + '>' +
      escapeHtml(material.nome + costLabel) + '</option>';
  }).join('');
  return '<div class="improvement-field material-field"><label>Material especial</label>' +
    '<select class="improvement-select" data-action="material" aria-label="Material especial" required>' +
      '<option value=""' + (!choice.materialId ? ' selected' : '') + '>Escolha o material…</option>' + options + '</select>' +
    '<small class="material-availability-note">Materiais sem preço são raros: só podem ser vendidos com autorização do mestre ou recebidos como recompensa.</small></div>';
}

function materialSelectionStatus(instance, item) {
  const choice = (instance.improvements || []).find(function(entry) { return entry.id === 'material_especial'; });
  if (!choice) return { complete: true, rare: false };
  if (!choice.materialId) return { complete: false, rare: false };
  const material = materialById.get(choice.materialId);
  const info = material && getMaterialCostInfo(material, item);
  return { complete: Boolean(material && info && info.applicable), rare: Boolean(info && info.applicable && !info.known) };
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
    ? ' Este material é raro, não possui preço de venda e exige autorização do mestre ou deve ser recebido como recompensa.'
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