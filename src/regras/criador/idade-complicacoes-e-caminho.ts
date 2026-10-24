(function(){
const ATTR_NAMES={for:'Força',des:'Destreza',con:'Constituição',int:'Inteligência',sab:'Sabedoria',car:'Carisma'};
const BANDS=window.__FORJA_DATA__.BANDS;
const COMPLICATIONS=window.__FORJA_DATA__.COMPLICATIONS;
const AGE_POWERS=window.__FORJA_DATA__.AGE_POWERS;
function ensure(){state.age=Object.assign({enabled:false,band:'',years:'',mode:'benefits',complications:[],notice:'',editingComplications:false},state.age||{});if(!Array.isArray(state.age.complications))state.age.complications=[]}
function multiplier(){return 1}
function ranges(){return RegrasIdade.intervalos(BANDS)}
function rule(){ensure();const band=BANDS[state.age.band],range=ranges()[state.age.band];return band&&range?Object.assign({},band,range):null}
function overlap(){return false}
function mods(){return RegrasIdade.modificadores(rule())}
function clamp(){const result=RegrasIdade.limitar(state.age.years,rule());if(result)Object.assign(state.age,result)}
const baseFinalAttrs=finalAttrs;
finalAttrs=function(){
  const result=baseFinalAttrs();
  const rCamp = typeof RegrasCampanha !== 'undefined' ? RegrasCampanha.obterRegrasCampanha(state) : state?.regrasCampanha;
  if(rCamp?.idade === 'basico'){
    const ageBasico = (typeof RegrasCampanha !== 'undefined' ? RegrasCampanha.modificadoresIdade(state) : null) || { for:0,des:0,con:0,int:0,sab:0,car:0 };
    Object.keys(result).forEach(id=>result[id]+=Number(ageBasico[id]||0));
  } else if(state.age?.enabled){
    const age=mods();
    Object.keys(result).forEach(id=>result[id]+=Number(age[id]||0));
  }
  return result;
};
function isIndividualComplicationsActive(){
  const rCamp = typeof RegrasCampanha !== 'undefined' ? RegrasCampanha.obterRegrasCampanha(state) : state?.regrasCampanha;
  return Boolean(state.complicacoesIndividual || rCamp?.complicacoes);
}
function totalComplicationsLimit(){
  const r = rule();
  const ageLimit = state.age?.enabled ? Number(r?.count || 0) : 0;
  const indLimit = isIndividualComplicationsActive() ? 1 : 0;
  return ageLimit + indLimit;
}
function adultBonusPowers(){
  if (!state.age?.enabled || state.age.band !== 'adulto') return 0;
  // No adulto, o poder de idade base é garantido. A complicação de idade é opcional; se escolhida, concede +1 poder geral extra.
  const compsCount = (state.age?.complications || []).length;
  return compsCount >= 1 ? 1 : 0;
}

function individualComplicationGrantedPowers(){
  if (!isIndividualComplicationsActive()) return 0;
  const r = rule();
  const totalComps = (state.age?.complications || []).length;
  if (!state.age?.enabled) {
    return totalComps >= 1 ? 1 : 0;
  }
  if (state.age.band === 'adulto') {
    return totalComps >= 2 ? 1 : 0;
  }
  const ageLimit = Number(r?.count || 0);
  return totalComps > ageLimit ? 1 : 0;
}
const baseGeneralPowerSlots=generalPowerSlots;
generalPowerSlots=function(){
  const r=rule();
  const agePowers = Number(state.age?.enabled ? (r?.generalPowers || 0) : 0);
  const adultBonus = adultBonusPowers();
  const indPowers = individualComplicationGrantedPowers();
  return baseGeneralPowerSlots() + agePowers + adultBonus + indPowers;
};

function panelHtml(){
  ensure();
  const rs=ranges(),r=rule();
  const indActive = isIndividualComplicationsActive();
  const ageLimit = state.age?.enabled ? Number(r?.count || 0) : 0;
  const limit = ageLimit + (indActive ? 1 : 0);

  let complicationsHtml='';
  if(limit > 0){
    const chosenNames=state.age.complications.map(id=>{
      const c=COMPLICATIONS.find(item=>item[0]===id);
      return c?c[1]:id;
    });
    const isOptional = Boolean((state.age?.enabled && r?.optional) || indActive);
    const hasChosen = chosenNames.length > 0;
    const buttonLabel = hasChosen ? 'Trocar complicação' + (limit > 1 ? 's' : '') : 'Escolher complicação' + (limit > 1 ? 's' : '');
    const buttonClass = hasChosen ? 'button' : 'button primary';

    complicationsHtml='<div class="choice-section age-complications-collapsed" style="margin-top:12px;">'
      +'<div class="age-complications-collapsed-row" style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;">'
      +'<div style="flex:1;"><span class="field-label" style="display:block;margin-bottom:6px">COMPLICAÇ'+(limit>1?'ÕES':'ÃO')+(isOptional?' (OPCIONAL)':'')+' ('+state.age.complications.length+'/'+limit+')</span>'
      +(hasChosen
        ? '<div class="tag-row" style="display:flex;flex-wrap:wrap;gap:6px;">'+chosenNames.map(name=>'<span class="tag gold" style="font-family:var(--font-display,\'Tormenta\',Cinzel,serif);">'+esc(name)+'</span>').join('')+'</div>'
        : '<div class="empty" style="font-size:0.75rem;color:var(--muted);padding:4px 0;">Nenhuma complicação selecionada.</div>'
      )
      +'</div>'
      +'<button type="button" class="'+buttonClass+'" data-action="open-age-complications-modal" style="min-height:30px;padding:5px 12px;font-size:0.75rem;white-space:nowrap;margin-top:2px;">'+esc(buttonLabel)+'</button>'
      +'</div></div>';
  }

  let agePowersHtml = '';
  if (state.age.enabled && ['crianca', 'adolescente'].includes(state.age.band)) {
    const powers = (AGE_POWERS || []).filter(p => p.faixa === state.age.band);
    if (powers.length) {
      agePowersHtml = '<div class="choice-section age-powers-display" style="margin-top:12px">'
        + '<h4>Habilidade' + (powers.length > 1 ? 's' : '') + ' da Faixa Etária</h4>'
        + '<div class="ability-list">'
        + powers.map(p => '<div class="ability-card" style="border:1px solid var(--line);border-radius:8px;padding:9px 12px;background:var(--panel2);margin-bottom:6px"><strong style="color:var(--gold2);font-family:var(--font-display,\'Tormenta\',Cinzel,serif);display:block;margin-bottom:4px">' + esc(p.nome) + '</strong><p style="margin:0;font-size:0.75rem;color:var(--muted);line-height:1.45">' + esc(p.descricao) + '</p></div>').join('')
        + '</div></div>';
    }
  }

  const ageFieldsHtml = state.age.enabled
    ? '<div class="grid two age-fields" style="margin-top:10px;"><label class="field"><span>Faixa etária</span><select class="select" data-age-field="band"><option value="">Escolha</option>'+Object.entries(BANDS).map(([id,b])=>{const x=rs[id];return '<option value="'+id+'" '+(state.age.band===id?'selected':'')+'>'+b.name+' · '+x.min+(x.max===null?'+':'–'+x.max)+'</option>'}).join('')+'</select></label>'+(r?'<label class="field"><span>Idade</span><input class="input" type="number" min="'+r.min+'" '+(r.max===null?'':'max="'+r.max+'"')+' value="'+esc(state.age.years)+'" data-age-field="years"></label>':'')+'</div>'
    : '';

  const notesHtml = r && r.notes && r.notes.length
    ? '<div class="age-notes-summary">'+r.notes.map(esc).join('<br>')+'</div>'
    : '';

  const noticeHtml = state.age.notice
    ? '<div class="age-notes-summary" style="color:var(--gold);">'+esc(state.age.notice)+'</div>'
    : '';

  return '<div class="panel age-extension">'
    + '<div class="panel-header"><div class="panel-title">Idade & Complicações</div><div class="panel-note">Regras Opcionais</div></div>'
    + '<div class="panel-body">'
    + '<div style="display:flex;flex-direction:column;gap:8px;">'
    + '<label class="age-check" style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:0.8rem;color:var(--cream);"><input type="checkbox" data-age-field="enabled" '+(state.age.enabled?'checked':'')+'> <strong>Usar regras de idade</strong> <span style="font-size:0.72rem;color:var(--muted);">(Heróis de Arton)</span></label>'
    + '<label class="age-check" style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:0.8rem;color:var(--cream);"><input type="checkbox" data-action="toggle-individual-complications" '+(indActive?'checked':'')+'> <strong>Usar regra de complicações</strong> <span style="font-size:0.72rem;color:var(--gold);">(+1 poder geral)</span></label>'
    + '</div>'
    + ageFieldsHtml
    + complicationsHtml
    + agePowersHtml
    + noticeHtml
    + notesHtml
    + '</div></div>';
}
window.renderAgePanelHtml=panelHtml;

let modalSelectedComplications = [];

function openAgeComplicationsModal(){
  ensure();
  const limit = totalComplicationsLimit();
  if(limit <= 0){
    toast('Nenhuma complicação disponível para a faixa ou variante atual.');
    return;
  }
  modalSelectedComplications = [...(state.age?.complications || [])];
  let modal = document.getElementById('ageComplicationsModal');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'ageComplicationsModal';
    modal.className = 'modal-backdrop';
    document.body.appendChild(modal);
  }
  updateAgeComplicationsModalContent();
  modal.removeAttribute('hidden');
  modal.style.display = 'grid';
}
if(typeof window !== 'undefined'){
  window.openAgeComplicationsModal = openAgeComplicationsModal;
}

function closeAgeComplicationsModal(){
  const modal = document.getElementById('ageComplicationsModal');
  if(modal){
    modal.setAttribute('hidden', '');
    modal.style.display = 'none';
  }
}
if(typeof window !== 'undefined'){
  window.closeAgeComplicationsModal = closeAgeComplicationsModal;
}

function updateAgeComplicationsModalContent(){
  const modal = document.getElementById('ageComplicationsModal');
  if(!modal) return;
  const r = rule();
  const indActive = isIndividualComplicationsActive();
  const ageLimit = state.age?.enabled ? Number(r?.count || 0) : 0;
  const limit = ageLimit + (indActive ? 1 : 0);
  const isOptional = Boolean((state.age?.enabled && r?.optional) || indActive);
  const selectedCount = modalSelectedComplications.length;

  let subtitle = 'Você pode selecionar até ' + limit + ' complicação' + (limit > 1 ? 'ões' : '') + '.';
  if(state.age?.enabled && indActive && ageLimit > 0){
    subtitle = 'Você tem direito a ' + limit + ' complicações (' + ageLimit + ' da faixa etária + 1 da regra de complicação permanente).';
  } else if(indActive && (!state.age?.enabled || ageLimit === 0)){
    subtitle = 'Escolha 1 complicação para receber +1 poder geral extra.';
  } else if(state.age?.enabled && r?.name){
    subtitle = 'A faixa etária ' + r.name + ' concede ' + limit + ' complicação' + (limit > 1 ? 'ões' : '') + (isOptional ? ' (opcional).' : '.');
  }

  const cardsHtml = COMPLICATIONS.map(c => {
    const id = c[0], name = c[1], desc = c[2];
    const isSelected = modalSelectedComplications.includes(id);
    const disabled = !isSelected && selectedCount >= limit;
    return '<label class="age-comp-modal-card ' + (isSelected ? 'selected ' : '') + (disabled ? 'disabled ' : '') + '">'
      + '<input type="checkbox" data-modal-comp-id="' + esc(id) + '" ' + (isSelected ? 'checked' : '') + ' ' + (disabled ? 'disabled' : '') + ' style="margin-top:3px;accent-color:var(--gold);">'
      + '<span style="flex:1;">'
      + '<strong>' + esc(name) + '</strong>'
      + '<small>' + esc(desc) + '</small>'
      + '</span>'
      + '</label>';
  }).join('');

  modal.innerHTML = '<section class="confirm-modal age-complications-dialog" role="dialog" aria-modal="true">'
    + '<header>'
    + '<div>'
    + '<h3>Escolha de Complicações</h3>'
    + '<small style="color:var(--muted);font-size:0.78rem;display:block;margin-top:3px;">' + esc(subtitle) + '</small>'
    + '</div>'
    + '<button type="button" class="button" data-action="close-age-complications-modal" style="min-width:32px;padding:4px 8px;font-size:0.95rem;background:transparent;border:1px solid var(--line);color:var(--muted);cursor:pointer;" title="Fechar">✕</button>'
    + '</header>'
    + '<div class="confirm-modal-body">'
    + '<div class="age-complications-modal-grid">'
    + cardsHtml
    + '</div>'
    + '</div>'
    + '<footer>'
    + '<span id="ageCompModalCounter" style="font-size:0.85rem;font-weight:700;color:var(--gold2);font-family:var(--font-display,\'Tormenta\',Cinzel,serif);">Selecionadas: ' + selectedCount + '/' + limit + (isOptional ? ' (Opcional)' : '') + '</span>'
    + '<div style="display:flex;gap:10px;">'
    + '<button type="button" class="button" data-action="close-age-complications-modal">Cancelar</button>'
    + '<button type="button" class="button primary" data-action="confirm-age-complications-modal">Confirmar Escolha</button>'
    + '</div>'
    + '</footer>'
    + '</section>';
}

function syncAgeComplicationsModalDom(){
  const modal = document.getElementById('ageComplicationsModal');
  if(!modal) return;
  const r = rule();
  const indActive = isIndividualComplicationsActive();
  const ageLimit = state.age?.enabled ? Number(r?.count || 0) : 0;
  const limit = ageLimit + (indActive ? 1 : 0);
  const isOptional = Boolean((state.age?.enabled && r?.optional) || indActive);
  const selectedCount = modalSelectedComplications.length;

  const counterEl = modal.querySelector('#ageCompModalCounter');
  if(counterEl){
    counterEl.textContent = 'Selecionadas: ' + selectedCount + '/' + limit + (isOptional ? ' (Opcional)' : '');
  }

  const allCards = modal.querySelectorAll('.age-comp-modal-card');
  allCards.forEach(c => {
    const inp = c.querySelector('input[data-modal-comp-id]');
    if(!inp) return;
    const cid = inp.dataset.modalCompId;
    const isSel = modalSelectedComplications.includes(cid);
    inp.checked = isSel;
    c.classList.toggle('selected', isSel);
    const shouldDisable = !isSel && selectedCount >= limit;
    c.classList.toggle('disabled', shouldDisable);
    inp.disabled = shouldDisable;
    c.style.cursor = shouldDisable ? 'not-allowed' : 'pointer';
  });
}

function classPathText(){return ExportacaoPersonagem.caminho({
 identity:state.identity,progression:state.progression,classes:DATA.classes,
 powerById:id=>typeof progressionPowerById==='function'?progressionPowerById(id):DATA.classPowers.find(p=>p.id===id),
 features:typeof selectedCharacterFeatures==='function'?selectedCharacterFeatures():[],
 spells:typeof spellPlan==='function'&&typeof allLearnedSpellIds==='function'?[...allLearnedSpellIds(spellPlan())].map(id=>{const spell=DATA.spells.find(item=>item.id===id);return spell?{...spell,description:DATA.spellTexts?.[id]||spell.description||spell.descricao||spell.text}:null}):[],
 age:state.age,ageRule:state.age?.enabled?rule():null,complications:COMPLICATIONS
})}
function downloadClassPath(){const blob=new Blob([classPathText()],{type:'text/plain;charset=utf-8'}),link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=(state.identity.characterName||'Personagem')+' - Caminho da Classe.txt';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000)}
if(typeof window!=='undefined')window.downloadClassPath=downloadClassPath;
function closeAgeConfirmation(){document.getElementById('ageContinueConfirmation')?.remove()}
function confirmWithoutAge(){if(document.getElementById('ageContinueConfirmation'))return;const modal=document.createElement('div');modal.id='ageContinueConfirmation';modal.className='modal-backdrop';modal.innerHTML='<section class="confirm-modal"><header><h3>Continuar sem regras de idade?</h3></header><div class="confirm-modal-body"><p>Nenhuma regra de idade será aplicada a este personagem.</p></div><footer><button class="button" type="button" data-age-cancel>Voltar</button><button class="button primary" type="button" data-age-confirm>Continuar sem regras de idade</button></footer></section>';document.body.appendChild(modal)}

