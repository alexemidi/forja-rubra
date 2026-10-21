const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const {JSDOM,VirtualConsole}=require('jsdom');
const path=require('node:path');
const root=path.resolve(__dirname,'..'),port=4198;
async function open(page){
  const errors=[],vc=new VirtualConsole();
  vc.on('jsdomError',e=>{
    const fullText = [e.message, e.stack, e.cause?.message, e.cause?.stack, e.detail?.stack, e.detail?.message].filter(Boolean).join(' ');
    if(!/navigation|scroll|CSS|Could not load.*fonts|ConnectTimeoutError|TimeoutError|fetch failed|network|socket/i.test(fullText)) {
      errors.push(e.cause?.stack||e.detail?.stack||e.message);
    }
  });
  const dom=await JSDOM.fromURL(`http://127.0.0.1:${port}/${page}.html`,{runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
    w.HTMLCanvasElement.prototype.getContext=()=>null;w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
    w.scrollTo=w.scrollBy=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.structuredClone=structuredClone;
    w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.confirm=()=>false;w.alert=()=>{};
    w.fetch=(url,opts)=>fetch(new URL(url,w.location.href),opts);w.URL.createObjectURL=()=> 'blob:teste';w.URL.revokeObjectURL=()=>{};
  }});
  for(let i=0;i<600&&!dom.window.document.documentElement.dataset.forjaReady;i++)await new Promise(r=>setTimeout(r,25));
  assert.equal(dom.window.document.documentElement.dataset.forjaReady,'true',page+': '+errors.join('\n'));
  return {dom,errors};
}
(async()=>{
  const server=spawn(process.execPath,[path.join(root,'ferramentas/servidor.cjs'),String(port)],{stdio:'pipe'});
  try{
    await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject)});
    for(const page of ['criador','ficha','loja']){
      const {dom,errors}=await open(page),w=dom.window;
      try{
        assert.deepEqual(errors,[],page+': inicialização');
        if(page!=='loja'){
          w.eval(`generateRandomCharacter({classId:'guerreiro',raceId:'humano',level:3});state.finished=true;state.sheetView='sheet';document.getElementById('stageRoot').innerHTML=renderCharacterDetails();`);
          const rows=[...w.document.querySelectorAll('[data-item-details]')];
          assert(rows.length>0,page+': itens reais na ficha');
          for(const row of rows){
            row.click();
            assert(row.closest('.backpack-compact-entry, .equip-worn-item').querySelector('.sheet-item-inline-details .item-card'),page+': clique abre card no item correto');
            row.click();
            assert(!row.closest('.backpack-compact-entry, .equip-worn-item').querySelector('.sheet-item-inline-details'),page+': segundo clique recolhe');
          }
          console.log(page+': cards reais da mochila e dos itens equipados aprovados.');
          if(page==='ficha'){
            w.eval('renderStage()');
            const current=w.document.querySelector('[data-vital-current="pv"]');
            assert(current,'PV atuais aparecem na ficha');
            const pvStart=Number(current.value);
            w.document.querySelector('[data-vital-amount="pv"]').value='4';
            w.document.querySelector('[data-vital-action="pv-down"]').click();
            assert.equal(Number(current.value),pvStart-4,'Dano reduz PV atuais');
            w.document.querySelector('[data-vital-action="rest"]').click();
            assert.equal(Number(current.value),Math.min(pvStart,pvStart-4+3),'Descanso normal recupera nível');
            w.document.querySelector('[data-sheet-action="shop"]').click();
            assert.equal(w.eval('state.sheetView'),'shop');
            if(!w.document.querySelector('#characterArsenal'))console.log('SHOP DEBUG',w.document.getElementById('stageRoot')?.outerHTML?.slice(0,450),w.eval('state.finished'),w.eval('state.sheetView'),errors.slice(-2));
            assert(w.document.querySelector('#characterArsenal'),'Loja abre pela ficha');
            w.document.querySelector('[data-header-back]').click();
            w.document.querySelector('[data-sheet-action="tavern"]').click();
            assert.equal(w.eval('state.sheetView'),'tavern');
            assert(w.document.querySelector('#characterTavern'),'Taverna abre pela ficha');
            console.log('PV atuais, descanso, Loja e Taverna pela ficha aprovados.');
          }
          if(page==='criador'){
            const cases=w.eval(`(()=>{
              const result=[];
              for(const classId of ['arcanista','clerigo','bardo','druida','frade','mistico','necromante']){
                const power=DATA.classPowers.find(p=>p.classeIds.includes(classId)&&['Conhecimento Mágico','Aumentar Repertório','Segredos da Natureza'].includes(p.nome));
                if(!power)continue;
                state.identity.classId=classId;state.identity.plannedLevel=3;state.identity.classChoices={caminho:'bruxo'};
                state.progression=[{classId},{classId,powerId:power.id},{classId,powerId:''}];
                const eligible=classProgressionEligibility(power,2).ok;
                const html=renderClassPowerBrowser(state.progression[2],2,classById(classId));
                const holder=document.createElement('div');holder.innerHTML=html;
                const button=[...holder.querySelectorAll('[data-power-id]')].find(b=>b.dataset.powerId===power.id);
                state.progression[2].powerId=power.id;
                const grants=spellPlan().groups.filter(g=>g.id==='power:class:1'||g.id==='power:class:2');
                result.push({classId,eligible,shown:!!button,selected:button?.getAttribute('aria-pressed'),counts:grants.map(g=>g.count),type:grants[0]?.type});
              }
              return result;
            })()`);
            assert(cases.length>=4);
            for(const c of cases){assert(c.eligible,c.classId);assert(c.shown,c.classId);assert.equal(c.selected,'false',c.classId);assert.deepEqual(Array.from(c.counts),[2,2],c.classId);}
            assert.equal(cases.find(c=>c.classId==='bardo').type,'any');
            assert.equal(cases.find(c=>c.classId==='druida').type,'any');
            assert.equal(cases.find(c=>c.classId==='clerigo').type,'divina');
            console.log('Poderes repetíveis sem seleção automática e magias por aquisição: '+cases.map(c=>c.classId).join(', '));
            const origin=w.eval(`(()=>{
              const names=['Joia de família no valor de T$ 300','Joia falsificada (valor aparente de T$ 100, sem valor real)','Item artístico','Uma ferramenta pesada (mesmas estatísticas de uma maça)','Instrumento musical','Instrumento musical exótico'];
              return names.map((name,i)=>originItemChoice(name,'standard',{nome:'Teste'},i));
            })()`);
            assert(origin.every(Boolean));
            const extraGrants=w.eval(`(()=>{
              const cases=[['ladino','ladino_truque_magico',1],['ladino','ladino_truque_de_palco',3],['paladino','paladino_orar',1],['cacador','cacador_elo_com_a_natureza_maior',2],['druida','druida_orador_dos_elementos',1]];
              return cases.map(([classId,powerId,count])=>{state.identity.classId=classId;state.identity.plannedLevel=2;state.progression=[{classId},{classId,powerId}];const group=spellPlan().groups.find(g=>g.id==='power:class:1');return {powerId,count,actual:group?.count,allowed:group?.allowed.length||0}});
            })()`);
            for(const item of extraGrants){assert.equal(item.actual,item.count,item.powerId);if(item.count>1)assert(item.allowed>0,item.powerId);}
            console.log('Escolhas de magia adicionais: ladino, paladino, caçador e druida aprovadas.');
            w.eval(`
              generateRandomCharacter({classId:'arcanista',level:3});
              state.finished=false;state.sheetView='';state.step=10;state.completed=state.completed.filter(s=>s!==10);
              state.progression[1].powerId='';state.progression[1].previewPowerId='arcanista_conhecimento_magico';
              state.progression[2].powerId='';state.progression[2].previewPowerId='';
              delete spellState().selections['power:class:1'];delete spellState().selections['power:class:2'];
              setProgressionEditingIndex(1);renderStage();
              document.getElementById('stepNextButton').click();
            `);
            await new Promise(r=>setTimeout(r,350));
            assert.equal(w.eval('state.step'),7,'Confirmação do poder abre magias');
            assert.equal(w.eval('spellState().returnToProgression'),true);
            const fillSpells=()=>w.eval(`(()=>{
              for(let n=0;n<150;n++){
                const plan=spellPlan(),group=plan.groups.find(g=>g.count&&!g.fixed.length&&groupSpellIds(g).length<g.count);
                if(!group)break;
                const spell=DATA.spells.find(s=>!spellSelectionReason(s.id,group,plan,true));
                if(!spell||!chooseCharacterSpell(group.id,spell.id))break;
              }
              return spellMissingChoices().map(m=>m.message);
            })()`);
            assert.deepEqual(Array.from(fillSpells()),[],'Magias válidas completam a escolha');
            w.eval('refreshSpellStage()');
            assert.equal(w.eval('state.step'),10,'Volta automaticamente quando falta outro nível');
            assert.equal(w.eval('progressionActivePowerIndex()'),2);
            assert.equal(w.eval('state.progression[2].powerId'),'','Não escolhe poder do próximo nível sozinho');
            w.eval(`state.progression[2].previewPowerId='arcanista_conhecimento_magico';renderStage();document.getElementById('nextButton').click()`);
            assert.equal(w.eval('state.step'),7);
            assert.deepEqual(Array.from(fillSpells()),[]);
            w.eval('refreshSpellStage()');
            assert.equal(w.eval('state.step'),7,'Últimas magias permanecem na fase de magias');
            w.eval('characterPendingChoices=()=>[];syncNextButtonState()');
            assert.equal(w.document.getElementById('nextButton').textContent,'Finalizar ficha');
            w.document.getElementById('nextButton').click();
            assert.equal(w.eval('state.finished'),true);
            console.log('Progressão → magias → próximo nível → magias → finalizar ficha aprovado.');
            w.eval(`generateRandomCharacter({classId:'arcanista',level:3});state.finished=false;state.sheetView='';state.completed=state.completed.filter(s=>s!==10);state.step=10;state.progression[1].powerId='';state.progression[1].previewPowerId='';setProgressionEditingIndex(1);renderStage();previewProgressionPower(1,'arcanista_familiar')`);
            const familiarModal=w.document.getElementById('familiarChoiceModal');
            assert.equal(familiarModal.hidden,false,'Familiar abre a janela ao ser escolhido');
            assert.equal(familiarModal.querySelectorAll('[data-familiar-choice]').length,10);
            assert(!w.document.querySelector('.power-detail-panel')?.textContent.includes('Familiares Arcanos'),'Descrição curta no card');
            assert.equal(w.document.getElementById('stepNextButton').disabled,true,'Familiar obrigatório antes de confirmar');
            familiarModal.querySelector('[data-familiar-choice="coruja"]').click();
            assert.equal(w.eval('state.progression[1].previewPowerChoice'),'coruja');
            assert.equal(w.document.getElementById('stepNextButton').disabled,false);
            w.document.getElementById('stepNextButton').click();
            await new Promise(r=>setTimeout(r,350));
            assert.equal(w.eval('state.progression[1].powerChoice'),'coruja');
            assert(w.eval('sheetFeatureDisclosure({...progressionPowerById("arcanista_familiar"),sheetAttribute:state.progression[1].powerChoice},true)').includes('Coruja'));
            console.log('Familiar: descrição curta, janela com dez opções e escolha obrigatória aprovada.');
          }
        }else{
          for(const id of ['joia_de_familia','joia_falsificada','item_artistico','ferramenta_pesada','ferramenta_pesada_lanca','instrumento_musical','instrumento_musical_exotico']){
            w.eval(`applyArsenalContext({mode:'initial',choice:{id:'test-${id}',source:'origin',names:[itemById.get('${id}').nome]},candidate:null});`);
            assert.equal(w.eval('selectedCandidate'),null,id+': nome obrigatório antes de confirmar');
            const field=w.document.querySelector(`[data-item-id="${id}"] [data-item-option="customName"]`);
            assert(field,id+': campo de nome no card');
            assert.equal(field.value,'',id+': não preenche nome automaticamente');
            field.value='Meu item personalizado';field.dispatchEvent(new w.Event('input',{bubbles:true}));
            assert.equal(w.eval('selectedCandidate?.options.customName'),'Meu item personalizado',id+': input atualiza escolha');
            field.value=' ';field.dispatchEvent(new w.Event('input',{bubbles:true}));
            assert.equal(w.eval('selectedCandidate'),null,id+': apagar nome bloqueia avanço');
          }
          console.log('Nomes obrigatórios nos cards reais de sete itens aprovados.');
        }
        assert.deepEqual(errors,[],page+': erros de execução');
      }catch(error){console.error(page,error);throw error}finally{await new Promise(r=>setTimeout(r,300));w.close()}
    }
  }finally{server.kill()}
})().catch(error=>{console.error(error);process.exitCode=1});
