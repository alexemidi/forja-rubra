function showGuildToast(msg) {
  const toast = document.getElementById('guildToast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('visible');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('visible'), 2800);
}

function syncGuildWalletUI() {
  const el = document.getElementById('guildWalletDisplay');
  if (el) el.textContent = formatGuildPrice(guildState.funds);

  const counts = getActiveGuildCounts();
  const limitEl = document.getElementById('guildLimitDisplay');
  if (limitEl) {
    limitEl.textContent = `${counts.normalCount}/${counts.limit.maxPartners}`;
  }

  const contractsCountEl = document.getElementById('guildContractsCount');
  if (contractsCountEl) {
    const totalAllies = (guildState.contracts?.length || 0) + (guildState.partners?.length || 0);
    contractsCountEl.textContent = String(totalAllies);
  }
}

function renderGuildChips() {
  const container = document.getElementById('guildFilterChips');
  if (!container) return;

  const tiers = [
    { id: 'todos', label: 'Todos' },
    { id: 'iniciante', label: 'Iniciantes' },
    { id: 'veterano', label: 'Veteranos' }
  ];

  if (guildState.activeTab === 'parceiros' || guildState.activeTab === 'estabulo') {
    tiers.push({ id: 'mestre', label: 'Mestres' });
  }

  container.innerHTML = tiers.map(t => {
    const active = guildState.filterTier === t.id ? ' active' : '';
    return `<button type="button" class="filter-chip${active}" data-filter-tier="${t.id}">${t.label}</button>`;
  }).join('');
}

function getFilteredPartners() {
  let list = CANONICAL_PARTNERS;
  if (guildState.search.trim()) {
    const q = guildState.search.trim().toLowerCase();
    list = list.filter(p => {
      const name = (p.nome || '').toLowerCase();
      const desc = (p.desc || '').toLowerCase();
      const role = (p.role || '').toLowerCase();
      return name.includes(q) || desc.includes(q) || role.includes(q);
    });
  }
  return list;
}

function getFilteredMounts() {
  let list = CANONICAL_MOUNTS;
  if (guildState.search.trim()) {
    const q = guildState.search.trim().toLowerCase();
    list = list.filter(m => {
      const name = (m.nome || '').toLowerCase();
      const desc = (m.desc || '').toLowerCase();
      const role = (m.role || '').toLowerCase();
      return name.includes(q) || desc.includes(q) || role.includes(q);
    });
  }
  return list;
}

function getFilteredMercenaries() {
  let list = CANONICAL_MERCENARIES;
  if (guildState.filterTier !== 'todos') {
    list = list.filter(m => m.tier === guildState.filterTier);
  }
  if (guildState.search.trim()) {
    const q = guildState.search.trim().toLowerCase();
    list = list.filter(m => {
      const name = (m.name || '').toLowerCase();
      const desc = (m.desc || '').toLowerCase();
      const role = (m.role || '').toLowerCase();
      const ben = (m.benefit || '').toLowerCase();
      return name.includes(q) || desc.includes(q) || role.includes(q) || ben.includes(q);
    });
  }
  return list;
}

function syncGuildTabsUI() {
  document.querySelectorAll('.guild-tab-btn[data-guild-tab]').forEach(b => {
    const isAct = b.dataset.guildTab === guildState.activeTab;
    b.classList.toggle('active', isAct);
    b.setAttribute('aria-selected', isAct ? 'true' : 'false');
  });
}

function renderGuildContent() {
  syncGuildTabsUI();
  const grid = document.getElementById('guildCardsGrid');
  const empty = document.getElementById('guildEmptyState');
  const title = document.getElementById('guildSectionTitle');
  const count = document.getElementById('guildResultsCount');
  if (!grid) return;

  if (guildState.activeTab === 'parceiros') {
    if (title) title.textContent = 'Parceiros de Aventura de Arton';
    const items = getFilteredPartners();
    if (count) count.textContent = `${items.length} ${items.length === 1 ? 'tipo disponível' : 'tipos disponíveis'}`;

    if (!items.length) {
      grid.innerHTML = '';
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;

    const counts = getActiveGuildCounts();
    const lvl = guildState.level;

    grid.innerHTML = items.map(p => {
      const alreadyHas = Array.isArray(guildState.partners) && guildState.partners.some(active => (active.type || active.tipo) === p.id || active.name === p.nome);
      const limitReached = counts.normalCount >= counts.limit.maxPartners;

      const selectedTier = p._selectedTier || 'iniciante';
      const benefitText = p[selectedTier] || p.iniciante;

      const canSelectVet = lvl >= 5;
      const canSelectMestre = lvl >= 17;

      let actionBtn = '';
      if (alreadyHas) {
        actionBtn = '<button class="btn btn-secondary" type="button" disabled>Já Recebido</button>';
      } else if (limitReached) {
        actionBtn = `<button class="btn btn-secondary" type="button" disabled title="Limite de parceiros atingido (${counts.normalCount}/${counts.limit.maxPartners})">Limite Atingido</button>`;
      } else {
        actionBtn = `<button class="btn btn-primary" type="button" data-action="receive-partner" data-partner-id="${p.id}" data-partner-tier="${selectedTier}">Receber Parceiro</button>`;
      }

      return `
        <article class="guild-card" data-partner-id="${p.id}">
          <div class="card-top">
            <div class="card-header-line">
              <span class="card-badge badge-${selectedTier}">${selectedTier}</span>
              <div class="card-price-tag">
                <span class="card-price-value">Campanha</span>
                <span class="card-price-period">Sem custo em T$</span>
              </div>
            </div>
            <h3 class="card-title">${p.nome}</h3>
            <div class="card-role">${p.role}</div>
          </div>
          <div class="card-body-scroll">
            <p class="card-desc">${p.desc}</p>
            <div class="card-benefit-box">
              <strong>Efeito (${selectedTier}):</strong> ${benefitText}
            </div>
            ${(canSelectVet || canSelectMestre) ? `
              <div class="card-mode-toggle">
                <button type="button" class="card-mode-btn ${selectedTier === 'iniciante' ? 'active' : ''}" data-action="select-partner-tier" data-partner-id="${p.id}" data-tier="iniciante">Inic.</button>
                <button type="button" class="card-mode-btn ${selectedTier === 'veterano' ? 'active' : ''}" data-action="select-partner-tier" data-partner-id="${p.id}" data-tier="veterano" ${!canSelectVet ? 'disabled title="Exige Nível 5+"' : ''}>Vet.</button>
                <button type="button" class="card-mode-btn ${selectedTier === 'mestre' ? 'active' : ''}" data-action="select-partner-tier" data-partner-id="${p.id}" data-tier="mestre" ${!canSelectMestre ? 'disabled title="Exige Nível 17+"' : ''}>Mestre</button>
              </div>
            ` : ''}
          </div>
          <div class="card-actions">
            ${actionBtn}
          </div>
        </article>
      `;
    }).join('');

  } else if (guildState.activeTab === 'mercenarios') {
    if (title) title.textContent = 'Mercenários & Tropas de Aluguel';
    const items = getFilteredMercenaries();
    if (count) count.textContent = `${items.length} ${items.length === 1 ? 'opção disponível' : 'opções disponíveis'}`;

    if (!items.length) {
      grid.innerHTML = '';
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;

    const counts = getActiveGuildCounts();
    const hasWar = hasGuildWarTraining();

    grid.innerHTML = items.map(m => {
      const st = guildState.mercenaryChoices[m.id] || {
        durationMode: 'cena',
        choice: m.customChoice?.options[0] || null
      };
      guildState.mercenaryChoices[m.id] = st;

      const isVeterano = m.tier === 'veterano';
      const isAdventure = st.durationMode === 'aventura';
      const unitPrice = isAdventure ? (isVeterano ? 450 : 90) : (isVeterano ? 150 : 30);
      const canAfford = guildState.funds >= unitPrice;
      const reqWarFailed = Boolean(m.requiresWar && !hasWar);

      const limitReached = counts.normalCount >= counts.limit.maxPartners;
      const tierNotAllowed = isVeterano && counts.limit.maxVeterans <= 0;
      const vetLimitReached = isVeterano && counts.veteranCount >= counts.limit.maxVeterans;
      const partnerBlocked = limitReached || tierNotAllowed || vetLimitReached;
      const canHire = canAfford && !reqWarFailed && !partnerBlocked;

      let hireBtnText = 'Contratar';
      let hireBtnDisabled = false;
      let hireBtnTitle = '';

      if (reqWarFailed) {
        hireBtnText = 'Exige Treino em Guerra';
        hireBtnDisabled = true;
        hireBtnTitle = 'Você precisa ser treinado na perícia Guerra para comandar esta tropa.';
      } else if (!canAfford) {
        hireBtnText = 'Fundos Insuficientes';
        hireBtnDisabled = true;
        hireBtnTitle = `Custo de T$ ${unitPrice} excede seu saldo de T$ ${guildState.funds}.`;
      } else if (tierNotAllowed) {
        hireBtnText = 'Exige Nível 5+';
        hireBtnDisabled = true;
        hireBtnTitle = 'Aliados veteranos exigem Patamar Veterano (Nível 5 ou superior).';
      } else if (partnerBlocked) {
        hireBtnText = 'Limite Atingido';
        hireBtnDisabled = true;
        hireBtnTitle = `Limite de parceiros atingido (${counts.normalCount}/${counts.limit.maxPartners}).`;
      }

      return `
        <article class="guild-card" data-mercenary-id="${m.id}">
          <div class="card-top">
            <div class="card-header-line">
              <span class="card-badge badge-${m.tier}">${m.tier}</span>
              <div class="card-price-tag">
                <span class="card-price-value">T$ ${unitPrice}</span>
                <span class="card-price-period">${isAdventure ? 'por aventura' : 'por cena'}</span>
              </div>
            </div>
            <h3 class="card-title">${m.name}</h3>
            <div class="card-role">${m.role} · ${m.partnerType}</div>
          </div>
          <div class="card-body-scroll">
            <p class="card-desc">${m.desc}</p>
            <div class="card-benefit-box">
              <strong>Efeito:</strong> ${m.benefit}
            </div>
            <div class="card-mode-toggle">
              <button type="button" class="card-mode-btn ${!isAdventure ? 'active' : ''}" data-action="toggle-merc-mode" data-merc-id="${m.id}" data-mode="cena">Por Cena (1x)</button>
              <button type="button" class="card-mode-btn ${isAdventure ? 'active' : ''}" data-action="toggle-merc-mode" data-merc-id="${m.id}" data-mode="aventura">Aventura (3x)</button>
            </div>
            ${m.customChoice ? `
              <div class="card-custom-select">
                <label>${m.customChoice.label}</label>
                <select data-action="merc-custom-choice" data-merc-id="${m.id}">
                  ${m.customChoice.options.map(opt => `<option value="${opt}" ${opt === st.choice ? 'selected' : ''}>${opt}</option>`).join('')}
                </select>
              </div>
            ` : ''}
          </div>
          <div class="card-actions">
            <button class="btn btn-primary" type="button" data-action="hire-mercenary" data-merc-id="${m.id}" ${hireBtnDisabled ? 'disabled' : ''} title="${hireBtnTitle}">
              ${hireBtnText}
            </button>
          </div>
        </article>
      `;
    }).join('');

  } else if (guildState.activeTab === 'estabulo') {
    if (title) title.textContent = 'Estábulo & Montarias de Arton';
    const items = getFilteredMounts();
    if (count) count.textContent = `${items.length} ${items.length === 1 ? 'montaria disponível' : 'montarias disponíveis'}`;

    if (!items.length) {
      grid.innerHTML = '';
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;

    const counts = getActiveGuildCounts();
    const lvl = guildState.level;

    grid.innerHTML = items.map(m => {
      const st = guildState.mountChoices[m.id] || {
        size: (m.tamanhos && m.tamanhos[0]) || 'Grande',
        tier: 'iniciante'
      };
      guildState.mountChoices[m.id] = st;

      const selectedTier = st.tier || 'iniciante';
      const selectedSize = st.size || (m.tamanhos && m.tamanhos[0]) || 'Grande';
      const benefitText = m[selectedTier] || m.iniciante;

      const alreadyHas = Array.isArray(guildState.partners) && guildState.partners.some(p =>
        (p.partnerType === 'Montaria' || p.type === 'montaria' || p.tipo === 'montaria' || String(p.tipo || p.type || '').includes(m.id)) &&
        (p.type === m.id || p.tipo === m.id || p.name === m.nome)
      );

      const canAfford = guildState.funds >= m.preco;
      const canSelectVet = lvl >= 5;
      const canSelectMestre = lvl >= 17;
      const limitReached = counts.normalCount >= counts.limit.maxPartners;

      let receiveBtn = '';
      if (alreadyHas) {
        receiveBtn = '<button class="btn btn-secondary" type="button" disabled>Já no Estábulo</button>';
      } else if (limitReached) {
        receiveBtn = `<button class="btn btn-secondary" type="button" disabled title="Limite de parceiros atingido (${counts.normalCount}/${counts.limit.maxPartners})">Limite Atingido</button>`;
      } else {
        receiveBtn = `<button class="btn btn-secondary" type="button" data-action="receive-mount" data-mount-id="${m.id}" title="Receber gratuitamente por habilidade (ex: Ginete, Montaria Sagrada) ou campanha">Receber (Campanha)</button>`;
      }

      let buyBtn = '';
      if (alreadyHas) {
        buyBtn = '';
      } else if (selectedTier !== 'iniciante') {
        buyBtn = `<button class="btn btn-secondary" type="button" disabled title="Pelas regras de Tormenta 20, não é possível comprar montarias acima do nível iniciante. Níveis superiores são obtidos por treino de parceiro ou habilidades de classe.">Apenas Iniciante à Venda</button>`;
      } else if (!canAfford) {
        buyBtn = `<button class="btn btn-primary" type="button" disabled title="Saldo insuficiente (T$ ${guildState.funds} de T$ ${m.preco})">Comprar (${formatGuildPrice(m.preco)})</button>`;
      } else if (limitReached) {
        buyBtn = `<button class="btn btn-primary" type="button" disabled title="Limite de parceiros atingido">Limite Atingido</button>`;
      } else {
        buyBtn = `<button class="btn btn-primary" type="button" data-action="buy-mount" data-mount-id="${m.id}" title="Comprar montaria iniciante por ${formatGuildPrice(m.preco)}">Comprar (${formatGuildPrice(m.preco)})</button>`;
      }

      return `
        <article class="guild-card" data-mount-id="${m.id}">
          <div class="card-top">
            <div class="card-header-line">
              <span class="card-badge badge-${selectedTier}">${selectedTier} · ${selectedSize}</span>
              <div class="card-price-tag">
                <span class="card-price-value">${selectedTier === 'iniciante' ? formatGuildPrice(m.preco) : '—'}</span>
                <span class="card-price-period">${selectedTier === 'iniciante' ? 'ou grátis em campanha' : 'apenas campanha / treino'}</span>
              </div>
            </div>
            <h3 class="card-title">${m.nome}</h3>
            <div class="card-role">${m.role} · Montaria</div>
          </div>
          <div class="card-body-scroll">
            <p class="card-desc">${m.desc}</p>
            <div class="card-benefit-box">
              <strong>Efeito (${selectedTier}):</strong> ${benefitText}
            </div>
            ${(m.tamanhos && m.tamanhos.length > 1) ? `
              <div class="card-custom-select">
                <label>Tamanho da Montaria:</label>
                <select data-action="select-mount-size" data-mount-id="${m.id}">
                  ${m.tamanhos.map(sz => `<option value="${sz}" ${sz === selectedSize ? 'selected' : ''}>${sz}</option>`).join('')}
                </select>
              </div>
            ` : ''}
            ${(canSelectVet || canSelectMestre) ? `
              <div class="card-mode-toggle">
                <button type="button" class="card-mode-btn ${selectedTier === 'iniciante' ? 'active' : ''}" data-action="select-mount-tier" data-mount-id="${m.id}" data-tier="iniciante">Inic.</button>
                <button type="button" class="card-mode-btn ${selectedTier === 'veterano' ? 'active' : ''}" data-action="select-mount-tier" data-mount-id="${m.id}" data-tier="veterano" ${!canSelectVet ? 'disabled title="Exige Nível 5+"' : ''}>Vet.</button>
                <button type="button" class="card-mode-btn ${selectedTier === 'mestre' ? 'active' : ''}" data-action="select-mount-tier" data-mount-id="${m.id}" data-tier="mestre" ${!canSelectMestre ? 'disabled title="Exige Nível 17+"' : ''}>Mestre</button>
              </div>
            ` : ''}
          </div>
          <div class="card-actions">
            ${receiveBtn}
            ${buyBtn}
          </div>
        </article>
      `;
    }).join('');
  }
}

function handleReceiveMount(mountId) {
  const m = CANONICAL_MOUNTS.find(item => item.id === mountId);
  if (!m) return;

  const counts = getActiveGuildCounts();
  if (counts.normalCount >= counts.limit.maxPartners) {
    showGuildToast(`Limite de parceiros atingido (${counts.normalCount}/${counts.limit.maxPartners}) para o nível ${guildState.level}.`);
    return;
  }

  const st = guildState.mountChoices[m.id] || { size: (m.tamanhos && m.tamanhos[0]) || 'Grande', tier: 'iniciante' };
  const selectedTier = st.tier || 'iniciante';
  const selectedSize = st.size || (m.tamanhos && m.tamanhos[0]) || 'Grande';
  const benefit = m[selectedTier] || m.iniciante;

  const mountEntry = {
    name: m.nome,
    tipo: m.id,
    type: m.id,
    partnerType: 'Montaria',
    mountSize: selectedSize,
    tier: selectedTier,
    grau: selectedTier,
    mountId: 'mnt-' + Date.now().toString(36),
    benefit: benefit
  };

  guildState.partners = Array.isArray(guildState.partners) ? guildState.partners : [];
  guildState.partners.push(mountEntry);
  saveGuildStorage();
  syncGuildWalletUI();
  renderGuildContent();

  showGuildToast(`Montaria ${m.nome} (${selectedTier}) recebida no Estábulo da Guilda!`);
}

function handleBuyMount(mountId) {
  const m = CANONICAL_MOUNTS.find(item => item.id === mountId);
  if (!m) return;

  const counts = getActiveGuildCounts();
  if (counts.normalCount >= counts.limit.maxPartners) {
    showGuildToast(`Limite de parceiros atingido (${counts.normalCount}/${counts.limit.maxPartners}) para o nível ${guildState.level}.`);
    return;
  }

  if (guildState.funds < m.preco) {
    showGuildToast(`Saldo insuficiente! Custo T$ ${m.preco}, seu saldo: T$ ${guildState.funds}.`);
    return;
  }

  const st = guildState.mountChoices[m.id] || { size: (m.tamanhos && m.tamanhos[0]) || 'Grande', tier: 'iniciante' };
  if (st.tier && st.tier !== 'iniciante') {
    showGuildToast('Pelas regras de Tormenta 20, só é possível comprar montarias no grau iniciante.');
    return;
  }
  const selectedSize = st.size || (m.tamanhos && m.tamanhos[0]) || 'Grande';

  guildState.funds -= m.preco;

  const mountEntry = {
    name: m.nome,
    tipo: m.id,
    type: m.id,
    partnerType: 'Montaria',
    mountSize: selectedSize,
    tier: 'iniciante',
    grau: 'iniciante',
    mountId: 'mnt-' + Date.now().toString(36),
    benefit: m.iniciante
  };

  guildState.partners = Array.isArray(guildState.partners) ? guildState.partners : [];
  guildState.partners.push(mountEntry);
  saveGuildStorage();
  syncGuildWalletUI();
  renderGuildContent();

  showGuildToast(`Montaria ${m.nome} comprada com sucesso por ${formatGuildPrice(m.preco)}!`);
}

const GUILD_AJUDANTE_SKILLS = [
  { id: 'acrobacia', name: 'Acrobacia' },
  { id: 'adestramento', name: 'Adestramento' },
  { id: 'atletismo', name: 'Atletismo' },
  { id: 'atuacao', name: 'Atuação' },
  { id: 'cavalgar', name: 'Cavalgar' },
  { id: 'conhecimento', name: 'Conhecimento' },
  { id: 'cura', name: 'Cura' },
  { id: 'diplomacia', name: 'Diplomacia' },
  { id: 'enganacao', name: 'Enganação' },
  { id: 'fortitude', name: 'Fortitude' },
  { id: 'furtividade', name: 'Furtividade' },
  { id: 'guerra', name: 'Guerra' },
  { id: 'iniciativa', name: 'Iniciativa' },
  { id: 'intimidacao', name: 'Intimidação' },
  { id: 'intuicao', name: 'Intuição' },
  { id: 'investigacao', name: 'Investigação' },
  { id: 'jogatina', name: 'Jogatina' },
  { id: 'ladinagem', name: 'Ladinagem' },
  { id: 'misticismo', name: 'Misticismo' },
  { id: 'nobreza', name: 'Nobreza' },
  { id: 'oficio', name: 'Ofício' },
  { id: 'percepcao', name: 'Percepção' },
  { id: 'pilotagem', name: 'Pilotagem' },
  { id: 'reflexos', name: 'Reflexos' },
  { id: 'religiao', name: 'Religião' },
  { id: 'sobrevivencia', name: 'Sobrevivência' },
  { id: 'vontade', name: 'Vontade' }
];

function openGuildHelperModal(tier) {
  const modal = document.getElementById('guildHelperModal');
  const title = document.getElementById('guildHelperModalTitle');
  const desc = document.getElementById('guildHelperModalDesc');
  const tierInp = document.getElementById('guildHelperSelectedTier');
  const slotsContainer = document.getElementById('guildHelperSlots');
  if (!modal || !slotsContainer) return;

  const selectedTier = tier || 'iniciante';
  if (tierInp) tierInp.value = selectedTier;

  const numSlots = selectedTier === 'iniciante' ? 2 : 3;
  const bonus = selectedTier === 'mestre' ? '+4' : '+2';
  const tierLabel = selectedTier === 'iniciante' ? 'Iniciante' : (selectedTier === 'veterano' ? 'Veterano' : 'Mestre');

  if (title) title.textContent = `Configurar Parceiro: Ajudante (${tierLabel})`;
  if (desc) desc.textContent = `Escolha ${numSlots} perícias distintas (exceto Luta e Pontaria). Você recebe bônus de ${bonus} nessas perícias.`;

  const defaultChoices = ['diplomacia', 'investigacao', 'ladinagem'];
  let slotsHtml = '';
  for (let i = 0; i < numSlots; i++) {
    const currentDefault = defaultChoices[i] || GUILD_AJUDANTE_SKILLS[0].id;
    slotsHtml += `
      <label class="field helper-slot-field">
        <span class="helper-slot-label">Perícia ${i + 1} (${bonus}):</span>
        <select class="select guild-helper-slot helper-slot-select" data-slot="${i}">
          ${GUILD_AJUDANTE_SKILLS.map(sk => `<option value="${sk.id}" ${sk.id === currentDefault ? 'selected' : ''}>${sk.name}</option>`).join('')}
        </select>
      </label>
    `;
  }
  slotsContainer.innerHTML = slotsHtml;
  modal.hidden = false;
}

function closeGuildHelperModal() {
  const modal = document.getElementById('guildHelperModal');
  if (modal) modal.hidden = true;
}

function handleReceivePartner(partnerId, tier, chosenSkills) {
  const p = CANONICAL_PARTNERS.find(item => item.id === partnerId);
  if (!p) return;

  const counts = getActiveGuildCounts();
  if (counts.normalCount >= counts.limit.maxPartners) {
    showGuildToast(`Limite de parceiros atingido (${counts.normalCount}/${counts.limit.maxPartners}) para o nível ${guildState.level}.`);
    return;
  }

  const selectedTier = tier || 'iniciante';
  let benefit = p[selectedTier] || p.iniciante;

  const isHelper = partnerId === 'ajudante';
  if (isHelper && (!chosenSkills || !chosenSkills.length)) {
    openGuildHelperModal(selectedTier);
    return;
  }

  const partnerEntry = {
    name: p.nome,
    tipo: p.id,
    type: p.id,
    tier: selectedTier,
    grau: selectedTier,
    benefit: benefit
  };

  if (isHelper && Array.isArray(chosenSkills) && chosenSkills.length > 0) {
    partnerEntry.skills = chosenSkills;
    const bonusVal = selectedTier === 'mestre' ? '+4' : '+2';
    const skNames = chosenSkills.map(sk => GUILD_AJUDANTE_SKILLS.find(s => s.id === sk)?.name || sk);
    partnerEntry.benefit = `${bonusVal} em ${skNames.join(', ')}.`;
  }

  guildState.partners = Array.isArray(guildState.partners) ? guildState.partners : [];
  guildState.partners.push(partnerEntry);
  saveGuildStorage();
  syncGuildWalletUI();
  renderGuildContent();

  if (window.parent && window.parent !== window) {
    window.parent.postMessage({
      channel: 'forja-taverna-v1',
      type: 'hire',
      contract: {
        contractId: 'pt-' + Date.now().toString(36),
        itemName: p.nome + ` (${selectedTier})`,
        category: 'mercenario',
        partnerCategory: 'parceiros',
        totalPrice: 0
      }
    }, '*');
  }

  showGuildToast(`Parceiro ${p.nome} (${selectedTier}) adicionado à sua ficha!`);
}

function handleHireMercenary(mercId) {
  const m = CANONICAL_MERCENARIES.find(item => item.id === mercId);
  if (!m) return;

  const st = guildState.mercenaryChoices[m.id] || { durationMode: 'cena', choice: null };
  const isVeterano = m.tier === 'veterano';
  const isAdventure = st.durationMode === 'aventura';
  const unitPrice = isAdventure ? (isVeterano ? 450 : 90) : (isVeterano ? 150 : 30);

  if (guildState.funds < unitPrice) {
    showGuildToast(`Saldo insuficiente! Custo T$ ${unitPrice}, seu saldo: T$ ${guildState.funds}.`);
    return;
  }

  const counts = getActiveGuildCounts();
  if (counts.normalCount >= counts.limit.maxPartners) {
    showGuildToast(`Limite de parceiros atingido (${counts.normalCount}/${counts.limit.maxPartners}).`);
    return;
  }

  guildState.funds -= unitPrice;

  const customLabel = st.choice ? ` [${st.choice}]` : '';
  const contract = {
    contractId: 'ct-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
    itemId: m.id,
    itemName: m.name + customLabel + (isAdventure ? ' (Aventura)' : ' (Cena)'),
    partnerType: m.partnerType,
    durationMode: isAdventure ? 'aventura' : 'cena',
    tier: m.tier,
    category: 'mercenario',
    quantity: 1,
    unitPrice: unitPrice,
    totalPrice: unitPrice,
    date: new Date().toLocaleDateString('pt-BR'),
    description: m.desc,
    benefit: m.benefit
  };

  guildState.contracts = Array.isArray(guildState.contracts) ? guildState.contracts : [];
  guildState.contracts.push(contract);
  saveGuildStorage();
  syncGuildWalletUI();
  renderGuildContent();

  if (window.parent && window.parent !== window) {
    window.parent.postMessage({
      channel: 'forja-taverna-v1',
      type: 'hire',
      contract: contract
    }, '*');
  }

  showGuildToast(`Mercenário ${m.name} contratado com sucesso por T$ ${unitPrice}!`);
}

function openGuildContractsModal() {
  const modal = document.getElementById('guildContractsModal');
  const list = document.getElementById('guildContractsList');
  if (!modal || !list) return;

  const allPartners = (guildState.partners || []).map((p, idx) => ({ p, idx })).filter(({ p }) => p.partnerType !== 'Montaria');
  const allMounts = (guildState.partners || []).map((p, idx) => ({ p, idx })).filter(({ p }) => p.partnerType === 'Montaria');
  const allContracts = guildState.contracts || [];

  if (!allPartners.length && !allMounts.length && !allContracts.length) {
    list.innerHTML = '<p class="contract-empty-note">Nenhum parceiro, montaria ou mercenário ativo no momento.</p>';
  } else {
    let html = '';
    if (allPartners.length > 0) {
      html += '<h4 class="contract-section-title">Parceiros de Campanha</h4>';
      html += allPartners.map(({ p, idx }) => `
        <div class="contract-card">
          <div class="contract-meta">
            <strong>${p.name || p.nome}</strong>
            <small>Patamar: ${p.tier || p.grau || 'Iniciante'} · Efeito: ${p.benefit || ''}</small>
          </div>
          <button class="btn btn-danger" type="button" data-action="dismiss-partner" data-index="${idx}">Dispensar</button>
        </div>
      `).join('');
    }

    if (allMounts.length > 0) {
      html += '<h4 class="contract-section-title">Montarias no Estábulo</h4>';
      html += allMounts.map(({ p, idx }) => `
        <div class="contract-card">
          <div class="contract-meta">
            <strong>${p.name || p.nome}</strong>
            <small>Tamanho: ${p.mountSize || 'Grande'} · Patamar: ${p.tier || p.grau || 'Iniciante'} · Efeito: ${p.benefit || ''}</small>
          </div>
          <button class="btn btn-danger" type="button" data-action="dismiss-partner" data-index="${idx}">Dispensar</button>
        </div>
      `).join('');
    }

    if (allContracts.length > 0) {
      html += '<h4 class="contract-section-title">Contratos de Mercenários</h4>';
      html += allContracts.map(c => `
        <div class="contract-card">
          <div class="contract-meta">
            <strong>${c.itemName}</strong>
            <small>Duração: ${c.durationMode === 'aventura' ? 'Aventura Inteira' : 'Por Cena'} · Custo pago: T$ ${c.totalPrice}</small>
          </div>
          <button class="btn btn-danger" type="button" data-action="dismiss-mercenary" data-contract-id="${c.contractId}">Encerrar</button>
        </div>
      `).join('');
    }
    list.innerHTML = html;
  }

  modal.hidden = false;
}

function closeGuildContractsModal() {
  const modal = document.getElementById('guildContractsModal');
  if (modal) modal.hidden = true;
}

function dismissGuildPartner(index) {
  if (!Array.isArray(guildState.partners) || index < 0 || index >= guildState.partners.length) return;
  const removed = guildState.partners.splice(index, 1)[0];
  saveGuildStorage();
  syncGuildWalletUI();
  renderGuildContent();
  openGuildContractsModal();
  showGuildToast(`Parceiro ${removed?.name || removed?.nome || ''} dispensado.`);
}

function dismissGuildMercenary(contractId) {
  if (!Array.isArray(guildState.contracts)) return;
  guildState.contracts = guildState.contracts.filter(c => c.contractId !== contractId);
  saveGuildStorage();
  syncGuildWalletUI();
  renderGuildContent();
  openGuildContractsModal();

  if (window.parent && window.parent !== window) {
    window.parent.postMessage({
      channel: 'forja-taverna-v1',
      type: 'dismiss',
      contractId: contractId
    }, '*');
  }

  showGuildToast('Contrato encerrado.');
}

function clearAllGuildContracts() {
  guildState.partners = [];
  guildState.contracts = [];
  saveGuildStorage();
  syncGuildWalletUI();
  renderGuildContent();
  openGuildContractsModal();

  if (window.parent && window.parent !== window) {
    window.parent.postMessage({
      channel: 'forja-taverna-v1',
      type: 'clear-all'
    }, '*');
  }

  showGuildToast('Todos os aliados foram dispensados.');
}

// Event Delegation da Guilda
document.addEventListener('click', event => {
  const tabBtn = event.target.closest?.('.guild-tab-btn[data-guild-tab]');
  if (tabBtn) {
    event.preventDefault();
    document.querySelectorAll('.guild-tab-btn').forEach(b => b.classList.remove('active'));
    tabBtn.classList.add('active');
    guildState.activeTab = tabBtn.dataset.guildTab;
    guildState.filterTier = 'todos';
    renderGuildChips();
    renderGuildContent();
    return;
  }

  const chip = event.target.closest?.('.filter-chip[data-filter-tier]');
  if (chip) {
    event.preventDefault();
    guildState.filterTier = chip.dataset.filterTier;
    renderGuildChips();
    renderGuildContent();
    return;
  }

  const receiveBtn = event.target.closest?.('[data-action="receive-partner"]');
  if (receiveBtn) {
    event.preventDefault();
    const partnerId = receiveBtn.dataset.partnerId;
    const tier = receiveBtn.dataset.partnerTier;
    if (partnerId === 'ajudante') {
      openGuildHelperModal(tier);
      return;
    }
    handleReceivePartner(partnerId, tier);
    return;
  }

  const closeHelperBtn = event.target.closest?.('[data-action="close-guild-helper"]');
  if (closeHelperBtn) {
    event.preventDefault();
    closeGuildHelperModal();
    return;
  }

  const confirmHelperBtn = event.target.closest?.('#guildHelperConfirmBtn');
  if (confirmHelperBtn) {
    event.preventDefault();
    const tierInp = document.getElementById('guildHelperSelectedTier');
    const tier = tierInp?.value || 'iniciante';
    const selects = document.querySelectorAll('.guild-helper-slot');
    const chosen = Array.from(selects).map(s => s.value);
    if (new Set(chosen).size !== chosen.length) {
      showGuildToast('Por favor, selecione perícias distintas para o Ajudante.');
      return;
    }
    closeGuildHelperModal();
    handleReceivePartner('ajudante', tier, chosen);
    return;
  }

  const partnerTierBtn = event.target.closest?.('[data-action="select-partner-tier"]');
  if (partnerTierBtn) {
    event.preventDefault();
    const pId = partnerTierBtn.dataset.partnerId;
    const tier = partnerTierBtn.dataset.tier;
    const p = CANONICAL_PARTNERS.find(item => item.id === pId);
    if (p) {
      p._selectedTier = tier;
      renderGuildContent();
    }
    return;
  }

  const toggleMercModeBtn = event.target.closest?.('[data-action="toggle-merc-mode"]');
  if (toggleMercModeBtn) {
    event.preventDefault();
    const mercId = toggleMercModeBtn.dataset.mercId;
    const mode = toggleMercModeBtn.dataset.mode;
    guildState.mercenaryChoices[mercId] = guildState.mercenaryChoices[mercId] || {};
    guildState.mercenaryChoices[mercId].durationMode = mode;
    renderGuildContent();
    return;
  }

  const hireMercBtn = event.target.closest?.('[data-action="hire-mercenary"]');
  if (hireMercBtn) {
    event.preventDefault();
    handleHireMercenary(hireMercBtn.dataset.mercId);
    return;
  }

  const contractsBtn = event.target.closest?.('#guildContractsBtn');
  if (contractsBtn) {
    event.preventDefault();
    openGuildContractsModal();
    return;
  }

  const closeContractsBtn = event.target.closest?.('[data-action="close-guild-contracts"]');
  if (closeContractsBtn) {
    event.preventDefault();
    closeGuildContractsModal();
    return;
  }

  const dismissPartnerBtn = event.target.closest?.('[data-action="dismiss-partner"]');
  if (dismissPartnerBtn) {
    event.preventDefault();
    dismissGuildPartner(Number(dismissPartnerBtn.dataset.index));
    return;
  }

  const dismissMercBtn = event.target.closest?.('[data-action="dismiss-mercenary"]');
  if (dismissMercBtn) {
    event.preventDefault();
    dismissGuildMercenary(dismissMercBtn.dataset.contractId);
    return;
  }

  const receiveMountBtn = event.target.closest?.('[data-action="receive-mount"]');
  if (receiveMountBtn) {
    event.preventDefault();
    handleReceiveMount(receiveMountBtn.dataset.mountId);
    return;
  }

  const buyMountBtn = event.target.closest?.('[data-action="buy-mount"]');
  if (buyMountBtn) {
    event.preventDefault();
    handleBuyMount(buyMountBtn.dataset.mountId);
    return;
  }

  const mountTierBtn = event.target.closest?.('[data-action="select-mount-tier"]');
  if (mountTierBtn) {
    event.preventDefault();
    const mId = mountTierBtn.dataset.mountId;
    const tier = mountTierBtn.dataset.tier;
    guildState.mountChoices[mId] = guildState.mountChoices[mId] || {};
    guildState.mountChoices[mId].tier = tier;
    renderGuildContent();
    return;
  }

  const clearAllBtn = event.target.closest?.('#guildClearAllBtn');
  if (clearAllBtn) {
    event.preventDefault();
    clearAllGuildContracts();
    return;
  }
});

document.addEventListener('change', event => {
  const mountSizeSel = event.target.closest?.('[data-action="select-mount-size"]');
  if (mountSizeSel) {
    const mId = mountSizeSel.dataset.mountId;
    guildState.mountChoices[mId] = guildState.mountChoices[mId] || {};
    guildState.mountChoices[mId].size = mountSizeSel.value;
    renderGuildContent();
    return;
  }

  const sel = event.target.closest?.('[data-action="merc-custom-choice"]');
  if (sel) {
    const mercId = sel.dataset.mercId;
    guildState.mercenaryChoices[mercId] = guildState.mercenaryChoices[mercId] || {};
    guildState.mercenaryChoices[mercId].choice = sel.value;
  }
});

document.addEventListener('input', event => {
  const searchInp = event.target.closest?.('#guildSearchInput');
  if (searchInp) {
    guildState.search = searchInp.value;
    renderGuildContent();
  }
});
