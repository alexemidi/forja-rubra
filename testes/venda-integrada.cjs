const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const dom=new JSDOM('<!doctype html><body></body>',{runScripts:'outside-only'}),w=dom.window;
try{
  vm.runInContext(fs.readFileSync(path.join(root,'src/regras/nucleo/inventario.js'),'utf8'),dom.getInternalVMContext());
  vm.runInContext(`let generalSaleInstance=null,generalSalePercent=50,generalSaleBase=0;
    let backpackItems=[{instanceId:'a',itemId:'espada',quantity:3}];
    let persistCalls=0;
    let arsenalInitialState={funds:100};
    function persistBackpack(){persistCalls++}
    const itemById=new Map([['espada',{nome:'Espada'}]]),profile={backpack:backpackItems},events=[];
    function activeCharacterProfile(){return profile}
    function refreshInventoryUI(){}
    function postArsenal(type,data){events.push({type,...data})}
    function showToast(){}
    function formatCurrencyValue(value){return String(value)}
    function effectiveItemForOptions(item){return item}
    function entryValueInfo(){return {unitKnown:315}}
    function configuredItemName(){return 'Espada'}
  `,dom.getInternalVMContext());
  const source=fs.readFileSync(path.join(root,'src/funcionalidades/loja/05-03-ensureGeneralSaleModal.js'),'utf8');
  w.eval(source.slice(0,source.indexOf("document.addEventListener('click'")));
  w.eval('ensureGeneralSaleModal().openFor(backpackItems[0])');
  const price=w.document.querySelector('[data-general-sale-price]');
  assert.equal(price.value,'157');
  w.document.querySelector('[data-general-sale-qty]').value='2';
  w.document.querySelector('[data-general-sale="confirm"]').click();
  assert.equal(w.eval('backpackItems[0].quantity'),1);
  assert.equal(w.eval('events[0].value'),314);
  assert.equal(w.eval('profile.backpack===backpackItems'),true);
  assert.equal(w.eval('persistCalls'),1);
  assert.equal(w.eval('arsenalInitialState.funds'),414);
  w.eval('ensureGeneralSaleModal().openFor(backpackItems[0])');
  w.document.querySelector('[data-general-sale="confirm"]').click();
  assert.equal(w.eval('backpackItems.length'),0);
  assert.equal(w.eval('events.length'),2);
  assert.equal(w.eval('persistCalls'),2);
  assert.equal(w.eval('arsenalInitialState.funds'),571);
  // Um segundo clique com referência antiga não pode gerar novo crédito.
  w.document.querySelector('[data-general-sale="confirm"]').click();
  assert.equal(w.eval('events.length'),2);
  assert.equal(w.eval('persistCalls'),2);
  console.log('Modal de venda integrada: preço inicial, venda parcial/total, persistência e crédito aprovados.');
}finally{w.close()}
