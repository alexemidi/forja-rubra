function pendingGeneralPowerSlot(){return Array.from({length:generalPowerSlots()},(_,i)=>i).find(i=>!state.powers.general[i])}
function generalPowerDraftAllowed(){
  const index=Number(state.powers.activeSlot??pendingGeneralPowerSlot()??0);
  const power=powerById(state.powers.previewId);
  if(index===undefined||!power)return false;
  const otherChosen=(state.powers.general||[]).filter((id,i)=>i!==index&&Boolean(id));
  if(otherChosen.includes(power.id))return false;
  const req=typeof originPowerSlotRequirement==='function'?originPowerSlotRequirement(index):null;
  return (!req||power.categoria===req.category)&&generalPowerEligibility(power).ok;
}

function getPhase6SubStages(){
  const stages=[];
  const hasRaceGroups=typeof racePowerGroups==='function'&&racePowerGroups().some(g=>Number(g.quantity||0)>0);
  if(hasRaceGroups){
    stages.push({type:'race',label:'Poderes de Raça'});
  }
  const genSlots=typeof generalPowerSlots==='function'?generalPowerSlots():0;
  for(let i=0;i<genSlots;i++){
    stages.push({type:'general',slot:i,label:'Poder Geral '+(i+1)});
  }
  const originChoices=typeof originGeneralPowerOptions==='function'?originGeneralPowerOptions():[];
  originChoices.forEach(opt=>{
    stages.push({type:'origin_general',optionId:opt.id,label:'Poder da Origem ('+(opt.name||'Geral')+')'});
  });
  if(typeof hasDuploFeerico==='function'&&hasDuploFeerico()){
    stages.push({type:'duplo_feerico',label:'Duplo Feérico'});
  }
  if(typeof hasCosmopolita==='function'&&hasCosmopolita()){
    stages.push({type:'cosmopolita',label:'Origem Regional (Cosmopolita)'});
  }
  if(typeof hasFuturaLenda==='function'&&hasFuturaLenda()){
    stages.push({type:'futura_lenda',label:'Origem Regional (Futura Lenda)'});
  }
  if(typeof hasCriacaoDosDeuses==='function'&&hasCriacaoDosDeuses()){
    stages.push({type:'criacao_dos_deuses',label:'Origem (Criação dos Deuses)'});
  }
  return stages;
}

function isPhase6StageComplete(currentStage, curIdx){
  if(!currentStage){
    return typeof isCurrentPhaseComplete==='function'
      ? isCurrentPhaseComplete()
      : (typeof phaseIsComplete==='function'?phaseIsComplete(6):true);
  }
  if(currentStage.type==='race'){
    return typeof racePowerGroups==='function'&&racePowerGroups().every(g=>(state.powers?.raceGroups?.[g.id]||[]).length===Number(g.quantity||0));
  }
  if(currentStage.type==='general'){
    const curSlot=currentStage.slot??curIdx;
    const hasCurrent=Boolean(state.powers?.general?.[curSlot]);
    const isDraft=Boolean(state.powers?.previewId);
    return (isDraft&&typeof generalPowerDraftAllowed==='function'&&generalPowerDraftAllowed())||hasCurrent;
  }
  if(currentStage.type==='cosmopolita'){
    const hasCurrent=Boolean(state.powers?.cosmopolitaPower);
    const draftKey=state.powers?.cosmopolitaPreview;
    const draftOk=draftKey?(typeof cosmopolitaEligiblePowers==='function'&&Boolean(cosmopolitaEligiblePowers().find(o=>o.cosmopolitaKey===draftKey)?.verdict?.ok)):false;
    return draftOk||hasCurrent;
  }
  if(currentStage.type==='futura_lenda'){
    return typeof selectedFuturaLendaPower==='function'&&Boolean(selectedFuturaLendaPower());
  }
  if(currentStage.type==='duplo_feerico'){
    return typeof selectedDuploFeericoPower==='function'&&Boolean(selectedDuploFeericoPower());
  }
  if(currentStage.type==='criacao_dos_deuses'){
    return typeof selectedCriacaoDosDeusesDeity==='function'&&Boolean(selectedCriacaoDosDeusesDeity());
  }
  if(currentStage.type==='origin_general'){
    return Boolean(state.powers?.originGeneral?.[currentStage.optionId]);
  }
  return true;
}

