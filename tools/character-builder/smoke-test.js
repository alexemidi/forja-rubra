const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..', '..');
const html = fs.readFileSync(path.join(root, 'Criador de Ficha T20.html'), 'utf8');
const match = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].find(entry=>entry[1].includes('const DATA ='));
assert(match, 'O script principal não foi encontrado.');

const makeNode = () => ({
  addEventListener() {},
  setAttribute(name,value) { this[name]=value; },
  classList: { add() {}, remove() {}, toggle() {} },
  textContent: '',
  innerHTML: '',
  disabled: false,
  hidden: true,
  dataset: {}
});
const nodes = new Map();
const storage = new Map();
const windowEvents = new Map();
const documentEvents=[];
const context = vm.createContext({
  console,
  Blob: class {},
  URL: { createObjectURL: () => 'blob:test', revokeObjectURL() {} },
  confirm: () => true,
  setTimeout: () => 1,
  clearTimeout() {},
  localStorage: {
    getItem: key => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: key => storage.delete(key)
  },
  document: {
    addEventListener(name,listener,capture=false) {documentEvents.push({name,listener,capture});},
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: makeNode,
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, makeNode());
      return nodes.get(id);
    }
  },
  window: { scrollTo() {}, addEventListener(name,listener) { if(!windowEvents.has(name))windowEvents.set(name,[]); windowEvents.get(name).push(listener); } }
});

const script = match[1].replace(/\nrenderStage\(\);\s*$/, '');
vm.runInContext(script, context, { filename: 'Criador de Ficha T20.html' });
const run = expression => vm.runInContext(expression, context);

assert.deepStrictEqual(
  JSON.parse(run('JSON.stringify([DATA.races.length,DATA.classes.length,DATA.origins.length,DATA.regionalOrigins.length,DATA.deities.length])')),
  [50, 33, 35, 66, 23]
);
assert.strictEqual(run('PHASES.length'), 9);
assert.strictEqual(run('PHASES[8][0]'),'Progressão');
assert(run("DATA.classPowers.some(power=>power.id==='classe_aumento_de_atributo'&&power.classeIds.includes('barbaro'))"));
assert.strictEqual(run("DATA.races.find(race=>race.id==='suraggel').habilidades.selecionadas.find(choice=>choice.id==='suraggel_heranca_substituta').opcoes.length"),23);
assert.strictEqual(run("DATA.races.find(race=>race.id==='suraggel').habilidades.selecionadas.find(choice=>choice.id==='suraggel_heranca_substituta').opcoes.find(option=>option.id==='heranca_de_werra').descricao"),'Voc\u00ea possui um conhecimento intuitivo para armas. Voc\u00ea recebe +1 em testes de ataque com armas e profici\u00eancia com armas marciais ou com duas armas ex\u00f3ticas.');
run("state=defaultState();state.identity.raceId='suraggel';state.identity.raceChoices.suraggel_linhagem='suraggel_aggelus';state.identity.raceChoices.suraggel_heranca_substituta='suraggel_heranca_original'");
assert(run("renderChoice(raceById('suraggel').habilidades.selecionadas.find(choice=>choice.id==='suraggel_heranca_substituta')).includes('Luz Sagrada')"));
assert(run("renderChoice(raceById('suraggel').habilidades.selecionadas.find(choice=>choice.id==='suraggel_heranca_substituta')).includes('Mudar heran\\u00e7a')"));
assert(!run("renderChoice(raceById('suraggel').habilidades.selecionadas.find(choice=>choice.id==='suraggel_heranca_substituta')).includes('Heran\\u00e7a de Werra')"));
run('state.identity.suraggelChangingHeritage=true');
assert(run("renderChoice(raceById('suraggel').habilidades.selecionadas.find(choice=>choice.id==='suraggel_heranca_substituta')).includes('Heran\\u00e7a de Werra')"));
const suraggelChangeHandler=documentEvents.filter(event=>event.name==='change'&&event.capture).find(event=>event.listener.toString().includes("suraggelChangingHeritage=false"));
run("state.identity.raceChoices.suraggel_heranca_substituta='heranca_de_werra'");
suraggelChangeHandler.listener({target:{dataset:{action:'race-choice',choiceId:'suraggel_heranca_substituta'},value:'heranca_de_werra'}});
assert.strictEqual(run('state.identity.raceChoices.suraggel_linhagem'),'suraggel_aggelus');
run("state=defaultState();state.identity.raceId='suraggel';state.identity.raceChoices.suraggel_heranca_substituta='heranca_de_magika';state.identity.raceChoices.suraggel_magika_atributo='car'");
assert.strictEqual(run("supplementalRaceChoiceDefinitions().some(choice=>choice.id==='suraggel_magika_atributo')"),true);
assert.strictEqual(run("spellPlan().groups.some(group=>group.id==='race:suraggel_magika'&&group.count===1&&group.type==='arcana'&&group.maxCircle===1&&group.keyAttribute==='car')"),true);
run("state.identity.raceChoices.suraggel_heranca_substituta='heranca_de_deathok';state.identity.raceChoices.suraggel_deathok_pericia_1='furtividade';state.identity.raceChoices.suraggel_deathok_pericia_2='furtividade'");
assert.strictEqual(run('duplicateSuraggelChoice()'),'furtividade');
run("state.identity.raceChoices.suraggel_deathok_pericia_2='percepcao'");
assert.strictEqual(run('duplicateSuraggelChoice()'),'');
run("state.identity.raceChoices.suraggel_heranca_substituta='heranca_de_al_gazara';state.identity.raceChoices.suraggel_al_gazara_atributo='for';state.identity.baseAttrs={for:0,des:0,con:0,int:0,sab:0,car:0}");
assert.strictEqual(run('finalAttrs().for'),1);
run("state.identity.raceChoices.suraggel_heranca_substituta='heranca_de_odisseia'");
assert.strictEqual(run('suraggelCarryingBonus()'),2);
run("state.identity.raceChoices.suraggel_heranca_substituta='heranca_de_werra';state.identity.raceChoices.suraggel_werra_proficiencia='armas_marciais'");
assert.strictEqual(run("characterProficiencies().includes('armas_marciais')"),true);
assert(run("DATA.deities.some(deity=>deity.nome==='Gwendolynn')&&DATA.deities.some(deity=>deity.nome==='Mauziell')&&DATA.deities.some(deity=>deity.nome==='Tibar')"));
assert.strictEqual(run('PHASES[2][0]'), 'Perícias');
assert.strictEqual(run('PHASES[3][0]'), 'Origens');
assert.strictEqual(run('PHASES[4][0]'), 'Divindade');
assert.strictEqual(run('PHASES[5][0]'), 'Poderes');
assert(run('DATA.classPowers.length>=662'), 'O catálogo estruturado da planilha não foi incorporado.');
assert(run("DATA.classPowers.some(power=>(power.classeIds||[]).includes('barbaro')&&power.nome==='Destruidor'&&power.preRequisitosTexto==='For 1')"));
const embeddedGrimoire = run('DATA.grimoireHtml');
// The original Grimório has old mojibake in comments. Its copy must remain intact;
// still check the character UI and all its other data for corrupt text.
const characterOnlyHtml = html.replace(JSON.stringify(embeddedGrimoire).replace(/</g, '\\u003c'), '');
assert(!characterOnlyHtml.includes('ForÃ§a'), 'Foi detectado texto com codificação corrompida.');

