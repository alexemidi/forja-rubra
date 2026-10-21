function sheetHeadingIcon(name){return '<span class="sheet-heading-icon" aria-hidden="true">'+(window.IconesForja?window.IconesForja.get(name,'icon-sm'):'')+'</span>';}
function renderSheetReductionText(summary){
  return formatarReducaoDano(summary).split(' · ').map(part=>{
    const match=part.match(/^(.*) (\d+)$/);
    return match?'<span class="sheet-rd-label">'+sheetHeadingIcon('damage-reduction')+esc(match[1])+'</span> <span class="sheet-rd-value">'+esc(match[2])+'</span>':esc(part);
  }).join(' · ');
}
let pdfItemsMapCache=null;
let lastPdfBaseLen=-1;
let lastPdfCustomLen=-1;
function getPdfItemsCatalog(){
  let customList = (typeof state !== 'undefined' && state?.customItems) || [];
  try {
    const prof = typeof activeCharacterProfile === 'function' ? activeCharacterProfile() : null;
    if (prof && Array.isArray(prof.customItems)) {
      customList = customList.concat(prof.customItems);
    }
  } catch {}
  try {
    const stored = localStorage.getItem('arsenal-arton-character-profiles-v1');
    if (stored) {
      const parsed = JSON.parse(stored);
      const active = parsed.profiles?.find(p => p.id === 'ficha-ativa') || parsed.profiles?.find(p => p.id === parsed.activeId) || parsed.profiles?.[0];
      if (active && Array.isArray(active.customItems)) {
        customList = customList.concat(active.customItems);
      }
    }
  } catch {}
  try {
    const pers = JSON.parse(localStorage.getItem('forja-heroi-t20-v1') || 'null');
    if (pers && Array.isArray(pers.customItems)) {
      customList = customList.concat(pers.customItems);
    }
  } catch {}
  const baseItems = (typeof DATA !== 'undefined' && DATA?.pdfItems) || [];
  if(!pdfItemsMapCache || baseItems.length !== lastPdfBaseLen || customList.length !== lastPdfCustomLen){
    pdfItemsMapCache = new Map();
    for(let i=0; i<baseItems.length; i++) pdfItemsMapCache.set(baseItems[i].id, baseItems[i]);
    for(let i=0; i<customList.length; i++) {
      if (customList[i] && customList[i].id) pdfItemsMapCache.set(customList[i].id, customList[i]);
    }
    lastPdfBaseLen = baseItems.length;
    lastPdfCustomLen = customList.length;
  }
  return pdfItemsMapCache;
}

function getSheetItemDisplayName(entry, catalog){
  if(!entry) return '';
  if(!catalog && typeof getPdfItemsCatalog === 'function') catalog = getPdfItemsCatalog();
  const itemId = entry.itemId || '';
  const opts = entry.options || {};
  if(itemId === 'ferramenta_agricola'){
    const custom = (opts.customName || entry.displayName || 'Forcado').trim();
    const clean = custom.replace(/\s*\(fazendeiro\)/i, '').replace(/ferramenta agr[íi]cola/i, 'Forcado').trim();
    return (clean || 'Forcado') + ' (Fazendeiro)';
  }
  if(itemId === 'ferramenta_pesada_lanca'){
    const def = opts.weaponModel === 'maca' ? 'Malho' : 'Picareta';
    const custom = (opts.customName || entry.displayName || def).trim();
    const clean = custom.replace(/\s*\(trabalhador\)/i, '').replace(/\s*\(lan[çc]a\)/i, '').replace(/\s*\(ma[çc]a\)/i, '').replace(/ferramenta pesada/i, def).trim();
    return (clean || def) + ' (Trabalhador)';
  }
  if(itemId === 'ferramenta_pesada'){
    const custom = (opts.customName || entry.displayName || 'Malho').trim();
    const clean = custom.replace(/\s*\(escravo\)/i, '').replace(/ferramenta pesada/i, 'Malho').trim();
    return (clean || 'Malho') + ' (Escravo)';
  }
  if(itemId === 'joia_de_familia'){
    const custom = (opts.customName || entry.displayName || '').trim();
    if(custom && !custom.includes('Joia de Família')) return custom + ' (Joia de Família)';
    return custom || 'Joia de Família';
  }
  if(itemId === 'joia_falsificada'){
    const custom = (opts.customName || entry.displayName || '').trim();
    if(custom && !custom.includes('Falsificado')) return custom + ' (Falsificado)';
    return custom || 'Joia Falsificada';
  }
  if(itemId === 'item_artistico'){
    const custom = (opts.customName || entry.displayName || '').trim();
    if(custom && !custom.includes('Item Artístico')) return custom + ' (Item Artístico)';
    return custom || 'Item Artístico';
  }
  if(itemId === 'tatuagem_adereco_gangue'){
    const custom = (opts.customName || entry.displayName || '').trim();
    if(custom && !custom.includes('Tatuagem/Adereço')) return custom + ' (Tatuagem/Adereço)';
    return custom || 'Tatuagem ou Adereço de Gangue';
  }
  if(itemId === 'item_sem_valor_admirador'){
    const custom = (opts.customName || entry.displayName || '').trim();
    if(custom && !custom.includes('Lembrança de Admirador')) return custom + ' (Lembrança de Admirador)';
    return custom || 'Lembrança de um Admirador';
  }
  if(itemId === 'pequeno_animal_estimacao'){
    const custom = (opts.customName || entry.displayName || '').trim();
    if(custom && !custom.includes('Animal de Estimação')) return custom + ' (Animal de Estimação)';
    return custom || 'Pequeno Animal de Estimação';
  }
  if(itemId === 'instrumentos_cozinheiro_aprimorados'){
    const custom = (opts.customName || entry.displayName || '').trim();
    if(custom && !custom.includes('Instrumentos Aprimorados')) return custom + ' (Instrumentos Aprimorados)';
    return custom || 'Instrumentos de Cozinheiro Aprimorados';
  }
  if(itemId === 'instrumentos_barbeiro'){
    const custom = (opts.customName || entry.displayName || '').trim();
    if(custom && !custom.includes('Instrumentos de Barbeiro')) return custom + ' (Instrumentos de Barbeiro)';
    return custom || 'Instrumentos de Barbeiro';
  }
  if(itemId === 'instrumentos_coureiro'){
    const custom = (opts.customName || entry.displayName || '').trim();
    if(custom && !custom.includes('Instrumentos de Coureiro')) return custom + ' (Instrumentos de Coureiro)';
    return custom || 'Instrumentos de Coureiro';
  }
  if(itemId === 'bola_ou_objeto_pintado'){
    const custom = (opts.customName || entry.displayName || '').trim();
    if(custom && !custom.includes('Objeto Amigo')) return custom + ' (Objeto Amigo)';
    return custom || 'Objeto com Rosto Pintado';
  }
  if(itemId === 'instrumentos_pescador'){
    const custom = (opts.customName || entry.displayName || '').trim();
    if(custom && !custom.includes('Instrumentos de Pescador')) return custom + ' (Instrumentos de Pescador)';
    return custom || 'Instrumentos de Pescador';
  }
  if(itemId === 'instrumentos_de_oficio'){
    const ofVal = opts.oficio || (entry.displayName && !entry.displayName.includes('—') ? entry.displayName : '');
    return typeof formatCraftToolName === 'function' ? formatCraftToolName(ofVal || entry.displayName) : (entry.displayName || 'Instrumentos de Ofício');
  }
  let n = entry.displayName || opts.customName || entry.itemName || catalog?.get?.(itemId)?.nome || itemId;
  if(/traje_de_viaj/i.test(n) || /traje_de_viaj/i.test(itemId)) return 'Traje de Viajante';
  return String(n).replace(/_/g, ' ');
}

function renderSheetSkillRows(order){
  if(!order) order = (typeof state !== 'undefined' && state?.sheetSkillOrder) ? state.sheetSkillOrder : 'attribute';
  const trained = new Set(allTrainedSkills());
  const passives = typeof passiveCharacterEffects === 'function' ? passiveCharacterEffects() : {skillBonuses:{}};
  const attrs = typeof finalAttrs === 'function' ? finalAttrs() : {};
  const trainBonus = typeof characterTrainingBonus === 'function' ? characterTrainingBonus() : 2;
  const halfLevel = Math.floor((Number(state.identity?.plannedLevel) || 1) / 2);
  const restricted = new Set(['adestramento','atuacao','conhecimento','guerra','jogatina','ladinagem','misticismo','nobreza','oficio','pilotagem','religiao']);

  // @ts-ignore
  const artRules = typeof RegrasArtesaoCriativo !== 'undefined' ? RegrasArtesaoCriativo : (typeof window !== 'undefined' ? (window as any).RegrasArtesaoCriativo : null);
  const temArtesaoCriativo = artRules && typeof artRules.temPoderArtesaoCriativo === 'function'
    ? artRules.temPoderArtesaoCriativo(state)
    : ((Array.isArray(state?.progression) && state.progression.some(p => p?.powerId === 'inventor_artesao_criativo' || p?.powerId === 'artesao_criativo' || /artes[aã]o criativo/i.test(p?.powerName || ''))) ||
       (Array.isArray(state?.powers) && state.powers.some(p => p?.id === 'inventor_artesao_criativo' || p?.id === 'artesao_criativo' || /artes[aã]o criativo/i.test(p?.nome || ''))));

  let officeIdsToDisplay = [...trained].filter(id=>String(id).startsWith('oficio:'));
  if (temArtesaoCriativo) {
    const principais = ['oficio:armeiro', 'oficio:alquimista', 'oficio:alfaiate', 'oficio:artesao', 'oficio:engenhoqueiro', 'oficio:culinaria', 'oficio:escriba'];
    principais.forEach(pid => {
      if (!officeIdsToDisplay.includes(pid)) officeIdsToDisplay.push(pid);
    });
  }

  const skillRecords = [...SKILLS, ...officeIdsToDisplay.map(id=>[id,skillDisplayName(id),'int'])].map(([id,name,baseAttr])=>[id,name,baseAttr,skillEffectiveAttribute(id)]);
  const seenSkills = new Set();
  return skillRecords.sort((a,b)=>(order==='attribute'?ATTRS.findIndex(x=>x[0]===a[2])-ATTRS.findIndex(x=>x[0]===b[2]):0)||a[1].localeCompare(b[1],'pt-BR')).filter(([id])=>!seenSkills.has(id)&&seenSkills.add(id)).map(([id,name,baseAttr,effectiveAttr])=>{
    const isOficio = String(id).startsWith('oficio:') || id === 'oficio';
    const isTrained = trained.has(id) || (isOficio && temArtesaoCriativo);
    const passiveBonus = Number(passives.skillBonuses?.[id] || 0);
    const masterBonus = Number(state?.masterBonuses?.skills?.[id] || 0);
    const tempBonus = Number(state?.tempManualBonuses?.skills?.[id] || 0);
    const totalBonus = passiveBonus + masterBonus + tempBonus;
    const rootId = String(id).split(':')[0];
    let skillTotalVal;
    if(!isTrained && restricted.has(rootId)){
      skillTotalVal = '<span class="skill-untrained-x" aria-label="Exige treinamento" style="font-family:\'Comic Sans MS\', \'Comic Sans\', cursive, sans-serif !important;font-weight:700;font-size:0.95rem;color:#ffffff !important;">X</span>';
    } else {
      let calc = Number(attrs[effectiveAttr] || 0) + halfLevel + (isTrained ? trainBonus : 0) + totalBonus;
      if (isOficio && temArtesaoCriativo && id !== 'oficio:artesao' && (trained.has('oficio:artesao') || trained.has('oficio_artesao'))) {
        const artesaoAttr = skillEffectiveAttribute('oficio:artesao');
        const artesaoCalc = Number(attrs[artesaoAttr] || 0) + halfLevel + trainBonus + Number(passives.skillBonuses?.['oficio:artesao'] || 0);
        calc = Math.max(calc, artesaoCalc);
      }
      skillTotalVal = calc;
    }
    let bonusLabel = '—';
    if(totalBonus !== 0){
      const sign = totalBonus > 0 ? '+' : '';
      if(tempBonus !== 0){
        bonusLabel = sign + totalBonus + ' <small style="color:#ffffff;font-size:0.7em" title="Inclui ' + (tempBonus > 0 ? '+' : '') + tempBonus + ' de bônus temporário manual">*</small>';
      } else {
        bonusLabel = sign + totalBonus;
      }
    }
    
    const attrUpper = String(effectiveAttr || baseAttr || '').toUpperCase();
    const isBandA = ['FOR', 'CON', 'SAB'].includes(attrUpper);
    const bandClass = order === 'attribute' ? (isBandA ? 'attr-band-a' : 'attr-band-b') : '';

    const starIcon = isTrained
      ? '<span class="skill-star-icon filled" title="Perícia treinada"><svg class="skill-star-svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></span>'
      : '<span class="skill-star-icon unfilled" title="Não treinada"><svg class="skill-star-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></span>';
    const numericBonus = typeof skillTotalVal === 'number' ? skillTotalVal : (Number(attrs[effectiveAttr] || 0) + halfLevel + (isTrained ? trainBonus : 0) + totalBonus);
    const isRestrictedUnmet = !isTrained && restricted.has(rootId);

    return '<tr class="'+(isTrained?'trained ':'')+bandClass+' skill-interactive-row" data-action="roll-skill" data-skill-id="'+esc(id)+'" data-skill-name="'+esc(name)+'" data-skill-attr="'+attrUpper+'" data-skill-bonus="'+numericBonus+'" data-skill-trained="'+(isTrained?'true':'false')+'" data-skill-restricted="'+(isRestrictedUnmet?'true':'false')+'" title="Clique para rolar '+esc(name)+' (1d20 + '+numericBonus+')" style="cursor:pointer;"><td class="skill-total">'+skillTotalVal+'</td><td class="skill-name">'+esc(name)+'</td><td class="skill-attr">'+attrUpper+'</td><td class="skill-train" style="text-align:center">'+starIcon+'</td><td class="skill-bonus">'+bonusLabel+'</td></tr>';
  }).join('');
}

function updateSheetSkillsOnly(){
  const container = document.querySelector('.sheet-preview-skills');
  if(!container) return false;
  const tbody = container.querySelector('tbody');
  const btn = container.querySelector('[data-sheet-skill-order]');
  if(!tbody) return false;
  const currentOrder = (typeof state !== 'undefined' && state?.sheetSkillOrder) ? state.sheetSkillOrder : 'attribute';
  if(btn) btn.textContent = currentOrder === 'attribute' ? 'Atributo + A–Z' : 'A–Z';
  tbody.innerHTML = renderSheetSkillRows(currentOrder);
  return true;
}

function updateSheetEquipmentAndDefenseOnly(){
  return ForjaCalculo.executar(updateSheetEquipmentAndDefenseContent);
}
function updateSheetEquipmentAndDefenseContent(){
  const preview = document.querySelector('.sheet-preview');
  if(!preview) return false;
  const inventory = typeof characterInventory === 'function' ? characterInventory() : [];
  const catalog = getPdfItemsCatalog();
  const passives = typeof passiveCharacterEffects === 'function' ? passiveCharacterEffects() : {defenseBonus:0};
  const stats = typeof progressionStats === 'function' ? progressionStats() : {defense:10};
  const armorRec = typeof equippedArmorRecord === 'function' ? equippedArmorRecord() : null;
  const shieldRec = typeof equippedShieldRecord === 'function' ? equippedShieldRecord() : null;
  const armor = armorRec?.item || (typeof equippedArmorItem === 'function' ? equippedArmorItem() : inventory.map(entry=>catalog.get(entry.itemId)).find(item=>item?.tipo==='armadura'));
  const shield = shieldRec?.item || (typeof equippedShieldItem === 'function' ? equippedShieldItem() : inventory.map(entry=>catalog.get(entry.itemId)).find(item=>item?.tipo==='escudo'));
  const armorEntry = armorRec?.entry || inventory.find(entry=>entry.itemId===armor?.id);
  const shieldEntry = shieldRec?.entry || inventory.find(entry=>entry.itemId===shield?.id);

  const armorStats = typeof armorPassiveStats === 'function' ? armorPassiveStats(armor, armorEntry) : { defense: Number(armor?.armadura?.defesa || 0), penalty: Number(armor?.armadura?.penalidade || 0) };
  const shieldStats = typeof shieldPassiveStats === 'function' ? shieldPassiveStats(shield, shieldEntry) : { defense: Number(shield?.escudo?.bonusDefesa || 0), penalty: Number(shield?.escudo?.penalidade || 0) };

  const equipmentDefense = armorStats.defense + shieldStats.defense;
  const manualDef = Number(state?.tempManualBonuses?.defense || 0);
  const previewDefense = stats.defense + equipmentDefense + manualDef;
  const defVal = preview.querySelector('.sheet-defense-value strong');
  const defSpan = preview.querySelector('.sheet-defense-value span');
  if(defVal) defVal.textContent = previewDefense;
  if(defSpan) defSpan.textContent = 'Base 10 + ' + (typeof characterDefenseAttribute === 'function' ? characterDefenseAttribute().toUpperCase() : 'DES') + ' + ' + armorStats.defense + ' de armadura + ' + shieldStats.defense + ' de escudo + ' + Number(passives.defenseBonus || 0) + ' bônus' + (manualDef ? ' + ' + (manualDef > 0 ? '+' : '') + manualDef + ' temporário' : '');
  
  const defTbody = preview.querySelector('.sheet-preview-table.defense-equipment tbody');
  const defenseSection=defTbody?.closest('section');
  if(defenseSection){
    const summary=typeof characterTotalReductionsSummary==='function'?characterTotalReductionsSummary():'';
    let reduction=defenseSection.querySelector('.sheet-defense-rd');
    if(summary){
      if(!reduction){reduction=document.createElement('p');reduction.className='sheet-defense-rd';defenseSection.append(reduction);}
      reduction.innerHTML=renderSheetReductionText(summary);
    }else reduction?.remove();
  }
  if(defTbody){
    const armorName = armor ? esc(getSheetItemDisplayName(armorEntry, catalog)) : '<span class="sheet-preview-empty">Nenhuma armadura equipada</span>';
    const shieldName = shield ? esc(getSheetItemDisplayName(shieldEntry, catalog)) : '<span class="sheet-preview-empty">Nenhum escudo equipado</span>';
    const defenseRows = '<tr><td><strong>Armadura</strong></td><td>'+armorName+'</td><td>'+(armor?'+'+armorStats.defense:'—')+'</td><td>'+(armor?(armorStats.penalty?armorStats.penalty:'0'):'—')+'</td><td>'+(armor?(armor.categoriaId==='pesada'||armor.armadura?.categoriaId==='pesada'?'Pesada':'Leve'):'—')+'</td><td>'+(armor?Number(armor.espacos||0)+' esp.':'—')+'</td></tr><tr><td><strong>Escudo</strong></td><td>'+shieldName+'</td><td>'+(shield?'+'+shieldStats.defense:'—')+'</td><td>'+(shield?(shieldStats.penalty?shieldStats.penalty:'0'):'—')+'</td><td>'+(shield?(shield.categoriaId==='pesado'||shield.escudo?.categoriaId==='pesado'?'Pesado':'Leve'):'—')+'</td><td>'+(shield?Number(shield.espacos||0)+' esp.':'—')+'</td></tr>';
    defTbody.innerHTML = defenseRows;
  }

  const eqWeapon = typeof equippedWeaponRecord === 'function' ? equippedWeaponRecord() : null;
  const rawWeapons = inventory.map(entry=>({entry, item: catalog.get(entry.itemId)})).filter(record=>record.item?.tipo==='arma');
  const sortedWeapons = [];
  if(eqWeapon?.item?.tipo==='arma') sortedWeapons.push({entry: eqWeapon.entry, item: eqWeapon.item});
  const equippedWeaponId = eqWeapon && typeof equipmentState === 'function' ? equipmentState().weaponId : '';
  rawWeapons.filter(w=>!eqWeapon || (typeof equipEntryId==='function'?equipEntryId(w.entry,inventory.indexOf(w.entry))!==equippedWeaponId:w.entry!==eqWeapon.entry)).sort((a,b)=>{const rA=typeof weaponHierarchyRank==='function'?weaponHierarchyRank(a.item):0,rB=typeof weaponHierarchyRank==='function'?weaponHierarchyRank(b.item):0;return rB-rA}).forEach(w=>{if(sortedWeapons.length<5)sortedWeapons.push(w)});
  const attacksTbody = preview.querySelector('.sheet-preview-table.attacks tbody');
  if(attacksTbody){
    const rangeLabels={curto:'Curto',medio:'Médio',longo:'Longo','3m':'3m','4_5m':'4,5m',cone_de_6m:'Cone de 6m'};
    const attackRows = sortedWeapons.length ? sortedWeapons.map(({entry,item})=>{const values=typeof weaponPassiveStats==='function'?weaponPassiveStats(item,entry):{attack:0,damage:''};const rangeText=item.arma?.alcanceId?((typeof RANGE_LABELS!=='undefined'&&RANGE_LABELS[item.arma.alcanceId])||rangeLabels[item.arma.alcanceId]||item.arma.alcanceId):'—';return '<tr><td>'+esc(getSheetItemDisplayName(entry,catalog))+'</td><td>'+values.attack+'</td><td>'+esc(values.damage)+'</td><td>'+esc(typeof formatWeaponCritical==='function'?formatWeaponCritical(values.critical||item.arma?.critico):(item.arma?.critico||''))+'</td><td>'+esc((item.arma?.tipoDanoIds||[]).join('/'))+'</td><td>'+esc(rangeText)+'</td></tr>'}).join('') : '<tr><td colspan="6" class="sheet-preview-empty">Nenhum ataque cadastrado.</td></tr>';
    attacksTbody.innerHTML = attackRows;
  }

  const equipPanelBody = preview.querySelector('.sheet-equipment-sections')?.parentElement || preview.querySelector('.equip-backpack-card')?.closest('.panel-body');
  if(equipPanelBody && typeof renderEquipmentPanel === 'function'){
    equipPanelBody.innerHTML = renderEquipmentPanel();
  } else if(typeof updateSheetMoneyAndLoadOnly === 'function'){
    updateSheetMoneyAndLoadOnly();
  }
  if(typeof sincronizarViolacaoArmaFundamentalista === 'function'){
    sincronizarViolacaoArmaFundamentalista({ notify: false });
  }
  return true;
}

function getFundamentalistWeaponViolation(){
  if(typeof state === 'undefined' || !state?.deity?.fundamentalist || state?.deity?.mode !== 'deity' || !state?.deity?.id){
    return { violated: false, offendingWeaponName: '', allowedWeapons: [] };
  }
  if(typeof ForjaUnificada?.checkFundamentalistWeaponViolation !== 'function'){
    return { violated: false, offendingWeaponName: '', allowedWeapons: [] };
  }
  const held = typeof heldItemRecords === 'function' ? heldItemRecords() : [];
  const eqW = typeof equippedWeaponRecord === 'function' ? equippedWeaponRecord() : null;
  const records = held.length ? held : (eqW ? [eqW] : []);
  const catalog = typeof getPdfItemsCatalog === 'function' ? getPdfItemsCatalog() : null;
  const equippedWeapons = records
    .map(r => {
      const item = r?.item || (r?.entry?.itemId && catalog ? catalog.get(r.entry.itemId) : null);
      if (!item || item.tipo !== 'arma') return null;
      return {
        id: item.id || r?.entry?.itemId || '',
        nome: item.nome || r?.entry?.itemName || r?.entry?.displayName || item.id || ''
      };
    })
    .filter(Boolean);
  return ForjaUnificada.checkFundamentalistWeaponViolation(state.deity.id, true, equippedWeapons);
}

function sincronizarViolacaoArmaFundamentalista(options = {}){
  const notify = options.notify !== false;
  const check = getFundamentalistWeaponViolation();
  if(!check.violated) return check;
  state.vitals = state.vitals || {};
  const hadPm = (Number(state.vitals.pm) || 0) > 0;
  state.vitals.pm = 0;
  if(typeof updateVitalVisuals === 'function'){
    updateVitalVisuals('pm', state.vitals);
  }
  if(notify || hadPm){
    const toastFn = typeof showToast === 'function' ? showToast : (typeof toast === 'function' ? toast : null);
    if(toastFn){
      toastFn(`Violação de Dogma Fundamentalista! Equipar "${check.offendingWeaponName}" viola suas Obrigações & Restrições (apenas a arma favorita da divindade é permitida). Seus PM foram zerados!`);
    }
  }
  if(typeof saveSheetVitals === 'function') saveSheetVitals();
  return check;
}
if(typeof window !== 'undefined'){
  window.getFundamentalistWeaponViolation = getFundamentalistWeaponViolation;
  window.sincronizarViolacaoArmaFundamentalista = sincronizarViolacaoArmaFundamentalista;
}

function sheetVitals(maximum){
  state.vitals=ForjaUnificada.normalizarVitais(state.vitals&&typeof state.vitals==='object'?state.vitals:{},maximum);
  if(typeof sincronizarIncentivadorEconomia === 'function'){
    sincronizarIncentivadorEconomia({ notify: false });
  }
  if(typeof sincronizarViolacaoArmaFundamentalista === 'function'){
    sincronizarViolacaoArmaFundamentalista({ notify: false });
  }
  return state.vitals;
}
const REST_COST_DATA = {
  ruim: { cost: 0, label: 'T$ 0' },
  normal: { cost: 0.5, label: 'TC 5' },
  confortavel: { cost: 4, label: 'T$ 4' },
  luxuosa: { cost: 20, label: 'T$ 20' }
};
function getCharacterAdventureSpent(){
  state.vitals = state.vitals || {};
  return Number(state.vitals.adventureSpentTibars) || 0;
}
function setCharacterAdventureSpent(val){
  state.vitals = state.vitals || {};
  state.vitals.adventureSpentTibars = Math.max(0, Math.round(Number(val) || 0));
}
function hasCharacterIncentivadorEconomia(){
  if(!state) return false;
  const prog = Array.isArray(state.progression) ? state.progression : [];
  if (prog.some(p => {
    if (!p) return false;
    const id = p.powerId || p.selectedPowerId;
    if (id === 'incentivador_da_economia') return true;
    if (typeof progressionPowerById === 'function') {
      const powObj = progressionPowerById(id);
      if (powObj && (powObj.id === 'incentivador_da_economia' || /incentivador\s*da\s*economia/i.test(powObj.nome || powObj.name || ''))) return true;
    }
    return false;
  })) return true;

  const generalList = [
    ...(Array.isArray(state.powers?.general) ? state.powers.general : []),
    ...Object.values(state.powers?.originGeneral || {})
  ];
  if (generalList.some(id => id === 'incentivador_da_economia')) return true;

  if (typeof selectedGeneralPowers === 'function') {
    const list = selectedGeneralPowers();
    if (Array.isArray(list) && list.some(p => p && (p.id === 'incentivador_da_economia' || /incentivador\s*da\s*economia/i.test(p.nome || p.name || '')))) {
      return true;
    }
  }

  const rawPowers = state.powers;
  const powersArr = Array.isArray(rawPowers)
    ? rawPowers
    : (rawPowers && typeof rawPowers === 'object' ? Object.values(rawPowers) : []);
  if (powersArr.some(p => {
    if (!p) return false;
    if (typeof p === 'string') return p === 'incentivador_da_economia' || /incentivador\s*da\s*economia/i.test(p);
    return p.id === 'incentivador_da_economia' || /incentivador\s*da\s*economia/i.test(p.nome || p.name || '');
  })) return true;

  const deityPower = state.deity?.power || state.deity?.powers || state.deity?.poderes || state.identity?.deityPower;
  if (deityPower) {
    const dStr = typeof deityPower === 'string' ? deityPower : JSON.stringify(deityPower);
    if (/incentivador/i.test(dStr)) return true;
  }

  const abilities = [
    ...(Array.isArray(state.abilities) ? state.abilities : []),
    ...(Array.isArray(state.features) ? state.features : [])
  ];
  if (abilities.some(a => {
    if (!a) return false;
    if (typeof a === 'string') return /incentivador\s*da\s*economia/i.test(a);
    return a.id === 'incentivador_da_economia' || /incentivador\s*da\s*economia/i.test(a.nome || a.name || '');
  })) return true;

  if (typeof DATA !== 'undefined' && Array.isArray(DATA?.generalPowers)) {
    const matchesGeneral = generalList.some(id => {
      const pow = DATA.generalPowers.find(gp => gp.id === id);
      return pow && /incentivador\s*da\s*economia/i.test(pow.nome || pow.name || '');
    });
    if (matchesGeneral) return true;
  }

  return false;
}

