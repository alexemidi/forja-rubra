const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== TESTE DE AVANÇO NA FASE 6 COM ORIGEM REGIONAL FUTURA LENDA ===\n');

// 1. Simulação do ambiente da Fase 6 e módulos
const seqSrc = fs.readFileSync(path.resolve(__dirname, '../src/funcionalidades/criador/fases/poderes-sequenciais.js'), 'utf-8');
const cosmoSrc = fs.readFileSync(path.resolve(__dirname, '../src/regras/criador/origem-cosmopolita.js'), 'utf-8');
const navSrc = fs.readFileSync(path.resolve(__dirname, '../src/funcionalidades/criador/fases/01-identidade-escolhas.js'), 'utf-8');

assert.ok(seqSrc.includes("stages.push({type:'futura_lenda',label:'Origem Regional (Futura Lenda)'});"), 'getPhase6SubStages em poderes-sequenciais.js inclui futura_lenda');
assert.ok(cosmoSrc.includes("stages.push({ type: 'futura_lenda', label: 'Origem Regional (Futura Lenda)' });"), 'getPhase6SubStages em origem-cosmopolita.js inclui futura_lenda');
assert.ok(navSrc.includes("const stages = typeof getPhase6SubStages === 'function' ? getPhase6SubStages() : [];"), 'syncPhaseStepNavigation checa getPhase6SubStages()');

// 2. Mock de DOM e estado para simular o cenário exato do print do usuário
const mockNextButton = {
  id: 'nextButton',
  hidden: false,
  disabled: true,
  textContent: 'Avançar →',
  classList: {
    classes: new Set(['button', 'primary']),
    add(c){ this.classes.add(c); },
    remove(c){ this.classes.delete(c); },
    toggle(c, force){ if(force) this.classes.add(c); else this.classes.delete(c); },
    contains(c){ return this.classes.has(c); }
  }
};

const mockStepPrev = { id: 'stepPrevButton', hidden: true, disabled: true, textContent: '' };
const mockStepNext = { id: 'stepNextButton', hidden: true, disabled: true, textContent: '', classList: { toggle(){} } };

const mockDocument = {
  getElementById(id){
    if(id === 'nextButton') return mockNextButton;
    if(id === 'stepPrevButton') return mockStepPrev;
    if(id === 'stepNextButton') return mockStepNext;
    return null;
  },
  addEventListener(){},
  querySelector(){ return null; },
  querySelectorAll(){ return []; }
};

global.document = mockDocument;
global.window = global;

const DATA = {
  classPowers: [
    { id: 'bencao_fortalecedora', nome: 'Bênção Fortalecedora', classeIds: ['clerigo'], descricao: 'Quando você lança Bênção...' }
  ]
};
global.DATA = DATA;

const mockState = {
  step: 6,
  identity: { classId: 'clerigo', plannedLevel: 1 },
  origin: { mode: 'dual', regional: 'futura_lenda' },
  powers: {
    general: [],
    raceGroups: {},
    phase6StageIndex: 0
  },
  completed: [1, 2, 3, 4, 5]
};
global.state = mockState;
global.slug = str => String(str || '').toLowerCase().replace(/\s+/g, '_');
global.racePowerGroups = () => [];
global.generalPowerSlots = () => 0;
global.originGeneralPowerOptions = () => [];
global.hasDuploFeerico = () => false;
global.hasCosmopolita = () => false;
global.hasFuturaLenda = () => true;
global.selectedFuturaLendaPower = () => {
  if(!mockState.powers.futuraLendaClassPower) return null;
  return DATA.classPowers.find(p => p.id === mockState.powers.futuraLendaClassPower) || null;
};
global.phaseIsComplete = step => {
  if(step === 6) return Boolean(mockState.powers.futuraLendaClassPower);
  return true;
};
global.isCurrentPhaseComplete = () => global.phaseIsComplete(6);
global.characterHasPowerChoices = () => true;
global.powerMissingChoices = () => {
  if(!mockState.powers.futuraLendaClassPower) return [{ title: 'Futura Lenda', message: 'Escolha um poder' }];
  return [];
};
global.toast = () => {};
global.persist = () => {};
global.renderStage = () => {};
global.getNextLinearStep = s => s + 1;

// Avaliar poderes-sequenciais.js no contexto
const evalFn = new Function(seqSrc);
evalFn();

console.log('1. Verificando sub-estágios gerados para personagem com Futura Lenda...');
const stages = global.getPhase6SubStages();
assert.strictEqual(stages.length, 1, 'Deve gerar exatamente 1 sub-estágio para Futura Lenda');
assert.strictEqual(stages[0].type, 'futura_lenda', 'O tipo do sub-estágio deve ser futura_lenda');
console.log('✔ Sub-estágio de Futura Lenda gerado com sucesso: [{ type: "futura_lenda" }]');

console.log('\n2. Verificando comportamento antes de selecionar poder de Futura Lenda...');
delete mockState.powers.futuraLendaClassPower;
global.syncSequentialPowerFooter();
assert.strictEqual(mockNextButton.hidden, false, 'nextButton deve estar visível');
assert.strictEqual(mockNextButton.disabled, true, 'nextButton deve estar desabilitado enquanto pendente');
assert.strictEqual(mockNextButton.classList.contains('is-incomplete'), true, 'nextButton deve ter classe is-incomplete');
assert.strictEqual(mockStepNext.hidden, true, 'stepNextButton deve estar oculto em fase de 1 estágio');
console.log('✔ Antes da escolha, o botão Avançar permanece bloqueado como esperado.');

console.log('\n3. Verificando comportamento APÓS selecionar "Bênção Fortalecedora"...');
mockState.powers.futuraLendaClassPower = 'bencao_fortalecedora';
global.syncSequentialPowerFooter();
assert.strictEqual(mockNextButton.hidden, false, 'nextButton DEVE estar visível');
assert.strictEqual(mockNextButton.disabled, false, 'nextButton DEVE estar habilitado agora!');
assert.strictEqual(mockNextButton.classList.contains('is-incomplete'), false, 'Classe is-incomplete DEVE ser removida!');
assert.strictEqual(mockNextButton.textContent, 'Avançar →', 'Texto deve ser Avançar →');
console.log('✔ Com Bênção Fortalecedora selecionada, o botão Avançar → foi LIBERADO com sucesso!');

console.log('\n===============================================================');
console.log('🎉 SUCESSO TOTAL: Validação de Futura Lenda na Fase 6 concluída!');
console.log('===============================================================');
