
function applyArsenalContext(context = {}){
  pendingOperation=null;
  if(!context) context = {};
  const upgradeModal = document.getElementById('purchaseUpgradeModal');
  if(upgradeModal && typeof closeModal === 'function') closeModal(upgradeModal);
  const previousMode=arsenalInitialState?.mode || 'standalone';
  const previousChoiceId=initialChoice?.id||'';
  if(previousMode==='shop')shopFilters={type:state.type,specific:state.specific,category:state.category,combat:state.combat,grip:state.grip,search:state.search,sort:state.sort,searchNameOnly:state.searchNameOnly};
  arsenalInitialState={...(arsenalInitialState||{}),...context};
  if(context.storage && typeof context.storage === 'object'){
    Object.keys(arsenalStorageValues).forEach(key => delete arsenalStorageValues[key]);
    Object.assign(arsenalStorageValues, context.storage);
    characterProfiles = loadCharacterProfiles();
    const active = activeCharacterProfile();
    backpackItems = active ? (active.backpack || []) : [];
    cartItems = loadCart();
  }
  consolidateBackpackList();
  const mode=arsenalInitialState.mode;
  initialChoice=arsenalInitialState.choice;
  if(mode==='initial'&&previousChoiceId!==(initialChoice?.id||'')){
    purchaseDrafts.clear();
    if(typeof catalogOptionDrafts!=='undefined'&&catalogOptionDrafts.clear)catalogOptionDrafts.clear();
    selectedCandidate=null;
    pendingOperation=null;
  }
  if(typeof clearCatalogCardCache === 'function') clearCatalogCardCache();
  if(typeof catalogMarkup !== 'undefined') catalogMarkup = '';
  if(typeof catalogQueryKey !== 'undefined') catalogQueryKey = '';
  initialChoiceBranchId=null;
  selectedCraftOffice=null;
  selectedCandidate=arsenalInitialState.candidate||null;
  if(selectedCandidate?.itemId&&selectedCandidate.options)catalogOptionDrafts.set(selectedCandidate.itemId,{...selectedCandidate.options});
  if(selectedCandidate?.improvements?.length&&selectedCandidate.itemId){
    const draft=purchaseDraft(selectedCandidate.itemId);
    draft.improvements=selectedCandidate.improvements;
  }
  if(initialChoice?.branches?.length&&selectedCandidate?.itemId){
    const foundBranch=initialChoice.branches.find(b=>{
      if(b.names&&b.names.some(n=>starterKey(n)===starterKey(selectedCandidate.itemName)||starterKey(n)===selectedCandidate.itemId))return true;
      const it=itemById.get(selectedCandidate.itemId);
      if(it&&b.categories&&b.categories.includes(it.categoriaId))return true;
      if(it&&b.type&&b.type===it.tipo)return true;
      return false;
    });
    if(foundBranch)initialChoiceBranchId=foundBranch.id;
  }
  if(selectedCandidate?.itemId==='instrumentos_de_oficio'&&selectedCandidate.options?.oficio){
    selectedCraftOffice=selectedCandidate.options.oficio;
    catalogOptionDrafts.set('instrumentos_de_oficio',{oficio:selectedCraftOffice});
  }
  advancedFiltersContent.hidden=true;
  advancedFiltersButton.setAttribute('aria-expanded','false');
  filtersPanel.classList.remove('advanced-open');
  const profile=activeCharacterProfile();if(profile){profile.strength=arsenalInitialState.strength;profile.capacityBonus=Number(arsenalInitialState.capacityBonus)||0;profile.name=arsenalInitialState.characterName||profile.name}
  document.body.classList.toggle('initial-equipment',mode==='initial');
  document.body.classList.toggle('initial-equipment-review',mode==='backpack');
  document.body.classList.toggle('embedded-shop',mode==='shop'||mode==='reward');
  document.body.classList.toggle('reward-mode',Boolean(arsenalInitialState.isRewardMode||mode==='reward'));
  document.body.classList.toggle('workshop-mode',mode==='workshop');
  document.body.classList.toggle('workshop-readonly',Boolean(arsenalInitialState.workshopReadOnly));
  if(mode!=='workshop'){
    const wsSec=typeof itemsGrid!=='undefined'&&itemsGrid?itemsGrid.querySelector('.workshop-backpack-section'):null;
    if(wsSec)wsSec.remove();
  }
  shopActions.hidden=mode==='initial';advancedFilters.hidden=mode==='backpack';
  state.backpackMode=state.backpackMode||'list';
  if(mode==='initial'){
    const branch=activeBranch();
    const effectiveChoice=effectiveInitialChoice();
    state.type=effectiveChoice.allowNamedOrFilter?'todos':(effectiveChoice.type||'todos');
    state.category=effectiveChoice.allowNamedOrFilter?'todos':(effectiveChoice.category||'todos');
    state.specific='convencional';
    state.combat=effectiveChoice.combat||'todos';
    state.grip='todos';
    state.search='';
    state.searchNameOnly=true;
    if(typeof nameOnlySearchButton!=='undefined'&&nameOnlySearchButton){
      nameOnlySearchButton.textContent='Busca relacionada';
      nameOnlySearchButton.classList.remove('active');
      nameOnlySearchButton.setAttribute('aria-pressed','false');
    }
    if(typeof searchInput!=='undefined'&&searchInput){
      searchInput.placeholder='Buscar pelo nome do item...';
      searchInput.value='';
    }
    syncInitialFilterSummary();
    renderContextFilters();
    weaponFilters.hidden=effectiveChoice.type!=='arma'&&!effectiveChoice.categories?.length;
    setView('catalog');
  }else if(mode==='backpack')setView('backpack');
  else if(mode==='workshop'){
    const isEngenhoqueiro = arsenalInitialState.workshopSection === 'engenhoqueiro';
    const isContraptionAttach = Boolean(arsenalInitialState?.contraptionAttach);
    if (isEngenhoqueiro || isContraptionAttach) {
      if (typeof filtersPanel !== 'undefined' && filtersPanel) {
        filtersPanel.hidden = true;
        filtersPanel.style.display = 'none';
      }
      if (isEngenhoqueiro) {
        const heading = document.querySelector('.catalog-heading');
        if (heading) heading.style.display = 'none';
      }
      setView('catalog');
    } else {
      if (typeof filtersPanel !== 'undefined' && filtersPanel) {
        filtersPanel.hidden = false;
        filtersPanel.style.display = '';
      }
      const heading = document.querySelector('.catalog-heading');
      if (heading) heading.style.display = '';
      state.type='todos';
      state.category='todos';
      state.specific='convencional';
      state.combat='todos';
      state.grip='todos';
      state.search='';
      state.searchNameOnly=true;
      if(typeof searchInput!=='undefined'&&searchInput){
        searchInput.placeholder='Buscar itens na bancada da oficina...';
        searchInput.value='';
      }
      if (typeof advancedFiltersContent !== 'undefined' && advancedFiltersContent) {
        advancedFiltersContent.hidden = false;
      }
      if (typeof advancedFiltersButton !== 'undefined' && advancedFiltersButton) {
        advancedFiltersButton.setAttribute('aria-expanded', 'true');
      }
      if (typeof filtersPanel !== 'undefined' && filtersPanel) {
        filtersPanel.classList.add('advanced-open');
      }
      if (typeof renderTypeFilters === 'function') renderTypeFilters();
      if (typeof renderSpecificFilters === 'function') renderSpecificFilters();
      renderContextFilters();
      setView('catalog');
    }
  }else{
    Object.assign(state,shopFilters||{type:'todos',category:'todos',specific:'convencional',combat:'todos',grip:'todos',search:'',searchNameOnly:true});
    searchInput.value=state.search;
    const relatedActive=!state.searchNameOnly;
    if(typeof nameOnlySearchButton!=='undefined'&&nameOnlySearchButton){
      nameOnlySearchButton.textContent='Busca relacionada';
      nameOnlySearchButton.classList.toggle('active',relatedActive);
      nameOnlySearchButton.setAttribute('aria-pressed',String(relatedActive));
    }
    if(typeof searchInput!=='undefined'&&searchInput){
      searchInput.placeholder=relatedActive?'Buscar por nome, efeito, perícia ou descrição...':'Buscar pelo nome do item...';
    }
    renderContextFilters();setView('catalog');
  }
  syncEmbeddedShopActions();postArsenal('ready');
}
function proposeOperation(type,message={}){
  if(pendingOperation && message.operationId && pendingOperation.operationId === message.operationId && !message.forceNew){
    postArsenal('operation',pendingOperation);
    return;
  }
  pendingOperation=null;
  const before={storage:{...arsenalStorageValues},profiles:JSON.stringify(characterProfiles),cart:JSON.stringify(cartItems)};
  const id=message.operationId||('purchase:'+createInstanceId());
  const grants=[],unresolved=[];
  let total=type==='purchase'?(message.customTotal != null ? Math.max(0, Number(message.customTotal)) : cartTotalsInfo().value):0;
  const gift=type==='purchase'&&(Boolean(message.asGift)||Boolean(message.gift));
  arsenalTransaction=true;
  try{
    if(type==='purchase'){
      if(!gift && total > Number(arsenalInitialState?.funds || 0)){
        throw new Error('Saldo insuficiente para concluir a compra.');
      }
      const activeProf = characterProfiles.profiles?.find(p => p.id === characterProfiles.activeId);
      const limits = typeof carryingLimits === 'function' ? carryingLimits(activeProf?.strength, activeProf?.capacityBonus) : { normal: 10, maximum: 20 };
      const currentSpaces = typeof backpackTotals === 'function' ? backpackTotals().spaces : 0;
      const cartSpaces = typeof cartTotalsInfo === 'function' ? cartTotalsInfo().spaces : 0;
      if (currentSpaces + cartSpaces > limits.maximum) {
        throw new Error(`Carga máxima excedida (${(currentSpaces + cartSpaces).toFixed(1)} / ${limits.maximum} espaços). Reduza itens do carrinho antes de finalizar.`);
      }
      cartItems.forEach(entry=>addPackagesToBackpack(entry.itemId,entry.quantity,entry.options,{source:gift?'gift':'purchase',operationId:id},entry));
    }
    if(type==='craft'){
      const item=itemById.get(message.itemId),options=message.options||{},instance={itemId:message.itemId,quantity:1,...options},improvementCount=(instance.improvements||[]).length,enchantmentCount=(instance.enchantments||[]).length;
      if(!item) throw new Error('Item não encontrado.');
      // @ts-ignore
      const rules = typeof RegrasManufatura !== 'undefined' ? RegrasManufatura : null;
      const sectionKey = arsenalInitialState.workshopSection || 'artesao';
      const sec = rules?.secoesOficina?.[sectionKey];
      if(sec && typeof sec.corresponde === 'function' && !sec.corresponde(item)){
        throw new Error('Item incompatível com a oficina ' + (sec.title || 'selecionada') + '.');
      }
      const maxCraftAllowed = typeof getMaxAllowedImprovements === 'function' ? getMaxAllowedImprovements() : Number(arsenalInitialState.crafting?.improvements || 1);
      if(improvementCount > maxCraftAllowed) throw new Error('Você ainda não pode fabricar esta quantidade de melhorias.');
      if(enchantmentCount && !(typeof getMaxAllowedEnchantments === 'function' ? getMaxAllowedEnchantments() > 0 : arsenalInitialState.crafting?.magic)) throw new Error('Você ainda não pode fabricar itens encantados.');

      const value=entryValueInfo(instance,effectiveItemForOptions(item,instance));
      const isAlchemOrPotion = (item?.categoriaId === 'alquimico_preparado' || item?.tipo === 'pocao' || sectionKey === 'alquimista' || /alquim/i.test(item?.tipo || ''));
      const drogadoraOpt = (arsenalInitialState.crafting?.isDrogadora && isAlchemOrPotion) ? { isDrogadora: true } : {};
      total=message.totalCost != null ? Number(message.totalCost) : (rules ? rules.custoMateriaPrima(value.unitKnown, drogadoraOpt) : Math.ceil(value.unitKnown/(drogadoraOpt.isDrogadora ? 4 : Number(MAGIC_RULES.divisorCustoFabricacao||3))));
      if(total>arsenalInitialState.funds)throw new Error('Saldo insuficiente para as matérias-primas.');
      const outcome = message.outcome || (message.failedCraft ? 'fail_major_self' : 'success_self');
      total = message.totalCost != null ? Number(message.totalCost) : (rules ? rules.custoMateriaPrima(value.unitKnown, drogadoraOpt) : Math.ceil(value.unitKnown/(drogadoraOpt.isDrogadora ? 4 : Number(MAGIC_RULES.divisorCustoFabricacao||3))));
      if(total > arsenalInitialState.funds) throw new Error('Saldo insuficiente para as matérias-primas.');

      if(!message.existingInstanceId && (outcome === 'success_self' || outcome === 'fail_minor_self')){
        const activeProf = characterProfiles.profiles?.find(p => p.id === characterProfiles.activeId);
        const limits = typeof carryingLimits === 'function' ? carryingLimits(activeProf?.strength, activeProf?.capacityBonus) : { normal: 10, maximum: 20 };
        const currentSpaces = typeof backpackTotals === 'function' ? backpackTotals().spaces : 0;
        const itemSpaces = Number(item.espacos || 0);
        if (currentSpaces + itemSpaces > limits.maximum) {
          throw new Error(`Carga máxima excedida! Não é possível carregar mais de ${limits.maximum} espaços.`);
        }
      }

      if(outcome === 'success_self'){
        if(message.existingInstanceId){
          const target = backpackItems.find(it => it.instanceId === message.existingInstanceId);
          if(target){
            const newImps = (options.improvements || []).map(imp => ({ ...imp }));
            const newEncs = options.enchantments ? options.enchantments.slice() : [];
            const itObj = itemById.get(target.itemId);
            if((target.quantity || 1) > 1){
              target.quantity -= 1;
              const newInstance = {
                ...target,
                instanceId: createInstanceId(),
                quantity: 1,
                improvements: newImps,
                enchantments: newEncs
              };
              if(itObj && typeof configuredItemName === 'function'){
                newInstance.displayName = configuredItemName(newInstance, itObj);
              }
              const effTarget = typeof effectiveItemForOptions === 'function' ? effectiveItemForOptions(itObj, newInstance) : itObj;
              const vInfo = typeof entryValueInfo === 'function' ? entryValueInfo(newInstance, effTarget) : null;
              const newUnitPrice = vInfo?.unitKnown ?? Number(itObj?.preco?.valor || 0);
              newInstance.customPrice = newUnitPrice;
              newInstance.price = newUnitPrice;
              newInstance.preco = { valor: newUnitPrice, moeda: itObj?.preco?.moeda || 'T$' };
              newInstance.unitValue = newUnitPrice;
              backpackItems.push(newInstance);
            } else {
              target.improvements = newImps;
              if(options.enchantments) target.enchantments = newEncs;
              if(itObj && typeof configuredItemName === 'function'){
                target.displayName = configuredItemName(target, itObj);
              }
              const effTarget = typeof effectiveItemForOptions === 'function' ? effectiveItemForOptions(itObj, target) : itObj;
              const vInfo = typeof entryValueInfo === 'function' ? entryValueInfo(target, effTarget) : null;
              const newUnitPrice = vInfo?.unitKnown ?? Number(itObj?.preco?.valor || 0);
              target.customPrice = newUnitPrice;
              target.price = newUnitPrice;
              target.preco = { valor: newUnitPrice, moeda: itObj?.preco?.moeda || 'T$' };
              target.unitValue = newUnitPrice;
            }
          }
        } else {
          addPackagesToBackpack(item.id, 1, options, { source: 'craft', operationId: id });
        }
      } else if(outcome === 'success_ally'){
        // Item forjado com sucesso e entregue ao aliado: se era item existente da mochila, sai da mochila!
        if(message.existingInstanceId){
          const target = backpackItems.find(it => it.instanceId === message.existingInstanceId);
          if(target && (target.quantity || 1) > 1){
            target.quantity -= 1;
          } else {
            backpackItems = backpackItems.filter(it => it.instanceId !== message.existingInstanceId);
          }
        }
      } else if(outcome === 'fail_minor_self'){
        if(message.existingInstanceId){
          // Item existente é mantido sem a nova melhoria
        } else {
          // Item novo mundano é mantido/adicionado à mochila sem melhorias
          const baseOptions = { ...options, improvements: [], enchantments: [] };
          addPackagesToBackpack(item.id, 1, baseOptions, { source: 'craft', operationId: id });
        }
      } else if(outcome === 'fail_minor_ally'){
        // Para aliado, falhou por menos de 5: armeiro fica com o item mundano na sua mochila
        const baseOptions = { ...options, improvements: [], enchantments: [] };
        addPackagesToBackpack(item.id, 1, baseOptions, { source: 'craft', operationId: id });
      } else if(outcome === 'fail_major_self'){
        if(message.existingInstanceId){
          // Falha por 5 ou mais: 1 unidade do item existente é estragada/destruída da mochila!
          const target = backpackItems.find(it => it.instanceId === message.existingInstanceId);
          if(target && (target.quantity || 1) > 1){
            target.quantity -= 1;
          } else {
            backpackItems = backpackItems.filter(it => it.instanceId !== message.existingInstanceId);
          }
        }
        // Item novo: perde todo o material e nada é adicionado
      } else if(outcome === 'fail_major_ally'){
        // Falha crítica para aliado: se era item existente da mochila, ele foi estragado/destruído!
        if(message.existingInstanceId){
          const target = backpackItems.find(it => it.instanceId === message.existingInstanceId);
          if(target && (target.quantity || 1) > 1){
            target.quantity -= 1;
          } else {
            backpackItems = backpackItems.filter(it => it.instanceId !== message.existingInstanceId);
          }
        }
      }
      const baseCD = rules ? rules.cdFabricacao(item) : 15;
      message.craftCd=message.craftCd || ((enchantmentCount?Number(MAGIC_RULES.cdBaseItemEncantado||20):baseCD)+IMPROVEMENT_CRAFT_BONUSES[Math.min(4,improvementCount)]+ENCHANTMENT_CRAFT_BONUSES[Math.min(3,enchantmentCount)]);
    }
    if(type==='initial'&&message.selection){
      const selItemId=message.selection.itemId;
      const options=resolveDefaultItemOptions(selItemId,message.selection.options);
      addPackagesToBackpack(selItemId,1,options,{source:message.source||'initial',grantId:message.grantId},message.selection);
      grantStarterAmmo(itemById.get(selItemId),message.grantId,message.source||'initial');
      if(message.grantId && !grants.includes(message.grantId))grants.push(message.grantId);
    }
    for(const grant of message.automaticGrants||[]){
      if(backpackItems.some(entry=>entry.acquisition?.grantId===grant.id || (entry.acquisition?.additionalGrantIds||[]).includes(grant.id))){
        if(!grants.includes(grant.id))grants.push(grant.id);
        continue;
      }
      const item=findStartingItem(grant.name);
      const qtyMatch = String(grant.name || '').match(/[xX]\s*(\d+)\s*$/) || String(grant.name || '').match(/^(\d+)\s+/);
      const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
      if(item){
        addPackagesToBackpack(item.id,qty,{}, {source:grant.source,grantId:grant.id});
        if(!grants.includes(grant.id))grants.push(grant.id);
        grantStarterAmmo(item,grant.id,grant.source);
      }else{
        const customId='origin-custom-'+starterKey(grant.id).replace(/ /g,'-'),snapshot={id:customId,nome:grant.name,tipo:'item_geral',categoriaId:'equipamento_aventura',espacos:0,preco:{valor:0,moeda:'T$'},descricao:'Item concedido pela origem.'};
        itemById.set(customId,prepareCatalogItem(snapshot));
        addPackagesToBackpack(customId,qty,{}, {source:grant.source,grantId:grant.id});
        if(!grants.includes(grant.id))grants.push(grant.id);
      }
    }
    consolidateBackpackList();
    if(type==='purchase')cartItems=[];
    persistBackpack();persistCart();
    pendingOperation={operationId:id,kind:type,storage:{...arsenalStorageValues},total,gift,grants,unresolved,finalize:!!message.finalize,craftCd:message.craftCd,percent:message.percent};
  }finally{
    if(!window.__FORJA_CONTEXT__ || window.parent === window){
      if(type==='purchase'){
        if(typeof arsenalInitialState!=='undefined'){
          arsenalInitialState.funds=Math.max(0,Math.round(((Number(arsenalInitialState.funds)||0)-(gift?0:total))*100)/100);
          if(typeof syncEmbeddedShopActions==='function')syncEmbeddedShopActions();
        }
        if(typeof refreshInventoryUI==='function')refreshInventoryUI();
        if(typeof closeModal==='function'&&typeof cartModal!=='undefined')closeModal(cartModal);
        showToast(gift?'Item adicionado como presente, sem custos.':'Compra finalizada por '+formatCurrencyValue(total,'T$')+'.');
      }
      arsenalTransaction=false;
    }else{
      Object.keys(arsenalStorageValues).forEach(key=>delete arsenalStorageValues[key]);Object.assign(arsenalStorageValues,before.storage);
      characterProfiles=JSON.parse(before.profiles);backpackItems=activeCharacterProfile()?.backpack||[];cartItems=JSON.parse(before.cart);arsenalTransaction=false;
    }
  }
  postArsenal('operation',pendingOperation);
}
shopActions.addEventListener('click',event=>{
  if(event.target.closest('[data-craft-mode]')){craftingMode=!craftingMode;applyFilters();syncEmbeddedShopActions();showToast(craftingMode?'Modo de fabricação ativo. Armas, armaduras e escudos mostram o custo em matérias-primas.':'Modo de compra ativo.');return}
  if(event.target.closest('[data-shop-cart]'))return openCartDecision(false);
  const view=event.target.closest('[data-shop-view]');if(!view)return;
  if(view.dataset.shopView==='backpack'){if(cartItems.length)openCartDecision(true);else setView('backpack')}
  else setView('catalog');
});
shopActions.addEventListener('input',event=>{if(event.target.matches('[data-money]'))postArsenal('money',{value:Number(event.target.value)||0})});
document.addEventListener('change',event=>{
  const katanaSelect=event.target.closest?.('[data-samurai-katana-improvement]');
  if(katanaSelect){
    const katana=itemById.get('katana');
    if(katana){
      const impId=katanaSelect.value;
      const improvements=impId?[{id:impId}]:[];
      executeChooseCandidate(katana,improvements);
      showToast(impId?'Melhoria da Katana Ancestral atualizada.':'Melhoria da Katana Ancestral removida.');
    }
    return;
  }
  const aristocrataSelect=event.target.closest?.('[data-aristocrata-katana-improvement]');
  if(aristocrataSelect){
    const katana=itemById.get('katana');
    if(katana){
      const impId=aristocrataSelect.value;
      const improvements=impId?[{id:impId}]:[];
      executeChooseCandidate(katana,improvements);
      showToast(impId?'Melhoria da Katana Superior selecionada.':'Melhoria removida.');
    }
    return;
  }
},true);
document.addEventListener('click',async event=>{
  if(pendingOperation&&!event.target.closest?.('#checkoutCart')){event.preventDefault();event.stopImmediatePropagation();showToast('Confirme novamente a operação pendente antes de alterar o carrinho.');return}
  const selectBudgetBtn=event.target.closest?.('[data-action="select-budget-item"]');
  if(selectBudgetBtn&&arsenalInitialState.mode==='initial'){
    event.preventDefault();event.stopImmediatePropagation();
    const modal=document.getElementById('purchaseUpgradeModal');
    const itemId=selectBudgetBtn.dataset.itemId || modal?.dataset?.itemId;
    const item=itemById.get(itemId);
    if(!item)return;
    const draft=purchaseDraft(itemId);
    const effectiveChoice=effectiveInitialChoice();
    const hasUnlimitedBudget = Boolean(effectiveChoice?.unlimitedBudget || effectiveChoice?.maxBudget === Infinity);
    const maxBudget=hasUnlimitedBudget ? Infinity : Number(effectiveChoice?.maxBudget||1000);
    const totalCost=entryValueInfo(draft,effectiveItemForOptions(item,draft)).unitKnown;
    const materialStatus=materialSelectionStatus(draft,effectiveItemForOptions(item,draft));
    if(!materialStatus.complete){
      showToast('Escolha qual material especial será usado.');
      syncBudgetUpgradeModalState(itemId);
      return;
    }
    if(!hasUnlimitedBudget && Number.isFinite(maxBudget) && totalCost>maxBudget){
      showToast('O custo total ('+formatCurrencyValue(totalCost,'T$')+') ultrapassa o orçamento disponível de '+formatCurrencyValue(maxBudget,'T$')+'.');
      return;
    }
    executeChooseCandidate(item,draft.improvements||[]);
    if(modal)closeModal(modal);
    showToast(configuredItemName({options:draft.options,improvements:draft.improvements},item)+' selecionado!');
    return;
  }
  const confirmKatanaBtn=event.target.closest?.('[data-action="confirm-samurai-katana"]');
  if(confirmKatanaBtn&&arsenalInitialState.mode==='initial'){
    event.preventDefault();event.stopImmediatePropagation();
    const katana=itemById.get('katana');
    if(katana){
      const select=document.querySelector('[data-samurai-katana-improvement]');
      const impId=select?.value||'';
      const improvements=impId?[{id:impId}]:[];
      executeChooseCandidate(katana,improvements);
      showToast('Katana Ancestral selecionada!');
    }
    return;
  }
  const confirmAristocrataBtn=event.target.closest?.('[data-action="confirm-aristocrata-katana"]');
  if(confirmAristocrataBtn&&arsenalInitialState.mode==='initial'){
    event.preventDefault();event.stopImmediatePropagation();
    const katana=itemById.get('katana');
    if(katana){
      const select=document.querySelector('[data-aristocrata-katana-improvement]');
      const impId=select?.value||'';
      const improvements=impId?[{id:impId}]:[];
      executeChooseCandidate(katana,improvements);
      showToast('Katana Superior confirmada!');
    }
    return;
  }
  const branchBtn=event.target.closest?.('[data-action="select-branch"]');
  if(branchBtn&&arsenalInitialState.mode==='initial'){
    event.preventDefault();event.stopImmediatePropagation();
    initialChoiceBranchId=branchBtn.dataset.branchId;
    selectedCraftOffice=null;
    const branch=activeBranch();
    if(branch?.isCraftTool){
      const trained=arsenalInitialState.trainedOffices||[];
      if(trained.length===1){
        selectedCraftOffice=normalizeOfficeKey(trained[0]);
        catalogOptionDrafts.set('instrumentos_de_oficio',{oficio:selectedCraftOffice});
        const item=itemById.get('instrumentos_de_oficio');
        if(item)chooseCandidate(item);
      }
    }
    applyFilters();
    const available=availableInitialItems();
    if(available.length===1&&!selectedCandidate){
      chooseCandidate(available[0]);
    }
    return;
  }
  const clearBranchBtn=event.target.closest?.('[data-action="clear-branch"]');
  if(clearBranchBtn&&arsenalInitialState.mode==='initial'){
    event.preventDefault();event.stopImmediatePropagation();
    initialChoiceBranchId=null;
    selectedCraftOffice=null;
    selectedCandidate=null;
    postArsenal('candidate',{itemId:''});
    applyFilters();return;
  }
  const craftOffice=event.target.closest?.('[data-action="select-craft-office"]');
  if(craftOffice&&arsenalInitialState.mode==='initial'){
    event.preventDefault();event.stopImmediatePropagation();
    selectedCraftOffice=craftOffice.dataset.craftOffice;
    if(selectedCraftOffice!=='outro'){
      catalogOptionDrafts.set('instrumentos_de_oficio',{oficio:selectedCraftOffice});
      const item=itemById.get('instrumentos_de_oficio');
      if(item)chooseCandidate(item);
    }
    applyFilters();return;
  }
  const choice=event.target.closest?.('[data-action="add-to-cart"]');
  if(choice&&arsenalInitialState.mode==='initial'){
    event.preventDefault();event.stopImmediatePropagation();
    const item=itemById.get(choice.dataset.itemId);
    if(item&&availableInitialItems().some(candidate=>candidate.id===item.id))chooseCandidate(item);
    return;
  }
  const potionBtn=event.target.closest?.('[data-action="choose-potion-spell"]');
  if(potionBtn){
    event.preventDefault();
    event.stopImmediatePropagation();
    if(window.__FORJA_CONTEXT__ && window.parent !== window){
      postArsenal('choose-potion-spell', { section: 'alquimista' });
    } else {
      window.location.href = 'grimorio.html?modo=pocao';
    }
    return;
  }
  const scrollBtn=event.target.closest?.('[data-action="choose-scroll-spell"]');
  if(scrollBtn){
    event.preventDefault();
    event.stopImmediatePropagation();
    postArsenal('choose-scroll-spell', { section: 'escriba' });
    return;
  }
  const tattooBtn=event.target.closest?.('[data-action="choose-tattoo-spell"]');
  if(tattooBtn){
    event.preventDefault();
    event.stopImmediatePropagation();
    postArsenal('choose-tattoo-spell', { section: 'tatuador' });
    return;
  }
  const engenhocaBtn=event.target.closest?.('[data-action="choose-engenhoca-spell"]');
  if(engenhocaBtn){
    event.preventDefault();
    event.stopImmediatePropagation();
    const curList = typeof getActiveContraptionsList === 'function' ? getActiveContraptionsList() : [];
    const maxLim = typeof resolverInteligenciaHeroiAtivo === 'function' ? resolverInteligenciaHeroiAtivo() : 5;
    if (curList.length >= maxLim) {
      const msg = `Limite de fabricação atingido (${curList.length}/${maxLim} engenhocas). Desmanche uma engenhoca existente para fabricar outra.`;
      if (typeof toast === 'function') toast(msg);
      else alert(msg);
      return;
    }
    if (window.parent && window.parent !== window) {
      postArsenal('choose-engenhoca-spell', { section: 'engenhoqueiro' });
    } else {
      window.location.href = 'engenhoca.html';
    }
    return;
  }
  const disBtn = event.target.closest?.('[data-action="disassemble-contraption"]');
  if (disBtn) {
    event.preventDefault();
    event.stopImmediatePropagation();
    // @ts-ignore
    const cId = disBtn.dataset.contraptionId;
    const doDisassemble = () => {
      // 1. Notifica pai caso esteja em iframe
      postArsenal('disassemble-contraption', { id: cId });

      // 2. Executa a limpeza direta e completa na loja/oficina
      const profKey = 'arsenal-arton-character-profiles-v1';
      let profiles = null;
      try {
        const raw = typeof arsenalStorageValues !== 'undefined' && arsenalStorageValues[profKey]
          ? arsenalStorageValues[profKey]
          : localStorage.getItem(profKey);
        if (raw) profiles = JSON.parse(raw);
      } catch (e) {}

      let activeP = null;
      if (profiles) {
        activeP = profiles.profiles?.find(p => p.id === 'ficha-ativa') ||
          profiles.profiles?.find(p => p.id === profiles.activeId) ||
          profiles.profiles?.[0];
      }

      // Identifica a engenhoca alvo
      let target = null;
      if (typeof arsenalInitialState !== 'undefined' && Array.isArray(arsenalInitialState.contraptions)) {
        target = arsenalInitialState.contraptions.find(c => c.id === cId || c.contraptionId === cId || c.itemId === cId);
      }
      if (!target && activeP && Array.isArray(activeP.contraptions)) {
        target = activeP.contraptions.find(c => c.id === cId || c.contraptionId === cId || c.itemId === cId);
      }
      if (!target && typeof getActiveContraptionsList === 'function') {
        target = getActiveContraptionsList().find(c => c.id === cId || c.contraptionId === cId || c.itemId === cId);
      }
      // Se ainda não encontrou e for engenhoca com nome 'Engenhoca' ou cId inválido:
      const cardEl = disBtn?.closest?.('.contraption-portfolio-card');
      const cardTitle = cardEl?.querySelector('.item-title')?.textContent?.trim();
      const isCardGeneric = cardTitle === 'Engenhoca' || !cId || cId === 'undefined';
      if (!target && isCardGeneric) {
        target = (activeP?.contraptions || []).find(c => c.nome === 'Engenhoca' || !c.spellId) ||
                 (arsenalInitialState.contraptions || []).find(c => c.nome === 'Engenhoca' || !c.spellId);
      }

      const targetId = target?.id || cId;
      const isGeneric = isCardGeneric || target?.nome === 'Engenhoca' || (!target?.spellId && !target?.spellName);

      // Remove de arsenalInitialState.contraptions
      if (typeof arsenalInitialState !== 'undefined' && Array.isArray(arsenalInitialState.contraptions)) {
        arsenalInitialState.contraptions = arsenalInitialState.contraptions.filter(c => {
          if (targetId && (c.id === targetId || c.contraptionId === targetId || c.itemId === targetId)) return false;
          if (isGeneric && (c.nome === 'Engenhoca' || !c.spellId)) return false;
          return true;
        });
      }

      // Remove do activeP
      if (activeP) {
        if (Array.isArray(activeP.contraptions)) {
          activeP.contraptions = activeP.contraptions.filter(c => {
            if (targetId && (c.id === targetId || c.contraptionId === targetId || c.itemId === targetId)) return false;
            if (isGeneric && (c.nome === 'Engenhoca' || !c.spellId)) return false;
            return true;
          });
        }
        if (Array.isArray(activeP.customItems)) {
          activeP.customItems = activeP.customItems.filter(ci => {
            if (targetId && (ci.id === targetId || ci.contraptionId === targetId)) return false;
            if (isGeneric && (ci.nome === 'Engenhoca' || !ci.engenhocaInfo?.spellId)) return false;
            return true;
          });
        }
        if (Array.isArray(activeP.backpack)) {
          activeP.backpack = activeP.backpack.filter(entry => {
            if (targetId && (entry.itemId === targetId || entry.instanceId === targetId || entry.contraptionId === targetId)) return false;
            if (isGeneric && (entry.itemName === 'Engenhoca' || entry.displayName === 'Engenhoca')) return false;
            return true;
          });
        }

        // Devolve o item mundano original se estava acoplado
        if (target && target.attachedItem) {
          const att = target.attachedItem;
          activeP.backpack.push({
            itemId: att.id,
            instanceId: 'inst_' + att.id + '_' + Date.now(),
            quantity: 1,
            itemName: att.nome,
            displayName: att.nome,
            tipo: att.tipo || 'item_geral',
            categoriaId: att.categoriaId || 'item_geral',
            espacos: Number(att.espacos || 0),
            improvements: att.improvements || att.melhorias || [],
            melhorias: att.improvements || att.melhorias || [],
            options: att.options || {}
          });
        }

        // Devolve os aparatos instalados
        const aps = target ? (Array.isArray(target.apparatuses) ? target.apparatuses : (Array.isArray(target.aparatos) ? target.aparatos : (Array.isArray(target.apparatus) ? target.apparatus : []))) : [];
        aps.forEach(ap => {
          const apId = typeof ap === 'string' ? ap : (ap?.id || ap?.itemId);
          if (apId) {
            const apIt = itemById.get(apId);
            activeP.backpack.push({
              itemId: apId,
              instanceId: 'inst_' + apId + '_' + Date.now() + Math.random().toString(36).substr(2, 4),
              quantity: 1,
              itemName: apIt?.nome || apId,
              displayName: apIt?.nome || apId,
              tipo: 'item_geral',
              categoriaId: 'aparato',
              espacos: 0
            });
          }
        });

        if (profiles) {
          const serialized = JSON.stringify(profiles);
          if (typeof arsenalStorageValues !== 'undefined') arsenalStorageValues[profKey] = serialized;
          try { localStorage.setItem(profKey, serialized); } catch (e) {}
        }
      }

      // Atualiza também forja-heroi-t20-v1 se presente
      try {
        const rawHero = localStorage.getItem('forja-heroi-t20-v1');
        if (rawHero) {
          const hero = JSON.parse(rawHero);
          if (hero?.arsenal?.storage?.[profKey] && profiles) {
            hero.arsenal.storage[profKey] = JSON.stringify(profiles);
          }
          if (Array.isArray(hero.contraptions)) {
            hero.contraptions = hero.contraptions.filter(c => {
              if (targetId && (c.id === targetId || c.contraptionId === targetId)) return false;
              if (isGeneric && (c.nome === 'Engenhoca' || !c.spellId)) return false;
              return true;
            });
          }
          localStorage.setItem('forja-heroi-t20-v1', JSON.stringify(hero));
        }
      } catch (e) {}

      // Atualiza backpackItems em memória na loja
      if (activeP && Array.isArray(activeP.backpack)) {
        backpackItems = activeP.backpack;
      }

      // Re-renderiza o catálogo da Oficina imediatamente!
      if (typeof renderItems === 'function') {
        renderItems();
      }
      if (typeof catalogToast === 'function') {
        catalogToast('Engenhoca desmanchada com sucesso.');
      }
    };

    if (typeof catalogDecision === 'function') {
      catalogDecision(
        'Deseja realmente desmanchar esta engenhoca? O item mundano acoplado (com todas as suas melhorias) e os aparatos instalados retornarão para a sua mochila.',
        [
          { label: 'Cancelar', value: 'cancel' },
          { label: 'Desmanchar', value: 'confirm', danger: true }
        ],
        'Desmanchar Engenhoca'
      ).then(decision => {
        if (decision === 'confirm') {
          doDisassemble();
        }
      });
    } else {
      doDisassemble();
    }
    return;
  }
  const toggleBackpack = event.target.closest?.('[data-action="toggle-workshop-backpack"]');
  if (toggleBackpack) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const content = document.getElementById('workshopBackpackContent');
    if (content) {
      const isHidden = content.style.display === 'none';
      content.style.display = isHidden ? '' : 'none';
      toggleBackpack.textContent = isHidden ? 'Recolher Mochila' : 'Exibir Mochila';
      toggleBackpack.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
      window.__workshopBackpackExpanded = isHidden;
    }
    return;
  }
  const attachItem = event.target.closest?.('[data-action="contraption-attach-item"]');
  if (attachItem) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const source = attachItem.dataset.source;
    const itemId = attachItem.dataset.itemId;
    const instanceId = attachItem.dataset.instanceId;
    const item = itemById.get(itemId);
    if (!item) return;

    const isFixedMagic = typeof isNamedFixedMagicItem === 'function' && isNamedFixedMagicItem(item);
    const isSpecificMagic = typeof isSpecificMagicItem === 'function' && isSpecificMagicItem(item);
    const isLiturgical = typeof isLiturgicalItem === 'function' && isLiturgicalItem(item);
    const isSuperior = Boolean(
      item.superior ||
      (Array.isArray(item.melhorias) && item.melhorias.length > 0) ||
      (Array.isArray(item.melhoriasFixasIds) && item.melhoriasFixasIds.length > 0) ||
      (Array.isArray(item.magico?.melhoriasFixasIds) && item.magico.melhoriasFixasIds.length > 0) ||
      item.materialEspecialId ||
      item.materialId
    );
    if (isFixedMagic || isSpecificMagic || isLiturgical || isSuperior || item.magico || item.liturgico || item.especifico) {
      if (typeof toast === 'function') toast('Apenas itens mundanos convencionais sem melhorias ou encantamentos podem alojar engenhocas.');
      return;
    }

    const fullPrice = Number(item.preco?.valor ?? item.price ?? 0);
    // @ts-ignore
    const rules = typeof RegrasManufatura !== 'undefined' ? RegrasManufatura : null;
    const craftCost = rules ? rules.custoMateriaPrima(fullPrice) : Math.ceil(fullPrice / 3);
    const espacos = item.espacos != null ? Number(item.espacos) : 1;
    const spellId = arsenalInitialState?.contraptionAttach?.spellId;

    let attachedItemPayload = null;
    const baseStats = {
      armadura: item.armadura ? { ...item.armadura } : null,
      escudo: item.escudo ? { ...item.escudo } : null,
      arma: item.arma ? { ...item.arma } : null,
      defesa: Number(item.defesa ?? item.armadura?.defesa ?? item.escudo?.bonusDefesa ?? 0),
      penalidade: Number(item.penalidade ?? item.armadura?.penalidade ?? item.escudo?.penalidade ?? 0),
      equipamento: item.equipamento ? { ...item.equipamento } : null
    };

    if (source === 'backpack') {
      attachedItemPayload = {
        id: item.id,
        nome: item.nome || item.name,
        tipo: item.tipo,
        categoriaId: item.categoriaId,
        espacos: espacos,
        fromBackpack: true,
        backpackInstanceId: instanceId,
        boughtNow: false,
        craftItemNow: false,
        extraCost: 0,
        tempo: '1 semana',
        ...baseStats
      };
    } else if (source === 'buy') {
      attachedItemPayload = {
        id: item.id,
        nome: item.nome || item.name,
        tipo: item.tipo,
        categoriaId: item.categoriaId,
        espacos: espacos,
        fromBackpack: false,
        boughtNow: true,
        craftItemNow: false,
        extraCost: fullPrice,
        tempo: '1 semana',
        ...baseStats
      };
    } else if (source === 'craft') {
      attachedItemPayload = {
        id: item.id,
        nome: item.nome || item.name,
        tipo: item.tipo,
        categoriaId: item.categoriaId,
        espacos: espacos,
        fromBackpack: false,
        boughtNow: false,
        craftItemNow: true,
        extraCost: craftCost,
        tempo: '2 semanas',
        ...baseStats
      };
    }

    if (attachedItemPayload) {
      try {
        sessionStorage.setItem('forja_attached_item', JSON.stringify(attachedItemPayload));
      } catch {}

      if (window.parent && window.parent !== window) {
        postArsenal('contraption-attach-item', {
          spellId: spellId,
          attachedItem: attachedItemPayload
        });
      } else {
        const sId = spellId || (new URLSearchParams(window.location.search).get('magia'));
        window.location.href = sId ? `engenhoca.html?magia=${encodeURIComponent(sId)}&attached=1` : 'engenhoca.html?attached=1';
      }
    }
    return;
  }
  const craft=event.target.closest?.('[data-action="craft-item"]');
  if(craft){
    event.preventDefault();
    event.stopImmediatePropagation();
    const item=itemById.get(craft.dataset.itemId);
    if(item){
      openCraftSimulationModal(item, catalogOptionsForItem(item));
    }
    return;
  }
  const upgradeExisting=event.target.closest?.('[data-action="workshop-upgrade-existing"]');
  if(upgradeExisting){
    event.preventDefault();
    event.stopImmediatePropagation();
    const instId = upgradeExisting.dataset.instanceId;
    const itemId = upgradeExisting.dataset.itemId;
    const kind = upgradeExisting.dataset.kind || 'improvements';
    const item = itemById.get(itemId);
    if(item && typeof isAparatoItem === 'function' && isAparatoItem(item)){
      showToast('Aparatos não podem ser encantados nem receber melhorias.');
      return;
    }
    const userBackpack = (typeof activeCharacterProfile === 'function' && activeCharacterProfile()?.backpack) || backpackItems || [];
    const entry = userBackpack.find(it => it.instanceId === instId);
    if(item && entry){
      const draft = purchaseDraft(itemId);
      draft.improvements = (entry.improvements || []).map(imp => ({ ...imp }));
      draft.enchantments = (entry.enchantments || []).slice();
      openPurchaseUpgrade(itemId, kind, instId);
    }
    return;
  }
  const confirmUpgrade=event.target.closest?.('[data-action="confirm-workshop-upgrade"]');
  if(confirmUpgrade){
    event.preventDefault();
    event.stopImmediatePropagation();
    const modal = document.getElementById('purchaseUpgradeModal');
    const instId = confirmUpgrade.dataset.instanceId || modal?.dataset.upgradeTargetInstanceId;
    const itemId = confirmUpgrade.dataset.itemId || modal?.dataset.itemId;
    const item = itemById.get(itemId);
    const userBackpack = (typeof activeCharacterProfile === 'function' && activeCharacterProfile()?.backpack) || backpackItems || [];
    const entry = userBackpack.find(it => it.instanceId === instId);
    if(modal) closeModal(modal);
    if(item && entry){
      const draft = purchaseDraft(itemId);
      openCraftSimulationModal(item, { improvements: draft.improvements, enchantments: draft.enchantments }, { instanceId: instId, entry });
    } else {
      showToast('Item não encontrado para aprimoramento.');
    }
    return;
  }
  const craftConfigured=event.target.closest?.('[data-action="craft-configured-workshop-item"]');
  if(craftConfigured){
    event.preventDefault();
    event.stopImmediatePropagation();
    const modal = document.getElementById('purchaseUpgradeModal');
    const itemId = craftConfigured.dataset.itemId || modal?.dataset.itemId;
    const item = itemById.get(itemId);
    if(modal) closeModal(modal);
    if(item){
      const draft = purchaseDraft(itemId);
      openCraftSimulationModal(item, { improvements: draft.improvements, enchantments: draft.enchantments });
    } else {
      showToast('Item não encontrado para fabricação.');
    }
    return;
  }
  if(event.target.closest?.('#checkoutCart')){event.preventDefault();event.stopImmediatePropagation();await checkoutWithAmmo(false);return}
  if(event.target.closest?.('#checkoutReward')||event.target.closest?.('[data-checkout-reward]')){event.preventDefault();event.stopImmediatePropagation();await checkoutWithAmmo(true);return}
  if(event.target.closest?.('#cartViewBackpack')){event.preventDefault();event.stopImmediatePropagation();closeModal(cartModal);postArsenal('close-shop')}
  if(event.target.closest?.('#cartReturnCatalog')){event.preventDefault();event.stopImmediatePropagation();closeModal(cartModal);postArsenal('open-shop')}
},true);
function updateItemChoiceOptionFromControl(control, notifyToast = false){
  if(arsenalInitialState?.mode!=='initial')return;
  const entry = control?.closest?.('[data-choice-item], [data-item-id]');
  if (!entry) return;
  const itemId = entry.dataset.choiceItem||entry.dataset.itemId;
  const item = itemById.get(itemId);
  if (!item) return;

  const fieldKey = control.dataset.itemOption;
  const currentOptions = catalogOptionDrafts.get(itemId) || resolveDefaultItemOptions(itemId, catalogOptionsForItem(item));
  if (fieldKey) {
    currentOptions[fieldKey] = control.value;
    catalogOptionDrafts.set(itemId, currentOptions);
  }

  const formatted = configuredItemName({ options: currentOptions }, item);
  const titleElem = entry.querySelector('.catalog-choice-name strong');
  if (titleElem && formatted) {
    titleElem.textContent = formatted;
  }

  const draft=purchaseDrafts.get(item.id);
  if(draft)draft.options={...draft.options,...currentOptions};
  executeChooseCandidate(item,draft?.improvements||[]);
  if (notifyToast && formatted) {
    showToast('Nome registrado: ' + formatted);
  }
}
document.addEventListener('input', event => {
  const control = event.target.closest?.('[data-item-option]');
  if (control) {
    updateItemChoiceOptionFromControl(control, false);
  }
}, true);
document.addEventListener('change', event => {
  const control = event.target.closest?.('[data-item-option]');
  if (control) {
    updateItemChoiceOptionFromControl(control, false);
  }
}, true);
document.addEventListener('keydown', event => {
  const control = event.target.closest?.('[data-item-option]');
  if (control && event.key === 'Enter') {
    event.preventDefault();
    control.blur();
    updateItemChoiceOptionFromControl(control, true);
  }
}, true);
window.addEventListener('message',event=>{
  const message=event.data;if(event.source!==window.parent||message?.channel!=='forja-arsenal-v1')return;
  if(message.session!=null&&typeof arsenalInitialState!=='undefined')arsenalInitialState.session=message.session;
  if(message.type==='reset-backpack'||message.type==='redo-initial'){resetInternalBackpack(message.storage);if(message.context)applyArsenalContext(message.context);return}
  if(message.type==='context')applyArsenalContext(message.context);
  if(message.type==='close-modal'||message.type==='close-upgrade-modal'){
    const m = document.getElementById('purchaseUpgradeModal');
    if(m && typeof closeModal === 'function') closeModal(m);
    return;
  }
  if(message.type==='scroll-items')window.scrollBy({top:Number(message.delta)||0,behavior:'auto'});
  if(message.type==='commit-choice'||message.type==='finalize'){
    const m = document.getElementById('purchaseUpgradeModal');
    if(m && typeof closeModal === 'function') closeModal(m);
    if(message.type==='commit-choice' && message.selection && typeof checkBudgetUnderutilizationNotice === 'function') {
      checkBudgetUnderutilizationNotice(Number(message.selection.unitValue) || 0);
    }
    proposeOperation('initial',message);
  }
  if(message.type==='confirm-cart')openCartDecision(false);
  if(message.type==='checkout-request')checkoutWithAmmo(Boolean(message.asGift));
  if(message.type==='cancel-cart'){if(pendingOperation)return;cartItems=[];persistCart();syncCartUI();postArsenal('close-shop')}
  if(message.type==='execute-craft-operation'){
    try{
      proposeOperation('craft', message);
    }catch(err){
      showToast(err.message || 'Erro ao forjar item.');
    }
    return;
  }
  if(message.type==='funds'){Object.assign(arsenalInitialState,message.context);syncEmbeddedShopActions()}
  if(message.type==='save-failed')showToast('Não foi possível salvar. Suas alterações continuam nesta tela; tente novamente antes de sair.');
  if(message.type==='operation-result'){
    if(pendingOperation && pendingOperation.operationId !== message.operationId && !message.operationId.startsWith(pendingOperation.operationId) && !pendingOperation.operationId.startsWith(message.operationId))return;
    if(!message.ok){showToast('Operação não salva. Tente confirmar novamente; o carrinho e o saldo foram preservados.');return}
    Object.keys(arsenalStorageValues).forEach(key=>delete arsenalStorageValues[key]);Object.assign(arsenalStorageValues,message.storage);
    characterProfiles=loadCharacterProfiles();backpackItems=activeCharacterProfile()?.backpack||[];cartItems=loadCart();
    const purchase=pendingOperation?.kind==='purchase',crafted=pendingOperation?.kind==='craft',craftCd=pendingOperation?.craftCd;pendingOperation=null;
    closeModal(cartModal);
    const upgradeModal = document.getElementById('purchaseUpgradeModal');
    if(upgradeModal && typeof closeModal === 'function') closeModal(upgradeModal);
    syncCartUI();
    if(purchase){
      showToast(message.gift?'Item adicionado como presente, sem custos.':'Compra finalizada por '+formatCurrencyValue(message.total,'T$')+'.');
      postArsenal('close-shop');
      setTimeout(()=>{ if(window.parent === window) window.location.href = 'ficha.html'; }, 400);
    }
    if(crafted)showToast('Item fabricado por '+formatCurrencyValue(message.total,'T$')+'. Teste de Ofício CD '+craftCd+'.');
    if(message.context)applyArsenalContext(message.context);
  }
});
let _lastArsenalWheel = 0;
document.addEventListener('wheel',event=>{
  const now = Date.now();
  if(now - _lastArsenalWheel > 80){
    _lastArsenalWheel = now;
    if(event.deltaY>0 || (event.deltaY<0 && window.scrollY<2)){
      postArsenal('host-scroll',{delta:event.deltaY, scrollY:window.scrollY});
    }
  }
}, { passive: true });
if(typeof syncFilterUI==='function'){
  const baseSyncFilterUI=syncFilterUI;
  syncFilterUI=function(){
    baseSyncFilterUI();
    if(typeof nameOnlySearchButton!=='undefined'&&nameOnlySearchButton){
      nameOnlySearchButton.textContent='Busca relacionada';
      const relatedActive=!state.searchNameOnly;
      nameOnlySearchButton.classList.toggle('active',relatedActive);
      nameOnlySearchButton.setAttribute('aria-pressed',String(relatedActive));
    }
  };
}
if(typeof nameOnlySearchButton!=='undefined'&&nameOnlySearchButton){
  nameOnlySearchButton.textContent='Busca relacionada';
  nameOnlySearchButton.classList.remove('active');
  nameOnlySearchButton.setAttribute('aria-pressed','false');
  nameOnlySearchButton.addEventListener('click',event=>{
    event.preventDefault();
    event.stopImmediatePropagation();
    state.searchNameOnly=!state.searchNameOnly;
    const relatedActive=!state.searchNameOnly;
    nameOnlySearchButton.classList.toggle('active',relatedActive);
    nameOnlySearchButton.setAttribute('aria-pressed',String(relatedActive));
    if(relatedActive){
      if(typeof searchInput!=='undefined'&&searchInput)searchInput.placeholder='Digite uma palavra chave para o item desejado...';
      showToast('Digite uma palavra chave para o item desejado (pode estar na descrição, efeitos ou benefícios).');
    }else{
      if(typeof searchInput!=='undefined'&&searchInput)searchInput.placeholder='Buscar pelo nome do item...';
    }
    applyFilters();
  },true);
}
if(typeof searchInput!=='undefined'&&searchInput){
  searchInput.addEventListener('input',event=>{
    if(arsenalInitialState.mode==='initial'){
      state.search=event.target.value;
      window.clearTimeout(searchTimer);
      searchTimer=window.setTimeout(function(){applyFilters()},120);
    }
  },true);
}
if(typeof renderBackpack==='function'){
  const baseRenderBackpack=renderBackpack;
  renderBackpack=function(){
    baseRenderBackpack();
    if(typeof backpackList!=='undefined'&&backpackList){
      backpackList.querySelectorAll('.backpack-item').forEach(article=>{
        const inst=(activeCharacterProfile()?.backpack||backpackItems||[]).find(it=>it.instanceId===article.dataset.instanceId);
        const item=inst?itemById.get(inst.itemId):null;
        if(item&&(item.tipo==='municao'||item.categoriaId==='municao')){
          article.classList.add('is-ammo');
          const inc=article.querySelector('button[data-action="increase"]');
          if(inc){inc.disabled=true;inc.style.display='none'}
          const qtyInp=article.querySelector('input[data-action="quantity"]');
          if(qtyInp)qtyInp.readOnly=true;
        }
      });
      backpackList.querySelectorAll('.backpack-compact-row').forEach(row=>{
        if(row.querySelector('[data-action="sell-general"]'))return;
        const remove=row.querySelector('[data-action="remove"]');
        const coinSvg = window.IconesForja ? window.IconesForja.get('coin', 'icon-sm') : '<svg class="forja-svg icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"></circle><path d="M18.09 10.37A6 6 0 1 1 10.34 18"></path><path d="M7 6h1v4"></path><path d="m16.71 13.88.7.71-2.82 2.82"></path></svg>';
        if(remove)remove.insertAdjacentHTML('beforebegin','<button class="compact-remove compact-sell" type="button" data-action="sell-general" title="Vender item" aria-label="Vender item" style="padding:2px 6px;display:inline-flex;align-items:center;justify-content:center;">' + coinSvg + '</button>');
      });
    }
  };
}

