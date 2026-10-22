import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';

console.log('=== TESTES DE COMPARTILHAMENTO DE FICHAS (TORMENTA 20) ===\n');

// 1. Simular ambiente com pako
const pakoPath = path.resolve('assets/vendor/pako.min.js');
const pakoCode = fs.readFileSync(pakoPath, 'utf8');

const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', {
  url: 'https://forjarubra.app/ficha.html',
  runScripts: 'dangerously'
});

const win = dom.window as any;
win.eval(pakoCode);
assert.ok(win.pako, 'Pako deve estar disponível na janela');

import { transformSync } from 'esbuild';

const modeloEstadoCode = fs.readFileSync(path.resolve('src/compartilhado/criador/modelo-estado.ts'), 'utf8');
const transpiled = transformSync(modeloEstadoCode, {
  loader: 'ts',
  target: 'es2022'
}).code;

win.eval(transpiled);

const ModeloEstado = win.ModeloEstado;
assert.ok(ModeloEstado, 'ModeloEstado deve estar definido no window');
assert.equal(typeof ModeloEstado.codificarFicha, 'function', 'codificarFicha deve existir');
assert.equal(typeof ModeloEstado.decodificarFicha, 'function', 'decodificarFicha deve existir');

const fichaMock = {
  identity: {
    characterName: 'Valeros, Guardião de Khalmyr',
    playerName: 'Mestre da Forja',
    raceId: 'humano',
    classId: 'guerreiro',
    plannedLevel: 8
  },
  attributes: {
    for: 19,
    des: 14,
    con: 16,
    int: 12,
    sab: 14,
    car: 10
  },
  vitals: {
    pv: { current: 68, max: 68 },
    pm: { current: 24, max: 24 }
  },
  spells: {
    grimoire: ['bencao', 'escudo_da_fe', 'curar_ferimentos']
  },
  powers: [
    { id: 'ataque_poderoso', name: 'Ataque Poderoso' },
    { id: 'trespassar', name: 'Trespassar' }
  ],
  finished: true,
  sheetView: 'sheet',
  step: 10
};

// Teste 1: Codificação e decodificação com pako
console.log('1. Validando codificação e decodificação com pako (prefixo z_)...');
const codigo = ModeloEstado.codificarFicha(fichaMock);
assert.ok(codigo, 'Código não pode ser vazio');
assert.ok(codigo.startsWith('z_'), 'Código com pako deve iniciar com z_');
assert.ok(!codigo.includes('+') && !codigo.includes('/'), 'Código deve ser URL-safe');

const decodificada = ModeloEstado.decodificarFicha(codigo);
assert.ok(decodificada, 'Ficha decodificada não pode ser nula');
assert.equal(decodificada.identity.characterName, 'Valeros, Guardião de Khalmyr');
assert.equal(decodificada.identity.plannedLevel, 8);
assert.equal(decodificada.attributes.for, 19);
assert.equal(decodificada.vitals.pv.max, 68);
assert.equal(decodificada.spells.grimoire.length, 3);
console.log('✔ Codificação e decodificação com pako validadas com sucesso!');

// Teste 2: Fallback sem pako (prefixo b_)
console.log('\n2. Validando fallback base64 sem pako (prefixo b_)...');
const pakoOriginal = win.pako;
delete win.pako;
const codigoB = ModeloEstado.codificarFicha(fichaMock);
assert.ok(codigoB.startsWith('b_'), 'Sem pako deve usar prefixo b_');
const decodificadaB = ModeloEstado.decodificarFicha(codigoB);
assert.ok(decodificadaB, 'Decodificação b_ deve funcionar');
assert.equal(decodificadaB.identity.characterName, 'Valeros, Guardião de Khalmyr');
assert.equal(decodificadaB.attributes.for, 19);
win.pako = pakoOriginal;
console.log('✔ Fallback sem pako validado com sucesso!');

// Teste 3: Simulação de carregamento de URL compartilhada
console.log('\n3. Validando carregamento de ficha via URL com ?compartilhar=...');
const urlCompartilhada = `https://forjarubra.app/ficha.html?compartilhar=${codigo}`;
const domUrl = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', {
  url: urlCompartilhada,
  runScripts: 'dangerously'
});
const winUrl = domUrl.window as any;
winUrl.eval(pakoCode);
winUrl.eval(transpiled);

// Testar que decodificar a partir do parâmetro da URL reconstrói a ficha integral
const params = new winUrl.URLSearchParams(winUrl.location.search);
const shareCode = params.get('compartilhar');
assert.equal(shareCode, codigo, 'Parâmetro compartilhar deve bater');
const loadedFicha = ModeloEstado.decodificarFicha(shareCode);
assert.ok(loadedFicha, 'Ficha carregada da URL não pode ser vazia');
assert.equal(loadedFicha.identity.characterName, 'Valeros, Guardião de Khalmyr');
assert.equal(loadedFicha.identity.classId, 'guerreiro');
console.log('✔ Carregamento via URL compartilhado validado com sucesso!');

console.log('\n======================================================');
console.log('🎉 SUCESSO TOTAL: Todos os testes de compartilhamento passaram!');
console.log('======================================================\n');
