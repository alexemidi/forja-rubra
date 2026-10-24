

function renderOpenRacesCard(race){
  const eligible=isRaceEligibleForOpenRaces(race);
  const enabled=Boolean(state.identity.openRaceBonusEnabled&&eligible);
  let bodyContent='';
  if(!eligible){
    bodyContent='<p class="open-races-help">Esta raça já possui atributos flexíveis por padrão (não utiliza esta variante de Heróis de Arton).</p>';
  }else if(!enabled){
    const mods=raceFixedModifiers(race).map(m=>(m>0?'+':'')+m).join(', ');
    bodyContent='<p class="open-races-help">Permite redistribuir os modificadores raciais da raça ('+esc(mods)+') entre os atributos, sem repetir atributo.</p>';
  }else{
    const allMods=raceFixedModifiers(race);
    const allocs=state.identity.openRaceAllocations||{};
    const remaining=remainingOpenRaceModifiers(race,allocs);
    const allocatedCount=allMods.length-remaining.length;
    if(remaining.length>0){
      const nextMod=remaining[0];
      const signNext=nextMod>0?'+'+nextMod:String(nextMod);
      bodyContent='<div class="open-races-status">'
        +'<div class="open-races-info-row"><span>Modificadores: <strong>'+allocatedCount+'/'+allMods.length+'</strong></span>'
        +(allocatedCount>0?'<button type="button" class="open-races-reset-btn" data-action="reset-open-races">Redefinir</button>':'')
        +'</div>'
        +'<p class="open-races-instruction">Próximo modificador a atribuir: <strong>'+esc(signNext)+'</strong></p>'
        +'</div>';
    }else{
      bodyContent='<div class="open-races-status">'
        +'<div class="open-races-info-row"><span>Modificadores distribuídos: <strong>'+allMods.length+'/'+allMods.length+'</strong></span>'
        +'<button type="button" class="open-races-reset-btn" data-action="reset-open-races">Redefinir</button>'
        +'</div>'
        +'</div>';
    }
  }
  return '<div class="open-races-card '+(enabled?'is-active':'')+'">'
    +'<label class="open-races-toggle '+(!eligible?'disabled':'')+'">'
    +'<input type="checkbox" data-action="toggle-open-races" '+(enabled?'checked':'')+' '+(!eligible?'disabled':'')+'>'
    +'<span class="open-races-toggle-label"><strong>Raças Abertas</strong></span>'
    +'</label>'
    +bodyContent
    +'</div>';
}

function renderRacialCell(attr,bonus,sources){
  const race=raceById(state.identity.raceId);
  if(state.identity.openRaceBonusEnabled&&isRaceEligibleForOpenRaces(race)){
    const allocs=state.identity.openRaceAllocations||{};
    if(allocs[attr]!==undefined){
      const val=Number(allocs[attr]);
      const formatted=(val>0?'+':'')+val;
      return '<div class="open-race-cell-container">'
        +'<div class="matrix-value racial-static open-race-assigned-field">'+formatted+'</div>'
        +'<button type="button" class="open-race-remove-btn" data-action="open-race-remove" data-attr="'+attr+'" title="Desalocar modificador">×</button>'
        +'</div>';
    }
    const remaining=remainingOpenRaceModifiers(race,allocs);
    if(remaining.length>0){
      const next=remaining[0];
      const signNext=next>0?'+'+next:String(next);
      return '<div class="open-race-cell-container">'
        +'<button type="button" class="matrix-value racial-static open-race-assign-box" data-action="open-race-assign" data-attr="'+attr+'" data-val="'+next+'">'
        +'Atribuir '+signNext
        +'</button>'
        +'</div>';
    }
    return '<div class="matrix-value racial-static">0</div>';
  }
  const available=sources.filter(source=>(source.config.atributosPermitidos||ATTRS.map(item=>item[0])).includes(attr));
  if(!available.length)return '<div class="matrix-value racial-static">'+(bonus>0?'+':'')+bonus+'</div>';
  const controls=available.map(source=>{
    const values=allocationValues(source.key),counts=allocationCounts(values),quantity=Number(source.config.quantidade||0),repeat=Boolean(source.config.permitirRepetir),count=Number(counts[attr]||0);
    const maxPerAttr=Number(source.config.maxPorAtributo||(repeat?quantity:1));
    const minusDisabled=!count,plusDisabled=values.length>=quantity||count>=maxPerAttr;
    const shownValue=available.length===1?bonus:count*Number(source.config.valor||1);
    return '<div class="racial-control-wrap" data-allocation-key="'+esc(source.key)+'">'+(available.length>1?'<small>'+esc(source.label)+'</small>':'')+'<div class="racial-source" title="'+esc(source.label)+'"><button type="button" data-action="allocation" data-key="'+esc(source.key)+'" data-attr="'+attr+'" data-dir="-1" '+(minusDisabled?'disabled':'')+'>−</button><output>'+(shownValue>0?'+':'')+shownValue+'</output><button type="button" data-action="allocation" data-key="'+esc(source.key)+'" data-attr="'+attr+'" data-dir="1" '+(plusDisabled?'disabled':'')+'>+</button></div></div>';
  }).join('');
  return '<div class="racial-cell">'+(available.length>1?'<div class="racial-total">Total '+(bonus>0?'+':'')+bonus+'</div>':'')+controls+'</div>';
}

function attributeRequirements(attr){
  return classFutureRequirements().attrs.filter(req=>req.attr===attr).filter((req,index,list)=>list.findIndex(other=>other.value===req.value&&other.level===req.level&&other.power===req.power)===index).sort((a,b)=>a.level-b.level||a.value-b.value);
}

function attributeTooltip(attr,requirements){
  if(!requirements.length)return '';
  const details=requirements.slice(0,8).map(req=>ATTR_LABEL[attr]+' '+req.value+' no nível '+req.level+' para '+req.power).join('; ');
  return 'Pré-requisito de poderes futuros: '+details+(requirements.length>8?'; e outros.':'.');
}

function renderAttributeMatrix(){
  const bonuses=raceBonuses(),attributes=finalAttrs(),spent=pointSpent(),sources=raceAllocationSources();
  return '<div class="point-banner '+(spent===10?'ok':spent>10?'over':'')+'"><span>Distribua os <strong>10 pontos</strong> entre os valores básicos.</span><strong>'+spent+'/10 gastos · '+(10-spent)+' restantes</strong></div><div class="attribute-matrix"><div class="attribute-matrix-head"><span>Atributo</span><span>Base</span><span>Racial</span><span>Total</span></div>'+ATTRS.map(([id,name])=>{
    const base=Number(state.identity.baseAttrs[id]||0);
    const requirements=attributeRequirements(id);
    const unmet=requirements.some(req=>attributes[id]<req.value);
    const tooltip=(unmet && requirements.length)?attributeTooltip(id,requirements):'';
    const prereqClass=requirements.length?(unmet?'prereq-highlight prereq-unmet':'prereq-highlight prereq-met'):'';
    return '<div class="attribute-matrix-row '+prereqClass+'" data-attribute-id="'+id+'" '+(tooltip?'data-tooltip="'+esc(tooltip)+'"':'')+'><div class="attribute-matrix-name"><span>'+esc(name)+'</span></div><div class="matrix-control"><button data-action="attr" data-attr="'+id+'" data-dir="-1" '+(base<=-1?'disabled':'')+'>−</button><output title="Custo '+ATTR_COST[base]+'">'+base+'</output><button data-action="attr" data-attr="'+id+'" data-dir="1" '+(base>=4?'disabled':'')+'>+</button></div>'+renderRacialCell(id,bonuses[id],sources)+'<div class="matrix-total">'+attributes[id]+'</div></div>';
  }).join('')+'</div><p class="help" style="margin-top:9px">Barra amarela: pré-requisito atingido. Barra vermelha: valor mínimo ainda não alcançado (passe o mouse para conferir os poderes futuros).</p>';
}
function renderAttributeVitals(){const stats=progressionStats();return '<div class="attribute-vitals"><div class="summary-card"><small>Pontos de Vida (PV)</small><strong>'+stats.pv+'</strong></div><div class="summary-card"><small>Pontos de Mana (PM)</small><strong>'+stats.pm+'</strong></div></div>'}