function ensureCraftSimulationModal(){
  let modal=document.getElementById('craftSimulationModal');
  if(modal)return modal;
  modal=document.createElement('div');
  modal.id='craftSimulationModal';
  modal.className='modal-backdrop';
  modal.hidden=true;
  modal.innerHTML='<section class="modal-panel craft-simulation-panel" role="dialog" aria-modal="true" style="width:min(580px, calc(100vw - 24px));background:#121626;color:#e2e8f0;border:1px solid #334155;border-radius:12px;box-shadow:0 16px 40px rgba(0,0,0,0.8);overflow:hidden;">'
    + '<header class="modal-header" style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid #283049;background:#181d33;">'
    + '<h2 id="craftSimTitle" style="margin:0;font-size:1.15rem;display:flex;align-items:center;gap:8px;color:#fff;">Simulação de Fabricação</h2>'
    + '<button class="modal-close" type="button" data-action="close-craft-modal" aria-label="Fechar" style="background:none;border:none;color:#94a3b8;font-size:1.5rem;cursor:pointer;line-height:1;">×</button>'
    + '</header>'
    + '<div class="modal-body" id="craftSimBody" style="padding:20px;display:flex;flex-direction:column;gap:16px;overflow-y:auto;max-height:calc(85dvh - 120px);"></div>'
    + '<footer class="modal-actions" id="craftSimFooter" style="display:flex;justify-content:flex-end;gap:10px;padding:14px 20px;border-top:1px solid #283049;background:#181d33;"></footer>'
    + '</section>';
  document.body.appendChild(modal);
  modal.addEventListener('click',event=>{
    if(event.target===modal||event.target.closest('[data-action="close-craft-modal"]')){
      closeModal(modal);
    }
  });
  return modal;
}

