
function ensureGeneralSaleModal(){
  let modal=document.getElementById('generalSaleModal');if(modal)return modal;
  modal=document.createElement('div');modal.id='generalSaleModal';modal.className='modal-backdrop';modal.hidden=true;
  modal.innerHTML='<section class="confirm-modal" role="dialog" aria-modal="true" style="max-width:480px"><header><h3>Vender item</h3><button type="button" class="icon-button" data-general-sale="close">×</button></header><div class="confirm-modal-body"><strong data-general-sale-name></strong><p data-general-sale-meta></p><label>Quantidade <input type="number" min="1" step="1" value="1" data-general-sale-qty></label><label>Valor unitário (T$) <input type="number" min="0" step="1" data-general-sale-price></label><div style="display:flex;align-items:center;gap:8px;margin:12px 0"><button type="button" data-general-sale="down">−10%</button><strong data-general-sale-percent>50%</strong><button type="button" data-general-sale="up">+10%</button><button type="button" data-general-sale="reset">Restaurar</button></div><p>Total: <strong data-general-sale-total></strong></p><div style="display:flex;justify-content:flex-end;gap:8px"><button type="button" data-general-sale="close">Cancelar</button><button type="button" class="primary-button" data-general-sale="confirm">Confirmar venda</button></div></div></section>';
  document.body.appendChild(modal);
  const update=()=>{const q=Math.max(1,Number(modal.querySelector('[data-general-sale-qty]').value)||1),p=Math.max(0,Number(modal.querySelector('[data-general-sale-price]').value)||0);modal.querySelector('[data-general-sale-total]').textContent=formatCurrencyValue(RegrasInventario.totalVenda(q,p,'inteiro'),'T$')};
  const apply=()=>{modal.querySelector('[data-general-sale-percent]').textContent=generalSalePercent+'%';modal.querySelector('[data-general-sale-price]').value=RegrasInventario.precoVenda(generalSaleBase,generalSalePercent);update()};
  modal.addEventListener('input',update);
  modal.addEventListener('click',event=>{const action=event.target.closest('[data-general-sale]')?.dataset.generalSale;if(!action&&event.target!==modal)return;if(event.target===modal||action==='close'){modal.hidden=true;return}if(action==='up'){generalSalePercent=Math.min(200,generalSalePercent+10);apply();return}if(action==='down'){generalSalePercent=Math.max(0,generalSalePercent-10);apply();return}if(action==='reset'){generalSalePercent=50;apply();return}if(action==='confirm'&&generalSaleInstance){const qty=Math.min(Number(generalSaleInstance.quantity)||1,Math.max(1,Number(modal.querySelector('[data-general-sale-qty]').value)||1)),price=Math.max(0,Number(modal.querySelector('[data-general-sale-price]').value)||0),sale=RegrasInventario.vender(backpackItems,generalSaleInstance.instanceId,qty,price,entry=>entry.instanceId,'inteiro');if(!sale.alterado){modal.hidden=true;showToast('Item não encontrado ou quantidade indisponível.');return}const total=sale.total;backpackItems=sale.backpack;const active=activeCharacterProfile();if(active)active.backpack=backpackItems;modal.hidden=true;showToast('Item vendido por '+formatCurrencyValue(total,'T$')+'.');if(typeof persistBackpack==='function')persistBackpack();if(typeof persistCart==='function')persistCart();if(typeof arsenalInitialState!=='undefined'){arsenalInitialState.funds=Math.round(((Number(arsenalInitialState.funds)||0)+total)*100)/100;if(typeof syncEmbeddedShopActions==='function')syncEmbeddedShopActions()}refreshInventoryUI();postArsenal('sale',{value:total})}});
  modal.openFor=instance=>{generalSaleInstance=instance;const item=itemById.get(instance.itemId),value=entryValueInfo(instance,effectiveItemForOptions(item,instance));generalSaleBase=Number(value?.unitKnown||instance.customPrice||instance.price||instance.unitValue||instance.preco?.valor||item?.preco?.valor||item?.price||0);if(instance.itemId==='tranqueiras_resgatadas_do_mar'&&generalSaleBase<=0)generalSaleBase=100;generalSalePercent=instance.itemId==='tranqueiras_resgatadas_do_mar'?100:50;modal.querySelector('[data-general-sale-name]').textContent=configuredItemName(instance,item);modal.querySelector('[data-general-sale-meta]').textContent='Valor atual: '+formatCurrencyValue(generalSaleBase,'T$');const qty=modal.querySelector('[data-general-sale-qty]');qty.value=1;qty.max=instance.quantity;apply();modal.hidden=false};
  return modal;
}
document.addEventListener('click',event=>{const button=event.target.closest?.('[data-action="sell-general"]');if(!button)return;event.preventDefault();event.stopImmediatePropagation();const row=button.closest('.backpack-compact-entry'),instance=row&&getBackpackInstance(row.dataset.instanceId);if(instance)ensureGeneralSaleModal().openFor(instance)},true);

