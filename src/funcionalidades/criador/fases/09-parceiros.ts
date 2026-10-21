// Fase 9: Parceiros & Aliados Especiais

const PARTNER_CANONICAL_TYPES = [
  { id: 'ajudante', name: 'Ajudante', icon: '', desc: 'Auxilia em testes de perícia com conhecimento e destreza.', benefitIniciante: '+2 em uma perícia à sua escolha (exceto Luta e Pontaria).', benefitMestre: '+4 em uma perícia à sua escolha (ou +2 em duas).' },
  { id: 'assassino', name: 'Assassino', icon: '', desc: 'Especialista em emboscadas, pontos vitais e ataques letais.', benefitIniciante: '+1d6 de dano furtivo (ou +2 na margem de ameaça).', benefitMestre: '+3d6 de dano furtivo (ou +4 na margem de ameaça).' },
  { id: 'atirador', name: 'Atirador', icon: '', desc: 'Apoio tático com disparos precisos à distância.', benefitIniciante: '+2 em Pontaria e +2 no dano de ataques à distância.', benefitMestre: '+4 em Pontaria e +4 no dano de ataques à distância.' },
  { id: 'combatente', name: 'Combatente', icon: '', desc: 'Guerreiro dedicado na linha de frente corpo a corpo.', benefitIniciante: '+2 em Luta e +2 no dano em combate corpo a corpo.', benefitMestre: '+4 em Luta e +4 no dano em combate corpo a corpo.' },
  { id: 'curandeiro', name: 'Curandeiro / Médico', icon: '', desc: 'Presta primeiros socorros e cuida de ferimentos.', benefitIniciante: 'Recupera +1d6 PV ao final de cenas de ação ou descansos.', benefitMestre: 'Recupera +3d6 PV ao final de cenas ou estabiliza como ação livre.' },
  { id: 'destruidor', name: 'Destruidor', icon: '', desc: 'Causa destruição massiva e rompe defesas inimigas.', benefitIniciante: '+2d6 de dano em área ou contra objetos / estruturas.', benefitMestre: '+4d6 de dano em área ou golpe demolidor devastador.' },
  { id: 'fortao', name: 'Fortão', icon: '', desc: 'Aliado musculoso capaz de bloquear e derrubar adversários.', benefitIniciante: '+2 em manobras de combate e testes de Força.', benefitMestre: '+4 em manobras de combate e empurrões devastadores.' },
  { id: 'guardiao', name: 'Guardião', icon: '', desc: 'Protege você contra golpes e projéteis inimigos.', benefitIniciante: '+2 na sua Defesa.', benefitMestre: '+4 na sua Defesa e pode absorver um golpe crítico.' },
  { id: 'magivocador', name: 'Magivocador', icon: '', desc: 'Canalizador arcano e suporte místico auxiliar.', benefitIniciante: '+1 PM no seu teto e apoio em rituais místicos.', benefitMestre: '+3 PM no seu teto e reduz custo de 1 magia por cena em -1 PM.' },
  { id: 'montaria', name: 'Montaria', icon: '', desc: 'Corcel veloz ou fera de montaria treinada para batalha.', benefitIniciante: 'Deslocamento aumentado em +3m e bônus em investidas.', benefitMestre: 'Deslocamento aumentado em +6m e investida com atropelamento.' },
  { id: 'perseguidor', name: 'Perseguidor', icon: '', desc: 'Rastreador incansável e batedor experiente.', benefitIniciante: '+2 em Percepção e Sobrevivência; ignora camuflagem leve.', benefitMestre: '+4 em Percepção e Sobrevivência; visão perfeita contra camuflagem.' },
  { id: 'vigilante', name: 'Vigilante', icon: '', desc: 'Sentinela atenta que nunca dorme em serviço.', benefitIniciante: '+2 em Percepção e Iniciativa; não fica desprevenido.', benefitMestre: '+4 em Percepção e Iniciativa; imune a ataques de surpresa e flanqueamento.' }
];

const ALIKUNHA_ELEMENTS = {
  ar: {
    id: 'ar',
    name: 'Ar',
    title: 'Tempestade & Ventos',
    icon: '',
    color: 'var(--gold2)',
    bgGradient: 'linear-gradient(145deg, var(--surface2), var(--surface))',
    border: 'var(--border2)',
    desc: 'Espírito ágil como a brisa e cortante como a tempestade.',
    types: ['assassino', 'perseguidor', 'vigilante']
  },
  agua: {
    id: 'agua',
    name: 'Água',
    title: 'Marés & Serenidade',
    icon: '',
    color: 'var(--gold2)',
    bgGradient: 'linear-gradient(145deg, var(--surface2), var(--surface))',
    border: 'var(--border2)',
    desc: 'Espírito adaptável e restaurador que flui como as correntezas.',
    types: ['ajudante', 'guardiao', 'curandeiro']
  },
  fogo: {
    id: 'fogo',
    name: 'Fogo',
    title: 'Brasas & Combustão',
    icon: '',
    color: 'var(--gold2)',
    bgGradient: 'linear-gradient(145deg, var(--surface2), var(--surface))',
    border: 'var(--border2)',
    desc: 'Espírito fervoroso, destrutivo e implacável em batalha.',
    types: ['atirador', 'combatente', 'fortao']
  },
  terra: {
    id: 'terra',
    name: 'Terra',
    title: 'Montanhas & Firmeza',
    icon: '',
    color: 'var(--gold2)',
    bgGradient: 'linear-gradient(145deg, var(--surface2), var(--surface))',
    border: 'var(--border2)',
    desc: 'Espírito resistente e sólido como as rochas ancestrais.',
    types: ['combatente', 'guardiao', 'montaria']
  },
  luz: {
    id: 'luz',
    name: 'Luz',
    title: 'Radiância & Glória',
    icon: '',
    color: 'var(--gold2)',
    bgGradient: 'linear-gradient(145deg, var(--surface2), var(--surface))',
    border: 'var(--border2)',
    desc: 'Espírito iluminado que dissipa sombras e renova o vigor.',
    types: ['guardiao', 'curandeiro', 'vigilante']
  },
  trevas: {
    id: 'trevas',
    name: 'Trevas',
    title: 'Sombras & Mistério',
    icon: '',
    color: 'var(--gold2)',
    bgGradient: 'linear-gradient(145deg, var(--surface2), var(--surface))',
    border: 'var(--border2)',
    desc: 'Espírito enigmático que se funde à escuridão e manipula energias ocultas.',
    types: ['assassino', 'magivocador', 'perseguidor']
  }
};

