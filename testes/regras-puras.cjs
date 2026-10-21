const assert=require('node:assert/strict');
const regras=require('../src/regras/nucleo/personagem.js');
const base=Object.freeze({pv:20,pm:8}),effects=Object.freeze({pvPerLevel:2,pvFlat:1,pmPerLevel:1,pmFlat:3,defenseAttribute:'des',defenseBonus:6});
assert.deepEqual(regras.estatisticas(base,effects,{des:1},4),{pv:29,pm:15,defense:17});
assert.equal(regras.estatisticas(base,effects,{des:1},20).defense+4,21);
assert.deepEqual(regras.moedas(10,{}).moedas,{tc:0,ts:10,to:0});
assert.deepEqual(regras.moedas(10,{brokenSilver:1}).moedas,{tc:10,ts:9,to:0});
assert.deepEqual(regras.moedas(100,{goldCoins:10}).moedas,{tc:0,ts:0,to:10});
assert.equal(regras.espacosMoedas({tc:499,ts:0,to:0}),0);
assert.equal(regras.espacosMoedas({tc:999,ts:0,to:0}),0);
assert.equal(regras.espacosMoedas({tc:1000,ts:0,to:0}),1);
assert.equal(regras.espacosMoedas({tc:500,ts:500,to:0}),1);
assert.equal(regras.espacosMoedas({tc:1500,ts:500,to:500}),2);
// Comparação com a fórmula anterior, incluindo centavos e limites de moedas.
for(const saldo of [0,.1,.99,1,9,10,99.9,100,2000])for(const ouro of [-1,0,1,5,1000])for(const cobre of [-1,0,1,5,1000]){
  const f=Object.freeze({goldCoins:ouro,brokenSilver:cobre}),result=regras.moedas(saldo,f);
  const total=Math.max(0,Math.round(saldo*10)),gold=Math.min(Math.max(0,Math.floor(ouro||0)),Math.floor(total/100)),rest=total-gold*100,silver=Math.min(Math.max(0,Math.floor(cobre||0)),Math.floor(rest/10));
  assert.deepEqual(result,{financas:{goldCoins:gold,brokenSilver:silver},moedas:{tc:rest%10+silver*10,ts:Math.floor(rest/10)-silver,to:gold}});
  assert.equal(result.moedas.tc+10*result.moedas.ts+100*result.moedas.to,total);
}
console.log('Regras puras: Defesa, PV/PM, carga e 225 combinações monetárias aprovadas.');
const idade=require('../src/regras/nucleo/idade.js'),faixas=require('../dados/idade-faixas.json');
const intervalos=idade.intervalos(faixas);
assert.deepEqual(intervalos.crianca,{min:9,max:12});
assert.deepEqual(intervalos.adolescente,{min:13,max:17});
assert.deepEqual(intervalos.jovem,{min:18,max:24});
assert.deepEqual(intervalos.adulto,{min:25,max:39});
assert.deepEqual(intervalos.maduro,{min:40,max:59});
assert.deepEqual(intervalos.velho,{min:60,max:79});
assert.deepEqual(intervalos.anciao,{min:80,max:null});
assert.deepEqual(idade.modificadores(faixas.crianca),{for:-2,con:-1,sab:-1});
assert.deepEqual(idade.modificadores(faixas.adolescente),{sab:-1});
assert.deepEqual(idade.modificadores(faixas.jovem),{});
assert.deepEqual(idade.modificadores(faixas.adulto),{});
assert.deepEqual(idade.modificadores(faixas.maduro),{});
assert.deepEqual(idade.modificadores(faixas.velho),{for:-1,des:-1,con:-1});
assert.deepEqual(idade.modificadores(faixas.anciao),{for:-2,des:-2,con:-2});
assert.deepEqual(idade.limitar('10',intervalos.maduro),{years:'40',notice:'Idade ajustada de 10 para 40.'});
assert.equal(idade.limitar('90',intervalos.maduro).years,'59');
assert.equal(idade.limitar('',intervalos.maduro),null);
assert.equal(idade.multiplicador('elfo'),1);
assert.equal(idade.multiplicador('goblin'),1);
assert.equal(idade.sobreposicao(),false);
console.log('Regras puras de idade: intervalos canônicos, limites e modificadores aprovados.');
const criacao=require('../src/regras/nucleo/criacao.js');
assert.deepEqual(criacao.atributos(['for','des'],{for:2,des:1},{for:-1,des:2}),{for:1,des:3});
const custos={[-1]:-1,0:0,1:1,2:2,3:4,4:7};
for(let a=-1;a<=4;a++)for(let b=-1;b<=4;b++)assert.equal(criacao.pontos(['for','des'],{for:a,des:b},custos),custos[a]+custos[b]);
assert.equal(criacao.nivelClasse([{classId:'a'},{classId:'b'},{classId:'a'}],2,'a'),2);
console.log('Criação: composição de atributos, custos e níveis por classe aprovados.');

const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const estadoCatalogosSrc = fs.readFileSync(path.join(__dirname, '../src/compartilhado/criador/estado-e-catalogos.js'), 'utf8');
const pureSlice = estadoCatalogosSrc.slice(estadoCatalogosSrc.indexOf('function formatConfiguredItemName'), estadoCatalogosSrc.indexOf('function finalAttrs'));
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(pureSlice, ctx);

const { armorPassiveStats, shieldPassiveStats, formatConfiguredItemName } = ctx;

