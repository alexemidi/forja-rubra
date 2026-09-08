state.identity.suraggelChoices=Object.assign({},state.identity.suraggelChoices||{});
function suraggelHeritage(){return state.identity.raceId==='suraggel'?state.identity.raceChoices.suraggel_heranca_substituta:''}
function suraggelHeritageOption(){const definition=raceById('suraggel')?.habilidades?.selecionadas?.find(choice=>choice.id==='suraggel_heranca_substituta');return optionList(definition||{}).find(option=>choiceId(option)===suraggelHeritage())}
function suraggelCarryingBonus(){return suraggelHeritage()==='heranca_de_odisseia'?2:0}
function characterProficiencies(classId=state.identity.classId){const values=[...(classById(classId)?.caracteristicas?.proficiencias||[])];if(classId===state.identity.classId&&suraggelHeritage()==='heranca_de_werra'&&state.identity.raceChoices.suraggel_werra_proficiencia==='armas_marciais')values.push('armas_marciais');return [...new Set(values)]}
const SURAGGEL_SKILL_OPTIONS=SKILLS.map(([id,nome])=>({id,nome}));
const SURAGGEL_HERITAGE_CHOICES={
  heranca_de_al_gazara:[{id:'suraggel_al_gazara_atributo',nome:'Atributo aleatório',descricao:'Sorteie o atributo que recebe +1.',opcoes:ATTRS.map(([id,nome])=>({id,nome}))}],
  heranca_de_arboria:[{id:'suraggel_arboria_forma',nome:'Forma Selvagem',opcoes:['Ágil','Sorrateira','Veloz'].map(nome=>({id:slug(nome),nome}))}],
  heranca_de_chacina:[{id:'suraggel_chacina_forma',nome:'Forma Selvagem',opcoes:['Feroz','Resistente'].map(nome=>({id:slug(nome),nome}))}],
  heranca_de_magika:[{id:'suraggel_magika_atributo',nome:'Atributo-chave da magia',opcoes:[{id:'int',nome:'Inteligência'},{id:'car',nome:'Carisma'}]}],
  heranca_de_nivenciuen:[{id:'suraggel_nivenciuen_habilidade',nome:'Habilidade élfica',opcoes:['Graça de Glórienn','Sangue Mágico'].map(nome=>({id:slug(nome),nome}))}],
  heranca_de_werra:[{id:'suraggel_werra_proficiencia',nome:'Proficiência',opcoes:[{id:'armas_marciais',nome:'Armas marciais'},{id:'duas_armas_exoticas',nome:'Duas armas exóticas'}]}],
  heranca_de_deathok:[1,2].map(n=>({id:'suraggel_deathok_pericia_'+n,nome:'Perícia '+n,opcoes:SURAGGEL_SKILL_OPTIONS})),
  heranca_de_pelagia:[1,2,3].map(n=>({id:'suraggel_pelagia_pericia_'+n,nome:'Perícia '+n,opcoes:SURAGGEL_SKILL_OPTIONS})),
  heranca_de_ramknal:[1,2].map(n=>({id:'suraggel_ramknal_pericia_'+n,nome:'Perícia '+n,opcoes:SURAGGEL_SKILL_OPTIONS.filter(option=>['acrobacia','enganacao','furtividade','jogatina','ladinagem'].includes(option.id))}))
};
const supplementalRaceChoicesBeforeSuraggel=supplementalRaceChoiceDefinitions;
supplementalRaceChoiceDefinitions=function(){return [...supplementalRaceChoicesBeforeSuraggel(),...(SURAGGEL_HERITAGE_CHOICES[suraggelHeritage()]||[])]};
function duplicateSuraggelChoice(){
  const definitions=SURAGGEL_HERITAGE_CHOICES[suraggelHeritage()]||[],skillDefinitions=definitions.filter(def=>def.id.includes('_pericia_')),values=skillDefinitions.map(def=>state.identity.raceChoices[def.id]).filter(Boolean);
  return values.find((value,index)=>values.indexOf(value)!==index)||'';
}
const raceSelectionsCompleteBeforeSuraggel=raceSelectionsComplete;
raceSelectionsComplete=function(){return raceSelectionsCompleteBeforeSuraggel()&&!duplicateSuraggelChoice()};
const raceMissingChoicesBeforeSuraggel=raceMissingChoices;
raceMissingChoices=function(){const missing=raceMissingChoicesBeforeSuraggel(),duplicate=duplicateSuraggelChoice();if(duplicate)missing.push({title:'Perícias da herança',message:'Escolha perícias diferentes para esta herança.',selector:'[data-action="race-choice"][value="'+duplicate+'"]'});return missing};
const finalAttrsBeforeSuraggel=finalAttrs;
finalAttrs=function(){const values=finalAttrsBeforeSuraggel();if(suraggelHeritage()==='heranca_de_al_gazara'){const attr=state.identity.raceChoices.suraggel_al_gazara_atributo;if(values[attr]!==undefined)values[attr]++}return values};
const progressionStatsBeforeSuraggel=progressionStats;
progressionStats=function(){const stats=progressionStatsBeforeSuraggel(),heritage=suraggelHeritage(),level=Math.max(1,Number(state.identity.plannedLevel)||1),tier=level<=4?1:level<=10?2:level<=16?3:4;if(heritage==='heranca_de_drashantyr')stats.pm++;if(heritage==='heranca_de_vitalia')stats.pv+=5*tier;if(heritage==='heranca_de_kundali')stats.defense+=2;return stats};
const spellPlanBeforeSuraggel=spellPlan;
spellPlan=function(){const plan=spellPlanBeforeSuraggel();if(suraggelHeritage()==='heranca_de_magika'&&!plan.groups.some(group=>group.id==='race:suraggel_magika'))plan.groups.push({id:'race:suraggel_magika',label:'Herança de Magika',description:'Escolha uma magia arcana de 1º círculo. Se aprendê-la novamente, seu custo diminui em 1 PM.',count:1,maxCircle:1,type:'arcana',schools:[],fixed:[],allowed:[],scope:'race:suraggel_magika',kind:'race',keyAttribute:state.identity.raceChoices.suraggel_magika_atributo||'int'});return plan};
const raceAbilityTextBeforeSuraggel=raceAbilityText;
raceAbilityText=function(){const parts=[raceAbilityTextBeforeSuraggel()],option=suraggelHeritageOption();if(option)parts.push(choiceName(option),option.descricao);for(const definition of SURAGGEL_HERITAGE_CHOICES[suraggelHeritage()]||[]){const chosen=chosenRaceTraitOption(definition);if(chosen)parts.push(definition.nome,choiceName(chosen),chosen.descricao)}return parts.filter(Boolean).join(' ')};
document.addEventListener('change',event=>{if(event.target.dataset.action!=='race-choice')return;if(event.target.dataset.choiceId==='suraggel_heranca_substituta'){
  Object.keys(state.identity.raceChoices).filter(key=>key.startsWith('suraggel_')&&key!=='suraggel_heranca_substituta').forEach(key=>delete state.identity.raceChoices[key]);
  Object.keys(spellState().selections).filter(key=>key==='race:suraggel_magika').forEach(key=>delete spellState().selections[key]);
  if(event.target.value==='heranca_de_al_gazara')state.identity.raceChoices.suraggel_al_gazara_atributo=ATTRS[Math.floor(Math.random()*ATTRS.length)][0];
}},true);
