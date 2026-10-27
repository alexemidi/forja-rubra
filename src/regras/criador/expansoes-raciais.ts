


const DUENDE_TABOO_SUGGESTIONS=[
  '–5 em Ofício (alfaiate) ou Diplomacia.',
  '–2 em perícias baseadas em Carisma.',
  '–5 em Percepção ou Diplomacia.',
  '–5 em Iniciativa.',
  'Tamanho reduzido em uma categoria; roupas acompanham.',
  '–5 em Diplomacia ou Intimidação.',
  'Não pode lançar uma magia conhecida, determinada por sorteio.',
  '–5 em Luta ou Cavalgar.',
  '–1 na Defesa.',
  '–3m de deslocamento.',
  '–3m de deslocamento enquanto o sal tocar sua pele.',
  '–5 em Diplomacia ou Atuação.',
  '–5 em Iniciativa ou Ofício.',
  '–1 PM máximo.',
  '–5 em Diplomacia ou Jogatina.',
  '–5 em Percepção ou Religião.',
  '–5 em Ladinagem ou Diplomacia.',
  '–1 PV máximo.',
  '–5 em Diplomacia.',
  '–5 em Enganação ou Diplomacia.',
  'Fica indisponível por algumas horas.',
  '–5 em Cura ou Diplomacia.'
];
const DUENDE_TABOO_DEFAULT_PENALTIES=[...DUENDE_TABOO_SUGGESTIONS];
const DUENDE_TABOO_PENALTIES=[...new Set([...DUENDE_TABOO_DEFAULT_PENALTIES,...SKILLS.map(skill=>'–5 em '+skill[1]),'–1 na Defesa.','–1 PV máximo.','–1 PM máximo.','–3m de deslocamento.','Tamanho reduzido em uma categoria; roupas acompanham.','Não pode lançar uma magia conhecida, determinada por sorteio.','Fica indisponível por algumas horas.','Outra consequência (com o mestre)'])];
const abilityHtmlBeforeDuende=abilityHtml;
abilityHtml=function(ability){return ability?.id==='duende_tabu'?'':abilityHtmlBeforeDuende(ability)};
const renderChoiceBeforeDuende=renderChoice;
renderChoice=function(def,source='race'){
  if(source!=='race'||def.id!=='duende_tabu')return renderChoiceBeforeDuende(def,source);
  const current=state.identity.raceChoices.duende_tabu||'',text=state.identity.duendeTabuText||'',penalty=state.identity.duendeTabuPenalty||'';
  const isCustom=current==='personalizado';
  const cards=optionList(def).map((option,index)=>'<button type="button" class="choice-card duende-taboo-card '+(current===choiceId(option)?'selected':'')+'" data-action="duende-tabu-preset" data-value="'+esc(choiceId(option))+'"><strong>'+esc((index+1)+'. '+choiceName(option))+'</strong><p><b>Se descumprir, sugestão:</b> '+esc(DUENDE_TABOO_SUGGESTIONS[index]||'Defina a consequência com o mestre.')+'</p></button>').join('');
  const customSection=isCustom?'<div class="grid two duende-taboo-custom-row" style="margin-top:12px"><label class="field"><span>Texto do tabu personalizado</span><textarea class="textarea" data-field="duendeTabuText" placeholder="Descreva o tabu do personagem">'+esc(text)+'</textarea></label><div class="duende-taboo-consequence"><label class="field"><span>Consequência ao descumprir</span><select class="select" data-field="duendeTabuPenalty"><option value="">Escolha uma sugestão</option>'+DUENDE_TABOO_PENALTIES.map(value=>'<option '+(penalty===value?'selected':'')+'>'+value+'</option>').join('')+'</select></label>'+(penalty==='Outra consequência (com o mestre)'?'<label class="field"><span>Consequência personalizada</span><input class="input" data-field="duendeTabuCustomPenalty" value="'+esc(state.identity.duendeTabuCustomPenalty||'')+'" placeholder="Descreva a consequência"></label>':'')+'</div></div>':'';
  return '<div class="choice-section duende-taboo-editor" data-choice-section="duende_tabu"><h4>'+esc(def.nome||'Tabu')+'</h4><p>Escolha um tabu pronto ou clique em "Personalizar tabu" para criar o seu.</p><div class="choice-cards">'+cards+'<button type="button" class="choice-card duende-taboo-card '+(isCustom?'selected':'')+'" data-action="duende-tabu-preset" data-value="personalizado"><strong>Personalizar tabu</strong><p>Escreva uma regra e uma consequência próprias.</p></button></div>'+customSection+'</div>';
};
const renderAllocationBeforeDuende=renderAllocation;
renderAllocation=function(key,config,label){return renderAllocationBeforeDuende(key,config,label).replace('<div class="choice-section">','<div class="choice-section" data-allocation-key="'+esc(key)+'">')};
const raceMissingBeforeDuende=raceMissingChoices;
raceMissingChoices=function(){let missing=raceMissingBeforeDuende();if(state.identity.raceId!=='duende')return missing;if(state.identity.raceChoices.duende_tabu){missing=missing.filter(item=>!String(item.selector||'').includes('duende_tabu'));}else{missing.push({title:'Tabu do duende',message:'Escolha um tabu para o duende.',selector:'[data-action="duende-tabu-preset"]'});}if(state.identity.raceChoices.duende_tabu==='personalizado'){if(!String(state.identity.duendeTabuText||'').trim())missing.push({title:'Tabu personalizado',message:'Escreva o texto do tabu do personagem.',selector:'[data-field="duendeTabuText"]'});if(!state.identity.duendeTabuPenalty)missing.push({title:'Consequência do tabu',message:'Escolha a penalidade ou consequência do tabu.',selector:'[data-field="duendeTabuPenalty"]'});if(state.identity.duendeTabuPenalty==='Outra consequência (com o mestre)'&&!String(state.identity.duendeTabuCustomPenalty||'').trim())missing.push({title:'Consequência personalizada',message:'Descreva a consequência combinada com o mestre.',selector:'[data-field="duendeTabuCustomPenalty"]'});}return missing};
const raceAbilityTextBeforeDuende=raceAbilityText;
raceAbilityText=function(){let text=raceAbilityTextBeforeDuende();if(state.identity.raceId==='duende'&&state.identity.duendeTabuText){const consequence=state.identity.duendeTabuPenalty==='Outra consequência (com o mestre)'?state.identity.duendeTabuCustomPenalty:state.identity.duendeTabuPenalty;text+=' Tabu: '+state.identity.duendeTabuText+(consequence?' Consequência: '+consequence+'.':'')}return text};
document.addEventListener('click',event=>{const button=event.target.closest?.('[data-action="duende-tabu-preset"]');if(!button)return;const def=raceById('duende')?.habilidades?.selecionadas?.find(choice=>choice.id==='duende_tabu'),options=optionList(def),isCustom=button.dataset.value==='personalizado',option=options.find(item=>choiceId(item)===button.dataset.value),index=options.indexOf(option);state.identity.raceChoices.duende_tabu=button.dataset.value;if(isCustom){if(state.identity.duendeTabuText&&options.some(o=>choiceName(o)===state.identity.duendeTabuText)){state.identity.duendeTabuText='';}renderStage();setTimeout(()=>document.querySelector('[data-field="duendeTabuText"]')?.focus(),30);}else{state.identity.duendeTabuText=option?choiceName(option):'';state.identity.duendeTabuPenalty=index>=0?DUENDE_TABOO_DEFAULT_PENALTIES[index]:'';state.identity.duendeTabuCustomPenalty='';renderStage();if(typeof rolarParaCalculadoraAtributos==='function')rolarParaCalculadoraAtributos();}},true);
document.addEventListener('input',event=>{if(event.target.dataset.field==='duendeTabuText'){state.identity.duendeTabuText=event.target.value;persist()}if(event.target.dataset.field==='duendeTabuCustomPenalty'){state.identity.duendeTabuCustomPenalty=event.target.value;persist()}},true);
document.addEventListener('change',event=>{if(event.target.dataset.field==='duendeTabuPenalty'){state.identity.duendeTabuPenalty=event.target.value;renderStage();if(event.target.value&&event.target.value!=='Outra consequência (com o mestre)'&&typeof rolarParaCalculadoraAtributos==='function')rolarParaCalculadoraAtributos();return}if(event.target.dataset.action==='race-choice'&&event.target.dataset.choiceId==='duende_natureza'&&event.target.value==='animal')setTimeout(()=>{const targets=[...document.querySelectorAll('[data-allocation-key="duende_dons"]')];targets.forEach(target=>target.classList.add('duende-attribute-focus'));targets[0]?.closest('.attribute-matrix')?.scrollIntoView({behavior:'smooth',block:'center'})},60)},true);