function formatRaceSizeName(sizeId){
  const map={'minusculo':'Minúsculo','pequeno':'Pequeno','medio':'Médio','grande':'Grande','enorme':'Enorme','colossal':'Colossal'};
  return map[slug(sizeId||'medio')] || (sizeId ? String(sizeId).charAt(0).toUpperCase()+String(sizeId).slice(1) : 'Médio');
}
function raceBodyTraitsHtml(race){
  let tamanhoId = race?.corpo?.tamanhoId;
  let deslocamentoBase = race?.corpo?.deslocamentoBase;
  if(race?.id==='duende'&&state.identity.raceChoices?.duende_tamanho){
    const sizeChoice=state.identity.raceChoices.duende_tamanho;
    tamanhoId=sizeChoice;
    deslocamentoBase=(sizeChoice==='minusculo'||sizeChoice==='pequeno')?6:9;
  }
  const tamanho = formatRaceSizeName(tamanhoId);
  const deslocamento = (deslocamentoBase ?? '9') + 'm';
  return '<div class="race-traits-card" style="margin:8px 0 12px;padding:8px 12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:6px;display:flex;gap:20px;font-size:0.95rem;align-items:center">'
    + '<span class="race-trait-item"><strong>Tamanho:</strong> '+esc(tamanho)+'</span>'
    + '<span class="race-trait-item"><strong>Deslocamento:</strong> '+esc(deslocamento)+'</span>'
    + '</div>';
}

const CLASS_PRIMARY_ATTRS_BASE = {
  necromante: ['int'],
  barbaro: ['for'],
  machado_de_pedra: ['for'],
  bardo: ['car'],
  magimarcialista: ['car'],
  bucaneiro: ['des'],
  duelista: ['des'],
  seteiro: ['des'],
  cavaleiro: ['for'],
  vassalo: ['for'],
  clerigo: ['sab'],
  usurpador: ['car'],
  druida: ['sab'],
  ermitao: ['sab'],
  inventor: ['int'],
  alquimista: ['int'],
  ladino: ['des', 'int'],
  ventanista: ['des', 'int'],
  lutador: ['for'],
  atleta: ['for'],
  nobre: ['car'],
  burgues: ['car'],
  paladino: ['for', 'car'],
  santo: ['for', 'car'],
  treinador: ['car'],
  frade: ['sab'],
  miragem: ['des', 'car'],
  mistico: ['sab', 'car'],
  samurai: ['for', 'des']
};

function getClassPrimaryAttrs(classId, state = {}) {
  if (classId === 'arcanista') {
    const p = typeof spellPath === 'function' 
      ? spellPath() 
      : ['bruxo', 'mago', 'feiticeiro'].find(path => Object.values(state?.identity?.classChoices || {}).some(val => (typeof slug === 'function' ? slug(val) : String(val).toLowerCase()) === path)) || '';
    if (p === 'feiticeiro') return ['car'];
    return ['int'];
  }

  if (['guerreiro', 'cacador', 'inovador'].includes(classId)) {
    const required = Object.values(state?.identity?.classRequiredChoices || {});
    if (required.includes('luta')) return ['for'];
    if (required.includes('pontaria')) return ['des'];
    return ['for', 'des'];
  }

  return CLASS_PRIMARY_ATTRS_BASE[classId] || ['for', 'des', 'con', 'int', 'sab', 'car'];
}

function getRaceAttributePotential(race, attr, state = {}) {
  if (!race) return 0;
  if (race.id === 'duende') return 2;
  if (race.id === 'moreau') return 2;

  if (race.id === 'nagah') {
    const chosenSex = state?.identity?.raceChoices?.['nagah_sexo'];
    if (chosenSex === 'nagah_femea') return ['int', 'sab', 'car'].includes(attr) ? 1 : 0;
    if (chosenSex === 'nagah_macho') return ['for', 'des', 'con'].includes(attr) ? 1 : 0;
    return (['int', 'sab', 'car'].includes(attr) || ['for', 'des', 'con'].includes(attr)) ? 1 : 0;
  }

  if (race.id === 'meio_elfo') {
    if (attr === 'int') return 2;
    if (['for', 'des', 'sab', 'car'].includes(attr)) return 1;
    return 0;
  }

  if (race.id === 'suraggel') {
    const lineage = state?.identity?.raceChoices?.['suraggel_linhagem'];
    if (lineage === 'aggelus') return attr === 'sab' ? 2 : (attr === 'car' ? 1 : 0);
    if (lineage === 'sulfure') return attr === 'des' ? 2 : (attr === 'int' ? 1 : 0);
    return (attr === 'sab' || attr === 'des') ? 2 : ((attr === 'car' || attr === 'int') ? 1 : 0);
  }

  if (race.id === 'golem_desperto') {
    const chassiId = state?.identity?.raceChoices?.['golem_desperto_chassi'];
    if (chassiId) {
      let mods = { for: 1, des: 0, con: 0, int: 0, sab: 0, car: -1 };
      if (chassiId === 'golem_desperto_barro' || chassiId === 'golem_desperto_gelo_eterno' || chassiId === 'golem_desperto_pedra') { mods.con += 2; }
      else if (chassiId === 'golem_desperto_carne') { mods.for += 1; mods.con += 2; mods.car -= 1; }
      else if (chassiId === 'golem_desperto_espelhos') { mods.car += 2; mods.sab += 1; mods.con -= 1; }
      else if (chassiId === 'golem_desperto_ferro' || chassiId === 'golem_desperto_sucata') { mods.for += 1; mods.con += 1; }
      else if (chassiId === 'golem_desperto_bronze') {
        if (attr === 'for') return 2;
        return 1;
      }
      return mods[attr] !== undefined ? mods[attr] : 0;
    }
    if (['for', 'con', 'car'].includes(attr)) return 2;
    return 1;
  }

  let fixed = race.atributos?.fixos?.[attr] || 0;
  const flex = race.atributos?.flexiveis;
  if (flex && (flex.atributosPermitidos || []).includes(attr)) {
    if (fixed > 0) return fixed + Number(flex.valor || 1);
    if (fixed === 0) return Number(flex.valor || 1);
    return fixed;
  }
  return fixed;
}

function canRaceBoostBothAttributes(race, attrA, attrB, state = {}) {
  if (!race) return false;
  if (race.id === 'duende' || race.id === 'moreau') return true;
  if (race.id === 'humano' || race.id === 'sereia_tritao') return true;

  const fixA = race.atributos?.fixos?.[attrA] || 0;
  const fixB = race.atributos?.fixos?.[attrB] || 0;
  if (fixA >= 1 && fixB >= 1) return true;

  const flex = race.atributos?.flexiveis;
  if (!flex) return false;

  const canA = (flex.atributosPermitidos || []).includes(attrA);
  const canB = (flex.atributosPermitidos || []).includes(attrB);
  const qty = Number(flex.quantidade || 0);

  if (fixA >= 1 && canB && qty >= 1) return true;
  if (fixB >= 1 && canA && qty >= 1) return true;
  if (canA && canB && qty >= 2) return true;

  return false;
}

