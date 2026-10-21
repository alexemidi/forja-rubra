

function unmetSkillRequirements(){
  const trained=new Set(allTrainedSkills()),map=new Map();
  classFutureRequirements().skills.filter(req=>!trained.has(req.skill)).forEach(req=>{
    const key=req.skill+'|'+req.level,entry=map.get(key)||{kind:'skill',id:req.skill,level:req.level,powers:[]};
    if(!entry.powers.includes(req.power))entry.powers.push(req.power);
    map.set(key,entry);
  });
  return [...map.values()].sort((a,b)=>a.level-b.level||a.id.localeCompare(b.id));
}

function prerequisiteSignature(items){return JSON.stringify(items.map(item=>[item.kind,item.id,item.value||0,item.level,item.powers]))}
function closeWarningModal(){document.getElementById('warningModal').hidden=true}
function showPrerequisiteWarning(kind,items){
  const isAttribute=kind==='attributes',first=items[0],target=isAttribute?'[data-attribute-id="'+first.id+'"]':'[data-action="skill"][value="'+first.id+'"]';
  locateMissingChoice(target,false);
  document.getElementById('warningModalTitle').textContent=isAttribute?'Atributos abaixo de pré-requisitos futuros':'Perícias exigidas por poderes futuros';
  document.getElementById('warningModalBody').innerHTML='<p>Você pode continuar normalmente, mas não poderá escolher os poderes relacionados enquanto não cumprir os requisitos abaixo.</p><div class="confirm-list">'+items.map(item=>'<div class="confirm-item"><strong>'+(isAttribute?esc(ATTR_LABEL[item.id])+' '+item.value:esc(SKILL_LABEL[item.id]||item.id))+' · a partir do nível '+item.level+'</strong><span>'+esc(item.powers.join(' · '))+'</span></div>').join('')+'</div><p>Deseja continuar mesmo assim?</p>';
  document.getElementById('warningCancel').textContent='Voltar e ajustar';
  document.getElementById('warningContinue').hidden=false;
  document.getElementById('warningModal').dataset.mode='prerequisite';
  document.getElementById('warningModal').dataset.kind=kind;
  document.getElementById('warningModal').dataset.target=target;
  document.getElementById('warningModal').dataset.signature=prerequisiteSignature(items);
  document.getElementById('warningModal').hidden=false;
}

document.addEventListener('click',event=>{
  const next=event.target.closest?.('#nextButton');
  if(!next||![2,4].includes(state.step)||!phaseIsComplete(state.step))return;
  const kind=state.step===2?'attributes':'skills',items=kind==='attributes'?unmetAttributeRequirements():unmetSkillRequirements(),signature=prerequisiteSignature(items);
  if(!items.length||state.prereqConfirm[kind]===signature)return;
  event.stopImmediatePropagation();
  showPrerequisiteWarning(kind,items);
},true);

document.addEventListener('click',event=>{
  const next=event.target.closest?.('#nextButton');
  if(!next||[8,9,10].includes(state.step)||(state.step===6&&typeof pendingGeneralPowerSlot==='function'&&pendingGeneralPowerSlot()!==undefined)||phaseIsComplete(state.step))return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const items=missingChoices(state.step);
  const first=items[0];
  showMissingChoiceWarning(items.length?items:[{title:'Etapa incompleta',message:validationMessage(state.step),selector:'.stage-root',step:state.step}]);
  if(first?.selector){
    const target=document.querySelector(first.selector);
    target?.scrollIntoView({behavior:'smooth',block:'start'});
  }
},true);

document.getElementById('warningCancel').addEventListener('click',()=>{
  const modal=document.getElementById('warningModal');
  const target=modal.dataset.target;
  const targetStep=Number(modal.dataset.targetStep);
  closeWarningModal();
  if(targetStep && targetStep !== state.step){
    state.step = targetStep;
    if(targetStep === 7 && typeof spellState === 'function'){
      spellState().progression = true;
      const plan = spellPlan();
      const inc = plan.groups.find(g => g.count && groupSpellIds(g).length < g.count);
      if(inc){ spellState().activeGroup = inc.id; spellState().view = 'available'; }
    }
    renderStage();
    window.scrollTo({top:0,behavior:'smooth'});
    setTimeout(()=>{
      if(targetStep === 7) document.getElementById('spellGrimoire')?.scrollIntoView({behavior:'smooth',block:'start'});
      else locateMissingChoice(target, true);
    }, 120);
    return;
  }
  if(target === '[data-action="summary-spells"]'){
    if(typeof spellState === 'function'){
      spellState().progression = true;
      state.step = 7;
      const plan = spellPlan();
      const inc = plan.groups.find(g => g.count && groupSpellIds(g).length < g.count);
      if(inc){ spellState().activeGroup = inc.id; spellState().view = 'available'; }
      renderStage();
      window.scrollTo({top:0,behavior:'smooth'});
      setTimeout(()=>document.getElementById('spellGrimoire')?.scrollIntoView({behavior:'smooth',block:'start'}), 120);
      return;
    }
  }
  setTimeout(()=>locateMissingChoice(target,true),70);
});
document.getElementById('warningContinue').addEventListener('click',()=>{
  const modal=document.getElementById('warningModal'),kind=modal.dataset.kind;
  state.prereqConfirm[kind]=modal.dataset.signature;
  closeWarningModal();
  if(!state.completed.includes(state.step))state.completed.push(state.step);
  state.step=typeof nextIncompletePhase==='function'?nextIncompletePhase(state.step):Math.min(9,state.step+1);
  renderStage();
  window.scrollTo({top:0,behavior:'smooth'});
});
document.getElementById('warningModal').addEventListener('click',event=>{if(event.target.id==='warningModal')closeWarningModal()});

