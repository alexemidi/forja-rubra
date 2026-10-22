
document.addEventListener('change',event=>{const field=event.target.dataset.field;if(field==='raceId'){state.identity.raceId=event.target.value;state.identity.openRaceAllocations={};if(!isRaceEligibleForOpenRaces(raceById(event.target.value))){state.identity.openRaceBonusEnabled=false;}resetDownstream('race');renderStage();if(typeof hasPendingRaceChoices==='function'&&!hasPendingRaceChoices()){if(typeof rolarParaCalculadoraAtributos==='function')rolarParaCalculadoraAtributos();}else{window.scrollTo({top:0,behavior:'smooth'});}}else if(field==='classId'){state.identity.classId=event.target.value;resetDownstream('class');renderStage()}else if(field==='class-required'){state.identity.classRequiredChoices[event.target.dataset.index]=event.target.value;state.skills.class=[];state.skills.duplicate=[];renderStage()}else if(field==='originMode'){state.origin.mode=event.target.value;if(state.origin.mode==='single'||isChildCharacter())state.origin.regional='';renderStage()}else if(field==='standardOrigin'){state.origin.standard=event.target.value;state.origin.benefits=[];if(isTeenCharacter()&&state.origin.mode==='dual'&&event.target.value){state.origin.regional='';}state.skills={class:[],int:[],race:[],duplicate:[]};renderStage()}else if(field==='regionalOrigin'){state.origin.regional=event.target.value;if(isChildCharacter()){state.origin.regional='';}if(isTeenCharacter()&&state.origin.mode==='dual'&&event.target.value){state.origin.standard='';state.origin.benefits=[];}state.skills={class:[],int:[],race:[],duplicate:[]};renderStage()}else if(field==='deityMode'){state.deity={mode:event.target.value,name:'',power:'',previewPower:'',previewDeity:'',activePowerIndex:0};renderStage()}const action=event.target.dataset.action;if(action==='race-choice'){const cId=event.target.dataset.choiceId;state.identity.raceChoices[cId]=event.target.value;state.identity.raceSubAttrs[cId]=[];if(cId==='duende_natureza'){state.identity.raceSubAttrs.duende_natureza=[];if(event.target.value!=='animal'&&state.identity.raceSpecialAttrs?.duende_dons){const current=state.identity.raceSpecialAttrs.duende_dons;const unique=[...new Set(current)];state.identity.raceSpecialAttrs.duende_dons=unique.slice(0,2);}}renderStage();if(cId==='duende_natureza'){setTimeout(()=>{const target=document.querySelector('[data-choice-section="duende_tamanho"]')||document.querySelector('[data-choice-id="duende_tamanho"]')?.closest('.choice-section');if(target&&typeof target.scrollIntoView==='function'){target.scrollIntoView({behavior:'smooth',block:'start'});target.classList.remove('choice-highlight');void (target as HTMLElement).offsetWidth;target.classList.add('choice-highlight');}},60);}else if(cId==='duende_tamanho'){setTimeout(()=>{const target=document.querySelector('.duende-taboo-editor')||document.querySelector('[data-choice-section="duende_tabu"]');if(target&&typeof target.scrollIntoView==='function'){target.scrollIntoView({behavior:'smooth',block:'start'});target.classList.remove('choice-highlight');void (target as HTMLElement).offsetWidth;target.classList.add('choice-highlight');}},60);}else if(typeof hasPendingRaceChoices==='function'&&!hasPendingRaceChoices()){if(typeof rolarParaCalculadoraAtributos==='function')rolarParaCalculadoraAtributos();}}else if(action==='class-choice'){state.identity.classChoices[event.target.dataset.choiceId]=event.target.value;renderStage();const valSlug=slug(event.target.value);if(valSlug==='feiticeiro'){setTimeout(()=>{const target=document.querySelector('[data-action="class-choice"][data-choice-id$="__secundaria"]')?.closest('.choice-section');if(target&&typeof target.scrollIntoView==='function'){target.scrollIntoView({behavior:'smooth',block:'center'});}},50)}else if(valSlug.includes('draconica')){setTimeout(()=>{const target=document.querySelector('[data-action="class-choice"][data-choice-id*="tipo_dano_draconico"]')?.closest('.choice-section');if(target&&typeof target.scrollIntoView==='function'){target.scrollIntoView({behavior:'smooth',block:'center'});}},50)}}else if(action==='origin-benefit'){const id=event.target.value,list=state.origin.benefits,maxAllowed=typeof originMaxBenefits==='function'?originMaxBenefits():2;if(event.target.checked){if(list.length>=maxAllowed){event.target.checked=false;toast('Você pode escolher no máximo '+maxAllowed+' benefício(s).')}else list.push(id)}else state.origin.benefits=list.filter(x=>x!==id);state.skills={class:[],int:[],race:[],duplicate:[]};renderStage()}else if(action==='skill'){const scrollPos=typeof window!=='undefined'?window.scrollY:0;const group=event.target.dataset.group;if(!state.skills[group])state.skills[group]=[];const list=state.skills[group],limits=typeof skillChoiceLimits==='function'?skillChoiceLimits():{class:0,int:0,race:0,duplicate:0},id=event.target.value;if(event.target.checked){if(list.length>=limits[group]){event.target.checked=false;toast('Todos os espaços deste grupo já foram preenchidos.')}else list.push(id)}else state.skills[group]=list.filter(x=>x!==id);renderStage();if(scrollPos>0&&typeof window!=='undefined'){window.scrollTo({top:scrollPos,behavior:'instant' as any});requestAnimationFrame(()=>window.scrollTo({top:scrollPos,behavior:'instant' as any}));}if(event.target.checked&&typeof window!=='undefined'&&window.innerWidth>768&&typeof scrollToNextSkillGroup==='function')scrollToNextSkillGroup(group);}else if(action==='race-power'){const group=event.target.dataset.group,g=racePowerGroups().find(x=>x.id===group),list=state.powers.raceGroups[group]||[],id=event.target.value;if(event.target.checked){if(list.length>=Number(g.quantity)){event.target.checked=false;toast('O limite desta escolha já foi alcançado.')}else list.push(id)}else state.powers.raceGroups[group]=list.filter(x=>x!==id);renderStage()}else if(action==='race-subchoice'){state.identity.raceChoices[event.target.dataset.choiceId]=event.target.value;renderStage();if(typeof hasPendingRaceChoices==='function'&&!hasPendingRaceChoices()){if(typeof rolarParaCalculadoraAtributos==='function')rolarParaCalculadoraAtributos();}}else if(action==='general-power'){state.powers.general[Number(event.target.dataset.index)]=event.target.value;renderStage()}else if(action==='origin-general-power'){state.powers.originGeneral=state.powers.originGeneral||{};state.powers.originGeneral[event.target.dataset.benefitId]=event.target.value;renderStage()}else if(action==='deity-power'){const values=String(state.deity.power||'').split('|');values[Number(event.target.dataset.index)]=event.target.value;state.deity.power=values.join('|');renderStage()}else if(action==='progress-class'){const i=Number(event.target.dataset.index);state.progression[i]={classId:event.target.value,powerId:''};renderStage()}else if(action==='progress-power'){state.progression[Number(event.target.dataset.index)].powerId=event.target.value;renderStage()}});
document.addEventListener('click',event=>{const button=event.target.closest('[data-action]');if(!button)return;const action=button.dataset.action;if(action==='attr'){event.preventDefault();const scrollPos=typeof window!=='undefined'?window.scrollY:0;const id=button.dataset.attr,dir=Number(button.dataset.dir),old=state.identity.baseAttrs[id],next=Math.max(-1,Math.min(4,old+dir));if(pointSpent()-ATTR_COST[old]+ATTR_COST[next]>10){toast('Você não possui pontos suficientes para esse aumento.');return}state.identity.baseAttrs[id]=next;renderStage();if(scrollPos>0&&typeof window!=='undefined'){window.scrollTo({top:scrollPos,behavior:'instant' as any});requestAnimationFrame(()=>window.scrollTo({top:scrollPos,behavior:'instant' as any}));}}else if(action==='allocation'){event.preventDefault();const scrollPos=typeof window!=='undefined'?window.scrollY:0;const list=allocationBucket(button.dataset.key),id=button.dataset.attr,dir=Number(button.dataset.dir);if(dir<0){const index=list.lastIndexOf(id);if(index>=0)list.splice(index,1)}else {const source=raceAllocationSources().find(s=>s.key===button.dataset.key);const qty=Number(source?.config?.quantidade||99);const maxAttr=Number(source?.config?.maxPorAtributo||(source?.config?.permitirRepetir?qty:1));const currentCount=list.filter(x=>x===id).length;if(list.length<qty&&currentCount<maxAttr){list.push(id);}}renderStage();if(scrollPos>0&&typeof window!=='undefined'){window.scrollTo({top:scrollPos,behavior:'instant' as any});requestAnimationFrame(()=>window.scrollTo({top:scrollPos,behavior:'instant' as any}));}}else if(action==='deity'){state.deity.name=button.dataset.name;state.deity.power='';renderStage()}else if(action==='add-level'){state.identity.plannedLevel=Math.min(20,state.identity.plannedLevel+1);state.progression.push({classId:state.progression.at(-1)?.classId||state.identity.classId,powerId:''});renderStage()}});

