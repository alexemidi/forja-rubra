
function isCharacterEligibleForFundamentalist(){
  const allowRule = state.tableRules?.broadDevotionAndFundamentalist !== false;
  if(!allowRule) return false;
  return Boolean(state.identity.classId);
}
function renderFundamentalistTogglePanel(){
  if(!isCharacterEligibleForFundamentalist() || (state.deity.mode !== 'devout' && state.deity.mode !== 'pantheon')) return '';
  const isFund = Boolean(state.deity.fundamentalist);
  const targetDeityName = state.deity.mode === 'pantheon' ? 'Panteão' : (state.deity.name || state.deity.previewDeity || '');
  const fundText = targetDeityName && typeof ForjaUnificada !== 'undefined' && typeof ForjaUnificada.getFundamentalistText === 'function'
    ? ForjaUnificada.getFundamentalistText(targetDeityName)
    : '';
  const deityObj = state.deity.mode === 'devout' ? DATA.deities.find(d => d.nome === targetDeityName) : null;
  const favWeapon = deityObj?.arma_preferida || '';

  let detailHtml = '';
  if(isFund){
    if(state.deity.mode === 'devout'){
      detailHtml = '<div style="margin-top:10px;font-size:0.82rem;line-height:1.45;color:var(--text);">' +
        '<strong>Restrição de Arma Favorita:</strong> Fundamentalistas usam apenas a arma favorita de sua divindade' + (favWeapon ? ' (<strong>' + esc(favWeapon) + '</strong>)' : '') + '. Utilizar qualquer outra arma configura violação de seus dogmas e faz o personagem <strong>perder todos os PM (PM zerado)</strong>.' +
        (fundText ? '<p style="margin-top:8px;margin-bottom:0">' + esc(fundText) + '</p>' : '<p style="margin-top:8px;margin-bottom:0">Selecione uma divindade abaixo para ler as obrigações fundamentalistas específicas.</p>') +
      '</div>';
    } else if(state.deity.mode === 'pantheon'){
      const eligiblePowers = (DATA.generalPowers || []).filter(p => ['combate', 'destino'].includes(p.categoria));
      const chosenId = state.deity.pantheonBonusPower || '';
      const chosenPower = eligiblePowers.find(p => p.id === chosenId);
      detailHtml = '<div style="margin-top:10px;font-size:0.82rem;line-height:1.45;color:var(--text);">' +
        '<p style="margin:0">' + esc(fundText) + '</p>' +
      '</div>' +
      '<div style="margin-top:12px">' +
        '<label class="field"><span>Poder de Combate ou de Destino (Sacerdote do Panteão Fundamentalista)</span>' +
          '<select class="select" data-action="pantheon-fundamentalist-power">' +
            '<option value="">Escolha um poder de Combate ou de Destino…</option>' +
            eligiblePowers.map(p => {
              const verdict = typeof generalPowerEligibility === 'function' ? generalPowerEligibility(p) : { ok: powerMeetsAttrs(p) };
              const catLabel = p.categoria === 'combate' ? 'Combate' : 'Destino';
              return '<option value="' + esc(p.id) + '" ' + (p.id === chosenId ? 'selected' : '') + '>' + esc(p.nome) + ' (' + catLabel + ')' + (verdict.ok ? '' : ' [Pré-requisito pendente]') + '</option>';
            }).join('') +
          '</select>' +
        '</label>' +
        (chosenPower ? '<div class="power-detail" style="margin-top:8px"><strong>Pré-requisitos: ' + esc(chosenPower.preRequisitosTexto || 'Nenhum') + '</strong><br>' + esc(chosenPower.descricao || '') + '</div>' : '') +
      '</div>';
    }
  }

  return panel('Devoto Fundamentalista · Deuses de Arton',
    '<label class="check-card ' + (isFund ? 'selected' : '') + '" style="cursor:pointer;display:flex;align-items:flex-start;gap:10px">' +
      '<input type="checkbox" data-action="toggle-deity-fundamentalist" ' + (isFund ? 'checked' : '') + '>' +
      '<span>' +
        '<strong>Ser Devoto Fundamentalista</strong>' +
        '<small style="display:block;margin-top:4px">' +
          (state.deity.mode === 'pantheon'
            ? 'Recebe +1 poder de Combate ou de Destino à sua escolha, mas deve seguir o dogma fundamentalista do Panteão.'
            : 'Recebe +1 poder concedido de sua divindade (totalizando ' + (deityPowerCount() + (isFund ? 0 : 1)) + ' poderes concedidos), mas deve seguir as restrições fundamentalistas e usar apenas a arma favorita da divindade.') +
        '</small>' +
      '</span>' +
    '</label>' + detailHtml
  );
}