document.addEventListener('change',event=>{
  const field=event.target.dataset.ageField;
  if(field){
    ensure();
    if(field==='enabled'){
      state.age.enabled=event.target.checked;
      if(!state.age.enabled){
        const indActive = isIndividualComplicationsActive();
        if(!indActive){
          state.age.complications=[];
        } else if(state.age.complications.length > 1){
          state.age.complications = state.age.complications.slice(0, 1);
        }
      }
    }
    if(field==='band'){
      state.age.band=event.target.value;
      state.age.years='';
      state.age.complications=[];
      state.age.mode='benefits';
      state.age.editingComplications=false;
      clamp();
      persist();
      renderStage();
      const rNow = rule();
      const givesComps = (Number(rNow?.count || 0) > 0) || isIndividualComplicationsActive();
      if(givesComps){
        setTimeout(() => openAgeComplicationsModal(), 50);
      }
      return;
    }
    if(field==='years'){state.age.years=event.target.value;clamp()}
    persist();
    renderStage();
    return;
  }
  if(event.target.dataset.action==='toggle-individual-complications'){
    const checked=event.target.checked;
    state.complicacoesIndividual=checked;
    if(!state.regrasCampanha)state.regrasCampanha={};
    state.regrasCampanha.complicacoes=checked;
    persist();
    renderStage();
    if(checked){
      setTimeout(() => openAgeComplicationsModal(), 50);
    }
    return;
  }
  const modalCompInput = event.target.closest?.('input[data-modal-comp-id]');
  if(modalCompInput){
    const id = modalCompInput.dataset.modalCompId;
    const limit = totalComplicationsLimit();
    const idx = modalSelectedComplications.indexOf(id);
    if(modalCompInput.checked && idx < 0){
      if(modalSelectedComplications.length < limit){
        modalSelectedComplications.push(id);
      } else {
        modalCompInput.checked = false;
        toast('Você já selecionou o limite de ' + limit + ' complicação' + (limit > 1 ? 'ões' : '') + '.');
      }
    } else if(!modalCompInput.checked && idx >= 0){
      modalSelectedComplications.splice(idx, 1);
    }
    syncAgeComplicationsModalDom();
    return;
  }
  const id=event.target.dataset.ageComplication;
  if(id){
    const at=state.age.complications.indexOf(id);
    if(event.target.checked&&at<0)state.age.complications.push(id);
    if(!event.target.checked&&at>=0)state.age.complications.splice(at,1);
    persist();
    renderStage();
  }
});

