/**
 * Estatísticas Passivas de Armaduras e Escudos (Tormenta 20).
 * Inclui regras específicas de armaduras do Arsenal (Folhas, Pedra, Chumbo, Engenhoqueiro Goblin, Justa, Hussardo Alado).
 */

export interface ArmorPassiveInput {
  itemId?: string;
  itemName?: string;
  categoriaId?: 'leve' | 'pesada' | string;
  baseDefenseBonus?: number;
  baseArmorPenalty?: number;
  improvements?: string[];
  materialId?: string | null;
  trainedSurvivencia?: boolean;
  goblinExtraSpacesUsed?: number;
}

export interface ArmorPassiveResult {
  defenseBonus: number;
  armorPenalty: number;
  bonusPm: number;
  damageReduction: number;
  damageReductionType: string;
  magicResistanceBonus: number;
  stealthPenalty: number;
  ignoresContraptionActivationPenalty: boolean;
  displacementHalved: boolean;
  bonusVsKnockdown: number;
  hasMountedChargeIntimidate: boolean;
  extraLoadSpacesFree: number;
  canReduceArmorPenalty: boolean;
}

function normalizeId(raw?: string | null): string {
  return String(raw || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function calculateSpecialArmorEffects(
  input: ArmorPassiveInput,
): ArmorPassiveResult {
  const id = normalizeId(input.itemId || input.itemName);
  const improvements = new Set((input.improvements || []).map((i) => normalizeId(i)));
  const mat = normalizeId(input.materialId);

  const isEngenhoqueiroGoblin =
    id === 'armadura_de_engenhoqueiro_goblin' || id.includes('engenhoqueiro_goblin');
  const isFolhas = id === 'armadura_de_folhas' || id.includes('armadura_de_folhas');
  const isPedra = id === 'armadura_de_pedra' || id.includes('armadura_de_pedra');
  const isChumbo = id === 'armadura_de_chumbo' || id.includes('armadura_de_chumbo');
  const isJusta = id === 'armadura_de_justa' || id.includes('armadura_de_justa');
  const isHussardo =
    id === 'armadura_de_hussardo_alado' || id.includes('hussardo_alado');

  let defenseBonus = Number(input.baseDefenseBonus) || 0;
  let armorPenalty = Math.abs(Number(input.baseArmorPenalty) || 0);

  if (improvements.has('reforcada')) {
    defenseBonus += 1;
    armorPenalty += 1;
  }

  // Armadura de Engenhoqueiro Goblin não pode ter sua penalidade reduzida por quaisquer efeitos
  const canReduceArmorPenalty = !isEngenhoqueiroGoblin;

  if (canReduceArmorPenalty) {
    if (improvements.has('ajustada')) armorPenalty = Math.max(0, armorPenalty - 1);
    if (improvements.has('sob_medida')) armorPenalty = Math.max(0, armorPenalty - 2);
    if (mat === 'mitral') armorPenalty = Math.max(0, armorPenalty - 2);
  }

  // Armadura de Pedra não pode receber material especial; se alguém tentar passar, ignora
  const effectiveMaterial = isPedra ? '' : mat;
  if (effectiveMaterial === 'materia_vermelha') {
    defenseBonus += 1;
  }

  let extraSpacesPenalty = 0;
  if (isEngenhoqueiroGoblin) {
    const extraUsed = Math.max(0, Math.min(8, Number(input.goblinExtraSpacesUsed) || 0));
    extraSpacesPenalty = extraUsed;
    armorPenalty = Math.min(10, armorPenalty + extraSpacesPenalty);
  }

  const bonusPm = isFolhas && Boolean(input.trainedSurvivencia) ? 2 : 0;

  let damageReduction = 0;
  let damageReductionType = '';
  if (isPedra) {
    damageReduction += 2;
  } else if (isChumbo) {
    damageReduction += 2;
    damageReductionType = 'mundano';
  }
  if (effectiveMaterial === 'adamante') {
    damageReduction += input.categoriaId === 'pesada' ? 5 : 2;
  }

  return {
    defenseBonus,
    armorPenalty: -armorPenalty,
    bonusPm,
    damageReduction,
    damageReductionType,
    magicResistanceBonus: isChumbo ? 2 : 0,
    stealthPenalty: isEngenhoqueiroGoblin ? -5 : 0,
    ignoresContraptionActivationPenalty: isEngenhoqueiroGoblin,
    displacementHalved: isPedra,
    bonusVsKnockdown: isJusta ? 5 : 0,
    hasMountedChargeIntimidate: isHussardo,
    extraLoadSpacesFree: isEngenhoqueiroGoblin ? 2 : 0,
    canReduceArmorPenalty,
  };
}
