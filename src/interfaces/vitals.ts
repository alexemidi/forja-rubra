/**
 * Contratos de Pontos de Vida (PV), Pontos de Mana (PM), Descanso e Ciclo de Aventura.
 */

export type ChaveVital = 'pv' | 'pm';

export type DirecaoVital = 'up' | 'down';

export type EscopoTemporario = 'daily' | 'adventure';

export interface MaximoVitais {
  pv: number;
  pm: number;
}

export interface RecuperacaoDescanso {
  gainPv: number;
  gainPm: number;
}

export interface Vitais {
  pv?: number;
  pvMax?: number;
  pvTempMax?: number;
  pvTempDaily?: number;
  pvTempAdventure?: number;
  pvTempMode?: boolean;
  pm?: number;
  pmMax?: number;
  pmTempMax?: number;
  pmTempDaily?: number;
  pmTempAdventure?: number;
  pmTempMode?: boolean;
  pmTempIncentivador?: number;
  adventureSpentTibars?: number;
  [campo: string]: number | boolean | undefined;
}