function getRaceEfficiencyTier(race, classId, state = {}) {
  const targetAttrs = getClassPrimaryAttrs(classId, state);

  // Tratamento da Nagah
  if (race.id === 'nagah') {
    const chosenSex = state?.identity?.raceChoices?.['nagah_sexo'];
    if (targetAttrs.length === 1) {
      const single = targetAttrs[0];
      if (chosenSex === 'nagah_femea') {
        const has = ['int', 'sab', 'car'].includes(single);
        return has ? { tier: 'bom', score: 1, symbol: '▲', color: '#22c55e', label: 'Boa (+1)' } : { tier: 'ruim', score: -1, symbol: '▼', color: '#ef4444', label: 'Ruim (<0)' };
      }
      if (chosenSex === 'nagah_macho') {
        const has = ['for', 'des', 'con'].includes(single);
        return has ? { tier: 'bom', score: 1, symbol: '▲', color: '#22c55e', label: 'Boa (+1)' } : { tier: 'ruim', score: -1, symbol: '▼', color: '#ef4444', label: 'Ruim (<0)' };
      }
      const femeaHas = ['int', 'sab', 'car'].includes(single);
      const machoHas = ['for', 'des', 'con'].includes(single);
      if ((femeaHas && !machoHas) || (!femeaHas && machoHas)) {
        return { tier: 'nagah_dual', score: 0.5, symbol: '▲▼', color: 'dual', label: 'Variável por Sexo' };
      }
      if (femeaHas && machoHas) return { tier: 'bom', score: 1, symbol: '▲', color: '#22c55e', label: 'Boa (+1)' };
      return { tier: 'ruim', score: -1, symbol: '▼', color: '#ef4444', label: 'Ruim (<0)' };
    }
  }

  // Caso 1: Classe com 1 atributo principal
  if (targetAttrs.length === 1) {
    const pot = getRaceAttributePotential(race, targetAttrs[0], state);
    if (pot >= 2) return { tier: 'excelente', score: 2, symbol: '▲', color: '#3b82f6', label: 'Excelente (+2)' };
    if (pot === 1) return { tier: 'bom', score: 1, symbol: '▲', color: '#22c55e', label: 'Boa (+1)' };
    if (pot === 0) return { tier: 'neutro', score: 0, symbol: '', color: '', label: 'Neutra' };
    return { tier: 'ruim', score: pot, symbol: '▼', color: '#ef4444', label: 'Ruim (<0)' };
  }

  // Caso 2: Classe com 2 atributos principais (Ladino, Paladino, Caçador/Guerreiro sem escolha)
  const attrA = targetAttrs[0];
  const attrB = targetAttrs[1];
  let potA = getRaceAttributePotential(race, attrA, state);
  let potB = getRaceAttributePotential(race, attrB, state);

  const canBoth = canRaceBoostBothAttributes(race, attrA, attrB, state);
  let val1, val2;
  if (!canBoth && potA > 0 && potB > 0) {
    if (potA >= potB) {
      val1 = potA;
      val2 = race.atributos?.fixos?.[attrB] || 0;
    } else {
      val1 = potB;
      val2 = race.atributos?.fixos?.[attrA] || 0;
    }
  } else {
    val1 = Math.max(potA, potB);
    val2 = Math.min(potA, potB);
  }

  if (val1 >= 2) {
    if (val2 >= 1) return { tier: 'excelente', score: 2, symbol: '▲', color: '#3b82f6', label: 'Excelente (+2)' };
    if (val2 === 0) return { tier: 'bom', score: 1.5, symbol: '▲', color: '#22c55e', label: 'Boa (+1)' };
    return { tier: 'neutro', score: 0, symbol: '', color: '', label: 'Neutra' };
  }

  if (val1 === 1) {
    if (val2 >= 1) return { tier: 'bom', score: 1, symbol: '▲', color: '#22c55e', label: 'Boa (+1)' };
    if (val2 === 0) return { tier: 'neutro', score: 0, symbol: '', color: '', label: 'Neutra' };
    return { tier: 'ruim', score: -1, symbol: '▼', color: '#ef4444', label: 'Ruim (<0)' };
  }

  if (val1 === 0) {
    if (val2 === 0) return { tier: 'neutro', score: 0, symbol: '', color: '', label: 'Neutra' };
    return { tier: 'ruim', score: val2, symbol: '▼', color: '#ef4444', label: 'Ruim (<0)' };
  }

  return { tier: 'ruim', score: val1, symbol: '▼', color: '#ef4444', label: 'Ruim (<0)' };
}

function getSortedRacesList(classId, state = {}) {
  const all = Array.isArray(DATA?.races) ? DATA.races : [];
  const isOpenRaces = Boolean(state?.identity?.openRaceBonusEnabled);
  const isOptimize = Boolean(state?.identity?.optimizeRaces && !isOpenRaces);

  if (!isOptimize) {
    const humano = all.find(r => r.id === 'humano');
    const others = all.filter(r => r.id !== 'humano')
      .slice()
      .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR'));
    return humano ? [humano, ...others] : others;
  }

  const tierOrder = { excelente: 1, bom: 2, nagah_dual: 2.5, neutro: 3, ruim: 4 };
  return all.slice().sort((a, b) => {
    const tierA = getRaceEfficiencyTier(a, classId, state);
    const tierB = getRaceEfficiencyTier(b, classId, state);
    const orderA = tierOrder[tierA.tier] || 3;
    const orderB = tierOrder[tierB.tier] || 3;
    if (orderA !== orderB) return orderA - orderB;
    return (a.nome || '').localeCompare(b.nome || '', 'pt-BR');
  });
}

function renderRaceEfficiencyBadge(race, classId, state = {}) {
  const isOpenRaces = Boolean(state?.identity?.openRaceBonusEnabled);
  const isOptimize = Boolean(state?.identity?.optimizeRaces && !isOpenRaces);
  if (!isOptimize || !race) return '';

  const info = getRaceEfficiencyTier(race, classId, state);
  if (info.tier === 'excelente') {
    return '<span class="race-tier-badge" title="Excelente (+2 no atributo principal da classe)" style="display:inline-flex;align-items:center;justify-content:center;color:#3b82f6;"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg></span>';
  }
  if (info.tier === 'bom') {
    return '<span class="race-tier-badge" title="Boa (+1 no atributo principal da classe)" style="display:inline-flex;align-items:center;justify-content:center;color:#22c55e;"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg></span>';
  }
  if (info.tier === 'ruim') {
    return '<span class="race-tier-badge" title="Penalidade no atributo principal da classe" style="display:inline-flex;align-items:center;justify-content:center;color:#ef4444;"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg></span>';
  }
  if (info.tier === 'nagah_dual') {
    return '<span class="race-tier-badge" title="Varia conforme o sexo (fêmea ou macho)" style="display:inline-flex;align-items:center;gap:1px;"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg></span>';
  }
  return '';
}

