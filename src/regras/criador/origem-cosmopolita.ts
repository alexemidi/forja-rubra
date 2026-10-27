// Benefício da Origem Regional Cosmopolita (Valkaria):
// "Escolha um poder geral ou de uma classe na qual você tenha pelo menos dois níveis,
// e cujos requisitos você cumpra (exceto poderes concedidos ou da Tormenta).
// Você recebe esse poder. Uma vez por aventura, após concluir um descanso (oito horas de sono), pode trocar esse poder por outro."

function hasCosmopolita(){
  const reg = typeof selectedRegionalOrigin === 'function' ? selectedRegionalOrigin() : null;
  const name = reg?.nome || (state.origin?.mode === 'dual' ? state.origin?.regional : state.origin?.standard) || '';
  return slug(name) === 'cosmopolita';
}

function cosmopolitaClassLevels(){
  const levels: Record<string, number> = {};
  if (Array.isArray(state.progression) && state.progression.length > 0) {
    for (const row of state.progression) {
      if (row?.classId) levels[row.classId] = (levels[row.classId] || 0) + 1;
    }
  } else if (state.identity?.classId) {
    const planned = Math.max(1, Number(state.identity.plannedLevel || 1));
    levels[state.identity.classId] = planned;
  }
  return levels;
}

function cosmopolitaGeneralPowerEligibility(power){
  if (!power) return { ok: false, reasons: ['Poder não encontrado.'] };
  if (['concedido', 'tormenta', 'raca', 'grupo', 'escolhido_dos_deuses'].includes(power.categoria)) {
    return { ok: false, reasons: ['Origem Cosmopolita não permite poderes concedidos, raciais ou da Tormenta.'] };
  }
  const verdict = typeof generalPowerEligibility === 'function' ? generalPowerEligibility(power) : { ok: true, reasons: [] };
  const reasons = [...(verdict.reasons || [])];
  const currentGeneral = (state.powers?.general || []).filter(Boolean);
  if (currentGeneral.includes(power.id)) {
    reasons.push('Este poder já foi escolhido em outro espaço.');
  }
  return { ok: reasons.length === 0, reasons };
}

function cosmopolitaClassPowerEligibility(power, classId, classLevel){
  if (!power) return { ok: false, reasons: ['Poder não encontrado.'] };
  const requirements = typeof parsePowerRequirements === 'function' ? parsePowerRequirements(power) : { level: 0, attrs: [], skills: [] };
  const reasons = [];
  const attrs = typeof finalAttrs === 'function' ? finalAttrs() : {};
  const trained = new Set(typeof allTrainedSkills === 'function' ? allTrainedSkills() : []);
  const attrLabel = typeof ATTR_LABEL !== 'undefined' ? (id => ATTR_LABEL[id] || id) : (id => id);
  const skillName = typeof skillDisplayName === 'function' ? skillDisplayName : (id => id);

  if (typeof RegrasProgressao !== 'undefined' && typeof RegrasProgressao.requisitosBasicos === 'function') {
    reasons.push(...RegrasProgressao.requisitosBasicos(requirements, classLevel, attrs, trained, attrLabel, skillName));
  } else {
    if (requirements.level && classLevel < requirements.level) {
      reasons.push('Requer nível ' + requirements.level + ' na classe.');
    }
    for (const [attr, val] of requirements.attrs || []) {
      if ((attrs[attr] || 0) < val) reasons.push('Requer ' + attrLabel(attr) + ' ' + val + '.');
    }
    for (const skill of requirements.skills || []) {
      if (!trained.has(skill)) reasons.push('Requer ' + skillName(skill) + '.');
    }
  }

  const ownedNames = new Set((typeof ownedPowerNames === 'function' ? [...ownedPowerNames()] : []).map(slug));
  const text = slug(power.preRequisitosTexto || '');
  for (const candidate of (DATA.classPowers || []).filter(item => (item.classeIds || []).includes(classId))) {
    if (candidate.id !== power.id && text.includes(slug(candidate.nome)) && !ownedNames.has(slug(candidate.nome))) {
      reasons.push('Requer ' + candidate.nome + '.');
    }
  }

  if (classId === 'arcanista' || (power.classeIds || []).includes('arcanista')) {
    const path = typeof spellPath === 'function' ? spellPath() : ['bruxo','mago','feiticeiro'].find(p => Object.values(state?.identity?.classChoices || {}).some(val => (typeof slug === 'function' ? slug(val) : String(val).toLowerCase()) === p)) || '';
    const pre = power?.preRequisitosTexto || '';
    if (/bruxo\s+ou\s+mago/i.test(pre)) {
      if (path !== 'bruxo' && path !== 'mago') reasons.push('Requer caminho Bruxo ou Mago.');
    } else {
      if (power.id === 'arcanista_caldeirao_do_bruxo' || /\bBruxo\b/i.test(pre)) {
        if (path !== 'bruxo') reasons.push('Requer caminho Bruxo.');
      }
      if (power.id === 'arcanista_escriba_arcano' || /\bMago\b/i.test(pre)) {
        if (path !== 'mago') reasons.push('Requer caminho Mago.');
      }
      if (/\bFeiticeiro\b/i.test(pre)) {
        if (path !== 'feiticeiro') reasons.push('Requer caminho Feiticeiro.');
      }
    }
    const lineageMatch = pre.match(/linhagem\s+([a-zçãé]+)/i);
    if (lineageMatch) {
      const requiredLineage = 'linhagem_' + (typeof slug === 'function' ? slug(lineageMatch[1]) : lineageMatch[1].toLowerCase());
      const currentLineage = typeof spellLineage === 'function' ? spellLineage() : ['linhagem_abencoada','linhagem_feerica','linhagem_draconica','linhagem_rubra','linhagem_celestial'].find(id => Object.values(state?.identity?.classChoices || {}).some(v => (typeof slug === 'function' ? slug(v) : v) === id)) || '';
      if (currentLineage !== requiredLineage) {
        reasons.push('Requer ' + lineageMatch[0].charAt(0).toUpperCase() + lineageMatch[0].slice(1) + '.');
      }
    }
  }

  if (typeof powerAllowsRepeat === 'function' && !powerAllowsRepeat(power)) {
    const alreadyInProgression = (state.progression || []).some(r => r.powerId === power.id);
    if (alreadyInProgression) reasons.push('Este poder já foi escolhido na progressão.');
  }

  return { ok: reasons.length === 0, reasons };
}