// Presentation and final validation shared by desktop and mobile.
function migrateCreationLayout(value){
  if(Number(value.layoutVersion||0)<5){
    const swap=step=>step===3?4:step===4?3:step;
    value.step=swap(value.step);value.completed=(value.completed||[]).map(swap);value.layoutVersion=5;
  }
  return value;
}
migrateCreationLayout(state);

// Origins now come before skills (Phase 3 -> Phase 4).
document.addEventListener('change',event=>{
  const field=event.target.dataset.field;
  if(!['standardOrigin','regionalOrigin','originMode'].includes(field))return;
  event.stopImmediatePropagation();
  if(field==='standardOrigin'){
    state.origin.standard=event.target.value;state.origin.benefits=[];state.origin.officeSpecialties={};state.origin.previewBenefit='';
  }else if(field==='regionalOrigin'){
    const reg=DATA.regionalOrigins.find(o=>o.nome===event.target.value);
    const hasWynlla=(typeof hasWynllaOriginPower==='function'?hasWynllaOriginPower():(state.origin?.benefits||[]).includes('power:presente_de_wynlla'));
    if(hasWynlla&&reg&&!(reg.regiao==='Wynlla'||['plebeu_arcano','recruta_arcano'].includes(slug(reg.nome)))){
      event.target.value=state.origin.regional||'';
      toast('O poder Presente de Wynlla só é permitido para nativos de Wynlla.');
      return;
    }
    state.origin.regional=event.target.value;
  }else if(field==='originMode'){
    state.origin.mode=event.target.value;
    if(state.origin.mode==='single'||(typeof isChildCharacter==='function'&&isChildCharacter()))state.origin.regional='';
  }
  if(typeof cleanSkillsAfterOriginChange==='function')cleanSkillsAfterOriginChange();
  if(typeof resetOriginItemsOnOriginChange==='function')resetOriginItemsOnOriginChange();
  if(typeof ensureOriginPartners==='function')ensureOriginPartners();
  state.completed=state.completed.filter(step=>step<3);
  renderStage();
  if(field==='regionalOrigin'&&event.target.value){
    setTimeout(()=>{
      const target=document.getElementById('duploFeericoChoiceSection')
        ||document.querySelector('.aspirante-heroi-section')
        ||document.querySelector('.de-outro-mundo-section')
        ||document.querySelector('.choice-section');
      if(target&&typeof target.scrollIntoView==='function'){
        target.scrollIntoView({behavior:'smooth',block:'center'});
      }
    },60);
  }
},true);

