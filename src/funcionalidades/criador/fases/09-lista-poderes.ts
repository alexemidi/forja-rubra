// @ts-check
/**
 * FORJA RUBRA — Navegação e Apresentação de Poderes na Progressão (Fase 10 & Treino)
 */

function isPowerAlreadyAcquiredInCharacter(power: any, index: number, currentRowPowerId?: string): boolean {
  if (!power) return false;
  // O poder atualmente selecionado nesta linha deve sempre continuar visível como escolhido
  if (currentRowPowerId && (power.id === currentRowPowerId || (power.originalId && power.originalId === currentRowPowerId))) {
    return false;
  }
  if (typeof powerAllowsRepeat === 'function' && powerAllowsRepeat(power)) return false;
  
  // 1. Checa se já foi pego em outro nível da progressão (excluindo a linha atual)
  if (Array.isArray(state?.progression)) {
    const hasInProgression = state.progression.some((r, rIdx) =>
      rIdx !== index && r && (r.powerId === power.id || (power.originalId && r.powerId === power.originalId))
    );
    if (hasInProgression) return true;
  }

  // 2. Checa se foi adiantado pela Origem Futura Lenda (state.powers)
  const flId = state?.powers?.futuraLendaClassPower || (typeof selectedFuturaLendaPower === 'function' ? selectedFuturaLendaPower()?.id : null);
  if (flId && (flId === power.id || flId === power.originalId || String(power.id).endsWith(flId))) {
    return true;
  }

  // 3. Checa nas features do personagem especificamente para Futura Lenda
  const features = typeof selectedCharacterFeatures === 'function' ? selectedCharacterFeatures() : (state?.features || []);
  for (const f of features) {
    if (!f) continue;
    if (f.id === 'futura_lenda' || f.origemRegional === 'Futura Lenda' || (f.nome && f.nome.startsWith('Futura Lenda('))) {
      const chosenId = f.chosenPower?.id || f.powerId || f.key;
      if (chosenId && (chosenId === power.id || chosenId === power.originalId || String(power.id).endsWith(chosenId))) return true;
      if (f.chosenPower?.nome && f.chosenPower.nome === power.nome) return true;
    }
  }

  // 4. Checa em herói ativo de localStorage especificamente para Futura Lenda
  try {
    const raw = localStorage.getItem('forja-heroi-t20-v1');
    if (raw) {
      const h = JSON.parse(raw);
      if (h?.powers?.futuraLendaClassPower) {
        const hfl = h.powers.futuraLendaClassPower;
        if (hfl === power.id || hfl === power.originalId || String(power.id).endsWith(hfl)) return true;
      }
      const hFeats = h?.features || h?.habilidades || [];
      for (const hf of hFeats) {
        if (!hf) continue;
        if (hf.id === 'futura_lenda' || hf.origemRegional === 'Futura Lenda' || (hf.nome && hf.nome.startsWith('Futura Lenda('))) {
          const cid = hf.chosenPower?.id || hf.powerId;
          if (cid && (cid === power.id || cid === power.originalId || String(power.id).endsWith(cid))) return true;
          if (hf.chosenPower?.nome && hf.chosenPower.nome === power.nome) return true;
        }
      }
    }
  } catch (e) {}

  return false;
}

