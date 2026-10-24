/**
 * FORJA RUBRA: Gerenciador e Modal Interativo de Condições de Tormenta 20
 * Permite buscar, filtrar por categoria, expandir regras completas e adicionar/remover condições.
 */
(() => {
  'use strict';

  const CORES_CATEGORIAS = {
    metabolismo: '#ef4444', // vermelho
    medo: '#6c87d9',        // azul marinho escuro
    movimento: '#eab308',   // amarelo
    sentidos: '#64748b',    // cinza
    geral: '#ea580c',       // laranja
    cansaco: '#a69a8a',     // preto
    mental: '#8b5cf6',
    veneno: '#22c55e',
    metamorfose: '#ec4899'
  };

  const CONDICOES_FALLBACK = [
    { id: 'abalado', nome: 'Abalado', categoria: 'medo', cor: '#1e3a8a', resumo: '-2 em testes de perícia', descricao: 'O personagem sofre -2 em testes de perícia. Se ficar abalado novamente, em vez disso fica apavorado.', efeitosImediatos: ['Apavorado'] },
    { id: 'agarrado', nome: 'Agarrado', categoria: 'movimento', cor: '#eab308', resumo: 'Desprevenido, imóvel, -2 em ataques', descricao: 'O personagem fica desprevenido e imóvel, sofre -2 em testes de ataque e só pode atacar com armas leves. Ataques à distância contra um alvo envolvido em uma manobra agarrar têm 50% de chance de acertar o alvo errado.', efeitosImediatos: ['Desprevenido', 'Imóvel'] },
    { id: 'alquebrado', nome: 'Alquebrado', categoria: 'mental', cor: '#8b5cf6', resumo: 'Custo de habilidades +1 PM', descricao: 'O custo em pontos de mana das habilidades do personagem aumenta em +1.', efeitosImediatos: [] },
    { id: 'apavorado', nome: 'Apavorado', categoria: 'medo', cor: '#1e3a8a', resumo: '-5 em testes de perícia; foge da fonte do medo', descricao: 'O personagem sofre -5 em testes de perícia e não pode se aproximar voluntariamente da fonte do medo.', efeitosImediatos: ['Desprevenido', 'Imóvel'] },
    { id: 'atordoado', nome: 'Atordoado', categoria: 'mental', cor: '#8b5cf6', resumo: 'Desprevenido; não pode agir', descricao: 'O personagem fica desprevenido e não pode fazer ações.', efeitosImediatos: ['Desprevenido'] },
    { id: 'caido', nome: 'Caído', categoria: 'movimento', cor: '#eab308', resumo: '-5 ataque CaC e Defesa; deslocamento 1,5m', descricao: 'O personagem sofre -5 na Defesa contra ataques corpo a corpo e recebe +5 na Defesa contra ataques à distância. Além disso, sofre -5 em ataques corpo a corpo e seu deslocamento é reduzido a 1,5m.', efeitosImediatos: [] },
    { id: 'cego', nome: 'Cego', categoria: 'sentidos', cor: '#64748b', resumo: 'Desprevenido, lento; -5 em perícias FOR/DES', descricao: 'O personagem fica desprevenido e lento, não pode fazer testes de Percepção para observar e sofre -5 em testes de perícias baseadas em Força ou Destreza. Todos os alvos de seus ataques recebem camuflagem total.', efeitosImediatos: ['Desprevenido', 'Lento'] },
    { id: 'confuso', nome: 'Confuso', categoria: 'mental', cor: '#8b5cf6', resumo: 'Comportamento aleatório (1d6/turno)', descricao: 'O personagem comporta-se de modo aleatório. Role 1d6 no início de seus turnos: 1) Movimenta-se em uma direção aleatória; 2-3) Não pode fazer ações, balbucia; 4-5) Ataca a criatura mais próxima; 6) A condição termina.', efeitosImediatos: [] },
    { id: 'debilitado', nome: 'Debilitado', categoria: 'geral', cor: '#ea580c', resumo: '-5 em FOR, DES e CON', descricao: 'O personagem sofre -5 em testes de Força, Destreza e Constituição e de perícias baseadas nesses atributos. Se ficar debilitado novamente, em vez disso fica inconsciente.', efeitosImediatos: ['Inconsciente'] },
    { id: 'desprevenido', nome: 'Desprevenido', categoria: 'geral', cor: '#ea580c', resumo: '-5 na Defesa e em Reflexos', descricao: 'O personagem sofre -5 na Defesa e em Reflexos. Você fica desprevenido contra inimigos que não possa perceber.', efeitosImediatos: [] },
    { id: 'doente', nome: 'Doente', categoria: 'metabolismo', cor: '#ef4444', resumo: 'Sob efeito de uma doença', descricao: 'O personagem está sob efeito de uma doença. O efeito específico varia com a enfermidade contraída.', efeitosImediatos: [] },
    { id: 'em_chamas', nome: 'Em Chamas', categoria: 'metabolismo', cor: '#ef4444', resumo: '1d6 dano de fogo por turno', descricao: 'O personagem está pegando fogo. No início de seus turnos, sofre 1d6 pontos de dano de fogo. O personagem pode gastar uma ação padrão para apagar as chamas.', efeitosImediatos: [] },
    { id: 'enfeiticado', nome: 'Enfeitiçado', categoria: 'mental', cor: '#8b5cf6', resumo: '+10 Diplomacia da fonte; percepção favorável', descricao: 'O personagem se torna prestativo em relação à fonte da condição. Ele não luta pela fonte, mas a enxerga como um amigo querido e digno de confiança.', efeitosImediatos: [] },
    { id: 'enjoado', nome: 'Enjoado', categoria: 'metabolismo', cor: '#ef4444', resumo: 'Só 1 ação por rodada', descricao: 'O personagem só pode realizar uma ação padrão ou de movimento por rodada (não ambas).', efeitosImediatos: [] },
    { id: 'enredado', nome: 'Enredado', categoria: 'movimento', cor: '#eab308', resumo: 'Lento, vulnerável, -2 em ataques', descricao: 'O personagem fica lento, vulnerável e sofre -2 em testes de ataque.', efeitosImediatos: ['Vulnerável', 'Lento'] },
    { id: 'envenenado', nome: 'Envenenado', categoria: 'veneno', cor: '#10b981', resumo: 'Efeito varia por veneno', descricao: 'O personagem está sob efeito de uma toxina. O efeito específico varia com o veneno utilizado.', efeitosImediatos: ['Enjoado', 'Fraco'] },
    { id: 'esmorecido', nome: 'Esmorecido', categoria: 'mental', cor: '#8b5cf6', resumo: '-5 em INT, SAB e CAR', descricao: 'O personagem sofre -5 em testes de Inteligência, Sabedoria e Carisma e de perícias baseadas nesses atributos.', efeitosImediatos: [] },
    { id: 'exausto', nome: 'Exausto', categoria: 'cansaco', cor: '#18181b', resumo: 'Debilitado, lento e vulnerável', descricao: 'O personagem fica debilitado, lento e vulnerável.', efeitosImediatos: ['Debilitado', 'Vulnerável', 'Lento'] },
    { id: 'fascinado', nome: 'Fascinado', categoria: 'mental', cor: '#8b5cf6', resumo: 'Atenção presa; -5 Percepção; não age', descricao: 'Com a atenção presa. Sofre -5 em Percepção e não pode fazer ações, exceto observar aquilo que o fascinou.', efeitosImediatos: [] },
    { id: 'fatigado', nome: 'Fatigado', categoria: 'cansaco', cor: '#18181b', resumo: 'Fraco e vulnerável', descricao: 'O personagem fica fraco e vulnerável.', efeitosImediatos: ['Vulnerável', 'Fraco'] },
    { id: 'fraco', nome: 'Fraco', categoria: 'geral', cor: '#ea580c', resumo: '-2 em FOR, DES e CON', descricao: 'O personagem sofre -2 em testes de Força, Destreza e Constituição e de perícias baseadas nesses atributos.', efeitosImediatos: ['Debilitado'] },
    { id: 'frustrado', nome: 'Frustrado', categoria: 'mental', cor: '#8b5cf6', resumo: '-2 em INT, SAB e CAR', descricao: 'O personagem sofre -2 em testes de Inteligência, Sabedoria e Carisma e de perícias baseadas nesses atributos.', efeitosImediatos: ['Esmorecido'] },
    { id: 'imovel', nome: 'Imóvel', categoria: 'movimento', cor: '#eab308', resumo: 'Deslocamento 0m', descricao: 'Todas as formas de deslocamento do personagem são reduzidas a 0m.', efeitosImediatos: [] },
    { id: 'inconsciente', nome: 'Inconsciente', categoria: 'geral', cor: '#ea580c', resumo: 'Indefeso; não pode agir', descricao: 'O personagem fica indefeso e não pode fazer ações, incluindo reações (mas ainda pode fazer testes naturalmente feitos quando inconsciente).', efeitosImediatos: ['Indefeso'] },
    { id: 'indefeso', nome: 'Indefeso', categoria: 'geral', cor: '#ea580c', resumo: 'Desprevenido; -10 Defesa; falha Reflexos', descricao: 'O personagem fica desprevenido, sofre -10 na Defesa, falha automaticamente em testes de Reflexos e pode sofrer golpes de misericórdia.', efeitosImediatos: ['Desprevenido'] },
    { id: 'lento', nome: 'Lento', categoria: 'movimento', cor: '#eab308', resumo: 'Deslocamento pela metade; sem correr', descricao: 'Todas as formas de deslocamento do personagem são reduzidas à metade e ele não pode correr ou fazer investidas.', efeitosImediatos: [] },
    { id: 'ofuscado', nome: 'Ofuscado', categoria: 'sentidos', cor: '#64748b', resumo: '-2 em ataques e Percepção', descricao: 'O personagem sofre -2 em testes de ataque e de Percepção.', efeitosImediatos: [] },
    { id: 'paralisado', nome: 'Paralisado', categoria: 'movimento', cor: '#eab308', resumo: 'Imóvel e indefeso; só ações mentais', descricao: 'Fica imóvel e indefeso e só pode realizar ações puramente mentais.', efeitosImediatos: ['Indefeso', 'Imóvel'] },
    { id: 'pasmo', nome: 'Pasmo', categoria: 'mental', cor: '#8b5cf6', resumo: 'Não pode agir', descricao: 'O personagem não pode fazer ações.', efeitosImediatos: [] },
    { id: 'petrificado', nome: 'Petrificado', categoria: 'metamorfose', cor: '#ec4899', resumo: 'Inconsciente; RD 8', descricao: 'O personagem fica inconsciente e recebe redução de dano 8.', efeitosImediatos: ['Inconsciente'] },
    { id: 'sangrando', nome: 'Sangrando', categoria: 'metabolismo', cor: '#ef4444', resumo: 'Teste CON (CD 15) ou 1d6 PV/turno', descricao: 'No início de seu turno, o personagem deve fazer um teste de Constituição (CD 15). Se falhar, perde 1d6 pontos de vida e continua sangrando. Se passar, remove essa condição.', efeitosImediatos: [] },
    { id: 'sobrecarregado', nome: 'Sobrecarregado', categoria: 'movimento', cor: '#eab308', resumo: 'Penalidade -5; deslocamento -3m', descricao: 'O personagem sofre penalidade de armadura -5 e seu deslocamento é reduzido em -3m.', efeitosImediatos: [] },
    { id: 'surdo', nome: 'Surdo', categoria: 'sentidos', cor: '#64748b', resumo: '-5 Iniciativa; ruim p/ magias', descricao: 'O personagem não pode fazer testes de Percepção para ouvir e sofre -5 em testes de Iniciativa. Além disso, é considerado em condição ruim para lançar magias.', efeitosImediatos: [] },
    { id: 'surpreendido', nome: 'Surpreendido', categoria: 'geral', cor: '#ea580c', resumo: 'Desprevenido; não pode agir', descricao: 'O personagem fica desprevenido e não pode fazer ações.', efeitosImediatos: ['Desprevenido'] },
    { id: 'vulneravel', nome: 'Vulnerável', categoria: 'geral', cor: '#ea580c', resumo: '-2 na Defesa', descricao: 'O personagem sofre -2 na Defesa.', efeitosImediatos: [] }
  ];

  const CATEGORIAS = [
    { id: 'todas', label: 'Todas' },
    { id: 'medo', label: 'Medo' },
    { id: 'movimento', label: 'Movimento' },
    { id: 'mental', label: 'Mental' },
    { id: 'sentidos', label: 'Sentidos' },
    { id: 'geral', label: 'Geral' },
    { id: 'metabolismo', label: 'Metabolismo' },
    { id: 'veneno', label: 'Veneno' },
    { id: 'cansaco', label: 'Cansaço' },
    { id: 'metamorfose', label: 'Metamorfose' }
  ];

  let currentCategory = 'todas';
  let currentSearch = '';
  const expandedConditions = new Set();
  let selectedConditionId=null;

  function obterCatalogoCondicoes() {
    if (typeof window !== 'undefined' && window.__FORJA_DATA__?.['DATA.detailedConditions']) {
      return window.__FORJA_DATA__['DATA.detailedConditions'];
    }
    return CONDICOES_FALLBACK;
  }

  function obterCondicoesAtivas() {
    if (typeof state === 'undefined' || !state) return [];
    state.sheetNotes = state.sheetNotes || {};
    if (!Array.isArray(state.sheetNotes.activeConditions)) {
      // Migração inicial dos conditionSlots legados
      const slots = Array.isArray(state.sheetNotes.conditionSlots) ? state.sheetNotes.conditionSlots.filter(Boolean) : [];
      state.sheetNotes.activeConditions = [...new Set(slots)];
    }
    return state.sheetNotes.activeConditions;
  }

  function sincronizarConditionSlots() {
    if (typeof state === 'undefined' || !state) return;
    state.sheetNotes = state.sheetNotes || {};
    const active = state.sheetNotes.activeConditions || [];
    state.sheetNotes.conditionSlots = Array(4).fill('');
    for (let i = 0; i < Math.min(4, active.length); i++) {
      state.sheetNotes.conditionSlots[i] = active[i];
    }
  }

  function alternarCondicao(nome) {
    if (typeof state === 'undefined' || !state) return;
    state.sheetNotes = state.sheetNotes || {};
    state.sheetNotes.activeConditions = state.sheetNotes.activeConditions || [];
    const index = state.sheetNotes.activeConditions.indexOf(nome);
    if (index >= 0) {
      state.sheetNotes.activeConditions.splice(index, 1);
      if (typeof toast === 'function') toast(`Condição "${nome}" removida.`);
    } else {
      state.sheetNotes.activeConditions.push(nome);
      if (typeof toast === 'function') toast(`Condição "${nome}" ativada.`);
    }
    sincronizarConditionSlots();
    if (typeof persistNow === 'function') persistNow();
    if (typeof renderStage === 'function') renderStage();
    renderListaCondicoesModal();
  }

  function removerCondicaoAtiva(nome) {
    if (typeof state === 'undefined' || !state) return;
    state.sheetNotes = state.sheetNotes || {};
    state.sheetNotes.activeConditions = state.sheetNotes.activeConditions || [];
    const index = state.sheetNotes.activeConditions.indexOf(nome);
    if (index >= 0) {
      state.sheetNotes.activeConditions.splice(index, 1);
      sincronizarConditionSlots();
      if (typeof persistNow === 'function') persistNow();
      if (typeof renderStage === 'function') renderStage();
      if (typeof toast === 'function') toast(`Condição "${nome}" removida.`);
    }
  }

  function iconeCondicao(id) {
    const g = typeof window !== 'undefined' ? window : globalThis;
    const fn = typeof g.tracosCondicao === 'function' ? g.tracosCondicao : null;
    return fn ? fn(id) : '';
  }

  function encontrarCondicao(catalog, nome) {
    const norm = String(nome).trim().toLowerCase();
    return catalog.find((c) => c.nome.toLowerCase() === norm || c.id.toLowerCase() === norm.replace(/[\s-]/g, '_'));
  }

  function renderDetalheCondicao(cond, catalog, active) {
    if (!cond) {
      return '<p class="condition-detail-empty">Selecione uma condição para ver suas regras.</p>';
    }
    const cor = CORES_CATEGORIAS[cond.categoria] || '#e9ad59';
    const isActive = active.has(cond.nome);
    const efeitos = (cond.efeitosImediatos || []).map((nomeRel) => {
      const rel = encontrarCondicao(catalog, nomeRel);
      return `<p class="cond-card-ref"><strong>${rel ? rel.nome : nomeRel}:</strong> ${rel ? rel.descricao : ''}</p>`;
    }).join('');
    const paths = (c) => iconeCondicao(c.id || c);
    const subEffectsHtml = efeitos ? `<div class="condition-sub-effects"><div class="cond-card-subtitle">Efeitos imediatos</div>${efeitos}</div>` : '';
    return `
      <div class="condition-detail-head" style="--condition-color:${cor}">
        <svg class="condition-detail-icon" viewBox="0 0 24 24" aria-hidden="true">${paths(cond)}</svg>
        <strong class="condition-detail-name">${cond.nome}</strong>
      </div>
      <p class="condition-detail-text">${cond.descricao}</p>
      ${subEffectsHtml}
      <button type="button" class="condition-toggle-btn ${isActive ? 'is-active' : ''}" data-toggle-condition="${cond.nome}">${isActive ? 'Remover' : 'Adicionar'}</button>
    `;
  }

  function renderListaCondicoesModal() {
    const listEl = document.getElementById('forjaConditionsList');
    if (!listEl) return;

    const catalog = obterCatalogoCondicoes();
    const active = new Set(obterCondicoesAtivas());
    const term = currentSearch.trim().toLowerCase();

    const filtered = catalog.filter((cond) => {
      const matchCat = currentCategory === 'todas' || cond.categoria === currentCategory;
      const matchSearch = !term || cond.nome.toLowerCase().includes(term) || (cond.resumo && cond.resumo.toLowerCase().includes(term)) || cond.descricao.toLowerCase().includes(term);
      return matchCat && matchSearch;
    });

    if (!filtered.some((c) => c.id === selectedConditionId)) {
      selectedConditionId = filtered[0]?.id || null;
    }
    const selected = filtered.find((c) => c.id === selectedConditionId) || catalog.find((c) => c.id === selectedConditionId) || null;

    const grid = filtered.length
      ? filtered.map((cond) => {
          const cor = CORES_CATEGORIAS[cond.categoria] || '#dfb666';
          const isSel = cond.id === selectedConditionId;
          return `<button type="button" class="condition-select ${isSel ? 'selected' : ''} ${active.has(cond.nome) ? 'is-active' : ''}" style="--condition-color:${cor}" data-select-condition="${cond.id}" aria-pressed="${isSel}"><svg viewBox="0 0 24 24" aria-hidden="true">${iconeCondicao(cond.id)}</svg><span>${cond.nome}</span></button>`;
        }).join('')
      : '<p class="condition-detail-empty">Nenhuma condição encontrada para o filtro.</p>';

    listEl.innerHTML = `
      <div class="conditions-grid">${grid}</div>
      <aside class="condition-detail-panel">${renderDetalheCondicao(selected, catalog, active)}</aside>
    `;
  }

  function ensureConditionsModal() {
    let backdrop = document.getElementById('forjaConditionsModalBackdrop');
    if (backdrop) return backdrop;

    backdrop = document.createElement('div');
    backdrop.id = 'forjaConditionsModalBackdrop';
    backdrop.className = 'modal-backdrop';
    backdrop.style.zIndex = '999990';
    backdrop.hidden = true;

    backdrop.innerHTML = `
      <section class="conditions-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="conditionsModalTitle">
        <header class="conditions-modal-header">
          <div style="display:flex;align-items:center;gap:8px;">
            <h3 class="conditions-modal-title" id="conditionsModalTitle">Condições & Efeitos de Combate</h3>
          </div>
          <button class="conditions-modal-close" id="conditionsCloseXBtn" type="button" data-condition-close title="Fechar">✕</button>
        </header>

        <div class="conditions-search-bar">
          <input class="conditions-search-input" id="conditionsSearchInput" type="text" placeholder="Buscar condição (ex: Abalado, Cego, Caído, -2)..." />
        </div>

        <nav class="conditions-pills-bar" id="conditionsPillsBar" aria-label="Filtro de categorias de condições">
          ${CATEGORIAS.map((cat) => `
            <button class="conditions-pill ${cat.id === 'todas' ? 'active' : ''}" type="button" style="--condition-color:${CORES_CATEGORIAS[cat.id]||'#dfb666'}" data-cond-cat="${cat.id}">
              ${cat.label}
            </button>
          `).join('')}
        </nav>

        <div class="conditions-list-wrap" id="forjaConditionsList">
          <!-- Inserido dinamicamente -->
        </div>
      </section>
    `;

    document.body.appendChild(backdrop);

    // Eventos de fechamento infalíveis
    const fechar = () => {
      backdrop.hidden = true;
      backdrop.style.display = 'none';
    };

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop || e.target.closest('#conditionsCloseXBtn, [data-condition-close]')) {
        fechar();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !backdrop.hidden) {
        fechar();
      }
    });

    // Busca
    const searchInput = backdrop.querySelector('#conditionsSearchInput');
    searchInput?.addEventListener('input', (e) => {
      currentSearch = e.target.value;
      renderListaCondicoesModal();
    });

    // Pílulas
    backdrop.querySelector('#conditionsPillsBar')?.addEventListener('click', (e) => {
      const pill = e.target.closest('[data-cond-cat]');
      if (!pill) return;
      currentCategory = pill.dataset.condCat;
      backdrop.querySelectorAll('.conditions-pill').forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      renderListaCondicoesModal();
    });

    // Ações de lista (expandir e alternar condição)
    backdrop.querySelector('#forjaConditionsList')?.addEventListener('click', (e) => {
      const select=e.target.closest('[data-select-condition]');
      if(select){selectedConditionId=select.dataset.selectCondition;renderListaCondicoesModal();return;}
      const toggleBtn = e.target.closest('[data-toggle-condition]');
      if (toggleBtn) {
        alternarCondicao(toggleBtn.dataset.toggleCondition);
        return;
      }
      const expandBtn = e.target.closest('[data-expand-condition]');
      if (expandBtn) {
        const id = expandBtn.dataset.expandCondition;
        if (expandedConditions.has(id)) expandedConditions.delete(id);
        else expandedConditions.add(id);
        renderListaCondicoesModal();
      }
    });

    return backdrop;
  }

  function abrirModalCondicoes() {
    if (window.parent && window.parent !== window) {
      try {
        if (typeof (window.parent as any).ForjaCondicoes?.abrirModal === 'function') {
          (window.parent as any).ForjaCondicoes.abrirModal();
          return;
        }
      } catch (_) {}
      try {
        window.parent.postMessage({ channel: 'forja-t20-grimoire-v1', type: 'open-conditions' }, '*');
        return;
      } catch (_) {}
    }

    const backdrop = ensureConditionsModal();
    currentSearch = '';
    const searchInput = backdrop.querySelector('#conditionsSearchInput') as HTMLInputElement | null;
    if (searchInput) searchInput.value = '';
    renderListaCondicoesModal();
    backdrop.hidden = false;
    backdrop.style.display = 'grid';
    setTimeout(() => searchInput?.focus(), 50);
  }

  function renderSheetConditionsLine() {
    return `
      <div class="sheet-conditions-line">
        <button class="sheet-add-condition-btn" id="openConditionsModalBtn" type="button" data-action="open-conditions" title="Adicionar Condição">+</button>
      </div>
    `;
  }

  // Delegação global de cliques para abrir modal ou remover condições da ficha
  document.addEventListener('click', (e) => {
    const openBtn = e.target.closest('#openConditionsModalBtn, [data-action="open-conditions"]');
    if (openBtn) {
      e.preventDefault();
      abrirModalCondicoes();
      return;
    }
    const removeBtn = e.target.closest('[data-remove-condition]');
    if (removeBtn) {
      e.preventDefault();
      removerCondicaoAtiva(removeBtn.dataset.removeCondition);
    }
  });

  window.ForjaCondicoes = Object.freeze({
    obterCatalogo: obterCatalogoCondicoes,
    obterAtivas: obterCondicoesAtivas,
    alternar: alternarCondicao,
    remover: removerCondicaoAtiva,
    abrirModal: abrirModalCondicoes,
    renderLine: renderSheetConditionsLine
  });
})();