function partnerTypeById(id){
  return PARTNER_CANONICAL_TYPES.find(t => t.id === id) || { id, name: id, icon: '', benefitIniciante: '', benefitMestre: '' };
}

function syncPartnersFromChoices(){
  ensureOriginPartners();
  state.partners = Array.isArray(state.partners) ? state.partners : [];
  state.partnerChoices = (state.partnerChoices && typeof state.partnerChoices === 'object') ? state.partnerChoices : {};

  const std = typeof selectedStandardOrigin === 'function' ? selectedStandardOrigin() : null;
  const reg = typeof selectedRegionalOrigin === 'function' ? selectedRegionalOrigin() : null;
  const stdSlug = slug(std?.nome || state.origin?.standard || '');
  const regSlug = slug(reg?.nome || state.origin?.regional || '');
  const isUbaneri = stdSlug.includes('ubaneri') || regSlug.includes('ubaneri');
  const isKami = stdSlug.includes('kami') || regSlug.includes('kami');
  const hasAntigoMestre = (state.origin?.benefits || []).includes('unique:antigo_mestre');
  const hasAmigoEspecial = (state.origin?.benefits || []).includes('unique:amigo_especial');

  // 1. Alikunhá
  if(isUbaneri){
    const elemId = state.partnerChoices.alikunhaElement || 'terra';
    const elemDef = ALIKUNHA_ELEMENTS[elemId] || ALIKUNHA_ELEMENTS.terra;
    const typeId = state.partnerChoices.alikunhaType || elemDef.types[0];
    const typeDef = partnerTypeById(typeId);
    const customName = (state.partnerChoices.alikunhaName || '').trim() || ('Alikunhá de ' + elemDef.name);

    let alik = state.partners.find(p => p.id === 'alikunha');
    if(!alik){
      alik = { id: 'alikunha', origem: isUbaneri ? (reg?.nome || 'Andarilho Ubaneri') : 'Andarilho Ubaneri', countsTowardsLimit: false, ignoraLimite: true };
      state.partners.push(alik);
    }
    alik.nome = customName;
    alik.tipo = 'alikunha';
    alik.elemento = elemId;
    alik.partnerType = typeDef.name;
    alik.grau = 'iniciante';
    alik.tier = 'iniciante';
    alik.countsTowardsLimit = false;
    alik.ignoraLimite = true;
    alik.descricao = 'Companheiro Alikunhá de ' + elemDef.name + ' (' + elemDef.title + '). Não conta no limite de parceiros.';
    alik.benefit = typeDef.benefitIniciante;
  } else {
    state.partners = state.partners.filter(p => p.id !== 'alikunha');
  }

  // 2. Antigo Mestre
  if(hasAntigoMestre){
    const typeId = state.partnerChoices.mestreType || 'combatente';
    const typeDef = partnerTypeById(typeId);
    const customName = (state.partnerChoices.mestreName || '').trim() || 'Antigo Mestre';

    let mestre = state.partners.find(p => p.id === 'antigo_mestre');
    if(!mestre){
      mestre = { id: 'antigo_mestre', origem: 'Seguidor (Antigo Mestre)', countsTowardsLimit: false, ignoraLimite: true };
      state.partners.push(mestre);
    }
    mestre.nome = customName;
    mestre.tipo = 'mestre';
    mestre.partnerType = typeDef.name;
    mestre.grau = 'mestre';
    mestre.tier = 'mestre';
    mestre.countsTowardsLimit = false;
    mestre.ignoraLimite = true;
    mestre.descricao = 'Seu antigo mestre surge 1x por aventura durante uma cena inteira. Não conta no limite de parceiros.';
    mestre.benefit = typeDef.benefitMestre;
  } else {
    state.partners = state.partners.filter(p => p.id !== 'antigo_mestre');
  }

  // 3. Amigo Especial
  if(hasAmigoEspecial){
    const skillId = state.partnerChoices.animalSkill || 'percepcao';
    const skillName = SKILL_LABEL[skillId] || skillId;
    const customName = (state.partnerChoices.animalName || '').trim() || 'Companheiro Animal';

    let pet = state.partners.find(p => p.id === 'amigo_especial');
    if(!pet){
      pet = { id: 'amigo_especial', origem: 'Amigo dos Animais (Amigo Especial)', countsTowardsLimit: false, ignoraLimite: true };
      state.partners.push(pet);
    }
    pet.nome = customName;
    pet.tipo = 'animal';
    pet.partnerType = 'Ajudante (' + skillName + ')';
    pet.grau = 'iniciante';
    pet.tier = 'iniciante';
    pet.pericia = skillId;
    pet.countsTowardsLimit = false;
    pet.ignoraLimite = true;
    pet.descricao = 'Animal de estimação fiel. Concede +5 em testes de Adestramento com animais e +2 em ' + skillName + '. Não conta no limite de parceiros.';
    pet.benefit = '+2 em ' + skillName + ' e +5 em Adestramento com animais.';
  } else {
    state.partners = state.partners.filter(p => p.id !== 'amigo_especial');
  }

  // 4. Um com os Kami
  if(isKami){
    const customName = (state.partnerChoices.kamiName || '').trim() || 'Kami Espiritual';
    let kami = state.partners.find(p => p.id === 'um_com_os_kami');
    if(!kami){
      kami = { id: 'um_com_os_kami', origem: 'Um com os Kami', countsTowardsLimit: false, ignoraLimite: true };
      state.partners.push(kami);
    }
    kami.nome = customName;
    kami.tipo = 'kami';
    kami.partnerType = 'Espiritual';
    kami.grau = 'especial';
    kami.tier = 'especial';
    kami.countsTowardsLimit = false;
    kami.ignoraLimite = true;
    kami.descricao = 'Kami incorpóreo e invisível. Permite ver criaturas invisíveis/incorpóreas, ataques afetam como mágicos e manipula objetos a alcance curto por 1 PM. Não conta no limite de parceiros.';
    kami.benefit = 'Vê criaturas incorpóreas e invisíveis; ataques e habilidades contam como mágicos; ação de movimento por 1 PM para manipular objeto.';
  } else {
    state.partners = state.partners.filter(p => p.id !== 'um_com_os_kami');
  }

  // 5. Tumarkhân (Ginete de Tumarkhân)
  const isTumarkhan = stdSlug.includes('tumarkhan') || regSlug.includes('tumarkhan');
  if(isTumarkhan){
    const customName = (state.partnerChoices.tumarkhanName || '').trim() || 'Tumarkhân';
    let tum = state.partners.find(p => p.id === 'tumarkhan');
    if(!tum){
      tum = { id: 'tumarkhan', origem: 'Ginete de Tumarkhân', countsTowardsLimit: false, ignoraLimite: true };
      state.partners.push(tum);
    }
    tum.nome = customName;
    tum.tipo = 'tumarkhan';
    tum.partnerType = 'Montaria';
    tum.grau = 'iniciante';
    tum.tier = 'iniciante';
    tum.countsTowardsLimit = false;
    tum.ignoraLimite = true;
    tum.descricao = 'Parceiro Tumarkhân iniciante. Concede +2 em testes de Adestramento e Cavalgar. Não conta no limite de parceiros.';
    tum.benefit = 'Montaria iniciante (+2 em Adestramento e Cavalgar).';
  } else {
    state.partners = state.partners.filter(p => p.id !== 'tumarkhan');
  }

  // 6. Irmão Cavalo (Irmão sem Esporas)
  const isIrmao = stdSlug.includes('irmao_sem_esporas') || regSlug.includes('irmao_sem_esporas');
  if(isIrmao){
    const customName = (state.partnerChoices.irmaoCavaloName || '').trim() || 'Irmão Cavalo';
    let cav = state.partners.find(p => p.id === 'irmao_cavalo');
    if(!cav){
      cav = { id: 'irmao_cavalo', origem: 'Irmão sem Esporas', countsTowardsLimit: false, ignoraLimite: true };
      state.partners.push(cav);
    }
    cav.nome = customName;
    cav.tipo = 'irmao_cavalo';
    cav.partnerType = 'Montaria';
    cav.grau = 'iniciante';
    cav.tier = 'iniciante';
    cav.countsTowardsLimit = false;
    cav.ignoraLimite = true;
    cav.descricao = 'Cavalo de guerra irmão das estepes. Concede +1 em testes de ataque e +1 em Reflexos. Não conta no limite de parceiros.';
    cav.benefit = 'Montaria iniciante (+1 em testes de ataque e +1 em Reflexos).';
  } else {
    state.partners = state.partners.filter(p => p.id !== 'irmao_cavalo');
  }

  // 7. Grifo Iniciante (Recruta da Fênix)
  const isRecruta = stdSlug.includes('recruta_da_fenix') || regSlug.includes('recruta_da_fenix');
  if(isRecruta){
    const customName = (state.partnerChoices.grifoName || '').trim() || 'Grifo Iniciante';
    let grif = state.partners.find(p => p.id === 'grifo_iniciante');
    if(!grif){
      grif = { id: 'grifo_iniciante', origem: 'Recruta da Fênix', countsTowardsLimit: false, ignoraLimite: true };
      state.partners.push(grif);
    }
    grif.nome = customName;
    grif.tipo = 'grifo_iniciante';
    grif.partnerType = 'Montaria';
    grif.grau = 'iniciante';
    grif.tier = 'iniciante';
    grif.countsTowardsLimit = false;
    grif.ignoraLimite = true;
    grif.descricao = 'Jovem grifo montaria da Ordem da Fênix. Concede +1 PV por nível e redução de fogo 5. Não conta no limite de parceiros.';
    grif.benefit = 'Montaria iniciante (+1 PV por nível e RD fogo 5).';
  } else {
    state.partners = state.partners.filter(p => p.id !== 'grifo_iniciante');
  }

  // 8. Familiar Elemental (Poder Concedido de Wynna / Poder Geral)
  const hasFamElem = typeof hasFamiliarElementalPower === 'function' && hasFamiliarElementalPower();
  if(hasFamElem){
    const opt = typeof getSelectedElementalFamiliarOption === 'function' ? getSelectedElementalFamiliarOption() : null;
    const choiceName = opt ? (opt.shortName || opt.name) : 'T’peel';
    const customName = (state.partnerChoices.familiarElementalName || '').trim() || `Familiar Elemental: ${choiceName}`;
    let fam = state.partners.find(p => p.id === 'familiar_elemental');
    if(!fam){
      fam = { id: 'familiar_elemental', origem: 'Familiar Elemental', countsTowardsLimit: true, ignoraLimite: false };
      state.partners.push(fam);
    }
    fam.nome = customName;
    fam.name = customName;
    fam.tipo = 'familiar_elemental';
    fam.partnerType = 'Familiar Elemental';
    fam.grau = 'iniciante';
    fam.tier = 'iniciante';
    fam.countsTowardsLimit = true;
    fam.ignoraLimite = false;
    fam.descricao = opt ? opt.description : 'Parceiro espírito arcano.';
    fam.benefit = opt ? opt.description : 'Escolha entre Parceiro Adepto Iniciante, Aquin\'ne, T\'peel, Pakk ou Terrier.';
  } else {
    state.partners = state.partners.filter(p => p.id !== 'familiar_elemental');
  }
}

