// @ts-check
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('Iniciando testes de Distinções e Opções de Devoção...');

// 1. Validando o arquivo dados/distincoes.json
const distPath = path.join(__dirname, '..', 'dados', 'distincoes.json');
assert.ok(fs.existsSync(distPath), 'Arquivo dados/distincoes.json deve existir');
const distincoes = JSON.parse(fs.readFileSync(distPath, 'utf8'));
assert.strictEqual(distincoes.length, 59, 'Deve conter as 59 distinções fornecidas');

distincoes.forEach(d => {
  assert.ok(d.id, `Distinção ${d.nome} deve ter id`);
  assert.ok(d.nome, `Distinção ${d.id} deve ter nome`);
  assert.ok(d.admissao, `Distinção ${d.nome} deve ter texto de admissão`);
  assert.ok(d.marca && d.marca.nome && d.marca.descricao, `Distinção ${d.nome} deve ter Marca completa`);
  assert.ok(Array.isArray(d.poderes) && d.poderes.length > 0, `Distinção ${d.nome} deve conter poderes`);
  d.poderes.forEach(p => {
    assert.ok(p.id, `Poder da distinção ${d.nome} deve ter id`);
    assert.ok(p.nome, `Poder da distinção ${d.nome} deve ter nome`);
    assert.ok(p.descricao, `Poder ${p.nome} deve ter descrição`);
  });
});
console.log('✔ Catálogo de 59 Distinções validado com integridade total!');

// 2. Validando opções de Divindade na Fase 4 (04-origens-divindades.js)
const divindadesJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'funcionalidades', 'criador', 'fases', '04-origens-divindades.js'), 'utf8');
assert.ok(divindadesJs.includes('Não devoto'), 'Deve conter opção "Não devoto"');
assert.ok(divindadesJs.includes('Escolher Divindade'), 'Deve conter opção "Escolher Divindade"');
assert.ok(divindadesJs.includes('Devoto do Panteão'), 'Deve conter opção "Devoto do Panteão"');
assert.ok(divindadesJs.includes('svg class="forja-svg'), 'Cards de devoção devem conter ícones SVG');
console.log('✔ Fase 4 de Divindades validada (Não devoto, Escolher Divindade, Devoto do Panteão com ícones)!');

// 3. Validando Botão de Distinção na Ficha (renderizacao.js)
const renderizacaoJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'funcionalidades', 'criador', 'ficha', 'renderizacao.js'), 'utf8');
assert.ok(renderizacaoJs.includes('currentLevel >= 5'), 'Deve condicionar distinção a nível >= 5');
assert.ok(renderizacaoJs.includes('sheet-distinction-btn'), 'Deve renderizar botão sheet-distinction-btn');
assert.ok(renderizacaoJs.includes('href="distincoes.html"'), 'Botão deve linkar para distincoes.html');
console.log('✔ Botão de Distinções na ficha validado (apenas para Nível 5+)!');

// 4. Validando regras de poderes de distinção (progressao-poderes.js e 09-lista-poderes.js)
const progressaoJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'regras', 'criador', 'progressao-poderes.js'), 'utf8');
assert.ok(progressaoJs.includes('progressionDistinctionPowerById'), 'Deve implementar progressionDistinctionPowerById');
assert.ok(progressaoJs.includes('progressionDistinctionOptions'), 'Deve implementar progressionDistinctionOptions');
assert.ok(progressaoJs.includes('progressionDistinctionEligibility'), 'Deve implementar progressionDistinctionEligibility');

const listaPoderesJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'funcionalidades', 'criador', 'fases', '09-lista-poderes.js'), 'utf8');
assert.ok(listaPoderesJs.includes('Poderes de distinção'), 'Filtros devem conter chip Poderes de distinção');
assert.ok(listaPoderesJs.includes('Todos os poderes'), 'Filtros devem permitir exibir Todos os poderes unificados');
console.log('✔ Progressão de Poderes de Distinção e filtro unificado Todos validados!');

// 5. Validando Drawer com link de Distinções (drawer-ui.js)
const drawerJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'compartilhado', 'drawer', 'drawer-ui.js'), 'utf8');
assert.ok(drawerJs.includes('distincoes.html'), 'Drawer deve conter link para distincoes.html');
console.log('✔ Menu lateral Drawer validado com Distinções de Arton!');

console.log('🎉 Todos os testes de Distinções e Divindades passaram com 100% de sucesso!');
