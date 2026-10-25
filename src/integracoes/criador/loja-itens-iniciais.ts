
function consolidateInventoryEntries(backpack){
  if (!Array.isArray(backpack) || backpack.length === 0) return backpack || [];
  const catalog = typeof getEquipmentCatalog === 'function' ? getEquipmentCatalog() : (typeof getPdfItemsCatalog === 'function' ? getPdfItemsCatalog() : new Map());
  const isWeaponEntry = (e) => {
    if (!e) return false;
    if (e.isEngenhoca || e.contraptionId) return false;
    const it = catalog.get ? catalog.get(e.itemId) : null;
    return e.tipo === 'arma' || it?.tipo === 'arma' || Boolean(it?.arma);
  };

  const weapons = [];
  const otherItems = [];
  const usedWeaponIds = new Set();
  for (const entry of backpack) {
    if (!entry) continue;
    if (isWeaponEntry(entry)) {
      const qty = Math.max(1, Number(entry.quantity) || 1);
      for (let q = 0; q < qty; q++) {
        let instId = (q === 0 && entry.instanceId && !usedWeaponIds.has(entry.instanceId)) ? entry.instanceId : null;
        if (!instId) {
          instId = (entry.instanceId ? `${entry.instanceId}_sub_${q}` : null) || ('inst_wep_' + (entry.itemId || 'weapon') + '_' + (entry.acquisition?.operationId || entry.acquisition?.grantId || 'base') + '_' + q);
        }
        usedWeaponIds.add(instId);
        weapons.push({
          ...entry,
          instanceId: instId,
          quantity: 1
        });
      }
    } else {
      otherItems.push(entry);
    }
  }

  const consolidatedOther = RegrasInventario.consolidar(otherItems);
  return [...weapons, ...consolidatedOther];
}
function inventoryProfile(){
  const saved=arsenalState();let profiles;
  try{profiles=JSON.parse(saved.storage[ARSENAL_PROFILES_KEY]||'{}')}catch{profiles={}}
  let profile=profiles.profiles?.find(item=>item.id==='ficha-ativa')||profiles.profiles?.find(item=>item.id===profiles.activeId);
  if(!profile){let legacy=[];try{legacy=JSON.parse(saved.storage['arsenal-arton-backpack-v1']||'[]')}catch{}profile={id:'ficha-ativa',backpack:Array.isArray(legacy)?legacy:[]}}
  if(Array.isArray(profile.backpack)){
    profile.backpack.forEach(entry=>{
      if(!entry)return;
      if(/traje_de_viaj/i.test(entry.itemId)||/traje_de_viaj/i.test(entry.displayName)||/traje_de_viaj/i.test(entry.itemName)){
        entry.itemId='traje_de_viajante';
        entry.itemName='Traje de Viajante';
        entry.displayName='Traje de Viajante';
      }
    });
  }
  const beforeJson = JSON.stringify(profile.backpack || []);
  const seenGrants=new Set();
  profile.backpack=(profile.backpack||[]).filter(item=>{
    const grant=item.acquisition?.grantId;
    if(!grant)return true;
    if(item.acquisition?.source !== 'initial')return true;
    if(seenGrants.has(grant))return false;
    seenGrants.add(grant);
    for(const extra of item.acquisition?.additionalGrantIds||[])seenGrants.add(extra);
    return true;
  });
  profile.backpack=consolidateInventoryEntries(profile.backpack);
  const afterJson = JSON.stringify(profile.backpack || []);
  if(beforeJson !== afterJson && profiles.profiles){const index=profiles.profiles.findIndex(item=>item.id===profile.id);if(index>=0)profiles.profiles[index]=profile;saved.storage[ARSENAL_PROFILES_KEY]=JSON.stringify(profiles)}
  const eq=typeof equipmentState==='function'?equipmentState():{},catalog=typeof getEquipmentCatalog==='function'?getEquipmentCatalog():new Map();
  const wornTypes=(profile.backpack||[]).flatMap((e,i)=>(eq.wornIds||[]).some(id=>matchEquipmentEntry(e,i,id))?[RegrasMochilas.tipoMochila(e.itemId,catalog.get(e.itemId)?.nome||e.itemName||'')]:[]);
  const backpackBenefits=RegrasMochilas.beneficiosMochilas(wornTypes,typeof poderesCarga==='function'?poderesCarga():[],finalAttrs());
  const strengthAttr=backpackBenefits.valor;
  const userContraptions = Array.isArray(state.contraptions) ? state.contraptions : (Array.isArray(profile.contraptions) ? profile.contraptions : []);
  const tpeelBonus = (typeof hasFamiliarElementalPower === 'function' && hasFamiliarElementalPower() && typeof getSelectedElementalFamiliarId === 'function' && getSelectedElementalFamiliarId() === 'tpeel') ? 2 : 0;
  return {...profile,id:'ficha-ativa',name:state.identity.characterName||'Personagem',strength:strengthAttr,capacityBonus:suraggelCarryingBonus()+backpackBenefits.bonus+bonusPoderesCarga()+tpeelBonus,contraptions:userContraptions};
}
function characterInventory(){return inventoryProfile().backpack||[]}
function craftingCapabilities(){
  const trainedOffices=typeof allTrainedOffices==='function'?allTrainedOffices():[];
  const trained=trainedOffices.length>0;
  const level = Number(state.identity?.plannedLevel) || Number(state.identity?.initialLevel) || (typeof effectiveCharacterLevel === 'function' ? effectiveCharacterLevel() : Math.max(1, (state.progression?.length || 0)));
  const powers=(state.progression||[]).map(row=>row.powerId).filter(Boolean);
  const text=slug(raceAbilityText()+' '+classAbilityText()+' '+(state.progression||[]).map(row=>progressionPowerById(row.powerId)?.descricao||'').join(' ')).replace(/_/g,' ');
  const inventorLevel = typeof characterClassLevel === 'function'
    ? characterClassLevel('inventor')
    : ((state.identity?.classId === 'inventor' ? 1 : 0) + (state.progression || []).filter((row, idx) => (idx > 0 || state.identity?.classId !== 'inventor') && row.classId === 'inventor').length);
  const hasInventorClass = inventorLevel > 0;
  const hasSuperiorPower=powers.includes('inventor_fabricar_item_superior')||/fabricar.*superior/.test(text);
  const effImpLevel = hasSuperiorPower ? Math.max(level, inventorLevel) : inventorLevel;
  let improvements=0;
  if(hasSuperiorPower || inventorLevel >= 2){
    if(effImpLevel>=11)improvements=4;
    else if(effImpLevel>=8)improvements=3;
    else if(effImpLevel>=5)improvements=2;
    else if(effImpLevel>=2)improvements=1;
  }
  const hasMagicPower=powers.includes('inventor_fabricar_item_magico')||/fabricar.*item.*magico/.test(text);
  const effMagicLevel = hasMagicPower ? Math.max(level, inventorLevel) : inventorLevel;
  let magic = 0;
  if (hasMagicPower || inventorLevel >= 9) {
    if (effMagicLevel >= 17) magic = 3;
    else if (effMagicLevel >= 13) magic = 2;
    else if (effMagicLevel >= 9) magic = 1;
  }
  const hasAlquimistaIniciado=powers.includes('inventor_alquimista_iniciado')||/alquimista iniciado/.test(text);
  const hasPrepararPocao=powers.includes('preparar_pocao')||/preparar po[cç][aã]o/.test(text);
  const hasCaldeiraoBruxo=powers.includes('arcanista_caldeirao_do_bruxo')||/caldeir[aã]o do bruxo/.test(text);
  let potionMaxCircle=0;
  if(hasCaldeiraoBruxo&&hasPrepararPocao)potionMaxCircle=5;
  else if(hasPrepararPocao||hasCaldeiraoBruxo||hasAlquimistaIniciado)potionMaxCircle=2;
  const hasEscreverPergaminho=powers.includes('escrever_pergaminho')||/escrever pergaminho/.test(text);
  return{
    enabled:trained,
    improvements,
    magic,
    inventorLevel,
    hasInventorClass,
    hasSuperiorPower,
    isInventor: inventorLevel > 0,
    hasSuperiorCrafting: text.includes('fabricar item superior') || powers.includes('fabricar_item_superior') || inventorLevel >= 2,
    hasMagicCrafting: text.includes('fabricar item magico') || powers.includes('fabricar_item_magico') || inventorLevel >= 9,
    isDrogadora: typeof hasAprendizDeDrogadora === 'function' ? hasAprendizDeDrogadora() : false
  };
}
function currentItemChoice(){
  return initialItemPlan()[arsenalState().choiceIndex]||null;
}
function isSimpleChoice(){
  return currentItemChoice()?.id==='simple';
}
function arsenalInitialData(mode){
  const saved=arsenalState(),profile=inventoryProfile(),storage={...saved.storage};
  storage[ARSENAL_PROFILES_KEY]=JSON.stringify({activeId:'ficha-ativa',profiles:[profile]});
  mode=mode||(state.sheetView==='workshop'?'workshop':(saved.complete?(arsenalShopOpen?'shop':'backpack'):'initial'));
  const lvl = Number(state.identity?.plannedLevel) || Number(state.identity?.initialLevel) || (typeof effectiveCharacterLevel === 'function' ? effectiveCharacterLevel() : Math.max(1, (state.progression?.length || 0)));
  const attrs = typeof finalAttrs === 'function' ? finalAttrs() : { int: 0 };
  const intMod = Number(attrs.int) || 0;
  const halfLevel = Math.floor(lvl / 2);
  const trainedList = typeof allTrainedOffices === 'function' ? allTrainedOffices() : [];
  const isTrained = trainedList.length > 0 || (typeof allTrainedSkills === 'function' && allTrainedSkills().includes('oficio'));
  const trainBonus = isTrained ? (lvl >= 15 ? 6 : (lvl >= 7 ? 4 : 2)) : 0;
  const craftSkillBonus = halfLevel + intMod + trainBonus;
  return{
    session:arsenalSession,storage,choice:mode==='initial'?currentItemChoice():null,candidate:mode==='initial'?saved.pending:null,
    mode,workshopSection:mode==='workshop'?(state.workshopSection||'artesao'):undefined,
    workshopReadOnly:mode==='workshop'?Boolean(state.workshopReadOnly):undefined,
    funds:remainingFunds(),startingLevel:financesState().startingLevel,startingMoney:startingFunds(),
    isRewardMode: Boolean(state.isRewardShopMode || mode === 'reward'),
    strength:profile.strength,capacityBonus:profile.capacityBonus||0,characterName:profile.name,
    crafting:craftingCapabilities(),trainedOffices:trainedList,
    craftSkillBonus,level:lvl,intMod,
    pv:typeof progressionStats==='function'?progressionStats().pv:20,
    hasAparatoPersonalizado: Boolean(
      (Array.isArray(state.progression) && state.progression.some(row => row.powerId === 'inventor_aparato_personalizado')) ||
      (Array.isArray(profile.classPowers) && profile.classPowers.includes('inventor_aparato_personalizado')) ||
      profile.hasAparatoPersonalizado
    ),
    contraptions:profile.contraptions||[]
  };
}
function renderPhase8BackpackView(){
  const catalog = typeof getEquipmentCatalog === 'function' ? getEquipmentCatalog() : (typeof catalogMap === 'function' ? catalogMap() : new Map());
  const inventory = characterInventory();
  const itemName = entry => {
    if(!entry) return '';
    if(entry.displayName) return entry.displayName;
    if(entry.options?.customName) return entry.options.customName;
    if(entry.itemName) return entry.itemName;
    const cat = catalog.get(entry.itemId);
    if(cat?.nome) return cat.nome;
    return String(entry.itemId||'').replace(/_/g,' ');
  };

  const backpackRows = inventory.length
    ? inventory.map((entry, i) => {
        const item = catalog.get(entry.itemId);
        const id = typeof equipEntryId === 'function' ? equipEntryId(entry, i) : `entry_${i}`;
        const qty = Number(entry.quantity || 1);
        const isEngenhoca = Boolean(entry?.isEngenhoca || entry?.contraptionId || item?.tipo === 'engenhoca' || /engenhoca/i.test(entry?.itemId || '') || entry?.origem === 'engenhoca');
        const attached = entry?.attachedItem || entry?.engenhocaInfo?.attachedItem || item?.attachedItem || item?.engenhocaInfo?.attachedItem;
        const spaces = attached
          ? ((attached.espacos != null ? Number(attached.espacos) : 0) + 1)
          : Number(entry?.espacos ?? item?.espacos ?? (isEngenhoca ? 1 : 0));
        const isArmadura = !isEngenhoca && item?.tipo === 'armadura';
        const isEstragado = Boolean(entry?.estragado || entry?.isDamaged || entry?.damaged || /estragad/i.test(entry?.displayName || entry?.itemName || item?.nome || ''));

        const isExpanded = (typeof expandedSheetItemId !== 'undefined' && expandedSheetItemId === id) || (typeof window !== 'undefined' && window.expandedSheetItemId === id);
        const detailHtml = (isExpanded && typeof inlineDetails === 'function')
          ? inlineDetails(entry, item)
          : (isExpanded && typeof window !== 'undefined' && typeof window.inlineDetails === 'function' ? window.inlineDetails(entry, item) : '');

        const getIcon = (name: string) => window.IconesForja ? window.IconesForja.get(name, 'icon-sm') : '';

        return `<div class="backpack-compact-entry ${isExpanded ? 'is-expanded' : ''}" data-instance-id="${esc(id)}">
          <div class="backpack-compact-row" data-item-details="${esc(id)}" tabindex="0" role="button" title="Abrir detalhes de ${esc(itemName(entry))}">
            <button class="compact-open-button" type="button" data-item-details="${esc(id)}" title="Abrir detalhes de ${esc(itemName(entry))}">
              <strong class="compact-item-title">${esc(itemName(entry))}${isEstragado ? ' <span class="tag red" style="font-size:0.56rem;padding:1px 4px;margin-left:4px;border:1px solid #ef4444;background:rgba(239,68,68,0.15);color:#fca5a5;">Estragado (-5)</span>' : ''}</strong>
            </button>
            <span class="compact-metric metric-quantity"><small>QTD.</small><strong>${qty}</strong></span>
            <span class="compact-metric metric-spaces"><small>ESPAÇOS</small><strong>${spaces}</strong></span>
          </div>
          ${detailHtml ? `<div class="compact-detail">${detailHtml}</div>` : ''}
        </div>`;
      }).join('')
    : '<p class="help" style="padding:14px;grid-column:1/-1">Nenhum item guardado na mochila.</p>';

  const moneyAndLoad = typeof sheetMoneyAndLoad === 'function' ? sheetMoneyAndLoad() : '';

  return `
    <section class="panel arsenal-choice-panel">
      <div class="sheet-equipment-backpack" style="margin-top:0;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;border-bottom:1px solid var(--border);padding-bottom:8px;">
          <h3 style="margin:0;font-family:Cinzel,serif;font-size:1rem;color:var(--gold2);">Mochila do Herói</h3>
          <span style="font-size:0.75rem;color:var(--text-muted);">Todos os itens do inventário</span>
        </div>
        ${moneyAndLoad}
        <div class="sheet-backpack-grid sheet-general-backpack-list list-mode" style="margin-top:10px;">
          ${backpackRows}
        </div>
      </div>
    </section>
  `;
}
function renderArsenal(){
  const saved=arsenalState();
  if(saved.complete){
    return renderPhase8BackpackView();
  }
  const title=currentItemChoice()?.title||'Equipamento inicial';
  return '<section class="panel arsenal-choice-panel"><header class="panel-header" id="arsenalPanelHeader"><h3 class="panel-title" id="arsenalPanelTitle">'+esc(title)+'</h3></header><p class="help" id="arsenalStatus">Carregando os itens…</p><iframe id="characterArsenal" title="'+esc(title)+'" sandbox="allow-scripts" style="display:block;width:100%;height:85dvh;min-height:480px;border:0"></iframe><div id="arsenalUnresolved"></div></section>';
}
const deferredBeforeArsenal=renderDeferred;
renderDeferred=function(type){return type==='items'?renderArsenal():deferredBeforeArsenal(type)};
const phaseBeforeArsenal=phaseIsComplete,missingBeforeArsenal=missingChoices,pendingBeforeArsenal=characterPendingChoices;
phaseIsComplete=function(step){return step===8?arsenalState().complete:phaseBeforeArsenal(step)};
missingChoices=function(step){return step===8&&!arsenalState().complete?[{title:'Equipamento inicial',message:'Conclua ou pule as escolhas de equipamento inicial.',selector:'.arsenal-choice-panel'}]:missingBeforeArsenal(step)};
characterPendingChoices=function(){const pending=pendingBeforeArsenal();if(!arsenalState().complete)pending.push({title:'Equipamento inicial',message:'Conclua a fase de itens iniciais.',selector:'[data-step="8"]',step:8});return pending};
function sendArsenal(type,details={}){document.getElementById('characterArsenal')?.contentWindow?.postMessage({channel:'forja-arsenal-v1',session:arsenalSession,type,...details},'*')}
function syncInitialItemFooter(){
  if(state.step!==8)return;
  const saved=arsenalState(),choice=currentItemChoice(),title=saved.complete?'Itens adquiridos':choice?.title||'Equipamento inicial';
  const redoBtn=document.getElementById('redoInitialItemsButton');
  if(redoBtn)redoBtn.hidden=Boolean(state.isLevelingUp);
  const nextBtn=document.getElementById('nextButton');
  const stepPrev=document.getElementById('stepPrevButton');
  const stepNext=document.getElementById('stepNextButton');
  const previous=document.getElementById('previousButton');
  const plan=typeof initialItemPlan==='function'?initialItemPlan():[];
  if(previous){
    if(state.isLevelingUp){
      const hasSpells = typeof characterHasSpellChoices === 'function' && characterHasSpellChoices();
      previous.textContent = hasSpells ? '← Voltar para Magias' : '← Voltar para Poderes de Classe';
      previous.hidden = false;
      previous.disabled = false;
    } else {
      const previousStep=[7,6,5,4,3,2,1].find(step=>!(typeof shouldSkipPhase==='function'&&shouldSkipPhase(step)));
      previous.textContent='← Voltar para '+(PHASES[previousStep-1]?.[0]||'etapa anterior');
    }
  }
  if(stepPrev)stepPrev.textContent='← Escolha anterior';
  if(redoBtn)redoBtn.classList.add('danger');

  if(saved.complete){
    const skipRemaining = typeof shouldSkipPhase === 'function' && shouldSkipPhase(9) && shouldSkipPhase(10);
    if(nextBtn){
      nextBtn.textContent=state.isLevelingUp ? 'Avançar →' : (skipRemaining ? 'Finalizar ficha' : 'Avançar →');
      nextBtn.classList.remove('is-incomplete');
      nextBtn.disabled=false;
    }
    if(stepPrev)stepPrev.hidden=true;
    if(stepNext)stepNext.hidden=true;
    const skipSimpleBtn = document.getElementById('skipSimpleChoiceBtn');
    if(skipSimpleBtn) skipSimpleBtn.hidden = true;
    const buyMoreBtn = document.getElementById('buyMoreItemsBtn');
    if(buyMoreBtn) buyMoreBtn.remove();
    if(nextBtn)nextBtn.hidden=false;
  }else{
    const buyMoreBtn = document.getElementById('buyMoreItemsBtn');
    if(buyMoreBtn) buyMoreBtn.remove();
    const candidateValid=Boolean(saved.pending&&!(saved.pending.itemId==='instrumentos_de_oficio'&&!String(saved.pending.options?.oficio||'').trim()));
    const hasCandidate=candidateValid;
    if(nextBtn){
      nextBtn.textContent='Confirmar escolha →';
      nextBtn.disabled=!hasCandidate;
      nextBtn.classList.toggle('is-incomplete',!hasCandidate);
      nextBtn.hidden=false;
    }
    const isSkippableWeapon=choice?.id==='simple'||choice?.id==='martial';
    let skipSimpleBtn = document.getElementById('skipSimpleChoiceBtn');
    if(!skipSimpleBtn && nextBtn?.parentNode){
      skipSimpleBtn = document.createElement('button');
      skipSimpleBtn.id = 'skipSimpleChoiceBtn';
      skipSimpleBtn.type = 'button';
      skipSimpleBtn.className = 'button secondary-button';
      skipSimpleBtn.textContent = 'Pular escolha →';
      skipSimpleBtn.style.marginRight = '8px';
      skipSimpleBtn.addEventListener('click', () => commitOrAdvanceCurrentChoice(true));
      nextBtn.parentNode.insertBefore(skipSimpleBtn, nextBtn);
    }
    if(skipSimpleBtn){
      skipSimpleBtn.hidden = !isSkippableWeapon;
    }

    if(plan.length<=1){
      if(stepPrev)stepPrev.hidden=true;
      if(stepNext)stepNext.hidden=true;
    }else{
      if(stepPrev){
        stepPrev.hidden=false;
        stepPrev.disabled=saved.choiceIndex<=0;
      }
      if(stepNext){
        stepNext.hidden=true;
      }
    }
  }
  if(typeof syncPhaseStepNavigation==='function')syncPhaseStepNavigation();
  if(typeof syncPendingOrFinishButton==='function')syncPendingOrFinishButton();
  if(stepNext)stepNext.hidden=true;
  const stageTitle=document.getElementById('stageTitle');
  if(stageTitle)stageTitle.textContent=saved.complete?title:'Itens iniciais';
  const stageDesc=document.getElementById('stageDescription');
  if(stageDesc)stageDesc.textContent='';
  const panelHeader=document.getElementById('arsenalPanelHeader');
  if(panelHeader)panelHeader.hidden=saved.complete;
  const panelTitle=document.getElementById('arsenalPanelTitle');
  if(panelTitle)panelTitle.textContent=title;
  const unresolved=document.getElementById('arsenalUnresolved');
  if(unresolved)unresolved.innerHTML=saved.unresolved?.length?'<div class="warning-box"><strong>Itens que exigem uma escolha:</strong><br>'+esc(saved.unresolved.join(' · '))+'</div>':'';
}
function unclaimedAutomaticGrants(){const saved=arsenalState();return automaticStartingGrants().filter(grant=>!saved.grants[grant.id])}
function finalizeInitialItems(){document.getElementById('nextButton').disabled=true;sendArsenal('finalize',{operationId:'finalize:'+arsenalState().ruleSignature,automaticGrants:unclaimedAutomaticGrants(),finalize:true})}
function advanceInitialItemChoice(){const saved=arsenalState();saved.pending=null;saved.choiceIndex++;if(!currentItemChoice())finalizeInitialItems();else{persistNow();renderStage()}}
async function commitOrAdvanceCurrentChoice(skipChoice = false){
  const saved=arsenalState(),choice=currentItemChoice();
  if(!choice){finalizeInitialItems();return}
  const plan=typeof initialItemPlan==='function'?initialItemPlan():[];
  const grantId=itemChoiceGrantId(choice);
  const remaining=plan.slice(saved.choiceIndex+1);
  const last=remaining.length===0 || remaining.every(item=>saved.grants[itemChoiceGrantId(item)]);

  if(skipChoice || (!saved.pending && (choice.id==='simple' || choice.id==='martial'))){
    sendArsenal('close-modal',{});
    saved.grants[grantId]=true;
    if(last){
      finalizeInitialItems();
    }else{
      advanceInitialItemChoice();
    }
    return;
  }

  if(saved.pending){
    if(saved.pending.itemId==='instrumentos_de_oficio'&&!String(saved.pending.options?.oficio||'').trim()){
      toast('Escolha a especialização de Ofício para os Instrumentos de Ofício antes de confirmar.','warning');
      return;
    }
    const hasUnlimitedBudget = Boolean(choice.unlimitedBudget || choice.maxBudget === Infinity);
    if(choice.isBudgetGrant && !hasUnlimitedBudget && choice.maxBudget && Number.isFinite(Number(choice.maxBudget))){
      const maxBudget = Number(choice.maxBudget);
      const spent = Number(saved.pending.unitValue || 0);
      saved.budgetConfirmed = saved.budgetConfirmed || {};
      if(spent > maxBudget){
        const diff = spent - maxBudget;
        const currentFunds = remainingFunds();
        if(currentFunds < diff){
          toast('O item excede o orçamento em ' + (typeof formatCurrencyValue === 'function' ? formatCurrencyValue(diff, 'T$') : ('T$ ' + diff)) + ' e você não possui dinheiro inicial suficiente.', 'warning');
          return;
        }
        const formattedSpent = typeof formatCurrencyValue === 'function' ? formatCurrencyValue(spent, 'T$') : ('T$ ' + spent);
        const formattedMax = typeof formatCurrencyValue === 'function' ? formatCurrencyValue(maxBudget, 'T$') : ('T$ ' + maxBudget);
        const formattedDiff = typeof formatCurrencyValue === 'function' ? formatCurrencyValue(diff, 'T$') : ('T$ ' + diff);
        const decision = await forjaDecision(
          'O item escolhido custa ' + formattedSpent + ', excedendo seu orçamento de ' + formattedMax + ' em ' + formattedDiff + '.\n\nCom a permissão do mestre, você pode pagar a diferença com o seu dinheiro inicial.\n\nDeseja pagar a diferença de ' + formattedDiff + ' e confirmar esta escolha?',
          [
            { value: 'choose-other', label: 'Fazer nova escolha' },
            { value: 'confirm', label: 'Pagar diferença e confirmar', primary: true }
          ],
          'Excesso de Orçamento (Permissão do Mestre)'
        );
        if(decision !== 'confirm'){
          return;
        }
        financesState().spent = Math.round(((financesState().spent || 0) + diff) * 100) / 100;
        persistNow();
      } else if(spent < 0.8 * maxBudget && !saved.budgetConfirmed[grantId]){
        const formattedSpent = typeof formatCurrencyValue === 'function' ? formatCurrencyValue(spent, 'T$') : ('T$ ' + spent);
        const formattedMax = typeof formatCurrencyValue === 'function' ? formatCurrencyValue(maxBudget, 'T$') : ('T$ ' + maxBudget);
        const decision = await forjaDecision(
          'Você escolheu um item de ' + formattedSpent + ' de um orçamento de até ' + formattedMax + '. Você pode escolher um item de valor superior ou adicionar melhorias no item.\n\nDeseja confirmar esta escolha ou fazer uma nova escolha?',
          [
            { value: 'choose-other', label: 'Fazer nova escolha' },
            { value: 'confirm', label: 'Confirmar escolha', primary: true }
          ],
          'Orçamento não utilizado totalmente'
        );
        if(decision !== 'confirm'){
          return;
        }
        saved.budgetConfirmed[grantId] = true;
      }
    }

    const nextBtn=document.getElementById('nextButton');
    if(nextBtn)nextBtn.disabled=true;
    const stepNextBtn=document.getElementById('stepNextButton');
    if(stepNextBtn)stepNextBtn.disabled=true;
    setTimeout(()=>{
      const btnN=document.getElementById('nextButton');if(btnN&&state.step===8)btnN.disabled=false;
      const btnS=document.getElementById('stepNextButton');if(btnS&&state.step===8)btnS.disabled=false;
    },40);

    delete saved.operations[grantId];
    sendArsenal('close-modal',{});
    sendArsenal('commit-choice',{
      operationId:grantId,
      grantId,
      source:choice.source||'initial',
      selection:saved.pending,
      finalize:last,
      automaticGrants:last?unclaimedAutomaticGrants():[]
    });
  }else{
    toast('Esta escolha é obrigatória. Selecione um item no catálogo antes de avançar.','warning');
  }
}
function redoInitialItems(){
  const saved=arsenalState();
  const emptyStorage={};
  const emptyProfiles={activeId:'ficha-ativa',profiles:[{id:'ficha-ativa',backpack:[]}]};
  emptyStorage[ARSENAL_PROFILES_KEY]=JSON.stringify(emptyProfiles);
  emptyStorage['arsenal-arton-backpack-v1']='[]';
  saved.storage=emptyStorage;
  saved.grants={};
  saved.operations={};
  saved.choiceIndex=0;saved.pending=null;saved.complete=false;saved.unresolved=[];arsenalShopOpen=false;
  state.completed=state.completed.filter(step=>step!==8);
  if(state.finances)state.finances.spent=0;
  if(typeof equipmentState==='function'){
    const eq=equipmentState();
    if(eq){eq.armorId=null;eq.shieldId=null;eq.weaponId=null;eq.trailerId=null;eq.backpackId=null;eq.wornIds=[];eq.equipped={};eq.weapons=[]}
  }
  arsenalContextKey='';
  const context=arsenalInitialData('initial');
  sendArsenal('reset-backpack',{storage:emptyStorage,context});
  const nextBtn=document.getElementById('nextButton');
  if(nextBtn)nextBtn.disabled=false;
  if(persistNow()){toast('Mochila esvaziada. Você pode refazer todas as escolhas de equipamento inicial.');renderStage()}
}


