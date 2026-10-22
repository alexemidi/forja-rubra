
function sheetFeatureSummary(feature){
  if(!feature) return '';
  const fullName = feature.nome || '';
  const leafName = fullName.split('/').pop().trim();
  const key = slug(feature.id || leafName);
  const nameKey = slug(leafName);
  const summaries = DATA.featureSummaries || {};

  if(nameKey === 'essencia_feerica' || key === 'eiradaan_essencia_feerica' || key === 'essencia_feerica'){
    return 'visão na penumbra';
  }
  if(nameKey === 'estilo_de_uma_arma' || key === 'estilo_de_uma_arma'){
    return '+2 atk e def, mão livre';
  }
  if(nameKey === 'recruta_arcano' || key === 'recruta_arcano'){
    return '+1CD e dano magias';
  }
  if(nameKey === 'magia_instintiva' || key === 'magia_instintiva'){
    return '+1PM p/ aprimoramentos';
  }
  if(nameKey === 'cancao_da_melancolia' || key === 'cancao_da_melancolia'){
    return 'Vontade. Rola 2d20 usa pior';
  }
  if(nameKey === 'sentidos_misticos' || key === 'sentidos_misticos' || key === 'eiradaan_sentidos_misticos'){
    return 'Visão Mística';
  }
  if(nameKey === 'ataque_elemental' || key === 'mistico_ataque_elemental' || key === 'ataque_elemental'){
    return '1PM: +1d8 dano extra';
  }
  if(nameKey === 'lingua_primordial' || key === 'mistico_lingua_primordial' || key === 'lingua_primordial'){
    const affs = typeof characterMysticAffinities === 'function' ? characterMysticAffinities() : [];
    const elem = affs[0] || state.identity?.classChoices?.elemento || 'fogo';
    const data = typeof characterMysticElementData === 'function' ? characterMysticElementData() : {};
    const elemName = (data[elem]?.name || elem || 'fogo').toLocaleLowerCase('pt-BR');
    const prep = ['água', 'agua', 'terra'].includes(elemName) ? 'da ' : 'do ';
    return 'fala c/ espíritos ' + prep + elemName;
  }
  if(nameKey === 'corpo_elemental' || key === 'mistico_corpo_elemental' || key === 'corpo_elemental'){
    return '+5PV ou +10PV';
  }
  if(nameKey === 'tradicao_oral' || key === 'mistico_tradicao_oral' || key === 'tradicao_oral'){
    return '+2 em Misticismo';
  }
  if(nameKey === 'sexto_sentido' || key === 'mistico_sexto_sentido' || key === 'sexto_sentido'){
    return 'soma SAB na Def lim./nível';
  }
  if(nameKey === 'ditame_das_chamas' || key === 'mistico_ditame_das_chamas'){
    return 'Explosão Chamas';
  }
  if(nameKey === 'ditame_do_espadachim' || key === 'mistico_ditame_do_espadachim'){
    return 'Concentração Combate';
  }
  if(nameKey === 'ditame_das_brumas' || key === 'mistico_ditame_das_brumas') return 'Névoa';
  if(nameKey === 'ditame_do_breu' || key === 'mistico_ditame_do_breu') return 'Escuridão';
  if(nameKey === 'ditame_do_crepusculo' || key === 'mistico_ditame_do_crepusculo') return 'Consagrar, Profanar';
  if(nameKey === 'ditame_da_chuva' || key === 'mistico_ditame_da_chuva') return 'Área Escorregadia';
  if(nameKey === 'ditame_da_cura' || key === 'mistico_ditame_da_cura') return 'Curar Ferimentos';
  if(nameKey === 'ditame_da_manha' || key === 'mistico_ditame_da_manha') return 'Luz';
  if(nameKey === 'ditame_da_montanha' || key === 'mistico_ditame_da_montanha') return 'Primor Atlético';
  if(nameKey === 'ditame_da_profecia' || key === 'mistico_ditame_da_profecia') return 'Augúrio';
  if(nameKey === 'ditame_dos_portais' || key === 'mistico_ditame_dos_portais') return 'Salto Dimensional';
  if(nameKey === 'ditame_dos_ventos' || key === 'mistico_ditame_dos_ventos') return 'Queda Suave';

  if(nameKey === 'teurgista_mistico' || key === 'teurgista_mistico'){
    const teurgistId = Object.entries(spellState().selections||{}).find(([k])=>k.startsWith('teurgist:'))?.[1]?.[0];
    if(teurgistId){
      const sp = typeof spellById === 'function' ? spellById(teurgistId) : null;
      if(sp?.name) return sp.name;
    }
    return 'Curar Ferimentos';
  }

  if(nameKey === 'presente_de_wynlla' || key === 'presente_de_wynlla'){
    const wSpellId = typeof characterWynllaSpells === 'function' ? characterWynllaSpells()[0] : (state.powers?.wynllaSpell || state.identity?.powerChoices?.presente_de_wynlla);
    if(wSpellId){
      const sp = typeof spellById === 'function' ? spellById(wSpellId) : null;
      if(sp?.name) return sp.name + ' -1PM';
    }
    return 'Reduz aprimoramentos em -1PM';
  }

  if(key==='aumento_de_atributo'||nameKey==='aumento_de_atributo'){
    const attr=feature.sheetAttribute;
    return attr?String(ATTR_LABEL[attr]||attr).toLocaleLowerCase('pt-BR'):'+1 atributo';
  }
  if(key==='tatuagem_mistica'||nameKey==='tatuagem_mistica'){
    return (spellState().selections['race:qareen_tatuagem_mistica']||[]).map(id=>spellById(id)?.name).filter(Boolean).join(', ')||'escolher magia';
  }
  if(key==='duplo_feerico'||nameKey==='duplo_feerico'){
    const options=Object.values(state.identity.raceChoices||{}).filter(value=>typeof value==='string'&&slug(value).includes('audacia'));
    if(options.length)return 'Audácia';
  }
  if(key==='resistencia_elemental'||nameKey==='resistencia_elemental'){
    const chosen=state.identity.raceChoices?.qareen_resistencia_elemental||state.identity.raceChoices?.resistencia_elemental||Object.entries(state.identity.raceChoices||{}).find(([k,v])=>k.includes('resistencia_elemental'))?.[1];
    if(chosen)return String(chosen).toLocaleLowerCase('pt-BR');
    const effect=(feature.efeitos||[]).find(effect=>effect.tipo==='reducao_dano');
    if(effect)return (effect.tipos||[effect.danoTipo]).filter(Boolean).join('/')||('RD '+effect.valor);
  }
  if(key==='afinidade'||key==='afinidade_elemental'||nameKey==='afinidade'||nameKey==='afinidade_elemental'){
    const aff=typeof characterMysticAffinities==='function'?characterMysticAffinities():[];
    if(aff.length){
      const data=typeof characterMysticElementData==='function'?characterMysticElementData():{};
      return aff.map(a=>(data[a]?.name||a).toLocaleLowerCase('pt-BR')).join(', ');
    }
    const direct=state.identity?.classChoices?.elemento||state.identity?.classChoices?.afinidade||state.identity?.classChoices?.mistico_afinidade_elemental;
    if(direct)return String(direct).toLocaleLowerCase('pt-BR');
  }
  const choiceVal=state.identity.classChoices?.[feature.id]||state.identity.raceChoices?.[feature.id];
  if(choiceVal&&typeof choiceVal==='string'){
    const allOptions=(feature.escolhas||[]).flatMap(c=>c.opcoes||[]).concat(feature.escolha?.opcoes||[]);
    const opt=allOptions.find(o=>o.id===choiceVal||o.nome===choiceVal);
    if(opt?.nome)return opt.nome.toLocaleLowerCase('pt-BR');
  }
  if(feature?.id&&DATA.suppliedFeatureSummaries?.[feature.id])return DATA.suppliedFeatureSummaries[feature.id];
  return summaries[key]||summaries[nameKey]||((feature.efeitos||[]).length?compactFeatureDescription(feature):'');
}
function sheetFeatureDisclosure(feature, isLevel = false){
  const label = feature.nome;
  const summary = '';
  const familiar=typeof familiarById==='function'?familiarById(feature.sheetAttribute):null;
  const isCosmo = feature?.origemRegional === 'Cosmopolita' || String(feature?.id || '').startsWith('cosmopolita:') || slug(feature?.id || feature?.nome || '') === 'cosmopolita';
  
  if (isCosmo) {
    const cosmoDescText = feature.originDesc || feature.cosmoDesc || 'Escolha um poder geral ou de uma classe na qual você tenha pelo menos dois níveis, e cujos requisitos você cumpra (exceto poderes concedidos ou da Tormenta). Você recebe esse poder. Uma vez por aventura, após concluir um descanso (oito horas de sono), pode trocar esse poder por outro.';
    const chosenName = feature.chosenPower?.nome || (String(feature.nome || '').startsWith('Cosmopolita(') ? feature.nome.replace(/^Cosmopolita\(/, '').replace(/\)$/, '') : (String(feature.nome || '').startsWith('Cosmopolita: ') ? feature.nome.replace(/^Cosmopolita:\s*/, '') : ''));
    const chosenDesc = feature.powerDesc || feature.chosenPower?.descricao || (chosenName ? feature.descricao : '');
    
    let cosmoBody = '<p>' + esc(cosmoDescText) + '</p>';
    if (chosenName && chosenDesc && chosenDesc !== cosmoDescText) {
      cosmoBody += '<p style="margin-top:10px"><strong>' + esc(chosenName) + ':</strong> ' + esc(chosenDesc) + '</p>';
    }
    cosmoBody += '<div style="margin-top:12px"><button type="button" class="button small" data-action="open-cosmopolita-swap" style="font-size:0.75rem;padding:4px 12px;border-color:var(--gold2);color:var(--gold2);cursor:pointer">Trocar</button></div>';
    
    return '<details class="sheet-feature"><summary><strong>'+esc(label)+'</strong></summary>'+cosmoBody+'</details>';
  }

  const isRegionalPowerOrigin = feature?.origemRegional === 'Futura Lenda' || feature?.origemRegional === 'Duplo Feérico' || feature?.id === 'futura_lenda' || feature?.id === 'duplo_feerico' || String(feature?.id || '').startsWith('duplo_feerico:');
  if (isRegionalPowerOrigin) {
    const originTitle = feature?.origemRegional || (String(feature?.nome || '').startsWith('Futura Lenda') ? 'Futura Lenda' : 'Duplo Feérico');
    const originDescText = feature.originDesc || (originTitle === 'Futura Lenda'
      ? 'Você recebe um poder de sua classe cujo pré-requisito de nível seja no máximo 2º nível.'
      : 'Você possui uma ligação mística com outra classe. Escolha um poder de 1º nível de outra classe (exceto poderes concedidos ou da Tormenta). Você recebe esse poder.');
    const chosenName = feature.chosenPower?.nome || (String(feature.nome || '').includes('(') ? feature.nome.replace(/^[^(]+\(/, '').replace(/\)$/, '') : '');
    const chosenDesc = feature.powerDesc || feature.chosenPower?.descricao || (chosenName ? feature.descricao : '');
    let regionalBody = '<p>' + esc(originDescText) + '</p>';
    if (chosenName && chosenDesc && chosenDesc !== originDescText) {
      regionalBody += '<p style="margin-top:10px"><strong>' + esc(chosenName) + ':</strong> ' + esc(chosenDesc) + '</p>';
    }
    return '<details class="sheet-feature"><summary><strong>'+esc(label)+'</strong></summary>'+regionalBody+'</details>';
  }

  const isCriacaoDeuses = feature?.id === 'criacao_dos_deuses' || feature?.source === 'criacao_dos_deuses' || String(feature?.nome || '').startsWith('Criação dos Deuses');
  if (isCriacaoDeuses) {
    const originDescText = feature.originDesc || 'Você foi criado por um dos deuses maiores de Arton, mas deixou seu plano natal muito cedo. Você se torna um espírito, mas retém as características de seu tipo original e recebe redução de dano 5 conforme a energia canalizada pelo deus. Por fim, recebe o poder Escolhido dos Deuses para a divindade escolhida.';
    const chosenName = feature.chosenPower?.nome || (String(feature.nome || '').includes('(') ? feature.nome.replace(/^[^(]+\(/, '').replace(/\)$/, '') : '');
    const chosenDesc = feature.powerDesc || feature.chosenPower?.descricao || (chosenName ? feature.descricao : '');
    const aparencia = feature.aparencia || feature.chosenPower?.aparencia || '';
    let body = '<p>' + esc(originDescText) + '</p>';
    if (aparencia) {
      body += '<p style="margin-top:10px"><strong>Aparência física:</strong> ' + esc(aparencia) + '</p>';
    }
    if (chosenName && chosenDesc && chosenDesc !== originDescText) {
      body += '<p style="margin-top:10px"><strong>' + esc(chosenName) + ':</strong> ' + esc(chosenDesc) + '</p>';
    }
    return '<details class="sheet-feature"><summary><strong>'+esc(label)+'</strong></summary>'+body+'</details>';
  }

  const isAgenteElite = slug(feature?.id || feature?.nome || '') === 'agente_de_elite' ||
    slug(feature?.id || feature?.nome || '') === 'nobre_agente_de_elite' ||
    /agente de elite/i.test(feature?.nome || '');

  if (isAgenteElite) {
    const agenteChoice = (typeof getAgenteEliteChoice === 'function' ? getAgenteEliteChoice() : null) || (typeof state !== 'undefined' ? state.agenteElite : null);
    const baseDesc = feature.descricao || 'Você recebe um agente especial, um parceiro veterano que fornece os benefícios de um parceiro a sua escolha (Tormenta20, p. 260) ou um poder de outra classe, cujos pré-requisitos você cumpra (para efeitos de nível na classe desse poder, considere seu nível de nobre −4). No início de cada aventura, você pode trocar seu agente.';
    let choiceBoxHtml = '';
    if (agenteChoice) {
      if (agenteChoice.mode === 'partner') {
        choiceBoxHtml = '<div style="margin-top:10px;padding:8px 10px;background:rgba(217,168,78,0.08);border:1px solid rgba(217,168,78,0.25);border-radius:6px;font-size:0.78rem;">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">' +
            '<strong style="color:var(--gold2);">Parceiro Veterano: ' + esc(agenteChoice.name || agenteChoice.id) + '</strong>' +
            '<span class="tag gold" style="font-size:0.65rem;">' + esc(agenteChoice.partnerType || (agenteChoice.isMount ? 'Montaria' : 'Parceiro')) + '</span>' +
          '</div>' +
          (agenteChoice.role ? '<div style="color:#cbd5e1;font-size:0.72rem;margin-top:2px;">' + esc(agenteChoice.role) + '</div>' : '') +
          (agenteChoice.benefit ? '<div style="margin-top:6px;color:#94a3b8;font-size:0.72rem;"><strong>Benefício:</strong> ' + esc(agenteChoice.benefit) + '</div>' : '') +
        '</div>';
      } else if (agenteChoice.mode === 'power') {
        choiceBoxHtml = '<div style="margin-top:10px;padding:8px 10px;background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.25);border-radius:6px;font-size:0.78rem;">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">' +
            '<strong style="color:#38bdf8;">Poder de Outra Classe: ' + esc(agenteChoice.name || agenteChoice.powerId) + '</strong>' +
            '<span class="tag" style="background:#0284c7;color:#fff;font-size:0.65rem;">' + esc(agenteChoice.className || agenteChoice.classId) + '</span>' +
          '</div>' +
          (agenteChoice.descricao ? '<div style="margin-top:6px;color:#94a3b8;font-size:0.72rem;">' + esc(agenteChoice.descricao) + '</div>' : '') +
        '</div>';
      }
    } else {
      choiceBoxHtml = '<div style="margin-top:10px;padding:8px 10px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-radius:6px;font-size:0.78rem;color:#fca5a5;">' +
        'Nenhum agente ou poder selecionado ainda. Clique no botão abaixo para escolher seu parceiro veterano ou poder.' +
      '</div>';
    }

    const swapBtn = '<div style="margin-top:12px;display:flex;gap:8px;align-items:center;">' +
      '<button type="button" class="button small" data-action="open-agente-elite-swap" style="font-size:0.75rem;padding:4px 12px;border-color:var(--gold2);color:var(--gold2);cursor:pointer">' +
        (agenteChoice ? 'Trocar Agente de Elite' : 'Escolher Agente de Elite') +
      '</button>' +
    '</div>';

    return '<details class="sheet-feature"><summary><strong>' + esc(label) + '</strong></summary><p>' + esc(baseDesc) + '</p>' + choiceBoxHtml + swapBtn + '</details>';
  }

  const isFamElem = slug(feature?.id || feature?.nome || '').includes('familiar_elemental') || /familiar elemental/i.test(feature?.nome || '');
  if(isFamElem){
    const opt = feature?.elementalFamiliarOption || (typeof getSelectedElementalFamiliarOption === 'function' ? getSelectedElementalFamiliarOption() : null);
    const baseDesc = feature.descricao || 'Você recebe um parceiro espírito arcano que o acompanha em suas aventuras (em termos de jogo, um parceiro adepto iniciante que não conta em seu limite de parceiros). Se você possuir o suplemento Ameaças de Arton, também pode escolher entre um aquin\'ne, um t\'peel, um pakk ou um terrier.';
    const extra = opt ? '<p style="margin-top:8px"><strong>' + esc(opt.name) + ':</strong> ' + esc(opt.description) + '</p>' : '';
    return '<details class="sheet-feature"><summary><strong>' + esc(label) + '</strong></summary><p style="white-space:pre-line">' + esc(baseDesc) + '</p>' + extra + '</details>';
  }

  const isBarao = slug(feature?.id || feature?.nome || '') === 'barao_arruinado' || /bar[aã]o arruinado/i.test(feature?.nome || '');
  const baraoBtn = isBarao ?
    ' <button type="button" class="button small" data-vital-action="open-temp-bonuses" title="Adicionar bônus temporário" style="display:inline-flex;align-items:center;margin-left:8px;padding:1px 7px;font-size:0.68rem;height:20px;line-height:1;border-color:var(--gold2);color:var(--gold2);vertical-align:middle;cursor:pointer">Bônus temp.</button>' : '';
  const baraoAction = isBarao ?
    '<div style="margin-top:10px"><button type="button" class="button small" data-vital-action="open-temp-bonuses" style="font-size:0.75rem;padding:5px 12px;border-color:var(--gold2);color:var(--gold2);cursor:pointer">Adicionar bônus temporário</button></div>' : '';

  return '<details class="sheet-feature"><summary><strong>'+esc(label)+'</strong>'+baraoBtn+(summary?'<span>('+esc(summary)+')</span>':'')+(familiar?'<span> · '+esc(familiar[1])+'</span>':'')+'</summary><p style="white-space:pre-line">'+esc(feature.descricao||'')+'</p>'+baraoAction+(familiar?'<p><strong>'+esc(familiar[1])+':</strong> '+esc(familiar[2])+'</p>':'')+'</details>';
}
function reduceEnhancementCosts(htmlOrText, reduction = 1){
  if(!htmlOrText || reduction <= 0) return htmlOrText;
  return htmlOrText.replace(/\+(\d+)\s*PM\s*:/g, (match, costStr) => {
    const cost = parseInt(costStr, 10);
    return `+${Math.max(0, cost - reduction)} PM:`;
  });
}
let memoizedSpellCardsMap=null;
function getSpellCardSnippet(id){
  if(!id)return 'Consulte o texto completo no Grimório.';
  const cleanId=String(id).replace(/_/g,'-');
  if(!memoizedSpellCardsMap){
    memoizedSpellCardsMap=new Map();
    if(typeof DATA!=='undefined'&&DATA.grimoireHtml&&typeof document!=='undefined'&&document.createElement){
      const holder=document.createElement('div');holder.innerHTML=DATA.grimoireHtml;
      const cards=typeof holder.querySelectorAll==='function'?[...holder.querySelectorAll('[data-spell-key]')]:[];
      for(const card of cards){
        const key=card.dataset?.spellKey;
        const html=[...card.querySelectorAll('.card-props,.card-desc,.truque-section,.apr-section')].map(s=>s.outerHTML).join('');
        if(key) memoizedSpellCardsMap.set(key,html);
      }
    }
  }
  let html=memoizedSpellCardsMap.get(id)||memoizedSpellCardsMap.get(cleanId);
  if(!html&&typeof DATA!=='undefined'&&DATA.spellTexts){
    const text=DATA.spellTexts[id]||DATA.spellTexts[cleanId];
    if(text){
      html='<div class="card-desc"><p style="white-space:pre-line">'+esc(text)+'</p></div>';
      memoizedSpellCardsMap.set(id,html);
    }
  }
  if(!html)html='Consulte o texto completo no Grimório.';
  if(typeof isSpellWynllaEnhanced==='function'&&isSpellWynllaEnhanced(id)){
    html=reduceEnhancementCosts(html,1);
  }
  return formatSpellSnippetHtml(html);
}
function formatSpellSnippetHtml(rawHtml){
  if(!rawHtml) return rawHtml;
  let formatted = rawHtml
    .replace(/<div class="apr-title">[^<]*<\/div>/gi, '')
    .replace(/<div class="prop-row">\s*<span class="prop-label">([^<]+)<\/span>\s*<span class="prop-value">([^<]+)<\/span>\s*<\/div>/gi, (match, label, value) => {
      const cleanLabel = label.trim().replace(/:$/, '');
      const cleanVal = value.trim();
      const capitalizedVal = cleanVal.length ? (cleanVal.charAt(0).toUpperCase() + cleanVal.slice(1)) : cleanVal;
      return `<div class="prop-row"><strong class="prop-label">${cleanLabel}:</strong> <span class="prop-value">${capitalizedVal}</span></div>`;
    }).replace(/<span class="prop-label">([^<]+)<\/span>\s*<span class="prop-value">([^<]+)<\/span>/gi, (match, label, value) => {
      const cleanLabel = label.trim().replace(/:$/, '');
      const cleanVal = value.trim();
      const capitalizedVal = cleanVal.length ? (cleanVal.charAt(0).toUpperCase() + cleanVal.slice(1)) : cleanVal;
      return `<strong class="prop-label">${cleanLabel}:</strong> <span class="prop-value">${capitalizedVal}</span>`;
    });

  // Remove palavra isolada 'Aprimoramentos' antes de aprimoramentos e separa rótulos colados
  formatted = formatted
    .replace(/Aprimoramentos(?:\s*:\s*|\s*)(?=[+0-9]|Truque)/gi, '')
    .replace(/(^|>|\n)(Execu[çc][aã]o)(?!:)\s*([A-Za-zÀ-ÿ0-9])/gi, '$1$2: $3')
    .replace(/(^|>|\n)(Alcance)(?!:)\s*([A-Za-zÀ-ÿ0-9])/gi, '$1$2: $3')
    .replace(/(^|>|\n)(Alvo)(?!:)\s*([A-Za-zÀ-ÿ0-9])/gi, '$1$2: $3')
    .replace(/(^|>|\n)([AÁ]rea)(?!:)\s*([A-Za-zÀ-ÿ0-9])/gi, '$1$2: $3')
    .replace(/(^|>|\n)(Efeito)(?!:)\s*([A-Za-zÀ-ÿ0-9])/gi, '$1$2: $3')
    .replace(/(^|>|\n)(Dura[çc][aã]o)(?!:)\s*([A-Za-zÀ-ÿ0-9])/gi, '$1$2: $3')
    .replace(/(^|>|\n)(Resist[eê]ncia)(?!:)\s*([A-Za-zÀ-ÿ0-9])/gi, '$1$2: $3');

  return formatted;
}
function characterSpellcastingSources(){
  const plan=typeof spellPlan==='function'?spellPlan():null;
  if(!plan?.classes?.length)return[];
  const attrs=finalAttrs(),halfLevel=Math.floor(Math.max(1,Number(state.identity?.plannedLevel)||1)/2),sources=[];
  for(const clsInfo of plan.classes){
    const classId=clsInfo.classId,cls=classById(classId);
    let attrKey='int';
    if(classId==='arcanista'){
      attrKey=clsInfo.path==='feiticeiro'?'car':'int';
    }else if(classId==='bardo'||classId==='paladino'||classId==='usurpador'){
      attrKey='car';
    }else if(classId==='clerigo'||classId==='druida'||classId==='frade'||classId==='mistico'||classId==='santo'){
      attrKey='sab';
    }else{
      const effectDef=(cls?.habilidades||[]).flatMap(h=>h.efeitos||[]).find(e=>e.tipo==='definir_atributo_chave_magia');
      if(effectDef?.atributo&&attrs[effectDef.atributo]!==undefined)attrKey=effectDef.atributo;
    }
    const attrMod=Number(attrs[attrKey]||0);
    const hasRecruta = (typeof characterHasFeature==='function'&&characterHasFeature('recruta_arcano')) ||
      slug(state.origin?.regional||'')==='recruta_arcano' || slug(state.origin?.standard||'')==='recruta_arcano' ||
      (state.origin?.benefits||[]).some(b=>slug(b).includes('recruta_arcano'));
    const cdBonus = hasRecruta ? 1 : 0;
    const cd=10+halfLevel+attrMod+cdBonus;
    sources.push({classId,name:clsInfo.name||cls?.nome||classId,tradition:clsInfo.type==='divina'?'Divina':'Arcana',attrKey,attrName:ATTR_LABEL[attrKey]||attrKey.toUpperCase(),attrMod,cd});
  }
  return sources;
}
function sheetLearnedSpells(){
  const sources=characterSpellcastingSources();
  const cdHeader=sources.length?'<div class="sheet-spell-sources-bar" style="display:flex;flex-wrap:wrap;gap:12px;padding:8px 11px;background:#101622;border-bottom:1px solid var(--border);font-size:0.68rem">'+sources.map(src=>'<span><strong>'+esc(src.name)+' ('+src.tradition+'):</strong> CD <strong style="color:var(--gold2);font-size:0.75rem">'+src.cd+'</strong> · Atributo-chave: '+src.attrName+' ('+(src.attrMod>=0?'+':'')+src.attrMod+')</span>').join('')+'</div>':'';
  const entries=typeof characterSpellEntries==='function'?[...characterSpellEntries()]:[];
  const isDuende = slug(state.identity?.raceId || '') === 'duende' || slug(state.identity?.race || '') === 'duende';
  if(isDuende && !entries.some(e => /Presentes de Magia (?:e de|e) Caos/i.test(e))){
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
    const finalGifts = giftNames.length > 0 ? giftNames : ['Encantar Objetos', 'Maldição', 'Mais Lá do que Aqui'];
    entries.push('Presentes de Magia e Caos(' + finalGifts.join('/') + ')');
  }
  const renderedList=entries.map(entry=>{
    const spellName=entry.replace(/\s*\([^)]*\)/g,'').trim();
    const spell=DATA.spells.find(s=>s.name.toLowerCase()===spellName.toLowerCase());
    let detailContent='';
    if(spell){
      detailContent='<div class="sheet-spell-text">'+getSpellCardSnippet(spell.id)+'</div>';
    }else if(/Presentes de Magia (?:e de|e) Caos/i.test(entry)){
      const race = typeof raceById === 'function' ? raceById(state.identity?.raceId) : null;
      const group = (typeof racePowerGroups === 'function' ? racePowerGroups() : []).find(g => g.id === 'duende_presentes')
        || (race?.habilidades?.selecionadas || []).find(h => h.id === 'duende_presentes');
      const allOpts = group?.options || group?.opcoes || (typeof DATA !== 'undefined' && DATA.races ? DATA.races.find(r => r.id === 'duende')?.habilidades?.selecionadas?.find(h => h.id === 'duende_presentes')?.opcoes : []) || [];
      const rawList = state.powers?.raceGroups?.duende_presentes
        || state.identity?.raceChoices?.duende_presentes
        || [];
      let ids = Array.isArray(rawList) ? rawList : (typeof rawList === 'string' ? rawList.split(/[,|/]/).map(s => s.trim()) : []);
      if(ids.length === 0){
        const parenMatch = entry.match(/\(([^)]+)\)/);
        if(parenMatch){
          ids = parenMatch[1].split('/').map(s => s.trim());
        } else {
          ids = ['Encantar Objetos', 'Maldição', 'Mais Lá do que Aqui'];
        }
      }
      const chosenOpts = ids.map(id => {
        const cleanId = String(id).trim();
        return allOpts.find(o =>
          choiceId(o) === cleanId ||
          choiceName(o) === cleanId ||
          slug(o.nome || o.id) === slug(cleanId)
        );
      }).filter(Boolean);
      if(chosenOpts.length > 0){
        detailContent = '<div class="sheet-duende-gifts">' + chosenOpts.map(opt => '<p style="margin-bottom:8px"><strong>' + esc(choiceName(opt)) + ':</strong> ' + esc(opt.descricao || '') + '</p>').join('') + '</div>';
      } else {
        detailContent = '<p>Você recebe três poderes da lista de Presentes de Magia e de Caos da raça Duende.</p>';
      }
    }else if(/Sentidos M[íi]sticos/i.test(entry)){
      const race = typeof raceById === 'function' ? raceById(state.identity?.raceId) : null;
      const allFeats = typeof selectedCharacterFeatures === 'function' ? selectedCharacterFeatures() : [];
      const feat = allFeats.find(f => /Sentidos M[íi]sticos/i.test(f.nome || '')) || (race?.habilidades?.fixas || []).find(f => /Sentidos M[íi]sticos/i.test(f.nome || ''));
      const desc = feat?.descricao || 'Você está sempre sob efeito de Visão Mística.';
      detailContent = '<p>' + esc(desc) + '</p><div class="sheet-spell-text" style="margin-top:10px">' + getSpellCardSnippet('visao-mistica') + '</div>';
    }else{
      const allFeats=typeof selectedCharacterFeatures==='function'?selectedCharacterFeatures():[];
      const feat=allFeats.find(f=>(f.nome||'').toLowerCase().includes(spellName.toLowerCase())||spellName.toLowerCase().includes((f.nome||'').toLowerCase()));
      if(feat&&feat.descricao){
        detailContent='<p>'+esc(feat.descricao)+'</p>';
      }
    }
    const relearnMatch=entry.match(/\(-(\d+)\s*PM\)/i);
    const tag=(relearnMatch&&!entry.includes('Presente de Wynlla'))?' <span class="tag gold" style="font-size:0.62rem;margin-left:6px;vertical-align:middle">–'+relearnMatch[1]+' PM</span>':'';
    const displayTitle=tag?entry.replace(/\s*\(-(\d+)\s*PM\)/i,''):entry;
    return '<details class="sheet-feature"><summary><strong>'+esc(displayTitle)+'</strong>'+tag+'</summary>'+detailContent+'</details>';
  });
  const grimBtnHtml = '<button class="button small primary" type="button" data-sheet-action="grimoire" data-grimoire-view="learned" style="font-size:0.65rem;padding:2px 8px;min-height:22px;height:22px;line-height:1">Grimório</button>';
  return '<section class="sheet-preview-box"><div style="display:flex;align-items:center;justify-content:space-between;padding:9px 11px;border-bottom:1px solid var(--border)"><h3 style="padding:0;border-bottom:none">Magias</h3>'+grimBtnHtml+'</div>'+cdHeader+'<div class="sheet-preview-feature-list">'+renderedList.join('')+'</div></section>';
}
document.addEventListener('click',event=>{
  if(!event.target.closest?.('[data-sheet-skill-order]'))return;
  event.preventDefault();
  event.stopImmediatePropagation();
  state.sheetSkillOrder=state.sheetSkillOrder==='attribute'?'alphabetical':'attribute';
  persist();
  if(typeof updateSheetSkillsOnly==='function'&&updateSheetSkillsOnly()){
    return;
  }
  renderStage();
});
document.addEventListener('input',event=>{
  const key=event.target.dataset.sheetNote;
  if(key&&['conditions','notes'].includes(key)){
    state.sheetNotes??={};
    state.sheetNotes[key]=event.target.value;
    persist();
    if(state.finished&&typeof saveFinishedCharacter==='function')saveFinishedCharacter();
    return;
  }
  const field=event.target.dataset.sheetField;
  if(field==='alignment'){
    state.identity=state.identity||{};
    state.identity.alignment=event.target.value;
    state.sheetNotes=state.sheetNotes||{};
    state.sheetNotes.alignment=event.target.value;
    persist();
    if(state.finished&&typeof saveFinishedCharacter==='function')saveFinishedCharacter();
  } else if(field==='age'){
    state.identity=state.identity||{};
    state.identity.age=event.target.value;
    state.sheetNotes=state.sheetNotes||{};
    state.sheetNotes.age=event.target.value;
    if(state.age&&!state.age.enabled){
      state.age.years=event.target.value;
    }
    persist();
    if(state.finished&&typeof saveFinishedCharacter==='function')saveFinishedCharacter();
  }
});
function sheetInventoryLoad(){
  const items=new Map(DATA.inventoryLoadData.items.map(item=>[item.id,item])),improvements=new Map(DATA.inventoryLoadData.improvements.map(item=>[item.id,item]));
  const used=characterInventory().reduce((sum,entry)=>{
    if(mountAssignmentActive(entry))return sum;
    let item=items.get(entry.itemId)||entry.itemSnapshot||{};
    const attached = entry.attachedItem || entry.engenhocaInfo?.attachedItem || item.attachedItem || item.engenhocaInfo?.attachedItem;
    let spaces;
    if (attached) {
      const itemEsp = attached.espacos != null ? Number(attached.espacos) : (items.get(attached.id)?.espacos != null ? Number(items.get(attached.id).espacos) : 0);
      spaces = itemEsp + 1;
    } else {
      spaces = Number(item.magico?.espacosFixos ?? items.get(item.magico?.baseItemId)?.espacos ?? entry.espacos ?? item.espacos ?? 0);
    }
    if(['comum','aventureiro','discreta','carga'].includes(RegrasMochilas.tipoMochila(entry.itemId,item.nome||entry.itemName||entry.displayName||'')))spaces=0;
    if(entry.itemId==='instrumento_musical_exotico')spaces=Number(entry.options?.customSpaces)||0;
    if(entry.itemId==='ferramenta_pesada_lanca')spaces=Number(items.get(entry.options?.weaponModel==='maca'?'maca':'lanca')?.espacos)||0;
    const choices=item.magico?.melhoriasFixasIds?item.magico.melhoriasFixasIds.map(id=>({id,materialId:item.magico.materialEspecialId})):entry.improvements||[];
    for(const choice of choices){if(choice.id==='material_especial'&&choice.materialId==='mitral')spaces=Math.max(1,spaces-1);for(const effect of improvements.get(choice.id)?.efeitos||[])if(effect.tipo==='reduzir_espacos_item')spaces=Math.max(Number(effect.minimo)||0,spaces-(Number(effect.valor)||0))}
    return sum+spaces*Number(entry.quantity??1);
  },0);
  const mountAlforjeBonus = (state.partners || []).some(p => (typeof mountGear === 'function' ? mountGear(p) : []).some(e => e.itemId === 'alforje')) ? 10 : 0;
  const tpeelBonus = (typeof hasFamiliarElementalPower === 'function' && hasFamiliarElementalPower() && typeof getSelectedElementalFamiliarId === 'function' && getSelectedElementalFamiliarId() === 'tpeel') ? 2 : 0;
  const mochilaBonus=RegrasMochilas.beneficiosMochilas(mochilasVestidas(),poderesCarga(),finalAttrs());
  const baseLimit=Math.max(0,10+(mochilaBonus.valor>=0?2*mochilaBonus.valor:mochilaBonus.valor));
  const bonusSpaces=mochilaBonus.bonus+bonusPoderesCarga()+Math.max(0,Number(suraggelCarryingBonus())||0)+mountAlforjeBonus+tpeelBonus;
  const limit=baseLimit+bonusSpaces;
  return {used,limit,maximum:limit*2,baseLimit,bonusSpaces};
}
function renderSheetPartnersBlock(){
  state.partners = Array.isArray(state.partners) ? state.partners : [];
  const maxPartners = (typeof characterMaxPartners === 'function' ? characterMaxPartners() : 1);
  const countedPartners = state.partners.filter(p => !p.ignoraLimite && p.countsTowardsLimit !== false && !p.special).length;
  const usersIcon = window.IconesForja ? window.IconesForja.get('users', 'icon-sm') : '';
  const countBadge = `<span class="sheet-partners-count">${countedPartners}/${maxPartners}</span>`;
  
  let content = '';
  if(state.partners.length === 0){
    content = '<p class="sheet-partners-empty">Adicione aliados para receber seus bônus.</p>';
  } else {
    content = '<div class="sheet-partners-list">' + state.partners.map((p, idx) => {
      const isMount = !!mountRecord(p);
      const typeInfo = typeof partnerTypeById === 'function' ? partnerTypeById(p.type || p.tipo) : { name: p.type || 'Aliado', benefitIniciante: '', benefitMestre: '' };
      const tierLabel = { iniciante: 'Iniciante', veterano: 'Veterano', mestre: 'Mestre' }[p.tier || 'iniciante'] || 'Iniciante';
      
      if(isMount){
        return '<div class="sheet-partner-item sheet-partner-mount-item">' +
          '<div class="sheet-partner-header">' +
            '<strong>' + esc(p.name || typeInfo.name || 'Montaria') + '</strong>' +
            '<button type="button" class="sheet-partner-remove-btn" data-action="remove-sheet-partner" data-index="' + idx + '" title="Remover parceiro">×</button>' +
          '</div>' +
          renderMountControls(p, idx) +
        '</div>';
      }

      const isHelper = slug(p.type || p.tipo || '').includes('ajudante');
      let benefitText = p.benefit || (p.tier === 'mestre' ? typeInfo.benefitMestre : typeInfo.benefitIniciante) || '';
      if(isHelper){
        const skills = Array.isArray(p.skills) ? p.skills : (Array.isArray(p.pericias) ? p.pericias : (p.skill ? [p.skill] : []));
        const bonusVal = p.tier === 'mestre' ? '+4' : '+2';
        const skNames = skills.map(s => (typeof SKILL_LABEL !== 'undefined' && SKILL_LABEL[s]) ? SKILL_LABEL[s] : s).filter(Boolean);
        if (skNames.length > 0) {
          benefitText = bonusVal + ' em ' + skNames.join(', ') + '.';
        }
      }

      const isFamiliarElemental =
        p.id === 'familiar_elemental' ||
        p.tipo === 'familiar_elemental' ||
        p.type === 'familiar_elemental' ||
        slug(p.nome || '').includes('familiar_elemental') ||
        slug(p.name || '').includes('familiar_elemental') ||
        slug(p.origem || '').includes('familiar_elemental') ||
        p.origem === 'Familiar Elemental' ||
        Boolean(p.elementalOption || p.elementalId) ||
        p.partnerType === 'Familiar Elemental' ||
        /t['’]?peel|aquin['’]?ne|pakk|terrier/i.test(p.nome || p.name || p.benefit || p.descricao || '');

      let displayName = '';
      if (isFamiliarElemental) {
        let elementalChoiceName = '';
        if (typeof getSelectedElementalFamiliarOption === 'function') {
          const opt = getSelectedElementalFamiliarOption();
          if (opt) elementalChoiceName = opt.shortName || opt.name;
        }
        if (!elementalChoiceName) {
          const textToTest = `${p.nome || ''} ${p.name || ''} ${p.partnerType || ''} ${p.descricao || ''} ${p.benefit || ''}`;
          if (/t['’]?peel/i.test(textToTest)) elementalChoiceName = "T’peel";
          else if (/aquin['’]?ne/i.test(textToTest)) elementalChoiceName = "Aquin’ne";
          else if (/pakk/i.test(textToTest)) elementalChoiceName = "Pakk";
          else if (/terrier/i.test(textToTest)) elementalChoiceName = "Terrier";
          else if (/adepto/i.test(textToTest)) elementalChoiceName = "Adepto Iniciante";
          else if (p.nome && !p.nome.includes('familiar_elemental')) {
            elementalChoiceName = p.nome.replace(/^Familiar\s+Elemental:?\s*/i, '');
          }
        }
        displayName = elementalChoiceName ? `Familiar Elemental: ${elementalChoiceName}` : 'Familiar Elemental: T’peel';
      } else {
        displayName = `${p.nome || p.name || typeInfo.name || 'Parceiro'} ${tierLabel}`;
      }

      return '<div class="sheet-partner-item">' +
        '<div class="sheet-partner-header">' +
          '<strong>' + esc(displayName) + '</strong>' +
          '<button type="button" class="sheet-partner-remove-btn" data-action="remove-sheet-partner" data-index="' + idx + '" title="Remover parceiro">×</button>' +
        '</div>' +
        (benefitText ? '<p class="sheet-partner-benefit">' + esc(benefitText) + '</p>' : '') +
      '</div>';
    }).join('') + '</div>';
  }

  return '<div class="sheet-partners-card">' +
    '<div class="sheet-partners-card-header">' +
      '<div class="sheet-partners-title">' +
        '<span class="sheet-heading-icon sheet-partners-icon" aria-hidden="true">' + usersIcon + '</span>' +
        '<strong>PARCEIROS</strong>' +
        countBadge +
      '</div>' +
      '<a href="guilda.html" class="sheet-partner-add-btn" aria-label="Adicionar parceiro" title="Adicionar parceiro">+</a>' +
    '</div>' +
    '<div class="sheet-partners-card-body">' + content + '</div>' +
  '</div>';
}

function sheetMoneyAndLoad(){
  const load=sheetInventoryLoad(),c=typeof characterCoins==='function'?characterCoins():{tc:0,ts:remainingFunds(),to:0},space=typeof coinSpaces==='function'?coinSpaces():0,fmt=n=>Number(n).toLocaleString('pt-BR',{maximumFractionDigits:2});
  const arrows=(up,down,canUp,canDown)=>`<div class="coin-arrows"><button type="button" data-coin-action="${up}" title="${canUp?'Converter tudo para cima':'Saldo insuficiente para converter'}" ${canUp?'':'disabled'}>→</button><button type="button" data-coin-action="${down}" title="${canDown?'Converter uma moeda para baixo':'Não há moeda para converter'}" ${canDown?'':'disabled'}>←</button></div>`;
  const loadTooltip = (load.bonusSpaces && load.bonusSpaces > 0)
    ? `title="Limite: ${fmt(load.limit)} espaços (${fmt(load.baseLimit)} base + ${fmt(load.bonusSpaces)} bônus de espaços)"`
    : '';
  const moneyLoadHtml = `<div class="sheet-money-load compact-money-load"><div><small>TC</small><strong>${fmt(c.tc)}</strong></div>${arrows('tc-up','ts-down',c.tc>=10,c.ts>=1)}<div><small>T$</small><strong>${fmt(c.ts)}</strong></div>${arrows('ts-up','to-down',c.ts>=10,c.to>=1)}<div><small>TO</small><strong>${fmt(c.to)}</strong></div><div><small>Moedas</small><strong>${fmt(space)} esp.</strong></div><div ${loadTooltip}><small>Lim. carga</small><strong>${fmt(load.limit)}</strong></div><div><small>Usada</small><strong>${fmt(load.used)}</strong></div><div ${loadTooltip}><small>Máx.</small><strong>${fmt(load.maximum)}</strong></div></div>`;
  return `<div class="sheet-money-load-partners-row">${moneyLoadHtml}</div>`;
}
function sheetConditions(){
  state.sheetNotes??={};
  if(!Array.isArray(state.sheetNotes.conditionSlots)){
    const old=String(state.sheetNotes.conditions||'');
    state.sheetNotes.conditionSlots=Array(4).fill('');
    if(old){
      const known=(DATA.conditions||[]).find(name=>slug(name)===slug(old));
      if(known)state.sheetNotes.conditionSlots[0]=known;
      else state.sheetNotes.notes=[state.sheetNotes.notes,old].filter(Boolean).join('\n');
    }
  }
  const slots=state.sheetNotes.conditionSlots.slice(0,4);
  while(slots.length<4)slots.push('');
  const overloaded=sheetInventoryLoad().used>sheetInventoryLoad().limit;
  if(overloaded){
    let existing=slots.indexOf('Sobrecarregado');
    if(existing<0){
      const emptyIdx=slots.indexOf('');
      const targetIdx=emptyIdx>=0?emptyIdx:3;
      slots[targetIdx]='Sobrecarregado';
    }
  }
  return slots;
}
function renderSheetConditions(){
  const slots=sheetConditions(),overloaded=sheetInventoryLoad().used>sheetInventoryLoad().limit;
  return '<div class="sheet-conditions">'+slots.map((selected,index)=>'<select class="select" aria-label="Condição '+(index+1)+'" data-condition-slot="'+index+'" '+(overloaded&&selected==='Sobrecarregado'?'disabled title="Personagem sobrecarregado (penalidade de -3m no movimento e -5 de penalidade de armadura)"':'')+'><option value="">Sem condição</option>'+[...new Set([...(DATA.conditions||[]),selected])].filter(Boolean).map(name=>'<option value="'+esc(name)+'" '+(selected===name?'selected':'')+'>'+esc(name)+'</option>').join('')+'</select>').join('')+'</div>';
}
function sheetMovement(){const mount=activeMountContext(false);return Math.max(0,(mount?mount.speed:characterBaseMovement())-(sheetConditions().includes('Sobrecarregado')?3:0))}

function mountRecord(partner){
 const species=RegrasMontarias.especieMontaria([partner.name,partner.nome,partner.type,partner.tipo].filter(Boolean).join(' '));
 if(!species)return null;
 const sizes=RegrasMontarias.tamanhosMontaria(species);
 if(!partner.mountId)partner.mountId=partner.id||crypto.randomUUID();
 return {species,size:partner.mountSize||sizes[0],sizes,tier:partner.tier||partner.grau||'iniciante',id:partner.mountId};
}
function mountAssignmentActive(entry){return (state.partners||[]).some(p=>p.mountId&&(p.mountId===entry.mountPartnerId||p.mountId===entry.carriedByMountId));}
function mountInventorySpaces(entry){
 const catalog=getEquipmentCatalog(),item=catalog.get(entry.itemId)||entry.itemSnapshot||entry,attached=entry.attachedItem||entry.engenhocaInfo?.attachedItem;
 let spaces=attached?Number(attached.espacos??catalog.get(attached.id)?.espacos??0)+1:Number(item.magico?.espacosFixos??catalog.get(item.magico?.baseItemId)?.espacos??entry.espacos??item.espacos??0);
 if(['comum','aventureiro','discreta','carga'].includes(RegrasMochilas.tipoMochila(entry.itemId,item.nome||'')))spaces=0;
 const improvements=new Map(DATA.inventoryLoadData.improvements.map(i=>[i.id,i]));
 for(const choice of entry.improvements||[]){if(choice.id==='material_especial'&&choice.materialId==='mitral')spaces=Math.max(1,spaces-1);for(const effect of improvements.get(choice.id)?.efeitos||[])if(effect.tipo==='reduzir_espacos_item')spaces=Math.max(Number(effect.minimo)||0,spaces-(Number(effect.valor)||0));}
 return Math.max(0,spaces)*Number(entry.quantity??1);
}
function mountGear(partner){return characterInventory().filter(e=>e.mountPartnerId===partner.mountId);}
function activeMountContext(requireGuided=false,heroSize=null){
 const p=(state.partners||[]).find(p=>p.mounted);if(!p)return null;
 const m=mountRecord(p);if(!m||!RegrasMontarias.podeMontar(heroSize||characterSizeId(),m.size,m.species,m.tier))return null;
 const gear=mountGear(p).map(e=>RegrasMontarias.tipoEquipamentoAnimal(e.itemId));
 const speeds={cavalo:[12,15,15],ponei:[12,15,15],cao_de_caca:[9,12,12],lobo:[12,15,15],lobo_das_cavernas:[12,15,15],grifo:[0,18,18],gorlogg:[12,12,15],trobo:[9,12,12]};
 const tier=['iniciante','veterano','mestre'].indexOf(m.tier);
 return {...m,guided:true,speed:(speeds[m.species]?.[Math.max(0,tier)]||9)-(gear.includes('armadura_de_montaria_pesada')?3:0),gear,ginete:poderesCarga().some(p=>slug(p).includes('ginete'))};
}
function renderMountControls(partner,index){
 const m=mountRecord(partner);if(!m)return '';
 const inv=characterInventory(),cat=getEquipmentCatalog(),gear=mountGear(partner),hasSaddle=gear.some(e=>e.itemId==='sela');
 const can=RegrasMontarias.podeMontar(characterSizeId(),m.size,m.species,m.tier);
 const speeds={cavalo:[12,15,15],ponei:[12,15,15],cao_de_caca:[9,12,12],lobo:[12,15,15],lobo_das_cavernas:[12,15,15],grifo:[0,18,18],gorlogg:[12,12,15],trobo:[9,12,12]};
 const tier=['iniciante','veterano','mestre'].indexOf(m.tier);
 const mountSpeed=speeds[m.species]?.[Math.max(0,tier)]||12;
 const benefitText=partner.benefit||(m.species==='cavalo'?'Seu deslocamento muda para 12m e você recebe uma ação de movimento extra por turno (apenas para se deslocar).':'Seu deslocamento muda para '+mountSpeed+'m.');

 let gearRows=gear.map(e=>{
  const item=cat.get(e.itemId);
  const desc=e.itemId==='sela'?'Sela: Cavalgar sem sela impõe –5 no teste.':(e.itemId==='alforje'?'Alforje: Aumenta o limite de carga do personagem em +10 espaços.':(item?.textos?.habilidade||item?.descricao||'Item equipado na montaria.'));
  return '<div class="sheet-mount-gear-line" style="display:flex;align-items:center;gap:8px;margin-top:4px;"><button type="button" class="button small sheet-mount-item-btn" data-mount-remove-gear="'+esc(equipEntryId(e,inv.indexOf(e)))+'" title="Clique para desequipar" style="background:#991b1b;border:1px solid #b91c1c;color:#fff;font-weight:700;font-size:0.65rem;padding:2px 8px;min-height:22px;height:22px;line-height:1;border-radius:4px;cursor:pointer;">'+esc(item?.nome||e.itemId)+'</button> <span class="sheet-mount-gear-desc" style="font-size:0.75rem;color:var(--text,#cbd5e1);">'+esc(desc)+'</span></div>';
 }).join('');

 if(gear.length<2){
  gearRows+='<div class="sheet-mount-gear-line" style="margin-top:6px;"><button type="button" class="button small sheet-mount-equip-open-btn" data-action="open-mount-equip-modal" data-mount-index="'+index+'" style="background:#991b1b;border:1px solid #b91c1c;color:#fff;font-weight:700;font-size:0.65rem;padding:2px 12px;min-height:22px;height:22px;line-height:1;border-radius:4px;cursor:pointer;">Equipar</button></div>';
 }

 return '<div class="sheet-mount-controls" data-mount-index="'+index+'" style="margin-top:6px;">'+
  '<p class="sheet-partner-benefit" style="margin:0 0 6px 0;font-size:0.78rem;line-height:1.4;color:var(--text,#cbd5e1);">'+esc(benefitText)+'</p>'+
  '<div class="sheet-mount-status-row" style="display:flex;align-items:center;gap:10px;margin-bottom:6px;font-size:0.75rem;color:var(--gold2,#f0d28c);">'+
   '<span>'+gear.length+'/2 itens vestidos · '+(hasSaddle?'Com sela':'Sem sela: –5 em Cavalgar')+'</span>'+
   '<button class="button small sheet-mount-toggle-btn" type="button" data-mount-toggle '+(!can&&!partner.mounted?'disabled':'')+' style="background:#991b1b;border:1px solid #b91c1c;color:#fff;font-weight:700;font-size:0.65rem;padding:2px 10px;min-height:22px;height:22px;line-height:1;border-radius:4px;cursor:pointer;">'+(partner.mounted?'Desmontar':'Montar')+'</button>'+
  '</div>'+
  (!can&&!partner.mounted?'<p class="sheet-mount-warning" style="color:var(--red,#ef4444);font-size:0.7rem;margin:4px 0 0;">A montaria precisa ser maior que o herói para ser montada.</p>':'')+
  '<div class="sheet-mount-gear-list">'+gearRows+'</div>'+
 '</div>';
}
function saveMountChange(inventory){
 if(inventory){const saved=arsenalState(),updated=RegrasInventario.atualizarPerfis(saved.storage[ARSENAL_PROFILES_KEY],backpack=>{backpack.splice(0,backpack.length,...inventory);});if(updated)saved.storage[ARSENAL_PROFILES_KEY]=updated;}
 persistNow();if(typeof scheduleSaveFinishedCharacter==='function')scheduleSaveFinishedCharacter();renderStage();
}
function openMountEquipModal(mountIndex){
 const p=(state.partners||[])[mountIndex],m=mountRecord(p);if(!p||!m)return;
 const inv=characterInventory(),cat=getEquipmentCatalog();
 const available=inv.map((e,i)=>({e,i})).filter(({e})=>RegrasMontarias.tipoEquipamentoAnimal(e.itemId)&&!e.mountPartnerId);
 let modal=document.getElementById('forjaMountEquipModal');
 if(!modal){
  modal=document.createElement('div');modal.id='forjaMountEquipModal';modal.className='modal-backdrop';modal.style.zIndex='999992';
  document.body.appendChild(modal);
 }
 const content=available.length===0
  ?'<p style="text-align:center;color:var(--muted,#94a3b8);padding:20px 0;font-size:0.85rem;">Nenhum equipamento de montaria (sela, alforje, armadura de montaria) disponível na mochila.<br><small style="color:var(--dim,#64748b);">Adquira esses itens na loja ou forja para equipar no animal.</small></p>'
  :'<div class="sheet-mount-equip-modal-list" style="display:flex;flex-direction:column;gap:8px;max-height:360px;overflow-y:auto;padding:8px 0;">'+available.map(({e,i})=>{
     const it=cat.get(e.itemId);
     const desc=e.itemId==='sela'?'Sela: Permite cavalgar sem penalidade de –5.':(e.itemId==='alforje'?'Alforje: +10 espaços de carga para o herói.':(it?.textos?.habilidade||it?.descricao||'Equipamento animal.'));
     return '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;background:#151b26;padding:8px 12px;border:1px solid var(--border,#2b3445);border-radius:4px;">'+
      '<div><strong style="color:var(--gold2,#f0d28c);display:block;font-size:0.85rem;">'+esc(it?.nome||e.itemName||e.itemId)+'</strong><span style="font-size:0.75rem;color:var(--muted,#94a3b8);">'+esc(desc)+'</span></div>'+
      '<button type="button" class="button small sheet-mount-equip-now-btn" data-mount-equip-now-btn="true" data-mount-equip-idx="'+i+'" data-mount-idx="'+mountIndex+'" style="background:#991b1b;border:1px solid #b91c1c;color:#fff;font-weight:700;white-space:nowrap;padding:2px 10px;font-size:0.72rem;min-height:24px;height:24px;line-height:1;cursor:pointer;">Equipar</button>'+
     '</div>';
    }).join('')+'</div>';

 modal.innerHTML='<div class="modal-dialog" style="max-width:480px;background:#0d1117;border:1px solid #7f1d1d;border-radius:8px;padding:16px;box-shadow:0 16px 40px rgba(0,0,0,0.85);">'+
  '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;border-bottom:1px solid #2b3445;padding-bottom:8px;">'+
   '<h4 style="margin:0;font-family:Cinzel,serif;color:var(--gold2,#f0d28c);font-size:0.95rem;text-transform:uppercase;">Equipar na Montaria ('+esc(p.name||m.species)+')</h4>'+
   '<button type="button" class="button small" data-mount-equip-close style="min-height:22px;height:22px;width:22px;padding:0;line-height:1;font-size:0.95rem;cursor:pointer;">×</button>'+
  '</div>'+
  content+
  '<div style="display:flex;justify-content:flex-end;margin-top:12px;border-top:1px solid #2b3445;padding-top:8px;">'+
   '<button type="button" class="button small" data-mount-equip-close style="background:#991b1b;border:1px solid #b91c1c;color:#fff;font-weight:700;padding:2px 14px;font-size:0.72rem;min-height:24px;height:24px;line-height:1;cursor:pointer;">Fechar</button>'+
  '</div>'+
 '</div>';
 modal.hidden=false;modal.style.display='grid';
}

document.addEventListener('click',event=>{
 const openEquip=event.target.closest('[data-action="open-mount-equip-modal"]');
 if(openEquip){
  event.preventDefault();openMountEquipModal(Number(openEquip.dataset.mountIndex));return;
 }
 const closeEquip=event.target.closest('[data-mount-equip-close]');
 if(closeEquip||event.target?.id==='forjaMountEquipModal'){
  const modal=document.getElementById('forjaMountEquipModal');
  if(modal){modal.remove();}
  return;
 }
 const equipNow=event.target.closest('.sheet-mount-equip-now-btn, [data-mount-equip-idx], [data-mount-equip-now-btn]');
 if(equipNow){
  event.preventDefault();
  const inv=characterInventory(),entry=inv[Number(equipNow.dataset.mountEquipIdx)];
  const p=(state.partners||[])[Number(equipNow.dataset.mountIdx)],m=mountRecord(p);
  if(!entry||!p||!m)return;
  const gear=mountGear(p);
  if(gear.length>=2){toast('A montaria já está usando o limite de 2 itens.');return;}
  if(entry.itemId==='alforje'&&!gear.some(e=>e.itemId==='sela')){toast('É necessário ter uma sela equipada antes do alforje.');return;}
  const error=RegrasMontarias.validarEquipamentoMontaria(gear.map(e=>RegrasMontarias.tipoEquipamentoAnimal(e.itemId)),RegrasMontarias.tipoEquipamentoAnimal(entry.itemId),m.species==='grifo'&&m.tier!=='iniciante');
  if(error){toast(error);return;}
  entry.mountPartnerId=m.id;
  const modal=document.getElementById('forjaMountEquipModal');
  if(modal){modal.remove();}
  saveMountChange(inv);
  toast(`Equipou ${entry.itemName||entry.itemId} na montaria.`);
  return;
 }
 const target=event.target.closest('[data-mount-toggle],[data-mount-remove-gear]');if(!target)return;
 const mountBox=target.closest('[data-mount-index]');if(!mountBox)return;
 const p=state.partners[Number(mountBox.dataset.mountIndex)],m=mountRecord(p);if(!m)return;
 if(target.hasAttribute('data-mount-toggle')){
  if(!p.mounted&&!RegrasMontarias.podeMontar(characterSizeId(),m.size,m.species,m.tier))return;
  (state.partners||[]).forEach(other=>{if(other!==p)other.mounted=false;});
  p.mounted=!p.mounted;
  saveMountChange();
  return;
 }
 const id=target.dataset.mountRemoveGear;
 if(id){
  const inv=characterInventory(),i=inv.findIndex((e,i)=>matchEquipmentEntry(e,i,id)),e=inv[i];if(!e)return;
  if(e.itemId==='sela'&&mountGear(p).some(e=>e.itemId==='alforje')){toast('Retire o alforje antes da sela.');return;}
  delete e.mountPartnerId;
  saveMountChange(inv);
  toast('Item retirado da montaria.');
 }
});
function sheetSkillResult(id,trained){const restricted=['adestramento','atuacao','conhecimento','guerra','jogatina','ladinagem','misticismo','nobreza','oficio','pilotagem','religiao'];return !trained&&restricted.includes(String(id).split(':')[0])?'<span aria-label="Exige treinamento" style="color:var(--red,#ef4444);font-weight:700">—</span>':calculatedSkillTotal(id)}
