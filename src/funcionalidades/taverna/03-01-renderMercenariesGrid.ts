

function getActivePartnerCounts() {
  const contracts = Array.isArray(tavernState.contracts) ? tavernState.contracts : [];
  const partners = Array.isArray(tavernState.partners) ? tavernState.partners : [];
  let normalCount = 0;
  let veteranCount = 0;
  let masterCount = 0;

  for (const c of contracts) {
    if (c.category === 'mercenario' || c.category === 'parceiro' || c.partnerCategory === 'parceiros' || String(c.itemId || '').startsWith('parceiro_')) {
      if (c.countsTowardsLimit === false || c.ignoraLimite) continue;
      normalCount++;
      const isVet = c.tier === 'veterano' || /veterano/i.test(c.itemName || '') || /veterano/i.test(c.description || '');
      const isMestre = c.tier === 'mestre' || /mestre/i.test(c.itemName || '');
      if (isMestre) masterCount++;
      else if (isVet) veteranCount++;
    }
  }

  for (const p of partners) {
    if (p.countsTowardsLimit === false || p.ignoraLimite || p.special) continue;
    normalCount++;
    if (p.grau === 'mestre' || p.tier === 'mestre') masterCount++;
    else if (p.grau === 'veterano' || p.tier === 'veterano') veteranCount++;
  }

  const level = Number(tavernState.level) || 1;
  const limit = tavernState.partnerLimit || (level >= 17 ? { maxPartners: 3, maxVeterans: 2, maxMasters: 1 } : (level >= 5 ? { maxPartners: 2, maxVeterans: 1, maxMasters: 0 } : { maxPartners: 1, maxVeterans: 0, maxMasters: 0 }));

  return { normalCount, veteranCount, masterCount, limit };
}

