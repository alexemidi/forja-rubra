/**
 * Suíte de Testes Unitários: Origem Criação dos Deuses e Poderes Escolhido dos Deuses
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  CRIACAO_DEUSES_CATALOG,
  getCriacaoDeusOption,
  normalizeCriacaoDeusId
} from '../../src/lib/t20/criacao-dos-deuses.ts';

// 1. Validação do catálogo de 23 Deuses
assert.equal(CRIACAO_DEUSES_CATALOG.length, 23, 'O catálogo canônico deve conter exatamente 23 deuses');

const expectedDeities = [
  'aharadak', 'allihanna', 'arsenal', 'azgher', 'glorienn', 'hyninn',
  'kallyadranoch', 'khalmyr', 'lena', 'lin_wu', 'marah', 'megalokk',
  'nimb', 'oceano', 'ragnar', 'sszzaas', 'tanna_toh', 'tauron',
  'tenebra', 'thwor', 'thyatis', 'valkaria', 'wynna'
];

for (const expectedId of expectedDeities) {
  const found = CRIACAO_DEUSES_CATALOG.find(d => d.id === expectedId);
  assert.ok(found, `Divindade ${expectedId} deve estar presente no catálogo`);
  assert.ok(found.nome, `Divindade ${expectedId} deve ter um nome canônico`);
  assert.ok(found.powerId, `Divindade ${expectedId} deve ter um powerId`);
  assert.ok(found.aparencia, `Divindade ${expectedId} deve ter traços de aparência física`);
  assert.ok(found.descricao, `Divindade ${expectedId} deve ter texto descritivo oficial`);
  assert.ok(['positiva', 'negativa', 'qualquer'].includes(found.energia), `Energia de ${expectedId} deve ser válida`);
}

// 2. Normalização de identificadores e busca
assert.equal(normalizeCriacaoDeusId('Lin-Wu'), 'lin_wu');
assert.equal(normalizeCriacaoDeusId('Arsenal/Keen'), 'arsenal');
assert.equal(normalizeCriacaoDeusId('Glórienn'), 'glorienn');
assert.equal(normalizeCriacaoDeusId('Tanna-Toh'), 'tanna_toh');

const aharadak = getCriacaoDeusOption('aharadak');
assert.ok(aharadak);
assert.equal(aharadak.powerId, 'escolhido_de_aharadak');
assert.equal(aharadak.energia, 'negativa');
assert.equal(aharadak.rdDefault, 'luz', 'Energia negativa concede RD Luz 5');

const valkaria = getCriacaoDeusOption('valkaria');
assert.ok(valkaria);
assert.equal(valkaria.energia, 'positiva');
assert.equal(valkaria.rdDefault, 'trevas', 'Energia positiva concede RD Trevas 5');

const arsenal = getCriacaoDeusOption('arsenal');
assert.ok(arsenal);
assert.equal(arsenal.energia, 'qualquer');
assert.equal(arsenal.rdDefault, 'escolha', 'Energia qualquer permite escolha de RD');

// 3. Validação dos arquivos de dados (criador-origins.json e criador-generalPowers.json)
const originsPath = resolve(process.cwd(), 'dados/criador-origins.json');
const originsData = JSON.parse(readFileSync(originsPath, 'utf-8'));
const criacaoOrigin = originsData.find((o: any) => o.nome === 'Criação dos Deuses');

assert.ok(criacaoOrigin, 'Origem Criação dos Deuses deve estar cadastrada em criador-origins.json');
assert.equal(criacaoOrigin.nome, 'Criação dos Deuses');
assert.ok(criacaoOrigin.beneficios?.poder_unico, 'Origem deve possuir poder_unico');
assert.ok(criacaoOrigin.itens?.some((i: any) => typeof i === 'string' && /símbolo sagrado|lembrança/i.test(i)), 'Origem deve conceder símbolo sagrado / lembrança do plano natal');

const generalPowersPath = resolve(process.cwd(), 'dados/criador-generalPowers.json');
const generalPowersData = JSON.parse(readFileSync(generalPowersPath, 'utf-8'));

for (const deity of CRIACAO_DEUSES_CATALOG) {
  const powerInCatalog = generalPowersData.find((p: any) => p.id === deity.powerId);
  assert.ok(powerInCatalog, `Poder ${deity.powerId} deve existir em criador-generalPowers.json`);
  assert.equal(powerInCatalog.categoria, 'escolhido_dos_deuses');
  assert.ok(powerInCatalog.descricao.length > 20, `Descrição do poder ${deity.powerId} deve ser canônica e detalhada`);
}

const aharadakPower = generalPowersData.find((p: any) => p.id === 'escolhido_de_aharadak');
assert.equal(aharadakPower?.countAsTormentaPower, true, 'Escolhido de Aharadak deve contar como poder da Tormenta');

console.log('✓ Todos os testes unitários de Criação dos Deuses e Escolhido dos Deuses foram aprovados com sucesso!');
