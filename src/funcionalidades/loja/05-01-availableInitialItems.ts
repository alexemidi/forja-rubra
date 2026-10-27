
function availableInitialItems(){
  let results;
  const branch=activeBranch();
  const effectiveChoice=effectiveInitialChoice();
  if(effectiveChoice?.isSamuraiKatana || effectiveChoice?.isAristocrataKatana){
    const katana=itemById.get('katana')||preparedItems.find(item=>item.id==='katana');
    return katana?[katana]:[];
  }
  if(effectiveChoice?.isBudgetGrant){
    const hasUnlimitedBudget = Boolean(effectiveChoice.unlimitedBudget || effectiveChoice.maxBudget === Infinity);
    const maxBudget=hasUnlimitedBudget ? Infinity : Number(effectiveChoice.maxBudget||1000);
    const allowedTypes=effectiveChoice.types?new Set(effectiveChoice.types):null;
    const isCraftChoice = Boolean(effectiveChoice.isCraftableChoice || (maxBudget === 50 && /fabricar/i.test(effectiveChoice.title || '')));
    const rawOffices = (typeof (window as any).allTrainedOffices === 'function' ? (window as any).allTrainedOffices() : null) || (typeof (window as any).arsenalInitialState !== 'undefined' ? (window as any).arsenalInitialState?.trainedOffices : null) || [];
    const trainedOffices = rawOffices.length > 0 ? rawOffices : ['artesao'];
    const exclusiveIds = typeof (window as any).ORIGIN_EXCLUSIVE_ITEM_IDS !== 'undefined' ? (window as any).ORIGIN_EXCLUSIVE_ITEM_IDS : new Set(['rolo_de_macarrao', 'martelo_de_carne', 'ferramenta_pesada', 'ferramenta_pesada_lanca', 'ferramenta_agricola', 'animal_nao_combativo', 'joia_de_familia', 'joia_falsificada', 'item_artistico', 'replica_peca_artistica_elfica', 'cutelo', 'bolas_malabarismo', 'dente_falso']);
    results=preparedItems.filter(item=>{
      if(item.categoriaId==='servico')return false;
      if(item.origemExclusiva||exclusiveIds.has(item.id))return false;

      // 1. Limite estrito de preço até maxBudget (ex: até T$ 50)
      const price = Number(item.preco?.valor ?? item.price ?? 0);
      if(!hasUnlimitedBudget && Number.isFinite(maxBudget) && price > maxBudget) return false;

      // 2. Se for escolha de item fabricável, apenas os itens que ele pode fabricar com seus ofícios
      if(isCraftChoice){
        if(isSpecificMagicItem(item) || isLiturgicalItem(item) || isNamedFixedMagicItem(item)) return false;
        if(typeof (window as any).isItemCraftableByOffices === 'function' && !(window as any).isItemCraftableByOffices(item, trainedOffices)) return false;
      }

      if(allowedTypes&&!allowedTypes.has(item.tipo))return false;
      const specificOk = state.specific === 'todos' ||
        (state.specific === 'especifico' && isSpecificMagicItem(item)) ||
        (state.specific === 'liturgico' && isLiturgicalItem(item)) ||
        (state.specific === 'convencional' && !isNamedFixedMagicItem(item));
      if (!specificOk) return false;
      const tierOk = !state.magicTier || state.magicTier === 'todos' || (
        (state.specific === 'especifico' || state.specific === 'liturgico') &&
        (typeof getItemMagicTier === 'function' ? getItemMagicTier(item) : (item.magico?.categoriaId || item.magico?.grau)) === state.magicTier
      );
      if (!tierOk) return false;
      if(state.type!=='todos'&&item.tipo!==state.type)return false;
      if(state.category!=='todos'&&item.categoriaId!==state.category)return false;
      if(state.combat!=='todos'&&item.arma?.combateId!==state.combat)return false;
      if(state.grip!=='todos'&&item.arma?.empunhaduraId!==state.grip)return false;
      return true;
    });
    if(state.search){
      const term=starterKey(state.search);
      results=results.filter(item=>{
        const nameMatch=starterKey(item.nome).includes(term);
        if(state.searchNameOnly)return nameMatch;
        const searchMatch=starterKey(item._search||item.descricao||'').includes(term);
        return nameMatch||searchMatch;
      });
    }

    // Ordenação: sempre A-Z se for escolha de fabricação
    if(isCraftChoice){
      results.sort((a,b)=>a.nome.localeCompare(b.nome, 'pt-BR'));
    } else {
      results.sort(function(a, b) {
        if (state.sort === 'price-asc') return Number(a.preco?.valor || 0) - Number(b.preco?.valor || 0) || a.nome.localeCompare(b.nome, 'pt-BR');
        if (state.sort === 'price-desc') return Number(b.preco?.valor || 0) - Number(a.preco?.valor || 0) || a.nome.localeCompare(b.nome, 'pt-BR');
        if (state.sort === 'space-asc') return Number(a.espacos || 0) - Number(b.espacos || 0) || a.nome.localeCompare(b.nome, 'pt-BR');
        if (state.sort === 'type') return (TYPE_META[a.tipo] && TYPE_META[a.tipo].label || a.tipo).localeCompare(TYPE_META[b.tipo] && TYPE_META[b.tipo].label || b.tipo, 'pt-BR') || a.nome.localeCompare(b.nome, 'pt-BR');
        return a.nome.localeCompare(b.nome, 'pt-BR');
      });
    }
    return results;
  }
  const choiceCats=effectiveChoice?.categories?.length?effectiveChoice.categories:(effectiveChoice?.category&&effectiveChoice.category!=='todos'?[effectiveChoice.category]:null);
  if(effectiveChoice?.allowNamedOrFilter){
    const allowedNames=new Set((effectiveChoice.names||[]).map(starterKey));
    const allowedCats=new Set(choiceCats||[]);
    results=preparedItems.filter(item=>{
      if(isSpecificMagicItem(item)||isLiturgicalItem(item)||isNamedFixedMagicItem(item))return false;
      const key=starterKey(item.nome);
      if(allowedNames.has(key))return true;
      if(allowedCats.has(item.categoriaId))return true;
      return false;
    });
  }else if(!branch&&initialChoice?.branches?.length&&state.search){
    const allNames=new Set(),allCats=new Set();let hasAllowNamedOr=false;
    initialChoice.branches.forEach(b=>{
      if(b.allowNamedOrFilter)hasAllowNamedOr=true;
      (b.names||[]).forEach(n=>allNames.add(starterKey(n)));
      (b.categories||(b.category?[b.category]:[])).forEach(c=>allCats.add(c));
    });
    if(hasAllowNamedOr){
      results=preparedItems.filter(item=>{
        if(isSpecificMagicItem(item)||isLiturgicalItem(item)||isNamedFixedMagicItem(item))return false;
        const key=starterKey(item.nome);
        return allNames.has(key)||allCats.has(item.categoriaId);
      });
    }else{
      results=filteredItems().filter(item=>!isSpecificMagicItem(item)&&!isLiturgicalItem(item));
      if(allCats.size)results=results.filter(item=>allCats.has(item.categoriaId));
      if(allNames.size)results=results.filter(item=>allNames.has(starterKey(item.nome)));
    }
  }else if(effectiveChoice?.names?.length){
    const allowed=new Set(effectiveChoice.names.map(starterKey));
    results=preparedItems.filter(item=>{
      if(isSpecificMagicItem(item)||isLiturgicalItem(item))return false;
      const key=starterKey(item.nome);
      if(allowed.has(key))return true;
      for(const a of allowed){
        if(key.includes(a)||a.includes(key))return true;
      }
      return false;
    });
    if(choiceCats?.length)results=results.filter(item=>choiceCats.includes(item.categoriaId));
    if(effectiveChoice.type&&effectiveChoice.type!=='todos')results=results.filter(item=>item.tipo===effectiveChoice.type);
  }else{
    results=preparedItems.filter(item=>!isSpecificMagicItem(item)&&!isLiturgicalItem(item));
    if(effectiveChoice?.type&&effectiveChoice.type!=='todos')results=results.filter(item=>item.tipo===effectiveChoice.type);
    if(choiceCats?.length)results=results.filter(item=>choiceCats.includes(item.categoriaId));
  }
  if(effectiveChoice?.combat)results=results.filter(item=>item.arma?.combateId===effectiveChoice.combat);
  if(state.combat && state.combat !== 'todos') {
    results = results.filter(item => item.arma && (item.arma.combateId === state.combat || (state.combat === 'corpo_a_corpo' && item.arma.combateId === 'corpo_a_corpo_e_distancia') || (state.combat === 'distancia' && item.arma.combateId === 'corpo_a_corpo_e_distancia')));
  }
  if(state.grip && state.grip !== 'todos') {
    results = results.filter(item => item.arma && item.arma.empunhaduraId === state.grip);
  }
  if(state.category && state.category !== 'todos' && !choiceCats?.length) {
    results = results.filter(item => item.categoriaId === state.category);
  }
  if(effectiveChoice?.damageTypes?.length)results=results.filter(item=>item.arma&&(item.arma.tipoDanoIds||[]).some(d=>effectiveChoice.damageTypes.includes(d)));
  if(effectiveChoice?.dwarfWeaponOnly)results=results.filter(item=>/machado|machadinha|martelo|marreta|picareta/i.test(item.nome||''));
  if(effectiveChoice?.maxPrice!=null&&Number.isFinite(Number(effectiveChoice.maxPrice)))results=results.filter(item=>Number(item.preco?.valor||0)<=Number(effectiveChoice.maxPrice));
  if(state.search){
    const term=starterKey(state.search);
    results=results.filter(item=>{
      const nameMatch=starterKey(item.nome).includes(term);
      if(state.searchNameOnly)return nameMatch;
      const searchMatch=starterKey(item._search||item.descricao||'').includes(term);
      return nameMatch||searchMatch;
    });
  }
  const exclusiveIds = typeof ORIGIN_EXCLUSIVE_ITEM_IDS !== 'undefined' ? ORIGIN_EXCLUSIVE_ITEM_IDS : new Set(['rolo_de_macarrao', 'martelo_de_carne', 'ferramenta_pesada', 'ferramenta_pesada_lanca', 'ferramenta_agricola', 'animal_nao_combativo', 'joia_de_familia', 'joia_falsificada', 'item_artistico', 'replica_peca_artistica_elfica', 'cutelo', 'bolas_malabarismo', 'dente_falso']);
  const isOriginChoice = (effectiveChoice?.source === 'origin' || effectiveChoice?.isOriginGrant) && !effectiveChoice?.isBudgetGrant;
  const explicitlyAllowed = new Set((effectiveChoice?.names || []).map(starterKey));
  results = results.filter(item => {
    if (typeof isOriginExclusiveItemAllowed === 'function') {
      return isOriginExclusiveItemAllowed(item);
    }
    if (item.origemExclusiva || exclusiveIds.has(item.id)) {
      if (!isOriginChoice) return false;
      const key = starterKey(item.nome);
      const rawKey = starterKey(item.id);
      if (explicitlyAllowed.has(key) || explicitlyAllowed.has(rawKey)) return true;
      for (const a of explicitlyAllowed) {
        if (a && (key === a || rawKey === a || key.startsWith(a))) return true;
      }
      return false;
    }
    return true;
  });
  results.sort(function(a, b) {
    if (state.sort === 'price-asc') return Number(a.preco?.valor || 0) - Number(b.preco?.valor || 0) || a.nome.localeCompare(b.nome, 'pt-BR');
    if (state.sort === 'price-desc') return Number(b.preco?.valor || 0) - Number(a.preco?.valor || 0) || a.nome.localeCompare(b.nome, 'pt-BR');
    if (state.sort === 'space-asc') return Number(a.espacos || 0) - Number(b.espacos || 0) || a.nome.localeCompare(b.nome, 'pt-BR');
    if (state.sort === 'type') return (TYPE_META[a.tipo] && TYPE_META[a.tipo].label || a.tipo).localeCompare(TYPE_META[b.tipo] && TYPE_META[b.tipo].label || b.tipo, 'pt-BR') || a.nome.localeCompare(b.nome, 'pt-BR');
    return a.nome.localeCompare(b.nome, 'pt-BR');
  });
  return results;
}
function restoreCandidate(){
  itemsGrid.querySelectorAll('.item-card').forEach(card=>{
    const isCand=card.dataset.itemId===selectedCandidate?.itemId;
    card.classList.toggle('candidate',isCand);
    const btn=card.querySelector('[data-action="add-to-cart"]');
    if(btn){
      btn.innerHTML=isCand?'Item Selecionado':'Selecionar item';
    }
    if(isCand&&selectedCandidate){
      const titleElem=card.querySelector('.item-title')||card.querySelector('.item-name strong');
      const item=itemById.get(selectedCandidate.itemId);
      if(titleElem&&item){
        titleElem.textContent=configuredItemName(selectedCandidate,item);
      }
    }
  });
}
const duplicateChoiceModal=document.createElement('div');
duplicateChoiceModal.className='app-modal modal-backdrop duplicate-choice-modal';
duplicateChoiceModal.hidden=true;
duplicateChoiceModal.style.zIndex='99999';
duplicateChoiceModal.innerHTML='<section class="modal-panel" role="dialog" aria-labelledby="dupChoiceTitle" style="max-width:540px;width:100%;box-shadow:0 12px 36px rgba(0,0,0,0.8)"><header class="modal-header"><h3 id="dupChoiceTitle" style="margin:0;color:var(--gold2,#f5d78e)">Item já escolhido</h3></header><div class="modal-body" id="dupChoiceBody" style="padding:16px 0;font-size:0.95rem;line-height:1.5"></div><footer class="modal-actions" style="display:flex;gap:10px;justify-content:flex-end;margin-top:14px"><button type="button" class="secondary-button" data-action="dup-cancel">Escolher outro item</button><button type="button" class="primary-button" data-action="dup-confirm">Manter escolha</button></footer></section>';
document.body.appendChild(duplicateChoiceModal);
let pendingDuplicateCallback=null;
duplicateChoiceModal.addEventListener('click',event=>{
  const confirmBtn=event.target.closest?.('[data-action="dup-confirm"]');
  if(confirmBtn){event.preventDefault();event.stopImmediatePropagation();const cb=pendingDuplicateCallback;pendingDuplicateCallback=null;closeModal(duplicateChoiceModal);duplicateChoiceModal.hidden=true;duplicateChoiceModal.style.display='none';if(cb)cb(true);return}
  const cancelBtn=event.target.closest?.('[data-action="dup-cancel"]');
  if(cancelBtn){event.preventDefault();event.stopImmediatePropagation();const cb=pendingDuplicateCallback;pendingDuplicateCallback=null;closeModal(duplicateChoiceModal);duplicateChoiceModal.hidden=true;duplicateChoiceModal.style.display='none';if(cb)cb(false);return}
});
function confirmDuplicateChoice(item,onConfirm,onCancel){
  const currentBackpack=activeCharacterProfile()?.backpack||backpackItems;
  const existing=currentBackpack.find(entry=>entry.itemId===item.id);
  const currentQty=existing?(Number(existing.quantity)||1):1;
  const newQty=currentQty+1;
  duplicateChoiceModal.querySelector('#dupChoiceBody').innerHTML='<p>Você já possui <strong>'+escapeHtml(item.nome)+'</strong> em seu inventário ('+currentQty+' '+(currentQty>1?'unidades':'unidade')+').</p><p style="margin-top:8px">Deseja manter esta escolha e adicionar mais uma unidade (ficando com <strong>Qtd: '+newQty+'</strong> ocupando '+newQty+' espaços no total), ou prefere escolher outro item?</p>';
  duplicateChoiceModal.querySelector('[data-action="dup-confirm"]').textContent='Manter e adicionar (Qtd '+newQty+')';
  pendingDuplicateCallback=function(accepted){if(accepted){if(onConfirm)onConfirm()}else{if(onCancel)onCancel()}};
  openModal(duplicateChoiceModal);
  duplicateChoiceModal.hidden=false;
  duplicateChoiceModal.style.display='grid';
}

