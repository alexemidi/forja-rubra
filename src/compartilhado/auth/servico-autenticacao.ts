/**
 * Serviço de Autenticação da Forja T20.
 * Fornece login via Google OAuth, logout, leitura de perfil e observabilidade de sessão.
 */
(() => {
  'use strict';

  function criarServicoAutenticacao(supabaseClient = null) {
    let client = supabaseClient;
    const listeners = new Set();
    let usuarioAtual = null;

    function definirCliente(novoCliente) {
      client = novoCliente;
      if (client && client.auth) {
        client.auth.onAuthStateChange((evento, session) => {
          usuarioAtual = session?.user || null;
          notificarListeners(evento, usuarioAtual);
        });
      }
    }

    if (client) {
      definirCliente(client);
    }

    function notificarListeners(evento, user) {
      listeners.forEach(fn => {
        try {
          fn(evento, user);
        } catch (e) {
          console.error('[Forja Auth] Erro no listener de autenticação:', e);
        }
      });
    }

    async function loginComGoogle(redirectTo = null) {
      if (!client || !client.auth) {
        throw new Error('Serviço de autenticação não configurado no momento.');
      }

      const redirect = redirectTo || (typeof window !== 'undefined' ? window.location.origin + window.location.pathname : undefined);

      const { data, error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirect,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (error) {
        throw error;
      }

      return data;
    }

    async function logout() {
      if (!client || !client.auth) {
        usuarioAtual = null;
        notificarListeners('SIGNED_OUT', null);
        return;
      }

      const { error } = await client.auth.signOut();
      usuarioAtual = null;
      if (error) {
        throw error;
      }
      notificarListeners('SIGNED_OUT', null);
    }

    async function obterSessao() {
      if (!client || !client.auth) {
        return null;
      }
      try {
        const { data, error } = await client.auth.getSession();
        if (error || !data?.session) return null;
        usuarioAtual = data.session.user;
        return data.session;
      } catch {
        return null;
      }
    }

    function obterUsuarioAtual() {
      return usuarioAtual;
    }

    function estaAutenticado() {
      return Boolean(usuarioAtual && usuarioAtual.id);
    }

    function aoMudarEstado(callback) {
      if (typeof callback === 'function') {
        listeners.add(callback);
        // Notificação imediata do estado atual
        try {
          callback(estaAutenticado() ? 'INITIAL_SESSION' : 'NO_SESSION', usuarioAtual);
        } catch (e) {
          console.error('[Forja Auth] Erro ao disparar estado inicial:', e);
        }
      }
      return () => listeners.delete(callback);
    }

    return Object.freeze({
      definirCliente,
      loginComGoogle,
      logout,
      obterSessao,
      obterUsuarioAtual,
      estaAutenticado,
      aoMudarEstado
    });
  }

  // Instância singleton padrão para o ciclo de vida do app
  let servicoPadrao = null;

  function obterServicoAutenticacao() {
    if (!servicoPadrao) {
      const cfg = typeof window !== 'undefined' && window.SupabaseConfig ? window.SupabaseConfig : null;
      const client = cfg ? cfg.criarClienteSupabase() : null;
      servicoPadrao = criarServicoAutenticacao(client);
    }
    return servicoPadrao;
  }

  const ModuloAuth = Object.freeze({
    criarServicoAutenticacao,
    obterServicoAutenticacao
  });

  if (typeof window !== 'undefined') {
    window.ModuloAuth = ModuloAuth;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModuloAuth;
  }
})();