function renderMercenariesGrid() {
  const container = document.getElementById('mercenariesCardsGrid');
  if (!container) return;

  const hasWar = hasWarTraining();
  const counts = getActivePartnerCounts();

  container.innerHTML = CANONICAL_MERCENARIES.map(m => {
    const st = tavernState.mercenaryChoices[m.id] || {
      durationMode: 'cena',
      choice: m.customChoice?.options[0] || null
    };
    tavernState.mercenaryChoices[m.id] = st;

    const isVeterano = m.tier === 'veterano';
    const isAdventure = st.durationMode === 'aventura';
    const unitPrice = isAdventure ? (isVeterano ? 450 : 90) : (isVeterano ? 150 : 30);
    const canAfford = tavernState.funds >= unitPrice;
    const reqWarFailed = Boolean(m.requiresWar && !hasWar);

    const limitReached = counts.normalCount >= counts.limit.maxPartners;
    const tierNotAllowed = isVeterano && counts.limit.maxVeterans <= 0;
    const vetLimitReached = isVeterano && counts.veteranCount >= counts.limit.maxVeterans;
    const partnerBlocked = limitReached || tierNotAllowed || vetLimitReached;
    const canHire = canAfford && !reqWarFailed && !partnerBlocked;

    let hireBtnText = 'Contratar';
    if (reqWarFailed) hireBtnText = 'Requer Guerra';
    else if (tierNotAllowed) hireBtnText = 'Exige Nv 5+';
    else if (vetLimitReached) hireBtnText = 'Teto Veterano';
    else if (limitReached) hireBtnText = 'Limite Atingido';
    else if (!canAfford) hireBtnText = 'Saldo Baixo';

    const warBadge = m.requiresWar
      ? (hasWar
          ? '<span class="mercenary-war-badge ok" title="Você atende ao requisito: treinado em Guerra">Treinado em Guerra</span>'
          : '<span class="mercenary-war-badge req" title="Exige treino na perícia Guerra">Requer treino em Guerra</span>')
      : '';

    let customChoiceHtml = '';
    if (m.customChoice) {
      if (m.id === 'alquimista_de_batalha') {
        customChoiceHtml = '<div class="mercenary-choice-row">' +
          '<span class="choice-label">' + escapeHtml(m.customChoice.label) + '</span>' +
          '<div class="choice-pills-row">' +
          m.customChoice.options.map(opt => {
            const act = opt === st.choice ? ' active' : '';
            return '<button type="button" class="merc-choice-pill' + act + '" data-merc-id="' + m.id + '" data-choice-val="' + escapeHtml(opt) + '">' +
              escapeHtml(opt) + '</button>';
          }).join('') +
          '</div></div>';
      } else if (m.id === 'aprendiz_de_guilda') {
        customChoiceHtml = '<div class="mercenary-choice-row">' +
          '<label class="choice-label" for="oficio-sel-' + m.id + '">' + escapeHtml(m.customChoice.label) + '</label>' +
          '<select class="merc-oficio-select" id="oficio-sel-' + m.id + '" data-merc-id="' + m.id + '">' +
          m.customChoice.options.map(opt => {
            const sel = opt === st.choice ? ' selected' : '';
            return '<option value="' + escapeHtml(opt) + '"' + sel + '>' + escapeHtml(opt) + '</option>';
          }).join('') +
          '</select></div>';
      }
    }

    return '<article class="mercenary-card-4col' + (reqWarFailed ? ' war-disabled' : '') + '" data-merc-id="' + m.id + '">' +
      '<div class="merc-card-top">' +
        '<div class="merc-header-row">' +
          '<span class="merc-icon">' + (window.IconesForja ? window.IconesForja.get(m.tier === 'veterano' ? 'shield' : 'sword', 'icon-md') : '') + '</span>' +
          '<div class="merc-title-block">' +
            '<h3 class="merc-name">' + escapeHtml(m.name) + '</h3>' +
            '<span class="merc-tier-tag ' + m.tier + '">' + (isVeterano ? 'Veterano' : 'Iniciante') + '</span>' +
          '</div>' +
        '</div>' +
        (warBadge ? '<div class="merc-badges-row">' + warBadge + '</div>' : '') +
      '</div>' +
      '<div class="merc-card-body">' +
        '<p class="merc-desc">' + escapeHtml(m.desc) + '</p>' +
        '<div class="merc-benefit-box"><strong>Benefício:</strong> ' + escapeHtml(m.benefit) + '</div>' +
        customChoiceHtml +
      '</div>' +
      '<div class="merc-card-footer">' +
        '<div class="merc-duration-toggle">' +
          '<button type="button" class="duration-tab' + (!isAdventure ? ' active' : '') + '" data-merc-id="' + m.id + '" data-mode="cena">' +
            'Por Cena' +
          '</button>' +
          '<button type="button" class="duration-tab' + (isAdventure ? ' active' : '') + '" data-merc-id="' + m.id + '" data-mode="aventura">' +
            'Por Aventura' +
          '</button>' +
        '</div>' +
        '<div class="merc-hire-action-row">' +
          '<div class="merc-price-display">' +
            '<span class="price-val">' + formatPrice(unitPrice) + '</span>' +
            '<span class="price-per">' + (isAdventure ? 'por aventura' : 'por cena') + '</span>' +
          '</div>' +
          '<button type="button" class="btn btn-primary btn-hire-merc" data-merc-id="' + m.id + '"' + (!canHire ? ' disabled' : '') + '>' +
            hireBtnText +
          '</button>' +
        '</div>' +
      '</div>' +
    '</article>';
  }).join('');
}

function hireMercenaryDirectly(mercId) {
  const merc = CANONICAL_MERCENARIES.find(m => m.id === mercId);
  if (!merc) return;

  if (merc.requiresWar && !hasWarTraining()) {
    showToast('Você precisa de treino na perícia Guerra para contratar ' + merc.name + '.');
    return;
  }

  const counts = getActivePartnerCounts();
  if (counts.normalCount >= counts.limit.maxPartners) {
    showToast(`Limite de parceiros atingido (${counts.normalCount}/${counts.limit.maxPartners}) para o nível ${tavernState.level || 1}.`);
    return;
  }
  if (merc.tier === 'veterano' && counts.limit.maxVeterans <= 0) {
    showToast('Parceiros Veteranos exigem Nível 5 ou superior.');
    return;
  }
  if (merc.tier === 'veterano' && counts.veteranCount >= counts.limit.maxVeterans) {
    showToast(`Você já possui o limite de parceiros Veteranos (${counts.limit.maxVeterans}) para o seu patamar.`);
    return;
  }

  const choiceState = tavernState.mercenaryChoices[mercId] || {
    durationMode: 'cena',
    choice: merc.customChoice?.options[0] || null
  };

  const isVeterano = merc.tier === 'veterano';
  const parentItemId = isVeterano ? 'mercenario_veterano' : 'mercenario_iniciante';
  tavernState.selectedPartnerId = mercId;
  tavernState.durationMode = choiceState.durationMode || 'cena';
  tavernState.customChoiceVal = choiceState.choice || null;
  tavernState.hirePercent = 100;
  openHireModal(parentItemId);
}

