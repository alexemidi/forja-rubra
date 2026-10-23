import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { efeitosMarcas } from '../../src/lib/t20/distinctions.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

test('Distinções DB 206: Menestrel Maldito e Presa de Coral carregadas no catálogo', () => {
  const jsonPath = path.join(rootDir, 'dados', 'distincoes.json');
  assert.equal(fs.existsSync(jsonPath), true, 'dados/distincoes.json deve existir');
  
  const raw = fs.readFileSync(jsonPath, 'utf-8');
  const catalog = JSON.parse(raw);
  
  // 1. Menestrel Maldito
  const menestrel = catalog.find((d: any) => d.id === 'menestrel_maldito');
  assert.ok(menestrel, 'Menestrel Maldito deve existir no catálogo de distinções');
  assert.equal(menestrel.nome, 'Menestrel Maldito');
  assert.equal(menestrel.livro, 'Dragão Brasil 206');
  assert.ok(menestrel.marca, 'Menestrel Maldito deve possuir marca');
  assert.equal(menestrel.marca.nome, 'A Maldição do Menestrel');
  assert.ok(menestrel.marca.descricao.includes('Estranho de Azul'), 'Descrição da marca do Menestrel deve citar o Estranho de Azul');
  assert.equal(menestrel.poderes.length, 5, 'Menestrel Maldito deve conter 5 poderes canônicos');

  const menestrelPowerIds = menestrel.poderes.map((p: any) => p.id);
  assert.deepEqual(menestrelPowerIds, [
    'tecnica_endiabrada',
    'celeridade_cerulea',
    'composicao_magica',
    'musica_aria_da_tristeza',
    'musica_nota_azul'
  ]);

  // 2. Presa de Coral
  const presa = catalog.find((d: any) => d.id === 'presa_de_coral');
  assert.ok(presa, 'Presa de Coral deve existir no catálogo de distinções');
  assert.equal(presa.nome, 'Presa de Coral');
  assert.equal(presa.livro, 'Dragão Brasil 206');
  assert.ok(presa.marca, 'Presa de Coral deve possuir marca');
  assert.equal(presa.marca.nome, 'Sangue do Dragão-Rei');
  assert.ok(presa.marca.descricao.includes('ácido'), 'Descrição do Sangue do Dragão-Rei deve mencionar dano de ácido');
  assert.equal(presa.poderes.length, 7, 'Presa de Coral deve conter 7 poderes canônicos');

  const presaPowerIds = presa.poderes.map((p: any) => p.id);
  assert.deepEqual(presaPowerIds, [
    'arsenal_de_coral',
    'presa_distante_azagaia_de_agua',
    'presa_dupla_corte_da_correnteza',
    'salto_oceanico',
    'tres_se_tornam_um',
    'manobra_maremoto',
    'presa_suprema_arquipelago_de_dor'
  ]);
});

test('Distinções DB 206: Efeitos de Marcas em efeitosMarcas', () => {
  const result = efeitosMarcas(['menestrel_maldito']);
  assert.equal(result.skills['atuacao'], 1, 'Menestrel Maldito deve conceder +1 em Atuação');
});

test('Fonte Tormenta20: Verificação de existência do arquivo da fonte', () => {
  const fontPath = path.join(rootDir, 'assets', 'fonts', 'Tormenta20x.ttf');
  assert.equal(fs.existsSync(fontPath), true, 'assets/fonts/Tormenta20x.ttf deve existir');
  const stat = fs.statSync(fontPath);
  assert.ok(stat.size > 20000, 'Arquivo TTF da fonte deve ser válido e ter tamanho substancial');
});
