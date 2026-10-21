
originSkillIds=function(){
  return originBenefitOptions(selectedStandardOrigin()).filter(option=>state.origin.benefits.includes(option.id)&&option.type==='skill').map(option=>{
    if(option.id.startsWith('replacement-skill:'))return option.id.slice('replacement-skill:'.length);
    const token=skillTokenFromName(option.name);
    return token==='oficio'?(state.origin.officeSpecialties[option.id]||token):token;
  });
};
document.addEventListener('change',event=>{
  if(event.target.dataset.action!=='origin-replacement-skill')return;
  event.stopImmediatePropagation();const value=event.target.value,old=originReplacementId();
  if(value&&(!originReplacementAvailable()||(!old&&originBenefitsCount()>=2))){toast('Remova um benefício antes de escolher a perícia livre.');renderStage();return}
  const token=value.slice('replacement-skill:'.length);
  const valid=SKILLS.some(([id])=>id===token&&id!=='oficio')||OFFICES.some(([id])=>officeToken(id)===token);
  if(value&&(!valid||(allTrainedSkills().includes(token)&&value!==old))){toast('Escolha uma perícia ainda não treinada.');return}
  state.origin.benefits=state.origin.benefits.filter(id=>!id.startsWith('replacement-skill:'));
  if(value)state.origin.benefits.push(value);
  state.completed=state.completed.filter(step=>step<3);renderStage();
},true);
const phaseBeforeOriginReplacement=phaseIsComplete;
phaseIsComplete=function(step){return !(step===3&&originReplacementId()&&!originReplacementAvailable())&&phaseBeforeOriginReplacement(step)};
const missingBeforeOriginReplacement=missingChoices;
missingChoices=function(step){const missing=missingBeforeOriginReplacement(step);if(step===3&&originReplacementId()&&!originReplacementAvailable())missing.push({title:'Perícia livre da origem',message:'As perícias da origem precisam estar treinadas para usar a substituição. Remova a escolha livre ou restaure os treinos.',selector:'[data-action="origin-replacement-skill"]'});return missing};
if(state.step===3)renderStage();

