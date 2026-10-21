const {test,expect}=require('@playwright/test');
test('taverna: poção encaminha ao Grimório da ficha',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/criador.html');await expect(page.locator('html')).toHaveAttribute('data-forja-ready','true');
 await page.evaluate(()=>{generateRandomCharacter({classId:'guerreiro',level:3});state.finished=true;state.sheetView='sheet';persistNow()});
 await page.goto('/ficha.html');await expect(page.locator('html')).toHaveAttribute('data-forja-ready','true');
 await page.locator('[data-sheet-action="tavern"]').first().click();
 const tavern=page.frameLocator('#characterTavern');await expect(tavern.locator('html')).toHaveAttribute('data-forja-ready','true');
 await tavern.locator('[data-category="cuidados"]').click();
 await tavern.locator('#tavernPotionCircleSelect').selectOption('2');
 await tavern.locator('#btnTavernChoosePotionSpell').click();
 await expect(page.locator('#spellGrimoire')).toBeVisible();
 expect(await page.evaluate(()=>({source:spellState().grimoireSource,purchase:state.tavernPotionPurchase}))).toEqual({source:'tavern-potion',purchase:{circle:2,price:270}});
 expect(errors).toEqual([]);
});

test('taverna independente: poção abre seleção integrada sem cobrar ao navegar',async({page})=>{
 await page.goto('/criador.html');await expect(page.locator('html')).toHaveAttribute('data-forja-ready','true');
 const spent=await page.evaluate(()=>{generateRandomCharacter({classId:'guerreiro',level:3});state.finished=true;state.sheetView='sheet';persistNow();return state.finances.spent});
 await page.goto('/taverna.html');await expect(page.locator('html')).toHaveAttribute('data-forja-ready','true');
 await page.locator('[data-category="cuidados"]').click();
 await page.locator('#tavernPotionCircleSelect').selectOption('2');
 await page.locator('#btnTavernChoosePotionSpell').click();
 await page.waitForURL(/ficha\.html/);await expect(page.locator('html')).toHaveAttribute('data-forja-ready','true');
 await expect(page.locator('#spellGrimoire')).toBeVisible();
 expect(await page.evaluate(()=>state.tavernPotionPurchase)).toEqual({circle:2,price:270});
 expect(await page.evaluate(()=>state.finances.spent)).toBe(spent);
 await expect(page.frameLocator('#spellGrimoire').locator('html')).toHaveAttribute('data-forja-ready','true');
 await page.reload();await expect(page.locator('#spellGrimoire')).toBeVisible();
});