applyArsenalContext(arsenalInitialState);

document.addEventListener('click',event=>{
  const incBtn=event.target.closest?.('button[data-action="increase"]');
  if(!incBtn)return;
  const itemArticle=incBtn.closest?.('.backpack-item');
  const instanceId=itemArticle?.dataset.instanceId;
  const instance=(activeCharacterProfile()?.backpack||backpackItems||[]).find(it=>it.instanceId===instanceId);
  const item=instance?itemById.get(instance.itemId):null;
  if(item&&(item.tipo==='municao'||item.categoriaId==='municao')){
    event.preventDefault();
    event.stopImmediatePropagation();
    showToast('Munições adicionais devem ser compradas na Loja com seu dinheiro.');
  }
},true);

document.addEventListener('input',event=>{
  const input=event.target.closest?.('input[data-action="quantity"]');
  if(!input)return;
  const itemArticle=input.closest?.('.backpack-item');
  const instanceId=itemArticle?.dataset.instanceId;
  const instance=(activeCharacterProfile()?.backpack||backpackItems||[]).find(it=>it.instanceId===instanceId);
  const item=instance?itemById.get(instance.itemId):null;
  if(item&&(item.tipo==='municao'||item.categoriaId==='municao')){
    const targetQty=Number(input.value)||1;
    if(targetQty>(Number(instance.quantity)||1)){
      event.preventDefault();
      event.stopImmediatePropagation();
      input.value=String(instance.quantity||1);
      showToast('Munições adicionais devem ser compradas na Loja com seu dinheiro.');
    }
  }
},true);

function grantStarterAmmo(item,grantId,source){const ammo=ammunitionForWeapon(item),id=grantId+':ammo';if(ammo&&itemById.has(ammo)&&!backpackItems.some(entry=>entry.acquisition?.grantId===id))addPackagesToBackpack(ammo,1,{}, {source,grantId:id})}

function ensureInsufficientFundsModal(){
  let modal=document.getElementById('insufficientFundsModal');
  if(modal)return modal;
  modal=document.createElement('div');
  modal.id='insufficientFundsModal';
  modal.className='app-modal';
  modal.hidden=true;
  document.body.appendChild(modal);
  return modal;
}

