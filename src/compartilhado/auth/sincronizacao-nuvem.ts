/**
 * Serviço de Sincronização em Nuvem (Multi-Tenant) para Fichas da Forja T20.
 * Garante que todas as operações no banco utilizem isolamento estrito por usuário.
 */
(() => {
  'use strict';

  function criarServicoSincronizacao(supabaseClient = null, authService = null) {
    let client = supabaseClient;
    let auth = authService;

    function definirDependencias(novoClient, novoAuth) {
      if (novoClient) client = novoClient;
      if (novoAuth) auth = novoAuth;
    }

    async function salvarFichaNuvem(state, characterId = null) {
      if (!client) {
        return { ok: false, error: 'Cliente de nuvem não inicializado.' };
      }

      const user = auth ? auth.obterUsuarioAtual() : null;
      if (!user || !user.id) {
        return { ok: false, error: 'Usuário não autenticado.' };
      }

      try {
        const charName = state?.identity?.characterName?.trim() || 'Herói sem Nome';
        const level = Number(state?.identity?.editingLevel || state?.identity?.initialLevel || 1);
        const classId = state?.identity?.classId || null;
        const raceId = state?.identity?.raceId || null;

        const payload = {
          user_id: user.id,
          name: charName,
          level: Math.max(1, Math.min(20, level)),
          class_id: classId,
          race_id: raceId,
          snapshot: state,
          updated_at: new Date().toISOString()
        };

        if (characterId) {
          payload.id = characterId;
        }

        const { data, error } = await client
          .from('characters')
          .upsert(payload, { onConflict: 'id' })
          .select()
          .single();

        if (error) {
          console.error('[Forja Sincronização] Erro ao salvar ficha na nuvem:', error);
          return { ok: false, error: error.message };
        }

        return { ok: true, character: data };
      } catch (err) {
        console.error('[Forja Sincronização] Falha inesperada ao sincronizar:', err);
        return { ok: false, error: String(err.message || err) };
      }
    }

    async function listarFichasNuvem() {
      if (!client) {
        return { ok: false, data: [], error: 'Cliente de nuvem indisponível.' };
      }

      const user = auth ? auth.obterUsuarioAtual() : null;
      if (!user || !user.id) {
        return { ok: false, data: [], error: 'Usuário não autenticado.' };
      }

      try {
        const { data, error } = await client
          .from('characters')
          .select('id, name, level, class_id, race_id, updated_at, created_at')
          .order('updated_at', { ascending: false });

        if (error) {
          console.error('[Forja Sincronização] Erro ao listar fichas da nuvem:', error);
          return { ok: false, data: [], error: error.message };
        }

        return { ok: true, data: Array.isArray(data) ? data : [] };
      } catch (err) {
        console.error('[Forja Sincronização] Falha ao listar fichas:', err);
        return { ok: false, data: [], error: String(err.message || err) };
      }
    }

    async function carregarFichaNuvem(characterId) {
      if (!client || !characterId) {
        return { ok: false, error: 'Parâmetros inválidos ou cliente indisponível.' };
      }

      try {
        const { data, error } = await client
          .from('characters')
          .select('*')
          .eq('id', characterId)
          .single();

        if (error) {
          return { ok: false, error: error.message };
        }

        return { ok: true, character: data };
      } catch (err) {
        return { ok: false, error: String(err.message || err) };
      }
    }

    async function excluirFichaNuvem(characterId) {
      if (!client || !characterId) {
        return { ok: false, error: 'ID da ficha ausente.' };
      }

      try {
        const { error } = await client
          .from('characters')
          .delete()
          .eq('id', characterId);

        if (error) {
          return { ok: false, error: error.message };
        }

        return { ok: true };
      } catch (err) {
        return { ok: false, error: String(err.message || err) };
      }
    }

    return Object.freeze({
      definirDependencias,
      salvarFichaNuvem,
      listarFichasNuvem,
      carregarFichaNuvem,
      excluirFichaNuvem
    });
  }

  let servicoSincPadrao = null;

  function obterServicoSincronizacao() {
    if (!servicoSincPadrao) {
      const cfg = typeof window !== 'undefined' && window.SupabaseConfig ? window.SupabaseConfig : null;
      const client = cfg ? cfg.criarClienteSupabase() : null;
      const auth = typeof window !== 'undefined' && window.ModuloAuth ? window.ModuloAuth.obterServicoAutenticacao() : null;
      servicoSincPadrao = criarServicoSincronizacao(client, auth);
    }
    return servicoSincPadrao;
  }

  const ModuloSincronizacao = Object.freeze({
    criarServicoSincronizacao,
    obterServicoSincronizacao
  });

  if (typeof window !== 'undefined') {
    window.ModuloSincronizacao = ModuloSincronizacao;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModuloSincronizacao;
  }
})();
