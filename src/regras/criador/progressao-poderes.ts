const finalAttrsBeforeProgression=finalAttrs;
finalAttrs=function(){return RegrasProgressao.atributos(finalAttrsBeforeProgression(),state.progression,row=>slug(progressionPowerById(row.powerId)?.nome)==='autoridade_eclesiastica'&&state.deity.name==='Marah')};
function progressionTier(level){return RegrasProgressao.patamar(level)}
// A mesma regra governa a lista e a confirmação: repetir o uso de uma
// habilidade não significa poder adquirir o poder novamente.
function powerAllowsRepeat(power){
  return power?.id==='classe_aumento_de_atributo'||/pode (?:escolher|adquirir) (?:este|esse) poder (?:quantas vezes|mais de uma vez|outras vezes|mais vezes|várias vezes|uma vez por patamar)/i.test(power?.descricao||'');
}
const PROGRESSION_RACE_GROUP_IDS=new Set(['duende_presentes','kobold_talentos_do_bando','kallyanach_bencao_de_kallyadranoch']);
function progressionRacePowerId(groupId,optionId){return 'racial:'+encodeURIComponent(groupId)+':'+encodeURIComponent(optionId)}
function progressionRacePowerById(id){if(!String(id||'').startsWith('racial:'))return null;const parts=id.split(':');if(parts.length<3)return null;const group=racePowerGroups().find(item=>item.id===decodeURIComponent(parts[1])),option=group?.options.find(item=>choiceId(item)===decodeURIComponent(parts.slice(2).join(':')));return option?{id,nome:choiceName(option),descricao:option.descricao||'',raceGroup:group,raceOption:option,ok:true,reasons:[]}:null}
function progressionGeneralPowerId(id){return 'geral:'+encodeURIComponent(id)}
function progressionGeneralPowerById(id){if(!String(id||'').startsWith('geral:'))return null;const power=powerById(decodeURIComponent(String(id).slice(6)));return power?{...power,id,originalId:power.id,generalPower:power}:null}
function progressionDistinctionPowerId(distId,optionId){return 'distincao:'+encodeURIComponent(distId)+':'+encodeURIComponent(optionId)}
function progressionDistinctionPowerById(id){if(!String(id||'').startsWith('distincao:'))return null;const parts=id.split(':');if(parts.length<3)return null;const distId=decodeURIComponent(parts[1]),powerId=decodeURIComponent(parts.slice(2).join(':'));const catalog=(typeof DATA!=='undefined'&&Array.isArray(DATA?.distinctions))?DATA.distinctions:[];const dist=catalog.find(item=>item.id===distId);const power=dist?.poderes?.find(item=>item.id===powerId);return power?{...power,id,originalId:power.id,distinctionId:dist.id,distinctionName:dist.nome,distinctionPower:power,ok:true,reasons:[]}:null}
function progressionDistinctionActiveIds(){if(Array.isArray(state?.distinctions?.activeIds)&&state.distinctions.activeIds.length>0)return state.distinctions.activeIds;try{const raw=localStorage.getItem('forja-heroi-t20-v1');if(raw){const p=JSON.parse(raw);if(Array.isArray(p?.distinctions?.activeIds))return p.distinctions.activeIds}}catch(e){}return[]}
function progressionDistinctionOptions(index){const activeIds=progressionDistinctionActiveIds();if(!activeIds.length)return[];const catalog=(typeof DATA!=='undefined'&&Array.isArray(DATA?.distinctions))?DATA.distinctions:[];const progressionOwned=new Set(state.progression.filter((row,rowIndex)=>rowIndex!==index).map(row=>row.powerId));const ownedNames=new Set([...progressionOwnedPowerNames(index),...(typeof selectedGeneralPowers==='function'?selectedGeneralPowers().map(p=>p.nome):[])].filter(Boolean).map(slug));const attrs=finalAttrs();const trainedSkills=new Set(typeof allTrainedSkills==='function'?allTrainedSkills():[]);const options=[];for(const distId of activeIds){const dist=catalog.find(item=>item.id===distId);if(!dist||!Array.isArray(dist.poderes))continue;for(const power of dist.poderes){const id=progressionDistinctionPowerId(dist.id,power.id);const repeatable=powerAllowsRepeat(power);const reasons=[];if(!repeatable&&progressionOwned.has(id))reasons.push('Este poder de distinção já foi escolhido.');const reqs=typeof parsePowerRequirements==='function'?parsePowerRequirements(power):{atributos:{},nivel:null,pericias:[]};if(typeof RegrasProgressao!=='undefined'&&typeof RegrasProgressao.requisitosBasicos==='function'){reasons.push(...RegrasProgressao.requisitosBasicos(reqs,index+1,attrs,trainedSkills,id=>ATTR_LABEL[id],skillDisplayName))}const text=slug(power.preRequisitosTexto||'');for(const cand of dist.poderes){if(cand.id!==power.id&&text.includes(slug(cand.nome))&&!ownedNames.has(slug(cand.nome)))reasons.push('Requer '+cand.nome+'.')}options.push({...power,id,originalId:power.id,distinctionId:dist.id,distinctionName:dist.nome,distinctionPower:power,ok:reasons.length===0,reasons})}}return options}
function progressionDistinctionEligibility(power,index){if(!power)return{ok:false,reasons:['Poder de distinção não encontrado.']};const options=progressionDistinctionOptions(index);const found=options.find(opt=>opt.id===power.id);if(found)return{ok:found.ok,reasons:found.reasons};return{ok:false,reasons:['Poder de distinção indisponível para este nível ou pré-requisitos não atendidos.']}}
function progressionPowerById(id){return DATA.classPowers.find(power=>power.id===id)||progressionRacePowerById(id)||progressionGeneralPowerById(id)||progressionDistinctionPowerById(id)}
function progressionOwnedPowerNames(beforeIndex){return state.progression.slice(0,beforeIndex).map(row=>progressionPowerById(row.powerId)?.nome).filter(Boolean)}
function progressionRaceOptions(index){const tier=progressionTier(index+1),tierUsed=state.progression.some((row,rowIndex)=>rowIndex!==index&&String(row.powerId||'').startsWith('racial:')&&progressionTier(rowIndex+1)===tier);if(tierUsed)return[];const initiallyOwned=new Set(racePowerGroups().flatMap(group=>(state.powers.raceGroups[group.id]||[]).map(id=>group.id+'|'+id))),progressionOwned=new Set(state.progression.filter((row,rowIndex)=>rowIndex!==index).map(row=>row.powerId));return racePowerGroups().filter(group=>PROGRESSION_RACE_GROUP_IDS.has(group.id)).flatMap(group=>group.options.map(option=>{const id=progressionRacePowerId(group.id,choiceId(option)),repeatable=/mais de uma vez/i.test(option.descricao||''),reasons=[],text=option.descricao||'';if(!repeatable&&(initiallyOwned.has(group.id+'|'+choiceId(option))||progressionOwned.has(id)))reasons.push('Este poder racial já foi escolhido.');if((option.id==='kobold_talento_diferentao'||choiceId(option)==='diferentao'||slug(choiceName(option)).includes('diferentao'))&&(index+1)<5)reasons.push('Requer nível 5 de personagem.');const owned=new Set([...progressionOwnedPowerNames(index),...racePowerGroups().flatMap(item=>(state.powers.raceGroups[item.id]||[]).map(key=>choiceName(item.options.find(option=>choiceId(option)===key))))].filter(Boolean).map(slug));for(const candidate of group.options)if(candidate!==option&&slug(text).includes(slug(choiceName(candidate)))&&!owned.has(slug(choiceName(candidate))))reasons.push('Requer '+choiceName(candidate)+'.');return{id,nome:choiceName(option),descricao:text,raceGroup:group,raceOption:option,ok:reasons.length===0,reasons}}))}
function progressionRaceEligibility(power,index){
  if(!power)return{ok:false,reasons:['Poder racial não encontrado.']};
  const options=progressionRaceOptions(index);
  const found=options.find(opt=>opt.id===power.id);
  if(found)return{ok:found.ok,reasons:found.reasons};
  const tier=progressionTier(index+1);
  const tierUsed=state.progression.some((row,rowIndex)=>rowIndex!==index&&String(row.powerId||'').startsWith('racial:')&&progressionTier(rowIndex+1)===tier);
  if(tierUsed)return{ok:false,reasons:['Você já escolheu um poder racial neste patamar ('+tier+').']};
  return{ok:false,reasons:['Poder racial indisponível para este nível ou pré-requisitos não atendidos.']};
}
function ecclesiasticalAuthorityDescription(power){
  if(slug(power?.nome)!=='autoridade_eclesiastica')return power?.descricao||'';
  const choices=Object.values(state.identity.classChoices||{}),deity=state.deity.name||choices.find(value=>DATA.authorityEcclesiastical.byDeity[value]),specific=DATA.authorityEcclesiastical.byDeity[deity];
  return DATA.authorityEcclesiastical.general+(specific?' '+deity+': '+specific:' Escolha a divindade vinculada à habilidade para exibir o benefício específico.')
}
function classProgressionEligibility(power,index){
  if(!power)return{ok:false,reasons:['Poder não encontrado.']};
  const isCosmoSlot = index === 0 && typeof hasCosmopolita === 'function' && hasCosmopolita();
  if (isCosmoSlot) {
    if (['concedido', 'tormenta', 'raca', 'grupo', 'escolhido_dos_deuses'].includes(power.categoria)) {
      return { ok: false, reasons: ['Origem Cosmopolita não permite poderes concedidos, raciais ou da Tormenta.'] };
    }
    const classLvls = typeof cosmopolitaClassLevels === 'function' ? cosmopolitaClassLevels() : {};
    const targetClassId = (power.classeIds && power.classeIds[0]) || state.progression[index]?.classId || state.identity?.classId;
    const currentClassLvl = classLvls[targetClassId] || 0;
    if (currentClassLvl < 2) {
      return { ok: false, reasons: ['Requer pelo menos 2º nível na classe para a Origem Cosmopolita.'] };
    }
  }
  const row=state.progression[index] || { classId: state.identity.classId, powerId: '' };
  const classLevel=typeof classLevelAt==='function'?classLevelAt(index,row.classId):(index+1);
  const requirements=parsePowerRequirements(power),reasons=[];
  reasons.push(...RegrasProgressao.requisitosBasicos(requirements,classLevel,finalAttrs(),new Set(allTrainedSkills()),id=>ATTR_LABEL[id],skillDisplayName));
  const owned=progressionOwnedPowerNames(index).map(slug),text=slug(power.preRequisitosTexto||'');
  if(row.classId==='mistico'){
    const affinity=String(power.preRequisitosTexto||'').match(/Afinidade\s*\(([^)]+)\)/i);
    if(affinity){
      const allowed=affinity[1].split(/,|\bou\b/i).map(value=>slug(value.trim())), activeAffinities=(typeof characterMysticAffinities==='function'?characterMysticAffinities():[state.identity.classChoices?.elemento]);
      if(!allowed.some(req=>activeAffinities.includes(req)))reasons.push('Requer Afinidade ('+affinity[1]+').');
    }
    if(power.id==='mistico_ditame_absoluto'||text.includes('dois_poderes_de_ditame')){
      const ditameCount=state.progression.slice(0,index).filter(p=>{
        const item=DATA.classPowers.find(cp=>cp.id===p.powerId);
        return item&&(item.id.startsWith('mistico_ditame_')||slug(item.nome).startsWith('ditame_'))&&item.id!=='mistico_ditame_absoluto';
      }).length;
      if(ditameCount<2)reasons.push('Requer dois poderes de ditame.');
    }
    if(power.id==='mistico_afinidade_maior'||text.includes('afinidade_expandida')){
      const hasExpanded = state.identity.classChoices?.afinidade_evoluida === 'afinidade_expandida' ||
        state.progression.slice(0,index).some(p => p.powerId === 'mistico_afinidade_expandida' || p.powerId === 'afinidade_expandida');
      if(!hasExpanded)reasons.push('Requer Afinidade Expandida.');
    }
  }
  if(row.classId==='arcanista'||(power.classeIds||[]).includes('arcanista')){
    const path=typeof spellPath==='function'?spellPath():['bruxo','mago','feiticeiro'].find(p=>Object.values(state?.identity?.classChoices||{}).some(val=>(typeof slug==='function'?slug(val):String(val).toLowerCase())===p))||'';
    const pre=power?.preRequisitosTexto||'';
    if(/bruxo\s+ou\s+mago/i.test(pre)){
      if(path!=='bruxo'&&path!=='mago') reasons.push('Requer caminho Bruxo ou Mago.');
    } else {
      if(power.id==='arcanista_caldeirao_do_bruxo'||/\bBruxo\b/i.test(pre)){
        if(path!=='bruxo') reasons.push('Requer caminho Bruxo.');
      }
      if(power.id==='arcanista_escriba_arcano'||/\bMago\b/i.test(pre)){
        if(path!=='mago') reasons.push('Requer caminho Mago.');
      }
      if(/\bFeiticeiro\b/i.test(pre)){
        if(path!=='feiticeiro') reasons.push('Requer caminho Feiticeiro.');
      }
    }
    const lineageMatch=pre.match(/linhagem\s+([a-zçãé]+)/i);
    if(lineageMatch){
      const requiredLineage='linhagem_'+slug(lineageMatch[1]);
      const currentLineage=typeof spellLineage==='function'?spellLineage():['linhagem_abencoada','linhagem_feerica','linhagem_draconica','linhagem_rubra','linhagem_celestial'].find(id=>Object.values(state?.identity?.classChoices||{}).some(v=>slug(v)===id))||'';
      if(currentLineage!==requiredLineage){
        reasons.push('Requer '+lineageMatch[0].charAt(0).toUpperCase()+lineageMatch[0].slice(1)+'.');
      }
    }
  }
  for(const candidate of DATA.classPowers.filter(item=>(item.classeIds||[]).includes(row.classId)))if(candidate.id!==power.id&&text.includes(slug(candidate.nome))&&!owned.includes(slug(candidate.nome)))reasons.push('Requer '+candidate.nome+'.');
  if(!powerAllowsRepeat(power)&&state.progression.slice(0,index).some(previous=>previous.powerId===power.id))reasons.push('Este poder já foi escolhido.');
  return{ok:reasons.length===0,reasons};
}
const ownedPowerNamesBeforeProgression=ownedPowerNames;
ownedPowerNames=function(exceptId=''){const values=ownedPowerNamesBeforeProgression(exceptId);for(const row of state.progression||[]){const power=progressionGeneralPowerById(row.powerId);if(power&&power.originalId!==exceptId)values.add(slug(power.nome))}return values};
function progressionGeneralEligibility(power,index){const original=power?.generalPower||power;const isCosmoSlot=index===0&&typeof hasCosmopolita==='function'&&hasCosmopolita();if(isCosmoSlot&&['concedido','tormenta','raca','grupo','escolhido_dos_deuses'].includes(original.categoria)){return{ok:false,reasons:['Origem Cosmopolita não permite poderes concedidos, raciais ou da Tormenta.']}}const verdict=generalPowerEligibility(original),reasons=[...verdict.reasons];if(!powerAllowsRepeat(original)&&state.progression.some((row,rowIndex)=>rowIndex!==index&&progressionGeneralPowerById(row.powerId)?.originalId===original?.id))addReason(reasons,'Este poder já foi escolhido em outro nível.');return{ok:reasons.length===0,reasons}}