// Versão 3: especializações de Ofício e fluxo de perícias orientado por grupos.
const OFFICES=[
  ['alfaiate','Ofício (Alfaiate)'],['alquimia','Ofício (Alquimia)'],['alvenaria','Ofício (Alvenaria)'],['armeiro','Ofício (Armeiro)'],
  ['artesao','Ofício (Artesão)'],['carpinteiro','Ofício (Carpinteiro)'],['culinaria','Ofício (Culinária)'],['engenhoqueiro','Ofício (Engenhoqueiro)'],
  ['escriba','Ofício (Escriba)'],['escultor','Ofício (Escultor)'],['estalajadeiro','Ofício (Estalajadeiro)'],['fazendeiro','Ofício (Fazendeiro)'],
  ['joalheiro','Ofício (Joalheiro)'],['minerador','Ofício (Minerador)'],['pescador','Ofício (Pescador)'],['pintor','Ofício (Pintor)'],
  ['tatuador','Ofício (Tatuador)']
];
const OFFICE_LABEL=Object.fromEntries(OFFICES);
function officeToken(id){return 'oficio:'+id}
function skillBaseId(value){return String(value||'').startsWith('oficio:')?'oficio':String(value||'')}
function skillTokenFromName(name){const id=slug(name);if(id==='oficio')return 'oficio';if(id.startsWith('oficio_'))return officeToken(id.slice(7));return id}
function skillDisplayName(value){const token=String(value||'');if(token.startsWith('oficio:')){const key=token.slice(7);return OFFICE_LABEL[key]||('Ofício ('+key.charAt(0).toUpperCase()+key.slice(1).replace(/_/g,' ')+')')}return SKILL_LABEL[token]||token}
const OFFICE_ALIASES={alquimista:'alquimia',artifice:'artesao',tatuagem:'tatuador',tatuagens:'tatuador'};
function normalizeOfficeId(value){const id=slug(value).replace(/^oficio_/,'');return OFFICE_ALIASES[id]||id}

if(Number(state.layoutVersion||0)<3){
  if(state.step===5)state.step=6;else if(state.step===6)state.step=5;
  state.completed=(state.completed||[]).map(step=>step===5?6:step===6?5:step);
  state.layoutVersion=3;
}
state.identity.classRequiredOffices??={};
state.origin.officeSpecialties??={};
state.powers=Object.assign({general:[],raceGroups:{},categoryFilter:'all',statusFilter:'all',previewId:'',activeSlot:0},state.powers||{});
state.deity=Object.assign({mode:'',name:'',power:'',previewPower:'',previewDeity:'',activePowerIndex:0},state.deity||{});

function readableRaceChoiceOption(option){
  const names={pericia_treinada:'Perícia treinada',poder_geral:'Poder geral',heranca_racial:'Herança racial'};
  return Object.assign({},option,{nome:option.nome||names[option.id]||String(option.id||'Opção').replace(/_/g,' ')});
}
function supplementalRaceChoiceDefinitions(){
  const race=raceById(state.identity.raceId),declared=new Set((race?.habilidades?.selecionadas||[]).map(def=>def.id)),definitions=[];
  (race?.habilidades?.fixas||[]).forEach(ability=>{
    if(declared.has(ability.id)||ability.escolha)return;
    const effect=(ability.efeitos||[]).find(item=>item.tipo==='escolha_opcao'&&item.opcoes?.length);if(!effect)return;
    definitions.push({id:ability.id,nome:ability.nome,descricao:ability.descricao,opcoes:effect.opcoes.map(readableRaceChoiceOption)});
  });
  return definitions;
}
function allRaceChoiceDefinitions(){return [...(raceById(state.identity.raceId)?.habilidades?.selecionadas||[]),...supplementalRaceChoiceDefinitions()]}
function chosenRaceTraitOption(def){return optionList(def).find(option=>choiceId(option)===state.identity.raceChoices[def.id])}
raceSkillSlots=function(){
  return allRaceChoiceDefinitions().reduce((total,def)=>{const option=chosenRaceTraitOption(def);if(!option)return total;if(Number(option.periciasTreinadas))return total+Number(option.periciasTreinadas);if(option.tipo==='escolha_pericia_treinada')return total+Number(option.quantidade||1);return total+(option.efeitos||[]).filter(effect=>effect.tipo==='escolha_pericia_treinada').reduce((sum,effect)=>sum+Number(effect.quantidade||1),0)},0);
};
generalPowerSlots=function(){
  let total=['golem','golem_desperto'].includes(state.identity.raceId)?(state.origin.mode==='dual'?2:1):0;
  allRaceChoiceDefinitions().forEach(def=>{const option=chosenRaceTraitOption(def);if(!option)return;if(Number(option.poderGeral))total+=Number(option.poderGeral);else if(option.tipo==='escolha_poder_geral')total+=Number(option.quantidade||1);else total+=(option.efeitos||[]).filter(effect=>effect.tipo==='escolha_poder_geral').reduce((sum,effect)=>sum+Number(effect.quantidade||1),0)});
  return total;
};
const baseRaceSelectionsCompleteV3=raceSelectionsComplete;
raceSelectionsComplete=function(){return baseRaceSelectionsCompleteV3()&&supplementalRaceChoiceDefinitions().every(def=>Boolean(state.identity.raceChoices[def.id]))};

mandatoryClassSkills=function(){
  const cls=classById(state.identity.classId),result=[];
  (cls?.caracteristicas?.pericias?.fixas||[]).forEach((entry,index)=>{
    const chosen=entry.tipo==='escolha'?state.identity.classRequiredChoices[index]:entry.id;
    if(!chosen)return;
    const token=skillTokenFromName(chosen);
    result.push(token==='oficio'?(state.identity.classRequiredOffices[index]||token):token);
  });
  return [...new Set(result)];
};

