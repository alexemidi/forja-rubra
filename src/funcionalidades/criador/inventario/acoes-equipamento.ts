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
  if(action==='equip-shield')blocksShield=equippedWeaponBlocksShield();
  if(action==='set-handedness-two'){
    if(heldItemRecords().some(r=>r.id!==id)){toast('Guarde o item da outra mão antes de usar duas mãos.');return}
    if(eq.offhandId===id){eq.weaponId=id;eq.offhandId='none'}
  }
  if(action==='equip-weapon'){
    const held=heldItemRecords();
    if(held.some(r=>r.id===id))return;
    if(held.reduce((n,r)=>n+(r.grip==='duas_maos'?2:1),0)>=2){toast('As duas mãos estão ocupadas. Guarde um item antes.');return}
    if(eq.weaponId&&eq.weaponId!=='none')handSlot='offhandId';
    const itemCatalog=typeof getEquipmentCatalog==='function'?getEquipmentCatalog():(typeof getPdfItemsCatalog==='function'?getPdfItemsCatalog():new Map((DATA.pdfItems||[]).map(i=>[i.id,i])));
    const item=itemCatalog.get?itemCatalog.get(entry?.itemId):(DATA.pdfItems||[]).find(it=>it.id===entry?.itemId);
    const isWeapon=item?.tipo==='arma'||item?.tipo==='esoterico'||item?.categoriaId==='esoterico'||item?.tipo==='instrumento'||item?.categoriaId==='instrumento'||item?.tipo==='engenhoca'||Boolean(entry?.isEngenhoca)||entry?.formaUso==='empunhada'||/instrumento/i.test(item?.nome||'');
    const handedness=(item?.arma?.propriedadesIds||[]).includes('adaptavel')?(eq.adaptableHandedness[id]||'uma_mao'):(item?.arma?.empunhaduraId||'uma_mao');
    blocksShield=!!isWeapon&&handedness==='duas_maos';
    if(blocksShield&&held.length){toast('Guarde o outro item antes de empunhar com duas mãos.');return}
  }
  if(action==='reveal-tattoo'||action==='equip-accessory'){
    const itemCatalog=typeof getEquipmentCatalog==='function'?getEquipmentCatalog():(typeof getPdfItemsCatalog==='function'?getPdfItemsCatalog():new Map((DATA.pdfItems||[]).map(i=>[i.id,i])));
    const item=itemCatalog.get?itemCatalog.get(entry?.itemId):(DATA.pdfItems||[]).find(it=>it.id===entry?.itemId);
    tattoo=isTattooItem(item,entry);
  }
  const result=RegrasEquipamento.aplicar(eq,action,id,{limit:wornItemsLimit()+(action==='equip-accessory'&&mochilaEntryIsenta(entry,getEquipmentCatalog().get(entry?.itemId))?1:0),count:wornItemsCount(),blocksShield,tattoo,handSlot,dualReady:action==='toggle-dual-attack'&&dualWeaponAttackReady()});
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
