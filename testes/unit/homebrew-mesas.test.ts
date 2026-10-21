/**
 * Testes Unitários: Sistema de Homebrews e Mesas Virtuais (Tormenta 20)
 */

import assert from 'node:assert/strict';

// Configurar mock de localStorage para ambiente Node
const storageMap = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => storageMap.get(k) ?? null,
  setItem: (k: string, v: string) => storageMap.set(k, String(v)),
  removeItem: (k: string) => storageMap.delete(k),
  clear: () => storageMap.clear()
};

import { ForjaHomebrew } from '../../src/lib/t20/homebrew.ts';
import { ForjaMesas } from '../../src/lib/t20/mesas.ts';

// ==========================================
// 1. TESTES DO SISTEMA DE HOMEBREWS
// ==========================================

storageMap.clear();

// Criar raça homebrew
const racaHb = ForjaHomebrew.salvar({
  tipo: 'raca',
  nome: 'Meio-Dragão Rubro',
  autor: 'Mestre da Forja',
  descricao: 'Descendentes tocados pelas chamas de Kallyadranoch.',
  ativo: true,
  dados: {
    modificadoresAtributos: { for: 2, con: 1, car: 1 },
    tamanho: 'Médio',
    deslocamento: 9,
    habilidades: [
      { nome: 'Sopro de Fogo', descricao: 'Cone de fogo que causa 2d6 de dano.', custoPM: 1 }
    ]
  }
});

assert.ok(racaHb.id, 'Homebrew deve ter um ID gerado');
assert.equal(racaHb.nome, 'Meio-Dragão Rubro');
assert.equal(racaHb.ativo, true);

// Listar e filtrar
const racas = ForjaHomebrew.listar('raca');
assert.equal(racas.length, 1);
assert.equal(racas[0].nome, 'Meio-Dragão Rubro');

// Alternar status ativo
const statusNovo = ForjaHomebrew.alternarAtivo(racaHb.id);
assert.equal(statusNovo, false, 'Deveria ter sido desativado');
assert.equal(ForjaHomebrew.listarAtivos('raca').length, 0);

ForjaHomebrew.alternarAtivo(racaHb.id);
assert.equal(ForjaHomebrew.listarAtivos('raca').length, 1);

// Mesclar com catálogo oficial
const catalogoOficial = [{ id: 'humano', nome: 'Humano' }, { id: 'anao', nome: 'Anão' }];
const mesclado = ForjaHomebrew.mesclarComCatalogo(
  catalogoOficial,
  'raca',
  (hb) => ({ id: hb.id, nome: hb.nome })
);
assert.equal(mesclado.length, 3);
assert.equal(mesclado[2].nome, 'Meio-Dragão Rubro');

// Exportar e importar
const jsonExportado = ForjaHomebrew.exportarJSON();
assert.ok(jsonExportado.includes('Meio-Dragão Rubro'));

storageMap.clear();
assert.equal(ForjaHomebrew.listar().length, 0);

const resultadoImportacao = ForjaHomebrew.importarJSON(jsonExportado);
assert.equal(resultadoImportacao.importados, 1);
assert.equal(resultadoImportacao.erros.length, 0);
assert.equal(ForjaHomebrew.listar().length, 1);

// ==========================================
// 2. TESTES DO SISTEMA DE MESAS VIRTUAIS
// ==========================================

storageMap.clear();

// Criar mesa
const mesa = ForjaMesas.criar(
  'Campanha: Coração de Rubi',
  'Mestre Gabriel',
  { devocaoLivre: true, permitirIdade: true, tipoRegraIdade: 'herois_de_arton' },
  'Mesa oficial jogando quinzenalmente aos domingos.'
);

assert.ok(mesa.id.startsWith('FR-'), 'Código da mesa deve iniciar com FR-');
assert.equal(mesa.nome, 'Campanha: Coração de Rubi');
assert.equal(mesa.regras.devocaoLivre, true);
assert.equal(mesa.regras.tipoRegraIdade, 'herois_de_arton');

// Adicionar jogador à mesa
const sucessoEntrada = ForjaMesas.entrarOuAtualizarJogador(mesa.id, {
  idFicha: 'ficha-1234',
  nomePersonagem: 'Kaelen Braço-de-Ferro',
  nomeJogador: 'Carlos',
  raca: 'Humano',
  classe: 'Guerreiro',
  nivel: 3,
  pvAtual: 28,
  pvMax: 35,
  pmAtual: 8,
  pmMax: 9,
  defesa: 19,
  condicoes: ['Abalado'],
  iniciativa: 14,
  ultimaAtualizacao: new Date().toISOString()
});

assert.equal(sucessoEntrada, true);
const mesaComJogador = ForjaMesas.obter(mesa.id);
assert.ok(mesaComJogador);
assert.equal(mesaComJogador.jogadores.length, 1);
assert.equal(mesaComJogador.jogadores[0].nomePersonagem, 'Kaelen Braço-de-Ferro');
assert.equal(mesaComJogador.jogadores[0].pvAtual, 28);

// Atualizar status do jogador
ForjaMesas.entrarOuAtualizarJogador(mesa.id, {
  idFicha: 'ficha-1234',
  nomePersonagem: 'Kaelen Braço-de-Ferro',
  nomeJogador: 'Carlos',
  raca: 'Humano',
  classe: 'Guerreiro',
  nivel: 3,
  pvAtual: 35,
  pvMax: 35,
  pmAtual: 9,
  pmMax: 9,
  defesa: 19,
  condicoes: [],
  iniciativa: 14,
  ultimaAtualizacao: new Date().toISOString()
});

const mesaAtualizada = ForjaMesas.obter(mesa.id)!;
assert.equal(mesaAtualizada.jogadores[0].pvAtual, 35);
assert.equal(mesaAtualizada.jogadores[0].condicoes.length, 0);

// Adicionar rolagem ao log da mesa
const log = ForjaMesas.adicionarLogRolagem(mesa.id, {
  nomeJogador: 'Carlos',
  nomePersonagem: 'Kaelen Braço-de-Ferro',
  periciaOuAcao: 'Luta',
  formula: '1d20+8',
  d20: 20,
  total: 28,
  critico: true,
  falha: false
});

assert.ok(log);
assert.equal(log.critico, true);
assert.equal(ForjaMesas.obter(mesa.id)!.logs.length, 1);
assert.equal(ForjaMesas.obter(mesa.id)!.logs[0].total, 28);

// Exportar e importar mesa
const jsonMesa = ForjaMesas.exportarJSON(mesa.id);
assert.ok(jsonMesa);
assert.ok(jsonMesa.includes('Kaelen Braço-de-Ferro'));

storageMap.clear();
assert.equal(ForjaMesas.listar().length, 0);

const mesaImportada = ForjaMesas.importarJSON(jsonMesa);
assert.ok(mesaImportada);
assert.equal(mesaImportada.nome, 'Campanha: Coração de Rubi');
assert.equal(mesaImportada.jogadores.length, 1);
assert.equal(mesaImportada.logs.length, 1);

console.log('✔ Todos os testes de Homebrews e Mesas Virtuais passaram com sucesso!');
