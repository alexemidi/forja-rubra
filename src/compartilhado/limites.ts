/**
 * FORJA RUBRA: Limites de Personagens e Gestão de Capacidade
 * Garante que usuários gratuitos tenham limite de até 10 fichas criadas,
 * preservando a performance do banco de dados e incentivando apoio ao projeto.
 */
(() => {
  'use strict';

  const STORAGE_KEY = 'forja-heroi-t20-personagens-v1';
  const MAX_FREE_CHARACTERS = 10;

  function obterRoster() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  function obterLimiteMaximo() {
    // Verificar se usuário tem status de apoiador
    const auth = window.ModuloAuth ? window.ModuloAuth.obterServicoAutenticacao() : null;
    const user = auth ? auth.obterUsuarioAtual() : null;
    const tier = user?.user_metadata?.supporter_tier || localStorage.getItem('forja_supporter_tier');

    if (tier === 'lenda') return Infinity;
    if (tier === 'campeao') return 50;
    if (tier === 'aventureiro') return 25;

    return MAX_FREE_CHARACTERS;
  }

  function obterTotalPersonagens() {
    return obterRoster().length;
  }

  function podeCriarNovoPersonagem() {
    const total = obterTotalPersonagens();
    const limite = obterLimiteMaximo();
    return total < limite;
  }

  function abrirModalLimite() {
    let backdrop = document.getElementById('forjaLimitModalBackdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'forjaLimitModalBackdrop';
      backdrop.className = 'modal-backdrop';
      backdrop.style.zIndex = '999999';

      const icon = (name, cls = '') => (window.IconesForja ? window.IconesForja.get(name, cls) : '');

      backdrop.innerHTML = `
        <section class="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="limitModalTitle" style="max-width:520px;border-color:var(--gold2)">
          <header style="display:flex;align-items:center;gap:10px">
            <span style="color:#f59e0b">${icon('shield', 'icon-md')}</span>
            <h3 id="limitModalTitle" style="margin:0;color:var(--gold2)">Limite de Heróis Atingido</h3>
          </header>
          <div class="confirm-modal-body" style="padding:16px 0;line-height:1.6">
            <div class="warning-box" style="margin-bottom:14px;background:#2d1a0e;border:1px solid #d97706;padding:12px;border-radius:8px">
              <strong>Capacidade Máxima Gratuita (10 de 10 fichas)</strong>
              <p style="margin:6px 0 0;font-size:0.86rem;color:#fde68a">
                Você atingiu o limite inicial de 10 aventureiros salvos na Forja Rubra.
              </p>
            </div>
            <p style="font-size:0.88rem;color:var(--muted);margin-bottom:12px">
              Para manter o ecossistema rápido, estável e acessível a toda a comunidade de jogadores sem sobrecarregar a memória, limitamos novas criações no plano gratuito.
            </p>
            <p style="font-size:0.88rem;color:var(--text);margin:0">
              Você pode <strong>gerenciar ou excluir fichas antigas</strong> na tela de Meus Personagens ou <strong>apoiar o desenvolvimento da Forja</strong> para expandir seu limite para 25, 50 ou fichas ilimitadas!
            </p>
          </div>
          <footer style="display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap">
            <button class="button" id="limitModalCloseBtn" type="button">Fechar</button>
            <a class="button" href="personagens.html" style="text-decoration:none">Gerenciar Personagens</a>
            <button class="button primary" id="limitModalSupportBtn" type="button" style="background:#b45309;border-color:#d97706">
              Apoiar o Projeto
            </button>
          </footer>
        </section>
      `;

      document.body.appendChild(backdrop);

      document.getElementById('limitModalCloseBtn')?.addEventListener('click', () => {
        backdrop.hidden = true;
      });
      document.getElementById('limitModalSupportBtn')?.addEventListener('click', () => {
        backdrop.hidden = true;
        if (window.ForjaModais?.abrirApoio) {
          window.ForjaModais.abrirApoio();
        } else {
          alert('Sistema de Apoio em desenvolvimento!');
        }
      });
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) backdrop.hidden = true;
      });
    }

    backdrop.hidden = false;
  }

  function podeEditarFicha() {
    return true;
  }

  window.ForjaLimites = Object.freeze({
    MAX_FREE_CHARACTERS,
    obterTotalPersonagens,
    obterLimiteMaximo,
    podeCriarNovoPersonagem,
    abrirModalLimite,
    podeEditarFicha
  });
})();
