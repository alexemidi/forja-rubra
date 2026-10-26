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
  const reasonsHtml = verdict?.reasons?.length ? '<div class="power-status locked" style="margin-top:8px">' + esc(verdict.reasons.join(' ')) + '</div>' : '';
  const familiarBtn = (['arcanista_familiar', 'arcanista_familiar_aprimorado'].includes(preview.id))
    ? '<button type="button" class="button primary" data-action="choose-familiar" data-index="' + index + '" style="margin-top:10px">' + (typeof familiarById === 'function' && familiarById(row.previewPowerChoice || row.powerChoice) ? 'Familiar: ' + esc(familiarById(row.previewPowerChoice || row.powerChoice)[1]) + ' · alterar' : 'Escolher familiar') + '</button>'
    : '';
  return '<aside class="power-detail-panel">' + distBadge + '<h4>' + esc(preview.nome) + '</h4><p>' + esc(description) + '</p>' + prereqHtml + reasonsHtml + attrChoices + profChoices + familiarBtn + '</aside>';
}

function renderClassPowerBrowser(row: any, index: number, cls: any) {
  if (!powerSlotAt(cls, classLevelAt(index, row.classId))) return '';
  const source = row.powerSourceFilter || 'class', category = row.powerCategoryFilter || 'all', status = row.powerStatusFilter || 'all';
  const powers = DATA.classPowers.filter((power: any) => (power.classeIds || []).includes(row.classId)).sort((a: any, b: any) => a.nome.localeCompare(b.nome, 'pt-BR'));
  const racial = progressionRaceOptions(index);
  const general = DATA.generalPowers.filter((power: any) => !['concedido', 'raca'].includes(power.categoria) && (category === 'all' || power.categoria === category)).map((power: any) => ({ ...power, id: progressionGeneralPowerId(power.id), originalId: power.id, generalPower: power }));
  const distinctions = typeof progressionDistinctionOptions === 'function' ? progressionDistinctionOptions(index) : [];
  const allPowers = [...powers, ...racial, ...general, ...distinctions].sort((a: any, b: any) => a.nome.localeCompare(b.nome, 'pt-BR'));
  const classPowersWithDistinctions = [...powers, ...distinctions].sort((a: any, b: any) => a.nome.localeCompare(b.nome, 'pt-BR'));
  const sourceEntries = source === 'all' ? allPowers : source === 'race' ? racial : source === 'general' ? general : source === 'distinction' ? distinctions : classPowersWithDistinctions;
  const eligibility = (power: any) => power.distinctionPower ? (typeof progressionDistinctionEligibility === 'function' ? progressionDistinctionEligibility(power, index) : { ok: true, reasons: [] }) : power.generalPower ? progressionGeneralEligibility(power, index) : power.raceOption ? power : classProgressionEligibility(power, index);
  
  // Filtra poderes já adquiridos na progressão OU adiantados pela Origem Futura Lenda
  const searchQuery = (row.powerSearchQuery || '').trim().toLowerCase();
  const entries = sourceEntries
    .filter((power: any) => !isPowerAlreadyAcquiredInCharacter(power, index, row.powerId))
    .map((power: any) => ({ power, verdict: eligibility(power) }))
    .filter((entry: any) => status === 'all' || (status === 'available') === entry.verdict.ok)
    .filter((entry: any) => !searchQuery || entry.power.nome.toLowerCase().includes(searchQuery) || (entry.power.descricao && entry.power.descricao.toLowerCase().includes(searchQuery)));
  
  const candidate = progressionPowerById(row.previewPowerId || row.powerId);
  const candidateMatches = candidate && (source === 'all' ? true : source === 'general' ? candidate.generalPower : source === 'race' ? candidate.raceOption : source === 'distinction' ? candidate.distinctionPower : (!candidate.generalPower && !candidate.raceOption));
  const preview = candidateMatches ? candidate : (entries[0]?.power || null);
  const selected = progressionPowerById(row.powerId);
  const distIconSvg = '<svg class="forja-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;display:inline-block;vertical-align:middle;margin-right:5px;color:#d9a84e"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>';
  
  const list = (items: any[], lockedList: boolean) => items.map((power: any) => {
    const chosen = selected?.id === power.id;
    const active = preview?.id === power.id;
    const isDist = Boolean(power.distinctionPower);
    const titleAttr = isDist ? ' title="Poder de Distinção: ' + esc(power.distinctionName || '') + '"' : '';
    const pendingTag = lockedList ? '<span class="tag danger" style="margin-left:auto;font-size:0.65rem;padding:1px 5px;font-weight:700">Pendente</span>' : '';
    return '<button type="button" class="power-row ' + (lockedList ? 'locked ' : '') + (active ? 'selected ' : '') + (chosen ? 'chosen ' : '') + (isDist ? 'is-distinction-power ' : '') + '" aria-pressed="' + active + '" data-action="class-power-preview" data-index="' + index + '" data-power-id="' + esc(power.id) + '" data-power-name="' + esc(power.nome.toLowerCase()) + '"' + titleAttr + '><strong style="display:inline-flex;align-items:center;gap:6px;width:100%">' + (isDist ? distIconSvg : '') + '<span>' + esc(power.nome) + '</span>' + pendingTag + '</strong></button>';
  }).join('');

  const verdict = preview ? eligibility(preview) : { ok: false, reasons: [] };
  const detail = preview ? renderClassPowerDetailPanel(preview, verdict, row, index) : '';
  
  const searchInputHtml = '<div class="power-search-box" style="margin-top:10px;margin-bottom:6px;"><input type="search" class="input power-search-input" data-action="progression-power-search" data-index="' + index + '" placeholder="Buscar poder pelo nome (classe, geral, etc.)..." value="' + esc(row.powerSearchQuery || '') + '" autocomplete="off" style="width:100%;padding:7px 12px;background:var(--panel2,#181114);border:1px solid var(--line,#4a252a);color:var(--cream,#f5eee6);border-radius:6px;font-size:0.85rem;"></div>';
  const sourceFilters = '<div class="power-filterbar progression-source-filters"><button class="filter-chip ' + (source === 'all' ? 'active' : '') + '" data-action="progression-source" data-index="' + index + '" data-value="all">Todos os poderes</button><button class="filter-chip ' + (source === 'class' ? 'active' : '') + '" data-action="progression-source" data-index="' + index + '" data-value="class">Poderes de classe</button>' + (racial.length || source === 'race' ? '<button class="filter-chip ' + (source === 'race' ? 'active' : '') + '" data-action="progression-source" data-index="' + index + '" data-value="race">Poderes raciais</button>' : '') + '<button class="filter-chip ' + (source === 'general' ? 'active' : '') + '" data-action="progression-source" data-index="' + index + '" data-value="general">Poderes gerais</button>' + (distinctions.length || source === 'distinction' ? '<button class="filter-chip ' + (source === 'distinction' ? 'active' : '') + '" data-action="progression-source" data-index="' + index + '" data-value="distinction">Poderes de distinção</button>' : '') + '</div>';
  const generalFilters = source === 'general' ? '<div class="power-filterbar"><button class="filter-chip ' + (category === 'all' ? 'active' : '') + '" data-action="progression-category" data-index="' + index + '" data-value="all">Todos</button>' + POWER_CATEGORY_ORDER.filter(id => !['concedido', 'raca'].includes(id)).map(id => '<button class="filter-chip ' + (category === id ? 'active' : '') + '" data-action="progression-category" data-index="' + index + '" data-value="' + id + '">' + esc(POWER_CATEGORY_LABEL[id]) + '</button>').join('') + '</div>' : '';
  const statusFilters = '<div class="power-filterbar"><button class="filter-chip ' + (status === 'all' ? 'active' : '') + '" data-action="progression-status" data-index="' + index + '" data-value="all">Todos</button><button class="filter-chip ' + (status === 'available' ? 'active' : '') + '" data-action="progression-status" data-index="' + index + '" data-value="available">Disponíveis</button><button class="filter-chip ' + (status === 'locked' ? 'active' : '') + '" data-action="progression-status" data-index="' + index + '" data-value="locked">Pré-requisito pendente</button></div>';
  const available = entries.filter((entry: any) => entry.verdict.ok).map((entry: any) => entry.power);
  const locked = entries.filter((entry: any) => !entry.verdict.ok).map((entry: any) => entry.power);
  
  return searchInputHtml + sourceFilters + generalFilters + statusFilters + '<div class="class-power-browser"><div><div class="power-list" data-progression-power-list="' + index + '">' + list(available, false) + list(locked, true) + (entries.length ? '' : '<div class="empty">Nenhum poder corresponde aos filtros ou à busca.</div>') + '</div></div>' + detail + '</div>';
}
