document.addEventListener('click',async event=>{
  let action=event.target.closest?.('[data-sheet-action]')?.dataset.sheetAction;
  if(!action && event.target.closest?.('#editCharacterButton')) action='edit';
  if(!action && event.target.closest?.('#levelUpButton')) action='level-up';
  if(action){event.preventDefault();event.stopImmediatePropagation();event.target.closest?.('details')?.removeAttribute('open');
    if(action==='share-character'){
      if(typeof (window as any).ForjaCompartilhamento?.compartilhar === 'function'){
        (window as any).ForjaCompartilhamento.compartilhar();
      }
      return;
    }
    if(action==='level-up'){
      if(Number(state.identity?.plannedLevel||1) >= 20){
        toast('Seu herói já atingiu o nível máximo (20).', 'info');
        return;
      }
      if(!state.isLevelingUp)state.levelUpBefore=JSON.parse(JSON.stringify(state));
      state.isLevelingUp = true;
      openLevelClassModal();
      return;
    }
    if(action==='sheet'){
      state.isRewardShopMode = false;
      if (typeof window !== 'undefined' && window.location?.search && window.history?.replaceState) {
        window.history.replaceState({}, '', window.location.pathname);
      }
      if(state.isEditingFinishedSheet){
        state.finished=true;
        state.isEditingFinishedSheet=false;
        state.editingCharacter=null;
        state.step=10;
        state.sheetView='sheet';
        persistNavigationNow();
        renderStage({navigationOnly:true});
        return;
      }
      state.sheetView=state.finished?'sheet':'';if(!state.finished&&state.previousCreationStep)state.step=state.previousCreationStep;persistNavigationNow();renderStage({navigationOnly:true})
    }
    else if(action==='grimoire'){
      if(!state.finished)state.previousCreationStep=state.step;
      const isHeroSpells=Boolean(event.target.closest?.('[data-grimoire-view="learned"]'));
      spellState().grimoireSource=isHeroSpells?'hero':'menu';
      spellState().view=isHeroSpells?'learned':'available';
      state.sheetView='grimoire';
      persistNavigationNow();
      renderStage({navigationOnly:true});
    }
    else if(action==='shop'){
      const btn = event.target.closest?.('[data-sheet-action]');
      if (btn) { btn.style.opacity = '0.7'; }
      if(!state.finished) state.previousCreationStep = state.step;
      state.sheetView = 'shop';
      persistNavigationNow();
      renderStage({navigationOnly:true});
    }
    else if(action==='tavern'){
      const btn = event.target.closest?.('[data-sheet-action]');
      if (btn) { btn.style.opacity = '0.7'; }
      if(!state.finished) state.previousCreationStep = state.step;
      state.sheetView = 'tavern';
      persistNavigationNow();
      renderStage({navigationOnly:true});
    }
    else if(action==='conditions'){
      if(typeof window !== 'undefined' && window.ForjaCondicoes?.abrirModal){
        window.ForjaCondicoes.abrirModal();
      }
    }
    else if(action==='workshop'||action==='workshop-hub'||action==='workshop-preview'){
      const btn = event.target.closest?.('[data-sheet-action]');
      if (btn) { btn.style.opacity = '0.7'; btn.style.pointerEvents = 'none'; }
      persistNavigationNow();
      const trained = typeof allTrainedOffices === 'function' ? allTrainedOffices() : [];
      const hasEngenhoca = trained.some(o => (o?.key || o) === 'engenhoqueiro' || /engenho/i.test(o?.key || o?.nome || o));
      const hasOther = trained.some(o => (o?.key || o) !== 'engenhoqueiro' && !/engenho/i.test(o?.key || o?.nome || o));

      if (hasEngenhoca && !hasOther) {
        window.location.href = 'loja.html?oficina=engenhoqueiro';
      } else {
        window.location.href = 'oficina.html?modo=fabricar';
      }
    }
    else if(action==='workshop-return'){
      const gSrc = spellState().grimoireSource;
      if (gSrc === 'engenhoca') {
        window.location.href = 'engenhoca.html';
      } else {
        const divKey = gSrc === 'scroll' ? 'escriba' : (gSrc === 'tattoo' ? 'tatuador' : 'alquimista');
        window.location.href = `oficina.html?modo=fabricar&oficina=${encodeURIComponent(divKey)}`;
      }
    }
    else if(action==='cancel-contraption-attach'){
      const spellId = state.contraptionAttach?.spellId;
      state.contraptionAttach = null;
      state.sheetView = state.previousSheetView || 'grimoire';
      persistNow();
      renderStage();
      if(spellId && typeof window.openEngenhocaCraftModal === 'function'){
        window.openEngenhocaCraftModal(spellId);
      }
    }
    else if(action==='contraption-attach-sheet'){
      state.contraptionAttach=null;
      state.sheetView='sheet';
      persistNow();
      renderStage();
    }
    else if(action==='change-contraption-workshop'){
      const creationOffices = [
        { key: 'armeiro', nome: 'Armeiro', desc: 'armas, armaduras e escudos' },
        { key: 'carpinteiro', nome: 'Carpinteiro', desc: 'madeiras, arcos e cajados' },
        { key: 'artesao', nome: 'Artesão', desc: 'equipamentos e ferramentas' },
        { key: 'alfaiate', nome: 'Alfaiate', desc: 'roupas, trajes e capas' },
        { key: 'joalheiro', nome: 'Joalheiro', desc: 'colares, joias e braceletes' }
      ];
      // @ts-ignore
      const rules = typeof RegrasManufatura !== 'undefined' ? RegrasManufatura : null;
      // @ts-ignore
      const trainedList = typeof allTrainedOffices === 'function' ? allTrainedOffices() : [];
      const trainedCreationOffices = creationOffices.filter(off => {
        return trainedList.some(o => {
          const norm = rules && typeof rules.normalizarOficio === 'function' ? rules.normalizarOficio(o) : o.toLowerCase();
          return norm === off.key || (off.key === 'joalheiro' && (norm === 'ourives' || norm === 'joalheiro'));
        });
      });
      // @ts-ignore
      if(trainedCreationOffices.length > 1 && typeof openSelectCraftOfficeModal === 'function'){
        // @ts-ignore
        openSelectCraftOfficeModal(trainedCreationOffices, (chosenKey) => {
          state.workshopSection = chosenKey;
          persistNow();
          renderStage();
        });
      }
    }
    else if(action==='reward'){
      const btn = event.target.closest?.('[data-sheet-action]');
      if (btn) { btn.style.opacity = '0.7'; btn.style.pointerEvents = 'none'; }
      persistNow();
      window.location.href = 'resgatar-recompensas.html';
    }
    else if(action==='import-code'){
      const m = typeof ensureImportCodeModal === 'function' ? ensureImportCodeModal() : (window.ensureImportCodeModal ? window.ensureImportCodeModal() : null);
      if (m) {
        if (m.sync) m.sync();
        m.hidden = false;
      }
    }
    else if(action==='toggle-simplified'){
      if(state.sheetLayoutMode === 'simplified') state.sheetLayoutMode = 'summary';
      else if(state.sheetLayoutMode === 'summary') state.sheetLayoutMode = 'standard';
      else state.sheetLayoutMode = 'simplified';
      persistNow();
      renderStage();
    }
    else if(action==='switch-to-simplified'){
      state.sheetLayoutMode = 'simplified';
      persistNow();
      renderStage();
    }
    else if(action==='switch-to-summary'){
      state.sheetLayoutMode = 'summary';
      persistNow();
      renderStage();
    }
    else if(action==='toggle-summary'){
      state.sheetLayoutMode = (state.sheetLayoutMode === 'summary') ? 'standard' : 'summary';
      persistNow();
      renderStage();
    }
    else if(action==='toggle-full'){
      state.sheetLayoutMode = 'standard';
      persistNow();
      renderStage();
    }
    else if(action==='export-html-print'){
      window.print();
    }
    else if(action==='export-foundry'){
      try {
        const payload = {
          name: state.identity?.characterName || 'Herói Forjado',
          type: 'character',
          system: {
            attributes: typeof finalAttrs === 'function' ? finalAttrs() : {},
            stats: typeof progressionStats === 'function' ? progressionStats() : {},
            level: state.identity?.plannedLevel || 1,
            race: state.identity?.raceId || '',
            origin: state.origin?.standard || '',
            class: (state.progression || []).map(r => r.classId).filter(Boolean),
            spells: typeof allLearnedSpellIds === 'function' ? allLearnedSpellIds() : [],
            items: typeof characterInventory === 'function' ? characterInventory() : []
          },
          flags: { forjaRubra: true, exportedAt: new Date().toISOString() }
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = (slug(state.identity?.characterName || 'heroi') || 'heroi') + '-foundry-t20.json';
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        toast('Dados estruturados para Foundry VTT exportados com sucesso!');
      } catch (err) {
        console.error(err);
        toast('Erro ao exportar dados para o Foundry.', 'error');
      }
    }
    else if(action==='export-pdf'){
      if (typeof exportCharacterPdf === 'function') {
        exportCharacterPdf().catch(error => {
          console.error(error);
          const notify = typeof toast === 'function' ? toast : (typeof showToast === 'function' ? showToast : alert);
          notify('Não foi possível gerar o PDF. O modelo original não foi alterado.', 'error');
        });
      }
    }
    else if(action==='edit'){
      saveFinishedCharacter();
      state.editingCharacter={originalId:characterIdentifier(),originalName:state.identity?.characterName||'Personagem'};
      state.isEditingFinishedSheet=true;
      state.finished=false;
      state.completed=(state.completed||[]).filter(s=>s<9);
      state.step=1;
      state.sheetView='';
      state.progressionActiveIndex=-1;
      if(state.identity) state.identity.editingLevel=1;
      persistNow();
      if(typeof window!=='undefined'&&window.location?.pathname&&window.location.pathname.endsWith('ficha.html')){
        window.location.href='criador.html?editar=true';
        return;
      }
      document.body?.classList.remove('character-sheet-ready');
      document.body?.classList.add('is-editing-mode');
      const pNav = document.getElementById('phaseNav');
      if (pNav) {
        pNav.hidden = false;
        pNav.style.removeProperty('display');
        pNav.style.display = '';
      }
      const footer = document.querySelector('.stage-footer') as HTMLElement;
      if (footer) {
        footer.hidden = false;
        footer.style.removeProperty('display');
        footer.style.display = '';
      }
      const resetBtn=document.getElementById('resetButton');if(resetBtn)resetBtn.hidden=false;
      renderStage();
      window.scrollTo({top:0,behavior:'smooth'});
      toast('Modo de edição ativo. Navegue pelas fases e finalize novamente para salvar as alterações.');
    }
    else if(action==='new'){
      if(typeof window!=='undefined'&&window.location?.pathname&&window.location.pathname.endsWith('ficha.html')){
        window.location.href='criador.html?novo=true';
        return;
      }
      state.isEditingFinishedSheet=false;
      state.editingCharacter=null;
      if(!state.finished){if(!await forjaConfirm('Deseja iniciar uma nova ficha? Os dados atuais não salvos serão descartados.','Sim, nova ficha'))return}
      state=defaultState();characterStorage.salvar(STORAGE_KEY,state);const resetBtn=document.getElementById('resetButton');if(resetBtn)resetBtn.hidden=true;renderStage();toast('Novo personagem iniciado.')
    }
    else if(action==='random'){
      if(typeof openRandomConfigModal==='function')openRandomConfigModal();
      else if(typeof generateRandomCharacter==='function')generateRandomCharacter();
    }
    else if(action==='characters'||action==='switch')showCharacterPicker();
    else if(action==='rename'){const name=await forjaPrompt('Novo nome do personagem:',state.identity.characterName||'');if(name?.trim()){state.identity.characterName=name.trim().slice(0,80);saveFinishedCharacter();renderStage()}}
    else if(action==='delete'){const modal=ensureDeleteCharacterModal();const heroName=state.identity?.characterName||'este herói';const nameEl=document.getElementById('deleteHeroName');if(nameEl)nameEl.textContent=heroName;modal.hidden=false}
  }
  const character=event.target.closest?.('[data-sheet-character]');if(character){event.preventDefault();event.stopImmediatePropagation();const entry=characterRoster().find(item=>item.id===character.dataset.sheetCharacter);if(!entry)return;state=entry.snapshot;state.finished=true;state.sheetView='sheet';normalizeState();persistNow();document.getElementById('warningModal').hidden=true;renderStage()}
  const menu=document.querySelector('.sheet-menu[open]');if(menu&&!menu.contains(event.target))menu.removeAttribute('open');
},true);

function ensurePotionPurchaseModal(){
  let modal=document.getElementById('potionPurchaseModal');
  if(modal)return modal;
  modal=document.createElement('div');
  modal.id='potionPurchaseModal';
  modal.className='modal-backdrop';
  modal.hidden=true;
  if(modal.style){
    modal.style.position='fixed';
    modal.style.top='0';
    modal.style.left='0';
    modal.style.width='100vw';
    modal.style.height='100vh';
    modal.style.zIndex='100000';
    modal.style.display='none';
    modal.style.alignItems='center';
    modal.style.justifyContent='center';
    modal.style.background='rgba(5, 7, 11, 0.88)';
    modal.style.backdropFilter='blur(6px)';
    modal.style.padding='16px';
    modal.style.boxSizing='border-box';
  }
  modal.innerHTML=`<section class="confirm-modal" role="dialog" aria-modal="true" style="max-width:480px;width:95%;background:#111620;border:1px solid #263346;border-radius:8px;padding:20px;box-shadow:0 20px 50px rgba(0,0,0,0.85);color:#f8fafc;box-sizing:border-box">
    <header style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;border-bottom:1px solid #1e293b;padding-bottom:12px">
      <h3 style="margin:0;font-size:1.15rem;color:#f0d28c;font-family:'Cinzel',serif;letter-spacing:0.5px">COMPRAR POÇÃO MÁGICA</h3>
      <button type="button" class="icon-button" data-potion-action="close" aria-label="Fechar" style="background:transparent;border:1px solid #334155;color:#94a3b8;width:30px;height:30px;display:grid;place-items:center;padding:0;border-radius:4px;cursor:pointer;font-size:1.2rem;line-height:1">×</button>
    </header>
    <div class="confirm-modal-body" style="padding:0;display:flex;flex-direction:column;gap:12px">
      <div style="background:#0d121a;border:1px solid #1e293b;border-radius:6px;padding:12px">
        <strong id="potionPurchaseName" style="font-size:1.05rem;color:#f8fafc;display:block;margin-bottom:4px;font-family:'Cinzel',serif">Poção</strong>
        <span id="potionPurchaseMeta" style="font-size:0.8rem;color:#94a3b8">1º Círculo</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.88rem;color:#94a3b8">
        <span>Preço base (100%):</span>
        <strong id="potionPurchaseBasePrice" style="color:#f8fafc;font-size:0.95rem">T$ 30</strong>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;background:#0d121a;border:1px solid #1e293b;border-radius:6px;padding:8px 12px">
        <span style="font-size:0.82rem;color:#94a3b8;font-weight:600;text-transform:uppercase">Modificador:</span>
        <div style="display:flex;align-items:center;gap:6px">
          <button type="button" data-potion-action="down" style="padding:5px 10px;background:#991b1b;border:1px solid #b91c1c;color:#fff;border-radius:4px;cursor:pointer;font-weight:700">−10%</button>
          <strong id="potionPurchasePercent" style="min-width:54px;text-align:center;color:#f0d28c;font-size:0.9rem">100%</strong>
          <button type="button" data-potion-action="up" style="padding:5px 10px;background:#991b1b;border:1px solid #b91c1c;color:#fff;border-radius:4px;cursor:pointer;font-weight:700">+10%</button>
          <button type="button" data-potion-action="reset" style="padding:5px 12px;background:#991b1b;border:1px solid #b91c1c;color:#fff;border-radius:4px;cursor:pointer;font-weight:700">Restaurar</button>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0 4px 0;border-top:1px solid #1e293b">
        <span style="font-size:0.88rem;color:#94a3b8">Total a pagar:</span>
        <strong id="potionPurchaseTotal" style="font-size:1.25rem;color:#f0d28c;font-family:'Cinzel',serif">T$ 30</strong>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.82rem;color:#94a3b8">
        <span>Saldo disponível:</span>
        <span id="potionPurchaseFunds" style="color:#f8fafc;font-weight:600">T$ 0</span>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:10px;border-top:1px solid #1e293b;padding-top:14px;margin-top:2px">
        <button type="button" data-potion-action="close" style="padding:8px 18px;background:transparent;border:1px solid #334155;color:#94a3b8;font-weight:600;border-radius:6px;cursor:pointer">Cancelar</button>
        <button type="button" class="primary-button" id="confirmPotionPurchaseBtn" style="padding:8px 20px;background:#991b1b;border:1px solid #ef4444;color:#fff;font-weight:700;border-radius:6px;cursor:pointer">Confirmar compra</button>
      </div>
    </div>
  </section>`;
  document.body?.appendChild(modal);
  return modal;
}

let activePotionPurchaseCallback=null,activePotionPurchaseBase=30,activePotionPurchasePercent=100;
function abrirModalCompraPocaoTaverna(opts){
  const modal=ensurePotionPurchaseModal();
  activePotionPurchaseCallback=opts.onConfirm;
  activePotionPurchaseBase=opts.basePrice;
  activePotionPurchasePercent=100;

  const nameEl=document.getElementById('potionPurchaseName');if(nameEl)nameEl.textContent=opts.finalName;
  const metaEl=document.getElementById('potionPurchaseMeta');if(metaEl)metaEl.textContent=`Magia: ${opts.spellNome} · ${opts.circulo}º Círculo`;
  const baseEl=document.getElementById('potionPurchaseBasePrice');if(baseEl)baseEl.textContent=`T$ ${opts.basePrice}`;
  const fundsEl=document.getElementById('potionPurchaseFunds');if(fundsEl)fundsEl.textContent=`T$ ${opts.currentFunds}`;

  const update=()=>{
    const total=Math.max(0,Math.ceil(activePotionPurchaseBase*(activePotionPurchasePercent/100)));
    const pEl=document.getElementById('potionPurchasePercent');if(pEl)pEl.textContent=`${activePotionPurchasePercent}%`;
    const tEl=document.getElementById('potionPurchaseTotal');if(tEl)tEl.textContent=`T$ ${total}`;
  };

  update();
  modal.hidden=false;

  modal.onclick=(e)=>{
    const act=e.target.closest?.('[data-potion-action]')?.dataset.potionAction;
    if(e.target===modal||act==='close'){modal.hidden=true;return}
    if(act==='down'){activePotionPurchasePercent=Math.max(0,activePotionPurchasePercent-10);update();return}
    if(act==='up'){activePotionPurchasePercent=Math.min(300,activePotionPurchasePercent+10);update();return}
    if(act==='reset'){activePotionPurchasePercent=100;update();return}
    if(e.target.closest?.('#confirmPotionPurchaseBtn')){
      modal.hidden=true;
      const totalFinal=Math.max(0,Math.ceil(activePotionPurchaseBase*(activePotionPurchasePercent/100)));
      if(activePotionPurchaseCallback)activePotionPurchaseCallback(totalFinal);
    }
  };
}

window.addEventListener('message',event=>{
  const frame=document.getElementById('spellGrimoire'),message=event?.data;
  if(state.sheetView!=='grimoire'||!frame?.contentWindow||event.source!==frame.contentWindow||message?.channel!=='forja-t20-grimoire-v1')return;
  if(message.type==='learned-view'||message.type==='view-change'){
    const targetView=message.view||(spellState().view==='learned'?'available':'learned');
    spellState().view=targetView;
    const isLearned=targetView==='learned';
    const kicker=document.getElementById('stageKicker');
    if(kicker&&(kicker.textContent==='Consulta Geral'||kicker.textContent==='Magias Conhecidas'||kicker.textContent==='Herói Forjado'))kicker.textContent=isLearned?'Magias Conhecidas':'Consulta Geral';
    const title=document.getElementById('stageTitle');
    if(title&&(title.textContent==='Grimório Geral'||title.textContent==='Grimório do Herói'))title.textContent=isLearned?'Grimório do Herói':'Grimório Geral';
    const catTitle=document.querySelector('.spell-catalog-panel .panel-title');
    if(catTitle&&(catTitle.textContent==='Grimório Geral'||catTitle.textContent==='Grimório do Herói'))catTitle.textContent=isLearned?'Grimório do Herói':'Grimório Geral';
    syncGrimoire();
    return;
  }
  if(message.type==='choose'&&message.id){
    const gSource = spellState().grimoireSource;
    if(gSource==='engenhoca'){
      if(typeof window.openEngenhocaCraftModal==='function') window.openEngenhocaCraftModal(message.id);
      else if(typeof openEngenhocaCraftModal==='function') openEngenhocaCraftModal(message.id);
      else window.location.href = `engenhoca.html?magia=${encodeURIComponent(message.id)}`;
      return;
    }
    if(gSource==='potion'){
      if(typeof window.openPotionCraftModal==='function') window.openPotionCraftModal(message.id);
      return;
    }
    if(gSource==='scroll'){
      if(typeof window.openScrollCraftModal==='function') window.openScrollCraftModal(message.id);
      return;
    }
    if(gSource==='tattoo'){
      if(typeof window.openTattooCraftModal==='function') window.openTattooCraftModal(message.id);
      return;
    }
    if(gSource==='tavern-potion'){
      const spell = (typeof DATA !== 'undefined' && DATA.spells ? DATA.spells.find(s => s.id === message.id) : null) || (typeof spellById === 'function' ? spellById(message.id) : null);
      const spellNome = spell?.nome || spell?.name || message.id;
      const alvo = (spell?.alvo || spell?.target || '').toLowerCase();
      const area = (spell?.area || '').toLowerCase();
      const finalName = `Poção de ${spellNome}`;
      const circulo = Number(spell?.circulo || spell?.circle || state.tavernPotionPurchase?.circle || 1);
      const potionPrices = { 1: 30, 2: 270, 3: 1080, 4: 3000, 5: 6750 };
      const basePrice = potionPrices[circulo] || Number(state.tavernPotionPurchase?.price) || 30;
      const currentFunds = typeof remainingFunds === 'function' ? remainingFunds() : 0;

      abrirModalCompraPocaoTaverna({
        finalName,
        spellNome,
        circulo,
        basePrice,
        currentFunds,
        onConfirm: (totalFinal) => {
          if (currentFunds < totalFinal) {
            toast(`Saldo insuficiente! Custo: T$ ${totalFinal}, Saldo atual: T$ ${currentFunds}.`, 'warning');
            return;
          }
          financesState().spent = Math.round(((financesState().spent || 0) + totalFinal) * 100) / 100;
          if (totalFinal > 0 && typeof registrarDespesaAventura === 'function') {
            registrarDespesaAventura(totalFinal);
          }
          const customId = 'pocao_taverna_' + (spell?.id || message.id) + '_' + Date.now();
          const potionItem = {
            id: customId,
            nome: finalName,
            displayName: finalName,
            tipo: 'item_alquimico',
            categoriaId: 'alquimico_preparado',
            espacos: 0.5,
            preco: { valor: totalFinal, moeda: 'T$' },
            descricao: `Líquido mágico adquirido pronto na Taverna de Arton reproduzindo o efeito da magia ${spellNome} (${circulo}º Círculo). Ação padrão para ingerir ou aplicar.`,
            pocaoInfo: {
              spellId: spell?.id || message.id,
              spellName: spellNome,
              circulo: circulo,
              origem: 'taverna'
            }
          };
          if (typeof addCraftedItemToHeroBackpack === 'function') {
            addCraftedItemToHeroBackpack(customId, 1, {}, potionItem);
          } else {
            state.backpack = state.backpack || [];
            state.backpack.push({
              instanceId: 'crafted_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
              itemId: customId,
              itemName: finalName,
              displayName: finalName,
              quantity: 1,
              origin: 'taverna',
              pocaoInfo: potionItem.pocaoInfo
            });
          }
          state.tavernPotionPurchase = null;
          state.sheetView = state.previousSheetView || 'tavern';
          persistNow();
          renderStage();
          toast(`Poção comprada: "${finalName}" adicionada à mochila! (T$ ${totalFinal})`);
          if (state.finished && typeof saveFinishedCharacter === 'function') {
            setTimeout(() => saveFinishedCharacter(), 0);
          }
        }
      });
      return;
    }
  }
});
window.addEventListener('message',event=>{
  const frame=document.getElementById('characterTavern'),message=event?.data;
  if(!message||message.channel!=='forja-taverna-v1')return;
  if(frame?.contentWindow&&event.source===frame.contentWindow){
    if(message.type==='choose-potion-spell'){
      state.tavernPotionPurchase={circle:Number(message.circle)||1,price:Number(message.price)||30};
      spellState().grimoireSource='tavern-potion';
      spellState().view='available';
      state.previousSheetView=state.sheetView||'tavern';
      state.sheetView='grimoire';
      persistNavigationNow();
      renderStage();
      toast('Escolha no Grimório a magia desejada para comprar a sua poção.');
      return;
    }
    if(message.type==='ready'){
      frame.contentWindow.postMessage({
        channel:'forja-taverna-v1',
        type:'context',
        funds:remainingFunds(),
        characterName:state.identity?.characterName||'Herói',
        level:typeof effectiveCharacterLevel==='function'?effectiveCharacterLevel():((state.progression?.length||0)+1),
        trainedSkills:typeof allTrainedSkills==='function'?allTrainedSkills():[],
        contracts:state.tavernContracts||[],
        partnerLimit: typeof characterPartnerLimitDetails === 'function' ? characterPartnerLimitDetails(typeof effectiveCharacterLevel === 'function' ? effectiveCharacterLevel() : 1) : { maxPartners: (typeof characterPartnerLimit === 'function' ? characterPartnerLimit() : 1), maxVeterans: 0, maxMasters: 0 },
        partners: state.partners || []
      },'*');
    }else if(message.type==='hire'){
      if(message.contract){
        state.tavernContracts=state.tavernContracts||[];
        state.tavernContracts.push(message.contract);
        const cost=Number(message.contract.totalPrice)||0;
        financesState().spent=Math.round(((financesState().spent||0)+cost)*100)/100;
        if(cost>0 && typeof registrarDespesaAventura==='function'){
          registrarDespesaAventura(cost);
        }
        if(message.contract.category==='mercenario'){
          addMercenaryToSheetNotes(message.contract);
        }
        persistNow();
        if(state.finished)saveFinishedCharacter();
        toast((message.contract.category==='mercenario'?'Contrato firmado: ':'Serviço contratado: ')+message.contract.itemName);
      }
    }else if(message.type==='dismiss'){
      removeMercenaryFromSheetNotes(message.contractId);
      state.tavernContracts=(state.tavernContracts||[]).filter(c=>c.contractId!==message.contractId);
      persistNow();
      if(state.finished)saveFinishedCharacter();
    }else if(message.type==='clear-all'){
      clearAllMercenariesFromSheetNotes();
      state.tavernContracts=[];
      persistNow();
      if(state.finished)saveFinishedCharacter();
    }else if(message.type==='host-scroll'){
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
      else frame.contentWindow?.postMessage({channel:'forja-taverna-v1',type:'scroll-items',delta},'*');
    }
  }
});

function cleanMercenaryName(contract){
  if(!contract)return 'Mercenário';
  let name=contract.mercName||contract.partnerType||contract.itemName||'Mercenário';
  name=name.replace(/^(?:Mercenários\s+Especialistas|Capangas|Taverna\s+de\s+Arton)\s*[·•]\s*/i,'');
  name=name.replace(/^[^·•\n]+[·•]\s*/,'');
  while(/\([^)]*\)|\[[^\]]*\]/.test(name)){
    name=name.replace(/\s*\([^)]*\)|\s*\[[^\]]*\]/g,'');
  }
  return name.trim()||'Mercenário';
}