document.addEventListener('click',event=>{
  if(event.target.closest?.('[data-action="open-age-complications-modal"]') || event.target.closest?.('[data-action="toggle-age-complications"]')){
    openAgeComplicationsModal();
    return;
  }
  if(event.target.closest?.('[data-action="close-age-complications-modal"]')){
    closeAgeComplicationsModal();
    return;
  }
  if(event.target.id === 'ageComplicationsModal'){
    closeAgeComplicationsModal();
    return;
  }
  if(event.target.closest?.('[data-action="confirm-age-complications-modal"]')){
    state.age.complications = [...modalSelectedComplications];
    state.age.editingComplications = false;
    persist();
    closeAgeComplicationsModal();
    renderStage();
    toast('Complicações atualizadas!');
    return;
  }
  const button=event.target.closest?.('[data-action="class-power-attribute"]'),r=rule();
  if(!button||!state.age.enabled||!r?.blocked?.includes(button.dataset.attr))return;
  event.preventDefault();
  event.stopImmediatePropagation();
  toast('Esta faixa etária bloqueia Aumento de Atributo em atributos físicos.');
},true);
document.addEventListener('click',event=>{
  if(event.target.closest?.('[data-age-cancel]')){closeAgeConfirmation();return}
  if(event.target.closest?.('[data-age-confirm]')){state.age.noRulesConfirmed=true;persist();closeAgeConfirmation();document.getElementById('nextButton')?.click();return}
  const next=event.target.closest?.('#nextButton');
  if(!next||state.step!==2)return;
  ensure();
  if(state.age.enabled&&!state.age.band){event.preventDefault();event.stopImmediatePropagation();toast('Escolha a faixa etária antes de continuar.');return}
  if(state.age.enabled&&state.age.years===''){state.age.years=String(rule().min);persist()}
  const required=Number(rule()?.count||0);
  if(state.age.enabled&&!rule()?.optional&&state.age.complications.length<required){
    event.preventDefault();
    event.stopImmediatePropagation();
    toast('Escolha '+required+' complicações de idade antes de continuar.');
    openAgeComplicationsModal();
    return;
  }
  if(!state.age.enabled&&!isIndividualComplicationsActive()&&!state.age.noRulesConfirmed){
    event.preventDefault();
    event.stopImmediatePropagation();
    confirmWithoutAge();
  }
},true);
const basePdfSetText=pdfSetText;pdfSetText=function(form,name,value){basePdfSetText(form,name,value);if(name==='Nível'&&state.age?.enabled&&rule()){const bandName=BANDS[state.age.band]?.name||'';const y=state.age.years||String(rule().min);basePdfSetText(form,'Idade',bandName&&y?`${y} (${bandName})`:bandName||y||'')}};
if(typeof pdfFeatureText==='undefined') pdfFeatureText=ExportacaoPersonagem.titulo;
if(typeof sheetFeatureSummary==='undefined') sheetFeatureSummary=function(){return ''};
if(typeof pdfInitialFeatureText==='undefined') pdfInitialFeatureText=function(){return selectedCharacterFeatures().filter(feature=>['race','origin','deity','general-power','age'].includes(feature.source)&&(typeof isSpellFieldFeature!=='function'||!isSpellFieldFeature(feature))&&(typeof isVisionFeature!=='function'||!isVisionFeature(feature))).map(feature=>feature.nome).filter(Boolean).join('\r\n')+(state.identity.raceId==='duende'&&state.identity.duendeTabuText?'\r\nTabu: '+state.identity.duendeTabuText:'')};
if(typeof characterSpellEntries==='undefined') characterSpellEntries=function(){if(typeof spellPlan!=='function'||typeof allLearnedSpellIds!=='function')return[];const names=[...allLearnedSpellIds(spellPlan())].map(id=>DATA.spells.find(spell=>spell.id===id)?.name).filter(Boolean);return[...new Set(names)].sort((a,b)=>a.localeCompare(b,'pt-BR'))};
function hasDuploFeerico(){return state.origin?.mode==='dual'&&slug(selectedRegionalOrigin()?.nome||'')==='duplo_feerico'}
let isCollectingDuploFeerico = false;
function duploFeericoOptions(){
  const myClassId = state.identity.classId;
  let existingSlugs = new Set();
  if(!isCollectingDuploFeerico && typeof baseSelectedCharacterFeatures === 'function'){
    isCollectingDuploFeerico = true;
    try {
      const existingFeatures = baseSelectedCharacterFeatures();
      existingSlugs = new Set(existingFeatures.map(f => slug(f.nome || '')));
    } catch {} finally {
      isCollectingDuploFeerico = false;
    }
  }
  return DATA.classes.filter(cls => cls.id !== myClassId).flatMap(cls => (cls.habilidades || []).filter(ability => Number(ability.nivel) === 1).map(ability => {
    const isSpellAbility = /magia/i.test(ability.nome) || /magia/i.test(ability.id);
    let desc = ability.descricao || '';
    if(isSpellAbility){
      desc = 'Você aprende uma única magia de 1º círculo da lista de ' + cls.nome + ' e recebe +1 ponto de mana (mas não soma o atributo-chave da habilidade em seu total de PM).';
    }
    return {
      ...ability,
      descricao: desc,
      isDuploSpell: isSpellAbility,
      classId: cls.id,
      className: cls.nome,
      key: cls.id + '|' + ability.id
    };
  })).filter(ability => {
    if(existingSlugs.has(slug(ability.nome))) return false;
    return true;
  }).filter((ability, index, list) => list.findIndex(other => other.key === ability.key) === index)
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR') || a.className.localeCompare(b.className, 'pt-BR'));
}
function selectedDuploFeericoPower(){return duploFeericoOptions().find(option=>option.key===state.powers?.duploFeericoClassPower)}