function partnerMissingChoices(){
  syncPartnersFromChoices();
  const missing = [];
  const std = typeof selectedStandardOrigin === 'function' ? selectedStandardOrigin() : null;
  const reg = typeof selectedRegionalOrigin === 'function' ? selectedRegionalOrigin() : null;
  const stdSlug = slug(std?.nome || state.origin?.standard || '');
  const regSlug = slug(reg?.nome || state.origin?.regional || '');
  const isUbaneri = stdSlug.includes('ubaneri') || regSlug.includes('ubaneri');
  const hasAntigoMestre = (state.origin?.benefits || []).includes('unique:antigo_mestre');
  const hasAmigoEspecial = (state.origin?.benefits || []).includes('unique:amigo_especial');

  if(isUbaneri){
    if(!state.partnerChoices.alikunhaElement){
      missing.push({ title: 'Elemento do Alikunhá', message: 'Escolha um dos 6 elementos da natureza para o seu parceiro Alikunhá.', selector: '.alikunha-element-grid', step: 9 });
    }
    if(!state.partnerChoices.alikunhaType){
      missing.push({ title: 'Papel do Alikunhá', message: 'Escolha um dos 3 papéis disponíveis para o elemento do seu Alikunhá.', selector: '.alikunha-type-grid', step: 9 });
    }
  }

  if(hasAntigoMestre && !state.partnerChoices.mestreType){
    missing.push({ title: 'Tipo do Antigo Mestre', message: 'Escolha o tipo de parceiro Mestre concedido pelo seu Antigo Mestre.', selector: '.mestre-type-grid', step: 9 });
  }

  if(hasAmigoEspecial && !state.partnerChoices.animalSkill){
    missing.push({ title: 'Perícia do Amigo Especial', message: 'Escolha a perícia beneficiada (+2) pelo seu parceiro animal.', selector: '#amigoEspecialSkillSelect', step: 9 });
  }

  if(typeof hasFamiliarElementalPower === 'function' && hasFamiliarElementalPower()){
    const chosenId = typeof getSelectedElementalFamiliarId === 'function' ? getSelectedElementalFamiliarId() : '';
    if(!chosenId){
      missing.push({ title: 'Familiar Elemental', message: 'Escolha entre o Parceiro Adepto Iniciante ou um dos 4 familiares elementais (Aquin\'ne, T\'peel, Pakk ou Terrier).', selector: '[data-action="select-familiar-elemental-choice"]', step: 9 });
    }
  }

  return missing;
}

