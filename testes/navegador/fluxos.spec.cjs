const {test,expect}=require('@playwright/test');
test('modo local: inicia sem solicitar o SDK externo da nuvem',async({page})=>{
  const cloudRequests=[];
  page.on('request',request=>{if(request.url().includes('@supabase/supabase-js'))cloudRequests.push(request.url())});
  await page.goto('/ficha.html');
  await expect(page.locator('html')).toHaveAttribute('data-forja-ready','true');
  expect(cloudRequests).toEqual([]);
});
test.beforeEach(async({page})=>{
  await page.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:4301/')?route.continue():route.abort());
});
for(const name of ['index','criador','ficha','personagens','loja','taverna','grimorio','oficina','engenhoca','recompensas','mapa','termos','distincoes','backup']){
  test(name+': inicialização independente',async({page})=>{
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('/'+name+'.html');
    await expect(page.locator('html')).toHaveAttribute('data-forja-ready','true');
    expect(errors).toEqual([]);
    await expect(page.locator('#forja-loader')).toHaveCount(0);
  });
}
test('loja: instrumentos usam as melhorias de ferramenta e itens específicos não recebem encantos',async({page})=>{
  await page.goto('/loja.html');
  await expect(page.locator('html')).toHaveAttribute('data-forja-ready','true');
  const eligibility=await page.evaluate(()=>{
    const alaude=itemById.get('alaude_elfico');
    return {
      category:itemImprovementCategory(alaude),
      hasImprovement:(improvements||[]).some(improvement=>improvementAppliesToItem(improvement,alaude)),
      hasEnchantment:(enchantments||[]).some(enchantment=>enchantmentAppliesToItem(enchantment,alaude))
    };
  });
  expect(eligibility.category).toBe('ferramenta');
  expect(eligibility.hasImprovement).toBe(true);
  expect(eligibility.hasEnchantment).toBe(false);
});
test('distinções: cabeçalho usa o componente visual padrão uma única vez',async({page})=>{
  await page.goto('/distincoes.html');
  await expect(page.locator('html')).toHaveAttribute('data-forja-ready','true');
  await expect(page.locator('#forjaUnifiedTopbar')).toHaveCount(1);
  await expect(page.locator('#heroDistinctionBadge')).toHaveCount(1);
  await expect(page.locator('#forjaUnifiedTopbar h1')).toHaveText('Forja Rubra — Distinções');
});
test('ficha: pré-carrega os destinos da mochila sem abrir a outra tela',async({page})=>{
  await page.goto('/criador.html');
  await expect(page.locator('html')).toHaveAttribute('data-forja-ready','true');
  const result=await page.evaluate(async()=>{
    const before=location.pathname;
    await Promise.all(['loja','taverna','oficina','resgatar-recompensas'].map(pageName=>Forja.preloadPage(pageName)));
    return {before,after:location.pathname,preloadType:typeof Forja.preloadPage};
  });
  expect(result).toEqual({before:'/criador.html',after:'/criador.html',preloadType:'function'});
});
test('ficha: persistência de dano, card e ida e volta da loja',async({page})=>{
  await page.goto('/criador.html');
  await expect(page.locator('html')).toHaveAttribute('data-forja-ready','true');
  await page.evaluate(()=>{generateRandomCharacter({classId:'guerreiro',level:3});state.finished=true;state.sheetView='sheet';renderStage();persistNow()});
  await page.goto('/ficha.html');
  await expect(page.locator('html')).toHaveAttribute('data-forja-ready','true');
  await expect(page.locator('#phaseNav')).toHaveCount(0);
  const before=await page.evaluate(()=>sheetVitals(progressionStats()).pv);
  await page.locator('[data-vital-amount="pv"]').fill('3');
  await page.locator('[data-vital-action="pv-down"]').click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-forja-ready','true');
  expect(await page.evaluate(()=>sheetVitals(progressionStats()).pv)).toBe(before-3);
  await page.locator('[data-item-details]').first().click();
  await expect(page.locator('.sheet-item-inline-details .item-card').first()).toBeVisible();
  await page.evaluate(()=>{state.sheetView='shop';renderStage()});
  await expect(page.locator('#characterArsenal')).toBeVisible();
  await page.locator('[data-header-back]').first().click();
  expect(await page.evaluate(()=>state.sheetView)).toBe('sheet');
  expect(await page.evaluate(()=>state.vitals.pv)).toBe(before-3);
  await page.locator('[data-vital-action="open-rest"]').click();
  await page.locator('[data-vital-action="rest"]').click();
  const rested=await page.evaluate(()=>state.vitals.pv);
  expect(rested).toBeGreaterThan(before-3);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-forja-ready','true');
  expect(await page.evaluate(()=>state.vitals.pv)).toBe(rested);
});
test('backup: conferir, importar e preservar campos desconhecidos',async({page})=>{
  await page.goto('/backup.html');
  await expect(page.locator('html')).toHaveAttribute('data-forja-ready','true');
  const hero={identity:{characterName:'Migrado'},campoFuturo:{preservar:true},vitals:{pv:9,pvMax:12}};
  const backup={formato:'forja-backup',versao:1,criadoEm:new Date().toISOString(),dados:{'forja-heroi-t20-v1':JSON.stringify(hero)}};
  await page.locator('#backupFile').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
  await expect(page.locator('#backupPreview')).toContainText('1 entradas válidas');
  await page.locator('#importBackup').click();
  await expect(page.locator('#backupStatus')).toContainText('1 entradas importadas');
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('forja-heroi-t20-v1')))).toEqual(hero);
});

