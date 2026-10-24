const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== Iniciando Testes de Otimização e Ordenação de Raças ===');

// Mock browser environment for criador files
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="phaseNav"></div><div id="creatorStage"></div></body></html>', { url: 'http://localhost/' });
global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;

// Load test data
const racesData = JSON.parse(fs.readFileSync(path.join(__dirname, '../dados/criador-races.json'), 'utf8'));
const classesData = JSON.parse(fs.readFileSync(path.join(__dirname, '../dados/criador-classes.json'), 'utf8'));

global.DATA = {
  races: racesData,
  classes: classesData
};

global.BOOKS = {
  basico: 'Tormenta 20 - Edição do Ano',
  ameacas: 'Ameaças de Arton',
  herois: 'Heróis de Arton'
};

global.state = {
  step: 2,
  completed: [1],
  identity: {
    raceId: 'humano',
    classId: 'bardo',
    raceChoices: {},
    raceSubAttrs: {},
    optimizeRaces: false,
    sortRacesByEfficiency: false,
    openRaceBonusEnabled: false,
    openRaceAllocations: {}
  }
};

global.raceById = (id) => racesData.find(r => r.id === id);
global.classById = (id) => classesData.find(c => c.id === id);
global.esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
global.slug = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
global.persist = () => {};
global.renderStage = () => {};
global.isRaceEligibleForOpenRaces = () => true;
global.raceHasFlexibleOpenRaceConversion = (race) => Boolean(race?.atributos?.flexiveis);
global.raceFlexibleOpenRaceBonusCount = () => 0;
global.raceFixedModifiers = () => [];
global.remainingOpenRaceModifiers = () => [];
global.bookTag = () => '';
global.raceBodyTraitsHtml = () => '<div class="body-traits">Tamanho: Médio Deslocamento: 9m</div>';
global.renderChoice = () => '';
global.selectedRaceOption = () => null;
global.choiceName = () => '';
global.supplementalRaceChoiceDefinitions = () => [];
global.panel = (title, content) => '<div class="panel"><div class="panel-title">' + title + '</div><div class="panel-body">' + content + '</div></div>';
global.abilityHtml = (a) => '<div>' + (a?.nome || '') + '</div>';

// Load file under test
const phaseCode = fs.readFileSync(path.join(__dirname, '../src/funcionalidades/criador/fases/02-raca-atributos.js'), 'utf8');

// Evaluate in current context to access internal functions via eval
const contextEvaluator = new Function(
  'DATA', 'state', 'raceById', 'classById', 'esc', 'slug', 'persist', 'renderStage', 'isRaceEligibleForOpenRaces',
  'raceFixedModifiers', 'remainingOpenRaceModifiers', 'bookTag', 'raceBodyTraitsHtml', 'renderChoice',
  'selectedRaceOption', 'choiceName', 'supplementalRaceChoiceDefinitions', 'panel', 'BOOKS', 'abilityHtml',
  phaseCode + `
  return {
    getClassPrimaryAttrs,
    getRaceEfficiencyTier,
    getSortedRacesList,
    renderRaceEfficiencyBadge,
    renderRacePanel,
    renderOpenRacesCard
  };
`
);

const moduleExports = contextEvaluator(
  global.DATA, global.state, global.raceById, global.classById, global.esc, global.slug, global.persist, global.renderStage,
  global.isRaceEligibleForOpenRaces, global.raceFixedModifiers, global.remainingOpenRaceModifiers,
  global.bookTag, global.raceBodyTraitsHtml, global.renderChoice, global.selectedRaceOption, global.choiceName,
  global.supplementalRaceChoiceDefinitions, global.panel, global.BOOKS, global.abilityHtml
);

const { getClassPrimaryAttrs, getRaceEfficiencyTier, getSortedRacesList, renderRaceEfficiencyBadge, renderRacePanel, renderOpenRacesCard } = moduleExports;

