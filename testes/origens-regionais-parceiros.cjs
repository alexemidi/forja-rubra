const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { spawn } = require('node:child_process');
const { JSDOM, VirtualConsole } = require('jsdom');

const root = path.resolve(__dirname, '..');
const port = 4218;

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

    const itemsCatalog = JSON.parse(fs.readFileSync(path.join(root, 'dados/items.json'), 'utf8'));
    const partnersCatalog = JSON.parse(fs.readFileSync(path.join(root, 'dados/criador-parceiros.json'), 'utf8'));

    const { dom } = await open('criador');
    const w = dom.window;

    const rawResults = w.eval(`(() => {
      const out = {};

      // Item 1: Presentes em dinheiro de origem somados na carteira
      out.bonusMoneySambur = originMoneyBonus(['T$ 100 (um presente de despedida da sua família)', 'um cão de caça']);
      out.bonusMoneyMultiple = originMoneyBonus(['T$ 50 de bolsa', 'T$ 100 de presente']);

      // Item 2: Coleção de Livros nome customizado
      const customName = 'A Arte da Guerra';
      out.formattedBookName = configuredItemName(
        { options: { customName, knowledge: 'guerra' } },
        { id: 'colecao_de_livros', nome: 'Coleção de Livros' }
      );

      // Item 3: Amazona de Hippion soma Carisma nos PM máximos sem armadura pesada
      const oldRegional = state.origin?.regional;
      const oldMode = state.origin?.mode;
      state.origin.regional = 'Amazona de Hippion';
      state.origin.mode = 'regional';
      const origFinalAttrs = finalAttrs;
      finalAttrs = () => ({ for: 0, des: 0, con: 0, int: 0, sab: 0, car: 3 });
      
      out.hippionPmBonusSemPesada = passiveCharacterEffects().pmFlat;

      const origCharInv = characterInventory;
      characterInventory = () => [{ itemId: 'armadura_completa', isEquipped: true, tipo: 'armadura_pesada' }];
      out.hippionPmBonusComPesada = passiveCharacterEffects().pmFlat;

      finalAttrs = origFinalAttrs;
      characterInventory = origCharInv;
      state.origin.regional = oldRegional;
      state.origin.mode = oldMode;

      // Item 4: Anão de Armas concede +2 de dano com armas anãs
      const machadoItem = DATA.pdfItems.find(i => i.id === 'machado_de_batalha') || { id: 'machado_de_batalha', nome: 'Machado de Batalha', arma: { dano: { principal: '1d8' } } };
      const picaretaItem = DATA.pdfItems.find(i => i.id === 'picareta') || { id: 'picareta', nome: 'Picareta', arma: { dano: { principal: '1d6' } } };
      const espadaItem = DATA.pdfItems.find(i => i.id === 'espada_longa') || { id: 'espada_longa', nome: 'Espada Longa', arma: { dano: { principal: '1d8' } } };

      out.machadoDmgBonus = weaponPassiveStats(machadoItem, { regionalOriginName: 'Anão de Armas' }).damageBonus;
      out.picaretaDmgBonus = weaponPassiveStats(picaretaItem, { regionalOriginName: 'Anão de Armas' }).damageBonus;
      out.espadaDmgBonus = weaponPassiveStats(espadaItem, { regionalOriginName: 'Anão de Armas' }).damageBonus;

      // Item 5: Andarilho Ubaneri e escudos
      out.shieldDefWithProf = shieldPassiveStats(
        { id: 'escudo_pesado', nome: 'Escudo Pesado', defesa: 2 },
        { regionalOriginName: 'Andarilho Ubaneri', hasShieldProficiencyFromClass: true }
      ).defenseBonus;

      out.shieldDefWithoutProf = shieldPassiveStats(
        { id: 'escudo_pesado', nome: 'Escudo Pesado', defesa: 2 },
        { regionalOriginName: 'Andarilho Ubaneri', hasShieldProficiencyFromClass: false }
      ).defenseBonus;

      // Item 5: Alikunha
      state.origin.regional = 'Andarilho Ubaneri';
      state.partners = [];
      ensureOriginPartners();
      out.alikunhaPartner = state.partners.find(p => p.id === 'alikunha');

      // Item 6: Limites de parceiros por patamar
      out.limitLvl1 = characterPartnerLimit(1);
      out.limitLvl5 = characterPartnerLimit(5);
      out.limitLvl17 = characterPartnerLimit(17);

      // Item 7: Desmarca perícia livre duplicada
      out.cleanedSkills = cleanSkillsAfterOriginChange(['atletismo', 'luta', 'pontaria'], ['luta', 'iniciativa']);

      // Item 8: Reset de itens de origem ao mudar origem
      out.resetOriginItems = resetOriginItemsOnOriginChange({ origin_item_1: 'espada_curta', origin_item_2: 'adaga' });

      // Item 10: Aprendiz de Drogadora na manufatura
      out.drogadoraCost300 = RegrasManufatura.custoMateriaPrima(300, { isDrogadora: true });
      out.normalCost300 = RegrasManufatura.custoMateriaPrima(300);
      out.drogadoraPocao1 = RegrasManufatura.custoMateriaPrima(30, { isDrogadora: true });

      return JSON.stringify(out);
    })()`);
    const results = JSON.parse(rawResults);

    // Validações
    console.log('Validando Item 1: Dinheiro de origem...');
    assert.equal(results.bonusMoneySambur, 100);
    assert.equal(results.bonusMoneyMultiple, 150);

    console.log('Validando Item 2: Coleção de Livros nome customizado...');
    assert.equal(results.formattedBookName, 'A Arte da Guerra');

    console.log('Validando Item 3: Amazona de Hippion Carisma no PM...');
    assert.equal(results.hippionPmBonusSemPesada, 3);
    assert.equal(results.hippionPmBonusComPesada, 0);

    console.log('Validando Item 4: Anão de Armas bônus com armas anãs...');
    assert.equal(results.machadoDmgBonus, 2);
    assert.equal(results.picaretaDmgBonus, 2);
    assert.equal(results.espadaDmgBonus, 0);

    console.log('Validando Item 5: Andarilho Ubaneri (escudo + Alikunhá)...');
    assert.equal(results.shieldDefWithProf, 1);
    assert.equal(results.shieldDefWithoutProf, 0);
    assert.ok(results.alikunhaPartner, 'Alikunhá deve ser adicionado aos parceiros');
    assert.equal(results.alikunhaPartner.ignoraLimite, true);
    assert.equal(results.alikunhaPartner.countsTowardsLimit, false);

    console.log('Validando Item 6: Sistema de Parceiros (12 tipos e limites)...');
    assert.equal(partnersCatalog.length, 12);
    const canonicalTypes = [
      'adepto', 'ajudante', 'assassino', 'atirador', 'combatente', 'destruidor',
      'fortao', 'guardiao', 'magivocador', 'medico', 'perseguidor', 'vigilante'
    ];
    for (const p of partnersCatalog) {
      assert.ok(canonicalTypes.includes(p.id));
      assert.ok(p.graus.iniciante);
      assert.ok(p.graus.veterano);
      assert.ok(p.graus.mestre);
    }
    assert.equal(results.limitLvl1, 1);
    assert.equal(results.limitLvl5, 2);
    assert.equal(results.limitLvl17, 3);

    console.log('Validando Item 7: Limpeza de perícia livre duplicada...');
    assert.deepEqual(results.cleanedSkills, ['atletismo', 'pontaria']);

    console.log('Validando Item 8: Reset de itens de origem...');
    assert.deepEqual(results.resetOriginItems, {});

    console.log('Validando Item 9: Treckod em dados/items.json...');
    const treckod = itemsCatalog.find(i => i.id === 'treckod');
    assert.ok(treckod);
    assert.equal(treckod.preco.valor, 50);
    assert.equal(treckod.categoriaId, 'alimentacao');
    assert.equal(treckod.espacos, 1);

    console.log('Validando Item 10: Aprendiz de Drogadora 1/4 do custo de matéria-prima...');
    assert.equal(results.normalCost300, 100);
    assert.equal(results.drogadoraCost300, 75);
    assert.equal(results.drogadoraPocao1, 8);

    console.log('Todos os 10 itens foram validados com sucesso no criador!');
    dom.window.close();
  } finally {
    server.kill();
  }
})();