function cleanMercenaryBenefit(contract){
  let text=contract.benefit||'';
  if(!text&&contract.description){
    text=contract.description;
    const colonIdx=text.indexOf(':');
    if(colonIdx>=0&&colonIdx<80)text=text.slice(colonIdx+1);
    const dashIdx=text.lastIndexOf(' — ');
    if(dashIdx>=0&&(text.includes('Um artesão')||text.includes('Um auxiliar')||text.includes('Um mercenário')||text.includes('Um combatente')||text.includes('Um estudioso'))){
      text=text.slice(0,dashIdx);
    }
  }
  text=text.replace(/^•?\s*benef[íi]cio\s*:\s*/i,'').trim();
  while(/^(?:\([^)]*\)\s*|\[[^\]]*\]\s*)+:?\s*/i.test(text)){
    text=text.replace(/^(?:\([^)]*\)\s*|\[[^\]]*\]\s*)+:?\s*/i,'').trim();
  }
  let elem=contract.customChoiceVal||'';
  if(!elem){
    const raw=(contract.itemName||'')+' '+(contract.partnerType||'');
    const m=raw.match(/\b(Fogo|Ácido|Eletricidade|Frio)\b/i);
    if(m)elem=m[1];
  }
  if(elem&&/ácido,\s*eletricidade,\s*fogo\s*ou\s*frio/i.test(text)){
    text=text.replace(/ácido,\s*eletricidade,\s*fogo\s*ou\s*frio(?:\s*\([^)]*\))?/gi,elem.toLowerCase());
  }
  text=text.replace(/\[\s*|\s*\]/g,'');
  return text.trim();
}