console.log('1. Validando ordenação padrão (Humano primeiro + resto em ordem alfabética)...');
const defaultSorted = getSortedRacesList('barbaro', { identity: { optimizeRaces: false, sortRacesByEfficiency: false } });
assert.strictEqual(defaultSorted[0].id, 'humano', 'O primeiro item da lista padrão DEVE ser o Humano');
const nonHumans = defaultSorted.slice(1);
for (let i = 0; i < nonHumans.length - 1; i++) {
  const comp = nonHumans[i].nome.localeCompare(nonHumans[i + 1].nome, 'pt-BR');
  assert.ok(comp <= 0, `Raças fora de ordem alfabética: "${nonHumans[i].nome}" veio antes de "${nonHumans[i + 1].nome}"`);
}
console.log('✔ Humano como primeiro e restante A-Z validado com sucesso!');

console.log('2. Validando distinção de atributos por classe e escolhas...');
// Usurpador
assert.deepStrictEqual(getClassPrimaryAttrs('usurpador'), ['car'], 'Usurpador deve ter Carisma como atributo principal');
// Arcanista: Mago vs Feiticeiro
assert.deepStrictEqual(getClassPrimaryAttrs('arcanista', { identity: { classChoices: {} } }), ['int'], 'Arcanista padrão/Mago/Bruxo deve ter Inteligência');
assert.deepStrictEqual(getClassPrimaryAttrs('arcanista', { identity: { classChoices: { arcanista_caminho_do_arcanista: 'mago' } } }), ['int'], 'Mago deve ter Inteligência');
assert.deepStrictEqual(getClassPrimaryAttrs('arcanista', { identity: { classChoices: { arcanista_caminho_do_arcanista: 'bruxo' } } }), ['int'], 'Bruxo deve ter Inteligência');
assert.deepStrictEqual(getClassPrimaryAttrs('arcanista', { identity: { classChoices: { arcanista_caminho_do_arcanista: 'feiticeiro' } } }), ['car'], 'Feiticeiro deve ter Carisma');

// Guerreiro e Caçador: Luta vs Pontaria
assert.deepStrictEqual(getClassPrimaryAttrs('guerreiro', { identity: { classRequiredChoices: ['luta'] } }), ['for'], 'Guerreiro com Luta deve ter Força');
assert.deepStrictEqual(getClassPrimaryAttrs('guerreiro', { identity: { classRequiredChoices: ['pontaria'] } }), ['des'], 'Guerreiro com Pontaria deve ter Destreza');
assert.deepStrictEqual(getClassPrimaryAttrs('cacador', { identity: { classRequiredChoices: ['luta'] } }), ['for'], 'Caçador com Luta deve ter Força');
assert.deepStrictEqual(getClassPrimaryAttrs('cacador', { identity: { classRequiredChoices: ['pontaria'] } }), ['des'], 'Caçador com Pontaria deve ter Destreza');
console.log('✔ Resolução dinâmica de atributos principais por classe/caminho/perícia validada!');

console.log('3. Validando cálculo de Tiers para Mago vs Feiticeiro (Qareen)...');
const qareen = racesData.find(r => r.id === 'qareen');
const duende = racesData.find(r => r.id === 'duende');
const meioElfo = racesData.find(r => r.id === 'meio_elfo');
const humano = racesData.find(r => r.id === 'humano');
const lefou = racesData.find(r => r.id === 'lefou');
const moreau = racesData.find(r => r.id === 'moreau');
const elfo = racesData.find(r => r.id === 'elfo');
const kliren = racesData.find(r => r.id === 'kliren');
const silfide = racesData.find(r => r.id === 'silfide');
const golem = racesData.find(r => r.id === 'golem');
const dahllan = racesData.find(r => r.id === 'dahllan');
const anao = racesData.find(r => r.id === 'anao');
const minotauro = racesData.find(r => r.id === 'minotauro');
const sulfure = racesData.find(r => r.id === 'suraggel');

