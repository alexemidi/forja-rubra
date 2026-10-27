
function openOfficeModal(pending){
  officePending=pending;
  const available=OFFICES.filter(([id])=>!skillRequirementMet(officeToken(id)));
  document.getElementById('officeOptions').innerHTML=available.length?available.map(([id,label])=>'<button class="office-option" type="button" data-action="office-select" data-office="'+id+'">'+esc(label)+'</button>').join(''):'<div class="empty">Todos os Ofícios padrão listados já foram treinados. Você pode digitar um personalizado abaixo.</div>';
  const input=document.getElementById('customOfficeInput');
  if(input)input.value='';
  document.getElementById('officeModal').hidden=false;
}
function closeOfficeModal(){document.getElementById('officeModal').hidden=true;officePending=null}
function submitCustomOffice(){
  const input=document.getElementById('customOfficeInput');
  const raw=(input?.value||'').trim();
  if(!raw){toast('Digite o nome do Ofício.');return}
  const cleanName=raw.replace(/^of[ií]cio\s*\(?/i,'').replace(/\)$/,'').trim();
  if(!cleanName){toast('Digite um nome válido para o Ofício.');return}
  const id=normalizeOfficeId(cleanName);
  if(!id){toast('Nome de Ofício inválido.');return}
  if(skillRequirementMet(officeToken(id))){
    toast('Esta especialização de Ofício ('+cleanName+') já foi treinada.');
    return;
  }
  const displayLabel=OFFICE_LABEL[id]||('Ofício ('+cleanName.charAt(0).toUpperCase()+cleanName.slice(1)+')');
  OFFICE_LABEL[id]=displayLabel;
  applyOfficeChoice(id);
}
function applyOfficeChoice(id){
  if(!officePending)return;
  const token=officeToken(id),pending=officePending;
  if(pending.source==='skill'){
    const list=state.skills[pending.group]||[],limits=skillChoiceLimits();
    if(list.length>=limits[pending.group]){toast('Todos os espaços deste grupo já foram preenchidos.');closeOfficeModal();return}
    list.push(token);state.skills[pending.group]=list;
    if(pending.group==='class'){state.skills.race=[]}
  }else if(pending.source==='class-required'){
    state.identity.classRequiredChoices[pending.index]='oficio';state.identity.classRequiredOffices[pending.index]=token;state.skills={class:[],race:[],int:state.skills.int||[]};
  }else if(pending.source==='origin-benefit'){
    if(originBenefitsCount()>=2){toast('Você pode escolher apenas dois benefícios.');closeOfficeModal();return}
    state.origin.benefits.push(pending.optionId);state.origin.officeSpecialties[pending.optionId]=token;
  }
  closeOfficeModal();renderStage();
  if(state.origin.mode==='dual'&&originBenefitsCount()>=2){
    const scrollRegional=()=>{document.querySelector('[data-field="regionalOrigin"]')?.scrollIntoView?.({behavior:'smooth',block:'center'})};
    if(typeof requestAnimationFrame==='function')requestAnimationFrame(scrollRegional);
    else setTimeout(scrollRegional,16);
  }
}
function skillChoiceLimits(){
  const cls=classById(state.identity.classId),baseCount=Number(cls?.caracteristicas?.pericias?.escolhas?.quantidade||0);
  const raceFixed=typeof raceFixedSkills==='function'?raceFixedSkills():[];
  const duplicate=mandatoryClassSkills().filter(id=>[...originSkillIds(),...regionalSkillIds(),...raceFixed].includes(id)).length;
  return{class:baseCount,int:Math.max(0,finalAttrs().int),race:raceSkillSlots(),duplicate:duplicate};
}

document.addEventListener('change',event=>{
  if(event.target.dataset.action==='skill'&&event.target.value==='oficio'&&event.target.checked){event.stopImmediatePropagation();event.target.checked=false;openOfficeModal({source:'skill',group:event.target.dataset.group});return}
  if(event.target.dataset.field==='class-required'){
    if(event.target.value==='oficio'){event.stopImmediatePropagation();openOfficeModal({source:'class-required',index:event.target.dataset.index});return}
    delete state.identity.classRequiredOffices[event.target.dataset.index];
  }
  if(event.target.dataset.action==='origin-benefit'&&event.target.checked){
    const option=originBenefitOptions(selectedStandardOrigin()).find(item=>item.id===event.target.value);
    if(option?.type==='skill'&&skillTokenFromName(option.name)==='oficio'){event.stopImmediatePropagation();event.target.checked=false;openOfficeModal({source:'origin-benefit',optionId:option.id});return}
  }
},true);
document.addEventListener('click',event=>{
  const button=event.target.closest?.('[data-action="class-fixed-office"]');
  if(!button)return;
  event.preventDefault();
  openOfficeModal({source:'class-required',index:button.dataset.index});
},true);
document.getElementById('officeCancel').addEventListener('click',()=>{closeOfficeModal();renderStage()});
document.getElementById('confirmCustomOffice')?.addEventListener('click',submitCustomOffice);
document.getElementById('customOfficeInput')?.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();event.stopImmediatePropagation();submitCustomOffice()}});
document.getElementById('officeModal').addEventListener('click',event=>{if(event.target.id==='officeModal'){closeOfficeModal();renderStage()}const option=event.target.closest?.('[data-action="office-select"]');if(option)applyOfficeChoice(option.dataset.office)});

