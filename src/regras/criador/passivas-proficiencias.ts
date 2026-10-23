
function characterProficiencyText(){
  const labels={armas_simples:'Armas simples',armas_marciais:'Armas marciais',armas_exoticas:'Armas exóticas',armaduras_leves:'armaduras leves',armaduras_pesadas:'armaduras pesadas',escudos:'escudos'};
  const profs=characterProficiencies().map(id=>labels[id]||String(id).replace(/_/g,' ')).join(', ').replace(/, ([^,]*)$/, ' e $1');
  const race=raceById(state.identity.raceId);
  const visionFeats=(race?.habilidades?.fixas||[]).filter(h=>typeof isVisionFeature==='function'&&isVisionFeature(h));
  const visionTexts=visionFeats.map(h=>h.nome);
  if(visionTexts.length){
    return profs?profs+'\r\n'+visionTexts.join('\r\n'):visionTexts.join('\r\n');
  }
  return profs;
}
function compactFeatureDescription(feature){
  const effects=feature.efeitos||[],parts=[];
  for(const effect of effects){
    if(effect.tipo==='reducao_dano'){const types=(effect.tipos||[effect.danoTipo]).filter(Boolean).join('/');parts.push('RD '+(types?types+' ':'')+effect.valor)}
    if(effect.tipo==='bonus_pericia'&&!effect.condicao)parts.push('+'+(effect.valor??effect.bonus)+' '+(effect.pericias||[effect.periciaId]).map(id=>SKILL_LABEL[id]||id).join('/'));
    if(effect.tipo==='bonus_defesa'&&!effect.condicao)parts.push('Defesa +'+(effect.valor??effect.bonus));
    if(effect.tipo==='bonus_deslocamento')parts.push('deslocamento '+(Number(effect.valor)>=0?'+':'')+effect.valor+'m');
    if(effect.tipo==='substituir_atributo_defesa')parts.push((effect.para||'').toUpperCase()+' na Defesa');
    if(effect.tipo==='reduzir_custo_magia_condicional')parts.push('–'+(effect.valor||1)+' PM em magia pedida');
  }
  if(parts.length)return parts.join(', ');
  const sentence=String(feature.descricao||'').split(/(?<=[.!?])\s+/)[0].replace(/[.!?]+$/,'');
  if(/^(?:escolha|selecione)\b/i.test(sentence))return '';
  return sentence.length>82?'':sentence;
}
function pdfInitialFeatureText(){
  return selectedCharacterFeatures()
    .filter(feature=>['race','origin','deity','general-power'].includes(feature.source)&&(typeof isSpellFieldFeature!=='function'||!isSpellFieldFeature(feature))&&(typeof isVisionFeature!=='function'||!isVisionFeature(feature)))
    .map(f=>typeof pdfFeatureText==='function'?pdfFeatureText(f,false):(f.nome||''))
    .join('\r\n')+
    (state.identity.raceId==='duende'&&state.identity.duendeTabuText?'\r\nTabu: '+state.identity.duendeTabuText+' ('+(state.identity.duendeTabuPenalty||state.identity.duendeTabuCustomPenalty||'consequência personalizada')+')':'');
}
function characterHasFeature(idOrSlug){
  if(typeof selectedCharacterFeatures!=='function')return false;
  const target=slug(idOrSlug||'');
  if(!target)return false;
  return selectedCharacterFeatures().some(f=>{
    const sId=slug(f.id||''),sNome=slug(f.nome||'');
    const cId=slug(f.chosenPower?.id||''),cNome=slug(f.chosenPower?.nome||'');
    return sId===target||sNome===target||sId.endsWith('_'+target)||sId.startsWith(target+'_')||cId===target||cNome===target||(cId&&cId.endsWith('_'+target));
  });
}
function configuredWeaponCritical(item,entry){
  const base=item?.arma?.critico||{},critical={margem:Number(base.margem)||20,multiplicador:Number(base.multiplicador)||2};
  const improvements=Array.isArray(entry?.improvements)?entry.improvements:[];
  const material=improvements.find(value=>value?.id==='material_especial')?.materialId;
  if(material==='mitral')critical.margem=Math.max(2,critical.margem-1);
  const allImpDefs = (typeof DATA !== 'undefined' && DATA.improvementData && Array.isArray(DATA.improvementData.melhorias)) ? DATA.improvementData.melhorias : ((typeof DATA !== 'undefined' && DATA.inventoryLoadData?.improvements) || []);
  for(const selected of improvements){
    const sId = typeof selected === 'string' ? selected : selected?.id;
    const matId = typeof selected === 'object' ? selected?.materialId : null;
    if(sId === 'precisa' || sId === 'afiada' || matId === 'mitral' || sId === 'material_mitral') {
      critical.margem = Math.max(2, critical.margem - 1);
    }
    if(sId === 'macica') {
      critical.multiplicador += 1;
    }
    const definition = allImpDefs.find(value => value.id === sId);
    for(const effect of definition?.efeitos||[]){
      if(effect.tipo==='bonus_margem_ameaca')critical.margem=Math.max(2,critical.margem-Number(effect.valor??effect.bonus??1));
      if(effect.tipo==='bonus_multiplicador_critico')critical.multiplicador+=Number(effect.valor??effect.bonus??1);
    }
  }
  const hasLegionario = characterHasFeature('legionario') || (typeof selectedRegionalOrigin === 'function' && slug(selectedRegionalOrigin()?.nome || '') === 'legionario');
  if(hasLegionario && (item?.id === 'gladio' || /gl[aá]dio/i.test(item?.nome || ''))){
    const inv = typeof characterInventory === 'function' ? characterInventory() : [];
    const hasHeavyShield = inv.some(e => (e.equipped || e.isEquipped || e.equipado) && (e.item?.escudo?.categoriaId === 'pesado' || /escudo pesado/i.test(e.item?.nome || '')));
    if(hasHeavyShield) critical.margem = Math.max(2, critical.margem - 1);
  }
  if(characterHasFeature('ataque_preciso') && typeof singleWeaponStyleActive === 'function' && singleWeaponStyleActive(entry)){
    critical.margem = Math.max(2, critical.margem - 2);
    critical.multiplicador += 1;
  }
  if(characterHasFeature('armas_da_ambicao')){
    critical.margem = Math.max(2, critical.margem - 1);
  }
  if(characterHasFeature('tradicao_de_lin_wu') && (item?.id === 'katana' || /katana/i.test(item?.nome || ''))){
    critical.margem = Math.max(2, critical.margem - 1);
  }
  return critical;
}
function weaponPassiveStats(item,entry){
  if(!item?.arma)return{skill:'luta',attack:0,damage:'—'};
  const arma=item.arma,isDistance=arma.combateId==='a_distancia',isCaC=!isDistance;
  const props=arma.propriedadesIds||[],isLight=arma.empunhaduraId==='leve',isAgile=props.includes('agil'),isAdaptable=props.includes('adaptavel'),isThrow=props.includes('arremesso');
  const trained=new Set(typeof allTrainedSkills==='function'?allTrainedSkills():[]);
  const attrs=typeof finalAttrs==='function'?finalAttrs():{for:0,des:0,con:0,int:0,sab:0,car:0};
  const str=Number(attrs.for||0),dex=Number(attrs.des||0);

  const hasAcuidade=characterHasFeature('acuidade_com_arma');
  const eligibleForAcuidade=(isLight||isAgile||isThrow)&&hasAcuidade;

  const skill=isDistance?'pontaria':'luta';
  let attack=typeof calculatedSkillTotal==='function'?calculatedSkillTotal(skill):0;
  if(typeof activeMountContext==='function'){
    const mount=activeMountContext(false);
    if(mount){if(isDistance&&!mount.ginete)attack-=2;if(mount.guided&&isCaC&&['cavalo','ponei'].includes(mount.species)&&mount.tier!=='iniciante')attack+=2+RegrasMontarias.bonusArmaduraMontaria(mount.gear);}
  }
  if(isCaC&&eligibleForAcuidade){
    attack=attack-str+dex;
  }
  if(isDistance && characterHasFeature('inventor_balistica')){
    const intMod = Number(attrs.int || 0);
    if(intMod > dex) attack = attack - dex + intMod;
  }
  if(item.id==='espadim'&&trained.has('nobreza')){
    attack++;
  }

  if(isCaC&&characterHasFeature('estilo_de_uma_arma')&&singleWeaponStyleActive(entry))attack+=2;
  if(equipmentState().dualAttack&&characterHasFeature('estilo_de_duas_armas')&&!characterHasFeature('ambidestria'))attack-=2;

  const chosenFoco = (typeof state !== 'undefined' && Array.isArray(state?.progression))
    ? state.progression.filter(r => r.powerId === 'foco_em_arma').map(r => slug(r.powerChoice || r.choice || r.arma || '')).filter(Boolean)
    : [];
  if (characterHasFeature('foco_em_arma') && (chosenFoco.length === 0 || chosenFoco.includes(slug(item.id)) || chosenFoco.some(w => slug(item.nome || '').includes(w)))) {
    attack += 2;
  }
  if (characterHasFeature('armas_da_ambicao')) {
    attack += 1;
  }

  let attrDamage=0;
  if(isCaC){
    attrDamage=eligibleForAcuidade?dex:str;
  } else if(isDistance){
    const hasStrDamage=(item.efeitos||[]).some(e=>e.tipo==='usar_atributo_no_dano'&&e.atributoId==='for')||['arco_longo','funda','balestra','arco_de_guerra'].includes(item.id);
    if(hasStrDamage)attrDamage=str;
  }

  let extraDamage=0;
  const charLevel = Math.max(1, Number(state?.identity?.plannedLevel) || (Array.isArray(state?.progression) ? state.progression.length : 1));
  if(isDistance && characterHasFeature('arqueiro')){
    const wisMod = Math.max(0, Number(attrs.sab || 0));
    extraDamage += Math.min(wisMod, charLevel);
  }
  if(isCaC && (isLight || isAgile) && characterHasFeature('esgrimista')){
    const intMod = Math.max(0, Number(attrs.int || 0));
    extraDamage += Math.min(intMod, charLevel);
  }
  if(isDistance && !isThrow && characterHasFeature('estilo_de_disparo')){
    extraDamage += characterHasFeature('inventor_balistica') ? Math.max(dex, Number(attrs.int || 0)) : dex;
  }
  if(item.id==='espadim'&&trained.has('nobreza')){
    extraDamage+=1;
  }
  const stdOrigin = typeof selectedStandardOrigin === 'function' ? selectedStandardOrigin() : null;
  const regOrigin = typeof selectedRegionalOrigin === 'function' ? selectedRegionalOrigin() : null;
  const hasState = typeof state !== 'undefined';
  const isDwarfWeaponsmith = entry?.regionalOriginName === 'Anão de Armas' || stdOrigin?.nome === 'Anão de Armas' || regOrigin?.nome === 'Anão de Armas' || (hasState && (state?.origin?.regional === 'Anão de Armas' || state?.origin?.standard === 'Anão de Armas' || state?.origin?.regional === 'anao_de_armas'));
  const isDwarfWeapon = /machado|machadinha|martelo|marreta|picareta/i.test((item.nome || '') + ' ' + (item.id || ''));
  if(isDwarfWeaponsmith && isDwarfWeapon){
    extraDamage += 2;
  }
  const isDesertor = entry?.regionalOriginName === 'Desertor da Supremacia' || stdOrigin?.nome === 'Desertor da Supremacia' || regOrigin?.nome === 'Desertor da Supremacia' || (hasState && (state?.origin?.regional === 'Desertor da Supremacia' || state?.origin?.standard === 'Desertor da Supremacia' || state?.origin?.regional === 'desertor_da_supremacia'));
  if (isDesertor && (item.id === 'espada_bastarda' || /espada.*bastarda/i.test((item.nome || '') + ' ' + (item.id || '')))) {
    const hasHeavyShield = (typeof heldItemRecords === 'function' ? heldItemRecords() : []).some(r => r.item?.id === 'escudo_pesado' || /escudo.*pesado/i.test((r.item?.nome || '') + ' ' + (r.item?.id || '')));
    const eqShield = typeof equipmentState === 'function' ? equipmentState().shieldId : null;
    const inv = typeof characterInventory === 'function' ? characterInventory() : [];
    const shieldEquipped = hasHeavyShield || inv.some((e, i) => {
      const eId = typeof equipEntryId === 'function' ? equipEntryId(e, i) : (e.id || e.itemId);
      const isEq = (e.equipped || e.isEquipped || e.equipado || eId === eqShield || e.itemId === eqShield);
      return isEq && (e.itemId === 'escudo_pesado' || /escudo.*pesado/i.test(e.nome || e.itemId || ''));
    });
    if (shieldEquipped) {
      attack += 2;
    }
  }
  const isGuardiaoGlacial = stdOrigin?.nome === 'Guardião Glacial' || regOrigin?.nome === 'Guardião Glacial' || (hasState && (state?.origin?.regional === 'guardiao_glacial' || state?.origin?.standard === 'guardiao_glacial'));
  if (isGuardiaoGlacial && (item.id === 'arco_longo' || item.id === 'machado_de_batalha' || /arco.*longo|machado.*batalha/i.test((item.nome || '') + ' ' + (item.id || '')))) {
    const classProf = (classById(state.identity?.classId)?.caracteristicas?.proficiencias || []);
    if (classProf.includes('armas_marciais') || classProf.includes(item.id)) extraDamage += 2;
  }
  const isLegionario = stdOrigin?.nome === 'Legionário' || regOrigin?.nome === 'Legionário' || (hasState && (state?.origin?.regional === 'legionario' || state?.origin?.standard === 'legionario'));
  let threatMod = 0;
  if (isLegionario && (item.id === 'gladio' || /gl[aá]dio/i.test((item.nome || '') + ' ' + (item.id || '')))) {
    const hasHeavyShield = (typeof heldItemRecords === 'function' ? heldItemRecords() : []).some(r => r.item?.id === 'escudo_pesado' || /escudo.*pesado/i.test((r.item?.nome || '') + ' ' + (r.item?.id || '')));
    const eqShield = typeof equipmentState === 'function' ? equipmentState().shieldId : null;
    const inv = typeof characterInventory === 'function' ? characterInventory() : [];
    const shieldEquipped = hasHeavyShield || inv.some((e, i) => {
      const eId = typeof equipEntryId === 'function' ? equipEntryId(e, i) : (e.id || e.itemId);
      const isEq = (e.equipped || e.isEquipped || e.equipado || eId === eqShield || e.itemId === eqShield);
      return isEq && (e.itemId === 'escudo_pesado' || /escudo.*pesado/i.test(e.nome || e.itemId || ''));
    });
    if (shieldEquipped) threatMod += 1;
  }
  const isLenhadorTollon = stdOrigin?.nome === 'Lenhador de Tollon' || regOrigin?.nome === 'Lenhador de Tollon' || (hasState && (state?.origin?.regional === 'lenhador_de_tollon' || state?.origin?.standard === 'lenhador_de_tollon'));
  if (isLenhadorTollon && (item.id === 'machadinha' || item.id === 'machado_de_batalha' || /machadinha|machado.*batalha/i.test((item.nome || '') + ' ' + (item.id || '')))) {
    const classProf = (classById(state.identity?.classId)?.caracteristicas?.proficiencias || []);
    if (classProf.includes('armas_marciais') || classProf.includes(item.id)) extraDamage += 2;
  }
  const isNitamuraniano = stdOrigin?.nome === 'Nitamuraniano' || regOrigin?.nome === 'Nitamuraniano' || (hasState && (state?.origin?.regional === 'nitamuraniano' || state?.origin?.standard === 'nitamuraniano'));
  if (isNitamuraniano && (item.id === 'katana' || item.id === 'arco_longo' || /katana|arco.*longo/i.test((item.nome || '') + ' ' + (item.id || '')))) {
    const classProf = (classById(state.identity?.classId)?.caracteristicas?.proficiencias || []);
    if (classProf.includes('armas_marciais') || classProf.includes('armas_exoticas') || classProf.includes(item.id)) extraDamage += 2;
  }
  const isNomadeSarAllan = stdOrigin?.nome === 'Nômade Sar-Allan' || regOrigin?.nome === 'Nômade Sar-Allan' || (hasState && (state?.origin?.regional === 'nomade_sar_allan' || state?.origin?.standard === 'nomade_sar_allan'));
  if (isNomadeSarAllan && /alfange|arco.*curto|cimitarra/i.test((item.nome || '') + ' ' + (item.id || ''))) {
    extraDamage += 2;
  }
  const isSelvagem = stdOrigin?.nome === 'Selvagem Sanguinário' || regOrigin?.nome === 'Selvagem Sanguinário' || (hasState && (state?.origin?.regional === 'selvagem_sanguinario' || state?.origin?.standard === 'selvagem_sanguinario'));
  if (isSelvagem) {
    const inv = typeof characterInventory === 'function' ? characterInventory() : [];
    const hasHeavyArmor = inv.some(e => (e.equipped || e.isEquipped || e.equipado) && e.item?.armadura?.categoriaId === 'pesada');
    if (!hasHeavyArmor) extraDamage += 1;
  }
  const isIndomavel = stdOrigin?.nome === 'Tocado pelo Indomável' || regOrigin?.nome === 'Tocado pelo Indomável' || (hasState && (state?.origin?.regional === 'tocado_pelo_indomavel' || state?.origin?.standard === 'tocado_pelo_indomavel'));
  if (isIndomavel && (item.id === 'ataque_desarmado' || /desarmado|arma.*natural/i.test((item.nome || '') + ' ' + (item.id || '')))) {
    extraDamage += 2;
  }
  const activePartners = Array.isArray(state?.partners) ? state.partners : [];
  const hasIrmaoCavalo = activePartners.some(p => p.id === 'irmao_cavalo' || p.tipo === 'irmao_cavalo' || /irm[aã]o cavalo/i.test(p.nome || ''));
  if (hasIrmaoCavalo) {
    attack += 1;
  }
  const allWeaponImpDefs = (typeof DATA !== 'undefined' && DATA.improvementData && Array.isArray(DATA.improvementData.melhorias)) ? DATA.improvementData.melhorias : ((typeof DATA !== 'undefined' && DATA.inventoryLoadData?.improvements) || []);
  for(const selected of Array.isArray(entry?.improvements)?entry.improvements:[]){
    const sId = typeof selected === 'string' ? selected : selected?.id;
    const matId = typeof selected === 'object' ? selected?.materialId : null;
    if(sId === 'certeira') attack += 1;
    if(sId === 'pungente') attack += 2;
    if(sId === 'cruel') extraDamage += 1;
    if(sId === 'atroz') extraDamage += 2;
    if(matId === 'adamante' || sId === 'material_adamante') extraDamage += 2;
    if(matId === 'gelo_eterno' || sId === 'material_gelo_eterno') extraDamage += 2;
    const definition = allWeaponImpDefs.find(value => value.id === sId);
    for(const effect of definition?.efeitos||[]){
      if(effect.tipo==='bonus_ataque_arma')attack+=Number(effect.valor??effect.bonus??0);
      if(effect.tipo==='bonus_dano_arma')extraDamage+=Number(effect.valor??effect.bonus??0);
    }
  }

  const isEstragado = Boolean(entry?.estragado || entry?.isDamaged || entry?.damaged || /estragad/i.test(entry?.displayName || entry?.itemName || item?.nome || ''));
  if (isEstragado) {
    attack -= 5;
  }

  const isUnarmed = item.id === 'ataque_desarmado' || /desarmado/i.test(item.id || item.nome || '');
  if (isUnarmed && characterHasFeature('lutador_trincado')) {
    extraDamage += Math.max(0, Number(attrs.con || 0));
  }

  const chosenWeapons = (typeof state !== 'undefined' && Array.isArray(state?.progression))
    ? state.progression.filter(r => r.powerId === 'guerreiro_especializacao_em_arma' || r.powerId === 'especializacao_em_arma').map(r => slug(r.powerChoice || r.choice || r.arma || '')).filter(Boolean)
    : [];
  const isSpecializedWeapon = characterHasFeature('guerreiro_especializacao_em_arma') && (chosenWeapons.length === 0 || chosenWeapons.includes(slug(item.id)) || chosenWeapons.some(w => slug(item.nome || '').includes(w)));
  if (isSpecializedWeapon) {
    extraDamage += 2;
  }

  const formatDmg=(dice,bonus)=>{
    if(!dice)return '—';
    if(bonus>0)return dice+'+'+bonus;
    if(bonus<0)return dice+bonus;
    return dice;
  };

  let baseDmg=arma.dano?.principal||'';
  if (isUnarmed && characterHasFeature('lutador_briga')) {
    const lutLvl = typeof characterClassLevel === 'function' ? characterClassLevel('lutador') : ((state.progression || []).filter(r => r.classId === 'lutador').length || (state.identity?.classId === 'lutador' ? Number(state.identity?.plannedLevel) || 1 : 0));
    if (lutLvl >= 17) baseDmg = '2d8';
    else if (lutLvl >= 13) baseDmg = '2d6';
    else if (lutLvl >= 9) baseDmg = '1d10';
    else if (lutLvl >= 5) baseDmg = '1d8';
    else baseDmg = '1d6';
  }
  if (isSpecializedWeapon && characterHasFeature('guerreiro_mestre_em_arma')) {
    if (typeof stepUpDamage === 'function') {
      baseDmg = stepUpDamage(baseDmg, 1, { allowAltLadder: true });
    } else {
      const ladder = { '1d4': '1d6', '1d6': '1d8', '1d8': '1d10', '1d10': '1d12', '1d12': '2d8', '2d6': '2d8', '2d8': '2d10' };
      baseDmg = ladder[baseDmg] || baseDmg;
    }
  }
  if(!baseDmg)return{skill,attack,damage:'—'};

  let damage='';
  if(isAdaptable&&arma.dano?.alternativas?.length){
    const altDmg=arma.dano.alternativas[0];
    const bonus1m=attrDamage+extraDamage;
    const bonus2m=attrDamage+extraDamage;
    if(bonus1m===bonus2m){
      const suffix=bonus1m>0?'+'+bonus1m:(bonus1m<0?String(bonus1m):'');
      damage=baseDmg+'/'+altDmg+suffix;
    } else {
      damage=formatDmg(baseDmg,bonus1m)+'/'+formatDmg(altDmg,bonus2m);
    }
  } else {
    const totalBonus=attrDamage+extraDamage;
    damage=formatDmg(baseDmg,totalBonus);
  }

  return{skill,attack,damage:damage.replace(/\s+/g,''),damageBonus:extraDamage,critical:configuredWeaponCritical(item,entry)};
}

