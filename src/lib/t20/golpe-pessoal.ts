/**
 * Regras puras e cálculo de Golpe Pessoal — Guerreiro (Tormenta 20).
 */

export interface GolpePessoalEffectInput {
  effectName: string;
  repeats?: number;
  choices?: string[];
}

export interface GolpePessoalCatalogEffect {
  name: string;
  cost: number;
  variableCost?: boolean;
  maxRepeats?: number;
  canRepeat?: boolean;
  requiresChoice?: boolean;
  category?: string;
  [key: string]: unknown;
}

export interface GolpePessoalBuildInput {
  weapon?: string;
  effects?: GolpePessoalEffectInput[];
  totalCost?: number;
  [key: string]: unknown;
}

export interface GolpePessoalValidationResult {
  isValid: boolean;
  errors: string[];
}

export function resolveEffectKey(
  effectName: string,
  effectsMap: Record<string, GolpePessoalCatalogEffect>,
  legacyKeys?: Record<string, string>
): string | undefined {
  if (effectsMap && effectsMap[effectName]) return effectName;
  if (
    legacyKeys &&
    legacyKeys[effectName] &&
    effectsMap?.[legacyKeys[effectName]]
  ) {
    return legacyKeys[effectName];
  }
  const normalized = String(effectName || '').toUpperCase();
  if (effectsMap && effectsMap[normalized]) return normalized;
  return undefined;
}

/**
 * Calcula o custo total em PM de um Golpe Pessoal.
 */
export function calculateGolpePessoalCost(
  effects: readonly GolpePessoalEffectInput[],
  effectsMap: Record<string, GolpePessoalCatalogEffect>,
  legacyKeys?: Record<string, string>,
  getSpellCircle?: (spellName?: string) => number
): number {
  if (!Array.isArray(effects)) return 0;
  return effects.reduce((total, effectData) => {
    const key = resolveEffectKey(
      effectData.effectName,
      effectsMap,
      legacyKeys
    );
    if (!key) return total;
    const effect = effectsMap[key];
    const repeats = Number(effectData.repeats) || 1;

    if (effect.variableCost && effect.name === 'Conjurador') {
      const spellName = effectData.choices && effectData.choices[0];
      const circle =
        typeof getSpellCircle === 'function' ? getSpellCircle(spellName) : 1;
      const spellCost = circle === 2 ? 4 : 2;
      return total + spellCost * repeats;
    }

    return total + Number(effect.cost || 0) * repeats;
  }, 0);
}

/**
 * Valida um Golpe Pessoal conforme as regras de Tormenta 20.
 */
export function validateGolpePessoalBuild(
  build: GolpePessoalBuildInput | null | undefined,
  effectsMap: Record<string, GolpePessoalCatalogEffect>,
  legacyKeys?: Record<string, string>,
  maxCostAllowed?: number
): GolpePessoalValidationResult {
  const errors: string[] = [];
  if (!build || typeof build !== 'object') {
    return { isValid: false, errors: ['Dados do Golpe Pessoal invalidos'] };
  }

  if (!build.weapon || String(build.weapon).trim() === '') {
    errors.push('Arma deve ser especificada');
  }

  const effects = Array.isArray(build.effects) ? build.effects : [];
  if (effects.length === 0) {
    errors.push('Pelo menos um efeito deve ser selecionado');
  }

  let totalPositive = 0;
  effects.forEach((eff) => {
    const key = resolveEffectKey(eff.effectName, effectsMap, legacyKeys);
    if (!key) {
      errors.push(`Efeito invalido: ${eff.effectName}`);
      return;
    }
    const def = effectsMap[key];
    const repeats = Number(eff.repeats) || 1;

    if (def.category !== 'drawback') {
      totalPositive += repeats;
    }

    if (def.maxRepeats && repeats > def.maxRepeats) {
      errors.push(
        `${def.name} pode ser selecionado no maximo ${def.maxRepeats} vezes`
      );
    }

    if (!def.canRepeat && repeats > 1) {
      errors.push(`${def.name} nao pode ser repetido`);
    }

    if (def.requiresChoice && (!eff.choices || eff.choices.length === 0)) {
      errors.push(`${def.name} requer uma escolha obrigatoria`);
    }
  });

  if (effects.length > 0 && totalPositive === 0) {
    errors.push('Pelo menos um efeito positivo deve ser selecionado');
  }

  const cost = Number(build.totalCost || 0);
  if (cost < 1) {
    errors.push('Golpe Pessoal deve custar pelo menos 1 PM');
  }

  if (typeof maxCostAllowed === 'number' && cost > maxCostAllowed) {
    errors.push(
      `Custo em PM (${cost}) excede o limite permitido (${maxCostAllowed} PM)`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Gera texto descritivo padronizado do Golpe Pessoal.
 */
export function formatGolpePessoalDescription(
  build: GolpePessoalBuildInput | null | undefined,
  effectsMap: Record<string, GolpePessoalCatalogEffect>,
  legacyKeys?: Record<string, string>
): string {
  if (!build) return '';
  const weapon = build.weapon || 'Arma';
  const effects = Array.isArray(build.effects) ? build.effects : [];
  const parts = effects.map((eff) => {
    const key = resolveEffectKey(eff.effectName, effectsMap, legacyKeys);
    const name =
      key && effectsMap[key] ? effectsMap[key].name : eff.effectName;
    const repeats = Number(eff.repeats) || 1;
    let desc = name;
    if (repeats > 1) {
      desc += ` (${repeats}x)`;
    }
    if (eff.choices && eff.choices.length > 0) {
      desc += ` (${eff.choices.join(', ')})`;
    }
    return desc;
  });

  const cost = build.totalCost !== undefined ? build.totalCost : 0;
  return `Golpe Pessoal (${weapon}) - ${parts.join(', ')} [${cost} PM]`;
}

export const ModuloGolpePessoal = Object.freeze({
  resolveEffectKey,
  calculateGolpePessoalCost,
  validateGolpePessoalBuild,
  formatGolpePessoalDescription,
});

export default ModuloGolpePessoal;
