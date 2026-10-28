function heldItemRecords(){
  const eq=equipmentState(),inventory=characterInventory();
  const catalog=typeof getEquipmentCatalog==='function'?getEquipmentCatalog():(typeof getPdfItemsCatalog==='function'?getPdfItemsCatalog():new Map((DATA.pdfItems||[]).map(item=>[item.id,item])));
  const usedIndices = new Set();
  return [eq.weaponId,eq.offhandId,eq.shieldId].filter(id=>id&&id!=='none').map(id=>{
    let entryIndex = inventory.findIndex((e,i)=>!usedIndices.has(i) && (e.instanceId === id || equipEntryId(e,i) === id));
    if (entryIndex < 0) {
      entryIndex = inventory.findIndex((e,i)=>!usedIndices.has(i) && (typeof matchEquipmentEntry==='function'?matchEquipmentEntry(e,i,id):equipEntryId(e,i)===id));
    }
    if (entryIndex >= 0) usedIndices.add(entryIndex);
    const entry = entryIndex >= 0 ? inventory[entryIndex] : null;
    let item=catalog.get?catalog.get(entry?.itemId):null;
    const att = entry?.attachedItem || entry?.engenhocaInfo?.attachedItem;
    if(!item && entry && (entry.tipo==='arma'||entry.tipo==='engenhoca'||entry.isEngenhoca||entry.formaUso==='empunhada'||att?.tipo==='arma'||/espada|machado|maca|arco|besta|adaga/i.test(entry.displayName||entry.itemName||att?.nome||''))){
      item={
        id:entry.itemId,
        nome:entry.displayName||entry.itemName||att?.nome||'Arma',
        tipo:entry.tipo||'arma',
        arma:entry.arma||att?.arma||null,
        espacos:entry.espacos||att?.espacos||1
      };
    } else if(!item && entry && (entry.tipo==='escudo'||entry.escudo||att?.tipo==='escudo')){
      item={
        id:entry.itemId,
        nome:entry.displayName||entry.itemName||att?.nome||'Escudo',
        tipo:'escudo',
        escudo:entry.escudo||att?.escudo||{bonusDefesa:entry.defesa||1,penalidade:0},
        espacos:entry.espacos||1
      };
    } else if(!item && entry){
      item={
        id:entry.itemId,
        nome:entry.displayName||entry.itemName||'Item',
        tipo:entry.tipo||'item_geral',
        espacos:entry.espacos||1
      };
    }
    const grip=(item?.arma?.propriedadesIds||[]).includes('adaptavel')?(eq.adaptableHandedness[id]||'uma_mao'):(item?.arma?.empunhaduraId||'uma_mao');
    return {id,entry,item,grip};
  }).filter(record=>record.entry&&record.item);
}
function singleWeaponStyleActive(entry){
  const held=heldItemRecords();
  if(held.length!==1)return false;
  const record=held[0];
  return record.item.tipo==='arma'&&record.item.arma?.combateId!=='a_distancia'&&record.item.id!=='ataque_desarmado'&&record.grip!=='duas_maos'&&(!entry||entry===record.entry||entry.uid&&entry.uid===record.entry.uid||entry.instanceId&&entry.instanceId===record.entry.instanceId||JSON.stringify(entry)===JSON.stringify(record.entry));
}
function twoHandedWeaponStyleActive(entry){
  const held=heldItemRecords();
  if(held.length!==1)return false;
  const record=held[0];
  return record.item.tipo==='arma'&&record.item.arma?.combateId!=='a_distancia'&&record.item.id!=='ataque_desarmado'&&record.grip==='duas_maos'&&record.item.arma?.empunhaduraId!=='leve'&&(!entry||entry===record.entry||entry.uid&&entry.uid===record.entry.uid||entry.instanceId&&entry.instanceId===record.entry.instanceId||JSON.stringify(entry)===JSON.stringify(record.entry));
}
function weaponAndShieldStyleActive(){
  const held=heldItemRecords();
  if(held.length!==2)return false;
  const hasWeapon=held.some(r=>r.item?.tipo==='arma'&&r.item.id!=='ataque_desarmado'&&r.grip!=='duas_maos');
  const hasShield=held.some(r=>r.item?.tipo==='escudo'||Boolean(r.item?.escudo));
  return hasWeapon&&hasShield;
}
function dualWeaponAttackReady(){
  const held=heldItemRecords();
  const hasBigOffhand=characterHasFeature('arma_secundaria_grande')||characterHasFeature('arma_maior')||characterHasFeature('arma_secundaria');
  return held.length===2&&held.every(r=>r.item.tipo==='arma'&&r.grip!=='duas_maos')&&(hasBigOffhand||held.some(r=>r.grip==='leve'))&&characterHasFeature('estilo_de_duas_armas');
}
function isOffhandWeaponEquipped(){return heldItemRecords().some(r=>r.id===equipmentState().offhandId)}