// Catálogo guiado de poderes gerais.
const POWER_CATEGORY_ORDER=['combate','destino','magia','concedido','tormenta','raca','grupo','escolhido_dos_deuses'];
const POWER_CATEGORY_LABEL={combate:'Poderes de Combate',destino:'Poderes de Destino',magia:'Poderes de Magia',concedido:'Poderes Concedidos',tormenta:'Poderes da Tormenta',raca:'Poderes de Raça',grupo:'Poderes de Grupo',escolhido_dos_deuses:'Escolhido dos Deuses'};
function powerById(id){return DATA.generalPowers.find(power=>power.id===id)}
function chosenDeity(){return DATA.deities.find(deity=>deity.nome===state.deity.name)}
function selectedGeneralPowers(exceptId=''){const list=[...(state.powers.general||[]),...Object.values(state.powers?.originGeneral||{})];return list.filter(id=>id&&id!==exceptId).map(powerById).filter(Boolean)}
function raceAbilityText(){
  const race=raceById(state.identity.raceId),parts=[];
  (race?.habilidades?.fixas||[]).forEach(ability=>parts.push(ability.nome,ability.descricao));
  (race?.habilidades?.selecionadas||[]).forEach(def=>{parts.push(def.nome,def.descricao);const option=selectedRaceOption(def);if(option)parts.push(choiceName(option),option.descricao)});
  return parts.filter(Boolean).join(' ');
}
function classAbilityText(){const cls=classById(state.identity.classId);return (cls?.habilidades||[]).filter(ability=>Number(ability.nivel||1)<=Number(state.identity.plannedLevel||1)).flatMap(ability=>[ability.nome,ability.descricao]).filter(Boolean).join(' ')}
function ownedPowerNames(exceptId=''){
  const names=[
    ...originPowerNames(),
    ...Object.values(state.powers?.originGeneral||{}).map(id=>powerById(id)?.nome),
    ...Object.values(state.powers?.originGeneral||{}),
    ...selectedGeneralPowers(exceptId).map(power=>power.nome),
    ...selectedGeneralPowers(exceptId).map(power=>power.id),
    ...String(state.deity.power||'').split('|'),
    state.deity?.pantheonBonusPower ? (powerById(state.deity.pantheonBonusPower)?.nome || state.deity.pantheonBonusPower) : '',
    state.deity?.fundamentalistPower ? (powerById(state.deity.fundamentalistPower)?.nome || state.deity.fundamentalistPower) : ''
  ];
  (state.powers?.general || []).forEach((id, idx) => {
    if (id && id !== exceptId) {
      names.push(id);
      const p = powerById(id);
      if (p) names.push(p.nome);
    }
  });
  if (state.powers?.cosmopolitaPower && typeof selectedCosmopolitaPower === 'function') {
    const cp = selectedCosmopolitaPower();
    if (cp && cp.nome && cp.id !== exceptId) {
      names.push(cp.nome);
      names.push(cp.id);
    }
  }
  const cls=classById(state.identity.classId),race=raceById(state.identity.raceId);
  (cls?.habilidades||[]).filter(ability=>Number(ability.nivel||1)<=Number(state.identity.plannedLevel||1)).forEach(ability=>{
    names.push(ability.nome);
    names.push(ability.id);
  });
  (race?.habilidades?.fixas||[]).forEach(ability=>{
    names.push(ability.nome);
    names.push(ability.id);
  });
  racePowerGroups().forEach(group=>(state.powers.raceGroups[group.id]||[]).forEach(id=>{
    names.push(id);
    const option=group.options.find(item=>choiceId(item)===id);
    if(option)names.push(choiceName(option));
  }));
  return new Set(names.filter(Boolean).map(slug));
}
function addReason(reasons,text){if(text&&!reasons.includes(text))reasons.push(text)}
function requiredOtherPowerCount(text,category){
  const normalized=slug(text),words={um:1,uma:1,dois:2,duas:2,tres:3,quatro:4};
  const match=normalized.match(/(um|uma|dois|duas|tres|quatro|outro)\s+outros?\s+poderes?\s+d[ao]\s+(tormenta|grupo)/)||normalized.match(/(um|uma|dois|duas|tres|quatro|outro)\s+poder\s+d[ao]\s+(tormenta|grupo)/);
  if(!match||match[2]!==category)return 0;
  return match[1]==='outro'?1:(words[match[1]]||0);
}
function magicCircleAvailable(){if(!/\bmagias?\b/i.test(classAbilityText()))return 0;return Math.min(5,1+Math.floor((Math.max(1,Number(state.identity.plannedLevel))-1)/4))}
function generalPowerEligibility(power, exceptId=''){
  if(power?.id==='carga_de_cavalaria'&&state.identity.raceId==='centauro')return{ok:true,reasons:[]};
  const reasons=[],requirements=String(power.preRequisitosTexto||'').trim(),normalized=slug(requirements),attrs=finalAttrs(),trained=allTrainedSkills(),race=raceById(state.identity.raceId),cls=classById(state.identity.classId),deity=chosenDeity(),owned=ownedPowerNames(exceptId||power.id);
  const currentSlotId = typeof state !== 'undefined' && state.powers?.general ? (state.powers.general[Number(state.powers.activeSlot||0)] || '') : '';
  const isCurrentSlotPower = (exceptId && power.id === exceptId) || (currentSlotId && power.id === currentSlotId);
  if (!isCurrentSlotPower && owned.has(slug(power.nome))) addReason(reasons, 'Você já possui este poder.');
  if(power.categoria==='concedido'&&(!deity||!(deity.poderes_concedidos||[]).some(name=>slug(name)===slug(power.nome))))addReason(reasons,'O poder não é concedido pela divindade escolhida.');
  if(power.categoria==='raca'){
    const source=String(power.racasTexto||''),allowed=source.split(',').map(slug).filter(Boolean);
    const raceSlugs=[slug(race?.nome||'')];
    if(['meio_elfo','meio-elfo'].includes(state.identity.raceId)||raceSlugs.includes('meio-elfo')||raceSlugs.includes('meio_elfo'))raceSlugs.push('elfo');
    if(['meio_orc','meio-orc'].includes(state.identity.raceId)||raceSlugs.includes('meio-orc')||raceSlugs.includes('meio_orc'))raceSlugs.push('orc');
    if(source&&slug(source)!=='varias'&&!allowed.some(a=>raceSlugs.includes(a)))addReason(reasons,'Disponível para: '+source+'.');
  }
  const attrPattern=/\b(For(?:ça)?|Des(?:treza)?|Con(?:stituição)?|Int(?:eligência)?|Sab(?:edoria)?|Car(?:isma)?)\s*([+-]?\d+)(\s+ou\s+menor)?/gi;
  for(const match of requirements.matchAll(attrPattern)){
    const id=slug(match[1]).slice(0,3),attrId={for:'for',des:'des',con:'con',int:'int',sab:'sab',car:'car'}[id],value=Number(match[2]),valid=match[3]?attrs[attrId]<=value:attrs[attrId]>=value;
    if(!valid)addReason(reasons,ATTR_LABEL[attrId]+' '+value+(match[3]?' ou menor':'')+'.');
  }
  const level=Number((requirements.match(/(\d+)\s*[º°]?\s*nível/i)||[])[1]||0);
  if(level&&Number(state.identity.plannedLevel)<level)addReason(reasons,'Requer nível '+level+' de personagem.');
  const parsed=parsePowerRequirements(power);
  (parsed.skillGroups||[]).forEach(group=>{if(!group.some(skillRequirementMet))addReason(reasons,'Treinamento em '+group.map(skillDisplayName).join(' ou ')+'.')});
  if(/treinado na perícia escolhida/i.test(requirements)&&!trained.length)addReason(reasons,'Requer treinamento na perícia escolhida.');
  const circle=Number((requirements.match(/magias?\s+de\s+(\d+)[º°]?\s+círculo/i)||[])[1]||0);
  if(circle&&magicCircleAvailable()<circle)addReason(reasons,'Requer lançar magias de '+circle+'º círculo.');
  if(/habilidade de classe Magias|\blançar magias\b/i.test(requirements)&&!magicCircleAvailable())addReason(reasons,'Requer a habilidade de classe Magias.');
  if(/lançar magias divinas/i.test(requirements)&&!['clerigo','frade','druida','ermitao','paladino','santo','usurpador'].includes(cls?.id))addReason(reasons,'Requer lançar magias divinas.');
  const proficiencies=typeof characterProficiencies==='function'?characterProficiencies():cls?.caracteristicas?.proficiencias||[];
  if(/proficiência com armaduras pesadas/i.test(requirements)&&!proficiencies.includes('armaduras_pesadas'))addReason(reasons,'Requer proficiência com armaduras pesadas.');
  if(/proficiência com escudos/i.test(requirements)&&!proficiencies.includes('escudos'))addReason(reasons,'Requer proficiência com escudos.');
  if(/proficiência com armas marciais/i.test(requirements)&&!proficiencies.includes('armas_marciais'))addReason(reasons,'Requer proficiência com armas marciais.');
  if(/proficiência com armas de fogo/i.test(requirements)&&!proficiencies.includes('armas_de_fogo'))addReason(reasons,'Requer proficiência com armas de fogo.');
  if(/proficiência com armas exóticas/i.test(requirements)&&!proficiencies.some(item=>item==='armas_exoticas'||String(item).startsWith('armas_exoticas:')))addReason(reasons,'Requer proficiência com armas exóticas.');
  if(/proficiência com a arma/i.test(requirements)&&!proficiencies.some(item=>/^armas_/.test(item))&&!cls)addReason(reasons,'Requer proficiência com a arma escolhida.');
  const raceText=raceAbilityText(),classText=classAbilityText();
  if(/arma natural fornecida/i.test(requirements)&&!/arma natural|mordida|chifres|garras|cauda/i.test(raceText))addReason(reasons,'Requer uma arma natural fornecida pela raça.');
  if(/possuir asas/i.test(requirements)&&!/asas|voo|voar/i.test(raceText))addReason(reasons,'Requer asas.');
  if(/possuir um familiar/i.test(requirements)&&!/familiar/i.test(raceText+' '+classText))addReason(reasons,'Requer possuir um familiar.');
  if(/sensibilidade a luz/i.test(requirements)&&!/sensibilidade a luz/i.test(raceText))addReason(reasons,'Requer Sensibilidade a Luz racial.');
  if(/não humano/i.test(requirements)&&state.identity.raceId==='humano')addReason(reasons,'Requer uma raça não humana.');
  if(/devoto de uma divindade que canalize energia positiva/i.test(requirements)&&(!deity||!['positiva','qualquer'].includes(slug(deity.canalizar_energia))))addReason(reasons,'Requer devoção a uma divindade que canalize energia positiva.');
  for(const category of ['tormenta','grupo']){
    const required=requiredOtherPowerCount(requirements,category),amount=selectedGeneralPowers(power.id).filter(item=>item.categoria===category).length;
    if(required&&amount<required)addReason(reasons,'Requer '+required+' outro(s) '+POWER_CATEGORY_LABEL[category].toLowerCase()+'.');
  }
  const candidates=DATA.generalPowers.filter(candidate=>candidate.id!==power.id&&candidate.id!=='proficiencia'&&slug(candidate.nome)!=='proficiencia'&&normalized.includes(slug(candidate.nome))).sort((a,b)=>b.nome.length-a.nome.length);
  const unique=[];candidates.forEach(candidate=>{if(!unique.some(other=>slug(other.nome).includes(slug(candidate.nome))))unique.push(candidate)});
  if(unique.length){
    const hasOr=/\bou\b/i.test(requirements);
    if(hasOr){if(!unique.some(candidate=>owned.has(slug(candidate.nome))||owned.has(candidate.id)))addReason(reasons,'Requer um destes poderes: '+unique.map(candidate=>candidate.nome).join(' ou ')+'.')}
    else unique.forEach(candidate=>{if(!owned.has(slug(candidate.nome))&&!owned.has(candidate.id))addReason(reasons,'Requer '+candidate.nome+'.')});
  }
  let masterPermissionNotice = '';
  if(power.categoria === 'escolhido_dos_deuses'){
    const isOriginGod = typeof hasCriacaoDosDeuses === 'function' && hasCriacaoDosDeuses() &&
      (slug(power.id) === 'escolhido_de_' + slug(typeof selectedCriacaoDosDeusesDeity === 'function' ? selectedCriacaoDosDeusesDeity() : '') ||
       power.id === (typeof getCriacaoDosDeusesPowerOption === 'function' ? getCriacaoDosDeusesPowerOption()?.powerId : ''));
    if(!isOriginGod){
      masterPermissionNotice = 'Requer permissão do mestre (ter prestado um serviço de grande importância ao deus escolhido).';
    }
  }
  return{ok:reasons.length===0,reasons,masterPermissionNotice};
}
function renderPowerRows(entries, status, isAllCategory = false){
  const currentSlotId = state.powers.general[Number(state.powers.activeSlot||0)] || '';
  const renderSingleRow = (entry: any) => {
    const isChosenElsewhere = entry.status === 'chosen';
    const isCurrentSlotSelected = entry.power.id === currentSlotId;
    const isChosen = isChosenElsewhere || isCurrentSlotSelected;
    const isCurrentPreview = entry.power.id === state.powers.previewId;
    const isLocked = entry.status === 'locked';

    let rowClass = 'power-row';
    if (isCurrentPreview) rowClass += ' selected';
    if (isChosen) rowClass += ' chosen';
    if (isLocked) rowClass += ' locked';

    const tagHtml = isChosenElsewhere
      ? '<span class="tag gold" style="font-size:0.58rem;padding:1px 5px;margin-left:auto;">Já adquirido</span>'
      : '';

    return '<button type="button" class="'+rowClass+'" data-action="power-preview" data-power-id="'+entry.power.id+'" data-search="'+esc(slug(entry.power.nome+' '+entry.power.preRequisitosTexto))+'"><span style="display:flex;align-items:center;justify-content:space-between;width:100%;gap:6px"><strong>'+esc(entry.power.nome)+'</strong>'+tagHtml+'</span></button>';
  };

  if (isAllCategory) {
    const rows = entries.filter((entry: any) => status === 'all' || entry.status === status).sort((a: any, b: any) => a.power.nome.localeCompare(b.power.nome, 'pt-BR'));
    return rows.map(renderSingleRow).join('');
  }

  return POWER_CATEGORY_ORDER.map(category=>{
    const rows=entries.filter((entry: any)=>entry.power.categoria===category&&(status==='all'||entry.status===status)).sort((a: any,b: any)=>a.power.nome.localeCompare(b.power.nome,'pt-BR'));
    if(!rows.length)return '';
    return '<section class="power-category"><h4>'+esc(POWER_CATEGORY_LABEL[category])+'</h4>'+rows.map(renderSingleRow).join('')+'</section>';
  }).join('');
}
function generalPowerSlotSourceText(index){
  const raceSlots=typeof raceGeneralPowerSlots==='function'?raceGeneralPowerSlots():(typeof generalPowerSlots==='function'?generalPowerSlots():0);
  const race=raceById(state.identity.raceId);
  if(index<raceSlots){
    return 'Raça: '+(race?.nome||'Raça');
  }
  const originChoices=typeof originChoicePowerList==='function'?originChoicePowerList():[];
  const originRelIndex=index-raceSlots;
  if(originRelIndex>=0&&originRelIndex<originChoices.length){
    const stdOrigin=selectedStandardOrigin();
    const req=originChoices[originRelIndex];
    const catLabel=req?.category?(POWER_CATEGORY_LABEL[req.category]||req.category):'Poder Geral';
    return 'Origem: '+(stdOrigin?.nome||'Origem');
  }
  const baseCount = raceSlots + originChoices.length;
  const agePowers = Number(state.age?.enabled && ['adulto','maduro','velho','anciao'].includes(state.age?.band) && (state.age?.complications||[]).length > 0 ? 1 : 0);
  if(index >= baseCount && index < baseCount + agePowers){
    return 'Idade: Já Vi Coisas';
  }
  const indActive = Boolean(state.complicacoesIndividual || state.regrasCampanha?.complicacoes || state.regrasCampanha?.complicacaoIndividual);
  if(indActive && Array.isArray(state.generalComplications)){
    const compIdx = index - (baseCount + agePowers);
    if(compIdx >= 0 && compIdx < state.generalComplications.length){
      const compId = state.generalComplications[compIdx];
      const COMP_NAME_MAP: Record<string, string> = {
        amaldicoado: 'Amaldiçoado', apetitoso: 'Apetitoso', assombrado: 'Assombrado',
        cabeca_quente: 'Cabeça Quente', caolho: 'Caolho', chato: 'Chato',
        combalido: 'Combalido', covarde: 'Covarde', cria_de_nimb: 'Cria de Nimb',
        criado_na_cidade: 'Criado na Cidade', crise_de_fe: 'Crise de Fé', desprotegido: 'Desprotegido',
        distraido: 'Distraído', emotivo: 'Emotivo', expurgo_de_wynna: 'Expurgo de Wynna',
        fracote: 'Fracote', hedonista: 'Hedonista', hesitante: 'Hesitante',
        ignorante: 'Ignorante', inimigo_do_panteao: 'Inimigo do Panteão', ingenuo: 'Ingênuo',
        insolente: 'Insolente', maneta: 'Maneta', miope: 'Míope',
        pauperrimo: 'Paupérrimo', pesado: 'Pesado', solitario: 'Solitário',
        tolo: 'Tolo', vagaroso: 'Vagaroso'
      };
      const compList = typeof GENERAL_COMPLICATIONS !== 'undefined' ? GENERAL_COMPLICATIONS : (typeof window !== 'undefined' ? (window as any).GENERAL_COMPLICATIONS : []);
      const compItem = Array.isArray(compList) ? compList.find((c: any) => c[0] === compId) : null;
      const compName = compItem ? compItem[1] : (COMP_NAME_MAP[compId] || (compId ? compId.replace(/_/g, ' ') : 'Complicação'));
      return 'Complicação: ' + compName;
    }
  }
  if(state.age?.enabled&&state.age?.band){
    return 'Idade: '+state.age.band;
  }
  if(state.complicacoesIndividual || (state.regrasCampanha?.complicacoes && (state.age?.complications||[]).length > 0)){
    return 'Complicação permanente';
  }
  return 'Poder geral adicional';
}
function getGeneralPowerListContent(searchQueryOverride?: string) {
  const slots = typeof generalPowerSlots === 'function' ? generalPowerSlots() : 1;
  const currentSlot = Math.max(0, Math.min(slots - 1, Number(state.powers.activeSlot || 0)));
  const slotReq = typeof originPowerSlotRequirement === 'function' ? originPowerSlotRequirement(currentSlot) : null;
  const initialCategory = slotReq?.category ? (slotReq.category === 'combate_ou_tormenta' ? 'combate' : slotReq.category) : 'all';

  const searchInput = (typeof document !== 'undefined') ? document.getElementById('generalPowerSearch') as HTMLInputElement | null : null;
  const rawQuery = (typeof searchQueryOverride === 'string')
    ? searchQueryOverride
    : (searchInput ? searchInput.value : String(state.powers.searchQuery || ''));
  const query = slug(rawQuery.trim());
  const isSearching = Boolean(query);

  const baseCategory = state.powers.categoryFilter || initialCategory;
  const baseStatus = state.powers.statusFilter || 'available';

  const category = isSearching ? 'all' : baseCategory;
  const status = isSearching ? 'all' : baseStatus;
  const isAllCat = category === 'all';

  const otherChosenIds = (state.powers.general || []).filter((id, i) => i !== currentSlot && Boolean(id));
  const currentSlotPowerId = state.powers.general[currentSlot] || '';
  const currentSlotPower = currentSlotPowerId ? powerById(currentSlotPowerId) : null;
  const currentSlotPowerNameSlug = currentSlotPower ? slug(currentSlotPower.nome) : '';
  const owned = ownedPowerNames(currentSlotPowerId);

  const entries = DATA.generalPowers.filter(power => {
    if (otherChosenIds.includes(power.id)) return false;
    const isCurrent = power.id === currentSlotPowerId || (currentSlotPowerNameSlug && slug(power.nome) === currentSlotPowerNameSlug);
    if (!isCurrent && (owned.has(slug(power.nome)) || owned.has(power.id))) return false;
    if (category !== 'all' && power.categoria !== category) return false;
    if (isSearching) {
      const matchName = slug(power.nome).includes(query);
      if (!state.powers.searchRelated) {
        return matchName;
      }
      const matchPrereq = slug(power.preRequisitosTexto || '').includes(query);
      const matchId = slug(power.id).includes(query);
      const matchDesc = slug(power.descricao || '').includes(query);
      return matchName || matchPrereq || matchId || matchDesc;
    }
    return true;
  }).map(power => {
    const verdict = generalPowerEligibility(power, currentSlotPowerId);
    return { power, verdict, status: verdict.ok ? 'available' : 'locked' };
  });

  const visible = entries.filter(entry => {
    if (status === 'available') return entry.status === 'available';
    if (status === 'locked') return entry.status === 'locked';
    return true;
  });

  const availableRows = (status === 'locked') ? '' : renderPowerRows(visible, 'available', isAllCat);
  const lockedRows = (status === 'available') ? '' : renderPowerRows(visible, 'locked', isAllCat);

  let emptyHtml = '';
  if (!availableRows && !lockedRows) {
    if (isSearching) {
      emptyHtml = '<div class="empty">Nenhum poder encontrado para "' + esc(rawQuery.trim()) + '".</div>';
    } else {
      emptyHtml = '<div class="empty">Nenhum poder corresponde aos filtros.</div>';
    }
  }

  const html = (availableRows ? availableRows : '') +
    (lockedRows ? '<div class="power-status locked" style="margin:11px 0 8px">Pré-requisitos pendentes</div>' + lockedRows : '') +
    emptyHtml;

  return { html, entries, rawQuery };
}

