// Presentation and final validation shared by desktop and mobile.
[PHASES[2],PHASES[3]]=[PHASES[3],PHASES[2]];
function migrateCreationLayout(value){
  if(Number(value.layoutVersion||0)<4){
    const swap=step=>step===3?4:step===4?3:step;
    value.step=swap(value.step);value.completed=(value.completed||[]).map(swap);value.layoutVersion=4;
  }
  return value;
}
migrateCreationLayout(state);

// Origins now come after skills. Changing an origin must not erase earlier work.
document.addEventListener('change',event=>{
  const field=event.target.dataset.field;
  if(!['standardOrigin','regionalOrigin'].includes(field))return;
  event.stopImmediatePropagation();
  if(field==='standardOrigin'){
    state.origin.standard=event.target.value;state.origin.benefits=[];state.origin.officeSpecialties={};state.origin.previewBenefit='';
  }else state.origin.regional=event.target.value;
  state.completed=state.completed.filter(step=>step<4);renderStage();
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
  const input=document.getElementById('generalPowerSearch');
  if(input){
    input.value=powerBrowserUI.query;
    const filter=()=>{const query=slug(input.value);document.querySelectorAll('.power-row').forEach(row=>row.classList.toggle('hidden',Boolean(query&&!row.dataset.search.includes(query))));positionPowerDetail()};
    input.addEventListener('input',()=>{powerBrowserUI.query=input.value;filter()});filter();
  }
  positionPowerDetail();
};
window.addEventListener('resize',positionPowerDetail);
document.addEventListener('click',event=>{
  const action=event.target.closest?.('[data-action]')?.dataset.action;
  if(['power-slot','power-select','power-remove','power-filter-category','power-filter-status'].includes(action))state.powers.previewPending=false;
},true);
const locateBeforeCreationFlow=locateMissingChoice;
locateMissingChoice=function(selector,smooth=true){
  if(!selector?.includes('power-select'))return locateBeforeCreationFlow(selector,smooth);
  // A preview is already a selection: direct the user to the missing confirmation.
  powerBrowserUI.query='';const input=document.getElementById('generalPowerSearch');if(input)input.value='';
  document.querySelectorAll('.power-row').forEach(row=>row.classList.remove('hidden'));positionPowerDetail();
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
    else if(index>0&&powerSlotAt(cls,level)&&!DATA.classPowers.some(power=>power.id===row.powerId&&(power.classeIds||[]).includes(row.classId)))missing.push({title:'Poder do nível '+(index+1),message:'Escolha o poder de '+cls.nome+' para o nível '+(index+1)+'.',selector:'[data-action="progress-power"][data-index="'+index+'"]'});
  });
  return missing;
}
function characterPendingChoices(){
  const missing=[];
  for(let step=1;step<=6;step++)if(!phaseIsComplete(step))missing.push({title:PHASES[step-1][0],message:'Conclua as escolhas da fase '+step+' · '+PHASES[step-1][0]+'.',selector:'[data-step="'+step+'"]'});
  missing.push(...progressionMissingChoices());
  // Validate all planned levels even if the spell screen last showed only level 1.
  const saved=spellState(),previous=saved.progression;saved.progression=true;
  try{
    const spellMissing=spellMissingChoices();
    if(spellMissing.length)missing.push({title:'Magias e escolas',message:'Conclua as magias e escolas de todos os níveis planejados em Ver / escolher magias.',selector:'[data-action="summary-spells"]'});
  }finally{saved.progression=previous}
  return missing;
}
function canExportCharacter(){return state.step===9&&characterPendingChoices().length===0}
const phaseBeforeFinalValidation=phaseIsComplete,missingBeforeFinalValidation=missingChoices;
phaseIsComplete=function(step){return step===9?characterPendingChoices().length===0:phaseBeforeFinalValidation(step)};
missingChoices=function(step){return step===9?characterPendingChoices():missingBeforeFinalValidation(step)};
const summaryBeforeFinalValidation=renderSummary;
renderSummary=function(){
  const content=summaryBeforeFinalValidation(),missing=characterPendingChoices();
  return (missing.length?panel('Pendências da ficha','<div class="warning-box red"><ul>'+missing.map(item=>'<li>'+esc(item.message)+'</li>').join('')+'</ul></div>'):'')+content;
};
document.addEventListener('click',event=>{
  if(!event.target.closest?.('#exportButton')||canExportCharacter())return;
  event.preventDefault();event.stopImmediatePropagation();
  if(state.step===9)showMissingChoiceWarning(characterPendingChoices());
  else toast('A exportação fica disponível na fase 9, quando a ficha estiver completa.');
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
    if(sources.some(item=>item.id.includes('tatuagem_mistica'))&&sources.length>1)context.repeatNotes[id]='Tatuagem Mística: custo reduzido em 1 PM ao aprender esta magia novamente. Considere a redução nos aprimoramentos; o custo final nunca pode ser menor que 1 PM.';
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
const renderBeforeCreationFlow=renderStage;
renderStage=function(){
  // Skip only empty choice screens; racial powers still require their own choices.
  while((state.step===6&&generalPowerSlots()===0&&racePowerGroups().every(group=>!Number(group.quantity)))||(state.step===7&&spellPlan().groups.length===0&&!spellPlan().notes.some(note=>note.blocking))){
    if(!state.completed.includes(state.step))state.completed.push(state.step);
    state.step+=creationNavigationDirection;
  }
  renderBeforeCreationFlow();
  document.body?.classList.toggle('spell-stage',state.step===7);
  document.getElementById('exportButton').hidden=!canExportCharacter();
  document.getElementById('footerMessage').hidden=true;
  if(state.step===7)updateSpellOptionsToggle();
};
let creationNavigationDirection=1;
document.addEventListener('click',event=>{
  if(event.target.closest?.('#previousButton'))creationNavigationDirection=-1;
  else if(event.target.closest?.('#nextButton')||event.target.closest?.('[data-step]'))creationNavigationDirection=1;
},true);
function scrollToNextSkillGroup(group){
  if(state.step!==3)return;
  const limits=skillChoiceLimits();
  if((state.skills[group]||[]).length!==limits[group])return;
  const next=group==='class'?(limits.race?'race':limits.int?'int':''):group==='race'&&limits.int?'int':'';
  if(next)document.getElementById('skill-'+next)?.scrollIntoView?.({behavior:'smooth',block:'start'});
}
document.addEventListener('change',event=>{
  if(event.target.dataset.action==='skill'&&event.target.checked)scrollToNextSkillGroup(event.target.dataset.group);
});
const officeChoiceBeforeAutoScroll=applyOfficeChoice;
applyOfficeChoice=function(id){const group=officePending?.source==='skill'?officePending.group:null;officeChoiceBeforeAutoScroll(id);if(group)scrollToNextSkillGroup(group)};