if(typeof window!=='undefined'){
  window.getPhase6SubStages=getPhase6SubStages;
  window.isPhase6StageComplete=isPhase6StageComplete;
}
if(typeof globalThis!=='undefined'){
  globalThis.getPhase6SubStages=getPhase6SubStages;
  globalThis.isPhase6StageComplete=isPhase6StageComplete;
}

function syncSequentialPowerFooter(){
  const next=document.getElementById('nextButton');if(!next)return;
  const stepPrev=document.getElementById('stepPrevButton');
  const stepNext=document.getElementById('stepNextButton');
  if(state.step===6){
    const stages=typeof getPhase6SubStages==='function'?getPhase6SubStages():[];
    const totalStages=stages.length;

    if(totalStages<=1){
      if(stepPrev)stepPrev.hidden=true;
      if(stepNext)stepNext.hidden=true;
      next.hidden=false;
      next.textContent='Avançar →';
      const canAdvanceCurrent=isPhase6StageComplete(stages[0], 0);
      next.disabled=!canAdvanceCurrent;
      next.classList.toggle('is-incomplete',!canAdvanceCurrent);
      return;
    }

    let curIdx=Number(state.powers.phase6StageIndex??state.powers.activeSlot??0);
    if(!Number.isInteger(curIdx)||curIdx<0||curIdx>=totalStages){curIdx=0;state.powers.phase6StageIndex=0;}
    const currentStage=stages[curIdx];
    const isLast=curIdx===totalStages-1;
    const isFirst=curIdx===0;
    const canAdvanceCurrent=isPhase6StageComplete(currentStage, curIdx);

    if(stepPrev){
      stepPrev.hidden=isFirst;
      stepPrev.disabled=isFirst;
      stepPrev.textContent='← Poder anterior';
    }
    if(!isLast){
      next.hidden=true;
      next.disabled=true;
      if(stepNext){
        stepNext.hidden=false;
        stepNext.disabled=!canAdvanceCurrent;
        stepNext.textContent='Próximo Poder →';
        stepNext.classList.toggle('is-incomplete',!canAdvanceCurrent);
      }
    }else{
      if(stepNext)stepNext.hidden=true;
      next.hidden=false;
      next.textContent='Avançar →';
      next.disabled=!canAdvanceCurrent;
      next.classList.toggle('is-incomplete',!canAdvanceCurrent);
    }
  }else if(state.step===10||state.step===9){
    if(typeof syncProgressionFooter==='function')syncProgressionFooter();
  }else{
    next.hidden=false;
    next.disabled=false;
  }
}

if(typeof window!=='undefined'){
  window.syncSequentialPowerFooter=syncSequentialPowerFooter;
}
if(typeof globalThis!=='undefined'){
  globalThis.syncSequentialPowerFooter=syncSequentialPowerFooter;
}

function triggerFilterPulse(){
  let chips;
  if(state.step===9){
    chips=document.querySelectorAll('[data-action="progression-source"][data-value="class"], [data-action="progression-source"][data-value="general"]');
  }else{
    chips=document.querySelectorAll('.power-filterbar .filter-chip');
  }
  chips.forEach(chip=>{
    chip.classList.remove('filter-pulse');
    void chip.offsetWidth;
    chip.classList.add('filter-pulse');
  });
  setTimeout(()=>{
    chips.forEach(chip=>chip.classList.remove('filter-pulse'));
  },1500);
}

