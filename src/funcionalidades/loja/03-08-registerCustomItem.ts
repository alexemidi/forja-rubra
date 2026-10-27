

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
    forjaArsenalStorage.setItem(DEBUG_ITEM_OVERRIDES_STORAGE_KEY, JSON.stringify(debugItemOverrides));
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
    const arrow = button.querySelector('.expand-arrow');
    const text = button.querySelector('.expand-text');
    if (arrow) arrow.textContent = expanded ? '▴' : '▾';
    if (text) text.textContent = expanded ? 'Recolher' : 'Ver mais';
    else button.innerHTML = expanded ? '<span class="expand-arrow">▴</span> <span class="expand-text">Recolher</span>' : '<span class="expand-arrow">▾</span> <span class="expand-text">Ver mais</span>';
    button.setAttribute('aria-expanded', String(expanded));
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
    const item = itemById.get(button.dataset.itemId);
    const opts = catalogOptionsForItem(item);
    if (button.dataset.itemId === 'instrumentos_de_oficio' && !opts.oficio) {
      if (typeof showToast === 'function') showToast('Por favor, selecione um ofício antes de adicionar os instrumentos ao carrinho.');
      return;
    }
    addItemToCart(button.dataset.itemId, opts);
    return;
  }
  if (button.dataset.action === 'receive-reward-item') {
    const itemId = button.dataset.itemId;
    const item = itemById.get(itemId);
    const options = catalogOptionsForItem(item);
    if (window.__FORJA_CONTEXT__ && window.parent !== window) {
      postArsenal('claim-reward-item', { itemId: itemId, options: options });
    } else {
      try {
        const rawHero = localStorage.getItem('forja-heroi-t20-v1');
        if (rawHero) {
          const hero = JSON.parse(rawHero);
          const bpKey = Array.isArray(hero.bag) ? 'bag' : (Array.isArray(hero.inventory) ? 'inventory' : 'backpack');
          hero[bpKey] = hero[bpKey] || [];
          hero[bpKey].push({
            itemId: itemId,
            quantidade: 1,
            options: options,
            itemSnapshot: item
          });
          localStorage.setItem('forja-heroi-t20-v1', JSON.stringify(hero));
        }
        const rawProfiles = localStorage.getItem('arsenal-arton-character-profiles-v1');
        if (rawProfiles) {
          const parsed = JSON.parse(rawProfiles);
          const active = parsed.profiles?.find(p => p.id === 'ficha-ativa') || parsed.profiles?.find(p => p.id === parsed.activeId) || parsed.profiles?.[0];
          if (active) {
            active.backpack = active.backpack || [];
            active.backpack.push({
              itemId: itemId,
              quantidade: 1,
              options: options,
              itemSnapshot: item
            });
            localStorage.setItem('arsenal-arton-character-profiles-v1', JSON.stringify(parsed));
          }
        }
        if (typeof showToast === 'function') {
          showToast(`"${item?.nome || 'Item'}" resgatado com sucesso e adicionado à mochila!`);
        }
      } catch (err) {
        console.error('Erro ao resgatar recompensa standalone:', err);
      }
    }
    return;
  }
  if(button.dataset.action==='configure-purchase'){
    openPurchaseUpgrade(button.dataset.itemId,button.dataset.kind);return;
  }
});