function cosmopolitaEligiblePowers(){
  const items = [];
  const currentChosenKey = state.powers?.cosmopolitaPower || '';
  const currentChosenPowerId = currentChosenKey.startsWith('geral:') ? currentChosenKey.slice(6) : currentChosenKey;
  const ownedNames = new Set((typeof ownedPowerNames === 'function' ? [...ownedPowerNames(currentChosenPowerId)] : []).map(slug));

  // 1. Poderes Gerais (Combate, Destino, Magia) - exceto Concedidos e Tormenta
  for (const p of DATA.generalPowers || []) {
    if (['concedido', 'tormenta', 'raca', 'grupo', 'escolhido_dos_deuses'].includes(p.categoria)) continue;
    const isCurrent = currentChosenKey === ('geral:' + p.id) || currentChosenKey === p.id;
    if (!isCurrent && ownedNames.has(slug(p.nome))) continue;
    const verdict = cosmopolitaGeneralPowerEligibility(p);
    items.push({
      ...p,
      cosmopolitaKey: 'geral:' + p.id,
      powerType: 'geral',
      categoryLabel: p.categoria === 'combate' ? 'Combate' : p.categoria === 'destino' ? 'Destino' : p.categoria === 'magia' ? 'Magia' : 'Geral',
      originLabel: 'Poder Geral (' + (p.categoria ? (p.categoria.charAt(0).toUpperCase() + p.categoria.slice(1)) : 'Geral') + ')',
      verdict,
      isSelected: isCurrent
    });
  }

  // 2. Poderes de Classe (Classes onde tem pelo menos 2 níveis)
  const classLvls = cosmopolitaClassLevels();
  for (const [classId, lvl] of Object.entries(classLvls)) {
    if (lvl < 2) continue;
    const cls = typeof classById === 'function' ? classById(classId) : (DATA.classes || []).find(c => c.id === classId);
    const className = cls?.nome || classId;
    const powers = (DATA.classPowers || []).filter(cp => (cp.classeIds || []).includes(classId));
    for (const p of powers) {
      const isCurrent = currentChosenKey === ('classe:' + classId + ':' + p.id) || currentChosenKey === p.id;
      if (!isCurrent && ownedNames.has(slug(p.nome))) continue;
      const verdict = cosmopolitaClassPowerEligibility(p, classId, lvl);
      items.push({
        ...p,
        cosmopolitaKey: 'classe:' + classId + ':' + p.id,
        powerType: 'classe',
        classId,
        className,
        categoryLabel: className,
        originLabel: className + ' (Nv. ' + lvl + ')',
        verdict,
        isSelected: isCurrent
      });
    }
  }

  // Ordenar para que poderes disponíveis fiquem primeiro e bloqueados por último
  items.sort((a, b) => {
    if (a.verdict.ok && !b.verdict.ok) return -1;
    if (!a.verdict.ok && b.verdict.ok) return 1;
    return a.nome.localeCompare(b.nome, 'pt-BR');
  });

  return items;
}

function selectedCosmopolitaPower(){
  const raw = state.progression?.[0]?.powerId || state.powers?.cosmopolitaPower;
  if (!raw) return null;
  if (raw.startsWith('geral:')) {
    const id = decodeURIComponent(raw.slice(6));
    const p = (DATA.generalPowers || []).find(item => item.id === id);
    return p ? { ...p, cosmopolitaKey: raw, powerType: 'geral' } : null;
  }
  if (raw.startsWith('classe:')) {
    const parts = raw.split(':');
    const classId = parts[1];
    const powerId = parts.slice(2).join(':');
    const p = (DATA.classPowers || []).find(item => item.id === powerId);
    const cls = typeof classById === 'function' ? classById(classId) : null;
    return p ? { ...p, cosmopolitaKey: raw, powerType: 'classe', classId, className: cls?.nome || classId } : null;
  }
  const gen = (DATA.generalPowers || []).find(item => item.id === raw);
  if (gen) return { ...gen, cosmopolitaKey: 'geral:' + gen.id, powerType: 'geral' };
  const clsP = (DATA.classPowers || []).find(item => item.id === raw);
  if (clsP) return { ...clsP, cosmopolitaKey: 'classe:' + (clsP.classeIds?.[0] || '') + ':' + clsP.id, powerType: 'classe' };
  return null;
}

function getPhase6SubStages(){
  const stages = [];
  const hasRaceGroups = typeof racePowerGroups === 'function' && racePowerGroups().some(g => Number(g.quantity || 0) > 0);
  if (hasRaceGroups) {
    stages.push({ type: 'race', label: 'Poderes de Raça' });
  }
  const genSlots = typeof generalPowerSlots === 'function' ? generalPowerSlots() : 0;
  for (let i = 0; i < genSlots; i++) {
    stages.push({ type: 'general', slot: i, label: 'Poder Geral ' + (i + 1) });
  }
  const originInGeneralCount = typeof originChoiceSlotsCount === 'function' ? originChoiceSlotsCount() : 0;
  if (originInGeneralCount === 0) {
    const originChoices = typeof originGeneralPowerOptions === 'function' ? originGeneralPowerOptions() : [];
    originChoices.forEach(opt => {
      stages.push({ type: 'origin_general', optionId: opt.id, label: 'Poder da Origem (' + (opt.name || 'Geral') + ')' });
    });
  }
  if (typeof hasDuploFeerico === 'function' && hasDuploFeerico()) {
    stages.push({ type: 'duplo_feerico', label: 'Duplo Feérico' });
  }
  // Cosmopolita escolhe o poder exclusivamente na Fase 10 (Progressão)
  if (typeof hasFuturaLenda === 'function' && hasFuturaLenda()) {
    stages.push({ type: 'futura_lenda', label: 'Origem Regional (Futura Lenda)' });
  }
  if (typeof hasCriacaoDosDeuses === 'function' && hasCriacaoDosDeuses()) {
    stages.push({ type: 'criacao_dos_deuses', label: 'Origem (Criação dos Deuses)' });
  }
  return stages;
}

// Decora selectedCharacterFeatures para incluir o poder recebido pela origem Cosmopolita em entrada única
const baseSelectedFeaturesCosmopolita = selectedCharacterFeatures;
selectedCharacterFeatures = function(){
  const features = baseSelectedFeaturesCosmopolita();
  let list = features;
  if (hasCosmopolita()) {
    const regional = typeof selectedRegionalOrigin === 'function' ? selectedRegionalOrigin() : null;
    const cosmoDesc = regional?.beneficios?.descricao || (typeof DATA !== 'undefined' && DATA.regionalOrigins ? DATA.regionalOrigins.find(o => slug(o.nome) === 'cosmopolita')?.beneficios?.descricao : '') || 'Escolha um poder geral ou de uma classe na qual você tenha pelo menos dois níveis, e cujos requisitos você cumpra (exceto poderes concedidos ou da Tormenta). Você recebe esse poder. Uma vez por aventura, após concluir um descanso (oito horas de sono), pode trocar esse poder por outro.';
    const chosen = selectedCosmopolitaPower();

    // Filtra para remover qualquer ocorrência avulsa de 'cosmopolita'
    const filtered = features.filter(f => slug(f.id || f.nome) !== 'cosmopolita' && !String(f.id || '').startsWith('cosmopolita:'));

    if (chosen) {
      filtered.push({
        ...chosen,
        id: 'cosmopolita:' + chosen.id,
        nome: 'Cosmopolita(' + chosen.nome + ')',
        source: 'origin',
        origemRegional: 'Cosmopolita',
        originDesc: cosmoDesc,
        cosmoDesc: cosmoDesc,
        powerDesc: chosen.descricao || '',
        chosenPower: chosen
      });
    } else {
      filtered.push({
        id: 'cosmopolita',
        nome: 'Cosmopolita',
        descricao: cosmoDesc,
        cosmoDesc: cosmoDesc,
        source: 'origin',
        origemRegional: 'Cosmopolita'
      });
    }
    list = filtered;
  }
  const distIds = (Array.isArray(state?.distinctions?.activeIds) && state.distinctions.activeIds.length > 0)
    ? state.distinctions.activeIds
    : (() => {
        try {
          const raw = localStorage.getItem('forja-heroi-t20-v1');
          if (raw) {
            const p = JSON.parse(raw);
            if (Array.isArray(p?.distinctions?.activeIds)) return p.distinctions.activeIds;
          }
        } catch(e) {}
        return [];
      })();

  if (distIds.length > 0) {
    const catalog = (typeof DATA !== 'undefined' && Array.isArray(DATA?.distinctions)) ? DATA.distinctions : [];
    distIds.forEach(dId => {
      const dist = catalog.find(item => item.id === dId);
      if (dist && dist.marca && !list.some(f => f.id === 'marca:' + dist.id)) {
        list.push({
          id: 'marca:' + dist.id,
          nome: 'Marca: ' + dist.marca.nome + ' (' + dist.nome + ')',
          descricao: dist.marca.descricao,
          source: 'distinction',
          distinctionId: dist.id,
          distinctionName: dist.nome
        });
      }
    });
  }
  return list;
};