function renderBroadDevotionPanel(){
  if(state.deity.mode !== 'pantheon') return '';
  const allowBroad = state.tableRules?.broadDevotionAndFundamentalist !== false;
  const isBroad = allowBroad && ['clerigo','frade','druida','ermitao','paladino','santo'].includes(state.identity.classId);
  if(!isBroad) return '';
  const level = Math.max(1, Number(state.identity.plannedLevel) || 1);
  const bonusPm = typeof ForjaUnificada !== 'undefined' && typeof ForjaUnificada.calculateBroadDevotionPmBonus === 'function'
    ? ForjaUnificada.calculateBroadDevotionPmBonus(state.identity.classId, 'pantheon', level, true)
    : 2 * (level <= 4 ? 1 : level <= 10 ? 2 : level <= 16 ? 3 : 4);
  const title = typeof ForjaUnificada !== 'undefined' && typeof ForjaUnificada.getBroadDevotionTitle === 'function'
    ? ForjaUnificada.getBroadDevotionTitle(state.identity.classId)
    : 'Devoção Ampla';
  return panel(title + ' · Deuses de Arton',
    '<div class="info-box">' +
      '<strong>Regra de Devoção Ampla ativa:</strong> Clérigos e frades do Panteão, druidas de Arton e paladinos do bem não recebem poderes concedidos. Em compensação, por sua devoção ampla, recebem <strong>+2 PM por patamar</strong> (atualmente <strong>+' + bonusPm + ' PM</strong> no nível ' + level + ').' +
    '</div>'
  );
}

function renderElementalFamiliarChoicePanel(){
  const options = typeof getElementalFamiliarOptionsList === 'function' ? getElementalFamiliarOptionsList() : [];
  const chosenId = typeof getSelectedElementalFamiliarId === 'function' ? getSelectedElementalFamiliarId() : '';
  const chosenOpt = options.find(o => o.id === chosenId) || null;
  const cardsHtml = options.map(opt => {
    const active = opt.id === chosenId;
    return '<button type="button" class="choice-card ' + (active ? 'selected' : '') + '" data-action="select-familiar-elemental-choice" data-choice="' + esc(opt.id) + '" style="text-align:left;cursor:pointer;display:flex;flex-direction:column;gap:6px">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%">' +
        '<strong>' + esc(opt.name) + '</strong>' +
        '<span class="tag ' + (opt.id === 'adepto' ? 'blue' : 'gold') + '" style="font-size:0.65rem">' + esc(opt.elementLabel) + '</span>' +
      '</div>' +
      '<p style="margin:0;font-size:0.78rem;line-height:1.35">' + esc(opt.description) + '</p>' +
    '</button>';
  }).join('');
  return panel('Familiar Elemental / Espírito Arcano · Escolha seu Familiar',
    '<p class="help" style="margin-bottom:10px">Escolha se deseja receber um <strong>Parceiro Adepto Iniciante</strong> ou um dos <strong>4 Familiares Elementais</strong> (Aquin\'ne, T\'peel, Pakk ou Terrier):</p>' +
    '<div class="choice-cards" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px">' + cardsHtml + '</div>',
    chosenOpt ? ('Escolhido: ' + chosenOpt.shortName) : 'Escolha obrigatória'
  );
}
if(typeof window !== 'undefined') (window as any).renderElementalFamiliarChoicePanel = renderElementalFamiliarChoicePanel;