const seenBudgetModals = new Set();
function getBudgetModalContent(maxBudget, choiceTitle){
  if(maxBudget === 1000){
    return '<p style="line-height:1.6;margin-bottom:12px">Você possui um <strong>orçamento concedido de até T$ 1.000</strong> por <strong>'+escapeHtml(choiceTitle||'Herança')+'</strong>.</p>'+
      '<ul style="margin:0 0 16px 20px;padding:0;line-height:1.7;color:var(--text)">'+
      '<li>Você pode escolher <strong>qualquer item</strong> do catálogo com preço de até <strong>T$ 1.000</strong> sem melhorias.</li>'+
      '<li>Ou pode escolher um item de até <strong>T$ 700</strong> e adicionar <strong>1 melhoria</strong> com o ícone de martelo (<strong>Melhorias</strong>) (+T$ 300 = até T$ 1.000).</li>'+
      '<li style="color:var(--muted)"><em>Materiais especiais não estão disponíveis pois o custo mínimo (T$ 1.500) ultrapassa o orçamento concedido.</em></li>'+
      '</ul>'+
      '<p style="font-size:0.85rem;color:var(--muted);margin:0">Use a busca e os filtros avançados normalmente para navegar por todas as abas de itens.</p>';
  }
  if(maxBudget === 2000){
    return '<p style="line-height:1.6;margin-bottom:12px">Você possui um <strong>orçamento concedido de até T$ 2.000</strong> para <strong>'+escapeHtml(choiceTitle||'esta escolha')+'</strong>.</p>'+
      '<ul style="margin:0 0 16px 20px;padding:0;line-height:1.7;color:var(--text)">'+
      '<li>Você pode escolher <strong>qualquer item</strong> do catálogo com preço de até <strong>T$ 2.000</strong> sem melhorias.</li>'+
      '<li>Ou escolher um item de até <strong>T$ 1.700</strong> e adicionar <strong>1 melhoria</strong> com o ícone de martelo (<strong>Melhorias</strong>) (+T$ 300 = até T$ 2.000).</li>'+
      '<li>Ou escolher um item de até <strong>T$ 200</strong> com <strong>material especial de T$ 1.500</strong> (+T$ 300 da melhoria = T$ 2.000 no total).</li>'+
      '</ul>'+
      '<p style="font-size:0.85rem;color:var(--muted);margin:0">Use a busca e os filtros avançados normalmente para navegar por todas as abas de itens.</p>';
  }
  if(maxBudget === 500){
    return '<p style="line-height:1.6;margin-bottom:12px">Você possui um <strong>orçamento concedido de até T$ 500</strong> para <strong>'+escapeHtml(choiceTitle||'esta escolha')+'</strong>.</p>'+
      '<ul style="margin:0 0 16px 20px;padding:0;line-height:1.7;color:var(--text)">'+
      '<li>Você pode escolher <strong>qualquer item</strong> do catálogo com preço de até <strong>T$ 500</strong> sem melhorias.</li>'+
      '<li>Ou escolher um item de até <strong>T$ 200</strong> e adicionar <strong>1 melhoria</strong> com o ícone de martelo (<strong>Melhorias</strong>) (+T$ 300 = T$ 500 no total).</li>'+
      '</ul>'+
      '<p style="font-size:0.85rem;color:var(--muted);margin:0">Use a busca e os filtros avançados normalmente para navegar por todas as abas de itens.</p>';
  }
  if(!Number.isFinite(maxBudget)){
    return '<p style="line-height:1.6;margin-bottom:12px">Você possui direito a <strong>'+escapeHtml(choiceTitle||'esta escolha')+'</strong> sem limite de orçamento.</p>'+
      '<ul style="margin:0 0 16px 20px;padding:0;line-height:1.7;color:var(--text)">'+
      '<li>Você pode escolher <strong>qualquer item</strong> do catálogo de qualquer valor.</li>'+
      '<li>Adicione as melhorias permitidas diretamente com o ícone de martelo (<strong>Melhorias</strong>).</li>'+
      '</ul>'+
      '<p style="font-size:0.85rem;color:var(--muted);margin:0">Use a busca e os filtros avançados normalmente para navegar por todas as abas de itens.</p>';
  }
  return '<p style="line-height:1.6;margin-bottom:12px">Você possui um <strong>orçamento concedido de até T$ '+formatCurrencyValue(maxBudget, '')+'</strong> para <strong>'+escapeHtml(choiceTitle||'esta escolha')+'</strong>.</p>'+
    '<ul style="margin:0 0 16px 20px;padding:0;line-height:1.7;color:var(--text)">'+
    '<li>Você pode escolher qualquer item do catálogo com preço de até <strong>T$ '+formatCurrencyValue(maxBudget, '')+'</strong>.</li>'+
    '<li>Se o item suportar melhorias e o valor total com a melhoria (+T$ 300) não exceder o teto, use o ícone de martelo (<strong>Melhorias</strong>).</li>'+
    '</ul>'+
    '<p style="font-size:0.85rem;color:var(--muted);margin:0">Use a busca e os filtros avançados normalmente para navegar por todas as abas de itens.</p>';
}