function hasFuturaLenda(){
  return state.origin?.mode==='dual'&&slug(typeof selectedRegionalOrigin==='function'?selectedRegionalOrigin()?.nome||'':state.origin?.regional||'')==='futura_lenda';
}
function futuraLendaOptions(){
  const myClassId = state.identity?.classId;
  if(!myClassId) return [];
  const classPowers = (DATA.classPowers || []).filter(p => (p.classeIds || []).includes(myClassId));
  return classPowers.filter(p => {
    const req = typeof parsePowerRequirements === 'function' ? parsePowerRequirements(p) : { level: 2 };
    if(req.level && req.level > 2) return false;
    return true;
  }).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}
function selectedFuturaLendaPower(){
  if(!hasFuturaLenda()) return null;
  return futuraLendaOptions().find(option => option.id === state.powers?.futuraLendaClassPower);
}

if (typeof window !== 'undefined') {
  window.hasDuploFeerico = hasDuploFeerico;
  window.selectedDuploFeericoPower = selectedDuploFeericoPower;
  window.duploFeericoOptions = duploFeericoOptions;
  window.hasFuturaLenda = hasFuturaLenda;
  window.selectedFuturaLendaPower = selectedFuturaLendaPower;
  window.futuraLendaOptions = futuraLendaOptions;
}
if (typeof globalThis !== 'undefined') {
  globalThis.hasDuploFeerico = hasDuploFeerico;
  globalThis.selectedDuploFeericoPower = selectedDuploFeericoPower;
  globalThis.duploFeericoOptions = duploFeericoOptions;
  globalThis.hasFuturaLenda = hasFuturaLenda;
  globalThis.selectedFuturaLendaPower = selectedFuturaLendaPower;
  globalThis.futuraLendaOptions = futuraLendaOptions;
}

