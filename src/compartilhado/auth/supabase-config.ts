/**
 * Configuração e inicialização do cliente Supabase para a Forja T20.
 * Suporta injeção de ambiente para testes e execução no navegador.
 */
(() => {
  'use strict';

  // Configurações padrão (podem ser substituídas via window.__FORJA_ENV__ ou localStorage)
  const DEFAULT_CONFIG = {
    // URL do projeto Supabase (ex: https://xyzcompany.supabase.co)
    supabaseUrl: (typeof window !== 'undefined' && window.__FORJA_ENV__?.SUPABASE_URL) || '',
    // Chave anônima pública (anon key) segura para uso no cliente
    supabaseAnonKey: (typeof window !== 'undefined' && window.__FORJA_ENV__?.SUPABASE_ANON_KEY) || ''
  };

  function obterConfiguracao() {
    let url = DEFAULT_CONFIG.supabaseUrl;
    let anonKey = DEFAULT_CONFIG.supabaseAnonKey;

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const storedUrl = window.localStorage.getItem('forja-supabase-url');
        const storedKey = window.localStorage.getItem('forja-supabase-anon-key');
        if (storedUrl) url = storedUrl;
        if (storedKey) anonKey = storedKey;
      } catch {
        // Fallback silencioso se localStorage estiver bloqueado
      }
    }

    return {
      supabaseUrl: url,
      supabaseAnonKey: anonKey,
      isConfigured: Boolean(url && anonKey)
    };
  }

  function criarClienteSupabase(customConfig = null, customFactory = null) {
    // A versão de validação só conecta à nuvem mediante ativação explícita.
    if (!customFactory && typeof window !== 'undefined' && window.__FORJA_ENV__?.ENABLE_CLOUD !== true) return null;
    const config = customConfig || obterConfiguracao();
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      return null;
    }

    if (typeof customFactory === 'function') {
      return customFactory(config.supabaseUrl, config.supabaseAnonKey);
    }

    if (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function') {
      return window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
    }

    return null;
  }

  const SupabaseConfig = Object.freeze({
    obterConfiguracao,
    criarClienteSupabase
  });

  if (typeof window !== 'undefined') {
    window.SupabaseConfig = SupabaseConfig;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SupabaseConfig;
  }
})();