// Armadura mundana
const armaduraMundana = { armadura: { defesa: 5, penalidade: -2 } };
const s1 = armorPassiveStats(armaduraMundana, {});
assert.equal(s1.defense, 5);
assert.equal(s1.penalty, -2);

// Armadura reforçada (+1 Defesa, piora penalidade em 1)
const s2 = armorPassiveStats(armaduraMundana, { improvements: [{ id: 'reforcada' }] });
assert.equal(s2.defense, 6);
assert.equal(s2.penalty, -3);

// Armadura reforçada e sob medida (-1 penalidade)
const s3 = armorPassiveStats(armaduraMundana, { improvements: [{ id: 'reforcada' }, { id: 'sob_medida' }] });
assert.equal(s3.defense, 6);
assert.equal(s3.penalty, -2);

// Armadura com encanto defensor (+2)
const s4 = armorPassiveStats(armaduraMundana, { enchantments: [{ id: 'defensor' }] });
assert.equal(s4.defense, 7);
assert.equal(s4.penalty, -2);

// Armadura com encanto guardião (+4)
const s5 = armorPassiveStats(armaduraMundana, { enchantments: [{ id: 'defensor' }, { id: 'guardiao' }] });
assert.equal(s5.defense, 9);
assert.equal(s5.penalty, -2);

// Escudo com reforçada (+1 Defesa) e defensor (+2 Defesa)
const escudoBase = { escudo: { bonusDefesa: 1, penalidade: -1 } };
const s6 = shieldPassiveStats(escudoBase, { improvements: [{ id: 'reforcada' }], enchantments: [{ id: 'defensor' }] });
assert.equal(s6.defense, 4);
assert.equal(s6.penalty, -2);

// Nome configurado de item
assert.equal(formatConfiguredItemName({ improvements: [{ id: 'reforcada' }], enchantments: [{ id: 'defensor' }] }, { nome: 'Cota de Malha' }), 'Cota de Malha reforçada defensor');
assert.equal(formatConfiguredItemName({ material: 'adamante', improvements: [{ id: 'certeira' }] }, { nome: 'Adaga' }), 'Adaga de adamante certeira');
// Testes de Raças Abertas (Heróis de Arton)
const openRaceSlice = estadoCatalogosSrc.slice(estadoCatalogosSrc.indexOf('function isRaceEligibleForOpenRaces'), estadoCatalogosSrc.indexOf('function formatConfiguredItemName'));
const openRaceCtx = {
  window: {},
  state: { identity: { raceId: 'anao', openRaceBonusEnabled: false, openRaceAllocations: {}, raceAttrs: [], raceSpecialAttrs: {}, raceSubAttrs: {}, raceChoices: {} } },
  raceById: id => {
    if (id === 'anao') return { id: 'anao', atributos: { fixos: { con: 2, sab: 1, des: -1 } } };
    if (id === 'ogro') return { id: 'ogro', atributos: { fixos: { for: 3, con: 2, int: -1, car: -1 } } };
    if (id === 'humano') return { id: 'humano', atributos: { fixos: {}, flexiveis: { quantidade: 3, valor: 1 } } };
    if (id === 'duende') return { id: 'duende', atributos: { fixos: {} }, habilidades: { selecionadas: [{ tipo: 'atributos_flexiveis' }] } };
    return null;
  },
  addAttrs: (t, s) => Object.entries(s || {}).forEach(([k, v]) => t[k] = (t[k] || 0) + Number(v || 0)),
  addAllocation: () => {},
  selectedRaceOption: () => null,
  choiceId: x => String(x?.id || x || '')
};
vm.createContext(openRaceCtx);
vm.runInContext(openRaceSlice, openRaceCtx);

const { isRaceEligibleForOpenRaces, raceFixedModifiers, remainingOpenRaceModifiers, raceBonuses } = openRaceCtx;

const anao = openRaceCtx.raceById('anao');
const ogro = openRaceCtx.raceById('ogro');
const humano = openRaceCtx.raceById('humano');
const duende = openRaceCtx.raceById('duende');

assert.equal(isRaceEligibleForOpenRaces(anao), true);
assert.equal(isRaceEligibleForOpenRaces(ogro), true);
assert.equal(isRaceEligibleForOpenRaces(humano), false);
assert.equal(isRaceEligibleForOpenRaces(duende), false);

assert.deepEqual([...raceFixedModifiers(anao)], [2, 1, -1]);
assert.deepEqual([...raceFixedModifiers(ogro)], [3, 2, -1, -1]);

assert.deepEqual([...remainingOpenRaceModifiers(anao, { for: 2 })], [1, -1]);
assert.deepEqual([...remainingOpenRaceModifiers(anao, { for: 2, des: -1 })], [1]);
assert.deepEqual([...remainingOpenRaceModifiers(anao, { for: 2, des: -1, con: 1 })], []);

// Bônus padrão do Anão (sem Raças Abertas)
assert.deepEqual({...raceBonuses()}, { for: 0, des: -1, con: 2, int: 0, sab: 1, car: 0 });

// Bônus com Raças Abertas ativado
openRaceCtx.state.identity.openRaceBonusEnabled = true;
openRaceCtx.state.identity.openRaceAllocations = { car: 2, int: 1, for: -1 };
assert.deepEqual({...raceBonuses()}, { for: -1, des: 0, con: 0, int: 1, sab: 0, car: 2 });

console.log('Variante Raças Abertas (Heróis de Arton): elegibilidade, modificadores fixos e distribuição aprovados.');


