function previewProgressionPower(index, powerId, options = {}) {
  const row = state.progression[index];
  if (!row) return;

  setProgressionEditingIndex(index);
  state.progressionCollapsedIndex = -1;
  row.previewPowerId = powerId;
  row.previewPowerChoice = row.powerId === row.previewPowerId ? row.powerChoice : '';

  const listContainer = document.querySelector('[data-progression-power-list="' + index + '"]');
  const browserContainer = listContainer?.closest('.class-power-browser');
  const existingDetail = browserContainer?.querySelector('.power-detail-panel');

  if (listContainer && browserContainer && typeof renderClassPowerDetailPanel === 'function') {
    // 1. Atualização rápida sem recriar o DOM da página
    const buttons = listContainer.querySelectorAll('[data-action="class-power-preview"]');
    let targetButton = null;
    buttons.forEach((b: HTMLElement) => {
      if (b.dataset.powerId === powerId) {
        b.classList.add('selected');
        b.setAttribute('aria-pressed', 'true');
        targetButton = b;
      } else {
        b.classList.remove('selected');
        b.setAttribute('aria-pressed', 'false');
      }
    });

    // 2. Atualizar detalhes no painel lateral
    const candidate = progressionPowerById(powerId);
    const verdict = candidate ? progressionPowerVerdict(candidate, index) : { ok: false, reasons: [] };
    const newDetailHtml = renderClassPowerDetailPanel(candidate, verdict, row, index);

    if (existingDetail) {
      existingDetail.outerHTML = newDetailHtml;
    } else {
      browserContainer.insertAdjacentHTML('beforeend', newDetailHtml);
    }

    // 3. Rolar apenas a lista interna caso o item esteja fora da visualização da lista
    if (targetButton && listContainer) {
      targetButton.focus?.({ preventScroll: true });
      const top = targetButton.offsetTop;
      const bottom = top + targetButton.offsetHeight;
      if (top < listContainer.scrollTop) {
        listContainer.scrollTop = top;
      } else if (bottom > listContainer.scrollTop + listContainer.clientHeight) {
        listContainer.scrollTop = bottom - listContainer.clientHeight;
      }
    }

    syncProgressionFooter();
    if (['arcanista_familiar', 'arcanista_familiar_aprimorado'].includes(powerId) && !row.previewPowerChoice) {
      openFamiliarChoice(index);
    }
  } else {
    // Fallback completo se a lista ainda não estiver no DOM
    const pageScroll = Number.isFinite(Number(options.pageScroll)) ? Number(options.pageScroll) : Number(window.scrollY || document.documentElement?.scrollTop || 0);
    const listScroll = Number.isFinite(Number(options.listScroll)) ? Number(options.listScroll) : Number(listContainer?.scrollTop || 0);
    renderStage();
    const restore = () => {
      const updatedList = document.querySelector('[data-progression-power-list="' + index + '"]');
      if (updatedList) updatedList.scrollTop = listScroll;
      const selected = [...document.querySelectorAll('[data-action="class-power-preview"][data-index="' + index + '"]')].find(b => (b as HTMLElement).dataset.powerId === powerId);
      (selected as HTMLElement)?.focus?.({ preventScroll: true });
      window.scrollTo?.({ top: pageScroll, behavior: 'auto' });
    };
    restore();
    (window.requestAnimationFrame || ((cb) => setTimeout(cb, 0)))(restore);
    syncProgressionFooter();
    if (['arcanista_familiar', 'arcanista_familiar_aprimorado'].includes(powerId) && !row.previewPowerChoice) {
      openFamiliarChoice(index);
    }
  }
}
function progressionActivePowerIndex(){
  const slots=state.progression.map((row,index)=>powerSlotAt(classById(row.classId),classLevelAt(index,row.classId))?index:-1).filter(index=>index>=0),
  explicit=Number(state.progressionActiveIndex),
  requested=Number.isInteger(explicit)?explicit:validCharacterLevel(state.identity.editingLevel)-1,
  unresolved=slots.find(index=>!progressionPowerById(state.progression[index].powerId));
  if(Number.isInteger(explicit)&&slots.includes(explicit))return explicit;
  if(state.isEditingFinishedSheet||state.editingCharacter){
    if(slots.includes(requested))return requested;
  }
  if(unresolved!==undefined)return unresolved;
  if(slots.includes(requested))return requested;
  if(slots.length)return state.isLevelingUp?slots[slots.length-1]:slots[0];
  if(state.progression.length>1)return 1;
  return 0;
}
function setProgressionEditingIndex(index){state.progressionActiveIndex=index;state.identity.editingLevel=index>=0?index+1:state.identity.plannedLevel}
function progressionPowerVerdict(power,index){if(power?.distinctionPower||String(power?.id||'').startsWith('distincao:'))return typeof progressionDistinctionEligibility==='function'?progressionDistinctionEligibility(power,index):{ok:true,reasons:[]};if(power?.generalPower)return progressionGeneralEligibility(power,index);if(power?.raceOption||String(power?.id||'').startsWith('racial:'))return typeof progressionRaceEligibility==='function'?progressionRaceEligibility(power,index):{ok:true,reasons:[]};return classProgressionEligibility(power,index)}
function nextUnresolvedProgressionIndex(after=-1){return state.progression.findIndex((entry,index)=>index>after&&powerSlotAt(classById(entry.classId),classLevelAt(index,entry.classId))&&!progressionPowerById(entry.powerId))}
function syncProgressionFooter(){
  if(state.step !== 10) return;
  const review=document.getElementById('reviewProgressionButton');
  const next=document.getElementById('nextButton');
  const stepPrev=document.getElementById('stepPrevButton');
  const stepNext=document.getElementById('stepNextButton');
  const missing=progressionMissingChoices();
  const allPending=typeof characterPendingChoices==='function'?characterPendingChoices():missing;
  const active=progressionActivePowerIndex();
  const row=state.progression[active];
  const candidate=row?(progressionPowerById(row.previewPowerId||row.powerId)):null;
  const verdict=candidate?progressionPowerVerdict(candidate,active):null;
  const readyToConfirm=Boolean(row?.previewPowerId&&verdict?.ok&&(!['classe_aumento_de_atributo','arcanista_familiar','arcanista_familiar_aprimorado'].includes(candidate.id)||row.previewPowerChoice));
  const hasConfirmedPower=Boolean(row?.powerId&&(!row?.previewPowerId||row.previewPowerId===row.powerId));
  const powerLevelIndices=state.progression.map((r,i)=>powerSlotAt(classById(r.classId),classLevelAt(i,r.classId))?i:-1).filter(i=>i>=0);
  const curPos=powerLevelIndices.indexOf(active);
  const isLastLevel=curPos===powerLevelIndices.length-1;
  const otherMissing=missing.filter(item=>!item.selector?.includes('data-index="'+active+'"'));
  const canFinishNow=(allPending.length===0&&!row?.previewPowerId)||(otherMissing.length===0&&readyToConfirm&&isLastLevel)||(allPending.length===0&&hasConfirmedPower);

  const isDistinction = candidate && (candidate.distinctionPower || String(candidate.id || '').startsWith('distincao:'));
  const distIconMini = isDistinction ? '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><circle cx="12" cy="8" r="6"></circle><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"></path></svg>' : '';

  if(state.isLevelingUp){
    if(next) next.hidden = true;
    if(stepPrev){
      stepPrev.hidden = powerLevelIndices.length <= 1;
      stepPrev.disabled = curPos <= 0;
    }
    if(stepNext){
      stepNext.hidden = false;
      const canStep = readyToConfirm || hasConfirmedPower;
      stepNext.disabled = !canStep;
      stepNext.innerHTML = distIconMini + 'Confirmar poder →';
    }
  } else if(state.isTrainingPowerProgression){
    if(next) next.hidden = true;
    if(stepPrev){
      stepPrev.hidden = powerLevelIndices.length <= 1;
      stepPrev.disabled = curPos <= 0;
    }
    if(stepNext){
      stepNext.hidden = false;
      const canStep = readyToConfirm || hasConfirmedPower;
      stepNext.disabled = !canStep;
      stepNext.innerHTML = distIconMini + 'Confirmar treino de poder →';
    }
  } else {
    if(powerLevelIndices.length <= 1){
      if(stepPrev) stepPrev.hidden = true;
      if(stepNext) stepNext.hidden = true;
    } else {
      if(stepPrev){
        stepPrev.hidden = false;
        stepPrev.disabled = curPos <= 0;
      }
      if(stepNext){
        stepNext.hidden = false;
        const canStep = readyToConfirm || (hasConfirmedPower && curPos < powerLevelIndices.length - 1);
        stepNext.disabled = !canStep;
        if(readyToConfirm){
          stepNext.innerHTML = distIconMini + 'Confirmar poder →';
        } else {
          stepNext.textContent = 'Próxima →';
        }
      }
    }
    if(next && state.step === 10){
      next.textContent = 'Finalizar ficha';
      next.disabled = !canFinishNow;
      next.classList.toggle('is-incomplete', !canFinishNow);
      next.hidden = Boolean(readyToConfirm && stepNext && !stepNext.hidden);
    }
  }
  const cancelBtn=document.getElementById('cancelLevelUpButton');
  if(cancelBtn)cancelBtn.hidden=!state.isLevelingUp;
  if(review)review.hidden=state.step!==10||missing.length>0||Boolean(row?.previewPowerId);
}
function syncSamuraiKatanaToBackpack(){
  const saved=arsenalState();
  if(!saved||!saved.storage)return;
  let profiles;
  try{profiles=JSON.parse(saved.storage[ARSENAL_PROFILES_KEY]||'{}')}catch{profiles={}}
  const profile=profiles.profiles?.find(item=>item.id==='ficha-ativa')||profiles.profiles?.find(item=>item.id===profiles.activeId);
  if(!profile||!Array.isArray(profile.backpack))return;

  const katanaEntry=profile.backpack.find(entry=>
    entry.acquisition?.grantId==='class-choice:samurai-katana-ancestral'||
    entry.acquisition?.grantId==='samurai-katana-ancestral'||
    (entry.itemId==='katana'&&(
      /Katana Ancestral/i.test(entry.options?.customName||'')||
      /Katana Ancestral/i.test(entry.displayName||'')
    ))
  );
  if(!katanaEntry)return;

  const samuraiLevel=(state.progression||[]).filter(row=>row.classId==='samurai').length;
  state.samuraiKatana=state.samuraiKatana||{};

  if(!state.samuraiKatana[1]&&katanaEntry.improvements&&katanaEntry.improvements.length>0){
    const first=katanaEntry.improvements[0];
    state.samuraiKatana[1]=first.id==='material_especial'?('material_especial:'+first.materialId):first.id;
  }

  const impIds=[];
  if(state.samuraiKatana[1])impIds.push(state.samuraiKatana[1]);
  if(samuraiLevel>=4&&state.samuraiKatana[4])impIds.push(state.samuraiKatana[4]);
  if(samuraiLevel>=6&&state.samuraiKatana[6])impIds.push(state.samuraiKatana[6]);
  if(samuraiLevel>=8&&state.samuraiKatana[8])impIds.push(state.samuraiKatana[8]);

  const encIds=[];
  if(samuraiLevel>=10&&state.samuraiKatana[10])encIds.push(state.samuraiKatana[10]);
  if(samuraiLevel>=12&&state.samuraiKatana[12])encIds.push(state.samuraiKatana[12]);
  if(samuraiLevel>=14&&state.samuraiKatana[14])encIds.push(state.samuraiKatana[14]);

  const improvements=impIds.map(id=>{
    if(String(id).startsWith('material_especial:'))return {id:'material_especial',materialId:id.replace('material_especial:','')};
    return {id};
  });

  const isEspiritual=samuraiLevel>=10;
  katanaEntry.options=katanaEntry.options||{};
  katanaEntry.options.customName=isEspiritual?'Katana Ancestral Espiritual':'Katana Ancestral';
  katanaEntry.improvements=improvements;
  katanaEntry.enchantments=encIds;

  const impCatalog=DATA.samuraiKatanaCatalog?.improvements||[];
  const encCatalog=DATA.samuraiKatanaCatalog?.enchantments||[];
  const impNames=improvements.map(imp=>{
    if(imp.id==='material_especial'){
      const mat=impCatalog.find(m=>m.id==='material_especial:'+imp.materialId);
      return mat?mat.nome.replace('Material: ',''):imp.materialId;
    }
    const found=impCatalog.find(m=>m.id===imp.id);
    return found?found.nome:imp.id;
  });
  const encNames=encIds.map(eid=>{
    const found=encCatalog.find(e=>e.id===eid);
    return found?found.nome:eid;
  });
  const suffixes=[...impNames,...encNames].filter(Boolean);
  katanaEntry.displayName=katanaEntry.options.customName+(suffixes.length?' '+suffixes.map(s=>s.toLowerCase()).join(' '):'');

  saved.storage[ARSENAL_PROFILES_KEY]=JSON.stringify(profiles);
  persistNow();
}

