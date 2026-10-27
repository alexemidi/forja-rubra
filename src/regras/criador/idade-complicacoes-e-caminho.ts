(function(){
const ATTR_NAMES={for:'Força',des:'Destreza',con:'Constituição',int:'Inteligência',sab:'Sabedoria',car:'Carisma'};
const BANDS=(typeof window !== 'undefined' && window.__FORJA_DATA__?.BANDS) || (typeof DATA !== 'undefined' && DATA.BANDS) || {};
const COMPLICATIONS=(typeof window !== 'undefined' && window.__FORJA_DATA__?.COMPLICATIONS) || (typeof DATA !== 'undefined' && DATA.COMPLICATIONS) || [];
const GENERAL_COMPLICATIONS=(typeof window !== 'undefined' && window.__FORJA_DATA__?.GENERAL_COMPLICATIONS) || (typeof DATA !== 'undefined' && DATA.GENERAL_COMPLICATIONS) || [];
const AGE_POWERS=(typeof window !== 'undefined' && window.__FORJA_DATA__?.AGE_POWERS) || (typeof DATA !== 'undefined' && DATA.AGE_POWERS) || [];
function ensure(){
  state.age=Object.assign({enabled:false,band:'',years:'',mode:'benefits',complications:[],notice:'',editingComplications:false},state.age||{});
  if(!Array.isArray(state.age.complications))state.age.complications=[];
  if(!Array.isArray(state.generalComplications))state.generalComplications=[];
}
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
function ageComplicationsLimit(){
  const r = rule();
  return state.age?.enabled ? Number(r?.count || 0) : 0;
}
function generalComplicationsLimit(){
  return isIndividualComplicationsActive() ? 1 : 0;
}

const baseGeneralPowerSlots=generalPowerSlots;
generalPowerSlots=function(){
  const r=rule();
  const agePowers = Number(state.age?.enabled ? (r?.generalPowers || 0) : 0);
  const indPowers = (isIndividualComplicationsActive() && (state.generalComplications || []).length > 0) ? 1 : 0;
  return baseGeneralPowerSlots() + agePowers + indPowers;
};

function panelHtml(){
  ensure();
  const rs=ranges(),r=rule();
  const indActive = isIndividualComplicationsActive();
  const ageLimit = ageComplicationsLimit();

  // 1. Conteúdo de Idade (Heróis de Arton)
  let ageFieldsHtml = '';
  if (state.age.enabled) {
    const bandsOptions = Object.entries(BANDS).map(([id, b]) => {
      const x = rs[id];
      const rangeText = x ? x.min + (x.max === null ? '+' : '–' + x.max) : '';
      return '<option value="' + id + '" ' + (state.age.band === id ? 'selected' : '') + '>' + b.name + (rangeText ? ' · ' + rangeText : '') + '</option>';
    }).join('');

    const yearsInputHtml = r
      ? '<label style="display:flex;flex-direction:column;gap:4px;"><span style="font-size:0.68rem;color:var(--muted);letter-spacing:0.5px;font-weight:700;text-transform:uppercase;">IDADE</span><input class="input" type="number" min="' + r.min + '" ' + (r.max === null ? '' : 'max="' + r.max + '"') + ' value="' + esc(state.age.years) + '" data-age-field="years" style="min-height:38px;padding:6px 10px;font-size:0.85rem;background:#090708;border:1px solid #4a252a;color:var(--cream);"></label>'
      : '<label style="display:flex;flex-direction:column;gap:4px;"><span style="font-size:0.68rem;color:var(--muted);letter-spacing:0.5px;font-weight:700;text-transform:uppercase;">IDADE</span><input class="input" type="number" disabled value="" style="min-height:38px;padding:6px 10px;font-size:0.85rem;background:#090708;border:1px solid #4a252a;color:var(--muted);"></label>';

    let agePowersHtml = '';
    if (state.age.band && state.age.band !== 'jovem') {
      const powers = (AGE_POWERS || []).filter(p => p.faixa === state.age.band);
      if (powers.length) {
        agePowersHtml = '<div style="margin-top:14px;margin-bottom:10px;">'
          + powers.map(p => '<strong style="color:var(--gold2,#f5c879);font-family:var(--font-display,serif);font-size:0.88rem;text-transform:uppercase;display:block;margin-bottom:4px;">' + esc(p.nome) + '</strong><p style="margin:0;font-size:0.8rem;color:var(--cream,#f5eee6);line-height:1.45;">' + esc(p.descricao) + '</p>').join('')
          + '</div>';
      }
    }

    let ageComplicationsHtml = '';
    if (state.age.band && state.age.band !== 'jovem' && ageLimit > 0) {
      const chosenNames = state.age.complications.map(id => {
        const c = COMPLICATIONS.find(item => item[0] === id);
        return c ? c[1] : id;
      });
      const chosenText = chosenNames.length > 0 ? chosenNames.join(', ') : 'SELECIONAR COMPLICAÇÃO';

      ageComplicationsHtml = '<div class="rule-complication-box" style="border:1px solid #4a252a;background:rgba(24,17,20,0.6);border-radius:6px;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:10px;">'
        + '<span class="rule-complication-label" style="font-family:var(--font-display,serif);font-size:0.8rem;color:var(--gold2,#f5c879);text-transform:uppercase;font-weight:700;letter-spacing:0.5px;">COMPLICAÇÃO DE IDADE</span>'
        + '<button type="button" class="rule-complication-badge-btn" data-action="open-age-complications-modal" style="background:rgba(197,31,44,0.1);border:1px solid #c51f2c;color:#ea3948;border-radius:4px;padding:6px 14px;font-family:var(--font-display,serif);font-size:0.78rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;cursor:pointer;">'
        + esc(chosenText)
        + '</button>'
        + '</div>';
    }

    ageFieldsHtml = '<div style="margin-top:12px;">'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">'
      + '<label style="display:flex;flex-direction:column;gap:4px;"><span style="font-size:0.68rem;color:var(--muted);letter-spacing:0.5px;font-weight:700;text-transform:uppercase;">FAIXA ETÁRIA</span><select class="select" data-age-field="band" style="min-height:38px;padding:6px 10px;font-size:0.85rem;background:#090708;border:1px solid #4a252a;color:var(--cream);"><option value="">Escolha</option>' + bandsOptions + '</select></label>'
      + yearsInputHtml
      + '</div>'
      + agePowersHtml
      + ageComplicationsHtml
      + '</div>';
  }

  // 2. Conteúdo de Complicações Gerais
  let generalComplicationsHtml = '';
  if (indActive) {
    const chosenGeneralNames = (state.generalComplications || []).map(id => {
      const c = GENERAL_COMPLICATIONS.find(item => item[0] === id);
      return c ? c[1] : id;
    });
    const chosenGenText = chosenGeneralNames.length > 0 ? chosenGeneralNames.join(', ') : 'SELECIONAR COMPLICAÇÃO';

    generalComplicationsHtml = '<div class="rule-complication-box" style="border:1px solid #4a252a;background:rgba(24,17,20,0.6);border-radius:6px;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:10px;">'
      + '<span class="rule-complication-label" style="font-family:var(--font-display,serif);font-size:0.8rem;color:var(--gold2,#f5c879);text-transform:uppercase;font-weight:700;letter-spacing:0.5px;">COMPLICAÇÃO</span>'
      + '<button type="button" class="rule-complication-badge-btn" data-action="open-general-complications-modal" style="background:rgba(197,31,44,0.1);border:1px solid #c51f2c;color:#ea3948;border-radius:4px;padding:6px 14px;font-family:var(--font-display,serif);font-size:0.78rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;cursor:pointer;">'
      + esc(chosenGenText)
      + '</button>'
      + '</div>';
  }

  const noticeHtml = state.age.notice
    ? '<div class="age-notes-summary" style="color:var(--gold);margin-top:10px;">'+esc(state.age.notice)+'</div>'
    : '';

  return '<div class="panel age-extension" style="border:1px solid #4a252a;background:#110d0f;border-radius:8px;padding:14px;">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">'
    + '<span style="font-family:var(--font-display,serif);color:var(--gold2,#f5c879);font-weight:700;font-size:0.95rem;letter-spacing:0.5px;">IDADE & COMPLICAÇÕES</span>'
    + '<span style="font-size:0.65rem;color:var(--muted);letter-spacing:1px;text-transform:uppercase;">REGRAS OPCIONAIS</span>'
    + '</div>'
    + '<div class="age-rule-section">'
    + '<label class="age-check" style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:0.88rem;color:var(--cream);">'
    + '<input type="checkbox" data-age-field="enabled" ' + (state.age.enabled ? 'checked' : '') + ' style="accent-color:var(--red,#c51f2c);width:16px;height:16px;">'
    + '<strong>Usar regras de idade</strong> <span style="font-size:0.8rem;color:var(--muted);font-weight:400;">(Heróis de Arton)</span>'
    + '</label>'
    + ageFieldsHtml
    + '</div>'
    + '<div style="height:1px;background:#4a252a;margin:14px 0;opacity:0.6;"></div>'
    + '<div class="age-rule-section">'
    + '<label class="age-check" style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:0.88rem;color:var(--cream);">'
    + '<input type="checkbox" data-action="toggle-individual-complications" ' + (indActive ? 'checked' : '') + ' style="accent-color:var(--red,#c51f2c);width:16px;height:16px;">'
    + '<strong>Usar regra de complicações</strong>'
    + '</label>'
    + generalComplicationsHtml
    + '</div>'
    + noticeHtml
    + '</div>';
}
window.renderAgePanelHtml=panelHtml;

let modalSelectedAgeComplications = [];

function openAgeComplicationsModal(){
  ensure();
  const limit = ageComplicationsLimit();
  if(limit <= 0){
    toast('Nenhuma complicação de idade para a faixa selecionada.');
    return;
  }
  modalSelectedAgeComplications = [...(state.age?.complications || [])];
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
  const limit = ageComplicationsLimit();
  const selectedCount = modalSelectedAgeComplications.length;

  const subtitle = 'A faixa etária ' + (r?.name || '') + ' exige ' + limit + ' complicação' + (limit > 1 ? 'ões' : '') + ' de idade.';

  const cardsHtml = COMPLICATIONS.map(c => {
    const id = c[0], name = c[1], desc = c[2];
    const isSelected = modalSelectedAgeComplications.includes(id);
    const disabled = !isSelected && selectedCount >= limit;
    return '<label class="age-comp-modal-card ' + (isSelected ? 'selected ' : '') + (disabled ? 'disabled ' : '') + '">'
      + '<input type="checkbox" data-modal-age-comp-id="' + esc(id) + '" ' + (isSelected ? 'checked' : '') + ' ' + (disabled ? 'disabled' : '') + ' style="margin-top:3px;accent-color:var(--gold);">'
      + '<span style="flex:1;">'
      + '<strong>' + esc(name) + '</strong>'
      + '<small>' + esc(desc) + '</small>'
      + '</span>'
      + '</label>';
  }).join('');

  modal.innerHTML = '<section class="confirm-modal age-complications-dialog" role="dialog" aria-modal="true">'
    + '<header>'
    + '<div>'
    + '<h3>Escolha de Complicações de Idade</h3>'
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
    + '<span id="ageCompModalCounter" style="font-size:0.85rem;font-weight:700;color:var(--gold2);font-family:var(--font-display,\'Tormenta\',Cinzel,serif);">Selecionadas: ' + selectedCount + '/' + limit + '</span>'
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
  const limit = ageComplicationsLimit();
  const selectedCount = modalSelectedAgeComplications.length;

  const counterEl = modal.querySelector('#ageCompModalCounter');
  if(counterEl){
    counterEl.textContent = 'Selecionadas: ' + selectedCount + '/' + limit;
  }

  const allCards = modal.querySelectorAll('.age-comp-modal-card');
  allCards.forEach(c => {
    const inp = c.querySelector('input[data-modal-age-comp-id]');
    if(!inp) return;
    const cid = inp.dataset.modalAgeCompId;
    const isSel = modalSelectedAgeComplications.includes(cid);
    inp.checked = isSel;
    c.classList.toggle('selected', isSel);
    const shouldDisable = !isSel && selectedCount >= limit;
    c.classList.toggle('disabled', shouldDisable);
    inp.disabled = shouldDisable;
    c.style.cursor = shouldDisable ? 'not-allowed' : 'pointer';
  });
}

let modalSelectedGeneralComplications = [];

function openGeneralComplicationsModal(){
  ensure();
  if(!isIndividualComplicationsActive()){
    toast('Ative a regra de complicações para escolher uma complicação.');
    return;
  }
  modalSelectedGeneralComplications = [...(state.generalComplications || [])];
  let modal = document.getElementById('generalComplicationsModal');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'generalComplicationsModal';
    modal.className = 'modal-backdrop';
    document.body.appendChild(modal);
  }
  updateGeneralComplicationsModalContent();
  modal.removeAttribute('hidden');
  modal.style.display = 'grid';
}
if(typeof window !== 'undefined'){
  window.openGeneralComplicationsModal = openGeneralComplicationsModal;
}

function closeGeneralComplicationsModal(){
  const modal = document.getElementById('generalComplicationsModal');
  if(modal){
    modal.setAttribute('hidden', '');
    modal.style.display = 'none';
  }
}
if(typeof window !== 'undefined'){
  window.closeGeneralComplicationsModal = closeGeneralComplicationsModal;
}

function updateGeneralComplicationsModalContent(){
  const modal = document.getElementById('generalComplicationsModal');
  if(!modal) return;
  const limit = 1;
  const selectedCount = modalSelectedGeneralComplications.length;
  const subtitle = 'Escolha 1 complicação geral para receber +1 poder geral extra.';

  const cardsHtml = GENERAL_COMPLICATIONS.map(c => {
    const id = c[0], name = c[1], desc = c[2];
    const isSelected = modalSelectedGeneralComplications.includes(id);
    const disabled = !isSelected && selectedCount >= limit;
    return '<label class="age-comp-modal-card ' + (isSelected ? 'selected ' : '') + (disabled ? 'disabled ' : '') + '">'
      + '<input type="checkbox" data-modal-general-comp-id="' + esc(id) + '" ' + (isSelected ? 'checked' : '') + ' ' + (disabled ? 'disabled' : '') + ' style="margin-top:3px;accent-color:var(--gold);">'
      + '<span style="flex:1;">'
      + '<strong>' + esc(name) + '</strong>'
      + '<small>' + esc(desc) + '</small>'
      + '</span>'
      + '</label>';
  }).join('');

  modal.innerHTML = '<section class="confirm-modal age-complications-dialog" role="dialog" aria-modal="true">'
    + '<header>'
    + '<div>'
    + '<h3>Escolha de Complicação Geral</h3>'
    + '<small style="color:var(--muted);font-size:0.78rem;display:block;margin-top:3px;">' + esc(subtitle) + '</small>'
    + '</div>'
    + '<button type="button" class="button" data-action="close-general-complications-modal" style="min-width:32px;padding:4px 8px;font-size:0.95rem;background:transparent;border:1px solid var(--line);color:var(--muted);cursor:pointer;" title="Fechar">✕</button>'
    + '</header>'
    + '<div class="confirm-modal-body">'
    + '<div class="age-complications-modal-grid">'
    + cardsHtml
    + '</div>'
    + '</div>'
    + '<footer>'
    + '<span id="generalCompModalCounter" style="font-size:0.85rem;font-weight:700;color:var(--gold2);font-family:var(--font-display,\'Tormenta\',Cinzel,serif);">Selecionadas: ' + selectedCount + '/' + limit + '</span>'
    + '<div style="display:flex;gap:10px;">'
    + '<button type="button" class="button" data-action="close-general-complications-modal">Cancelar</button>'
    + '<button type="button" class="button primary" data-action="confirm-general-complications-modal">Confirmar Escolha</button>'
    + '</div>'
    + '</footer>'
    + '</section>';
}

function syncGeneralComplicationsModalDom(){
  const modal = document.getElementById('generalComplicationsModal');
  if(!modal) return;
  const limit = 1;
  const selectedCount = modalSelectedGeneralComplications.length;

  const counterEl = modal.querySelector('#generalCompModalCounter');
  if(counterEl){
    counterEl.textContent = 'Selecionadas: ' + selectedCount + '/' + limit;
  }

  const allCards = modal.querySelectorAll('.age-comp-modal-card');
  allCards.forEach(c => {
    const inp = c.querySelector('input[data-modal-general-comp-id]');
    if(!inp) return;
    const cid = inp.dataset.modalGeneralCompId;
    const isSel = modalSelectedGeneralComplications.includes(cid);
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
 age:state.age,ageRule:state.age?.enabled?rule():null,complications:COMPLICATIONS,
 generalComplications:state.generalComplications||[],
 generalComplicationsCatalog:GENERAL_COMPLICATIONS
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
        state.age.complications=[];
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
      if(Number(rNow?.count || 0) > 0){
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
    if(!checked){
      state.generalComplications=[];
    }
    persist();
    renderStage();
    if(checked && (!state.generalComplications || state.generalComplications.length === 0)){
      setTimeout(() => openGeneralComplicationsModal(), 50);
    }
    return;
  }
  const modalAgeCompInput = event.target.closest?.('input[data-modal-age-comp-id]');
  if(modalAgeCompInput){
    const id = modalAgeCompInput.dataset.modalAgeCompId;
    const limit = ageComplicationsLimit();
    const idx = modalSelectedAgeComplications.indexOf(id);
    if(modalAgeCompInput.checked && idx < 0){
      if(modalSelectedAgeComplications.length < limit){
        modalSelectedAgeComplications.push(id);
      } else {
        modalAgeCompInput.checked = false;
        toast('Você já selecionou o limite de ' + limit + ' complicação' + (limit > 1 ? 'ões' : '') + ' de idade.');
      }
    } else if(!modalAgeCompInput.checked && idx >= 0){
      modalSelectedAgeComplications.splice(idx, 1);
    }
    syncAgeComplicationsModalDom();
    return;
  }
  const modalGeneralCompInput = event.target.closest?.('input[data-modal-general-comp-id]');
  if(modalGeneralCompInput){
    const id = modalGeneralCompInput.dataset.modalGeneralCompId;
    const limit = 1;
    const idx = modalSelectedGeneralComplications.indexOf(id);
    if(modalGeneralCompInput.checked && idx < 0){
      if(modalSelectedGeneralComplications.length < limit){
        modalSelectedGeneralComplications.push(id);
      } else {
        modalGeneralCompInput.checked = false;
        toast('Você já selecionou 1 complicação geral.');
      }
    } else if(!modalGeneralCompInput.checked && idx >= 0){
      modalSelectedGeneralComplications.splice(idx, 1);
    }
    syncGeneralComplicationsModalDom();
    return;
  }
});

document.addEventListener('click',event=>{
  if(event.target.closest?.('[data-action="open-age-complications-modal"]')){
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
    state.age.complications = [...modalSelectedAgeComplications];
    state.age.editingComplications = false;
    persist();
    closeAgeComplicationsModal();
    renderStage();
    toast('Complicações de idade atualizadas!');
    return;
  }

  if(event.target.closest?.('[data-action="open-general-complications-modal"]')){
    openGeneralComplicationsModal();
    return;
  }
  if(event.target.closest?.('[data-action="close-general-complications-modal"]')){
    closeGeneralComplicationsModal();
    return;
  }
  if(event.target.id === 'generalComplicationsModal'){
    closeGeneralComplicationsModal();
    return;
  }
  if(event.target.closest?.('[data-action="confirm-general-complications-modal"]')){
    state.generalComplications = [...modalSelectedGeneralComplications];
    persist();
    closeGeneralComplicationsModal();
    renderStage();
    toast('Complicação geral atualizada!');
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
  if(state.age.enabled&&state.age.band!=='jovem'&&state.age.complications.length<required){
    event.preventDefault();
    event.stopImmediatePropagation();
    toast('Escolha '+required+' complicação'+(required>1?'ões':'')+' de idade antes de continuar.');
    openAgeComplicationsModal();
    return;
  }
  if(isIndividualComplicationsActive()&&(!state.generalComplications||state.generalComplications.length<1)){
    event.preventDefault();
    event.stopImmediatePropagation();
    toast('Escolha 1 complicação geral antes de continuar.');
    openGeneralComplicationsModal();
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
  const rawFeatures=baseSelectedCharacterFeatures();
  const baseCount = typeof baseGeneralPowerSlots === 'function' ? baseGeneralPowerSlots() : 0;
  const r = typeof rule === 'function' ? rule() : null;
  const agePowers = Number(state.age?.enabled ? (r?.generalPowers || 0) : 0);
  const indPowers = (typeof isIndividualComplicationsActive === 'function' && isIndividualComplicationsActive() && (state.generalComplications || []).length > 0) ? 1 : 0;

  const agePwrId = state.powers?.general?.[baseCount];
  const compPwrId = state.powers?.general?.[baseCount + agePowers];

  // Filtra os poderes gerais que agora serão embutidos nos cartões de Idade e Complicações
  const features = rawFeatures.filter(f => {
    if (f.source === 'general-power') {
      const fSlug = typeof slug === 'function' ? slug(f.id || f.nome || '') : String(f.id || f.nome || '').toLowerCase();
      if (agePwrId && (f.id === agePwrId || fSlug === (typeof slug === 'function' ? slug(powerById(agePwrId)?.nome || agePwrId) : agePwrId))) return false;
      if (compPwrId && (f.id === compPwrId || fSlug === (typeof slug === 'function' ? slug(powerById(compPwrId)?.nome || compPwrId) : compPwrId))) return false;
    }
    return true;
  });

  if(state.age?.enabled){
    for(const power of AGE_POWERS.filter(power=>power.faixa===state.age.band)){
      if(['adulto','maduro','velho','anciao'].includes(power.faixa) && (!state.age.complications || state.age.complications.length === 0)) continue;
      if(power.id === 'idade_ja_vi_coisas'){
        const chosenPwr = agePwrId ? powerById(agePwrId) : null;
        const chosenName = chosenPwr ? chosenPwr.nome : '';
        const title = chosenName ? ('Idade/' + power.nome + '(' + chosenName + ')') : power.nome;
        const ageCompList = (state.age.complications || []).map(cId => {
          const compData = (typeof COMPLICATIONS !== 'undefined' ? COMPLICATIONS : []).find(c => c[0] === cId)
            || (typeof GENERAL_COMPLICATIONS !== 'undefined' ? GENERAL_COMPLICATIONS : []).find(c => c[0] === cId);
          return compData ? ('• ' + compData[1] + ': ' + compData[2]) : '';
        }).filter(Boolean);
        const powerLine = chosenPwr ? ('• ' + chosenPwr.nome + ': ' + chosenPwr.descricao) : '';
        const descParts = [power.descricao, ...ageCompList, powerLine].filter(Boolean);
        const desc = descParts.join('\n\n');
        const effects = [...(power.efeitos || []), ...(chosenPwr?.efeitos || [])];
        features.push({
          ...power,
          id: 'idade_ja_vi_coisas',
          nome: title,
          descricao: desc,
          efeitos: effects,
          chosenPower: chosenPwr,
          source: 'age'
        });
      } else {
        const ageCompList = (state.age.complications || []).map(cId => {
          const compData = (typeof COMPLICATIONS !== 'undefined' ? COMPLICATIONS : []).find(c => c[0] === cId)
            || (typeof GENERAL_COMPLICATIONS !== 'undefined' ? GENERAL_COMPLICATIONS : []).find(c => c[0] === cId);
          return compData ? ('• ' + compData[1] + ': ' + compData[2]) : '';
        }).filter(Boolean);
        const desc = [power.descricao, ...ageCompList].filter(Boolean).join('\n\n');
        features.push({
          ...power,
          nome: power.nome,
          descricao: desc,
          source: 'age'
        });
      }
    }
  }

  if(isIndividualComplicationsActive() && Array.isArray(state.generalComplications)){
    state.generalComplications.forEach((compId, cIdx) => {
      const c = GENERAL_COMPLICATIONS.find(item => item[0] === compId);
      if(!c) return;
      const compSlot = baseCount + agePowers + cIdx;
      const chosenId = state.powers?.general?.[compSlot];
      const chosenPwr = chosenId ? powerById(chosenId) : null;
      const chosenName = chosenPwr ? chosenPwr.nome : '';
      const title = chosenName ? ('Complicações/' + c[1] + '(' + chosenName + ')') : ('Complicações/' + c[1]);
      const compLine = '• ' + c[1] + ': ' + c[2];
      const pwrLine = chosenPwr ? ('• ' + chosenPwr.nome + ': ' + chosenPwr.descricao) : '';
      const desc = pwrLine ? (compLine + '\n\n' + pwrLine) : compLine;
      const effects = chosenPwr?.efeitos || [];
      features.push({
        id: c[0],
        nome: title,
        descricao: desc,
        efeitos: effects,
        chosenPower: chosenPwr,
        source: 'complication'
      });
    });
  }
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
