document.addEventListener('click',event=>{
  const btn=event.target.closest('[data-equip-action]');if(!btn)return;
  event.preventDefault();event.stopImmediatePropagation();
  const action=btn.dataset.equipAction,rawId=btn.dataset.entryId,eq=equipmentState();
  const inventory=characterInventory();
  const entryIndex=inventory.findIndex((e,i)=>(typeof matchEquipmentEntry==='function'?matchEquipmentEntry(e,i,rawId):equipEntryId(e,i)===rawId));
  const entry=entryIndex>=0?inventory[entryIndex]:null;
  const id=entry?equipEntryId(entry,entryIndex):rawId;

  let blocksShield=false,tattoo=false,handSlot='weaponId';
  if(action==='equip-mount-gear'&&entry){
    const mountPartner=(state.partners||[]).find(p=>typeof mountRecord==='function'&&mountRecord(p));
    if(!mountPartner){toast('Você não possui uma montaria nos parceiros.');return}
    const m=mountRecord(mountPartner);
    const gear=typeof mountGear==='function'?mountGear(mountPartner):inventory.filter(e=>e.mountPartnerId===m.id);
    if(gear.length>=2){toast('A montaria já está usando o limite de 2 itens.');return}
    if(entry.itemId==='alforje'&&!gear.some(e=>e.itemId==='sela')){toast('É necessário ter uma sela equipada antes do alforje.');return}
    if(typeof RegrasMontarias!=='undefined'){
      const err=RegrasMontarias.validarEquipamentoMontaria(gear.map(e=>RegrasMontarias.tipoEquipamentoAnimal(e.itemId)),RegrasMontarias.tipoEquipamentoAnimal(entry.itemId),m.species==='grifo'&&m.tier!=='iniciante');
      if(err){toast(err);return}
    }
    entry.mountPartnerId=m.id;
    if(typeof saveMountChange==='function')saveMountChange(inventory);
    else{persist();renderStage()}
    toast(`Equipou ${entry.itemName||entry.itemId} na montaria.`);
    return;
  }
  if(action==='unequip-mount-gear'&&entry){
    const mountPartner=(state.partners||[]).find(p=>typeof mountRecord==='function'&&mountRecord(p));
    const gear=mountPartner&&typeof mountGear==='function'?mountGear(mountPartner):[];
    if(entry.itemId==='sela'&&gear.some(e=>e.itemId==='alforje')){toast('Retire o alforje antes da sela.');return}
    delete entry.mountPartnerId;
    if(typeof saveMountChange==='function')saveMountChange(inventory);
    else{persist();renderStage()}
    toast('Item retirado da montaria.');
    return;
  }
  let equipId = id;
  if(entry && Number(entry.quantity || 1) > 1 && ['equip-weapon','equip-shield','equip-armor','equip-trailer','equip-accessory'].includes(action)){
    entry.quantity = Number(entry.quantity) - 1;
    const singleEntry = {
      ...entry,
      quantity: 1,
      instanceId: 'inst_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)
    };
    inventory.push(singleEntry);
    equipId = singleEntry.instanceId;
    const saved = typeof arsenalState === 'function' ? arsenalState() : null;
    const profKey = typeof ARSENAL_PROFILES_KEY !== 'undefined' ? ARSENAL_PROFILES_KEY : 'arsenal-arton-character-profiles-v1';
    if(saved?.storage?.[profKey] && typeof RegrasInventario?.atualizarPerfis === 'function'){
      saved.storage[profKey] = RegrasInventario.atualizarPerfis(saved.storage[profKey], bp => {
        bp.splice(0, bp.length, ...inventory);
      });
    }
  }

  if(action==='equip-shield'){
    // Se a Mão 1 tem arma adaptável em duas mãos, adapta para 1 mão para liberar a Mão 2 para o escudo
    if(eq.weaponId && eq.weaponId !== 'none'){
      const wepEntry = inventory.find((e, i) => matchEquipmentEntry(e, i, eq.weaponId));
      const itemCatalog = typeof getEquipmentCatalog === 'function' ? getEquipmentCatalog() : null;
      const wepItem = itemCatalog?.get ? itemCatalog.get(wepEntry?.itemId) : (DATA.pdfItems || []).find(it => it.id === wepEntry?.itemId);
      const isAdaptable = Boolean(wepItem?.arma?.propriedadesIds?.includes('adaptavel') || wepItem?.arma?.empunhaduraId === 'adaptavel');
      const isStrictTwoHanded = !isAdaptable && (wepItem?.arma?.empunhaduraId === 'duas_maos' || (wepItem?.arma?.propriedadesIds || []).includes('duas_maos'));
      if(isAdaptable){
        eq.adaptableHandedness = { ...eq.adaptableHandedness, [eq.weaponId]: 'uma_mao' };
      }else if(isStrictTwoHanded){
        eq.weaponId = 'none';
      }
    }
    // Se a Mão 2 já tem um item empunhado, guarda na mochila para equipar o escudo
    if(eq.offhandId && eq.offhandId !== 'none'){
      eq.offhandId = 'none';
    }
    blocksShield = false;
  }
  if(action==='set-handedness-two'){
    if(eq.offhandId===equipId){eq.weaponId=equipId;eq.offhandId='none';}
    else if(eq.offhandId&&eq.offhandId!=='none'){eq.offhandId='none';}
    if(eq.shieldId&&eq.shieldId!=='none'){eq.shieldId='none';}
  }
  if(action==='equip-weapon'){
    if(eq.weaponId === equipId || eq.offhandId === equipId) return;

    const itemCatalog=typeof getEquipmentCatalog==='function'?getEquipmentCatalog():(typeof getPdfItemsCatalog==='function'?getPdfItemsCatalog():new Map((DATA.pdfItems||[]).map(i=>[i.id,i])));
    const item=itemCatalog.get?itemCatalog.get(entry?.itemId):(DATA.pdfItems||[]).find(it=>it.id===entry?.itemId);
    const isAdaptable = Boolean(item?.arma?.propriedadesIds?.includes('adaptavel') || item?.arma?.empunhaduraId === 'adaptavel');
    const isStrictTwoHanded = !isAdaptable && (item?.arma?.empunhaduraId === 'duas_maos' || (item?.arma?.propriedadesIds || []).includes('duas_maos'));

    const hasHand1 = Boolean(eq.weaponId && eq.weaponId !== 'none');
    const hasShield = Boolean(eq.shieldId && eq.shieldId !== 'none');
    const hasOffhand = Boolean(eq.offhandId && eq.offhandId !== 'none');
    const hasHand2 = hasShield || hasOffhand;

    if (isStrictTwoHanded) {
      if(eq.offhandId && eq.offhandId !== 'none') eq.offhandId = 'none';
      if(eq.shieldId && eq.shieldId !== 'none') eq.shieldId = 'none';
      handSlot = 'weaponId';
      blocksShield = true;
    } else if (isAdaptable) {
      if (!hasHand1 && !hasHand2) {
        eq.adaptableHandedness = { ...eq.adaptableHandedness, [equipId]: 'duas_maos' };
        handSlot = 'weaponId';
        blocksShield = false;
      } else if (!hasHand1 && hasHand2) {
        eq.adaptableHandedness = { ...eq.adaptableHandedness, [equipId]: 'uma_mao' };
        handSlot = 'weaponId';
        blocksShield = false;
      } else if (hasHand1 && !hasHand2) {
        const hand1Entry = inventory.find((e, i) => matchEquipmentEntry(e, i, eq.weaponId));
        const hand1Item = itemCatalog.get ? itemCatalog.get(hand1Entry?.itemId) : (DATA.pdfItems || []).find(it => it.id === hand1Entry?.itemId);
        const hand1Adaptable = Boolean(hand1Item?.arma?.propriedadesIds?.includes('adaptavel') || hand1Item?.arma?.empunhaduraId === 'adaptavel');
        if (hand1Adaptable) {
          eq.adaptableHandedness = { ...eq.adaptableHandedness, [eq.weaponId]: 'uma_mao', [equipId]: 'uma_mao' };
          handSlot = 'offhandId';
        } else {
          const hand1TwoHanded = hand1Item?.arma?.empunhaduraId === 'duas_maos' || (hand1Item?.arma?.propriedadesIds || []).includes('duas_maos');
          if (hand1TwoHanded) {
            eq.weaponId = 'none';
            eq.adaptableHandedness = { ...eq.adaptableHandedness, [equipId]: 'duas_maos' };
            handSlot = 'weaponId';
          } else {
            eq.adaptableHandedness = { ...eq.adaptableHandedness, [equipId]: 'uma_mao' };
            handSlot = 'offhandId';
          }
        }
        blocksShield = false;
      } else {
        eq.adaptableHandedness = { ...eq.adaptableHandedness, [equipId]: 'uma_mao' };
        handSlot = 'weaponId';
        blocksShield = false;
      }
    } else {
      if (!hasHand1) {
        handSlot = 'weaponId';
      } else if (!hasHand2) {
        const hand1Entry = inventory.find((e, i) => matchEquipmentEntry(e, i, eq.weaponId));
        const hand1Item = itemCatalog.get ? itemCatalog.get(hand1Entry?.itemId) : (DATA.pdfItems || []).find(it => it.id === hand1Entry?.itemId);
        const hand1Adaptable = Boolean(hand1Item?.arma?.propriedadesIds?.includes('adaptavel') || hand1Item?.arma?.empunhaduraId === 'adaptavel');
        if (hand1Adaptable && eq.adaptableHandedness[eq.weaponId] === 'duas_maos') {
          eq.adaptableHandedness = { ...eq.adaptableHandedness, [eq.weaponId]: 'uma_mao' };
          handSlot = 'offhandId';
        } else {
          const hand1TwoHanded = hand1Item?.arma?.empunhaduraId === 'duas_maos' || (hand1Item?.arma?.propriedadesIds || []).includes('duas_maos');
          if (hand1TwoHanded) {
            eq.weaponId = 'none';
            handSlot = 'weaponId';
          } else {
            handSlot = 'offhandId';
          }
        }
      } else {
        handSlot = 'weaponId';
      }
      blocksShield = false;
    }
  }
  if(action==='reveal-tattoo'||action==='equip-accessory'){
    const itemCatalog=typeof getEquipmentCatalog==='function'?getEquipmentCatalog():(typeof getPdfItemsCatalog==='function'?getPdfItemsCatalog():new Map((DATA.pdfItems||[]).map(i=>[i.id,i])));
    const item=itemCatalog.get?itemCatalog.get(entry?.itemId):(DATA.pdfItems||[]).find(it=>it.id===entry?.itemId);
    tattoo=isTattooItem(item,entry);
  }
  const result=RegrasEquipamento.aplicar(eq,action,equipId,{limit:wornItemsLimit()+(action==='equip-accessory'&&mochilaEntryIsenta(entry,getEquipmentCatalog().get(entry?.itemId))?1:0),count:wornItemsCount(),blocksShield,tattoo,handSlot,dualReady:action==='toggle-dual-attack'&&dualWeaponAttackReady()});
  if(result.alterado){
    Object.assign(eq,result.equipment);
    if(typeof sincronizarViolacaoArmaFundamentalista==='function'){
      sincronizarViolacaoArmaFundamentalista({notify:true});
    }
    persist();
    if(typeof state!=='undefined'&&state?.finished&&typeof scheduleSaveFinishedCharacter==='function')scheduleSaveFinishedCharacter();
    renderStage();
  }
  if(result.message)toast(result.message);
},true);