function promptInsufficientFundsModal(funds, total){
  return new Promise(resolve=>{
    const modal=ensureInsufficientFundsModal();
    const deficit=Math.max(0,total-funds);
    modal.innerHTML=`
      <section class="confirm-modal" role="dialog" aria-modal="true" style="max-width:480px;background:#110d0f;border:1px solid #4a252a;border-radius:8px;padding:20px;box-shadow:0 20px 50px rgba(0,0,0,0.85);color:#f5eee6;">
        <header style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;border-bottom:1px solid #4a252a;padding-bottom:10px;">
          <h3 style="margin:0;font-size:1.15rem;color:#e9ad59;display:flex;align-items:center;gap:8px;">
            Saldo Insuficiente
          </h3>
          <button type="button" class="icon-button" data-funds-action="back" aria-label="Fechar" style="background:transparent;border:none;color:#c9b2aa;font-size:1.4rem;cursor:pointer;">×</button>
        </header>
        <div class="confirm-modal-body" style="display:flex;flex-direction:column;gap:14px;">
          <p style="margin:0;color:#f5eee6;font-size:0.92rem;line-height:1.4;">
            Você não possui tibares suficientes para realizar esta compra.
          </p>
          <div style="background:#090708;border:1px solid #4a252a;border-radius:6px;padding:12px;display:flex;flex-direction:column;gap:8px;font-size:0.9rem;">
            <div style="display:flex;justify-content:space-between;color:#c9b2aa;">
              <span>Saldo disponível:</span>
              <strong style="color:#f5eee6;">${formatCurrencyValue(funds,'T$')}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;color:#c9b2aa;">
              <span>Total da compra:</span>
              <strong style="color:#f5eee6;">${formatCurrencyValue(total,'T$')}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;color:#ea3948;border-top:1px dashed #4a252a;padding-top:8px;font-size:0.95rem;">
              <span style="font-weight:600;">Faltam:</span>
              <strong style="font-size:1.05rem;color:#ea3948;">${formatCurrencyValue(deficit,'T$')}</strong>
            </div>
          </div>
          <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:8px;">
            <button type="button" class="secondary-button" data-funds-action="back" style="padding:8px 16px;cursor:pointer;">Voltar</button>
            <button type="button" class="primary-button" data-funds-action="reward" style="background:linear-gradient(135deg,#c51f2c,#74131d);border:1px solid #ea3948;color:#fff;font-weight:700;padding:8px 16px;border-radius:6px;cursor:pointer;">Resgatar como Recompensa</button>
          </div>
        </div>
      </section>
    `;
    modal.style.position='fixed';
    modal.style.top='0';
    modal.style.left='0';
    modal.style.width='100vw';
    modal.style.height='100vh';
    modal.style.zIndex='100000';
    modal.style.display='flex';
    modal.style.alignItems='center';
    modal.style.justifyContent='center';
    modal.style.background='rgba(5, 3, 4, 0.88)';
    modal.style.backdropFilter='blur(6px)';
    modal.style.padding='12px';
    modal.style.boxSizing='border-box';
    modal.hidden=false;

    const cleanup=(action)=>{
      modal.hidden=true;
      modal.style.display='none';
      resolve(action);
    };

    modal.onclick=(e)=>{
      const btn=e.target.closest?.('[data-funds-action]');
      if(btn){
        e.preventDefault();
        cleanup(btn.dataset.fundsAction);
      } else if(e.target===modal){
        cleanup('back');
      }
    };
  });
}
function notifyShopFooterVisibility(hidden){
  try{
    const p = (typeof window !== 'undefined') ? window.parent : null;
    if(p && p !== window){
      p.postMessage({channel:'forja-arsenal-v1',type:'toggle-shop-footer',hidden:Boolean(hidden)},'*');
    }
  }catch(_e){}
  if(typeof document!=='undefined'&&typeof document.querySelector==='function'){
    const localFooter=document.querySelector('.sheet-shop-footer, .forja-autohide-footer');
    if(localFooter) localFooter.style.display=hidden?'none':'flex';
  }
}
let generalPurchasePercent=100,generalPurchaseBase=0,generalPurchaseResolver=null,currentPurchaseItems=[];