// Defesa não recebe metade do nível (essa parcela pertence aos testes de perícia).


let arsenalSession=0;
let arsenalShopOpen=false;
let arsenalMountedOwner=null;
let arsenalContextKey='';
const ARSENAL_PROFILES_KEY='arsenal-arton-character-profiles-v1';
const STARTING_FUNDS={2:300,3:600,4:1000,5:2000,6:3000,7:5000,8:7000,9:10000,10:13000,11:19000,12:27000,13:36000,14:49000,15:66000,16:88000,17:110000,18:150000,19:200000,20:260000};
function isNarrativeItem(name){
  const t=slug(name).replace(/_/g,' ');
  if(/marca no corpo|caracteristica fisica nao possuida/.test(t))return true;
  if(/animal nao combativo|animal urbano|pequeno animal de estimacao/.test(t))return true;
  if(/uniforme militar|insignia de seu exercito|insignia da milicia|estandarte da sua tribo/.test(t))return true;
  if(/simbolo de sua heranca|simbolo da resistencia|enfeite de elmo/.test(t))return true;
  if(/traje de plebeu|andrajos de aldeao|trapos surrados|um pano sujo|um avental/.test(t))return true;
  if(/item sem valor recebido de um admirador|panfleto revolucionario|trofeu de caca/.test(t))return true;
  return false;
}
function characterNarrativeItems(){
  const items=[];
  for(const [kind,origin] of [['standard',selectedStandardOrigin()],['regional',state.origin.mode==='dual'?selectedRegionalOrigin():null]]){
    (origin?.itens||[]).forEach(name=>{
      if(isNarrativeItem(name)&&!items.includes(name))items.push(name);
    });
  }
  return items;
}
function characterNotesText(){
  if(typeof syncTavernContractsToSheetNotes==='function')syncTavernContractsToSheetNotes();
  const userNotes=(state.sheetNotes?.notes||'').trim();
  const narrative=characterNarrativeItems();
  const parts=[];
  if(userNotes)parts.push(userNotes);

  const partnersList = Array.isArray(state.partners) ? state.partners : [];
  if (partnersList.length > 0) {
    const partnerLines = partnersList.map(p => {
      const isMount = !!(typeof mountRecord === 'function' ? mountRecord(p) : (p.mount || p.mounted || p.type === 'montaria' || p.species));
      const tierLabel = { iniciante: 'Iniciante', veterano: 'Veterano', mestre: 'Mestre' }[p.tier || 'iniciante'] || 'Iniciante';
      if (isMount) {
        const m = typeof mountRecord === 'function' ? mountRecord(p) : null;
        const gear = typeof mountGear === 'function' ? mountGear(p) : (typeof characterInventory === 'function' ? characterInventory().filter(e => e.mountPartnerId === p.mountId) : []);
        const gearNames = gear.map(e => e.displayName || e.itemName || e.itemId).filter(Boolean);
        const gearText = gearNames.length ? ' | Equipamento: ' + gearNames.join(', ') : '';
        const name = p.name || m?.speciesName || p.species || 'Montaria';
        return '• [Montaria] ' + name + ' (' + tierLabel + ')' + gearText;
      } else {
        const typeInfo = typeof partnerTypeById === 'function' ? partnerTypeById(p.type || p.tipo) : null;
        const typeName = typeInfo?.name || p.type || p.tipo || 'Aliado';
        const name = p.name ? p.name + ' (' + typeName + ', ' + tierLabel + ')' : typeName + ' (' + tierLabel + ')';
        let benefit = p.benefit || '';
        if (!benefit) {
          if (typeof slug === 'function' && slug(typeName).includes('ajudante') && Array.isArray(p.skills) && p.skills.length > 0) {
            benefit = 'Perícias: ' + p.skills.map(s => typeof skillDisplayName === 'function' ? skillDisplayName(s) : s).join(', ');
          } else if (typeInfo) {
            benefit = p.tier === 'mestre' ? (typeInfo.benefitMestre || '') : (typeInfo.benefitIniciante || '');
          }
        }
        return '• [Parceiro] ' + name + (benefit ? ' — ' + benefit : '');
      }
    });
    parts.push('Parceiros e Montarias:\n' + partnerLines.join('\n'));
  }

  if(narrative.length)parts.push('Características e itens de origem:\n• '+narrative.join('\n• '));
  return parts.join('\n\n');
}
function allTrainedOffices(){
  const list=[];
  const add=name=>{
    if(!name)return;
    const clean=skillDisplayName(name).replace(/^Ofício\s*\(|\)$/g,'').trim();
    if(clean&&!list.some(item=>slug(item)===slug(clean)))list.push(clean);
  };
  (allTrainedSkills()||[]).forEach(id=>{if(String(id).startsWith('oficio:'))add(id)});
  Object.values(state.identity.classRequiredOffices||{}).forEach(add);
  Object.values(state.origin.officeSpecialties||{}).forEach(add);

  // Artesão Criativo: considerado treinado em todos os ofícios, tendo acesso a todas as oficinas
  // @ts-ignore
  const artRules = typeof RegrasArtesaoCriativo !== 'undefined' ? RegrasArtesaoCriativo : (typeof window !== 'undefined' ? window['RegrasArtesaoCriativo'] : null);
  const temArtesaoCriativo = artRules && typeof artRules.temPoderArtesaoCriativo === 'function'
    ? artRules.temPoderArtesaoCriativo(state)
    : ((Array.isArray(state?.progression) && state.progression.some(p => p?.powerId === 'inventor_artesao_criativo' || p?.powerId === 'artesao_criativo' || /artes[aã]o criativo/i.test(p?.powerName || ''))) ||
       (Array.isArray(state?.powers) && state.powers.some(p => p?.id === 'inventor_artesao_criativo' || p?.id === 'artesao_criativo' || /artes[aã]o criativo/i.test(p?.nome || ''))));
  if (temArtesaoCriativo) {
    ['Armeiro', 'Alquimista', 'Alfaiate', 'Artesão', 'Carpinteiro', 'Cozinheiro', 'Engenhoqueiro', 'Escriba', 'Escultor', 'Joalheiro', 'Pedreiro', 'Pintor', 'Tatuador'].forEach(add);
  }

  return list;
}
function automaticStartingGrants(){
  const cls=classById(state.identity.classId),proficiencies=new Set(characterProficiencies());
  const std = typeof selectedStandardOrigin === 'function' ? selectedStandardOrigin() : null;
  const reg = typeof selectedRegionalOrigin === 'function' ? selectedRegionalOrigin() : null;
  const isForasteiro = std?.nome === 'Forasteiro' || reg?.nome === 'Forasteiro' || state.origin?.standard === 'forasteiro' || state.origin?.regional === 'forasteiro';
  const suitName = isForasteiro ? 'Traje Estrangeiro' : 'Traje de Viajante';
  const grants=['Mochila','Saco de Dormir', suitName].map((name,index)=>({id:'base:'+index,name,source:'initial'}));
  if(proficiencies.has('escudos'))grants.push({id:'base:shield',name:'Escudo Leve',source:'initial'});
  for(const [kind,origin] of [['standard',selectedStandardOrigin()],['regional',state.origin.mode==='dual'?selectedRegionalOrigin():null]])
    (origin?.itens||[]).forEach((name,index)=>{
      if(/traje estrangeiro/i.test(name) && isForasteiro) return;
      if(/^t\$\s*(\d+d\d+|[\d.]+)/i.test(String(name||'').trim())) return;
      if(!originItemChoice(name,kind,origin,index)&&!isNarrativeItem(name))grants.push({id:'origin:'+kind+':'+(origin.id||state.origin[kind])+':'+index,name,source:'origin'});
    });
  return grants;
}
function automaticStartingItems(){return automaticStartingGrants().map(grant=>grant.name)}
function parseOriginMoneyText(name){
  const str=String(name||'').trim();
  const diceMatch=str.match(/^t\$\s*(\d+)d(\d+)/i);
  if(diceMatch){
    const count=Number(diceMatch[1])||1,sides=Number(diceMatch[2])||6;
    return count*Math.round((sides+1)/2);
  }
  const match=str.match(/^t\$\s*([\d.]+)/i);
  if(match)return Number(match[1].replace(/\./g,''))||0;
  return 0;
}
function originMoneyBonus(itemList){
  let money=0;
  if(Array.isArray(itemList)){
    itemList.forEach(name=>{
      money+=parseOriginMoneyText(name);
    });
    return money;
  }
  const origins=[];
  if(state.origin?.mode==='standard'||state.origin?.mode==='dual'||!state.origin?.mode){
    if(typeof selectedStandardOrigin==='function')origins.push(selectedStandardOrigin());
  }
  if(state.origin?.mode==='regional'||state.origin?.mode==='dual'){
    if(typeof selectedRegionalOrigin==='function')origins.push(selectedRegionalOrigin());
  }
  for(const origin of origins){
    if(!origin||!Array.isArray(origin.itens))continue;
    origin.itens.forEach(name=>{
      money+=parseOriginMoneyText(name);
    });
  }
  if(state.origin?.mode==='regional'||state.origin?.mode==='dual'){
    const regName = slug(typeof selectedRegionalOrigin === 'function' ? selectedRegionalOrigin()?.nome || '' : state.origin?.regional || '');
    if(regName === 'barao_arruinado') money += 50;
  }
  return money;
}
function arsenalState(){
  const signature=[state.identity.classId,state.origin.mode,state.origin.standard,state.origin.regional,(state.origin.benefits||[]).slice().sort().join(',')].join('|');
  if(!state.arsenal||typeof state.arsenal!=='object')state.arsenal={storage:{},choiceIndex:0,pending:null,complete:false,ruleSignature:signature,unresolved:[]};
  const saved=state.arsenal;
  if(!saved.storage||typeof saved.storage!=='object')saved.storage={};
  if(!saved.grants){saved.grants={};if(saved.complete){initialItemPlan().forEach(choice=>saved.grants[itemChoiceGrantId(choice)]=true);automaticStartingGrants().forEach(grant=>saved.grants[grant.id]=true)}}
  if(!saved.operations)saved.operations={};
  if(saved.ruleSignature&&saved.ruleSignature!==signature){saved.pending=null;saved.choiceIndex=0;saved.complete=false;state.completed=state.completed.filter(step=>step!==8)}
  saved.ruleSignature=signature;saved.schemaVersion=2;saved.choiceIndex=Math.max(0,Number(saved.choiceIndex)||0);
  const plan=initialItemPlan();
  if(typeof saved.choiceIndex!=='number'||isNaN(saved.choiceIndex)||saved.choiceIndex<0||saved.choiceIndex>plan.length){
    const next=plan.findIndex(choice=>!saved.grants[itemChoiceGrantId(choice)]);saved.choiceIndex=next<0?plan.length:next;
  }
  return saved;
}
function financesState(){
  const level=validCharacterLevel(state.identity.initialLevel);
  if(!state.finances||typeof state.finances!=='object')state.finances={startingLevel:level,levelOneTibars:0,spent:0,rewardFunds:0};
  const value=state.finances;value.startingLevel=level;
  value.levelOneTibars=Math.max(0,Number(value.levelOneTibars)||0);value.spent=Math.max(0,Number(value.spent)||0);
  value.rewardFunds=Math.max(0,Number(value.rewardFunds)||0);
  return value;
}
function startingFunds(){
  const value=financesState();
  let base=value.startingLevel===1?value.levelOneTibars:(STARTING_FUNDS[value.startingLevel]||0);
  base+=originMoneyBonus();
  return base;
}
function remainingFunds(){const value=financesState();return Math.max(0,startingFunds()+(value.rewardFunds||0)-value.spent)}
function addItemToHeroBackpack(itemId,quantity=1,options={},customItemObj=null){
  const source=options.source||'reward';
  const customList=(typeof state!=='undefined'&&state?.customItems)||[];
  const catalog=new Map([...(DATA.pdfItems||[]),...customList].map(i=>[i.id,i]));
  const item=customItemObj||catalog.get(itemId);
  const load=typeof sheetInventoryLoad==='function'?sheetInventoryLoad():null;
  const itemSpaces=(Number(item?.espacos)||0)*quantity;
  if(load&&((load.used+itemSpaces)>load.maximum)){
    if(typeof toast==='function')toast(`Carga máxima excedida! Não é possível carregar mais de ${load.maximum} espaços.`);
    return false;
  }

  const saved=arsenalState();let profiles;
  try{profiles=JSON.parse(saved.storage[ARSENAL_PROFILES_KEY]||'{}')}catch{profiles={}}
  let profile=profiles.profiles?.find(item=>item.id==='ficha-ativa')||profiles.profiles?.find(item=>item.id===profiles.activeId);
  if(!profile){profile={id:'ficha-ativa',backpack:[]};profiles.profiles=[profile]}
  const isContraptionOrCustom = Boolean(customItemObj?.engenhocaInfo || customItemObj?.contraptionId || customItemObj?.attachedItem || item?.engenhocaInfo || item?.categoriaId === 'engenhoca');
  const existing = isContraptionOrCustom ? null : profile.backpack.find(entry=>entry.itemId===itemId&&!entry.improvements?.length&&!entry.options?.customName&&!entry.engenhocaInfo);
  if(existing){
    existing.quantity=(Number(existing.quantity)||1)+quantity;
    if(source==='craft')existing.crafted=true;
  }else{
    const entry={
      itemId,
      quantity,
      itemName:customItemObj?.nome||item?.nome||itemId,
      displayName:customItemObj?.nome||item?.nome||itemId,
      tipo: customItemObj?.tipo || item?.tipo,
      categoriaId: customItemObj?.categoriaId || item?.categoriaId,
      espacos: Number(customItemObj?.espacos ?? item?.espacos ?? 1),
      acquisition:{source,grantId:source+':'+Date.now()+':'+Math.random().toString(36).slice(2,7)}
    };
    if(source==='craft')entry.crafted=true;
    if(options.customName){entry.options={customName:options.customName};entry.displayName=options.customName}
    if(item?.adicionado)entry.adicionado=true;
    if(customItemObj?.improvements?.length)entry.improvements=[...customItemObj.improvements];
    if(customItemObj?.melhorias?.length)entry.melhorias=[...customItemObj.melhorias];
    if(customItemObj?.contraptionId || isContraptionOrCustom)entry.contraptionId=customItemObj?.contraptionId||itemId;
    if(customItemObj?.attachedItem)entry.attachedItem={...customItemObj.attachedItem};
    if(customItemObj?.engenhocaInfo)entry.engenhocaInfo={...customItemObj.engenhocaInfo};
    if(Array.isArray(customItemObj?.apparatuses))entry.apparatuses=[...customItemObj.apparatuses];
    if(Array.isArray(customItemObj?.aparatos))entry.aparatos=[...customItemObj.aparatos];
    if(item?.preco?.valor!=null){
      entry.customPrice=Number(item.preco.valor);
      entry.price=Number(item.preco.valor);
      entry.preco={...item.preco};
    }
    profile.backpack.push(entry);
  }
  saved.storage[ARSENAL_PROFILES_KEY]=JSON.stringify(profiles);
  persistNow();
  if(state.finished&&typeof saveFinishedCharacter==='function')saveFinishedCharacter();
  renderStage();
  return true;
}
function addRewardItemToBackpack(itemId,quantity=1,options={},customItemObj=null){
  return addItemToHeroBackpack(itemId,quantity,{...options,source:'reward'},customItemObj);
}
function addCraftedItemToBackpack(itemId,quantity=1,options={},customItemObj=null){
  return addItemToHeroBackpack(itemId,quantity,{...options,source:'craft'},customItemObj);
}
function formatTibars(value){return 'T$ '+Number(value||0).toLocaleString('pt-BR')}
function renderStartingMoneyPanel(){
  const finances=financesState();
  return panel('Dinheiro inicial','<div class="grid two"><label class="field"><span>Quantidade de tibares</span><input class="input" data-field="levelOneTibars" type="number" min="0" step="0.01" placeholder="0" value="'+(finances.startingLevel===1?(finances.levelOneTibars||''):startingFunds())+'"'+(finances.startingLevel===1?'':' disabled')+'></label><div class="summary-card"><small>Saldo disponível</small><strong>'+formatTibars(remainingFunds())+'</strong></div></div>');
}
function initialItemPlan(){
  const cls=classById(state.identity.classId),proficiencies=new Set(characterProficiencies()),arcanist=state.identity.classId==='arcanista'||DATA.classInheritance[state.identity.classId]==='arcanista',choices=[];
  // 1. Arma simples
  choices.push({id:'simple',title:'Escolha uma arma simples (Opcional)',type:'arma',category:'simples'});
  // 2. Arma marcial e exótica (se proficiente)
  if(proficiencies.has('armas_marciais'))choices.push({id:'martial',title:'Escolha uma arma marcial',type:'arma',category:'marcial'});
  if(proficiencies.has('armas_exoticas'))choices.push({id:'exotic',title:'Escolha uma arma exótica',type:'arma',category:'exotica'});
  // 3. Armadura (se aplicável)
  if(!arcanist)choices.push({id:'armor',title:'Escolha uma armadura',type:'armadura',names:['Armadura de Couro','Couro Batido','Gibão de Peles',...(proficiencies.has('armaduras_pesadas')?['Brunea']:[])]});
  // 4. Origem
  const originBenefits=state.origin?.benefits||[];
  if(originBenefits.includes('unique:heranca')){
    choices.push({id:'origin-heranca-1000',title:'Herança · Escolha um item de até T$ 1.000',source:'origin',isBudgetGrant:true,maxBudget:1000});
  }else if(originBenefits.includes('unique:heranca_2000')){
    choices.push({id:'origin-heranca-2000',title:'Herança · Escolha um item de até T$ 2.000',source:'origin',isBudgetGrant:true,maxBudget:2000});
  }
  choices.push(...originItemChoices());
  // 5. Classe
  if(state.identity.classId==='samurai'){
    choices.push({id:'samurai-katana-ancestral',title:'Arma Ancestral · Katana Ancestral (Obrigatório)',source:'class',isSamuraiKatana:true,baseItemId:'katana',customName:'Katana Ancestral',maxBudget:500,maxImprovements:1,allowMaterials:false});
  }
  if(state.identity.classId==='nobre'){
    choices.push({id:'class-nobre-espolio',title:'Espólio · Escolha um item de até T$ 2.000',source:'class',isBudgetGrant:true,maxBudget:2000});
  }
  const inventorLevel = typeof characterClassLevel === 'function'
    ? characterClassLevel('inventor')
    : (Array.isArray(state.progression) && state.progression.length > 0
        ? state.progression.filter(row => row.classId === 'inventor').length
        : (state.identity.classId === 'inventor' ? (Number(state.identity.plannedLevel) || 1) : 0));
  if(inventorLevel >= 1){
    choices.push({id:'class-inventor-prototipo',title:'Protótipo · Escolha um item de até T$ 500',source:'class',isBudgetGrant:true,maxBudget:500,maxImprovements:1});
  }
  if (inventorLevel >= 2) {
    if (inventorLevel < 5) {
      choices.push({
        id: 'class-inventor-fabricar-item-superior',
        title: 'Fabricar Item Superior · Item Superior (até T$ 2.000)',
        source: 'class',
        isBudgetGrant: true,
        maxBudget: 2000,
        maxImprovements: 1,
        allowMaterials: true
      });
    } else {
      const maxImprovements = inventorLevel >= 11 ? 4 : (inventorLevel >= 8 ? 3 : 2);
      choices.push({
        id: 'class-inventor-fabricar-item-superior',
        title: `Fabricar Item Superior · Item Superior (até ${maxImprovements} melhorias)`,
        source: 'class',
        isBudgetGrant: true,
        unlimitedBudget: true,
        maxBudget: Infinity,
        maxImprovements,
        allowMaterials: true
      });
    }
  }
  if(state.identity.classId==='inovador'){
    choices.push({id:'class-inovador-bom-melhor',title:'Do Bom e do Melhor · Escolha um item de até T$ 500',source:'class',isBudgetGrant:true,maxBudget:500,types:['arma','armadura','escudo']});
  }
  return choices;
}
function originItemChoice(name,kind,origin,index){
  const text=slug(name).replace(/_/g,' '),base={id:'origin-'+kind+'-'+slug(origin?.id||origin?.nome||'origem')+'-'+index,title:'Origem '+(origin?.nome||'')+' · '+name.replace(/\s*\(escolha um\)\s*/i,''),source:'origin',filterLabel:'Escolha'};
  if(/joia (?:de|da) familia|simbolo de sua heranca/.test(text))return{...base,names:['Joia de Família']};
  if(/joia fals/.test(text))return{...base,names:['Joia Falsificada']};
  if(/item artistico/.test(text))return{...base,names:['Item Artístico']};
  if(/cao de caca.*cavalo.*ponei.*trobo/.test(text))return{...base,names:['Cão de Caça','Cavalo','Pônei','Trobo'],branches:[{id:'cao',label:'Cão de Caça',names:['Cão de Caça']},{id:'cavalo',label:'Cavalo',names:['Cavalo']},{id:'ponei',label:'Pônei',names:['Pônei']},{id:'trobo',label:'Trobo',names:['Trobo']}]};
  if(/somando ate.*500|pista misteriosa do seu passado/i.test(text))return{...base,title:'Amnésico · Pista do Passado (até T$ 500)',isBudgetGrant:true,maxBudget:500};
  if(/item que voce possa fabricar.*(?:t|t\$)?\s*50/i.test(text))return{...base,title:'Artesão · Item Fabricável (até T$ 50)',isBudgetGrant:true,maxBudget:50,isCraftableChoice:true};
  if(/tatuagem ou outro adereco de sua gangue/.test(text))return{...base,names:['Tatuagem ou Adereço de Gangue'],defaultOptions:{customName:'Tatuagem da Gangue'}};
  if(/tres bolas coloridas para malabarismo/.test(text))return{...base,names:['Três Bolas Coloridas']};
  if(/item sem valor recebido de um admirador/.test(text))return{...base,names:['Lembrança de um Admirador'],defaultOptions:{customName:'Fita de Seda'}};
  if(/pequeno animal de estimacao/.test(text))return{...base,names:['Pequeno Animal de Estimação'],defaultOptions:{customName:'Esquilo'}};
  if(/uma arma de corte a sua escolha/.test(text))return{...base,type:'arma',categories:['simples','marcial'],damageTypes:['corte']};
  if(/uma arma de ate.*500/i.test(text))return{...base,type:'arma',maxPrice:500};
  if(/(?:t|t\$)?\s*100 em itens alquimicos/i.test(text))return{...base,title:'Coureiro · Itens Alquímicos (até T$ 100)',isBudgetGrant:true,maxBudget:100,types:['alquimico']};
  if(/instrumentos de cozinheiro aprimorados/.test(text))return{...base,names:['Instrumentos de Cozinheiro Aprimorados'],defaultOptions:{customName:'Facas do Chef'}};
  if(/instrumentos de barbeiro/.test(text))return{...base,names:['Instrumentos de Barbeiro'],defaultOptions:{customName:'Navalha do Barbeiro'}};
  if(/instrumentos de coureiro/.test(text))return{...base,names:['Instrumentos de Coureiro'],defaultOptions:{customName:'Sovelas de Couro'}};
  if(/uma bola.*com uma cara pintada|objeto simples.*cara pintada/.test(text))return{...base,names:['Objeto com Rosto Pintado'],defaultOptions:{customName:'Wilson'}};
  if(/instrumento musical de ate.*35/i.test(text))return{...base,category:'instrumento',maxPrice:35};
  if(/instrumentos de pescador/.test(text))return{...base,names:['Instrumentos de Pescador'],defaultOptions:{customName:'Varas e Anzóis'}};
  if(/instrumentos de oficio(?:\s*qualquer)?/i.test(text))return{...base,names:['Instrumentos de Ofício'],isCraftTool:true};
  if(/estojo de disfarces ou.*instrumento musical/.test(text))return{...base,names:['Estojo de Disfarces','Instrumento Musical','Instrumento Musical Exótico'],allowNamedOrFilter:true,branches:[{id:'disfarces',label:'Estojo de Disfarces',names:['Estojo de Disfarces']},{id:'musical',label:'Instrumento Musical',names:['Instrumento Musical','Instrumento Musical Exótico']}]};
  if(/estojo de disfarces ou gazua/.test(text))return{...base,names:['Estojo de Disfarces','Gazua'],branches:[{id:'disfarces',label:'Estojo de Disfarces',names:['Estojo de Disfarces']},{id:'gazua',label:'Gazua',names:['Gazua']}]};
  if(/gazua ou instrumentos de oficio/.test(text))return{...base,names:['Gazua','Instrumentos de Ofício'],branches:[{id:'gazua',label:'Gazua',names:['Gazua']},{id:'oficio',label:'Instrumentos de Ofício',names:['Instrumentos de Ofício'],isCraftTool:true}]};
  if(/rolo de macarrao ou martelo de carne/.test(text))return{...base,type:'arma',names:['Rolo de Macarrão','Martelo de Carne'],branches:[{id:'macarrao',label:'Rolo de Macarrão',type:'arma',names:['Rolo de Macarrão']},{id:'carne',label:'Martelo de Carne',type:'arma',names:['Martelo de Carne']}]};
  if(/instrumentos de oficio ou uma arma simples/.test(text))return{...base,categories:['simples'],names:['Instrumentos de Ofício'],allowNamedOrFilter:true,branches:[{id:'oficio',label:'Instrumentos de Ofício',names:['Instrumentos de Ofício'],isCraftTool:true},{id:'arma_simples',label:'Arma Simples',type:'arma',categories:['simples']}]};
  if(/arma marcial ou (?:um )?instrumento musical/.test(text))return{...base,categories:['marcial'],names:['Instrumento Musical','Instrumento Musical Exótico'],allowNamedOrFilter:true,branches:[{id:'arma_marcial',label:'Arma Marcial',type:'arma',categories:['marcial']},{id:'musical',label:'Instrumento Musical',names:['Instrumento Musical','Instrumento Musical Exótico']}]};
  if(/arma simples ou marcial de ataque a distancia/.test(text))return{...base,type:'arma',categories:['simples','marcial'],combat:'a_distancia',branches:[{id:'simples',label:'Arma Simples à Distância',type:'arma',categories:['simples'],combat:'a_distancia'},{id:'marcial',label:'Arma Marcial à Distância',type:'arma',categories:['marcial'],combat:'a_distancia'}]};
  if(/arma simples ou marcial.*nome pomposo/i.test(text))return{...base,title:'Futura Lenda · Arma com Nome Pomposo',type:'arma',categories:['simples','marcial'],requiresCustomName:true,customNamePlaceholder:'Ex: O Destruidor de Mundos, A Lâmina da Alvorada...',branches:[{id:'simples',label:'Arma Simples',type:'arma',categories:['simples']},{id:'marcial',label:'Arma Marcial',type:'arma',categories:['marcial']}]};
  if(/^(?:uma )?arma simples ou marcial\b/.test(text))return{...base,type:'arma',categories:['simples','marcial'],branches:[{id:'simples',label:'Arma Simples',type:'arma',categories:['simples']},{id:'marcial',label:'Arma Marcial',type:'arma',categories:['marcial']}]};
  if(/arco longo ou machado de batalha/.test(text))return{...base,type:'arma',names:['Arco Longo','Machado de Batalha'],branches:[{id:'arco',label:'Arco Longo',names:['Arco Longo']},{id:'machado',label:'Machado de Batalha',names:['Machado de Batalha']}]};
  if(/madeira tollon/i.test(text))return{...base,title:'Lenhador de Tollon · Item de Madeira Tollon',type:'arma',names:['Machadinha','Machado de Batalha','Bordão','Arco Longo'],branches:[{id:'machadinha',label:'Machadinha de Madeira Tollon',names:['Machadinha']},{id:'machado',label:'Machado de Batalha de Madeira Tollon',names:['Machado de Batalha']},{id:'bordao',label:'Bordão de Madeira Tollon',names:['Bordão']},{id:'arco',label:'Arco Longo de Madeira Tollon',names:['Arco Longo']}]};
  if(/corcel do deserto ou dromedario/i.test(text))return{...base,title:'Nômade Sar-Allan · Montaria do Deserto',names:['Corcel do Deserto','Cavalo'],branches:[{id:'corcel',label:'Corcel do Deserto',names:['Corcel do Deserto']},{id:'dromedario',label:'Dromedário',names:['Cavalo']}]};
  if(/arma marcial encontrada no corpo/i.test(text))return{...base,title:'Prisioneiro das Catacumbas · Arma Marcial',type:'arma',categories:['marcial']};
  if(/cota de malha ou escudo pesado/.test(text))return{...base,names:['Cota de Malha','Escudo Pesado'],branches:[{id:'cota',label:'Cota de Malha',names:['Cota de Malha']},{id:'escudo',label:'Escudo Pesado',names:['Escudo Pesado']}]};
  if(/escudo leve ou pesado/.test(text))return{...base,type:'escudo',names:['Escudo Leve','Escudo Pesado'],branches:[{id:'leve',label:'Escudo Leve',type:'escudo',names:['Escudo Leve']},{id:'pesado',label:'Escudo Pesado',type:'escudo',names:['Escudo Pesado']}]};
  if(/arco longo ou katana/.test(text))return{...base,type:'arma',names:['Arco Longo','Katana'],branches:[{id:'arco',label:'Arco Longo',type:'arma',names:['Arco Longo']},{id:'katana',label:'Katana',type:'arma',names:['Katana']}]};
  if(/camisa bufante ou traje de seda/.test(text))return{...base,names:['Camisa Bufante','Traje de Seda'],branches:[{id:'bufante',label:'Camisa Bufante',names:['Camisa Bufante']},{id:'seda',label:'Traje de Seda',names:['Traje de Seda']}]};
  if(/arma simples (?:corpo a corpo|cac)/.test(text))return{...base,type:'arma',categories:['simples'],combat:'corpo_a_corpo'};
  if(/arma marcial (?:corpo a corpo|cac)/.test(text))return{...base,type:'arma',categories:['marcial'],combat:'corpo_a_corpo'};
  if(/arma marcial ou exotica/.test(text))return{...base,type:'arma',categories:['marcial','exotica'],branches:[{id:'marcial',label:'Arma Marcial',type:'arma',categories:['marcial']},{id:'exotica',label:'Arma Exótica',type:'arma',categories:['exotica']}]};
  if(/katana superior com uma melhoria/i.test(text))return{...base,title:'Aristocrata Dai’zenshi · Katana Superior',isAristocrataKatana:true,baseItemId:'katana',names:['Katana'],maxBudget:2000,maxImprovements:1,allowMaterials:false};
  if(/tranqueiras resgatadas do mar/i.test(text))return{...base,title:'Catador da Cidade Velha · Tranqueiras Resgatadas',names:['Tranqueiras resgatadas do mar'],requiresCustomName:true,customNamePlaceholder:'Ex: Garrafa com mapa antigo, conchas raras, madeira de naufrágio…',directSaleValue:100};
  if(/^(?:uma )?armadura leve$/.test(text))return{...base,type:'armadura',category:'leve',categories:['leve']};
  if(/item qualquer de ate.*100.*mundo natal|mundo natal/i.test(text))return{...base,title:'De Outro Mundo · Item Empunhável (até T$ 100)',isBudgetGrant:true,maxBudget:100,types:['arma','item_geral','esoterico','escudo'],requiresCustomName:true,customNamePlaceholder:'Ex: Relíquia Tecnológica, Artefato Quântico...'};
  if(/arma marcial tradicional ana/.test(text))return{...base,title:'Origem Anão de Armas · Arma Tradicional Anã',type:'arma',categories:['marcial'],dwarfWeaponOnly:true};
  if(/^(?:uma )?arma marcial$/.test(text))return{...base,type:'arma',categories:['marcial']};
  if(/^(?:uma )?arma simples$/.test(text))return{...base,type:'arma',categories:['simples']};
  if(/ferramenta pesada.*(?:maca ou lanca|lanca ou maca)/.test(text))return{...base,type:'arma',names:['Ferramenta Pesada','Ferramenta Pesada (Trabalhador)'],branches:[{id:'maca',label:'Ferramenta Pesada (Maça)',names:['Ferramenta Pesada','Ferramenta Pesada (Trabalhador)'],defaultOptions:{weaponModel:'maca',customName:'Malho'}},{id:'lanca',label:'Ferramenta Pesada (Lança)',names:['Ferramenta Pesada','Ferramenta Pesada (Trabalhador)'],defaultOptions:{weaponModel:'lanca',customName:'Picareta'}}]};
  if(/ferramenta pesada.*maca|^uma ferramenta pesada\b/.test(text))return{...base,type:'arma',names:['Ferramenta Pesada','Ferramenta Pesada (Escravo)'],defaultOptions:{weaponModel:'maca',customName:'Malho'}};
  if(/ferramenta agricola/.test(text))return{...base,type:'arma',names:['Ferramenta Agrícola','Ferramenta Agrícola (Fazendeiro)'],defaultOptions:{weaponModel:'lanca',customName:'Forcado'}};
  if(/instrumento musical exotico/.test(text))return{...base,names:['Instrumento Musical Exótico'],defaultOptions:{customName:'Sanfona',customSpaces:2}};
  if(/(?:^|\b)instrumento musical\b/.test(text))return{...base,names:['Instrumento Musical','Instrumento Musical Exótico'],branches:[{id:'comum',label:'Instrumento Musical (Comum)',names:['Instrumento Musical'],defaultOptions:{customName:'Bandolim'}},{id:'exotico',label:'Instrumento Musical Exótico',names:['Instrumento Musical Exótico'],defaultOptions:{customName:'Sanfona',customSpaces:2}}]};
  if(/colecao de livros|livros?\b/.test(text))return{...base,names:['Coleção de Livros'],defaultOptions:{knowledge:'',customName:''}};
  if(/joia de fam[íi]lia|um simbolo de sua heranca/.test(text))return{...base,title:(origin?.nome||'Origem')+' · Joia de Família',names:['Joia de Família'],requiresCustomName:true,customNamePlaceholder:'Ex: Colar de esmeralda, Anel com brasão...'};
  if(/item art[íi]stico/.test(text))return{...base,title:(origin?.nome||'Origem')+' · Item Artístico',names:['Item Artístico'],requiresCustomName:true,customNamePlaceholder:'Ex: Escultura de Arquimago, Tapeçaria Antiga...'};
  if(/joia falsificada/.test(text))return{...base,title:(origin?.nome||'Origem')+' · Joia Falsificada',names:['Joia Falsificada'],requiresCustomName:true,customNamePlaceholder:'Ex: Anel de latão, Tiara de vidro...'};
  if(/animal n[ãa]o combativo|pequeno animal/.test(text))return{...base,title:(origin?.nome||'Origem')+' · Animal de Estimação',names:['Animal Não Combativo','Pequeno Animal de Estimação'],requiresCustomName:true,customNamePlaceholder:'Ex: Galinha, Gato, Esquilo...'};
  if(/tatuagem|adere[çc]o de gangue/.test(text))return{...base,title:(origin?.nome||'Origem')+' · Tatuagem ou Adereço de Gangue',names:['Tatuagem ou Adereço de Gangue'],requiresCustomName:true,customNamePlaceholder:'Ex: Tatuagem da Serpente, Caveira...'};
  if(/lembran[çc]a de (?:um )?admirador|item sem valor.*admirador/.test(text))return{...base,title:(origin?.nome||'Origem')+' · Lembrança de Admirador',names:['Lembrança de um Admirador'],requiresCustomName:true,customNamePlaceholder:'Ex: Fita de seda, Carta perfumada...'};
  const price=Number((name.match(/T\$\s*([\d.]+)/i)||[])[1]?.replace(/\./g,''));
  if(/um ou mais itens|item que voce possa fabricar|item estrangeiro|item recebido de seu mestre/.test(text))return{...base,maxPrice:price||500};
  return null;
}
function originItemChoices(){
  const choices=[];
  for(const [kind,origin] of [['standard',selectedStandardOrigin()],['regional',state.origin.mode==='dual'?selectedRegionalOrigin():null]]){
    const originSlug = slug(origin?.nome || '');
    if((originSlug === 'nobre_zakharoviano' || origin?.nome === 'Nobre Zakharoviano')){
      choices.push({
        id: 'origin-'+kind+'-nobre-zakharov-arma',
        title: 'Nobre Zakharoviano · Arma Superior (1 melhoria)',
        source: 'origin',
        type: 'arma',
        categories: ['simples','marcial'],
        maxImprovements: 1,
        allowMaterials: false
      });
    }
    (origin?.itens||[]).forEach((name,index)=>{
      if(/dois equipamentos de aventura.*150/i.test(slug(name).replace(/_/g,' '))){
        choices.push(
          { id: 'origin-'+kind+'-catador-1', title: 'Catador da Catástrofe · Equipamento de Aventura 1 (até T$ 150)', source: 'origin', category: 'aventura', isBudgetGrant: true, maxBudget: 150 },
          { id: 'origin-'+kind+'-catador-2', title: 'Catador da Catástrofe · Equipamento de Aventura 2 (até T$ 150)', source: 'origin', category: 'aventura', isBudgetGrant: true, maxBudget: 150 }
        );
        return;
      }
      if(/tres pergaminhos de magias arcanas/i.test(slug(name).replace(/_/g,' '))){
        for(let i=1; i<=3; i++){
          choices.push({
            id: 'origin-'+kind+'-turista-'+i,
            title: 'Turista da Academia · Pergaminho Arcano ' + i + ' (1º Círculo)',
            source: 'origin',
            category: 'pergaminho',
            names: ['Pergaminho de Magia'],
            defaultOptions: { customName: 'Pergaminho Arcano de 1º Círculo' }
          });
        }
        return;
      }
      const choice=originItemChoice(name,kind,origin,index);
      if(choice)choices.push(choice);
    });
  }
  return choices;
}
function itemChoiceGrantId(choice){return (choice?.source==='origin'?'origin-choice:':choice?.source==='class'?'class-choice:':'choice:')+choice.id}
function currentItemChoice(){return initialItemPlan()[arsenalState().choiceIndex]||null}

