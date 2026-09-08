const DUENDE_TABOO_SUGGESTIONS=[
  '–5 em Ofício (alfaiate) ou Diplomacia.',
  '–2 em perícias baseadas em Carisma.',
  '–5 em Percepção ou Diplomacia.',
  '–5 em Iniciativa.',
  'Tamanho reduzido em uma categoria; roupas acompanham.',
  '–5 em Diplomacia ou Intimidação.',
  'Não pode lançar uma magia conhecida, determinada por sorteio.',
  '–5 em Luta ou Cavalgar.',
  '–1 na Defesa.',
  '–3m de deslocamento.',
  '–3m de deslocamento enquanto o sal tocar sua pele.',
  '–5 em Diplomacia ou Atuação.',
  '–5 em Iniciativa ou Ofício.',
  '–1 PM máximo.',
  '–5 em Diplomacia ou Jogatina.',
  '–5 em Percepção ou Religião.',
  '–5 em Ladinagem ou Diplomacia.',
  '–1 PV máximo.',
  '–5 em Diplomacia.',
  '–5 em Enganação ou Diplomacia.',
  'Fica indisponível por algumas horas.',
  '–5 em Cura ou Diplomacia.'
];
const DUENDE_TABOO_DEFAULT_PENALTIES=[...DUENDE_TABOO_SUGGESTIONS];
const DUENDE_TABOO_PENALTIES=[...new Set([...DUENDE_TABOO_DEFAULT_PENALTIES,...SKILLS.map(skill=>'–5 em '+skill[1]),'–1 na Defesa.','–1 PV máximo.','–1 PM máximo.','–3m de deslocamento.','Tamanho reduzido em uma categoria; roupas acompanham.','Não pode lançar uma magia conhecida, determinada por sorteio.','Fica indisponível por algumas horas.','Outra consequência (com o mestre)'])];
const renderChoiceBeforeDuende=renderChoice;
renderChoice=function(def,source='race'){
  if(source!=='race'||def.id!=='duende_tabu')return renderChoiceBeforeDuende(def,source);
  const current=state.identity.raceChoices.duende_tabu||'',text=state.identity.duendeTabuText||'',penalty=state.identity.duendeTabuPenalty||'';
  const cards=optionList(def).map((option,index)=>'<button type="button" class="choice-card duende-taboo-card '+(current===choiceId(option)?'selected':'')+'" data-action="duende-tabu-preset" data-value="'+esc(choiceId(option))+'"><strong>'+esc((index+1)+'. '+choiceName(option))+'</strong><p><b>Se descumprir, sugestão:</b> '+esc(DUENDE_TABOO_SUGGESTIONS[index]||'Defina a consequência com o mestre.')+'</p></button>').join('');
  return '<div class="choice-section duende-taboo-editor"><h4>'+esc(def.nome||'Tabu')+'</h4><p>Escolha um exemplo ou escreva o seu. A consequência por descumprimento é uma sugestão editável para combinar com o mestre.</p><div class="choice-cards">'+cards+'<button type="button" class="choice-card duende-taboo-card '+(current==='personalizado'?'selected':'')+'" data-action="duende-tabu-preset" data-value="personalizado"><strong>Tabu personalizado</strong><p>Escreva uma regra e uma consequência próprias nos campos abaixo.</p></button></div><label class="field"><span>Texto do tabu</span><textarea class="textarea" data-field="duendeTabuText" placeholder="Descreva o tabu do personagem">'+esc(text)+'</textarea></label><div class="grid two"><label class="field"><span>Consequência ao descumprir</span><select class="select" data-field="duendeTabuPenalty"><option value="">Escolha uma sugestão</option>'+DUENDE_TABOO_PENALTIES.map(value=>'<option '+(penalty===value?'selected':'')+'>'+value+'</option>').join('')+'</select></label>'+(penalty==='Outra consequência (com o mestre)'?'<label class="field"><span>Consequência personalizada</span><input class="input" data-field="duendeTabuCustomPenalty" value="'+esc(state.identity.duendeTabuCustomPenalty||'')+'" placeholder="Descreva a consequência"></label>':'')+'</div></div>';
};
const renderAllocationBeforeDuende=renderAllocation;
renderAllocation=function(key,config,label){return renderAllocationBeforeDuende(key,config,label).replace('<div class="choice-section">','<div class="choice-section" data-allocation-key="'+esc(key)+'">')};
const raceMissingBeforeDuende=raceMissingChoices;
raceMissingChoices=function(){let missing=raceMissingBeforeDuende();if(state.identity.raceId!=='duende')return missing;if(state.identity.raceChoices.duende_tabu)missing=missing.filter(item=>!String(item.selector||'').includes('duende_tabu'));if(!String(state.identity.duendeTabuText||'').trim())missing.push({title:'Tabu do duende',message:'Escolha uma sugestão ou escreva o tabu do personagem.',selector:'[data-field="duendeTabuText"]'});if(!state.identity.duendeTabuPenalty)missing.push({title:'Consequência do tabu',message:'Escolha a penalidade ou consequência do tabu.',selector:'[data-field="duendeTabuPenalty"]'});if(state.identity.duendeTabuPenalty==='Outra consequência (com o mestre)'&&!String(state.identity.duendeTabuCustomPenalty||'').trim())missing.push({title:'Consequência personalizada',message:'Descreva a consequência combinada com o mestre.',selector:'[data-field="duendeTabuCustomPenalty"]'});return missing};
const raceAbilityTextBeforeDuende=raceAbilityText;
raceAbilityText=function(){let text=raceAbilityTextBeforeDuende();if(state.identity.raceId==='duende'&&state.identity.duendeTabuText){const consequence=state.identity.duendeTabuPenalty==='Outra consequência (com o mestre)'?state.identity.duendeTabuCustomPenalty:state.identity.duendeTabuPenalty;text+=' Tabu: '+state.identity.duendeTabuText+(consequence?' Consequência: '+consequence+'.':'')}return text};
document.addEventListener('click',event=>{const button=event.target.closest?.('[data-action="duende-tabu-preset"]');if(!button)return;const def=raceById('duende')?.habilidades?.selecionadas?.find(choice=>choice.id==='duende_tabu'),options=optionList(def),option=options.find(item=>choiceId(item)===button.dataset.value),index=options.indexOf(option);state.identity.raceChoices.duende_tabu=button.dataset.value;state.identity.duendeTabuText=option?choiceName(option):'';state.identity.duendeTabuPenalty=index>=0?DUENDE_TABOO_DEFAULT_PENALTIES[index]:'';state.identity.duendeTabuCustomPenalty='';renderStage();setTimeout(()=>document.querySelector('[data-field="duendeTabuText"]')?.focus(),20)},true);
document.addEventListener('input',event=>{if(event.target.dataset.field==='duendeTabuText'){state.identity.duendeTabuText=event.target.value;persist()}if(event.target.dataset.field==='duendeTabuCustomPenalty'){state.identity.duendeTabuCustomPenalty=event.target.value;persist()}},true);
document.addEventListener('change',event=>{if(event.target.dataset.field==='duendeTabuPenalty'){state.identity.duendeTabuPenalty=event.target.value;renderStage();return}if(event.target.dataset.action==='race-choice'&&event.target.dataset.choiceId==='duende_natureza'&&event.target.value==='animal')setTimeout(()=>{const target=document.querySelector('[data-allocation-key="duende_natureza"]');target?.classList.add('duende-attribute-focus');target?.scrollIntoView({behavior:'smooth',block:'center'})},60)},true);
(()=>{const style=document.createElement('style');style.textContent='.duende-taboo-card{width:100%;text-align:left;color:inherit}.duende-taboo-card b{color:#efcf83}.duende-attribute-focus{animation:duendeAttributeGlow 1s ease-in-out 3}@keyframes duendeAttributeGlow{0%,100%{box-shadow:0 0 0 0 #4abfff00}50%{box-shadow:0 0 0 5px #4abfff77;border-radius:9px}}';document.head?.appendChild(style)})();
