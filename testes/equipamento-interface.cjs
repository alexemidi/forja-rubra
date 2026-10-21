const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {JSDOM}=require('jsdom'),root=path.resolve(__dirname,'..');
const dom=new JSDOM('<button data-equip-action="equip-weapon" data-entry-id="arma">Empunhar</button>',{runScripts:'outside-only'});
const w=dom.window,context=dom.getInternalVMContext();
try{
  vm.runInContext(fs.readFileSync(path.join(root,'src/regras/nucleo/equipamento.js'),'utf8'),context);
  vm.runInContext(`const eq={weaponId:null,shieldId:'escudo',wornIds:[],adaptableHandedness:{}};
    const DATA={pdfItems:[{id:'machado',tipo:'arma',arma:{empunhaduraId:'duas_maos'}}]};
    let saves=0,renders=0;const messages=[];
    function equipmentState(){return eq}function wornItemsLimit(){return 4}function wornItemsCount(){return 0}
    function characterInventory(){return [{uid:'arma',itemId:'machado'}]}function equipEntryId(entry){return entry.uid}
    function heldItemRecords(){return []}function dualWeaponAttackReady(){return false}
    function equippedWeaponBlocksShield(){return eq.weaponId==='arma'}function isTattooItem(){return false}
    function persist(){saves++}function renderStage(){renders++}function toast(message){messages.push(message)}
  `,context);
  vm.runInContext(fs.readFileSync(path.join(root,'src/funcionalidades/criador/inventario/acoes-equipamento.js'),'utf8'),context);
  const button=w.document.querySelector('button');button.click();
  assert.equal(w.eval('eq.weaponId'),'arma');assert.equal(w.eval('eq.shieldId'),'none');
  assert.equal(w.eval('saves'),1);assert.equal(w.eval('renders'),1);
  button.dataset.equipAction='equip-shield';button.dataset.entryId='escudo';button.click();
  assert.equal(w.eval('eq.shieldId'),'none');assert.equal(w.eval('saves'),1);
  button.dataset.equipAction='store-weapon';button.click();
  assert.equal(w.eval('eq.weaponId'),'none');assert.equal(w.eval('saves'),2);
  console.log('Interface de equipamento: empunhar duas mãos, bloquear escudo e guardar com persistência aprovados.');
}finally{w.close()}
