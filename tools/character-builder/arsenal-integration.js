let arsenalSession=0;
let arsenalShopOpen=false;
let arsenalMountedOwner=null;
let arsenalContextKey='';
const ARSENAL_PROFILES_KEY='arsenal-arton-character-profiles-v1';
const STARTING_FUNDS={2:300,3:600,4:1000,5:2000,6:3000,7:5000,8:7000,9:10000,10:13000,11:19000,12:27000,13:36000,14:49000,15:66000,16:88000,17:110000,18:150000,19:200000,20:260000};
function automaticStartingGrants(){
  const cls=classById(state.identity.classId),proficiencies=new Set(cls?.caracteristicas?.proficiencias||[]);
  const grants=['Mochila','Saco de Dormir','Traje de Viajante'].map((name,index)=>({id:'base:'+index,name,source:'initial'}));
  if(proficiencies.has('escudos'))grants.push({id:'base:shield',name:'Escudo Leve',source:'initial'});
  for(const [kind,origin] of [['standard',selectedStandardOrigin()],['regional',state.origin.mode==='dual'?selectedRegionalOrigin():null]])
    (origin?.itens||[]).forEach((name,index)=>grants.push({id:'origin:'+kind+':'+(origin.id||state.origin[kind])+':'+index,name,source:'origin'}));
  return grants;
}
function automaticStartingItems(){return automaticStartingGrants().map(grant=>grant.name)}
function arsenalState(){
  const signature=[state.identity.classId,state.origin.mode,state.origin.standard,state.origin.regional].join('|');
  if(!state.arsenal||typeof state.arsenal!=='object')state.arsenal={storage:{},choiceIndex:0,pending:null,complete:false,ruleSignature:signature,unresolved:[]};
  const saved=state.arsenal;
  if(!saved.storage||typeof saved.storage!=='object')saved.storage={};
  if(!saved.grants){saved.grants={};if(saved.complete){initialItemPlan().forEach(choice=>saved.grants['choice:'+choice.id]=true);automaticStartingGrants().forEach(grant=>saved.grants[grant.id]=true)}}
  if(!saved.operations)saved.operations={};
  if(saved.ruleSignature&&saved.ruleSignature!==signature){saved.pending=null;saved.choiceIndex=0;saved.complete=false;state.completed=state.completed.filter(step=>step!==8)}
  saved.ruleSignature=signature;saved.schemaVersion=2;saved.choiceIndex=Math.max(0,Number(saved.choiceIndex)||0);
  const plan=initialItemPlan();
  while(plan[saved.choiceIndex]&&saved.grants['choice:'+plan[saved.choiceIndex].id])saved.choiceIndex++;
  return saved;
}
function financesState(){
  const level=Math.max(1,Math.min(20,Number(state.identity.initialLevel||state.identity.plannedLevel)||1));
  if(!state.finances||typeof state.finances!=='object')state.finances={startingLevel:level,levelOneTibars:0,spent:0};
  const value=state.finances;value.startingLevel=Math.max(1,Math.min(20,Number(value.startingLevel)||level));
  value.levelOneTibars=Math.max(0,Number(value.levelOneTibars)||0);value.spent=Math.max(0,Number(value.spent)||0);
  state.identity.initialLevel=value.startingLevel;
  if(!state.identity.editingLevel)state.identity.editingLevel=1;
  return value;
}
function startingFunds(){const value=financesState();return value.startingLevel===1?value.levelOneTibars:STARTING_FUNDS[value.startingLevel]||0}
function remainingFunds(){return Math.max(0,startingFunds()-financesState().spent)}
function formatTibars(value){return 'T$ '+Number(value||0).toLocaleString('pt-BR')}
function renderStartingMoneyPanel(){
  const finances=financesState();
  return panel('Dinheiro inicial','<div class="grid two"><label class="field"><span>Quantidade de tibares</span><input class="input" data-field="levelOneTibars" type="number" min="0" step="0.01" placeholder="0" value="'+(finances.startingLevel===1?(finances.levelOneTibars||''):startingFunds())+'"'+(finances.startingLevel===1?'':' disabled')+'></label><div class="summary-card"><small>Saldo disponível</small><strong>'+formatTibars(remainingFunds())+'</strong></div></div>');
}
const identityBeforeStartingMoney=renderIdentityClass;
renderIdentityClass=function(){return identityBeforeStartingMoney()+renderStartingMoneyPanel()};
function initialItemPlan(){
  const cls=classById(state.identity.classId),proficiencies=new Set(cls?.caracteristicas?.proficiencias||[]),arcanist=state.identity.classId==='arcanista'||DATA.classInheritance[state.identity.classId]==='arcanista',choices=[{id:'simple',title:'Escolha uma arma simples (Opcional)',type:'arma',category:'simples'}];
  if(proficiencies.has('armas_marciais'))choices.push({id:'martial',title:'Escolha uma arma marcial (Opcional)',type:'arma',category:'marcial'});
  if(!arcanist)choices.push({id:'armor',title:'Escolha uma armadura (Opcional)',type:'armadura',names:['Armadura de Couro','Couro Batido','Gibão de Peles',...(proficiencies.has('armaduras_pesadas')?['Brunea']:[])]});
  return choices;
}
function currentItemChoice(){return initialItemPlan()[arsenalState().choiceIndex]||null}
function inventoryProfile(){
  const saved=arsenalState();let profiles;
  try{profiles=JSON.parse(saved.storage[ARSENAL_PROFILES_KEY]||'{}')}catch{profiles={}}
  let profile=profiles.profiles?.find(item=>item.id==='ficha-ativa')||profiles.profiles?.find(item=>item.id===profiles.activeId);
  if(!profile){let legacy=[];try{legacy=JSON.parse(saved.storage['arsenal-arton-backpack-v1']||'[]')}catch{}profile={id:'ficha-ativa',backpack:Array.isArray(legacy)?legacy:[]}}
  return {...profile,id:'ficha-ativa',name:state.identity.characterName||'Personagem',strength:finalAttrs().for};
}
function characterInventory(){return inventoryProfile().backpack||[]}
function arsenalInitialData(mode){
  const saved=arsenalState(),profile=inventoryProfile(),storage={...saved.storage};
  storage[ARSENAL_PROFILES_KEY]=JSON.stringify({activeId:'ficha-ativa',profiles:[profile]});
  mode=mode||(saved.complete?(arsenalShopOpen?'shop':'backpack'):'initial');
  return{session:arsenalSession,storage,choice:mode==='initial'?currentItemChoice():null,candidate:mode==='initial'?saved.pending:null,mode,funds:remainingFunds(),startingLevel:financesState().startingLevel,startingMoney:startingFunds(),strength:profile.strength,characterName:profile.name};
}
function renderArsenal(){
  const saved=arsenalState(),title=saved.complete?'Itens adquiridos':currentItemChoice()?.title||'Equipamento inicial';
  return '<section class="panel arsenal-choice-panel"><header class="panel-header" id="arsenalPanelHeader"'+(saved.complete?' hidden':'')+'><h3 class="panel-title" id="arsenalPanelTitle">'+esc(title)+'</h3></header><p class="help" id="arsenalStatus">Carregando os itens…</p><iframe id="characterArsenal" title="'+esc(title)+'" sandbox="allow-scripts" style="display:block;width:100%;height:85dvh;min-height:480px;border:0"></iframe><div id="arsenalUnresolved"></div></section>';
}
const deferredBeforeArsenal=renderDeferred;
renderDeferred=function(type){return type==='items'?renderArsenal():deferredBeforeArsenal(type)};
const phaseBeforeArsenal=phaseIsComplete,missingBeforeArsenal=missingChoices,pendingBeforeArsenal=characterPendingChoices;
phaseIsComplete=function(step){return step===8?arsenalState().complete:phaseBeforeArsenal(step)};
missingChoices=function(step){return step===8&&!arsenalState().complete?[{title:'Equipamento inicial',message:'Conclua ou pule as escolhas de equipamento inicial.',selector:'.arsenal-choice-panel'}]:missingBeforeArsenal(step)};
characterPendingChoices=function(){const pending=pendingBeforeArsenal();if(!arsenalState().complete)pending.push({title:'Equipamento inicial',message:'Conclua a fase de itens iniciais.',selector:'[data-step="8"]'});return pending};
function sendArsenal(type,details={}){document.getElementById('characterArsenal')?.contentWindow?.postMessage({channel:'forja-arsenal-v1',session:arsenalSession,type,...details},'*')}
function syncInitialItemFooter(){
  if(state.step!==8)return;
  const saved=arsenalState(),title=saved.complete?(arsenalShopOpen?'Comprar itens':'Itens adquiridos'):currentItemChoice()?.title||'Equipamento inicial';
  document.getElementById('redoInitialItemsButton').hidden=!saved.complete||arsenalShopOpen;
  document.getElementById('nextButton').textContent=saved.complete?(arsenalShopOpen?'Confirmar compra':'Continuar →'):saved.pending?'Confirmar escolha →':'Pular escolha →';
  document.getElementById('nextButton').disabled=false;
  document.getElementById('stageTitle').textContent=saved.complete?title:'Itens iniciais';document.getElementById('stageDescription').textContent='';
  document.getElementById('arsenalPanelHeader').hidden=saved.complete;
  document.getElementById('arsenalPanelTitle').textContent=title;
  document.getElementById('arsenalUnresolved').innerHTML=saved.unresolved?.length?'<div class="warning-box"><strong>Itens que exigem uma escolha:</strong><br>'+esc(saved.unresolved.join(' · '))+'</div>':'';
}
function unclaimedAutomaticGrants(){const saved=arsenalState();return automaticStartingGrants().filter(grant=>!saved.grants[grant.id])}
function finalizeInitialItems(){document.getElementById('nextButton').disabled=true;sendArsenal('finalize',{operationId:'finalize:'+arsenalState().ruleSignature,automaticGrants:unclaimedAutomaticGrants(),finalize:true})}
function advanceInitialItemChoice(){const saved=arsenalState();saved.pending=null;saved.choiceIndex++;if(!currentItemChoice())finalizeInitialItems();else{persistNow();renderStage()}}
function redoInitialItems(){
  const saved=arsenalState(),profiles=JSON.parse(saved.storage[ARSENAL_PROFILES_KEY]||'{"profiles":[]}');
  for(const profile of profiles.profiles||[])profile.backpack=(profile.backpack||[]).filter(item=>item.acquisition?.source!=='initial');
  saved.storage[ARSENAL_PROFILES_KEY]=JSON.stringify(profiles);
  Object.keys(saved.grants).filter(id=>id.startsWith('choice:')||id.startsWith('base:')).forEach(id=>delete saved.grants[id]);
  saved.operations={};saved.choiceIndex=0;saved.pending=null;saved.complete=false;saved.unresolved=[];arsenalShopOpen=false;
  state.completed=state.completed.filter(step=>step!==8);
  if(persistNow()){toast('Você poderá escolher novamente os itens iniciais. Os itens de origem foram mantidos.');renderStage()}
}
const renderBeforeArsenal=renderStage;
renderStage=function(){
  const frame=document.getElementById('characterArsenal');
  const reuse=state.step===8&&arsenalMountedOwner===state&&frame?.isConnected;
  if(!reuse)renderBeforeArsenal();
  if(state.step!==8){arsenalMountedOwner=null;arsenalShopOpen=false;arsenalContextKey=''}
  document.body?.classList.toggle('arsenal-stage',state.step===8);
  if(state.step===10){document.getElementById('nextButton').textContent='Ficha concluída';return}
  if(state.step!==8)return;
  syncInitialItemFooter();
  const context=arsenalInitialData();
  if(!context.choice&&context.mode==='initial')context.mode='backpack';
  const key=JSON.stringify([context.mode,context.choice,context.candidate,context.strength,context.characterName,context.funds]);
  if(reuse){if(key!==arsenalContextKey)sendArsenal('context',{context});arsenalContextKey=key;return}
  arsenalSession++;context.session=arsenalSession;
  const target=document.getElementById('characterArsenal');
  arsenalMountedOwner=state;arsenalContextKey=key;
  target.srcdoc=DATA.arsenalHtml.replace('/*__ARSENAL_STATE__*/',()=>JSON.stringify(context).replace(/</g,'\\u003c'));
};
function acceptArsenalOperation(message){
  const saved=arsenalState(),previous=saved.operations[message.operationId];
  if(!message.operationId||!message.storage||!['purchase','initial'].includes(message.kind))return;
  if(previous){sendArsenal('operation-result',{...previous,operationId:message.operationId,ok:true,storage:saved.storage,context:arsenalInitialData()});return}
  const beforeArsenal=JSON.parse(JSON.stringify(saved)),beforeFinances={...financesState()};
  const total=Math.max(0,Number(message.total)||0),gift=message.kind==='purchase'&&total>remainingFunds();
  if(message.kind==='purchase'&&!gift)financesState().spent+=total;
  saved.storage=message.storage;
  if(message.kind==='purchase'){
    const profiles=JSON.parse(saved.storage[ARSENAL_PROFILES_KEY]||'{}');
    for(const profile of profiles.profiles||[])for(const item of profile.backpack||[])if(item.acquisition?.operationId===message.operationId)item.acquisition.source=gift?'gift':'purchase';
    saved.storage[ARSENAL_PROFILES_KEY]=JSON.stringify(profiles);
  }
  for(const grant of message.grants||[])saved.grants[grant]=true;
  if(message.kind==='initial'){
    saved.pending=null;saved.unresolved=message.unresolved||[];
    if(message.finalize){saved.complete=true;if(!state.completed.includes(8))state.completed.push(8)}
    else saved.choiceIndex++;
  }
  const result={total,gift,kind:message.kind};saved.operations[message.operationId]=result;
  if(!persistNow()){state.arsenal=beforeArsenal;state.finances=beforeFinances;state.completed=state.completed.filter(step=>step!==8||beforeArsenal.complete);sendArsenal('operation-result',{operationId:message.operationId,ok:false});document.getElementById('nextButton').disabled=false;return}
  if(message.kind==='purchase')arsenalShopOpen=false;
  sendArsenal('operation-result',{...result,operationId:message.operationId,ok:true,storage:saved.storage,context:arsenalInitialData()});
  syncInitialItemFooter();
}
document.addEventListener('click',event=>{
  if(event.target.closest?.('#redoInitialItemsButton')){
    event.preventDefault();event.stopImmediatePropagation();
    if(window.confirm('Você poderá escolher novamente os itens iniciais. Isso não afeta os itens de origem.'))redoInitialItems();
    return;
  }
  if(!event.target.closest?.('#nextButton'))return;
  if(state.step===10){
    event.preventDefault();event.stopImmediatePropagation();
    if(characterPendingChoices().length)return;
    if(persistNow())toast('Ficha finalizada e salva neste navegador.');return;
  }
  if(state.step!==8)return;
  event.preventDefault();event.stopImmediatePropagation();
  const saved=arsenalState();
  if(saved.complete){if(arsenalShopOpen){sendArsenal('confirm-cart');return}if(!state.completed.includes(8))state.completed.push(8);state.step=9;renderStage();window.scrollTo({top:0,behavior:'smooth'});return}
  const choice=currentItemChoice();
  if(!choice){finalizeInitialItems();return}
  if(saved.pending){
    document.getElementById('nextButton').disabled=true;
    const last=initialItemPlan().slice(saved.choiceIndex+1).every(item=>saved.grants['choice:'+item.id]);
    sendArsenal('commit-choice',{operationId:'choice:'+choice.id,grantId:'choice:'+choice.id,selection:saved.pending,finalize:last,automaticGrants:last?unclaimedAutomaticGrants():[]});
  }else{saved.grants['choice:'+choice.id]=true;advanceInitialItemChoice()}
},true);
window.addEventListener('message',event=>{
  const frame=document.getElementById('characterArsenal'),message=event.data;
  if(state.step!==8||!frame?.contentWindow||event.source!==frame.contentWindow||message?.channel!=='forja-arsenal-v1'||message.session!==arsenalSession)return;
  if(message.type==='ready'){document.getElementById('arsenalStatus').hidden=true;if(!arsenalState().complete&&!currentItemChoice())finalizeInitialItems();return}
  if(message.type==='open-shop'&&arsenalState().complete){arsenalShopOpen=true;renderStage();return}
  if(message.type==='close-shop'){arsenalShopOpen=false;renderStage();return}
  if(message.type==='host-scroll'){
    const rect=frame.getBoundingClientRect(),limit=document.querySelector('.phase-nav')?.getBoundingClientRect().bottom||0,delta=Number(message.delta)||0;
    if(delta>0&&rect.top>limit+2)window.scrollBy({top:Math.min(delta,rect.top-limit),behavior:'auto'});
    else if(delta<0&&rect.top<limit-2)window.scrollBy({top:Math.max(delta,rect.top-limit),behavior:'auto'});
    else sendArsenal('scroll-items',{delta});
    return;
  }
  if(message.type==='redo-initial-request'||message.type==='redo-initial'){if(window.confirm('Você poderá escolher novamente os itens iniciais. Isso não afeta os itens de origem.'))redoInitialItems();return}
  if(message.type==='candidate'){arsenalState().pending=message.itemId?{itemId:message.itemId,itemName:message.itemName,options:message.options||{}}:null;persistNow();syncInitialItemFooter();return}
  if(message.type==='operation'){acceptArsenalOperation(message);return}
  if(message.type==='money'&&financesState().startingLevel===1){financesState().levelOneTibars=Math.max(0,Number(message.value)||0);persistNow();sendArsenal('funds',{context:{funds:remainingFunds(),startingMoney:startingFunds()}});return}
  if(message.type==='save'&&message.storage&&typeof message.storage==='object'){arsenalState().storage=message.storage;if(!persistNow())sendArsenal('save-failed')}
});
const summaryBeforeArsenal=renderSummary;
renderSummary=function(){
  const items=characterInventory();
  return summaryBeforeArsenal()+renderStartingMoneyPanel()+panel('Mochila','<div class="ability-list">'+(items.length?items.map(item=>abilityHtml({nome:(item.displayName||item.options?.customName||item.itemName||item.itemId)+' × '+item.quantity,descricao:item.ammoRemaining!==undefined?'Munições restantes: '+item.ammoRemaining:''})).join(''):'<p class="help">A mochila está vazia.</p>')+'</div>');
};
document.addEventListener('input',event=>{if(event.target.dataset.field==='levelOneTibars'){financesState().levelOneTibars=Math.max(0,Number(event.target.value)||0);persist();const values=event.target.closest('.panel-body')?.querySelectorAll('.summary-card strong');if(values?.length)values[values.length-1].textContent=formatTibars(remainingFunds())}},true);
document.addEventListener('change',event=>{if(event.target.dataset.field==='plannedLevel'&&state.step===1){state.identity.initialLevel=Number(state.identity.plannedLevel)||1;financesState().startingLevel=state.identity.initialLevel;renderStage()}},true);
