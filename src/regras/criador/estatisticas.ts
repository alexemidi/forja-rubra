function baseProgressionStats(){
  ensureProgression();
  const baseAttrs=finalAttrs(false),attrs=finalAttrs(true),first=classById(state.progression[0].classId);
  const conAttr=(typeof characterHasFeature==='function'&&characterHasFeature('dom_da_esperanca'))?Number(baseAttrs.sab||0):Number(baseAttrs.con||0);
  const pv=Number(first?.caracteristicas?.pv?.inicial||0)+conAttr+state.progression.slice(1).reduce((s,row)=>s+Number(classById(row.classId)?.caracteristicas?.pv?.porNivel||0)+conAttr,0);
  let pm=state.progression.reduce((s,row)=>s+Number(classById(row.classId)?.caracteristicas?.pm?.porNivel||0),0);
  for(const classId of new Set(state.progression.map(row=>row.classId))){
    const key=characterSpellKeyAttribute(classId);
    if(key)pm+=Math.max(0,Number(baseAttrs[key]||0));
  }
  return{pv,pm,defense:10+attrs.des};
}
// Composição explícita conserva a ordem de aplicação das regras legadas.
function progressionStats(){
  const stats=baseProgressionStats(),heritage=suraggelHeritage(),level=Math.max(1,Number(state.identity.plannedLevel)||1),tier=level<=4?1:level<=10?2:level<=16?3:4;
  if(heritage==='heranca_de_drashantyr')stats.pm++;
  if(heritage==='heranca_de_vitalia')stats.pv+=5*tier;
  if(heritage==='heranca_de_kundali')stats.defense+=2;
  const hasCoracaoHeroico = (Array.isArray(state.origin?.benefits) && state.origin.benefits.includes('unique:coracao_heroico')) ||
    (Array.isArray(state.progression) && state.progression.some(r => r.powerId === 'coracao_heroico' || r.powerId === 'unique:coracao_heroico' || String(r.powerId).endsWith('coracao_heroico'))) ||
    (typeof selectedCharacterFeatures === 'function' && typeof slug === 'function' && selectedCharacterFeatures().some(f => slug(f.id || f.nome || '') === 'coracao_heroico' || (f.benefitNames && f.benefitNames.some(b => slug(b) === 'coracao_heroico'))));
  if(hasCoracaoHeroico)stats.pm+=3*tier;
  if(state.deity?.mode==='pantheon'&&['clerigo','frade','druida','ermitao','paladino','santo'].includes(state.identity.classId)&&state.tableRules?.broadDevotionAndFundamentalist!==false){
    stats.pm+=typeof ForjaUnificada!=='undefined'&&typeof ForjaUnificada.calculateBroadDevotionPmBonus==='function'
      ?ForjaUnificada.calculateBroadDevotionPmBonus(state.identity.classId,'pantheon',level,true)
      :2*tier;
  }
  const result=RegrasPersonagem.estatisticas(stats,passiveCharacterEffects(),finalAttrs(),level);
  const chosen=new Set(state.age?.complications||[]);
  if(chosen.has('abatido'))result.pv-=2*level;
  if(chosen.has('melancolico'))result.pm-=level;
  if(state.levelTraining&&(state.levelTraining.pv||state.levelTraining.pm)&&level<20){
    const baseAttrs=finalAttrs(false);
    const conAttr=(typeof characterHasFeature==='function'&&characterHasFeature('dom_da_esperanca'))?Number(baseAttrs.sab||0):Number(baseAttrs.con||0);
    const defaultCls=state.progression?.[state.progression.length-1]?.classId||state.identity.classId;
    const tBonuses=typeof ForjaUnificada!=='undefined'&&typeof ForjaUnificada.calculateLevelTrainingBonuses==='function'
      ?ForjaUnificada.calculateLevelTrainingBonuses({
          currentLevel:level,
          defaultClassId:defaultCls,
          conModifier:conAttr,
          training:state.levelTraining,
          getClassVitalInfo:(clsId)=>{
            const c=classById(clsId);
            const spKey=typeof characterSpellKeyAttribute==='function'?characterSpellKeyAttribute(clsId):null;
            const hasCls=(state.progression||[]).some(r=>r.classId===clsId);
            return{
              id:clsId,
              pvPerLevel:Number(c?.caracteristicas?.pv?.porNivel||0),
              pmPerLevel:Number(c?.caracteristicas?.pm?.porNivel||0),
              spellKeyAttrBonus:spKey?Math.max(0,Number(baseAttrs[spKey]||0)):0,
              alreadyHasClassInProgression:hasCls
            };
          }
        })
      :{pvAdvance:0,pmAdvance:0};
    result.pv+=Number(tBonuses.pvAdvance||0);
    result.pm+=Number(tBonuses.pmAdvance||0);
  }
  return result;
}

