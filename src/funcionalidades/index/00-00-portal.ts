(() => {
  'use strict';

  // Animação e rastreamento do Olho de Tormenta
  const portal = document.querySelector('#eyePortal');
  const globe = document.querySelector('.tormenta-eye-wrap');
  const iris = document.querySelector('.gaze-iris');
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)');

  if (portal && globe && iris) {
    addEventListener('pointermove', event => {
      if (reduced && reduced.matches) return;
      const box = portal.getBoundingClientRect();
      if (!box.width || !box.height) return;
      const x = Math.max(-1, Math.min(1, (event.clientX - (box.left + box.width / 2)) / (box.width / 2)));
      const y = Math.max(-1, Math.min(1, (event.clientY - (box.top + box.height / 2)) / (box.height / 2)));
      iris.style.transform = `translate(${x * 15}px,${y * 10}px)`;
      globe.style.setProperty('--shade-x', `${50 - x * 8}%`);
      globe.style.setProperty('--shade-y', `${50 - y * 6}%`);
      portal.style.setProperty('--awake', Math.max(0, 1 - Math.hypot(x, y) * 0.5).toFixed(2));
    });
  }

  // Modal do Portal do Aventureiro
  const modal = document.getElementById('forgePortalModal');
  const enterBtn = document.getElementById('enterForgeBtn');
  const closeBtn = document.getElementById('closePortalBtn');
  const rosterList = document.getElementById('portalRosterList');
  const rosterCount = document.getElementById('rosterCountBadge');
  const activeHeroSummary = document.getElementById('activeHeroSummary');

  if (!modal) return;

  function esc(str) {
    return String(str || '').replace(/[&<>"']/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c]));
  }

  function getActiveHero() {
    try {
      const raw = localStorage.getItem('forja-heroi-t20-v1');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function getRoster() {
    try {
      const raw = localStorage.getItem('forja-heroi-t20-personagens-v1') || localStorage.getItem('forja-roster-t20-v1');
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  function saveRoster(list) {
    try {
      const serialized = JSON.stringify(list);
      localStorage.setItem('forja-heroi-t20-personagens-v1', serialized);
      localStorage.setItem('forja-roster-t20-v1', serialized);
    } catch (e) {
      console.error('Erro ao atualizar lista de heróis:', e);
    }
  }

  const CLASS_ICONS = {
    arcanista: 'book',
    barbaro: 'axe',
    bardo: 'music',
    bucaneiro: 'sword',
    cacador: 'bow',
    cavaleiro: 'shield',
    clerigo: 'sparkles',
    druida: 'paw',
    guerreiro: 'sword',
    inventor: 'wrench',
    ladino: 'dice',
    lutador: 'fist',
    nobre: 'crown',
    paladino: 'shield',
    samurai: 'sword'
  };

  function getClassIcon(classId) {
    if (!classId) return window.IconesForja ? window.IconesForja.get('user', 'icon-md icon-gold') : '';
    const key = String(classId).toLowerCase().trim();
    const iconName = CLASS_ICONS[key] || 'sword';
    return window.IconesForja ? window.IconesForja.get(iconName, 'icon-md icon-gold') : '';
  }

  function updateLandingDirectElements() {
    const roster = getRoster();
    const hero = getActiveHero();

    // Atualiza contador do botão Meus Personagens
    const rosterCountEl = document.getElementById('landingRosterCount');
    if (rosterCountEl) {
      rosterCountEl.textContent = roster.length ? `${roster.length} ${roster.length === 1 ? 'herói salvo' : 'heróis salvos'}` : 'Ver aventureiros salvos';
    }

    // Atualiza card Continuar Herói
    const heroSummaryEl = document.getElementById('landingHeroSummary');
    const continueCard = document.getElementById('landingActionContinue');
    if (hero && (hero.identity?.characterName || hero.raceId || hero.classId)) {
      const name = hero.identity?.characterName || 'Aventureiro em edição';
      const lvl = hero.identity?.plannedLevel || hero.progression?.length || hero.level || 1;
      const race = hero.raceId || '';
      const cls = hero.classId || '';
      const details = [race, cls].filter(Boolean).join(' · ');
      if (heroSummaryEl) {
        heroSummaryEl.textContent = `${name}${details ? ' (' + details + ')' : ''} · Nvl ${lvl}`;
      }
      if (continueCard) {
        continueCard.href = hero?.finished ? 'ficha.html' : 'criador.html';
        continueCard.onclick = () => {
          try {
            const raw = localStorage.getItem('forja-heroi-t20-v1');
            if (raw) {
              const snap = JSON.parse(raw);
              if (snap.finished) {
                snap.sheetView = 'sheet';
                localStorage.setItem('forja-heroi-t20-v1', JSON.stringify(snap));
              }
            }
          } catch (_) {}
        };
      }
    } else {
      if (heroSummaryEl) {
        heroSummaryEl.textContent = 'Retomar criação em andamento';
      }
      if (continueCard) {
        continueCard.href = 'criador.html';
      }
    }

    // Renderiza linha Continue Jogando
    const recentRow = document.getElementById('landingRecentRow');
    if (recentRow) {
      let html = '';
      roster.slice(0, 4).forEach((item, index) => {
        const snap = item.snapshot || {};
        const id = item.id || `char-${index}`;
        const name = item.name || snap.identity?.characterName || 'Herói';
        const cls = snap.classId || 'Aventureiro';
        const lvl = snap.identity?.plannedLevel || snap.progression?.length || snap.level || 1;
        const icon = getClassIcon(snap.classId);

        html += `
          <div class="recent-hero-card" data-action="load-hero" data-hero-id="${esc(id)}" role="button" tabindex="0" title="Continuar jogando com ${esc(name)}">
            <div class="recent-hero-avatar" aria-hidden="true">${icon}</div>
            <div class="recent-hero-info">
              <span class="recent-hero-name">${esc(name)}</span>
              <div class="recent-hero-meta">
                <span class="recent-hero-badge">Nvl ${lvl}</span>
                <span>${esc(cls)}</span>
              </div>
            </div>
          </div>
        `;
      });

      const plusIcon = window.IconesForja ? window.IconesForja.get('plus', 'icon-sm') : '+';
      html += `
        <a class="recent-new-card" href="criador.html?novo=true">
          ${plusIcon} <span>Nova Ficha</span>
        </a>
      `;

      recentRow.innerHTML = html;
    }
  }

  function updateActiveHeroDisplay() {
    updateLandingDirectElements();
    if (!activeHeroSummary) return;
    const hero = getActiveHero();
    const actionContinue = document.getElementById('actionContinueActive');
    if (hero && (hero.identity?.characterName || hero.raceId || hero.classId)) {
      const name = hero.identity?.characterName || 'Aventureiro em edição';
      const lvl = hero.progression?.level || hero.level || 1;
      const race = hero.raceId || '';
      const cls = hero.classId || '';
      const details = [race, cls].filter(Boolean).join(' · ');
      activeHeroSummary.textContent = `${name}${details ? ' (' + details + ')' : ''} · Nvl ${lvl}`;
      if (actionContinue) {
        actionContinue.href = hero.finished ? 'ficha.html' : 'criador.html';
      }
    } else {
      activeHeroSummary.textContent = 'Iniciar criação livre no criador de fichas';
      if (actionContinue) {
        actionContinue.href = 'criador.html';
      }
    }
  }

  function renderRoster() {
    updateLandingDirectElements();
    if (!rosterList) return;
    const roster = getRoster();
    if (rosterCount) {
      rosterCount.textContent = `${roster.length} ${roster.length === 1 ? 'herói salvo' : 'heróis salvos'}`;
    }

    if (roster.length === 0) {
      rosterList.innerHTML = '<div class="empty-roster-msg">Nenhum herói salvo neste navegador ainda.<br>Clique em <strong>Forjar Novo Herói</strong> para começar!</div>';
      return;
    }

    rosterList.innerHTML = roster.map((item, index) => {
      const snap = item.snapshot || {};
      const name = item.name || snap.identity?.characterName || 'Herói Sem Nome';
      const race = snap.raceId || 'Raça Indefinida';
      const cls = snap.classId || 'Classe Indefinida';
      const lvl = snap.progression?.level || snap.level || 1;
      const itemId = item.id || `char-${index}`;

      return `
        <div class="roster-card" data-hero-id="${esc(itemId)}">
          <div class="roster-card-main" data-action="load-hero" data-hero-id="${esc(itemId)}">
            <span class="roster-hero-name">${esc(name)}</span>
            <div class="roster-hero-meta">
              <span class="roster-badge-level">Nvl ${lvl}</span>
              <span>${esc(race)} · ${esc(cls)}</span>
            </div>
          </div>
          <div class="roster-card-actions">
            <button class="roster-delete-btn" type="button" title="Apagar herói do salão" data-action="delete-hero" data-hero-id="${esc(itemId)}" data-hero-name="${esc(name)}">${window.IconesForja ? window.IconesForja.get('trash', 'icon-sm') : '×'}</button>
          </div>
        </div>
      `;
    }).join('');
  }

  function openPortal() {
    updateActiveHeroDisplay();
    renderRoster();
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closePortal() {
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // Inicializa os elementos da página
  updateLandingDirectElements();

  if (enterBtn) {
    enterBtn.addEventListener('click', event => {
      event.preventDefault();
      openPortal();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closePortal);
  }

  document.addEventListener('keydown', event => {
    const card=event.target.closest?.('.recent-hero-card');
    if(card && (event.key==='Enter'||event.key===' ')){event.preventDefault();card.click();}
  });
  document.addEventListener('click', event => {
    const loadTrigger = event.target.closest('[data-action="load-hero"]');
    if (loadTrigger) {
      const heroId = loadTrigger.dataset.heroId;
      const roster = getRoster();
      const hero = roster.find(h => h.id === heroId);
      if (hero && hero.snapshot) {
        try {
          const snap = JSON.parse(JSON.stringify(hero.snapshot));
          snap.finished = true;
          snap.sheetView = 'sheet';
          localStorage.setItem('forja-heroi-t20-v1', JSON.stringify(snap));
        } catch (e) {
          console.warn('Não foi possível persistir snapshot ativo:', e);
        }
        location.href = 'ficha.html';
      }
      return;
    }
  });

  modal.addEventListener('click', event => {
    if (event.target === modal) {
      closePortal();
      return;
    }

    const deleteTrigger = event.target.closest('[data-action="delete-hero"]');
    if (deleteTrigger) {
      event.stopPropagation();
      const heroId = deleteTrigger.dataset.heroId;
      const heroName = deleteTrigger.dataset.heroName || 'este herói';
      
      let confirmModal = document.getElementById('deleteHeroConfirmModal');
      if (!confirmModal) {
        confirmModal = document.createElement('div');
        confirmModal.id = 'deleteHeroConfirmModal';
        confirmModal.className = 'modal-backdrop';
        confirmModal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;z-index:999999;padding:16px;box-sizing:border-box;';
        confirmModal.innerHTML = `
          <div style="background:#0d1117;border:1px solid #30363d;border-radius:8px;max-width:400px;width:100%;overflow:hidden;box-shadow:0 12px 30px rgba(0,0,0,0.6);">
            <div style="padding:14px 18px;background:#161b22;border-bottom:1px solid #30363d;font-family:Cinzel,serif;font-weight:700;color:#f0f6fc;display:flex;align-items:center;gap:8px;">
              <span>${window.IconesForja ? window.IconesForja.get('trash', 'icon-sm icon-red') : ''}</span> Excluir Personagem
            </div>
            <div style="padding:16px 18px;color:#c9d1d9;font-size:0.88rem;line-height:1.5;" id="deleteHeroMsg"></div>
            <div style="padding:12px 18px;background:#161b22;border-top:1px solid #30363d;display:flex;justify-content:flex-end;gap:10px;">
              <button type="button" id="cancelDeleteHeroBtn" style="background:#21262d;border:1px solid #30363d;color:#c9d1d9;padding:6px 16px;border-radius:4px;cursor:pointer;font-family:Cinzel,serif;">Cancelar</button>
              <button type="button" id="confirmDeleteHeroBtn" style="background:#dc2626;border:1px solid #ef4444;color:#ffffff;padding:6px 18px;border-radius:4px;cursor:pointer;font-weight:700;font-family:Cinzel,serif;">Excluir</button>
            </div>
          </div>
        `;
        document.body.appendChild(confirmModal);
      }
      
      const msgEl = confirmModal.querySelector('#deleteHeroMsg');
      if (msgEl) msgEl.textContent = `Tem certeza que deseja apagar "${heroName}" do Salão dos Heróis? Esta ação não pode ser desfeita.`;
      
      const closeCModal = () => { confirmModal.hidden = true; confirmModal.style.display = 'none'; };
      confirmModal.querySelector('#cancelDeleteHeroBtn').onclick = closeCModal;
      confirmModal.onclick = (e) => { if (e.target === confirmModal) closeCModal(); };
      
      confirmModal.querySelector('#confirmDeleteHeroBtn').onclick = () => {
        closeCModal();
        const remaining = getRoster().filter(h => h.id !== heroId);
        saveRoster(remaining);
        renderRoster();
      };
      
      confirmModal.hidden = false;
      confirmModal.style.display = 'flex';
      return;
    }
  });

  window.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !modal.hidden) {
      closePortal();
    }
  });
})();
