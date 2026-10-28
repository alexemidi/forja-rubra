function bonusPoderesCarga(){return RegrasMochilas.bonusPoderesCarga(selectedCharacterFeatures());}
function poderesCarga(){return (typeof selectedCharacterFeatures==='function'?selectedCharacterFeatures():[]).map(p=>(p.id||'')+' '+(p.nome||''));}
function mochilaEntryIsenta(entry,item){return RegrasMochilas.mochilaIsenta(RegrasMochilas.tipoMochila(entry?.itemId||item?.id||'',item?.nome||entry?.displayName||''),poderesCarga());}
function mochilasVestidas(){const eq=equipmentState(),catalog=getEquipmentCatalog();return characterInventory().flatMap((e,i)=>(eq.wornIds||[]).some(id=>matchEquipmentEntry(e,i,id))?[RegrasMochilas.tipoMochila(e.itemId,catalog.get(e.itemId)?.nome||e.itemName||e.displayName||'')]:[]);}

/**
 * Localiza de forma resiliente se uma entrada do inventário corresponde ao ID de equipamento alvo.
 */
function matchEquipmentEntry(entry, index, targetId) {
  if (!entry || !targetId || targetId === 'none') return false;
  if (entry.instanceId && entry.instanceId === targetId) return true;
  if (entry.uid && entry.uid === targetId) return true;
  if (entry.id && entry.id === targetId) return true;
  if (entry.contraptionId && entry.contraptionId === targetId) return true;
  if (typeof equipEntryId === 'function' && equipEntryId(entry, index) === targetId) return true;

  const isWep = entry.tipo === 'arma' || Boolean(entry.arma);

  if (typeof targetId === 'string') {
    if (targetId.includes(':')) {
      const [targetItemBase, targetIdxStr] = targetId.split(':');
      if (index >= 0 && targetIdxStr !== undefined) {
        return (entry.itemId === targetItemBase || entry.id === targetItemBase) && Number(targetIdxStr) === index;
      }
      if (isWep) return false;
      return (entry.itemId === targetItemBase || entry.id === targetItemBase);
    }
    if (!entry.instanceId) {
      if (isWep) return false;
      if (entry.itemId && entry.itemId === targetId) return true;
      if (targetId.startsWith('inst_')) {
        const stripped = targetId.slice(5);
        if (entry.itemId === stripped || entry.id === stripped || entry.contraptionId === stripped) return true;
      }
    }
  }
  return false;
}
(globalThis as any).matchEquipmentEntry = matchEquipmentEntry;

/**
 * Auto-equipa os itens padrão na primeira visualização da ficha ou limpa referências obsoletas.
 */
