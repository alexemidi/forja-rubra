const fs=require('fs');
const path=require('path');
const vm=require('vm');
const {performance}=require('perf_hooks');
const harness=fs.readFileSync(path.join(__dirname,'test-backpack.js'),'utf8');
function run(mode){
  const probe=`
    if('${mode}'==='catalog'){state.specific='todos';state.type='todos';state.category='todos';applyFilters()}
    if('${mode}'==='simple'){state.type='arma';state.category='simples';applyFilters()}
    if('${mode}'==='backpack'){characterProfiles={activeId:'bench',profiles:[{id:'bench',name:'Teste',strength:2,backpack:backpackItems}]};for(const item of preparedItems.slice(0,20))addPackagesToBackpack(item.id,1,{});renderBackpack()}
    if('${mode}'==='search'){state.specific='todos';state.search='dano';applyFilters()}
  `;
  const start=performance.now();
  vm.runInNewContext(harness.replace("eval(match[1] + '\\n' + tests);","eval(match[1] + '\\n' + probe);"),{require,__dirname,console:{log(){}},global:{},probe,Buffer,performance,process});
  return performance.now()-start;
}
const result={environment:'Node '+process.version+'; cinco documentos isolados em DOM simulado, sem layout/pintura',count:722,measurements:{}};
for(const mode of ['catalog','simple','backpack','search']){
  const runs=Array.from({length:5},()=>run(mode));
  result.measurements[mode]={runs:runs.map(value=>Number(value.toFixed(3))),median:Number(runs.slice().sort((a,b)=>a-b)[2].toFixed(3))};
}
console.log(JSON.stringify(result));
