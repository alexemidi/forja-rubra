/**
 * Regras puras de Passos de Dano de Armas — Tormenta 20
 * Baseado na Tabela 3-2 do Tormenta 20 Jogo do Ano (JDA, p. 145).
 */

export type DamageRung = readonly [number, number];

export interface StepUpDamageOptions {
  allowAltLadder?: boolean;
}

export const DAMAGE_LADDER: readonly DamageRung[] = Object.freeze([
  [0, 1], // 1 (dano fixo)
  [1, 2], // 1d2
  [1, 3], // 1d3
  [1, 4], // 1d4
  [1, 6], // 1d6
  [1, 8], // 1d8
  [1, 10], // 1d10
  [1, 12], // 1d12
  [3, 6], // 3d6
  [4, 6], // 4d6
  [4, 8], // 4d8
  [4, 10], // 4d10
  [4, 12], // 4d12 (teto oficial)
]);

export const TWO_DICE_LADDER: readonly DamageRung[] = Object.freeze([
  [0, 1], // 1 (dano fixo)
  [1, 2], // 1d2
  [1, 3], // 1d3
  [1, 4], // 1d4
  [1, 6], // 1d6
  [1, 8], // 1d8
  [1, 10], // 1d10
  [2, 6], // 2d6
  [2, 8], // 2d8
  [2, 10], // 2d10
  [3, 10], // 3d10
  [4, 10], // 4d10
  [4, 12], // 4d12 (teto oficial)
]);

const DICE_RE = /^(\d+)d(\d+)(.*)$/;
const FIXED_RE = /^(\d+)(.*)$/;

function formatRung(rung: DamageRung, rest: string): string {
  const [count, faces] = rung;
  if (count === 0) return `${faces}${rest}`;
  return `${count}d${faces}${rest}`;
}

function indexIn(
  ladder: readonly DamageRung[],
  count: number,
  faces: number
): number {
  return ladder.findIndex(([c, f]) => c === count && f === faces);
}

function resolveLadder(
  count: number,
  faces: number,
  options?: StepUpDamageOptions
): { ladder: readonly DamageRung[]; index: number } | null {
  const primary = indexIn(DAMAGE_LADDER, count, faces);
  if (primary !== -1) {
    return { ladder: DAMAGE_LADDER, index: primary };
  }
  if (options?.allowAltLadder) {
    const alt = indexIn(TWO_DICE_LADDER, count, faces);
    if (alt !== -1) {
      return { ladder: TWO_DICE_LADDER, index: alt };
    }
  }
  return null;
}

function stepUpSinglePart(
  part: string,
  steps: number,
  options?: StepUpDamageOptions
): string {
  const trimmed = String(part || '').trim();
  if (!trimmed || trimmed === '-') return part;

  const diceMatch = trimmed.match(DICE_RE);
  if (diceMatch) {
    const [, countStr, facesStr, rest] = diceMatch;
    const count = parseInt(countStr, 10);
    const faces = parseInt(facesStr, 10);
    const resolved = resolveLadder(count, faces, options);
    if (!resolved) return part;
    const { ladder, index } = resolved;
    const targetIdx = Math.min(
      ladder.length - 1,
      Math.max(0, index + steps)
    );
    return formatRung(ladder[targetIdx], rest);
  }

  const fixedMatch = trimmed.match(FIXED_RE);
  if (fixedMatch) {
    const [, valueStr, rest] = fixedMatch;
    if (parseInt(valueStr, 10) === 1) {
      const targetIdx = Math.min(
        DAMAGE_LADDER.length - 1,
        Math.max(0, steps)
      );
      return formatRung(DAMAGE_LADDER[targetIdx], rest);
    }
  }

  return part;
}

/**
 * Aumenta ou diminui o dado de dano em N passos seguindo a escala de Tormenta 20.
 * Suporta formatos compostos (ex: "1d8/1d10") e preserva modificadores (ex: "1d6+2").
 */
export function stepUpDamage(
  damage: string,
  steps: number,
  options?: StepUpDamageOptions
): string {
  if (!damage || steps === 0) return damage;
  return String(damage)
    .split('/')
    .map((part) => stepUpSinglePart(part, steps, options))
    .join('/');
}

/**
 * Calcula o dano médio esperado da expressão de dado.
 */
export function damageAverage(damage: string): number {
  const [first] = String(damage || '').split('/');
  const match = first.trim().match(DICE_RE);
  if (!match) {
    const fixed = first.trim().match(FIXED_RE);
    return fixed ? parseInt(fixed[1], 10) : 0;
  }
  const count = parseInt(match[1], 10);
  const faces = parseInt(match[2], 10);
  return (count * (faces + 1)) / 2;
}

function addBonusToSinglePart(part: string, bonus: number): string {
  const trimmed = String(part || '').trim();
  if (!trimmed || trimmed === '-') return part;
  const match = trimmed.match(/^(.*?)([+-]\d+)?$/);
  if (!match) return trimmed;
  const base = match[1];
  const existing = match[2] ? parseInt(match[2], 10) : 0;
  const total = existing + bonus;
  if (total === 0) return base;
  return total > 0 ? `${base}+${total}` : `${base}${total}`;
}

/**
 * Soma bônus numérico fixo ao dano, tratando múltiplos modos (ex: "1d6/1d6" + 2 => "1d6+2/1d6+2").
 */
export function addFlatDamageBonus(damage: string, bonus: number): string {
  if (!damage || bonus === 0) return damage;
  return String(damage)
    .split('/')
    .map((part) => addBonusToSinglePart(part, bonus))
    .join('/');
}

export const ModuloPassosDano = Object.freeze({
  DAMAGE_LADDER,
  TWO_DICE_LADDER,
  stepUpDamage,
  damageAverage,
  addFlatDamageBonus,
});

export default ModuloPassosDano;