function renderGeneralPowerBrowser(slots){
  const currentSlot=Math.max(0,Math.min(slots-1,Number(state.powers.activeSlot||0)));
  const slotReq = typeof originPowerSlotRequirement === 'function' ? originPowerSlotRequirement(currentSlot) : null;
  const initialCategory = slotReq?.category ? (slotReq.category === 'combate_ou_tormenta' ? 'combate' : slotReq.category) : 'all';
  const category=state.powers.categoryFilter||initialCategory,status=state.powers.statusFilter||'available';
  const currentSlotPowerId = state.powers.general[currentSlot] || '';

  const { html: listHtml, entries, rawQuery } = getGeneralPowerListContent();

  let preview=state.powers.previewId?powerById(state.powers.previewId):null;
  const previewEntry=preview ? (entries.find(entry=>entry.power.id===preview.id) || { power: preview, verdict: generalPowerEligibility(preview, currentSlotPowerId), status: 'available' }) : null;
  const selectedPowerId=state.powers.general[currentSlot],isSelected=preview&&selectedPowerId===preview.id;
  const sourceText=generalPowerSlotSourceText(currentSlot);
  const hasPrev=currentSlot>0;
  const hasNext=Boolean(state.powers.general[currentSlot])&&currentSlot<slots-1;
  const hiddenNavBar='<div class="sequential-power-nav" style="display:none"><button type="button" data-action="general-power-prev" '+(hasPrev?'':'disabled')+'>Anterior</button>Fonte: '+esc(sourceText)+'<button type="button" data-action="general-power-next" '+(hasNext?'':'disabled')+'>Próximo</button></div>';
  const slotIndicator = slots > 1
    ? '<div style="font-size:0.8rem;color:var(--gold2);font-weight:700;margin-bottom:8px">Poder ' + (currentSlot + 1) + ' de ' + slots + ' <span style="font-weight:400;color:var(--muted)">· ' + esc(sourceText) + '</span></div>'
    : '';

  const POWER_CATEGORIES_LIST = [
    { id: 'all', label: 'Todos' },
    { id: 'combate', label: 'Combate' },
    { id: 'destino', label: 'Destino' },
    { id: 'magia', label: 'Magia' },
    { id: 'concedido', label: 'Poderes Concedidos' },
    { id: 'tormenta', label: 'Tormenta' },
    { id: 'raca', label: 'Raça' },
    { id: 'grupo', label: 'Grupo' },
    { id: 'escolhido_dos_deuses', label: 'Escolhido dos Deuses' },
    { id: 'ver_tudo', label: 'Ver tudo' }
  ];

  const isDrawerOpen = Boolean(state.powers.drawerOpen);

  const drawerHtml = '<aside class="power-filters-drawer ' + (isDrawerOpen ? 'open' : '') + '">' +
    '<div class="power-drawer-header">' +
      '<span class="power-drawer-title">CATEGORIAS</span>' +
      '<button type="button" class="power-drawer-close-btn" data-action="toggle-power-filters" title="Fechar menu de filtros" aria-label="Fechar">' +
        '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
      '</button>' +
    '</div>' +
    '<div class="power-drawer-body">' +
      '<div class="power-cat-list">' +
        POWER_CATEGORIES_LIST.map(cat => {
          const isVerTudo = cat.id === 'ver_tudo';
          const isActive = isVerTudo
            ? (status === 'all')
            : (status !== 'all' && category === cat.id);
          return '<button type="button" class="power-cat-btn ' + (isActive ? 'active' : '') + '" data-action="power-filter-category" data-value="' + cat.id + '">' +
            esc(cat.label) +
          '</button>';
        }).join('') +
      '</div>' +
    '</div>' +
    /* Elementos ocultos para compatibilidade com testes que procuram seletores legados */
    '<div style="display:none;" class="power-filterbar">' +
      '<button type="button" class="filter-chip ' + (status === 'available' ? 'active' : '') + '" data-action="power-filter-status" data-value="available">Disponíveis</button>' +
      '<button type="button" class="filter-chip ' + (status === 'locked' ? 'active' : '') + '" data-action="power-filter-status" data-value="locked">Pré-requisito pendente</button>' +
      '<button type="button" class="filter-chip ' + (status === 'all' ? 'active' : '') + '" data-action="power-filter-status" data-value="all">Ver tudo</button>' +
      '<button type="button" data-action="power-filter-toggle-all"></button>' +
    '</div>' +
  '</aside>';

  const isRelated = Boolean(state.powers.searchRelated);
  const searchPlaceholder = isRelated
    ? 'Buscar por nome, texto ou pré-requisito…'
    : 'Buscar pelo nome do poder…';

  const list = '<div>' +
    '<div class="power-search-row" style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">' +
      '<button type="button" class="power-filter-trigger-btn ' + (isDrawerOpen ? 'active' : '') + '" data-action="toggle-power-filters" title="Abrir menu de filtros">' +
        '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>' +
        '<span>Filtros' + (category !== 'all' || status === 'all' ? ' •' : '') + '</span>' +
      '</button>' +
      '<input class="input search" id="generalPowerSearch" placeholder="' + esc(searchPlaceholder) + '" value="' + esc(rawQuery) + '" autocomplete="off" spellcheck="false" style="margin-bottom:0;flex:1;">' +
      '<button type="button" class="power-search-mode-btn ' + (isRelated ? 'active' : '') + '" id="powerRelatedSearchBtn" data-action="toggle-power-related-search" aria-pressed="' + isRelated + '" title="Buscar também dentro da descrição e pré-requisitos dos poderes">' +
        'Pesquisa relativa' +
      '</button>' +
    '</div>' +
    '<div class="power-list">' +
      listHtml +
    '</div>' +
  '</div>';

  const detail = renderGeneralPowerDetailHtml(preview, currentSlot, currentSlotPowerId, previewEntry);

  return hiddenNavBar + drawerHtml + '<div class="power-stage-wrapper">' +
    slotIndicator +
    '<div class="power-layout-split">' +
      '<div class="power-main-content"><div class="power-browser">' + list + detail + '</div></div>' +
    '</div>' +
  '</div>';
}

