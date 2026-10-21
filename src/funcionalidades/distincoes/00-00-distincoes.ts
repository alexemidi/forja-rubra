// @ts-check

/**
 * FORJA RUBRA — Módulo Dedicado de Distinções de Arton (Nível 5+)
 * Permite explorar títulos lendários, ler processos de admissão com expansão,
 * conferir Marcas e poderes e integrar as distinções à ficha do personagem ativo.
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

  function inicializarDistincoes() {
    // @ts-ignore
    const rawData = window.__FORJA_DATA__ || {};
    let catalog = rawData.DATA?.distinctions || rawData.distinctions || (typeof DATA !== 'undefined' ? DATA.distinctions : null) || [];

    // Recupera dados do Herói Ativo
    let heroState = null;
    try {
      const stored = localStorage.getItem('forja-heroi-t20-v1');
      if (stored) heroState = JSON.parse(stored);
    } catch {}

    if (!heroState) {
      try {
        const rawProfiles = localStorage.getItem('arsenal-arton-character-profiles-v1');
        if (rawProfiles) {
          const parsed = JSON.parse(rawProfiles);
          heroState = parsed.profiles?.find(p => p.id === 'ficha-ativa') || parsed.profiles?.find(p => p.id === parsed.activeId) || parsed.profiles?.[0];
        }
      } catch {}
    }

    if (!heroState && typeof window.state !== 'undefined') {
      heroState = window.state;
    }

    const hasActiveHero = Boolean(heroState);
    heroState = heroState || {
      identity: { characterName: 'Aventureiro', plannedLevel: 1 },
      distinctions: { activeIds: [], powers: [] }
    };

    if (!heroState.distinctions || typeof heroState.distinctions !== 'object') {
      heroState.distinctions = { activeIds: [], powers: [] };
    }
    if (!Array.isArray(heroState.distinctions.activeIds)) {
      heroState.distinctions.activeIds = [];
    }

    const progressionLvl = Array.isArray(heroState.progression) ? (heroState.progression.length + 1) : 1;
    const plannedLvl = Number(heroState.identity?.plannedLevel) || 1;
    const initialLvl = Number(heroState.identity?.initialLevel) || 1;
    const editingLvl = Number(heroState.identity?.editingLevel) || 1;
    const explicitLvl = Number(heroState.level) || 1;
    const heroLvl = Math.max(progressionLvl, plannedLvl, initialLvl, editingLvl, explicitLvl);
    const heroName = heroState.identity?.characterName || 'Aventureiro';
    const canObtain = hasActiveHero && heroLvl >= 5;

    // Atualiza badge no cabeçalho
    const heroBadge = document.getElementById('heroDistinctionBadge');
    if (heroBadge) {
      const activeCount = heroState.distinctions.activeIds.length;
      heroBadge.innerHTML = `
        <svg class="forja-svg icon-sm icon-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
        <span>${esc(heroName)} (Nv. ${heroLvl}) · <strong>${activeCount}</strong> distinção${activeCount === 1 ? '' : 'ões'}</span>
      `;
    }

    // Elementos DOM
    const listEl = document.getElementById('distinctionsList');
    const searchInput = /** @type {HTMLInputElement|null} */ (document.getElementById('distinctionSearch'));
    const countLabel = document.getElementById('distinctionsCountLabel');
    const placeholderEl = document.getElementById('distinctionPlaceholder');
    const contentEl = document.getElementById('distinctionContent');
    const titleEl = document.getElementById('distinctionTitle');
    const sourceEl = document.getElementById('distinctionSource');
    const btnToggleEl = /** @type {HTMLButtonElement|null} */ (document.getElementById('btnToggleDistinction'));
    const admissionTextWrapper = document.getElementById('admissionTextWrapper');
    const admissionTextEl = document.getElementById('admissionText');
    const btnExpandAdmission = document.getElementById('btnExpandAdmission');
    const markTitleEl = document.getElementById('markTitle');
    const markDescEl = document.getElementById('markDesc');
    const powersListEl = document.getElementById('powersList');
    const extraSectionEl = document.getElementById('extraSection');
    const extraContentEl = document.getElementById('extraContent');

    let currentSelectedId = null;

    function salvarHeroi() {
      try {
        localStorage.setItem('forja-heroi-t20-v1', JSON.stringify(heroState));
      } catch (e) {
        console.warn('Erro ao salvar distinções no herói:', e);
      }
      try {
        const rawRoster = localStorage.getItem('forja-heroi-t20-personagens-v1');
        if (rawRoster) {
          const roster = JSON.parse(rawRoster);
          if (Array.isArray(roster) && roster.length > 0) {
            const heroId = heroState.identity?.characterId;
            let entry = roster.find(item => item.id === heroId);
            if (!entry && roster.length === 1) entry = roster[0];
            if (!entry && heroState.identity?.characterName) {
              entry = roster.find(item => item.name === heroState.identity.characterName || item.snapshot?.identity?.characterName === heroState.identity.characterName);
            }
            if (entry) {
              if (entry.snapshot && typeof entry.snapshot === 'object') {
                entry.snapshot.distinctions = heroState.distinctions;
              } else {
                entry.snapshot = heroState;
              }
              entry.updatedAt = Date.now();
              localStorage.setItem('forja-heroi-t20-personagens-v1', JSON.stringify(roster));
            }
          }
        }
      } catch {}
      try {
        const rawRoster2 = localStorage.getItem('forja-roster-t20-v1');
        if (rawRoster2) {
          const roster2 = JSON.parse(rawRoster2);
          if (Array.isArray(roster2) && roster2.length > 0) {
            const heroId = heroState.identity?.characterId;
            let entry = roster2.find(item => item.id === heroId);
            if (!entry && roster2.length === 1) entry = roster2[0];
            if (!entry && heroState.identity?.characterName) {
              entry = roster2.find(item => item.name === heroState.identity.characterName || item.snapshot?.identity?.characterName === heroState.identity.characterName);
            }
            if (entry) {
              if (entry.snapshot && typeof entry.snapshot === 'object') {
                entry.snapshot.distinctions = heroState.distinctions;
              } else {
                entry.snapshot = heroState;
              }
              entry.updatedAt = Date.now();
              localStorage.setItem('forja-roster-t20-v1', JSON.stringify(roster2));
            }
          }
        }
      } catch {}
      try {
        const rawProfiles = localStorage.getItem('arsenal-arton-character-profiles-v1');
        if (rawProfiles) {
          const parsed = JSON.parse(rawProfiles);
          if (parsed && Array.isArray(parsed.profiles)) {
            const prof = parsed.profiles.find(p => p.id === 'ficha-ativa') || parsed.profiles.find(p => p.id === parsed.activeId) || parsed.profiles[0];
            if (prof) {
              prof.distinctions = heroState.distinctions;
              localStorage.setItem('arsenal-arton-character-profiles-v1', JSON.stringify(parsed));
            }
          }
        }
      } catch {}
      try {
        window.dispatchEvent(new StorageEvent('storage', { key: 'forja-heroi-t20-v1' }));
      } catch {
        try { window.dispatchEvent(new Event('storage')); } catch {}
      }
    }

    function renderLista() {
      if (!listEl) return;
      const query = (searchInput?.value || '').trim().toLowerCase();
      const filtered = catalog.filter(d => {
        if (!query) return true;
        const inName = d.nome.toLowerCase().includes(query);
        const inPowers = (d.poderes || []).some(p => p.nome.toLowerCase().includes(query) || p.descricao.toLowerCase().includes(query));
        return inName || inPowers;
      });

      if (countLabel) {
        countLabel.textContent = `${filtered.length} distinç${filtered.length === 1 ? 'ão' : 'ões'} encontrada${filtered.length === 1 ? '' : 's'}`;
      }

      listEl.innerHTML = filtered.map(d => {
        const isObtained = heroState.distinctions.activeIds.includes(d.id);
        const isActive = d.id === currentSelectedId;
        return `
          <button type="button" class="distinction-item-btn ${isActive ? 'active' : ''}" data-distinction-id="${d.id}">
            <span class="name-span">${esc(d.nome)}</span>
            ${isObtained ? '<span class="obtained-badge">Ativa</span>' : ''}
          </button>
        `;
      }).join('');

      listEl.querySelectorAll('.distinction-item-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-distinction-id');
          if (id) selecionarDistincao(id);
        });
      });
    }

    function selecionarDistincao(id) {
      const distinction = catalog.find(d => d.id === id);
      if (!distinction) return;

      currentSelectedId = id;
      renderLista();

      if (placeholderEl) placeholderEl.hidden = true;
      if (contentEl) contentEl.hidden = false;

      if (titleEl) titleEl.textContent = distinction.nome;
      if (sourceEl) sourceEl.textContent = distinction.livro || 'Heróis de Arton';

      // Status de obtenção
      const isObtained = heroState.distinctions.activeIds.includes(id);
      if (btnToggleEl) {
        if (isObtained) {
          btnToggleEl.textContent = 'Distinção Adquirida';
          btnToggleEl.classList.add('is-obtained');
          btnToggleEl.title = 'Clique para revogar ou desmarcar esta distinção';
        } else {
          btnToggleEl.textContent = canObtain ? 'Obter Distinção' : `Requer Nível 5 (Atual: Nv. ${heroLvl})`;
          btnToggleEl.classList.remove('is-obtained');
          btnToggleEl.disabled = !canObtain;
          btnToggleEl.title = canObtain ? 'Adquirir esta distinção para o herói' : 'Você precisa ter pelo menos nível 5 para obter uma distinção';
        }
      }

      // Admissão
      if (admissionTextEl) {
        admissionTextEl.textContent = distinction.admissao || 'Sem requisitos de admissão registrados.';
      }
      if (admissionTextWrapper) {
        admissionTextWrapper.classList.remove('is-expanded');
      }
      if (btnExpandAdmission) {
        btnExpandAdmission.textContent = 'Ler mais ▼';
        btnExpandAdmission.style.display = (distinction.admissao && distinction.admissao.length > 200) ? 'inline-flex' : 'none';
      }

      // Marca da Distinção
      if (markTitleEl) markTitleEl.textContent = distinction.marca?.nome || 'Marca da Distinção';
      if (markDescEl) markDescEl.textContent = distinction.marca?.descricao || 'Sem descrição.';

      // Poderes da Distinção
      if (powersListEl) {
        const poderes = distinction.poderes || [];
        powersListEl.innerHTML = poderes.map(p => `
          <div class="power-card">
            <div class="power-card-header">
              <strong>${esc(p.nome)}</strong>
              ${p.preRequisitosTexto ? `<span class="power-prereq-tag">Pré-requisito: ${esc(p.preRequisitosTexto)}</span>` : ''}
            </div>
            <p class="power-card-desc">${esc(p.descricao)}</p>
          </div>
        `).join('');
      }

      // Regras Extras
      if (extraSectionEl && extraContentEl) {
        if (distinction.regrasExtras) {
          extraContentEl.textContent = distinction.regrasExtras;
          extraSectionEl.hidden = false;
        } else {
          extraSectionEl.hidden = true;
        }
      }

      // Atualiza URL sem recarregar
      if (window.history?.replaceState) {
        const url = new URL(window.location.href);
        url.searchParams.set('id', id);
        window.history.replaceState(null, '', url.toString());
      }
    }

    // Toggle de Admissão Ler Mais
    if (btnExpandAdmission && admissionTextWrapper) {
      btnExpandAdmission.addEventListener('click', () => {
        const expanded = admissionTextWrapper.classList.toggle('is-expanded');
        btnExpandAdmission.textContent = expanded ? 'Recolher ▲' : 'Ler mais ▼';
      });
    }

    // Toggle de Obtenção da Distinção
    if (btnToggleEl) {
      btnToggleEl.addEventListener('click', () => {
        if (!currentSelectedId) return;
        const distinction = catalog.find(d => d.id === currentSelectedId);
        if (!distinction) return;

        const idx = heroState.distinctions.activeIds.indexOf(currentSelectedId);
        if (idx >= 0) {
          heroState.distinctions.activeIds.splice(idx, 1);
        } else {
          if (!canObtain) return;
          heroState.distinctions.activeIds.push(currentSelectedId);
        }

        heroState.distinctions.selectedId=currentSelectedId;
        salvarHeroi();
        selecionarDistincao(currentSelectedId);

        if (heroBadge) {
          const activeCount = heroState.distinctions.activeIds.length;
          heroBadge.innerHTML = `
            <svg class="forja-svg icon-sm icon-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
            <span>${esc(heroName)} (Nv. ${heroLvl}) · <strong>${activeCount}</strong> distinção${activeCount === 1 ? '' : 'ões'}</span>
          `;
        }
      });
    }

    // Busca
    if (searchInput) {
      searchInput.addEventListener('input', renderLista);
    }

    // Carrega catálogo se ainda estiver vazio
    if (!catalog || catalog.length === 0) {
      fetch('dados/distincoes.json')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            catalog = data;
            iniciarSelecaoInicial();
          }
        })
        .catch(err => {
          console.warn('Erro ao carregar dados/distincoes.json:', err);
        });
    } else {
      iniciarSelecaoInicial();
    }

    function iniciarSelecaoInicial() {
      renderLista();
      const params = new URLSearchParams(window.location.search);
      const urlId = params.get('id');
      const initialId = urlId && catalog.some(d => d.id === urlId)
        ? urlId
        : (heroState.distinctions.activeIds.includes(heroState.distinctions.selectedId)?heroState.distinctions.selectedId:heroState.distinctions.activeIds[0]) || catalog[0]?.id;

      if (initialId) {
        selecionarDistincao(initialId);
      }
    }
  }

  // Inicialização
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarDistincoes);
  } else {
    inicializarDistincoes();
  }
})();