function initEquipmentState(){
  if(initializingEquipment)return;
  initializingEquipment=true;
  try{
    const eq=equipmentState(),catalog=getEquipmentCatalog(),inventory=characterInventory();

    // Desmembrar armas, armaduras e escudos com quantidade > 1 em entradas individuais de quantidade 1
    for (let i = inventory.length - 1; i >= 0; i--) {
      const e = inventory[i];
      if (!e) continue;
      const catItem = catalog.get(e.itemId);
      const isIndivEquip = (catItem?.tipo === 'arma' || catItem?.tipo === 'armadura' || catItem?.tipo === 'escudo' || e.tipo === 'arma' || e.tipo === 'armadura' || e.tipo === 'escudo') && !catItem?.municao && catItem?.tipo !== 'municao' && e.tipo !== 'municao';
      if (isIndivEquip && Number(e.quantity || 1) > 1) {
        const total = Number(e.quantity);
        e.quantity = 1;
        if (!e.instanceId) e.instanceId = 'inst_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7) + '_' + i;
        for (let k = 1; k < total; k++) {
          inventory.push({
            ...e,
            quantity: 1,
            instanceId: 'inst_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7) + '_' + i + '_' + k
          });
        }
      }
    }

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

    const hasDualWieldStyle = typeof characterHasFeature === 'function' && characterHasFeature('estilo_de_duas_armas');
    const hasTwoHandStyle = typeof characterHasFeature === 'function' && (characterHasFeature('estilo_de_duas_maos') || characterHasFeature('defesa_armada') || characterHasFeature('ataque_pesado'));
    const hasOneHandStyle = typeof characterHasFeature === 'function' && (characterHasFeature('estilo_de_uma_arma') || characterHasFeature('ataque_preciso'));
    const hasWeaponAndShieldStyle = typeof characterHasFeature === 'function' && (characterHasFeature('estilo_de_arma_e_escudo') || characterHasFeature('estilo_classico') || characterHasFeature('ataque_com_escudo') || characterHasFeature('bloqueio_com_escudo'));
    const hasRangedStyle = typeof characterHasFeature === 'function' && (characterHasFeature('estilo_de_disparo') || characterHasFeature('arqueiro'));
    const hasThrowStyle = typeof characterHasFeature === 'function' && (characterHasFeature('estilo_de_arremesso') || characterHasFeature('arremesso_potente') || characterHasFeature('arremesso_multiplo'));
    const hasPolearmStyle = typeof characterHasFeature === 'function' && (characterHasFeature('estilo_de_arma_longa') || characterHasFeature('piqueiro') || characterHasFeature('ataque_com_o_cabo'));
    const hasClassicStyle = typeof characterHasFeature === 'function' && characterHasFeature('estilo_classico');
    const hasBigOffhand = typeof characterHasFeature === 'function' && (
      characterHasFeature('arma_secundaria_grande') ||
      characterHasFeature('arma_maior') ||
      characterHasFeature('arma_secundaria')
    );

    // Auto-equipa arma seguindo a hierarquia e estilo de combate
    if(eq.weaponId===null||eq.weaponId===undefined){
      let weaponEntry = null;
      if (hasRangedStyle) {
        weaponEntry = inventory.find((e, i) => {
          const item = catalog.get(e.itemId);
          return (item?.tipo === 'arma' || e.tipo === 'arma') && item?.arma?.combateId === 'a_distancia' && !(item?.arma?.propriedadesIds || []).includes('arremesso');
        }) || inventory.find((e, i) => {
          const item = catalog.get(e.itemId);
          return (item?.tipo === 'arma' || e.tipo === 'arma') && item?.arma?.combateId === 'a_distancia';
        });
      }
      if (!weaponEntry && hasThrowStyle) {
        weaponEntry = inventory.find((e, i) => {
          const item = catalog.get(e.itemId);
          return (item?.tipo === 'arma' || e.tipo === 'arma') && ((item?.arma?.propriedadesIds || []).includes('arremesso') || ['azagaia','boleadeira','chakram','arpao','shuriken','rede'].includes(item?.id));
        });
      }
      if (!weaponEntry && hasPolearmStyle) {
        weaponEntry = inventory.find((e, i) => {
          const item = catalog.get(e.itemId);
          return (item?.tipo === 'arma' || e.tipo === 'arma') && (item?.arma?.propriedadesIds || []).includes('alongada');
        });
      }
      if (!weaponEntry && hasClassicStyle) {
        weaponEntry = inventory.find((e, i) => {
          const item = catalog.get(e.itemId);
          return (item?.tipo === 'arma' || e.tipo === 'arma') && item?.arma?.empunhaduraId !== 'duas_maos' && /espada|florete|cimitarra|sabre|katana|gladio|gládio|rapiera|espadim|wakizashi|kopesh/i.test((item?.nome || '') + ' ' + (item?.id || ''));
        });
      }
      if (!weaponEntry && hasTwoHandStyle) {
        weaponEntry = inventory.find((e, i) => {
          const item = catalog.get(e.itemId);
          return (item?.tipo === 'arma' || e.tipo === 'arma') && (item?.arma?.empunhaduraId === 'duas_maos' || (item?.arma?.propriedadesIds || []).includes('adaptavel'));
        });
      }
      if (!weaponEntry && (hasOneHandStyle || hasWeaponAndShieldStyle)) {
        weaponEntry = inventory.find((e, i) => {
          const item = catalog.get(e.itemId);
          return (item?.tipo === 'arma' || e.tipo === 'arma') && (item?.arma?.empunhaduraId === 'uma_mao' || item?.arma?.empunhaduraId === 'leve' || (item?.arma?.propriedadesIds || []).includes('adaptavel'));
        });
      }
      if (!weaponEntry && hasDualWieldStyle) {
        weaponEntry = inventory.find((e, i) => {
          const item = catalog.get(e.itemId);
          return (item?.tipo === 'arma' || e.tipo === 'arma') && item?.arma?.empunhaduraId !== 'duas_maos';
        });
      }
      if (!weaponEntry) {
        weaponEntry = findHighestRankWeaponEntry(inventory, catalog);
      }
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
      }else if((wepItem?.arma?.propriedadesIds||[]).includes('adaptavel')){
        if(hasTwoHandStyle){
          eq.adaptableHandedness[eq.weaponId]='duas_maos';
          isTwoHanded=true;
        }else if(hasOneHandStyle||hasDualWieldStyle||hasWeaponAndShieldStyle){
          delete eq.adaptableHandedness[eq.weaponId];
          isTwoHanded=false;
        }else if(eq.adaptableHandedness[eq.weaponId]==='duas_maos'){
          isTwoHanded=true;
        }else if(!eq.adaptableHandedness[eq.weaponId]){
          const hasShieldOrOffhand = (eq.offhandId && eq.offhandId !== 'none') || (eq.shieldId && eq.shieldId !== 'none');
          if(!hasShieldOrOffhand){
            eq.adaptableHandedness[eq.weaponId] = 'duas_maos';
            isTwoHanded = true;
          }
        }
      }
    }

    // Se empunha arma com duas mãos, a outra mão e escudo DEVEM ficar livres na mochila
    if (isTwoHanded) {
      eq.offhandId = 'none';
      eq.shieldId = 'none';
    }

    if (hasTwoHandStyle && eq.weaponId && eq.weaponId !== 'none') {
      const wepEntry = inventory.find((e, i) => matchEquipmentEntry(e, i, eq.weaponId));
      const wepItem = wepEntry ? catalog.get(wepEntry.itemId) : null;
      if (wepItem?.arma?.empunhaduraId === 'duas_maos') {
        isTwoHanded = true;
        eq.offhandId = 'none';
        eq.shieldId = 'none';
      } else if ((wepItem?.arma?.propriedadesIds || []).includes('adaptavel')) {
        if (!eq.adaptableHandedness[eq.weaponId]) {
          eq.adaptableHandedness[eq.weaponId] = 'duas_maos';
        }
        if (eq.adaptableHandedness[eq.weaponId] === 'duas_maos') {
          isTwoHanded = true;
          eq.offhandId = 'none';
          eq.shieldId = 'none';
        }
      }
    }

    // Se tem Estilo de Uma Arma: Mão 2 VAZIA (mesmo tendo escudo no inventário, o escudo fica na mochila)
    if (hasOneHandStyle && eq.weaponId && eq.weaponId !== 'none') {
      eq.offhandId = 'none';
      eq.shieldId = 'none';
      if (eq.adaptableHandedness[eq.weaponId] === 'duas_maos') {
        delete eq.adaptableHandedness[eq.weaponId];
        isTwoHanded = false;
      }
    }

    // Identificar se há uma segunda arma no inventário
    const findSecondWeapon = () => {
      return inventory.find((e, i) => {
        const id = equipEntryId(e, i);
        if (id === eq.weaponId || matchEquipmentEntry(e, i, eq.weaponId)) return false;
        const item = catalog.get(e.itemId);
        if (item?.tipo !== 'arma' && e.tipo !== 'arma') return false;
        if (item?.arma?.empunhaduraId === 'duas_maos') return false;
        return true;
      });
    };

    // Se tem Estilo de Duas Armas OU se pegou duas armas iguais sem estilo de uma arma/escudo/duas mãos:
    const twoEqualWeapons = !hasOneHandStyle && !hasTwoHandStyle && !hasWeaponAndShieldStyle && inventory.filter(e => {
      const item = catalog.get(e.itemId);
      return (item?.tipo === 'arma' || e.tipo === 'arma') && item?.arma?.empunhaduraId !== 'duas_maos';
    }).length >= 2;

    if (!isTwoHanded && (hasDualWieldStyle || twoEqualWeapons) && eq.weaponId && eq.weaponId !== 'none' && (eq.offhandId === null || eq.offhandId === undefined)) {
      const secondWeapon = findSecondWeapon();
      if (secondWeapon) {
        eq.offhandId = equipEntryId(secondWeapon, inventory.indexOf(secondWeapon));
        eq.shieldId = 'none';
      }
    }

    if (hasWeaponAndShieldStyle && !isTwoHanded) {
      if (eq.offhandId === null || eq.offhandId === undefined) {
        eq.offhandId = 'none';
      }
      if (eq.shieldId === null || eq.shieldId === undefined) {
        const shieldEntry = inventory.find((e, i) => catalog.get(e.itemId)?.tipo === 'escudo' || e.tipo === 'escudo' || e.escudo || e.attachedItem?.tipo === 'escudo');
        if (shieldEntry) eq.shieldId = equipEntryId(shieldEntry, inventory.indexOf(shieldEntry));
      }
    }

    if (eq.offhandId && eq.offhandId !== 'none') {
      const offEntry = inventory.find((e, i) => matchEquipmentEntry(e, i, eq.offhandId));
      if (offEntry) {
        eq.offhandId = equipEntryId(offEntry, inventory.indexOf(offEntry));
        eq.shieldId = 'none';
      } else {
        eq.offhandId = 'none';
      }
    }

    // Auto-equipa escudo se permitido
    if (isTwoHanded || hasOneHandStyle || (eq.offhandId && eq.offhandId !== 'none')) {
      if (eq.shieldId && eq.shieldId !== 'none') eq.shieldId = 'none';
    } else if (eq.shieldId === null || eq.shieldId === undefined) {
      const shieldEntry = inventory.find((e, i) => catalog.get(e.itemId)?.tipo === 'escudo' || e.tipo === 'escudo' || e.escudo || e.attachedItem?.tipo === 'escudo');
      if (shieldEntry) eq.shieldId = equipEntryId(shieldEntry, inventory.indexOf(shieldEntry));
      else eq.shieldId = 'none';
    } else if (eq.shieldId !== 'none') {
      const shieldEntry = inventory.find((e, i) => matchEquipmentEntry(e, i, eq.shieldId));
      if (shieldEntry) {
        eq.shieldId = equipEntryId(shieldEntry, inventory.indexOf(shieldEntry));
      } else {
        eq.shieldId = 'none';
      }
    }

    if (eq.offhandId === null || eq.offhandId === undefined) {
      eq.offhandId = 'none';
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
  const wepEntry = eq.weaponId && eq.weaponId !== 'none' ? inventory.find((e,i)=>matchEquipmentEntry(e,i,eq.weaponId)) : null;
  const wepEntryId = wepEntry ? equipEntryId(wepEntry, inventory.indexOf(wepEntry)) : null;
  const entry=inventory.find((e,i)=>matchEquipmentEntry(e,i,eq.offhandId) && (!wepEntryId || equipEntryId(e, i) !== wepEntryId));
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
    if(eq.adaptableHandedness[entryId]) return eq.adaptableHandedness[entryId];
    const hasOther = (eq.offhandId && eq.offhandId !== 'none') || (eq.shieldId && eq.shieldId !== 'none');
    return hasOther ? 'uma_mao' : 'duas_maos';
  }
  return base;
}