function checkPowerPhaseNotice(){
  if(state.finished||state.sheetView){
    const modal=document.getElementById('powerFilterNoticeModal');
    if(modal)modal.hidden=true;
    return;
  }
  if(state.step===6&&!state.notices?.filterNoticePhase6){
    state.notices=state.notices||{};
    state.notices.filterNoticePhase6=true;
    persist();
    const modal=document.getElementById('powerFilterNoticeModal');
    if(modal){
      document.getElementById('powerFilterNoticeTitle').innerHTML='Filtros de Poderes Gerais';
      document.getElementById('powerFilterNoticeBody').innerHTML='<p>Você pode utilizar os filtros no topo para filtrar o tipo de poder desejado por <strong>categoria</strong> (Combate, Destino, Magia, Tormenta) e <strong>disponibilidade</strong>.</p>';
      modal.hidden=false;
    }
  }else if((state.step===10||state.step===9)&&!state.notices?.filterNoticePhase9){
    state.notices=state.notices||{};
    state.notices.filterNoticePhase9=true;
    persist();
    const modal=document.getElementById('powerFilterNoticeModal');
    if(modal){
      document.getElementById('powerFilterNoticeTitle').innerHTML='Escolha de Poder da Progressão';
      document.getElementById('powerFilterNoticeBody').innerHTML='<p>Neste nível, você pode escolher um <strong>poder de classe</strong> ou optar por <strong>poderes gerais</strong> (de combate, destino, magia ou tormenta). Utilize os filtros no topo para navegar entre as opções.</p>';
      modal.hidden=false;
    }
  }
}

