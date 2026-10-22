/**
 * FORJA RUBRA — Módulo de Compartilhamento de Fichas (Tormenta 20)
 * Permite gerar links de compartilhamento universais e importar fichas recebidas para os personagens salvos.
 */

(() => {
  'use strict';

  function codificarFicha(snapshot: any): string {
    try {
      const json = JSON.stringify(snapshot);
      // Compactar com pako se disponível no runtime
      if (typeof (window as any).pako?.deflate === 'function') {
        const deflated = (window as any).pako.deflate(json, { to: 'string' });
        return 'z_' + btoa(deflated).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      }
      // Fallback base64 url-safe
      return 'b_' + btoa(unescape(encodeURIComponent(json))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } catch (e) {
      console.error('Erro ao codificar ficha:', e);
      return '';
    }
  }

  function decodificarFicha(codigo: string): any {
    try {
      if (!codigo) return null;
      if (codigo.startsWith('z_')) {
        const base64 = codigo.slice(2).replace(/-/g, '+').replace(/_/g, '/');
        const binary = atob(base64);
        if (typeof (window as any).pako?.inflate === 'function') {
          const inflated = (window as any).pako.inflate(binary, { to: 'string' });
          return JSON.parse(inflated);
        }
      } else if (codigo.startsWith('b_')) {
        const base64 = codigo.slice(2).replace(/-/g, '+').replace(/_/g, '/');
        const json = decodeURIComponent(escape(atob(base64)));
        return JSON.parse(json);
      }
      // Tentativa direta se não tiver prefixo
      const base64 = codigo.replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(escape(atob(base64)));
      return JSON.parse(json);
    } catch (e) {
      console.error('Erro ao decodificar ficha compartilhada:', e);
      return null;
    }
  }

  async function copiarParaAreaDeTransferencia(texto: string): Promise<boolean> {
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(texto);
        return true;
      }
    } catch {}
    try {
      const textarea = document.createElement('textarea');
      textarea.value = texto;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      textarea.style.left = '-9999px';
      textarea.style.top = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const sucesso = document.execCommand('copy');
      textarea.remove();
      return Boolean(sucesso);
    } catch {
      return false;
    }
  }

  function abrirModalCompartilhamento(url: string, nomeHeroi: string) {
    let modal = document.getElementById('forjaShareModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'forjaShareModal';
      modal.className = 'modal-backdrop forja-share-modal-backdrop';
      document.body.appendChild(modal);

      modal.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target === modal || target.closest('[data-action="close-share-modal"]')) {
          modal.hidden = true;
        }
      });
    }

    const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

    modal.innerHTML = `
      <div class="confirm-modal forja-share-card" role="dialog" aria-labelledby="shareModalTitle" style="max-width: 480px; width: 92%; background: linear-gradient(180deg, #181114, #100b0d); border: 1px solid var(--border, #4a252a); border-radius: 12px; box-shadow: 0 16px 40px rgba(0,0,0,0.8); overflow: hidden;">
        <header style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid var(--border,#4a252a);background:#110d0f;">
          <div style="display:flex;align-items:center;gap:8px;">
            <svg class="forja-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--forja-red,#c51f2c)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
            <h3 id="shareModalTitle" style="margin:0;font-family:'Tormenta',Cinzel,serif;color:var(--gold,#e9ad59);font-size:1.05rem;">Compartilhar Ficha</h3>
          </div>
          <button type="button" class="button" data-action="close-share-modal" style="min-width:28px;padding:2px 6px;font-size:0.9rem;" title="Fechar">✕</button>
        </header>

        <div style="padding:16px;">
          <p style="margin:0 0 10px;font-size:0.82rem;color:var(--muted,#c9b2aa);line-height:1.45;">
            Copie o link abaixo para enviar a ficha de <strong style="color:var(--cream,#f5eee6);">${nomeHeroi || 'seu herói'}</strong> para outros jogadores ou para o seu mestre.
          </p>

          <div style="display:flex;gap:8px;margin-bottom:12px;">
            <input type="text" id="forjaShareUrlInput" readonly value="${url}" style="flex:1;background:#100b0d;border:1px solid var(--border,#4a252a);border-radius:6px;padding:8px 10px;color:#fcedaa;font-size:0.8rem;outline:none;" onfocus="this.select();">
            <button type="button" class="button primary" id="forjaCopyShareBtn" style="white-space:nowrap;background:var(--forja-red,#c51f2c);border-color:var(--border,#4a252a);">
              Copiar Link
            </button>
          </div>

          <small style="display:block;color:var(--dim,#8c7a72);font-size:0.72rem;line-height:1.35;">
            Quem abrir o link poderá visualizar a ficha completa e salvá-la em seus próprios heróis.
          </small>
        </div>

        ${canNativeShare ? `
          <footer style="display:flex;justify-content:flex-end;gap:8px;padding:12px 16px;border-top:1px solid var(--border,#4a252a);background:#110d0f;">
            <button type="button" class="button" id="forjaNativeShareBtn" style="display:inline-flex;align-items:center;gap:6px;">
              <svg class="forja-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
              <span>Enviar via App</span>
            </button>
          </footer>
        ` : ''}
      </div>
    `;

    modal.hidden = false;

    const copyBtn = modal.querySelector('#forjaCopyShareBtn');
    const input = modal.querySelector('#forjaShareUrlInput') as HTMLInputElement;
    if (copyBtn && input) {
      copyBtn.addEventListener('click', async () => {
        input.select();
        const ok = await copiarParaAreaDeTransferencia(url);
        if (ok) {
          copyBtn.textContent = 'Copiado!';
          copyBtn.classList.add('success');
          if (typeof (window as any).toast === 'function') {
            (window as any).toast('Link de compartilhamento copiado para a área de transferência!');
          }
          setTimeout(() => {
            copyBtn.textContent = 'Copiar Link';
            copyBtn.classList.remove('success');
          }, 2500);
        } else {
          if (typeof (window as any).toast === 'function') {
            (window as any).toast('Link selecionado. Pressione Ctrl+C para copiar.');
          }
        }
      });
    }

    const nativeBtn = modal.querySelector('#forjaNativeShareBtn');
    if (nativeBtn && canNativeShare) {
      nativeBtn.addEventListener('click', async () => {
        try {
          await navigator.share({
            title: `Ficha de ${nomeHeroi || 'Personagem'} · Forja Rubra (Tormenta 20)`,
            text: `Confira a ficha de ${nomeHeroi || 'meu herói'} na Forja Rubra:`,
            url: url
          });
        } catch {}
      });
    }
  }

  function compartilharPersonagemAtual() {
    let s = typeof window !== 'undefined' ? (window as any).state : null;
    if (!s && typeof (window as any).characterStorage !== 'undefined') {
      try {
        s = (window as any).characterStorage.ler('forja-heroi-t20-v1', null);
      } catch {}
    }
    if (!s) {
      try {
        const raw = localStorage.getItem('forja-heroi-t20-v1');
        if (raw) s = JSON.parse(raw);
      } catch {}
    }
    if (!s) {
      if (typeof (window as any).toast === 'function') {
        (window as any).toast('Nenhuma ficha ativa encontrada para compartilhar.', 'warning');
      }
      return;
    }

    // Snapshot limpo e compatível
    const snapshot = (typeof (window as any).ModeloEstado?.migratePersistedState === 'function')
      ? (window as any).ModeloEstado.migratePersistedState(s)
      : s;

    const code = codificarFicha(snapshot);
    if (!code) {
      if (typeof (window as any).toast === 'function') {
        (window as any).toast('Não foi possível gerar o código de compartilhamento da ficha.', 'warning');
      }
      return;
    }

    const base = window.location.origin + window.location.pathname;
    const shareUrl = `${base}?compartilhar=${code}`;

    // Copiar diretamente e notificar de imediato
    copiarParaAreaDeTransferencia(shareUrl).then((ok) => {
      if (ok && typeof (window as any).toast === 'function') {
        (window as any).toast('Link de compartilhamento copiado com sucesso! Pronto para enviar.');
      }
    });

    abrirModalCompartilhamento(shareUrl, s.identity?.characterName || 'Personagem');
  }

  function verificarFichaCompartilhadaNaUrl() {
    if (typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.href);
      const codigo = url.searchParams.get('compartilhar') || url.searchParams.get('importar');
      if (!codigo) return;

      const snapshot = decodificarFicha(codigo);
      if (!snapshot) return;

      // Carregar snapshot no estado da sessão
      if (typeof (window as any).ModeloEstado?.normalizeState === 'function') {
        (window as any).state = (window as any).ModeloEstado.normalizeState(snapshot);
      } else {
        (window as any).state = snapshot;
      }

      (window as any).state.isViewingSharedCharacter = true;
      (window as any).state.sharedSnapshot = snapshot;

      // Injetar faixa de notificação com botão "Salvar nos Meus Personagens"
      setTimeout(() => {
        renderizarBarraFichaCompartilhada(snapshot);
      }, 250);
    } catch (e) {
      console.error('Falha ao processar link compartilhado:', e);
    }
  }

  function renderizarBarraFichaCompartilhada(snapshot: any) {
    if (document.getElementById('forjaSharedBanner')) return;

    const nome = snapshot.identity?.characterName || 'Herói Compartilhado';
    const banner = document.createElement('div');
    banner.id = 'forjaSharedBanner';
    banner.style.cssText = 'position:sticky;top:54px;left:0;right:0;z-index:9995;background:linear-gradient(90deg,#700d17,#3b0c11);border-bottom:1px solid var(--border,#4a252a);padding:10px 20px;display:flex;justify-content:space-between;align-items:center;gap:12px;box-shadow:0 4px 12px rgba(0,0,0,0.4);';
    banner.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;color:#fce09b;font-size:0.82rem;">
        <svg class="forja-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
        <span>Você está visualizando a ficha compartilhada de <strong style="color:#ffffff;">${nome}</strong>.</span>
      </div>
      <div style="display:flex;gap:8px;">
        <button type="button" class="button primary" id="salvarFichaCompartilhadaBtn" style="background:#dc2626;border-color:#b91c1c;padding:5px 14px;font-size:0.82rem;font-weight:bold;white-space:nowrap;">
          Salvar nos Meus Personagens
        </button>
      </div>
    `;

    document.body.prepend(banner);

    const saveBtn = banner.querySelector('#salvarFichaCompartilhadaBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        salvarFichaRecebidaNoElenco(snapshot);
      });
    }
  }

  function salvarFichaRecebidaNoElenco(snapshot: any) {
    try {
      // 1. Verificar limite de personagens
      const storage = typeof (window as any).characterStorage !== 'undefined' ? (window as any).characterStorage : null;
      const getRoster = () => {
        try {
          const raw = localStorage.getItem('forja-heroi-t20-personagens-v1') || localStorage.getItem('forja-roster-t20-v1') || '[]';
          return JSON.parse(raw);
        } catch {
          return [];
        }
      };

      const roster = getRoster();
      const limite = (typeof (window as any).LimitesForja?.limiteFichasAtivo === 'function')
        ? (window as any).LimitesForja.limiteFichasAtivo()
        : 20;

      if (Array.isArray(roster) && roster.length >= limite) {
        if (typeof (window as any).toast === 'function') {
          (window as any).toast(`Você atingiu o limite de ${limite} fichas salvas. Exclua uma ficha para salvar esta.`, 'warning');
        }
        return;
      }

      // 2. Criar novo registro com ID independente
      const novoId = 'char_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
      const novoSnapshot = structuredClone(snapshot);
      if (novoSnapshot.identity) {
        novoSnapshot.identity.characterId = novoId;
      }
      delete novoSnapshot.isViewingSharedCharacter;
      delete novoSnapshot.sharedSnapshot;

      const novoHeroi = {
        id: novoId,
        nome: novoSnapshot.identity?.characterName || 'Herói Compartilhado',
        classe: novoSnapshot.identity?.classId || 'Aventureiro',
        raca: novoSnapshot.identity?.raceId || 'Humano',
        nivel: novoSnapshot.identity?.plannedLevel || 1,
        atualizadoEm: new Date().toISOString(),
        snapshot: novoSnapshot
      };

      roster.push(novoHeroi);
      localStorage.setItem('forja-heroi-t20-personagens-v1', JSON.stringify(roster));
      localStorage.setItem('forja-heroi-t20-v1', JSON.stringify(novoSnapshot));

      // Limpar parâmetro da URL
      if (window.history?.replaceState) {
        const cleanUrl = window.location.pathname + (window.location.hash || '');
        window.history.replaceState(null, '', cleanUrl);
      }

      document.getElementById('forjaSharedBanner')?.remove();

      if (typeof (window as any).toast === 'function') {
        (window as any).toast('Ficha salva com sucesso em Seus Personagens!');
      }

      if (typeof (window as any).renderStage === 'function') {
        (window as any).renderStage();
      }
    } catch (e) {
      console.error('Erro ao salvar ficha compartilhada:', e);
      if (typeof (window as any).toast === 'function') {
        (window as any).toast('Erro ao salvar a ficha compartilhada.', 'error');
      }
    }
  }

  // Delegação global de clique para botão compartilhar
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-sheet-action="share-character"], [data-action="share-character"], .sheet-share-btn')) {
      e.preventDefault();
      e.stopPropagation();
      compartilharPersonagemAtual();
    }
  }, true);

  // Expor e auto-executar na inicialização
  if (typeof window !== 'undefined') {
    (window as any).ForjaCompartilhamento = Object.freeze({
      compartilhar: compartilharPersonagemAtual,
      codificar: codificarFicha,
      decodificar: decodificarFicha
    });

    window.addEventListener('forja-ready', verificarFichaCompartilhadaNaUrl);
    if (document.documentElement.dataset.forjaReady === 'true') {
      verificarFichaCompartilhadaNaUrl();
    }
  }
})();