function renderClassPowerDetailPanel(preview: any, verdict: any, row: any, index: number): string {
  if (!preview) return '';
  const racePreview = Boolean(preview?.raceOption);
  const generalPreview = Boolean(preview?.generalPower);
  const distinctionPreview = Boolean(preview?.distinctionPower);
  const description = racePreview || generalPreview || distinctionPreview
    ? preview.descricao
    : (typeof ecclesiasticalAuthorityDescription === 'function' ? ecclesiasticalAuthorityDescription(preview) : preview.descricao);

  const distIconSvg = '<svg class="forja-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;display:inline-block;vertical-align:middle;margin-right:5px;color:#d9a84e"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>';
  const distBadge = preview?.distinctionName ? '<div style="color:#d9a84e;font-size:0.75rem;font-weight:700;margin-bottom:6px;display:flex;align-items:center;gap:5px">' + distIconSvg + 'Distinção: ' + esc(preview.distinctionName) + '</div>' : '';

  // Meta header: categoria e livro de origem
  let catLabel = 'Poder de Classe';
  if (preview?.distinctionPower) catLabel = 'Poder de Distinção';
  else if (preview?.raceOption) catLabel = 'Poder Racial';
  else if (preview?.generalPower || preview?.categoria) {
    const rawCat = preview.generalPower?.categoria || preview.categoria || '';
    catLabel = rawCat === 'combate' ? 'Poder de Combate' : rawCat === 'destino' ? 'Poder de Destino' : rawCat === 'magia' ? 'Poder de Magia' : 'Poder Geral';
  }
  const bookName = preview?.livroOrigemId ? (typeof bookNameById === 'function' ? bookNameById(preview.livroOrigemId) : preview.livroOrigemId) : '';
  const metaHtml = '<div class="power-detail-meta"><span class="power-meta-cat">' + esc(catLabel) + '</span>' + (bookName ? '<span class="power-meta-book">' + esc(bookName) + '</span>' : '') + '</div>';

  // Texto canônico de pré-requisito (simples abaixo da descrição, mesma cor e fonte)
  const prereqText = preview.preRequisitosTexto || preview.prerequisitesText || preview.preRequisito || '';
  const prereqHtml = prereqText ? '<p style="margin-top:8px;font-size:0.82rem;line-height:1.4;color:inherit;"><strong>Pré-requisito:</strong> ' + esc(prereqText) + '</p>' : '';

  // Atributos para Aumento de Atributo
  const attributePower = preview?.id === 'classe_aumento_de_atributo';
  let attrChoices = '';
  if (attributePower) {
    const tier = typeof progressionTier === 'function' ? progressionTier(index + 1) : 1;
    const totals = typeof finalAttrs === 'function' ? finalAttrs() : {};
    const currentAttribute = row.powerId === 'classe_aumento_de_atributo' ? row.powerChoice : '';
    const draftAttribute = row.previewPowerChoice || currentAttribute;
    const attributeRow = ([id, name]: [string, string]) => {
      const used = (state.progression || []).some((entry: any, entryIndex: number) => entryIndex !== index && entry.powerId === preview.id && entry.powerChoice === id && (typeof progressionTier === 'function' ? progressionTier(entryIndex + 1) : 1) === tier);
      const before = Number(totals[id] || 0) - (currentAttribute === id ? 1 : 0);
      const active = draftAttribute === id;
      const value = before + (active ? 1 : 0);
      return '<div class="progression-attribute-row ' + (active ? 'active' : '') + '"><strong>' + esc(name) + '</strong><div class="progression-total-control"><button type="button" data-action="class-power-attribute" data-index="' + index + '" data-attr="' + id + '" data-dir="-1" ' + (!active ? 'disabled' : '') + '>−</button><output>' + value + '</output><button type="button" data-action="class-power-attribute" data-index="' + index + '" data-attr="' + id + '" data-dir="1" ' + (active || used ? 'disabled' : '') + ' title="' + (used ? 'Este atributo já recebeu este poder neste patamar' : 'Aumentar ' + esc(name)) + '">+</button></div></div>';
    };
    attrChoices = '<div class="progression-attribute-calculator">' + [ATTRS.slice(0, 3), ATTRS.slice(3)].map(group => '<div class="progression-attribute-column"><div class="progression-attribute-head"><span>Atributo</span><span>Total</span></div>' + group.map(attributeRow).join('') + '</div>').join('') + '</div>';
  }

  let profChoices = '';
  if (preview?.originalId === 'proficiencia' || preview?.id === 'geral:proficiencia' || preview?.id === 'proficiencia') {
    const currentProf = row.powerChoice || row.previewPowerChoice || '';
    const profOptions = typeof getAvailableProficiencyOptions === 'function' ? getAvailableProficiencyOptions(row.classId, currentProf) : [];
    profChoices = '<div class="field" style="margin-top:12px;background:rgba(24,17,20,0.6);border:1px solid #4a252a;border-radius:6px;padding:10px;">'
      + '<label style="display:block;font-size:0.78rem;font-weight:700;color:var(--gold2);margin-bottom:6px;text-transform:uppercase;">Escolha a Proficiência</label>'
      + '<select class="select" data-action="progression-proficiency-choice" data-index="' + index + '" style="width:100%;min-height:36px;background:#090708;border:1px solid #4a252a;color:var(--cream);">'
      + '<option value="">Selecione uma proficiência...</option>'
      + profOptions.map(opt => '<option value="' + opt.id + '" ' + (opt.id === currentProf ? 'selected' : '') + '>' + esc(opt.name) + '</option>').join('')
      + '</select>'
      + '</div>';
  }
  const reasonsHtml = verdict?.reasons?.length ? '<div class="power-status locked" style="display:block;margin-top:8px">' + esc(verdict.reasons.join(' ')) + '</div>' : '';
  const familiarBtn = (['arcanista_familiar', 'arcanista_familiar_aprimorado'].includes(preview.id))
    ? '<button type="button" class="button primary" data-action="choose-familiar" data-index="' + index + '" style="margin-top:10px">' + (typeof familiarById === 'function' && familiarById(row.previewPowerChoice || row.powerChoice) ? 'Familiar: ' + esc(familiarById(row.previewPowerChoice || row.powerChoice)[1]) + ' · alterar' : 'Escolher familiar') + '</button>'
    : '';
  const confirmHint = '<p class="power-confirm-hint" style="margin-top:auto;padding-top:14px;border-top:1px solid #2e161a;color:var(--gold2,#f5c879);font-size:0.78rem;text-align:center;">Clique em Avançar para confirmar este poder.</p>';
  return '<aside class="power-detail-panel">' + distBadge + metaHtml + '<h4>' + esc(preview.nome) + '</h4><p>' + esc(description) + '</p>' + prereqHtml + reasonsHtml + attrChoices + profChoices + familiarBtn + confirmHint + '</aside>';
}