function acceptArsenalOperation(message){
  const original=arsenalState(),finances=financesState();
  const tx=OperacoesLoja.preparar(original,finances,state.completed,message,remainingFunds(),ARSENAL_PROFILES_KEY);
  if(tx.status==='invalid'){sendArsenal('operation-result',{operationId:message.operationId,ok:false});return}
  if(tx.status==='repeated'){
    if(original.grants?.[message.operationId] && !original.complete && message.kind==='initial'){
      original.pending = null;
      original.choiceIndex++;
      persistNow();
      if(typeof renderStage==='function')renderStage();
    }
    sendArsenal('operation-result',{...tx.result,operationId:message.operationId,ok:true,storage:original.storage,context:arsenalInitialData()});
    syncInitialItemFooter();
    return;
  }
  const beforeCompleted=state.completed;
  state.arsenal=tx.arsenal;state.finances=tx.finances;state.completed=tx.completed;
  if(!persistNow()){
    state.arsenal=original;state.finances=finances;state.completed=beforeCompleted;
    sendArsenal('operation-result',{operationId:message.operationId,ok:false});
    const next=document.getElementById('nextButton');if(next)next.disabled=false;return;
  }
  if(message.kind==='purchase'||message.kind==='craft'){
    if(message.kind==='purchase') arsenalShopOpen=false;
    const debit = Math.max(0, Number(tx.result?.total) || 0);
    if(!tx.result?.gift && debit > 0 && typeof registrarDespesaAventura === 'function'){
      registrarDespesaAventura(debit);
    }
    if(state.finished&&typeof saveFinishedCharacter==='function') saveFinishedCharacter();
  }
  sendArsenal('operation-result',{...tx.result,operationId:message.operationId,ok:true,storage:tx.arsenal.storage,context:arsenalInitialData()});
  syncInitialItemFooter();
  if(typeof renderStage==='function')renderStage();
}

