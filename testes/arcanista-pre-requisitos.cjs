const assert = require('node:assert/strict');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { JSDOM, VirtualConsole } = require('jsdom');

const root = path.resolve(__dirname, '..');
const port = 4226;

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
      state.identity.classId = 'arcanista';
      state.identity.plannedLevel = 2;
      ensureProgression();

      const pEspecialista = DATA.classPowers.find(p => p.nome === 'Especialista em Escola');
      const pCaldeirao = DATA.classPowers.find(p => p.nome === 'Caldeirão do Bruxo');
      const pFocoVital = DATA.classPowers.find(p => p.nome === 'Foco Vital');
      const pEscriba = DATA.classPowers.find(p => p.nome === 'Escriba Arcano');
      const pMemoria = DATA.classPowers.find(p => p.nome === 'Memória Súbita');
      const pHeranca = DATA.classPowers.find(p => p.nome === 'Herança Aprimorada');
      const pProprioSangue = DATA.classPowers.find(p => p.nome === 'O Próprio Sangue');
      const pApoteoseDraconica = DATA.classPowers.find(p => p.nome === 'Apoteose Dracônica');
      const pApoteoseFeerica = DATA.classPowers.find(p => p.nome === 'Apoteose Feérica');

      // ── CASO 1: ARCANISTA BRUXO ───────────────────────────────────────────
      state.identity.classChoices = { arcanista_caminho_do_arcanista: 'Bruxo' };
      state.skills.class = ['misticismo', 'vontade'];

      // Bruxo tentando Especialista em Escola ("Bruxo ou Mago") -> Deve ser OK!
      const bruxoEspecialista = classProgressionEligibility(pEspecialista, 1);

      // Bruxo tentando Foco Vital ("Bruxo") -> Deve ser OK!
      const bruxoFocoVital = classProgressionEligibility(pFocoVital, 1);

      // Bruxo tentando Caldeirão do Bruxo SEM Ofício (alquimista) -> Bloqueado por perícia!
      const bruxoCaldeiraoSemPericia = classProgressionEligibility(pCaldeirao, 1);

      // Bruxo treinando Ofício (alquimia)
      state.skills.class.push('oficio:alquimia');
      const bruxoCaldeiraoComPericia = classProgressionEligibility(pCaldeirao, 1);

      // Bruxo tentando Escriba Arcano ("Mago") -> Bloqueado por caminho Mago!
      const bruxoEscriba = classProgressionEligibility(pEscriba, 1);

      // Bruxo tentando Herança Aprimorada ("Feiticeiro") -> Bloqueado por caminho Feiticeiro!
      const bruxoHeranca = classProgressionEligibility(pHeranca, 1);

      // ── CASO 2: ARCANISTA MAGO ─────────────────────────────────────────────
      state.identity.classChoices = { arcanista_caminho_do_arcanista: 'Mago' };

      // Mago tentando Especialista em Escola ("Bruxo ou Mago") -> Deve ser OK!
      const magoEspecialista = classProgressionEligibility(pEspecialista, 1);

      // Mago tentando Memória Súbita ("Mago") -> Deve ser OK!
      const magoMemoria = classProgressionEligibility(pMemoria, 1);

      // Mago tentando Caldeirão do Bruxo ("Bruxo") -> Bloqueado por caminho Bruxo!
      const magoCaldeirao = classProgressionEligibility(pCaldeirao, 1);

      // Mago tentando Herança Aprimorada ("Feiticeiro") -> Bloqueado por caminho Feiticeiro!
      const magoHeranca = classProgressionEligibility(pHeranca, 1);

      // ── CASO 3: ARCANISTA FEITICEIRO ───────────────────────────────────────
      state.identity.classChoices = {
        arcanista_caminho_do_arcanista: 'Feiticeiro',
        arcanista_caminho_do_arcanista_linhagem: 'Linhagem Dracônica'
      };

      // Feiticeiro tentando Especialista em Escola ("Bruxo ou Mago") -> Bloqueado!
      const feiticeiroEspecialista = classProgressionEligibility(pEspecialista, 1);

      // Feiticeiro tentando Caldeirão do Bruxo ("Bruxo") -> Bloqueado!
      const feiticeiroCaldeirao = classProgressionEligibility(pCaldeirao, 1);

      // Feiticeiro tentando Memória Súbita ("Mago") -> Bloqueado!
      const feiticeiroMemoria = classProgressionEligibility(pMemoria, 1);

      // Feiticeiro tentando O Próprio Sangue ("Feiticeiro") -> OK!
      const feiticeiroProprioSangue = classProgressionEligibility(pProprioSangue, 1);

      // Feiticeiro no nível 2 tentando Herança Aprimorada ("Feiticeiro, 6º nível de arcanista")
      // Deve ser bloqueado por nível (nível 2 < 6)!
      const feiticeiroHerancaNivel2 = classProgressionEligibility(pHeranca, 1);

      // Simulando nível 6 de Arcanista
      state.identity.plannedLevel = 6;
      ensureProgression();
      const feiticeiroHerancaNivel6 = classProgressionEligibility(pHeranca, 5);

      // Feiticeiro Dracônico tentando Apoteose Feérica -> Bloqueado por linhagem!
      const feiticeiroApoteoseErrada = classProgressionEligibility(pApoteoseFeerica, 5);

      return {
        bruxoEspecialista,
        bruxoFocoVital,
        bruxoCaldeiraoSemPericia,
        bruxoCaldeiraoComPericia,
        bruxoEscriba,
        bruxoHeranca,
        magoEspecialista,
        magoMemoria,
        magoCaldeirao,
        magoHeranca,
        feiticeiroEspecialista,
        feiticeiroCaldeirao,
        feiticeiroMemoria,
        feiticeiroProprioSangue,
        feiticeiroHerancaNivel2,
        feiticeiroHerancaNivel6,
        feiticeiroApoteoseErrada
      };
    })()`);

    // Validações Arcanista Bruxo
    assert.equal(results.bruxoEspecialista.ok, true, 'Bruxo deve ser elegível para Especialista em Escola ("Bruxo ou Mago")');
    assert.equal(results.bruxoFocoVital.ok, true, 'Bruxo deve ser elegível para Foco Vital ("Bruxo")');
    assert.equal(results.bruxoCaldeiraoSemPericia.ok, false, 'Bruxo sem Ofício (alquimista) não deve poder pegar Caldeirão do Bruxo');
    assert.match(results.bruxoCaldeiraoSemPericia.reasons.join(' '), /Requer treino em Ofício \(Alquimia\)/i);
    assert.equal(results.bruxoCaldeiraoComPericia.ok, true, 'Bruxo treinado em Ofício (alquimista) deve poder pegar Caldeirão do Bruxo');
    assert.equal(results.bruxoEscriba.ok, false, 'Bruxo não pode pegar poder exclusivo de Mago (Escriba Arcano)');
    assert.match(results.bruxoEscriba.reasons.join(' '), /Requer caminho Mago/i);
    assert.equal(results.bruxoHeranca.ok, false, 'Bruxo não pode pegar poder exclusivo de Feiticeiro (Herança Aprimorada)');
    assert.match(results.bruxoHeranca.reasons.join(' '), /Requer caminho Feiticeiro/i);

    // Validações Arcanista Mago
    assert.equal(results.magoEspecialista.ok, true, 'Mago deve ser elegível para Especialista em Escola ("Bruxo ou Mago")');
    assert.equal(results.magoMemoria.ok, true, 'Mago deve ser elegível para Memória Súbita ("Mago")');
    assert.equal(results.magoCaldeirao.ok, false, 'Mago não pode pegar poder exclusivo de Bruxo (Caldeirão do Bruxo)');
    assert.match(results.magoCaldeirao.reasons.join(' '), /Requer caminho Bruxo/i);
    assert.equal(results.magoHeranca.ok, false, 'Mago não pode pegar poder exclusivo de Feiticeiro (Herança Aprimorada)');
    assert.match(results.magoHeranca.reasons.join(' '), /Requer caminho Feiticeiro/i);

    // Validações Arcanista Feiticeiro
    assert.equal(results.feiticeiroEspecialista.ok, false, 'Feiticeiro não pode pegar Especialista em Escola ("Bruxo ou Mago")');
    assert.match(results.feiticeiroEspecialista.reasons.join(' '), /Requer caminho Bruxo ou Mago/i);
    assert.equal(results.feiticeiroCaldeirao.ok, false, 'Feiticeiro não pode pegar Caldeirão do Bruxo ("Bruxo")');
    assert.match(results.feiticeiroCaldeirao.reasons.join(' '), /Requer caminho Bruxo/i);
    assert.equal(results.feiticeiroMemoria.ok, false, 'Feiticeiro não pode pegar Memória Súbita ("Mago")');
    assert.match(results.feiticeiroMemoria.reasons.join(' '), /Requer caminho Mago/i);
    assert.equal(results.feiticeiroProprioSangue.ok, true, 'Feiticeiro deve ser elegível para O Próprio Sangue ("Feiticeiro")');

    // Validações de nível e linhagem
    assert.equal(results.feiticeiroHerancaNivel2.ok, false, 'Herança Aprimorada deve ser bloqueada no nível 2 de arcanista');
    assert.match(results.feiticeiroHerancaNivel2.reasons.join(' '), /Requer nível 6 nesta classe/i);
    assert.equal(results.feiticeiroHerancaNivel6.ok, true, 'Herança Aprimorada deve ser liberada no nível 6 de arcanista');
    assert.equal(results.feiticeiroApoteoseErrada.ok, false, 'Feiticeiro Dracônico não pode pegar Apoteose Feérica');
    assert.match(results.feiticeiroApoteoseErrada.reasons.join(' '), /Requer Linhagem feérica/i);

    console.log('✔ Todas as regras de caminhos do Arcanista, pré-requisitos de perícias e níveis foram aprovadas com sucesso!');
    server.kill();
    process.exit(0);
  } finally {
    server.kill();
  }
})();
