function bonusPoderesCarga(){return RegrasMochilas.bonusPoderesCarga(selectedCharacterFeatures());}
function poderesCarga(){return (typeof selectedCharacterFeatures==='function'?selectedCharacterFeatures():[]).map(p=>(p.id||'')+' '+(p.nome||''));}
function mochilaEntryIsenta(entry,item){return RegrasMochilas.mochilaIsenta(RegrasMochilas.tipoMochila(entry?.itemId||item?.id||'',item?.nome||entry?.displayName||''),poderesCarga());}
function mochilasVestidas(){const eq=equipmentState(),catalog=getEquipmentCatalog();return characterInventory().flatMap((e,i)=>(eq.wornIds||[]).some(id=>matchEquipmentEntry(e,i,id))?[RegrasMochilas.tipoMochila(e.itemId,catalog.get(e.itemId)?.nome||e.itemName||e.displayName||'')]:[]);}

/**
 * Localiza de forma resiliente se uma entrada do inventário corresponde ao ID de equipamento alvo.
 */
function matchEquipmentEntry(entry, index, targetId) {
  if (!entry || !targetId || targetId === 'none') return false;
  if (typeof equipEntryId === 'function' && equipEntryId(entry, index) === targetId) return true;
  if (entry.instanceId && entry.instanceId === targetId) return true;
  if (entry.uid && entry.uid === targetId) return true;
  if (entry.id && entry.id === targetId) return true;
  if (entry.contraptionId && entry.contraptionId === targetId) return true;
  if (entry.itemId && entry.itemId === targetId) return true;
  if (typeof targetId === 'string') {
    if (targetId.startsWith('inst_')) {
      const stripped = targetId.slice(5);
      if (entry.itemId === stripped || entry.id === stripped || entry.contraptionId === stripped) return true;
    }
    if (entry.instanceId && entry.instanceId.startsWith('inst_')) {
      const stripped = entry.instanceId.slice(5);
      if (stripped === targetId) return true;
    }
    if (targetId.includes(':')) {
      const [targetItemBase] = targetId.split(':');
      if (targetItemBase && (entry.itemId === targetItemBase || entry.id === targetItemBase)) return true;
    }
  }
  return false;
}

/**
 * Auto-equipa os itens padrão na primeira visualização da ficha ou limpa referências obsoletas.
 */
function initEquipmentState(){
  if(initializingEquipment)return;
  initializingEquipment=true;
  try{
    const eq=equipmentState(),catalog=getEquipmentCatalog(),inventory=characterInventory();

    // Auto-equipa armadura se ainda não houver armadura selecionada (nem guardada com 'none')
    if(eq.armorId===null||eq.armorId===undefined){
      const armorEntry=inventory.find((e,i)=>catalog.get(e.itemId)?.tipo==='armadura'||e.tipo==='armadura'||e.armadura||e.attachedItem?.tipo==='armadura');
      if(armorEntry)eq.armorId=equipEntryId(armorEntry,inventory.indexOf(armorEntry));
    }else if(eq.armorId!=='none'){
      const armorEntry=inventory.find((e,i)=>matchEquipmentEntry(e,i,eq.armorId));
      if(armorEntry){
        eq.armorId=equipEntryId(armorEntry,inventory.indexOf(armorEntry));
      }else{
        eq.armorId=null;
      }
    }

    // Auto-equipa arma seguindo a hierarquia: exótica > marcial > simples
    if(eq.weaponId===null||eq.weaponId===undefined){
      const weaponEntry=findHighestRankWeaponEntry(inventory,catalog);
      if(weaponEntry)eq.weaponId=equipEntryId(weaponEntry,inventory.indexOf(weaponEntry));
    }else if(eq.weaponId!=='none'){
      const weaponEntry=inventory.find((e,i)=>matchEquipmentEntry(e,i,eq.weaponId));
      if(weaponEntry){
        eq.weaponId=equipEntryId(weaponEntry,inventory.indexOf(weaponEntry));
      }else{
        eq.weaponId=null;
      }
    }

    // Checar se a arma equipada é de duas mãos
    let isTwoHanded=false;
    if(eq.weaponId&&eq.weaponId!=='none'){
      const wepEntry=inventory.find((e,i)=>matchEquipmentEntry(e,i,eq.weaponId));
      const wepItem=wepEntry?catalog.get(wepEntry.itemId):null;
      if(wepItem?.arma?.empunhaduraId==='duas_maos'){
        isTwoHanded=true;
      }else if((wepItem?.arma?.propriedadesIds||[]).includes('adaptavel')&&eq.adaptableHandedness[eq.weaponId]==='duas_maos'){
        isTwoHanded=true;
      }
    }

    if(eq.offhandId&&eq.offhandId!=='none'){
      const offEntry=inventory.find((e,i)=>matchEquipmentEntry(e,i,eq.offhandId));
      if(offEntry) eq.offhandId=equipEntryId(offEntry,inventory.indexOf(offEntry));
      else eq.offhandId='none';
    }
    if(eq.offhandId&&eq.offhandId!=='none')eq.shieldId='none';

    // Auto-equipa escudo se permitido
    if(isTwoHanded){
      if(eq.shieldId&&eq.shieldId!=='none')eq.shieldId='none';
    }else if(eq.shieldId===null||eq.shieldId===undefined){
      const shieldEntry=inventory.find((e,i)=>catalog.get(e.itemId)?.tipo==='escudo'||e.tipo==='escudo'||e.escudo||e.attachedItem?.tipo==='escudo');
      if(shieldEntry)eq.shieldId=equipEntryId(shieldEntry,inventory.indexOf(shieldEntry));
    }else if(eq.shieldId!=='none'){
      const shieldEntry=inventory.find((e,i)=>matchEquipmentEntry(e,i,eq.shieldId));
      if(shieldEntry){
        eq.shieldId=equipEntryId(shieldEntry,inventory.indexOf(shieldEntry));
      }else{
        eq.shieldId=null;
      }
    }

    // Auto-equipa traje
    if(eq.trailerId===null||eq.trailerId===undefined){
      const trajeEntry=inventory.find((e,i)=>{
        const item=catalog.get(e.itemId);
        return (item&&item.tipo==='item_geral'&&/(traje|camisa)/i.test(item.nome))||e.tipo==='traje'||e.attachedItem?.tipo==='traje'||/(traje|camisa)/i.test(e.displayName||e.itemName||'');
      });
      if(trajeEntry)eq.trailerId=equipEntryId(trajeEntry,inventory.indexOf(trajeEntry));
    }else if(eq.trailerId!=='none'){
      const trajeEntry=inventory.find((e,i)=>matchEquipmentEntry(e,i,eq.trailerId));
      if(trajeEntry){
        eq.trailerId=equipEntryId(trajeEntry,inventory.indexOf(trajeEntry));
      }else{
        eq.trailerId=null;
      }
    }

    if(!Array.isArray(eq.wornIds))eq.wornIds=[];
    eq.wornIds=eq.wornIds.map(id=>{
      if(!id||id==='none')return null;
      const found=inventory.find((e,i)=>matchEquipmentEntry(e,i,id));
      return found?equipEntryId(found,inventory.indexOf(found)):null;
    }).filter(Boolean);

    if(!eq.mochilaComumMigrada){
      const comum=inventory.find(e=>RegrasMochilas.tipoMochila(e.itemId,catalog.get(e.itemId)?.nome||e.itemName||e.displayName||"")==="comum");
      if(comum){const id=equipEntryId(comum,inventory.indexOf(comum));if(!eq.wornIds.includes(id))eq.wornIds.push(id);}
      eq.mochilaComumMigrada=true;
    }
    for(const id of Object.keys(eq.adaptableHandedness)){
      const found=inventory.find((e,i)=>matchEquipmentEntry(e,i,id));
      if(!found)delete eq.adaptableHandedness[id];
    }
  }finally{
    initializingEquipment=false;
  }
}

