/**
 * Componente de Interface de Usuário para Autenticação e Sincronização em Nuvem.
 * A identidade do usuário, login, logout imediato e sincronização foram
 * centralizados exclusivamente dentro do Menu Lateral Gaveta (Drawer),
 * deixando o cabeçalho superior limpo e sem poluição visual.
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

  function abrirModalConfiguracaoSupabase() {
    let modal = document.getElementById('forjaSupabaseSetupModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'forjaSupabaseSetupModal';
      modal.className = 'modal-backdrop';
      document.body.appendChild(modal);
    }

    const cfg = window.SupabaseConfig ? window.SupabaseConfig.obterConfiguracao() : { supabaseUrl: '', supabaseAnonKey: '' };

    modal.innerHTML = `
      <div class="modal" style="max-width: 480px;">
        <h2 style="font-family:'Cinzel',serif;font-size:1.15rem;margin-bottom:8px;color:#f7e0b5;">Configuração da Nuvem (Supabase)</h2>
        <p style="font-size:0.8rem;color:var(--text-muted);line-height:1.45;margin-bottom:14px;">
          Para habilitar o login com Google e o salvamento em nuvem, insira a URL e a chave pública (anon key) do seu projeto Supabase gratuito.
        </p>
        <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px;">
          <label style="font-size:0.75rem;color:var(--text-dim);">
            URL do Projeto (Project URL):
            <input type="text" id="supabaseSetupUrl" value="${esc(cfg.supabaseUrl)}" placeholder="https://seu-projeto.supabase.co" style="width:100%;margin-top:4px;padding:6px 8px;background:#14100c;border:1px solid var(--border);color:#fff;font-size:0.8rem;border-radius:3px;" />
          </label>
          <label style="font-size:0.75rem;color:var(--text-dim);">
            Chave Pública (Anon Key):
            <input type="password" id="supabaseSetupKey" value="${esc(cfg.supabaseAnonKey)}" placeholder="eyJh..." style="width:100%;margin-top:4px;padding:6px 8px;background:#14100c;border:1px solid var(--border);color:#fff;font-size:0.8rem;border-radius:3px;" />
          </label>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px;">
          <button class="button" type="button" id="btnFecharSetupSupabase">Cancelar</button>
          <button class="button button-accent" type="button" id="btnSalvarSetupSupabase">Salvar e Conectar</button>
        </div>
      </div>
    `;
    modal.hidden = false;

    document.getElementById('btnFecharSetupSupabase')?.addEventListener('click', () => {
      modal.hidden = true;
    });

    document.getElementById('btnSalvarSetupSupabase')?.addEventListener('click', () => {
      const url = document.getElementById('supabaseSetupUrl')?.value.trim();
      const key = document.getElementById('supabaseSetupKey')?.value.trim();
      if (url && key) {
        try {
          localStorage.setItem('forja-supabase-url', url);
          localStorage.setItem('forja-supabase-anon-key', key);
          modal.hidden = true;
          if (typeof window.toast === 'function') window.toast('Configurações de nuvem salvas!');
          window.location.reload();
        } catch (e) {
          alert('Não foi possível salvar no navegador.');
        }
      } else {
        alert('Por favor, preencha a URL e a Anon Key.');
      }
    });
  }

  function inicializarUIAutenticacao() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // Remover qualquer container de auth residual do cabeçalho superior
    const legacyContainer = document.getElementById('forjaAuthContainer');
    if (legacyContainer) {
      legacyContainer.remove();
    }
  }

  window.ForjaAuthUI = Object.freeze({
    abrirModalConfiguracaoSupabase
  });

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', inicializarUIAutenticacao);
    } else {
      inicializarUIAutenticacao();
    }
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('forja-ready', inicializarUIAutenticacao);
  }
})();
