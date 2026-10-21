/**
 * FORJA RUBRA - Sistema de Gerenciamento de Mesas Virtuais para Tormenta 20
 * Permite que Mestres criem mesas com regras personalizadas (idade, devoções, suplementos)
 * e acompanhem em tempo real o status dos personagens e rolagens dos jogadores.
 */

export interface RegrasMesa {
  permitirIdade: boolean;
  tipoRegraIdade: 'herois_de_arton' | 'basico';
  devocaoLivre: boolean;
  racasPermitidas: string[] | 'todas';
  suplementosHabilitados: string[];
  permitirHomebrew: boolean;
  metodoAtributos: 'compra' | 'rolagem' | 'livre';
}

export interface JogadorMesa {
  idFicha: string;
  nomePersonagem: string;
  nomeJogador: string;
  raca: string;
  classe: string;
  nivel: number;
  pvAtual: number;
  pvMax: number;
  pmAtual: number;
  pmMax: number;
  defesa: number;
  condicoes: string[];
  iniciativa?: number;
  ultimaAtualizacao: string;
}

export interface LogRolagemMesa {
  id: string;
  timestamp: number;
  nomeJogador: string;
  nomePersonagem: string;
  periciaOuAcao: string;
  formula: string;
  d20: number;
  total: number;
  critico: boolean;
  falha: boolean;
}

export interface Mesa {
  id: string; // Ex: 'FR-8492'
  nome: string;
  mestre: string;
  descricao?: string;
  regras: RegrasMesa;
  jogadores: JogadorMesa[];
  logs: LogRolagemMesa[];
  criadaEm: string;
  atualizadaEm: string;
}

const MESAS_STORAGE_KEY = 'forja_rubra_mesas_v1';
const MESA_CHANNEL_NAME = 'forja_rubra_mesa_broadcast';

function gerarCodigoMesa(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `FR-${num}`;
}

function obterArmazenamentoMesas(): Mesa[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(MESAS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function salvarArmazenamentoMesas(mesas: Mesa[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(MESAS_STORAGE_KEY, JSON.stringify(mesas));
  } catch (err) {
    console.error('Erro ao salvar mesas:', err);
  }
}

function emitirEventoMesa(tipo: string, payload: any): void {
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const canal = new BroadcastChannel(MESA_CHANNEL_NAME);
      canal.postMessage({ tipo, payload, timestamp: Date.now() });
      canal.close();
    } catch {
      // Ignora falhas em ambientes restritos
    }
  }
}

export const REGRAS_PADRAO_MESA: RegrasMesa = {
  permitirIdade: false,
  tipoRegraIdade: 'herois_de_arton',
  devocaoLivre: true,
  racasPermitidas: 'todas',
  suplementosHabilitados: ['basico', 'herois_de_arton', 'ameacas_de_arton', 'deuses_de_arton'],
  permitirHomebrew: true,
  metodoAtributos: 'compra'
};

