let arsenalSession=0;
let arsenalShopOpen=false;
const STARTING_FUNDS={2:300,3:600,4:1000,5:2000,6:3000,7:5000,8:7000,9:10000,10:13000,11:19000,12:27000,13:36000,14:49000,15:66000,16:88000,17:110000,18:150000,19:200000,20:260000};
function arsenalState(){
  const signature=[state.identity.classId,state.origin.mode,state.origin.standard,state.origin.regional].join('|');
  if(!state.arsenal||typeof state.arsenal!=='object'||state.arsenal.ruleSignature&&state.arsenal.ruleSignature!==signature)state.arsenal={storage:{},choiceIndex:0,pending:null,complete:false,ruleSignature:signature,grantedNames:[],unresolved:[]};
  if(!state.arsenal.storage||typeof state.arsenal.storage!=='object')state.arsenal.storage={};
  state.arsenal.ruleSignature=signature;
  state.arsenal.choiceIndex=Math.max(0,Number(state.arsenal.choiceIndex)||0);
  return state.arsenal;
}
function financesState(){
  const level=Math.max(1,Math.min(20,Number(state.identity.plannedLevel)||1));
  if(!state.finances||typeof state.finances!=='object')state.finances={startingLevel:level,levelOneTibars:0,spent:0};
  if(!arsenalState().complete&&state.finances.startingLevel!==level)state.finances={startingLevel:level,levelOneTibars:0,spent:0};
  state.finances.startingLevel=Math.max(1,Math.min(20,Number(state.finances.startingLevel)||level));
  state.finances.levelOneTibars=Math.max(0,Number(state.finances.levelOneTibars)||0);state.finances.spent=Math.max(0,Number(state.finances.spent)||0);
  return state.finances;
}
function startingFunds(){const value=financesState();return value.startingLevel===1?value.levelOneTibars:STARTING_FUNDS[value.startingLevel]||0}
function remainingFunds(){return Math.max(0,startingFunds()-financesState().spent)}
function formatTibars(value){return 'T$ '+Number(value||0).toLocaleString('pt-BR')}
function renderStartingMoneyPanel(){
  const finances=financesState(),funds=startingFunds();
  return panel('Dinheiro inicial',finances.startingLevel===1?'<div class="grid two"><label class="field"><span>Quantidade de tibares</span><input class="input" data-field="levelOneTibars" type="number" min="0" step="1" value="'+finances.levelOneTibars+'"></label><div class="summary-card"><small>Saldo inicial</small><strong>'+formatTibars(funds)+'</strong></div></div>':'<div class="summary-card"><small>Valor para personagem de '+finances.startingLevel+'º nível</small><strong>'+formatTibars(funds)+'</strong></div>',finances.startingLevel===1?'Defina os tibares com que o personagem começa.':'Este valor é definido automaticamente pelo nível inicial.');
}
const identityBeforeStartingMoney=renderIdentityClass;
renderIdentityClass=function(){return identityBeforeStartingMoney()+renderStartingMoneyPanel()};
function initialItemPlan(){
  const cls=classById(state.identity.classId),proficiencies=new Set(cls?.caracteristicas?.proficiencias||[]),arcanist=state.identity.classId==='arcanista'||DATA.classInheritance[state.identity.classId]==='arcanista',choices=[{id:'simple',title:'Escolha uma arma simples (Opcional)',type:'arma',category:'simples'}];
  if(proficiencies.has('armas_marciais'))choices.push({id:'martial',title:'Escolha uma arma marcial (Opcional)',type:'arma',category:'marcial'});
  if(!arcanist)choices.push({id:'armor',title:'Escolha uma armadura (Opcional)',type:'armadura',names:['Armadura de Couro','Couro Batido','Gibão de Peles',...(proficiencies.has('armaduras_pesadas')?['Brunea']:[])]});
  return choices;
}
function automaticStartingItems(){
  const cls=classById(state.identity.classId),proficiencies=new Set(cls?.caracteristicas?.proficiencias||[]),origin=selectedStandardOrigin(),regional=state.origin.mode==='dual'?selectedRegionalOrigin():null;
  return [...new Set(['Mochila','Saco de Dormir','Traje de Viajante',...(proficiencies.has('escudos')?['Escudo Leve']:[]),...(origin?.itens||[]),...(regional?.itens||[])])];
}
function currentItemChoice(){return initialItemPlan()[arsenalState().choiceIndex]||null}
function arsenalInitialData(mode='initial'){
  const saved=arsenalState(),storage={...saved.storage},key='arsenal-arton-character-profiles-v1';
  let previous;try{previous=JSON.parse(storage[key]||'{}')}catch{previous={}}
  const profile=previous?.profiles?.find(item=>item.id==='ficha-ativa')||{id:'ficha-ativa',backpack:[]};
  profile.name=state.identity.characterName||'Personagem';profile.strength=finalAttrs().for;
  storage[key]=JSON.stringify({activeId:'ficha-ativa',profiles:[profile]});
  return{session:++arsenalSession,storage,choice:mode==='initial'&&!saved.complete?currentItemChoice():null,candidate:mode==='initial'&&!saved.complete?saved.pending:null,mode,funds:remainingFunds()};
}
function renderArsenal(){
  const saved=arsenalState(),choice=currentItemChoice(),title=saved.complete?'Itens adquiridos':choice?.title||'Equipamento inicial',note=saved.complete?'':(saved.choiceIndex+1)+'/'+initialItemPlan().length;
  const unresolved=saved.complete&&(saved.unresolved||[]).length?'<div class="warning-box" style="margin:10px 14px"><strong>Itens da origem que ainda exigem uma escolha:</strong><br>'+esc(saved.unresolved.join(' · '))+'</div>':'';
  const header=saved.complete?'':'<header class="panel-header"><h3 class="panel-title">'+esc(title)+'</h3><span class="panel-note">'+note+'</span></header>';
  return '<section class="panel arsenal-choice-panel">'+header+'<p class="help" id="arsenalStatus">Carregando os itens…</p><iframe id="characterArsenal" title="'+esc(saved.complete?'Itens adquiridos':'Escolha de equipamento inicial')+'" sandbox="allow-scripts" style="display:block;width:100%;height:85dvh;min-height:480px;border:0"></iframe>'+unresolved+'</section>';
}
const deferredBeforeArsenal=renderDeferred;
renderDeferred=function(type){return type==='items'?renderArsenal():deferredBeforeArsenal(type)};
const phaseBeforeArsenal=phaseIsComplete,missingBeforeArsenal=missingChoices,pendingBeforeArsenal=characterPendingChoices;
phaseIsComplete=function(step){return step===8?arsenalState().complete:phaseBeforeArsenal(step)};
missingChoices=function(step){return step===8&&!arsenalState().complete?[{title:'Equipamento inicial',message:'Conclua ou pule as escolhas de equipamento inicial.',selector:'.arsenal-choice-panel'}]:missingBeforeArsenal(step)};
characterPendingChoices=function(){const pending=pendingBeforeArsenal();if(!arsenalState().complete)pending.push({title:'Equipamento inicial',message:'Conclua a fase de itens iniciais.',selector:'[data-step="8"]'});return pending};
function syncInitialItemFooter(){
  if(state.step!==8)return;const saved=arsenalState();
  document.getElementById('nextButton').textContent=saved.complete?'Continuar →':saved.pending?'Confirmar escolha →':'Pular escolha →';
}
function finalizeInitialItems(){
  document.getElementById('nextButton').disabled=true;
  document.getElementById('characterArsenal')?.contentWindow?.postMessage({channel:'forja-arsenal-v1',session:arsenalSession,type:'finalize',automaticNames:automaticStartingItems()},'*');
}
function advanceInitialItemChoice(){
  const saved=arsenalState();saved.pending=null;saved.choiceIndex++;
  if(saved.choiceIndex>=initialItemPlan().length){finalizeInitialItems();return}
  renderStage();window.scrollTo({top:0,behavior:'smooth'});
}
const renderBeforeArsenal=renderStage;
renderStage=function(){
  renderBeforeArsenal();if(state.step!==8)arsenalShopOpen=false;document.body?.classList.toggle('arsenal-stage',state.step===8);
  let shopButton=document.getElementById('buyItemsButton');
  if(state.step===9){
    if(shopButton)shopButton.hidden=true;
    document.getElementById('nextButton').textContent=financesState().startingLevel>1&&Number(state.identity.plannedLevel)<20?'Avançar para o próximo nível':'Finalizar ficha';
    return;
  }else if(shopButton)shopButton.hidden=true;
  if(state.step!==8)return;
  const saved=arsenalState(),plan=initialItemPlan();
  if(saved.complete&&arsenalShopOpen){
    document.getElementById('stageTitle').textContent='Comprar itens';document.getElementById('stageDescription').textContent='Catálogo completo do Arsenal, ligado à mochila deste personagem.';document.getElementById('nextButton').disabled=true;
    document.getElementById('stageRoot').innerHTML='<section class="panel"><iframe id="characterShop" title="Catálogo completo do Arsenal" sandbox="allow-scripts" style="display:block;width:100%;height:85dvh;min-height:520px;border:0"></iframe></section>';
    document.getElementById('characterShop').srcdoc=DATA.arsenalShopHtml.replace('/*__ARSENAL_STATE__*/',()=>JSON.stringify(arsenalInitialData('shop')).replace(/</g,'\\u003c'));return;
  }
  if(!saved.complete&&saved.choiceIndex>=plan.length)saved.choiceIndex=Math.max(0,plan.length-1);
  document.getElementById('stageDescription').textContent='';document.getElementById('nextButton').disabled=false;syncInitialItemFooter();
  const frame=document.getElementById('characterArsenal');if(!frame)return;
  frame.srcdoc=DATA.arsenalHtml.replace('/*__ARSENAL_STATE__*/',()=>JSON.stringify(arsenalInitialData()).replace(/</g,'\\u003c'));
};
document.addEventListener('click',event=>{
  if(!event.target.closest?.('#nextButton'))return;
  if(state.step===9){
    event.preventDefault();event.stopImmediatePropagation();
    if(financesState().startingLevel>1&&Number(state.identity.plannedLevel)<20){state.identity.plannedLevel++;ensureProgression();persist();renderStage();toast('Personagem avançou para o nível '+state.identity.plannedLevel+'.')}else toast('Ficha finalizada e salva neste navegador.');
    return;
  }
  if(state.step!==8)return;
  event.preventDefault();event.stopImmediatePropagation();
  const saved=arsenalState();
  if(saved.complete){if(!state.completed.includes(8))state.completed.push(8);state.step=9;renderStage();window.scrollTo({top:0,behavior:'smooth'});return}
  if(saved.pending){
    const last=saved.choiceIndex>=initialItemPlan().length-1;
    document.getElementById('nextButton').disabled=true;
    document.getElementById('characterArsenal')?.contentWindow?.postMessage({channel:'forja-arsenal-v1',session:arsenalSession,type:'commit-choice',selection:saved.pending,finalize:last,automaticNames:last?automaticStartingItems():[]},'*')
  }
  else advanceInitialItemChoice();
},true);
window.addEventListener('message',event=>{
  const frame=document.getElementById('characterArsenal'),message=event.data;
  if(state.step!==8||!frame?.contentWindow||event.source!==frame.contentWindow||message?.channel!=='forja-arsenal-v1'||message.session!==arsenalSession)return;
  if(message.type==='ready'){document.getElementById('arsenalStatus').hidden=true;return}
  if(message.type==='open-shop'&&arsenalState().complete){arsenalShopOpen=true;renderStage();window.scrollTo({top:0,behavior:'smooth'});return}
  if(message.type==='candidate'){arsenalState().pending=message.itemId?{itemId:message.itemId,itemName:message.itemName,options:message.options||{}}:null;syncInitialItemFooter();return}
  if(message.type==='choice-committed'){
    const saved=arsenalState();saved.storage=message.storage||saved.storage;if(message.itemName&&!saved.grantedNames.includes(message.itemName))saved.grantedNames.push(message.itemName);document.getElementById('nextButton').disabled=false;persist();advanceInitialItemChoice();return;
  }
  if(message.type==='finalized'){
    const saved=arsenalState();saved.storage=message.storage||saved.storage;saved.grantedNames=[...new Set([...(saved.grantedNames||[]),...(message.granted||[])])];saved.unresolved=message.unresolved||[];saved.complete=true;saved.pending=null;
    document.getElementById('nextButton').disabled=false;if(!state.completed.includes(8))state.completed.push(8);persist();renderStage();window.scrollTo({top:0,behavior:'smooth'});return;
  }
  if(message.type==='save'&&message.storage&&typeof message.storage==='object'){arsenalState().storage=message.storage;persist()}
});
const summaryBeforeArsenal=renderSummary;
renderSummary=function(){
  const saved=arsenalState(),items=saved.grantedNames||[],unresolved=saved.unresolved||[];
  const finances=financesState(),funds=startingFunds(),money=finances.startingLevel===1?'<label class="field"><span>Tibares iniciais</span><input class="input" data-field="levelOneTibars" type="number" min="0" step="1" value="'+finances.levelOneTibars+'"></label>':'<div class="summary-card"><small>Dinheiro inicial · nível '+finances.startingLevel+'</small><strong>'+formatTibars(funds)+'</strong></div>';
  return summaryBeforeArsenal()+panel('Dinheiro inicial','<div class="grid two">'+money+'<div class="summary-card"><small>Saldo disponível</small><strong>'+formatTibars(remainingFunds())+'</strong></div></div>',finances.startingLevel===1?'Informe a quantidade de tibares definida para o personagem.':'Valor determinado pelo nível em que o personagem começou.')+panel('Mochila inicial','<div class="ability-list">'+(items.length?items.map(name=>abilityHtml({nome:name,descricao:'Item recebido durante a criação do personagem.'})).join(''):'<p class="help">Nenhum equipamento inicial foi registrado.</p>')+'</div>'+(unresolved.length?'<div class="warning-box" style="margin-top:10px"><strong>Itens da origem que ainda exigem uma escolha:</strong><br>'+esc(unresolved.join(' · '))+'</div>':''));
};
document.addEventListener('input',event=>{if(event.target.dataset.field==='levelOneTibars'){financesState().levelOneTibars=Math.max(0,Number(event.target.value)||0);persist();const panelBody=event.target.closest('.panel-body'),values=panelBody?.querySelectorAll('.summary-card strong');if(values?.length)values[values.length-1].textContent=formatTibars(remainingFunds())}},true);
document.addEventListener('change',event=>{if(event.target.dataset.field==='plannedLevel'&&state.step===1)renderStage()},true);
window.addEventListener('message',event=>{
  const frame=document.getElementById('characterShop'),message=event.data;
  if(state.step!==8||!arsenalShopOpen||!frame?.contentWindow||event.source!==frame.contentWindow||message?.channel!=='forja-arsenal-v1'||message.session!==arsenalSession)return;
  if(message.type==='close-shop'){arsenalShopOpen=false;renderStage();window.scrollTo({top:0,behavior:'smooth'});return}
  if(message.type==='purchase-request'){
    const total=Math.max(0,Number(message.total)||0),gift=total>remainingFunds();if(!gift)financesState().spent+=total;persist();
    frame.contentWindow.postMessage({channel:'forja-arsenal-v1',session:arsenalSession,type:'purchase-approved',total,gift},'*');return;
  }
  if(message.type==='purchase-complete'){arsenalState().storage=message.storage||arsenalState().storage;persist();renderStage();return}
  if(message.type==='save'&&message.storage){arsenalState().storage=message.storage;persist()}
});