/** Retorna true se a arma equipada na mão ocupa duas mãos (bloqueando escudo). */
function equippedWeaponBlocksShield(){
  if (equippedWeaponHandedness() === 'duas_maos') return true;
  const eq = equipmentState();
  if (eq.offhandId && eq.offhandId !== 'none') return true;
  return false;
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
  const getIcon = (name: string) => (typeof window !== 'undefined' && window.IconesForja) ? window.IconesForja.get(name, 'icon-sm') : '';
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

  const assignedSlotIndices = new Set<number>();
  const equippedCountByIndex = new Map<number, number>();
  const findEntryForSlot = (targetId: string | null | undefined): number => {
    if (!targetId || targetId === 'none') return -1;
    let idx = inventory.findIndex((e: any, i: number) => !assignedSlotIndices.has(i) && (e.instanceId === targetId || equipEntryId(e, i) === targetId));
    if (idx < 0) {
      idx = inventory.findIndex((e: any, i: number) => !assignedSlotIndices.has(i) && matchEquipmentEntry(e, i, targetId));
    }
    return idx;
  };

  const registerSlot = (targetId: string | null | undefined): number => {
    const idx = findEntryForSlot(targetId);
    if (idx >= 0) {
      assignedSlotIndices.add(idx);
      equippedCountByIndex.set(idx, (equippedCountByIndex.get(idx) || 0) + 1);
    }
    return idx;
  };

  const weaponIdx = registerSlot(eq.weaponId);
  const offhandIdx = (eq.offhandId && eq.offhandId !== 'none') ? registerSlot(eq.offhandId) : -1;
  const shieldIdx = (eq.shieldId && eq.shieldId !== 'none') ? registerSlot(eq.shieldId) : -1;
  const armorIdx = (eq.armorId && eq.armorId !== 'none') ? registerSlot(eq.armorId) : -1;
  const trailerIdx = (eq.trailerId && eq.trailerId !== 'none') ? registerSlot(eq.trailerId) : -1;

  if (Array.isArray(eq.wornIds)) {
    for (const wId of eq.wornIds) {
      if (!wId || wId === 'none') continue;
      registerSlot(wId);
    }
  }

  const isEntryEquipped = (entry: any, i: number) => {
    if (!entry) return false;
    if (typeof mountAssignmentActive === 'function' && mountAssignmentActive(entry)) return true;
    const totalQty = Number(entry.quantity || 1);
    const eqQty = equippedCountByIndex.get(i) || 0;
    return eqQty >= totalQty;
  };

  const groupedMap = new Map(), seenTraje = new Set();
  inventory.forEach((entry, i) => {
    if(/traje_de_viaj/i.test(entry?.itemId)||/traje_de_viaj/i.test(entry?.displayName)||/traje_de_viaj/i.test(entry?.itemName)){
      if(seenTraje.has('traje'))return;
      seenTraje.add('traje');
      entry.itemId='traje_de_viajante';
      entry.displayName='Traje de Viajante';
      entry.itemName='Traje de Viajante';
      entry.quantity=1;
    }
    if (isEntryEquipped(entry, i)) return;

    const item = catalog.get(entry.itemId) || entry;
    const name = itemName(entry);
    const key = `${name}|${entry.itemId}|${JSON.stringify(entry.improvements||[])}|${JSON.stringify(entry.enchantments||[])}`;
    const eqQty = equippedCountByIndex.get(i) || 0;
    const availableQty = Math.max(1, Number(entry.quantity || 1) - eqQty);
    if (groupedMap.has(key)) {
      const grp = groupedMap.get(key);
      grp.totalQuantity += availableQty;
      grp.entries.push(entry);
    } else {
      const id = equipEntryId(entry, i);
      groupedMap.set(key, {
        entry,
        item,
        id,
        totalQuantity: availableQty,
        entries: [entry]
      });
    }
  });

  const backpackEntries = Array.from(groupedMap.values()).map(grp => ({
    entry: { ...grp.entry, quantity: grp.totalQuantity },
    item: grp.item,
    id: grp.id
  }));

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
              actionButtons += `<button class="square-action-btn" type="button" data-equip-action="equip-shield" data-entry-id="${esc(id)}" title="Equipar escudo">${getIcon('shield')}</button>`;
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
        actionButtons += `<button class="square-action-btn" type="button" data-equip-action="equip-shield" data-entry-id="${esc(id)}" title="Equipar escudo">${getIcon('shield')}</button>`;
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
      if(handedness==='duas_maos'){
        handControls=`<button class="square-action-btn" type="button" data-equip-action="set-handedness-one" data-entry-id="${esc(entryId)}" title="Empunhadura: 2 mãos (clique para 1 mão)" aria-label="Alternar para 1 mão">${getIcon('two-hands')}</button>`;
      }else{
        handControls=`<button class="square-action-btn" type="button" data-equip-action="set-handedness-two" data-entry-id="${esc(entryId)}" title="Empunhadura: 1 mão (clique para 2 mãos)" aria-label="Alternar para 2 mãos">${getIcon('one-hand')}</button>`;
      }
    }else if(isTwoHanded){
      handControls=`<button class="square-action-btn" type="button" disabled title="Empunhadura: 2 mãos" aria-label="Arma de duas mãos">${getIcon('two-hands')}</button>`;
    }else{
      handControls=`<button class="square-action-btn" type="button" disabled title="Empunhadura: 1 mão" aria-label="Arma de uma mão">${getIcon('one-hand')}</button>`;
    }
    equippedSlots.push(`<div class="equip-worn-item">
      <div class="equip-item-label">Mão 1</div>
      <div class="equip-item-row">
        <strong class="equip-item-name" role="button" tabindex="0" data-item-details="${esc(eq.weaponId)}">${esc(itemName(entry))}</strong>
        <span class="equip-item-stats">${values?`Ataque ${values.attack} · Dano ${esc(values.damage)} · Crítico ${esc(formatWeaponCritical(values.critical||item?.arma?.critico))}`:'Item esotérico empunhado'}</span>
        <div class="equip-item-controls" style="display:flex;gap:4px;align-items:center;">
          ${handControls}
          <button class="square-action-btn" type="button" data-equip-action="store-weapon" title="Guardar item da Mão 1 na mochila">${getIcon('archive')}</button>
        </div>
      </div>
    </div>`);
  }else{
    equippedSlots.push(`<div class="equip-worn-item equip-empty-slot">
      <div class="equip-item-label">Mão 1</div>
      <div class="equip-item-row">
        <span class="equip-empty-text">Mão livre (vazia)</span>
      </div>
    </div>`);
  }

  const isPrimaryTwoHanded = equippedWeaponHandedness() === 'duas_maos';
  const offhandRec = equippedOffhandRecord() || heldItemRecords().find(r => r.id === eq.offhandId);
  const shieldRec = equippedShieldRecord();

  if (isPrimaryTwoHanded) {
    equippedSlots.push(`<div class="equip-worn-item equip-empty-slot">
      <div class="equip-item-label">Mão 2</div>
      <div class="equip-item-row">
        <span class="equip-empty-text">Ocupada com a arma de duas mãos</span>
      </div>
    </div>`);
  } else if (offhandRec) {
    const { entry, item, grip, id } = offhandRec;
    const isWep = item.tipo === 'arma' || item.arma || entry?.attachedItem?.tipo === 'arma' || entry?.attachedItem?.arma;
    const values = isWep ? effectiveWeaponStats(item, grip, entry) : null;
    let offhandHandControls = '';
    if ((item?.arma?.propriedadesIds || []).includes('adaptavel')) {
      offhandHandControls = `<button class="square-action-btn" type="button" data-equip-action="set-handedness-two" data-entry-id="${esc(id)}" title="Empunhar com duas mãos" aria-label="Empunhar com duas mãos">${getIcon('one-hand')}</button>`;
    } else if (isWep) {
      offhandHandControls = `<button class="square-action-btn" type="button" disabled title="Empunhadura: 1 mão" aria-label="Arma de uma mão">${getIcon('one-hand')}</button>`;
    }
    const isContraption = Boolean(entry?.isEngenhoca || entry?.contraptionId || item?.tipo === 'engenhoca' || entry?.formaUso === 'empunhada');
    const statsText = values ? `Ataque ${values.attack} · Dano ${esc(values.damage)}${values.critical ? ` · Crítico ${esc(formatWeaponCritical(values.critical))}` : ''}` : (isContraption ? 'Engenhoca empunhada' : 'Item empunhado');
    equippedSlots.push(`<div class="equip-worn-item">
      <div class="equip-item-label">Mão 2</div>
      <div class="equip-item-row">
        <strong class="equip-item-name" role="button" tabindex="0" data-item-details="${esc(id)}">${esc(itemName(entry))}</strong>
        <span class="equip-item-stats">${statsText}</span>
        <div class="equip-item-controls" style="display:flex;gap:4px;align-items:center;">
          ${offhandHandControls}
          <button class="square-action-btn" type="button" data-equip-action="store-offhand" data-entry-id="${esc(id)}" title="Guardar item da Mão 2 na mochila">${getIcon('archive')}</button>
        </div>
      </div>
    </div>`);
  } else if (eq.offhandId && eq.offhandId !== 'none') {
    const rawEntry = inventory.find((e, i) => matchEquipmentEntry(e, i, eq.offhandId));
    const name = rawEntry ? itemName(rawEntry) : 'Item empunhado';
    equippedSlots.push(`<div class="equip-worn-item">
      <div class="equip-item-label">Mão 2</div>
      <div class="equip-item-row">
        <strong class="equip-item-name" role="button" tabindex="0" data-item-details="${esc(eq.offhandId)}">${esc(name)}</strong>
        <span class="equip-item-stats">Item empunhado na Mão 2</span>
        <div class="equip-item-controls">
          <button class="square-action-btn" type="button" data-equip-action="store-offhand" data-entry-id="${esc(eq.offhandId)}" title="Guardar item da Mão 2 na mochila">${getIcon('archive')}</button>
        </div>
      </div>
    </div>`);
  } else if (shieldRec) {
    const { entry, item } = shieldRec;
    const shieldStats = typeof shieldPassiveStats === 'function' ? shieldPassiveStats(item, entry) : { defense: Number(item?.escudo?.bonusDefesa || 0), penalty: Number(item?.escudo?.penalidade || 0) };
    const def = shieldStats.defense, pen = shieldStats.penalty;
    equippedSlots.push(`<div class="equip-worn-item">
      <div class="equip-item-label">Mão 2 (Escudo)</div>
      <div class="equip-item-row">
        <strong class="equip-item-name" role="button" tabindex="0" data-item-details="${esc(eq.shieldId)}">${esc(itemName(entry))}</strong>
        <span class="equip-item-stats">Def +${def} · Pen ${pen} · ${Number(item?.espacos || 0)} esp.</span>
        <div class="equip-item-controls">
          <button class="square-action-btn" type="button" data-equip-action="store-shield" title="Guardar escudo na mochila">${getIcon('archive')}</button>
        </div>
      </div>
    </div>`);
  } else {
    equippedSlots.push(`<div class="equip-worn-item equip-empty-slot">
      <div class="equip-item-label">Mão 2</div>
      <div class="equip-item-row">
        <span class="equip-empty-text">Mão livre (vazia)</span>
      </div>
    </div>`);
  }
  if (dualWeaponAttackReady() || eq.dualAttack) {
    equippedSlots.push(`<button class="button small" data-equip-action="toggle-dual-attack" title="Desative no início do próximo turno">${eq.dualAttack ? 'Encerrar efeito duplo' : 'Atacar com ambas'} (${characterHasFeature('ambidestria') ? 'sem penalidade' : '−2 até o próximo turno'})</button>`);
  }

  // ── Bloco Inferior Direito: Itens Vestidos (Armadura, Traje, Tatuagens, Acessórios) ──
  const wornLimit=wornItemsLimit(),wornCount=wornItemsCount();
  const wornSlots=[];

  // Slot 1: Armadura
  const armorRec=equippedArmorRecord();
  if(armorRec){
    const {entry,item}=armorRec;
    const armorStats = typeof armorPassiveStats === 'function' ? armorPassiveStats(item, entry) : { defense: Number(item?.armadura?.defesa || 0), penalty: Number(item?.armadura?.penalidade || 0) };
    const def=armorStats.defense,pen=armorStats.penalty,cat=item?.armadura?.categoriaId||'';
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
          <button class="square-action-btn" type="button" data-equip-action="store-armor" title="Guardar armadura na mochila">${getIcon('archive')}</button>
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
          <button class="square-action-btn" type="button" data-equip-action="store-trailer" title="Guardar traje na mochila">${getIcon('archive')}</button>
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
        ?`<button class="square-action-btn" type="button" data-equip-action="cover-tattoo" data-entry-id="${esc(accId)}" title="Cobrir com a roupa (libera espaço de item vestido)">${getIcon('archive')}</button>`
        :`<button class="square-action-btn" type="button" data-equip-action="store-accessory" data-entry-id="${esc(accId)}" title="Guardar acessório na mochila">${getIcon('archive')}</button>`;
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
