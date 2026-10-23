

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
  const maxAllowedEncs = typeof getMaxAllowedEnchantments === 'function' ? getMaxAllowedEnchantments() : MAX_ENCHANTMENTS;
  const effectiveMax = Math.max(1, maxAllowedEncs || 1);
  const shouldOpen = openEnchantmentPanels.has(instance.instanceId) || instance.enchantments.length > 0;
  const slots = Array.from({ length: effectiveMax }, function(_, slotIndex) {
    return '<div class="improvement-field"><label>' + (slotIndex + 1) + 'º encanto</label>' +
      enchantmentOptionsHtml(instance, item, slotIndex) + '</div>';
  }).join('');
  return '<details class="enchantments-panel" data-instance-id="' + escapeHtml(instance.instanceId) + '"' + (shouldOpen ? ' open' : '') + '>' +
    '<summary><span>Encantos</span><span class="improvement-counter">' + enchantmentSlotsUsed(instance.enchantments) + '/' + effectiveMax + '</span></summary>' +
    '<div class="improvement-editor"><div class="improvement-slots">' + slots + '</div>' + enchantmentDetailsHtml(instance, item) + '</div></details>';
}

function purchaseUpgradeButtons(item) {
  if (!item || item.id === 'instrumentos_de_oficio' || isNamedFixedMagicItem(item) || (typeof isAparatoItem === 'function' && isAparatoItem(item))) return '';
  if (typeof arsenalInitialState !== 'undefined' && arsenalInitialState.mode === 'initial') {
    const choice = (typeof effectiveInitialChoice === 'function' ? effectiveInitialChoice() : null) || arsenalInitialState.choice;
    if (!choice || !choice.isBudgetGrant) return '';
  } else if (document.body?.classList.contains('initial-equipment')) {
    return '';
  }
  const hasImprovements=improvements.some(choice=>improvementAppliesToItem(choice,item)),hasEnchantments=enchantments.some(choice=>enchantmentAppliesToItem(choice,item));
  const hammerIcon = window.IconesForja ? window.IconesForja.get('hammer', 'icon-sm') : '<svg class="forja-svg icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 12-8.5 8.5a2.12 2.12 0 1 1-3-3L11 9"></path><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"></path><line x1="9" y1="15" x2="15" y2="9"></line></svg>';
  const sparklesIcon = window.IconesForja ? window.IconesForja.get('sparkles', 'icon-sm') : '<svg class="forja-svg icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"></path></svg>';
  return (hasImprovements?'<button class="upgrade-purchase-button" type="button" data-action="configure-purchase" data-kind="improvements" data-item-id="'+escapeHtml(item.id)+'" title="Adicionar melhorias" aria-label="Adicionar melhorias">'+hammerIcon+'</button>':'')+(hasEnchantments?'<button class="upgrade-purchase-button" type="button" data-action="configure-purchase" data-kind="enchantments" data-item-id="'+escapeHtml(item.id)+'" title="Adicionar encantamentos" aria-label="Adicionar encantamentos">'+sparklesIcon+'</button>':'');
}
function getMaxAllowedImprovements() {
  if (typeof arsenalInitialState !== 'undefined') {
    if (arsenalInitialState.mode === 'initial') {
      const choice = (typeof effectiveInitialChoice === 'function' ? effectiveInitialChoice() : null) || arsenalInitialState.choice;
      if (choice && Number.isFinite(choice.maxImprovements)) {
        return Math.max(1, Math.min(4, Number(choice.maxImprovements)));
      }
      if (choice && choice.isBudgetGrant) {
        return 4;
      }
      return 0;
    }
    const modalElem = typeof document !== 'undefined' ? document.getElementById('purchaseUpgradeModal') : null;
    const isWorkshop = arsenalInitialState.mode === 'workshop' || Boolean(modalElem?.dataset?.upgradeTargetInstanceId);
    if (isWorkshop) {
      if (arsenalInitialState.crafting && typeof arsenalInitialState.crafting.improvements === 'number') {
        return Math.max(0, Math.min(4, arsenalInitialState.crafting.improvements));
      }
      return 0;
    }
  }
  return 4;
}

function getMaxAllowedEnchantments() {
  if (typeof arsenalInitialState !== 'undefined') {
    if (arsenalInitialState.mode === 'initial') return 0;
    const modalElem = typeof document !== 'undefined' ? document.getElementById('purchaseUpgradeModal') : null;
    const isWorkshop = arsenalInitialState.mode === 'workshop' || Boolean(modalElem?.dataset?.upgradeTargetInstanceId);
    if (isWorkshop) {
      if (arsenalInitialState.crafting && typeof arsenalInitialState.crafting.magic === 'number') {
        return Math.max(0, Math.min(3, arsenalInitialState.crafting.magic));
      }
      const invLvl = Number(arsenalInitialState.crafting?.inventorLevel) || (arsenalInitialState.crafting?.hasInventorClass ? Number(arsenalInitialState.level) : 0);
      if (invLvl >= 17) return 3;
      if (invLvl >= 13) return 2;
      if (invLvl >= 9) return 1;
      return 0;
    }
  }
  return 3;
}