renderDeity=function(){
  const rule=devotionRule(),count=deityPowerCount();
  if(rule.forced==='none'){state.deity.mode='none';state.deity.name='';state.deity.power='';state.deity.fundamentalist=false;state.deity.pantheonBonusPower='';return panel('Inimigo dos Deuses','<div class="warning-box red"><strong>Não devoto obrigatório.</strong> '+esc(rule.text)+'</div>')}
  const pantheonLabel = ['druida','ermitao'].includes(state.identity.classId) ? 'Druida de Arton (Panteão)' : (['paladino','santo'].includes(state.identity.classId) ? 'Paladino do Bem (Panteão)' : 'Devoto do Panteão');
  const pantheonDesc = ['clerigo','frade','druida','ermitao','paladino','santo'].includes(state.identity.classId)
    ? 'Devoção ampla: sem poderes concedidos, mas recebe +2 PM por patamar.'
    : 'Culto ao conjunto dos deuses, conforme as regras da classe.';
  const mode=panel('Tipo de devoção','<p class="help" style="margin-bottom:10px">'+esc(rule.text)+'</p><div class="choice-cards" style="margin-top:10px">'+(!rule.forced?'<label class="choice-card '+(state.deity.mode==='none'?'selected':'')+'"><input type="radio" data-field="deityMode" value="none" '+(state.deity.mode==='none'?'checked':'')+'><span class="choice-card-icon" aria-hidden="true"><svg class="forja-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg></span><strong>Não devoto</strong><p>Sem poder concedido e sem obrigações religiosas.</p></label>':'')+'<label class="choice-card '+(state.deity.mode==='pantheon'?'selected':'')+'"><input type="radio" data-field="deityMode" value="pantheon" '+(state.deity.mode==='pantheon'?'checked':'')+'><span class="choice-card-icon" aria-hidden="true"><svg class="forja-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg></span><strong>'+esc(pantheonLabel)+'</strong><p>'+esc(pantheonDesc)+'</p></label><label class="choice-card '+(state.deity.mode==='devout'?'selected':'')+'"><input type="radio" data-field="deityMode" value="devout" '+(state.deity.mode==='devout'?'checked':'')+'><span class="choice-card-icon" aria-hidden="true"><svg class="forja-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1 1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z"/></svg></span><strong>Escolher Divindade</strong><p>Comece escolhendo um poder concedido; as divindades relacionadas aparecerão ao lado.</p></label></div>');
  if(state.deity.mode!=='devout')return mode + renderBroadDevotionPanel() + renderFundamentalistTogglePanel();
  const values=deityPowerValues(),deity=chosenDeity();
  const activeFilterName = state.deity.filterDeity !== undefined ? state.deity.filterDeity : (deity?.nome || '');
  const filterDeityObj = activeFilterName ? DATA.deities.find(d => d.nome === activeFilterName) : null;
  const pairs=grantedPowerPairs(filterDeityObj);
  let preview=pairs.find(pair=>slug(pair.powerName)===slug(state.deity.previewPower)&&pair.deity.nome===state.deity.previewDeity);
  if(!preview&&deity&&values.find(Boolean))preview=pairs.find(pair=>slug(pair.powerName)===slug(values.find(Boolean)));
  state.deity.previewPower=preview?.powerName||'';state.deity.previewDeity=preview?.deity.nome||(filterDeityObj?.nome||'');
  const slotbar='<div class="deity-slotbar">'+Array.from({length:count},(_,index)=>'<button type="button" class="filter-chip '+(state.deity.activePowerIndex===index?'active':'')+'" data-action="deity-power-slot" data-index="'+index+'">'+(values[index]?esc((index+1)+' · '+values[index]):esc((index+1)+' · Escolher poder'))+'</button>').join('')+'</div>';
  const availableGods = (state.deity?.strictAcceptedOnly ? DATA.deities.filter(deityAccepts) : DATA.deities).slice().sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR'));
  const godFilterBar = '<div class="power-filterbar deity-god-filterbar" style="margin-bottom:10px;display:flex;flex-wrap:wrap;gap:6px;align-items:center">' +
    '<span style="font-size:0.75rem;color:var(--muted);margin-right:4px;font-weight:600">Filtrar por deus:</span>' +
    '<button type="button" class="filter-chip '+(!activeFilterName?'active':'')+'" data-action="deity-filter-god" data-deity="">Todos os deuses</button>' +
    availableGods.map(g=>'<button type="button" class="filter-chip '+(activeFilterName===g.nome?'active':'')+'" data-action="deity-filter-god" data-deity="'+esc(g.nome)+'">'+esc(g.nome)+'</button>').join('') +
  '</div>';
  const cards=pairs.map(pair=>{
    const active=Boolean(state.deity.previewPower)&&slug(pair.powerName)===slug(state.deity.previewPower)&&pair.deity.nome===state.deity.previewDeity;
    const chosen=pair.deity.nome===state.deity.name&&values.some(name=>slug(name)===slug(pair.powerName));
    return '<button type="button" class="deity-power-row '+(active?'selected ':'')+(chosen?'chosen':'')+'" aria-pressed="'+active+'" aria-controls="deityDetail" data-action="deity-power-preview" data-power="'+esc(pair.powerName)+'" data-deity="'+esc(pair.deity.nome)+'" data-search="'+esc(slug(pair.powerName+' '+pair.deity.nome))+'"><span class="deity-power-heading"><strong>'+esc(pair.powerName)+'</strong><em>'+esc(pair.deity.nome)+'</em></span><small>'+esc(pair.data?.descricao||'Descrição ainda não localizada no catálogo de poderes concedidos.')+'</small></button>';
  }).join('');
  const list='<div><input class="input search" id="deityPowerSearch" aria-label="Pesquisar poder ou divindade" placeholder="Pesquisar poder ou divindade…" value="'+esc(deitySearchQuery)+'"><div class="deity-power-list">'+cards+'</div><p id="deitySearchEmpty" class="empty" hidden>Nenhum poder corresponde à pesquisa.</p></div>';
  return mode+renderFundamentalistTogglePanel()+panel('Escolha pelo poder concedido',slotbar+godFilterBar+'<div class="deity-choice-layout">'+list+renderDeityPowerDetail(state.deity.previewPower,state.deity.previewDeity)+'</div>','Selecionados: '+values.filter(Boolean).length+'/'+count);
};

