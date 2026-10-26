(() => {
  'use strict';

  const ROSTER_KEY = 'forja-heroi-t20-personagens-v1';
  const ROSTER_FALLBACK_KEY = 'forja-roster-t20-v1';
  const ACTIVE_KEY = 'forja-heroi-t20-v1';

  function esc(str) {
    return String(str || '').replace(/[&<>"']/g, c => ({
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

  function getRoster() {
    try {
      const raw = localStorage.getItem(ROSTER_KEY) || localStorage.getItem(ROSTER_FALLBACK_KEY);
      const list = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) return [];
      // Regra obrigatória: colocar o nome do personagem é obrigatório sem isso não salva e pode apagar
      const valid = list.filter(item => {
        const name = String(item?.name || item?.snapshot?.identity?.characterName || '').trim();
        return name.length > 0;
      });
      if (valid.length !== list.length) {
        saveRoster(valid);
      }
      return valid;
    } catch {
      return [];
    }
  }

  function saveRoster(list) {
    try {
      const serialized = JSON.stringify(list);
      localStorage.setItem(ROSTER_KEY, serialized);
      localStorage.setItem(ROSTER_FALLBACK_KEY, serialized);
    } catch (e) {
      console.error('Erro ao salvar lista de heróis:', e);
    }
  }

  const RACE_CANONICAL_NAMES = {
    humano: 'Humano',
    anao: 'Anão',
    dahllan: 'Dahllan',
    elfo: 'Elfo',
    goblin: 'Goblin',
    lefou: 'Lefou',
    minotauro: 'Minotauro',
    qareen: 'Qareen',
    golem: 'Golem',
    golem_desperto: 'Golem Desperto',
    hynne: 'Hynne',
    kliren: 'Kliren',
    meduza: 'Meduza',
    medusa: 'Meduza',
    osteon: 'Osteon',
    sereia_tritao: 'Sereia / Tritão',
    sereia: 'Sereia / Tritão',
    tritao: 'Sereia / Tritão',
    silfide: 'Sílfide',
    suraggel: 'Suraggel',
    suraggel_aggelus: 'Suraggel (Aggelus)',
    suraggel_sulfure: 'Suraggel (Sulfure)',
    trog: 'Trog',
    trog_anao: 'Trog Anão',
    duende: 'Duende',
    eiradaan: 'Eiradaan',
    galokk: 'Galokk',
    meio_elfo: 'Meio-Elfo',
    satiro: 'Sátiro',
    meio_orc: 'Meio-Orc',
    orc: 'Orc',
    ogro: 'Ogro',
    tabrachi: 'Tabrachi',
    bugbear: 'Bugbear',
    centauro: 'Centauro',
    ceratops: 'Ceratops',
    pteros: 'Pteros',
    velocis: 'Velocis',
    voracis: 'Voracis',
    elfo_do_mar: 'Elfo-do-Mar',
    gnoll: 'Gnoll',
    tengu: 'Tengu',
    finntroll: 'Finntroll',
    harpia: 'Harpia',
    hobgoblin: 'Hobgoblin',
    kaijin: 'Kaijin',
    kallyanach: 'Kallyanach',
    kappa: 'Kappa',
    kobold: 'Kobolds',
    minauro: 'Minauro',
    moreau: 'Moreau',
    nagah: 'Nagah',
    nezumi: 'Nezumi',
    soterrado: 'Soterrado',
    yidishan: 'Yidishan'
  };

  const CLASS_CANONICAL_NAMES = {
    alquimista: 'Alquimista',
    arcanista: 'Arcanista',
    atleta: 'Atleta',
    barbaro: 'Bárbaro',
    bardo: 'Bardo',
    bucaneiro: 'Bucaneiro',
    burgues: 'Burguês',
    cacador: 'Caçador',
    cavaleiro: 'Cavaleiro',
    clerigo: 'Clérigo',
    druida: 'Druida',
    duelista: 'Duelista',
    ermitao: 'Ermitão',
    frade: 'Frade',
    guerreiro: 'Guerreiro',
    inovador: 'Inovador',
    inventor: 'Inventor',
    ladino: 'Ladino',
    lutador: 'Lutador',
    machado_de_pedra: 'Machado de Pedra',
    magimarcialista: 'Magimarcialista',
    miragem: 'Miragem',
    mistico: 'Místico',
    necromante: 'Necromante',
    nobre: 'Nobre',
    paladino: 'Paladino',
    samurai: 'Samurai',
    santo: 'Santo',
    seteiro: 'Seteiro',
    treinador: 'Treinador',
    usurpador: 'Usurpador',
    vassalo: 'Vassalo',
    ventanista: 'Ventanista'
  };

  const CLASS_ICON_NAMES = {
    arcanista: 'book',
    barbaro: 'sword',
    bardo: 'dice',
    bucaneiro: 'sword',
    cacador: 'crosshair',
    cavaleiro: 'shield',
    clerigo: 'shield',
    druida: 'flame',
    guerreiro: 'sword',
    inventor: 'wrench',
    ladino: 'dice',
    lutador: 'sword',
    nobre: 'shield',
    paladino: 'shield',
    samurai: 'sword'
  };

  const STEP_LABELS = {
    1: 'Identidade',
    2: 'Atributos',
    3: 'Origem',
    4: 'Perícias',
    5: 'Divindade',
    6: 'Poderes',
    7: 'Magias',
    8: 'Arsenal',
    9: 'Parceiros',
    10: 'Revisão'
  };

  function resolveRaceName(snap, isFinished) {
    const raceId = snap.identity?.raceId || snap.raceId || snap.race || '';
    if (!raceId) {
      return isFinished ? 'Humano' : 'Raça a definir';
    }
    const key = String(raceId).toLowerCase().trim();
    if (RACE_CANONICAL_NAMES[key]) return RACE_CANONICAL_NAMES[key];
    if (typeof window !== 'undefined' && window.DATA?.races) {
      const found = window.DATA.races.find(r => r.id === key || r.nome?.toLowerCase() === key);
      if (found?.nome) return found.nome;
    }
    return key.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  function resolveClassName(snap, isFinished) {
    if (Array.isArray(snap.progression) && snap.progression.length > 0) {
      const classIds = [...new Set(snap.progression.map(r => r.classId).filter(Boolean))];
      if (classIds.length > 0) {
        const names = classIds.map(cid => {
          const key = String(cid).toLowerCase().trim();
          if (CLASS_CANONICAL_NAMES[key]) return CLASS_CANONICAL_NAMES[key];
          if (typeof window !== 'undefined' && window.DATA?.classes) {
            const found = window.DATA.classes.find(c => c.id === key || c.nome?.toLowerCase() === key);
            if (found?.nome) return found.nome;
          }
          return key.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        });
        return names.join(' / ');
      }
    }

    const classId = snap.identity?.classId || snap.classId || '';
    if (!classId) {
      return isFinished ? 'Aventureiro' : 'Classe a definir';
    }
    const key = String(classId).toLowerCase().trim();
    if (CLASS_CANONICAL_NAMES[key]) return CLASS_CANONICAL_NAMES[key];
    if (typeof window !== 'undefined' && window.DATA?.classes) {
      const found = window.DATA.classes.find(c => c.id === key || c.nome?.toLowerCase() === key);
      if (found?.nome) return found.nome;
    }
    return key.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  function resolveDeity(snap) {
    if (snap.deity?.mode === 'devout' && snap.deity?.name) {
      return `Devoto de ${snap.deity.name}`;
    }
    if (snap.deity?.mode === 'pantheon') {
      return 'Devoto do Panteão';
    }
    if (snap.deityId) {
      return `Devoto de ${snap.deityId}`;
    }
    return '';
  }

  function resolveOrigin(snap) {
    if (snap.origin?.name) return snap.origin.name;
    const std = snap.origin?.standard;
    const reg = snap.origin?.regional;
    const parts = [std, reg].filter(Boolean);
    if (parts.length > 0) {
      return parts.map(p => String(p).replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())).join(' / ');
    }
    return '';
  }

  function getPendingCreationStep(snap) {
    const completed = Array.isArray(snap.completed) ? snap.completed.map(Number) : [];
    const currentStep = Number(snap.step);

    if (currentStep >= 1 && currentStep <= 9) {
      if (!completed.includes(currentStep)) {
        return currentStep;
      }
    }

    for (let s = 1; s <= 9; s++) {
      if (!completed.includes(s)) return s;
    }

    return (currentStep >= 1 && currentStep <= 9) ? currentStep : 1;
  }

  function getClassIconHtml(classId) {
    const key = String(classId || '').toLowerCase().trim();
    const iconName = CLASS_ICON_NAMES[key] || 'sword';
    return getIcon(iconName, 'icon-md icon-gold');
  }

  function renderRoster() {
    const grid = document.getElementById('rosterGrid');
    const countBadge = document.getElementById('rosterCountBadge');
    if (!grid) return;

    const roster = getRoster();
    if (countBadge) {
      countBadge.textContent = `${roster.length} ${roster.length === 1 ? 'herói salvo' : 'heróis salvos'}`;
    }

    if (roster.length === 0) {
      grid.innerHTML = `
        <div class="empty-roster-box">
          <div class="empty-icon" aria-hidden="true" style="color:#d97706">
            ${getIcon('sword', 'icon-xl')}
          </div>
          <h2 class="empty-title">Nenhum herói forjado ainda</h2>
          <p class="empty-desc">O Salão dos Heróis aguarda seus primeiros aventureiros. Comece sua jornada agora mesmo na forja!</p>
          <a class="nav-btn primary" href="criador.html?novo=true" style="padding:12px 28px;font-size:0.95rem;margin-top:8px;">
            ${getIcon('sword', 'icon-sm')}
            <span>Forjar Meu Primeiro Herói →</span>
          </a>
        </div>
      `;
      return;
    }

    grid.innerHTML = roster.map((item, index) => {
      const snap = item.snapshot || {};
      const id = item.id || `char-${index}`;
      const name = item.name || snap.identity?.characterName || 'Aventureiro Sem Nome';
      const isFinished = Boolean(item.finished || snap.finished);
      const isDraft = !isFinished;
      const race = resolveRaceName(snap, isFinished);
      const cls = resolveClassName(snap, isFinished);
      const lvl = snap.identity?.plannedLevel || snap.progression?.length || snap.level || 1;
      const deity = resolveDeity(snap);
      const origin = resolveOrigin(snap);
      const firstClassId = snap.progression?.[0]?.classId || snap.identity?.classId || snap.classId;
      const icon = getClassIconHtml(firstClassId);
      const pendingStep = isDraft ? getPendingCreationStep(snap) : 1;
      const pendingStepLabel = STEP_LABELS[pendingStep] || `Fase ${pendingStep}`;

      const attrSummary = snap.attributes
        ? Object.entries(snap.attributes)
            .map(([k, v]) => `${k.toUpperCase().slice(0, 3)}: <strong>${Number(v) >= 0 ? '+' + v : v}</strong>`)
            .join(' · ')
        : (snap.identity?.baseAttrs
            ? Object.entries(snap.identity.baseAttrs)
                .map(([k, v]) => `${k.toUpperCase().slice(0, 3)}: <strong>${Number(v) >= 0 ? '+' + v : v}</strong>`)
                .join(' · ')
            : '');

      return `
        <article class="hero-card${isDraft ? ' hero-card-draft' : ''}" data-hero-id="${esc(id)}" data-is-draft="${isDraft ? 'true' : 'false'}">
          <header class="hero-card-header">
            <div class="hero-card-identity">
              <div class="hero-avatar" aria-hidden="true">${icon}</div>
              <div class="hero-card-title-wrap">
                <h2 class="hero-name">${esc(name)}</h2>
                <div class="hero-meta">
                  ${isDraft
                    ? `<span class="hero-badge-draft">Em Criação · Fase ${pendingStep}: ${esc(pendingStepLabel)}</span>`
                    : `<span class="hero-badge-level">Nvl ${lvl}</span>`}
                  <span>${esc(race)} · ${esc(cls)}</span>
                  ${deity ? `<span class="hero-badge-deity">${esc(deity)}</span>` : ''}
                </div>
              </div>
            </div>
            <button class="hero-card-delete-btn" type="button" title="Apagar herói" data-action="delete" data-id="${esc(id)}" data-name="${esc(name)}">
              ${getIcon('trash', 'icon-sm')}
            </button>
          </header>

          <div class="hero-card-body">
            <div class="hero-summary-pills">
              ${origin ? `<span class="hero-pill">Origem: <strong>${esc(origin)}</strong></span>` : ''}
              ${snap.identity?.alignment ? `<span class="hero-pill">Tendência: <strong>${esc(snap.identity.alignment)}</strong></span>` : ''}
              ${attrSummary ? `<span class="hero-pill">${attrSummary}</span>` : ''}
            </div>
          </div>

          <footer class="hero-card-actions">
            ${isDraft ? `
              <button class="hero-action-btn resume" type="button" data-action="resume" data-id="${esc(id)}" data-step="${pendingStep}">
                ${getIcon('edit', 'icon-sm')}
                <span>Continuar Criação (Fase ${pendingStep}: ${esc(pendingStepLabel)})</span>
              </button>
            ` : `
              <button class="hero-action-btn open" type="button" data-action="open" data-id="${esc(id)}">
                ${getIcon('scroll', 'icon-sm')}
                <span>Abrir Ficha</span>
              </button>
              <button class="hero-action-btn edit" type="button" data-action="edit" data-id="${esc(id)}">
                ${getIcon('edit', 'icon-sm')}
                <span>Editar</span>
              </button>
            `}
          </footer>
        </article>
      `;
    }).join('');
  }

  // Interceptar cliques para criação respeitando o limite de 10 fichas
  document.addEventListener('click', event => {
    const createBtn = event.target.closest('a[href="criador.html?novo=true"]');
    if (createBtn) {
      if (typeof window.ForjaLimites !== 'undefined' && !window.ForjaLimites.podeCriarNovoPersonagem()) {
        event.preventDefault();
        window.ForjaLimites.abrirModalLimite();
        return;
      }
    }

    // Ação: Continuar Criação de ficha incompleta na etapa em que parou
    const resumeBtn = event.target.closest('[data-action="resume"]');
    if (resumeBtn) {
      const heroId = resumeBtn.dataset.id;
      const targetStep = Number(resumeBtn.dataset.step) || 1;
      const roster = getRoster();
      const hero = roster.find(h => h.id === heroId);
      if (hero && hero.snapshot) {
        try {
          const snapshot = JSON.parse(JSON.stringify(hero.snapshot));
          snapshot.finished = false;
          snapshot.isEditingFinishedSheet = false;
          snapshot.sheetView = 'creator';
          snapshot.step = targetStep;
          snapshot.completed = (snapshot.completed || []).filter(s => s < targetStep);
          localStorage.setItem(ACTIVE_KEY, JSON.stringify(snapshot));
        } catch (e) {
          console.warn('Erro ao carregar rascunho de herói:', e);
        }
      }
      window.location.href = 'criador.html';
      return;
    }

    const openBtn = event.target.closest('[data-action="open"]');
    if (openBtn) {
      const heroId = openBtn.dataset.id;
      const roster = getRoster();
      const hero = roster.find(h => h.id === heroId);
      if (hero && hero.snapshot) {
        const isFinished = Boolean(hero.finished || hero.snapshot.finished);
        if (!isFinished) {
          // Se for rascunho incompleto, NUNCA abre a ficha incompleta, redireciona para criador.html na fase pendente
          const pendingStep = getPendingCreationStep(hero.snapshot);
          const snapshot = JSON.parse(JSON.stringify(hero.snapshot));
          snapshot.finished = false;
          snapshot.isEditingFinishedSheet = false;
          snapshot.sheetView = 'creator';
          snapshot.step = pendingStep;
          snapshot.completed = (snapshot.completed || []).filter(s => s < pendingStep);
          localStorage.setItem(ACTIVE_KEY, JSON.stringify(snapshot));
          window.location.href = 'criador.html';
          return;
        }

        try {
          const snapshot = JSON.parse(JSON.stringify(hero.snapshot));
          snapshot.finished = true;
          snapshot.sheetView = 'sheet';
          localStorage.setItem(ACTIVE_KEY, JSON.stringify(snapshot));
        } catch (e) {
          console.warn('Erro ao carregar herói:', e);
        }
      }
      window.location.href = 'ficha.html';
      return;
    }

    const editBtn = event.target.closest('[data-action="edit"]');
    if (editBtn) {
      const heroId = editBtn.dataset.id;
      const roster = getRoster();
      const hero = roster.find(h => h.id === heroId);
      if (hero && hero.snapshot) {
        try {
          const snapshot = JSON.parse(JSON.stringify(hero.snapshot));
          snapshot.finished = false;
          snapshot.isEditingFinishedSheet = true;
          snapshot.sheetView = 'creator';
          snapshot.step = 1;
          localStorage.setItem(ACTIVE_KEY, JSON.stringify(snapshot));
        } catch (e) {
          console.warn('Erro ao editar herói:', e);
        }
      }
      window.location.href = 'criador.html';
      return;
    }

    const delBtn = event.target.closest('[data-action="delete"]');
    if (delBtn) {
      const heroId = delBtn.dataset.id;
      const heroName = delBtn.dataset.name || 'este aventureiro';
      openDeleteModal(heroId, heroName);
      return;
    }

    // Clique direto no card de rascunho direciona para a criação na fase pendente
    const draftCard = event.target.closest('.hero-card[data-is-draft="true"]');
    if (draftCard && !event.target.closest('button, a')) {
      const heroId = draftCard.dataset.heroId;
      const roster = getRoster();
      const hero = roster.find(h => h.id === heroId);
      if (hero && hero.snapshot) {
        const pendingStep = getPendingCreationStep(hero.snapshot);
        const snapshot = JSON.parse(JSON.stringify(hero.snapshot));
        snapshot.finished = false;
        snapshot.isEditingFinishedSheet = false;
        snapshot.sheetView = 'creator';
        snapshot.step = pendingStep;
        snapshot.completed = (snapshot.completed || []).filter(s => s < pendingStep);
        localStorage.setItem(ACTIVE_KEY, JSON.stringify(snapshot));
        window.location.href = 'criador.html';
      }
    }
  });

  let activeDeleteHeroId = null;

  function ensureDeleteModal() {
    let modal = document.getElementById('deleteConfirmModal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'deleteConfirmModal';
    modal.className = 'modal-backdrop';
    modal.hidden = true;
    modal.innerHTML = `
      <div class="confirm-box" role="dialog" aria-modal="true" aria-labelledby="delModalTitle">
        <header class="confirm-box-header">
          <span style="color:#ef4444">${getIcon('trash', 'icon-md')}</span>
          <h3 id="delModalTitle">Excluir Personagem</h3>
        </header>
        <div class="confirm-box-body">
          <p>Tem certeza de que deseja apagar <strong id="delHeroNameSpan">este herói</strong> do Salão dos Heróis?</p>
          <p style="margin-top:8px;font-size:0.84rem;color:#e5b4b8;">Esta ação removerá a ficha permanentemente deste navegador.</p>
        </div>
        <footer class="confirm-box-actions">
          <button class="btn-cancel" type="button" id="delCancelBtn">Cancelar</button>
          <button class="btn-danger" type="button" id="delConfirmBtn">Apagar Herói</button>
        </footer>
      </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', e => {
      if (e.target === modal || e.target.id === 'delCancelBtn') {
        closeDeleteModal();
      } else if (e.target.id === 'delConfirmBtn') {
        if (activeDeleteHeroId) {
          const roster = getRoster().filter(h => h.id !== activeDeleteHeroId);
          saveRoster(roster);
          renderRoster();
        }
        closeDeleteModal();
      }
    });

    return modal;
  }

  function openDeleteModal(heroId, heroName) {
    activeDeleteHeroId = heroId;
    const modal = ensureDeleteModal();
    const nameSpan = modal.querySelector('#delHeroNameSpan');
    if (nameSpan) nameSpan.textContent = `"${heroName}"`;
    modal.hidden = false;
    modal.style.display = 'flex';
  }

  function closeDeleteModal() {
    activeDeleteHeroId = null;
    const modal = document.getElementById('deleteConfirmModal');
    if (modal) {
      modal.hidden = true;
      modal.style.display = 'none';
    }
  }

  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeDeleteModal();
  });

  // Inicialização
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderRoster);
  } else {
    renderRoster();
  }
})();