test('ficha: subir de nível abre o editor na progressão',async({page})=>{
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.text().startsWith('Falha na renderização:'))errors.push(message.text())});
  await page.goto('/criador.html');
  await expect(page.locator('html')).toHaveAttribute('data-forja-ready','true');
  await page.evaluate(()=>{generateRandomCharacter({classId:'guerreiro',level:3});state.finished=true;state.completed=[1,2,3,4,5,6,7,8,9,10];state.sheetView='sheet';persistNow()});
  await page.goto('/ficha.html');
  await expect(page.locator('html')).toHaveAttribute('data-forja-ready','true');
  await expect(page.locator('#phaseNav')).toHaveCount(0);
  await page.locator('.sheet-level-up-btn').click();
  await page.locator('#levelClassConfirm').click();
  await page.waitForURL(/criador\.html/);
  await expect(page.locator('html')).toHaveAttribute('data-forja-ready','true');
  await expect(page.locator('#phaseNav')).toBeVisible();
  expect(await page.evaluate(()=>state.finished)).toBe(false);
  expect(await page.evaluate(()=>state.identity.plannedLevel)).toBe(4);
  await expect(page.locator('#nextButton')).toHaveCount(1);
  await expect(page.locator('.shell > #phaseNav')).toHaveCount(1);
  await expect(page.locator('.workspace > .stage-footer')).toHaveCount(1);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-forja-ready','true');
  expect(await page.evaluate(()=>({finished:state.finished,level:state.identity.plannedLevel}))).toEqual({finished:false,level:4});
  await expect(page.locator('#phaseNav')).toBeVisible();
  expect(errors).toEqual([]);
});

test('progressão: aumento de Inteligência encaminha à perícia pendente e retorna',async({page})=>{
  await page.goto('/criador.html');
  await expect(page.locator('html')).toHaveAttribute('data-forja-ready','true');
  await page.evaluate(()=>{
    generateRandomCharacter({classId:'guerreiro',level:2});
    state.step=10;state.finished=false;state.isLevelingUp=true;
    state.identity.baseAttrs.int=2;
    state.skills.int=[];
    const row=state.progression[1];
    row.powerId='';row.previewPowerId='classe_aumento_de_atributo';row.previewPowerChoice='int';
    setProgressionEditingIndex(1);renderStage();
  });
  await expect(page.locator('#stageTitle')).toHaveText('Progressão');
  const confirmBtn = page.locator('#stepNextButton:visible, #nextButton:visible').first();
  await confirmBtn.click();
  await expect(page.locator('#stageTitle')).toHaveText('Perícias');
  expect(await page.evaluate(()=>state.returnToProgressionAfterSkill)).toBe(true);
  await page.evaluate(()=>{
    const limits=skillChoiceLimits();
    while(state.skills.int.length<limits.int){
      const candidate=SKILLS.find(item=>!allTrainedSkills().includes(item[0]));
      if(!candidate)break;
      state.skills.int.push(candidate[0]);
    }
    renderStage();
  });
  await page.locator('#nextButton').click();
  await expect(page.locator('#stageTitle')).toHaveText('Progressão');
});