// Decora ownedPowerNames para reconhecer o poder geral escolhido por Cosmopolita
const baseOwnedPowerNamesCosmopolita = ownedPowerNames;
ownedPowerNames = function(exceptId = ''){
  const set = baseOwnedPowerNamesCosmopolita(exceptId);
  if (hasCosmopolita()) {
    const chosen = selectedCosmopolitaPower();
    if (chosen && chosen.id !== exceptId) {
      set.add(slug(chosen.nome));
    }
  }
  return set;
};

// Renderização limpa, minimalista e sombria do navegador de Cosmopolita
function renderCosmopolitaPowerBrowser(totalStages = 1, currentStageIndex = 0){
  const options = cosmopolitaEligiblePowers();
  const currentKey = state.powers.cosmopolitaPower || '';
  const previewKey = state.powers.cosmopolitaPreview || currentKey;
  const preview = previewKey ? (options.find(o => o.cosmopolitaKey === previewKey) || null) : null;

  const category = state.powers.cosmopolitaCategoryFilter || 'all';
  const status = state.powers.cosmopolitaStatusFilter || 'available';
  const searchQuery = slug(state.powers.cosmopolitaSearchQuery || '');

  const classLvls = cosmopolitaClassLevels();
  const classesWith2Levels = Object.entries(classLvls).filter(([_, lvl]) => lvl >= 2).map(([cid]) => cid);

  const filtered = options.filter(opt => {
    if (category !== 'all') {
      if (opt.powerType === 'classe') {
        if (category !== ('classe:' + opt.classId)) return false;
      } else {
        if (opt.categoria !== category) return false;
      }
    }
    if (status === 'available' && !opt.verdict.ok) return false;
    if (status === 'locked' && opt.verdict.ok) return false;
    if (searchQuery) {
      const target = slug(opt.nome + ' ' + (opt.preRequisitosTexto || '') + ' ' + (opt.descricao || ''));
      if (!target.includes(searchQuery)) return false;
    }
    return true;
  });

  const availableEntries = filtered.filter(o => o.verdict.ok);
  const lockedEntries = filtered.filter(o => !o.verdict.ok);

  let navBar = '';
  if (totalStages > 1) {
    const hasPrev = currentStageIndex > 0;
    navBar = '<div class="sequential-power-nav" style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:12px">' +
      '<button type="button" class="button small" data-action="cosmopolita-prev" ' + (hasPrev ? '' : 'disabled') + '>← Poder anterior</button>' +
      '<span style="font-weight:700;color:var(--gold2);text-align:center">Poder ' + (currentStageIndex + 1) + ' de ' + totalStages + '<br><small style="font-weight:400;color:var(--muted)">Fonte: Origem Regional (Cosmopolita)</small></span>' +
      '<button type="button" class="button small" style="visibility:hidden">Próximo</button>' +
    '</div>';
  } else {
    navBar = '<div class="sequential-power-nav" style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:12px">' +
      '<span style="font-weight:700;color:var(--gold2);text-align:center">Origem Regional Cosmopolita<br><small style="font-weight:400;color:var(--muted)">Escolha um poder geral ou de classe (Nv. 2+)</small></span>' +
    '</div>';
  }

  const categoryFilters = '<div class="power-filterbar">' +
    '<button type="button" class="filter-chip ' + (category === 'all' ? 'active' : '') + '" data-action="cosmopolita-category" data-value="all">Todos</button>' +
    '<button type="button" class="filter-chip ' + (category === 'combate' ? 'active' : '') + '" data-action="cosmopolita-category" data-value="combate">Combate</button>' +
    '<button type="button" class="filter-chip ' + (category === 'destino' ? 'active' : '') + '" data-action="cosmopolita-category" data-value="destino">Destino</button>' +
    '<button type="button" class="filter-chip ' + (category === 'magia' ? 'active' : '') + '" data-action="cosmopolita-category" data-value="magia">Magia</button>' +
    classesWith2Levels.map(cid => {
      const cls = typeof classById === 'function' ? classById(cid) : null;
      const cName = cls?.nome || cid;
      return '<button type="button" class="filter-chip ' + (category === ('classe:' + cid) ? 'active' : '') + '" data-action="cosmopolita-category" data-value="' + esc('classe:' + cid) + '">' + esc(cName) + '</button>';
    }).join('') +
  '</div>';

  const statusFilters = '<div class="power-filterbar">' +
    '<button type="button" class="filter-chip ' + (status === 'available' ? 'active' : '') + '" data-action="cosmopolita-status" data-value="available">Disponíveis</button>' +
    '<button type="button" class="filter-chip ' + (status === 'locked' ? 'active' : '') + '" data-action="cosmopolita-status" data-value="locked">Pré-requisito pendente</button>' +
    '<button type="button" class="filter-chip ' + (status === 'all' ? 'active' : '') + '" data-action="cosmopolita-status" data-value="all">Ver tudo</button>' +
  '</div>';

  const renderRows = (list) => list.map(opt => {
    const isSelected = previewKey === opt.cosmopolitaKey;
    const isChosen = currentKey === opt.cosmopolitaKey;
    const isLocked = !opt.verdict.ok;
    return '<button type="button" class="power-row ' + (isSelected ? 'selected ' : '') + (isChosen ? 'chosen ' : '') + (isLocked ? 'locked ' : '') + '" ' +
      'data-action="cosmopolita-select-item" data-power-key="' + esc(opt.cosmopolitaKey) + '" data-search="' + esc(slug(opt.nome + ' ' + (opt.preRequisitosTexto || ''))) + '">' +
      '<strong>' + esc(opt.nome) + '</strong>' +
    '</button>';
  }).join('');

  const availHtml = availableEntries.length ? renderRows(availableEntries) : '';
  const lockedHtml = lockedEntries.length ? renderRows(lockedEntries) : '';

  const listHtml = '<div>' +
    '<input class="input search" id="cosmopolitaSearch" placeholder="Pesquisar nome ou pré-requisito…" value="' + esc(state.powers.cosmopolitaSearchQuery || '') + '">' +
    '<div class="power-list">' +
      (status !== 'locked' && availHtml ? availHtml : '') +
      (status !== 'available' && lockedHtml ? '<div class="power-status locked" style="margin:11px 0 8px">Pré-requisitos pendentes</div>' + lockedHtml : '') +
      (!availHtml && !lockedHtml ? '<div class="empty">Nenhum poder corresponde aos filtros.</div>' : '') +
    '</div>' +
  '</div>';

  const detailHtml = preview ?
    '<aside class="power-detail-panel">' +
      '<div class="tag-row"><span class="tag gold">' + esc(preview.categoryLabel || 'Poder') + '</span></div>' +
      '<h4>' + esc(preview.nome) + '</h4>' +
      '<p><strong>Pré-requisitos:</strong> ' + esc(preview.preRequisitosTexto || 'Nenhum') + '</p>' +
      '<p>' + esc(preview.descricao || 'Descrição não cadastrada.') + '</p>' +
      (!preview.verdict.ok && preview.verdict.reasons.length ?
        '<div class="power-status locked">' + esc(preview.verdict.reasons.join(' ')) + '</div>' : '') +
    '</aside>' :
    '<aside class="power-detail-panel"><div class="empty">Selecione um poder na lista para ver os detalhes e adicioná-lo à sua ficha.</div></aside>';

  return navBar + categoryFilters + statusFilters + '<div class="power-browser">' + listHtml + detailHtml + '</div>';
}