function renderGeneralPowerDetailHtml(preview: any, currentSlot: number, currentSlotPowerId: string, previewEntry: any) {
  let actions='';
  if(preview&&previewEntry){
    if(previewEntry.verdict.ok){
      actions=state.powers.general[currentSlot]===preview.id
        ?''
        :'<p class="power-confirm-hint">Clique em Avançar para confirmar este poder.</p>';
    }
  }
  let proficiencyChoiceHtml='';
  if(preview?.id==='proficiencia'||state.powers.general[currentSlot]==='proficiencia'){
    const curChoice=state.powers.generalChoices?.[currentSlot]||'';
    const profOptions=typeof getAvailableProficiencyOptions==='function'
      ? getAvailableProficiencyOptions(state.identity?.classId, curChoice)
      : [];
    proficiencyChoiceHtml='<div class="field" style="margin-top:8px;background:rgba(24,17,20,0.6);border:1px solid #4a252a;border-radius:6px;padding:10px;">'
      + '<label style="display:block;font-size:0.78rem;font-weight:700;color:var(--gold2);margin-bottom:6px;text-transform:uppercase;">Escolha a Proficiência</label>'
      + '<select class="select" data-action="general-proficiency-choice" data-slot="'+currentSlot+'" style="width:100%;min-height:36px;background:#090708;border:1px solid #4a252a;color:var(--cream);">'
      + '<option value="">Selecione uma proficiência...</option>'
      + profOptions.map(opt=>'<option value="'+opt.id+'" '+(opt.id===curChoice?'selected':'')+'>'+esc(opt.name)+'</option>').join('')
      + '</select>'
      + '</div>';
  }
  const masterNotice=previewEntry?.verdict?.masterPermissionNotice?'<div class="warning-box gold" style="margin-top:8px;font-size:0.75rem;"><strong>Aviso de Requisito:</strong> '+esc(previewEntry.verdict.masterPermissionNotice)+'</div>':'';

  const POWER_CATEGORY_SINGULAR: Record<string, string> = {
    combate: 'Poder de Combate',
    destino: 'Poder de Destino',
    magia: 'Poder de Magia',
    concedido: 'Poder Concedido',
    tormenta: 'Poder da Tormenta',
    raca: 'Poder de Raça',
    grupo: 'Poder de Grupo',
    escolhido_dos_deuses: 'Escolhido dos Deuses'
  };

  const catSingular = preview ? (POWER_CATEGORY_SINGULAR[preview.categoria] || preview.categoria) : '';
  const bookName = preview ? ((typeof BOOKS !== 'undefined' && BOOKS[preview.livroOrigemId]) || preview.livroOrigemId || 'Livro Básico') : '';

  return preview?'<aside class="power-detail-panel">' +
    '<div class="power-detail-meta">' +
      '<span class="power-meta-cat">'+esc(catSingular)+'</span>' +
      '<span class="power-meta-book">'+esc(bookName)+'</span>' +
    '</div>' +
    '<h4>'+esc(preview.nome)+'</h4>' +
    '<p class="power-detail-desc">'+esc(preview.descricao||'Descrição não cadastrada.')+'</p>' +
    '<p class="power-detail-prereq"><strong>Pré-requisitos:</strong> '+esc(preview.preRequisitosTexto||'Nenhum')+'</p>' +
    proficiencyChoiceHtml +
    (!previewEntry?.verdict.ok&&previewEntry?.status!=='chosen'?'<div class="power-status locked" style="display:block;">'+esc(previewEntry?.verdict.reasons.join(' '))+'</div>':'') +
    masterNotice +
    (actions ? '<div class="power-detail-footer">' + actions + '</div>' : '') +
  '</aside>':'<aside class="power-detail-panel"><div class="empty">Selecione um poder na lista para ver os detalhes e adicioná-lo à sua ficha.</div></aside>';
}

