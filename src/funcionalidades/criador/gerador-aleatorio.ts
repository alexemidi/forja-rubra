

function generateRandomCharacter(options = {}){
  state = defaultState();
  if(typeof normalizeState === 'function') normalizeState();

  const targetLevel = Math.max(1, Math.min(20, Number(options.level) || 1));
  const originMode = options.originMode === 'dual' ? 'dual' : 'single';

  // 1. Identidade
  const firstName = pickRandom(FIRST_NAMES) || 'Herói';
  const lastName = pickRandom(SURNAMES) || 'de Arton';
  state.identity.characterName = firstName + ' ' + lastName;
  state.identity.playerName = 'Jogador';

  // 2. Classe
  const availableClasses = (DATA.classes || []).filter(c => c.id !== 'custom');
  const cls = (options.classId ? availableClasses.find(c => c.id === options.classId) : null) || pickRandom(availableClasses) || availableClasses[0];
  state.identity.classId = cls.id;
  state.identity.classChoices = state.identity.classChoices || {};
  state.identity.classRequiredChoices = state.identity.classRequiredChoices || {};
  state.identity.classRequiredOffices = state.identity.classRequiredOffices || {};

  const forbiddenSkills = new Set(CLASS_FORBIDDEN_SKILLS[cls.id] || []);

  if(cls.id === 'arcanista'){
    const caminho = pickRandom(['Bruxo', 'Mago', 'Feiticeiro']);
    state.identity.classChoices['arcanista_caminho_do_arcanista'] = caminho;
    if(caminho === 'Feiticeiro'){
      state.identity.classChoices['arcanista_caminho_do_arcanista_linhagem'] = pickRandom(['Linhagem Dracônica', 'Linhagem Feérica', 'Linhagem Rubra']);
    }
  } else if(cls.id === 'mistico'){
    state.identity.classChoices['mistico_afinidade_elemental'] = pickRandom(['Fogo', 'Água', 'Ar', 'Terra', 'Luz', 'Trevas']);
  } else if(cls.id === 'bardo'){
    const schools = ['abjuracao', 'adivinhacao', 'convocacao', 'encantamento', 'evocacao', 'ilusao', 'necromancia', 'transmutacao'];
    spellState().schools = spellState().schools || {};
    spellState().schools.bardo = pickRandomUnique(schools, 3);
  }

  const descriptors = typeof classChoiceDescriptors === 'function' ? classChoiceDescriptors(cls) : [];
  descriptors.forEach(desc => {
    if(!state.identity.classChoices[desc.id] && desc.opcoes?.length){
      const picked = pickRandom(desc.opcoes);
      state.identity.classChoices[desc.id] = typeof picked === 'object' ? (picked.nome || picked.id) : picked;
    }
  });

  const requiredList = cls.caracteristicas?.pericias?.obrigatorias || cls.caracteristicas?.pericias?.fixas || [];
  requiredList.forEach((req, idx) => {
    if(typeof req === 'object' && req.escolha && req.opcoes?.length){
      const validOpts = req.opcoes.filter(o => !forbiddenSkills.has(o.id || o));
      const pool = validOpts.length ? validOpts : req.opcoes;
      const chosen = pickRandom(pool);
      state.identity.classRequiredChoices[idx] = chosen.id || chosen;
      if(chosen.id === 'oficio' || chosen === 'oficio'){
        const office = pickRandom(OFFICES);
        state.identity.classRequiredOffices[idx] = typeof officeToken === 'function' ? officeToken(office[0]) : office[0];
      }
    }
  });

  // 3. Raça
  const EXCLUDED_RANDOM_RACES = new Set(['duende', 'kobold', 'kallyanach', 'golem_desperto', 'custom']);
  const availableRaces = (DATA.races || []).filter(r => !EXCLUDED_RANDOM_RACES.has(r.id) && (!options.originStandard || !['golem', 'golem_desperto'].includes(r.id)));
  const race = (options.raceId ? availableRaces.find(r => r.id === options.raceId) : null) || pickRandom(availableRaces) || availableRaces[0];
  state.identity.raceId = race.id;

  // Atributos Livres da Raça (ex: Humano escolhe 3): prioriza atributo chave e apoios vitais, nunca dumps
  const priorityOrder = classAttributePriority(cls.id, state.identity.classChoices);
  if(race.id === 'humano'){
    state.identity.raceAttrs = priorityOrder.slice(0, 3);
  } else if(Array.isArray(race.atributosLivres) && race.atributosLivres.length){
    state.identity.raceAttrs = priorityOrder.slice(0, race.atributosLivres.length);
  }

  state.identity.raceChoices = state.identity.raceChoices || {};
  if(race.id === 'moreau'){
    const herancas = ['coruja', 'hiena', 'leao', 'lobo', 'morcego', 'raposa', 'serpente', 'touro', 'urso', 'bufalo', 'gato', 'coelho'];
    state.identity.raceChoices.moreau_heranca = pickRandom(herancas);
  } else if(race.id === 'lefou'){
    state.identity.raceChoices.lefou_deformidade = pickRandom(['olhos_vermelhos', 'dentes_afiados', 'pele_escamosa', 'membros_extras', 'articulacoes_flexiveis']);
  } else if(race.id === 'suraggel'){
    state.identity.raceChoices.suraggel_heranca_substituta = 'suraggel_heranca_original';
  }

  for(const def of race.habilidades?.selecionadas || []){
    if(!state.identity.raceChoices[def.id] && def.opcoes?.length){
      const valid = def.opcoes.filter(opt => {
        const idOrName = opt.id || opt.nome || '';
        return !forbiddenSkills.has(slug(idOrName));
      });
      const opt = pickRandom(valid.length ? valid : def.opcoes);
      if(opt) state.identity.raceChoices[def.id] = opt.id || opt.nome;
    }
  }

  // 4. Atributos (exatamente 10 pontos)
  state.identity.baseAttrs = generateRandomAttributes(cls.id, state.identity.classChoices);

  // 5. Origem
  const isGolem = ['golem', 'golem_desperto'].includes(race.id);
  state.origin.mode = isGolem ? 'single' : originMode;
  if(isGolem){
    state.origin.standard = '';
    state.origin.regional = '';
    state.origin.benefits = [];
  } else {
    const incompatible = new Set((CLASS_INCOMPATIBLE_ORIGINS[cls.id] || []).map(slug));
    const availableOrigins = (DATA.origins || []).filter(o => {
      const origSlug = slug(o.nome);
      if(incompatible.has(origSlug)) return false;
      const benefitOpts = typeof originBenefitOptions === 'function' ? originBenefitOptions(o) : [];
      const valid = benefitOpts.filter(b => {
        if(b.type === 'skill'){
          const token = typeof skillTokenFromName === 'function' ? skillTokenFromName(b.name) : slug(b.name);
          if(forbiddenSkills.has(token)) return false;
        }
        return true;
      });
      return valid.length >= 2;
    });
    const origin = (options.originStandard ? (DATA.origins || []).find(o => slug(o.nome) === slug(options.originStandard) || o.id === options.originStandard || o.nome === options.originStandard) : null) || pickRandom(availableOrigins.length ? availableOrigins : DATA.origins) || (DATA.origins || [])[0];
    state.origin.standard = origin.nome;
    const benefitOpts = typeof originBenefitOptions === 'function' ? originBenefitOptions(origin) : [];
    const validOpts = benefitOpts.filter(b => {
      if(b.type === 'skill'){
        const token = typeof skillTokenFromName === 'function' ? skillTokenFromName(b.name) : slug(b.name);
        if(forbiddenSkills.has(token)) return false;
      }
      return true;
    });
    const pool = validOpts.length >= 2 ? validOpts : benefitOpts;
    const regularPool = pool.filter(b => b.id !== 'unique:heranca_2000');
    let chosenBenefits = [];
    if(pool.some(b => b.id === 'unique:heranca_2000') && Math.random() < 0.25){
      chosenBenefits = [pool.find(b => b.id === 'unique:heranca_2000')];
    } else {
      chosenBenefits = pickRandomUnique(regularPool, Math.min(2, regularPool.length));
    }
    state.origin.benefits = chosenBenefits.map(b => b.id);
    chosenBenefits.forEach(b => {
      if(b.type === 'skill' && (typeof skillTokenFromName === 'function' ? skillTokenFromName(b.name) : slug(b.name)) === 'oficio'){
        const office = pickRandom(OFFICES);
        state.origin.officeSpecialties[b.id] = typeof officeToken === 'function' ? officeToken(office[0]) : office[0];
      }
    });

    if(state.origin.mode === 'dual' && Array.isArray(DATA.regionalOrigins) && DATA.regionalOrigins.length){
      const validRegionals = DATA.regionalOrigins.filter(reg => {
        if(forbiddenSkills.size > 0){
          const desc = reg.beneficios?.descricao || '';
          for(const [id, name] of SKILLS){
            if(forbiddenSkills.has(id) && new RegExp('treinad[oa] em[^.]*\\b' + name + '\\b', 'i').test(desc)){
              return false;
            }
          }
        }
        return true;
      });
      const regional = pickRandom(validRegionals.length ? validRegionals : DATA.regionalOrigins);
      state.origin.regional = regional ? regional.nome : '';
      const regSlug = slug(state.origin.regional || '');
      if(regSlug === 'duplo_feerico'){
        const dOpts = typeof duploFeericoOptions === 'function' ? duploFeericoOptions() : [];
        if(dOpts.length) state.powers.duploFeericoClassPower = dOpts[0].key;
      }else if(regSlug === 'estudante_da_academia'){
        const spells = (DATA.spells || []).filter(s => s.tipo === 'arcana' && Number(s.circulo || 1) === 1);
        if(spells.length){
          const sp = typeof spellState === 'function' ? spellState() : (state.spells = state.spells || {});
          sp.selections = sp.selections || {};
          sp.selections['origin:estudante_da_academia'] = [spells[0].id];
        }
      }else if(regSlug === 'cosmopolita'){
        const cOpts = typeof cosmopolitaOptions === 'function' ? cosmopolitaOptions() : [];
        if(cOpts.length) state.powers.cosmopolitaPower = cOpts[0].id;
      }else if(regSlug === 'de_outro_mundo'){
        state.origin.deOutroMundo = { spellId: 'aviso', keyAttr: 'int', effectType: 'magico' };
      }
    } else {
      state.origin.regional = '';
    }
  }

  // 6. Perícias
  state.skills = { class: [], int: [], race: [], duplicate: [] };
  const limits = typeof skillChoiceLimits === 'function' ? skillChoiceLimits() : null;
  const baseCount = Number(cls.caracteristicas?.pericias?.escolhas?.quantidade || 0);
  const classSkillOptions = (cls.caracteristicas?.pericias?.escolhas?.opcoes || []).map(o => o.id);
  const availableClassSkills = classSkillOptions.filter(id => !allTrainedSkills().includes(id));
  const chosenClass = pickThematicSkills(availableClassSkills, baseCount, cls.id, finalAttrs());
  if(chosenClass.length < baseCount){
    const extraNeeded = baseCount - chosenClass.length;
    const remaining = SKILLS.map(s => s[0]).filter(id => !allTrainedSkills().includes(id) && !chosenClass.includes(id));
    chosenClass.push(...pickThematicSkills(remaining, extraNeeded, cls.id, finalAttrs()));
  }
  state.skills.class = chosenClass;

  const dupCount = limits ? (limits.duplicate || 0) : 0;
  if(dupCount > 0){
    const allSkillsList = SKILLS.map(s => s[0]).filter(id => !allTrainedSkills().includes(id));
    state.skills.duplicate = pickThematicSkills(allSkillsList, dupCount, cls.id, finalAttrs());
  }

  const raceSlots = limits ? (limits.race || 0) : (typeof raceSkillSlots === 'function' ? raceSkillSlots() : 0);
  if(raceSlots > 0){
    const allSkillsList = SKILLS.map(s => s[0]).filter(id => !allTrainedSkills().includes(id));
    state.skills.race = pickThematicSkills(allSkillsList, raceSlots, cls.id, finalAttrs());
  }

  const intCount = limits ? (limits.int || 0) : Math.max(0, finalAttrs().int);
  if(intCount > 0){
    const allSkillsList = SKILLS.map(s => s[0]).filter(id => !allTrainedSkills().includes(id));
    state.skills.int = pickThematicSkills(allSkillsList, intCount, cls.id, finalAttrs());
  }

  // 7. Divindade (deus aceita por raça OU classe)
  const isSantoOrPaladin = ['santo', 'paladino'].includes(cls.id);
  const rule = typeof devotionRule === 'function' ? devotionRule() : { forced: isSantoOrPaladin ? 'devout' : null };
  const allowed = (DATA.deities || []).filter(d => {
    if(cls.id === 'usurpador') return false;
    if(isSantoOrPaladin){
      return ['Azgher', 'Khalmyr', 'Lena', 'Lin-Wu', 'Marah', 'Tanna-Toh', 'Thyatis', 'Valkaria'].includes(d.nome);
    }
    if(['druida', 'ermitao'].includes(cls.id)){
      return ['Allihanna', 'Megalokk', 'Oceano'].includes(d.nome);
    }
    const races = d.devotos?.racas || [];
    const classes = d.devotos?.classes || [];
    const acceptsRace = races.includes('Todas') || races.includes(race?.nome);
    const acceptsClass = classes.includes('Todas') || classes.includes(cls?.nome);
    return acceptsRace || acceptsClass;
  });

  const isMandatoryDevout = rule.forced === 'devout' || ['clerigo', 'frade', 'druida', 'ermitao', 'paladino', 'santo'].includes(cls.id);
  const isForbidden = rule.forced === 'none' || cls.id === 'usurpador';

  if(isForbidden){
    state.deity.mode = 'none';
    state.deity.name = '';
    state.deity.power = '';
  } else if(isMandatoryDevout || (allowed.length && Math.random() > 0.2)){
    const chosenDeity = pickRandom(allowed) || allowed[0];
    state.deity.mode = 'devout';
    state.deity.name = chosenDeity.nome;
    const count = typeof deityPowerCount === 'function' ? deityPowerCount() : (['clerigo', 'frade', 'druida', 'ermitao', 'santo'].includes(cls.id) ? 2 : 1);
    const powers = chosenDeity.poderes_concedidos || [];
    const pickedPowers = pickRandomUnique(powers, count);
    state.deity.power = pickedPowers.join('|');
  } else {
    state.deity.mode = 'none';
    state.deity.name = '';
    state.deity.power = '';
  }

  // 8. Poderes Gerais (nível 1)
  const genSlots = typeof generalPowerSlots === 'function' ? generalPowerSlots() : 0;
  state.powers.general = [];
  if(genSlots > 0){
    const availableGeneral = (DATA.generalPowers || []).filter(p => {
      const verdict = generalPowerEligibility(p);
      return verdict.ok;
    });
    state.powers.general = pickRandomUnique(availableGeneral, genSlots).map(p => p.id);
  }

  // 9. Equipamento Inicial do Arsenal (Hierarquia: Exótica > Marcial > Simples)
  const ORIGIN_EXCLUSIVE_WEAPON_IDS = new Set([
    'rolo_de_macarrao',
    'martelo_de_carne',
    'ferramenta_pesada',
    'ferramenta_pesada_lanca',
    'ferramenta_agricola'
  ]);

  const profs = new Set(characterProficiencies());
  const simpleWeapons = (DATA.pdfItems || []).filter(i => i.tipo === 'arma' && i.categoriaId === 'simples' && !ORIGIN_EXCLUSIVE_WEAPON_IDS.has(i.id));
  const martialWeapons = (DATA.pdfItems || []).filter(i => i.tipo === 'arma' && i.categoriaId === 'marcial');

  const backpack = [
    { itemId: 'mochila', itemName: 'Mochila', displayName: 'Mochila', quantity: 1, acquisition: { source: 'initial' } },
    { itemId: 'saco_de_dormir', itemName: 'Saco de Dormir', displayName: 'Saco de Dormir', quantity: 1, acquisition: { source: 'initial' } },
    { itemId: 'traje_de_viajante', itemName: 'Traje de Viajante', displayName: 'Traje de Viajante', quantity: 1, acquisition: { source: 'initial' } }
  ];

  const str = finalAttrs().for;
  const isCaster = ['arcanista', 'bardo', 'clerigo', 'druida', 'mistico', 'frade', 'ermitao', 'usurpador'].includes(cls.id);
  // Conjuradores ou personagens com Força <= 0 pulam arma simples para evitar sobrecarga de carga
  const skipSimpleWeapon = isCaster || (str <= 0 && profs.has('armas_marciais'));
  if(!skipSimpleWeapon){
    const chosenSimple = pickRandom(simpleWeapons);
    if(chosenSimple) backpack.push({ itemId: chosenSimple.id, itemName: chosenSimple.nome, displayName: chosenSimple.nome, quantity: 1, acquisition: { source: 'initial' } });
  }

  if(profs.has('armas_marciais')){
    const chosenMartial = pickRandom(martialWeapons);
    if(chosenMartial) backpack.push({ itemId: chosenMartial.id, itemName: chosenMartial.nome, displayName: chosenMartial.nome, quantity: 1, acquisition: { source: 'initial' } });
  }

  const isArcanist = cls.id === 'arcanista' || DATA.classInheritance?.[cls.id] === 'arcanista';

  if(!isArcanist){
    const armor=pickRandom(SorteiosPersonagem.armadurasIniciais(DATA.pdfItems||[],profs.has('armaduras_pesadas')));
    if(armor)backpack.push({itemId:armor.id,itemName:armor.nome,displayName:armor.nome,quantity:1,acquisition:{source:'initial'}});
  }

  const resolveOriginItem = (itemName) => {
    if(!itemName || (typeof isNarrativeItem === 'function' && isNarrativeItem(itemName))) return null;
    const text = slug(itemName).replace(/_/g, ' ');
    if(/ferramenta pesada.*maca ou lanca/.test(text)){
      const useLanca = Math.random() > 0.5;
      return useLanca
        ? { itemId: 'ferramenta_pesada_lanca', itemName: 'Ferramenta Pesada', displayName: 'Picareta', options: { weaponModel: 'lanca', customName: 'Picareta' } }
        : { itemId: 'ferramenta_pesada', itemName: 'Ferramenta Pesada', displayName: 'Malho', options: { weaponModel: 'maca', customName: 'Malho' } };
    }
    if(/ferramenta pesada/.test(text)){
      return { itemId: 'ferramenta_pesada', itemName: 'Ferramenta Pesada', displayName: 'Malho', options: { weaponModel: 'maca', customName: 'Malho' } };
    }
    if(/ferramenta agricola/.test(text)){
      return { itemId: 'ferramenta_agricola', itemName: 'Ferramenta Agrícola', displayName: 'Forcado', options: { weaponModel: 'lanca', customName: 'Forcado' } };
    }
    if(/rolo de macarrao ou martelo de carne/.test(text)){
      const isRolo = Math.random() > 0.5;
      return isRolo
        ? { itemId: 'rolo_de_macarrao', itemName: 'Rolo de Macarrão', displayName: 'Rolo de Macarrão' }
        : { itemId: 'martelo_de_carne', itemName: 'Martelo de Carne', displayName: 'Martelo de Carne' };
    }
    if(/instrumento musical exotico/.test(text)){
      return { itemId: 'instrumento_musical_exotico', itemName: 'Instrumento Musical Exótico', displayName: 'Sanfona', options: { customName: 'Sanfona', customSpaces: 2 } };
    }
    if(/instrumento musical/.test(text)){
      const names = ['Bandolim', 'Alaúde', 'Flauta', 'Lira', 'Harpa', 'Tambor'];
      const chosen = pickRandom(names) || 'Bandolim';
      return { itemId: 'instrumento_musical', itemName: 'Instrumento Musical', displayName: chosen, options: { customName: chosen } };
    }
    if(/colecao de livros|livros?\b/.test(text)){
      const knowledges = ['conhecimento', 'guerra', 'misticismo', 'nobreza', 'religiao'];
      const k = pickRandom(knowledges) || 'conhecimento';
      const kLabel = k.charAt(0).toUpperCase() + k.slice(1);
      return { itemId: 'colecao_de_livros', itemName: 'Coleção de Livros', displayName: 'Coleção de Livros (' + kLabel + ')', options: { knowledge: k, customName: 'Coleção de Livros' } };
    }
    const found = (DATA.pdfItems || []).find(it => slug(it.nome) === slug(itemName));
    if(found) return { itemId: found.id, itemName: found.nome, displayName: found.nome };
    return null;
  };

  const standardOriginObj = typeof selectedStandardOrigin === 'function' ? selectedStandardOrigin() : null;
  if(standardOriginObj?.itens?.length){
    standardOriginObj.itens.forEach(itemName => {
      const resolved = resolveOriginItem(itemName);
      const canonical=resolved&&(DATA.pdfItems||[]).find(item=>item.id===resolved.itemId);
      if(resolved&&canonical) backpack.push({ ...resolved, itemName:canonical.nome, displayName:canonical.nome, quantity: 1, acquisition: { source: 'origin' } });
    });
  }

  if(state.origin.mode === 'dual'){
    const regionalObj = typeof selectedRegionalOrigin === 'function' ? selectedRegionalOrigin() : null;
    if(regionalObj?.itens?.length){
      regionalObj.itens.forEach(itemName => {
        const resolved = resolveOriginItem(itemName);
        const canonical=resolved&&(DATA.pdfItems||[]).find(item=>item.id===resolved.itemId);
        if(resolved&&canonical) backpack.push({ ...resolved, itemName:canonical.nome, displayName:canonical.nome, quantity: 1, acquisition: { source: 'origin' } });
      });
    }
  }

  const saved = arsenalState();
  saved.storage = saved.storage || {};
  saved.storage[ARSENAL_PROFILES_KEY] = JSON.stringify({
    activeId: 'ficha-ativa',
    profiles: [{
      id: 'ficha-ativa',
      name: state.identity.characterName,
      strength: finalAttrs().for,
      capacityBonus: 0,
      backpack
    }]
  });
  saved.complete = true;
  saved.choiceIndex = 99;

  // Auto-equipa com hierarquia de armas (Exótica > Marcial > Simples)
  initEquipmentState();

  // 10. Configuração de Nível e Progressão
  state.identity.initialLevel = targetLevel;
  state.identity.plannedLevel = targetLevel;
  state.identity.editingLevel = targetLevel;
  state.finances = state.finances || {};
  state.finances.startingLevel = targetLevel;

  if(typeof ensureProgression === 'function'){
    ensureProgression();
  }

  if(targetLevel > 1){
    for(let lvl = 2; lvl <= targetLevel; lvl++){
      const index = lvl - 1;
      const row = state.progression[index];
      if(!row) continue;
      const currentCls = (typeof classById === 'function' ? classById(row.classId) : cls) || cls;
      const cLevel = typeof classLevelAt === 'function' ? classLevelAt(index, row.classId) : lvl;
      const hasSlot = typeof powerSlotAt === 'function' ? powerSlotAt(currentCls, cLevel) : true;
      if(hasSlot){
        const classPowers = (DATA.classPowers || []).filter(p => (p.classeIds || []).includes(row.classId));
        const tier=progressionTier(lvl);
        const allowedAttrs=ATTRS.map(([id])=>id).filter(id=>
          !(state.age?.enabled&&['velho','anciao'].includes(state.age.band)&&['for','des','con'].includes(id))&&
          !state.progression.slice(0,index).some(previous=>previous.powerId==='classe_aumento_de_atributo'&&previous.powerChoice===id&&progressionTier(state.progression.indexOf(previous)+1)===tier));
        const eligible=classPowers.filter(power=>classProgressionEligibility(power,index).ok&&(power.id!=='classe_aumento_de_atributo'||allowedAttrs.length));
        const increasedInTier=state.progression.slice(0,index).some((previous,i)=>previous.powerId==='classe_aumento_de_atributo'&&progressionTier(i+1)===tier);
        const chosen=SorteiosPersonagem.ponderado(eligible,power=>power.id==='classe_aumento_de_atributo'&&!increasedInTier&&[4,7,10,14].includes(lvl)?1.1:1);
        if(chosen){
          row.powerId=chosen.id;
          if(chosen.id==='classe_aumento_de_atributo'){
            const weights=SorteiosPersonagem.pesosAtributos(finalAttrs(),allowedAttrs);
            row.powerChoice=SorteiosPersonagem.ponderado(allowedAttrs,id=>weights[id]);
          }
        }
      }
    }
  }

  // 11. Magias (se conjurador, tanto iniciais quanto de progressão)
  if(typeof spellPlan === 'function'){
    const plan = spellPlan();
    spellState().selections = spellState().selections || {};
    const classSchools = spellState().schools?.[cls.id] || [];
    for(const grp of plan.groups || []){
      if(grp.count > 0 && (grp.kind === 'class' || grp.kind === 'race')){
        const currentSelected = new Set(Object.values(spellState().selections).flat());
        const allowedSpells = (DATA.spells || []).filter(s => {
          if(currentSelected.has(s.id)) return false;
          if(grp.kind === 'class' && classSchools.length > 0 && !classSchools.includes(s.school)) return false;
          if(Number(s.circle) > (grp.maxCircle || 1)) return false;
          if(grp.type !== 'any' && s.type !== grp.type) return false;
          if(grp.schools?.length && !grp.schools.includes(s.school)) return false;
          if(typeof basicSpellAllowed === 'function'){
            // Cria cópia com schoolOpen=false para garantir fidelidade às escolas sorteadas
            const strictGroup = { ...grp, schoolOpen: false, schools: classSchools.length ? classSchools : grp.schools };
            if(!basicSpellAllowed(s, strictGroup, plan)) return false;
          }
          return true;
        });
        const needed = grp.count - (spellState().selections[grp.id]?.length || 0);
        if(needed > 0){
          const picked = pickRandomUnique(allowedSpells, needed).map(s => s.id);
          spellState().selections[grp.id] = [...(spellState().selections[grp.id] || []), ...picked];
        }
      }
    }
  }

  // 11.5 Parceiros & Aliados Especiais (se elegível por origem)
  state.partnerChoices = (state.partnerChoices && typeof state.partnerChoices === 'object') ? state.partnerChoices : {};
  const stdSlug = slug(state.origin?.standard || '');
  const regSlug = slug(state.origin?.regional || '');
  if (stdSlug.includes('ubaneri') || regSlug.includes('ubaneri')) {
    state.partnerChoices.alikunhaElement = state.partnerChoices.alikunhaElement || 'terra';
    state.partnerChoices.alikunhaType = state.partnerChoices.alikunhaType || 'combatente';
  }
  if ((state.origin?.benefits || []).includes('unique:antigo_mestre')) {
    state.partnerChoices.mestreType = state.partnerChoices.mestreType || 'ajudante';
  }
  if ((state.origin?.benefits || []).includes('unique:amigo_especial')) {
    state.partnerChoices.animalSkill = state.partnerChoices.animalSkill || 'percepcao';
  }
  if (typeof syncPartnersFromChoices === 'function') {
    syncPartnersFromChoices();
  }

  // 12. Finalização
  state.completed = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  state.step = 10;
  state.finished = true;
  state.sheetView = 'sheet';

  if(typeof saveFinishedCharacter === 'function') saveFinishedCharacter();
  if(typeof persistNow === 'function') persistNow();
  if(typeof renderStage === 'function') renderStage();
  if(typeof window !== 'undefined' && window.scrollTo) window.scrollTo({ top: 0, behavior: 'smooth' });
  if(typeof toast === 'function'){
    toast('Herói ' + state.identity.characterName + ' (' + race.nome + ' ' + cls.nome + ' nv. ' + targetLevel + ') forjado com sucesso!');
  }
}
if(typeof window!=='undefined')window.generateRandomCharacter=generateRandomCharacter;

