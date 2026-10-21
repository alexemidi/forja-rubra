const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { JSDOM, VirtualConsole } = require('jsdom');

const root = path.resolve(__dirname, '..');
const port = 4208;

// 1. Validar texto canônico em dados/criador-regionalOrigins.json
const regionalOrigins = JSON.parse(fs.readFileSync(path.join(root, 'dados/criador-regionalOrigins.json'), 'utf8'));
const cosmopolitaData = regionalOrigins.find(o => o.nome === 'Cosmopolita');
assert(cosmopolitaData, 'Origem regional Cosmopolita deve existir');
assert(
  cosmopolitaData.beneficios?.descricao?.includes('Escolha um poder geral ou de uma classe na qual você tenha pelo menos dois níveis'),
  'Descrição de Cosmopolita deve conter o texto canônico de poderes'
);
assert(
  cosmopolitaData.beneficios?.descricao?.includes('exceto poderes concedidos ou da Tormenta'),
  'Descrição de Cosmopolita deve conter exceção a poderes concedidos ou da Tormenta'
);
assert(
  cosmopolitaData.beneficios?.descricao?.includes('Uma vez por aventura, após concluir um descanso (oito horas de sono), pode trocar esse poder por outro'),
  'Descrição de Cosmopolita deve conter regra de troca após descanso de 8 horas'
);

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
      state.identity.characterName = 'Herói Valkariano';
      state.identity.playerName = 'Jogador';
      state.identity.raceId = 'humano';
      state.identity.raceChoices = { humano_versatil: 'uma_pericia_um_poder' };
      state.identity.classId = 'guerreiro';
      state.identity.plannedLevel = 1;
      state.progression = [{ classId: 'guerreiro', powerId: '' }];
      state.origin.mode = 'dual';
      state.origin.standard = 'Acólito';
      state.origin.regional = 'Cosmopolita';
      state.powers.general = [''];
      state.powers.cosmopolitaPower = '';
      state.powers.cosmopolitaPreview = '';
      state.powers.phase6StageIndex = 0;
      state.step = 6;

      // 1. Sub-etapas na Fase 6:
      // Humano com 1 poder geral + Cosmopolita = 2 sub-etapas sequenciais
      const stages = getPhase6SubStages();
      const stageCount = stages.length;
      const stage0 = stages[0];
      const stage1 = stages[1];

      // Na sub-etapa 0 (Humano geral): renderPowers() mostra o poder geral do humano, NÃO Cosmopolita
      state.powers.phase6StageIndex = 0;
      const htmlStage0 = renderPowers();
      const stage0HasCosmo = htmlStage0.includes('Origem Cosmopolita');

      // Na sub-etapa 1 (Cosmopolita): renderPowers() mostra Cosmopolita, NÃO o poder do humano
      state.powers.phase6StageIndex = 1;
      const htmlStage1 = renderPowers();
      const stage1HasCosmo = htmlStage1.includes('Origem Cosmopolita');
      const stage1HasHumano = htmlStage1.includes('Poderes gerais da raça e origem');

      // 2. Visual minimalista e sombrio:
      // Não deve conter texto de banner desnecessário
      const hasBannerText = htmlStage1.includes('Benefício de Valkaria:');
      // Não deve conter tags coloridas chamativas
      const hasSelectedBadge = htmlStage1.includes('✓ Selecionado') || htmlStage1.includes('✓ Poder selecionado') || htmlStage1.includes('✓ SELECIONADO');
      const hasDisponivelBadge = htmlStage1.includes('DISPONÍVEL') || htmlStage1.includes('REQUISITOS NÃO CUMPRIDOS');

      // 3. Seleção e confirmação ao avançar ("nada selecionado, clicar seleciona avançar confirma"):
      // Inicialmente nada selecionado:
      const cosmoBeforeSelect = selectedCosmopolitaPower();
      // Simular clique em um poder elegível:
      const eligible = cosmopolitaEligiblePowers();
      const validGeneral = eligible.find(o => o.powerType === 'geral' && o.verdict.ok);
      state.powers.cosmopolitaPreview = validGeneral.cosmopolitaKey;
      // Ao avançar, draft é confirmado:
      state.powers.cosmopolitaPower = state.powers.cosmopolitaPreview;
      state.powers.cosmopolitaPreview = '';
      const cosmoAfterAdvance = selectedCosmopolitaPower();

      // 4. Classes com >= 2 níveis desbloqueiam poderes de classe:
      state.identity.plannedLevel = 3;
      state.progression = [
        { classId: 'guerreiro', powerId: '' },
        { classId: 'guerreiro', powerId: 'ataque_reflexo' },
        { classId: 'ladino', powerId: '' }
      ];
      const eligibleLvl3 = cosmopolitaEligiblePowers();
      const classOptions = eligibleLvl3.filter(o => o.powerType === 'classe');
      const allClassOptionsGuerreiro = classOptions.length > 0 && classOptions.every(o => o.classId === 'guerreiro');

      // 5. Botão de editar fácil na ficha durante o jogo:
      state.finished = true;
      state.sheetView = 'sheet';
      renderStage();
      const feats = selectedCharacterFeatures();
      const cosmoFeat = feats.find(f => f.id === 'cosmopolita:' + validGeneral.id);
      const featureHtml = sheetFeatureDisclosure(cosmoFeat);
      const hasEasyEditBtn = featureHtml.includes('data-action="open-cosmopolita-swap"') && featureHtml.includes('Trocar');

      // Modal de descanso também tem opção de troca
      const restModal = document.getElementById('sheetRestModal');
      const restHasSwap = Boolean(restModal && restModal.querySelector('[data-vital-action="open-cosmopolita-swap"]'));

      return {
        stageCount,
        stage0Type: stage0?.type,
        stage1Type: stage1?.type,
        stage0HasCosmo,
        stage1HasCosmo,
        stage1HasHumano,
        hasBannerText,
        hasSelectedBadge,
        hasDisponivelBadge,
        cosmoBeforeSelect,
        cosmoAfterAdvanceId: cosmoAfterAdvance?.id,
        validGeneralId: validGeneral?.id,
        allClassOptionsGuerreiro,
        classOptionsCount: classOptions.length,
        hasEasyEditBtn,
        restHasSwap
      };
    })()`);

    assert.equal(results.stageCount, 2, 'Humano + Cosmopolita deve ter exatamente 2 sub-etapas na Fase 6');
    assert.equal(results.stage0Type, 'general', 'Primeira sub-etapa deve ser o poder geral do Humano');
    assert.equal(results.stage1Type, 'cosmopolita', 'Segunda sub-etapa deve ser o poder de Cosmopolita');
    assert.equal(results.stage0HasCosmo, false, 'Na sub-etapa do Humano, Cosmopolita não deve aparecer junto');
    assert.equal(results.stage1HasCosmo, true, 'Na sub-etapa de Cosmopolita, o painel de Cosmopolita deve aparecer');
    assert.equal(results.stage1HasHumano, false, 'Na sub-etapa de Cosmopolita, o poder do Humano não deve aparecer junto');

    // Validações visuais minimalistas e sombrias
    assert.equal(results.hasBannerText, false, 'Não deve conter o banner com texto redundante');
    assert.equal(results.hasSelectedBadge, false, 'Não deve conter tags coloridas de "✓ Selecionado" ou "✓ Poder selecionado"');
    assert.equal(results.hasDisponivelBadge, false, 'Não deve conter badges coloridas berrantes como DISPONÍVEL');

    // Validação de seleção e avanço
    assert.equal(results.cosmoBeforeSelect, null, 'Inicialmente nada selecionado');
    assert.equal(results.cosmoAfterAdvanceId, results.validGeneralId, 'Ao avançar, o poder de Cosmopolita é confirmado');

    // Classes com >= 2 níveis
    assert.equal(results.allClassOptionsGuerreiro, true, 'Somente poderes de Guerreiro (com 2 níveis) disponíveis, não de Ladino');
    assert(results.classOptionsCount > 0, 'Deve listar poderes de classe para Guerreiro');

    // Botão de fácil acesso na ficha
    assert.equal(results.hasEasyEditBtn, true, 'Deve haver botão "Trocar" diretamente no item de Cosmopolita na ficha');
    assert.equal(results.restHasSwap, true, 'Modal de descanso deve ter botão de troca');

    console.log('Todas as regras e exigências de Cosmopolita (etapa separada, visual sombrio/minimalista e botão de editar fácil) foram aprovadas!');
    dom.window.close();
    server.kill();
    process.exit(0);
  } catch (err) {
    server.kill();
    console.error(err);
    process.exit(1);
  }
})();