// ── Capacidade de Itens Vestidos ─────────────────────────────────────────────
/** Retorna true se o item é uma tatuagem mística. */
function isTattooItem(item, entry){
  const name = (entry?.displayName || entry?.options?.customName || entry?.itemName || item?.nome || entry?.itemId || item?.id || '');
  if(/tatuagem/i.test(name))return true;
  if(!item)return false;
  return Boolean(item.categoriaId==='tatuagem'||item.tipo==='tatuagem'||item.equipamento?.tatuagem);
}

/** Retorna true se o item é do tipo vestível (armadura, traje, tatuagem mística, vestuário ou acessório). Mochilas são vestíveis; isenções e armação seguem o módulo de regras. */
function isWearableItem(item, entry){
  if(RegrasMontarias.tipoEquipamentoAnimal(entry?.itemId||item?.id||''))return false;
  const name = (entry?.displayName || entry?.options?.customName || entry?.itemName || item?.nome || entry?.itemId || item?.id || '');
  if(RegrasMochilas.tipoMochila(entry?.itemId||item?.id||"",item?.nome||name))return true;
  if(item?.tipo==='armadura')return true;
  if(isTattooItem(item, entry))return true;
  if(item?.categoriaId==='vestuario')return true;
  if(item?.equipamento?.itemVestido)return true;
  if(/traje|camisa|veste|vestimenta|manto|capa|chapeu|chapéu|colar|anel|bota|luva|faixa|cinto|elmo|tiara|amuleto|medalhao|medalhote|gorro|túnica|sobretudo|braçadeira/i.test(name))return true;
  return false;
}

/** Retorna o limite de itens que o personagem pode vestir simultaneamente (regra básica: 4). */
function wornItemsLimit(){
  let limit=4;
  if(RegrasMochilas.possuiPoderCarga(poderesCarga(),"organizadinhos"))limit++;
  const powers=typeof selectedCharacterFeatures==='function'?selectedCharacterFeatures():[];
  for(const p of powers){
    const text=slug(p.nome+' '+(p.descricao||''));
    if(/mais.*itens? vestidos?|aumenta.*limite.*vestir/i.test(text))limit+=1;
  }
  return limit;
}

/** Retorna a quantidade de itens atualmente vestidos pelo personagem (mochilas não contam no limite). */
function wornItemsCount(){
  const eq=equipmentState();
  let count=0;
  if(eq.armorId&&eq.armorId!=='none')count++;
  if(eq.trailerId&&eq.trailerId!=='none')count++;
  if(Array.isArray(eq.wornIds)){
    count+=eq.wornIds.filter(id=>id&&id!=='none').length;
  }
  const inv=characterInventory(),catalog=getEquipmentCatalog();
  count-=(eq.wornIds||[]).filter(id=>{const i=inv.findIndex((e,n)=>matchEquipmentEntry(e,n,id));return i>=0&&mochilaEntryIsenta(inv[i],catalog.get(inv[i].itemId))}).length;
  return count;
}

function getEquipmentCatalog() {
  if (typeof getPdfItemsCatalog === 'function') {
    return getPdfItemsCatalog();
  }
  const customList = (typeof state !== 'undefined' && state?.customItems) || [];
  const baseItems = (typeof DATA !== 'undefined' && DATA?.pdfItems) || [];
  const map = new Map();
  for (let i = 0; i < baseItems.length; i++) map.set(baseItems[i].id, baseItems[i]);
  for (let i = 0; i < customList.length; i++) map.set(customList[i].id, customList[i]);
  return map;
}

// ── Consultas de Equipamento ────────────────────────────────────────────────
/** Retorna a entrada e item da armadura equipada, ou null se desequipada/guardada. */
function equippedArmorRecord(){
  initEquipmentState();
  const eq=equipmentState(),catalog=getEquipmentCatalog(),inventory=characterInventory();
  if(!eq.armorId||eq.armorId==='none')return null;
  const entry=inventory.find((e,i)=>matchEquipmentEntry(e,i,eq.armorId));
  if(!entry)return null;
  let item=catalog.get(entry.itemId);
  const att = entry.attachedItem || entry.engenhocaInfo?.attachedItem;
  if(!item && (entry.tipo==='armadura'||entry.armadura||att?.tipo==='armadura'||att?.armadura||/armadura|gibao|gibão|cota|couraça|couraca|brunea|brúnea/i.test(entry.displayName||entry.itemName||att?.nome||''))){
    item={
      id:entry.itemId,
      nome:entry.displayName||entry.itemName||att?.nome||'Armadura',
      tipo:'armadura',
      armadura:entry.armadura||att?.armadura||{defesa:entry.defesa||att?.defesa||0,penalidade:entry.penalidade||att?.penalidade||0},
      espacos:entry.espacos||att?.espacos||2
    };
  }
  const isArmor=item?.tipo==='armadura'||entry.tipo==='armadura'||Boolean(entry.armadura)||att?.tipo==='armadura'||Boolean(att?.armadura);
  return isArmor?{entry,item:(item||entry)}:null;
}
function equippedArmorItem(){return equippedArmorRecord()?.item||null}

