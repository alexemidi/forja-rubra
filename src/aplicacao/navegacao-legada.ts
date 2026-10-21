/* Ordem explícita: criação → inventário → ficha → apresentação de poderes.
 * Adaptadores mantêm os contratos das telas durante a migração. */
function renderCreationStage(){
  const controls=document.getElementById('forjaCreationControlsTemplate');
  if(controls&&!document.getElementById('phaseNav')){
    const fragment=controls.content.cloneNode(true);
    document.querySelector('.shell').prepend(fragment.querySelector('#phaseNav'));
    document.querySelector('.workspace').append(fragment.querySelector('.stage-footer'));
  }
  creationNavigationDirection=typeof creationNavigationDirection==='number'?creationNavigationDirection:1;
  while(shouldSkipPhase(state.step)){if(state.step!==10&&!state.completed.includes(state.step))state.completed.push(state.step);state.step+=creationNavigationDirection;if(state.step>10||state.step<1)break;}
  const safeStep=Math.min(10,Math.max(1,Number(state.step)||1));
  state.step=safeStep;
  const [title,description]=PHASES[safeStep-1]||['Etapa',''];
  const visibleSteps=PHASES.map((p,i)=>i+1).filter(s=>!(typeof shouldSkipPhase==='function'&&shouldSkipPhase(s)));
  const currentVisualIndex=visibleSteps.indexOf(safeStep);
  const currentVisualNumber=currentVisualIndex>=0?currentVisualIndex+1:safeStep;
  const totalVisiblePhases=visibleSteps.length;
  const isLastVisible=safeStep===visibleSteps[visibleSteps.length-1];
  const renders=[renderIdentityClass,renderAttributesRace,renderOrigins,renderSkillsSplit,renderDeity,renderPowers,renderSpells,()=>renderDeferred('items'),typeof renderPartnerStage==='function'?renderPartnerStage:()=>'<div class="panel">Parceiros</div>',typeof renderProgressionPhase==='function'?renderProgressionPhase:renderSummary];
  document.getElementById('stageKicker').textContent='Fase '+currentVisualNumber+' de '+totalVisiblePhases;document.getElementById('stageTitle').textContent=title;document.getElementById('stageDescription').textContent=description;document.getElementById('stageRoot').innerHTML=renders[safeStep-1]();document.getElementById('previousButton').disabled=safeStep===1;document.getElementById('nextButton').textContent=isLastVisible?'Finalizar ficha':'Avançar →';document.getElementById('footerMessage').textContent=validationMessage(safeStep,true);document.getElementById('footerMessage').hidden=true;const expBtn=document.getElementById('exportButton');if(expBtn)expBtn.hidden=true;document.getElementById('redoInitialItemsButton').hidden=true;const redoSpell=document.getElementById('redoSpellChoicesButton');if(redoSpell)redoSpell.hidden=safeStep!==7 || Boolean(state.isLevelingUp);document.getElementById('reviewProgressionButton').hidden=true;document.body?.classList.toggle('spell-stage',safeStep===7);document.getElementById('phaseNav').hidden=false;const footer=document.querySelector('.stage-footer');if(footer)footer.hidden=false;renderNav();applyCompletedChoiceAppearance();if(safeStep===5)bindDeityPowerSearch();if(safeStep===6)bindPowerSearch();if(safeStep===7){mountGrimoire();updateSpellOptionsToggle()}if(typeof syncTeurgistFooterButton==='function')syncTeurgistFooterButton();if(safeStep===10){syncSamuraiKatanaToBackpack();syncProgressionFooter()}if(typeof syncNextButtonState==='function')syncNextButtonState();persistNow();
}

