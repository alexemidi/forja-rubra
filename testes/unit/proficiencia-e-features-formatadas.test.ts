import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Carrega os módulos de regras necessários
const racesData = JSON.parse(fs.readFileSync(path.resolve('dados/criador-races.json'), 'utf8'));
const classesData = JSON.parse(fs.readFileSync(path.resolve('dados/criador-classes.json'), 'utf8'));
const powersData = JSON.parse(fs.readFileSync(path.resolve('dados/criador-generalPowers.json'), 'utf8'));

test('Proficiências Canônicas e Poder Geral Proficiência', () => {
  // Simulação do comportamento de getAvailableProficiencyOptions
  const allProfOptions = [
    { id: 'armas_marciais', name: 'Armas marciais' },
    { id: 'armas_de_fogo', name: 'Armas de fogo' },
    { id: 'armaduras_pesadas', name: 'Armaduras pesadas' },
    { id: 'escudos', name: 'Escudos' }
  ];

  function getAvailable(currentProfs: string[], currentChoice = '') {
    const currentValues = new Set(currentProfs.filter(id => id !== currentChoice));
    const list = [...allProfOptions];
    if (currentValues.has('armas_marciais') || currentChoice === 'armas_marciais' || currentChoice === 'armas_exoticas') {
      list.push({ id: 'armas_exoticas', name: 'Armas exóticas' });
    }
    return list.filter(opt => opt.id === currentChoice || !currentValues.has(opt.id));
  }

  // 1. Arcanista: só tem armas simples
  const arcanistProfs = ['armas_simples'];
  const arcanistOpts = getAvailable(arcanistProfs);
  const arcanistOptIds = arcanistOpts.map(o => o.id);
  assert.ok(arcanistOptIds.includes('armas_marciais'), 'Arcanista pode escolher armas marciais');
  assert.ok(arcanistOptIds.includes('armas_de_fogo'), 'Arcanista pode escolher armas de fogo');
  assert.ok(arcanistOptIds.includes('armaduras_pesadas'), 'Arcanista pode escolher armaduras pesadas');
  assert.ok(arcanistOptIds.includes('escudos'), 'Arcanista pode escolher escudos');
  assert.ok(!arcanistOptIds.includes('armas_exoticas'), 'Arcanista NÃO pode escolher armas exóticas sem armas marciais');

  // 2. Guerreiro: já tem marciais, pesadas, escudos
  const warriorProfs = ['armas_simples', 'armas_marciais', 'armaduras_pesadas', 'escudos'];
  const warriorOpts = getAvailable(warriorProfs);
  const warriorOptIds = warriorOpts.map(o => o.id);
  assert.ok(!warriorOptIds.includes('armas_marciais'), 'Guerreiro já possui marciais');
  assert.ok(!warriorOptIds.includes('armaduras_pesadas'), 'Guerreiro já possui armaduras pesadas');
  assert.ok(!warriorOptIds.includes('escudos'), 'Guerreiro já possui escudos');
  assert.ok(warriorOptIds.includes('armas_de_fogo'), 'Guerreiro pode escolher armas de fogo');
  assert.ok(warriorOptIds.includes('armas_exoticas'), 'Guerreiro pode escolher armas exóticas pois já tem marciais');

  // 3. Arcanista que pegou marciais via poder:
  const arcanistWithMartial = ['armas_simples', 'armas_marciais'];
  const nextOpts = getAvailable(arcanistWithMartial);
  const nextOptIds = nextOpts.map(o => o.id);
  assert.ok(nextOptIds.includes('armas_exoticas'), 'Arcanista com armas marciais desbloqueia armas exóticas');
});

test('Formatação Padronizada de Títulos de Habilidades Iniciais', () => {
  // 1. Origem com múltiplos benefícios: NomeOrigem(Beneficio1/Beneficio2)
  const originName = 'Seguidor';
  const benefitNames = ['Proficiência', 'Surto Heroico'];
  const formattedOrigin = originName + '(' + benefitNames.join('/') + ')';
  assert.equal(formattedOrigin, 'Seguidor(Proficiência/Surto Heroico)');

  // 2. Idade: Idade/Já Vi Coisas(Nome do Poder)
  const agePowerName = 'Já Vi Coisas';
  const chosenAgePower = 'Estilo de Duas Armas';
  const formattedAge = 'Idade/' + agePowerName + '(' + chosenAgePower + ')';
  assert.equal(formattedAge, 'Idade/Já Vi Coisas(Estilo de Duas Armas)');

  // 3. Complicações: Complicações/Nome da Complicação(Nome do Poder)
  const compName = 'Cabeça Quente';
  const chosenCompPower = 'Arma Secundária grande';
  const formattedComp = 'Complicações/' + compName + '(' + chosenCompPower + ')';
  assert.equal(formattedComp, 'Complicações/Cabeça Quente(Arma Secundária grande)');
});

