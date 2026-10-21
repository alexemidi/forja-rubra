/**
 * Regras puras de Progressão de Nível, Patamares e Pré-Requisitos Básicos (Tormenta 20).
 */

export type PatamarPersonagem = 'iniciante' | 'veterano' | 'campeão' | 'lenda';

export interface BasicRequirementsSpec {
  level?: number;
  attrs?: readonly [string, number][];
  skills?: readonly string[];
  skillGroups?: readonly (readonly string[])[];
}

export function requisitosBasicos(
  requirements: BasicRequirementsSpec,
  classLevel: number,
  attrs: Record<string, number>,
  trained: Set<string> | readonly string[],
  attributeLabel: (id: string) => string,
  skillLabel: (id: string) => string
): string[] {
  const reasons: string[] = [];
  if (requirements.level && requirements.level > classLevel) {
    reasons.push(`Requer nível ${requirements.level} nesta classe.`);
  }
  for (const [id, value] of requirements.attrs || []) {
    if (Number(attrs[id]) < value) {
      reasons.push(`Requer ${attributeLabel(id)} ${value}.`);
    }
  }
  const trainedSet =
    trained instanceof Set ? trained : new Set(trained || []);
  const isSkillMet = (s: string): boolean => {
    if (trainedSet.has(s)) return true;
    if (s === 'oficio') {
      return [...trainedSet].some((item) => String(item).startsWith('oficio'));
    }
    if (String(s).startsWith('oficio:')) {
      if (
        trainedSet.has('inventor_artesao_criativo') ||
        trainedSet.has('artesao_criativo') ||
        (typeof (globalThis as any).state !== 'undefined' &&
          Array.isArray((globalThis as any).state?.progression) &&
          (globalThis as any).state.progression.some(
            (p: any) =>
              p?.powerId === 'inventor_artesao_criativo' ||
              p?.powerId === 'artesao_criativo'
          ))
      ) {
        return true;
      }
      const norm = String(s).replace(/[:_]/g, ':');
      return [...trainedSet].some(
        (item) => String(item).replace(/[:_]/g, ':') === norm
      );
    }
    return false;
  };
  if (requirements.skillGroups && requirements.skillGroups.length) {
    for (const group of requirements.skillGroups) {
      if (!group.some(isSkillMet)) {
        reasons.push(`Requer treino em ${group.map(skillLabel).join(' ou ')}.`);
      }
    }
  } else {
    for (const skill of requirements.skills || []) {
      if (!isSkillMet(skill)) {
        reasons.push(`Requer treino em ${skillLabel(skill)}.`);
      }
    }
  }
  return reasons;
}

export function patamar(level: number): PatamarPersonagem {
  if (level <= 4) return 'iniciante';
  if (level <= 10) return 'veterano';
  if (level <= 16) return 'campeão';
  return 'lenda';
}

export function atributos(
  base: Record<string, number>,
  rows: readonly { powerId?: string; powerChoice?: string }[] | undefined,
  isMarahAuthority: (row: { powerId?: string; powerChoice?: string }) => boolean
): Record<string, number> {
  const values: Record<string, number> = { ...base };
  for (const row of rows || []) {
    if (
      row.powerId === 'classe_aumento_de_atributo' &&
      row.powerChoice &&
      values[row.powerChoice] !== undefined
    ) {
      values[row.powerChoice]++;
    }
    if (isMarahAuthority(row)) {
      values.car = (values.car || 0) + 1;
    }
  }
  return values;
}

export const RegrasProgressao = Object.freeze({
  requisitosBasicos,
  patamar,
  atributos,
});

export default RegrasProgressao;
