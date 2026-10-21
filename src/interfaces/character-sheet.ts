/**
 * Contrato principal do Estado da Ficha de Personagem (CharacterState) da Forja T20.
 * Preserva todos os campos legados e desconhecidos para 100% de compatibilidade.
 */

import type { Atributos, AtributoChave } from './attributes.ts';
import type { Vitais } from './vitals.ts';
import type { BackpackItem } from './equipment.ts';
import type { PartnerEntry } from './companions.ts';

export interface CharacterIdentity {
  characterName: string;
  playerName: string;
  raceId: string;
  classId: string;
  initialLevel: number;
  plannedLevel: number;
  editingLevel?: number;
  ageBand?: string;
  ageYears?: string;
  complicationId?: string;
  [key: string]: unknown;
}

export interface CharacterSkills {
  class: string[];
  race: string[];
  int: string[];
  origin?: string[];
  others?: string[];
  [key: string]: unknown;
}

export interface CharacterOriginState {
  standard?: string;
  regional?: string;
  benefits: string[];
  previewBenefit?: string;
  [key: string]: unknown;
}

export interface CharacterDeityState {
  mode: string;
  name: string;
  power: string;
  previewPower: string;
  previewDeity: string;
  activePowerIndex: number;
  masterPermission?: boolean;
  [key: string]: unknown;
}

export interface CharacterPowersState {
  general: string[];
  activeSlot?: number;
  phase6StageIndex?: number;
  previewId?: string;
  raceGroups: Record<string, string[]>;
  originGeneral?: Record<string, string>;
  cosmopolitaPower?: string;
  cosmopolitaPreview?: string;
  futuraLendaClassPower?: string;
  duploFeericoClassPower?: string;
  [key: string]: unknown;
}

export interface ProgressionSlot {
  classId: string;
  powerId?: string;
  powerChoice?: string;
  previewPowerId?: string;
  previewPowerChoice?: string;
  powerSourceFilter?: string;
  powerCategoryFilter?: string;
  powerStatusFilter?: string;
  [key: string]: unknown;
}

export interface CharacterFinances {
  goldCoins?: number;
  brokenSilver?: number;
  [key: string]: unknown;
}

export interface CoinsBreakdown {
  tc: number;
  ts: number;
  to: number;
}

export interface BaseCharacterStats {
  pv: number;
  pm: number;
  defense?: number;
  [key: string]: unknown;
}

export interface PassiveEffectsSummary {
  pvPerLevel: number;
  pvFlat: number;
  pmPerLevel: number;
  pmFlat: number;
  defenseAttribute: AtributoChave;
  defenseBonus: number;
}

export interface CharacterState {
  step: number;
  completed: number[];
  finished?: boolean;
  sheetView?: boolean;
  identity: CharacterIdentity;
  attributes: Atributos;
  skills: CharacterSkills;
  origin: CharacterOriginState;
  deity: CharacterDeityState;
  powers: CharacterPowersState;
  progression: ProgressionSlot[];
  vitals?: Vitais;
  backpack?: BackpackItem[];
  partners?: PartnerEntry[];
  finances?: CharacterFinances;
  tibars?: number;
  [key: string]: unknown;
}
