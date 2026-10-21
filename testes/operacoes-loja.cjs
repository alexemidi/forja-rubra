const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const operations=require('../src/regras/nucleo/operacoes-loja.js');
const arsenal={operations:{},grants:{},storage:{},choiceIndex:0,complete:false,pending:'a'},finances={spent:5},completed=[1];
const message={operationId:'compra1',kind:'purchase',total:15,storage:{profiles:JSON.stringify({profiles:[{backpack:[{quantity:1,acquisition:{operationId:'compra1'}}]}]})}};
const before=JSON.stringify({arsenal,finances,completed,message});
const prepare=(msg=message,funds=100)=>operations.preparar(arsenal,finances,completed,msg,funds,'profiles');
const tx=prepare();assert.equal(tx.status,'ready');assert.equal(tx.finances.spent,20);
assert.equal(JSON.parse(tx.arsenal.storage.profiles).profiles[0].backpack[0].acquisition.source,'purchase');
assert.equal(JSON.stringify({arsenal,finances,completed,message}),before);
assert.equal(operations.preparar(tx.arsenal,tx.finances,tx.completed,message,100,'profiles').status,'repeated');
const gift=prepare(message,10);assert.equal(gift.finances.spent,5);assert.equal(gift.result.gift,true);
assert.equal(prepare({...message,kind:'craft'}).finances.spent,20);
assert.equal(prepare({...message,storage:{profiles:'{'}}).status,'invalid');
assert.equal(prepare({...message,total:Infinity}).status,'invalid');
assert.equal(prepare({...message,operationId:''}).status,'invalid');
const initial=prepare({...message,kind:'initial',finalize:true,grants:['concessao']});
assert.equal(initial.arsenal.complete,true);assert.deepEqual(initial.completed,[1,8]);assert.equal(initial.arsenal.grants.concessao,true);
assert.equal(prepare({...message,kind:'initial'}).arsenal.choiceIndex,1);
// Exercita o adaptador real, incluindo restauração exata após falha de gravação.
const ctx=vm.createContext({OperacoesLoja:operations,message});
vm.runInContext(`let state={arsenal:${JSON.stringify(arsenal)},finances:{spent:5},completed:[1,8],finished:false},arsenalShopOpen=true,canSave=false;const replies=[];
const ARSENAL_PROFILES_KEY='profiles';function arsenalState(){return state.arsenal}function financesState(){return state.finances}
function remainingFunds(){return 100}function persistNow(){return canSave}function arsenalInitialData(){return {}}
function sendArsenal(type,data){replies.push(data)}function syncInitialItemFooter(){}
const document={getElementById(){return null}};
`,ctx);
const source=fs.readFileSync(path.join(__dirname,'../src/integracoes/criador/loja-itens-iniciais.js'),'utf8');
vm.runInContext(source.slice(source.indexOf('function acceptArsenalOperation(message){'),source.indexOf("\ndocument.addEventListener('click',async event=>")),ctx);
const run=s=>vm.runInContext(s,ctx),snapshot=run('JSON.stringify(state)');run('acceptArsenalOperation(message)');
assert.equal(run('JSON.stringify(state)'),snapshot);assert.equal(run('replies.at(-1).ok'),false);
run('canSave=true;acceptArsenalOperation(message);acceptArsenalOperation(message)');
assert.equal(run('state.finances.spent'),20);assert.equal(run('replies.at(-1).ok'),true);
console.log('Transações da loja: compra, fabricação, recompensa, concessões, repetição e rollback de persistência aprovados.');