function formatMercenaryNote(contract){
  const baseName=cleanMercenaryName(contract);
  const title='• Mercenário: '+baseName;
  const benefit=cleanMercenaryBenefit(contract);
  const lines=[title];
  if(benefit)lines.push(benefit);
  if(contract.isCapanga&&contract.stats){
    lines.push('Estatísticas dos Capangas: '+String(contract.stats).replace(/\[\s*|\s*\]/g,''));
  }
  const isAventura=contract.durationMode==='aventura'||String(contract.unitLabel||'').toLowerCase().includes('aventura');
  const expiration=isAventura?'Contrato: Expira ao fim da aventura.':'Contrato: Expira após a cena em solicitada.';
  lines.push(expiration);
  return lines.join('\n');
}

function sanitizeMercenaryNoteText(notes){
  if(!notes||typeof notes!=='string')return '';
  const blocks=notes.split(/\n\n+/);
  const cleanedBlocks=blocks.map(block=>{
    if(!block.startsWith('• Mercenário:')&&!block.startsWith('[Mercenário:'))return block;
    const lines=block.split('\n');
    let title=lines[0]||'';
    title=title.replace(/^\[Mercenário:\s*/i,'• Mercenário: ').replace(/\]$/,'');
    title=title.replace(/^(?:• Mercenário:\s*)(?:Mercenários\s+Especialistas|Capangas|Taverna\s+de\s+Arton)\s*[·•]\s*/i,'• Mercenário: ');
    while(/\([^)]*\)|\[[^\]]*\]/.test(title)){
      title=title.replace(/\s*\([^)]*\)|\s*\[[^\]]*\]/g,'');
    }
    title=title.trim();
    const contentLines=[];
    let expiration='Contrato: Expira após a cena em solicitada.';
    for(let i=1;i<lines.length;i++){
      let line=lines[i].trim();
      if(!line)continue;
      if(/contrato:\s*expira/i.test(line)){
        if(/fim da aventura/i.test(line)){
          expiration='Contrato: Expira ao fim da aventura.';
        }else{
          expiration='Contrato: Expira após a cena em solicitada.';
        }
        continue;
      }
      line=line.replace(/^•?\s*benef[íi]cio\s*:\s*/i,'');
      while(/^(?:\([^)]*\)\s*|\[[^\]]*\]\s*)+:?\s*/i.test(line)){
        line=line.replace(/^(?:\([^)]*\)\s*|\[[^\]]*\]\s*)+:?\s*/i,'').trim();
      }
      const dashIdx=line.lastIndexOf(' — ');
      if(dashIdx>=0&&(line.includes('Um artesão')||line.includes('Um mercenário')||line.includes('Um auxiliar')||line.includes('Um combatente')||line.includes('Um veterano'))){
        line=line.slice(0,dashIdx);
      }
      line=line.replace(/\[\s*|\s*\]/g,'');
      line=line.trim();
      if(line)contentLines.push(line);
    }
    return [title,...contentLines,expiration].join('\n');
  });
  return cleanedBlocks.join('\n\n').trim();
}