function getCharacterOverallLevel(){
  const planned = Number(state?.identity?.plannedLevel);
  if (Number.isSafeInteger(planned) && planned >= 1) return planned;
  const initial = Number(state?.identity?.initialLevel);
  if (Number.isSafeInteger(initial) && initial >= 1) return initial;
  const progLen = Array.isArray(state?.progression) ? state.progression.length : 0;
  if (progLen >= 1) return progLen;
  return 1;
}

function getIncentivadorBonusPm(){
  const hasIncentivador = hasCharacterIncentivadorEconomia();
  const spent = getCharacterAdventureSpent();
  const level = getCharacterOverallLevel();
  const threshold = 50 * level;
  const bonus = Math.floor(spent / threshold);
  return { hasIncentivador, spent, level, threshold, bonus };
}

function sincronizarIncentivadorEconomia(options = {}){
  const notify = options.notify !== false;
  const info = getIncentivadorBonusPm();
  if(!info.hasIncentivador) return;

  const vitals = state.vitals = state.vitals || {};
  const currentCredit = Math.max(0, Number(vitals.pmTempIncentivador) || 0);
  const targetCredit = info.bonus;

  if (targetCredit > currentCredit) {
    const diff = targetCredit - currentCredit;
    vitals.pmTempAdventure = (Number(vitals.pmTempAdventure) || 0) + diff;
    vitals.pmTempMax = (Number(vitals.pmTempDaily) || 0) + vitals.pmTempAdventure;
    const pmMax = Number(vitals.pmMax) || 0;
    const ceiling = pmMax + vitals.pmTempMax;
    vitals.pm = Math.min(ceiling, (Number(vitals.pm) || 0) + diff);
    vitals.pmTempIncentivador = targetCredit;

    if (typeof updateVitalVisuals === 'function') {
      updateVitalVisuals('pm', vitals);
    }
    if (notify) {
      const toastFn = typeof showToast === 'function' ? showToast : (typeof toast === 'function' ? toast : null);
      if (toastFn) {
        toastFn(`+${diff} PM temporário${diff > 1 ? 's' : ''} da aventura concedido${diff > 1 ? 's' : ''} automaticamente pelo Incentivador da Economia! Total: +${targetCredit} PM.`);
      }
    }
    if (typeof saveSheetVitals === 'function') saveSheetVitals();
  }
}

function registrarDespesaAventura(valorEmTibares){
  const custo = Math.max(0, Math.round(Number(valorEmTibares) || 0));
  if(custo <= 0) return;
  setCharacterAdventureSpent(getCharacterAdventureSpent() + custo);
  sincronizarIncentivadorEconomia({ notify: true });
  if(typeof updateAdventureModalUI === 'function') updateAdventureModalUI();
  if(typeof saveSheetVitals === 'function') saveSheetVitals();
  else if(typeof persistNow === 'function') persistNow();
}
if(typeof window !== 'undefined'){
  window.registrarDespesaAventura = registrarDespesaAventura;
  window.getIncentivadorBonusPm = getIncentivadorBonusPm;
  window.sincronizarIncentivadorEconomia = sincronizarIncentivadorEconomia;
}

function renderRestModalHtml(){
  return '<div id="sheetRestModal" class="forja-modal-backdrop" style="display:none;position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:100000;align-items:center;justify-content:center;background:rgba(5,7,11,0.88);backdrop-filter:blur(6px);padding:16px;box-sizing:border-box">' +
    '<div class="forja-rest-card" role="dialog" aria-modal="true" style="max-width:480px;width:95%;background:#111620;border:1px solid #263346;border-radius:8px;padding:20px;box-shadow:0 20px 50px rgba(0,0,0,0.85);color:#f8fafc;box-sizing:border-box">' +
      '<div class="rest-card-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;border-bottom:1px solid #1e293b;padding-bottom:10px">' +
        '<h3 class="rest-card-title" style="margin:0;font-size:1.15rem;color:#f0d28c;font-family:\'Cinzel\',serif;letter-spacing:0.5px">DESCANSAR</h3>' +
        '<button type="button" class="rest-close-x" data-vital-action="close-rest" aria-label="Fechar" style="background:transparent;border:1px solid #334155;color:#94a3b8;width:30px;height:30px;display:grid;place-items:center;padding:0;border-radius:4px;cursor:pointer;font-size:1.2rem;line-height:1">×</button>' +
      '</div>' +
      '<div class="rest-card-body" style="padding:0;display:flex;flex-direction:column;gap:12px">' +
        '<p class="rest-card-intro" style="margin:0;font-size:0.82rem;color:#94a3b8;line-height:1.4">Uma noite de descanso (pelo menos oito horas de sono) recupera PV e PM de acordo com seu nível e suas condições de descanso.</p>' +
        '<div class="rest-section">' +
          '<div style="font-size:0.75rem;font-weight:700;color:#94a3b8;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:8px">CONDIÇÃO DE DESCANSO</div>' +
          '<div class="rest-options-bar" style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">' +
            '<button type="button" class="rest-opt-btn" data-rest-quality="ruim" style="padding:8px 4px;font-size:0.82rem;font-weight:600;border-radius:6px;cursor:pointer;text-align:center">Ruim</button>' +
            '<button type="button" class="rest-opt-btn active" data-rest-quality="normal" style="padding:8px 4px;font-size:0.82rem;font-weight:600;border-radius:6px;cursor:pointer;text-align:center">Normal</button>' +
            '<button type="button" class="rest-opt-btn" data-rest-quality="confortavel" style="padding:8px 4px;font-size:0.82rem;font-weight:600;border-radius:6px;cursor:pointer;text-align:center">Confortável</button>' +
            '<button type="button" class="rest-opt-btn" data-rest-quality="luxuosa" style="padding:8px 4px;font-size:0.82rem;font-weight:600;border-radius:6px;cursor:pointer;text-align:center">Luxuosa</button>' +
          '</div>' +
        '</div>' +
        '<div id="restConditionDesc" class="rest-condition-desc" style="font-size:0.8rem;color:#94a3b8;min-height:2.2em;line-height:1.4">Dormir em uma estalagem comum constitui condição normal.</div>' +
        '<div class="rest-summary-box" style="background:#0d121a;border:1px solid #1e293b;border-radius:6px;padding:12px 14px;display:flex;justify-content:space-between;align-items:center">' +
          '<div style="font-size:0.88rem;color:#94a3b8">' +
            'Estadia: <strong id="restPayCostLabel" style="color:#f8fafc;font-weight:600">TC 5</strong>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:14px">' +
            '<strong id="restGainPv" style="color:#f0d28c;font-family:\'Cinzel\',serif;font-size:1.15rem">+ 1 PV</strong>' +
            '<strong id="restGainPm" style="color:#f0d28c;font-family:\'Cinzel\',serif;font-size:1.15rem">+ 1 PM</strong>' +
          '</div>' +
        '</div>' +
        ((typeof hasCosmopolita === 'function' && hasCosmopolita()) ?
          ('<div class="rest-cosmopolita-row" style="padding:8px 12px;background:#0d121a;border:1px solid #1e293b;border-radius:6px;display:flex;align-items:center;justify-content:space-between;gap:8px">' +
            '<div style="font-size:0.75rem;color:var(--text)">' +
              'Cosmopolita: <strong style="color:var(--gold2)">' + esc(typeof selectedCosmopolitaPower === 'function' ? selectedCosmopolitaPower()?.nome || 'Nenhum' : '—') + '</strong>' +
            '</div>' +
            '<button type="button" class="button small" data-vital-action="open-cosmopolita-swap" style="font-size:0.72rem;padding:3px 10px;height:24px;line-height:1">Trocar</button>' +
          '</div>') : '') +
      '</div>' +
      '<div class="rest-card-footer" style="display:flex;justify-content:flex-end;gap:10px;border-top:1px solid #1e293b;padding-top:14px;margin-top:14px">' +
        '<button type="button" class="vital-rest-cancel-btn" data-vital-action="close-rest" style="padding:8px 18px;background:transparent;border:1px solid #334155;color:#94a3b8;font-weight:600;border-radius:6px;cursor:pointer">Cancelar</button>' +
        '<button type="button" class="vital-rest-cortesia-btn" data-vital-action="rest" style="padding:8px 18px;background:#1e293b;border:1px solid #334155;color:#cbd5e1;font-weight:600;border-radius:6px;cursor:pointer">Cortesia</button>' +
        '<button type="button" class="vital-rest-confirm-btn" data-vital-action="rest-pay" style="padding:8px 20px;background:#991b1b;border:1px solid #ef4444;color:#fff;font-weight:700;border-radius:6px;cursor:pointer">Pagar estadia</button>' +
      '</div>' +
    '</div>' +
    (typeof renderCosmopolitaSwapModalHtml === 'function' ? renderCosmopolitaSwapModalHtml() : '') +
  '</div>';
}

function renderTempDurationModalHtml(){
  return '<div id="sheetTempDurationModal" class="forja-modal-backdrop" style="display:none;position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:100000;align-items:center;justify-content:center;background:rgba(5,7,11,0.88);backdrop-filter:blur(6px);padding:16px;box-sizing:border-box">' +
    '<div class="forja-rest-card" role="dialog" aria-modal="true" style="max-width:440px;width:95%;background:#111620;border:1px solid #263346;border-radius:8px;padding:20px;box-shadow:0 20px 50px rgba(0,0,0,0.85);color:#f8fafc;box-sizing:border-box">' +
      '<div class="rest-card-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;border-bottom:1px solid #1e293b;padding-bottom:10px">' +
        '<h3 class="rest-card-title" style="margin:0;font-size:1.1rem;color:#f0d28c;font-family:\'Cinzel\',serif;letter-spacing:0.5px">DURAÇÃO DO BÔNUS TEMPORÁRIO</h3>' +
        '<button type="button" class="rest-close-x" data-vital-action="close-temp-duration" aria-label="Fechar" style="background:transparent;border:1px solid #334155;color:#94a3b8;width:30px;height:30px;display:grid;place-items:center;padding:0;border-radius:4px;cursor:pointer;font-size:1.2rem;line-height:1">×</button>' +
      '</div>' +
      '<div class="rest-card-body" style="padding:0;display:flex;flex-direction:column;gap:12px">' +
        '<p id="tempDurationPrompt" style="margin:0;font-size:0.85rem;color:#cbd5e1;line-height:1.4">Escolha a duração para os pontos temporários adicionados:</p>' +
        '<div style="display:flex;flex-direction:column;gap:10px;margin-top:4px">' +
          '<button type="button" data-vital-action="confirm-temp-duration-daily" style="all:unset;display:flex;flex-direction:column;align-items:flex-start;gap:4px;padding:12px 14px;background:#0d121a;border:1px solid #1e293b;border-radius:6px;cursor:pointer;text-align:left;box-sizing:border-box;transition:border-color 0.15s,background 0.15s">' +
            '<strong style="color:#f0d28c;font-size:0.95rem;font-weight:700">Para o Dia</strong>' +
            '<span style="font-size:0.8rem;color:#94a3b8;line-height:1.35">Encerra após o próximo descanso diário (8 horas de sono).</span>' +
          '</button>' +
          '<button type="button" data-vital-action="confirm-temp-duration-adventure" style="all:unset;display:flex;flex-direction:column;align-items:flex-start;gap:4px;padding:12px 14px;background:#0d121a;border:1px solid #1e293b;border-radius:6px;cursor:pointer;text-align:left;box-sizing:border-box;transition:border-color 0.15s,background 0.15s">' +
            '<strong style="color:#f0d28c;font-size:0.95rem;font-weight:700">Para a Aventura</strong>' +
            '<span style="font-size:0.8rem;color:#94a3b8;line-height:1.35">Dura por múltiplos dias e encerra apenas ao Finalizar a Aventura.</span>' +
          '</button>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;justify-content:flex-end;gap:10px;border-top:1px solid #1e293b;padding-top:14px;margin-top:14px">' +
        '<button type="button" class="vital-rest-cancel-btn" data-vital-action="close-temp-duration" style="padding:8px 18px;background:transparent;border:1px solid #334155;color:#94a3b8;font-weight:600;border-radius:6px;cursor:pointer">Cancelar</button>' +
      '</div>' +
    '</div>' +
  '</div>';
}

function renderAdventureEndModalHtml(){
  const info = getIncentivadorBonusPm();
  return '<div id="sheetAdventureEndModal" class="forja-modal-backdrop" style="display:none;">' +
    '<div class="forja-rest-card" style="max-width:520px">' +
      '<div class="rest-card-header">' +
        '<h3 class="rest-card-title">FIM DA AVENTURA</h3>' +
        '<button type="button" class="rest-close-x" data-vital-action="close-adventure-modal" aria-label="Fechar">×</button>' +
      '</div>' +
      '<div class="rest-card-body">' +
        '<p class="rest-card-intro">Encerrar a aventura conclui a jornada atual, redefinindo os recursos de longa duração, mercenários contratados e gastos acumulados.</p>' +
        '<div class="rest-summary-box" style="display:flex;flex-direction:column;gap:10px">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #1e293b;padding-bottom:8px">' +
            '<span style="font-size:0.82rem;color:#94a3b8">Gastos registrados nesta aventura:</span>' +
            '<strong id="adventureSpentDisplay" style="color:#f0d28c;font-family:\'Cinzel\',serif">T$ ' + info.spent + '</strong>' +
          '</div>' +
          (info.hasIncentivador ? (
            '<div style="font-size:0.8rem;color:#94a3b8;line-height:1.4">' +
              'Poder <em>Incentivador da Economia</em>: meta de <strong>T$ ' + info.threshold + '</strong> por PM (nível ' + info.level + ').<br>' +
              'Bônus ativo atual: <strong id="adventureIncentivadorBonusDisplay" style="color:#f0d28c">+' + info.bonus + ' PM</strong> (dura até o fim da aventura).' +
            '</div>'
          ) : (
            '<div style="font-size:0.8rem;color:#94a3b8;line-height:1.4">' +
              'Contador de despesas desta aventura.' +
            '</div>'
          )) +
          '<div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #1e293b;padding-top:8px;font-size:0.82rem;color:#94a3b8">' +
            '<span>Efeitos que serão zerados:</span>' +
            '<span style="color:#cbd5e1">Bônus de Aventura, Contratos de Taverna e Despesas</span>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:8px;background:#0d121a;border:1px solid #1e293b;border-radius:6px;padding:8px 12px">' +
          '<label style="font-size:0.82rem;color:#94a3b8;flex:1">Registrar despesa nesta aventura (T$):</label>' +
          '<input type="number" id="adventureAddExpenseInput" min="0" step="1" value="50" style="width:70px;background:#111824;border:1px solid #263345;color:#f0d28c;font-weight:bold;text-align:center;border-radius:4px;height:28px;padding:2px">' +
          '<button type="button" class="button small" data-vital-action="add-adventure-expense" style="height:28px;padding:2px 10px;font-size:0.75rem;background:#1e293b;border:1px solid #334155;color:#cbd5e1;cursor:pointer;border-radius:4px">Adicionar</button>' +
        '</div>' +
      '</div>' +
      '<div class="rest-card-footer">' +
        '<button type="button" class="vital-rest-cancel-btn" data-vital-action="close-adventure-modal">Cancelar</button>' +
        '<button type="button" class="vital-rest-confirm-btn" data-vital-action="confirm-adventure-end">Encerrar aventura</button>' +
      '</div>' +
    '</div>' +
  '</div>';
}
function isModoMestreAtivo(){
  if(typeof window === 'undefined') return false;
  const p = new URLSearchParams(window.location.search);
  if(p.get('mestre') === 'true' || p.get('modo') === 'mestre') return true;
  if(localStorage.getItem('forja-modo-mestre') === 'true' || localStorage.getItem('forja_is_master') === 'true') return true;
  return false;
}

function renderTempBonusesModalHtml(){
  state.tempManualBonuses = state.tempManualBonuses || { defense: 0, skills: {} };
  state.masterBonuses = state.masterBonuses || { attrs: {}, skills: {} };
  const currentDef = Number(state.tempManualBonuses.defense || 0);
  const trained = new Set(typeof allTrainedSkills === 'function' ? allTrainedSkills() : []);
  const allAvailableSkills = [...SKILLS, ...[...trained].filter(id => String(id).startsWith('oficio:')).map(id => [id, typeof skillDisplayName === 'function' ? skillDisplayName(id) : id, 'int'])];
  const sortedSkills = allAvailableSkills.slice().sort((a,b) => a[1].localeCompare(b[1], 'pt-BR'));
  const isMestre = isModoMestreAtivo();
  
  const skillChips = Object.entries(state.tempManualBonuses.skills || {}).filter(([_, val]) => Number(val) !== 0).map(([id, val]) => {
    const sName = (SKILLS.find(s => s[0] === id)?.[1]) || (typeof skillDisplayName === 'function' ? skillDisplayName(id) : id);
    const sign = Number(val) > 0 ? '+' : '';
    return '<span class="tag gold" style="display:inline-flex;align-items:center;gap:6px;padding:4px 8px;font-size:0.75rem">' +
      esc(sName) + ' (Temp): <strong>' + sign + val + '</strong>' +
      '<button type="button" data-vital-action="remove-temp-skill" data-skill-id="' + esc(id) + '" style="background:none;border:none;color:var(--text);cursor:pointer;padding:0;font-weight:bold;margin-left:4px" title="Remover bônus">×</button>' +
    '</span>';
  }).join('');

  const masterChips = Object.entries(state.masterBonuses.skills || {}).filter(([_, val]) => Number(val) !== 0).map(([id, val]) => {
    const sName = (SKILLS.find(s => s[0] === id)?.[1]) || (typeof skillDisplayName === 'function' ? skillDisplayName(id) : id);
    const sign = Number(val) > 0 ? '+' : '';
    return '<span class="tag red" style="display:inline-flex;align-items:center;gap:6px;padding:4px 8px;font-size:0.75rem;background:#450a0a;border:1px solid #b91c1c;color:#fca5a5">' +
      esc(sName) + ' (Permanente Mestre): <strong>' + sign + val + '</strong>' +
      '<button type="button" data-vital-action="remove-master-skill" data-skill-id="' + esc(id) + '" style="background:none;border:none;color:#ffffff;cursor:pointer;padding:0;font-weight:bold;margin-left:4px" title="Remover bônus permanente">×</button>' +
    '</span>';
  }).join('');

  const mestreControlHtml = isMestre ? `
    <div style="background:#18181b;border:1px solid #dc2626;border-radius:6px;padding:8px 12px;margin-bottom:12px;display:flex;align-items:center;gap:14px;font-size:0.78rem">
      <strong style="color:#ef4444">Permissão do Mestre:</strong>
      <label style="display:inline-flex;align-items:center;gap:4px;cursor:pointer;color:#ffffff">
        <input type="radio" name="masterSkillModeRadio" value="temp" checked>
        <span>Temporário</span>
      </label>
      <label style="display:inline-flex;align-items:center;gap:4px;cursor:pointer;color:#ffffff">
        <input type="radio" name="masterSkillModeRadio" value="perm">
        <span style="color:#f87171;font-weight:bold">Permanente</span>
      </label>
    </div>
  ` : '';

  return '<div id="sheetTempBonusesModal" class="forja-modal-backdrop" style="display:none;">' +
    '<div class="forja-rest-card" style="max-width:440px">' +
      '<div class="rest-card-header">' +
        '<div class="rest-card-title">' + (isMestre ? 'MODIFICADORES DE FICHA · MESTRE' : 'BÔNUS TEMPORÁRIOS') + '</div>' +
        '<button type="button" class="rest-close-x" data-vital-action="close-temp-bonuses">×</button>' +
      '</div>' +
      '<div class="rest-card-body" style="padding:14px">' +
        '<p class="help" style="margin:0 0 12px 0;font-size:0.75rem;color:var(--muted)">' +
          (isMestre ? 'Como mestre, você pode aplicar alterações temporárias ou bônus/penalidades permanentes diretamente na ficha do aventureiro.' : 'Adicione bônus temporários ou situacionais. <strong style="color:var(--gold2)">Esses bônus manuais são zerados automaticamente ao realizar um descanso.</strong>') +
        '</p>' +
        mestreControlHtml +
        '<div style="background:#0d121a;border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:12px">' +
          '<label style="display:flex;align-items:center;justify-content:space-between;gap:10px;font-weight:bold;color:var(--text);font-size:0.82rem">' +
            '<span>Bônus na Defesa:</span>' +
            '<div style="display:flex;align-items:center;gap:4px">' +
              '<button type="button" class="button small" data-vital-action="adjust-temp-def" data-delta="-1" style="min-width:26px;padding:2px 6px">−</button>' +
              '<input type="number" id="manualTempDefInput" value="' + currentDef + '" step="1" style="width:54px;text-align:center;height:28px;padding:2px;background:#111824;border:1px solid #263345;color:var(--gold2);font-weight:bold;border-radius:4px">' +
              '<button type="button" class="button small" data-vital-action="adjust-temp-def" data-delta="1" style="min-width:26px;padding:2px 6px">+</button>' +
            '</div>' +
          '</label>' +
        '</div>' +
        '<div style="background:#0d121a;border:1px solid var(--border);border-radius:8px;padding:12px">' +
          '<div style="font-weight:bold;color:var(--text);font-size:0.82rem;margin-bottom:8px">Bônus em Perícia:</div>' +
          '<div style="display:flex;gap:8px;align-items:center;margin-bottom:10px">' +
            '<select id="manualTempSkillSelect" class="select" style="flex:1;height:32px;font-size:0.78rem">' +
              '<option value="">Selecione uma opção…</option>' +
              '<optgroup label="Em Lote / Categorias">' +
                '<option value="group:all">★ Todas as perícias</option>' +
                '<option value="group:except_attacks">★ Todas exceto Luta e Pontaria</option>' +
              '</optgroup>' +
              '<optgroup label="Por Atributo">' +
                '<option value="attr:for">Perícias de Força (FOR)</option>' +
                '<option value="attr:des">Perícias de Destreza (DES)</option>' +
                '<option value="attr:con">Perícias de Constituição (CON)</option>' +
                '<option value="attr:int">Perícias de Inteligência (INT)</option>' +
                '<option value="attr:sab">Perícias de Sabedoria (SAB)</option>' +
                '<option value="attr:car">Perícias de Carisma (CAR)</option>' +
              '</optgroup>' +
              '<optgroup label="Perícia Individual">' +
                sortedSkills.map(([id, name]) => '<option value="' + esc(id) + '">' + esc(name) + '</option>').join('') +
              '</optgroup>' +
            '</select>' +
            '<input type="number" id="manualTempSkillValInput" value="2" step="1" style="width:50px;text-align:center;height:32px;padding:2px;background:#111824;border:1px solid #263345;color:var(--gold2);font-weight:bold;border-radius:4px">' +
            '<button type="button" class="button small primary" data-vital-action="apply-temp-skill" style="height:32px;padding:2px 10px;font-size:0.75rem;white-space:nowrap">Aplicar</button>' +
          '</div>' +
          '<div id="tempSkillChipsList" style="display:flex;flex-wrap:wrap;gap:6px;min-height:24px;max-height:140px;overflow-y:auto;padding:2px">' +
            (masterChips + skillChips || '<span style="font-size:0.72rem;color:var(--dim)">Nenhum bônus temporário de perícia ativo.</span>') +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="rest-card-footer" style="padding:10px 14px;display:flex;justify-content:space-between;align-items:center">' +
        '<button type="button" class="button text-button" data-vital-action="clear-all-temp" style="color:#ef4444;font-size:0.75rem">Limpar temporários</button>' +
        '<button type="button" class="button primary" data-vital-action="close-temp-bonuses" style="font-size:0.78rem;padding:4px 14px">Concluir</button>' +
      '</div>' +
    '</div>' +
  '</div>';
}
function openTempBonusesModal(){
  const modal = document.getElementById('sheetTempBonusesModal');
  if(!modal) return;
  modal.style.display = 'flex';
  updateTempBonusesModalUI();
}
function closeTempBonusesModal(){
  const modal = document.getElementById('sheetTempBonusesModal');
  if(modal) modal.style.display = 'none';
}
function updateTempBonusesModalUI(){
  const modal = document.getElementById('sheetTempBonusesModal');
  if(!modal) return;
  state.tempManualBonuses = state.tempManualBonuses || { defense: 0, skills: {} };
  state.masterBonuses = state.masterBonuses || { attrs: {}, skills: {} };
  const defInput = modal.querySelector('#manualTempDefInput');
  if(defInput) defInput.value = Number(state.tempManualBonuses.defense || 0);
  const chipsList = modal.querySelector('#tempSkillChipsList');
  if(chipsList){
    const tempChips = Object.entries(state.tempManualBonuses.skills || {}).filter(([_, val]) => Number(val) !== 0).map(([id, val]) => {
      const sName = (SKILLS.find(s => s[0] === id)?.[1]) || (typeof skillDisplayName === 'function' ? skillDisplayName(id) : id);
      const sign = Number(val) > 0 ? '+' : '';
      return '<span class="tag gold" style="display:inline-flex;align-items:center;gap:6px;padding:4px 8px;font-size:0.75rem">' +
        esc(sName) + ' (Temp): <strong>' + sign + val + '</strong>' +
        '<button type="button" data-vital-action="remove-temp-skill" data-skill-id="' + esc(id) + '" style="background:none;border:none;color:var(--text);cursor:pointer;padding:0;font-weight:bold;margin-left:4px" title="Remover bônus temporário">×</button>' +
      '</span>';
    }).join('');

    const masterChips = Object.entries(state.masterBonuses.skills || {}).filter(([_, val]) => Number(val) !== 0).map(([id, val]) => {
      const sName = (SKILLS.find(s => s[0] === id)?.[1]) || (typeof skillDisplayName === 'function' ? skillDisplayName(id) : id);
      const sign = Number(val) > 0 ? '+' : '';
      return '<span class="tag red" style="display:inline-flex;align-items:center;gap:6px;padding:4px 8px;font-size:0.75rem;background:#450a0a;border:1px solid #b91c1c;color:#fca5a5">' +
        esc(sName) + ' (Permanente Mestre): <strong>' + sign + val + '</strong>' +
        '<button type="button" data-vital-action="remove-master-skill" data-skill-id="' + esc(id) + '" style="background:none;border:none;color:#ffffff;cursor:pointer;padding:0;font-weight:bold;margin-left:4px" title="Remover bônus permanente">×</button>' +
      '</span>';
    }).join('');

    chipsList.innerHTML = (masterChips + tempChips) || '<span style="font-size:0.72rem;color:var(--dim)">Nenhum bônus de perícia ativo.</span>';
  }
}
function calculateVitalBarMetrics(val){
  const v=Math.max(0,Number(val)||0);
  let units=10;
  if(v<=20){
    units=10;
  }else if(v>=100){
    units=20;
  }else{
    units=10+((v-20)/8);
  }
  const widthPx=Math.round(units*14);
  let tier=1;
  if(v>400)tier=5;
  else if(v>300)tier=4;
  else if(v>200)tier=3;
  else if(v>100)tier=2;
  return {units,widthPx,tier};
}