document.addEventListener('click',event=>{
  if(event.target.closest('#powerFilterNoticeConfirm')){
    const modal=document.getElementById('powerFilterNoticeModal');
    if(modal)modal.hidden=true;
    triggerFilterPulse();
    return;
  }
  if(state.step!==6)return;
  const prevBtn=event.target.closest('#stepPrevButton,[data-action="general-power-prev"],[data-action="cosmopolita-prev"]');
  if(prevBtn){
    event.preventDefault();event.stopImmediatePropagation();
    const stages=typeof getPhase6SubStages==='function'?getPhase6SubStages():[];
    let curIdx=Number(state.powers.phase6StageIndex??state.powers.activeSlot??0);
    if(curIdx>0){
      state.powers.phase6StageIndex=curIdx-1;
      const prevStage=stages[curIdx-1];
      if(prevStage?.type==='general'){
        state.powers.activeSlot=prevStage.slot;
        state.powers.previewId=state.powers.general[prevStage.slot]||'';
      }
      persist();renderStage();window.scrollTo({top:0,behavior:'smooth'});
    }
    return;
  }
  const nextPwrBtn=event.target.closest('#stepNextButton,[data-action="general-power-next"]');
  if(nextPwrBtn){
    event.preventDefault();event.stopImmediatePropagation();
    const stages=typeof getPhase6SubStages==='function'?getPhase6SubStages():[];
    const totalStages=stages.length||(typeof generalPowerSlots==='function'?generalPowerSlots():0)||1;
    let curIdx=Number(state.powers.phase6StageIndex??state.powers.activeSlot??0);
    const currentStage=stages[curIdx];

    if(!currentStage||currentStage.type==='general'){
      const curSlot=currentStage?currentStage.slot:curIdx;
      if(currentStage?.type==='general'||(typeof generalPowerSlots==='function'&&generalPowerSlots()>0)){
        if(state.powers.previewId){
          if(typeof generalPowerDraftAllowed==='function'&&!generalPowerDraftAllowed()){
            toast('Este poder não atende aos pré-requisitos.', 'warning');
            return;
          }
          state.powers.general[curSlot]=state.powers.previewId;
          state.powers.previewId='';
        }else if(!state.powers.general?.[curSlot]){
          toast('Selecione um poder geral na lista antes de avançar.', 'warning');
          return;
        }
      }
    }else if(currentStage.type==='cosmopolita'){
      const draftKey=state.powers.cosmopolitaPreview;
      if(draftKey){
        const opt=typeof cosmopolitaEligiblePowers==='function'?cosmopolitaEligiblePowers().find(o=>o.cosmopolitaKey===draftKey):null;
        if(!opt||!opt.verdict.ok){
          toast('Este poder não atende aos pré-requisitos.', 'warning');
          return;
        }
        state.powers.cosmopolitaPower=draftKey;
        state.powers.cosmopolitaPreview='';
      }else if(!state.powers.cosmopolitaPower){
        toast('Selecione um poder de Cosmopolita antes de avançar.', 'warning');
        return;
      }
    }else if(currentStage.type==='futura_lenda'){
      if(typeof hasFuturaLenda==='function'&&hasFuturaLenda()&&!selectedFuturaLendaPower()){
        toast('Selecione um poder de classe de 2º nível para Futura Lenda antes de avançar.', 'warning');
        return;
      }
    }else if(currentStage.type==='duplo_feerico'){
      if(typeof hasDuploFeerico==='function'&&hasDuploFeerico()&&!selectedDuploFeericoPower()){
        toast('Selecione uma habilidade de classe de 1º nível para Duplo Feérico antes de avançar.', 'warning');
        const target=document.querySelector('.duplo-feerico-row')||document.querySelector('[data-action^="duplo-feerico"]');
        target?.classList.add('validation-target');
        return;
      }
    }else if(currentStage.type==='criacao_dos_deuses'){
      if(typeof hasCriacaoDosDeuses==='function'&&hasCriacaoDosDeuses()&&!selectedCriacaoDosDeusesDeity()){
        toast('Selecione uma divindade criadora para a Criação dos Deuses antes de avançar.', 'warning');
        return;
      }
    }else if(currentStage.type==='origin_general'){
      if(!state.powers?.originGeneral?.[currentStage.optionId]){
        toast('Selecione o poder concedido pela origem antes de avançar.', 'warning');
        return;
      }
    }else if(currentStage.type==='race'){
      const raceOk=typeof racePowerGroups==='function'&&racePowerGroups().every(g=>(state.powers.raceGroups[g.id]||[]).length===Number(g.quantity||0));
      if(!raceOk){
        toast('Selecione os poderes raciais restantes para continuar.', 'warning');
        return;
      }
    }

    if(curIdx<totalStages-1){
      state.powers.phase6StageIndex=curIdx+1;
      const nextStage=stages[curIdx+1];
      if(nextStage?.type==='general'){
        state.powers.activeSlot=nextStage.slot;
        state.powers.previewId=state.powers.general[nextStage.slot]||'';
      }
      persist();renderStage();window.scrollTo({top:0,behavior:'smooth'});
    }
    return;
  }
  const button=event.target.closest('[data-action="power-preview"],[data-action="power-select"]');
  if(button){
    event.preventDefault();event.stopImmediatePropagation();
    state.powers.activeSlot=Number(state.powers.activeSlot??pendingGeneralPowerSlot()??0);
    state.powers.previewId=button.dataset.powerId;
    renderStage();document.querySelector('[data-action="power-preview"][data-power-id="'+button.dataset.powerId+'"]')?.focus({preventScroll:true});return;
  }
  if(event.target.closest('#nextButton')){
    event.preventDefault();event.stopImmediatePropagation();
    const stages=typeof getPhase6SubStages==='function'?getPhase6SubStages():[];
    const totalStages=stages.length;
    let curIdx=Number(state.powers.phase6StageIndex??state.powers.activeSlot??0);
    const currentStage=stages[curIdx] || stages[0];

    if(!currentStage||currentStage.type==='general'){
      const curSlot=currentStage?currentStage.slot:curIdx;
      if(currentStage?.type==='general'||(typeof generalPowerSlots==='function'&&generalPowerSlots()>0)){
        if(state.powers.previewId){
          if(typeof generalPowerDraftAllowed==='function'&&!generalPowerDraftAllowed()){
            toast('Este poder não atende aos pré-requisitos.', 'warning');
            return;
          }
          state.powers.general[curSlot]=state.powers.previewId;
          state.powers.previewId='';
        }else if(!state.powers.general?.[curSlot]){
          toast('Selecione um poder geral na lista para continuar.', 'warning');
          return;
        }
      }
    }else if(currentStage.type==='cosmopolita'){
      const draftKey=state.powers.cosmopolitaPreview;
      if(draftKey){
        const opt=typeof cosmopolitaEligiblePowers==='function'?cosmopolitaEligiblePowers().find(o=>o.cosmopolitaKey===draftKey):null;
        if(!opt||!opt.verdict.ok){
          toast('Este poder não atende aos pré-requisitos.', 'warning');
          return;
        }
        state.powers.cosmopolitaPower=draftKey;
        state.powers.cosmopolitaPreview='';
      }else if(!state.powers.cosmopolitaPower){
        toast('Selecione um poder de Cosmopolita para continuar.', 'warning');
        return;
      }
    }else if(currentStage.type==='futura_lenda'){
      if(typeof hasFuturaLenda==='function'&&hasFuturaLenda()&&!selectedFuturaLendaPower()){
        toast('Selecione um poder de classe de 2º nível para Futura Lenda para continuar.', 'warning');
        return;
      }
    }else if(currentStage.type==='duplo_feerico'){
      if(typeof hasDuploFeerico==='function'&&hasDuploFeerico()&&!selectedDuploFeericoPower()){
        toast('Selecione uma habilidade de classe de 1º nível para Duplo Feérico para continuar.', 'warning');
        const target=document.querySelector('.duplo-feerico-row')||document.querySelector('[data-action^="duplo-feerico"]');
        target?.classList.add('validation-target');
        return;
      }
    }else if(currentStage.type==='criacao_dos_deuses'){
      if(typeof hasCriacaoDosDeuses==='function'&&hasCriacaoDosDeuses()&&!selectedCriacaoDosDeusesDeity()){
        toast('Selecione uma divindade criadora para a Criação dos Deuses para continuar.', 'warning');
        return;
      }
    }else if(currentStage.type==='origin_general'){
      if(!state.powers?.originGeneral?.[currentStage.optionId]){
        toast('Selecione o poder concedido pela origem para continuar.', 'warning');
        return;
      }
    }else if(currentStage.type==='race'){
      const raceOk=typeof racePowerGroups==='function'&&racePowerGroups().every(g=>(state.powers.raceGroups[g.id]||[]).length===Number(g.quantity||0));
      if(!raceOk){
        toast('Selecione os poderes raciais restantes para continuar.', 'warning');
        return;
      }
    }

    const missing=typeof powerMissingChoices==='function'?powerMissingChoices():[];
    if(missing.length>0){
      toast('Pendência na escolha de poderes: '+missing[0].message, 'warning');
      return;
    }

    if(!state.completed.includes(6))state.completed.push(6);
    state.step=typeof getNextLinearStep==='function'?getNextLinearStep(6):nextIncompletePhase(6);
    if(typeof persistNow==='function')persistNow();else persist();
    renderStage();window.scrollTo({top:0,behavior:'smooth'});
    return;
  }
},true);
document.addEventListener('keydown',event=>{
  if(!['ArrowUp','ArrowDown'].includes(event.key)||/INPUT|TEXTAREA|SELECT/.test(event.target.tagName))return;
  if(state.step===6){
    const buttons=[...document.querySelectorAll('[data-action="power-preview"]')].filter(b=>!b.hidden&&b.style.display!=='none');
    const at=buttons.findIndex(b=>b.dataset.powerId===state.powers.previewId),next=at+(event.key==='ArrowDown'?1:-1);
    const target=buttons[at<0?0:Math.max(0,Math.min(buttons.length-1,next))];
    if(target){event.preventDefault();event.stopImmediatePropagation();target.click()}
  }else if(state.step===9){
    const activeIndex=progressionActivePowerIndex();
    const list=document.querySelector('[data-progression-power-list="'+activeIndex+'"]');
    if(!list)return;
    const buttons=[...list.querySelectorAll('[data-action="class-power-preview"]')].filter(b=>!b.hidden&&b.style.display!=='none');
    const row=state.progression[activeIndex];
    const at=buttons.findIndex(b=>b.dataset.powerId===(row?.previewPowerId||row?.powerId)),next=at+(event.key==='ArrowDown'?1:-1);
    const target=buttons[at<0?0:Math.max(0,Math.min(buttons.length-1,next))];
    if(target){event.preventDefault();event.stopImmediatePropagation();target.click()}
  }
},true);