originSkillIds=function(){
  return originBenefitOptions(selectedStandardOrigin()).filter(option=>state.origin.benefits.includes(option.id)&&option.type==='skill').map(option=>{
    const token=skillTokenFromName(option.name);
    return token==='oficio'?(state.origin.officeSpecialties[option.id]||token):token;
  });
};

regionalSkillIds=function(){
  const text=selectedRegionalOrigin()?.beneficios?.descricao||'',normalized=slug(text),ids=[];
  for(const [id,name] of SKILLS){
    if(id==='oficio')continue;
    if(new RegExp('treinad[oa] em[^.]*\\b'+name+'\\b','i').test(text))ids.push(id);
  }
  OFFICES.forEach(([id,label])=>{if(normalized.includes(slug(label)))ids.push(officeToken(id))});
  if(/treinad[oa] em[^.]*of[ií]cio(?!\s*\()/i.test(text))ids.push('oficio');
  return [...new Set(ids)];
};

function raceFixedSkills(){
  const race=raceById(state.identity.raceId),skills=[];
  (race?.habilidades?.fixas||[]).forEach(h=>{
    (h.efeitos||[]).forEach(e=>{
      if(['pericia_treinada','treinar_pericia'].includes(e.tipo)){
        for(const id of (e.pericias||[e.periciaId]))if(id)skills.push(id);
      }
    });
  });
  return [...new Set(skills)];
}

allTrainedSkills=function(){return [...new Set([...mandatoryClassSkills(),...raceFixedSkills(),...originSkillIds(),...regionalSkillIds(),...(state.skills.class||[]),...(state.skills.int||[]),...(state.skills.race||[]),...(state.skills.duplicate||[])])]};
function skillRequirementMet(requirement){
  const trained=allTrainedSkills(),token=String(requirement||'');
  if(token==='oficio')return trained.some(value=>skillBaseId(value)==='oficio');
  if(token.startsWith('oficio:')){
    // @ts-ignore
    const artRules = typeof RegrasArtesaoCriativo !== 'undefined' ? RegrasArtesaoCriativo : (typeof window !== 'undefined' ? window['RegrasArtesaoCriativo'] : null);
    const temArtesaoCriativo = artRules && typeof artRules.temPoderArtesaoCriativo === 'function'
      ? artRules.temPoderArtesaoCriativo(state)
      : ((Array.isArray(state?.progression) && state.progression.some(p => p?.powerId === 'inventor_artesao_criativo' || p?.powerId === 'artesao_criativo' || /artes[aã]o criativo/i.test(p?.powerName || ''))) ||
         (Array.isArray(state?.powers) && state.powers.some(p => p?.id === 'inventor_artesao_criativo' || p?.id === 'artesao_criativo' || /artes[aã]o criativo/i.test(p?.nome || ''))));
    if (temArtesaoCriativo) return true;
  }
  return trained.includes(token);
}

parsePowerRequirements=function(power){
  const text=power?.preRequisitosTexto||'',attrs=[],skills=[],skillGroups=[];
  const attributePatterns={for:'For(?:ça)?',des:'Des(?:treza)?',con:'Con(?:stituição)?',int:'Int(?:eligência)?',sab:'Sab(?:edoria)?',car:'Car(?:isma)?'};
  Object.entries(attributePatterns).forEach(([id,pattern])=>{for(const match of text.matchAll(new RegExp('\\b'+pattern+'\\s*([+-]?[0-9]+)','gi')))attrs.push([id,Number(match[1])])});
  for(const match of text.matchAll(/treinad[oa]\s+em\s+([^.;]+)/gi)){
    const clause=match[1],normalized=slug(clause),found=[];
    const officeMatch=clause.match(/of[ií]cio\s*\(([^)]+)\)/i);
    if(officeMatch){const officeId=normalizeOfficeId(officeMatch[1]);if(OFFICE_LABEL[officeId])found.push(officeToken(officeId))}
    for(const [id,name] of SKILLS){if(id!=='oficio'&&new RegExp('\\b'+name+'\\b','i').test(clause))found.push(id)}
    if(/of[ií]cio/i.test(clause)&&!found.some(value=>skillBaseId(value)==='oficio'))found.push('oficio');
    const unique=[...new Set(found)];
    if(/\s+ou\s+/i.test(clause)&&unique.length>1)skillGroups.push(unique);else unique.forEach(value=>skillGroups.push([value]));
    skills.push(...unique);
  }
  const level=Number((text.match(/(\d+)\s*[º°]?\s*nível/i)||[])[1]||2);
  return{attrs:[...new Map(attrs.map(item=>[item.join(':'),item])).values()],skills:[...new Set(skills)],skillGroups,level,text};
};

const baseRenderRequirementWarningsV3=renderRequirementWarnings;
renderRequirementWarnings=function(kind){
  if(kind==='attrs')return baseRenderRequirementWarningsV3(kind);
  const rows=classFutureRequirements().skills.filter((item,index,array)=>array.findIndex(other=>other.skill===item.skill&&other.level===item.level)===index).sort((a,b)=>a.level-b.level||skillDisplayName(a.skill).localeCompare(skillDisplayName(b.skill),'pt-BR'));
  if(!rows.length)return '';
  return '<div class="warning-box"><strong>Perícias exigidas por poderes futuros.</strong><div class="tag-row" style="margin-top:7px">'+rows.map(item=>'<span class="tag '+(skillRequirementMet(item.skill)?'green':'red')+'" title="'+esc(item.power)+'">'+esc(skillDisplayName(item.skill))+' · nível '+item.level+'</span>').join('')+'</div><p style="margin-top:7px">As perícias em vermelho ainda não foram treinadas.</p></div>';
};

