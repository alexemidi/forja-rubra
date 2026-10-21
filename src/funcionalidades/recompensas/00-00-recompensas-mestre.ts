(() => {
  'use strict';

  let heroisMesa = [];
  let catalogoItens = [];
  let ultimoTesouro = null;

  function showToast(msg) {
    let t = document.getElementById('toastNotification');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toastNotification';
      t.className = 'toast-notification';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.display = 'block';
    setTimeout(() => {
      if (t) t.style.display = 'none';
    }, 3500);
  }

  function carregarCatalogo() {
    if (Array.isArray(window.DATA?.pdfItems)) {
      catalogoItens = window.DATA.pdfItems;
    } else if (typeof window.DATA?.pdfItems === 'object') {
      catalogoItens = Object.values(window.DATA.pdfItems);
    }
  }

  function atualizarHerois() {
    heroisMesa = typeof CampanhaMesa !== 'undefined' ? CampanhaMesa.listarHeroisMesa() : [];
    const grid = document.getElementById('partyGrid');
    const badge = document.getElementById('partyCountBadge');

    if (badge) {
      badge.textContent = `${heroisMesa.length} ${heroisMesa.length === 1 ? 'herói conectado' : 'heróis conectados'}`;
    }

    if (!grid) return;

    if (heroisMesa.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 24px; text-align: center; background: #121215; border: 1px dashed #27272a; border-radius: 6px; color: #a1a1aa; font-size: 0.88rem;">
          Nenhum herói salvo na mesa local. Crie ou retome fichas no Criador para vinculá-las à campanha.
        </div>
      `;
      atualizarSelects();
      return;
    }

    grid.innerHTML = heroisMesa.map(h => {
      const mochilaQtd = Array.isArray(h.snapshot?.backpack) ? h.snapshot.backpack.length : 0;
      return `
        <article class="party-hero-card" data-hero-id="${h.id}">
          <div class="party-hero-header" style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
            <div>
              <div class="party-hero-name">${h.nome}</div>
              <div class="party-hero-class">${h.raca} · ${h.classe} (Nível ${h.nivel})</div>
            </div>
            <a href="ficha.html?mestre=true&id=${encodeURIComponent(h.id)}" class="button small party-hero-view-btn" style="background:#991b1b;border:1px solid #b91c1c;color:#ffffff;font-size:0.75rem;padding:4px 10px;text-decoration:none;border-radius:4px;display:inline-flex;align-items:center;white-space:nowrap;font-weight:700" title="Abrir Ficha do Aventureiro no Modo Mestre">
              Ver Ficha
            </a>
          </div>
          <div class="party-hero-stats">
            <span class="party-hero-funds">T$ ${Number(h.saldo || 0).toLocaleString('pt-BR')}</span>
            <span class="party-hero-backpack">${mochilaQtd} ${mochilaQtd === 1 ? 'item na mochila' : 'itens na mochila'}</span>
          </div>
        </article>
      `;
    }).join('');

    atualizarSelects();
  }

  function atualizarSelects() {
    const selects = [
      document.getElementById('tibarsSingleHeroSelect'),
      document.getElementById('arsenalHeroTargetSelect'),
      document.getElementById('customTargetHero'),
      document.getElementById('grantTreasureHeroSelect')
    ];

    const optionsHtml = heroisMesa.length > 0
      ? heroisMesa.map(h => `<option value="${h.id}">${h.nome} (Saldo: T$ ${h.saldo})</option>`).join('')
      : '<option value="">Nenhum herói disponível</option>';

    selects.forEach(sel => {
      if (sel) sel.innerHTML = optionsHtml;
    });

    atualizarPreviaDivisao();
  }

  function atualizarPreviaDivisao() {
    const totalInput = document.getElementById('tibarsSplitTotalInput');
    const previewBox = document.getElementById('splitPreviewBox');
    if (!totalInput || !previewBox) return;

    const val = Number(totalInput.value) || 0;
    const qtd = heroisMesa.length;

    if (val <= 0 || qtd === 0) {
      previewBox.textContent = qtd === 0
        ? 'Nenhum herói na mesa para receber a divisão.'
        : 'Informe um valor para pré-visualizar a cota por jogador.';
      return;
    }

    if (typeof RecompensasT20 !== 'undefined') {
      const div = RecompensasT20.dividirTibares(val, qtd);
      previewBox.innerHTML = `
        <strong>Cota individual: T$ ${div.cotaPorJogador.toLocaleString('pt-BR')}</strong> para cada um dos ${qtd} heróis.<br>
        <span style="font-size:0.75rem;color:#71717a">Sobra não divisível: T$ ${div.sobra}</span>
      `;
    } else {
      const cota = Math.floor(val / qtd);
      previewBox.textContent = `Cota individual: T$ ${cota.toLocaleString('pt-BR')} para cada um dos ${qtd} heróis.`;
    }
  }

  function configurarAbas() {
    const tabs = document.querySelectorAll('.tool-tab-btn');
    const panels = {
      tibares: document.getElementById('panelTibares'),
      arsenal: document.getElementById('panelArsenal'),
      custom: document.getElementById('panelCustom'),
      gerador: document.getElementById('panelGerador'),
      comunidades: document.getElementById('panelComunidades'),
      regras: document.getElementById('panelRegras')
    };

    tabs.forEach(btn => {
      btn.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        const target = btn.dataset.tab;
        Object.entries(panels).forEach(([k, panel]) => {
          if (panel) panel.hidden = (k !== target);
        });
      });
    });
  }

  function configurarTibares() {
    // A. Bolsa Individual
    const btnSingle = document.getElementById('btnConfirmSingleTibars');
    const selSingle = document.getElementById('tibarsSingleHeroSelect');
    const inputSingle = document.getElementById('tibarsSingleAmountInput');

    if (btnSingle && selSingle && inputSingle) {
      btnSingle.addEventListener('click', () => {
        const val = Number(inputSingle.value) || 0;
        const heroId = selSingle.value;
        if (!heroId) {
          showToast('Selecione um herói destinatário.');
          return;
        }
        if (val <= 0) {
          showToast('Informe uma quantia válida de tibares.');
          return;
        }

        const res = CampanhaMesa.creditarTibaresHeroi(heroId, val);
        if (res.sucesso) {
          const heroi = heroisMesa.find(h => h.id === heroId);
          showToast(`+ T$ ${val.toLocaleString('pt-BR')} creditados para ${heroi ? heroi.nome : 'o herói'}!`);
          inputSingle.value = '';
          atualizarHerois();
        } else {
          showToast(res.mensagem || 'Erro ao creditar tibares.');
        }
      });
    }

    // B. Divisão Igualitária
    const totalInput = document.getElementById('tibarsSplitTotalInput');
    const btnSplit = document.getElementById('btnConfirmSplitTibars');

    if (totalInput) {
      totalInput.addEventListener('input', atualizarPreviaDivisao);
    }

    if (btnSplit && totalInput) {
      btnSplit.addEventListener('click', () => {
        const val = Number(totalInput.value) || 0;
        if (val <= 0) {
          showToast('Informe um valor total válido para dividir.');
          return;
        }
        if (heroisMesa.length === 0) {
          showToast('Não há heróis na mesa para dividir.');
          return;
        }

        const ids = heroisMesa.map(h => h.id);
        const res = CampanhaMesa.dividirTibaresEntreHerois(val, ids);
        if (res.sucesso) {
          showToast(`T$ ${val.toLocaleString('pt-BR')} divididos igualmente (+ T$ ${res.cotaIndividual} para cada um)!`);
          totalInput.value = '';
          atualizarHerois();
        } else {
          showToast(res.mensagem || 'Erro ao dividir tibares.');
        }
      });
    }
  }

  function configurarArsenal() {
    const searchInput = document.getElementById('arsenalSearchInput');
    const catFilter = document.getElementById('arsenalCategoryFilter');
    const targetSelect = document.getElementById('arsenalHeroTargetSelect');
    const grid = document.getElementById('arsenalResultsGrid');

    function renderItens() {
      if (!grid) return;
      carregarCatalogo();

      const term = (searchInput?.value || '').toLowerCase().trim();
      const cat = catFilter?.value || 'todos';

      let filtrados = catalogoItens;

      if (cat !== 'todos') {
        filtrados = filtrados.filter(item => {
          const c = (item.tipo || item.categoria || '').toLowerCase();
          if (cat === 'arma') return c.includes('arma');
          if (cat === 'armadura') return c.includes('armadura') || c.includes('escudo');
          if (cat === 'pocao') return c.includes('pocao') || c.includes('alquimia') || c.includes('consumivel');
          if (cat === 'acessorio') return c.includes('acessorio') || c.includes('vestuario');
          return true;
        });
      }

      if (term) {
        filtrados = filtrados.filter(item =>
          (item.nome || item.name || '').toLowerCase().includes(term) ||
          (item.descricao || item.textos?.descricao || '').toLowerCase().includes(term)
        );
      }

      const exibidos = filtrados.slice(0, 40);

      if (exibidos.length === 0) {
        grid.innerHTML = '<div style="padding:16px;text-align:center;color:#71717a;font-size:0.85rem">Nenhum item encontrado no catálogo.</div>';
        return;
      }

      grid.innerHTML = exibidos.map(item => {
        const preco = item.preco?.valor ?? item.price ?? item.preco ?? 0;
        const peso = item.espacos ?? item.peso ?? 1;
        const nome = item.nome || item.name || 'Item';
        const itemId = item.id || item.itemId || item.nome;

        return `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:#121216;border:1px solid #27272a;border-radius:4px;gap:12px">
            <div style="flex:1">
              <strong style="color:#ffffff;font-size:0.88rem;display:block">${nome}</strong>
              <span style="font-size:0.75rem;color:#a1a1aa">Preço: T$ ${preco} · Espaços: ${peso}</span>
            </div>
            <button class="btn-secondary btn-grant-catalog-item" type="button" data-item-id="${itemId}" style="padding:6px 14px;font-size:0.8rem">
              Conceder Item
            </button>
          </div>
        `;
      }).join('');

      grid.querySelectorAll('.btn-grant-catalog-item').forEach(btn => {
        btn.addEventListener('click', () => {
          const heroId = targetSelect?.value;
          if (!heroId) {
            showToast('Selecione um herói destinatário.');
            return;
          }
          const id = btn.dataset.itemId;
          const enc = catalogoItens.find(i => (i.id || i.itemId || i.nome) === id);
          if (enc) {
            const entry = {
              itemId: enc.id || enc.itemId || enc.nome,
              nome: enc.nome || enc.name,
              tipo: enc.tipo || enc.categoria || 'item_geral',
              preco: enc.preco?.valor ?? enc.price ?? enc.preco ?? 0,
              espacos: enc.espacos ?? enc.peso ?? 1,
              origem: 'recompensa_mestre'
            };
            const res = CampanhaMesa.adicionarItemHeroiMesa(heroId, entry);
            if (res.sucesso) {
              const h = heroisMesa.find(x => x.id === heroId);
              showToast(`"${entry.nome}" concedido para a mochila de ${h ? h.nome : 'herói'}!`);
              atualizarHerois();
            } else {
              showToast(res.mensagem || 'Erro ao conceder item.');
            }
          }
        });
      });
    }

    if (searchInput) searchInput.addEventListener('input', renderItens);
    if (catFilter) catFilter.addEventListener('change', renderItens);
    renderItens();
  }

  function configurarCustomizado() {
    const btnCreate = document.getElementById('btnCreateCustomItem');
    const inputName = document.getElementById('customName');
    const selectType = document.getElementById('customType');
    const targetHero = document.getElementById('customTargetHero');
    const inputPrice = document.getElementById('customPrice');
    const inputSpaces = document.getElementById('customSpaces');
    const inputDamage = document.getElementById('customDamage');
    const textDesc = document.getElementById('customDesc');

    if (!btnCreate) return;

    btnCreate.addEventListener('click', () => {
      const nome = (inputName?.value || '').trim();
      const heroId = targetHero?.value;

      if (!nome) {
        showToast('Informe o nome da sua criação.');
        return;
      }
      if (!heroId) {
        showToast('Selecione o herói destinatário.');
        return;
      }

      const entry = {
        itemId: `custom_${Date.now()}`,
        nome,
        tipo: selectType?.value || 'item_geral',
        preco: Number(inputPrice?.value) || 0,
        espacos: Number(inputSpaces?.value) || 1,
        dano: inputDamage?.value || '',
        descricao: textDesc?.value || '',
        origem: 'customizado_mestre'
      };

      const res = CampanhaMesa.adicionarItemHeroiMesa(heroId, entry);
      if (res.sucesso) {
        const h = heroisMesa.find(x => x.id === heroId);
        showToast(`Item "${nome}" forjado e entregue para ${h ? h.nome : 'o herói'}!`);
        inputName.value = '';
        if (textDesc) textDesc.value = '';
        atualizarHerois();
      } else {
        showToast(res.mensagem || 'Erro ao criar item customizado.');
      }
    });
  }

  function configurarGerador() {
    const ndSelect = document.getElementById('genNdSelect');
    const multSelect = document.getElementById('genMultSelect');
    const btnRoll = document.getElementById('btnRollTreasure');
    const box = document.getElementById('treasureResultBox');
    const btnGrant = document.getElementById('btnGrantTreasureToHero');
    const grantHeroSelect = document.getElementById('grantTreasureHeroSelect');

    if (!ndSelect || !btnRoll) return;

    if (typeof RecompensasT20 !== 'undefined') {
      ndSelect.innerHTML = RecompensasT20.NDS.map(nd => `<option value="${nd}">ND ${nd}</option>`).join('');
    }

    btnRoll.addEventListener('click', () => {
      if (typeof RecompensasT20 === 'undefined') {
        showToast('Módulo de recompensas indisponível.');
        return;
      }

      const nd = ndSelect.value || '1';
      const multiplicador = multSelect?.value || 'padrao';

      ultimoTesouro = RecompensasT20.gerarTesouro({ nd, multiplicador });

      if (box) {
        box.style.display = 'block';

        const titleEl = document.getElementById('resNdTitle');
        const rollEl = document.getElementById('resRollDetails');
        const totalValEl = document.getElementById('resTotalVal');
        const moneyEl = document.getElementById('resMoneyContent');
        const itemsEl = document.getElementById('resItemsContent');

        if (titleEl) titleEl.textContent = `Tesouro Conquistado · ND ${ultimoTesouro.nd} (${ultimoTesouro.multiplicador})`;
        if (rollEl) rollEl.textContent = `Rolagens no d100: Dinheiro ${ultimoTesouro.rolagemDinheiroD100}%, Itens ${ultimoTesouro.rolagemItemD100}%`;
        if (totalValEl) totalValEl.textContent = `Valor Estimado: T$ ${ultimoTesouro.totalValorEstimado.toLocaleString('pt-BR')}`;

        if (moneyEl) {
          let html = `<strong>T$ ${ultimoTesouro.tibares.toLocaleString('pt-BR')}</strong> em moedas correntes.`;
          if (ultimoTesouro.riqueza) {
            html += `<br><span style="color:#d97706;font-weight:600">Riqueza especial: ${ultimoTesouro.riqueza.nome} (Avaliada em T$ ${ultimoTesouro.riqueza.valor})</span>`;
          }
          moneyEl.innerHTML = html;
        }

        if (itemsEl) {
          if (ultimoTesouro.itens.length === 0) {
            itemsEl.innerHTML = '<span style="font-size:0.82rem;color:#71717a;font-style:italic">Nenhum equipamento especial sorteado neste tesouro.</span>';
          } else {
            itemsEl.innerHTML = ultimoTesouro.itens.map(item => `
              <div class="treasure-item-row">
                <div>
                  <strong style="color:#ffffff;font-size:0.88rem">${item.nome}</strong>
                  <span style="display:block;font-size:0.75rem;color:#a1a1aa">
                    ${item.material ? `Material: ${item.material.nome} · ` : ''}
                    ${item.melhorias && item.melhorias.length ? `Melhorias: ${item.melhorias.map(m=>m.nome).join(', ')} · ` : ''}
                    Preço aprox: T$ ${item.preco || item.precoAproximado || 0}
                  </span>
                </div>
              </div>
            `).join('');
          }
        }
      }
    });

    if (btnGrant && grantHeroSelect) {
      btnGrant.addEventListener('click', () => {
        if (!ultimoTesouro) {
          showToast('Nenhum tesouro rolado recentemente.');
          return;
        }
        const heroId = grantHeroSelect.value;
        if (!heroId) {
          showToast('Selecione um herói destinatário.');
          return;
        }

        // Credita tibares
        if (ultimoTesouro.tibares > 0) {
          CampanhaMesa.creditarTibaresHeroi(heroId, ultimoTesouro.tibares);
        }

        // Concede riqueza se houver
        if (ultimoTesouro.riqueza) {
          CampanhaMesa.adicionarItemHeroiMesa(heroId, {
            itemId: `riqueza_${Date.now()}`,
            nome: ultimoTesouro.riqueza.nome,
            tipo: 'item_geral',
            preco: ultimoTesouro.riqueza.valor,
            espacos: 1,
            origem: 'tesouro_t20'
          });
        }

        // Concede itens sorteados
        ultimoTesouro.itens.forEach(item => {
          CampanhaMesa.adicionarItemHeroiMesa(heroId, {
            itemId: `tesouro_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            nome: item.nome,
            tipo: item.categoria || 'item_geral',
            preco: item.preco || item.precoAproximado || 0,
            espacos: item.espacos || 1,
            origem: 'tesouro_t20'
          });
        });

        const h = heroisMesa.find(x => x.id === heroId);
        showToast(`Tesouro entregue com sucesso para ${h ? h.nome : 'o herói'}!`);
        atualizarHerois();
        if (box) box.style.display = 'none';
        ultimoTesouro = null;
      });
    }
  }

  function configurarComunidades() {
    const btn = document.getElementById('btnGenerateCommunity');
    const typeSelect = document.getElementById('communityTypeSelect');
    const nameInput = document.getElementById('communityNameInput');
    const resultBox = document.getElementById('communityResultBox');

    if (!btn || !resultBox) return;

    btn.addEventListener('click', () => {
      const tipo = typeSelect?.value || 'aldeia';
      const nomeCustom = nameInput?.value?.trim();
      const moduloComunidades = typeof ComunidadesT20 !== 'undefined' ? ComunidadesT20 : (typeof window !== 'undefined' ? window.ComunidadesT20 : null);
      if (!moduloComunidades) {
        showToast('Módulo de Comunidades não carregado.');
        return;
      }

      const c = moduloComunidades.gerarComunidade(tipo, nomeCustom);
      resultBox.style.display = 'block';

      const gridSize = tipo === 'metropole' ? 5 : tipo === 'cidade_grande' ? 4 : tipo === 'cidade_media' ? 3 : tipo === 'vila' ? 2 : 1;

      const gridCellsHtml = c.mapa.quadros.map(q => `
        <div style="background:#161b22;border:1px solid #30363d;border-radius:6px;padding:12px;display:flex;flex-direction:column;gap:6px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <strong style="color:#ffffff;font-size:0.85rem">${q.nome}</strong>
            <span style="font-size:0.7rem;padding:2px 6px;border-radius:4px;background:#21262d;color:#8b949e;text-transform:uppercase">${q.categoria}</span>
          </div>
          <p style="margin:0;font-size:0.78rem;color:#c9d1d9;line-height:1.4">${q.descricao}</p>
          ${q.pontosInteresse && q.pontosInteresse.length ? `
            <div style="margin-top:6px;padding-top:6px;border-top:1px dashed #30363d">
              <strong style="font-size:0.72rem;color:#fca5a5;display:block;margin-bottom:4px">Locais:</strong>
              ${q.pontosInteresse.map(poi => `<div style="font-size:0.75rem;color:#e6edf3">• <strong>${poi.nome}</strong> <span style="color:#8b949e">(${poi.tipo})</span></div>`).join('')}
            </div>
          ` : ''}
        </div>
      `).join('');

      resultBox.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;border-bottom:1px solid #27272a;padding-bottom:14px">
          <div>
            <h2 style="font-family:'Cinzel',serif;font-size:1.35rem;margin:0 0 4px 0;color:#ffffff">${c.nome}</h2>
            <span style="font-size:0.85rem;color:#dc2626;font-weight:700;text-transform:uppercase">${c.tipoNome} · População: ${c.populacao}</span>
          </div>
          <button type="button" class="button small" onclick="navigator.clipboard.writeText(document.getElementById('communityResultBox').innerText);if(typeof showToast==='function')showToast('Dados da comunidade copiados!');" style="font-size:0.75rem;padding:4px 10px;background:#27272a;border:1px solid #3f3f46;color:#ffffff;border-radius:4px;cursor:pointer">
            Copiar Resumo
          </button>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:12px;margin-bottom:20px;background:#090d13;border:1px solid #1f242c;border-radius:6px;padding:14px">
          <div><strong style="color:#e6edf3;font-size:0.82rem">Governo:</strong> <span style="font-size:0.82rem;color:#8b949e">${c.governo}</span></div>
          <div><strong style="color:#e6edf3;font-size:0.82rem">Guarda & Defesa:</strong> <span style="font-size:0.82rem;color:#8b949e">${c.guarda}</span></div>
          <div><strong style="color:#e6edf3;font-size:0.82rem">Taverna / Ponto Central:</strong> <span style="font-size:0.82rem;color:#8b949e">${c.taverna}</span></div>
        </div>

        <div style="margin-bottom:12px">
          <h4 style="margin:0 0 10px 0;font-size:0.92rem;color:#ffffff;font-family:'Cinzel',serif">Grid Modular da Comunidade (${gridSize}x${gridSize}):</h4>
          <div style="display:grid;grid-template-columns:repeat(${gridSize}, 1fr);gap:10px">
            ${gridCellsHtml}
          </div>
        </div>
      `;

      showToast(`Comunidade "${c.nome}" gerada com sucesso!`);
    });
  }

  function configurarRegrasMesa() {
    const nameInp = document.getElementById('tableRuleNameInput');
    const cbBroad = document.getElementById('ruleBroadDevotion');
    const cbFund = document.getElementById('ruleFundamentalist');
    const cbRaces = document.getElementById('ruleOpenRaces');
    const cbDevotion = document.getElementById('ruleOpenDevotion');
    const cbAge = document.getElementById('ruleAgeRules');
    const cbDual = document.getElementById('ruleDualOrigin');
    const cbTrain = document.getElementById('ruleLevelTraining');
    const codeOut = document.getElementById('tableInviteCodeOutput');
    const urlOut = document.getElementById('tableInviteUrlOutput');
    const btnSave = document.getElementById('btnSaveTableRules');
    const btnCopyCode = document.getElementById('btnCopyTableCode');
    const btnCopyUrl = document.getElementById('btnCopyTableUrl');

    if (!nameInp || !codeOut || !urlOut) return;

    function lerFormulario() {
      return {
        tableName: nameInp.value.trim() || 'Campanha de Arton',
        broadDevotion: Boolean(cbBroad?.checked),
        fundamentalistDevotion: Boolean(cbFund?.checked),
        openRaces: Boolean(cbRaces?.checked),
        openDevotion: Boolean(cbDevotion?.checked),
        ageRules: Boolean(cbAge?.checked),
        dualOrigin: Boolean(cbDual?.checked),
        levelTraining: Boolean(cbTrain?.checked)
      };
    }

    function atualizarSaida(salvar) {
      const rules = lerFormulario();
      if (salvar && typeof ForjaUnificada?.saveActiveTableRules === 'function') {
        ForjaUnificada.saveActiveTableRules(rules);
      }
      const code = typeof ForjaUnificada?.encodeTableRulesCode === 'function'
        ? ForjaUnificada.encodeTableRulesCode(rules)
        : '';
      const baseOrigin = window.location.href.replace(/\/[^/]*$/, '/criador.html');
      const url = typeof ForjaUnificada?.buildTableInviteUrl === 'function'
        ? ForjaUnificada.buildTableInviteUrl(baseOrigin, rules)
        : `${baseOrigin}?mesa=${encodeURIComponent(code)}`;
      codeOut.value = code;
      urlOut.value = url;
    }

    if (typeof ForjaUnificada?.loadActiveTableRules === 'function') {
      const saved = ForjaUnificada.loadActiveTableRules();
      if (saved) {
        nameInp.value = saved.tableName || 'Campanha de Arton';
        if (cbBroad) cbBroad.checked = Boolean(saved.broadDevotion);
        if (cbFund) cbFund.checked = Boolean(saved.fundamentalistDevotion);
        if (cbRaces) cbRaces.checked = Boolean(saved.openRaces);
        if (cbDevotion) cbDevotion.checked = Boolean(saved.openDevotion);
        if (cbAge) cbAge.checked = Boolean(saved.ageRules);
        if (cbDual) cbDual.checked = Boolean(saved.dualOrigin);
        if (cbTrain) cbTrain.checked = Boolean(saved.levelTraining);
      }
    }

    atualizarSaida(false);

    [nameInp, cbBroad, cbFund, cbRaces, cbDevotion, cbAge, cbDual, cbTrain].forEach(el => {
      if (el) el.addEventListener('change', () => atualizarSaida(true));
    });

    if (btnSave) {
      btnSave.addEventListener('click', () => {
        atualizarSaida(true);
        showToast('Regras da mesa salvas e link de convite atualizado!');
      });
    }

    if (btnCopyCode) {
      btnCopyCode.addEventListener('click', () => {
        navigator.clipboard?.writeText(codeOut.value);
        showToast('Código da mesa copiado para a área de transferência!');
      });
    }

    if (btnCopyUrl) {
      btnCopyUrl.addEventListener('click', () => {
        navigator.clipboard?.writeText(urlOut.value);
        showToast('Link de convite copiado para a área de transferência!');
      });
    }
  }

  function inicializar() {
    atualizarHerois();
    configurarAbas();
    configurarTibares();
    configurarArsenal();
    configurarCustomizado();
    configurarGerador();
    configurarComunidades();
    configurarRegrasMesa();

    // Drawer global trigger
    const drawerBtn = document.getElementById('drawerMenuBtn');
    if (drawerBtn && typeof window.ForjaDrawer !== 'undefined') {
      drawerBtn.addEventListener('click', () => {
        window.ForjaDrawer.abrir();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializar);
  } else {
    inicializar();
  }
})();