function renderGeneralPowerDetail(previewId: string, currentSlotOverride?: number) {
  const slots = typeof generalPowerSlots === 'function' ? generalPowerSlots() : 1;
  const currentSlot = currentSlotOverride ?? Math.max(0, Math.min(slots - 1, Number(state.powers.activeSlot || 0)));
  const currentSlotPowerId = state.powers.general[currentSlot] || '';
  const preview = previewId ? powerById(previewId) : null;
  const verdict = preview ? generalPowerEligibility(preview, currentSlotPowerId) : { ok: true, reasons: [] };
  const previewEntry = preview ? { power: preview, verdict, status: verdict.ok ? 'available' : 'locked' } : null;
  return renderGeneralPowerDetailHtml(preview, currentSlot, currentSlotPowerId, previewEntry);
}

function previewGeneralPower(powerId: string, options: { fromKeyboard?: boolean } = {}) {
  state.powers.previewId = powerId;
  state.powers.previewPending = false;

  const listContainer = document.querySelector('.power-list');
  const existingDetail = document.querySelector('.power-detail-panel');

  if (listContainer && existingDetail) {
    const buttons = listContainer.querySelectorAll('[data-action="power-preview"]');
    let targetButton: HTMLElement | null = null;
    buttons.forEach((b: any) => {
      if (b.dataset.powerId === powerId) {
        b.classList.add('selected');
        targetButton = b;
      } else {
        b.classList.remove('selected');
      }
    });

    const newHtml = renderGeneralPowerDetail(powerId);
    existingDetail.outerHTML = newHtml;

    if (options.fromKeyboard && targetButton) {
      targetButton.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
    }

    if (typeof (globalThis as any).syncNextButtonState === 'function') {
      (globalThis as any).syncNextButtonState();
    }
    return;
  }

  if (typeof renderStage === 'function') renderStage();
}
(globalThis as any).previewGeneralPower = previewGeneralPower;
(globalThis as any).renderGeneralPowerDetail = renderGeneralPowerDetail;
(globalThis as any).renderGeneralPowerDetailHtml = renderGeneralPowerDetailHtml;