unmetSkillRequirements=function(){
  const map=new Map();
  classFutureRequirements().skills.filter(requirement=>!skillRequirementMet(requirement.skill)).forEach(requirement=>{
    const key=requirement.skill+'|'+requirement.level,entry=map.get(key)||{kind:'skill',id:requirement.skill,level:requirement.level,powers:[]};
    if(!entry.powers.includes(requirement.power))entry.powers.push(requirement.power);
    map.set(key,entry);
  });
  return [...map.values()].sort((a,b)=>a.level-b.level||skillDisplayName(a.id).localeCompare(skillDisplayName(b.id),'pt-BR'));
};

renderSkillChoices=function(group,available,needed,title,notes=''){
  const chosen=state.skills[group]||[],requirements=classFutureRequirements().skills,limitReached=chosen.length>=needed,showOnlyUntrained=true,cards=[];
  const addCard=(token,label,picker=false)=>{
    const selected=chosen.includes(token),base=skillBaseId(token),already=!picker&&!selected&&base!=='oficio'&&skillRequirementMet(token),exhausted=limitReached&&!selected&&!already;
    if(showOnlyUntrained&&!selected&&already)return;
    const related=requirements.filter(req=>req.skill===token||(req.skill==='oficio'&&base==='oficio')),unmet=related.some(req=>!skillRequirementMet(req.skill));
    const tooltip=related.length?'Pré-requisito futuro: '+related.slice(0,8).map(req=>req.power+' no nível '+req.level).join('; ')+'.':'';
    cards.push('<label class="check-card '+(selected?'selected ':'')+(already?'disabled ':'')+(exhausted?'choice-exhausted ':'')+(related.length?'prereq ':'')+(unmet?'prereq-unmet':'')+'" '+(tooltip?'data-tooltip="'+esc(tooltip)+'"':'')+'><input type="checkbox" data-action="skill" data-group="'+group+'" data-skill-base="'+base+'" value="'+esc(token)+'" '+(selected?'checked':'')+' '+(already||exhausted?'disabled':'')+'><span><strong>'+esc(label)+'</strong><small>'+esc(SKILLS.find(item=>item[0]===base)?.[2]?.toUpperCase()||'')+(picker?' · escolha a especialização':'')+(related.length?' · requisito futuro':'')+(already?' · já treinada':'')+(exhausted?' · escolhas completas':'')+'</small></span></label>');
  };
  [...new Set(available)].forEach(id=>{
    if(id==='oficio'){
      chosen.filter(token=>skillBaseId(token)==='oficio').forEach(token=>addCard(token,skillDisplayName(token)));
      if(!limitReached)addCard('oficio','Ofício (escolher especialização)',true);
    }else addCard(id,SKILL_LABEL[id]||id);
  });
  return panel(title,'<div class="skill-grid">'+(cards.join('')||'<div class="empty">Nenhuma perícia ainda não treinada disponível neste grupo.</div>')+'</div>'+(notes?'<p class="help" style="margin-top:9px">'+esc(notes)+'</p>':'')+'<p class="help" style="margin-top:7px">Borda vermelha indica um pré-requisito futuro ainda não atendido.</p>','Selecionadas: '+chosen.length+'/'+needed);
};

renderSkillsSplit=function(){
  const cls=classById(state.identity.classId);
  const classFixed=mandatoryClassSkills();
  const raceFixed=raceFixedSkills();
  const originSkills=originSkillIds();
  const regionalSkills=regionalSkillIds();
  
  // Ordem estrita do quadro de treinos já definidos:
  // 1) classe 1, 2, 3 (se houver, ex. Místico)
  // 2) raça 1, 2 (se houver)
  // 3) origem 1, 2 (se houver)
  // 4) origem regional 1, 2 (se houver)
  const definedSkillsOrdered=[...classFixed, ...raceFixed, ...originSkills, ...regionalSkills];
  const duplicate=classFixed.filter(id=>[...originSkills, ...regionalSkills, ...raceFixed].includes(id)).length;
  
  const baseCount=Number(cls?.caracteristicas?.pericias?.escolhas?.quantidade||0);
  const classOptions=(cls?.caracteristicas?.pericias?.escolhas?.opcoes||[]).map(option=>option.id);
  const intCount=Math.max(0,finalAttrs().int);
  const raceCount=raceSkillSlots();
  
  const defined=panel('Treinos já definidos','<div class="tag-row">'+(definedSkillsOrdered.length?definedSkillsOrdered.map(id=>'<span class="tag amber">'+esc(skillDisplayName(id))+'</span>').join(''):'<span class="tag amber">Nenhum</span>')+'</div><p class="help" style="margin-top:8px">Perícias de classe, raça e origens. Uma duplicação obrigatória gera uma escolha substituta da lista de classe.</p>')+renderRequirementWarnings('skills');
  
  const classReady=(state.skills.class||[]).length===baseCount;
  const intReady=!intCount||(state.skills.int||[]).length===intCount;
  const raceReady=!raceCount||(state.skills.race||[]).length===raceCount;
  
  // Numeração dinâmica das etapas ativas: classe > intel > raça > residuais de duplicidade
  const jumpButtons=['<button class="button" data-action="skill-jump" data-target="skill-class" type="button">1 · Classe</button>'];
  let stepCounter=1;
  let intStepNum=0, raceStepNum=0, dupStepNum=0;
  
  if(intCount||(state.skills.int||[]).length){
    stepCounter++;
    intStepNum=stepCounter;
    if(classReady)jumpButtons.push('<button class="button" data-action="skill-jump" data-target="skill-int" type="button">'+intStepNum+' · Inteligência</button>');
  }
  if(raceCount){
    stepCounter++;
    raceStepNum=stepCounter;
    if(classReady&&intReady)jumpButtons.push('<button class="button" data-action="skill-jump" data-target="skill-race" type="button">'+raceStepNum+' · Raça</button>');
  }
  if(duplicate){
    stepCounter++;
    dupStepNum=stepCounter;
    if(classReady&&intReady&&raceReady)jumpButtons.push('<button class="button" data-action="skill-jump" data-target="skill-duplicate" type="button">'+dupStepNum+' · Duplicidade</button>');
  }
  
  const jump='<nav class="skill-jumpbar" aria-label="Navegação entre grupos de perícias">'+jumpButtons.join('')+'</nav>';
  
  let choices=jump+'<div id="skill-class">'+renderSkillChoices('class',classOptions,baseCount,'1 · Perícias de classe','Conclua este grupo para liberar as escolhas seguintes.')+'</div>';
  
  if(!classReady){
    choices+='<div class="skill-locked-panel"><strong>Próximas escolhas bloqueadas</strong>Conclua primeiro todas as perícias de classe. As perícias de Inteligência'+(raceCount?', da raça':'')+(duplicate?' e substitutas por duplicidade':'')+' serão calculadas e exibidas aqui mesmo.</div>';
  }else{
    if(intStepNum){
      choices+='<div id="skill-int">'+renderSkillChoices('int',SKILLS.map(item=>item[0]),intCount,intStepNum+' · Perícias de Inteligência','Quantidade igual à Inteligência final, mínimo zero. Se o limite diminuiu, desmarque as escolhas excedentes.')+'</div>';
    }
    
    if(!intReady){
      if(raceCount||duplicate){
        choices+='<div class="skill-locked-panel"><strong>Próximas escolhas bloqueadas</strong>Conclua primeiro as perícias de Inteligência para liberar as escolhas seguintes.</div>';
      }
    }else{
      if(raceCount){
        choices+='<div id="skill-race">'+renderSkillChoices('race',SKILLS.map(item=>item[0]),raceCount,raceStepNum+' · Perícias da raça','Concedidas por Versátil, do humano.')+'</div>';
      }
      
      if(!raceReady){
        if(duplicate){
          choices+='<div class="skill-locked-panel"><strong>Perícias substitutas bloqueadas</strong>Conclua primeiro as perícias da raça para liberar as escolhas substitutas de duplicidade.</div>';
        }
      }else{
        if(duplicate){
          choices+='<div id="skill-duplicate">'+renderSkillChoices('duplicate',classOptions,duplicate,dupStepNum+' · Perícias substitutas por duplicidade','Você recebeu perícias obrigatórias da classe na origem ou raça; escolha substitutas da lista da classe.')+'</div>';
        }
      }
    }
  }
  
  return '<div class="phase-content-grid"><div class="phase-column">'+defined+'</div><div class="phase-column">'+choices+'</div></div>';
};