function getPartnerListForItem(item) {
  if (!item) return [];
  if (item.id === 'mercenario_iniciante') {
    return CANONICAL_MERCENARIES.filter(m => m.tier === 'iniciante');
  }
  if (item.id === 'mercenario_veterano') {
    return CANONICAL_MERCENARIES.filter(m => m.tier === 'veterano');
  }
  if (item.id === 'capangas_iniciantes') {
    return CANONICAL_CAPANGAS.map(c => ({
      id: c.id,
      name: c.name,
      tier: 'iniciante',
      role: 'Capanga Iniciante',
      partnerType: 'Capangas',
      icon: c.icon,
      desc: c.desc,
      benefit: c.iniciante,
      requiresWar: c.requiresWar
    }));
  }
  if (item.id === 'capangas_veteranos') {
    return CANONICAL_CAPANGAS.map(c => ({
      id: c.id,
      name: c.name,
      tier: 'veterano',
      role: 'Capanga Veterano',
      partnerType: 'Capangas',
      icon: c.icon,
      desc: c.desc,
      benefit: c.veterano,
      requiresWar: c.requiresWar
    }));
  }
  if (item.id.startsWith('capangas_')) return PARTNER_TYPES.capangas;
  if (item.id.startsWith('mercenario_')) return PARTNER_TYPES.mercenario;
  return [];
}

function renderPartnerCards(list, selectedId) {
  const hasWar = hasWarTraining();
  return list.map(p => {
    const isSel = p.id === selectedId;
    const warBadge = p.requiresWar
      ? (hasWar
          ? '<span class="partner-war-badge ok" title="Você possui treino na perícia Guerra">Treinado em Guerra</span>'
          : '<span class="partner-war-badge req" title="Exige treino na perícia Guerra">Requer treino em Guerra</span>')
      : '';

    let choiceHtml = '';
    if (isSel && p.customChoice) {
      const opts = p.customChoice.options || [];
      const currentVal = tavernState.customChoiceVal || opts[0];
      choiceHtml = '<div class="partner-custom-choice-wrap">' +
        '<span class="partner-choice-label">' + escapeHtml(p.customChoice.label) + '</span>' +
        '<div class="partner-choice-pills">' +
        opts.map(opt => {
          const act = opt === currentVal ? ' active' : '';
          return '<button type="button" class="choice-pill-btn' + act + '" data-choice-val="' + escapeHtml(opt) + '">' +
            escapeHtml(opt) + '</button>';
        }).join('') +
        '</div>' +
      '</div>';
    }

    return '<div class="partner-card-select' + (isSel ? ' selected' : '') + (p.requiresWar && !hasWar ? ' partner-req-missing' : '') + '" data-partner-id="' + p.id + '">' +
      '<div class="partner-card-head">' +
        '<span class="partner-card-name"><span class="partner-card-icon">' + p.icon + '</span> ' + escapeHtml(p.name) + '</span>' +
        '<div class="partner-card-badges">' +
          warBadge +
          '<span class="partner-card-role-badge">' + escapeHtml(p.role || p.name) + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="partner-card-desc">' + escapeHtml(p.desc) + '</div>' +
      '<div class="partner-card-benefit"><strong>Benefício:</strong> ' + escapeHtml(p.benefit) + '</div>' +
      choiceHtml +
      '<div class="partner-card-footer-status">' +
        (isSel ? '<span class="partner-card-check">Selecionado</span>' : '<span class="partner-card-action">Clique para selecionar</span>') +
      '</div>' +
    '</div>';
  }).join('');
}