// Qareen para Mago (Inteligência): deve ser BOA (+1), NÃO Excelente (+2)
const qareenMago = getRaceEfficiencyTier(qareen, 'arcanista', { identity: { classChoices: { arcanista_caminho_do_arcanista: 'mago' } } });
assert.strictEqual(qareenMago.tier, 'bom', 'Qareen para Mago deve ser Boa (+1 em Inteligência)');
assert.strictEqual(qareenMago.symbol, '▲');
assert.strictEqual(qareenMago.color, '#22c55e');

// Qareen para Feiticeiro (Carisma): deve ser EXCELENTE (+2 em Carisma)
const qareenFeiticeiro = getRaceEfficiencyTier(qareen, 'arcanista', { identity: { classChoices: { arcanista_caminho_do_arcanista: 'feiticeiro' } } });
assert.strictEqual(qareenFeiticeiro.tier, 'excelente', 'Qareen para Feiticeiro deve ser Excelente (+2 em Carisma)');
assert.strictEqual(qareenFeiticeiro.symbol, '▲');
assert.strictEqual(qareenFeiticeiro.color, '#3b82f6');

// Duende e Moreau são sempre excelentes pelo potencial (+2)
assert.strictEqual(getRaceEfficiencyTier(duende, 'bardo').tier, 'excelente');
assert.strictEqual(getRaceEfficiencyTier(moreau, 'barbaro').tier, 'excelente');
console.log('✔ Tiers de Mago, Feiticeiro, Duende e Moreau validados!');

console.log('4. Validando regras especiais para classes com 2 atributos principais (Ladino e Paladino)...');
// Ladino (Destreza e Inteligência)
// - Elfo (+2 Int, +1 Des) -> Excelente (+2 em um e +1 no outro)
assert.strictEqual(getRaceEfficiencyTier(elfo, 'ladino').tier, 'excelente', 'Elfo para Ladino deve ser Excelente (+2 e +1)');
// - Kliren (+2 Int, 0 Des) -> Boa (+2 em um e não-negativo no outro)
assert.strictEqual(getRaceEfficiencyTier(kliren, 'ladino').tier, 'bom', 'Kliren para Ladino deve ser Boa (+2 e 0)');
// - Humano (+1 flex em dois atributos) -> Boa (+1 em ambos)
assert.strictEqual(getRaceEfficiencyTier(humano, 'ladino').tier, 'bom', 'Humano para Ladino deve ser Boa (+1 em ambos flexíveis)');
// - Silfide (+1 Des, 0 Int) -> Neutra (+1 em um e 0 no outro)
assert.strictEqual(getRaceEfficiencyTier(silfide, 'ladino').tier, 'neutro', 'Silfide para Ladino deve ser Neutra (+1 e 0)');
// - Golem (0 Des, 0 Int) -> Neutra (0 e 0)
assert.strictEqual(getRaceEfficiencyTier(golem, 'ladino').tier, 'neutro', 'Golem para Ladino deve ser Neutra (0 e 0)');
// - Dahllan (+1 Des, -1 Int) -> Ruim (+1 em um e -1 no outro)
assert.strictEqual(getRaceEfficiencyTier(dahllan, 'ladino').tier, 'ruim', 'Dahllan para Ladino deve ser Ruim (+1 e -1)');
// - Anão (-1 Des, 0 Int) -> Ruim (-1 em um)
assert.strictEqual(getRaceEfficiencyTier(anao, 'ladino').tier, 'ruim', 'Anão para Ladino deve ser Ruim (-1 e 0)');

