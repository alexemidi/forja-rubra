const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));

const powers = readJson('backup-jsons/poderes_gerais.json');
const classPowers = readJson('backup-jsons/poderes_classe.json');
const classes = readJson('backup-jsons/classes_full.json');
const classReference = readJson('backup-jsons/referencia_poderes_classe.json');
const workbookClassCatalog = readJson('tools/vba-import-raw-powers/classes_txt_import.json');
const normalizedId = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

const structuredClassPowers = (classPowers.poderesClasseCatalogoGlobal || []).map(({ id, classeIds, livroOrigemId, nome, descricao, preRequisitosTexto }) => ({
  id, classeIds, livroOrigemId, nome, descricao, preRequisitosTexto
}));
const workbookClassPowers = (workbookClassCatalog.poderesCatalogo || []).map(({ id, classeIds, nome, descricao, preReqResumo }) => ({
  id,
  classeIds,
  livroOrigemId: classes.find(characterClass => (classeIds || []).includes(characterClass.id))?.livroOrigemId || '',
  nome,
  descricao,
  preRequisitosTexto: preReqResumo || ''
}));
const workbookPowerIds = new Set(workbookClassPowers.map(power => power.id));
const legacyOnlyClassPowers = structuredClassPowers.filter(power => !workbookPowerIds.has(power.id) && !workbookClassPowers.some(candidate =>
  (candidate.classeIds || []).some(classId => (power.classeIds || []).includes(classId)) && normalizedId(candidate.nome) === normalizedId(power.nome)
));
// Use the actual Grimório, including its full cards, tooltips and improvements.
// The sandboxed embedded copy has its own bridge; the standalone file is untouched.
const grimoireSource = fs.readFileSync(path.join(root, 'grimorio.html'), 'utf8');
const spellCatalog = Array.from(grimoireSource.matchAll(/<div class="card"\s+([\s\S]*?)>\s*<div class="card-header">[\s\S]*?<h3 class="card-title">([^<]+)<\/h3>/g), match => {
  const attr = name => (match[1].match(new RegExp('data-' + name + '="([^"]*)"')) || [])[1] || '';
  return { id: attr('spell-key'), name: match[2], type: attr('tipo'), circle: Number(attr('circulo')), school: attr('escola'), books: (attr('livros') || attr('livro') || 'basico').split(/[\s,;|]+/).filter(Boolean) };
});
if (!spellCatalog.length || spellCatalog.some(spell => !spell.id || !spell.circle) || new Set(spellCatalog.map(spell => spell.id)).size !== spellCatalog.length) throw new Error('Catálogo de magias inválido no Grimório.');
const bridge = fs.readFileSync(path.join(__dirname, 'grimoire-bridge.js'), 'utf8');
const grimoireHtml = grimoireSource.replace('</body>', () => '<script>\n' + bridge + '\n</script>\n</body>');
const arsenalSource = fs.readFileSync(path.join(root,'Arsenal de Arton.html'),'utf8')
  // Keep the controls in the DOM because the Arsenal script references them, but
  // hide its standalone header before the embedded document is first painted.
  .replace('<header class="site-header">','<header class="site-header" hidden aria-hidden="true" style="display:none!important">');
const embeddedArsenalBase = arsenalSource.replace(/\blocalStorage\b/g,'forjaArsenalStorage').replace('<script>', () => '<script>\n'+fs.readFileSync(path.join(__dirname,'arsenal-storage-bridge.js'),'utf8')+'\n</script>\n<script>');
const data = {
  arsenalHtml: embeddedArsenalBase.replace('</head>', () => '<style>'+fs.readFileSync(path.join(__dirname,'arsenal-embedded.css'),'utf8')+'</style></head>').replace('</body>', () => '<script>\n'+fs.readFileSync(path.join(__dirname,'arsenal-bridge.js'),'utf8')+'\n</script>\n</body>'),
  spells: spellCatalog,
  grimoireHtml,
  races: readJson('backup-jsons/races_update.json'),
  classes,
  origins: readJson('backup-jsons/origens.json').origens,
  regionalOrigins: readJson('backup-jsons/origem_regional.json').origens_regionais,
  deities: readJson('backup-jsons/deuses.json').deuses,
  classPowers: [...workbookClassPowers, ...legacyOnlyClassPowers],
  classInheritance: Object.fromEntries(classReference.classes.filter(item => item.varianteDaClasseId).map(item => [item.classeId, item.varianteDaClasseId])),
  generalPowers: Object.values(powers.poderes || {}).flat().map(({ id, nome, categoria, livroOrigemId, preRequisitosTexto, descricao, deusesIds, racasTexto }) => ({
    id, nome, categoria, livroOrigemId, preRequisitosTexto, descricao, deusesIds, racasTexto
  }))
};

const templatePath = path.join(__dirname, 'character-assistant.template.html');
const outputPath = path.join(root, 'Criador de Ficha T20.html');
const template = fs.readFileSync(templatePath, 'utf8');
const marker = '/*__T20_DATA__*/';
if (!template.includes(marker)) throw new Error('Marcador de dados não encontrado no template.');
if (!template.includes('/*__T20_SPELL_INTEGRATION__*/')) throw new Error('Marcador de integração com o Grimório não encontrado no template.');
if (!template.includes('/*__T20_SPELL_STYLES__*/')) throw new Error('Marcador de estilos do Grimório não encontrado no template.');
const spellIntegration = ['spell-integration.js','spell-school-flow.js','creation-flow.js','arsenal-integration.js'].map(file=>fs.readFileSync(path.join(__dirname,file),'utf8')).join('\n');
const spellLayout = fs.readFileSync(path.join(__dirname, 'spell-layout.css'), 'utf8');
const output = template.replace(marker, () => 'const DATA = ' + JSON.stringify(data).replace(/</g, '\\u003c') + ';')
  .replace('/*__T20_SPELL_STYLES__*/', () => spellLayout)
  .replace('/*__T20_SPELL_INTEGRATION__*/', () => spellIntegration);
fs.writeFileSync(outputPath, output, 'utf8');
console.log(JSON.stringify({ output: outputPath, bytes: Buffer.byteLength(output), counts: {
  races: data.races.length,
  classes: data.classes.length,
  origins: data.origins.length,
  regionalOrigins: data.regionalOrigins.length,
  deities: data.deities.length,
  classPowers: data.classPowers.length,
  generalPowers: data.generalPowers.length,
  spells: data.spells.length
} }));