function renderProgressionSpecialGrants(row,index,level){
  if(row.classId==='samurai'){
    const catalog=DATA.samuraiKatanaCatalog||{improvements:[],enchantments:[]};
    state.samuraiKatana=state.samuraiKatana||{};
    if([4,6,8].includes(level)){
      const usedOther=new Set([1,4,6,8].filter(l=>l!==level).map(l=>state.samuraiKatana[l]).filter(Boolean));
      const hasMaterial=[...usedOther].some(id=>String(id).startsWith('material_especial:'));
      const available=catalog.improvements.filter(item=>{
        if(usedOther.has(item.id))return false;
        if(String(item.id).startsWith('material_especial:')&&hasMaterial)return false;
        return true;
      });
      const current=state.samuraiKatana[level]||'';
      const options=['<option value="">Selecione a melhoria...</option>',...available.map(item=>'<option value="'+esc(item.id)+'" '+(current===item.id?'selected':'')+'>'+esc(item.nome)+'</option>')].join('');
      return '<div class="progression-special-grant-box '+(current?'is-complete':'is-pending')+'"><label class="field" style="margin:0"><span style="font-weight:700;color:var(--gold2,#f5d78e)">Arma Ancestral · Melhoria do Nível '+level+' de Samurai</span><select class="select" data-action="samurai-katana-upgrade" data-level="'+level+'" data-index="'+index+'">'+options+'</select></label></div>';
    }
    if([10,12,14].includes(level)){
      const usedOther=new Set([10,12,14].filter(l=>l!==level).map(l=>state.samuraiKatana[l]).filter(Boolean));
      const available=catalog.enchantments.filter(item=>!usedOther.has(item.id));
      const current=state.samuraiKatana[level]||'';
      const options=['<option value="">Selecione o encanto mágico...</option>',...available.map(item=>'<option value="'+esc(item.id)+'" '+(current===item.id?'selected':'')+'>'+esc(item.nome)+'</option>')].join('');
      return '<div class="progression-special-grant-box '+(current?'is-complete':'is-pending')+'"><label class="field" style="margin:0"><span style="font-weight:700;color:var(--gold2,#f5d78e)">Katana Ancestral Espiritual · Encanto Mágico do Nível '+level+' de Samurai</span><select class="select" data-action="samurai-katana-enchantment" data-level="'+level+'" data-index="'+index+'">'+options+'</select></label></div>';
    }
  }
  if(row.classId==='inventor'&&[2,5,8,11].includes(level)){
    const granted=Boolean(arsenalState().grants?.['class-choice:class-inventor-fabricar-item-superior']);
    const invItem=characterInventory().find(entry=>entry.acquisition?.grantId==='class-choice:class-inventor-fabricar-item-superior');
    const maxImp = level >= 11 ? 4 : (level >= 8 ? 3 : (level >= 5 ? 2 : 1));
    const titleText = level === 2
      ? 'Você tem direito a um item superior com 1 melhoria (até T$ 2.000).'
      : 'Você pode substituir seu item superior anterior por um novo com até ' + maxImp + ' melhorias (sem limite de custo).';
    if(granted&&invItem){
      return '<div class="progression-special-grant-box is-complete"><div style="display:flex;align-items:center;justify-content:space-between;gap:8px"><span><strong>Fabricar Item Superior (Nv. ' + level + '):</strong> ' + esc(invItem.displayName||invItem.itemName||'Item Superior') + ' (até ' + maxImp + ' melhoria' + (maxImp > 1 ? 's' : '') + ')</span><button type="button" class="button small" data-action="go-to-inventor-grant">' + (level > 2 ? 'Substituir / Alterar item' : 'Alterar escolha') + '</button></div></div>';
    }
    return '<div class="progression-special-grant-box is-pending"><div style="display:flex;align-items:center;justify-content:space-between;gap:8px"><span><strong>Fabricar Item Superior (Nv. ' + level + '):</strong> ' + titleText + '</span><button type="button" class="button small primary" data-action="go-to-inventor-grant">' + (level > 2 ? 'Substituir por Novo Item' : 'Escolher Item') + '</button></div></div>';
  }
  return '';
}