document.addEventListener('click',async function(event){
  const button=event.target.closest?.('#purchaseUpgradeModal [data-action]');
  if(!button)return;
  const modal=document.getElementById('purchaseUpgradeModal');
  const action=button.dataset.action;
  if(action==='close-purchase-upgrade'){closeModal(modal);return}
  const draft=purchaseDraft(modal.dataset.itemId);
  const item=itemById.get(modal.dataset.itemId);
  if(action==='select-sidebar-improvement'){
    const impId=button.dataset.impId;
    const maxAllowed=typeof getMaxAllowedImprovements === 'function' ? getMaxAllowedImprovements() : Number(modal?.dataset?.maxImprovements || 4);
    if(draft&&impId&&draft.improvements.length<maxAllowed&&!draft.improvements.some(e=>e.id===impId)){
      draft.improvements.push({id:impId,materialId:''});
      sanitizeInstanceImprovements(draft,item);
      refreshPurchaseUpgrade();
    }
    return;
  }
  if(action==='remove-sidebar-improvement'){
    const impId=button.dataset.impId;
    if(draft&&impId){
      draft.improvements=draft.improvements.filter(e=>e.id!==impId);
      sanitizeInstanceImprovements(draft,item);
      refreshPurchaseUpgrade();
    }
    return;
  }
  if(action==='remove-slot-improvement'){
    const slot=Number(button.dataset.slot);
    if(draft&&!Number.isNaN(slot)){
      draft.improvements.splice(slot,1);
      sanitizeInstanceImprovements(draft,item);
      refreshPurchaseUpgrade();
    }
    return;
  }
  if(action==='select-sidebar-enchantment'){
    const encId=button.dataset.encId;
    const maxAllowedEncs=typeof getMaxAllowedEnchantments === 'function' ? getMaxAllowedEnchantments() : Number(modal?.dataset?.maxEnchantments || 3);
    const enc=enchantmentById.get(encId);
    const slotCost=typeof enchantmentSlotCost === 'function' ? enchantmentSlotCost(enc) : 1;
    const currentUsed=typeof enchantmentSlotsUsed === 'function' ? enchantmentSlotsUsed(draft?.enchantments || []) : (draft?.enchantments?.length || 0);
    if(draft&&encId&&currentUsed+slotCost<=maxAllowedEncs&&!draft.enchantments.includes(encId)){
      draft.enchantments.push(encId);
      sanitizeInstanceEnchantments(draft,item);
      refreshPurchaseUpgrade();
    }
    return;
  }
  if(action==='remove-sidebar-enchantment'){
    const encId=button.dataset.encId;
    if(draft&&encId){
      draft.enchantments=(draft.enchantments||[]).filter(id=>id!==encId);
      sanitizeInstanceEnchantments(draft,item);
      refreshPurchaseUpgrade();
    }
    return;
  }
  if(action==='remove-slot-enchantment'){
    const slot=Number(button.dataset.slot);
    if(draft&&!Number.isNaN(slot)&&Array.isArray(draft.enchantments)){
      draft.enchantments.splice(slot,1);
      sanitizeInstanceEnchantments(draft,item);
      refreshPurchaseUpgrade();
    }
    return;
  }
  if(action==='select-material-card'){
    if(button.dataset.disabledBudget==='true')return;
    const matId=button.dataset.materialId;
    if(draft&&matId){
      const maxAllowed=typeof getMaxAllowedImprovements === 'function' ? getMaxAllowedImprovements() : Number(modal?.dataset?.maxImprovements || 4);
      let choice=draft.improvements.find(entry=>entry.id==='material_especial');
      if(!choice){
        if(draft.improvements.length < maxAllowed){
          draft.improvements.push({id:'material_especial',materialId:matId});
          sanitizeInstanceImprovements(draft,item);
          refreshPurchaseUpgrade();
        } else {
          showToast('Limite de melhorias atingido.');
        }
      } else {
        if(choice.materialId === matId){
          draft.improvements = draft.improvements.filter(entry=>entry.id!=='material_especial');
        } else {
          choice.materialId=matId;
        }
        sanitizeInstanceImprovements(draft,item);
        refreshPurchaseUpgrade();
      }
    }
    return;
  }
  if(action==='add-configured-to-cart'){
    const status=materialSelectionStatus(draft,item);
    if(!status.complete){showToast('Escolha qual material especial será usado.');refreshPurchaseUpgrade();return}
    if(status.rare){
      const decision=await catalogDecision('Este material é raro e não possui preço de venda. O mestre autorizou esta aquisição?',[{value:'cancel',label:'Não, voltar'},{value:'authorized',label:'Sim, mestre autorizou',primary:true}],'Material raro');
      if(decision!=='authorized')return;
    }
    if (item) {
      draft.options = Object.assign({}, catalogOptionsForItem(item), draft.options || {});
    }
    addItemToCart(button.dataset.itemId,draft.options);
    draft.improvements=[];
    draft.enchantments=[];
    closeModal(modal);
  }
});
document.addEventListener('change',function(event){const modal=event.target.closest?.('#purchaseUpgradeModal');if(!modal)return;const draft=purchaseDraft(modal.dataset.itemId),item=itemById.get(modal.dataset.itemId),control=event.target,index=Number(control.dataset.slot);if(control.dataset.action==='improvement'){const choices=draft.improvements.slice();if(!control.value)choices.splice(index,1);else choices[index]={id:control.value,materialId:choices[index]?.id===control.value?choices[index].materialId:''};draft.improvements=choices.filter(Boolean);sanitizeInstanceImprovements(draft,item)}else if(control.dataset.action==='enchantment'){const choices=draft.enchantments.slice();if(!control.value)choices.splice(index,1);else choices[index]=control.value;draft.enchantments=choices.filter(Boolean);sanitizeInstanceEnchantments(draft,item)}else if(control.dataset.action==='material'){const choice=draft.improvements.find(entry=>entry.id==='material_especial');if(choice)choice.materialId=control.value}else return;refreshPurchaseUpgrade()});
document.addEventListener('input',function(event){
  const input=event.target.closest?.('#purchaseUpgradeModal [data-action="filter-sidebar-improvements"]');
  if(!input)return;
  const modal=document.getElementById('purchaseUpgradeModal');
  if(modal)modal.dataset.searchQuery=input.value;
  const q=input.value.trim().toLowerCase();
  const items=modal?.querySelectorAll('.sidebar-improvement-item')||[];
  items.forEach(el=>{
    const searchTarget=(el.dataset.impSearch||'').toLowerCase();
    el.style.display=(!q||searchTarget.includes(q))?'':'none';
  });
});
document.addEventListener('search',function(event){
  const input=event.target.closest?.('#purchaseUpgradeModal [data-action="filter-sidebar-improvements"]');
  if(!input)return;
  const modal=document.getElementById('purchaseUpgradeModal');
  if(modal)modal.dataset.searchQuery=input.value;
  const q=input.value.trim().toLowerCase();
  const items=modal?.querySelectorAll('.sidebar-improvement-item')||[];
  items.forEach(el=>{
    const searchTarget=(el.dataset.impSearch||'').toLowerCase();
    el.style.display=(!q||searchTarget.includes(q))?'':'none';
  });
});

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
  if (item.id === 'instrumentos_de_oficio' && control.dataset.itemOption === 'oficio') {
    const ofVal = control.value;
    const newName = ofVal ? (typeof formatCraftToolName === 'function' ? formatCraftToolName(ofVal) : `Instrumentos do ${ofVal}`) : 'Instrumentos de Ofício';
    const titleEl = card.querySelector('.item-title');
    if (titleEl) titleEl.textContent = newName;
    const buyBtn = card.querySelector('[data-action="add-to-cart"]');
    if (buyBtn) {
      if (!ofVal) {
        buyBtn.setAttribute('disabled', '');
        buyBtn.classList.add('is-disabled');
        buyBtn.setAttribute('title', 'Selecione o ofício antes de adicionar ao carrinho');
      } else {
        buyBtn.removeAttribute('disabled');
        buyBtn.classList.remove('is-disabled');
        buyBtn.removeAttribute('title');
      }
    }
    if (typeof clearCatalogCardCache === 'function') clearCatalogCardCache();
  }
  if (control.dataset.itemOption === 'weaponModel') applyFilters();
});

