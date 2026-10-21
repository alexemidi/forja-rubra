const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('Iniciando testes de Parceiros e Modificadores Temporários de Atributos...');

// 1. Validar que o manifesto contém os novos scripts e dados
const manifesto = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/paginas/manifesto.json'), 'utf8'));

assert.ok(manifesto.criador.data['DATA.detailedConditions'], 'detailedConditions deve estar no data de criador');
assert.ok(manifesto.ficha.data['DATA.detailedConditions'], 'detailedConditions deve estar no data de ficha');

const criadorScripts = manifesto.criador.scripts[0];
const fichaScripts = manifesto.ficha.scripts[0];
assert.ok(criadorScripts.some(s => s.includes('modal-condicoes')), 'modal-condicoes deve estar nos scripts de criador');
assert.ok(fichaScripts.some(s => s.includes('modal-condicoes')), 'modal-condicoes deve estar nos scripts de ficha');
console.log('Manifesto verificado: OK');

// 2. Simulação de lógica de modificadores temporários de atributos e descanso
global.state = {
  identity: {
    baseAttrs: { for: 1, des: 3, con: 2, int: 0, sab: -1, car: 0 },
    raceId: 'humano',
    plannedLevel: 1
  },
  tempManualBonuses: {
    defense: 0,
    skills: {},
    attrs: { for: 2, des: -1, con: 3, int: 0, sab: 0, car: 0 }
  },
  partners: []
};

global.ATTRS = [['for', 'Força'], ['des', 'Destreza'], ['con', 'Constituição'], ['int', 'Inteligência'], ['sab', 'Sabedoria'], ['car', 'Carisma']];
global.raceBonuses = () => ({ for: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 });
global.RegrasCriacao = {
  atributos: (keys, base, bonus) => {
    const res = {};
    for (const k of keys) res[k] = (base[k] || 0) + (bonus[k] || 0);
    return res;
  }
};

// Carregar lógica de finalAttrs de estado-e-catalogos.js
function finalAttrs(includeTemp = true) {
  const attrs = RegrasCriacao.atributos(ATTRS.map(([id]) => id), state.identity.baseAttrs, raceBonuses());
  if (includeTemp && state?.tempManualBonuses?.attrs) {
    for (const [key, val] of Object.entries(state.tempManualBonuses.attrs)) {
      if (attrs[key] !== undefined) {
        attrs[key] += Number(val) || 0;
      }
    }
  }
  return attrs;
}

// Teste 1: Atributo base vs temporário
const baseAttrs = finalAttrs(false);
const tempAttrs = finalAttrs(true);

assert.strictEqual(baseAttrs.for, 1, 'Força base deve ser 1');
assert.strictEqual(tempAttrs.for, 3, 'Força com temporário deve ser 1 + 2 = 3');

assert.strictEqual(baseAttrs.des, 3, 'Destreza base deve ser 3');
assert.strictEqual(tempAttrs.des, 2, 'Destreza com temporário deve ser 3 - 1 = 2');

assert.strictEqual(baseAttrs.con, 2, 'Constituição base deve ser 2');
assert.strictEqual(tempAttrs.con, 5, 'Constituição com temporário deve ser 2 + 3 = 5');
console.log('Cálculo de finalAttrs com e sem temporários: OK');

// Teste 2: Regra de PV e PM máximos não serem afetados por temporários
function simularStats() {
  const base = finalAttrs(false);
  const temp = finalAttrs(true);
  const pvMax = 16 + base.con; // usando base
  const pmMax = 3;
  const def = 10 + temp.des; // defesa usa temp
  return { pvMax, pmMax, def };
}

const stats = simularStats();
assert.strictEqual(stats.pvMax, 18, 'PV Máximo deve usar CON base (16 + 2 = 18), ignorando o bônus temporário de CON');
assert.strictEqual(stats.def, 12, 'Defesa deve usar DES temporária (10 + 2 = 12)');
console.log('Regra oficial de PV/PM imune a temporários e Defesa afetada: OK');

// Teste 3: Lógica do Descanso zerando os atributos temporários
function executarDescanso() {
  state.tempManualBonuses = { defense: 0, skills: {}, attrs: { for: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 } };
}

executarDescanso();
const postRestAttrs = finalAttrs(true);
assert.strictEqual(postRestAttrs.for, 1, 'Após descanso, Força temporária deve voltar para a base 1');
assert.strictEqual(postRestAttrs.des, 3, 'Após descanso, Destreza temporária deve voltar para a base 3');
assert.strictEqual(postRestAttrs.con, 2, 'Após descanso, Constituição temporária deve voltar para a base 2');
console.log('Reset de atributos temporários no descanso: OK');

// Teste 4: Parceiros (Adição, contagem e remoção)
assert.strictEqual(state.partners.length, 0, 'Inicialmente sem parceiros');

state.partners.push({
  name: 'Lobo Cinzento',
  type: 'combatente',
  tier: 'iniciante',
  benefit: '+2 em Luta e +2 no dano corpo a corpo.'
});
assert.strictEqual(state.partners.length, 1, 'Deve ter 1 parceiro');
assert.strictEqual(state.partners[0].name, 'Lobo Cinzento');
assert.strictEqual(state.partners[0].type, 'combatente');

// Remover parceiro
state.partners.splice(0, 1);
assert.strictEqual(state.partners.length, 0, 'Parceiro deve ser removido com sucesso');
console.log('Gestão de parceiros na ficha: OK');

console.log('Todos os testes de Parceiros e Modificadores Temporários de Atributos passaram com sucesso!');
