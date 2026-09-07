// Executed only in the embedded, sandboxed copy built for the character assistant.
(() => {
  const channel = 'forja-t20-grimoire-v1';
  let context = null;
  const style = document.createElement('style');
  style.textContent = `
    .site-header{display:none!important}
    .view-tabs-wrap{display:none!important}
    .learn-btn.remove-spell{border-color:#ed9945;color:#ffcc91;background:#ed994526}
    .learn-btn.replace-spell{border-color:#5ba9d8;color:#acdfff;background:#5ba9d824}
    .learn-btn:not(.remove-spell):not(:disabled){border-color:#8edaff;color:#bceaff;background:#32668738;font-weight:700}
    #defineSchoolsBtn{display:none!important}
    .repeat-spell-note{margin:8px 12px;padding:8px;border:1px solid #73b9d766;border-radius:6px;color:#bceaff;font-size:12px;line-height:1.5}
    .learn-btn:disabled,.circ-btn:disabled,.tipo-btn:disabled,.school-mode-btn:disabled,.filter-chip[aria-disabled="true"]{opacity:.35;filter:grayscale(1);cursor:default}
    .filters-bar{padding:12px 22px}
    .filters-inner,.main{max-width:none}
    .search-row{margin-bottom:10px;gap:10px}
    .search-box{min-width:0;padding:8px 12px}
    .filter-row{column-gap:5px;row-gap:6px}
    .filter-row+.filter-row{margin-top:7px}
    .filter-label{font-size:10px;letter-spacing:.5px;margin-right:1px}
    .filter-sep{margin:0 2px}
    .tipo-btn{padding:4px 9px;font-size:11px}
    .circ-btn{width:26px;height:26px;flex-basis:26px}
    .filter-chip{min-height:26px;padding:4px 8px}
    .school-mode-btn{min-width:0;padding-inline:7px}
    #learnedFilterBtn{min-width:0;margin-left:auto;gap:5px;flex:0 0 auto}
    .main{padding:16px 22px}
    .grid{gap:14px;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))}
    .compact-school-modes{display:contents}
    .compact-filter-button{display:none}
    .school-filter-dialog{position:fixed;inset:0;z-index:15000;display:grid;place-items:center;padding:14px;background:#000a}
    .school-filter-dialog[hidden]{display:none}
    .school-filter-dialog>section{width:min(420px,100%);max-height:calc(100dvh - 28px);overflow:auto;border:1px solid #515d80;border-radius:10px;padding:16px;background:#141729;color:#dce1f5}
    .school-filter-dialog header{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}
    .school-filter-dialog h2{font:600 16px Cinzel,serif}
    .school-filter-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
    .school-filter-dialog button{padding:9px;border:1px solid #424969;border-radius:7px;background:#232640;color:#e1e5fa;cursor:pointer}
    .school-filter-dialog button:disabled{opacity:.38;cursor:not-allowed}
    .school-filter-dialog button[aria-pressed="true"]{border-color:#a392fa;background:#7c6dfa33}
    .school-filter-dialog button:focus-visible,.compact-filter-button:focus-visible{outline:2px solid #ae9cff;outline-offset:2px}
    @media(min-width:960px){.search-row+.filter-row{column-gap:4px}.school-mode-btn{font-size:10px}.search-row+.filter-row .filter-chip{padding-inline:7px}}
    @media(max-width:600px){.filters-bar{padding:10px 12px}.main{padding:12px}.grid{grid-template-columns:1fr}.filter-sep{display:none}.filter-chip,.tipo-btn{min-height:30px}.circ-btn{width:30px;height:30px;flex-basis:30px}.result-count{font-size:11px}}
    @media(max-width:600px){
      .filters-bar{padding:7px 8px}.main{padding:9px 8px}.filter-row{gap:5px}.filter-row+.filter-row{margin-top:6px}
      .filters-bar:not(.filters-expanded) .search-row{display:none}
      .filters-bar:not(.filters-expanded) .tradition-circle-row>:not(.compact-school-modes){display:none}
      #defineSchoolsBtn,#schoolPickCount{display:none!important}
      .compact-school-modes{display:flex;order:-1;width:100%;gap:5px;align-items:center}
      .compact-school-modes .filter-chip{font-size:10px;padding:5px 7px;white-space:nowrap}
      #learnedFilterBtn{margin-left:auto}
      .compact-school-row .escola-chip:not(.current-school-filter){display:none}
      .compact-school-row>.filter-label{font-size:9px}
      .compact-filter-button{display:inline-grid;place-items:center;flex:0 0 30px;width:30px;height:30px;border:1px solid #394063;border-radius:50%;background:#19203a;color:#29b7f3;font-size:27px;line-height:1;cursor:pointer}
      #compactOtherFilters{margin-left:auto;font-size:19px}
      .compact-school-row .current-school-filter{max-width:calc(100% - 143px);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10px}
    }
  `;
  document.head.appendChild(style);
  function installCompactFilters(){
    const all=document.getElementById('allSchoolsBtn'),schoolAll=document.querySelector?.('.filter-chip[data-escola="todas"]');
    if(!all?.parentElement||!schoolAll)return;
    const row=all.parentElement,modes=document.createElement('div');modes.className='compact-school-modes';row.classList.add('tradition-circle-row');
    modes.append(all,document.getElementById('knownSchoolsBtn'),document.getElementById('learnedFilterBtn'));row.appendChild(modes);
    schoolAll.parentElement.classList.add('compact-school-row');
    const plus=document.createElement('button');plus.type='button';plus.id='compactSchoolPicker';plus.className='compact-filter-button';plus.textContent='+';plus.setAttribute('aria-label','Filtrar por escola');plus.setAttribute('aria-haspopup','dialog');schoolAll.after(plus);
    const more=document.createElement('button');more.type='button';more.id='compactOtherFilters';more.className='compact-filter-button';more.textContent='⌕';more.title='Pesquisa, tradição e círculo';more.setAttribute('aria-label','Mostrar pesquisa, tradição e círculo');more.setAttribute('aria-expanded','false');schoolAll.parentElement.appendChild(more);
    const dialog=document.createElement('div');dialog.id='schoolFilterDialog';dialog.className='school-filter-dialog';dialog.hidden=true;dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','schoolFilterTitle');
    dialog.innerHTML='<section><header><h2 id="schoolFilterTitle">Filtrar por escola</h2><button type="button" data-close-school-filter aria-label="Fechar">×</button></header><div class="school-filter-options"></div></section>';document.body.appendChild(dialog);
  }
  function closeSchoolFilter(){const dialog=document.getElementById('schoolFilterDialog');if(dialog){dialog.hidden=true;document.getElementById('compactSchoolPicker')?.focus()}}
  function openSchoolFilter(){
    const dialog=document.getElementById('schoolFilterDialog');if(!dialog)return;
    const options=dialog.querySelector('.school-filter-options');options.replaceChildren();
    document.querySelectorAll('.filter-chip[data-escola]').forEach(chip=>{
      const button=document.createElement('button');button.type='button';button.dataset.filterSchool=chip.dataset.escola;button.textContent=chip.textContent;button.disabled=chip.getAttribute('aria-disabled')==='true';button.setAttribute('aria-pressed',String(chip.dataset.escola===filterEscola));options.appendChild(button);
    });
    dialog.hidden=false;dialog.querySelector('button')?.focus();
  }
  installCompactFilters();
  learnedSpells = new Set();
  selectedSchools = new Set();
  const baseApply = apply;
  function syncRestrictions() {
    const types = new Set(context?.traditions || []), circles = new Set(context?.circles || []);
    document.querySelectorAll('.tipo-btn').forEach(button => {
      button.disabled = button.dataset.tipo !== 'todos' && !types.has(button.dataset.tipo);
      button.setAttribute('aria-disabled', String(button.disabled));
    });
    document.querySelectorAll('.circ-btn').forEach(button => {
      button.disabled = button.dataset.circ !== '0' && !circles.has(Number(button.dataset.circ));
      button.setAttribute('aria-disabled', String(button.disabled));
    });
    const canDefine = Boolean(context?.schoolChoiceCount && context?.classId);
    const define = document.getElementById('defineSchoolsBtn');
    define.disabled = !canDefine || Boolean(context?.mode);
    define.textContent = definingSchools ? 'Confirmar' : selectedSchools.size < (context?.schoolCount || 0) ? 'Completar escolas' : 'Escolas escolhidas';
    document.getElementById('knownSchoolsBtn').disabled = !selectedSchools.size;
    document.getElementById('learnedFilterBtn').disabled = Boolean(context?.mode);
    document.getElementById('schoolPickCount').textContent = canDefine ? selectedSchools.size + '/' + context.schoolCount : '';
    document.querySelectorAll('.filter-chip[data-escola]').forEach(chip => {
      const id = chip.dataset.escola, fixed = context?.fixedSchools?.includes(id);
      const locked = id !== 'todas' && (definingSchools ? fixed || (!selectedSchools.has(id) && selectedSchools.size >= context.schoolCount) : !context?.availableSchools?.includes(id));
      chip.setAttribute('aria-disabled', String(locked));
      chip.tabIndex = locked ? -1 : 0;
      chip.classList.toggle('is-disabled', locked);
      chip.classList.toggle('current-school-filter',id!=='todas'&&id===filterEscola);
    });
  }
  apply = function() {
    baseApply();
    const visible = new Set(context?.visible || []);
    const chosen = new Set(context?.chosen || []);
    const selectable = new Set(context?.selectable || []);
    let count = 0;
    cards.forEach(card => {
      const key = card.dataset.spellKey;
      if (!context || !visible.has(key)) card.style.display = 'none';
      if (card.style.display !== 'none') count++;
      const button = card.querySelector('.learn-btn');
      if (!button) return;
      const review=Boolean(context?.mode),replacement=review&&context.replaceable?.includes(key),remove=!review&&Boolean(context?.removable?.[key])&&(chosen.has(key)||learnedSpells.has(key));
      button.disabled = review ? !replacement : !context || (!remove&&!chosen.has(key)&&!selectable.has(key));
      button.classList.toggle('remove-spell',remove||!review&&chosen.has(key));
      button.classList.toggle('replace-spell',Boolean(replacement));
      const repeat=context?.repeatable?.includes(key);
      button.textContent = review ? replacement?'Substituir magia':'Somente consulta' : remove||chosen.has(key) ? 'Remover' : repeat?'Aprender novamente':learnedSpells.has(key) ? 'Recebida' : context?.canChoose ? 'Aprender magia' : 'Consultar';
      if(repeat)button.disabled=false;
      let note=card.querySelector('.repeat-spell-note');
      const noteText=context?.repeatNotes?.[key];
      if(noteText&&card.appendChild){if(!note){note=document.createElement('p');note.className='repeat-spell-note';card.appendChild(note)}note.textContent=noteText}
      else if(note?.remove)note.remove();
      button.title = review ? replacement?'Trocar uma magia de 1º círculo, sem aumentar o total aprendido.':'Nesta consulta você não pode aprender novas magias.' : remove||chosen.has(key) ? 'Remover desta escolha' : button.disabled ? 'Escolha uma fonte com espaços disponíveis na ficha' : 'Aprender por ' + context.label;
    });
    document.getElementById('countLabel').textContent = count + (count === 1 ? ' magia' : ' magias');
    document.getElementById('emptyState').style.display = count ? 'none' : '';
    syncRestrictions();
    const learnedButton=document.getElementById('learnedFilterBtn');
    learnedButton.classList.toggle('active',context?.view==='learned'&&!context?.mode);
    learnedButton.setAttribute('aria-pressed',String(context?.view==='learned'&&!context?.mode));
  };
  // Capture before the standalone listener: never write its global learned list.
  document.addEventListener('click', event => {
    if(event.target.closest('#compactSchoolPicker')){event.preventDefault();event.stopImmediatePropagation();openSchoolFilter();return}
    if(event.target.closest('#compactOtherFilters')){
      event.preventDefault();event.stopImmediatePropagation();const bar=document.getElementById('filtersBar'),button=document.getElementById('compactOtherFilters');
      bar.classList.toggle('filters-expanded');button.setAttribute('aria-expanded',String(bar.classList.contains('filters-expanded')));return;
    }
    const filterChoice=event.target.closest('[data-filter-school]');
    if(filterChoice){
      event.preventDefault();event.stopImmediatePropagation();if(filterChoice.disabled)return;
      filterEscola=filterChoice.dataset.filterSchool;definingSchools=false;filterSelectedSchools=false;syncSelectedSchoolsUI();apply();checkOverflow();closeSchoolFilter();return;
    }
    if(event.target.closest('[data-close-school-filter]')||event.target.id==='schoolFilterDialog'){event.preventDefault();event.stopImmediatePropagation();closeSchoolFilter();return}
    if(event.target.closest('#learnedFilterBtn')){
      event.preventDefault();event.stopImmediatePropagation();
      if(context&&!context.mode)window.parent.postMessage({channel,type:'learned-view',session:context.session,group:context.group},'*');
      return;
    }
    const schoolButton = event.target.closest('.school-mode-btn');
    const schoolChip = event.target.closest('.filter-chip[data-escola]');
    if (schoolButton || schoolChip && (definingSchools || schoolChip.getAttribute('aria-disabled') === 'true')) {
      event.preventDefault(); event.stopImmediatePropagation();
      if (!context || schoolButton?.disabled) return;
      if (schoolButton?.id === 'defineSchoolsBtn') {
        window.parent.postMessage({channel,type:'open-schools',session:context.session,group:context.group,classId:context.classId},'*');return;
      } else if (schoolButton?.id === 'knownSchoolsBtn') {
        definingSchools = false; filterSelectedSchools = true; filterEscola = 'todas';
      } else if (schoolButton?.id === 'allSchoolsBtn') {
        definingSchools = false; filterSelectedSchools = false; filterEscola = 'todas';
      } else if (schoolChip && definingSchools && schoolChip.dataset.escola !== 'todas' && schoolChip.getAttribute('aria-disabled') !== 'true') {
        window.parent.postMessage({ channel, type:'school', session:context.session, group:context.group, id:schoolChip.dataset.escola }, '*');
      }
      syncSelectedSchoolsUI(); apply(); checkOverflow(); return;
    }
    const button = event.target.closest('.learn-btn');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!context || button.disabled) return;
    const id = button.closest('.card')?.dataset.spellKey;
    window.parent.postMessage({ channel, type: context.mode==='school-review'?'replace-preview':context.mode==='school-replace'?'replace-confirm':'choose', session: context.session, group: context.group, id, candidate:context.candidate }, '*');
  }, true);
  document.addEventListener('keydown',event=>{
    const dialog=document.getElementById('schoolFilterDialog');if(!dialog||dialog.hidden)return;
    if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();closeSchoolFilter()}
    if(event.key==='Tab'){
      const buttons=[...dialog.querySelectorAll('button:not(:disabled)')],first=buttons[0],last=buttons.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}
    }
  },true);
  window.addEventListener('message', event => {
    if (event.source !== window.parent || event.data?.channel !== channel || event.data.type !== 'context') return;
    const next = event.data;
    if (![next.visible, next.chosen, next.selectable, next.learned].every(Array.isArray)) return;
    const schoolsChanged=!context||context.group!==next.group||JSON.stringify(context.schools)!==JSON.stringify(next.schools);
    const changed = !context || context.group !== next.group || context.view !== next.view || context.mode !== next.mode || context.candidate !== next.candidate || context.reviewClass !== next.reviewClass || JSON.stringify(context.schools)!==JSON.stringify(next.schools);
    const sectionChanged = !context || context.section !== next.section;
    context = next;
    learnedSpells = new Set(next.learned);
    selectedSchools = new Set(next.schools || []);
    const knownBooks = new Set(cards.flatMap(getCardBooks));
    selectedBooks = new Set(Array.isArray(next.books) ? next.books.filter(book=>knownBooks.has(book)) : knownBooks);
    syncBookFiltersUI();
    if (changed) {
      filterTipo = 'todos'; filterCirc = 0; filterEscola = 'todas'; filterSearch = ''; filterLearned = false; definingSchools = false; filterSelectedSchools = false;
      document.getElementById('searchInput').value = '';
      document.querySelectorAll('.tipo-btn').forEach(button => button.classList.toggle('active', button.dataset.tipo === 'todos'));
      document.querySelectorAll('.circ-btn').forEach(button => button.classList.toggle('active', button.dataset.circ === '0'));
      syncSelectedSchoolsUI();
    }
    if(schoolsChanged&&!next.mode){
      filterSelectedSchools=Boolean(next.schoolCount&&next.schools?.length===next.schoolCount);
      filterEscola='todas';
    }
    if (!next.traditions.includes(filterTipo)) filterTipo = 'todos';
    if (!next.circles.includes(filterCirc)) filterCirc = 0;
    if (!next.availableSchools.includes(filterEscola)) filterEscola = 'todas';
    syncLearnedUI(); syncSelectedSchoolsUI(); apply(); checkOverflow();
    if (changed || sectionChanged) setActiveView(next.section === 'condicoes' ? 'condicoes' : 'magias');
    const learnedButton=document.getElementById('learnedFilterBtn');
    learnedButton.classList.toggle('active',next.view==='learned'&&!next.mode);
    learnedButton.setAttribute('aria-pressed',String(next.view==='learned'&&!next.mode));
  });
  syncLearnedUI(); apply();
  window.parent.postMessage({ channel, type: 'ready' }, '*');
})();
