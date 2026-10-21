const ARCANE_FAMILIARS=[
  ['borboleta','Borboleta','A CD dos testes de Vontade para resistir a suas magias aumenta em +1.'],
  ['cobra','Cobra','A CD dos testes de Fortitude para resistir a suas magias aumenta em +1.'],
  ['coruja','Coruja','Quando lança uma magia com alcance de toque, você pode pagar 1 PM para aumentar seu alcance para curto.'],
  ['corvo','Corvo','Quando faz um teste de Misticismo ou Vontade, você pode pagar 1 PM para rolar dois dados e usar o melhor resultado.'],
  ['falcao','Falcão','Você não pode ser surpreendido e nunca fica desprevenido.'],
  ['gato','Gato','Você recebe visão no escuro e +2 em Furtividade.'],
  ['lagarto','Lagarto','A CD dos testes de Reflexos para resistir a suas magias aumenta em +1.'],
  ['morcego','Morcego','Você adquire percepção às cegas em alcance curto.'],
  ['rato','Rato','Você pode usar seu atributo-chave em Fortitude, no lugar de Constituição.'],
  ['sapo','Sapo','Você soma seu atributo-chave ao seu total de pontos de vida (cumulativo).']
];
function familiarById(id){return ARCANE_FAMILIARS.find(item=>item[0]===id)}
function openFamiliarChoice(index){
  const row=state.progression[index];
  if(!row||!['arcanista_familiar','arcanista_familiar_aprimorado'].includes(row.previewPowerId||row.powerId))return;
  const improved=(row.previewPowerId||row.powerId)==='arcanista_familiar_aprimorado';
  let modal=document.getElementById('familiarChoiceModal');
  if(!modal){modal=document.createElement('div');modal.id='familiarChoiceModal';modal.className='modal-backdrop';modal.addEventListener('click',event=>{
    if(event.target===modal||event.target.closest('[data-familiar-close]')){modal.hidden=true;return}
    const button=event.target.closest('[data-familiar-choice]');if(!button)return;
    const selected=state.progression[Number(modal.dataset.index)];if(!selected)return;
    selected.previewPowerChoice=button.dataset.familiarChoice;
    modal.hidden=true;renderStage();syncProgressionFooter();
  });document.body.appendChild(modal)}
  modal.dataset.index=String(index);
  const first=state.progression.find(entry=>entry.powerId==='arcanista_familiar')?.powerChoice;
  const options=ARCANE_FAMILIARS.filter(item=>!improved||item[0]!==first);
  modal.innerHTML='<section class="confirm-modal familiar-choice-modal" role="dialog" aria-modal="true" aria-labelledby="familiarChoiceTitle"><header><h3 id="familiarChoiceTitle">'+(improved?'Escolha o segundo benefício do familiar':'Escolha seu familiar arcano')+'</h3></header><div class="confirm-modal-body"><p>Um familiar é uma criatura mágica. Em termos de jogo, é um parceiro especial com o qual você pode se comunicar telepaticamente em alcance longo. Ele obedece a suas ordens, mas ainda está limitado ao que uma criatura de sua espécie pode fazer. Se ele morrer, você fica atordoado por uma rodada. Você pode invocar um novo familiar com um ritual que exige um dia e T$ 100 em ingredientes.</p><div class="familiar-choice-grid">'+options.map(item=>'<button type="button" class="familiar-choice-card" data-familiar-choice="'+item[0]+'"><strong>'+esc(item[1])+'</strong><span>'+esc(item[2])+'</span></button>').join('')+'</div></div><footer><button type="button" class="button" data-familiar-close>Cancelar</button></footer></section>';
  modal.hidden=false;
  modal.querySelector('[data-familiar-choice]')?.focus();
}
document.addEventListener('click',event=>{const button=event.target.closest?.('[data-action="choose-familiar"]');if(button){event.preventDefault();openFamiliarChoice(Number(button.dataset.index))}},true);
