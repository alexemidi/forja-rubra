/**
 * Regras puras de penalidades e efeitos de condições de Tormenta 20 (Jogo do Ano).
 * Sem DOM e sem efeitos colaterais.
 */

export interface PenalidadeCondicoesResult {
  penalidadeTotal: number;
  detalhes: Array<{ condicao: string; valor: number }>;
}

/**
 * Calcula a penalidade em testes de perícia decorrente de condições ativas (T20 Jogo do Ano, p. 393-395).
 * 
 * Regras canônicas:
 * - Abalado: -2 em testes de perícia.
 * - Apavorado: -5 em testes de perícia (se apavorado, substitui abalado).
 * - Fraco: -2 em perícias baseadas em Força, Destreza ou Constituição.
 * - Debilitado: -5 em perícias baseadas em Força, Destreza ou Constituição (substitui fraco).
 * - Esmorecido: -2 em perícias baseadas em Inteligência, Sabedoria ou Carisma.
 * - Esgotado: -5 em perícias baseadas em Inteligência, Sabedoria ou Carisma (substitui esmorecido).
 * - Cego: -5 em testes baseados em Força ou Destreza.
 */
export function calcularPenalidadeCondicoesPericia(
  condicoesAtivas: string[],
  periciaId: string,
  atributo: string
): PenalidadeCondicoesResult {
  const norm = (condicoesAtivas || []).map(c => String(c || '').toLowerCase().trim());
  const attr = String(atributo || '').toLowerCase().trim();
  const detalhes: Array<{ condicao: string; valor: number }> = [];

  const isFisico = ['for', 'des', 'con'].includes(attr);
  const isMental = ['int', 'sab', 'car'].includes(attr);

  // 1. Medo: Apavorado (-5) ou Abalado (-2)
  if (norm.includes('apavorado')) {
    detalhes.push({ condicao: 'Apavorado', valor: -5 });
  } else if (norm.includes('abalado')) {
    detalhes.push({ condicao: 'Abalado', valor: -2 });
  }

  // 2. Físico: Debilitado (-5) ou Fraco (-2)
  if (isFisico) {
    if (norm.includes('debilitado')) {
      detalhes.push({ condicao: 'Debilitado', valor: -5 });
    } else if (norm.includes('fraco')) {
      detalhes.push({ condicao: 'Fraco', valor: -2 });
    }
  }

  // 3. Mental: Esgotado (-5) ou Esmorecido (-2)
  if (isMental) {
    if (norm.includes('esgotado')) {
      detalhes.push({ condicao: 'Esgotado', valor: -5 });
    } else if (norm.includes('esmorecido')) {
      detalhes.push({ condicao: 'Esmorecido', valor: -2 });
    }
  }

  // 4. Sentidos: Cego (-5 em Força ou Destreza)
  if (norm.includes('cego') && (attr === 'for' || attr === 'des')) {
    detalhes.push({ condicao: 'Cego', valor: -5 });
  }

  const penalidadeTotal = detalhes.reduce((acc, curr) => acc + curr.valor, 0);

  return {
    penalidadeTotal,
    detalhes
  };
}