function bindPowerSearch(){const input=document.getElementById('generalPowerSearch');if(input)input.addEventListener('input',()=>{const query=slug(input.value);document.querySelectorAll('.power-row').forEach(row=>row.classList.toggle('hidden',query&&!row.dataset.search.includes(query)))})}
function bindDeityPowerSearch(){
  const input=document.getElementById('deityPowerSearch');if(!input)return;
  const filter=()=>{const query=slug(input.value);deitySearchQuery=input.value;let visible=0;document.querySelectorAll('.deity-power-row').forEach(row=>{const matches=!query||row.dataset.search.includes(query);row.classList.toggle('hidden',!matches);if(matches)visible++});document.getElementById('deitySearchEmpty').hidden=visible>0};
  input.addEventListener('input',filter);filter();
}
function renderDeitySelection({showDetails=false,resetSearch=false}={}){
  const list=document.querySelector('.deity-power-list'),scrollTop=list?.scrollTop||0;
  if(resetSearch)deitySearchQuery='';
  renderStage();const updatedList=document.querySelector('.deity-power-list');if(updatedList)updatedList.scrollTop=resetSearch?0:scrollTop;
  if(showDetails&&window.matchMedia?.('(max-width: 860px)').matches){const detail=document.getElementById('deityDetail');detail?.scrollIntoView({behavior:'smooth',block:'start'});detail?.focus({preventScroll:true})}
}
function commitDeityPower(deityName,powerName,allowToggle=false){
  const deity=DATA.deities.find(item=>item.nome===deityName);
  if(deity && typeof deityAccepts==='function' && !deityAccepts(deity)){
    if(typeof (window as any).abrirModalRegrasCampanha==='function'){
      (window as any).abrirModalRegrasCampanha(false);
    }
    toast('Ative Devoções Abertas');
    return false;
  }
  const values=deityPowerValues();
  const selectedIdx=values.findIndex(p=>p&&slug(p)===slug(powerName));
  if(allowToggle && selectedIdx>=0){
    setDeityPower(selectedIdx,'');
    const updatedValues=deityPowerValues();
    if(state.deity.name===deityName && updatedValues.filter(Boolean).length===0){
      state.deity.name='';
    }
    const next=updatedValues.findIndex(v=>!v);
    if(next>=0) state.deity.activePowerIndex=next;
    state.deity.previewPower='';
    state.deity.previewDeity=state.deity.name||'';
    renderDeitySelection();
    return true;
  }
  if(state.deity.name&&state.deity.name!==deityName){
    state.deity.power='';
    state.deity.masterPermission=false;
    state.deity.activePowerIndex=0;
  }
  state.deity.name=deityName;
  state.deity.filterDeity=deityName;
  const currentSlot=Number(state.deity.activePowerIndex||0);
  const curVals=deityPowerValues();
  let targetIndex=currentSlot;
  if(curVals[currentSlot]&&curVals[currentSlot]!==powerName){
    const firstEmpty=curVals.findIndex(v=>!v);
    if(firstEmpty>=0) targetIndex=firstEmpty;
  }
  setDeityPower(targetIndex,powerName);
  const valuesAfter=deityPowerValues(),next=valuesAfter.findIndex(value=>!value);
  if(next>=0)state.deity.activePowerIndex=next;
  state.deity.previewPower=powerName;state.deity.previewDeity=deityName;renderDeitySelection();return true;
}

const baseResetDownstreamV3=resetDownstream;
resetDownstream=function(kind){
  baseResetDownstreamV3(kind);
  if(kind==='race'||kind==='class'){state.deity={mode:'',name:'',power:'',previewPower:'',previewDeity:'',activePowerIndex:0,strictAcceptedOnly:false,masterPermission:false,fundamentalist:false,pantheonBonusPower:'',familiarElementalChoice:''};state.powers.general=[];state.powers.previewId='';state.powers.activeSlot=0}
  if(kind==='race'){state.skills.race=[]}
  if(kind==='class')state.identity.classRequiredOffices={};
};