// Hire modal logic
function openHireModal(itemId) {
  const item = tavernItems.find(i => i.id === itemId);
  if (!item) return;
  tavernState.activeItem = item;
  tavernState.hireQty = 1;
  tavernState.hirePercent = 100;
  tavernState.durationMode = 'cena';

  const modal = document.getElementById('hireModal');
  const panel = modal ? modal.querySelector('.modal-panel') : null;
  const title = document.getElementById('hireModalTitle');
  const confirmBtn = document.getElementById('confirmHireBtn');

  const durationField = document.getElementById('hireDurationModeField');
  const subcatalogSection = document.getElementById('partnerSubcatalogSection');
  const partnerGrid = document.getElementById('partnerCardsGrid');
  const partnerSelect = document.getElementById('partnerTypeSelect');
  const subcatalogTitle = document.getElementById('partnerSubcatalogTitle');
  const subcatalogCount = document.getElementById('partnerSubcatalogCount');

  const isPartner = item.id.startsWith('mercenario_') || item.id.startsWith('capangas_');
  if (panel) {
    panel.classList.toggle('hire-subcatalog', isPartner);
  }

  if (isPartner) {
    const list = getPartnerListForItem(item);
    if (!list.some(p => p.id === tavernState.selectedPartnerId)) {
      tavernState.selectedPartnerId = list[0]?.id || '';
    }
    const currentSel = list.find(p => p.id === tavernState.selectedPartnerId) || list[0];
    if (currentSel?.customChoice) {
      if (!currentSel.customChoice.options.includes(tavernState.customChoiceVal)) {
        tavernState.customChoiceVal = currentSel.customChoice.options[0];
      }
    } else {
      tavernState.customChoiceVal = null;
    }

    if (durationField) durationField.style.display = 'flex';
    const durationBtns = document.querySelectorAll('#hireDurationPills .hire-mode-btn');
    durationBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.durationMode === tavernState.durationMode);
    });

    if (subcatalogSection) subcatalogSection.style.display = 'flex';
    if (subcatalogTitle) {
      const isCapanga = item.id.startsWith('capangas_');
      subcatalogTitle.textContent = isCapanga ? 'Escolha o Destacamento de Capangas:' : 'Escolha o Mercenário Especialista:';
    }
    if (subcatalogCount) {
      subcatalogCount.textContent = list.length + ' opções';
    }

    if (partnerSelect) {
      partnerSelect.innerHTML = list.map(p => '<option value="' + p.id + '">' + p.name + '</option>').join('');
      partnerSelect.value = tavernState.selectedPartnerId;
    }

    if (partnerGrid) {
      partnerGrid.innerHTML = renderPartnerCards(list, tavernState.selectedPartnerId);
    }
  } else {
    if (durationField) durationField.style.display = 'none';
    if (subcatalogSection) subcatalogSection.style.display = 'none';
  }

  const isContract = ['mercenario', 'estadia', 'transporte', 'cuidados'].includes(item.tavernCategory);
  if (title) title.textContent = (isContract ? 'Contratar ' : 'Comprar ') + item.nome;
  if (confirmBtn) confirmBtn.textContent = isContract ? 'Confirmar Contratação' : 'Confirmar Compra';

  updateHireCalculation();
  if (modal) modal.hidden = false;
}