function renderInventoryStage(){
  const saved=typeof arsenalState==='function'?arsenalState():{};
  if(saved.complete){
    renderCreationStage();
    syncInitialItemFooter();
    return;
  }
  const frame=document.getElementById('characterArsenal');
  const reuse=state.step===8&&arsenalMountedOwner===state&&frame?.isConnected;
  if(!reuse)renderCreationStage();
  if(state.step!==8){arsenalMountedOwner=null;arsenalShopOpen=false;arsenalContextKey=''}
  document.body?.classList.toggle('arsenal-stage',state.step===8);
  if(state.step!==8)return;
  syncInitialItemFooter();
  const context=arsenalInitialData();
  if(!context.choice&&context.mode==='initial')context.mode='backpack';
  const key=JSON.stringify([context.mode,context.choice,context.candidate,context.strength,context.characterName,context.funds]);
  if(reuse){if(key!==arsenalContextKey)sendArsenal('context',{context});arsenalContextKey=key;return}
  arsenalSession++;context.session=arsenalSession;
  const target=document.getElementById('characterArsenal');
  arsenalMountedOwner=state;arsenalContextKey=key;
  Forja.mount(target,'loja.html',context);
}

function renderSheetStage(navigationOnly=false){
  try{
    if(!state.editingCharacter && !state.isLevelingUp && (state.finished||(Array.isArray(state.completed)&&state.completed.includes(10)))){
      state.finished=true;
      state.step=10;
      state.sheetView=state.sheetView||'sheet';
    }
    if(!state.finished){
      if(state.sheetView==='grimoire'||state.sheetView==='shop'||state.sheetView==='tavern'||state.sheetView==='workshop'){
        document.body?.classList.remove('character-sheet-ready');
        document.body?.classList.toggle('spell-stage',state.sheetView==='grimoire');
        document.body?.classList.toggle('arsenal-stage',state.sheetView==='shop'||state.sheetView==='workshop');
        document.body?.classList.toggle('tavern-stage',state.sheetView==='tavern');
        const pNav=document.getElementById('phaseNav');if(pNav)pNav.hidden=true;
        const footer=document.querySelector('.stage-footer');if(footer)footer.hidden=true;
        let kickerText = 'Consulta Geral';
        let titleText = 'Loja';
        if(state.sheetView==='grimoire'){
          kickerText = spellState().view==='learned'?'Magias Conhecidas':'Consulta Geral';
          titleText = spellState().view==='learned'?'Grimório do Herói':'Grimório Geral';
        } else if(state.sheetView==='tavern'){
          kickerText = 'Estalagem & Serviços';
          titleText = 'Taverna de Arton';
        } else if(state.sheetView==='workshop'){
          const secKey = state.workshopSection || 'artesao';
          // @ts-ignore
          const rules = typeof RegrasManufatura !== 'undefined' ? RegrasManufatura : null;
          const sec = rules?.secoesOficina?.[secKey] || { title: 'Oficina de Manufatura', icon: '' };
          kickerText = state.workshopReadOnly ? 'Consulta Geral de Ofício' : 'Manufatura de Ofício (T20)';
          titleText = `${sec.title}`;
        }
        document.getElementById('stageKicker').textContent=kickerText;
        document.getElementById('stageTitle').textContent=titleText;
        document.getElementById('stageDescription').textContent='';
        const rBtn=document.getElementById('resetButton');if(rBtn)rBtn.hidden=true;
        const eBtn=document.getElementById('exportButton');if(eBtn)eBtn.hidden=true;
        switchFinalSheetView(state.sheetView,navigationOnly);
        syncSheetHeadingMenu();
        return;
      }
      document.body?.classList.remove('character-sheet-ready');
      const pNav=document.getElementById('phaseNav');if(pNav)pNav.hidden=false;
      const footer=document.querySelector('.stage-footer');if(footer)footer.hidden=false;
      const resetBtn=document.getElementById('resetButton');
      if(resetBtn){
        const isBlank = state.step === 1 && !state.isEditingFinishedSheet && (!state.identity?.characterName || !state.identity.characterName.trim()) && (!state.completed || state.completed.length === 0);
        resetBtn.hidden = isBlank;
      }
      const exportBtn=document.getElementById('exportButton');if(exportBtn)exportBtn.hidden=true;
      syncSheetHeadingMenu();
      return renderInventoryStage();
    }
    state.step=10;
    state.sheetView=state.sheetView||'sheet';
    document.body?.classList.add('character-sheet-ready');
    document.body?.classList.toggle('spell-stage',state.sheetView==='grimoire');
    document.body?.classList.toggle('arsenal-stage',state.sheetView==='shop'||state.sheetView==='workshop');
    document.body?.classList.toggle('tavern-stage',state.sheetView==='tavern');
    const pNav=document.getElementById('phaseNav');if(pNav)pNav.hidden=true;
    const footer=document.querySelector('.stage-footer');if(footer)footer.hidden=true;
    let kickerText = 'Herói Forjado';
    let titleText = state.identity.characterName||'Personagem';
    if(state.sheetView==='grimoire'){
      kickerText = spellState().view==='learned'?'Magias Conhecidas':'Consulta Geral';
      titleText = spellState().view==='learned'?'Grimório do Herói':'Grimório Geral';
    } else if(state.sheetView==='tavern'){
      kickerText = 'Estalagem & Serviços';
      titleText = 'Taverna de Arton';
    } else if(state.sheetView==='workshop'){
      const secKey = state.workshopSection || 'artesao';
      // @ts-ignore
      const rules = typeof RegrasManufatura !== 'undefined' ? RegrasManufatura : null;
      const sec = rules?.secoesOficina?.[secKey] || { title: 'Oficina de Manufatura', icon: '' };
      kickerText = state.workshopReadOnly ? 'Consulta Geral de Ofício' : 'Manufatura de Ofício (T20)';
      titleText = `${sec.title}`;
    }
    document.getElementById('stageKicker').textContent=kickerText;
    document.getElementById('stageTitle').textContent=titleText;
    document.getElementById('stageDescription').textContent='';
    const rBtnFinal=document.getElementById('resetButton');if(rBtnFinal)rBtnFinal.hidden=true;
    const expBtn=document.getElementById('exportButton');
    if(expBtn)expBtn.hidden=!(state.finished||state.step===9);
    syncSheetHeadingMenu();
    if(state.sheetView==='sheet'){
      syncTavernContractsToSheetNotes();
    }
    switchFinalSheetView(state.sheetView,navigationOnly);
    syncSheetHeadingMenu();
  }catch(err){
    console.error('Falha na renderização:',err);
    if(!state.finished){
      const root=document.getElementById('stageRoot');
      if(root){
        root.innerHTML='<div class="card error" style="padding:16px;margin:16px;background:rgba(220,38,38,0.1);border:1px solid #ef4444;border-radius:8px;"><h4>Erro na etapa de criação</h4><p>'+esc(err?.message||'Ocorreu uma falha ao renderizar a etapa atual.')+'</p></div>';
      }
      return;
    }
    const pNav=document.getElementById('phaseNav');if(pNav)pNav.hidden=true;
    const footer=document.querySelector('.stage-footer');if(footer)footer.hidden=true;
    document.body?.classList.add('character-sheet-ready');
    syncSheetHeadingMenu();
    const root=document.getElementById('stageRoot');
    if(root&&(!root.innerHTML||root.innerHTML.trim()==='')){
      try{
        root.innerHTML=renderCharacterDetails();
      }catch(innerErr){
        root.innerHTML='<section class="panel"><header class="panel-header"><h3 class="panel-title">Ficha Carregada</h3></header><div class="panel-body"><p class="help">A ficha foi carregada com sucesso. Utilize o menu no topo para navegar.</p></div></section>';
      }
    }
  }
}

function renderStage({navigationOnly=false}={}){
  if(!Forja.aplicacaoInicializada)return;
  return ForjaCalculo.executar(()=>{
  const heroTitle=document.getElementById('heroSheetTitle');
  if(heroTitle)heroTitle.textContent=state.identity?.characterName||'Herói Forjado';
  if(state.step===6&&state.powers.activeSlot===undefined)state.powers.activeSlot=pendingGeneralPowerSlot()??0;
  renderSheetStage(navigationOnly);
  syncSequentialPowerFooter();
  if(state.step===6||state.step===10||state.step===9)checkPowerPhaseNotice();
  });
}