powerMissingChoices=function(){
  if(!characterHasPowerChoices())return [];
  const missing=[];
  racePowerGroups().forEach(group=>{const amount=(state.powers.raceGroups[group.id]||[]).length;if(amount!==Number(group.quantity||0))missing.push({title:group.name,message:'Escolha '+(Number(group.quantity||0)-amount)+' poder(es) que ainda faltam em '+group.name+'.',selector:'[data-action="race-power"][data-group="'+group.id+'"]'})});
  const generalMissing=generalPowerSlots()-state.powers.general.filter(Boolean).length;
  if(generalMissing>0){
    missing.push({title:'Poder geral',message:'Selecione '+generalMissing+' poder(es) geral(is) que ainda faltam.',selector:'[data-action="power-preview"], .power-browser'});
  }
  const originInGeneralCount = typeof originChoiceSlotsCount === 'function' ? originChoiceSlotsCount() : 0;
  if(originInGeneralCount === 0){
    (typeof originGeneralPowerOptions==='function'?originGeneralPowerOptions():[]).forEach(opt=>{
      if(!state.powers?.originGeneral?.[opt.id]){
        const label = opt.category === 'combate_ou_tormenta' ? 'Combate ou Tormenta' : (opt.category === 'combate' ? 'Combate' : 'Tormenta');
        missing.push({title:'Poder da origem',message:'Escolha o poder de '+label+' concedido pela origem.',selector:'[data-action="origin-general-power"][data-benefit-id="'+opt.id+'"]'});
      }
    });
  }
  if(typeof hasDuploFeerico==='function'&&hasDuploFeerico()&&!selectedDuploFeericoPower()){
    missing.push({title:'Duplo Feérico',message:'Escolha uma habilidade de classe de 1º nível para Duplo Feérico.',selector:'[data-action^="duplo-feerico"]'});
  }
  if(typeof hasCosmopolita==='function'&&hasCosmopolita()&&!selectedCosmopolitaPower()){
    missing.push({title:'Origem Cosmopolita',message:'Escolha o poder concedido pela origem Cosmopolita.',selector:'[data-action^="cosmopolita-"]'});
  }
  if(typeof hasFuturaLenda==='function'&&hasFuturaLenda()&&!selectedFuturaLendaPower()){
    missing.push({title:'Futura Lenda',message:'Escolha um poder de classe de 2º nível para a origem Futura Lenda.',selector:'[data-action^="futura-lenda-"]'});
  }
  if(typeof hasCriacaoDosDeuses==='function'&&hasCriacaoDosDeuses()&&!selectedCriacaoDosDeusesDeity()){
    missing.push({title:'Criação dos Deuses',message:'Escolha a divindade que o criou para a origem Criação dos Deuses.',selector:'[data-action="criacao-deus-preview"]'});
  }
  return missing;
};
deityMissingChoices=function(){
  const missing=[],rule=devotionRule();if(rule.forced==='none')return missing;
  if(!state.deity.mode)missing.push({title:'Tipo de devoção',message:'Escolha seu tipo de devoção (Não devoto, Panteão ou Divindade).',selector:'[data-field="deityMode"]',step:5});
  if(rule.forced==='devout'&&state.deity.mode==='none')missing.push({title:'Devoção obrigatória',message:'Esta classe exige devoção. Escolha o Panteão ou uma divindade.',selector:'[data-field="deityMode"]',step:5});
  if(state.deity.mode==='pantheon'&&state.deity.fundamentalist&&isCharacterEligibleForFundamentalist()&&!state.deity.pantheonBonusPower){
    missing.push({title:'Poder do Panteão Fundamentalista',message:'Escolha um poder de Combate ou de Destino concedido pelo Panteão fundamentalista.',selector:'[data-action="pantheon-fundamentalist-power"]',step:5});
  }
  if(state.deity.mode==='devout'&&!state.deity.name)missing.push({title:'Poder e divindade',message:'Escolha primeiro um poder concedido e depois uma das divindades apresentadas.',selector:'.deity-choice-layout',step:5});
  if(state.deity.mode==='devout'&&state.deity.name){
    const values=deityPowerValues().filter(Boolean),required=deityPowerCount(),deity=chosenDeity();
    if(values.length!==required)missing.push({title:'Poder concedido',message:'Escolha '+(required-values.length)+' poder(es) concedido(s) que ainda faltam.',selector:'[data-action="deity-power-slot"]',step:5});
    if(new Set(values.map(slug)).size!==values.length)missing.push({title:'Poder repetido',message:'Escolha poderes concedidos diferentes para cada espaço.',selector:'[data-action="deity-power-slot"]',step:5});
    if(!deity||values.some(name=>!(deity.poderes_concedidos||[]).some(power=>slug(power)===slug(name))))missing.push({title:'Poder e divindade',message:'Escolha poderes concedidos pela divindade atual.',selector:'.deity-choice-layout',step:5});
  }
  return missing;
};
missingChoices=function(step){if(step===1)return classMissingChoices();if(step===2)return raceMissingChoices();if(step===3)return originMissingChoices();if(step===4)return skillMissingChoices();if(step===5)return deityMissingChoices();if(step===6)return powerMissingChoices();return[]};
phaseIsComplete=function(step){
  if(step===1)return Boolean(state.identity.characterName.trim()&&state.identity.playerName.trim()&&state.identity.classId&&Number(state.identity.plannedLevel)>=1&&classSelectionsComplete());
  if(step===2)return pointSpent()===10&&raceSelectionsComplete();
  if(step===3){
    if(shouldSkipOriginPhase())return true;
    return typeof originMissingChoices==='function'?originMissingChoices().length===0:true;
  }
  if(step===4){
    const limits=typeof skillChoiceLimits==='function'?skillChoiceLimits():{class:0,int:0,race:0,duplicate:0};
    const groups=['class','int'];
    if((limits.race||0)>0)groups.push('race');
    if((limits.duplicate||0)>0)groups.push('duplicate');
    return groups.every(group=>(state.skills[group]||[]).length===(limits[group]||0));
  }
  if(step===5){const rule=devotionRule();if(rule.forced==='none')return true;if(!state.deity.mode)return false;if(rule.forced==='devout'&&state.deity.mode==='none')return false;if(state.deity.mode==='pantheon'&&state.deity.fundamentalist&&isCharacterEligibleForFundamentalist()&&!state.deity.pantheonBonusPower)return false;if(state.deity.mode==='devout'){const deity=chosenDeity(),values=deityPowerValues().filter(Boolean);return Boolean(deity&&values.length===deityPowerCount()&&new Set(values.map(slug)).size===values.length&&values.every(name=>(deity.poderes_concedidos||[]).some(power=>slug(power)===slug(name))))}return true}
  if(step===6){
    if(!characterHasPowerChoices())return true;
    return powerMissingChoices().length===0;
  }
  if(step===7){
    if(!characterHasSpellChoices())return true;
    return typeof spellMissingChoices==='function'?spellMissingChoices().length===0:true;
  }
  return true;
};
validationMessage=function(step,short=false){if(phaseIsComplete(step))return short?'Etapa pronta para continuar.':'Etapa completa.';const messages={1:'Preencha os nomes e conclua as escolhas obrigatórias da classe.',2:pointSpent()!==10?'Gaste exatamente os 10 pontos de atributos.':'Conclua as escolhas obrigatórias da raça.',3:'Escolha a origem, exatamente dois benefícios e, se necessário, uma origem regional.',4:'Complete todas as quantidades de perícias sem repetir treinos.',5:'Defina a devoção a partir de um poder concedido.',6:'Complete as escolhas de poderes raciais e gerais.'};return messages[step]||'Revise as informações desta etapa.'};

