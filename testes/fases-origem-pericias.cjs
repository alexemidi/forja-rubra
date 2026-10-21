const assert = require('node:assert/strict');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { JSDOM, VirtualConsole } = require('jsdom');

const root = path.resolve(__dirname, '..');
const port = 4216;

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
      const out = {};

      // 1. Ordem canônica das Fases
      out.phase3Name = PHASES[2][0];
      out.phase4Name = PHASES[3][0];

      // 2. Regra de pulo para Golem (deve pular Fase 3 que é Origem, mas NÃO Fase 4 que é Perícias)
      state.identity.raceId = 'golem';
      out.golemSkipsPhase3 = shouldSkipPhase(3);
      out.golemSkipsPhase4 = shouldSkipPhase(4);

      // 3. Teste do fluxo Clérigo (Vontade, Religião) + Acólito (benefício perícias: Cura e Religião)
      // Clérigo tem Religião obrigatória. Acólito concede Religião -> duplicação obrigatória!
      state.identity.raceId = 'humano';
      state.identity.raceCustom = { humanoVersatil: 'skills' };
      state.identity.raceChoices = { humano_versatil_pericia_1: 'iniciativa', humano_versatil_pericia_2: 'percepcao' };
      state.identity.classId = 'clerigo';
      state.origin.standard = 'acolito';
      // Benefício de acólito: 2 perícias (cura e religiao)
      state.origin.benefits = ['skill:cura', 'skill:religiao'];
      state.identity.baseAttrs = { for: 0, des: 0, con: 0, int: 1, sab: 2, car: 0 };
      state.skills = { class: [], int: [], race: [], duplicate: [] };

      // Verificar cálculo de limites
      const limits = skillChoiceLimits();
      out.classLimit = limits.class;
      out.intLimit = limits.int;
      out.raceLimit = limits.race;
      out.duplicateLimit = limits.duplicate;

      // 4. Renderizar a Fase 4 (Perícias)
      state.step = 4;
      const html = renderSkillsSplit();
      const holder = document.createElement('div');
      holder.innerHTML = html;

      // Verificar título do quadro e legenda
      const panels = [...holder.querySelectorAll('.panel')];
      const definedBox = panels.find(p => p.querySelector('.panel-title')?.textContent.trim() === 'Treinos já definidos');
      out.hasDefinedBox = !!definedBox;
      out.definedTitle = definedBox ? definedBox.querySelector('.panel-title')?.textContent.trim() : '';
      out.definedLegend = definedBox ? definedBox.querySelector('.help')?.textContent.trim() : '';
      
      // Verificar tags e cores (sem tags verdes, apenas tag amber)
      const tags = [...(definedBox ? definedBox.querySelectorAll('.tag') : [])];
      out.tagClasses = tags.map(t => t.className);
      out.hasGreenTag = tags.some(t => t.classList.contains('green'));
      out.allAmberTags = tags.length > 0 && tags.every(t => t.classList.contains('amber'));
      out.orderedDefinedLabels = tags.map(t => t.textContent.trim());

      // 5. Verificar sequência de desbloqueio dos painéis
      // Estado com classe vazia: apenas #skill-class existe; próximas escolhas estão com .skill-locked-panel
      const classGroup = holder.querySelector('#skill-class');
      const intGroup = holder.querySelector('#skill-int');
      const duplicateGroup = holder.querySelector('#skill-duplicate');
      const lockedPanel = holder.querySelector('.skill-locked-panel');

      out.classUnlockedInitial = !!classGroup;
      out.intLockedInitial = !intGroup && !!lockedPanel;
      out.duplicateLockedInitial = !duplicateGroup && !!lockedPanel;

      // 6. Verificar que perícias já treinadas NÃO aparecem como opções elegíveis
      const allClassOptions = [...holder.querySelectorAll('#skill-class input[data-action="skill"]')].map(b => b.value);
      
      // Vontade (obrigatória clérigo), Religião (obrigatória clérigo), Cura (origem) não devem ser opções
      out.classHasVontade = allClassOptions.includes('vontade');
      out.classHasReligiao = allClassOptions.includes('religiao');
      out.classHasCura = allClassOptions.includes('cura');

      // 7. Simular preenchimento da classe e ver liberação do grupo de inteligência
      state.skills.class = ['diplomacia', 'intuicao']; // clérigo escolhe 2
      const htmlStep2 = renderSkillsSplit();
      const holder2 = document.createElement('div');
      holder2.innerHTML = htmlStep2;
      const intGroupStep2 = holder2.querySelector('#skill-int');
      out.intUnlockedAfterClass = !!intGroupStep2;

      const allIntOptions = [...holder2.querySelectorAll('#skill-int input[data-action="skill"]')].map(b => b.value);
      out.intHasVontade = allIntOptions.includes('vontade');
      out.intHasReligiao = allIntOptions.includes('religiao');

      // 8. Teste de Raça sem perícias a escolher (ex.: Anão)
      state.identity.raceId = 'anao';
      state.identity.raceCustom = {};
      state.identity.raceChoices = {};
      const limitsAnao = skillChoiceLimits();
      out.raceLimitAnao = limitsAnao.race;
      const htmlAnao = renderSkillsSplit();
      const holderAnao = document.createElement('div');
      holderAnao.innerHTML = htmlAnao;
      out.hasRacePanelAnao = !!holderAnao.querySelector('#skill-race');

      return out;
    })()`);

    assert.equal(results.phase3Name, 'Origens', 'Fase 3 deve ser Origens');
    assert.equal(results.phase4Name, 'Perícias', 'Fase 4 deve ser Perícias');
    assert.equal(results.golemSkipsPhase3, true, 'Golem pula Fase 3 (Origens)');
    assert.equal(results.golemSkipsPhase4, false, 'Golem NÃO pula Fase 4 (Perícias)');

    assert.equal(results.classLimit, 2, 'Clérigo escolhe 2 perícias de classe');
    assert.equal(results.intLimit, 1, 'Int mod 1 concede 1 perícia de inteligência');
    assert.equal(results.raceLimit, 0, 'Humano já teve perícias definidas no atributo/raça');
    assert.equal(results.duplicateLimit, 1, 'Religião duplicada gera 1 substituta obrigatória');

    assert.equal(results.hasDefinedBox, true, 'Quadro de treinos já definidos deve existir');
    assert.equal(results.definedTitle, 'Treinos já definidos', 'Título exato do quadro');
    assert.equal(
      results.definedLegend,
      'Perícias de classe, raça e origens. Uma duplicação obrigatória gera uma escolha substituta da lista de classe.',
      'Legenda exata do quadro'
    );

    assert.equal(results.hasGreenTag, false, 'Não deve haver tags verdes no quadro');
    assert.equal(results.allAmberTags, true, 'Todas as tags do quadro devem ser amber (amarelo alaranjado)');

    // Ordem exata: Classe (Religião, Vontade), Origem (Cura, Religião)
    // O array orderedDefinedLabels deve conter as perícias na sequência classe > raça > origem
    assert(results.orderedDefinedLabels.length >= 3, 'Deve listar perícias de classe e origem');
    assert.equal(results.orderedDefinedLabels[0], 'Religião', 'Primeira de classe');
    assert.equal(results.orderedDefinedLabels[1], 'Vontade', 'Segunda de classe');
    assert.equal(results.orderedDefinedLabels[2], 'Cura', 'Origem benefício 1');
    assert.equal(results.orderedDefinedLabels[3], 'Religião', 'Origem benefício 2');

    // Desbloqueio e opções
    assert.equal(results.classUnlockedInitial, true, 'Classe inicia desbloqueada');
    assert.equal(results.intLockedInitial, true, 'Inteligência bloqueada até completar classe');
    assert.equal(results.duplicateLockedInitial, true, 'Duplicidade bloqueada até etapas anteriores');

    assert.equal(results.classHasVontade, false, 'Vontade já treinada não aparece na lista de classe');
    assert.equal(results.classHasReligiao, false, 'Religião já treinada não aparece na lista de classe');
    assert.equal(results.classHasCura, false, 'Cura da origem não aparece na lista de classe');
    assert.equal(results.intHasVontade, false, 'Vontade não aparece na lista de int');
    assert.equal(results.intHasReligiao, false, 'Religião não aparece na lista de int');

    assert.equal(results.intUnlockedAfterClass, true, 'Inteligência desbloqueada após completar classe');
    assert.equal(results.raceLimitAnao, 0, 'Anão não tem perícias de raça a escolher');
    assert.equal(results.hasRacePanelAnao, false, 'Painel de raça não aparece para anão');

    dom.window.close();
    console.log('Todos os testes de Fases 3 (Origens) e 4 (Perícias), quadro âmbar e fluxo sequencial passaram com sucesso!');
  } finally {
    server.kill();
  }
})();