catalogViewBtn?.addEventListener('click', function() { setView('catalog'); });
backpackViewBtn?.addEventListener('click', function() {
  if (cartItems.length) openCartDecision(true);
  else setView('backpack');
});
backpackListModeBtn.addEventListener('click', function() { setBackpackMode('list'); });
backpackCardsModeBtn.addEventListener('click', function() { setBackpackMode('cards'); });
document.getElementById('emptyBackpackCatalogBtn').addEventListener('click', function() { setView('catalog'); });

backpackList.addEventListener('click', async function(event) {
  const compactRow=event.target.closest?.('.backpack-compact-row');
  if(compactRow&&!event.target.closest('button, input, select, a')){
    const entry=compactRow.closest('[data-instance-id]');
    if(entry){
      expandedBackpackInstanceId=expandedBackpackInstanceId===entry.dataset.instanceId?null:entry.dataset.instanceId;
      renderBackpack();
      return;
    }
  }
  const expandBtn = event.target.closest?.('[data-sheet-card-expand]');
  if (expandBtn) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const itemCard = expandBtn.closest('.item-card');
    if (itemCard) {
      if (itemCard.classList.contains('expanded')) {
        expandedBackpackInstanceId = null;
        renderBackpack();
      } else {
        itemCard.classList.add('expanded');
        const arrow = expandBtn.querySelector('.expand-arrow');
        const txt = expandBtn.querySelector('.expand-text');
        if (arrow) arrow.textContent = '▴';
        if (txt) txt.textContent = 'Recolher item';
      }
    }
    return;
  }


  const actionButton = event.target.closest('button[data-action]');
  if (!actionButton) return;
  const card = actionButton.closest('[data-instance-id]');
  const instance = card && getBackpackInstance(card.dataset.instanceId);
  if (!instance) return;
  const action = actionButton.dataset.action;
  if (action === 'open-details') {
    expandedBackpackInstanceId = expandedBackpackInstanceId === instance.instanceId ? null : instance.instanceId;
    renderBackpack();
  } else if (action === 'destroy-contraption') {
    const item = itemById.get(instance.itemId);
    const itemName = item ? configuredItemName(instance, item) : 'Engenhoca';
    const decision = await catalogDecision('Deseja realmente destruir ' + itemName + ' para liberar espaço?', [{ value: 'keep', label: 'Não, manter' }, { value: 'destroy', label: 'Sim, destruir', danger: true }], 'Destruir Engenhoca');
    if (decision !== 'destroy') return;
    backpackItems = backpackItems.filter(function(entry) { return entry.instanceId !== instance.instanceId; });
    const active = activeCharacterProfile();
    if (active) active.backpack = backpackItems;
    if (expandedBackpackInstanceId === instance.instanceId) expandedBackpackInstanceId = null;
    refreshInventoryUI();
    showToast(itemName + ' destruída.');
    return;
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

backpackList.addEventListener('keydown', function(event){
  if((event.key==='Enter'||event.key===' ')&&event.target.matches?.('.backpack-compact-row')){
    event.preventDefault();
    event.target.querySelector('[data-action="open-details"]')?.click();
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

characterButton?.addEventListener('click', function() {
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

cartButton?.addEventListener('click', function() {
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

customItemButton?.addEventListener('click', function() {
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
  if (!button || button.disabled) return;
  state.type = button.dataset.value;
  state.category = 'todos';
  state.combat = 'todos';
  state.grip = 'todos';
  renderContextFilters();
  applyFilters();
});

specificFilters.addEventListener('click', function(event) {
  const button = event.target.closest('.specific-chip');
  if (!button || button.disabled) return;
  state.specific = button.dataset.value;
  state.magicTier = 'todos';
  const availableCats = state.type === 'todos' ? [] : categoryValuesForType(state.type);
  if (state.category !== 'todos' && !availableCats.includes(state.category)) {
    state.category = 'todos';
  }
  renderTypeFilters();
  renderMagicTierFilters();
  renderContextFilters();
  applyFilters();
});

if (magicTierFilters) {
  magicTierFilters.addEventListener('click', function(event) {
    const button = event.target.closest('.tier-chip');
    if (!button) return;
    state.magicTier = button.dataset.value;
    renderMagicTierFilters();
    applyFilters();
  });
}

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
  const relatedActive = !state.searchNameOnly;
  nameOnlySearchButton.classList.toggle('active', relatedActive);
  nameOnlySearchButton.setAttribute('aria-pressed', String(relatedActive));
  searchInput.placeholder = relatedActive ? 'Buscar por nome, efeito, perícia ou descrição...' : 'Buscar pelo nome do item...';
  if (relatedActive && typeof showToast === 'function') {
    showToast('Digite uma palavra chave para o item desejado.');
  }
  applyFilters();
});

advancedFiltersButton.addEventListener('click', function(event) {
  const clearBadge = event.target.closest('[data-action="quick-clear-filters"]');
  if (clearBadge) {
    event.preventDefault();
    event.stopPropagation();
    resetFilters.click();
    return;
  }
  const open = advancedFiltersContent.hidden;
  advancedFiltersContent.hidden = !open;
  advancedFiltersButton.setAttribute('aria-expanded', String(open));
  filtersPanel.classList.toggle('advanced-open', open);
  syncAdvancedFiltersButton();
});

function verificarPermissaoMestreDebug() {
  let isMestre = false;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mestre') === 'true' || params.get('mestre') === '1') isMestre = true;
    if (localStorage.getItem('forja_is_master') === 'true' || localStorage.getItem('forja-modo-mestre') === 'true') isMestre = true;
  } catch {}
  if (debugModeButton) {
    if (isMestre) {
      debugModeButton.style.removeProperty('display');
      debugModeButton.style.display = '';
    } else {
      debugModeButton.style.setProperty('display', 'none', 'important');
      state.debugMode = false;
    }
  }
}
verificarPermissaoMestreDebug();

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
  state.magicTier = 'todos';
  state.category = 'todos';
  state.combat = 'todos';
  state.grip = 'todos';
  state.search = '';
  state.searchNameOnly = true;
  state.sort = 'name';
  searchInput.value = '';
  searchInput.placeholder = 'Buscar pelo nome do item...';
  sortSelect.value = 'name';
  renderTypeFilters();
  renderSpecificFilters();
  renderMagicTierFilters();
  renderContextFilters();
  applyFilters();
  syncFilterUI();
});

renderTypeFilters();
renderSpecificFilters();
renderMagicTierFilters();
renderContextFilters();
syncInspirationModeUI();
persistCharacterProfiles();
syncCharacterUI();
syncCartUI();

function initCardViewModeToggle() {
  const normalBtn = document.getElementById('cardModeNormalBtn');
  const compactBtn = document.getElementById('cardModeCompactBtn');
  const grid = document.getElementById('itemsGrid');
  if (!normalBtn || !compactBtn) return;

  function setMode(mode, persist = true) {
    const isCompact = mode === 'compact';
    normalBtn?.classList.toggle('active', !isCompact);
    normalBtn?.setAttribute('aria-pressed', String(!isCompact));
    compactBtn?.classList.toggle('active', isCompact);
    compactBtn?.setAttribute('aria-pressed', String(isCompact));
    if (grid) grid.classList.toggle('compact-cards', isCompact);
    document.body.classList.toggle('compact-cards-mode', isCompact);
    if (persist) {
      try { localStorage.setItem('forja_card_view_mode', mode); } catch (_) {}
    }
  }

  let saved = 'compact';
  try {
    saved = localStorage.getItem('forja_card_view_mode') || 'compact';
  } catch (_) {}
  setMode(saved, false);

  normalBtn.addEventListener('click', function() { setMode('detailed'); });
  compactBtn.addEventListener('click', function() { setMode('compact'); });
}
initCardViewModeToggle();

if (typeof arsenalInitialState === 'undefined') setView('catalog');
