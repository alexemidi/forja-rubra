const assert = require('node:assert/strict');
const RecompensasT20 = require('../src/regras/nucleo/recompensas-t20.js');

console.log('Iniciando testes de Recompensas de Tormenta 20...');

// 1. Validando divisao de Tibares
{
  const res1 = RecompensasT20.dividirTibares(1000, 4);
  assert.equal(res1.cotaPorJogador, 250);
  assert.equal(res1.sobra, 0);

  const res2 = RecompensasT20.dividirTibares(500, 3);
  assert.equal(res2.cotaPorJogador, 166);
  assert.equal(res2.sobra, 2);

  const res3 = RecompensasT20.dividirTibares(0, 5);
  assert.equal(res3.cotaPorJogador, 0);
  assert.equal(res3.sobra, 0);

  const res4 = RecompensasT20.dividirTibares(-50, 2);
  assert.equal(res4.cotaPorJogador, 0);
  assert.equal(res4.sobra, 0);
  console.log('✔ Divisão de Tibares aprovada!');
}

// 2. Validando geracao deterministica com mock RNG
{
  // Mock RNG que sempre retorna valores intermediarios
  const mockRng = (min, max) => Math.floor((min + max) / 2);

  const t1 = RecompensasT20.gerarTesouro({ nd: '1', multiplicador: 'padrao', rng: mockRng });
  assert.equal(t1.nd, '1');
  assert.equal(t1.multiplicador, 'padrao');
  assert.ok(t1.tibares >= 0);
  assert.ok(Array.isArray(t1.itens));

  const tMetade = RecompensasT20.gerarTesouro({ nd: '1', multiplicador: 'metade', rng: mockRng });
  assert.ok(tMetade.tibares <= t1.tibares);

  const tDobro = RecompensasT20.gerarTesouro({ nd: '1', multiplicador: 'dobro', rng: mockRng });
  assert.ok(tDobro.tibares >= t1.tibares);
  console.log('✔ Multiplicadores de Tesouro (Padrão, Metade, Dobro) validados!');
}

// 3. Validando faixas de ND (1/4 a 20)
{
  RecompensasT20.NDS.forEach(nd => {
    assert.ok(RecompensasT20.ND_CONFIG[nd], `ND ${nd} deve ter configuração definida`);
    const tesouro = RecompensasT20.gerarTesouro({ nd });
    assert.ok(typeof tesouro.tibares === 'number');
    assert.ok(typeof tesouro.totalValorEstimado === 'number');
  });
  console.log('✔ Todos os 22 Níveis de Desafio (NDs) suportados e validados!');
}

console.log('🎉 Todos os testes de Recompensas T20 passaram com sucesso!');
