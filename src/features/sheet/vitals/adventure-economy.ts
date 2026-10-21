/**
 * Controle de Economia da Aventura e Incentivador da Economia (Tormenta 20).
 * Gerencia o registro automático de gastos em lojas/taverna/guilda/oficinas e a
 * atualização de PM temporários de aventura concedidos pelo poder Incentivador da Economia.
 */

import type { Vitais, MaximoVitais, EscopoTemporario, ChaveVital } from '../../../interfaces/vitals.ts';
import {
  normalizarVitais,
  calcularBonusIncentivadorEconomia,
  encerrarAventura,
} from '../../../lib/t20/vitals.ts';

export interface AdventureSpendingUpdateResult {
  vitals: Vitais;
  previousBonusPm: number;
  newBonusPm: number;
  deltaBonusPm: number;
}

/**
 * Registra um gasto em Tibares realizado durante a aventura (loja, taverna, guilda, oficina)
 * e atualiza automaticamente os PM temporários de aventura caso o personagem possua
 * o poder Incentivador da Economia (+1 PM temporário a cada 50 * nível do personagem).
 */
export function registerAdventureSpending(
  currentVitals: Partial<Vitais> | null | undefined,
  maximos: MaximoVitais,
  spentTibars: number,
  characterLevel: number,
  hasIncentivadorEconomia: boolean,
): AdventureSpendingUpdateResult {
  const vitals = normalizarVitais(currentVitals || {}, maximos);
  const added = Math.max(0, Number(spentTibars) || 0);
  const prevSpent = Math.max(0, Number(vitals.adventureSpentTibars) || 0);
  const nextSpent = prevSpent + added;

  const prevBonus = hasIncentivadorEconomia
    ? calcularBonusIncentivadorEconomia(prevSpent, characterLevel)
    : 0;
  const nextBonus = hasIncentivadorEconomia
    ? calcularBonusIncentivadorEconomia(nextSpent, characterLevel)
    : 0;
  const deltaBonus = Math.max(0, nextBonus - prevBonus);

  const prevAdvPm = Math.max(0, Number(vitals.pmTempAdventure) || 0);
  const prevDailyPm = Math.max(0, Number(vitals.pmTempDaily) || 0);
  const nextPmTempAdventure = prevAdvPm + deltaBonus;
  const nextPmTempMax = prevDailyPm + nextPmTempAdventure;

  const updated = normalizarVitais(
    {
      ...vitals,
      adventureSpentTibars: nextSpent,
      pmTempIncentivador: nextBonus,
      pmTempAdventure: nextPmTempAdventure,
      pmTempMax: nextPmTempMax,
      pmTempMode: nextPmTempMax > 0,
      pm: Number(vitals.pm || 0) + deltaBonus,
    },
    maximos,
  );

  return {
    vitals: updated,
    previousBonusPm: prevBonus,
    newBonusPm: nextBonus,
    deltaBonusPm: deltaBonus,
  };
}

/**
 * Define diretamente o total gasto na aventura (ex: input manual no modal de Fim de Aventura)
 * e recalcula o bônus automático do Incentivador da Economia preservando bônus manuais.
 */
export function setManualAdventureSpending(
  currentVitals: Partial<Vitais> | null | undefined,
  maximos: MaximoVitais,
  newTotalSpent: number,
  characterLevel: number,
  hasIncentivadorEconomia: boolean,
): AdventureSpendingUpdateResult {
  const vitals = normalizarVitais(currentVitals || {}, maximos);
  const nextSpent = Math.max(0, Number(newTotalSpent) || 0);
  const prevSpent = Math.max(0, Number(vitals.adventureSpentTibars) || 0);

  const prevBonus = hasIncentivadorEconomia
    ? calcularBonusIncentivadorEconomia(prevSpent, characterLevel)
    : 0;
  const nextBonus = hasIncentivadorEconomia
    ? calcularBonusIncentivadorEconomia(nextSpent, characterLevel)
    : 0;

  const prevAdvPm = Math.max(0, Number(vitals.pmTempAdventure) || 0);
  const prevDailyPm = Math.max(0, Number(vitals.pmTempDaily) || 0);
  const manualAdventurePm = Math.max(0, prevAdvPm - prevBonus);
  const nextPmTempAdventure = manualAdventurePm + nextBonus;
  const nextPmTempMax = prevDailyPm + nextPmTempAdventure;
  const deltaBonus = nextBonus - prevBonus;

  const updated = normalizarVitais(
    {
      ...vitals,
      adventureSpentTibars: nextSpent,
      pmTempIncentivador: nextBonus,
      pmTempAdventure: nextPmTempAdventure,
      pmTempMax: nextPmTempMax,
      pmTempMode: nextPmTempMax > 0,
      pm: Math.max(0, Number(vitals.pm || 0) + deltaBonus),
    },
    maximos,
  );

  return {
    vitals: updated,
    previousBonusPm: prevBonus,
    newBonusPm: nextBonus,
    deltaBonusPm: deltaBonus,
  };
}

/**
 * Adiciona PV ou PM temporários com escopo explícito ('daily' ou 'adventure').
 */
export function addScopedTemporaryVital(
  currentVitals: Partial<Vitais> | null | undefined,
  maximos: MaximoVitais,
  chave: ChaveVital,
  amount: number,
  escopo: EscopoTemporario,
): Vitais {
  const vitals = normalizarVitais(currentVitals || {}, maximos);
  const add = Math.max(0, Math.trunc(Number(amount) || 0));
  if (add === 0) return vitals;

  const dailyKey = `${chave}TempDaily`;
  const advKey = `${chave}TempAdventure`;
  const maxKey = `${chave}TempMax`;
  const modeKey = `${chave}TempMode`;

  const prevDaily = Math.max(0, Number(vitals[dailyKey]) || 0);
  const prevAdv = Math.max(0, Number(vitals[advKey]) || 0);

  const nextDaily = escopo === 'daily' ? prevDaily + add : prevDaily;
  const nextAdv = escopo === 'adventure' ? prevAdv + add : prevAdv;
  const nextTempMax = nextDaily + nextAdv;

  return normalizarVitais(
    {
      ...vitals,
      [dailyKey]: nextDaily,
      [advKey]: nextAdv,
      [maxKey]: nextTempMax,
      [modeKey]: nextTempMax > 0,
      [chave]: Number(vitals[chave] || 0) + add,
    },
    maximos,
  );
}

export { encerrarAventura };
