const assert = require('node:assert/strict');

// Setup mock storage in globalThis for Node.js test environment
const mockData = {};
globalThis.__mockStorage = {
  getItem: key => mockData[key] || null,
  setItem: (key, val) => { mockData[key] = String(val); }
};

const CampanhaMesa = require('../src/compartilhado/mesa/campanha-mesa.js');

console.log('Iniciando testes de CampanhaMesa e transferência de recursos...');

// Popula herois na mesa
const heroisIniciais = [
  { id: 'h1', name: 'Lothar Guerreiro', race: 'humano', class: 'guerreiro', level: 3, snapshot: { funds: 100, backpack: [] } },
  { id: 'h2', name: 'Thalor Mago', race: 'elfo', class: 'arcanista', level: 3, snapshot: { funds: 50, backpack: [] } },
  { id: 'h3', name: 'Kael Ladino', race: 'goblin', class: 'ladino', level: 3, snapshot: { funds: 200, backpack: [] } }
];
CampanhaMesa.salvarRoster(heroisIniciais);

// 1. Listar herois da mesa
{
  const herois = CampanhaMesa.listarHeroisMesa();
  assert.equal(herois.length, 3);
  assert.equal(herois[0].nome, 'Lothar Guerreiro');
  assert.equal(herois[0].saldo, 100);
  console.log('✔ Listagem de heróis da mesa validada!');
}

// 2. Creditar Tibares para heroi especifico
{
  const res = CampanhaMesa.creditarTibaresHeroi('h1', 150);
  assert.equal(res.sucesso, true);
  const herois = CampanhaMesa.listarHeroisMesa();
  assert.equal(herois.find(h => h.id === 'h1').saldo, 250);
  console.log('✔ Crédito individual de Tibares validado!');
}

// 3. Dividir Tibares igualmente entre multiplos herois
{
  const res = CampanhaMesa.dividirTibaresEntreHerois(600, ['h1', 'h2', 'h3']);
  assert.equal(res.sucesso, true);
  assert.equal(res.cotaIndividual, 200);
  assert.equal(res.sobraNaoDividida, 0);

  const herois = CampanhaMesa.listarHeroisMesa();
  assert.equal(herois.find(h => h.id === 'h1').saldo, 450); // 250 + 200
  assert.equal(herois.find(h => h.id === 'h2').saldo, 250); // 50 + 200
  assert.equal(herois.find(h => h.id === 'h3').saldo, 400); // 200 + 200
  console.log('✔ Divisão igualitária automática de Tibares entre heróis validada!');
}

// 4. Transferir item diretamente para a mochila de um heroi da mesa
{
  const item = {
    itemId: 'espada_longa',
    nome: 'Espada Longa de Mitral',
    preco: 1515,
    espacos: 1,
    material: 'mitral'
  };
  const res = CampanhaMesa.adicionarItemHeroiMesa('h2', item);
  assert.equal(res.sucesso, true);

  const rosterAtual = CampanhaMesa.obterRoster();
  const thalor = rosterAtual.find(h => h.id === 'h2');
  assert.equal(thalor.snapshot.backpack.length, 1);
  assert.equal(thalor.snapshot.backpack[0].nome, 'Espada Longa de Mitral');
  assert.equal(thalor.snapshot.backpack[0].origem, 'recompensa_mestre');
  console.log('✔ Concessão e gravação de item na mochila de herói da mesa validada!');
}

console.log('🎉 Todos os testes de CampanhaMesa passaram com sucesso!');
