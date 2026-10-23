

// Event Listeners
document.addEventListener('click', event => {
  const chip = event.target.closest?.('.chip[data-category]');
  if (chip) {
    event.preventDefault();
    tavernState.category = chip.dataset.category;
    renderChips();
    renderCards();
    return;
  }

  const tavernPotionBtn = event.target.closest?.('#btnTavernChoosePotionSpell');
  if (tavernPotionBtn) {
    event.preventDefault();
    const select = /** @type {HTMLSelectElement|null} */ (document.getElementById('tavernPotionCircleSelect'));
    const circle = Number(select?.value || 1);
    const prices = { 1: 30, 2: 270, 3: 1080, 4: 3000, 5: 6750 };
    const price = prices[circle] || 30;

    if (window.parent !== window) {
      window.parent.postMessage({
        channel: 'forja-taverna-v1',
        type: 'choose-potion-spell',
        circle: circle,
        price: price,
        source: 'tavern'
      }, '*');
    } else {
      window.location.href = 'ficha.html?comprarPocao=' + circle;
    }
    return;
  }

  const tavernTattooBtn = event.target.closest?.('#btnTavernChooseTattooSpell');
  if (tavernTattooBtn) {
    event.preventDefault();
    const count = Number(tavernState.tattoosCount || 0);
    const price = (count + 1) * 1000;

    if (window.parent !== window) {
      window.parent.postMessage({
        channel: 'forja-taverna-v1',
        type: 'choose-tavern-tattoo-spell',
        price: price,
        source: 'tavern'
      }, '*');
    } else {
      window.location.href = 'ficha.html?tatuagemTaverna=1';
    }
    return;
  }

  const openHire = event.target.closest?.('[data-action="open-hire"]');
  if (openHire) {
    event.preventDefault();
    openHireModal(openHire.dataset.itemId);
    return;
  }

  const receivePartnerBtn = event.target.closest?.('[data-action="receive-partner"]');
  if (receivePartnerBtn) {
    event.preventDefault();
    receivePartnerDirectly(receivePartnerBtn.dataset.itemId);
    return;
  }

  if (event.target.closest?.('[data-action="close-hire-modal"]')) {
    event.preventDefault();
    const modal = document.getElementById('hireModal');
    if (modal) modal.hidden = true;
    return;
  }

  if (event.target.closest?.('[data-action="hire-qty-inc"]')) {
    event.preventDefault();
    tavernState.hireQty = Math.min(100, tavernState.hireQty + 1);
    updateHireCalculation();
    return;
  }

  if (event.target.closest?.('[data-action="hire-qty-dec"]')) {
    event.preventDefault();
    tavernState.hireQty = Math.max(1, tavernState.hireQty - 1);
    updateHireCalculation();
    return;
  }

  if (event.target.closest?.('[data-action="hire-percent-dec"]')) {
    event.preventDefault();
    const minPercent = heroiTemPoderComerciante() ? 70 : 80;
    const curr = Number(tavernState.hirePercent ?? (heroiTemPoderComerciante() ? 90 : 100));
    if (curr > minPercent) {
      tavernState.hirePercent = Math.max(minPercent, curr - 10);
      updateHireCalculation();
    }
    return;
  }

  if (event.target.closest?.('[data-action="hire-percent-inc"]')) {
    event.preventDefault();
    const curr = Number(tavernState.hirePercent ?? (heroiTemPoderComerciante() ? 90 : 100));
    if (curr < 100) {
      tavernState.hirePercent = Math.min(100, curr + 10);
      updateHireCalculation();
    }
    return;
  }

  if (event.target.closest?.('[data-action="hire-percent-reset"]')) {
    event.preventDefault();
    tavernState.hirePercent = heroiTemPoderComerciante() ? 90 : 100;
    updateHireCalculation();
    return;
  }

  const modeBtn = event.target.closest?.('.hire-mode-btn[data-duration-mode]');
  if (modeBtn) {
    event.preventDefault();
    document.querySelectorAll('#hireDurationPills .hire-mode-btn').forEach(b => b.classList.remove('active'));
    modeBtn.classList.add('active');
    tavernState.durationMode = modeBtn.dataset.durationMode;
    updateHireCalculation();
    return;
  }

  const partnerCard = event.target.closest?.('.partner-card-select[data-partner-id]');
  if (partnerCard) {
    event.preventDefault();
    tavernState.selectedPartnerId = partnerCard.dataset.partnerId;
    const item = tavernState.activeItem;
    if (item) {
      const list = getPartnerListForItem(item);
      const sel = list.find(p => p.id === tavernState.selectedPartnerId);
      if (sel?.customChoice) {
        if (!sel.customChoice.options.includes(tavernState.customChoiceVal)) {
          tavernState.customChoiceVal = sel.customChoice.options[0];
        }
      } else {
        tavernState.customChoiceVal = null;
      }
      const select = document.getElementById('partnerTypeSelect');
      if (select) select.value = tavernState.selectedPartnerId;
      const partnerGrid = document.getElementById('partnerCardsGrid');
      if (partnerGrid) {
        partnerGrid.innerHTML = renderPartnerCards(list, tavernState.selectedPartnerId);
      }
    }
    updateHireCalculation();
    return;
  }

  const choicePill = event.target.closest?.('.choice-pill-btn[data-choice-val]');
  if (choicePill) {
    event.preventDefault();
    event.stopPropagation();
    tavernState.customChoiceVal = choicePill.dataset.choiceVal;
    const item = tavernState.activeItem;
    if (item) {
      const list = getPartnerListForItem(item);
      const partnerGrid = document.getElementById('partnerCardsGrid');
      if (partnerGrid) {
        partnerGrid.innerHTML = renderPartnerCards(list, tavernState.selectedPartnerId);
      }
    }
    updateHireCalculation();
    return;
  }

  const mercNavBtn = event.target.closest?.('#mercenariesNavBtn');
  if (mercNavBtn) {
    event.preventDefault();
    switchView('mercenaries');
    return;
  }

  const tavernNavBtn = event.target.closest?.('#tavernNavBtn, #mercenariesBackBtn');
  if (tavernNavBtn) {
    event.preventDefault();
    switchView('tavern');
    return;
  }

  const mercShortcut = event.target.closest?.('[data-view-action="mercenaries"]');
  if (mercShortcut) {
    event.preventDefault();
    switchView('mercenaries');
    return;
  }

  const hireMercBtn = event.target.closest?.('.btn-hire-merc[data-merc-id]');
  if (hireMercBtn) {
    event.preventDefault();
    hireMercenaryDirectly(hireMercBtn.dataset.mercId);
    return;
  }

  const durationTab = event.target.closest?.('.duration-tab[data-merc-id]');
  if (durationTab) {
    event.preventDefault();
    const mId = durationTab.dataset.mercId;
    const mode = durationTab.dataset.mode;
    tavernState.mercenaryChoices[mId] = tavernState.mercenaryChoices[mId] || {};
    tavernState.mercenaryChoices[mId].durationMode = mode;
    renderMercenariesGrid();
    return;
  }

  const mercChoicePill = event.target.closest?.('.merc-choice-pill[data-merc-id]');
  if (mercChoicePill) {
    event.preventDefault();
    const mId = mercChoicePill.dataset.mercId;
    const val = mercChoicePill.dataset.choiceVal;
    tavernState.mercenaryChoices[mId] = tavernState.mercenaryChoices[mId] || {};
    tavernState.mercenaryChoices[mId].choice = val;
    renderMercenariesGrid();
    return;
  }

  if (event.target.closest?.('#confirmHireBtn')) {
    event.preventDefault();
    confirmHire();
    return;
  }

  if (event.target.closest?.('#contractsBtn')) {
    event.preventDefault();
    openContractsModal();
    return;
  }

  if (event.target.closest?.('[data-action="close-contracts-modal"]')) {
    event.preventDefault();
    const modal = document.getElementById('contractsModal');
    if (modal) modal.hidden = true;
    return;
  }

  const dismissBtn = event.target.closest?.('[data-action="dismiss-contract"]');
  if (dismissBtn) {
    event.preventDefault();
    dismissContract(dismissBtn.dataset.contractId);
    return;
  }

  if (event.target.closest?.('#clearContractsBtn')) {
    event.preventDefault();
    clearAllContracts();
    return;
  }
});