function fastUpdatePowerList(queryOverride?: string){
  const listContainer = document.querySelector('.power-list');
  if(!listContainer) {
    if(typeof renderStage === 'function') renderStage();
    return;
  }
  const { html } = getGeneralPowerListContent(queryOverride);
  listContainer.innerHTML = html;
  if(typeof (globalThis as any).positionPowerDetail === 'function'){
    (globalThis as any).positionPowerDetail();
  }
}
(globalThis as any).fastUpdatePowerList = fastUpdatePowerList;
(globalThis as any).getGeneralPowerListContent = getGeneralPowerListContent;

renderPowers=function(){
  const groups=racePowerGroups(),slots=generalPowerSlots();let html='';
  groups.forEach(group=>{const selected=state.powers.raceGroups[group.id]||[];html+=panel(group.name,'<p class="help" style="margin-bottom:9px">'+esc(group.description||'Escolha os poderes raciais exigidos.')+'</p><div class="choice-cards">'+group.options.map(option=>{const id=choiceId(option),active=selected.includes(id);return '<label class="choice-card '+(active?'selected':'')+'"><input type="checkbox" data-action="race-power" data-group="'+esc(group.id)+'" value="'+esc(id)+'" '+(active?'checked':'')+'><strong>'+esc(choiceName(option))+'</strong><p>'+esc(option.descricao||'')+'</p></label>'}).join('')+'</div>','Selecionados: '+selected.length+'/'+group.quantity)});
  if(slots)html+=panel('',renderGeneralPowerBrowser(slots),'');
  if(!html)html=panel('Nenhuma escolha pendente','<div class="info-box">Sua raça e origem não exigem escolhas adicionais de poderes nesta fase.</div>');
  return html;
};

