
function renderSpellChoices(part='all'){
  const plan=spellPlan(),saved=spellState();
  const fixedGroups=plan.groups.filter(g=>g.fixed&&g.fixed.length>0);
  const allFixedSpells=[...new Set(fixedGroups.flatMap(g=>g.fixed))];
  const consolidatedFixed=allFixedSpells.length?{id:'fixed:all',label:'Recebidas',fixed:allFixedSpells,count:0,kind:'fixed',scope:'fixed:all'}:null;
  const choiceGroups=plan.groups.filter(g=>(!g.fixed||g.fixed.length===0)&&g.kind!=='consult'&&g.kind!=='reference');
  const availableGroups=choiceGroups.length?choiceGroups:plan.groups.filter(g=>g.kind!=='reference');
  const stepperGroups=(consolidatedFixed?[consolidatedFixed,...availableGroups]:availableGroups).sort((a,b)=>groupOrderScore(a)-groupOrderScore(b));

  if(!stepperGroups.some(g=>g.id===saved.activeGroup)){
    saved.activeGroup=stepperGroups.find(g=>g.count)?.id||stepperGroups[0]?.id||plan.groups[0]?.id||'';
  }

  const schoolCls=plan.classes.find(c=>c.schoolCount>0)||plan.classes[0];
  let schoolsHtml='';
  if(schoolCls&&schoolCls.schoolCount){
    const curCount=schoolCls.chosenSchools.length;
    const maxCount=schoolCls.schoolCount;
    const isPending=curCount<maxCount;
    const actionAttr='data-action="school-open" data-class-id="'+esc(schoolCls.classId)+'"';
    const pendingBtn=isPending?'<button type="button" class="button small" '+actionAttr+' style="margin-left:8px;padding:2px 8px;font-size:0.75rem;background:#991b1b;border:1px solid #dc2626;color:#ffffff;border-radius:4px;cursor:pointer;font-weight:700;">+ Escolher '+(maxCount-curCount)+' escola'+(maxCount-curCount>1?'s':'')+'</button>':'';
    schoolsHtml='<div class="spell-schools-progress-block" style="cursor:pointer;" '+actionAttr+' title="Clique para gerenciar suas escolas de magia"><span>'+esc(schoolCls.name)+' · escolas '+curCount+'/'+maxCount+'</span>'+schoolCls.chosenSchools.map(id=>'<span class="school-pill-tag">'+esc((SPELL_SCHOOLS[id]||id).toUpperCase())+'</span>').join('')+pendingBtn+'</div>';
  }

  const activeGroup=stepperGroups.find(g=>g.id===saved.activeGroup)||stepperGroups[0];

  const totalCount=stepperGroups.filter(g=>g.kind!=='consult'&&g.kind!=='reference').reduce((s,g)=>s+g.count+g.fixed.length,0);
  const totalFilled=stepperGroups.filter(g=>g.kind!=='consult'&&g.kind!=='reference').reduce((s,g)=>s+(g.fixed.length||groupSpellIds(g).length),0);
  const progressPct=totalCount?Math.min(100,Math.round((totalFilled/totalCount)*100)):100;

  const stepsHtml=stepperGroups.map((group,idx)=>{
    const ids=groupSpellIds(group),fixed=Boolean(group.fixed?.length>0);
    const isCompleted=fixed||(group.count>0&&ids.length===group.count);
    const isActive=saved.activeGroup===group.id;
    const badgeText=fixed?'Recebida':group.kind==='consult'?'Consulta':ids.length+'/'+group.count;
    return '<button type="button" class="spell-stepper-step '+(isActive?'active ':'')+(isCompleted?'completed':'')+'" data-action="spell-source" data-group="'+group.id+'" data-spell-group="'+group.id+'" aria-pressed="'+isActive+'" title="'+esc(group.label)+'"><span class="step-indicator">'+(isCompleted?'':(idx+1))+'</span><span class="step-label">'+esc(shortSpellGroupLabel(group))+'</span><span class="step-badge">'+badgeText+'</span></button>';
  }).join('');

  const skippedCircles=Object.keys(saved.teurgistSkipped||{}).filter(c=>saved.teurgistSkipped[c]&&!plan.groups.some(g=>g.teurgist&&g.exactCircle===Number(c)&&groupSpellIds(g).length===g.count));
  const retroBtns=skippedCircles.map(c=>'<button type="button" class="button-retro-teurgist" data-action="teurgist-retro" data-circle="'+c+'">Teurgista Místico · Retroagir ('+c+'º Círculo)</button>').join('');

  const activeBar=activeGroup&&activeGroup.teurgist?'<div class="spell-stepper-active-bar"><div class="active-step-meta"><strong>'+esc(activeGroup.label)+'</strong><span>'+(activeGroup.type==='arcana'?'Arcanas':activeGroup.type==='divina'?'Divinas':'Arcanas ou Divinas')+' · '+(activeGroup.exactCircle?'somente '+activeGroup.exactCircle+'º círculo':'até '+activeGroup.maxCircle+'º círculo')+'</span></div><div class="active-step-actions">'+retroBtns+'</div></div>':'';

  const counterHtml='<span class="spell-progress-counter-gold">'+totalFilled+' / '+totalCount+' magias ('+progressPct+'%)</span>';

  const topRowHtml='<div class="spell-compact-topbar"><div class="spell-progress-block"><span class="spell-progress-label">Progresso de Escolha de Magias</span><div class="spell-progress-bar-track"><div class="spell-progress-bar-fill" style="width:'+progressPct+'%"></div></div></div>'+schoolsHtml+counterHtml+'<div id="spellControls" class="spell-tabs-block" style="display:none">'+renderSpellControls()+'</div></div>';

  const stepperHtml='<div class="spell-stepper-container">'+topRowHtml+'<nav class="spell-stepper-track" aria-label="Etapas de magias">'+stepsHtml+'</nav>'+activeBar+'</div>';

  const mageCount=plan.groups.filter(group=>group.classId==='arcanista'&&group.path==='mago').reduce((sum,group)=>sum+group.count+group.fixed.length,0);
  const memory=plan.classes.some(cls=>cls.path==='mago')?'<p class="spell-memory-reminder help">Você memoriza e pode lançar '+Math.floor(mageCount/2)+' magias dentre as conhecidas.</p>':'';
  const extras=memory+(plan.notes.length?'<details class="spell-stepper-rules"><summary>▶ Outras regras de magia ('+plan.notes.length+')</summary><div class="spell-rules-content">'+plan.notes.map(note=>abilityHtml({nome:note.label||'Escolha pendente',descricao:note.description})).join('')+'</div></details>':'');

  return part==='sources'?stepperHtml:part==='extras'?extras:stepperHtml+extras;
}
const SPELL_BOOK_IDS=[...new Set(DATA.spells.flatMap(spell=>spell.books||['basico']))];
const spellCatalogUI={books:new Set(SPELL_BOOK_IDS),section:'magias',schoolReview:null};
function spellCatalogTitle(){
  if(spellCatalogUI.schoolReview)return spellCatalogUI.schoolReview.candidate?'Escolha a magia a substituir':'Consulte as escolas restantes';
  if(spellCatalogUI.section==='condicoes')return 'Condições';
  if(spellState().view==='learned')return hasNonClassSpellSource()?'Você pode lançar:':'Magias do personagem';
  const total=spellPlan().groups.filter(group=>group.kind!=='reference').reduce((sum,group)=>sum+group.count,0);
  return total?'Escolha '+total+(total===1?' magia':' magias'):'Consultar magias';
}
function renderSpellControls(){
  return '<button type="button" data-action="spell-section" data-section="magias" class="spell-pill-tab '+(spellCatalogUI.section==='magias'?'active':'')+'" aria-pressed="'+(spellCatalogUI.section==='magias')+'">MAGIAS</button><button type="button" data-action="spell-section" data-section="condicoes" class="spell-pill-tab '+(spellCatalogUI.section==='condicoes'?'active':'')+'" aria-pressed="'+(spellCatalogUI.section==='condicoes')+'">CONDIÇÕES</button>';
}
function renderSpells(){
  const planned=Number(state.identity.plannedLevel)||1;
  const titleText=planned>1?'MAGIAS · NÍVEL '+planned:'MAGIAS INICIAIS · NÍVEL 1';
  return '<section class="panel spell-top-panel"><button type="button" class="spell-options-toggle" id="spellOptionsToggle" aria-expanded="false" aria-controls="spellOptionsContent">Fontes e opções de magia ▾</button><div class="panel-header"><h3 class="panel-title">'+esc(titleText)+'</h3></div><div class="panel-body" id="spellOptionsContent"><div class="spell-topbar"><div id="spellChoices">'+renderSpellChoices('sources')+'</div></div><div id="spellExtraChoices" class="spell-extra-choices">'+renderSpellChoices('extras')+'</div></div></section><section class="panel spell-catalog-panel"><div class="panel-header"><h3 class="panel-title" id="spellCatalogTitle" aria-live="polite">'+esc(spellCatalogTitle())+'</h3></div><div class="panel-body"><p class="spell-frame-status" id="spellFrameStatus" role="status">Carregando o Grimório…</p><iframe id="spellGrimoire" class="spell-grimoire" title="Grimório de magias do personagem" sandbox="allow-scripts"></iframe></div></section>';
}
let grimoireSession=0,grimoireReady=false;
function mountGrimoire(){
  const frame=document.getElementById('spellGrimoire');if(!frame)return;
  grimoireSession++;grimoireReady=false;
  Forja.mount(frame,'grimorio.html',{session:grimoireSession});
  setTimeout(()=>{if((state.step===7||state.sheetView==='grimoire')&&!grimoireReady){const status=document.getElementById('spellFrameStatus');if(status)status.textContent='Não foi possível carregar o catálogo de magias.'}},3000);
  if(state.step===7){
    const scrollTarget=()=>{
      const target=document.querySelector('.spell-catalog-panel')||frame;
      target?.scrollIntoView?.({behavior:'smooth',block:'start'});
    };
    if(typeof requestAnimationFrame==='function')requestAnimationFrame(scrollTarget);
    else setTimeout(scrollTarget,16);
  }
}
function characterHasWynllaGift(){
  if(typeof characterHasFeature==='function'&&characterHasFeature('presente_de_wynlla'))return true;
  if((state.origin?.benefits||[]).some(b=>b==='power:presente_de_wynlla'||(typeof b==='string'&&b.includes('presente_de_wynlla'))))return true;
  if((state.progression||[]).some(r=>r.powerId==='power:presente_de_wynlla'||r.powerId==='presente_de_wynlla'||(typeof r.powerId==='string'&&r.powerId.includes('presente_de_wynlla'))))return true;
  const powers=typeof selectedCharacterFeatures==='function'?selectedCharacterFeatures():[];
  return powers.some(p=>p.id==='presente_de_wynlla'||slug(p.id||'').includes('presente_de_wynlla')||slug(p.nome||'').includes('presente_de_wynlla'));
}
function characterWynllaSpells(){
  if(!characterHasWynllaGift())return [];
  const chosen=state.powers?.wynllaSpell||state.identity?.powerChoices?.presente_de_wynlla;
  if(chosen)return [chosen];
  const learned=typeof allLearnedSpellIds==='function'?allLearnedSpellIds():[];
  return learned.filter(id=>{
    const sp=spellById(id);
    return sp && sp.circle===1 && (sp.type==='arcana'||sp.type==='universal');
  });
}
function isSpellWynllaEnhanced(id){
  return characterWynllaSpells().includes(id);
}
function grimoireContext(){
  const plan=spellPlan(),saved=spellState();
  let group=plan.groups.find(group=>group.id===saved.activeGroup);
  if(!group){
    const inc=plan.groups.find(g=>g.count&&groupSpellIds(g).length<g.count);
    if(inc){group=inc;saved.activeGroup=inc.id;saved.view='available'}
    else group=plan.groups[0];
  }
  if(!group && saved.activeGroup==='fixed:all'){
    const fixedGroups=plan.groups.filter(g=>g.fixed&&g.fixed.length>0);
    group={id:'fixed:all',label:'Recebidas',fixed:[...new Set(fixedGroups.flatMap(g=>g.fixed))],count:0,kind:'fixed',scope:'fixed:all'};
  }
  const chosen=group?groupSpellIds(group):[],learned=allLearnedSpellIds(plan),available=group?.fixed.length?group.fixed:group?DATA.spells.filter(spell=>basicSpellAllowed(spell,group,plan)).map(spell=>spell.id):DATA.spells.filter(spell=>spell.circle===1).map(spell=>spell.id);
  const cls=plan.classes.find(cls=>cls.classId===group?.classId),visible=saved.view==='learned'?learned:available,metadata=visible.map(spellById).filter(Boolean);
  const conjuringClasses = plan.classes;
  const isBlessedSorcerer = conjuringClasses.some(c => c.classId === 'arcanista' && c.lineage === 'linhagem_abencoada');
  const hasDivineClass = conjuringClasses.some(c => ['clerigo', 'frade', 'druida', 'ermitao', 'santo'].includes(c.classId));
  const hasArcaneClass = conjuringClasses.some(c => ['bardo', 'arcanista'].includes(c.classId));
  let classTraditions = ['arcana'];
  if (isBlessedSorcerer || (hasDivineClass && hasArcaneClass)) {
    classTraditions = ['arcana', 'divina'];
  } else if (hasDivineClass) {
    classTraditions = ['divina'];
  } else if (hasArcaneClass) {
    classTraditions = ['arcana'];
  } else if (group?.type && group.type !== 'any') {
    classTraditions = [group.type];
  }
  let traditions = [...classTraditions];
  if (group?.type === 'any' || group?.id === 'power:centelha_magica' || group?.id === 'power:grande_marca_de_wynna') {
    traditions = ['arcana', 'divina'];
  } else if (group?.teurgist && group.type) {
    traditions = [group.type];
  } else if (group?.exclusiveType && group.type) {
    traditions = [group.type];
  } else if (group?.kind === 'class') {
    if (group.lineage === 'linhagem_abencoada') {
      traditions = ['arcana', 'divina'];
    } else if (['clerigo', 'frade', 'druida', 'ermitao', 'santo'].includes(group.classId)) {
      traditions = ['divina'];
    } else {
      traditions = ['arcana'];
    }
  }
  const classSchools=cls?.schools||[];
  const learnedSpellSchools=learned.map(id=>spellById(id)?.school).filter(Boolean);
  const allKnownSchools=[...new Set([...classSchools,...learnedSpellSchools])];
  const totalSchoolLimit=cls?cls.schoolCount+cls.fixedSchools.length:0;
  const schoolsFull=Boolean(cls&&cls.schoolCount>0&&classSchools.length>=totalSchoolLimit);
  const relearnedSpells={};
  for(const id of learned){
    const times=spellRelearnedTimes(id,plan);
    if(times>0)relearnedSpells[id]=times;
  }
  const fixedGroups=plan.groups.filter(g=>g.fixed&&g.fixed.length>0);
  const fixedSpells=[...new Set(fixedGroups.flatMap(g=>g.fixed.map(spellKey)))];
  const selectable=group&&chosen.length<group.count?available.filter(id=>!spellSelectionReason(id,group,plan,true)):[];
  const repeatable=selectable.filter(id=>learned.includes(id)&&!chosen.includes(id));
  const removable=Object.fromEntries(chosen.filter(id=>{
    if(!state.isLevelingUp) return true;
    const beforeSpells = state.levelUpBefore?.spells?.selections?.[group?.id] || [];
    return !beforeSpells.includes(id);
  }).map(id=>[id,group?.id||'']));
  const repeatNotes=Object.fromEntries(repeatable.map(id=>[id,'Você já conhece esta magia. Aprendê-la novamente por este patamar reduz seu custo em –1 PM.']));
  const stageLabel = group ? (typeof shortSpellGroupLabel === 'function' ? shortSpellGroupLabel(group) : (group.label || '')) : '';
  const traditionNotice = (group && group.count > 0) ? {
    type: group.type && group.type !== 'any' ? group.type : (traditions.length === 1 ? traditions[0] : (group.type || 'universal')),
    count: group.count,
    circle: group.exactCircle || group.maxCircle || 1,
    chosen: chosen.length,
    label: group.label || '',
    stageLabel: stageLabel || group.label || ''
  } : null;
  return {channel:'forja-t20-grimoire-v1',type:'context',session:grimoireSession,group:group?.id||'',label:group?.label||'Consulta',view:saved.view,section:spellCatalogUI.section,books:[...spellCatalogUI.books],visible,chosen:group?.fixed.length?[]:chosen,learned,relearnedSpells,fixedSpells,repeatable,repeatNotes,removable,wynllaSpells:characterWynllaSpells(),selectable,canChoose:Boolean(group?.count),traditionNotice,classId:cls?.classId||'',schools:classSchools,classSchools,allKnownSchools,fixedSchools:cls?.fixedSchools||[],schoolCount:totalSchoolLimit,schoolLimit:totalSchoolLimit,schoolChoiceCount:cls?.schoolCount||0,schoolsFull,schoolChoicesComplete:cls?classSpellChoicesFilled(cls.classId,plan):false,availableSchools:[...new Set(metadata.map(spell=>spell.school))],circles:[...new Set(metadata.map(spell=>spell.circle))],traditions};
}
function syncGrimoire(){
  const frame=document.getElementById('spellGrimoire');if(!frame?.contentWindow)return;
  const context=grimoireContext();frame.contentWindow.postMessage(context,'*');
}
function refreshSpellStage(){
  if(resumeProgressionAfterSpells())return;
  document.getElementById('spellChoices').innerHTML=renderSpellChoices('sources');
  document.getElementById('spellExtraChoices').innerHTML=renderSpellChoices('extras');
  syncSpellControls();
  document.getElementById('footerMessage').textContent=validationMessage(7,true);
  renderNav();persist();syncGrimoire();
  if(typeof syncNextButtonState==='function')syncNextButtonState();
  syncTeurgistFooterButton();
  if(typeof pendingSchoolClass==='function'&&typeof openSchoolDialog==='function'){
    const pending=pendingSchoolClass();
    if(pending){
      const modal=document.getElementById('spellSchoolModal');
      if(modal&&modal.hidden){
        setTimeout(()=>{
          const p=pendingSchoolClass();
          if(p)openSchoolDialog(p.classId,'choose');
        },150);
      }
    }
  }
}
function resumeProgressionAfterSpells(){
  if(state.step!==7||!spellState().returnToProgression||spellMissingChoices().length)return false;
  const next=nextUnresolvedProgressionIndex(-1);
  if(next<0)return false;
  delete spellState().returnToProgression;
  if(!state.completed.includes(7))state.completed.push(7);
  setProgressionEditingIndex(next);
  state.step=10;
  renderStage();
  window.scrollTo?.({top:0,behavior:'smooth'});
  return true;
}
function syncTeurgistFooterButton(){
  const button=document.getElementById('teurgistSkipButton');
  if(!button)return;
  const saved=spellState(),activeGroup=spellPlan().groups.find(group=>group.id===saved.activeGroup);
  const available=state.step===7&&Boolean(activeGroup?.teurgist||activeGroup?.teurgistConverted);
  button.hidden=!available;
  if(!available){delete button.dataset.circle;delete button.dataset.level;return}
  button.dataset.action='teurgist-toggle';
  button.dataset.circle=String(activeGroup.teurgistCircle||activeGroup.exactCircle||activeGroup.maxCircle||1);
  button.dataset.level=String(activeGroup.teurgistLevel||1);
  button.textContent=activeGroup.type==='divina'?'Escolher Arcana':'Escolher Divina';
  button.title=activeGroup.teurgist?'Usar este slot para uma magia da tradição da classe. A oportunidade do Teurgista continuará disponível em um nível futuro.':'Voltar a usar neste slot a magia da outra tradição concedida pelo Teurgista.';
}
function syncSpellControls(){
  const reload=document.querySelector('[data-action="spell-reload"]');
  if(reload&&!document.querySelector('[data-action="spell-redo"]')&&!state.isLevelingUp)reload.insertAdjacentHTML('beforebegin','<button class="button danger" data-action="spell-redo" type="button">Refazer escolhas</button>');
  document.querySelectorAll('[data-action="spell-view"], [data-action="spell-book"], [data-action="spell-section"]').forEach(button=>{
    const action=button.dataset.action,active=action==='spell-view'?button.dataset.view===spellState().view:action==='spell-book'?spellCatalogUI.books.has(button.dataset.book):button.dataset.section===spellCatalogUI.section;
    button.classList.toggle(action==='spell-view'?'primary':'active',active);button.setAttribute('aria-pressed',String(active));
  });
  document.getElementById('spellCatalogTitle').textContent=spellCatalogTitle();
}
function toggleSpellBook(id){if(!SPELL_BOOK_IDS.includes(id))return false;if(spellCatalogUI.books.has(id))spellCatalogUI.books.delete(id);else spellCatalogUI.books.add(id);return true}
window.addEventListener('message',async event=>{
  const frame=document.getElementById('spellGrimoire'),message=event.data;
  if((state.step!==7&&state.sheetView!=='grimoire')||!frame?.contentWindow||event.source!==frame.contentWindow||message?.channel!=='forja-t20-grimoire-v1')return;
  if(message.type==='open-conditions'){
    (window as any).ForjaCondicoes?.abrirModal?.();
    return;
  }
  if(message.type==='section'){
    spellCatalogUI.section=message.section;
    document.getElementById('spellCatalogTitle').textContent=spellCatalogTitle();
    return;
  }
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
    else frame.contentWindow.postMessage({channel:'forja-t20-grimoire-v1',type:'scroll-items',session:grimoireSession,group:spellState().activeGroup,delta},'*');
    return;
  }
  if(message.type==='ready'){grimoireReady=true;document.getElementById('spellFrameStatus').hidden=true;syncGrimoire();return}
  if(message.session!==grimoireSession||message.group!==spellState().activeGroup)return;
  if(message.type==='learned-view'){
    const saved=spellState();
    saved.view=saved.view==='learned'?'available':'learned';
    refreshSpellStage();
    return;
  }
  if(message.type==='view-change'){
    const saved=spellState();
    saved.view=message.view||'available';
    refreshSpellStage();
    return;
  }
  if(handleSchoolBridgeMessage(message)){syncGrimoire();return}
  if(message.type==='school'){
    const group=spellPlan().groups.find(group=>group.id===message.group);
    if(group?.classId&&chooseSpellSchool(group.classId,message.id))refreshSpellStage();else syncGrimoire();return;
  }
  if(message.type!=='choose'||typeof message.id!=='string')return;
  const plan=spellPlan(),group=plan.groups.find(g=>g.id===message.group);
  const spell=spellById(message.id);
  const alreadyInGroup=group&&groupSpellIds(group).includes(message.id);
  const alreadyKnown=allLearnedSpellIds(plan).includes(message.id);
  if(!alreadyInGroup&&alreadyKnown&&spell){
    const confirmed=await forjaConfirm(
      'Você já possui a magia '+spell.name+'.\n\nPelas regras oficiais de Tormenta20, ao reaprender esta magia, o custo para lançá-la será reduzido em –1 PM (cumulativo com quaisquer outras reduções de custo).\n\nDeseja aprender '+spell.name+' novamente para receber esta redução de –1 PM?',
      'Sim, reaprender (-1 PM)'
    );
    if(!confirmed)return;
    spellState().reducedCostSpells=spellState().reducedCostSpells||{};
    spellState().reducedCostSpells[message.id]=true;
  }
  if(chooseCharacterSpell(message.group,message.id)){
    if(alreadyKnown&&spellState().reducedCostSpells?.[message.id]){
      toast('Magia reaprendida! Custo reduzido em –1 PM.');
    }
    refreshSpellStage();
  }else syncGrimoire();
});
function resetOptionalSpellChoices(){
  const plan=spellPlan(),saved=spellState();
  plan.groups.forEach(group=>{
    if(!group.fixed?.length){
      delete saved.selections[group.id];
    }
  });
  saved.memorized=[];
  saved.reducedCostSpells={};
  saved.manualSchools={};
  saved.lockedSchools={};
  saved.schools={};
  saved.schoolAnnouncements={};
  delete saved.teurgistSkipped;
  delete saved.teurgistSkippedLevels;
  delete saved.teurgistRetroGranted;
  const firstChoice=plan.groups.find(g=>g.kind==='class'&&!g.fixed?.length&&g.count>0)||plan.groups.find(g=>!g.fixed?.length&&g.count>0);
  if(firstChoice)saved.activeGroup=firstChoice.id;
  saved.view='available';
  state.completed=state.completed.filter(step=>step!==7);
  spellPlan();
}
document.addEventListener('click',async event=>{
  const redoBtn=event.target.closest?.('#redoSpellChoicesButton')||event.target.closest?.('[data-action="spell-redo"]');
  if(redoBtn){
    if(!await forjaConfirm('Você poderá escolher novamente todas as magias opcionais deste personagem. Magias recebidas automaticamente não serão removidas.','Sim, refazer'))return;
    resetOptionalSpellChoices();refreshSpellStage();syncGrimoire();toast('Escolhas de magia liberadas para serem refeitas.');
    return;
  }
  const button=event.target.closest?.('[data-action]');if(!button)return;
  const action=button.dataset.action,saved=spellState();
  if(action==='spell-source'){
    endSchoolReview();
    saved.activeGroup=button.dataset.group;
    saved.view='available';
    spellCatalogUI.section='magias';
    refreshSpellStage();
    const g=spellPlan().groups.find(x=>x.id===button.dataset.group);
    if(g?.teurgist)showTeurgistNotice(g);
  }
  if(action==='teurgist-toggle'){
    const circle=Number(button.dataset.circle)||1;
    const level=Number(button.dataset.level)||1;
    saved.teurgistSkippedLevels=saved.teurgistSkippedLevels||{};
    const levels=new Set(saved.teurgistSkippedLevels[circle]||[]);
    const active=spellPlan().groups.find(group=>group.id===saved.activeGroup);
    if(active?.teurgist){
      delete saved.selections[active.id];
      levels.add(level);
    }else if(active?.teurgistConverted){
      delete saved.selections[active.id];
      levels.delete(level);
    }
    saved.teurgistSkippedLevels[circle]=[...levels].sort((a,b)=>a-b);
    refreshSpellStage();
    const next=spellPlan().groups.find(group=>group.teurgistLevel===level&&(group.teurgist||group.teurgistConverted));
    if(next)spellState().activeGroup=next.id;
    refreshSpellStage();
    toast(active?.teurgist?'Escolha convertida para a tradição da classe. O benefício do Teurgista foi guardado para um nível futuro.':'Escolha restaurada para a tradição concedida pelo Teurgista.');
  }
  if(action==='teurgist-retro'){
    const circle=Number(button.dataset.circle)||1;
    const confirmed=await forjaConfirm(
      'Pelas regras oficiais de Tormenta20, a oportunidade de aprender uma magia da outra tradição concedida pelo Teurgista Místico para este patamar já passou.\n\nNo entanto, se o seu mestre de RPG autorizar retroagir e fazer essa escolha agora, você poderá aprender uma magia da outra tradição para este patamar.\n\nSeu mestre autoriza essa escolha retroativa?',
      'Sim, o mestre autorizou'
    );
    if(confirmed){
      saved.teurgistRetroGranted=saved.teurgistRetroGranted||{};
      saved.teurgistRetroGranted[circle]=true;
      delete saved.teurgistSkipped?.[circle];
      refreshSpellStage();
      toast('Teurgista Místico reaberto para o '+circle+'º círculo.');
      const plan=spellPlan();
      const retroGroup=plan.groups.find(g=>g.teurgist&&g.exactCircle===circle);
      if(retroGroup)showTeurgistNotice(retroGroup);
    }
  }
  if(action==='spell-view'){endSchoolReview();saved.view=button.dataset.view;spellCatalogUI.section='magias';refreshSpellStage()}
  if(action==='spell-book'&&toggleSpellBook(button.dataset.book)){syncSpellControls();syncGrimoire()}
  if(action==='spell-section'&&['magias','condicoes'].includes(button.dataset.section)){
    if(button.dataset.section==='condicoes'){
      (window as any).ForjaCondicoes?.abrirModal?.();
      return;
    }
    spellCatalogUI.section=button.dataset.section;
    syncSpellControls();
    syncGrimoire();
  }
  if(action==='spell-remove'&&chooseCharacterSpell(button.dataset.group,button.dataset.spell))refreshSpellStage();
  if(action==='spell-school'){
    if(chooseSpellSchool(button.dataset.classId,button.dataset.school))refreshSpellStage();
  }
  if(action==='spell-reload')mountGrimoire();
  if(action==='summary-spells'){saved.progression=true;state.step=7;renderStage();window.scrollTo({top:0,behavior:'smooth'})}
});
const phaseCompleteBeforeSpells=phaseIsComplete,missingBeforeSpells=missingChoices,validationBeforeSpells=validationMessage,summaryBeforeSpells=renderSummary;
document.addEventListener('click',event=>{
  const action=event.target.closest?.('[data-action]')?.dataset.action;
  if(action==='add-level')spellState().progression=true;
  if(event.target.closest?.('#nextButton')&&state.step===6)spellState().progression=false;
},true);
magicCircleAvailable=function(){
  const plan=spellPlan();
  return Math.max(0,...plan.classes.filter(cls=>!cls.effect.efeitoMundano).map(cls=>spellCircleAt(cls.effect,cls.level)),...plan.groups.filter(group=>group.kind==='grant'&&group.count).map(group=>group.maxCircle),...allLearnedSpellIds(plan).map(id=>spellById(id).circle));
};
const eligibilityBeforeSpells=generalPowerEligibility;
generalPowerEligibility=function(power){
  const verdict=eligibilityBeforeSpells(power),text=slug(power?.preRequisitosTexto||'');
  // Having access through Usurpar is not the same as knowing a named spell.
  if(/(?:conhecer|conhece|aprendido|aprender|magia)_/.test(text)){
    const named=DATA.spells.filter(spell=>text.includes(slug(spell.name)));
    for(const spell of named)if(!knowsCharacterSpell(spell.id))addReason(verdict.reasons,'Requer conhecer a magia '+spell.name+'.');
  }
  return {ok:verdict.reasons.length===0,reasons:verdict.reasons};
};
phaseIsComplete=function(step){return step===7?spellMissingChoices().length===0:phaseCompleteBeforeSpells(step)};
missingChoices=function(step){return step===7?spellMissingChoices():missingBeforeSpells(step)};
validationMessage=function(step,short=false){return step===7?(phaseIsComplete(7)?'Etapa pronta para continuar.':'Conclua as escolhas de magias e escolas indicadas acima.'):validationBeforeSpells(step,short)};
renderSummary=function(){
  const content=summaryBeforeSpells(),plan=spellPlan(),ids=allLearnedSpellIds(plan),missing=spellMissingChoices();
  return content+panel('Grimório do personagem','<div class="ability-list">'+(ids.length?ids.map(id=>abilityHtml({nome:spellDisplayNameWithCost(id,plan),descricao:plan.groups.filter(group=>group.kind!=='reference'&&groupSpellIds(group).includes(id)).map(group=>group.label).join(' · ')})).join(''):'<p class="help">Nenhuma magia recebida ou escolhida.</p>')+'</div>'+(missing.length?'<div class="warning-box red" style="margin-top:10px">Há escolhas de magias pendentes. Revise a fase Magias após alterar a progressão.</div>':'')+'<div class="inline-actions" style="margin-top:12px"><button type="button" class="button primary" data-action="summary-spells">Ver / escolher magias</button></div>');
};
spellState();