/** Retorna a entrada e item do escudo equipado, ou null se desequipado/guardado. */
function equippedShieldRecord(){
  initEquipmentState();
  const eq=equipmentState(),catalog=getEquipmentCatalog(),inventory=characterInventory();
  if(!eq.shieldId||eq.shieldId==='none'||equippedWeaponBlocksShield())return null;
  const entry=inventory.find((e,i)=>matchEquipmentEntry(e,i,eq.shieldId));
  if(!entry)return null;
  let item=catalog.get(entry.itemId);
  const att = entry.attachedItem || entry.engenhocaInfo?.attachedItem;
  if(!item && (entry.tipo==='escudo'||entry.escudo||att?.tipo==='escudo'||att?.escudo||/escudo/i.test(entry.displayName||entry.itemName||att?.nome||''))){
    item={
      id:entry.itemId,
      nome:entry.displayName||entry.itemName||att?.nome||'Escudo',
      tipo:'escudo',
      escudo:entry.escudo||att?.escudo||{bonusDefesa:entry.defesa||att?.defesa||1,penalidade:entry.penalidade||0},
      espacos:entry.espacos||att?.espacos||1
    };
  }
  const isShield=item?.tipo==='escudo'||entry.tipo==='escudo'||Boolean(entry.escudo)||att?.tipo==='escudo'||Boolean(att?.escudo);
  return isShield?{entry,item:(item||entry)}:null;
}
function equippedShieldItem(){return equippedShieldRecord()?.item||null}
function isShieldEquipped(){return Boolean(equippedShieldRecord())}

/** Retorna a entrada e item da arma equipada na mão, ou null se guardada. */
function equippedWeaponRecord(){
  const eq=equipmentState(),catalog=getEquipmentCatalog(),inventory=characterInventory();
  if(!eq.weaponId||eq.weaponId==='none')return null;
  const entry=inventory.find((e,i)=>matchEquipmentEntry(e,i,eq.weaponId));
  if(!entry)return null;
  let item=catalog.get(entry.itemId);
  const att = entry.attachedItem || entry.engenhocaInfo?.attachedItem;
  if(!item && (entry.tipo==='arma'||entry.tipo==='engenhoca'||entry.isEngenhoca||entry.formaUso==='empunhada'||att?.tipo==='arma'||/espada|machado|maca|arco|besta/i.test(entry.displayName||entry.itemName||att?.nome||''))){
    item={
      id:entry.itemId,
      nome:entry.displayName||entry.itemName||att?.nome||'Arma',
      tipo:entry.tipo||'arma',
      arma:entry.arma||att?.arma||null,
      espacos:entry.espacos||att?.espacos||1
    };
  }
  const isWeapon=item?.tipo==='arma'||item?.tipo==='esoterico'||item?.categoriaId==='esoterico'||entry.tipo==='arma'||entry.tipo==='engenhoca'||entry.isEngenhoca||entry.formaUso==='empunhada'||att?.tipo==='arma';
  return isWeapon?{entry,item:(item||entry)}:null;
}
function equippedWeaponItem(){return equippedWeaponRecord()?.item||null}

/** Retorna a entrada e item da arma ou engenhoca equipada na outra mão, ou null se desocupada. */
function equippedOffhandRecord(){
  const eq=equipmentState(),catalog=getEquipmentCatalog(),inventory=characterInventory();
  if(!eq.offhandId||eq.offhandId==='none')return null;
  const entry=inventory.find((e,i)=>matchEquipmentEntry(e,i,eq.offhandId));
  if(!entry)return null;
  let item=catalog.get(entry.itemId);
  const att = entry.attachedItem || entry.engenhocaInfo?.attachedItem;
  if(!item && (entry.tipo==='arma'||entry.tipo==='engenhoca'||entry.isEngenhoca||entry.formaUso==='empunhada'||att?.tipo==='arma'||/espada|machado|maca|arco|besta|adaga/i.test(entry.displayName||entry.itemName||att?.nome||''))){
    item={
      id:entry.itemId,
      nome:entry.displayName||entry.itemName||att?.nome||'Item empunhado',
      tipo:entry.tipo||att?.tipo||'arma',
      arma:entry.arma||att?.arma||null,
      espacos:entry.espacos||att?.espacos||1
    };
  } else if(!item){
    item={
      id:entry.itemId,
      nome:entry.displayName||entry.itemName||'Item',
      tipo:entry.tipo||'item_geral',
      espacos:entry.espacos||1
    };
  }
  const id=equipEntryId(entry,inventory.indexOf(entry));
  const grip=(item?.arma?.propriedadesIds||[]).includes('adaptavel')?(eq.adaptableHandedness[eq.offhandId]||'uma_mao'):(item?.arma?.empunhaduraId||'uma_mao');
  return {entry,item:(item||entry),grip,id};
}

/** Retorna a empunhadura efetiva da arma equipada: 'duas_maos' | 'uma_mao' | 'leve'. */
function equippedWeaponHandedness(){
  const record=equippedWeaponRecord();if(!record)return null;
  const eq=equipmentState(),item=record.item;
  const base=item?.arma?.empunhaduraId||'uma_mao';
  const isAdaptable=(item?.arma?.propriedadesIds||[]).includes('adaptavel');
  if(isAdaptable){
    const entryId=eq.weaponId;
    return eq.adaptableHandedness[entryId]||'uma_mao';
  }
  return base;
}

/** Retorna true se a arma equipada na mão ocupa duas mãos (bloqueando escudo). */
function equippedWeaponBlocksShield(){
  return equippedWeaponHandedness()==='duas_maos';
}

/**
 * Retorna os dados de combate de uma arma levando em conta empunhadura (ex: adaptável 1d10 vs 1d12).
 */
function effectiveWeaponStats(item,handedness,entry){
  const base=typeof weaponPassiveStats==='function'?weaponPassiveStats(item,entry):{attack:0,damage:'—'};
  if(!item?.arma)return base;
  const isAdaptable=(item.arma.propriedadesIds||[]).includes('adaptavel');
  if(isAdaptable&&item.arma.dano?.alternativas?.length&&String(base.damage||'').includes('/')){
    const parts=String(base.damage).split('/');
    if(parts.length===2){
      if(handedness==='duas_maos')return {...base,damage:parts[1]};
      const bonusMatch=parts[1].match(/[+-]\d+$/);
      const oneHandDmg=parts[0].includes('+')||parts[0].includes('-')?parts[0]:(parts[0]+(bonusMatch?bonusMatch[0]:''));
      return {...base,damage:oneHandDmg};
    }
  }
  return base;
}

// ── Renderização do Painel de Equipamento (3 Colunas: Mochila + Equipados + Vestidos) ──
/**
 * Renderiza o painel de Equipamento:
 * - À esquerda (bloco maior, 2 colunas): Mochila com itens guardados.
 * - À direita:
 *   - Bloco Equipados: Armas e Escudos empunhados nas mãos.
 *   - Bloco Itens Vestidos: Mochila (slot 1), Armadura (slot 2), Traje (slot 3) e Acessórios (slot 4+).
 */