// Divindade escolhida a partir do poder concedido, conforme o fluxo da planilha.
function deityAccepts(deity){
  if(state.tableRules?.openDevotion||state.deity?.masterPermission)return true;
  if(slug(deity?.nome)==='thwor')return true;
  const cls=classById(state.identity.classId),race=raceById(state.identity.raceId),races=deity?.devotos?.racas||[],classes=deity?.devotos?.classes||[];
  if(['clerigo','frade'].includes(cls?.id))return true;
  return races.some(name=>['todas','todos'].includes(slug(name))||slug(name)===slug(race?.nome))||classes.some(name=>['todas','todos'].includes(slug(name))||slug(name)===slug(cls?.nome));
}
function grantedPowerData(name){
  const aliases: Record<string, string>={tropas_duyshidakk:'trocas_duyshidakk',trocas_duyshidakk:'tropas_duyshidakk'},normalized=slug(name);
  return DATA.generalPowers.find(power=>power.categoria==='concedido'&&slug(power.nome)===normalized)||DATA.generalPowers.find(power=>power.categoria==='concedido'&&slug(power.nome)===aliases[normalized]);
}
function deityPowerValues(){return String(state.deity.power||'').split('|').slice(0,deityPowerCount())}
function setDeityPower(index,value){const values=deityPowerValues();while(values.length<deityPowerCount())values.push('');values[index]=value;state.deity.power=values.join('|');if(typeof syncPartnersFromChoices==='function')syncPartnersFromChoices()}
function allGrantedPowerNames(){return [...new Set(DATA.deities.flatMap(deity=>deity.poderes_concedidos||[]))].sort((a,b)=>a.localeCompare(b,'pt-BR'))}
function grantedPowerPairs(deity=null){
  let godList = deity ? [deity] : DATA.deities;
  if(!deity && state.deity?.strictAcceptedOnly){
    godList = godList.filter(deityAccepts);
  }
  return godList.flatMap(god=>(god.poderes_concedidos||[]).map(powerName=>({deity:god,powerName,data:grantedPowerData(powerName)}))).sort((a,b)=>a.powerName.localeCompare(b.powerName,'pt-BR')||a.deity.nome.localeCompare(b.deity.nome,'pt-BR'));
}
function deitySelectionStatus(deityName,powerName){
  const deity=DATA.deities.find(item=>item.nome===deityName),index=Number(state.deity.activePowerIndex||0);
  if(!deity||(deity.poderes_concedidos||[]).every(name=>slug(name)!==slug(powerName)))return{valid:false,message:'Este poder não pertence à divindade.'};
  if(!Number.isInteger(index)||index<0||index>=deityPowerCount())return{valid:false,message:'Escolha um espaço válido para o poder.'};
  const values=state.deity.name===deityName?deityPowerValues():[];
  if(values.some((name,i)=>i!==index&&name&&slug(name)===slug(powerName)))return{valid:false,message:'Este poder já foi escolhido em outro espaço.'};
  return{valid:true,selected:slug(values[index]||'')===slug(powerName)};
}
function renderDeityPowerDetail(powerName,deityName){
  const deity=DATA.deities.find(item=>item.nome===deityName);if(!powerName||!deity)return '<aside class="power-detail-panel"><div class="empty">Selecione um poder concedido à esquerda para conferir a divindade, suas obrigações e demais informações.</div></aside>';
  const data=grantedPowerData(powerName),accepts=deityAccepts(deity),isThwor=slug(deity.nome)==='thwor',warning='Esse deus não te aceita como devoto, mas se você rezar muito insistindo (e com a permissão do mestre)... Talvez ele te aceite. OBS: Ative a regra Devoções Abertas.';
  const fundText=typeof ForjaUnificada!=='undefined'&&typeof ForjaUnificada.getFundamentalistText==='function'?ForjaUnificada.getFundamentalistText(deity.nome):'';
  const showFund=Boolean(state.deity?.fundamentalist)&&fundText;
  const restrictedTag = !accepts ? '<span class="tag red">Devoção restrita</span>' : '';
  return '<aside class="power-detail-panel deity-detail" id="deityDetail" tabindex="-1"><div class="tag-row"><span class="tag gold">'+esc(powerName)+'</span>'+(data?bookTag(data.livroOrigemId):'')+'</div><div class="deity-god-option '+(accepts?'':'restricted')+'"><h4>'+esc(deity.nome)+'</h4><div class="tag-row">'+restrictedTag+'<span class="tag">Energia '+esc(deity.canalizar_energia||'—')+'</span></div><p><strong>Símbolo sagrado:</strong> '+esc(deity.simbolo_sagrado||'—')+'</p><p><strong>Arma preferida:</strong> '+esc(deity.arma_preferida||'—')+'</p><p><strong>Devotos:</strong> '+esc([...(deity.devotos?.racas||[]),...(deity.devotos?.classes||[])].join(', ')||'—')+'</p><p><strong>Obrigações e restrições:</strong> '+esc(deity.obrigacoes_restricoes||'—')+'</p>'+(showFund?'<p style="margin-top:8px"><strong>Dogma Fundamentalista (+1 Poder Concedido · Apenas Arma Favorita):</strong><br>'+esc(fundText)+'</p>':'')+(!accepts?'<div class="warning-box red"><strong>'+esc(warning)+'</strong></div>':'')+(isThwor?'<div class="info-box devotion-reminder"><strong>Lembrete de Thwor:</strong> para esta devoção, considere o personagem um aliado dos duyshidakk e observe essa exigência nas obrigações acima.</div>':'')+'</div></aside>';
}
let deitySearchQuery='';