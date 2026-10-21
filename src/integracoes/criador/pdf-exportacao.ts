
async function exportCharacterPdf(){
  await Forja.loadPdf();
  if(typeof PDFLib==='undefined')throw new Error('PDFLib não disponível');
  const template=Forja.pdfBytes.slice(),pdf=await PDFLib.PDFDocument.load(template,{updateMetadata:false}),form=pdf.getForm(),race=raceById(state.identity.raceId),standard=originById(state.origin.standard),regional=regionalOriginById(state.origin.regional),attrs=finalAttrs();
  pdfAlignAutomaticFieldSizes(form);
  ensureProgression();
  const classes=[...new Set(state.progression.map(row=>classById(row.classId)?.nome).filter(Boolean))];
  const heritage=typeof suraggelHeritageOption==='function'?suraggelHeritageOption():null,raceName=[race?.nome,heritage&&choiceName(heritage)].filter(Boolean).join(' · ');
  const alignmentValue=state.identity?.alignment||state.sheetNotes?.alignment||'';
  let agePdfValue='';
  if(state.age?.enabled){
    const bandData=(typeof BANDS!=='undefined'?BANDS[state.age.band]:null)||(window.__FORJA_DATA__?.BANDS?window.__FORJA_DATA__.BANDS[state.age.band]:null);
    const bandName=bandData?.name||'';
    const years=state.age.years!==undefined&&state.age.years!==null&&state.age.years!==''?String(state.age.years).trim():(typeof rule==='function'&&rule()?.min?String(rule().min):'');
    if(years&&bandName)agePdfValue=`${years} (${bandName})`;
    else if(bandName)agePdfValue=bandName;
    else if(years)agePdfValue=years;
  }else{
    agePdfValue=state.identity?.age||state.sheetNotes?.age||'';
  }
  for(const [name,value] of Object.entries({'Nome':state.identity.characterName,'Jogador':state.identity.playerName,'Raça':raceName,'Origem':[standard?.nome,regional?.nome].filter(Boolean).join(' / '),'Classe':classes.join(' / '),'Divindade':state.deity.mode==='devout'?state.deity.name:state.deity.mode==='pantheon'?'Panteão':'','Nível':state.identity.plannedLevel,'Alinhamento':alignmentValue,'Idade':agePdfValue,'Força':attrs.for,'Destreza':attrs.des,'Constituição':attrs.con,'Inteligência':attrs.int,'Sabedoria':attrs.sab,'Carisma':attrs.car}))pdfSetText(form,name,value);
  const passives=passiveCharacterEffects(),stats=progressionStats();
  pdfSetChoice(form,'ModAtributoDef',characterDefenseAttribute());
  const backpackBenefits=RegrasMochilas.beneficiosMochilas(mochilasVestidas(),poderesCarga(),attrs);
  const loadAttrCode=backpackBenefits.atributo;
  pdfSetChoice(form,'ModAtributoCarga',loadAttrCode);

  const casterSources = typeof characterSpellcastingSources === 'function' ? characterSpellcastingSources() : [];
  const primaryCaster = casterSources[0];
  let keyAttr = primaryCaster ? primaryCaster.attrKey : '';
  if(!keyAttr){
    const cId = state.identity?.classId;
    if(['clerigo','druida','frade','mistico','santo'].includes(cId)) keyAttr = 'sab';
    else if(['bardo','paladino'].includes(cId)) keyAttr = 'car';
    else if(cId === 'arcanista') {
      const plan = typeof spellPlan === 'function' ? spellPlan() : null;
      keyAttr = plan?.classes?.[0]?.path === 'feiticeiro' ? 'car' : 'int';
    } else {
      keyAttr = 'int';
    }
  }
  pdfSetChoice(form, 'AtribChave', keyAttr);

  const mountAlforjeBonus = (state.partners || []).some(p => {
    const gear = typeof mountGear === 'function' ? mountGear(p) : (characterInventory().filter(e => e.mountPartnerId === p.mountId));
    return gear.some(e => /alforje/i.test(e.itemId || e.displayName || e.itemName || ''));
  }) ? 10 : 0;
  const tpeelBonus = (typeof hasFamiliarElementalPower === 'function' && hasFamiliarElementalPower() && typeof getSelectedElementalFamiliarId === 'function' && getSelectedElementalFamiliarId() === 'tpeel') ? 2 : 0;
  const digitalLoad = typeof sheetInventoryLoad === 'function' ? sheetInventoryLoad() : null;
  const attrVal = Number(attrs[loadAttrCode] ?? attrs.for ?? 0);
  const basePdf = attrVal >= 0 ? 10 + (attrVal * 2) : 10 + attrVal;
  const digitalLimit = digitalLoad ? Number(digitalLoad.limit || 0) : basePdf;
  const loadDifference = Math.max(0, digitalLimit - basePdf);
  const loadBonus = Math.max(loadDifference, (typeof suraggelCarryingBonus==='function'?suraggelCarryingBonus():0)+backpackBenefits.bonus+bonusPoderesCarga()+mountAlforjeBonus+tpeelBonus);
  if(loadBonus > 0){
    pdfSetText(form, 'BônusCarga', String(loadBonus));
  } else {
    pdfSetText(form, 'BônusCarga', '0');
  }

  pdfSetChoice(form,'Tamanho',characterSizeId());
  pdfSetText(form,'Deslocamento',pdfMovement());
  pdfSetText(form,'PV máximos',stats.pv);pdfSetText(form,'PV atuais',stats.pv);pdfSetText(form,'PM máximo',stats.pm);pdfSetText(form,'PM atuais',stats.pm);
  pdfSetText(form,'OutrosDef',passives.defenseBonus||'');
  const baseProfText = characterProficiencyText();
  const distActiveIds = typeof progressionDistinctionActiveIds === 'function' ? progressionDistinctionActiveIds() : (Array.isArray(state.distinctions?.activeIds) ? state.distinctions.activeIds : []);
  const distCatalog = (typeof DATA !== 'undefined' && Array.isArray(DATA?.distinctions)) ? DATA.distinctions : [];
  const distNames = distActiveIds.map(id => distCatalog.find(d => d.id === id)?.nome).filter(Boolean);
  let finalProfText = baseProfText;
  if(distNames.length){
    const distTitle = 'Distinção: ' + distNames.join(' / ');
    finalProfText = finalProfText ? finalProfText + '\r\n' + distTitle : distTitle;
  }
  pdfSetText(form,'Proficiências',finalProfText);
  pdfSetText(form,'HabilidadesIniciais',pdfInitialFeatureText());
  const trainedSkills=[...new Set(allTrainedSkills())],officeSkills=trainedSkills.filter(id=>String(id).startsWith('oficio:'));
  for(const id of trainedSkills.filter(id=>!String(id).startsWith('oficio:')))pdfSetCheck(form,'Check'+(SKILL_LABEL[id]||id),true);
  const offices=[...officeSkills.map(id=>skillDisplayName(id).replace(/^Ofício\s*\(|\)$/g,'')),...Object.values(state.identity.classRequiredOffices||{}),...Object.values(state.origin.officeSpecialties||{})].filter((value,index,list)=>value&&list.indexOf(value)===index).slice(0,2);
  offices.forEach((office,index)=>{pdfSetCheck(form,'CheckOfício'+(index+1),true);pdfSetText(form,'TextoOfício'+(index+1),office)});
  for(const [id,bonus] of Object.entries(passives.skillBonuses))if(bonus)pdfSetText(form,(SKILL_LABEL[id]||id)+'Bon',bonus);
  for(const [id,label,defaultAttr] of SKILLS){
    const effective=skillEffectiveAttribute(id);
    if(effective!==defaultAttr)pdfSetChoice(form,'Atrib'+label,effective);
  }
  state.progression.slice(0,20).forEach((row,index)=>pdfSetText(form,'Nível'+(index+1),pdfLevelText(row,index)));
  const catalog=new Map(DATA.pdfItems.map(item=>[item.id,item])),inventory=characterInventory(),weapons=[];let armor=null,shield=null;
  const eqArmor=typeof equippedArmorRecord==='function'?equippedArmorRecord():null;
  const eqShield=typeof equippedShieldRecord==='function'?equippedShieldRecord():null;
  const eqWeapon=typeof equippedWeaponRecord==='function'?equippedWeaponRecord():null;
  if(eqArmor)armor={entry:eqArmor.entry,item:eqArmor.item,name:pdfInventoryName(eqArmor.entry,eqArmor.item)};
  if(eqShield)shield={entry:eqShield.entry,item:eqShield.item,name:pdfInventoryName(eqShield.entry,eqShield.item)};
  if(eqWeapon)weapons.push({entry:eqWeapon.entry,item:eqWeapon.item,name:pdfInventoryName(eqWeapon.entry,eqWeapon.item)});
  const remainingWeapons=inventory
    .map(entry=>({entry,item:catalog.get(entry.itemId),name:pdfInventoryName(entry,catalog.get(entry.itemId))}))
    .filter(record=>record.item?.tipo==='arma'&&(record.entry!==eqWeapon?.entry))
    .sort((a,b)=>{
      const rankA=typeof weaponHierarchyRank==='function'?weaponHierarchyRank(a.item):0;
      const rankB=typeof weaponHierarchyRank==='function'?weaponHierarchyRank(b.item):0;
      return rankB-rankA;
    });
  for(const rec of remainingWeapons){if(weapons.length<5)weapons.push(rec)}
  weapons.forEach(({entry,item,name},index)=>{const slot=index+1,weapon=weaponPassiveStats(item,entry);pdfSetText(form,'Arma'+slot,name);pdfSetText(form,'Teste'+slot,weapon.attack);pdfSetText(form,'Dano'+slot,weapon.damage);pdfSetText(form,'Crítico'+slot,pdfCritical(weapon.critical||item.arma?.critico));pdfSetText(form,'Tipo'+slot,(item.arma?.tipoDanoIds||[]).map(id=>({corte:'Corte',impacto:'Impacto',perfuracao:'Perfuração'}[id]||id)).join('/'));pdfSetText(form,'Alcance'+slot,item.arma?.alcanceId||'—')});
  if(armor){pdfSetText(form,'Armadura',armor.name);pdfSetText(form,'DefArmadura',armor.item.armadura?.defesa);pdfSetText(form,'PenArmadura',armor.item.armadura?.penalidade);pdfSetCheck(form,'ArmaduraPesada',armor.item.armadura?.categoriaId==='pesada')}
  if(shield){pdfSetText(form,'Escudo',shield.name);pdfSetText(form,'DefEscudo',shield.item.escudo?.bonusDefesa);pdfSetText(form,'PenEscudo',shield.item.escudo?.penalidade)}
  const eq=typeof equipmentState==='function'?equipmentState():{};
  const equippedSet=new Set([eq.armorId,eq.shieldId,eq.trailerId,...(eq.wornIds||[])].filter(Boolean));
  const worn=[],carried=[];
  for(const [i,entry] of inventory.entries()){
    if(entry.mountPartnerId) continue;
    const id=typeof equipEntryId==='function'?equipEntryId(entry,i):null;
    const item=catalog.get(entry.itemId);
    const isMochila=Boolean(item&&/mochila/i.test(item.nome||''));
    if(!isMochila&&id&&equippedSet.has(id))worn.push(entry);
    else if(!isMochila&&item?.equipamento?.itemVestido)worn.push(entry);
    else carried.push(entry);
  }
  const inventorySlots=[...carried.slice(0,20),...Array(Math.max(0,20-carried.length)).fill(null),...worn.slice(0,4)];
  inventorySlots.slice(0,24).forEach((entry,index)=>{if(!entry)return;const item=catalog.get(entry.itemId),slot=index+1;pdfSetText(form,'Item'+slot,pdfInventoryName(entry,item));pdfSetText(form,'Qnt'+slot,entry.quantity||1);pdfSetText(form,'Carga'+slot,Number(item?.espacos||0))});
  const coins=characterCoins();pdfSetText(form,'TC',coins.tc);pdfSetText(form,'T$',coins.ts);pdfSetText(form,'TO',coins.to);pdfWriteConditions(form,sheetConditions());pdfSetText(form,'Magias',pdfKnownSpells());pdfSetText(form,'Anotações',characterNotesText());
  pdfScheduleInitialCalculation(pdf);
  const output=await pdf.save({useObjectStreams:false,updateFieldAppearances:false}),blob=new Blob([output],{type:'application/pdf'}),link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=(slug(state.identity.characterName)||'ficha-t20')+' - Ficha T20.pdf';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);toast('Cópia preenchida exportada em PDF. O modelo original foi preservado.')
}
document.addEventListener('click', event => {
  const btn = event.target.closest?.('#exportButton, [data-sheet-action="export-pdf"]');
  if (!btn) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  if (typeof canExportCharacter === 'function' && !canExportCharacter()) {
    if (typeof showMissingChoiceWarning === 'function') {
      showMissingChoiceWarning(typeof characterPendingChoices === 'function' ? characterPendingChoices() : []);
    }
    const notify = typeof toast === 'function' ? toast : (typeof showToast === 'function' ? showToast : alert);
    notify('Conclua as pendências da ficha antes de gerar o PDF.', 'warning');
    return;
  }
  exportCharacterPdf().catch(error => {
    console.error(error);
    const notify = typeof toast === 'function' ? toast : (typeof showToast === 'function' ? showToast : alert);
    notify('Não foi possível gerar o PDF. O modelo original não foi alterado.', 'error');
  });
}, true);