let centerNoticeTimer = null;
const warnedBudgetChoices = new Set();
function ensureCenterNoticeElement(){
  let elem = document.getElementById('centerChoiceNotice');
  if(!elem){
    elem = document.createElement('div');
    elem.id = 'centerChoiceNotice';
    elem.className = 'center-choice-notice budget-warning';
    elem.setAttribute('role', 'alert');
    elem.setAttribute('aria-live', 'polite');
    elem.style.cssText = 'position:fixed!important;top:50vh!important;left:50vw!important;transform:translate(-50%,-50%)!important;margin:0!important;z-index:100000!important;background:#2a0a0e!important;background:rgba(42,10,14,0.98)!important;border:2px solid #b91c1c!important;box-shadow:0 20px 50px rgba(0,0,0,0.9),0 0 25px rgba(185,28,28,0.45)!important;border-radius:12px!important;padding:22px 32px!important;text-align:center!important;pointer-events:auto!important;cursor:pointer!important;min-width:320px!important;max-width:min(90vw,560px)!important;box-sizing:border-box!important;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);';
    elem.innerHTML = '<div class="center-choice-notice-inner">' +
      '<h2 class="center-choice-notice-title" id="centerNoticeTitle" style="margin:0!important;font-family:\'Cinzel\',serif!important;font-size:1.25rem!important;font-weight:700!important;color:#fee2e2!important;letter-spacing:0.5px!important;line-height:1.35!important;text-shadow:0 2px 4px rgba(0,0,0,0.8)!important;"></h2>' +
      '<p class="center-choice-notice-subtitle" id="centerNoticeSubtitle" hidden style="margin:8px 0 0 0!important;font-family:\'Inter\',sans-serif!important;font-size:0.92rem!important;color:#fecaca!important;line-height:1.5!important;font-weight:400!important;"></p>' +
      '</div>';
    document.body.appendChild(elem);
    elem.addEventListener('click', () => hideCenterChoiceNotice());
  }
  return elem;
}

