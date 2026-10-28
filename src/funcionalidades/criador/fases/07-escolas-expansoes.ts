function getAvailableProficiencyOptions(classId = state.identity?.classId, currentChoice = '') {
  let currentValues = new Set([...(classById(classId)?.caracteristicas?.proficiencias || [])]);
  if (typeof characterProficiencies === 'function') {
    const all = characterProficiencies(classId);
    currentValues = new Set(all.filter(id => id !== currentChoice));
  }
  if (classId === state.identity?.classId && typeof suraggelHeritage === 'function' && suraggelHeritage() === 'heranca_de_werra' && state.identity?.raceChoices?.suraggel_werra_proficiencia === 'armas_marciais') {
    currentValues.add('armas_marciais');
  }
  const std = typeof selectedStandardOrigin === 'function' ? selectedStandardOrigin() : null;
  const reg = typeof selectedRegionalOrigin === 'function' ? selectedRegionalOrigin() : null;
  const isUbaneri = std?.nome === 'Andarilho Ubaneri' || reg?.nome === 'Andarilho Ubaneri' || state.origin?.regional === 'Andarilho Ubaneri' || state.origin?.standard === 'Andarilho Ubaneri' || state.origin?.regional === 'andarilho_ubaneri';
  if (isUbaneri) currentValues.add('escudos');
  const isDesertor = std?.nome === 'Desertor da Supremacia' || reg?.nome === 'Desertor da Supremacia' || state.origin?.standard === 'desertor_da_supremacia' || state.origin?.regional === 'desertor_da_supremacia';
  if (isDesertor) currentValues.add('escudos');
  const isLegionario = std?.nome === 'Legionário' || reg?.nome === 'Legionário' || state.origin?.standard === 'legionario' || state.origin?.regional === 'legionario';
  if (isLegionario) currentValues.add('escudos');
  const isProcurado = std?.nome === 'Procurado: Vivo ou Morto' || reg?.nome === 'Procurado: Vivo ou Morto' || state.origin?.standard === 'procurado_vivo_ou_morto' || state.origin?.regional === 'procurado_vivo_ou_morto';
  if (isProcurado) currentValues.add('armas_de_fogo');

  const allProfOptions = [
    { id: 'armas_marciais', name: 'Armas marciais' },
    { id: 'armas_de_fogo', name: 'Armas de fogo' },
    { id: 'armaduras_pesadas', name: 'Armaduras pesadas' },
    { id: 'escudos', name: 'Escudos' }
  ];

  if (currentValues.has('armas_marciais') || currentChoice === 'armas_exoticas') {
    allProfOptions.push({ id: 'armas_exoticas', name: 'Armas exóticas' });
  }

  return allProfOptions.filter(opt => opt.id === currentChoice || !currentValues.has(opt.id));
}
if(typeof window !== 'undefined'){ window.getAvailableProficiencyOptions = getAvailableProficiencyOptions; }
if(typeof globalThis !== 'undefined'){ globalThis.getAvailableProficiencyOptions = getAvailableProficiencyOptions; }


document.addEventListener('click',event=>{
  const next=event.target.closest?.('#nextButton');
  if(!next||state.step!==7)return;
  const missing=typeof spellMissingChoices==='function'?spellMissingChoices():[];
  if(missing.length>0){
    event.preventDefault();
    event.stopImmediatePropagation();
    showMissingChoiceWarning(missing);
    document.getElementById('spellGrimoire')?.scrollIntoView({behavior:'smooth',block:'start'});
    return;
  }
  const overall=typeof characterPendingChoices==='function'?characterPendingChoices():[];
  if(!overall.length&&(next.textContent==='Finalizar ficha'||!missingChoices(9).length)){
    event.preventDefault();
    event.stopImmediatePropagation();
    if(typeof finishCharacterCreation==='function')finishCharacterCreation();
    else{
      if(!state.completed.includes(7))state.completed.push(7);
      if(!state.completed.includes(9))state.completed.push(9);
      state.finished=true;
      state.sheetView='sheet';
      persistNow();
      renderStage();
      window.scrollTo({top:0,behavior:'smooth'});
    }
    toast('Ficha concluída com sucesso!');
  }
},true);