function getVitalLayerMetrics(val, maxCap){
  const v=Math.max(0,Number(val)||0);
  const cap=Math.max(1,Number(maxCap)||1);
  if(v<=0){
    return {currentTier:1,underTier:0,topRatio:0,showUnder:false};
  }
  const getTier=(n)=>n>400?5:n>300?4:n>200?3:n>100?2:1;
  const currentTier=getTier(v);
  const maxTier=getTier(cap);

  const underTier=currentTier-1;
  const showUnder=underTier>=1;

  const tierFloor=(currentTier-1)*100;
  const curInTier=Math.max(0,v-tierFloor);

  let tierCapacity;
  if(currentTier===maxTier){
    tierCapacity=Math.max(1,cap-tierFloor);
  }else{
    tierCapacity=100;
  }

  const topRatio=Math.max(0,Math.min(1,curInTier/tierCapacity));
  return {currentTier,underTier,topRatio,showUnder};
}

function sheetVitalControls(maximum){
  const vitals=sheetVitals(maximum);
  const pvMax=vitals.pvMax||1, pv=vitals.pv;
  const pvBleedMax=Math.max(1, Math.floor(pvMax/2));
  const isHeroDead=pvMax>0 && pv<=-pvBleedMax;

  const ring=(key,label,color,downText,upText)=>{
    const cur=vitals[key],max=vitals[key+'Max'],tempMax=vitals[key+'TempMax']||0;
    const tempMode=Boolean(vitals[key+'TempMode']);
    const bleedMax=key==='pv'?Math.max(1, Math.floor(max/2)):0;
    const totalCap=tempMax>0?max+tempMax:max;
    const isDead=isHeroDead;
    const isBleeding=key==='pv'&&cur<0&&!isDead;
    const tempActual=Math.max(0,cur-max);
    const barMetrics=calculateVitalBarMetrics(Math.max(totalCap, cur));

    let baseFillWidth='0%';
    let baseFillClass=key==='pv'?'vital-fill-pv':'vital-fill-pm';
    let baseUnderClass='';
    let baseUnderDisplay='none';

    if(key==='pv'&&(isBleeding||isDead)){
      const bleedRatio=isHeroDead?1:Math.max(0,Math.min(1,Math.abs(cur)/bleedMax));
      baseFillWidth=(bleedRatio*100).toFixed(1)+'%';
      baseFillClass='vital-fill-bleed';
      baseUnderDisplay='none';
    }else{
      const layer=getVitalLayerMetrics(cur,totalCap);
      baseFillClass=(key==='pv'?'vital-fill-pv':'vital-fill-pm')+' vital-tier-'+layer.currentTier;
      baseFillWidth=(layer.topRatio*100).toFixed(1)+'%';
      if(layer.showUnder){
        baseUnderDisplay='block';
        baseUnderClass=(key==='pv'?'vital-fill-pv':'vital-fill-pm')+' vital-tier-'+layer.underTier;
      }
    }

    let centerNumClass='vital-current-num';
    if(isDead){
      centerNumClass+=' is-dead';
    }else if(isBleeding){
      centerNumClass+=' is-bleeding';
    }else if(tempActual>0){
      centerNumClass+=' has-temp';
    }

    const leftBtnAction = tempMode ? (key + '-clear-temp') : (key + '-down');
    const leftBtnText = tempMode ? 'Encerrar' : downText;
    const leftBtnClass = tempMode
      ? 'button small text-button button-vital-down button-vital-clear-temp'
      : 'button small button-vital-down';

    const rightBtnAction = tempMode ? (key + '-add-temp') : (key + '-up');
    const rightBtnText = tempMode ? 'Adicionar' : upText;
    const rightBtnClass = tempMode
      ? 'button small primary button-vital-up button-vital-add-temp'
      : ('button small button-vital-up ' + (key === 'pv' ? 'vital-up-pv' : 'vital-up-pm'));

    let tempBtnText='';
    if(tempMax>0){
      tempBtnText='+ '+tempMax+' '+label+' <span class="vital-temp-underline">Temporários</span>';
    }else{
      tempBtnText='+ '+label+' <span class="vital-temp-underline">Temporários</span>';
    }

    const pencilIco = window.IconesForja ? window.IconesForja.get('pencil', 'icon-sm') : '';

    return '<div class="sheet-vital-card '+(isDead?'is-dead':'')+' '+(isBleeding?'is-bleeding':'')+'" data-vital-card="'+key+'">' +
      '<div class="vital-card-header">' +
        '<span class="vital-card-title '+(key==='pv'?'vital-title-pv':'vital-title-pm')+'">'+label+'</span>' +
        '<span class="vital-card-ratio '+(tempMax>0?'has-temp':'')+'" data-vital-label="'+key+'">' +
          '<span data-vital-center="'+key+'" class="'+centerNumClass+'">'+cur+'</span>/'+(isBleeding||isDead?max:totalCap) +
        '</span>' +
      '</div>' +
      '<!-- Barras Proporcionais em Camadas de Chefe -->' +
      '<div class="vital-bars-wrapper '+(tempMax>0?'has-temp-bar':'')+'" data-vital-bars="'+key+'" style="width:'+barMetrics.widthPx+'px;max-width:'+barMetrics.widthPx+'px;">' +
        '<div class="vital-pill-track vital-pill-base" data-vital-pill-base="'+key+'" data-vital-bar-base="'+key+'" style="flex:1 1 100%;display:block;">' +
          '<div class="vital-pill-fill-under '+baseUnderClass+'" data-vital-under-base="'+key+'" style="display:'+baseUnderDisplay+';"></div>' +
          '<div class="vital-pill-fill '+baseFillClass+'" data-vital-fill-base="'+key+'" data-vital-bar-bleed="'+key+'" style="width:'+baseFillWidth+';"></div>' +
        '</div>' +
        '<div class="vital-pill-track vital-pill-temp" data-vital-pill-temp="'+key+'" data-vital-bar-temp="'+key+'" style="display:none;">' +
          '<div class="vital-pill-fill-under" data-vital-under-temp="'+key+'" style="display:none;"></div>' +
          '<div class="vital-pill-fill" data-vital-fill-temp="'+key+'" style="width:0%;"></div>' +
        '</div>' +
      '</div>' +
      '<div class="vital-action-bar">' +
        '<button class="'+leftBtnClass+'" type="button" data-vital-action="'+leftBtnAction+'" '+(tempMode?'style="color:#ef4444;"':'')+'>'+leftBtnText+'</button>' +
        '<button class="'+rightBtnClass+'" type="button" data-vital-action="'+rightBtnAction+'">'+rightBtnText+'</button>' +
        '<button class="vital-edit-icon-btn" type="button" data-vital-action="toggle-edit-'+key+'" title="Editar '+label+' manualmente" aria-label="Editar '+label+' manualmente">'+pencilIco+'</button>' +
      '</div>' +
      '<div class="vital-temp-toggle-wrap" style="margin-top:8px;display:flex;align-items:center;justify-content:center;gap:8px;">' +
        '<input type="number" min="1" step="1" value="1" data-vital-amount="'+key+'" class="vital-amount-box" aria-label="Quantidade de '+label+'" style="width:48px;height:28px;text-align:center;">' +
        '<button type="button" class="vital-temp-toggle-btn '+(tempMode?'active':'')+'" data-vital-action="toggle-temp-'+key+'">' +
          tempBtnText +
        '</button>' +
      '</div>' +
      '<div class="vital-manual-edit-row" data-vital-manual="'+key+'" style="display:none;">' +
        '<label><small>Atual</small><input type="number" data-vital-current="'+key+'" value="'+cur+'"></label>' +
        '<label><small>Máx</small><input type="number" value="'+max+'" readonly></label>' +
        '<label><small>Máx Temp</small><input type="number" data-vital-temp-max="'+key+'" value="'+tempMax+'"></label>' +
      '</div>' +
    '</div>';
  };
  const upIcon = window.IconesForja ? window.IconesForja.get('arrow-up', 'sheet-action-icon-svg') : '▲';
  const downIcon = window.IconesForja ? window.IconesForja.get('arrow-down', 'sheet-action-icon-svg') : '▼';
  const pencilIcon = window.IconesForja ? window.IconesForja.get('pencil', 'sheet-action-icon-svg') : '';
  const eyeIcon = window.IconesForja ? window.IconesForja.get('eye', 'sheet-action-icon-svg') : '◎';
  const bedIcon = window.IconesForja ? window.IconesForja.get('bed', 'sheet-action-icon-svg') : '⌂';
  const compassIcon = window.IconesForja ? window.IconesForja.get('compass', 'sheet-action-icon-svg') : '◈';

  const currentLevel = Number(state?.identity?.plannedLevel) || 1;
  const canLevelUp = currentLevel < 20;
  const canHaveDistinction = currentLevel >= 5;
  const distinctionIcon = window.IconesForja ? window.IconesForja.get('award', 'sheet-action-icon-svg') : '';
  const trainingIcon = '<svg class="forja-svg sheet-action-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>';
  const trainingCount = [state?.levelTraining?.pv, state?.levelTraining?.pm, state?.levelTraining?.skills, state?.levelTraining?.power].filter(Boolean).length;

  const vitalsActionsHtml = `
    <div class="sheet-vitals-actions-row">
      ${canHaveDistinction ? `
        <a href="distincoes.html" class="sheet-action-icon-btn sheet-distinction-btn" title="Distinções de Arton (Nível 5+)" aria-label="Distinções de Arton">
          ${distinctionIcon}
        </a>
      ` : ''}
      ${canLevelUp ? `
        <button type="button" class="sheet-action-icon-btn sheet-training-btn" data-vital-action="open-level-training" title="Treinamento (Adiantar ganhos do Nível ${currentLevel + 1}: ${trainingCount}/4 concluídos)" aria-label="Treinamento de Nível" style="position:relative;border-color:${trainingCount > 0 ? '#d9a84e' : '#28364b'};color:${trainingCount > 0 ? '#f0d28c' : '#94a3b8'};">
          ${trainingIcon}
          ${trainingCount > 0 ? `<span style="position:absolute;top:-5px;right:-5px;background:#d9a84e;color:#0b0f17;font-size:0.55rem;font-weight:800;padding:1px 4px;border-radius:999px;line-height:1;">${trainingCount}/4</span>` : ''}
        </button>
      ` : ''}
      <button type="button" class="sheet-action-icon-btn sheet-level-up-btn ${canLevelUp ? '' : 'is-disabled'}" data-sheet-action="level-up" ${canLevelUp ? '' : 'disabled'} title="${canLevelUp ? 'Subir de Nível' : 'Nível máximo atingido (20)'}">
        ${upIcon}
      </button>
      ${currentLevel > 1 ? `
        <button type="button" class="sheet-action-icon-btn sheet-revert-level-btn" data-vital-action="open-revert-level" title="Reverter Nível (Retornar para o Nível ${currentLevel - 1})" aria-label="Reverter Nível" style="background:rgba(220,38,38,0.14);border-color:#b91c1c;color:#fca5a5;">
          ${downIcon}
        </button>
      ` : ''}
      <button type="button" class="sheet-action-icon-btn sheet-edit-btn" data-sheet-action="edit" title="Editar Ficha">
        ${pencilIcon}
      </button>
      <button type="button" class="sheet-action-icon-btn sheet-toggle-simplified-btn" data-sheet-action="toggle-simplified" title="Alternar Modo de Ficha (Completa / Simplificada / Resumida)">
        ${eyeIcon}
      </button>
      <button type="button" class="sheet-action-icon-btn sheet-rest-btn" data-vital-action="open-rest" title="Descanso">
        ${bedIcon}
      </button>
      <button type="button" class="sheet-action-icon-btn sheet-adventure-btn" data-vital-action="open-adventure-modal" title="Fim da Aventura (Zerar temporários de aventura, PM do Incentivador e mercenários)" aria-label="Fim da Aventura">
        ${compassIcon}
      </button>
    </div>
  `;

  return '<section class="sheet-preview-vitals">' +
    '<div class="sheet-vitals-grid">' +
      ring('pv','PV','#16a34a','Dano','Curar') +
      ring('pm','PM','#0284c7','Gasto','Recuperar') +
    '</div>' +
    '<div class="sheet-vitals-conditions-wrap">' +
      vitalsActionsHtml +
    '</div>' +
    renderRestModalHtml() +
    renderTempBonusesModalHtml() +
    renderAdventureEndModalHtml() +
    renderTempDurationModalHtml() +
    (typeof renderLevelTrainingModalHtml === 'function' ? renderLevelTrainingModalHtml() : '') +
    (typeof renderRevertLevelModalHtml === 'function' ? renderRevertLevelModalHtml() : '') +
  '</section>';
}
function updateVitalVisuals(key,vitals){
  const cur=vitals[key],max=vitals[key+'Max'],tempMax=vitals[key+'TempMax']||0;
  const tempMode=Boolean(vitals[key+'TempMode']);
  const tempActual=Math.max(0,cur-max);
  const pvMax=vitals.pvMax||1, pv=vitals.pv;
  const pvBleedMax=Math.max(1, Math.floor(pvMax/2));
  const isHeroDead=pvMax>0 && pv<=-pvBleedMax;
  const isBleeding=key==='pv'&&cur<0&&!isHeroDead;

  if(isHeroDead && vitals.pm>0){
    vitals.pm=0;
    const pmInput=document.querySelector('[data-vital-current="pm"]');
    if(pmInput) pmInput.value='0';
    const pmFill=document.querySelector('[data-vital-fill-base="pm"]');
    if(pmFill) pmFill.style.width='0%';
    const pmUnder=document.querySelector('[data-vital-under-base="pm"]');
    if(pmUnder) pmUnder.style.display='none';
    const pmLabel=document.querySelector('[data-vital-label="pm"]');
    if(pmLabel){
      const pmTotalCap=(vitals.pmTempMax||0)>0?(vitals.pmMax+vitals.pmTempMax):vitals.pmMax;
      pmLabel.innerHTML='<span data-vital-center="pm" class="vital-current-num is-dead">0</span>/'+pmTotalCap;
    }
  }

  document.querySelectorAll('.sheet-vital-card').forEach(card=>{
    card.classList.toggle('is-dead',isHeroDead);
  });
  const myCard=document.querySelector('[data-vital-card="'+key+'"]');
  if(myCard) myCard.classList.toggle('is-bleeding',isBleeding);

  const totalCap=tempMax>0?max+tempMax:max;
  const barMetrics=calculateVitalBarMetrics(Math.max(totalCap, cur));
  const barsWrapper=document.querySelector('[data-vital-bars="'+key+'"]');
  if(barsWrapper){
    barsWrapper.style.width=barMetrics.widthPx+'px';
    barsWrapper.style.maxWidth=barMetrics.widthPx+'px';
    barsWrapper.classList.toggle('has-temp-bar', tempMax>0);
  }

  const labelEl=document.querySelector('[data-vital-label="'+key+'"]');
  if(labelEl){
    labelEl.classList.toggle('has-temp',tempMax>0);
    const centerClass='vital-current-num '+(isHeroDead?'is-dead':isBleeding?'is-bleeding':tempActual>0?'has-temp':'');
    labelEl.innerHTML='<span data-vital-center="'+key+'" class="'+centerClass+'">'+cur+'</span>/'+(isBleeding||isHeroDead?max:totalCap);
  }

  const input=document.querySelector('[data-vital-current="'+key+'"]');
  if(input)input.value=String(cur);
  const tempMaxInput=document.querySelector('[data-vital-temp-max="'+key+'"]');
  if(tempMaxInput)tempMaxInput.value=String(tempMax);

  const basePill=document.querySelector('[data-vital-pill-base="'+key+'"]');
  const tempPill=document.querySelector('[data-vital-pill-temp="'+key+'"]');
  const baseFill=document.querySelector('[data-vital-fill-base="'+key+'"]');
  const baseUnder=document.querySelector('[data-vital-under-base="'+key+'"]');
  const tempFill=document.querySelector('[data-vital-fill-temp="'+key+'"]');
  const tempUnder=document.querySelector('[data-vital-under-temp="'+key+'"]');

  if(tempPill) tempPill.style.display='none';
  if(tempUnder) tempUnder.style.display='none';
  if(tempFill) tempFill.style.width='0%';
  if(basePill){
    basePill.style.flex='1 1 100%';
    basePill.style.display='block';
  }

  if(key==='pv'&&(isBleeding||isHeroDead)){
    if(baseUnder) baseUnder.style.display='none';
    if(baseFill){
      const bleedRatio=isHeroDead?1:Math.max(0,Math.min(1,Math.abs(cur)/pvBleedMax));
      baseFill.className='vital-pill-fill vital-fill-bleed';
      baseFill.style.width=(bleedRatio*100).toFixed(1)+'%';
    }
  }else{
    const layer=getVitalLayerMetrics(cur,totalCap);
    if(baseFill){
      baseFill.className='vital-pill-fill '+(key==='pv'?'vital-fill-pv':'vital-fill-pm')+' vital-tier-'+layer.currentTier;
      baseFill.style.width=(layer.topRatio*100).toFixed(1)+'%';
    }
    if(baseUnder){
      if(layer.showUnder){
        baseUnder.style.display='block';
        baseUnder.className='vital-pill-fill-under '+(key==='pv'?'vital-fill-pv':'vital-fill-pm')+' vital-tier-'+layer.underTier;
      }else{
        baseUnder.style.display='none';
      }
    }
  }

  const cardEl=document.querySelector('[data-vital-card="'+key+'"]');
  if(cardEl){
    const leftBtn=cardEl.querySelector('.button-vital-down');
    const rightBtn=cardEl.querySelector('.button-vital-up');
    if(tempMode){
      if(leftBtn){
        leftBtn.dataset.vitalAction=key+'-clear-temp';
        leftBtn.textContent='Encerrar';
        leftBtn.className='button small text-button button-vital-down button-vital-clear-temp';
        leftBtn.style.color='#ef4444';
      }
      if(rightBtn){
        rightBtn.dataset.vitalAction=key+'-add-temp';
        rightBtn.textContent='Adicionar';
        rightBtn.className='button small primary button-vital-up button-vital-add-temp';
        rightBtn.style.color='';
      }
    }else{
      if(leftBtn){
        leftBtn.dataset.vitalAction=key+'-down';
        leftBtn.textContent=key==='pv'?'Dano':'Gasto';
        leftBtn.className='button small button-vital-down';
        leftBtn.style.color='';
      }
      if(rightBtn){
        rightBtn.dataset.vitalAction=key+'-up';
        rightBtn.textContent=key==='pv'?'Curar':'Recuperar';
        rightBtn.className='button small button-vital-up '+(key==='pv'?'vital-up-pv':'vital-up-pm');
        rightBtn.style.color='';
      }
    }
    const toggleBtn=cardEl.querySelector('.vital-temp-toggle-btn');
    if(toggleBtn){
      toggleBtn.classList.toggle('active',tempMode);
      const labelUpper=key.toUpperCase();
      if(tempMax>0){
        toggleBtn.innerHTML='+ '+tempMax+' '+labelUpper+' <span class="vital-temp-underline">Temporários</span>';
      }else{
        toggleBtn.innerHTML='+ '+labelUpper+' <span class="vital-temp-underline">Temporários</span>';
      }
    }
  }
}
let currentRestQuality='normal';
function calculateRestGain(quality){
  const level=Math.max(1,Number(state.identity?.plannedLevel)||Number(state.identity?.initialLevel)||(state.progression?.length||1));
  const mult={ruim:0.5,normal:1,confortavel:2,luxuosa:3}[quality]||1;
  const isGolem=['golem','golem_desperto'].includes(state.identity?.raceId);
  const isGoblin=state.identity?.raceId==='goblin';
  const regName = typeof selectedRegionalOrigin === 'function' ? slug(selectedRegionalOrigin()?.nome || '') : slug(state.origin?.regional || '');
  const isCriaDaFavela = regName === 'cria_da_favela' || state.origin?.regional === 'Cria da Favela';
  const isProtectedFromBadRest = isGoblin || isCriaDaFavela;
  let gainPm=quality==='ruim'?(isProtectedFromBadRest?level:Math.max(1,Math.floor(level/2))):Math.round(level*mult);
  let gainPv=isGolem?0:(quality==='ruim'?(isProtectedFromBadRest?level:Math.max(1,Math.floor(level/2))):Math.round(level*mult));
  return {gainPv,gainPm,level,isGolem,isGoblin,isCriaDaFavela};
}
function updateRestModalUI(){
  const modal=document.getElementById('sheetRestModal');
  if(!modal)return;
  modal.querySelectorAll('.rest-opt-btn').forEach(btn=>{
    btn.classList.toggle('active',btn.dataset.restQuality===currentRestQuality);
  });
  const {gainPv,gainPm}=calculateRestGain(currentRestQuality);
  const pvEl=modal.querySelector('#restGainPv');
  const pmEl=modal.querySelector('#restGainPm');
  const descEl=modal.querySelector('#restConditionDesc');
  const payCostEl=modal.querySelector('#restPayCostLabel');
  const costInfo=REST_COST_DATA[currentRestQuality]||{cost:0,label:'T$ 0'};
  if(payCostEl)payCostEl.textContent=costInfo.label;
  if(pvEl)pvEl.textContent='+ '+gainPv+' PV';
  if(pmEl)pmEl.textContent='+ '+gainPm+' PM';
  const descs={
    ruim:'Dormir ao relento, sem saco de dormir ou em condições adversas.',
    normal:'Dormir em uma estalagem comum ou acampamento seguro.',
    confortavel:'Dormir em uma estalagem de boa qualidade com comodidades.',
    luxuosa:'Dormir em aposentos nobres com banho quente, comida farta e todo o luxo.'
  };
  if(descEl)descEl.textContent=descs[currentRestQuality]||'';
}
function openRestModal(){
  const modal=document.getElementById('sheetRestModal');
  if(modal){
    modal.style.display='flex';
    updateRestModalUI();
  }
}
function closeRestModal(){
  const modal=document.getElementById('sheetRestModal');
  if(modal)modal.style.display='none';
}
function openAdventureModal(){
  const modal=document.getElementById('sheetAdventureEndModal');
  if(modal){
    modal.style.display='flex';
    updateAdventureModalUI();
  }
}
function closeAdventureModal(){
  const modal=document.getElementById('sheetAdventureEndModal');
  if(modal)modal.style.display='none';
}
function updateAdventureModalUI(){
  const modal=document.getElementById('sheetAdventureEndModal');
  if(!modal)return;
  const info=getIncentivadorBonusPm();
  const spentEl=modal.querySelector('#adventureSpentDisplay');
  if(spentEl)spentEl.textContent='T$ '+info.spent;
  const bonusEl=modal.querySelector('#adventureIncentivadorBonusDisplay');
  if(bonusEl)bonusEl.textContent='+'+info.bonus+' PM';
}
function saveSheetVitals(){
  if(typeof persistCharacterNow==='function'){
    persistCharacterNow(false);
  }else if(typeof persistNavigationNow==='function'){
    persistNavigationNow();
  }else if(typeof persistNow==='function'){
    persistNow();
  }
  if(state.finished&&typeof scheduleSaveFinishedCharacter==='function'){
    scheduleSaveFinishedCharacter(250);
  }else if(state.finished&&typeof saveFinishedCharacter==='function'){
    saveFinishedCharacter();
  }
}
let pendingTempChoice = null;
function openTempDurationModal(key, amount){
  pendingTempChoice = { key, amount };
  const modal = document.getElementById('sheetTempDurationModal');
  if(!modal) return;
  const promptEl = modal.querySelector('#tempDurationPrompt');
  if(promptEl){
    promptEl.innerHTML = 'Escolha a duração para os <strong>+' + amount + ' ' + key.toUpperCase() + '</strong> temporários:';
  }
  modal.style.display = 'flex';
}
function closeTempDurationModal(){
  pendingTempChoice = null;
  const modal = document.getElementById('sheetTempDurationModal');
  if(modal) modal.style.display = 'none';
}