const validationBeforeCreationFlow=validationMessage;
validationMessage=function(step,short=false){
  if(phaseIsComplete(step))return short?'Etapa pronta para continuar.':'Etapa completa.';
  if(step===3)return 'Complete as escolhas de perícias de classe, raça e Inteligência.';
  if(step===4)return 'Escolha a origem e confirme seus dois benefícios.';
  if(step===9)return 'Resolva as pendências indicadas antes de concluir e exportar a ficha.';
  return validationBeforeCreationFlow(step,short);
};

const powerBrowserUI={query:''};
function positionPowerDetail(){
  const browser=document.querySelector('.power-browser'),detail=browser?.querySelector('.power-detail-panel');
  if(!browser||!detail)return;
  const selected=browser.querySelector('.power-row.selected');
  if(window.matchMedia?.('(max-width:860px)').matches&&selected&&!selected.classList.contains('hidden'))selected.after(detail);
  else browser.appendChild(detail);
}
function revealPowerDetail(){
  positionPowerDetail();
  if(window.matchMedia?.('(max-width:860px)').matches)document.querySelector('.power-row.selected')?.scrollIntoView({behavior:'smooth',block:'start'});
}
const bindPowerSearchBeforeFlow=bindPowerSearch;
bindPowerSearch=function(){
  bindPowerSearchBeforeFlow();
  positionPowerDetail();
};
window.addEventListener('resize',positionPowerDetail);
document.addEventListener('click',event=>{
  const action=event.target.closest?.('[data-action]')?.dataset.action;
  if(['power-slot','power-preview','power-select','power-remove','power-filter-category','power-filter-status'].includes(action))state.powers.previewPending=false;
},true);
const locateBeforeCreationFlow=locateMissingChoice;
locateMissingChoice=function(selector,smooth=true){
  if(!selector?.includes('power-select'))return locateBeforeCreationFlow(selector,smooth);
  // A preview is already a selection: direct the user to the missing confirmation.
  powerBrowserUI.query='';
  if (state?.powers) state.powers.searchQuery = '';
  const input=document.getElementById('generalPowerSearch') as HTMLInputElement | null;
  if(input) input.value='';
  if (typeof (globalThis as any).fastUpdatePowerList === 'function') (globalThis as any).fastUpdatePowerList();
  positionPowerDetail();
  const button=document.querySelector(selector);if(!button)return;
  button.scrollIntoView({behavior:smooth?'smooth':'auto',block:'center'});button.classList.add('validation-target');
  setTimeout(()=>{button.classList.remove('validation-target');button.focus({preventScroll:true})},smooth?450:0);
};

