
// Executed only in the embedded, sandboxed copy built for the character assistant.
(() => {
  const channel = 'forja-t20-grimoire-v1';
  let context = null;
  const style = document.createElement('style');
  style.textContent = `
    .site-header{display:none!important}
    button.forja-clicked{animation:forjaButtonClick .32s ease-out}@keyframes forjaButtonClick{0%{transform:scale(1)}42%{transform:scale(.94);filter:brightness(1.35);box-shadow:0 0 0 3px rgba(233,173,89,0.35)}100%{transform:scale(1)}}
    .view-tabs-wrap{display:none!important}
    .search-row .view-tabs{margin-left:auto;display:flex!important}
    .card{position:relative!important;padding-bottom:14px!important}
    .card-title-row{padding-right:76px!important}
    .learn-btn{position:absolute!important;top:12px!important;right:12px!important;bottom:auto!important}
    .card-overlay{justify-content:center!important;padding-left:0!important;padding-bottom:10px!important}
    .expand-btn{margin:0 auto!important}
    .card.expanded .expand-btn{margin:8px auto 12px!important}
    .learn-btn.remove-spell{border-color:#dc2626!important;color:#f5eee6!important;background:rgba(197,31,44,0.28)!important}
    .learn-btn.remove-spell:hover{border-color:#ef4444!important;color:#ffffff!important;background:rgba(197,31,44,0.45)!important}
    .learn-btn.replace-spell{border-color:#e9ad59!important;color:#f5c879!important;background:rgba(233,173,89,0.16)!important}
    .learn-btn:not(.remove-spell):not(:disabled){border-color:#e9ad59;color:#f5c879;background:rgba(233,173,89,0.14);font-weight:700}
    .learn-btn.learned-spell{border-color:#4a252a;color:#e9ad59;background:#181114}
    .learn-btn.fixed-spell{border-color:#4a252a;color:#c9b2aa;background:#110d0f}
    .learn-btn.learn-again{border-color:#eab308!important;color:#fef08a!important;background:rgba(234,179,8,0.22)!important;font-weight:700!important}
    .learn-btn.learn-again:hover{border-color:#facc15!important;color:#ffffff!important;background:rgba(234,179,8,0.38)!important}
    .badge-status-magia{display:inline-flex;align-items:center;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;margin-left:4px}
    .badge-status-magia.badge-learned{background:rgba(233,173,89,0.14);color:#f5c879;border:1px solid #4a252a}
    .badge-status-magia.badge-fixed{background:#181114;color:#c9b2aa;border:1px solid #4a252a}
    .badge-status-magia.badge-relearned{background:rgba(234,179,8,0.22);color:#fde047;border:1px solid rgba(234,179,8,0.5)}
    .tradition-floating-notice{position:fixed;top:14px;left:50%;transform:translateX(-50%) translateY(-10px);z-index:1000;margin:0;width:fit-content;max-width:92%;padding:8px 24px;border-radius:999px;font-family:'Tormenta','Cinzel',serif;font-size:0.85rem;font-weight:700;letter-spacing:0.5px;text-align:center;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);box-shadow:0 8px 32px rgba(0,0,0,0.65);opacity:0;pointer-events:none;transition:opacity 0.4s ease,transform 0.4s ease;display:flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(135deg,#181114,#110d0f);border:1px solid #e9ad59;color:#f5c879}
    .tradition-floating-notice.visible{opacity:1;transform:translateX(-50%) translateY(0)}
    .tradition-floating-notice.arcana,.tradition-floating-notice.divina,.tradition-floating-notice.universal{background:linear-gradient(135deg,#181114,#110d0f);border:1px solid #e9ad59;box-shadow:0 8px 28px rgba(0,0,0,0.65);color:#f5c879}
    #defineSchoolsBtn{display:none!important}
    .repeat-spell-note{margin:8px 12px;padding:8px;border:1px solid #4a252a;border-radius:6px;color:#f5eee6;font-size:12px;line-height:1.5}
    .learn-btn:disabled,.circ-btn:disabled,.tipo-btn:disabled,.school-mode-btn:disabled,.filter-chip[aria-disabled="true"]{opacity:.35;filter:grayscale(1);cursor:default}
    .filters-bar{padding:12px 22px;position:relative!important;top:auto!important}
    .filters-inner,.main{max-width:none}
    .search-row{margin-bottom:10px;gap:10px}
    .search-box{min-width:0;padding:8px 12px}
    .filter-row{column-gap:5px;row-gap:6px}
    .filter-row+.filter-row{margin-top:7px}
    .filter-label{font-size:10px;letter-spacing:.5px;margin-right:1px}
    .filter-sep{margin:0 2px}
    .tipo-btn{padding:4px 9px;font-size:11px}
    .circ-btn{width:26px;height:26px;flex-basis:26px}.circ-btn[data-circ="0"],.circ-btn[data-circ="todos"]{width:auto!important;min-width:52px!important;flex:0 0 auto!important;padding:0 12px!important;border-radius:16px!important}
    .filter-chip{min-height:26px;padding:4px 8px}
    .school-mode-btn{min-width:0;padding-inline:7px}
    #learnedFilterBtn{min-width:0;margin-left:auto;gap:5px;flex:0 0 auto}
    .main{padding:16px 22px}
    .grid{gap:14px;grid-template-columns:repeat(3,minmax(0,1fr))}
    .compact-school-modes{display:contents}
    .compact-filter-button{display:none}
    .school-filter-dialog{position:fixed;inset:0;z-index:15000;display:grid;place-items:center;padding:14px;background:#000a}
    .school-filter-dialog[hidden]{display:none}
    .school-filter-dialog>section{width:min(420px,100%);max-height:calc(100dvh - 28px);overflow:auto;border:1px solid #4a252a;border-radius:10px;padding:16px;background:#110d0f;color:#f5eee6}
    .school-filter-dialog header{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}
    .school-filter-dialog h2{font:600 16px Cinzel,serif;color:#e9ad59}
    .school-filter-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
    .school-filter-dialog button{padding:9px;border:1px solid #4a252a;border-radius:7px;background:#181114;color:#f5eee6;cursor:pointer}
    .school-filter-dialog button:disabled{opacity:.38;cursor:not-allowed}
    .school-filter-dialog button[aria-pressed="true"]{border-color:#e9ad59;background:rgba(197,31,44,0.22);color:#f5c879}
    .school-filter-dialog button:focus-visible,.compact-filter-button:focus-visible{outline:2px solid #e9ad59;outline-offset:2px}
    .repeat-spell-dialog{position:fixed;inset:0;z-index:16000;display:grid;place-items:center;padding:14px;background:rgba(0,0,0,0.75);backdrop-filter:blur(2px)}
    .repeat-spell-dialog[hidden]{display:none}
    .repeat-spell-dialog>section{width:min(440px,100%);max-height:calc(100dvh - 28px);overflow:auto;border:1px solid #4a252a;border-radius:12px;padding:20px;background:#110d0f;color:#f5eee6;box-shadow:0 12px 36px rgba(0,0,0,0.6)}
    .repeat-spell-dialog header{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}
    .repeat-spell-dialog h2{font:700 16px Cinzel,serif;color:#e9ad59;margin:0}
    .repeat-spell-dialog p{font-size:14px;line-height:1.5;margin:0 0 18px 0;color:#f5eee6}
    .repeat-spell-dialog .repeat-actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:10px}
    .repeat-spell-dialog .repeat-btn{padding:9px 14px;border:1px solid #4a252a;border-radius:7px;background:#181114;color:#f5eee6;cursor:pointer;font-weight:600;font-size:13px;transition:all .15s ease}
    .repeat-spell-dialog .repeat-btn:hover{background:#24171b;border-color:#e9ad59}
    .repeat-spell-dialog .repeat-btn.confirm{background:#c51f2c;border-color:#ea3948;color:#fff}
    .repeat-spell-dialog .repeat-btn.confirm:hover{background:#ea3948}
    @media(min-width:960px){.search-row+.filter-row{column-gap:4px}.school-mode-btn{font-size:10px}.search-row+.filter-row .filter-chip{padding-inline:7px}}
    @media(min-width:601px) and (max-width:980px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(min-width:1400px){.grid{grid-template-columns:repeat(auto-fill,minmax(360px,1fr))}}
    @media(max-width:600px){
      body.is-mobile-device .grid, body.is-mobile-device .filters-bar { display: block; }
      .filters-bar{padding:8px 10px;background:#110d0f;border-bottom:1px solid #4a252a}
      .main{padding:10px 8px}
      .grid{grid-template-columns:1fr;gap:10px}
      .search-row{display:flex;gap:6px;align-items:center;margin-bottom:8px}
      .search-box{flex:1;min-width:0;padding:6px 10px;font-size:13px;height:34px;background:#090708;border:1px solid #4a252a;border-radius:6px;color:#f5eee6}
      .search-mode-button{display:none}
      .search-row .view-tabs{display:none!important}
      .result-count{font-size:10px;color:#c9b2aa;white-space:nowrap}
      .filter-row{display:flex!important;gap:5px;align-items:center;overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:4px;scrollbar-width:none}
      .filter-row::-webkit-scrollbar{display:none}
      .filter-label{font-size:10px;color:#e9ad59;font-weight:700;text-transform:uppercase;margin-right:2px;flex:0 0 auto}
      .filter-sep{display:none}
      .tipo-btn{min-height:28px;padding:3px 8px;font-size:11px;flex:0 0 auto;border-radius:4px}
      .circ-btn{width:28px;height:28px;flex:0 0 28px;font-size:12px;border-radius:50%}
      .circ-btn[data-circ="0"]{width:auto!important;min-width:44px!important;padding:0 8px!important;border-radius:14px!important}
      .filter-chip{min-height:28px;padding:3px 8px;font-size:11px;flex:0 0 auto;white-space:nowrap;border-radius:4px}
      #learnedFilterBtn{margin-left:auto;flex:0 0 auto}
      .card{max-height:none!important;padding-bottom:12px!important;border-radius:8px!important}
      .card-title-row{display:flex!important;align-items:flex-start!important;justify-content:space-between!important;gap:8px!important;padding-right:0!important}
      .card-title-row h3{font-size:0.95rem!important;line-height:1.25!important}
      .learn-btn{position:static!important;margin-top:2px!important;min-height:32px!important;padding:4px 10px!important;font-size:11px!important;flex:0 0 auto!important}
    }
  `;
  document.head.appendChild(style);
  document.addEventListener('click',event=>{const button=event.target.closest?.('button');if(!button||button.disabled)return;button.classList.remove('forja-clicked');void button.offsetWidth;button.classList.add('forja-clicked');setTimeout(()=>button.classList.remove('forja-clicked'),360)},true);
  let schoolFilterMode = 'all'; // 'all' | 'class' | 'consult' | 'learned'
  let userSelectedSchool = null;
  function installCompactFilters(){
    const all=document.getElementById('allSchoolsBtn'),schoolAll=document.querySelector?.('.filter-chip[data-escola="todas"]');
    if(!all?.parentElement||!schoolAll)return;
    if(all) all.textContent = 'Todas';
    const row=all.parentElement,modes=document.createElement('div');modes.className='compact-school-modes';row.classList.add('tradition-circle-row');
    const classBtn=document.getElementById('classSchoolsBtn');
    if(classBtn) classBtn.textContent = 'Escolas de magia';
    const consult=document.getElementById('consultModeBtn');
    const learned=document.getElementById('learnedFilterBtn');
    modes.append(all,classBtn,consult,learned);row.appendChild(modes);
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
  // installCompactFilters bypassed for unified responsive clean layout
  let pendingRepeatConfirm = null;
  function installRepeatSpellDialog(){
    const dialog=document.createElement('div');dialog.id='repeatSpellDialog';dialog.className='repeat-spell-dialog';dialog.hidden=true;dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','repeatSpellTitle');
    dialog.innerHTML='<section><header><h2 id="repeatSpellTitle">Aprender novamente</h2><button type="button" class="repeat-btn" data-repeat-action="cancel" aria-label="Fechar">×</button></header><p id="repeatSpellPrompt">Você já conhece essa magia, pode escolher outra magia ou aprender essa novamente e reduzir seu custo em -1 PM.</p><div class="repeat-actions"><button type="button" class="repeat-btn" data-repeat-action="cancel">Escolher outra magia</button><button type="button" class="repeat-btn confirm" data-repeat-action="confirm">Aprender essa novamente (-1 PM)</button></div></section>';document.body?.appendChild(dialog);
  }
  function closeRepeatSpellDialog(){const dialog=document.getElementById('repeatSpellDialog');if(dialog)dialog.hidden=true;pendingRepeatConfirm=null}
  function openRepeatSpellDialog(onConfirm){let dialog=document.getElementById('repeatSpellDialog');if(!dialog){installRepeatSpellDialog();dialog=document.getElementById('repeatSpellDialog')}pendingRepeatConfirm=onConfirm;dialog.hidden=false;dialog.querySelector('.repeat-btn.confirm')?.focus()}
  installRepeatSpellDialog();

  function installConsultNoticeDialog(){
    if(document.getElementById('consultNoticeDialog'))return;
    const dialog=document.createElement('div');dialog.id='consultNoticeDialog';dialog.className='repeat-spell-dialog';dialog.hidden=true;dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','consultNoticeTitle');
    dialog.innerHTML='<section><header><h2 id="consultNoticeTitle" style="color:var(--gold2,#f39c12);margin:0">Modo Consulta</h2><button type="button" class="repeat-btn" data-consult-action="cancel" aria-label="Fechar">×</button></header><p id="consultNoticePrompt" style="margin:14px 0 20px 0;line-height:1.5">Modo consulta ligado, mude para todas as magias para poder aprender.</p><div class="repeat-actions"><button type="button" class="repeat-btn" data-consult-action="cancel">Cancelar</button><button type="button" class="repeat-btn confirm" data-consult-action="confirm">Confirmar</button></div></section>';
    document.body?.appendChild(dialog);
  }
  function closeConsultNoticeDialog(){const dialog=document.getElementById('consultNoticeDialog');if(dialog)dialog.hidden=true}
  function openConsultNoticeDialog(){let dialog=document.getElementById('consultNoticeDialog');if(!dialog){installConsultNoticeDialog();dialog=document.getElementById('consultNoticeDialog')}dialog.hidden=false;dialog.querySelector('.repeat-btn.confirm')?.focus()}
  installConsultNoticeDialog();
  let _lastGrimoireWheel = 0;
  document.addEventListener('wheel',event=>{
    const now = Date.now();
    if(now - _lastGrimoireWheel > 80){
      _lastGrimoireWheel = now;
      if(event.deltaY>0 || (event.deltaY<0 && window.scrollY<2)){
        window.parent.postMessage({channel,type:'host-scroll',session:context?.session,group:context?.group,delta:event.deltaY,scrollY:window.scrollY},'*');
      }
    }
  },{passive:true});

  const isEmbedded = window.self !== window.top;
  const urlParams = new URLSearchParams(window.location.search);
  const urlModo = urlParams.get('modo') || urlParams.get('origem');
  const isEngenhocaModo = urlModo === 'engenhoca' || urlModo === 'contraption' || urlModo === 'workshop-engenhoca';
  const urlCirculoMax = Number(urlParams.get('circuloMax') || urlParams.get('maxCirculo') || 5);
  const urlForma = urlParams.get('forma') || 'empunhada';

  if (!isEmbedded && !isEngenhocaModo) {
    learnedSpells = typeof loadLearnedSpells === 'function' ? loadLearnedSpells() : new Set();
    selectedSchools = typeof loadSelectedSchools === 'function' ? loadSelectedSchools() : new Set();
  } else {
    learnedSpells = new Set();
    selectedSchools = new Set();
  }

  if (isEngenhocaModo) {
    const allowedCircles = [1, 2, 3, 4, 5].filter(c => c <= urlCirculoMax);
    context = {
      channel,
      session: Date.now(),
      mode: 'workshop-engenhoca',
      source: 'engenhoca',
      label: `Oficina do Engenhoqueiro (Magias até ${urlCirculoMax}º Círculo)`,
      circuloMax: urlCirculoMax,
      forma: urlForma,
      circles: allowedCircles,
      traditions: ['arcana', 'divina'],
      allSchools: true,
      visible: (typeof cards !== 'undefined' && Array.isArray(cards) ? cards : []).filter(c => {
        const circ = parseInt(c.dataset.circulo || '1', 10);
        return circ <= urlCirculoMax;
      }).map(c => c.dataset.spellKey)
    };
    schoolFilterMode = 'all';

    // Injeta banner da Oficina do Engenhoqueiro no topo
    const banner = document.createElement('div');
    banner.className = 'engenhoca-grimoire-banner';
    banner.style.cssText = 'background:linear-gradient(135deg,#1c1214,#2d1518);border:1px solid #991b1b;border-radius:8px;padding:12px 18px;margin:12px auto;max-width:1400px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;color:#f8fafc;box-shadow:0 8px 24px rgba(0,0,0,0.6);';
    banner.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;">
        <span style="display:inline-flex;align-items:center;color:#ef4444;"><svg class="forja-svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg></span>
        <div>
          <div style="font-family:Cinzel,serif;font-size:1.02rem;font-weight:700;color:#ef4444;">Oficina do Engenhoqueiro · Escolher Magia Simulada</div>
          <div style="font-size:0.8rem;color:#cbd5e1;margin-top:2px;">Escolha qualquer magia arcana ou divina de até <strong>${urlCirculoMax}º Círculo</strong> para a sua engenhoca.</div>
        </div>
      </div>
      <a href="engenhoca.html?forma=${encodeURIComponent(urlForma)}" style="background:#1e293b;border:1px solid #475569;color:#f8fafc;text-decoration:none;padding:6px 14px;border-radius:6px;font-size:0.82rem;font-weight:700;display:inline-flex;align-items:center;gap:6px;">← Voltar à Bancada</a>
    `;
    const mainEl = document.querySelector('.main') || document.querySelector('.filters-bar') || document.body;
    if (mainEl.parentNode) mainEl.parentNode.insertBefore(banner, mainEl);
    else document.body.prepend(banner);
  }

  const isPotionModo = urlModo === 'pocao' || urlModo === 'potion' || urlModo === 'potion-craft';
  const isScrollModo = urlModo === 'pergaminho' || urlModo === 'scroll' || urlModo === 'scroll-craft';

  if (isPotionModo) {
    learnedSpells = typeof loadLearnedSpells === 'function' ? loadLearnedSpells() : new Set();
    const learnedArr = Array.from(learnedSpells);
    context = {
      channel,
      session: Date.now(),
      mode: 'potion-craft',
      source: 'potion',
      label: 'Laboratório do Alquimista · Escolha de Magia Conhecida',
      learned: learnedArr,
      visible: learnedArr,
      selectable: learnedArr
    };
    schoolFilterMode = 'learned';
    filterLearned = true;

    const banner = document.createElement('div');
    banner.className = 'potion-grimoire-banner';
    banner.style.cssText = 'background:linear-gradient(135deg,#130c1c,#221133);border:1px solid #7e22ce;border-radius:8px;padding:12px 18px;margin:12px auto;max-width:1400px;display:flex;align-items:center;justify-content:space-between;flex-wrap:gap:12px;color:#f8fafc;box-shadow:0 8px 24px rgba(0,0,0,0.6);';
    banner.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;">
        <span style="display:inline-flex;align-items:center;color:#a855f7;"><svg class="forja-svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v2"/><path d="M14 2v2"/><path d="M8.5 4h7"/><path d="M14 10.5V4h-4v6.5L4 20v1a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1l-6-9.5z"/></svg></span>
        <div>
          <div style="font-family:Cinzel,serif;font-size:1.02rem;font-weight:700;color:#c084fc;">Laboratório do Alquimista · Preparar Poção</div>
          <div style="font-size:0.8rem;color:#cbd5e1;margin-top:2px;">Você só pode preparar poções com magias que conhece. Escolha uma de suas magias aprendidas.</div>
        </div>
      </div>
      <a href="loja.html?oficina=alquimista" style="background:#1e293b;border:1px solid #475569;color:#f8fafc;text-decoration:none;padding:6px 14px;border-radius:6px;font-size:0.82rem;font-weight:700;display:inline-flex;align-items:center;gap:6px;">← Voltar à Oficina</a>
    `;
    const mainEl = document.querySelector('.main') || document.querySelector('.filters-bar') || document.body;
    if (mainEl.parentNode) mainEl.parentNode.insertBefore(banner, mainEl);
    else document.body.prepend(banner);
  }

  if (isScrollModo) {
    learnedSpells = typeof loadLearnedSpells === 'function' ? loadLearnedSpells() : new Set();
    const learnedArr = Array.from(learnedSpells);
    context = {
      channel,
      session: Date.now(),
      mode: 'scroll-craft',
      source: 'scroll',
      label: 'Escritório do Escriba · Escolha de Magia Conhecida',
      learned: learnedArr,
      visible: learnedArr,
      selectable: learnedArr
    };
    schoolFilterMode = 'learned';
    filterLearned = true;

    const banner = document.createElement('div');
    banner.className = 'scroll-grimoire-banner';
    banner.style.cssText = 'background:linear-gradient(135deg,#1c1808,#2e250c);border:1px solid #ca8a04;border-radius:8px;padding:12px 18px;margin:12px auto;max-width:1400px;display:flex;align-items:center;justify-content:space-between;flex-wrap:gap:12px;color:#f8fafc;box-shadow:0 8px 24px rgba(0,0,0,0.6);';
    banner.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;">
        <span style="display:inline-flex;align-items:center;color:#eab308;"><svg class="forja-svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg></span>
        <div>
          <div style="font-family:Cinzel,serif;font-size:1.02rem;font-weight:700;color:#fde047;">Escritório do Escriba · Escrever Pergaminho</div>
          <div style="font-size:0.8rem;color:#cbd5e1;margin-top:2px;">Você só pode escrever pergaminhos com magias que conhece. Escolha uma de suas magias aprendidas.</div>
        </div>
      </div>
      <a href="loja.html?oficina=escriba" style="background:#1e293b;border:1px solid #475569;color:#f8fafc;text-decoration:none;padding:6px 14px;border-radius:6px;font-size:0.82rem;font-weight:700;display:inline-flex;align-items:center;gap:6px;">← Voltar à Oficina</a>
    `;
    const mainEl = document.querySelector('.main') || document.querySelector('.filters-bar') || document.body;
    if (mainEl.parentNode) mainEl.parentNode.insertBefore(banner, mainEl);
    else document.body.prepend(banner);
  }

  const baseApply = apply;
  function syncRestrictions() {
    const isConsult = !context || schoolFilterMode === 'consult' || context?.mode === 'consult' || context?.group === 'general-consultation';
    const isHeroSheet = context?.mode === 'character-sheet' || context?.group === 'character-grimoire';
    const isReview = Boolean(context?.mode && context?.mode !== 'consult' && !isHeroSheet);
    const hasClassMagic = Boolean(context?.hasClassMagic);
    const isLimitedBySchools = Boolean(context?.isLimitedBySchools);
    const types = new Set(context?.traditions || context?.classTraditions || []), circles = new Set(context?.circles || []);
    document.querySelectorAll('.tipo-btn').forEach(button => {
      const tipo = button.dataset.tipo;
      if (types.size > 0 && tipo !== 'todos' && !types.has(tipo)) {
        button.disabled = true;
        button.style.display = 'none';
      } else {
        button.disabled = false;
        button.style.display = '';
      }
      button.setAttribute('aria-disabled', String(button.disabled));
    });
    const isEngenhoca = context?.mode === 'workshop-engenhoca' || context?.source === 'engenhoca';
    const isTavernPotion = context?.mode === 'tavern-potion' || context?.source === 'tavern-potion' || context?.mode === 'tavern-tattoo' || context?.source === 'tavern-tattoo';
    document.querySelectorAll('.circ-btn').forEach(button => {
      const circNum = Number(button.dataset.circ);
      if (isEngenhoca || isTavernPotion) {
        button.disabled = (circNum !== 0 && !circles.has(circNum));
      } else {
        button.disabled = !isConsult && !isReview && !isHeroSheet && (circNum === 0 || !circles.has(circNum));
      }
      button.setAttribute('aria-disabled', String(button.disabled));
    });
    const canDefine = Boolean(context?.schoolChoiceCount && context?.classId);
    const define = document.getElementById('defineSchoolsBtn');
    if(define){
      define.disabled = !canDefine || Boolean(context?.mode) || isConsult;
      define.textContent = definingSchools ? 'Confirmar' : selectedSchools.size < (context?.schoolCount || 0) ? 'Completar escolas' : 'Escolas escolhidas';
    }
    const classSc = new Set(context?.schools || []);
    const allBtn = document.getElementById('allSchoolsBtn');
    const classBtn = document.getElementById('classSchoolsBtn');
    const consultBtn = document.getElementById('consultModeBtn');
    const learnedBtn = document.getElementById('learnedFilterBtn');

    if(allBtn){
      if(isHeroSheet){
        const canAll = hasClassMagic && !isLimitedBySchools;
        allBtn.disabled = !canAll;
        allBtn.setAttribute('aria-disabled', String(!canAll));
        allBtn.title = canAll ? 'Ver todas as magias que sua classe pode aprender' : (isLimitedBySchools ? 'Esta classe é limitada pelas suas escolas de magia' : 'Esta classe não possui a habilidade Magias');
      }else{
        allBtn.disabled = false;
        allBtn.setAttribute('aria-disabled', 'false');
      }
      allBtn.classList.toggle('active', schoolFilterMode === 'all' && filterEscola === 'todas');
    }
    if(classBtn){
      if(classBtn.textContent !== 'Escolas de magia') classBtn.textContent = 'Escolas de magia';
      if(isHeroSheet){
        const canClass = hasClassMagic && isLimitedBySchools && classSc.size > 0;
        classBtn.disabled = !canClass;
        classBtn.setAttribute('aria-disabled', String(!canClass));
        classBtn.title = canClass ? 'Filtrar escolas de magia da classe' : (!hasClassMagic ? 'Esta classe não possui a habilidade Magias' : !isLimitedBySchools ? 'Esta classe não tem limitação por escolas de magia' : 'Nenhuma escola de magia foi aprendida ainda');
      }else{
        const canClickClassBtn = !isConsult && classSc.size > 0;
        classBtn.disabled = !canClickClassBtn;
        classBtn.setAttribute('aria-disabled', String(!canClickClassBtn));
        classBtn.title = isConsult ? 'Escolas de magia indisponíveis no modo consulta' : classSc.size === 0 ? 'Nenhuma escola de magia foi aprendida ainda' : 'Filtrar escolas de magia da classe';
      }
      classBtn.classList.toggle('active', schoolFilterMode === 'class' && filterEscola === 'todas');
    }
    if(consultBtn){
      if (context?.source === 'tattoo' || context?.mode === 'tattoo-craft') {
        consultBtn.style.display = 'none';
      } else {
        consultBtn.style.display = '';
        consultBtn.disabled = false;
        consultBtn.setAttribute('aria-disabled', 'false');
        consultBtn.title = 'Consulta e leitura ampla de todo o catálogo';
        consultBtn.classList.toggle('active', schoolFilterMode === 'consult');
      }
    }
    if(learnedBtn){
      const hasLearnedSpells = (context?.learned?.length || 0) > 0 || learnedSpells.size > 0;
      learnedBtn.disabled = !hasLearnedSpells;
      learnedBtn.setAttribute('aria-disabled', String(learnedBtn.disabled));
      learnedBtn.title = hasLearnedSpells ? 'Magias que o personagem pode lançar (aprendidas e recebidas)' : 'Nenhuma magia aprendida';
      learnedBtn.classList.toggle('active', schoolFilterMode === 'learned');
    }
    document.getElementById('schoolPickCount').textContent = canDefine ? selectedSchools.size + '/' + context.schoolCount : '';
    document.querySelectorAll('.filter-chip[data-escola]').forEach(chip => {
      const id = chip.dataset.escola, fixed = context?.fixedSchools?.includes(id);
      let locked = false;
      if (!isConsult && id !== 'todas') {
        if (schoolFilterMode === 'class') {
          locked = !classSc.has(id);
        } else if (definingSchools) {
          locked = fixed || (!selectedSchools.has(id) && selectedSchools.size >= context.schoolCount);
        } else {
          locked = false;
        }
      }
      chip.setAttribute('aria-disabled', String(locked));
      chip.tabIndex = locked ? -1 : 0;
      chip.classList.toggle('is-disabled', locked);
      chip.classList.toggle('current-school-filter', id !== 'todas' && id === filterEscola);
      if (id === 'todas') {
        chip.classList.toggle('active', filterEscola === 'todas');
      } else {
        chip.classList.toggle('active', filterEscola === id);
      }
    });
  }
  apply = function() {
    baseApply();
    const visible = new Set(context?.visible || []);
    const chosen = new Set(context?.chosen || []);
    const selectable = new Set(context?.selectable || []);
    const classSc = new Set(context?.schools || []);
    const totalAllowed = (context?.schoolChoiceCount || 0) + (context?.fixedSchools?.length || 0);
    const schoolsFull = Boolean(totalAllowed > 0 && classSc.size >= totalAllowed);
    const isConsult = schoolFilterMode === 'consult' || context?.mode === 'consult' || context?.group === 'general-consultation' || context?.group === 'character-grimoire' || context?.mode === 'character-sheet';
    let count = 0;
    cards.forEach(card => {
      const key = card.dataset.spellKey;
      const escola = card.dataset.escola;
      const tipo = card.dataset.tipo;
      const button = card.querySelector('.learn-btn');

      const titleEl = card.querySelector('.card-title');
      const baseTitle = card.dataset.baseTitle || (card.dataset.baseTitle = titleEl?.textContent || '');
      const relearnedTimes = context?.relearnedSpells?.[key] || 0;
      if (titleEl) {
        titleEl.textContent = relearnedTimes > 0 ? baseTitle + ' (-' + relearnedTimes + ' PM)' : baseTitle;
      }

      const badgesContainer = card.querySelector?.('.card-badges');
      let statusBadge = card.querySelector?.('.badge-status-magia');
      const isFixed = Boolean(context?.fixedSpells?.includes(key));
      const isLearned = learnedSpells.has(key);
      if (badgesContainer && (isLearned || isFixed)) {
        if (!statusBadge) {
          statusBadge = document.createElement('span');
          statusBadge.className = 'badge badge-status-magia';
          badgesContainer.appendChild(statusBadge);
        }
        if (relearnedTimes > 0) {
          statusBadge.className = 'badge badge-status-magia badge-relearned';
          statusBadge.textContent = '–' + relearnedTimes + ' PM';
        } else if (isFixed) {
          statusBadge.className = 'badge badge-status-magia badge-fixed';
          statusBadge.textContent = 'Recebida';
        } else {
          statusBadge.className = 'badge badge-status-magia badge-learned';
          statusBadge.textContent = 'Aprendida';
        }
      } else if (statusBadge?.remove) {
        statusBadge.remove();
      }

      const allowedTrad = new Set(context?.traditions || context?.classTraditions || []);
      if (allowedTrad.size > 0 && tipo !== 'universal' && !allowedTrad.has(tipo) && schoolFilterMode !== 'learned') {
        card.style.display = 'none';
        return;
      }

      if (schoolFilterMode === 'learned') {
        if (!isLearned && !isFixed) {
          card.style.display = 'none';
          return;
        }
      } else if (schoolFilterMode === 'class') {
        if (!classSc.has(escola)) {
          card.style.display = 'none';
          return;
        }
        const classTrad = new Set(context?.classTraditions || context?.traditions || []);
        if (classTrad.size > 0 && tipo !== 'universal' && !classTrad.has(tipo)) {
          card.style.display = 'none';
          return;
        }
      } else if (schoolFilterMode === 'all') {
        const classTrad = new Set(context?.classTraditions || context?.traditions || []);
        if (classTrad.size > 0 && tipo !== 'universal' && !classTrad.has(tipo)) {
          card.style.display = 'none';
          return;
        }
      }

      const isWorkshopCraftMode = Boolean(context?.mode && (context.mode.endsWith('-craft') || context.mode === 'workshop-engenhoca' || context.mode === 'tavern-potion' || context.source === 'tavern-potion' || context.mode === 'tavern-tattoo' || context.source === 'tavern-tattoo'));
      if (isWorkshopCraftMode) {
        if (!context || !visible.has(key)) {
          card.style.display = 'none';
          return;
        }
        if (button) {
          button.style.display = '';
          let craftLabel = 'Fabricar';
          let craftTitle = 'Fabricar a partir desta magia';
          if (context.mode === 'tavern-potion' || context.source === 'tavern-potion') {
            craftLabel = 'Comprar Poção';
            craftTitle = 'Comprar poção com esta magia';
            button.style.background = '#059669';
            button.style.borderColor = '#10b981';
            button.style.color = '#ffffff';
          } else if (context.mode === 'workshop-engenhoca' || context.source === 'engenhoca') {
            craftLabel = 'Simular Magia';
            craftTitle = 'Simular esta magia na engenhoca';
            button.style.background = '#991b1b';
            button.style.borderColor = '#ef4444';
            button.style.color = '#ffffff';
          } else if (context.mode === 'potion-craft' || context.source === 'potion') {
            craftLabel = 'Preparar';
            craftTitle = 'Preparar poção mágica a partir desta magia';
            button.style.background = '#7e22ce';
            button.style.borderColor = '#a855f7';
            button.style.color = '#ffffff';
          } else if (context.mode === 'scroll-craft' || context.source === 'scroll') {
            craftLabel = 'Fabricar Pergaminho';
            craftTitle = 'Escrever pergaminho a partir desta magia';
          } else if (context.mode === 'tattoo-craft' || context.source === 'tattoo' || context.mode === 'tavern-tattoo' || context.source === 'tavern-tattoo') {
            craftLabel = context.source === 'tavern-tattoo' || context.mode === 'tavern-tattoo' ? 'Gravar Tatuagem' : 'Criar Tatuagem';
            craftTitle = 'Gravar tatuagem mística a partir desta magia';
            button.style.background = '#831843';
            button.style.borderColor = '#db2777';
            button.style.color = '#ffffff';
          }
          button.textContent = craftLabel;
          button.title = craftTitle;
          button.classList.remove('remove-spell', 'replace-spell');
          button.disabled = false;
        }
        if (card.style.display !== 'none') count++;
        return;
      }

      if (isConsult) {
        if (button) {
          button.style.display = '';
          button.disabled = false;
          button.classList.remove('remove-spell', 'replace-spell', 'learn-again');
          button.classList.add('consult-deactivate-btn');
          button.textContent = 'Desativar Consulta';
          button.title = 'Modo consulta ativo. Clique para desativar e voltar para as magias que você pode aprender/fabricar.';
          button.style.background = '#4b5563';
          button.style.color = '#f3f4f6';
          button.style.borderColor = '#6b7280';
        }
        if (card.style.display !== 'none') count++;
        return;
      }

      if (button) {
        button.style.display = '';
        button.classList.remove('consult-deactivate-btn');
        button.style.background = '';
        button.style.color = '';
        button.style.borderColor = '';
      }

      if (schoolFilterMode !== 'learned') {
        if (context && !visible.has(key)) card.style.display = 'none';
      }
      if (card.style.display !== 'none') count++;
      if (!button) return;

      if (!context) {
        const isLearned = learnedSpells.has(key);
        button.textContent = isLearned ? 'Remover' : 'Aprender';
        button.title = isLearned ? 'Remover das magias aprendidas' : 'Aprender magia';
        button.disabled = false;
        return;
      }

      const review=Boolean(context?.mode),replacement=review&&context.replaceable?.includes(key),remove=!review&&Boolean(context?.removable?.[key])&&(chosen.has(key)||learnedSpells.has(key));

      const isOutsideClassSchools = schoolsFull && totalAllowed > 0 && !classSc.has(escola);
      if (isOutsideClassSchools && !remove && !chosen.has(key)) {
        button.disabled = true;
        button.classList.toggle('remove-spell', false);
        button.classList.toggle('replace-spell', false);
        button.textContent = 'Fora das escolas';
        button.title = 'Esta magia pertence a uma escola que não faz parte das suas escolas de magia da classe.';
        card.classList.toggle('outside-school', true);
        return;
      }
      card.classList.toggle('outside-school', false);

      const isEngenhoca = context?.mode === 'workshop-engenhoca' || context?.source === 'engenhoca';

      button.disabled = isEngenhoca ? false : (review ? !replacement : !context || (!remove&&!chosen.has(key)&&!selectable.has(key)));
      button.classList.toggle('remove-spell',!isEngenhoca && (remove||!review&&chosen.has(key)));
      button.classList.toggle('replace-spell',!isEngenhoca && Boolean(replacement));
      const repeat=context?.repeatable?.includes(key);
      button.classList.toggle('learn-again', Boolean(repeat && !remove && !chosen.has(key)));
      if (isEngenhoca) {
        button.textContent = 'Fabricar Engenhoca';
        button.title = 'Escolher esta magia para fabricar uma engenhoca na Oficina do Engenhoqueiro.';
      } else if (review) {
        button.textContent = replacement ? 'Substituir magia' : 'Somente consulta';
      } else if (remove || chosen.has(key)) {
        button.textContent = 'Remover';
      } else if (repeat) {
        button.textContent = 'Aprender novamente';
        button.disabled = false;
        button.title = 'Aprender esta magia novamente reduz o custo em –1 PM.';
      } else if (isLearned || isFixed) {
        button.textContent = isFixed ? 'Recebida' : 'Aprendida';
        button.disabled = true;
      } else if (context?.canChoose) {
        button.textContent = 'Aprender magia';
      } else {
        button.textContent = 'Consultar';
      }
      let note=card.querySelector('.repeat-spell-note');
      const noteText=context?.repeatNotes?.[key];
      if(noteText&&card.appendChild){if(!note){note=document.createElement('p');note.className='repeat-spell-note';card.appendChild(note)}note.textContent=noteText}
      else if(note?.remove)note.remove();
      button.title = isEngenhoca ? 'Escolher esta magia para fabricar uma engenhoca na Oficina do Engenhoqueiro.' : (review ? replacement?'Trocar uma magia de 1º círculo, sem aumentar o total aprendido.':'Nesta consulta você não pode aprender novas magias.' : remove||chosen.has(key) ? 'Remover desta escolha' : repeat ? 'Aprender esta magia novamente reduz o custo em –1 PM.' : button.disabled ? (isLearned ? 'Esta magia já foi aprendida pelo personagem' : 'Escolha uma fonte com espaços disponíveis na ficha') : 'Aprender por ' + context.label);
    });
    document.getElementById('countLabel').textContent = count + (count === 1 ? ' magia' : ' magias');
    document.getElementById('emptyState').style.display = count ? 'none' : '';
    syncRestrictions();
    syncTraditionNotice();
  };

  let traditionNoticeTimer: any = null;
  function syncTraditionNotice() {
    let notice = document.getElementById('traditionFloatingNotice');
    const t = context?.traditionNotice;
    if (!t || !t.count || !context?.canChoose || schoolFilterMode === 'consult') {
      if (notice) {
        notice.classList.remove('visible');
        clearTimeout(traditionNoticeTimer);
      }
      return;
    }
    if (!notice) {
      notice = document.createElement('div');
      notice.id = 'traditionFloatingNotice';
      notice.className = 'tradition-floating-notice';
      const main = document.querySelector('.main') || document.body;
      if (main.firstChild) main.insertBefore(notice, main.firstChild);
      else main.appendChild(notice);
    }
    const type = (t.type || 'universal').toLowerCase();
    const typeTheme = type === 'divina' ? 'divina' : type === 'arcana' ? 'arcana' : 'universal';
    const remaining = Math.max(0, (t.count || 0) - (t.chosen || 0));
    const typeLabel = type === 'divina' ? 'divina' : type === 'arcana' ? 'arcana' : (type === 'any' || type === 'universal') ? 'arcana ou divina' : 'universal';
    const circLabel = (t.circle || 1) + 'º círculo';
    const stageSuffix = t.stageLabel ? ` - ${t.stageLabel}` : (t.label ? ` - ${t.label}` : '');
    if (remaining > 0) {
      const plural = remaining > 1 ? 's' : '';
      const typePlural = remaining > 1 ? (typeLabel.includes(' ou ') ? 'arcanas ou divinas' : typeLabel + 's') : typeLabel;
      notice.textContent = `Escolha ${remaining} magia${plural} ${typePlural} do ${circLabel}${stageSuffix}`;
    } else {
      const total = t.count;
      const plural = total > 1 ? 's' : '';
      const typePlural = total > 1 ? (typeLabel.includes(' ou ') ? 'arcanas ou divinas' : typeLabel + 's') : typeLabel;
      notice.textContent = `${total} magia${plural} ${typePlural} do ${circLabel} selecionada${plural}${stageSuffix}`;
    }
    notice.className = 'tradition-floating-notice visible ' + typeTheme;
    clearTimeout(traditionNoticeTimer);
    traditionNoticeTimer = setTimeout(() => {
      if (notice) notice.classList.remove('visible');
    }, 3800);
  }
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
      const escola = filterChoice.dataset.filterSchool;
      if (escola === 'todas') {
        userSelectedSchool = null;
        filterEscola = 'todas';
      } else {
        userSelectedSchool = escola;
        filterEscola = escola;
      }
      definingSchools=false;filterSelectedSchools=false;syncSelectedSchoolsUI();apply();checkOverflow();closeSchoolFilter();return;
    }
    if(event.target.closest('[data-close-school-filter]')||event.target.id==='schoolFilterDialog'){event.preventDefault();event.stopImmediatePropagation();closeSchoolFilter();return}
    if(event.target.closest('#learnedFilterBtn')){
      event.preventDefault();event.stopImmediatePropagation();
      const learnedBtn = document.getElementById('learnedFilterBtn');
      if(learnedBtn?.disabled) return;
      if(schoolFilterMode === 'learned'){
        // Desligou aprendidas -> ativa automaticamente Modo Consulta
        schoolFilterMode = 'consult';
        filterLearned = false;
        userSelectedSchool = null;
        filterEscola = 'todas';
        syncSelectedSchoolsUI();
        apply();
        checkOverflow();
        window.parent.postMessage({channel, type:'view-change', session:context?.session, group:context?.group, view:'available'}, '*');
        return;
      }
      // Ligou aprendidas
      schoolFilterMode = 'learned';
      filterLearned = true;
      userSelectedSchool = null;
      filterEscola = 'todas';
      filterTipo = 'todos';
      filterCirc = 0;
      filterSearch = '';
      filterSelectedSchools = false;
      const sInput = document.getElementById('searchInput');
      if (sInput) sInput.value = '';
      document.querySelectorAll('.tipo-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tipo === 'todos'));
      document.querySelectorAll('.circ-btn').forEach(btn => btn.classList.toggle('active', Number(btn.dataset.circ) === 0));
      syncSelectedSchoolsUI();
      apply();
      checkOverflow();
      window.parent.postMessage({channel, type:'learned-view', session:context?.session, group:context?.group, view:'learned'}, '*');
      return;
    }
    const schoolChip = event.target.closest('.filter-chip[data-escola]');
    if (schoolChip) {
      event.preventDefault(); event.stopImmediatePropagation();
      if (schoolChip.getAttribute('aria-disabled') === 'true') return;
      const escola = schoolChip.dataset.escola;
      if (definingSchools) {
        if (escola !== 'todas') {
          window.parent.postMessage({ channel, type:'school', session:context?.session, group:context?.group, id:escola }, '*');
        }
        return;
      }
      if (escola === 'todas') {
        userSelectedSchool = null;
        filterEscola = 'todas';
      } else {
        userSelectedSchool = escola;
        filterEscola = escola;
      }
      syncSelectedSchoolsUI(); apply(); checkOverflow(); return;
    }
    const schoolButton = event.target.closest('.school-mode-btn');
    if (schoolButton) {
      event.preventDefault(); event.stopImmediatePropagation();
      if (!context || schoolButton.disabled) return;
      if (schoolButton.id === 'defineSchoolsBtn') {
        window.parent.postMessage({channel,type:'open-schools',session:context.session,group:context.group,classId:context.classId},'*');return;
      }
      userSelectedSchool = null;
      filterEscola = 'todas';
  function deactivateConsultMode() {
    if (context?.hasClassMagic && !context?.isLimitedBySchools) {
      schoolFilterMode = 'all';
    } else if (context?.hasClassMagic && context?.isLimitedBySchools) {
      schoolFilterMode = 'class';
    } else if ((context?.learned?.length || 0) > 0) {
      schoolFilterMode = 'learned';
      filterLearned = true;
    } else {
      schoolFilterMode = 'all';
    }
    filterLearned = false;
    userSelectedSchool = null;
    filterEscola = 'todas';
    if (context) {
      if (context.mode === 'consult') context.mode = 'available';
      if (context.group === 'general-consultation' && context.previousGroup) {
        context.group = context.previousGroup;
      }
    }
    const consultBtn = document.getElementById('consultModeBtn');
    if (consultBtn) {
      consultBtn.classList.remove('active');
      consultBtn.setAttribute('aria-pressed', 'false');
    }
    syncSelectedSchoolsUI();
    apply();
    checkOverflow();
    window.parent.postMessage({channel, type:'view-change', session:context?.session, group:context?.group, view:'available'}, '*');
  }

      if (schoolButton.id === 'consultModeBtn') {
        if (schoolFilterMode === 'consult') {
          deactivateConsultMode();
          return;
        } else {
          schoolFilterMode = 'consult';
          filterLearned = false;
        }
        window.parent.postMessage({channel, type:'view-change', session:context.session, group:context.group, view:'available'}, '*');
      } else if (schoolButton.id === 'allSchoolsBtn') {
        schoolFilterMode = 'all';
        filterLearned = false;
        window.parent.postMessage({channel, type:'view-change', session:context.session, group:context.group, view:'available'}, '*');
      } else if (schoolButton.id === 'classSchoolsBtn') {
        schoolFilterMode = 'class';
        filterLearned = false;
        window.parent.postMessage({channel, type:'view-change', session:context.session, group:context.group, view:'available'}, '*');
      }
      syncSelectedSchoolsUI(); apply(); checkOverflow(); return;
    }
    if(event.target.closest('[data-consult-action="cancel"]')||event.target.id==='consultNoticeDialog'){
      event.preventDefault();event.stopImmediatePropagation();
      closeConsultNoticeDialog();
      return;
    }
    if(event.target.closest('[data-consult-action="confirm"]')){
      event.preventDefault();event.stopImmediatePropagation();
      closeConsultNoticeDialog();
      deactivateConsultMode();
      return;
    }
    if(event.target.closest('[data-repeat-action="cancel"]')||event.target.id==='repeatSpellDialog'){
      event.preventDefault();event.stopImmediatePropagation();
      closeRepeatSpellDialog();
      return;
    }
    if(event.target.closest('[data-repeat-action="confirm"]')){
      event.preventDefault();event.stopImmediatePropagation();
      const cb=pendingRepeatConfirm;
      closeRepeatSpellDialog();
      if(typeof cb==='function')cb();
      return;
    }
    const consultDeactivateBtn = event.target.closest('.consult-deactivate-btn') || (event.target.closest('button')?.textContent?.trim() === 'Desativar Consulta' ? event.target.closest('button') : null);
    if (consultDeactivateBtn) {
      event.preventDefault();
      event.stopImmediatePropagation();
      deactivateConsultMode();
      return;
    }
    const button = event.target.closest('.learn-btn');
    if (!button) return;
    if (schoolFilterMode === 'consult' || context?.mode === 'consult' || context?.group === 'general-consultation') {
      event.preventDefault();
      event.stopImmediatePropagation();
      deactivateConsultMode();
      return;
    }
    const isEngenhoca = context?.mode === 'workshop-engenhoca' || context?.source === 'engenhoca' || isEngenhocaModo;
    if (isEngenhoca) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (button.disabled) return;
      const card = button.closest('.card');
      const id = card?.dataset.spellKey;
      const circ = parseInt(card?.dataset.circulo || '1', 10);
      const maxCirc = context?.circuloMax || urlCirculoMax || 5;
      if (circ > maxCirc) {
        alert(`Magia de ${circ}º Círculo não permitida para o seu nível (máximo: ${maxCirc}º Círculo).`);
        return;
      }
      if (id) {
        if (window.self !== window.top && window.parent) {
          window.parent.postMessage({ channel, type: 'choose', session: context?.session, group: context?.group, id }, '*');
        }
        const forma = context?.forma || urlForma || 'empunhada';
        window.location.href = `engenhoca.html?magia=${encodeURIComponent(id)}&forma=${encodeURIComponent(forma)}`;
      }
      return;
    }
    const isPotionCraft = context?.mode === 'potion-craft' || context?.source === 'potion';
    const isScrollCraft = context?.mode === 'scroll-craft' || context?.source === 'scroll';
    if (isPotionCraft || isScrollCraft) {
      if (id) {
        if (window.self !== window.top && window.parent) {
          window.parent.postMessage({ channel, type: 'choose', session: context?.session, group: context?.group, id }, '*');
        } else {
          const sec = isPotionCraft ? 'alquimista' : 'escriba';
          const param = isPotionCraft ? 'craftPocao' : 'craftScroll';
          window.location.href = `loja.html?oficina=${sec}&${param}=${encodeURIComponent(id)}`;
        }
      }
      return;
    }
    if (!context) {
      // Standalone: deixa o evento prosseguir para 02-00-cards.js
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    if (button.disabled) return;
    const id = button.closest('.card')?.dataset.spellKey;
    const isRepeat = button.textContent.trim() === 'Aprender novamente' || (Boolean(context?.repeatable?.includes(id)) && !button.classList.contains('remove-spell'));
    if (isRepeat && context.mode !== 'school-review' && context.mode !== 'school-replace') {
      openRepeatSpellDialog(() => {
        window.parent.postMessage({ channel, type: 'choose', session: context.session, group: context.group, id, candidate: context.candidate }, '*');
      });
      return;
    }
    window.parent.postMessage({ channel, type: context.mode==='school-review'?'replace-preview':context.mode==='school-replace'?'replace-confirm':'choose', session: context.session, group: context.group, id, candidate:context.candidate }, '*');
  }, true);
  document.addEventListener('keydown',event=>{
    const consultDialog=document.getElementById('consultNoticeDialog');
    if(consultDialog&&!consultDialog.hidden){
      if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();closeConsultNoticeDialog();return}
      if(event.key==='Tab'){
        const buttons=[...consultDialog.querySelectorAll('button:not(:disabled)')],first=buttons[0],last=buttons.at(-1);
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}
      }
      return;
    }
    const repeatDialog=document.getElementById('repeatSpellDialog');
    if(repeatDialog&&!repeatDialog.hidden){
      if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();closeRepeatSpellDialog();return}
      if(event.key==='Tab'){
        const buttons=[...repeatDialog.querySelectorAll('button:not(:disabled)')],first=buttons[0],last=buttons.at(-1);
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}
      }
      return;
    }
    const dialog=document.getElementById('schoolFilterDialog');if(!dialog||dialog.hidden)return;
    if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();closeSchoolFilter()}
    if(event.key==='Tab'){
      const buttons=[...dialog.querySelectorAll('button:not(:disabled)')],first=buttons[0],last=buttons.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}
    }
  },true);
  window.addEventListener('message', event => {
    if (event.source !== window.parent || event.data?.channel !== channel) return;
    if(event.data.type==='scroll-items'){window.scrollBy({top:Number(event.data.delta)||0,behavior:'auto'});return}
    if(event.data.type!=='context')return;
    const next = event.data;
    if (!Array.isArray(next.visible)) return;
    next.chosen = Array.isArray(next.chosen) ? next.chosen : [];
    next.selectable = Array.isArray(next.selectable) ? next.selectable : [];
    next.learned = Array.isArray(next.learned) ? next.learned : [];
    next.availableSchools = Array.isArray(next.availableSchools) ? next.availableSchools : [];
    const isStepOrGroupChange = !context || context.group !== next.group || context.mode !== next.mode || context.candidate !== next.candidate || context.reviewClass !== next.reviewClass;
    const prevSchoolsFull = Boolean(context && ((context.schoolChoiceCount || context.schoolCount || 0) + (context.fixedSchools?.length || 0) > 0) && (context.schools?.length >= ((context.schoolChoiceCount || context.schoolCount || 0) + (context.fixedSchools?.length || 0))));
    const sectionChanged = !context || context.section !== next.section;
    context = next;
    learnedSpells = new Set(next.learned);
    selectedSchools = new Set(next.schools || []);
    const knownBooks = new Set(cards.flatMap(getCardBooks));
    selectedBooks = new Set(Array.isArray(next.books) ? next.books.filter(book=>knownBooks.has(book)) : knownBooks);
    const totalAllowed = (next.schoolChoiceCount || next.schoolCount || 0) + (next.fixedSchools?.length || 0);
    const classSc = new Set(next.schools || []);
    const schoolsFull = Boolean(totalAllowed > 0 && classSc.size >= totalAllowed);

    if (userSelectedSchool && (!next.availableSchools?.includes(userSelectedSchool) || (schoolsFull && totalAllowed > 0 && !classSc.has(userSelectedSchool)))) {
      userSelectedSchool = null;
    }

    const isHeroSheet = next.mode === 'character-sheet' || next.group === 'character-grimoire';
    const isMenuConsultation = next.mode === 'consult' || next.group === 'general-consultation';
    const isWorkshopCraft = Boolean(next.mode && (next.mode.endsWith('-craft') || next.mode === 'workshop-engenhoca' || next.mode === 'tavern-potion' || next.source === 'tavern-potion' || next.mode === 'tavern-tattoo' || next.source === 'tavern-tattoo'));

    if (isStepOrGroupChange) {
      const traditions = next.traditions || [];
      filterTipo = traditions.length === 1 ? traditions[0] : 'todos';
      if (isWorkshopCraft) {
        filterCirc = Number(next.initialCircle) || 0;
        schoolFilterMode = 'all';
        filterLearned = false;
        filterSelectedSchools = false;
      } else if (isMenuConsultation) {
        filterCirc = 0;
        schoolFilterMode = 'consult';
        filterLearned = false;
        filterSelectedSchools = false;
      } else if (isHeroSheet) {
        filterCirc = 0;
        if (next.view === 'learned' && ((next.learned && next.learned.length > 0) || (next.visible && next.visible.length > 0))) {
          schoolFilterMode = 'learned';
          filterLearned = true;
        } else {
          schoolFilterMode = 'consult';
          filterLearned = false;
        }
      } else {
        const allowedCircles = new Set(next.circles || [1]);
        filterCirc = allowedCircles.has(1) ? 1 : (Math.min(...allowedCircles) || 1);
        filterLearned = false;
      }
      filterEscola = userSelectedSchool || 'todas';
      filterSearch = ''; definingSchools = false; filterSelectedSchools = false;
      document.getElementById('searchInput').value = '';
      document.querySelectorAll('.tipo-btn').forEach(button => button.classList.toggle('active', button.dataset.tipo === filterTipo));
      document.querySelectorAll('.circ-btn').forEach(button => button.classList.toggle('active', Number(button.dataset.circ) === filterCirc));
      syncSelectedSchoolsUI();
    }

    if (next.view === 'learned') {
      schoolFilterMode = 'learned';
      filterLearned = true;
      userSelectedSchool = null;
      filterEscola = 'todas';
      filterTipo = 'todos';
      filterCirc = 0;
      filterSearch = '';
      filterSelectedSchools = false;
      const sInput = document.getElementById('searchInput');
      if (sInput) sInput.value = '';
      document.querySelectorAll('.tipo-btn').forEach(button => button.classList.toggle('active', button.dataset.tipo === 'todos'));
      document.querySelectorAll('.circ-btn').forEach(button => button.classList.toggle('active', Number(button.dataset.circ) === 0));
      syncSelectedSchoolsUI();
    } else if (isWorkshopCraft) {
      schoolFilterMode = 'all';
      filterLearned = false;
      filterSelectedSchools = false;
    } else if (isMenuConsultation) {
      schoolFilterMode = 'consult';
      filterLearned = false;
      filterSelectedSchools = false;
    } else if (isHeroSheet) {
      if (next.view === 'learned' && ((next.learned && next.learned.length > 0) || (next.visible && next.visible.length > 0))) {
        schoolFilterMode = 'learned';
        filterLearned = true;
        userSelectedSchool = null;
        filterEscola = 'todas';
        filterTipo = 'todos';
        filterCirc = 0;
        filterSearch = '';
        filterSelectedSchools = false;
        const sInput = document.getElementById('searchInput');
        if (sInput) sInput.value = '';
        document.querySelectorAll('.tipo-btn').forEach(button => button.classList.toggle('active', button.dataset.tipo === 'todos'));
        document.querySelectorAll('.circ-btn').forEach(button => button.classList.toggle('active', Number(button.dataset.circ) === 0));
        syncSelectedSchoolsUI();
      } else {
        filterLearned = false;
        if (schoolFilterMode === 'learned') {
          schoolFilterMode = 'consult';
        }
        filterSelectedSchools = false;
      }
    } else if (!next.mode && schoolFilterMode !== 'consult') {
      if (schoolsFull && totalAllowed > 0) {
        schoolFilterMode = 'class';
        filterSelectedSchools = true;
        if (userSelectedSchool && classSc.has(userSelectedSchool)) {
          filterEscola = userSelectedSchool;
        } else {
          userSelectedSchool = null;
          filterEscola = 'todas';
        }
      } else if (!schoolsFull && (schoolFilterMode === 'class' || prevSchoolsFull)) {
        schoolFilterMode = 'all';
        filterSelectedSchools = false;
        if (!userSelectedSchool) {
          filterEscola = 'todas';
        }
      }
    }
    if (!next.traditions.includes(filterTipo) && filterTipo !== 'todos') filterTipo = 'todos';
    if (!next.circles.includes(filterCirc) && filterCirc !== 0) filterCirc = 0;
    if (userSelectedSchool) {
      filterEscola = userSelectedSchool;
    } else if (next.availableSchools && next.availableSchools.length > 0 && !next.availableSchools.includes(filterEscola)) {
      filterEscola = 'todas';
    }
    syncLearnedUI(); syncLearnedFilterUI(); syncSelectedSchoolsUI(); syncEnhancementReductions(next.wynllaSpells); apply(); checkOverflow();
    if (isStepOrGroupChange || sectionChanged) setActiveView(next.section === 'condicoes' ? 'condicoes' : 'magias');
    const learnedButton=document.getElementById('learnedFilterBtn');
    if(learnedButton){
      if (isMenuConsultation || isWorkshopCraft) {
        learnedButton.disabled = true;
        learnedButton.classList.remove('active');
        learnedButton.setAttribute('aria-pressed', 'false');
      } else {
        const isLearnedActive = filterLearned || next.view === 'learned';
        learnedButton.classList.toggle('active', isLearnedActive);
        learnedButton.setAttribute('aria-pressed', String(isLearnedActive));
      }
    }
  });
  function syncEnhancementReductions(wynllaSpells = []) {
    const wynllaSet = new Set(wynllaSpells || []);
    if(typeof cards === 'undefined' || !Array.isArray(cards)) return;
    cards.forEach(card => {
      if(!card || typeof card.querySelectorAll !== 'function') return;
      const key = card.dataset?.spellKey;
      const isWynlla = wynllaSet.has(key);
      const aprItems = card.querySelectorAll('.apr-list li');
      if (!aprItems || !aprItems.length) return;
      aprItems.forEach(li => {
        if (isWynlla) {
          if (!li.dataset) li.dataset = {};
          if (!li.dataset.originalApr) {
            li.dataset.originalApr = li.innerHTML;
          }
          li.innerHTML = li.dataset.originalApr.replace(/\+(\d+)\s*PM\s*:/g, (_, costStr) => {
            const cost = parseInt(costStr, 10);
            return `+${Math.max(0, cost - 1)} PM:`;
          });
        } else if (li.dataset?.originalApr) {
          li.innerHTML = li.dataset.originalApr;
          delete li.dataset.originalApr;
        }
      });
    });
  }
  syncLearnedUI(); apply();
  window.parent.postMessage({ channel, type: 'ready' }, '*');
})();

