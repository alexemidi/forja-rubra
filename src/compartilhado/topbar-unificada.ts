// @ts-check
/**
 * FORJA RUBRA — Módulo de TopBar Padronizada e Autohide Footer on Scroll
 * Unifica a barra superior em todas as telas (Loja, Oficinas, Engenhocas, Taverna)
 * e implementa o recolhimento suave de barras inferiores na rolagem da página.
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

  const STARTING_FUNDS_TABLE = {
    1: 140, 2: 300, 3: 600, 4: 1000, 5: 2000, 6: 3000, 7: 5000, 8: 7000, 9: 10000,
    10: 13000, 11: 19000, 12: 27000, 13: 36000, 14: 49000, 15: 66000, 16: 88000,
    17: 110000, 18: 150000, 19: 200000, 20: 260000
  };

  function obterDadosHeroiAtivo() {
    let hero = null;
    try {
      const raw = localStorage.getItem('forja-heroi-t20-v1');
      if (raw) hero = JSON.parse(raw);
    } catch (e) {}

    let heroName = hero?.identity?.characterName || 'Herói';
    let clsId = hero?.identity?.classId || 'Aventureiro';
    let clsName = clsId.charAt(0).toUpperCase() + clsId.slice(1);
    let level = Number(hero?.identity?.plannedLevel || hero?.identity?.initialLevel || hero?.level || (Array.isArray(hero?.progression) && hero.progression.length > 0 ? hero.progression.length + 1 : 1));
    if (!level || level < 1) level = 1;

    // 1. Resolução do Saldo Real
    let funds = 0;
    try {
      const published = JSON.parse(localStorage.getItem('forja-saldo-personagem-ativo-v1') || 'null');
      if (published && Number.isFinite(Number(published.funds)) && Number(published.funds) > 0) {
        funds = Number(published.funds);
      }
    } catch (e) {}

    if (funds <= 0 && typeof window.remainingFunds === 'function') {
      try {
        const rf = window.remainingFunds();
        if (Number.isFinite(Number(rf)) && Number(rf) > 0) funds = Number(rf);
      } catch (e) {}
    }

    if (funds <= 0 && hero) {
      if (hero.funds != null && Number(hero.funds) > 0) funds = Number(hero.funds);
      else if (hero.dinheiro != null && Number(hero.dinheiro) > 0) funds = Number(hero.dinheiro);
      else if (hero.inventoryMoney) {
        const tibares = Number(hero.inventoryMoney.tibares ?? hero.inventoryMoney.ts ?? 0);
        const to = Number(hero.inventoryMoney.to ?? 0);
        const tc = Number(hero.inventoryMoney.tc ?? 0);
        const total = (to * 10) + tibares + (tc * 0.1);
        if (total > 0) funds = total;
      } else if (hero.moedas) {
        const to = Number(hero.moedas.to ?? 0);
        const ts = Number(hero.moedas.ts ?? 0);
        const tc = Number(hero.moedas.tc ?? 0);
        const total = (to * 10) + ts + (tc * 0.1);
        if (total > 0) funds = total;
      }
    }

    if (funds <= 0 && hero?.finances) {
      const finLevel = Math.max(Number(hero.finances.startingLevel) || 1, level);
      const starting = finLevel === 1
        ? (Number(hero.finances.levelOneTibars) || (STARTING_FUNDS_TABLE[level] || Number(hero.finances.startingFunds || 0)))
        : (STARTING_FUNDS_TABLE[finLevel] || STARTING_FUNDS_TABLE[level] || Number(hero.finances.startingFunds || 0));
      const rewards = Number(hero.finances.rewardFunds || 0);
      const spent = Number(hero.finances.spent || 0);
      const ledger = Math.max(0, starting + rewards - spent);
      if (ledger > 0) funds = ledger;
      else if (starting > 0 && spent === 0) funds = starting;
    }

    if (funds <= 0) {
      try {
        const rawProfiles = localStorage.getItem('arsenal-arton-character-profiles-v1');
        if (rawProfiles) {
          const prof = JSON.parse(rawProfiles);
          const active = prof.profiles?.find(p => p.id === 'ficha-ativa') || prof.profiles?.find(p => p.id === prof.activeId) || prof.profiles?.[0];
          if (active?.funds != null && Number(active.funds) > 0) funds = Number(active.funds);
          else if (active?.money != null && Number(active.money) > 0) funds = Number(active.money);
        }
      } catch (e) {}
    }

    if (funds <= 0 && level > 1) {
      funds = STARTING_FUNDS_TABLE[level] || 0;
    }

    // 2. Resolução da Inteligência Real
    let intMod = 5;
    if (typeof window.finalAttrs === 'function') {
      try {
        const fa = window.finalAttrs();
        if (fa && fa.int != null && Number(fa.int) > 0) intMod = Number(fa.int);
      } catch (e) {}
    } else if (hero) {
      if (hero.finalAttrs?.int != null && Number(hero.finalAttrs.int) > 0) {
        intMod = Number(hero.finalAttrs.int);
      } else if (hero.attributes?.int != null && Number(hero.attributes.int) > 0) {
        intMod = Number(hero.attributes.int);
      } else if (hero.identity?.baseAttrs?.int != null) {
        let val = Number(hero.identity.baseAttrs.int);
        if (hero.identity.openRaceAllocations?.int) val += Number(hero.identity.openRaceAllocations.int);
        const raceId = String(hero.identity?.raceId || '').toLowerCase();
        if (raceId === 'kliren' || raceId === 'elfo') val += 2;
        else if (raceId === 'goblin' || raceId === 'qareen') val += 1;
        else if (raceId === 'minotauro') val -= 1;
        if (Array.isArray(hero.identity.raceAttrs)) val += hero.identity.raceAttrs.filter(a => a === 'int').length;
        if (Array.isArray(hero.progression)) {
          hero.progression.forEach(p => {
            if (p && (p.attribute === 'int' || p.chosenAttr === 'int' || p.powerId === 'aumento_de_atributo_int' || (p.powerId === 'aumento_de_atributo' && p.chosenAttr === 'int'))) {
              val += 1;
            }
          });
        }
        if (val > 0) intMod = val;
      }
    }

    return { hero, heroName, clsName, level, funds, intMod };
  }

  function renderTopbar() {
    if (typeof document === 'undefined') return;
    if (window.parent !== window) return; // Não renderiza topbar duplicada se estiver dentro de iframe

    const { heroName, clsName, level, funds } = obterDadosHeroiAtivo();
    const formattedFunds = `T$ ${funds.toLocaleString('pt-BR')}`;

    // Remove eventuais cabeçalhos legados soltos
    const legacyTopbar = document.getElementById('standaloneWorkshopTopbar');
    if (legacyTopbar) legacyTopbar.remove();
    const oldHeader = document.querySelector('header.topbar');
    if (oldHeader) oldHeader.remove();
    const oldTavernHeader = document.querySelector('header.tavern-header');
    if (oldTavernHeader) oldTavernHeader.remove();
    const oldPortalHeader = document.querySelector('header.portal-top-bar');
    if (oldPortalHeader) oldPortalHeader.remove();
    const oldGuildHeader = document.querySelector('header.guild-header');
    if (oldGuildHeader) oldGuildHeader.remove();

    let topbar = document.getElementById('forjaUnifiedTopbar');
    if (!topbar) {
      topbar = document.createElement('header');
      topbar.id = 'forjaUnifiedTopbar';
      document.body.prepend(topbar);
    }

    topbar.className = 'forja-unified-topbar';
    topbar.style.cssText = 'position:sticky;top:0;left:0;right:0;z-index:9999;display:flex;justify-content:space-between;align-items:center;padding:10px 20px;background:#0d1117;border-bottom:1px solid #1a2230;box-sizing:border-box;width:100%;box-shadow:0 4px 16px rgba(0,0,0,0.4);';

    topbar.innerHTML = `
      <div style="flex:1;display:flex;align-items:center;"></div>
      <div style="display:flex;align-items:center;justify-content:center;position:absolute;left:50%;transform:translateX(-50%);">
        <a href="index.html" class="topbar-unified-brand" title="Voltar ao Menu Principal" style="text-decoration:none;display:inline-flex;align-items:center;gap:10px;">
          <img src="assets/favicon.svg" alt="" width="28" height="28" style="vertical-align:middle;flex-shrink:0;">
          <h1 style="margin:0;color:#d4af37;font-family:'Tormenta','Cinzel',serif;font-size:1.15rem;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;line-height:1;">Forja Rubra</h1>
        </a>
      </div>
      <div style="flex:1;display:flex;align-items:center;justify-content:flex-end;gap:6px;">
        <button type="button" class="forja-topbar-back-btn" id="topbarBackBtn" data-header-back="" title="Voltar" aria-label="Voltar" onclick="if(window.history.length > 1) { window.history.back(); } else { window.location.href = 'index.html'; }" style="background:transparent;border:none;color:#dc2626;cursor:pointer;padding:6px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;transition:transform 0.15s, opacity 0.15s;">
          <span class="forja-return-arrow" aria-hidden="true"></span>
        </button>
        <button type="button" class="forja-drawer-trigger-btn" id="drawerMenuBtn" title="Abrir Menu Lateral" aria-label="Abrir Menu" style="background:transparent;border:none;color:#dc2626;cursor:pointer;padding:6px;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
      </div>
    `;

    const dBtn = topbar.querySelector('#drawerMenuBtn');
    if (dBtn) {
      dBtn.onclick = () => {
        if (typeof window.abrirForjaDrawer === 'function') {
          window.abrirForjaDrawer();
        } else {
          const drawer = document.getElementById('forjaDrawer') || document.querySelector('.forja-drawer');
          const backdrop = document.getElementById('forjaDrawerBackdrop');
          if (drawer && backdrop) {
            backdrop.hidden = false;
            drawer.classList.add('is-open');
          }
        }
      };
    }

    if (!document.getElementById('forja-return-style')) {
      const style = document.createElement('style');
      style.id = 'forja-return-style';
      style.textContent =
        '[data-header-back],.forja-topbar-back-btn{display:inline-flex!important;align-items:center;justify-content:center;width:36px;height:36px;padding:7px!important;margin-right:6px;background:transparent!important;border:0!important;color:#dc2626!important;cursor:pointer;clip-path:none!important;border-radius:4px;transition:transform 0.15s, opacity 0.15s;}.forja-topbar-back-btn:hover{transform:scale(1.08);color:#ef4444!important;}.forja-return-arrow{display:block;width:18px;height:14px;border:2px solid currentColor;border-bottom:0;border-radius:11px 11px 0 0;position:relative;}.forja-return-arrow:before{content:"";position:absolute;left:-5px;top:4px;width:7px;height:7px;border-left:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(-45deg);}';
      document.head.append(style);
    }

    const page = location.pathname.split('/').pop().replace('.html', '');
    const names: Record<string, string> = {
      estabulo: 'Estábulo',
      distincoes: 'Distinções',
      oficina: 'Oficinas',
      loja: 'Loja',
      taverna: 'Taverna',
      guilda: 'Guilda',
      'resgatar-recompensas': 'Recompensas',
      recompensas: 'Recompensas',
      mapa: 'Mapa'
    };
    if (names[page]) {
      const fallbackUrl = (page === 'mapa' || page === 'index') ? 'index.html' : 'ficha.html';
      if (typeof sincronizarCabecalho === 'function') {
        sincronizarCabecalho('Forja Rubra — ' + names[page], () => {
          if (history.length > 1) history.back();
          else location.href = fallbackUrl;
        });
      }
    } else {
      renderBottombarIfNeeded();
    }
  }

  function renderBottombarIfNeeded() {
    if (typeof document === 'undefined') return;
    if (window.parent !== window) return;

    const path = (window.location.pathname || '').toLowerCase();
    if (path.endsWith('index.html') || path.endsWith('/') || path.endsWith('personagens.html') || path.includes('mapa') || path.includes('grimorio') || path.includes('ficha')) {
      const existing = document.querySelector('.sheet-shop-footer, #standaloneWorkshopFooter, .forja-autohide-footer');
      if (existing) existing.remove();
      return;
    }

    let existingFooter = document.querySelector('.sheet-shop-footer, #standaloneWorkshopFooter, .forja-autohide-footer');
    if (!existingFooter) {
      existingFooter = document.createElement('footer');
      existingFooter.className = 'sheet-shop-footer forja-autohide-footer';
      existingFooter.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9990;display:flex;justify-content:flex-end;align-items:center;gap:12px;padding:10px 24px;background:#0d1117;border-top:1px solid #1a2230;box-sizing:border-box;width:100%;box-shadow:0 -4px 16px rgba(0,0,0,0.5);';
      existingFooter.innerHTML = `
        <button type="button" class="button" onclick="if(window.history.length > 1) { window.history.back(); } else { window.location.href = 'ficha.html'; }" style="background:#991b1b;border:1px solid #b91c1c;color:#ffffff;font-weight:700;padding:8px 24px;border-radius:6px;cursor:pointer;font-size:0.88rem;display:inline-flex;align-items:center;gap:6px;box-shadow:0 2px 6px rgba(0,0,0,0.3);line-height:1;height:38px;">
          <svg class="forja-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          <span>Voltar</span>
        </button>
      `;
      document.body.appendChild(existingFooter);
    }
  }

  function aplicarAutohideScroll() {
    if (typeof window === 'undefined') return;

    // Injetar estilo de transição se ainda não existir
    if (!document.getElementById('forjaAutohideStyles')) {
      const style = document.createElement('style');
      style.id = 'forjaAutohideStyles';
      style.textContent = `
        .sheet-shop-footer, #standaloneWorkshopFooter, .embedded-shop-actions, .engenhoca-craft-card-footer, .forja-autohide-footer {
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease-in-out !important;
        }
        .autohide-hidden {
          transform: translateY(100%) !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `;
      document.head.appendChild(style);
    }

    let lastScrollY = window.scrollY || 0;
    let ticking = false;
    let isHidden = false;

    const setFootersHidden = (hide) => {
      if (isHidden === hide) return;
      isHidden = hide;
      const footers = document.querySelectorAll('.sheet-shop-footer, #standaloneWorkshopFooter, .embedded-shop-actions, .forja-autohide-footer, .engenhoca-craft-card-footer');
      for (let i = 0; i < footers.length; i++) {
        if (hide) footers[i].classList.add('autohide-hidden');
        else footers[i].classList.remove('autohide-hidden');
      }
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY || 0;
          const diff = currentScrollY - lastScrollY;
          if (Math.abs(diff) > 12) {
            if (diff > 0 && currentScrollY > 70) {
              setFootersHidden(true);
            } else if (diff < 0 || (window.innerHeight + currentScrollY) >= (document.body.scrollHeight - 30)) {
              setFootersHidden(false);
            }
            lastScrollY = Math.max(0, currentScrollY);
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    // Trata rolagem originada dentro de iframes (loja, taverna, etc.) com throttling
    let msgTicking = false;
    window.addEventListener('message', (ev) => {
      const data = ev?.data;
      if (data && (data.type === 'host-scroll' || data.type === 'scroll')) {
        const delta = Number(data.delta || data.deltaY || 0);
        if (!msgTicking) {
          msgTicking = true;
          window.requestAnimationFrame(() => {
            if (delta > 15) {
              setFootersHidden(true);
            } else if (delta < -15) {
              setFootersHidden(false);
            }
            msgTicking = false;
          });
        }
      }
    });
  }

  // Inicialização automática
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        aplicarAutohideScroll();
      });
    } else {
      aplicarAutohideScroll();
    }
  }

  window.ForjaTopBar = {
    obterDadosHeroiAtivo,
    renderTopbar,
    aplicarAutohideScroll
  };
})();