function openCraftSimulationModal(item, options={}, existingTarget=null){
  const instance={itemId:item.id,quantity:1,...options};
  const improvementCount=(instance.improvements||[]).length;
  const enchantmentCount=(instance.enchantments||[]).length;
  // @ts-ignore
  const rules = typeof RegrasManufatura !== 'undefined' ? RegrasManufatura : null;
  const sectionKey = arsenalInitialState.workshopSection || 'artesao';
  const sec = rules?.secoesOficina?.[sectionKey];
  if(sec && typeof sec.corresponde === 'function' && !sec.corresponde(item)){
    showToast('Item incompatível com a oficina ' + (sec.title || 'selecionada') + '.');
    return;
  }
  const maxAllowedImprovements = typeof getMaxAllowedImprovements === 'function' ? getMaxAllowedImprovements() : Number(arsenalInitialState.crafting?.improvements || 0);
  if(improvementCount > maxAllowedImprovements){
    instance.improvements = (instance.improvements || []).slice(0, maxAllowedImprovements);
    if(options && Array.isArray(options.improvements)){
      options.improvements = options.improvements.slice(0, maxAllowedImprovements);
    }
  }
  if(enchantmentCount && typeof isAparatoItem === 'function' && isAparatoItem(item)){
    showToast('Aparatos não podem ser encantados.');
    return;
  }
  if(enchantmentCount && !(typeof getMaxAllowedEnchantments === 'function' ? getMaxAllowedEnchantments() > 0 : arsenalInitialState.crafting?.magic)){
    showToast('Você ainda não pode fabricar itens encantados.');
    return;
  }

  const isExisting = Boolean(existingTarget);
  let totalCost = 0;
  let craftCd = 15;

  if (isExisting) {
    const prevCount = (existingTarget.entry?.improvements || []).length;
    const nextCount = improvementCount;
    const prevEncCount = (existingTarget.entry?.enchantments || []).length;
    const nextEncCount = enchantmentCount;
    let extraMaterial = 0;
    const prevMat = (existingTarget.entry?.improvements || []).find(e => e.id === 'material_especial')?.materialId;
    const nextMat = (instance.improvements || []).find(e => e.id === 'material_especial')?.materialId;
    if (nextMat && nextMat !== prevMat) {
      const mat = materialById.get(nextMat);
      if (mat) {
        const info = getMaterialCostInfo(mat, item);
        if (info.known) extraMaterial = info.value;
      }
    }
    const aprimoramentoInfo = rules && typeof rules.calcularAprimoramentoItemExistente === 'function'
      ? rules.calcularAprimoramentoItemExistente(item, prevCount, nextCount, extraMaterial)
      : { custoMercadoMelhoria: 300, custoMateriaPrima: 100, cdFabricacao: 20 };
    const custoMelhoriaMateria = aprimoramentoInfo.custoMateriaPrima;

    let custoEncantamentoMateria = 0;
    if (nextEncCount > prevEncCount) {
      const diffMarketEnc = (ENCHANTMENT_SURCHARGES[Math.min(3, nextEncCount)] || 0) - (ENCHANTMENT_SURCHARGES[Math.min(3, prevEncCount)] || 0);
      custoEncantamentoMateria = Math.ceil(diffMarketEnc / Number(MAGIC_RULES.divisorCustoFabricacao || 3));
    }

    totalCost = custoMelhoriaMateria + custoEncantamentoMateria;

    if (nextEncCount > 0) {
      craftCd = Number(MAGIC_RULES.cdBaseItemEncantado || 20) + (5 * nextCount) + (ENCHANTMENT_CRAFT_BONUSES[Math.min(3, nextEncCount)] || 0);
    } else {
      craftCd = aprimoramentoInfo.cdFabricacao;
    }
  } else {
    const value = entryValueInfo(instance, effectiveItemForOptions(item, instance));
    const isAlchemOrPotion = (item?.categoriaId === 'alquimico_preparado' || item?.tipo === 'pocao' || sec?.title?.toLowerCase().includes('alquim') || /alquim/i.test(item?.tipo || ''));
    const drogadoraOpt = (arsenalInitialState.crafting?.isDrogadora && isAlchemOrPotion) ? { isDrogadora: true } : {};
    totalCost = rules ? rules.custoMateriaPrima(value.unitKnown, drogadoraOpt) : Math.ceil(value.unitKnown / (drogadoraOpt.isDrogadora ? 4 : Number(MAGIC_RULES.divisorCustoFabricacao || 3)));
    const baseCD = rules ? rules.cdFabricacao(item) : 15;
    craftCd = (enchantmentCount ? Number(MAGIC_RULES.cdBaseItemEncantado || 20) : baseCD) + (5 * improvementCount) + (ENCHANTMENT_CRAFT_BONUSES[Math.min(3, enchantmentCount)] || 0);
  }

  const craftBonus = Number(arsenalInitialState.craftSkillBonus) || 0;
  const itemName = configuredItemName({options, improvements: instance.improvements, enchantments: instance.enchantments}, item);

  let oficioNome = 'Ofício (armeiro)';
  if (sec?.title) {
    const raw = sec.title.toLowerCase().replace(/oficina\s*(do|da|de)?\s*/i, '').trim();
    oficioNome = `Ofício (${raw})`;
  }

  const titulo = isExisting
    ? `Aprimorar · ${itemName}`
    : (enchantmentCount > 0 ? `Fabricar Item Encantado · ${itemName}` : (improvementCount > 0 ? `Fabricar Item Superior · ${itemName}` : `Fabricar Item · ${itemName}`));

  // Fecha modais de aprimoramento pendentes na loja se houver
  const upModal = document.getElementById('purchaseUpgradeModal');
  if (upModal) closeModal(upModal);

  postArsenal('open-craft-test', {
    itemId: item.id,
    itemName: itemName,
    titulo: titulo,
    subtitulo: `${oficioNome}`,
    oficioNome: oficioNome,
    craftCd: craftCd,
    totalCost: totalCost,
    craftBonus: craftBonus,
    isExisting: isExisting,
    existingInstanceId: existingTarget?.instanceId || existingTarget?.entry?.instanceId,
    improvements: instance.improvements || [],
    enchantments: instance.enchantments || []
  });
}

let generalSaleInstance=null,generalSaleBase=0,generalSalePercent=50;
