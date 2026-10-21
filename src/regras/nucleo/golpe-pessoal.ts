// Regras puras e calculo de Golpe Pessoal - Tormenta 20

function resolveEffectKey(effectName, effectsMap, legacyKeys) {
  if (effectsMap && effectsMap[effectName]) return effectName;
  if (legacyKeys && legacyKeys[effectName] && effectsMap[legacyKeys[effectName]]) {
    return legacyKeys[effectName];
  }
  const normalized = String(effectName || '').toUpperCase();
  if (effectsMap && effectsMap[normalized]) return normalized;
  return undefined;
}

/**
 * Calcula o custo total em PM de um Golpe Pessoal.
 * @param {Array<{ effectName: string, repeats: number, choices?: string[] }>} effects
 * @param {Record<string, any>} effectsMap
 * @param {Record<string, string>} [legacyKeys]
 * @param {Function} [getSpellCircle] - Funcao opcional para consultar circulo de magia (retorna 1 ou 2)
 * @returns {number} Custo total em PM
 */
function calculateGolpePessoalCost(effects, effectsMap, legacyKeys, getSpellCircle) {
  if (!Array.isArray(effects)) return 0;
  return effects.reduce((total, effectData) => {
    const key = resolveEffectKey(effectData.effectName, effectsMap, legacyKeys);
    if (!key) return total;
    const effect = effectsMap[key];
    const repeats = Number(effectData.repeats) || 1;

    if (effect.variableCost && effect.name === 'Conjurador') {
      const spellName = effectData.choices && effectData.choices[0];
      const circle = typeof getSpellCircle === 'function' ? getSpellCircle(spellName) : 1;
      const spellCost = circle === 2 ? 4 : 2;
      return total + (spellCost * repeats);
    }

    return total + (Number(effect.cost || 0) * repeats);
  }, 0);
}

/**
 * Valida um Golpe Pessoal conforme as regras do Tormenta 20.
 * - Deve custar no minimo 1 PM.
 * - Deve possuir uma arma vinculada.
 * - Deve ter pelo menos um efeito positivo.
 * - Respeitar limite maximo de repeticoes de cada efeito.
 */
function validateGolpePessoalBuild(build, effectsMap, legacyKeys, maxCostAllowed) {
  const errors = [];
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
      errors.push(`${def.name} pode ser selecionado no maximo ${def.maxRepeats} vezes`);
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
    errors.push(`Custo em PM (${cost}) excede o limite permitido (${maxCostAllowed} PM)`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Gera texto descritivo padronizado do Golpe Pessoal.
 */
function formatGolpePessoalDescription(build, effectsMap, legacyKeys) {
  if (!build) return '';
  const weapon = build.weapon || 'Arma';
  const effects = Array.isArray(build.effects) ? build.effects : [];
  const parts = effects.map((eff) => {
    const key = resolveEffectKey(eff.effectName, effectsMap, legacyKeys);
    const name = key && effectsMap[key] ? effectsMap[key].name : eff.effectName;
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

const ModuloGolpePessoal = {
  resolveEffectKey,
  calculateGolpePessoalCost,
  validateGolpePessoalBuild,
  formatGolpePessoalDescription
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ModuloGolpePessoal;
}

if (typeof window !== 'undefined') {
  window.ForjaGolpePessoal = ModuloGolpePessoal;
}