function progressionMissingChoices(){
  ensureProgression();
  const missing=[];
  state.progression.forEach((row,index)=>{
    const cls=classById(row.classId),level=classLevelAt(index,row.classId);
    if(!cls)missing.push({title:'Classe do nível '+(index+1),message:'Escolha a classe deste nível.',selector:'[data-action="progress-class"][data-index="'+index+'"]'});
    else if(index>0&&powerSlotAt(cls,level)&&!(DATA.classPowers.some(power=>power.id===row.powerId&&(power.classeIds||[]).includes(row.classId))||progressionRacePowerById(row.powerId)||progressionGeneralPowerById(row.powerId)))missing.push({title:'Poder do nível '+(index+1),message:'Escolha um poder de classe, racial ou geral para o nível '+(index+1)+'.',selector:'[data-action="class-power-preview"][data-index="'+index+'"]'});
    else if(row.powerId==='classe_aumento_de_atributo'&&!row.powerChoice)missing.push({title:'Atributo do nível '+(index+1),message:'Escolha qual atributo recebe o Aumento de Atributo.',selector:'[data-action="class-power-attribute"][data-index="'+index+'"]'});
    else if(['arcanista_familiar','arcanista_familiar_aprimorado'].includes(row.powerId)&&!familiarById(row.powerChoice))missing.push({title:'Familiar do nível '+(index+1),message:'Escolha o familiar arcano ou seu segundo benefício.',selector:'[data-action="choose-familiar"][data-index="'+index+'"]'});
    else if(row.powerId&&!progressionRacePowerById(row.powerId)&&((progressionGeneralPowerById(row.powerId)&&!progressionGeneralEligibility(progressionGeneralPowerById(row.powerId),index).ok)||(!progressionGeneralPowerById(row.powerId)&&!classProgressionEligibility(progressionPowerById(row.powerId),index).ok)))missing.push({title:'Poder inválido no nível '+(index+1),message:'O poder escolhido não cumpre mais seus pré-requisitos.',selector:'[data-action="class-power-preview"][data-index="'+index+'"]'});
  });
  return missing;
}
function characterPendingChoices(){
  const missing=[];
  for(let step=1;step<=PHASES.length;step++){
    if(step===10) continue;
    if(!shouldSkipPhase(step)&&!phaseIsComplete(step)){
      missing.push({title:PHASES[step-1][0],message:'Conclua as escolhas da fase '+step+' · '+PHASES[step-1][0]+'.',selector:'[data-step="'+step+'"]',step:step});
    }
  }
  missing.push(...progressionMissingChoices().map(item=>({...item,step:item.step||10})));
  // Validate all planned levels even if the spell screen last showed only level 1.
  if(!shouldSkipPhase(7)){
    const saved=spellState(),previous=saved.progression;saved.progression=true;
    try{
      const spellMissing=spellMissingChoices();
      if(spellMissing.length)missing.push({title:'Magias e escolas',message:'Conclua as magias e escolas de todos os níveis planejados em Ver / escolher magias.',selector:'[data-action="summary-spells"]',step:7});
    }finally{saved.progression=previous}
  }
  return missing;
}
function canExportCharacter(){
  const isSheet = Boolean((typeof state !== 'undefined' && state.finished) || (typeof window !== 'undefined' && window.location?.pathname?.endsWith('ficha.html')));
  if (isSheet) return true;
  return characterPendingChoices().length === 0;
}
const phaseBeforeFinalValidation=phaseIsComplete,missingBeforeFinalValidation=missingChoices;
phaseIsComplete=function(step){return step===PHASES.length?characterPendingChoices().length===0:phaseBeforeFinalValidation(step)};
missingChoices=function(step){return step===PHASES.length?characterPendingChoices():missingBeforeFinalValidation(step)};
const summaryBeforeFinalValidation=renderSummary;
renderSummary=function(){
  const content=summaryBeforeFinalValidation(),missing=characterPendingChoices();
  return (missing.length?panel('Pendências da ficha','<div class="warning-box red"><ul>'+missing.map(item=>'<li>'+esc(item.message)+'</li>').join('')+'</ul></div>'):'')+content;
};
document.addEventListener('click',event=>{
  if(!event.target.closest?.('#exportButton')||canExportCharacter())return;
  event.preventDefault();event.stopImmediatePropagation();
  showMissingChoiceWarning(characterPendingChoices());
},true);