run(`state=defaultState();
state.identity.raceId='golem_desperto';
state.identity.raceChoices={
  golem_desperto_chassi:'golem_desperto_bronze',
  golem_desperto_fonte:'Elemental',
  golem_desperto_tamanho:'pequeno',
  golem_fonte_elemento:'agua'
};
state.identity.raceSubAttrs={golem_desperto_chassi:['con','sab']};`);
assert.deepStrictEqual(
  JSON.parse(run('JSON.stringify(raceBonuses())')),
  { for: 1, des: 1, con: 1, int: 0, sab: 1, car: -1 }
);
assert.strictEqual(run('additionalChoicesComplete()'), true);
run(`state.identity.raceChoices.golem_desperto_chassi='golem_desperto_gelo_eterno';
state.identity.raceChoices.golem_desperto_fonte='Vapor';`);
assert.strictEqual(run('additionalChoicesComplete()'), false);

run(`state=defaultState();
const arcanistChoice=classChoiceDescriptors(classById('arcanista'))[0];
state.identity.raceChoices.humano_versatil='duas_pericias';
state.identity.classChoices[arcanistChoice.id]='Feiticeiro';`);
assert.strictEqual(run('additionalChoicesComplete()'), false);
run(`state.identity.classChoices[arcanistChoice.id+'__secundaria']='linhagem_draconica';`);
assert.strictEqual(run('additionalChoicesComplete()'), false);
run(`state.identity.classChoices[arcanistChoice.id+'__tipo_dano_draconico']='fogo';`);
assert.strictEqual(run('additionalChoicesComplete()'), true);

run(`state=defaultState();
const blessedPath=classChoiceDescriptors(classById('arcanista'))[0];
state.identity.classChoices[blessedPath.id]='Feiticeiro';
state.identity.classChoices[blessedPath.id+'__secundaria']='linhagem_abencoada';`);
assert(run("renderIdentityClass().includes('Aharadak')&&renderIdentityClass().includes('Deus maior')"));
assert(run("classMissingChoices().some(item=>item.message.includes('Linhagem Abençoada'))"));
run(`state.identity.classChoices[blessedPath.id+'__deus_maior']='aharadak';`);
assert.strictEqual(run('classSelectionsComplete()'), true);

run(`state=defaultState();
state.identity.characterName='Artoniano';
state.identity.playerName='Jogador';
state.identity.baseAttrs={for:3,des:2,con:2,int:1,sab:1,car:0};
state.identity.raceAttrs=['for','des','con'];
state.identity.raceChoices.humano_versatil='duas_pericias';
const firstClassChoice=classChoiceDescriptors(classById('arcanista'))[0];
state.identity.classChoices[firstClassChoice.id]='Bruxo';`);
assert.strictEqual(run('pointSpent()'), 10);
assert.strictEqual(run('phaseIsComplete(1)'), true);
assert.strictEqual(run('phaseIsComplete(2)'), true);

assert(run("renderIdentityClass().includes('Bruxo')&&renderIdentityClass().includes('Feiticeiro')"));
run(`state.identity.classChoices[firstClassChoice.id]='Feiticeiro';`);
assert(run("renderIdentityClass().includes('Linhagem Dracônica')"));
assert(run("renderAttributesRace().includes('Base + Racial = Total')"));

run(`state=defaultState();state.identity.classId='bucaneiro';`);
assert(run('unmetAttributeRequirements().length>0'));
assert(run('unmetSkillRequirements().length>0'));
assert(run("renderAttributeMatrix().includes('prereq-unmet')"));
run(`showPrerequisiteWarning('attributes',unmetAttributeRequirements());`);
assert.strictEqual(nodes.get('warningModal').hidden, false);
assert(nodes.get('warningModalBody').innerHTML.includes('Carisma'));
run('closeWarningModal()');
assert.strictEqual(nodes.get('warningModal').hidden, true);

run(`state=defaultState();state.identity.classId='barbaro';`);
assert(run("classFutureRequirements().attrs.some(item=>item.attr==='for'&&item.value===1&&item.power==='Destruidor')"));
assert(run("renderAttributeMatrix().includes('data-attribute-id=\"for\"')&&renderAttributeMatrix().includes('prereq-unmet')"));

run(`state=defaultState();state.identity.classId='barbaro';state.identity.baseAttrs.int=1;state.skills.int=['acrobacia'];`);
assert(run("renderSkillChoices('int',SKILLS.map(item=>item[0]),1,'Perícias de Inteligência').includes('choice-exhausted')"));
assert(run("renderSkillChoices('int',SKILLS.map(item=>item[0]),1,'Perícias de Inteligência').includes('escolhas completas')"));

run(`state=defaultState();state.identity.classId='barbaro';`);
assert(run("renderSkillChoices('class',(classById('barbaro').caracteristicas.pericias.escolhas.opcoes||[]).map(item=>item.id),4,'Classe').includes('value=\"intimidacao\"')"));
assert(run("/prereq-unmet[^>]*><input[^>]*value=\"intimidacao\"|value=\"intimidacao\"[^>]*>[\\s\\S]{0,180}requisito futuro/.test(renderSkillChoices('class',(classById('barbaro').caracteristicas.pericias.escolhas.opcoes||[]).map(item=>item.id),4,'Classe'))"));
assert(!run("renderSkillChoices('int',SKILLS.map(item=>item[0]),1,'Inteligência').includes('value=\"fortitude\"')"), 'Perícia já treinada apareceu nas escolhas de Inteligência.');
run(`state.identity.raceChoices.humano_versatil='duas_pericias';state.identity.baseAttrs.int=1;`);
assert(run("renderSkillsSplit().includes('Próximas escolhas bloqueadas')"));
assert(!run("renderSkillsSplit().includes('id=\"skill-race\"')"));
run(`state.skills.class=['adestramento','atletismo','cavalgar','iniciativa'];`);
assert(run("renderSkillsSplit().includes('id=\"skill-race\"')"));
assert(!run("renderSkillsSplit().includes('id=\"skill-int\"')"));
assert(run("renderSkillChoices('race',SKILLS.map(item=>item[0]),2,'Raça').includes('prereq-unmet')&&renderSkillChoices('race',SKILLS.map(item=>item[0]),2,'Raça').includes('value=\"intimidacao\"')"));
run(`state.skills.race=['acrobacia','intimidacao'];`);
assert(run("renderSkillsSplit().includes('id=\"skill-int\"')"));
assert(run("renderSkillsSplit().indexOf('id=\"skill-race\"')<renderSkillsSplit().indexOf('id=\"skill-int\"')"));
run(`state.identity.baseAttrs.int=1;state.skills.int=[];officePending={source:'skill',group:'int'};applyOfficeChoice('alquimia');`);
assert(run("state.skills.int.includes('oficio:alquimia')"));
assert.strictEqual(run("skillRequirementMet('oficio:alquimia')"), true);
run(`state=defaultState();state.identity.raceId='osteon';state.identity.raceChoices.osteon_memoria_postuma='pericia_treinada';`);
assert.strictEqual(run('raceSkillSlots()'), 1);
assert(run("renderRacePanel().includes('Memória Póstuma')&&renderRacePanel().includes('Perícia treinada')"));

run(`state=defaultState();state.origin.standard=DATA.origins[0].nome;state.origin.previewBenefit=originBenefitOptions(selectedStandardOrigin())[0]?.id||'';`);
assert(run("renderOrigins().includes('origin-benefit-button')"));
assert(run("renderOrigins().includes('Itens da origem')&&renderOrigins().includes('origin-standard-layout')"));
run(`state.identity.classId='barbaro';state.origin.standard='Escravo';`);
assert(run("/origin-benefit-button[^>]*disabled[^>]*><strong>Fortitude<\\/strong><small>Perícia já treinada\.<\\/small>/.test(renderOrigins())"));
run(`state.origin.standard='Acólito';`);
assert(run("renderOrigins().includes(originBenefitDescription(originBenefitOptions(selectedStandardOrigin()).find(item=>item.type==='power')))"));

