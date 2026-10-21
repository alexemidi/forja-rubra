/**
 * Regras puras de Manufatura e Oficinas de Tormenta 20 (Jogo do Ano).
 * Sem DOM, sem armazenamento e sem mutação de estado.
 */

export interface OpcoesCustoMateriaPrima {
  fracao?: '1/3' | '1/4';
}

export interface RegrasPocaoPergaminho {
  circulo: number;
  precoBase: number;
  custoMateriaPrima: number;
  cdFabricacao: number;
}

export interface ResultadoAprimoramento {
  custoMercadoMelhoria: number;
  custoMateriaPrima: number;
  cdFabricacao: number;
  cdSuperior: number;
  cdBase: number;
}

export interface SecaoOficina {
  id: string;
  title: string;
  subtitle: string;
  oficioLabel: string;
  emptyText: string;
  corresponde: (item: any) => boolean;
}

export const TABELA_MELHORIAS: Record<number, number> = Object.freeze({
  0: 0,
  1: 300,
  2: 3000,
  3: 9000,
  4: 18000,
});

export const CD_MELHORIAS: Record<number, number> = Object.freeze({
  0: 0,
  1: 5,
  2: 10,
  3: 15,
  4: 20,
});

export const TABELA_ENCANTOS: Record<number, number> = Object.freeze({
  0: 0,
  1: 18000,
  2: 36000,
  3: 72000,
});

export const CD_ENCANTOS: Record<number, number> = Object.freeze({
  0: 0,
  1: 10,
  2: 15,
  3: 20,
});

export const PM_SACRIFICIO_ENCANTOS: Record<number, number> = Object.freeze({
  0: 0,
  1: 1,
  2: 2,
  3: 3,
});

export function custoMateriaPrima(
  precoTotal: number,
  opcoes: OpcoesCustoMateriaPrima = {},
): number {
  const valor = Number(precoTotal) || 0;
  if (valor <= 0) return 0;
  const divisor = opcoes.fracao === '1/4' ? 4 : 3;
  return Math.max(1, Math.floor(valor / divisor));
}

export function cdFabricacao(
  item: any,
  qtdMelhorias = 0,
  qtdEncantos = 0,
): number {
  if (!item) return 15;
  const m = Math.min(4, Math.max(0, Number(qtdMelhorias) || 0));
  const e = Math.min(3, Math.max(0, Number(qtdEncantos) || 0));

  const cat = String(item.categoriaId || '').toLowerCase();
  const tipo = String(item.tipo || '').toLowerCase();
  const nome = String(item.nome || item.name || '').toLowerCase();

  let cdBase = 15;

  if (tipo === 'arma') {
    if (cat === 'simples') cdBase = 15;
    else cdBase = 20;
  } else if (tipo === 'armadura' || tipo === 'escudo') {
    if (tipo === 'escudo' || cat === 'leve') cdBase = 15;
    else cdBase = 20;
  } else if (
    tipo === 'alquimico' ||
    cat.startsWith('alquimico') ||
    cat === 'veneno' ||
    cat === 'preparado' ||
    cat === 'catalisador'
  ) {
    if (
      cat.includes('veneno') ||
      nome.includes('veneno') ||
      nome.includes('peconha') ||
      nome.includes('peçonha')
    ) {
      cdBase = 20;
    } else if (cat.includes('catalisador')) {
      cdBase = 15;
    } else {
      cdBase = 15;
    }
  } else if (
    cat === 'alimentacao' ||
    cat === 'alimento' ||
    tipo === 'comida' ||
    tipo === 'aliment' ||
    cat.includes('aliment')
  ) {
    cdBase = 15;
  } else {
    const preco = Number(item.preco?.valor ?? item.price ?? 0);
    cdBase = preco >= 100 ? 20 : 15;
  }

  return cdBase + (CD_MELHORIAS[m] || 0) + (CD_ENCANTOS[e] || 0);
}