const baseSelectedCharacterFeatures=selectedCharacterFeatures;selectedCharacterFeatures=function(){
  const features=baseSelectedCharacterFeatures();
  if(state.age?.enabled)for(const power of AGE_POWERS.filter(power=>power.faixa===state.age.band))features.push({...power,source:'age'});
  const duplo=selectedDuploFeericoPower();
  if(hasDuploFeerico()&&duplo&&!features.some(f=>f.id==='duplo_feerico'||f.origemRegional==='Duplo Feérico'||(f.nome&&f.nome.startsWith('Duplo Feérico')))){
    const reg=typeof selectedRegionalOrigin==='function'?selectedRegionalOrigin():null;
    const originDesc=reg?.beneficios?.descricao||'Você possui uma ligação mística com outra classe. Escolha um poder de 1º nível de outra classe (exceto poderes concedidos ou da Tormenta). Você recebe esse poder.';
    features.push({...duplo,id:'duplo_feerico',nome:'Duplo Feérico('+duplo.nome+')',originDesc,powerDesc:duplo.descricao||'',chosenPower:duplo,origemRegional:'Duplo Feérico',source:'origin'});
  }
  const fl=selectedFuturaLendaPower();
  if(hasFuturaLenda()&&fl&&!features.some(f=>f.id==='futura_lenda'||f.origemRegional==='Futura Lenda'||(f.nome&&f.nome.startsWith('Futura Lenda')))){
    const reg=typeof selectedRegionalOrigin==='function'?selectedRegionalOrigin():null;
    const originDesc=reg?.beneficios?.descricao||'Você recebe um poder de sua classe cujo pré-requisito de nível seja no máximo 2º nível.';
    // Formato canônico: Futura Lenda(poder) (legado: fl.nome+' (Futura Lenda)')
    features.push({...fl,id:'futura_lenda',nome:'Futura Lenda('+fl.nome+')',originDesc,powerDesc:fl.descricao||'',chosenPower:fl,origemRegional:'Futura Lenda',source:'origin'});
  }
  if(typeof hasCriacaoDosDeuses === 'function' && hasCriacaoDosDeuses()){
    const opt = typeof getCriacaoDosDeusesPowerOption === 'function' ? getCriacaoDosDeusesPowerOption() : null;
    if(opt && !features.some(f => f.id === 'criacao_dos_deuses' || f.id === opt.powerId || (f.nome && f.nome.startsWith('Criação dos Deuses')))){
      const rdLabel = opt.rdType === 'trevas' ? 'Redução de Dano 5/Trevas' : 'Redução de Dano 5/Luz';
      const originDesc = 'Você foi criado por um dos deuses maiores de Arton, mas deixou seu plano natal muito cedo. Você se torna um espírito, mas retém as características de seu tipo original e recebe redução de dano 5 conforme a energia canalizada pelo deus (' + rdLabel + '). Por fim, você recebe o poder Escolhido dos Deuses para a divindade escolhida.';
      features.push({
        id: 'criacao_dos_deuses',
        nome: 'Criação dos Deuses(' + opt.powerNome + ')',
        originDesc,
        powerDesc: opt.descricao,
        aparencia: opt.aparencia,
        rdType: opt.rdType,
        chosenPower: {
          id: opt.powerId,
          nome: opt.powerNome,
          descricao: opt.descricao
        },
        source: 'origin',
        countAsTormentaPower: opt.id === 'aharadak'
      });
    }
  }
  return features;
};

