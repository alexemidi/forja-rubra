function pdfSetText(form,name,value){if(value===undefined||value===null||value==='')return;try{const field=form.getTextField(name);field.acroField.dict.set(PDFLib.PDFName.of('V'),PDFLib.PDFHexString.fromText(String(value)))}catch(error){console.warn('Campo PDF ignorado:',name,error)}}
function pdfSetCheck(form,name,value){if(!value)return;try{const field=form.getCheckBox(name),widgets=field.acroField.getWidgets(),onValue=widgets.map(widget=>widget.getOnValue()).find(Boolean)||PDFLib.PDFName.of('Yes');field.acroField.dict.set(PDFLib.PDFName.of('V'),onValue);widgets.forEach(widget=>widget.setAppearanceState(onValue))}catch(error){console.warn('Campo PDF ignorado:',name,error)}}
function pdfSetChoice(form,name,value){if(value===undefined||value===null||value==='')return;try{const field=form.getDropdown(name);field.acroField.dict.set(PDFLib.PDFName.of('V'),PDFLib.PDFHexString.fromText(String(value)));field.acroField.dict.delete(PDFLib.PDFName.of('I'))}catch(error){console.warn('Campo PDF ignorado:',name,error)}}
function pdfUpgradeName(value){const id=typeof value==='string'?value:value?.nome||value?.id;return String(id||'').replace(/_/g,' ').replace(/\b\w/g,letter=>letter.toUpperCase())}
function pdfInventoryName(entry,item){const name=entry.displayName||entry.options?.customName||entry.itemName||item?.nome||entry.itemId,extras=[...(entry.improvements||[]),...(entry.enchantments||[])].map(pdfUpgradeName).filter(Boolean);return extras.length?name+' ('+extras.join(', ')+')':name}
function pdfCritical(value){if(!value)return '';const margin=Number(value.margem)||20,multiplier=Number(value.multiplicador)||2;return (margin<20?margin+'-20/':'')+'x'+multiplier}
function pdfLevelText(row,index){const cls=classById(row.classId),level=classLevelAt(index,row.classId),parts=[];for(const ability of cls?.habilidades||[])if(Number(ability.nivel)===level)parts.push(ability.nome+(compactFeatureDescription(ability)?' ('+compactFeatureDescription(ability)+')':''));const power=progressionPowerById(row.powerId);if(power)parts.push(power.nome+(compactFeatureDescription(power)?' ('+compactFeatureDescription(power)+')':''));return parts.filter(Boolean).join('\r\n')}
function pdfKnownSpells(){if(typeof spellPlan!=='function'||typeof allLearnedSpellIds!=='function')return '';return allLearnedSpellIds(spellPlan()).map(id=>DATA.spells.find(spell=>spell.id===id)?.name).filter(Boolean).sort((a,b)=>a.localeCompare(b,'pt-BR')).join('\n')}
async function exportCharacterPdf(){
  const source=Uint8Array.from(atob(DATA.pdfTemplateBase64),character=>character.charCodeAt(0)),pdf=await PDFLib.PDFDocument.load(source,{updateMetadata:false}),form=pdf.getForm(),attrs=finalAttrs(),race=raceById(state.identity.raceId),standard=selectedStandardOrigin(),regional=state.origin.mode==='dual'?selectedRegionalOrigin():null;
  form.acroForm.dict.set(PDFLib.PDFName.of('NeedAppearances'),PDFLib.PDFBool.False);
  ensureProgression();
  const classes=[...new Set(state.progression.map(row=>classById(row.classId)?.nome).filter(Boolean))];
  const heritage=typeof suraggelHeritageOption==='function'?suraggelHeritageOption():null,raceName=[race?.nome,heritage&&choiceName(heritage)].filter(Boolean).join(' · ');
  for(const [name,value] of Object.entries({'Nome':state.identity.characterName,'Jogador':state.identity.playerName,'Raça':raceName,'Origem':[standard?.nome,regional?.nome].filter(Boolean).join(' / '),'Classe':classes.join(' / '),'Divindade':state.deity.mode==='devout'?state.deity.name:state.deity.mode==='pantheon'?'Panteão':'','Nível':state.identity.plannedLevel,'Força':attrs.for,'Destreza':attrs.des,'Constituição':attrs.con,'Inteligência':attrs.int,'Sabedoria':attrs.sab,'Carisma':attrs.car}))pdfSetText(form,name,value);
  const passives=passiveCharacterEffects(),stats=progressionStats();
  pdfSetChoice(form,'ModAtributoDef',characterDefenseAttribute());
  pdfSetChoice(form,'Tamanho',characterSizeId());
  pdfSetText(form,'Deslocamento',characterBaseMovement());
  pdfSetText(form,'PV máximos',stats.pv);pdfSetText(form,'PV atuais',stats.pv);pdfSetText(form,'PM máximo',stats.pm);pdfSetText(form,'PM atuais',stats.pm);
  pdfSetText(form,'OutrosDef',passives.defenseBonus||'');
  pdfSetText(form,'Proficiências',characterProficiencyText());
  pdfSetText(form,'HabilidadesIniciais',pdfInitialFeatureText());
  const trainedSkills=[...new Set(allTrainedSkills())],officeSkills=trainedSkills.filter(id=>String(id).startsWith('oficio:'));
  for(const id of trainedSkills.filter(id=>!String(id).startsWith('oficio:')))pdfSetCheck(form,'Check'+(SKILL_LABEL[id]||id),true);
  const offices=[...officeSkills.map(id=>skillDisplayName(id).replace(/^Ofício\s*\(|\)$/g,'')),...Object.values(state.identity.classRequiredOffices||{}),...Object.values(state.origin.officeSpecialties||{})].filter((value,index,list)=>value&&list.indexOf(value)===index).slice(0,2);
  offices.forEach((office,index)=>{pdfSetCheck(form,'CheckOfício'+(index+1),true);pdfSetText(form,'TextoOfício'+(index+1),office)});
  for(const [id,bonus] of Object.entries(passives.skillBonuses))if(bonus)pdfSetText(form,(SKILL_LABEL[id]||id)+'Bon',bonus);
  state.progression.slice(0,20).forEach((row,index)=>pdfSetText(form,'Nível'+(index+1),pdfLevelText(row,index)));
  const catalog=new Map(DATA.pdfItems.map(item=>[item.id,item])),inventory=characterInventory(),weapons=[];let armor=null,shield=null;
  for(const entry of inventory){const item=catalog.get(entry.itemId),record={entry,item,name:pdfInventoryName(entry,item)};if(item?.tipo==='arma'&&weapons.length<5)weapons.push(record);if(item?.tipo==='armadura'&&!armor)armor=record;if(item?.tipo==='escudo'&&!shield)shield=record}
  weapons.forEach(({item,name},index)=>{const slot=index+1,weapon=weaponPassiveStats(item);pdfSetText(form,'Arma'+slot,name);pdfSetText(form,'Teste'+slot,weapon.attack);pdfSetText(form,'Dano'+slot,weapon.damage);pdfSetText(form,'Crítico'+slot,pdfCritical(item.arma?.critico));pdfSetText(form,'Tipo'+slot,(item.arma?.tipoDanoIds||[]).map(id=>({corte:'Corte',impacto:'Impacto',perfuracao:'Perfuração'}[id]||id)).join('/'));pdfSetText(form,'Alcance'+slot,item.arma?.alcanceId||'')});
  if(armor){pdfSetText(form,'Armadura',armor.name);pdfSetText(form,'DefArmadura',armor.item.armadura?.defesa);pdfSetText(form,'PenArmadura',armor.item.armadura?.penalidade);pdfSetCheck(form,'ArmaduraPesada',armor.item.armadura?.categoriaId==='pesada')}
  if(shield){pdfSetText(form,'Escudo',shield.name);pdfSetText(form,'DefEscudo',shield.item.escudo?.defesa);pdfSetText(form,'PenEscudo',shield.item.escudo?.penalidade)}
  const worn=[],carried=[];for(const entry of inventory)(catalog.get(entry.itemId)?.equipamento?.itemVestido?worn:carried).push(entry);
  const inventorySlots=[...carried.slice(0,20),...Array(Math.max(0,20-carried.length)).fill(null),...worn.slice(0,4)];
  inventorySlots.slice(0,24).forEach((entry,index)=>{if(!entry)return;const item=catalog.get(entry.itemId),slot=index+1;pdfSetText(form,'Item'+slot,pdfInventoryName(entry,item));pdfSetText(form,'Qnt'+slot,entry.quantity||1);pdfSetText(form,'Carga'+slot,Number(item?.espacos||0))});
  pdfSetText(form,'T$',remainingFunds());pdfSetText(form,'Magias',pdfKnownSpells());
  pdf.addJavaScript('Forja T20 - recalcular','this.calculateNow();');
  const output=await pdf.save({useObjectStreams:false}),blob=new Blob([output],{type:'application/pdf'}),link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=(slug(state.identity.characterName)||'ficha-t20')+' - Ficha T20.pdf';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);toast('Cópia preenchida exportada em PDF. O modelo original foi preservado.')
}
document.addEventListener('click',event=>{if(!event.target.closest?.('#exportButton')||!canExportCharacter())return;event.preventDefault();event.stopImmediatePropagation();exportCharacterPdf().catch(error=>{console.error(error);toast('Não foi possível gerar o PDF. O modelo original não foi alterado.')})},true);
