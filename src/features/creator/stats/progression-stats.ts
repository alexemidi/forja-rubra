/**
 * Cálculo de Estatísticas de Progressão do Personagem (PV, PM, Defesa).
 * Módulo puro parametrizado sem redefinições globais de progressionStats.
 */

import type { Atributos, AtributoChave } from '../../../interfaces/attributes.ts';
import type {
  BaseCharacterStats,
  PassiveEffectsSummary,
  ProgressionSlot,
} from '../../../interfaces/character-sheet.ts';
import { estatisticas } from '../../../lib/t20/economy.ts';

export interface ClassProgressionInfo {
  id: string;
  caracteristicas?: {
    pv?: { inicial?: number; porNivel?: number };
    pm?: { porNivel?: number };
  };
}

export interface ProgressionStatsInput {
  progression: ProgressionSlot[];
  baseAttrs: Atributos;
  effectiveAttrs: Atributos;
  plannedLevel: number;
  hasDomDaEsperanca?: boolean;
  suraggelHeritage?: string;
  hasCoracaoHeroico?: boolean;
  ageComplications?: string[];
  passiveEffects?: Partial<PassiveEffectsSummary>;
  getClassById: (classId: string) => ClassProgressionInfo | null | undefined;
  getSpellKeyAttribute?: (classId: string) => AtributoChave | null | undefined;
}

export interface BaseProgressionStatsResult extends BaseCharacterStats {
  pv: number;
  pm: number;
  defense: number;
}

export function calculateBaseProgressionStats(
  input: ProgressionStatsInput,
): BaseProgressionStatsResult {
  const slots =
    Array.isArray(input.progression) && input.progression.length > 0
      ? input.progression
      : [{ level: 1, classId: 'arcanista' }];

  const first = input.getClassById(slots[0].classId);
  const conAttr = input.hasDomDaEsperanca
    ? Number(input.baseAttrs.sab || 0)
    : Number(input.baseAttrs.con || 0);

  const pv =
    Number(first?.caracteristicas?.pv?.inicial || 0) +
    conAttr +
    slots.slice(1).reduce((sum, row) => {
      const cls = input.getClassById(row.classId);
      return sum + Number(cls?.caracteristicas?.pv?.porNivel || 0) + conAttr;
    }, 0);

  let pm = slots.reduce((sum, row) => {
    const cls = input.getClassById(row.classId);
    return sum + Number(cls?.caracteristicas?.pm?.porNivel || 0);
  }, 0);

  if (input.getSpellKeyAttribute) {
    const uniqueClassIds = new Set(slots.map((row) => row.classId));
    for (const classId of uniqueClassIds) {
      const key = input.getSpellKeyAttribute(classId);
      if (key) {
        pm += Math.max(0, Number(input.baseAttrs[key] || 0));
      }
    }
  }

  return {
    pv,
    pm,
    defense: 10 + Number(input.effectiveAttrs.des || 0),
  };
}

export function calculateProgressionStats(
  input: ProgressionStatsInput,
): BaseProgressionStatsResult {
  const stats = calculateBaseProgressionStats(input);
  const level = Math.max(1, Number(input.plannedLevel) || 1);
  const tier = level <= 4 ? 1 : level <= 10 ? 2 : level <= 16 ? 3 : 4;

  if (input.suraggelHeritage === 'heranca_de_drashantyr') stats.pm += 1;
  if (input.suraggelHeritage === 'heranca_de_vitalia') stats.pv += 5 * tier;
  if (input.suraggelHeritage === 'heranca_de_kundali') stats.defense += 2;
  if (input.hasCoracaoHeroico) stats.pm += 3 * tier;

  const fullPassive: PassiveEffectsSummary = {
    pvPerLevel: Number(input.passiveEffects?.pvPerLevel || 0),
    pvFlat: Number(input.passiveEffects?.pvFlat || 0),
    pmPerLevel: Number(input.passiveEffects?.pmPerLevel || 0),
    pmFlat: Number(input.passiveEffects?.pmFlat || 0),
    defenseAttribute: input.passiveEffects?.defenseAttribute || 'des',
    defenseBonus: Number(input.passiveEffects?.defenseBonus || 0),
  };

  const result = estatisticas(
    stats,
    fullPassive,
    input.effectiveAttrs as unknown as Record<string, number>,
    level,
  );

  const chosen = new Set(input.ageComplications || []);
  if (chosen.has('abatido')) result.pv -= 2 * level;
  if (chosen.has('melancolico')) result.pm -= level;

  return result;
}
