// Regras puras de Passos de Dano de Armas - Tormenta 20
// Baseado na Tabela 3-2 do Tormenta 20 Jogo do Ano (JDA, p. 145)

const DAMAGE_LADDER = [
  [0, 1],  // 1 (dano fixo)
  [1, 2],  // 1d2
  [1, 3],  // 1d3
  [1, 4],  // 1d4
  [1, 6],  // 1d6
  [1, 8],  // 1d8
  [1, 10], // 1d10
  [1, 12], // 1d12
  [3, 6],  // 3d6
  [4, 6],  // 4d6
  [4, 8],  // 4d8
  [4, 10], // 4d10
  [4, 12]  // 4d12 (teto oficial)
];

const TWO_DICE_LADDER = [
  [0, 1],  // 1 (dano fixo)
  [1, 2],  // 1d2
  [1, 3],  // 1d3
  [1, 4],  // 1d4
  [1, 6],  // 1d6
  [1, 8],  // 1d8
  [1, 10], // 1d10
  [2, 6],  // 2d6
  [2, 8],  // 2d8
  [2, 10], // 2d10
  [3, 10], // 3d10
  [4, 10], // 4d10
  [4, 12]  // 4d12 (teto oficial)
];

const DICE_RE = /^(\d+)d(\d+)(.*)$/;
const FIXED_RE = /^(\d+)(.*)$/;

function formatRung(rung, rest) {
  const [count, faces] = rung;
  if (count === 0) return `${faces}${rest}`;
  return `${count}d${faces}${rest}`;
}

function indexIn(ladder, count, faces) {
  return ladder.findIndex(([c, f]) => c === count && f === faces);
}

function resolveLadder(count, faces, options) {
  const primary = indexIn(DAMAGE_LADDER, count, faces);
  if (primary !== -1) {
    return { ladder: DAMAGE_LADDER, index: primary };
  }
  if (options && options.allowAltLadder) {
    const alt = indexIn(TWO_DICE_LADDER, count, faces);
    if (alt !== -1) {
      return { ladder: TWO_DICE_LADDER, index: alt };
    }
  }
  return null;
}

function stepUpSinglePart(part, steps, options) {
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
    const targetIdx = Math.min(ladder.length - 1, Math.max(0, index + steps));
    return formatRung(ladder[targetIdx], rest);
  }

  const fixedMatch = trimmed.match(FIXED_RE);
  if (fixedMatch) {
    const [, valueStr, rest] = fixedMatch;
    if (parseInt(valueStr, 10) === 1) {
      const targetIdx = Math.min(DAMAGE_LADDER.length - 1, Math.max(0, steps));
      return formatRung(DAMAGE_LADDER[targetIdx], rest);
    }
  }

  return part;
}

/**
 * Aumenta ou diminui o dado de dano em N passos seguindo a escala de Tormenta 20.
 * Suporta formatos compostos (ex: "1d8/1d10") e preserva modificadores (ex: "1d6+2").
 */
function stepUpDamage(damage, steps, options) {
  if (!damage || steps === 0) return damage;
  return String(damage)
    .split('/')
    .map((part) => stepUpSinglePart(part, steps, options))
    .join('/');
}

/**
 * Calcula o dano médio esperado da expressão de dado.
 */
function damageAverage(damage) {
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

function addBonusToSinglePart(part, bonus) {
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
function addFlatDamageBonus(damage, bonus) {
  if (!damage || bonus === 0) return damage;
  return String(damage)
    .split('/')
    .map((part) => addBonusToSinglePart(part, bonus))
    .join('/');
}

const ModuloPassosDano = {
  DAMAGE_LADDER,
  TWO_DICE_LADDER,
  stepUpDamage,
  damageAverage,
  addFlatDamageBonus
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ModuloPassosDano;
}

if (typeof window !== 'undefined') {
  window.ForjaPassosDano = ModuloPassosDano;
}