Forja.loadStyle('src/estilos/criador/ficha-legada.css');
function pdfSetText(form,name,value){if(value===undefined||value===null||value==='')return;try{const field=form.getTextField(name);if(field.isReadOnly())return;field.acroField.dict.set(PDFLib.PDFName.of('V'),PDFLib.PDFHexString.fromText(String(value)))}catch(error){console.warn('Campo PDF ignorado:',name,error)}}
function pdfSetCheck(form,name,value){if(!value)return;try{const field=form.getCheckBox(name);if(field.isReadOnly())return;const widgets=field.acroField.getWidgets(),onValue=widgets.map(widget=>widget.getOnValue()).find(Boolean)||PDFLib.PDFName.of('Yes');field.acroField.dict.set(PDFLib.PDFName.of('V'),onValue);widgets.forEach(widget=>widget.setAppearanceState(onValue))}catch(error){console.warn('Campo PDF ignorado:',name,error)}}
// Mapeamento hex UTF-16 (offset 29) usado pelos dropdowns Atrib* de perícias na ficha PDF.
// Cada char 'x' do atributo vira 0x00(x.charCodeAt-29) em UTF-16BE.
const PDF_ATTR_HEX={'for':'004900520055','des':'004700480056','con':'004600520051','int':'004C00510057','sab':'005600440045','car':'004600440055'};
// Atualiza o stream de aparência visual /AP/N do dropdown para exibir o valor correto.
// O PDF armazena aparências estáticas que precisam ser reescritas manualmente.
function pdfDecompress(bytes){
  if(typeof pako!=='undefined'&&pako.inflate)return pako.inflate(bytes,{to:'string'});
  try{const zlib=require('zlib');return zlib.inflateSync(Buffer.from(bytes)).toString('utf8')}catch{}
  try{return new TextDecoder().decode(bytes)}catch{}
  return '';
}
function pdfCompress(str){
  if(typeof pako!=='undefined'&&pako.deflate)return pako.deflate(str);
  try{const zlib=require('zlib');return zlib.deflateSync(Buffer.from(str))}catch{}
  try{return new TextEncoder().encode(str)}catch{}
  return null;
}
// Atualiza o stream de aparência visual /AP/N do dropdown para exibir o valor correto.
// O PDF armazena aparências estáticas que precisam ser reescritas manualmente.
function pdfUpdateDropdownAppearance(pdf,field,strVal){
  try{
    const widget=field.acroField.getWidgets()[0];
    if(!widget)return;
    const apDict=widget.dict.get(PDFLib.PDFName.of('AP'));
    if(!apDict)return;
    const apNRef=apDict.get(PDFLib.PDFName.of('N'));
    if(!apNRef)return;
    const apStream=pdf.context.lookup(apNRef);
    if(!(apStream&&apStream.contents))return;
    const raw=pdfDecompress(apStream.contents);
    if(!raw)return;
    // Formato 1: texto plano "(des) Tj" — usado por ModAtributoDef
    if(/\([a-z]{2,3}\) Tj/.test(raw)){
      const updated=raw.replace(/\([a-z]{2,3}\) Tj/,`(${strVal}) Tj`);
      const comp=pdfCompress(updated);
      if(comp)apStream.contents=comp;
      return;
    }
    // Formato 2: hex UTF-16 "<AABBCC>" — usado pelos dropdowns Atrib* de perícias
    const newHex=PDF_ATTR_HEX[strVal];
    if(!newHex)return;
    const hexPattern=/<([0-9A-Fa-f]{12})>/;
    if(hexPattern.test(raw)){
      const updated=raw.replace(hexPattern,`<${newHex}>`);
      const comp=pdfCompress(updated);
      if(comp)apStream.contents=comp;
    }
  }catch{/* Ignorar silenciosamente — aparência visual não crítica */}
}
function pdfSetChoice(form,name,value){if(value===undefined||value===null||value==='')return;try{const field=form.getDropdown(name);if(field.isReadOnly())return;const strVal=String(value);field.acroField.dict.set(PDFLib.PDFName.of('V'),PDFLib.PDFHexString.fromText(strVal));const opts=field.getOptions(),idx=opts.indexOf(strVal);if(idx>=0)field.acroField.dict.set(PDFLib.PDFName.of('I'),form.doc.context.obj([idx]));else field.acroField.dict.delete(PDFLib.PDFName.of('I'));pdfUpdateDropdownAppearance(form.doc,field,strVal)}catch(error){console.warn('Campo PDF ignorado:',name,error)}}
function pdfUpgradeName(value){const id=typeof value==='string'?value:value?.nome||value?.id;return String(id||'').replace(/_/g,' ').replace(/\b\w/g,letter=>letter.toUpperCase())}
document.addEventListener('click',async event=>{if(!event.target.closest?.('[data-download-pdf-template]'))return;await Forja.loadPdf();const bytes=Forja.pdfBytes.slice(),url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'})),link=document.createElement('a');link.href=url;link.download='Ficha T20 Jogo do Ano - Otimizada v1.8.pdf';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
function pdfInventoryName(entry,item){if(entry.displayName)return entry.displayName;const name=entry.options?.customName||entry.itemName||item?.nome||entry.itemId,extras=[...(entry.improvements||[]),...(entry.enchantments||[])].map(pdfUpgradeName).filter(Boolean);return extras.length?name+' ('+extras.join(', ')+')':name}
function pdfCritical(value){return typeof formatWeaponCritical==='function'?formatWeaponCritical(value):(value?((Number(value.margem)||20)<20?((Number(value.multiplicador)||2)===2?String(value.margem):(value.margem)+'/'+(value.multiplicador)+'x'):(value.multiplicador||2)+'x'):'')}

// Calcula o deslocamento final para o PDF aplicando as regras de T20:
// - Imunidade a reduções: nome da raça contém anão/anã/anao/ana, OU texto de habilidades contém 'não reduz'/'nao reduz' etc.
// - Se imune: resultado nunca abaixo de 6 m
// - Armadura de pedra: deslocamento ÷2 (arredondado pra baixo)
// - Armadura de quitina: sem redução de deslocamento
// - Outra armadura pesada: -3 m
// - Sobrecarregado: -3 m adicional
function pdfMovement(){
  const mount = (typeof activeMountContext === 'function') ? activeMountContext(false) : null;
  const base = mount ? mount.speed : characterBaseMovement();
  // --- Detecção de imunidade a reduções ---
  const race=raceById(state.identity.raceId);
  const raceName=String(race?.nome||state.identity.raceId||'').toLowerCase();
  const raceNameNorm=raceName.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  // Imune se o nome da raça normalizado contém "anao" ou "ana" (cobre anão, anã, anao, ana)
  const raceImmune=/\bana[o]?\b/.test(raceNameNorm);
  // Texto das habilidades de raça/origem/divindade
  const rawAbility=String(typeof pdfInitialFeatureText==='function'?pdfInitialFeatureText():'');
  const abilityNorm=rawAbility.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  // Detecta variações (após normalização NFD sem acentos): "nao reduz", "n reduz", "nao e reduzido"
  const abilityImmune=/\bn(?:ao)?\s+(?:e\s+)?reduz|\bnao\s+e\s+reduzido/.test(abilityNorm);
  const immune=raceImmune||abilityImmune;
  // --- Identificar armadura equipada ---
  const armorItem=typeof equippedArmorItem==='function'?equippedArmorItem():null;
  const isHeavy=armorItem?(armorItem.armadura?.categoriaId==='pesada'||armorItem.categoriaId==='pesada'):false;
  const armorId=String(armorItem?.id||'');
  const isPedra=armorId.includes('pedra');
  const isQuitina=armorId.includes('quitina');
  // --- Condição sobrecarregado ---
  const overloaded=typeof sheetConditions==='function'&&sheetConditions().includes('Sobrecarregado');
  // --- Calcular deslocamento ---
  let movement=base;
  if(isHeavy){
    if(isPedra) movement=Math.floor(movement/2);
    else if(!isQuitina) movement-=3;
    // armadura de quitina: sem redução de deslocamento
  }
  if(overloaded) movement-=3;
  // Aplicar mínimo: 6 se imune a reduções, 0 caso contrário
  if(immune) movement=Math.max(6,movement);
  else movement=Math.max(0,movement);
  return movement;
}
function pdfFeatureText(feature, isLevel = false){
  if(!feature) return '';
  if(feature.id === 'classe_aumento_de_atributo' || feature.nome === 'Aumento de Atributo'){
    const attr = feature.sheetAttribute || feature.powerChoice;
    return 'Aumento de Atributo' + (attr ? ' (' + String(attr).toUpperCase() + ')' : '');
  }
  return feature.nome || '';
}
function pdfWriteConditions(form,conditions){conditions.slice(0,4).forEach((name,index)=>pdfSetText(form,'Efeitos'+(index+1),name))}
// Some editors store auto-size on widgets but leave a fixed size on their parent.
// Some editors store auto-size on widgets but leave a fixed size on their parent.
// Align only that conflicting size, retaining the parent's font, color and scripts.
function pdfAlignAutomaticFieldSizes(form){const fontSize=/(\/[^\s]+\s+)(\d+(?:\.\d+)?)(\s+Tf\b)/;for(const field of form.getFields()){if(field.isReadOnly())continue;const widgets=field.acroField.getWidgets(),parent=field.acroField.dict.get(PDFLib.PDFName.of('DA'))?.decodeText?.();if(!parent||!widgets.length)continue;const match=parent.match(fontSize);if(!match||Number(match[2])===0)continue;const automatic=widgets.every(widget=>{const own=widget.dict.get(PDFLib.PDFName.of('DA'));const appearance=own?.decodeText?.();const size=appearance?.match(fontSize);return size&&Number(size[2])===0&&size[1]===match[1]});if(automatic)field.acroField.setDefaultAppearance(parent.replace(fontSize,(_,font,size,operator)=>font+'0'+operator))}}
// Ask the reader to execute the template's own calculations; never replace them.
function pdfScheduleInitialCalculation(pdf){const key=PDFLib.PDFName.of('OpenAction'),previous=pdf.catalog.get(key),action=pdf.context.obj({S:'JavaScript',JS:PDFLib.PDFHexString.fromText('this.calculateNow();')});if(previous){const resolved=pdf.context.lookup(previous);action.set(PDFLib.PDFName.of('Next'),resolved instanceof PDFLib.PDFArray?pdf.context.obj({S:'GoTo',D:previous}):previous)}pdf.catalog.set(key,pdf.context.register(action))}
function originById(id){if(!id)return null;return (DATA.origins||[]).find(o=>o.id===id||o.nome===id||slug(o.nome)===slug(id))||null}
function regionalOriginById(id){if(!id)return null;return (DATA.regionalOrigins||[]).find(o=>o.id===id||o.nome===id||slug(o.nome)===slug(id))||null}
function pdfLevelText(row,index){
  const cls=classById(row.classId),level=classLevelAt(index,row.classId),parts=[];
  for(const ability of cls?.habilidades||[]){
    if(Number(ability.nivel)===level&&!/^poder_(?:de_|do_|da_)?/.test(slug(ability.nome))){
      if(level===1&&slug(ability.nome)==='magias')continue;
      parts.push(pdfFeatureText(ability, true));
    }
  }
  const power=progressionPowerById(row.powerId);
  if(power)parts.push(pdfFeatureText({...power,sheetAttribute:row.powerChoice}, true));
  return parts.filter(Boolean).join('\r\n');
}
function characterSpellEntries(){
  if(typeof spellPlan !== 'function' || typeof allLearnedSpellIds !== 'function') return [];
  const plan = spellPlan();
  const allSpells = allLearnedSpellIds(plan);
  const ditameEntries = [];
  const ditameSpellNames = new Set();
  ditameSpellNames.add('criar_elementos');

  (state.progression || []).forEach((row, index) => {
    if(!row.powerId) return;
    const power = progressionPowerById(row.powerId);
    if(!power || (typeof isSpellGrantingFeature === 'function' && !isSpellGrantingFeature(power))) return;
    const leaf = (power.nome || '').split('/').pop().trim();
    const k = slug(power.id || leaf);
    const nameK = slug(leaf);

    if(k === 'aumentar_repertorio' || nameK === 'aumentar_repertorio' || k === 'bardo_aumentar_repertorio'){
      const chosen = (spellState().selections?.['power:class:' + index] || []).map(id => spellById(id)?.name).filter(Boolean);
      const text = chosen.length ? chosen.join(', ') : 'escolher magias';
      ditameEntries.push(power.nome + '(' + text + ')');
      chosen.forEach(name => ditameSpellNames.add(slug(name).replace(/_de_|_da_|_do_|_dos_|_das_/g, '_')));
      return;
    }

    const summary = sheetFeatureSummary(power);
    if(summary){
      ditameEntries.push(power.nome + '(' + summary + ')');
      summary.split(',').forEach(s => {
        ditameSpellNames.add(slug(s.trim()).replace(/_de_|_da_|_do_|_dos_|_das_/g, '_'));
      });
    } else {
      ditameEntries.push(power.nome);
    }
  });

  const specialFeatures = typeof selectedCharacterFeatures === 'function'
    ? selectedCharacterFeatures().filter(f => typeof isSpellFieldFeature === 'function' && isSpellFieldFeature(f) && (f.source !== 'class-power' || !isSpellGrantingFeature(f)))
    : [];

  const specialEntries = [];
  const sourceWeight = { deity: 1, race: 2, origin: 3 };
  const sortedSpecials = [...specialFeatures].sort((a, b) => {
    const wa = sourceWeight[a.source] || 4;
    const wb = sourceWeight[b.source] || 4;
    if(wa !== wb) return wa - wb;
    return (a.nome || '').localeCompare(b.nome || '', 'pt-BR');
  });

  for(const feat of sortedSpecials){
    const leaf = (feat.nome || '').split('/').pop().trim();
    const k = slug(feat.id || leaf);
    const nameK = slug(leaf);

    if(nameK === 'teurgista_mistico' || k === 'teurgista_mistico'){
      const summary = sheetFeatureSummary(feat) || 'Curar Ferimentos';
      specialEntries.push('Teurgista Místico(' + summary + ')');
      continue;
    }
    if(nameK === 'presente_de_wynlla' || k === 'presente_de_wynlla'){
      const wSpellId = typeof characterWynllaSpells === 'function' ? characterWynllaSpells()[0] : (state.powers?.wynllaSpell || state.identity?.powerChoices?.presente_de_wynlla);
      const sp = wSpellId ? spellById(wSpellId) : null;
      const sName = sp?.name || 'Toque Chocante';
      specialEntries.push((feat.nome || 'Soldado/Presente de Wynlla') + '(' + sName + ' -1PM)');
      continue;
    }
    if(nameK === 'sentidos_misticos' || k === 'sentidos_misticos' || k === 'eiradaan_sentidos_misticos'){
      specialEntries.push('Sentidos Místicos(Visão Mística)');
      ditameSpellNames.add('visao_mistica');
      continue;
    }
    if(k === 'duende_presentes' || nameK.includes('presentes_de_magia')){
      continue;
    }
    specialEntries.push(feat.nome);
  }

  const isDuende = slug(state.identity?.raceId || '') === 'duende' || slug(state.identity?.race || '') === 'duende';
  if(isDuende){
    const race = typeof raceById === 'function' ? raceById(state.identity?.raceId) : null;
    const group = (typeof racePowerGroups === 'function' ? racePowerGroups() : []).find(g => g.id === 'duende_presentes')
      || (race?.habilidades?.selecionadas || []).find(h => h.id === 'duende_presentes');
    const allOpts = group?.options || group?.opcoes || (typeof DATA !== 'undefined' && DATA.races ? DATA.races.find(r => r.id === 'duende')?.habilidades?.selecionadas?.find(h => h.id === 'duende_presentes')?.opcoes : []) || [];
    const rawList = state.powers?.raceGroups?.duende_presentes
      || state.identity?.raceChoices?.duende_presentes
      || [];
    let giftIds = Array.isArray(rawList) ? rawList : (typeof rawList === 'string' ? rawList.split(/[,|/]/).map(s => s.trim()) : []);
    if(giftIds.length === 0){
      giftIds = ['Encantar Objetos', 'Maldição', 'Mais Lá do que Aqui'];
    }
    const giftNames = giftIds.map(id => {
      const cleanId = String(id).trim();
      const opt = allOpts.find(o =>
        choiceId(o) === cleanId ||
        choiceName(o) === cleanId ||
        slug(o.nome || o.id) === slug(cleanId)
      );
      return opt ? choiceName(opt) : cleanId;
    }).filter(Boolean);
    if(giftNames.length > 0){
      specialEntries.push('Presentes de Magia e Caos(' + giftNames.join('/') + ')');
    } else {
      specialEntries.push('Presentes de Magia e Caos(Encantar Objetos/Maldição/Mais Lá do que Aqui)');
    }
  }

  const learnedSpellNames = [];
  for(const id of allSpells){
    const spell = DATA.spells.find(s => s.id === id);
    if(!spell) continue;
    const cleanSpellSlug = slug(spell.name).replace(/_de_|_da_|_do_|_dos_|_das_/g, '_');
    if(ditameSpellNames.has(cleanSpellSlug)) continue;
    const times = typeof spellRelearnedTimes === 'function' ? spellRelearnedTimes(id, plan) : 0;
    const tag = times > 0 ? ' (-' + times + ' PM)' : '';
    learnedSpellNames.push(spell.name + tag);
  }

  const teurgistSpell = (sortedSpecials.some(f => slug(f.nome || '').includes('teurgista_mistico')) && !learnedSpellNames.includes('Curar Ferimentos'))
    ? 'Curar Ferimentos'
    : null;
  if(teurgistSpell && !learnedSpellNames.includes(teurgistSpell)){
    learnedSpellNames.push(teurgistSpell);
  }

  const spellsBeforeD = learnedSpellNames.filter(n => n.localeCompare('Ditame', 'pt-BR') < 0).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const spellsAfterD = learnedSpellNames.filter(n => n.localeCompare('Ditame', 'pt-BR') >= 0);
  const orderedDitames = ditameEntries.sort((a, b) => a.localeCompare(b, 'pt-BR'));

  return [...new Set([...spellsBeforeD, ...orderedDitames, ...spellsAfterD, ...specialEntries])];
}
function pdfKnownSpells(){
  return characterSpellEntries().join('\r\n');
}