document.addEventListener('click',event=>{
  const qBtn=event.target.closest?.('[data-rest-quality]');
  if(qBtn){
    currentRestQuality=qBtn.dataset.restQuality;
    updateRestModalUI();
    return;
  }
  const modal=document.getElementById('sheetRestModal');
  if(event.target===modal){
    closeRestModal();
    return;
  }
  const advModal=document.getElementById('sheetAdventureEndModal');
  if(event.target===advModal){
    closeAdventureModal();
    return;
  }
  const durModal=document.getElementById('sheetTempDurationModal');
  if(event.target===durModal){
    closeTempDurationModal();
    return;
  }
  const tempModal=document.getElementById('sheetTempBonusesModal');
  if(event.target===tempModal){
    closeTempBonusesModal();
    return;
  }
  const attrModal=document.getElementById('attrTempModal');
  if(event.target===attrModal){
    attrModal.style.display='none';
    return;
  }
  const partnerModal=document.getElementById('sheetPartnerAddModal');
  if(event.target===partnerModal){
    partnerModal.style.display='none';
    return;
  }
  const actBtn=event.target.closest?.('[data-action]');
  const act=actBtn?.dataset?.action;
  if(act==='toggle-attr-steppers'){
    event.preventDefault();
    state.attrSteppersActive = !state.attrSteppersActive;
    const grid = document.getElementById('sheetAttributesGrid');
    const toggleBtn = document.querySelector('[data-action="toggle-attr-steppers"]');
    if (grid) {
      grid.classList.toggle('steppers-active', Boolean(state.attrSteppersActive));
    }
    if (toggleBtn) {
      toggleBtn.classList.toggle('active', Boolean(state.attrSteppersActive));
      const span = toggleBtn.querySelector('span');
      if (span) span.textContent = state.attrSteppersActive ? 'Concluir' : 'Alterar';
    }
    return;
  }
  if(act==='toggle-attr-master-mode'){
    event.preventDefault();
    state.attrStepMode = state.attrStepMode === 'temp' ? 'permanent' : 'temp';
    const mBtn = document.querySelector('[data-action="toggle-attr-master-mode"]');
    if(mBtn) mBtn.textContent = state.attrStepMode === 'temp' ? 'Modo Mestre: Temporário' : 'Modo Mestre: Permanente';
    return;
  }
  const stepBtn = event.target.closest?.('[data-attr-step]');
  if(stepBtn){
    event.preventDefault();
    const key = stepBtn.dataset.attrKey;
    const dir = stepBtn.dataset.attrStep;
    if(key){
      const delta = dir === 'up' ? 1 : -1;
      const isMestre = isModoMestreAtivo();
      if(isMestre && (state.attrStepMode === 'permanent' || !state.attrStepMode)){
        state.masterBonuses = state.masterBonuses || { attrs: {}, skills: {} };
        state.masterBonuses.attrs = state.masterBonuses.attrs || {};
        state.masterBonuses.attrs[key] = (Number(state.masterBonuses.attrs[key]) || 0) + delta;
      } else {
        state.tempManualBonuses = state.tempManualBonuses || { defense: 0, skills: {}, attrs: {} };
        state.tempManualBonuses.attrs = state.tempManualBonuses.attrs || {};
        const cur = Number(state.tempManualBonuses.attrs[key] || 0);
        state.tempManualBonuses.attrs[key] = cur + delta;
      }
      updateSheetAttributesOnly();
      if(typeof updateSheetEquipmentAndDefenseOnly === 'function') updateSheetEquipmentAndDefenseOnly();
      if(typeof updateSheetSkillsOnly === 'function') updateSheetSkillsOnly();
      if(typeof updateSheetMoneyAndLoadOnly === 'function') updateSheetMoneyAndLoadOnly();
      if(typeof persistNow === 'function') persistNow(); else if(typeof persist === 'function') persist();
      if(state.finished && typeof saveFinishedCharacter === 'function') saveFinishedCharacter();
      const heroIdParam = new URLSearchParams(window.location.search).get('id');
      if(isMestre && heroIdParam && typeof CampanhaMesa !== 'undefined' && typeof CampanhaMesa.salvarSnapshotHeroi === 'function'){
        CampanhaMesa.salvarSnapshotHeroi(heroIdParam, state);
      }
    }
    return;
  }
  if(act==='open-attr-temp-modal'){
    const m=document.getElementById('attrTempModal');
    if(m){
      m.style.display='flex';
      syncAttrTempModalValues();
    }
    return;
  }
  if(act==='close-attr-temp-modal'){
    const m=document.getElementById('attrTempModal');
    if(m)m.style.display='none';
    return;
  }
  if(act==='clear-all-attr-temp'){
    state.tempManualBonuses=state.tempManualBonuses||{defense:0,skills:{},attrs:{}};
    state.tempManualBonuses.attrs={for:0,des:0,con:0,int:0,sab:0,car:0};
    syncAttrTempModalValues();
    updateSheetAttributesOnly();
    if(typeof updateSheetEquipmentAndDefenseOnly==='function')updateSheetEquipmentAndDefenseOnly();
    if(typeof updateSheetSkillsOnly==='function')updateSheetSkillsOnly();
    if(typeof updateSheetMoneyAndLoadOnly==='function')updateSheetMoneyAndLoadOnly();
    persistNow();
    const notify=typeof showToast==='function'?showToast:(typeof toast==='function'?toast:alert);
    notify('Todos os modificadores temporários de atributos foram zerados.');
    return;
  }
  if(act==='open-sheet-partner-modal'){
    window.location.href = 'guilda.html';
    return;
  }
  if(act==='close-sheet-partner-modal'){
    const m=document.getElementById('sheetPartnerAddModal');
    if(m)m.style.display='none';
    return;
  }
  if(act==='confirm-add-sheet-partner'){
    const m=document.getElementById('sheetPartnerAddModal');
    const nameInp=m?.querySelector('#sheetPartnerInputName');
    const typeSel=m?.querySelector('#sheetPartnerSelectType');
    const tierSel=m?.querySelector('#sheetPartnerSelectTier');
    const typeId=typeSel?.value||'combatente';
    const tierId=tierSel?.value||'iniciante';
    const typeInfo=typeof partnerTypeById==='function'?partnerTypeById(typeId):{name:typeId,benefitIniciante:'',benefitMestre:''};
    const name=nameInp?.value?.trim()||typeInfo.name;
    const benefit=(tierId==='mestre'?typeInfo.benefitMestre:typeInfo.benefitIniciante)||'';
    state.partners=Array.isArray(state.partners)?state.partners:[];
    state.partners.push({name,type:typeId,tier:tierId,benefit});
    persistNow();
    if(m)m.style.display='none';
    renderStage();
    const notify=typeof showToast==='function'?showToast:(typeof toast==='function'?toast:alert);
    notify('Parceiro '+name+' adicionado!');
    return;
  }
  if(act==='remove-sheet-partner'){
    const idx=Number(actBtn.dataset.index);
    if(Number.isInteger(idx)&&state.partners&&state.partners[idx]){
      state.partners.splice(idx,1);
      persistNow();
      renderStage();
      const notify=typeof showToast==='function'?showToast:(typeof toast==='function'?toast:alert);
      notify('Parceiro removido.');
    }
    return;
  }
  if(act==='open-configure-helper-skills'){
    const idx=Number(actBtn.dataset.index);
    if(Number.isInteger(idx)&&state.partners&&state.partners[idx]){
      openSheetHelperModal(idx);
    }
    return;
  }
  if(act==='close-helper-skills-modal'){
    const m=document.getElementById('sheetHelperSkillsModal');
    if(m)m.style.display='none';
    return;
  }
  if(act==='confirm-helper-skills'){
    confirmSheetHelperSkills();
    return;
  }
  const btn=event.target.closest?.('[data-vital-action]');
  const action=btn?.dataset?.vitalAction;
  if(!action)return;
  if(action==='open-rest'){openRestModal();return}
  if(action==='close-rest'){closeRestModal();return}
  if(action==='open-adventure-modal'){openAdventureModal();return}
  if(action==='close-adventure-modal'){closeAdventureModal();return}
  if(action==='add-adventure-expense'){
    const addInp=document.getElementById('adventureAddExpenseInput');
    const val=Math.max(0,Number(addInp?.value)||0);
    if(val>0){
      registrarDespesaAventura(val);
      const notify=typeof showToast==='function'?showToast:(typeof toast==='function'?toast:alert);
      notify('Adicionado T$ '+val+' aos gastos desta aventura!');
    }
    return;
  }
  if(action==='confirm-adventure-end'){
    setCharacterAdventureSpent(0);
    try {
      localStorage.removeItem('forja-taverna-contracts-v1');
    } catch (_eTavern) {}
    state.vitals = state.vitals || {};
    state.vitals.pmTempIncentivador = 0;
    if(typeof ForjaUnificada?.encerrarAventura === 'function'){
      state.vitals = ForjaUnificada.encerrarAventura(state.vitals || {});
    } else {
      state.vitals = state.vitals || {};
      state.vitals.pvTempAdventure = 0;
      state.vitals.pmTempAdventure = 0;
      state.vitals.pvTempDaily = 0;
      state.vitals.pmTempDaily = 0;
      state.vitals.pvTempMax = 0;
      state.vitals.pmTempMax = 0;
      state.vitals.pvTempMode = false;
      state.vitals.pmTempMode = false;
      state.vitals.adventureSpentTibars = 0;
      state.vitals.pmTempIncentivador = 0;
    }
    updateVitalVisuals('pv',state.vitals);
    updateVitalVisuals('pm',state.vitals);
    if(typeof updateSheetEquipmentAndDefenseOnly==='function')updateSheetEquipmentAndDefenseOnly();
    if(typeof updateSheetSkillsOnly==='function')updateSheetSkillsOnly();
    closeAdventureModal();
    saveSheetVitals();
    const notify=typeof showToast==='function'?showToast:(typeof toast==='function'?toast:alert);
    notify('Aventura concluída! Gastos, bônus de aventura e contratos de mercenários foram zerados com sucesso.');
    return;
  }
  if(action.startsWith('toggle-edit-')){
    const key=action.replace('toggle-edit-','');
    const row=document.querySelector('[data-vital-manual="'+key+'"]');
    if(row)row.style.display=row.style.display==='none'?'flex':'none';
    return;
  }
  if(!state.finished)return;
  let vitals = state.vitals;
  if(!vitals || typeof vitals.pvMax !== 'number' || typeof vitals.pmMax !== 'number'){
    vitals = sheetVitals(progressionStats());
  }
  if(action==='rest'||action==='confirm-rest'||action==='rest-pay'){
    closeRestModal();
    const maximum=progressionStats();
    vitals=sheetVitals(maximum);
    const costInfo=REST_COST_DATA[currentRestQuality]||{cost:0,label:'T$ 0'};
    const isPay=(action==='rest-pay');
    const cost=isPay?costInfo.cost:0;

    if(cost>0){
      const currentFunds=typeof remainingFunds==='function'?remainingFunds():0;
      if(currentFunds<cost){
        const notify=typeof showToast==='function'?showToast:(typeof toast==='function'?toast:alert);
        const formatFn=typeof formatTibars==='function'?formatTibars:(v=>'T$ '+v);
        notify('Fundos insuficientes para pagar a estadia ('+costInfo.label+'). Você possui '+formatFn(currentFunds)+'.');
        return;
      }
      const f=typeof financesState==='function'?financesState():null;
      if(f){
        f.spent=Math.round(((f.spent||0)+cost)*100)/100;
      }
      registrarDespesaAventura(cost);
    }

    const {gainPv,gainPm}=calculateRestGain(currentRestQuality);
    sincronizarIncentivadorEconomia({ notify: false });
    Object.assign(vitals,ForjaUnificada.aplicarDescanso(vitals,{gainPv,gainPm}));
    state.vitals=vitals;
    updateVitalVisuals('pv',vitals);
    updateVitalVisuals('pm',vitals);
    state.tempManualBonuses = { defense: 0, skills: {} };
    state.tempManualBonuses.attrs = { for: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 };
    try {
      const rawTavern = localStorage.getItem('forja-taverna-contracts-v1');
      if (rawTavern) {
        const contracts = JSON.parse(rawTavern);
        if (Array.isArray(contracts)) {
          const filtered = contracts.filter(c => {
            const cat = String(c.categoria || c.category || '').toLowerCase();
            const id = String(c.itemId || c.id || '').toLowerCase();
            return cat !== 'refeicao' && cat !== 'bebida' && cat !== 'alimentacao' && !id.includes('cozido') && !id.includes('barba') && !id.includes('cerveja');
          });
          localStorage.setItem('forja-taverna-contracts-v1', JSON.stringify(filtered));
        }
      }
    } catch (_eTavern) {}
    if(typeof _passivesCacheResult !== 'undefined') _passivesCacheResult = null;
    if(typeof updateSheetAttributesOnly==='function')updateSheetAttributesOnly();
    if(typeof updateSheetEquipmentAndDefenseOnly==='function')updateSheetEquipmentAndDefenseOnly();
    if(typeof updateSheetSkillsOnly==='function')updateSheetSkillsOnly();
    if(typeof updateSheetMoneyAndLoadOnly==='function'){
      updateSheetMoneyAndLoadOnly();
    }
    const notify=typeof showToast==='function'?showToast:(typeof toast==='function'?toast:alert);
    saveSheetVitals();
    const msg=cost>0
      ? 'Descanso concluído! Pago '+costInfo.label+' pela estadia. +'+gainPv+' PV, +'+gainPm+' PM recuperados.'
      : 'Descanso concluído! +'+gainPv+' PV, +'+gainPm+' PM recuperados.';
    notify(msg);
    return;
  }
  if(action==='open-temp-bonuses'){openTempBonusesModal();return}
  if(action==='close-temp-bonuses'){closeTempBonusesModal();return}
  if(action==='adjust-temp-def'){
    const delta=Number(btn?.dataset?.delta)||0;
    state.tempManualBonuses=state.tempManualBonuses||{defense:0,skills:{}};
    state.tempManualBonuses.defense=(Number(state.tempManualBonuses.defense)||0)+delta;
    updateTempBonusesModalUI();
    if(typeof updateSheetEquipmentAndDefenseOnly==='function')updateSheetEquipmentAndDefenseOnly();
    return;
  }
  if(action==='apply-temp-skill'){
    const modal=document.getElementById('sheetTempBonusesModal');
    const skillSelect=modal?.querySelector('#manualTempSkillSelect') as HTMLSelectElement | null;
    const valInput=modal?.querySelector('#manualTempSkillValInput') as HTMLInputElement | null;
    const radioPerm=modal?.querySelector('input[name="masterSkillModeRadio"][value="perm"]') as HTMLInputElement | null;
    const isPerm = Boolean(radioPerm?.checked && isModoMestreAtivo());
    const sId=skillSelect?.value;
    const sVal=Number(valInput?.value)||0;
    if(!sId){
      const notify=typeof showToast==='function'?showToast:(typeof toast==='function'?toast:alert);
      notify('Selecione uma opção de perícia primeiro.');
      return;
    }

    const trained = new Set(typeof allTrainedSkills === 'function' ? allTrainedSkills() : []);
    const allAvailable = [...SKILLS, ...[...trained].filter(id => String(id).startsWith('oficio:')).map(id => [id, typeof skillDisplayName === 'function' ? skillDisplayName(id) : id, 'int'])];

    let targetSkillIds: string[] = [];
    let groupLabel = '';
    if(sId === 'group:all'){
      targetSkillIds = allAvailable.map(s => s[0]);
      groupLabel = 'todas as perícias';
    } else if(sId === 'group:except_attacks'){
      targetSkillIds = allAvailable.filter(s => s[0] !== 'luta' && s[0] !== 'pontaria').map(s => s[0]);
      groupLabel = 'todas as perícias (exceto Luta e Pontaria)';
    } else if(sId.startsWith('attr:')){
      const targetAttr = sId.replace('attr:', '');
      const attrLabels: Record<string, string> = { for: 'Força', des: 'Destreza', con: 'Constituição', int: 'Inteligência', sab: 'Sabedoria', car: 'Carisma' };
      targetSkillIds = allAvailable.filter(s => {
        const eff = typeof skillEffectiveAttribute === 'function' ? skillEffectiveAttribute(s[0]) : s[2];
        return eff === targetAttr || s[2] === targetAttr;
      }).map(s => s[0]);
      groupLabel = `perícias de ${attrLabels[targetAttr] || targetAttr.toUpperCase()}`;
    } else {
      targetSkillIds = [sId];
      const sName = (SKILLS.find(s => s[0] === sId)?.[1]) || (typeof skillDisplayName === 'function' ? skillDisplayName(sId) : sId);
      groupLabel = sName;
    }

    if(targetSkillIds.length === 0){
      const notify=typeof showToast==='function'?showToast:(typeof toast==='function'?toast:alert);
      notify('Nenhuma perícia encontrada para esta seleção.');
      return;
    }

    if(isPerm){
      state.masterBonuses = state.masterBonuses || { attrs: {}, skills: {} };
      state.masterBonuses.skills = state.masterBonuses.skills || {};
      for(const id of targetSkillIds){
        state.masterBonuses.skills[id] = (Number(state.masterBonuses.skills[id]) || 0) + sVal;
      }
    } else {
      state.tempManualBonuses = state.tempManualBonuses || { defense: 0, skills: {} };
      state.tempManualBonuses.skills = state.tempManualBonuses.skills || {};
      for(const id of targetSkillIds){
        state.tempManualBonuses.skills[id] = sVal;
      }
    }

    updateTempBonusesModalUI();
    if(typeof updateSheetSkillsOnly==='function')updateSheetSkillsOnly();
    if(typeof persistNow === 'function') persistNow(); else if(typeof persist === 'function') persist();
    const heroIdParam = new URLSearchParams(window.location.search).get('id');
    if(isModoMestreAtivo() && heroIdParam && typeof CampanhaMesa !== 'undefined' && typeof CampanhaMesa.salvarSnapshotHeroi === 'function'){
      CampanhaMesa.salvarSnapshotHeroi(heroIdParam, state);
    }
    const notify=typeof showToast==='function'?showToast:(typeof toast==='function'?toast:alert);
    const sign = sVal >= 0 ? '+' : '';
    notify(`Bônus de ${sign}${sVal} aplicado em ${groupLabel}.`);
    return;
  }
  if(action==='remove-master-skill'){
    const sId=btn?.dataset?.skillId;
    if(sId && state.masterBonuses?.skills){
      delete state.masterBonuses.skills[sId];
      updateTempBonusesModalUI();
      if(typeof updateSheetSkillsOnly==='function')updateSheetSkillsOnly();
      if(typeof persistNow === 'function') persistNow(); else if(typeof persist === 'function') persist();
      const heroIdParam = new URLSearchParams(window.location.search).get('id');
      if(isModoMestreAtivo() && heroIdParam && typeof CampanhaMesa !== 'undefined' && typeof CampanhaMesa.salvarSnapshotHeroi === 'function'){
        CampanhaMesa.salvarSnapshotHeroi(heroIdParam, state);
      }
    }
    return;
  }
  if(action==='remove-temp-skill'){
    const sId=btn?.dataset?.skillId;
    if(sId && state.tempManualBonuses?.skills){
      delete state.tempManualBonuses.skills[sId];
      updateTempBonusesModalUI();
      if(typeof updateSheetSkillsOnly==='function')updateSheetSkillsOnly();
    }
    return;
  }
  if(action==='clear-all-temp'){
    state.tempManualBonuses={defense:0,skills:{}};
    updateTempBonusesModalUI();
    if(typeof updateSheetEquipmentAndDefenseOnly==='function')updateSheetEquipmentAndDefenseOnly();
    if(typeof updateSheetSkillsOnly==='function')updateSheetSkillsOnly();
    const notify=typeof showToast==='function'?showToast:(typeof toast==='function'?toast:alert);
    notify('Todos os bônus temporários foram zerados.');
    return;
  }
  if(action==='pv-revive'){
    vitals.pv=1;
    state.vitals=vitals;
    updateVitalVisuals('pv',vitals);
    updateVitalVisuals('pm',vitals);
    saveSheetVitals();
    if(typeof showToast==='function')showToast('O herói foi estabilizado com 1 PV!');
    return;
  }
  if(action==='toggle-temp-pv'||action==='toggle-temp-pm'){
    const key=action.replace('toggle-temp-','');
    vitals[key+'TempMode']=!vitals[key+'TempMode'];
    state.vitals=vitals;
    updateVitalVisuals(key,vitals);
    saveSheetVitals();
    return;
  }
  if(action==='close-temp-duration'){
    closeTempDurationModal();
    return;
  }
  if(action==='confirm-temp-duration-daily'){
    if(!pendingTempChoice)return;
    const {key,amount}=pendingTempChoice;
    if((Number(vitals[key+'TempMax'])||0)<=0){
      vitals[key+'TempDaily']=0;
      vitals[key+'TempAdventure']=0;
    }
    vitals[key+'TempDaily']=(Number(vitals[key+'TempDaily'])||0)+amount;
    vitals[key+'TempMax']=(Number(vitals[key+'TempDaily'])||0)+(Number(vitals[key+'TempAdventure'])||0);
    const ceiling=vitals[key+'Max']+vitals[key+'TempMax'];
    vitals[key]=Math.min(ceiling,vitals[key]+amount);
    vitals[key+'TempMode']=false;
    state.vitals=vitals;
    updateVitalVisuals(key,vitals);
    saveSheetVitals();
    closeTempDurationModal();
    const notify=typeof showToast==='function'?showToast:(typeof toast==='function'?toast:alert);
    notify('+'+amount+' '+key.toUpperCase()+' temporários adicionados para o dia (encerram após descanso).');
    return;
  }
  if(action==='confirm-temp-duration-adventure'){
    if(!pendingTempChoice)return;
    const {key,amount}=pendingTempChoice;
    if((Number(vitals[key+'TempMax'])||0)<=0){
      vitals[key+'TempDaily']=0;
      vitals[key+'TempAdventure']=0;
    }
    vitals[key+'TempAdventure']=(Number(vitals[key+'TempAdventure'])||0)+amount;
    vitals[key+'TempMax']=(Number(vitals[key+'TempDaily'])||0)+(Number(vitals[key+'TempAdventure'])||0);
    const ceiling=vitals[key+'Max']+vitals[key+'TempMax'];
    vitals[key]=Math.min(ceiling,vitals[key]+amount);
    vitals[key+'TempMode']=false;
    state.vitals=vitals;
    updateVitalVisuals(key,vitals);
    saveSheetVitals();
    closeTempDurationModal();
    const notify=typeof showToast==='function'?showToast:(typeof toast==='function'?toast:alert);
    notify('+'+amount+' '+key.toUpperCase()+' temporários adicionados para a aventura (encerram ao fim da aventura).');
    return;
  }
  if(action.endsWith('-add-temp')){
    const key=action.replace('-add-temp','');
    const baseInp=document.querySelector('[data-vital-amount="'+key+'"]');
    const amount = Math.max(1, Number(baseInp?.value) || 1);
    if(!Number.isSafeInteger(amount)||amount<1)return;
    openTempDurationModal(key,amount);
    return;
  }
  if(action.endsWith('-clear-temp')){
    const key=action.replace('-clear-temp','');
    vitals[key+'TempDaily']=0;
    vitals[key+'TempAdventure']=0;
    vitals[key+'TempMax']=0;
    vitals[key+'TempMode']=false;
    if(vitals[key]>vitals[key+'Max'])vitals[key]=vitals[key+'Max'];
    state.vitals=vitals;
    updateVitalVisuals(key,vitals);
    saveSheetVitals();
    const notify=typeof showToast==='function'?showToast:(typeof toast==='function'?toast:alert);
    notify('Bônus temporários de '+key.toUpperCase()+' encerrados.');
    return;
  }
  const [key,direction]=action.split('-');
  if(!['pv','pm'].includes(key)||!['down','up'].includes(direction))return;
  const amount=Number(document.querySelector('[data-vital-amount="'+key+'"]')?.value);
  if(!Number.isSafeInteger(amount)||amount<1)return;
  const bleedMax=key==='pv'?Math.floor(vitals.pvMax/2):0;
  Object.assign(vitals,ForjaUnificada.alterarVital(vitals,key,direction,amount));
  state.vitals=vitals;
  updateVitalVisuals(key,vitals);
  if(key==='pv'&&vitals.pvMax>0&&vitals.pv<=-bleedMax){
    updateVitalVisuals('pm',vitals);
  }
  saveSheetVitals();
});
document.addEventListener('input',event=>{
  if(event.target?.id==='manualTempDefInput'){
    state.tempManualBonuses=state.tempManualBonuses||{defense:0,skills:{}};
    state.tempManualBonuses.defense=Number(event.target.value)||0;
    if(typeof updateSheetEquipmentAndDefenseOnly==='function')updateSheetEquipmentAndDefenseOnly();
  }
  if(event.target?.dataset?.attrTempKey){
    const key = event.target.dataset.attrTempKey;
    const val = Number(event.target.value) || 0;
    state.tempManualBonuses = state.tempManualBonuses || { defense: 0, skills: {}, attrs: {} };
    state.tempManualBonuses.attrs = state.tempManualBonuses.attrs || {};
    state.tempManualBonuses.attrs[key] = val;
    const baseAttrs = typeof finalAttrs === 'function' ? finalAttrs(false) : {};
    const total = Number(baseAttrs[key] || 0) + val;
    const res = document.querySelector('[data-attr-temp-result="' + key + '"]');
    if(res) res.textContent = (total >= 0 ? '+' : '') + total;
    updateSheetAttributesOnly();
    if(typeof updateSheetEquipmentAndDefenseOnly === 'function') updateSheetEquipmentAndDefenseOnly();
    if(typeof updateSheetSkillsOnly === 'function') updateSheetSkillsOnly();
    if(typeof updateSheetMoneyAndLoadOnly === 'function') updateSheetMoneyAndLoadOnly();
    persistNow();
  }
});
document.addEventListener('change',event=>{
  if(event.target?.id === 'sheetPartnerSelectType' || event.target?.id === 'sheetPartnerSelectTier'){
    const modal = document.getElementById('sheetPartnerAddModal');
    const typeSel = modal?.querySelector('#sheetPartnerSelectType');
    const tierSel = modal?.querySelector('#sheetPartnerSelectTier');
    const box = modal?.querySelector('#sheetPartnerBenefitBox');
    if(typeSel && tierSel && box){
      const typeInfo = typeof partnerTypeById === 'function' ? partnerTypeById(typeSel.value) : { benefitIniciante: '', benefitMestre: '' };
      const benefit = (tierSel.value === 'mestre' ? typeInfo.benefitMestre : typeInfo.benefitIniciante) || '';
      box.textContent = benefit;
    }
    return;
  }
  const currentKey=event.target?.dataset?.vitalCurrent;
  const tempMaxKey=event.target?.dataset?.vitalTempMax;
  if(!state.finished)return;
  let vitals=state.vitals;
  if(!vitals||typeof vitals.pvMax!=='number'||typeof vitals.pmMax!=='number'){
    vitals=sheetVitals(progressionStats());
  }
  if(currentKey&&['pv','pm'].includes(currentKey)){
    const value=Number(event.target.value);
    if(Number.isSafeInteger(value)){
      const bleedMax=currentKey==='pv'?Math.floor(vitals.pvMax/2):0;
      const minLimit=currentKey==='pv'?-bleedMax:0;
      const maxLimit=vitals[currentKey+'Max']+(vitals[currentKey+'TempMax']||0);
      vitals[currentKey]=Math.max(minLimit,Math.min(maxLimit,value));
      if(currentKey==='pv'&&vitals.pvMax>0&&vitals.pv<=-bleedMax){
        vitals.pm=0;
      }
    }
    state.vitals=vitals;
    updateVitalVisuals(currentKey,vitals);
    if(currentKey==='pv'&&vitals.pvMax>0&&vitals.pv<=-bleedMax){
      updateVitalVisuals('pm',vitals);
    }
    saveSheetVitals();
  }else if(tempMaxKey&&['pv','pm'].includes(tempMaxKey)){
    const value=Number(event.target.value);
    if(Number.isSafeInteger(value)&&value>=0){
      vitals[tempMaxKey+'TempMax']=value;
      const maxLimit=vitals[tempMaxKey+'Max']+value;
      if(vitals[tempMaxKey]>maxLimit)vitals[tempMaxKey]=maxLimit;
    }
    state.vitals=vitals;
    updateVitalVisuals(tempMaxKey,vitals);
    saveSheetVitals();
  }
});
function updateSheetAttributesOnly(){
  const attrs = typeof finalAttrs === 'function' ? finalAttrs(true) : {};
  if(typeof ATTRS !== 'undefined'){
    ATTRS.forEach(([id]) => {
      const card = document.querySelector('[data-attr-card="' + id + '"] strong');
      if(card && attrs[id] !== undefined) card.textContent = attrs[id];
    });
  }
}

function syncAttrTempModalValues(){
  const modal = document.getElementById('attrTempModal');
  if(!modal) return;
  const baseAttrs = typeof finalAttrs === 'function' ? finalAttrs(false) : {};
  state.tempManualBonuses = state.tempManualBonuses || { defense: 0, skills: {}, attrs: {} };
  state.tempManualBonuses.attrs = state.tempManualBonuses.attrs || {};
  if(typeof ATTRS !== 'undefined'){
    ATTRS.forEach(([id]) => {
      const base = Number(baseAttrs[id] || 0);
      const temp = Number(state.tempManualBonuses.attrs[id] || 0);
      const total = base + temp;
      const input = modal.querySelector('[data-attr-temp-key="' + id + '"]');
      const res = modal.querySelector('[data-attr-temp-result="' + id + '"]');
      if(input) input.value = temp;
      if(res) res.textContent = (total >= 0 ? '+' : '') + total;
    });
  }
}