function renderProgressionPhase(){
  ensureProgression();
  const activeIndex=progressionActivePowerIndex(),rows=state.progression.map((row,index)=>{
    if(index!==activeIndex)return '';
    const cls=classById(row.classId),level=classLevelAt(index,row.classId),abilities=(cls?.habilidades||[]).filter(ability=>Number(ability.nivel)===level),selected=progressionPowerById(row.powerId),hasSlot=powerSlotAt(cls,level),active=hasSlot&&index===activeIndex;
    const specialSummary=[];
    if(row.classId==='samurai'){
      const catalog=DATA.samuraiKatanaCatalog||{improvements:[],enchantments:[]};
      if([4,6,8].includes(level)&&state.samuraiKatana?.[level]){
        const found=catalog.improvements.find(item=>item.id===state.samuraiKatana[level]);
        if(found)specialSummary.push('Katana: +'+found.nome.replace('Material: ',''));
      }
      if([10,12,14].includes(level)&&state.samuraiKatana?.[level]){
        const found=catalog.enchantments.find(item=>item.id===state.samuraiKatana[level]);
        if(found)specialSummary.push('Katana Espiritual: +'+found.nome);
      }
    }
    if(row.classId==='inventor'&&[2,5,8,11].includes(level)){
      const granted=Boolean(arsenalState().grants?.['class-choice:class-inventor-fabricar-item-superior']);
      if(granted)specialSummary.push('Item Superior (Nv. ' + level + '): Concedido');
    }
    const summary=[...abilities.filter(ability=>!(level===1&&slug(ability.nome)==='magias')).map(ability=>ability.nome),selected?.nome,...specialSummary].filter(Boolean);
    const specialGrantHtml=renderProgressionSpecialGrants(row,index,level);
    return '<section class="level-row progression-level-row '+(active?'active':'collapsed')+'" data-progression-level="'+index+'"><div class="level-badge">Nv. '+(index+1)+'</div><div><label class="field"><span>Classe · nível '+level+' nela</span><select class="select" data-action="progress-class" data-index="'+index+'" '+(index===0?'disabled':'')+'>'+DATA.classes.map(option=>'<option value="'+option.id+'" '+(option.id===row.classId?'selected':'')+'>'+esc(option.nome)+'</option>').join('')+'</select></label><div class="progression-level-summary">'+summary.map(name=>'<strong>'+esc(name)+'</strong>').join('')+(false?'<button type="button" class="progression-expand" data-action="progression-open-level" data-index="'+index+'">'+(active?'Recolher':'▸ Ver ou alterar escolhas')+'</button>':'')+'</div>'+(abilities.length?'<details class="progression-ability-details"><summary>Detalhes das habilidades deste nível</summary><div class="ability-list">'+abilities.map(ability=>abilityHtml(ability)).join('')+'</div></details>':'')+specialGrantHtml+(active?renderClassPowerBrowser(row,index,cls):'')+'</div></section>';
  }).join('');
  const powerLevelIndices=state.progression.map((r,i)=>powerSlotAt(classById(r.classId),classLevelAt(i,r.classId))?i:-1).filter(i=>i>=0);
  const prevPowerIndex=[...powerLevelIndices].reverse().find(i=>i<activeIndex);
  const nextPowerIndex=powerLevelIndices.find(i=>i>activeIndex);
  const displayLevel=Math.max(1,activeIndex+1);
  const cancelActionHtml = state.isLevelingUp
    ? '<button type="button" class="button danger small" data-action="cancel-level-up" style="font-size:0.72rem;padding:4px 10px;margin-left:auto;">Cancelar subida de nível</button>'
    : (state.isTrainingPowerProgression
      ? '<button type="button" class="button danger small" data-action="cancel-training-power" style="font-size:0.72rem;padding:4px 10px;margin-left:auto;">Cancelar treino de poder</button>'
      : '');
  const titleText = state.isTrainingPowerProgression
    ? 'Treino de Poder (Nível ' + displayLevel + ')'
    : 'Visualizando Nível ' + displayLevel + ' de ' + state.identity.plannedLevel;
  const levelIndicator='<div class="inline-actions progression-add-action" style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:12px"><span style="font-weight:700;color:var(--gold2);font-size:0.9rem;">'+titleText+'</span>'+cancelActionHtml+'</div>';
  return panel('Progressão de níveis',levelIndicator+'<div class="progression">'+rows+'</div>','Multiclasse usa os PV de nível subsequente e não concede novas perícias ou proficiências.');
}
const renderProgressionPhaseExpanded=renderProgressionPhase;
renderProgressionPhase=function(){
  const html=renderProgressionPhaseExpanded(),index=Number(state.progressionCollapsedIndex);if(index<0)return html;
  const holder=document.createElement('div');holder.innerHTML=html;if(typeof holder.querySelector!=='function')return html;const section=holder.querySelector('[data-progression-level="'+index+'"]');if(!section)return html;
  section.classList.remove('active');section.classList.add('collapsed','manually-collapsed');section.querySelectorAll('.progression-source-filters,.power-filterbar:not(.progression-source-filters),.class-power-browser').forEach(element=>element.remove());const button=section.querySelector('[data-action="progression-open-level"]');if(button)button.textContent='▸ Ver ou alterar escolhas';return holder.innerHTML
};
function isSpellGrantingFeature(feature){
  if(!feature) return false;
  const leaf = (feature.nome || '').split('/').pop().trim();
  const k = slug(feature.id || leaf);
  const nameK = slug(leaf);
  if(k.startsWith('ditame_') || k.startsWith('mistico_ditame_') || nameK.startsWith('ditame_')) return true;
  if(['teurgista_mistico', 'aumentar_repertorio', 'bardo_aumentar_repertorio', 'conhecimento_magico', 'arcanista_conhecimento_magico', 'ditame_absoluto'].includes(k) ||
     ['teurgista_mistico', 'aumentar_repertorio', 'bardo_aumentar_repertorio', 'conhecimento_magico', 'arcanista_conhecimento_magico', 'ditame_absoluto'].includes(nameK)) return true;
  return false;
}
function isSpellFieldFeature(feature){
  if(!feature) return false;
  if(isSpellGrantingFeature(feature)) return true;
  const leaf = (feature.nome || '').split('/').pop().trim();
  const k = slug(feature.id || leaf);
  const nameK = slug(leaf);
  const spellKeys = [
    'presente_de_wynlla',
    'sentidos_misticos',
    'eiradaan_sentidos_misticos',
    'tatuagem_mistica',
    'qareen_tatuagem_mistica',
    'amiga_das_plantas',
    'dahllan_amiga_das_plantas',
    'cancao_dos_mares',
    'sereia_tritao_cancao_dos_mares',
    'instrumentista_magico',
    'satiro_instrumentista_magico',
    'magia_das_fadas',
    'silfide_magia_das_fadas',
    'luz_sagrada',
    'suraggel_luz_sagrada',
    'sombras_profanas',
    'suraggel_sombras_profanas',
    'duende_presentes',
    'presentes_de_magia_e_caos',
    'presentes_de_magia_e_de_caos'
  ];
  return spellKeys.includes(k) || spellKeys.includes(nameK);
}
function isVisionFeature(feature){
  if(!feature) return false;
  const s = slug(feature.id || feature.nome || '');
  if(['visao_no_escuro', 'visao_na_penumbra', 'essencia_feerica', 'eiradaan_essencia_feerica', 'olfato_apurado'].includes(s)) return true;
  const desc = feature.descricao || '';
  return /\bvisão na penumbra\b|\bvisão no escuro\b/i.test(desc) && /fada|feerica|elfo|silfide|anão|anao|qareen/i.test(feature.nome + ' ' + desc);
}