// Renderização em etapas sequenciais dentro da Fase 6
const baseRenderPowersCosmopolita = renderPowers;
renderPowers = function(){
  const stages = getPhase6SubStages();
  if (!stages.length) {
    return panel('Nenhuma escolha pendente', '<div class="info-box">Sua raça e origem não exigem escolhas adicionais de poderes nesta fase.</div>');
  }

  let curIdx = Number(state.powers.phase6StageIndex);
  if (!Number.isInteger(curIdx) || curIdx < 0 || curIdx >= stages.length) {
    curIdx = stages.findIndex(st => {
      if (st.type === 'race') return !racePowerGroups().every(g => (state.powers.raceGroups[g.id] || []).length === Number(g.quantity || 0));
      if (st.type === 'general') return !state.powers.general[st.slot];
      if (st.type === 'cosmopolita') return !state.powers.cosmopolitaPower;
      if (st.type === 'origin_general') return !state.powers?.originGeneral?.[st.optionId];
      if (st.type === 'duplo_feerico') return typeof selectedDuploFeericoPower === 'function' ? !selectedDuploFeericoPower() : false;
      if (st.type === 'futura_lenda') return typeof selectedFuturaLendaPower === 'function' ? !selectedFuturaLendaPower() : false;
      if (st.type === 'criacao_dos_deuses') return typeof selectedCriacaoDosDeusesDeity === 'function' ? !selectedCriacaoDosDeusesDeity() : false;
      return false;
    });
    if (curIdx < 0) curIdx = 0;
    state.powers.phase6StageIndex = curIdx;
  }

  const currentStage = stages[curIdx];
  if (!currentStage) return '';

  if (currentStage.type === 'cosmopolita') {
    return panel('Origem Cosmopolita · Poder adicional', renderCosmopolitaPowerBrowser(stages.length, curIdx), selectedCosmopolitaPower() ? 'Selecionado: ' + selectedCosmopolitaPower().nome : 'Escolha pendente');
  }

  if (currentStage.type === 'race') {
    const groups = racePowerGroups();
    let html = '';
    const renderRaceSubHtml = (opt) => {
      if (!Array.isArray(opt.subEscolhas) || opt.subEscolhas.length === 0) return '';
      return '<div class="race-subchoices" style="margin-top:10px;padding-top:8px;border-top:1px solid #334155;" onclick="event.stopPropagation()">' +
        opt.subEscolhas.map(sub => {
          const chosenVal = state.identity.raceChoices?.[sub.id] || '';
          const opts = sub.opcoes || [];
          const chosenOpt = opts.find(o => o.id === chosenVal);
          let extraField = '';
          if (sub.id === 'duende_maldicao_efeito' && chosenVal === 'criar_maldicao') {
            const customVal = state.identity.raceChoices?.duende_maldicao_personalizada || '';
            extraField = '<div style="margin-top:6px;"><input class="input" type="text" data-action="race-subchoice-custom" data-choice-id="duende_maldicao_personalizada" placeholder="Escreva o efeito (com a permissão do mestre)" value="' + esc(customVal) + '" style="font-size:0.82rem;width:100%;"></div>';
          } else if (chosenOpt?.descricao) {
            extraField = '<p style="margin-top:5px;font-size:0.78rem;color:#94a3b8;line-height:1.3;">' + esc(chosenOpt.descricao) + '</p>';
          }
          return '<div class="race-subchoice-item" style="margin-top:6px;"><label class="field"><span style="font-size:0.78rem;color:#cbd5e1;font-weight:600;">' + esc(sub.nome) + '</span>' +
            '<select class="select" data-action="race-subchoice" data-choice-id="' + esc(sub.id) + '" style="font-size:0.82rem;margin-top:3px;width:100%;">' +
            '<option value="">Escolha ' + esc(sub.nome) + '</option>' +
            opts.map(o => '<option value="' + esc(o.id) + '" ' + (o.id === chosenVal ? 'selected' : '') + '>' + esc(o.nome) + '</option>').join('') +
            '</select></label>' + extraField + '</div>';
        }).join('') +
      '</div>';
    };
    groups.forEach(group => {
      const selected = state.powers.raceGroups[group.id] || [];
      html += panel(group.name, '<p class="help" style="margin-bottom:9px">' + esc(group.description || 'Escolha os poderes raciais exigidos.') + '</p><div class="choice-cards">' + group.options.map(option => {
        const id = choiceId(option), active = selected.includes(id);
        const subHtml = active ? renderRaceSubHtml(option) : '';
        return '<label class="choice-card ' + (active ? 'selected' : '') + '"><input type="checkbox" data-action="race-power" data-group="' + esc(group.id) + '" value="' + esc(id) + '" ' + (active ? 'checked' : '') + '><strong>' + esc(choiceName(option)) + '</strong><p>' + esc(option.descricao || '') + '</p>' + subHtml + '</label>';
      }).join('') + '</div>', 'Selecionados: ' + selected.length + '/' + group.quantity);
    });
    return html;
  }

  if (currentStage.type === 'general') {
    const slots = typeof generalPowerSlots === 'function' ? generalPowerSlots() : 0;
    state.powers.activeSlot = currentStage.slot;
    return panel('', renderGeneralPowerBrowser(slots), '');
  }

  if (currentStage.type === 'origin_general') {
    const renderFn = typeof (globalThis as any).renderOriginGeneralPowerBrowser === 'function' ? (globalThis as any).renderOriginGeneralPowerBrowser : null;
    if (renderFn) {
      return panel('Poder da Origem · ' + (currentStage.label || 'Geral'), renderFn(currentStage.optionId), state.powers?.originGeneral?.[currentStage.optionId] ? 'Selecionado' : 'Escolha pendente');
    }
    const slots = typeof generalPowerSlots === 'function' ? generalPowerSlots() : 0;
    return panel('Poder da Origem', renderGeneralPowerBrowser(slots), 'Escolha pendente');
  }

  if (currentStage.type === 'duplo_feerico') {
    const renderFn = typeof (globalThis as any).renderDuploFeericoBrowser === 'function'
      ? (globalThis as any).renderDuploFeericoBrowser
      : (typeof (window as any).renderDuploFeericoBrowser === 'function' ? (window as any).renderDuploFeericoBrowser : null);
    return panel('Duplo Feérico · Habilidade de 1º Nível', renderFn ? renderFn() : '', typeof selectedDuploFeericoPower === 'function' && selectedDuploFeericoPower() ? 'Selecionado' : 'Escolha pendente');
  }

  if (currentStage.type === 'futura_lenda') {
    const renderFn = typeof (globalThis as any).renderFuturaLendaBrowser === 'function'
      ? (globalThis as any).renderFuturaLendaBrowser
      : (typeof (window as any).renderFuturaLendaBrowser === 'function' ? (window as any).renderFuturaLendaBrowser : null);
    return panel('Origem Regional (Futura Lenda) · Poder de Classe (2º Nível)', renderFn ? renderFn() : '', typeof selectedFuturaLendaPower === 'function' && selectedFuturaLendaPower() ? 'Selecionado' : 'Escolha pendente');
  }

  if (currentStage.type === 'criacao_dos_deuses') {
    const opt = typeof getCriacaoDosDeusesPowerOption === 'function' ? getCriacaoDosDeusesPowerOption() : null;
    const renderFn = typeof (globalThis as any).renderCriacaoDosDeusesBrowser === 'function'
      ? (globalThis as any).renderCriacaoDosDeusesBrowser
      : (typeof (window as any).renderCriacaoDosDeusesBrowser === 'function' ? (window as any).renderCriacaoDosDeusesBrowser : null);
    return panel('Origem · Criação dos Deuses (Escolhido dos Deuses)', renderFn ? renderFn() : '', opt ? 'Criador: ' + opt.nome : 'Escolha pendente');
  }

  return baseRenderPowersCosmopolita();
};