function updateOrAddMercenaryInNotes(notes,contract){
  const baseName=cleanMercenaryName(contract);
  const title='• Mercenário: '+baseName;
  const newEntry=formatMercenaryNote(contract);
  if(!notes)return newEntry;
  const blocks=notes.split(/\n\n+/);
  let found=false;
  const updatedBlocks=blocks.map(block=>{
    if(block.includes(title)||(block.startsWith('• Mercenário:')&&block.includes(baseName))||(block.startsWith('[Mercenário:')&&block.includes(baseName))){
      found=true;
      return newEntry;
    }
    return block;
  });
  if(!found)updatedBlocks.push(newEntry);
  return updatedBlocks.join('\n\n').trim();
}

function addMercenaryToSheetNotes(contract){
  if(!contract||contract.category!=='mercenario')return;
  state.sheetNotes=state.sheetNotes||{};
  let notes=state.sheetNotes.notes||'';
  notes=sanitizeMercenaryNoteText(notes);
  notes=updateOrAddMercenaryInNotes(notes,contract);
  state.sheetNotes.notes=notes;
  const textarea=document.querySelector?.('[data-sheet-note="notes"]');
  if(textarea)textarea.value=state.sheetNotes.notes;
}

function removeMercenaryFromSheetNotes(contractIdOrContract){
  state.sheetNotes=state.sheetNotes||{};
  let notes=state.sheetNotes.notes||'';
  if(!notes)return;
  const contract=typeof contractIdOrContract==='object'?contractIdOrContract:(state.tavernContracts||[]).find(c=>c.contractId===contractIdOrContract);
  const baseName=contract?cleanMercenaryName(contract):'';
  const title=baseName?('• Mercenário: '+baseName):null;
  const idTag=typeof contractIdOrContract==='string'?('(Contrato: '+contractIdOrContract+')'):null;
  const blocks=notes.split(/\n\n+/);
  const filtered=blocks.filter(b=>{
    if(title&&b.includes(title))return false;
    if(baseName&&b.startsWith('• Mercenário:')&&b.includes(baseName))return false;
    if(idTag&&b.includes(idTag))return false;
    return true;
  });
  state.sheetNotes.notes=filtered.join('\n\n').trim();
  const textarea=document.querySelector?.('[data-sheet-note="notes"]');
  if(textarea)textarea.value=state.sheetNotes.notes;
}