test('loja: mochila abre card comum com descrição, estatísticas e expansão',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/criador.html');
  await expect(page.locator('html')).toHaveAttribute('data-forja-ready','true');
  await page.evaluate(()=>{generateRandomCharacter({classId:'guerreiro',level:3});state.finished=true;state.sheetView='shop';renderStage();persistNow()});
  const view=page.frameLocator('#characterArsenal');
  await expect(view.locator('html')).toHaveAttribute('data-forja-ready','true');
  await view.locator('html').evaluate(()=>{
    const item=itemById.get('espada_curta');
    if(!item)throw Error('Espada curta ausente no catálogo');
    backpackItems=[{instanceId:'teste-card',itemId:item.id,quantity:1,options:{},improvements:[],enchantments:[]}];
    state.backpackMode='list';setView('backpack');renderBackpack();
  });
  await view.locator('[data-action="open-details"]').first().click();
  const card=view.locator('[data-inline-details="teste-card"] .item-card');
  await expect(card).toBeVisible();
  await expect(card.locator('.item-title')).toContainText(/espada curta/i);
  await expect(card.locator('.item-stats')).toBeVisible();
  await expect(card.locator('[data-action="sell-general"]')).toBeVisible();
  await card.locator('[data-sheet-card-expand]').click();
  await expect(card).toHaveClass(/expanded/);
  expect(errors).toEqual([]);
});
test('ficha inválida: interromper inicialização e preservar dados para backup',async({page})=>{
  const raw='{ficha incompleta';
  await page.addInitScript(value=>localStorage.setItem('forja-heroi-t20-v1',value),raw);
  await page.goto('/ficha.html');
  await expect(page.locator('[role="alert"]')).toContainText('Dados de personagem inválidos');
  await expect(page.getByRole('link',{name:'Abrir backup e recuperação'})).toBeVisible();
  expect(await page.evaluate(()=>localStorage.getItem('forja-heroi-t20-v1'))).toBe(raw);
  await expect(page.locator('html')).not.toHaveAttribute('data-forja-ready','true');
});

test('portal e backup em tela pequena',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  for(const name of ['index','backup']){
    await page.goto('/'+name+'.html');
    await expect(page.locator('html')).toHaveAttribute('data-forja-ready','true');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    await page.screenshot({path:'docs/tela-'+name+'-mobile.png',fullPage:true});
  }
});