// Paladino (Força e Carisma)
// - Qareen (+2 Car, 0 For) -> Boa (+2 em um e não-negativo no outro)
assert.strictEqual(getRaceEfficiencyTier(qareen, 'paladino').tier, 'bom', 'Qareen para Paladino deve ser Boa (+2 e 0)');
// - Minotauro (+2 For, 0 Car) -> Boa (+2 em um e não-negativo no outro)
assert.strictEqual(getRaceEfficiencyTier(minotauro, 'paladino').tier, 'bom', 'Minotauro para Paladino deve ser Boa (+2 e 0)');
// - Humano (+1 For e +1 Car) -> Boa (+1 em ambos flexíveis)
assert.strictEqual(getRaceEfficiencyTier(humano, 'paladino').tier, 'bom', 'Humano para Paladino deve ser Boa (+1 em ambos flexíveis)');
// - Golem (+2 For, -1 Car) -> Neutra (+2 em um, mas o outro é negativo)
assert.strictEqual(getRaceEfficiencyTier(golem, 'paladino').tier, 'neutro', 'Golem para Paladino deve ser Neutra (+2 e -1)');
// - Kliren (+1 Car, -1 For) -> Ruim (+1 e -1)
assert.strictEqual(getRaceEfficiencyTier(kliren, 'paladino').tier, 'ruim', 'Kliren para Paladino deve ser Ruim (+1 e -1)');
console.log('✔ Tabela e regras especiais de 2 atributos principais validadas com sucesso!');

console.log('5. Validando ausência de Carisma na perda por Tormenta da Linhagem Rubra...');
const arcData = classesData.find(c => c.id === 'arcanista');
const caminhoArc = arcData.habilidades.find(h => h.id === 'arcanista_caminho_do_arcanista');
const feiticeiroOpcao = caminhoArc.escolhas.find(e => e.nome === 'Feiticeiro');
const rubra = feiticeiroOpcao.escolhas_secundarias.find(s => s.id === 'linhagem_rubra');
const perdaChoice = rubra.escolhas_terciarias.find(t => t.id === 'atributo_perda_tormenta');
assert.ok(!perdaChoice.opcoes.includes('car'), 'Linhagem Rubra NÃO deve conter carisma para perda de atributos');
console.log('✔ Carisma devidamente excluído das opções de perda de atributos da Linhagem Rubra!');

console.log('6. Validando layout visual do painel de Raça (Print editado)...');
global.state.identity = {
  raceId: 'kliren',
  classId: 'arcanista',
  optimizeRaces: false,
  sortRacesByEfficiency: false,
  openRaceBonusEnabled: false,
  raceChoices: {}
};
const panelHtml = renderRacePanel();
assert.ok(!panelHtml.includes('Raça do personagem'), 'Texto redundante "Raça do personagem" não deve existir');
assert.ok(!panelHtml.includes('· Tormenta 20 - Edição do Ano</div>'), 'Tag do livro não deve mais existir abaixo do seletor');
assert.ok(panelHtml.includes('Otimizar Classe'), 'Controle deve ter o nome "Otimizar Classe"');
assert.ok(panelHtml.indexOf('data-field="raceId"') < panelHtml.indexOf('Otimizar Classe'), 'Seletor deve vir antes de Otimizar Classe');
assert.ok(panelHtml.indexOf('Otimizar Classe') < panelHtml.indexOf('race-traits-card'), 'Otimizar Classe deve vir antes de Tamanho e Deslocamento');

const openRacesHtml = renderOpenRacesCard(kliren);
assert.ok(!openRacesHtml.includes('Heróis de Arton'), 'Tag "Heróis de Arton" removida do card de Raças Abertas');
console.log('✔ Layout reestruturado fiel ao print do usuário validado!');

console.log('7. Validando unificação do botão Otimizar Classe (ativação e ordenação automáticas)...');
const optSorted = getSortedRacesList('arcanista', {
  identity: {
    optimizeRaces: true,
    openRaceBonusEnabled: false
  }
});
const optTier1 = getRaceEfficiencyTier(optSorted[0], 'arcanista');
assert.ok(['excelente', 'bom'].includes(optTier1.tier), 'Com Otimizar Classe ativo, primeiro grupo deve ser Excelente/Bom');
console.log('✔ Ativação unificada de ícones e ordenação por Otimizar Classe validada!');

console.log('\n======================================================');
console.log('🎉 SUCESSO TOTAL: Todos os 7 requisitos foram validados!');
console.log('======================================================\n');