// Sincronização do rodapé na Fase 6
const baseSyncFooterCosmopolita = typeof syncSequentialPowerFooter === 'function' ? syncSequentialPowerFooter : null;
syncSequentialPowerFooter = function(){
  if (state.step !== 6) {
    if (typeof baseSyncFooterCosmopolita === 'function') return baseSyncFooterCosmopolita();
    return;
  }
  const next = document.getElementById('nextButton');
  if (!next) return;
  const stepPrev = document.getElementById('stepPrevButton');
  const stepNext = document.getElementById('stepNextButton');

  const stages = getPhase6SubStages();
  const totalStages = stages.length || 1;
  let curIdx = Number(state.powers.phase6StageIndex || 0);
  if (!Number.isInteger(curIdx) || curIdx < 0 || curIdx >= totalStages) { curIdx = 0; state.powers.phase6StageIndex = 0; }
  const currentStage = stages[curIdx];
  const isLast = curIdx === totalStages - 1;
  const isFirst = curIdx === 0;

  let canAdvanceCurrent = false;
  if (typeof isPhase6StageComplete === 'function') {
    canAdvanceCurrent = isPhase6StageComplete(currentStage, curIdx);
  } else if (currentStage?.type === 'race') {
    canAdvanceCurrent = typeof racePowerGroups === 'function' && racePowerGroups().every(g => (state.powers.raceGroups[g.id] || []).length === Number(g.quantity || 0));
  } else if (currentStage?.type === 'general') {
    const curSlot = currentStage.slot;
    const hasCurrent = Boolean(state.powers.general?.[curSlot]);
    const isDraft = Boolean(state.powers.previewId);
    canAdvanceCurrent = (isDraft && typeof generalPowerDraftAllowed === 'function' && generalPowerDraftAllowed()) || hasCurrent;
  } else if (currentStage?.type === 'cosmopolita') {
    const hasCurrent = Boolean(state.powers.cosmopolitaPower);
    const draftKey = state.powers.cosmopolitaPreview;
    const draftOk = draftKey ? (cosmopolitaEligiblePowers().find(o => o.cosmopolitaKey === draftKey)?.verdict?.ok ?? false) : false;
    canAdvanceCurrent = draftOk || hasCurrent;
  } else if (currentStage?.type === 'futura_lenda') {
    canAdvanceCurrent = typeof selectedFuturaLendaPower === 'function' && Boolean(selectedFuturaLendaPower());
  } else if (currentStage?.type === 'duplo_feerico') {
    canAdvanceCurrent = typeof selectedDuploFeericoPower === 'function' && Boolean(selectedDuploFeericoPower());
  } else if (currentStage?.type === 'criacao_dos_deuses') {
    canAdvanceCurrent = typeof selectedCriacaoDosDeusesDeity === 'function' && Boolean(selectedCriacaoDosDeusesDeity());
  } else if (currentStage?.type === 'origin_general') {
    canAdvanceCurrent = Boolean(state.powers?.originGeneral?.[currentStage.optionId]);
  } else if (!currentStage) {
    canAdvanceCurrent = typeof phaseIsComplete === 'function' ? phaseIsComplete(6) : true;
  }

  if (totalStages <= 1) {
    if (stepPrev) stepPrev.hidden = true;
    if (stepNext) stepNext.hidden = true;
    next.hidden = false;
    next.textContent = 'Avançar →';
    next.disabled = !canAdvanceCurrent;
    next.classList.toggle('is-incomplete', !canAdvanceCurrent);
  } else {
    if (stepPrev) {
      stepPrev.hidden = isFirst;
      stepPrev.disabled = isFirst;
      stepPrev.textContent = '← Poder anterior';
    }
    if (!isLast) {
      next.hidden = true;
      next.disabled = true;
      if (stepNext) {
        stepNext.hidden = false;
        stepNext.disabled = !canAdvanceCurrent;
        stepNext.textContent = 'Próximo Poder →';
        stepNext.classList.toggle('is-incomplete', !canAdvanceCurrent);
      }
    } else {
      if (stepNext) stepNext.hidden = true;
      next.hidden = false;
      next.textContent = 'Avançar →';
      next.disabled = !canAdvanceCurrent;
      next.classList.toggle('is-incomplete', !canAdvanceCurrent);
    }
  }
};