function purchaseDraft(itemId){if(!purchaseDrafts.has(itemId))purchaseDrafts.set(itemId,{instanceId:'compra-'+itemId,itemId,quantity:1,options:catalogOptionsForItem(itemById.get(itemId)),improvements:[],enchantments:[]});return purchaseDrafts.get(itemId)}
function purchaseUpgradeEditor(itemId,kind){
  const original=itemById.get(itemId),draft=purchaseDraft(itemId),item=effectiveItemForOptions(original,draft);if(!item)return '';
  const modalElem = typeof document !== 'undefined' ? document.getElementById('purchaseUpgradeModal') : null;
  const isWorkshopMode = Boolean(
    (typeof arsenalInitialState !== 'undefined' && arsenalInitialState.mode === 'workshop') ||
    modalElem?.dataset?.upgradeTargetInstanceId
  );
  const preservedQuery = (modalElem && modalElem.dataset.searchQuery) ? modalElem.dataset.searchQuery : '';
  const q = preservedQuery.trim().toLowerCase();

  if (kind === 'enchantments') {
    const maxAllowedEncSlots = getMaxAllowedEnchantments();
    if (modalElem) modalElem.dataset.maxEnchantments = String(maxAllowedEncSlots);
    if (!Array.isArray(draft.enchantments)) draft.enchantments = [];
    while (draft.enchantments.length > 0 && enchantmentSlotsUsed(draft.enchantments) > maxAllowedEncSlots) {
      draft.enchantments.pop();
    }
    const usedSlots = enchantmentSlotsUsed(draft.enchantments);
    const currentEncIds = new Set(draft.enchantments);

    let slotNumberCursor = 1;
    const encSlotsCards = draft.enchantments.map((encId, idx) => {
      const enc = enchantmentById.get(encId);
      const name = (enc ? enc.nome : String(encId || '')).replace(/_/g, ' ');
      const slotCost = enchantmentSlotCost(enc);
      const badgeLabel = slotCost > 1
        ? slotNumberCursor + 'º e ' + (slotNumberCursor + 1) + 'º encantos'
        : slotNumberCursor + 'º encanto';
      slotNumberCursor += slotCost;
      return '<div class="upgrade-slot-card filled">' +
        '<div class="slot-badge">' + badgeLabel + '</div>' +
        '<div class="slot-info">' +
          '<strong>' + escapeHtml(name) + '</strong>' +
          '<small>' + escapeHtml(enc?.descricao || '') + '</small>' +
        '</div>' +
        '<button type="button" class="slot-remove-btn" data-action="remove-slot-enchantment" data-slot="' + idx + '" title="Remover este encantamento">×</button>' +
      '</div>';
    });

    if (usedSlots < maxAllowedEncSlots) {
      encSlotsCards.push(
        '<div class="upgrade-slot-card empty">' +
          '<div class="slot-badge">' + (usedSlots + 1) + 'º encanto</div>' +
          '<div class="slot-info">' +
            '<span style="color:var(--text-muted);font-style:italic">Vazio · Escolha um encantamento na barra lateral</span>' +
          '</div>' +
        '</div>'
      );
    } else if (maxAllowedEncSlots === 0 && encSlotsCards.length === 0) {
      encSlotsCards.push(
        '<div class="upgrade-slot-card empty">' +
          '<div class="slot-badge">1º encanto</div>' +
          '<div class="slot-info">' +
            '<span style="color:var(--text-muted);font-style:italic">Nenhum encantamento disponível para forjar no nível atual</span>' +
          '</div>' +
        '</div>'
      );
    }

    const availableEncs = enchantments.filter(enc => enchantmentAppliesToItem(enc, item));
    const sidebarEncsHtml = availableEncs.map(enc => {
      const isChosen = currentEncIds.has(enc.id);
      const otherIds = new Set(Array.from(currentEncIds).filter(id => id !== enc.id));
      const selectedWithThis = new Set(otherIds);
      selectedWithThis.add(enc.id);
      const reqMet = enchantmentRequirementsMet(enc, selectedWithThis);
      const conflicts = enchantmentsConflict(enc, otherIds);
      const slotCost = enchantmentSlotCost(enc);
      const exceedsSlots = !isChosen && (usedSlots + slotCost > maxAllowedEncSlots);

      let statusBadge = '';
      let isBlocked = false;
      if (isChosen) {
        statusBadge = '<span class="tag" style="font-size:0.68rem">Selecionado</span>';
      } else if (!reqMet) {
        isBlocked = true;
        const reqLabel = enchantmentRequirementLabel(enc);
        statusBadge = '<span class="tag red" style="font-size:0.68rem" title="Requisito pendente">Requer: ' + escapeHtml(reqLabel) + '</span>';
      } else if (conflicts) {
        isBlocked = true;
        statusBadge = '<span class="tag red" style="font-size:0.68rem">Incompatível</span>';
      } else if (exceedsSlots) {
        isBlocked = true;
        statusBadge = '<span class="tag" style="font-size:0.68rem">' + (maxAllowedEncSlots === 0 ? 'Bloqueado' : 'Limite (' + usedSlots + '/' + maxAllowedEncSlots + ') atingido') + '</span>';
      } else if (slotCost > 1) {
        statusBadge = '<span class="tag" style="font-size:0.68rem">Conta como 2 encantos</span>';
      }

      const actionBtn = isChosen
        ? '<button type="button" class="button small danger" data-action="remove-sidebar-enchantment" data-enc-id="' + escapeHtml(enc.id) + '" style="padding:2px 8px;font-size:0.72rem">Remover</button>'
        : '<button type="button" class="button small primary" data-action="select-sidebar-enchantment" data-enc-id="' + escapeHtml(enc.id) + '" ' + (isBlocked ? 'disabled' : '') + ' style="padding:2px 8px;font-size:0.72rem">+ Adicionar</button>';

      const searchText = (enc.nome + ' ' + (enc.descricao || '')).toLowerCase();
      const searchMatch = !q || searchText.includes(q);
      const hideStyle = searchMatch ? '' : 'display:none;';

      return '<div class="sidebar-improvement-item ' + (isBlocked ? 'is-blocked' : '') + ' ' + (isChosen ? 'is-active' : '') + '" style="' + hideStyle + '" data-imp-search="' + escapeHtml(searchText) + '">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:6px">' +
          '<strong style="font-size:0.82rem;color:' + (isChosen ? 'var(--gold2)' : isBlocked ? 'var(--text-muted)' : 'var(--text)') + '">' + escapeHtml(enc.nome) + '</strong>' +
          statusBadge +
        '</div>' +
        '<p style="font-size:0.73rem;color:var(--text-muted);margin:4px 0 6px 0;line-height:1.35">' + escapeHtml(enc.descricao || '') + '</p>' +
        '<div style="display:flex;justify-content:flex-end">' + actionBtn + '</div>' +
      '</div>';
    }).join('');

    const value = entryValueInfo(draft, item);
    const encCostNote = isWorkshopMode
      ? (usedSlots
          ? 'Custo de encantamento: +' + formatCurrencyValue(value.enchantmentSurcharge, value.currency) +
            '. CD de fabricação: ' + value.craftCd + ' · Custo para fabricar: ' + formatCurrencyValue(value.craftCost, value.currency) +
            (value.magicCategory ? ' · Sacrifício: ' + value.magicCategory.custoPm + ' PM permanentes.' : '.')
          : 'Escolha até ' + (maxAllowedEncSlots === 1 ? 'um encantamento' : maxAllowedEncSlots + ' encantamentos') + ' na barra lateral. O custo e a CD de fabricação são ajustados automaticamente.')
      : (usedSlots
          ? 'Acréscimo de item mágico (' + (value.magicCategory ? value.magicCategory.nome.toLowerCase() : usedSlots + ' encanto(s)') + '): +' +
            formatCurrencyValue(value.enchantmentSurcharge, value.currency) + '. Preço final de compra: ' + formatCurrencyValue(value.unitKnown, value.currency) + '.'
          : 'Escolha até ' + (maxAllowedEncSlots === 1 ? 'um encantamento' : maxAllowedEncSlots + ' encantamentos') + ' na barra lateral para comprar o item encantado pronto. Energética, Lancinante, Magnífica e Guardião contam como dois encantos.');

    return '<div class="purchase-improvements-layout">' +
      '<div class="improvements-config-main">' +
        '<div class="item-summary-strip" style="background:var(--surface2);padding:10px 14px;border-radius:6px;border:1px solid var(--border);margin-bottom:12px;display:flex;justify-content:space-between;align-items:center">' +
          '<div>' +
            '<strong style="font-size:1rem;color:var(--gold2)">' + escapeHtml(item.nome) + '</strong>' +
            '<div style="font-size:0.75rem;color:var(--text-muted)">Preço base: T$ ' + Number(item.preco?.valor || 0) + ' · Tipo: ' + escapeHtml(item.tipo) + '</div>' +
          '</div>' +
          '<div style="text-align:right">' +
            '<span class="improvement-counter" style="font-size:0.85rem;font-weight:700;color:var(--gold2)">' + usedSlots + '/' + maxAllowedEncSlots + ' encantos</span>' +
            '<div style="font-size:0.75rem;color:var(--text-muted)">Total: ' + formatCurrencyValue(value.unitKnown, 'T$') + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="slots-container" style="display:flex;flex-direction:column;gap:8px">' +
          encSlotsCards.join('') +
        '</div>' +
        '<div class="improvements-cost-callout" style="margin-top:14px;padding:10px 12px;border-radius:6px;background:var(--surface2);border:1px solid var(--border);font-size:0.8rem;color:var(--text)">' +
          escapeHtml(encCostNote) +
        '</div>' +
      '</div>' +
      '<aside class="improvements-sidebar">' +
        '<div class="sidebar-header">' +
          '<h3>Encantamentos Disponíveis</h3>' +
          '<input type="search" class="sidebar-search-input" placeholder="Filtrar encantamentos..." data-action="filter-sidebar-improvements" value="' + escapeHtml(preservedQuery) + '" />' +
        '</div>' +
        '<div class="sidebar-list">' +
          (sidebarEncsHtml || '<p style="color:var(--text-muted);font-size:0.8rem;padding:8px">Nenhum encantamento compatível.</p>') +
        '</div>' +
      '</aside>' +
    '</div>';
  }

  const maxAllowedSlots = getMaxAllowedImprovements();
  if (modalElem) modalElem.dataset.maxImprovements = String(maxAllowedSlots);
  if (draft && Array.isArray(draft.improvements) && draft.improvements.length > maxAllowedSlots) {
    draft.improvements = draft.improvements.slice(0, maxAllowedSlots);
  }

  let maxAffordableSlots = maxAllowedSlots;
  if (typeof arsenalInitialState !== 'undefined' && arsenalInitialState.mode === 'initial') {
    const choice = (typeof effectiveInitialChoice === 'function' ? effectiveInitialChoice() : null) || arsenalInitialState.choice;
    const hasUnlimitedBudget = Boolean(choice?.unlimitedBudget || choice?.maxBudget === Infinity);
    if (choice && choice.isBudgetGrant && !hasUnlimitedBudget && Number.isFinite(Number(choice.maxBudget))) {
      const maxBudget = Number(choice.maxBudget);
      let affordable = 0;
      for (let s = 1; s <= maxAllowedSlots; s++) {
        if (Number(item.preco?.valor || 0) + (IMPROVEMENT_SURCHARGES[s] || 0) <= maxBudget) {
          affordable = s;
        } else {
          break;
        }
      }
      maxAffordableSlots = Math.max(1, affordable);
    }
  }

  const currentCount = draft.improvements.length;
  const currentIds = new Set(draft.improvements.map(c => c.id));
  const hasMaterial = currentIds.has('material_especial');

  let visibleSlotsCount = Math.max(1, currentCount);
  if (currentCount < maxAffordableSlots) {
    const nextSlot = currentCount + 1;
    let canShowNext = true;
    if (typeof arsenalInitialState !== 'undefined' && arsenalInitialState.mode === 'initial') {
      const choice = (typeof effectiveInitialChoice === 'function' ? effectiveInitialChoice() : null) || arsenalInitialState.choice;
      const hasUnlimitedBudget = Boolean(choice?.unlimitedBudget || choice?.maxBudget === Infinity);
      if (choice && choice.isBudgetGrant && !hasUnlimitedBudget && Number.isFinite(Number(choice.maxBudget))) {
        const maxBudget = Number(choice.maxBudget);
        let matVal = 0;
        (draft.improvements || []).forEach(c => {
          if (c.id === 'material_especial' && c.materialId) {
            const m = materialById.get(c.materialId);
            if (m) {
              const inf = getMaterialCostInfo(m, item);
              if (inf.known) matVal += inf.value;
            }
          }
        });
        const projCost = Number(item.preco?.valor || 0) + (IMPROVEMENT_SURCHARGES[nextSlot] || 0) + matVal;
        if (projCost > maxBudget) {
          canShowNext = false;
        }
      }
    }
    if (canShowNext) {
      visibleSlotsCount = currentCount + 1;
    }
  }

  const slotIndices = Array.from({ length: visibleSlotsCount }, (_, i) => i);
  const slotsHtml = slotIndices.map(slotIndex => {
    const choice = draft.improvements[slotIndex];
    if (choice) {
      const imp = improvementById.get(choice.id);
      const name = (imp ? imp.nome : String(choice.id || '')).replace(/_/g, ' ');
      let extra = '';
      if (choice.id === 'material_especial') {
        const mat = materialById.get(choice.materialId);
        extra = mat ? ' (' + mat.nome.replace(/_/g, ' ') + ')' : ' (Material não escolhido)';
      }
      return '<div class="upgrade-slot-card filled">' +
        '<div class="slot-badge">' + (slotIndex + 1) + 'ª melhoria</div>' +
        '<div class="slot-info">' +
          '<strong>' + escapeHtml(name + extra) + '</strong>' +
          '<small>' + escapeHtml(imp?.resumo || '') + '</small>' +
        '</div>' +
        '<button type="button" class="slot-remove-btn" data-action="remove-slot-improvement" data-slot="' + slotIndex + '" title="Remover esta melhoria">×</button>' +
      '</div>';
    }
    return '<div class="upgrade-slot-card empty">' +
      '<div class="slot-badge">' + (slotIndex + 1) + 'ª melhoria</div>' +
      '<div class="slot-info">' +
        '<span style="color:var(--text-muted);font-style:italic">Vazio · Escolha uma melhoria na barra lateral</span>' +
      '</div>' +
    '</div>';
  }).join('');

  let materialSectionHtml = '';
  const itemMaterials = materialOptionsForItem(item);
  if (itemMaterials.length > 0) {
    const currentChoice = draft.improvements.find(e => e.id === 'material_especial');
    const selectedMatId = currentChoice?.materialId || '';
    const materials = itemMaterials;
    const materialCards = materials.map(mat => {
      const info = getMaterialCostInfo(mat, item);
      const isSelected = mat.id === selectedMatId;
      const costStr = info.known ? '+' + formatCurrencyValue(info.value, 'T$') : 'Raro (sem preço)';
      const summary = materialSummary(mat, item);
      return '<div class="material-choice-card ' + (isSelected ? 'selected' : '') + '" data-action="select-material-card" data-material-id="' + escapeHtml(mat.id) + '" style="cursor:pointer">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">' +
          '<strong style="color:var(--gold2)">' + escapeHtml(mat.nome) + '</strong>' +
          '<span class="badge" style="font-weight:700">' + costStr + '</span>' +
        '</div>' +
        '<p style="font-size:0.75rem;margin:0;color:var(--text-muted);line-height:1.35">' + escapeHtml(summary) + '</p>' +
      '</div>';
    }).join('');

    materialSectionHtml = '<div class="special-material-panel" style="margin-top:14px;padding:12px;background:var(--surface2);border:1px solid var(--border);border-radius:8px">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">' +
        '<h4 style="margin:0;font-size:0.9rem;color:var(--gold2)">Escolha o Material Especial</h4>' +
        '<small style="color:var(--text-muted);font-size:0.72rem">Clique para selecionar</small>' +
      '</div>' +
      '<div class="material-cards-grid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(240px, 1fr));gap:10px">' +
        materialCards +
      '</div>' +
    '</div>';
  }

  const availableImps = improvements.filter(imp => improvementAppliesToItem(imp, item));
  const sidebarItemsHtml = availableImps.map(imp => {
    const isChosen = currentIds.has(imp.id);
    const otherIds = new Set(Array.from(currentIds).filter(id => id !== imp.id));
    const reqMet = requirementsMet(imp, currentIds);
    const conflicts = improvementsConflict(imp, otherIds);
    const isFull = currentCount >= maxAffordableSlots && !isChosen;

    let statusBadge = '';
    let isBlocked = false;
    if (isChosen) {
      statusBadge = '<span class="tag" style="font-size:0.68rem">Selecionada</span>';
    } else if (!reqMet) {
      isBlocked = true;
      const reqLabel = improvementRequirementLabel(imp);
      statusBadge = '<span class="tag red" style="font-size:0.68rem" title="Requisito pendente">Requer: ' + escapeHtml(reqLabel) + '</span>';
    } else if (conflicts) {
      isBlocked = true;
      statusBadge = '<span class="tag red" style="font-size:0.68rem">Incompatível</span>';
    } else if (isFull) {
      isBlocked = true;
      statusBadge = '<span class="tag" style="font-size:0.68rem">Limite (' + maxAffordableSlots + '/' + maxAffordableSlots + ') atingido</span>';
    }

    const actionBtn = isChosen
      ? '<button type="button" class="button small danger" data-action="remove-sidebar-improvement" data-imp-id="' + escapeHtml(imp.id) + '" style="padding:2px 8px;font-size:0.72rem">Remover</button>'
      : '<button type="button" class="button small primary" data-action="select-sidebar-improvement" data-imp-id="' + escapeHtml(imp.id) + '" ' + (isBlocked ? 'disabled' : '') + ' style="padding:2px 8px;font-size:0.72rem">+ Adicionar</button>';

    const searchMatch = !q || (imp.nome + ' ' + (imp.resumo || '')).toLowerCase().includes(q);
    const hideStyle = searchMatch ? '' : 'display:none;';

    return '<div class="sidebar-improvement-item ' + (isBlocked ? 'is-blocked' : '') + ' ' + (isChosen ? 'is-active' : '') + '" style="' + hideStyle + '" data-imp-search="' + escapeHtml((imp.nome + ' ' + (imp.resumo || '')).toLowerCase()) + '">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:6px">' +
        '<strong style="font-size:0.82rem;color:' + (isChosen ? 'var(--gold2)' : isBlocked ? 'var(--text-muted)' : 'var(--text)') + '">' + escapeHtml(imp.nome) + '</strong>' +
        statusBadge +
      '</div>' +
      '<p style="font-size:0.73rem;color:var(--text-muted);margin:4px 0 6px 0;line-height:1.35">' + escapeHtml(imp.resumo || '') + '</p>' +
      '<div style="display:flex;justify-content:flex-end">' + actionBtn + '</div>' +
    '</div>';
  }).join('');

  const value = entryValueInfo(draft, item);
  const cost = isWorkshopMode
    ? (currentCount
        ? 'Custo de item superior: +' + formatCurrencyValue(value.surcharge, value.currency) +
          '. Modificador na CD de fabricação: +' + value.craftBonus + '.'
        : 'Escolha até ' + (maxAffordableSlots === 1 ? 'uma melhoria' : maxAffordableSlots + ' melhorias') + ' na barra lateral. O custo e a CD são ajustados automaticamente.')
    : (currentCount
        ? 'Acréscimo de item superior: +' + formatCurrencyValue(value.surcharge, value.currency) +
          '. Preço final de compra: ' + formatCurrencyValue(value.unitKnown, value.currency) + '.'
        : 'Escolha até ' + (maxAffordableSlots === 1 ? 'uma melhoria' : maxAffordableSlots + ' melhorias') + ' na barra lateral para comprar o item superior pronto.');

  return '<div class="purchase-improvements-layout">' +
    '<div class="improvements-config-main">' +
      '<div class="item-summary-strip" style="background:var(--surface2);padding:10px 14px;border-radius:6px;border:1px solid var(--border);margin-bottom:12px;display:flex;justify-content:space-between;align-items:center">' +
        '<div>' +
          '<strong style="font-size:1rem;color:var(--gold2)">' + escapeHtml(item.nome) + '</strong>' +
          '<div style="font-size:0.75rem;color:var(--text-muted)">Preço base: T$ ' + Number(item.preco?.valor || 0) + ' · Tipo: ' + escapeHtml(item.tipo) + '</div>' +
        '</div>' +
        '<div style="text-align:right">' +
          '<span class="improvement-counter" style="font-size:0.85rem;font-weight:700;color:var(--gold2)">' + currentCount + '/' + maxAffordableSlots + ' melhorias</span>' +
          '<div style="font-size:0.75rem;color:var(--text-muted)">Total: ' + formatCurrencyValue(value.unitKnown, 'T$') + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="slots-container" style="display:flex;flex-direction:column;gap:8px">' +
        slotsHtml +
      '</div>' +
      '<div class="improvements-cost-callout" style="margin-top:14px;padding:10px 12px;border-radius:6px;background:var(--surface2);border:1px solid var(--border);font-size:0.8rem;color:var(--text)">' +
        cost +
      '</div>' +
      materialSectionHtml +
    '</div>' +
    '<aside class="improvements-sidebar">' +
      '<div class="sidebar-header">' +
        '<h3>Melhorias Disponíveis</h3>' +
        '<input type="search" class="sidebar-search-input" placeholder="Filtrar melhorias..." data-action="filter-sidebar-improvements" value="' + escapeHtml(preservedQuery) + '" />' +
      '</div>' +
      '<div class="sidebar-list">' +
        (sidebarItemsHtml || '<p style="color:var(--text-muted);font-size:0.8rem;padding:8px">Nenhuma melhoria compatível.</p>') +
      '</div>' +
    '</aside>' +
  '</div>';
}
function openPurchaseUpgrade(itemId,kind,existingInstanceId=null){
  const item=itemById.get(itemId);
  if(item && typeof isAparatoItem === 'function' && isAparatoItem(item)){
    if(typeof showToast === 'function') showToast('Aparatos não podem ser encantados nem receber melhorias.');
    return;
  }
  let modal=document.getElementById('purchaseUpgradeModal');if(!modal){modal=document.createElement('div');modal.id='purchaseUpgradeModal';modal.className='app-modal';document.body.appendChild(modal)}
  modal.dataset.itemId=itemId;modal.dataset.kind=kind;
  delete modal.dataset.searchQuery;
  if(existingInstanceId) modal.dataset.upgradeTargetInstanceId=existingInstanceId;
  else delete modal.dataset.upgradeTargetInstanceId;

  const maxAllowed = getMaxAllowedImprovements();
  modal.dataset.maxImprovements = String(maxAllowed);
  const draft = purchaseDraft(itemId);
  if (draft && Array.isArray(draft.improvements) && draft.improvements.length > maxAllowed) {
    draft.improvements = draft.improvements.slice(0, maxAllowed);
  }

  const isWorkshopMode = typeof arsenalInitialState !== 'undefined' && arsenalInitialState.mode === 'workshop';
  const isInitialMode = typeof arsenalInitialState !== 'undefined' && arsenalInitialState.mode === 'initial';
  const isEnchantment = kind === 'enchantments';
  const btnLabel = existingInstanceId
    ? (isEnchantment ? 'Adicionar Encantamento' : 'Adicionar Melhoria')
    : (isWorkshopMode ? (isEnchantment ? 'Forjar Encantado' : 'Forjar Superior') : 'Adicionar ao carrinho');
  const btnAction = existingInstanceId ? 'confirm-workshop-upgrade' : (isWorkshopMode ? 'craft-configured-workshop-item' : 'add-configured-to-cart');
  const actionsHtml = isInitialMode
    ? ''
    : '<footer class="modal-actions"><button class="secondary-button" type="button" data-action="close-purchase-upgrade">Voltar</button><button class="primary-button" type="button" data-action="'+btnAction+'" data-item-id="'+escapeHtml(itemId)+'" '+(existingInstanceId?'data-instance-id="'+escapeHtml(existingInstanceId)+'"':'')+'>'+btnLabel+'</button></footer>';
  modal.innerHTML='<section class="modal-panel purchase-upgrade-panel" role="dialog" aria-modal="true"><header class="modal-header"><h2>'+(kind==='enchantments'?'Encantamentos':'Melhorias')+' · '+escapeHtml(item.nome)+'</h2><button class="modal-close" type="button" data-action="close-purchase-upgrade" aria-label="Fechar">×</button></header><div class="modal-body" data-purchase-upgrade-body>'+purchaseUpgradeEditor(itemId,kind)+'</div>' + actionsHtml + '</section>';refreshPurchaseUpgrade();openModal(modal)
}
function refreshPurchaseUpgrade(){
  const modal=document.getElementById('purchaseUpgradeModal');if(!modal)return;
  const maxAllowed = getMaxAllowedImprovements();
  modal.dataset.maxImprovements = String(maxAllowed);
  const item=itemById.get(modal.dataset.itemId),draft=purchaseDraft(modal.dataset.itemId);
  if (draft && Array.isArray(draft.improvements) && draft.improvements.length > maxAllowed) {
    draft.improvements = draft.improvements.slice(0, maxAllowed);
  }
  const status=materialSelectionStatus(draft,item);
  modal.querySelector('[data-purchase-upgrade-body]').innerHTML=purchaseUpgradeEditor(modal.dataset.itemId,modal.dataset.kind);
  const button=modal.querySelector('[data-action="add-configured-to-cart"]')||modal.querySelector('[data-action="confirm-workshop-upgrade"]')||modal.querySelector('[data-action="craft-configured-workshop-item"]');
  if(button){
    const isWorkshopMode = typeof arsenalInitialState !== 'undefined' && arsenalInitialState.mode === 'workshop';
    const isEnchantment = modal.dataset.kind === 'enchantments';
    const targetInstId = modal.dataset.upgradeTargetInstanceId;

    let hasSelection = false;
    let missingSelectionReason = '';

    if (targetInstId) {
      const existingEntry = Array.isArray(backpackItems) ? backpackItems.find(b => b.instanceId === targetInstId) : null;
      if (isEnchantment) {
        const origCount = (existingEntry?.enchantments || []).length;
        const newCount = (draft?.enchantments || []).length;
        hasSelection = newCount > origCount;
        if (!hasSelection) missingSelectionReason = 'Selecione ao menos um novo encantamento para continuar.';
      } else {
        const origCount = (existingEntry?.improvements || existingEntry?.melhorias || []).length;
        const newCount = (draft?.improvements || []).length;
        const matChanged = Boolean(draft?.material && draft.material !== existingEntry?.material);
        hasSelection = newCount > origCount || matChanged;
        if (!hasSelection) missingSelectionReason = 'Selecione ao menos uma melhoria para continuar.';
      }
    } else if (isWorkshopMode) {
      if (isEnchantment) {
        hasSelection = Array.isArray(draft?.enchantments) && draft.enchantments.length > 0;
        if (!hasSelection) missingSelectionReason = 'Selecione ao menos um encantamento para continuar.';
      } else {
        hasSelection = (Array.isArray(draft?.improvements) && draft.improvements.length > 0) || Boolean(draft?.material);
        if (!hasSelection) missingSelectionReason = 'Selecione ao menos uma melhoria para continuar.';
      }
    } else {
      if (isEnchantment) {
        hasSelection = (Array.isArray(draft?.enchantments) && draft.enchantments.length > 0) || (Array.isArray(draft?.improvements) && draft.improvements.length > 0);
        if (!hasSelection) missingSelectionReason = 'Selecione ao menos um encantamento para adicionar ao carrinho.';
      } else {
        hasSelection = (Array.isArray(draft?.improvements) && draft.improvements.length > 0) || Boolean(draft?.material) || (Array.isArray(draft?.enchantments) && draft.enchantments.length > 0);
        if (!hasSelection) missingSelectionReason = 'Selecione ao menos uma melhoria para adicionar ao carrinho.';
      }
    }

    if (!status.complete) {
      button.disabled = true;
      button.title = 'Escolha qual material especial será usado.';
    } else if (!hasSelection) {
      button.disabled = true;
      button.title = missingSelectionReason;
    } else {
      button.disabled = false;
      button.title = '';
    }

    if(modal.dataset.upgradeTargetInstanceId){
      button.dataset.action='confirm-workshop-upgrade';
      button.dataset.instanceId=modal.dataset.upgradeTargetInstanceId;
      button.dataset.itemId=modal.dataset.itemId;
      button.textContent=isEnchantment ? 'Adicionar Encantamento' : 'Adicionar Melhoria';
    }else if(isWorkshopMode){
      button.dataset.action='craft-configured-workshop-item';
      button.dataset.itemId=modal.dataset.itemId;
      button.textContent=isEnchantment ? 'Forjar Encantado' : 'Forjar Superior';
    }
  }
  if(typeof arsenalInitialState !== 'undefined' && arsenalInitialState.mode === 'initial'){
    const actions = modal.querySelector('.modal-actions');
    if(actions) actions.remove();
  }
}

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

  const typeMeta = TYPE_META[item.tipo] || { label: humanize(item.tipo).toUpperCase(), icon: '' };
  const category = item.categoriaId || 'sem_categoria';
  const displayName = configuredItemName(instance, originalItem);
  const book = item._books && item._books[0] || item.livroOrigemId || 'basico';
  const bookLabel = (BOOK_LABELS[book] || humanize(book)).toUpperCase();

  const improveChoices = (instance.improvements || []).map(function(choice) {
    if (choice.id === 'material_especial' && choice.materialId) {
      const mat = materialById.get(choice.materialId);
      return (mat ? mat.nome : humanize(choice.materialId)).replace(/_/g, ' ');
    }
    const imp = improvementById.get(choice.id || choice);
    return (imp ? imp.nome : humanize(choice.id || choice)).replace(/_/g, ' ');
  }).filter(Boolean);

  const enchantChoices = (instance.enchantments || []).map(function(id) {
    const enc = enchantmentById.get(id);
    return (enc ? enc.nome : humanize(id)).replace(/_/g, ' ');
  }).filter(Boolean);

  let currentUpgradesHtml = '';
  if (improveChoices.length || enchantChoices.length) {
    currentUpgradesHtml = '<div class="info-block" style="border:1px solid var(--border);background:var(--surface2);font-size:0.8rem;padding:8px 10px;">' +
      (improveChoices.length ? '<div style="color:var(--gold2);margin-bottom:3px;"><strong>Melhorias (' + improveChoices.length + '/4):</strong> ' + escapeHtml(improveChoices.join(' · ')) + '</div>' : '') +
      (enchantChoices.length ? '<div style="color:var(--gold2);"><strong>Encantos:</strong> ' + escapeHtml(enchantChoices.join(' · ')) + '</div>' : '') +
    '</div>';
  }

  let propTags = '';
  let propDescs = '';
  if (item.arma && item.arma.propriedadesIds && item.arma.propriedadesIds.length) {
    propTags = '<div class="properties-row">' +
      item.arma.propriedadesIds.map(function(p) {
        return '<span class="property-tag">' + escapeHtml(String(PROPERTY_LABELS[p] || p).toUpperCase()) + '</span>';
      }).join('') +
    '</div>';
    item.arma.propriedadesIds.forEach(function(p) {
      const desc = typeof WEAPON_PROP_DESCRIPTIONS !== 'undefined' ? WEAPON_PROP_DESCRIPTIONS[p] : null;
      if (desc) propDescs += '<div class="info-block info-grant"><p>' + escapeHtml(desc) + '</p></div>';
    });
  }

  const texts = item.textos || {};
  let infoBlocks = '';
  if (texts.habilidade && (!item.arma || !item.arma.propriedadesIds || !item.arma.propriedadesIds.length)) {
    infoBlocks += '<div class="info-block info-grant"><span class="info-block-title">HABILIDADE CONCEDIDA</span><p>' + escapeHtml(texts.habilidade) + '</p></div>';
  }
  if (texts.variavel) {
    infoBlocks += '<div class="info-block info-rule"><span class="info-block-title">REGRAS E USO</span><p>' + escapeHtml(texts.variavel) + '</p></div>';
  }
  if (texts.descricao) {
    infoBlocks += '<p class="description"><span class="description-label">Descrição</span>' + escapeHtml(texts.descricao) + '</p>';
  }

  const isEngenhoca = Boolean(instance.isEngenhoca || item.tipo === 'engenhoca');
  const secBtnStyle = 'padding:4px 10px;font-size:0.72rem;background:var(--surface2);border:1px solid var(--border);color:var(--text);border-radius:6px;cursor:pointer;display:inline-flex;align-items:center;gap:4px;';
  let bottomSecondaryActions = '';

  const packageSize = ammoPackageSize(item);
  if (packageSize) {
    const maximum = instance.quantity * packageSize;
    const remaining = Math.max(0, Math.min(maximum, Number(instance.ammoRemaining) || 0));
    bottomSecondaryActions += '<button type="button" data-action="use-ammo" style="' + secBtnStyle + '"' + (remaining <= 0 ? ' disabled' : '') + '>Disparar ' + remaining + '</button>';
  }

  const coinIcon = window.IconesForja ? window.IconesForja.get('coin', 'icon-sm') : '<svg class="forja-svg icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"></circle><path d="M18.09 10.37A6 6 0 1 1 10.34 18"></path><path d="M7 6h1v4"></path><path d="m16.71 13.88.7.71-2.82 2.82"></path></svg>';
  if (isEngenhoca) {
    bottomSecondaryActions += '<button type="button" data-action="destroy-contraption" data-instance-id="' + escapeHtml(instance.instanceId) + '" style="' + secBtnStyle + '">Destruir</button>';
  }

  const hammerIcon = window.IconesForja ? window.IconesForja.get('hammer', 'icon-sm') : '<svg class="forja-svg icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 12-8.5 8.5a2.12 2.12 0 1 1-3-3L11 9"></path><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"></path><line x1="9" y1="15" x2="15" y2="9"></line></svg>';
  const sparklesIcon = window.IconesForja ? window.IconesForja.get('sparkles', 'icon-sm') : '<svg class="forja-svg icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"></path></svg>';
  const itemAcceptsImps = !isNamedFixedMagicItem(item) && !(typeof isAparatoItem === 'function' && isAparatoItem(item)) && (typeof improvements !== 'undefined' ? improvements : []).some(choice => typeof improvementAppliesToItem === 'function' && improvementAppliesToItem(choice, item));
  const itemAcceptsEncs = !isNamedFixedMagicItem(item) && !(typeof isAparatoItem === 'function' && isAparatoItem(item)) && (typeof enchantments !== 'undefined' ? enchantments : []).some(choice => typeof enchantmentAppliesToItem === 'function' && enchantmentAppliesToItem(choice, item));
  let upgradeActions = '';
  if (itemAcceptsImps || itemAcceptsEncs) {
    upgradeActions = '<div style="display:flex;gap:8px;">' +
      (itemAcceptsImps ? '<button type="button" class="square-action-btn" data-action="workshop-upgrade-existing" data-kind="improvements" data-item-id="' + escapeHtml(item.id) + '" data-instance-id="' + escapeHtml(instance.instanceId) + '" title="Aprimorar (Forjar)" aria-label="Aprimorar">' + hammerIcon + '</button>' : '') +
      (itemAcceptsEncs ? '<button type="button" class="square-action-btn" data-action="workshop-upgrade-existing" data-kind="enchantments" data-item-id="' + escapeHtml(item.id) + '" data-instance-id="' + escapeHtml(instance.instanceId) + '" title="Encantar" aria-label="Encantar" style="color:var(--gold2);">' + sparklesIcon + '</button>' : '') +
    '</div>';
  }

  return ForjaUnificada.renderCardInventario({
    id:instance.instanceId,itemId:item.id,tipo:item.tipo||'item',titulo:displayName,
    tipoLabel:typeMeta.label,categoria:CATEGORY_LABELS[category]||humanize(category),livro:bookLabel,iconeHtml:typeMeta.icon,
    statsHtml:isEngenhoca?'':itemStatsHtmlBlock(item),propriedadesHtml:propTags,
    corpoHtml:propDescs+infoBlocks+currentUpgradesHtml,extraHtml:specificMagicHtml(instance,item),
    melhoriasHtml:upgradeActions,acoesHtml:bottomSecondaryActions
  });
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
  return '<div class="backpack-compact-entry" data-instance-id="' + escapeHtml(instance.instanceId) + '"><div class="backpack-compact-row" role="button" tabindex="0" aria-label="Ver detalhes de ' + escapeHtml(configuredItemName(instance, originalItem)) + '" aria-expanded="' + String(isOpen) + '">' +
    '<button class="compact-open-button" type="button" data-action="open-details" aria-expanded="' + String(isOpen) + '"><strong>' +
    escapeHtml(configuredItemName(instance, originalItem)) + '</strong></button><span class="compact-metric metric-quantity"><small>Qtd.</small><strong>' + instance.quantity +
    '</strong></span>' + ammo + '<span class="compact-metric metric-spaces"><small>Espaços</small><strong>' + formatSpaces(totalSpaces) +
    '</strong></span><div class="compact-actions" style="display:flex;gap:4px;align-items:center;">' +
      '<button class="compact-action-btn compact-details-btn" type="button" data-action="open-details" title="Ver detalhes de ' + escapeHtml(configuredItemName(instance, originalItem)) + '">' + (window.IconesForja ? window.IconesForja.get('link', 'icon-sm') : '🔗') + '</button>' +
      '<button class="compact-action-btn compact-remove" type="button" data-action="remove" aria-label="Remover ' + escapeHtml(configuredItemName(instance, originalItem)) + ' da mochila">×</button>' +
    '</div></div>' +
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
  if (backpackViewCount) backpackViewCount.textContent = String(totals.quantity);
  if (clearBackpack) clearBackpack.disabled = totals.entries === 0 || !activeCharacterProfile();
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
  try { forjaArsenalStorage.setItem(BACKPACK_MODE_STORAGE_KEY, state.backpackMode); } catch (error) {}
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
  const effective = typeof effectiveItemForOptions === 'function' ? effectiveItemForOptions(item, { itemId, options, improvements: configuredImprovements, enchantments: configuredEnchantments }) : item;
  const vInfo = typeof entryValueInfo === 'function' ? entryValueInfo({ itemId, quantity: 1, options, improvements: configuredImprovements, enchantments: configuredEnchantments }, effective) : null;
  const finalPrice = vInfo?.unitKnown ?? Number(item.preco?.valor || 0);

  if (instance) {
    const accepted = Math.min(amount, 9999 - instance.quantity);
    if (packageSize) instance.ammoRemaining = Math.min((instance.quantity + accepted) * packageSize, (Number(instance.ammoRemaining) || 0) + accepted * packageSize);
    instance.quantity += accepted;
    instance.customPrice = finalPrice;
    instance.price = finalPrice;
    instance.preco = { valor: finalPrice, moeda: item.preco?.moeda || 'T$' };
    instance.unitValue = finalPrice;
  } else {
    const quantity = Math.min(9999, amount);
    const newEntry = {
      instanceId: createInstanceId(), itemId: itemId, quantity: quantity,
      acquisition: acquisition || {source: 'unknown'},
      displayName: item.nome,
      options: options,
      ammoRemaining: packageSize ? quantity * packageSize : undefined,
      improvements: configuredImprovements, enchantments: configuredEnchantments,
      customPrice: finalPrice,
      price: finalPrice,
      preco: { valor: finalPrice, moeda: item.preco?.moeda || 'T$' },
      unitValue: finalPrice
    };
    if (typeof configuredItemName === 'function') {
      newEntry.displayName = configuredItemName(newEntry, item);
    }
    backpackItems.push(newEntry);
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

  if (typeof postArsenal === 'function') {
    postArsenal('close-shop');
  }
  setTimeout(function() {
    if (window.parent && window.parent !== window) {
      try { window.parent.postMessage({ type: 'close-shop' }, '*'); } catch (e) {}
    } else {
      window.location.href = 'ficha.html';
    }
  }, 400);
}
