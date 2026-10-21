// @ts-check

/**
 * FORJA RUBRA — Módulo de Oficinas de Fabricação de Arton
 * Suporta dois modos:
 * 1. Modo Enciclopédia (Acesso pelo menu lateral "Oficinas de Fabricação"):
 *    - Todas as 17 oficinas canônicas de Tormenta 20 em grid de 4 colunas.
 *    - Cada card é clicável e navega diretamente para o compêndio (loja/grimório) com os filtros aplicados.
 *    - Regras de fabricação recolhidas por padrão, abrindo somente ao clicar no botão.
 * 2. Modo Fabricar (?modo=fabricar, acesso pelo botão "Fabricar" na mochila da ficha):
 *    - Exibe apenas as oficinas nas quais o aventureiro for treinado.
 *    - Exibe dados do herói e saldo de Tibares no topo com botão de retorno à ficha.
 *    - Cada card possui botão chanfrado [Fabricar].
 *    - Bancada interativa com cálculo de ⅓ do preço em matérias-primas, rolagem de teste de Ofício (d20 + perícia),
 *      débito de moedas e inserção do item fabricado diretamente na mochila do herói.
 */
(() => {
  'use strict';

  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c]));
  }

  function getIcon(name, cls = '') {
    return window.IconesForja ? window.IconesForja.get(name, cls) : '';
  }

  const OFICINAS_METADATA = {
    alquimista: {
      id: 'alquimista',
      title: 'Laboratório do Alquimista',
      icon: 'flask',
      pericia: 'Ofício (Alquimia)',
      subtitulo: 'Ofício (Alquimia)',
      atributo: 'Inteligência',
      tempoPadrao: '1 dia (por lote ou poção)',
      cdPadrao: 'CD 20 (alquímicos e venenos) · CD 20 + PM (poções)',
      descricao: 'Preparados alquímicos, catalisadores, venenos, poções mágicas, óleos e granadas.',
      linkEnciclopedia: 'loja.html?oficina=alquimista'
    },
    armeiro: {
      id: 'armeiro',
      title: 'Forja do Ferreiro',
      icon: 'hammer',
      pericia: 'Ofício (Armeiro)',
      subtitulo: 'Ofício (Armeiro)',
      atributo: 'Inteligência',
      tempoPadrao: '1 semana (mundano) · 1 mês (superior / mágico)',
      cdPadrao: 'CD 15 (simples / escudos leves) · CD 20 (marciais, exóticas, pesadas)',
      descricao: 'Armas, armaduras e escudos.',
      linkEnciclopedia: 'loja.html?oficina=armeiro'
    },
    engenhoqueiro: {
      id: 'engenhoqueiro',
      title: 'Oficina do Engenhoqueiro',
      icon: 'gear',
      pericia: 'Ofício (Engenhoqueiro)',
      subtitulo: 'Ofício (Engenhoqueiro)',
      atributo: 'Inteligência',
      tempoPadrao: '1 dia (por engenhoca)',
      cdPadrao: 'CD 20 + PM (fabricar) · CD 15 + PM (ativar)',
      descricao: 'Engenhocas mundanas que simulam magias arcanas ou divinas.',
      linkEnciclopedia: 'loja.html?oficina=engenhoqueiro'
    },
    alfaiate: {
      id: 'alfaiate',
      title: 'Ateliê do Alfaiate',
      icon: 'scissors',
      pericia: 'Ofício (Alfaiate)',
      subtitulo: 'Ofício (Alfaiate)',
      atributo: 'Inteligência',
      tempoPadrao: '1 semana',
      cdPadrao: 'CD 15 (trajes comuns) · CD 20 (trajes camuflados ou mantos finos)',
      descricao: 'Vestuário, capas, trajes e itens de tecido.',
      linkEnciclopedia: 'loja.html?oficina=alfaiate'
    },
    tatuador: {
      id: 'tatuador',
      title: 'Estúdio do Tatuador',
      icon: 'feather',
      pericia: 'Ofício (Tatuador)',
      subtitulo: 'Ofício (Tatuador)',
      atributo: 'Destreza',
      tempoPadrao: '1 semana',
      cdPadrao: 'CD 20',
      descricao: 'Tatuagens místicas de 1º círculo.',
      linkEnciclopedia: 'grimorio.html?circulo=1'
    },
    artesao: {
      id: 'artesao',
      title: 'Oficina do Artesão',
      icon: 'tools',
      pericia: 'Ofício (Artesão)',
      subtitulo: 'Ofício (Artesão)',
      atributo: 'Inteligência',
      tempoPadrao: '1 semana',
      cdPadrao: 'CD 15 (itens de aventura comuns)',
      descricao: 'Itens gerais de aventura, ferramentas, esotéricos.',
      linkEnciclopedia: 'loja.html?oficina=artesao'
    },
    cozinheiro: {
      id: 'cozinheiro',
      title: 'Cozinha',
      icon: 'coffee',
      pericia: 'Ofício (Culinária)',
      subtitulo: 'Ofício (Culinária)',
      atributo: 'Inteligência',
      tempoPadrao: '1 dia',
      cdPadrao: 'CD 15 (rações e refeições comuns) · CD 20 (pratos especiais e banquetes)',
      descricao: 'Alimentação, rações de viagem e consumíveis culinários.',
      linkEnciclopedia: 'loja.html?oficina=cozinheiro'
    },
    pedreiro: {
      id: 'pedreiro',
      title: 'Oficina do Pedreiro',
      icon: 'tools',
      pericia: 'Ofício (Pedreiro)',
      subtitulo: 'Ofício (Pedreiro)',
      atributo: 'Inteligência',
      tempoPadrao: '1 semana a 1 mês',
      cdPadrao: 'CD 15 (muros e estruturas simples) · CD 20 (fortificações)',
      descricao: 'Obras em pedra, tijolo, argamassa e estruturas.',
      linkEnciclopedia: 'loja.html?oficina=pedreiro'
    },
    carpinteiro: {
      id: 'carpinteiro',
      title: 'Oficina do Carpinteiro',
      icon: 'tools',
      pericia: 'Ofício (Carpinteiro)',
      subtitulo: 'Ofício (Carpinteiro)',
      atributo: 'Inteligência',
      tempoPadrao: '1 semana',
      cdPadrao: 'CD 15 (bordões, cajados e escudos leves) · CD 20 (arcos e bestas)',
      descricao: 'Arcos, bestas, bordões, cajados e escudos leves.',
      linkEnciclopedia: 'loja.html?oficina=carpinteiro'
    },
    joalheiro: {
      id: 'joalheiro',
      title: 'Oficina do Joalheiro',
      icon: 'sparkles',
      pericia: 'Ofício (Joalheiro)',
      subtitulo: 'Ofício (Joalheiro)',
      atributo: 'Inteligência',
      tempoPadrao: '1 semana · 1 mês (itens mágicos)',
      cdPadrao: 'CD 15 (joias simples) · CD 20 (anéis nobres, amuletos e engastes)',
      descricao: 'Joias, anéis, amuletos nobres e engastes de gemas.',
      linkEnciclopedia: 'loja.html?oficina=joalheiro'
    },
    fazendeiro: {
      id: 'fazendeiro',
      title: 'Fazenda',
      icon: 'sun',
      pericia: 'Ofício (Fazendeiro)',
      subtitulo: 'Ofício (Fazendeiro)',
      atributo: 'Sabedoria',
      tempoPadrao: '1 estação (colheitas) · 1 semana (recursos)',
      cdPadrao: 'CD 15 (cultivo básico) · CD 20 (espécies raras)',
      descricao: 'Gestão de colheitas, sementes, rebanhos e recursos agrícolas.',
      linkEnciclopedia: 'loja.html?oficina=fazendeiro'
    },
    pescador: {
      id: 'pescador',
      title: 'Cais do Pescador',
      icon: 'anchor',
      pericia: 'Ofício (Pescador)',
      subtitulo: 'Ofício (Pescador)',
      atributo: 'Sabedoria',
      tempoPadrao: '1 dia a 1 semana',
      cdPadrao: 'CD 15 (pesca costeira) · CD 20 (águas bravas)',
      descricao: 'Pesca marítima e fluvial, redes, anzóis e recursos aquáticos.',
      linkEnciclopedia: 'loja.html?oficina=pescador'
    },
    estalajadeiro: {
      id: 'estalajadeiro',
      title: 'Estalagem',
      icon: 'home',
      pericia: 'Ofício (Estalajadeiro)',
      subtitulo: 'Ofício (Estalajadeiro)',
      atributo: 'Carisma',
      tempoPadrao: '1 dia',
      cdPadrao: 'CD 15 (acolhimento padrão) · CD 20 (hospedagem nobre e festas)',
      descricao: 'Hospedagem, serviços de pousada, acolhimento e banquetes.',
      linkEnciclopedia: 'taverna.html'
    },
    escriba: {
      id: 'escriba',
      title: 'Gabinete do Escriba',
      icon: 'scroll',
      pericia: 'Ofício (Escriba)',
      subtitulo: 'Ofício (Escriba)',
      atributo: 'Inteligência',
      tempoPadrao: '1 dia (por pergaminho) · 1 semana (livros / mapas)',
      cdPadrao: 'CD 20 + PM (pergaminhos) · CD 15/20 (livros e documentos)',
      descricao: 'Pergaminhos de magias, mapas detalhados, tintas e livros.',
      linkEnciclopedia: 'grimorio.html?modo=pergaminho'
    },
    escultor: {
      id: 'escultor',
      title: 'Oficina do Escultor',
      icon: 'tools',
      pericia: 'Ofício (Escultor)',
      subtitulo: 'Ofício (Escultor)',
      atributo: 'Destreza',
      tempoPadrao: '1 semana a 1 mês',
      cdPadrao: 'CD 15 (estatuetas simples) · CD 20 (monumentos e bustos nobres)',
      descricao: 'Esculturas em mármore, pedra, argila ou madeira nobre.',
      linkEnciclopedia: 'loja.html?oficina=escultor'
    },
    pintor: {
      id: 'pintor',
      title: 'Ateliê do Pintor',
      icon: 'feather',
      pericia: 'Ofício (Pintor)',
      subtitulo: 'Ofício (Pintor)',
      atributo: 'Destreza',
      tempoPadrao: '1 semana',
      cdPadrao: 'CD 15 (telas simples) · CD 20 (obras-primas e murais)',
      descricao: 'Retratos, afrescos, ilustrações heráldicas e brasões.',
      linkEnciclopedia: 'loja.html?oficina=pintor'
    },
    minerador: {
      id: 'minerador',
      title: 'Mina do Minerador',
      icon: 'shield',
      pericia: 'Ofício (Minerador)',
      subtitulo: 'Ofício (Minerador)',
      atributo: 'Constituição',
      tempoPadrao: '1 semana',
      cdPadrao: 'CD 15 (minérios comuns) · CD 20 (materiais raros: Adamante, Mitral, Aço-Rubi)',
      descricao: 'Prospecção e extração de matérias-primas e minérios raros.',
      linkEnciclopedia: 'loja.html?oficina=minerador'
    }
  };

  const TABELA_MELHORIAS = [
    { qtd: 1, precoMercado: 300, materiaPrima: 100, cdMod: '+5', nivelMin: 2, descricao: '1ª Melhoria (ex: Equilibrada, Certeira, Reforçada)' },
    { qtd: 2, precoMercado: 3000, materiaPrima: 1000, cdMod: '+10', nivelMin: 2, descricao: '2ª Melhoria cumulativa' },
    { qtd: 3, precoMercado: 9000, materiaPrima: 3000, cdMod: '+15', nivelMin: 2, descricao: '3ª Melhoria cumulativa' },
    { qtd: 4, precoMercado: 18000, materiaPrima: 6000, cdMod: '+20', nivelMin: 2, descricao: '4ª Melhoria (Obra-Prima lendária)' }
  ];

  const TABELA_ENCANTOS = [
    { qtd: 1, precoMercado: 18000, materiaPrima: 6000, cdMod: '+10', pmSacrificio: 1, nivelMin: 9, descricao: '1º Encanto Mágico (Item Menor)' },
    { qtd: 2, precoMercado: 36000, materiaPrima: 12000, cdMod: '+15', pmSacrificio: 2, nivelMin: 9, descricao: '2º Encanto Mágico (Item Médio)' },
    { qtd: 3, precoMercado: 72000, materiaPrima: 24000, cdMod: '+20', pmSacrificio: 3, nivelMin: 9, descricao: '3º Encanto Mágico (Item Maior)' }
  ];

  let activeDivision = 'armeiro';
  let searchQuery = '';
  let subFilter = 'todos';

  function getActiveHero() {
    try {
      const raw = localStorage.getItem('forja-heroi-t20-v1');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch {
      // Ignora erro
    }
    return null;
  }

  function obterOficiosHeroi(hero) {
    if (!hero) return [];
    const list = [];
    const rules = window.RegrasManufatura;

    const add = (rawName) => {
      if (!rawName) return;
      const clean = String(rawName).replace(/^oficio:\s*|^Ofício\s*\(|\)$/gi, '').trim();
      if (!clean) return;
      const norm = rules ? rules.normalizarOficio(clean) : clean.toLowerCase();
      if (!list.some(item => item.norm === norm)) {
        list.push({
          raw: rawName,
          nome: clean.charAt(0).toUpperCase() + clean.slice(1),
          norm
        });
      }
    };

    const rawSkills = [];
    if (Array.isArray(hero.trainedSkills)) {
      rawSkills.push(...hero.trainedSkills);
    }
    if (Array.isArray(hero.skills)) {
      rawSkills.push(...hero.skills);
    } else if (hero.skills && typeof hero.skills === 'object') {
      Object.values(hero.skills).forEach(val => {
        if (Array.isArray(val)) rawSkills.push(...val);
        else if (typeof val === 'string') rawSkills.push(val);
      });
    }

    rawSkills.forEach(s => {
      const str = String(s).toLowerCase();
      if (str.startsWith('oficio:') || str.startsWith('oficio (') || str.startsWith('ofício')) {
        add(s);
      }
    });

    if (hero.identity?.classRequiredOffices) {
      Object.values(hero.identity.classRequiredOffices).forEach(add);
    }
    if (hero.origin?.officeSpecialties) {
      Object.values(hero.origin.officeSpecialties).forEach(add);
    }

    // Se for da classe Inventor ou Alquimista sem ofício explícito listado, concede os respectivos ofícios canônicos
    const clsId = String(hero.identity?.classId || '').toLowerCase();
    if (clsId === 'inventor') {
      if (!list.some(i => i.norm === 'armeiro')) add('Ofício (Armeiro)');
      if (!list.some(i => i.norm === 'engenhoqueiro')) add('Ofício (Engenhoqueiro)');
      if (!list.some(i => i.norm === 'alquimista')) add('Ofício (Alquimia)');
      if (!list.some(i => i.norm === 'artesao')) add('Ofício (Artesão)');
    } else if (clsId === 'alquimista') {
      if (!list.some(i => i.norm === 'alquimista')) add('Ofício (Alquimia)');
    }

    // Artesão Criativo: considerado treinado em todos os ofícios, tendo acesso a todas as oficinas
    // @ts-ignore
    const artRules = typeof RegrasArtesaoCriativo !== 'undefined' ? RegrasArtesaoCriativo : (typeof window !== 'undefined' ? (window as any).RegrasArtesaoCriativo : null);
    const temArtesaoCriativo = artRules && typeof artRules.temPoderArtesaoCriativo === 'function'
      ? artRules.temPoderArtesaoCriativo(hero)
      : ((Array.isArray(hero?.progression) && hero.progression.some((p: any) => p?.powerId === 'inventor_artesao_criativo' || p?.powerId === 'artesao_criativo' || /artes[aã]o criativo/i.test(p?.powerName || ''))) ||
         (Array.isArray(hero?.powers) && hero.powers.some((p: any) => p?.id === 'inventor_artesao_criativo' || p?.id === 'artesao_criativo' || /artes[aã]o criativo/i.test(p?.nome || ''))));
    if (temArtesaoCriativo) {
      ['Ofício (Armeiro)', 'Ofício (Alquimia)', 'Ofício (Alfaiate)', 'Ofício (Artesão)', 'Ofício (Carpinteiro)', 'Ofício (Cozinheiro)', 'Ofício (Engenhoqueiro)', 'Ofício (Escriba)', 'Ofício (Escultor)', 'Ofício (Joalheiro)', 'Ofício (Pedreiro)', 'Ofício (Pintor)', 'Ofício (Tatuador)'].forEach(add);
    }

    return list;
  }

  function obterFundosHeroi(hero) {
    if (typeof localStorage !== 'undefined') {
      try {
        const published = JSON.parse(localStorage.getItem('forja-saldo-personagem-ativo-v1') || 'null');
        if (published && Number.isFinite(Number(published.funds)) && Number(published.funds) > 0) {
          return Number(published.funds);
        }
      } catch (e) {}
    }

    if (!hero) return 0;

    if (hero.inventoryMoney) {
      const tibares = Number(hero.inventoryMoney.tibares ?? hero.inventoryMoney.ts ?? 0);
      const to = Number(hero.inventoryMoney.to ?? 0);
      const tc = Number(hero.inventoryMoney.tc ?? 0);
      const totalMoedas = (to * 10) + tibares + (tc * 0.1);
      if (totalMoedas > 0) return totalMoedas;
    }

    if (hero.moedas) {
      const to = Number(hero.moedas.to ?? 0);
      const ts = Number(hero.moedas.ts ?? 0);
      const tc = Number(hero.moedas.tc ?? 0);
      const totalMoedas = (to * 10) + ts + (tc * 0.1);
      if (totalMoedas > 0) return totalMoedas;
    }

    if (hero.dinheiro != null && Number(hero.dinheiro) > 0) {
      return Number(hero.dinheiro);
    }

    if (hero.funds != null && Number(hero.funds) > 0) {
      return Number(hero.funds);
    }

    if (hero.finances) {
      const STARTING_FUNDS_TABLE = { 2: 300, 3: 600, 4: 1000, 5: 2000, 6: 3000, 7: 5000, 8: 7000, 9: 10000, 10: 13000, 11: 19000, 12: 27000, 13: 36000, 14: 49000, 15: 66000, 16: 88000, 17: 110000, 18: 150000, 19: 200000, 20: 260000 };
      const lvl = Number(hero.finances.startingLevel) || Number(hero.identity?.plannedLevel) || Number(hero.identity?.initialLevel) || Number(hero.level) || 1;
      const starting = lvl === 1
        ? (Number(hero.finances.levelOneTibars) || (STARTING_FUNDS_TABLE[lvl] || Number(hero.finances.startingFunds || 0)))
        : (STARTING_FUNDS_TABLE[lvl] || Number(hero.finances.startingFunds || 0));
      const rewards = Number(hero.finances.rewardFunds || 0);
      const spent = Number(hero.finances.spent || 0);
      const ledgerBalance = Math.max(0, starting + rewards - spent);
      if (ledgerBalance > 0) return ledgerBalance;
    }

    if (typeof localStorage !== 'undefined') {
      try {
        const rawProfiles = localStorage.getItem('arsenal-arton-character-profiles-v1');
        if (rawProfiles) {
          const prof = JSON.parse(rawProfiles);
          const active = prof.profiles?.find(p => p.id === 'ficha-ativa') || prof.profiles?.find(p => p.id === prof.activeId) || prof.profiles?.[0];
          if (active?.funds != null && Number(active.funds) > 0) return Number(active.funds);
          if (active?.money != null && Number(active.money) > 0) return Number(active.money);
        }
      } catch (e) {}
    }

    return 0;
  }

  function debitarFundosHeroi(hero, custo) {
    if (!hero) return;
    if (hero.finances) {
      hero.finances.spent = (Number(hero.finances.spent) || 0) + custo;
    }
    if (hero.inventoryMoney && hero.inventoryMoney.tibares != null) {
      hero.inventoryMoney.tibares = Math.max(0, Number(hero.inventoryMoney.tibares) - custo);
    }
    if (hero.funds != null) {
      hero.funds = Math.max(0, Number(hero.funds) - custo);
    }
    try {
      localStorage.setItem('forja-heroi-t20-v1', JSON.stringify(hero));
    } catch (e) {
      console.error('Erro ao persistir herói:', e);
    }
  }

  function adicionarItemMochilaHeroi(hero, item) {
    if (!hero || !item) return;
    const instanceId = 'crafted_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newEntry = {
      instanceId: instanceId,
      itemId: item.id,
      itemName: item.nome || item.name,
      displayName: item.nome || item.name,
      quantity: 1,
      origin: 'manufatura',
      options: {},
      improvements: [],
      enchantments: []
    };

    // 1. Atualizar profiles do Arsenal (utilizado pela ficha e loja)
    try {
      const rawProfiles = hero.storage && hero.storage['arsenal-arton-profiles-v1'];
      let profilesObj = rawProfiles ? JSON.parse(rawProfiles) : null;
      if (!profilesObj) {
        const globalRaw = localStorage.getItem('arsenal-arton-profiles-v1');
        if (globalRaw) profilesObj = JSON.parse(globalRaw);
      }
      if (profilesObj && Array.isArray(profilesObj.profiles)) {
        const activeProf = profilesObj.profiles.find(p => p.id === 'ficha-ativa') || profilesObj.profiles[0];
        if (activeProf) {
          if (!Array.isArray(activeProf.backpack)) activeProf.backpack = [];
          activeProf.backpack.push({ ...newEntry });
          if (hero.storage) {
            hero.storage['arsenal-arton-profiles-v1'] = JSON.stringify(profilesObj);
          }
          localStorage.setItem('arsenal-arton-profiles-v1', JSON.stringify(profilesObj));
        }
      }
    } catch (err) {
      console.error('Erro ao atualizar arsenal profiles:', err);
    }

    // 2. Atualizar inventário direto se presente
    if (Array.isArray(hero.backpack)) {
      hero.backpack.push({ ...newEntry });
    }
    if (hero.equipment && Array.isArray(hero.equipment.backpack)) {
      hero.equipment.backpack.push({ ...newEntry });
    }

    try {
      localStorage.setItem('forja-heroi-t20-v1', JSON.stringify(hero));
    } catch (e) {
      console.error('Erro ao persistir item na ficha:', e);
    }
  }

  function calcularBonusOficio(hero, meta) {
    if (!hero) return 0;
    const level = Number(hero.progression?.level || hero.identity?.plannedLevel || hero.identity?.initialLevel || 1);
    const halfLevel = Math.floor(level / 2);
    const trainBonus = level >= 15 ? 6 : (level >= 7 ? 4 : 2);

    let attrKey = 'int';
    if (meta.atributo === 'Destreza') attrKey = 'des';
    else if (meta.atributo === 'Sabedoria') attrKey = 'sab';
    else if (meta.atributo === 'Constituição') attrKey = 'con';
    else if (meta.atributo === 'Carisma') attrKey = 'car';
    else if (meta.atributo === 'Força') attrKey = 'for';

    const attrs = hero.identity?.baseAttrs || hero.attributes || {};
    const raceAttrs = hero.identity?.raceAttrs || [];
    let baseMod = Number(attrs[attrKey] || 0);
    if (Array.isArray(raceAttrs) && raceAttrs.includes(attrKey)) baseMod += 1;

    return halfLevel + trainBonus + baseMod;
  }

  function showCraftResultModal({ sucesso, d20, bonus, total, cd, item, custo }) {
    let backdrop = document.getElementById('craftResultModal');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'craftResultModal';
      backdrop.className = 'craft-result-backdrop';
      document.body.appendChild(backdrop);
    }

    const title = sucesso ? 'Fabricação Bem-Sucedida!' : 'Falha no Teste de Ofício';
    const cardClass = sucesso ? 'craft-result-card success' : 'craft-result-card failure';
    const itemName = item.nome || item.name;

    backdrop.innerHTML = `
      <div class="${cardClass}" role="dialog" aria-modal="true">
        <h3 class="craft-result-title">${title}</h3>
        
        <div class="craft-roll-box">
          <span>d20: <span class="die-val">${d20}</span></span>
          <span>+ Bônus: <strong>${bonus >= 0 ? '+' + bonus : bonus}</strong></span>
          <span>= Total: <span class="die-val" style="color:${sucesso ? '#4ade80' : '#ef4444'};">${total}</span></span>
          <span class="vs-cd">(vs CD ${cd})</span>
        </div>

        <p class="craft-result-msg">
          ${sucesso ? `
            Você obteve êxito com maestria! <strong>${esc(itemName)}</strong> foi produzido com perfeição por <strong>T$ ${custo.toLocaleString('pt-BR')}</strong> em matérias-primas e já está disponível na sua mochila.
          ` : `
            Você não conseguiu atingir a dificuldade necessária (CD ${cd}). Conforme as regras de manufatura de Tormenta 20, a matéria-prima no valor de <strong>T$ ${custo.toLocaleString('pt-BR')}</strong> foi perdida no processo.
          `}
        </p>

        <div style="display:flex;justify-content:center;gap:12px;margin-top:8px;">
          <button type="button" class="button primary" id="btnCloseCraftModal" style="padding:8px 24px;min-width:120px;">
            Continuar
          </button>
        </div>
      </div>
    `;

    backdrop.hidden = false;
    document.getElementById('btnCloseCraftModal')?.addEventListener('click', () => {
      backdrop.hidden = true;
    });
  }

  function getItemsForDivision(divisionKey) {
    const rawItems = window.__FORJA_DATA__?.ITEMS || window.ITEMS || window.__FORJA_DATA__?.DATA?.pdfItems || [];
    const rules = window.RegrasManufatura;
    if (Array.isArray(rawItems) && rawItems.length > 0) {
      if (rules && typeof rules.filtrarItensPorOficio === 'function') {
        const filtered = rules.filtrarItensPorOficio(rawItems, divisionKey);
        if (filtered.length > 0) return filtered;
      }

      const manual = rawItems.filter(item => {
        if (!item || (!item.preco && !item.price)) return false;
        const cat = `${item.tipo || ''} ${item.categoriaId || ''} ${item.nome || ''}`.toLowerCase();
        if (divisionKey === 'armeiro') return item.tipo === 'arma' || item.tipo === 'armadura' || item.tipo === 'escudo';
        if (divisionKey === 'alfaiate') return item.categoriaId === 'vestuario' || /vestu|traje|manto|capa/i.test(cat);
        if (divisionKey === 'alquimista') return item.categoriaId === 'alquimico_catalisador' || item.categoriaId === 'alquimico_preparado' || item.categoriaId === 'alquimico_venenoso' || (String(item.categoriaId || '').startsWith('alquimico_') && item.categoriaId !== 'alquimico');
        if (divisionKey === 'cozinheiro') return item.categoriaId === 'alimentacao' || item.categoriaId === 'bebida' || /comida|refeic|prato|racao|alimento/i.test(cat);
        if (divisionKey === 'escriba') return item.categoriaId === 'documento' || /pergaminho|livro|mapa|tinta/i.test(cat);
        if (divisionKey === 'joalheiro' || divisionKey === 'ourives') return item.tipo === 'acessorio' || /anel|amuleto|colar|brinco|joia/i.test(cat);
        if (divisionKey === 'carpinteiro') return (item.tipo === 'arma' && /arco|besta|bordao|cajado/i.test(cat)) || (item.tipo === 'escudo' && /leve/i.test(cat));
        if (divisionKey === 'artesao') return item.tipo === 'item_geral' && ['equipamento_aventura', 'instrumento', 'ferramenta', 'esoterico', 'itens_gerais'].includes(item.categoriaId);
        if (divisionKey === 'engenhoqueiro') return /engenhoca|aparato/i.test(cat);
        if (divisionKey === 'tatuador') return /tatuagem|pigmento/i.test(cat);
        return true;
      });
      if (manual.length > 0) return manual;
    }

    if (rules && rules.secoesOficina && rules.secoesOficina[divisionKey]) {
      return (rules.secoesOficina[divisionKey].exemplos || []).map(ex => ({
        id: ex.id || 'rec_' + ex.nome.toLowerCase().replace(/\s+/g, '_'),
        nome: ex.nome,
        tipo: ex.tipo || 'comum',
        categoriaId: ex.categoriaId || divisionKey,
        preco: { valor: ex.preco || 30 }
      }));
    }
    return [];
  }

  function renderCraftBench(divisionKey, hero) {
    const container = document.getElementById('divisionContent');
    if (!container) return;

    const meta = OFICINAS_METADATA[divisionKey] || OFICINAS_METADATA.armeiro;
    const bonus = calcularBonusOficio(hero, meta);
    const funds = obterFundosHeroi(hero);
    const formattedFunds = `T$ ${funds.toLocaleString('pt-BR')}`;
    const items = getItemsForDivision(divisionKey);

    const q = searchQuery.toLowerCase().trim();
    const filtered = items.filter(it => {
      const matchName = !q || String(it.nome || it.name || '').toLowerCase().includes(q);
      if (!matchName) return false;
      if (subFilter === 'todos') return true;
      if (subFilter === 'armas') return it.tipo === 'arma';
      if (subFilter === 'armaduras') return it.tipo === 'armadura';
      if (subFilter === 'escudos') return it.tipo === 'escudo' || it.categoriaId === 'escudo';
      return true;
    });

    const headerHtml = `
      <div class="division-header">
        <div>
          <div class="division-badge-skill">
            ${getIcon(meta.icon, 'icon-sm')}
            <span>${esc(meta.pericia)} · Bônus de Teste: ${bonus >= 0 ? '+' + bonus : bonus}</span>
          </div>
          <h2 style="font-family:'Cinzel',serif;font-size:1.6rem;color:#ffffff;margin:10px 0 6px;">${esc(meta.title)}</h2>
          <p style="color:var(--muted);font-size:0.9rem;margin:0 0 12px;max-width:750px;">${esc(meta.descricao)}</p>
          <div style="display:flex;flex-wrap:wrap;gap:16px;font-size:0.84rem;color:var(--cream);">
            <div><strong>CD Padrão:</strong> <span style="color:#f59e0b;">${esc(meta.cdPadrao)}</span></div>
            <div><strong>Tempo de Trabalho:</strong> <span style="color:#60a5fa;">${esc(meta.tempoPadrao)}</span></div>
            <div><strong>Saldo do Aventureiro:</strong> <span style="color:#4ade80;font-weight:700;">${formattedFunds}</span></div>
          </div>
        </div>
      </div>
    `;

    const toolbarHtml = `
      <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;margin:20px 0 16px;">
        <div style="position:relative;flex:1;min-width:260px;max-width:450px;">
          <input type="text" id="benchSearchInput" value="${esc(searchQuery)}" placeholder="Buscar receita ou item para fabricar..." 
            style="width:100%;padding:9px 14px 9px 36px;background:#100b0d;border:1px solid var(--line);border-radius:6px;color:#fff;font-size:0.88rem;" />
          <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--muted);">
            ${getIcon('search', 'icon-sm')}
          </span>
        </div>
        ${divisionKey === 'armeiro' ? `
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <button class="button ${subFilter === 'todos' ? 'primary' : ''}" data-subfilter="todos" type="button" style="padding:6px 14px;font-size:0.82rem;">Todos (${items.length})</button>
          <button class="button ${subFilter === 'armas' ? 'primary' : ''}" data-subfilter="armas" type="button" style="padding:6px 14px;font-size:0.82rem;">Armas</button>
          <button class="button ${subFilter === 'armaduras' ? 'primary' : ''}" data-subfilter="armaduras" type="button" style="padding:6px 14px;font-size:0.82rem;">Armaduras</button>
          <button class="button ${subFilter === 'escudos' ? 'primary' : ''}" data-subfilter="escudos" type="button" style="padding:6px 14px;font-size:0.82rem;">Escudos</button>
        </div>
        ` : ''}
      </div>
    `;

    let tableHtml = '';
    if (filtered.length === 0) {
      tableHtml = `
        <div style="padding:40px 20px;text-align:center;color:var(--muted);background:#110d0f;border-radius:8px;border:1px dashed var(--line);margin-top:16px;">
          <p style="margin:0;font-size:0.95rem;">Nenhum item ou receita encontrada para este filtro.</p>
        </div>
      `;
    } else {
      tableHtml = `
        <div class="recipes-table-wrap">
          <table class="recipes-table">
            <thead>
              <tr>
                <th>Equipamento / Receita</th>
                <th>Categoria</th>
                <th>Preço Mercado</th>
                <th>Matéria-Prima (⅓)</th>
                <th>CD Teste</th>
                <th>Tempo</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(item => {
                const precoMercado = Number(item.preco?.valor ?? item.price ?? 0);
                const materiaPrima = Math.ceil(precoMercado / 3);
                const rules = window.RegrasManufatura;
                const cd = rules ? rules.cdFabricacao(item) : (precoMercado >= 100 ? 20 : 15);
                const tempo = rules ? rules.tempoFabricacao(item) : '1 semana';

                return `
                  <tr>
                    <td>
                      <strong style="color:#ffffff;font-size:0.92rem;">${esc(item.nome || item.name)}</strong>
                      ${item.espacos != null ? `<small style="color:var(--muted);display:block;">${item.espacos} espaço${item.espacos === 1 ? '' : 's'}</small>` : ''}
                    </td>
                    <td>
                      <span style="background:rgba(255,255,255,0.06);padding:3px 8px;border-radius:4px;font-size:0.78rem;text-transform:capitalize;">
                        ${esc(item.categoriaId || item.tipo || 'comum')}
                      </span>
                    </td>
                    <td class="price-market">T$ ${precoMercado.toLocaleString('pt-BR')}</td>
                    <td class="price-craft">T$ ${materiaPrima.toLocaleString('pt-BR')}</td>
                    <td>
                      <span style="color:#f59e0b;font-weight:700;">CD ${cd}</span>
                    </td>
                    <td>
                      <small style="color:var(--cream);">${esc(tempo)}</small>
                    </td>
                    <td>
                      <button type="button" class="recipe-action-btn" data-craft-action-id="${esc(item.id)}" data-raw-cost="${materiaPrima}" data-craft-cd="${cd}">
                        ${getIcon('hammer', 'icon-sm')} Fabricar
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    container.innerHTML = headerHtml + toolbarHtml + tableHtml;

    // Vincular busca
    const searchInp = document.getElementById('benchSearchInput');
    if (searchInp) {
      searchInp.addEventListener('input', e => {
        searchQuery = /** @type {HTMLInputElement} */ (e.target).value;
        renderCraftBench(divisionKey, hero);
      });
    }

    // Vincular subfiltros
    container.querySelectorAll('[data-subfilter]').forEach(btn => {
      btn.addEventListener('click', () => {
        subFilter = btn.getAttribute('data-subfilter') || 'todos';
        renderCraftBench(divisionKey, hero);
      });
    });

    // Vincular botões de fabricar itens
    container.querySelectorAll('[data-craft-action-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        const itemId = btn.getAttribute('data-craft-action-id');
        const cost = Number(btn.getAttribute('data-raw-cost') || 0);
        const cd = Number(btn.getAttribute('data-craft-cd') || 15);
        const item = items.find(it => it.id === itemId);
        if (!item) return;

        const currentFunds = obterFundosHeroi(hero);
        if (currentFunds < cost) {
          alert(`Saldo insuficiente! São necessários T$ ${cost.toLocaleString('pt-BR')} em matérias-primas e você possui T$ ${currentFunds.toLocaleString('pt-BR')}.`);
          return;
        }

        // Rola d20
        const d20 = Math.floor(Math.random() * 20) + 1;
        const total = d20 + bonus;
        const sucesso = total >= cd;

        // Debita custo
        debitarFundosHeroi(hero, cost);

        if (sucesso) {
          adicionarItemMochilaHeroi(hero, item);
        }

        // Atualiza cabeçalho do herói
        setupHeroHeader(hero);

        // Exibe modal com resultado do dado
        showCraftResultModal({
          sucesso,
          d20,
          bonus,
          total,
          cd,
          item,
          custo: cost
        });

        // Re-renderiza a bancada com saldo atualizado
        renderCraftBench(divisionKey, hero);
      });
    });
  }

  function setupHeroHeader(hero) {
    const topbarActions = document.getElementById('oficinaTopbarActions');
    if (!topbarActions || !hero) return;

    const heroName = hero.identity?.characterName || 'Herói';
    const clsId = hero.identity?.classId || 'Aventureiro';
    const clsName = clsId.charAt(0).toUpperCase() + clsId.slice(1);
    const level = hero.progression?.level || hero.identity?.plannedLevel || hero.step || 1;
    const funds = obterFundosHeroi(hero);
    const formattedFunds = `T$ ${funds.toLocaleString('pt-BR')}`;

    topbarActions.innerHTML = `
      <div class="hero-status-pill">
        <span class="hero-name">${esc(heroName)}</span>
        <span style="opacity:0.5">·</span>
        <span>${esc(clsName)} nv. ${level}</span>
        <span style="opacity:0.5">·</span>
        <span class="hero-funds">${getIcon('coin', 'icon-sm')} ${formattedFunds}</span>
      </div>
      <a class="nav-btn primary" href="ficha.html">
        <span>←</span> Voltar à Ficha
      </a>
    `;
  }

  function initOficina() {
    const urlParams = new URLSearchParams(window.location.search);
    const isCraftMode = urlParams.get('modo') === 'fabricar';
    const hero = getActiveHero();

    const banner = document.getElementById('oficinaBanner');
    const titleEl = document.getElementById('oficinaTitle');
    const leadEl = document.getElementById('oficinaLead');
    const nav = document.getElementById('divisionsNav');
    const container = document.getElementById('divisionContent');
    const toggleRulesBtn = document.getElementById('btnToggleFabricationRules');
    const rulesGrid = document.getElementById('rulesGrid');

    // Conectar alternância do botão Ver Regras de Fabricação
    if (toggleRulesBtn && rulesGrid) {
      // Garantir recolhido por padrão
      rulesGrid.hidden = true;
      rulesGrid.classList.add('is-hidden');
      toggleRulesBtn.textContent = 'Ver Regras de Fabricação';

      toggleRulesBtn.onclick = () => {
        const isHidden = rulesGrid.hidden;
        rulesGrid.hidden = !isHidden;
        rulesGrid.classList.toggle('is-hidden', !isHidden);
        toggleRulesBtn.textContent = isHidden ? 'Recolher Regras de Fabricação' : 'Ver Regras de Fabricação';
      };
    }

    // Renderiza TopBar Padronizada com status do herói e gaveta
    if (typeof window !== 'undefined' && window.ForjaTopBar) {
      window.ForjaTopBar.renderTopbar();
      window.ForjaTopBar.aplicarAutohideScroll();
    }

    if (!isCraftMode) {
      // ══════════════════════════════════════════════════════════════════════
      // MODO 1: ENCICLOPÉDIA (Acesso pelo menu lateral "Oficinas de Fabricação")
      // ══════════════════════════════════════════════════════════════════════
      if (titleEl) titleEl.textContent = 'Oficinas de Fabricação';
      if (leadEl) {
        leadEl.textContent = 'Consulte as regras canônicas de manufatura, cálculo de matérias-primas por ⅓ do preço, CDs de teste de Ofício e explore os itens oficiais de cada especialidade.';
      }

      // Renderizar as 17 oficinas canônicas em 4 colunas como LINKS CLICÁVEIS
      if (nav) {
        nav.innerHTML = Object.values(OFICINAS_METADATA).map(meta => `
          <a href="${meta.linkEnciclopedia}" class="division-tab" title="Explorar ${esc(meta.title)}">
            <span class="division-tab-icon">${getIcon(meta.icon, 'icon-md icon-gold')}</span>
            <span class="division-tab-title">${esc(meta.title)}</span>
            <small class="division-tab-sub">${esc(meta.subtitulo)}</small>
            <span class="division-tab-desc">${esc(meta.descricao)}</span>
          </a>
        `).join('');
      }

      // No modo enciclopédia geral, o painel de bancada fica limpo
      if (container) {
        container.innerHTML = '';
        container.style.display = 'none';
      }
    } else {
      // ══════════════════════════════════════════════════════════════════════
      // MODO 2: FABRICAR (?modo=fabricar, acesso pela mochila da ficha)
      // ══════════════════════════════════════════════════════════════════════
      setupHeroHeader(hero);

      if (banner) {
        const eyebrow = banner.querySelector('.oficina-eyebrow');
        if (eyebrow) {
          eyebrow.innerHTML = `${getIcon('hammer', 'icon-sm')} Bancadas de Fabricação do Herói · Tormenta 20`;
        }
      }
      if (titleEl) titleEl.textContent = 'Bancadas de Fabricação';
      if (leadEl) {
        leadEl.textContent = 'Selecione uma das suas especialidades treinadas para fabricar itens por ⅓ do preço em matérias-primas.';
      }

      const trainedList = obterOficiosHeroi(hero);

      if (trainedList.length === 0) {
        // Herói sem nenhum ofício treinado
        if (nav) {
          nav.innerHTML = `
            <div style="grid-column: 1 / -1; padding: 36px 24px; text-align: center; background: #181114; border: 1px solid var(--line); border-radius: 10px;">
              <h3 style="font-family:'Cinzel',serif;font-size:1.3rem;color:var(--gold);margin:0 0 10px;">
                Nenhuma Especialidade de Ofício Treinada
              </h3>
              <p style="color:var(--cream);font-size:0.92rem;margin:0 0 24px;max-width:620px;margin-inline:auto;line-height:1.5;">
                Seu aventureiro não possui treino em nenhum Ofício. Treine uma especialidade de Ofício na ficha de personagem ou evolua com as classes <strong>Inventor</strong> ou <strong>Alquimista</strong> para ter acesso às bancadas de fabricação e produzir itens por ⅓ do preço.
              </p>
              <div style="display:flex;justify-content:center;gap:14px;flex-wrap:wrap;">
                <a href="ficha.html" class="button primary" style="padding:9px 20px;text-decoration:none;font-weight:700;">
                  ← Voltar à Ficha
                </a>
                <a href="oficina.html" class="button" style="padding:9px 20px;text-decoration:none;">
                  Ver Todas as Oficinas (Enciclopédia) →
                </a>
              </div>
            </div>
          `;
        }
        if (container) {
          container.innerHTML = '';
          container.style.display = 'none';
        }
      } else {
        // Herói tem oficinas treinadas
        activeDivision = trainedList[0].norm;

        if (nav) {
          nav.innerHTML = trainedList.map(t => {
            const meta = OFICINAS_METADATA[t.norm] || {
              id: t.norm,
              title: `Oficina de ${t.nome}`,
              icon: 'tools',
              subtitulo: `Ofício (${t.nome})`,
              descricao: 'Manufatura e fabricação com matérias-primas por ⅓ do preço.'
            };

            return `
              <article class="division-tab ${activeDivision === meta.id ? 'active' : ''}" data-craft-division="${meta.id}">
                <span class="division-tab-dot-trained" title="Especialidade Treinada"></span>
                <span class="division-tab-icon">${getIcon(meta.icon, 'icon-md icon-gold')}</span>
                <span class="division-tab-title">${esc(meta.title)}</span>
                <small class="division-tab-sub">${esc(meta.subtitulo)}</small>
                <span class="division-tab-desc">${esc(meta.descricao)}</span>
                <button type="button" class="division-btn-craft" data-open-bench="${meta.id}">
                  ${getIcon('hammer', 'icon-sm')} Fabricar
                </button>
              </article>
            `;
          }).join('');

          function navegarParaOficina(divKey) {
            if (!divKey) return;
            window.location.href = 'loja.html?oficina=' + encodeURIComponent(divKey);
          }

          // Ouvir cliques para encaminhar para a página/janela de fabricação correspondente
          nav.querySelectorAll('[data-craft-division]').forEach(card => {
            card.addEventListener('click', () => {
              const divKey = card.getAttribute('data-craft-division');
              navegarParaOficina(divKey);
            });
          });

          const paramOficina = urlParams.get('oficina');
          if (paramOficina) {
            navegarParaOficina(paramOficina);
          }
        }

        // Em modo de seleção de bancadas do herói, ocultar lista inferior inicialmente se não houver oficina selecionada
        if (container && !urlParams.get('oficina')) {
          container.innerHTML = '';
          container.style.display = 'none';
        }

        // Injetar rodapé com atalhos de navegação
        if (!document.getElementById('oficinaHeroFooterBar')) {
          const footerBar = document.createElement('div');
          footerBar.id = 'oficinaHeroFooterBar';
          footerBar.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-top:32px;padding-top:20px;border-top:1px solid var(--line);flex-wrap:wrap;gap:12px;';
          footerBar.innerHTML = `
            <a href="ficha.html" class="button" style="text-decoration:none;padding:8px 18px;">
              ← Voltar à Ficha
            </a>
            <a href="oficina.html" class="button primary" style="text-decoration:none;padding:8px 18px;">
              Ver Compêndio de Todas as Oficinas (Enciclopédia) →
            </a>
          `;
          document.querySelector('.oficina-shell')?.appendChild(footerBar);
        }
      }
    }
  }

  // Inicialização
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initOficina);
    } else {
      initOficina();
    }
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('forja-ready', initOficina);
  }
})();
