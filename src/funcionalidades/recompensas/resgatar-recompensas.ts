// @ts-check
/**
 * FORJA RUBRA — Módulo Dedicado de Resgate de Recompensas do Herói
 * Interface Dark Fantasy para recebimento de Tibares (+T$), itens do catálogo a custo zero e criação de itens customizados.
 */
(() => {
  'use strict';

  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c]));
  }

  function showToast(msg) {
    let t = document.getElementById('toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      t.className = 'toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('visible');
    clearTimeout(/** @type {any} */ (t)._timer);
    /** @type {any} */ (t)._timer = setTimeout(() => {
      t.classList.remove('visible');
    }, 3200);
  }

  function carregarHeroi() {
    let hero = null;
    try {
      const raw = localStorage.getItem('forja-heroi-t20-v1');
      if (raw) hero = JSON.parse(raw);
    } catch (e) {}
    return hero;
  }

  function salvarHeroi(hero) {
    if (!hero) return;
    try {
      localStorage.setItem('forja-heroi-t20-v1', JSON.stringify(hero));
    } catch (e) {
      console.error('Erro ao salvar herói:', e);
    }
  }

  function inicializarResgateRecompensas() {
    // 1. Inicializa TopBar unificada e autohide
    if (typeof window !== 'undefined' && window.ForjaTopBar) {
      window.ForjaTopBar.renderTopbar();
      window.ForjaTopBar.aplicarAutohideScroll();
    }

    // 2. Elementos DOM
    const tabBtns = document.querySelectorAll('.reward-tab-btn');
    const panelTibars = document.getElementById('panelTibars');
    const panelCatalog = document.getElementById('panelCatalog');
    const panelCustom = document.getElementById('panelCustom');
    const currentBalanceEl = document.getElementById('rewardDisplayCurrentBalance');
    const newBalanceEl = document.getElementById('rewardDisplayNewBalance');
    const tibarsInput = /** @type {HTMLInputElement|null} */ (document.getElementById('rewardTibarsAmount'));
    const confirmTibarsBtn = document.getElementById('btnConfirmTibarsReward');
    const quickAddBtns = document.querySelectorAll('.reward-quick-add-btn');

    // 3. Gerenciamento de Abas
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        tabBtns.forEach(b => {
          b.classList.toggle('active', b === btn);
          if (b === btn) {
            b.style.background = '#131c28';
            b.style.borderColor = '#28394e';
            b.style.color = '#f1f5f9';
          } else {
            b.style.background = 'transparent';
            b.style.borderColor = 'transparent';
            b.style.color = '#94a3b8';
          }
        });

        if (panelTibars) panelTibars.hidden = targetTab !== 'tibars';
        if (panelCatalog) panelCatalog.hidden = targetTab !== 'catalog';
        if (panelCustom) panelCustom.hidden = targetTab !== 'custom';
      });
    });

    // 4. Saldo atual e projeção
    function atualizarSaldos() {
      const topData = window.ForjaTopBar ? window.ForjaTopBar.obterDadosHeroiAtivo() : { funds: 0 };
      const currentFunds = topData.funds || 0;
      if (currentBalanceEl) {
        currentBalanceEl.textContent = `T$ ${currentFunds.toLocaleString('pt-BR')}`;
      }

      const inputVal = Number(tibarsInput?.value || 0);
      const projected = currentFunds + (inputVal > 0 ? inputVal : 0);
      if (newBalanceEl) {
        newBalanceEl.textContent = `T$ ${projected.toLocaleString('pt-BR')}`;
      }
    }

    atualizarSaldos();

    if (tibarsInput) {
      tibarsInput.addEventListener('input', atualizarSaldos);
    }

    quickAddBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const add = Number(btn.getAttribute('data-add') || 0);
        if (tibarsInput) {
          const currentInput = Number(tibarsInput.value || 0);
          tibarsInput.value = String(currentInput + add);
          atualizarSaldos();
        }
      });
    });

    // 5. Confirmação do Recebimento de Tibares
    if (confirmTibarsBtn) {
      confirmTibarsBtn.addEventListener('click', () => {
        const val = Number(tibarsInput?.value || 0);
        if (!val || val <= 0) {
          showToast('Digite uma quantia válida de Tibares para receber.');
          tibarsInput?.focus();
          return;
        }

        let hero = carregarHeroi() || {};
        hero.finances = hero.finances || {};
        hero.finances.rewardFunds = Math.round(((Number(hero.finances.rewardFunds) || 0) + val) * 100) / 100;

        const topData = window.ForjaTopBar ? window.ForjaTopBar.obterDadosHeroiAtivo() : { funds: 0 };
        const newTotal = (topData.funds || 0) + val;

        hero.funds = newTotal;
        salvarHeroi(hero);

        try {
          localStorage.setItem('forja-saldo-personagem-ativo-v1', JSON.stringify({
            id: hero.identity?.characterId || 'ativo',
            name: hero.identity?.characterName,
            funds: newTotal
          }));
        } catch (e) {}

        // Atualiza perfil de arsenal se existir
        try {
          const rawProfiles = localStorage.getItem('arsenal-arton-character-profiles-v1');
          if (rawProfiles) {
            const parsed = JSON.parse(rawProfiles);
            const active = parsed.profiles?.find(p => p.id === 'ficha-ativa') || parsed.profiles?.find(p => p.id === parsed.activeId) || parsed.profiles?.[0];
            if (active) {
              active.funds = newTotal;
              localStorage.setItem('arsenal-arton-character-profiles-v1', JSON.stringify(parsed));
            }
          }
        } catch (e) {}

        // Atualiza TopBar e display
        if (window.ForjaTopBar) window.ForjaTopBar.renderTopbar();
        if (tibarsInput) tibarsInput.value = '';
        atualizarSaldos();

        showToast(`+ T$ ${val.toLocaleString('pt-BR')} adicionados à sua ficha com sucesso!`);
      });
    }

    // 6. Preenchimento de Itens de Inspiração
    const inspSelect = /** @type {HTMLSelectElement|null} */ (document.getElementById('customInspirationSelect'));
    const inspPreview = document.getElementById('customInspirationPreview');
    const customNameInput = /** @type {HTMLInputElement|null} */ (document.getElementById('customItemName'));
    const customTypeSelect = /** @type {HTMLSelectElement|null} */ (document.getElementById('customItemType'));
    const customPriceInput = /** @type {HTMLInputElement|null} */ (document.getElementById('customItemPrice'));
    const customSlotsInput = /** @type {HTMLInputElement|null} */ (document.getElementById('customItemSlots'));
    const customDescInput = /** @type {HTMLTextAreaElement|null} */ (document.getElementById('customItemDesc'));

    // @ts-ignore
    const pdfItems = window.__FORJA_DATA__?.DATA?.pdfItems || window.__FORJA_DATA__?.pdfItems || [];
    if (inspSelect && Array.isArray(pdfItems) && pdfItems.length > 0) {
      const sorted = [...pdfItems].sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || '')));
      sorted.forEach(it => {
        if (!it || !it.id || !it.nome) return;
        const opt = document.createElement('option');
        opt.value = it.id;
        opt.textContent = `${it.nome} (${it.tipo || 'item'}) · T$ ${it.preco?.valor || 0}`;
        inspSelect.appendChild(opt);
      });

      inspSelect.addEventListener('change', () => {
        const selectedId = inspSelect.value;
        const found = pdfItems.find(i => i.id === selectedId);
        if (found) {
          if (customTypeSelect && found.tipo) {
            const valid = Array.from(customTypeSelect.options).some(o => o.value === found.tipo);
            if (valid) customTypeSelect.value = found.tipo;
          }
          if (customPriceInput && found.preco?.valor != null) {
            customPriceInput.value = String(found.preco.valor);
          }
          if (customSlotsInput && found.espacos != null) {
            customSlotsInput.value = String(found.espacos);
          }
          if (customDescInput && (found.descricao || found.textos?.descricao)) {
            customDescInput.value = found.descricao || found.textos?.descricao || '';
          }
          if (inspPreview) {
            inspPreview.style.display = 'block';
            inspPreview.textContent = `Inspiração importada: ${found.nome} · ${found.tipo || 'item'} · Preço base: T$ ${found.preco?.valor || 0}`;
          }
        } else {
          if (inspPreview) inspPreview.style.display = 'none';
        }
      });
    }

    // 7. Cadastro de Novo Item Personalizado
    const customForm = document.getElementById('customRewardItemForm');
    if (customForm) {
      customForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nome = (customNameInput?.value || '').trim();
        if (!nome) {
          showToast('Informe o nome da relíquia ou item personalizado.');
          customNameInput?.focus();
          return;
        }

        const tipo = customTypeSelect?.value || 'item_geral';
        const preco = Math.max(0, Number(customPriceInput?.value || 0));
        const espacos = Math.max(0, Number(customSlotsInput?.value || 1));
        const desc = (customDescInput?.value || '').trim();

        const customItemId = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const newItemObj = {
          id: customItemId,
          nome: nome,
          tipo: tipo,
          espacos: espacos,
          preco: { valor: preco, moeda: 'TS' },
          descricao: desc,
          textos: { descricao: desc },
          adicionado: true,
          recompensa: true,
          origemRecompensa: true
        };

        let hero = carregarHeroi() || {};
        hero.customItems = hero.customItems || [];
        hero.customItems.push(newItemObj);

        // Adiciona à mochila do herói
        const backpackKey = Array.isArray(hero.bag) ? 'bag' : (Array.isArray(hero.inventory) ? 'inventory' : 'backpack');
        hero[backpackKey] = hero[backpackKey] || [];
        hero[backpackKey].push({
          itemId: customItemId,
          quantidade: 1,
          customName: nome,
          itemSnapshot: newItemObj
        });

        salvarHeroi(hero);

        // Adiciona ao perfil de arsenal se houver
        try {
          const rawProfiles = localStorage.getItem('arsenal-arton-character-profiles-v1');
          if (rawProfiles) {
            const parsed = JSON.parse(rawProfiles);
            const active = parsed.profiles?.find(p => p.id === 'ficha-ativa') || parsed.profiles?.find(p => p.id === parsed.activeId) || parsed.profiles?.[0];
            if (active) {
              active.backpack = active.backpack || [];
              active.backpack.push({
                itemId: customItemId,
                name: nome,
                quantidade: 1,
                itemSnapshot: newItemObj
              });
              localStorage.setItem('arsenal-arton-character-profiles-v1', JSON.stringify(parsed));
            }
          }
        } catch (err) {}

        showToast(`Item "${nome}" adicionado à mochila do herói!`);

        // Limpa campos
        if (customNameInput) customNameInput.value = '';
        if (customDescInput) customDescInput.value = '';
        if (inspSelect) inspSelect.value = '';
        if (inspPreview) inspPreview.style.display = 'none';
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarResgateRecompensas);
  } else {
    inicializarResgateRecompensas();
  }
})();