function renderRacePanel(){
  const race=raceById(state.identity.raceId);
  const isOpenRaces = Boolean(state.identity.openRaceBonusEnabled);
  const isOptimize = Boolean(state.identity.optimizeRaces && !isOpenRaces);

  const sortedRaces = getSortedRacesList(state.identity.classId, state);
  const raceOptionsHtml = sortedRaces.map(option => {
    let prefix = '';
    let style = '';
    if (isOptimize) {
      const tierInfo = getRaceEfficiencyTier(option, state.identity.classId, state);
      if (tierInfo.symbol) {
        prefix = tierInfo.symbol + ' ';
      }
      if (tierInfo.color && tierInfo.color !== 'dual') {
        style = 'style="color:' + tierInfo.color + '"';
      }
    }
    return '<option value="' + option.id + '" ' + (option.id === race?.id ? 'selected' : '') + ' ' + style + '>' + esc(prefix + option.nome) + ' · ' + esc(BOOKS[option.livroOrigemId] || option.livroOrigemId) + '</option>';
  }).join('');

  const efficiencyBadge = renderRaceEfficiencyBadge(race, state.identity.classId, state);

  const optimizeControls = `
    <div class="race-optim-controls" style="margin-bottom:10px;">
      <label class="checkbox-option" style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;font-size:0.85rem;color:var(--text);margin:0;${isOpenRaces ? 'opacity:0.4;cursor:not-allowed;' : ''}">
        <input type="checkbox" data-action="toggle-race-optimize" ${isOptimize ? 'checked' : ''} ${isOpenRaces ? 'disabled' : ''}>
        <span style="font-weight:600;">Otimizar Classe</span>
      </label>
    </div>
  `;

  let choices='';
  (race?.habilidades?.selecionadas||[]).forEach(def=>{
    if(def.tipo==='escolha_multipla'){
      choices+='<p class="race-choice-plain-text" style="margin:8px 0;font-size:0.85rem;color:var(--text-muted,#ccc);line-height:1.4;"><strong>'+esc(def.nome)+'</strong> será escolhido na fase 6 — Poderes.</p>';
      return;
    }
    if(def.tipo==='atributos_flexiveis'){
      choices+='<p class="race-choice-plain-text" style="margin:8px 0;font-size:0.85rem;color:var(--text-muted,#ccc);line-height:1.4;"><strong>'+esc(def.nome)+'.</strong> Distribua os bônus diretamente na coluna Racial da calculadora.</p>';
      return;
    }
    choices+=renderChoice(def);
    const option=selectedRaceOption(def);
    if(option?.atributosFlexiveis){
      if(race?.id==='duende')return;
      choices+='<p class="race-choice-plain-text" style="margin:8px 0;font-size:0.85rem;color:var(--text-muted,#ccc);line-height:1.4;"><strong>'+esc(def.nome||choiceName(option))+'.</strong> O modificador concedido por esta escolha aparece na coluna Racial.</p>';
    }
  });
  (race?.habilidades?.fixas||[]).forEach(ability=>{
    if(ability.escolha?.tipo==='escolha_multipla')choices+='<p class="race-choice-plain-text" style="margin:8px 0;font-size:0.85rem;color:var(--text-muted,#ccc);line-height:1.4;"><strong>'+esc(ability.nome)+':</strong> escolha transferida para a fase 6 — Poderes.</p>';
    else if(ability.escolha)choices+=renderChoice({id:ability.id,nome:ability.nome,descricao:ability.descricao,opcoes:ability.escolha.opcoes});
  });
  supplementalRaceChoiceDefinitions().forEach(def=>choices+=renderChoice(def));

  return panel('Raça',
    '<div class="race-overview">'
    + '<div class="field race-picker" style="margin-bottom:10px;">'
    + '<div style="display:flex;align-items:center;gap:8px;width:100%;">'
    + efficiencyBadge
    + '<select class="select" data-field="raceId" style="flex:1;">'
    + raceOptionsHtml
    + '</select>'
    + '</div>'
    + '</div>'
    + optimizeControls
    + raceBodyTraitsHtml(race)
    + choices
    + '<div class="choice-section"><h4>Habilidades raciais</h4><div class="ability-list">'
    + (race.habilidades?.fixas || []).map(abilityHtml).join('')
    + '</div></div>'
    + '</div>'
  );
}

function hasPendingRaceChoices(){
  const race=raceById(state.identity.raceId);
  if(!race)return false;
  const sources=raceAllocationSources();
  for(const source of sources){
    const amount=allocationValues(source.key).length;
    const required=Number(source.config?.quantidade||0);
    if(amount<required)return true;
  }
  for(const def of (race?.habilidades?.selecionadas||[])){
    if(def.tipo==='escolha_multipla'||def.tipo==='atributos_flexiveis')continue;
    const required=def.obrigatoria||def.id==='humano_versatil'||def.id==='duende_tabu';
    if(required&&!selectedRaceOption(def))return true;
  }
  for(const ability of (race?.habilidades?.fixas||[])){
    if(ability.escolha?.obrigatoria&&ability.escolha.tipo!=='escolha_multipla'&&!state.identity.raceChoices[ability.id]){
      return true;
    }
  }
  if(race.id==='golem_desperto'&&state.identity.raceChoices.golem_desperto_fonte==='Elemental'&&!state.identity.raceChoices.golem_fonte_elemento){
    return true;
  }
  return false;
}

function rolarParaCalculadoraAtributos(){
  setTimeout(()=>{
    const matrix=document.getElementById('attributeMatrixSection')||document.querySelector('.attribute-matrix');
    if(matrix&&typeof matrix.scrollIntoView==='function'){
      matrix.scrollIntoView({behavior:'smooth',block:'start'});
      matrix.classList.remove('choice-highlight');
      // @ts-ignore
      void matrix.offsetWidth;
      matrix.classList.add('choice-highlight');
    }
  },90);
}

function renderAttributesRace(){
  const race=raceById(state.identity.raceId);
  // @ts-ignore
  const rCamp=typeof RegrasCampanha!=='undefined'?RegrasCampanha.obterRegrasCampanha(state):(state.regrasCampanha||{idade:'desativada',racasAbertas:false,faixaBasico:'adulto'});

  let openRacesContent='';
  if(rCamp.racasAbertas){
    openRacesContent=renderOpenRacesCard(race);
  }

  let ageContent='';
  const hasAgeHeroisOrComplications = rCamp.idade === 'herois_arton' || Boolean(rCamp.complicacoes) || Boolean(state.age?.enabled) || Boolean(state.complicacoesIndividual);
  if(hasAgeHeroisOrComplications){
    const ageHtml=typeof renderAgePanelHtml==='function'?renderAgePanelHtml():(typeof window!=='undefined'&&window.renderAgePanelHtml?window.renderAgePanelHtml():'');
    ageContent=ageHtml||'';
  }else if(rCamp.idade==='basico'){
    const fb=rCamp.faixaBasico||'adulto';
    ageContent='<div class="panel age-extension">'
      +'<div class="panel-header"><div class="panel-title">Idade (Livro Básico)</div><div class="panel-note">Modificadores de Atributo</div></div>'
      +'<div class="panel-body">'
      +'<div class="field" style="margin-bottom:8px;">'
      +'<span style="font-size:0.75rem;color:var(--muted);display:block;margin-bottom:4px;">Faixa Etária</span>'
      +'<select class="select" data-action="basico-age-band">'
      +'<option value="adulto" '+(fb==='adulto'?'selected':'')+'>Adulto (18 a 44 anos) · Sem modificadores</option>'
      +'<option value="maduro" '+(fb==='maduro'?'selected':'')+'>Maduro (45 a 69 anos) · -1 Fis / +1 Men</option>'
      +'<option value="velho" '+(fb==='velho'?'selected':'')+'>Velho (70+ anos) · -3 Fis / +2 Men (cumulativo)</option>'
      +'</select>'
      +'</div>'
      +'<p class="help" style="font-size:0.72rem;line-height:1.45;color:var(--text-muted);">'
      +(fb==='velho'?'Modificadores cumulativos de Maduro e Velho: <strong>For –3, Des –3, Con –3, Int +2, Sab +2, Car +2</strong>. Longevidade máxima: 70 + 2d20 anos.':(fb==='maduro'?'Modificadores de Maduro: <strong>For –1, Des –1, Con –1, Int +1, Sab +1, Car +1</strong>.':'Adulto: No auge da capacidade física e mental, sem alterações de atributos.'))
      +'</p>'
      +'</div>'
      +'</div>';
  }

  let optionalRulesDisabledNotice='';
  if(!rCamp.racasAbertas&&rCamp.idade==='desativada'&&!rCamp.complicacoes&&!state.age?.enabled&&!state.complicacoesIndividual){
    optionalRulesDisabledNotice='<div class="rules-campaign-trigger-box" data-action="abrir-regras-campanha" data-tooltip="Clique para configurar as Regras da Campanha e Variantes (Idade, Raças Abertas, Complicações, etc.)" style="margin-top:10px;padding:6px 12px;border:1px dashed rgba(234,57,72,0.4);border-radius:6px;background:rgba(23,17,20,0.6);cursor:pointer;display:inline-flex;align-items:center;gap:8px;">'
      +'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ea3948" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>'
      +'<strong style="color:var(--gold,#e9ad59);font-family:\'Tormenta\',Cinzel,serif;font-size:0.85rem;font-weight:700;">Regras de Idade, Complicações e Variantes</strong>'
      +'</div>';
  }

  const leftPanelContent=renderAttributeVitals()+openRacesContent+optionalRulesDisabledNotice;
  const topSection='<div class="phase-2-top-grid '+(ageContent?'':'single-column')+'">'
    +'<div class="phase-2-top-left">'
    +panel('Atributos · Base + Racial = Total',leftPanelContent)
    +'</div>'
    +(ageContent?'<div class="phase-2-top-right">'+ageContent+'</div>':'')
    +'</div>';

  return '<div class="phase-content-grid"><div class="phase-column" id="raceColumnSection">'+renderRacePanel()+'</div><div class="phase-column" id="attributeColumnSection">'+topSection+'<div id="attributeMatrixSection">'+renderAttributeMatrix()+'</div></div></div>';
}


