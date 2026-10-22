
function spellPlan(){
  const groups=[],notes=[],classes=[],saved=spellState(),powers=activeSpellPowers(),powerIds=new Set(powers.map(power=>power.id));
  const add=(id,label,description,options={})=>{
    const group=Object.assign({id,label,description,count:0,maxCircle:1,type:'any',schools:[],fixed:[],allowed:[],scope:id,kind:'grant'},options);
    group.fixed=group.fixed.map(spellKey);
    group.allowed=group.allowed.map(spellKey);
    groups.push(group);return group;
  };
  const planned=Math.max(1,Number(state.identity.plannedLevel)||1,state.progression?state.progression.length:1);
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
      if(typeof characterMysticAffinities==='function'){
        for(const elem of characterMysticAffinities()){
          const opt=options.find(o=>o.id===elem);
          if(opt?.escolaMagia&&!fixedSchools.includes(opt.escolaMagia))fixedSchools.push(opt.escolaMagia);
        }
      }
    }
    const schoolCount=Number(PROJECT_SCHOOL_LIMITS[classId]??effect.escolasEscolha??0),chosenSchools=[...new Set((saved.schools[classId]||[]).filter(id=>SPELL_SCHOOLS[id]&&!fixedSchools.includes(id)))].slice(0,schoolCount);
    const schools=[...fixedSchools,...chosenSchools];
    const info={classId,name:cls.nome,level,path,lineage,effect,schoolCount,fixedSchools,chosenSchools,schools,description:ability.descricao};
    classes.push(info);
    const common={classId,scope:'class:'+classId,kind:'class',path,lineage,type:effect.magiaTipo,schools,schoolCount,schoolOpen:chosenSchools.length<schoolCount,blockedSchools:classId==='necromante'?['encantamento']:[]};
    if(effect.escolaPorAfinidade && fixedSchools.length<2)common.schoolReady=false;
    if(classId==='arcanista'&&!path)notes.push({blocking:true,description:'Defina o Caminho do Arcanista na fase Identidade e classe antes de escolher suas magias.'});
    if(effect.magiasIniciaisFixas?.length)add('fixed:class:'+classId,cls.nome+' · recebidas',ability.descricao,{...common,fixed:effect.magiasIniciaisFixas,maxCircle:5,kind:'fixed'});
    if(classId==='usurpador')add('consult:usurpador','Usurpar · acesso sem aprendizado',(cls.habilidades.find(h=>h.id==='usurpador_usurpar')||ability).descricao,{...common,kind:'consult',maxCircle:spellCircleAt(effect,level)});
    const teurgistPending=[],teurgistScheduled=new Set();
    for(let n=1;n<=level;n++){
      const frequency=effect.aprendeMagia?.frequencia||(classId==='frade'?'todo_nivel':'nenhuma');
      let count=n===1?Number(effect.magiasIniciais??effect.magiasIniciaisEscolha??0):frequency==='todo_nivel'?1:frequency==='nivel_par'&&n%2===0?1:0;
      if(path==='feiticeiro'&&n>1)count=n%2===1?1:0;
      if(path==='mago'&&n===1)count++;
      const newCircle=n===1||spellCircleAt(effect,n)>spellCircleAt(effect,n-1);
      const circle=spellCircleAt(effect,n);
      if(powerIds.has('teurgista_mistico')&&newCircle&&!teurgistPending.includes(circle))teurgistPending.push(circle);
      const pendingCircle=count>0?teurgistPending.find(value=>!teurgistScheduled.has(value)):null;
      const skippedLevels=saved.teurgistSkippedLevels?.[pendingCircle]||[];
      const isSkipped=Boolean(pendingCircle&&skippedLevels.includes(n));
      let teurgistGroupOptions=null;
      if(pendingCircle){
        count--;
        if(isSkipped){
          teurgistGroupOptions={id:'teurgist-converted:'+classId+':'+pendingCircle+':'+n,label:cls.nome+' · nível '+n+' · escolha da tradição',options:{...common,count:1,maxCircle:pendingCircle,exactCircle:pendingCircle,teurgistConverted:true,teurgistCircle:pendingCircle,teurgistLevel:n}};
        }else{
          teurgistGroupOptions={id:'teurgist:'+classId+':'+pendingCircle,label:'Teurgista Místico · '+pendingCircle+'º círculo',options:{...common,count:1,type:effect.magiaTipo==='arcana'?'divina':'arcana',exclusiveType:true,teurgist:true,maxCircle:pendingCircle,exactCircle:pendingCircle,teurgistCircle:pendingCircle,teurgistLevel:n}};
          teurgistScheduled.add(pendingCircle);
        }
      }
      if(count)add('class:'+classId+':'+path+':'+n,cls.nome+' · nível '+n,ability.descricao,{...common,count,maxCircle:circle});
      if(path==='mago'&&n>1&&spellCircleAt(effect,n)>spellCircleAt(effect,n-1))add('circle:'+classId+':'+n,'Mago · novo círculo no nível '+n,'Ao ganhar acesso a um novo círculo, o mago aprende uma magia adicional daquele círculo.',{...common,count:1,maxCircle:circle,exactCircle:circle});
      if(teurgistGroupOptions)add(teurgistGroupOptions.id,teurgistGroupOptions.label,powers.find(power=>power.id==='teurgista_mistico')?.descricao||ability.descricao,teurgistGroupOptions.options);
    }
    if(lineage){
      const source=cls.habilidades.flatMap(h=>h.escolhas||[]).flatMap(choice=>choice.escolhas_secundarias||[]).find(choice=>choice.id===lineage);
      const basic=source?.estagios?.find(stage=>stage.id==='basica');
      (basic?.efeitos||[]).filter(e=>e.tipo==='aprender_magia').forEach((e,i)=>add('lineage:'+lineage+':'+i,source.nome+' · herança básica',basic.descricao,{count:e.quantidade||1,maxCircle:e.circulo||1,type:Array.isArray(e.magiaTipo)?'any':e.magiaTipo||'any',schools:e.escolas||[],scope:'class:'+classId}));
    }
    const mysticDitameGrants = {
      mistico_ditame_da_chuva: [{minLevel:1,spells:['Área Escorregadia']},{minLevel:6,spells:['Tempestade Divina']},{minLevel:10,spells:['Controlar Água']}],
      mistico_ditame_da_cura: [{minLevel:1,spells:['Curar Ferimentos']},{minLevel:6,spells:['Purificação']},{minLevel:10,spells:['Sopro da Salvação']}],
      mistico_ditame_da_manha: [{minLevel:1,spells:['Luz']},{minLevel:6,spells:['Raio Solar']},{minLevel:10,spells:['Coluna de Chamas']}],
      mistico_ditame_da_montanha: [{minLevel:1,spells:['Primor Atlético']},{minLevel:10,spells:['Controlar Terra']},{minLevel:14,spells:['Terremoto']}],
      mistico_ditame_da_profecia: [{minLevel:1,spells:['Augúrio']},{minLevel:10,spells:['Lendas e Histórias','Vidência']}],
      mistico_ditame_das_brumas: [{minLevel:1,spells:['Névoa']},{minLevel:6,spells:['Camuflagem Ilusória','Miasma Mefítico']}],
      mistico_ditame_das_chamas: [{minLevel:1,spells:['Explosão de Chamas']},{minLevel:6,spells:['Controlar Fogo']},{minLevel:10,spells:['Lança Ígnea de Aleph']}],
      mistico_ditame_do_breu: [{minLevel:1,spells:['Escuridão']},{minLevel:10,spells:['Anular a Luz','Manto de Sombras']}],
      mistico_ditame_do_crepusculo: [{minLevel:1,spells:['Consagrar','Profanar']},{minLevel:6,spells:['Crânio Voador de Vladislav']}],
      mistico_ditame_do_espadachim: [{minLevel:1,spells:['Concentração de Combate']},{minLevel:6,spells:['Velocidade']},{minLevel:10,spells:['Transformação de Guerra']}],
      mistico_ditame_dos_portais: [{minLevel:1,spells:['Salto Dimensional']},{minLevel:10,spells:['Teletransporte']},{minLevel:14,spells:['Viagem Planar']}],
      mistico_ditame_dos_ventos: [{minLevel:1,spells:['Queda Suave']},{minLevel:6,spells:['Controlar Ar']},{minLevel:14,spells:['Controlar o Clima']}],
      mistico_contramagica_elemental: [{minLevel:6,spells:['Dissipar Magia']}],
      mistico_propulsao: [{minLevel:10,spells:['Voo']}]
    };
    levels.forEach((row,index)=>{
      if(row.classId!==classId||!row.powerId)return;
      const power=DATA.classPowers.find(p=>p.id===row.powerId);
      if(!power)return;
      const atLevel=levels.slice(0,index+1).filter(row=>row.classId===classId).length;
      if(['conhecimento_magico','aumentar_repertorio','segredos_da_natureza'].includes(slug(power.nome)))add('power:class:'+index,power.nome+' · nível '+(index+1),power.descricao,{...common,count:2,maxCircle:spellCircleAt(effect,atLevel),type:slug(power.nome)==='conhecimento_magico'?common.type:'any'});
      else if(/^druida_aspecto_(da_primavera|do_inverno|do_outono|do_verao)$/.test(power.id)){
        const schools={druida_aspecto_da_primavera:['encantamento','ilusao'],druida_aspecto_do_inverno:['convocacao','evocacao'],druida_aspecto_do_outono:['necromancia'],druida_aspecto_do_verao:['transmutacao']}[power.id];
        add('power:class:'+index,power.nome+' · nível '+(index+1),power.descricao,{...common,count:1,maxCircle:spellCircleAt(effect,atLevel),type:'any',schools,schoolOpen:false});
      }
      else if(power.id==='arcanista_apoteose_celestial'){
        for(let circle=1;circle<=spellCircleAt(effect,atLevel);circle++)add('power:class:'+index+':'+circle,power.nome+' · '+circle+'º círculo',power.descricao,{...common,count:1,maxCircle:circle,exactCircle:circle,type:'divina',exclusiveType:true});
      }
      else if(power.id==='mistico_ditame_absoluto'||slug(power.nome)==='ditame_absoluto'){
        add('power:class:ditame_absoluto:'+index,'Ditame Absoluto · 5º círculo',power.descricao,{...common,count:1,maxCircle:5,exactCircle:5});
      } else if(mysticDitameGrants[power.id] || mysticDitameGrants['mistico_'+slug(power.nome)]){
        const grantList=mysticDitameGrants[power.id] || mysticDitameGrants['mistico_'+slug(power.nome)];
        const grantedSpells=grantList.filter(g=>level>=g.minLevel).flatMap(g=>g.spells).map(name=>DATA.spells.find(s=>spellKey(s.name)===spellKey(name)||s.id===spellKey(name))?.name).filter(Boolean);
        if(grantedSpells.length){
          add('power:class:ditame:'+index,power.nome,power.descricao,{...common,fixed:grantedSpells,maxCircle:5,kind:'fixed'});
        }
      } else if(/magia|círculo/i.test(power.descricao))notes.push({label:power.nome,description:power.descricao});
    });
  }
  const racialRules={
    dahllan_amiga_das_plantas:{fixed:['Controlar Plantas']},
    eiradaan_sentidos_misticos:{fixed:['Visão Mística']},
    sentidos_misticos:{fixed:['Visão Mística']},
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
  // Poderes de classes sem Conjuração também podem exigir escolhas no Grimório.
  levels.forEach((row,index)=>{
    const power=DATA.classPowers.find(item=>item.id===row.powerId);
    if(!power)return;
    const id='power:class:'+index,info=classes.find(cls=>cls.classId===row.classId),circle=info?spellCircleAt(info.effect,levels.slice(0,index+1).filter(entry=>entry.classId===row.classId).length):1;
    if(power.id==='paladino_orar')add(id,power.nome+' · nível '+(index+1),power.descricao,{classId:row.classId,count:1,maxCircle:1,type:'divina',kind:'grant'});
    if(power.id==='ladino_truque_magico')add(id,power.nome+' · nível '+(index+1),power.descricao,{classId:row.classId,count:1,maxCircle:1,type:'arcana',kind:'grant'});
    if(power.id==='ladino_truque_de_palco'){
      const allowed=DATA.spells.filter(spell=>spell.circle===1&&spell.type==='arcana'&&/truque/i.test(DATA.spellTexts?.[spell.id]||'')).map(spell=>spell.id);
      add(id,power.nome+' · nível '+(index+1),power.descricao,{classId:row.classId,count:3,maxCircle:1,type:'arcana',allowed,kind:'grant'});
    }
    if(power.id==='cacador_elo_com_a_natureza_maior')add(id,power.nome+' · nível '+(index+1),power.descricao,{classId:row.classId,count:2,maxCircle:1,type:'divina',allowed:['Abençoar Alimentos','Acalmar Animal','Alarme','Aviso','Conjurar Armadilhas','Detectar Ameaças','Orientação','Suporte Ambiental'],kind:'grant'});
    if(power.id==='druida_orador_dos_elementos'){
      const allowed=DATA.spells.filter(spell=>/dano de (?:ácido|eletricidade|fogo|frio)/i.test(DATA.spellTexts?.[spell.id]||'')).map(spell=>spell.id);
      add(id,power.nome+' · nível '+(index+1),power.descricao,{classId:row.classId,count:1,maxCircle:circle,type:'any',allowed,kind:'grant'});
    }
    if(power.id==='arcanista_apoteose_rubra'){
      const allowed=DATA.spells.filter(spell=>/\bdano\b/i.test(DATA.spellTexts?.[spell.id]||'')).map(spell=>spell.id);
      for(let n=1;n<=circle;n++)add(id+':'+n,power.nome+' · '+n+'º círculo',power.descricao,{classId:row.classId,count:1,maxCircle:n,exactCircle:n,type:'any',allowed,kind:'grant'});
    }
    if(power.id==='inventor_alquimista_iniciado'||slug(power.nome)==='alquimista_iniciado'){
      const invLvl = levels.filter(entry=>entry.classId==='inventor').length || planned;
      const hasMestre = levels.some(r=>r.powerId==='inventor_mestre_alquimista'||slug(r.powerId||'')==='mestre_alquimista');
      let maxCircle = 1;
      if(hasMestre){
        if(invLvl>=18) maxCircle=5;
        else if(invLvl>=14) maxCircle=4;
        else if(invLvl>=10) maxCircle=3;
        else if(invLvl>=6) maxCircle=2;
        else maxCircle=1;
      } else {
        if(invLvl>=6) maxCircle=2;
        else maxCircle=1;
      }
      add(id+':iniciais','Alquimista Iniciado · 3 fórmulas iniciais',power.descricao,{classId:row.classId,count:3,maxCircle:1,type:'any',kind:'grant'});
      const advanceCount = Math.max(0, invLvl - 1);
      if(advanceCount > 0){
        add(id+':avanco','Alquimista Iniciado · Níveis 2 a '+invLvl+' (+1 fórmula por nível)',power.descricao,{classId:row.classId,count:advanceCount,maxCircle,type:'any',kind:'grant'});
      }
    }
  });
  const regOriginName = typeof selectedRegionalOrigin === 'function' ? selectedRegionalOrigin()?.nome : (state.origin?.regional || '');
  const isDeOutroMundo = slug(regOriginName || '') === 'de_outro_mundo' || regOriginName === 'De Outro Mundo';
  if(isDeOutroMundo && state.origin?.deOutroMundo?.spellId){
    const sId = state.origin.deOutroMundo.spellId;
    const spell = DATA.spells.find(s => s.id === sId || spellKey(s.nome) === spellKey(sId));
    if(spell){
      add('origin:de_outro_mundo', 'De Outro Mundo', 'Magia concedida pela origem De Outro Mundo.', { fixed: [spell.nome || spell.id], maxCircle: 1 });
    }
  }
  const isEstudanteAcademia = slug(regOriginName || '') === 'estudante_da_academia' || regOriginName === 'Estudante da Academia';
  if(isEstudanteAcademia){
    const allowed = DATA.spells.filter(s => s.tipo === 'arcana' && Number(s.circulo || 1) === 1).map(s => s.id);
    add('origin:estudante_da_academia', 'Estudante da Academia', 'Magia arcana de 1º círculo concedida pela origem Estudante da Academia.', { count: 1, maxCircle: 1, type: 'arcana', allowed, kind: 'grant' });
  }
  const isColleniano = slug(regOriginName || '') === 'descendente_colleniano' || regOriginName === 'Descendente colleniano' || regOriginName === 'Descendente Colleniano';
  if(isColleniano){
    add('origin:descendente_colleniano', 'Descendente Colleniano', 'Magia Visão Mística concedida pela origem Descendente Colleniano.', { fixed: ['Visão Mística'], maxCircle: 1, type: 'any' });
  }
  const isSabioMatematico = slug(regOriginName || '') === 'sabio_matematico' || regOriginName === 'Sábio Matemático';
  if(isSabioMatematico){
    add('origin:sabio_matematico', 'Sábio Matemático', 'Efeitos de cálculo avançado equivalentes a Concentração de Combate e Orientação.', { fixed: ['Concentração de Combate', 'Orientação'], maxCircle: 1, type: 'any' });
  }
  if(typeof hasDuploFeerico === 'function' && hasDuploFeerico()){
    const duplo = typeof selectedDuploFeericoPower === 'function' ? selectedDuploFeericoPower() : null;
    if(duplo?.isDuploSpell){
      const targetClass = DATA.classes.find(c => c.id === duplo.classId);
      const ability = (targetClass?.habilidades || []).find(h => (h.efeitos || []).some(e => e.tipo === 'conjuracao'));
      const spellType = ability?.efeitos?.find(e => e.tipo === 'conjuracao')?.magiaTipo || 'any';
      const allowed = DATA.spells.filter(s => (spellType === 'any' || s.tipo === spellType) && Number(s.circulo || 1) === 1).map(s => s.id);
      add('origin:duplo_feerico', 'Duplo Feérico · ' + duplo.className, 'Uma magia de 1º círculo concedida pela habilidade ' + duplo.nome + ' de ' + duplo.className + '.', { count: 1, maxCircle: 1, type: spellType, allowed, kind: 'grant' });
    }
  }
  if(typeof hasFamiliarElementalPower === 'function' && hasFamiliarElementalPower()){
    const chosenFam = typeof getSelectedElementalFamiliarId === 'function' ? getSelectedElementalFamiliarId() : '';
    if(chosenFam === 'tpeel'){
      add('grant:familiar_elemental:tpeel', 'T\'peel (Familiar Elemental)', 'Magia Queda Suave concedida pelo seu familiar elemental T\'peel.', { fixed: ['Queda Suave'], maxCircle: 1, type: 'any' });
    } else if(chosenFam === 'pakk'){
      add('grant:familiar_elemental:pakk', 'Pakk (Familiar Elemental)', 'Magia Explosão de Chamas concedida pelo seu familiar elemental Pakk.', { fixed: ['Explosão de Chamas'], maxCircle: 1, type: 'any' });
    }
  }
  const plan={groups,classes,notes,powerIds};
  reconcileSpellSchools(plan);
  return plan;
}
function groupSpellIds(group){return group.fixed.length?group.fixed:[...new Set((spellState().selections[group.id]||[]).filter(id=>typeof id==='string'))]}
function knowsCharacterSpell(id){return allLearnedSpellIds().includes(spellKey(id))}
function allLearnedSpellIds(plan=spellPlan()){
  return [...new Set(plan.groups.filter(group=>!['reference','consult'].includes(group.kind)).flatMap(group=>groupSpellIds(group).filter(id=>group.fixed.length||basicSpellAllowed(spellById(id),group,plan)&&teurgistUnlocked(group,plan))))].filter(id=>spellById(id));
}
function spellRelearnedTimes(spellId, plan = spellPlan()){
  const key = spellKey(spellId);
  if (!key) return 0;
  let count = 0;
  for (const group of plan.groups) {
    if (['reference', 'consult'].includes(group.kind)) continue;
    const ids = groupSpellIds(group).map(spellKey);
    if (ids.includes(key)) count++;
  }
  const reducedStored = Boolean(spellState().reducedCostSpells?.[key]);
  const times = Math.max(0, count - 1);
  return reducedStored ? Math.max(1, times) : times;
}
function spellCostReductionTag(spellId, plan = spellPlan()){
  const times = spellRelearnedTimes(spellId, plan);
  return times > 0 ? ' (-' + times + ' PM)' : '';
}
function spellDisplayNameWithCost(spell, plan = spellPlan()){
  const id = typeof spell === 'string' ? spellKey(spell) : spell?.id;
  const name = typeof spell === 'string' ? (spellById(spell)?.name || spell) : (spell?.name || '');
  return name + spellCostReductionTag(id, plan);
}
function hasNonClassSpellSource(plan=spellPlan()){
  return plan.groups.some(group=>!group.classId&&!['reference','consult'].includes(group.kind)&&(group.count||group.fixed.length));
}
function advanceSpellSourceAfterChoice(current,plan=spellPlan()){
  const saved=spellState();
  const sorted = [...plan.groups].sort((a,b)=>groupOrderScore(a)-groupOrderScore(b));
  const nextGroup = sorted.find(group=>group.count&&groupSpellIds(group).length<group.count&&teurgistUnlocked(group,plan));
  if(nextGroup){
    saved.activeGroup=nextGroup.id;
    saved.view='available';
    if(nextGroup.teurgist){
      toast('Escolha a magia concedida por Teurgista Místico.');
    }else if(nextGroup.kind!=='class'){
      toast('Escolha a magia de '+nextGroup.label+'.');
    }
    return;
  }
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
  const targetLevel = group.teurgistLevel || 1;
  return plan.groups.filter(other=>{
    if(other.classId !== group.classId || other.kind !== 'class' || other.teurgist) return false;
    const match = other.id.match(/:(\d+)$/);
    const otherLevel = match ? Number(match[1]) : 1;
    return otherLevel <= targetLevel;
  }).every(other=>groupSpellIds(other).length===other.count&&groupSpellIds(other).every(id=>!spellSelectionReason(id,other,plan)));
}
function spellSelectionReason(id,group,plan=spellPlan(),isCandidate=false){
  const spell=spellById(id);
  if(!teurgistUnlocked(group,plan))return 'Escolha primeiro as magias de nível 1 da sua classe. O Teurgista Místico é escolhido logo em seguida.';
  if(!basicSpellAllowed(spell,group,plan))return 'Esta magia não atende ao círculo, à tradição ou às escolas desta escolha.';
  const count=groupSpellIds(group).filter(x=>x===id).length;
  if(isCandidate?count>0:count>1)return 'Esta magia já foi selecionada nesta mesma escolha.';
  return '';
}
function spellMissingChoices(){
  const plan=spellPlan(),missing=[];
  plan.notes.filter(note=>note.blocking).forEach(note=>missing.push({text:note.description,target:'#spellChoices'}));
  plan.classes.forEach(cls=>{
    if(classSpellChoicesFilled(cls.classId,plan)&&cls.chosenSchools.length!==cls.schoolCount)missing.push({text:cls.name+': complete as escolas pendentes.',target:'#spellChoices'});
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
function triggerSpellGlow(type){
  const glow=document.getElementById('spellScreenGlow');
  if(!glow)return;
  glow.className='spell-screen-glow glow-'+(type==='divina'?'divine':'arcane');
  glow.hidden=false;
  clearTimeout(glow._timer);
  glow._timer=setTimeout(()=>{
    glow.className='spell-screen-glow';
    glow.hidden=true;
  },850);
}
function groupOrderScore(group){
  if(group.id==='fixed:all'||group.kind==='fixed'||(group.fixed&&group.fixed.length>0))return 10;
  if(group.id.includes('tatuagem_mistica'))return 315;
  if(group.id.startsWith('race:')||group.kind==='race')return 318;
  if(group.kind==='class'){
    let targetLevel = 1;
    if(group.teurgist){
      targetLevel = group.teurgistLevel || 1;
    } else {
      const match = group.id.match(/:(\d+)$/);
      targetLevel = match ? Number(match[1]) : 1;
    }
    let sub = 0;
    if(group.id.startsWith('circle:')) sub = 0.2;
    if(group.teurgist) sub = 0.5;
    return 300 + targetLevel * 10 + sub;
  }
  if(group.id.startsWith('power:'))return 400;
  return 500;
}
function shortSpellGroupLabel(group){
  if(group.id==='fixed:all'||group.kind==='fixed'||(group.fixed&&group.fixed.length>0))return 'Recebidas';
  if(group.kind==='consult')return 'Consulta';
  if(group.id.includes('tatuagem_mistica'))return 'Tatuagem mística';
  if(group.id.startsWith('race:'))return group.label.replace(/^Afinidade Elemental ·\s*/,'');
  if(group.teurgist)return 'Teurgista '+(group.exactCircle||group.maxCircle)+'º Círc.';
  if(group.id.startsWith('circle:'))return 'Mago '+(group.exactCircle||group.maxCircle)+'º Círc.';
  if(group.id.includes('ditame_absoluto'))return 'Ditame Absoluto';
  if(group.id.startsWith('power:class:'))return group.label.split(' · ')[0];
  if(group.kind==='class'){
    const match=group.id.match(/:(\d+)$/);
    if(match){
      return 'Nível '+match[1];
    }
  }
  return group.label;
}
function chooseCharacterSpell(groupId,id){
  const plan=spellPlan(),group=plan.groups.find(group=>group.id===groupId);
  if(!group||group.fixed.length||!group.count)return false;
  const saved=spellState(),list=groupSpellIds(group),selected=list.includes(id);
  if(selected){
    if(state.isLevelingUp){
      const beforeSpells = state.levelUpBefore?.spells?.selections?.[groupId] || [];
      if(beforeSpells.includes(id)){
        toast('Magias aprendidas em níveis anteriores não podem ser alteradas durante o avanço de nível.');
        return false;
      }
    }
    saved.selections[groupId]=list.filter(value=>value!==id);
    saved.memorized=saved.memorized.filter(value=>value!==id);
    const updatedPlan=spellPlan();
    if(spellRelearnedTimes(id,updatedPlan)===0){
      delete saved.reducedCostSpells?.[id];
    }
    if(group.classId && state.step <= 7 && !state.finished){
      saved.lockedSchools[group.classId] = [];
      const sp = spellById(id);
      if(sp?.school && Array.isArray(saved.manualSchools[group.classId])){
        saved.manualSchools[group.classId] = saved.manualSchools[group.classId].filter(s => s !== sp.school);
      }
    }
  }
  else {
    const reason=spellSelectionReason(id,group,plan,true);
    if(reason){toast(reason);return false}
    if(list.length>=group.count){toast('Esta escolha já está completa. Remova uma magia para trocar.');return false}
    const alreadyKnown=allLearnedSpellIds(plan).includes(id);
    if(alreadyKnown){
      saved.reducedCostSpells=saved.reducedCostSpells||{};
      saved.reducedCostSpells[id]=true;
    }
    saved.selections[groupId]=[...list,id];
    spellPlan();
    const spell=spellById(id);
    const glowType=spell?.type==='divina'||group?.type==='divina'?'divina':'arcana';
    triggerSpellGlow(glowType);
    if(group.teurgist)toast('Magia de outra tradição registrada por Teurgista Místico.');
    if(saved.selections[groupId].length===group.count){
      const updated=spellPlan(),next=updated.groups.find(other=>other.classId===group.classId&&other.teurgist&&teurgistUnlocked(other,updated)&&groupSpellIds(other).length<other.count);
      if(next){
        saved.activeGroup=next.id;
        showTeurgistNotice(next);
      }
      else advanceSpellSourceAfterChoice(group,updated);
    }
  }
  state.completed=state.completed.filter(step=>step!==7);
  spellPlan();
  return true;
}
function showTeurgistNotice(group){
  if(!group||!group.teurgist)return;
  const modal=document.getElementById('teurgistNoticeModal');
  if(!modal)return;
  const desc=document.getElementById('teurgistNoticeDesc');
  const otherTrad=group.type==='arcana'?'Arcana':(group.type==='divina'?'Divina':'da outra tradição');
  const circleText=group.exactCircle?group.exactCircle+'º círculo':'até '+group.maxCircle+'º círculo';
  if(desc){
    desc.innerHTML='Pelo poder concedido <strong>Teurgista Místico</strong>, você agora escolherá <strong>1 magia da tradição '+otherTrad+'</strong> ('+circleText+').';
  }
  modal.hidden=false;
}