function hasAprendizDeDrogadora(){
  const std = typeof selectedStandardOrigin === 'function' ? selectedStandardOrigin() : null;
  const reg = typeof selectedRegionalOrigin === 'function' ? selectedRegionalOrigin() : null;
  return Boolean(std?.nome === 'Aprendiz de Drogadora' || reg?.nome === 'Aprendiz de Drogadora' || state?.origin?.regional === 'Aprendiz de Drogadora' || state?.origin?.standard === 'Aprendiz de Drogadora' || state?.origin?.regional === 'aprendiz_de_drogadora');
}

function cleanSkillsAfterOriginChange(freeSkillsList, originSkillsList){
  if(Array.isArray(freeSkillsList) && Array.isArray(originSkillsList)){
    const originSet = new Set(originSkillsList);
    return freeSkillsList.filter(s => !originSet.has(s));
  }
  const originSkills = new Set([
    ...(typeof originSkillIds === 'function' ? originSkillIds() : []),
    ...(typeof regionalSkillIds === 'function' ? regionalSkillIds() : [])
  ]);
  if(originSkills.size === 0) return;
  if(Array.isArray(state.skills?.class)){
    state.skills.class = state.skills.class.filter(s => !originSkills.has(s));
  }
  if(Array.isArray(state.skills?.int)){
    state.skills.int = state.skills.int.filter(s => !originSkills.has(s));
  }
  if(Array.isArray(state.skills?.race)){
    state.skills.race = state.skills.race.filter(s => !originSkills.has(s));
  }
}

