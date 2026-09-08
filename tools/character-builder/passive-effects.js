function selectedCharacterFeatures(){
  ensureProgression();
  const features=[],seen=new Set(),add=(feature,source)=>{if(!feature)return;const key=source+'|'+(feature.id||feature.nome);if(seen.has(key))return;seen.add(key);features.push({...feature,source})};
  const race=raceById(state.identity.raceId);
  for(const ability of race?.habilidades?.fixas||[]){const option=(ability.escolha?.opcoes||[]).find(item=>choiceId(item)===state.identity.raceChoices[ability.id]);add(option?{...ability,efeitos:[...(ability.efeitos||[]),...(option.efeitos||[])]}:ability,'race')}
  for(const definition of race?.habilidades?.selecionadas||[]){const option=selectedRaceOption(definition);if(option)add({...option,nome:definition.nome+' · '+choiceName(option)},'race')}
  for(const group of racePowerGroups())for(const id of state.powers.raceGroups[group.id]||[]){const option=group.options.find(item=>choiceId(item)===id);if(option)add(option,'race')}
  state.progression.forEach((row,index)=>{const cls=classById(row.classId),level=classLevelAt(index,row.classId);for(const ability of cls?.habilidades||[])if(Number(ability.nivel)===level)add(ability,'class');add(progressionPowerById(row.powerId),'class-power')});
  for(const definition of classChoiceDescriptors(classById(state.identity.classId))){const selected=optionList(definition).find(option=>choiceId(option)===state.identity.classChoices[definition.id]);if(selected)add(selected,'class-choice')}
  for(const power of selectedGeneralPowers())add(power,'general-power');
  for(const name of originPowerNames())add(DATA.generalPowers.find(power=>slug(power.nome)===slug(name))||{nome:name,descricao:'Poder recebido pela origem.'},'origin');
  for(const name of String(state.deity.power||'').split('|').filter(Boolean))add(DATA.generalPowers.find(power=>power.nome===name)||{nome:name,descricao:'Poder concedido pela divindade.'},'deity');
  return features;
}
function inferredFeatureEffects(feature){
  const description=slug(feature.descricao||'').replace(/_/g,' '),effects=[];
  const defenseAttribute=description.match(/usar seu (carisma|forca|constituicao|inteligencia|sabedoria) em vez de destreza na defesa/);
  if(defenseAttribute)effects.push({tipo:'substituir_atributo_defesa',para:{carisma:'car',forca:'for',constituicao:'con',inteligencia:'int',sabedoria:'sab'}[defenseAttribute[1]],feature});
  return effects;
}
function selectedFeatureEffects(){return selectedCharacterFeatures().flatMap(feature=>[...(feature.efeitos||[]).map(effect=>({...effect,feature})),...inferredFeatureEffects(feature)]) }
const allTrainedSkillsBeforePassives=allTrainedSkills;
allTrainedSkills=function(){const values=allTrainedSkillsBeforePassives();for(const effect of selectedFeatureEffects())if(['pericia_treinada','treinar_pericia'].includes(effect.tipo)){for(const id of effect.pericias||[effect.periciaId])if(id)values.push(id)}return [...new Set(values)]};
function passiveCharacterEffects(){
  const result={defenseAttribute:'des',defenseBonus:0,skillBonuses:{},movementBonus:0,pvPerLevel:0,pmPerLevel:0,pvFlat:0,pmFlat:0,sizeShift:0,reductions:[]};
  const addSkill=(id,value)=>{if(id)result.skillBonuses[id]=(result.skillBonuses[id]||0)+Number(value||0)};
  for(const effect of selectedFeatureEffects()){
    const conditional=effect.condicao||effect.condicoes||effect.duracao||effect.gatilho;
    if(effect.tipo==='substituir_atributo_defesa')result.defenseAttribute=effect.para||result.defenseAttribute;
    if(effect.tipo==='bonus_defesa'&&!conditional)result.defenseBonus+=Number(effect.valor??effect.bonus??0);
    if(effect.tipo==='bonus_deslocamento'&&!conditional)result.movementBonus+=Number(effect.valor??effect.bonus??0);
    if(effect.tipo==='bonus_pv'&&!conditional){const first=Number(effect.nivel1??effect.valor??effect.bonus??0),following=Number(effect.porNivelApos1??0);result.pvFlat+=first-following;result.pvPerLevel+=following}
    if(effect.tipo==='bonus_pv_por_nivel'&&!conditional)result.pvPerLevel+=Number(effect.valor??effect.bonus??0);
    if(effect.tipo==='bonus_pm_por_nivel'&&!conditional)result.pmPerLevel+=Number(effect.valor??effect.bonus??0);
    if(effect.tipo==='bonus_pm'&&!conditional)result.pmFlat+=Number(effect.valor??effect.bonus??0);
    if(effect.tipo==='somar_atributo_recurso'&&effect.recurso==='pm'&&!conditional)result.pmFlat+=Number(finalAttrs()[effect.atributo]||0);
    if((effect.tipo==='bonus_pericia'||effect.tipo==='penalidade_pericia')&&!conditional){for(const id of effect.pericias||[effect.periciaId])addSkill(id,effect.valor??effect.bonus??effect.penalidade)}
    if(effect.tipo==='reducao_dano'&&!conditional)result.reductions.push(effect);
  }
  return result;
}
function characterDefenseAttribute(){return passiveCharacterEffects().defenseAttribute}
function characterSizeId(){const order=['Minúsculo','Pequeno','Médio','Grande','Enorme','Colossal'],baseId=slug(raceById(state.identity.raceId)?.corpo?.tamanhoId||'medio'),base=order.find(value=>slug(value)===baseId)||'Médio',index=order.indexOf(base),shift=passiveCharacterEffects().sizeShift;return order[Math.max(0,Math.min(order.length-1,index+shift))]}
function characterBaseMovement(){const race=raceById(state.identity.raceId),raw=Number(race?.corpo?.deslocamentoBase);return (Number.isFinite(raw)?raw:9)+passiveCharacterEffects().movementBonus}
function characterTrainingBonus(){const level=Number(state.identity.plannedLevel)||1;return level>=15?6:level>=7?4:2}
function calculatedSkillTotal(id){const definition=SKILLS.find(skill=>skill[0]===id),attr=definition?.[2]||'int',trained=new Set(allTrainedSkills()),level=Math.floor((Number(state.identity.plannedLevel)||1)/2);return Number(finalAttrs()[attr]||0)+level+(trained.has(id)?characterTrainingBonus():0)+Number(passiveCharacterEffects().skillBonuses[id]||0)}
function characterProficiencyText(){const labels={armas_simples:'Armas simples',armas_marciais:'Armas marciais',armas_exoticas:'Armas exóticas',armaduras_leves:'armaduras leves',armaduras_pesadas:'armaduras pesadas',escudos:'escudos'};return characterProficiencies().map(id=>labels[id]||String(id).replace(/_/g,' ')).join(', ').replace(/, ([^,]*)$/, ' e $1')}
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
  return sentence.length>82?sentence.slice(0,79).replace(/\s+\S*$/,'')+'…':sentence;
}
function pdfInitialFeatureText(){return selectedCharacterFeatures().filter(feature=>['race','origin','deity','general-power'].includes(feature.source)).map(feature=>feature.nome+(compactFeatureDescription(feature)?' ('+compactFeatureDescription(feature)+')':'')).join('\r\n')+(state.identity.raceId==='duende'&&state.identity.duendeTabuText?'\r\nTabu: '+state.identity.duendeTabuText+' ('+(state.identity.duendeTabuPenalty||state.identity.duendeTabuCustomPenalty||'consequência personalizada')+')':'')}
function weaponPassiveStats(item){const skill=item?.arma?.combateId==='a_distancia'?'pontaria':'luta',trained=new Set(allTrainedSkills());let attack=calculatedSkillTotal(skill),damage=item?.arma?.dano?.principal||'';if(item?.id==='espadim'&&trained.has('nobreza')){attack++;damage+=(damage?' +1':'1')}return{skill,attack,damage:damage.replace(/\s+/g,'')}}
const progressionStatsBeforePassives=progressionStats;
progressionStats=function(){const base=progressionStatsBeforePassives(),effects=passiveCharacterEffects(),attrs=finalAttrs(),level=Number(state.identity.plannedLevel)||1;return{...base,pv:base.pv+effects.pvPerLevel*level+effects.pvFlat,pm:base.pm+effects.pmPerLevel*level+effects.pmFlat,defense:10+Number(attrs[effects.defenseAttribute]||0)+effects.defenseBonus}};