renderSkillChoices=function(group,available,needed,title,notes=''){
  const chosen=state.skills[group]||[],requirements=classFutureRequirements().skills,limitReached=chosen.length>=needed;
  return panel(title,'<div class="skill-grid">'+available.map(id=>{
    const selected=chosen.includes(id),already=allTrainedSkills().includes(id)&&!selected,exhausted=limitReached&&!selected&&!already,related=requirements.filter(req=>req.skill===id),tooltip=related.length?'Pré-requisito futuro: '+related.slice(0,8).map(req=>req.power+' no nível '+req.level).join('; ')+'.':'';
    return '<label class="check-card '+(selected?'selected ':'')+(already?'disabled ':'')+(exhausted?'choice-exhausted ':'')+(related.length?'prereq':'')+'" '+(tooltip?'data-tooltip="'+esc(tooltip)+'"':'')+'><input type="checkbox" data-action="skill" data-group="'+group+'" value="'+id+'" '+(selected?'checked':'')+' '+(already||exhausted?'disabled':'')+'><span><strong>'+esc(SKILL_LABEL[id]||id)+'</strong><small>'+esc(SKILLS.find(item=>item[0]===id)?.[2]?.toUpperCase()||'')+(related.length?' · requisito futuro':'')+(already?' · já treinada':'')+(exhausted?' · escolhas completas':'')+'</small></span></label>';
  }).join('')+'</div>'+(notes?'<p class="help" style="margin-top:9px">'+esc(notes)+'</p>':'')+'<p class="help" style="margin-top:7px">Perícias com borda dourada são exigidas por poderes futuros. Passe o mouse sobre elas para ver quais.</p>','Selecionadas: '+chosen.length+'/'+needed);
};

function applyCompletedChoiceAppearance(){
  if(typeof document.querySelectorAll!=='function')return;
  const fadeUnchecked=(selector,limit)=>{
    const inputs=[...document.querySelectorAll(selector)],selected=inputs.filter(input=>input.checked).length;
    if(selected<Number(limit||0))return;
    inputs.filter(input=>!input.checked&&!input.disabled).forEach(input=>{input.disabled=true;input.closest('label')?.classList.add('choice-exhausted')});
  };
  fadeUnchecked('[data-action="origin-benefit"]',2);
  racePowerGroups().forEach(group=>fadeUnchecked('[data-action="race-power"][data-group="'+CSS.escape(group.id)+'"]',group.quantity));
  const radioGroups=new Map();
  document.querySelectorAll('input[type="radio"]').forEach(input=>{
    const key=input.dataset.action+':'+(input.dataset.choiceId||input.dataset.field||input.name||'default');
    if(!radioGroups.has(key))radioGroups.set(key,[]);
    radioGroups.get(key).push(input);
  });
  radioGroups.forEach(inputs=>{if(inputs.some(input=>input.checked))inputs.filter(input=>!input.checked).forEach(input=>input.closest('label')?.classList.add('choice-alternative'))});
  if(state.deity.name)document.querySelectorAll('.deity-card').forEach(card=>card.classList.toggle('choice-alternative',!card.classList.contains('selected')));
}

function renderSkillsSplit(){
  const cls=classById(state.identity.classId),mandatory=mandatoryClassSkills(),raceFixed=typeof raceFixedSkills==='function'?raceFixedSkills():[],originSkills=[...originSkillIds(),...regionalSkillIds()],duplicate=mandatory.filter(id=>[...originSkills,...raceFixed].includes(id)).length,baseCount=Number(cls?.caracteristicas?.pericias?.escolhas?.quantidade||0),neededClass=baseCount,classOptions=(cls?.caracteristicas?.pericias?.escolhas?.opcoes||[]).map(option=>option.id),intCount=Math.max(0,finalAttrs().int),raceCount=raceSkillSlots(),definedSkillsOrdered=[...mandatory,...raceFixed,...originSkills];
  const defined=panel('Treinos já definidos','<div class="tag-row">'+(definedSkillsOrdered.length?definedSkillsOrdered.map(id=>'<span class="tag amber">'+esc(skillDisplayName(id))+'</span>').join(''):'<span class="tag amber">Nenhum</span>')+'</div><p class="help" style="margin-top:8px">Perícias de classe, raça e origens. Uma duplicação obrigatória gera uma escolha substituta da lista de classe.</p>')+renderRequirementWarnings('skills');
  const choices=renderSkillChoices('class',classOptions,neededClass,'Perícias de classe','Escolha apenas entre a lista da classe.')+renderSkillChoices('int',SKILLS.map(item=>item[0]),intCount,'Perícias de Inteligência','Quantidade igual à Inteligência final, mínimo zero.')+(raceCount?renderSkillChoices('race',SKILLS.map(item=>item[0]),raceCount,'Perícias da raça','Concedidas por Versátil, do humano.'):'')+(duplicate?renderSkillChoices('duplicate',classOptions,duplicate,'Perícias substitutas por duplicidade','Você recebeu perícias que já treinava na classe; escolha substitutas na lista de classe.'):'');
  return '<div class="phase-content-grid"><div class="phase-column">'+defined+'</div><div class="phase-column">'+choices+'</div></div>';
}