document.addEventListener('input', event => {
  if (event.target.id === 'searchInput') {
    tavernState.search = event.target.value;
    renderCards();
  }
});

document.addEventListener('change', event => {
  if (event.target.classList.contains('merc-oficio-select')) {
    const mId = event.target.dataset.mercId;
    tavernState.mercenaryChoices[mId] = tavernState.mercenaryChoices[mId] || {};
    tavernState.mercenaryChoices[mId].choice = event.target.value;
    return;
  }
  if (event.target.id === 'sortSelect') {
    tavernState.sort = event.target.value;
    renderCards();
  }
});

// PostMessage integration for character builder
window.addEventListener('message', event => {
  const msg = event.data;
  if (!msg || msg.channel !== 'forja-taverna-v1') return;

  if (msg.type === 'scroll-items') {
    window.scrollBy({ top: Number(msg.delta) || 0, behavior: 'auto' });
    return;
  }

  if (msg.type === 'context') {
    if (msg.funds !== undefined) tavernState.funds = Number(msg.funds) || 0;
    if (msg.characterName !== undefined) tavernState.characterName = msg.characterName;
    if (msg.level !== undefined) tavernState.level = Number(msg.level) || 1;
    if (msg.tattoosCount !== undefined) tavernState.tattoosCount = Number(msg.tattoosCount) || 0;
    if (Array.isArray(msg.contracts)) tavernState.contracts = msg.contracts;
    if (Array.isArray(msg.trainedSkills)) tavernState.trainedSkills = msg.trainedSkills;
    if (msg.partnerLimit !== undefined) tavernState.partnerLimit = msg.partnerLimit;
    if (Array.isArray(msg.partners)) tavernState.partners = msg.partners;
    syncWalletUI();
    renderCards();
    renderMercenariesGrid();
    if (tavernState.activeItem) {
      updateHireCalculation();
      const item = tavernState.activeItem;
      const partnerGrid = document.getElementById('partnerCardsGrid');
      if (partnerGrid && (item.id.startsWith('mercenario_') || item.id.startsWith('capangas_'))) {
        const list = getPartnerListForItem(item);
        partnerGrid.innerHTML = renderPartnerCards(list, tavernState.selectedPartnerId);
      }
    }
  }
});

// Initialization
if (typeof window !== 'undefined' && window.ForjaTopBar) {
  window.ForjaTopBar.renderTopbar();
  window.ForjaTopBar.aplicarAutohideScroll();
}
loadStorage();
renderChips();
renderCards();
renderMercenariesGrid();
syncWalletUI();

// Notify host that tavern is loaded
if (window.parent && window.parent !== window) {
  window.parent.postMessage({ channel: 'forja-taverna-v1', type: 'ready' }, '*');
}

let _lastTavernWheel = 0;
document.addEventListener('wheel', event => {
  const now = Date.now();
  if (now - _lastTavernWheel > 80 && window.parent && window.parent !== window) {
    _lastTavernWheel = now;
    if (event.deltaY > 0 || (event.deltaY < 0 && window.scrollY < 2)) {
      window.parent.postMessage({ channel: 'forja-taverna-v1', type: 'host-scroll', delta: event.deltaY, scrollY: window.scrollY }, '*');
    }
  }
}, { passive: true });