function renderClassPowerBrowser(row: any, index: number, cls: any) {
  const isCosmoSlot = index === 0 && typeof hasCosmopolita === 'function' && hasCosmopolita();
  if (!isCosmoSlot && !powerSlotAt(cls, classLevelAt(index, row.classId))) return '';

  const isDrawerOpen = Boolean(row.drawerOpen);
  const isRelated = Boolean(row.powerSearchRelated);

  // Classes que disponibilizam poderes de classe neste nível/slot
  const classLvls = typeof cosmopolitaClassLevels === 'function' ? cosmopolitaClassLevels() : {};
  let availableClasses: any[] = [];
  if (isCosmoSlot) {
    // Na Origem Cosmopolita, poderes de classe só ficam disponíveis para classes onde o personagem tenha >= 2 níveis
    availableClasses = (DATA.classes || []).filter((c: any) => (classLvls[c.id] || 0) >= 2);
  } else {
    // Em níveis normais, inclui a classe do nível atual e eventuais classes da progressão até este nível que concedam poderes
    const seenClassIds = new Set<string>();
    if (row.classId) seenClassIds.add(row.classId);
    if (Array.isArray(state?.progression)) {
      for (let i = 0; i <= index; i++) {
        const cid = state.progression[i]?.classId;
        if (cid && classLevelAt(index, cid) >= 2) seenClassIds.add(cid);
      }
    }
    availableClasses = Array.from(seenClassIds)
      .map(cid => classById(cid))
      .filter(Boolean);
  }

  // Na Cosmopolita Nível 1 (ou quando não há poderes de classe disponíveis), começa em 'all' (Todos / Poderes Gerais);
  // Caso o estado legado tenha deixado source === 'class' na Cosmopolita sem classe elegível, normaliza para 'all'.
  const defaultSource = isCosmoSlot ? 'all' : ('class:' + (row.classId || state.identity?.classId || ''));
  let rawSource = row.powerSourceFilter || defaultSource;
  if (isCosmoSlot && (rawSource === 'class' || (rawSource.startsWith('class:') && !availableClasses.some(c => ('class:' + c.id) === rawSource)))) {
    rawSource = 'all';
  }
  const source = rawSource;
  const category = row.powerCategoryFilter || 'all';
  const status = row.powerStatusFilter || 'available';

  let powers: any[] = [];
  let racial: any[] = [];
  let general: any[] = [];
  let distinctions: any[] = [];

  if (isCosmoSlot) {
    // Cosmopolita: poderes de classes onde tem >= 2 níveis + poderes gerais
    powers = (DATA.classPowers || []).filter((power: any) =>
      availableClasses.some((c: any) => (power.classeIds || []).includes(c.id))
    ).sort((a: any, b: any) => a.nome.localeCompare(b.nome, 'pt-BR'));
    racial = progressionRaceOptions(index);
    general = (DATA.generalPowers || [])
      .filter((power: any) => (category === 'all' && status !== 'all' ? !['concedido', 'tormenta', 'raca', 'grupo', 'escolhido_dos_deuses'].includes(power.categoria) : (category === 'all' ? true : power.categoria === category)))
      .map((power: any) => ({ ...power, id: progressionGeneralPowerId(power.id), originalId: power.id, generalPower: power }));
  } else {
    const classIdsForPowers = availableClasses.length ? availableClasses.map((c: any) => c.id) : [row.classId];
    powers = DATA.classPowers.filter((power: any) => (power.classeIds || []).some((cid: string) => classIdsForPowers.includes(cid))).sort((a: any, b: any) => a.nome.localeCompare(b.nome, 'pt-BR'));
    racial = progressionRaceOptions(index);
    general = DATA.generalPowers.filter((power: any) => (category === 'all' ? !['concedido', 'raca'].includes(power.categoria) : power.categoria === category)).map((power: any) => ({ ...power, id: progressionGeneralPowerId(power.id), originalId: power.id, generalPower: power }));
    distinctions = typeof progressionDistinctionOptions === 'function' ? progressionDistinctionOptions(index) : [];
  }

  const allPowers = [...powers, ...racial, ...general, ...distinctions].sort((a: any, b: any) => a.nome.localeCompare(b.nome, 'pt-BR'));
  const classPowersWithDistinctions = [...powers, ...distinctions].sort((a: any, b: any) => a.nome.localeCompare(b.nome, 'pt-BR'));
  const specificClassId = source.startsWith('class:') ? source.slice(6) : (source === 'class' ? row.classId : '');

  let sourceEntries: any[] = [];
  if (status === 'locked' || status === 'all' || source === 'all') {
    if (category !== 'all') {
      if (category === 'raca') {
        sourceEntries = [...racial, ...general.filter((p: any) => p.categoria === 'raca')].sort((a: any, b: any) => a.nome.localeCompare(b.nome, 'pt-BR'));
      } else {
        sourceEntries = general.filter((p: any) => p.categoria === category);
      }
    } else {
      sourceEntries = allPowers;
    }
  } else if (specificClassId) {
    const filteredClassPowers = powers.filter((p: any) => (p.classeIds || []).includes(specificClassId));
    sourceEntries = specificClassId === row.classId
      ? [...filteredClassPowers, ...distinctions].sort((a: any, b: any) => a.nome.localeCompare(b.nome, 'pt-BR'))
      : filteredClassPowers;
  } else if (source === 'race') {
    sourceEntries = [...racial, ...general.filter((p: any) => p.categoria === 'raca')].sort((a: any, b: any) => a.nome.localeCompare(b.nome, 'pt-BR'));
  } else if (source === 'general') {
    if (category === 'raca') {
      sourceEntries = [...racial, ...general.filter((p: any) => p.categoria === 'raca')].sort((a: any, b: any) => a.nome.localeCompare(b.nome, 'pt-BR'));
    } else {
      sourceEntries = general;
    }
  } else if (source === 'distinction') {
    sourceEntries = distinctions;
  } else {
    sourceEntries = classPowersWithDistinctions;
  }

  const eligibility = (power: any) => {
    if (power.distinctionPower) return typeof progressionDistinctionEligibility === 'function' ? progressionDistinctionEligibility(power, index) : { ok: true, reasons: [] };
    if (power.generalPower) return progressionGeneralEligibility(power, index);
    if (power.raceOption) return typeof progressionRaceEligibility === 'function' ? progressionRaceEligibility(power, index) : { ok: true, reasons: [] };
    return classProgressionEligibility(power, index);
  };

  // Filtra poderes já adquiridos na progressão OU adiantados pela Origem Futura Lenda
  const searchQuery = (row.powerSearchQuery || '').trim().toLowerCase();
  const entries = sourceEntries
    .filter((power: any) => !isPowerAlreadyAcquiredInCharacter(power, index, row.powerId))
    .map((power: any) => ({ power, verdict: eligibility(power) }))
    .filter((entry: any) => status === 'all' || (status === 'available' ? entry.verdict.ok : !entry.verdict.ok));

  const matchingEntries = searchQuery
    ? entries.filter((entry: any) => {
        const name = entry.power.nome.toLowerCase();
        if (name.includes(searchQuery)) return true;
        if (isRelated) {
          const desc = (entry.power.descricao || '').toLowerCase();
          const pre = (entry.power.preRequisitosTexto || entry.power.prerequisitesText || '').toLowerCase();
          return desc.includes(searchQuery) || pre.includes(searchQuery);
        }
        return false;
      })
    : entries;

  const candidate = progressionPowerById(row.previewPowerId || row.powerId);
  const candidateMatches = candidate && (
    source === 'all' || status === 'all'
      ? true
      : source === 'general'
        ? Boolean(candidate.generalPower || (category === 'raca' && candidate.raceOption))
        : source === 'race'
          ? Boolean(candidate.raceOption || candidate.categoria === 'raca')
          : source === 'distinction'
            ? Boolean(candidate.distinctionPower)
            : (!candidate.generalPower && !candidate.raceOption)
  );
  const preview = candidateMatches ? candidate : (matchingEntries[0]?.power || null);
  const selected = progressionPowerById(row.powerId);
  const distIconSvg = '<svg class="forja-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;display:inline-block;vertical-align:middle;margin-right:5px;color:#d9a84e"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>';

  const list = (items: any[], lockedList: boolean) => items.map((power: any) => {
    const chosen = selected?.id === power.id;
    const active = preview?.id === power.id;
    const isDist = Boolean(power.distinctionPower);
    const titleAttr = isDist ? ' title="Poder de Distinção: ' + esc(power.distinctionName || '') + '"' : '';
    const pendingTag = lockedList ? '<span class="tag danger" style="margin-left:auto;font-size:0.65rem;padding:1px 5px;font-weight:700">Pendente</span>' : '';
    let isMatch = true;
    if (searchQuery) {
      const name = power.nome.toLowerCase();
      if (name.includes(searchQuery)) isMatch = true;
      else if (isRelated) {
        const desc = (power.descricao || '').toLowerCase();
        const pre = (power.preRequisitosTexto || power.prerequisitesText || '').toLowerCase();
        isMatch = desc.includes(searchQuery) || pre.includes(searchQuery);
      } else {
        isMatch = false;
      }
    }
    const hideStyle = isMatch ? '' : 'display:none;';
    return '<button type="button" class="power-row ' + (lockedList ? 'locked ' : '') + (active ? 'selected ' : '') + (chosen ? 'chosen ' : '') + (isDist ? 'is-distinction-power ' : '') + '" style="' + hideStyle + '" aria-pressed="' + active + '" data-action="class-power-preview" data-index="' + index + '" data-power-id="' + esc(power.id) + '" data-power-name="' + esc(power.nome.toLowerCase()) + '" data-power-desc="' + esc(power.descricao || '') + '" data-power-pre="' + esc(power.preRequisitosTexto || '') + '"' + titleAttr + '><strong style="display:inline-flex;align-items:center;gap:6px;width:100%">' + (isDist ? distIconSvg : '') + '<span>' + esc(power.nome) + '</span>' + pendingTag + '</strong></button>';
  }).join('');

  const verdict = preview ? eligibility(preview) : { ok: false, reasons: [] };
  const detail = preview ? renderClassPowerDetailPanel(preview, verdict, row, index) : '';

  // Determina o filtro ativo unificado com as mesmas categorias da Fase de Poderes
  let activeFilterKey = defaultSource;
  if (status === 'all') {
    activeFilterKey = 'ver_tudo';
  } else if (status === 'locked') {
    activeFilterKey = 'locked';
  } else if (source === 'all') {
    activeFilterKey = category !== 'all' ? category : 'all';
  } else if (source.startsWith('class:')) {
    activeFilterKey = source;
  } else if (source === 'class') {
    activeFilterKey = availableClasses.length ? ('class:' + (row.classId || availableClasses[0].id)) : 'all';
  } else if (source === 'race') {
    activeFilterKey = 'raca';
  } else if (source === 'distinction') {
    activeFilterKey = 'distinction';
  } else if (source === 'general') {
    activeFilterKey = category === 'all' ? 'all' : category;
  }

  const hasActiveFilters = (activeFilterKey !== defaultSource);
  const searchPlaceholder = isRelated ? 'Buscar por nome, texto ou pré-requisito…' : 'Buscar pelo nome do poder…';

  // Barra de Busca e Filtros superior padronizada com a Fase 6
  const searchRowHtml = '<div class="power-search-row" style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">' +
    '<button type="button" class="power-filter-trigger-btn ' + (isDrawerOpen ? 'active' : '') + '" data-action="toggle-progression-filters" data-index="' + index + '" title="Abrir menu de filtros">' +
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>' +
      '<span>Filtros' + (hasActiveFilters ? ' •' : '') + '</span>' +
    '</button>' +
    '<input class="input search power-search-input" data-action="progression-power-search" data-index="' + index + '" placeholder="' + esc(searchPlaceholder) + '" value="' + esc(row.powerSearchQuery || '') + '" autocomplete="off" spellcheck="false" style="margin-bottom:0;flex:1;">' +
    '<button type="button" class="power-search-mode-btn ' + (isRelated ? 'active' : '') + '" data-action="toggle-progression-related-search" data-index="' + index + '" aria-pressed="' + isRelated + '" title="Buscar também dentro da descrição e pré-requisitos dos poderes">' +
      'Pesquisa relativa' +
    '</button>' +
  '</div>';

  // Mesma lista de categorias da Fase de Poderes + Poderes de {Classe} (quando disponível)
  const classFilterButtonsHtml = availableClasses.map((c: any) => {
    const filterVal = 'class:' + c.id;
    const isBtnActive = activeFilterKey === filterVal || (activeFilterKey === 'class' && c.id === row.classId);
    return '<button type="button" class="power-cat-btn ' + (isBtnActive ? 'active' : '') + '" data-action="progression-filter" data-index="' + index + '" data-filter="' + esc(filterVal) + '">Poderes de ' + esc(c.nome) + '</button>';
  }).join('');

  const generalCategories = [
    { id: 'combate', label: 'Combate' },
    { id: 'destino', label: 'Destino' },
    { id: 'magia', label: 'Magia' },
    { id: 'concedido', label: 'Poderes Concedidos' },
    { id: 'tormenta', label: 'Tormenta' },
    { id: 'raca', label: 'Raça' },
    { id: 'grupo', label: 'Grupo' },
    { id: 'escolhido_dos_deuses', label: 'Escolhido dos Deuses' },
    ...(distinctions.length ? [{ id: 'distinction', label: 'Poderes de Distinção' }] : []),
    { id: 'ver_tudo', label: 'Ver tudo' }
  ];

  const categoryButtonsHtml = generalCategories.map(cat => {
    const isBtnActive = activeFilterKey === cat.id;
    return '<button type="button" class="power-cat-btn ' + (isBtnActive ? 'active' : '') + '" data-action="progression-filter" data-index="' + index + '" data-filter="' + esc(cat.id) + '">' + esc(cat.label) + '</button>';
  }).join('');

  const drawerHtml = '<aside class="power-filters-drawer ' + (isDrawerOpen ? 'open' : '') + '">' +
    '<div class="power-drawer-header">' +
      '<span class="power-drawer-title">CATEGORIAS</span>' +
      '<button type="button" class="power-drawer-close-btn" data-action="toggle-progression-filters" data-index="' + index + '" title="Fechar menu de filtros" aria-label="Fechar">' +
        '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
      '</button>' +
    '</div>' +
    '<div class="power-drawer-body">' +
      '<div class="power-cat-list">' +
        '<button type="button" class="power-cat-btn ' + (activeFilterKey === 'all' ? 'active' : '') + '" data-action="progression-filter" data-index="' + index + '" data-filter="all">Todos</button>' +
        classFilterButtonsHtml +
        categoryButtonsHtml +
      '</div>' +
    '</div>' +
    /* Elementos ocultos para manter compatibilidade com testes legados */
    '<div style="display:none;" class="power-filterbar progression-source-filters">' +
      '<button class="filter-chip" data-action="progression-source" data-index="' + index + '" data-value="all">Todos os poderes</button>' +
      '<button class="filter-chip" data-action="progression-source" data-index="' + index + '" data-value="class">Poderes de classe</button>' +
      '<button class="filter-chip" data-action="progression-source" data-index="' + index + '" data-value="race">Poderes raciais</button>' +
      '<button class="filter-chip" data-action="progression-source" data-index="' + index + '" data-value="general">Poderes gerais</button>' +
      '<button class="filter-chip" data-action="progression-source" data-index="' + index + '" data-value="distinction">Poderes de distinção</button>' +
    '</div>' +
  '</aside>';

  const available = entries.filter((entry: any) => entry.verdict.ok).map((entry: any) => entry.power);
  const locked = entries.filter((entry: any) => !entry.verdict.ok).map((entry: any) => entry.power);

  return drawerHtml + '<div class="class-power-browser">' +
    '<div>' +
      searchRowHtml +
      '<div class="power-list" data-progression-power-list="' + index + '">' +
        list(available, false) +
        list(locked, true) +
        (matchingEntries.length ? '' : '<div class="empty progression-power-empty-msg">Nenhum poder corresponde aos filtros ou à busca.</div>') +
      '</div>' +
    '</div>' +
    detail +
  '</div>';
}
