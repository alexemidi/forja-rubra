const fs = require('fs');
const path = require('path');
const vm = require('vm');
const harness = fs.readFileSync(path.join(__dirname, 'test-backpack.js'), 'utf8');
const probe = `
const measurements={};
const measure=(name,action)=>{const runs=[];for(let i=0;i<5;i++){const start=performance.now();action();runs.push(performance.now()-start)}measurements[name]={runs,median:runs.slice().sort((a,b)=>a-b)[2]}};
measure('catalog',()=>{state.specific='todos';state.type='todos';state.category='todos';state.search='';applyFilters()});
measure('simple',()=>{state.type='arma';state.category='simples';applyFilters()});
characterProfiles={activeId:'bench',profiles:[{id:'bench',name:'Teste',strength:2,backpack:backpackItems}]};
for(const item of preparedItems.slice(0,20))addPackagesToBackpack(item.id,1,{});
measure('backpack',()=>renderBackpack());
measure('search',()=>{state.type='todos';state.category='todos';state.search='dano';applyFilters()});
console.log(JSON.stringify({environment:'Node '+process.version+'; DOM simulado, sem layout/pintura',count:preparedItems.length,measurements}));
`;
vm.runInNewContext(harness.replace("eval(match[1] + '\\n' + tests);", "eval(match[1] + '\\n' + probe);"), {require,__dirname,console,global,probe,performance,process,Buffer});