// Eventos de clique para Cosmopolita
document.addEventListener('click', event => {
  const target = event.target;

  // Seleção de item na lista de Cosmopolita
  const selectItemBtn = target.closest?.('[data-action="cosmopolita-select-item"]');
  if (selectItemBtn) {
    event.preventDefault();
    const key = selectItemBtn.dataset.powerKey;
    state.powers.cosmopolitaPreview = key;
    const opt = cosmopolitaEligiblePowers().find(o => o.cosmopolitaKey === key);
    if (opt && opt.verdict.ok) {
      state.powers.cosmopolitaPower = key;
      if (typeof persistNow === 'function') persistNow(); else persist();
    }
    const listContainer = selectItemBtn.closest('.power-list');
    const savedListScroll = listContainer ? listContainer.scrollTop : 0;
    const savedWinScroll = typeof window !== 'undefined' ? window.scrollY : 0;
    renderStage();
    const restoredList = document.querySelector('.power-list');
    if (restoredList && savedListScroll > 0) restoredList.scrollTop = savedListScroll;
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: savedWinScroll, behavior: 'instant' as any });
      requestAnimationFrame(() => {
        const rList = document.querySelector('.power-list');
        if (rList && savedListScroll > 0) rList.scrollTop = savedListScroll;
        window.scrollTo({ top: savedWinScroll, behavior: 'instant' as any });
      });
    }
    return;
  }

  // Filtros de Cosmopolita
  const catBtn = target.closest?.('[data-action="cosmopolita-category"]');
  if (catBtn) {
    event.preventDefault();
    state.powers.cosmopolitaCategoryFilter = catBtn.dataset.value;
    renderStage();
    return;
  }

  const statBtn = target.closest?.('[data-action="cosmopolita-status"]');
  if (statBtn) {
    event.preventDefault();
    state.powers.cosmopolitaStatusFilter = statBtn.dataset.value;
    renderStage();
    return;
  }

  // Navegação para trás dentro da Fase 6
  const cosmoPrevBtn = target.closest?.('[data-action="cosmopolita-prev"]');
  if (cosmoPrevBtn && state.step === 6) {
    event.preventDefault();
    const cur = Number(state.powers.phase6StageIndex || 0);
    if (cur > 0) {
      state.powers.phase6StageIndex = cur - 1;
      renderStage();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    return;
  }

  // Interceptar #previousButton quando dentro de sub-estágio da Fase 6
  const prevStageBtn = target.closest?.('#previousButton');
  if (prevStageBtn && state.step === 6) {
    const cur = Number(state.powers.phase6StageIndex || 0);
    if (cur > 0) {
      event.preventDefault();
      event.stopImmediatePropagation();
      state.powers.phase6StageIndex = cur - 1;
      const stages = getPhase6SubStages();
      const prevStage = stages[cur - 1];
      if (prevStage?.type === 'general') {
        state.powers.activeSlot = prevStage.slot;
        state.powers.previewId = state.powers.general[prevStage.slot] || '';
      }
      renderStage();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
  }

  // Interceptar #stepPrevButton
  const stepPrev = target.closest?.('#stepPrevButton');
  if (stepPrev && state.step === 6) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const cur = Number(state.powers.phase6StageIndex || 0);
    if (cur > 0) {
      state.powers.phase6StageIndex = cur - 1;
      const stages = getPhase6SubStages();
      const prevStage = stages[cur - 1];
      if (prevStage?.type === 'general') {
        state.powers.activeSlot = prevStage.slot;
        state.powers.previewId = state.powers.general[prevStage.slot] || '';
      }
      renderStage();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    return;
  }

  // Interceptar #stepNextButton ou #nextButton na Fase 6
  const isStepNext = Boolean(target.closest?.('#stepNextButton'));
  const isNext = Boolean(target.closest?.('#nextButton'));
  if ((isStepNext || isNext) && state.step === 6) {
    const stages = getPhase6SubStages();
    const cur = Number(state.powers.phase6StageIndex || 0);
    const currentStage = stages[cur];
    const isLast = cur === stages.length - 1;

    // Se estiver em Cosmopolita: confirmar draft
    if (currentStage?.type === 'cosmopolita') {
      const draftKey = state.powers.cosmopolitaPreview;
      if (draftKey) {
        const opt = cosmopolitaEligiblePowers().find(o => o.cosmopolitaKey === draftKey);
        if (!opt || !opt.verdict.ok) {
          event.preventDefault();
          event.stopImmediatePropagation();
          if (typeof toast === 'function') toast('Este poder não atende aos pré-requisitos.', 'warning');
          return;
        }
        state.powers.cosmopolitaPower = draftKey;
        state.powers.cosmopolitaPreview = '';
        persist();
      } else if (!state.powers.cosmopolitaPower) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (typeof toast === 'function') toast('Selecione um poder de Cosmopolita para continuar.', 'warning');
        return;
      }
    }

    // Se estiver em General: confirmar draft
    if (currentStage?.type === 'general') {
      const curSlot = currentStage.slot;
      if (state.powers.previewId) {
        if (typeof generalPowerDraftAllowed === 'function' && !generalPowerDraftAllowed()) {
          event.preventDefault();
          event.stopImmediatePropagation();
          if (typeof toast === 'function') toast('Este poder não atende aos pré-requisitos.', 'warning');
          return;
        }
        state.powers.general[curSlot] = state.powers.previewId;
        state.powers.previewId = '';
        persist();
      } else if (!state.powers.general[curSlot]) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (typeof toast === 'function') toast('Selecione um poder geral na lista para continuar.', 'warning');
        return;
      }
    }

    // Se estiver em Race: verificar se concluiu
    if (currentStage?.type === 'race') {
      const raceOk = racePowerGroups().every(g => (state.powers.raceGroups[g.id] || []).length === Number(g.quantity || 0));
      if (!raceOk) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (typeof toast === 'function') toast('Selecione os poderes raciais restantes para continuar.', 'warning');
        return;
      }
    }

    // Se estiver em Origin General
    if (currentStage?.type === 'origin_general') {
      if (!state.powers?.originGeneral?.[currentStage.optionId]) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (typeof toast === 'function') toast('Selecione o poder concedido pela origem para continuar.', 'warning');
        return;
      }
    }

    // Se estiver em Duplo Feérico
    if (currentStage?.type === 'duplo_feerico') {
      if (typeof selectedDuploFeericoPower === 'function' && !selectedDuploFeericoPower()) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (typeof toast === 'function') toast('Selecione a habilidade para Duplo Feérico para continuar.', 'warning');
        return;
      }
    }

    // Se estiver em Futura Lenda
    if (currentStage?.type === 'futura_lenda') {
      if (typeof selectedFuturaLendaPower === 'function' && !selectedFuturaLendaPower()) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (typeof toast === 'function') toast('Selecione um poder de classe para Futura Lenda para continuar.', 'warning');
        return;
      }
    }

    // Se estiver em Criação dos Deuses
    if (currentStage?.type === 'criacao_dos_deuses') {
      if (typeof selectedCriacaoDosDeusesDeity === 'function' && !selectedCriacaoDosDeusesDeity()) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (typeof toast === 'function') toast('Selecione a divindade criadora para continuar.', 'warning');
        return;
      }
    }

    // Se não for o último sub-estágio: avançar para o próximo sub-estágio
    if (!isLast) {
      event.preventDefault();
      event.stopImmediatePropagation();
      state.powers.phase6StageIndex = cur + 1;
      const nextStage = stages[cur + 1];
      if (nextStage?.type === 'general') {
        state.powers.activeSlot = nextStage.slot;
        state.powers.previewId = state.powers.general[nextStage.slot] || '';
      }
      persist();
      renderStage();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Se for o último sub-estágio e for #nextButton: avançar para a próxima fase!
    if (isLast && isNext) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const missing = typeof powerMissingChoices === 'function' ? powerMissingChoices() : [];
      if (missing.length > 0) {
        if (typeof toast === 'function') toast('Complete as escolhas pendentes para continuar.', 'warning');
        return;
      }
      if (!state.completed.includes(6)) state.completed.push(6);
      state.step = typeof getNextLinearStep === 'function' ? getNextLinearStep(6) : (typeof nextIncompletePhase === 'function' ? nextIncompletePhase(6) : 7);
      if (typeof persistNow === 'function') persistNow(); else persist();
      renderStage();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
  }
}, true);