function renderPartnerStage(){
  syncPartnersFromChoices();
  const std = typeof selectedStandardOrigin === 'function' ? selectedStandardOrigin() : null;
  const reg = typeof selectedRegionalOrigin === 'function' ? selectedRegionalOrigin() : null;
  const stdSlug = slug(std?.nome || state.origin?.standard || '');
  const regSlug = slug(reg?.nome || state.origin?.regional || '');
  const isUbaneri = stdSlug.includes('ubaneri') || regSlug.includes('ubaneri');
  const isKami = stdSlug.includes('kami') || regSlug.includes('kami');
  const hasAntigoMestre = (state.origin?.benefits || []).includes('unique:antigo_mestre');
  const hasAmigoEspecial = (state.origin?.benefits || []).includes('unique:amigo_especial');

  let html = '';

  html += '<div class="info-box" style="margin-bottom:16px;">' +
    '<strong>Companheiros e Aliados Especiais:</strong> ' +
    'Seus poderes e origens concedem parceiros leais que o acompanham em sua jornada. ' +
    '<em>Parceiros concedidos por origens especiais não contam no seu limite regular de parceiros.</em>' +
    '</div>';

  if(isUbaneri){
    const selElem = state.partnerChoices.alikunhaElement || 'terra';
    const elemDef = ALIKUNHA_ELEMENTS[selElem] || ALIKUNHA_ELEMENTS.terra;
    const selType = state.partnerChoices.alikunhaType || elemDef.types[0];
    const petName = state.partnerChoices.alikunhaName || '';

    let elemButtons = Object.values(ALIKUNHA_ELEMENTS).map(el => {
      const active = el.id === selElem ? ' active' : '';
      return '<button type="button" class="alikunha-elem-btn' + active + '" data-action="select-alikunha-element" data-element="' + el.id + '">' +
        '<span class="elem-name">' + esc(el.name) + '</span>' +
        '<small class="elem-sub">' + esc(el.title) + '</small>' +
        '</button>';
    }).join('');

    let typeCards = elemDef.types.map(tId => {
      const pType = partnerTypeById(tId);
      const active = tId === selType ? ' selected' : '';
      return '<div class="partner-choice-card' + active + '" data-action="select-alikunha-type" data-type="' + tId + '">' +
        '<div class="partner-choice-head">' +
        '<h4>' + esc(pType.name) + '</h4>' +
        '<span class="badge">Grau Iniciante</span>' +
        '</div>' +
        '<p class="partner-choice-desc">' + esc(pType.desc) + '</p>' +
        '<div class="partner-choice-benefit">' +
        '<strong>Bônus:</strong> ' + esc(pType.benefitIniciante) +
        '</div>' +
        '</div>';
    }).join('');

    html += panel('Alikunhá de Ubani',
      '<p class="help" style="margin-bottom:12px;">Selecione o <strong>Elemento da Natureza</strong> e o <strong>Papel de Combate</strong> (3 opções em destaque) do seu Alikunhá:</p>' +
      '<div class="alikunha-element-grid">' + elemButtons + '</div>' +
      '<div class="alikunha-selected-panel">' +
      '<div class="alikunha-selected-header">' +
      '<div>' +
      '<h4 class="alikunha-selected-title">Alikunhá do ' + esc(elemDef.name) + ' — ' + esc(elemDef.title) + '</h4>' +
      '<small class="alikunha-selected-sub">' + esc(elemDef.desc) + '</small>' +
      '</div>' +
      '<div style="min-width:220px;">' +
      '<label class="field" style="margin:0;">' +
      '<span>Nome do seu Alikunhá</span>' +
      '<input type="text" class="input" data-action="alikunha-name" placeholder="Ex: Zul, Brisa, Trovão..." value="' + esc(petName) + '">' +
      '</label>' +
      '</div>' +
      '</div>' +
      '<div class="partner-choice-grid-3">' + typeCards + '</div>' +
      '</div>',
      'Origem: ' + esc(reg?.nome || 'Andarilho Ubaneri')
    );
  }

  if(hasAntigoMestre){
    const selType = state.partnerChoices.mestreType || 'combatente';
    const mestreName = state.partnerChoices.mestreName || '';

    let mestreCards = PARTNER_CANONICAL_TYPES.map(pType => {
      const active = pType.id === selType ? ' selected' : '';
      return '<div class="partner-choice-card' + active + '" data-action="select-mestre-type" data-type="' + pType.id + '">' +
        '<div class="partner-choice-head">' +
        '<h4>' + esc(pType.name) + '</h4>' +
        '<span class="badge gold">Grau Mestre</span>' +
        '</div>' +
        '<p class="partner-choice-desc">' + esc(pType.desc) + '</p>' +
        '<div class="partner-choice-benefit">' +
        '<strong>Bônus de Mestre:</strong> ' + esc(pType.benefitMestre) +
        '</div>' +
        '</div>';
    }).join('');

    html += panel('Antigo Mestre (Grau Mestre)',
      '<div class="info-box" style="margin-bottom:12px;">' +
      'Você ainda mantém contato com o veterano que serviu. Uma vez por aventura, ele surge para ajudá-lo por uma cena inteira como um <strong>Parceiro Mestre</strong>!' +
      '</div>' +
      '<div style="margin-bottom:14px;max-width:360px;">' +
      '<label class="field">' +
      '<span>Nome do seu Antigo Mestre / Mentor</span>' +
      '<input type="text" class="input" data-action="mestre-name" placeholder="Ex: Mestre Corvus, Grão-Mestre Sean..." value="' + esc(mestreName) + '">' +
      '</label>' +
      '</div>' +
      '<p class="help" style="margin-bottom:10px;">Escolha a especialidade do seu Antigo Mestre dentre os 12 tipos canônicos de Arton:</p>' +
      '<div class="partner-choice-grid-3">' + mestreCards + '</div>',
      'Poder Único: Antigo Mestre'
    );
  }

  if(hasAmigoEspecial){
    const selSkill = state.partnerChoices.animalSkill || 'percepcao';
    const petName = state.partnerChoices.animalName || '';

    const allowedSkills = SKILLS.filter(s => !['luta', 'pontaria'].includes(s[0]));
    const skillOptions = allowedSkills.map(s => '<option value="' + s[0] + '" ' + (s[0] === selSkill ? 'selected' : '') + '>' + esc(s[1]) + ' (' + s[2].toUpperCase() + ')</option>').join('');

    html += panel('Companheiro Animal (Amigo Especial)',
      '<div class="info-box" style="margin-bottom:12px;">' +
      'Você recebe <strong>+5 em testes de Adestramento</strong> com animais e possui um parceiro animal fiel que fornece <strong>+2 em uma perícia à sua escolha</strong> (exceto Luta ou Pontaria).' +
      '</div>' +
      '<div class="grid two" style="margin-top:12px;">' +
      '<label class="field">' +
      '<span>Nome do Companheiro Animal</span>' +
      '<input type="text" class="input" data-action="animal-name" placeholder="Ex: Lobo Cinzento, Belinha, Falcão..." value="' + esc(petName) + '">' +
      '</label>' +
      '<label class="field">' +
      '<span>Perícia com Bônus (+2)</span>' +
      '<select class="select" id="amigoEspecialSkillSelect" data-action="select-animal-skill">' + skillOptions + '</select>' +
      '</label>' +
      '</div>',
      'Poder Único: Amigo Especial'
    );
  }

  if(isKami){
    const kamiName = state.partnerChoices.kamiName || '';
    html += panel('Kami Espiritual (Um com os Kami)',
      '<div class="info-box" style="margin-bottom:12px;">' +
      'Você é acompanhado por um <strong>kami incorpóreo e invisível</strong>. Ele permite ver criaturas invisíveis e incorpóreas, e faz com que seus ataques e habilidades contem como mágicos. Além disso, você pode gastar 1 PM como ação de movimento para manipular um objeto solto em alcance curto.' +
      '</div>' +
      '<div style="max-width:360px;margin-top:12px;">' +
      '<label class="field">' +
      '<span>Nome do seu Kami Espiritual</span>' +
      '<input type="text" class="input" data-action="kami-name" placeholder="Ex: Kami da Névoa, Shiro, Guardião..." value="' + esc(kamiName) + '">' +
      '</label>' +
      '</div>',
      'Origem Regional: Um com os Kami'
    );
  }

  const isTumarkhan = stdSlug.includes('tumarkhan') || regSlug.includes('tumarkhan');
  if(isTumarkhan){
    const tumName = state.partnerChoices.tumarkhanName || '';
    html += panel('Montaria: Tumarkhân Iniciante',
      '<div class="info-box" style="margin-bottom:12px;">' +
      '<strong>Montaria Tumarkhân:</strong> Você possui um parceiro tumarkhân iniciante (montaria), com quem recebe +2 em testes de Adestramento e Cavalgar. Se receber outra montaria especial (como por Montaria ou Montaria Sagrada), pode usar seu tumarkhân como essa montaria, acumulando os bônus.' +
      '</div>' +
      '<div style="max-width:360px;margin-top:12px;">' +
      '<label class="field">' +
      '<span>Nome do seu Tumarkhân</span>' +
      '<input type="text" class="input" data-action="tumarkhan-name" placeholder="Ex: Escama de Ferro, Rastejador..." value="' + esc(tumName) + '">' +
      '</label>' +
      '</div>',
      'Origem Regional: Ginete de Tumarkhân'
    );
  }

  const isIrmaoCavalo = stdSlug.includes('irmao_sem_esporas') || regSlug.includes('irmao_sem_esporas');
  if(isIrmaoCavalo){
    const cavName = state.partnerChoices.irmaoCavaloName || '';
    html += panel('Montaria: Irmão Cavalo',
      '<div class="info-box" style="margin-bottom:12px;">' +
      '<strong>Irmão Cavalo:</strong> Você possui um cavalo de guerra parceiro iniciante que fornece +1 em testes de ataque e Reflexos. Se receber outra montaria especial (como por Montaria ou Montaria Sagrada), pode usar seu irmão cavalo como essa montaria, acumulando o bônus em perícias.' +
      '</div>' +
      '<div style="max-width:360px;margin-top:12px;">' +
      '<label class="field">' +
      '<span>Nome do seu Irmão Cavalo</span>' +
      '<input type="text" class="input" data-action="irmao-cavalo-name" placeholder="Ex: Ventania, Trovão, Alazão..." value="' + esc(cavName) + '">' +
      '</label>' +
      '</div>',
      'Origem Regional: Irmão sem Esporas'
    );
  }

  const isRecrutaFenix = stdSlug.includes('recruta_da_fenix') || regSlug.includes('recruta_da_fenix');
  if(isRecrutaFenix){
    const grifoName = state.partnerChoices.grifoName || '';
    html += panel('Montaria: Grifo da Ordem da Fênix',
      '<div class="info-box" style="margin-bottom:12px;">' +
      '<strong>Grifo da Fênix:</strong> Um jovem grifo montaria da famosa cavalaria de Yuden. Concede +1 PV por nível e redução de fogo 5. Não conta no seu limite regular de parceiros.' +
      '</div>' +
      '<div style="max-width:360px;margin-top:12px;">' +
      '<label class="field">' +
      '<span>Nome do seu Grifo</span>' +
      '<input type="text" class="input" data-action="grifo-name" placeholder="Ex: Fulgor, Solar, Fênix..." value="' + esc(grifoName) + '">' +
      '</label>' +
      '</div>',
      'Origem Regional: Recruta da Fênix'
    );
  }

  if(typeof hasFamiliarElementalPower === 'function' && hasFamiliarElementalPower() && typeof renderElementalFamiliarChoicePanel === 'function'){
    html += renderElementalFamiliarChoicePanel();
  }

  if(state.partners.length > 0){
    const partnerBadges = state.partners.map(p => {
      const countsTowardsLimit = p.countsTowardsLimit !== false && !p.ignoraLimite;
      const limitBadge = countsTowardsLimit
        ? '<span class="badge">Conta no limite</span>'
        : '<span class="badge">Não conta no limite</span>';
      return '<div class="partner-active-card">' +
        '<div class="partner-active-head">' +
        '<strong class="partner-active-title">' + esc(p.nome) + '</strong>' +
        limitBadge +
        '</div>' +
        '<div class="partner-active-meta"><strong>Tipo / Grau:</strong> ' + esc(p.partnerType || p.tipo) + ' (' + esc(p.grau || 'Iniciante') + ') · <em>' + esc(p.origem || 'Especial') + '</em></div>' +
        '<div class="partner-active-desc">' + esc(p.benefit || p.descricao) + '</div>' +
        '</div>';
    }).join('');

    html += panel('Parceiros Ativos na Ficha',
      '<div class="partner-active-grid">' + partnerBadges + '</div>',
      'Total: ' + state.partners.length + ' parceiro(s)'
    );
  }

  return html;
}