run(`state=defaultState();state.identity.baseAttrs.for=0;`);
assert.strictEqual(run("generalPowerEligibility(powerById('ataque_poderoso')).ok"), false);
run(`state.identity.baseAttrs.for=1;`);
assert.strictEqual(run("generalPowerEligibility(powerById('ataque_poderoso')).ok"), true);
assert.deepStrictEqual(JSON.parse(run('JSON.stringify(POWER_CATEGORY_ORDER)')), ['combate','destino','magia','concedido','tormenta','raca','grupo']);
assert(run("renderGeneralPowerBrowser(1).indexOf('Poderes de Combate')<renderGeneralPowerBrowser(1).indexOf('Poderes de Destino')"));

run(`state=defaultState();state.identity.classId='arcanista';state.identity.raceId='humano';state.deity.mode='devout';`);
assert.strictEqual(run("deityAccepts(DATA.deities.find(item=>item.nome==='Allihanna'))"), false);
assert.strictEqual(run("deityAccepts(DATA.deities.find(item=>item.nome==='Thwor'))"), true);
assert(run("renderDeity().includes('Escolha pelo poder concedido')"));
assert(!run("renderDeity().includes('Divindades disponíveis')"));
assert(run("renderDeity().includes('deity-power-heading')&&renderDeity().includes('data-deity=')"));
assert(run("renderDeityPowerDetail('Compreender os Ermos','Allihanna').includes('Esse deus não te aceita como devoto, mas se você rezar muito insistindo (e com a permissão do mestre)... Talvez ele te aceite.')"));
assert(run("renderDeityPowerDetail('Compreender os Ermos','Allihanna').includes('deity-confirm-preview')"));
assert(!run("renderDeityPowerDetail('Compreender os Ermos','Allihanna').includes('deity-candidate')"));

// Confirmação inline: registra a escolha restrita e protege fichas com dois espaços.
run(`state=defaultState();state.step=5;state.deity.mode='devout';`);
assert.strictEqual(run("commitDeityPower('Allihanna','Compreender os Ermos')"), true);
assert.strictEqual(run('state.deity.name'), 'Allihanna');
assert.strictEqual(run('phaseIsComplete(5)'), true);
run(`state=defaultState();state.step=5;state.identity.classId='clerigo';state.deity.mode='devout';`);
assert.strictEqual(run("commitDeityPower('Allihanna','Compreender os Ermos')"), true);
assert.strictEqual(run('state.deity.activePowerIndex'), 1);
assert.strictEqual(run("commitDeityPower('Allihanna','Compreender os Ermos')"), false);
assert.strictEqual(run('phaseIsComplete(5)'), false);
assert.strictEqual(run("commitDeityPower('Allihanna','Descanso Natural')"), true);
assert.strictEqual(run('phaseIsComplete(5)'), true);
assert.strictEqual(run("commitDeityPower('Allihanna','Afinidade com a Tormenta')"), false);
assert.strictEqual(run('phaseIsComplete(5)'), true);
run(`state.deity.power='Compreender os Ermos|Compreender os Ermos';`);
assert.strictEqual(run('phaseIsComplete(5)'), false);
assert(run("deityMissingChoices().some(item=>item.title==='Poder repetido')"));
assert(run('grantedPowerPairs().every(pair=>pair.data)'), 'Há cartões concedidos sem associação ao catálogo.');
assert(run("grantedPowerData('Tropas Duyshidakk').descricao.includes('1d4+1 goblinoides')"));
run(`state.deity.name='Nimb';state.deity.power='';`);
assert(run("renderDeity().includes('Descrição ainda não localizada no catálogo de poderes concedidos.')"), 'Descrições ausentes precisam ficar explicitamente identificadas.');
assert(!html.includes('deityRestrictionModal'), 'A janela antiga de advertência ainda foi gerada.');

run(`DATA.races.forEach(race=>{
  state=defaultState();
  state.identity.raceId=race.id;
  renderAttributesRace();
  renderPowers();
});
DATA.classes.forEach(characterClass=>{
  state=defaultState();
  state.identity.classId=characterClass.id;
  renderIdentityClass();
  renderSkillsSplit();
  renderSummary();
});`);

