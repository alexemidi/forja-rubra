/* Módulo de gerenciamento da mesa / campanha e transferência direta de recursos.
   Suporta persistência local no roster e sincronização com o herói ativo.
*/
const CampanhaMesa = (() => {
  'use strict';

  const ROSTER_KEY = 'forja-heroi-t20-personagens-v1';
  const ROSTER_FALLBACK_KEY = 'forja-roster-t20-v1';
  const ACTIVE_KEY = 'forja-heroi-t20-v1';

  function getStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    // Fallback em memória para testes Node
    if (typeof globalThis !== 'undefined' && globalThis.__mockStorage) {
      return globalThis.__mockStorage;
    }
    return {
      getItem: () => null,
      setItem: () => {}
    };
  }

  function obterRoster() {
    const storage = getStorage();
    try {
      const raw = storage.getItem(ROSTER_KEY) || storage.getItem(ROSTER_FALLBACK_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  function salvarRoster(lista) {
    const storage = getStorage();
    try {
      const serialized = JSON.stringify(lista);
      storage.setItem(ROSTER_KEY, serialized);
      storage.setItem(ROSTER_FALLBACK_KEY, serialized);
      return true;
    } catch (e) {
      console.error('CampanhaMesa: Erro ao salvar lista de heróis:', e);
      return false;
    }
  }

  function obterHeroiAtivo() {
    const storage = getStorage();
    try {
      const raw = storage.getItem(ACTIVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function salvarHeroiAtivo(snapshot) {
    const storage = getStorage();
    try {
      storage.setItem(ACTIVE_KEY, JSON.stringify(snapshot));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Retorna todos os heróis da mesa disponíveis para receber itens ou recompensas.
   * Se o herói ativo não estiver na lista, ele é integrado com id 'ativo'.
   */
  function listarHeroisMesa() {
    const roster = obterRoster();
    const ativo = obterHeroiAtivo();

    const herois = roster.map(h => ({
      id: h.id || h.name,
      nome: h.name || h.nome || 'Herói sem nome',
      raca: h.race || h.raca || 'Desconhecida',
      classe: h.class || h.classe || 'Aventureiro',
      nivel: h.level || h.nivel || 1,
      saldo: Number(h.snapshot?.funds ?? h.funds ?? 0),
      snapshot: h.snapshot || {}
    }));

    if (ativo && ativo.identity) {
      const idAtivo = ativo.identity.id || ativo.identity.characterName || 'ativo';
      const index = herois.findIndex(h => h.id === idAtivo);
      if (index === -1) {
        herois.unshift({
          id: idAtivo,
          nome: ativo.identity.characterName || 'Herói Ativo',
          raca: ativo.identity.raceId || 'Desconhecida',
          classe: (ativo.progression || [])[0]?.classId || 'Aventureiro',
          nivel: ativo.identity.plannedLevel || 1,
          saldo: Number(ativo.funds ?? 0),
          snapshot: ativo
        });
      } else {
        // Atualiza dados vivos do ativo se presente
        herois[index].saldo = Number(ativo.funds ?? herois[index].saldo);
        herois[index].snapshot = ativo;
      }
    }

    return herois;
  }

  /**
   * Concede ou altera o saldo de tibares de um herói da mesa.
   */
  function creditarTibaresHeroi(heroiId, valorTibares) {
    const quantia = Number(valorTibares) || 0;
    if (quantia <= 0) return { sucesso: false, mensagem: 'Valor inválido' };

    const roster = obterRoster();
    const ativo = obterHeroiAtivo();
    let modificado = false;

    // Atualiza no roster
    for (const h of roster) {
      if ((h.id && h.id === heroiId) || (!h.id && (h.name === heroiId || h.nome === heroiId))) {
        if (!h.snapshot) h.snapshot = {};
        h.snapshot.funds = (Number(h.snapshot.funds) || 0) + quantia;
        h.funds = h.snapshot.funds;
        modificado = true;
        break;
      }
    }

    // Se for o herói ativo na janela atual
    if (ativo) {
      const idAtivo = ativo.identity?.id || ativo.identity?.characterName || 'ativo';
      if (idAtivo === heroiId || ativo.identity?.characterName === heroiId) {
        ativo.funds = (Number(ativo.funds) || 0) + quantia;
        salvarHeroiAtivo(ativo);

        // Se estiver em runtime no browser com variável global state
        if (typeof window !== 'undefined' && window.state) {
          window.state.funds = (Number(window.state.funds) || 0) + quantia;
          if (typeof window.persistNow === 'function') window.persistNow();
        }
        modificado = true;
      }
    }

    if (modificado) {
      salvarRoster(roster);
      return { sucesso: true, quantiaCreditada: quantia };
    }

    return { sucesso: false, mensagem: 'Herói não encontrado' };
  }

  /**
   * Divide um valor total de tibares igualmente entre múltiplos heróis da mesa.
   */
  function dividirTibaresEntreHerois(valorTotal, heroisIds) {
    const total = Number(valorTotal) || 0;
    const ids = Array.isArray(heroisIds) ? heroisIds : [];
    if (total <= 0 || ids.length === 0) {
      return { sucesso: false, mensagem: 'Dados inválidos para divisão' };
    }

    const cota = Math.floor(total / ids.length);
    const sobra = total - (cota * ids.length);
    const resultados = [];

    ids.forEach(id => {
      const res = creditarTibaresHeroi(id, cota);
      resultados.push({ id, sucesso: res.sucesso, valor: cota });
    });

    return {
      sucesso: true,
      total,
      jogadores: ids.length,
      cotaIndividual: cota,
      sobraNaoDividida: sobra,
      resultados
    };
  }

  /**
   * Transfere um item diretamente para a mochila de um herói da mesa.
   */
  function adicionarItemHeroiMesa(heroiId, itemEntry) {
    if (!itemEntry || (!itemEntry.itemId && !itemEntry.nome && !itemEntry.name)) {
      return { sucesso: false, mensagem: 'Entrada de item inválida' };
    }

    const roster = obterRoster();
    const ativo = obterHeroiAtivo();
    let modificado = false;

    // Garante estrutura segura da entrada de item
    const novaEntrada = {
      ...itemEntry,
      uid: itemEntry.uid || `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      quantity: Number(itemEntry.quantity) || 1,
      origem: itemEntry.origem || 'recompensa_mestre'
    };

    // Atualiza no roster
    for (const h of roster) {
      if ((h.id && h.id === heroiId) || (!h.id && (h.name === heroiId || h.nome === heroiId))) {
        if (!h.snapshot) h.snapshot = {};
        if (!Array.isArray(h.snapshot.backpack)) h.snapshot.backpack = [];
        h.snapshot.backpack.push(novaEntrada);
        modificado = true;
        break;
      }
    }

    // Se for o herói ativo
    if (ativo) {
      const idAtivo = ativo.identity?.id || ativo.identity?.characterName || 'ativo';
      if (idAtivo === heroiId || ativo.identity?.characterName === heroiId) {
        if (!Array.isArray(ativo.backpack)) ativo.backpack = [];
        ativo.backpack.push(novaEntrada);
        salvarHeroiAtivo(ativo);

        // Se estiver em runtime no browser com window.state
        if (typeof window !== 'undefined' && window.state) {
          if (!Array.isArray(window.state.backpack)) window.state.backpack = [];
          window.state.backpack.push(novaEntrada);
          if (typeof window.persistNow === 'function') window.persistNow();
        }
        modificado = true;
      }
    }

    if (modificado) {
      salvarRoster(roster);
      return { sucesso: true, item: novaEntrada };
    }

    return { sucesso: false, mensagem: 'Herói destinatário não encontrado' };
  }

  function salvarSnapshotHeroi(heroId, snapshot) {
    if (!heroId || !snapshot) return false;
    const roster = obterRoster();
    let modificado = false;
    const index = roster.findIndex(h => h.id === heroId || h.name === heroId);
    if (index !== -1) {
      roster[index].snapshot = snapshot;
      if (snapshot.identity?.characterName) roster[index].name = snapshot.identity.characterName;
      if (snapshot.funds != null) roster[index].funds = snapshot.funds;
      modificado = true;
      salvarRoster(roster);
    }
    const ativo = obterHeroiAtivo();
    if (ativo && (ativo.identity?.id === heroId || ativo.identity?.characterName === heroId || heroId === 'ativo')) {
      salvarHeroiAtivo(snapshot);
      modificado = true;
    }
    return modificado;
  }

  return Object.freeze({
    ROSTER_KEY,
    ACTIVE_KEY,
    obterRoster,
    salvarRoster,
    obterHeroiAtivo,
    salvarHeroiAtivo,
    salvarSnapshotHeroi,
    listarHeroisMesa,
    creditarTibaresHeroi,
    dividirTibaresEntreHerois,
    adicionarItemHeroiMesa
  });
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CampanhaMesa;
}