// Event listeners da Fase 9
document.addEventListener('click', event => {
  if (state.step !== 9) return;

  const elemBtn = event.target.closest?.('[data-action="select-alikunha-element"]');
  if (elemBtn) {
    event.preventDefault();
    const elId = elemBtn.dataset.element;
    state.partnerChoices = state.partnerChoices || {};
    state.partnerChoices.alikunhaElement = elId;
    const def = ALIKUNHA_ELEMENTS[elId];
    if (def && !def.types.includes(state.partnerChoices.alikunhaType)) {
      state.partnerChoices.alikunhaType = def.types[0];
    }
    syncPartnersFromChoices();
    persistNow();
    renderStage();
    return;
  }

  const typeCard = event.target.closest?.('[data-action="select-alikunha-type"]');
  if (typeCard) {
    event.preventDefault();
    state.partnerChoices = state.partnerChoices || {};
    state.partnerChoices.alikunhaType = typeCard.dataset.type;
    syncPartnersFromChoices();
    persistNow();
    renderStage();
    return;
  }

  const mestreCard = event.target.closest?.('[data-action="select-mestre-type"]');
  if (mestreCard) {
    event.preventDefault();
    state.partnerChoices = state.partnerChoices || {};
    state.partnerChoices.mestreType = mestreCard.dataset.type;
    syncPartnersFromChoices();
    persistNow();
    renderStage();
    return;
  }
});

