// @ts-check
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { JSDOM, VirtualConsole } = require('jsdom');

console.log('=== Teste de Integração: Ofícios de Engenhoca e Grimório Direto ===\n');

const root = path.resolve(__dirname, '..');
const port = 4216;

async function open(pageWithParams, initialStorage = null) {
  const errors = [], vc = new VirtualConsole();
  vc.on('jsdomError', e => {
    if (!/navigation|scroll|CSS|Could not load.*fonts/i.test(e.message)) errors.push(e.cause?.stack || e.detail?.stack || e.message);
  });
  const dom = await JSDOM.fromURL(`http://127.0.0.1:${port}/${pageWithParams}`, {
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(w) {
      if (initialStorage) {
        for (const [k, v] of Object.entries(initialStorage)) {
          w.localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
        }
      }
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
  return { dom, errors };
}

(async () => {
  const server = spawn(process.execPath, [path.join(root, 'ferramentas/servidor.cjs'), String(port)], { stdio: 'pipe' });
  try {
    await new Promise((resolve, reject) => {
      server.stdout.once('data', resolve);
      server.once('error', reject);
    });

    // 1. Testa engenhoca.html com personagem que treinou Armeiro, Carpinteiro, Artesão e Alfaiate
    const { dom } = await open('engenhoca.html?magia=adaga-mental&forma=empunhada', {
      'forja-heroi-t20-v1': JSON.stringify({
        identity: {
          characterName: 'Thurann o Inventor',
          classId: 'inventor',
          plannedLevel: 4,
          classRequiredOffices: { '0': 'oficio:armeiro', '1': 'oficio:carpinteiro' }
        },
        skills: {
          class: ['iniciativa', 'oficio:artesao', 'misticismo'],
          int: ['oficio:alfaiate']
        },
        trainedSkills: ['oficio:armeiro', 'oficio:carpinteiro', 'oficio:artesao', 'oficio:alfaiate'],
        offices: ['armeiro', 'carpinteiro', 'artesao', 'alfaiate']
      })
    });
    const w = dom.window;
    await new Promise(r => setTimeout(r, 200));

    // Valida que o modal antigo e iframe NÃO existem
    assert.equal(w.document.getElementById('spellSelectModal'), null, 'spellSelectModal não deve existir em engenhoca.html');
    assert.equal(w.document.getElementById('engenhocaGrimoireFrame'), null, 'engenhocaGrimoireFrame não deve existir');

    // Valida que acoplamento genérico arbitrário foi removido em favor do poder canônico Armadura Mecanizada
    assert.equal(w.document.getElementById('btnForjarEmItem'), null, 'Botão FORJAR EM ITEM não deve existir');
    assert(w.document.getElementById('btnForjarEngenhoca'), 'Botão Forjar Engenhoca deve existir');

    dom.window.close();
    console.log('✔ Validação 1: Engenhoca autônoma sem acoplamento arbitrário aprovada!');

    // 2. Testa o Grimório no modo engenhoca
    const { dom: grimDom } = await open('grimorio.html?modo=engenhoca&circuloMax=2&forma=empunhada');
    const gw = grimDom.window;
    await new Promise(r => setTimeout(r, 200));

    // Valida banner
    const banner = gw.document.querySelector('.engenhoca-grimoire-banner');
    assert(banner, 'Banner da Oficina do Engenhoqueiro deve existir no grimorio com modo=engenhoca');
    assert(banner.textContent?.includes('Oficina do Engenhoqueiro'), 'Banner deve ter texto correto');

    // Valida cards de magias presentes e contagem > 0
    const cards = Array.from(gw.document.querySelectorAll('.card'));
    console.log('Total de cards compilados no Grimório:', cards.length);
    assert(cards.length > 50, 'Grimório deve carregar todo o compêndio de magias');

    // Verifica card de 1º círculo (ex: adaga-mental ou aviso)
    const cardCirc1 = cards.find(c => Number(c.dataset.circulo) === 1);
    assert(cardCirc1, 'Deve encontrar card de 1º círculo');
    const btnCirc1 = /** @type {HTMLButtonElement} */ (cardCirc1.querySelector('.learn-btn'));
    assert(btnCirc1, 'Botão do card deve existir');
    assert.equal(btnCirc1.textContent, 'Simular Magia', 'Botão para engenhoca deve ser "Simular Magia"');
    assert.equal(btnCirc1.disabled, false, 'Botão de 1º círculo deve estar habilitado para circuloMax=2');

    // Verifica card de círculo superior (ex: 3º ou 4º círculo)
    const cardCirc3 = cards.find(c => Number(c.dataset.circulo) === 3);
    if (cardCirc3) {
      assert.equal(cardCirc3.style.display, 'none', 'Magias de 3º círculo devem ficar ocultas para engenhoca de até 2º círculo');
    }

    grimDom.window.close();
    console.log('✔ Validação 2: Grimório dedicado para Engenhoca aprovado com sucesso!');

    // 3. Testa Grimório Standalone (sem parâmetros)
    const { dom: standDom } = await open('grimorio.html');
    const sw = standDom.window;
    await new Promise(r => setTimeout(r, 200));

    const standCards = Array.from(sw.document.querySelectorAll('.card'));
    const visibleCards = standCards.filter(c => c.style.display !== 'none');
    console.log('Cards visíveis em grimorio.html standalone:', visibleCards.length);
    assert(visibleCards.length > 100, 'Grimório standalone não deve ocultar magias por falta de contexto');

    standDom.window.close();
    console.log('✔ Validação 3: Grimório standalone funcionando normalmente sem janelinha!');

    // 4. Testa que a oficina do armeiro opera normalmente sem acoplamento genérico obsoleto
    const { dom: lojaDom } = await open('loja.html?oficina=armeiro', {
      'forja-heroi-t20-v1': JSON.stringify({
        identity: { characterName: 'Inventor Teste', classId: 'inventor', plannedLevel: 5 },
        attributes: { int: 5, for: 2 },
        money: 5000
      })
    });
    const lw = lojaDom.window;
    await new Promise(r => setTimeout(r, 200));

    const itemsGrid = lw.document.getElementById('itemsGrid');
    assert(itemsGrid, 'Catálogo do armeiro deve carregar normalmente');
    lojaDom.window.close();
    console.log('✔ Validação 4: Catálogo do Armeiro operacional e limpo de acoplamentos genéricos!');

    // 5. Testa engenhoca.html carregada sem magia na URL (não deve ter 'adaga-mental' forçada)
    const { dom: engDom } = await open('engenhoca.html', {
      'forja-heroi-t20-v1': JSON.stringify({
        identity: { characterName: 'Inventor Livre', classId: 'inventor', plannedLevel: 3 },
        attributes: { int: 5 }
      })
    });
    const ew = engDom.window;
    await new Promise(r => setTimeout(r, 200));

    const spellBadge = ew.document.getElementById('engenhocaSpellBadgeLabel');
    assert(spellBadge, 'Badge de magia deve existir');
    assert(spellBadge.textContent.includes('Nenhuma magia selecionada'), 'Badge deve indicar que nenhuma magia está selecionada, obtido: ' + spellBadge.textContent);

    const btnTrocar = ew.document.getElementById('btnTrocarMagiaSimulada');
    assert(btnTrocar, 'Botão de escolher/trocar magia deve existir');
    assert.equal(btnTrocar.textContent.trim(), 'ESCOLHER MAGIA', 'Botão de magia deve ser "ESCOLHER MAGIA"');

    const specCusto = ew.document.getElementById('specCustoMateria');
    const specCd = ew.document.getElementById('specCdFabricacao');
    const specTempo = ew.document.getElementById('specTempo');
    assert.equal(specCusto?.textContent.trim(), '—', 'Custo deve estar vazio (—) antes de selecionar magia');
    assert.equal(specCd?.textContent.trim(), '—', 'CD deve estar vazia (—) antes de selecionar magia');
    assert.equal(specTempo?.textContent.trim(), '—', 'Tempo deve estar vazio (—) antes de selecionar magia');

    const btnForjar = ew.document.getElementById('btnForjarEngenhoca');
    assert(btnForjar, 'Botão principal deve existir');
    assert(btnForjar.textContent.includes('ESCOLHER MAGIA NO GRIMÓRIO'), 'Botão principal deve convidar a escolher magia no grimório: ' + btnForjar.textContent);

    engDom.window.close();
    console.log('✔ Validação 5: Engenhoca inicializada limpa sem nenhuma magia forçada!');

    // 6. Testa que a oficina do engenhoqueiro vai primeiro para a página dos cards de engenhocas
    const { dom: ofiDom } = await open('oficina.html');
    const ow = ofiDom.window;
    await new Promise(r => setTimeout(r, 200));

    const linkEng = ow.document.querySelector('a.division-tab[href*="engenhoqueiro"]');
    assert(linkEng, 'Link da oficina do engenhoqueiro deve existir em oficina.html');
    assert.equal(linkEng.getAttribute('href'), 'loja.html?oficina=engenhoqueiro', 'Link da oficina do engenhoqueiro deve apontar para loja.html?oficina=engenhoqueiro (página dos cards)');
    ofiDom.window.close();

    const { dom: lojaEngDom } = await open('loja.html?oficina=engenhoqueiro', {
      'forja-heroi-t20-v1': JSON.stringify({
        identity: { characterName: 'Inventor Especialista', classId: 'inventor', plannedLevel: 5 },
        attributes: { int: 5 }
      }),
      'arsenal-arton-character-profiles-v1': JSON.stringify({
        activeId: 'ficha-ativa',
        profiles: [{
          id: 'ficha-ativa',
          name: 'Inventor Especialista',
          contraptions: [
            { id: 'c1', nome: 'Disparador Voltaico', spellName: 'Raio Solar', circulo: 1, pm: 1, cdAtivacao: 16 }
          ]
        }]
      })
    });
    const low = lojaEngDom.window;
    await new Promise(r => setTimeout(r, 300));

    const bancadaCard = low.document.querySelector('.engenhoca-special-card');
    assert(bancadaCard, 'Card da Bancada do Engenhoqueiro DEVE estar presente na página dos cards');
    const btnFab = bancadaCard.querySelector('[data-action="choose-engenhoca-spell"]');
    assert(btnFab, 'Botão "Fabricar engenhoca" deve existir no card da Bancada do Engenhoqueiro');
    assert(bancadaCard.textContent.includes('FABRICADAS'), 'Card deve exibir o contador de FABRICADAS');
    assert.equal(bancadaCard.textContent.includes('ATIVAS'), false, 'Card NÃO deve mais exibir contagem de ativas');

    const cardsPortfolio = Array.from(low.document.querySelectorAll('.item-card .item-title')).map(t => t.textContent);
    assert(cardsPortfolio.includes('Bancada do Engenhoqueiro'), 'Deve listar a bancada de engenhocas');
    assert(cardsPortfolio.includes('Disparador Voltaico'), 'Deve exibir os cards das engenhocas forjadas do herói');

    // Valida ícone share (< com bolinhas) no card de engenhoca
    const shareBtn = low.document.querySelector('.btn-copy-share-code');
    assert(shareBtn, 'Botão de copiar código deve existir no card da engenhoca');
    assert(shareBtn.innerHTML.includes('<circle'), 'Botão de código deve usar o ícone de compartilhar (< com bolinhas)');

    // Valida ausência de cabeçalho legado Arsenal
    assert.equal(low.document.querySelector('.site-header'), null, 'Cabeçalho legado .site-header DEVE estar completamente ausente do DOM');

    lojaEngDom.window.close();
    console.log('✔ Validação 6: Oficina do Engenhoqueiro, limite de fabricadas e novo ícone share aprovados!');

  } finally {
    server.kill();
  }
  console.log('\n======================================================');
  console.log('🎉 SUCESSO TOTAL: Integração de Ofícios e Grimório 100% Aprovada!');
  console.log('======================================================\n');
})();
