

// ── CSS do Layout de 3 Colunas ──────────────────────────────────────────────
Forja.loadStyle('src/estilos/criador/equipamento.css');

function ensureSellItemModal(){
  let modal=document.getElementById('sellItemModal');
  if(modal&&typeof modal.openForEntry==='function')return modal;
  if(!modal){
    modal=document.createElement('div');
    modal.id='sellItemModal';
    document.body?.appendChild(modal);
  }
  modal.className='modal-backdrop';
  modal.hidden=true;
  modal.innerHTML=`<section class="confirm-modal sell-item-modal" role="dialog" aria-modal="true" aria-labelledby="sellItemModalTitle" style="max-width:500px;width:95%;background:#111620;border:1px solid #263346;border-radius:8px;padding:18px;box-shadow:0 20px 50px rgba(0,0,0,0.85);color:#f8fafc;box-sizing:border-box">
    <header style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;border-bottom:1px solid #1e293b;padding-bottom:10px">
      <h3 id="sellItemModalTitle" style="margin:0;font-size:1.1rem;color:#f0d28c;font-family:'Cinzel',serif;letter-spacing:0.5px">VENDER ITEM DA MOCHILA</h3>
      <button class="button small" type="button" data-sell-action="close" aria-label="Fechar" style="background:#991b1b;border:1px solid #b91c1c;color:#fff;width:28px;height:28px;display:grid;place-items:center;padding:0;border-radius:4px;cursor:pointer;font-size:1.1rem;line-height:1">×</button>
    </header>
    <div class="confirm-modal-body" style="padding:0;display:flex;flex-direction:column;gap:14px">
      <div style="background:#0d121a;border:1px solid #1e293b;border-radius:8px;padding:12px">
        <strong id="sellItemName" style="font-size:1.05rem;color:#f0d28c;display:block;margin-bottom:4px">Item</strong>
        <span id="sellItemMeta" style="font-size:0.75rem;color:#94a3b8">Possui: 1 un. · 1 esp. · Preço base de tabela: T$ 0</span>
      </div>
      <div style="display:flex;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;gap:10px">
        <label class="field" id="sellQtyContainer" style="display:flex;flex-direction:column;gap:4px">
          <span style="font-size:0.72rem;font-weight:700;letter-spacing:0.5px;color:#94a3b8;text-transform:uppercase">Qtd. a vender:</span>
          <input class="input" id="sellItemQtyInput" type="number" min="1" step="1" value="1" style="width:85px;font-size:1rem;font-weight:700;padding:6px 10px;background:#090d14;border:1px solid #2b384e;border-radius:6px;color:#f8fafc;box-sizing:border-box">
        </label>
        <input id="sellItemPriceInput" type="hidden" value="0">
        <div class="sell-price-controls" style="display:flex;align-items:center;gap:6px;margin-bottom:1px">
          <button class="button small" type="button" data-sell-action="percent-down" style="padding:6px 10px;background:#991b1b;border:1px solid #b91c1c;color:#fff;border-radius:4px;cursor:pointer;font-weight:700">−10%</button>
          <strong id="sellItemPercent" style="color:#f0d28c;font-size:0.88rem;min-width:85px;text-align:center">50% do valor</strong>
          <button class="button small" type="button" data-sell-action="percent-up" style="padding:6px 10px;background:#991b1b;border:1px solid #b91c1c;color:#fff;border-radius:4px;cursor:pointer;font-weight:700">+10%</button>
          <button class="button small" type="button" data-sell-action="percent-reset" style="padding:6px 12px;background:#991b1b;border:1px solid #b91c1c;color:#fff;border-radius:4px;cursor:pointer;font-weight:700">Restaurar 50%</button>
        </div>
      </div>
      <div style="display:flex;justify-content:flex-end;align-items:center;margin-top:2px">
        <div style="display:inline-flex;align-items:center;gap:12px;padding:8px 14px;background:#0d121a;border:1px solid #1e293b;border-radius:6px">
          <span style="font-size:0.85rem;color:#94a3b8">Total a receber:</span>
          <strong id="sellItemTotalEarned" style="font-size:1.2rem;color:#f0d28c;font-family:'Cinzel',serif">T$ 0</strong>
        </div>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:10px;border-top:1px solid #1e293b;padding-top:12px;margin-top:4px">
        <button class="button" type="button" data-sell-action="close" style="padding:8px 18px;background:#991b1b;border:1px solid #b91c1c;color:#fff;font-weight:700;border-radius:6px;cursor:pointer">Cancelar</button>
        <button class="button primary" type="button" id="confirmSellItem" style="padding:8px 20px;background:#991b1b;border:1px solid #ef4444;color:#fff;font-weight:700;border-radius:6px;cursor:pointer">Confirmar Venda</button>
      </div>
    </div>
  </section>`;
  document.body?.appendChild(modal);

  let activeEntryId=null,activeBaseValue=0,salePercent=50;

  function applySalePercent(){
    const input=document.getElementById('sellItemPriceInput');
    if(input)input.value=String(RegrasInventario.precoVenda(activeBaseValue,salePercent));
    const label=document.getElementById('sellItemPercent');
    if(label)label.textContent=salePercent+'% do valor';
    updateSellTotal();
  }

  function updateSellTotal(){
    const qty=Math.max(1,parseInt(document.getElementById('sellItemQtyInput')?.value,10)||1);
    const unitPrice=Math.max(0,Number(document.getElementById('sellItemPriceInput')?.value)||0);
    const total=RegrasInventario.totalVenda(qty,unitPrice);
    const totalEl=document.getElementById('sellItemTotalEarned');
    if(totalEl)totalEl.textContent=formatTibars(total);
  }

  modal.addEventListener('click',event=>{
    if(event.target===modal||event.target.closest('[data-sell-action="close"]')){
      modal.hidden=true;
      return;
    }
    const percentAction=event.target.closest('[data-sell-action^="percent-"]')?.dataset.sellAction;
    if(percentAction){
      if(percentAction==='percent-up')salePercent=Math.min(200,salePercent+10);
      if(percentAction==='percent-down')salePercent=Math.max(0,salePercent-10);
      if(percentAction==='percent-reset')salePercent=50;
      applySalePercent();return;
    }
    if(event.target.closest('#confirmSellItem')){
      if(!activeEntryId)return;
      const inventory=characterInventory();
      const entry=inventory.find((e,i)=>equipEntryId(e,i)===activeEntryId);
      if(!entry){toast('Item não encontrado na mochila.');modal.hidden=true;return}
      const maxQty=Number(entry.quantity||1);
      const sellQty=Math.min(maxQty,Math.max(1,parseInt(document.getElementById('sellItemQtyInput')?.value,10)||1));
      const unitPrice=Math.max(0,Number(document.getElementById('sellItemPriceInput')?.value)||0);
      let totalEarned=0;
      const saved=arsenalState();let profiles;
      try{profiles=JSON.parse(saved.storage[ARSENAL_PROFILES_KEY]||'{}')}catch{profiles={}}
      let profile=profiles.profiles?.find(item=>item.id==='ficha-ativa')||profiles.profiles?.find(item=>item.id===profiles.activeId);
      const sale=RegrasInventario.vender(profile?.backpack||[],activeEntryId,sellQty,unitPrice,equipEntryId);
      if(!sale.alterado){toast('Item não encontrado ou quantidade indisponível.');modal.hidden=true;return}
      profile.backpack=sale.backpack;
      totalEarned=sale.total;
      saved.storage[ARSENAL_PROFILES_KEY]=JSON.stringify(profiles);
      const eq=equipmentState();
      const remainingInInv=characterInventory().find((e,i)=>equipEntryId(e,i)===activeEntryId);
      if(!remainingInInv||Number(remainingInInv.quantity)<=0){
        Object.assign(eq,RegrasInventario.desequipar(eq,activeEntryId));
      }
      if(totalEarned>0){
        const f=financesState();
        f.rewardFunds=Math.round(((f.rewardFunds||0)+totalEarned)*100)/100;
      }
      modal.hidden=true;
      const itemNome=entry.displayName||entry.itemName||'item';
      toast(`Vendido ${sellQty}× ${itemNome} por ${formatTibars(totalEarned)}! Saldo atualizado.`);
      persistNow();
      renderStage();
      if(state.finished&&typeof saveFinishedCharacter==='function'){
        setTimeout(()=>saveFinishedCharacter(), 0);
      }
    }
  });

  const qtyInp=document.getElementById('sellItemQtyInput');
  if(qtyInp)qtyInp.addEventListener('input',updateSellTotal);
  const priceInp=document.getElementById('sellItemPriceInput');
  if(priceInp)priceInp.addEventListener('input',updateSellTotal);

  modal.openForEntry=function(entryId){
    activeEntryId=entryId;
    const inventory=characterInventory();
    const entry=inventory.find((e,i)=>equipEntryId(e,i)===entryId);
    if(!entry)return;
    const customList = (typeof state !== 'undefined' && state?.customItems) || [];
    const allItems = [...(DATA.pdfItems||[]), ...customList];
    const catalog=new Map(allItems.map(i=>[i.id,i]));
    const item=catalog.get(entry.itemId) || customList.find(i=>i.id===entry.itemId);
    const isEngenhoca=Boolean(entry.isEngenhoca||entry.contraptionId||item?.tipo==='engenhoca'||/engenhoca/i.test(entry.itemId)||entry.origem==='engenhoca');
    if(isEngenhoca){
      toast('Engenhocas não podem ser vendidas.');
      return;
    }
    const name=typeof getSheetItemDisplayName==='function'?getSheetItemDisplayName(entry,catalog):(entry.displayName||entry.itemName||item?.nome||'Item');
    const qty=Number(entry.quantity||1);
    const spaces=Number(item?.espacos||0);
    const valueInfo=typeof entryValueInfo==='function'?entryValueInfo(entry,typeof effectiveItemForOptions==='function'?effectiveItemForOptions(item,entry):item):null;
    let catalogPrice=Number(entry.customPrice??entry.price??entry.preco?.valor??entry.unitValue??valueInfo?.unitKnown??item?.preco?.valor??item?.price??0);
    if(entry.itemId==='joia_de_familia'&&catalogPrice<=0) catalogPrice=300;
    if(entry.itemId==='item_artistico'&&catalogPrice<=0) catalogPrice=100;
    if(entry.itemId==='tranqueiras_resgatadas_do_mar'&&catalogPrice<=0) catalogPrice=100;
    activeBaseValue=catalogPrice;
    salePercent=entry.itemId==='tranqueiras_resgatadas_do_mar'?100:50;

    const nameEl=document.getElementById('sellItemName');
    if(nameEl)nameEl.textContent=name;
    const metaEl=document.getElementById('sellItemMeta');
    if(metaEl)metaEl.textContent=`Possui: ${qty} un. · ${spaces} esp. · Preço base de tabela: ${formatTibars(catalogPrice)}`;

    const qInput=document.getElementById('sellItemQtyInput');
    if(qInput){
      qInput.value=1;
      qInput.max=qty;
    }
    const pInput=document.getElementById('sellItemPriceInput');
    if(pInput)pInput.value=RegrasInventario.precoVenda(catalogPrice);
    applySalePercent();
    modal.hidden=false;
  };

  return modal;
}

