const {test,expect}=require('@playwright/test');
test('grimório: cada círculo filtra o catálogo e Todos comporta seu texto',async({page})=>{
 await page.goto('/grimorio.html');await expect(page.locator('html')).toHaveAttribute('data-forja-ready','true');
 for(const circle of [2,3,4,5,1]){
  await page.locator('.circ-btn[data-circ="'+circle+'"]').click();
  const circles=await page.locator('.card:visible').evaluateAll(cards=>[...new Set(cards.map(c=>Number(c.dataset.circulo)))]);
  expect(circles).toEqual([circle]);
 }
 await page.locator('.circ-btn[data-circ="0"]').click();
 const width=await page.locator('.circ-btn[data-circ="0"]').evaluate(el=>({client:el.clientWidth,scroll:el.scrollWidth}));expect(width.client).toBeGreaterThanOrEqual(width.scroll);
});
test('distinção: aquisição reaparece no topo e marca modifica a ficha',async({page})=>{
 await page.goto('/criador.html');await expect(page.locator('html')).toHaveAttribute('data-forja-ready','true');
 const before=await page.evaluate(()=>{generateRandomCharacter({classId:'guerreiro',level:5});state.identity.raceId='humano';state.distinctions={activeIds:[]};state.finished=true;persistNow();return {base:calculatedSkillTotal('nobreza'),int:finalAttrs().int,car:finalAttrs().car}});
 await page.goto('/distincoes.html');await expect(page.locator('html')).toHaveAttribute('data-forja-ready','true');
 await page.locator('[data-distinction-id="senador"]').click();await page.locator('#btnToggleDistinction').click();
 await page.reload();await expect(page.locator('#distinctionTitle')).toHaveText('Senador');
 await expect(page.locator('#distinctionPlaceholder')).toHaveCount(0);await expect(page.locator('#distinctionSource')).toHaveCount(0);
 await page.goto('/ficha.html');await expect(page.locator('html')).toHaveAttribute('data-forja-ready','true');
 expect(await page.evaluate(()=>calculatedSkillTotal('nobreza'))).toBe(before.base-before.int+before.car+2);
 expect(await page.evaluate(()=>progressionDistinctionOptions(4).length)).toBeGreaterThan(0);
});
test('subida de nível: cancelar restaura atributos e campos antigos após recarregar',async({page})=>{
 await page.goto('/criador.html');await expect(page.locator('html')).toHaveAttribute('data-forja-ready','true');
 const before=await page.evaluate(()=>{generateRandomCharacter({classId:'guerreiro',level:3});state.finished=true;state.completed=[1,2,3,4,5,6,7,8,9,10];state.sheetView='sheet';state.legacyUnknown={value:17};persistNow();return JSON.parse(JSON.stringify({attrs:state.identity.baseAttrs,progression:state.progression}))});
 await page.goto('/ficha.html');await expect(page.locator('html')).toHaveAttribute('data-forja-ready','true');
 await page.locator('.sheet-level-up-btn').click();await page.locator('#levelClassConfirm').click();await page.waitForURL(/criador\.html/);await expect(page.locator('html')).toHaveAttribute('data-forja-ready','true');
 await page.evaluate(()=>{state.identity.baseAttrs.int+=1;state.legacyUnknown.value=99;persistNow()});
 await page.reload();await expect(page.locator('html')).toHaveAttribute('data-forja-ready','true');
 await page.locator('#cancelLevelUpButton').click();await page.waitForURL(/ficha\.html/);await expect(page.locator('html')).toHaveAttribute('data-forja-ready','true');
 expect(await page.evaluate(()=>({attrs:state.identity.baseAttrs,progression:state.progression}))).toEqual(before);
 expect(await page.evaluate(()=>state.legacyUnknown)).toEqual({value:17});expect(await page.evaluate(()=>state.levelUpBefore)).toBeUndefined();
});
