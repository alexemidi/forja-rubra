/**
 * FORJA RUBRA - Modal Intermediário e de Configuração de Regras da Campanha
 * Permite ao jogador configurar as regras opcionais antes da criação e a qualquer momento via Menu.
 */

(() => {
  'use strict';

  function obterRegras() {
    const s = typeof window !== 'undefined' ? (window as any).state : null;
    if (typeof (window as any).RegrasCampanha !== 'undefined' && s) {
      return (window as any).RegrasCampanha.obterRegrasCampanha(s);
    }
    return {
      idade: 'desativada',
      faixaBasico: 'adulto',
      anos: 20,
      racasAbertas: false,
      complicacoes: false,
      devocoesAbertas: true,
      origemModo: 'single'
    };
  }

  function renderModalHtml(): string {
    const regras = obterRegras();

    return `
      <div id="regrasCampanhaModal" class="modal-backdrop" hidden>
        <div class="confirm-modal regras-campanha-dialog" role="dialog" aria-labelledby="regrasModalTitle" style="max-width: 620px;">
          <header style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="color:var(--gold);display:inline-flex;align-items:center;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
              </span>
              <div>
                <h3 id="regrasModalTitle" style="margin:0;font-family:'Tormenta',Cinzel,serif;color:var(--gold);font-size:1.15rem;">Regras da Campanha & Variantes</h3>
                <small style="color:var(--muted);font-size:0.75rem;">Defina quais regras opcionais da sua mesa serão aplicadas nesta ficha.</small>
              </div>
            </div>
            <button type="button" class="button" data-action="fechar-regras-modal" style="min-width:32px;padding:4px 8px;font-size:1rem;" title="Fechar">✕</button>
          </header>

          <div class="confirm-modal-body" style="display:grid;gap:14px;padding:16px;">
            <!-- 1. Regras de Idade -->
            <div class="choice-section" style="border:1px solid var(--border);border-radius:8px;padding:12px;background:#100b0d;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <strong style="color:var(--gold2);font-family:'Tormenta',Cinzel,serif;font-size:0.88rem;">1. Regras de Idade</strong>
                <span class="tag ${regras.idade !== 'desativada' ? 'gold' : 'amber'}">${regras.idade === 'desativada' ? 'Desativada' : (regras.idade === 'basico' ? 'Livro Básico' : 'Heróis de Arton')}</span>
              </div>
              <p class="help" style="margin-bottom:10px;font-size:0.72rem;line-height:1.45;">Escolha se a idade terá impacto mecânico nos atributos do seu personagem.</p>
              
              <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(160px, 1fr));gap:8px;margin-bottom:10px;">
                <label class="check-card ${regras.idade === 'desativada' ? 'selected' : ''}" style="cursor:pointer;padding:8px 10px;">
                  <input type="radio" name="regras_idade" value="desativada" ${regras.idade === 'desativada' ? 'checked' : ''} style="margin-right:6px;">
                  <span><strong>Idade Narrativa</strong><small style="display:block;">Desativada (Padrão)</small></span>
                </label>
                <label class="check-card ${regras.idade === 'basico' ? 'selected' : ''}" style="cursor:pointer;padding:8px 10px;">
                  <input type="radio" name="regras_idade" value="basico" ${regras.idade === 'basico' ? 'checked' : ''} style="margin-right:6px;">
                  <span><strong>Livro Básico</strong><small style="display:block;">Jogo do Ano (Cumulativo)</small></span>
                </label>
                <label class="check-card ${regras.idade === 'herois_arton' ? 'selected' : ''}" style="cursor:pointer;padding:8px 10px;">
                  <input type="radio" name="regras_idade" value="herois_arton" ${regras.idade === 'herois_arton' ? 'checked' : ''} style="margin-right:6px;">
                  <span><strong>Heróis de Arton</strong><small style="display:block;">Com Complicações</small></span>
                </label>
              </div>

              <!-- Sub-opções do Livro Básico -->
              <div id="regrasIdadeBasicoContainer" style="display:${regras.idade === 'basico' ? 'block' : 'none'};background:#181114;border:1px solid var(--border);border-radius:6px;padding:10px;margin-top:8px;">
                <strong style="color:var(--gold);font-size:0.78rem;display:block;margin-bottom:6px;">Faixa Etária (Livro Básico):</strong>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;">
                  <label class="check-card ${regras.faixaBasico === 'adulto' ? 'selected' : ''}" style="padding:6px 8px;font-size:0.72rem;">
                    <input type="radio" name="faixa_basico" value="adulto" ${regras.faixaBasico === 'adulto' ? 'checked' : ''}>
                    <span><strong>Adulto</strong><small style="display:block;">Sem modif.</small></span>
                  </label>
                  <label class="check-card ${regras.faixaBasico === 'maduro' ? 'selected' : ''}" style="padding:6px 8px;font-size:0.72rem;">
                    <input type="radio" name="faixa_basico" value="maduro" ${regras.faixaBasico === 'maduro' ? 'checked' : ''}>
                    <span><strong>Maduro (45+)</strong><small style="display:block;">-1 Fis / +1 Men</small></span>
                  </label>
                  <label class="check-card ${regras.faixaBasico === 'velho' ? 'selected' : ''}" style="padding:6px 8px;font-size:0.72rem;">
                    <input type="radio" name="faixa_basico" value="velho" ${regras.faixaBasico === 'velho' ? 'checked' : ''}>
                    <span><strong>Velho (70+)</strong><small style="display:block;">-3 Fis / +2 Men</small></span>
                  </label>
                </div>
                <small class="help" style="display:block;margin-top:6px;font-size:0.7rem;color:var(--muted);">
                  * Maduro (45 Anos): For –1, Des –1, Con –1, Int +1, Sab +1, Car +1.<br>
                  * Velho (70 Anos): For –3, Des –3, Con –3, Int +2, Sab +2, Car +2 (cumulativo). Longevidade Máxima: 70 + 2d20 anos.
                </small>
              </div>
            </div>

            <!-- 2. Raças Abertas -->
            <div class="choice-section" style="border:1px solid var(--border);border-radius:8px;padding:12px;background:#100b0d;">
              <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;">
                <input type="checkbox" id="regras_racas_abertas" ${regras.racasAbertas ? 'checked' : ''} style="margin-top:3px;">
                <div>
                  <strong style="color:var(--gold2);font-family:'Tormenta',Cinzel,serif;font-size:0.88rem;display:block;">2. Raças Abertas (Heróis de Arton)</strong>
                  <span style="font-size:0.72rem;color:var(--muted);line-height:1.45;display:block;">
                    Permite redistribuir os modificadores fixos da raça (ex: +2 / +1 / -1) livremente entre quaisquer atributos sem repetir atributo.
                  </span>
                </div>
              </label>
            </div>

            <!-- 3. Devoções Abertas -->
            <div class="choice-section" style="border:1px solid var(--border);border-radius:8px;padding:12px;background:#100b0d;">
              <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;">
                <input type="checkbox" id="regras_devocoes_abertas" ${regras.devocoesAbertas ? 'checked' : ''} style="margin-top:3px;">
                <div>
                  <strong style="color:var(--gold2);font-family:'Tormenta',Cinzel,serif;font-size:0.88rem;display:block;">3. Devoções Abertas (Recomendado / Padrão)</strong>
                  <span style="font-size:0.72rem;color:var(--muted);line-height:1.45;display:block;">
                    Permite que qualquer classe possa se devotar a qualquer divindade de Tormenta 20 sem restrição rígida de classe.
                  </span>
                </div>
              </label>
            </div>

            <!-- 4. Complicações -->
            <div class="choice-section" style="border:1px solid var(--border);border-radius:8px;padding:12px;background:#100b0d;">
              <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;">
                <input type="checkbox" id="regras_complicacoes" ${regras.complicacoes ? 'checked' : ''} style="margin-top:3px;">
                <div>
                  <strong style="color:var(--gold2);font-family:'Tormenta',Cinzel,serif;font-size:0.88rem;display:block;">4. Regra de Complicações</strong>
                  <span style="font-size:0.72rem;color:var(--muted);line-height:1.45;display:block;">
                    Permite ao personagem adquirir uma complicação permanente para receber 1 poder geral extra na criação.
                  </span>
                </div>
              </label>
            </div>

            <!-- 5. Modo de Origem -->
            <div class="choice-section" style="border:1px solid var(--border);border-radius:8px;padding:12px;background:#100b0d;">
              <strong style="color:var(--gold2);font-family:'Tormenta',Cinzel,serif;font-size:0.88rem;display:block;margin-bottom:6px;">5. Modo de Origem</strong>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                <label class="check-card ${regras.origemModo === 'single' ? 'selected' : ''}" style="cursor:pointer;padding:8px 10px;">
                  <input type="radio" name="regras_origem" value="single" ${regras.origemModo === 'single' ? 'checked' : ''} style="margin-right:6px;">
                  <span><strong>Origem Única</strong><small style="display:block;">Padrão (2 benefícios)</small></span>
                </label>
                <label class="check-card ${regras.origemModo === 'dual' ? 'selected' : ''}" style="cursor:pointer;padding:8px 10px;">
                  <input type="radio" name="regras_origem" value="dual" ${regras.origemModo === 'dual' ? 'checked' : ''} style="margin-right:6px;">
                  <span><strong>Dupla Origem</strong><small style="display:block;">Padrão + Regional</small></span>
                </label>
              </div>
            </div>
          </div>

          <footer style="display:flex;justify-content:flex-end;gap:10px;padding:12px 16px;border-top:1px solid var(--border);">
            <button type="button" class="button" data-action="fechar-regras-modal">Cancelar</button>
            <button type="button" class="button primary" id="confirmarRegrasCampanhaBtn" style="background:var(--forja-red);border-color:var(--border);">
              Confirmar & Iniciar
            </button>
          </footer>
        </div>
      </div>
    `;
  }

  function garantirModal(): HTMLElement {
    let el = document.getElementById('regrasCampanhaModal');
    if (!el) {
      const div = document.createElement('div');
      div.innerHTML = renderModalHtml();
      el = div.firstElementChild as HTMLElement;
      document.body.appendChild(el);
      vincularEventos();
    }
    return el;
  }

  function abrirModal(isInicio = false) {
    const modal = garantirModal();
    modal.outerHTML = renderModalHtml();
    const novoModal = document.getElementById('regrasCampanhaModal');
    if (novoModal) {
      novoModal.hidden = false;
      const btn = novoModal.querySelector('#confirmarRegrasCampanhaBtn');
      if (btn && !isInicio) {
        btn.textContent = 'Salvar Alterações';
      }
      vincularEventos();
    }
  }

  function fecharModal() {
    const modal = document.getElementById('regrasCampanhaModal');
    if (modal) modal.hidden = true;
  }

  function vincularEventos() {
    const modal = document.getElementById('regrasCampanhaModal');
    if (!modal) return;

    modal.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target === modal || target.closest('[data-action="fechar-regras-modal"]')) {
        fecharModal();
      }
    });

    modal.querySelectorAll('input[name="regras_idade"]').forEach(input => {
      input.addEventListener('change', (e) => {
        const val = (e.target as HTMLInputElement).value;
        const basicoCont = document.getElementById('regrasIdadeBasicoContainer');
        if (basicoCont) basicoCont.style.display = val === 'basico' ? 'block' : 'none';
        modal.querySelectorAll('input[name="regras_idade"]').forEach(inp => {
          inp.closest('.check-card')?.classList.toggle('selected', (inp as HTMLInputElement).checked);
        });
      });
    });

    modal.querySelectorAll('input[name="faixa_basico"]').forEach(input => {
      input.addEventListener('change', () => {
        modal.querySelectorAll('input[name="faixa_basico"]').forEach(inp => {
          inp.closest('.check-card')?.classList.toggle('selected', (inp as HTMLInputElement).checked);
        });
      });
    });

    modal.querySelectorAll('input[name="regras_origem"]').forEach(input => {
      input.addEventListener('change', () => {
        modal.querySelectorAll('input[name="regras_origem"]').forEach(inp => {
          inp.closest('.check-card')?.classList.toggle('selected', (inp as HTMLInputElement).checked);
        });
      });
    });

    const confirmBtn = modal.querySelector('#confirmarRegrasCampanhaBtn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        const idadeInput = modal.querySelector('input[name="regras_idade"]:checked') as HTMLInputElement;
        const faixaInput = modal.querySelector('input[name="faixa_basico"]:checked') as HTMLInputElement;
        const racasAbertasInput = modal.querySelector('#regras_racas_abertas') as HTMLInputElement;
        const complicacoesInput = modal.querySelector('#regras_complicacoes') as HTMLInputElement;
        const devocoesAbertasInput = modal.querySelector('#regras_devocoes_abertas') as HTMLInputElement;
        const origemInput = modal.querySelector('input[name="regras_origem"]:checked') as HTMLInputElement;

        const s = typeof window !== 'undefined' ? (window as any).state : null;
        if (s && typeof (window as any).RegrasCampanha !== 'undefined') {
          (window as any).RegrasCampanha.atualizarRegrasCampanha(s, {
            idade: (idadeInput?.value || 'desativada') as any,
            faixaBasico: (faixaInput?.value || 'adulto') as any,
            racasAbertas: Boolean(racasAbertasInput?.checked),
            complicacoes: Boolean(complicacoesInput?.checked),
            devocoesAbertas: Boolean(devocoesAbertasInput?.checked),
            origemModo: (origemInput?.value || 'single') as any
          });
          s.regrasCampanhaConfirmadas = true;
          if (typeof (window as any).persistNow === 'function') (window as any).persistNow();
          if (typeof (window as any).renderStage === 'function') (window as any).renderStage();
          if (typeof (window as any).toast === 'function') (window as any).toast('Regras da campanha configuradas com sucesso!');
        }

        fecharModal();
      });
    }
  }

  function verificarAutoAbertura() {
    if (typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.href);
      const isNovo = url.searchParams.get('novo') === 'true' || Boolean((window as any).__FORJA_IS_NOVO__);
      const isRegras = url.searchParams.get('regras') === 'true';
      const s = (window as any).state;
      const isNovaFicha = s && !s.regrasCampanhaConfirmadas && s.step === 1 && !s.finished && (!s.identity?.characterName || s.identity.characterName === '');

      if (isNovo || isRegras || isNovaFicha) {
        setTimeout(() => {
          abrirModal(true);
        }, 120);
      }
    } catch {}
  }

  // Expor globalmente
  if (typeof window !== 'undefined') {
    (window as any).abrirModalRegrasCampanha = abrirModal;
    (window as any).fecharModalRegrasCampanha = fecharModal;
    window.addEventListener('forja-ready', verificarAutoAbertura);
    if (document.documentElement.dataset.forjaReady === 'true') {
      verificarAutoAbertura();
    }
  }
})();
