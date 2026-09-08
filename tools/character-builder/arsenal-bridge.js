characterButton.hidden=true;
strengthInput.disabled=true;
strengthInput.readOnly=true;
let initialChoice=null;
let selectedCandidate=null;
let pendingOperation=null;
let shopFilters=null;
let craftingMode=false;
const baseApplyFilters=applyFilters;
const baseSyncCartUI=syncCartUI;
const advancedFilters=advancedFiltersButton;
const baseSyncAdvancedFiltersButton=syncAdvancedFiltersButton;
syncAdvancedFiltersButton=function(forcedLabel){if(!forcedLabel&&typeof arsenalInitialState!=='undefined'&&arsenalInitialState.mode==='initial'&&initialChoice){syncInitialFilterSummary();return}baseSyncAdvancedFiltersButton(forcedLabel)};
const shopActions=document.createElement('nav');
shopActions.className='embedded-shop-actions';
shopActions.innerHTML='<label>Dinheiro inicial · T$ <input data-money type="number" min="0" step="0.01" placeholder="0" aria-label="Dinheiro inicial em tibares"><span data-balance></span></label><button type="button" data-shop-view="catalog">🏪 Comprar itens</button><button type="button" data-craft-mode hidden>🔨 Fabricar</button><button type="button" data-shop-cart>🛒 Carrinho <span data-shop-cart-count>0</span></button><button type="button" data-shop-view="backpack">🎒 Mochila</button>';
const itemCardBeforeCrafting=itemCard;
itemCard=function(item){const html=itemCardBeforeCrafting(item);if(!craftingMode)return html;const allowed=['arma','armadura','escudo'].includes(item.tipo)&&(!isNamedFixedMagicItem(item)||arsenalInitialState.crafting?.magic);if(!allowed)return html.replace(/<button class="acquire-button"[^>]*data-action="add-to-cart"[\s\S]*?<\/button>/,'<button class="acquire-button" type="button" disabled>Não fabricável com Ofício (armeiro)</button>');return html.replace('data-action="add-to-cart"','data-action="craft-item"').replace('<span aria-hidden="true">🛒</span> Adicionar ao carrinho','<span aria-hidden="true">🔨</span> Fabricar por ⅓ do preço')};
document.body.prepend(shopActions);
function syncEmbeddedShopActions(){
  shopActions.querySelectorAll('[data-shop-view]').forEach(button=>button.classList.toggle('active',button.dataset.shopView===(arsenalInitialState.mode==='backpack'?'backpack':state.view)));
  shopActions.querySelector('[data-shop-cart-count]').textContent=String(cartItems.reduce((sum,entry)=>sum+entry.quantity,0));
  const money=shopActions.querySelector('[data-money]');
  if(document.activeElement!==money)money.value=arsenalInitialState.startingMoney||'';
  money.disabled=arsenalInitialState.startingLevel!==1;
  shopActions.querySelector('[data-balance]').textContent=' · Saldo: '+formatCurrencyValue(arsenalInitialState.funds,'T$');
  const craft=shopActions.querySelector('[data-craft-mode]');craft.hidden=arsenalInitialState.mode!=='shop'||!arsenalInitialState.crafting?.enabled;craft.classList.toggle('active',craftingMode);
}
syncCartUI=function(){baseSyncCartUI();syncEmbeddedShopActions()};
function starterKey(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\([^)]*\)/g,' ').replace(/^\s*(?:uma?|\d+)\s+/,'').replace(/[^a-z0-9]+/g,' ').trim()}
function initialItemFacts(item){
  if(!item.arma)return '';
  const values=['Dano '+(item.arma.dano?.principal||'—'),'Crítico '+formatCritical(item.arma.critico),...(item.arma.tipoDanoIds||[]).map(id=>DAMAGE_LABELS[id]||humanize(id))];
  if(item.arma.alcanceId)values.push('Alcance '+(RANGE_LABELS[item.arma.alcanceId]||humanize(item.arma.alcanceId)));
  return values.map(value=>'<span>'+escapeHtml(value)+'</span>').join('');
}
function syncInitialFilterSummary(){
  if(!initialChoice)return;
  const values=[initialChoice.id==='simple'?'Armas simples':initialChoice.id==='martial'?'Armas marciais':initialChoice.id==='armor'?'Armaduras permitidas':initialChoice.title];
  if(initialChoice.type==='arma'&&state.combat!=='todos')values.push(COMBAT_LABELS[state.combat]||humanize(state.combat));
  if(initialChoice.type==='arma'&&state.grip!=='todos')values.push(GRIP_LABELS[state.grip]||humanize(state.grip));
  syncAdvancedFiltersButton(values.join(' · '));
  advancedFilters.hidden=false;
}
function syncShopFilterSummary(){
  syncAdvancedFiltersButton();
}
function findStartingItem(raw){const key=starterKey(raw);return preparedItems.find(item=>!isSpecificMagicItem(item)&&!isLiturgicalItem(item)&&starterKey(item.nome)===key)}
function availableInitialItems(){
  let results=filteredItems().filter(item=>!isSpecificMagicItem(item)&&!isLiturgicalItem(item));
  if(initialChoice?.categories?.length)results=results.filter(item=>initialChoice.categories.includes(item.categoriaId));
  if(initialChoice?.combat)results=results.filter(item=>item.arma?.combateId===initialChoice.combat);
  if(Number.isFinite(Number(initialChoice?.maxPrice)))results=results.filter(item=>Number(item.preco?.valor||0)<=Number(initialChoice.maxPrice));
  if(initialChoice?.names?.length){const allowed=new Set(initialChoice.names.map(starterKey));results=results.filter(item=>allowed.has(starterKey(item.nome))||(initialChoice.allowNamedOrFilter&&initialChoice.categories?.includes(item.categoriaId)))}
  return results;
}
function restoreCandidate(){
  itemsGrid.querySelectorAll('[data-choice-item]').forEach(entry=>entry.classList.toggle('candidate',entry.dataset.choiceItem===selectedCandidate?.itemId));
  itemsGrid.querySelectorAll('[data-action="add-to-cart"]').forEach(button=>button.innerHTML=button.dataset.itemId===selectedCandidate?.itemId?'✓ Remover seleção':'✓ Selecionar item');
}
applyFilters=function(loadMore){
  if(arsenalInitialState.mode!=='initial'){const result=baseApplyFilters(loadMore);syncShopFilterSummary();return result}
  window.clearTimeout(searchTimer);
  state.type=initialChoice.type||'todos';state.category=initialChoice.category||'todos';state.specific='convencional';
  syncFilterUI();
  const results=availableInitialItems();
  syncInitialFilterSummary();
  const open=new Set(Array.from(itemsGrid.querySelectorAll('.catalog-list-entry.open')).map(entry=>entry.dataset.choiceItem));
  itemsGrid.innerHTML=results.map(item=>'<div class="catalog-list-entry'+(open.has(item.id)?' open':'')+'" data-choice-item="'+escapeHtml(item.id)+'"><div class="catalog-choice-row"><div class="catalog-choice-name"><strong>'+escapeHtml(item.nome)+'</strong><small>'+initialItemFacts(item)+'</small></div><div class="catalog-choice-actions"><button type="button" data-action="choice-view">Ver item</button><button type="button" data-action="add-to-cart" data-item-id="'+escapeHtml(item.id)+'">Selecionar</button></div></div><div data-choice-detail></div></div>').join('');
  itemsGrid.querySelectorAll('.catalog-list-entry.open').forEach(expandInitialCard);
  emptyState.classList.toggle('visible',!results.length);restoreCandidate();
};
function expandInitialCard(entry){
  if(!entry.classList.contains('open')||!entry.dataset.choiceItem)return;
  const detail=entry.querySelector('[data-choice-detail]');
  if(detail&&!detail.firstElementChild){const item=itemById.get(entry.dataset.choiceItem);if(item)detail.innerHTML=itemCard(item)}
  restoreCandidate();
}
itemsGrid.addEventListener('toggle',event=>expandInitialCard(event.target),true);
function chooseCandidate(item){
  selectedCandidate=selectedCandidate?.itemId===item.id?null:{itemId:item.id,itemName:item.nome,options:catalogOptionsForItem(item)};
  restoreCandidate();postArsenal('candidate',selectedCandidate||{itemId:''});
  if(selectedCandidate&&ITEM_CHOICE_DEFINITIONS[item.id]){const entry=[...itemsGrid.querySelectorAll('[data-choice-item]')].find(candidate=>candidate.dataset.choiceItem===item.id);entry?.classList.add('open');const view=entry?.querySelector('[data-action="choice-view"]');if(view)view.textContent='Recolher';expandInitialCard(entry);requestAnimationFrame(()=>{const field=entry?.querySelector('[data-item-option]');field?.scrollIntoView({behavior:'smooth',block:'center'});field?.focus({preventScroll:true})})}
}
function applyArsenalContext(context){
  const previousMode=arsenalInitialState.mode;
  if(previousMode==='shop')shopFilters={type:state.type,specific:state.specific,category:state.category,combat:state.combat,grip:state.grip,search:state.search,sort:state.sort,searchNameOnly:state.searchNameOnly};
  arsenalInitialState={...arsenalInitialState,...context};
  const mode=arsenalInitialState.mode;
  initialChoice=arsenalInitialState.choice;
  selectedCandidate=arsenalInitialState.candidate||null;
  advancedFiltersContent.hidden=true;
  advancedFiltersButton.setAttribute('aria-expanded','false');
  filtersPanel.classList.remove('advanced-open');
  const profile=activeCharacterProfile();if(profile){profile.strength=arsenalInitialState.strength;profile.capacityBonus=Number(arsenalInitialState.capacityBonus)||0;profile.name=arsenalInitialState.characterName||profile.name}
  document.body.classList.toggle('initial-equipment',mode==='initial');
  document.body.classList.toggle('initial-equipment-review',mode==='backpack');
  document.body.classList.toggle('embedded-shop',mode==='shop');
  shopActions.hidden=mode==='initial';advancedFilters.hidden=mode==='backpack';
  state.backpackMode=state.backpackMode||'list';
  if(mode==='initial'){
    state.type=initialChoice.type||'todos';state.category=initialChoice.category||'todos';state.specific='convencional';state.combat=initialChoice.combat||'todos';state.grip='todos';state.search='';
    syncInitialFilterSummary();
    searchInput.value='';renderContextFilters();weaponFilters.hidden=initialChoice.type!=='arma';setView('catalog');
  }else if(mode==='backpack')setView('backpack');
  else{
    Object.assign(state,shopFilters||{type:'todos',category:'todos',specific:'convencional',combat:'todos',grip:'todos',search:''});
    searchInput.value=state.search;renderContextFilters();setView('catalog');
  }
  syncEmbeddedShopActions();postArsenal('ready');
}
function proposeOperation(type,message={}){
  if(pendingOperation){postArsenal('operation',pendingOperation);return}
  const before={storage:{...arsenalStorageValues},profiles:JSON.stringify(characterProfiles),cart:JSON.stringify(cartItems)};
  const id=message.operationId||('purchase:'+createInstanceId());
  const grants=[],unresolved=[];
  let total=type==='purchase'?cartTotalsInfo().value:0;
  const gift=type==='purchase'&&total>arsenalInitialState.funds;
  arsenalTransaction=true;
  try{
    if(type==='purchase')cartItems.forEach(entry=>addPackagesToBackpack(entry.itemId,entry.quantity,entry.options,{source:gift?'gift':'purchase',operationId:id},entry));
    if(type==='craft'){
      const item=itemById.get(message.itemId),options=message.options||{},instance={itemId:message.itemId,quantity:1,...options},improvementCount=(instance.improvements||[]).length,enchantmentCount=(instance.enchantments||[]).length;
      if(!item||!['arma','armadura','escudo'].includes(item.tipo))throw new Error('Item incompatível com Ofício (armeiro).');
      if(improvementCount>Number(arsenalInitialState.crafting?.improvements||0))throw new Error('Você ainda não pode fabricar esta quantidade de melhorias.');
      if(enchantmentCount&&!arsenalInitialState.crafting?.magic)throw new Error('Você ainda não pode fabricar itens encantados.');
      const value=entryValueInfo(instance,effectiveItemForOptions(item,instance));total=value.unitKnown/Number(MAGIC_RULES.divisorCustoFabricacao||3);
      if(total>arsenalInitialState.funds)throw new Error('Saldo insuficiente para as matérias-primas.');
      addPackagesToBackpack(item.id,1,options,{source:'craft',operationId:id});
      message.craftCd=(enchantmentCount?Number(MAGIC_RULES.cdBaseItemEncantado||20):15)+IMPROVEMENT_CRAFT_BONUSES[Math.min(4,improvementCount)]+ENCHANTMENT_CRAFT_BONUSES[Math.min(3,enchantmentCount)];
    }
    if(type==='initial'&&message.selection&&!backpackItems.some(entry=>entry.acquisition?.grantId===message.grantId)){
      addPackagesToBackpack(message.selection.itemId,1,message.selection.options,{source:message.source||'initial',grantId:message.grantId});grants.push(message.grantId);
    }
    for(const grant of message.automaticGrants||[]){if(backpackItems.some(entry=>entry.acquisition?.grantId===grant.id)){grants.push(grant.id);continue}const item=findStartingItem(grant.name);if(item){addPackagesToBackpack(item.id,1,{}, {source:grant.source,grantId:grant.id});grants.push(grant.id)}else unresolved.push(grant.name)}
    if(type==='purchase')cartItems=[];
    persistBackpack();persistCart();
    pendingOperation={operationId:id,kind:type,storage:{...arsenalStorageValues},total,gift,grants,unresolved,finalize:!!message.finalize,craftCd:message.craftCd};
  }finally{
    Object.keys(arsenalStorageValues).forEach(key=>delete arsenalStorageValues[key]);Object.assign(arsenalStorageValues,before.storage);
    characterProfiles=JSON.parse(before.profiles);backpackItems=activeCharacterProfile()?.backpack||[];cartItems=JSON.parse(before.cart);arsenalTransaction=false;
  }
  postArsenal('operation',pendingOperation);
}
shopActions.addEventListener('click',event=>{
  if(event.target.closest('[data-craft-mode]')){craftingMode=!craftingMode;applyFilters();syncEmbeddedShopActions();showToast(craftingMode?'Modo de fabricação ativo. Armas, armaduras e escudos mostram o custo em matérias-primas.':'Modo de compra ativo.');return}
  if(event.target.closest('[data-shop-cart]'))return openCartDecision(false);
  const view=event.target.closest('[data-shop-view]');if(!view)return;
  if(view.dataset.shopView==='backpack'){if(cartItems.length)openCartDecision(true);else postArsenal('close-shop')}
  else postArsenal('open-shop');
});
shopActions.addEventListener('input',event=>{if(event.target.matches('[data-money]'))postArsenal('money',{value:Number(event.target.value)||0})});
document.addEventListener('click',event=>{
  if(pendingOperation&&!event.target.closest?.('#checkoutCart')){event.preventDefault();event.stopImmediatePropagation();showToast('Confirme novamente a operação pendente antes de alterar o carrinho.');return}
  const view=event.target.closest?.('[data-action="choice-view"]');
  if(view&&arsenalInitialState.mode==='initial'){
    const entry=view.closest('[data-choice-item]');entry.classList.toggle('open');view.textContent=entry.classList.contains('open')?'Recolher':'Ver item';expandInitialCard(entry);return;
  }
  const choice=event.target.closest?.('[data-action="add-to-cart"]');
  if(choice&&arsenalInitialState.mode==='initial'){event.preventDefault();event.stopImmediatePropagation();const item=itemById.get(choice.dataset.itemId);if(item&&availableInitialItems().some(candidate=>candidate.id===item.id))chooseCandidate(item);return}
  const craft=event.target.closest?.('[data-action="craft-item"]');if(craft){event.preventDefault();event.stopImmediatePropagation();const item=itemById.get(craft.dataset.itemId);try{proposeOperation('craft',{itemId:item.id,options:catalogOptionsForItem(item)})}catch(error){showToast(error.message)}return}
  if(event.target.closest?.('#checkoutCart')){event.preventDefault();event.stopImmediatePropagation();if(cartItems.length)proposeOperation('purchase');return}
  if(event.target.closest?.('#cartViewBackpack')){event.preventDefault();event.stopImmediatePropagation();closeModal(cartModal);postArsenal('close-shop')}
  if(event.target.closest?.('#cartReturnCatalog')){event.preventDefault();event.stopImmediatePropagation();closeModal(cartModal);postArsenal('open-shop')}
},true);
document.addEventListener('input',event=>{const control=event.target.closest?.('[data-item-option]'),entry=control?.closest?.('[data-choice-item]');if(!entry||selectedCandidate?.itemId!==entry.dataset.choiceItem)return;const item=itemById.get(entry.dataset.choiceItem);selectedCandidate={itemId:item.id,itemName:item.nome,options:catalogOptionsForItem(item)};postArsenal('candidate',selectedCandidate)},true);
document.addEventListener('change',event=>{const control=event.target.closest?.('[data-item-option]'),entry=control?.closest?.('[data-choice-item]');if(!entry||selectedCandidate?.itemId!==entry.dataset.choiceItem)return;const item=itemById.get(entry.dataset.choiceItem);selectedCandidate={itemId:item.id,itemName:item.nome,options:catalogOptionsForItem(item)};postArsenal('candidate',selectedCandidate)},true);
window.addEventListener('message',event=>{
  const message=event.data;if(event.source!==window.parent||message?.channel!=='forja-arsenal-v1'||message.session!==arsenalInitialState.session)return;
  if(message.type==='context')applyArsenalContext(message.context);
  if(message.type==='scroll-items')window.scrollBy({top:Number(message.delta)||0,behavior:'auto'});
  if(message.type==='commit-choice'||message.type==='finalize')proposeOperation('initial',message);
  if(message.type==='confirm-cart')openCartDecision(false);
  if(message.type==='funds'){Object.assign(arsenalInitialState,message.context);syncEmbeddedShopActions()}
  if(message.type==='save-failed')showToast('Não foi possível salvar. Suas alterações continuam nesta tela; tente novamente antes de sair.');
  if(message.type==='operation-result'){
    if(!pendingOperation||pendingOperation.operationId!==message.operationId)return;
    if(!message.ok){showToast('Operação não salva. Tente confirmar novamente; o carrinho e o saldo foram preservados.');return}
    Object.keys(arsenalStorageValues).forEach(key=>delete arsenalStorageValues[key]);Object.assign(arsenalStorageValues,message.storage);
    characterProfiles=loadCharacterProfiles();backpackItems=activeCharacterProfile()?.backpack||[];cartItems=loadCart();
    const purchase=pendingOperation.kind==='purchase',crafted=pendingOperation.kind==='craft',craftCd=pendingOperation.craftCd;pendingOperation=null;
    closeModal(cartModal);syncCartUI();
    if(purchase){showToast(message.gift?'Item adicionado como presente, sem custos.':'Compra finalizada por '+formatCurrencyValue(message.total,'T$')+'.');postArsenal('close-shop')}
    if(crafted)showToast('Item fabricado por '+formatCurrencyValue(message.total,'T$')+'. Teste de Ofício (armeiro) CD '+craftCd+'.');
    if(message.context)applyArsenalContext(message.context);
  }
});
document.addEventListener('wheel',event=>{
  if(event.deltaY>0&&window.scrollY<2){event.preventDefault();postArsenal('host-scroll',{delta:event.deltaY})}
  else if(event.deltaY<0&&window.scrollY<2)postArsenal('host-scroll',{delta:event.deltaY});
},{passive:false,capture:true});
applyArsenalContext(arsenalInitialState);