export function tempoFabricacao(
  item: any,
  qtdMelhorias = 0,
  qtdEncantos = 0,
): string {
  if (!item) return '1 dia';
  const e = Math.min(3, Math.max(0, Number(qtdEncantos) || 0));
  const m = Math.min(4, Math.max(0, Number(qtdMelhorias) || 0));
  if (e > 0) return '3 meses';
  if (m > 0) return '1 mês';

  const cat = String(item.categoriaId || '').toLowerCase();
  const tipo = String(item.tipo || '').toLowerCase();
  if (
    tipo === 'alquimico' ||
    cat.startsWith('alquimico') ||
    cat === 'alimentacao' ||
    cat.includes('aliment') ||
    tipo === 'pocao' ||
    tipo === 'pergaminho'
  ) {
    return '1 dia';
  }
  return '1 semana';
}

export function regrasPocaoPergaminho(circulo: number): RegrasPocaoPergaminho {
  const c = Math.max(1, Math.min(5, Number(circulo) || 1));
  const precoBase = 30 * c * c;
  const materiaPrima = Math.floor(precoBase / 3);
  const cd = 20 + c;
  return {
    circulo: c,
    precoBase,
    custoMateriaPrima: materiaPrima,
    cdFabricacao: cd,
  };
}

export const secoesOficina: Record<string, SecaoOficina> = Object.freeze({
  armeiro: {
    id: 'armeiro',
    title: 'Forja do Ferreiro',
    subtitle: 'Forja de armas, armaduras, escudos e munições metálicas.',
    oficioLabel: 'Ofício (Armeiro)',
    emptyText: 'Nenhuma arma, armadura ou escudo correspondente aos filtros.',
    corresponde(item: any): boolean {
      const cat = String(item.categoriaId || '').toLowerCase();
      const tipo = String(item.tipo || '').toLowerCase();
      return (
        tipo === 'arma' ||
        tipo === 'armadura' ||
        tipo === 'escudo' ||
        cat === 'municao'
      );
    },
  },
  alquimista: {
    id: 'alquimista',
    title: 'Laboratório do Alquimista',
    subtitle: 'Preparados alquímicos, catalisadores, venenos e poções.',
    oficioLabel: 'Ofício (Alquimista)',
    emptyText: 'Nenhum item alquímico, catalisador ou veneno correspondente.',
    corresponde(item: any): boolean {
      const cat = String(item.categoriaId || '').toLowerCase();
      const tipo = String(item.tipo || '').toLowerCase();
      return (
        tipo === 'alquimico' ||
        cat.startsWith('alquimico') ||
        cat === 'veneno' ||
        cat === 'preparado' ||
        cat === 'catalisador' ||
        tipo === 'pocao'
      );
    },
  },
  alfaiate: {
    id: 'alfaiate',
    title: 'Ateliê do Alfaiate',
    subtitle: 'Confecção de vestuário, trajes, mantos, capas e acessórios de tecido.',
    oficioLabel: 'Ofício (Alfaiate)',
    emptyText: 'Nenhuma peça de vestuário correspondente aos filtros.',
    corresponde(item: any): boolean {
      const cat = String(item.categoriaId || '').toLowerCase();
      const tipo = String(item.tipo || '').toLowerCase();
      const nome = String(item.nome || item.name || '').toLowerCase();
      if (tipo === 'arma' || tipo === 'armadura' || tipo === 'escudo' || tipo === 'alquimico') {
        return false;
      }
      return (
        cat === 'vestuario' ||
        cat === 'vestuário' ||
        nome.includes('traje') ||
        nome.includes('vestimenta') ||
        nome.includes('manto') ||
        nome.includes('capa') ||
        nome.includes('chapéu') ||
        nome.includes('chapeu') ||
        nome.includes('bota') ||
        nome.includes('luva') ||
        nome.includes('camisa') ||
        nome.includes('tabardo') ||
        nome.includes('gorro') ||
        nome.includes('sapatos')
      );
    },
  },
  artesao: {
    id: 'artesao',
    title: 'Bancada do Artesão',
    subtitle: 'Ferramentas, esotéricos, instrumentos e equipamentos de aventura.',
    oficioLabel: 'Ofício (Artesão)',
    emptyText: 'Nenhum equipamento ou ferramenta correspondente.',
    corresponde(item: any): boolean {
      const cat = String(item.categoriaId || '').toLowerCase();
      const tipo = String(item.tipo || '').toLowerCase();
      if (
        tipo === 'arma' ||
        tipo === 'armadura' ||
        tipo === 'escudo' ||
        tipo === 'alquimico' ||
        cat.startsWith('alquimico') ||
        cat === 'alimentacao' ||
        cat.includes('aliment') ||
        cat === 'animal' ||
        cat === 'veiculo' ||
        cat === 'servico'
      ) {
        return false;
      }
      if (secoesOficina.alfaiate.corresponde(item)) return false;
      return (
        cat === 'equipamento_aventura' ||
        cat === 'ferramenta' ||
        cat === 'esoterico' ||
        tipo === 'esoterico' ||
        cat === 'instrumento' ||
        tipo === 'item_geral'
      );
    },
  },
  cozinheiro: {
    id: 'cozinheiro',
    title: 'Cozinha da Taverna',
    subtitle: 'Pratos especiais, rações e bebidas nutritivas.',
    oficioLabel: 'Ofício (Cozinheiro)',
    emptyText: 'Nenhum prato ou alimento encontrado.',
    corresponde(item: any): boolean {
      const cat = String(item.categoriaId || '').toLowerCase();
      const tipo = String(item.tipo || '').toLowerCase();
      return (
        cat === 'alimentacao' ||
        cat === 'alimento' ||
        cat.includes('aliment') ||
        tipo === 'comida' ||
        tipo === 'aliment'
      );
    },
  },
  escriba: {
    id: 'escriba',
    title: 'Escrivaninha do Escriba',
    subtitle: 'Pergaminhos, livros, mapas, grimórios e tomos de estudo.',
    oficioLabel: 'Ofício (Escriba)',
    emptyText: 'Nenhum livro, pergaminho ou material de escrita encontrado.',
    corresponde(item: any): boolean {
      const cat = String(item.categoriaId || '').toLowerCase();
      const tipo = String(item.tipo || '').toLowerCase();
      const nome = String(item.nome || item.name || '').toLowerCase();
      return (
        tipo === 'pergaminho' ||
        cat === 'pergaminho' ||
        nome.includes('livro') ||
        nome.includes('pergaminho') ||
        nome.includes('grimório') ||
        nome.includes('grimorio') ||
        nome.includes('mapa') ||
        nome.includes('tinta') ||
        nome.includes('caderno') ||
        nome.includes('coleção') ||
        nome.includes('colecao')
      );
    },
  },
  engenhoqueiro: {
    id: 'engenhoqueiro',
    title: 'Oficina do Engenhoqueiro',
    subtitle: 'Construção de engenhocas mecânicas que simulam efeitos mágicos.',
    oficioLabel: 'Ofício (Engenhoqueiro)',
    emptyText: 'Nenhuma engenhoca encontrada.',
    corresponde(item: any): boolean {
      const cat = String(item.categoriaId || '').toLowerCase();
      const tipo = String(item.tipo || '').toLowerCase();
      return tipo === 'engenhoca' || cat === 'engenhoca' || Boolean(item.isEngenhoca);
    },
  },
  tatuador: {
    id: 'tatuador',
    title: 'Estúdio do Tatuador',
    subtitle: 'Tatuagens místicas de Khubar, encantamentos dérmicos e pigmentos.',
    oficioLabel: 'Ofício (Tatuador)',
    emptyText: 'Nenhuma tatuagem ou insumo correspondente.',
    corresponde(item: any): boolean {
      const cat = String(item.categoriaId || '').toLowerCase();
      const tipo = String(item.tipo || '').toLowerCase();
      const nome = String(item.nome || item.name || '').toLowerCase();
      return tipo === 'tatuagem' || cat === 'tatuagem' || nome.includes('tatuag');
    },
  },
});