function clearAllMercenariesFromSheetNotes(){
  state.sheetNotes=state.sheetNotes||{};
  let notes=state.sheetNotes.notes||'';
  if(!notes)return;
  const blocks=notes.split(/\n\n+/);
  const filtered=blocks.filter(b=>!b.includes('(Contrato: ct-')&&!b.startsWith('[Mercenário:')&&!b.startsWith('• Mercenário:'));
  state.sheetNotes.notes=filtered.join('\n\n').trim();
  const textarea=document.querySelector?.('[data-sheet-note="notes"]');
  if(textarea)textarea.value=state.sheetNotes.notes;
}

function syncTavernContractsToSheetNotes(){
  state.sheetNotes=state.sheetNotes||{};
  let notes=state.sheetNotes.notes||'';
  notes=sanitizeMercenaryNoteText(notes);
  if(Array.isArray(state.tavernContracts)){
    state.tavernContracts.forEach(contract=>{
      if(contract&&contract.category==='mercenario'){
        notes=updateOrAddMercenaryInNotes(notes,contract);
      }
    });
  }
  state.sheetNotes.notes=notes.trim();
  const textarea=document.querySelector?.('[data-sheet-note="notes"]');
  if(textarea&&textarea.value!==state.sheetNotes.notes){
    textarea.value=state.sheetNotes.notes;
  }
}