function resetOriginItemsOnOriginChange(currentChoices){
  if(currentChoices && typeof currentChoices === 'object'){
    return {};
  }
  if(typeof redoInitialItems === 'function' && state.arsenal?.complete){
    redoInitialItems();
  } else {
    if(state.arsenal){
      state.arsenal.complete = false;
      state.arsenal.pending = null;
      state.arsenal.choiceIndex = 0;
      state.arsenal.grants = {};
      state.arsenal.operations = {};
      state.arsenal.unresolved = [];
    }
    try{
      const saved = typeof arsenalState === 'function' ? arsenalState() : state.arsenal;
      if(saved?.storage && typeof ARSENAL_PROFILES_KEY !== 'undefined'){
        let profiles = JSON.parse(saved.storage[ARSENAL_PROFILES_KEY] || '{}');
        let profile = profiles.profiles?.find(item => item.id === 'ficha-ativa') || profiles.profiles?.find(item => item.id === profiles.activeId);
        if(profile && Array.isArray(profile.backpack)){
          profile.backpack = profile.backpack.filter(entry => entry.acquisition?.source !== 'origin' && entry.origem !== 'origin' && !String(entry.acquisition?.grantId || '').startsWith('origin:'));
          saved.storage[ARSENAL_PROFILES_KEY] = JSON.stringify(profiles);
        }
      }
    }catch(_e){}
  }
  state.completed = (state.completed || []).filter(step => step !== 8);
}

