

function invalidateDependentProgressionPowers(fromIndex){
  let invalidated=false;
  for(let i=fromIndex+1; i<state.progression.length; i++){
    const row=state.progression[i];
    if(!row.powerId)continue;
    const power=progressionPowerById(row.powerId);
    if(!power)continue;
    const verdict=progressionPowerVerdict(power, i);
    if(!verdict?.ok){
      row.powerId='';
      row.powerChoice='';
      row.previewPowerId='';
      row.previewPowerChoice='';
      invalidated=true;
    }
  }
  return invalidated;
}
function getNextLevelUpPendingPhase(){
  const missingSkills = typeof skillMissingChoices === 'function' ? skillMissingChoices() : [];
  if (state.returnToProgressionAfterSkill || missingSkills.length > 0) return 4;

  const missingDeity = typeof deityMissingChoices === 'function' ? deityMissingChoices() : [];
  if (missingDeity.length > 0) return 5;

  const missingPowers = typeof powerMissingChoices === 'function' ? powerMissingChoices() : [];
  if (missingPowers.length > 0) return 6;

  const hasSpells = typeof characterHasSpellChoices === 'function' ? characterHasSpellChoices() : false;
  const missingSpells = typeof spellMissingChoices === 'function' ? spellMissingChoices() : [];
  if (hasSpells && missingSpells.length > 0) return 7;

  const plan = typeof initialItemPlan === 'function' ? initialItemPlan() : [];
  const savedArsenal = typeof arsenalState === 'function' ? arsenalState() : null;
  if (savedArsenal) {
    const hasUnfinishedItemGrant = plan.some(choice => {
      const grantId = typeof itemChoiceGrantId === 'function' ? itemChoiceGrantId(choice) : choice.id;
      return choice.source === 'class' && !savedArsenal.grants?.[grantId];
    });
    if (hasUnfinishedItemGrant) return 8;
  }

  const missingPartners = typeof partnerMissingChoices === 'function' ? partnerMissingChoices() : [];
  if (missingPartners.length > 0) return 9;

  return null;
}
if(typeof window !== 'undefined'){
  window['getNextLevelUpPendingPhase'] = getNextLevelUpPendingPhase;
}

document.addEventListener('click',event=>{const button=event.target.closest?.('[data-action]');if(!button)return;const index=Number(button.dataset.index),row=state.progression[index];if(!row)return;if(button.dataset.action==='progression-open-level'){const closing=progressionActivePowerIndex()===index&&Number(state.progressionCollapsedIndex)!==index;setProgressionEditingIndex(index);state.progressionCollapsedIndex=closing?index:-1;renderStage();setTimeout(()=>document.querySelectorAll('.progression-level-row')[index]?.scrollIntoView({behavior:'smooth',block:'start'}),30)}else if(button.dataset.action==='progression-source'){row.powerSourceFilter=button.dataset.value;row.previewPowerId='';row.previewPowerChoice='';renderStage()}else if(button.dataset.action==='progression-category'){row.powerCategoryFilter=button.dataset.value;row.previewPowerId='';renderStage()}else if(button.dataset.action==='progression-status'){row.powerStatusFilter=button.dataset.value;row.previewPowerId='';renderStage()}else if(button.dataset.action==='class-power-preview'){event.preventDefault();previewProgressionPower(index,button.dataset.powerId,{pageScroll:window.scrollY,listScroll:button.closest?.('.power-list')?.scrollTop})}else if(button.dataset.action==='class-power-attribute'){row.previewPowerChoice=Number(button.dataset.dir)<0?'':button.dataset.attr;renderStage();syncProgressionFooter()}else if(button.dataset.action==='class-power-remove'){if(state.isLevelingUp&&index<state.progression.length-1){toast('Durante a subida de nível, apenas as escolhas do novo nível podem ser alteradas.','warning');return;}row.powerId='';row.powerChoice='';row.previewPowerChoice='';invalidateDependentProgressionPowers(index);setProgressionEditingIndex(index);state.progressionCollapsedIndex=-1;renderStage();syncProgressionFooter()}},true);
document.addEventListener('input',event=>{
  const input=(event.target as HTMLElement)?.closest?.('[data-action="progression-power-search"]') as HTMLInputElement;
  if(!input)return;
  const index=Number(input.dataset.index),row=state?.progression?.[index];
  if(!row)return;
  row.powerSearchQuery=input.value;
  const q=input.value.trim().toLowerCase();
  const list=document.querySelector(`[data-progression-power-list="${index}"]`);
  if(!list)return;
  const buttons=list.querySelectorAll<HTMLElement>('.power-row');
  let visibleCount=0;
  buttons.forEach(btn=>{
    const name=(btn.dataset.powerName||btn.textContent||'').toLowerCase();
    const match=!q||name.includes(q);
    btn.style.display=match?'':'none';
    if(match)visibleCount++;
  });
  let emptyMsg=list.querySelector('.progression-power-empty-msg') as HTMLElement;
  if(!emptyMsg){
    emptyMsg=document.createElement('div');
    emptyMsg.className='empty progression-power-empty-msg';
    emptyMsg.textContent='Nenhum poder corresponde aos filtros ou à busca.';
    list.appendChild(emptyMsg);
  }
  emptyMsg.style.display=(visibleCount===0&&buttons.length>0)?'':'none';
});
document.addEventListener('search',event=>{
  const input=(event.target as HTMLElement)?.closest?.('[data-action="progression-power-search"]') as HTMLInputElement;
  if(!input)return;
  const index=Number(input.dataset.index),row=state?.progression?.[index];
  if(!row)return;
  row.powerSearchQuery=input.value;
  const q=input.value.trim().toLowerCase();
  const list=document.querySelector(`[data-progression-power-list="${index}"]`);
  if(!list)return;
  const buttons=list.querySelectorAll<HTMLElement>('.power-row');
  let visibleCount=0;
  buttons.forEach(btn=>{
    const name=(btn.dataset.powerName||btn.textContent||'').toLowerCase();
    const match=!q||name.includes(q);
    btn.style.display=match?'':'none';
    if(match)visibleCount++;
  });
  let emptyMsg=list.querySelector('.progression-power-empty-msg') as HTMLElement;
  if(!emptyMsg){
    emptyMsg=document.createElement('div');
    emptyMsg.className='empty progression-power-empty-msg';
    emptyMsg.textContent='Nenhum poder corresponde aos filtros ou à busca.';
    list.appendChild(emptyMsg);
  }
  emptyMsg.style.display=(visibleCount===0&&buttons.length>0)?'':'none';
});
document.addEventListener('keydown',event=>{
  if(!['ArrowDown','ArrowUp'].includes(event.key))return;
  const current=event.target.closest?.('[data-action="class-power-preview"]');
  if(!current)return;
  const index=Number(current.dataset.index),list=current.closest?.('.power-list');
  if(!list)return;
  const powers=[...list.querySelectorAll('[data-action="class-power-preview"]')].filter(button=>!button.hidden&&!button.classList.contains('hidden'));
  const position=powers.indexOf(current),direction=event.key==='ArrowDown'?1:-1,next=powers[position+direction];
  if(!next)return;
  event.preventDefault();
  event.stopPropagation();
  previewProgressionPower(index,next.dataset.powerId,{pageScroll:window.scrollY,listScroll:list.scrollTop,fromKeyboard:true});
},true);
document.addEventListener('click',event=>{
  if(state.step===7){
    const prevBtn=event.target.closest?.('#stepPrevButton');
    if(prevBtn){
      event.preventDefault();event.stopImmediatePropagation();
      const plan=typeof spellPlan==='function'?spellPlan():null;
      const groups=plan?.groups?.filter(g=>g.count>0&&g.kind!=='reference')||[];
      const saved=typeof spellState==='function'?spellState():{};
      const curIdx=groups.findIndex(g=>g.id===saved.activeGroup);
      if(curIdx>0){
        saved.activeGroup=groups[curIdx-1].id;
        refreshSpellStage();
      }
      return;
    }
    const nextBtn=event.target.closest?.('#stepNextButton');
    if(nextBtn){
      event.preventDefault();event.stopImmediatePropagation();
      const plan=typeof spellPlan==='function'?spellPlan():null;
      const groups=plan?.groups?.filter(g=>g.count>0&&g.kind!=='reference')||[];
      const saved=typeof spellState==='function'?spellState():{};
      const curIdx=groups.findIndex(g=>g.id===saved.activeGroup);
      if(curIdx>=0&&curIdx<groups.length-1){
        saved.activeGroup=groups[curIdx+1].id;
        refreshSpellStage();
      }
      return;
    }
  }
  if(state.step===10){
    const prevBtn=event.target.closest?.('#stepPrevButton,[data-action="progression-prev-level"]');
    if(prevBtn){
      event.preventDefault();event.stopImmediatePropagation();
      const activeIndex=progressionActivePowerIndex();
      const levelIndices=typeof progressionLevelIndices==='function'?progressionLevelIndices():state.progression.map((r,i)=>i).slice(1);
      const curPos=levelIndices.indexOf(activeIndex);
      if(curPos > 0){
        const prevIndex = levelIndices[curPos - 1];
        setProgressionEditingIndex(prevIndex);
        const row=state.progression[prevIndex];
        if(row){row.previewPowerId='';row.previewPowerChoice=''}
        renderStage();
        setTimeout(()=>document.querySelector('[data-progression-level="'+prevIndex+'"]')?.scrollIntoView({behavior:'smooth',block:'start'}),40);
      }
      return;
    }
    const nextBtn=event.target.closest?.('#stepNextButton,[data-action="progression-next-level"]');
    if(nextBtn){
      event.preventDefault();event.stopImmediatePropagation();
      const active=progressionActivePowerIndex(),row=state.progression[active];
      const cls=classById(row?.classId);
      const level=classLevelAt(active,row?.classId);
      const hasSlot=Boolean(cls && powerSlotAt(cls,level));
      const candidate=progressionPowerById(row?.previewPowerId||row?.powerId);
      if(hasSlot && active>=0&&(!row.powerId||row.previewPowerId)){
        if(!row.powerId&&!row.previewPowerId){
          toast('Selecione um poder para o nível '+(active+1)+' antes de avançar.','warning');
          document.querySelector('[data-progression-level="'+active+'"]')?.scrollIntoView({behavior:'smooth',block:'start'});
          return;
        }
        const verdict=progressionPowerVerdict(candidate,active);
        if(!candidate||!verdict?.ok){
          toast('Pré-requisito não atendido: '+(verdict?.reasons?.join(' ')||'Escolha inválida.'),'warning');
          return;
        }
        const isChoicePower = ['classe_aumento_de_atributo','arcanista_familiar','arcanista_familiar_aprimorado','geral:proficiencia','proficiencia'].includes(candidate.id) || candidate.originalId === 'proficiencia';
        if(isChoicePower&&!row.previewPowerChoice){
          toast(candidate.id.includes('proficiencia') || candidate.originalId === 'proficiencia' ? 'Escolha a proficiência desejada para continuar.' : 'Escolha qual atributo deseja aumentar neste nível.','warning');
          return;
        }
        const current=document.querySelector('[data-progression-level="'+active+'"]');
        current?.classList.add('is-leaving');
        nextBtn.disabled=true;
        setTimeout(()=>{
          row.powerId=candidate.id;
          row.powerChoice=isChoicePower?row.previewPowerChoice:'';
          row.previewPowerId='';
          invalidateDependentProgressionPowers(active);
          if(state.isTrainingPowerProgression){
            const chosenId = row.powerId;
            const chosenChoice = row.powerChoice || '';
            const originalLevel = Number(state.trainingPowerBefore?.identity?.plannedLevel) || Math.max(1, (Number(state.identity?.plannedLevel) || 2) - 1);
            state.progression = state.progression.slice(0, originalLevel);
            state.identity.plannedLevel = originalLevel;
            state.levelTraining = state.levelTraining || {};
            state.levelTraining.power = true;
            state.levelTraining.selectedPowerId = chosenId;
            state.levelTraining.nextPowerId = chosenId;
            state.levelTraining.selectedPowerChoice = chosenChoice;
            state.levelTraining.nextPowerChoice = chosenChoice;
            delete state.isTrainingPowerProgression;
            delete state.trainingPowerBefore;
            state.isEditingFinishedSheet = false;
            state.finished = true;
            state.sheetView = 'sheet';
            persistNow();
            if(typeof saveFinishedCharacter === 'function') saveFinishedCharacter();
            if(typeof window !== 'undefined' && window.location?.pathname && (window.location.pathname.endsWith('/criador.html') || window.location.pathname.endsWith('criador.html'))){
              window.location.href = 'ficha.html';
              return;
            }
            if(typeof renderStage === 'function') renderStage();
            if(typeof toast === 'function') toast('Treino de Poder concluído! O poder foi adiantado na ficha.');
            return;
          }
          if(state.isLevelingUp){
            nextBtn.disabled=false;
            const nextPending = getNextLevelUpPendingPhase();
            if(nextPending === 4){
              state.returnToProgressionAfterSkill = true;
              state.step = 4;
              renderStage();window.scrollTo?.({top:0,behavior:'smooth'});
              document.getElementById('skill-int')?.scrollIntoView?.({behavior:'smooth',block:'center'});
              toast('Poder confirmado! Escolha a nova perícia recebida pelo aumento de Inteligência.');
              return;
            }
            if(nextPending === 5){
              state.step = 5;
              renderStage();window.scrollTo?.({top:0,behavior:'smooth'});
              toast('Poder confirmado! Escolha o poder concedido da divindade.');
              return;
            }
            if(nextPending === 6){
              state.step = 6;
              renderStage();window.scrollTo?.({top:0,behavior:'smooth'});
              toast('Poder confirmado! Conclua a escolha de poderes.');
              return;
            }
            if(nextPending === 7){
              state.step = 7;
              const savedSpells=typeof spellState==='function'?spellState():null;
              if(savedSpells){
                savedSpells.returnToProgression=true;
                savedSpells.progression=true;
                const plan=typeof spellPlan==='function'?spellPlan():null;
                if(plan?.groups?.length){
                  const inc=plan.groups.find(g=>g.count&&groupSpellIds(g).length<g.count);
                  if(inc){savedSpells.activeGroup=inc.id;savedSpells.view='available'}
                }
              }
              renderStage();window.scrollTo?.({top:0,behavior:'smooth'});
              document.getElementById('spellGrimoire')?.scrollIntoView?.({behavior:'smooth',block:'start'});
              toast('Poder confirmado! Escolha a nova magia recebida no Grimório.');
              return;
            }
            if(nextPending === 8){
              state.step = 8;
              const plan = typeof initialItemPlan === 'function' ? initialItemPlan() : [];
              const targetIdx = plan.findIndex(c => c.source === 'class' && !arsenalState().grants?.[itemChoiceGrantId(c)]);
              if(targetIdx >= 0){
                arsenalState().choiceIndex = targetIdx;
              }
              arsenalState().complete = false;
              renderStage();window.scrollTo?.({top:0,behavior:'smooth'});
              toast('Poder confirmado! Escolha o item concedido pelo novo nível.');
              return;
            }
            if(nextPending === 9){
              state.step = 9;
              renderStage();window.scrollTo?.({top:0,behavior:'smooth'});
              toast('Poder confirmado! Configure seu novo parceiro.');
              return;
            }
            if(typeof finishCharacterCreation==='function') finishCharacterCreation();
            else {
              state.isLevelingUp = false;
              state.finished = true;
              state.sheetView = 'sheet';
              persistNow();
              renderStage();
            }
            return;
          }
          const levelIndices=typeof progressionLevelIndices==='function'?progressionLevelIndices():state.progression.map((r,i)=>i).slice(1);
          const curPos=levelIndices.indexOf(active);
          const nextIndex=curPos>=0&&curPos<levelIndices.length-1?levelIndices[curPos+1]:undefined;
          const targetIndex=nextIndex!==undefined?nextIndex:active;
          setProgressionEditingIndex(targetIndex);
          nextBtn.disabled=false;
          const savedSpells=typeof spellState==='function'?spellState():null;
          if(savedSpells)savedSpells.progression=true;
          const missingSpells=typeof spellMissingChoices==='function'?spellMissingChoices():[];
          const missingSkills=typeof skillMissingChoices==='function'?skillMissingChoices():[];
          if(missingSkills.length>0){
            state.returnToProgressionAfterSkill=true;
            state.step=4;
            renderStage();window.scrollTo?.({top:0,behavior:'smooth'});
            document.getElementById('skill-int')?.scrollIntoView?.({behavior:'smooth',block:'center'});
            toast('Poder confirmado! Escolha a nova perícia recebida pelo aumento de Inteligência.');
            return;
          }
          if(missingSpells.length>0){
            state.step=7;
            if(savedSpells){
              savedSpells.returnToProgression=true;
              savedSpells.progression=true;
              const plan=typeof spellPlan==='function'?spellPlan():null;
              if(plan?.groups?.length){
                const inc=plan.groups.find(g=>g.count&&groupSpellIds(g).length<g.count);
                if(inc){savedSpells.activeGroup=inc.id;savedSpells.view='available'}
              }
            }
            renderStage();window.scrollTo?.({top:0,behavior:'smooth'});
            document.getElementById('spellGrimoire')?.scrollIntoView?.({behavior:'smooth',block:'start'});
            toast('Poder confirmado! Escolha a nova magia recebida no Grimório.');
            return;
          }
          if(nextIndex===undefined && !state.isEditingFinishedSheet && !state.editingCharacter){
            const overallMissing=typeof characterPendingChoices==='function'?characterPendingChoices():[];
            if(overallMissing.length===0){
              if(typeof finishCharacterCreation==='function')finishCharacterCreation();
              else{
                if(!state.completed.includes(9))state.completed.push(9);
                state.finished=true;state.sheetView='sheet';persistNow();if(typeof saveFinishedCharacter==='function')saveFinishedCharacter();renderStage();window.scrollTo({top:0,behavior:'smooth'});
              }
              toast('Todas as escolhas concluídas! Ficha do herói forjada com sucesso.');
              return;
            }
          }
          renderStage();
          const target=document.querySelector('[data-progression-level="'+targetIndex+'"]');
          target?.classList.add('is-arriving');
          target?.scrollIntoView({behavior:'smooth',block:'start'});
          toast(targetIndex>active?'Poder confirmado para o nível '+(active+1)+'. Visualizando nível '+(targetIndex+1)+'.':'Escolha confirmada para o nível '+(active+1)+'.');
        },230);
        return;
      }
      const activeIndex=progressionActivePowerIndex();
      const levelIndices=typeof progressionLevelIndices==='function'?progressionLevelIndices():state.progression.map((r,i)=>i).slice(1);
      const curPos=levelIndices.indexOf(activeIndex);
      const nextIndex=curPos>=0&&curPos<levelIndices.length-1?levelIndices[curPos+1]:undefined;
      if(nextIndex!==undefined){
        setProgressionEditingIndex(nextIndex);
        const nextRow=state.progression[nextIndex];
        if(nextRow){nextRow.previewPowerId='';nextRow.previewPowerChoice=''}
        renderStage();
        setTimeout(()=>document.querySelector('[data-progression-level="'+nextIndex+'"]')?.scrollIntoView({behavior:'smooth',block:'start'}),40);
      }
      return;
    }
  }
},true);
document.addEventListener('click',event=>{if(!event.target.closest?.('[data-action="add-level"]'))return;event.preventDefault();event.stopImmediatePropagation();if(state.identity.plannedLevel>=20)return;openLevelClassModal()},true);
document.addEventListener('click',event=>{if(!event.target.closest?.('[data-action="remove-level"]'))return;event.preventDefault();event.stopImmediatePropagation();if(state.isLevelingUp){toast('Não é possível remover níveis durante a subida de nível.','warning');return;}if(Number(state.identity.plannedLevel)<=1)return;const removedLevel=Number(state.identity.plannedLevel);state.identity.plannedLevel=removedLevel-1;state.progression=state.progression.slice(0,state.identity.plannedLevel);const currentSamuraiLevel=(state.progression||[]).filter(row=>row.classId==='samurai').length;[4,6,8,10,12,14].forEach(lvl=>{if(lvl>currentSamuraiLevel&&state.samuraiKatana?.[lvl])delete state.samuraiKatana[lvl]});syncSamuraiKatanaToBackpack();const unresolved=nextUnresolvedProgressionIndex(-1);setProgressionEditingIndex(unresolved>=0?unresolved:state.identity.plannedLevel-1);state.progressionCollapsedIndex=-1;const validSpellGroups=new Set(spellPlan().groups.map(group=>group.id)),saved=spellState();for(const id of Object.keys(saved.selections||{}))if(!validSpellGroups.has(id))delete saved.selections[id];state.completed=state.completed.filter(step=>step!==10);persistNow();renderStage();toast('Nível '+removedLevel+' removido. Poderes, habilidades, PV, PM e magias desse nível foram retirados.')},true);
document.addEventListener('click',event=>{
  if(state.step!==10||!event.target.closest?.('#nextButton'))return;
  event.preventDefault();event.stopImmediatePropagation();

  const active=progressionActivePowerIndex(),row=state.progression[active];
  if(row?.previewPowerId){
    const candidate=progressionPowerById(row.previewPowerId);
    const verdict=candidate?progressionPowerVerdict(candidate,active):null;
    if(!candidate||!verdict?.ok){
      toast('Pré-requisito não atendido no nível '+(active+1)+': '+(verdict?.reasons?.join(' ')||'Escolha inválida.'),'warning');
      return;
    }
    const isChoicePower2 = ['classe_aumento_de_atributo','arcanista_familiar','arcanista_familiar_aprimorado','geral:proficiencia','proficiencia'].includes(candidate.id) || candidate.originalId === 'proficiencia';
    if(isChoicePower2&&!row.previewPowerChoice){
      toast(candidate.id.includes('proficiencia') || candidate.originalId === 'proficiencia' ? 'Escolha a proficiência desejada para continuar.' : 'Escolha qual atributo deseja aumentar no nível '+(active+1)+'.','warning');
      return;
    }
    row.powerId=candidate.id;
    row.powerChoice=isChoicePower2?row.previewPowerChoice:'';
    row.previewPowerId='';
    invalidateDependentProgressionPowers(active);
  }

  // Só a escolha do nível ativo é confirmada pelo clique.
  if(skillMissingChoices().length){
    state.returnToProgressionAfterSkill=true;
    state.step=4;
    persistNow();renderStage();
    document.getElementById('skill-int')?.scrollIntoView?.({behavior:'smooth',block:'center'});
    toast('Escolha a nova perícia recebida pelo aumento de Inteligência.');
    return;
  }
  if(spellMissingChoices().length){
    const saved=spellState();saved.progression=true;saved.returnToProgression=true;
    const group=spellPlan().groups.find(g=>g.count&&groupSpellIds(g).length<g.count);
    if(group){saved.activeGroup=group.id;saved.view='available';}
    state.step=7;renderStage();return;
  }

  const missing=characterPendingChoices();
  if(missing.length>0){
    const first=missing[0];
    toast('Pendência na ficha: '+first.message,'warning');
    if(first.step&&first.step!==10){
      state.step=first.step;
      renderStage();
    }else if(first.selector){
      document.querySelector(first.selector)?.scrollIntoView({behavior:'smooth',block:'start'});
    }
    return;
  }

  if(typeof finishCharacterCreation==='function')finishCharacterCreation();
  else{
    if(!state.completed.includes(10))state.completed.push(10);
    state.finished=true;
    state.isEditingFinishedSheet=false;
    state.editingCharacter=null;
    state.sheetView='sheet';
    persistNow();
    if(typeof saveFinishedCharacter==='function')saveFinishedCharacter();
    renderStage();
    window.scrollTo({top:0,behavior:'smooth'});
  }
},true);
document.addEventListener('click',event=>{if(!event.target.closest?.('#reviewProgressionButton')||state.step!==10)return;event.preventDefault();event.stopImmediatePropagation();const levelIndices=typeof progressionLevelIndices==='function'?progressionLevelIndices():state.progression.map((r,i)=>i).slice(1);if(!levelIndices.length)return toast('Não há escolhas de poder para revisar.');const first=levelIndices[0];setProgressionEditingIndex(first);const row=state.progression[first];if(row){row.previewPowerId='';row.previewPowerChoice=''}renderStage();setTimeout(()=>document.querySelector('[data-progression-level="'+first+'"]')?.scrollIntoView({behavior:'smooth',block:'start'}),30);toast('Revisando escolhas a partir do nível 2.');},true);
document.addEventListener('change',event=>{
  const upg=event.target.closest?.('[data-action="samurai-katana-upgrade"]');
  if(upg){
    const level=Number(upg.dataset.level);
    state.samuraiKatana=state.samuraiKatana||{};
    state.samuraiKatana[level]=upg.value;
    syncSamuraiKatanaToBackpack();
    renderStage();
    syncProgressionFooter();
    return;
  }
  const enc=event.target.closest?.('[data-action="samurai-katana-enchantment"]');
  if(enc){
    const level=Number(enc.dataset.level);
    state.samuraiKatana=state.samuraiKatana||{};
    state.samuraiKatana[level]=enc.value;
    syncSamuraiKatanaToBackpack();
    renderStage();
    syncProgressionFooter();
    return;
  }
},true);
document.addEventListener('click',event=>{
  const btn=event.target.closest?.('[data-action="go-to-inventor-grant"]');
  if(!btn)return;
  event.preventDefault();
  event.stopImmediatePropagation();
  state.step=8;
  const plan=initialItemPlan();
  const idx=plan.findIndex(choice=>choice.id==='class-inventor-fabricar-item-superior');
  if(idx>=0){
    arsenalState().choiceIndex=idx;
    arsenalState().complete=false;
  }
  renderStage();
  window.scrollTo({top:0,behavior:'smooth'});
  toast('Escolha ou configure seu item superior em Equipamento inicial.');
},true);