function renderCriacaoDosDeusesBrowser(){
  state.powers ??= {};
  const catalog = (typeof ForjaUnificada !== 'undefined' && Array.isArray(ForjaUnificada.CRIACAO_DEUSES_CATALOG))
    ? ForjaUnificada.CRIACAO_DEUSES_CATALOG
    : [];
  const chosenId = typeof selectedCriacaoDosDeusesDeity === 'function' ? selectedCriacaoDosDeusesDeity() : 'aharadak';
  const previewId = state.powers.criacaoDeusPreview || chosenId || 'aharadak';
  const searchQuery = slug(state.powers.criacaoDeusSearch || '');

  const filteredDeities = catalog.filter(opt => {
    if(searchQuery && !slug(opt.nome + ' ' + opt.powerNome + ' ' + opt.descricao + ' ' + opt.aparencia).includes(searchQuery)) return false;
    return true;
  });

  const previewOpt = catalog.find(opt => opt.id === previewId) || catalog[0];
  const chosenOpt = catalog.find(opt => opt.id === chosenId) || previewOpt;

  const currentEnergyChoice = state.origin?.godCreationEnergyChoice || state.powers?.godCreationEnergyChoice || (previewOpt?.rdDefault === 'luz' ? 'luz' : 'trevas');

  const searchInput = '<div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;align-items:center;">' +
    '<input type="text" class="input search" id="criacaoDeusSearch" placeholder="Pesquisar divindade criadora ou poder…" value="' + esc(state.powers.criacaoDeusSearch || '') + '" style="flex:1;min-width:180px;">' +
  '</div>';

  const rows = filteredDeities.length ? filteredDeities.map(opt => {
    const isSelected = opt.id === chosenId;
    const isPreview = opt.id === previewOpt?.id;
    let rdTag = '';
    if(opt.rdDefault === 'trevas') rdTag = '<span class="tag green" style="font-size:0.65rem;margin-left:auto">RD 5 Trevas</span>';
    else if(opt.rdDefault === 'luz') rdTag = '<span class="tag gold" style="font-size:0.65rem;margin-left:auto">RD 5 Luz</span>';
    else rdTag = '<span class="tag blue" style="font-size:0.65rem;margin-left:auto">RD 5 Trevas/Luz</span>';

    return '<button type="button" class="power-row ' + (isPreview ? 'selected ' : '') + (isSelected ? 'chosen' : '') + '" data-action="criacao-deus-preview" data-deity-id="' + esc(opt.id) + '" data-search="' + esc(slug(opt.nome + ' ' + opt.powerNome + ' ' + opt.descricao + ' ' + opt.aparencia)) + '" style="display:flex;align-items:center;gap:8px;text-align:left;">' +
      '<strong style="display:inline;margin:0;font-size:0.8rem;">' + esc(opt.nome) + '</strong>' +
      rdTag +
    '</button>';
  }).join('') : '<div class="empty">Nenhuma divindade encontrada com os filtros atuais.</div>';

  let detail = '<aside class="power-detail-panel"><div class="empty">Selecione uma divindade para ver os detalhes de criação divina.</div></aside>';
  if(previewOpt){
    const isChosenThis = previewOpt.id === chosenId;
    const energiaLabel = previewOpt.energia === 'positiva' ? 'Energia Positiva' : (previewOpt.energia === 'negativa' ? 'Energia Negativa' : 'Energia Positiva ou Negativa');

    let rdControlHtml = '';
    if(previewOpt.rdDefault === 'escolha'){
      rdControlHtml = '<div style="margin-top:10px;padding:8px 10px;background:#0d121a;border:1px solid var(--border);border-radius:6px;">' +
        '<strong style="font-size:0.75rem;color:var(--gold2);display:block;margin-bottom:6px">Escolha sua Redução de Dano (RD 5):</strong>' +
        '<div style="display:flex;gap:14px;align-items:center;">' +
          '<label style="display:flex;align-items:center;gap:5px;font-size:0.78rem;cursor:pointer;">' +
            '<input type="radio" name="criacaoEnergyChoice" data-action="criacao-deus-energy" value="trevas" ' + (currentEnergyChoice === 'trevas' ? 'checked' : '') + '> Redução de Trevas 5' +
          '</label>' +
          '<label style="display:flex;align-items:center;gap:5px;font-size:0.78rem;cursor:pointer;">' +
            '<input type="radio" name="criacaoEnergyChoice" data-action="criacao-deus-energy" value="luz" ' + (currentEnergyChoice === 'luz' ? 'checked' : '') + '> Redução de Luz 5' +
          '</label>' +
        '</div>' +
      '</div>';
    } else {
      const rdFixed = previewOpt.rdDefault === 'trevas' ? 'Redução de Dano 5 (Trevas)' : 'Redução de Dano 5 (Luz)';
      rdControlHtml = '<div style="margin-top:8px;font-size:0.78rem;color:#94a3b8"><strong>Redução de Dano concedida:</strong> <span class="tag ' + (previewOpt.rdDefault === 'trevas' ? 'green' : 'gold') + '">' + esc(rdFixed) + '</span></div>';
    }

    const actionButton = isChosenThis
      ? '<button type="button" class="button" disabled style="width:100%;background:#1e293b;border-color:#334155;color:#94a3b8;cursor:default;">Divindade Criadora Selecionada</button>'
      : '<button type="button" class="button primary" data-action="criacao-deus-select" data-deity-id="' + esc(previewOpt.id) + '" style="width:100%;">Escolher ' + esc(previewOpt.nome) + ' como Criador</button>';

    detail = '<aside class="power-detail-panel">' +
      '<div class="tag-row">' +
        '<span class="tag gold">' + esc(previewOpt.nome) + '</span>' +
        '<span class="tag">' + esc(energiaLabel) + '</span>' +
        '<span class="tag blue">Tipo Espírito</span>' +
      '</div>' +
      '<h4>' + esc(previewOpt.powerNome) + '</h4>' +
      rdControlHtml +
      '<div style="margin-top:10px;font-size:0.8rem;line-height:1.4;"><strong style="color:var(--gold2)">Aparência física:</strong> ' + esc(previewOpt.aparencia) + '</div>' +
      '<div style="margin-top:10px;font-size:0.8rem;line-height:1.4;"><strong style="color:var(--gold2)">Benefício concedido:</strong> ' + esc(previewOpt.descricao) + '</div>' +
      '<div class="info-box" style="margin-top:12px;font-size:0.75rem;">' +
        'Você foi criado por <strong>' + esc(previewOpt.nome) + '</strong>, mas <strong>não é obrigado a ser seu devoto</strong>. Você pode ser devoto de qualquer divindade permitida ou não devoto.' +
      '</div>' +
      '<div class="power-detail-actions" style="margin-top:12px;">' +
        actionButton +
      '</div>' +
    '</aside>';
  }

  return searchInput + '<div class="power-browser"><div><div class="power-list">' + rows + '</div></div>' + detail + '</div>';
}