// School registration is derived from actual class choices, never racial grants or general powers.
function reconcileSpellSchools(plan){
  const saved=spellState();
  for(const cls of plan.classes){
    if(!cls.schoolCount)continue;
    const classGroups=plan.groups.filter(group=>group.classId===cls.classId&&group.kind==='class'&&!group.teurgist&&!group.teurgistConverted);
    const inferred=[...new Set(
      classGroups
        .filter(group=>!group.fixed.length&&group.count)
        .flatMap(groupSpellIds)
        .map(spellById)
        .filter(Boolean)
        .filter(spell=>(spell.type===cls.effect.magiaTipo||spell.type==='universal')&&!spell.divina)
        .map(spell=>spell.school)
    )].filter(id=>!cls.fixedSchools.includes(id));
    const valid=id=>Boolean(SPELL_SCHOOLS[id])&&!cls.fixedSchools.includes(id);
    if(!Array.isArray(saved.manualSchools[cls.classId]))saved.manualSchools[cls.classId]=(saved.schools[cls.classId]||[]).filter(id=>valid(id)&&!inferred.includes(id));
    const locked=(saved.lockedSchools[cls.classId]||[]).filter(valid);
    const chosen=locked.length===cls.schoolCount?locked:[...new Set([...inferred,...saved.manualSchools[cls.classId].filter(valid)])].slice(0,cls.schoolCount);
    saved.schools[cls.classId]=chosen;
    if(chosen.length===cls.schoolCount)saved.lockedSchools[cls.classId]=[...chosen];
    cls.chosenSchools=chosen;cls.schools=[...cls.fixedSchools,...chosen];
    for(const group of plan.groups.filter(group=>group.classId===cls.classId)){group.schools=cls.schools;group.schoolOpen=chosen.length<cls.schoolCount}
  }
}
function pendingSchoolClass(){return spellPlan().classes.find(cls=>cls.chosenSchools.length<cls.schoolCount&&classSpellChoicesFilled(cls.classId,spellPlan()))}
let schoolDialogReturnFocus=null;
function closeSchoolDialog(){
  const modal=document.getElementById('spellSchoolModal');modal.hidden=true;
  schoolDialogReturnFocus?.focus?.();
}
function openSchoolDialog(classId,mode='choose'){
  if(mode==='notice'){if(!spellMissingChoices().length)openGrimoireCompletion();return}
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
  if(state.step!==7||spellMissingChoices().length)return;
  const plan=spellPlan(),saved=spellState(),ids=allLearnedSpellIds(plan);
  if(!ids.length)return;
  const signature=JSON.stringify([ids,plan.classes.map(cls=>[cls.classId,cls.schools,cls.level]),characterSpellcastingSources()]);
  if(saved.grimoireAnnouncement===signature)return;
  saved.grimoireAnnouncement=signature;persist();openGrimoireCompletion();
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
  const context=grimoireContextBeforeSchools();
  if(context.mode==='consult'||context.group==='general-consultation')return context;
  const plan=spellPlan(),review=spellCatalogUI.schoolReview;
  const isLearnedView=spellState().view==='learned';
  const removable={};
  for(const group of plan.groups){
    if(!group.count||group.fixed.length)continue;
    if(!isLearnedView && group.id!==context.group)continue;
    for(const id of groupSpellIds(group)){
      if(spellById(id)&&!removable[id])removable[id]=group.id;
    }
  }
  const selected=[...new Set(plan.groups.filter(group=>group.kind!=='reference'&&group.kind!=='consult').flatMap(group=>[...(group.fixed||[]),...groupSpellIds(group)]))].filter(id=>spellById(id));
  context.removable=removable;context.learned=selected;
  if(isLearnedView){
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
  refreshSpellStageBeforeSchools();
  const reviewBar=document.getElementById('spellReviewBar');
  if(!reviewBar)return;
  reviewBar.innerHTML=renderSchoolReviewBar();notifySchoolCompletion();
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



state.identity.suraggelChoices=Object.assign({},state.identity.suraggelChoices||{});
function suraggelHeritage(){return state.identity.raceId==='suraggel'?state.identity.raceChoices.suraggel_heranca_substituta:''}
function suraggelHeritageOption(){const definition=raceById('suraggel')?.habilidades?.selecionadas?.find(choice=>choice.id==='suraggel_heranca_substituta');return optionList(definition||{}).find(option=>choiceId(option)===suraggelHeritage())}
function suraggelCarryingBonus(){return suraggelHeritage()==='heranca_de_odisseia'?2:0}
function characterProficiencies(classId=state.identity.classId){
  const values: string[] = [];
  const addProf = (id?: string) => {
    if (id && !values.includes(id)) values.push(id);
  };
  const classIds = new Set<string>();
  if (classId) classIds.add(classId);
  if (state?.identity?.classId) classIds.add(state.identity.classId);
  for (const cid of classIds) {
    for (const p of (classById(cid)?.caracteristicas?.proficiencias || [])) {
      addProf(p);
    }
  }
  const rId = state?.identity?.raceId || '';
  if (rId === 'kliren') addProf('armas_de_fogo');
  if (rId === 'hobgoblin') addProf('armas_marciais');
  if (rId === 'anao') {
    ['machado_de_batalha', 'machado_de_guerra', 'machado_anao', 'machado_taurico', 'martelo_de_guerra', 'marreta', 'picareta'].forEach(addProf);
  }
  if (rId === 'elfo_do_mar') {
    ['arpao', 'rede', 'tridente'].forEach(addProf);
  }
  if(classId===state.identity.classId&&suraggelHeritage()==='heranca_de_werra'){
    if(state.identity.raceChoices.suraggel_werra_proficiencia==='armas_marciais') addProf('armas_marciais');
    if(state.identity.raceChoices.suraggel_werra_proficiencia==='duas_armas_exoticas') addProf('armas_exoticas');
  }
  const std = typeof selectedStandardOrigin === 'function' ? selectedStandardOrigin() : null;
  const reg = typeof selectedRegionalOrigin === 'function' ? selectedRegionalOrigin() : null;
  const isUbaneri = std?.nome === 'Andarilho Ubaneri' || reg?.nome === 'Andarilho Ubaneri' || state.origin?.regional === 'Andarilho Ubaneri' || state.origin?.standard === 'Andarilho Ubaneri' || state.origin?.regional === 'andarilho_ubaneri';
  if(isUbaneri) addProf('escudos');
  const isDesertor = std?.nome === 'Desertor da Supremacia' || reg?.nome === 'Desertor da Supremacia' || state.origin?.standard === 'desertor_da_supremacia' || state.origin?.regional === 'desertor_da_supremacia' || state.origin?.regional === 'Desertor da Supremacia';
  if(isDesertor){
    values.push('escudos');
    values.push('espada_bastarda');
    addProf('escudos');
    addProf('espada_bastarda');
    addProf('armas_exoticas:espada_bastarda');
  }
  const isGuardiaoGlacial = std?.nome === 'Guardião Glacial' || reg?.nome === 'Guardião Glacial' || state.origin?.standard === 'guardiao_glacial' || state.origin?.regional === 'guardiao_glacial';
  if(isGuardiaoGlacial){
    addProf('arco_longo');
    addProf('machado_de_batalha');
  }
  const isLegionario = std?.nome === 'Legionário' || reg?.nome === 'Legionário' || state.origin?.standard === 'legionario' || state.origin?.regional === 'legionario';
  if(isLegionario){
    addProf('gladio');
    addProf('armas_exoticas:gladio');
    addProf('escudos');
  }
  const isLenhadorTollon = std?.nome === 'Lenhador de Tollon' || reg?.nome === 'Lenhador de Tollon' || state.origin?.standard === 'lenhador_de_tollon' || state.origin?.regional === 'lenhador_de_tollon';
  if(isLenhadorTollon){
    addProf('machadinha');
    addProf('machado_de_batalha');
  }
  const isNitamuraniano = std?.nome === 'Nitamuraniano' || reg?.nome === 'Nitamuraniano' || state.origin?.standard === 'nitamuraniano' || state.origin?.regional === 'nitamuraniano';
  if(isNitamuraniano){
    addProf('katana');
    addProf('armas_exoticas:katana');
    addProf('arco_longo');
  }
  const isProcurado = std?.nome === 'Procurado: Vivo ou Morto' || reg?.nome === 'Procurado: Vivo ou Morto' || state.origin?.standard === 'procurado_vivo_ou_morto' || state.origin?.regional === 'procurado_vivo_ou_morto';
  if(isProcurado){
    addProf('armas_de_fogo');
  }
  // Proficiências do poder geral "Proficiência"
  if (state?.powers?.general) {
    state.powers.general.forEach((pId, idx) => {
      if (pId === 'proficiencia' || pId === 'geral:proficiencia') {
        addProf(state.powers.generalChoices?.[idx]);
      }
      if (pId === 'tradicao_de_ayrelynn' || pId === 'geral:tradicao_de_ayrelynn') {
        addProf('armas_de_fogo');
      }
    });
  }
  if (state?.powers?.originGeneral) {
    Object.entries(state.powers.originGeneral).forEach(([bId, pId]) => {
      if (pId === 'proficiencia' || pId === 'geral:proficiencia') {
        addProf(state.powers.originGeneralChoices?.[bId]);
      }
      if (pId === 'tradicao_de_ayrelynn' || pId === 'geral:tradicao_de_ayrelynn') {
        addProf('armas_de_fogo');
      }
    });
  }
  const originHasDirectProf = (state?.origin?.benefits || []).some(id => id === 'power:proficiencia' || id.endsWith(':proficiencia') || id === 'proficiencia');
  if (originHasDirectProf) {
    addProf(state.origin?.proficiencyChoice || state.powers?.originGeneralChoices?.['power:proficiencia']);
  }
  const checkPowerProficiencyGrant = (powerId?: string, choice?: string) => {
    const pid = String(powerId || '');
    if (!pid) return;
    if ((pid === 'proficiencia' || pid === 'geral:proficiencia') && choice) {
      addProf(choice);
    }
    if (pid === 'inventor_couraceiro' || pid === 'couraceiro' || pid.endsWith(':couraceiro')) {
      addProf('armaduras_pesadas');
      addProf('escudos');
    }
    if (pid === 'inventor_armeiro' || pid === 'armeiro' || pid.endsWith(':armeiro')) {
      addProf('armas_marciais');
    }
    if (pid === 'inventor_balistica' || pid === 'balistica' || pid.endsWith(':balistica')) {
      addProf('armas_marciais');
      addProf('armas_de_fogo');
    }
    if (pid === 'bucaneiro_pistoleiro' || pid === 'pistoleiro' || pid.endsWith(':pistoleiro') || pid === 'tradicao_de_ayrelynn' || pid === 'geral:tradicao_de_ayrelynn' || pid.includes('pistoleiro_de_smokestone')) {
      addProf('armas_de_fogo');
    }
    if (pid === 'samurai_daisho' || pid === 'daisho' || pid.endsWith(':daisho')) {
      addProf('wakizashi');
      addProf('armas_exoticas:wakizashi');
    }
    if (pid.includes('conjurador_encouracado')) {
      addProf('armaduras_pesadas');
    }
    if (pid.includes('arsenal_arcano')) {
      addProf('armas_marciais');
    }
  };
  if (state?.powers?.cosmopolitaPower) {
    checkPowerProficiencyGrant(state.powers.cosmopolitaPower, state.progression?.[0]?.powerChoice);
  }
  if (state?.powers?.futuraLendaClassPower) {
    checkPowerProficiencyGrant(state.powers.futuraLendaClassPower, '');
  }
  if (Array.isArray(state?.progression)) {
    state.progression.forEach(row => {
      checkPowerProficiencyGrant(row?.powerId, row?.powerChoice);
    });
  }
  return [...new Set(values)];
}
const SURAGGEL_SKILL_OPTIONS=SKILLS.map(([id,nome])=>({id,nome}));
const SURAGGEL_HERITAGE_CHOICES={
  heranca_de_al_gazara:[{id:'suraggel_al_gazara_atributo',nome:'Atributo aleatório',descricao:'Sorteie o atributo que recebe +1.',opcoes:ATTRS.map(([id,nome])=>({id,nome}))}],
  heranca_de_arboria:[{id:'suraggel_arboria_forma',nome:'Forma Selvagem',opcoes:['Ágil','Sorrateira','Veloz'].map(nome=>({id:slug(nome),nome}))}],
  heranca_de_chacina:[{id:'suraggel_chacina_forma',nome:'Forma Selvagem',opcoes:['Feroz','Resistente'].map(nome=>({id:slug(nome),nome}))}],
  heranca_de_magika:[{id:'suraggel_magika_atributo',nome:'Atributo-chave da magia',opcoes:[{id:'int',nome:'Inteligência'},{id:'car',nome:'Carisma'}]}],
  heranca_de_nivenciuen:[{id:'suraggel_nivenciuen_habilidade',nome:'Habilidade élfica',opcoes:['Graça de Glórienn','Sangue Mágico'].map(nome=>({id:slug(nome),nome}))}],
  heranca_de_werra:[{id:'suraggel_werra_proficiencia',nome:'Proficiência',opcoes:[{id:'armas_marciais',nome:'Armas marciais'},{id:'duas_armas_exoticas',nome:'Duas armas exóticas'}]}],
  heranca_de_deathok:[1,2].map(n=>({id:'suraggel_deathok_pericia_'+n,nome:'Perícia '+n,opcoes:SURAGGEL_SKILL_OPTIONS})),
  heranca_de_pelagia:[1,2,3].map(n=>({id:'suraggel_pelagia_pericia_'+n,nome:'Perícia '+n,opcoes:SURAGGEL_SKILL_OPTIONS})),
  heranca_de_ramknal:[1,2].map(n=>({id:'suraggel_ramknal_pericia_'+n,nome:'Perícia '+n,opcoes:SURAGGEL_SKILL_OPTIONS.filter(option=>['acrobacia','enganacao','furtividade','jogatina','ladinagem'].includes(option.id))}))
};
const supplementalRaceChoicesBeforeSuraggel=supplementalRaceChoiceDefinitions;
supplementalRaceChoiceDefinitions=function(){return [...supplementalRaceChoicesBeforeSuraggel(),...(SURAGGEL_HERITAGE_CHOICES[suraggelHeritage()]||[])]};
const renderChoiceBeforeSuraggel=renderChoice;
renderChoice=function(def,source='race'){
  if(source!=='race'||def.id!=='suraggel_heranca_substituta')return renderChoiceBeforeSuraggel(def,source);
  const lineageDef=raceById('suraggel')?.habilidades?.selecionadas?.find(choice=>choice.id==='suraggel_linhagem'),lineage=selectedRaceOption(lineageDef||{});
  if(!lineage)return '<div class="info-box">Escolha primeiro entre Aggelus e Sulfure para visualizar sua herança original.</div>';
  if(state.identity.suraggelChangingHeritage)return renderChoiceBeforeSuraggel(def,source);
  const heritage=suraggelHeritageOption(),original=suraggelHeritage()==='suraggel_heranca_original',ability=original?lineage.habilidades?.[0]:null;
  return '<div class="choice-section suraggel-heritage-summary"><h4>Herança</h4><div class="ability-list">'+abilityHtml(ability||{nome:choiceName(heritage),descricao:heritage?.descricao||''})+'</div><button class="button" type="button" data-action="change-suraggel-heritage">Mudar herança</button></div>';
};
const activeSpellTraitsBeforeSuraggel=activeSpellTraits;
activeSpellTraits=function(){const traits=activeSpellTraitsBeforeSuraggel();if(state.identity.raceId!=='suraggel'||suraggelHeritage()==='suraggel_heranca_original')return traits;return traits.filter(trait=>!['suraggel_luz_sagrada','suraggel_sombras_profanas'].includes(trait.id))};
function duplicateSuraggelChoice(){
  const definitions=SURAGGEL_HERITAGE_CHOICES[suraggelHeritage()]||[],skillDefinitions=definitions.filter(def=>def.id.includes('_pericia_')),values=skillDefinitions.map(def=>state.identity.raceChoices[def.id]).filter(Boolean);
  return values.find((value,index)=>values.indexOf(value)!==index)||'';
}
const allTrainedSkillsBeforeSuraggel=allTrainedSkills;
allTrainedSkills=function(){
  const list=allTrainedSkillsBeforeSuraggel();
  if(state.identity.raceId!=='suraggel')return list;
  const heritage=suraggelHeritage();
  const defs=SURAGGEL_HERITAGE_CHOICES[heritage]||[];
  const extraSkills=defs.filter(def=>def.id.includes('_pericia_')).map(def=>state.identity.raceChoices[def.id]).filter(Boolean);
  return [...new Set([...list,...extraSkills])];
};
const selectedCharacterFeaturesBeforeSuraggel=selectedCharacterFeatures;
selectedCharacterFeatures=function(){
  let features=selectedCharacterFeaturesBeforeSuraggel();
  if(state.identity.raceId!=='suraggel')return features;
  const lineageDef=raceById('suraggel')?.habilidades?.selecionadas?.find(choice=>choice.id==='suraggel_linhagem');
  const lineage=selectedRaceOption(lineageDef||{});
  const nativeAbility=lineage?.habilidades?.[0];
  const isOriginal=suraggelHeritage()==='suraggel_heranca_original';
  if(isOriginal&&nativeAbility){
    if(!features.some(f=>f.id===nativeAbility.id||f.nome===nativeAbility.nome)){
      features.push({...nativeAbility,source:'race'});
    }
  }else if(!isOriginal){
    features=features.filter(f=>f.id!==nativeAbility?.id&&f.nome!==nativeAbility?.nome&&!['suraggel_luz_sagrada','suraggel_sombras_profanas'].includes(f.id));
  }
  return features;
};
const AL_GAZARA_NOTE='Herança de Al-Gazara: Role 1d6 com o mestre para determinar qual atributo recebe +1 (1: Força, 2: Destreza, 3: Constituição, 4: Inteligência, 5: Sabedoria, 6: Carisma).';
function syncAlGazaraNote(){
  state.sheetNotes??={};
  let notes=(state.sheetNotes.notes||'').trim();
  const isAlGazara=state.identity.raceId==='suraggel'&&suraggelHeritage()==='heranca_de_al_gazara';
  if(isAlGazara){
    if(!notes.includes(AL_GAZARA_NOTE)){
      state.sheetNotes.notes=notes?notes+'\n'+AL_GAZARA_NOTE:AL_GAZARA_NOTE;
    }
  }else{
    if(notes.includes(AL_GAZARA_NOTE)){
      state.sheetNotes.notes=notes.split('\n').filter(line=>line.trim()!==AL_GAZARA_NOTE).join('\n').trim();
    }
  }
}
const characterNotesTextBeforeSuraggel=characterNotesText;
characterNotesText=function(){
  syncAlGazaraNote();
  return characterNotesTextBeforeSuraggel();
};
const raceSelectionsCompleteBeforeSuraggel=raceSelectionsComplete;
raceSelectionsComplete=function(){return raceSelectionsCompleteBeforeSuraggel()&&!duplicateSuraggelChoice()};
const raceMissingChoicesBeforeSuraggel=raceMissingChoices;
raceMissingChoices=function(){const missing=raceMissingChoicesBeforeSuraggel(),duplicate=duplicateSuraggelChoice();if(duplicate)missing.push({title:'Perícias da herança',message:'Escolha perícias diferentes para esta herança.',selector:'[data-action="race-choice"][value="'+duplicate+'"]'});return missing};
const finalAttrsBeforeSuraggel=finalAttrs;
finalAttrs=function(){const values=finalAttrsBeforeSuraggel();if(suraggelHeritage()==='heranca_de_al_gazara'){const attr=state.identity.raceChoices.suraggel_al_gazara_atributo;if(values[attr]!==undefined)values[attr]++}return values};


const spellPlanBeforeSuraggel=spellPlan;
spellPlan=function(){const plan=spellPlanBeforeSuraggel();if(suraggelHeritage()==='heranca_de_magika'&&!plan.groups.some(group=>group.id==='race:suraggel_magika'))plan.groups.push({id:'race:suraggel_magika',label:'Herança de Magika',description:'Escolha uma magia arcana de 1º círculo. Se aprendê-la novamente, seu custo diminui em 1 PM.',count:1,maxCircle:1,type:'arcana',schools:[],fixed:[],allowed:[],scope:'race:suraggel_magika',kind:'race',keyAttribute:state.identity.raceChoices.suraggel_magika_atributo||'int'});return plan};
const raceAbilityTextBeforeSuraggel=raceAbilityText;
raceAbilityText=function(){const parts=[raceAbilityTextBeforeSuraggel()],option=suraggelHeritageOption();if(option)parts.push(choiceName(option),option.descricao);for(const definition of SURAGGEL_HERITAGE_CHOICES[suraggelHeritage()]||[]){const chosen=chosenRaceTraitOption(definition);if(chosen)parts.push(definition.nome,choiceName(chosen),chosen.descricao)}return parts.filter(Boolean).join(' ')};
document.addEventListener('change',event=>{
  if(event.target.dataset.field==='raceId'){syncAlGazaraNote();return}
  if(event.target.dataset.action!=='race-choice')return;
  if(event.target.dataset.choiceId==='suraggel_heranca_substituta'){
    Object.keys(state.identity.raceChoices).filter(key=>key.startsWith('suraggel_')&&!['suraggel_linhagem','suraggel_heranca_substituta'].includes(key)).forEach(key=>delete state.identity.raceChoices[key]);
    Object.keys(spellState().selections).filter(key=>key==='race:suraggel_magika').forEach(key=>delete spellState().selections[key]);
    if(event.target.value==='heranca_de_al_gazara')state.identity.raceChoices.suraggel_al_gazara_atributo=ATTRS[Math.floor(Math.random()*ATTRS.length)][0];
    state.identity.suraggelChangingHeritage=false;
    syncAlGazaraNote();
  }else if(event.target.dataset.choiceId==='suraggel_linhagem'){
    state.identity.raceChoices.suraggel_heranca_substituta='suraggel_heranca_original';
    state.identity.suraggelChangingHeritage=false;
    syncAlGazaraNote();
  }
},true);
document.addEventListener('click',event=>{if(!event.target.closest?.('[data-action="change-suraggel-heritage"]'))return;state.identity.suraggelChangingHeritage=true;renderStage()},true);