if(!state.isLevelingUp&&!state.editingCharacter&&((Array.isArray(state.completed)&&state.completed.includes(10))||state.finished||state.step>=10)){
  if(state.finished||(Array.isArray(state.completed)&&state.completed.includes(10))){
    state.step=10;
    state.finished=true;
    state.sheetView=state.sheetView||'sheet';
  }
}

const SHEET_DESTINATION_PAGES={
  shop:['loja'],
  tavern:['taverna'],
  grimoire:['grimorio'],
  workshop:['loja','oficina'],
  'workshop-hub':['loja','oficina'],
  'workshop-preview':['loja','oficina'],
  reward:['resgatar-recompensas']
};
function preloadSheetDestination(action){
  const pages=SHEET_DESTINATION_PAGES[action]||[];
  if(typeof window.Forja?.preloadPage!=='function')return;
  pages.forEach(page=>window.Forja.preloadPage(page).catch(()=>{}));
}
function preloadSheetDestinations(){
  if(!state.finished)return;
  ['loja','taverna','oficina','resgatar-recompensas','grimorio','distincoes'].forEach(page=>window.Forja?.preloadPage?.(page).catch(()=>{}));
}
document.addEventListener('pointerover',event=>{
  const action=event.target.closest?.('[data-sheet-action]')?.dataset.sheetAction;
  if(action)preloadSheetDestination(action);
  if(event.target.closest?.('[data-sheet-shop-reward]'))preloadSheetDestination('reward');
},{capture:true,passive:true});
window.addEventListener('forja-ready',()=>window.setTimeout(preloadSheetDestinations,0),{once:true});
if(document.documentElement.dataset.forjaReady==='true')window.setTimeout(preloadSheetDestinations,0);

document.addEventListener('click',event=>{
 if(event.target.closest?.('[data-sheet-shop-cancel]')){
   if(state.sheetView==='workshop'){
     state.sheetView=state.finished?'sheet':'';
     if(!state.finished&&state.previousCreationStep)state.step=state.previousCreationStep;
     persistNow();
     renderStage();
   }
   else if(document.getElementById('characterArsenal'))sendArsenal('cancel-cart');
   else{state.sheetView=state.finished?'sheet':'';if(!state.finished&&state.previousCreationStep)state.step=state.previousCreationStep;persistNow();renderStage()}
 }
 if(event.target.closest?.('[data-sheet-shop-checkout]')){
   const footers = document.querySelectorAll('#arsenalViewContainer .sheet-shop-footer, .forja-autohide-footer');
   footers.forEach(f => { f.style.display = 'none'; f.hidden = true; });
   sendArsenal('checkout-request');
 }
 if(event.target.closest?.('[data-sheet-shop-reward]')){ window.location.href = 'resgatar-recompensas.html'; }
},true);