function renderEquipmentPanel(){
  initEquipmentState();
  const eq=equipmentState();
  const catalog=getEquipmentCatalog();
  const inventory=characterInventory();
  const itemName=entry=>{
    if(!entry)return '';
    const itemId=entry.itemId||'';
    const opts=entry.options||{};
    if(itemId==='ferramenta_agricola'){
      const custom=(opts.customName||entry.displayName||'Forcado').trim();
      const clean=custom.replace(/\s*\(fazendeiro\)/i,'').replace(/ferramenta agr[íi]cola/i,'Forcado').trim();
      return (clean||'Forcado')+' (Fazendeiro)';
    }
    if(itemId==='ferramenta_pesada_lanca'){
      const def=opts.weaponModel==='maca'?'Malho':'Picareta';
      const custom=(opts.customName||entry.displayName||def).trim();
      const clean=custom.replace(/\s*\(trabalhador\)/i,'').replace(/\s*\(lan[çc]a\)/i,'').replace(/\s*\(ma[çc]a\)/i,'').replace(/ferramenta pesada/i,def).trim();
      return (clean||def)+' (Trabalhador)';
    }
    if(itemId==='ferramenta_pesada'){
      const custom=(opts.customName||entry.displayName||'Malho').trim();
      const clean=custom.replace(/\s*\(escravo\)/i,'').replace(/ferramenta pesada/i,'Malho').trim();
      return (clean||'Malho')+' (Escravo)';
    }
    if(/traje_de_viaj/i.test(entry.itemId)||/traje_de_viaj/i.test(entry.displayName)||/traje_de_viaj/i.test(entry.itemName))return 'Traje de Viajante';
    if(entry.displayName)return entry.displayName;
    if(entry.options?.customName)return entry.options.customName;
    if(entry.itemName)return entry.itemName;
    const cat=catalog.get(entry.itemId);
    if(cat?.nome)return cat.nome;
    return String(entry.itemId||'').replace(/_/g,' ');
  };

  const isEntryEquipped = (entry, i) => {
    if (!entry) return false;
    if(typeof mountAssignmentActive==='function'&&mountAssignmentActive(entry))return true;
    if (eq.armorId && matchEquipmentEntry(entry, i, eq.armorId)) return true;
    if (eq.shieldId && matchEquipmentEntry(entry, i, eq.shieldId)) return true;
    if (eq.weaponId && matchEquipmentEntry(entry, i, eq.weaponId)) return true;
    if (eq.offhandId && matchEquipmentEntry(entry, i, eq.offhandId)) return true;
    if (eq.trailerId && matchEquipmentEntry(entry, i, eq.trailerId)) return true;
    if (Array.isArray(eq.wornIds) && eq.wornIds.some(wId => matchEquipmentEntry(entry, i, wId))) return true;
    return false;
  };

  const backpackEntries=[],seenTraje=new Set();
  inventory.forEach((entry,i)=>{
    if(/traje_de_viaj/i.test(entry?.itemId)||/traje_de_viaj/i.test(entry?.displayName)||/traje_de_viaj/i.test(entry?.itemName)){
      if(seenTraje.has('traje'))return;
      seenTraje.add('traje');
      entry.itemId='traje_de_viajante';
      entry.displayName='Traje de Viajante';
      entry.itemName='Traje de Viajante';
      entry.quantity=1;
    }
    const id=equipEntryId(entry,i);
    if(!isEntryEquipped(entry,i))backpackEntries.push({entry,item:catalog.get(entry.itemId),id});
  });

  // Helper para verificar se possui arma compatível para disparar munição
  const hasWeaponForAmmo = (ammoEntry: any, ammoItem: any) => {
    const it = ammoItem || {};
    const e = ammoEntry || {};
    const isMunicao = it.tipo === 'municao' || it.categoriaId === 'municao' || e.tipo === 'municao';
    if (!isMunicao) return false;
    const idStr = String(it.id || e.itemId || '').toLowerCase();
    const nameStr = String(it.nome || e.displayName || e.itemName || '').toLowerCase();

    const weapons = inventory.filter((wEntry: any) => {
      const wItem = catalog.get(wEntry.itemId) || wEntry;
      return wItem?.tipo === 'arma' || wItem?.arma;
    });

    if (idStr.includes('flecha') || nameStr.includes('flecha')) {
      return weapons.some((w: any) => {
        const wItem = catalog.get(w.itemId) || w;
        const wId = String(wItem.id || w.itemId || '').toLowerCase();
        const wName = String(wItem.nome || w.displayName || w.itemName || '').toLowerCase();
        return wId.includes('arco') || wName.includes('arco') || wItem?.arma?.tipoUso === 'arco';
      });
    }
    if (idStr.includes('virote') || nameStr.includes('virote')) {
      return weapons.some((w: any) => {
        const wItem = catalog.get(w.itemId) || w;
        const wId = String(wItem.id || w.itemId || '').toLowerCase();
        const wName = String(wItem.nome || w.displayName || w.itemName || '').toLowerCase();
        return wId.includes('besta') || wName.includes('besta') || wItem?.arma?.tipoUso === 'besta';
      });
    }
    if (idStr.includes('bala') || nameStr.includes('bala') || idStr.includes('polvora') || nameStr.includes('pólvora') || nameStr.includes('polvora')) {
      return weapons.some((w: any) => {
        const wItem = catalog.get(w.itemId) || w;
        const wId = String(wItem.id || w.itemId || '').toLowerCase();
        const wName = String(wItem.nome || w.displayName || w.itemName || '').toLowerCase();
        return wId.includes('pistola') || wName.includes('pistola') || wId.includes('mosquete') || wName.includes('mosquete') || wItem?.arma?.empunhaduraId === 'fogo';
      });
    }
    return weapons.some((w: any) => {
      const wItem = catalog.get(w.itemId) || w;
      return wItem?.arma?.alcance && wItem.arma.alcance !== 'corpo-a-corpo' && wItem.arma.alcance !== 'nenhum';
    });
  };

  // ── Bloco da Esquerda: Mochila (2 colunas) ────────────────────────────────
  const backpackRows=backpackEntries.length
    ?backpackEntries.map(({entry,item,id})=>{
      const qty=Number(entry.quantity||1);
      const isEngenhoca=Boolean(entry?.isEngenhoca||entry?.contraptionId||item?.tipo==='engenhoca'||/engenhoca/i.test(entry?.itemId||'')||entry?.origem==='engenhoca');
      const attached = entry?.attachedItem || entry?.engenhocaInfo?.attachedItem || item?.attachedItem || item?.engenhocaInfo?.attachedItem;
      const spaces = attached
        ? ((attached.espacos != null ? Number(attached.espacos) : 0) + 1)
        : Number(entry?.espacos ?? item?.espacos ?? (isEngenhoca ? 1 : 0));
      const isArma=!isEngenhoca&&item?.tipo==='arma',isEsoterico=!isEngenhoca&&(item?.tipo==='esoterico'||item?.categoriaId==='esoterico');
      const isInstrumento=!isEngenhoca&&(item?.tipo==='instrumento'||item?.categoriaId==='instrumento'||/instrumento/i.test(item?.nome||'')||/instrumento/i.test(entry?.displayName||''));
      const isArmadura=!isEngenhoca&&item?.tipo==='armadura',isEscudo=!isEngenhoca&&item?.tipo==='escudo';
      const isMochila=!isEngenhoca&&(/mochila/i.test(item?.nome||'')||/mochila/i.test(entry?.displayName||''));
      const isTatuagem=!isEngenhoca&&isTattooItem(item, entry);
      const isTraje=!isEngenhoca&&(item?.categoriaId==='vestuario'||item?.tipo==='vestuario'||/(traje|camisa|vestimenta|tunica)/i.test(item?.nome||'')||/(traje|camisa|vestimenta|tunica)/i.test(entry?.displayName||''))&&!isMochila&&!isTatuagem;
      const isOutroVestivel=!isEngenhoca&&!isArmadura&&!isEscudo&&!isArma&&!isEsoterico&&!isInstrumento&&!isTraje&&!isTatuagem&&isWearableItem(item, entry);
      const isEstragado=Boolean(entry?.estragado||entry?.isDamaged||entry?.damaged||/estragad/i.test(entry?.displayName||entry?.itemName||item?.nome||''));

      const getIcon = (name: string) => window.IconesForja ? window.IconesForja.get(name, 'icon-sm') : '';
      let actionButtons='';

      if(isEngenhoca){
        const cIdentifier = entry.contraptionId || entry.id || entry.instanceId || id;
        const isAttachedToArmor = inventory.some((e: any) => Array.isArray(e.attachedContraptions) && e.attachedContraptions.some((ac: any) => (ac?.id || ac?.contraptionId || ac) === cIdentifier));
        if (isAttachedToArmor) {
          actionButtons += `<span class="tag dim" style="font-size:0.56rem;color:var(--gold2,#f5c879);border-color:var(--line,#4a252a)">Acoplada</span>`;
        } else {
          const attachedType = (attached?.tipo || item?.tipo || '').toLowerCase();
          const attachedNome = (attached?.nome || item?.nome || '').toLowerCase();
          const forma = String(entry?.engenhocaInfo?.formaUso || entry?.formaUso || item?.formaUso || item?.engenhocaInfo?.formaUso || (item?.tipo === 'armadura' || attachedType === 'armadura' ? 'vestida' : 'empunhada')).toLowerCase();

          const isAttachedArmor = attachedType === 'armadura' || item?.tipo === 'armadura' || /armadura|gibao|gibão|cota|couraça|couraca|brunea|brúnea/i.test(attachedNome);
          const isAttachedShield = attachedType === 'escudo' || item?.tipo === 'escudo' || /escudo|broquél|broquel|pavês|paves/i.test(attachedNome);
          const isAttachedTraje = attachedType === 'vestuario' || item?.categoriaId === 'vestuario' || item?.tipo === 'vestuario' || /(traje|camisa|vestimenta|tunica)/i.test(attachedNome) || /(traje|camisa|vestimenta|tunica)/i.test(entry?.displayName || '');
          const isVestida = forma === 'vestida' || isAttachedArmor || isAttachedTraje;

          if(isVestida){
            if(isAttachedArmor){
              if(eq.armorId && eq.armorId !== 'none'){
                actionButtons += `<button class="square-action-btn" type="button" data-equip-action="swap-armor" data-entry-id="${esc(id)}" title="Trocar com a armadura vestida">${getIcon('sync')}</button>`;
              } else {
                actionButtons += `<button class="square-action-btn" type="button" data-equip-action="equip-armor" data-entry-id="${esc(id)}" title="Vestir armadura">${getIcon('shield')}</button>`;
              }
            } else if(isAttachedTraje){
              if(eq.trailerId && eq.trailerId !== 'none'){
                actionButtons += `<button class="square-action-btn" type="button" data-equip-action="swap-trailer" data-entry-id="${esc(id)}" title="Trocar com o traje vestido">${getIcon('sync')}</button>`;
              } else {
                actionButtons += `<button class="square-action-btn" type="button" data-equip-action="equip-trailer" data-entry-id="${esc(id)}" title="Vestir traje">${getIcon('user')}</button>`;
              }
            } else {
              actionButtons += `<button class="square-action-btn" type="button" data-equip-action="equip-accessory" data-entry-id="${esc(id)}" title="Vestir engenhoca">${getIcon('user')}</button>`;
            }
          } else {
            if(isAttachedShield){
              if(equippedWeaponBlocksShield()){
                actionButtons += `<span class="tag dim" style="font-size:0.56rem" title="Arma de duas mãos impede equipar escudo">Bloqueado</span>`;
              } else {
                actionButtons += `<button class="square-action-btn" type="button" data-equip-action="equip-shield" data-entry-id="${esc(id)}" title="Equipar escudo">${getIcon('shield')}</button>`;
              }
            } else {
              actionButtons += `<button class="square-action-btn" type="button" data-equip-action="equip-weapon" data-entry-id="${esc(id)}" title="Empunhar engenhoca">${getIcon('sword')}</button>`;
            }
          }
        }
        actionButtons += `<button class="square-action-btn" type="button" data-backpack-action="disassemble" data-entry-id="${esc(id)}" title="Desmanchar engenhoca">${getIcon('gear')}</button>`;
      }else if(isArmadura){
        if(eq.armorId&&eq.armorId!=='none') actionButtons += `<button class="square-action-btn" type="button" data-equip-action="swap-armor" data-entry-id="${esc(id)}" title="Trocar com a armadura vestida">${getIcon('sync')}</button>`;
        else actionButtons += `<button class="square-action-btn" type="button" data-equip-action="equip-armor" data-entry-id="${esc(id)}" title="Vestir armadura">${getIcon('shield')}</button>`;
      }else if(isEscudo){
        if(equippedWeaponBlocksShield()){
          actionButtons += `<span class="tag dim" style="font-size:0.56rem" title="Arma de duas mãos impede equipar escudo">Bloqueado</span>`;
        }else{
          actionButtons += `<button class="square-action-btn" type="button" data-equip-action="equip-shield" data-entry-id="${esc(id)}" title="Equipar escudo">${getIcon('shield')}</button>`;
        }
      }else if(isArma||isEsoterico||isInstrumento){
        actionButtons += `<button class="square-action-btn" type="button" data-equip-action="equip-weapon" data-entry-id="${esc(id)}" title="Empunhar ${esc(itemName(entry))}">${getIcon('sword')}</button>`;
      }else if(isTatuagem){
        actionButtons += `<button class="square-action-btn" type="button" data-equip-action="reveal-tattoo" data-entry-id="${esc(id)}" title="Descobrir tatuagem mística">${getIcon('sparkles')}</button>`;
      }else if(isTraje){
        if(!eq.trailerId||eq.trailerId==='none'){
          actionButtons += `<button class="square-action-btn" type="button" data-equip-action="equip-trailer" data-entry-id="${esc(id)}" title="Vestir traje">${getIcon('user')}</button>`;
        } else {
          actionButtons += `<button class="square-action-btn" type="button" data-equip-action="swap-trailer" data-entry-id="${esc(id)}" title="Trocar traje">${getIcon('sync')}</button>`;
        }
      }else if(isOutroVestivel){
        actionButtons += `<button class="square-action-btn" type="button" data-equip-action="equip-accessory" data-entry-id="${esc(id)}" title="Vestir acessório">${getIcon('user')}</button>`;
      }

      // Consumível / Munição
      if(item?.tipo==='municao'){
        const remaining=Math.max(0,Number(entry.ammoRemaining??entry.quantity??0));
        const canShoot = hasWeaponForAmmo(entry, item);
        if(canShoot){
          actionButtons += `<button class="square-action-btn" type="button" data-item-spend="fire" data-entry-id="${esc(id)}" title="Disparar munição (${remaining} restantes)" ${remaining<1?'disabled':''}>${getIcon('bow')}</button>`;
        }
      }else if(typeof isConsumable==='function'&&isConsumable(item)){
        actionButtons += `<button class="square-action-btn" type="button" data-item-spend="use" data-entry-id="${esc(id)}" title="Usar item" ${Number(entry.quantity||0)<1?'disabled':''}>${getIcon('flask')}</button>`;
      }else if(typeof window!=='undefined'&&typeof (window as any).isConsumable==='function'&&(window as any).isConsumable(item)){
        actionButtons += `<button class="square-action-btn" type="button" data-item-spend="use" data-entry-id="${esc(id)}" title="Usar item" ${Number(entry.quantity||0)<1?'disabled':''}>${getIcon('flask')}</button>`;
      }
      const sellBtn = `<button class="square-action-btn" type="button" data-backpack-action="sell" data-entry-id="${esc(id)}" title="Vender" aria-label="Vender ${esc(itemName(entry))}">${getIcon('coin')}</button>`;

      const isExpanded=(typeof expandedSheetItemId!=='undefined'&&expandedSheetItemId===id)||(typeof window!=='undefined'&&window.expandedSheetItemId===id);
      const detailHtml=(isExpanded&&typeof inlineDetails==='function')
        ?inlineDetails(entry,item)
        :(isExpanded&&typeof window!=='undefined'&&typeof window.inlineDetails==='function'?window.inlineDetails(entry,item):'');

      return `<div class="backpack-compact-entry ${isExpanded?'is-expanded':''}" data-instance-id="${esc(id)}">
        <div class="backpack-compact-row" data-item-details="${esc(id)}" tabindex="0" role="button" title="Abrir detalhes de ${esc(itemName(entry))}">
          <button class="compact-open-button" type="button" data-item-details="${esc(id)}" title="Abrir detalhes de ${esc(itemName(entry))}">
            <strong class="compact-item-title">${esc(itemName(entry))}${isEstragado?' <span class="tag red" style="font-size:0.56rem;padding:1px 4px;margin-left:4px;border:1px solid #ef4444;background:rgba(239,68,68,0.15);color:#fca5a5;">Estragado (-5)</span>':''}</strong>
          </button>
          <span class="compact-metric metric-quantity"><small>QTD.</small><strong>${qty}</strong></span>
          <span class="compact-metric metric-spaces"><small>ESPAÇOS</small><strong>${spaces}</strong></span>
          <div class="compact-actions" style="display:flex;gap:4px;align-items:center;">
            ${actionButtons}
            ${sellBtn}
          </div>
        </div>
        ${detailHtml ? `<div class="compact-detail">${detailHtml}</div>` : ''}
      </div>`;
    }).join('')
    :'<p class="help" style="padding:14px;grid-column:1/-1">Nenhum item guardado na mochila.</p>';

  // ── Bloco Superior Direito: Equipados (Armas & Escudos nas mãos) ──────────
  const equippedSlots=[];

  // 1. Arma na mão
  const weaponRec=equippedWeaponRecord();
  if(weaponRec){
    const {entry,item}=weaponRec;
    const handedness=equippedWeaponHandedness();
    const isAdaptable=(item?.arma?.propriedadesIds||[]).includes('adaptavel');
    const isTwoHanded=item?.arma?.empunhaduraId==='duas_maos';
    const values=item?.tipo==='arma'?effectiveWeaponStats(item,handedness,entry):null;
    let handControls='';
    if(isAdaptable){
      const entryId=eq.weaponId;
      const syncIco=window.IconesForja?window.IconesForja.get('sync','icon-xs'):'';
      handControls=`<button class="button small" type="button" data-equip-action="${handedness==='duas_maos'?'set-handedness-one':'set-handedness-two'}" data-entry-id="${esc(entryId)}" title="Alternar empunhadura (atual: ${handedness==='duas_maos'?'2 mãos':'1 mão'})" aria-label="Alternar empunhadura" style="display:inline-flex;align-items:center;justify-content:center;padding:2px 4px">${syncIco}</button>`;
    }else if(isTwoHanded){
      handControls=`<span class="tag gold" style="font-size:0.56rem;margin-left:4px">2 mãos</span>`;
    }
    equippedSlots.push(`<div class="equip-worn-item">
      <div class="equip-item-label">Arma na mão</div>
      <div class="equip-item-row">
        <strong class="equip-item-name" role="button" tabindex="0" data-item-details="${esc(eq.weaponId)}">${esc(itemName(entry))}</strong>
        ${handControls}
        <span class="equip-item-stats">${values?`Ataque ${values.attack} · Dano ${esc(values.damage)} · Crítico ${esc(formatWeaponCritical(values.critical||item?.arma?.critico))}`:'Item esotérico empunhado'}</span>
        <div class="equip-item-controls">
          <button class="button small" type="button" data-equip-action="store-weapon" title="Guardar arma na mochila" style="font-size:0.62rem;padding:2px 6px;min-height:20px;height:20px;line-height:1">Guardar</button>
        </div>
      </div>
    </div>`);
  }else{
    equippedSlots.push(`<div class="equip-worn-item equip-empty-slot">
      <div class="equip-item-label">Arma na mão</div>
      <div class="equip-item-row">
        <span class="equip-empty-text">Nenhuma arma empunhada</span>
      </div>
    </div>`);
  }

  const offhandRec=equippedOffhandRecord() || heldItemRecords().find(r=>r.id===eq.offhandId);
  if(offhandRec){
    const {entry,item,grip,id}=offhandRec;
    const isWep=item.tipo==='arma'||item.arma||entry?.attachedItem?.tipo==='arma'||entry?.attachedItem?.arma;
    const values=isWep?effectiveWeaponStats(item,grip,entry):null;
    const syncIco=window.IconesForja?window.IconesForja.get('sync','icon-xs'):'';
    const toggle=(item?.arma?.propriedadesIds||[]).includes('adaptavel')?`<button class="button small" data-equip-action="set-handedness-two" data-entry-id="${esc(id)}" title="Alternar para duas mãos" aria-label="Alternar empunhadura" style="display:inline-flex;align-items:center;justify-content:center;padding:2px 4px">${syncIco}</button>`:'';
    const isContraption=Boolean(entry?.isEngenhoca||entry?.contraptionId||item?.tipo==='engenhoca'||entry?.formaUso==='empunhada');
    const statsText=values?`Ataque ${values.attack} · Dano ${esc(values.damage)}${values.critical?` · Crítico ${esc(formatWeaponCritical(values.critical))}`:''}`:(isContraption?'Engenhoca empunhada':'Item empunhado');
    equippedSlots.push(`<div class="equip-worn-item">
      <div class="equip-item-label">Outra mão</div>
      <div class="equip-item-row">
        <strong class="equip-item-name" role="button" tabindex="0" data-item-details="${esc(id)}">${esc(itemName(entry))}</strong>
        ${toggle}
        <span class="equip-item-stats">${statsText}</span>
        <div class="equip-item-controls">
          <button class="button small" type="button" data-equip-action="store-offhand" data-entry-id="${esc(id)}" title="Guardar item da outra mão na mochila" style="font-size:0.62rem;padding:2px 6px;min-height:20px;height:20px;line-height:1">Guardar</button>
        </div>
      </div>
    </div>`);
  }else if(eq.offhandId&&eq.offhandId!=='none'){
    const rawEntry=inventory.find((e,i)=>matchEquipmentEntry(e,i,eq.offhandId));
    const name=rawEntry?itemName(rawEntry):'Item empunhado';
    equippedSlots.push(`<div class="equip-worn-item">
      <div class="equip-item-label">Outra mão</div>
      <div class="equip-item-row">
        <strong class="equip-item-name" role="button" tabindex="0" data-item-details="${esc(eq.offhandId)}">${esc(name)}</strong>
        <span class="equip-item-stats">Item empunhado na outra mão</span>
        <div class="equip-item-controls">
          <button class="button small" type="button" data-equip-action="store-offhand" data-entry-id="${esc(eq.offhandId)}" title="Guardar item da outra mão na mochila" style="font-size:0.62rem;padding:2px 6px;min-height:20px;height:20px;line-height:1">Guardar</button>
        </div>
      </div>
    </div>`);
  }
  if(dualWeaponAttackReady()||eq.dualAttack)equippedSlots.push(`<button class="button small" data-equip-action="toggle-dual-attack" title="Desative no início do próximo turno">${eq.dualAttack?'Encerrar efeito duplo':'Atacar com ambas'} (${characterHasFeature('ambidestria')?'sem penalidade':'−2 até o próximo turno'})</button>`);
  // 2. Escudo
  const shieldRec=equippedShieldRecord();
  const shieldBlocked=equippedWeaponBlocksShield();
  if(shieldRec&&!shieldBlocked){
    const {entry,item}=shieldRec;
    const def=Number(item?.escudo?.bonusDefesa||0),pen=item?.escudo?.penalidade||0;
    equippedSlots.push(`<div class="equip-worn-item">
      <div class="equip-item-label">Escudo</div>
      <div class="equip-item-row">
        <strong class="equip-item-name" role="button" tabindex="0" data-item-details="${esc(eq.shieldId)}">${esc(itemName(entry))}</strong>
        <span class="equip-item-stats">Def +${def} · Pen ${pen} · ${Number(item?.espacos||0)} esp.</span>
        <div class="equip-item-controls">
          <button class="button small" type="button" data-equip-action="store-shield" title="Guardar escudo na mochila" style="font-size:0.62rem;padding:2px 6px;min-height:20px;height:20px;line-height:1">Guardar</button>
        </div>
      </div>
    </div>`);
  }else if(shieldBlocked&&eq.shieldId&&eq.shieldId!=='none'){
    const shieldEntry=inventory.find((e,i)=>equipEntryId(e,i)===eq.shieldId);
    if(shieldEntry){
      equippedSlots.push(`<div class="equip-worn-item equip-blocked">
        <div class="equip-item-label">Escudo (bloqueado)</div>
        <div class="equip-item-row">
          <strong class="equip-item-name" role="button" tabindex="0" data-item-details="${esc(equipEntryId(shieldEntry,inventory.indexOf(shieldEntry)))}">${esc(itemName(shieldEntry))}</strong>
          <span class="equip-item-stats equip-warn">Arma de 2 mãos empunhada</span>
          <div class="equip-item-controls">
            <button class="button small" type="button" data-equip-action="store-shield" style="font-size:0.62rem;padding:2px 6px;min-height:20px;height:20px;line-height:1">Guardar</button>
          </div>
        </div>
      </div>`);
    }else{
      equippedSlots.push(`<div class="equip-worn-item equip-empty-slot">
        <div class="equip-item-label">Escudo</div>
        <div class="equip-item-row">
          <span class="equip-empty-text">Nenhum escudo equipado</span>
        </div>
      </div>`);
    }
  }else{
    equippedSlots.push(`<div class="equip-worn-item equip-empty-slot">
      <div class="equip-item-label">Escudo</div>
      <div class="equip-item-row">
        <span class="equip-empty-text">Nenhum escudo equipado</span>
      </div>
    </div>`);
  }

  // ── Bloco Inferior Direito: Itens Vestidos (Armadura, Traje, Tatuagens, Acessórios) ──
  const wornLimit=wornItemsLimit(),wornCount=wornItemsCount();
  const wornSlots=[];

  // Slot 1: Armadura
  const armorRec=equippedArmorRecord();
  if(armorRec){
    const {entry,item}=armorRec;
    const def=Number(item?.armadura?.defesa||0),pen=item?.armadura?.penalidade||0,cat=item?.armadura?.categoriaId||'';
    const attachedConts = Array.isArray(entry.attachedContraptions) ? entry.attachedContraptions : [];
    let attachedContsHtml = '';
    if (attachedConts.length > 0) {
      const itemsHtml = attachedConts.map((ac: any) => {
        const cNome = typeof ac === 'string' ? ac : (ac.nome || ac.name || 'Engenhoca');
        return `<span class="tag dim" style="font-size:0.62rem;border-color:var(--line,#4a252a);color:var(--gold2,#f5c879)">Mecanizada: ${esc(cNome)} (pronta sem empunhar)</span>`;
      }).join(' ');
      attachedContsHtml = `<div style="margin-top:4px;display:flex;flex-wrap:wrap;gap:4px">${itemsHtml}</div>`;
    }
    wornSlots.push(`<div class="equip-worn-item">
      <div class="equip-item-label">Armadura</div>
      <div class="equip-item-row">
        <strong class="equip-item-name" role="button" tabindex="0" data-item-details="${esc(eq.armorId)}">${esc(itemName(entry))}</strong>
        <span class="equip-item-stats">Def +${def} · Pen ${pen}${cat==='pesada'?' · Pesada':''} · ${Number(item?.espacos||0)} esp.</span>
        <div class="equip-item-controls">
          <button class="button small" type="button" data-equip-action="store-armor" title="Guardar armadura na mochila" style="font-size:0.62rem;padding:2px 6px;min-height:20px;height:20px;line-height:1">Guardar</button>
        </div>
      </div>
      ${attachedContsHtml}
    </div>`);
  }else{
    wornSlots.push(`<div class="equip-worn-item equip-empty-slot">
      <div class="equip-item-label">Armadura</div>
      <div class="equip-item-row">
        <span class="equip-empty-text">Nenhuma armadura vestida</span>
      </div>
    </div>`);
  }

  // Slot 2: Traje vestido (vestimentas no geral)
  const trajeEntry=eq.trailerId&&eq.trailerId!=='none'?inventory.find((e,i)=>matchEquipmentEntry(e,i,eq.trailerId)):null;
  if(trajeEntry){
    const item=catalog.get(trajeEntry.itemId) || trajeEntry;
    const sp=Number(item?.espacos||trajeEntry?.espacos||0);
    wornSlots.push(`<div class="equip-worn-item">
      <div class="equip-item-label">Traje vestido</div>
      <div class="equip-item-row">
        <strong class="equip-item-name" role="button" tabindex="0" data-item-details="${esc(equipEntryId(trajeEntry,inventory.indexOf(trajeEntry)))}">${esc(itemName(trajeEntry))}</strong>
        <span class="equip-item-stats">${sp>0?`${sp} esp.`:''}</span>
        <div class="equip-item-controls">
          <button class="button small" type="button" data-equip-action="store-trailer" title="Guardar traje na mochila" style="font-size:0.62rem;padding:2px 6px;min-height:20px;height:20px;line-height:1">Guardar</button>
        </div>
      </div>
    </div>`);
  }else{
    wornSlots.push(`<div class="equip-worn-item equip-empty-slot">
      <div class="equip-item-label">Traje vestido</div>
      <div class="equip-item-row">
        <span class="equip-empty-text">Nenhum traje vestido</span>
      </div>
    </div>`);
  }

  // Slot 3+: Tatuagens Místicas e Acessórios
  if(Array.isArray(eq.wornIds)){
    for(const accId of eq.wornIds){
      if(!accId||accId==='none')continue;
      const accEntry=inventory.find((e,i)=>matchEquipmentEntry(e,i,accId));
      if(!accEntry)continue;
      const item=catalog.get(accEntry.itemId) || accEntry;
      const sp=Number(item?.espacos||accEntry?.espacos||0);
      const isTatuagem=isTattooItem(item, accEntry);
      const label=isTatuagem?'Tatuagem Mística':(item?.categoriaId==='vestuario'?'Vestuário':(accEntry?.isEngenhoca?'Engenhoca Vestida':'Acessório'));
      const actionBtn=isTatuagem
        ?`<button class="button small" type="button" data-equip-action="cover-tattoo" data-entry-id="${esc(accId)}" title="Cobrir com a roupa (libera espaço de item vestido)" style="font-size:0.62rem;padding:2px 6px;min-height:20px;height:20px;line-height:1">Cobrir</button>`
        :`<button class="button small" type="button" data-equip-action="store-accessory" data-entry-id="${esc(accId)}" title="Guardar item na mochila" style="font-size:0.62rem;padding:2px 6px;min-height:20px;height:20px;line-height:1">Guardar</button>`;
      wornSlots.push(`<div class="equip-worn-item">
        <div class="equip-item-label">${esc(label)}</div>
        <div class="equip-item-row">
          <strong class="equip-item-name" role="button" tabindex="0" data-item-details="${esc(equipEntryId(accEntry,inventory.indexOf(accEntry)))}">${esc(itemName(accEntry))}</strong>
          <span class="equip-item-stats">${sp>0?`${sp} esp.`:''}</span>
          <div class="equip-item-controls">
            ${actionBtn}
          </div>
        </div>
      </div>`);
    }
  }

  const hasCraft=typeof allTrainedOffices==='function'&&allTrainedOffices().length>0;
  const craftBtn=hasCraft?`<button class="button small primary equipment-compact-btn" type="button" data-sheet-action="workshop" title="Oficinas de Fabricação do Herói">Fabricar</button>`:'';
  const quickActions=`<div class="equipment-quick-actions" style="display:flex;gap:4px;align-items:center;">`+
    craftBtn+
    `<button class="button small primary equipment-compact-btn" type="button" data-sheet-action="shop" title="Loja · Arsenal de Arton">Loja</button>`+
    `<button class="button small primary equipment-compact-btn" type="button" data-sheet-action="tavern" title="Taverna de Arton">Taverna</button>`+
    `<button class="button small equipment-compact-btn" type="button" data-sheet-action="reward" title="Adicionar Recompensa">Recompensa</button>`+
    `<button class="button small equipment-compact-btn" type="button" data-sheet-action="import-code" title="Importar Item por Código">Código</button>`+
  `</div>`;

  return `<div class="sheet-equipment-sections">
    <div class="sheet-equipment-block sheet-equipment-backpack">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 10px;background:#111824;border-bottom:1px solid var(--border)">
        <h4 style="border-bottom:none;margin:0;padding:0">Mochila</h4>
        ${quickActions}
      </div>
      <div class="sheet-backpack-grid sheet-general-backpack-list list-mode">${backpackRows}</div>${sheetMoneyAndLoad()}
    </div>
    <div class="sheet-equipment-right-column">
      <div class="sheet-equipment-block sheet-equipment-equipped">
        <h4>Equipados</h4>
        <div class="sheet-equipped-list">${equippedSlots.join('')}</div>
      </div>
      <div class="sheet-equipment-block sheet-equipment-worn">
        <div class="sheet-worn-header">
          <h4>Itens vestidos</h4>
          <span class="sheet-worn-badge" title="Regra T20: até 4 itens vestidos">${wornCount} / ${wornLimit} vestidos</span>
        </div>
        <div class="sheet-worn-list">${wornSlots.join('')}</div>
      </div>
    </div>
  </div>`;
}