function showCenterChoiceNotice({ title, subtitle = '', duration = 3200, isWarning = false }){
  const elem = ensureCenterNoticeElement();
  elem.classList.add('budget-warning');
  elem.style.display = 'block';
  const titleElem = elem.querySelector('#centerNoticeTitle');
  const subElem = elem.querySelector('#centerNoticeSubtitle');
  if(titleElem) titleElem.textContent = title || '';
  if(subElem){
    if(subtitle){
      subElem.textContent = subtitle;
      subElem.hidden = false;
      subElem.style.display = 'block';
    } else {
      subElem.textContent = '';
      subElem.hidden = true;
      subElem.style.display = 'none';
    }
  }
  if(centerNoticeTimer) clearTimeout(centerNoticeTimer);
  elem.classList.add('is-visible');
  centerNoticeTimer = setTimeout(() => {
    elem.classList.remove('is-visible');
    elem.classList.remove('budget-warning');
    centerNoticeTimer = null;
  }, Math.max(1500, duration));
}

function checkBudgetUnderutilizationNotice(totalSpent) {
  const modal = document.getElementById('purchaseUpgradeModal');
  if (modal && (!modal.hidden && modal.style.display !== 'none')) return;
  const choice = effectiveInitialChoice();
  const choiceId = choice?.id || 'budget-choice';
  const hasUnlimitedBudget = Boolean(choice?.unlimitedBudget || choice?.maxBudget === Infinity);
  if (choice?.isBudgetGrant && !hasUnlimitedBudget && choice?.maxBudget && Number.isFinite(Number(choice.maxBudget)) && !warnedBudgetChoices.has(choiceId)) {
    const maxBudget = Number(choice.maxBudget);
    if (totalSpent < 0.8 * maxBudget) {
      warnedBudgetChoices.add(choiceId);
      showCenterChoiceNotice({
        title: 'Orçamento não utilizado totalmente',
        subtitle: 'Você pode selecionar um item de valor mais alto, adicionar uma melhoria ou confirmar para manter a escolha.',
        duration: 4500,
        isWarning: true
      });
    }
  }
}