if(typeof window !== 'undefined'){
  (window as any).renderCriacaoDosDeusesBrowser = renderCriacaoDosDeusesBrowser;
}
if(typeof globalThis !== 'undefined'){
  (globalThis as any).renderCriacaoDosDeusesBrowser = renderCriacaoDosDeusesBrowser;
}
const baseRenderPowers=renderPowers;renderPowers=function(){
  let html=baseRenderPowers();
  if(hasDuploFeerico()){
    state.powers??={};
    const allOptions=duploFeericoOptions();
    const currentClassFilter=state.powers.duploFeericoFilterClass||'';
    const searchQuery=slug(state.powers.duploFeericoSearch||'');
    const filteredOptions=allOptions.filter(opt=>{
      if(currentClassFilter&&opt.classId!==currentClassFilter)return false;
      if(searchQuery&&!slug(opt.nome+' '+opt.className).includes(searchQuery))return false;
      return true;
    });
    const chosen=selectedDuploFeericoPower();
    const preview=allOptions.find(option=>option.key===(state.powers.duploFeericoPreview||state.powers.duploFeericoClassPower));

    const otherClasses=[...new Map(allOptions.map(o=>[o.classId,o.className])).entries()];
    const classFilterSelect='<div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;align-items:center;">' +
      '<select class="select" data-action="duplo-feerico-filter-class" style="max-width:200px;">' +
        '<option value="">Todas as classes</option>' +
        otherClasses.map(([id,name])=>'<option value="'+esc(id)+'" '+(currentClassFilter===id?'selected':'')+'>'+esc(name)+'</option>').join('') +
      '</select>' +
      '<input type="text" class="input search" id="duploFeericoSearch" placeholder="Pesquisar habilidade…" value="'+esc(state.powers.duploFeericoSearch||'')+'" style="flex:1;min-width:180px;">' +
    '</div>';

    const rows=filteredOptions.length?filteredOptions.map(option=>'<button type="button" class="power-row duplo-feerico-row '+(preview?.key===option.key?'selected ':'')+(chosen?.key===option.key?'chosen':'')+'" data-action="duplo-feerico-preview" data-power-key="'+esc(option.key)+'" data-search="'+esc(slug(option.nome+' '+option.className))+'" style="display:flex;align-items:center;gap:8px;text-align:left;"><strong style="display:inline;margin:0;font-size:0.8rem;">'+esc(option.nome)+'</strong><span class="tag" style="margin:0;font-size:0.65rem;">'+esc(option.className)+'</span></button>').join(''):'<div class="empty">Nenhuma habilidade encontrada com os filtros atuais.</div>';

    const detail=preview?'<aside class="power-detail-panel"><div class="tag-row"><span class="tag gold">'+esc(preview.className)+'</span>'+(preview.isDuploSpell?'<span class="tag blue">+1 PM · 1 Magia</span>':'')+'</div><h4>'+esc(preview.nome)+'</h4><p>'+esc(preview.descricao||'Descrição não cadastrada.')+'</p><div class="power-detail-actions">'+(chosen?.key===preview.key?'<button type="button" class="button danger" data-action="duplo-feerico-remove">Remover escolha</button>':'<button type="button" class="button primary" data-action="duplo-feerico-select" data-power-key="'+esc(preview.key)+'">Escolher este poder</button>')+'</div></aside>':'<aside class="power-detail-panel"><div class="empty">Selecione uma habilidade de classe de 1º nível na lista para ver os detalhes.</div></aside>';

    html += panel('Duplo Feérico · Habilidade de Classe de 1º Nível',classFilterSelect+'<div class="power-browser"><div><div class="power-list">'+rows+'</div></div>'+detail+'</div>',chosen?'Selecionado: '+chosen.nome:'Escolha pendente');
  }

  if(hasFuturaLenda()){
    state.powers??={};
    const allFlOptions=futuraLendaOptions();
    const flSearchQuery=slug(state.powers.futuraLendaSearch||'');
    const filteredFl=allFlOptions.filter(opt=>{
      if(flSearchQuery&&!slug(opt.nome+' '+(opt.descricao||'')).includes(flSearchQuery))return false;
      return true;
    });
    const chosenFl=selectedFuturaLendaPower();
    const previewFl=allFlOptions.find(opt=>opt.id===(state.powers.futuraLendaPreview||state.powers.futuraLendaClassPower));

    const flSearchInput='<div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;align-items:center;">' +
      '<input type="text" class="input search" id="futuraLendaSearch" placeholder="Pesquisar poder de classe…" value="'+esc(state.powers.futuraLendaSearch||'')+'" style="flex:1;min-width:180px;">' +
    '</div>';

    const flRows=filteredFl.length?filteredFl.map(option=>'<button type="button" class="power-row '+(previewFl?.id===option.id?'selected ':'')+(chosenFl?.id===option.id?'chosen':'')+'" data-action="futura-lenda-preview" data-power-id="'+esc(option.id)+'" data-search="'+esc(slug(option.nome+' '+(option.descricao||'')))+'"><strong>'+esc(option.nome)+'</strong>'+(option.preRequisitosTexto?'<span class="tag" style="margin-left:auto">'+esc(option.preRequisitosTexto)+'</span>':'')+'</button>').join(''):'<div class="empty">Nenhum poder encontrado com os filtros atuais.</div>';

    const flDetail=previewFl?'<aside class="power-detail-panel"><div class="tag-row"><span class="tag gold">'+esc(previewFl.nome)+'</span>'+(previewFl.preRequisitosTexto?'<span class="tag">'+esc(previewFl.preRequisitosTexto)+'</span>':'')+'</div><h4>'+esc(previewFl.nome)+'</h4><p>'+esc(previewFl.descricao||'Descrição não cadastrada.')+'</p><div class="power-detail-actions">'+(chosenFl?.id===previewFl.id?'<button type="button" class="button danger" data-action="futura-lenda-remove">Remover escolha</button>':'<button type="button" class="button primary" data-action="futura-lenda-select" data-power-id="'+esc(previewFl.id)+'">Escolher este poder</button>')+'</div></aside>':'<aside class="power-detail-panel"><div class="empty">Selecione um poder de classe de 2º nível na lista para ver os detalhes.</div></aside>';

    html += panel('Futura Lenda · Poder de Classe (2º Nível)',flSearchInput+'<div class="power-browser"><div><div class="power-list">'+flRows+'</div></div>'+flDetail+'</div>',chosenFl?'Selecionado: '+chosenFl.nome:'Escolha pendente');
  }

  if(typeof hasCriacaoDosDeuses === 'function' && hasCriacaoDosDeuses()){
    const opt = typeof getCriacaoDosDeusesPowerOption === 'function' ? getCriacaoDosDeusesPowerOption() : null;
    html += panel('Origem · Criação dos Deuses (Escolhido dos Deuses)', renderCriacaoDosDeusesBrowser(), opt ? 'Criador: ' + opt.nome : 'Escolha pendente');
  }

  return html;
};
document.addEventListener('click',event=>{
  const criacaoBtn = event.target.closest?.('[data-action^="criacao-deus-"]');
  if(criacaoBtn){
    event.preventDefault();
    if(criacaoBtn.dataset.action === 'criacao-deus-preview'){
      const deityId = criacaoBtn.dataset.deityId;
      if(deityId){
        state.powers.criacaoDeusPreview = deityId;
        renderStage();
      }
    }else if(criacaoBtn.dataset.action === 'criacao-deus-select'){
      const deityId = criacaoBtn.dataset.deityId;
      if(deityId){
        if(typeof setSelectedCriacaoDosDeusesDeity === 'function'){
          setSelectedCriacaoDosDeusesDeity(deityId);
        }
        state.powers.criacaoDeusPreview = deityId;
        const opt = typeof getCriacaoDosDeusesPowerOption === 'function' ? getCriacaoDosDeusesPowerOption() : null;
        toast('Divindade criadora ' + (opt?.nome || deityId) + ' selecionada.');
        persist();
        renderStage();
        if(typeof syncSequentialPowerFooter === 'function') syncSequentialPowerFooter();
      }
    }
    return;
  }
  const button=event.target.closest?.('[data-action^="duplo-feerico-"]');
  if(button){
    event.preventDefault();
    if(button.dataset.action==='duplo-feerico-preview'){
      const option=duploFeericoOptions().find(item=>item.key===button.dataset.powerKey);
      if(option)state.powers.duploFeericoPreview=option.key;
    }else if(button.dataset.action==='duplo-feerico-select'){
      const option=duploFeericoOptions().find(item=>item.key===button.dataset.powerKey);
      if(option){
        state.powers.duploFeericoClassPower=option.key;
        state.powers.duploFeericoPreview=option.key;
        toast(option.nome+' selecionado para Duplo Feérico.');
      }
    }else if(button.dataset.action==='duplo-feerico-remove'){
      delete state.powers.duploFeericoClassPower;
      toast('Habilidade de Duplo Feérico desmarcada.');
    }
    persist();
    renderStage();
    return;
  }
  const flButton=event.target.closest?.('[data-action^="futura-lenda-"]');
  if(flButton){
    event.preventDefault();
    if(flButton.dataset.action==='futura-lenda-preview'){
      const option=futuraLendaOptions().find(item=>item.id===flButton.dataset.powerId);
      if(option)state.powers.futuraLendaPreview=option.id;
    }else if(flButton.dataset.action==='futura-lenda-select'){
      const option=futuraLendaOptions().find(item=>item.id===flButton.dataset.powerId);
      if(option){
        state.powers.futuraLendaClassPower=option.id;
        state.powers.futuraLendaPreview=option.id;
        toast(option.nome+' selecionado para Futura Lenda.');
      }
    }else if(flButton.dataset.action==='futura-lenda-remove'){
      delete state.powers.futuraLendaClassPower;
      toast('Poder de Futura Lenda desmarcado.');
    }
    persist();
    renderStage();
    return;
  }
},true);
document.addEventListener('change',event=>{
  if(event.target?.dataset?.action==='criacao-deus-energy'){
    const val = event.target.value;
    const curDeity = typeof selectedCriacaoDosDeusesDeity === 'function' ? selectedCriacaoDosDeusesDeity() : 'aharadak';
    if(typeof setSelectedCriacaoDosDeusesDeity === 'function'){
      setSelectedCriacaoDosDeusesDeity(curDeity, val);
    }
    persist();
    renderStage();
    return;
  }
  if(event.target?.dataset?.action==='duplo-feerico-filter-class'){
    state.powers.duploFeericoFilterClass=event.target.value;
    persist();
    renderStage();
  }
},true);
document.addEventListener('input',event=>{
  if(event.target?.id==='criacaoDeusSearch'){
    state.powers.criacaoDeusSearch=event.target.value;
    const query=slug(event.target.value);
    document.querySelectorAll('.power-browser [data-action="criacao-deus-preview"]').forEach(row=>{
      row.classList.toggle('hidden',Boolean(query&&!row.dataset.search.includes(query)));
    });
  }
  if(event.target?.id==='duploFeericoSearch'){
    state.powers.duploFeericoSearch=event.target.value;
    const query=slug(event.target.value);
    document.querySelectorAll('.power-browser [data-action="duplo-feerico-preview"]').forEach(row=>{
      row.classList.toggle('hidden',Boolean(query&&!row.dataset.search.includes(query)));
    });
  }
  if(event.target?.id==='futuraLendaSearch'){
    state.powers.futuraLendaSearch=event.target.value;
    const query=slug(event.target.value);
    document.querySelectorAll('.power-browser [data-action="futura-lenda-preview"]').forEach(row=>{
      row.classList.toggle('hidden',Boolean(query&&!row.dataset.search.includes(query)));
    });
  }
},true);
const basePhaseIsComplete=phaseIsComplete;phaseIsComplete=function(step){
  if(step===3&&hasDuploFeerico()&&!selectedDuploFeericoPower())return false;
  if(step===6&&hasDuploFeerico()&&!selectedDuploFeericoPower())return false;
  if(step===6&&hasFuturaLenda()&&!selectedFuturaLendaPower())return false;
  if(step===6&&typeof hasCriacaoDosDeuses==='function'&&hasCriacaoDosDeuses()&&!selectedCriacaoDosDeusesDeity())return false;
  return basePhaseIsComplete(step);
};
// O botão avulso 'Exportar Caminho da Classe' foi removido conforme solicitação, pois o caminho é exportado junto com o PDF.
ensure();renderStage();
})();