document.addEventListener('click',event=>{if(!event.target.closest?.('#phaseNav'))return;const b=event.target.closest('[data-step]');if(!b)return;const targetStep=Number(b.dataset.step);if(state.isLevelingUp&&(typeof isPhaseLockedInLevelUp==='function'?isPhaseLockedInLevelUp(targetStep):targetStep<=6)){toast('Esta etapa está bloqueada durante o avanço de nível.','warning');return;}if(typeof shouldSkipPhase==='function'&&shouldSkipPhase(targetStep))return;state.step=targetStep;persistNow();renderStage();window.scrollTo({top:0,behavior:'smooth'})});
document.addEventListener('click',event=>{if(!event.target.closest?.('#previousButton'))return;if(state.step>1){state.step--;persistNow();renderStage();window.scrollTo({top:0,behavior:'smooth'})}});
document.addEventListener('input',event=>{if(event.target.dataset?.action==='race-subchoice-custom'){state.identity.raceChoices=state.identity.raceChoices||{};state.identity.raceChoices[event.target.dataset.choiceId]=event.target.value;persistNow();}});
function nextIncompletePhase(fromStep){
  for(let s=fromStep+1;s<=8;s++){
    const missing=typeof missingChoices==='function'?missingChoices(s):[];
    if(!phaseIsComplete(s)||(Array.isArray(missing)&&missing.length>0))return s;
  }
  return 9;
}
function isCurrentPhaseComplete(){
  if(state.step===6){
    const missing=typeof powerMissingChoices==='function'?powerMissingChoices():[];
    const slots=typeof generalPowerSlots==='function'?generalPowerSlots():0;
    if(slots===0){
      return missing.length===0;
    }
    const raceOk=missing.filter(m=>m.title!=='Poder geral').length===0;
    if(slots===1){
      const hasDraft=Boolean(state.powers?.previewId);
      const draftOk=typeof generalPowerDraftAllowed==='function'?generalPowerDraftAllowed():false;
      const hasChosen=Boolean(state.powers?.general?.[0]);
      return ((hasDraft && draftOk) || hasChosen) && raceOk;
    }
    const pending=typeof pendingGeneralPowerSlot==='function'?pendingGeneralPowerSlot():undefined;
    return pending===undefined && !state.powers?.previewId && raceOk;
  }
  if(state.step===7){
    const missing=typeof spellMissingChoices==='function'?spellMissingChoices():[];
    return missing.length===0;
  }
  if(state.step===8){
    const saved=typeof arsenalState==='function'?arsenalState():null;
    if(saved?.complete)return true;
    const choice=typeof currentItemChoice==='function'?currentItemChoice():null;
    return Boolean(saved?.pending)||choice?.id==='simple';
  }
  if(state.step===9){
    const missing=typeof partnerMissingChoices==='function'?partnerMissingChoices():[];
    return missing.length===0;
  }
  if(state.step===10){
    const missing=typeof progressionMissingChoices==='function'?progressionMissingChoices():[];
    const active=typeof progressionActivePowerIndex==='function'?progressionActivePowerIndex():-1;
    const row=active>=0?state.progression[active]:null;
    const powerLevelIndices=state.progression.map((r,i)=>powerSlotAt(classById(r.classId),classLevelAt(i,r.classId))?i:-1).filter(i=>i>=0);
    if(powerLevelIndices.length<=1){
      const candidate=row?progressionPowerById(row.previewPowerId||row.powerId):null;
      const verdict=candidate?progressionPowerVerdict(candidate,active):null;
      const readyToConfirm=Boolean(row?.previewPowerId && verdict?.ok && (candidate.id!=='classe_aumento_de_atributo'||row.previewPowerChoice));
      const hasConfirmed=Boolean(row?.powerId && (!row?.previewPowerId||row.previewPowerId===row.powerId));
      return missing.length===0 && (readyToConfirm || hasConfirmed);
    }
    return missing.length===0 && !row?.previewPowerId;
  }
  const missing=typeof missingChoices==='function'?missingChoices(state.step):[];
  return phaseIsComplete(state.step)&&(!Array.isArray(missing)||missing.length===0);
}
function getNextLinearStep(currentStep){
  let s = currentStep + 1;
  while(s <= 10 && typeof shouldSkipPhase === 'function' && shouldSkipPhase(s)){
    s++;
  }
  return Math.min(10, s);
}

