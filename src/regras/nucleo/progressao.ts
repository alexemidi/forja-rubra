const RegrasProgressao=Object.freeze({
  requisitosBasicos(requirements,classLevel,attrs,trained,attributeLabel,skillLabel){
    const reasons=[];
    if(requirements.level>classLevel)reasons.push('Requer nível '+requirements.level+' nesta classe.');
    for(const [id,value] of (requirements.attrs||[]))if(Number(attrs[id])<value)reasons.push('Requer '+attributeLabel(id)+' '+value+'.');
    const trainedSet=trained instanceof Set?trained:new Set(trained||[]);
    const isSkillMet=(s)=>{
      if(trainedSet.has(s)) return true;
      if(s==='oficio') return [...trainedSet].some(item=>String(item).startsWith('oficio'));
      if(String(s).startsWith('oficio:')){
        if(trainedSet.has('inventor_artesao_criativo')||trainedSet.has('artesao_criativo')||(typeof state!=='undefined'&&Array.isArray(state?.progression)&&state.progression.some(p=>p?.powerId==='inventor_artesao_criativo'||p?.powerId==='artesao_criativo'))) return true;
        const norm=String(s).replace(/[:_]/g,':');
        return [...trainedSet].some(item=>String(item).replace(/[:_]/g,':')===norm);
      }
      return false;
    };
    if(requirements.skillGroups&&requirements.skillGroups.length){
      for(const group of requirements.skillGroups){
        if(!group.some(isSkillMet)){
          reasons.push('Requer treino em '+group.map(skillLabel).join(' ou ')+'.');
        }
      }
    }else{
      for(const skill of (requirements.skills||[])){
        if(!isSkillMet(skill))reasons.push('Requer treino em '+skillLabel(skill)+'.');
      }
    }
    return reasons;
  },
  patamar(level){return level<=4?'iniciante':level<=10?'veterano':level<=16?'campeão':'lenda'},
  atributos(base,rows,isMarahAuthority){
    const values={...base};
    for(const row of rows||[]){
      if(row.powerId==='classe_aumento_de_atributo'&&values[row.powerChoice]!==undefined)values[row.powerChoice]++;
      if(isMarahAuthority(row))values.car++;
    }
    return values;
  }
});
if(typeof module!=='undefined'&&module.exports)module.exports=RegrasProgressao;