function characterPartnerLimit(level = Number(state.identity?.plannedLevel) || 1){
  let baseLimit = 1;
  if(level >= 17) baseLimit = 3;
  else if(level >= 5) baseLimit = 2;

  // Bônus de habilidades que aumentam o limite de parceiros (ex: Nobre - Comitiva)
  let bonusLimit = 0;
  const nobreLvl = (typeof characterClassLevel === 'function' ? characterClassLevel('nobre') : 0) ||
    ((state.identity?.classId === 'nobre' ? 1 : 0) + (state.progression || []).filter(r => (r.classId || state.identity?.classId) === 'nobre').length);
  const hasComitiva = (typeof characterHasFeature === 'function' && characterHasFeature('comitiva')) ||
    (state.progression || []).some(r => r.powerId === 'nobre_comitiva' || r.powerId === 'comitiva') ||
    (Array.isArray(state.powers?.general) && (state.powers.general.includes('nobre_comitiva') || state.powers.general.includes('comitiva')));
  if(hasComitiva && nobreLvl >= 5){
    bonusLimit += 1;
    if(nobreLvl >= 11){
      bonusLimit += 1;
    }
  }

  const maxPartners = baseLimit + bonusLimit;
  return maxPartners;
}

function characterPartnerLimitDetails(level = Number(state.identity?.plannedLevel) || 1){
  const maxPartners = characterPartnerLimit(level);
  const maxVeterans = level >= 17 ? 2 : (level >= 5 ? 1 : 0);
  const maxMasters = level >= 17 ? 1 : 0;
  return { maxPartners, maxVeterans, maxMasters };
}

