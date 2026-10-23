// @ts-check

/**
 * Módulo de Oficinas de Manufatura (Hub de Ofícios) para Forja do Herói - T20.
 * Apresenta a seleção visual das 8 estações de trabalho de Arton e direciona
 * para a loja canônica configurada com regras de manufatura (⅓ do custo).
 */

(function () {
  const escapeHtml = typeof esc === 'function'
    ? esc
    : (s => String(s ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c])));

  let isPreviewMode = false;

  /**
   * Garante a criação ou sincronização do modal Hub de Oficinas do Herói.
   * @returns {HTMLElement & { sync?: (opts?: { previewAll?: boolean }) => void }}
   */
  function ensureWorkshopModal() {
    let modal = document.getElementById('workshop-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'workshop-modal';
      modal.className = 'modal-backdrop';
      modal.hidden = true;
      modal.style.cssText = 'position:fixed;inset:0;background:rgba(4,7,14,0.85);backdrop-filter:blur(6px);z-index:100000;display:none;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;';
      modal.innerHTML = `
        <div class="modal-dialog hero-workshop-dialog" role="dialog" aria-modal="true" aria-labelledby="hero-workshop-title" style="max-width:760px;width:95vw;max-height:90vh;display:flex;flex-direction:column;background:#0e131b;border:1px solid #28364b;border-radius:10px;box-shadow:0 16px 40px rgba(0,0,0,0.85);color:#e2e8f0;overflow:hidden;">
          <header class="modal-header" style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid #1e2837;background:#131a26;">
            <div style="display:flex;align-items:center;gap:10px;">
              <h3 id="hero-workshop-title" style="margin:0;font-size:1.15rem;font-weight:700;color:#d4af37;font-family:Cinzel,serif;">Bancada de Fabricação do Herói</h3>
            </div>
            <button class="button icon-only close-hero-workshop-btn" type="button" aria-label="Fechar" style="background:none;border:none;font-size:1.3rem;cursor:pointer;color:#94a3b8;">&times;</button>
          </header>
          <div id="hero-workshop-modal-body" style="padding:18px 20px;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:14px;">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
              <button type="button" id="btnToggleCraftRules" class="button small" style="background:rgba(185,28,28,0.15);border:1px solid #7f1d1d;color:#fca5a5;font-weight:600;padding:6px 14px;border-radius:6px;cursor:pointer;">Ver Regras de Fabricação</button>
              <span style="font-size:0.75rem;color:#94a3b8;">Matérias-primas custam ⅓ do valor de mercado.</span>
            </div>
            <div id="craftRulesPanel" style="display:none;background:#141a24;border:1px solid #263345;border-radius:8px;padding:12px 14px;font-size:0.82rem;line-height:1.5;color:#cbd5e1;">
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;">
                <div style="border-left:2px solid #b91c1c;padding-left:8px;">
                  <strong style="color:#f87171;display:block;">1. Custo de Matéria-Prima</strong>
                  Gasta apenas ⅓ do preço do item (ou ¼ para habilidades que reduzem a fração).
                </div>
                <div style="border-left:2px solid #38bdf8;padding-left:8px;">
                  <strong style="color:#7dd3fc;display:block;">2. Teste de Ofício</strong>
                  CD 15 para itens simples mundanos; CD 20 para itens complexos, marciais e alquímicos; CD 30 a 50 para itens mágicos/específicos.
                </div>
                <div style="border-left:2px solid #eab308;padding-left:8px;">
                  <strong style="color:#fde047;display:block;">3. Tempo de Fabricação</strong>
                  1 dia para consumíveis e alquímicos; 1 semana para itens mundanos e engenhocas; 1 mês para itens superiores ou mágicos.
                </div>
                <div style="border-left:2px solid #a855f7;padding-left:8px;">
                  <strong style="color:#d8b4fe;display:block;">4. Regras do Inventor</strong>
                  Engenhocas simulam magias (CD 20 + PM, custo T$ 100 &times; PM, limite = Int). Poções/Pergaminhos custam T$ 30 &times; PM&sup2;.
                </div>
              </div>
            </div>
            <div id="hero-workshop-cards-container" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;margin-top:6px;"></div>
          </div>
          <footer style="padding:12px 20px;border-top:1px solid #1e2837;display:flex;justify-content:space-between;align-items:center;background:#131a26;flex-wrap:wrap;gap:8px;">
            <a href="oficina.html" class="button small" style="background:transparent;border:1px solid #334155;color:#94a3b8;font-size:0.78rem;">Ver Compêndio de Todas as Oficinas &rarr;</a>
            <button type="button" class="button close-hero-workshop-btn" style="background:#991b1b;border-color:#b91c1c;color:#ffffff;font-weight:700;padding:6px 18px;border-radius:6px;cursor:pointer;">Voltar à Ficha</button>
          </footer>
        </div>
      `;
      document.body.appendChild(modal);

      const closeHandler = (e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        modal.hidden = true;
        modal.style.display = 'none';
        if (typeof window.liberarTravamentoScroll === 'function') window.liberarTravamentoScroll();
      };
      modal.querySelectorAll('.close-hero-workshop-btn').forEach(btn => btn.addEventListener('click', closeHandler));
      modal.addEventListener('click', (ev) => {
        if (ev.target === modal) closeHandler(ev);
      });

      const toggleRulesBtn = modal.querySelector('#btnToggleCraftRules');
      const rulesPanel = modal.querySelector('#craftRulesPanel');
      if (toggleRulesBtn && rulesPanel) {
        toggleRulesBtn.addEventListener('click', () => {
          const isClosed = rulesPanel.style.display === 'none';
          rulesPanel.style.display = isClosed ? 'block' : 'none';
          toggleRulesBtn.textContent = isClosed ? 'Recolher Regras de Fabricação' : 'Ver Regras de Fabricação';
        });
      }
    }

    // @ts-ignore
    modal.sync = function () {
      const container = modal.querySelector('#hero-workshop-cards-container');
      if (!container) return;
      // @ts-ignore
      const rules = typeof RegrasManufatura !== 'undefined' ? RegrasManufatura : null;
      const trainedList = typeof allTrainedOffices === 'function' ? allTrainedOffices() : [];
      
      if (!trainedList || trainedList.length === 0) {
        container.innerHTML = `
          <div style="grid-column:1/-1;background:#141a24;border:1px dashed #334155;border-radius:8px;padding:24px;text-align:center;color:#94a3b8;">
            <p style="margin:0 0 8px 0;font-size:0.95rem;font-weight:600;color:#e2e8f0;">Nenhum treino na perícia Ofício encontrado</p>
            <p style="margin:0 0 16px 0;font-size:0.82rem;">Para produzir itens pagando apenas ⅓ do preço em matérias-primas ou forjar engenhocas, seu personagem precisa ter treino em pelo menos uma especialidade de Ofício.</p>
            <a href="oficina.html" class="button small primary">Explorar Catálogo Geral de Oficinas</a>
          </div>
        `;
        return;
      }

      const seenKeys = new Set();
      const cardsHtml = trainedList.map(name => {
        const normKey = rules && typeof rules.normalizarOficio === 'function' ? rules.normalizarOficio(name) : 'artesao';
        if (seenKeys.has(normKey)) return '';
        seenKeys.add(normKey);
        const meta = rules?.secoesOficina?.[normKey] || {
          title: 'Oficina de Manufatura',
          oficioNome: `Ofício (${name})`,
          description: 'Produção de itens de aventura e matérias-primas.',
          icon: 'tools'
        };

        const iconName = normKey === 'alquimista' ? 'flask' :
          (normKey === 'armeiro' ? 'shield' :
          (normKey === 'alfaiate' ? 'scissors' :
          (normKey === 'escriba' ? 'scroll' :
          (normKey === 'cozinheiro' ? 'coffee' :
          (normKey === 'engenhoqueiro' ? 'cog' :
          (normKey === 'tatuador' ? 'feather' : 'tools'))))));

        const iconSvg = window.IconesForja ? window.IconesForja.get(iconName, 'icon-large') : '';

        return `
          <div class="hero-workshop-card" data-workshop-key="${normKey}" style="background:#141a24;border:1px solid #233144;border-radius:8px;padding:14px;display:flex;flex-direction:column;justify-content:space-between;gap:12px;cursor:pointer;transition:all 0.2s ease;">
            <div style="display:flex;gap:12px;align-items:flex-start;">
              <div style="width:44px;height:44px;border-radius:8px;background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.3);display:flex;align-items:center;justify-content:center;color:#d4af37;flex-shrink:0;">
                ${iconSvg || '<span style="font-size:1.4rem;font-weight:700;">&dagger;</span>'}
              </div>
              <div style="flex:1;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                  <h4 style="margin:0;font-size:0.98rem;color:#f8fafc;font-family:Cinzel,serif;">${escapeHtml(meta.title)}</h4>
                  <span style="background:rgba(34,197,94,0.15);color:#4ade80;border:1px solid rgba(34,197,94,0.3);font-size:0.65rem;font-weight:700;padding:1px 6px;border-radius:4px;text-transform:uppercase;">Treinado</span>
                </div>
                <div style="font-size:0.75rem;color:#d4af37;margin-bottom:6px;font-weight:600;">${escapeHtml(meta.oficioNome || name)}</div>
                <p style="margin:0;font-size:0.78rem;line-height:1.4;color:#94a3b8;">${escapeHtml(meta.description)}</p>
              </div>
            </div>
            <div style="display:flex;justify-content:flex-end;border-top:1px solid #1a2332;padding-top:10px;">
              <button type="button" class="button small primary btn-enter-workshop" data-workshop-key="${normKey}" style="background:#991b1b;border-color:#b91c1c;color:#ffffff;font-weight:700;padding:5px 14px;border-radius:5px;font-size:0.78rem;">Entrar na Oficina (Fabricar) &rarr;</button>
            </div>
          </div>
        `;
      }).filter(Boolean).join('');

      container.innerHTML = cardsHtml;

      container.querySelectorAll('[data-workshop-key]').forEach(el => {
        el.addEventListener('click', (e) => {
          const key = el.dataset.workshopKey;
          if (!key) return;
          modal.hidden = true;
          modal.style.display = 'none';
          if (typeof window.liberarTravamentoScroll === 'function') window.liberarTravamentoScroll();
          // @ts-ignore
          if (typeof state !== 'undefined') {
            // @ts-ignore
            state.workshopSection = key;
            // @ts-ignore
            state.sheetView = 'workshop';
            // @ts-ignore
            if (typeof persistNow === 'function') persistNow();
            // @ts-ignore
            if (typeof renderStage === 'function') renderStage();
            // @ts-ignore
            if (typeof renderFicha === 'function') renderFicha();
          }
        });
      });
    };

    return modal;
  }


  function ensureEngenhocasRulesModal() {
    let modal = document.getElementById('engenhocas-rules-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'engenhocas-rules-modal';
      modal.className = 'modal-backdrop';
      modal.hidden = true;
      modal.innerHTML = `
        <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="engenhocas-rules-title" style="max-width: 680px; width: 95vw; max-height: 85vh; display: flex; flex-direction: column; background: var(--bg-surface, #1e2124); border: 1px solid var(--border-subtle, #333); border-radius: 10px; box-shadow: 0 12px 36px rgba(0,0,0,0.7); color: var(--text-main, #eee); overflow: hidden;">
          <header class="modal-header" style="display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid var(--border-subtle, #333); background: var(--bg-header, #181a1c);">
            <div style="display: flex; align-items: center; gap: 10px;">
              
              <h3 id="engenhocas-rules-title" style="margin: 0; font-size: 1.15rem; font-weight: 600; color: #fff;">Regras de Engenhocas (Tormenta20, p. 70)</h3>
            </div>
            <button class="button icon-only close-engenhocas-rules-btn" type="button" aria-label="Fechar" style="background: none; border: none; font-size: 1.3rem; cursor: pointer; color: var(--text-muted, #888);">&times;</button>
          </header>
          <div style="padding: 18px; overflow-y: auto; flex: 1; font-size: 0.88rem; line-height: 1.6; display: flex; flex-direction: column; gap: 12px; color: #cbd5e1;">
            <p><strong>Uma engenhoca é uma invenção que simula o efeito de uma magia.</strong> Exemplos incluem um canhão (simula o efeito da magia <em>Bola de Fogo</em>), uma arma de raios (<em>Relâmpago</em>), um casaco blindado (<em>Armadura Arcana</em>), um emplastro curativo (<em>Curar Ferimentos</em>), um guarda-costas mecânico (<em>Conjurar Monstro</em>), um projetor de imagens (<em>Criar Ilusão</em>), um veículo a vapor (<em>Montaria Arcana</em>) etc.</p>
            <p>Uma engenhoca é um item mundano Minúsculo que ocupa 1 espaço e possui <strong>Defesa 15, pontos de vida iguais à metade dos PV de seu fabricante e RD 5</strong>. Quando é fabricada, escolha se ela será <strong>empunhada</strong> (precisa estar na sua mão para ser ativada) ou <strong>vestida</strong> (precisa estar vestida para ser ativada, conta para seu limite de itens vestidos). Ao ser ativada, uma engenhoca pode assumir outra forma. Por exemplo, uma engenhoca que simula Montaria Arcana pode ser uma caixinha de engrenagens que se desdobra na forma de uma moto de madeira. Suas estatísticas não mudam.</p>
            <div style="background: rgba(37,99,235,0.1); border-left: 3px solid #3b82f6; padding: 10px 14px; border-radius: 4px;">
              <strong style="color:#93c5fd;">Fabricação:</strong> Para fabricar uma engenhoca, escolha uma magia arcana ou divina de 1º círculo. Essa será a magia que a engenhoca irá simular. A partir do 6º nível, você pode criar engenhocas com magias de 2º círculo e, a cada quatro níveis, pode criar engenhocas de um círculo maior. O custo de fabricação da engenhoca é <strong>T$ 100 &times; custo em PM da magia</strong> que ela simula e a CD do teste é <strong>20 + custo em PM da magia</strong>. Assim, para fabricar uma engenhoca que simula o efeito de uma magia de 2º círculo (3 PM) você precisa gastar T$ 300 e passar em um teste de Ofício (engenhoqueiro) contra CD 23. O tempo de fabricação é uma semana.
            </div>
            <p><strong>Limite de Engenhocas:</strong> Engenhocas são itens complexos e delicados, que exigem manutenção constante. O máximo de engenhocas que você pode ter ao mesmo tempo é igual a sua <strong>Inteligência</strong>.</p>
            <div style="background: rgba(234,179,8,0.1); border-left: 3px solid #eab308; padding: 10px 14px; border-radius: 4px;">
              <strong style="color:#fef08a;">Ativação:</strong> Apenas o fabricante de uma engenhoca pode ativá-la. Ativar uma engenhoca exige uma ação padrão (ou a execução da magia, o que for maior) e um teste de <strong>Ofício (engenhoqueiro) contra CD 15 + custo em PM da magia</strong>. Se você passar, a engenhoca gera o efeito da magia (atributo-chave Int). Se falhar, ela enguiça e não pode ser utilizada até ser consertada, o que exige uma hora de trabalho. Cada nova ativação da engenhoca no mesmo dia aumenta a CD do teste de Ofício em +5.<br><br>
              Quando ativa uma engenhoca, você pode usar quaisquer aprimoramentos da magia que ela simula, até um custo igual a sua Inteligência. A CD para ativar a engenhoca aumenta em +1 por PM e você paga o custo em PM dos aprimoramentos.<br><br>
              Se a engenhoca simula o efeito de uma magia com custo especial, esse custo deve ser pago a cada ativação. Para outros custos e limitações, o efeito gerado pela engenhoca funciona como uma magia. Por exemplo, para manter um efeito com duração sustentada gerado por uma engenhoca, o inventor deve pagar 1 PM no início de cada um de seus turnos. Da mesma forma, só pode manter um efeito sustentado de engenhoca por vez. Se a magia simulada exigir um teste de Misticismo, use Ofício (engenhoqueiro) em seu lugar.
            </div>
            <p><strong>Efeito Mundano:</strong> O efeito de uma engenhoca não é mágico. Isso significa que ele não pode ser dissipado, funciona em áreas de antimagia etc.</p>
            <p><strong>Penalidade de Armadura:</strong> A ativação de uma engenhoca exige movimentos rápidos e precisos. Por isso, o teste de Ofício (engenhoqueiro) para ativar engenhocas sofre penalidade de armadura. Porém, você pode ativar engenhocas que geram magias arcanas enquanto usa armadura sem precisar fazer testes de Misticismo.</p>
            <p><strong>Efeitos que Impedem Conjuração:</strong> Um efeito que especificamente impeça um personagem de lançar magias (como a Fúria de um bárbaro ou a magia Transformação de Guerra) também impede um inventor de ativar engenhocas.</p>
          </div>
          <footer class="modal-footer" style="padding: 12px 18px; border-top: 1px solid var(--border-subtle, #333); display: flex; justify-content: flex-end; background: var(--bg-header, #181a1c);">
            <button class="button primary close-engenhocas-rules-btn" type="button">Entendido</button>
          </footer>
        </div>
      `;
      document.body.appendChild(modal);
      modal.querySelectorAll('.close-engenhocas-rules-btn').forEach(btn => {
        btn.addEventListener('click', () => { modal.hidden = true; });
      });
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.hidden = true;
      });
    }
    return modal;
  }

  function ensureEngenhocaCraftModal() {
    const modal = document.getElementById('engenhoca-craft-modal');
    if (modal) modal.remove();
    return null;
  }

  function ensureSelectCraftOfficeModal() {
    let modal = document.getElementById('select-craft-office-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'select-craft-office-modal';
      modal.className = 'modal-backdrop';
      modal.hidden = true;
      modal.style.cssText = 'position:fixed;inset:0;background:rgba(4,7,14,0.85);backdrop-filter:blur(6px);z-index:100005;display:none;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;';
      modal.innerHTML = `
        <div class="modal-dialog select-craft-office-dialog" role="dialog" aria-modal="true" aria-labelledby="select-craft-office-title" style="max-width: 440px; width: 92vw; background: #0e131b; border: 1px solid #28364b; border-radius: 10px; box-shadow: 0 16px 40px rgba(0,0,0,0.85); color: #e2e8f0; overflow: hidden; display: flex; flex-direction: column;">
          <header class="modal-header" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; border-bottom: 1px solid #1e2837; background: #131a26;">
            <h4 id="select-craft-office-title" style="margin: 0; font-size: 1.05rem; font-weight: 700; color: #d4af37; font-family: Cinzel, serif;">Escolher Ofício para Item Base</h4>
            <button class="button icon-only close-select-office-btn" type="button" aria-label="Fechar" style="background: none; border: none; font-size: 1.3rem; cursor: pointer; color: #94a3b8;">&times;</button>
          </header>
          <div id="select-craft-office-body" style="padding: 16px 18px; display: flex; flex-direction: column; gap: 10px;"></div>
        </div>
      `;
      document.body.appendChild(modal);
      const close = (e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        modal.hidden = true;
        modal.style.display = 'none';
      };
      modal.querySelectorAll('.close-select-office-btn').forEach(btn => btn.addEventListener('click', close));
      modal.addEventListener('click', (e) => {
        if (e.target === modal) close(e);
      });
    }
    return modal;
  }

  function openSelectCraftOfficeModal(offices, onSelect) {
    const modal = ensureSelectCraftOfficeModal();
    const body = modal.querySelector('#select-craft-office-body');
    if (!body) return;

    body.innerHTML = `
      <p style="margin: 0 0 4px 0; font-size: 0.8rem; color: #94a3b8; line-height: 1.4;">
        Selecione o ofício de manufatura correspondente ao item onde a engenhoca será forjada ou acoplada:
      </p>
      <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 4px;">
        ${offices.map(off => `
          <button type="button" class="btn-select-office-option" data-office-key="${off.key}" style="background: #141c28; border: 1px solid #28364b; color: #f8fafc; padding: 10px 14px; border-radius: 6px; cursor: pointer; text-align: left; display: flex; align-items: center; justify-content: space-between; transition: all 0.15s ease;" onmouseover="this.style.background='#1e2a3c';this.style.borderColor='#3b82f6';" onmouseout="this.style.background='#141c28';this.style.borderColor='#28364b';">
            <div>
              <span style="font-size: 0.92rem; color: #f8fafc;"><strong style="color: #93c5fd; font-family: Cinzel, serif;">${escapeHtml(off.nome)}</strong> <span style="color: #94a3b8; font-size: 0.82rem;">(${escapeHtml(off.desc)})</span></span>
            </div>
            <span style="font-size: 0.95rem; color: #60a5fa; font-weight: 700;">&rarr;</span>
          </button>
        `).join('')}
      </div>
    `;

    body.querySelectorAll('.btn-select-office-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const key = btn.getAttribute('data-office-key');
        modal.hidden = true;
        modal.style.display = 'none';
        if (key && typeof onSelect === 'function') {
          onSelect(key);
        }
      });
    });

    modal.hidden = false;
    modal.style.display = 'flex';
  }


  function consumeItemFromBackpack(instanceIdOrItemId) {
    // @ts-ignore
    const saved = typeof arsenalState === 'function' ? arsenalState() : null;
    if (!saved) return;
    let profiles;
    // @ts-ignore
    try { profiles = JSON.parse(saved.storage[ARSENAL_PROFILES_KEY] || '{}'); } catch { profiles = {}; }
    let profile = profiles.profiles?.find(item => item.id === 'ficha-ativa') || profiles.profiles?.find(item => item.id === profiles.activeId);
    if (profile && Array.isArray(profile.backpack)) {
      const idx = profile.backpack.findIndex(e => e.instanceId === instanceIdOrItemId || e.itemId === instanceIdOrItemId);
      if (idx >= 0) {
        if ((profile.backpack[idx].quantity || 1) > 1) {
          profile.backpack[idx].quantity -= 1;
        } else {
          profile.backpack.splice(idx, 1);
        }
        // @ts-ignore
        saved.storage[ARSENAL_PROFILES_KEY] = JSON.stringify(profiles);
        // @ts-ignore
        if (typeof persistNow === 'function') persistNow();
        // @ts-ignore
        else if (typeof persist === 'function') persist();
      }
    }
  }

  function addCraftedItemToHeroBackpack(itemId, quantity = 1, options = {}, customItemObj = null) {
    const instanceId = 'crafted_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const name = customItemObj?.nome || customItemObj?.displayName || itemId;
    const newEntry = {
      instanceId: instanceId,
      itemId: itemId,
      itemName: name,
      displayName: name,
      quantity: quantity,
      origin: 'manufatura',
      options: options.options || {},
      improvements: options.improvements || customItemObj?.improvements || [],
      enchantments: options.enchantments || customItemObj?.enchantments || []
    };
    if (customItemObj) {
      if (customItemObj.engenhocaInfo) newEntry.engenhocaInfo = customItemObj.engenhocaInfo;
      if (customItemObj.pocaoInfo) newEntry.pocaoInfo = customItemObj.pocaoInfo;
      if (customItemObj.pergaminhoInfo) newEntry.pergaminhoInfo = customItemObj.pergaminhoInfo;
      if (customItemObj.tatuagemInfo) newEntry.tatuagemInfo = customItemObj.tatuagemInfo;
    }

    if (customItemObj) {
      // @ts-ignore
      state.customItems = state.customItems || [];
      // @ts-ignore
      if (!state.customItems.some(ci => ci.id === customItemObj.id)) {
        // @ts-ignore
        state.customItems.push(customItemObj);
      }
      // @ts-ignore
      if (typeof catalog !== 'undefined' && typeof catalog.set === 'function') {
        catalog.set(customItemObj.id, customItemObj);
      }
    }

    try {
      const profKey = typeof ARSENAL_PROFILES_KEY !== 'undefined' ? ARSENAL_PROFILES_KEY : 'arsenal-arton-character-profiles-v1';
      // @ts-ignore
      const saved = typeof arsenalState === 'function' ? arsenalState() : null;
      let profiles = null;
      if (saved?.storage?.[profKey]) {
        try { profiles = JSON.parse(saved.storage[profKey]); } catch {}
      }
      if (!profiles) {
        try { profiles = JSON.parse(localStorage.getItem(profKey) || '{}'); } catch {}
      }
      if (profiles && Array.isArray(profiles.profiles)) {
        let activeP = profiles.profiles.find(p => p.id === 'ficha-ativa') || profiles.profiles.find(p => p.id === profiles.activeId) || profiles.profiles[0];
        if (activeP) {
          if (!Array.isArray(activeP.backpack)) activeP.backpack = [];
          activeP.backpack.push({ ...newEntry });
          if (saved && saved.storage) {
            saved.storage[profKey] = JSON.stringify(profiles);
          }
          localStorage.setItem(profKey, JSON.stringify(profiles));
        }
      }
    } catch (err) {
      console.error('Erro ao adicionar item fabricado ao Arsenal:', err);
    }

    // @ts-ignore
    if (Array.isArray(state.backpack)) {
      // @ts-ignore
      state.backpack.push({ ...newEntry });
    }

    return instanceId;
  }
  const addCraftedItemToBackpack = addCraftedItemToHeroBackpack;

  function openEngenhocaCraftModal(spellId, initialAttachedItem = null) {
    if (initialAttachedItem) {
      try {
        sessionStorage.setItem('forja_attached_item', JSON.stringify(initialAttachedItem));
      } catch {}
    }
    const targetUrl = spellId ? ('engenhoca.html?magia=' + encodeURIComponent(spellId)) : 'engenhoca.html';
    window.location.href = targetUrl;
  }

  // Suporte a Peças Sobressalentes na fabricação de engenhocas:
  // Se o personagem possuir 'pecas_sobressalentes' na mochila, abate até T$ 100 do custo:
  // const custoComDesconto = Math.max(0, custoFinalTeste - 100);
  // e consome o item com consumeItemFromBackpack('pecas_sobressalentes');
  function aplicarBeneficioPecasSobressalentes(custoFinalTeste, hasPecas) {
    if (hasPecas || (typeof hasItemInBackpack === 'function' && hasItemInBackpack('pecas_sobressalentes'))) {
      if (typeof consumeItemFromBackpack === 'function') consumeItemFromBackpack('pecas_sobressalentes');
      return Math.max(0, custoFinalTeste - 100);
    }
    return custoFinalTeste;
  }

  function openPotionCraftModal(spellId) {
    // @ts-ignore
    const spells = (typeof DATA !== 'undefined' && DATA.spells) || [];
    // @ts-ignore
    const spell = spells.find(s => s.id === spellId || s.key === spellId) || (typeof spellById === 'function' ? spellById(spellId) : null);
    if (!spell) {
      // @ts-ignore
      if (typeof toast === 'function') toast('Magia selecionada não encontrada.');
      return;
    }

    // @ts-ignore
    const knownSpells = typeof allLearnedSpellIds === 'function' ? allLearnedSpellIds() : [];
    const isKnown = knownSpells.includes(spell.id) || (typeof knowsCharacterSpell === 'function' && knowsCharacterSpell(spell.id));
    if (!isKnown) {
      // @ts-ignore
      if (typeof toast === 'function') toast('Você só pode preparar poções de magias que você conhece.');
      return;
    }

    const circulo = Number(spell.circulo || spell.circle || 1);
    const pm = circulo === 1 ? 1 : (circulo === 2 ? 3 : (circulo === 3 ? 6 : (circulo === 4 ? 10 : 15)));

    // @ts-ignore
    const lvl = typeof effectiveCharacterLevel === 'function' ? effectiveCharacterLevel() : ((state.progression?.length || 0) + 1);
    // @ts-ignore
    const powers = state.powers || (typeof characterPowers === 'function' ? characterPowers() : []);
    const isDrogadora = Boolean(
      powers.some(p => /drogadora/i.test(p.nome || p.name || p.id || '')) ||
      (typeof hasPower === 'function' && hasPower('aprendiz_de_drogadora')) ||
      // @ts-ignore
      state.isDrogadora
    );

    // @ts-ignore
    const rules = typeof RegrasManufatura !== 'undefined' ? RegrasManufatura : null;
    const potionRules = rules && typeof rules.regrasPocaoPergaminho === 'function'
      ? rules.regrasPocaoPergaminho(circulo, { fracao: isDrogadora ? '1/4' : '1/3' })
      : { precoBase: 30 * pm * pm, custoMateriaPrima: isDrogadora ? Math.ceil((30 * pm * pm) / 4) : Math.ceil((30 * pm * pm) / 3), cdFabricacao: 20 + pm };

    const precoMercado = potionRules.precoBase;
    const custoMateriaPrima = potionRules.custoMateriaPrima;
    const cdFab = potionRules.cdFabricacao;

    // Perícia Ofício (Alquimia)
    // @ts-ignore
    const trainedList = typeof allTrainedOffices === 'function' ? allTrainedOffices() : [];
    const isTrained = trainedList.some(o => /alquim/i.test(o)) || (typeof allTrainedSkills === 'function' && allTrainedSkills().includes('oficio'));
    const halfLevel = Math.floor(lvl / 2);
    // @ts-ignore
    const attrs = typeof finalAttrs === 'function' ? finalAttrs() : { int: 0 };
    const intMod = Number(attrs.int) || 0;
    const trainBonus = isTrained ? (lvl >= 15 ? 6 : (lvl >= 7 ? 4 : 2)) : 0;
    const craftBonus = halfLevel + intMod + trainBonus;

    const spellNome = spell.nome || spell.name;
    const alvo = (spell.alvo || spell.target || '').toLowerCase();
    const area = (spell.area || '').toLowerCase();
    const finalName = `Poção de ${spellNome}`;

    if (typeof window.abrirModalTesteOficio === 'function') {
      window.abrirModalTesteOficio({
        titulo: `Fabricar Poção · ${finalName}`,
        subtitulo: `Ofício (alquimia) · ${circulo}º Círculo (${pm} PM)` + (isDrogadora ? ' (Aprendiz de Drogadora: MP ¼)' : ''),
        oficioNome: 'Ofício (alquimia)',
        cd: cdFab,
        custoMateriaPrima: custoMateriaPrima,
        bonusOficio: craftBonus,
        isExisting: false,
        onConfirm: (resultado) => {
          const customId = 'potion_' + spell.id + '_' + Date.now();
          const custoFinalTeste = resultado.custoDebitar != null ? resultado.custoDebitar : custoMateriaPrima;

          if (resultado.sucesso) {
            const potionItem = {
              id: customId,
              nome: finalName,
              displayName: finalName,
              tipo: 'item_alquimico',
              categoriaId: 'alquimico_preparado',
              espacos: 0.5,
              preco: { valor: precoMercado, moeda: 'T$' },
              descricao: `Líquido mágico armazenado em frasco que reproduz o efeito da magia ${spellNome} (${circulo}º Círculo, ${pm} PM). Ação padrão para ingerir ou aplicar.`,
              pocaoInfo: {
                spellId: spell.id,
                spellName: spellNome,
                circulo,
                pm
              }
            };

            if (resultado.destinatario === 'aliado') {
              const moduloMesa = typeof CampanhaMesa !== 'undefined' ? CampanhaMesa : (typeof window !== 'undefined' ? window.CampanhaMesa : null);
              if (resultado.aliadoId && moduloMesa && typeof moduloMesa.adicionarItemHeroiMesa === 'function') {
                moduloMesa.adicionarItemHeroiMesa(resultado.aliadoId, potionItem);
                // @ts-ignore
                if (typeof toast === 'function') toast(`Poção "${finalName}" fabricada e transferida para a mochila de ${resultado.aliadoNome || 'seu aliado'}!`);
              } else {
                addCraftedItemToHeroBackpack(customId, 1, {}, potionItem);
                // @ts-ignore
                if (typeof toast === 'function') toast(`Poção "${finalName}" forjada com sucesso para o aliado.`);
              }
            } else {
              addCraftedItemToHeroBackpack(customId, 1, {}, potionItem);
              // @ts-ignore
              if (typeof toast === 'function') toast(`Poção "${finalName}" fabricada com sucesso e adicionada à sua mochila!`);
            }

            // @ts-ignore
            financesState().spent = Math.round(((financesState().spent || 0) + custoFinalTeste) * 100) / 100;
            // @ts-ignore
            if (custoFinalTeste > 0 && typeof window.registrarDespesaAventura === 'function') window.registrarDespesaAventura(custoFinalTeste);
          } else {
            // @ts-ignore
            financesState().spent = Math.round(((financesState().spent || 0) + custoFinalTeste) * 100) / 100;
            // @ts-ignore
            if (custoFinalTeste > 0 && typeof window.registrarDespesaAventura === 'function') window.registrarDespesaAventura(custoFinalTeste);
            // @ts-ignore
            if (typeof toast === 'function') toast(resultado.falhaLeve ? `A fabricação da poção falhou por menos de 5. T$ ${custoFinalTeste} de ingredientes foram consumidos.` : `Falha crítica na alquimia: ingredientes arruinados (T$ ${custoFinalTeste} perdidos).`);
          }

          // @ts-ignore
          state.sheetView = 'workshop';
          // @ts-ignore
          state.workshopSection = 'alquimista';
          // @ts-ignore
          persistNow();
          // @ts-ignore
          if (state.finished && typeof saveFinishedCharacter === 'function') saveFinishedCharacter();
          // @ts-ignore
          if (typeof renderStage === 'function') renderStage();
          if (typeof window.liberarTravamentoScroll === 'function') window.liberarTravamentoScroll();
        }
      });
    }
  }

  function openScrollCraftModal(spellId) {
    // @ts-ignore
    const spells = (typeof DATA !== 'undefined' && DATA.spells) || [];
    // @ts-ignore
    const spell = spells.find(s => s.id === spellId || s.key === spellId) || (typeof spellById === 'function' ? spellById(spellId) : null);
    if (!spell) {
      // @ts-ignore
      if (typeof toast === 'function') toast('Magia selecionada não encontrada.');
      return;
    }

    // @ts-ignore
    const knownSpells = typeof allLearnedSpellIds === 'function' ? allLearnedSpellIds() : [];
    const isKnown = knownSpells.includes(spell.id) || (typeof knowsCharacterSpell === 'function' && knowsCharacterSpell(spell.id));
    if (!isKnown) {
      // @ts-ignore
      if (typeof toast === 'function') toast('Você só pode escrever pergaminhos de magias que você conhece.');
      return;
    }

    const circulo = Number(spell.circulo || spell.circle || 1);
    const pm = circulo === 1 ? 1 : (circulo === 2 ? 3 : (circulo === 3 ? 6 : (circulo === 4 ? 10 : 15)));

    // @ts-ignore
    const rules = typeof RegrasManufatura !== 'undefined' ? RegrasManufatura : null;
    const scrollRules = rules && typeof rules.regrasPocaoPergaminho === 'function'
      ? rules.regrasPocaoPergaminho(circulo, { fracao: '1/3' })
      : { precoBase: 30 * pm * pm, custoMateriaPrima: Math.ceil((30 * pm * pm) / 3), cdFabricacao: 20 + pm };

    const precoMercado = scrollRules.precoBase;
    const custoMateriaPrima = scrollRules.custoMateriaPrima;
    const cdFab = scrollRules.cdFabricacao;

    // @ts-ignore
    const lvl = typeof effectiveCharacterLevel === 'function' ? effectiveCharacterLevel() : ((state.progression?.length || 0) + 1);
    // @ts-ignore
    const trainedList = typeof allTrainedOffices === 'function' ? allTrainedOffices() : [];
    const isTrained = trainedList.some(o => /escriba/i.test(o)) || (typeof allTrainedSkills === 'function' && allTrainedSkills().includes('oficio'));
    const halfLevel = Math.floor(lvl / 2);
    // @ts-ignore
    const attrs = typeof finalAttrs === 'function' ? finalAttrs() : { int: 0 };
    const intMod = Number(attrs.int) || 0;
    const trainBonus = isTrained ? (lvl >= 15 ? 6 : (lvl >= 7 ? 4 : 2)) : 0;
    const craftBonus = halfLevel + intMod + trainBonus;

    const spellNome = spell.nome || spell.name;
    const finalName = `Pergaminho de ${spellNome}`;

    if (typeof window.abrirModalTesteOficio === 'function') {
      window.abrirModalTesteOficio({
        titulo: `Fabricar Pergaminho · ${finalName}`,
        subtitulo: `Ofício (escriba) · ${circulo}º Círculo (${pm} PM)`,
        oficioNome: 'Ofício (escriba)',
        cd: cdFab,
        custoMateriaPrima: custoMateriaPrima,
        bonusOficio: craftBonus,
        isExisting: false,
        onConfirm: (resultado) => {
          const customId = 'scroll_' + spell.id + '_' + Date.now();
          const custoFinalTeste = resultado.custoDebitar != null ? resultado.custoDebitar : custoMateriaPrima;

          if (resultado.sucesso) {
            const scrollItem = {
              id: customId,
              nome: finalName,
              displayName: finalName,
              tipo: 'item_geral',
              categoriaId: 'esoterico',
              espacos: 0.5,
              preco: { valor: precoMercado, moeda: 'T$' },
              descricao: `Folha mágica de papiro contendo as palavras de poder da magia ${spellNome} (${circulo}º Círculo, ${pm} PM). Pronunciar suas palavras consome uma ação padrão e libera a magia.`,
              pergaminhoInfo: {
                spellId: spell.id,
                spellName: spellNome,
                circulo,
                pm
              }
            };

            if (resultado.destinatario === 'aliado') {
              const moduloMesa = typeof CampanhaMesa !== 'undefined' ? CampanhaMesa : (typeof window !== 'undefined' ? window.CampanhaMesa : null);
              if (resultado.aliadoId && moduloMesa && typeof moduloMesa.adicionarItemHeroiMesa === 'function') {
                moduloMesa.adicionarItemHeroiMesa(resultado.aliadoId, scrollItem);
                // @ts-ignore
                if (typeof toast === 'function') toast(`Pergaminho "${finalName}" transferido para ${resultado.aliadoNome || 'o aliado'}!`);
              } else {
                addCraftedItemToHeroBackpack(customId, 1, {}, scrollItem);
                // @ts-ignore
                if (typeof toast === 'function') toast(`Pergaminho "${finalName}" forjado para o aliado.`);
              }
            } else {
              addCraftedItemToHeroBackpack(customId, 1, {}, scrollItem);
              // @ts-ignore
              if (typeof toast === 'function') toast(`Pergaminho "${finalName}" fabricado com sucesso e adicionado à mochila!`);
            }

            // @ts-ignore
            financesState().spent = Math.round(((financesState().spent || 0) + custoFinalTeste) * 100) / 100;
            // @ts-ignore
            if (custoFinalTeste > 0 && typeof window.registrarDespesaAventura === 'function') window.registrarDespesaAventura(custoFinalTeste);
          } else {
            // @ts-ignore
            financesState().spent = Math.round(((financesState().spent || 0) + custoFinalTeste) * 100) / 100;
            // @ts-ignore
            if (custoFinalTeste > 0 && typeof window.registrarDespesaAventura === 'function') window.registrarDespesaAventura(custoFinalTeste);
            // @ts-ignore
            if (typeof toast === 'function') toast(resultado.falhaLeve ? `A escrita do pergaminho falhou por menos de 5. T$ ${custoFinalTeste} foram consumidos.` : `Falha crítica na escrita: papiro e tintas arruinados (T$ ${custoFinalTeste} perdidos).`);
          }

          // @ts-ignore
          state.sheetView = 'workshop';
          // @ts-ignore
          state.workshopSection = 'escriba';
          // @ts-ignore
          persistNow();
          // @ts-ignore
          if (state.finished && typeof saveFinishedCharacter === 'function') saveFinishedCharacter();
          // @ts-ignore
          if (typeof renderStage === 'function') renderStage();
          if (typeof window.liberarTravamentoScroll === 'function') window.liberarTravamentoScroll();
        }
      });
    }
  }

  function openTattooCraftModal(spellId) {
    // @ts-ignore
    const spells = (typeof DATA !== 'undefined' && DATA.spells) || [];
    // @ts-ignore
    const spell = spells.find(s => s.id === spellId || s.key === spellId) || (typeof spellById === 'function' ? spellById(spellId) : null);
    if (!spell) {
      // @ts-ignore
      if (typeof toast === 'function') toast('Magia selecionada não encontrada.');
      return;
    }

    const circulo = 1;
    const cdFab = 20;
    const custoMateriaPrima = 100;

    // @ts-ignore
    const lvl = typeof effectiveCharacterLevel === 'function' ? effectiveCharacterLevel() : ((state.progression?.length || 0) + 1);
    // @ts-ignore
    const trainedList = typeof allTrainedOffices === 'function' ? allTrainedOffices() : [];
    const isTrained = trainedList.some(o => /tatuad/i.test(o)) || (typeof allTrainedSkills === 'function' && allTrainedSkills().includes('oficio'));
    const halfLevel = Math.floor(lvl / 2);
    // @ts-ignore
    const attrs = typeof finalAttrs === 'function' ? finalAttrs() : { des: 0 };
    const desMod = Number(attrs.des) || 0;
    const trainBonus = isTrained ? (lvl >= 15 ? 6 : (lvl >= 7 ? 4 : 2)) : 0;
    const craftBonus = halfLevel + desMod + trainBonus;

    const spellNome = spell.nome || spell.name;
    const finalName = `Tatuagem Mística (${spellNome})`;

    if (typeof window.abrirModalTesteOficio === 'function') {
      window.abrirModalTesteOficio({
        titulo: `Gravar Tatuagem · ${finalName}`,
        subtitulo: `Ofício (tatuador) · 1º Círculo Arcana`,
        oficioNome: 'Ofício (tatuador)',
        cd: cdFab,
        custoMateriaPrima: custoMateriaPrima,
        bonusOficio: craftBonus,
        isExisting: false,
        onConfirm: (resultado) => {
          const customId = 'tattoo_' + spell.id + '_' + Date.now();
          const custoFinalTeste = resultado.custoDebitar != null ? resultado.custoDebitar : custoMateriaPrima;

          if (resultado.sucesso) {
            const tattooItem = {
              id: customId,
              nome: finalName,
              displayName: finalName,
              tipo: 'vestuario',
              categoriaId: 'vestuario',
              espacos: 0,
              preco: { valor: 300, moeda: 'T$' },
              descricao: `Arte corporal mística aplicada com pigmentos especiais que concede ao portador a magia arcana ${spellNome} (1º Círculo).`,
              tatuagemInfo: {
                spellId: spell.id,
                spellName: spellNome,
                circulo: 1
              }
            };

            if (resultado.destinatario === 'aliado') {
              const moduloMesa = typeof CampanhaMesa !== 'undefined' ? CampanhaMesa : (typeof window !== 'undefined' ? window.CampanhaMesa : null);
              if (resultado.aliadoId && moduloMesa && typeof moduloMesa.adicionarItemHeroiMesa === 'function') {
                moduloMesa.adicionarItemHeroiMesa(resultado.aliadoId, tattooItem);
                // @ts-ignore
                if (typeof toast === 'function') toast(`Tatuagem mística gravada com sucesso em ${resultado.aliadoNome || 'seu aliado'}!`);
              } else {
                addCraftedItemToHeroBackpack(customId, 1, {}, tattooItem);
                // @ts-ignore
                if (typeof toast === 'function') toast(`Tatuagem gravada com sucesso para o aliado.`);
              }
            } else {
              addCraftedItemToHeroBackpack(customId, 1, {}, tattooItem);
              // @ts-ignore
              if (typeof toast === 'function') toast(`Tatuagem mística de "${spellNome}" gravada com sucesso no seu corpo!`);
            }

            // @ts-ignore
            financesState().spent = Math.round(((financesState().spent || 0) + custoFinalTeste) * 100) / 100;
            // @ts-ignore
            if (custoFinalTeste > 0 && typeof window.registrarDespesaAventura === 'function') window.registrarDespesaAventura(custoFinalTeste);
          } else {
            // @ts-ignore
            financesState().spent = Math.round(((financesState().spent || 0) + custoFinalTeste) * 100) / 100;
            // @ts-ignore
            if (custoFinalTeste > 0 && typeof window.registrarDespesaAventura === 'function') window.registrarDespesaAventura(custoFinalTeste);
            // @ts-ignore
            if (typeof toast === 'function') toast(resultado.falhaLeve ? `A aplicação dos pigmentos falhou por menos de 5. T$ ${custoFinalTeste} de pigmentos foram consumidos.` : `Falha crítica na tatuagem: pigmentos arruinados (T$ ${custoFinalTeste} perdidos).`);
          }

          // @ts-ignore
          state.sheetView = 'workshop';
          // @ts-ignore
          state.workshopSection = 'tatuador';
          // @ts-ignore
          persistNow();
          // @ts-ignore
          if (state.finished && typeof saveFinishedCharacter === 'function') saveFinishedCharacter();
          // @ts-ignore
          if (typeof renderStage === 'function') renderStage();
          if (typeof window.liberarTravamentoScroll === 'function') window.liberarTravamentoScroll();
        }
      });
    }
  }

  document.addEventListener('click', (event) => {
    // @ts-ignore
    if (event.target.closest?.('[data-action="open-engenhocas-rules"]')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const m = ensureEngenhocasRulesModal();
      if (m) m.hidden = false;
    }
  }, true);

  // @ts-ignore
  window.ensureWorkshopModal = ensureWorkshopModal;
  // @ts-ignore
  window.ensureEngenhocasRulesModal = ensureEngenhocasRulesModal;
  // @ts-ignore
  window.ensureEngenhocaCraftModal = ensureEngenhocaCraftModal;
  // @ts-ignore
  window.ensureSelectCraftOfficeModal = ensureSelectCraftOfficeModal;
  // @ts-ignore
  window.openSelectCraftOfficeModal = openSelectCraftOfficeModal;
  // @ts-ignore
  window.openEngenhocaCraftModal = openEngenhocaCraftModal;
  // @ts-ignore
  window.openPotionCraftModal = openPotionCraftModal;
  // @ts-ignore
  window.openScrollCraftModal = openScrollCraftModal;
  // @ts-ignore
  window.openTattooCraftModal = openTattooCraftModal;
  // @ts-ignore
  window.addCraftedItemToBackpack = addCraftedItemToHeroBackpack;
})();

