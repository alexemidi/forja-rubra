/**
 * FORJA RUBRA - Módulo Canônico de Regras da Campanha e Variantes de Jogo (Tormenta 20)
 * 
 * Centraliza as regras opcionais da mesa:
 * - Regras de Idade (Desativada, Livro Básico - Jogo do Ano, Heróis de Arton)
 * - Raças Abertas (Heróis de Arton)
 * - Complicações (Ameaças / Heróis de Arton)
 * - Devoções Abertas (Padrão: ATIVADA)
 * - Modo de Origem (Uma só vs Dupla Origem)
 */

export type ModoRegraIdade = 'desativada' | 'basico' | 'herois_arton';
export type FaixaIdadeBasico = 'adulto' | 'maduro' | 'velho';

export interface CampanhaRegras {
  idade: ModoRegraIdade;
  faixaBasico: FaixaIdadeBasico;
  anos?: number;
  racasAbertas: boolean;
  complicacoes: boolean;
  devocoesAbertas: boolean;
  origemModo: 'single' | 'dual';
}

/** Configuração canônica inicial da Forja Rubra (Apenas Devoções Abertas ativada) */
export const REGRAS_CAMPANHA_PADRAO: Readonly<CampanhaRegras> = Object.freeze({
  idade: 'desativada',
  faixaBasico: 'adulto',
  anos: 20,
  racasAbertas: false,
  complicacoes: false,
  devocoesAbertas: true,
  origemModo: 'single'
});

/**
 * Modificadores de atributo cumulativos do Livro Básico de Tormenta 20 (Jogo do Ano):
 * - Maduro (45 Anos): For -1, Des -1, Con -1, Int +1, Sab +1, Car +1
 * - Velho (70 Anos): For -2, Des -2, Con -2, Int +1, Sab +1, Car +1 (cumulativo = For -3, Des -3, Con -3, Int +2, Sab +2, Car +2)
 */
export const MODIFICADORES_IDADE_BASICO: Record<FaixaIdadeBasico, Record<string, number>> = Object.freeze({
  adulto: { for: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 },
  maduro: { for: -1, des: -1, con: -1, int: 1, sab: 1, car: 1 },
  velho:  { for: -3, des: -3, con: -3, int: 2, sab: 2, car: 2 }
});

export const DESCRICOES_IDADE_BASICO: Record<FaixaIdadeBasico, { nome: string; idadeMin: number; descricao: string }> = Object.freeze({
  adulto: {
    nome: 'Adulto',
    idadeMin: 18,
    descricao: 'No auge da forma física e mental. Não recebe modificadores de idade.'
  },
  maduro: {
    nome: 'Maduro (45+ Anos)',
    idadeMin: 45,
    descricao: 'For –1, Des –1, Con –1, Int +1, Sab +1, Car +1.'
  },
  velho: {
    nome: 'Velho (70+ Anos)',
    idadeMin: 70,
    descricao: 'For –3, Des –3, Con –3, Int +2, Sab +2, Car +2 (cumulativo com Maduro). Longevidade máxima: 70 + 2d20 anos.'
  }
});

/**
 * Obtém ou inicializa o objeto de regras da campanha no estado da ficha.
 */
export function obterRegrasCampanha(state: any): CampanhaRegras {
  if (!state) return { ...REGRAS_CAMPANHA_PADRAO };

  if (!state.regrasCampanha || typeof state.regrasCampanha !== 'object') {
    state.regrasCampanha = { ...REGRAS_CAMPANHA_PADRAO };
  }

  // Garantir que todos os campos existam com seus valores padrão
  const r = state.regrasCampanha;
  if (!r.idade) r.idade = REGRAS_CAMPANHA_PADRAO.idade;
  if (!r.faixaBasico) r.faixaBasico = REGRAS_CAMPANHA_PADRAO.faixaBasico;
  if (r.racasAbertas === undefined) r.racasAbertas = REGRAS_CAMPANHA_PADRAO.racasAbertas;
  if (r.complicacoes === undefined) r.complicacoes = REGRAS_CAMPANHA_PADRAO.complicacoes;
  if (r.devocoesAbertas === undefined) r.devocoesAbertas = REGRAS_CAMPANHA_PADRAO.devocoesAbertas;
  if (!r.origemModo) r.origemModo = REGRAS_CAMPANHA_PADRAO.origemModo;

  return r;
}

/**
 * Atualiza as regras da campanha e sincroniza subsistemas afetados (Idade, Raças Abertas, Origens, Devoções).
 */
export function atualizarRegrasCampanha(state: any, novasRegras: Partial<CampanhaRegras>): CampanhaRegras {
  const r = obterRegrasCampanha(state);
  Object.assign(r, novasRegras);

  // Sincronizar subsistema de idade
  if (r.idade === 'desativada') {
    if (state.age) state.age.enabled = false;
  } else if (r.idade === 'herois_arton') {
    if (!state.age) state.age = {};
    state.age.enabled = true;
  } else if (r.idade === 'basico') {
    if (!state.age) state.age = {};
    state.age.enabled = true;
    state.age.basico = true;
    state.age.faixaBasico = r.faixaBasico;
  }

  // Sincronizar subsistema de raças abertas
  if (!r.racasAbertas) {
    if (state.identity) {
      state.identity.openRaceBonusEnabled = false;
      state.identity.openRaceAllocations = {};
    }
  }

  // Sincronizar modo de origem
  if (state.origin) {
    state.origin.mode = r.origemModo;
    if (r.origemModo === 'single') {
      state.origin.regional = '';
    }
  }

  // Sincronizar devoções abertas
  if (state.deity) {
    state.deity.masterPermission = Boolean(r.devocoesAbertas);
  }

  return r;
}

/**
 * Retorna os bônus de atributos concedidos pelas regras de idade ativas.
 */
export function modificadoresIdade(state: any): Record<string, number> {
  const r = obterRegrasCampanha(state);
  if (r.idade === 'basico') {
    return MODIFICADORES_IDADE_BASICO[r.faixaBasico || 'adulto'] || MODIFICADORES_IDADE_BASICO.adulto;
  }
  return { for: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 };
}