document.addEventListener('click',async event=>{
  if(state.step!==8)return;
  if(event.target.closest?.('#redoInitialItemsButton')){
    event.preventDefault();event.stopImmediatePropagation();
    const inventory = typeof characterInventory === 'function' ? characterInventory() : [];
    const hasModifications = inventory.some(it => it.customPrice || it.improvements?.length || it.enchantments?.length || it.origem === 'shop' || it.origem === 'taverna' || it.origem === 'recompensa') || Number(state.finances?.spent || 0) > 0 || inventory.length > 0;
    let message = 'Você poderá escolher novamente todo o equipamento inicial. A mochila será esvaziada para refazer as escolhas na ordem correta.';
    if (hasModifications) {
      message = 'Você fez alterações na mochila ou comprou itens. Ao clicar em refazer escolhas, todos os itens da mochila serão apagados e repostos como se a ficha tivesse sido refeita do zero. Se você quiser manter algum item, anote-o e resgate-o como recompensa depois. Deseja continuar?';
    }
    if(await forjaConfirm(message, 'Sim, refazer escolhas')) redoInitialItems();
    return;
  }
function removeGrantFromBackpack(grantId){
  if(!grantId)return;
  const saved=arsenalState();
  if(!saved.storage)return;
  let profiles;
  try{profiles=JSON.parse(saved.storage[ARSENAL_PROFILES_KEY]||'{}')}catch{profiles={}}
  let profile=profiles.profiles?.find(item=>item.id==='ficha-ativa')||profiles.profiles?.find(item=>item.id===profiles.activeId);
  if(profile&&Array.isArray(profile.backpack)){
    profile.backpack=profile.backpack.filter(item=>{
      const g=item.acquisition?.grantId;
      if(!g)return true;
      if(g===grantId||g.startsWith(grantId+':'))return false;
      if(Array.isArray(item.acquisition?.additionalGrantIds)&&item.acquisition.additionalGrantIds.includes(grantId)){
        item.acquisition.additionalGrantIds=item.acquisition.additionalGrantIds.filter(id=>id!==grantId);
      }
      return true;
    });
    saved.storage[ARSENAL_PROFILES_KEY]=JSON.stringify(profiles);
  }
  try{
    let legacy=JSON.parse(saved.storage['arsenal-arton-backpack-v1']||'[]');
    if(Array.isArray(legacy)){
      legacy=legacy.filter(item=>{
        const g=item.acquisition?.grantId;
        if(!g)return true;
        return g!==grantId&&!g.startsWith(grantId+':');
      });
      saved.storage['arsenal-arton-backpack-v1']=JSON.stringify(legacy);
    }
  }catch{}
}

  const stepPrev=event.target.closest?.('#stepPrevButton');
  if(stepPrev){
    event.preventDefault();event.stopImmediatePropagation();
    const saved=arsenalState();
    if(saved&&saved.choiceIndex>0){
      const prevIndex=saved.choiceIndex-1;
      const plan=typeof initialItemPlan==='function'?initialItemPlan():[];
      const prevChoice=plan[prevIndex];
      if(prevChoice){
        const prevGrantId=itemChoiceGrantId(prevChoice);
        if(saved.grants){
          delete saved.grants[prevGrantId];
        }
        removeGrantFromBackpack(prevGrantId);
      }
      saved.choiceIndex=prevIndex;
      saved.pending=null;
      saved.complete=false;
      arsenalContextKey='';
      persistNow();
      renderStage();
      const ctx=arsenalInitialData('initial');
      sendArsenal('context',{context:ctx});
      sendArsenal('reset-backpack',{storage:saved.storage,context:ctx});
    }
    return;
  }
  const skipSimple=event.target.closest?.('#skipSimpleChoiceBtn');
  if(skipSimple){
    event.preventDefault();event.stopImmediatePropagation();
    commitOrAdvanceCurrentChoice(true);
    return;
  }
  const stepNext=event.target.closest?.('#stepNextButton');
  if(stepNext){
    event.preventDefault();event.stopImmediatePropagation();
    commitOrAdvanceCurrentChoice();
    return;
  }
  const nextBtn=event.target.closest?.('#nextButton');
  if(nextBtn){
    if(state.step!==8)return;
    event.preventDefault();event.stopImmediatePropagation();
    const saved=arsenalState();
    if(saved.complete){
      if(!state.completed.includes(8))state.completed.push(8);
      if(state.isLevelingUp){
        const nextPending = typeof getNextLevelUpPendingPhase === 'function' ? getNextLevelUpPendingPhase() : null;
        if(nextPending && nextPending > 8){
          state.step = nextPending;
          renderStage();window.scrollTo({top:0,behavior:'smooth'});
          return;
        }
        if(typeof finishCharacterCreation === 'function') finishCharacterCreation();
        return;
      }
      const skipRemaining = typeof shouldSkipPhase === 'function' && shouldSkipPhase(9) && shouldSkipPhase(10);
      if(skipRemaining){
        if(!state.completed.includes(9)) state.completed.push(9);
        if(!state.completed.includes(10)) state.completed.push(10);
        if(typeof finishCharacterCreation === 'function') finishCharacterCreation();
        else {
          state.finished = true;
          state.step = 8;
          state.sheetView = 'sheet';
          if(typeof saveFinishedCharacter === 'function') saveFinishedCharacter();
          persistNow();
          renderStage();
          window.scrollTo({top:0,behavior:'smooth'});
        }
        return;
      }
      let targetStep = 9;
      if(typeof shouldSkipPhase === 'function' && shouldSkipPhase(9)){
        targetStep = 10;
      }
      state.step=typeof nextIncompletePhase==='function'?nextIncompletePhase(8):targetStep;
      renderStage();window.scrollTo({top:0,behavior:'smooth'});
      return;
    }
    commitOrAdvanceCurrentChoice();
    return;
  }
},true);
window.addEventListener('message',async event=>{
  const frame=document.getElementById('characterArsenal'),message=event.data;
  if((state.step!==8&&state.sheetView!=='shop'&&state.sheetView!=='workshop')||!frame?.contentWindow||event.source!==frame.contentWindow||message?.channel!=='forja-arsenal-v1'||message.session!==arsenalSession)return;
  if(message.type==='toggle-shop-footer'){
    const footers = document.querySelectorAll('#arsenalViewContainer .sheet-shop-footer, .forja-autohide-footer');
    footers.forEach(f => {
      f.style.display = message.hidden ? 'none' : 'flex';
      f.hidden = Boolean(message.hidden);
    });
    return;
  }
  if(message.type==='cart-count'){finalShopCartCount=Math.max(0,Number(message.count)||0);syncFinalShopFooter();return;}
  if(message.type==='ready'){
    const statusEl = document.getElementById('arsenalStatus');
    if(statusEl) statusEl.hidden = true;
    if(state.step === 8 && !state.sheetView && !arsenalState().complete && !currentItemChoice()) finalizeInitialItems();
    return;
  }
  if(message.type==='choose-potion-spell'){
    spellState().grimoireSource='potion';
    spellState().view='available';
    state.previousSheetView=state.sheetView||'workshop';
    state.sheetView='grimoire';
    renderStage();
    if(typeof toast==='function')toast('Escolha no Grimório a magia desejada para a sua poção (óleo ou granada).');
    return;
  }
  if(message.type==='choose-scroll-spell'){
    spellState().grimoireSource='scroll';
    spellState().view='available';
    state.previousSheetView=state.sheetView||'workshop';
    state.sheetView='grimoire';
    renderStage();
    if(typeof toast==='function')toast('Escolha no Grimório a magia desejada para o seu pergaminho.');
    return;
  }
  if(message.type==='choose-tattoo-spell'){
    spellState().grimoireSource='tattoo';
    spellState().view='available';
    state.previousSheetView=state.sheetView||'workshop';
    state.sheetView='grimoire';
    renderStage();
    if(typeof toast==='function')toast('Escolha no Grimório a magia arcana de 1º círculo para a sua tatuagem mística.');
    return;
  }
  if(message.type==='choose-engenhoca-spell'){
    spellState().grimoireSource='engenhoca';
    spellState().view='available';
    state.previousSheetView=state.sheetView||'workshop';
    state.sheetView='grimoire';
    renderStage();
    if(typeof toast==='function')toast('Escolha no Grimório a magia para fabricar a sua engenhoca.');
    return;
  }
  if(message.type==='contraption-attach-item'){
    const spellId = message.spellId || state.contraptionAttach?.spellId;
    const attachedItem = message.attachedItem;
    state.contraptionAttach = null;
    state.sheetView = state.previousSheetView || 'grimoire';
    renderStage();
    if(typeof window.openEngenhocaCraftModal === 'function'){
      window.openEngenhocaCraftModal(spellId, attachedItem);
    }
    return;
  }
  if(message.type==='cancel-contraption-attach'){
    const spellId = message.spellId || state.contraptionAttach?.spellId;
    state.contraptionAttach = null;
    state.sheetView = state.previousSheetView || 'grimoire';
    renderStage();
    if(spellId && typeof window.openEngenhocaCraftModal === 'function'){
      window.openEngenhocaCraftModal(spellId);
    }
    return;
  }
  if(message.type==='disassemble-contraption'){
    const cId=message.id || message.data?.id;
    const contraptions = Array.isArray(state.contraptions) ? state.contraptions : [];
    const saved = arsenalState();
    let profiles;
    try{profiles=JSON.parse(saved.storage[ARSENAL_PROFILES_KEY]||'{}')}catch{profiles={}}
    let profile=profiles.profiles?.find(item=>item.id==='ficha-ativa')||profiles.profiles?.find(item=>item.id===profiles.activeId);
    if(!profile && profiles.profiles?.length) profile = profiles.profiles[0];

    const profContraptions = Array.isArray(profile?.contraptions) ? profile.contraptions : [];
    let target = contraptions.find(c => (cId && (c.id === cId || c.contraptionId === cId || c.itemId === cId))) ||
                 profContraptions.find(c => (cId && (c.id === cId || c.contraptionId === cId || c.itemId === cId)));
    const isGeneric = target?.nome === 'Engenhoca' || (!cId || cId === 'undefined');
    if (!target && isGeneric) {
      target = contraptions.find(c => c.nome === 'Engenhoca' || !c.spellId) ||
               profContraptions.find(c => c.nome === 'Engenhoca' || !c.spellId);
    }
    const targetId = target?.id || cId;

    state.contraptions = contraptions.filter(c => {
      if (targetId && (c.id === targetId || c.contraptionId === targetId || c.itemId === targetId)) return false;
      if (isGeneric && (c.nome === 'Engenhoca' || !c.spellId)) return false;
      return true;
    });
    if (profile && Array.isArray(profile.contraptions)) {
      profile.contraptions = profile.contraptions.filter(c => {
        if (targetId && (c.id === targetId || c.contraptionId === targetId || c.itemId === targetId)) return false;
        if (isGeneric && (c.nome === 'Engenhoca' || !c.spellId)) return false;
        return true;
      });
    }

    const aparatos = target ? (Array.isArray(target.apparatuses) ? target.apparatuses : (Array.isArray(target.aparatos) ? target.aparatos : (Array.isArray(target.apparatus) ? target.apparatus : []))) : [];

    if(profile && Array.isArray(profile.backpack)){
      // Remove a engenhoca da mochila
      profile.backpack = profile.backpack.filter(entry => {
        if (targetId && (entry.instanceId === targetId || entry.itemId === targetId || entry.contraptionId === targetId)) return false;
        if (isGeneric && (entry.itemName === 'Engenhoca' || entry.displayName === 'Engenhoca')) return false;
        return true;
      });
    }

    if (Array.isArray(state.customItems)) {
      state.customItems = state.customItems.filter(ci => {
        if (targetId && (ci.id === targetId || ci.contraptionId === targetId)) return false;
        if (isGeneric && (ci.nome === 'Engenhoca' || !ci.engenhocaInfo?.spellId)) return false;
        return true;
      });
    }
    if (profile && Array.isArray(profile.customItems)) {
      profile.customItems = profile.customItems.filter(ci => {
        if (targetId && (ci.id === targetId || ci.contraptionId === targetId)) return false;
        if (isGeneric && (ci.nome === 'Engenhoca' || !ci.engenhocaInfo?.spellId)) return false;
        return true;
      });
    }

    // Salva estado intermediário para que addItemToHeroBackpack opere sobre a mochila limpa
    saved.storage[ARSENAL_PROFILES_KEY] = JSON.stringify(profiles);

    // Devolve o item mundano original com melhorias à mochila
    let attachedMsg = '';
    if (target && target.attachedItem) {
      const attached = target.attachedItem;
      const customItemObj = {
        id: attached.id,
        nome: attached.nome,
        displayName: attached.nome,
        tipo: attached.tipo || 'item_geral',
        categoriaId: attached.categoriaId || 'item_geral',
        espacos: Number(attached.espacos != null ? attached.espacos : (typeof catalog !== 'undefined' && catalog.get(attached.id)?.espacos != null ? catalog.get(attached.id).espacos : 0)),
        improvements: attached.improvements || attached.melhorias || [],
        melhorias: attached.improvements || attached.melhorias || [],
        options: attached.options || {}
      };
      if (typeof addItemToHeroBackpack === 'function') {
        addItemToHeroBackpack(attached.id, 1, { source: 'disassemble' }, customItemObj);
      }
      attachedMsg = ` O item ${attached.nome} retornou à sua mochila.`;
    }

    // Devolve os aparatos para a mochila
    let aparatosDevolvidos = 0;
    aps: for (const ap of aparatos) {
      const apId = typeof ap === 'string' ? ap : (ap?.id || ap?.itemId);
      if (apId && typeof addItemToHeroBackpack === 'function') {
        aparatosDevolvidos++;
        addItemToHeroBackpack(apId, 1, { source: 'disassemble' });
      }
    }

    // Desequipa caso estivesse equipado
    if (targetId) {
      const eq = equipmentState();
      Object.assign(eq, RegrasInventario.desequipar(eq, targetId));
    }

    persistNow();
    if (state.finished && typeof saveFinishedCharacter === 'function') saveFinishedCharacter();
    renderStage();

    const aparatosMsg = aparatosDevolvidos > 0 ? ` ${aparatosDevolvidos} aparato(s) devolvido(s) à mochila.` : '';
    if (typeof toast === 'function') {
      toast(`Engenhoca desmanchada.${attachedMsg}${aparatosMsg}`);
    }
    sendArsenal('context', { context: arsenalInitialData('workshop') });
    return;
  }
  if(message.type==='update-contraption-apparatus'){
    const { contraptionId, apparatuses, apId, action, backpackInstanceId } = message;
    if(contraptionId){
      const aps = Array.isArray(apparatuses) ? apparatuses : [];
      // 1. Atualiza state.contraptions
      state.contraptions = Array.isArray(state.contraptions) ? state.contraptions : [];
      const cTarget = state.contraptions.find(c => c.id === contraptionId);
      if(cTarget){
        cTarget.apparatuses = [...aps];
        cTarget.aparatos = [...aps];
      }

      // 2. Atualiza profile.contraptions e profile.backpack
      const saved = arsenalState();
      let profiles;
      try{profiles=JSON.parse(saved.storage[ARSENAL_PROFILES_KEY]||'{}')}catch{profiles={}}
      let profile=profiles.profiles?.find(item=>item.id==='ficha-ativa')||profiles.profiles?.find(item=>item.id===profiles.activeId);
      if(!profile && profiles.profiles?.length) profile = profiles.profiles[0];

      if(profile){
        if(Array.isArray(profile.contraptions)){
          const profC = profile.contraptions.find(c => c.id === contraptionId);
          if(profC){
            profC.apparatuses = [...aps];
            profC.aparatos = [...aps];
          }
        }
        if(Array.isArray(profile.backpack)){
          const bpEntry = profile.backpack.find(e => e.instanceId === contraptionId || e.itemId === contraptionId || e.contraptionId === contraptionId);
          if(bpEntry){
            bpEntry.apparatuses = [...aps];
            bpEntry.aparatos = [...aps];
            bpEntry.engenhocaInfo = bpEntry.engenhocaInfo || {};
            bpEntry.engenhocaInfo.apparatuses = [...aps];
            bpEntry.engenhocaInfo.aparatos = [...aps];
          }
          if(action === 'install' && apId){
            const apIdx = profile.backpack.findIndex(e => (backpackInstanceId && e.instanceId === backpackInstanceId) || e.itemId === apId);
            if(apIdx >= 0){
              const entry = profile.backpack[apIdx];
              if(entry.quantity && Number(entry.quantity) > 1){
                entry.quantity = Number(entry.quantity) - 1;
              } else {
                profile.backpack.splice(apIdx, 1);
              }
            }
          } else if(action === 'remove' && apId){
            if(typeof addItemToHeroBackpack === 'function'){
              addItemToHeroBackpack(apId, 1, { source: 'apparatus-detach' });
            }
          }
        }
      }

      saved.storage[ARSENAL_PROFILES_KEY] = JSON.stringify(profiles);
      persistNow();
      if(state.finished && typeof saveFinishedCharacter === 'function') saveFinishedCharacter();
      renderStage();
    }
    return;
  }
  if(message.type==='open-craft-test'){
    const attrs = typeof finalAttrs === 'function' ? finalAttrs() : { int: 0 };
    const bonusInt = Number(attrs.int) || 0;
    if(typeof window.abrirModalTesteOficio === 'function'){
      window.abrirModalTesteOficio({
        titulo: message.titulo,
        subtitulo: message.subtitulo || message.oficioNome,
        oficioNome: message.oficioNome || 'Ofício (armeiro)',
        cd: message.craftCd,
        custoMateriaPrima: message.totalCost,
        bonusOficio: message.craftBonus,
        bonusInt: bonusInt,
        isExisting: Boolean(message.isExisting),
        onConfirm: (resultado) => {
          let outcome = 'success_self';
          if (resultado.destinatario === 'aliado') {
            outcome = resultado.sucesso ? 'success_ally' : (resultado.falhaLeve ? 'fail_minor_ally' : 'fail_major_ally');
          } else {
            outcome = resultado.sucesso ? 'success_self' : (resultado.falhaLeve ? 'fail_minor_self' : 'fail_major_self');
          }
          sendArsenal('execute-craft-operation', {
            itemId: message.itemId,
            options: { improvements: message.improvements, enchantments: message.enchantments },
            totalCost: resultado.custoDebitar,
            outcome: outcome,
            existingInstanceId: message.existingInstanceId,
            destinatario: resultado.destinatario,
            craftCd: message.craftCd
          });
        }
      });
    }
    return;
  }
  if(message.type==='close-shop'){arsenalShopOpen=false;if(state.finished)state.sheetView='sheet';else if(state.sheetView==='shop'||state.sheetView==='workshop'){state.sheetView='';if(state.previousCreationStep)state.step=state.previousCreationStep}renderStage();return}
  if(message.type==='host-scroll'){
    const rect=frame.getBoundingClientRect();
    const header=document.querySelector('.app-header');
    const headerBottom=header?header.getBoundingClientRect().bottom:0;
    const nav=document.querySelector('.phase-nav');
    const navVisible=Boolean(nav&&getComputedStyle(nav).display!=='none');
    const limit=Math.max(headerBottom,navVisible?(nav.getBoundingClientRect().bottom||0):0);
    const delta=Number(message.delta)||0;
    const subScroll=Number(message.scrollY)||0;
    if(delta>0&&rect.top>limit+1)window.scrollBy({top:Math.min(delta,rect.top-limit),behavior:'auto'});
    else if(delta<0&&subScroll<=2&&window.scrollY>0)window.scrollBy({top:Math.max(delta,-window.scrollY),behavior:'auto'});
    else sendArsenal('scroll-items',{delta});
    return;
  }
  if(message.type==='redo-initial-request'||message.type==='redo-initial'){if(await forjaConfirm('Você poderá escolher novamente todo o equipamento inicial. A mochila será esvaziada para refazer as escolhas na ordem correta.','Sim, refazer'))redoInitialItems();return}
  if(message.type==='candidate'){arsenalState().pending=message.itemId?{itemId:message.itemId,itemName:message.itemName,displayName:message.displayName,unitValue:message.unitValue,options:message.options||{},improvements:message.improvements||[],enchantments:message.enchantments||[]}:null;persistNow();syncInitialItemFooter();return}
  if(message.type==='claim-reward-item'){
    const itemId=message.itemId;
    const item=(DATA.pdfItems||[]).find(i=>i.id===itemId);
    if(typeof addRewardItemToBackpack==='function'){
      addRewardItemToBackpack(itemId, 1, message.options||{});
    }
    persistNow();
    if(state.finished&&typeof saveFinishedCharacter==='function')saveFinishedCharacter();
    toast(`"${item?.nome||'Item'}" recebido como recompensa!`);
    sendArsenal('context',{context:arsenalInitialData(state.isRewardShopMode?'reward':(state.sheetView==='workshop'?'workshop':'shop'))});
    return;
  }
  if(message.type==='operation'){acceptArsenalOperation(message);return}
  if(message.type==='money'&&financesState().startingLevel===1){financesState().levelOneTibars=Math.max(0,Number(message.value)||0);persistNow();sendArsenal('funds',{context:{funds:remainingFunds(),startingMoney:startingFunds()}});return}
  if(message.type==='sale'){financesState().rewardFunds=Math.round(((financesState().rewardFunds||0)+Math.max(0,Number(message.value)||0))*100)/100;persistNow();if(state.finished&&typeof saveFinishedCharacter==='function')saveFinishedCharacter();sendArsenal('funds',{context:{funds:remainingFunds(),startingMoney:startingFunds()}});return}
  if(message.type==='save'&&message.storage&&typeof message.storage==='object'){arsenalState().storage=message.storage;if(!persistNow())sendArsenal('save-failed')}
});
const summaryBeforeArsenal=renderSummary;
renderSummary=function(){
  const items=characterInventory();
  const formatBackpackName=item=>{
    const itemId=item.itemId||'';
    const opts=item.options||{};
    if(itemId==='ferramenta_agricola'){
      const custom=(opts.customName||item.displayName||'Forcado').trim();
      const clean=custom.replace(/\s*\(fazendeiro\)/i,'').replace(/ferramenta agr[íi]cola/i,'Forcado').trim();
      return (clean||'Forcado')+' (Fazendeiro)';
    }
    if(itemId==='ferramenta_pesada_lanca'){
      const def=opts.weaponModel==='maca'?'Malho':'Picareta';
      const custom=(opts.customName||item.displayName||def).trim();
      const clean=custom.replace(/\s*\(trabalhador\)/i,'').replace(/\s*\(lan[çc]a\)/i,'').replace(/\s*\(ma[çc]a\)/i,'').replace(/ferramenta pesada/i,def).trim();
      return (clean||def)+' (Trabalhador)';
    }
    if(itemId==='ferramenta_pesada'){
      const custom=(opts.customName||item.displayName||'Malho').trim();
      const clean=custom.replace(/\s*\(escravo\)/i,'').replace(/ferramenta pesada/i,'Malho').trim();
      return (clean||'Malho')+' (Escravo)';
    }
    if(itemId==='instrumentos_de_oficio'){
      const ofVal = opts.oficio || (item.displayName && !item.displayName.includes('—') ? item.displayName : '');
      return typeof formatCraftToolName === 'function' ? formatCraftToolName(ofVal || item.displayName) : (item.displayName || 'Instrumentos de Ofício');
    }
    let n=item.displayName||opts.customName||item.itemName||'';
    if(!n&&typeof DATA!=='undefined'&&Array.isArray(DATA.pdfItems)){
      const found=DATA.pdfItems.find(i=>i.id===itemId);
      if(found?.nome)n=found.nome;
    }
    if(!n)n=item.itemId||'';
    if(n==='traje_de_viajante'||n.toLowerCase().includes('traje_de_viaj'))return 'Traje de Viajante';
    if(n==='carroca')return 'Carroça';
    return n.replace(/_/g,' ');
  };
  return summaryBeforeArsenal()+renderStartingMoneyPanel()+panel('Mochila','<div class="ability-list">'+(items.length?items.map(item=>abilityHtml({nome:formatBackpackName(item)+' × '+item.quantity,descricao:item.ammoRemaining!==undefined?'Munições restantes: '+item.ammoRemaining:''})).join(''):'<p class="help">A mochila está vazia.</p>')+'</div>');
};
document.addEventListener('input',event=>{if(event.target.dataset.field==='levelOneTibars'){financesState().levelOneTibars=Math.max(0,Number(event.target.value)||0);persist();const values=event.target.closest('.panel-body')?.querySelectorAll('.summary-card strong');if(values?.length)values[values.length-1].textContent=formatTibars(remainingFunds())}},true);
function syncInitialLevelFromPlanning(){
  if(state.step!==1||state.editingCharacter||state.completed.includes(1))return false;
  state.identity.initialLevel=validCharacterLevel(state.identity.plannedLevel);
  financesState().startingLevel=state.identity.initialLevel;
  return true;
}
document.addEventListener('change',event=>{if(event.target.dataset.field==='plannedLevel'&&syncInitialLevelFromPlanning())renderStage()},true);