function updateHireCalculation() {
  const item = tavernState.activeItem;
  if (!item) return;
  const qty = tavernState.hireQty;
  const isPartner = item.id.startsWith('mercenario_') || item.id.startsWith('capangas_');
  const isAdventure = isPartner && tavernState.durationMode === 'aventura';
  const multiplier = isAdventure ? 3 : 1;
  const basePrice = Number(item.preco?.valor) || 0;
  const unitPrice = basePrice * multiplier;
  const baseTotal = qty * unitPrice;
  const percent = Number(tavernState.hirePercent ?? 100);
  const total = Math.max(0, Math.ceil(baseTotal * (percent / 100)));

  const percentEl = document.getElementById('hirePercentDisplay');
  if (percentEl) percentEl.textContent = percent + '%';

  const summary = document.getElementById('hireItemSummary');
  const unitLabel = document.getElementById('hireUnitLabel');
  const qtyEl = document.getElementById('hireQtyDisplay');
  const priceEl = document.getElementById('hireTotalPrice');
  const balanceEl = document.getElementById('hireBalanceNote');
  const confirmBtn = document.getElementById('confirmHireBtn');

  let reqWarFailed = false;

  if (unitLabel) {
    if (isPartner) {
      unitLabel.textContent = isAdventure ? 'Aventura(s):' : 'Cena(s):';
    } else {
      unitLabel.textContent = item.unitLabel + ':';
    }
  }

  if (summary) {
    let summaryHtml = '<p class="hire-summary-desc">' +
      escapeHtml(item.textos?.descricao || item.textos?.habilidade || '') + '</p>';
    if (isPartner) {
      const list = getPartnerListForItem(item);
      const sel = list.find(p => p.id === tavernState.selectedPartnerId) || list[0];
      reqWarFailed = Boolean(sel?.requiresWar && !hasWarTraining());

      const modeDesc = isAdventure
        ? 'Aventura Inteira (3x valor base · acompanha toda a jornada)'
        : 'Por Cena (1x valor base · atua na cena)';
      const choiceTag = tavernState.customChoiceVal
        ? ' <span class="hire-summary-choice-tag">[' + escapeHtml(tavernState.customChoiceVal) + ']</span>'
        : '';
      const warWarning = reqWarFailed
        ? '<div class="hire-war-warning">Requer treino na perícia Guerra (indisponível para este personagem).</div>'
        : '';

      summaryHtml += '<div class="hire-summary-partner-box">' +
        '<div class="hire-summary-partner-head">' +
          '<strong class="hire-summary-partner-name">' + escapeHtml(sel?.name || '') + choiceTag + '</strong>' +
          '<span class="hire-summary-partner-role">' + escapeHtml(sel?.role || '') + '</span>' +
        '</div>' +
        '<div class="hire-summary-partner-desc">' + escapeHtml(sel?.desc || '') + '</div>' +
        '<div class="hire-summary-partner-benefit"><strong>Benefício:</strong> ' + escapeHtml(sel?.benefit || '') + '</div>' +
        '<div class="hire-summary-partner-duration">Duração: ' + escapeHtml(modeDesc) + '</div>' +
        warWarning +
        '</div>' +
        '<p class="hire-summary-unit-price">Preço unitário: <strong>' + formatPrice(unitPrice) + ' ' + (isAdventure ? 'por aventura' : 'por cena') + '</strong></p>';
    } else {
      summaryHtml += '<p class="hire-summary-unit-price">Preço unitário: <strong>' + formatPrice(unitPrice) + ' ' + item.unitPeriod + '</strong></p>';
    }
    summary.innerHTML = summaryHtml;
  }

  if (qtyEl) qtyEl.textContent = String(qty);
  if (priceEl) priceEl.textContent = formatPrice(total);

  const canAfford = tavernState.funds >= total;
  const canConfirm = canAfford && !reqWarFailed;

  if (balanceEl) {
    if (reqWarFailed) {
      balanceEl.innerHTML = '<span style="color:var(--red);font-weight:600">Requisito não atendido: Requer treinamento na perícia Guerra.</span>';
    } else if (canAfford) {
      balanceEl.textContent = 'Saldo restante após a contratação: ' + formatPrice(tavernState.funds - total);
      balanceEl.style.color = 'var(--text-muted)';
    } else {
      balanceEl.textContent = 'Saldo insuficiente! Você possui ' + formatPrice(tavernState.funds) + ' e faltam ' + formatPrice(total - tavernState.funds);
      balanceEl.style.color = 'var(--red)';
    }
  }

  if (confirmBtn) {
    confirmBtn.disabled = !canConfirm;
    confirmBtn.style.opacity = canConfirm ? '1' : '0.4';
    confirmBtn.style.cursor = canConfirm ? 'pointer' : 'not-allowed';
    if (reqWarFailed) {
      confirmBtn.title = 'Requer treino em Guerra';
    } else if (!canAfford) {
      confirmBtn.title = 'Saldo insuficiente';
    } else {
      confirmBtn.title = '';
    }
  }
}

