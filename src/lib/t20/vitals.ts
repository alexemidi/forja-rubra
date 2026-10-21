/**
 * Regras puras de Pontos de Vida (PV), Pontos de Mana (PM),
 * Temporários Diários vs. Aventura, Descanso e Fim da Aventura (Tormenta 20).
 */

import type {
  Vitais,
  MaximoVitais,
  ChaveVital,
  DirecaoVital,
  RecuperacaoDescanso,
} from '../../interfaces/vitals.ts';

/**
 * Normaliza os vitais atuais e máximos sem mutar o estado original.
 * Preserva a separação entre temporários diários e temporários pela aventura.
 */
export function normalizarVitais(old: Vitais, maximum: MaximoVitais): Vitais {
  const result: Vitais = { ...old };
  for (const key of ['pv', 'pm'] as const) {
    const max = Math.max(0, Math.trunc(Number(maximum[key]) || 0));
    const oldMax = Number.isFinite(Number(old[key + 'Max']))
      ? Number(old[key + 'Max'])
      : max;
    const oldCurrent = Number.isFinite(Number(old[key]))
      ? Number(old[key])
      : oldMax;
    const oldTempMax = Math.max(
      0,
      Math.trunc(Number(old[key + 'TempMax']) || 0)
    );
    let tempDaily = Math.max(
      0,
      Math.trunc(Number(old[key + 'TempDaily']) || 0)
    );
    let tempAdventure = Math.max(
      0,
      Math.trunc(Number(old[key + 'TempAdventure']) || 0)
    );
    if (oldTempMax === 0 && tempDaily + tempAdventure > 0) {
      tempDaily = 0;
      tempAdventure = 0;
    }
    const tempMax =
      tempDaily + tempAdventure > 0 ? tempDaily + tempAdventure : oldTempMax;
    result[key + 'Max'] = max;
    result[key + 'TempMax'] = tempMax;
    result[key + 'TempDaily'] = tempDaily;
    result[key + 'TempAdventure'] = tempAdventure;
    result[key + 'TempMode'] = Boolean(old[key + 'TempMode']);
    const minLimit = key === 'pv' ? -Math.floor(max / 2) : 0;
    const ceiling = max + tempMax;
    result[key] =
      oldCurrent > oldMax
        ? Math.min(ceiling, max + oldCurrent - oldMax)
        : Math.max(minLimit, Math.min(ceiling, Math.trunc(oldCurrent + max - oldMax)));
  }
  return result;
}

/**
 * Altera PV ou PM para cima (cura/recuperação) ou para baixo (dano/gasto).
 * Aplica a regra de morte/sangramento extremo (zerar PM ao atingir -PVMax/2).
 */
export function alterarVital(
  input: Vitais,
  key: ChaveVital,
  direction: DirecaoVital,
  amount: number
): Vitais {
  if (!Number.isSafeInteger(amount) || amount < 1) {
    throw new Error('Quantidade inválida.');
  }
  const next: Vitais = { ...input };
  const minimum = key === 'pv' ? -Math.floor(Number(next.pvMax) / 2) : 0;

  if (direction === 'down' && key === 'pv') {
    // Regra T20: Dano reduz PV temporários primeiro, removendo-os definitivamente (não podem ser curados)
    const currentTemp = Math.max(0, Number(next.pvTempMax) || 0);
    if (currentTemp > 0) {
      const absorbedByTemp = Math.min(currentTemp, amount);
      let remAbsorb = absorbedByTemp;
      if (next.pvTempDaily && next.pvTempDaily > 0) {
        const subDaily = Math.min(next.pvTempDaily, remAbsorb);
        next.pvTempDaily -= subDaily;
        remAbsorb -= subDaily;
      }
      if (remAbsorb > 0 && next.pvTempAdventure && next.pvTempAdventure > 0) {
        const subAdv = Math.min(next.pvTempAdventure, remAbsorb);
        next.pvTempAdventure -= subAdv;
        remAbsorb -= subAdv;
      }
      next.pvTempMax = Math.max(0, (next.pvTempDaily || 0) + (next.pvTempAdventure || 0));
      if (next.pvTempMax === 0) {
        next.pvTempMode = false;
      }
    }
    next.pv = Math.max(minimum, Number(next.pv) - amount);
    if (Number(next.pvMax) > 0 && Number(next.pv) <= minimum) {
      next.pm = 0;
    }
    return next;
  }

  const ceiling =
    Number(next[key + 'Max']) + Number(next[key + 'TempMax'] || 0);
  next[key] =
    direction === 'up'
      ? Math.min(ceiling, Number(next[key]) + amount)
      : Math.max(minimum, Number(next[key]) - amount);
  if (
    direction === 'down' &&
    key === 'pv' &&
    Number(next.pvMax) > 0 &&
    Number(next.pv) <= minimum
  ) {
    next.pm = 0;
  }
  return next;
}

/**
 * Encerra vitais temporários diários e aplica recuperação de descanso,
 * preservando integralmente os bônus temporários de aventura.
 */
export function aplicarDescanso(
  input: Vitais,
  recovery: RecuperacaoDescanso
): Vitais {
  if (
    ![recovery.gainPv, recovery.gainPm].every(
      (n) => Number.isFinite(n) && n >= 0
    )
  ) {
    throw new Error('Recuperação inválida.');
  }
  const advPv = Math.max(0, Math.trunc(Number(input.pvTempAdventure) || 0));
  const advPm = Math.max(0, Math.trunc(Number(input.pmTempAdventure) || 0));
  const next: Vitais = {
    ...input,
    pvTempDaily: 0,
    pmTempDaily: 0,
    pvTempMax: advPv,
    pmTempMax: advPm,
    pvTempMode: advPv > 0,
    pmTempMode: advPm > 0,
  };
  const basePvMax = Number(next.pvMax) || 0;
  const basePmMax = Number(next.pmMax) || 0;
  next.pv = Math.min(
    basePvMax + advPv,
    Math.max(0, Number(next.pv) + recovery.gainPv)
  );
  next.pm = Math.min(
    basePmMax + advPm,
    Math.max(0, Number(next.pm) + recovery.gainPm)
  );
  return next;
}

/**
 * Encerra todos os recursos temporários (diários e de aventura) e contadores de gastos ao fim da aventura.
 */
export function encerrarAventura(input: Vitais): Vitais {
  const next: Vitais = {
    ...input,
    pvTempDaily: 0,
    pmTempDaily: 0,
    pvTempAdventure: 0,
    pmTempAdventure: 0,
    pvTempMax: 0,
    pmTempMax: 0,
    pvTempMode: false,
    pmTempMode: false,
    pmTempIncentivador: 0,
    adventureSpentTibars: 0,
  };
  const basePvMax = Number(next.pvMax) || 0;
  const basePmMax = Number(next.pmMax) || 0;
  next.pv = Math.min(basePvMax, Number(next.pv));
  next.pm = Math.min(basePmMax, Number(next.pm));
  return next;
}

/**
 * Calcula o bônus de PM temporário até o fim da aventura concedido pelo poder
 * "Incentivador da Economia": +1 PM para cada (50 * nível do personagem) T$ gastos.
 */
export function calcularBonusIncentivadorEconomia(
  gastoAventuraTibares: number,
  nivelPersonagem: number
): number {
  const gasto = Math.max(0, Number(gastoAventuraTibares) || 0);
  const nivel = Math.max(1, Math.trunc(Number(nivelPersonagem) || 1));
  const limiar = 50 * nivel;
  return Math.floor(gasto / limiar);
}