showPrerequisiteWarning=function(kind,items){
  const isAttribute=kind==='attributes',first=items[0],target=isAttribute?'[data-attribute-id="'+first.id+'"]':'[data-action="skill"][value="'+first.id+'"], [data-skill-base="'+skillBaseId(first.id)+'"]';
  locateMissingChoice(target,false);document.getElementById('warningModalTitle').textContent=isAttribute?'Atributos abaixo de pré-requisitos futuros':'Perícias exigidas por poderes futuros';
  document.getElementById('warningModalBody').innerHTML='<p>Você pode continuar normalmente, mas não poderá escolher os poderes relacionados enquanto não cumprir os requisitos abaixo.</p><div class="confirm-list">'+items.map(item=>'<div class="confirm-item"><strong>'+(isAttribute?esc(ATTR_LABEL[item.id])+' '+item.value:esc(skillDisplayName(item.id)))+' · a partir do nível '+item.level+'</strong><span>'+esc(item.powers.join(' · '))+'</span></div>').join('')+'</div><p>Deseja continuar mesmo assim?</p>';
  document.getElementById('warningCancel').textContent='Voltar e ajustar';document.getElementById('warningContinue').hidden=false;const modal=document.getElementById('warningModal');modal.dataset.mode='prerequisite';modal.dataset.kind=kind;modal.dataset.target=target;modal.dataset.signature=prerequisiteSignature(items);modal.hidden=false;
};