function confirmHire() {
  const item = tavernState.activeItem;
  if (!item) return;
  const qty = tavernState.hireQty;
  const isPartner = item.id.startsWith('mercenario_') || item.id.startsWith('capangas_');
  const isAdventure = isPartner && tavernState.durationMode === 'aventura';
  const multiplier = isAdventure ? 3 : 1;
  const basePrice = Number(item.preco?.valor) || 0;
  const unitPrice = basePrice * multiplier;
  const baseTotal = qty * unitPrice;
  const percent = Number(tavernState.hirePercent ?? 100);
  const total = Math.max(0, Math.ceil(baseTotal * (percent / 100)));

  if (tavernState.funds < total) {
    showToast('Saldo insuficiente para esta contratação.');
    return;
  }

  let partnerType = '';
  let partnerDescText = '';
  if (isPartner) {
    const list = getPartnerListForItem(item);
    const found = list.find(p => p.id === tavernState.selectedPartnerId) || list[0];
    if (found) {
      if (found.requiresWar && !hasWarTraining()) {
        showToast('Você precisa de treino na perícia Guerra para contratar este grupo.');
        return;
      }
      partnerType = found.name;
      const choiceTag = tavernState.customChoiceVal ? ' (' + tavernState.customChoiceVal + ')' : '';
      partnerType += choiceTag;
      partnerDescText = found.name + choiceTag + ' · ' + found.role + ': ' + found.benefit + ' — ' + found.desc;
    }
  }

  tavernState.funds = Math.max(0, tavernState.funds - total);

  const durationSuffix = isPartner ? (isAdventure ? ' (Aventura Inteira)' : ' (Por Cena)') : '';
  const finalItemName = partnerType ? (item.nome + ' · ' + partnerType + durationSuffix) : item.nome;
  const finalDescription = partnerDescText
    ? (partnerDescText + durationSuffix)
    : (item.textos?.habilidade || item.textos?.descricao || '');

  const finalUnitLabel = isPartner ? (isAdventure ? 'Aventura(s)' : 'Cena(s)') : item.unitLabel;

  const isCapanga = (item.id && item.id.includes('capangas')) || (found && (found.partnerType === 'Capangas' || found.role?.includes('Capanga')));
  const statsText = found?.stats || (isCapanga ? (found?.benefit || (isVeterano ? found?.veterano : found?.iniciante)) : undefined);
  const benefitText = found?.benefit || (isPartner ? (isVeterano ? (found?.veterano || item.textos?.habilidade) : (found?.iniciante || item.textos?.habilidade)) : (item.textos?.habilidade || item.textos?.descricao));

  const contract = {
    contractId: 'ct-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
    itemId: item.id,
    itemName: finalItemName,
    partnerType: partnerType || undefined,
    durationMode: isPartner ? (isAdventure ? 'aventura' : 'cena') : undefined,
    category: item.tavernCategory,
    quantity: qty,
    unitLabel: finalUnitLabel,
    unitPrice,
    totalPrice: total,
    date: new Date().toLocaleDateString('pt-BR'),
    description: finalDescription,
    benefit: benefitText,
    stats: statsText,
    isCapanga: Boolean(isCapanga)
  };
  tavernState.contracts.push(contract);

  // Se for poção adquirida via curandeiro/serviços, insere diretamente na mochila do herói
  if (item.id && item.id.startsWith('pocao_')) {
    try {
      const rawHero = localStorage.getItem('forja-heroi-t20-v1');
      if (rawHero) {
        const hero = JSON.parse(rawHero);
        if (!Array.isArray(hero.backpack)) hero.backpack = [];
        hero.backpack.push({
          instanceId: 'pocao_taverna_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          itemId: item.id,
          displayName: item.nome,
          tipo: 'pocao',
          quantity: qty,
          categoriaId: 'alquimico_preparado'
        });
        localStorage.setItem('forja-heroi-t20-v1', JSON.stringify(hero));
      }
    } catch (e) {}
  }

  saveStorage();
  syncWalletUI();

  if (window.parent && window.parent !== window) {
    window.parent.postMessage({
      channel: 'forja-taverna-v1',
      type: 'hire',
      contract,
      funds: tavernState.funds
    }, '*');
  }

  const modal = document.getElementById('hireModal');
  if (modal) modal.hidden = true;

  const isContract = ['mercenario', 'estadia', 'transporte', 'cuidados'].includes(item.tavernCategory);
  showToast((isContract ? 'Contratação de ' : 'Compra de ') + finalItemName + ' realizada!');
}

