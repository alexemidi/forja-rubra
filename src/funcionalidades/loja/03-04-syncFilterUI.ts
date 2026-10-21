

function syncFilterUI() {
  const relatedActive = !state.searchNameOnly;
  nameOnlySearchButton.textContent = 'Busca relacionada';
  nameOnlySearchButton.classList.toggle('active', relatedActive);
  nameOnlySearchButton.setAttribute('aria-pressed', String(relatedActive));
  debugModeButton.classList.toggle('active', state.debugMode);
  debugModeButton.setAttribute('aria-pressed', String(state.debugMode));
  document.querySelectorAll('.type-chip').forEach(function(button) {
    button.classList.toggle('active', button.dataset.value === state.type);
  });
  document.querySelectorAll('.specific-chip').forEach(function(button) {
    button.classList.toggle('active', button.dataset.value === state.specific);
  });
  document.querySelectorAll('.tier-chip').forEach(function(button) {
    button.classList.toggle('active', button.dataset.value === (state.magicTier || 'todos'));
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
  if (state.specific !== 'convencional' && state.specific !== 'todos') {
    let specLabel = state.specific === 'especifico' ? 'Específicos' : 'Litúrgicos';
    if (state.magicTier && state.magicTier !== 'todos') {
      const tierMap = { menor: 'Menor', medio: 'Médio', maior: 'Maior' };
      specLabel += ' (' + (tierMap[state.magicTier] || humanize(state.magicTier)) + ')';
    }
    parts.push(specLabel);
  }
  return parts.join(' · ');
}

function syncAdvancedFiltersButton(forcedLabel) {
  if (!advancedFiltersButton) return;
  const summary = forcedLabel || activeFilterSummary();
  if (summary) {
    advancedFiltersButton.innerHTML = '<span class="filter-btn-text">' + escapeHtml(summary) + '</span><span class="filter-clear-badge" data-action="quick-clear-filters" title="Limpar filtros" aria-label="Limpar filtros"></span>';
  } else {
    advancedFiltersButton.innerHTML = '<span class="filter-btn-text">Filtros avançados</span>';
  }
  advancedFiltersButton.title = summary ? 'Filtros aplicados: ' + summary + ' (clique no X para limpar)' : 'Abrir filtros avançados';
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
  if (!item) return '';
  if (item.tipo === 'arma' || item.tipo === 'municao') return 'arma';
  if (item.tipo === 'armadura') return 'armadura';
  if (item.tipo === 'escudo') return 'escudo';
  if (item.tipo === 'esoterico') return 'esoterico';
  if (item.tipo === 'ferramenta' || item.tipo === 'instrumento') return 'ferramenta';
  if (item.tipo === 'vestuario') return 'vestuario';
  if (item.tipo === 'item_geral') {
    if (['esoterico', 'ferramenta', 'vestuario'].includes(item.categoriaId)) {
      return item.categoriaId;
    }
    // Instrumentos musicais são ferramentas para as melhorias de T20.
    // O catálogo usa a categoria própria "instrumento", por isso ela precisa
    // ser convertida aqui antes de procurar as melhorias de ferramenta.
    if (item.categoriaId === 'instrumento') return 'ferramenta';
    // Ferramentas ou instrumentos cadastrados sob equipamento_aventura ou que modificam perícias (como Ábaco, Astrolábio, Bússola, Lupa, etc.)
    const toolIds = ['abaco', 'astrolabio', 'bussola', 'estetoscopio', 'lupa', 'prancheta', 'pe_de_cabra', 'espelho_refletor', 'aparelho_de_cha', 'ampulheta', 'diagrama_anatomico', 'corda', 'algemas', 'arpeu'];
    if (toolIds.includes(item.id) || itemModifiesSkill(item) || /instrumento|ferramenta/i.test(item.nome || '')) {
      return 'ferramenta';
    }
  }
  return '';
}

function isSpecificMagicItem(item) {
  return Boolean(item && (item.especifico || (item.magico && (item.magico.tipo === 'especifico' || item.magico.tipo === 'liturgico'))));
}

function isLiturgicalItem(item) {
  return Boolean(item && (item.liturgico || (item.magico && item.magico.tipo === 'liturgico')));
}

function isNamedFixedMagicItem(item) {
  return Boolean(item && (item.especifico || item.liturgico || (item.magico && (item.magico.tipo === 'especifico' || item.magico.tipo === 'liturgico'))));
}

function materialApplicationKeys(item) {
  if (item.tipo === 'arma' || item.tipo === 'municao') return ['arma'];
  if (item.tipo === 'armadura') {
    return item.categoriaId === 'pesada' ? ['armadura_pesada', 'armadura'] : ['armadura_leve', 'armadura'];
  }
  if (item.tipo === 'escudo') return ['escudo'];
  const cat = itemImprovementCategory(item);
  if (cat === 'esoterico' || item.categoriaId === 'esoterico') return ['esoterico'];
  if (cat === 'ferramenta' || item.categoriaId === 'ferramenta') return ['ferramenta'];
  if (cat === 'vestuario' || item.categoriaId === 'vestuario') return ['vestuario'];
  return [];
}

function getMaterialCostInfo(material, item) {
  const costs = materialCosts.get(material.id) || {};
  const hasBasicCostTable = materialCosts.has(material.id);
  const applications = material.aplicacoes || {};
  const keys = materialApplicationKeys(item);
  const isEsoteric = keys.includes('esoterico');

  if (isEsoteric) {
    if (Object.prototype.hasOwnProperty.call(costs, 'esoterico')) {
      return { applicable: true, known: true, value: Number(costs['esoterico']) || 0, key: 'esoterico' };
    }
    return { applicable: false, known: false, value: 0, key: '' };
  }

  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(costs, key)) {
      return { applicable: true, known: true, value: Number(costs[key]) || 0, key: key };
    }
  }

  // Se o material possui tabela oficial mas não lista esta categoria (ex: Madeira Tollon em armaduras), não pode ser construído
  if (hasBasicCostTable) {
    return { applicable: false, known: false, value: 0, key: '' };
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
  if (!item || item.bloquearMaterialEspecial || item.id === 'armadura_de_pedra' || item.id === 'veste_de_teia_de_aranha') {
    return [];
  }
  return materials.filter(function(material) { return getMaterialCostInfo(material, item).applicable; });
}

function itemModifiesSkill(item) {
  const effects = item.efeitos || [];
  if (effects.some(function(effect) {
    return /pericia|penalidade/.test(String(effect.tipo || ''));
  })) return true;
  const texts = item.textos || {};
  const rules = [texts.habilidade, texts.variavel].filter(Boolean).join(' ').toLocaleLowerCase('pt-BR');
  return /(?:fornece|recebe)\s*[+–-]\s*\d+[^.]{0,80}(?:teste|perícia)|sem (?:este|esta) item[^.]{0,80}(?:sofre|penalidade)\s*[–-]\s*\d+/.test(rules);
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
  if (restriction.tipo === 'combate') {
    return Boolean(item.arma && (restriction.valores || []).includes(item.arma.combateId));
  }
  if (restriction.tipo === 'municao') return item.tipo === 'municao';
  if (restriction.tipo === 'item_modifica_pericia') {
    return (item.categoriaId === 'ferramenta' || item.categoriaId === 'vestuario') && itemModifiesSkill(item);
  }
  return true;
}

function improvementAppliesToItem(improvement, item) {
  if (isNamedFixedMagicItem(item) || isAparatoItem(item)) return false;
  const category = itemImprovementCategory(item);
  if (!category || !(improvement.categoriasIds || []).includes(category)) return false;
  if (!(improvement.restricoes || []).every(function(restriction) { return restrictionMatches(restriction, item); })) return false;
  if (improvement.id === 'material_especial' && (item.bloquearMaterialEspecial || item.id === 'armadura_de_pedra' || item.id === 'veste_de_teia_de_aranha' || materialOptionsForItem(item).length === 0)) return false;
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
      choice.materialId = '';
    }
  });
  instance.improvements = clean;
}

