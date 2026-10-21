/**
 * FORJA RUBRA: Rodapé Global e Modais Institucionais
 * Renderiza o rodapé completo de 5 colunas estilo Fichas de Nimb
 * e controla os modais de Termos de Uso e Apoiar o Projeto.
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

  function abrirTermos() {
    let backdrop = document.getElementById('forjaTermsModalBackdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'forjaTermsModalBackdrop';
      backdrop.className = 'modal-backdrop';
      backdrop.style.zIndex = '999999';

      backdrop.innerHTML = `
        <section class="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="termsModalTitle" style="max-width:680px">
          <header style="display:flex;align-items:center;justify-content:space-between">
            <h3 id="termsModalTitle" style="margin:0;color:var(--gold2)">Termos de Uso e Licença</h3>
            <button class="button" id="termsCloseXBtn" type="button" style="padding:4px 8px;font-size:0.9rem">×</button>
          </header>
          <div class="confirm-modal-body forja-modal-content-scroll">
            <h4>1. Aceitação e Propósito</h4>
            <p>
              A <strong>Forja Rubra</strong> é uma plataforma independente criada por e para entusiastas do RPG nacional. Ao utilizar nossos serviços, você concorda com estes termos de uso e com as diretrizes de respeito à comunidade.
            </p>

            <h4>2. Propriedade Intelectual e OGL</h4>
            <p>
              <strong>Tormenta 20</strong> e suas obras derivadas são marcas registradas e propriedades intelectuais da <strong>Jambô Editora</strong>.
            </p>
            <p>
              Todo o conteúdo mecânico, tabelas e regras presentes na plataforma são utilizados sob os termos da <em>Open Game License (OGL)</em> versão 1.0a e/ou autorizações de uso comunitário para ferramentas de apoio. Nenhum trecho deste sistema visa substituir os livros oficiais, os quais recomendamos veementemente a compra através da loja oficial da Jambô Editora.
            </p>

            <h4>3. Uso Pessoal e Gratuito</h4>
            <p>
              A Forja Rubra é de uso pessoal e gratuito. Cada aventureiro cadastrado possui um plano inicial de <strong>até 10 fichas completas</strong> salvas, garantindo performance e integridade do banco de dados coletivo. Usuários apoiadores recebem cotas ampliadas para sustentar a infraestrutura.
            </p>

            <h4>4. Privacidade e Armazenamento de Dados</h4>
            <p>
              Seus dados de login (Google OAuth) são intermediados com segurança através da infraestrutura Supabase. Não comercializamos, compartilhamos ou utilizamos seus dados e suas fichas para quaisquer fins além da sua própria experiência de jogo.
            </p>

            <h4>5. Modificações do Serviço</h4>
            <p>
              A Forja Rubra reserva-se o direito de atualizar, aprimorar ou balancear ferramentas a qualquer momento visando a fidelidade às regras oficiais e a estabilidade da plataforma.
            </p>
          </div>
          <footer style="display:flex;justify-content:flex-end">
            <button class="button primary" id="termsModalCloseBtn" type="button">Entendido</button>
          </footer>
        </section>
      `;

      document.body.appendChild(backdrop);

      const fechar = () => {
        backdrop.hidden = true;
        backdrop.style.display = 'none';
        backdrop.remove();
      };
      document.getElementById('termsModalCloseBtn')?.addEventListener('click', fechar);
      document.getElementById('termsCloseXBtn')?.addEventListener('click', fechar);
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) fechar();
      });
      document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
          fechar();
          document.removeEventListener('keydown', escHandler);
        }
      });
    }

    backdrop.hidden = false;
    backdrop.style.display = 'grid';
  }

  function abrirApoio() {
    let backdrop = document.getElementById('forjaSupportModalBackdrop');
    if (backdrop) backdrop.remove();

    backdrop = document.createElement('div');
    backdrop.id = 'forjaSupportModalBackdrop';
    backdrop.className = 'modal-backdrop';
    backdrop.style.zIndex = '999999';

    backdrop.innerHTML = `
      <section class="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="supportModalTitle" style="max-width:760px;width:95vw;max-height:90vh;display:flex;flex-direction:column;overflow:hidden;background:#0d121c;border:1px solid #7f1d1d;border-radius:10px;box-shadow:0 16px 50px rgba(0,0,0,0.85);">
        <header style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #1e293b;background:#140e12;">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="color:#ef4444">${getIcon('heart', 'icon-md')}</span>
            <h3 id="supportModalTitle" style="margin:0;color:var(--gold2);font-family:'Cinzel',serif;font-size:1.15rem;">Seja Membro da Forja Rubra</h3>
          </div>
          <button class="button" id="supportCloseXBtn" type="button" data-modal-close aria-label="Fechar modal" style="padding:4px 10px;font-size:1.1rem;line-height:1;min-height:28px;height:28px;width:auto;">×</button>
        </header>
        <div class="confirm-modal-body forja-modal-content-scroll" style="overflow-y:auto;flex:1;padding:18px 20px;">
          <p style="color:var(--muted);margin-bottom:16px;line-height:1.5;">
            A Forja Rubra é um projeto independente criado por e para a comunidade de Tormenta 20. Tornar-se membro sustenta nossos servidores na nuvem, banco de dados de alta velocidade e desbloqueia ferramentas exclusivas para mestres e jogadores!
          </p>

          <div class="forja-support-tiers">
            <!-- Tier 1: Aventureiro -->
            <div class="forja-tier-card">
              <h5 class="forja-tier-name">Aventureiro</h5>
              <div class="forja-tier-price">R$ 5 <small>/ mês</small></div>
              <ul class="forja-tier-features">
                <li><span class="support-check">●</span> <strong>Até 25 fichas</strong> salvas na nuvem</li>
                <li><span class="support-check">●</span> Ajuda direta a manter servidores ativos</li>
                <li><span class="support-check">●</span> Selo de Apoiador / Membro no perfil</li>
              </ul>
              <button class="button" type="button" data-support-plan="aventureiro" style="width:100%">
                Escolher Plano
              </button>
            </div>

            <!-- Tier 2: Campeão -->
            <div class="forja-tier-card featured">
              <span class="forja-tier-badge">Recomendado</span>
              <h5 class="forja-tier-name">Campeão de Arton</h5>
              <div class="forja-tier-price">R$ 10 <small>/ mês</small></div>
              <ul class="forja-tier-features">
                <li><span class="support-check">●</span> <strong>Até 50 fichas</strong> completas</li>
                <li><span class="support-check">●</span> Exportação avançada e temas visuais</li>
                <li><span class="support-check">●</span> Acesso antecipado a atualizações</li>
                <li><span class="support-check">●</span> Canal exclusivo no Discord da Forja</li>
              </ul>
              <button class="button primary" type="button" data-support-plan="campeao" style="width:100%;background:#d97706;border-color:#f59e0b">
                Escolher Plano
              </button>
            </div>

            <!-- Tier 3: Lenda -->
            <div class="forja-tier-card">
              <h5 class="forja-tier-name">Lenda Viva</h5>
              <div class="forja-tier-price">R$ 20 <small>/ mês</small></div>
              <ul class="forja-tier-features">
                <li><span class="support-check">●</span> <strong>Fichas ilimitadas</strong> na nuvem</li>
                <li><span class="support-check">●</span> Ferramentas exclusivas de mestre</li>
                <li><span class="support-check">●</span> Gerador de Ameaças em breve</li>
                <li><span class="support-check">●</span> Seu nome nos créditos de honra</li>
              </ul>
              <button class="button" type="button" data-support-plan="lenda" style="width:100%">
                Escolher Plano
              </button>
            </div>
          </div>

          <div style="background:#131822;border:1px dashed rgba(255,217,146,0.3);border-radius:8px;padding:14px;text-align:center;margin-top:16px">
            <strong style="color:var(--gold2)">Mecanismos de Pagamento</strong>
            <p style="font-size:0.82rem;color:var(--muted);margin:6px 0 0">
              Estamos finalizando a integração com chave PIX direta e campanhas no Apoia.se / Catarse para automatização dos benefícios. Caso deseje apoiar agora ou sugerir parcerias, converse conosco pela comunidade!
            </p>
          </div>
        </div>
        <footer style="display:flex;justify-content:flex-end;padding:12px 20px;border-top:1px solid #1e293b;background:#0a0e17;">
          <button class="button primary" id="supportModalCloseBtn" type="button" data-modal-close style="padding:6px 20px;min-height:32px;height:32px;font-size:0.85rem;">Fechar</button>
        </footer>
      </section>
    `;

    document.body.appendChild(backdrop);

    const fechar = () => {
      backdrop.hidden = true;
      backdrop.style.display = 'none';
      backdrop.remove();
    };

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop || e.target.closest('#supportModalCloseBtn, #supportCloseXBtn, [data-modal-close]')) {
        fechar();
      }
    });

    document.addEventListener('keydown', function escSupportHandler(e) {
      if (e.key === 'Escape' && !backdrop.hidden) {
        fechar();
        document.removeEventListener('keydown', escSupportHandler);
      }
    });

    backdrop.querySelectorAll('[data-support-plan]').forEach(btn => {
      btn.addEventListener('click', () => {
        const plan = btn.dataset.supportPlan;
        alert(`Plano ${plan.toUpperCase()} selecionado! A integração direta via PIX/Apoia.se entrará no ar em instantes. Obrigado por fortalecer a Forja Rubra!`);
      });
    });

    backdrop.hidden = false;
    backdrop.style.display = 'grid';
  }

  function renderizarRodape() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('mapViewport')) return;

    // Verificar se a página tem contêiner para o rodapé
    let footer = document.getElementById('forjaGlobalFooter');
    if (!footer) {
      // Se não existir, criar e anexar ao final do body (se for página apropriada)
      const allowedPages = ['index.html', 'personagens.html', 'grimorio.html', 'loja.html', 'taverna.html', 'termos.html', 'oficina.html', 'recompensas.html'];
      const pathname = window.location.pathname.split('/').pop() || 'index.html';
      if (!allowedPages.includes(pathname) && pathname !== '') return;

      footer = document.createElement('footer');
      footer.id = 'forjaGlobalFooter';
      footer.className = 'forja-footer';
      document.body.appendChild(footer);
    }

    footer.innerHTML = `
      <div class="forja-footer-container">
        <!-- Banner Superior de Membro / Apoio -->
        <div class="forja-footer-support-banner">
          <div class="forja-footer-support-text">
            <h3 class="forja-footer-support-title">SEJA MEMBRO DA FORJA RUBRA</h3>
            <p class="forja-footer-support-desc">Ajude a manter o projeto vivo, sustente a infraestrutura e desbloqueie recursos exclusivos.</p>
          </div>
          <button class="button forja-support-pill-btn" id="footerSupportBannerBtn" type="button">Seja Membro</button>
        </div>

        <div class="forja-footer-top">
          <!-- Coluna Marca -->
          <div class="forja-footer-brand-col">
            <a class="forja-footer-brand" href="index.html">
              <span style="color:#d97706">${getIcon('flame', 'icon-lg')}</span>
              <span class="forja-footer-brand-title">Forja Rubra</span>
            </a>
            <p class="forja-footer-tagline">
              A forja definitiva para heróis e aventureiros de Tormenta 20. Crie fichas completas, gerencie seu arsenal e viva lendas em Arton.
            </p>
          </div>

          <!-- Coluna 1: Ferramentas -->
          <div class="forja-footer-col">
            <div class="forja-footer-heading">Ferramentas</div>
            <ul class="forja-footer-list">
              <li><a class="forja-footer-link" href="criador.html?novo=true">Criar Ficha</a></li>
              <li><span class="forja-footer-link" style="opacity:0.6;cursor:default">Gerador de Ameaças <span class="forja-badge-soon">Em breve</span></span></li>
              <li><a class="forja-footer-link" href="loja.html">Arsenal de Equipamentos</a></li>
              <li><a class="forja-footer-link" href="grimorio.html">Grimório de Magias</a></li>
              <li><a class="forja-footer-link" href="taverna.html">Taverna de Aliados</a></li>
              <li><a class="forja-footer-link" href="recompensas.html">Tesouros do Mestre</a></li>
            </ul>
          </div>

          <!-- Coluna 2: Enciclopédia -->
          <div class="forja-footer-col">
            <div class="forja-footer-heading">Enciclopédia</div>
            <ul class="forja-footer-list">
              <li><a class="forja-footer-link" href="criador.html">Raças de Arton</a></li>
              <li><a class="forja-footer-link" href="criador.html">Classes & Habilidades</a></li>
              <li><a class="forja-footer-link" href="criador.html">Origens & Regionais</a></li>
              <li><a class="forja-footer-link" href="criador.html">Panteão & Divindades</a></li>
              <li><a class="forja-footer-link" href="grimorio.html">Repertório Arcano/Divino</a></li>
            </ul>
          </div>

          <!-- Coluna 3: Comunidade -->
          <div class="forja-footer-col">
            <div class="forja-footer-heading">Comunidade</div>
            <ul class="forja-footer-list">
              <li><span class="forja-footer-link" style="opacity:0.6;cursor:default">Mesas Virtuais <span class="forja-badge-soon">Em breve</span></span></li>
              <li><span class="forja-footer-link" style="opacity:0.6;cursor:default">Explorar Builds <span class="forja-badge-soon">Em breve</span></span></li>
              <li><span class="forja-footer-link" style="opacity:0.6;cursor:default">Caverna do Saber <span class="forja-badge-soon">Em breve</span></span></li>
              <li><a class="forja-footer-link" href="mapa.html">Mapa de Arton</a></li>
            </ul>
          </div>

          <!-- Coluna 4: Conta -->
          <div class="forja-footer-col">
            <div class="forja-footer-heading">Conta</div>
            <ul class="forja-footer-list">
              <li><a class="forja-footer-link" href="personagens.html">Meus Personagens</a></li>
              <li><span class="forja-footer-link" style="opacity:0.6;cursor:default">Minhas Ameaças <span class="forja-badge-soon">Em breve</span></span></li>
              <li><button class="forja-footer-link highlight" id="footerSupportBtn" type="button">Seja Membro</button></li>
            </ul>
          </div>

          <!-- Coluna 5: Legal -->
          <div class="forja-footer-col">
            <div class="forja-footer-heading">Legal</div>
            <ul class="forja-footer-list">
              <li><a class="forja-footer-link" href="termos.html">Termos de Uso</a></li>
            </ul>
          </div>
        </div>

        <div class="forja-footer-bottom">
          <div class="forja-footer-bottom-main">
            <div>© 2026 Forja Rubra · Desenvolvido com honra para a comunidade de RPG · V1.0.0</div>
            <div>Feito por aventureiros, para aventureiros</div>
          </div>
          <p class="forja-footer-ogl">
            Tormenta 20 é uma marca registrada de Jambô Editora. Todo o material do jogo aqui contido respeita a Open Game License (OGL 1.0a) ou diretrizes comunitárias de RPG. Este site é um projeto de fãs independente e sem afiliação direta com a Jambô Editora.
          </p>
        </div>
      </div>
    `;

    // Vincular botões do rodapé
    document.getElementById('footerSupportBannerBtn')?.addEventListener('click', abrirApoio);
    document.getElementById('footerSupportBtn')?.addEventListener('click', abrirApoio);
  }

  window.ForjaModais = Object.freeze({
    abrirTermos,
    abrirApoio
  });

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', renderizarRodape);
    } else {
      renderizarRodape();
    }
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('forja-ready', renderizarRodape);
  }
})();