// Undo only the school whose last class spell was removed; other schools remain.
const chooseSpellBeforeSourceFlow=chooseCharacterSpell;
chooseCharacterSpell=function(groupId,id){
  const plan=spellPlan(),group=plan.groups.find(item=>item.id===groupId),removing=group&&groupSpellIds(group).includes(id);
  const learningAgain=!removing&&group?.id.includes('tatuagem_mistica')&&allLearnedSpellIds(plan).includes(id);
  if(!chooseSpellBeforeSourceFlow(groupId,id))return false;
  const saved=spellState();
  if(removing&&group?.classId){
    const school=spellById(id)?.school,used=spellPlan().groups.filter(other=>other.classId===group.classId).some(other=>groupSpellIds(other).some(key=>spellById(key)?.school===school));
    if(!used&&school){
      saved.lockedSchools[group.classId]=(saved.lockedSchools[group.classId]||[]).filter(value=>value!==school);
      saved.manualSchools[group.classId]=(saved.manualSchools[group.classId]||[]).filter(value=>value!==school);
      saved.schools[group.classId]=(saved.schools[group.classId]||[]).filter(value=>value!==school);
      delete saved.schoolAnnouncements[group.classId];spellPlan();
      saved.activeGroup=groupId;saved.view='available';
      toast('A última magia de '+SPELL_SCHOOLS[school]+' foi removida. Essa escola foi liberada para troca; as demais continuam escolhidas. Você pode escolher outra escola.');
    }
  }
  if(!removing){
    const updated=spellPlan(),current=updated.groups.find(item=>item.id===groupId);
    if(current&&groupSpellIds(current).length===current.count){
      const next=updated.groups.find(other=>other.count&&!other.fixed.length&&groupSpellIds(other).length<other.count&&teurgistUnlocked(other,updated));
      if(next){saved.activeGroup=next.id;saved.view='available';toast('Escolha concluída. Agora escolha: '+next.label+'.');if(next.id.includes('tatuagem_mistica'))setTimeout(()=>{document.getElementById('spellGrimoire')?.scrollIntoView?.({behavior:'smooth',block:'start'});toast('Escolha a magia da tatuagem mística.')},450)}
    }
  }
  if(learningAgain)toast('Reduz o custo da magia em 1 PM.');
  return true;
};
const contextBeforeSourceFlow=grimoireContext;
grimoireContext=function(){
  const context=contextBeforeSourceFlow();if(context.mode)return context;
  const plan=spellPlan(),group=plan.groups.find(item=>item.id===context.group);
  context.repeatable=[];context.repeatNotes={};
  for(const id of context.learned){
    const sources=plan.groups.filter(item=>item.kind!=='reference'&&item.kind!=='consult'&&groupSpellIds(item).includes(id));
    const isReduced=Boolean(spellState().reducedCostSpells?.[id]);
    if(sources.some(item=>item.id.includes('tatuagem_mistica'))&&sources.length>1)context.repeatNotes[id]='Tatuagem Mística: custo reduzido em 1 PM ao aprender esta magia novamente. Considere a redução nos aprimoramentos; o custo final nunca pode ser menor que 1 PM.';
    else if(isReduced||(sources.some(item=>item.id.startsWith('race:')||item.kind==='race')&&sources.length>1))context.repeatNotes[id]='Reaprendizado de magia: custo para lançar reduzido em –1 PM (cumulativo com outras reduções; mínimo 1 PM).';
  }
  if(!group||spellState().view==='learned')return context;
  // Browsing all schools does not widen the set of spells one may learn.
  const browseGroup={...group,schools:[],schoolOpen:true,blockedSchools:[]};
  context.visible=DATA.spells.filter(spell=>basicSpellAllowed(spell,browseGroup,plan)).map(spell=>spell.id);
  context.availableSchools=[...new Set(context.visible.map(id=>spellById(id).school))];
  context.repeatable=context.selectable.filter(id=>context.learned.includes(id)&&!context.chosen.includes(id));
  return context;
};
const locateBeforeSpellSource=locateMissingChoice;
locateMissingChoice=function(selector,smooth=true){
  const match=selector?.match(/data-spell-group="([^"]+)"/);
  if(state.step===7&&match){
    spellState().activeGroup=match[1];spellState().view='available';creationMobileUI.spellOptions=true;refreshSpellStage();
    const target=document.querySelector(selector);if(!target)return;
    target.scrollIntoView({behavior:smooth?'smooth':'auto',block:'center'});target.classList.add('validation-target');
    setTimeout(()=>target.classList.remove('validation-target'),3200);return;
  }
  return locateBeforeSpellSource(selector,smooth);
};
const creationMobileUI={spellOptions:false};
function updateSpellOptionsToggle(){
  const toggle=document.getElementById('spellOptionsToggle');if(!toggle)return;
  const plan=spellPlan(),saved=spellState(),group=plan.groups.find(group=>group.id===saved.activeGroup);
  toggle.textContent=(group?group.label+' · '+groupSpellIds(group).length+'/'+(group.fixed.length||group.count):'Magias')+' · Opções '+(creationMobileUI.spellOptions?'▴':'▾');
  toggle.setAttribute('aria-expanded',String(creationMobileUI.spellOptions));
  document.querySelector('.spell-top-panel')?.classList.toggle('mobile-options-open',creationMobileUI.spellOptions);
}
document.addEventListener('click',event=>{
  if(event.target.closest?.('#spellOptionsToggle')){creationMobileUI.spellOptions=!creationMobileUI.spellOptions;updateSpellOptionsToggle()}
});
const spellRefreshBeforeCreationFlow=refreshSpellStage;
refreshSpellStage=function(){spellRefreshBeforeCreationFlow();updateSpellOptionsToggle()};


