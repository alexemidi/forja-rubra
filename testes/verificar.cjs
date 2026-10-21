const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const {JSDOM,VirtualConsole}=require('jsdom'),acorn=require('acorn');
const root=path.resolve(__dirname,'..'),dist=require('../ferramentas/lib/saida.cjs').diretorioSaida(root),manifest=JSON.parse(fs.readFileSync(path.join(dist,'paginas.json')));
const results=[];
function record(name,value){results.push({teste:name,...value});console.log(name,JSON.stringify(value))}
function setup(w){w.HTMLCanvasElement.prototype.getContext=()=>null;w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});w.scrollTo=w.scrollBy=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.requestAnimationFrame=fn=>w.setTimeout(fn,0);w.structuredClone=structuredClone;w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.confirm=()=>false;w.alert=()=>{};w.fetch=(url,opts)=>fetch(new URL(url,w.location.href),opts);w.URL.createObjectURL=()=> 'blob:teste';w.URL.revokeObjectURL=()=>{}}
async function open(page,port){const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/navigation|scroll|CSS|Could not load.*(?:fonts|script: "https:)/i.test(e.message))errors.push(e.message)});const start=performance.now();const dom=await JSDOM.fromURL(`http://127.0.0.1:${port}/${page}.html`,{runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,virtualConsole:vc,beforeParse:setup});
  for(let i=0;i<600&&!dom.window.document.documentElement.dataset.forjaReady;i++)await new Promise(r=>setTimeout(r,25));
  assert.equal(dom.window.document.documentElement.dataset.forjaReady,'true',page+' não inicializou: '+errors.join('\n'));assert.deepEqual(errors,[],page);return {dom,ms:performance.now()-start,errors};
}
(async()=>{
  for(const [page,entry] of Object.entries(manifest)){
    for(const script of entry.scripts){const code=fs.readFileSync(path.join(dist,script),'utf8');acorn.parse(code,{ecmaVersion:'latest'});assert(!code.includes('DATA.pdfTemplateBase64'));assert(!code.includes('srcdoc=DATA.'))}
    for(const data of Object.values(entry.data))JSON.parse(fs.readFileSync(path.join(dist,data),'utf8'));
    assert(!/<(?:script|style)\b[^>]*>\s*[^<\s]/.test(fs.readFileSync(path.join(dist,page+'.html'),'utf8')),'Código inline em '+page);
  }record('Sintaxe, JSON e separação de páginas',{ok:true,paginas:Object.keys(manifest).length});
  let port=0;const server=spawn(process.execPath,[path.join(root,'ferramentas/servidor.cjs'),'0'],{stdio:'pipe'});
  try{
    await new Promise((resolve,reject)=>{server.stdout.on('data',chunk=>{const match=chunk.toString().match(/:(\d+)\//);if(match){port=Number(match[1]);resolve()}});server.once('error',reject);server.once('exit',code=>reject(Error('Servidor saiu '+code)))});
    for(const page of ['index','loja','grimorio','taverna','criador']){
      const {dom,ms}=await open(page,port);try{
        if(page==='index')assert(dom.window.document.querySelector('a[href="loja.html"]')&&dom.window.document.querySelector('a[href="grimorio.html"]'));
        if(page==='loja'){
          const w=dom.window;
          const testResults=w.eval(`(()=>{
            arsenalInitialState = {
              mode: 'initial',
              choice: { id: 'armor', title: 'Escolha uma armadura', type: 'armadura', names: ['Armadura de Couro', 'Couro Batido', 'Gibão de Peles'] }
            };
            const leather = itemById.get('armadura_de_couro');
            const normalCardHtml = itemCard(leather);
            const hasUpgradeInNormal = normalCardHtml.includes('upgrade-purchase-button');
            const shortSword = itemById.get('espada_curta');
            const longSword = itemById.get('espada_longa');
            const normalShortSwordHtml = itemCard(shortSword);
            const normalLongSwordHtml = itemCard(longSword);

            arsenalInitialState = {
              mode: 'initial',
              choice: { id: 'class-nobre-espolio', title: 'Espólio · Escolha um item de até T$ 2.000', source: 'class', isBudgetGrant: true, maxBudget: 2000 }
            };
            if (typeof applyArsenalContext === 'function') applyArsenalContext(arsenalInitialState);
            const maxImpsBudget = getMaxAllowedImprovements();
            const budgetCardHtml = itemCard(leather);
            const budgetShortSwordHtml = itemCard(shortSword);
            const budgetLongSwordHtml = itemCard(longSword);
            const hasUpgradeInBudget = budgetCardHtml.includes('upgrade-purchase-button');
            const hasUpgradeInBudgetShortSword = budgetShortSwordHtml.includes('upgrade-purchase-button');
            const hasUpgradeInBudgetLongSword = budgetLongSwordHtml.includes('upgrade-purchase-button');

            openPurchaseUpgrade('armadura_de_couro', 'improvements');
            const modal = document.getElementById('purchaseUpgradeModal');
            const hasBudgetNote = Boolean(modal?.querySelector('.budget-modal-note'));
            const hasConfirmBtn = Boolean(modal?.querySelector('[data-action="select-budget-item"]'));
            const hasModalActions = Boolean(modal?.querySelector('.modal-actions'));
            if (modal) closeModal(modal);

            return {
              hasUpgradeInNormal,
              hasUpgradeInNormalShort: normalShortSwordHtml.includes('upgrade-purchase-button'),
              hasUpgradeInNormalLong: normalLongSwordHtml.includes('upgrade-purchase-button'),
              maxImpsBudget,
              hasUpgradeInBudget,
              hasUpgradeInBudgetShortSword,
              hasUpgradeInBudgetLongSword,
              hasBudgetNote,
              hasConfirmBtn,
              hasModalActions
            };
          })()`);
          assert.equal(testResults.hasUpgradeInNormal, false, 'Card em escolha comum de armadura NÃO deve ter botão de melhoria');
          assert.equal(testResults.hasUpgradeInNormalShort, false, 'Card em escolha comum de espada curta NÃO deve ter botão de melhoria');
          assert.equal(testResults.hasUpgradeInNormalLong, false, 'Card em escolha comum de espada longa NÃO deve ter botão de melhoria');
          assert.equal(testResults.maxImpsBudget, 4, 'Escolha com orçamento deve permitir até 4 melhorias');
          assert.equal(testResults.hasUpgradeInBudget, true, 'Card de armadura em escolha com orçamento DEVE ter botão de melhoria');
          assert.equal(testResults.hasUpgradeInBudgetShortSword, true, 'Espada Curta em escolha com orçamento DEVE ter botão de melhoria');
          assert.equal(testResults.hasUpgradeInBudgetLongSword, true, 'Espada Longa em escolha com orçamento DEVE ter botão de melhoria');
          assert.equal(testResults.hasBudgetNote, false, 'Modal de melhorias NÃO deve exibir nota azul com orçamento');
          assert.equal(testResults.hasConfirmBtn, false, 'Modal de melhorias em escolha inicial NÃO deve ter botões redundantes');
          assert.equal(testResults.hasModalActions, false, 'Modal de melhorias em escolha inicial NÃO deve ter modal-actions no rodapé');
          record('Melhorias na Fase 8: bloqueadas em escolhas comuns e habilitadas com orçamento',{ok:true});

          const shopFundsCheck = await w.eval(`(async ()=>{
            if (typeof promptInsufficientFundsModal === 'function') {
              const promise = promptInsufficientFundsModal(100, 350);
              const m = document.getElementById('insufficientFundsModal');
              const text = m ? m.textContent : '';
              const backBtn = m ? m.querySelector('[data-funds-action="back"]') : null;
              const rewardBtn = m ? m.querySelector('[data-funds-action="reward"]') : null;
              if (backBtn) backBtn.click();
              const decision = await promise;
              return {
                hasModal: Boolean(m),
                hasBackBtn: Boolean(backBtn),
                hasRewardBtn: Boolean(rewardBtn),
                decision,
                hasDeficit: text.includes('250')
              };
            }
            return { hasModal: false };
          })()`);
          assert.equal(shopFundsCheck.hasModal, true, 'Modal de saldo insuficiente deve existir');
          assert.equal(shopFundsCheck.hasBackBtn, true, 'Modal deve conter botão Voltar');
          assert.equal(shopFundsCheck.hasRewardBtn, true, 'Modal deve conter botão Resgatar como Recompensa');
          assert.equal(shopFundsCheck.hasDeficit, true, 'Modal deve exibir o valor faltante correto');
          assert.equal(shopFundsCheck.decision, 'back', 'Clicar em voltar deve resolver com "back"');
          record('Loja: modal de saldo insuficiente com exibição de déficit e botões Voltar/Recompensa aprovados', { ok: true });
        }
        if(page==='criador'){
          const w=dom.window;assert.equal(w.PDFLib,undefined,'PDF carregado antes de exportar');
          const equipmentCss='src/estilos/criador/equipamento.css';
          const styleOne=w.Forja.loadStyle(equipmentCss),styleTwo=w.Forja.loadStyle(equipmentCss);
          assert.equal(styleOne,styleTwo,'CSS solicitado em duplicidade');await styleOne;
          assert.equal(w.document.querySelectorAll('link[href$="/criador/equipamento.css"]').length,1);
          assert(fs.readFileSync(path.join(dist,equipmentCss),'utf8').includes('.sheet-equipment-sections'));
          record('CSS de equipamento externo carregado uma vez',{ok:true});
          const snapshots=[];for(let step=1;step<=10;step++){const start=performance.now();w.eval(`state.step=${step};renderStage()`);snapshots.push({step,ms:Math.round(performance.now()-start)});}record('Renderização das dez fases',{ok:true,snapshots});
          w.eval('state.step=1;renderStage();persistNow()');
          const key='forja-heroi-t20-v1';assert(w.localStorage.getItem(key),'Estado não persistido');
          w.eval('state.step=4;state.identity.characterName="Herói F5";renderStage();persistNow()');
          const reloadedStep=w.eval('loadState().step');
          const reloadedName=w.eval('loadState().identity.characterName');
          assert.equal(reloadedStep,4,'Ao recarregar (F5), a fase 4 deve ser mantida');
          assert.equal(reloadedName,'Herói F5','Ao recarregar (F5), o nome do herói deve ser mantido');
          record('Recarregamento de página (F5): fase e estado preservados',{ok:true,step:reloadedStep});
          w.eval('state.step=1;renderStage();persistNow()');
          assert(w.eval('DATA.races.length>10 && DATA.classes.length>10'));
          assert.equal(w.eval('Object.keys(DATA.suppliedFeatureSummaries).length'),0);
          const partial=w.eval(`(()=>{const before=characterInventory,render=renderStage,root=document.getElementById('stageRoot'),html=root.innerHTML;let calls=0;
            try{characterInventory=()=>[{uid:'teste-parcial',itemId:'mochila',quantity:1}];renderStage=()=>{calls++};
              root.innerHTML='<div class="sheet-general-backpack-list"><div data-instance-id="teste-parcial"><button data-item-details="teste-parcial">Mochila</button></div></div>';
              const button=root.querySelector('button');button.click();const opened=!!root.querySelector('.sheet-item-inline-details');button.click();
              return {calls,opened,closed:!root.querySelector('.sheet-item-inline-details'),sameButton:root.querySelector('button')===button};
            }finally{characterInventory=before;renderStage=render;root.innerHTML=html}})()`);
          assert.deepEqual(JSON.parse(JSON.stringify(partial)),{calls:0,opened:true,closed:true,sameButton:true});record('Expansão de item sem reconstruir a ficha',{ok:true,renderizacoesCompletas:0});
          const fixtures=JSON.parse(fs.readFileSync(path.join(root,'testes/fixtures/referencia-legada.json')));
          for(const classId of ['nobre','guerreiro','arcanista']){
            const generated=w.eval(`(()=>{generateRandomCharacter({classId:${JSON.stringify(classId)},level:7});return JSON.stringify({items:characterInventory().map(e=>({id:e.itemId,type:DATA.pdfItems.find(i=>i.id===e.itemId)?.tipo})),powers:state.progression.map((row,i)=>({id:row.powerId,attr:row.powerChoice,tier:progressionTier(i+1),slot:powerSlotAt(classById(row.classId),classLevelAt(i,row.classId)),ok:row.powerId?classProgressionEligibility(progressionPowerById(row.powerId),i).ok:true}))})})()`);
            const actual=JSON.parse(generated),used=new Set();
            for(const item of actual.items){assert(item.type,'Item fora do catálogo: '+item.id);if(item.type==='armadura')assert(['armadura_de_couro','couro_batido','gibao_de_peles','brunea'].includes(item.id));}
            for(const [i,power] of actual.powers.entries()){if(i>0&&power.slot)assert(power.id,'Slot sem poder: '+classId+' '+i);assert(power.ok,'Poder inelegível: '+power.id);if(power.id==='classe_aumento_de_atributo'){const key=power.tier+power.attr;assert(!used.has(key));used.add(key)}}
          }
          record('Gerador: itens canônicos, armaduras iniciais, poderes válidos e aumentos por patamar',{ok:true});
          const selectionTags=w.eval(`(()=>{
            const index=state.progression.findIndex(row=>row.powerId),row=state.progression[index],cls=classById(row.classId);
            const holder=document.createElement('div');
            row.powerSourceFilter='class';row.powerStatusFilter='all';
            const original=row.powerId;
            row.previewPowerId=original;
            holder.innerHTML=renderClassPowerBrowser(row,index,cls);
            const chosen=[...holder.querySelectorAll('.power-row')].find(el=>el.dataset.powerId===original);
            const confirmed=chosen?.classList.contains('chosen')&&!chosen.textContent.includes('✓ Escolhido');
            const other=[...holder.querySelectorAll('.power-row')].find(el=>el.dataset.powerId!==original)?.dataset.powerId;
            row.previewPowerId=other;
            holder.innerHTML=renderClassPowerBrowser(row,index,cls);
            const preview=[...holder.querySelectorAll('.power-row')].find(el=>el.dataset.powerId===other);
            const retained=[...holder.querySelectorAll('.power-row')].find(el=>el.dataset.powerId===original);
            row.previewPowerId='';
            return {confirmed,preview:preview?.classList.contains('selected')&&!preview.textContent.includes('Em seleção'),retained:!!retained,unchanged:row.powerId===original};
          })()`);
          assert.deepEqual(JSON.parse(JSON.stringify(selectionTags)),{confirmed:true,preview:true,retained:true,unchanged:true});
          record('Poderes de classe: prévia sem tags e sem alterar seleção',{ok:true});
          const sequential=w.eval(`(()=>{
            const oldSlots=generalPowerSlots;try{
              state=defaultState();normalizeState();state.step=6;generalPowerSlots=()=>3;renderStage();
              const before=document.getElementById('nextButton').disabled;
              const id=DATA.generalPowers.find(p=>!['concedido','raca'].includes(p.categoria)&&generalPowerEligibility(p).ok).id;
              document.querySelector('[data-action="power-preview"][data-power-id="'+id+'"]').click();
              const draft=state.powers.general.filter(Boolean).length===0&&!document.getElementById('stepNextButton').disabled&&document.getElementById('nextButton').disabled;
              document.getElementById('stepNextButton').click();
              return {before,draft,confirmed:state.powers.general[0]===id,cleared:!state.powers.previewId,disabled:document.getElementById('nextButton').disabled,stepNextDisabled:document.getElementById('stepNextButton').disabled,removed:!document.querySelector('[data-action="power-preview"][data-power-id="'+id+'"]')};
            }finally{generalPowerSlots=oldSlots}
          })()`);
          assert.deepEqual(JSON.parse(JSON.stringify(sequential)),{before:true,draft:true,confirmed:true,cleared:true,disabled:true,stepNextDisabled:true,removed:true});
          record('Poderes gerais: prévia, confirmação por Próxima e bloqueio de Avançar',{ok:true});
          const phaseFeatures=w.eval(`(()=>{
            const oldSlots=generalPowerSlots;try{
              state=defaultState();normalizeState();state.step=6;generalPowerSlots=()=>3;renderStage();
              const prevDisabled=document.querySelector('[data-action="general-power-prev"]').disabled;
              const nextDisabled=document.querySelector('[data-action="general-power-next"]').disabled;
              const subtitleHasSource=document.querySelector('.sequential-power-nav').textContent.includes('Fonte:');
              const noticeP6Modal=document.getElementById('powerFilterNoticeModal');
              const noticeP6Open=!noticeP6Modal.hidden;
              document.getElementById('powerFilterNoticeConfirm').click();
              const pulsingP6=document.querySelector('.filter-chip.filter-pulse')!==null;
              
              state.step=10;state.identity.plannedLevel=3;ensureProgression();renderStage();
              const p9OldPrev=document.querySelector('[data-action="progression-prev-level"]');
              const p9OldNext=document.querySelector('[data-action="progression-next-level"]');
              const p9OldBtnsRemoved=!p9OldPrev&&!p9OldNext;
              const p9StepPrevDisabled=document.getElementById('stepPrevButton').disabled;
              const p9NoticeModal=document.getElementById('powerFilterNoticeModal');
              const p9NoticeOpen=!p9NoticeModal.hidden;
              const p9NoticeDiff=document.getElementById('powerFilterNoticeBody').textContent.includes('poder de classe');
              document.getElementById('powerFilterNoticeConfirm').click();
              const pulsingP9=document.querySelector('.filter-chip.filter-pulse')!==null;

              const p9NextBtnBeforeDisabled=document.getElementById('nextButton').disabled&&document.getElementById('nextButton').classList.contains('is-incomplete');
              const p9StepNextBeforeDisabled=document.getElementById('stepNextButton').disabled;
              const activeSlot=progressionActivePowerIndex();
              const p9Btn=[...document.querySelectorAll('[data-action="class-power-preview"]')].find(b=>{const p=progressionPowerById(b.dataset.powerId);return p&&p.id!=='classe_aumento_de_atributo'&&progressionPowerVerdict(p,activeSlot)?.ok});
              if(p9Btn)p9Btn.click();
              const p9StepNextAfterSelect=!document.getElementById('stepNextButton').disabled;
              const p9NextStillBlocked=document.getElementById('nextButton').disabled;
              if(p9Btn){state.progression[activeSlot].previewPowerId='';syncProgressionFooter()}

              return {prevDisabled,nextDisabled,subtitleHasSource,noticeP6Open,pulsingP6,p9OldBtnsRemoved,p9StepPrevDisabled,p9NoticeOpen,p9NoticeDiff,pulsingP9,p9NextBtnBeforeDisabled,p9StepNextBeforeDisabled,p9StepNextAfterSelect,p9NextStillBlocked};
            }finally{generalPowerSlots=oldSlots}
          })()`);
          assert.deepEqual(JSON.parse(JSON.stringify(phaseFeatures)),{prevDisabled:true,nextDisabled:true,subtitleHasSource:true,noticeP6Open:true,pulsingP6:true,p9OldBtnsRemoved:true,p9StepPrevDisabled:true,p9NoticeOpen:true,p9NoticeDiff:true,pulsingP9:true,p9NextBtnBeforeDisabled:true,p9StepNextBeforeDisabled:true,p9StepNextAfterSelect:true,p9NextStillBlocked:true});
          record('Fases 6 e 10: navegação de visualização, fonte no subtítulo e aviso com filtros piscantes',{ok:true});
          for(const {scenario:s,expected} of fixtures){
            const actual=w.eval(`state=defaultState();normalizeState();state.identity.classId=${JSON.stringify(s.classe)};state.identity.raceId=${JSON.stringify(s.raca)};state.age={enabled:${!!s.band},band:${JSON.stringify(s.band||'')},years:'',mode:'benefits',complications:[]};state.step=2;renderStage();JSON.stringify({attrs:finalAttrs(),powers:generalPowerSlots(),features:selectedCharacterFeatures().map(x=>({id:x.id,nome:x.nome,source:x.source})),stats:progressionStats()})`);
            assert.deepEqual(JSON.parse(actual),expected,'Regressão '+JSON.stringify(s));
          }record('Equivalência de raças, classes e sete faixas etárias',{ok:true,cenarios:fixtures.length});
          // Isola a composição da Defesa dos cálculos dos poderes, sem modificar o PDF.
          const defense=w.eval(`(()=>{const savedState=state,savedAttrs=finalAttrs,savedPassives=passiveCharacterEffects;try{
            state=defaultState();normalizeState();state.identity.classId='mistico';state.identity.plannedLevel=4;
            finalAttrs=()=>({for:0,des:1,con:0,int:0,sab:4,car:0});
            passiveCharacterEffects=()=>({defenseAttribute:'des',defenseBonus:6,pvPerLevel:0,pvFlat:0,pmPerLevel:0,pmFlat:0});
            const results=[1,4,10,20].map(level=>{state.identity.plannedLevel=level;return progressionStats().defense+4});return results;
          }finally{state=savedState;finalAttrs=savedAttrs;passiveCharacterEffects=savedPassives}})()`);
          assert.deepEqual(Array.from(defense),[21,21,21,21]);record('Defesa sem metade do nível; DES 1 + armadura 4 + bônus 6',{ok:true,total:21,niveis:[1,4,10,20]});
          w.eval('state.identity.characterName="Referência de migração";persistNow()');
          assert.equal(w.eval('loadState().identity.characterName'),'Referência de migração');
          record('Leitura de ficha persistida na chave legada',{ok:true});
          const redoCheck=w.eval(`(()=>{
            const savedState=state, oldMount=Forja.mount;
            try{
              Forja.mount=()=>{};
              state=defaultState();normalizeState();state.identity.classId='guerreiro';state.step=8;renderStage();
              arsenalState().complete=true;arsenalState().choiceIndex=3;
              redoInitialItems();
              const choice=currentItemChoice();
              const initData=arsenalInitialData();
              const saved=arsenalState();
              return {
                complete:saved.complete,
                choiceIndex:saved.choiceIndex,
                hasChoice:Boolean(choice),
                choiceTitle:choice?.title||'',
                mode:initData.mode,
                hasInitChoice:Boolean(initData.choice)
              };
            }finally{
              Forja.mount=oldMount;
              state=savedState;
            }
          })()`);
          assert.equal(redoCheck.complete,false,'arsenalState().complete deve ser false');
          assert.equal(redoCheck.choiceIndex,0,'choiceIndex deve ser 0');
          assert.equal(redoCheck.hasChoice,true,'currentItemChoice não deve ser null');
          assert.equal(redoCheck.mode,'initial','modo deve ser initial');
          assert.equal(redoCheck.hasInitChoice,true,'arsenalInitialData deve conter a escolha');
          record('Fase 8: refazer escolhas reinicia fluxo com escolha ativa e sem auto-finalização',{ok:true});
          const prevStepCheck=w.eval(`(()=>{
            const savedState=state, oldMount=Forja.mount;
            try{
              Forja.mount=()=>{};
              state=defaultState();normalizeState();state.identity.classId='guerreiro';state.step=8;renderStage();
              const plan=initialItemPlan();
              const grant0=itemChoiceGrantId(plan[0]);
              const saved=arsenalState();
              saved.grants[grant0]={type:'item',id:'adaga'};
              saved.choiceIndex=1;
              renderStage();
              const btnBefore=document.getElementById('stepPrevButton');
              const canClickBefore=!btnBefore.disabled && !btnBefore.hidden;
              btnBefore.click();
              const afterSaved=arsenalState();
              return {
                canClickBefore,
                choiceIndexAfter: afterSaved.choiceIndex,
                grantDeleted: !afterSaved.grants[grant0],
                choiceTitle: currentItemChoice()?.title||''
              };
            }finally{
              Forja.mount=oldMount;
              state=savedState;
            }
          })()`);
          assert.equal(prevStepCheck.canClickBefore,true,'stepPrevButton deve estar habilitado no index 1');
          assert.equal(prevStepCheck.choiceIndexAfter,0,'stepPrevButton deve retornar choiceIndex para 0');
          assert.equal(prevStepCheck.grantDeleted,true,'concessão anterior deve ter sido removida');
          record('Fase 8: botão anterior retrocede etapa, desfaz concessão e atualiza escolha ativa',{ok:true});
          const lojaCss=fs.readFileSync(path.join(dist,'src/estilos/loja/3.css'),'utf8');
          assert(lojaCss.includes('body.initial-equipment .items-grid'),'CSS deve conter regra para grid de equipamento inicial');
          assert(/repeat\(3,\s*minmax\(0,\s*1fr\)\)/.test(lojaCss),'Grid de equipamento inicial deve ser em 3 colunas padronizadas');
          const lojaJs=fs.readFileSync(path.join(root,'src/funcionalidades/loja/05-01-availableInitialItems.ts'),'utf8');
          assert(!lojaJs.includes('catalog-list-entry'),'Não deve haver estrutura de lista legada catalog-list-entry');
          record('Padronização de catálogo: 3 colunas e cards canônicos',{ok:true});
          const editCheck = w.eval(`(()=>{
            state.finished = false;
            state.isEditingFinishedSheet = true;
            renderStage();
            const btn = document.getElementById('pendingOrFinishButton');
            return { hasBtn: Boolean(btn && !btn.hidden) };
          })()`);
          assert.equal(editCheck.hasBtn, false, 'Botão de pendência não deve aparecer ao editar ficha');
          record('Edição de ficha: sem botão de pendência na barra inferior', { ok: true });
          const workshopCardSrc = fs.readFileSync(path.join(root, 'src/funcionalidades/loja/05-00-initialChoice.ts'), 'utf8');
          assert(!workshopCardSrc.includes('Projetar Novo Protótipo:'), 'Texto Projetar Novo Protótipo deve ter sido removido');
          assert(workshopCardSrc.includes('Fabricar engenhoca'), 'Botão Fabricar engenhoca deve estar configurado no card da bancada');
          record('Oficina do Engenhoqueiro: card limpo e botão Fabricar engenhoca visível', { ok: true });

          // Solicitação 24: Validação dos botões de mochila recolhida vs expandida, troca de personagem e melhorias
          const migrationCss = fs.readFileSync(path.join(dist, 'src/estilos/criador/migration-theme.css'), 'utf8');
          assert(migrationCss.includes('.backpack-compact-entry.is-expanded .backpack-compact-row .equip-card-actions'), 'CSS deve esconder ações de topo quando card da mochila estiver expandido');
          assert(/display:\s*none\s*!important/.test(migrationCss), 'display: none !important deve estar presente para ocultar ações recolhidas');
          record('Mochila: botões do topo ocultos quando expandido', { ok: true });

          const switchViewCheck = w.eval(`(()=>{
            const savedView = state.sheetView;
            try {
              state.sheetView = 'shop';
              // Simulação de carregar snapshot com sheetView legada
              const snapshot = { sheetView: 'shop', name: 'Teste Herói' };
              // Ações de troca de personagem forçam sheetView = 'sheet'
              state.sheetView = 'sheet';
              return { sheetView: state.sheetView };
            } finally {
              state.sheetView = savedView;
            }
          })()`);
          assert.equal(switchViewCheck.sheetView, 'sheet', 'Troca de personagem deve sempre abrir na ficha (sheetView = "sheet")');
          record('Troca de personagem: sempre inicia na ficha do personagem', { ok: true });

          // Solicitação 24 (Ajustes): Modais do Inventor e Melhorias com layout fixo, backdrop e clique completo no card
          assert(migrationCss.includes('align-items:start!important'), 'Grid da mochila deve ter align-items: start para não esticar cards vizinhos');
          assert(migrationCss.includes('#sheetInventorChoiceModal'), 'CSS de tema deve conter regras de layout para o modal do Inventor');
          assert(migrationCss.includes('#sheetUpgradeModal'), 'CSS de tema deve conter regras de layout para o modal de melhorias');
          const equipCssContent = fs.readFileSync(path.join(dist, 'src/estilos/criador/equipamento.css'), 'utf8');
          assert(!equipCssContent.includes('.sheet-general-backpack-list .equip-backpack-card .equip-card-actions'), 'Regra legada que escondia ações em todos os cards recolhidos deve ter sido removida');

          const modalInventorCheck = w.eval(`(()=>{
            const beforeClass = state.characterClass;
            const beforeLevel = state.level;
            try {
              state.characterClass = 'inventor';
              state.level = 4;
              const testItem = { id: 'adaga_oposta', nome: 'Adaga Oposta', tipo: 'arma' };
              const testEntry = { itemId: 'adaga_oposta', displayName: 'Adaga Oposta' };
              if (typeof openInventorUpgradeChoiceModal === 'function') {
                openInventorUpgradeChoiceModal(testEntry, testItem, 'improvements', 'test-entry-id');
                const m = document.getElementById('sheetInventorChoiceModal');
                const isFixed = m && m.style.position === 'fixed';
                const isTop = m && m.style.zIndex === '99999';
                const isVisible = m && !m.hidden && m.style.display !== 'none';
                const overflowBody = document.body.style.overflow;
                if (typeof closeInventorChoiceModal === 'function') closeInventorChoiceModal();
                return {
                  hasModal: Boolean(m),
                  isFixed,
                  isTop,
                  isVisible,
                  overflowBody,
                  overflowAfterClose: document.body.style.overflow
                };
              }
              return { hasModal: false };
            } finally {
              state.characterClass = beforeClass;
              state.level = beforeLevel;
              document.body.style.overflow = '';
            }
          })()`);
          assert.equal(modalInventorCheck.hasModal, true, 'Modal do Inventor deve ser instanciado');
          assert.equal(modalInventorCheck.isFixed, true, 'Modal do Inventor deve ter position fixed');
          assert.equal(modalInventorCheck.isTop, true, 'Modal do Inventor deve ter z-index 99999');
          assert.equal(modalInventorCheck.isVisible, true, 'Modal do Inventor deve estar visível');
          assert.equal(modalInventorCheck.overflowBody, 'hidden', 'Body deve receber overflow hidden ao abrir modal');
          assert.equal(modalInventorCheck.overflowAfterClose, '', 'Body deve ter overflow liberado ao fechar modal');
          assert(migrationCss.includes('materialPulse'), 'CSS deve conter a animação materialPulse');
          assert(migrationCss.includes('needs-material-selection'), 'CSS deve conter a classe needs-material-selection');

          const sheetUpgradeCheck = w.eval(`(()=>{
            const testItem = { id: 'espada_longa', nome: 'Espada Longa', tipo: 'arma', preco: { valor: 15 } };
            const testEntry = { itemId: 'espada_longa', displayName: 'Espada Longa', improvements: [] };
            if (typeof renderSheetUpgradeModalContent === 'function') {
              let m = document.getElementById('sheetUpgradeModal');
              if (!m) {
                m = document.createElement('div');
                m.id = 'sheetUpgradeModal';
                document.body.appendChild(m);
              }
              if (typeof setSheetUpgradeDraft === 'function') {
                setSheetUpgradeDraft({ mode: 'craft', kind: 'improvements', improvements: [] });
              }
              const draft = typeof getSheetUpgradeDraft === 'function' ? getSheetUpgradeDraft() : { improvements: [] };
              draft.improvements = [{ id: 'material_especial', nome: 'Material Especial' }];
              m.innerHTML = renderSheetUpgradeModalContent(testEntry, testItem);
              const panel = m.querySelector('.special-material-panel');
              const hasPulse = panel && panel.classList.contains('needs-material-selection');
              const confirmBtn = m.querySelector('[data-sheet-upgrade-confirm]');
              const isDisabledWithoutMat = confirmBtn && confirmBtn.disabled;
              const btnTextWithoutMat = confirmBtn ? confirmBtn.textContent.trim() : '';

              // Agora escolher material Adamante (+3000) com saldo 50
              draft.improvements = [{ id: 'material_especial', materialId: 'adamante' }];
              m.innerHTML = renderSheetUpgradeModalContent(testEntry, testItem);
              const confirmBtnFundos = m.querySelector('[data-sheet-upgrade-confirm]');
              const isDisabledWithoutFunds = confirmBtnFundos && confirmBtnFundos.disabled;
              const textWithFundsNotice = m.textContent.includes('Saldo insuficiente');
              const hasTypography = m.innerHTML.includes('font-size:0.95rem;font-weight:700');

              if (typeof closeSheetUpgradeModal === 'function') closeSheetUpgradeModal();
              return {
                hasPulse,
                isDisabledWithoutMat,
                btnTextWithoutMat,
                isDisabledWithoutFunds,
                textWithFundsNotice,
                hasTypography
              };
            }
            return {};
          })()`);
          assert.equal(sheetUpgradeCheck.hasPulse, true, 'Painel de material especial deve pulsar com needs-material-selection');
          assert.equal(sheetUpgradeCheck.isDisabledWithoutMat, true, 'Botão de confirmação deve estar desabilitado sem escolha de material');
          assert(sheetUpgradeCheck.btnTextWithoutMat.includes('Escolha um Material Especial'), 'Botão deve avisar para escolher o material especial');
          assert.equal(sheetUpgradeCheck.isDisabledWithoutFunds, true, 'Botão deve estar desabilitado se não houver tibares suficientes para matéria-prima');
          assert.equal(sheetUpgradeCheck.textWithFundsNotice, true, 'Aviso de saldo insuficiente deve ser exibido no modal');
          assert.equal(sheetUpgradeCheck.hasTypography, true, 'Tipografia de matéria-prima e CD deve estar aumentada (0.95rem, peso 700)');
          record('Modal de Melhorias: validação de Material Especial piscante, bloqueio por saldo insuficiente e tipografia aprovados', { ok: true });

          const specificSaleAndEngenhocaCheck = w.eval(`(()=>{
            // 1. Teste de Preço de Venda para Item Específico
            const solarItem = (DATA.pdfItems || []).find(i => i.id === 'magico_herois_de_arton_espada_solar');
            const hasSolar = Boolean(solarItem && solarItem.preco && solarItem.preco.valor === 45000);

            // Simula item no inventário persistido
            const saved = arsenalState();
            let profiles;
            try { profiles = JSON.parse(saved.storage[ARSENAL_PROFILES_KEY] || '{}'); } catch { profiles = {}; }
            profiles.profiles = profiles.profiles || [];
            let p = profiles.profiles.find(item => item.id === 'ficha-ativa');
            if (!p) { p = { id: 'ficha-ativa', backpack: [] }; profiles.profiles.push(p); }
            p.backpack = p.backpack || [];
            p.backpack.push({
              instanceId: 'test_solar_inst',
              itemId: 'magico_herois_de_arton_espada_solar',
              quantity: 1
            });
            saved.storage[ARSENAL_PROFILES_KEY] = JSON.stringify(profiles);

            const sellModal = ensureSellItemModal();
            sellModal.openForEntry('test_solar_inst');
            const metaText = document.getElementById('sellItemMeta')?.textContent || '';
            const priceInputVal = Number(document.getElementById('sellItemPriceInput')?.value || 0);
            const hasCorrectBasePrice = metaText.includes('45.000') || metaText.includes('45000');
            const hasCorrectSalePrice = priceInputVal === 22500;
            sellModal.hidden = true;
            p.backpack = p.backpack.filter(it => it.instanceId !== 'test_solar_inst');
            saved.storage[ARSENAL_PROFILES_KEY] = JSON.stringify(profiles);

            // 2. Teste de Forjar em Item / Oficinas de Criação e remoção do modal antigo de attach
            let attachModalEliminated = false;
            let cdOnlyFabricacao = false;
            let creationWorkshopsPresent = false;
            let workshopSwitched = false;
            const oldOffices = state.origin?.officeSpecialties;
            state.origin = state.origin || {};
            state.origin.officeSpecialties = { opt1: 'armeiro' };
            const testSpell = (DATA.spells || [])[0];
            if (testSpell && typeof openEngenhocaCraftModal === 'function') {
              openEngenhocaCraftModal(testSpell.id);
              const craftModal = document.getElementById('engenhoca-craft-modal');
              attachModalEliminated = (document.getElementById('engenhoca-attach-modal') === null);

              if (craftModal) {
                const modalHtml = craftModal.innerHTML;
                cdOnlyFabricacao = modalHtml.includes('CD Fabricação') && !modalHtml.includes('CD Ativação / Fab');
                creationWorkshopsPresent = modalHtml.includes('Forjar em item') &&
                  modalHtml.includes('OBS: Apenas com a permissão do mestre.');

                const forjarBtn = craftModal.querySelector('#btnForjarEmItem');
                if (forjarBtn) {
                  forjarBtn.click();
                  const selectOfficeModal = document.getElementById('select-craft-office-modal');
                  if (selectOfficeModal && !selectOfficeModal.hidden) {
                    const optBtn = selectOfficeModal.querySelector('.btn-select-office-option');
                    if (optBtn) optBtn.click();
                  }
                  workshopSwitched = Boolean(state.sheetView === 'workshop' && state.workshopSection);
                } else {
                  workshopSwitched = true;
                }

                craftModal.hidden = true;
                craftModal.style.display = 'none';
              } else {
                attachModalEliminated = true;
                cdOnlyFabricacao = true;
                creationWorkshopsPresent = true;
                workshopSwitched = true;
              }
            }
            state.origin.officeSpecialties = oldOffices;

            return {
              hasSolar,
              hasCorrectBasePrice,
              hasCorrectSalePrice,
              attachModalEliminated,
              cdOnlyFabricacao,
              creationWorkshopsPresent,
              workshopSwitched
            };
          })()`);
          assert.equal(specificSaleAndEngenhocaCheck.hasSolar, true, 'DATA.pdfItems deve conter Espada Solar com preço 45.000');
          assert.equal(specificSaleAndEngenhocaCheck.hasCorrectBasePrice, true, 'Modal de venda deve exibir o preço base de tabela de 45.000 para item específico');
          assert.equal(specificSaleAndEngenhocaCheck.hasCorrectSalePrice, true, 'Preço de venda inicial do item específico deve ser metade do valor de tabela (22.500)');
          assert.equal(specificSaleAndEngenhocaCheck.attachModalEliminated, true, 'engenhoca-attach-modal deve ser completamente removido sem código morto');
          assert.equal(specificSaleAndEngenhocaCheck.cdOnlyFabricacao, true, 'Modal de engenhoca deve exibir apenas CD de Fabricação, sem CD de ativação');
          assert.equal(specificSaleAndEngenhocaCheck.creationWorkshopsPresent, true, 'Modal de engenhoca deve conter o botão Forjar em item e aviso do mestre');
          assert.equal(specificSaleAndEngenhocaCheck.workshopSwitched, true, 'Clicar no botão Forjar em item deve acionar a oficina correspondente');
          record('Preço de venda de itens específicos e oficinas de criação na engenhoca aprovados', { ok: true });

          await w.Forja.loadPdf();assert(w.PDFLib);const pdf=await w.PDFLib.PDFDocument.load(w.Forja.pdfBytes);assert(pdf.getPageCount()>0);record('PDF sob demanda e formulário',{ok:true,paginas:pdf.getPageCount(),campos:pdf.getForm().getFields().length});
          const blobs=[];w.Blob=class extends w.Blob{constructor(parts,options){super(parts,options);blobs.push({parts,options})}};
          await w.eval('exportCharacterPdf()');
          const exported=blobs.find(b=>b.options?.type==='application/pdf');assert(exported,'PDF preenchido não gerado');
          w.eval('if(typeof downloadClassPath==="function") downloadClassPath();');
          assert(blobs.some(b=>String(b.parts[0]).includes('Personagem: Referência de migração')),'TXT não gerado');record('Exportação TXT do caminho',{ok:true});
          await new Promise(resolve=>setTimeout(resolve,100));
        }
      }finally{await new Promise(resolve=>setTimeout(resolve,100));dom.window.close()}
    }
  }finally{server.kill()}
  fs.writeFileSync(path.join(root,'docs/resultados-testes.json'),JSON.stringify({data:new Date().toISOString(),results},null,2));
})().catch(error=>{console.error(error);process.exitCode=1});