export const ForjaMesas = {
  listar(): Mesa[] {
    return obterArmazenamentoMesas();
  },

  obter(id: string): Mesa | undefined {
    const limpo = id.trim().toUpperCase();
    return obterArmazenamentoMesas().find(m => m.id.toUpperCase() === limpo);
  },

  criar(nome: string, mestre: string, regrasIniciais?: Partial<RegrasMesa>, descricao?: string): Mesa {
    const mesas = obterArmazenamentoMesas();
    let id = gerarCodigoMesa();
    while (mesas.some(m => m.id === id)) {
      id = gerarCodigoMesa();
    }

    const novaMesa: Mesa = {
      id,
      nome: nome.trim(),
      mestre: mestre.trim() || 'Mestre da Forja',
      descricao: descricao?.trim() || '',
      regras: {
        ...REGRAS_PADRAO_MESA,
        ...regrasIniciais
      },
      jogadores: [],
      logs: [],
      criadaEm: new Date().toISOString(),
      atualizadaEm: new Date().toISOString()
    };

    mesas.push(novaMesa);
    salvarArmazenamentoMesas(mesas);
    emitirEventoMesa('mesa_criada', novaMesa);
    return novaMesa;
  },

  atualizarRegras(mesaId: string, regras: Partial<RegrasMesa>): Mesa | undefined {
    const mesas = obterArmazenamentoMesas();
    const mesa = mesas.find(m => m.id.toUpperCase() === mesaId.trim().toUpperCase());
    if (!mesa) return undefined;

    mesa.regras = { ...mesa.regras, ...regras };
    mesa.atualizadaEm = new Date().toISOString();
    salvarArmazenamentoMesas(mesas);
    emitirEventoMesa('regras_atualizadas', { mesaId: mesa.id, regras: mesa.regras });
    return mesa;
  },

  entrarOuAtualizarJogador(mesaId: string, jogador: JogadorMesa): boolean {
    const mesas = obterArmazenamentoMesas();
    const mesa = mesas.find(m => m.id.toUpperCase() === mesaId.trim().toUpperCase());
    if (!mesa) return false;

    const idx = mesa.jogadores.findIndex(j => j.idFicha === jogador.idFicha);
    const atualizado: JogadorMesa = {
      ...jogador,
      ultimaAtualizacao: new Date().toISOString()
    };

    if (idx >= 0) {
      mesa.jogadores[idx] = atualizado;
    } else {
      mesa.jogadores.push(atualizado);
    }

    mesa.atualizadaEm = new Date().toISOString();
    salvarArmazenamentoMesas(mesas);
    emitirEventoMesa('jogador_atualizado', { mesaId: mesa.id, jogador: atualizado });
    return true;
  },

  removerJogador(mesaId: string, idFicha: string): boolean {
    const mesas = obterArmazenamentoMesas();
    const mesa = mesas.find(m => m.id.toUpperCase() === mesaId.trim().toUpperCase());
    if (!mesa) return false;

    const countAntes = mesa.jogadores.length;
    mesa.jogadores = mesa.jogadores.filter(j => j.idFicha !== idFicha);
    if (mesa.jogadores.length === countAntes) return false;

    mesa.atualizadaEm = new Date().toISOString();
    salvarArmazenamentoMesas(mesas);
    emitirEventoMesa('jogador_removido', { mesaId: mesa.id, idFicha });
    return true;
  },

  adicionarLogRolagem(mesaId: string, log: Omit<LogRolagemMesa, 'id' | 'timestamp'>): LogRolagemMesa | undefined {
    const mesas = obterArmazenamentoMesas();
    const mesa = mesas.find(m => m.id.toUpperCase() === mesaId.trim().toUpperCase());
    if (!mesa) return undefined;

    const novoLog: LogRolagemMesa = {
      ...log,
      id: 'roll_' + Math.random().toString(36).substring(2, 9),
      timestamp: Date.now()
    };

    mesa.logs.unshift(novoLog);
    // Limitar logs a 100 por mesa para economizar espaço
    if (mesa.logs.length > 100) {
      mesa.logs = mesa.logs.slice(0, 100);
    }

    mesa.atualizadaEm = new Date().toISOString();
    salvarArmazenamentoMesas(mesas);
    emitirEventoMesa('nova_rolagem', { mesaId: mesa.id, log: novoLog });
    return novoLog;
  },

  excluir(id: string): boolean {
    const mesas = obterArmazenamentoMesas();
    const novas = mesas.filter(m => m.id.toUpperCase() !== id.trim().toUpperCase());
    if (novas.length === mesas.length) return false;
    salvarArmazenamentoMesas(novas);
    emitirEventoMesa('mesa_excluida', { mesaId: id });
    return true;
  },

  exportarJSON(id: string): string | undefined {
    const mesa = this.obter(id);
    if (!mesa) return undefined;
    return JSON.stringify({
      app: 'Forja Rubra T20',
      tipoExportacao: 'mesa',
      exportadoEm: new Date().toISOString(),
      mesa
    }, null, 2);
  },

  importarJSON(jsonStr: string): Mesa | undefined {
    try {
      const data = JSON.parse(jsonStr);
      const mesaRaw = data.mesa || data;
      if (!mesaRaw.nome) return undefined;

      const mesas = obterArmazenamentoMesas();
      let id = mesaRaw.id || gerarCodigoMesa();
      const mesaValidada: Mesa = {
        id,
        nome: String(mesaRaw.nome),
        mestre: String(mesaRaw.mestre || 'Mestre da Forja'),
        descricao: String(mesaRaw.descricao || ''),
        regras: {
          ...REGRAS_PADRAO_MESA,
          ...(mesaRaw.regras || {})
        },
        jogadores: Array.isArray(mesaRaw.jogadores) ? mesaRaw.jogadores : [],
        logs: Array.isArray(mesaRaw.logs) ? mesaRaw.logs : [],
        criadaEm: mesaRaw.criadaEm || new Date().toISOString(),
        atualizadaEm: new Date().toISOString()
      };

      const idx = mesas.findIndex(m => m.id.toUpperCase() === mesaValidada.id.toUpperCase());
      if (idx >= 0) {
        mesas[idx] = mesaValidada;
      } else {
        mesas.push(mesaValidada);
      }

      salvarArmazenamentoMesas(mesas);
      emitirEventoMesa('mesa_importada', mesaValidada);
      return mesaValidada;
    } catch {
      return undefined;
    }
  },

  /**
   * Registra um listener para eventos de mesas vindos de outras abas ou componentes.
   * Retorna uma função para cancelar a inscrição.
   */
  ouvirEventos(callback: (evento: { tipo: string; payload: any; timestamp: number }) => void): () => void {
    if (typeof BroadcastChannel === 'undefined') return () => {};
    const canal = new BroadcastChannel(MESA_CHANNEL_NAME);
    const handler = (ev: MessageEvent) => {
      if (ev.data && typeof ev.data.tipo === 'string') {
        callback(ev.data);
      }
    };
    canal.addEventListener('message', handler);
    return () => {
      canal.removeEventListener('message', handler);
      canal.close();
    };
  }
};
