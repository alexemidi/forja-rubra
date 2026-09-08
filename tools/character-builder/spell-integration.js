// Character-bound spell choices. Rules come from the local class/race/power data;
// explicit adapters below cover grants whose source only has prose, not effects.
const SPELL_SCHOOLS = {abjuracao:'Abjuração',adivinhacao:'Adivinhação',convocacao:'Convocação',encantamento:'Encantamento',evocacao:'Evocação',ilusao:'Ilusão',necromancia:'Necromancia',transmutacao:'Transmutação'};
// Exceções futuras podem ser registradas aqui; o padrão vem de escolasEscolha.
const PROJECT_SCHOOL_LIMITS = {};
const spellById = id => DATA.spells.find(spell => spell.id === id);
const spellKey = name => slug(name).replace(/_/g,'-');
function spellState(){
  if(!state.spells || typeof state.spells !== 'object')state.spells={};
  const value=state.spells;
  for(const key of ['selections','schools','manualSchools','lockedSchools','schoolAnnouncements'])if(!value[key]||typeof value[key]!=='object'||Array.isArray(value[key]))value[key]={};
  if(!Array.isArray(value.memorized))value.memorized=[];
  value.activeGroup=String(value.activeGroup||'');
  value.view=value.view==='learned'?'learned':'available';
  return value;
}
function spellPath(){return ['bruxo','mago','feiticeiro'].find(path=>Object.values(state.identity.classChoices).some(value=>slug(value)===path))||''}
function spellLineage(){return ['linhagem_abencoada','linhagem_feerica','linhagem_draconica','linhagem_rubra'].find(id=>Object.values(state.identity.classChoices).some(value=>slug(value)===id))||''}
function spellCircleAt(effect,level){
  const progression=effect.progressaoCirculo;
  if(Array.isArray(progression))return Math.max(Number(effect.circuloInicial||1),...progression.filter(row=>level>=row.nivel).map(row=>Number(row.circulo)));
  return Math.min(5,Number(effect.circuloInicial||1)+(progression?.intervaloNiveis?Math.floor((level-1)/progression.intervaloNiveis):0));
}
function activeSpellTraits(){
  const traits=[...(raceById(state.identity.raceId)?.habilidades?.fixas||[])];
  allRaceChoiceDefinitions().forEach(def=>{const option=chosenRaceTraitOption(def);if(option)traits.push(option,...(option.habilidades||[]))});
  racePowerGroups().forEach(group=>(state.powers.raceGroups[group.id]||[]).forEach(id=>{
    const option=group.options.find(item=>choiceId(item)===id);
    if(!option)return;
    traits.push(option,...(option.habilidades||[]));
    (option.subEscolhas||[]).forEach(def=>{const sub=chosenRaceTraitOption(def);if(sub)traits.push(sub)});
  }));
  return traits;
}
function activeSpellPowers(){
  const names=new Set([...originPowerNames(),...(state.deity.mode==='devout'?String(state.deity.power||'').split('|'):[])].map(slug));
  return DATA.generalPowers.filter(power=>state.powers.general.includes(power.id)||names.has(slug(power.nome)));
}
function spellPlan(){
  const groups=[],notes=[],classes=[],saved=spellState(),powers=activeSpellPowers(),powerIds=new Set(powers.map(power=>power.id));
  const add=(id,label,description,options={})=>{
    const group=Object.assign({id,label,description,count:0,maxCircle:1,type:'any',schools:[],fixed:[],allowed:[],scope:id,kind:'grant'},options);
    group.fixed=group.fixed.map(spellKey);
    group.allowed=group.allowed.map(spellKey);
    groups.push(group);return group;
  };
  const planned=saved.progression?Math.max(1,Number(state.identity.plannedLevel)||1):1;
  const levels=state.progression.length?state.progression.slice(0,planned):[{classId:state.identity.classId}];
  while(levels.length<planned)levels.push({classId:state.identity.classId});
  // The initial class is authoritative even before the summary initializes progression.
  levels[0]={...levels[0],classId:state.identity.classId};
  for(const classId of new Set(levels.map(row=>row.classId))){
    const cls=classById(classId),level=levels.filter(row=>row.classId===classId).length;
    const ability=(cls?.habilidades||[]).find(h=>(h.efeitos||[]).some(e=>e.tipo==='conjuracao'));
    if(!ability)continue;
    const effect=ability.efeitos.find(e=>e.tipo==='conjuracao'),path=classId==='arcanista'?spellPath():'',lineage=classId==='arcanista'?spellLineage():'';
    let fixedSchools=[...(effect.escolasFixas||[])];
    if(effect.escolaPorAfinidade){
      const options=(cls.habilidades.flatMap(h=>h.escolhas||[]).find(choice=>choice.id==='elemento')?.opcoes||[]);
      const affinity=options.find(option=>Object.values(state.identity.classChoices).includes(option.id));
      if(affinity)fixedSchools.push(affinity.escolaMagia);
    }
    const schoolCount=Number(PROJECT_SCHOOL_LIMITS[classId]??effect.escolasEscolha??0),chosenSchools=[...new Set((saved.schools[classId]||[]).filter(id=>SPELL_SCHOOLS[id]&&!fixedSchools.includes(id)))].slice(0,schoolCount);
    const schools=[...fixedSchools,...chosenSchools];
    const info={classId,name:cls.nome,level,path,lineage,effect,schoolCount,fixedSchools,chosenSchools,schools,description:ability.descricao};
    classes.push(info);
    const common={classId,scope:'class:'+classId,kind:'class',path,lineage,type:effect.magiaTipo,schools,schoolCount,schoolOpen:chosenSchools.length<schoolCount,blockedSchools:classId==='necromante'?['encantamento']:[]};
    if(effect.escolaPorAfinidade && fixedSchools.length!==2)common.schoolReady=false;
    if(classId==='arcanista'&&!path)notes.push({blocking:true,description:'Defina o Caminho do Arcanista na fase Identidade e classe antes de escolher suas magias.'});
    if(effect.magiasIniciaisFixas?.length)add('fixed:class:'+classId,cls.nome+' · recebidas',ability.descricao,{...common,fixed:effect.magiasIniciaisFixas,maxCircle:5,kind:'fixed'});
    if(classId==='usurpador')add('consult:usurpador','Usurpar · acesso sem aprendizado',(cls.habilidades.find(h=>h.id==='usurpador_usurpar')||ability).descricao,{...common,kind:'consult',maxCircle:spellCircleAt(effect,level)});
    for(let n=1;n<=level;n++){
      const frequency=effect.aprendeMagia?.frequencia||(classId==='frade'?'todo_nivel':'nenhuma');
      let count=n===1?Number(effect.magiasIniciais??effect.magiasIniciaisEscolha??0):frequency==='todo_nivel'?1:frequency==='nivel_par'&&n%2===0?1:0;
      if(path==='feiticeiro'&&n>1)count=n%2===1?1:0;
      if(path==='mago'&&n===1)count++;
      const newCircle=n===1||spellCircleAt(effect,n)>spellCircleAt(effect,n-1);
      const teurgist=powerIds.has('teurgista_mistico')&&count>0&&newCircle;
      if(teurgist)count--;
      if(count)add('class:'+classId+':'+path+':'+n,cls.nome+' · nível '+n,ability.descricao,{...common,count,maxCircle:spellCircleAt(effect,n)});
      if(path==='mago'&&n>1&&spellCircleAt(effect,n)>spellCircleAt(effect,n-1))add('circle:'+classId+':'+n,'Mago · novo círculo no nível '+n,'Ao ganhar acesso a um novo círculo, o mago aprende uma magia adicional daquele círculo.',{...common,count:1,maxCircle:spellCircleAt(effect,n),exactCircle:spellCircleAt(effect,n)});
      if(teurgist)add('teurgist:'+classId+':'+spellCircleAt(effect,n),'Teurgista Místico · '+spellCircleAt(effect,n)+'º círculo',powers.find(power=>power.id==='teurgista_mistico').descricao,{...common,count:1,type:effect.magiaTipo==='arcana'?'divina':'arcana',exclusiveType:true,teurgist:true,maxCircle:spellCircleAt(effect,n),exactCircle:spellCircleAt(effect,n)});
    }
    if(lineage){
      const source=cls.habilidades.flatMap(h=>h.escolhas||[]).flatMap(choice=>choice.escolhas_secundarias||[]).find(choice=>choice.id===lineage);
      const basic=source?.estagios?.find(stage=>stage.id==='basica');
      (basic?.efeitos||[]).filter(e=>e.tipo==='aprender_magia').forEach((e,i)=>add('lineage:'+lineage+':'+i,source.nome+' · herança básica',basic.descricao,{count:e.quantidade||1,maxCircle:e.circulo||1,type:Array.isArray(e.magiaTipo)?'any':e.magiaTipo||'any',schools:e.escolas||[],scope:'class:'+classId}));
    }
    levels.forEach((row,index)=>{
      if(row.classId!==classId||!row.powerId)return;
      const power=DATA.classPowers.find(p=>p.id===row.powerId);
      if(!power)return;
      const atLevel=levels.slice(0,index+1).filter(row=>row.classId===classId).length;
      if(slug(power.nome)==='conhecimento_magico')add('power:class:'+index,power.nome+' · nível '+(index+1),power.descricao,{...common,count:2,maxCircle:spellCircleAt(effect,atLevel)});
      else if(/magia|círculo/i.test(power.descricao))notes.push({label:power.nome,description:power.descricao});
    });
  }
  const racialRules={
    dahllan_amiga_das_plantas:{fixed:['Controlar Plantas']},
    qareen_tatuagem_mistica:{count:1},
    sereia_tritao_cancao_dos_mares:{count:2,allowed:['Amedrontar','Comando','Despedaçar','Enfeitiçar','Hipnotismo','Sono']},
    satiro_instrumentista_magico:{fixed:['Amedrontar','Enfeitiçar','Hipnotismo','Sono']},
    silfide_magia_das_fadas:{count:2,allowed:['Criar Ilusão','Enfeitiçar','Luz','Sono']},
    suraggel_luz_sagrada:{fixed:['Luz']},suraggel_sombras_profanas:{fixed:['Escuridão']},
    moreau_coruja:{count:1,schools:['adivinhacao']},
    invisibilidade:{fixed:['Invisibilidade']}
  };
  activeSpellTraits().forEach(trait=>{
    const key=slug(trait.id||trait.nome),rule=racialRules[key];
    if(rule){add('race:'+key,trait.nome,trait.descricao,{...rule,maxCircle:rule.fixed?5:1});return}
    if(state.identity.raceId==='duende'&&['agua','fogo','vegetacao'].includes(key)){
      const fixed={agua:['Criar Elementos','Névoa'],fogo:['Criar Elementos','Explosão de Chamas'],vegetacao:['Armamento da Natureza','Controlar Plantas']}[key];
      add('race:duende:'+key,'Afinidade Elemental · '+trait.nome,trait.descricao,{fixed,maxCircle:5});return;
    }
    if(/magia|lançar/i.test(trait.descricao||''))notes.push({label:trait.nome,description:trait.descricao});
  });
  const powerRules={
    centelha_magica:{count:1},grande_marca_de_wynna:{count:1},glamour:{count:3},glamour_maior:{count:3,maxCircle:2},
    chamado_monstruoso:{fixed:['Conjurar Monstro']},dedo_verde:{fixed:['Controlar Plantas']},dom_da_profecia:{fixed:['Augúrio']},
    farsa_do_fingidor:{fixed:['Criar Ilusão']},manto_ardiloso:{fixed:['Disfarce Ilusório']},manto_da_penumbra:{fixed:['Escuridão']},
    mestre_dos_mares:{fixed:['Acalmar Animal']},olhar_amedrontador:{fixed:['Amedrontar']},palavra_de_poder:{fixed:['Comando']},
    palavras_de_bondade:{fixed:['Enfeitiçar']},transmissao_da_loucura:{fixed:['Sussurros Insanos']},trilha_desimpedida:{fixed:['Caminhos da Natureza']},voz_da_natureza:{fixed:['Acalmar Animal']},
    foco_em_magia:{count:1,kind:'reference',maxCircle:5},especializacao_em_magia:{count:1,kind:'reference',maxCircle:5}
  };
  powers.forEach(power=>{
    const rule=powerRules[power.id];
    if(rule)add('power:'+power.id,power.nome,power.descricao,{maxCircle:rule.fixed?5:1,...rule});
    else if(/magia|lançar/i.test(power.descricao||''))notes.push({label:power.nome,description:power.descricao});
  });
  const plan={groups,classes,notes,powerIds};
  reconcileSpellSchools(plan);
  return plan;
}
function groupSpellIds(group){return group.fixed.length?group.fixed:[...new Set((spellState().selections[group.id]||[]).filter(id=>typeof id==='string'))]}
function knowsCharacterSpell(id){return allLearnedSpellIds().includes(spellKey(id))}
function allLearnedSpellIds(plan=spellPlan()){
  return [...new Set(plan.groups.filter(group=>!['reference','consult'].includes(group.kind)).flatMap(group=>groupSpellIds(group).filter(id=>group.fixed.length||basicSpellAllowed(spellById(id),group,plan)&&teurgistUnlocked(group,plan))))].filter(id=>spellById(id));
}
function hasNonClassSpellSource(plan=spellPlan()){
  return plan.groups.some(group=>!group.classId&&!['reference','consult'].includes(group.kind)&&(group.count||group.fixed.length));
}
function advanceSpellSourceAfterChoice(current,plan=spellPlan()){
  const saved=spellState();
  const nextClass=plan.groups.find(group=>group.kind==='class'&&group.count&&groupSpellIds(group).length<group.count);
  if(nextClass){saved.activeGroup=nextClass.id;saved.view='available';return}
  const nextGrant=plan.groups.find(group=>group.kind!=='class'&&!['reference','consult'].includes(group.kind)&&group.count&&!group.fixed.length&&groupSpellIds(group).length<group.count);
  if(nextGrant){saved.activeGroup=nextGrant.id;saved.view='available';toast('Escolha a magia de '+nextGrant.label+'.');return}
  if(hasNonClassSpellSource(plan)){
    saved.activeGroup=plan.groups.find(group=>!group.classId&&!['reference','consult'].includes(group.kind))?.id||current.id;
    saved.view='learned';toast('Você pode lançar as magias exibidas em Aprendidas.');
  }
}
function basicSpellAllowed(spell,group,plan){
  if(!spell||spell.circle>group.maxCircle||group.exactCircle&&spell.circle!==group.exactCircle)return false;
  if(group.kind==='reference'&&!allLearnedSpellIds(plan).includes(spell.id))return false;
  if(group.id==='power:especializacao_em_magia'&&!(spellState().selections['power:foco_em_magia']||[]).includes(spell.id))return false;
  if(group.allowed.length&&!group.allowed.includes(spell.id))return false;
  if(group.schoolReady===false || group.blockedSchools?.includes(spell.school))return false;
  if(group.schools.length&&!group.schools.includes(spell.school)&&!group.schoolOpen)return false;
  if(group.kind==='class'&&group.classId==='arcanista'&&!group.path)return false;
  if(group.exclusiveType)return spell.type===group.type;
  if(group.type==='any'||spell.type==='universal'||spell.type===group.type)return true;
  if(group.classId==='necromante'&&spell.school==='necromancia')return true;
  if(group.lineage==='linhagem_abencoada'&&spell.type==='divina'&&spell.circle===1)return true;
  if(group.kind==='class'&&group.type==='divina'&&((plan.powerIds.has('caricia_sombria')&&spell.id==='toque-vampirico')||(plan.powerIds.has('sopro_do_mar')&&spell.id==='sopro-das-uivantes')))return true;
  return false;
}
function teurgistUnlocked(group,plan){
  if(!group.teurgist)return true;
  return plan.groups.filter(other=>other.classId===group.classId&&other.kind==='class'&&!other.teurgist&&other.maxCircle<=group.maxCircle).every(other=>groupSpellIds(other).length===other.count&&groupSpellIds(other).every(id=>!spellSelectionReason(id,other,plan)));
}
function spellSelectionReason(id,group,plan=spellPlan()){
  const spell=spellById(id);
  if(!teurgistUnlocked(group,plan))return 'Escolha primeiro as magias da tradição da sua classe. Teurgista Místico é a última escolha do círculo.';
  if(!basicSpellAllowed(spell,group,plan))return 'Esta magia não atende ao círculo, à tradição ou às escolas desta escolha.';
  if(plan.groups.some(other=>other.id!==group.id&&other.scope===group.scope&&groupSpellIds(other).includes(id)))return 'Esta magia já foi aprendida por esta mesma fonte.';
  return '';
}
function spellMissingChoices(){
  const plan=spellPlan(),missing=[];
  plan.notes.filter(note=>note.blocking).forEach(note=>missing.push({text:note.description,target:'#spellChoices'}));
  plan.classes.forEach(cls=>{
    if(cls.chosenSchools.length!==cls.schoolCount)missing.push({text:cls.name+': escolha '+cls.schoolCount+' escola(s) de magia.',target:'[data-spell-schools="'+cls.classId+'"]'});
    if(cls.effect.escolaPorAfinidade&&cls.fixedSchools.length!==2)missing.push({text:cls.name+': escolha a Afinidade na fase Identidade e classe.',target:'#spellChoices'});
  });
  plan.groups.forEach(group=>{
    if(group.kind==='consult')return;
    const ids=groupSpellIds(group);
    if(group.fixed.length){if(ids.some(id=>!spellById(id)))missing.push({text:'Magia recebida ausente no Grimório: '+group.label+'.',target:'#spellChoices'});return}
    const valid=ids.filter(id=>!spellSelectionReason(id,group,plan));
    if(ids.length!==group.count||valid.length!==group.count)missing.push({text:group.label+': escolha '+group.count+' magia(s) válida(s); '+valid.length+' selecionada(s).',target:'[data-spell-group="'+group.id+'"]'});
  });
  plan.classes.filter(cls=>cls.classId==='necromante').forEach(cls=>{
    const ids=plan.groups.filter(group=>group.classId===cls.classId).flatMap(groupSpellIds),needed=Math.ceil(ids.length/2);
    if(ids.map(spellById).filter(spell=>spell?.school==='necromancia').length<needed)missing.push({text:'Necromante: ao menos metade das magias aprendidas deve ser de necromancia ('+needed+').',target:'#spellChoices'});
  });
  return missing.map(item=>({title:'Magias do personagem',message:item.text,selector:item.target}));
}
function classSpellChoicesFilled(classId,plan){return plan.groups.filter(group=>group.classId===classId&&group.count).every(group=>groupSpellIds(group).length===group.count)}
function chooseSpellSchool(classId,id){
  const plan=spellPlan(),cls=plan.classes.find(cls=>cls.classId===classId);
  if(!cls||!SPELL_SCHOOLS[id]||!cls.schoolCount||cls.fixedSchools.includes(id))return false;
  if(spellState().lockedSchools[classId]?.length===cls.schoolCount){toast('As escolas desta classe já foram definidas.');return false}
  const list=cls.chosenSchools;
  if(list.includes(id)){
    const inUse=plan.groups.filter(group=>group.classId===classId).some(group=>groupSpellIds(group).some(key=>spellById(key)?.school===id));
    if(inUse){toast('Essa escola tem magias escolhidas. Remova essas magias antes de trocar a escola.');return false}
    spellState().manualSchools[classId]=(spellState().manualSchools[classId]||[]).filter(value=>value!==id);
  }else{
    if(list.length>=cls.schoolCount)return false;
    spellState().manualSchools[classId]=[...(spellState().manualSchools[classId]||[]),id];
  }
  spellPlan();
  state.completed=state.completed.filter(step=>step!==7);return true;
}
function mageSpellIds(plan){return [...new Set(plan.groups.filter(group=>group.classId==='arcanista'&&group.path==='mago').flatMap(groupSpellIds))].filter(id=>spellById(id))}
function chooseCharacterSpell(groupId,id){
  const plan=spellPlan(),group=plan.groups.find(group=>group.id===groupId);
    if(!group||group.fixed.length||!group.count)return false;
  const saved=spellState(),list=groupSpellIds(group),selected=list.includes(id);
  if(selected){saved.selections[groupId]=list.filter(value=>value!==id);saved.memorized=saved.memorized.filter(value=>value!==id)}
  else {
    const reason=spellSelectionReason(id,group,plan);
    if(reason){toast(reason);return false}
    if(list.length>=group.count){toast('Esta escolha já está completa. Remova uma magia para trocar.');return false}
    saved.selections[groupId]=[...list,id];
    spellPlan();
    if(group.teurgist)toast('Magia de outra tradição registrada por Teurgista Místico.');
    if(saved.selections[groupId].length===group.count){
      const updated=spellPlan(),next=updated.groups.find(other=>other.classId===group.classId&&other.teurgist&&teurgistUnlocked(other,updated)&&groupSpellIds(other).length<other.count);
      if(next)saved.activeGroup=next.id;
      else advanceSpellSourceAfterChoice(group,updated);
    }
  }
  state.completed=state.completed.filter(step=>step!==7);
  spellPlan();
  return true;
}
function renderSpellChoices(part='all'){
  const plan=spellPlan(),saved=spellState();
  if(!plan.groups.some(group=>group.id===saved.activeGroup))saved.activeGroup=plan.groups.find(group=>group.count)?.id||plan.groups[0]?.id||'';
  const schools=plan.classes.filter(cls=>cls.schoolCount||cls.fixedSchools.length).map(cls=>{
    const complete=classSpellChoicesFilled(cls.classId,plan),remaining=cls.schoolCount-cls.chosenSchools.length;
    return '<div class="spell-school-summary" data-spell-schools="'+cls.classId+'"><span class="help">'+esc(cls.name)+' · escolas '+cls.schools.length+'/'+(cls.schoolCount+cls.fixedSchools.length)+'</span><div class="tag-row">'+cls.schools.map(id=>'<span class="tag gold">'+SPELL_SCHOOLS[id]+(cls.fixedSchools.includes(id)?' · fixa':'')+'</span>').join('')+'</div>'+(complete&&remaining?'<button type="button" class="button" data-action="school-open" data-class-id="'+cls.classId+'">Completar '+remaining+' escola(s)</button>':'')+'</div>';
  }).join('');
  const sources=plan.groups.map(group=>{
    const ids=groupSpellIds(group),fixed=group.fixed.length>0;
    return '<section class="spell-source '+(saved.activeGroup===group.id?'active':'')+'" data-spell-group="'+group.id+'"><div class="spell-source-heading"><button type="button" class="button" data-action="spell-source" data-group="'+group.id+'" aria-pressed="'+(saved.activeGroup===group.id)+'">'+esc(group.label)+'</button><span class="tag '+(fixed||ids.length===group.count?'green':'gold')+'">'+(fixed?'Recebidas':group.kind==='consult'?'Consulta':ids.length+'/'+group.count)+'</span></div><div class="spell-source-meta"><p class="help">'+(fixed?'Concedidas pela habilidade.':group.kind==='reference'?'Entre magias conhecidas':(group.type==='arcana'?'Arcanas':group.type==='divina'?'Divinas':'Arcanas ou divinas')+' · '+(group.exactCircle?'somente '+group.exactCircle+'º círculo':'até '+group.maxCircle+'º círculo'))+'</p><details class="spell-rule"><summary>Regra da habilidade</summary><p>'+esc(group.description)+'</p></details></div></section>';
  }).join('');
  const mageCount=plan.groups.filter(group=>group.classId==='arcanista'&&group.path==='mago').reduce((sum,group)=>sum+group.count+group.fixed.length,0),memory=plan.classes.some(cls=>cls.path==='mago')?'<p class="spell-memory-reminder help">Você memoriza e pode lançar '+Math.floor(mageCount/2)+' magias dentre as conhecidas.</p>':'';
  const sourceHtml=sources?'<div class="spell-source-grid">'+sources+'</div>':'<p class="help">Nenhuma magia a escolher. Catálogo disponível para consulta.</p>';
  const extras=schools+memory+(plan.notes.length?'<details class="spell-rule"><summary>Outras regras de magia ('+plan.notes.length+')</summary>'+plan.notes.map(note=>abilityHtml({nome:note.label||'Escolha pendente',descricao:note.description})).join('')+'</details>':'');
  return part==='sources'?sourceHtml:part==='extras'?extras:sourceHtml+extras;
}
const SPELL_BOOK_IDS=[...new Set(DATA.spells.flatMap(spell=>spell.books||['basico']))];
const spellCatalogUI={books:new Set(SPELL_BOOK_IDS),section:'magias',schoolReview:null};
function spellCatalogTitle(){
  if(spellCatalogUI.schoolReview)return spellCatalogUI.schoolReview.candidate?'Escolha a magia a substituir':'Consulte as escolas restantes';
  if(spellCatalogUI.section==='condicoes')return 'Condições';
  if(spellState().view==='learned')return hasNonClassSpellSource()?'Você pode lançar:':'Magias do personagem';
  const total=spellPlan().groups.filter(group=>group.kind!=='reference').reduce((sum,group)=>sum+group.count,0);
  return total?'Escolha '+total+(total===1?' magia':' magias'):'Consultar magias';
}
function renderSpellControls(){
  const saved=spellState();
  return '<div class="spell-control-row"><div class="inline-actions"><button type="button" class="button '+(saved.view==='available'?'primary':'')+'" data-action="spell-view" data-view="available" aria-pressed="'+(saved.view==='available')+'">Disponíveis para a escolha</button><button type="button" class="button '+(saved.view==='learned'?'primary':'')+'" data-action="spell-view" data-view="learned" aria-pressed="'+(saved.view==='learned')+'">Magias do personagem</button></div><button class="button" data-action="spell-reload" type="button">Recarregar</button></div><div class="spell-library-row"><div class="spell-book-filters" aria-label="Filtrar magias por livro"><span>Livros</span>'+SPELL_BOOK_IDS.map(id=>'<button type="button" class="spell-book-chip '+(spellCatalogUI.books.has(id)?'active':'')+'" data-action="spell-book" data-book="'+esc(id)+'" aria-pressed="'+spellCatalogUI.books.has(id)+'">'+esc(BOOKS[id.replace(/-/g,'_')]||id)+'</button>').join('')+'</div><div class="spell-section-tabs" role="group" aria-label="Seções do grimório"><button type="button" data-action="spell-section" data-section="magias" class="'+(spellCatalogUI.section==='magias'?'active':'')+'" aria-pressed="'+(spellCatalogUI.section==='magias')+'">Magias</button><button type="button" data-action="spell-section" data-section="condicoes" class="'+(spellCatalogUI.section==='condicoes'?'active':'')+'" aria-pressed="'+(spellCatalogUI.section==='condicoes')+'">Condições</button></div></div>';
}
const renderSpellControlsWithoutRedo=renderSpellControls;
renderSpellControls=function(){return renderSpellControlsWithoutRedo().replace('<button class="button" data-action="spell-reload"','<button class="button danger" data-action="spell-redo" type="button">Refazer escolhas</button><button class="button" data-action="spell-reload"')};
function renderSpells(){
  const saved=spellState();
  return '<section class="panel spell-top-panel"><button type="button" class="spell-options-toggle" id="spellOptionsToggle" aria-expanded="false" aria-controls="spellOptionsContent">Fontes e opções de magia ▾</button><div class="panel-header"><h3 class="panel-title">'+esc(saved.progression?'Magias · progressão até o nível '+state.identity.plannedLevel:'Magias iniciais · nível 1')+'</h3></div><div class="panel-body" id="spellOptionsContent"><div class="spell-topbar"><div id="spellChoices">'+renderSpellChoices('sources')+'</div><div id="spellControls" class="spell-control-deck">'+renderSpellControls()+'</div></div><div id="spellExtraChoices" class="spell-extra-choices">'+renderSpellChoices('extras')+'</div></div></section><section class="panel spell-catalog-panel"><div class="panel-header"><h3 class="panel-title" id="spellCatalogTitle" aria-live="polite">'+esc(spellCatalogTitle())+'</h3></div><div class="panel-body"><p class="spell-frame-status" id="spellFrameStatus" role="status">Carregando o Grimório…</p><iframe id="spellGrimoire" class="spell-grimoire" title="Grimório de magias do personagem" sandbox="allow-scripts"></iframe></div></section>';
}
let grimoireSession=0,grimoireReady=false;
function mountGrimoire(){
  const frame=document.getElementById('spellGrimoire');if(!frame)return;
  grimoireSession++;grimoireReady=false;
  const status=document.getElementById('spellFrameStatus');status.hidden=false;status.textContent='Carregando o Grimório…';
  frame.srcdoc=DATA.grimoireHtml;
  setTimeout(()=>{if((state.step===7||state.finished&&state.sheetView==='grimoire')&&!grimoireReady){const status=document.getElementById('spellFrameStatus');if(status)status.textContent='Não foi possível carregar. Use Recarregar para tentar novamente.'}},10000);
}
function grimoireContext(){
  const plan=spellPlan(),saved=spellState(),group=plan.groups.find(group=>group.id===saved.activeGroup),chosen=group?groupSpellIds(group):[],learned=allLearnedSpellIds(plan),available=group?.fixed.length?group.fixed:group?DATA.spells.filter(spell=>basicSpellAllowed(spell,group,plan)).map(spell=>spell.id):DATA.spells.filter(spell=>spell.circle===1).map(spell=>spell.id);
  const cls=plan.classes.find(cls=>cls.classId===group?.classId),visible=saved.view==='learned'?learned:available,metadata=visible.map(spellById).filter(Boolean);
  let traditions=[...new Set(metadata.filter(spell=>spell.type!=='universal').map(spell=>spell.type))];
  if(!traditions.length&&metadata.some(spell=>spell.type==='universal'))traditions=group?.type&&group.type!=='any'?[group.type]:['arcana','divina'];
  return {channel:'forja-t20-grimoire-v1',type:'context',session:grimoireSession,group:group?.id||'',label:group?.label||'Consulta',view:saved.view,section:spellCatalogUI.section,books:[...spellCatalogUI.books],visible,chosen:group?.fixed.length?[]:chosen,learned,selectable:group&&chosen.length<group.count?available.filter(id=>!spellSelectionReason(id,group,plan)):[],canChoose:Boolean(group?.count),classId:cls?.classId||'',schools:cls?.schools||[],fixedSchools:cls?.fixedSchools||[],schoolCount:cls?cls.schoolCount+cls.fixedSchools.length:0,schoolChoiceCount:cls?.schoolCount||0,schoolChoicesComplete:cls?classSpellChoicesFilled(cls.classId,plan):false,availableSchools:[...new Set(metadata.map(spell=>spell.school))],circles:[...new Set(metadata.map(spell=>spell.circle))],traditions};
}
function syncGrimoire(){
  const frame=document.getElementById('spellGrimoire');if(!frame?.contentWindow)return;
  const context=grimoireContext();frame.contentWindow.postMessage(context,'*');
}
function refreshSpellStage(){
  document.getElementById('spellChoices').innerHTML=renderSpellChoices('sources');
  document.getElementById('spellExtraChoices').innerHTML=renderSpellChoices('extras');
  syncSpellControls();
  document.getElementById('footerMessage').textContent=validationMessage(7,true);
  renderNav();persist();syncGrimoire();
}
function syncSpellControls(){
  const reload=document.querySelector('[data-action="spell-reload"]');
  if(reload&&!document.querySelector('[data-action="spell-redo"]'))reload.insertAdjacentHTML('beforebegin','<button class="button danger" data-action="spell-redo" type="button">Refazer escolhas</button>');
  document.querySelectorAll('[data-action="spell-view"], [data-action="spell-book"], [data-action="spell-section"]').forEach(button=>{
    const action=button.dataset.action,active=action==='spell-view'?button.dataset.view===spellState().view:action==='spell-book'?spellCatalogUI.books.has(button.dataset.book):button.dataset.section===spellCatalogUI.section;
    button.classList.toggle(action==='spell-view'?'primary':'active',active);button.setAttribute('aria-pressed',String(active));
  });
  document.getElementById('spellCatalogTitle').textContent=spellCatalogTitle();
}
function toggleSpellBook(id){if(!SPELL_BOOK_IDS.includes(id))return false;if(spellCatalogUI.books.has(id))spellCatalogUI.books.delete(id);else spellCatalogUI.books.add(id);return true}
window.addEventListener('message',event=>{
  const frame=document.getElementById('spellGrimoire'),message=event.data;
  if((state.step!==7&&!state.finished)||state.finished&&state.sheetView!=='grimoire'||!frame?.contentWindow||event.source!==frame.contentWindow||message?.channel!=='forja-t20-grimoire-v1')return;
  if(message.type==='host-scroll'){
    const rect=frame.getBoundingClientRect(),limit=document.querySelector('.phase-nav')?.getBoundingClientRect().bottom||0,delta=Number(message.delta)||0;
    if(delta>0&&rect.top>limit+2)window.scrollBy({top:Math.min(delta,rect.top-limit),behavior:'auto'});
    else if(delta<0&&rect.top<limit-2)window.scrollBy({top:Math.max(delta,rect.top-limit),behavior:'auto'});
    else frame.contentWindow.postMessage({channel:'forja-t20-grimoire-v1',type:'scroll-items',session:grimoireSession,group:spellState().activeGroup,delta},'*');
    return;
  }
  if(message.type==='ready'){grimoireReady=true;document.getElementById('spellFrameStatus').hidden=true;syncGrimoire();return}
  if(message.session!==grimoireSession||message.group!==spellState().activeGroup)return;
  if(handleSchoolBridgeMessage(message)){syncGrimoire();return}
  if(message.type==='school'){
    const group=spellPlan().groups.find(group=>group.id===message.group);
    if(group?.classId&&chooseSpellSchool(group.classId,message.id))refreshSpellStage();else syncGrimoire();return;
  }
  if(message.type!=='choose'||typeof message.id!=='string')return;
  if(chooseCharacterSpell(message.group,message.id)){refreshSpellStage()}else syncGrimoire();
});
document.addEventListener('click',async event=>{
  const button=event.target.closest?.('[data-action]');if(!button)return;
  const action=button.dataset.action,saved=spellState();
  if(action==='spell-source'){endSchoolReview();saved.activeGroup=button.dataset.group;saved.view='available';spellCatalogUI.section='magias';refreshSpellStage()}
  if(action==='spell-view'){endSchoolReview();saved.view=button.dataset.view;spellCatalogUI.section='magias';refreshSpellStage()}
  if(action==='spell-book'&&toggleSpellBook(button.dataset.book)){syncSpellControls();syncGrimoire()}
  if(action==='spell-section'&&['magias','condicoes'].includes(button.dataset.section)){spellCatalogUI.section=button.dataset.section;syncSpellControls();syncGrimoire()}
  if(action==='spell-remove'&&chooseCharacterSpell(button.dataset.group,button.dataset.spell))refreshSpellStage();
  if(action==='spell-school'){
    if(chooseSpellSchool(button.dataset.classId,button.dataset.school))refreshSpellStage();
  }
  if(action==='spell-reload')mountGrimoire();
  if(action==='spell-redo'){
    if(!await forjaConfirm('Você poderá escolher novamente todas as magias opcionais deste personagem. Magias recebidas automaticamente não serão removidas.','Sim, refazer'))return;
    saved.selections={};saved.schools={};saved.manualSchools={};saved.lockedSchools={};saved.schoolAnnouncements={};saved.memorized={};saved.activeGroup='';saved.view='available';spellCatalogUI.schoolReview=null;spellCatalogUI.section='magias';
    const plan=spellPlan();saved.activeGroup=plan.groups.find(group=>group.count)?.id||plan.groups[0]?.id||'';refreshSpellStage();toast('Escolhas de magia liberadas para serem refeitas.');
  }
  if(action==='summary-spells'){saved.progression=true;state.step=7;renderStage();window.scrollTo({top:0,behavior:'smooth'})}
});
const phaseCompleteBeforeSpells=phaseIsComplete,missingBeforeSpells=missingChoices,validationBeforeSpells=validationMessage,summaryBeforeSpells=renderSummary;
document.addEventListener('click',event=>{
  const action=event.target.closest?.('[data-action]')?.dataset.action;
  if(action==='add-level')spellState().progression=true;
  if(event.target.closest?.('#nextButton')&&state.step===6)spellState().progression=false;
},true);
magicCircleAvailable=function(){
  const plan=spellPlan();
  return Math.max(0,...plan.classes.filter(cls=>!cls.effect.efeitoMundano).map(cls=>spellCircleAt(cls.effect,cls.level)),...plan.groups.filter(group=>group.kind==='grant'&&group.count).map(group=>group.maxCircle),...allLearnedSpellIds(plan).map(id=>spellById(id).circle));
};
const eligibilityBeforeSpells=generalPowerEligibility;
generalPowerEligibility=function(power){
  const verdict=eligibilityBeforeSpells(power),text=slug(power?.preRequisitosTexto||'');
  // Having access through Usurpar is not the same as knowing a named spell.
  if(/(?:conhecer|conhece|aprendido|aprender|magia)_/.test(text)){
    const named=DATA.spells.filter(spell=>text.includes(slug(spell.name)));
    for(const spell of named)if(!knowsCharacterSpell(spell.id))addReason(verdict.reasons,'Requer conhecer a magia '+spell.name+'.');
  }
  return {ok:verdict.reasons.length===0,reasons:verdict.reasons};
};
phaseIsComplete=function(step){return step===7?spellMissingChoices().length===0:phaseCompleteBeforeSpells(step)};
missingChoices=function(step){return step===7?spellMissingChoices():missingBeforeSpells(step)};
validationMessage=function(step,short=false){return step===7?(phaseIsComplete(7)?'Etapa pronta para continuar.':'Conclua as escolhas de magias e escolas indicadas acima.'):validationBeforeSpells(step,short)};
renderSummary=function(){
  const content=summaryBeforeSpells(),plan=spellPlan(),ids=allLearnedSpellIds(plan),missing=spellMissingChoices();
  return content+panel('Grimório do personagem','<div class="ability-list">'+(ids.length?ids.map(id=>abilityHtml({nome:spellById(id).name,descricao:plan.groups.filter(group=>group.kind!=='reference'&&groupSpellIds(group).includes(id)).map(group=>group.label).join(' · ')})).join(''):'<p class="help">Nenhuma magia recebida ou escolhida.</p>')+'</div>'+(missing.length?'<div class="warning-box red" style="margin-top:10px">Há escolhas de magias pendentes. Revise a fase Magias após alterar a progressão.</div>':'')+'<div class="inline-actions" style="margin-top:12px"><button type="button" class="button primary" data-action="summary-spells">Ver / escolher magias</button></div>');
};
spellState();