function ensureGeneralPurchaseModal(){
  let modal=document.getElementById('generalPurchaseModal');
  if(modal)return modal;
  modal=document.createElement('div');modal.id='generalPurchaseModal';modal.className='modal-backdrop';modal.hidden=true;
  if(modal.style){
    modal.style.position='fixed';
    modal.style.top='0';
    modal.style.left='0';
    modal.style.width='100vw';
    modal.style.height='100vh';
    modal.style.zIndex='100000';
    modal.style.display='none';
    modal.style.alignItems='center';
    modal.style.justifyContent='center';
    modal.style.background='rgba(5, 3, 4, 0.88)';
    modal.style.backdropFilter='blur(6px)';
    modal.style.padding='16px';
    modal.style.boxSizing='border-box';
  }

  modal.innerHTML='<section class="confirm-modal" role="dialog" aria-modal="true" style="max-width:720px;width:95%;max-height:calc(100vh - 40px);background:#110d0f;border:1px solid #4a252a;border-radius:8px;padding:20px;box-shadow:0 20px 50px rgba(0,0,0,0.85);color:#f5eee6;box-sizing:border-box">' +
    '<header style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;border-bottom:1px solid #4a252a;padding-bottom:12px">' +
      '<h3 style="margin:0;font-size:1.15rem;color:#e9ad59;font-family:\'Cinzel\',serif;letter-spacing:0.5px">FINALIZAR COMPRA</h3>' +
      '<button type="button" class="icon-button" data-general-purchase="close" aria-label="Fechar" style="background:transparent;border:1px solid #4a252a;color:#c9b2aa;width:30px;height:30px;display:grid;place-items:center;padding:0;border-radius:4px;cursor:pointer;font-size:1.2rem;line-height:1">×</button>' +
    '</header>' +
    '<div class="confirm-modal-body" style="padding:0;display:flex;flex-direction:column;gap:14px">' +
      '<p style="margin:0;font-size:0.82rem;color:#c9b2aa;line-height:1.4">Revise os itens do carrinho e ajuste eventuais modificadores antes de confirmar a compra.</p>' +
      '<div data-general-purchase-items style="max-height:240px;overflow-y:auto;background:#090708;border:1px solid #4a252a;border-radius:8px;padding:10px 14px;font-size:0.88rem;display:flex;flex-direction:column;gap:4px"></div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;font-size:0.88rem;color:#c9b2aa"><span>Preço base (100%):</span><strong data-general-purchase-base style="color:#f5eee6;font-size:0.95rem"></strong></div>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;background:#090708;border:1px solid #4a252a;border-radius:6px;padding:8px 12px">' +
        '<span style="font-size:0.82rem;color:#c9b2aa;font-weight:600;text-transform:uppercase">Modificador:</span>' +
        '<div style="display:flex;align-items:center;gap:6px">' +
          '<button type="button" data-general-purchase="down" style="padding:5px 10px;background:#991b1b;border:1px solid #b91c1c;color:#fff;border-radius:4px;cursor:pointer;font-weight:700">−10%</button>' +
          '<strong data-general-purchase-percent style="min-width:54px;text-align:center;color:#e9ad59;font-size:0.9rem">100%</strong>' +
          '<button type="button" data-general-purchase="up" style="padding:5px 10px;background:#991b1b;border:1px solid #b91c1c;color:#fff;border-radius:4px;cursor:pointer;font-weight:700">+10%</button>' +
          '<button type="button" data-general-purchase="reset" style="padding:5px 12px;background:#991b1b;border:1px solid #b91c1c;color:#fff;border-radius:4px;cursor:pointer;font-weight:700">Restaurar</button>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0 4px 0;border-top:1px solid #4a252a">' +
        '<span style="font-size:0.88rem;color:#c9b2aa">Total a pagar:</span>' +
        '<strong data-general-purchase-total style="font-size:1.25rem;color:#e9ad59;font-family:\'Cinzel\',serif"></strong>' +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;font-size:0.82rem;color:#c9b2aa">' +
        '<span>Saldo disponível:</span>' +
        '<span data-general-purchase-funds style="color:#f5eee6;font-weight:600"></span>' +
      '</div>' +
      '<div style="display:flex;justify-content:flex-end;gap:10px;border-top:1px solid #4a252a;padding-top:14px;margin-top:2px">' +
        '<button type="button" data-general-purchase="close" style="padding:8px 18px;background:transparent;border:1px solid #4a252a;color:#c9b2aa;font-weight:600;border-radius:6px;cursor:pointer">Cancelar</button>' +
        '<button type="button" class="primary-button" data-general-purchase="confirm" style="padding:8px 20px;background:#991b1b;border:1px solid #ef4444;color:#fff;font-weight:700;border-radius:6px;cursor:pointer">Confirmar compra</button>' +
      '</div>' +
    '</div>' +
  '</section>';
  document.body.appendChild(modal);

  const renderItemsList=()=>{
    const itemsContainer=modal.querySelector('[data-general-purchase-items]');
    const confirmBtn=modal.querySelector('[data-general-purchase="confirm"]');
    if(!itemsContainer)return;
    if(!currentPurchaseItems||!currentPurchaseItems.length){
      itemsContainer.innerHTML='<p style="margin:8px 0;color:#c9b2aa;text-align:center">O carrinho está vazio.</p>';
      if(confirmBtn){confirmBtn.disabled=true;confirmBtn.style.opacity='0.5';confirmBtn.style.cursor='not-allowed';}
      return;
    }
    if(confirmBtn){confirmBtn.disabled=false;confirmBtn.style.opacity='1';confirmBtn.style.cursor='pointer';}
    itemsContainer.innerHTML=currentPurchaseItems.map(entry=>{
      const originalItem=typeof itemById!=='undefined'?itemById.get(entry.itemId):null;
      const item=(typeof effectiveItemForOptions==='function'&&originalItem)?effectiveItemForOptions(originalItem,entry):originalItem;
      const value=(typeof entryValueInfo==='function'&&item)?entryValueInfo(entry,item):null;
      const name=(typeof configuredItemName==='function'&&originalItem)?configuredItemName(entry,originalItem):(item?.nome||entry.itemId);
      const unitVal=Number(value?.unitKnown||item?.preco?.valor||entry.price||0);
      const itemTotal=unitVal*(Number(entry.quantity)||1);
      const removeId=entry.entryId||entry.itemId;
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.06)">' +
        '<div style="display:flex;align-items:center;gap:8px">' +
          '<button type="button" data-general-purchase-remove="'+escapeHtml(removeId)+'" style="background:transparent;border:none;color:#c9b2aa;cursor:pointer;font-size:1.15rem;line-height:1;padding:2px 6px;border-radius:4px" title="Remover item da compra" aria-label="Remover">×</button>' +
          '<span style="color:#f5eee6">'+(entry.quantity||1)+'x '+escapeHtml(name)+'</span>' +
        '</div>' +
        '<strong style="color:#e9ad59">'+formatCurrencyValue(itemTotal,'T$')+'</strong>' +
      '</div>';
    }).join('');
  };

  const update=()=>{
    const total=Math.max(0,Math.ceil(generalPurchaseBase*(generalPurchasePercent/100)));
    modal.querySelector('[data-general-purchase-base]').textContent=formatCurrencyValue(generalPurchaseBase,'T$');
    modal.querySelector('[data-general-purchase-percent]').textContent=generalPurchasePercent+'%';
    modal.querySelector('[data-general-purchase-total]').textContent=formatCurrencyValue(total,'T$');
  };

  modal.addEventListener('click',event=>{
    const removeBtn=event.target.closest?.('[data-general-purchase-remove]');
    if(removeBtn){
      event.preventDefault();
      const targetId=removeBtn.dataset.generalPurchaseRemove;
      if(typeof cartItems!=='undefined'&&Array.isArray(cartItems)){
        const idx=cartItems.findIndex(e=>e.entryId===targetId||e.itemId===targetId);
        if(idx!==-1){
          cartItems.splice(idx,1);
          currentPurchaseItems=cartItems;
          if(typeof persistCart==='function')persistCart();
          if(typeof syncCartUI==='function')syncCartUI();
          if(typeof renderCart==='function')renderCart();
          if(typeof cartTotalsInfo==='function'){
            generalPurchaseBase=cartTotalsInfo().value;
          }else{
            generalPurchaseBase=currentPurchaseItems.reduce((acc,e)=>{
              const oi=typeof itemById!=='undefined'?itemById.get(e.itemId):null;
              return acc+(Number(oi?.preco?.valor||e.price||0)*(Number(e.quantity)||1));
            },0);
          }
          renderItemsList();
          update();
          return;
        }
      }
    }

    const action=event.target.closest('[data-general-purchase]')?.dataset.generalPurchase;
    if(!action&&event.target!==modal)return;
    if(event.target===modal||action==='close'){
      modal.hidden=true;
      if(modal.style)modal.style.display='none';
      if(typeof notifyShopFooterVisibility==='function')notifyShopFooterVisibility(false);
      if(generalPurchaseResolver){
        const resolve=generalPurchaseResolver;
        generalPurchaseResolver=null;
        resolve({confirmed:false});
      }
      return;
    }
    if(action==='up'){
      generalPurchasePercent=Math.min(300,generalPurchasePercent+10);
      update();
      return;
    }
    if(action==='down'){
      generalPurchasePercent=Math.max(0,generalPurchasePercent-10);
      update();
      return;
    }
    if(action==='reset'){
      generalPurchasePercent=100;
      update();
      return;
    }
    if(action==='confirm'){
      modal.hidden=true;
      if(modal.style)modal.style.display='none';
      if(typeof notifyShopFooterVisibility==='function')notifyShopFooterVisibility(false);
      const total=Math.max(0,Math.ceil(generalPurchaseBase*(generalPurchasePercent/100)));
      if(generalPurchaseResolver){
        const resolve=generalPurchaseResolver;
        generalPurchaseResolver=null;
        resolve({confirmed:true,total,percent:generalPurchasePercent});
      }
    }
  });

  modal._renderItemsList=renderItemsList;
  modal._update=update;
  return modal;
}

