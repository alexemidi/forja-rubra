// School registration is derived from actual class choices, never racial grants.
function reconcileSpellSchools(plan){
  const saved=spellState();
  for(const cls of plan.classes){
    if(!cls.schoolCount)continue;
    const groups=plan.groups.filter(group=>group.classId===cls.classId);
    const inferred=[...new Set(groups.flatMap(groupSpellIds).map(spellById).filter(Boolean).map(spell=>spell.school))].filter(id=>!cls.fixedSchools.includes(id));
    const valid=id=>Boolean(SPELL_SCHOOLS[id])&&!cls.fixedSchools.includes(id);
    if(!Array.isArray(saved.manualSchools[cls.classId]))saved.manualSchools[cls.classId]=(saved.schools[cls.classId]||[]).filter(id=>valid(id)&&!inferred.includes(id));
    const locked=(saved.lockedSchools[cls.classId]||[]).filter(valid);
    const chosen=locked.length===cls.schoolCount?locked:[...new Set([...inferred,...saved.manualSchools[cls.classId].filter(valid)])].slice(0,cls.schoolCount);
    saved.schools[cls.classId]=chosen;
    if(chosen.length===cls.schoolCount)saved.lockedSchools[cls.classId]=[...chosen];
    cls.chosenSchools=chosen;cls.schools=[...cls.fixedSchools,...chosen];
    for(const group of groups){group.schools=cls.schools;group.schoolOpen=chosen.length<cls.schoolCount}
  }
}
function pendingSchoolClass(){return spellPlan().classes.find(cls=>cls.chosenSchools.length<cls.schoolCount&&classSpellChoicesFilled(cls.classId,spellPlan()))}
let schoolDialogReturnFocus=null;
function closeSchoolDialog(){
  const modal=document.getElementById('spellSchoolModal');modal.hidden=true;
  schoolDialogReturnFocus?.focus?.();
}
function openSchoolDialog(classId,mode='choose'){
  const cls=spellPlan().classes.find(cls=>cls.classId===classId);if(!cls)return;
  const modal=document.getElementById('spellSchoolModal'),remaining=cls.schoolCount-cls.chosenSchools.length;
  if(!modal.hidden&&modal.dataset.classId===classId&&mode==='notice')return;
  schoolDialogReturnFocus=document.activeElement;
  modal.dataset.classId=classId;modal.dataset.mode=mode;
  document.getElementById('spellSchoolTitle').textContent=mode==='notice'?'Escolas de magia definidas':remaining===1?'Escolha a escola que falta':'Escolha as '+remaining+' escolas que faltam';
  const names=cls.schools.map(id=>SPELL_SCHOOLS[id]).join(', ');
  const body=mode==='notice'?'<p>Você escolheu <strong>'+esc(names)+'</strong>.</p><p>As outras escolas ficam indisponíveis para as magias de '+esc(cls.name)+', nesta etapa e na progressão. Magias recebidas por outras fontes seguem suas próprias regras.</p>':'<p>'+esc(cls.name)+' · '+(names?'Já escolhidas: '+esc(names)+'.':'Nenhuma escola escolhida.')+'</p><p>Escolha '+remaining+' escola(s) para completar suas opções atuais e futuras, ou consulte as magias antes de decidir.</p><div class="school-dialog-options">'+Object.entries(SPELL_SCHOOLS).filter(([id])=>!cls.schools.includes(id)).map(([id,name])=>'<button type="button" class="button" data-action="school-dialog-pick" data-class-id="'+classId+'" data-school="'+id+'">'+esc(name)+'</button>').join('')+'</div>';
  document.getElementById('spellSchoolBody').innerHTML=body;
  document.getElementById('spellSchoolActions').innerHTML=mode==='notice'?'<button type="button" class="button primary" data-action="school-dialog-close">Entendi</button>':'<button type="button" class="button" data-action="school-dialog-close">Voltar</button><button type="button" class="button school-replace" data-action="school-review" data-class-id="'+classId+'">Conferir magias antes de decidir</button>';
  modal.hidden=false;
  document.getElementById('spellSchoolTitle').focus?.();
}
function notifySchoolCompletion(){
  if(state.step!==7)return;
  const saved=spellState(),cls=spellPlan().classes.find(cls=>cls.schoolCount&&cls.chosenSchools.length===cls.schoolCount&&saved.schoolAnnouncements[cls.classId]!==cls.schools.join('|'));
  if(!cls)return;
  if(spellCatalogUI.schoolReview?.classId===cls.classId){
    endSchoolReview();document.getElementById('spellReviewBar').innerHTML='';syncSpellControls();syncGrimoire();
  }
  saved.schoolAnnouncements[cls.classId]=cls.schools.join('|');persist();openSchoolDialog(cls.classId,'notice');
}
function startSchoolReview(classId){
  const cls=spellPlan().classes.find(cls=>cls.classId===classId);
  if(!cls||!cls.schoolCount||cls.chosenSchools.length===cls.schoolCount)return false;
  const previous=spellCatalogUI.schoolReview?.previous||{books:[...spellCatalogUI.books],group:spellState().activeGroup,view:spellState().view};
  spellCatalogUI.schoolReview={classId,candidate:'',previous};
  spellCatalogUI.books=new Set(SPELL_BOOK_IDS);spellCatalogUI.section='magias';spellState().view='available';
  closeSchoolDialog();return true;
}
function endSchoolReview(){
  const review=spellCatalogUI.schoolReview;if(!review)return;
  spellCatalogUI.books=new Set(review.previous.books);spellState().activeGroup=review.previous.group;spellState().view=review.previous.view;
  spellCatalogUI.schoolReview=null;
}
function schoolReviewCandidates(plan=spellPlan()){
  const cls=plan.classes.find(cls=>cls.classId===spellCatalogUI.schoolReview?.classId);
  if(!cls)return [];
  return DATA.spells.filter(spell=>!cls.schools.includes(spell.school)&&(spell.type===cls.effect.magiaTipo||spell.type==='universal')&&!(cls.classId==='necromante'&&spell.school==='encantamento'));
}
function schoolReplacementTargets(candidateId,plan=spellPlan()){
  const review=spellCatalogUI.schoolReview,candidate=spellById(candidateId);
  if(!review||!candidate||candidate.circle!==1||!schoolReviewCandidates(plan).some(spell=>spell.id===candidateId))return [];
  return plan.groups.filter(group=>group.classId===review.classId&&group.kind==='class'&&group.count&&basicSpellAllowed(candidate,group,plan)&&!plan.groups.some(other=>other.scope===group.scope&&groupSpellIds(other).includes(candidateId))).flatMap(group=>groupSpellIds(group).filter(id=>spellById(id)?.circle===1).map(id=>({group:group.id,id})));
}
function replaceCharacterSpell(groupId,oldId,newId){
  const plan=spellPlan(),target=schoolReplacementTargets(newId,plan).find(target=>target.group===groupId&&target.id===oldId);
  if(!target)return false;
  const saved=spellState(),snapshot=JSON.stringify(saved),list=groupSpellIds(plan.groups.find(group=>group.id===groupId));
  saved.selections[groupId]=list.map(id=>id===oldId?newId:id);
  const updated=spellPlan(),group=updated.groups.find(group=>group.id===groupId);
  // Validate the replacement before accepting it; failed attempts restore all choices.
  if(spellSelectionReason(newId,group,updated)) {state.spells=JSON.parse(snapshot);return false}
  state.completed=state.completed.filter(step=>step!==7);return true;
}
function renderSchoolReviewBar(){
  const review=spellCatalogUI.schoolReview;if(!review)return '';
  const cls=spellPlan().classes.find(cls=>cls.classId===review.classId);if(!cls)return '';
  return '<div class="school-review-banner"><div><strong>'+esc(review.candidate?'Substituir por '+spellById(review.candidate)?.name:'Consulta de escolas · '+cls.name)+'</strong><p>'+(review.candidate?'Escolha abaixo qual magia de 1º círculo será substituída. Nenhuma alteração será feita antes dessa escolha.':'Todos os círculos para leitura, somente '+(cls.effect.magiaTipo==='arcana'?'arcanas':'divinas')+' e universais, sem as escolas já escolhidas. Magias de 1º círculo podem substituir uma escolha atual; as demais não podem ser aprendidas aqui.')+'</p></div><div class="inline-actions">'+(review.candidate?'<button type="button" class="button" data-action="school-review-back">Voltar à consulta</button>':'')+'<button type="button" class="button" data-action="school-review-finish" data-class-id="'+cls.classId+'">Escolher escola</button><button type="button" class="button" data-action="school-review-exit">Sair da consulta</button></div></div>';
}
const grimoireContextBeforeSchools=grimoireContext;
grimoireContext=function(){
  const context=grimoireContextBeforeSchools(),plan=spellPlan(),review=spellCatalogUI.schoolReview;
  const removable={};
  for(const group of [...plan.groups].sort((a,b)=>Number(b.id===context.group)-Number(a.id===context.group))){
    if(!group.count||group.fixed.length||group.id!==context.group)continue;
    for(const id of groupSpellIds(group))if(spellById(id)&&!removable[id])removable[id]=group.id;
  }
  const selected=[...new Set(plan.groups.filter(group=>group.kind!=='reference'&&group.kind!=='consult').flatMap(groupSpellIds))].filter(id=>spellById(id));
  context.removable=removable;context.learned=selected;
  if(spellState().view==='learned'){
    context.visible=selected;context.chosen=Object.keys(removable).filter(id=>selected.includes(id));
    context.selectable=[];context.canChoose=false;
    const spells=selected.map(spellById);context.circles=[...new Set(spells.map(spell=>spell.circle))];context.availableSchools=[...new Set(spells.map(spell=>spell.school))];
    context.traditions=[...new Set(spells.flatMap(spell=>spell.type==='universal'?['arcana','divina']:[spell.type]))];
  }
  if(!review)return context;
  const cls=plan.classes.find(cls=>cls.classId===review.classId);if(!cls)return context;
  const candidates=schoolReviewCandidates(plan),targets=review.candidate?schoolReplacementTargets(review.candidate,plan):[];
  context.mode=review.candidate?'school-replace':'school-review';context.reviewClass=review.classId;context.candidate=review.candidate;
  context.visible=review.candidate?[...new Set(targets.map(target=>target.id))]:candidates.map(spell=>spell.id);
  context.replaceable=review.candidate?context.visible:candidates.filter(spell=>spell.circle===1&&schoolReplacementTargets(spell.id,plan).length).map(spell=>spell.id);
  context.replacementGroups=Object.fromEntries(targets.map(target=>[target.id,target.group]));
  context.chosen=[];context.selectable=[];context.canChoose=false;context.removable={};
  context.circles=review.candidate?[1]:[1,2,3,4,5];context.traditions=[cls.effect.magiaTipo];
  context.availableSchools=review.candidate?[...new Set(context.visible.map(id=>spellById(id).school))]:Object.keys(SPELL_SCHOOLS).filter(id=>!cls.schools.includes(id));
  return context;
};
const renderSpellsBeforeSchools=renderSpells;
renderSpells=function(){return renderSpellsBeforeSchools().replace('<p class="spell-frame-status"','<div id="spellReviewBar">'+renderSchoolReviewBar()+'</div><p class="spell-frame-status"')};
const refreshSpellStageBeforeSchools=refreshSpellStage;
refreshSpellStage=function(){
  refreshSpellStageBeforeSchools();document.getElementById('spellReviewBar').innerHTML=renderSchoolReviewBar();notifySchoolCompletion();
};
function handleSchoolBridgeMessage(message){
  const review=spellCatalogUI.schoolReview;
  if(message.type==='learned-view'){
    if(review)return true;
    spellState().view=spellState().view==='learned'?'available':'learned';refreshSpellStage();return true;
  }
  if(message.type==='open-schools'){
    const cls=spellPlan().classes.find(cls=>cls.classId===message.classId);if(cls?.schoolCount)openSchoolDialog(cls.classId,cls.chosenSchools.length===cls.schoolCount?'notice':'choose');return true;
  }
  if(message.type==='replace-preview'){
    if(review&&!review.candidate&&schoolReplacementTargets(message.id).length){review.candidate=message.id;refreshSpellStage()}
    return true;
  }
  if(message.type==='replace-confirm'){
    if(review?.candidate&&message.candidate===review.candidate){
      const target=schoolReplacementTargets(review.candidate).find(target=>target.id===message.id);
      if(target&&replaceCharacterSpell(target.group,target.id,review.candidate)){review.candidate='';refreshSpellStage();toast('Magia substituída.')}else toast('Esta substituição não é permitida.');
    }
    return true;
  }
  if(message.type==='choose'){
    if(review)return true;
    const context=grimoireContext(),groupId=context.removable[message.id];
    if(context.visible.includes(message.id)&&groupId){if(chooseCharacterSpell(groupId,message.id))refreshSpellStage();return true}
  }
  return false;
}
// Capture on window, before the generic document-level "missing choice" warning.
window.addEventListener('click',event=>{
  if(state.step!==7)return;
  if(event.target.closest?.('#nextButton')){
    const pending=pendingSchoolClass();
    if(pending){event.preventDefault();event.stopImmediatePropagation();openSchoolDialog(pending.classId);return}
    if(spellCatalogUI.schoolReview)endSchoolReview();
  }
},true);
document.addEventListener('click',event=>{
  const button=event.target.closest?.('[data-action]');if(!button)return;
  const {action,classId,school}=button.dataset;
  if(action==='school-open')openSchoolDialog(classId);
  if(action==='school-dialog-close')closeSchoolDialog();
  if(action==='school-dialog-pick'&&chooseSpellSchool(classId,school)){
    closeSchoolDialog();refreshSpellStage();
    const cls=spellPlan().classes.find(cls=>cls.classId===classId);if(cls.chosenSchools.length<cls.schoolCount)openSchoolDialog(classId);
  }
  if(action==='school-review'&&startSchoolReview(classId)){refreshSpellStage();document.getElementById('spellGrimoire').scrollIntoView?.({behavior:'smooth',block:'start'})}
  if(action==='school-review-back'&&spellCatalogUI.schoolReview){spellCatalogUI.schoolReview.candidate='';refreshSpellStage()}
  if(action==='school-review-finish'){endSchoolReview();refreshSpellStage();openSchoolDialog(classId)}
  if(action==='school-review-exit'){endSchoolReview();refreshSpellStage()}
});
document.getElementById('spellSchoolModal').addEventListener('click',event=>{if(event.target.id==='spellSchoolModal')closeSchoolDialog()});
document.getElementById('spellSchoolModal').addEventListener('keydown',event=>{
  if(event.key==='Escape'){event.preventDefault();closeSchoolDialog();return}
  if(event.key!=='Tab')return;
  const buttons=[...document.getElementById('spellSchoolModal').querySelectorAll('button:not([disabled])')],first=buttons[0],last=buttons.at(-1);
  if(event.shiftKey&&(document.activeElement===first||document.activeElement?.id==='spellSchoolTitle')){event.preventDefault();last?.focus()}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}
});
const renderStageBeforeSchools=renderStage;
renderStage=function(){if(state.step!==7){endSchoolReview();closeSchoolDialog()}renderStageBeforeSchools();if(state.step===7)notifySchoolCompletion()};