let activeDisassembleEntryId = null;
function ensureDisassembleContraptionModal() {
  let modal = document.getElementById('disassembleContraptionModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'disassembleContraptionModal';
    modal.className = 'modal-backdrop';
    modal.hidden = true;
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;z-index:99999;padding:16px;box-sizing:border-box;';
    modal.innerHTML = `
      <section class="modal-panel" role="dialog" aria-modal="true" style="max-width:480px;width:100%;background:#0d1117;border:1px solid #30363d;border-radius:10px;padding:0;overflow:hidden;box-shadow:0 12px 32px rgba(0,0,0,0.6);">
        <header class="modal-header" style="background:#161b22;border-bottom:1px solid #30363d;padding:12px 18px;display:flex;justify-content:space-between;align-items:center;">
          <h3 style="margin:0;font-size:1.05rem;color:#f0f6fc;font-family:Cinzel,serif;display:flex;align-items:center;gap:8px;">
            Desmanchar Engenhoca
          </h3>
          <button type="button" id="closeDisassembleModalBtn" style="background:transparent;border:none;color:#8b949e;font-size:1.3rem;cursor:pointer;line-height:1;">×</button>
        </header>
        <div class="modal-body" style="padding:18px;color:#c9d1d9;font-size:0.88rem;line-height:1.5;">
          <p style="margin:0 0 10px 0;" id="disassembleModalMsg">
            Deseja desmanchar esta engenhoca? Esta ação liberará o espaço na mochila e a cota no limite de engenhocas ativas.
          </p>
          <div id="disassembleAttachedNotice" style="margin-top:10px;padding:10px 12px;background:rgba(56,189,248,0.1);border:1px solid rgba(56,189,248,0.3);border-radius:6px;font-size:0.82rem;color:#7dd3fc;display:none;"></div>
          <div id="disassembleApparatusNotice" style="margin-top:10px;padding:10px 12px;background:rgba(234,179,8,0.1);border:1px solid rgba(234,179,8,0.3);border-radius:6px;font-size:0.82rem;color:#fde047;display:none;"></div>
        </div>
        <footer class="modal-footer" style="padding:12px 18px;background:#161b22;border-top:1px solid #30363d;display:flex;justify-content:flex-end;gap:10px;">
          <button type="button" id="cancelDisassembleBtn" style="background:#21262d;border:1px solid #30363d;color:#c9d1d9;padding:8px 18px;border-radius:6px;cursor:pointer;font-family:Cinzel,serif;font-size:0.85rem;">Cancelar</button>
          <button type="button" id="confirmDisassembleBtn" style="background:#b91c1c;border:1px solid #dc2626;color:#ffffff;padding:8px 20px;border-radius:6px;cursor:pointer;font-weight:700;font-family:Cinzel,serif;font-size:0.85rem;">Desmanchar</button>
        </footer>
      </section>
    `;
    document.body.appendChild(modal);

    const closeModal = () => {
      modal.hidden = true;
      modal.style.display = 'none';
      activeDisassembleEntryId = null;
    };
    modal.querySelector('#closeDisassembleModalBtn')?.addEventListener('click', closeModal);
    modal.querySelector('#cancelDisassembleBtn')?.addEventListener('click', closeModal);
    modal.addEventListener('click', ev => { if (ev.target === modal) closeModal(); });

    modal.querySelector('#confirmDisassembleBtn')?.addEventListener('click', () => {
      if (!activeDisassembleEntryId) return;
      const entryId = activeDisassembleEntryId;
      closeModal();
      executarDesmancheMochila(entryId);
    });
  }
  return modal;
}