// One replacement benefit, not an extra benefit on top of the origin's two.
const originOptionsBeforeSkillReplacement=originBenefitOptions;
function originReplacementAvailable(){
  const options=originOptionsBeforeSkillReplacement(selectedStandardOrigin()).filter(option=>option.type==='skill');
  const trained=new Set([...mandatoryClassSkills(),...(state.skills.class||[]),...(state.skills.race||[]),...(state.skills.int||[]),...regionalSkillIds()]);
  return options.length>=2&&options.every(option=>{
    const token=skillTokenFromName(option.name);
    return token!=='oficio'&&trained.has(token);
  });
}
function originReplacementId(){return (state.origin.benefits||[]).find(id=>id.startsWith('replacement-skill:'))||''}
originBenefitOptions=function(origin){
  const options=originOptionsBeforeSkillReplacement(origin),selected=originReplacementId();
  if(origin===selectedStandardOrigin()&&selected){
    const token=selected.slice('replacement-skill:'.length);
    options.push({id:selected,type:'skill',name:skillDisplayName(token),description:'Perícia livre em substituição às perícias da origem já treinadas.'});
  }
  return options;
};
const renderOriginsBeforeSkillReplacement=renderOrigins;
renderOrigins=function(){
  const html=renderOriginsBeforeSkillReplacement(),available=originReplacementAvailable(),selected=originReplacementId();
  if(!available&&!selected)return html;
  const trained=new Set([...mandatoryClassSkills(),...(state.skills.class||[]),...(state.skills.race||[]),...(state.skills.int||[]),...regionalSkillIds(),...originSkillIds()]);
  const choices=SKILLS.filter(([id])=>id!=='oficio').concat(OFFICES.map(([id])=>[officeToken(id),skillDisplayName(officeToken(id))]));
  return html+panel('Perícia livre da origem','<p class="help">As perícias da origem já estão treinadas. Você pode escolher uma perícia livre, consumindo um dos dois benefícios da origem.</p>'+
    (!available?'<p class="help">A substituição não está mais disponível. Remova esta escolha ou restaure os treinos anteriores.</p>':'')+
    '<label class="field"><span>Escolha uma perícia</span><select class="select" data-action="origin-replacement-skill"><option value="">Não usar substituição</option>'+choices.map(([id,name])=>{const key='replacement-skill:'+id;return '<option value="'+esc(key)+'" '+(selected===key?'selected':'')+' '+((!available||trained.has(id))&&selected!==key?'disabled':'')+'>'+esc(name)+'</option>'}).join('')+'</select></label>');
};
