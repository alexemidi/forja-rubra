const assert = require('node:assert/strict');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { JSDOM, VirtualConsole } = require('jsdom');

const root = path.resolve(__dirname, '..');
const port = 4228;

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
      // 1. Gerar personagem nível 4 pronto
      generateRandomCharacter({ classId: 'guerreiro', raceId: 'anao', level: 4 });
      state.identity.playerName = 'Jogador Teste';
      state.attributes = { for: 3, des: 2, con: 2, int: 1, sab: 1, car: 1 };
      state.identity.classRequiredChoices = { 0: 'luta' };
      const race = raceById(state.identity.raceId);
      if (race?.atributos?.flexiveis) {
        state.identity.raceAttrs = ['for', 'des', 'con'].slice(0, race.atributos.flexiveis.quantidade || 3);
      }
      const neededGeneral = generalPowerSlots();
      state.powers.general = Array(neededGeneral).fill('vitalidade');
      (typeof originGeneralPowerOptions === 'function' ? originGeneralPowerOptions() : []).forEach(opt => {
        state.powers.originGeneral = state.powers.originGeneral || {};
        state.powers.originGeneral[opt.id] = 'vitalidade';
      });
      if (typeof skillChoiceLimits === 'function' && state.skills) {
        const limits = skillChoiceLimits();
        const pool = ['acrobacia', 'atletismo', 'cavalgar', 'furtividade', 'iniciativa', 'intimidacao', 'luta', 'pontaria', 'fortitude', 'reflexos', 'vontade', 'cura', 'percepcao', 'jogatina', 'diplomacia'];
        const cls = typeof classById === 'function' ? classById(state.identity.classId) : null;
        const classPool = cls?.pericias?.escolha?.opcoes || pool;
        state.skills.class = classPool.slice(0, limits.class || 2);
        state.skills.int = pool.filter(s => !state.skills.class.includes(s)).slice(0, limits.int || 0);
        state.skills.duplicate = pool.filter(s => !state.skills.class.includes(s) && !state.skills.int.includes(s)).slice(0, limits.duplicate || 0);
        if (limits.race > 0) {
          state.skills.race = pool.filter(s => !state.skills.class.includes(s) && !state.skills.int.includes(s) && !(state.skills.duplicate || []).includes(s)).slice(0, limits.race);
        }
      }
      const safePowers = ['guerreiro_ataque_reflexo', 'guerreiro_valentao', 'guerreiro_romper_resistencias', 'guerreiro_golpe_de_raspao'];
      if (Array.isArray(state.progression)) {
        state.progression.forEach((p, idx) => {
          p.powerId = safePowers[idx] || 'vitalidade';
        });
      }
      state.finished = true;
      state.sheetView = 'sheet';
      persistNow();
      renderStage();

      // 2. Simular clique no botão "Editar ficha" com benefício de apoiador ativo
      localStorage.setItem('forja_supporter_tier', 'aventureiro');
      document.getElementById('editCharacterButton')?.click();

      // 3. Navegar para a Fase 10 (Progressão)
      state.step = 10;
      renderStage();

      const nextBtn = document.getElementById('nextButton');
      const textAfterEnteringStep9 = nextBtn?.textContent;
      const isCompleteInitial = !nextBtn?.classList.contains('is-incomplete') && !nextBtn?.disabled;

      // Verificar indicador de nível
      const levelIndicator = document.querySelector('.progression-add-action')?.textContent || '';
      const containsLevelZero = levelIndicator.includes('Nível 0');

      // 4. Simular pendência na progressão (remover poder do nível 3)
      const originalPowerId = state.progression[2].powerId;
      state.progression[2].powerId = '';
      renderStage();

      const textWithMissing = nextBtn?.textContent;
      const isDisabledWithMissing = nextBtn?.disabled && nextBtn?.classList.contains('is-incomplete');

      // 5. Resolver a pendência restaurando o poder original
      state.progression[2].powerId = originalPowerId;
      renderStage();

      const textResolved = nextBtn?.textContent;
      const isEnabledResolved = !nextBtn?.disabled && !nextBtn?.classList.contains('is-incomplete');

      const pendingList = typeof characterPendingChoices === 'function' ? characterPendingChoices() : [];
      return {
        textAfterEnteringStep9,
        isCompleteInitial,
        levelIndicator,
        containsLevelZero,
        textWithMissing,
        isDisabledWithMissing,
        textResolved,
        isEnabledResolved,
        pendingList
      };
    })()`);

    if(!results.isCompleteInitial){
      console.log('DEBUG pendingList:', results.pendingList);
    }

    assert.equal(results.containsLevelZero, false, 'Indicador de nível não deve exibir Nível 0');
    assert(results.levelIndicator.includes('Nível 2 de 4') || results.levelIndicator.includes('Nível 4 de 4'), 'Deve indicar um nível válido');
    assert.equal(results.textAfterEnteringStep9, 'Finalizar ficha', 'Botão principal na Fase 9 deve ser "Finalizar ficha"');
    assert.equal(results.isCompleteInitial, true, 'Com todas as pendências resolvidas, Finalizar ficha deve estar habilitado');

    assert.equal(results.textWithMissing, 'Finalizar ficha', 'Mesmo com pendência, botão na Fase 9 deve continuar sendo "Finalizar ficha" e NÃO "Avançar →"');
    assert.equal(results.isDisabledWithMissing, true, 'Com pendências pendentes, botão Finalizar ficha deve estar desabilitado com classe is-incomplete');

    assert.equal(results.textResolved, 'Finalizar ficha', 'Após resolver pendência, botão continua "Finalizar ficha"');
    assert.equal(results.isEnabledResolved, true, 'Após resolver pendência, botão Finalizar ficha deve ser liberado');

    dom.window.close();
    console.log('✔ Teste de rodapé da Fase 10 (Finalizar ficha vs Avançar e níveis válidos) aprovado com sucesso!');
  } finally {
    server.kill();
  }
})();
