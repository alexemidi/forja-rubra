const DUENDE_TABOO_SUGGESTIONS=[
  'Diplomacia –5 quando o remendo causar constrangimento ou conflito.',
  'Fortitude –5 para resistir a doenças ou efeitos ligados à carne crua.',
  'Percepção –5 para notar algo enquanto evita ou interrompe um agradecimento.',
  'Iniciativa –5 quando entrar de costas representar perigo imediato.',
  'Diplomacia –5 quando ocultar o nome dificultar uma interação.',
  'Diplomacia –5 quando o poema macabro ofender ou assustar alguém.',
  'Percepção –5 durante noites de lua cheia na presença de crianças.',
  'Luta –5 quando a recusa em sentar prejudicar sua posição.',
  'Defesa –1 enquanto estiver sem o pote que diz guardar seu coração.',
  'Deslocamento –3m enquanto estiver usando os sapatos pequenos.',
  'Fica paralisado enquanto o sal permanecer em contato com sua pele.',
  'Atuação –5 para sustentar a personalidade e o nome alternativos.',
  'Iniciativa –5 quando precisar parar para varrer o cômodo.',
  'Vontade –5 diante do próprio reflexo.',
  'Diplomacia –5 quando não puder pagar por um favor.',
  'Percepção –5 enquanto estiver vendado diante de um templo.',
  'Diplomacia –5 se o furto do garfo for descoberto.',
  'Perde 1 PV ao atravessar um espinheiro por causa deste tabu.',
  'Diplomacia –5 quando responder com outra pergunta atrapalhar a conversa.',
  'Diplomacia –5 no dia mensal em que não pode dizer a verdade.',
  'Iniciativa –5 quando a lembrança do compromisso surgir em uma cena.',
  'Cura –5 quando precisar tratar alguém ferido sem olhar em seus olhos.'
];
const renderChoiceBeforeDuende=renderChoice;
renderChoice=function(def,source='race'){
  if(source!=='race'||def.id!=='duende_tabu')return renderChoiceBeforeDuende(def,source);
  const current=state.identity.raceChoices.duende_tabu||'',text=state.identity.duendeTabuText||'',penalty=state.identity.duendeTabuPenalty||'';
  const cards=optionList(def).map((option,index)=>'<button type="button" class="choice-card duende-taboo-card '+(current===choiceId(option)?'selected':'')+'" data-action="duende-tabu-preset" data-value="'+esc(choiceId(option))+'"><strong>'+esc((index+1)+'. '+choiceName(option))+'</strong><p><b>Sugestão:</b> '+esc(DUENDE_TABOO_SUGGESTIONS[index]||'Defina a consequência com o mestre.')+'</p></button>').join('');
  return '<div class="choice-section duende-taboo-editor"><h4>'+esc(def.nome||'Tabu')+'</h4><p>'+esc(def.descricao||'Escolha um tabu ou escreva o seu. A penalidade canônica é –5 em uma das perícias indicadas; alternativas precisam da aprovação do mestre.')+'</p><div class="choice-cards">'+cards+'<button type="button" class="choice-card duende-taboo-card '+(current==='personalizado'?'selected':'')+'" data-action="duende-tabu-preset" data-value="personalizado"><strong>Tabu personalizado</strong><p>Escreva uma regra própria no campo abaixo.</p></button></div><label class="field"><span>Texto do tabu</span><textarea class="textarea" data-field="duendeTabuText" placeholder="Descreva o tabu do personagem">'+esc(text)+'</textarea></label><div class="grid two"><label class="field"><span>Penalidade ou consequência</span><select class="select" data-field="duendeTabuPenalty"><option value="">Escolha uma consequência</option>'+['–5 em Diplomacia','–5 em Iniciativa','–5 em Luta','–5 em Percepção','Outra consequência (com o mestre)'].map(value=>'<option '+(penalty===value?'selected':'')+'>'+value+'</option>').join('')+'</select></label>'+(penalty==='Outra consequência (com o mestre)'?'<label class="field"><span>Consequência personalizada</span><input class="input" data-field="duendeTabuCustomPenalty" value="'+esc(state.identity.duendeTabuCustomPenalty||'')+'" placeholder="Descreva a consequência"></label>':'')+'</div></div>';
};
const renderAllocationBeforeDuende=renderAllocation;
renderAllocation=function(key,config,label){return renderAllocationBeforeDuende(key,config,label).replace('<div class="choice-section">','<div class="choice-section" data-allocation-key="'+esc(key)+'">')};
const raceMissingBeforeDuende=raceMissingChoices;
raceMissingChoices=function(){let missing=raceMissingBeforeDuende();if(state.identity.raceId!=='duende')return missing;if(state.identity.raceChoices.duende_tabu)missing=missing.filter(item=>!String(item.selector||'').includes('duende_tabu'));if(!String(state.identity.duendeTabuText||'').trim())missing.push({title:'Tabu do duende',message:'Escolha uma sugestão ou escreva o tabu do personagem.',selector:'[data-field="duendeTabuText"]'});if(!state.identity.duendeTabuPenalty)missing.push({title:'Consequência do tabu',message:'Escolha a penalidade ou consequência do tabu.',selector:'[data-field="duendeTabuPenalty"]'});if(state.identity.duendeTabuPenalty==='Outra consequência (com o mestre)'&&!String(state.identity.duendeTabuCustomPenalty||'').trim())missing.push({title:'Consequência personalizada',message:'Descreva a consequência combinada com o mestre.',selector:'[data-field="duendeTabuCustomPenalty"]'});return missing};
const raceAbilityTextBeforeDuende=raceAbilityText;
raceAbilityText=function(){let text=raceAbilityTextBeforeDuende();if(state.identity.raceId==='duende'&&state.identity.duendeTabuText){const consequence=state.identity.duendeTabuPenalty==='Outra consequência (com o mestre)'?state.identity.duendeTabuCustomPenalty:state.identity.duendeTabuPenalty;text+=' Tabu: '+state.identity.duendeTabuText+(consequence?' Consequência: '+consequence+'.':'')}return text};
document.addEventListener('click',event=>{const button=event.target.closest?.('[data-action="duende-tabu-preset"]');if(!button)return;const def=raceById('duende')?.habilidades?.selecionadas?.find(choice=>choice.id==='duende_tabu'),option=optionList(def).find(item=>choiceId(item)===button.dataset.value);state.identity.raceChoices.duende_tabu=button.dataset.value;state.identity.duendeTabuText=option?choiceName(option):'';renderStage();setTimeout(()=>document.querySelector('[data-field="duendeTabuText"]')?.focus(),20)},true);
document.addEventListener('input',event=>{if(event.target.dataset.field==='duendeTabuText'){state.identity.duendeTabuText=event.target.value;persist()}if(event.target.dataset.field==='duendeTabuCustomPenalty'){state.identity.duendeTabuCustomPenalty=event.target.value;persist()}},true);
document.addEventListener('change',event=>{if(event.target.dataset.field==='duendeTabuPenalty'){state.identity.duendeTabuPenalty=event.target.value;renderStage();return}if(event.target.dataset.action==='race-choice'&&event.target.dataset.choiceId==='duende_natureza'&&event.target.value==='animal')setTimeout(()=>{const target=document.querySelector('[data-allocation-key="duende_natureza"]');target?.classList.add('duende-attribute-focus');target?.scrollIntoView({behavior:'smooth',block:'center'})},60)},true);
(()=>{const style=document.createElement('style');style.textContent='.duende-taboo-card{width:100%;text-align:left;color:inherit}.duende-taboo-card b{color:#efcf83}.duende-attribute-focus{animation:duendeAttributeGlow 1s ease-in-out 3}@keyframes duendeAttributeGlow{0%,100%{box-shadow:0 0 0 0 #4abfff00}50%{box-shadow:0 0 0 5px #4abfff77;border-radius:9px}}';document.head?.appendChild(style)})();