function classMissingChoices(){
  const missing=[],cls=classById(state.identity.classId),fixed=cls?.caracteristicas?.pericias?.fixas||[];
  if(!state.identity.characterName.trim())missing.push({title:'Nome do personagem',message:'Digite o nome do personagem.',selector:'[data-field="characterName"]'});
  if(!state.identity.playerName.trim())missing.push({title:'Nome do jogador',message:'Digite o nome do jogador.',selector:'[data-field="playerName"]'});
  fixed.forEach((entry,index)=>{
    if(entry.tipo==='escolha'&&!state.identity.classRequiredChoices[index])missing.push({title:'Perícia obrigatória da classe',message:'Escolha uma das perícias obrigatórias flexíveis de '+cls.nome+'.',selector:'[data-field="class-required"][data-index="'+index+'"]'});
    if(entry.tipo!=='escolha'&&skillTokenFromName(entry.id)==='oficio'&&!state.identity.classRequiredOffices[index])missing.push({title:'Ofício obrigatório da classe',message:'Escolha qual especialização de Ofício '+cls.nome+' possui.',selector:'[data-action="class-fixed-office"][data-index="'+index+'"]'});
  });
  classChoiceDescriptors(cls).forEach(def=>{
    const primary=selectedOption(def,'class');
    if(!primary){missing.push({title:def.nome||'Escolha de classe',message:'Escolha uma opção para '+(def.nome||'a habilidade de classe')+'.',selector:'[data-action="class-choice"][data-choice-id="'+def.id+'"]'});return}
    const secondaryOptions=primary.escolhas_secundarias||[];
    if(!secondaryOptions.length)return;
    const secondaryId=def.id+'__secundaria',secondary=selectedOption({id:secondaryId,opcoes:secondaryOptions},'class');
    if(!secondary){missing.push({title:'Linhagem do feiticeiro',message:'Escolha qual linhagem fornece os poderes de seu feiticeiro.',selector:'[data-action="class-choice"][data-choice-id="'+secondaryId+'"]'});return}
    (secondary.escolhas_terciarias||[]).forEach(choice=>{const id=def.id+'__'+choice.id;if(!state.identity.classChoices[id])missing.push({title:choice.nome||'Detalhe da linhagem',message:choice.origemDados==='deuses'?'Escolha o deus maior associado à Linhagem Abençoada.':'Conclua a escolha de '+(choice.nome||'detalhe da linhagem')+'.',selector:'[data-action="class-choice"][data-choice-id="'+id+'"]'})});
  });
  return missing;
}

function raceMissingChoices(){
  const missing=[],race=raceById(state.identity.raceId);
  if(pointSpent()!==10)missing.push({title:'Compra de atributos',message:'Distribua exatamente os 10 pontos. Ainda restam '+(10-pointSpent())+' ponto(s).',selector:'.point-banner'});
  if(state.identity.openRaceBonusEnabled&&isRaceEligibleForOpenRaces(race)){
    const needed=raceFixedModifiers(race).length;
    const allocated=Object.keys(state.identity.openRaceAllocations||{}).length;
    if(allocated<needed)missing.push({title:'Raças Abertas',message:'Distribua todos os '+needed+' modificadores raciais nos atributos (faltam '+(needed-allocated)+').',selector:'.open-races-card'});
  }
  raceAllocationSources().forEach(source=>{const amount=allocationValues(source.key).length,required=Number(source.config.quantidade||0);if(amount!==required)missing.push({title:source.label||'Atributos raciais',message:'Escolha '+(required-amount)+' modificador(es) que ainda faltam na coluna Racial para '+(source.label||race.nome)+'.',selector:'[data-action="allocation"][data-key="'+source.key+'"]'})});
  (race?.habilidades?.selecionadas||[]).forEach(def=>{
    if(def.tipo==='escolha_multipla'||def.tipo==='atributos_flexiveis')return;
    const required=def.obrigatoria||def.id==='humano_versatil'||def.id==='duende_tabu';
    const option=selectedRaceOption(def);
    if(required&&!option){
      const selector=def.id==='duende_tabu'?'[data-action="duende-tabu-preset"]':'[data-action="race-choice"][data-choice-id="'+def.id+'"]';
      missing.push({title:def.nome||'Escolha racial',message:'Escolha uma opção para '+(def.nome||'a habilidade de raça')+'.',selector});
      return;
    }
  });
  (race?.habilidades?.fixas||[]).forEach(ability=>{if(ability.escolha?.obrigatoria&&ability.escolha.tipo!=='escolha_multipla'&&!state.identity.raceChoices[ability.id])missing.push({title:ability.nome,message:'Escolha uma opção para '+ability.nome+'.',selector:'[data-action="race-choice"][data-choice-id="'+ability.id+'"]'})});
  if(race.id==='golem_desperto'&&state.identity.raceChoices.golem_desperto_fonte==='Elemental'&&!state.identity.raceChoices.golem_fonte_elemento)missing.push({title:'Elemento da fonte',message:'Escolha o elemento da Fonte de Energia do golem.',selector:'[data-action="race-choice"][data-choice-id="golem_fonte_elemento"]'});
  return missing;
}

function originMissingChoices(){
  if(shouldSkipOriginPhase())return [];
  const missing=[];
  const isSingleRegional = state.origin.mode === 'single' && Boolean(selectedRegionalOrigin());
  const activeRegional = selectedRegionalOrigin();

  if(isChildCharacter()){
    if(!state.origin.standard)missing.push({title:'Origem',message:'Escolha a origem do personagem.',selector:'[data-field="standardOrigin"]',step:3});
    else if(!isSingleRegional && originBenefitsCount()!==1)missing.push({title:'Benefício da origem',message:'Crianças recebem apenas 1 benefício da origem padrão (atualmente selecionados: '+originBenefitsCount()+').',selector:'.benefit-list',step:3});
    return missing;
  }
  if(isTeenCharacter()){
    if(state.origin.mode==='single'){
      if(!state.origin.standard)missing.push({title:'Origem',message:'Escolha a origem do personagem.',selector:'[data-field="standardOrigin"]',step:3});
      else if(!isSingleRegional && originBenefitsCount()!==1)missing.push({title:'Benefício da origem',message:'Adolescentes com origem única recebem apenas 1 benefício da origem padrão (atualmente selecionados: '+originBenefitsCount()+').',selector:'.benefit-list',step:3});
      return missing;
    } else {
      const hasStandardComplete=Boolean(state.origin.standard&&originBenefitsCount()===2&&!state.origin.regional);
      const hasRegionalComplete=Boolean(state.origin.regional&&!state.origin.standard&&originBenefitsCount()===0);
      if(!hasStandardComplete&&!hasRegionalComplete){
        missing.push({title:'Origem do adolescente',message:'Adolescentes em modo dual devem escolher uma Origem Padrão completa (com 2 benefícios) OU uma Origem Regional.',selector:'[data-field="standardOrigin"], [data-field="regionalOrigin"]',step:3});
      }
      return missing;
    }
  }
  if(!state.origin.standard)missing.push({title:'Origem',message:'Escolha a origem do personagem.',selector:'[data-field="standardOrigin"]',step:3});
  if(state.origin.standard&&!isSingleRegional&&originBenefitsCount()!==2)missing.push({title:'Benefícios da origem',message:'Escolha exatamente dois benefícios da origem padrão. Faltam '+(2-originBenefitsCount())+'.',selector:'.benefit-list',step:3});

  if(activeRegional){
    const regSlug = typeof slug === 'function' ? slug(activeRegional.nome) : '';
    if(regSlug === 'duplo_feerico' && (typeof selectedDuploFeericoPower !== 'function' || !selectedDuploFeericoPower())){
      missing.push({title:'Duplo Feérico',message:'Escolha uma habilidade de classe de 1º nível para a origem Duplo Feérico.',selector:'[data-action="duplo-feerico-select-dropdown"], #duploFeericoChoiceSection, [data-action^="duplo-feerico"]',step:3});
    }
    if(regSlug === 'aspirante_a_heroi' && !state.origin?.aspiranteHeroiAttr){
      missing.push({title:'Aspirante a Herói',message:'Escolha 1 atributo para receber o bônus permanente de +1 da origem.',selector:'.aspirante-heroi-section',step:3});
    }
    if(regSlug === 'de_outro_mundo' && !state.origin?.deOutroMundo?.spellId){
      missing.push({title:'De Outro Mundo',message:'Escolha uma magia de 1º círculo para a origem De Outro Mundo.',selector:'.de-outro-mundo-section',step:3});
    }
  }

  if(state.origin.mode==='dual'){
    if(!state.origin.regional){
      missing.push({title:'Origem regional',message:'Escolha a origem regional que acompanhará a origem padrão.',selector:'[data-field="regionalOrigin"]',step:3});
    }
  }
  return missing;
}