test('engenhoca: sugestões de nomes por forma, escolha de ofício e modo de acoplamento na loja', async({page}) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/engenhoca.html?magia=adaga-mental');
  await expect(page.locator('html')).toHaveAttribute('data-forja-ready', 'true');

  // Sugestões de nomes presentes para empunhada
  const suggestions = page.locator('#nameSuggestionsList .engenhoca-suggestion-item');
  await expect(suggestions).toHaveCount(3);
  const initialName = await page.locator('#engenhocaNameInput').inputValue();
  expect(initialName.length).toBeGreaterThan(0);

  // Troca para vestida e verifica atualização
  await page.locator('#radioVestida').check();
  await expect(page.locator('#recFormaUsoText')).toHaveText('Vestida');
  await expect(page.locator('#nameSuggestionsList .engenhoca-suggestion-item')).toHaveCount(3);

  // Clica em 'FORJAR EM ITEM'
  await page.locator('#btnForjarEmItem').click();
  const officeModal = page.locator('#selectCraftOfficeModal');
  await expect(officeModal).toBeVisible();

  // Escolhe um ofício
  const firstChoice = officeModal.locator('.btn-office-choice').first();
  await expect(firstChoice).toBeVisible();
  await firstChoice.click();

  // Verifica redirecionamento para loja em modo contraption-attach
  await page.waitForURL(/loja\.html\?modo=contraption-attach/);
  await expect(page.locator('html')).toHaveAttribute('data-forja-ready', 'true');
  await expect(page.locator('body')).toHaveClass(/mode-contraption-attach/);
  await expect(page.locator('#toggleWorkshopBackpackBtn')).toHaveAttribute('aria-expanded','false');
  await expect(page.locator('#workshopBackpackContent')).toBeHidden();
  await expect(page.locator('#contraptionAttachNavBar a[href^="engenhoca.html"]')).toBeVisible();
  await expect(page.locator('#contraptionAttachNavBar a[href="ficha.html"]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('acoplamento: usa mochila e saldo do herói ativo sem apagar itens antigos', async({page}) => {
  await page.goto('/criador.html');
  await expect(page.locator('html')).toHaveAttribute('data-forja-ready','true');
  await page.evaluate(()=>{
    generateRandomCharacter({classId:'inventor',level:5});
    const profilesKey='arsenal-arton-character-profiles-v1';
    const ghost={activeId:'ficha-ativa',profiles:[{id:'ficha-ativa',backpack:[{itemId:'adaga',displayName:'Adaga Emissora Psíquica',instanceId:'fantasma',quantity:1}]}]};
    const current={activeId:'ficha-ativa',profiles:[{id:'ficha-ativa',backpack:[]}]};
    localStorage.setItem(profilesKey,JSON.stringify(ghost));
    state.arsenal={storage:{[profilesKey]:JSON.stringify(current)}};
    state.finances={startingLevel:5,spent:0,rewardFunds:0};
    state.identity.characterId='heroi-teste';
    persistNow();
    localStorage.setItem('forja-saldo-personagem-ativo-v1',JSON.stringify({id:'heroi-teste',funds:1000}));
  });
  await page.goto('/loja.html?modo=contraption-attach&oficina=armeiro&forma=empunhada&magia=adaga-mental');
  await expect(page.locator('html')).toHaveAttribute('data-forja-ready','true');
  await expect(page.locator('.workshop-backpack-section .badge')).toContainText('0 itens na mochila');
  await expect(page.locator('#toggleWorkshopBackpackBtn')).toHaveAttribute('aria-expanded','false');
  await expect(page.locator('#contraptionAttachNavBar')).toContainText('T$ 2.000');
  expect(await page.locator('.workshop-btn-buy-attach:not([disabled])').count()).toBeGreaterThan(0);
  await page.evaluate(()=>{
    const hero=JSON.parse(localStorage.getItem('forja-heroi-t20-v1'));
    delete hero.arsenal.storage['arsenal-arton-character-profiles-v1'];
    localStorage.setItem('forja-heroi-t20-v1',JSON.stringify(hero));
    localStorage.setItem('arsenal-arton-character-profiles-v1',JSON.stringify({activeId:'ficha-ativa',profiles:[{id:'ficha-ativa',backpack:[{itemId:'adaga',displayName:'Adaga Emissora Psíquica',instanceId:'fantasma',quantity:1}]}]}));
  });
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-forja-ready','true');
  await expect(page.locator('.workshop-backpack-section .badge')).toContainText('0 itens na mochila');
});

test('engenhoca: ofícios do personagem ativo sem treinos de outros personagens',async({page})=>{
  await page.goto('/index.html');
  await page.evaluate(()=>{
    localStorage.setItem('forja-heroi-t20-v1',JSON.stringify({identity:{classId:'inventor',characterName:'Herói Ativo'},skills:{class:['oficio:joalheiro'],int:[],race:[],duplicate:[]}}));
    localStorage.setItem('forja-heroi-t20-personagens-v1',JSON.stringify([{snapshot:{identity:{characterName:'Herói Antigo'},skills:{class:['oficio:carpinteiro']}}}]));
  });
  await page.goto('/engenhoca.html?magia=adaga-mental');
  await expect(page.locator('html')).toHaveAttribute('data-forja-ready','true');
  await page.locator('#btnForjarEmItem').click();
  await expect(page.locator('#selectCraftOfficeModal [data-office-key="joalheiro"]')).toBeVisible();
  await expect(page.locator('#selectCraftOfficeModal [data-office-key="carpinteiro"]')).toHaveCount(0);
});



test('taverna integrada: retorno inferior e reabertura preservam a tela',async({page})=>{
  await page.goto('/criador.html');
  await expect(page.locator('html')).toHaveAttribute('data-forja-ready','true');
  await page.evaluate(()=>{generateRandomCharacter({classId:'guerreiro',level:3});state.finished=true;state.sheetView='tavern';renderStage()});
  await expect(page.frameLocator('#characterTavern').locator('html')).toHaveAttribute('data-forja-ready','true');
  const result=await page.evaluate(()=>{
    const frame=document.getElementById('characterTavern');
    const firstDocument=frame.contentDocument;
    const button=document.querySelector('[data-header-back]');
    if(!button)throw Error('Retorno inferior ausente');
    button.click();
    const start=performance.now();
    state.sheetView='tavern';renderStage();
    return {sameFrame:frame===document.getElementById('characterTavern'),sameDocument:firstDocument===frame.contentDocument,ms:performance.now()-start};
  });
  expect(result.sameFrame).toBe(true);
  expect(result.sameDocument).toBe(true);
  console.log('Reabertura Taverna (ms):',Math.round(result.ms));
  await expect(page.locator('[data-header-back]')).toBeVisible();
});


test('navegação não recalcula perícias e alterações continuam atualizando derivados',async({page})=>{
 await page.goto('/criador.html');
 await expect(page.locator('html')).toHaveAttribute('data-forja-ready','true');
 const result=await page.evaluate(()=>{
  generateRandomCharacter({classId:'inventor',level:10});state.finished=true;state.sheetView='sheet';renderStage();persistNow();
  const before=JSON.stringify(state.skillsTotals);
  const original=calculatedSkillTotal;
  let calls=0;
  calculatedSkillTotal=function(id){calls++;return original(id)};
  const start=performance.now();
  document.querySelector('[data-sheet-action="tavern"]').click();
  const elapsed=performance.now()-start;
  const navigationCalls=calls;
  const unchanged=before===JSON.stringify(state.skillsTotals);
  state.identity.baseAttrs.int+=1;
  persistNow();
  calculatedSkillTotal=original;
  return {navigationCalls,unchanged,fullSaveCalls:calls,elapsed};
 });
 expect(result.navigationCalls).toBe(0);
 expect(result.unchanged).toBe(true);
 expect(result.fullSaveCalls).toBeGreaterThan(0);
 console.log('Clique Taverna síncrono (ms):',Math.round(result.elapsed));
});


test('navegação: preserva DOM da ficha sem alteração e atualiza após mudança',async({page})=>{
 await page.goto('/criador.html');
 await expect(page.locator('html')).toHaveAttribute('data-forja-ready','true');
 const result=await page.evaluate(()=>{
  generateRandomCharacter({classId:'guerreiro',level:3});state.finished=true;state.sheetView='sheet';renderStage();
  const original=document.querySelector('#sheetViewContainer').firstChild;
  state.sheetView='tavern';renderStage({navigationOnly:true});
  state.sheetView='sheet';renderStage({navigationOnly:true});
  const reused=original===document.querySelector('#sheetViewContainer').firstChild;
  state.identity.characterName='Herói alterado';persistNow();
  state.sheetView='tavern';renderStage({navigationOnly:true});
  state.sheetView='sheet';renderStage({navigationOnly:true});
  return {reused,updated:original!==document.querySelector('#sheetViewContainer').firstChild};
 });
 expect(result).toEqual({reused:true,updated:true});
});


test('ficha: parceiros abaixo da redução e moedas dentro da mochila',async({page})=>{
 await page.goto('/criador.html');
 await expect(page.locator('html')).toHaveAttribute('data-forja-ready','true');
 await page.evaluate(()=>{generateRandomCharacter({classId:'guerreiro',level:3});state.finished=true;state.sheetView='sheet';renderStage()});
 await expect(page.locator('.sheet-defense-heading').locator('..').locator('.sheet-partners-card')).toHaveCount(1);
 await expect(page.locator('.sheet-conditions-heading .sheet-conditions-line')).toHaveCount(1);
 await expect(page.locator('.sheet-conditions-label')).toHaveCount(0);
 await expect(page.locator('.sheet-partner-add-btn')).toHaveText('+');
 await expect(page.locator('.sheet-equipment-backpack .sheet-money-load')).toHaveCount(1);
 await expect(page.locator('.sheet-money-load')).toHaveCount(1);
 const moneyStyle=await page.locator('.sheet-money-load').evaluate(el=>{
   const cells=[...el.children],style=getComputedStyle(el);
   return {border:style.borderTopWidth,background:style.backgroundColor,separators:cells.every(cell=>getComputedStyle(cell).borderRightWidth==='0px'),gap:cells[6].getBoundingClientRect().left-cells[5].getBoundingClientRect().right};
 });
 expect(moneyStyle.border).toBe('0px');
 expect(moneyStyle.background).toBe('rgba(0, 0, 0, 0)');
 expect(moneyStyle.separators).toBe(true);
 expect(moneyStyle.gap).toBeGreaterThan(20);
 expect(await page.locator('.sheet-equipment-backpack').evaluate(el=>getComputedStyle(el.querySelector('.sheet-backpack-grid')).backgroundColor===getComputedStyle(el.querySelector('.sheet-money-load-partners-row')).backgroundColor)).toBe(true);
 await page.evaluate(()=>ForjaCondicoes.abrirModal());
 const modal=page.locator('#forjaConditionsModalBackdrop');
 await modal.locator('[data-select-condition="cego"]').click();
 await expect(modal.locator('.condition-effect-panel')).toContainText('Cego');
 await expect(modal.locator('.condition-effect-panel')).toContainText('camuflagem');
 await expect(modal.locator('.conditions-name-grid svg').first()).toBeVisible();
 await expect(modal.locator('.condition-effect-panel h4 svg')).toBeVisible();
 expect(await modal.locator('.condition-select').first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThan(12);
 const iconColor=await modal.locator('[data-select-condition="cego"] svg').evaluate(el=>getComputedStyle(el).color);
 expect(await modal.locator('[data-cond-cat="sentidos"]').evaluate(el=>getComputedStyle(el).color)).toBe(iconColor);
 const poison=modal.locator('[data-select-condition="envenenado"] svg');
 expect(await poison.evaluate(el=>getComputedStyle(el).color)).toBe('rgb(34, 197, 94)');
 expect(await modal.locator('[data-cond-cat="veneno"]').evaluate(el=>getComputedStyle(el).color)).toBe('rgb(34, 197, 94)');
 const dialogBox=await modal.locator('.conditions-modal-dialog').boundingBox();
 const closeBox=await modal.locator('#conditionsCloseBottomBtn').boundingBox();
 expect(closeBox.y+closeBox.height).toBeLessThanOrEqual(dialogBox.y+dialogBox.height);
 await page.screenshot({path:'docs/condicoes-ampliadas.png'});
 const icons=await modal.locator('[data-select-condition] svg').evaluateAll(els=>els.map(el=>el.innerHTML));
 expect(new Set(icons).size).toBe(icons.length);
 expect(await modal.locator('#forjaConditionsList').evaluate(el=>el.scrollHeight<=el.clientHeight+1)).toBe(true);
 expect(await modal.locator('.condition-select').first().evaluate(el=>getComputedStyle(el).flexDirection)).toBe('row');
 expect(await page.evaluate(()=>tracosCondicao('surdo'))).not.toBe(await page.evaluate(()=>tracosCondicao('cego')));
 await modal.locator('[data-toggle-condition="Cego"]').click();
 expect(await page.evaluate(()=>state.sheetNotes.activeConditions)).toContain('Cego');
});

test('portal: card recente abre o personagem pelo clique e teclado',async({page})=>{
 await page.goto('/criador.html');
 await expect(page.locator('html')).toHaveAttribute('data-forja-ready','true');
 await page.evaluate(()=>{generateRandomCharacter({classId:'guerreiro',level:3});state.finished=true;state.identity.characterName='Herói do card';persistNow();saveFinishedCharacter()});
 await page.goto('/index.html');
 await expect(page.locator('.recent-hero-card').first()).toBeVisible();
 await page.locator('.recent-hero-card').first().focus();
 await page.keyboard.press('Enter');
 await expect(page).toHaveURL(/ficha.html/);
 await expect(page.locator('html')).toHaveAttribute('data-forja-ready','true');
 expect(await page.evaluate(()=>state.identity.characterName)).toBe('Herói do card');
});

test('equipamento: empunhar e guardar preservam a ficha e o retorno mantém botões ativos',async({page})=>{
 await page.goto('/criador.html');
 await expect(page.locator('html')).toHaveAttribute('data-forja-ready','true');
 await page.evaluate(()=>{generateRandomCharacter({classId:'guerreiro',level:3});state.finished=true;state.sheetView='sheet';renderStage();window.__vitalNode=document.querySelector('.sheet-preview-vitals')});
 const equip=page.locator('[data-equip-action="equip-weapon"]').first();
 await expect(equip).toBeVisible();
 await equip.click();
 expect(await page.evaluate(()=>window.__vitalNode===document.querySelector('.sheet-preview-vitals'))).toBe(true);
 await expect(page.locator('[data-equip-action="store-weapon"]').first()).toBeVisible();
 await page.locator('[data-equip-action="store-weapon"]').first().click();
 expect(await page.evaluate(()=>window.__vitalNode===document.querySelector('.sheet-preview-vitals'))).toBe(true);
 await page.locator('[data-sheet-action="tavern"]').first().click();
 await page.locator('[data-header-back]').click();
 const button=page.locator('[data-sheet-action="tavern"]').first();
 await expect(button).toBeEnabled();
 expect(await button.evaluate(el=>getComputedStyle(el).opacity)).toBe('1');
 expect(await button.evaluate(el=>getComputedStyle(el).filter)).toBe('none');
});

test('loja: rodapé tem apenas finalizar e respeita o carrinho',async({page})=>{
 await page.goto('/criador.html');
 await expect(page.locator('html')).toHaveAttribute('data-forja-ready','true');
 await page.evaluate(()=>{generateRandomCharacter({classId:'guerreiro',level:3});state.finished=true;state.sheetView='shop';renderStage()});
 const shop=page.frameLocator('#characterArsenal');
 await expect(shop.locator('html')).toHaveAttribute('data-forja-ready','true');
 await shop.locator('html').evaluate(()=>{cartItems=[];syncCartUI()});
 await expect(page.locator('#arsenalViewContainer .sheet-shop-footer')).toBeHidden();
 await shop.locator('html').evaluate(()=>{cartItems=[{itemId:'adaga',quantity:1,options:{},improvements:[],enchantments:[]}];syncCartUI()});
 await expect(page.locator('#arsenalViewContainer .sheet-shop-footer')).toBeVisible();
 await expect(page.locator('#arsenalViewContainer .sheet-shop-footer button')).toHaveCount(1);
 await expect(page.locator('[data-header-back]')).toBeVisible();
});

test('mochilas e montarias: vestir, bônus de carga, sela e alforje persistem',async({page})=>{
 await page.goto('/criador.html');
 await expect(page.locator('html')).toHaveAttribute('data-forja-ready','true');
 await page.evaluate(()=>{
  generateRandomCharacter({classId:'guerreiro',raceId:'humano',level:3});state.finished=true;state.sheetView='sheet';state.equipment={armorId:'none',shieldId:'none',weaponId:'none',trailerId:'none',wornIds:[]};
  const saved=arsenalState();saved.storage[ARSENAL_PROFILES_KEY]=JSON.stringify({activeId:'ficha-ativa',profiles:[{id:'ficha-ativa',customField:42,backpack:['mochila','mochila_de_aventureiro','armacao_para_mochila','sela','alforje','saco_de_dormir'].map(id=>({itemId:id,instanceId:'teste-'+id,quantity:1,unknown:42}))}]});
  state.partners=[{name:'Cavalo',type:'cavalo',tier:'iniciante'}];renderStage();persistNow();
 });
 expect(await page.evaluate(()=>wornItemsCount())).toBe(0);
 await expect(page.locator('.sheet-equipment-backpack [data-item-details="teste-mochila"]')).toHaveCount(0);
 await expect(page.locator('.equip-worn-item [data-item-details="teste-mochila"]')).toHaveCount(1);
 const before=await page.evaluate(()=>sheetInventoryLoad().limit);
 await page.locator('[data-equip-action="equip-accessory"][data-entry-id="teste-mochila_de_aventureiro"]').click();
 expect(await page.evaluate(()=>sheetInventoryLoad().limit)).toBe(before+2);
 expect(await page.evaluate(()=>wornItemsCount())).toBe(1);
 await page.locator('[data-equip-action="equip-accessory"][data-entry-id="teste-armacao_para_mochila"]').click();
 expect(await page.evaluate(()=>sheetInventoryLoad().limit)).toBe(before+6);
 expect(await page.evaluate(()=>wornItemsCount())).toBe(1);
 await page.locator('[data-mount-toggle]').click();
 expect(await page.evaluate(()=>state.partners[0].mounted)).toBe(true);
 await page.locator('[data-mount-toggle]').click();
 expect(await page.evaluate(()=>state.partners[0].mounted)).toBe(false);
 const limitSemAlforje=await page.evaluate(()=>sheetInventoryLoad().limit);
 await page.locator('[data-action="open-mount-equip-modal"]').click();
 await page.locator('.sheet-mount-equip-now-btn').first().click();
 await page.locator('[data-action="open-mount-equip-modal"]').click();
 await page.locator('.sheet-mount-equip-now-btn').first().click();
 expect(await page.evaluate(()=>sheetInventoryLoad().limit)).toBe(limitSemAlforje+10);
 await page.reload();
 await expect(page.locator('html')).toHaveAttribute('data-forja-ready','true');
 expect(await page.evaluate(()=>characterInventory().find(e=>e.itemId==='alforje').mountPartnerId)).toBeTruthy();
 expect(await page.evaluate(()=>characterInventory().find(e=>e.itemId==='alforje').unknown)).toBe(42);
});

test('estábulo: catálogo exclusivo e montaria persistida sem alterar outros parceiros',async({page})=>{
 await page.goto('/index.html');
 await page.evaluate(()=>localStorage.setItem('forja-heroi-t20-v1',JSON.stringify({identity:{characterName:'Teste',plannedLevel:5},unknown:42,partners:[{name:'Aliado',type:'guardiao',unknown:99}],arsenal:{unknown:77}})));
 await page.goto('/estabulo.html');
 await expect(page.locator('html')).toHaveAttribute('data-forja-ready','true');
 await expect(page.locator('[data-mount-card]')).toHaveCount(8);
 await expect(page.locator('.forja-unified-topbar')).toContainText('Forja Rubra — Estábulo');
 const dog=page.locator('[data-mount-card="cao_de_caca"]');
 await dog.locator('[data-size]').selectOption('Médio');
 await dog.locator('[data-tier]').selectOption('veterano');
 await dog.locator('[data-receive]').click();
 const hero=await page.evaluate(()=>JSON.parse(localStorage.getItem('forja-heroi-t20-v1')));
 expect(hero.unknown).toBe(42);expect(hero.partners[0].unknown).toBe(99);expect(hero.arsenal.unknown).toBe(77);
 expect(hero.partners[1]).toMatchObject({type:'cao_de_caca',partnerType:'Montaria',mountSize:'Médio',tier:'veterano'});
 await page.reload();await expect(page.locator('html')).toHaveAttribute('data-forja-ready','true');
 await expect(page.locator('.stable-owned')).toHaveCount(1);
 await page.screenshot({path:'docs/estabulo.png',fullPage:true});
});

test('carregamento: fundo opaco e transição de iframe lenta oculta a interface',async({page})=>{
 await page.goto('/criador.html');await expect(page.locator('html')).toHaveAttribute('data-forja-ready','true');
 let release;const gate=new Promise(resolve=>release=resolve);
 await page.route('**/taverna.html?*',async route=>{await gate;await route.continue();});
 await page.evaluate(()=>{const f=document.createElement('iframe');f.id='slowFrame';document.body.append(f);Forja.mount(f,'taverna.html',{});});
 await expect(page.locator('html')).toHaveAttribute('data-forja-loading','true');
 expect(await page.locator('#forja-loader').evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgb(8, 8, 12)');
 expect(await page.locator('.shell').evaluate(el=>getComputedStyle(el).visibility)).toBe('hidden');
 await page.screenshot({path:'docs/carregamento-opaco.png'});
 release();await expect(page.locator('html')).not.toHaveAttribute('data-forja-loading','true');
 await expect(page.locator('#forja-loader')).toBeHidden();
});

test('defesa: título dentro do quadro e redução discreta antes dos ataques',async({page})=>{
 await page.goto('/criador.html');
 await expect(page.locator('html')).toHaveAttribute('data-forja-ready','true');
 await page.evaluate(()=>{generateRandomCharacter({classId:'guerreiro',level:3});state.finished=true;state.sheetView='sheet';window.characterTotalReductionsSummary=()=> 'RD 10, RD 5/fogo';renderStage()});
 await expect(page.locator('.sheet-defense-rd')).toHaveText('Redução de Dano 10 · Redução de Dano de fogo 5');
 expect(await page.locator('.sheet-rd-label').first().evaluate(el=>getComputedStyle(el).color)).toBe(await page.locator('.sheet-defense-heading h3').evaluate(el=>getComputedStyle(el).color));
 expect(await page.locator('.sheet-rd-value').first().evaluate(el=>getComputedStyle(el).color)).toBe('rgb(255, 255, 255)');
 expect(await page.locator('.sheet-partners-title').evaluate(el=>getComputedStyle(el).color)).toBe(await page.locator('.sheet-defense-heading h3').evaluate(el=>getComputedStyle(el).color));
 expect(await page.locator('.sheet-partners-card').evaluate(el=>getComputedStyle(el).borderTopWidth)).toBe('0px');
 await expect(page.locator('.sheet-defense-heading .sheet-heading-icon svg')).toHaveCount(1);
 await expect(page.locator('.sheet-rd-label .sheet-heading-icon svg').first()).toBeVisible();
 await expect(page.locator('.sheet-attacks-heading .sheet-heading-icon svg')).toHaveCount(1);
 const buttons=await page.locator('.sheet-skills-heading button').evaluateAll(els=>els.map(el=>({width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height})));
 expect(buttons[0]).toEqual(buttons[1]);
 expect(await page.locator('.sheet-skills-heading h3').evaluate(el=>el.getBoundingClientRect().left>el.closest('aside').getBoundingClientRect().left)).toBe(true);
 const positions=await page.evaluate(()=>['.sheet-defense-heading .sheet-heading-icon','.sheet-rd-label .sheet-heading-icon','.sheet-partners-icon','.sheet-attacks-heading .sheet-heading-icon'].map(sel=>document.querySelector(sel).getBoundingClientRect().left));
 expect(Math.max(...positions)-Math.min(...positions)).toBeLessThan(2);
 expect(await page.locator('.sheet-preview-attributes').evaluate(el=>Math.abs(el.getBoundingClientRect().top-document.querySelector('.sheet-preview-skills').getBoundingClientRect().top))).toBeLessThan(2);
 expect(await page.locator('.sheet-defense-rd').evaluate(el=>getComputedStyle(el).borderTopWidth)).toBe('0px');
 expect(await page.locator('.sheet-defense-rd').evaluate(el=>Boolean(el.compareDocumentPosition(document.querySelector('.attacks'))&Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
 expect(await page.locator('.sheet-defense-heading h3').evaluate(el=>{const a=el.getBoundingClientRect(),b=el.closest('section').getBoundingClientRect();return a.left>b.left && a.right<b.right})).toBe(true);
 await page.evaluate(()=>{window.characterTotalReductionsSummary=()=> 'RD 8/frio';updateSheetEquipmentAndDefenseOnly()});
 await expect(page.locator('.sheet-defense-rd')).toHaveText('Redução de Dano de frio 8');
});


test('carregamento: recupera uma falha de transporte local sem deixar a tela bloqueada',async({page})=>{
 let requests=0;
 await page.route('**/dados/idade-complicacoes.json',async route=>{requests++;if(requests===1)await route.abort('failed');else await route.continue();});
 await page.goto('/criador.html');
 await expect(page.locator('html')).toHaveAttribute('data-forja-ready','true');
 expect(requests).toBeGreaterThanOrEqual(2);
 await expect(page.locator('#forja-loader')).toHaveCount(0);
});