function promptGeneralPurchaseModal(baseTotal, items, funds){
  return new Promise(resolve=>{
    const modal=ensureGeneralPurchaseModal();
    generalPurchaseResolver=resolve;
    currentPurchaseItems=Array.isArray(items)?items:[];
    generalPurchaseBase=Number(baseTotal)||0;
    generalPurchasePercent=100;

    if(typeof modal._renderItemsList==='function')modal._renderItemsList();

    modal.querySelector('[data-general-purchase-base]').textContent=formatCurrencyValue(generalPurchaseBase,'T$');
    modal.querySelector('[data-general-purchase-funds]').textContent=formatCurrencyValue(funds,'T$');
    modal.querySelector('[data-general-purchase-percent]').textContent='100%';
    modal.querySelector('[data-general-purchase-total]').textContent=formatCurrencyValue(generalPurchaseBase,'T$');

    modal.hidden=false;
    if(modal.style)modal.style.display='flex';
    if(typeof notifyShopFooterVisibility==='function')notifyShopFooterVisibility(true);
  });
}

if(typeof window!=='undefined'){
  window.ensureInsufficientFundsModal=ensureInsufficientFundsModal;
  window.promptInsufficientFundsModal=promptInsufficientFundsModal;
  window.ensureGeneralPurchaseModal=ensureGeneralPurchaseModal;
  window.promptGeneralPurchaseModal=promptGeneralPurchaseModal;
}