function findFirstPendingPhase(){
  for(let s = 1; s <= 10; s++){
    if(typeof shouldSkipPhase === 'function' && shouldSkipPhase(s)) continue;
    const missing = typeof missingChoices === 'function' ? missingChoices(s) : [];
    if(!phaseIsComplete(s) || (Array.isArray(missing) && missing.length > 0)){
      return s;
    }
  }
  return null;
}

function isEditingFinishedSheet(){
  return Boolean(state.isEditingFinishedSheet || state.editingCharacter);
}

function syncPhaseStepNavigation(){
  const stepPrev = document.getElementById('stepPrevButton');
  const stepNext = document.getElementById('stepNextButton');
  if(!stepPrev || !stepNext) return;

  // Fases 1 a 5: nunca exibem anterior/próxima
  if(state.step < 6){
    stepPrev.hidden = true;
    stepNext.hidden = true;
    return;
  }

  // Fase 6: somente se houver mais de uma escolha sequencial
  if(state.step === 6){
    const stages = typeof getPhase6SubStages === 'function' ? getPhase6SubStages() : [];
    if(stages.length <= 1){
      stepPrev.hidden = true;
      stepNext.hidden = true;
    }
    return;
  }

  // Fase 7: somente se houver mais de um grupo de escolhas de magia
  if(state.step === 7){
    const plan = typeof spellPlan === 'function' ? spellPlan() : null;
    const groups = plan?.groups?.filter(g => g.count > 0 && g.kind !== 'reference') || [];
    if(groups.length <= 1){
      stepPrev.hidden = true;
      stepNext.hidden = true;
    }else{
      const saved = typeof spellState === 'function' ? spellState() : {};
      const curIdx = groups.findIndex(g => g.id === saved.activeGroup);
      stepPrev.hidden = false;
      stepPrev.disabled = curIdx <= 0;
      stepNext.hidden = false;
      stepNext.disabled = curIdx >= groups.length - 1;
      stepNext.textContent = 'Próxima →';
    }
    return;
  }

  // Fase 8: somente se houver mais de uma escolha (plan.length > 1) e não estiver completo
  if(state.step === 8){
    const saved = typeof arsenalState === 'function' ? arsenalState() : null;
    const plan = typeof initialItemPlan === 'function' ? initialItemPlan() : [];
    if(plan.length <= 1 || saved?.complete){
      stepPrev.hidden = true;
      stepNext.hidden = true;
    }
    return;
  }

  // Fase 9: Parceiros não utiliza botões de etapa sequencial
  if(state.step === 9){
    stepPrev.hidden = true;
    stepNext.hidden = true;
    return;
  }

  // Fase 10: se nível planejado for 1, ou se houver <= 1 escolha de poder, NÃO vai ter esses dois botões
  if(state.step === 10){
    const plannedLevel = Number(state.identity?.plannedLevel) || 1;
    const powerLevelIndices = (state.progression || []).map((r, i) => powerSlotAt(classById(r.classId), classLevelAt(i, r.classId)) ? i : -1).filter(i => i >= 0);
    if(plannedLevel <= 1 || powerLevelIndices.length <= 1){
      stepPrev.hidden = true;
      stepNext.hidden = true;
    }
    return;
  }
}