function skillMissingChoices(){
  const missing=[],limits=typeof skillChoiceLimits==='function'?skillChoiceLimits():{class:Number(classById(state.identity.classId)?.caracteristicas?.pericias?.escolhas?.quantidade||0),int:Math.max(0,finalAttrs().int),race:raceSkillSlots(),duplicate:0},labels={class:'perícias de classe',int:'perícias de Inteligência',race:'perícias da raça',duplicate:'perícias substitutas por duplicidade'};
  Object.entries(limits).forEach(([group,required])=>{
    if(!required&&group!=='class'&&group!=='int')return;
    const amount=(state.skills[group]||[]).length;
    if(amount!==required){
      const diff=required-amount;
      const msg=diff>0?(group==='int'?'Você possui Inteligência '+required+' e precisa escolher mais '+diff+' perícia(s) de Inteligência.':'Escolha mais '+diff+' '+labels[group]+' que ainda faltam.'):'Você selecionou '+(-diff)+' a mais em '+labels[group]+'. Desmarque o excesso.';
      missing.push({title:labels[group],message:msg,selector:'[data-action="skill"][data-group="'+group+'"]',step:4});
    }
  });
  return missing;
}

function powerMissingChoices(){
  if(!characterHasPowerChoices())return [];
  const missing=[];
  racePowerGroups().forEach(group=>{const amount=(state.powers.raceGroups[group.id]||[]).length;if(amount!==Number(group.quantity||0))missing.push({title:group.name,message:'Escolha '+(Number(group.quantity||0)-amount)+' poder(es) que ainda faltam em '+group.name+'.',selector:'[data-action="race-power"][data-group="'+group.id+'"]',step:6})});
  const generalMissing=generalPowerSlots()-state.powers.general.filter(Boolean).length;
  if(generalMissing>0)missing.push({title:'Poder geral',message:'Escolha '+generalMissing+' poder(es) geral(is) que ainda faltam.',selector:'[data-action="power-preview"], .power-browser',step:6});
  (typeof originGeneralPowerOptions==='function'?originGeneralPowerOptions():[]).forEach(opt=>{
    if(!state.powers?.originGeneral?.[opt.id]){
      const label = opt.category === 'combate_ou_tormenta' ? 'Combate ou Tormenta' : (opt.category === 'combate' ? 'Combate' : 'Tormenta');
      missing.push({title:'Poder da origem',message:'Escolha o poder de '+label+' concedido pela origem.',selector:'[data-action="origin-general-power"][data-benefit-id="'+opt.id+'"]',step:6});
    }
  });
  if(typeof hasDuploFeerico==='function'&&hasDuploFeerico()&&!selectedDuploFeericoPower()){
    missing.push({title:'Duplo Feérico',message:'Escolha uma habilidade de classe de 1º nível para Duplo Feérico.',selector:'[data-action^="duplo-feerico"]',step:6});
  }
  if(typeof hasCosmopolita==='function'&&hasCosmopolita()&&!selectedCosmopolitaPower()){
    missing.push({title:'Origem Cosmopolita',message:'Escolha o poder concedido pela origem Cosmopolita.',selector:'[data-action^="cosmopolita-"]',step:6});
  }
  if(typeof hasFuturaLenda==='function'&&hasFuturaLenda()&&!selectedFuturaLendaPower()){
    missing.push({title:'Futura Lenda',message:'Escolha um poder de classe de 2º nível para a origem Futura Lenda.',selector:'[data-action^="futura-lenda-"]',step:6});
  }
  return missing;
}

function deityMissingChoices(){
  const missing=[],rule=devotionRule();
  if(rule.forced==='none')return missing;
  if(!state.deity.mode)missing.push({title:'Tipo de devoção',message:'Escolha seu tipo de devoção (Não devoto, Panteão ou Divindade).',selector:'[data-field="deityMode"]',step:5});
  if(rule.forced==='devout'&&state.deity.mode==='none')missing.push({title:'Devoção obrigatória',message:'Esta classe exige devoção. Escolha o Panteão ou uma divindade.',selector:'[data-field="deityMode"]',step:5});
  if(state.deity.mode==='devout'&&!state.deity.name)missing.push({title:'Poder e divindade',message:'Escolha uma divindade para receber o poder concedido.',selector:'.deity-grid',step:5});
  if(state.deity.mode==='devout'&&state.deity.name){
    const required=deityPowerCount(),values=deityPowerValues().filter(Boolean);
    if(values.length!==required)missing.push({title:'Poder concedido',message:'Escolha '+(required-values.length)+' poder(es) concedido(s) que ainda faltam.',selector:'[data-action="deity-power"]',step:5});
    if(new Set(values.map(slug)).size!==values.length)missing.push({title:'Poder repetido',message:'Escolha poderes concedidos diferentes para cada espaço.',selector:'[data-action="deity-power"]',step:5});
  }
  return missing;
}

function missingChoices(step){
  if(step===1)return classMissingChoices();
  if(step===2)return raceMissingChoices();
  if(step===3)return originMissingChoices();
  if(step===4)return skillMissingChoices();
  if(step===5)return deityMissingChoices();
  if(step===6)return powerMissingChoices();
  if(step===7)return typeof spellMissingChoices==='function'?spellMissingChoices():[];
  if(step===8)return [];
  if(step===9)return typeof partnerMissingChoices==='function'?partnerMissingChoices():[];
  if(step===10)return typeof characterPendingChoices==='function'?characterPendingChoices():[];
  return [];
}

function locateMissingChoice(selector,smooth=true){
  if(!selector)return;
  const element=document.querySelector(selector);
  if(!element)return;
  const target=element.closest('.choice-section,.attribute-matrix-row,.benefit-list,.deity-grid,.panel')||element;
  target.scrollIntoView({behavior:smooth?'smooth':'auto',block:'center'});
  target.classList.remove('validation-target');
  void target.offsetWidth;
  target.classList.add('validation-target');
  setTimeout(()=>target.classList.remove('validation-target'),3200);
  if(['INPUT','SELECT','BUTTON'].includes(element.tagName)&&!element.disabled)setTimeout(()=>element.focus({preventScroll:true}),smooth?450:0);
}