// Denominations retain value across purchases, while conversion reduces coin count.
function characterCoins(){const total=Math.round(remainingFunds()*10),to=Math.min(Math.max(0,Math.floor(financesState().goldCoins||0)),Math.floor(total/1000)),rest=total-to*1000;return{tc:rest%10,ts:Math.floor(rest/10),to}}
function coinSpaces(){const coins=characterCoins();return Math.floor((coins.tc+coins.ts+coins.to)/500)*0.5}
const sheetLoadBeforeCoins=sheetInventoryLoad;
sheetInventoryLoad=function(){
 const base=sheetLoadBeforeCoins();
 const cSpaces=typeof coinSpaces==='function'?coinSpaces():0;
 const used=Math.round((base.used+cSpaces)*10)/10;
 return {...base,used,itemSpaces:base.used,coinSpaces:cSpaces};
};
document.addEventListener('change',event=>{
  if(event.target.dataset.conditionSlot===undefined)return;
  state.sheetNotes??={};
  state.sheetNotes.conditionSlots??=Array(4).fill('');
  state.sheetNotes.conditionSlots[Number(event.target.dataset.conditionSlot)]=event.target.value;
  persistNow();
  if(state.finished)saveFinishedCharacter();
  renderStage();
});

function canCastArcane(){
 const classIds=new Set([state.identity.classId,...(state.progression||[]).map(row=>row.classId)]);
 if([...classIds].some(id=>classById(id)?.habilidades?.some(h=>h.efeitos?.some(e=>e.tipo==='conjuracao'&&e.magiaTipo==='arcana'))))return true;
 return Object.entries(state.spells?.selections||{}).some(([source,ids])=>!source.startsWith('power:presente')&&ids.some(id=>spellById(id)?.type==='arcana'));
}
const originBenefitsBeforeWynlla=originBenefitOptions;
originBenefitOptions=function(origin){const options=originBenefitsBeforeWynlla(origin);if(isWynllaOrigin(origin)&&canCastArcane()){const power=powerById('presente_de_wynlla');if(power&&!options.some(opt=>opt.id==='power:presente_de_wynlla')){options.push({id:'power:presente_de_wynlla',type:'power',name:power.nome,description:power.descricao})}}return options};
const originBenefitBlockedBeforeWynlla=originBenefitBlocked;
originBenefitBlocked=function(option){if(option?.id==='power:presente_de_wynlla'){if(state.origin?.mode==='dual'&&state.origin?.regional){const reg=selectedRegionalOrigin();if(reg&&!isWynllaRegional(reg))return true}return false}return originBenefitBlockedBeforeWynlla(option)};
const originBenefitDescriptionBeforeWynlla=originBenefitDescription;
originBenefitDescription=function(option,blocked=false){if(option?.id==='power:presente_de_wynlla'&&blocked)return 'O poder Presente de Wynlla só é permitido para nativos de Wynlla (Recruta Arcano ou Plebeu Arcano).';return originBenefitDescriptionBeforeWynlla(option,blocked)};
function originChoicePowerList(){
  const choices = [];
  const origin=selectedStandardOrigin();
  if(origin){
    originBenefitOptions(origin).filter(b=>state.origin.benefits.includes(b.id)&&b.type==='power'&&/escolha/i.test(b.name)).forEach(b=>choices.push({
      id:b.id,
      name:b.name,
      category:/tormenta/i.test(b.name)?'tormenta':'combate'
    }));
  }
  if (state.origin?.mode === 'dual' || state.origin?.regional) {
    const reg = typeof selectedRegionalOrigin === 'function' ? selectedRegionalOrigin() : null;
    const regSlug = slug(reg?.nome || state.origin?.regional || '');
    if (regSlug === 'estandarte_vivo') {
      choices.push({
        id: 'regional:estandarte_vivo_poder',
        name: 'Poder de Combate ou Tormenta',
        category: 'combate_ou_tormenta'
      });
    }
  }
  return choices;
}
function originChoiceSlotsCount(){return originChoicePowerList().length}
const raceGeneralPowerSlots=generalPowerSlots;
generalPowerSlots=function(){return raceGeneralPowerSlots()+originChoiceSlotsCount()};
function originPowerSlotRequirement(index=Number(state.powers.activeSlot)||0){
 const base=raceGeneralPowerSlots(),choices=originChoicePowerList();
 if(index>=base&&index<base+choices.length)return choices[index-base];
 return null;
}
function originCombatSlot(index=Number(state.powers.activeSlot)||0){
 const req=originPowerSlotRequirement(index);
 return req?.category==='combate'||req?.category==='combate_ou_tormenta';
}
const originPowersBeforeBridge=originPowerNames;
originPowerNames=function(){
 const origin=selectedStandardOrigin();
 const base=raceGeneralPowerSlots(),choices=originChoicePowerList();
 const names = [];
 if(origin){
  originBenefitOptions(origin).filter(x=>state.origin.benefits.includes(x.id)&&x.type!=='skill').forEach(x=>{
   const choiceIndex=choices.findIndex(c=>c.id===x.id);
   if(choiceIndex>=0){
    const chosenId=state.powers.general[base+choiceIndex];
    const power=powerById(chosenId);
    if(power){ names.push(power.nome); return; }
   }
   names.push(x.name);
  });
 }
 const estandarteIndex = choices.findIndex(c=>c.id==='regional:estandarte_vivo_poder');
 if(estandarteIndex>=0){
  const chosenId=state.powers.general[base+estandarteIndex];
  const power=powerById(chosenId);
  names.push(power ? power.nome : 'Poder de Combate ou Tormenta');
 }
 return names;
};
const eligibilityBeforeWynlla=generalPowerEligibility;
generalPowerEligibility=function(power){const verdict=eligibilityBeforeWynlla(power);if(power?.id==='presente_de_wynlla'&&!canCastArcane())return{ok:false,reasons:[...verdict.reasons,'Requer lançar magia arcana.']};return verdict};
const browserBeforeOriginCombat=renderGeneralPowerBrowser;
renderGeneralPowerBrowser=function(slots){
 const req=originPowerSlotRequirement();
 if(!req)return browserBeforeOriginCombat(slots);
 if(req.category==='combate_ou_tormenta'){
  if(!['combate','tormenta'].includes(state.powers.categoryFilter)){
   state.powers.categoryFilter='combate';
  }
  return browserBeforeOriginCombat(slots)+'<p class="help">Escolha da origem: poderes de combate ou Tormenta.</p>';
 }
 state.powers.categoryFilter=req.category;
 const label=req.category==='combate'?'combate':'Tormenta';
 return browserBeforeOriginCombat(slots).replace(/<button[^>]*data-action="power-filter-category"[^>]*>[\s\S]*?<\/button>/g,'')+'<p class="help">Escolha da origem: somente poderes de '+label+'.</p>';
};
document.addEventListener('click',event=>{
 const button=event.target.closest?.('[data-action="power-select"]');
 if(state.step===6&&button){
  const req=originPowerSlotRequirement();
  if(req){
   const power=powerById(button.dataset.powerId);
   const ok = req.category==='combate_ou_tormenta'
    ? ['combate','tormenta'].includes(power?.categoria)
    : power?.categoria===req.category;
   if(!ok){
    event.preventDefault();
    event.stopImmediatePropagation();
    toast('Esta escolha da origem exige um poder de '+(req.category==='combate_ou_tormenta'?'Combate ou Tormenta':(req.category==='combate'?'combate':'Tormenta'))+'.');
   }
  }
 }
},true);