document.addEventListener('click',event=>{
  const button=event.target.closest?.('[data-action]');if(!button)return;const action=button.dataset.action;
  if(action==='origin-benefit-button'){
    const option=originBenefitOptions(selectedStandardOrigin()).find(item=>item.id===button.dataset.optionId);if(!option)return;state.origin.previewBenefit=option.id;
    if(button.dataset.disabled==='true'){
      if(option.id==='power:presente_de_wynlla'){
        toast('O poder Presente de Wynlla só é permitido para nativos de Wynlla.');
      }else{
        toast('Esta perícia já está treinada. Escolha outro benefício.');
      }
      renderStage();
      return;
    }
    const selected=state.origin.benefits.includes(option.id);
    const weight=option.id==='unique:heranca_2000'?2:1;
    const currentCount=originBenefitsCount();
    const maxAllowed=typeof originMaxBenefits==='function'?originMaxBenefits():2;
    if(selected){state.origin.benefits=state.origin.benefits.filter(id=>id!==option.id);delete state.origin.officeSpecialties[option.id];if(option.id==='power:proficiencia'||option.name==='Proficiência'){delete state.origin.proficiencyChoice;}}
    else if(currentCount+weight>maxAllowed){
      if(maxAllowed===1){
        toast('Você pode escolher apenas 1 benefício da origem.');
      }else if(option.id==='unique:heranca_2000'&&currentCount>0){
        toast('Herança de T$ 2.000 consome os 2 benefícios da origem. Remova o outro benefício primeiro.');
      }else{
        toast('Você já escolheu os '+maxAllowed+' benefícios. Remova um deles para trocar.');
      }
      return;
    }
    else if(option.id==='power:presente_de_wynlla'){
      if(state.origin.mode==='dual'&&state.origin.regional){
        const reg=selectedRegionalOrigin();
        if(reg&&!isWynllaRegional(reg)){
          toast('O poder Presente de Wynlla só é permitido para nativos de Wynlla.');
          return;
        }
      }
      state.origin.benefits.push(option.id);
      if(state.origin.mode==='dual'&&state.origin.regional){
        const reg=selectedRegionalOrigin();
        if(!reg||!isWynllaRegional(reg))state.origin.regional='';
      }
    }
    else if(option.type==='skill'&&skillTokenFromName(option.name)==='oficio'){openOfficeModal({source:'origin-benefit',optionId:option.id});return}
    else {
      state.origin.benefits.push(option.id);
      if(option.id==='power:proficiencia'||option.name==='Proficiência'){
        setTimeout(()=>{
          const sel=document.querySelector('[data-action="origin-benefit-proficiency-select"]');
          if(sel){sel.scrollIntoView?.({behavior:'smooth',block:'center'});sel.focus?.();}
        },60);
      }
    }
    if(typeof cleanSkillsAfterOriginChange==='function')cleanSkillsAfterOriginChange();
    if(typeof ensureOriginPartners==='function')ensureOriginPartners();
    state.completed=state.completed.filter(step=>step<4);renderStage();
    if(state.origin.mode==='dual'&&originBenefitsCount()>=2){
      const scrollRegional=()=>{document.querySelector('[data-field="regionalOrigin"]')?.scrollIntoView?.({behavior:'smooth',block:'center'})};
      if(typeof requestAnimationFrame==='function')requestAnimationFrame(scrollRegional);
      else setTimeout(scrollRegional,16);
    }
    return;
  }
  if(action==='skill-jump'){document.getElementById(button.dataset.target)?.scrollIntoView({behavior:'smooth',block:'start'});return}
  if(action==='power-preview'||action==='power-select'){
    const id=button.dataset.powerId, pwr=powerById(id), verdict=generalPowerEligibility(pwr);
    state.powers.previewId=id;
    state.powers.previewPending=false;
    if(verdict.ok){
      const index=Number(state.powers.activeSlot||0);
      const originReq=typeof originPowerSlotRequirement==='function'?originPowerSlotRequirement(index):(typeof originCombatSlot==='function'&&originCombatSlot(index)?{category:'combate'}:null);
      if(originReq&&pwr?.categoria!==originReq.category){
        toast('Escolha um poder de '+(originReq.category==='combate'?'combate':'Tormenta')+'.');
      }else if(state.powers.general.some((value,i)=>value===id&&i!==index)){
        toast('Este poder já foi escolhido em outro espaço.');
      }else{
        state.powers.general[index]=id;
        const next=Array.from({length:generalPowerSlots()},(_,i)=>i).find(i=>!state.powers.general[i]);
        if(next!==undefined){
          state.powers.activeSlot=next;
        }
        toast('Poder "'+(pwr?.nome||id)+'" selecionado.');
      }
    }
    const listContainer = button.closest('.power-list');
    const savedListScroll = listContainer ? listContainer.scrollTop : 0;
    const savedWinScroll = typeof window !== 'undefined' ? window.scrollY : 0;
    const keyDir = state.powers.keyboardDirection;
    delete state.powers.keyboardDirection;

    renderStage();

    const restoredList = document.querySelector('.power-list') as HTMLElement;
    if (restoredList) {
      if (savedListScroll > 0) restoredList.scrollTop = savedListScroll;
      if (keyDir) {
        const newlyRendered = restoredList.querySelector('[data-action="power-preview"][data-power-id="' + id + '"]') as HTMLElement;
        if (newlyRendered) {
          const elRect = newlyRendered.getBoundingClientRect();
          const listRect = restoredList.getBoundingClientRect();
          const extraMargin = 85;
          if (keyDir === 'down') {
            const overflow = (elRect.bottom + extraMargin) - listRect.bottom;
            if (overflow > 0) restoredList.scrollTop += overflow;
            else if (elRect.top < listRect.top) restoredList.scrollTop -= (listRect.top - elRect.top);
          } else if (keyDir === 'up') {
            const overflow = (listRect.top + extraMargin) - elRect.top;
            if (overflow > 0) restoredList.scrollTop -= overflow;
            else if (elRect.bottom > listRect.bottom) restoredList.scrollTop += (elRect.bottom - listRect.bottom);
          }
        }
      }
    }
    if (typeof window !== 'undefined') window.scrollTo({ top: savedWinScroll, behavior: 'instant' as any });
    if(typeof syncNextButtonState==='function')syncNextButtonState();
    return;
  }
  if(action==='power-filter-category'){state.powers.categoryFilter=button.dataset.value;renderStage();return}
  if(action==='power-filter-status'){state.powers.statusFilter=button.dataset.value;renderStage();return}
  if(action==='power-filter-toggle-all'){state.powers.statusFilter=state.powers.statusFilter==='all'?'available':'all';renderStage();return}
  if(action==='toggle-power-filters'){state.powers.drawerOpen=!state.powers.drawerOpen;state.powers.sidebarCollapsed=!state.powers.drawerOpen;renderStage();return}
  if(action==='power-remove'){const idx=Number(button.dataset.index);state.powers.general[idx]='';state.powers.activeSlot=idx;renderStage();if(typeof syncNextButtonState==='function')syncNextButtonState();return}
  if(action==='deity-filter-god'){
    const targetGod=button.dataset.deity||'';
    state.deity.filterDeity=targetGod;
    if(targetGod&&state.deity.name&&state.deity.name!==targetGod){
      state.deity.name='';
      state.deity.power='';
      state.deity.activePowerIndex=0;
      state.deity.masterPermission=false;
    }
    state.deity.previewPower='';
    state.deity.previewDeity=targetGod;
    renderDeitySelection();
    if(typeof syncNextButtonState==='function')syncNextButtonState();
    return;
  }
  if(action==='select-familiar-elemental-choice'){
    if(typeof setSelectedElementalFamiliarId==='function'){
      setSelectedElementalFamiliarId(button.dataset.choice||'');
      if(typeof syncPartnersFromChoices==='function')syncPartnersFromChoices();
      persist();
      renderStage();
      if(typeof syncNextButtonState==='function')syncNextButtonState();
    }
    return;
  }
  if(action==='deity-power-preview'){state.deity.previewPower=button.dataset.power;state.deity.previewDeity=button.dataset.deity;commitDeityPower(button.dataset.deity,button.dataset.power,true);if(typeof syncNextButtonState==='function')syncNextButtonState();return}
  if(action==='deity-power-slot'){state.deity.activePowerIndex=Number(button.dataset.index);const value=deityPowerValues()[state.deity.activePowerIndex];if(value){state.deity.previewPower=value;state.deity.previewDeity=state.deity.name}else{state.deity.previewPower='';state.deity.previewDeity=''}renderDeitySelection();return}
  if(action==='deity-power-remove'){setDeityPower(Number(button.dataset.index),'');renderDeitySelection();if(typeof syncNextButtonState==='function')syncNextButtonState();return}
  if(action==='deity-reset'){state.deity.name='';state.deity.filterDeity='';state.deity.power='';state.deity.previewPower='';state.deity.previewDeity='';state.deity.activePowerIndex=0;state.deity.masterPermission=false;state.powers.general=[];renderDeitySelection({resetSearch:true});if(typeof syncNextButtonState==='function')syncNextButtonState();return}
  if(action==='deity-confirm-preview'){commitDeityPower(button.dataset.deity,button.dataset.power);if(typeof syncNextButtonState==='function')syncNextButtonState();return}
});
document.addEventListener('change',event=>{
  if(event.target.dataset.action==='toggle-deity-fundamentalist'){
    state.deity.fundamentalist=Boolean(event.target.checked);
    if(!state.deity.fundamentalist){
      state.deity.pantheonBonusPower='';
      const trimmed=String(state.deity.power||'').split('|').slice(0,deityPowerCount()).join('|');
      state.deity.power=trimmed;
      if(Number(state.deity.activePowerIndex||0)>=deityPowerCount())state.deity.activePowerIndex=0;
    }else if(state.deity.mode==='devout'){
      const vals=deityPowerValues();
      const nextEmpty=vals.findIndex(v=>!v);
      if(nextEmpty>=0)state.deity.activePowerIndex=nextEmpty;
    }
    persist();
    renderStage();
    if(typeof syncNextButtonState==='function')syncNextButtonState();
    return;
  }
  if(event.target.dataset.action==='pantheon-fundamentalist-power'){
    const chosenId=event.target.value||'';
    if(chosenId){
      const pwr=powerById(chosenId);
      const verdict=typeof generalPowerEligibility==='function'?generalPowerEligibility(pwr):{ok:powerMeetsAttrs(pwr),reasons:['Pré-requisitos não cumpridos.']};
      if(!verdict.ok){
        toast((verdict.reasons||['Você não cumpre os pré-requisitos deste poder.']).join(' '));
        event.target.value=state.deity.pantheonBonusPower||'';
        return;
      }
    }
    state.deity.pantheonBonusPower=chosenId;
    persist();
    renderStage();
    if(typeof syncNextButtonState==='function')syncNextButtonState();
    return;
  }
  if(event.target.dataset.field==='standardOrigin'){state.origin.previewBenefit='';state.powers.general.length=Math.min(state.powers.general.length,typeof raceGeneralPowerSlots==='function'?raceGeneralPowerSlots():0)}
  if(event.target.dataset.action==='race-choice'){state.skills.race=[]}
  if(event.target.dataset.field==='class-required')state.skills={class:[],race:[],int:state.skills.int||[]};
  if(event.target.dataset.action==='skill'&&event.target.dataset.group==='class'){state.skills.race=[]}
},true);
document.addEventListener('click', event => {
  if (state.step === 6 && state.powers?.drawerOpen) {
    const isTrigger = (event.target as HTMLElement)?.closest?.('[data-action="toggle-power-filters"]');
    const isDrawer = (event.target as HTMLElement)?.closest?.('.power-filters-drawer');
    if (!isTrigger && !isDrawer) {
      state.powers.drawerOpen = false;
      renderStage();
    }
  }
});
// Character-bound spell choices. Rules come from the local class/race/power data;
// explicit adapters below cover grants whose source only has prose, not effects.
const SPELL_SCHOOLS = {abjuracao:'Abjuração',adivinhacao:'Adivinhação',convocacao:'Convocação',encantamento:'Encantamento',evocacao:'Evocação',ilusao:'Ilusão',necromancia:'Necromancia',transmutacao:'Transmutação'};
// Exceções futuras podem ser registradas aqui; o padrão vem de escolasEscolha.
const PROJECT_SCHOOL_LIMITS = {};
const spellById = id => DATA.spells.find(spell => spell.id === id);
const spellKey = name => slug(name).replace(/_/g,'-');
function spellState(){
  if(!state.spells || typeof state.spells !== 'object')state.spells={};
  const value=state.spells;
  for(const key of ['selections','schools','manualSchools','lockedSchools','schoolAnnouncements'])if(!value[key]||typeof value[key]!=='object'||Array.isArray(value[key]))value[key]={};
  if(!Array.isArray(value.memorized))value.memorized=[];
  value.activeGroup=String(value.activeGroup||'');
  value.view=value.view==='learned'?'learned':'available';
  return value;
}
function spellPath(){return ['bruxo','mago','feiticeiro'].find(path=>Object.values(state.identity.classChoices).some(value=>slug(value)===path))||''}
function spellLineage(){return ['linhagem_abencoada','linhagem_feerica','linhagem_draconica','linhagem_rubra'].find(id=>Object.values(state.identity.classChoices).some(value=>slug(value)===id))||''}
function spellCircleAt(effect,level){
  const progression=effect.progressaoCirculo;
  if(Array.isArray(progression))return Math.max(Number(effect.circuloInicial||1),...progression.filter(row=>level>=row.nivel).map(row=>Number(row.circulo)));
  return Math.min(5,Number(effect.circuloInicial||1)+(progression?.intervaloNiveis?Math.floor((level-1)/progression.intervaloNiveis):0));
}
function activeSpellTraits(){
  const traits=[...(raceById(state.identity.raceId)?.habilidades?.fixas||[])];
  allRaceChoiceDefinitions().forEach(def=>{const option=chosenRaceTraitOption(def);if(option)traits.push(option,...(option.habilidades||[]))});
  racePowerGroups().forEach(group=>(state.powers.raceGroups[group.id]||[]).forEach(id=>{
    const option=group.options.find(item=>choiceId(item)===id);
    if(!option)return;
    traits.push(option,...(option.habilidades||[]));
    (option.subEscolhas||[]).forEach(def=>{const sub=chosenRaceTraitOption(def);if(sub)traits.push(sub)});
  }));
  return traits;
}
function activeSpellPowers(){
  const names=new Set([...originPowerNames(),...(state.deity.mode==='devout'?String(state.deity.power||'').split('|'):[])].map(slug));
  const pantheonBonus=state.deity.mode==='pantheon'&&state.deity.fundamentalist?state.deity.pantheonBonusPower:'';
  return DATA.generalPowers.filter(power=>state.powers.general.includes(power.id)||power.id===pantheonBonus||names.has(slug(power.nome)));
}