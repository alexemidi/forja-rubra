const assert = require('node:assert/strict');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { JSDOM, VirtualConsole } = require('jsdom');

const root = path.resolve(__dirname, '..');
const port = 4212;

async function open(page) {
  const errors = [], vc = new VirtualConsole();
  vc.on('jsdomError', e => {
    if (!/navigation|scroll|CSS|Could not load.*fonts/i.test(e.message)) errors.push(e.cause?.stack || e.detail?.stack || e.message);
  });
  const dom = await JSDOM.fromURL(`http://127.0.0.1:${port}/${page}.html`, {
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(w) {
      w.HTMLCanvasElement.prototype.getContext = () => null;
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
      w.scrollTo = w.scrollBy = () => {};
      w.HTMLElement.prototype.scrollIntoView = () => {};
      w.structuredClone = structuredClone;
      w.TextEncoder = TextEncoder;
      w.TextDecoder = TextDecoder;
      w.confirm = () => false;
      w.alert = () => {};
      w.fetch = (url, opts) => fetch(new URL(url, w.location.href), opts);
      w.URL.createObjectURL = () => 'blob:teste';
      w.URL.revokeObjectURL = () => {};
    }
  });
  for (let i = 0; i < 600 && !dom.window.document.documentElement.dataset.forjaReady; i++) {
    await new Promise(r => setTimeout(r, 25));
  }
  assert.equal(dom.window.document.documentElement.dataset.forjaReady, 'true', page + ': ' + errors.join('\n'));
  return { dom, errors };
}