// Busca em tempo real de Cosmopolita
document.addEventListener('input', event => {
  if (event.target.id === 'cosmopolitaSearch') {
    state.powers.cosmopolitaSearchQuery = event.target.value;
    const query = slug(event.target.value);
    document.querySelectorAll('[data-action="cosmopolita-select-item"]').forEach(row => {
      const match = !query || slug(row.textContent).includes(query);
      row.style.display = match ? '' : 'none';
    });
  }
  if (event.target.id === 'cosmopolitaSwapSearch') {
    cosmopolitaSwapSearchQuery = event.target.value;
    updateCosmopolitaSwapModalUI();
  }
});

let cosmopolitaSwapCategoryFilter = 'all';
let cosmopolitaSwapStatusFilter = 'all';
let cosmopolitaSwapSearchQuery = '';

// Modal de troca rápida de poder na ficha / durante o jogo
function renderCosmopolitaSwapModalHtml(){
  const category = cosmopolitaSwapCategoryFilter;
  const status = cosmopolitaSwapStatusFilter;
  const classLvls = cosmopolitaClassLevels();
  const classesWith2Levels = Object.entries(classLvls).filter(([_, lvl]) => lvl >= 2).map(([cid]) => cid);

  return '<div id="cosmopolitaSwapModal" class="forja-modal-backdrop" style="display:none;z-index:9999;">' +
    '<div class="forja-rest-card" style="max-width:820px;width:92%;background:#0e141f;border:1px solid #263345;color:var(--text);">' +
      '<div class="rest-card-header" style="border-bottom:1px solid #263345;padding:12px 16px;display:flex;align-items:center;justify-content:space-between">' +
        '<div class="rest-card-title" style="font-weight:700;color:var(--gold2);font-size:0.95rem">ORIGEM COSMOPOLITA · TROCAR PODER</div>' +
        '<button type="button" class="rest-close-x" data-action="close-cosmopolita-swap" style="background:transparent;border:0;color:var(--muted);font-size:1.1rem;cursor:pointer">×</button>' +
      '</div>' +
      '<div class="rest-card-body" style="padding:16px">' +
        '<div style="margin-bottom:10px">' +
          '<input type="text" class="input search" id="cosmopolitaSwapSearch" placeholder="Pesquisar poder…" value="' + esc(cosmopolitaSwapSearchQuery) + '" style="width:100%">' +
        '</div>' +
        '<div class="power-filterbar" id="cosmopolitaSwapCategoryBar" style="margin-bottom:6px">' +
          '<button type="button" class="filter-chip ' + (category === 'all' ? 'active' : '') + '" data-action="cosmopolita-swap-category" data-value="all">Todos</button>' +
          '<button type="button" class="filter-chip ' + (category === 'combate' ? 'active' : '') + '" data-action="cosmopolita-swap-category" data-value="combate">Combate</button>' +
          '<button type="button" class="filter-chip ' + (category === 'destino' ? 'active' : '') + '" data-action="cosmopolita-swap-category" data-value="destino">Destino</button>' +
          '<button type="button" class="filter-chip ' + (category === 'magia' ? 'active' : '') + '" data-action="cosmopolita-swap-category" data-value="magia">Magia</button>' +
          '<button type="button" class="filter-chip ' + (category === 'tormenta' ? 'active' : '') + '" data-action="cosmopolita-swap-category" data-value="tormenta">Tormenta</button>' +
          classesWith2Levels.map(cid => {
            const cls = typeof classById === 'function' ? classById(cid) : null;
            return '<button type="button" class="filter-chip ' + (category === ('classe:' + cid) ? 'active' : '') + '" data-action="cosmopolita-swap-category" data-value="' + esc('classe:' + cid) + '">' + esc(cls?.nome || cid) + '</button>';
          }).join('') +
        '</div>' +
        '<div class="power-filterbar" id="cosmopolitaSwapStatusBar" style="margin-bottom:12px">' +
          '<button type="button" class="filter-chip ' + (status === 'all' ? 'active' : '') + '" data-action="cosmopolita-swap-status" data-value="all">Todos os estados</button>' +
          '<button type="button" class="filter-chip ' + (status === 'available' ? 'active' : '') + '" data-action="cosmopolita-swap-status" data-value="available">Disponíveis</button>' +
          '<button type="button" class="filter-chip ' + (status === 'locked' ? 'active' : '') + '" data-action="cosmopolita-swap-status" data-value="locked">Pré-requisito pendente</button>' +
        '</div>' +
        '<div id="cosmopolitaSwapContent" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;max-height:360px;overflow-y:auto">' +
        '</div>' +
      '</div>' +
      '<div class="rest-card-footer" style="border-top:1px solid #263345;padding:12px 16px;display:flex;justify-content:flex-end;gap:10px">' +
        '<button type="button" class="button text-button" data-action="close-cosmopolita-swap">Cancelar</button>' +
        '<button type="button" class="button primary" id="confirmCosmopolitaSwapBtn" disabled>Confirmar troca</button>' +
      '</div>' +
    '</div>' +
  '</div>';
}

let cosmopolitaPendingSwapKey = '';

