/* Regras puras: sem DOM, armazenamento ou estado global do personagem. */
const RegrasPersonagem = (() => {
  function estatisticas(base, efeitos, atributos, nivel) {
    return {
      ...base,
      pv: base.pv + efeitos.pvPerLevel * nivel + efeitos.pvFlat,
      pm: base.pm + efeitos.pmPerLevel * nivel + efeitos.pmFlat,
      defense: 10 + ((efeitos.defenseAttribute && efeitos.defenseAttribute !== 'nenhum' && efeitos.defenseAttribute !== 'none') ? Number(atributos[efeitos.defenseAttribute] || 0) : 0) + efeitos.defenseBonus
    };
  }

  function moedas(saldo, financas) {
    const total = Math.max(0, Math.round(saldo * 10));
    const goldCoins = Math.min(Math.max(0, Math.floor(financas.goldCoins || 0)), Math.floor(total / 100));
    const restante = total - goldCoins * 100;
    const brokenSilver = Math.min(Math.max(0, Math.floor(financas.brokenSilver || 0)), Math.floor(restante / 10));
    return {
      financas: {goldCoins, brokenSilver},
      moedas: {tc: restante % 10 + brokenSilver * 10, ts: Math.floor(restante / 10) - brokenSilver, to: goldCoins}
    };
  }

  function espacosMoedas({tc, ts, to}) {
    const total = (Number(tc) || 0) + (Number(ts) || 0) + (Number(to) || 0);
    return Math.floor(total / 1000);
  }

  return Object.freeze({estatisticas, moedas, espacosMoedas});
})();
if (typeof module !== 'undefined' && module.exports) module.exports = RegrasPersonagem;
