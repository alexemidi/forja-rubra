// Minimal catalogue used only for initial-equipment choices inside the sheet.
characterButton.hidden=true;strengthInput.disabled=true;strengthInput.readOnly=true;
const reviewMode=!arsenalInitialState.choice,initialChoice=arsenalInitialState.choice||{id:'review',type:'todos',category:'todos'};
let selectedCandidate=arsenalInitialState.candidate||null;
const initialStyle=document.createElement('style');
initialStyle.textContent=`
  .site-header,.catalog-heading,#specificFilters,#contextFilters,.filter-row-control,.compact-arsenal-filters,#debugModeButton,#resultCount,.chip-count,.catalog-note,.acquired-indicator{display:none!important}
  .filters-panel{position:static!important;padding:10px 18px!important}
  .filters-inner,.catalog-main{max-width:none!important}
  .filters-inner{padding:0!important}
  .search-row{margin:0 0 8px!important}
  .initial-choice-kind{display:inline-flex;align-items:center;min-height:31px;margin-right:10px;padding:5px 12px;border:1px solid #d5aa4c;border-radius:18px;color:#efd184;background:#d5aa4c14;font-size:12px;font-weight:700}
  #weaponFilters{display:block!important}
  #weaponFilters[hidden]{display:none!important}
  #weaponFilters .filter-row{margin-top:6px}
  .items-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;align-items:start}
  .catalog-list-entry{min-width:0;border:1px solid var(--border);border-radius:8px;background:var(--surface)}
  .catalog-list-entry>summary{padding:12px;cursor:pointer;color:var(--text);font-size:13px;list-style:none}
  .catalog-list-entry>summary::before{content:'▸';margin-right:8px;color:#dcbf70}.catalog-list-entry[open]>summary::before{content:'▾'}
  .catalog-list-entry .item-card{max-height:none!important;width:100%;margin:0;border-width:1px 0 0;border-radius:0}
  .catalog-list-entry .card-overlay{position:static!important;height:auto!important;background:none!important;display:block!important;pointer-events:auto!important}
  .catalog-list-entry .expand-item-button{display:none!important}.catalog-list-entry .item-card-detail{max-height:none!important;overflow:visible!important}
  .catalog-list-entry.candidate{border-color:#51bde8;box-shadow:0 0 0 1px #51bde855 inset}.catalog-list-entry.candidate>summary{color:#aee8ff}
  .catalog-list-entry.candidate .acquire-button{border-color:#51bde8;background:#51bde825;color:#c3eeff}
  body.initial-equipment-review .filters-panel,body.initial-equipment-review .catalog-view,body.initial-equipment-review .strength-field{display:none!important}
  body.initial-equipment-review .load-panel{grid-template-columns:1fr!important}
  body.initial-equipment-review .backpack-header{padding:10px 14px}
  @media(max-width:600px){
    .filters-panel{padding:8px!important}.catalog-main{padding:8px!important}.items-grid{grid-template-columns:1fr;gap:6px}
    .search-row{display:grid!important;grid-template-columns:auto minmax(100px,1fr);gap:7px!important}.search-wrap{grid-column:1/-1;min-width:0;width:100%}
    .search-input{min-height:34px;padding-block:7px}#nameOnlySearchButton{min-height:30px;padding:5px 9px;font-size:11px}
    .sort-label{display:none}.sort-control{margin:0!important;min-width:0;justify-self:end}.sort-select{min-height:30px;padding:5px;font-size:11px;width:100%}
    .catalog-list-entry>summary{padding:11px}.filter-label{font-size:10px}.filter-row{gap:5px}
  }
`;
document.head.appendChild(initialStyle);
nameOnlySearchButton.textContent='Somente nome';sortSelect.querySelector('option[value="name"]').textContent='Nome A-Z';
const kind=document.createElement('span');kind.className='initial-choice-kind';kind.textContent=initialChoice.id==='simple'?'⚔ Armas Simples':initialChoice.id==='martial'?'⚔ Armas Marciais':'🛡 Armaduras permitidas';
if(!reviewMode)document.querySelector('.filters-inner').insertBefore(kind,weaponFilters);
const originalApply=applyFilters;
function availableInitialItems(){
  let results=filteredItems().filter(item=>!isSpecificMagicItem(item)&&!isLiturgicalItem(item));
  if(initialChoice.names?.length){const allowed=new Set(initialChoice.names.map(starterKey));results=results.filter(item=>allowed.has(starterKey(item.nome)))}
  return results;
}
applyFilters=function(){
  state.type=initialChoice.type;state.category=initialChoice.category||'todos';originalApply();
  const results=availableInitialItems();
  itemsGrid.innerHTML=results.map(item=>'<details class="catalog-list-entry" data-choice-item="'+escapeHtml(item.id)+'"><summary>'+escapeHtml(item.nome)+'</summary>'+itemCard(item)+'</details>').join('');
  itemsGrid.querySelectorAll('[data-action="add-to-cart"]').forEach(button=>{button.innerHTML='<span aria-hidden="true">✓</span> Selecionar item';button.setAttribute('aria-label','Selecionar '+(itemById.get(button.dataset.itemId)?.nome||'item'))});
  emptyState.classList.toggle('visible',results.length===0);checkCatalogOverflow();restoreCandidate();
};
function starterKey(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\([^)]*\)/g,' ').replace(/^\s*(?:uma?|\d+)\s+/,'').replace(/[^a-z0-9]+/g,' ').trim()}
function findStartingItem(raw){
  const conventional=preparedItems.filter(item=>!isSpecificMagicItem(item)&&!isLiturgicalItem(item)),key=starterKey(raw);return conventional.find(item=>starterKey(item.nome)===key);
}
function chooseCandidate(item){
  if(selectedCandidate?.itemId===item.id){selectedCandidate=null;restoreCandidate();window.parent.postMessage({channel:'forja-arsenal-v1',session:arsenalInitialState.session,type:'candidate',itemId:''},'*');return}
  selectedCandidate={itemId:item.id,itemName:item.nome,options:catalogOptionsForItem(item)};
  itemsGrid.querySelectorAll('[data-choice-item]').forEach(entry=>entry.classList.toggle('candidate',entry.dataset.choiceItem===item.id));
  itemsGrid.querySelectorAll('[data-action="add-to-cart"]').forEach(button=>button.innerHTML=button.dataset.itemId===item.id?'<span aria-hidden="true">✓</span> Item selecionado':'<span aria-hidden="true">✓</span> Selecionar item');
  window.parent.postMessage({channel:'forja-arsenal-v1',session:arsenalInitialState.session,type:'candidate',...selectedCandidate},'*');
}
function restoreCandidate(){
  itemsGrid.querySelectorAll('[data-choice-item]').forEach(entry=>entry.classList.toggle('candidate',Boolean(selectedCandidate&&entry.dataset.choiceItem===selectedCandidate.itemId)));
  itemsGrid.querySelectorAll('[data-action="add-to-cart"]').forEach(button=>button.innerHTML=selectedCandidate&&button.dataset.itemId===selectedCandidate.itemId?'<span aria-hidden="true">✓</span> Remover seleção':'<span aria-hidden="true">✓</span> Selecionar item');
}
document.addEventListener('click',event=>{
  const button=event.target.closest?.('[data-action="add-to-cart"]');if(!button)return;
  event.preventDefault();event.stopImmediatePropagation();const item=itemById.get(button.dataset.itemId);if(item)chooseCandidate(item);
},true);
window.addEventListener('message',event=>{
  const message=event.data;if(event.source!==window.parent||message?.channel!=='forja-arsenal-v1'||message.session!==arsenalInitialState.session)return;
  if(message.type==='commit-choice'&&message.selection){
    addPackagesToBackpack(message.selection.itemId,1,message.selection.options);persistBackpack();refreshInventoryUI();
    if(message.finalize){
      const unresolved=[],granted=[message.selection.itemName];
      for(const name of message.automaticNames||[]){const item=findStartingItem(name);if(item){addPackagesToBackpack(item.id,1,{});granted.push(item.nome)}else unresolved.push(name)}
      persistBackpack();refreshInventoryUI();
      window.parent.postMessage({channel:'forja-arsenal-v1',session:arsenalInitialState.session,type:'finalized',storage:{...arsenalStorageValues},granted,unresolved},'*');
    }else window.parent.postMessage({channel:'forja-arsenal-v1',session:arsenalInitialState.session,type:'choice-committed',itemName:message.selection.itemName,storage:{...arsenalStorageValues}},'*');
  }
  if(message.type==='finalize'){
    const unresolved=[],granted=[];
    for(const name of message.automaticNames||[]){const item=findStartingItem(name);if(item){addPackagesToBackpack(item.id,1,{});granted.push(item.nome)}else unresolved.push(name)}
    persistBackpack();refreshInventoryUI();
    window.parent.postMessage({channel:'forja-arsenal-v1',session:arsenalInitialState.session,type:'finalized',storage:{...arsenalStorageValues},granted,unresolved},'*');
  }
});
state.type=initialChoice.type;state.category=initialChoice.category||'todos';state.specific='convencional';state.backpackMode='list';renderContextFilters();
if(initialChoice.type!=='arma')weaponFilters.hidden=true;
if(reviewMode){
  document.body.classList.add('initial-equipment-review');setView('backpack');renderBackpack();
  const buy=document.createElement('button');buy.type='button';buy.className='view-button';buy.textContent='🛒 Comprar itens';buy.addEventListener('click',()=>window.parent.postMessage({channel:'forja-arsenal-v1',session:arsenalInitialState.session,type:'open-shop'},'*'));backpackView.querySelector('.backpack-header-actions')?.prepend(buy);
}
else{applyFilters();restoreCandidate()}
window.parent.postMessage({channel:'forja-arsenal-v1',session:arsenalInitialState.session,type:'ready'},'*');
