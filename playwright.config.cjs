const {defineConfig}=require('@playwright/test');
module.exports=defineConfig({
  testDir:'./testes/navegador',fullyParallel:false,workers:1,timeout:90000,retries:1,
  expect:{timeout:15000},
  use:{baseURL:'http://127.0.0.1:4301',headless:true,trace:'on-first-retry'},
  reporter:[['list'],['json',{outputFile:'docs/resultados-navegador.json'}]],
  webServer:{command:'node ferramentas/servidor.cjs 4301',url:'http://127.0.0.1:4301',reuseExistingServer:false}
});
