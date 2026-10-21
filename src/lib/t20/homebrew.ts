/**
 * FORJA RUBRA - Sistema de Conteúdo Personalizado (Homebrew) para Tormenta 20
 * Permite que mestres e jogadores criem, ativem, exportem e importem raças,
 * classes, origens, poderes e magias customizados.
 */

export type HomebrewTipo = 'raca' | 'classe' | 'origem' | 'poder' | 'magia' | 'item';

export interface HomebrewBase {
  id: string;
  tipo: HomebrewTipo;
  nome: string;
  autor: string;
  descricao: string;
  ativo: boolean;
  criadoEm: string;
  versao?: string;
}

export interface HomebrewRaca extends HomebrewBase {
  tipo: 'raca';
  dados: {
    modificadoresAtributos: Record<string, number>;
    tamanho: 'Minúsculo' | 'Pequeno' | 'Médio' | 'Grande' | 'Enorme' | 'Colossal';
    deslocamento: number;
    habilidades: Array<{
      nome: string;
      descricao: string;
      custoPM?: number;
    }>;
  };
}

export interface HomebrewOrigem extends HomebrewBase {
  tipo: 'origem';
  dados: {
    periciasPermitidas: string[];
    poderesPermitidos: string[];
    itensIniciais?: string[];
  };
}

export interface HomebrewPoder extends HomebrewBase {
  tipo: 'poder';
  dados: {
    subtipo: 'combate' | 'destino' | 'magia' | 'concedido' | 'tormenta' | 'classe';
    preRequisitos?: string;
    custoPM?: number;
    efeito: string;
  };
}

export interface HomebrewMagia extends HomebrewBase {
  tipo: 'magia';
  dados: {
    circulo: number;
    escola: string;
    tipoMagia: 'arcana' | 'divina' | 'universal';
    execucao: string;
    alcance: string;
    alvoOuArea: string;
    duracao: string;
    resistencia?: string;
    aprimoramentos?: Array<{ custo: string; texto: string }>;
  };
}

export interface HomebrewItemGenerico extends HomebrewBase {
  tipo: 'classe' | 'item';
  dados: Record<string, any>;
}

export type HomebrewItem = HomebrewRaca | HomebrewOrigem | HomebrewPoder | HomebrewMagia | HomebrewItemGenerico;

const HOMEBREW_STORAGE_KEY = 'forja_rubra_homebrews_v1';

function gerarId(): string {
  return 'hb_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
}

function obterArmazenamento(): HomebrewItem[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HOMEBREW_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function salvarArmazenamento(items: HomebrewItem[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(HOMEBREW_STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Erro ao salvar homebrews:', err);
  }
}

export const ForjaHomebrew = {
  listar(tipo?: HomebrewTipo): HomebrewItem[] {
    const todos = obterArmazenamento();
    if (!tipo) return todos;
    return todos.filter(item => item.tipo === tipo);
  },

  listarAtivos(tipo?: HomebrewTipo): HomebrewItem[] {
    const items = this.listar(tipo);
    return items.filter(item => item.ativo);
  },

  obter(id: string): HomebrewItem | undefined {
    return obterArmazenamento().find(item => item.id === id);
  },

  salvar(item: Omit<HomebrewBase, 'id' | 'criadoEm'> & { id?: string; dados: any }): HomebrewItem {
    const todos = obterArmazenamento();
    const id = item.id || gerarId();
    const agora = new Date().toISOString();

    const novo: HomebrewItem = {
      ...item,
      id,
      criadoEm: item.id ? (todos.find(i => i.id === item.id)?.criadoEm || agora) : agora,
      ativo: item.ativo !== undefined ? item.ativo : true,
      versao: item.versao || '1.0'
    } as HomebrewItem;

    const index = todos.findIndex(i => i.id === id);
    if (index >= 0) {
      todos[index] = novo;
    } else {
      todos.push(novo);
    }

    salvarArmazenamento(todos);
    return novo;
  },

  alternarAtivo(id: string): boolean {
    const todos = obterArmazenamento();
    const item = todos.find(i => i.id === id);
    if (!item) return false;
    item.ativo = !item.ativo;
    salvarArmazenamento(todos);
    return item.ativo;
  },

  excluir(id: string): boolean {
    const todos = obterArmazenamento();
    const novos = todos.filter(i => i.id !== id);
    if (novos.length === todos.length) return false;
    salvarArmazenamento(novos);
    return true;
  },

  exportarJSON(): string {
    const items = obterArmazenamento();
    return JSON.stringify({
      app: 'Forja Rubra T20',
      tipoExportacao: 'homebrew',
      exportadoEm: new Date().toISOString(),
      itens: items
    }, null, 2);
  },

  importarJSON(jsonStr: string): { importados: number; erros: string[] } {
    const erros: string[] = [];
    let importados = 0;
    try {
      const data = JSON.parse(jsonStr);
      const lista: any[] = Array.isArray(data) ? data : (data.itens || []);
      if (!Array.isArray(lista)) {
        return { importados: 0, erros: ['Formato JSON de homebrew inválido.'] };
      }

      const existentes = obterArmazenamento();
      const mapaExistentes = new Map(existentes.map(i => [i.id, i]));

      for (const item of lista) {
        if (!item.nome || !item.tipo) {
          erros.push(`Item ignorado por falta de nome ou tipo: ${JSON.stringify(item)}`);
          continue;
        }
        const id = item.id || gerarId();
        const valido: HomebrewItem = {
          id,
          tipo: item.tipo,
          nome: String(item.nome),
          autor: String(item.autor || 'Desconhecido'),
          descricao: String(item.descricao || ''),
          ativo: item.ativo !== undefined ? Boolean(item.ativo) : true,
          criadoEm: item.criadoEm || new Date().toISOString(),
          versao: item.versao || '1.0',
          dados: item.dados || {}
        } as HomebrewItem;

        mapaExistentes.set(id, valido);
        importados++;
      }

      salvarArmazenamento(Array.from(mapaExistentes.values()));
    } catch (e: any) {
      erros.push('Falha ao processar arquivo JSON: ' + (e?.message || String(e)));
    }
    return { importados, erros };
  },

  /**
   * Mescla uma lista oficial com os homebrews ativos do tipo especificado.
   */
  mesclarComCatalogo<T>(
    catalogoOficial: T[],
    tipo: HomebrewTipo,
    conversor: (hb: HomebrewItem) => T
  ): T[] {
    const ativos = this.listarAtivos(tipo);
    if (ativos.length === 0) return catalogoOficial;
    const convertidos = ativos.map(conversor);
    return [...catalogoOficial, ...convertidos];
  }
};