function syncNextButtonState(){
  const next=document.getElementById('nextButton');
  if(!next)return;
  next.hidden=false;
  next.classList.remove('deity-restricted');
  if(state.step===5&&state.deity?.mode==='devout'){
    const deity=chosenDeity();
    if(deity&&!deityAccepts(deity)&&!state.deity.masterPermission){
      if(isCurrentPhaseComplete()){
        next.classList.remove('is-incomplete');
        next.classList.add('deity-restricted');
        next.disabled=false;
        next.textContent='Avançar →';
        syncPhaseStepNavigation();
        syncPendingOrFinishButton();
        return;
      }
    }
  }
  if(state.step===6&&typeof syncSequentialPowerFooter==='function'){
    syncSequentialPowerFooter();
    syncPhaseStepNavigation();
    syncPendingOrFinishButton();
    return;
  }
  if(state.step===7){
    const spellPending=typeof spellMissingChoices==='function'?spellMissingChoices():[];
    const complete=spellPending.length===0;
    const returning=Boolean(spellState().returnToProgression);
    const pending=complete&&returning?characterPendingChoices():[];
    next.textContent=returning&&complete?(pending.length?(pending[0].step===10?'Voltar à progressão →':'Revisar pendências →'):'Finalizar ficha'):'Avançar →';
    next.disabled=!complete;
    next.classList.toggle('is-incomplete',!complete);
    syncPhaseStepNavigation();
    syncPendingOrFinishButton();
    return;
  }
  if(state.step===8){
    if(typeof syncInitialItemFooter==='function'){
      syncInitialItemFooter();
    }else{
      const saved=typeof arsenalState==='function'?arsenalState():null;
      const complete=Boolean(saved?.complete);
      next.textContent=typeof arsenalShopOpen!=='undefined'&&arsenalShopOpen?'Confirmar compra':'Avançar →';
      next.disabled=!complete;
      next.classList.toggle('is-incomplete',!complete);
      syncPhaseStepNavigation();
      syncPendingOrFinishButton();
    }
    return;
  }
  if(state.step===9){
    const complete=isCurrentPhaseComplete();
    const skipProgression = typeof shouldSkipPhase === 'function' && shouldSkipPhase(10);
    if(state.isTrainingPowerProgression){
      const active = typeof progressionActivePowerIndex === 'function' ? progressionActivePowerIndex() : -1;
      const row = active >= 0 ? state.progression[active] : null;
      const hasChosenPower = Boolean(row && (row.powerId || row.previewPowerId));
      next.textContent = hasChosenPower ? 'Confirmar treino de poder →' : 'Avançar para treino de poder →';
    } else {
      next.textContent=skipProgression?'Finalizar ficha':'Avançar →';
    }
    next.hidden=false;
    next.disabled=!complete;
    next.classList.toggle('is-incomplete',!complete);
    syncPhaseStepNavigation();
    syncPendingOrFinishButton();
    return;
  }
  if(state.step===10&&typeof syncProgressionFooter==='function'){
    syncProgressionFooter();
    syncPhaseStepNavigation();
    syncPendingOrFinishButton();
    return;
  }
  const complete=isCurrentPhaseComplete();
  const visibleSteps=PHASES.map((p,i)=>i+1).filter(s=>!(typeof shouldSkipPhase==='function'&&shouldSkipPhase(s)));
  const isLast=state.step===visibleSteps[visibleSteps.length-1];
  next.textContent=isLast?'Finalizar ficha':'Avançar →';
  next.disabled=!complete;
  next.classList.toggle('is-incomplete',!complete);
  syncPhaseStepNavigation();
  syncPendingOrFinishButton();
}

function syncPendingOrFinishButton(){
  const pendingBtn=document.getElementById('pendingOrFinishButton');
  if(pendingBtn) pendingBtn.hidden=true;
}

