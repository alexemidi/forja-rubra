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
      return Array.isArray(list) ? list : [];
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
      const race = snap.raceId || 'Raça Indefinida';
      const cls = snap.classId || 'Classe Indefinida';
      const lvl = snap.identity?.plannedLevel || snap.progression?.length || snap.level || 1;
      const deity = snap.deityId ? `Devoto de ${snap.deityId}` : '';
      const icon = getClassIconHtml(snap.classId);

      const attrSummary = snap.attributes
        ? Object.entries(snap.attributes)
            .map(([k, v]) => `${k.toUpperCase().slice(0, 3)}: <strong>${v >= 0 ? '+' + v : v}</strong>`)
            .join(' · ')
        : '';

      return `
        <article class="hero-card" data-hero-id="${esc(id)}">
          <header class="hero-card-header">
            <div class="hero-card-identity">
              <div class="hero-avatar" aria-hidden="true">${icon}</div>
              <div class="hero-card-title-wrap">
                <h2 class="hero-name">${esc(name)}</h2>
                <div class="hero-meta">
                  <span class="hero-badge-level">Nvl ${lvl}</span>
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
              ${snap.origin?.name ? `<span class="hero-pill">Origem: <strong>${esc(snap.origin.name)}</strong></span>` : ''}
              ${snap.identity?.alignment ? `<span class="hero-pill">Tendência: <strong>${esc(snap.identity.alignment)}</strong></span>` : ''}
              ${attrSummary ? `<span class="hero-pill">${attrSummary}</span>` : ''}
            </div>
          </div>

          <footer class="hero-card-actions">
            <button class="hero-action-btn open" type="button" data-action="open" data-id="${esc(id)}">
              ${getIcon('scroll', 'icon-sm')}
              <span>Abrir Ficha</span>
            </button>
            <button class="hero-action-btn edit" type="button" data-action="edit" data-id="${esc(id)}">
              ${getIcon('edit', 'icon-sm')}
              <span>Editar</span>
            </button>
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

    const openBtn = event.target.closest('[data-action="open"]');
    if (openBtn) {
      const heroId = openBtn.dataset.id;
      const roster = getRoster();
      const hero = roster.find(h => h.id === heroId);
      if (hero && hero.snapshot) {
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