skillMissingChoices=function(){
  const limits=skillChoiceLimits(),groups=[['class','perícias da classe'],['int','perícias de Inteligência']];
  if(limits.race>0)groups.push(['race','perícias da raça']);
  if((limits.duplicate||0)>0)groups.push(['duplicate','perícias substitutas por duplicidade']);
  const missing=[];
  for(const [group,label] of groups){
    const required=limits[group]||0,amount=(state.skills[group]||[]).length,diff=required-amount;
    if(diff!==0){
      const msg=diff>0?(group==='int'?'Você possui Inteligência '+required+' e precisa escolher mais '+diff+' perícia(s) de Inteligência.':'Escolha mais '+diff+' '+label+' que ainda faltam.'):'Você selecionou '+(-diff)+' a mais em '+label+'. Desmarque o excesso.';
      missing.push({title:label,message:msg,selector:'[data-action="skill"][data-group="'+group+'"]',step:4});
    }
  }
  return missing;
};

function originBenefitBlocked(option){
  if(option?.type!=='skill')return false;const token=skillTokenFromName(option.name);if(token==='oficio')return false;return [...regionalSkillIds()].includes(token);
}
function originBenefitDescription(option,blocked=false){
  if(blocked)return 'Perícia já treinada.';
  let description=option?.description||'';
  if(option.type==='skill'){
    const token=skillTokenFromName(option.name);description='Você se torna treinado em '+skillDisplayName(token)+'.';
  }else if(option.type==='power'){
    const power=DATA.generalPowers.find(item=>slug(item.nome)===slug(option.name));if(power)description=power.descricao||description;
  }
  return description||'Descrição ainda não estruturada.';
}
renderOrigins=function(){
  const noOrigin=isGolemRace();if(noOrigin){const raceName=raceById(state.identity.raceId)?.nome||'Golem';return panel('Sem origem','<div class="warning-box"><strong>Propósito de Criação.</strong> '+raceName+' não possui origem e não recebe benefícios dela. '+(state.origin.mode==='dual'?'Seus 2 poderes gerais serão escolhidos':'Seu poder geral será escolhido')+' na fase de Poderes.</div>');}
  if(isChildCharacter()&&(state.origin.mode==='single'||!state.origin.mode)){
    return panel('Sem origem','<div class="warning-box"><strong>Regra de Idade · Criança.</strong> Personagens na faixa etária Criança não possuem origem com a regra de origem única. Caso queira escolher 1 benefício de origem padrão (sem regional), ative a regra "Padrão + regional" abaixo.</div><div class="choice-cards" style="margin-top:10px"><label class="choice-card '+(state.origin.mode==='single'?'selected':'')+'"><input type="radio" data-field="originMode" value="single" '+(state.origin.mode==='single'?'checked':'')+'><strong>Uma origem (Sem origem)</strong><p>Crianças não recebem origem e avançam normalmente.</p></label><label class="choice-card '+(state.origin.mode==='dual'?'selected':'')+'"><input type="radio" data-field="originMode" value="dual" '+(state.origin.mode==='dual'?'checked':'')+'><strong>Duas origens (1 benefício)</strong><p>Escolha apenas um benefício de uma origem padrão (sem regional).</p></label></div>');
  }
  const origin=selectedStandardOrigin(),regional=selectedRegionalOrigin(),options=originBenefitOptions(origin),currentBenefitsCount=originBenefitsCount();
  const maxBenefits=originMaxBenefits();
  let modeDescSingle='Escolha uma origem sem região e dois benefícios dela.';
  let modeDescDual='Escolha dois benefícios da origem padrão e receba todos os benefícios da regional.';
  if(isChildCharacter()){
    modeDescSingle='Crianças não recebem origem com regra de origem única.';
    modeDescDual='Crianças escolhem apenas 1 benefício de uma origem padrão e não recebem origem regional.';
  }else if(isTeenCharacter()){
    modeDescSingle='Adolescentes escolhem apenas 1 benefício da origem padrão.';
    modeDescDual='Adolescentes podem escolher uma Origem Padrão completa (com 2 benefícios) OU uma Origem Regional.';
  }
  const mode=panel('Estrutura das origens','<div class="choice-cards"><label class="choice-card '+(state.origin.mode==='single'?'selected':'')+'"><input type="radio" data-field="originMode" value="single" '+(state.origin.mode==='single'?'checked':'')+'><strong>Uma origem padrão</strong><p>'+esc(modeDescSingle)+'</p></label><label class="choice-card '+(state.origin.mode==='dual'?'selected':'')+'"><input type="radio" data-field="originMode" value="dual" '+(state.origin.mode==='dual'?'checked':'')+'><strong>Padrão + regional</strong><p>'+esc(modeDescDual)+'</p></label></div>');
  const benefits=options.length?options.map(option=>{const selected=state.origin.benefits.includes(option.id),blocked=originBenefitBlocked(option),optionWeight=option.id==='unique:heranca_2000'?2:1,exhausted=!selected&&(currentBenefitsCount+optionWeight>maxBenefits);return '<button type="button" class="check-card origin-benefit-button '+(selected?'selected ':'')+(blocked?'disabled ':'')+(exhausted?'choice-exhausted':'')+'" data-action="origin-benefit-button" data-option-id="'+esc(option.id)+'" data-disabled="'+(blocked?'true':'false')+'" '+(exhausted&&!blocked?'disabled':'')+'><strong>'+esc(option.name)+'</strong><small>'+esc(originBenefitDescription(option,blocked))+'</small></button>'}).join(''):'<div class="empty">Escolha uma origem para ver seus benefícios.</div>';
  const items=origin?.itens||[],left='<div><label class="field"><span>Origem</span><select class="select" data-field="standardOrigin"><option value="">Escolha uma origem</option>'+DATA.origins.map(item=>'<option value="'+esc(item.nome)+'" '+(item.nome===state.origin.standard?'selected':'')+'>'+esc(item.nome)+'</option>').join('')+'</select></label><div style="margin-top:18px"><span class="field-label">Itens da origem</span><div class="origin-items" style="margin-top:7px">'+(items.length?items.map(item=>'<div class="origin-item">'+esc(item)+'</div>').join(''):'<div class="empty">Nenhum item listado para esta origem.</div>')+'</div></div></div>';
  const right='<div><span class="field-label">Escolha '+maxBenefits+' benefício'+(maxBenefits===1?'':'s')+'</span><div class="origin-benefit-grid" style="margin-top:7px">'+benefits+'</div></div>';
  const standardNote=isTeenCharacter()&&state.origin.mode==='dual'&&state.origin.regional?'Bloqueada pela escolha de Origem Regional':'Selecionados: '+currentBenefitsCount+'/'+maxBenefits;
  const standard=panel('Origem padrão','<div class="origin-standard-layout">'+left+right+'</div>',standardNote);
  const wynllaRestricted=state.origin.mode==='dual'&&hasWynllaOriginPower();
  const regionalOriginsList=wynllaRestricted?DATA.regionalOrigins.filter(isWynllaRegional):DATA.regionalOrigins;
  const regionalPlaceholder=wynllaRestricted?'Escolha uma origem regional de Wynlla':'Escolha uma origem regional';
  let regionalPanel='';
  if(state.origin.mode==='dual'&&!isChildCharacter()){
    const regionalNote=isTeenCharacter()&&state.origin.standard?'Bloqueada pela escolha de Origem Padrão':'';
    let extraRegionalChoices = '';
    const regSlug = regional ? (typeof slug === 'function' ? slug(regional.nome) : '') : '';
    if(regSlug === 'aspirante_a_heroi'){
      const chosen = state.origin?.aspiranteHeroiAttr || '';
      const totals = typeof finalAttrs === 'function' ? finalAttrs() : {};
      extraRegionalChoices = '<div class="choice-section aspirante-heroi-section" style="margin-top:12px;background:#0d121a;border:1px solid #d9a84e44;border-radius:8px;padding:14px">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">' +
          '<strong style="color:var(--gold2);font-size:0.9rem">Benefício: +1 em Atributo</strong>' +
          '<span class="tag ' + (chosen ? 'gold' : 'muted') + '">' + (chosen ? '1/1 selecionado' : 'Selecione 1 atributo') + '</span>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:8px">' +
          ATTRS.map(([id, label]) => {
            const isSelected = chosen === id;
            const val = Number(totals[id] || 0);
            return '<div style="background:#151c28;border:1px solid ' + (isSelected ? 'var(--gold2)' : 'var(--border)') + ';border-radius:6px;padding:8px 10px;display:flex;align-items:center;justify-content:space-between">' +
              '<span><strong>' + esc(label) + '</strong> <small style="color:var(--dim)">(' + val + ')</small></span>' +
              '<div style="display:inline-flex;align-items:center;gap:4px">' +
                '<button type="button" class="button small" data-action="aspirante-heroi-attr" data-attr="' + id + '" data-dir="-1" ' + (!isSelected ? 'disabled' : '') + ' style="min-width:24px;padding:2px 6px">−</button>' +
                '<output style="min-width:20px;text-align:center;font-weight:bold;color:' + (isSelected ? 'var(--gold2)' : 'var(--muted)') + '">' + (isSelected ? '+1' : '0') + '</output>' +
                '<button type="button" class="button small" data-action="aspirante-heroi-attr" data-attr="' + id + '" data-dir="1" ' + (chosen && !isSelected ? 'disabled' : isSelected ? 'disabled' : '') + ' style="min-width:24px;padding:2px 6px">+</button>' +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>' +
        '<p style="font-size:0.75rem;color:var(--dim);margin:8px 0 0 0">Escolha 1 atributo para receber o bônus permanente de +1 da origem Aspirante a Herói.</p>' +
      '</div>';
    } else if(regSlug === 'de_outro_mundo'){
      const cfg = state.origin?.deOutroMundo || { spellId: '', keyAttr: 'int', form: 'habilidade', nature: 'magico' };
      const firstCircleSpells = (DATA.spells || []).filter(s => Number(s.circulo || s.circle || 0) === 1).sort((a,b) => a.nome.localeCompare(b.nome, 'pt-BR'));
      extraRegionalChoices = '<div class="choice-section de-outro-mundo-section" style="margin-top:12px;background:#0d121a;border:1px solid #38bdf844;border-radius:8px;padding:14px">' +
        '<div style="margin-bottom:10px"><strong style="color:#38bdf8;font-size:0.92rem">Benefício: Magia de Outro Mundo</strong><p style="font-size:0.75rem;color:var(--muted);margin:3px 0 0 0">Aprenda uma magia de 1º círculo e configure se funciona como habilidade ou tecnologia, mágica ou mundana.</p></div>' +
        '<div class="grid two" style="gap:10px;margin-bottom:10px">' +
          '<label class="field"><span>Magia de 1º Círculo</span><select class="select" data-action="de-outro-mundo-spell"><option value="">Escolha uma magia…</option>' +
            firstCircleSpells.map(s => '<option value="' + esc(s.id) + '" ' + (cfg.spellId === s.id ? 'selected' : '') + '>' + esc(s.nome) + ' (' + (s.tipo === 'divina' ? 'Divina' : 'Arcana') + ')</option>').join('') +
          '</select></label>' +
          '<label class="field"><span>Atributo-chave da Magia</span><select class="select" data-action="de-outro-mundo-attr">' +
            '<option value="int" ' + (cfg.keyAttr === 'int' ? 'selected' : '') + '>Inteligência</option>' +
            '<option value="sab" ' + (cfg.keyAttr === 'sab' ? 'selected' : '') + '>Sabedoria</option>' +
            '<option value="car" ' + (cfg.keyAttr === 'car' ? 'selected' : '') + '>Carisma</option>' +
          '</select></label>' +
        '</div>' +
        '<div class="grid two" style="gap:10px">' +
          '<div class="choice-cards">' +
            '<label class="choice-card ' + (cfg.form === 'habilidade' ? 'selected' : '') + '" style="padding:8px 10px"><input type="radio" name="deOutroMundoForm" value="habilidade" ' + (cfg.form === 'habilidade' ? 'checked' : '') + '><strong>Habilidade</strong><p style="font-size:0.72rem;margin:2px 0 0 0">Pode lançar a magia naturalmente.</p></label>' +
            '<label class="choice-card ' + (cfg.form === 'tecnologia' ? 'selected' : '') + '" style="padding:8px 10px"><input type="radio" name="deOutroMundoForm" value="tecnologia" ' + (cfg.form === 'tecnologia' ? 'checked' : '') + '><strong>Tecnologia (+2 Limite PM)</strong><p style="font-size:0.72rem;margin:2px 0 0 0">Requer item Minúsculo empunhado (1 espaço, RD 10, PV metade dos seus).</p></label>' +
          '</div>' +
          '<div class="choice-cards">' +
            '<label class="choice-card ' + (cfg.nature === 'magico' ? 'selected' : '') + '" style="padding:8px 10px"><input type="radio" name="deOutroMundoNature" value="magico" ' + (cfg.nature === 'magico' ? 'checked' : '') + '><strong>Efeito Mágico</strong><p style="font-size:0.72rem;margin:2px 0 0 0">Funciona como magia comum.</p></label>' +
            '<label class="choice-card ' + (cfg.nature === 'mundano' ? 'selected' : '') + '" style="padding:8px 10px"><input type="radio" name="deOutroMundoNature" value="mundano" ' + (cfg.nature === 'mundano' ? 'checked' : '') + '><strong>Efeito Mundano</strong><p style="font-size:0.72rem;margin:2px 0 0 0">Funciona em antimagia; não acumula com magias.</p></label>' +
          '</div>' +
        '</div>' +
      '</div>';
    } else if(regSlug === 'duplo_feerico'){
      state.powers = state.powers || {};
      const allOptions = typeof duploFeericoOptions === 'function' ? duploFeericoOptions() : [];
      const chosen = typeof selectedDuploFeericoPower === 'function' ? selectedDuploFeericoPower() : null;
      const currentClassFilter = state.powers.duploFeericoFilterClass || '';
      const searchQuery = slug(state.powers.duploFeericoSearch || '');
      const filteredOptions = allOptions.filter(opt => {
        if(currentClassFilter && opt.classId !== currentClassFilter) return false;
        if(searchQuery && !slug(opt.nome + ' ' + opt.className).includes(searchQuery)) return false;
        return true;
      });
      const otherClasses = [...new Map(allOptions.map(o => [o.classId, o.className])).entries()];
      extraRegionalChoices = '<div class="choice-section duplo-feerico-section" id="duploFeericoChoiceSection" style="margin-top:12px;background:#0d121a;border:1px solid #d9a84e44;border-radius:8px;padding:14px">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">' +
          '<strong style="color:var(--gold2);font-size:0.9rem">Benefício: Habilidade de Classe de 1º Nível</strong>' +
          '<span class="tag ' + (chosen ? 'gold' : 'muted') + '">' + (chosen ? ('1/1 selecionado: ' + esc(chosen.nome)) : 'Escolha obrigatória') + '</span>' +
        '</div>' +
        '<div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;align-items:center;">' +
          '<select class="select" data-action="duplo-feerico-filter-class" style="max-width:200px;">' +
            '<option value="">Todas as classes</option>' +
            otherClasses.map(([id,name]) => '<option value="' + esc(id) + '" ' + (currentClassFilter === id ? 'selected' : '') + '>' + esc(name) + '</option>').join('') +
          '</select>' +
          '<input type="text" class="input search" id="duploFeericoSearch" placeholder="Pesquisar habilidade…" value="' + esc(state.powers.duploFeericoSearch || '') + '" style="flex:1;min-width:180px;">' +
        '</div>' +
        '<label class="field"><span>Habilidade de 1º Nível</span><select class="select" data-action="duplo-feerico-select-dropdown"><option value="">Selecione uma habilidade de classe de 1º nível…</option>' +
          filteredOptions.map(opt => '<option value="' + esc(opt.key) + '" ' + (chosen?.key === opt.key ? 'selected' : '') + '>' + esc(opt.nome) + ' (' + esc(opt.className) + ')' + (opt.isDuploSpell ? ' · +1 PM / 1 Magia' : '') + '</option>').join('') +
        '</select></label>' +
        (chosen ? '<div class="power-detail" style="margin-top:8px"><strong>' + esc(chosen.nome) + ' (' + esc(chosen.className) + ')</strong><br>' + esc(chosen.descricao || '') + '</div>' : '') +
      '</div>';
    }

    regionalPanel=panel('Origem regional','<label class="field"><span>Origem regional</span><select class="select" data-field="regionalOrigin"><option value="">'+esc(regionalPlaceholder)+'</option>'+regionalOriginsList.map(item=>'<option value="'+esc(item.nome)+'" '+(item.nome===state.origin.regional?'selected':'')+'>'+esc(item.nome)+' · '+esc(item.regiao||'Arton')+'</option>').join('')+'</select></label>'+(wynllaRestricted?'<div class="help" style="color:var(--gold2);margin-top:6px">Restrito a nativos de Wynlla pelo poder Presente de Wynlla.</div>':'')+(regional?'<div class="origin-layout" style="margin-top:12px"><div class="info-box blue"><strong>'+esc(regional.nome)+' · '+esc(regional.regiao)+'</strong><br>'+esc(regional.beneficios?.descricao||'')+'</div><div><span class="field-label">Itens regionais</span><div class="origin-items" style="margin-top:7px">'+((regional.itens||[]).length?regional.itens.map(item=>'<div class="origin-item">'+esc(item)+'</div>').join(''):'<div class="empty">Nenhum item regional listado.</div>')+'</div></div></div>'+extraRegionalChoices:''),regionalNote);
  }
  return mode+standard+regionalPanel;
};

document.addEventListener('click', event => {
  const btn = event.target.closest?.('[data-action="aspirante-heroi-attr"]');
  if (btn) {
    event.preventDefault();
    const attr = btn.dataset.attr;
    const dir = btn.dataset.dir;
    if (dir === '1') {
      state.origin.aspiranteHeroiAttr = attr;
    } else if (state.origin?.aspiranteHeroiAttr === attr) {
      state.origin.aspiranteHeroiAttr = '';
    }
    persistNow();
    renderStage();
    return;
  }
});

document.addEventListener('change', event => {
  if (event.target.matches('[data-action="duplo-feerico-select-dropdown"]')) {
    state.powers = state.powers || {};
    const val = event.target.value;
    if (val) {
      state.powers.duploFeericoClassPower = val;
      state.powers.duploFeericoPreview = val;
      const opt = typeof duploFeericoOptions === 'function' ? duploFeericoOptions().find(o => o.key === val) : null;
      if (opt) toast(opt.nome + ' selecionado para Duplo Feérico.');
    } else {
      delete state.powers.duploFeericoClassPower;
    }
    persistNow();
    renderStage();
    return;
  }
  if (event.target.matches('[data-action="de-outro-mundo-spell"]')) {
    state.origin.deOutroMundo = state.origin.deOutroMundo || { spellId: '', keyAttr: 'int', form: 'habilidade', nature: 'magico' };
    state.origin.deOutroMundo.spellId = event.target.value;
    persistNow();
    renderStage();
  }
  if (event.target.matches('[data-action="de-outro-mundo-attr"]')) {
    state.origin.deOutroMundo = state.origin.deOutroMundo || { spellId: '', keyAttr: 'int', form: 'habilidade', nature: 'magico' };
    state.origin.deOutroMundo.keyAttr = event.target.value;
    persistNow();
    renderStage();
  }
  if (event.target.name === 'deOutroMundoForm') {
    state.origin.deOutroMundo = state.origin.deOutroMundo || { spellId: '', keyAttr: 'int', form: 'habilidade', nature: 'magico' };
    state.origin.deOutroMundo.form = event.target.value;
    persistNow();
    renderStage();
  }
  if (event.target.name === 'deOutroMundoNature') {
    state.origin.deOutroMundo = state.origin.deOutroMundo || { spellId: '', keyAttr: 'int', form: 'habilidade', nature: 'magico' };
    state.origin.deOutroMundo.nature = event.target.value;
    persistNow();
    renderStage();
  }
});

let officePending=null;