export function normalizarOficio(nomeOficio: string): string {
  const raw = String(nomeOficio || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (raw.includes('armeir') || raw.includes('ferreir') || raw.includes('forjad')) return 'armeiro';
  if (raw.includes('alfaiat') || raw.includes('tecel') || raw.includes('costur')) return 'alfaiate';
  if (raw.includes('alquim')) return 'alquimista';
  if (raw.includes('engenh') || raw.includes('inventor')) return 'engenhoqueiro';
  if (raw.includes('carpinteir') || raw.includes('marceneir')) return 'carpinteiro';
  if (raw.includes('pedreir') || raw.includes('alvenar') || raw.includes('construt')) return 'pedreiro';
  if (raw.includes('ourive') || raw.includes('joalh')) return 'joalheiro';
  if (raw.includes('escrib') || raw.includes('cartog') || raw.includes('caligr')) return 'escriba';
  if (raw.includes('cozinh') || raw.includes('culinar') || raw.includes('padeir') || raw.includes('cervej')) return 'cozinheiro';
  if (raw.includes('tatuad')) return 'tatuador';
  if (raw.includes('miner') || raw.includes('garimp')) return 'minerador';
  if (raw.includes('fazend') || raw.includes('agricol') || raw.includes('plant')) return 'fazendeiro';
  if (raw.includes('pescad')) return 'pescador';
  if (raw.includes('estalajad') || raw.includes('hosped')) return 'estalajadeiro';
  if (raw.includes('pintor') || raw.includes('pintur') || raw.includes('artist')) return 'pintor';
  if (raw.includes('escult')) return 'escultor';
  if (raw.includes('artes') || raw.includes('coureir')) return 'artesao';
  return 'artesao';
}

export function obterNomeEstacao(nomeOficio: string): string {
  const norm = normalizarOficio(nomeOficio);
  if (secoesOficina[norm]) {
    return secoesOficina[norm].title;
  }
  const clean = String(nomeOficio || '').replace(/^Ofício\s*\(|\)$/gi, '').trim();
  return clean ? `Oficina de ${clean}` : 'Oficina de Manufatura';
}

export function filtrarItensPorOficio(
  catalogo: any[],
  chaveOficio: string,
  itensExclusivos?: Set<string> | string[],
): any[] {
  if (!Array.isArray(catalogo)) return [];
  const secao = secoesOficina[chaveOficio] || secoesOficina.artesao;
  const exclusivos =
    itensExclusivos instanceof Set
      ? itensExclusivos
      : new Set(itensExclusivos || []);

  return catalogo.filter((item) => {
    if (!item) return false;
    const preco = Number(item.preco?.valor ?? item.price ?? 0);
    if (preco <= 0) return false;
    if (item.origemExclusiva || exclusivos.has(item.id)) return false;
    return secao.corresponde(item);
  });
}

import { limiteMelhoriasEngenhoca } from './contraption-rules.ts';

export function podeReceberMelhorias(item: any): boolean {
  if (!item) return false;
  const cat = String(item.categoriaId || '').toLowerCase();
  const tipo = String(item.tipo || '').toLowerCase();
  if (tipo === 'aparato' || cat === 'aparato' || Boolean(item.isAparato)) return false;
  const isEng = Boolean(
    item.isEngenhoca ||
      item.contraptionId ||
      item.tipo === 'engenhoca' ||
      item.categoriaId === 'engenhoca',
  );
  if (isEng) {
    return limiteMelhoriasEngenhoca(item) > 0;
  }
  const nome = String(item.nome || item.name || '').toLowerCase();

  if (
    tipo === 'alquimico' ||
    cat.startsWith('alquimico') ||
    cat === 'veneno' ||
    cat === 'preparado' ||
    cat === 'catalisador'
  ) {
    return false;
  }
  if (
    tipo === 'municao' ||
    cat === 'municao' ||
    tipo === 'pocao' ||
    tipo === 'pergaminho' ||
    tipo === 'comida' ||
    tipo === 'aliment' ||
    cat.includes('pocao') ||
    cat.includes('aliment')
  ) {
    return false;
  }

  if (tipo === 'arma' || tipo === 'armadura' || tipo === 'escudo') return true;
  if (
    tipo === 'esoterico' ||
    cat === 'esoterico' ||
    nome.includes('esoterico') ||
    nome.includes('esotérico')
  ) {
    return true;
  }
  if (
    cat === 'vestuario' ||
    cat === 'vestuário' ||
    nome.includes('traje') ||
    nome.includes('vestimenta') ||
    nome.includes('manto') ||
    nome.includes('camisa')
  ) {
    return true;
  }

  return false;
}

/**
 * Verifica se um item pode receber a melhoria Material Especial.
 * Regra T20: A Armadura de Pedra não pode receber a melhoria material especial,
 * embora possa receber outras melhorias de armadura.
 */
export function podeReceberMaterialEspecial(item: any): boolean {
  if (!podeReceberMelhorias(item)) return false;
  const id = String(item.id || item.baseId || '').toLowerCase().replace(/_/g, '-');
  const nome = String(item.nome || item.name || '').toLowerCase();
  if (id === 'armadura-de-pedra' || nome.includes('armadura de pedra')) {
    return false;
  }
  return true;
}

export function podeReceberEncantos(item: any): boolean {
  if (!item) return false;
  const cat = String(item.categoriaId || '').toLowerCase();
  const tipo = String(item.tipo || '').toLowerCase();
  if (tipo === 'aparato' || cat === 'aparato' || Boolean(item.isAparato)) return false;
  if (
    Boolean(
      item.isEngenhoca ||
        item.contraptionId ||
        item.tipo === 'engenhoca' ||
        item.categoriaId === 'engenhoca',
    )
  ) {
    return false;
  }
  if (!podeReceberMelhorias(item)) return false;

  const isSpecific = Boolean(
    (item.magico && (item.magico.tipo === 'especifico' || item.magico.tipo === 'liturgico')) ||
      item.especifico ||
      item.isSpecific ||
      item.magico?.caracteristicasFixas?.length,
  );
  if (isSpecific) return false;
  const nome = String(item.nome || item.name || '').toLowerCase();

  if (tipo === 'arma' || tipo === 'armadura' || tipo === 'escudo') return true;
  if (
    tipo === 'esoterico' ||
    cat === 'esoterico' ||
    nome.includes('esoterico') ||
    nome.includes('esotérico')
  ) {
    return true;
  }

  return false;
}

export function oficioNecessarioParaAprimorar(
  item: any,
): 'armeiro' | 'alfaiate' | 'artesao' | string {
  if (!item) return 'artesao';
  const tipo = String(item.tipo || '').toLowerCase();
  const cat = String(item.categoriaId || '').toLowerCase();
  const nome = String(item.nome || item.name || '').toLowerCase();

  if (tipo === 'arma' || tipo === 'armadura' || tipo === 'escudo') return 'armeiro';
  if (
    tipo === 'vestuario' ||
    tipo === 'vestuário' ||
    cat === 'vestuario' ||
    cat === 'vestuário' ||
    nome.includes('traje') ||
    nome.includes('vestimenta') ||
    nome.includes('manto') ||
    nome.includes('camisa')
  ) {
    return 'alfaiate';
  }
  if (
    tipo === 'esoterico' ||
    cat === 'esoterico' ||
    nome.includes('esoterico') ||
    nome.includes('esotérico')
  ) {
    return 'artesao';
  }
  return 'artesao';
}

export function calcularAprimoramentoItemExistente(
  item: any,
  qtdMelhoriasAtuais: number,
  qtdNovasMelhoriasTotais: number,
  custoMaterialAdicional = 0,
  opcoes: OpcoesCustoMateriaPrima = {},
): ResultadoAprimoramento {
  const prev = Math.min(4, Math.max(0, Number(qtdMelhoriasAtuais) || 0));
  const next = Math.min(4, Math.max(0, Number(qtdNovasMelhoriasTotais) || 0));
  const baseDiff = Math.max(0, (TABELA_MELHORIAS[next] || 0) - (TABELA_MELHORIAS[prev] || 0));
  const custoMercadoMelhoria = baseDiff + Math.max(0, Number(custoMaterialAdicional) || 0);
  const materiaPrima = custoMateriaPrima(custoMercadoMelhoria, opcoes);
  const cdBase = cdFabricacao(item);
  const cdSuperior = CD_MELHORIAS[next] || 0;
  const cd = cdBase + cdSuperior;
  return {
    custoMercadoMelhoria,
    custoMateriaPrima: materiaPrima,
    cdFabricacao: cd,
    cdSuperior,
    cdBase,
  };
}