function selectedImprovementIds(instance) {
  return new Set((instance.improvements || []).map(function(choice) { return choice.id; }));
}

const APARATOS_CANONICOS_IDS_REF = [
  'captador_de_luz',
  'comutador',
  'conversor_alimentador',
  'engenho_de_automacao',
  'espera_para_melhorias',
  'estabilizador',
  'estimulador_de_sobrecarga',
  'gatilho_de_corda',
  'giroscopio',
  'ligacao_de_convergencia',
  'remontagem_de_portabilidade',
  'sequenciador_de_ativacao',
  'sistema_de_refrigeracao',
  'supressor_de_seguranca',
  'transformador_mistico'
];

function isAparatoItem(item) {
  if (!item) return false;
  const id = item.id || item.itemId || '';
  return (
    item.categoriaId === 'aparato' ||
    item.tipo === 'aparato' ||
    Boolean(item.isAparato) ||
    APARATOS_CANONICOS_IDS_REF.includes(id) ||
    (typeof APARATOS_CANONICOS_IDS !== 'undefined' && Array.isArray(APARATOS_CANONICOS_IDS) && APARATOS_CANONICOS_IDS.includes(id))
  );
}
if (typeof window !== 'undefined') {
  window.isAparatoItem = isAparatoItem;
}

function itemEnchantmentApplicationIds(item) {
  if (!item || isAparatoItem(item)) return [];
  const ids = [item.tipo];
  if (item.tipo === 'item_geral') {
    if (item.categoriaId === 'esoterico') {
      ids.push('esoterico');
    } else if (item.categoriaId === 'acessorio' || item.categoriaId === 'vestuario') {
      ids.push('acessorio');
    }
  }
  return ids;
}

function enchantmentAppliesToItem(enchantment, item) {
  if (!item || isAparatoItem(item)) return false;
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
  if (isNamedFixedMagicItem(item) || isAparatoItem(item)) {
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
  let specificCd = specificRules.cdPorCategoria && item.magico && specificRules.cdPorCategoria[item.magico.categoriaId];
  if (!specificCd && isNamedFixedMagicItem(item)) {
    const catKey = String(item.magico && item.magico.categoriaId || '').toLowerCase();
    if (catKey.includes('menor')) specificCd = 30;
    else if (catKey.includes('medio') || catKey.includes('médio')) specificCd = 40;
    else if (catKey.includes('maior')) specificCd = 50;
    else specificCd = 30;
  }
  const craftCd = isNamedFixedMagicItem(item)
    ? item.magico.fabricavel === false ? null : Number(specificCd || 30)
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
  if (cartCount) cartCount.textContent = String(totals.packages);
  cartButton?.classList.toggle('has-items', totals.packages > 0);
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
  if (typeof checkoutWithAmmo === 'function' && cartItems.length) {
    return checkoutWithAmmo(false);
  }
  if (typeof promptGeneralPurchaseModal === 'function') {
    const currentFunds = Number(typeof arsenalInitialState !== 'undefined' ? arsenalInitialState?.funds : 0);
    const totalValue = typeof cartTotalsInfo === 'function' ? cartTotalsInfo().value : 0;
    return promptGeneralPurchaseModal(totalValue, cartItems, currentFunds);
  }
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