function sheetArmorPenalty(){
  const armor=typeof equippedArmorItem==='function'?equippedArmorItem():characterInventory().map(entry=>DATA.pdfItems.find(item=>item.id===entry.itemId)).find(item=>item?.tipo==='armadura');
  const shield=typeof equippedShieldItem==='function'?equippedShieldItem():characterInventory().map(entry=>DATA.pdfItems.find(item=>item.id===entry.itemId)).find(item=>item?.tipo==='escudo');
  return Number(armor?.armadura?.penalidade||0)+Number(shield?.escudo?.penalidade||0)-(sheetConditions().includes('Sobrecarregado')?5:0);
}
const skillTotalBeforeLoad=calculatedSkillTotal;
calculatedSkillTotal=function(id){return skillTotalBeforeLoad(id)+(['acrobacia','furtividade','ladinagem'].includes(id)?sheetArmorPenalty():0)};

// ── Gerador de Personagens Aleatórios para Forja T20 ─────────────────────────
const FIRST_NAMES = [
  'Aelith', 'Alden', 'Boran', 'Cassian', 'Darian', 'Elowen', 'Faelar', 'Gideon',
  'Haleth', 'Iria', 'Joran', 'Kaelen', 'Lorien', 'Miriel', 'Niamh', 'Orin',
  'Roderick', 'Sariel', 'Tharok', 'Valeria', 'Vael', 'Zarek', 'Kael', 'Rurik',
  'Selene', 'Theron', 'Liriel', 'Garrick', 'Bran', 'Yvaine', 'Adrius', 'Belen',
  'Cael', 'Dravor', 'Elion', 'Galdor', 'Harlan', 'Kaelan', 'Marek', 'Raven',
  'Sylas', 'Taron', 'Valen', 'Dorn', 'Keth', 'Thorgar', 'Morwen', 'Astra'
];

const SURNAMES = [
    'Lança-Veloz', 'Punho-Firme', 'Passo-Leve', 'Coração-de-Aço', 'Vento-Frio',
    'Chama-Viva', 'Guarda-da-Noite', 'Presa-de-Lobo', 'Olho-de-Falcão', 'de Valkaria',
    'de Ahlen', 'de Yuden', 'de Deheon', 'de Sambúrdia', 'de Bielefeld',
    'de Zakharov', 'de Wynlla', 'de Portsmouth', 'de Smokestone', 'de Tyrondir'
  ];

  function pickRandom(list){
    if(!list||!list.length)return null;
    return list[Math.floor(Math.random()*list.length)];
  }

  function pickRandomUnique(list, count){
    const pool = [...list], result = [];
    while(pool.length && result.length < count){
      const index = Math.floor(Math.random()*pool.length);
      result.push(pool.splice(index,1)[0]);
    }
    return result;
  }

  /**
   * Spreads válidos na compra de atributos de Tormenta20 que somam exatamente 10 pontos.
   * Tabela de custos: -1: -1, 0: 0, 1: 1, 2: 2, 3: 4, 4: 7.
   * Permite de 0 a 3 atributos em -1 (devolvendo pontos para alocar nos atributos principais).
   * O maior atributo do spread é SEMPRE 4 ou 3 (foco no atributo-chave).
   */
  const BALANCED_SPREADS_10_POINTS = [
    // 3 atributos em -1 (13 pontos distribuídos)
    [4, 3, 2, -1, -1, -1],
    // 2 atributos em -1 (12 pontos distribuídos)
    [4, 3, 1, 0, -1, -1],
    [4, 2, 2, 1, -1, -1],
    [3, 3, 3, 0, -1, -1],
    [3, 3, 2, 2, -1, -1],
    // 1 atributo em -1 (11 pontos distribuídos)
    [4, 3, 0, 0, 0, -1],
    [4, 2, 2, 0, 0, -1],
    [4, 2, 1, 1, 0, -1],
    [4, 1, 1, 1, 1, -1],
    [3, 3, 2, 1, 0, -1],
    [3, 3, 1, 1, 1, -1],
    [3, 2, 2, 2, 1, -1],
    // 0 atributos em -1 (10 pontos distribuídos)
    [4, 2, 1, 0, 0, 0],
    [4, 1, 1, 1, 0, 0],
    [3, 3, 2, 0, 0, 0],
    [3, 3, 1, 1, 0, 0],
    [3, 2, 2, 2, 0, 0],
    [3, 2, 2, 1, 1, 0],
    [3, 2, 1, 1, 1, 1]
  ];

// A Taverna independente retoma o mesmo fluxo integrado, sem efetuar a compra.
(()=>{
  const url=new URL(window.location.href);
  const requested=url.searchParams.get('comprarPocao');
  if(requested===null)return;
  const circle=Number(requested),prices={1:30,2:270,3:1080,4:3000,5:6750};
  if(!Number.isInteger(circle)||!Object.hasOwn(prices,circle))return;
  state.tavernPotionPurchase={circle,price:prices[circle]};
  spellState().grimoireSource='tavern-potion';
  spellState().view='available';
  state.previousSheetView='tavern';
  state.sheetView='grimoire';
  persistNavigationNow();
  url.searchParams.delete('comprarPocao');
  url.searchParams.set('view','grimoire');
  history.replaceState(null,'',url);
})();