let creationNavigationDirection=1;
document.addEventListener('click',event=>{
  const stepBtn=event.target.closest?.('[data-step]');
  if(event.target.closest?.('#previousButton'))creationNavigationDirection=-1;
  else if(stepBtn){
    const targetStep=Number(stepBtn.dataset.step);
    creationNavigationDirection=targetStep<state.step?-1:1;
  }
  else if(event.target.closest?.('#nextButton'))creationNavigationDirection=1;
},true);
function scrollToNextSkillGroup(group){
  if(state.step!==4)return;
  const limits=typeof skillChoiceLimits==='function'?skillChoiceLimits():{class:0,int:0,race:0,duplicate:0};
  const count=(state.skills[group]||[]).length;
  const limit=limits[group]||0;
  if(count<limit)return;
  let next='';
  if(group==='class'){
    if(limits.int>0&&(state.skills.int||[]).length<limits.int)next='int';
    else if(limits.race>0&&(state.skills.race||[]).length<limits.race)next='race';
    else if(limits.duplicate>0&&(state.skills.duplicate||[]).length<limits.duplicate)next='duplicate';
  }else if(group==='int'){
    if(limits.race>0&&(state.skills.race||[]).length<limits.race)next='race';
    else if(limits.duplicate>0&&(state.skills.duplicate||[]).length<limits.duplicate)next='duplicate';
  }else if(group==='race'){
    if(limits.duplicate>0&&(state.skills.duplicate||[]).length<limits.duplicate)next='duplicate';
  }
  if(next){
    setTimeout(()=>{
      const el=document.getElementById('skill-'+next);
      if(el&&typeof el.scrollIntoView==='function'){
        el.scrollIntoView({behavior:'smooth',block:'start'});
      }
    },60);
  }
}
document.addEventListener('change',event=>{
  if(event.target.dataset.action==='skill'&&event.target.checked)scrollToNextSkillGroup(event.target.dataset.group);
});
const officeChoiceBeforeAutoScroll=applyOfficeChoice;
applyOfficeChoice=function(id){const group=officePending?.source==='skill'?officePending.group:null;officeChoiceBeforeAutoScroll(id);if(group)scrollToNextSkillGroup(group)};