function abrirModalDesmancheMochila(entryId) {
  const modal = ensureDisassembleContraptionModal();
  activeDisassembleEntryId = entryId;
  const inv = characterInventory();
  const entry = inv.find((e,i)=>equipEntryId(e,i)===entryId);
  if(!entry) return;
  const itemName = entry.displayName || entry.itemName || 'engenhoca';

  const cId = entry.contraptionId || entry.itemId || entry.id || entry.instanceId;
  const saved = arsenalState();
  let profiles;
  try { profiles = JSON.parse(saved.storage[ARSENAL_PROFILES_KEY] || '{}'); } catch { profiles = {}; }
  const profile = profiles.profiles?.find(item => item.id === 'ficha-ativa') || profiles.profiles?.find(item => item.id === profiles.activeId);
  const contraption = (Array.isArray(state.contraptions) ? state.contraptions : []).find(c => c.id === cId || c.id === entry.itemId || c.id === entry.contraptionId) ||
    (profile && Array.isArray(profile.contraptions) ? profile.contraptions.find(c => c.id === cId || c.id === entry.itemId || c.id === entry.contraptionId) : null);

  const attached = contraption?.attachedItem || entry.attachedItem || entry.engenhocaInfo?.attachedItem;
  const aparatos = contraption?.apparatuses || contraption?.aparatos || entry.apparatuses || entry.engenhocaInfo?.apparatuses || [];

  const msgEl = modal.querySelector('#disassembleModalMsg');
  if (msgEl) msgEl.textContent = `Deseja desmanchar a engenhoca "${itemName}"? Esta ação liberará o espaço na mochila e a cota no limite de engenhocas ativas.`;

  const attNotice = modal.querySelector('#disassembleAttachedNotice');
  if (attNotice) {
    if (attached) {
      attNotice.style.display = 'block';
      attNotice.innerHTML = `<strong>Item acoplado:</strong> O item original (<strong>${escapeHtml(attached.nome || 'Item')}</strong>) retornará para a sua mochila com todas as suas melhorias preservadas.`;
    } else {
      attNotice.style.display = 'none';
    }
  }

  const apNotice = modal.querySelector('#disassembleApparatusNotice');
  if (apNotice) {
    if (aparatos && aparatos.length > 0) {
      apNotice.style.display = 'block';
      apNotice.innerHTML = `<strong>Aparatos:</strong> ${aparatos.length} aparato(s) instalado(s) retornarão individualmente para a sua mochila.`;
    } else {
      apNotice.style.display = 'none';
    }
  }

  modal.hidden = false;
  modal.style.display = 'flex';
}