document.addEventListener('input', event => {
  if (state.step !== 9) return;
  state.partnerChoices = state.partnerChoices || {};

  const alikName = event.target.closest?.('[data-action="alikunha-name"]');
  if (alikName) {
    state.partnerChoices.alikunhaName = alikName.value;
    syncPartnersFromChoices();
    persist();
    return;
  }

  const mestreName = event.target.closest?.('[data-action="mestre-name"]');
  if (mestreName) {
    state.partnerChoices.mestreName = mestreName.value;
    syncPartnersFromChoices();
    persist();
    return;
  }

  const animalName = event.target.closest?.('[data-action="animal-name"]');
  if (animalName) {
    state.partnerChoices.animalName = animalName.value;
    syncPartnersFromChoices();
    persist();
    return;
  }

  const kamiName = event.target.closest?.('[data-action="kami-name"]');
  if (kamiName) {
    state.partnerChoices.kamiName = kamiName.value;
    syncPartnersFromChoices();
    persist();
    return;
  }

  const tumName = event.target.closest?.('[data-action="tumarkhan-name"]');
  if (tumName) {
    state.partnerChoices = (state.partnerChoices && typeof state.partnerChoices === 'object') ? state.partnerChoices : {};
    state.partnerChoices.tumarkhanName = tumName.value;
    syncPartnersFromChoices();
    persist();
    return;
  }

  const irmaoName = event.target.closest?.('[data-action="irmao-cavalo-name"]');
  if (irmaoName) {
    state.partnerChoices = (state.partnerChoices && typeof state.partnerChoices === 'object') ? state.partnerChoices : {};
    state.partnerChoices.irmaoCavaloName = irmaoName.value;
    syncPartnersFromChoices();
    persist();
    return;
  }

  const grifoInput = event.target.closest?.('[data-action="grifo-name"]');
  if (grifoInput) {
    state.partnerChoices = (state.partnerChoices && typeof state.partnerChoices === 'object') ? state.partnerChoices : {};
    state.partnerChoices.grifoName = grifoInput.value;
    syncPartnersFromChoices();
    persist();
    return;
  }
});