(async () => {
  const server = spawn(process.execPath, [path.join(root, 'ferramentas/servidor.cjs'), String(port)], { stdio: 'pipe' });
  try {
    await new Promise((resolve, reject) => {
      server.stdout.once('data', resolve);
      server.once('error', reject);
    });

    const { dom } = await open('criador');
    const w = dom.window;

    const results = w.eval(`(() => {
      // 1. Recomendações de Caminhos de Arcanista
      state.identity.classId = 'arcanista';
      state.identity.classChoices = { arcanista_caminho: 'mago' };
      const mageReqs = classFutureRequirements().skills;
      const hasCaldeiraoMago = mageReqs.some(r => (r.power || '').includes('Caldeirão do Bruxo'));
      const hasEscribaMago = mageReqs.some(r => (r.power || '').includes('Escriba Arcano'));

      state.identity.classChoices = { arcanista_caminho: 'bruxo' };
      const bruxoReqs = classFutureRequirements().skills;
      const hasCaldeiraoBruxo = bruxoReqs.some(r => (r.power || '').includes('Caldeirão do Bruxo'));
      const hasEscribaBruxo = bruxoReqs.some(r => (r.power || '').includes('Escriba Arcano'));

      state.identity.classChoices = { arcanista_caminho: 'feiticeiro' };
      const feiticeiroReqs = classFutureRequirements().skills;
      const hasCaldeiraoFeiticeiro = feiticeiroReqs.some(r => (r.power || '').includes('Caldeirão do Bruxo'));
      const hasEscribaFeiticeiro = feiticeiroReqs.some(r => (r.power || '').includes('Escriba Arcano'));

      // 2. Habilidades de Idade (Criança e Adolescente)
      state.age = { enabled: true, band: 'crianca', years: '10', complications: [] };
      const criancaHtml = window.renderAgePanelHtml ? window.renderAgePanelHtml() : '';
      const criancaTemProtegido = criancaHtml.includes('Protegido dos Deuses') && criancaHtml.includes('Você recebe +2 na Defesa');

      state.age.band = 'adolescente';
      state.age.years = '15';
      const adolHtml = window.renderAgePanelHtml ? window.renderAgePanelHtml() : '';
      const adolTemImpeto = adolHtml.includes('Ímpeto Juvenil') && adolHtml.includes('Você recebe +3 pontos de mana');
      const adolTemConstrucao = adolHtml.includes('Origem em Construção');

      // 3. Elegibilidade de Poderes Raciais na Progressão (Duende / Kallyanach / Kobold)
      state.identity.raceId = 'duende';
      state.identity.classId = 'guerreiro';
      state.identity.plannedLevel = 2;
      state.progression = [
        { classId: 'guerreiro', powerId: '' },
        { classId: 'guerreiro', powerId: '' }
      ];
      const duendeRaceOptions = progressionRaceOptions(1);
      const firstDuendeOption = duendeRaceOptions[0];
      const raceEligibleLvl2 = firstDuendeOption ? progressionRaceEligibility(firstDuendeOption, 1) : null;

      // 4. Rodapé da Fase 6 (Próximo Poder vs Avançar)
      state.step = 6;
      state.identity.raceId = 'golem';
      state.powers.phase6StageIndex = 0;
      state.origin.mode = 'dual';
      renderStage();
      const nextBtn = document.getElementById('nextButton');
      const stepNextBtn = document.getElementById('stepNextButton');
      const intermediateHasNextBtnHidden = nextBtn.hidden === true;
      const intermediateHasStepNextVisible = stepNextBtn.hidden === false && stepNextBtn.textContent.includes('Próximo Poder');

      // Subetapa final da Fase 6
      state.powers.phase6StageIndex = 1;
      renderStage();
      const finalHasNextBtnVisible = nextBtn.hidden === false && nextBtn.textContent.includes('Avançar');
      const finalHasStepNextHidden = stepNextBtn.hidden === true;

      // 5. Botão "Subir Nível" e Bloqueio de Fases
      state.finished = true;
      state.sheetView = 'sheet';
      state.identity.plannedLevel = 2;
      renderStage();

      // Iniciar subida de nível
      state.isLevelingUp = true;
      state.step = 10;
      state.sheetView = '';
      state.finished = false;
      renderStage();

      const phase1Nav = document.querySelector('[data-step="1"]');
      const isPhase1Locked = phase1Nav?.classList.contains('locked-phase');

      // Tentar clicar na Fase 1 durante o avanço de nível
      phase1Nav?.click();
      const stepRemained10 = state.step === 10;

      // Concluir avanço de nível
      state.progression[1].powerId = 'ataque_poderoso';
      finishCharacterCreation();
      const finishedLevelingUp = !state.isLevelingUp && state.sheetView === 'sheet';

      // 6. Tradição Arcana/Divina e Grimório Context
      state.identity.classId = 'arcanista';
      state.identity.classChoices = { arcanista_caminho: 'bruxo' };
      state.step = 7;
      state.sheetView = '';
      const ctxArcana = grimoireContext();
      const noticeArcana = ctxArcana.traditionNotice;

      return {
        hasCaldeiraoMago,
        hasEscribaMago,
        hasCaldeiraoBruxo,
        hasEscribaBruxo,
        hasCaldeiraoFeiticeiro,
        hasEscribaFeiticeiro,
        criancaTemProtegido,
        adolTemImpeto,
        adolTemConstrucao,
        raceEligibleLvl2,
        intermediateHasNextBtnHidden,
        intermediateHasStepNextVisible,
        finalHasNextBtnVisible,
        finalHasStepNextHidden,
        isPhase1Locked,
        stepRemained10,
        finishedLevelingUp,
        noticeArcana
      };
    })()`);

    // Validações
    assert.equal(results.hasCaldeiraoMago, false, 'Mago não deve receber recomendação de Caldeirão do Bruxo');
    assert.equal(results.hasEscribaMago, true, 'Mago deve receber recomendação de Escriba Arcano');
    assert.equal(results.hasCaldeiraoBruxo, true, 'Bruxo deve receber recomendação de Caldeirão do Bruxo');
    assert.equal(results.hasEscribaBruxo, false, 'Bruxo não deve receber recomendação de Escriba Arcano');
    assert.equal(results.hasCaldeiraoFeiticeiro, false, 'Feiticeiro não deve receber recomendação de Caldeirão do Bruxo');
    assert.equal(results.hasEscribaFeiticeiro, false, 'Feiticeiro não deve receber recomendação de Escriba Arcano');

    assert.equal(results.criancaTemProtegido, true, 'Criança deve exibir Protegido dos Deuses com descrição');
    assert.equal(results.adolTemImpeto, true, 'Adolescente deve exibir Ímpeto Juvenil com descrição');
    assert.equal(results.adolTemConstrucao, true, 'Adolescente deve exibir Origem em Construção com descrição');

    assert.equal(results.raceEligibleLvl2?.ok, true, 'Duende no nível 2 deve ser elegível para poder racial na progressão');

    assert.equal(results.intermediateHasNextBtnHidden, true, 'Na etapa intermediária, Avançar deve estar oculto');
    assert.equal(results.intermediateHasStepNextVisible, true, 'Na etapa intermediária, Próximo Poder deve estar visível');
    assert.equal(results.finalHasNextBtnVisible, true, 'Na etapa final, Avançar deve estar visível');
    assert.equal(results.finalHasStepNextHidden, true, 'Na etapa final, Próximo Poder deve estar oculto');

    assert.equal(results.isPhase1Locked, true, 'Fase 1 deve ter classe locked-phase durante avanço de nível');
    assert.equal(results.stepRemained10, true, 'Clique na Fase 1 bloqueada não deve navegar para longe da Fase 10');
    assert.equal(results.finishedLevelingUp, true, 'finishCharacterCreation deve resetar isLevelingUp e voltar para a ficha');

    assert(results.noticeArcana, 'grimoireContext deve conter traditionNotice');
    assert.equal(results.noticeArcana.type, 'arcana', 'Tradição do arcanista deve ser arcana');

    dom.window.close();
    console.log('✔ Todas as novas solicitações foram validadas com sucesso!');
  } finally {
    server.kill();
  }
})();