function executarDesmancheMochila(entryId) {
  const inv = characterInventory();
  const entry = inv.find((e,i)=>equipEntryId(e,i)===entryId);
  if(!entry) return;
  const itemName = entry.displayName || entry.itemName || 'engenhoca';

  const cId = entry.contraptionId || entry.itemId || entry.id || entry.instanceId;
  const saved = arsenalState();
  let profiles;
  try { profiles = JSON.parse(saved.storage[ARSENAL_PROFILES_KEY] || '{}'); } catch { profiles = {}; }
  let profile = profiles.profiles?.find(item => item.id === 'ficha-ativa') || profiles.profiles?.find(item => item.id === profiles.activeId);
  if (!profile && profiles.profiles?.length) profile = profiles.profiles[0];

  const contraption = (Array.isArray(state.contraptions) ? state.contraptions : []).find(c => c.id === cId || c.id === entry.itemId || c.id === entry.contraptionId) ||
    (profile && Array.isArray(profile.contraptions) ? profile.contraptions.find(c => c.id === cId || c.id === entry.itemId || c.id === entry.contraptionId) : null);

  const attached = contraption?.attachedItem || entry.attachedItem || entry.engenhocaInfo?.attachedItem;
  const aparatos = contraption?.apparatuses || contraption?.aparatos || entry.apparatuses || entry.engenhocaInfo?.apparatuses || [];

  // Remove a engenhoca da mochila no perfil
  if (profile && Array.isArray(profile.backpack)) {
    profile.backpack = profile.backpack.filter((e, i) => equipEntryId(e, i) !== entryId && e.itemId !== cId && e.instanceId !== cId);
  }

  // Remove de state.contraptions e profile.contraptions
  if (Array.isArray(state.contraptions)) {
    state.contraptions = state.contraptions.filter(c => c.id !== cId && c.id !== entry.itemId && c.id !== entry.contraptionId);
  }
  if (profile && Array.isArray(profile.contraptions)) {
    profile.contraptions = profile.contraptions.filter(c => c.id !== cId && c.id !== entry.itemId && c.id !== entry.contraptionId);
  }

  // Remove de state.customItems
  if (typeof state !== 'undefined' && Array.isArray(state.customItems)) {
    state.customItems = state.customItems.filter(ci => ci.id !== cId && ci.id !== entry.itemId);
  }

  // Se a engenhoca estiver acoplada a uma armadura, desacopla dela
  const bpList = (profile && Array.isArray(profile.backpack)) ? profile.backpack : (Array.isArray(state.inventory) ? state.inventory : []);
  bpList.forEach((it: any) => {
    if (Array.isArray(it.attachedContraptions)) {
      it.attachedContraptions = it.attachedContraptions.filter((ac: any) => {
        const id = typeof ac === 'string' ? ac : (ac?.id || ac?.contraptionId);
        return id !== cId && id !== entry.itemId && id !== entryId;
      });
    }
  });
  if (Array.isArray(state.inventory)) {
    state.inventory.forEach((it: any) => {
      if (Array.isArray(it.attachedContraptions)) {
        it.attachedContraptions = it.attachedContraptions.filter((ac: any) => {
          const id = typeof ac === 'string' ? ac : (ac?.id || ac?.contraptionId);
          return id !== cId && id !== entry.itemId && id !== entryId;
        });
      }
    });
  }

  // Salva estado intermediário para que addItemToHeroBackpack opere sobre a mochila limpa
  saved.storage[ARSENAL_PROFILES_KEY] = JSON.stringify(profiles);

  // Devolve o item mundano acoplado com suas melhorias à mochila
  let attachedNome = '';
  if (attached) {
    attachedNome = attached.nome || 'Item Mundano';
    const customItemObj = {
      id: attached.id,
      nome: attached.nome,
      displayName: attached.nome,
      tipo: attached.tipo || 'item_geral',
      categoriaId: attached.categoriaId || 'item_geral',
      espacos: Number(attached.espacos != null ? attached.espacos : (typeof catalog !== 'undefined' && catalog.get(attached.id)?.espacos != null ? catalog.get(attached.id).espacos : 0)),
      improvements: attached.improvements || attached.melhorias || [],
      melhorias: attached.improvements || attached.melhorias || [],
      options: attached.options || {}
    };
    if (typeof addItemToHeroBackpack === 'function') {
      addItemToHeroBackpack(attached.id, 1, { source: 'disassemble' }, customItemObj);
    }
  }

  // Devolve cada aparato instalado à mochila
  let numAparatosDevolvidos = 0;
  if (Array.isArray(aparatos) && aparatos.length > 0) {
    aparatos.forEach(ap => {
      const apId = typeof ap === 'string' ? ap : (ap?.id || ap?.itemId);
      if (apId && typeof addItemToHeroBackpack === 'function') {
        numAparatosDevolvidos++;
        addItemToHeroBackpack(apId, 1, { source: 'disassemble' });
      }
    });
  }

  // Desequipa caso estivesse equipado
  const eq = equipmentState();
  Object.assign(eq, RegrasInventario.desequipar(eq, entryId));

  persistNow();
  if (state.finished && typeof saveFinishedCharacter === 'function') saveFinishedCharacter();

  // Sincroniza iframe da oficina se montado
  try {
    if (typeof sendArsenal === 'function' && typeof arsenalInitialData === 'function') {
      sendArsenal('context', { context: arsenalInitialData('workshop') });
    }
  } catch {}

  renderStage();

  const attMsg = attachedNome ? ` O item ${attachedNome} retornou à mochila.` : '';
  const apMsg = numAparatosDevolvidos > 0 ? ` ${numAparatosDevolvidos} aparato(s) devolvido(s).` : '';
  toast(`Engenhoca "${itemName}" desmanchada.${attMsg}${apMsg}`);
}

document.addEventListener('click',event=>{
  const sellBtn=event.target.closest?.('[data-backpack-action="sell"]');
  if(sellBtn){
    event.preventDefault();event.stopImmediatePropagation();
    const entryId=sellBtn.dataset.entryId;
    if(entryId)ensureSellItemModal().openForEntry(entryId);
    return;
  }
  const disBtn=event.target.closest?.('[data-backpack-action="disassemble"], [data-backpack-action="destroy"]');
  if(disBtn){
    event.preventDefault();event.stopImmediatePropagation();
    const entryId=disBtn.dataset.entryId;
    if(!entryId)return;
    abrirModalDesmancheMochila(entryId);
  }
},true);

PHASES[9]=['Progressão','Escolha as classes e poderes recebidos após o 1º nível.'];
