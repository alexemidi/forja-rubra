characterButton.hidden=true;
strengthInput.disabled=true;
strengthInput.readOnly=true;
let initialChoice=null;
let selectedCandidate=null;
let pendingOperation=null;
let shopFilters=null;
const baseApplyFilters=applyFilters;
const baseSyncCartUI=syncCartUI;
const kind=document.createElement('span');
kind.className='initial-choice-kind';
const searchRow=document.querySelector('.search-row');
document.getElementById('nameOnlySearchButton').after(kind);
const advancedFilters=document.createElement('button');
advancedFilters.type='button';advancedFilters.className='initial-advanced-filter';advancedFilters.textContent='⚙ Filtros avançados';advancedFilters.setAttribute('aria-expanded','false');kind.after(advancedFilters);
const shopFilterButton=document.createElement('button');
shopFilterButton.type='button';shopFilterButton.className='search-mode-button shop-filter-button';shopFilterButton.dataset.shopFilters='';shopFilterButton.setAttribute('aria-expanded','false');shopFilterButton.textContent='⚙ Filtros avançados · Convencionais';
searchRow.insertBefore(shopFilterButton,document.querySelector('.sort-control'));
const shopActions=document.createElement('nav');
shopActions.className='embedded-shop-actions';
shopActions.innerHTML='<label>Dinheiro inicial · T$ <input data-money type="number" min="0" step="0.01" placeholder="0" aria-label="Dinheiro inicial em tibares"><span data-balance></span></label><button type="button" data-shop-view="catalog">🏪 Comprar itens</button><button type="button" data-shop-cart>🛒 Carrinho <span data-shop-cart-count>0</span></button><button type="button" data-shop-view="backpack">🎒 Mochila</button><button type="button" data-redo-initial>Refazer escolhas</button>';
document.body.prepend(shopActions);
function syncEmbeddedShopActions(){
  shopActions.querySelectorAll('[data-shop-view]').forEach(button=>button.classList.toggle('active',button.dataset.shopView===(arsenalInitialState.mode==='backpack'?'backpack':state.view)));
  shopActions.querySelector('[data-shop-cart-count]').textContent=String(cartItems.reduce((sum,entry)=>sum+entry.quantity,0));
  const money=shopActions.querySelector('[data-money]');
  if(document.activeElement!==money)money.value=arsenalInitialState.startingMoney||'';
  money.disabled=arsenalInitialState.startingLevel!==1;
  shopActions.querySelector('[data-balance]').textContent=' · Saldo: '+formatCurrencyValue(arsenalInitialState.funds,'T$');
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
  const values=[initialChoice.id==='simple'?'Armas simples':initialChoice.id==='martial'?'Armas marciais':'Armaduras permitidas'];
  if(initialChoice.type==='arma'&&state.combat!=='todos')values.push(COMBAT_LABELS[state.combat]||humanize(state.combat));
  if(initialChoice.type==='arma'&&state.grip!=='todos')values.push(GRIP_LABELS[state.grip]||humanize(state.grip));
  kind.textContent=values.join(' · ');
  advancedFilters.hidden=initialChoice.type!=='arma';
}
function syncShopFilterSummary(){
  const values=[state.type==='todos'?'Todos os tipos':TYPE_META[state.type]?.label||humanize(state.type),state.specific==='convencional'?'Convencionais':state.specific==='especifico'?'Específicos':state.specific==='liturgico'?'Litúrgicos':'Todas as naturezas'];
  if(state.category!=='todos')values.push(CATEGORY_LABELS[state.category]||humanize(state.category));
  if(state.combat!=='todos')values.push(COMBAT_LABELS[state.combat]||humanize(state.combat));
  if(state.grip!=='todos')values.push(GRIP_LABELS[state.grip]||humanize(state.grip));
  const summary=values.join(' · '),open=document.body.classList.contains('shop-filters-open');
  shopFilterButton.textContent=(open?'Fechar filtros':'⚙ Filtros avançados')+' · '+summary;
  shopFilterButton.title='Filtros aplicados: '+summary;
}
function findStartingItem(raw){const key=starterKey(raw);return preparedItems.find(item=>!isSpecificMagicItem(item)&&!isLiturgicalItem(item)&&starterKey(item.nome)===key)}
function availableInitialItems(){
  let results=filteredItems().filter(item=>!isSpecificMagicItem(item)&&!isLiturgicalItem(item));
  if(initialChoice?.names?.length){const allowed=new Set(initialChoice.names.map(starterKey));results=results.filter(item=>allowed.has(starterKey(item.nome)))}
  return results;
}
function restoreCandidate(){
  itemsGrid.querySelectorAll('[data-choice-item]').forEach(entry=>entry.classList.toggle('candidate',entry.dataset.choiceItem===selectedCandidate?.itemId));
  itemsGrid.querySelectorAll('[data-action="add-to-cart"]').forEach(button=>button.innerHTML=button.dataset.itemId===selectedCandidate?.itemId?'✓ Remover seleção':'✓ Selecionar item');
}
applyFilters=function(loadMore){
  if(arsenalInitialState.mode!=='initial'){const result=baseApplyFilters(loadMore);syncShopFilterSummary();return result}
  window.clearTimeout(searchTimer);
  state.type=initialChoice.type;state.category=initialChoice.category||'todos';state.specific='convencional';
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
}
function applyArsenalContext(context){
  const previousMode=arsenalInitialState.mode;
  if(previousMode==='shop')shopFilters={type:state.type,specific:state.specific,category:state.category,combat:state.combat,grip:state.grip,search:state.search,sort:state.sort,searchNameOnly:state.searchNameOnly};
  arsenalInitialState={...arsenalInitialState,...context};
  const mode=arsenalInitialState.mode;
  initialChoice=arsenalInitialState.choice;
  selectedCandidate=arsenalInitialState.candidate||null;
  const profile=activeCharacterProfile();if(profile){profile.strength=arsenalInitialState.strength;profile.name=arsenalInitialState.characterName||profile.name}
  document.body.classList.toggle('initial-equipment',mode==='initial');
  document.body.classList.toggle('initial-equipment-review',mode==='backpack');
  document.body.classList.toggle('embedded-shop',mode==='shop');
  shopActions.hidden=mode==='initial';kind.hidden=mode!=='initial';advancedFilters.hidden=mode!=='initial'||initialChoice?.type!=='arma';
  shopFilterButton.hidden=mode!=='shop';
  shopActions.querySelector('[data-redo-initial]').hidden=mode!=='backpack';
  state.backpackMode=state.backpackMode||'list';
  if(mode==='initial'){
    state.type=initialChoice.type;state.category=initialChoice.category||'todos';state.specific='convencional';state.combat='todos';state.grip='todos';state.search='';
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
  const total=type==='purchase'?cartTotalsInfo().value:0;
  const gift=type==='purchase'&&total>arsenalInitialState.funds;
  arsenalTransaction=true;
  try{
    if(type==='purchase')cartItems.forEach(entry=>addPackagesToBackpack(entry.itemId,entry.quantity,entry.options,{source:gift?'gift':'purchase',operationId:id}));
    if(type==='initial'&&message.selection){
      addPackagesToBackpack(message.selection.itemId,1,message.selection.options,{source:'initial',grantId:message.grantId});grants.push(message.grantId);
    }
    for(const grant of message.automaticGrants||[]){const item=findStartingItem(grant.name);if(item){addPackagesToBackpack(item.id,1,{}, {source:grant.source,grantId:grant.id});grants.push(grant.id)}else unresolved.push(grant.name)}
    if(type==='purchase')cartItems=[];
    persistBackpack();persistCart();
    pendingOperation={operationId:id,kind:type,storage:{...arsenalStorageValues},total,gift,grants,unresolved,finalize:!!message.finalize};
  }finally{
    Object.keys(arsenalStorageValues).forEach(key=>delete arsenalStorageValues[key]);Object.assign(arsenalStorageValues,before.storage);
    characterProfiles=JSON.parse(before.profiles);backpackItems=activeCharacterProfile()?.backpack||[];cartItems=JSON.parse(before.cart);arsenalTransaction=false;
  }
  postArsenal('operation',pendingOperation);
}
shopActions.addEventListener('click',event=>{
  if(event.target.closest('[data-shop-cart]'))return openCartDecision(false);
  if(event.target.closest('[data-redo-initial]')){postArsenal('redo-initial-request');return}
  const view=event.target.closest('[data-shop-view]');if(!view)return;
  if(view.dataset.shopView==='backpack'){if(cartItems.length)openCartDecision(true);else postArsenal('close-shop')}
  else postArsenal('open-shop');
});
advancedFilters.addEventListener('click',()=>{
  const open=document.body.classList.toggle('initial-filters-open');advancedFilters.setAttribute('aria-expanded',String(open));advancedFilters.textContent=open?'Fechar filtros':'⚙ Filtros avançados';
});
shopFilterButton.addEventListener('click',()=>{
  const open=document.body.classList.toggle('shop-filters-open');shopFilterButton.setAttribute('aria-expanded',String(open));syncShopFilterSummary();
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
  if(event.target.closest?.('#checkoutCart')){event.preventDefault();event.stopImmediatePropagation();if(cartItems.length)proposeOperation('purchase');return}
  if(event.target.closest?.('#cartViewBackpack')){event.preventDefault();event.stopImmediatePropagation();closeModal(cartModal);postArsenal('close-shop')}
  if(event.target.closest?.('#cartReturnCatalog')){event.preventDefault();event.stopImmediatePropagation();closeModal(cartModal);postArsenal('open-shop')}
},true);
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
    const purchase=pendingOperation.kind==='purchase';pendingOperation=null;
    closeModal(cartModal);syncCartUI();
    if(purchase){showToast(message.gift?'Item adicionado como presente, sem custos.':'Compra finalizada por '+formatCurrencyValue(message.total,'T$')+'.');postArsenal('close-shop')}
    if(message.context)applyArsenalContext(message.context);
  }
});
document.addEventListener('wheel',event=>{
  if(event.deltaY>0&&window.scrollY<2){event.preventDefault();postArsenal('host-scroll',{delta:event.deltaY})}
  else if(event.deltaY<0&&window.scrollY<2)postArsenal('host-scroll',{delta:event.deltaY});
},{passive:false,capture:true});
applyArsenalContext(arsenalInitialState);