function renderAttrTempModalHtml(){
  const baseAttrs = typeof finalAttrs === 'function' ? finalAttrs(false) : {};
  state.tempManualBonuses = state.tempManualBonuses || { defense: 0, skills: {}, attrs: {} };
  state.tempManualBonuses.attrs = state.tempManualBonuses.attrs || {};
  const infoIcon = window.IconesForja ? window.IconesForja.get('alert-circle', 'sheet-attr-temp-info-icon') : '';

  const rows = (typeof ATTRS !== 'undefined' ? ATTRS : []).map(([id, name]) => {
    const base = Number(baseAttrs[id] || 0);
    const temp = Number(state.tempManualBonuses.attrs[id] || 0);
    const total = base + temp;
    const fmtBase = base >= 0 ? '+' + base : String(base);
    const fmtTotal = total >= 0 ? '+' + total : String(total);
    return `
      <div class="sheet-attr-temp-row">
        <div class="sheet-attr-temp-meta">
          <strong>${esc(name)}</strong>
          <small>Base ${fmtBase}</small>
        </div>
        <div class="sheet-attr-temp-control">
          <input type="number" class="sheet-attr-temp-input" data-attr-temp-key="${id}" value="${temp}" step="1">
        </div>
        <div class="sheet-attr-temp-result" data-attr-temp-result="${id}">
          ${fmtTotal}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div id="attrTempModal" class="sheet-attr-temp-backdrop" style="display:none;">
      <div class="sheet-attr-temp-drawer">
        <div class="sheet-attr-temp-header">
          <h3 class="sheet-attr-temp-title">MODIFICADORES TEMPORÁRIOS</h3>
          <button type="button" class="sheet-attr-temp-close" data-action="close-attr-temp-modal">×</button>
        </div>
        <div class="sheet-attr-temp-body">
          <div class="sheet-attr-temp-info">
            <span class="sheet-attr-temp-info-icon">${infoIcon}</span>
            <span>Para bônus e penalidades que a ficha não conhece. Magias e condições ativas já entram sozinhas. O valor vale em perícias, ataques, dano, Defesa, CD de magia e carga — mas não em PV/PM máximos, seguindo a regra do livro. Para mudar o atributo em definitivo, use Informações.</span>
          </div>
          <div class="sheet-attr-temp-list">
            ${rows}
          </div>
        </div>
        <div class="sheet-attr-temp-footer">
          <button type="button" class="sheet-attr-temp-clear-btn" data-action="clear-all-attr-temp">Zerar todos</button>
        </div>
      </div>
    </div>
  `;
}

function renderSheetPartnerModalHtml(){
  const types = typeof PARTNER_CANONICAL_TYPES !== 'undefined' ? PARTNER_CANONICAL_TYPES : [
    { id: 'ajudante', name: 'Ajudante', benefitIniciante: '+2 em uma perícia à sua escolha.' },
    { id: 'assassino', name: 'Assassino', benefitIniciante: '+1d6 de dano furtivo.' },
    { id: 'atirador', name: 'Atirador', benefitIniciante: '+2 em Pontaria e +2 no dano à distância.' },
    { id: 'combatente', name: 'Combatente', benefitIniciante: '+2 em Luta e +2 no dano corpo a corpo.' },
    { id: 'curandeiro', name: 'Curandeiro / Médico', benefitIniciante: 'Recupera PV em descansos e pós-combate.' },
    { id: 'destruidor', name: 'Destruidor', benefitIniciante: '+2d6 de dano em área / objetos.' },
    { id: 'fortao', name: 'Fortão', benefitIniciante: '+2 em manobras e Força.' },
    { id: 'guardiao', name: 'Guardião', benefitIniciante: '+2 na Defesa.' },
    { id: 'magivocador', name: 'Magivocador', benefitIniciante: '+1 PM no teto.' },
    { id: 'montaria', name: 'Montaria', benefitIniciante: '+3m de deslocamento e investida.' },
    { id: 'perseguidor', name: 'Perseguidor', benefitIniciante: '+2 em Percepção e Sobrevivência.' },
    { id: 'vigilante', name: 'Vigilante', benefitIniciante: '+2 em Percepção e Iniciativa.' }
  ];

  return `
    <div id="sheetPartnerAddModal" class="forja-modal-backdrop" style="display:none;">
      <div class="forja-rest-card" style="max-width:440px;">
        <div class="rest-card-header">
          <div class="rest-card-title">ADICIONAR PARCEIRO</div>
          <button type="button" class="rest-close-x" data-action="close-sheet-partner-modal">×</button>
        </div>
        <div class="rest-card-body" style="padding:16px;">
          <p class="help" style="margin:0 0 12px 0;font-size:0.75rem;color:var(--muted)">
            Parceiros são NPCs que acompanham o grupo e concedem bônus constantes de acordo com seu tipo e patamar.
          </p>
          <div style="display:grid;gap:12px;">
            <label class="field">
              <span style="font-weight:700;color:var(--gold2)">Nome do Parceiro</span>
              <input type="text" id="sheetPartnerInputName" class="input" placeholder="Ex: Gildor, Lobo Cinzento..." maxlength="40">
            </label>
            <label class="field">
              <span style="font-weight:700;color:var(--gold2)">Tipo de Parceiro</span>
              <select id="sheetPartnerSelectType" class="select">
                ${types.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('')}
              </select>
            </label>
            <label class="field">
              <span style="font-weight:700;color:var(--gold2)">Patamar</span>
              <select id="sheetPartnerSelectTier" class="select">
                <option value="iniciante">Iniciante</option>
                <option value="veterano">Veterano</option>
                <option value="mestre">Mestre</option>
              </select>
            </label>
            <div id="sheetPartnerBenefitBox" style="background:#0d121a;border:1px solid var(--border);border-radius:6px;padding:8px 12px;font-size:0.75rem;color:var(--muted);">
              ${esc(types[0]?.benefitIniciante || '')}
            </div>
          </div>
        </div>
        <div class="rest-card-footer" style="padding:10px 16px;display:flex;justify-content:flex-end;gap:8px;">
          <button type="button" class="button text-button" data-action="close-sheet-partner-modal">Cancelar</button>
          <button type="button" class="button primary" data-action="confirm-add-sheet-partner">Adicionar Parceiro</button>
        </div>
      </div>
    </div>
  `;
}

const SHEET_AJUDANTE_SKILLS = [
  { id: 'acrobacia', name: 'Acrobacia' },
  { id: 'adestramento', name: 'Adestramento' },
  { id: 'atletismo', name: 'Atletismo' },
  { id: 'atuacao', name: 'Atuação' },
  { id: 'cavalgar', name: 'Cavalgar' },
  { id: 'conhecimento', name: 'Conhecimento' },
  { id: 'cura', name: 'Cura' },
  { id: 'diplomacia', name: 'Diplomacia' },
  { id: 'enganacao', name: 'Enganação' },
  { id: 'fortitude', name: 'Fortitude' },
  { id: 'furtividade', name: 'Furtividade' },
  { id: 'guerra', name: 'Guerra' },
  { id: 'iniciativa', name: 'Iniciativa' },
  { id: 'intimidacao', name: 'Intimidação' },
  { id: 'intuicao', name: 'Intuição' },
  { id: 'investigacao', name: 'Investigação' },
  { id: 'jogatina', name: 'Jogatina' },
  { id: 'ladinagem', name: 'Ladinagem' },
  { id: 'misticismo', name: 'Misticismo' },
  { id: 'nobreza', name: 'Nobreza' },
  { id: 'oficio', name: 'Ofício' },
  { id: 'percepcao', name: 'Percepção' },
  { id: 'pilotagem', name: 'Pilotagem' },
  { id: 'reflexos', name: 'Reflexos' },
  { id: 'religiao', name: 'Religião' },
  { id: 'sobrevivencia', name: 'Sobrevivência' },
  { id: 'vontade', name: 'Vontade' }
];

function renderSheetHelperModalHtml(){
  return `
    <div id="sheetHelperSkillsModal" class="forja-modal-backdrop" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;background:rgba(0,0,0,0.7);align-items:center;justify-content:center;">
      <div class="forja-rest-card" style="max-width:440px;width:90%;background:#140d10;border:1px solid #6b2432;border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,0.8);">
        <div class="rest-card-header" style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid #4a1c24;">
          <div class="rest-card-title" id="sheetHelperModalTitle" style="font-family:'Cinzel',serif;font-weight:700;color:#fca5a5;font-size:1rem;">CONFIGURAR AJUDANTE</div>
          <button type="button" class="rest-close-x" data-action="close-helper-skills-modal" style="background:transparent;border:none;color:#fff;font-size:1.4rem;cursor:pointer;">×</button>
        </div>
        <div class="rest-card-body" style="padding:16px;">
          <p id="sheetHelperModalDesc" class="help" style="margin:0 0 14px 0;font-size:0.78rem;color:#bda6ac;line-height:1.4;">
            Escolha as perícias que receberão o bônus do parceiro Ajudante (exceto Luta e Pontaria).
          </p>
          <input type="hidden" id="sheetHelperPartnerIndex" value="-1">
          <div id="sheetHelperSlotsContainer" style="display:grid;gap:10px;"></div>
        </div>
        <div class="rest-card-footer" style="padding:10px 16px;display:flex;justify-content:flex-end;gap:8px;border-top:1px solid #4a1c24;">
          <button type="button" class="button text-button" data-action="close-helper-skills-modal">Cancelar</button>
          <button type="button" class="button primary" data-action="confirm-helper-skills">Salvar Perícias</button>
        </div>
      </div>
    </div>
  `;
}

function openSheetHelperModal(idx){
  const p = state.partners && state.partners[idx];
  if(!p) return;
  const modal = document.getElementById('sheetHelperSkillsModal');
  const title = document.getElementById('sheetHelperModalTitle');
  const desc = document.getElementById('sheetHelperModalDesc');
  const inpIdx = document.getElementById('sheetHelperPartnerIndex');
  const container = document.getElementById('sheetHelperSlotsContainer');
  if(!modal || !container) return;

  const tier = p.tier || p.grau || 'iniciante';
  const numSlots = tier === 'iniciante' ? 2 : 3;
  const bonus = tier === 'mestre' ? '+4' : '+2';
  const tierLabel = tier === 'iniciante' ? 'Iniciante' : (tier === 'veterano' ? 'Veterano' : 'Mestre');

  if(inpIdx) inpIdx.value = String(idx);
  if(title) title.textContent = `CONFIGURAR AJUDANTE (${tierLabel.toUpperCase()})`;
  if(desc) desc.textContent = `Escolha ${numSlots} perícias distintas (exceto Luta e Pontaria). Você recebe bônus de ${bonus} nessas perícias.`;

  const currentSkills = Array.isArray(p.skills) ? p.skills : (Array.isArray(p.pericias) ? p.pericias : (p.skill ? [p.skill] : []));
  const defaultChoices = ['diplomacia', 'investigacao', 'ladinagem'];

  let html = '';
  for(let i = 0; i < numSlots; i++){
    const selectedVal = currentSkills[i] || defaultChoices[i] || SHEET_AJUDANTE_SKILLS[0].id;
    html += `
      <label class="field" style="display:grid;gap:4px;">
        <span style="font-weight:600;font-size:0.8rem;color:var(--gold2,#f59e0b);">Perícia ${i + 1} (${bonus}):</span>
        <select class="select sheet-helper-select" data-slot="${i}" style="width:100%;padding:6px 10px;background:#0d121a;color:#fff;border:1px solid var(--border);border-radius:4px;">
          ${SHEET_AJUDANTE_SKILLS.map(sk => `<option value="${sk.id}" ${sk.id === selectedVal ? 'selected' : ''}>${sk.name}</option>`).join('')}
        </select>
      </label>
    `;
  }
  container.innerHTML = html;
  modal.style.display = 'flex';
}

function confirmSheetHelperSkills(){
  const inpIdx = document.getElementById('sheetHelperPartnerIndex');
  const idx = Number(inpIdx?.value);
  if(!Number.isInteger(idx) || !state.partners || !state.partners[idx]) return;

  const selects = document.querySelectorAll('#sheetHelperSlotsContainer .sheet-helper-select');
  const chosen = Array.from(selects).map(s => s.value);
  if(new Set(chosen).size !== chosen.length){
    const notify = typeof showToast === 'function' ? showToast : (typeof toast === 'function' ? toast : alert);
    notify('Por favor, selecione perícias distintas para o Ajudante.');
    return;
  }

  const p = state.partners[idx];
  p.skills = chosen;
  const tier = p.tier || p.grau || 'iniciante';
  const bonusVal = tier === 'mestre' ? '+4' : '+2';
  const skNames = chosen.map(s => SHEET_AJUDANTE_SKILLS.find(x => x.id === s)?.name || s);
  p.benefit = `${bonusVal} em ${skNames.join(', ')}.`;

  const modal = document.getElementById('sheetHelperSkillsModal');
  if(modal) modal.style.display = 'none';

  persistNow();
  renderStage();

  const notify = typeof showToast === 'function' ? showToast : (typeof toast === 'function' ? toast : alert);
  notify('Perícias do Ajudante atualizadas com sucesso!');
}

function renderSheetActionBar(mode = 'full'){
  const pdfIcon = window.IconesForja ? window.IconesForja.get('file-text', 'sheet-action-btn-icon') : '';
  const foundryIcon = window.IconesForja ? window.IconesForja.get('puzzle', 'sheet-action-btn-icon') : '';
  const eyeIcon = window.IconesForja ? window.IconesForja.get('eye', 'sheet-action-btn-icon') : '';
  const bookIcon = window.IconesForja ? window.IconesForja.get('book', 'sheet-action-btn-icon') : '';
  const shopIcon = window.IconesForja ? window.IconesForja.get('store', 'sheet-action-btn-icon') : '';
  const condIcon = window.IconesForja ? window.IconesForja.get('alert-triangle', 'sheet-action-btn-icon') : '';
  const printIcon = '<svg class="forja-svg sheet-action-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>';

  const quickNav = `
    <div class="sheet-action-bar-left">
      <button type="button" class="sheet-action-btn sheet-quick-nav-btn" data-sheet-action="grimoire" title="Abrir Grimório de Magias">
        ${bookIcon}
        <span>Grimório</span>
      </button>
      <button type="button" class="sheet-action-btn sheet-quick-nav-btn" data-sheet-action="shop" title="Abrir Arsenal &amp; Loja">
        ${shopIcon}
        <span>Loja</span>
      </button>
      <button type="button" class="sheet-action-btn sheet-quick-nav-btn" data-action="open-conditions" data-sheet-action="conditions" title="Abrir Catálogo Interativo de Condições">
        ${condIcon}
        <span>Condições</span>
      </button>
    </div>
  `;

  if(mode === 'simplified' || mode === 'summary'){
    return `
      <div class="sheet-action-bar">
        ${quickNav}
        <div class="sheet-action-bar-right">
          <button type="button" class="sheet-action-btn sheet-share-btn" data-sheet-action="share-character" title="Compartilhar link desta ficha" style="color:#ef4444;border-color:rgba(239,68,68,0.4);">
            <svg class="forja-svg sheet-action-btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
            <span>Compartilhar</span>
          </button>
          <button type="button" class="sheet-action-btn" data-sheet-action="export-html-print" title="Imprimir ou salvar esta ficha em PDF">
            ${printIcon}
            <span>Imprimir / Exportar Ficha</span>
          </button>
          ${mode === 'simplified' ? `
            <button type="button" class="sheet-action-btn" data-sheet-action="switch-to-summary" title="Ver Ficha Resumida (com resumos dos poderes)">
              ${eyeIcon}
              <span>Ficha Resumida</span>
            </button>
          ` : `
            <button type="button" class="sheet-action-btn" data-sheet-action="switch-to-simplified" title="Ver Ficha Simplificada (lista limpa de poderes)">
              ${eyeIcon}
              <span>Ficha Simplificada</span>
            </button>
          `}
          <button type="button" class="sheet-action-btn" data-sheet-action="toggle-full" title="Ver ficha completa detalhada">
            ${eyeIcon}
            <span>Ver Ficha Completa</span>
          </button>
        </div>
      </div>
    `;
  }

  return `
    <div class="sheet-action-bar">
      ${quickNav}
        <button type="button" class="sheet-action-btn sheet-share-btn" data-sheet-action="share-character" title="Compartilhar link desta ficha" style="color:#ef4444;border-color:rgba(239,68,68,0.4);">
          <svg class="forja-svg sheet-action-btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
          <span>Compartilhar</span>
        </button>
        <button type="button" class="sheet-action-btn" data-sheet-action="export-pdf" title="Gerar PDF oficial de Tormenta 20">
          ${pdfIcon}
          <span>Gerar PDF</span>
        </button>
        <button type="button" class="sheet-action-btn" data-sheet-action="export-foundry" title="Exportar dados estruturados para Foundry VTT">
          ${foundryIcon}
          <span>Exportar para Foundry</span>
        </button>
        <button type="button" class="sheet-action-btn" data-sheet-action="switch-to-simplified" title="Ver Ficha Simplificada">
          ${eyeIcon}
          <span>Ficha Simplificada</span>
        </button>
        <button type="button" class="sheet-action-btn" data-sheet-action="switch-to-summary" title="Ver Ficha Resumida">
          ${eyeIcon}
          <span>Ficha Resumida</span>
        </button>
      </div>
    </div>
  `;
}

function renderSimplifiedSheet(isSummary = false){
  ensureProgression();
  const attrs=finalAttrs(true),stats=progressionStats(),race=raceById(state.identity.raceId),origin=selectedStandardOrigin(),regional=state.origin.mode==='dual'?selectedRegionalOrigin():null,deity=state.deity.mode==='devout'?state.deity.name:state.deity.mode==='pantheon'?'Panteão':'—',classes=[...new Set(state.progression.map(row=>classById(row.classId)?.nome).filter(Boolean))],inventory=typeof characterInventory==='function'?characterInventory():[],catalog=getPdfItemsCatalog(),passives=passiveCharacterEffects();
  const vitals = sheetVitals(stats);
  const alignmentValue = state.identity?.alignment || state.sheetNotes?.alignment || 'Neutro';
  const charName = state.identity?.characterName || 'Herói sem nome';
  const isEspirito = typeof hasCriacaoDosDeuses === 'function' && hasCriacaoDosDeuses();
  const raceDisplay = isEspirito ? `${race?.nome || 'Humano'} (Espírito)` : (race?.nome || 'Humano');
  const subtitle = `${esc(raceDisplay)} ${esc(classes.join(' / ') || 'Aventureiro')} ${state.identity?.plannedLevel || 1}, ${esc(alignmentValue)}`;

  const armorRec = typeof equippedArmorRecord === 'function' ? equippedArmorRecord() : null;
  const shieldRec = typeof equippedShieldRecord === 'function' ? equippedShieldRecord() : null;
  const armor = armorRec?.item || (typeof equippedArmorItem === 'function' ? equippedArmorItem() : inventory.map(entry=>catalog.get(entry.itemId)).find(item=>item?.tipo==='armadura'));
  const shield = shieldRec?.item || (typeof equippedShieldItem === 'function' ? equippedShieldItem() : inventory.map(entry=>catalog.get(entry.itemId)).find(item=>item?.tipo==='escudo'));
  const armorEntry = armorRec?.entry || inventory.find(entry=>entry.itemId===armor?.id);
  const shieldEntry = shieldRec?.entry || inventory.find(entry=>entry.itemId===shield?.id);
  const armorStats = typeof armorPassiveStats === 'function' ? armorPassiveStats(armor, armorEntry) : { defense: Number(armor?.armadura?.defesa || 0), penalty: Number(armor?.armadura?.penalidade || 0) };
  const shieldStats = typeof shieldPassiveStats === 'function' ? shieldPassiveStats(shield, shieldEntry) : { defense: Number(shield?.escudo?.bonusDefesa || 0), penalty: Number(shield?.escudo?.penalidade || 0) };
  const equipmentDefense = armorStats.defense + shieldStats.defense;
  const manualDef = Number(state?.tempManualBonuses?.defense || 0);
  const previewDefense = stats.defense + equipmentDefense + manualDef;

  const fmtSign = n => (n >= 0 ? '+' + n : String(n));
  const iniciativa = fmtSign(calculatedSkillTotal('iniciativa'));
  const percepcao = fmtSign(calculatedSkillTotal('percepcao'));
  const fort = fmtSign(calculatedSkillTotal('fortitude'));
  const ref = fmtSign(calculatedSkillTotal('reflexos'));
  const von = fmtSign(calculatedSkillTotal('vontade'));

  const itemName = entry => getSheetItemDisplayName(entry, catalog);
  const eqWeapon = typeof equippedWeaponRecord === 'function' ? equippedWeaponRecord() : null;
  const rawWeapons = inventory.map(entry => ({ entry, item: catalog.get(entry.itemId) })).filter(record => record.item?.tipo === 'arma');
  const sortedWeapons = [];
  if(eqWeapon?.item?.tipo === 'arma') sortedWeapons.push({ entry: eqWeapon.entry, item: eqWeapon.item });
  const equippedWeaponId = eqWeapon && typeof equipmentState === 'function' ? equipmentState().weaponId : '';
  rawWeapons.filter(w => !eqWeapon || (typeof equipEntryId === 'function' ? equipEntryId(w.entry, inventory.indexOf(w.entry)) !== equippedWeaponId : w.entry !== eqWeapon.entry)).forEach(w => { if(sortedWeapons.length < 5) sortedWeapons.push(w); });

  const rangeLabels = { curto: 'Curto', medio: 'Médio', longo: 'Longo', '3m': '3m', '4_5m': '4,5m', cone_de_6m: 'Cone de 6m' };
  const meleeAttacks = [];
  const rangedAttacks = [];

  sortedWeapons.forEach(({ entry, item }) => {
    const values = weaponPassiveStats(item, entry);
    const atk = values.attack >= 0 ? '+' + values.attack : String(values.attack);
    const dmg = esc(values.damage);
    const crit = esc(formatWeaponCritical(values.critical || item.arma?.critico));
    const types = esc((item.arma?.tipoDanoIds || []).join('/'));
    const rangeText = item.arma?.alcanceId ? ((typeof RANGE_LABELS !== 'undefined' && RANGE_LABELS[item.arma.alcanceId]) || rangeLabels[item.arma.alcanceId] || item.arma.alcanceId) : '';
    const rangePart = rangeText && rangeText !== '—' ? ', ' + esc(rangeText) : '';
    const formatted = `${esc(itemName(entry))} ${atk} (${dmg}, ${crit}${types ? ', ' + types : ''}${rangePart})`;
    if(item.arma?.alcanceId && item.arma.alcanceId !== 'corpo_a_corpo'){
      rangedAttacks.push(formatted);
    } else {
      meleeAttacks.push(formatted);
    }
  });

  const attackLines = [];
  if(meleeAttacks.length > 0) attackLines.push(`<div><strong>Corpo a Corpo:</strong> ${meleeAttacks.join(' ou ')}</div>`);
  if(rangedAttacks.length > 0) attackLines.push(`<div><strong>À Distância:</strong> ${rangedAttacks.join(' ou ')}</div>`);
  if(attackLines.length === 0) attackLines.push('<div><strong>Ataques:</strong> Nenhum ataque cadastrado.</div>');

  const formatAttrStatBlock = (mod) => {
    const m = Number(mod) || 0;
    const base = 10 + (m * 2);
    const sign = m >= 0 ? '+' : '';
    return `${base} (${sign}${m})`;
  };

  const attrsLine = `<strong>FOR</strong> ${formatAttrStatBlock(attrs.for)}, <strong>DES</strong> ${formatAttrStatBlock(attrs.des)}, <strong>CON</strong> ${formatAttrStatBlock(attrs.con)}, <strong>INT</strong> ${formatAttrStatBlock(attrs.int)}, <strong>SAB</strong> ${formatAttrStatBlock(attrs.sab)}, <strong>CAR</strong> ${formatAttrStatBlock(attrs.car)}`;

  const trainedSkills = [...new Set(allTrainedSkills())].map(id => {
    const name = typeof skillDisplayName === 'function' ? skillDisplayName(id) : id;
    const total = calculatedSkillTotal(id);
    return `${esc(name)} ${fmtSign(total)}`;
  }).sort((a, b) => a.localeCompare(b, 'pt-BR')).join(', ');

  const equipList = inventory.map(entry => {
    const name = esc(itemName(entry));
    const qty = entry.quantity && entry.quantity > 1 ? ` (${entry.quantity}x)` : '';
    return `${name}${qty}`;
  }).join(', ') || 'Nenhum equipamento.';
  const funds = typeof remainingFunds === 'function' ? remainingFunds() : 0;
  const fundsFormatted = typeof formatTibars === 'function' ? formatTibars(funds) : 'T$ ' + funds;

  const powers = [...(state.progression || []).map(row => progressionPowerById(row.powerId)), ...selectedGeneralPowers(), ...String(state.deity?.power || '').split('|').map(name => DATA.generalPowers?.find(power => power.nome === name))].filter(Boolean);
  const allFeatures = [
    ...selectedCharacterFeatures().filter(feature => !isSpellFieldFeature(feature) && !isVisionFeature(feature)),
    ...powers
  ];
  const seenFeatureNames = new Set();
  const uniqueFeatures = allFeatures.filter(f => {
    const fn = f.nome || f.name;
    if(!fn || seenFeatureNames.has(fn)) return false;
    seenFeatureNames.add(fn);
    return true;
  });

  let featuresHtml = '';
  if(isSummary){
    featuresHtml = uniqueFeatures.map(f => {
      const summary = (typeof sheetFeatureSummary === 'function' ? sheetFeatureSummary(f) : '') || f.resumo || f.descricao || f.description || '';
      return `<div class="simplified-feature"><span class="simplified-feature-name">${esc(f.nome || f.name)}:</span> ${esc(summary)}</div>`;
    }).join('');
  } else {
    const namesList = uniqueFeatures.map(f => esc(f.nome || f.name)).join(', ');
    if(namesList){
      featuresHtml = `<div class="simplified-line"><strong>Habilidades &amp; Poderes:</strong> ${namesList}</div>`;
    }
  }

  const learnedSpells = typeof allLearnedSpellIds === 'function' ? allLearnedSpellIds().map(id => spellById(id)?.name).filter(Boolean) : [];
  const spellsHtml = learnedSpells.length > 0 ? `
    <hr class="simplified-divider" />
    <div class="simplified-line"><strong>Magias:</strong> ${learnedSpells.map(s => esc(s)).join(', ')}</div>
  ` : '';

  const conditionsLine = (window.ForjaCondicoes ? window.ForjaCondicoes.renderLine() : '');

  return `
    <div class="simplified-sheet-container" style="max-width:900px;margin:0 auto;padding:12px;">
      ${renderSheetActionBar(isSummary ? 'summary' : 'simplified')}
      <div class="simplified-sheet-card">
        <div class="simplified-sheet-header">
          <div style="font-size:0.72rem;letter-spacing:1px;font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:3px">${isSummary ? 'Ficha Resumida' : 'Ficha Simplificada'}</div>
          <h2 class="simplified-sheet-title">${esc(charName.toUpperCase())}</h2>
          <div class="simplified-sheet-sub"><em>${subtitle}</em></div>
        </div>
        <hr class="simplified-divider" />
        <div class="simplified-line">
          Iniciativa ${iniciativa}, Percepção ${percepcao}, Defesa ${previewDefense}, Fort ${fort}, Ref ${ref}, Von ${von}
        </div>
        <div class="simplified-line">
          <strong>Pontos de Vida:</strong> ${vitals.pv} / ${vitals.pvMax}
        </div>
        <div class="simplified-line">
          <strong>Deslocamento:</strong> ${sheetMovement()}m (${Math.floor(sheetMovement()/1.5)}q)
        </div>
        <div class="simplified-line">
          <strong>Pontos de Mana:</strong> ${vitals.pm} / ${vitals.pmMax}
        </div>
        <div style="margin:6px 0;">
          ${conditionsLine}
        </div>
        <hr class="simplified-divider" />
        <div class="simplified-line">
          ${attackLines.join('')}
        </div>
        <hr class="simplified-divider" />
        <div class="simplified-line">
          ${attrsLine}
        </div>
        <hr class="simplified-divider" />
        <div class="simplified-line">
          <strong>Perícias:</strong> ${trainedSkills || 'Nenhuma perícia treinada.'}
        </div>
        <hr class="simplified-divider" />
        <div class="simplified-line">
          <strong>Equipamento:</strong> ${equipList} · Dinheiro: ${fundsFormatted}
        </div>
        ${featuresHtml ? `<hr class="simplified-divider" /><div>${featuresHtml}</div>` : ''}
        ${spellsHtml}
      </div>
    </div>
  `;
}

function renderCharacterDetails(){
  if(state.sheetLayoutMode === 'simplified'){
    return renderSimplifiedSheet(false);
  }
  if(state.sheetLayoutMode === 'summary'){
    return renderSimplifiedSheet(true);
  }
  if(typeof syncTavernContractsToSheetNotes==='function')syncTavernContractsToSheetNotes();
  ensureProgression();
  const attrs=finalAttrs(true),stats=progressionStats(),race=raceById(state.identity.raceId),origin=selectedStandardOrigin(),regional=state.origin.mode==='dual'?selectedRegionalOrigin():null,deity=state.deity.mode==='devout'?state.deity.name:state.deity.mode==='pantheon'?'Panteão':'—',classes=[...new Set(state.progression.map(row=>classById(row.classId)?.nome).filter(Boolean))],inventory=typeof characterInventory==='function'?characterInventory():[],catalog=getPdfItemsCatalog(),trained=new Set(allTrainedSkills()),passives=passiveCharacterEffects();
  const armorRec = typeof equippedArmorRecord === 'function' ? equippedArmorRecord() : null;
  const shieldRec = typeof equippedShieldRecord === 'function' ? equippedShieldRecord() : null;
  const armor = armorRec?.item || (typeof equippedArmorItem === 'function' ? equippedArmorItem() : inventory.map(entry=>catalog.get(entry.itemId)).find(item=>item?.tipo==='armadura'));
  const shield = shieldRec?.item || (typeof equippedShieldItem === 'function' ? equippedShieldItem() : inventory.map(entry=>catalog.get(entry.itemId)).find(item=>item?.tipo==='escudo'));
  const armorEntry = armorRec?.entry || inventory.find(entry=>entry.itemId===armor?.id);
  const shieldEntry = shieldRec?.entry || inventory.find(entry=>entry.itemId===shield?.id);

  const armorStats = typeof armorPassiveStats === 'function' ? armorPassiveStats(armor, armorEntry) : { defense: Number(armor?.armadura?.defesa || 0), penalty: Number(armor?.armadura?.penalidade || 0) };
  const shieldStats = typeof shieldPassiveStats === 'function' ? shieldPassiveStats(shield, shieldEntry) : { defense: Number(shield?.escudo?.bonusDefesa || 0), penalty: Number(shield?.escudo?.penalidade || 0) };

  const itemName=entry=>getSheetItemDisplayName(entry,catalog),eqWeapon=typeof equippedWeaponRecord==='function'?equippedWeaponRecord():null,rawWeapons=inventory.map(entry=>({entry,item:catalog.get(entry.itemId)})).filter(record=>record.item?.tipo==='arma'),sortedWeapons=[];
  if(eqWeapon?.item?.tipo==='arma')sortedWeapons.push({entry:eqWeapon.entry,item:eqWeapon.item});
  const equippedWeaponId=eqWeapon&&typeof equipmentState==='function'?equipmentState().weaponId:'';
  rawWeapons.filter(w=>!eqWeapon||(typeof equipEntryId==='function'?equipEntryId(w.entry,inventory.indexOf(w.entry))!==equippedWeaponId:w.entry!==eqWeapon.entry)).sort((a,b)=>{const rA=typeof weaponHierarchyRank==='function'?weaponHierarchyRank(a.item):0,rB=typeof weaponHierarchyRank==='function'?weaponHierarchyRank(b.item):0;return rB-rA}).forEach(w=>{if(sortedWeapons.length<5)sortedWeapons.push(w)});
  const rangeLabels={curto:'Curto',medio:'Médio',longo:'Longo','3m':'3m','4_5m':'4,5m',cone_de_6m:'Cone de 6m'};
  const attackRows=sortedWeapons.length?sortedWeapons.map(({entry,item})=>{const values=weaponPassiveStats(item,entry);const rangeText=item.arma?.alcanceId?((typeof RANGE_LABELS!=='undefined'&&RANGE_LABELS[item.arma.alcanceId])||rangeLabels[item.arma.alcanceId]||item.arma.alcanceId):'—';return '<tr><td>'+esc(itemName(entry))+'</td><td>'+values.attack+'</td><td>'+esc(values.damage)+'</td><td>'+esc(formatWeaponCritical(values.critical||item.arma?.critico))+'</td><td>'+esc((item.arma?.tipoDanoIds||[]).join('/'))+'</td><td>'+esc(rangeText)+'</td></tr>'}).join(''):'<tr><td colspan="6" class="sheet-preview-empty">Nenhum ataque cadastrado.</td></tr>';
  const skillRows=renderSheetSkillRows();
  const powers=[...(state.progression||[]).map(row=>progressionPowerById(row.powerId)),...selectedGeneralPowers(),...String(state.deity.power||'').split('|').map(name=>DATA.generalPowers.find(power=>power.nome===name))].filter(Boolean),learned=typeof allLearnedSpellIds==='function'?allLearnedSpellIds().map(id=>spellById(id)?.name).filter(Boolean):[];
  const isMestre = isModoMestreAtivo();
  const mestreBanner = isMestre ? `
    <div style="background:#271214;border:1px solid #dc2626;color:#fecaca;padding:8px 16px;border-radius:6px;margin-bottom:12px;font-size:0.84rem;display:flex;align-items:center;justify-content:space-between">
      <span><strong>Modo Mestre:</strong> Ficha de aventureiro vinculada à mesa. Modificadores em atributos e perícias podem ser permanentes.</span>
      <a href="recompensas.html" style="color:#ffffff;text-decoration:underline;font-weight:bold;font-size:0.8rem">Voltar à Mesa de Jogo</a>
    </div>
  ` : '';
  const distActiveIds = typeof progressionDistinctionActiveIds === 'function' ? progressionDistinctionActiveIds() : (Array.isArray(state.distinctions?.activeIds) ? state.distinctions.activeIds : []);
  const distCatalog = (typeof DATA !== 'undefined' && Array.isArray(DATA?.distinctions)) ? DATA.distinctions : [];
  const distNames = distActiveIds.map(id => distCatalog.find(d => d.id === id)?.nome).filter(Boolean);
  const actionBar = typeof renderSheetActionBar === 'function' ? renderSheetActionBar(false) : '';
  const isEspirito = typeof hasCriacaoDosDeuses === 'function' && hasCriacaoDosDeuses();
  const raceDisplay = isEspirito ? `${race?.nome || '—'} (Espírito)` : (race?.nome || '—');
  const charName = state.identity?.characterName || 'Personagem sem nome';
  const identity=mestreBanner+'<section class="sheet-preview-identity"><span><small>Personagem</small><strong>'+esc(charName)+'</strong></span><span><small>Jogador</small><strong>'+esc(state.identity.playerName||'Jogador não informado')+'</strong></span><span><small>Raça</small><strong>'+esc(raceDisplay)+'</strong></span><span><small>Origem</small><strong>'+esc([origin?.nome,regional?.nome].filter(Boolean).join(' / ')||'—')+'</strong></span><span><small>Classe</small><strong>'+esc(classes.join(' / ')||'—')+' · nível '+state.identity.plannedLevel+'</strong></span><span><small>Divindade</small><strong>'+esc(deity)+'</strong></span></section>';
  
  const slidersIcon = window.IconesForja ? window.IconesForja.get('sliders', 'icon-sm') : '';
  const isSteppers = Boolean(state.attrSteppersActive);
  const attributes = `
    <div class="sheet-attributes-block">
      <section class="sheet-preview-attributes ${isSteppers ? 'steppers-active' : ''}" id="sheetAttributesGrid">
        ${ATTRS.map(([id]) => `
          <div class="sheet-attr-card" data-attr-card="${id}">
            <button type="button" class="sheet-attr-stepper-btn btn-attr-up" data-attr-step="up" data-attr-key="${id}" title="Aumentar ${id.toUpperCase()} (+1)" aria-label="Aumentar ${id.toUpperCase()}">+</button>
            <div class="sheet-attr-main-content">
              <small>${id.toUpperCase()}</small>
              <strong class="sheet-attr-val" data-attr-val="${id}">${attrs[id]}</strong>
            </div>
            <button type="button" class="sheet-attr-stepper-btn btn-attr-down" data-attr-step="down" data-attr-key="${id}" title="Diminuir ${id.toUpperCase()} (-1)" aria-label="Diminuir ${id.toUpperCase()}">− </button>
          </div>
        `).join('')}
      </section>
      <div class="sheet-attr-bottom-bar" style="display:flex;align-items:center;justify-content:flex-start;gap:8px;margin-top:8px;padding-left:2px;">
        <button type="button" class="sheet-attr-edit-toggle-btn ${isSteppers ? 'active' : ''}" data-action="toggle-attr-steppers" title="Ajustar modificadores nos atributos">
          ${slidersIcon}
          <span>${isSteppers ? 'Concluir' : 'Alterar'}</span>
        </button>
        ${isMestre && isSteppers ? `
          <button type="button" class="button small" data-action="toggle-attr-master-mode" style="font-size:0.75rem;padding:3px 8px;background:#27272a;border:1px solid #dc2626;color:#fca5a5;cursor:pointer" title="Alternar entre modo permanente do mestre e temporário">
            Modo Mestre: ${state.attrStepMode === 'temp' ? 'Temporário' : 'Permanente'}
          </button>
        ` : ''}
      </div>
    </div>
  ` + sheetVitalControls(stats);
  
  const manualDef = Number(state?.tempManualBonuses?.defense || 0);
  const equipmentDefense=armorStats.defense+shieldStats.defense,previewDefense=stats.defense+equipmentDefense+manualDef;
  const armorName = armor ? esc(getSheetItemDisplayName(armorEntry, catalog)) : '<span class="sheet-preview-empty">Nenhuma armadura equipada</span>';
  const shieldName = shield ? esc(getSheetItemDisplayName(shieldEntry, catalog)) : '<span class="sheet-preview-empty">Nenhum escudo equipado</span>';
  const defenseRows='<tr><td><strong>Armadura</strong></td><td>'+armorName+'</td><td>'+(armor?'+'+armorStats.defense:'—')+'</td><td>'+(armor?(armorStats.penalty?armorStats.penalty:'0'):'—')+'</td><td>'+(armor?(armor.categoriaId==='pesada'||armor.armadura?.categoriaId==='pesada'?'Pesada':'Leve'):'—')+'</td><td>'+(armor?Number(armor.espacos||0)+' esp.':'—')+'</td></tr><tr><td><strong>Escudo</strong></td><td>'+shieldName+'</td><td>'+(shield?'+'+shieldStats.defense:'—')+'</td><td>'+(shield?(shieldStats.penalty?shieldStats.penalty:'0'):'—')+'</td><td>'+(shield?(shield.categoriaId==='pesado'||shield.escudo?.categoriaId==='pesado'?'Pesado':'Leve'):'—')+'</td><td>'+(shield?Number(shield.espacos||0)+' esp.':'—')+'</td></tr>';
  const defenseEquipmentTable='<div class="sheet-preview-table-wrap" style="margin-top:2px"><table class="sheet-preview-table defense-equipment"><thead><tr><th>Proteção</th><th>Item</th><th>Defesa</th><th>Penalidade</th><th>Tipo</th><th>Espaços</th></tr></thead><tbody>'+defenseRows+'</tbody></table></div>';
  const rdSummary = typeof characterTotalReductionsSummary === 'function' ? characterTotalReductionsSummary() : '';
  const rdHtml = rdSummary ? '<p class="sheet-defense-rd">' + renderSheetReductionText(rdSummary) + '</p>' : '';

  
  const left='<div class="sheet-preview-main">'+attributes+'<div class="sheet-preview-lower"><section class="sheet-preview-box"><div class="sheet-defense-heading"><h3>'+sheetHeadingIcon('shield')+'Defesa</h3><button type="button" class="button small" data-vital-action="open-temp-bonuses" title="Bônus temporários de Defesa e Perícias" style="font-size:0.62rem;padding:2px 6px;min-height:20px;height:20px;line-height:1;cursor:pointer">Bônus temp.</button></div><div class="sheet-defense-value"><strong>'+previewDefense+'</strong><span>Base 10 + '+characterDefenseAttribute().toUpperCase()+ ' + '+armorStats.defense+' de armadura + '+shieldStats.defense+' de escudo + '+Number(passives.defenseBonus||0)+' bônus'+(manualDef ? ' + ' + (manualDef > 0 ? '+' : '') + manualDef + ' temporário' : '')+'</span></div>'+defenseEquipmentTable+rdHtml+renderSheetPartnersBlock()+'</section><section class="sheet-preview-box"><div class="sheet-conditions-heading"><h3>Condições</h3>'+(window.ForjaCondicoes?window.ForjaCondicoes.renderLine():'')+'</div>'+renderSheetConditions()+'<p>Tamanho: '+esc(characterSizeId())+' · Deslocamento: '+sheetMovement()+' m</p></section></div>'+'<section class="sheet-preview-box"><h3 class="sheet-attacks-heading">'+sheetHeadingIcon('sword')+'Ataques</h3><div class="sheet-preview-table-wrap"><table class="sheet-preview-table attacks"><thead><tr><th>Arma</th><th>Teste</th><th>Dano</th><th>Crítico</th><th>Tipo</th><th>Alcance</th></tr></thead><tbody>'+attackRows+'</tbody></table></div></section></div>',skills='<aside class="sheet-preview-box sheet-preview-skills"><div class="sheet-skills-heading"><h3>Perícias</h3><div style="display:flex;gap:4px;align-items:center"><button class="button small sheet-skill-order" data-sheet-skill-order type="button" style="font-size:0.62rem;padding:2px 6px;min-height:20px;height:20px;line-height:1;cursor:pointer;margin:0">'+(state.sheetSkillOrder==='attribute'?'Atributo + A–Z':'A–Z')+'</button><button type="button" class="button small" data-vital-action="open-temp-bonuses" title="Bônus temporários de Defesa e Perícias" style="font-size:0.62rem;padding:2px 6px;min-height:20px;height:20px;line-height:1;cursor:pointer">Bônus temp.</button></div></div><div class="sheet-preview-table-wrap"><table class="sheet-preview-table"><thead><tr><th>Total</th><th>Perícia</th><th>Atr.</th><th>Treino</th><th>Bônus</th></tr></thead><tbody>'+skillRows+'</tbody></table></div></aside>';
  const wornEntries=[],carriedEntries=[],seenTraje=new Set();
  for(const entry of inventory){
    if(/traje_de_viaj/i.test(entry?.itemId)||/traje_de_viaj/i.test(entry?.displayName)||/traje_de_viaj/i.test(entry?.itemName)){
      if(seenTraje.has('traje'))continue;
      seenTraje.add('traje');
      entry.itemId='traje_de_viajante';
      entry.displayName='Traje de Viajante';
      entry.itemName='Traje de Viajante';
      entry.quantity=1;
    }
    const item=catalog.get(entry.itemId);
    const isWorn=Boolean(item?.tipo==='armadura'||item?.tipo==='escudo'||item?.equipamento?.itemVestido);
    if(isWorn) wornEntries.push({entry,item});
    else carriedEntries.push({entry,item});
  }
  const wornHtml=wornEntries.length?wornEntries.map(({entry,item})=>{
    let defPen = 'Item vestido';
    if (item?.tipo === 'armadura') {
      const st = typeof armorPassiveStats === 'function' ? armorPassiveStats(item, entry) : { defense: item.armadura.defesa, penalty: item.armadura.penalidade };
      defPen = 'Def +' + st.defense + ' · Pen ' + st.penalty;
    } else if (item?.tipo === 'escudo') {
      const st = typeof shieldPassiveStats === 'function' ? shieldPassiveStats(item, entry) : { defense: item.escudo.bonusDefesa, penalty: item.escudo.penalidade };
      defPen = 'Def +' + st.defense + ' · Pen ' + st.penalty;
    }
    const isEngWorn = Boolean(entry?.isEngenhoca || entry?.contraptionId || item?.tipo === 'engenhoca' || /engenhoca/i.test(entry?.itemId || '') || entry?.origem === 'engenhoca');
    const attachedWorn = entry?.attachedItem || entry?.engenhocaInfo?.attachedItem || item?.attachedItem || item?.engenhocaInfo?.attachedItem;
    const spWorn = attachedWorn ? ((attachedWorn.espacos != null ? Number(attachedWorn.espacos) : 0) + 1) : Number(entry?.espacos ?? item?.espacos ?? (isEngWorn ? 1 : 0));
    return '<div><strong>'+esc(itemName(entry))+'</strong><span>'+defPen+' · '+spWorn+' esp.</span></div>';
  }).join(''):'<p class="help">Nenhuma armadura ou item vestido equipado.</p>';
  const carriedHtml=carriedEntries.length?carriedEntries.map(({entry,item})=>{
    const isEngCarried = Boolean(entry?.isEngenhoca || entry?.contraptionId || item?.tipo === 'engenhoca' || /engenhoca/i.test(entry?.itemId || '') || entry?.origem === 'engenhoca');
    const attachedCarried = entry?.attachedItem || entry?.engenhocaInfo?.attachedItem || item?.attachedItem || item?.engenhocaInfo?.attachedItem;
    const spCarried = attachedCarried ? ((attachedCarried.espacos != null ? Number(attachedCarried.espacos) : 0) + 1) : Number(entry?.espacos ?? item?.espacos ?? (isEngCarried ? 1 : 0));
    const espTexto = spCarried === 1 ? '1 espaço' : spCarried + ' espaços';
    return '<div><strong>'+esc(itemName(entry))+'</strong><span>Qtd. '+Number(entry.quantity||1)+' · '+espTexto+'</span></div>';
  }).join(''):'<p class="help">Nenhum item na mochila.</p>';
  const equipmentSectionHtml=typeof renderEquipmentPanel==='function'?renderEquipmentPanel():('<div class="sheet-equipment-sections" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;margin-bottom:12px"><div class="sheet-equipment-block" style="background:#0d121a;border:1px solid var(--border);border-radius:8px;padding:9px 11px"><h4 style="margin:0 0 7px 0;font-size:0.68rem;color:var(--gold2)">Itens vestidos &amp; equipados</h4><div class="sheet-preview-equipment">'+wornHtml+'</div></div><div class="sheet-equipment-block" style="background:#0d121a;border:1px solid var(--border);border-radius:8px;padding:9px 11px"><h4 style="margin:0 0 7px 0;font-size:0.68rem;color:var(--gold2)">Mochila</h4><div class="sheet-preview-equipment">'+carriedHtml+'</div></div></div>');
  const equipment=panel('Equipamento',equipmentSectionHtml),extras=panel('Poderes e magias','<div class="sheet-preview-extras"><div><h4>Poderes</h4><div class="tag-row">'+powers.map(power=>'<span class="tag green">'+esc(power.nome)+'</span>').join('')+'</div></div><div><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px"><h4>Magias conhecidas</h4><button class="button small primary" type="button" data-sheet-action="grimoire" data-grimoire-view="learned" style="font-size:0.65rem;padding:2px 8px;min-height:22px;height:22px;line-height:1">Grimório</button></div><div class="tag-row">'+learned.sort((a,b)=>a.localeCompare(b,'pt-BR')).map(name=>'<span class="tag">'+esc(name)+'</span>').join('')+'</div></div></div>');
  const abilitiesTitle = distNames.length > 0 ? 'Habilidades de raça, origem, divindade e distinções' : 'Habilidades de raça, origem e divindade';
  const abilities='<section class="sheet-preview-box"><h3>'+abilitiesTitle+'</h3><div class="sheet-preview-feature-list">'+selectedCharacterFeatures().filter(feature=>!['class','class-power','class-choice'].includes(feature.source)&&feature.source!=='training'&&feature.category!=='class-power'&&!isSpellFieldFeature(feature)&&!isVisionFeature(feature)).map(f=>sheetFeatureDisclosure(f, false)).join('')+'</div></section>';
  const profLabels={armas_simples:'Armas simples',armas_marciais:'Armas marciais',armas_exoticas:'Armas exóticas',armaduras_leves:'armaduras leves',armaduras_pesadas:'armaduras pesadas',escudos:'escudos'};
  const profList = (typeof characterProficiencies === 'function' ? characterProficiencies() : []).map(id => profLabels[id] || String(id).replace(/_/g, ' '));
  const profText = profList.length ? profList.join(', ').replace(/, ([^,]*)$/, ' e $1') : 'Nenhuma';

  const raceObj = typeof raceById === 'function' ? raceById(state.identity.raceId) : null;
  const raceVision = (raceObj?.habilidades?.fixas || []).filter(h => typeof isVisionFeature === 'function' && isVisionFeature(h));
  const allFeats = typeof selectedCharacterFeatures === 'function' ? selectedCharacterFeatures() : [];
  const extraVision = allFeats.filter(h => typeof isVisionFeature === 'function' && isVisionFeature(h));
  const visionList = [...new Set([...raceVision, ...extraVision].map(h => h.nome || h.name).filter(Boolean))];
  const visionText = visionList.length ? visionList.join(', ') : 'Nenhuma';

  let profAndVisionHtml = '';
  if (profText === 'Nenhuma' && visionText === 'Nenhuma') {
    profAndVisionHtml = '<p style="margin:8px 10px;font-size:0.75rem;color:var(--text-muted)">Nenhuma</p>';
  } else {
    profAndVisionHtml = '<div style="padding:8px 10px;font-size:0.72rem;line-height:1.45;">' +
      '<div><strong style="color:var(--gold2)">Proficiências:</strong> ' + esc(profText) + '</div>' +
      '<div style="margin-top:6px;"><strong style="color:var(--gold2)">Visão:</strong> ' + esc(visionText) + '</div>' +
    '</div>';
  }

  const proficiencies='<section class="sheet-preview-box"><h3>Proficiências e Visão</h3>' + profAndVisionHtml + '</section>';
  const distinctionBlock = renderSheetDistinctionBlock();
  const swapPowersBlock = renderSheetSwapPowersBlock();
  const proficienciesColumn = '<div class="sheet-preview-proficiencies-column" style="display:flex;flex-direction:column;gap:12px;">' + proficiencies + distinctionBlock + swapPowersBlock + '</div>';

  const isUsingAgeRules = Boolean(state.age?.enabled);
  let ageDisplayValue = '';
  if (isUsingAgeRules) {
    const bandId = state.age?.band || '';
    const bandName = (typeof BANDS !== 'undefined' && BANDS[bandId]?.name) ||
      (typeof window !== 'undefined' && window.__FORJA_DATA__?.BANDS?.[bandId]?.name) ||
      ({
        crianca: 'Criança',
        adolescente: 'Adolescente',
        jovem: 'Jovem',
        adulto: 'Adulto',
        maduro: 'Maduro',
        velho: 'Velho',
        anciao: 'Ancião'
      }[bandId] || '');
    const years = state.age?.years !== undefined && state.age?.years !== '' && state.age?.years !== null
      ? String(state.age.years).trim()
      : '';
    if (years && bandName) {
      ageDisplayValue = `${years} (${bandName})`;
    } else if (bandName) {
      ageDisplayValue = bandName;
    } else if (years) {
      ageDisplayValue = years;
    }
  } else {
    ageDisplayValue = state.identity?.age || state.sheetNotes?.age || '';
  }

  const alignmentValue = state.identity?.alignment || state.sheetNotes?.alignment || '';

  const alignmentAndAgeHtml = `
    <div class="sheet-preview-alignment-age" style="display:grid;grid-template-columns:1.75fr 1fr;gap:12px;align-items:center;margin-bottom:0px;">
      <div style="display:flex;align-items:center;gap:8px;background:#0d121a;border:1px solid var(--border);border-radius:8px;padding:6px 12px;box-sizing:border-box;">
        <span style="font-family:Cinzel,serif;font-weight:700;font-size:0.72rem;color:var(--gold2);text-transform:uppercase;white-space:nowrap;letter-spacing:0.5px;">ALINHAMENTO</span>
        <input type="text" class="input sheet-field-alignment" data-sheet-field="alignment" placeholder="Ex: Leal e Bom, Neutro..." value="${esc(alignmentValue)}" style="flex:1;height:28px;min-height:28px;padding:2px 8px;font-size:0.82rem;background:#111824;border:1px solid #1e2837;color:#f8fafc;border-radius:4px;box-sizing:border-box;">
      </div>
      <div style="display:flex;align-items:center;gap:8px;background:#0d121a;border:1px solid var(--border);border-radius:8px;padding:6px 12px;box-sizing:border-box;">
        <span style="font-family:Cinzel,serif;font-weight:700;font-size:0.72rem;color:var(--gold2);text-transform:uppercase;white-space:nowrap;letter-spacing:0.5px;">IDADE</span>
        <input type="text" class="input sheet-field-age" data-sheet-field="age" placeholder="Ex: 25 anos" value="${esc(ageDisplayValue)}" style="flex:1;height:28px;min-height:28px;padding:2px 8px;font-size:0.82rem;background:#111824;border:1px solid #1e2837;color:#f8fafc;border-radius:4px;box-sizing:border-box;">
      </div>
    </div>
  `;

  let historyItemsHtml = state.progression.map((row, index) => {
    const cls = classById(row.classId), level = classLevelAt(index, row.classId);
    const classAbilities = (cls?.habilidades || []).filter(ability => {
      if (Number(ability.nivel) !== level) return false;
      const s = slug(ability.nome || ability.id || '');
      if (/^poder_(?:de_|do_|da_)?/i.test(s)) return false;
      return true;
    });
    const power = progressionPowerById(row.powerId) || (typeof progressionDistinctionPowerById === 'function' ? progressionDistinctionPowerById(row.powerId) : null);
    
    const items = [...classAbilities];
    if(row.powerId === 'classe_aumento_de_atributo'){
      const attrName = (typeof ATTR_LABEL !== 'undefined' && ATTR_LABEL[row.powerChoice]) || row.powerChoice?.toUpperCase() || '';
      items.push({
        id: 'classe_aumento_de_atributo',
        nome: 'Aumento de Atributo' + (row.powerChoice ? ' (' + row.powerChoice.toUpperCase() + ')' : ''),
        descricao: 'Você recebe +1 no valor do atributo ' + attrName + '.'
      });
    } else if(power){
      items.push(power);
    } else if(row.powerId){
      items.push({
        id: row.powerId,
        nome: row.powerChoice ? `${row.powerId} (${row.powerChoice})` : row.powerId,
        descricao: ''
      });
    }

    const itemsHtml = items.map(item => sheetFeatureDisclosure(item, true)).join('');
    return '<li><strong>Nível ' + (index + 1) + ' · ' + esc(cls?.nome || '') + '</strong>' + (itemsHtml || '<p class="sheet-preview-empty">Nenhum poder ou habilidade neste nível.</p>') + '</li>';
  }).join('');

  if(state.levelTraining?.power && (state.levelTraining.selectedPowerId || state.levelTraining.nextPowerId)){
    const trainedPowId = state.levelTraining.selectedPowerId || state.levelTraining.nextPowerId;
    const p = (typeof progressionPowerById === 'function' ? progressionPowerById(trainedPowId) : null)
      || ((DATA.classPowers || []).find(x => x.id === trainedPowId))
      || ((DATA.generalPowers || []).find(x => x.id === trainedPowId));
    if(p){
      const nextClsId = state.levelTraining.nextClassId || state.progression[state.progression.length - 1]?.classId || state.identity?.classId;
      const nextCls = classById(nextClsId);
      const itemsHtml = sheetFeatureDisclosure(p, true);
      historyItemsHtml += '<li><strong>Nível ' + (state.progression.length + 1) + ' · ' + esc(nextCls?.nome || '') + '</strong>' + itemsHtml + '</li>';
    }
  }

  const history = '<section class="sheet-preview-box sheet-preview-history"><h3>Progressão de personagem</h3><ol>' + historyItemsHtml + '</ol></section>';

  return '<div class="sheet-preview">'+ actionBar + identity + '<div class="sheet-preview-middle">'+left+skills+'</div>'+equipment+'<div class="sheet-preview-second-page">' + history + '<div class="sheet-preview-reference">'+alignmentAndAgeHtml+'<div class="sheet-preview-reference-top">'+abilities+proficienciesColumn+'</div>'+sheetLearnedSpells()+'<section class="sheet-preview-box"><h3>Anotações</h3><textarea class="input sheet-notes" data-sheet-note="notes" aria-label="Anotações">'+esc(state.sheetNotes?.notes||'')+'</textarea></section></div></div></div>' + renderAttrTempModalHtml() + renderSheetPartnerModalHtml() + renderSheetHelperModalHtml();
}
function renderSheetSwapPowersBlock(){
  const items = [];

  // 1. Origem Cosmopolita
  const hasCosmo = typeof hasCosmopolita === 'function' ? hasCosmopolita() : (
    state.origin?.mode === 'dual' && slug(typeof selectedRegionalOrigin === 'function' ? selectedRegionalOrigin()?.nome || '' : state.origin?.regional || '') === 'cosmopolita'
  );
  if (hasCosmo) {
    const chosenKey = state.powers?.cosmopolitaPower || '';
    let powerName = 'Nenhum poder escolhido';
    let powerDesc = 'Clique no botão ao lado para escolher um poder geral ou de classe pelo benefício da origem Cosmopolita.';
    if (chosenKey) {
      const powId = chosenKey.includes(':') ? chosenKey.split(':').slice(1).join(':') : chosenKey;
      const allPowers = [...(DATA.generalPowers || []), ...(DATA.classPowers || [])];
      const found = allPowers.find(p => p.id === powId);
      if (found) {
        powerName = found.nome;
        powerDesc = found.descricao || '';
      }
    }
    const itemBorder = items.length > 0 ? 'border-top:1px solid var(--border);padding-top:8px;margin-top:8px;' : '';
    items.push(`
      <div class="sheet-swap-item" style="${itemBorder}">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:3px;">
          <strong style="color:#60a5fa;font-size:0.75rem;font-family:Cinzel,serif;letter-spacing:0.5px;">COSMOPOLITA</strong>
          <button type="button" class="button small" data-action="open-cosmopolita-swap" style="background:#991b1b;border:1px solid #b91c1c;color:#fff;font-weight:700;font-size:0.65rem;padding:2px 10px;min-height:22px;height:22px;line-height:1;border-radius:4px;cursor:pointer;">
            Trocar
          </button>
        </div>
        <div style="font-size:0.78rem;color:var(--gold2);font-weight:600;margin-bottom:3px;">
          ${esc(powerName)}
        </div>
        <p style="font-size:0.72rem;color:var(--text-muted);margin:0;line-height:1.45;white-space:pre-line;">${esc(powerDesc)}</p>
      </div>
    `);
  }

  // 2. Agente de Elite (Nobre)
  const hasAgente = typeof hasAgenteDeElite === 'function' ? hasAgenteDeElite() : (
    Boolean(state.agenteElite) || (state.progression || []).some(r => r.powerId === 'nobre_agente_de_elite')
  );
  if (hasAgente) {
    const choice = typeof getAgenteEliteChoice === 'function' ? getAgenteEliteChoice() : state.agenteElite;
    let agentTitle = 'Nenhum agente definido';
    let agentDesc = 'Clique no botão ao lado para escolher entre um parceiro veterano (ou montaria) ou um poder de outra classe.';

    if (choice) {
      if (choice.mode === 'partner') {
        agentTitle = choice.name || choice.id;
        agentDesc = (choice.role ? choice.role + '. ' : '') + (choice.benefit ? 'Benefício: ' + choice.benefit : '');
      } else if (choice.mode === 'power') {
        agentTitle = choice.name || choice.powerId;
        agentDesc = choice.descricao || '';
      }
    }

    const itemBorder = items.length > 0 ? 'border-top:1px solid var(--border);padding-top:8px;margin-top:8px;' : '';
    items.push(`
      <div class="sheet-swap-item" style="${itemBorder}">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:3px;">
          <strong style="color:#60a5fa;font-size:0.75rem;font-family:Cinzel,serif;letter-spacing:0.5px;">AGENTE DE ELITE</strong>
          <button type="button" class="button small" data-action="open-agente-elite-swap" style="background:#991b1b;border:1px solid #b91c1c;color:#fff;font-weight:700;font-size:0.65rem;padding:2px 10px;min-height:22px;height:22px;line-height:1;border-radius:4px;cursor:pointer;">
            Trocar
          </button>
        </div>
        <div style="font-size:0.78rem;color:var(--gold2);font-weight:600;margin-bottom:3px;">
          ${esc(agentTitle)}
        </div>
        <p style="font-size:0.72rem;color:var(--text-muted);margin:0;line-height:1.45;white-space:pre-line;">${esc(agentDesc)}</p>
      </div>
    `);
  }

  if (items.length === 0) return '';

  return `
    <section class="sheet-preview-box sheet-swap-powers-box">
      <h3 style="display:flex;align-items:center;justify-content:space-between;">
        <span>Poderes Adaptáveis</span>
        <span style="font-size:0.6rem;color:var(--muted);text-transform:none;letter-spacing:normal;">Troca por aventura/descanso</span>
      </h3>
      <div style="padding:10px 11px;">
        ${items.join('')}
      </div>
    </section>
  `;
}
function renderSheetDistinctionBlock(){
  const distActiveIds = typeof progressionDistinctionActiveIds === 'function' ? progressionDistinctionActiveIds() : (Array.isArray(state.distinctions?.activeIds) ? state.distinctions.activeIds : []);
  if (!distActiveIds || !distActiveIds.length) return '';
  const distCatalog = (typeof DATA !== 'undefined' && Array.isArray(DATA?.distinctions)) ? DATA.distinctions : [];
  const dists = distActiveIds.map(id => distCatalog.find(d => d.id === id)).filter(Boolean);
  if (!dists.length) return '';

  const awardIcon = window.IconesForja ? window.IconesForja.get('award', 'icon-sm') : '';
  const headingIcon = awardIcon ? '<span class="sheet-heading-icon" aria-hidden="true">' + awardIcon + '</span>' : '';

  const itemsHtml = dists.map(dist => {
    const marca = dist.marca;
    const marcaText = marca ? (marca.nome ? '<strong>' + esc(marca.nome) + ':</strong> ' : '') + esc(marca.descricao || '') : '';
    return '<div class="sheet-distinction-item">' +
      '<div style="font-size:0.85rem;color:var(--gold2);font-weight:700;margin-bottom:3px;">' + esc(dist.nome) + '</div>' +
      (marcaText ? '<p style="font-size:0.75rem;color:var(--text-muted);margin:0;line-height:1.45;white-space:pre-line;">' + marcaText + '</p>' : '') +
    '</div>';
  }).join('<div style="border-top:1px solid var(--border);margin:8px 0;padding-top:8px;"></div>');

  return '<section class="sheet-preview-box sheet-distinction-box">' +
    '<h3 style="display:flex;align-items:center;gap:6px;">' + headingIcon + 'Distinção</h3>' +
    '<div>' + itemsHtml + '</div>' +
  '</section>';
}

function getLevelTrainingState(){
  state.levelTraining = state.levelTraining && typeof state.levelTraining === 'object'
    ? state.levelTraining
    : { pv: false, pm: false, skills: false, power: false, nextClassId: '', selectedPowerId: '', selectedPowerChoice: '' };
  if(!state.levelTraining.nextClassId){
    state.levelTraining.nextClassId = state.progression?.at(-1)?.classId || state.identity?.classId || '';
  }
  return state.levelTraining;
}

function getLevelTrainingPreviewStats(nextClassOverride){
  const t = getLevelTrainingState();
  const nextClassId = nextClassOverride || t.nextClassId || state.progression?.at(-1)?.classId || state.identity?.classId || '';
  const cls = (typeof DATA !== 'undefined' && Array.isArray(DATA?.classes))
    ? DATA.classes.find(c => c.id === nextClassId) || null
    : null;
  const attrs = typeof finalAttrs === 'function' ? finalAttrs(false) : {};
  const passives = typeof passiveCharacterEffects === 'function' ? passiveCharacterEffects() : { pvPerLevel: 0, pmPerLevel: 0 };
  const currentLevel = Number(state.identity?.plannedLevel) || 1;
  const pvBase = Number(cls?.caracteristicas?.pv?.porNivel ?? cls?.pvPorNivel ?? 0);
  const pmBase = Number(cls?.caracteristicas?.pm?.porNivel ?? cls?.pmPorNivel ?? 0);
  const pvGain = cls ? Math.max(1, pvBase + Number(attrs.con || 0) + Number(passives.pvPerLevel || 0)) : 0;
  const pmGain = cls ? Math.max(0, pmBase + Number(passives.pmPerLevel || 0)) : 0;
  const isOddLevel = currentLevel % 2 === 1;
  const completedCount = [t.pv, t.pm, t.skills, t.power].filter(Boolean).length;
  return {
    currentLevel,
    nextLevel: Math.min(20, currentLevel + 1),
    nextClassId,
    cls,
    pvBase,
    pvGain,
    pmGain,
    isOddLevel,
    completedCount
  };
}

function renderLevelTrainingModalHtml(){
  const t = getLevelTrainingState();
  const info = getLevelTrainingPreviewStats();
  const classesList = (typeof DATA !== 'undefined' && Array.isArray(DATA?.classes)) ? DATA.classes : [];
  const powerId = t.selectedPowerId || t.nextPowerId;
  const trainedPower = powerId
    ? (typeof progressionPowerById === 'function'
        ? progressionPowerById(powerId)
        : ((DATA.classPowers || []).find(p => p.id === powerId) || (DATA.generalPowers || []).find(p => p.id === powerId)))
    : null;
  const trainedPowerName = trainedPower ? trainedPower.nome : (powerId || '');

  let trainingSubtitle = 'Você não iniciou nenhum treinamento!';
  if (info.completedCount === 1) {
    trainingSubtitle = 'Você concluiu um treinamento!';
  } else if (info.completedCount === 2) {
    trainingSubtitle = 'Você concluiu dois treinamentos!';
  } else if (info.completedCount === 3) {
    trainingSubtitle = 'Você concluiu três treinamentos!';
  } else if (info.completedCount === 4) {
    trainingSubtitle = 'Você concluiu todos os treinamentos.';
  }

  const completedBadgeHtml = '<span style="display:inline-flex;align-items:center;justify-content:center;padding:4px 12px;background:transparent;border:1px solid rgba(217,168,78,0.45);color:#f0d28c;font-size:0.76rem;font-weight:600;border-radius:4px;letter-spacing:0.3px;white-space:nowrap">Concluído</span>';

  return '<div id="sheetLevelTrainingModal" class="forja-modal-backdrop" style="display:none;position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:100000;align-items:center;justify-content:center;background:rgba(5,7,11,0.88);backdrop-filter:blur(6px);padding:16px;box-sizing:border-box">' +
    '<div class="forja-rest-card" role="dialog" aria-modal="true" style="max-width:560px;width:95%;background:#111620;border:1px solid #263346;border-radius:8px;padding:14px 18px;box-shadow:0 20px 50px rgba(0,0,0,0.85);color:#f8fafc;box-sizing:border-box">' +
      '<div class="rest-card-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;border-bottom:1px solid #1e293b;padding-bottom:8px">' +
        '<div>' +
          '<h3 class="rest-card-title" style="margin:0;font-size:1.05rem;color:#f0d28c;font-family:\'Cinzel\',serif;letter-spacing:0.5px">TREINAMENTO DE NÍVEL (NV. ' + info.currentLevel + ' → NV. ' + info.nextLevel + ')</h3>' +
          '<small style="color:#94a3b8;font-size:0.75rem">' + esc(trainingSubtitle) + '</small>' +
        '</div>' +
        '<button type="button" class="rest-close-x" data-vital-action="close-level-training" aria-label="Fechar" style="background:transparent;border:1px solid #334155;color:#94a3b8;width:28px;height:28px;display:grid;place-items:center;padding:0;border-radius:4px;cursor:pointer;font-size:1.1rem;line-height:1">×</button>' +
      '</div>' +
      '<div class="rest-card-body" style="padding:0;display:flex;flex-direction:column;gap:8px">' +
        '<div style="background:#0d121a;border:1px solid #1e293b;border-radius:6px;padding:8px 12px;display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">' +
          '<label for="levelTrainingClassSelect" style="font-size:0.8rem;color:#cbd5e1;font-weight:600">Classe do Nível ' + info.nextLevel + ' (Multiclasse / Progressão):</label>' +
          '<select id="levelTrainingClassSelect" class="select" ' + (info.completedCount > 0 ? 'disabled style="min-width:180px;height:30px;font-size:0.8rem;opacity:0.6;cursor:not-allowed"' : 'style="min-width:180px;height:30px;font-size:0.8rem"') + '>' +
            classesList.map(c => '<option value="' + esc(c.id) + '" ' + (c.id === info.nextClassId ? 'selected' : '') + '>' + esc(c.nome) + '</option>').join('') +
          '</select>' +
          (info.completedCount > 0 ? '<small style="width:100%;color:#94a3b8;font-size:0.7rem;margin-top:1px">A classe só pode ser alterada enquanto nenhum treino tiver sido realizado.</small>' : '') +
        '</div>' +
        '<!-- 1. Treino de Poder de Classe -->' +
        '<div style="background:#0d121a;border:1px solid #1e293b;border-radius:6px;padding:8px 12px;display:flex;align-items:center;justify-content:space-between;gap:12px">' +
          '<div>' +
            '<strong style="color:#f8fafc;font-size:0.86rem">1. Treino de Poder de Classe (' + esc(info.cls?.nome || '') + ')</strong>' +
            '<p style="margin:2px 0 0 0;font-size:0.75rem;color:#94a3b8">' +
              (t.power && trainedPowerName
                ? 'Poder da classe: <strong style="color:#f0d28c">' + esc(trainedPowerName) + '</strong>.'
                : 'Escolha um poder na tela de progressão com base em ' + esc(info.cls?.nome || 'sua classe') + ' ou selecione poderes gerais normalmente permitidos.') +
            '</p>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:6px">' +
            (t.power
              ? completedBadgeHtml
              : '<button type="button" class="button small primary" data-vital-action="go-to-training-power-progression" style="min-width:115px;white-space:nowrap">Escolher Poder</button>'
            ) +
          '</div>' +
        '</div>' +
        '<!-- 2. Treino de PV -->' +
        '<div style="background:#0d121a;border:1px solid #1e293b;border-radius:6px;padding:8px 12px;display:flex;align-items:center;justify-content:space-between;gap:12px">' +
          '<div>' +
            '<strong style="color:#f8fafc;font-size:0.86rem">2. Treino de Pontos de Vida (PV)</strong>' +
            '<p style="margin:2px 0 0 0;font-size:0.75rem;color:#94a3b8">Recebe ' + info.pvBase + ' PV da classe + CON. Você recebe ' + info.pvGain + ' PV permanentes.</p>' +
          '</div>' +
          (t.pv
            ? completedBadgeHtml
            : '<button type="button" class="button small" data-vital-action="toggle-training-pv" style="min-width:105px;white-space:nowrap">Treinar PV</button>'
          ) +
        '</div>' +
        '<!-- 3. Treino de PM -->' +
        '<div style="background:#0d121a;border:1px solid #1e293b;border-radius:6px;padding:8px 12px;display:flex;align-items:center;justify-content:space-between;gap:12px">' +
          '<div>' +
            '<strong style="color:#f8fafc;font-size:0.86rem">3. Treino de Pontos de Mana (PM)</strong>' +
            '<p style="margin:2px 0 0 0;font-size:0.75rem;color:#94a3b8">Recebe ' + info.pmGain + ' PM permanentes.</p>' +
          '</div>' +
          (t.pm
            ? completedBadgeHtml
            : '<button type="button" class="button small" data-vital-action="toggle-training-pm" style="min-width:105px;white-space:nowrap">Treinar PM</button>'
          ) +
        '</div>' +
        '<!-- 4. Treino de Perícias -->' +
        '<div style="background:#0d121a;border:1px solid #1e293b;border-radius:6px;padding:8px 12px;display:flex;align-items:center;justify-content:space-between;gap:12px">' +
          '<div>' +
            '<strong style="color:#f8fafc;font-size:0.86rem">4. Treino de Perícias</strong>' +
            '<p style="margin:2px 0 0 0;font-size:0.75rem;color:#94a3b8">' +
              (info.isOddLevel
                ? 'Você está no nível ' + info.currentLevel + ' (ímpar, indo para nível par). Concede +1 em todas as perícias (substituído pela metade do nível ao subir).'
                : 'Você está no nível ' + info.currentLevel + ' (par, indo para nível ímpar). Não concede bônus numérico extra, contabilizando 1 treino concluído para o nível ' + info.nextLevel + '.') +
            '</p>' +
          '</div>' +
          (t.skills
            ? completedBadgeHtml
            : '<button type="button" class="button small" data-vital-action="toggle-training-skills" style="min-width:105px;white-space:nowrap">Treinar Perícias</button>'
          ) +
        '</div>' +
      '</div>' +
      (info.completedCount > 0
        ? '<div class="rest-card-footer" style="display:flex;justify-content:flex-end;align-items:center;gap:8px;border-top:1px solid #1e293b;padding-top:10px;margin-top:10px">' +
            '<button type="button" class="button small" data-vital-action="revert-all-level-training" style="padding:6px 12px;background:#350d0d;border:1px solid #7f1d1d;color:#fca5a5;font-weight:600;border-radius:5px;cursor:pointer" title="Reverter todos os treinos adiantados deste nível">Reverter Treino</button>' +
            (info.completedCount === 4 ? '<button type="button" class="button primary" data-vital-action="complete-level-training-up" style="padding:6px 16px;font-weight:700;border-radius:5px;cursor:pointer">Efetivar Nível ' + info.nextLevel + ' (4/4)</button>' : '') +
          '</div>'
        : '') +
    '</div>' +
  '</div>';
}

function renderRevertLevelModalHtml(){
  const currentLevel = Number(state?.identity?.plannedLevel) || (state?.progression?.length || 1);
  return '<div id="sheetRevertLevelModal" class="forja-modal-backdrop" style="display:none;position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:100000;align-items:center;justify-content:center;background:rgba(5,7,11,0.88);backdrop-filter:blur(6px);padding:16px;box-sizing:border-box">' +
    '<div class="forja-rest-card" role="dialog" aria-modal="true" style="max-width:440px;width:95%;background:#111620;border:1px solid #7f1d1d;border-radius:8px;padding:20px;box-shadow:0 20px 50px rgba(0,0,0,0.85);color:#f8fafc;box-sizing:border-box">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;border-bottom:1px solid #1e293b;padding-bottom:10px">' +
        '<h3 style="margin:0;font-size:1.1rem;color:#fca5a5;font-family:\'Cinzel\',serif;letter-spacing:0.5px">REVERTER NÍVEL</h3>' +
        '<button type="button" data-vital-action="close-revert-level-modal" style="background:transparent;border:1px solid #334155;color:#94a3b8;width:30px;height:30px;display:grid;place-items:center;padding:0;border-radius:4px;cursor:pointer;font-size:1.2rem;line-height:1">×</button>' +
      '</div>' +
      '<p style="margin:10px 0;font-size:0.86rem;line-height:1.5;color:#e2e8f0">' +
        'Deseja reverter o <strong>Nível ' + currentLevel + '</strong> para o <strong>Nível ' + (currentLevel - 1) + '</strong>?' +
      '</p>' +
      '<p style="margin:10px 0;font-size:0.78rem;line-height:1.4;color:#94a3b8">' +
        'O poder, PV, PM e demais escolhas associadas ao nível ' + currentLevel + ' serão removidos da ficha.' +
      '</p>' +
      '<div style="display:flex;justify-content:flex-end;gap:10px;margin-top:18px;border-top:1px solid #1e293b;padding-top:12px">' +
        '<button type="button" data-vital-action="close-revert-level-modal" style="padding:8px 16px;background:transparent;border:1px solid #334155;color:#94a3b8;font-weight:600;border-radius:6px;cursor:pointer">Cancelar</button>' +
        '<button type="button" data-vital-action="confirm-revert-level" style="padding:8px 16px;background:#991b1b;border:1px solid #ef4444;color:#ffffff;font-weight:700;border-radius:6px;cursor:pointer">Confirmar Reversão</button>' +
      '</div>' +
    '</div>' +
  '</div>';
}

function refreshAfterLevelTrainingChange(prevStats){
  const nextStats = progressionStats();
  state.vitals = state.vitals || {};
  const pvDelta = (nextStats.pv || 0) - (prevStats?.pv || nextStats.pv || 0);
  const pmDelta = (nextStats.pm || 0) - (prevStats?.pm || nextStats.pm || 0);
  state.vitals.pvMax = nextStats.pv;
  state.vitals.pmMax = nextStats.pm;
  if(pvDelta !== 0){
    state.vitals.pv = Math.min(state.vitals.pvMax + (state.vitals.pvTempMax || 0), Math.max(0, (Number(state.vitals.pv) || 0) + pvDelta));
  }
  if(pmDelta !== 0){
    state.vitals.pm = Math.min(state.vitals.pmMax + (state.vitals.pmTempMax || 0), Math.max(0, (Number(state.vitals.pm) || 0) + pmDelta));
  }
  if(typeof _passivesCacheResult !== 'undefined') _passivesCacheResult = null;
  if(typeof saveSheetVitals === 'function') saveSheetVitals();
  const wasOpen = document.getElementById('sheetLevelTrainingModal')?.style?.display === 'flex';
  if(typeof renderStage === 'function') renderStage();
  if(wasOpen){
    const m = document.getElementById('sheetLevelTrainingModal');
    if(m) m.style.display = 'flex';
  }
}

document.addEventListener('click', event => {
  const modal = document.getElementById('sheetLevelTrainingModal');
  if(modal && event.target === modal){
    modal.style.display = 'none';
    return;
  }
  const revertModal = document.getElementById('sheetRevertLevelModal');
  if(revertModal && event.target === revertModal){
    revertModal.style.display = 'none';
    return;
  }
  const btn = event.target.closest?.('[data-vital-action]');
  const action = btn?.dataset?.vitalAction;
  if(!action) return;
  if(action === 'open-revert-level'){
    const m = document.getElementById('sheetRevertLevelModal');
    if(m) m.style.display = 'flex';
    return;
  }
  if(action === 'close-revert-level-modal'){
    const m = document.getElementById('sheetRevertLevelModal');
    if(m) m.style.display = 'none';
    return;
  }
  if(action === 'confirm-revert-level'){
    const m = document.getElementById('sheetRevertLevelModal');
    if(m) m.style.display = 'none';
    const currentLvl = Number(state.identity?.plannedLevel) || (state.progression?.length || 1);
    if(currentLvl <= 1){
      const notify = typeof toast === 'function' ? toast : alert;
      notify('O personagem já está no nível 1.', 'warning');
      return;
    }
    const removedLevel = currentLvl;
    state.identity.plannedLevel = currentLvl - 1;
    if(Array.isArray(state.progression) && state.progression.length > 1){
      state.progression.pop();
    }
    const currentSamuraiLevel = (state.progression || []).filter(row => row.classId === 'samurai').length;
    [4, 6, 8, 10, 12, 14].forEach(lvl => {
      if(lvl > currentSamuraiLevel && state.samuraiKatana?.[lvl]) delete state.samuraiKatana[lvl];
    });
    if(typeof syncSamuraiKatanaToBackpack === 'function') syncSamuraiKatanaToBackpack();
    if(typeof spellPlan === 'function' && typeof spellState === 'function'){
      const validSpellGroups = new Set(spellPlan().groups.map(group => group.id)), saved = spellState();
      for(const id of Object.keys(saved.selections || {})){
        if(!validSpellGroups.has(id)) delete saved.selections[id];
      }
    }
    const nextStats = progressionStats();
    state.vitals = state.vitals || {};
    state.vitals.pvMax = nextStats.pv;
    state.vitals.pmMax = nextStats.pm;
    state.vitals.pv = Math.min(state.vitals.pvMax + (state.vitals.pvTempMax || 0), Math.max(0, state.vitals.pv || 0));
    state.vitals.pm = Math.min(state.vitals.pmMax + (state.vitals.pmTempMax || 0), Math.max(0, state.vitals.pm || 0));
    if(typeof _passivesCacheResult !== 'undefined') _passivesCacheResult = null;
    if(typeof saveSheetVitals === 'function') saveSheetVitals();
    if(typeof persistNow === 'function') persistNow();
    if(typeof persistNavigationNow === 'function') persistNavigationNow();
    if(typeof renderStage === 'function') renderStage();
    const notify = typeof toast === 'function' ? toast : alert;
    notify('Nível ' + removedLevel + ' revertido para o Nível ' + (removedLevel - 1) + ' com sucesso!', 'info');
    return;
  }
  if(action === 'revert-all-level-training'){
    const prev = progressionStats();
    const t = getLevelTrainingState();
    t.pv = false;
    t.pm = false;
    t.skills = false;
    t.power = false;
    t.selectedPowerId = '';
    t.nextPowerId = '';
    t.selectedPowerChoice = '';
    t.nextPowerChoice = '';
    refreshAfterLevelTrainingChange(prev);
    const notify = typeof showToast === 'function' ? showToast : (typeof toast === 'function' ? toast : alert);
    notify('Treinos de adiantamento revertidos com sucesso!', 'info');
    return;
  }
  if(action === 'open-level-training'){
    const m = document.getElementById('sheetLevelTrainingModal');
    if(m) m.style.display = 'flex';
    return;
  }
  if(action === 'close-level-training'){
    const m = document.getElementById('sheetLevelTrainingModal');
    if(m) m.style.display = 'none';
    return;
  }
  if(action === 'toggle-training-pv'){
    const prev = progressionStats();
    const t = getLevelTrainingState();
    t.pv = !t.pv;
    refreshAfterLevelTrainingChange(prev);
    return;
  }
  if(action === 'toggle-training-pm'){
    const prev = progressionStats();
    const t = getLevelTrainingState();
    t.pm = !t.pm;
    refreshAfterLevelTrainingChange(prev);
    return;
  }
  if(action === 'toggle-training-skills'){
    const prev = progressionStats();
    const t = getLevelTrainingState();
    t.skills = !t.skills;
    refreshAfterLevelTrainingChange(prev);
    return;
  }
  if(action === 'toggle-training-power'){
    const prev = progressionStats();
    const t = getLevelTrainingState();
    if(t.power){
      t.power = false;
      t.selectedPowerId = '';
      t.nextPowerId = '';
      t.selectedPowerChoice = '';
      t.nextPowerChoice = '';
      refreshAfterLevelTrainingChange(prev);
      const notify = typeof showToast === 'function' ? showToast : (typeof toast === 'function' ? toast : alert);
      notify('Treino de poder desmarcado.');
      return;
    }
    const m = document.getElementById('sheetLevelTrainingModal');
    if(m) m.style.display = 'none';
    const fakeBtn = document.createElement('button');
    fakeBtn.dataset.vitalAction = 'go-to-training-power-progression';
    document.body.appendChild(fakeBtn);
    fakeBtn.click();
    fakeBtn.remove();
    return;
  }
  if(action === 'go-to-training-power-progression'){
    const m = document.getElementById('sheetLevelTrainingModal');
    if(m) m.style.display = 'none';

    const t = getLevelTrainingState();
    const info = getLevelTrainingPreviewStats();
    const targetClassId = info.nextClassId || state.progression?.at(-1)?.classId || state.identity?.classId || 'guerreiro';
    const currentLevel = Number(state.identity?.plannedLevel) || 1;
    const targetLevel = Math.min(20, currentLevel + 1);

    state.trainingPowerBefore = JSON.parse(JSON.stringify(state));
    state.isTrainingPowerProgression = true;
    state.isEditingFinishedSheet = true;

    if (!Array.isArray(state.progression)) state.progression = [];
    if (state.progression.length < targetLevel) {
      state.progression.push({
        classId: targetClassId,
        powerId: t.selectedPowerId || t.nextPowerId || '',
        powerChoice: t.selectedPowerChoice || t.nextPowerChoice || ''
      });
      state.identity.plannedLevel = targetLevel;
    } else {
      state.progression[targetLevel - 1].classId = targetClassId;
      if (t.selectedPowerId || t.nextPowerId) {
        state.progression[targetLevel - 1].powerId = t.selectedPowerId || t.nextPowerId || '';
        state.progression[targetLevel - 1].powerChoice = t.selectedPowerChoice || t.nextPowerChoice || '';
      }
    }

    setProgressionEditingIndex(targetLevel - 1);
    state.progressionCollapsedIndex = -1;
    state.step = 10;
    state.finished = false;
    state.sheetView = '';
    persistNow();

    if (typeof window !== 'undefined' && window.location?.pathname && (window.location.pathname.endsWith('/ficha.html') || window.location.pathname.endsWith('ficha.html'))) {
      window.location.href = 'criador.html';
      return;
    }

    if (typeof renderStage === 'function') renderStage();
    setTimeout(() => {
      document.querySelector('.progression-level-row:last-child')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const notify = typeof toast === 'function' ? toast : (typeof showToast === 'function' ? showToast : alert);
      notify('Selecione um poder de ' + (info.cls?.nome || 'classe') + ' ou poder geral para o treino.');
    }, 40);
    return;
  }
  if(action === 'complete-level-training-up'){
    const m = document.getElementById('sheetLevelTrainingModal');
    if(m) m.style.display = 'none';
    openLevelClassModal();
    return;
  }
});

document.addEventListener('change', event => {
  if(event.target?.id === 'levelTrainingClassSelect'){
    const info = getLevelTrainingPreviewStats();
    if(info.completedCount > 0){
      return;
    }
    const prev = progressionStats();
    const t = getLevelTrainingState();
    t.nextClassId = event.target.value;
    refreshAfterLevelTrainingChange(prev);
    return;
  }
});

function proceedToLevelUpWithClass(classId: string){
  if(!classId) return;
  const trainedPowerId = (state.levelTraining?.power && state.levelTraining?.selectedPowerId) ? state.levelTraining.selectedPowerId : '';
  state.levelTraining = { pv: false, pm: false, skills: false, power: false, nextClassId: '', selectedPowerId: '', selectedPowerChoice: '' };
  state.identity.plannedLevel = Math.min(20, (Number(state.identity?.plannedLevel) || 1) + 1);
  state.progression.push({ classId, powerId: trainedPowerId });
  setProgressionEditingIndex(state.progression.length - 1);
  state.progressionCollapsedIndex = -1;
  const modal = document.getElementById('levelClassModal');
  if(modal) modal.hidden = true;
  if(state.isLevelingUp){
    state.finished = false;
    state.isEditingFinishedSheet = false;
    state.step = 10;
    state.sheetView = '';
    persistNow();
    if(typeof window !== 'undefined' && window.location?.pathname?.endsWith('/ficha.html')){
      window.location.href = 'criador.html';
      return;
    }
  }
  renderStage();
  const racial = progressionRaceOptions(state.progression.length - 1).length;
  setTimeout(() => {
    document.querySelector('.progression-level-row:last-child')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    toast(racial ? 'Escolha um poder de sua classe, um poder geral ou um poder de raça para o novo nível.' : 'Escolha um poder de sua classe ou um poder geral para o novo nível.');
  }, 40);
}

function ensureLevelClassModal(){
  let modal=document.getElementById('levelClassModal');if(modal)return modal;
  modal=document.createElement('div');modal.id='levelClassModal';modal.className='modal-backdrop';modal.hidden=true;
  modal.innerHTML='<section class="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="levelClassTitle"><header><h3 id="levelClassTitle">Classe do novo nível</h3></header><div class="confirm-modal-body"><p>Escolha a classe que o personagem receberá neste nível. A classe anterior já vem selecionada.</p><label class="field"><span>Classe</span><select class="select" id="levelClassSelect"></select></label></div><footer><button class="button" id="levelClassCancel" type="button">Cancelar</button><button class="button primary" id="levelClassConfirm" type="button">Confirmar nível</button></footer></section>';
  document.body.appendChild(modal);
  modal.querySelector('#levelClassCancel').onclick=()=>{
    modal.hidden=true;
    state.isLevelingUp=false;
    delete state.levelUpBefore;
    persistNow();
  };
  modal.addEventListener('click',event=>{
    if(event.target===modal){
      modal.hidden=true;
      state.isLevelingUp=false;
      delete state.levelUpBefore;
      persistNow();
    }
  });
  modal.querySelector('#levelClassConfirm').onclick=()=>{
    const classId=modal.querySelector('#levelClassSelect').value;
    if(!classId)return;
    proceedToLevelUpWithClass(classId);
  };
  return modal;
}
function cancelLevelUp(){
  if(state.isLevelingUp){
    const checkpoint=state.levelUpBefore;
    if(checkpoint){state=checkpoint;normalizeState()}else{
    if(state.progression&&state.progression.length>1){
      const removedLevel=Number(state.identity?.plannedLevel)||state.progression.length;
      state.progression.pop();
      state.identity.plannedLevel=Math.max(1,removedLevel-1);
      const currentSamuraiLevel=(state.progression||[]).filter(row=>row.classId==='samurai').length;
      [4,6,8,10,12,14].forEach(lvl=>{
        if(lvl>currentSamuraiLevel&&state.samuraiKatana?.[lvl])delete state.samuraiKatana[lvl];
      });
      if(typeof syncSamuraiKatanaToBackpack==='function')syncSamuraiKatanaToBackpack();
      if(typeof spellPlan==='function'&&typeof spellState==='function'){
        const validSpellGroups=new Set(spellPlan().groups.map(group=>group.id)),saved=spellState();
        for(const id of Object.keys(saved.selections||{})){
          if(!validSpellGroups.has(id))delete saved.selections[id];
        }
      }
    }
    }
    state.isLevelingUp=false;
    delete state.levelUpBefore;
    delete state.editingCharacter;
    state.finished=true;
    state.isEditingFinishedSheet=false;
    state.sheetView='sheet';
    state.step=10;
    persistNow();
    if(typeof saveFinishedCharacter==='function')saveFinishedCharacter();
    if(typeof window!=='undefined'&&window.location?.pathname?.endsWith('/criador.html')){
      window.location.href='ficha.html';
      return;
    }
    if(typeof renderStage==='function')renderStage();
    if(typeof toast==='function')toast('Subida de nível cancelada. Nível anterior restaurado.');
  }
}
document.addEventListener('click',event=>{
  if(event.target.closest?.('#cancelLevelUpButton')||event.target.closest?.('[data-action="cancel-level-up"]')){
    event.preventDefault();
    event.stopImmediatePropagation();
    cancelLevelUp();
    return;
  }
  if(event.target.closest?.('#cancelTrainingPowerButton')||event.target.closest?.('[data-action="cancel-training-power"]')){
    event.preventDefault();
    event.stopImmediatePropagation();
    cancelTrainingPower();
    return;
  }
});
function cancelTrainingPower(){
  if(state.isTrainingPowerProgression){
    const checkpoint=state.trainingPowerBefore;
    if(checkpoint){
      state=checkpoint;
      if(typeof normalizeState==='function') normalizeState();
    }else{
      const currentLevel=Number(state.identity?.plannedLevel)||1;
      const originalLevel=Math.max(1,currentLevel-1);
      if(state.progression&&state.progression.length>originalLevel){
        state.progression=state.progression.slice(0,originalLevel);
      }
      state.identity.plannedLevel=originalLevel;
    }
    delete state.isTrainingPowerProgression;
    delete state.trainingPowerBefore;
    state.isEditingFinishedSheet=false;
    state.finished=true;
    state.sheetView='sheet';
    persistNow();
    if(typeof saveFinishedCharacter==='function')saveFinishedCharacter();
    if(typeof window!=='undefined'&&window.location?.pathname&&(window.location.pathname.endsWith('/criador.html')||window.location.pathname.endsWith('criador.html'))){
      window.location.href='ficha.html';
      return;
    }
    if(typeof renderStage==='function')renderStage();
    if(typeof toast==='function')toast('Treino de poder cancelado.');
  }
}
if(typeof window!=='undefined')window.cancelTrainingPower=cancelTrainingPower;
function openLevelClassModal(){
  const t = getLevelTrainingState();
  const completedCount = [t.pv, t.pm, t.skills, t.power].filter(Boolean).length;
  if(completedCount > 0){
    const chosenClass = t.nextClassId || state.progression.at(-1)?.classId || state.identity.classId;
    proceedToLevelUpWithClass(chosenClass);
    return;
  }
  const modal=ensureLevelClassModal(),select=modal.querySelector('#levelClassSelect'),suggested=state.levelTraining?.nextClassId||state.progression.at(-1)?.classId||state.identity.classId;
  select.innerHTML=DATA.classes.map(cls=>'<option value="'+cls.id+'" '+(cls.id===suggested?'selected':'')+'>'+esc(cls.nome)+'</option>').join('');
  modal.hidden=false;
  setTimeout(()=>select.focus(),20);
}
(()=>{const style=document.createElement('style');style.textContent='.progression-level-row{transition:opacity .24s,transform .24s,border-color .2s,background .2s}.progression-level-row.active{border-color:#d9a84e77;background:#d9a84e05}.progression-level-row.is-leaving{opacity:0;transform:translateY(-14px) scale(.985)}.progression-level-row.is-arriving{animation:progressionArrive .32s ease-out}@keyframes progressionArrive{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}.progression-level-summary{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:7px}.progression-level-summary>strong{padding:3px 7px;border-radius:5px;background:#d9a84e10;color:#e8cb83;font-size:.64rem}.progression-expand{margin-left:auto;padding:5px 8px;border:1px solid var(--border);border-radius:6px;background:#151c28;color:var(--muted);font-size:.62rem;cursor:pointer}.progression-ability-details{margin-top:8px;border-top:1px solid var(--border);padding-top:7px}.progression-ability-details summary{color:var(--muted);font-size:.64rem;cursor:pointer}.progression-ability-details .ability-list{margin-top:8px}.progression-source-filters{margin-top:12px}.progression-attribute-calculator{display:grid;grid-template-columns:repeat(2,minmax(260px,1fr));gap:10px;margin-top:11px}.progression-attribute-column{display:grid;gap:7px;align-content:start}.progression-attribute-head,.progression-attribute-row{display:grid;grid-template-columns:minmax(110px,1fr) 120px;gap:8px;align-items:center}.progression-attribute-head{padding:0 10px;color:var(--dim);font-size:.55rem;font-weight:800;text-align:center;text-transform:uppercase}.progression-attribute-row{min-height:55px;padding:7px 10px;border:1px solid var(--border);border-radius:8px;background:#0d121a}.progression-attribute-row>strong{text-align:center;color:var(--gold2);font:700 .72rem Cinzel}.progression-attribute-row.active{border-color:#d9a84e;box-shadow:inset 3px 0 var(--gold)}.progression-total-control{display:grid;grid-template-columns:32px 52px 32px;justify-content:center}.progression-total-control button{border:1px solid var(--border);background:#171e2a;color:var(--text);font-size:1rem;cursor:pointer}.progression-total-control button:first-child{border-radius:6px 0 0 6px}.progression-total-control button:last-child{border-radius:0 6px 6px 0}.progression-total-control button:disabled{opacity:.25;cursor:default}.progression-total-control output{display:grid;place-items:center;min-height:42px;border-block:1px solid var(--border);font-size:1rem;font-weight:800}.racial-power-heading{margin-top:12px;color:#9fd4f2!important}.racial-power-list .power-row{border-left-color:#5ba9d8}.progression-special-grant-box{margin-top:9px;padding:9px 12px;border:1px solid var(--border);border-radius:8px;background:#141b26}.progression-special-grant-box.is-complete{border-color:#45c58b66;background:#45c58b0f}.progression-special-grant-box.is-pending{border-color:#d9a84e66;background:#d9a84e0f}@media(max-width:700px){.progression-attribute-calculator{grid-template-columns:1fr}.progression-attribute-head,.progression-attribute-row{grid-template-columns:minmax(90px,1fr) 116px}.progression-expand{width:100%;margin-left:0}}';document.head?.appendChild(style)})();
(()=>{const style=document.createElement('style');style.textContent='.sheet-preview-alignment-age{display:grid;grid-template-columns:1.75fr 1fr;gap:12px;align-items:center}.sheet-preview{display:grid;gap:12px}.sheet-preview-identity{display:grid;grid-template-columns:1.3fr 1.1fr repeat(4,1fr);gap:1px;border:1px solid var(--border);border-radius:9px;overflow:hidden;background:var(--border);width:100%;box-sizing:border-box;margin-bottom:2px}.sheet-preview-identity>*{min-width:0;padding:12px 16px;background:#111824;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sheet-preview-identity strong{color:var(--gold2);font-family:Cinzel,serif;font-size:1rem;display:block;margin-top:3px}.sheet-preview-identity small{color:#94a3b8;font-size:0.72rem;letter-spacing:0.6px;text-transform:uppercase;display:block}.sheet-preview-identity span{color:var(--muted);font-size:0.72rem;letter-spacing:0.5px}.sheet-attributes-block{position:relative;margin-top:10px;margin-bottom:12px}.sheet-attr-top-bar,.sheet-attr-bottom-bar{display:flex;align-items:center;justify-content:flex-start;margin-top:8px;padding-left:2px}.sheet-attr-edit-toggle-btn{background:#111824;border:1px solid #334155;color:#94a3b8;font-size:0.65rem;padding:3px 8px;border-radius:4px;cursor:pointer;display:inline-flex;align-items:center;gap:5px;transition:all 0.15s ease;line-height:1}.sheet-attr-edit-toggle-btn:hover{background:#1e293b;color:#f8fafc;border-color:#d9a84e}.sheet-attr-edit-toggle-btn.active{background:rgba(217,168,78,0.15);color:#e8cb83;border-color:#d9a84e}.sheet-preview-attributes{display:grid;grid-template-columns:repeat(6,minmax(0,1fr))!important;gap:8px;padding:0;width:100%;box-sizing:border-box}.sheet-preview-attributes .sheet-attr-card{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:64px;border:1px solid var(--border);border-radius:8px;background:#111824;position:relative;padding:6px 4px;box-sizing:border-box;transition:min-height 0.2s ease,border-color 0.15s ease}.sheet-attr-main-content{display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%}.sheet-attr-main-content small{color:var(--dim,#94a3b8);font-size:0.58rem;text-transform:uppercase;font-weight:700;letter-spacing:0.5px}.sheet-attr-main-content strong{color:var(--gold2,#f59e0b);font-size:1.25rem;line-height:1.2}.sheet-attr-stepper-btn{display:none;align-items:center;justify-content:center;width:100%;max-width:54px;height:20px;border-radius:4px;border:1px solid rgba(217,168,78,0.35);background:rgba(217,168,78,0.12);color:#e8cb83;font-size:0.85rem;font-weight:700;cursor:pointer;line-height:1;padding:0;margin:0;transition:all 0.15s ease;user-select:none}.sheet-attr-stepper-btn:hover{background:#d9a84e;color:#0b0f17;border-color:#d9a84e}.sheet-attr-stepper-btn.btn-attr-down{border-color:rgba(239,68,68,0.35);background:rgba(239,68,68,0.12);color:#fca5a5}.sheet-attr-stepper-btn.btn-attr-down:hover{background:#dc2626;color:#ffffff;border-color:#ef4444}.steppers-active .sheet-attr-stepper-btn{display:flex}.steppers-active .sheet-attr-card{min-height:98px;justify-content:space-between;border-color:rgba(217,168,78,0.4)}.sheet-vitals-conditions-wrap{margin-top:14px;border-top:1px solid rgba(255,255,255,0.08);padding-top:10px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}.sheet-vitals-conditions-left{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.sheet-vitals-actions-row{display:flex;align-items:center;gap:8px;margin-left:auto}.sheet-action-icon-btn{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;min-width:32px;min-height:32px;border-radius:6px;background:#151c28;border:1px solid #28364b;color:#94a3b8;cursor:pointer;transition:all 0.2s ease;padding:0;line-height:1}.sheet-action-icon-btn:hover{background:#1e2a3c;border-color:#60a5fa;color:#f8fafc;transform:translateY(-1px)}.sheet-action-icon-btn.sheet-level-up-btn{background:rgba(220,38,38,0.18);border-color:#ef4444;color:#fca5a5}.sheet-action-icon-btn.sheet-level-up-btn:hover{background:rgba(220,38,38,0.38);border-color:#f87171;color:#ffffff}.sheet-action-icon-btn.sheet-distinction-btn{background:rgba(217,168,78,0.18);border-color:#d9a84e;color:#e8cb83;text-decoration:none}.sheet-action-icon-btn.sheet-distinction-btn:hover{background:rgba(217,168,78,0.38);border-color:#f5d78e;color:#ffffff}.sheet-action-icon-btn.is-disabled,.sheet-action-icon-btn:disabled{opacity:0.35;cursor:not-allowed;pointer-events:none}.sheet-action-icon-btn svg,.sheet-action-icon-btn .forja-svg{width:16px;height:16px}.sheet-vitals-conditions-wrap .sheet-conditions-line{background:transparent;border:none;padding:0}.sheet-preview-middle{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(330px,.75fr);gap:12px;align-items:start}.sheet-preview-main,.sheet-preview-lower{display:grid;gap:12px}.sheet-preview-lower{grid-template-columns:minmax(280px,1.15fr) 0.85fr}.sheet-preview-box{border:1px solid var(--border);border-radius:9px;background:#0d121a;overflow:hidden}.sheet-preview-box>h3{padding:9px 11px;border-bottom:1px solid var(--border);color:var(--gold2);font:700 .72rem Cinzel;text-transform:uppercase}.sheet-preview-box>p,.sheet-preview-box>.tag-row{margin:10px}.sheet-preview-table-wrap{overflow:auto}.sheet-preview-table{width:100%;border-collapse:collapse;font-size:.63rem}.sheet-preview-table th,.sheet-preview-table td{padding:7px 8px;border-bottom:1px solid #293446;text-align:left;white-space:nowrap}.sheet-preview-table td{color:var(--muted)}.sheet-preview-table tr.trained td{color:var(--text);background:transparent}.sheet-preview-table tr.attr-band-a td{background:rgba(255,255,255,0.018)}.sheet-preview-table tr.attr-band-b td{background:rgba(0,0,0,0.22)}.sheet-preview-table .skill-total{color:var(--gold2);font-weight:800;text-align:center}.sheet-preview-table.defense-equipment td strong{color:var(--gold2)}.sheet-preview-table.defense-equipment td{padding:6px 8px;font-size:.62rem}.sheet-preview-skills{position:sticky;top:118px;margin-top:0}.sheet-preview-skills .sheet-preview-table-wrap{max-height:670px}.sheet-preview-skills .sheet-preview-table,.sheet-preview-skills .sheet-preview-table th,.sheet-preview-skills .sheet-preview-table td,.sheet-preview-skills .sheet-preview-table tr td,.sheet-preview-skills .sheet-preview-table tr.trained td,.sheet-preview-skills .sheet-preview-table .skill-total,.sheet-preview-skills .sheet-preview-table .skill-name,.sheet-preview-skills .sheet-preview-table .skill-attr,.sheet-preview-skills .sheet-preview-table .skill-train,.sheet-preview-skills .sheet-preview-table .skill-bonus{font-family:system-ui,-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif!important;font-variant-numeric:tabular-nums lining-nums;color:#ffffff!important}.sheet-preview-skills .sheet-preview-table th{color:#ffffff!important;font-size:.72rem!important;font-weight:700!important;letter-spacing:.4px;border-bottom:1px solid #334155!important}.sheet-preview-skills .sheet-preview-table td{color:#ffffff!important;font-size:.72rem!important;border-bottom:1px solid #1f2937!important}.sheet-preview-skills .sheet-preview-table .skill-total{color:#ffffff!important;font-weight:700!important;font-size:.8rem!important;text-align:center!important}.sheet-preview-skills .sheet-preview-table tr.trained td{color:#ffffff!important;font-weight:600!important}.sheet-preview-skills .skill-untrained-x{font-family:\"Comic Sans MS\",\"Comic Sans\",cursive,sans-serif!important;font-weight:700!important;font-size:.95rem!important;color:#ffffff!important;line-height:1!important;display:inline-block!important;text-align:center!important}.sheet-preview-skills .skill-star-icon{display:inline-flex!important;align-items:center!important;justify-content:center!important;vertical-align:middle!important;line-height:1!important;color:#ffffff!important}.sheet-preview-skills .skill-star-icon .skill-star-svg{width:14px!important;height:14px!important;display:block!important}.sheet-preview-skills .skill-star-icon.filled{color:#ffffff!important;opacity:1!important}.sheet-preview-skills .skill-star-icon.unfilled{color:#ffffff!important;opacity:.55!important}.sheet-preview-empty{text-align:center!important;color:var(--dim)!important}.sheet-defense-value{display:flex;align-items:center;gap:10px;padding:12px}.sheet-defense-value strong{font-size:2.2rem;color:var(--gold2)}.sheet-defense-value span{color:var(--muted);font-size:.62rem}.sheet-preview-equipment{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1px;background:var(--border)}.sheet-preview-equipment>div{display:flex;justify-content:space-between;gap:10px;padding:9px 11px;background:#111824}.sheet-preview-equipment strong{font-size:.66rem;color:var(--text)}.sheet-preview-equipment span{color:var(--dim);font-size:.58rem}.sheet-preview-extras{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.sheet-preview-extras h4{margin-bottom:8px;color:var(--gold2);font:700 .68rem Cinzel}@media(max-width:920px){.sheet-preview-identity{grid-template-columns:repeat(3,1fr)}.sheet-preview-attributes{grid-template-columns:repeat(6,minmax(0,1fr))!important}.sheet-preview-middle{grid-template-columns:1fr}.sheet-preview-skills{position:static;margin-top:12px}.sheet-preview-lower{grid-template-columns:1fr}.sheet-preview-extras{grid-template-columns:1fr}}@media(max-width:760px){.sheet-preview-alignment-age{grid-template-columns:1fr}.sheet-preview-alignment-age>div{flex:1 1 auto!important;max-width:none!important}}@media(max-width:560px){.sheet-preview-identity{grid-template-columns:repeat(2,1fr)}.sheet-preview-attributes{grid-template-columns:repeat(6,minmax(0,1fr))!important;gap:4px}.sheet-preview-attributes .sheet-attr-card{min-height:56px;padding:4px 2px}.sheet-preview-equipment{grid-template-columns:1fr}}';document.head?.appendChild(style)})();
const phaseCompleteBeforeProgression=phaseIsComplete,missingBeforeProgression=missingChoices,validationBeforeProgression=validationMessage;
const progressionMissingChoicesBeforeSpecialGrants=progressionMissingChoices;
progressionMissingChoices=function(){
  ensureProgression();
  const missing=progressionMissingChoicesBeforeSpecialGrants();
  state.samuraiKatana=state.samuraiKatana||{};
  state.progression.forEach((row,index)=>{
    const level=classLevelAt(index,row.classId);
    if(row.classId==='samurai'){
      if([4,6,8].includes(level)&&!state.samuraiKatana[level]){
        missing.push({title:'Melhoria da Katana (Nv. '+(index+1)+')',message:'Escolha a melhoria da Katana Ancestral no nível '+(index+1)+' (Samurai '+level+').',selector:'[data-action="samurai-katana-upgrade"][data-level="'+level+'"]'});
      }
      if([10,12,14].includes(level)&&!state.samuraiKatana[level]){
        missing.push({title:'Encanto da Katana (Nv. '+(index+1)+')',message:'Escolha o encanto da Katana Ancestral Espiritual no nível '+(index+1)+' (Samurai '+level+').',selector:'[data-action="samurai-katana-enchantment"][data-level="'+level+'"]'});
      }
    }
    if(row.classId==='inventor'&&level===2){
      const granted=Boolean(arsenalState().grants?.['class-choice:class-inventor-fabricar-item-superior']);
      if(!granted){
        missing.push({title:'Fabricar Item Superior (Inventor Nv. 2)',message:'Escolha seu item superior de até T$ 2.000 concedido por Fabricar Item Superior.',selector:'[data-action="go-to-inventor-grant"]'});
      }
    }
  });
  return missing;
};
phaseIsComplete=function(step){if(step===10)return progressionMissingChoices().length===0;return phaseCompleteBeforeProgression(step)};
missingChoices=function(step){if(step===10)return progressionMissingChoices();return missingBeforeProgression(step)};
canExportCharacter=function(){
  const isSheet = Boolean((typeof state !== 'undefined' && state.finished) || (typeof window !== 'undefined' && window.location?.pathname?.endsWith('ficha.html')));
  if (isSheet) return true;
  return characterPendingChoices().length === 0;
};

if(typeof window !== 'undefined'){
  const syncExternalPartners = () => {
    try {
      const raw = localStorage.getItem('forja-heroi-t20-v1');
      if (raw) {
        const hero = JSON.parse(raw);
        let changed = false;
        if (Array.isArray(hero.partners) && JSON.stringify(hero.partners) !== JSON.stringify(state.partners)) {
          state.partners = hero.partners;
          changed = true;
        }
        if (hero.distinctions && JSON.stringify(hero.distinctions) !== JSON.stringify(state.distinctions)) {
          state.distinctions = hero.distinctions;
          changed = true;
        }
        if (changed) {
          if (typeof persistNow === 'function') persistNow();
          if (typeof renderStage === 'function') renderStage();
        }
      }
    } catch (e) {}
  };
  window.addEventListener('pageshow', syncExternalPartners);
  window.addEventListener('focus', syncExternalPartners);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') syncExternalPartners();
  });
  window.addEventListener('storage', (event) => {
    if (event.key === 'forja-heroi-t20-v1') syncExternalPartners();
  });
}
