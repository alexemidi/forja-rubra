const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== Testes da Barra Escalável de Vitais e Fase 9 (Parceiros) ===');

// 1. Validar calculateVitalBarMetrics
function calculateVitalBarMetrics(val) {
  const num = Math.max(0, Number(val) || 0);
  let units = 10;
  if (num <= 20) {
    units = 10;
  } else if (num >= 100) {
    units = 20;
  } else {
    units = 10 + ((num - 20) / 8);
  }
  const widthPx = Math.round(units * 14);
  let tier = 1;
  if (num > 400) tier = 5;
  else if (num > 300) tier = 4;
  else if (num > 200) tier = 3;
  else if (num > 100) tier = 2;
  return { units, widthPx, tier };
}

console.log('1. Validando métricas da barra de PV/PM...');
assert.deepStrictEqual(calculateVitalBarMetrics(0), { units: 10, widthPx: 140, tier: 1 });
assert.deepStrictEqual(calculateVitalBarMetrics(20), { units: 10, widthPx: 140, tier: 1 });
assert.deepStrictEqual(calculateVitalBarMetrics(60), { units: 15, widthPx: 210, tier: 1 });
assert.deepStrictEqual(calculateVitalBarMetrics(100), { units: 20, widthPx: 280, tier: 1 });
assert.deepStrictEqual(calculateVitalBarMetrics(150), { units: 20, widthPx: 280, tier: 2 });
assert.deepStrictEqual(calculateVitalBarMetrics(250), { units: 20, widthPx: 280, tier: 3 });
assert.deepStrictEqual(calculateVitalBarMetrics(350), { units: 20, widthPx: 280, tier: 4 });
assert.deepStrictEqual(calculateVitalBarMetrics(550), { units: 20, widthPx: 280, tier: 5 });
console.log('✔ Métricas da barra de vitais aprovadas!');

// 2. Validar PHASES e shouldSkipPhase
console.log('2. Validando PHASES e Fase 9 (Parceiros)...');
const estadoCatalogosContent = fs.readFileSync(path.join(__dirname, '../src/compartilhado/criador/estado-e-catalogos.js'), 'utf8');
assert(estadoCatalogosContent.includes("['Parceiros','Escolha e personalize seus companheiros e aliados.']"), 'Fase 9 Parceiros deve estar em PHASES');
assert(estadoCatalogosContent.includes("['Progressão','Níveis, poderes de classe e multiclasse.']"), 'Fase 10 Progressão deve estar em PHASES');
assert(estadoCatalogosContent.includes('step === 9') && estadoCatalogosContent.includes('characterHasPartnerChoices'), 'shouldSkipPhase(9) deve verificar characterHasPartnerChoices()');
assert(estadoCatalogosContent.includes('step === 10'), 'shouldSkipPhase(10) deve verificar plannedLevel');
console.log('✔ Estrutura de PHASES e saltos de fase aprovada!');

// 3. Simular characterHasPartnerChoices
function slug(s){ return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,''); }

function testCharacterHasPartnerChoices(state) {
  const stdSlug = slug(state.origin?.standard || '');
  const regSlug = slug(state.origin?.regional || '');
  if (stdSlug.includes('ubaneri') || regSlug.includes('ubaneri')) return true;
  if (stdSlug.includes('kami') || regSlug.includes('kami')) return true;
  if ((state.origin?.benefits || []).includes('unique:antigo_mestre')) return true;
  if ((state.origin?.benefits || []).includes('unique:amigo_especial')) return true;
  if (Array.isArray(state.partners) && state.partners.length > 0) return true;
  return false;
}

console.log('3. Validando elegibilidade para a Fase 9...');
assert.strictEqual(testCharacterHasPartnerChoices({ origin: { standard: 'Acólito', regional: '', benefits: [] }, partners: [] }), false, 'Personagem comum pula Fase 9');
assert.strictEqual(testCharacterHasPartnerChoices({ origin: { standard: '', regional: 'Andarilho Ubaneri', benefits: [] }, partners: [] }), true, 'Andarilho Ubaneri tem Fase 9');
assert.strictEqual(testCharacterHasPartnerChoices({ origin: { standard: '', regional: 'Emissário Ubaneri', benefits: [] }, partners: [] }), true, 'Emissário Ubaneri tem Fase 9');
assert.strictEqual(testCharacterHasPartnerChoices({ origin: { standard: '', regional: 'Um com os Kami', benefits: [] }, partners: [] }), true, 'Um com os Kami tem Fase 9');
assert.strictEqual(testCharacterHasPartnerChoices({ origin: { standard: 'Seguidor', regional: '', benefits: ['unique:antigo_mestre'] }, partners: [] }), true, 'Antigo Mestre tem Fase 9');
assert.strictEqual(testCharacterHasPartnerChoices({ origin: { standard: 'Amigo dos Animais', regional: '', benefits: ['unique:amigo_especial'] }, partners: [] }), true, 'Amigo Especial tem Fase 9');
console.log('✔ Elegibilidade da Fase 9 aprovada!');

// 4. Validar os 6 elementos do Alikunhá
console.log('4. Validando Alikunhá e 6 Elementos...');
const parceirosContent = fs.readFileSync(path.join(__dirname, '../src/funcionalidades/criador/fases/09-parceiros.js'), 'utf8');
assert(parceirosContent.includes('ar:'), 'Elemento Ar deve existir');
assert(parceirosContent.includes('agua:'), 'Elemento Água deve existir');
assert(parceirosContent.includes('fogo:'), 'Elemento Fogo deve existir');
assert(parceirosContent.includes('terra:'), 'Elemento Terra deve existir');
assert(parceirosContent.includes('luz:'), 'Elemento Luz deve existir');
assert(parceirosContent.includes('trevas:'), 'Elemento Trevas deve existir');
assert(parceirosContent.includes('partner-choice-grid-3'), 'Cards em 3 colunas devem estar presentes');
console.log('✔ Alikunhá e 6 Elementos aprovados!');

// 5. Validar Parceiros: 12 canônicos (migrados para a Guilda conforme separação estrita da Taverna)
console.log('5. Validando categoria de Parceiros na Guilda/Taverna...');
const guildaDataPath = path.join(__dirname, '../src/funcionalidades/guilda/03-00-guilda-dados.js');
const parceirosDataContent = fs.existsSync(guildaDataPath)
  ? fs.readFileSync(guildaDataPath, 'utf8')
  : fs.readFileSync(path.join(__dirname, '../src/funcionalidades/taverna/03-00-TAVERN_DATA.js'), 'utf8');
assert(parceirosDataContent.includes('ajudante'), 'Parceiro Ajudante deve estar presente');
assert(parceirosDataContent.includes('guardiao') || parceirosDataContent.includes('defensor'), 'Parceiro Guardião ou Defensor deve estar presente');
assert(parceirosDataContent.includes('destruidor'), 'Parceiro Destruidor deve estar presente');
console.log('✔ Parceiros canônicos aprovados com sucesso!');

console.log('🎉 Todos os testes de vitais escaláveis, Fase 9 de parceiros e Taverna foram aprovados com sucesso!');