function hideCenterChoiceNotice(){
  const elem = document.getElementById('centerChoiceNotice');
  if(elem) elem.classList.remove('is-visible');
  if(centerNoticeTimer){
    clearTimeout(centerNoticeTimer);
    centerNoticeTimer = null;
  }
}

function getChoiceNoticeInfo(choice){
  if(!choice) return null;
  if(choice.isSamuraiKatana){
    return {
      title: 'Katana Ancestral',
      subtitle: 'Você pode escolher 1 melhoria de até T$ 500.'
    };
  }
  if(choice.isAristocrataKatana){
    return {
      title: 'Katana Superior',
      subtitle: 'Escolha uma melhoria para sua katana.'
    };
  }
  if(choice.dwarfWeaponOnly){
    return { title: 'Escolha uma Arma Anã' };
  }
  if(choice.isCraftTool || (choice.names && choice.names.some(n => starterKey(n) === 'instrumentos de oficio'))){
    return { title: 'Escolha os Instrumentos de Ofício' };
  }
  if(choice.id === 'simple' || (choice.category === 'simples' && choice.type === 'arma')){
    return { title: 'Escolha uma Arma Simples' };
  }
  if(choice.id === 'martial' || (choice.category === 'marcial' && choice.type === 'arma') || (choice.categories && choice.categories.includes('marcial'))){
    if(choice.categories && choice.categories.includes('exotica')){
      return { title: 'Escolha uma Arma Exótica, Marcial ou Simples' };
    }
    return { title: 'Escolha uma Arma Marcial ou Simples' };
  }
  if(choice.id === 'exotic' || (choice.category === 'exotica' && choice.type === 'arma')){
    return { title: 'Escolha uma Arma Exótica' };
  }
  if(choice.id === 'armor' || choice.type === 'armadura'){
    return { title: 'Escolha uma Armadura' };
  }
  if(choice.damageTypes && choice.damageTypes.includes('corte') && choice.type === 'arma'){
    return { title: 'Escolha uma Arma de Corte' };
  }
  if(choice.branches && choice.branches.length > 0){
    const labels = choice.branches.map(b => b.label);
    let joined = '';
    if(labels.length === 2){
      joined = labels[0] + ' e ' + labels[1];
    } else if(labels.length > 2){
      joined = labels.slice(0, -1).join(', ') + ' e ' + labels[labels.length - 1];
    } else {
      joined = labels[0];
    }
    return { title: 'Escolha um item entre ' + joined };
  }
  if(choice.isBudgetGrant){
    const hasUnlimitedBudget = Boolean(choice.unlimitedBudget || choice.maxBudget === Infinity);
    if(hasUnlimitedBudget){
      const maxImp = Number(choice.maxImprovements) || 2;
      return {
        title: 'Escolha um item com até ' + maxImp + ' melhorias',
        subtitle: 'Você pode escolher um item de qualquer valor.'
      };
    }
    const budgetVal = Number(choice.maxBudget || 1000);
    const title = 'Escolha um item de até ' + formatCurrencyValue(budgetVal, 'T$');
    const subtitle = budgetVal >= 500 ? 'Você pode escolher um item com melhoria.' : '';
    return { title, subtitle };
  }
  if(choice.maxPrice){
    const pVal = Number(choice.maxPrice);
    if(choice.type === 'arma'){
      return { title: 'Escolha uma Arma de até ' + formatCurrencyValue(pVal, 'T$') };
    }
    return { title: 'Escolha um item de até ' + formatCurrencyValue(pVal, 'T$') };
  }
  let cleanTitle = (choice.title || '').replace(/^[^·]+·\s*/, '').trim();
  if(!cleanTitle.toLowerCase().startsWith('escolha')){
    cleanTitle = 'Escolha ' + cleanTitle;
  }
  return { title: cleanTitle };
}

let lastNotifiedChoiceId = null;
function notifyChoiceStepIfNeeded(choice){
  if(!choice || choice.id === lastNotifiedChoiceId) return;
  lastNotifiedChoiceId = choice.id;
  const info = getChoiceNoticeInfo(choice);
  if(info) showCenterChoiceNotice(info);
}

function openBudgetExplanationModal(choice){
  // Desativado: substituído por showCenterChoiceNotice
}

function ensureBudgetExplanationModal(choice){
  // Desativado: substituído por showCenterChoiceNotice
}

function injectBudgetInfoButton(choice){
  const btn = document.getElementById('budgetRulesBtn');
  if(btn) btn.style.display = 'none';
}