function selectedCharacterFeatures(){
  ensureProgression();
  const features=[],seen=new Set();
  const add=(feature,source)=>{
    if(!feature||(!feature.id&&!feature.nome))return;
    const cleanId=slug(feature.id||String(feature.nome||'').split('/').pop());
    if(!cleanId||seen.has(cleanId))return;
    seen.add(cleanId);
    features.push({...feature,source});
  };
  const race=raceById(state.identity.raceId);
  for(const ability of race?.habilidades?.fixas||[]){
    if(race?.id==='duende'&&ability.id==='duende_tabu')continue;
    const option=(ability.escolha?.opcoes||[]).find(item=>choiceId(item)===state.identity.raceChoices[ability.id]);
    add(option?{...ability,efeitos:[...(ability.efeitos||[]),...(option.efeitos||[])]}:ability,'race');
  }
  for(const definition of race?.habilidades?.selecionadas||[]){
    if(race?.id==='duende'&&definition.id==='duende_tamanho')continue;
    if(race?.id==='duende'&&definition.id==='duende_natureza'){
      const option=selectedRaceOption(definition);
      if(option)add({...option,nome:'Natureza('+choiceName(option)+')'},'race');
      continue;
    }
    if(race?.id==='duende'&&definition.id==='duende_tabu'){
      const chosenText=(state.identity.duendeTabuText||(selectedRaceOption(definition)?choiceName(selectedRaceOption(definition)):'')).trim();
      const consequence=((state.identity.duendeTabuPenalty==='Outra consequência (com o mestre)'?state.identity.duendeTabuCustomPenalty:state.identity.duendeTabuPenalty)||'').trim();
      const baseIntro='Você possui um tabu — algo que nunca pode fazer (ou deixar de fazer). Nenhum efeito pode curar essa condição. Se no dia seguinte continuar desrespeitando o tabu, você fica exausto. Se no terceiro dia não mudar seu comportamento, você morre.';
      let penaltyText = consequence;
      if(penaltyText && !penaltyText.includes('-5') && !penaltyText.includes('–5')){
        penaltyText = '–5 em ' + penaltyText;
      }
      const tabooDetail = chosenText ? ('Seu tabu: ' + chosenText + (penaltyText ? (' ' + penaltyText + (penaltyText.endsWith('.') ? '' : '.')) : '')) : '';
      const fullDesc = [baseIntro, tabooDetail].filter(Boolean).join('\n');
      const title=chosenText?('Tabu: '+chosenText):'Tabu';
      add({id:'duende_tabu',nome:title,descricao:fullDesc,source:'race'},'race');
      continue;
    }
    const option=selectedRaceOption(definition);
    if(option)add({...option,nome:definition.nome+'('+choiceName(option)+')'},'race');
  }
  if(race?.id==='duende'&&!seen.has('duende_tabu')){
    const chosenText=(state.identity.duendeTabuText||'').trim();
    const consequence=((state.identity.duendeTabuPenalty==='Outra consequência (com o mestre)'?state.identity.duendeTabuCustomPenalty:state.identity.duendeTabuPenalty)||'').trim();
    const baseIntro='Você possui um tabu — algo que nunca pode fazer (ou deixar de fazer). Nenhum efeito pode curar essa condição. Se no dia seguinte continuar desrespeitando o tabu, você fica exausto. Se no terceiro dia não mudar seu comportamento, você morre.';
    let penaltyText = consequence;
    if(penaltyText && !penaltyText.includes('-5') && !penaltyText.includes('–5')){
      penaltyText = '–5 em ' + penaltyText;
    }
    const tabooDetail = chosenText ? ('Seu tabu: ' + chosenText + (penaltyText ? (' ' + penaltyText + (penaltyText.endsWith('.') ? '' : '.')) : '')) : '';
    const fullDesc = [baseIntro, tabooDetail].filter(Boolean).join('\n');
    const title=chosenText?('Tabu: '+chosenText):'Tabu';
    add({id:'duende_tabu',nome:title,descricao:fullDesc,source:'race'},'race');
  }
  for(const group of racePowerGroups()){
    if(race?.id==='duende'&&group.id==='duende_presentes')continue;
    for(const id of state.powers.raceGroups[group.id]||[]){
      const option=group.options.find(item=>choiceId(item)===id);
      if(option)add(option,'race');
    }
  }
  state.progression.forEach((row,index)=>{const cls=classById(row.classId),level=classLevelAt(index,row.classId);for(const ability of cls?.habilidades||[])if(Number(ability.nivel)===level)add(ability,'class');if(row.powerId)add(progressionPowerById(row.powerId),'class-power')});
  if(!shouldSkipOriginPhase()){
    const origin=typeof selectedStandardOrigin==='function'?selectedStandardOrigin():null;
    if(origin){
      const allBenefitOptions = typeof originBenefitOptions==='function'?originBenefitOptions(origin):[];
      const chosenBenefitIds = Array.isArray(state.origin?.benefits) ? state.origin.benefits : [];
      const chosenOptions = [];
      chosenBenefitIds.forEach(id => {
        const opt = allBenefitOptions.find(o => o.id === id);
        if(opt) chosenOptions.push(opt);
      });
      const benefitNames = chosenOptions.map(opt => {
        if(opt.type === 'skill'){
          const token = typeof skillTokenFromName === 'function' ? skillTokenFromName(opt.name) : '';
          if(token === 'oficio' && state.origin?.officeSpecialties?.[opt.id]){
            return 'Ofício (' + state.origin.officeSpecialties[opt.id] + ')';
          }
          return opt.name;
        }
        if(opt.type === 'power' && opt.category && state.powers?.originGeneral?.[opt.id]){
          const chosenPower = typeof powerById === 'function' ? powerById(state.powers.originGeneral[opt.id]) : null;
          if(chosenPower) return chosenPower.nome;
        }
        return opt.name;
      }).filter(Boolean);

      const formattedTitle = benefitNames.length ? (origin.nome + '(' + benefitNames.join('/') + ')') : origin.nome;

      const descLines = chosenOptions.map(opt => {
        let bName = opt.name;
        if(opt.type === 'skill' && typeof skillTokenFromName === 'function' && skillTokenFromName(opt.name) === 'oficio' && state.origin?.officeSpecialties?.[opt.id]){
          bName = 'Ofício (' + state.origin.officeSpecialties[opt.id] + ')';
        }
        let bDesc = opt.description || '';
        if(opt.type === 'power' || opt.type === 'unique'){
          const basePower = (DATA.generalPowers || []).find(p => slug(p.nome) === slug(opt.name));
          if(basePower?.descricao) bDesc = basePower.descricao;
          else if(origin.beneficios?.poder_unico && slug(origin.beneficios.poder_unico.nome) === slug(opt.name)){
            bDesc = origin.beneficios.poder_unico.descricao;
          }
        }
        return '• ' + bName + ': ' + bDesc;
      });
      const originDesc = descLines.length ? descLines.join('\n\n') : (origin.descricao || 'Benefícios da origem.');

      const originEffects = [];
      chosenOptions.forEach(opt => {
        const basePower = (DATA.generalPowers || []).find(p => slug(p.nome) === slug(opt.name));
        if(basePower?.efeitos) originEffects.push(...basePower.efeitos);
        if(origin.beneficios?.poder_unico && slug(origin.beneficios.poder_unico.nome) === slug(opt.name) && origin.beneficios.poder_unico.efeitos){
          originEffects.push(...origin.beneficios.poder_unico.efeitos);
        }
      });

      add({
        id: 'origem_' + slug(origin.nome),
        nome: formattedTitle,
        descricao: originDesc,
        efeitos: originEffects,
        source: 'origin',
        originName: origin.nome,
        benefitNames: benefitNames
      }, 'origin');
    }
    if(state.origin.mode==='dual'&&!isChildCharacter()){
      const regional=typeof selectedRegionalOrigin==='function'?selectedRegionalOrigin():null;
      if(regional){
        if(slug(regional.nome)==='duplo_feerico'||regional.nome==='Duplo Feérico'){
          const duplo = typeof selectedDuploFeericoPower === 'function' ? selectedDuploFeericoPower() : null;
          const duploTitle = duplo ? ('Duplo Feérico(' + duplo.nome + ')') : regional.nome;
          const originDesc = regional.beneficios?.descricao || 'Você possui uma ligação mística com outra classe. Escolha um poder de 1º nível de outra classe (exceto poderes concedidos ou da Tormenta). Você recebe esse poder.';
          const powerDesc = duplo ? (duplo.descricao || '') : '';
          add({
            ...(duplo || {}),
            id: 'duplo_feerico',
            nome: duploTitle,
            descricao: powerDesc || originDesc,
            originDesc: originDesc,
            powerDesc: powerDesc,
            chosenPower: duplo || null,
            origemRegional: 'Duplo Feérico',
            efeitos: duplo?.efeitos || []
          }, 'origin');
        } else if(slug(regional.nome) === 'futura_lenda' || regional.nome === 'Futura Lenda'){
          const flPower = typeof selectedFuturaLendaPower === 'function' ? selectedFuturaLendaPower() : null;
          const flTitle = flPower ? ('Futura Lenda(' + flPower.nome + ')') : regional.nome;
          const originDesc = regional.beneficios?.descricao || 'Você recebe um poder de sua classe cujo pré-requisito de nível seja no máximo 2º nível.';
          const powerDesc = flPower ? (flPower.descricao || '') : '';
          add({
            ...(flPower || {}),
            id: 'futura_lenda',
            nome: flTitle,
            descricao: powerDesc || originDesc,
            originDesc: originDesc,
            powerDesc: powerDesc,
            chosenPower: flPower || null,
            origemRegional: 'Futura Lenda',
            efeitos: flPower?.efeitos || []
          }, 'origin');
        } else {
          add({id: regional.id || slug(regional.nome), nome: regional.nome, descricao: regional.beneficios?.descricao || ''}, 'origin');
        }
        if(slug(regional.nome) === 'competidor_do_circuito' || regional.nome === 'Competidor do Circuito'){
          const torcidaPower = (DATA.generalPowers || []).find(p => slug(p.nome) === 'torcida');
          if(torcidaPower){
            add({
              ...torcidaPower,
              id: 'torcida',
              nome: 'Torcida (Competidor do Circuito)',
              descricao: 'Você recebe +2 em testes de perícia e Defesa quando tem a torcida a seu favor. Entenda-se por “torcida” qualquer número de criaturas inteligentes em alcance médio que não esteja realizando nenhuma ação além de torcer por você. Enquanto sob efeito desse poder, sempre que reduz um inimigo a 0 PV com um ataque corpo a corpo, você recupera 1 PM.'
            }, 'origin');
          }
        }
        if((slug(regional.nome) === 'estudante_do_colegio_real' || regional.nome === 'Estudante do Colégio Real') && state.deity?.mode !== 'devout' && !state.deity?.name){
          add({
            id: 'medicina_salistiense',
            nome: 'Medicina Salistiense (Estudante do Colégio Real)',
            descricao: 'Seus efeitos de cura recuperam +2 PV por dado. Você perde esse benefício caso se torne um devoto de qualquer tipo.'
          }, 'origin');
        }
        if(slug(regional.nome) === 'filhote_da_revoada' || regional.nome === 'Filhote da Revoada'){
          add({
            id: 'filhote_da_revoada',
            nome: 'Filhote da Revoada',
            descricao: 'Quando faz um teste de Acrobacia ou Pilotagem, pode gastar 1 PM para rolar um dado adicional e usar o melhor resultado.'
          }, 'origin');
        }
        if(slug(regional.nome) === 'grumete_pirata' || regional.nome === 'Grumete Pirata'){
          add({
            id: 'pes_de_marinheiro',
            nome: 'Pés de Marinheiro (Grumete Pirata)',
            descricao: 'Se estiver se equilibrando, escalando ou nadando, só cai ou afunda se falhar no teste de perícia por 10 ou mais (em vez de 5 ou mais).'
          }, 'origin');
        }
      }
    }
  }
  for(const power of selectedGeneralPowers()){
    let pObj = power;
    if(slug(power?.id || power?.nome || '') === 'familiar_elemental'){
      const chosenOpt = typeof getSelectedElementalFamiliarOption === 'function' ? getSelectedElementalFamiliarOption() : null;
      if(chosenOpt){
        pObj = {
          ...pObj,
          nome: 'Familiar Elemental(' + chosenOpt.shortName + ')',
          elementalFamiliarOption: chosenOpt
        };
      }
    }
    add(pObj,'general-power');
  }
  const deityPowersList = String(state.deity.power||'').split('|').filter(Boolean);
  const isFundDevout = state.deity?.fundamentalist && ['clerigo','frade','druida','ermitao','paladino','santo'].includes(state.identity.classId) && state.tableRules?.broadDevotionAndFundamentalist !== false;
  let fundChosenPower = null;
  let normalDeityPowers = deityPowersList;

  if (isFundDevout && state.deity.mode === 'devout' && deityPowersList.length > 0) {
    const isFull = ['clerigo','frade','druida','ermitao','paladino','santo'].includes(state.identity.classId);
    const baseCount = isFull ? 2 : 1;
    if (deityPowersList.length > baseCount) {
      const fundPowerName = deityPowersList[deityPowersList.length - 1];
      fundChosenPower = (typeof grantedPowerData === 'function' ? grantedPowerData(fundPowerName) : null) || DATA.generalPowers.find(power => power.nome === fundPowerName || slug(power.nome) === slug(fundPowerName));
      if (!fundChosenPower) fundChosenPower = { id: slug(fundPowerName), nome: fundPowerName, descricao: 'Poder concedido pela divindade.' };
      normalDeityPowers = deityPowersList.slice(0, baseCount);
    } else {
      const fundPowerName = deityPowersList[deityPowersList.length - 1];
      fundChosenPower = (typeof grantedPowerData === 'function' ? grantedPowerData(fundPowerName) : null) || DATA.generalPowers.find(power => power.nome === fundPowerName || slug(power.nome) === slug(fundPowerName));
      if (!fundChosenPower) fundChosenPower = { id: slug(fundPowerName), nome: fundPowerName, descricao: 'Poder concedido pela divindade.' };
      normalDeityPowers = deityPowersList.slice(0, deityPowersList.length - 1);
    }
  }

  for(const name of normalDeityPowers){
    const matched = (typeof grantedPowerData === 'function' ? grantedPowerData(name) : null) || DATA.generalPowers.find(power=>power.nome===name||slug(power.nome)===slug(name));
    let featObj = matched || {id: slug(name), nome: name, descricao: 'Poder concedido pela divindade.'};
    if(slug(name) === 'familiar_elemental'){
      const chosenOpt = typeof getSelectedElementalFamiliarOption === 'function' ? getSelectedElementalFamiliarOption() : null;
      if(chosenOpt){
        featObj = {
          ...featObj,
          nome: 'Familiar Elemental: ' + chosenOpt.shortName,
          elementalFamiliarOption: chosenOpt
        };
      }
    }
    add(featObj, 'deity');
  }
  if(state.deity?.mode === 'pantheon' && ['clerigo','frade','druida','ermitao','paladino','santo'].includes(state.identity.classId) && state.tableRules?.broadDevotionAndFundamentalist !== false){
    const broadTitle = typeof ForjaUnificada !== 'undefined' && typeof ForjaUnificada.getBroadDevotionTitle === 'function'
      ? ForjaUnificada.getBroadDevotionTitle(state.identity.classId)
      : 'Devoção Ampla';
    add({
      id: 'devocao_ampla',
      nome: broadTitle,
      descricao: 'Clérigos e frades do Panteão, druidas de Arton e paladinos do bem não recebem poderes concedidos. Em compensação, por sua devoção ampla, recebem +2 PM por patamar.'
    }, 'deity');
  }
  if(state.deity?.fundamentalist && ['clerigo','frade','druida','ermitao','paladino','santo'].includes(state.identity.classId) && state.tableRules?.broadDevotionAndFundamentalist !== false){
    if(state.deity.mode === 'pantheon'){
      const pText = typeof ForjaUnificada !== 'undefined' && typeof ForjaUnificada.getFundamentalistText === 'function'
        ? ForjaUnificada.getFundamentalistText('panteao')
        : 'Fundamentalista do Panteão.';
      let pantheonBonusPowerObj = null;
      if(state.deity.pantheonBonusPower){
        pantheonBonusPowerObj = DATA.generalPowers.find(p => p.id === state.deity.pantheonBonusPower || slug(p.nome) === slug(state.deity.pantheonBonusPower));
      }
      const fundTitle = pantheonBonusPowerObj ? `Fundamentalista (${pantheonBonusPowerObj.nome})` : 'Fundamentalista (Panteão)';
      const fullDesc = pantheonBonusPowerObj
        ? `${pText}\r\n\r\n${pantheonBonusPowerObj.nome}: ${pantheonBonusPowerObj.descricao}`
        : pText;
      add({
        id: 'fundamentalista_panteao',
        nome: fundTitle,
        descricao: fullDesc
      }, 'deity');
    } else if(state.deity.mode === 'devout' && state.deity.name){
      const fText = typeof ForjaUnificada !== 'undefined' && typeof ForjaUnificada.getFundamentalistText === 'function'
        ? ForjaUnificada.getFundamentalistText(state.deity.name)
        : '';
      if(fText || fundChosenPower){
        const fundTitle = fundChosenPower ? `Fundamentalista (${fundChosenPower.nome})` : `Fundamentalista (${state.deity.name})`;
        const fullDesc = fundChosenPower
          ? `${fText}\r\n\r\n${fundChosenPower.nome}: ${fundChosenPower.descricao}`
          : fText;
        add({
          id: 'fundamentalista_' + slug(state.deity.name),
          nome: fundTitle,
          descricao: fullDesc
        }, 'deity');
      }
    }
  }
  if(state.levelTraining?.power && (state.levelTraining?.selectedPowerId || state.levelTraining?.nextPowerId)){
    const trainedPowerId = state.levelTraining.selectedPowerId || state.levelTraining.nextPowerId;
    const trainedPwr = typeof progressionPowerById === 'function'
      ? progressionPowerById(trainedPowerId)
      : ((DATA.classPowers || []).find(p => p.id === trainedPowerId) || (DATA.generalPowers || []).find(p => p.id === trainedPowerId));
    if(trainedPwr){
      add({
        ...trainedPwr,
        nome: trainedPwr.nome,
        sheetAttribute: state.levelTraining.selectedPowerChoice || state.levelTraining.nextPowerChoice || ''
      }, 'class-power');
    }
  }
  const activeDistIds = typeof progressionDistinctionActiveIds === 'function' ? progressionDistinctionActiveIds() : (Array.isArray(state.distinctions?.activeIds) ? state.distinctions.activeIds : []);
  if (activeDistIds.length > 0) {
    const distCatalog = (typeof DATA !== 'undefined' && Array.isArray(DATA?.distinctions)) ? DATA.distinctions : [];
    for (const distId of activeDistIds) {
      const dist = distCatalog.find(d => d.id === distId);
      if (dist?.marca) {
        add({
          id: 'marca:' + dist.id,
          nome: `${dist.marca.nome} (Marca de ${dist.nome})`,
          descricao: dist.marca.descricao,
          source: 'distinction-mark',
          distinctionId: dist.id,
          distinctionName: dist.nome
        }, 'distinction-mark');
      }
    }
  }
  return features;
}
function inferredFeatureEffects(feature){
  // Marcas usam regras explícitas; evita duplicar bônus ou tornar efeitos condicionais permanentes.
  if(String(feature?.id||'').startsWith('marca:'))return[];
  const descRaw=feature?.descricao||'';
  const featId = slug(feature?.id || feature?.nome || '');
  const description=String(descRaw||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' '),effects=[];
  const defenseAttribute=description.match(/usar (?:seu|sua) (carisma|forca|constituicao|inteligencia|sabedoria) em vez de destreza na defesa/);
  if(defenseAttribute)effects.push({tipo:'substituir_atributo_defesa',para:{carisma:'car',forca:'for',constituicao:'con',inteligencia:'int',sabedoria:'sab'}[defenseAttribute[1]],feature});
  
  // Poderes da Tormenta escaláveis (+1 + outros poderes/2)
  if (['antenas', 'articulacoes_flexiveis', 'maos_membranosas', 'olhos_vermelhos'].includes(featId)) {
    const tCount = typeof characterTormentaPowersCount === 'function' ? characterTormentaPowersCount() : 1;
    const bonusTormenta = 1 + Math.floor(Math.max(0, tCount - 1) / 2);
    if (featId === 'antenas') {
      effects.push({ tipo: 'bonus_pericia', periciaId: 'iniciativa', valor: bonusTormenta, feature });
      effects.push({ tipo: 'bonus_pericia', periciaId: 'percepcao', valor: bonusTormenta, feature });
      effects.push({ tipo: 'bonus_pericia', periciaId: 'vontade', valor: bonusTormenta, feature });
    } else if (featId === 'articulacoes_flexiveis') {
      effects.push({ tipo: 'bonus_pericia', periciaId: 'acrobacia', valor: bonusTormenta, feature });
      effects.push({ tipo: 'bonus_pericia', periciaId: 'furtividade', valor: bonusTormenta, feature });
      effects.push({ tipo: 'bonus_pericia', periciaId: 'reflexos', valor: bonusTormenta, feature });
    } else if (featId === 'maos_membranosas') {
      effects.push({ tipo: 'bonus_pericia', periciaId: 'atletismo', valor: bonusTormenta, feature });
    } else if (featId === 'olhos_vermelhos') {
      effects.push({ tipo: 'bonus_pericia', periciaId: 'intimidacao', valor: bonusTormenta, feature });
    }
    return effects;
  }

  if (featId === 'investigador') {
    effects.push({ tipo: 'bonus_pericia', periciaId: 'investigacao', valor: 2, feature });
    return effects;
  }

  // Extração canônica de bônus de perícia descritos textualmente nos poderes
  const norm = String(descRaw).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const featName = String(feature?.nome || '').toLowerCase();
  const canonicalSkills = ['acrobacia','adestramento','atletismo','atuacao','cavalgar','conhecimento','cura','diplomacia','enganacao','fortitude','furtividade','guerra','iniciativa','intimidacao','intuicao','investigacao','jogatina','ladinagem','luta','misticismo','nobreza','oficio','percepcao','pilotagem','pontaria','religiao','reflexos','sobrevivencia','vontade'];
  
  // Perícias que já possuem declaração explícita no JSON original não devem receber inferência duplicada
  const alreadyExplicitSkillIds = new Set(
    (feature?.efeitos || [])
      .filter(e => e.tipo === 'bonus_pericia' || e.tipo === 'penalidade_pericia' || e.condicao || e.condicoes || e.gatilho || e.duracao)
      .flatMap(e => e.pericias || [e.periciaId])
      .filter(Boolean)
  );

  const chunkCondRegex = /(?:no\s+subterr[aâ]neo|sob\s+a\s+terra|debaixo\s+d['a]gua|em\s+(?:ambientes?|terrenos?|locais?|estruturas?|cidades?|florestas?|masmorras?|lugares?)|contra\b|para\s+(?:saltar|escapar|correr|fintar|nadar|escalar|interrogar|disfarce|disfarcar|abrir|procurar|notar|encontrar|rastrear|identificar|resistir|evitar|assustar|entrar|obter|prestar|acalmar|seduzir|influenciar|mentir|passar|ocultar)\b|realizados?\s+(?:em|no|na|sob|contra|para)\b|ao\s+(?:lidar|fazer|tentar|atacar|usar)\b|com\s+(?:criaturas|devotos|animais|pessoas)|at[eé]\s+o\s+fim\s+da\s+cena|por\s+\d+\s+rodadas?|por\s+1\s+rodada)/i;
  const preCondRegex = /^(?:quando\b|se\s+(?:estiver|voc[eê]|passar|fizer|usar|empunhar|acertar|houver)|enquanto\b|caso\b|ao\s+[a-z]+|postura\s+de\s+combate)/i;

  // Padrão 1: Bônus direto em perícias listadas (ex: "+2 em Acrobacia, Atuação e Diplomacia", "recebe +2 na Defesa e Reflexos")
  const pattern = /(?:recebe\s+|ganha\s+|possui\s+|tem\s+)?(?:um\s+)?(?:b[oô]nus\s+de\s+)?\+(\d+)\s+(?:de\s+b[oô]nus\s+)?(?:em\s+|nas?\s+per[ií]cias?\s+|na\s+defesa\s+e\s+(?:em\s+)?)(?:testes\s+de\s+)?([^.\n;]+)/gi;
  let match;
  while ((match = pattern.exec(norm)) !== null) {
    const val = parseInt(match[1], 10);
    const chunk = match[2];
    const matchStart = match.index;
    const sentenceStart = Math.max(0, norm.lastIndexOf('.', matchStart), norm.lastIndexOf('\n', matchStart));
    const preSentence = norm.slice(sentenceStart === 0 ? 0 : sentenceStart + 1, matchStart).trim();
    
    const skillChunk = chunk.split(/\b(?:e\s+pode|al[eé]m\s+disso)\b/i)[0];
    // Se o bônus for situacional/condicional, descarta (não soma na ficha de forma fixa)
    if (chunkCondRegex.test(skillChunk) || preCondRegex.test(preSentence) || /postura de combate/i.test(featName)) {
      continue;
    }
    // Evita falsos positivos onde o bônus é em ataque/dano mas menciona perícia como restrição
    if (/(?:ataque|rolagens?\s+de\s+dano)/i.test(preSentence) || /(?:ataque|rolagens?\s+de\s+dano)/i.test(norm.slice(matchStart, matchStart + 20))) {
      continue;
    }

    for (const sk of canonicalSkills) {
      if (new RegExp('\\b' + sk + '\\b').test(chunk)) {
        if (!alreadyExplicitSkillIds.has(sk)) {
          effects.push({ tipo: 'bonus_pericia', periciaId: sk, valor: val, feature });
        }
      }
    }
  }

  // Padrão 2: Bônus em todas as perícias baseadas em um determinado atributo
  const attrPattern = /(?:recebe|ganha|possui|\+)\s*(?:um\s+b[oô]nus\s+de\s+)?\+?(\d+)\s+(?:de\s+b[oô]nus\s+)?(?:em\s+)?(?:todos\s+os\s+)?(?:testes\s+de\s+)?per[ií]cias\s+baseadas\s+em\s+(carisma|forca|destreza|inteligencia|sabedoria|constituicao)/gi;
  let attrMatch;
  const attrMap = { carisma: 'car', forca: 'for', destreza: 'des', inteligencia: 'int', sabedoria: 'sab', constituicao: 'con' };
  while ((attrMatch = attrPattern.exec(norm)) !== null) {
    const val = parseInt(attrMatch[1], 10);
    const targetAttr = attrMap[attrMatch[2]];
    const matchStart = attrMatch.index;
    const sentenceStart = Math.max(0, norm.lastIndexOf('.', matchStart), norm.lastIndexOf('\n', matchStart));
    const preSentence = norm.slice(sentenceStart === 0 ? 0 : sentenceStart + 1, matchStart).trim();
    if (preCondRegex.test(preSentence) || chunkCondRegex.test(norm.slice(matchStart, matchStart + attrMatch[0].length + 40))) {
      continue;
    }
    if (targetAttr) {
      effects.push({ tipo: 'bonus_pericias_por_atributo', atributo: targetAttr, valor: val, feature });
    }
  }

  return effects;
}
function selectedFeatureEffects(){return selectedCharacterFeatures().flatMap(feature=>[...(feature.efeitos||[]).map(effect=>({...effect,feature})),...inferredFeatureEffects(feature)]) }
function characterMysticElementData(){
  return {
    agua: { name: 'Água', damage: 'frio', school: 'encantamento', skill: 'diplomacia' },
    ar: { name: 'Ar', damage: 'eletricidade', school: 'ilusao', skill: 'enganacao' },
    fogo: { name: 'Fogo', damage: 'fogo', school: 'transmutacao', skill: 'acrobacia' },
    luz: { name: 'Luz', damage: 'luz', school: 'abjuracao', skill: 'cura' },
    terra: { name: 'Terra', damage: 'acido', school: 'convocacao', skill: 'investigacao' },
    trevas: { name: 'Trevas', damage: 'trevas', school: 'necromancia', skill: 'intimidacao' }
  };
}

function characterMysticAffinities(){
  const isMystic = state.identity.classId === 'mistico' || (state.progression || []).some(row => row.classId === 'mistico');
  if(!isMystic) return [];
  const affinities = [], data = characterMysticElementData();
  const primary = state.identity.classChoices?.elemento || state.identity.classChoices?.afinidade;
  if(primary && data[primary]) affinities.push(primary);

  const hasExpanded = state.identity.classChoices?.afinidade_evoluida === 'afinidade_expandida' ||
    (state.progression || []).some(r => r.powerId === 'mistico_afinidade_expandida' || r.powerId === 'afinidade_expandida') ||
    Boolean(state.identity.classChoices?.afinidade_expandida_elemento || state.identity.classChoices?.elemento_secundario);
  const secondary = state.identity.classChoices?.afinidade_expandida_elemento || state.identity.classChoices?.elemento_secundario;
  if(hasExpanded && secondary && data[secondary] && !affinities.includes(secondary)) {
    affinities.push(secondary);
  }

  const hasMajor = (state.progression || []).some(r => r.powerId === 'mistico_afinidade_maior');
  const tertiary = state.identity.classChoices?.afinidade_maior_elemento || state.identity.classChoices?.elemento_terciario;
  if(hasMajor && tertiary && data[terciary] && !affinities.includes(terciary)) {
    affinities.push(terciary);
  }
  return affinities;
}

const allTrainedSkillsBeforePassives=allTrainedSkills;
function mysticAffinityTrainedSkill(){
  const affs = characterMysticAffinities(), data = characterMysticElementData();
  return affs.length ? data[affs[0]]?.skill : null;
}
allTrainedSkills=function(){
  const values=allTrainedSkillsBeforePassives(), data = characterMysticElementData();
  for(const effect of selectedFeatureEffects())if(['pericia_treinada','treinar_pericia'].includes(effect.tipo)){for(const id of effect.pericias||[effect.periciaId])if(id)values.push(id)}
  for(const elem of characterMysticAffinities()){
    const sk = data[elem]?.skill;
    if(sk) values.push(sk);
  }
  return [...new Set(values)];
};
function characterClassLevel(classId){
  if(!classId) return 1;
  const progressionLevels = (state.progression || []).filter(row => row.classId === classId).length;
  if(progressionLevels > 0) return progressionLevels;
  if(state.identity.classId === classId) return Number(state.identity.plannedLevel) || 1;
  return 0;
}
function formatWeaponCritical(value){
  if(!value) return '2x';
  const margin = Number(value.margem) || 20, multiplier = Number(value.multiplicador) || 2;
  return margin < 20 ? (multiplier === 2 ? String(margin) : margin + '/' + multiplier + 'x') : multiplier + 'x';
}
function passiveCharacterEffects(){
  return typeof ForjaCalculo!=='undefined'
    ? ForjaCalculo.obter('efeitos-passivos',calculatePassiveCharacterEffects)
    : calculatePassiveCharacterEffects();
}
function characterTormentaPowersCount(){
  const features = typeof selectedCharacterFeatures === 'function' ? selectedCharacterFeatures() : [];
  let count = 0;
  const seen = new Set();
  for(const f of features){
    const sId = slug(f.id || f.nome || '');
    if(seen.has(sId)) continue;
    seen.add(sId);
    const cat = f.categoria || (typeof DATA !== 'undefined' && DATA.generalPowers ? DATA.generalPowers.find(p => p.id === f.id || slug(p.nome) === sId)?.categoria : null);
    if(cat === 'tormenta' || f.countAsTormentaPower || f.isTormenta || sId === 'escolhido_de_aharadak' || sId.includes('escolhido_de_aharadak')){
      count++;
    }
  }
  if(state?.identity?.raceId === 'lefou' && count < 2){
    count = 2;
  }
  return Math.max(0, count);
}
function calculatePassiveCharacterEffects(){
  const result={defenseAttribute:'des',defenseBonus:0,skillBonuses:{},movementBonus:0,pvPerLevel:0,pmPerLevel:0,pvFlat:0,pmFlat:0,sizeShift:0,reductions:[],appliedInsolencia:false};
  const addSkill=(id,value)=>{if(id)result.skillBonuses[id]=(result.skillBonuses[id]||0)+Number(value||0)};
  const armorRec = typeof equippedArmorRecord === 'function' ? equippedArmorRecord() : null;
  const equippedArm = armorRec?.item || (typeof equippedArmorItem === 'function' ? equippedArmorItem() : null);
  const isWearingHeavyArmor = equippedArm
    ? (equippedArm.armadura?.categoriaId === 'pesada' || equippedArm.categoriaId === 'pesada' || equippedArm.tipo === 'armadura_pesada')
    : (typeof characterInventory === 'function' ? characterInventory() : []).some(entry => {
        const it = (typeof DATA !== 'undefined' && DATA.pdfItems) ? DATA.pdfItems.find(item => item.id === entry.itemId) : (entry.item || null);
        return (entry.equipped || entry.isEquipped || entry.equipado) && (it?.armadura?.categoriaId === 'pesada' || entry.tipo === 'armadura_pesada' || it?.tipo === 'armadura_pesada' || entry.item?.categoriaId === 'pesada');
      });
  const immobile=typeof sheetConditions==='function'&&sheetConditions().some(name=>['Imóvel','Agarrado','Paralisado','Petrificado','Inconsciente'].includes(name));
  for(const effect of selectedFeatureEffects()){
    const conditional=effect.condicao||effect.condicoes||effect.duracao||effect.gatilho;
    const restrictions=effect.restricoes||[];
    if(restrictions.some(rule=>(rule==='nao_usar_armadura_pesada'&&isWearingHeavyArmor)||(['nao_estar_imovel','exige_liberdade_de_movimentos'].includes(rule)&&immobile)))continue;
    if(effect.tipo==='somar_atributo_defesa'&&!conditional){
      const cls=(typeof DATA!=='undefined'&&DATA?.classes)?DATA.classes.find(c=>c.habilidades?.some(h=>h.id===effect.feature?.id)):null;
      const clsLevel=cls?characterClassLevel(cls.id):(Number(state.identity?.plannedLevel)||1);
      const attrVal = Math.max(0, Number(finalAttrs()[effect.atributo] || 0));
      const bonus = Math.min(attrVal, effect.limite==='nivel'?clsLevel:Infinity);
      result.defenseBonus += bonus;
      if(effect.feature?.id === 'bucaneiro_insolencia' || effect.feature?.id === 'insolencia' || effect.feature?.id === 'duelista_insolencia'){
        result.appliedInsolencia = true;
      }
    }
    if(effect.tipo==='bonus_progressivo'&&!conditional){
      const cls=DATA.classes.find(cls=>cls.habilidades?.some(h=>h.id===effect.feature?.id)),level=cls?characterClassLevel(cls.id):(Number(state.identity.plannedLevel)||1),start=Number(effect.nivelInicial)||1;
      if(level>=start){
        let bonus=Number(effect.bonusInicial||0)+Math.floor((level-start)/(Number(effect.aumentaACadaNiveis)||1))*Number(effect.bonusPorAumento||0);
        if(effect.feature?.id==='mistico_tradicao_oral'){
          bonus = level >= 13 ? 6 : level >= 9 ? 4 : 2;
        }
        for(const target of effect.alvos||[])if(target.tipo==='defesa')result.defenseBonus+=bonus;else if(target.tipo==='pericia')addSkill(target.id,bonus);
      }
    }
    if(effect.tipo==='substituir_atributo_defesa')result.defenseAttribute=effect.para||result.defenseAttribute;
    if(effect.tipo==='bonus_defesa'&&!conditional)result.defenseBonus+=Number(effect.valor??effect.bonus??0);
    if(effect.tipo==='bonus_deslocamento'&&!conditional)result.movementBonus+=Number(effect.valor??effect.bonus??0);
    if(effect.tipo==='bonus_pv'&&!conditional){const first=Number(effect.nivel1??effect.valor??effect.bonus??0),following=Number(effect.porNivelApos1||0);result.pvFlat+=first-following;result.pvPerLevel+=following}
    if(effect.tipo==='bonus_pv_por_nivel'&&!conditional)result.pvPerLevel+=Number(effect.valor??effect.bonus??0);
    if(effect.tipo==='bonus_pm_por_nivel'&&!conditional)result.pmPerLevel+=Number(effect.valor??effect.bonus??0);
    if(effect.tipo==='bonus_pm'&&!conditional)result.pmFlat+=Number(effect.valor??effect.bonus??0);
    if(effect.tipo==='somar_atributo_recurso'&&effect.recurso==='pm'&&!conditional){
      const isBaseSpellcasting=(effect.feature?.efeitos||[]).some(e=>e.tipo==='conjuracao'||e.tipo==='definir_atributo_chave_magia')||/_magias$/i.test(effect.feature?.id||'');
      if(!isBaseSpellcasting){
        const key=effect.atributo==='atributo_chave_magia'?(typeof characterSpellKeyAttribute==='function'?characterSpellKeyAttribute('arcanista'):'int'):effect.atributo;
        result.pmFlat+=Number(finalAttrs()[key]||0);
      }
    }
    if((effect.tipo==='bonus_pericia'||effect.tipo==='penalidade_pericia')&&!conditional){for(const id of effect.pericias||[effect.periciaId])addSkill(id,effect.valor??effect.bonus??effect.penalidade)}
    if(effect.tipo==='bonus_pericias_por_atributo'&&!conditional){
      const skillList = typeof SKILLS !== 'undefined' ? SKILLS : [];
      for(const [sk] of skillList){
        const effective = typeof skillEffectiveAttribute === 'function' ? skillEffectiveAttribute(sk) : '';
        if(effective === effect.atributo && sk !== effect.excetoPericia){
          addSkill(sk, effect.valor??effect.bonus??0);
        }
      }
    }
    if(effect.tipo==='reducao_dano'&&!conditional){
      if(Array.isArray(effect.tipos) && effect.tipos.length > 0){
        for(const t of effect.tipos){
          result.reductions.push({ tipo: 'reducao_dano', danoTipo: t, valor: effect.valor, feature: effect.feature });
        }
      } else {
        result.reductions.push(effect);
      }
    }
    if(effect.tipo==='bonus_defesa_progressivo'&&!conditional){
      const cls=DATA.classes?.find(c=>c.habilidades?.some(h=>h.id===effect.feature?.id)),level=cls?characterClassLevel(cls.id):(Number(state.identity?.plannedLevel)||1),start=Number(effect.nivelInicial)||1;
      if(level>=start){
        const step=Number(effect.aumentaACadaNiveis)||1,bInit=Number(effect.bonusInicial)||1,bStep=Number(effect.bonusPorAumento)||1;
        result.defenseBonus+=bInit+Math.floor((level-start)/step)*bStep;
      }
    }
    if(effect.tipo==='reducao_dano_progressiva'&&!conditional){
      const cls=DATA.classes?.find(c=>c.habilidades?.some(h=>h.id===effect.feature?.id)),level=cls?characterClassLevel(cls.id):(Number(state.identity?.plannedLevel)||1),start=Number(effect.nivelInicial)||1;
      if(level>=start){
        const step=Number(effect.aumentaACadaNiveis)||1,vInit=Number(effect.valorInicial)||1,vStep=Number(effect.valorPorAumento)||1;
        let val=vInit+Math.floor((level-start)/step)*vStep;
        if(effect.maximo)val=Math.min(val,Number(effect.maximo));
        result.reductions.push({ tipo: 'reducao_dano', danoTipo: 'todos', valor: val });
      }
    }
  }
  const mysticLvl = (state.progression||[]).filter(r=>r.classId==='mistico').length || (state.identity.classId==='mistico' ? Number(state.identity.plannedLevel)||1 : 0);
  if(mysticLvl > 0){
    const maxCircle = mysticLvl >= 14 ? 4 : mysticLvl >= 10 ? 3 : mysticLvl >= 6 ? 2 : 1, data = characterMysticElementData();
    for(const elem of characterMysticAffinities()){
      const dType = data[elem]?.damage;
      if(dType && !result.reductions.some(r=>r.danoTipo===dType)) result.reductions.push({ tipo: 'reducao_dano', danoTipo: dType, valor: 5 * maxCircle });
    }
  }
  if(typeof hasFamiliarElementalPower === 'function' && hasFamiliarElementalPower()){
    const chosenFam = typeof getSelectedElementalFamiliarId === 'function' ? getSelectedElementalFamiliarId() : '';
    if(chosenFam === 'terrier'){
      result.reductions.push({ tipo: 'reducao_dano', danoTipo: 'impacto', valor: 2 });
    }
  }
  if(typeof hasCriacaoDosDeuses === 'function' && hasCriacaoDosDeuses()){
    const opt = typeof getCriacaoDosDeusesPowerOption === 'function' ? getCriacaoDosDeusesPowerOption() : null;
    if(opt && opt.rdType){
      result.reductions.push({ tipo: 'reducao_dano', danoTipo: opt.rdType, valor: 5 });
    }
  }
  if(characterHasFeature('escolhido_de_marah') || characterHasFeature('criacao_dos_deuses_escolhido_de_marah')){
    addSkill('adestramento', 2);
    addSkill('atuacao', 2);
    addSkill('diplomacia', 2);
  }
  if(characterHasFeature('escolhido_de_arsenal') || characterHasFeature('criacao_dos_deuses_escolhido_de_arsenal')){
    addSkill('diplomacia', -2);
  }
  if(characterHasFeature('escolhido_de_sszzaas') || characterHasFeature('criacao_dos_deuses_escolhido_de_sszzaas') ||
     characterHasFeature('escolhido_de_hyninn') || characterHasFeature('criacao_dos_deuses_escolhido_de_hyninn')){
    addSkill('furtividade', 2);
  }
  if(characterHasFeature('estilo_de_uma_arma')&&singleWeaponStyleActive())result.defenseBonus+=2;
  if(characterHasFeature('inexpugnavel') && isWearingHeavyArmor){
    addSkill('fortitude', 2);
    addSkill('reflexos', 2);
    addSkill('vontade', 2);
  }
  if(characterHasFeature('encouracado') && isWearingHeavyArmor){
    let encBonus = 2;
    if(characterHasFeature('inexpugnavel')) encBonus += 2;
    if(characterHasFeature('encastelado')) encBonus += 2;
    if(characterHasFeature('fanatico')) encBonus += 2;
    result.defenseBonus += encBonus;
  }
  if(characterHasFeature('encastelado') && isWearingHeavyArmor){
    let rdVal = 2;
    if(characterHasFeature('inexpugnavel')) rdVal += 1;
    if(characterHasFeature('fanatico')) rdVal += 1;
    result.reductions.push({ tipo: 'reducao_dano', danoTipo: 'todos', valor: rdVal });
  }

  // Bárbaro
  if(characterHasFeature('barbaro_pele_de_ferro') && !isWearingHeavyArmor){
    result.defenseBonus += characterHasFeature('barbaro_pele_de_aco') ? 8 : 4;
  }
  if(characterHasFeature('barbaro_totem_espiritual')){
    result.pmFlat += Math.max(0, Number(finalAttrs().sab || 0));
  }
  const barbLevel = typeof characterClassLevel === 'function' ? characterClassLevel('barbaro') : ((state.progression || []).filter(r => r.classId === 'barbaro').length || (state.identity?.classId === 'barbaro' ? Number(state.identity?.plannedLevel) || 1 : 0));
  if(characterHasFeature('barbaro_instinto_selvagem') && barbLevel >= 3){
    const instBonus = 1 + Math.floor((barbLevel - 3) / 6);
    addSkill('percepcao', instBonus);
    addSkill('reflexos', instBonus);
  }

  // Lutador
  if(characterHasFeature('lutador_sarado')){
    const forMod = Math.max(0, Number(finalAttrs().for || 0));
    result.pvFlat += forMod;
    addSkill('fortitude', forMod);
  }

  // Cavaleiro
  const hasBastiao = characterHasFeature('bastiao') ||
    (state.progression || []).some(r => r.powerChoice === 'bastiao' || r.choice === 'bastiao') ||
    state.identity?.classChoices?.caminho_do_cavaleiro === 'bastiao' ||
    state.identity?.classChoices?.['cavaleiro_caminho_do_cavaleiro'] === 'bastiao';
  if(hasBastiao && isWearingHeavyArmor){
    result.reductions.push({ tipo: 'reducao_dano', danoTipo: 'todos', valor: 5 });
  }
  if(characterHasFeature('cavaleiro_especializacao_em_armadura') && isWearingHeavyArmor){
    result.reductions.push({ tipo: 'reducao_dano', danoTipo: 'todos', valor: 5 });
  }
  if(characterHasFeature('cavaleiro_solidez')){
    const eqShield = typeof equipmentState === 'function' ? equipmentState().shieldId : null;
    const inv = typeof characterInventory === 'function' ? characterInventory() : [];
    let shieldDef = 0;
    for(const entry of inv){
      const it = (typeof DATA !== 'undefined' && DATA.pdfItems) ? DATA.pdfItems.find(item => item.id === entry.itemId) : null;
      const isEq = Boolean(entry.isEquipped || entry.equipado || entry.id === eqShield || entry.itemId === eqShield);
      if(isEq && (entry.tipo === 'escudo' || it?.tipo === 'escudo' || it?.armadura?.categoriaId === 'escudo' || entry.armadura?.categoriaId === 'escudo')){
        const b = Number(it?.armadura?.bonusDefesa || entry.armadura?.bonusDefesa || (entry.itemId === 'escudo_pesado' ? 2 : 1));
        if(b > shieldDef) shieldDef = b;
      }
    }
    if(shieldDef > 0){
      addSkill('fortitude', shieldDef);
      addSkill('reflexos', shieldDef);
      addSkill('vontade', shieldDef);
    }
  }
  // Paladino
  if(characterHasFeature('paladino_aura_sagrada') || characterHasFeature('aura_sagrada')){
    const carMod = Math.max(0, Number(finalAttrs().car || 0));
    if(carMod > 0){
      addSkill('fortitude', carMod);
      addSkill('reflexos', carMod);
      addSkill('vontade', carMod);
    }
  }
  if(characterHasFeature('paladino_aura_de_invencibilidade') || characterHasFeature('aura_de_invencibilidade')){
    result.reductions.push({ tipo: 'reducao_dano', danoTipo: 'todos', valor: 5 });
  }

  // Ladino
  if(characterHasFeature('ladino_mente_criminosa')){
    const intMod = Math.max(0, Number(finalAttrs().int || 0));
    addSkill('ladinagem', intMod);
    addSkill('furtividade', intMod);
  }

  // Bucaneiro
  if(characterHasFeature('bucaneiro_presenca_paralisante')){
    addSkill('iniciativa', Math.max(0, Number(finalAttrs().car || 0)));
  }

  // Caçador
  if(characterHasFeature('cacador_heroi_do_povo')){
    result.defenseBonus += 2;
    addSkill('fortitude', 2);
    addSkill('reflexos', 2);
    addSkill('vontade', 2);
  }

  // Guerreiro
  if(characterHasFeature('guerreiro_soldado_de_infantaria')){
    result.movementBonus += 3;
  }

  // Arcanista
  if(characterHasFeature('arcanista_poder_magico')){
    const arcLvl = typeof characterClassLevel === 'function' ? characterClassLevel('arcanista') : ((state.progression || []).filter(r => r.classId === 'arcanista').length || (state.identity?.classId === 'arcanista' ? Number(state.identity?.plannedLevel) || 1 : 0));
    result.pmFlat += arcLvl;
  }

  // Druida
  if(characterHasFeature('druida_xama_mistico')){
    const druidLvl = typeof characterClassLevel === 'function' ? characterClassLevel('druida') : ((state.progression || []).filter(r => r.classId === 'druida').length || (state.identity?.classId === 'druida' ? Number(state.identity?.plannedLevel) || 1 : 0));
    result.pmFlat += druidLvl;
  }

  // Nobre
  if(characterHasFeature('nobre_lider_energico')){
    addSkill('iniciativa', Math.max(0, Number(finalAttrs().car || 0)));
  }

  // Poderes Gerais e Concedidos (Lote 4)
  const totalCharLvl = Math.max(1, Number(state?.identity?.plannedLevel) || (Array.isArray(state?.progression) ? state.progression.length : 1));
  if(characterHasFeature('vontade_de_ferro')){
    result.pmFlat += Math.floor(totalCharLvl / 2);
  }
  if(characterHasFeature('atletico')){
    result.movementBonus += 3;
  }
  if(characterHasFeature('investigador')){
    addSkill('intuicao', Math.max(0, Number(finalAttrs().int || 0)));
  }
  if(characterHasFeature('bencao_do_mana')){
    result.pmFlat += Math.ceil(totalCharLvl / 2);
  }

  const tCount = characterTormentaPowersCount();
  const otherTCount = Math.max(0, tCount - 1);
  if(characterHasFeature('pele_corrompida')){
    const rdVal = 2 + 2 * Math.floor(otherTCount / 2);
    for(const dt of ['acido','eletricidade','fogo','frio','luz','trevas']){
      result.reductions.push({ tipo: 'reducao_dano', danoTipo: dt, valor: rdVal });
    }
  }
  const stdOrigin = typeof selectedStandardOrigin === 'function' ? selectedStandardOrigin() : null;
  const regOrigin = typeof selectedRegionalOrigin === 'function' ? selectedRegionalOrigin() : null;
  if(stdOrigin?.nome === 'Caçador de Ratos' || regOrigin?.nome === 'Caçador de Ratos' || state.origin?.standard === 'cacador_de_ratos' || state.origin?.regional === 'cacador_de_ratos'){
    addSkill('percepcao', 2);
    addSkill('sobrevivencia', 2);
  }
  const isHippion = stdOrigin?.nome === 'Amazona de Hippion' || regOrigin?.nome === 'Amazona de Hippion' || state.origin?.standard === 'amazona_de_hippion' || state.origin?.regional === 'amazona_de_hippion' || state.origin?.regional === 'Amazona de Hippion';
  if(isHippion && !isWearingHeavyArmor){
    result.pmFlat += Math.max(0, Number(finalAttrs().car || 0));
  }
  const isCativoDasFadas = stdOrigin?.nome === 'Cativo das Fadas' || regOrigin?.nome === 'Cativo das Fadas' || state.origin?.standard === 'cativo_das_fadas' || state.origin?.regional === 'cativo_das_fadas';
  if(isCativoDasFadas){
    result.pvPerLevel += 1;
  }
  const isCriadoVoracis = stdOrigin?.nome === 'Criado pelas Voracis' || regOrigin?.nome === 'Criado pelas Voracis' || state.origin?.standard === 'criado_pelas_voracis' || state.origin?.regional === 'criado_pelas_voracis';
  if(isCriadoVoracis){
    result.defenseBonus += 2;
    result.movementBonus += 3;
    addSkill('sobrevivencia', 2);
  }
  const isExploradorRuinas = stdOrigin?.nome === 'Explorador de Ruínas' || regOrigin?.nome === 'Explorador de Ruínas' || state.origin?.standard === 'explorador_de_ruinas' || state.origin?.regional === 'explorador_de_ruinas';
  if(isExploradorRuinas){
    result.movementBonus += 3;
    addSkill('ladinagem', 2);
    addSkill('percepcao', 2);
    addSkill('reflexos', 2);
  }
  const isEstudanteAcademia = stdOrigin?.nome === 'Estudante da Academia' || regOrigin?.nome === 'Estudante da Academia' || state.origin?.standard === 'estudante_da_academia' || state.origin?.regional === 'estudante_da_academia';
  if(isEstudanteAcademia){
    const otherTrained = new Set([
      ...(typeof mandatoryClassSkills === 'function' ? mandatoryClassSkills() : []),
      ...(typeof raceFixedSkills === 'function' ? raceFixedSkills() : []),
      ...(typeof originSkillIds === 'function' ? originSkillIds() : []),
      ...(state.skills.class || []),
      ...(state.skills.int || []),
      ...(state.skills.race || []),
      ...(state.skills.duplicate || [])
    ]);
    if(otherTrained.has('misticismo')){
      addSkill('misticismo', 2);
    }else{
      const tb = typeof characterTrainingBonus === 'function' ? characterTrainingBonus() : 2;
      addSkill('misticismo', -tb);
    }
  }
  const isEscudeiroLuz = stdOrigin?.nome === 'Escudeiro da Luz' || regOrigin?.nome === 'Escudeiro da Luz' || state.origin?.standard === 'escudeiro_da_luz' || state.origin?.regional === 'escudeiro_da_luz';
  if(isEscudeiroLuz){
    result.defenseBonus += 2;
    result.pmFlat += 3;
  }
  const isColleniano = stdOrigin?.nome === 'Descendente colleniano' || regOrigin?.nome === 'Descendente colleniano' || stdOrigin?.nome === 'Descendente Colleniano' || regOrigin?.nome === 'Descendente Colleniano' || state.origin?.standard === 'descendente_colleniano' || state.origin?.regional === 'descendente_colleniano';
  if(isColleniano){
    addSkill('percepcao', 2);
  }
  const isEstandarteVivo = stdOrigin?.nome === 'Estandarte Vivo' || regOrigin?.nome === 'Estandarte Vivo' || state.origin?.standard === 'estandarte_vivo' || state.origin?.regional === 'estandarte_vivo';
  if(isEstandarteVivo){
    addSkill('sobrevivencia', 2);
  }
  const isGuardiaoGlacial = stdOrigin?.nome === 'Guardião Glacial' || regOrigin?.nome === 'Guardião Glacial' || state.origin?.standard === 'guardiao_glacial' || state.origin?.regional === 'guardiao_glacial';
  if(isGuardiaoGlacial){
    result.reductions.push({ tipo: 'reducao_dano', danoTipo: 'frio', valor: 5 });
  }
  const isInsurgente = stdOrigin?.nome === 'Insurgente Tapistano' || regOrigin?.nome === 'Insurgente Tapistano' || state.origin?.standard === 'insurgente_tapistano' || state.origin?.regional === 'insurgente_tapistano';
  if(isInsurgente){
    addSkill('fortitude', 1);
    addSkill('reflexos', 1);
    addSkill('vontade', 1);
    result.pvFlat += 2;
    result.pvPerLevel += 1;
  }
  const isLegionario = stdOrigin?.nome === 'Legionário' || regOrigin?.nome === 'Legionário' || state.origin?.standard === 'legionario' || state.origin?.regional === 'legionario';
  if(isLegionario){
    const inv = typeof characterInventory === 'function' ? characterInventory() : [];
    const hasGladio = inv.some(e => (e.equipped || e.isEquipped || e.equipado) && (e.itemId === 'gladio' || /gl[aá]dio/i.test(e.nome || e.item?.nome || '')));
    const hasShield = inv.some(e => (e.equipped || e.isEquipped || e.equipado) && (e.item?.escudo?.categoriaId === 'pesado' || /escudo pesado/i.test(e.nome || e.item?.nome || '')));
    if(hasGladio && hasShield) result.defenseBonus += 1;
  }
  const isLiricista = stdOrigin?.nome === 'Liricista de Lenórienn' || regOrigin?.nome === 'Liricista de Lenórienn' || state.origin?.standard === 'liricista_de_lenorien' || state.origin?.regional === 'liricista_de_lenorien' || state.origin?.regional === 'liricista_de_lenorienn';
  if(isLiricista){
    addSkill('atuacao', 2);
  }
  const isNobreZakharov = stdOrigin?.nome === 'Nobre Zakharoviano' || regOrigin?.nome === 'Nobre Zakharoviano' || state.origin?.standard === 'nobre_zakharoviano' || state.origin?.regional === 'nobre_zakharoviano';
  if(isNobreZakharov){
    const plannedLvl = Number(state.identity?.plannedLevel) || 1;
    const tier = plannedLvl >= 17 ? 4 : plannedLvl >= 11 ? 3 : plannedLvl >= 5 ? 2 : 1;
    result.pmFlat += 2 * tier;
  }
  const isNomadeSarAllan = stdOrigin?.nome === 'Nômade Sar-Allan' || regOrigin?.nome === 'Nômade Sar-Allan' || state.origin?.standard === 'nomade_sar_allan' || state.origin?.regional === 'nomade_sar_allan';
  if(isNomadeSarAllan){
    addSkill('fortitude', 2);
    addSkill('sobrevivencia', 2);
  }
  const isPescadorParrudo = stdOrigin?.nome === 'Pescador Parrudo' || regOrigin?.nome === 'Pescador Parrudo' || state.origin?.standard === 'pescador_parrudo' || state.origin?.regional === 'pescador_parrudo';
  if(isPescadorParrudo){
    addSkill('atletismo', 2);
    addSkill('fortitude', 2);
    addSkill('sobrevivencia', 2);
    result.pvFlat += 3;
  }
  const isPlebeuArcano = stdOrigin?.nome === 'Plebeu Arcano' || regOrigin?.nome === 'Plebeu Arcano' || state.origin?.standard === 'plebeu_arcano' || state.origin?.regional === 'plebeu_arcano';
  if(isPlebeuArcano){
    result.pmFlat += 2;
  }
  const isQueridoFilho = stdOrigin?.nome === 'Querido Filho' || regOrigin?.nome === 'Querido Filho' || state.origin?.standard === 'querido_filho' || state.origin?.regional === 'querido_filho';
  if(isQueridoFilho){
    result.reductions.push({ tipo: 'reducao_dano', danoTipo: 'frio', valor: 5 });
    result.reductions.push({ tipo: 'reducao_dano', danoTipo: 'trevas', valor: 5 });
    const hasDarkvision = selectedCharacterFeatures().some(f => /vis[aã]o no escuro/i.test(f.nome || '') && slug(f.id || '') !== 'querido_filho');
    if(hasDarkvision) addSkill('percepcao', 2);
  }
  const isRecrutaFenix = stdOrigin?.nome === 'Recruta da Fênix' || regOrigin?.nome === 'Recruta da Fênix' || state.origin?.standard === 'recruta_da_fenix' || state.origin?.regional === 'recruta_da_fenix';
  if(isRecrutaFenix){
    result.pvPerLevel += 1;
    result.reductions.push({ tipo: 'reducao_dano', danoTipo: 'fogo', valor: 5 });
  }
  const isSelvagem = stdOrigin?.nome === 'Selvagem Sanguinário' || regOrigin?.nome === 'Selvagem Sanguinário' || state.origin?.standard === 'selvagem_sanguinario' || state.origin?.regional === 'selvagem_sanguinario';
  if(isSelvagem && !isWearingHeavyArmor){
    result.reductions.push({ tipo: 'reducao_dano', danoTipo: 'todos', valor: 1 });
  }
  const isTradicionalista = stdOrigin?.nome === 'Tradicionalista Svalano' || regOrigin?.nome === 'Tradicionalista Svalano' || state.origin?.standard === 'tradicionalista_svalano' || state.origin?.regional === 'tradicionalista_svalano';
  if(isTradicionalista){
    addSkill('fortitude', 1);
    addSkill('vontade', 1);
  }
  const isTrapaceiro = stdOrigin?.nome === 'Trapaceiro Ahleniense' || regOrigin?.nome === 'Trapaceiro Ahleniense' || state.origin?.standard === 'trapaceiro_ahleniense' || state.origin?.regional === 'trapaceiro_ahleniense';
  if(isTrapaceiro){
    addSkill('enganacao', 2);
    addSkill('furtividade', 2);
  }
  const isTurista = stdOrigin?.nome === 'Turista da Academia' || regOrigin?.nome === 'Turista da Academia' || state.origin?.standard === 'turista_da_academia' || state.origin?.regional === 'turista_da_academia';
  if(isTurista){
    result.spellResistance = (result.spellResistance || 0) + 2;
  }
  if(typeof hasDuploFeerico === 'function' && hasDuploFeerico()){
    const duplo = typeof selectedDuploFeericoPower === 'function' ? selectedDuploFeericoPower() : null;
    if(duplo?.isDuploSpell){
      result.pmFlat += 1;
    }
  }
  const inv = typeof characterInventory === 'function' ? characterInventory() : [];
  if(inv.some(e => e.itemId === 'lupa' || /lupa/i.test(e.itemId))) addSkill('investigacao', 1);
  if(inv.some(e => (e.itemId === 'fragmento_de_estandarte' || /fragmento.*estandarte/i.test(e.itemId || e.nome || '')) && (e.equipped || e.isEquipped || e.equipado))) {
    addSkill('vontade', 1);
  }
  if(inv.some(e => e.itemId === 'tatuagem_antiga_tripulacao' || /tatuagem.*tripulacao/i.test(e.itemId || e.nome || ''))) {
    addSkill('intimidacao', 1);
  }

  const CANONICAL_ITEM_SKILLS = {
    maleta_de_medicamentos: { skills: ['cura'], baseBonus: 0 },
    gazua: { skills: ['ladinagem'], baseBonus: 0 },
    instrumentos_de_oficio: { skills: ['oficio'], baseBonus: 0 },
    estojo_de_disfarces: { skills: ['enganacao'], baseBonus: 0 },
    equipamento_de_viagem: { skills: ['sobrevivencia'], baseBonus: 0 },
    sela: { skills: ['cavalgar'], baseBonus: 0 },
    luneta: { skills: ['percepcao'], baseBonus: 0 },
    pe_de_cabra: { skills: ['atletismo'], baseBonus: 0 },
    lupa: { skills: ['investigacao'], baseBonus: 0 },
    apito_de_caca: { skills: ['adestramento'], baseBonus: 1 },
    baralho_marcado: { skills: ['jogatina'], baseBonus: 2 },
    camisa_bufante: { skills: ['atuacao'], baseBonus: 1 },
    bandana: { skills: ['intimidacao'], baseBonus: 1 },
    capa_esvoacante: { skills: ['enganacao'], baseBonus: 1 },
    luva_de_pelica: { skills: ['ladinagem'], baseBonus: 1 },
    veste_de_seda: { skills: ['reflexos'], baseBonus: 1 },
    manto_camuflado: { skills: ['furtividade'], baseBonus: 2 },
    capa_pesada: { skills: ['fortitude'], baseBonus: 1 },
    casaco_longo: { skills: ['fortitude'], baseBonus: 0 },
    gorro_de_ervas: { skills: ['vontade'], baseBonus: 1 },
    robe_mistico: { skills: ['misticismo'], baseBonus: 1 },
    sapatos_de_camurca: { skills: ['acrobacia'], baseBonus: 1 },
    tabardo: { skills: ['diplomacia'], baseBonus: 1 },
    jaqueta_de_couro: { skills: ['investigacao'], baseBonus: 1 },
    luva_de_falcoaria: { skills: ['adestramento'], baseBonus: 2 },
    oculos_de_aeronauta: { skills: ['pilotagem'], baseBonus: 1 },
    farrapos_de_ermitao: { skills: ['adestramento'], baseBonus: 2 },
    andrajos_de_aldeao: { skills: ['investigacao'], baseBonus: 2 },
    habito_monastico: { skills: ['vontade'], baseBonus: 2 },
    habito_sacerdotal: { skills: ['diplomacia', 'enganacao', 'intimidacao'], baseBonus: 0 },
    traje_selako: { skills: ['atletismo'], baseBonus: 2 },
    anel_eclesiastico: { skills: ['diplomacia', 'intimidacao'], baseBonus: 1 },
    penas_do_predador_primal: { skills: ['atletismo'], baseBonus: 2 },
    fragmento_de_estandarte: { skills: ['vontade'], baseBonus: 1 },
    tatuagem_antiga_tripulacao: { skills: ['intimidacao'], baseBonus: 1 },
    tatuagem_adereco_gangue: { skills: ['intimidacao'], baseBonus: 1 },
    bolas_malabarismo: { skills: ['atuacao'], baseBonus: 1 },
    arreios_namalkahnianos: { skills: ['cavalgar'], baseBonus: 1 },
    caparazao: { skills: ['diplomacia', 'intimidacao'], baseBonus: 1 },
    cao_de_caca: { skills: ['percepcao', 'sobrevivencia'], baseBonus: 2 },
    maquiagem_profissional: { skills: ['enganacao'], baseBonus: 2 }
  };

  const eqState = typeof equipmentState === 'function' ? equipmentState() : null;
  const impDataList = (typeof DATA !== 'undefined' && DATA.improvementData && Array.isArray(DATA.improvementData.melhorias)) ? DATA.improvementData.melhorias : [];
  const impMap = new Map(impDataList.map(m => [m.id, m]));

  inv.forEach((e, idx) => {
    const catalogItem = (typeof DATA !== 'undefined' && DATA?.pdfItems) ? DATA.pdfItems.find(it => it.id === e.itemId) : null;
    const catId = String(e.categoriaId || catalogItem?.categoriaId || e.tipo || catalogItem?.tipo || '').toLowerCase();
    const isTool = catId === 'ferramenta' || ['maleta_de_medicamentos', 'gazua', 'instrumentos_de_oficio', 'estojo_de_disfarces', 'equipamento_de_viagem', 'sela', 'luneta', 'pe_de_cabra', 'apito_de_caca', 'baralho_marcado', 'colecao_de_livros'].includes(e.itemId);
    const isEquippedInSlots = Boolean(eqState && (
      (typeof matchEquipmentEntry === 'function' && (
        (eqState.armorId && matchEquipmentEntry(e, idx, eqState.armorId)) ||
        (eqState.weaponId && matchEquipmentEntry(e, idx, eqState.weaponId)) ||
        (eqState.offhandId && matchEquipmentEntry(e, idx, eqState.offhandId)) ||
        (eqState.shieldId && matchEquipmentEntry(e, idx, eqState.shieldId)) ||
        (eqState.trailerId && matchEquipmentEntry(e, idx, eqState.trailerId)) ||
        (Array.isArray(eqState.wornIds) && eqState.wornIds.some(wId => matchEquipmentEntry(e, idx, wId)))
      )) ||
      (eqState.armorId === e.itemId || eqState.armorId === e.id) ||
      (eqState.trailerId === e.itemId || eqState.trailerId === e.id) ||
      (Array.isArray(eqState.wornIds) && (eqState.wornIds.includes(e.itemId) || eqState.wornIds.includes(e.id)))
    ));
    const isEq = Boolean(e.equipped || e.isEquipped || e.equipado || isEquippedInSlots);
    const isCreationInitial = !state.finished && !state.sheetView && (state.step || 0) < 10;
    const isWearable = catId === 'vestuario' || /traje|vestuario|acessorio/i.test(catId) || catalogItem?.equipamento?.itemVestido;
    const isItemActive = isTool || isEq || (isWearable && isCreationInitial);

    if(!isItemActive) return;

    // 1. Bônus Intrínsecos do Item
    const canon = CANONICAL_ITEM_SKILLS[e.itemId];
    if(canon){
      if(canon.baseBonus > 0){
        for(const sk of canon.skills){
          addSkill(sk, canon.baseBonus);
        }
      }
    }
    if(e.itemId === 'colecao_de_livros' && e.options?.knowledge){
      addSkill(e.options.knowledge, 1);
    }
    if(e.itemId === 'mascara_completa' && (e.options?.skill || e.skill)){
      addSkill(e.options?.skill || e.skill, 1);
    }
    const combinedEfeitos = [...(e.efeitos || []), ...(catalogItem?.efeitos || [])];
    for(const ef of combinedEfeitos){
      if((ef.tipo === 'bonus_pericia' || ef.tipo === 'pericia') && ef.periciaId){
        addSkill(ef.periciaId, ef.bonus ?? ef.valor ?? 0);
      } else if(ef.tipo === 'penalidade_pericia' && ef.periciaId){
        addSkill(ef.periciaId, ef.penalidade ?? -(ef.valor ?? 0));
      }
    }

    // 2. Melhorias do Item
    const imps = Array.isArray(e.improvements) ? e.improvements : (Array.isArray(e.options?.improvements) ? e.options.improvements : []);
    for(const imp of imps){
      const impId = imp?.id || imp;
      const matId = imp?.materialId;
      if(impId === 'aprimorado'){
        let appliedAprimorado = false;
        if(canon && canon.skills && canon.skills.length > 0){
          for(const sk of canon.skills){
            const targetSk = (sk === 'oficio' && (e.options?.oficio || e.options?.craftSkill)) ? (e.options.oficio || e.options.craftSkill) : sk;
            addSkill(targetSk, 1);
            appliedAprimorado = true;
          }
        }
        if(e.itemId === 'colecao_de_livros' && e.options?.knowledge){
          addSkill(e.options.knowledge, 1);
          appliedAprimorado = true;
        }
        if(!appliedAprimorado){
          for(const ef of combinedEfeitos){
            if((ef.tipo === 'bonus_pericia' || ef.tipo === 'pericia') && ef.periciaId){
              addSkill(ef.periciaId, 1);
              appliedAprimorado = true;
            }
          }
        }
      } else if(impId === 'banhado_a_ouro'){
        addSkill('diplomacia', 2);
      } else if(impId === 'cravejado_de_gemas'){
        addSkill('enganacao', 2);
      } else if(impId === 'macabro'){
        addSkill('intimidacao', 2);
        addSkill('diplomacia', -2);
      } else if(impId === 'material_especial' && matId === 'materia_vermelha'){
        const carSkills = ['adestramento', 'atuacao', 'diplomacia', 'enganacao', 'jogatina'];
        for(const s of carSkills){
          addSkill(s, -2);
        }
      } else {
        const impDef = impMap.get(impId);
        if(impDef && Array.isArray(impDef.efeitos)){
          for(const ef of impDef.efeitos){
            if(ef.tipo === 'bonus_pericia' && ef.periciaId){
              addSkill(ef.periciaId, ef.bonus ?? ef.valor ?? 0);
            }
            if(ef.tipo === 'penalidade_pericia' && ef.periciaId){
              addSkill(ef.periciaId, ef.penalidade ?? -(ef.valor ?? 0));
            }
          }
        }
      }
    }
  });

  // Efeitos ativos de alimentos e bebidas da taverna (duram até o descanso)
  try {
    const rawTavern = (typeof localStorage !== 'undefined') ? localStorage.getItem('forja-taverna-contracts-v1') : null;
    if(rawTavern){
      const contracts = JSON.parse(rawTavern);
      if(Array.isArray(contracts)){
        for(const c of contracts){
          const cId = c.itemId || '';
          if(cId === 'cozido_de_pimenta'){
            addSkill('fortitude', 1);
          } else if(cId === 'barba_queimada'){
            result.reductions.push({ tipo: 'reducao_dano', danoTipo: 'todos', valor: 2 });
          } else if(cId === 'cerveja_deheoni'){
            addSkill('fortitude', 1);
            addSkill('reflexos', 1);
            addSkill('vontade', 1);
          }
        }
      }
    }
  } catch(_eTavern){}
  const activePartners = Array.isArray(state.partners) ? state.partners : [];
  const riding=activePartners.find(p=>p.mounted);
  if(riding&&typeof mountGear==='function'){
    const saddle=mountGear(riding).some(e=>e.itemId==='sela');
    if(!saddle)addSkill('cavalgar',-5);
    const mount=activeMountContext(true,characterSizeWithShift(result.sizeShift));
    if(mount){
      if(mount.gear.includes('caparazao')){addSkill('diplomacia',1);addSkill('intimidacao',1);}
      if(mount.species==='cao_de_caca'&&mount.tier!=='iniciante')result.defenseBonus+=2+RegrasMontarias.bonusArmaduraMontaria(mount.gear);
      if(mount.species==='trobo'){
        const bonus=(mount.tier==='mestre'?5:mount.tier==='veterano'?2:1)+RegrasMontarias.bonusArmaduraMontaria(mount.gear);
        ['fortitude','reflexos','vontade'].forEach(s=>addSkill(s,bonus));
      }
    }
  }
  for(const p of activePartners){
    const pType = slug(p.partnerType || p.tipo || p.type || '');
    const pGrau = slug(p.grau || p.tier || 'iniciante');
    if(pType.includes('guardiao')){
      result.defenseBonus += pGrau === 'mestre' ? 4 : pGrau === 'veterano' ? 3 : 2;
    }
    if(pType.includes('ajudante')){
      const val = pGrau === 'mestre' ? 4 : 2;
      const skills = Array.isArray(p.skills) ? p.skills : (Array.isArray(p.pericias) ? p.pericias : (p.skill ? [p.skill] : []));
      for(const sk of skills){
        if(sk && !['luta', 'pontaria'].includes(sk)){
          addSkill(sk, val);
        }
      }
    }
    if(pType.includes('vigilante')){
      const b = pGrau === 'mestre' ? 4 : 2;
      addSkill('percepcao', b);
      addSkill('iniciativa', b);
    }
    if(pType.includes('perseguidor')){
      const b = pGrau === 'mestre' ? 4 : 2;
      addSkill('percepcao', b);
      addSkill('sobrevivencia', b);
    }
    if(p.id === 'amigo_especial' || p.tipo === 'animal'){
      addSkill('adestramento', 5);
      const petSkill = p.pericia || state.partnerChoices?.animalSkill;
      if(petSkill) addSkill(petSkill, 2);
    }
    if(p.id === 'tumarkhan' || p.tipo === 'tumarkhan' || /tumarkh[aâ]n/i.test(p.nome || '')){
      addSkill('adestramento', 2);
      addSkill('cavalgar', 2);
    }
  }


  // Bônus em perícias baseadas em atributo (ex: Cosmopolita)
  if(characterHasFeature('cosmopolita')){
    const skillList = typeof SKILLS !== 'undefined' ? SKILLS : [];
    for(const [sk] of skillList){
      if(sk !== 'adestramento' && typeof skillEffectiveAttribute === 'function' && skillEffectiveAttribute(sk) === 'car'){
        addSkill(sk, 2);
      }
    }
  }

  // Bônus diretos de poderes concedidos, gerais e de classe
  if(characterHasFeature('mente_vazia')){ addSkill('vontade', 2); addSkill('iniciativa', 2); }
  if(characterHasFeature('tradicao_de_lin_wu')){ addSkill('diplomacia', 2); addSkill('nobreza', 2); }
  if(characterHasFeature('astucia_da_serpente')){ addSkill('enganacao', 2); addSkill('furtividade', 2); }
  if(characterHasFeature('sangue_ofidio')){ addSkill('fortitude', 5); }
  if(characterHasFeature('fulgor_solar')){ addSkill('percepcao', 2); }
  if(characterHasFeature('palavras_de_bondade')){ addSkill('diplomacia', 2); }
  if(characterHasFeature('olhar_amedrontador')){ addSkill('intimidacao', 2); }
  if(characterHasFeature('alquimista_prodigio')){ addSkill('oficio:alquimista', 2); addSkill('oficio_alquimista', 2); addSkill('oficio:alquimia', 2); }
  if(characterHasFeature('dom_da_verdade')){ addSkill('intuicao', 2); addSkill('investigacao', 2); }
  if(characterHasFeature('voz_da_civilizacao')){ addSkill('diplomacia', 2); }
  if(characterHasFeature('voz_poderosa')){ addSkill('diplomacia', 2); addSkill('intimidacao', 2); }
  if(characterHasFeature('sombra')){ addSkill('furtividade', 2); }

  // Poderes da Tormenta (ex: Carapaça na Defesa, Carapaça Corrompida na RD)
  if(characterHasFeature('carapaca')){
    const tCount = typeof characterTormentaPowersCount === 'function' ? characterTormentaPowersCount() : 1;
    result.defenseBonus += 2 + Math.floor(Math.max(0, tCount - 1) / 2);
  }
  if(characterHasFeature('carapaca_corrompida')){
    const tCount = typeof characterTormentaPowersCount === 'function' ? characterTormentaPowersCount() : 1;
    result.reductions.push({ tipo: 'reducao_dano', danoTipo: 'todos', valor: 1 + Math.floor(Math.max(0, tCount - 1) / 2) });
  }

  // Poderes Concedidos adicionais
  if(characterHasFeature('escamas_draconicas')){
    result.defenseBonus += 2;
  }
  if(characterHasFeature('habitante_do_deserto')){
    result.reductions.push({ tipo: 'reducao_dano', danoTipo: 'fogo', valor: 10 });
  }

  // Redução de Dano em armaduras (Adamante, Aço-rubi, Invulnerável)
  try {
    const armEntry = typeof equippedArmorRecord === 'function' ? equippedArmorRecord()?.entry : null;
    const armImps = Array.isArray(armEntry?.improvements) ? armEntry.improvements : [];
    const armEncs = Array.isArray(armEntry?.enchantments) ? armEntry.enchantments : [];
    if (armImps.some(m => m === 'material_adamante' || m?.id === 'material_adamante' || (m?.id === 'material_especial' && m?.materialId === 'adamante') || m?.materialId === 'adamante')) {
      result.reductions.push({ tipo: 'reducao_dano', danoTipo: 'todos', valor: 2 });
    }
    if (armImps.some(m => m === 'material_aco_rubi' || m?.id === 'material_aco_rubi' || (m?.id === 'material_especial' && m?.materialId === 'aco_rubi') || m?.materialId === 'aco_rubi')) {
      result.reductions.push({ tipo: 'reducao_dano', danoTipo: 'acido', valor: 2 });
    }
    if (armEncs.some(e => e === 'invulneravel' || e?.id === 'invulneravel')) {
      result.reductions.push({ tipo: 'reducao_dano', danoTipo: 'todos', valor: 5 });
    }
  } catch (_e) {}

  // Bônus raciais canônicos em perícias (Moreau, Goblin, etc.)
  const raceSlug = slug(state.identity?.raceId || '');
  const moreauChoice = slug(String(state.identity?.raceChoices?.moreau_heranca || state.identity?.raceChoices?.heranca || ''));
  if (raceSlug === 'moreau' || state.identity?.raceId === 'moreau') {
    if (moreauChoice.includes('coelho')) { addSkill('reflexos', 2); addSkill('iniciativa', 2); }
    if (moreauChoice.includes('hiena')) { addSkill('percepcao', 2); addSkill('sobrevivencia', 2); }
    if (moreauChoice.includes('raposa')) { addSkill('enganacao', 2); addSkill('intuicao', 2); }
    if (moreauChoice.includes('morcego')) { addSkill('percepcao', 2); addSkill('furtividade', 2); }
    if (moreauChoice.includes('coruja')) { addSkill('intuicao', 2); addSkill('percepcao', 2); }
    if (moreauChoice.includes('gato')) { addSkill('acrobacia', 2); addSkill('furtividade', 2); }
    if (moreauChoice.includes('lobo')) { addSkill('percepcao', 2); addSkill('sobrevivencia', 2); }
    if (moreauChoice.includes('serpente')) { addSkill('enganacao', 2); addSkill('furtividade', 2); }
    if (moreauChoice.includes('crocodilo')) { addSkill('atletismo', 2); addSkill('intimidacao', 2); }
    if (moreauChoice.includes('leao')) { addSkill('diplomacia', 2); addSkill('intimidacao', 2); }
    if (moreauChoice.includes('macaco')) { addSkill('acrobacia', 2); addSkill('atletismo', 2); }
    if (moreauChoice.includes('touro')) { addSkill('atletismo', 2); addSkill('fortitude', 2); }
    if (moreauChoice.includes('urso')) { addSkill('fortitude', 2); addSkill('intimidacao', 2); }
    if (moreauChoice.includes('bufalo')) { addSkill('atletismo', 2); addSkill('intimidacao', 2); }
  }
  if (raceSlug === 'goblin' && characterHasFeature('ratoneiro')) {
    addSkill('furtividade', 2); addSkill('ladinagem', 2);
  }
  if (raceSlug === 'suraggel') {
    const sVar = slug(state.identity?.raceChoices?.variante || state.identity?.raceChoices?.linhagem || '');
    if (sVar.includes('aggelus')) { addSkill('diplomacia', 2); addSkill('intuicao', 2); }
    if (sVar.includes('sulfure')) { addSkill('enganacao', 2); addSkill('furtividade', 2); }
  }

  // Poderes raciais avançados (Golem, Ceratops, Kappa, Kaijin)
  if (raceSlug === 'golem') {
    const chassiChoice = slug(String(state.identity?.raceChoices?.golem_chassi || state.identity?.raceChoices?.chassi || ''));
    if (chassiChoice.includes('metal')) {
      result.defenseBonus += 3; // soma aos +2 base do chassi, totalizando +5
    } else if (chassiChoice.includes('pedra')) {
      result.defenseBonus += 2; // soma aos +2 base do chassi, totalizando +4
    }
  }
  if (characterHasFeature('paquidermico') || characterHasFeature('ceratops_paquidermico')) {
    result.defenseBonus += 2;
  }
  if (characterHasFeature('carapaca_kappa') || characterHasFeature('kappa_carapaca_kappa')) {
    result.defenseBonus += 2;
  }
  if (characterHasFeature('couraca_rubra') || characterHasFeature('kaijin_couraca_rubra')) {
    result.reductions.push({ tipo: 'reducao_dano', danoTipo: 'fisico', valor: 2 });
  }

  // Bucaneiro / Duelista - Insolência: Você soma seu Carisma na Defesa, limitado pelo seu nível na classe.
  // Exige liberdade de movimentos; você não pode usá-la se estiver de armadura pesada ou na condição imóvel.
  const hasInsolencia = characterHasFeature('bucaneiro_insolencia') || characterHasFeature('insolencia') || characterHasFeature('duelista_insolencia');
  if (hasInsolencia && !isWearingHeavyArmor && !immobile && !result.appliedInsolencia) {
    const bucLevel = typeof characterClassLevel === 'function'
      ? (characterClassLevel('bucaneiro') || characterClassLevel('duelista'))
      : ((state.progression || []).filter(r => r.classId === 'bucaneiro' || r.classId === 'duelista').length || (['bucaneiro','duelista'].includes(state.identity?.classId) ? Number(state.identity?.plannedLevel) || 1 : 0));
    const carBonus = Math.max(0, Number(finalAttrs().car) || 0);
    const bonus = Math.min(carBonus, bucLevel || 1);
    result.defenseBonus += bonus;
    result.appliedInsolencia = true;
  }

  // Poderes individuais de distinção na progressão
  if (characterHasFeature('sentidos_do_tigre') && !isWearingHeavyArmor) {
    const sabVal = Math.max(0, Number(finalAttrs().sab) || 0);
    result.defenseBonus += sabVal;
    addSkill('reflexos', sabVal);
  }
  if (characterHasFeature('cavaleiro_rustico')) {
    result.defenseBonus += Math.max(0, Number(finalAttrs().sab) || 0);
  }
  if (characterHasFeature('rapido_ou_morto')) {
    result.movementBonus += 3;
  }
  if (characterHasFeature('reconhecimento_e_infiltracao')) {
    result.movementBonus += 3;
  }
  if (characterHasFeature('estou_bem_pessoal')) {
    result.reductions.push({ tipo: 'reducao_dano', danoTipo: 'fogo', valor: 5 });
    result.reductions.push({ tipo: 'reducao_dano', danoTipo: 'impacto', valor: 5 });
  }

  // Bônus permanentes de perícia concedidos pelo Mestre na mesa
  const masterSkillMods = state.masterBonuses?.skills || {};
  for (const [mId, mVal] of Object.entries(masterSkillMods)) {
    if (Number(mVal)) addSkill(mId, Number(mVal));
  }
  // Bônus de Treinamento de Perícias (+1 em todas as perícias se em nível ímpar indo para par)
  if (state.levelTraining?.skills) {
    const curLvl = Math.max(1, Number(state.identity?.plannedLevel) || 1);
    if (curLvl < 20 && curLvl % 2 === 1) {
      const skillList = typeof SKILLS !== 'undefined' ? SKILLS : [];
      for (const [sk] of skillList) {
        addSkill(sk, 1);
      }
      const trainedSet = typeof allTrainedSkills === 'function' ? allTrainedSkills() : [];
      for (const sk of trainedSet) {
        if (String(sk).startsWith('oficio:')) addSkill(sk, 1);
      }
    }
  }
  const markCounts={};
  for(const row of state.progression||[]){
    const power=typeof progressionDistinctionPowerById==='function'?progressionDistinctionPowerById(row.powerId):null;
    if(power)markCounts[power.distinctionId]=(markCounts[power.distinctionId]||0)+1;
  }
  const marks=activeDistinctionMarkEffects({
    ...finalAttrs(),heavyArmor:isWearingHeavyArmor,powerCounts:markCounts,
    curaAttr:skillEffectiveAttributeWithoutDistinctions('cura'),
    alquimiaAttr:skillEffectiveAttributeWithoutDistinctions('oficio:alquimista')
  });
  for(const [id,value] of Object.entries(marks.skills))addSkill(id,value);
  result.defenseBonus+=marks.defense||0;
  result.pmFlat+=marks.pm||0;
  result.movementBonus+=marks.movement||0;
  if(Array.isArray(marks.reductions)){
    for(const r of marks.reductions) result.reductions.push(r);
  }
  if (isWearingHeavyArmor) {
    const hasArmaduraBrilhante = typeof characterHasFeature === 'function' && (characterHasFeature('nobre_armadura_brilhante') || characterHasFeature('armadura_brilhante'));
    if (hasArmaduraBrilhante) {
      result.defenseAttribute = 'car';
    } else {
      result.defenseAttribute = 'nenhum';
    }
  }
  return result;
}
function characterRaceBody(){
  const race=raceById(state.identity.raceId);
  let tamanhoId=race?.corpo?.tamanhoId||'medio';
  let deslocamentoBase=Number(race?.corpo?.deslocamentoBase);
  if(!Number.isFinite(deslocamentoBase))deslocamentoBase=9;
  if(race?.id==='duende'){
    const sizeChoice=state.identity.raceChoices?.duende_tamanho;
    if(sizeChoice){
      tamanhoId=sizeChoice;
      if(sizeChoice==='minusculo'||sizeChoice==='pequeno'){
        deslocamentoBase=6;
      }else if(sizeChoice==='medio'||sizeChoice==='grande'){
        deslocamentoBase=9;
      }
    }
  }else if(race?.habilidades?.selecionadas){
    for(const sel of race.habilidades.selecionadas){
      const chosenId=state.identity.raceChoices?.[sel.id];
      if(chosenId&&sel.opcoes){
        const opt=sel.opcoes.find(o=>o.id===chosenId||o.nome===chosenId);
        if(opt?.corpo){
          if(opt.corpo.tamanhoId)tamanhoId=opt.corpo.tamanhoId;
          if(Number.isFinite(Number(opt.corpo.deslocamentoBase))){
            deslocamentoBase=Number(opt.corpo.deslocamentoBase);
          }
        }
      }
    }
  }
  return {tamanhoId,deslocamentoBase};
}
function characterDefenseAttribute(){return passiveCharacterEffects().defenseAttribute}
function characterSizeId(){return characterSizeWithShift(passiveCharacterEffects().sizeShift)}
function characterSizeWithShift(shift){const order=['Minúsculo','Pequeno','Médio','Grande','Enorme','Colossal'],body=characterRaceBody(),baseId=slug(body.tamanhoId||'medio'),base=order.find(value=>slug(value)===baseId)||'Médio',index=order.indexOf(base);return order[Math.max(0,Math.min(order.length-1,index+shift))]}
function characterBaseMovement(){const body=characterRaceBody();return body.deslocamentoBase+passiveCharacterEffects().movementBonus}
function characterTrainingBonus(){const level=Number(state.identity.plannedLevel)||1;return level>=15?6:level>=7?4:2}
function characterUsesDexterityForLoad(){
  if(typeof selectedCharacterFeatures!=='function')return false;
  return selectedCharacterFeatures().some(feature=>{
    const id=feature.id||'',name=slug(feature.nome||'');
    return id==='kobold_talento_organizadinhos'||id==='organizadinhos'||name.includes('organizadinhos')||feature.efeito_especial==='carga_des';
  });
}
function skillOriginalAttribute(id){
  if(String(id).startsWith('oficio:'))return 'int';
  const definition=SKILLS.find(skill=>skill[0]===id);
  return definition?.[2]||'int';
}
function skillEffectiveAttributeWithoutDistinctions(id){
  const baseAttr=skillOriginalAttribute(id);
  const race=raceById(state.identity.raceId),raceSlug=slug(race?.nome||'');
  const features=typeof selectedCharacterFeatures==='function'?selectedCharacterFeatures():[];
  const moreauChoice=slug(String(state.identity.raceChoices?.moreau_heranca||state.identity.raceChoices?.heranca||''));
  const isMoreau=state.identity.raceId==='moreau'||raceSlug==='moreau';
  const isMoreauUrso=isMoreau&&(moreauChoice.includes('urso')||features.some(f=>f.id==='moreau_urso'||slug(f.nome).includes('abraco_de_urso')));
  const isMoreauBufalo=isMoreau&&(moreauChoice.includes('bufalo')||features.some(f=>f.id==='moreau_bufalo'||slug(f.nome).includes('marrada_impressionante')));

  if(id==='atletismo'){
    const hasDexAthletics=['hynne','satiro','velocis'].includes(state.identity.raceId)||['hynne','satiro','velocis'].includes(raceSlug)||features.some(f=>['hynne_pequeno_e_rechonchudo','satiro_pernas_caprinas','velocis_velocista_da_planicie','acrobatico'].includes(f.id)||slug(f.nome).includes('pequeno_e_rechonchudo')||slug(f.nome).includes('pernas_caprinas')||slug(f.nome).includes('velocista_da_planicie')||slug(f.nome).includes('acrobatico'));
    if(hasDexAthletics)return 'des';
  }

  if(id==='intimidacao'){
    if(isMoreauUrso||isMoreauBufalo)return 'for';
    if(['bugbear','ceratops','galokk','kaijin'].includes(state.identity.raceId)||['bugbear','ceratops','galokk','kaijin'].includes(raceSlug))return 'for';
    if(features.some(f=>['bugbear_saborear_pavor','ceratops_paquidermico','galokk_meio_gigante','kaijin_terror_vivo','moreau_abraco_de_urso','moreau_marrada_impressionante','lutador_sarado'].includes(f.id)||slug(f.nome).includes('saborear_pavor')||slug(f.nome).includes('paquidermico')||slug(f.nome).includes('meio_gigante')||slug(f.nome).includes('terror_vivo')||slug(f.nome).includes('sarado')))return 'for';
  }

  const reg=typeof selectedRegionalOrigin==='function'?selectedRegionalOrigin():null;
  const regName=reg?.nome||state.origin?.regional||'';
  const regSlug=slug(regName);

  if(id==='misticismo'){
    if(state.identity.raceId==='eiradaan'||raceSlug==='eiradaan'||features.some(f=>f.id==='eiradaan_magia_instintiva'||slug(f.nome).includes('magia_instintiva')))return 'sab';
    if(regName==='Um com os Kami'||regName==='Emissário Ubaneri'||regSlug==='um_com_os_kami'||regSlug==='emissario_ubaneri')return 'sab';
    if(regSlug==='liricista_de_lenorien'||regSlug==='liricista_de_lenorienn')return 'car';
  }

  if(id==='ladinagem'){
    if(regSlug==='trapaceiro_ahleniense')return 'car';
  }

  if(id==='conhecimento'||id==='nobreza'){
    if(regSlug==='tradicionalista_svalano')return 'sab';
  }

  if(id==='enganacao'){
    if(regSlug==='duyshid_akk_infiltrado')return 'sab';
  }

  if(id==='iniciativa'){
    if(characterHasFeature('percepcao_temporal'))return 'sab';
  }

  for(const ef of (typeof selectedFeatureEffects === 'function' ? selectedFeatureEffects() : [])){
    if((ef.tipo === 'substituir_atributo_pericia' || ef.tipo === 'trocar_atributo_pericia') &&
       (ef.periciaId === id || ef.pericia === id || (Array.isArray(ef.pericias) && ef.pericias.includes(id)))){
      const target = ef.para || ef.atributo || ef.atributoId;
      if(target) return target;
    }
  }

  return baseAttr;
}
function characterTotalReductionsSummary(){
  const reds = (typeof passiveCharacterEffects === 'function' ? passiveCharacterEffects().reductions : []) || [];
  if(!reds.length) return '';
  const map = new Map();
  for(const r of reds){
    const tipos = Array.isArray(r.tipos) && r.tipos.length > 0 ? r.tipos : [r.danoTipo || r.tipoDano || 'todos'];
    const val = Number(r.valor || 0);
    if(val > 0){
      for(const t of tipos){
        const tipo = String(t || 'todos').toLowerCase();
        map.set(tipo, (map.get(tipo) || 0) + val);
      }
    }
  }
  const parts = [];
  for(const [tipo, val] of map.entries()){
    if(tipo === 'todos' || tipo === 'dano') parts.push(`RD ${val}`);
    else parts.push(`RD ${val}/${tipo}`);
  }
  return parts.join(', ');
}
// Adaptador para consumidores legados que executam cálculos sem o runtime modular.
function activeDistinctionMarkEffects(context={}){
 const activeIds = (Array.isArray(state.distinctions?.activeIds) && state.distinctions.activeIds.length > 0)
   ? state.distinctions.activeIds
   : (typeof progressionDistinctionActiveIds === 'function' ? progressionDistinctionActiveIds() : []);
 return typeof efeitosMarcas==='function'
   ?efeitosMarcas(activeIds,context)
   :{skills:{},attributes:{},defense:0,pm:0,movement:0,reductions:[]};
}
function skillEffectiveAttribute(id){
 const marks=activeDistinctionMarkEffects();
 return marks.attributes[id]||skillEffectiveAttributeWithoutDistinctions(id);
}
function calculatedSkillTotal(id){
  const attr=skillEffectiveAttribute(id);
  const isOficio = String(id).startsWith('oficio:') || id === 'oficio';
  // @ts-ignore
  const artRules = typeof RegrasArtesaoCriativo !== 'undefined' ? RegrasArtesaoCriativo : (typeof window !== 'undefined' ? window['RegrasArtesaoCriativo'] : null);
  const temArtesaoCriativo = isOficio && (artRules && typeof artRules.temPoderArtesaoCriativo === 'function'
    ? artRules.temPoderArtesaoCriativo(state)
    : ((Array.isArray(state?.progression) && state.progression.some(p => p?.powerId === 'inventor_artesao_criativo' || p?.powerId === 'artesao_criativo' || /artes[aã]o criativo/i.test(p?.powerName || ''))) ||
       (Array.isArray(state?.powers) && state.powers.some(p => p?.id === 'inventor_artesao_criativo' || p?.id === 'artesao_criativo' || /artes[aã]o criativo/i.test(p?.nome || '')))));
  const trained=new Set(allTrainedSkills()),level=Math.floor((Number(state.identity.plannedLevel)||1)/2);
  const isTrained = trained.has(id) || temArtesaoCriativo;
  const baseBonus = Number(finalAttrs()[attr]||0)+level+(isTrained?characterTrainingBonus():0)+Number(passiveCharacterEffects().skillBonuses[id]||0);
  if (temArtesaoCriativo && id !== 'oficio:artesao' && (trained.has('oficio:artesao') || trained.has('oficio_artesao'))) {
    const artesaoAttr = skillEffectiveAttribute('oficio:artesao');
    const artesaoBonus = Number(finalAttrs()[artesaoAttr]||0)+level+characterTrainingBonus()+Number(passiveCharacterEffects().skillBonuses['oficio:artesao']||0);
    return Math.max(baseBonus, artesaoBonus);
  }
  return baseBonus;
}