// Contracts modal logic
function openContractsModal() {
  const modal = document.getElementById('contractsModal');
  const list = document.getElementById('contractList');
  if (!list) return;

  if (!tavernState.contracts.length) {
    list.innerHTML = '<p class="contract-empty-msg">Nenhum serviço ou contrato ativo no momento.</p>';
  } else {
    list.innerHTML = tavernState.contracts.map(c => {
      const cat = TAVERN_CATEGORIES[c.category] || TAVERN_CATEGORIES.especial;
      const partnerBadge = c.partnerType ? ' <span class="contract-partner-badge">' + escapeHtml(c.partnerType) + '</span>' : '';
      return '<div class="contract-item" data-contract-id="' + c.contractId + '">' +
        '<div class="contract-info">' +
          '<strong>' + cat.icon + ' ' + escapeHtml(c.itemName) + partnerBadge + '</strong>' +
          '<small>' + c.quantity + ' ' + escapeHtml(c.unitLabel) + ' · ' + formatPrice(c.totalPrice) + (c.partnerType ? ' · Tipo: ' + escapeHtml(c.partnerType) : '') + ' · ' + escapeHtml(c.date) + '</small>' +
          (c.description ? '<div class="contract-desc-note">' + escapeHtml(c.description) + '</div>' : '') +
        '</div>' +
        '<div class="contract-actions">' +
          '<button class="btn btn-danger btn-sm" type="button" data-action="dismiss-contract" data-contract-id="' + c.contractId + '">' +
            (c.category === 'mercenario' ? 'Dispensar' : 'Remover') +
          '</button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  if (modal) modal.hidden = false;
}

function dismissContract(contractId) {
  const index = tavernState.contracts.findIndex(c => c.contractId === contractId);
  if (index === -1) return;
  const removed = tavernState.contracts.splice(index, 1)[0];
  saveStorage();
  syncWalletUI();
  openContractsModal();

  if (window.parent && window.parent !== window) {
    window.parent.postMessage({
      channel: 'forja-taverna-v1',
      type: 'dismiss',
      contractId
    }, '*');
  }

  showToast(removed.itemName + ' removido dos serviços ativos.');
  if (typeof renderCards === 'function') renderCards();
  if (typeof renderMercenariesGrid === 'function') renderMercenariesGrid();
}

function clearAllContracts() {
  if (!tavernState.contracts.length) return;
  tavernState.contracts = [];
  saveStorage();
  syncWalletUI();
  openContractsModal();

  if (window.parent && window.parent !== window) {
    window.parent.postMessage({
      channel: 'forja-taverna-v1',
      type: 'clear-all'
    }, '*');
  }

  showToast('Todos os contratos foram encerrados.');
  if (typeof renderCards === 'function') renderCards();
  if (typeof renderMercenariesGrid === 'function') renderMercenariesGrid();
}

function receivePartnerDirectly(itemId) {
  const item = tavernItems.find(i => i.id === itemId);
  if (!item) return;

  const counts = getActivePartnerCounts();
  if (counts.normalCount >= counts.limit.maxPartners) {
    showToast(`Limite de parceiros atingido (${counts.normalCount}/${counts.limit.maxPartners}) para o nível ${tavernState.level || 1}.`);
    return;
  }

  if (tavernState.contracts.some(c => c.itemId === itemId)) {
    showToast(`Você já possui o ${item.nome}.`);
    return;
  }

  const contract = {
    contractId: 'ct-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
    itemId: item.id,
    itemName: item.nome + ' (Campanha)',
    partnerType: item.nome,
    durationMode: 'campanha',
    category: 'mercenario',
    partnerCategory: 'parceiros',
    quantity: 1,
    unitLabel: 'Campanha',
    unitPrice: 0,
    totalPrice: 0,
    date: new Date().toLocaleDateString('pt-BR'),
    description: item.textos?.descricao || '',
    benefit: item.textos?.habilidade || '',
    isPermanent: true
  };

  tavernState.contracts.push(contract);
  saveStorage();
  syncWalletUI();

  if (window.parent && window.parent !== window) {
    window.parent.postMessage({
      channel: 'forja-taverna-v1',
      type: 'hire',
      contract,
      funds: tavernState.funds
    }, '*');
  }

  showToast('Parceiro ' + item.nome + ' recebido com sucesso!');
  if (typeof renderCards === 'function') renderCards();
  if (typeof renderMercenariesGrid === 'function') renderMercenariesGrid();
}