document.addEventListener('change', event => {
  if (state.step !== 9) return;
  const selSkill = event.target.closest?.('[data-action="select-animal-skill"]');
  if (selSkill) {
    state.partnerChoices = state.partnerChoices || {};
    state.partnerChoices.animalSkill = selSkill.value;
    syncPartnersFromChoices();
    persistNow();
    renderStage();
    return;
  }
});

// Listener do botão de avanço/finalização na Fase 9
document.addEventListener('click', event => {
  if (state.step !== 9 || !event.target.closest?.('#nextButton, #stepNextButton')) return;
  event.preventDefault();
  event.stopImmediatePropagation();

  const missing = partnerMissingChoices();
  if (missing.length > 0) {
    toast('Pendência nos parceiros: ' + missing[0].message, 'warning');
    if (missing[0].selector) {
      document.querySelector(missing[0].selector)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return;
  }

  if (!state.completed.includes(9)) state.completed.push(9);

  // Se estiver em Treino de Poder (state.isTrainingPowerProgression)
  if (state.isTrainingPowerProgression) {
    const active = typeof progressionActivePowerIndex === 'function' ? progressionActivePowerIndex() : -1;
    const row = active >= 0 ? state.progression[active] : null;
    const candidate = row ? (typeof progressionPowerById === 'function' ? progressionPowerById(row.previewPowerId || row.powerId) : null) : null;
    const verdict = (candidate && typeof progressionPowerVerdict === 'function') ? progressionPowerVerdict(candidate, active) : null;
    const readyToConfirm = Boolean(row?.previewPowerId && verdict?.ok && (!['classe_aumento_de_atributo', 'arcanista_familiar', 'arcanista_familiar_aprimorado'].includes(candidate?.id) || row.previewPowerChoice));
    const hasConfirmedPower = Boolean(row?.powerId && (!row?.previewPowerId || row.previewPowerId === row.powerId));

    if (!readyToConfirm && !hasConfirmedPower) {
      state.step = 10;
      persistNow();
      renderStage();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast('Parceiro confirmado! Escolha agora o poder para o treino na progressão.');
      return;
    }

    if (row && row.previewPowerId) {
      row.powerId = row.previewPowerId;
      row.powerChoice = row.previewPowerChoice || '';
      row.previewPowerId = '';
    }
    const chosenId = row ? row.powerId : '';
    const chosenChoice = row ? (row.powerChoice || '') : '';
    const originalLevel = Number(state.trainingPowerBefore?.identity?.plannedLevel) || Math.max(1, (Number(state.identity?.plannedLevel) || 2) - 1);
    state.progression = state.progression.slice(0, originalLevel);
    state.identity.plannedLevel = originalLevel;
    state.levelTraining = state.levelTraining || {};
    state.levelTraining.power = true;
    state.levelTraining.selectedPowerId = chosenId;
    state.levelTraining.nextPowerId = chosenId;
    state.levelTraining.selectedPowerChoice = chosenChoice;
    state.levelTraining.nextPowerChoice = chosenChoice;
    delete state.isTrainingPowerProgression;
    delete state.trainingPowerBefore;
    state.isEditingFinishedSheet = false;
    state.finished = true;
    state.sheetView = 'sheet';
    persistNow();
    if (typeof saveFinishedCharacter === 'function') saveFinishedCharacter();
    if (typeof window !== 'undefined' && window.location?.pathname && (window.location.pathname.endsWith('/criador.html') || window.location.pathname.endsWith('criador.html'))) {
      window.location.href = 'ficha.html';
      return;
    }
    if (typeof renderStage === 'function') renderStage();
    if (typeof toast === 'function') toast('Treino de Poder concluído! O poder foi adiantado na ficha.');
    return;
  }

  // Se a fase 10 (Progressão) for pulada (nível 1), finaliza a ficha!
  const skipProgression = typeof shouldSkipPhase === 'function' && shouldSkipPhase(10);
  if (skipProgression) {
    const overallMissing = typeof characterPendingChoices === 'function' ? characterPendingChoices() : [];
    if (overallMissing.length > 0) {
      const first = overallMissing[0];
      toast('Pendência na ficha: ' + first.message, 'warning');
      if (first.step && first.step !== 9) {
        state.step = first.step;
        renderStage();
      }
      return;
    }
    if (typeof finishCharacterCreation === 'function') {
      finishCharacterCreation();
    } else {
      if (!state.completed.includes(10)) state.completed.push(10);
      state.finished = true;
      state.sheetView = 'sheet';
      persistNow();
      if (typeof saveFinishedCharacter === 'function') saveFinishedCharacter();
      renderStage();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    toast('Todas as escolhas concluídas! Ficha do herói forjada com sucesso.');
    return;
  }

  // Se nível 2+, avança para Fase 10 (Progressão)
  state.step = 10;
  persistNow();
  renderStage();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}, true);

// Encadeamento de validação para Fase 9
if (typeof phaseIsComplete === 'function') {
  const basePhaseIsComplete = phaseIsComplete;
  phaseIsComplete = function(step){
    if (step === 9) return partnerMissingChoices().length === 0;
    return basePhaseIsComplete(step);
  };
}
if (typeof missingChoices === 'function') {
  const baseMissingChoices = missingChoices;
  missingChoices = function(step){
    if (step === 9) return partnerMissingChoices();
    return baseMissingChoices(step);
  };
}
if (typeof validationMessage === 'function') {
  const baseValidationMessage = validationMessage;
  validationMessage = function(step, short=false){
    if (step === 9) return partnerMissingChoices().length ? 'Conclua as escolhas do parceiro.' : (short ? 'Etapa pronta para continuar.' : 'Parceiros definidos.');
    return baseValidationMessage(step, short);
  };
}
