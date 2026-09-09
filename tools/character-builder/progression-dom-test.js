const assert=require('assert/strict');
const fs=require('fs');
const path=require('path');
const {JSDOM,VirtualConsole}=require('jsdom');
(async()=>{
  const errors=[],consoleSink=new VirtualConsole();
  consoleSink.on('jsdomError',error=>{if(!/Not implemented/.test(error.message))errors.push(error)});
  const dom=new JSDOM(fs.readFileSync(path.join(__dirname,'../../Criador de Ficha T20.html'),'utf8'),{runScripts:'dangerously',url:'https://progression.test/',virtualConsole:consoleSink,beforeParse(w){w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{}}});
  const w=dom.window,run=code=>w.eval(code);
  try{
    run("state=defaultState();state.identity.classId='nobre';state.identity.plannedLevel=3;state.step=9;renderStage()");
    for(const index of [1,2]){
      const button=w.document.querySelector('[data-action="class-power-preview"][data-index="'+index+'"][data-power-id="classe_aumento_de_atributo"]');
      assert(button,'O próximo nível abre para escolher');button.click();
      w.document.querySelector('[data-action="class-power-attribute"][data-index="'+index+'"][data-attr="'+(index===1?'for':'des')+'"][data-dir="1"]').click();
      w.document.getElementById('nextButton').click();
      await new Promise(resolve=>setTimeout(resolve,350));
      assert.equal(run('state.progression['+index+'].powerId'),'classe_aumento_de_atributo');
      assert.equal(w.document.getElementById('warningModal').hidden,true,'Validação antiga não intercepta a confirmação');
      assert.equal(w.document.getElementById('nextButton').disabled,false);
    }
    assert.equal(errors.length,0,errors.map(e=>e.stack).join('\n'));
    console.log('Progressão DOM: seleção e Continuar confirmam dois níveis consecutivos sem interceptação antiga.');
  }finally{w.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
