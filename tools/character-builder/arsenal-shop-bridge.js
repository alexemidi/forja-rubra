// Full Arsenal catalogue embedded in the finished character sheet.
characterButton.hidden=true;
strengthInput.disabled=true;
strengthInput.readOnly=true;
const shopStyle=document.createElement('style');
shopStyle.textContent=`
  .site-header{display:none!important}body{padding-top:0!important}
  .embedded-shop-actions{position:sticky;top:0;z-index:40;display:flex;justify-content:flex-end;gap:7px;padding:8px 18px;border-bottom:1px solid var(--border);background:#0d1119f2;backdrop-filter:blur(12px)}
  .embedded-shop-actions button{min-height:32px;padding:6px 10px;border:1px solid var(--border);border-radius:7px;background:var(--surface2);color:var(--text);font-weight:700;cursor:pointer}
  .embedded-shop-actions button.active{border-color:var(--gold);color:#f4d795;background:var(--gold-soft)}
  @media(max-width:600px){.embedded-shop-actions{padding:7px 9px}.embedded-shop-actions button{font-size:11px}.filters-panel,.catalog-main{padding-left:9px!important;padding-right:9px!important}}
`;
document.head.appendChild(shopStyle);
const shopActions=document.createElement('nav');
shopActions.className='embedded-shop-actions';
shopActions.innerHTML='<button type="button" data-shop-close>← Voltar para a mochila</button><button type="button" data-shop-view="catalog">Catálogo</button><button type="button" data-shop-cart>🛒 Carrinho <span data-shop-cart-count>0</span></button><button type="button" data-shop-view="backpack">🎒 Mochila</button>';
document.body.prepend(shopActions);
function syncEmbeddedShopActions(){
  shopActions.querySelectorAll('[data-shop-view]').forEach(button=>button.classList.toggle('active',button.dataset.shopView===state.view));
  shopActions.querySelector('[data-shop-cart-count]').textContent=String(cartItems.reduce((sum,entry)=>sum+entry.quantity,0));
}
shopActions.addEventListener('click',event=>{
  if(event.target.closest('[data-shop-close]')){window.parent.postMessage({channel:'forja-arsenal-v1',session:arsenalInitialState.session,type:'close-shop'},'*');return}
  const view=event.target.closest('[data-shop-view]');if(view){setView(view.dataset.shopView);syncEmbeddedShopActions();return}
  if(event.target.closest('[data-shop-cart]'))openCartDecision(false);
});
document.addEventListener('click',event=>{
  if(!event.target.closest?.('#checkoutCart'))return;
  event.preventDefault();event.stopImmediatePropagation();
  window.parent.postMessage({channel:'forja-arsenal-v1',session:arsenalInitialState.session,type:'purchase-request',total:cartTotalsInfo().value},'*');
},true);
window.addEventListener('message',event=>{
  const message=event.data;if(event.source!==window.parent||message?.channel!=='forja-arsenal-v1'||message.session!==arsenalInitialState.session)return;
  if(message.type==='purchase-approved'){
    const quantity=cartItems.reduce((sum,entry)=>sum+entry.quantity,0);
    checkoutCartToBackpack();syncEmbeddedShopActions();
    showToast(message.gift?'Dinheiro insuficiente: '+quantity+(quantity===1?' item adicionado como presente.':' itens adicionados como presente.'):'Compra finalizada por '+formatCurrencyValue(message.total,'T$')+'.');
    window.parent.postMessage({channel:'forja-arsenal-v1',session:arsenalInitialState.session,type:'purchase-complete',storage:{...arsenalStorageValues}},'*');
  }
});
setView('catalog');applyFilters();syncEmbeddedShopActions();
window.parent.postMessage({channel:'forja-arsenal-v1',session:arsenalInitialState.session,type:'ready'},'*');