let checkingAmmo=false;
async function checkoutWithAmmo(asGift=false){
 if(checkingAmmo)return;
 if(pendingOperation){postArsenal('operation',pendingOperation);return}
 if(!cartItems.length){postArsenal('close-shop');return}
 checkingAmmo=true;
 try{const needed=[...new Set(cartItems.map(entry=>ammunitionForWeapon(itemById.get(entry.itemId))).filter(Boolean))];
 for(const id of needed){if(cartItems.some(entry=>entry.itemId===id))continue;const ammo=itemById.get(id);if(!ammo)continue;const answer=await catalogDecision('Não acha que vai faltar munição? Compre também '+ammo.nome+', por apenas '+formatCurrencyValue(ammo.preco?.valor||0,'T$')+'.',[{value:'no',label:'Comprar sem munição'},{value:'yes',label:'Adicionar munição',primary:true}],'Uma dica do comerciante');if(answer==='yes')addItemToCart(id,{}, {skipAmmunitionOffer:true})}
  const activeProf = typeof activeCharacterProfile === 'function' ? activeCharacterProfile() : null;
  const limits = typeof carryingLimits === 'function' ? carryingLimits(activeProf?.strength, activeProf?.capacityBonus) : { normal: 10, maximum: 20 };
  const currentSpaces = typeof backpackTotals === 'function' ? backpackTotals().spaces : 0;
  const cartSpaces = typeof cartTotalsInfo === 'function' ? cartTotalsInfo().spaces : 0;
  if (currentSpaces + cartSpaces > limits.maximum) {
    if (typeof showToast === 'function') showToast(`Carga máxima excedida (${(currentSpaces + cartSpaces).toFixed(1)} / ${limits.maximum} espaços). Reduza itens do carrinho.`);
    return;
  }
  const totalValue = typeof cartTotalsInfo === 'function' ? cartTotalsInfo().value : 0;
  const currentFunds = Number(arsenalInitialState?.funds || 0);

  let finalTotal = totalValue;
  let purchasePercent = 100;

  if (!asGift) {
    const decision = await promptGeneralPurchaseModal(totalValue, cartItems, currentFunds);
    if (!decision || !decision.confirmed) {
      return;
    }
    finalTotal = decision.total;
    purchasePercent = decision.percent;
  }

  if (!asGift && finalTotal > currentFunds) {
    const decision = await promptInsufficientFundsModal(currentFunds, finalTotal);
    if (decision === 'reward') {
      return proposeOperation('purchase', { asGift: true, customTotal: 0, percent: purchasePercent });
    }
    return;
  }
  proposeOperation('purchase',{asGift, customTotal: finalTotal, percent: purchasePercent});
 }finally{checkingAmmo=false}
}

