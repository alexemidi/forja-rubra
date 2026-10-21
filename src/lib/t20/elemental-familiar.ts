/**
 * Regras do poder Familiar Elemental / Familiar Arcano (Deuses de Arton / Heróis de Arton / Ameaças de Arton).
 * Permite escolher entre o Parceiro Adepto Iniciante ou um dos 4 familiares elementais:
 * Aquin'ne, T'peel, Pakk ou Terrier.
 */

export type ElementalFamiliarId = 'adepto' | 'aquinne' | 'tpeel' | 'pakk' | 'terrier';

export interface ElementalFamiliarOption {
  id: ElementalFamiliarId;
  name: string;
  shortName: string;
  elementLabel: string;
  partnerType: string;
  tier: 'iniciante';
  description: string;
  benefit: string;
  swimSpeedMeters?: number;
  carrySpacesBonus?: number;
  grantedSpell?: string;
  damageReduction?: string;
}

export const ELEMENTAL_FAMILIAR_OPTIONS: readonly ElementalFamiliarOption[] = [
  {
    id: 'adepto',
    name: 'Parceiro Adepto (Iniciante)',
    shortName: 'Adepto Iniciante',
    elementLabel: 'Espírito Arcano',
    partnerType: 'Adepto',
    tier: 'iniciante',
    description:
      'Um conjurador capaz de ajudá-lo a lançar suas magias. Iniciante: O custo para lançar suas magias de 1º círculo diminui em –1 PM.',
    benefit: 'O custo para lançar suas magias de 1º círculo diminui em –1 PM.',
  },
  {
    id: 'aquinne',
    name: "Aquin'ne",
    shortName: "Aquin'ne",
    elementLabel: 'Elemental da Água',
    partnerType: 'Familiar Elemental',
    tier: 'iniciante',
    description:
      'Um aquin’ne familiar concede deslocamento de natação 9m e permite lançar magias e respirar debaixo d’água.',
    benefit: 'Concede deslocamento de natação 9m e permite lançar magias e respirar debaixo d’água.',
    swimSpeedMeters: 9,
  },
  {
    id: 'tpeel',
    name: "T'peel",
    shortName: "T'peel",
    elementLabel: 'Elemental do Ar',
    partnerType: 'Familiar Elemental',
    tier: 'iniciante',
    description:
      'Um t’peel familiar pode carregar 2 espaços de itens e permite que você lance Queda Suave.',
    benefit: 'Pode carregar 2 espaços de itens e permite que você lance Queda Suave.',
    carrySpacesBonus: 2,
    grantedSpell: 'Queda Suave',
  },
  {
    id: 'pakk',
    name: 'Pakk',
    shortName: 'Pakk',
    elementLabel: 'Elemental do Fogo',
    partnerType: 'Familiar Elemental',
    tier: 'iniciante',
    description:
      'Um pakk familiar permite que você lance Explosão de Chamas. Caso aprenda novamente essa magia, seu custo diminui em –1 PM.',
    benefit:
      'Permite que você lance Explosão de Chamas. Caso aprenda novamente essa magia, seu custo diminui em –1 PM.',
    grantedSpell: 'Explosão de Chamas',
  },
  {
    id: 'terrier',
    name: 'Terrier',
    shortName: 'Terrier',
    elementLabel: 'Elemental da Terra',
    partnerType: 'Familiar Elemental',
    tier: 'iniciante',
    description: 'Um terrier familiar concede redução de dano 2/impacto.',
    benefit: 'Concede redução de dano 2/impacto.',
    damageReduction: '2/impacto',
  },
] as const;

/**
 * Normaliza qualquer identificador de escolha do Familiar Elemental para o ID canônico.
 */
export function normalizeElementalFamiliarId(rawId: string | undefined | null): ElementalFamiliarId | '' {
  const clean = String(rawId || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
  if (!clean) return '';
  if (clean === 'adepto' || clean === 'adeptoiniciante' || clean === 'parceiroadepto') return 'adepto';
  if (clean === 'aquinne' || clean === 'aquin') return 'aquinne';
  if (clean === 'tpeel') return 'tpeel';
  if (clean === 'pakk') return 'pakk';
  if (clean === 'terrier') return 'terrier';
  return '';
}

/**
 * Retorna a definição completa da opção escolhida para o Familiar Elemental.
 */
export function getElementalFamiliarOption(rawId: string | undefined | null): ElementalFamiliarOption | null {
  const norm = normalizeElementalFamiliarId(rawId);
  if (!norm) return null;
  return ELEMENTAL_FAMILIAR_OPTIONS.find((opt) => opt.id === norm) || null;
}

/**
 * Formata o título para exibição na ficha: Familiar Elemental(Escolha).
 */
export function formatElementalFamiliarSheetTitle(
  basePowerName = 'Familiar Elemental',
  choiceId?: string | null
): string {
  const opt = getElementalFamiliarOption(choiceId);
  if (!opt) return basePowerName;
  return `${basePowerName}(${opt.shortName})`;
}