applyFilters=function(loadMore){
  if(arsenalInitialState.mode!=='initial'){
    const result=baseApplyFilters(loadMore);
    if(typeof injectWorkshopPotionCardIfNeeded==='function')injectWorkshopPotionCardIfNeeded(loadMore);
    syncShopFilterSummary();
    return result;
  }
  window.clearTimeout(searchTimer);
  const branch=activeBranch();
  const effectiveChoice=effectiveInitialChoice();
  notifyChoiceStepIfNeeded(effectiveChoice);

  if(effectiveChoice?.isSamuraiKatana){
    document.body.classList.remove('budget-grant-equipment');
    const katana=itemById.get('katana');
    if(!katana){
      itemsGrid.innerHTML='<div class="empty">Katana não encontrada no catálogo.</div>';
      return;
    }
    const currentImp=selectedCandidate?.improvements?.[0]?.id||'';
    const weaponImprovements=(typeof improvements!=='undefined'?improvements:[]).filter(imp=>imp.id!=='material_especial'&&improvementAppliesToItem(imp,katana));
    const optionsHtml='<option value="">Sem melhoria inicial</option>'+weaponImprovements.map(imp=>{
      return '<option value="'+escapeHtml(imp.id)+'"'+(currentImp===imp.id?' selected':'')+'>'+escapeHtml(imp.nome)+' (+T$ 300)</option>';
    }).join('');

    itemsGrid.innerHTML='<div class="samurai-katana-choice-card" style="border:1px solid #d9a84e;border-radius:10px;background:#111824;padding:18px;max-width:540px;margin:12px auto">'+
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px">'+
        '<h3 style="margin:0;color:var(--gold2,#f5d78e);font-family:Cinzel,serif">Katana Ancestral</h3>'+
        '<span style="background:#d9a84e22;color:var(--gold2,#f5d78e);padding:3px 8px;border-radius:6px;font-size:0.75rem;font-weight:bold">Samurai Nv 1</span>'+
      '</div>'+
      '<p style="font-size:0.85rem;color:var(--muted);line-height:1.5;margin-bottom:14px">Sua arma de família forjada com tradições e honra. No 1º nível, você começa com esta katana e pode escolher <strong>1 melhoria</strong> com custo de até T$ 500 (sem material especial).</p>'+
      '<div style="background:#0b0f16;border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:16px;font-size:0.82rem">'+
        '<strong>Katana:</strong> Dano 1d8/1d10 · Crítico 19/x2 · Tipo: Corte · Empunhadura: Uma ou Duas Mãos (Exótica/Marcial)'+
      '</div>'+
      '<label style="display:block;margin-bottom:16px"><span style="display:block;font-size:0.8rem;color:var(--dim);margin-bottom:6px;font-weight:bold">1ª Melhoria da Katana (até T$ 500):</span>'+
        '<select class="select" data-samurai-katana-improvement style="width:100%;padding:8px 10px;background:#151c28;border:1px solid var(--border);color:var(--text);border-radius:6px">'+optionsHtml+'</select>'+
      '</label>'+
      '<div style="text-align:right">'+
        '<button type="button" class="primary-button" data-action="confirm-samurai-katana" style="padding:10px 18px;font-weight:bold">'+(selectedCandidate?.itemId==='katana'?'Katana Ancestral Selecionada':'Confirmar Katana Ancestral')+'</button>'+
      '</div>'+
    '</div>';

    if(!selectedCandidate||selectedCandidate.itemId!=='katana'){
      const chosenImp=currentImp?[{id:currentImp}]:[];
      executeChooseCandidate(katana,chosenImp);
    }
    return;
  }

  if(effectiveChoice?.isAristocrataKatana){
    document.body.classList.remove('budget-grant-equipment');
    const katana=itemById.get('katana');
    if(!katana){
      itemsGrid.innerHTML='<div class="empty">Katana não encontrada no catálogo.</div>';
      return;
    }
    const currentImp=selectedCandidate?.improvements?.[0]?.id||'';
    const weaponImprovements=(typeof improvements!=='undefined'?improvements:[]).filter(imp=>imp.id!=='material_especial'&&improvementAppliesToItem(imp,katana));
    const optionsHtml='<option value="">Selecione uma melhoria...</option>'+weaponImprovements.map(imp=>{
      return '<option value="'+escapeHtml(imp.id)+'"'+(currentImp===imp.id?' selected':'')+'>'+escapeHtml(imp.nome)+'</option>';
    }).join('');

    itemsGrid.innerHTML='<div class="aristocrata-katana-choice-card" style="border:1px solid #d9a84e;border-radius:10px;background:#111824;padding:18px;max-width:540px;margin:12px auto">'+
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px">'+
        '<h3 style="margin:0;color:var(--gold2,#f5d78e);font-family:Cinzel,serif">Katana Superior</h3>'+
        '<span style="background:#d9a84e22;color:var(--gold2,#f5d78e);padding:3px 8px;border-radius:6px;font-size:0.75rem;font-weight:bold">Aristocrata Dai’zenshi</span>'+
      '</div>'+
      '<p style="font-size:0.85rem;color:var(--muted);line-height:1.5;margin-bottom:14px">Uma arma de corte nobre com forja e acabamento superior. <strong>Escolha uma melhoria para sua katana</strong> (exceto material especial).</p>'+
      '<div style="background:#0b0f16;border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:16px;font-size:0.82rem">'+
        '<strong>Katana:</strong> Dano 1d8/1d10 · Crítico 19/x2 · Tipo: Corte · Empunhadura: Uma ou Duas Mãos'+
      '</div>'+
      '<label style="display:block;margin-bottom:16px"><span style="display:block;font-size:0.8rem;color:var(--gold2);margin-bottom:6px;font-weight:bold">Escolha uma melhoria para sua katana:</span>'+
        '<select class="select" data-aristocrata-katana-improvement style="width:100%;padding:8px 10px;background:#151c28;border:1px solid var(--border);color:var(--text);border-radius:6px">'+optionsHtml+'</select>'+
      '</label>'+
      '<div style="text-align:right">'+
        '<button type="button" class="primary-button" data-action="confirm-aristocrata-katana" style="padding:10px 18px;font-weight:bold">'+(selectedCandidate?.itemId==='katana'&&selectedCandidate?.improvements?.length?'Katana Superior Selecionada':'Confirmar Katana Superior')+'</button>'+
      '</div>'+
    '</div>';

    if(!selectedCandidate||selectedCandidate.itemId!=='katana'){
      const chosenImp=currentImp?[{id:currentImp}]:[];
      executeChooseCandidate(katana,chosenImp);
    }
    return;
  }

  if(effectiveChoice?.isBudgetGrant){
    document.body.classList.add('budget-grant-equipment');
    if(!state.budgetInitChoiceId||state.budgetInitChoiceId!==effectiveChoice.id){
      state.budgetInitChoiceId=effectiveChoice.id;
      state.type='todos';
      state.category='todos';
      state.specific='convencional';
    }
    if (typeof renderTypeFilters === 'function') renderTypeFilters();
    if (typeof renderSpecificFilters === 'function') renderSpecificFilters();
    syncFilterUI();
    syncInitialFilterSummary();
    const results=availableInitialItems();
    itemsGrid.innerHTML=results.map(item=>itemCard(item)).join('');
    emptyState.classList.toggle('visible',!results.length);
    restoreCandidate();
    return;
  }
  const budgetBtn=document.getElementById('budgetRulesBtn');
  if(budgetBtn)budgetBtn.style.display='none';

  document.body.classList.remove('budget-grant-equipment');
  state.type=effectiveChoice.allowNamedOrFilter?'todos':(effectiveChoice.type||(branch?'todos':initialChoice.type)||'todos');
  state.category=effectiveChoice.allowNamedOrFilter?'todos':(effectiveChoice.category||(branch?'todos':initialChoice.category)||'todos');
  state.specific='convencional';
  syncFilterUI();
  syncInitialFilterSummary();

  if(initialChoice?.branches?.length&&!initialChoiceBranchId&&!state.search){
    itemsGrid.innerHTML='<div class="branch-picker-card"><h4>Escolha uma das opções da sua origem:</h4><p>Esta origem oferece alternativas diferentes. Selecione qual categoria deseja acessar:</p><div class="branch-picker-options">'+
      initialChoice.branches.map(b=>'<button type="button" data-action="select-branch" data-branch-id="'+escapeHtml(b.id)+'">'+escapeHtml(b.label)+'</button>').join('')+
      '</div></div>';
    emptyState.classList.remove('visible');
    return;
  }

  const isCraftBranch=effectiveChoice?.isCraftTool||(effectiveChoice?.names&&effectiveChoice.names.some(n=>starterKey(n)==='instrumentos de oficio'));
  const trained=(arsenalInitialState.trainedOffices||[]);

  if(isCraftBranch&&trained.length===1&&!selectedCraftOffice){
    selectedCraftOffice=normalizeOfficeKey(trained[0]);
    catalogOptionDrafts.set('instrumentos_de_oficio',{oficio:selectedCraftOffice});
  }

  if(isCraftBranch&&trained.length>1&&!selectedCraftOffice){
    const branchBar=branch?'<div class="branch-active-bar"><span>Opção selecionada: <strong>'+escapeHtml(branch.label)+'</strong></span><button type="button" data-action="clear-branch">Trocar opção</button></div>':'';
    itemsGrid.innerHTML=branchBar+'<div class="branch-picker-card"><h4>Confirmar Instrumento de Ofício:</h4><p>Você é treinado em múltiplos ofícios. Escolha qual instrumento deseja receber:</p><div class="branch-picker-options">'+
      trained.map(name=>'<button type="button" data-action="select-craft-office" data-craft-office="'+escapeHtml(normalizeOfficeKey(name))+'">'+escapeHtml(typeof formatCraftToolName==='function'?formatCraftToolName(name):('Instrumentos do '+name))+'</button>').join('')+
      '<button type="button" data-action="select-craft-office" data-craft-office="outro">Outro ofício / Escolha livre</button>'+
      '</div></div>';
    emptyState.classList.remove('visible');
    return;
  }

  const results=availableInitialItems();
  const isSingle=results.length===1;
  const branchBarHtml=branch?'<div class="branch-active-bar"><span>Opção selecionada: <strong>'+escapeHtml(branch.label)+'</strong></span><button type="button" data-action="clear-branch">Trocar opção</button></div>':'';
  itemsGrid.innerHTML=branchBarHtml+results.map(item=>itemCard(item)).join('');
  emptyState.classList.toggle('visible',!results.length);
  if(isSingle && results[0] && (!selectedCandidate || selectedCandidate.itemId !== results[0].id)){
    executeChooseCandidate(results[0]);
  } else {
    restoreCandidate();
  }
};
function chooseCandidate(item){
  pendingOperation=null;
  const existingDraft=purchaseDrafts.get(item.id);
  const improvements=existingDraft?.improvements?.length?existingDraft.improvements:[];
  if(selectedCandidate?.itemId===item.id){
    const choice=effectiveInitialChoice();
    const hasUnlimitedBudget = Boolean(choice?.unlimitedBudget || choice?.maxBudget === Infinity);
    if(choice?.isBudgetGrant && (hasUnlimitedBudget || Number(choice.maxBudget || 0) >= 500) && typeof openPurchaseUpgrade === 'function'){
      const basePrice = Number(item.preco?.valor || 0);
      if(hasUnlimitedBudget || basePrice + 300 <= Number(choice.maxBudget)){
        openPurchaseUpgrade(item.id, 'improvements');
        return;
      }
    }
    restoreCandidate();
    return;
  }
  executeChooseCandidate(item, improvements, true);
}
function executeChooseCandidate(item, improvements = [], isExplicitClick = false){
  let options=resolveDefaultItemOptions(item.id,catalogOptionsForItem(item));
  if(item.id==='katana'&&effectiveInitialChoice()?.isSamuraiKatana){
    options={...options,customName:'Katana Ancestral'};
  }
  if(item.id==='instrumentos_de_oficio'&&selectedCraftOffice&&selectedCraftOffice!=='outro'){
    options={...options,oficio:selectedCraftOffice};
    catalogOptionDrafts.set('instrumentos_de_oficio',options);
  }
  const branch=activeBranch();
  if(branch?.defaultOptions){
    const {customName: suggestedName,...defaults}=branch.defaultOptions;
    options={...defaults,...options};
    catalogOptionDrafts.set(item.id,options);
  }
  const existingDraft=purchaseDrafts.get(item.id);
  if(existingDraft?.options){
    options={...options,...existingDraft.options};
  }
  const catalogDraft=catalogOptionDrafts.get(item.id);
  if(catalogDraft){
    options={...options,...catalogDraft};
  }
  let lastPromptedItemChoiceId: string | null = (window as any).__lastPromptedItemChoiceId || null;
  const nameRequired=item.id!=='colecao_de_livros'&&Boolean(ITEM_CHOICE_DEFINITIONS[item.id]?.fields.some(field=>field.id==='customName'));
  if(nameRequired&&!String(options.customName||'').trim()){
    if(!isExplicitClick){
      selectedCandidate=null;
      restoreCandidate();postArsenal('candidate',{itemId:null});
      return;
    }
    const card=[...itemsGrid.querySelectorAll('[data-item-id]')].find(card=>card.dataset.itemId===item.id);
    const input=card?.querySelector('[data-item-option="customName"]') as HTMLInputElement;
    if(lastPromptedItemChoiceId === item.id){
      let suggestion = '';
      const placeholder = input?.getAttribute('placeholder') || '';
      if(placeholder){
        const cleanPh = placeholder.replace(/^Ex:\s*/i, '').replace(/…|\.\.\./g, '');
        const parts = cleanPh.split(/,\s*|\sou\s*/i).map(s => s.trim()).filter(Boolean);
        if(parts.length > 0){
          suggestion = parts[Math.floor(Math.random() * parts.length)];
        }
      }
      if(!suggestion){
        const defs: Record<string, string[]> = {
          futura_lenda_arma: ['O Destruidor de Mundos', 'A Lâmina da Alvorada', 'Devoradora de Glória'],
          joia_de_familia: ['Colar de Esmeralda Antigo', 'Anel com Brasão Familiar', 'Broche de Safira'],
          item_artistico: ['Tapeçaria dos Heróis de Khalmyr', 'Escultura de Mármore Élfica', 'Vaso Cerâmico de Lenórienn'],
          joia_falsificada: ['Anel de Latão Brilhante', 'Tiara de Vidro Lapidado', 'Amuleto Dourado Falso'],
          pequeno_animal_de_estimacao: ['Esquilo Valente', 'Gato Fiel', 'Corvo Curioso'],
          tatuagem_ou_outro_adereco_de_sua_gangue: ['Tatuagem da Serpente', 'Bracelete de Couro', 'Marca da Caveira'],
          lembranca_de_um_admirador: ['Fita de Seda Perfumada', 'Carta em Pergaminho', 'Lenço Bordado'],
          tranqueiras_resgatadas_do_mar: ['Garrafa com Mapa Antigo', 'Conchas Raras Polidas', 'Madeira de Naufrágio']
        };
        const pool = defs[item.id] || ['Relíquia Notável', 'Item Memorável', 'Artefato Curioso'];
        suggestion = pool[Math.floor(Math.random() * pool.length)];
      }
      options.customName = suggestion;
      if(input) input.value = suggestion;
      catalogOptionDrafts.set(item.id, options);
      (window as any).__lastPromptedItemChoiceId = null;
      if(typeof showToast === 'function') showToast('Indicação sugerida aceita: ' + suggestion);
    } else {
      (window as any).__lastPromptedItemChoiceId = item.id;
      selectedCandidate=null;
      restoreCandidate();postArsenal('candidate',{itemId:null});
      card?.classList.add('expanded');
      input?.setAttribute('required','');
      input?.focus();
      if(typeof showToast === 'function') showToast('Nomeie o item ou aceite uma indicação aleatória');
      return;
    }
  }
  if(item.id==='colecao_de_livros'&&!String(options.knowledge||'').trim()){
    if(!isExplicitClick){
      selectedCandidate=null;
      restoreCandidate();postArsenal('candidate',{itemId:null});
      return;
    }
    const card=[...itemsGrid.querySelectorAll('[data-item-id]')].find(card=>card.dataset.itemId===item.id);
    const sel=card?.querySelector('[data-item-option="knowledge"]') as HTMLSelectElement;
    if(lastPromptedItemChoiceId === item.id){
      const opts = sel ? Array.from(sel.options).map(o => o.value).filter(Boolean) : [];
      const suggestion = opts.length > 0 ? opts[Math.floor(Math.random() * opts.length)] : 'historia';
      options.knowledge = suggestion;
      if(sel) sel.value = suggestion;
      catalogOptionDrafts.set(item.id, options);
      (window as any).__lastPromptedItemChoiceId = null;
      if(typeof showToast === 'function') showToast('Tema de livros selecionado: ' + suggestion);
    } else {
      (window as any).__lastPromptedItemChoiceId = item.id;
      selectedCandidate=null;
      restoreCandidate();postArsenal('candidate',{itemId:null});
      card?.classList.add('expanded');
      sel?.focus();
      if(typeof showToast === 'function') showToast('Nomeie o item ou aceite uma indicação aleatória');
      return;
    }
  }
  if(item.id==='instrumentos_de_oficio'&&!String(options.oficio||'').trim()){
    const card=[...itemsGrid.querySelectorAll('[data-item-id]')].find(card=>card.dataset.itemId===item.id);
    const sel=card?.querySelector('[data-item-option="oficio"]') as HTMLSelectElement;
    if(lastPromptedItemChoiceId === item.id){
      const opts = sel ? Array.from(sel.options).map(o => o.value).filter(Boolean) : [];
      const suggestion = opts.length > 0 ? opts[0] : 'armeiro';
      options.oficio = suggestion;
      if(sel) sel.value = suggestion;
      catalogOptionDrafts.set(item.id, options);
      (window as any).__lastPromptedItemChoiceId = null;
      if(typeof showToast === 'function') showToast('Ofício selecionado: ' + suggestion);
    } else {
      (window as any).__lastPromptedItemChoiceId = item.id;
      selectedCandidate=null;
      restoreCandidate();postArsenal('candidate',{itemId:null});
      card?.classList.add('expanded');
      sel?.focus();
      if(typeof showToast === 'function') showToast('Nomeie o item ou aceite uma indicação aleatória');
      return;
    }
  }
  const configured={options,improvements,enchantments:[]};
  const value=entryValueInfo(configured,effectiveItemForOptions(item,configured));
  selectedCandidate={itemId:item.id,itemName:item.nome,displayName:configuredItemName(configured,item),unitValue:value.unitKnown,options,improvements,enchantments:[]};
  restoreCandidate();postArsenal('candidate',selectedCandidate);

  if(ITEM_CHOICE_DEFINITIONS[item.id]&&!effectiveInitialChoice()?.isBudgetGrant&&!effectiveInitialChoice()?.isSamuraiKatana){
    const card=[...itemsGrid.querySelectorAll('[data-item-id]')].find(card=>card.dataset.itemId===item.id);
    card?.classList.add('expanded');
  }
}