const CHARACTER_ROSTER_KEY='forja-heroi-t20-personagens-v1';
function characterRoster(){const value=characterStorage.ler(CHARACTER_ROSTER_KEY,()=>[]);return Array.isArray(value)?value:[]}
function characterIdentifier(){if(!state.identity.characterId)state.identity.characterId='personagem-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);return state.identity.characterId}
let rosterSaveTimer=null;
function scheduleSaveFinishedCharacter(delay=350){clearTimeout(rosterSaveTimer);rosterSaveTimer=setTimeout(()=>{saveFinishedCharacter()},delay)}
function saveFinishedCharacter(){
  if(!state.finished)return;
  const id=characterIdentifier(),roster=characterRoster(),snapshot=JSON.parse(JSON.stringify(state));
  snapshot.sheetView='sheet';
  const entry={id,name:state.identity.characterName||'Personagem',updatedAt:Date.now(),snapshot},index=roster.findIndex(item=>item.id===id);
  if(index>=0){
    roster[index]=entry;
  } else {
    if(typeof window.ForjaLimites !== 'undefined' && !window.ForjaLimites.podeCriarNovoPersonagem()){
      window.ForjaLimites.abrirModalLimite();
      return;
    }
    roster.push(entry);
  }
  characterStorage.salvar(CHARACTER_ROSTER_KEY,roster);
  if(typeof persistNavigationNow==='function'){
    persistNavigationNow();
  }else{
    persistNow();
  }
}
function renderCharacterToolbar(){
  const actions = [
    ['characters', 'Meus personagens'],
    ['new', 'Nova Ficha']
  ];
  if(state.finished || state.step === 9){
    if((Number(state.identity?.plannedLevel)||1) < 20){
      actions.push(['level-up', 'Subir nível']);
    }
    actions.push(['edit', 'Editar ficha']);
  } else if(state.isEditingFinishedSheet){
    actions.push(['sheet', 'Ver ficha pronta']);
  }
  actions.push(
    ['grimoire', 'Grimório'],
    ['shop', 'Loja'],
    ['tavern', 'Taverna'],
    ['workshop-preview', 'Oficinas'],
    ['reward', 'Recompensa']
  );
  return '<details class="sheet-menu"><summary class="button" aria-label="Menu do personagem">Menu</summary><nav aria-label="Ações do personagem">'+actions.map(([action,label])=>'<button class="button" type="button" data-sheet-action="'+action+'">'+label+'</button>').join('')+'</nav></details>';
}
function syncSheetHeadingMenu(){
  const names={shop:'Loja',tavern:'Taverna',workshop:'Oficinas',grimoire:'Grimório'};
  const label=names[state.sheetView];
  const gSource = typeof spellState === 'function' ? spellState().grimoireSource : '';
  const isWorkshopCraft = ['potion','scroll','tattoo','engenhoca'].includes(gSource);
  const isTavernPotion = gSource === 'tavern-potion';
  const backHandler = () => {
    if (state.sheetView === 'grimoire' && isTavernPotion) {
      state.sheetView = 'tavern';
    } else if (state.sheetView === 'grimoire' && isWorkshopCraft) {
      state.sheetView = 'workshop';
    } else {
      state.sheetView = state.finished ? 'sheet' : '';
    }
    persistNavigationNow();
    renderStage({navigationOnly:true});
  };
  sincronizarCabecalho('Forja Rubra'+(label?' — '+label:''), label ? backHandler : null);

  const upIcon = window.IconesForja ? window.IconesForja.get('arrow-up', 'icon-sm') : '';
  const editBtn=document.getElementById('editCharacterButton');
  if(editBtn) editBtn.hidden=true;
  const levelUpBtn=document.getElementById('levelUpButton');
  if(levelUpBtn) {
    levelUpBtn.hidden=true;
    levelUpBtn.style.display='none';
  }
  const expBtn=document.getElementById('exportButton');
  if(expBtn) expBtn.hidden=true;
  const randBtn=document.getElementById('randomCharacterButton');
  if(randBtn) randBtn.hidden=true;
  const resetBtn=document.getElementById('resetButton');
  if(resetBtn) resetBtn.hidden=true;
  const menuHost=document.getElementById('sheetMenuContainer');
  if(menuHost) menuHost.remove();
}