function characterMaxPartners(){
  const info = characterPartnerLimit();
  return typeof info === 'number' ? info : (info.maxPartners || 1);
}

function ensureOriginPartners(){
  state.partners = Array.isArray(state.partners) ? state.partners : [];
  const std = typeof selectedStandardOrigin === 'function' ? selectedStandardOrigin() : null;
  const reg = typeof selectedRegionalOrigin === 'function' ? selectedRegionalOrigin() : null;
  const isUbaneri = std?.nome === 'Andarilho Ubaneri' || reg?.nome === 'Andarilho Ubaneri' || std?.nome === 'Emissário Ubaneri' || reg?.nome === 'Emissário Ubaneri' || ['andarilho_ubaneri', 'emissario_ubaneri'].includes(state.origin?.regional) || ['andarilho_ubaneri', 'emissario_ubaneri'].includes(state.origin?.standard);
  const hasAlikunha = state.partners.some(p => p.id === 'alikunha' || p.nome === 'Alikunhá');
  const ubaneriOriginName = (reg?.nome === 'Emissário Ubaneri' || state.origin?.regional === 'emissario_ubaneri') ? 'Emissário Ubaneri' : 'Andarilho Ubaneri';
  if(isUbaneri && !hasAlikunha){
    state.partners.push({
      id: 'alikunha',
      nome: 'Alikunhá',
      tipo: 'alikunha',
      partnerType: 'Guardião',
      grau: 'iniciante',
      tier: 'iniciante',
      origem: ubaneriOriginName,
      countsTowardsLimit: false,
      ignoraLimite: true,
      descricao: 'Um réptil bípede de Ubani, companheiro fiel que não conta no limite de parceiros.',
      benefit: '+2 na Defesa (Guardião Iniciante).'
    });
  } else if(!isUbaneri && hasAlikunha){
    state.partners = state.partners.filter(p => p.id !== 'alikunha' && !['Andarilho Ubaneri', 'Emissário Ubaneri'].includes(p.origem));
  }
  const isTumarkhan = std?.nome === 'Ginete de Tumarkhân' || reg?.nome === 'Ginete de Tumarkhân' || ['ginete_de_tumarkhan'].includes(state.origin?.regional) || ['ginete_de_tumarkhan'].includes(state.origin?.standard);
  const hasTumarkhanPartner = state.partners.some(p => p.id === 'tumarkhan' || p.nome === 'Tumarkhân');
  if(isTumarkhan && !hasTumarkhanPartner){
    state.partners.push({
      id: 'tumarkhan',
      nome: 'Tumarkhân',
      tipo: 'tumarkhan',
      partnerType: 'Montaria',
      grau: 'iniciante',
      tier: 'iniciante',
      origem: 'Ginete de Tumarkhân',
      countsTowardsLimit: false,
      ignoraLimite: true,
      descricao: 'Uma montaria reptiliana originária de Khubar, companheiro de montaria que não conta no limite de parceiros.',
      benefit: 'Montaria iniciante. Concede +2 em testes de Adestramento e Cavalgar.'
    });
  } else if(!isTumarkhan && hasTumarkhanPartner){
    state.partners = state.partners.filter(p => p.id !== 'tumarkhan' && p.origem !== 'Ginete de Tumarkhân');
  }
  const isIrmaoSemEsporas = std?.nome === 'Irmão sem Esporas' || reg?.nome === 'Irmão sem Esporas' || ['irmao_sem_esporas'].includes(state.origin?.regional) || ['irmao_sem_esporas'].includes(state.origin?.standard);
  const hasIrmaoCavalo = state.partners.some(p => p.id === 'irmao_cavalo' || p.nome === 'Irmão Cavalo');
  if(isIrmaoSemEsporas && !hasIrmaoCavalo){
    state.partners.push({
      id: 'irmao_cavalo',
      nome: 'Irmão Cavalo',
      tipo: 'irmao_cavalo',
      partnerType: 'Montaria',
      grau: 'iniciante',
      tier: 'iniciante',
      origem: 'Irmão sem Esporas',
      countsTowardsLimit: false,
      ignoraLimite: true,
      descricao: 'Um cavalo de guerra criado com você nas estepes de Namalkah/Uivantes. Não conta no limite de parceiros.',
      benefit: 'Montaria iniciante. Concede +1 em testes de ataque e +1 em Reflexos.'
    });
  } else if(!isIrmaoSemEsporas && hasIrmaoCavalo){
    state.partners = state.partners.filter(p => p.id !== 'irmao_cavalo' && p.origem !== 'Irmão sem Esporas');
  }
  const isRecrutaFenix = std?.nome === 'Recruta da Fênix' || reg?.nome === 'Recruta da Fênix' || ['recruta_da_fenix'].includes(state.origin?.regional) || ['recruta_da_fenix'].includes(state.origin?.standard);
  const hasGrifo = state.partners.some(p => p.id === 'grifo_iniciante' || p.nome === 'Grifo Iniciante' || p.tipo === 'grifo_iniciante');
  if(isRecrutaFenix && !hasGrifo){
    state.partners.push({
      id: 'grifo_iniciante',
      nome: 'Grifo Iniciante',
      tipo: 'grifo_iniciante',
      partnerType: 'Montaria',
      grau: 'iniciante',
      tier: 'iniciante',
      origem: 'Recruta da Fênix',
      countsTowardsLimit: false,
      ignoraLimite: true,
      descricao: 'Um jovem grifo montaria da Ordem da Fênix. Não conta no limite de parceiros.',
      benefit: 'Montaria iniciante. Concede +1 PV por nível e redução de fogo 5.'
    });
  } else if(!isRecrutaFenix && hasGrifo){
    state.partners = state.partners.filter(p => p.id !== 'grifo_iniciante' && p.origem !== 'Recruta da Fênix');
  }
}