// equipment-management.js
// Gerencia o estado de equipamento do personagem: o que está vestido/equipado vs guardado na mochila.
// Rastreia armadura equipada, escudo, arma na mão, traje e mochila com ações contextuais (Guardar, Trocar, Empunhar 1M/2M).

// ── Funções auxiliares de ID de entrada ─────────────────────────────────────
/** Retorna o ID único e estável de uma entrada do inventário. */
function equipEntryId(entry,index){
  return entry?.instanceId||entry?.uid||entry?.id||entry?.acquisition?.operationId||entry?.acquisition?.grantId||(entry?.itemId+':'+index);
}

/** Garante que state.equipment existe e tem a estrutura esperada. */
function equipmentState(){
  if(!state.equipment||typeof state.equipment!=='object')state.equipment={};
  const eq=state.equipment;
  if(eq.armorId===undefined)eq.armorId=null;
  if(eq.shieldId===undefined)eq.shieldId=null;
  if(eq.weaponId===undefined)eq.weaponId=null;
  if(eq.offhandId===undefined)eq.offhandId='none';
  if(eq.trailerId===undefined)eq.trailerId=null;
  if(eq.backpackId===undefined)eq.backpackId=null;
  if(!Array.isArray(eq.wornIds))eq.wornIds=[];
  if(!eq.adaptableHandedness||typeof eq.adaptableHandedness!=='object')eq.adaptableHandedness={};
  return eq;
}

// ── Hierarquia de Armas Empunhadas (Exótica > Marcial > Simples) ─────────────
function weaponHierarchyRank(item){
  if(!item||item.tipo!=='arma')return 0;
  const cat=String(item.categoriaId||item.arma?.categoriaId||'').toLowerCase();
  if(cat==='exotica'||cat==='fogo')return 3;
  if(cat==='marcial')return 2;
  if(cat==='simples')return 1;
  return 0;
}

function findHighestRankWeaponEntry(inventory, catalog){
  const weaponEntries=inventory
    .map((entry,index)=>({entry,index,item:catalog.get(entry.itemId)}))
    .filter(record=>record.item?.tipo==='arma');
  if(!weaponEntries.length)return null;
  weaponEntries.sort((a,b)=>{
    const rankDiff=weaponHierarchyRank(b.item)-weaponHierarchyRank(a.item);
    if(rankDiff!==0)return rankDiff;
    return a.index-b.index;
  });
  return weaponEntries[0]?.entry||null;
}

// ── Auto-equipar na primeira abertura ───────────────────────────────────────
let initializingEquipment=false;