assert.strictEqual(run('DATA.spells.length'), 256);
assert(embeddedGrimoire.includes('id="condicoesView"'), 'As condições do Grimório foram perdidas.');
assert(embeddedGrimoire.includes('Ver magia completa'));
for(const script of embeddedGrimoire.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(script[1]);
const spellReset = (classId='arcanista',raceId='humano',path='Bruxo') => run(`spellCatalogUI.schoolReview=null;spellCatalogUI.section='magias';state=defaultState();state.identity.classId=${JSON.stringify(classId)};state.identity.raceId=${JSON.stringify(raceId)};state.identity.classChoices={arcanista_caminho_do_arcanista:${JSON.stringify(path)}};spellState();`);
spellReset();
run('renderSpellChoices()');
assert.deepStrictEqual(JSON.parse(run('JSON.stringify(grimoireContext().traditions)')),['arcana']);
assert.strictEqual(run('spellPlan().groups[0].count'),3);
assert(run("chooseCharacterSpell(spellPlan().groups[0].id,'adaga-mental')"));
assert(!run("chooseCharacterSpell(spellPlan().groups[0].id,'curar-ferimentos')"));
assert(!run("chooseCharacterSpell(spellPlan().groups[0].id,'bola-de-fogo')"));
assert(run("chooseCharacterSpell(spellPlan().groups[0].id,'alarme')"));
assert(run("chooseCharacterSpell(spellPlan().groups[0].id,'armadura-arcana')"));
assert(!run("chooseCharacterSpell(spellPlan().groups[0].id,'seta-infaliVel')"));
assert(run('phaseIsComplete(7)'));
assert.strictEqual(run('spellPlan().classes[0].schoolCount'),0,'Arcanistas não escolhem escolas de magia.');
assert.strictEqual(run('allLearnedSpellIds().length'),3);
const persistedSpellState=run('JSON.stringify(state)');
run(`state=JSON.parse(${JSON.stringify(persistedSpellState)});normalizeState();`);
assert.strictEqual(run('allLearnedSpellIds().length'),3);
run("state.identity.classId='clerigo'");
assert.strictEqual(run('allLearnedSpellIds().length'),0,'Magias arcanas vazaram ao trocar de classe.');
assert(run("chooseCharacterSpell(spellPlan().groups[0].id,'curar-ferimentos')"));

spellReset('bardo');
assert.strictEqual(run('spellPlan().classes[0].schoolCount'),3);
assert(run("chooseCharacterSpell(spellPlan().groups[0].id,'adaga-mental')"));
assert.deepStrictEqual(JSON.parse(run('JSON.stringify(state.spells.schools.bardo)')),['encantamento']);
assert(run("chooseCharacterSpell(spellPlan().groups[0].id,'enfeiticar')"));
assert(!run('phaseIsComplete(7)'));
assert(run('spellMissingChoices().every(item=>item.message && item.selector)'), 'O aviso precisa ter mensagem e destino para rolar a tela.');
assert(run("chooseSpellSchool('bardo','ilusao')"));
assert(run("chooseSpellSchool('bardo','abjuracao')"));
assert(!run("chooseSpellSchool('bardo','evocacao')"));
assert(!run("chooseSpellSchool('bardo','encantamento')"),'Uma escola com magias não pode ser removida.');
assert(run('phaseIsComplete(7)'));
assert(!run("basicSpellAllowed(spellById('explosao-de-chamas'),spellPlan().groups[0],spellPlan())"));
run("state.identity.raceId='qareen'");
assert(run("chooseCharacterSpell('race:qareen_tatuagem_mistica','explosao-de-chamas')"),'A magia racial deve ignorar as escolas da classe.');
assert(run("chooseCharacterSpell('race:qareen_tatuagem_mistica','explosao-de-chamas')"));
assert(run("chooseCharacterSpell('race:qareen_tatuagem_mistica','adaga-mental')"),'Duas fontes distintas podem conceder a mesma magia.');

for(const classId of ['magimarcialista','druida','ermitao']){spellReset(classId);assert.strictEqual(run('spellPlan().classes[0].schoolCount'),3,classId+' deve escolher três escolas.');}
spellReset('mistico');assert.strictEqual(run('spellPlan().classes[0].schoolCount'),1);assert.deepStrictEqual(JSON.parse(run('JSON.stringify(spellPlan().classes[0].fixedSchools)')),['evocacao']);
for(const path of ['Bruxo','Mago','Feiticeiro']){spellReset('arcanista','humano',path);assert.strictEqual(run('spellPlan().classes[0].schoolCount'),0,path+' não deve escolher escolas.');}
spellReset('arcanista','humano','Mago');
assert.strictEqual(run('spellPlan().groups[0].count'),4);
assert.strictEqual(run('spellPlan().classes[0].schoolCount'),0,'Magos não escolhem escolas de magia.');
run("['adaga-mental','alarme','armadura-arcana','explosao-de-chamas'].forEach(id=>chooseCharacterSpell(spellPlan().groups[0].id,id))");
assert(run('phaseIsComplete(7)'),'Memorização não pode ser uma escolha obrigatória.');
assert(!run("renderSpellChoices().includes('data-action=\"spell-memorize\"')"));
assert(run("renderSpellChoices().includes('Você memoriza e pode lançar 2 magias dentre as conhecidas.')"));
assert(!run("renderSpellChoices('sources').includes('Adaga Mental')"),'O quadro de fonte não deve repetir as magias aprendidas.');
assert(run('phaseIsComplete(7)'));

spellReset('arcanista','humano','Feiticeiro');
run("state.identity.classChoices.linhagem='linhagem_abencoada'");
assert.strictEqual(run("spellPlan().groups.find(group=>group.id.startsWith('lineage:')).count"),1);
assert(run("chooseCharacterSpell(spellPlan().groups[0].id,'curar-ferimentos')"));
assert(run("chooseCharacterSpell(spellPlan().groups.find(group=>group.id.startsWith('lineage:')).id,'abencoar-alimentos')"));

for(const classId of ['arcanista','clerigo']){
  spellReset(classId);
  run("state.deity={mode:'devout',name:'Wynna',power:'Teurgista Místico'}");
  assert.strictEqual(run('spellPlan().groups[0].count'),2);
  const native=classId==='arcanista'?['adaga-mental','alarme']:['curar-ferimentos','abencoar-alimentos'];
  const opposite=classId==='arcanista'?'curar-ferimentos':'adaga-mental';
  assert(!run(`chooseCharacterSpell(spellPlan().groups.find(group=>group.teurgist).id,${JSON.stringify(opposite)})`),'Teurgista deve esperar as escolhas nativas.');
  run(`${JSON.stringify(native)}.forEach(id=>chooseCharacterSpell(spellPlan().groups[0].id,id))`);
  assert(run("spellState().activeGroup.startsWith('teurgist:')"));
  assert(!run("basicSpellAllowed(DATA.spells.find(spell=>spell.type==='universal'&&spell.circle===1),spellPlan().groups.find(group=>group.teurgist),spellPlan())"));
  assert(run(`chooseCharacterSpell(spellPlan().groups.find(group=>group.teurgist).id,${JSON.stringify(opposite)})`));
  assert(run('phaseIsComplete(7)'));
  assert.strictEqual(run('allLearnedSpellIds().length'),3);
  const types=JSON.parse(run('JSON.stringify(grimoireContext().traditions)'));
  assert.deepStrictEqual(types,[classId==='arcanista'?'divina':'arcana']);
}

spellReset('usurpador');
run('renderSpellChoices()');
assert.strictEqual(run('allLearnedSpellIds().length'),0);
assert(run('grimoireContext().visible.length>0'));
assert.deepStrictEqual(JSON.parse(run('JSON.stringify(grimoireContext().circles)')),[1]);
assert(!run("grimoireContext().visible.includes('adaga-mental')"));
assert.strictEqual(run('grimoireContext().selectable.length'),0);
assert(run('phaseIsComplete(7)'));
assert(!run("knowsCharacterSpell('curar-ferimentos')"));
assert(!run("generalPowerEligibility({id:'test_known',nome:'Teste',categoria:'magia',preRequisitosTexto:'conhecer a magia Curar Ferimentos'}).ok"));
run("state.identity.raceId='qareen';chooseCharacterSpell('race:qareen_tatuagem_mistica','curar-ferimentos')");
assert(run("knowsCharacterSpell('curar-ferimentos')"));
assert(run("generalPowerEligibility({id:'test_known',nome:'Teste',categoria:'magia',preRequisitosTexto:'conhecer a magia Curar Ferimentos'}).ok"));

for(const [classId,level,circle] of [['arcanista',5,2],['clerigo',5,2],['bardo',5,1],['bardo',6,2],['druida',6,2]]){
  spellReset(classId);run(`state.identity.plannedLevel=${level}`);
  assert.strictEqual(run('Math.max(...spellPlan().groups.map(group=>group.maxCircle))'),1,'Nível planejado não deve liberar círculos na criação inicial.');
  run('state.spells.progression=true');
  assert.strictEqual(run('Math.max(...spellPlan().groups.map(group=>group.maxCircle))'),circle);
}
run(`DATA.races.forEach(race=>{state=defaultState();state.identity.raceId=race.id;renderSpells()});DATA.classes.forEach(cls=>{state=defaultState();state.identity.classId=cls.id;renderSpells();spellMissingChoices()});`);
spellReset();run('state.step=7;renderSpellChoices()');
const frameWindow={postMessage() {}};
context.document.getElementById('spellGrimoire').contentWindow=frameWindow;
const bridgeListener=event=>windowEvents.get('message').forEach(listener=>listener(event));
const payload=JSON.parse(run("JSON.stringify({...grimoireContext(),type:'choose',id:'adaga-mental'})"));
bridgeListener({source:{},data:payload});
assert.strictEqual(run('allLearnedSpellIds().length'),0,'Mensagem de outra janela não pode alterar a ficha.');
bridgeListener({source:frameWindow,data:{...payload,session:-100}});
assert.strictEqual(run('allLearnedSpellIds().length'),0,'Uma sessão antiga não pode alterar a ficha.');
bridgeListener({source:frameWindow,data:payload});
assert(run("knowsCharacterSpell('adaga-mental')"));
spellReset();
assert.strictEqual(run('spellCatalogTitle()'),'Escolha 3 magias');
const compactLayout=run('renderSpells()');
assert(compactLayout.includes('class="spell-topbar"'));
assert(compactLayout.indexOf('id="spellControls"')<compactLayout.indexOf('id="spellGrimoire"'));
assert(!compactLayout.includes('Seleção e consulta'));
assert(!compactLayout.includes('spellFrameHint'));
assert(run('DATA.spells.every(spell=>spell.books.length>0)'),'Os filtros de livros devem usar os livros do catálogo original.');
run("chooseCharacterSpell(spellPlan().groups[0].id,'adaga-mental')");
assert.strictEqual(run('spellCatalogTitle()'),'Escolha 3 magias','O título informa o total, não os espaços restantes.');
spellReset('arcanista','humano','Mago');
assert.strictEqual(run('spellCatalogTitle()'),'Escolha 4 magias');
spellReset('arcanista','humano','Bruxo');
run("state.deity={mode:'devout',name:'Wynna',power:'Teurgista Místico'}");
assert.strictEqual(run('spellCatalogTitle()'),'Escolha 3 magias','Teurgista divide as escolhas sem aumentar o total.');
spellReset('barbaro','qareen');
assert.strictEqual(run('spellCatalogTitle()'),'Escolha 1 magia');
spellReset('barbaro','dahllan');
assert.strictEqual(run('spellCatalogTitle()'),'Consultar magias','Magias recebidas não são escolhas.');
spellReset('barbaro');
assert.strictEqual(run('spellCatalogTitle()'),'Consultar magias');
run("spellCatalogUI.section='condicoes'");
assert.strictEqual(run('spellCatalogTitle()'),'Condições');
assert.strictEqual(run('grimoireContext().section'),'condicoes');
run("spellCatalogUI.section='magias';state.spells.view='learned'");
assert.strictEqual(run('spellCatalogTitle()'),'Magias do personagem');
assert(run("toggleSpellBook('basico')"));
assert(!run("grimoireContext().books.includes('basico')"));
assert(!run("toggleSpellBook('livro_inexistente')"));
assert(run("toggleSpellBook('basico')"));
assert(run("grimoireContext().books.includes('basico')"));
console.log('Smoke test concluído: 9 fases e ficha final separada, 50 raças, 33 classes e 256 magias; progressão, escolas, tradições, círculos, Teurgista, Usurpador, memorização e persistência verificados.');
spellReset('bardo');
run("['adaga-mental','alarme'].forEach(id=>chooseCharacterSpell(spellPlan().groups[0].id,id));chooseSpellSchool('bardo','necromancia');state.step=7;notifySchoolCompletion()");
assert.deepStrictEqual(JSON.parse(run('JSON.stringify(spellState().schools.bardo)')),['encantamento','abjuracao','necromancia']);
assert.strictEqual(nodes.get('spellSchoolModal').hidden,false);
assert.strictEqual(nodes.get('spellSchoolModal').dataset.mode,'notice');
assert(nodes.get('spellSchoolBody').innerHTML.includes('Encantamento, Abjuração, Necromancia'));
run("closeSchoolDialog();notifySchoolCompletion()");
assert.strictEqual(nodes.get('spellSchoolModal').hidden,true,'A confirmação não deve se repetir a cada renderização.');
assert(!run("basicSpellAllowed(spellById('explosao-de-chamas'),spellPlan().groups[0],spellPlan())"));
run('state.identity.plannedLevel=6;state.spells.progression=true');
assert(!run("basicSpellAllowed(spellById('bola-de-fogo'),spellPlan().groups.find(group=>group.maxCircle===2),spellPlan())"),'O bloqueio de escola continua na progressão.');
const schoolsSave=run('JSON.stringify(state)');
run(`state=JSON.parse(${JSON.stringify(schoolsSave)});normalizeState();spellPlan()`);
assert.deepStrictEqual(JSON.parse(run('JSON.stringify(state.spells.lockedSchools.bardo)')),['encantamento','abjuracao','necromancia']);

spellReset('bardo');
run("['adaga-mental','enfeiticar'].forEach(id=>chooseCharacterSpell(spellPlan().groups[0].id,id));chooseSpellSchool('bardo','abjuracao');state.step=7;renderSpellChoices()");
assert.strictEqual(run('pendingSchoolClass().classId'),'bardo');
let blockedNext=false;
for(const listener of windowEvents.get('click')||[])listener({target:{closest:selector=>selector==='#nextButton'?{}:null},preventDefault(){},stopImmediatePropagation(){blockedNext=true}});
assert(blockedNext,'Continuar deve abrir a escolha da escola antes do aviso genérico.');
assert.strictEqual(nodes.get('spellSchoolModal').dataset.mode,'choose');
assert(nodes.get('spellSchoolBody').innerHTML.includes('data-school="evocacao"'));
assert(!nodes.get('spellSchoolBody').innerHTML.includes('data-school="encantamento"'));
assert(run("startSchoolReview('bardo')"));
const review=JSON.parse(run('JSON.stringify(grimoireContext())'));
assert.deepStrictEqual(review.circles,[1,2,3,4,5]);
assert.deepStrictEqual(review.traditions,['arcana']);
assert.strictEqual(review.mode,'school-review');
assert(!review.visible.includes('adaga-mental'));
assert(!review.visible.includes('alarme'));
assert(!review.visible.includes('curar-ferimentos'));
assert(review.visible.includes('bola-de-fogo'));
assert(review.visible.some(id=>run(`spellById(${JSON.stringify(id)}).circle`)===5));
assert.strictEqual(review.selectable.length,0);
assert(!review.replaceable.includes('bola-de-fogo'));
assert(review.replaceable.includes('explosao-de-chamas'));
const beforeInvalid=run('JSON.stringify(state.spells.selections)');
run("handleSchoolBridgeMessage({type:'choose',id:'bola-de-fogo'})");
run("handleSchoolBridgeMessage({type:'replace-preview',id:'bola-de-fogo'})");
assert.strictEqual(run('JSON.stringify(state.spells.selections)'),beforeInvalid);
assert.strictEqual(run('spellCatalogUI.schoolReview.candidate'),'');
run("handleSchoolBridgeMessage({type:'replace-preview',id:'explosao-de-chamas'})");
assert.strictEqual(run('JSON.stringify(state.spells.selections)'),beforeInvalid,'Escolher a candidata ainda não pode alterar as magias.');
assert.strictEqual(run('grimoireContext().mode'),'school-replace');
assert(run("grimoireContext().replaceable.includes('enfeiticar')"));
assert(!run("replaceCharacterSpell('race:qareen_tatuagem_mistica','enfeiticar','explosao-de-chamas')"));
run("handleSchoolBridgeMessage({type:'replace-confirm',id:'enfeiticar',candidate:'explosao-de-chamas'})");
assert.strictEqual(run('allLearnedSpellIds().length'),2);
assert(run("knowsCharacterSpell('explosao-de-chamas')"));
assert(!run("knowsCharacterSpell('enfeiticar')"));
assert.deepStrictEqual(JSON.parse(run('JSON.stringify(state.spells.schools.bardo)')),['encantamento','evocacao','abjuracao']);
assert.strictEqual(run('spellCatalogUI.schoolReview'),null);
assert.strictEqual(nodes.get('spellSchoolModal').dataset.mode,'notice');
assert(run('phaseIsComplete(7)'));
run("handleSchoolBridgeMessage({type:'learned-view'})");
assert(run("grimoireContext().visible.includes('adaga-mental')"));
assert(run("grimoireContext().chosen.includes('adaga-mental')"));
run("handleSchoolBridgeMessage({type:'choose',id:'adaga-mental'})");
assert(!run("knowsCharacterSpell('adaga-mental')"));
assert.strictEqual(run('spellState().schools.bardo.length'),2,'Remover a última magia da escola libera apenas essa escola para troca.');

spellReset('bardo','qareen');
run("chooseCharacterSpell('race:qareen_tatuagem_mistica','curar-ferimentos');chooseCharacterSpell(spellPlan().groups[0].id,'adaga-mental')");
assert.deepStrictEqual(JSON.parse(run('JSON.stringify(state.spells.schools.bardo)')),['encantamento']);
assert(!run("renderSpellChoices('sources').includes('Adaga Mental')"));
assert(!run("renderSpellChoices('sources').includes('Curar Ferimentos')"));
console.log('School flow test concluído: registro automático, confirmação central, escolas restantes, leitura futura, substituição atômica e isolamento racial.');

// Flow migration preserves the meaning of saved phases and all previous choices.
assert.deepStrictEqual(JSON.parse(run('JSON.stringify(migrateCreationLayout({layoutVersion:3,step:3,completed:[1,2,3,5]}))')),{layoutVersion:4,step:4,completed:[1,2,4,5]});
assert.strictEqual(run('migrateCreationLayout({layoutVersion:3,step:4,completed:[]}).step'),3);
assert.strictEqual(run('defaultState().layoutVersion'),4);
run("state=defaultState();state.step=4;state.skills={class:['atletismo'],race:['percepcao'],int:['conhecimento']}");
let propagationStopped=false;
for(const event of documentEvents.filter(event=>event.name==='change'&&event.capture)){
  event.listener({target:{dataset:{field:'standardOrigin'},value:'Escravo'},stopImmediatePropagation(){propagationStopped=true}});
  if(propagationStopped)break;
}
assert(propagationStopped,'A mudança de origem deve substituir o handler antigo que apaga os treinos.');
assert.deepStrictEqual(JSON.parse(run('JSON.stringify(state.skills)')),{class:['atletismo'],race:['percepcao'],int:['conhecimento']});
assert.strictEqual(run('state.origin.standard'),'Escravo');
assert(run("originBenefitBlocked({type:'skill',name:'Atletismo'})"));

run("state=defaultState();state.identity.raceChoices.humano_versatil='uma_pericia_um_poder';state.identity.baseAttrs.for=1;state.powers.previewId='ataque_poderoso';state.powers.previewPending=true");
assert(run('generalPowerSlots()>0'));
assert(run("powerMissingChoices().some(item=>item.title==='Confirmar poder'&&item.selector.includes('power-select')&&item.message.includes('Confirmar'))"));
run('state.powers.previewPending=false');
assert(!run("powerMissingChoices().some(item=>item.title==='Confirmar poder')"),'Uma prévia automática não deve ser tratada como escolha explícita.');

// A fully prepared mundane level-1 character may export, but a planned level 4
// with unassigned class powers must not expose Exportar ficha or finish the flow.
run(`state=defaultState();state.step=9;state.finished=true;state.identity.characterName='Teste';state.identity.playerName='Teste';
state.identity.classId='barbaro';state.identity.raceId='anao';state.identity.baseAttrs={for:3,des:2,con:2,int:0,sab:2,car:0};
state.skills.class=classById('barbaro').caracteristicas.pericias.escolhas.opcoes.map(option=>option.id).filter(id=>!mandatoryClassSkills().includes(id)&&id!=='oficio').slice(0,skillChoiceLimits().class);
state.origin.standard='Acólito';state.origin.benefits=originBenefitOptions(selectedStandardOrigin()).filter(option=>!originBenefitBlocked(option)&&option.name!=='Ofício').slice(0,2).map(option=>option.id);arsenalState().complete=true;`);
assert.deepStrictEqual(JSON.parse(run('JSON.stringify([1,2,3,4,5,6,7].map(phaseIsComplete))')),[true,true,true,true,true,true,true]);
assert.strictEqual(run('canExportCharacter()'),true);
run('renderStage()');assert.strictEqual(nodes.get('exportButton').hidden,false);
assert.strictEqual(nodes.get('phaseNav').hidden,true);
assert(nodes.get('stageRoot').innerHTML.includes('Novo personagem')&&nodes.get('stageRoot').innerHTML.includes('Mudar personagem')&&nodes.get('stageRoot').innerHTML.includes('Renomear personagem')&&nodes.get('stageRoot').innerHTML.includes('Apagar personagem')&&nodes.get('stageRoot').innerHTML.includes('Grim\u00f3rio')&&nodes.get('stageRoot').innerHTML.includes('Loja'));
run("state.sheetView='grimoire';spellState().view='learned'");
assert.strictEqual(run('grimoireContext().visible.length'),256);assert.strictEqual(run('grimoireContext().selectable.length'),0);assert.strictEqual(run("grimoireContext().view"),'learned');
run("state.sheetView='sheet'");
run('state.step=8;arsenalState().complete=false;renderStage()');assert.strictEqual(nodes.get('exportButton').hidden,true);
run('state.finished=false;state.step=9;state.identity.plannedLevel=4;renderStage()');
assert.strictEqual(run('progressionMissingChoices().length'),3);
assert.strictEqual(run('canExportCharacter()'),false);
assert.strictEqual(run('phaseIsComplete(9)'),false);
assert.strictEqual(nodes.get('exportButton').hidden,true);
assert(run("missingChoices(9).some(item=>item.selector==='[data-action=\"class-power-preview\"][data-index=\"1\"]')"));
run("state.progression[1].powerId='poder_inexistente'");assert.strictEqual(run('progressionMissingChoices().length'),3);
assert(html.includes('id="saveStatus" hidden'));
assert(html.includes("catalog.get(entry.itemId)?.equipamento?.itemVestido?worn:carried"));
assert(!html.includes("pdfSetText(form,'Defesa'"));
assert(!html.includes("pdfSetText(form,'Acrobacia'"));
assert.strictEqual(nodes.get('footerMessage').hidden,true);
console.log('Creation flow test concluído: fases migradas, perícias preservadas, seleção vs confirmação e exportação protegida por pendências.');

spellReset('bardo','qareen');
run(`state.step=7;const sourceClass=spellPlan().groups.find(group=>group.kind==='class').id;
chooseCharacterSpell(sourceClass,'adaga-mental');chooseCharacterSpell(sourceClass,'alarme');chooseSpellSchool('bardo','ilusao');`);
assert.strictEqual(run('spellState().activeGroup'),'race:qareen_tatuagem_mistica','A classe completa deve avançar imediatamente para a tatuagem.');
assert(run("grimoireContext().repeatable.includes('adaga-mental')"));
assert(!run("grimoireContext().removable['adaga-mental']"),'A tatuagem não pode remover a magia da classe.');
run("chooseCharacterSpell('race:qareen_tatuagem_mistica','adaga-mental')");
assert(run("groupSpellIds(spellPlan().groups.find(group=>group.id===sourceClass)).includes('adaga-mental')"));
assert(run("grimoireContext().repeatNotes['adaga-mental'].includes('1 PM')"));
run("chooseCharacterSpell('race:qareen_tatuagem_mistica','adaga-mental')");
assert(run("knowsCharacterSpell('adaga-mental')"),'Remover o aprendizado racial preserva o aprendizado da classe.');
assert.strictEqual(run('spellState().schools.bardo.length'),3,'Remoção racial não muda escolas da classe.');
run('spellState().activeGroup=sourceClass;spellState().view="available"');
assert(run("grimoireContext().visible.includes('explosao-de-chamas')"),'Todas as escolas deve permitir consultar outra escola.');
assert(!run("grimoireContext().selectable.includes('explosao-de-chamas')"),'Consultar não autoriza aprender fora das escolas.');
run("chooseCharacterSpell(sourceClass,'alarme')");
assert(!run("spellState().schools.bardo.includes('abjuracao')"));
assert(run("spellState().schools.bardo.includes('encantamento')&&spellState().schools.bardo.includes('ilusao')"));
assert(run("grimoireContext().selectable.includes('explosao-de-chamas')"),'Após desfazer a escola, uma nova escola pode ocupar o espaço.');
console.log('Fontes de magia verificadas: avanço automático, reaprendizado racial isolado, consulta sem autorização e desfazer de escola.');

run("state=defaultState();state.identity.raceId='anao';state.identity.classId='barbaro';state.step=6;renderStage()");
assert.strictEqual(run('state.step'),8,'Sem poderes a escolher nem fontes de magia, segue para os itens.');
run("state.step=7;creationNavigationDirection=-1;renderStage()");
assert.strictEqual(run('state.step'),5,'Voltar também deve atravessar etapas vazias.');
run("creationNavigationDirection=1;state=defaultState();state.identity.raceChoices.humano_versatil='uma_pericia_um_poder';state.step=6;renderStage()");
assert.strictEqual(run('state.step'),6,'Escolha racial impede pular a fase de poderes.');
spellReset('arcanista','qareen');run('state.step=7;renderStage()');assert.strictEqual(run('state.step'),7);

run("state=defaultState();state.identity.characterName='Teste Arsenal';state.identity.baseAttrs.for=3;state.step=8;renderStage()");
const embeddedArsenal=nodes.get('characterArsenal').srcdoc;
assert(embeddedArsenal.includes('Teste Arsenal'));
assert(!embeddedArsenal.includes('/*__ARSENAL_STATE__*/'));
assert(embeddedArsenal.includes('<header class="site-header" hidden aria-hidden="true" style="display:none!important">'));
for(const script of embeddedArsenal.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(script[1]);
assert(run("!DATA.arsenalShopHtml && DATA.arsenalHtml.includes('embedded-shop-actions')"));
const embeddedShop=run('DATA.arsenalHtml').replace('/*__ARSENAL_STATE__*/','{}');
for(const script of embeddedShop.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(script[1]);
const arsenalWindow={};nodes.get('characterArsenal').contentWindow=arsenalWindow;
const arsenalPayload={channel:'forja-arsenal-v1',session:run('arsenalSession'),type:'save',storage:{'arsenal-arton-cart-v1':'[{"itemId":"adaga","quantity":1}]'}};
bridgeListener({source:{},data:arsenalPayload});assert.strictEqual(run('Object.keys(arsenalState().storage).length'),0);
bridgeListener({source:arsenalWindow,data:arsenalPayload});assert(run("arsenalState().storage['arsenal-arton-cart-v1'].includes('adaga')"));
run('renderStage()');assert(nodes.get('characterArsenal').srcdoc.includes('adaga'));
assert.strictEqual(run("JSON.parse(arsenalInitialData().storage['arsenal-arton-character-profiles-v1']).profiles[0].strength"),3);
let scrolledTo='';
nodes.get('skill-race')?.scrollIntoView;
context.document.getElementById('skill-race').scrollIntoView=()=>{scrolledTo='race'};
context.document.getElementById('skill-int').scrollIntoView=()=>{scrolledTo='int'};
run("state=defaultState();state.step=3;state.identity.raceChoices.humano_versatil='duas_pericias';state.identity.baseAttrs.int=1;state.skills.class=Array(skillChoiceLimits().class).fill('atletismo');scrollToNextSkillGroup('class')");
assert.strictEqual(scrolledTo,'race');
run("state.skills.race=['percepcao','sobrevivencia'];scrollToNextSkillGroup('race')");assert.strictEqual(scrolledTo,'int');
console.log('Navegação e Arsenal verificados: saltos condicionais, rolagem de perícias, HTML válido e armazenamento isolado.');
assert(run("renderArsenal().includes('Escolha uma arma simples (Opcional)')"));
assert(!run("renderArsenal().includes('Itens recebidos pela origem')"));
assert(run("DATA.arsenalHtml.includes('catalog-list-entry')&&DATA.arsenalHtml.includes('initialChoice.category')"));
assert(run("DATA.arsenalHtml.includes('sortSelect')"));
assert(run("DATA.arsenalHtml.includes('Selecionar item')"));
assert(run("DATA.arsenalHtml.includes(\"selectedCandidate?.itemId===item.id\")"));
assert(run("DATA.arsenalHtml.includes('Remover seleção')"));
assert(run("DATA.arsenalHtml.includes(\"state.specific='convencional'\")"));
assert(run("DATA.arsenalHtml.includes('!isSpecificMagicItem(item)&&!isLiturgicalItem(item)')"));
run("state=defaultState();state.identity.classId='arcanista'");assert.deepStrictEqual(JSON.parse(run("JSON.stringify(initialItemPlan().map(item=>item.id))")),['simple']);
run("state=defaultState();state.identity.classId='arcanista';state.origin.standard='Amigo dos Animais'");assert.deepStrictEqual(JSON.parse(run("JSON.stringify(initialItemPlan()[0].names)")),['Cão de Caça','Cavalo','Pônei','Trobo']);assert.strictEqual(run("automaticStartingItems().some(name=>name.includes('Cão de caça'))"),false);
run("state=defaultState();state.identity.classId='arcanista';state.origin.standard='Batedor'");assert.strictEqual(run("initialItemPlan()[0].combat"),'a_distancia');assert.deepStrictEqual(JSON.parse(run("JSON.stringify(initialItemPlan()[0].categories)")),['simples','marcial']);
run("state=defaultState();state.identity.classId='arcanista';state.origin.standard='Amnésico'");assert.strictEqual(run("initialItemPlan()[0].maxPrice"),500);
run("state=defaultState();state.identity.classId='barbaro'");assert.deepStrictEqual(JSON.parse(run("JSON.stringify(initialItemPlan().map(item=>item.id))")),['simple','martial','armor']);
assert(!run("initialItemPlan().find(item=>item.id==='armor').names.includes('Brunea')"));assert(run("automaticStartingItems().includes('Escudo Leve')"));
run("state.identity.classId='guerreiro';delete state.arsenal");assert(run("initialItemPlan().find(item=>item.id==='armor').names.includes('Brunea')"));
run("state.identity.classId='arcanista';delete state.arsenal");assert(!run("initialItemPlan().some(item=>item.id==='armor')"));
run("state.identity.classId='necromante';delete state.arsenal");assert(!run("initialItemPlan().some(item=>item.id==='armor')"));
assert(run("automaticStartingItems().includes('Mochila')&&automaticStartingItems().includes('Saco de Dormir')&&automaticStartingItems().includes('Traje de Viajante')"));
assert(run("DATA.arsenalHtml.includes(\"message.source||'initial'\")"),'A escolha de origem deve manter sua procedência no inventário.');
assert(run("renderSpellControls().includes('Refazer escolhas')"));
assert(run("DATA.races.find(race=>race.id==='duende').habilidades.selecionadas.find(choice=>choice.id==='duende_tabu').opcoes[8].nome.startsWith('Carrega sempre consigo')"));
assert.strictEqual(run("DATA.races.find(race=>race.id==='duende').habilidades.selecionadas.find(choice=>choice.id==='duende_presentes').opcoes.find(option=>option.id==='Maldição').subEscolhas.find(choice=>choice.id==='duende_maldicao_efeito').opcoes.length"),5);
run("state=defaultState();state.identity.raceId='duende';state.powers.raceGroups.duende_presentes=['Afinidade Elemental','Encantar Objetos','Enfeitiçar'];state.identity.plannedLevel=2;state.progression=[{classId:'barbaro',powerId:''},{classId:'barbaro',powerId:''}]");assert(run("progressionRaceOptions(1).some(power=>power.nome==='Invisibilidade')"));
run("state=defaultState();state.step=8;renderStage()");
assert.strictEqual(nodes.get('nextButton').textContent,'Pular escolha →');
const initialChoiceWindow={postMessage(){}};nodes.get('characterArsenal').contentWindow=initialChoiceWindow;
const choiceSession=run('arsenalSession');
bridgeListener({source:initialChoiceWindow,data:{channel:'forja-arsenal-v1',session:choiceSession,type:'candidate',itemId:'adaga',itemName:'Adaga',options:{}}});
assert.strictEqual(nodes.get('nextButton').textContent,'Confirmar escolha →');assert.strictEqual(run('state.arsenal.pending.itemId'),'adaga');
bridgeListener({source:initialChoiceWindow,data:{channel:'forja-arsenal-v1',session:choiceSession,type:'operation',operationId:'test-choice',kind:'initial',grants:['choice:simple'],storage:{'arsenal-arton-character-profiles-v1':'{}'}}});
assert.strictEqual(run('state.step'),8);
bridgeListener({source:initialChoiceWindow,data:{channel:'forja-arsenal-v1',session:choiceSession,type:'operation',operationId:'test-final',kind:'initial',finalize:true,storage:{'arsenal-arton-character-profiles-v1':'{}'}}});
assert.strictEqual(run('state.step'),8);assert.strictEqual(run('state.arsenal.complete'),true);
assert(run("renderArsenal().includes('Itens adquiridos')"));assert.strictEqual(nodes.get('nextButton').textContent,'Continuar →');
assert(run('arsenalInitialData().choice===null'),'Uma fase concluída precisa abrir a mochila, não reconstruir o catálogo de escolha.');
assert(run("DATA.arsenalHtml.includes('🏪 Comprar itens')"));
assert(run("DATA.arsenalHtml.includes('🔨 Fabricar')&&DATA.arsenalHtml.includes(\"source:'craft'\")"));
assert.strictEqual(run("(()=>{const previous=state;state=defaultState();state.skills.int=['oficio:armeiro'];const enabled=craftingCapabilities().enabled;state=previous;return enabled})()"),true);
assert(run("DATA.arsenalHtml.includes('body.initial-equipment-review .load-panel{grid-template-columns:1fr!important}')"));
assert(!run("DATA.arsenalHtml.includes('initial-equipment-review .backpack-header-actions,')"),'Lista/Cards e Esvaziar mochila devem continuar visíveis.');
run('renderStage()');const reviewWindow={postMessage(){}};nodes.get('characterArsenal').contentWindow=reviewWindow;const reviewSession=run('arsenalSession');
bridgeListener({source:reviewWindow,data:{channel:'forja-arsenal-v1',session:reviewSession,type:'open-shop'}});
assert.strictEqual(run('arsenalShopOpen'),true);assert(nodes.get('characterArsenal').srcdoc.includes('embedded-shop-actions'));
const shopWindow={postMessage(){}};nodes.get('characterArsenal').contentWindow=shopWindow;const shopSession=run('arsenalSession');
bridgeListener({source:shopWindow,data:{channel:'forja-arsenal-v1',session:shopSession,type:'close-shop'}});
assert.strictEqual(run('arsenalShopOpen'),false);assert(nodes.get('characterArsenal'));
const arsenalNextHandler=documentEvents.filter(event=>event.name==='click'&&event.capture).find(event=>event.listener.toString().includes("state.step!==8")).listener;
arsenalNextHandler({target:{closest:selector=>selector==='#nextButton'?{}:null},preventDefault(){},stopImmediatePropagation(){}});
assert.strictEqual(run('state.step'),9);
assert.strictEqual(run('STARTING_FUNDS[11]'),19000);
run("state.finances={startingLevel:11,levelOneTibars:0,spent:1000}");assert.strictEqual(run('startingFunds()'),19000);assert.strictEqual(run('remainingFunds()'),18000);
run("state.step=9;state.identity.plannedLevel=11;state.identity.editingLevel=1;arsenalShopOpen=false;renderStage()");assert.strictEqual(nodes.get('nextButton').textContent,'Finalizar ficha');
spellReset('arcanista','qareen');
run("chooseCharacterSpell(spellPlan().groups.find(group=>group.kind==='class').id,'adaga-mental');chooseCharacterSpell('race:qareen_tatuagem_mistica','adaga-mental')");
assert.strictEqual(nodes.get('toast').textContent,'Reduz o custo da magia em 1 PM.');
spellReset('bardo','satiro');
run("const classGroup=spellPlan().groups.find(group=>group.kind==='class');['adaga-mental','alarme','amedrontar'].forEach(id=>chooseCharacterSpell(classGroup.id,id))");
assert.strictEqual(run('spellState().view'),'learned');
assert(run("spellCatalogTitle()==='Você pode lançar:'"));
assert(run("allLearnedSpellIds().includes('sono')&&allLearnedSpellIds().includes('adaga-mental')"));
run("state=defaultState();state.identity.classId='nobre';state.identity.plannedLevel=4;state.identity.baseAttrs={for:0,des:0,con:1,int:3,sab:-1,car:7};state.skills.class=['luta','nobreza'];ensureProgression()");
assert.strictEqual(run('characterDefenseAttribute()'),'car','Autoconfiança deve trocar DES por CAR na Defesa.');
assert.strictEqual(run("weaponPassiveStats(DATA.pdfItems.find(item=>item.id==='adaga')).attack"),4,'A adaga deve usar o teste de Luta sem o bônus do espadim.');
assert.strictEqual(run("weaponPassiveStats(DATA.pdfItems.find(item=>item.id==='adaga')).damage"),'1d4');
assert.strictEqual(run("weaponPassiveStats(DATA.pdfItems.find(item=>item.id==='espadim')).attack"),5,'Nobreza treinada deve conceder +1 no ataque com espadim.');
assert.strictEqual(run("weaponPassiveStats(DATA.pdfItems.find(item=>item.id==='espadim')).damage"),'1d8+1');
run("state=defaultState();state.identity.raceId='qareen';state.identity.raceChoices.qareen_resistencia_elemental='fogo'");
assert(run("pdfInitialFeatureText().includes('Resistência Elemental (RD fogo 10)')"));
assert(run("pdfInitialFeatureText().includes('Desejos (–1 PM em magia pedida)')"));
run("state=defaultState();state.identity.raceId='duende';state.identity.duendeTabuPenalty='–5 em Iniciativa'");
assert.strictEqual(run('passiveCharacterEffects().skillBonuses.iniciativa'),undefined,'A sugestão por descumprimento não deve virar uma penalidade passiva permanente.');
assert(run("renderChoice(DATA.races.find(race=>race.id==='duende').habilidades.selecionadas.find(choice=>choice.id==='duende_tabu')).includes('Se descumprir, sugestão:')"));
assert(run("DUENDE_TABOO_SUGGESTIONS[11].includes('Diplomacia ou Atuação')"));
assert(run("DATA.generalPowers.some(power=>Array.isArray(power.efeitos)&&power.efeitos.length)"),'Os efeitos estruturados dos poderes gerais devem chegar ao criador.');
console.log('Efeitos verificados: Autoconfiança, armas do Zahir, poderes gerais e sugestões de descumprimento do tabu.');