document.addEventListener('click',event=>{if(!event.target.closest?.('#nextButton'))return;
  if(state.step===10||state.step===9||state.step===8){return}
  if(state.step===4&&state.returnToProgressionAfterSkill){
    event.preventDefault();event.stopImmediatePropagation();
    const pending=typeof skillMissingChoices==='function'?skillMissingChoices():[];
    if(pending.length){showMissingChoiceWarning(pending);return}
    delete state.returnToProgressionAfterSkill;
    const hasCasterClass = (state.progression || []).some(r => ['arcanista', 'clerigo', 'druida', 'bardo'].includes(r.classId)) || ['arcanista', 'clerigo', 'druida', 'bardo'].includes(state.identity?.classId);
    const spells=typeof spellMissingChoices==='function'?spellMissingChoices():[];
    if(spells.length && hasCasterClass){const saved=spellState();saved.returnToProgression=true;saved.progression=true;state.step=7}
    else state.step=10;
    persistNow();renderStage();window.scrollTo({top:0,behavior:'smooth'});
    return;
  }
  if(state.step===7&&spellState().returnToProgression){
    if(!phaseIsComplete(7))return;
    if(resumeProgressionAfterSpells())return;
    const pending=characterPendingChoices();
    if(!pending.length){delete spellState().returnToProgression;finishCharacterCreation();return;}
    state.step=pending[0].step||10;
    delete spellState().returnToProgression;
    renderStage();return;
  }
  if(state.step===5&&state.deity?.mode==='devout'){
    const deity=chosenDeity();
    if(deity&&!deityAccepts(deity)&&!state.deity.masterPermission){
      if(isCurrentPhaseComplete()){
        const modal=document.getElementById('deityPermissionModal');
        if(modal)modal.hidden=false;
        return;
      }
    }
  }
  if(state.step===6){
    const slots=typeof generalPowerSlots==='function'?generalPowerSlots():0;
    if(slots===0){
      if(!isCurrentPhaseComplete()){
        toast('Selecione os poderes raciais restantes para continuar.', 'warning');
        return;
      }
    }else if(slots===1){
      if(state.powers.previewId){
        if(typeof generalPowerDraftAllowed==='function'&&!generalPowerDraftAllowed()){
          toast('Este poder não atende aos pré-requisitos.', 'warning');
          return;
        }
        state.powers.general[0]=state.powers.previewId;
        state.powers.previewId='';
        persist();
      }else if(!state.powers.general?.[0]){
        toast('Selecione um poder geral na lista para continuar.', 'warning');
        document.querySelector('.power-list')?.scrollIntoView({behavior:'smooth',block:'center'});
        return;
      }
    }else if(!isCurrentPhaseComplete()){
      if(state.powers.previewId){
        toast('Clique em Próxima para confirmar sua escolha para este espaço.', 'info');
        document.getElementById('stepNextButton')?.focus();
      }else{
        toast('Selecione um poder geral na lista antes de avançar.', 'warning');
        document.querySelector('.power-list')?.scrollIntoView({behavior:'smooth',block:'center'});
      }
      return;
    }
  }
  if(state.step===7&&!isCurrentPhaseComplete()){
    toast('Escolha as magias restantes no Grimório antes de avançar.', 'warning');
    document.getElementById('spellGrimoire')?.scrollIntoView({behavior:'smooth',block:'start'});
    return;
  }
  if(!isCurrentPhaseComplete()){
    const items=typeof missingChoices==='function'?missingChoices(state.step):[];
    showMissingChoiceWarning(items.length?items:[{title:'Etapa incompleta',message:validationMessage(state.step),selector:'.stage-root',step:state.step}]);
    return;
  }
  if(!state.completed.includes(state.step))state.completed.push(state.step);
  state.step=getNextLinearStep(state.step);
  // @ts-ignore
  window._lastStepTransitionTimestamp=Date.now();
  event.stopImmediatePropagation();
  persistNow();
  renderStage();
  window.scrollTo({top:0,behavior:'smooth'});
},true);
document.getElementById('deityPermissionGranted')?.addEventListener('click',()=>{
  const modal=document.getElementById('deityPermissionModal');
  if(modal)modal.hidden=true;
  state.deity.masterPermission=true;
  if(typeof syncNextButtonState==='function')syncNextButtonState();
  if(!state.completed.includes(state.step))state.completed.push(state.step);
  state.step=getNextLinearStep(state.step);
  persistNow();
  renderStage();
  window.scrollTo({top:0,behavior:'smooth'});
});
document.getElementById('deityPermissionDenied')?.addEventListener('click',()=>{
  const modal=document.getElementById('deityPermissionModal');
  if(modal)modal.hidden=true;
  state.deity.masterPermission=false;
  state.deity.strictAcceptedOnly=true;
  state.deity.name='';
  state.deity.power='';
  state.deity.previewPower='';
  state.deity.previewDeity='';
  renderDeitySelection({resetSearch:true});
  if(typeof syncNextButtonState==='function')syncNextButtonState();
});
document.getElementById('teurgistNoticeConfirm')?.addEventListener('click',()=>{
  const modal=document.getElementById('teurgistNoticeModal');
  if(modal)modal.hidden=true;
});
function openRandomConfigModal(){const modal=document.getElementById('randomConfigModal');if(!modal){if(typeof generateRandomCharacter==='function')generateRandomCharacter();return}const classSelect=document.getElementById('randomClassSelect');if(classSelect){classSelect.innerHTML='<option value="">Classe aleatória</option>'+DATA.classes.filter(item=>item.id!=='custom').map(item=>'<option value="'+esc(item.id)+'">'+esc(item.nome)+'</option>').join('');classSelect.value=state.identity?.classId||''}const levelInput=document.getElementById('randomLevelInput');if(levelInput)levelInput.value=state.identity?.plannedLevel||1;const originSelect=document.getElementById('randomOriginModeSelect');if(originSelect)originSelect.value=state.origin?.mode||'single';modal.hidden=false}
document.getElementById('randomCharacterButton')?.addEventListener('click',()=>openRandomConfigModal());
document.getElementById('randomConfigCancel')?.addEventListener('click',()=>{const modal=document.getElementById('randomConfigModal');if(modal)modal.hidden=true});
document.getElementById('resetButton')?.addEventListener('click',async()=>{
  if(!await forjaConfirm('Começar uma nova ficha? A ficha atual será apagada deste navegador.','Sim, começar'))return;
  state=defaultState();
  state.isEditingFinishedSheet=false;
  state.editingCharacter=null;
  characterStorage.salvar(STORAGE_KEY,state);
  const resetBtn=document.getElementById('resetButton');if(resetBtn)resetBtn.hidden=true;
  renderStage();
  toast('Nova ficha iniciada.');
});
document.getElementById('exportButton')?.addEventListener('click',()=>{const blob=new Blob([JSON.stringify({schema:'forja-heroi-t20-v2',exportedAt:new Date().toISOString(),character:state},null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=(slug(state.identity.characterName)||'ficha-t20')+'.json';a.click();URL.revokeObjectURL(a.href);toast('Ficha exportada em JSON.')});
function bindDeitySearch(){const input=document.getElementById('deitySearch');if(!input)return;input.addEventListener('input',()=>{const q=slug(input.value);document.querySelectorAll('.deity-card').forEach(card=>card.classList.toggle('hidden',q&&!slug(card.textContent).includes(q)))})}

// Complementos para escolhas encadeadas e casos raciais especiais.
classChoiceDescriptors=function(cls){
  const descriptors=[];
  (cls?.habilidades||[]).filter(ability=>Number(ability.nivel)===1).forEach(ability=>{
    const choices=ability.escolhas||[];
    if(!choices.length)return;
    // Magias, devoção e equipamentos possuem fases próprias.
    if(/\bmagias?\b|devoto fiel|abençoado/i.test(ability.nome)||/protótipo|espólio|do bom e do melhor/i.test(ability.nome))return;
    if(choices.some(choice=>choice.tipo||choice.opcoes)){
      choices.forEach(choice=>descriptors.push(Object.assign({id:ability.id+'_'+(choice.id||slug(choice.nome)),descricao:ability.descricao},choice)));
    }else{
      descriptors.push({id:ability.id,nome:ability.nome,descricao:ability.descricao,opcoes:choices});
    }
  });
  return descriptors;
};

const baseChoiceName=choiceName;
choiceName=function(value){
  if(value&&typeof value==='object'&&value.nome)return String(value.nome);
  const raw=baseChoiceName(value);
  return raw.replace(/_/g,' ').replace(/\b\w/g,letter=>letter.toUpperCase());
};

const baseRaceBonuses=raceBonuses;
raceBonuses=function(){
  const bonus=baseRaceBonuses();
  if(state.identity.raceId==='golem_desperto'){
    const size=state.identity.raceChoices.golem_desperto_tamanho;
    if(size==='pequeno')bonus.des+=1;
    if(size==='grande')bonus.des-=1;
  }
  return bonus;
};

function selectedOption(def,source='race'){
  const value=source==='class'?state.identity.classChoices[def.id]:state.identity.raceChoices[def.id];
  return optionList(def).find(option=>choiceId(option)===value);
}

function resolvedClassChoice(choice,parentId){
  const resolved=Object.assign({},choice,{id:parentId+'__'+choice.id});
  if(choice.origemDados==='deuses')resolved.opcoes=DATA.deities.map(deity=>({id:slug(deity.nome),nome:deity.nome}));
  if(choice.id==='atributo_perda_tormenta'&&Array.isArray(resolved.opcoes)){
    resolved.opcoes=resolved.opcoes.filter(o=>(o?.id||o)!=='car');
  }
  return resolved;
}

function renderClassChoiceDetails(def){
  const primary=selectedOption(def,'class');
  if(!primary)return '';
  const secondaryOptions=primary.escolhas_secundarias||[];
  let html='';
  if(secondaryOptions.length){
    const secondaryDef={id:def.id+'__secundaria',nome:'Linhagem',descricao:'Escolha a origem de seus poderes inatos.',opcoes:secondaryOptions};
    html+=baseRenderChoice(secondaryDef,'class');
    const secondary=selectedOption(secondaryDef,'class');
    if(secondary){
      (secondary.escolhas_terciarias||[]).forEach(choice=>{html+=baseRenderChoice(resolvedClassChoice(choice,def.id),'class')});
      if(secondary.estagios?.length){
        html+='<div class="choice-section"><h4>Heranças da linhagem</h4><div class="ability-list">'+secondary.estagios.map(stage=>abilityHtml({nome:stage.nome,descricao:stage.descricao})).join('')+'</div></div>';
      }
    }
  }
  return html;
}

function golemEnergyDetails(def){
  if(def.id!=='golem_desperto_fonte'||state.identity.raceChoices[def.id]!=='Elemental')return '';
  const chassis=state.identity.raceChoices.golem_desperto_chassi;
  let options=[
    {id:'agua',nome:'Água',descricao:'Fonte elemental ligada à água; imunidade ao dano mágico de frio.'},
    {id:'ar',nome:'Ar',descricao:'Fonte elemental ligada ao ar; imunidade ao dano mágico de eletricidade.'},
    {id:'fogo',nome:'Fogo',descricao:'Fonte elemental ligada ao fogo; imunidade ao dano mágico de fogo.'},
    {id:'terra',nome:'Terra',descricao:'Fonte elemental ligada à terra; imunidade ao dano mágico de ácido.'}
  ];
  if(chassis==='golem_desperto_carne')options=options.filter(option=>!['agua','fogo'].includes(option.id));
  if(chassis==='golem_desperto_gelo_eterno')options=options.filter(option=>option.id!=='fogo');
  return baseRenderChoice({id:'golem_fonte_elemento',nome:'Elemento da fonte',descricao:'A escolha do elemento é permanente.',opcoes:options},'race');
}

const baseRenderChoice=renderChoice;
renderChoice=function(def,source='race'){
  const html=baseRenderChoice(def,source);
  if(source==='class')return html+renderClassChoiceDetails(def);
  return html+golemEnergyDetails(def);
};

function additionalChoicesComplete(){
  if(state.identity.raceId==='humano'&&!state.identity.raceChoices.humano_versatil)return false;
  if(state.identity.raceId==='duende'&&!state.identity.raceChoices.duende_tabu)return false;
  for(const def of classChoiceDescriptors(classById(state.identity.classId))){
    const primary=selectedOption(def,'class');
    if(!primary)continue;
    const secondaryOptions=primary.escolhas_secundarias||[];
    if(!secondaryOptions.length)continue;
    const secondaryDef={id:def.id+'__secundaria',opcoes:secondaryOptions};
    const secondary=selectedOption(secondaryDef,'class');
    if(!secondary)return false;
    for(const choice of secondary.escolhas_terciarias||[]){
      if(!state.identity.classChoices[def.id+'__'+choice.id])return false;
    }
  }
  if(state.identity.raceId==='golem_desperto'){
    const source=state.identity.raceChoices.golem_desperto_fonte;
    const chassis=state.identity.raceChoices.golem_desperto_chassi;
    if(source==='Elemental'){
      const element=state.identity.raceChoices.golem_fonte_elemento;
      const forbidden=chassis==='golem_desperto_carne'?['agua','fogo']:chassis==='golem_desperto_gelo_eterno'?['fogo']:[];
      if(!element||forbidden.includes(element))return false;
    }
    if(source==='Vapor'&&['golem_desperto_carne','golem_desperto_gelo_eterno'].includes(chassis))return false;
  }
  return true;
}

const basePhaseIsComplete=phaseIsComplete;
phaseIsComplete=function(step){
  return basePhaseIsComplete(step)&&(step!==1||additionalChoicesComplete());
};

renderNav=function(){
  const nav=document.getElementById('phaseNav');
  if(!nav)return;
  const visibleSteps=PHASES.map((p,i)=>i+1).filter(s=>!(typeof shouldSkipPhase==='function'&&shouldSkipPhase(s)));
  nav.innerHTML='<div class="phase-nav-title">Etapas</div>'+PHASES.map((phase,index)=>{
    const number=index+1;
    if(typeof shouldSkipPhase==='function'&&shouldSkipPhase(number))return '';
    const visualIdx=visibleSteps.indexOf(number);
    const visualNum=visualIdx>=0?visualIdx+1:number;
    const isLocked=typeof isPhaseLockedInLevelUp==='function'?isPhaseLockedInLevelUp(number):Boolean(state.isLevelingUp&&number<=6);
    const done=state.completed.includes(number)||(number===state.step&&phaseIsComplete(number));
    return '<button class="phase-button '+(number===state.step?'active ':'')+(done?'done ':'')+(isLocked?'locked-phase ':'')+'" data-step="'+number+'" '+(isLocked?'disabled title="Bloqueado durante avanço de nível"':'')+'><span class="phase-number">'+(isLocked?'#':visualNum)+'</span><span class="phase-label">'+esc(phase[0])+'</span><span class="phase-state">'+(isLocked?'':done?'':'')+'</span></button>';
  }).join('');
  const activeBtn=nav.querySelector('.phase-button.active');
  if(activeBtn&&typeof activeBtn.scrollIntoView==='function'){
    activeBtn.scrollIntoView({inline:'center',block:'nearest',behavior:'smooth'});
  }
};

// Trata a remoção de poderes raciais antes do manipulador geral.
document.addEventListener('change',event=>{
  if(event.target.dataset.action!=='race-power')return;
  event.stopImmediatePropagation();
  const groupId=event.target.dataset.group;
  const group=racePowerGroups().find(item=>item.id===groupId);
  const selected=state.powers.raceGroups[groupId]||[];
  const id=event.target.value;
  if(event.target.checked){
    if(selected.length>=Number(group?.quantity||0)){
      event.target.checked=false;
      toast('O limite desta escolha já foi alcançado.');
    }else{selected.push(id);state.powers.raceGroups[groupId]=selected;}
  }else{
    state.powers.raceGroups[groupId]=selected.filter(value=>value!==id);
  }
  renderStage();
},true);

parsePowerRequirements=function(power){
  const text=power?.preRequisitosTexto||'',attrs=[],skills=[];
  const attributePatterns={for:'For(?:ça)?',des:'Des(?:treza)?',con:'Con(?:stituição)?',int:'Int(?:eligência)?',sab:'Sab(?:edoria)?',car:'Car(?:isma)?'};
  Object.entries(attributePatterns).forEach(([id,pattern])=>{
    for(const match of text.matchAll(new RegExp('\\b'+pattern+'\\s*([0-9]+)','gi')))attrs.push([id,Number(match[1])]);
  });
  for(const [id,name] of SKILLS){
    if(new RegExp('treinad[oa] em[^.;]*\\b'+name+'\\b','i').test(text))skills.push(id);
  }
  const level=Number((text.match(/(\d+)\s*[º°]?\s*nível/i)||[])[1]||2);
  return{attrs,skills,level,text};
};

function classPowerSourceIds(classId){
  const ids=[classId];
  let parent=DATA.classInheritance?.[classId];
  while(parent&&!ids.includes(parent)){ids.push(parent);parent=DATA.classInheritance?.[parent]}
  return ids;
}

function availableClassPowers(classId){
  const ids=classPowerSourceIds(classId);
  const powers=DATA.classPowers.filter(power=>(power.classeIds||[]).some(id=>ids.includes(id)));
  if(classId==='arcanista'||ids.includes('arcanista')){
    const path=typeof spellPath==='function'?spellPath():['bruxo','mago','feiticeiro'].find(p=>Object.values(state?.identity?.classChoices||{}).some(val=>(typeof slug==='function'?slug(val):String(val).toLowerCase())===p))||'';
    return powers.filter(power=>{
      const pre=power?.preRequisitosTexto||'';
      if(/bruxo\s+ou\s+mago/i.test(pre)){
        if(path && path!=='bruxo' && path!=='mago') return false;
      } else {
        if(power.id==='arcanista_caldeirao_do_bruxo'||/\bBruxo\b/i.test(pre)){
          if(path && path!=='bruxo') return false;
        }
        if(power.id==='arcanista_escriba_arcano'||/\bMago\b/i.test(pre)){
          if(path && path!=='mago') return false;
        }
        if(/\bFeiticeiro\b/i.test(pre)){
          if(path && path!=='feiticeiro') return false;
        }
      }
      return true;
    });
  }
  return powers;
}

classFutureRequirements=function(){
  const result={attrs:[],skills:[]};
  availableClassPowers(state.identity.classId).forEach(power=>{
    const requirement=parsePowerRequirements(power);
    requirement.attrs.forEach(([attr,value])=>result.attrs.push({attr,value,level:requirement.level,power:power.nome}));
    requirement.skills.forEach(skill=>result.skills.push({skill,level:requirement.level,power:power.nome}));
  });
  return result;
};

function classSelectionsComplete(){
  const cls=classById(state.identity.classId);
  const fixed=cls?.caracteristicas?.pericias?.fixas||[];
  if(mandatoryClassSkills().length!==fixed.length)return false;
  for(const def of classChoiceDescriptors(cls)){
    const primary=selectedOption(def,'class');
    if(!primary)return false;
    const secondaryOptions=primary.escolhas_secundarias||[];
    if(!secondaryOptions.length)continue;
    const secondaryDef={id:def.id+'__secundaria',opcoes:secondaryOptions};
    const secondary=selectedOption(secondaryDef,'class');
    if(!secondary)return false;
    for(const choice of secondary.escolhas_terciarias||[]){
      if(!state.identity.classChoices[def.id+'__'+choice.id])return false;
    }
  }
  return true;
}

function raceSelectionsComplete(){
  if(!requiredRaceChoicesComplete())return false;
  if(state.identity.raceId==='duende'){
    if(!state.identity.raceChoices.duende_tabu)return false;
    if(state.identity.raceChoices.duende_tabu==='personalizado'&&!String(state.identity.duendeTabuText||'').trim())return false;
    if(state.identity.raceChoices.duende_tabu==='personalizado'&&!state.identity.duendeTabuPenalty)return false;
    if(state.identity.raceChoices.duende_tabu==='personalizado'&&state.identity.duendeTabuPenalty==='Outra consequência (com o mestre)'&&!String(state.identity.duendeTabuCustomPenalty||'').trim())return false;
  }
  if(state.identity.raceId==='golem_desperto'){
    const source=state.identity.raceChoices.golem_desperto_fonte;
    const chassis=state.identity.raceChoices.golem_desperto_chassi;
    if(source==='Elemental'){
      const element=state.identity.raceChoices.golem_fonte_elemento;
      const forbidden=chassis==='golem_desperto_carne'?['agua','fogo']:chassis==='golem_desperto_gelo_eterno'?['fogo']:[];
      if(!element||forbidden.includes(element))return false;
    }
    if(source==='Vapor'&&['golem_desperto_carne','golem_desperto_gelo_eterno'].includes(chassis))return false;
  }
  const race=raceById(state.identity.raceId);
  if(state.identity.openRaceBonusEnabled&&isRaceEligibleForOpenRaces(race)){
    const needed=raceFixedModifiers(race).length;
    const allocated=Object.keys(state.identity.openRaceAllocations||{}).length;
    if(allocated<needed)return false;
  }
  return true;
}

function renderIdentityClass(){
  const cls=classById(state.identity.classId);
  const fixedSkills=cls?.caracteristicas?.pericias?.fixas||[];
  const classRequired=fixedSkills.map((entry,index)=>{
    if(entry.tipo==='escolha')return '<label class="field"><span>Escolha uma</span><select class="select" data-field="class-required" data-index="'+index+'"><option value="">Escolha uma</option>'+entry.opcoes.map(option=>'<option value="'+option.id+'" '+(state.identity.classRequiredChoices[index]===option.id?'selected':'')+'>'+esc(SKILL_LABEL[option.id]||option.id)+'</option>').join('')+'</select></label>';
    if(skillTokenFromName(entry.id)==='oficio'){
      const selected=state.identity.classRequiredOffices[index];
      return '<div class="field"><span>Ofício obrigatório da classe</span><button class="button '+(selected?'selected':'')+'" type="button" data-action="class-fixed-office" data-index="'+index+'">'+esc(selected?skillDisplayName(selected):'Escolher especialização de Ofício')+'</button></div>';
    }
    return '';
  }).join('');
  const mandatory=mandatoryClassSkills();
  const classChoices=classChoiceDescriptors(cls).map(def=>renderChoice(def,'class')).join('');
  const abilities=(cls?.habilidades||[]).filter(ability=>Number(ability.nivel)===1).map(abilityHtml).join('');
  return '<div class="phase-content-grid"><div class="phase-column">'+
    panel('Identidade','<div class="grid two"><label class="field"><span>Nome do personagem</span><input class="input" data-field="characterName" maxlength="80" value="'+esc(state.identity.characterName)+'" placeholder="Ex. Lisandra de Valkaria"></label><label class="field"><span>Nome do jogador</span><input class="input" data-field="playerName" maxlength="80" value="'+esc(state.identity.playerName)+'" placeholder="Quem vai jogar"></label></div><div class="grid two" style="margin-top:11px"><label class="field"><span>Classe inicial</span><select class="select" data-field="classId">'+DATA.classes.map(option=>'<option value="'+option.id+'" '+(option.id===cls?.id?'selected':'')+'>'+esc(option.nome)+' · '+esc(BOOKS[option.livroOrigemId]||option.livroOrigemId)+'</option>').join('')+'</select></label><label class="field"><span>Nível planejado</span><input class="input" data-field="plannedLevel" type="number" min="1" max="20" value="'+state.identity.plannedLevel+'"></label></div>')+
    panel('Resumo da classe','<div class="tag-row"><span class="tag">PV '+cls.caracteristicas?.pv?.inicial+' + Con</span><span class="tag">PM '+cls.caracteristicas?.pm?.porNivel+'/nível</span></div><div class="choice-section"><h4>Perícias obrigatórias</h4><div class="tag-row">'+(mandatory.length?mandatory.map(id=>'<span class="tag">'+esc(skillDisplayName(id))+'</span>').join(''):'<span class="tag">Escolha pendente</span>')+'</div></div>')+
    '</div><div class="phase-column">'+
    panel('Classe · '+cls.nome,(classRequired?'<div class="grid two" style="margin-top:12px">'+classRequired+'</div>':'')+classChoices+'<div class="choice-section"><h4>Habilidades do 1º nível</h4><div class="ability-list">'+abilities+'</div></div>')+
    '</div></div>';
}

function allocationValues(key){
  if(key==='raceAttrs')return state.identity.raceAttrs;
  return state.identity.raceSpecialAttrs[key]||state.identity.raceSubAttrs[key]||[];
}

function raceAllocationSources(){
  const race=raceById(state.identity.raceId),sources=[];
  if(race?.atributos?.flexiveis){
    const config=Object.assign({},race.atributos.flexiveis);
    if(race.id==='kallyanach')config.permitirRepetir=true;
    sources.push({key:'raceAttrs',label:'Raça',config});
  }
  (race?.habilidades?.selecionadas||[]).forEach(def=>{
    if(race?.id==='duende'&&def.id==='duende_natureza')return;
    if(def.tipo==='atributos_flexiveis'){
      let config=def;
      if(race?.id==='duende'&&def.id==='duende_dons'){
        const isAnimal=state.identity.raceChoices.duende_natureza==='animal';
        config=Object.assign({},def,{
          quantidade:isAnimal?3:2,
          maxPorAtributo:isAnimal?2:1,
          permitirRepetir:isAnimal
        });
      }
      sources.push({key:def.id,label:def.nome||'Habilidade',config});
      return;
    }
    const option=selectedRaceOption(def);
    if(option?.atributosFlexiveis){
      if(race?.id==='duende')return;
      sources.push({key:def.id,label:def.nome||choiceName(option),config:option.atributosFlexiveis});
    }
  });
  return sources;
}