function showMissingChoiceWarning(items){
  const modal=document.getElementById('warningModal'),first=items[0];
  const step = first?.step || (first?.selector === '[data-action="summary-spells"]' ? 7 : (first?.selector?.match(/data-step="(\d+)"/)?.[1] ? Number(first.selector.match(/data-step="(\d+)"/)[1]) : state.step));
  modal.dataset.targetStep = String(step || '');
  locateMissingChoice(first?.selector,false);
  document.getElementById('warningModalTitle').textContent=items.length===1?'Falta concluir uma escolha':'Faltam '+items.length+' escolhas';
  document.getElementById('warningModalBody').innerHTML='<p>Conclua o que está indicado abaixo antes de avançar.</p><div class="confirm-list">'+items.map(item=>'<div class="confirm-item"><strong>'+esc(item.title)+'</strong><span>'+esc(item.message)+'</span></div>').join('')+'</div>';
  document.getElementById('warningCancel').textContent='Ir para a opção';
  document.getElementById('warningContinue').hidden=true;
  modal.dataset.mode='missing';modal.dataset.target=first?.selector||'';modal.hidden=false;
}

phaseIsComplete=function(step){
  if(step===1)return Boolean(state.identity.characterName.trim()&&state.identity.playerName.trim()&&state.identity.classId&&Number(state.identity.plannedLevel)>=1&&classSelectionsComplete());
  if(step===2)return pointSpent()===10&&raceSelectionsComplete();
  if(step===3){
    if(shouldSkipOriginPhase())return true;
    return originMissingChoices().length===0;
  }
  if(step===4){
    const limits=typeof skillChoiceLimits==='function'?skillChoiceLimits():{class:Number(classById(state.identity.classId)?.caracteristicas?.pericias?.escolhas?.quantidade||0),int:Math.max(0,finalAttrs().int),race:raceSkillSlots(),duplicate:0};
    const groups=['class','int'];
    if((limits.race||0)>0)groups.push('race');
    if((limits.duplicate||0)>0)groups.push('duplicate');
    return groups.every(group=>(state.skills[group]||[]).length===(limits[group]||0));
  }
  if(step===5){
    const rule=devotionRule();
    if(rule.forced==='none')return true;
    if(!state.deity.mode)return false;
    if(rule.forced==='devout'&&state.deity.mode==='none')return false;
    if(state.deity.mode==='devout'){
      const deity=chosenDeity(),values=deityPowerValues().filter(Boolean);
      return Boolean(deity&&values.length===deityPowerCount()&&new Set(values.map(slug)).size===values.length&&values.every(name=>(deity.poderes_concedidos||[]).some(power=>slug(power)===slug(name))));
    }
    return true;
  }
  if(step===6){
    if(!characterHasPowerChoices())return true;
    return powerMissingChoices().length===0;
  }
  if(step===7){
    if(!characterHasSpellChoices())return true;
    return typeof spellMissingChoices==='function'?spellMissingChoices().length===0:true;
  }
  if(step===8)return true;
  if(step===9)return typeof partnerMissingChoices==='function'?partnerMissingChoices().length===0:true;
  if(step===10)return typeof characterPendingChoices==='function'?characterPendingChoices().length===0:true;
  return true;
};

validationMessage=function(step,short=false){
  if(phaseIsComplete(step))return short?'Etapa pronta para continuar.':'Etapa completa.';
  const messages={
    1:'Preencha os nomes do personagem e jogador e conclua as escolhas obrigatórias da classe.',
    2:pointSpent()!==10?'Gaste exatamente os 10 pontos de atributos.':'Conclua as escolhas da raça.',
    3:'Escolha a origem, exatamente dois benefícios e, se necessário, uma origem regional.',
    4:'Complete todas as perícias de classe, Inteligência, raça e duplicidades.',
    5:'Escolha seu tipo de devoção (Não devoto, Panteão ou Divindade e poderes concedidos).',
    6:'Complete as escolhas de poderes gerais e raciais.',
    7:'Conclua as magias e escolas no Grimório.',
    8:'Conclua ou pule as escolhas de equipamento inicial.',
    9:'Revise os níveis e finalize a ficha.'
  };
  return messages[step]||'Revise as informações desta etapa.';
};

renderNav=function(){
  const nav=document.getElementById('phaseNav');
  if(!nav)return;
  const isLevelUp = Boolean(state.isLevelingUp);
  const visibleSteps=PHASES.map((p,i)=>i+1).filter(s=>!(typeof shouldSkipPhase==='function'&&shouldSkipPhase(s)));
  nav.innerHTML='<div class="phase-nav-title">'+(isLevelUp?'Subida de nível':'Etapas')+'</div>'+PHASES.map((phase,index)=>{
    const number=index+1;
    if(typeof shouldSkipPhase==='function'&&shouldSkipPhase(number))return '';
    const visualIdx=visibleSteps.indexOf(number);
    const visualNum=visualIdx>=0?visualIdx+1:number;
    const isLocked=typeof isPhaseLockedInLevelUp==='function'?isPhaseLockedInLevelUp(number):Boolean(state.isLevelingUp&&number<=6);
    const done=number===7?phaseIsComplete(7)&&(state.completed.includes(number)||number===state.step):state.completed.includes(number)||(number===state.step&&phaseIsComplete(number));
    return '<button class="phase-button '+(number===state.step?'active ':'')+(done?'done ':'')+(isLocked?'locked-phase ':'')+'" data-step="'+number+'" '+(isLocked?'disabled title="Bloqueado durante avanço de nível"':'')+'><span class="phase-number">'+(isLocked?'#':visualNum)+'</span><span class="phase-label">'+esc(phase[0])+'</span><span class="phase-state"></span></button>';
  }).join('');
  const activeBtn=nav.querySelector('.phase-button.active');
  if(activeBtn&&typeof activeBtn.scrollIntoView==='function'){
    activeBtn.scrollIntoView({inline:'center',block:'nearest',behavior:'smooth'});
  }
};



function unmetAttributeRequirements(){
  const attrs=finalAttrs(),map=new Map();
  classFutureRequirements().attrs.filter(req=>attrs[req.attr]<req.value).forEach(req=>{
    const key=req.attr+'|'+req.value+'|'+req.level,entry=map.get(key)||{kind:'attribute',id:req.attr,value:req.value,level:req.level,powers:[]};
    if(!entry.powers.includes(req.power))entry.powers.push(req.power);
    map.set(key,entry);
  });
  return [...map.values()].sort((a,b)=>a.level-b.level||a.id.localeCompare(b.id));
}

document.addEventListener('change',event=>{
  if(event.target.dataset.action==='toggle-open-races'){
    state.identity.openRaceBonusEnabled=Boolean(event.target.checked);
    state.identity.openRaceAllocations={};
    persist();
    renderStage();
  }
  if(event.target.dataset.action==='toggle-race-optimize'){
    const val=Boolean(event.target.checked);
    state.identity.optimizeRaces=val;
    state.identity.sortRacesByEfficiency=val;
    persist();
    renderStage();
  }
});

document.addEventListener('click',event=>{
  const assignBtn=event.target.closest?.('[data-action="open-race-assign"]');
  if(assignBtn){
    const attr=assignBtn.dataset.attr;
    const val=Number(assignBtn.dataset.val);
    state.identity.openRaceAllocations=state.identity.openRaceAllocations||{};
    state.identity.openRaceAllocations[attr]=val;
    persist();
    renderStage();
    return;
  }
  const removeBtn=event.target.closest?.('[data-action="open-race-remove"]');
  if(removeBtn){
    const attr=removeBtn.dataset.attr;
    if(state.identity.openRaceAllocations){
      delete state.identity.openRaceAllocations[attr];
    }
    persist();
    renderStage();
    return;
  }
  const resetBtn=event.target.closest?.('[data-action="reset-open-races"]');
  if(resetBtn){
    state.identity.openRaceAllocations={};
    persist();
    renderStage();
    return;
  }
});