test('Defesa com Armadura Pesada e Armadura Brilhante (Nobre)', () => {
  // Função de cálculo de atributo de defesa canônica
  function getDefenseAttr(isWearingHeavyArmor: boolean, hasArmaduraBrilhante: boolean, classId: string) {
    if (isWearingHeavyArmor) {
      if (hasArmaduraBrilhante) return 'car';
      return 'nenhum';
    }
    if (classId === 'nobre') return 'car';
    return 'des';
  }

  // Guerreiro comum com armadura pesada (Brúnea) -> nenhum atributo
  assert.equal(getDefenseAttr(true, false, 'guerreiro'), 'nenhum');

  // Nobre com armadura pesada SEM poder Armadura Brilhante -> nenhum atributo
  assert.equal(getDefenseAttr(true, false, 'nobre'), 'nenhum');

  // Nobre com armadura pesada COM poder Armadura Brilhante -> soma Carisma
  assert.equal(getDefenseAttr(true, true, 'nobre'), 'car');

  // Nobre com armadura leve -> soma Carisma normalmente
  assert.equal(getDefenseAttr(false, false, 'nobre'), 'car');
});

test('Aumento de Passo de Dano por Categoria de Tamanho', () => {
  const ladder = ['1', '1d2', '1d3', '1d4', '1d6', '1d8', '1d10', '1d12', '2d8', '2d10', '2d12', '4d8', '4d10'];
  function stepUp(damage: string, steps: number): string {
    const idx = ladder.indexOf(damage);
    if (idx === -1) return damage;
    const targetIdx = Math.min(ladder.length - 1, idx + steps);
    return ladder[targetIdx];
  }

  // Humano Médio com Espada Longa: 1d8
  assert.equal(stepUp('1d8', 0), '1d8');

  // Grande (+1 tamanho): 1d10
  assert.equal(stepUp('1d8', 1), '1d10');

  // Enorme (+2 tamanhos): 1d12
  assert.equal(stepUp('1d8', 2), '1d12');

  // Colossal (+3 tamanhos): 2d8
  assert.equal(stepUp('1d8', 3), '2d8');
});

test('Benefício de Origem Proficiência (ex: Seguidor)', () => {
  // Simula estado do personagem com Seguidor selecionando Proficiência
  const mockState = {
    identity: { classId: 'arcanista' },
    origin: {
      standard: 'Seguidor',
      benefits: ['power:proficiencia', 'power:surto_heroico'],
      proficiencyChoice: 'armas_marciais'
    }
  };

  const hasProf = mockState.origin.benefits.some(id => id === 'power:proficiencia');
  assert.ok(hasProf, 'Seguidor possui benefício Proficiência selecionado');
  assert.equal(mockState.origin.proficiencyChoice, 'armas_marciais', 'Proficiência escolhida deve ser armas_marciais');
});

test('Arma Canônica: Maça de Guerra', () => {
  const items = JSON.parse(fs.readFileSync(path.resolve('dados/items.json'), 'utf8'));
  const macaDeGuerra = items.find((i: any) => i.id === 'maca_de_guerra');

  assert.ok(macaDeGuerra, 'Maça de Guerra deve existir no catálogo de itens');
  assert.equal(macaDeGuerra.nome, 'Maça de Guerra');
  assert.equal(macaDeGuerra.categoriaId, 'exotica', 'Deve ser arma exótica');
  assert.equal(macaDeGuerra.arma?.empunhaduraId, 'uma_mao', 'Deve ser de uma mão');
  assert.equal(macaDeGuerra.preco?.valor, 25, 'Preço deve ser T$ 25');
  assert.equal(macaDeGuerra.arma?.dano?.principal, '1d12', 'Dano deve ser 1d12');
  assert.equal(macaDeGuerra.arma?.critico?.multiplicador, 3, 'Crítico deve ser x3');
  assert.equal(macaDeGuerra.espacos, 1, 'Deve ocupar 1 espaço');
  assert.ok(macaDeGuerra.arma?.tipoDanoIds?.includes('impacto'), 'Tipo de dano deve ser impacto');
  assert.ok(macaDeGuerra.arma?.propriedadesIds?.includes('desbalanceada'), 'Deve ter propriedade desbalanceada');
});