function updateCosmopolitaSwapModalUI(){
  const modal = document.getElementById('cosmopolitaSwapModal');
  if (!modal) return;
  const container = modal.querySelector('#cosmopolitaSwapContent');
  if (!container) return;

  const categoryBar = modal.querySelector('#cosmopolitaSwapCategoryBar');
  if (categoryBar) {
    categoryBar.querySelectorAll('[data-action="cosmopolita-swap-category"]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.value === cosmopolitaSwapCategoryFilter);
    });
  }
  const statusBar = modal.querySelector('#cosmopolitaSwapStatusBar');
  if (statusBar) {
    statusBar.querySelectorAll('[data-action="cosmopolita-swap-status"]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.value === cosmopolitaSwapStatusFilter);
    });
  }

  const allOptions = cosmopolitaEligiblePowers();
  const current = selectedCosmopolitaPower();

  const options = allOptions.filter(opt => {
    if (cosmopolitaSwapCategoryFilter !== 'all') {
      if (opt.powerType === 'classe') {
        if (cosmopolitaSwapCategoryFilter !== ('classe:' + opt.classId)) return false;
      } else {
        if (opt.categoria !== cosmopolitaSwapCategoryFilter) return false;
      }
    }
    if (cosmopolitaSwapStatusFilter === 'available' && !opt.verdict.ok) return false;
    if (cosmopolitaSwapStatusFilter === 'locked' && opt.verdict.ok) return false;
    if (cosmopolitaSwapSearchQuery) {
      const target = slug(opt.nome + ' ' + (opt.preRequisitosTexto || '') + ' ' + (opt.descricao || ''));
      if (!target.includes(slug(cosmopolitaSwapSearchQuery))) return false;
    }
    return true;
  });

  const activeKey = cosmopolitaPendingSwapKey || current?.cosmopolitaKey;
  const preview = options.find(o => o.cosmopolitaKey === activeKey) || options.find(o => o.verdict.ok) || options[0];

  const listHtml = '<div class="power-list" style="max-height:340px;overflow-y:auto;display:flex;flex-direction:column;gap:4px">' +
    (options.length ? options.map(opt => {
      const isSelected = activeKey === opt.cosmopolitaKey;
      const isCurrent = current && current.cosmopolitaKey === opt.cosmopolitaKey;
      const isLocked = !opt.verdict.ok;
      return '<button type="button" class="power-row ' + (isSelected ? 'selected ' : '') + (isCurrent ? 'chosen ' : '') + (isLocked ? 'locked ' : '') + '" ' +
        'data-action="cosmopolita-swap-preview" data-power-key="' + esc(opt.cosmopolitaKey) + '" style="text-align:left;padding:8px 10px">' +
        '<strong>' + esc(opt.nome) + '</strong>' +
      '</button>';
    }).join('') : '<div class="empty" style="padding:16px;color:var(--muted)">Nenhum poder encontrado com estes filtros.</div>') +
  '</div>';

  const detailHtml = preview ?
    '<div class="power-detail-panel" style="padding:12px;background:#101622;border:1px solid #263345;border-radius:8px">' +
      '<div class="tag-row"><span class="tag gold">' + esc(preview.categoryLabel || 'Poder') + '</span></div>' +
      '<h4 style="margin:6px 0;color:var(--gold2)">' + esc(preview.nome) + '</h4>' +
      '<div style="font-size:0.72rem;color:var(--dim);margin-bottom:6px"><strong>Requisitos:</strong> ' + esc(preview.preRequisitosTexto || 'Nenhum') + '</div>' +
      (!preview.verdict.ok && preview.verdict.reasons.length ?
        '<div class="power-status locked" style="margin:6px 0;font-size:0.7rem">' + esc(preview.verdict.reasons.join(' ')) + '</div>' : '') +
      '<p style="font-size:0.74rem;line-height:1.45;color:var(--text);margin-top:6px;max-height:160px;overflow-y:auto">' + esc(preview.descricao || '') + '</p>' +
    '</div>' : '<div class="empty">Selecione um poder.</div>';

  container.innerHTML = listHtml + detailHtml;

  const confirmBtn = modal.querySelector('#confirmCosmopolitaSwapBtn');
  if (confirmBtn) {
    const isNewAndValid = preview && preview.verdict.ok && preview.cosmopolitaKey !== current?.cosmopolitaKey;
    confirmBtn.disabled = !isNewAndValid;
    confirmBtn.textContent = preview && preview.cosmopolitaKey === current?.cosmopolitaKey ? 'Poder atual' : 'Trocar para ' + (preview?.nome || '');
  }
}

function openCosmopolitaSwapModal(){
  let modal = document.getElementById('cosmopolitaSwapModal');
  if (modal) {
    modal.remove();
  }
  document.body.insertAdjacentHTML('beforeend', renderCosmopolitaSwapModalHtml());
  modal = document.getElementById('cosmopolitaSwapModal');
  cosmopolitaPendingSwapKey = state.powers?.cosmopolitaPower || '';
  modal.style.display = 'flex';
  updateCosmopolitaSwapModalUI();
}

function closeCosmopolitaSwapModal(){
  const modal = document.getElementById('cosmopolitaSwapModal');
  if (modal) modal.style.display = 'none';
}

document.addEventListener('click', event => {
  const target = event.target;
  if (target.matches('[data-action="close-cosmopolita-swap"]') || target.closest('[data-action="close-cosmopolita-swap"]')) {
    closeCosmopolitaSwapModal();
    return;
  }
  if (target.matches('[data-vital-action="open-cosmopolita-swap"]') || target.closest('[data-vital-action="open-cosmopolita-swap"]') ||
      target.matches('[data-action="open-cosmopolita-swap"]') || target.closest('[data-action="open-cosmopolita-swap"]')) {
    openCosmopolitaSwapModal();
    return;
  }
  const catBtn = target.closest('[data-action="cosmopolita-swap-category"]');
  if (catBtn) {
    cosmopolitaSwapCategoryFilter = catBtn.dataset.value;
    updateCosmopolitaSwapModalUI();
    return;
  }
  const statusBtn = target.closest('[data-action="cosmopolita-swap-status"]');
  if (statusBtn) {
    cosmopolitaSwapStatusFilter = statusBtn.dataset.value;
    updateCosmopolitaSwapModalUI();
    return;
  }
  const previewBtn = target.closest('[data-action="cosmopolita-swap-preview"]');
  if (previewBtn) {
    cosmopolitaPendingSwapKey = previewBtn.dataset.powerKey;
    updateCosmopolitaSwapModalUI();
    return;
  }
  if (target.id === 'confirmCosmopolitaSwapBtn' || target.closest('#confirmCosmopolitaSwapBtn')) {
    const options = cosmopolitaEligiblePowers();
    const chosen = options.find(o => o.cosmopolitaKey === cosmopolitaPendingSwapKey);
    if (!chosen || !chosen.verdict.ok) return;

    state.powers.cosmopolitaPower = chosen.cosmopolitaKey;
    state.powers.cosmopolitaSwappedThisAdventure = true;
    closeCosmopolitaSwapModal();
    persistNow();
    if (state.finished && typeof saveFinishedCharacter === 'function') saveFinishedCharacter();
    renderStage();
    if (typeof showToast === 'function') showToast('Poder de Cosmopolita trocado para ' + chosen.nome + '!');
    else if (typeof toast === 'function') toast('Poder de Cosmopolita trocado para ' + chosen.nome + '!');
  }
});
