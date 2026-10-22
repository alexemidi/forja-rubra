
if (characterButton) characterButton.hidden = true;
if (strengthInput) {
  strengthInput.disabled = true;
  strengthInput.readOnly = true;
}
let initialChoice=null;
let initialChoiceBranchId=null;
let selectedCraftOffice=null;
let selectedCandidate=null;
let pendingOperation=null;
let shopFilters=null;
let craftingMode=false;
const baseApplyFilters=applyFilters;
const baseSyncCartUI=syncCartUI;
syncCartUI=function(){
  baseSyncCartUI();
  postArsenal('cart-count',{count:cartItems.reduce((sum,entry)=>sum+entry.quantity,0)});
  const chk=document.getElementById('checkoutCart');
  if(chk&&!document.getElementById('checkoutReward')){
    const btn=document.createElement('button');
    btn.type='button';btn.id='checkoutReward';btn.className='secondary-button';
    btn.style.marginLeft='8px';
    btn.textContent='Recompensa (T$ 0)';
    btn.title='Adicionar itens à mochila como recompensa grátis, sem gastar tibares';
    chk.parentNode?.insertBefore(btn,chk);
  }
};
const advancedFilters=advancedFiltersButton;
const baseSyncAdvancedFiltersButton=syncAdvancedFiltersButton;
syncAdvancedFiltersButton=function(forcedLabel){
  if(!forcedLabel&&typeof arsenalInitialState!=='undefined'&&arsenalInitialState.mode==='initial'&&initialChoice){
    const effective=typeof effectiveInitialChoice==='function'?effectiveInitialChoice():initialChoice;
    if(effective?.id==='armor'||initialChoice?.id==='armor'){
      if(advancedFilters)advancedFilters.hidden=true;
      return;
    }
    if(effective?.isBudgetGrant||initialChoice?.isBudgetGrant){
      if(advancedFilters)advancedFilters.hidden=false;
      baseSyncAdvancedFiltersButton();
      return;
    }
    syncInitialFilterSummary();
    return;
  }
  baseSyncAdvancedFiltersButton(forcedLabel);
};
const shopActions = document.getElementById('embeddedShopActions') || document.querySelector('.embedded-shop-actions') || document.createElement('nav');
document.head.insertAdjacentHTML('beforeend','<style>.backpack-compact-row{grid-template-columns:minmax(0,1fr) auto auto auto 32px 32px!important}.backpack-compact-row [data-action="sell-general"]{grid-column:5!important}.backpack-compact-row [data-action="remove"]{grid-column:6!important}.backpack-compact-row [data-action="sell-general"],.backpack-compact-row [data-action="remove"]{position:static!important;margin:0!important}</style>');
if (!shopActions.id) shopActions.id = 'embeddedShopActions';
shopActions.className='embedded-shop-actions';
if (!shopActions.innerHTML.trim()) {
  shopActions.innerHTML='<label><span data-money-label>Dinheiro inicial · T$</span> <input data-money type="number" min="0" step="0.01" placeholder="0" aria-label="Dinheiro inicial em tibares"><span data-balance></span></label><button type="button" data-shop-view="catalog">Loja</button><button type="button" data-shop-cart>Carrinho <span data-shop-cart-count>0</span></button><button type="button" data-shop-view="backpack">Mochila</button>';
}
const itemCardBeforeCrafting=itemCard;
itemCard=function(item){
  let html=itemCardBeforeCrafting(item);
  const isWorkshop = typeof arsenalInitialState !== 'undefined' && arsenalInitialState.mode === 'workshop';
  if(isWorkshop){
    const fullPrice = Number(item.preco?.valor ?? item.price ?? 0);
    // @ts-ignore
    const rules = typeof RegrasManufatura !== 'undefined' ? RegrasManufatura : null;
    const rawCost = rules ? rules.custoMateriaPrima(fullPrice) : Math.ceil(fullPrice / 3);
    const isArmeiroSection = arsenalInitialState?.workshopSection === 'armeiro';
    const isReadOnly = Boolean(arsenalInitialState?.workshopReadOnly) && !isArmeiroSection;

    let availableFunds = Number(arsenalInitialState?.funds || 0);
    if (availableFunds <= 0 && typeof obterFundosIniciaisHeroi === 'function') {
      const ref = obterFundosIniciaisHeroi();
      if (ref > 0) {
        if (arsenalInitialState) arsenalInitialState.funds = ref;
        availableFunds = ref;
      }
    }
    const canAfford = availableFunds >= rawCost;

    if (isReadOnly) {
      const readOnlyBtn = '<button class="button workshop-btn-readonly" type="button" disabled style="opacity:0.65;cursor:not-allowed;width:100%;min-height:32px;" title="Oficina em modo de consulta geral.">Apenas Consulta</button>';
      return html.replace(/<div class="card-actions">[\s\S]*?<\/div>/, '<div class="card-actions workshop-catalog-actions">' + readOnlyBtn + '</div>');
    }

    const isFixedMagic = typeof isNamedFixedMagicItem === 'function' && isNamedFixedMagicItem(item);
    const isSpecificMagic = typeof isSpecificMagicItem === 'function' && isSpecificMagicItem(item);

    const wsSection = arsenalInitialState?.workshopSection || (typeof state !== 'undefined' ? state.oficinaFilter : '') || '';
    const isAlquimia = wsSection === 'alquimista';
    const isArmeiro = wsSection === 'armeiro';
    const craftVerb = isAlquimia ? 'Preparar' : (isArmeiro ? 'Forjar' : 'Fabricar');
    const mundaneBtnText = isAlquimia ? 'Preparar Alquímico' : (isArmeiro ? 'Forjar Mundano' : 'Fabricar Mundano');
    const superiorBtnText = `${craftVerb} Superior`;
    const enchantedBtnText = `${craftVerb} Encantado`;

    // 1. Mundano
    let mundaneBtn = '';
    if (!canAfford) {
      mundaneBtn = '<button class="button workshop-btn-mundane is-disabled" type="button" disabled style="opacity:0.5;cursor:not-allowed;" title="Saldo insuficiente para matéria-prima (T$ ' + rawCost + ')">' + mundaneBtnText + '</button>';
    } else {
      mundaneBtn = '<button class="button workshop-btn-mundane" type="button" data-action="craft-item" data-item-id="' + escapeHtml(item.id) + '" title="' + craftVerb + ' item mundano por ⅓ do preço (T$ ' + rawCost + ')">' + mundaneBtnText + '</button>';
    }

    // 2. Superior (com melhorias)
    const imps = typeof improvements !== 'undefined' ? improvements : [];
    const hasImprovements = imps.some(choice => typeof improvementAppliesToItem === 'function' && improvementAppliesToItem(choice, item));
    const maxImps = typeof getMaxAllowedImprovements === 'function' ? getMaxAllowedImprovements() : 0;
    let superiorBtn = '';

    const isLiturgical = typeof isLiturgicalItem === 'function' && isLiturgicalItem(item);
    if (hasImprovements && !isFixedMagic && !isSpecificMagic && !isLiturgical && !item.magico && !item.liturgico && !item.especifico) {
      if (maxImps <= 0) {
        superiorBtn = '<button class="button workshop-btn-superior is-disabled" type="button" disabled style="opacity:0.5;cursor:not-allowed;" title="Requer o poder Fabricar Item Superior (Inventor nível 2+).">' + superiorBtnText + '</button>';
      } else if (!canAfford) {
        superiorBtn = '<button class="button workshop-btn-superior is-disabled" type="button" disabled style="opacity:0.5;cursor:not-allowed;" title="Saldo insuficiente para matéria-prima">' + superiorBtnText + '</button>';
      } else {
        superiorBtn = '<button class="button workshop-btn-superior" type="button" data-action="configure-purchase" data-kind="improvements" data-item-id="' + escapeHtml(item.id) + '" title="' + craftVerb + ' item superior com melhorias">' + superiorBtnText + '</button>';
      }
    }

    // 3. Encantado (com propriedades mágicas)
    const encs = typeof enchantments !== 'undefined' ? enchantments : [];
    const hasEnchantments = encs.some(enc => typeof enchantmentAppliesToItem === 'function' && enchantmentAppliesToItem(enc, item));
    const maxEncs = typeof getMaxAllowedEnchantments === 'function' ? getMaxAllowedEnchantments() : 0;
    const crafting = arsenalInitialState?.crafting || {};
    const invLevel = Number(crafting.inventorLevel) || (crafting.hasInventorClass ? Number(arsenalInitialState?.level) : (crafting.magic ? (crafting.magic === 3 ? 17 : (crafting.magic === 2 ? 13 : 9)) : 0));
    let magicLevelMet = true;
    let magicLevelReq = 9;
    let magicCatLabel = 'menor';
    if (isSpecificMagic) {
      const magCat = String(item.magico?.categoriaId || '').toLowerCase();
      if (magCat.includes('maior')) {
        magicLevelReq = 17;
        magicCatLabel = 'maior';
      } else if (magCat.includes('med') || magCat.includes('méd')) {
        magicLevelReq = 13;
        magicCatLabel = 'médio';
      } else {
        magicLevelReq = 9;
        magicCatLabel = 'menor';
      }
      magicLevelMet = invLevel >= magicLevelReq;
    }

    let enchantedBtn = '';
    if (isSpecificMagic) {
      if (!magicLevelMet) {
        enchantedBtn = '<button class="button workshop-btn-enchanted is-disabled" type="button" disabled style="opacity:0.5;cursor:not-allowed;" title="Fabricar item específico ' + magicCatLabel + ' requer Inventor nível ' + magicLevelReq + '+.">Requer Nv ' + magicLevelReq + '</button>';
      } else if (!canAfford) {
        enchantedBtn = '<button class="button workshop-btn-enchanted is-disabled" type="button" disabled style="opacity:0.5;cursor:not-allowed;" title="Saldo insuficiente para matéria-prima (T$ ' + rawCost + ')">Saldo insuficiente</button>';
      } else {
        enchantedBtn = '<button class="button workshop-btn-enchanted" type="button" data-action="craft-item" data-item-id="' + escapeHtml(item.id) + '" title="' + craftVerb + ' item mágico por ⅓ do preço (T$ ' + rawCost + ')">' + enchantedBtnText + '</button>';
      }
    } else if (hasEnchantments && !isFixedMagic) {
      if (maxEncs <= 0 || invLevel < 9) {
        enchantedBtn = '<button class="button workshop-btn-enchanted is-disabled" type="button" disabled style="opacity:0.5;cursor:not-allowed;" title="Requer o poder Fabricar Item Mágico (Inventor nível 9+).">' + enchantedBtnText + '</button>';
      } else if (!canAfford) {
        enchantedBtn = '<button class="button workshop-btn-enchanted is-disabled" type="button" disabled style="opacity:0.5;cursor:not-allowed;" title="Saldo insuficiente para matéria-prima">' + enchantedBtnText + '</button>';
      } else {
        enchantedBtn = '<button class="button workshop-btn-enchanted" type="button" data-action="configure-purchase" data-kind="enchantments" data-item-id="' + escapeHtml(item.id) + '" title="' + craftVerb + ' item encantado com propriedades mágicas">' + enchantedBtnText + '</button>';
      }
    }

    const workshopButtons = superiorBtn + enchantedBtn + mundaneBtn;
    return html.replace(/<div class="card-actions">[\s\S]*?<\/div>/, '<div class="card-actions workshop-catalog-actions">' + workshopButtons + '</div>');
  }
  if(craftingMode&&arsenalInitialState?.mode!=='initial'){
    const isSpecificMagic = typeof isSpecificMagicItem === 'function' && isSpecificMagicItem(item);
    if (isSpecificMagic) {
      const crafting = arsenalInitialState?.crafting || {};
      const invLevel = Number(crafting.inventorLevel) || (crafting.hasInventorClass ? Number(arsenalInitialState?.level) : (crafting.magic ? (crafting.magic === 3 ? 17 : (crafting.magic === 2 ? 13 : 9)) : 0));
      const magCat = String(item.magico?.categoriaId || '').toLowerCase();
      let magicLevelReq = 9;
      let magicCatLabel = 'menor';
      if (magCat.includes('maior')) {
        magicLevelReq = 17;
        magicCatLabel = 'maior';
      } else if (magCat.includes('med') || magCat.includes('méd')) {
        magicLevelReq = 13;
        magicCatLabel = 'médio';
      }
      if (invLevel < magicLevelReq) {
        return html.replace(/<button class="acquire-button"[^>]*data-action="add-to-cart"[\s\S]*?<\/button>/, '<button class="acquire-button" type="button" disabled style="opacity:0.5;cursor:not-allowed;" title="Requer Inventor nível ' + magicLevelReq + '+ para fabricar itens mágicos ' + magicCatLabel + 's.">Requer Nível ' + magicLevelReq + ' (' + magicCatLabel + ')</button>');
      }
    }
    const allowed=['arma','armadura','escudo'].includes(item.tipo)&&(!isNamedFixedMagicItem(item)||arsenalInitialState.crafting?.magic);
    if(!allowed)return html.replace(/<button class="acquire-button"[^>]*data-action="add-to-cart"[\s\S]*?<\/button>/,'<button class="acquire-button" type="button" disabled>Não fabricável com Ofício (armeiro)</button>');
    return html.replace('data-action="add-to-cart"','data-action="craft-item"').replace(' Adicionar ao carrinho','<span aria-hidden="true">Forjar</span> Fabricar por ⅓ do preço');
  }
  if(typeof arsenalInitialState!=='undefined'&&arsenalInitialState.mode==='initial'){
    const isCand=selectedCandidate?.itemId===item.id;
    if(isCand){
      html=html.replace('class="item-card','class="item-card candidate');
    }
    const choice = (typeof effectiveInitialChoice === 'function' ? effectiveInitialChoice() : null) || arsenalInitialState.choice;
    if (choice?.isBudgetGrant) {
      const isLiturgical = typeof isLiturgicalItem === 'function' && isLiturgicalItem(item);
      const isSpecial = isNamedFixedMagicItem(item) || isSpecificMagicItem(item) || isLiturgical || item.magico || item.liturgico || item.especifico;
      if (isSpecial) {
        html = html.replace(/<button class="acquire-button"[^>]*data-action="add-to-cart"[\s\S]*?<\/button>/,
          '<button class="acquire-button is-disabled" type="button" disabled style="opacity:0.45;cursor:not-allowed;background:#1e293b;border-color:#475569;color:#94a3b8;" title="Itens específicos e litúrgicos não podem ser escolhidos como espólio/orçamento.">Indisponível</button>');
        html = html.replace(/<button class="upgrade-purchase-button[^>]*>[\s\S]*?<\/button>/g, '');
        return html;
      }
      const hasUnlimitedBudget = Boolean(choice.unlimitedBudget || choice.maxBudget === Infinity);
      const maxBudget = hasUnlimitedBudget ? Infinity : Number(choice.maxBudget || 1000);
      const basePrice = Number(item.preco?.valor ?? item.price ?? 0);
      if (!hasUnlimitedBudget && Number.isFinite(maxBudget) && basePrice > maxBudget) {
        const diff = basePrice - maxBudget;
        const currentFunds = Number(arsenalInitialState.funds || 0);
        if (currentFunds >= diff) {
          const titleMsg = 'Excede o orçamento em ' + formatCurrencyValue(diff, 'T$') + ' (diferença paga com dinheiro inicial mediante permissão do mestre)';
          html = html.replace(/<button class="acquire-button"[^>]*data-action="add-to-cart"[\s\S]*?<\/button>/,
            '<button class="acquire-button" type="button" data-action="add-to-cart" data-item-id="' + escapeHtml(item.id) + '" title="' + escapeHtml(titleMsg) + '">' + (isCand ? 'Item Selecionado' : 'Selecionar item') + '</button>');
          return html;
        } else {
          const titleMsg = 'Excede o orçamento em ' + formatCurrencyValue(diff, 'T$') + ' e seu saldo inicial (' + formatCurrencyValue(currentFunds, 'T$') + ') não cobre a diferença';
          html = html.replace(/<button class="acquire-button"[^>]*data-action="add-to-cart"[\s\S]*?<\/button>/,
            '<button class="acquire-button is-disabled" type="button" disabled style="opacity:0.45;cursor:not-allowed;background:#1e293b;border-color:#475569;color:#94a3b8;" title="' + escapeHtml(titleMsg) + '">Indisponível</button>');
          html = html.replace(/<button class="upgrade-purchase-button[^>]*>[\s\S]*?<\/button>/g, '');
          return html;
        }
      }
    } else {
      html = html.replace(/<button class="upgrade-purchase-button[^>]*>[\s\S]*?<\/button>/g, '');
    }
    return html.replace(' Adicionar ao carrinho', isCand ? 'Item Selecionado' : 'Selecionar item');
  }
  return html;
};
const basePurchaseUpgradeButtons = typeof purchaseUpgradeButtons === 'function' ? purchaseUpgradeButtons : null;
purchaseUpgradeButtons = function(item) {
  if (typeof arsenalInitialState !== 'undefined' && arsenalInitialState.mode === 'initial') {
    const effectiveChoice = (typeof effectiveInitialChoice === 'function' ? effectiveInitialChoice() : null) || arsenalInitialState.choice;
    if (effectiveChoice?.isBudgetGrant) {
      const isLiturgical = typeof isLiturgicalItem === 'function' && isLiturgicalItem(item);
      if (isNamedFixedMagicItem(item) || isSpecificMagicItem(item) || isLiturgical || item.magico || item.liturgico || item.especifico) return '';
      const basePrice = Number(item.preco?.valor || 0);
      const hasUnlimitedBudget = Boolean(effectiveChoice?.unlimitedBudget || effectiveChoice?.maxBudget === Infinity);
      const maxBudget = hasUnlimitedBudget ? Infinity : Number(effectiveChoice.maxBudget || 1000);
      const imps = typeof improvements !== 'undefined' ? improvements : [];
      const hasImprovements = imps.some(choice => improvementAppliesToItem(choice, item));
      if (!hasImprovements) return '';
      const hammerIcon = window.IconesForja ? window.IconesForja.get('hammer', 'icon-sm') : '<svg class="forja-svg icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 12-8.5 8.5a2.12 2.12 0 1 1-3-3L11 9"></path><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"></path><line x1="9" y1="15" x2="15" y2="9"></line></svg>';
      if (!hasUnlimitedBudget && Number.isFinite(maxBudget) && basePrice + 300 > maxBudget) {
        const diff = (basePrice + 300) - maxBudget;
        const currentFunds = Number(arsenalInitialState.funds || 0);
        if (currentFunds < diff) {
          const titleMsg = 'Adicionar uma melhoria excederia o orçamento e seu saldo inicial não cobre a diferença (' + formatCurrencyValue(diff, 'T$') + ')';
          return '<button class="upgrade-purchase-button is-disabled" type="button" disabled style="opacity:0.45;cursor:not-allowed" title="' + escapeHtml(titleMsg) + '" aria-label="' + escapeHtml(titleMsg) + '">' + hammerIcon + '</button>';
        }
      }
      const titleBudget = Number.isFinite(maxBudget) ? ' (orçamento: ' + formatCurrencyValue(maxBudget, 'T$') + ')' : '';
      return '<button class="upgrade-purchase-button" type="button" data-action="configure-purchase" data-kind="improvements" data-item-id="' + escapeHtml(item.id) + '" title="Adicionar melhorias' + titleBudget + '" aria-label="Adicionar melhorias">' + hammerIcon + '</button>';
    }
    return '';
  }
  if (typeof arsenalInitialState !== 'undefined' && arsenalInitialState.mode === 'workshop') {
    return '';
  }
  if (basePurchaseUpgradeButtons) return basePurchaseUpgradeButtons(item);
  return '';
};
function syncBudgetUpgradeModalState(itemId) {
  const modal = document.getElementById('purchaseUpgradeModal');
  if (!modal) return;
  const effectiveChoice = typeof effectiveInitialChoice === 'function' ? effectiveInitialChoice() : null;
  const hasUnlimitedBudget = Boolean(effectiveChoice?.unlimitedBudget || effectiveChoice?.maxBudget === Infinity);
  const maxBudget = hasUnlimitedBudget ? Infinity : Number(effectiveChoice?.maxBudget || 1000);
  const draft = purchaseDraft(itemId);
  const original = itemById.get(itemId);
  if (!original || !draft) return;

  const note = modal.querySelector('.budget-modal-note');
  if (note) note.remove();
  const currentCost = entryValueInfo(draft, effectiveItemForOptions(original, draft)).unitKnown;
  const funds = Number(arsenalInitialState?.funds || 0);

  // 1. Atualizar botões de melhoria na barra lateral moderna
  modal.querySelectorAll('button[data-action="select-sidebar-improvement"]').forEach(button => {
    const impId = button.dataset.impId;
    if (!impId) return;
    const projected = JSON.parse(JSON.stringify(draft));
    if (!projected.improvements.some(e => e.id === impId)) {
      projected.improvements.push({ id: impId, materialId: '' });
    }
    const projCost = entryValueInfo(projected, effectiveItemForOptions(original, projected)).unitKnown;
    if (!hasUnlimitedBudget && Number.isFinite(maxBudget) && projCost > maxBudget) {
      const diff = projCost - maxBudget;
      if (funds < diff) {
        button.disabled = true;
        button.title = 'Esta melhoria ultrapassa o orçamento disponível de ' + formatCurrencyValue(maxBudget, 'T$') + ' e seu saldo não cobre a diferença (' + formatCurrencyValue(diff, 'T$') + ').';
        button.textContent = 'Excede ' + formatCurrencyValue(maxBudget, 'T$');
        button.style.opacity = '0.5';
        const parentItem = button.closest('.sidebar-improvement-item');
        if (parentItem) parentItem.classList.add('is-blocked');
      } else {
        button.disabled = false;
        button.title = 'Ultrapassa o orçamento em ' + formatCurrencyValue(diff, 'T$') + ' (diferença paga com saldo inicial mediante permissão do mestre).';
        button.textContent = 'Adicionar (+ saldo)';
        button.style.opacity = '1';
        const parentItem = button.closest('.sidebar-improvement-item');
        if (parentItem) parentItem.classList.remove('is-blocked');
      }
    }
  });

  // 2. Atualizar cards de material especial modernos
  modal.querySelectorAll('[data-action="select-material-card"]').forEach(card => {
    const matId = card.dataset.materialId;
    if (!matId) return;
    const projected = JSON.parse(JSON.stringify(draft));
    let choice = projected.improvements.find(entry => entry.id === 'material_especial');
    if (!choice) {
      choice = { id: 'material_especial', materialId: matId };
      projected.improvements.push(choice);
    } else {
      choice.materialId = matId;
    }
    const projCost = entryValueInfo(projected, effectiveItemForOptions(original, projected)).unitKnown;
    if (!hasUnlimitedBudget && Number.isFinite(maxBudget) && projCost > maxBudget) {
      const diff = projCost - maxBudget;
      if (funds < diff) {
        card.dataset.disabledBudget = 'true';
        card.style.opacity = '0.4';
        card.style.cursor = 'not-allowed';
        card.title = 'Este material ultrapassa o orçamento disponível de ' + formatCurrencyValue(maxBudget, 'T$') + ' e seu saldo não cobre a diferença (' + formatCurrencyValue(diff, 'T$') + ').';
        let badge = card.querySelector('.badge');
        if (badge && !badge.textContent.includes('(excede)')) {
          badge.textContent += ' (excede)';
          badge.style.color = '#ff6b6b';
        }
      } else {
        delete card.dataset.disabledBudget;
        card.style.opacity = '1';
        card.style.cursor = 'pointer';
        card.title = 'Ultrapassa o orçamento em ' + formatCurrencyValue(diff, 'T$') + ' (diferença paga com saldo inicial mediante permissão do mestre).';
      }
    } else {
      delete card.dataset.disabledBudget;
    }
  });

  // 3. Fallbacks para selects legados caso ainda existam
  modal.querySelectorAll('select[data-action="improvement"]').forEach(select=>{
    const slot=Number(select.dataset.slot);
    [...select.options].forEach(option=>{
      if(!option.value)return;
      const projected=JSON.parse(JSON.stringify(draft));
      const choices=(projected.improvements||[]).slice();
      choices[slot]={id:option.value,materialId:choices[slot]?.id===option.value?choices[slot].materialId:''};
      projected.improvements=choices.filter(Boolean);
      const val = entryValueInfo(projected,effectiveItemForOptions(original,projected)).unitKnown;
      const exceeds=!hasUnlimitedBudget && Number.isFinite(maxBudget) && val>maxBudget;
      const diff = exceeds ? val - maxBudget : 0;
      option.disabled = exceeds && funds < diff;
      if(exceeds) option.title='Esta melhoria ultrapassa o limite de '+formatCurrencyValue(maxBudget,'T$')+(funds >= diff ? ' (coberto por saldo)' : '.');
    });
  });
  modal.querySelectorAll('select[data-action="material"]').forEach(select=>{
    [...select.options].forEach(option=>{
      if(!option.value)return;
      const projected=JSON.parse(JSON.stringify(draft));
      const choice=(projected.improvements||[]).find(entry=>entry.id==='material_especial');
      if(choice)choice.materialId=option.value;
      const val = entryValueInfo(projected,effectiveItemForOptions(original,projected)).unitKnown;
      const exceeds=!hasUnlimitedBudget && Number.isFinite(maxBudget) && val>maxBudget;
      const diff = exceeds ? val - maxBudget : 0;
      option.disabled = exceeds && funds < diff;
      if(exceeds) option.title='Este material ultrapassa o limite de '+formatCurrencyValue(maxBudget,'T$')+(funds >= diff ? ' (coberto por saldo)' : '.');
    });
  });

  const materialStatus = materialSelectionStatus(draft, effectiveItemForOptions(original, draft));
  const isBudgetOk = hasUnlimitedBudget || !Number.isFinite(maxBudget) || currentCost <= maxBudget || (funds >= currentCost - maxBudget);
  const isReady = isBudgetOk && materialStatus.complete;

  // Em escolhas iniciais, os botões "Voltar" e "Confirmar" já existem na barra inferior do criador
  const modalActions = modal.querySelector('.modal-actions');
  if (modalActions) modalActions.remove();
  const headerBtn = modal.querySelector('.modal-header [data-action="select-budget-item"]');
  if (headerBtn) headerBtn.remove();

  // Sincronização em tempo real: registra o item como candidato ativo no host imediatamente
  if (isReady && typeof executeChooseCandidate === 'function') {
    executeChooseCandidate(original, draft.improvements || []);
  }
}
const baseOpenPurchaseUpgrade = typeof openPurchaseUpgrade === 'function' ? openPurchaseUpgrade : null;
openPurchaseUpgrade = function(itemId, kind, existingInstanceId = null) {
  if (typeof hideCenterChoiceNotice === 'function') hideCenterChoiceNotice();
  if (baseOpenPurchaseUpgrade) baseOpenPurchaseUpgrade(itemId, kind, existingInstanceId);
  if (typeof arsenalInitialState !== 'undefined' && arsenalInitialState.mode === 'initial') {
    const choice = typeof effectiveInitialChoice === 'function' ? effectiveInitialChoice() : null;
    if (choice?.isBudgetGrant) {
      syncBudgetUpgradeModalState(itemId);
    }
  }
};
const baseRefreshPurchaseUpgrade = typeof refreshPurchaseUpgrade === 'function' ? refreshPurchaseUpgrade : null;
refreshPurchaseUpgrade = function() {
  if (baseRefreshPurchaseUpgrade) baseRefreshPurchaseUpgrade();
  if (typeof arsenalInitialState !== 'undefined' && arsenalInitialState.mode === 'initial') {
    const choice = typeof effectiveInitialChoice === 'function' ? effectiveInitialChoice() : null;
    if (choice?.isBudgetGrant) {
      const modal = document.getElementById('purchaseUpgradeModal');
      if (modal && modal.dataset.itemId) syncBudgetUpgradeModalState(modal.dataset.itemId);
    }
  }
};
if (!shopActions.parentNode) document.body.prepend(shopActions);
const isOficinaActive = (typeof state !== 'undefined' && state.oficinaFilter) || (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('oficina'));
if (isOficinaActive) {
  shopActions.hidden = true;
  shopActions.style.display = 'none';
}
function syncEmbeddedShopActions(){
  if ((typeof arsenalInitialState !== 'undefined' && arsenalInitialState.mode === 'workshop') || (typeof state !== 'undefined' && state.oficinaFilter) || (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('oficina'))) {
    shopActions.hidden = true;
    shopActions.style.display = 'none';
    return;
  }
  shopActions.hidden = false;
  shopActions.style.display = '';
  const currentView = state.view === 'backpack' ? 'backpack' : 'catalog';
  shopActions.querySelectorAll('[data-shop-view]').forEach(button => {
    button.classList.toggle('active', button.dataset.shopView === currentView);
  });
  shopActions.querySelector('[data-shop-cart-count]').textContent=String(cartItems.reduce((sum,entry)=>sum+entry.quantity,0));
  const moneyLabel = shopActions.querySelector('[data-money-label]');
  const money = shopActions.querySelector('[data-money]');
  const balance = shopActions.querySelector('[data-balance]');
  const isInitial = typeof arsenalInitialState !== 'undefined' && arsenalInitialState.mode === 'initial';
  if (money) {
    if (isInitial) {
      if (moneyLabel) {
        moneyLabel.textContent = 'Dinheiro inicial · T$';
        moneyLabel.style.display = '';
      }
      money.style.display = '';
      if (document.activeElement !== money) money.value = arsenalInitialState.startingMoney || '';
      money.disabled = arsenalInitialState.startingLevel !== 1;
      if (balance) {
        const currentFunds = Number(arsenalInitialState.funds || 0);
        balance.textContent = ` (Saldo: ${formatCurrencyValue(currentFunds, 'T$')})`;
      }
    } else {
      if (moneyLabel) {
        moneyLabel.textContent = '';
        moneyLabel.style.display = 'none';
      }
      money.style.display = 'none';
      if (balance) {
        const currentFunds = Number(arsenalInitialState.funds || 0);
        balance.textContent = `Saldo disponível: ${formatCurrencyValue(currentFunds, 'T$')}`;
      }
    }
  }
  const craft=shopActions.querySelector('[data-craft-mode]');
  if(craft) craft.style.display = 'none';
}
let workshopRevision = 0;
let cachedWorkshopKey = '';
let cachedWorkshopResults = [];
const baseFilteredItems = typeof filteredItems === 'function' ? filteredItems : null;
filteredItems = function() {
  if (typeof arsenalInitialState !== 'undefined' && arsenalInitialState.mode === 'workshop') {
    const wsKey = `${workshopRevision}|${preparedItems.length}|${arsenalInitialState.workshopSection}|${state.type}|${state.specific}|${state.category}|${state.combat}|${state.grip}|${state.search}|${state.searchNameOnly}|${state.sort}`;
    if (wsKey === cachedWorkshopKey) return cachedWorkshopResults;

    // @ts-ignore
    const rules = typeof RegrasManufatura !== 'undefined' ? RegrasManufatura : null;
    const sectionKey = arsenalInitialState.workshopSection || 'artesao';
    const sec = rules?.secoesOficina?.[sectionKey];
    const exclusiveIds = typeof ORIGIN_EXCLUSIVE_ITEM_IDS !== 'undefined' ? ORIGIN_EXCLUSIVE_ITEM_IDS : new Set(['rolo_de_macarrao', 'martelo_de_carne', 'ferramenta_pesada', 'ferramenta_pesada_lanca', 'ferramenta_agricola', 'animal_nao_combativo', 'joia_de_familia', 'joia_falsificada', 'item_artistico', 'cutelo', 'bolas_malabarismo', 'dente_falso', 'panela', 'avental', 'caneca', 'pano_sujo', 'apito', 'faca_de_corte']);
    const search = typeof normalizeText === 'function' ? normalizeText(state.search) : (state.search || '').toLowerCase();

    let results = preparedItems.filter(function(item) {
      if (item.categoriaId === 'servico') return false;
      if (item.origemExclusiva || exclusiveIds.has(item.id)) return false;
      const price = Number(item.preco?.valor ?? item.price ?? 0);
      if (price <= 0) return false;
      if (sec && typeof sec.corresponde === 'function' && !sec.corresponde(item)) return false;

      if (sectionKey === 'alquimista') {
        const isAlchemCat = item.tipo === 'alquimico' ||
          item.categoriaId === 'alquimico_catalisador' ||
          item.categoriaId === 'alquimico_preparado' ||
          item.categoriaId === 'alquimico_venenoso' ||
          ((item.categoriaId || '').startsWith('alquimico_') && item.categoriaId !== 'alquimico');
        if (!isAlchemCat) return false;
        if (state.category !== 'todos' && item.categoriaId !== state.category) return false;
        const searchOk = !search || (state.searchNameOnly ? item._searchName : item._search).includes(search);
        return searchOk;
      }

      if (arsenalInitialState?.contraptionAttach) {
        // Regra canônica T20 (p. 70): Apenas itens mundanos convencionais podem receber engenhocas.
        // Itens específicos, litúrgicos, encantados ou superiores NÃO podem ser acoplados nem constar no catálogo.
        const isFixedMagic = typeof isNamedFixedMagicItem === 'function' && isNamedFixedMagicItem(item);
        const isSpecificMagic = typeof isSpecificMagicItem === 'function' && isSpecificMagicItem(item);
        const isLiturgical = typeof isLiturgicalItem === 'function' && isLiturgicalItem(item);
        const isSuperior = Boolean(
          item.superior ||
          (Array.isArray(item.melhorias) && item.melhorias.length > 0) ||
          (Array.isArray(item.melhoriasFixasIds) && item.melhoriasFixasIds.length > 0) ||
          (Array.isArray(item.magico?.melhoriasFixasIds) && item.magico.melhoriasFixasIds.length > 0) ||
          (Array.isArray(item.encantamentos) && item.encantamentos.length > 0) ||
          (Array.isArray(item.magico?.encantosFixosIds) && item.magico.encantosFixosIds.length > 0) ||
          item.materialEspecialId ||
          item.materialId
        );
        if (isFixedMagic || isSpecificMagic || isLiturgical || isSuperior || item.magico || item.liturgico || item.especifico) {
          return false;
        }

        const attachForma = String(arsenalInitialState.contraptionAttach.formaUso || arsenalInitialState.contraptionAttach.forma || (new URLSearchParams(window.location.search).get('forma')) || 'empunhada').toLowerCase();
        const tipoLower = String(item.tipo || '').toLowerCase();
        const catLower = String(item.categoriaId || '').toLowerCase();
        const nomeLower = String(item.nome || '').toLowerCase();

        const isWieldable = tipoLower === 'arma' || tipoLower === 'escudo' || tipoLower === 'esoterico' || tipoLower === 'instrumento' ||
          catLower === 'arma' || catLower === 'escudo' || catLower === 'esoterico' || catLower === 'instrumento' ||
          /espada|adaga|machado|maca|maça|arco|besta|funda|lanca|lança|escudo|cajado|cetro|varinha|instrumento|marreta|picareta|chicote/i.test(nomeLower);

        const isWearable = tipoLower === 'armadura' || tipoLower === 'vestuario' || tipoLower === 'acessorio' || tipoLower === 'tatuagem' ||
          catLower === 'armadura' || catLower === 'vestuario' || catLower === 'acessorio' || Boolean(item.equipamento?.itemVestido) ||
          /armadura|gibao|gibão|cota|couraça|couraca|brunea|brúnea|traje|camisa|veste|vestimenta|manto|capa|chapeu|chapéu|colar|anel|bota|luva|faixa|cinto|elmo|tiara|amuleto/i.test(nomeLower);

        if (attachForma === 'empunhada' && !isWieldable) return false;
        if (attachForma === 'vestida' && !isWearable) return false;

        return true;
      }

      // Filtros contextuais ativos na loja da oficina
      const typeOk = state.type === 'todos' || item.tipo === state.type;
      const specificOk = state.specific === 'todos' ||
        (state.specific === 'especifico' && isSpecificMagicItem(item)) ||
        (state.specific === 'liturgico' && isLiturgicalItem(item)) ||
        (state.specific === 'convencional' && !isNamedFixedMagicItem(item));
      const categoryOk = state.category === 'todos' || (item.categoriaId || 'sem_categoria') === state.category;
      const combatOk = state.combat === 'todos' || (item.arma && item.arma.combateId === state.combat);
      const gripOk = state.grip === 'todos' || (item.arma && item.arma.empunhaduraId === state.grip);
      const searchOk = !search || (state.searchNameOnly ? item._searchName : item._search).includes(search);
      return typeOk && specificOk && categoryOk && combatOk && gripOk && searchOk;
    });

    results.sort(function(a, b) {
      if (state.sort === 'price-asc') return Number(a.preco.valor) - Number(b.preco.valor) || a.nome.localeCompare(b.nome, 'pt-BR');
      if (state.sort === 'price-desc') return Number(b.preco.valor) - Number(a.preco.valor) || a.nome.localeCompare(b.nome, 'pt-BR');
      if (state.sort === 'space-asc') return Number(a.espacos) - Number(b.espacos) || a.nome.localeCompare(b.nome, 'pt-BR');
      return a.nome.localeCompare(b.nome, 'pt-BR');
    });

    cachedWorkshopKey = wsKey;
    cachedWorkshopResults = results;
    return results;
  }
  return baseFilteredItems ? baseFilteredItems() : [];
};

const baseRenderTypeFilters = typeof renderTypeFilters === 'function' ? renderTypeFilters : null;
renderTypeFilters = function() {
  if (typeof arsenalInitialState !== 'undefined' && arsenalInitialState.mode === 'workshop') {
    // @ts-ignore
    const rules = typeof RegrasManufatura !== 'undefined' ? RegrasManufatura : null;
    const sectionKey = arsenalInitialState.workshopSection || 'artesao';
    const sec = rules?.secoesOficina?.[sectionKey];

    if (sectionKey === 'alquimista') {
      typeFilters.style.display = 'none';
      const rowControl = typeFilters.closest('.filter-row-control');
      if (rowControl) rowControl.style.display = 'none';
      return;
    }
    typeFilters.style.display = '';
    const rowControl = typeFilters.closest('.filter-row-control');
    if (rowControl) rowControl.style.display = '';

    const wsItems = preparedItems.filter(function(item) {
      if (item.categoriaId === 'servico') return false;
      const price = Number(item.preco?.valor ?? item.price ?? 0);
      if (price <= 0) return false;
      return sec ? sec.corresponde(item) : true;
    });

    const typesPresent = Array.from(new Set(wsItems.map(item => item.tipo)));
    const order = ['todos', ...typesPresent];

    typeFilters.innerHTML = '<span class="filter-label">Tipo</span>' + order.map(function(type) {
      const count = type === 'todos' ? wsItems.length : wsItems.filter(item => item.tipo === type).length;
      const meta = TYPE_META[type] || { icon: '', label: humanize(type) };
      return '<button class="chip type-chip' + (state.type === type ? ' active' : '') + '" type="button" data-value="' + type + '">' +
        '<span aria-hidden="true">' + meta.icon + '</span>' + meta.label +
        '<span class="chip-count">' + count + '</span></button>';
    }).join('');

    typeFilters.querySelectorAll('.type-chip').forEach(function(button) {
      button.addEventListener('click', function() {
        const nextType = button.dataset.value;
        if (state.type !== nextType) {
          state.type = nextType;
          state.category = 'todos';
          state.combat = 'todos';
          state.grip = 'todos';
          renderContextFilters();
          applyFilters();
        }
      });
    });
    return;
  }
  if (baseRenderTypeFilters) baseRenderTypeFilters();
};

const baseRenderSpecificFilters = typeof renderSpecificFilters === 'function' ? renderSpecificFilters : null;
renderSpecificFilters = function() {
  if (typeof arsenalInitialState !== 'undefined' && arsenalInitialState.mode === 'workshop') {
    // @ts-ignore
    const rules = typeof RegrasManufatura !== 'undefined' ? RegrasManufatura : null;
    const sectionKey = arsenalInitialState.workshopSection || 'artesao';
    const sec = rules?.secoesOficina?.[sectionKey];

    if (sectionKey === 'alquimista') {
      specificFilters.style.display = 'none';
      const rowControl = specificFilters.closest('.filter-row-control');
      if (rowControl) rowControl.style.display = 'none';
      return;
    }
    specificFilters.style.display = '';
    const rowControl = specificFilters.closest('.filter-row-control');
    if (rowControl) rowControl.style.display = '';

    const wsItems = preparedItems.filter(function(item) {
      if (item.categoriaId === 'servico') return false;
      const price = Number(item.preco?.valor ?? item.price ?? 0);
      if (price <= 0) return false;
      return sec ? sec.corresponde(item) : true;
    });

    const options = [
      { id: 'todos', label: 'Todos', count: wsItems.length },
      { id: 'convencional', label: 'Convencionais', count: wsItems.filter(item => !isNamedFixedMagicItem(item)).length },
      { id: 'especifico', label: 'Específicos', count: wsItems.filter(isSpecificMagicItem).length },
      { id: 'liturgico', label: 'Litúrgicos', count: wsItems.filter(isLiturgicalItem).length }
    ].filter(opt => opt.count > 0 || opt.id === 'todos' || opt.id === 'convencional');

    specificFilters.innerHTML = '<span class="filter-label">Natureza</span>' + options.map(function(option) {
      return '<button class="chip specific-chip' + (state.specific === option.id ? ' active' : '') + '" type="button" data-value="' + option.id + '">' + option.label +
        '<span class="chip-count">' + option.count + '</span></button>';
    }).join('');

    specificFilters.querySelectorAll('.specific-chip').forEach(function(button) {
      button.addEventListener('click', function() {
        state.specific = button.dataset.value;
        applyFilters();
      });
    });
    return;
  }
  if (baseRenderSpecificFilters) baseRenderSpecificFilters();
};

const baseRenderContextFilters = typeof renderContextFilters === 'function' ? renderContextFilters : null;
renderContextFilters = function() {
  if (typeof arsenalInitialState !== 'undefined' && arsenalInitialState.mode === 'workshop') {
    // @ts-ignore
    const rules = typeof RegrasManufatura !== 'undefined' ? RegrasManufatura : null;
    const sectionKey = arsenalInitialState.workshopSection || 'artesao';
    const sec = rules?.secoesOficina?.[sectionKey];

    if (sectionKey === 'alquimista') {
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

      const alchemWsItems = preparedItems.filter(function(item) {
        if (item.categoriaId === 'servico') return false;
        const price = Number(item.preco?.valor ?? item.price ?? 0);
        if (price <= 0) return false;
        const cat = String(item.categoriaId || '').toLowerCase();
        return item.tipo === 'alquimico' || cat === 'alquimico_catalisador' || cat === 'alquimico_preparado' || cat === 'alquimico_venenoso' || (cat.startsWith('alquimico_') && cat !== 'alquimico');
      });

      categoryFilters.innerHTML = '<span class="filter-label">Alquímicos</span>' +
        alchemCats.map(function(opt) {
          const count = opt.id === 'todos' ? alchemWsItems.length : alchemWsItems.filter(i => (i.categoriaId || '') === opt.id).length;
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
    contextFilters.style.display = '';

    const wsItems = preparedItems.filter(function(item) {
      if (item.categoriaId === 'servico') return false;
      const price = Number(item.preco?.valor ?? item.price ?? 0);
      if (price <= 0) return false;
      return sec ? sec.corresponde(item) : true;
    });

    const categories = state.type === 'todos' ? [] : Array.from(new Set(
      wsItems.filter(item => item.tipo === state.type).map(item => item.categoriaId || 'sem_categoria')
    )).sort((a, b) => (CATEGORY_LABELS[a] || humanize(a)).localeCompare(CATEGORY_LABELS[b] || humanize(b), 'pt-BR'));

    const shouldShowCategories = categories.length > 1;
    contextFilters.hidden = !shouldShowCategories;
    if (shouldShowCategories) {
      categoryFilters.innerHTML = '<span class="filter-label">Subtipo</span>' +
        '<button class="chip category-chip' + (state.category === 'todos' ? ' active' : '') + '" type="button" data-value="todos">Todos</button>' +
        categories.map(function(category) {
          const count = wsItems.filter(function(item) {
            return item.tipo === state.type && (item.categoriaId || 'sem_categoria') === category;
          }).length;
          return '<button class="chip category-chip' + (state.category === category ? ' active' : '') + '" type="button" data-value="' + escapeHtml(category) + '">' +
            escapeHtml(CATEGORY_LABELS[category] || humanize(category)) + '<span class="chip-count">' + count + '</span></button>';
        }).join('');

      categoryFilters.querySelectorAll('.category-chip').forEach(function(button) {
        button.addEventListener('click', function() {
          state.category = button.dataset.value;
          applyFilters();
        });
      });
    } else {
      categoryFilters.innerHTML = '';
    }

    const isWeapon = state.type === 'arma';
    weaponFilters.hidden = !isWeapon;
    if (isWeapon) {
      const combatOrder = ['todos', 'corpo_a_corpo', 'a_distancia'];
      combatFilters.innerHTML = '<span class="filter-label">Combate</span>' + combatOrder.map(function(value) {
        return '<button class="chip combat-chip' + (state.combat === value ? ' active' : '') + '" type="button" data-value="' + value + '">' + (COMBAT_LABELS[value] || humanize(value)) + '</button>';
      }).join('');
      combatFilters.querySelectorAll('.combat-chip').forEach(function(button) {
        button.addEventListener('click', function() {
          state.combat = button.dataset.value;
          applyFilters();
        });
      });

      const gripOrder = ['todos', 'leve', 'uma_mao', 'duas_maos'];
      gripFilters.innerHTML = '<span class="filter-label">Empunhadura</span>' + gripOrder.map(function(value) {
        return '<button class="chip grip-chip' + (state.grip === value ? ' active' : '') + '" type="button" data-value="' + value + '">' + (GRIP_LABELS[value] || humanize(value)) + '</button>';
      }).join('');
      gripFilters.querySelectorAll('.grip-chip').forEach(function(button) {
        button.addEventListener('click', function() {
          state.grip = button.dataset.value;
          applyFilters();
        });
      });
    } else {
      combatFilters.innerHTML = '';
      gripFilters.innerHTML = '';
    }
    return;
  }
  if (baseRenderContextFilters) baseRenderContextFilters();
};

function potionWorkshopCardHtml() {
  const isDrogadora = Boolean(
    typeof arsenalInitialState !== 'undefined' && (arsenalInitialState.crafting?.isDrogadora || arsenalInitialState.isDrogadora)
  );
  const mp1 = isDrogadora ? Math.ceil(30 / 4) : 10;
  const mp2 = isDrogadora ? Math.ceil(270 / 4) : 90;
  const mp3 = isDrogadora ? Math.ceil(1080 / 4) : 360;
  const mp4 = isDrogadora ? Math.ceil(3000 / 4) : 1000;
  const mp5 = isDrogadora ? Math.ceil(6750 / 4) : 2250;
  const mpRuleText = isDrogadora
    ? 'Matéria-prima = ¼ do Preço'
    : 'Matéria-prima = ⅓ do Preço';

  return '<article class="item-card potion-special-card" style="border: 1px solid #7e22ce; background: #0c1118; box-shadow: 0 4px 18px rgba(0, 0, 0, 0.45); border-radius: 8px; display: flex; flex-direction: column; justify-content: space-between; height: auto; min-height: auto; max-height: none; box-sizing: border-box; overflow: hidden;">' +
    '<div class="card-header" style="padding: 12px 16px; border-bottom: 1px solid #1a2332; background: #12101c; display: flex; justify-content: space-between; align-items: center;">' +
      '<div class="title-row" style="display: flex; align-items: center; gap: 10px;">' +
        '<span class="item-icon" aria-hidden="true" style="font-size: 1.25rem;"></span>' +
        '<h3 class="item-title" style="margin: 0; font-size: 1.02rem; color: #d8b4fe; font-family: Cinzel, serif;">Bancada de Poções e Óleos</h3>' +
      '</div>' +
      '<div class="badges" style="display: flex; gap: 6px;">' +
        '<span class="badge" style="background: rgba(168, 85, 247, 0.22); color: #d8b4fe; border: 1px solid rgba(168, 85, 247, 0.45); font-size: 0.7rem; text-transform: uppercase;">Ofício (Alquimia)</span>' +
      '</div>' +
    '</div>' +
    '<div class="item-stats" style="padding: 10px 14px; font-size: 0.78rem; color: #94a3b8; display: grid; grid-template-columns: repeat(2, minmax(110px, 1fr)); gap: 8px; border-bottom: 1px solid #1a2332;">' +
      '<div><strong>Custo MP:</strong> ' + mpRuleText + '</div>' +
      '<div><strong>Fabricação:</strong> CD 20 + PM</div>' +
      '<div><strong>Tempo:</strong> 1 dia / poção</div>' +
      '<div><strong>Círculos:</strong> 1º ao 5º Círculo</div>' +
    '</div>' +
    '<div class="card-body" style="padding: 14px 16px; font-size: 0.82rem; line-height: 1.5; color: #cbd5e1; flex: 1; display: flex; flex-direction: column; justify-content: space-between; gap: 10px;">' +
      '<div class="potion-block">' +
        '<strong style="color: #f1f5f9; display: block; margin-bottom: 4px; font-size: 0.84rem;">Poções, Óleos e Granadas:</strong>' +
        '<div style="color: #94a3b8; line-height: 1.45;">Líquidos mágicos armazenados em frascos. Poções afetam quem as bebe, óleos afetam objetos e granadas afetam áreas de efeito.</div>' +
      '</div>' +
      '<div class="potion-block" style="background: rgba(168, 85, 247, 0.08); border: 1px dashed rgba(168, 85, 247, 0.35); border-radius: 6px; padding: 8px 10px; font-size: 0.75rem; color: #d8b4fe;">' +
        '1º Círc: T$ 30 (MP ' + mp1 + ') · CD 21<br>' +
        '2º Círc: T$ 270 (MP ' + mp2 + ') · CD 23<br>' +
        '3º Círc: T$ 1.080 (MP ' + mp3 + ') · CD 26<br>' +
        '4º Círc: T$ 3.000 (MP ' + mp4 + ') · CD 30<br>' +
        '5º Círc: T$ 6.750 (MP ' + mp5 + ') · CD 35' +
      '</div>' +
    '</div>' +
    '<div class="card-actions" style="padding: 12px 16px; background: #0a0e16; border-top: 1px solid #1a2332; display: flex; justify-content: flex-end; align-items: center; gap: 8px; flex-shrink: 0; margin-top: auto; box-sizing: border-box; width: 100%;">' +
      '<button class="acquire-button potion-magic-select-btn" type="button" data-action="choose-potion-spell" style="background: linear-gradient(135deg, #7e22ce, #9333ea); border: 1px solid #a855f7; color: #ffffff; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 700; font-size: 0.82rem; display: inline-flex; align-items: center; gap: 6px; transition: all 0.15s; box-shadow: 0 2px 8px rgba(0,0,0,0.4);">' +
        ' Preparar Poção' +
      '</button>' +
    '</div>' +
  '</article>';
}

function scrollWorkshopCardHtml() {
  return '<article class="item-card scroll-special-card" style="border: 1px solid #ca8a04; background: #0c1118; box-shadow: 0 4px 18px rgba(0, 0, 0, 0.45); border-radius: 8px; display: flex; flex-direction: column; justify-content: space-between; height: 100%; min-height: auto; max-height: none; box-sizing: border-box; overflow: visible;">' +
    '<div class="card-header">' +
      '<div class="title-row">' +
        '<span class="item-icon" aria-hidden="true" style="font-size: 1.35rem;"></span>' +
        '<h3 class="item-title" style="color: #fef08a;">Pergaminhos Mágicos</h3>' +
      '</div>' +
      '<div class="badges">' +
        '<span class="badge" style="background: rgba(234, 179, 8, 0.22); color: #fde047; border: 1px solid rgba(234, 179, 8, 0.45);">Item Mágico de Uso Único</span>' +
        '<span class="badge" style="background: rgba(59, 130, 246, 0.2); color: #93c5fd; border: 1px solid rgba(59, 130, 246, 0.4);">Ofício (Escriba)</span>' +
      '</div>' +
    '</div>' +
    '<div class="item-stats" style="border-top: 1px solid rgba(234, 179, 8, 0.25); border-bottom: 1px solid rgba(234, 179, 8, 0.25); padding: 8px 0; font-size: 0.81rem; color: #cbd5e1; display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 6px;">' +
      '<div><strong>1º Círc. (1 PM):</strong> Preço T$ 30 <span style="color:#ffd700;">(MP T$ 10)</span> · <strong>CD 21</strong></div>' +
      '<div><strong>2º Círc. (3 PM):</strong> Preço T$ 270 <span style="color:#ffd700;">(MP T$ 90)</span> · <strong>CD 23</strong></div>' +
      '<div><strong>3º Círc. (6 PM):</strong> Preço T$ 1.080 <span style="color:#ffd700;">(MP T$ 360)</span> · <strong>CD 26</strong></div>' +
      '<div><strong>4º Círc. (10 PM):</strong> Preço T$ 3.000 <span style="color:#ffd700;">(MP T$ 1.000)</span> · <strong>CD 30</strong></div>' +
      '<div><strong>5º Círc. (15 PM):</strong> Preço T$ 6.750 <span style="color:#ffd700;">(MP T$ 2.250)</span> · <strong>CD 35</strong></div>' +
    '</div>' +
    '<div class="card-body" style="padding: 10px 0 6px; font-size: 0.86rem; line-height: 1.5; color: #e2e8f0;">' +
      '<p class="description" style="margin: 0 0 8px 0; font-style: italic; color: #fef9c3; border-left: 3px solid #eab308; padding-left: 10px;">' +
        '“Um pergaminho mágico é uma folha grossa feita de papel, papiro, couro ou outros materiais. Pergaminhos podem conter qualquer magia. Quando as palavras escritas nele são pronunciadas, a magia é ativada e o pergaminho se desfaz em cinzas.”' +
      '</p>' +
      '<p style="margin: 0; font-size: 0.79rem; color: #94a3b8;">' +
        '<strong>Regras de Fabricação:</strong> Preço = T$ 30 × PM² · Matéria-prima = ⅓ do Preço (T$ 10 × PM²) · CD = 20 + PM. Exige poder como <em>Escrever Pergaminho</em> ou treino em Ofício (escriba) com aprovação do mestre.' +
      '</p>' +
    '</div>' +
    '<div class="card-actions" style="margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: flex-end;">' +
      '<button class="acquire-button scroll-magic-select-btn" type="button" data-action="choose-scroll-spell" style="background: linear-gradient(135deg, #a16207, #ca8a04); color: #fff; font-weight: 600; border: 1px solid #eab308; box-shadow: 0 2px 10px rgba(202,138,4,0.35); padding: 8px 18px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;">' +
        ' Escolher Magia do Pergaminho →' +
      '</button>' +
    '</div>' +
  '</article>';
}

function tattooWorkshopCardHtml() {
  return '<article class="item-card tattoo-special-card" style="border: 1px solid #0891b2; background: #0c1118; box-shadow: 0 4px 18px rgba(0, 0, 0, 0.45); border-radius: 8px; display: flex; flex-direction: column; justify-content: space-between; height: 100%; min-height: auto; max-height: none; box-sizing: border-box; overflow: visible;">' +
    '<div class="card-header">' +
      '<div class="title-row">' +
        '<span class="item-icon" aria-hidden="true" style="font-size: 1.35rem;">Encantar</span>' +
        '<h3 class="item-title" style="color: #cffafe;">Tatuagens Místicas</h3>' +
      '</div>' +
      '<div class="badges">' +
        '<span class="badge" style="background: rgba(6, 182, 212, 0.22); color: #67e8f9; border: 1px solid rgba(6, 182, 212, 0.45);">Arte Corporal Mística</span>' +
        '<span class="badge" style="background: rgba(59, 130, 246, 0.2); color: #93c5fd; border: 1px solid rgba(59, 130, 246, 0.4);">Ofício (Tatuador)</span>' +
      '</div>' +
    '</div>' +
    '<div class="item-stats" style="border-top: 1px solid rgba(6, 182, 212, 0.25); border-bottom: 1px solid rgba(6, 182, 212, 0.25); padding: 8px 0; font-size: 0.84rem; color: #cbd5e1; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 6px;">' +
      '<div><strong>Benefício:</strong> Concede uma <strong>magia arcana de 1º círculo</strong></div>' +
      '<div><strong>Aplicação:</strong> Pigmentos especiais místicos · <strong>CD 20</strong></div>' +
    '</div>' +
    '<div class="card-body" style="padding: 10px 0 6px; font-size: 0.86rem; line-height: 1.5; color: #e2e8f0;">' +
      '<p class="description" style="margin: 0 0 8px 0; font-style: italic; color: #ecfeff; border-left: 3px solid #06b6d4; padding-left: 10px;">' +
        '“Pigmentos infundidos com essência mágica aplicados sobre a pele. O tatuador canaliza energias arcanas que despertam o poder da magia escolhida no portador.”' +
      '</p>' +
      '<p style="margin: 0; font-size: 0.8rem; color: #94a3b8;">' +
        'A tatuagem mística pode ser aplicada em si mesmo ou em outro membro do grupo. Escolha a magia arcana de 1º círculo a ser gravada nos pigmentos.' +
      '</p>' +
    '</div>' +
    '<div class="card-actions" style="margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: flex-end;">' +
      '<button class="acquire-button tattoo-magic-select-btn" type="button" data-action="choose-tattoo-spell" style="background: linear-gradient(135deg, #0891b2, #06b6d4); color: #fff; font-weight: 600; border: 1px solid #22d3ee; box-shadow: 0 2px 10px rgba(6,182,212,0.35); padding: 8px 18px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;">' +
        ' Escolher Magia Arcana (1º Círculo) →' +
      '</button>' +
    '</div>' +
  '</article>';
}

function armeiroWorkshopCardHtml() {
  return '<article class="item-card armeiro-special-card" style="border: 1px solid #991b1b; background: #0c1118; box-shadow: 0 4px 18px rgba(0, 0, 0, 0.45); border-radius: 8px; display: flex; flex-direction: column; justify-content: space-between; height: 100%; min-height: auto; max-height: none; box-sizing: border-box; overflow: visible;">' +
    '<div class="card-header" style="padding: 12px 16px; border-bottom: 1px solid #1a2332; background: #1a0f12; display: flex; justify-content: space-between; align-items: center;">' +
      '<div class="title-row" style="display: flex; align-items: center; gap: 10px;">' +
        '<span class="item-icon" aria-hidden="true" style="font-size: 1.25rem; display: inline-flex; align-items: center;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fca5a5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg></span>' +
        '<h3 class="item-title" style="margin: 0; font-size: 1.02rem; color: #fca5a5; font-family: Cinzel, serif;">Forja do Ferreiro & Armeiro</h3>' +
      '</div>' +
      '<div class="badges" style="display: flex; gap: 6px;">' +
        '<span class="badge" style="background: rgba(239, 68, 68, 0.2); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.45); font-size: 0.7rem; text-transform: uppercase;">Ofício (Armeiro)</span>' +
      '</div>' +
    '</div>' +
    '<div class="item-stats" style="padding: 10px 14px; font-size: 0.78rem; color: #94a3b8; display: grid; grid-template-columns: repeat(2, minmax(110px, 1fr)); gap: 8px; border-bottom: 1px solid #1a2332;">' +
      '<div><strong>Custo MP:</strong> Matéria-prima = ⅓ do Preço</div>' +
      '<div><strong>Fabricação:</strong> CD 15 (simples) · CD 20 (marciais/pesadas)</div>' +
      '<div><strong>Tempo:</strong> 1 semana (mundano) · 1 mês (superior)</div>' +
      '<div><strong>Melhorias:</strong> Até limite por nível do herói</div>' +
    '</div>' +
    '<div class="card-body" style="padding: 14px 16px; font-size: 0.82rem; line-height: 1.5; color: #cbd5e1; flex: 1; display: flex; flex-direction: column; justify-content: space-between; gap: 10px;">' +
      '<div class="workshop-block">' +
        '<strong style="color: #f1f5f9; display: block; margin-bottom: 4px; font-size: 0.84rem;">Forja e Aprimoramento Bélico:</strong>' +
        '<div style="color: #94a3b8; line-height: 1.45;">Armas, armaduras e escudos forjados com matéria-prima por apenas um terço do valor de mercado. Na sua mochila abaixo você pode aprimorar itens já existentes adicionando melhorias e materiais especiais.</div>' +
      '</div>' +
    '</div>' +
    '<div class="card-actions" style="padding: 12px 16px; background: #0a0e16; border-top: 1px solid #1a2332; display: flex; justify-content: flex-end; align-items: center; gap: 8px; flex-shrink: 0; margin-top: auto;">' +
      '<button class="acquire-button" type="button" onclick="window.__workshopBackpackExpanded=true;const b=document.getElementById(\'workshopBackpackContent\');const btn=document.getElementById(\'toggleWorkshopBackpackBtn\');if(b){b.style.display=\'\';if(btn)btn.textContent=\'Recolher Mochila\';b.scrollIntoView({behavior:\'smooth\',block:\'nearest\'});}" style="background: #1e293b; border: 1px solid #475569; color: #f1f5f9; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-weight: 700; font-size: 0.82rem;">Ver Mochila</button>' +
      '<button class="acquire-button" type="button" onclick="const div=document.querySelector(\'.workshop-divider\');if(div){div.scrollIntoView({behavior:\'smooth\',block:\'start\'});}" style="background: linear-gradient(135deg, #991b1b, #b91c1c); border: 1px solid #ef4444; color: #ffffff; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 700; font-size: 0.82rem; box-shadow: 0 2px 8px rgba(0,0,0,0.4);">Forjar Novo Item</button>' +
    '</div>' +
  '</article>';
}

function alfaiateWorkshopCardHtml() {
  return '<article class="item-card alfaiate-special-card" style="border: 1px solid #0284c7; background: #0c1118; box-shadow: 0 4px 18px rgba(0, 0, 0, 0.45); border-radius: 8px; display: flex; flex-direction: column; justify-content: space-between; height: 100%; min-height: auto; max-height: none; box-sizing: border-box; overflow: visible;">' +
    '<div class="card-header" style="padding: 12px 16px; border-bottom: 1px solid #1a2332; background: #0c1829; display: flex; justify-content: space-between; align-items: center;">' +
      '<div class="title-row" style="display: flex; align-items: center; gap: 10px;">' +
        '<span class="item-icon" aria-hidden="true" style="font-size: 1.25rem; display: inline-flex; align-items: center;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7dd3fc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><line x1="20" y1="4" x2="8.12" y2="15.88"></line><line x1="14.47" y1="14.48" x2="20" y2="20"></line><line x1="8.12" y1="8.12" x2="12" y2="12"></line></svg></span>' +
        '<h3 class="item-title" style="margin: 0; font-size: 1.02rem; color: #7dd3fc; font-family: Cinzel, serif;">Ateliê do Alfaiate</h3>' +
      '</div>' +
      '<div class="badges" style="display: flex; gap: 6px;">' +
        '<span class="badge" style="background: rgba(2, 132, 199, 0.2); color: #7dd3fc; border: 1px solid rgba(2, 132, 199, 0.45); font-size: 0.7rem; text-transform: uppercase;">Ofício (Alfaiate)</span>' +
      '</div>' +
    '</div>' +
    '<div class="item-stats" style="padding: 10px 14px; font-size: 0.78rem; color: #94a3b8; display: grid; grid-template-columns: repeat(2, minmax(110px, 1fr)); gap: 8px; border-bottom: 1px solid #1a2332;">' +
      '<div><strong>Custo MP:</strong> Matéria-prima = ⅓ do Preço</div>' +
      '<div><strong>Fabricação:</strong> CD 15 (comuns) · CD 20 (mantos finos)</div>' +
      '<div><strong>Tempo:</strong> 1 semana</div>' +
      '<div><strong>Especialidade:</strong> Vestimentas, trajes e capas</div>' +
    '</div>' +
    '<div class="card-body" style="padding: 14px 16px; font-size: 0.82rem; line-height: 1.5; color: #cbd5e1; flex: 1; display: flex; flex-direction: column; justify-content: space-between; gap: 10px;">' +
      '<div class="workshop-block">' +
        '<strong style="color: #f1f5f9; display: block; margin-bottom: 4px; font-size: 0.84rem;">Tecidos e Vestuário de Aventura:</strong>' +
        '<div style="color: #94a3b8; line-height: 1.45;">Confecção de vestimentas resistentes, trajes camuflados, mantos e capas reforçadas por ⅓ do valor de mercado. Aprimore mantos e vestes da sua mochila com melhorias elegantes.</div>' +
      '</div>' +
    '</div>' +
    '<div class="card-actions" style="padding: 12px 16px; background: #0a0e16; border-top: 1px solid #1a2332; display: flex; justify-content: flex-end; align-items: center; gap: 8px; flex-shrink: 0; margin-top: auto;">' +
      '<button class="acquire-button" type="button" onclick="window.__workshopBackpackExpanded=true;const b=document.getElementById(\'workshopBackpackContent\');const btn=document.getElementById(\'toggleWorkshopBackpackBtn\');if(b){b.style.display=\'\';if(btn)btn.textContent=\'Recolher Mochila\';b.scrollIntoView({behavior:\'smooth\',block:\'nearest\'});}" style="background: #1e293b; border: 1px solid #475569; color: #f1f5f9; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-weight: 700; font-size: 0.82rem;">Ver Mochila</button>' +
      '<button class="acquire-button" type="button" onclick="const div=document.querySelector(\'.workshop-divider\');if(div){div.scrollIntoView({behavior:\'smooth\',block:\'start\'});}" style="background: linear-gradient(135deg, #0284c7, #0369a1); border: 1px solid #38bdf8; color: #ffffff; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 700; font-size: 0.82rem;">Fabricar Novo Item</button>' +
    '</div>' +
  '</article>';
}

function carpinteiroWorkshopCardHtml() {
  return '<article class="item-card carpinteiro-special-card" style="border: 1px solid #b45309; background: #0c1118; box-shadow: 0 4px 18px rgba(0, 0, 0, 0.45); border-radius: 8px; display: flex; flex-direction: column; justify-content: space-between; height: 100%; min-height: auto; max-height: none; box-sizing: border-box; overflow: visible;">' +
    '<div class="card-header" style="padding: 12px 16px; border-bottom: 1px solid #1a2332; background: #1c130b; display: flex; justify-content: space-between; align-items: center;">' +
      '<div class="title-row" style="display: flex; align-items: center; gap: 10px;">' +
        '<span class="item-icon" aria-hidden="true" style="font-size: 1.25rem; display: inline-flex; align-items: center;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fde68a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m14 12-8.5 8.5a2.12 2.12 0 1 1-3-3L11 9"></path><path d="M15 13 9 7l4-4 6 6h3l-3 3"></path></svg></span>' +
        '<h3 class="item-title" style="margin: 0; font-size: 1.02rem; color: #fde68a; font-family: Cinzel, serif;">Oficina do Carpinteiro</h3>' +
      '</div>' +
      '<div class="badges" style="display: flex; gap: 6px;">' +
        '<span class="badge" style="background: rgba(180, 83, 9, 0.2); color: #fde68a; border: 1px solid rgba(180, 83, 9, 0.45); font-size: 0.7rem; text-transform: uppercase;">Ofício (Carpinteiro)</span>' +
      '</div>' +
    '</div>' +
    '<div class="item-stats" style="padding: 10px 14px; font-size: 0.78rem; color: #94a3b8; display: grid; grid-template-columns: repeat(2, minmax(110px, 1fr)); gap: 8px; border-bottom: 1px solid #1a2332;">' +
      '<div><strong>Custo MP:</strong> Matéria-prima = ⅓ do Preço</div>' +
      '<div><strong>Fabricação:</strong> CD 15 (madeira simples) · CD 20 (bestas/arcos)</div>' +
      '<div><strong>Tempo:</strong> 1 semana</div>' +
      '<div><strong>Especialidade:</strong> Arcos, bestas, escudos e hastes</div>' +
    '</div>' +
    '<div class="card-body" style="padding: 14px 16px; font-size: 0.82rem; line-height: 1.5; color: #cbd5e1; flex: 1; display: flex; flex-direction: column; justify-content: space-between; gap: 10px;">' +
      '<div class="workshop-block">' +
        '<strong style="color: #f1f5f9; display: block; margin-bottom: 4px; font-size: 0.84rem;">Trabalho em Madeira e Mecânica Leve:</strong>' +
        '<div style="color: #94a3b8; line-height: 1.45;">Fabricação de arcos, bestas, escudos de madeira, lanças e instrumentos em madeira pagando apenas um terço do preço de mercado.</div>' +
      '</div>' +
    '</div>' +
    '<div class="card-actions" style="padding: 12px 16px; background: #0a0e16; border-top: 1px solid #1a2332; display: flex; justify-content: flex-end; align-items: center; gap: 8px; flex-shrink: 0; margin-top: auto;">' +
      '<button class="acquire-button" type="button" onclick="window.__workshopBackpackExpanded=true;const b=document.getElementById(\'workshopBackpackContent\');const btn=document.getElementById(\'toggleWorkshopBackpackBtn\');if(b){b.style.display=\'\';if(btn)btn.textContent=\'Recolher Mochila\';b.scrollIntoView({behavior:\'smooth\',block:\'nearest\'});}" style="background: #1e293b; border: 1px solid #475569; color: #f1f5f9; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-weight: 700; font-size: 0.82rem;">Ver Mochila</button>' +
      '<button class="acquire-button" type="button" onclick="const div=document.querySelector(\'.workshop-divider\');if(div){div.scrollIntoView({behavior:\'smooth\',block:\'start\'});}" style="background: linear-gradient(135deg, #b45309, #d97706); border: 1px solid #f59e0b; color: #ffffff; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 700; font-size: 0.82rem;">Fabricar Novo Item</button>' +
    '</div>' +
  '</article>';
}

function artesaoWorkshopCardHtml() {
  return '<article class="item-card artesao-special-card" style="border: 1px solid #d97706; background: #0c1118; box-shadow: 0 4px 18px rgba(0, 0, 0, 0.45); border-radius: 8px; display: flex; flex-direction: column; justify-content: space-between; height: 100%; min-height: auto; max-height: none; box-sizing: border-box; overflow: visible;">' +
    '<div class="card-header" style="padding: 12px 16px; border-bottom: 1px solid #1a2332; background: #1c180a; display: flex; justify-content: space-between; align-items: center;">' +
      '<div class="title-row" style="display: flex; align-items: center; gap: 10px;">' +
        '<span class="item-icon" aria-hidden="true" style="font-size: 1.25rem; display: inline-flex; align-items: center;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fde68a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 18 3 22 9 12 22 2 9"></polygon></svg></span>' +
        '<h3 class="item-title" style="margin: 0; font-size: 1.02rem; color: #fde68a; font-family: Cinzel, serif;">Bancada do Artesão & Ourives</h3>' +
      '</div>' +
      '<div class="badges" style="display: flex; gap: 6px;">' +
        '<span class="badge" style="background: rgba(217, 119, 6, 0.2); color: #fde68a; border: 1px solid rgba(217, 119, 6, 0.45); font-size: 0.7rem; text-transform: uppercase;">Ofício (Artesão)</span>' +
      '</div>' +
    '</div>' +
    '<div class="item-stats" style="padding: 10px 14px; font-size: 0.78rem; color: #94a3b8; display: grid; grid-template-columns: repeat(2, minmax(110px, 1fr)); gap: 8px; border-bottom: 1px solid #1a2332;">' +
      '<div><strong>Custo MP:</strong> Matéria-prima = ⅓ do Preço</div>' +
      '<div><strong>Fabricação:</strong> CD 15 (itens mundanos) · CD 20 (joias finas)</div>' +
      '<div><strong>Tempo:</strong> 1 semana</div>' +
      '<div><strong>Especialidade:</strong> Joias, ferramentas e acessórios</div>' +
    '</div>' +
    '<div class="card-body" style="padding: 14px 16px; font-size: 0.82rem; line-height: 1.5; color: #cbd5e1; flex: 1; display: flex; flex-direction: column; justify-content: space-between; gap: 10px;">' +
      '<div class="workshop-block">' +
        '<strong style="color: #f1f5f9; display: block; margin-bottom: 4px; font-size: 0.84rem;">Lapidação, Joalheria e Manufatura Geral:</strong>' +
        '<div style="color: #94a3b8; line-height: 1.45;">Criação de anéis, amuletos, ferramentas de ofício, instrumentos de precisão e acessórios de aventura por ⅓ do preço em matérias-primas.</div>' +
      '</div>' +
    '</div>' +
    '<div class="card-actions" style="padding: 12px 16px; background: #0a0e16; border-top: 1px solid #1a2332; display: flex; justify-content: flex-end; align-items: center; gap: 8px; flex-shrink: 0; margin-top: auto;">' +
      '<button class="acquire-button" type="button" onclick="window.__workshopBackpackExpanded=true;const b=document.getElementById(\'workshopBackpackContent\');const btn=document.getElementById(\'toggleWorkshopBackpackBtn\');if(b){b.style.display=\'\';if(btn)btn.textContent=\'Recolher Mochila\';b.scrollIntoView({behavior:\'smooth\',block:\'nearest\'});}" style="background: #1e293b; border: 1px solid #475569; color: #f1f5f9; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-weight: 700; font-size: 0.82rem;">Ver Mochila</button>' +
      '<button class="acquire-button" type="button" onclick="const div=document.querySelector(\'.workshop-divider\');if(div){div.scrollIntoView({behavior:\'smooth\',block:\'start\'});}" style="background: linear-gradient(135deg, #d97706, #b45309); border: 1px solid #f59e0b; color: #ffffff; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 700; font-size: 0.82rem;">Fabricar Novo Item</button>' +
    '</div>' +
  '</article>';
}

function cozinheiroWorkshopCardHtml() {
  return '<article class="item-card cozinheiro-special-card" style="border: 1px solid #16a34a; background: #0c1118; box-shadow: 0 4px 18px rgba(0, 0, 0, 0.45); border-radius: 8px; display: flex; flex-direction: column; justify-content: space-between; height: 100%; min-height: auto; max-height: none; box-sizing: border-box; overflow: visible;">' +
    '<div class="card-header" style="padding: 12px 16px; border-bottom: 1px solid #1a2332; background: #0d1e13; display: flex; justify-content: space-between; align-items: center;">' +
      '<div class="title-row" style="display: flex; align-items: center; gap: 10px;">' +
        '<span class="item-icon" aria-hidden="true" style="font-size: 1.25rem; display: inline-flex; align-items: center;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#86efac" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg></span>' +
        '<h3 class="item-title" style="margin: 0; font-size: 1.02rem; color: #86efac; font-family: Cinzel, serif;">Cozinha de Campanha do Mestre-Cuca</h3>' +
      '</div>' +
      '<div class="badges" style="display: flex; gap: 6px;">' +
        '<span class="badge" style="background: rgba(22, 163, 74, 0.2); color: #86efac; border: 1px solid rgba(22, 163, 74, 0.45); font-size: 0.7rem; text-transform: uppercase;">Ofício (Cozinheiro)</span>' +
      '</div>' +
    '</div>' +
    '<div class="item-stats" style="padding: 10px 14px; font-size: 0.78rem; color: #94a3b8; display: grid; grid-template-columns: repeat(2, minmax(110px, 1fr)); gap: 8px; border-bottom: 1px solid #1a2332;">' +
      '<div><strong>Custo MP:</strong> Matéria-prima = ⅓ do Preço</div>' +
      '<div><strong>Fabricação:</strong> CD 15 (rações) · CD 20 (pratos especiais)</div>' +
      '<div><strong>Tempo:</strong> 1 dia</div>' +
      '<div><strong>Especialidade:</strong> Alimentos e preparados revigorantes</div>' +
    '</div>' +
    '<div class="card-body" style="padding: 14px 16px; font-size: 0.82rem; line-height: 1.5; color: #cbd5e1; flex: 1; display: flex; flex-direction: column; justify-content: space-between; gap: 10px;">' +
      '<div class="workshop-block">' +
        '<strong style="color: #f1f5f9; display: block; margin-bottom: 4px; font-size: 0.84rem;">Culinária de Campanha e Banquetes:</strong>' +
        '<div style="color: #94a3b8; line-height: 1.45;">Preparo de rações especiais, elixires culinários e pratos finos que restauram vigor e concedem bônus temporários aos heróis.</div>' +
      '</div>' +
    '</div>' +
    '<div class="card-actions" style="padding: 12px 16px; background: #0a0e16; border-top: 1px solid #1a2332; display: flex; justify-content: flex-end; align-items: center; gap: 8px; flex-shrink: 0; margin-top: auto;">' +
      '<button class="acquire-button" type="button" onclick="const div=document.querySelector(\'.workshop-divider\');if(div){div.scrollIntoView({behavior:\'smooth\',block:\'start\'});}" style="background: linear-gradient(135deg, #16a34a, #15803d); border: 1px solid #4ade80; color: #ffffff; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 700; font-size: 0.82rem;">Preparar Refeição</button>' +
    '</div>' +
  '</article>';
}

function genericaWorkshopCardHtml(secKey, sec) {
  const title = sec?.title || 'Oficina de Manufatura';
  return '<article class="item-card generic-workshop-special-card" style="border: 1px solid #2a374a; background: #0c1118; box-shadow: 0 4px 18px rgba(0, 0, 0, 0.45); border-radius: 8px; display: flex; flex-direction: column; justify-content: space-between; height: 100%; min-height: auto; max-height: none; box-sizing: border-box; overflow: visible;">' +
    '<div class="card-header" style="padding: 12px 16px; border-bottom: 1px solid #1a2332; background: #131c28; display: flex; justify-content: space-between; align-items: center;">' +
      '<div class="title-row" style="display: flex; align-items: center; gap: 10px;">' +
        '<span class="item-icon" aria-hidden="true" style="font-size: 1.25rem; display: inline-flex; align-items: center;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d4af37" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg></span>' +
        '<h3 class="item-title" style="margin: 0; font-size: 1.02rem; color: #d4af37; font-family: Cinzel, serif;">Bancada de ' + escapeHtml(title) + '</h3>' +
      '</div>' +
      '<div class="badges" style="display: flex; gap: 6px;">' +
        '<span class="badge" style="background: #182230; color: #cbd5e1; border: 1px solid #28364b; font-size: 0.7rem; text-transform: uppercase;">Manufatura T20</span>' +
      '</div>' +
    '</div>' +
    '<div class="item-stats" style="padding: 10px 14px; font-size: 0.78rem; color: #94a3b8; display: grid; grid-template-columns: repeat(2, minmax(110px, 1fr)); gap: 8px; border-bottom: 1px solid #1a2332;">' +
      '<div><strong>Custo MP:</strong> Matéria-prima = ⅓ do Preço</div>' +
      '<div><strong>Fabricação:</strong> CD 15 ou CD 20 de Manufatura</div>' +
      '<div><strong>Tempo:</strong> 1 semana</div>' +
      '<div><strong>Regra:</strong> Tormenta20 p. 121</div>' +
    '</div>' +
    '<div class="card-body" style="padding: 14px 16px; font-size: 0.82rem; line-height: 1.5; color: #cbd5e1; flex: 1; display: flex; flex-direction: column; justify-content: space-between; gap: 10px;">' +
      '<div class="workshop-block">' +
        '<strong style="color: #f1f5f9; display: block; margin-bottom: 4px; font-size: 0.84rem;">Produção Mundana Especializada:</strong>' +
        '<div style="color: #94a3b8; line-height: 1.45;">Criação de itens artesanais de alta qualidade com desconto de ⅓ do preço em matérias-primas e aprimoramento de equipamentos existentes.</div>' +
      '</div>' +
    '</div>' +
    '<div class="card-actions" style="padding: 12px 16px; background: #0a0e16; border-top: 1px solid #1a2332; display: flex; justify-content: flex-end; align-items: center; gap: 8px; flex-shrink: 0; margin-top: auto;">' +
      '<button class="acquire-button" type="button" onclick="window.__workshopBackpackExpanded=true;const b=document.getElementById(\'workshopBackpackContent\');const btn=document.getElementById(\'toggleWorkshopBackpackBtn\');if(b){b.style.display=\'\';if(btn)btn.textContent=\'Recolher Mochila\';b.scrollIntoView({behavior:\'smooth\',block:\'nearest\'});}" style="background: #1e293b; border: 1px solid #475569; color: #f1f5f9; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-weight: 700; font-size: 0.82rem;">Ver Mochila</button>' +
      '<button class="acquire-button" type="button" onclick="const div=document.querySelector(\'.workshop-divider\');if(div){div.scrollIntoView({behavior:\'smooth\',block:\'start\'});}" style="background: linear-gradient(135deg, #1e293b, #334155); border: 1px solid #64748b; color: #ffffff; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 700; font-size: 0.82rem;">Fabricar Novo Item</button>' +
    '</div>' +
  '</article>';
}

function resolverInteligenciaHeroiAtivo() {
  if (typeof window !== 'undefined' && window.ForjaTopBar && typeof window.ForjaTopBar.obterDadosHeroiAtivo === 'function') {
    try {
      const topData = window.ForjaTopBar.obterDadosHeroiAtivo();
      if (topData && topData.intMod != null && Number(topData.intMod) > 0) {
        return Number(topData.intMod);
      }
    } catch {}
  }
  if (arsenalInitialState?.intMod != null && Number(arsenalInitialState.intMod) > 0) {
    return Number(arsenalInitialState.intMod);
  }
  if (typeof finalAttrs === 'function') {
    try {
      const fa = finalAttrs();
      if (fa && fa.int != null && Number(fa.int) > 0) return Math.max(1, Number(fa.int));
    } catch {}
  }
  const prof = typeof activeCharacterProfile === 'function' ? activeCharacterProfile() : null;
  if (prof?.finalAttrs?.int != null && Number(prof.finalAttrs.int) > 0) return Math.max(1, Number(prof.finalAttrs.int));
  if (prof?.attributes?.int != null && Number(prof.attributes.int) > 0) return Math.max(1, Number(prof.attributes.int));
  try {
    const rawHero = localStorage.getItem('forja-heroi-t20-v1');
    if (rawHero) {
      const hero = JSON.parse(rawHero);
      if (hero?.finalAttrs?.int != null && Number(hero.finalAttrs.int) > 0) return Math.max(1, Number(hero.finalAttrs.int));
      if (hero?.attributes?.int != null && Number(hero.attributes.int) > 0) return Math.max(1, Number(hero.attributes.int));
      if (hero?.identity?.baseAttrs?.int != null) {
        let val = Number(hero.identity.baseAttrs.int);
        if (hero.identity.openRaceAllocations?.int) val += Number(hero.identity.openRaceAllocations.int);
        const raceId = String(hero.identity?.raceId || '').toLowerCase();
        if (raceId === 'kliren' || raceId === 'elfo') val += 2;
        else if (raceId === 'goblin' || raceId === 'qareen') val += 1;
        else if (raceId === 'minotauro') val -= 1;
        if (Array.isArray(hero.identity.raceAttrs)) val += hero.identity.raceAttrs.filter(a => a === 'int').length;
        if (Array.isArray(hero.progression)) {
          hero.progression.forEach(p => {
            if (p && (p.attribute === 'int' || p.chosenAttr === 'int' || p.powerId === 'aumento_de_atributo_int' || (p.powerId === 'aumento_de_atributo' && p.chosenAttr === 'int'))) {
              val += 1;
            }
          });
        }
        if (val > 0) return Math.max(1, val);
      }
    }
  } catch {}
  return 5;
}

function engenhocaWorkshopCardHtml(activeCount = null, maxCount = null) {
  const fabricadas = activeCount != null ? activeCount : (getActiveContraptionsList().length);
  const resolvedInt = resolverInteligenciaHeroiAtivo();
  const maxLimit = maxCount != null && maxCount > 0 ? Math.max(maxCount, resolvedInt) : resolvedInt;
  const atingiuLimite = fabricadas >= maxLimit;

  let craftBtnHtml = '';
  if (atingiuLimite) {
    craftBtnHtml = '<button class="acquire-button is-disabled" type="button" disabled style="background: #1e293b; border: 1px solid #475569; color: #94a3b8; padding: 8px 16px; border-radius: 6px; cursor: not-allowed; font-weight: 700; font-size: 0.82rem; display: inline-flex; align-items: center; gap: 6px; opacity: 0.6;" title="Limite de fabricação atingido (' + maxLimit + ' engenhocas). Desmanche engenhocas antigas para fabricar novas.">' +
      ' Limite atingido (' + fabricadas + '/' + maxLimit + ')' +
    '</button>';
  } else {
    craftBtnHtml = '<button class="acquire-button engenhoca-magic-select-btn" type="button" data-action="choose-engenhoca-spell" style="background: #065f46; border: 1px solid #10b981; color: #ffffff; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 700; font-size: 0.82rem; display: inline-flex; align-items: center; gap: 6px; transition: all 0.15s; box-shadow: 0 2px 8px rgba(0,0,0,0.4);" onmouseover="this.style.borderColor=\'#34d399\';this.style.background=\'#047857\';" onmouseout="this.style.borderColor=\'#10b981\';this.style.background=\'#065f46\';">' +
      ' Fabricar engenhoca' +
    '</button>';
  }

  return '<article class="item-card engenhoca-special-card" style="border: 1px solid #222d3e; background: #0c1118; box-shadow: 0 4px 18px rgba(0, 0, 0, 0.45); border-radius: 8px; display: flex; flex-direction: column; justify-content: space-between; height: 100%; min-height: auto; max-height: none; box-sizing: border-box; overflow: visible;">' +
    '<div class="card-header" style="padding: 12px 16px; border-bottom: 1px solid #1a2332; background: #111722; display: flex; justify-content: space-between; align-items: center;">' +
      '<div class="title-row" style="display: flex; align-items: center; gap: 10px;">' +
        '<span class="item-icon" aria-hidden="true" style="font-size: 1.25rem; display: inline-flex; align-items: center;"><svg class="forja-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#d4af37;"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg></span>' +
        '<h3 class="item-title" style="margin: 0; font-size: 1.02rem; color: #d4af37; font-family: Cinzel, serif;">Bancada do Engenhoqueiro</h3>' +
      '</div>' +
      '<div class="badges" style="display: flex; gap: 6px;">' +
        '<span class="badge" style="background: #182230; color: #cbd5e1; border: 1px solid #28364b; font-size: 0.7rem; text-transform: uppercase;">Ofício (Engenhoqueiro)</span>' +
      '</div>' +
    '</div>' +
    '<div class="item-stats" style="padding: 10px 14px; font-size: 0.78rem; color: #94a3b8; display: grid; grid-template-columns: repeat(2, minmax(110px, 1fr)); gap: 8px; border-bottom: 1px solid #1a2332;">' +
      '<div><strong>Custo MP:</strong> T$ 100 &times; PM</div>' +
      '<div><strong>Fabricação:</strong> CD 20 + PM</div>' +
      '<div><strong>Tempo:</strong> 1 semana</div>' +
      '<div><strong>Defesa / RD:</strong> 15 / 5</div>' +
    '</div>' +
    '<div class="card-body" style="padding: 14px 16px; font-size: 0.82rem; line-height: 1.5; color: #cbd5e1; flex: 1; display: flex; flex-direction: column; justify-content: space-between; gap: 12px;">' +
      '<div class="contraption-block">' +
        '<strong style="color: #f1f5f9; display: block; margin-bottom: 4px; font-size: 0.84rem;">Princípios de Manufatura:</strong>' +
        '<div style="color: #94a3b8; line-height: 1.45;">Engenhocas são invenções mundanas de engenharia que simulam o efeito de magias através de componentes mecânicos e alquímicos.</div>' +
      '</div>' +
      '<div class="contraption-block" style="background: rgba(212,175,55,0.06); border: 1px dashed rgba(212,175,55,0.28); border-radius: 6px; padding: 8px 10px;">' +
        '<strong style="color: #d4af37; font-size: 0.8rem; display: block; margin-bottom: 2px;">Limite de Fabricação:</strong>' +
        '<div style="color: #cbd5e1; font-size: 0.76rem;">Você pode fabricar até ' + maxLimit + ' engenhocas no total (igual à sua Inteligência).' +
          (atingiuLimite ? ' <span style="color:#f87171;font-weight:600;">(Limite atingido! Desmanche engenhocas para fabricar novas)</span>' : '') +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="card-actions" style="padding: 12px 16px; background: #0a0e16; border-top: 1px solid #1a2332; display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-shrink: 0; margin-top: auto;">' +
      '<span class="badge" style="background: #131c28; border: 1px solid #233348; color: ' + (atingiuLimite ? '#f87171' : '#cbd5e1') + '; font-weight: 700; font-size: 0.72rem; padding: 5px 10px; border-radius: 4px;">' + fabricadas + ' / ' + maxLimit + ' FABRICADAS</span>' +
      craftBtnHtml +
    '</div>' +
  '</article>';
}

function workshopBackpackCardHtml(entry) {
  const originalItem = itemById.get(entry.itemId);
  if (!originalItem) return '';
  const item = effectiveItemForOptions(originalItem, entry);
  const typeMeta = TYPE_META[item.tipo] || { label: humanize(item.tipo), icon: '◆' };
  const category = item.categoriaId || 'sem_categoria';
  const displayName = configuredItemName(entry, originalItem);
  const improveChoices = (entry.improvements || []).map(choice => {
    if (choice.id === 'material_especial' && choice.materialId) {
      const mat = materialById.get(choice.materialId);
      return (mat ? mat.nome : humanize(choice.materialId)).replace(/_/g, ' ');
    }
    const imp = improvementById.get(choice.id);
    return (imp ? imp.nome : humanize(choice.id)).replace(/_/g, ' ');
  }).filter(Boolean);

  const texts = item.textos || {};
  let body = renderInfoBlock('', texts.habilidade, 'info-grant');
  body += renderInfoBlock('Regras e uso', texts.variavel, 'info-rule');
  if (texts.descricao) {
    body += '<p class="description"><span class="description-label">Descrição</span><br>' + escapeHtml(texts.descricao) + '</p>';
  }
  if (!body) body = '<p class="no-description">Sem descrição textual cadastrada; consulte as estatísticas acima.</p>';

  const maxAllowedForLevel = typeof getMaxAllowedImprovements === 'function' ? getMaxAllowedImprovements() : 1;
  const currentCount = improveChoices.length;
  const hasReachedLimit = currentCount >= maxAllowedForLevel;
  const lvl = Number(arsenalInitialState?.level) || 1;

  let upgradesBanner = '';
  if (improveChoices.length) {
    upgradesBanner = '<div class="workshop-craft-info" style="margin:6px 0;padding:6px 8px;background:rgba(59,130,246,0.08);border-left:3px solid #3b82f6;border-radius:4px;font-size:0.78rem;">' +
      '<span style="color:#93c5fd;">Melhorias atuais (' + currentCount + '/' + maxAllowedForLevel + '): <strong>' + escapeHtml(improveChoices.join(' · ')) + '</strong></span>' +
    '</div>';
  }

  const isArmeiroSection = arsenalInitialState?.workshopSection === 'armeiro';
  const isReadOnly = Boolean(arsenalInitialState?.workshopReadOnly) && !isArmeiroSection;

  let buttons = '';
  if (arsenalInitialState?.contraptionAttach) {
    const isFixedMagic = typeof isNamedFixedMagicItem === 'function' && isNamedFixedMagicItem(item);
    const isSpecificMagic = typeof isSpecificMagicItem === 'function' && isSpecificMagicItem(item);
    const isLiturgical = typeof isLiturgicalItem === 'function' && isLiturgicalItem(item);
    const hasImps = (Array.isArray(entry.improvements) && entry.improvements.length > 0) ||
                    (Array.isArray(item.melhorias) && item.melhorias.length > 0) ||
                    (Array.isArray(item.melhoriasFixasIds) && item.melhoriasFixasIds.length > 0);
    const hasEncs = (Array.isArray(entry.enchantments) && entry.enchantments.length > 0) ||
                    (Array.isArray(item.encantamentos) && item.encantamentos.length > 0);
    const isSuperior = Boolean(
      item.superior ||
      item.materialEspecialId ||
      item.materialId ||
      entry.materialId ||
      entry.materialEspecialId ||
      item.magico?.materialEspecialId
    );
    const isMundanePure = !hasImps && !hasEncs && !isSuperior && !item.magico && !item.liturgico && !item.especifico && !isFixedMagic && !isSpecificMagic && !isLiturgical;

    if (isMundanePure) {
      buttons = '<button class="button primary workshop-btn-attach-backpack" type="button" data-action="contraption-attach-item" data-source="backpack" data-item-id="' + escapeHtml(item.id) + '" data-instance-id="' + escapeHtml(entry.instanceId) + '" style="width:100% !important;min-height:30px;height:30px;font-size:0.78rem;font-weight:700;background:linear-gradient(180deg,#2563eb 0%,#1d4ed8 100%);border:1px solid #60a5fa;color:#ffffff;border-radius:4px;cursor:pointer;">Acoplar em item</button>';
    } else {
      buttons = '<button class="button is-disabled" type="button" disabled style="width:100% !important;min-height:30px;height:30px;font-size:0.74rem;opacity:0.5;cursor:not-allowed;" title="Apenas itens mundanos sem melhorias ou encantamentos podem alojar engenhocas.">Apenas mundano sem melhorias</button>';
    }
  } else if (isReadOnly) {
    buttons = '<button class="acquire-button is-disabled-level" type="button" disabled style="opacity:0.65;cursor:not-allowed;">Apenas Consulta</button>';
  } else {
    const isAparato = (typeof isAparatoItem === 'function' && isAparatoItem(item)) || APARATOS_CANONICOS_IDS.includes(item.id);
    // Aprimorar — disponível se o item aceita melhorias
    const globalImps = typeof improvements !== 'undefined' && Array.isArray(improvements) ? improvements : [];
    const itemAcceptsImps = !isAparato && globalImps.some(imp => typeof improvementAppliesToItem === 'function' && improvementAppliesToItem(imp, item));
    const isFixedMagic = typeof isNamedFixedMagicItem === 'function' && isNamedFixedMagicItem(item);
    const isSpecificMagic = typeof isSpecificMagicItem === 'function' && isSpecificMagicItem(item);
    const isLiturgical = typeof isLiturgicalItem === 'function' && isLiturgicalItem(item);
    const isSpecialItem = isFixedMagic || isSpecificMagic || isLiturgical || item.magico || item.liturgico || item.especifico;
    const hasEnchantmentsAlready = (entry.enchantments || []).length > 0;

    // Regra T20: Itens específicos (litúrgicos ou não), itens mágicos ou com encantamento NÃO podem receber melhorias!
    // Apenas itens mundanos podem receber melhorias.
    if (itemAcceptsImps && !isSpecialItem && !hasEnchantmentsAlready) {
      if (maxAllowedForLevel <= 0) {
        buttons += '<button class="button workshop-btn-superior is-disabled" type="button" disabled title="Seu personagem ainda não pode adicionar melhorias (requer Inventor nível 2+ ou poder Fabricar Item Superior)." style="flex:1 1 0 !important;min-width:0 !important;width:50% !important;min-height:28px;height:28px;font-size:0.75rem;padding:2px 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-sizing:border-box !important;opacity:0.5;cursor:not-allowed;">Adicionar Melhoria</button>';
      } else if (hasReachedLimit) {
        const limitMsg = 'Este item já possui o máximo de ' + maxAllowedForLevel + ' melhoria(s) permitida(s) para o nível ' + lvl + '.';
        buttons += '<button class="button workshop-btn-superior is-disabled" type="button" disabled title="' + escapeHtml(limitMsg) + '" style="flex:1 1 0 !important;min-width:0 !important;width:50% !important;min-height:28px;height:28px;font-size:0.75rem;padding:2px 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-sizing:border-box !important;opacity:0.5;cursor:not-allowed;">Adicionar Melhoria</button>';
      } else {
        buttons += '<button class="button workshop-btn-superior" type="button" data-action="workshop-upgrade-existing" data-kind="improvements" data-item-id="' + escapeHtml(item.id) + '" data-instance-id="' + escapeHtml(entry.instanceId) + '" style="flex:1 1 0 !important;min-width:0 !important;width:50% !important;min-height:28px;height:28px;font-size:0.75rem;padding:2px 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-sizing:border-box !important;cursor:pointer;">Adicionar Melhoria</button>';
      }
    }

    // Encantar — disponível se o item aceita encantamentos (itens específicos não aceitam)
    const globalEncs = typeof enchantments !== 'undefined' && Array.isArray(enchantments) ? enchantments : [];
    const itemAcceptsEncs = !isAparato && globalEncs.some(enc => typeof enchantmentAppliesToItem === 'function' && enchantmentAppliesToItem(enc, item));
    const maxEncsBackpack = typeof getMaxAllowedEnchantments === 'function' ? getMaxAllowedEnchantments() : 0;
    const currentEncs = (entry.enchantments || []).length;

    if (itemAcceptsEncs && !isSpecialItem) {
      if (maxEncsBackpack <= 0) {
        buttons += '<button class="button workshop-btn-enchanted is-disabled" type="button" disabled title="Requer o poder \'Fabricar Item Mágico\' (Inventor níveis 9, 13 e 17)." style="flex:1 1 0 !important;min-width:0 !important;width:50% !important;min-height:28px;height:28px;font-size:0.75rem;padding:2px 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-sizing:border-box !important;opacity:0.5;cursor:not-allowed;">Adicionar Encantamento</button>';
      } else if (currentEncs >= maxEncsBackpack) {
        buttons += '<button class="button workshop-btn-enchanted is-disabled" type="button" disabled title="Este item já atingiu o limite de ' + maxEncsBackpack + ' encantamento(s) para o nível atual." style="flex:1 1 0 !important;min-width:0 !important;width:50% !important;min-height:28px;height:28px;font-size:0.75rem;padding:2px 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-sizing:border-box !important;opacity:0.5;cursor:not-allowed;">Adicionar Encantamento</button>';
      } else {
        buttons += '<button class="button workshop-btn-enchanted" type="button" data-action="workshop-upgrade-existing" data-kind="enchantments" data-item-id="' + escapeHtml(item.id) + '" data-instance-id="' + escapeHtml(entry.instanceId) + '" style="flex:1 1 0 !important;min-width:0 !important;width:50% !important;min-height:28px;height:28px;font-size:0.75rem;padding:2px 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-sizing:border-box !important;cursor:pointer;">Adicionar Encantamento</button>';
      }
    }

    if (!buttons) {
      buttons = '<span style="color:var(--text-muted,#8899a6);font-size:0.78rem;padding:4px 0;">Nenhuma opção de aprimoramento disponível.</span>';
    }
  }

  const shareCodeMod = typeof CodigoCompartilhamentoItem !== 'undefined' ? CodigoCompartilhamentoItem : null;
  const itemShareCode = shareCodeMod && typeof shareCodeMod.gerar === 'function' ? shareCodeMod.gerar(item, entry) : '';
  const shareBtnHtml = itemShareCode ? (
    '<button type="button" class="btn-copy-share-code" data-share-code="' + escapeHtml(itemShareCode) + '" title="Copiar código T20 do item" style="background:transparent;border:none;color:#38bdf8;cursor:pointer;padding:2px 4px;display:inline-flex;align-items:center;justify-content:center;margin-left:auto;border-radius:4px;" onmouseover="this.style.background=\'rgba(56,189,248,0.15)\'" onmouseout="this.style.background=\'transparent\'">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>' +
    '</button>'
  ) : '';

  return '<article class="item-card acquired" data-type="' + escapeHtml(item.tipo) + '" data-item-id="' + escapeHtml(item.id) + '" data-instance-id="' + escapeHtml(entry.instanceId) + '">' +
    '<div class="card-header"><div class="title-row" style="display:flex;align-items:center;justify-content:space-between;width:100%;"><div style="display:flex;align-items:center;gap:6px;min-width:0;"><span class="item-icon" aria-hidden="true">' + typeMeta.icon + '</span>' +
    '<h3 class="item-title">' + escapeHtml(displayName) + '</h3></div>' + shareBtnHtml + '</div>' +
    '<div class="badges"><span class="badge badge-type-' + escapeHtml(item.tipo) + '">' + escapeHtml(typeMeta.label) + '</span>' +
    '<span class="badge">' + escapeHtml(CATEGORY_LABELS[category] || humanize(category)) + '</span>' +
    '<span class="badge" style="background:#1e3a5f;color:#93c5fd;">Qtd: ' + (entry.quantity || 1) + '</span></div></div>' +
    (typeof itemStatsHtmlBlock === 'function' ? itemStatsHtmlBlock(item) : ('<div class="item-stats">' + itemStats(item) + '</div>')) +
    upgradesBanner +
    '<div class="item-card-detail">' + propertiesHtml(item) + '<div class="card-body">' + body + '</div>' + specificMagicHtml(entry, item) + '</div>' +
    '<div class="card-overlay"><button class="expand-item-button" type="button" data-action="toggle-item" aria-expanded="false"><span class="expand-arrow">▾</span> <span class="expand-text">Ver item completo</span></button>' +
    '<div class="card-actions" style="display:flex !important;flex-direction:row !important;flex-wrap:nowrap !important;gap:6px !important;width:100% !important;padding:8px 12px 10px !important;box-sizing:border-box !important;">' + buttons + '</div></div>' +
  '</article>';

}


const APARATOS_CANONICOS_IDS = [
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

function contraptionPortfolioCardHtml(c) {
  if (!c) return '';
  const isAliado = c.destinatario === 'aliado';
  const forma = c.formaUso === 'vestida' ? 'Vestida' : 'Empunhada';
  const desc = c.descricao || `Artefato inventivo calibrado combinando engrenagens de precisão para reproduzir os efeitos de ${c.spellName || 'magia'}.`;
  const circuloNum = Number(c.circulo) || 1;
  const circuloTexto = ' (' + circuloNum + 'º Círculo)';
  const inventorPv = Number(c.inventorPv || arsenalInitialState?.pv || (typeof activeCharacterProfile === 'function' && activeCharacterProfile()?.pv) || 20);
  const halfPv = Math.max(1, Math.floor(inventorPv / 2));
  // @ts-ignore
  const rules = typeof RegrasManufatura !== 'undefined' ? RegrasManufatura : null;
  const espacosTotal = rules && typeof rules.calcularEspacosEngenhoca === 'function'
    ? rules.calcularEspacosEngenhoca(c.attachedItem, c.espacos)
    : (c.attachedItem ? ((c.attachedItem.espacos != null ? Number(c.attachedItem.espacos) : 0) + 1) : (c.espacos != null ? Number(c.espacos) : 1));
  const espacosTexto = espacosTotal === 1 ? '1 espaço' : `${espacosTotal} espaços`;

  const aparatos = Array.isArray(c.apparatuses) ? c.apparatuses : (Array.isArray(c.aparatos) ? c.aparatos : (Array.isArray(c.apparatus) ? c.apparatus : []));
  const numAparatos = aparatos.length;
  const hasPersonalizado = Boolean(
    arsenalInitialState?.hasAparatoPersonalizado ||
    (typeof activeCharacterProfile === 'function' && activeCharacterProfile()?.hasAparatoPersonalizado) ||
    (typeof characterProfiles !== 'undefined' && characterProfiles.profiles?.some(p => p.hasAparatoPersonalizado))
  );

  const bonusAparatos = rules && typeof rules.calcularBonusCdAparatos === 'function'
    ? rules.calcularBonusCdAparatos(numAparatos, hasPersonalizado)
    : (numAparatos === 1 ? (hasPersonalizado ? 0 : 2) : (numAparatos >= 2 ? (hasPersonalizado ? 3 : 5) : 0));

  const pm = Number(c.pm) || 1;
  const cdCalculada = 15 + pm + bonusAparatos;

  const hasEstabilizador = aparatos.some(ap => {
    const id = typeof ap === 'string' ? ap : (ap?.id || ap?.itemId || '');
    return id === 'estabilizador';
  });

  const numEsperas = aparatos.filter(ap => {
    const id = typeof ap === 'string' ? ap : (ap?.id || ap?.itemId || '');
    return id === 'espera_para_melhorias' || id.includes('espera');
  }).length;

  return '<article class="item-card contraption-portfolio-card" data-contraption-id="' + escapeHtml(c.id) + '" style="border: 1px solid #222d3e; background: #0c1118; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 4px 14px rgba(0,0,0,0.45); height: auto; min-height: auto; max-height: none; width: 100% !important; min-width: 0 !important; max-width: 100% !important; box-sizing: border-box !important;">' +
    '<div class="card-header" style="padding: 12px 16px 10px; background: #111722; border-bottom: 1px solid #1a2332;">' +
      '<div class="title-row" style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">' +
        '<div style="display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1;">' +
          '<span class="item-icon" aria-hidden="true" style="font-size: 1.15rem; flex-shrink: 0;"></span>' +
          '<h3 class="item-title" style="margin: 0; font-size: 0.98rem; color: #d4af37; font-family: Cinzel, serif; letter-spacing: 0.5px; text-transform: uppercase; white-space: normal; overflow: hidden; text-overflow: ellipsis;">' + escapeHtml(c.nome || 'Engenhoca') + '</h3>' +
        '</div>' +
        (isAliado ? '<div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;"><span class="badge" style="background: #181c24; border: 1px solid #2b3544; color: #94a3b8; font-size: 0.68rem; white-space: nowrap; text-transform: uppercase;">Com Aliado</span></div>' : '') +
      '</div>' +
      '<div class="badges" style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px;">' +
        '<span class="badge" style="background: #161e2b; border: 1px solid #253347; color: #cbd5e1; font-size: 0.72rem; text-transform: uppercase; font-weight: 700;">' + escapeHtml(c.spellName || 'Magia') + '</span>' +
        '<span class="badge" style="background: #161e2b; border: 1px solid #253347; color: #cbd5e1; font-size: 0.72rem; text-transform: uppercase; font-weight: 700;">' + forma.toUpperCase() + '</span>' +
      '</div>' +
    '</div>' +
    '<div class="card-body" style="padding: 14px 16px; font-size: 0.82rem; color: #cbd5e1; line-height: 1.5; flex: 1; display: flex; flex-direction: column; gap: 12px;">' +
      '<div class="contraption-block">' +
        '<strong style="color: #f1f5f9; display: block; margin-bottom: 2px; font-size: 0.84rem;">Descrição:</strong>' +
        '<div style="color: #94a3b8; line-height: 1.45;">' + escapeHtml(desc) + '</div>' +
      '</div>' +
      '<div class="contraption-block">' +
        '<strong style="color: #f1f5f9; display: block; margin-bottom: 2px; font-size: 0.84rem;">Magia simulada:</strong>' +
        '<div style="color: #cbd5e1;">' + escapeHtml(c.spellName || 'Magia') + escapeHtml(circuloTexto) + '</div>' +
      '</div>' +
      '<div class="contraption-block">' +
        '<strong style="color: #f1f5f9; display: block; margin-bottom: 2px; font-size: 0.84rem;">Atributos:</strong>' +
        '<div style="color: #94a3b8; font-size: 0.78rem; line-height: 1.45;">' +
          escapeHtml(espacosTexto) + ' · Minúsculo · RD 5 · Defesa 15 · Ativação: ação padrão · CD ' + cdCalculada + ' + PM · <strong style="color: #f1f5f9;">PV ' + halfPv + '</strong>' +
        '</div>' +
        (hasEstabilizador ? '<div style="color: #38bdf8; font-size: 0.76rem; margin-top: 3px; font-weight: 600;">Estabilizador acoplado: +2 na CD para resistir à magia simulada</div>' : '') +
        (numEsperas > 0 ? '<div style="color: #60a5fa; font-size: 0.76rem; margin-top: 2px;">Espera para Melhorias instalada: permite até ' + numEsperas + ' melhoria(s) no item acoplado</div>' : '') +
      '</div>' +
      '<div class="contraption-block">' +
        '<strong style="color: #f1f5f9; display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px; font-size: 0.84rem;">' +
          '<span>Aparatos instalados (' + numAparatos + '/2):</span>' +
        '</strong>' +
        (numAparatos > 0
          ? '<div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 2px;">' +
              aparatos.map(ap => {
                const apId = typeof ap === 'string' ? ap : (ap?.id || ap?.itemId || '');
                const it = itemById.get(apId);
                return '<span class="badge" style="background: #141e2e; border: 1px solid #283e5c; color: #93c5fd; font-size: 0.72rem; padding: 2px 7px; border-radius: 4px;">' + escapeHtml(it?.nome || apId) + '</span>';
              }).join('') +
            '</div>'
          : '<div style="color: #64748b; font-size: 0.76rem; font-style: italic;">Nenhum aparato instalado (suporta até 2).</div>'
        ) +
      '</div>' +
      (c.attachedItem ? (
        '<div class="contraption-block">' +
          '<strong style="color: #f1f5f9; display: block; margin-bottom: 2px; font-size: 0.84rem;">Atributos do item: ' + escapeHtml(c.attachedItem.nome || 'Item Acoplado') + '</strong>' +
          '<div style="color: #cbd5e1; font-size: 0.8rem; line-height: 1.45;">' + escapeHtml(c.attachedItem.atributosTexto || 'Item mundano acoplado à engenhoca.') + '</div>' +
        '</div>'
      ) : '') +
    '</div>' +
    '<div class="card-actions" style="padding: 10px 16px; background: #0a0e16; border-top: 1px solid #1a2332; display: flex; justify-content: space-between; align-items: center; gap: 8px;">' +
      '<div style="display: flex; align-items: center; gap: 8px;">' +
        '<button type="button" class="button small" data-action="view-simulated-spell" data-spell-id="' + escapeHtml(c.spellId || '') + '" data-spell-name="' + escapeHtml(c.spellName || '') + '" style="background: #161e2b; border: 1px solid #2a3a52; color: #93c5fd; font-size: 0.74rem; padding: 5px 12px; border-radius: 4px; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; font-weight: 600;" onmouseover="this.style.borderColor=\'#3b82f6\'" onmouseout="this.style.borderColor=\'#2a3a52\'">' +
          ' Ver magia simulada' +
        '</button>' +
        '<button type="button" class="button small" data-action="manage-apparatus" data-contraption-id="' + escapeHtml(c.id) + '" style="background: #161e2b; border: 1px solid #2a3a52; color: #cbd5e1; font-size: 0.74rem; padding: 5px 12px; border-radius: 4px; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; font-weight: 600;" onmouseover="this.style.borderColor=\'#38bdf8\';this.style.color=\'#38bdf8\';" onmouseout="this.style.borderColor=\'#2a3a52\';this.style.color=\'#cbd5e1\';">' +
          ' Aparatos ' + numAparatos + '/2' +
        '</button>' +
        (() => {
          const mod = typeof CodigoCompartilhamentoItem !== 'undefined' ? CodigoCompartilhamentoItem : null;
          const code = mod && typeof mod.gerar === 'function' ? mod.gerar(c, c) : '';
          if (!code) return '';
          return '<button type="button" class="button small btn-copy-share-code" data-share-code="' + escapeHtml(code) + '" title="Copiar código T20 da engenhoca" style="background: #161e2b; border: 1px solid #2a3a52; color: #38bdf8; font-size: 0.74rem; padding: 5px 8px; border-radius: 4px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;" onmouseover="this.style.borderColor=\'#38bdf8\'" onmouseout="this.style.borderColor=\'#2a3a52\'">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>' +
          '</button>';
        })() +
      '</div>' +
      '<button type="button" class="button small" data-action="disassemble-contraption" data-contraption-id="' + escapeHtml(c.id) + '" style="background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; color: #fca5a5; font-size: 0.72rem; padding: 5px 12px; border-radius: 4px; cursor: pointer; transition: all 0.15s; font-weight: 600;" onmouseover="this.style.background=\'#ef4444\';this.style.color=\'#fff\';" onmouseout="this.style.background=\'rgba(239, 68, 68, 0.1)\';this.style.color=\'#fca5a5\';">Desmanchar</button>' +
    '</div>' +
  '</article>';
}

function apparatusBackpackCardHtml(entry, it) {
  const nome = entry.displayName || entry.itemName || it.nome || 'Aparato';
  const habilidade = it.textos?.habilidade || it.descricao || 'Aparato mecânico para calibrar engenhocas.';
  const variavel = it.textos?.variavel || '';
  const qtd = Math.max(1, Number(entry.quantity) || 1);
  const qtdTexto = qtd > 1 ? ' (x' + qtd + ')' : '';

  return '<article class="item-card apparatus-backpack-card" data-backpack-instance-id="' + escapeHtml(entry.instanceId || '') + '" data-item-id="' + escapeHtml(it.id) + '" style="border: 1px solid #1e293b; background: #0a0f18; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 4px 12px rgba(0,0,0,0.4); height: auto;">' +
    '<div class="card-header" style="padding: 10px 14px 8px; background: #0f1724; border-bottom: 1px solid #1a2436;">' +
      '<div class="title-row" style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">' +
        '<div style="display: flex; align-items: center; gap: 8px;">' +
          '<span style="font-size: 1.1rem;"></span>' +
          '<h4 style="margin: 0; font-size: 0.92rem; color: #cbd5e1; font-family: Cinzel, serif; letter-spacing: 0.4px;">' + escapeHtml(nome) + escapeHtml(qtdTexto) + '</h4>' +
        '</div>' +
        '<span class="badge" style="background: #142030; border: 1px solid #23364f; color: #38bdf8; font-size: 0.68rem; font-weight: 700; text-transform: uppercase;">Na Mochila</span>' +
      '</div>' +
      '<div class="badges" style="display: flex; gap: 6px; margin-top: 6px;">' +
        '<span class="badge" style="background: #131a26; border: 1px solid #1f2a3c; color: #94a3b8; font-size: 0.68rem; text-transform: uppercase;">0 Espaços</span>' +
        '<span class="badge" style="background: #131a26; border: 1px solid #1f2a3c; color: #94a3b8; font-size: 0.68rem; text-transform: uppercase;">Instalação: 1h</span>' +
      '</div>' +
    '</div>' +
    '<div class="card-body" style="padding: 12px 14px; font-size: 0.8rem; color: #cbd5e1; line-height: 1.45; flex: 1; display: flex; flex-direction: column; gap: 8px;">' +
      '<div><strong style="color: #f1f5f9; display: block; margin-bottom: 2px;">Efeito:</strong><span style="color: #94a3b8;">' + escapeHtml(habilidade) + '</span></div>' +
      (variavel ? '<div><strong style="color: #f1f5f9; display: block; margin-bottom: 2px;">Regra de acoplamento:</strong><span style="color: #cbd5e1; font-size: 0.76rem;">' + escapeHtml(variavel) + '</span></div>' : '') +
    '</div>' +
    '<div class="card-actions" style="padding: 10px 14px; background: #080c14; border-top: 1px solid #1a2436; display: flex; justify-content: flex-end; align-items: center; gap: 8px;">' +
      '<button type="button" class="button small" data-action="attach-backpack-apparatus" data-item-id="' + escapeHtml(it.id) + '" data-instance-id="' + escapeHtml(entry.instanceId || '') + '" style="background: #162234; border: 1px solid #2a3c56; color: #38bdf8; font-size: 0.74rem; padding: 5px 12px; border-radius: 4px; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; font-weight: 600;" onmouseover="this.style.borderColor=\'#38bdf8\'" onmouseout="this.style.borderColor=\'#2a3c56\'">' +
        ' Acoplar em Engenhoca' +
      '</button>' +
    '</div>' +
  '</article>';
}

function apparatusCatalogCardHtml(it) {
  const nome = it.nome || 'Aparato';
  const precoIntegral = Number(it.preco?.valor ?? it.price ?? 300);
  const custoMateriaPrima = Math.ceil(precoIntegral / 3);
  const habilidade = it.textos?.habilidade || it.descricao || 'Aparato mecânico para engenhocas.';
  const variavel = it.textos?.variavel || '';

  return '<article class="item-card apparatus-catalog-card" data-item-id="' + escapeHtml(it.id) + '" style="border: 1px solid #202b3d; background: #0a0e17; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 4px 12px rgba(0,0,0,0.4); height: auto;">' +
    '<div class="card-header" style="padding: 12px 14px 8px; background: #111724; border-bottom: 1px solid #1b2638;">' +
      '<div class="title-row" style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">' +
        '<div style="display: flex; align-items: center; gap: 8px;">' +
          '<span style="font-size: 1.15rem;"></span>' +
          '<h4 style="margin: 0; font-size: 0.94rem; color: #d4af37; font-family: Cinzel, serif; letter-spacing: 0.4px;">' + escapeHtml(nome) + '</h4>' +
        '</div>' +
        '<span class="badge" style="background: #171d2b; border: 1px solid #26334a; color: #cbd5e1; font-size: 0.72rem; font-weight: 700;">T$ ' + precoIntegral + '</span>' +
      '</div>' +
      '<div class="badges" style="display: flex; gap: 6px; margin-top: 6px;">' +
        '<span class="badge" style="background: #16202f; border: 1px solid #27374f; color: #60a5fa; font-size: 0.68rem; font-weight: 700; text-transform: uppercase;">CD 20 · 1 hora</span>' +
        '<span class="badge" style="background: #131a26; border: 1px solid #1f2a3c; color: #94a3b8; font-size: 0.68rem; text-transform: uppercase;">0 Espaços</span>' +
      '</div>' +
    '</div>' +
    '<div class="card-body" style="padding: 12px 14px; font-size: 0.8rem; color: #cbd5e1; line-height: 1.45; flex: 1; display: flex; flex-direction: column; gap: 8px;">' +
      '<div><strong style="color: #f1f5f9; display: block; margin-bottom: 2px;">Efeito:</strong><span style="color: #94a3b8;">' + escapeHtml(habilidade) + '</span></div>' +
      (variavel ? '<div><strong style="color: #f1f5f9; display: block; margin-bottom: 2px;">Regra de acoplamento:</strong><span style="color: #cbd5e1; font-size: 0.76rem;">' + escapeHtml(variavel) + '</span></div>' : '') +
    '</div>' +
    '<div class="card-actions" style="padding: 10px 14px; background: #080c14; border-top: 1px solid #1b2638; display: flex; justify-content: flex-end; align-items: center; gap: 8px;">' +
      '<button type="button" class="button small" data-action="craft-apparatus" data-item-id="' + escapeHtml(it.id) + '" style="background: #132238; border: 1px solid #243c60; color: #60a5fa; font-size: 0.74rem; padding: 5px 12px; border-radius: 4px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; font-weight: 600;" onmouseover="this.style.borderColor=\'#3b82f6\'" onmouseout="this.style.borderColor=\'#243c60\'">' +
        ' Forjar (T$ ' + custoMateriaPrima + ')' +
      '</button>' +
      '<button type="button" class="button small" data-action="buy-apparatus" data-item-id="' + escapeHtml(it.id) + '" style="background: #1f1b13; border: 1px solid #4a3e26; color: #fbbf24; font-size: 0.74rem; padding: 5px 12px; border-radius: 4px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; font-weight: 600;" onmouseover="this.style.borderColor=\'#f59e0b\'" onmouseout="this.style.borderColor=\'#4a3e26\'">' +
        'Comprar (T$ ' + precoIntegral + ')' +
      '</button>' +
    '</div>' +
  '</article>';
}

function openSimulatedSpellModal(spellId, spellName) {
  let spellHtml = '';
  // @ts-ignore
  const cards = typeof SPELL_CARDS !== 'undefined' ? SPELL_CARDS : null;
  const rawId = (spellId || '').trim().toLowerCase();
  const normalizedId = rawId.replace(/\s+/g, '-');

  if (cards) {
    if (cards[spellId]) spellHtml = cards[spellId];
    else if (cards[rawId]) spellHtml = cards[rawId];
    else if (cards[normalizedId]) spellHtml = cards[normalizedId];
    else {
      const cleanName = (spellName || '').trim().toLowerCase();
      const foundKey = Object.keys(cards).find(key => {
        const raw = cards[key];
        return key === normalizedId || (cleanName && raw.toLowerCase().includes('data-name="' + cleanName + '"'));
      });
      if (foundKey) spellHtml = cards[foundKey];
    }
  }

  let modal = document.getElementById('simulatedSpellModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'simulatedSpellModal';
    modal.className = 'modal-backdrop';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(4,7,14,0.85);backdrop-filter:blur(6px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;';
    document.body.appendChild(modal);
  }

  const cleanContent = spellHtml
    ? spellHtml.replace(/<button class="learn-btn"[\s\S]*?<\/button>/gi, '').replace(/<div class="card-overlay"[\s\S]*?<\/div>/gi, '')
    : '<div style="padding:20px;color:#94a3b8;font-size:0.9rem;">Magia <strong>' + escapeHtml(spellName || spellId) + '</strong> simulada pelo aparato mecânico. Consulte os efeitos no Grimório.</div>';

  modal.innerHTML = '<div class="modal-dialog" style="max-width:560px;width:100%;background:#0e131d;border:1px solid #233044;border-radius:12px;box-shadow:0 16px 48px rgba(0,0,0,0.9);overflow:hidden;animation:fadeIn 0.15s ease-out;display:flex;flex-direction:column;max-height:90vh;">' +
    '<header style="padding:12px 18px;background:#131a26;border-bottom:1px solid #1e2837;display:flex;justify-content:space-between;align-items:center;">' +
      '<div style="display:flex;align-items:center;gap:8px;">' +
        '<span style="font-size:1.15rem;">Encantar</span>' +
        '<h3 style="margin:0;font-size:1rem;color:#d4af37;font-family:Cinzel,serif;">Magia Simulada · ' + escapeHtml(spellName || 'Grimório') + '</h3>' +
      '</div>' +
      '<button type="button" class="button small" data-action="close-simulated-spell" style="background:transparent;border:1px solid #2a3a52;color:#94a3b8;padding:4px 9px;border-radius:4px;cursor:pointer;font-weight:700;">×</button>' +
    '</header>' +
    '<div style="padding:16px;overflow-y:auto;flex:1;">' +
      '<style>' +
        '#simulatedSpellModal .card { background: #111722; border: 1px solid #222d3e; border-radius: 8px; overflow: hidden; }' +
        '#simulatedSpellModal .card-header { padding: 12px 16px; border-bottom: 1px solid #1a2332; background: #151d2b; }' +
        '#simulatedSpellModal .card-title-row { display: flex; align-items: center; gap: 8px; }' +
        '#simulatedSpellModal .card-title { margin: 0; font-size: 1.05rem; color: #d4af37; font-family: Cinzel, serif; }' +
        '#simulatedSpellModal .card-badges { display: flex; gap: 6px; margin-top: 6px; }' +
        '#simulatedSpellModal .card-props { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; padding: 10px 16px; background: #0c1118; border-bottom: 1px solid #1a2332; font-size: 0.8rem; }' +
        '#simulatedSpellModal .prop-row { display: flex; gap: 6px; }' +
        '#simulatedSpellModal .prop-label { color: #d4af37; font-weight: 700; }' +
        '#simulatedSpellModal .prop-value { color: #cbd5e1; }' +
        '#simulatedSpellModal .card-desc { padding: 12px 16px; font-size: 0.84rem; line-height: 1.5; color: #cbd5e1; }' +
        '#simulatedSpellModal .apr-section { padding: 10px 16px 14px; border-top: 1px solid #1a2332; background: #0a0e16; }' +
        '#simulatedSpellModal .apr-title { color: #d4af37; font-weight: 700; font-size: 0.82rem; margin-bottom: 6px; }' +
        '#simulatedSpellModal .apr-list { margin: 0; padding-left: 20px; font-size: 0.8rem; color: #94a3b8; line-height: 1.45; }' +
        '#simulatedSpellModal .cond-link { color: #f87171; text-decoration: underline dotted #f87171; }' +
      '</style>' +
      cleanContent +
    '</div>' +
    '<footer style="padding:10px 18px;background:#0b0f17;border-top:1px solid #1e2837;display:flex;justify-content:flex-end;">' +
      '<button type="button" class="button" data-action="close-simulated-spell" style="background:#192230;border:1px solid #33435c;color:#cbd5e1;padding:6px 16px;border-radius:6px;cursor:pointer;">Fechar</button>' +
    '</footer>' +
  '</div>';
  modal.hidden = false;
  modal.style.display = 'flex';
}

function openManageApparatusModal(contraptionId) {
  const contraptionsList = getActiveContraptionsList();
  const c = contraptionsList.find(item => item.id === contraptionId);
  if (!c) {
    if (typeof showToast === 'function') showToast('Engenhoca não encontrada.');
    return;
  }

  let modal = document.getElementById('manageApparatusModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'manageApparatusModal';
    modal.className = 'modal-backdrop';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(4,7,14,0.85);backdrop-filter:blur(6px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;';
    document.body.appendChild(modal);
  }

  const aparatos = Array.isArray(c.apparatuses) ? c.apparatuses : (Array.isArray(c.aparatos) ? c.aparatos : (Array.isArray(c.apparatus) ? c.apparatus : []));
  const numAparatos = aparatos.length;
  const userBackpack = (typeof activeCharacterProfile === 'function' && activeCharacterProfile()?.backpack) || backpackItems || [];
  const spareApparatusEntries = userBackpack.filter(entry => {
    const it = itemById.get(entry.itemId);
    return (it && (it.categoriaId === 'aparato' || it.tipo === 'aparato')) || APARATOS_CANONICOS_IDS.includes(entry.itemId);
  });

  let installedHtml = '';
  if (numAparatos === 0) {
    installedHtml = '<div style="padding: 12px 14px; background: #0c1118; border: 1px dashed #202b3d; border-radius: 6px; color: #94a3b8; font-size: 0.8rem;">' +
      'Nenhum aparato instalado no momento. Você pode instalar até 2 aparatos.' +
    '</div>';
  } else {
    installedHtml = '<div style="display: flex; flex-direction: column; gap: 8px;">' +
      aparatos.map(ap => {
        const apId = typeof ap === 'string' ? ap : (ap?.id || ap?.itemId || '');
        const it = itemById.get(apId) || { id: apId, nome: apId, textos: {} };
        const hab = it.textos?.habilidade || it.descricao || 'Aparato mecânico.';
        return '<div style="padding: 10px 14px; background: #111722; border: 1px solid #233146; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; gap: 10px;">' +
          '<div>' +
            '<div style="font-weight: 700; color: #93c5fd; font-size: 0.86rem; display: flex; align-items: center; gap: 6px;">' +
              ' ' + escapeHtml(it.nome || apId) +
            '</div>' +
            '<div style="font-size: 0.76rem; color: #94a3b8; margin-top: 2px;">' + escapeHtml(hab) + '</div>' +
          '</div>' +
          '<button type="button" class="button small" data-action="remove-apparatus-from-contraption" data-contraption-id="' + escapeHtml(c.id) + '" data-apparatus-id="' + escapeHtml(apId) + '" style="background: transparent; border: 1px solid #ef4444; color: #fca5a5; font-size: 0.72rem; padding: 4px 10px; border-radius: 4px; cursor: pointer; white-space: nowrap;">Desacoplar</button>' +
        '</div>';
      }).join('') +
    '</div>';
  }

  let availableHtml = '';
  if (numAparatos >= 2) {
    availableHtml = '<div style="padding: 10px 14px; background: #131720; border: 1px solid #253347; border-radius: 6px; color: #cbd5e1; font-size: 0.8rem;">' +
      'Limite máximo de 2 aparatos atingido para esta engenhoca.' +
    '</div>';
  } else if (spareApparatusEntries.length === 0) {
    availableHtml = '<div style="padding: 12px 14px; background: #0c1118; border: 1px dashed #202b3d; border-radius: 6px; color: #94a3b8; font-size: 0.8rem; line-height: 1.45;">' +
      'Você não possui nenhum aparato sobressalente na mochila. Forje ou compre novos aparatos no catálogo da Oficina do Engenhoqueiro logo abaixo.' +
    '</div>';
  } else {
    availableHtml = '<div style="display: flex; flex-direction: column; gap: 8px;">' +
      spareApparatusEntries.map(entry => {
        const it = itemById.get(entry.itemId) || { id: entry.itemId, nome: entry.displayName || entry.itemName || 'Aparato', textos: {} };
        const hab = it.textos?.habilidade || it.descricao || 'Aparato mecânico.';
        return '<div style="padding: 10px 14px; background: #111722; border: 1px solid #233146; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; gap: 10px;">' +
          '<div>' +
            '<div style="font-weight: 700; color: #38bdf8; font-size: 0.86rem; display: flex; align-items: center; gap: 6px;">' +
              ' ' + escapeHtml(it.nome || entry.displayName || entry.itemName || entry.itemId) +
            '</div>' +
            '<div style="font-size: 0.76rem; color: #94a3b8; margin-top: 2px;">' + escapeHtml(hab) + '</div>' +
          '</div>' +
          '<button type="button" class="button small" data-action="install-apparatus-on-contraption" data-contraption-id="' + escapeHtml(c.id) + '" data-apparatus-id="' + escapeHtml(it.id) + '" data-instance-id="' + escapeHtml(entry.instanceId || '') + '" style="background: #162438; border: 1px solid #2a4163; color: #38bdf8; font-size: 0.72rem; padding: 4px 10px; border-radius: 4px; cursor: pointer; white-space: nowrap;">Instalar</button>' +
        '</div>';
      }).join('') +
    '</div>';
  }

  modal.innerHTML = '<div class="modal-dialog" style="max-width:540px;width:100%;background:#0e131d;border:1px solid #233044;border-radius:12px;box-shadow:0 16px 48px rgba(0,0,0,0.9);overflow:hidden;display:flex;flex-direction:column;max-height:90vh;">' +
    '<header style="padding:14px 18px;background:#131a26;border-bottom:1px solid #1e2837;display:flex;justify-content:space-between;align-items:center;">' +
      '<div>' +
        '<h3 style="margin:0;font-size:1.02rem;color:#d4af37;font-family:Cinzel,serif;display:flex;align-items:center;gap:8px;">' +
          ' Gerenciar Aparatos · ' + escapeHtml(c.nome || 'Engenhoca') +
        '</h3>' +
        '<span style="font-size:0.75rem;color:#94a3b8;">Limite de até 2 aparatos. Acoplar ou remover exige 1 hora de trabalho.</span>' +
      '</div>' +
      '<button type="button" class="button small" data-action="close-manage-apparatus" style="background:transparent;border:1px solid #2a3a52;color:#94a3b8;padding:4px 9px;border-radius:4px;cursor:pointer;font-weight:700;">×</button>' +
    '</header>' +
    '<div style="padding:16px;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:16px;">' +
      '<div>' +
        '<div style="font-size:0.84rem;font-weight:700;color:#cbd5e1;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px;">Aparatos Instalados (' + numAparatos + '/2)</div>' +
        installedHtml +
      '</div>' +
      '<div>' +
        '<div style="font-size:0.84rem;font-weight:700;color:#cbd5e1;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px;">Aparatos na Mochila (Prontos para Instalar)</div>' +
        availableHtml +
      '</div>' +
    '</div>' +
    '<footer style="padding:12px 18px;background:#0b0f17;border-top:1px solid #1e2837;display:flex;justify-content:flex-end;">' +
      '<button type="button" class="button" data-action="close-manage-apparatus" style="background:#192230;border:1px solid #33435c;color:#cbd5e1;padding:6px 16px;border-radius:6px;cursor:pointer;">Concluir</button>' +
    '</footer>' +
  '</div>';

  modal.hidden = false;
  modal.style.display = 'flex';
}

function openAttachApparatusChooserModal(apId, backpackInstanceId) {
  const contraptionsList = getActiveContraptionsList();
  const eligible = contraptionsList.filter(c => {
    const aps = Array.isArray(c.apparatuses) ? c.apparatuses : (Array.isArray(c.aparatos) ? c.aparatos : (Array.isArray(c.apparatus) ? c.apparatus : []));
    return aps.length < 2;
  });

  if (!eligible.length) {
    if (typeof showToast === 'function') showToast('Todas as suas engenhocas já atingiram o limite máximo de 2 aparatos.');
    return;
  }

  if (eligible.length === 1) {
    installApparatusOnContraption(eligible[0].id, apId, backpackInstanceId);
    return;
  }

  let modal = document.getElementById('chooseContraptionModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'chooseContraptionModal';
    modal.className = 'modal-backdrop';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(4,7,14,0.85);backdrop-filter:blur(6px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;';
    document.body.appendChild(modal);
  }

  const it = itemById.get(apId);
  const apNome = it?.nome || apId;

  modal.innerHTML = '<div class="modal-dialog" style="max-width:480px;width:100%;background:#0e131d;border:1px solid #233044;border-radius:12px;box-shadow:0 16px 48px rgba(0,0,0,0.9);overflow:hidden;display:flex;flex-direction:column;">' +
    '<header style="padding:14px 18px;background:#131a26;border-bottom:1px solid #1e2837;display:flex;justify-content:space-between;align-items:center;">' +
      '<h3 style="margin:0;font-size:0.98rem;color:#d4af37;font-family:Cinzel,serif;">Acoplar · ' + escapeHtml(apNome) + '</h3>' +
      '<button type="button" class="button small" data-action="close-choose-contraption-modal" style="background:transparent;border:1px solid #2a3a52;color:#94a3b8;padding:4px 9px;border-radius:4px;cursor:pointer;font-weight:700;">×</button>' +
    '</header>' +
    '<div style="padding:16px;display:flex;flex-direction:column;gap:10px;">' +
      '<div style="font-size:0.82rem;color:#94a3b8;">Escolha em qual de suas engenhocas deseja instalar este aparato:</div>' +
      eligible.map(c => {
        const aps = Array.isArray(c.apparatuses) ? c.apparatuses : (Array.isArray(c.aparatos) ? c.aparatos : (Array.isArray(c.apparatus) ? c.apparatus : []));
        return '<button type="button" class="button select-contraption-btn" data-action="select-contraption-for-apparatus" data-contraption-id="' + escapeHtml(c.id) + '" data-apparatus-id="' + escapeHtml(apId) + '" data-instance-id="' + escapeHtml(backpackInstanceId || '') + '" style="background:#121824;border:1px solid #233146;color:#f1f5f9;padding:10px 14px;border-radius:6px;cursor:pointer;text-align:left;display:flex;justify-content:space-between;align-items:center;width:100%;">' +
          '<div>' +
            '<div style="font-weight:700;font-size:0.88rem;color:#cbd5e1;">' + escapeHtml(c.nome || 'Engenhoca') + '</div>' +
            '<div style="font-size:0.75rem;color:#94a3b8;margin-top:2px;">Simula: ' + escapeHtml(c.spellName || 'Magia') + '</div>' +
          '</div>' +
          '<span class="badge" style="background:#182232;border:1px solid #2c3e58;color:#38bdf8;font-size:0.72rem;">' + aps.length + '/2 aparatos</span>' +
        '</button>';
      }).join('') +
    '</div>' +
    '<footer style="padding:12px 18px;background:#0b0f17;border-top:1px solid #1e2837;display:flex;justify-content:flex-end;">' +
      '<button type="button" class="button" data-action="close-choose-contraption-modal" style="background:#192230;border:1px solid #33435c;color:#cbd5e1;padding:6px 16px;border-radius:6px;cursor:pointer;">Cancelar</button>' +
    '</footer>' +
  '</div>';

  modal.hidden = false;
  modal.style.display = 'flex';
}

function installApparatusOnContraption(contraptionId, apId, backpackInstanceId) {
  const profile = typeof activeCharacterProfile === 'function' ? activeCharacterProfile() : null;
  const portfolio = (typeof arsenalInitialState !== 'undefined' && Array.isArray(arsenalInitialState.contraptions))
    ? arsenalInitialState.contraptions
    : (profile && Array.isArray(profile.contraptions) ? profile.contraptions : []);

  let target = portfolio.find(c => c && c.id === contraptionId);
  const userBackpack = profile?.backpack || backpackItems || [];

  // Se não estiver no portfólio, procura na mochila
  if (!target) {
    const entry = userBackpack.find(e => e.instanceId === contraptionId || e.itemId === contraptionId);
    if (entry) {
      entry.engenhocaInfo = entry.engenhocaInfo || {};
      target = entry.engenhocaInfo;
      target.id = contraptionId;
      portfolio.push(target);
    }
  }

  if (!target) {
    if (typeof showToast === 'function') showToast('Engenhoca não encontrada.');
    return;
  }

  target.apparatuses = Array.isArray(target.apparatuses) ? target.apparatuses : (Array.isArray(target.aparatos) ? target.aparatos : (Array.isArray(target.apparatus) ? target.apparatus : []));
  if (target.apparatuses.length >= 2) {
    if (typeof showToast === 'function') showToast('Esta engenhoca já possui o limite máximo de 2 aparatos.');
    return;
  }

  // Remove o aparato da mochila
  const apIdx = userBackpack.findIndex(e => (backpackInstanceId && e.instanceId === backpackInstanceId) || e.itemId === apId);
  if (apIdx >= 0) {
    const entry = userBackpack[apIdx];
    if (entry.quantity && Number(entry.quantity) > 1) {
      entry.quantity = Number(entry.quantity) - 1;
    } else {
      userBackpack.splice(apIdx, 1);
    }
  }

  target.apparatuses.push(apId);
  target.aparatos = target.apparatuses;

  // Sincroniza também na mochila se a engenhoca estiver na mochila
  const bpContraption = userBackpack.find(e => e.instanceId === contraptionId || e.itemId === contraptionId);
  if (bpContraption) {
    bpContraption.engenhocaInfo = bpContraption.engenhocaInfo || {};
    bpContraption.engenhocaInfo.apparatuses = target.apparatuses;
    bpContraption.engenhocaInfo.aparatos = target.apparatuses;
  }

  if (profile) profile.backpack = userBackpack;
  backpackItems = userBackpack;
  if (typeof persistCharacterProfiles === 'function') persistCharacterProfiles();

  if (typeof postArsenal === 'function') {
    postArsenal('update-contraption-apparatus', {
      contraptionId,
      apparatuses: target.apparatuses,
      apId,
      action: 'install',
      backpackInstanceId
    });
  }

  const it = itemById.get(apId);
  if (typeof showToast === 'function') showToast('Aparato ' + (it?.nome || apId) + ' acoplado com sucesso!');

  const chooseModal = document.getElementById('chooseContraptionModal');
  if (chooseModal) { chooseModal.hidden = true; chooseModal.style.display = 'none'; }

  const manageModal = document.getElementById('manageApparatusModal');
  if (manageModal && !manageModal.hidden && manageModal.style.display !== 'none') {
    openManageApparatusModal(contraptionId);
  }

  injectWorkshopBackpackSectionIfNeeded();
}

function removeApparatusFromContraption(contraptionId, apId) {
  const profile = typeof activeCharacterProfile === 'function' ? activeCharacterProfile() : null;
  const portfolio = (typeof arsenalInitialState !== 'undefined' && Array.isArray(arsenalInitialState.contraptions))
    ? arsenalInitialState.contraptions
    : (profile && Array.isArray(profile.contraptions) ? profile.contraptions : []);

  const target = portfolio.find(c => c && c.id === contraptionId);
  const userBackpack = profile?.backpack || backpackItems || [];

  if (target) {
    target.apparatuses = Array.isArray(target.apparatuses) ? target.apparatuses : (Array.isArray(target.aparatos) ? target.aparatos : (Array.isArray(target.apparatus) ? target.apparatus : []));
    const idx = target.apparatuses.indexOf(apId);
    if (idx >= 0) {
      target.apparatuses.splice(idx, 1);
      target.aparatos = target.apparatuses;
    }
  }

  // Sincroniza também na mochila se a engenhoca estiver na mochila
  const bpContraption = userBackpack.find(e => e.instanceId === contraptionId || e.itemId === contraptionId);
  if (bpContraption && bpContraption.engenhocaInfo) {
    bpContraption.engenhocaInfo.apparatuses = target ? target.apparatuses : [];
    bpContraption.engenhocaInfo.aparatos = target ? target.apparatuses : [];
  }

  // Devolve o aparato para a mochila
  userBackpack.push({
    instanceId: 'aparato:' + (typeof createInstanceId === 'function' ? createInstanceId() : ('inst_' + Date.now())),
    itemId: apId,
    quantity: 1,
    source: 'disassemble'
  });

  if (profile) profile.backpack = userBackpack;
  backpackItems = userBackpack;
  if (typeof persistCharacterProfiles === 'function') persistCharacterProfiles();

  if (typeof postArsenal === 'function') {
    postArsenal('update-contraption-apparatus', {
      contraptionId,
      apparatuses: target ? target.apparatuses : [],
      apId,
      action: 'remove'
    });
  }

  const it = itemById.get(apId);
  if (typeof showToast === 'function') showToast('Aparato ' + (it?.nome || apId) + ' desacoplado e retornado à mochila.');

  const manageModal = document.getElementById('manageApparatusModal');
  if (manageModal && !manageModal.hidden && manageModal.style.display !== 'none') {
    openManageApparatusModal(contraptionId);
  }

  injectWorkshopBackpackSectionIfNeeded();
}

document.addEventListener('click', event => {
  const target = event.target;
  if (!target) return;

  const copyShareBtn = target.closest?.('[data-share-code]');
  if (copyShareBtn) {
    event.preventDefault();
    event.stopPropagation();
    const code = copyShareBtn.dataset.shareCode || '';
    if (code) {
      const copySuccess = () => {
        const originalText = copyShareBtn.innerHTML;
        copyShareBtn.innerHTML = 'Copiado!';
        copyShareBtn.style.color = '#4ade80';
        setTimeout(() => {
          copyShareBtn.innerHTML = originalText;
          copyShareBtn.style.color = '';
        }, 1800);
        if (typeof toast === 'function') toast('Código do item copiado para a área de transferência!');
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(copySuccess).catch(() => {
          const ta = document.createElement('textarea');
          ta.value = code;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          ta.remove();
          copySuccess();
        });
      } else {
        const ta = document.createElement('textarea');
        ta.value = code;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        copySuccess();
      }
    }
    return;
  }

  const toggleBackpackBtn = target.closest?.('[data-action="toggle-workshop-backpack"]');
  if (toggleBackpackBtn) {
    event.preventDefault();
    event.stopPropagation();
    const wrap = toggleBackpackBtn.closest('.workshop-backpack-section')?.querySelector('.workshop-backpack-content-wrap') || document.getElementById('workshopBackpackContent');
    if (wrap) {
      const isHidden = wrap.style.display === 'none' || getComputedStyle(wrap).display === 'none';
      if (isHidden) {
        wrap.style.display = wrap.classList.contains('catalog-grid') ? 'grid' : 'block';
        toggleBackpackBtn.textContent = 'Recolher Mochila';
        toggleBackpackBtn.setAttribute('aria-expanded', 'true');
        window.__workshopBackpackExpanded = true;
      } else {
        wrap.style.display = 'none';
        toggleBackpackBtn.textContent = 'Exibir Mochila';
        toggleBackpackBtn.setAttribute('aria-expanded', 'false');
        window.__workshopBackpackExpanded = false;
      }
    }
    return;
  }

  const viewBtn = target.closest?.('[data-action="view-simulated-spell"]');
  if (viewBtn) {
    event.preventDefault();
    event.stopPropagation();
    const spellId = viewBtn.dataset.spellId || '';
    const spellName = viewBtn.dataset.spellName || '';
    openSimulatedSpellModal(spellId, spellName);
    return;
  }

  if (target.closest?.('[data-action="close-simulated-spell"]') || target.id === 'simulatedSpellModal') {
    event.preventDefault();
    event.stopPropagation();
    const modal = document.getElementById('simulatedSpellModal');
    if (modal) {
      modal.hidden = true;
      modal.style.display = 'none';
    }
    return;
  }

  const manageApBtn = target.closest?.('[data-action="manage-apparatus"]');
  if (manageApBtn) {
    event.preventDefault();
    event.stopPropagation();
    const cId = manageApBtn.dataset.contraptionId;
    openManageApparatusModal(cId);
    return;
  }

  if (target.closest?.('[data-action="close-manage-apparatus"]') || target.id === 'manageApparatusModal') {
    event.preventDefault();
    event.stopPropagation();
    const modal = document.getElementById('manageApparatusModal');
    if (modal) {
      modal.hidden = true;
      modal.style.display = 'none';
    }
    return;
  }

  const attachBackpackApBtn = target.closest?.('[data-action="attach-backpack-apparatus"]');
  if (attachBackpackApBtn) {
    event.preventDefault();
    event.stopPropagation();
    const apId = attachBackpackApBtn.dataset.itemId;
    const instId = attachBackpackApBtn.dataset.instanceId;
    openAttachApparatusChooserModal(apId, instId);
    return;
  }

  const selContraptionBtn = target.closest?.('[data-action="select-contraption-for-apparatus"]');
  if (selContraptionBtn) {
    event.preventDefault();
    event.stopPropagation();
    const cId = selContraptionBtn.dataset.contraptionId;
    const apId = selContraptionBtn.dataset.apparatusId;
    const instId = selContraptionBtn.dataset.instanceId;
    installApparatusOnContraption(cId, apId, instId);
    return;
  }

  if (target.closest?.('[data-action="close-choose-contraption-modal"]') || target.id === 'chooseContraptionModal') {
    event.preventDefault();
    event.stopPropagation();
    const modal = document.getElementById('chooseContraptionModal');
    if (modal) {
      modal.hidden = true;
      modal.style.display = 'none';
    }
    return;
  }

  const removeApBtn = target.closest?.('[data-action="remove-apparatus-from-contraption"]');
  if (removeApBtn) {
    event.preventDefault();
    event.stopPropagation();
    const cId = removeApBtn.dataset.contraptionId;
    const apId = removeApBtn.dataset.apparatusId;
    removeApparatusFromContraption(cId, apId);
    return;
  }

  const installApBtn = target.closest?.('[data-action="install-apparatus-on-contraption"]');
  if (installApBtn) {
    event.preventDefault();
    event.stopPropagation();
    const cId = installApBtn.dataset.contraptionId;
    const apId = installApBtn.dataset.apparatusId;
    const instId = installApBtn.dataset.instanceId;
    installApparatusOnContraption(cId, apId, instId);
    return;
  }

  const craftApBtn = target.closest?.('[data-action="craft-apparatus"]');
  if (craftApBtn) {
    event.preventDefault();
    event.stopPropagation();
    const apId = craftApBtn.dataset.itemId;
    const it = itemById.get(apId);
    if (!it) return;
    const fullPrice = Number(it.preco?.valor ?? it.price ?? 300);
    const craftCost = Math.ceil(fullPrice / 3);
    postArsenal('open-craft-test', {
      itemId: it.id,
      itemName: it.nome,
      titulo: 'Fabricar Aparato · ' + it.nome,
      subtitulo: 'Ofício (engenhoqueiro) · 1 hora',
      oficioNome: 'Ofício (engenhoqueiro)',
      craftCd: 20,
      totalCost: craftCost,
      craftBonus: Number(arsenalInitialState?.craftSkillBonus) || 0,
      isExisting: false,
      improvements: [],
      enchantments: []
    });
    return;
  }

  const buyApBtn = target.closest?.('[data-action="buy-apparatus"]');
  if (buyApBtn) {
    event.preventDefault();
    event.stopPropagation();
    const apId = buyApBtn.dataset.itemId;
    const it = itemById.get(apId);
    if (!it) return;
    const fullPrice = Number(it.preco?.valor ?? it.price ?? 300);
    const currentFunds = Number(arsenalInitialState?.funds || 0);
    if (fullPrice > currentFunds) {
      if (typeof showToast === 'function') showToast('Saldo insuficiente (T$ ' + currentFunds + ') para comprar ' + it.nome + ' (T$ ' + fullPrice + ').');
      return;
    }
    cartItems.push({
      entryId: 'carrinho-' + (typeof createInstanceId === 'function' ? createInstanceId() : ('inst_' + Date.now())),
      instanceId: typeof createInstanceId === 'function' ? createInstanceId() : ('inst_' + Date.now()),
      itemId: it.id,
      quantity: 1,
      options: {}
    });
    saveCart(cartItems);
    if (typeof proposeOperation === 'function') {
      proposeOperation('purchase');
    }
    return;
  }
});

function getActiveContraptionsList() {
  const profile = typeof activeCharacterProfile === 'function' ? activeCharacterProfile() : null;
  const list = [];
  const seenIds = new Set();

  // 1. Engenhocas registradas no portfólio (próprias ou de aliados)
  const portfolio = (typeof arsenalInitialState !== 'undefined' && Array.isArray(arsenalInitialState.contraptions))
    ? arsenalInitialState.contraptions
    : (profile && Array.isArray(profile.contraptions) ? profile.contraptions : []);

  portfolio.forEach(c => {
    if (c && c.id && !seenIds.has(c.id)) {
      seenIds.add(c.id);
      if (c.instanceId) seenIds.add(c.instanceId);
      if (c.itemId) seenIds.add(c.itemId);
      if (!Array.isArray(c.apparatuses)) {
        c.apparatuses = Array.isArray(c.aparatos) ? c.aparatos : (Array.isArray(c.apparatus) ? c.apparatus : []);
      }
      list.push(c);
    }
  });

  // Coleta todas as fontes de inventário e equipamentos do usuário
  const candidateEntries = [];
  if (profile?.backpack && Array.isArray(profile.backpack)) candidateEntries.push(...profile.backpack);
  if (Array.isArray(backpackItems)) candidateEntries.push(...backpackItems);
  if (typeof state !== 'undefined' && Array.isArray(state.inventory)) candidateEntries.push(...state.inventory);

  // Adiciona itens atualmente equipados (para engenhocas vestidas ou empunhadas)
  const eq = profile?.equipment || (typeof state !== 'undefined' ? state.equipment : null) || {};
  const eqIds = [eq.weaponId, eq.shieldId, eq.armorId, eq.trailerId, ...(Array.isArray(eq.accessories) ? eq.accessories : [])].filter(Boolean);
  eqIds.forEach(id => {
    if (id && id !== 'none') {
      const foundInCandidate = candidateEntries.find(e => (e.instanceId === id || e.itemId === id || e.id === id));
      if (!foundInCandidate) {
        candidateEntries.push({ itemId: id, instanceId: id });
      }
    }
  });

  // Se ainda não encontrou e perfil ativo tiver customItems:
  if (profile?.customItems && Array.isArray(profile.customItems)) {
    profile.customItems.forEach(ci => {
      if (ci.contraptionId || ci.isEngenhoca || ci.tipo === 'engenhoca' || /engenhoca/i.test(ci.id || '')) {
        candidateEntries.push({ itemId: ci.id, instanceId: ci.id, engenhocaInfo: ci.engenhocaInfo || ci, isEngenhoca: true, contraptionId: ci.contraptionId || ci.id });
      }
    });
  }

  // 2. Engenhocas na mochila/equipamento que porventura não estejam no array principal
  candidateEntries.forEach(entry => {
    if (!entry) return;
    const it = itemById.get(entry.itemId);
    const isEng = (it && (it.categoriaId === 'engenhoca' || it.tipo === 'engenhoca')) ||
      Boolean(entry.engenhocaInfo) ||
      (entry.itemId && String(entry.itemId).startsWith('engenhoca_')) ||
      entry.isEngenhoca ||
      Boolean(entry.contraptionId);

    if (isEng) {
      const contraptionId = entry.contraptionId || entry.engenhocaInfo?.id || entry.itemId;
      // Se a engenhoca já foi registrada pelo portfólio, NÃO duplica!
      if (seenIds.has(contraptionId) || seenIds.has(entry.itemId) || (entry.instanceId && seenIds.has(entry.instanceId))) {
        return;
      }
      const id = contraptionId || entry.instanceId || entry.itemId;
      seenIds.add(id);
      seenIds.add(entry.itemId);
      if (entry.instanceId) seenIds.add(entry.instanceId);
      if (entry.contraptionId) seenIds.add(entry.contraptionId);

      const info = entry.engenhocaInfo || it?.engenhocaInfo || {};
      const aps = Array.isArray(info.apparatuses) ? info.apparatuses :
        (Array.isArray(info.aparatos) ? info.aparatos :
        (Array.isArray(entry.apparatuses) ? entry.apparatuses :
        (Array.isArray(entry.aparatos) ? entry.aparatos : [])));
      list.push({
        id,
        nome: configuredItemName(entry, it) || it?.nome || 'Engenhoca',
        descricao: it?.descricao || info.descricao || '',
        spellId: info.spellId || '',
        spellName: info.spellName || '',
        circulo: info.circulo || 1,
        pm: info.pm || 1,
        cdAtivacao: info.cdAtivacao || 16,
        formaUso: info.formaUso || 'empunhada',
        destinatario: 'si',
        attachedItem: info.attachedItem || it?.attachedItem || entry.attachedItem || null,
        inventorPv: info.inventorPv || it?.inventorPv || null,
        apparatuses: aps,
        aparatos: aps
      });
    }
  });

  return list;
}

function injectWorkshopBackpackSectionIfNeeded(loadMore) {
  itemsGrid.querySelectorAll('.workshop-backpack-section, .workshop-divider').forEach(el => el.remove());
  if (typeof arsenalInitialState === 'undefined' || arsenalInitialState.mode !== 'workshop') {
    return;
  }
  if (loadMore) return;

  // Oculta o cabecalho redundante de catalogo que ficava sobre a mochila
  const heading = document.querySelector('.catalog-heading');
  if (heading) {
    heading.style.display = 'none';
  }

  const sectionKey = arsenalInitialState.workshopSection || 'artesao';
  // @ts-ignore
  const rules = typeof RegrasManufatura !== 'undefined' ? RegrasManufatura : null;
  const sec = rules?.secoesOficina?.[sectionKey];
  if (!sec) {
    return;
  }

  // Caso especial: Oficina do Engenhoqueiro
  // Ordem estrita dos cards (Requisito 14):
  // 1. Card da bancada do engenhoqueiro
  // 2. Cards das engenhocas do inventor
  // 3. Cards dos aparatos que estiverem na mochila do heroi
  // 4. Loja com todos os aparatos para comprar ou fabricar.
  if (sectionKey === 'engenhoqueiro') {
    if (typeof filtersPanel !== 'undefined' && filtersPanel) {
      filtersPanel.hidden = false;
      filtersPanel.style.display = '';
      const advBtn = filtersPanel.querySelector('.advanced-filters-button');
      if (advBtn) advBtn.style.display = 'none';
      const advContent = filtersPanel.querySelector('#advancedFiltersContent');
      if (advContent) advContent.style.display = 'none';
      const sortCtrl = filtersPanel.querySelector('.sort-control');
      if (sortCtrl) sortCtrl.style.display = 'none';
      const filterRows = filtersPanel.querySelectorAll('.filter-row-control, .context-filters');
      filterRows.forEach(el => el.style.display = 'none');
    }
    const contraptionsList = getActiveContraptionsList();
    const resolvedInt = resolverInteligenciaHeroiAtivo();
    const maxContraptions = Math.max(resolvedInt, Number(arsenalInitialState.intMod || 0));
    const search = (state.search || '').trim().toLowerCase();

    // 1. Bancada do Engenhoqueiro
    const bancadaHtml = engenhocaWorkshopCardHtml(contraptionsList.length, maxContraptions);

    // 2. Cards das Engenhocas do Inventor
    const filteredContraptions = search
      ? contraptionsList.filter(c => (c.nome || '').toLowerCase().includes(search) || (c.spellName || '').toLowerCase().includes(search))
      : contraptionsList;
    let contraptionsHtml = '';
    try {
      contraptionsHtml = filteredContraptions.map(c => {
        try {
          return contraptionPortfolioCardHtml(c);
        } catch (cardErr) {
          console.error('Erro ao renderizar engenhoca:', c, cardErr);
          return '';
        }
      }).join('');
    } catch (err) {
      console.error('Erro ao mapear engenhocas:', err);
    }

    // 3. Cards dos Aparatos que estiverem na mochila do heroi
    const userBackpack = (typeof activeCharacterProfile === 'function' && activeCharacterProfile()?.backpack) || backpackItems || [];
    const backpackApparatusEntries = userBackpack.filter(entry => {
      const it = itemById.get(entry.itemId);
      return (it && (it.categoriaId === 'aparato' || it.tipo === 'aparato')) || APARATOS_CANONICOS_IDS.includes(entry.itemId);
    });

    let backpackApparatusHtml = '';
    if (backpackApparatusEntries.length > 0) {
      const filteredBackpackAps = search
        ? backpackApparatusEntries.filter(entry => {
            const it = itemById.get(entry.itemId);
            const nome = (it?.nome || entry.displayName || entry.itemName || '').toLowerCase();
            return nome.includes(search);
          })
        : backpackApparatusEntries;

      if (filteredBackpackAps.length > 0) {
        const countText = filteredBackpackAps.length === 1 ? '1 aparato guardado' : `${filteredBackpackAps.length} aparatos guardados`;
        backpackApparatusHtml = '<div class="workshop-section-header" style="grid-column: 1 / -1; margin-top: 14px; margin-bottom: 2px; padding: 10px 14px; background: #0e141f; border-left: 3px solid #38bdf8; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">' +
          '<div>' +
            '<h4 style="margin: 0; font-size: 0.95rem; color: #f1f5f9; font-family: Cinzel, serif; letter-spacing: 0.5px; text-transform: uppercase; display: flex; align-items: center; gap: 8px;">' +
              ' Aparatos na Mochila' +
            '</h4>' +
            '<span style="font-size: 0.75rem; color: #94a3b8;">Aparatos guardados que podem ser acoplados às suas engenhocas.</span>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:10px;">' +
            '<span class="badge" style="background: #16202f; border: 1px solid #293d59; color: #93c5fd; font-size: 0.72rem; font-weight: 700;">' + countText + '</span>' +
            '<button class="button" id="toggleApparatusBackpackBtn" type="button" data-action="toggle-workshop-backpack" style="padding:3px 10px;font-size:0.75rem;min-height:24px;height:24px;line-height:1;background:#1e293b;border:1px solid #475569;color:#e2e8f0;border-radius:4px;cursor:pointer;">Exibir Mochila</button>' +
          '</div>' +
        '</div>' +
        '<div class="workshop-backpack-content-wrap" id="workshopBackpackContent" style="grid-column: 1 / -1; display: none;">' +
          filteredBackpackAps.map(entry => {
            const it = itemById.get(entry.itemId) || { id: entry.itemId, nome: entry.displayName || entry.itemName || 'Aparato' };
            return apparatusBackpackCardHtml(entry, it);
          }).join('') +
        '</div>';
      }
    }

    // 4. Loja com todos os aparatos para comprar ou fabricar
    const catalogAparatos = APARATOS_CANONICOS_IDS.map(id => itemById.get(id)).filter(Boolean);
    const filteredCatalogAps = search
      ? catalogAparatos.filter(it => (it.nome || '').toLowerCase().includes(search) || (it.textos?.habilidade || '').toLowerCase().includes(search))
      : catalogAparatos;

    const catalogHeaderHtml = '<div class="workshop-section-header" style="grid-column: 1 / -1; margin-top: 18px; margin-bottom: 2px; padding: 10px 14px; background: #0e141f; border-left: 3px solid #d4af37; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">' +
      '<div>' +
        '<h4 style="margin: 0; font-size: 0.95rem; color: #d4af37; font-family: Cinzel, serif; letter-spacing: 0.5px; text-transform: uppercase; display: flex; align-items: center; gap: 8px;">' +
          ' Fabricar ou Comprar Aparatos · Oficina do Engenhoqueiro' +
        '</h4>' +
        '<span style="font-size: 0.75rem; color: #94a3b8;">Aparatos canônicos para calibrar suas engenhocas · CD 20 de Manufatura (1 hora, ⅓ do preço) ou Compra imediata.</span>' +
      '</div>' +
      '<span class="badge" style="background: #1d180d; border: 1px solid #4a3b1a; color: #fbbf24; font-size: 0.72rem; font-weight: 700;">15 Aparatos Disponíveis</span>' +
    '</div>';

    const catalogHtml = filteredCatalogAps.map(apparatusCatalogCardHtml).join('');

    itemsGrid.style.alignItems = 'stretch';
    itemsGrid.innerHTML = bancadaHtml + contraptionsHtml + backpackApparatusHtml + catalogHeaderHtml + catalogHtml;
    if (typeof catalogMarkup !== 'undefined') catalogMarkup = itemsGrid.innerHTML;
    if (typeof resultCount !== 'undefined' && resultCount) {
      const totalCount = 1 + contraptionsList.length + backpackApparatusEntries.length + catalogAparatos.length;
      resultCount.textContent = totalCount + ' opções';
    }
    if (typeof emptyState !== 'undefined' && emptyState) {
      emptyState.classList.remove('visible');
    }
    return;
  }

  // Comportamento para as demais oficinas (Artesão, Armeiro, Alfaiate, etc.)
  const userBackpack = (typeof activeCharacterProfile === 'function' && activeCharacterProfile()?.backpack) || backpackItems || [];
  const matching = userBackpack.filter(entry => {
    const it = itemById.get(entry.itemId);
    if (!it) return false;
    return typeof sec.corresponde === 'function' && sec.corresponde(it);
  });

  let contentHtml = '';
  if (!matching.length) {
    contentHtml = '<div style="padding:14px 16px;background:#0d121b;border:1px dashed #243042;border-radius:8px;color:#94a3b8;font-size:0.84rem;line-height:1.5;">' +
      'Você não possui nenhum item compatível com <strong>' + escapeHtml(sec.title) + '</strong> na sua mochila no momento. Utilize o catálogo abaixo para fabricar novos itens do zero!' +
    '</div>';
  } else {
    contentHtml = '<div class="workshop-backpack-cards-grid catalog-grid" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;">' +
      matching.map(workshopBackpackCardHtml).join('') +
    '</div>';
  }

  const titleText = 'Seus Itens no Ofício · ' + escapeHtml(sec.title);
  const subtitleText = 'Itens da sua mochila que podem ser aprimorados nesta oficina.';

  if (typeof window.__workshopBackpackExpanded === 'undefined') {
    window.__workshopBackpackExpanded = false;
  }
  const startCollapsed = !Boolean(window.__workshopBackpackExpanded);

  const dividerHtml = '<div class="workshop-divider" style="grid-column: 1 / -1; margin: 24px 0 16px 0; text-align: center; border-bottom: 1px solid #1e293b; line-height: 0.1em;">' +
    '<span style="background: #0b0f17; padding: 0 18px; color: #d4af37; font-family: Cinzel, serif; font-size: 0.95rem; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 700;">Loja</span>' +
  '</div>';

  const sectionHtml = '<div class="workshop-backpack-section" style="grid-column:1/-1;margin-bottom:20px;padding:16px;background:#0a0e16;border:1px solid #1e2837;border-radius:10px;">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;border-bottom:1px solid #1a2332;padding-bottom:8px;">' +
      '<div>' +
        '<h3 style="margin:0;font-size:1.05rem;color:#cbd5e1;font-family:Cinzel,serif;display:flex;align-items:center;gap:8px;">' +
          ' ' + escapeHtml(titleText) +
        '</h3>' +
        '<small style="color:#94a3b8;font-size:0.75rem;">' + escapeHtml(subtitleText) + '</small>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:10px;">' +
        '<span class="badge" style="background:#131c28;border:1px solid #233348;color:#cbd5e1;font-weight:700;">' + matching.length + (matching.length === 1 ? ' item na mochila' : ' itens na mochila') + '</span>' +
        '<button class="button" id="toggleWorkshopBackpackBtn" type="button" data-action="toggle-workshop-backpack" aria-expanded="' + (startCollapsed ? 'false' : 'true') + '" style="padding:4px 10px;font-size:0.75rem;min-height:26px;height:26px;line-height:1;background:#1e293b;border:1px solid #475569;color:#e2e8f0;border-radius:4px;cursor:pointer;">' + (startCollapsed ? 'Exibir Mochila' : 'Recolher Mochila') + '</button>' +
      '</div>' +
    '</div>' +
    '<div class="workshop-backpack-content-wrap" id="workshopBackpackContent"' + (startCollapsed ? ' style="display:none;"' : '') + '>' +
      contentHtml +
    '</div>' +
  '</div>' + dividerHtml;

  itemsGrid.insertAdjacentHTML('afterbegin', sectionHtml);
}

function injectWorkshopSpecialCardsIfNeeded(loadMore) {
  if (loadMore) return;
  const isWorkshop = typeof arsenalInitialState !== 'undefined' && arsenalInitialState.mode === 'workshop';
  const section = isWorkshop ? (arsenalInitialState.workshopSection || 'artesao') : (typeof state !== 'undefined' ? state.oficinaFilter : null);
  if (!section) return;

  // Injeta primeiro a seção da mochila do usuário no topo da oficina
  if (isWorkshop) {
    injectWorkshopBackpackSectionIfNeeded(loadMore);
  }

  // Remove cards de topo anteriores para evitar acúmulo
  itemsGrid.querySelectorAll('.potion-special-card, .scroll-special-card, .tattoo-special-card, .armeiro-special-card, .alfaiate-special-card, .carpinteiro-special-card, .artesao-special-card, .cozinheiro-special-card, .generic-workshop-special-card').forEach(el => el.remove());

  // Apenas oficinas que requerem seleção de magias possuem card especial no topo (Alquimia, Escriba, Tatuagem Mística e Engenhoqueiro).
  // Armeiro, Alfaiate, Carpinteiro, Artesão e afins possuem itens mundanos/fixos diretos no catálogo.
  if (section === 'alquimista') {
    const existingCard = itemsGrid.querySelector('.potion-special-card');
    if (!existingCard) {
      itemsGrid.insertAdjacentHTML('afterbegin', potionWorkshopCardHtml());
    }
  } else if (section === 'escriba') {
    const existingCard = itemsGrid.querySelector('.scroll-special-card');
    if (!existingCard) {
      itemsGrid.insertAdjacentHTML('afterbegin', scrollWorkshopCardHtml());
    }
  } else if (section === 'tatuador') {
    const existingCard = itemsGrid.querySelector('.tattoo-special-card');
    if (!existingCard) {
      itemsGrid.insertAdjacentHTML('afterbegin', tattooWorkshopCardHtml());
    }
  } else if (section === 'engenhoqueiro') {
    // Grid unificado com Bancada do Engenhoqueiro já construído por injectWorkshopBackpackSectionIfNeeded
    return;
  }
}
const injectWorkshopPotionCardIfNeeded = injectWorkshopSpecialCardsIfNeeded;

const baseUpdateTitle = typeof updateTitle === 'function' ? updateTitle : null;
updateTitle = function() {
  if (typeof arsenalInitialState !== 'undefined' && arsenalInitialState.mode === 'workshop') {
    // @ts-ignore
    const rules = typeof RegrasManufatura !== 'undefined' ? RegrasManufatura : null;
    const sectionKey = arsenalInitialState.workshopSection || 'artesao';
    const sec = rules?.secoesOficina?.[sectionKey];
    if (sec && typeof catalogTitle !== 'undefined' && catalogTitle) {
      catalogTitle.textContent = `${sec.icon} ${sec.title} · ${arsenalInitialState.workshopReadOnly ? 'Consulta de Itens' : 'Manufatura (⅓ do Preço)'}`;
      return;
    }
  }
  if (baseUpdateTitle) baseUpdateTitle();
};
syncCartUI=function(){baseSyncCartUI();syncEmbeddedShopActions();postArsenal('cart-count',{count:cartItems.reduce((sum,entry)=>sum+entry.quantity,0)})};
function starterKey(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\([^)]*\)/g,' ').replace(/^\s*(?:uma?|\d+)\s+/,'').replace(/[^a-z0-9]+/g,' ').trim()}
function initialItemFacts(item){
  if(!item.arma)return '';
  const values=['Dano '+(item.arma.dano?.principal||'—'),'Crítico '+formatCritical(item.arma.critico),...(item.arma.tipoDanoIds||[]).map(id=>DAMAGE_LABELS[id]||humanize(id))];
  if(item.arma.alcanceId)values.push('Alcance '+(RANGE_LABELS[item.arma.alcanceId]||humanize(item.arma.alcanceId)));
  return values.map(value=>'<span>'+escapeHtml(value)+'</span>').join('');
}
if(typeof ITEM_CHOICE_DEFINITIONS!=='undefined'&&ITEM_CHOICE_DEFINITIONS.colecao_de_livros){
  if(!ITEM_CHOICE_DEFINITIONS.colecao_de_livros.fields.some(f=>f.id==='customName')){
    ITEM_CHOICE_DEFINITIONS.colecao_de_livros.fields.unshift({
      id: 'customName',
      label: 'Nome ou título dos livros',
      type: 'text',
      placeholder: 'Ex. Coleção de Livros Históricos'
    });
  }
}
const DEFAULT_ITEM_OPTIONS = {
  instrumento_musical: { customName: 'Bandolim' },
  instrumento_musical_exotico: { customName: 'Sanfona', customSpaces: 2 },
  ferramenta_pesada: { customName: 'Malho' },
  ferramenta_pesada_lanca: { customName: 'Picareta', weaponModel: 'lanca' },
  ferramenta_agricola: { customName: 'Forcado' },
  animal_nao_combativo: { customName: 'Galinha' },
  joia_de_familia: { customName: 'Colar' },
  joia_falsificada: { customName: 'Anel de Latão' },
  item_artistico: { customName: 'Tapeçaria Antiga' },
  colecao_de_livros: { customName: '', knowledge: '' },
  tatuagem_adereco_gangue: { customName: 'Tatuagem da Gangue' },
  item_sem_valor_admirador: { customName: 'Fita de Seda' },
  pequeno_animal_estimacao: { customName: 'Esquilo' },
  instrumentos_cozinheiro_aprimorados: { customName: 'Facas do Chef' },
  instrumentos_barbeiro: { customName: 'Navalha de Prata' },
  instrumentos_coureiro: { customName: 'Sovelas de Marfim' },
  bola_ou_objeto_pintado: { customName: 'Wilson' },
  instrumentos_pescador: { customName: 'Varas e Anzóis' }
};
function resolveDefaultItemOptions(itemId, currentOptions){
  const defaults = DEFAULT_ITEM_OPTIONS[itemId];
  if(!defaults) return currentOptions || {};
  const result = { ...(currentOptions || {}) };
  for(const [k, v] of Object.entries(defaults)){
    if(k==='customName'&&typeof arsenalInitialState!=='undefined'&&arsenalInitialState?.mode==='initial')continue;
    if(result[k] === '' || result[k] == null) result[k] = v;
  }
  return result;
}
const baseConfiguredItemName = typeof configuredItemName === 'function' ? configuredItemName : null;
configuredItemName = function(instance, item) {
  if (/traje_de_viaj/i.test(item?.id) || /traje_de_viaj/i.test(item?.nome) || /traje_de_viaj/i.test(instance?.itemId) || /traje_de_viaj/i.test(instance?.displayName)) {
    return 'Traje de Viajante';
  }
  if (!item) return instance?.displayName || '';
  const options = typeof normalizeItemOptions === 'function' ? normalizeItemOptions(item.id, instance && instance.options) : (instance?.options || {});
  if (item.id === 'colecao_de_livros') {
    const raw = (options.customName || '').trim();
    if (raw && !/^cole[cç][aã]o de livros$/i.test(raw)) {
      return raw;
    }
    const label = typeof itemChoiceLabel === 'function' ? itemChoiceLabel(item.id, 'knowledge', options.knowledge) : options.knowledge;
    return label ? ('Coleção de Livros — ' + label) : 'Coleção de Livros';
  }
  if (item.id === 'ferramenta_agricola') {
    const raw = (options.customName || 'Forcado').trim();
    const clean = raw.replace(/\s*\(fazendeiro\)/i, '').replace(/ferramenta agr[íi]cola/i, 'Forcado').trim();
    return (clean || 'Forcado') + ' (Fazendeiro)';
  }
  if (item.id === 'ferramenta_pesada_lanca') {
    const defaultName = options.weaponModel === 'maca' ? 'Malho' : 'Picareta';
    const raw = (options.customName || defaultName).trim();
    const clean = raw.replace(/\s*\(trabalhador\)/i, '').replace(/\s*\(lan[çc]a\)/i, '').replace(/\s*\(ma[çc]a\)/i, '').replace(/ferramenta pesada/i, defaultName).trim();
    return (clean || defaultName) + ' (Trabalhador)';
  }
  if (item.id === 'ferramenta_pesada') {
    const raw = (options.customName || 'Malho').trim();
    const clean = raw.replace(/\s*\(escravo\)/i, '').replace(/ferramenta pesada/i, 'Malho').trim();
    return (clean || 'Malho') + ' (Escravo)';
  }
  if (item.id === 'joia_de_familia') {
    const raw = (options.customName || 'Colar').trim();
    return raw ? raw + ' (Joia de Família)' : 'Joia de Família';
  }
  if (item.id === 'joia_falsificada') {
    const raw = (options.customName || 'Anel de Latão').trim();
    return raw ? raw + ' (Falsificado)' : 'Joia Falsificada';
  }
  if (item.id === 'item_artistico') {
    const raw = (options.customName || 'Tapeçaria Antiga').trim();
    return raw ? raw + ' (Item Artístico)' : 'Item Artístico';
  }
  if (item.id === 'tatuagem_adereco_gangue') {
    const raw = (options.customName || 'Tatuagem da Gangue').trim();
    return raw ? raw + ' (Tatuagem/Adereço)' : 'Tatuagem ou Adereço de Gangue';
  }
  if (item.id === 'item_sem_valor_admirador') {
    const raw = (options.customName || 'Fita de Seda').trim();
    return raw ? raw + ' (Lembrança de Admirador)' : 'Lembrança de um Admirador';
  }
  if (item.id === 'pequeno_animal_estimacao') {
    const raw = (options.customName || 'Esquilo').trim();
    return raw ? raw + ' (Animal de Estimação)' : 'Pequeno Animal de Estimação';
  }
  if (item.id === 'instrumentos_cozinheiro_aprimorados') {
    const raw = (options.customName || 'Facas do Chef').trim();
    return raw ? raw + ' (Instrumentos Aprimorados)' : 'Instrumentos de Cozinheiro Aprimorados';
  }
  if (item.id === 'instrumentos_barbeiro') {
    const raw = (options.customName || 'Navalha de Prata').trim();
    return raw ? raw + ' (Instrumentos de Barbeiro)' : 'Instrumentos de Barbeiro';
  }
  if (item.id === 'instrumentos_coureiro') {
    const raw = (options.customName || 'Sovelas de Marfim').trim();
    return raw ? raw + ' (Instrumentos de Coureiro)' : 'Instrumentos de Coureiro';
  }
  if (item.id === 'bola_ou_objeto_pintado') {
    const raw = (options.customName || 'Wilson').trim();
    return raw ? raw + ' (Objeto Amigo)' : 'Objeto com Rosto Pintado';
  }
  if (item.id === 'instrumentos_pescador') {
    const raw = (options.customName || 'Varas e Anzóis').trim();
    return raw ? raw + ' (Instrumentos de Pescador)' : 'Instrumentos de Pescador';
  }
  if (item.id === 'tranqueiras_resgatadas_do_mar') {
    const chosen = (options.customName === 'outro' ? options.customDetails : options.customName) || options.customDetails || 'Tranqueiras do Mar';
    const clean = String(chosen || '').trim();
    return clean ? clean + ' (Tranqueiras do Mar)' : 'Tranqueiras resgatadas do mar';
  }
  if (baseConfiguredItemName) return baseConfiguredItemName(instance, item);
  return options.customName || item.nome;
};

function consolidateBackpackList(list) {
  const target = list || (activeCharacterProfile()?.backpack || backpackItems);
  if (!Array.isArray(target) || !target.length) return;
  target.forEach(entry => {
    if (!entry) return;
    if (/traje_de_viaj/i.test(entry.itemId) || /traje_de_viaj/i.test(entry.displayName) || /traje_de_viaj/i.test(entry.itemName)) {
      entry.itemId = 'traje_de_viajante';
      entry.displayName = 'Traje de Viajante';
      entry.itemName = 'Traje de Viajante';
    }
  });
  const consolidated = [];
  target.forEach(entry => {
    const options = typeof normalizeItemOptions === 'function' ? normalizeItemOptions(entry.itemId, entry.options) : (entry.options || {});
    const optKey = typeof itemOptionsKey === 'function' ? itemOptionsKey(entry.itemId, options) : JSON.stringify(options);
    const imps = JSON.stringify(entry.improvements || []);
    const enchs = JSON.stringify(entry.enchantments || []);
    const existing = consolidated.find(candidate => {
      const candOpts = typeof normalizeItemOptions === 'function' ? normalizeItemOptions(candidate.itemId, candidate.options) : (candidate.options || {});
      const candOptKey = typeof itemOptionsKey === 'function' ? itemOptionsKey(candidate.itemId, candOpts) : JSON.stringify(candOpts);
      return candidate.itemId === entry.itemId &&
        candOptKey === optKey &&
        JSON.stringify(candidate.improvements || []) === imps &&
        JSON.stringify(candidate.enchantments || []) === enchs &&
        candidate.quantity < 9999;
    });
    if (existing) {
      const added = Math.min(Number(entry.quantity) || 1, 9999 - existing.quantity);
      existing.quantity += added;
      const item = itemById.get(existing.itemId);
      const pkgSize = typeof ammoPackageSize === 'function' ? ammoPackageSize(item) : 0;
      if (pkgSize) {
        existing.ammoRemaining = Math.min(existing.quantity * pkgSize, (Number(existing.ammoRemaining) || 0) + (Number(entry.ammoRemaining) || (added * pkgSize)));
      }
      existing.acquisition = existing.acquisition || {};
      if (!existing.acquisition.additionalGrantIds) existing.acquisition.additionalGrantIds = [];
      if (entry.acquisition?.grantId) existing.acquisition.additionalGrantIds.push(entry.acquisition.grantId);
      if (entry.acquisition?.additionalGrantIds) existing.acquisition.additionalGrantIds.push(...entry.acquisition.additionalGrantIds);
    } else {
      consolidated.push(entry);
    }
  });
  consolidated.forEach(entry => {
    if (entry.itemId === 'traje_de_viajante') {
      entry.quantity = 1;
      entry.displayName = 'Traje de Viajante';
      entry.itemName = 'Traje de Viajante';
    }
  });
  target.length = 0;
  target.push(...consolidated);
  const active = activeCharacterProfile();
  if (active) active.backpack = target;
  backpackItems = target;
}

addPackagesToBackpack = function(itemId, packageQuantity, rawOptions, acquisition, configuration) {
  const item = itemById.get(itemId);
  if (!item) return;
  const amount = Math.max(1, Math.floor(Number(packageQuantity) || 1));
  const options = typeof normalizeItemOptions === 'function' ? normalizeItemOptions(itemId, rawOptions) : (rawOptions || {});
  const optionKey = typeof itemOptionsKey === 'function' ? itemOptionsKey(itemId, options) : JSON.stringify(options);
  const configuredImprovements = (configuration?.improvements || []).map(choice => ({ ...choice }));
  const configuredEnchantments = [...(configuration?.enchantments || [])];
  
  let instance = backpackItems.find(function(entry) {
    const entryOpts = typeof normalizeItemOptions === 'function' ? normalizeItemOptions(entry.itemId, entry.options) : (entry.options || {});
    const entryOptKey = typeof itemOptionsKey === 'function' ? itemOptionsKey(entry.itemId, entryOpts) : JSON.stringify(entryOpts);
    return entry.itemId === itemId &&
      entryOptKey === optionKey &&
      JSON.stringify(entry.improvements || []) === JSON.stringify(configuredImprovements) &&
      JSON.stringify(entry.enchantments || []) === JSON.stringify(configuredEnchantments) &&
      entry.quantity < 9999;
  });
  
  const packageSize = typeof ammoPackageSize === 'function' ? ammoPackageSize(item) : 0;
  const effective = typeof effectiveItemForOptions === 'function' ? effectiveItemForOptions(item, { itemId, options, improvements: configuredImprovements, enchantments: configuredEnchantments }) : item;
  const vInfo = typeof entryValueInfo === 'function' ? entryValueInfo({ itemId, quantity: 1, options, improvements: configuredImprovements, enchantments: configuredEnchantments }, effective) : null;
  const finalPrice = Number(configuration?.unitValue ?? vInfo?.unitKnown ?? item?.preco?.valor ?? item?.price ?? 0);

  if (instance) {
    const accepted = Math.min(amount, 9999 - instance.quantity);
    if (packageSize) instance.ammoRemaining = Math.min((instance.quantity + accepted) * packageSize, (Number(instance.ammoRemaining) || 0) + accepted * packageSize);
    instance.quantity += accepted;
    instance.acquisition = instance.acquisition || {};
    if (acquisition?.source) instance.acquisition.source = acquisition.source;
    if (acquisition?.operationId) instance.acquisition.operationId = acquisition.operationId;
    if (!instance.acquisition.additionalGrantIds) instance.acquisition.additionalGrantIds = [];
    if (acquisition?.grantId) instance.acquisition.additionalGrantIds.push(acquisition.grantId);
    if (acquisition?.additionalGrantIds) instance.acquisition.additionalGrantIds.push(...acquisition.additionalGrantIds);
    if (Number.isFinite(finalPrice) && finalPrice > 0 && (!instance.unitValue || instance.unitValue <= 0)) {
      instance.unitValue = finalPrice;
      instance.customPrice = finalPrice;
      instance.price = finalPrice;
      instance.preco = { valor: finalPrice, moeda: item?.preco?.moeda || 'T$' };
    }
  } else {
    const quantity = Math.min(9999, amount);
    const newEntry = {
      instanceId: createInstanceId(),
      itemId: itemId,
      quantity: quantity,
      acquisition: acquisition || { source: 'unknown' },
      displayName: configuredItemName({ options, improvements: configuredImprovements, enchantments: configuredEnchantments }, item),
      options: options,
      ammoRemaining: packageSize ? quantity * packageSize : undefined,
      improvements: configuredImprovements,
      enchantments: configuredEnchantments
    };
    if (Number.isFinite(finalPrice) && finalPrice > 0) {
      newEntry.unitValue = finalPrice;
      newEntry.customPrice = finalPrice;
      newEntry.price = finalPrice;
      newEntry.preco = { valor: finalPrice, moeda: item?.preco?.moeda || 'T$' };
    } else if (Number.isFinite(Number(configuration?.unitValue))) {
      newEntry.unitValue = Number(configuration.unitValue);
    }
    backpackItems.push(newEntry);
  }
  consolidateBackpackList();
};

function resetInternalBackpack(storage) {
  if (storage && typeof storage === 'object') {
    Object.keys(arsenalStorageValues).forEach(k => delete arsenalStorageValues[k]);
    Object.assign(arsenalStorageValues, storage);
  }
  if (typeof characterProfiles !== 'undefined' && characterProfiles?.profiles) {
    characterProfiles.profiles.forEach(p => p.backpack = []);
  }
  characterProfiles = loadCharacterProfiles();
  const active = activeCharacterProfile();
  if (active) active.backpack = [];
  backpackItems = active ? active.backpack : [];
  cartItems = [];
  selectedCandidate = null;
  pendingOperation = null;
  initialChoiceBranchId = null;
  selectedCraftOffice = null;
  persistBackpack();
  persistCart();
  syncCartUI();
  applyFilters();
}
function activeBranch(){
  if(!initialChoice?.branches?.length||!initialChoiceBranchId)return null;
  return initialChoice.branches.find(b=>b.id===initialChoiceBranchId)||null;
}
function effectiveInitialChoice(){
  const rootChoice = (typeof initialChoice !== 'undefined' && initialChoice) || (typeof arsenalInitialState !== 'undefined' ? arsenalInitialState.choice : null);
  const branch=activeBranch();
  if(!branch)return rootChoice;
  return {
    ...rootChoice,
    allowNamedOrFilter:!!branch.allowNamedOrFilter,
    categories:branch.categories||null,
    names:branch.names||null,
    type:branch.type||null,
    combat:branch.combat||null,
    maxPrice:branch.maxPrice||null,
    isCraftTool:!!branch.isCraftTool,
    defaultOptions:branch.defaultOptions||null,
    ...branch
  };
}
function normalizeOfficeKey(raw){
  const t=starterKey(raw);
  const defs=ITEM_CHOICE_DEFINITIONS.instrumentos_de_oficio?.fields?.[0]?.options||[];
  const found=defs.find(o=>o[0] && (starterKey(o[0])===t||starterKey(o[1]).includes(t)));
  return found?found[0]:t;
}
function syncInitialFilterSummary(){
  if(!initialChoice)return;
  const effective=typeof effectiveInitialChoice==='function'?effectiveInitialChoice():initialChoice;
  if(effective?.id==='armor'||initialChoice?.id==='armor'){
    if(advancedFilters)advancedFilters.hidden=true;
    return;
  }
  if(effective?.isBudgetGrant||initialChoice?.isBudgetGrant){
    if(advancedFilters)advancedFilters.hidden=false;
    baseSyncAdvancedFiltersButton();
    return;
  }
  const branch=activeBranch();
  const values=[branch?branch.label:(initialChoice.id==='simple'?'Armas simples':initialChoice.id==='martial'?'Armas marciais':initialChoice.id==='armor'?'Armaduras permitidas':(initialChoice.source==='origin'||initialChoice.filterLabel)?'Escolha':initialChoice.title)];
  if(initialChoice.type==='arma'&&state.combat!=='todos')values.push(COMBAT_LABELS[state.combat]||humanize(state.combat));
  if(initialChoice.type==='arma'&&state.grip!=='todos')values.push(GRIP_LABELS[state.grip]||humanize(state.grip));
  syncAdvancedFiltersButton(values.join(' · '));
  advancedFilters.hidden=false;
}
function syncShopFilterSummary(){
  syncAdvancedFiltersButton();
}
function findStartingItem(raw){
  const clean=String(raw||'').replace(/\s*[xX]\s*\d+\s*$/,'').trim();
  const stripped=clean.replace(/^\d+\s+/,'').trim();
  const key=starterKey(clean);
  const rawKey=starterKey(raw);
  const strippedKey=starterKey(stripped);
  return preparedItems.find(item=>!isSpecificMagicItem(item)&&!isLiturgicalItem(item)&&(
    starterKey(item.nome)===key||starterKey(item.id)===key||
    starterKey(item.nome)===rawKey||starterKey(item.id)===rawKey||
    starterKey(item.nome)===strippedKey||starterKey(item.id)===strippedKey||
    (strippedKey==='racoes_de_viagem'&&item.id==='racao_de_viagem')||
    (strippedKey==='flechas'&&item.id==='flechas')
  ));
}
