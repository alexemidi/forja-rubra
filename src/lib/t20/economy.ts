/**
 * Regras puras de estatísticas base do personagem, moedas (TC, T$, TO),
 * carga monetária e cálculos de preços/descontos (arredondando para cima conforme T20).
 */

import type {
  BaseCharacterStats,
  PassiveEffectsSummary,
  CharacterFinances,
  CoinsBreakdown,
} from '../../interfaces/character-sheet.ts';

export function estatisticas(
  base: BaseCharacterStats,
  efeitos: PassiveEffectsSummary,
  atributos: Record<string, number>,
  nivel: number
): BaseCharacterStats & { defense: number } {
  return {
    ...base,
    pv: base.pv + efeitos.pvPerLevel * nivel + efeitos.pvFlat,
    pm: base.pm + efeitos.pmPerLevel * nivel + efeitos.pmFlat,
    defense:
      10 +
      ((efeitos.defenseAttribute && efeitos.defenseAttribute !== 'nenhum' && efeitos.defenseAttribute !== 'none')
        ? Number(atributos[efeitos.defenseAttribute] || 0)
        : 0) +
      efeitos.defenseBonus,
  };
}

export function moedas(
  saldo: number,
  financas: CharacterFinances = {}
): { financas: { goldCoins: number; brokenSilver: number }; moedas: CoinsBreakdown } {
  const total = Math.max(0, Math.round(saldo * 10));
  const goldCoins = Math.min(
    Math.max(0, Math.floor(financas.goldCoins || 0)),
    Math.floor(total / 100)
  );
  const restante = total - goldCoins * 100;
  const brokenSilver = Math.min(
    Math.max(0, Math.floor(financas.brokenSilver || 0)),
    Math.floor(restante / 10)
  );
  return {
    financas: { goldCoins, brokenSilver },
    moedas: {
      tc: (restante % 10) + brokenSilver * 10,
      ts: Math.floor(restante / 10) - brokenSilver,
      to: goldCoins,
    },
  };
}

export function espacosMoedas({ tc, ts, to }: Partial<CoinsBreakdown>): number {
  const total = (Number(tc) || 0) + (Number(ts) || 0) + (Number(to) || 0);
  return Math.floor(total / 1000);
}

/**
 * Calcula o preço de compra ou venda aplicando modificadores de +10% / -10%,
 * sempre arredondando para cima (Math.ceil) conforme as regras de Tormenta 20.
 */
export function calcularPrecoComModificador(
  precoBase: number,
  modifierSteps = 0,
  basePercent = 100
): number {
  const base = Math.max(0, Number(precoBase) || 0);
  const percent = Math.max(0, basePercent + modifierSteps * 10);
  return Math.ceil((base * percent) / 100);
}

/**
 * Calcula o custo de fabricação (1/3 padrão ou 1/4 com habilidades específicas),
 * sempre arredondando para cima (Math.ceil) conforme as regras de Tormenta 20.
 */
export function calcularCustoFabricacao(
  precoBase: number,
  divisor: 3 | 4 = 3
): number {
  const base = Math.max(0, Number(precoBase) || 0);
  return Math.ceil(base / divisor);
}

export const RegrasPersonagem = Object.freeze({
  estatisticas,
  moedas,
  espacosMoedas,
  calcularPrecoComModificador,
  calcularCustoFabricacao,
});

export default RegrasPersonagem;