// Configuração para modo de consulta autônomo (Arsenal de Arton direto)
if (typeof window !== 'undefined') {
  const isStandaloneConsult = !window.parent || window.parent === window || !new URL(location.href).searchParams.get('sessao');
  if (isStandaloneConsult) {
    document.body.classList.add('standalone-consult');
  }
}

// Evento de clique para compartilhar item
document.addEventListener('click', (e) => {
  const btn = e.target.closest?.('[data-action="share-item"]');
  if (!btn) return;
  e.preventDefault();
  e.stopPropagation();

  const itemId = btn.dataset.itemId;
  const item = typeof itemById !== 'undefined' ? itemById.get(itemId) : null;
  if (!item) return;

  const origin = window.location.origin || '';
  const path = window.location.pathname || '';
  const shareUrl = `${origin}${path}?item=${encodeURIComponent(item.id || item.nome)}`;

  const precoStr = item.preco ? `${item.preco.valor} ${item.preco.unidade || 'T$'}` : 'Sem preço';
  const espacos = item.espacos != null ? `${item.espacos} ${item.espacos === 1 ? 'espaço' : 'espaços'}` : '0 espaços';
  const desc = item.descricao ? item.descricao.replace(/<[^>]*>/g, '').trim() : '';

  const shareText = `*${item.nome}* (${item.tipo || 'Equipamento'})\nPreço: ${precoStr} | Espaço: ${espacos}\n${desc ? desc + '\n' : ''}Confira na Forja Rubra: ${shareUrl}`;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(shareText).then(() => {
      if (typeof showToast === 'function') {
        showToast(`Link e dados de "${item.nome}" copiados com sucesso!`);
      } else {
        alert(`Link e dados de "${item.nome}" copiados para a área de transferência!`);
      }
    }).catch(() => fallbackCopy(shareText, item.nome));
  } else {
    fallbackCopy(shareText, item.nome);
  }
});

function fallbackCopy(text, itemName) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    if (typeof showToast === 'function') {
      showToast(`Link e dados de "${itemName}" copiados com sucesso!`);
    } else {
      alert(`Link e dados de "${itemName}" copiados para a área de transferência!`);
    }
  } catch {
    alert(`Copie o link: ${text}`);
  }
  document.body.removeChild(ta);
}

// Suporte para inicialização por oficina (?oficina=armeiro etc.) e foco em item (?item=id)
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const oficina = urlParams.get('oficina');
    if (oficina) {
      state.oficinaFilter = oficina;
      if (oficina === 'armeiro') {
        state.type = 'arma';
        state.category = 'todos';
      } else if (oficina === 'alfaiate') {
        state.type = 'item_geral';
        state.category = 'vestuario';
      } else if (oficina === 'alquimista') {
        state.type = 'todos';
        state.category = 'todos';
      } else if (oficina === 'artesao') {
        state.type = 'item_geral';
        state.category = 'todos';
      } else if (oficina === 'cozinheiro') {
        state.type = 'item_geral';
        state.category = 'alimentacao';
      }
      if (typeof renderTypeFilters === 'function') renderTypeFilters();
      if (typeof renderContextFilters === 'function') renderContextFilters();
      if (typeof syncFilterUI === 'function') syncFilterUI();
      if (typeof applyFilters === 'function') applyFilters();
    }
    const targetItem = urlParams.get('item');
    if (targetItem) {
      setTimeout(() => {
        const searchInp = document.getElementById('searchInput');
        if (searchInp) {
          searchInp.value = targetItem;
          searchInp.dispatchEvent(new Event('input', { bubbles: true }));
        }
        const card = document.querySelector(`[data-item-id="${CSS.escape(targetItem)}"]`);
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          card.style.outline = '2px solid #f59e0b';
          card.style.boxShadow = '0 0 16px rgba(245, 158, 11, 0.5)';
        }
      }, 400);
    }
  });
}
