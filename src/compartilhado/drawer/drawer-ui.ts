/**
 * FORJA RUBRA: Menu Lateral Gaveta (Drawer Retrátil)
 * Fornece navegação lateral deslizante com perfil do usuário e logout instantâneo com a portinha.
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

  function inicializarDrawer() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // Evitar inicialização duplicada
    if (document.getElementById('forjaDrawerBackdrop')) return;

    // Criar backdrop e gaveta
    const backdrop = document.createElement('div');
    backdrop.id = 'forjaDrawerBackdrop';
    backdrop.className = 'forja-drawer-backdrop';
    backdrop.hidden = true;

    const drawer = document.createElement('aside');
    drawer.id = 'forjaDrawer';
    drawer.className = 'forja-drawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('aria-label', 'Menu Principal');

    backdrop.appendChild(drawer);
    document.body.appendChild(backdrop);

    // Injetar botão hambúrguer no cabeçalho se ainda não existir
    garantirBotaoHamburguer();

    function fechar() {
      drawer.classList.remove('is-open');
      setTimeout(() => {
        backdrop.hidden = true;
      }, 200);
    }

    function abrir() {
      atualizarConteudo();
      backdrop.hidden = false;
      // Forçar reflow para animar
      void drawer.offsetWidth;
      drawer.classList.add('is-open');
    }
    window.abrirForjaDrawer = abrir;

    // Fechar ao clicar fora ou na tecla ESC
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) fechar();
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !backdrop.hidden) fechar();
    });

    function atualizarConteudo() {
      const auth = window.ModuloAuth ? window.ModuloAuth.obterServicoAutenticacao() : null;
      const user = auth ? auth.obterUsuarioAtual() : null;
      const icon = (name, cls = '') => (window.IconesForja ? window.IconesForja.get(name, cls) : '');
      const isHeroSheet = Boolean(document.getElementById('characterSheet') || (typeof window.state !== 'undefined' && window.state?.finished));
      const trainedOffices = typeof window.allTrainedOffices === 'function' ? window.allTrainedOffices() : [];
      const hasTrainedOffice = trainedOffices.length > 0;

      let userHeaderHtml = '';
      if (user) {
        const nome = esc(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Aventureiro');
        const email = esc(user.email || '');
        const avatar = user.user_metadata?.avatar_url;

        userHeaderHtml = `
          <div class="drawer-user-card authenticated">
            <div class="drawer-user-avatar-wrap">
              ${avatar ? `<img class="drawer-user-avatar" src="${esc(avatar)}" alt="${nome}" />` : `<div class="drawer-user-avatar-fallback">${nome.charAt(0).toUpperCase()}</div>`}
            </div>
            <div class="drawer-user-meta">
              <strong class="drawer-user-name">${nome}</strong>
              <small class="drawer-user-email">${email}</small>
            </div>
            <div class="drawer-user-actions">
              <button class="drawer-sync-btn" id="drawerSyncBtn" type="button" title="Salvar ficha ativa na nuvem">
                ${icon('sync', 'icon-sm')}
                <span>Sincronizar</span>
              </button>
              <button class="drawer-door-logout" id="drawerDoorLogoutBtn" type="button" title="Sair da conta">
                ${icon('door-exit', 'icon-md')}
              </button>
            </div>
          </div>
        `;
      } else {
        userHeaderHtml = `
          <div class="drawer-user-card unauthenticated">
            <button class="drawer-login-btn" id="drawerLoginBtn" type="button">
              <span class="drawer-login-icon">G</span>
              <span>Entrar com Google</span>
            </button>
          </div>
        `;
      }

      drawer.innerHTML = `
        <div class="drawer-header">
          <div class="drawer-brand">
            <span class="drawer-brand-mark">${icon('flame', 'icon-gold icon-md')}</span>
            <strong class="drawer-brand-title">Forja Rubra</strong>
          </div>
          <button class="drawer-close-btn" id="drawerCloseBtn" type="button" title="Fechar menu">
            ${icon('close', 'icon-md')}
          </button>
        </div>

        <div class="drawer-user-section">
          ${userHeaderHtml}
        </div>

        <nav class="drawer-nav">
          <div class="drawer-section-label">Navegação</div>
          <a class="drawer-nav-item" href="index.html">
            <span class="drawer-item-icon">${icon('flame', 'icon-gold')}</span>
            <span>Início</span>
          </a>

          <div class="drawer-section-label">Personagens</div>
          <a class="drawer-nav-item" href="criador.html?novo=true">
            <span class="drawer-item-icon">${icon('sword', 'icon-gold')}</span>
            <span>Criar Nova Ficha</span>
          </a>
          <a class="drawer-nav-item" href="javascript:void(0)" data-drawer-action="regras-campanha">
            <span class="drawer-item-icon">${icon('shield', 'icon-gold')}</span>
            <span>Regras da Campanha</span>
          </a>
          <a class="drawer-nav-item" href="personagens.html">
            <span class="drawer-item-icon">${icon('users', 'icon-gold')}</span>
            <span>Meus Personagens</span>
          </a>
          <a class="drawer-nav-item" href="javascript:void(0)" data-drawer-action="random-sheet">
            <span class="drawer-item-icon">${icon('dice', 'icon-gold')}</span>
            <span>Ficha Aleatória</span>
          </a>
          ${isHeroSheet ? `
          ${(document.getElementById('levelUpButton') && !document.getElementById('levelUpButton').hidden) ? `
          <a class="drawer-nav-item" href="javascript:void(0)" data-drawer-action="level-up">
            <span class="drawer-item-icon">${icon('arrow-up', 'icon-gold')}</span>
            <span style="color:#60a5fa;font-weight:700">Subir Nível</span>
          </a>` : ''}
          ${(document.getElementById('editCharacterButton') && !document.getElementById('editCharacterButton').hidden) ? `
          <a class="drawer-nav-item" href="javascript:void(0)" data-drawer-action="edit-sheet">
            <span class="drawer-item-icon">${icon('gear', 'icon-gold')}</span>
            <span>Editar Ficha</span>
          </a>` : ''}
          ` : ''}

          <div class="drawer-section-label">Ferramentas & Compêndios</div>
          <a class="drawer-nav-item" href="distincoes.html" title="Distinções de Arton (Nível 5+)">
            <span class="drawer-item-icon">${icon('award', 'icon-gold')}</span>
            <span>Distinções de Arton</span>
          </a>
          <a class="drawer-nav-item" href="grimorio.html">
            <span class="drawer-item-icon">${icon('book-open', 'icon-gold')}</span>
            <span>Grimório de Arton</span>
          </a>
          <a class="drawer-nav-item" href="loja.html">
            <span class="drawer-item-icon">${icon('store', 'icon-gold')}</span>
            <span>Loja</span>
          </a>
          <a class="drawer-nav-item" href="guilda.html?tab=estabulo"><span class="drawer-item-icon">${icon('shield', 'icon-gold')}</span><span>Estábulo</span></a>
          <a class="drawer-nav-item" href="guilda.html">
            <span class="drawer-item-icon">${icon('shield', 'icon-gold')}</span>
            <span>Guilda de Aventureiros</span>
          </a>
          <a class="drawer-nav-item" href="taverna.html">
            <span class="drawer-item-icon">${icon('beer', 'icon-gold')}</span>
            <span>Taverna de Arton</span>
          </a>
          <a class="drawer-nav-item" href="mapa.html">
            <span class="drawer-item-icon">${icon('scroll', 'icon-gold')}</span>
            <span>Mapa de Arton</span>
          </a>
          <a class="drawer-nav-item" href="oficina.html" title="Oficinas de Fabricação de Arton">
            <span class="drawer-item-icon">${icon('tools', 'icon-gold')}</span>
            <span>Oficinas de Fabricação</span>
          </a>
          <a class="drawer-nav-item" href="loja.html?oficina=engenhoqueiro" title="Bancada de Engenhocas de Arton">
            <span class="drawer-item-icon">${icon('gear', 'icon-gold')}</span>
            <span>Bancada de Engenhocas</span>
          </a>
          <a class="drawer-nav-item" href="recompensas.html">
            <span class="drawer-item-icon">${icon('dice', 'icon-gold')}</span>
            <span>Recompensas do Mestre</span>
          </a>

          <div class="drawer-section-label">Comunidade & Membros</div>
          <a class="drawer-nav-item drawer-nav-support" href="javascript:void(0)" data-drawer-action="support" title="Apoiar o Projeto">
            <span class="drawer-item-icon">${icon('heart', 'icon-red')}</span>
            <span style="color:#ffd992;font-weight:700">Seja Membro</span>
          </a>
        </nav>

        <div class="drawer-footer">
          <small>Forja Rubra · V1.0.0</small>
        </div>
      `;

      // Eventos internos da gaveta
      document.getElementById('drawerCloseBtn')?.addEventListener('click', fechar);

      // Ações especiais do drawer
      drawer.querySelectorAll('[data-drawer-action]').forEach(btn => {
        btn.addEventListener('click', e => {
          const act = btn.dataset.drawerAction;
          if (act === 'workshop') {
            fechar();
            window.location.href = 'oficina.html?modo=fabricar';
            return;
          }
          if (act === 'random-sheet') {
            e.preventDefault();
            fechar();
            const rBtn = document.getElementById('randomCharacterButton');
            if (rBtn) {
              rBtn.click();
            } else {
              window.location.href = 'criador.html?aleatorio=true';
            }
            return;
          }
          e.preventDefault();
          fechar();
          if (act === 'regras-campanha') {
            e.preventDefault();
            fechar();
            const fnRegras = window['abrirModalRegrasCampanha'];
            if (typeof fnRegras === 'function') {
              fnRegras(false);
            } else {
              window.location.href = 'criador.html?regras=true';
            }
            return;
          }
          if (act === 'support') {
            if (window.ForjaModais?.abrirApoio) window.ForjaModais.abrirApoio();
            else alert('Sistema Seja Membro em desenvolvimento!');
          } else if (act === 'reward') {
            window.location.href = 'recompensas.html';
          } else if (act === 'level-up') {
            document.getElementById('levelUpButton')?.click();
          } else if (act === 'edit-sheet') {
            document.getElementById('editCharacterButton')?.click();
          }
        });
      });

      // Validação de limite ao clicar em Criar Nova Ficha
      const newHeroLink = drawer.querySelector('a[href="criador.html?novo=true"]');
      if (newHeroLink) {
        newHeroLink.addEventListener('click', e => {
          if (typeof window.ForjaLimites !== 'undefined' && !window.ForjaLimites.podeCriarNovoPersonagem()) {
            e.preventDefault();
            fechar();
            window.ForjaLimites.abrirModalLimite();
          }
        });
      }

      // Sincronizar ficha ativa na nuvem
      document.getElementById('drawerSyncBtn')?.addEventListener('click', async () => {
        const btnSync = document.getElementById('drawerSyncBtn');
        if (!btnSync) return;
        const sinc = window.ModuloSincronizacao ? window.ModuloSincronizacao.obterServicoSincronizacao() : null;
        if (!sinc) {
          if (typeof window.toast === 'function') window.toast('Módulo de sincronização não disponível.');
          return;
        }
        btnSync.disabled = true;
        btnSync.innerHTML = `${icon('sync', 'icon-sm')} <span>Salvando…</span>`;
        try {
          const currentState = typeof window.state !== 'undefined' ? window.state : null;
          if (!currentState) {
            if (typeof window.toast === 'function') window.toast('Nenhuma ficha aberta para sincronizar.');
            return;
          }
          const res = await sinc.salvarFichaNuvem(currentState);
          if (res.ok) {
            if (typeof window.toast === 'function') window.toast('Ficha sincronizada na nuvem com sucesso!');
            const saveStatus = document.getElementById('saveStatus');
            if (saveStatus) saveStatus.textContent = 'Sincronizado na nuvem';
          } else {
            if (typeof window.toast === 'function') window.toast('Erro ao sincronizar: ' + (res.error || 'falha no servidor'));
          }
        } catch (e) {
          if (typeof window.toast === 'function') window.toast('Falha na sincronização.');
        } finally {
          btnSync.disabled = false;
          btnSync.innerHTML = `${icon('sync', 'icon-sm')} <span>Sincronizar</span>`;
        }
      });

      // Logout imediato com a portinha (SEM POP-UP)
      document.getElementById('drawerDoorLogoutBtn')?.addEventListener('click', async () => {
        if (auth) {
          await auth.logout();
          atualizarConteudo();
          if (typeof window.toast === 'function') {
            window.toast('Sessão encerrada.');
          }
        }
      });

      // Login caso deslogado
      document.getElementById('drawerLoginBtn')?.addEventListener('click', async () => {
        fechar();
        if (auth) {
          try {
            const cfg = window.SupabaseConfig ? window.SupabaseConfig.obterConfiguracao() : { isConfigured: false };
            if (!cfg.isConfigured && window.ForjaAuthUI?.abrirModalConfiguracaoSupabase) {
              window.ForjaAuthUI.abrirModalConfiguracaoSupabase();
              return;
            }
            await auth.loginComGoogle();
          } catch (e) {
            console.error(e);
            if (typeof window.toast === 'function') window.toast('Falha ao autenticar com o Google.');
          }
        }
      });
    }

    function garantirBotaoHamburguer() {
      const existingBtn = document.getElementById('drawerMenuBtn');
      if (existingBtn) {
        existingBtn.onclick = abrir;
        existingBtn.addEventListener('click', abrir);
        existingBtn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';
        return;
      }

      // Procurar local no cabeçalho ou portal
      const appHeader = document.querySelector('.app-header');
      const brand = document.querySelector('.brand');
      const portalHeader = document.querySelector('.portal-top-bar');

      let targetHeader = appHeader || portalHeader;
      if (!targetHeader) return;

      if (!document.getElementById('drawerMenuBtn')) {
        const btn = document.createElement('button');
        btn.id = 'drawerMenuBtn';
        btn.className = 'forja-drawer-trigger-btn';
        btn.type = 'button';
        btn.title = 'Abrir Menu';
        btn.setAttribute('aria-label', 'Abrir Menu Lateral');
        btn.style.color = '#dc2626';
        btn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';

        btn.addEventListener('click', abrir);

        const actions = targetHeader.querySelector('.header-actions');
        if (actions) {
          actions.appendChild(btn);
        } else {
          targetHeader.appendChild(btn);
        }
      }
    }

    // Ouvir mudanças de autenticação para re-renderizar o drawer
    if (window.ModuloAuth) {
      window.ModuloAuth.obterServicoAutenticacao().aoMudarEstado(() => {
        if (!backdrop.hidden) atualizarConteudo();
      });
    }

    window.ForjaDrawer = Object.freeze({
      abrir,
      fechar
    });
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', inicializarDrawer);
    } else {
      inicializarDrawer();
    }
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('forja-ready', inicializarDrawer);
  }
})();
