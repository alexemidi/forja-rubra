// @ts-check

/**
 * Modal Universal de Teste e CD de Ofício para Tormenta20 (Forja do Herói).
 * Padroniza o teste de criação para todas as oficinas (Engenhoqueiro, Armeiro,
 * Alquimista, Tatuador, Escriba, etc.) e aprimoramentos de itens da mochila.
 * Apresenta design sóbrio (Dark Fantasy), sem elementos infantis ou caixas verdes berrantes.
 */

(function () {
  /**
   * Garante a liberação imediata de qualquer bloqueio de scroll no body da página.
   */
  function liberarTravamentoScroll() {
    try {
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open', 'overflow-hidden');
      document.querySelectorAll('.modal-backdrop, .app-modal').forEach(el => {
        const htmlEl = /** @type {HTMLElement} */ (el);
        if (htmlEl.hidden) {
          htmlEl.style.display = 'none';
        }
      });
    } catch {
      // noop
    }
  }

  /**
   * Injeta estilos temáticos da Forja no documento se ainda não existirem.
   */
  function ensureForgeThemeStyles() {
    if (document.getElementById('forge-buttons-theme-style')) return;
    const style = document.createElement('style');
    style.id = 'forge-buttons-theme-style';
    style.textContent = `
      .forge-theme-btn {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 7px 14px;
        font-family: inherit;
        font-size: 0.82rem;
        font-weight: 600;
        letter-spacing: 0.3px;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        text-decoration: none;
        user-select: none;
        box-sizing: border-box;
      }
      .forge-theme-btn:disabled {
        opacity: 0.45 !important;
        cursor: not-allowed !important;
        filter: grayscale(0.8) !important;
        box-shadow: none !important;
      }
      /* Bigorna / Ferro Batido */
      .forge-theme-btn.iron {
        background: linear-gradient(145deg, #222936, #141a24);
        border: 1px solid #374760;
        color: #e2e8f0;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
      }
      .forge-theme-btn.iron:not(:disabled):hover {
        background: linear-gradient(145deg, #2c3647, #19212e);
        border-color: #64748b;
        color: #ffffff;
      }
      /* Brasa / Forja Quente */
      .forge-theme-btn.ember {
        background: linear-gradient(135deg, #8f121d, #5a0a11);
        border: 1px solid #b91c1c;
        color: #fef2f2;
        box-shadow: 0 2px 8px rgba(185, 28, 28, 0.25);
      }
      .forge-theme-btn.ember:not(:disabled):hover {
        background: linear-gradient(135deg, #a81926, #6b0c14);
        border-color: #ef4444;
        box-shadow: 0 3px 12px rgba(239, 68, 68, 0.35);
      }
      /* Ouro / Rúnico / Cinzel */
      .forge-theme-btn.gold {
        background: linear-gradient(145deg, #2a2215, #1c150c);
        border: 1px solid #856123;
        color: #fef08a;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
      }
      .forge-theme-btn.gold:not(:disabled):hover {
        background: linear-gradient(145deg, #382d1b, #261c0f);
        border-color: #d4af37;
        color: #fffbeb;
      }
      /* Engrenagem / Artífice */
      .forge-theme-btn.gear {
        background: linear-gradient(145deg, #1e293b, #0f172a);
        border: 1px solid #475569;
        color: #cbd5e1;
      }
      .forge-theme-btn.gear.active {
        background: linear-gradient(145deg, #3d2f13, #261d0a);
        border-color: #eab308;
        color: #fef08a;
        box-shadow: 0 0 10px rgba(234, 179, 8, 0.3);
      }
      .forge-theme-btn.gear:not(:disabled):hover {
        border-color: #94a3b8;
        color: #f8fafc;
      }
      /* Botão Cancelar Sóbrio */
      .forge-theme-btn.cancel {
        background: #151a24;
        border: 1px solid #283347;
        color: #94a3b8;
      }
      .forge-theme-btn.cancel:hover {
        background: #1d2533;
        border-color: #475569;
        color: #e2e8f0;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Garante o container do modal no DOM.
   * @returns {HTMLElement}
   */
  function ensureTesteOficioModal() {
    ensureForgeThemeStyles();
    let modal = document.getElementById('teste-oficio-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'teste-oficio-modal';
      modal.className = 'modal-backdrop';
      modal.hidden = true;
      modal.style.display = 'none';
      modal.style.position = 'fixed';
      modal.style.inset = '0';
      modal.style.zIndex = '9999';
      modal.style.backgroundColor = 'rgba(0, 0, 0, 0.78)';
      modal.style.backdropFilter = 'blur(5px)';
      modal.style.alignItems = 'center';
      modal.style.justifyContent = 'center';
      modal.style.padding = '16px';
      modal.style.boxSizing = 'border-box';

      modal.innerHTML = `
        <div class="modal-dialog teste-oficio-dialog" role="dialog" aria-modal="true" aria-labelledby="teste-oficio-modal-title" style="max-width: 540px; width: 100%; max-height: 90vh; display: flex; flex-direction: column; background: #0c1118; border: 1px solid #222d3e; border-radius: 10px; box-shadow: 0 16px 40px rgba(0, 0, 0, 0.85); color: #e2e8f0; overflow: hidden;">
          <header style="display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; border-bottom: 1px solid #1a2332; background: #111722;">
            <div>
              <h3 id="teste-oficio-modal-title" style="margin: 0; font-size: 1.15rem; font-weight: 600; color: #d4af37; font-family: Cinzel, serif;">Teste de Fabricação</h3>
              <span id="teste-oficio-modal-subtitle" style="font-size: 0.78rem; color: #94a3b8;">Ofício do Artífice</span>
            </div>
            <button class="close-teste-oficio-btn" type="button" aria-label="Fechar" style="background: transparent; border: none; font-size: 1.35rem; cursor: pointer; color: #94a3b8; line-height: 1;">&times;</button>
          </header>

          <div id="teste-oficio-modal-body" style="padding: 18px 20px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 14px;"></div>

          <footer id="teste-oficio-modal-footer" style="padding: 12px 20px; border-top: 1px solid #1a2332; display: flex; justify-content: flex-end; gap: 10px; background: #111722;"></footer>
        </div>
      `;

      document.body.appendChild(modal);

      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.hidden = true;
          modal.style.display = 'none';
          liberarTravamentoScroll();
        }
      });
    }
    return modal;
  }

  /**
   * Abre a tela padronizada de Teste e CD de Criação de Ofício.
   * @param {Object} opts
   * @param {string} opts.titulo Nome do item ou ação
   * @param {string} [opts.subtitulo] Subtítulo descritivo
   * @param {string} opts.oficioNome Nome do ofício (ex: "Ofício (engenhoqueiro)", "Ofício (armeiro)")
   * @param {number} opts.cd CD de fabricação segundo regras oficiais
   * @param {number} opts.custoMateriaPrima Custo em T$ das matérias-primas (⅓ do preço)
   * @param {number} [opts.bonusOficio] Bônus de perícia do herói
   * @param {number} [opts.bonusInt] Modificador de Inteligência do herói
   * @param {boolean} [opts.isExisting] Se é aprimoramento de item já existente
   * @param {boolean} [opts.isEngenhoca] Se trata de uma engenhoca
   * @param {Function} opts.onConfirm Callback executado após a avaliação (com delay de 1,5s)
   */
  function abrirModalTesteOficio(opts) {
    const modal = ensureTesteOficioModal();
    const body = modal.querySelector('#teste-oficio-modal-body');
    const footer = modal.querySelector('#teste-oficio-modal-footer');
    const titleEl = modal.querySelector('#teste-oficio-modal-title');
    const subtitleEl = modal.querySelector('#teste-oficio-modal-subtitle');
    if (!body || !footer) return;

    if (titleEl) titleEl.textContent = opts.titulo || 'Teste de Fabricação';
    if (subtitleEl) subtitleEl.textContent = opts.subtitulo || opts.oficioNome;

    let destinatario = 'si';
    let aliadoId = '';
    let aliadoNome = '';
    let avaliacao = null;
    let d20JaRolado = false;
    let engenhosidadeAtiva = false;
    let engenhosidadePmDebitado = false;
    let autoCloseTimer = null;

    function heroHasEngenhosidade() {
      if (opts.hasEngenhosidade !== undefined) return Boolean(opts.hasEngenhosidade);
      const st = (typeof state !== 'undefined' && state) ? state : null;
      let pers = null;
      try { pers = JSON.parse(localStorage.getItem('forja-heroi-t20-v1') || 'null'); } catch {}
      let prof = null;
      try {
        const stored = localStorage.getItem('arsenal-arton-character-profiles-v1');
        if (stored) {
          const p = JSON.parse(stored);
          prof = p.profiles?.find(x => x.id === 'ficha-ativa') || p.profiles?.find(x => x.id === p.activeId) || p.profiles?.[0];
        }
      } catch {}

      const candidate = st || pers || prof;
      if (!candidate) return false;
      if (candidate.identity?.classId === 'inventor' || candidate.classId === 'inventor' || candidate.classes?.includes?.('inventor')) return true;
      if (Array.isArray(candidate.progression) && candidate.progression.some(p => p && p.classId === 'inventor')) return true;
      const powers = candidate.powers || (typeof characterPowers === 'function' ? characterPowers() : []);
      if (Array.isArray(powers) && powers.some(p => /engenhosidade/i.test(p.nome || p.name || p.id || ''))) return true;
      if (Array.isArray(candidate.progression)) {
        for (const p of candidate.progression) {
          if (p && /engenhosidade/i.test(p.powerId || '')) return true;
        }
      }
      const raceChoices = candidate.raceChoices || {};
      for (const k in raceChoices) {
        if (/engenhosidade/i.test(String(raceChoices[k]))) return true;
      }
      if (candidate.hasEngenhosidade) return true;
      return false;
    }

    function getHeroCurrentPm() {
      if (typeof state !== 'undefined' && state) {
        if (state.vitals && typeof state.vitals.pm === 'number') {
          return state.vitals.pm;
        }
        if (typeof progressionStats === 'function') {
          const stats = progressionStats();
          return Number(stats.pm) || 0;
        }
      }
      try {
        const pers = JSON.parse(localStorage.getItem('forja-heroi-t20-v1') || 'null');
        if (pers?.vitals && typeof pers.vitals.pm === 'number') return pers.vitals.pm;
      } catch {}
      return 10;
    }

    function spendHeroPm(amount) {
      if (typeof state !== 'undefined' && state) {
        const stats = typeof progressionStats === 'function' ? progressionStats() : { pm: 0 };
        const vitals = typeof sheetVitals === 'function' ? sheetVitals(stats) : (state.vitals || {});
        vitals.pm = Math.max(0, (vitals.pm || 0) - amount);
        state.vitals = vitals;
        if (typeof updateVitalVisuals === 'function') {
          updateVitalVisuals('pm', vitals);
        }
        if (typeof saveSheetVitals === 'function') {
          saveSheetVitals();
        } else if (typeof persistNow === 'function') {
          persistNow();
        }
      }
      try {
        const pers = JSON.parse(localStorage.getItem('forja-heroi-t20-v1') || 'null');
        if (pers) {
          pers.vitals = pers.vitals || { pm: 10, pmMax: 10 };
          pers.vitals.pm = Math.max(0, (pers.vitals.pm || 10) - amount);
          localStorage.setItem('forja-heroi-t20-v1', JSON.stringify(pers));
        }
      } catch {}
    }

    function refundHeroPm(amount) {
      if (typeof state !== 'undefined' && state) {
        const stats = typeof progressionStats === 'function' ? progressionStats() : { pm: 0 };
        const vitals = typeof sheetVitals === 'function' ? sheetVitals(stats) : (state.vitals || {});
        const max = vitals.pmMax || stats.pm || 0;
        vitals.pm = Math.min(max, (vitals.pm || 0) + amount);
        state.vitals = vitals;
        if (typeof updateVitalVisuals === 'function') {
          updateVitalVisuals('pm', vitals);
        }
        if (typeof saveSheetVitals === 'function') {
          saveSheetVitals();
        } else if (typeof persistNow === 'function') {
          persistNow();
        }
      }
      try {
        const pers = JSON.parse(localStorage.getItem('forja-heroi-t20-v1') || 'null');
        if (pers) {
          pers.vitals = pers.vitals || { pm: 10, pmMax: 10 };
          pers.vitals.pm = Math.min(pers.vitals.pmMax || 20, (pers.vitals.pm || 0) + amount);
          localStorage.setItem('forja-heroi-t20-v1', JSON.stringify(pers));
        }
      } catch {}
    }

    // Modificador de Inteligência
    function resolverHeroInt() {
      if (typeof finalAttrs === 'function') {
        try {
          const fa = finalAttrs();
          if (fa && fa.int != null) return Number(fa.int);
        } catch {}
      }
      let st = (typeof state !== 'undefined' && state) ? state : null;
      let pers = null;
      try { pers = JSON.parse(localStorage.getItem('forja-heroi-t20-v1') || 'null'); } catch {}
      let prof = null;
      try {
        const stored = pers?.arsenal?.storage?.['arsenal-arton-character-profiles-v1'] || localStorage.getItem('arsenal-arton-character-profiles-v1');
        if (stored) {
          const parsed = JSON.parse(stored);
          prof = parsed.profiles?.find(p => p.id === 'ficha-ativa') || parsed.profiles?.find(p => p.id === parsed.activeId) || parsed.profiles?.[0];
        }
      } catch {}

      if (st?.finalAttrs?.int != null) return Number(st.finalAttrs.int);
      if (pers?.finalAttrs?.int != null) return Number(pers.finalAttrs.int);
      if (prof?.finalAttrs?.int != null) return Number(prof.finalAttrs.int);
      if (st?.attributes?.int != null) return Number(st.attributes.int);
      if (pers?.attributes?.int != null) return Number(pers.attributes.int);
      if (prof?.attributes?.int != null) return Number(prof.attributes.int);

      let val = Number(st?.identity?.baseAttrs?.int ?? pers?.identity?.baseAttrs?.int ?? 0);
      const openAlloc = st?.identity?.openRaceAllocations || pers?.identity?.openRaceAllocations || {};
      if (openAlloc.int) {
        val += Number(openAlloc.int);
      } else {
        const raceId = String(st?.identity?.raceId || pers?.identity?.raceId || '').toLowerCase();
        const racesList = (typeof DATA !== 'undefined' && Array.isArray(DATA.races)) ? DATA.races : [];
        const raceDef = racesList.find(r => r.id === raceId);
        if (raceDef?.atributos?.fixos?.int) {
          val += Number(raceDef.atributos.fixos.int);
        } else {
          if (raceId === 'kliren' || raceId === 'elfo') val += 2;
          else if (raceId === 'goblin' || raceId === 'qareen') val += 1;
          else if (raceId === 'minotauro') val -= 1;
        }
      }
      const raceAttrs = st?.identity?.raceAttrs || pers?.identity?.raceAttrs || [];
      if (Array.isArray(raceAttrs)) val += raceAttrs.filter(a => a === 'int').length;
      const specialAttrs = st?.identity?.raceSpecialAttrs || pers?.identity?.raceSpecialAttrs || {};
      Object.values(specialAttrs).forEach(arr => { if (Array.isArray(arr)) val += arr.filter(a => a === 'int').length; });
      const subAttrs = st?.identity?.raceSubAttrs || pers?.identity?.raceSubAttrs || {};
      Object.values(subAttrs).forEach(arr => { if (Array.isArray(arr)) val += arr.filter(a => a === 'int').length; });

      const prog = st?.progression || pers?.progression || [];
      if (Array.isArray(prog)) {
        prog.forEach(p => {
          if (p && (p.attribute === 'int' || p.chosenAttr === 'int' || p.powerId === 'aumento_de_atributo_int' || (p.powerId === 'aumento_de_atributo' && p.chosenAttr === 'int'))) {
            val += 1;
          }
        });
      }
      const orig = st?.origin || pers?.origin;
      if (orig?.aspiranteHeroiAttr === 'int') val += 1;
      const tempManual = st?.tempManualBonuses?.attrs || pers?.tempManualBonuses?.attrs;
      if (tempManual?.int) val += Number(tempManual.int);

      return Math.max(val, 0);
    }

    const heroRealInt = resolverHeroInt();
    let bonusInt = Math.max(Number.isFinite(opts.bonusInt) ? Number(opts.bonusInt) : 0, heroRealInt);
    if (!bonusInt && heroHasEngenhosidade()) {
      bonusInt = 5;
    }

    function extrairChaveOficio(oficioStr) {
      if (!oficioStr) return '';
      const clean = String(oficioStr).toLowerCase();
      const match = clean.match(/of[íi]cio\s*\((.*?)\)/i);
      const raw = match ? match[1].trim() : clean.replace(/of[íi]cio/i, '').trim();
      if (/engenho/i.test(raw)) return 'engenhoqueiro';
      if (/arm/i.test(raw)) return 'armeiro';
      if (/alqui/i.test(raw)) return 'alquimia';
      if (/alfaiat/i.test(raw)) return 'alfaiate';
      if (/artes/i.test(raw)) return 'artesao';
      if (/cozinh|culin/i.test(raw)) return 'culinaria';
      if (/carpin/i.test(raw)) return 'carpinteiro';
      if (/joalh|ouriv/i.test(raw)) return 'joalheiro';
      if (/escrib/i.test(raw)) return 'escriba';
      if (/tatu/i.test(raw)) return 'tatuador';
      if (/pedr|alven/i.test(raw)) return 'pedreiro';
      if (/pesca/i.test(raw)) return 'pescador';
      if (/miner/i.test(raw)) return 'minerador';
      return raw;
    }

    function heroiPossuiInstrumentosDoOficio(oficioStr) {
      const ofKey = extrairChaveOficio(oficioStr);
      if (!ofKey) return true;
      let bp = [];
      if (typeof characterInventory === 'function') {
        const ci = characterInventory();
        if (Array.isArray(ci)) bp = bp.concat(ci);
      }
      if (typeof inventoryProfile === 'function') {
        const ip = inventoryProfile();
        if (ip && Array.isArray(ip.backpack)) bp = bp.concat(ip.backpack);
      }
      if (typeof activeCharacterProfile === 'function') {
        const p = activeCharacterProfile();
        if (p && Array.isArray(p.backpack)) bp = bp.concat(p.backpack);
      }
      if (typeof state !== 'undefined' && state) {
        if (Array.isArray(state.backpack)) bp = bp.concat(state.backpack);
        if (state.inventory && Array.isArray(state.inventory.backpack)) bp = bp.concat(state.inventory.backpack);
      }
      if (typeof window !== 'undefined') {
        if (Array.isArray(window.userBackpack)) bp = bp.concat(window.userBackpack);
        if (Array.isArray(window.backpackItems)) bp = bp.concat(window.backpackItems);
      }
      try {
        const stored = localStorage.getItem('arsenal-arton-character-profiles-v1');
        if (stored) {
          const parsed = JSON.parse(stored);
          const active = parsed.profiles?.find(p => p.id === 'ficha-ativa') || parsed.profiles?.find(p => p.id === parsed.activeId) || parsed.profiles?.[0];
          if (active && Array.isArray(active.backpack)) bp = bp.concat(active.backpack);
        }
      } catch {}

      return bp.some(entry => {
        if (!entry) return false;
        const itemId = String(entry.itemId || entry.id || '').toLowerCase();
        const dispName = String(entry.displayName || entry.itemName || entry.nome || '').toLowerCase();
        const optOficio = String(entry.options?.oficio || '').toLowerCase();

        if (optOficio && (optOficio === ofKey || extrairChaveOficio(optOficio) === ofKey || optOficio.includes(ofKey) || ofKey.includes(optOficio))) return true;
        if ((itemId.includes(ofKey) || dispName.includes(ofKey)) && (itemId.includes('instrumento') || dispName.includes('instrumento') || itemId.includes('ferramenta') || dispName.includes('ferramenta'))) return true;
        if ((ofKey === 'engenhoqueiro' || ofKey === 'engenhoca') && (
          dispName.includes('engenho') || itemId.includes('engenho') || optOficio.includes('engenho')
        )) return true;
        const targetName = typeof formatCraftToolName === 'function' ? formatCraftToolName(ofKey).toLowerCase() : '';
        if (targetName && dispName.includes(targetName)) return true;
        if (itemId === 'instrumentos_de_oficio' && (!entry.options?.oficio || entry.options.oficio === '')) return true;
        if (dispName === 'instrumentos de ofício' || dispName === 'instrumentos de oficio') return true;
        return false;
      });
    }

    const temInstrumento = heroiPossuiInstrumentosDoOficio(opts.oficioNome);
    const penalidadeSemInstrumento = temInstrumento ? 0 : -5;
    function resolverBonusOficioModal(ofKey, heroInt) {
      if (typeof calculatedSkillTotal === 'function') {
        try {
          const tot = calculatedSkillTotal(`oficio:${ofKey}`) || calculatedSkillTotal(`oficio_${ofKey}`) || calculatedSkillTotal('oficio');
          if (tot != null && !isNaN(tot)) return Number(tot);
        } catch {}
      }
      let st = (typeof state !== 'undefined' && state) ? state : null;
      let pers = null;
      try { pers = JSON.parse(localStorage.getItem('forja-heroi-t20-v1') || 'null'); } catch {}
      let prof = null;
      try {
        const stored = pers?.arsenal?.storage?.['arsenal-arton-character-profiles-v1'] || localStorage.getItem('arsenal-arton-character-profiles-v1');
        if (stored) {
          const parsed = JSON.parse(stored);
          prof = parsed.profiles?.find(p => p.id === 'ficha-ativa') || parsed.profiles?.find(p => p.id === parsed.activeId) || parsed.profiles?.[0];
        }
      } catch {}

      const skills = st?.calculatedSkills || pers?.calculatedSkills || prof?.calculatedSkills || {};
      if (skills[`oficio:${ofKey}`] != null) return Number(skills[`oficio:${ofKey}`]);
      if (skills[`oficio_${ofKey}`] != null) return Number(skills[`oficio_${ofKey}`]);
      if (skills['oficio'] != null) return Number(skills['oficio']);

      const lvl = Number(st?.identity?.plannedLevel || pers?.identity?.plannedLevel || st?.level || pers?.level || prof?.level || 1);
      const halfLvl = Math.floor(lvl / 2);
      const train = lvl >= 15 ? 6 : (lvl >= 7 ? 4 : 2);
      const extra = Number(st?.tempManualBonuses?.skills?.[`oficio:${ofKey}`] || st?.tempManualBonuses?.skills?.['oficio'] || pers?.tempManualBonuses?.skills?.[`oficio:${ofKey}`] || 0);
      return halfLvl + heroInt + train + extra;
    }

    const ofKey = extrairChaveOficio(opts.oficioNome);
    const bonusResolvido = resolverBonusOficioModal(ofKey, bonusInt);
    let bonusBase = Math.max(Number.isFinite(opts.bonusOficio) ? Number(opts.bonusOficio) : 0, bonusResolvido);
    const bonusVal = bonusBase + penalidadeSemInstrumento;
    const isEngenhoca = Boolean(opts.isEngenhoca || opts.oficioNome?.toLowerCase().includes('engenhoqueiro'));

    // @ts-ignore
    const formatFn = typeof formatTibars === 'function' ? formatTibars : (v => `T$ ${v}`);
    const custoText = formatFn(opts.custoMateriaPrima);

    function cancelarTimerAutoClose() {
      if (autoCloseTimer) {
        clearTimeout(autoCloseTimer);
        autoCloseTimer = null;
      }
    }

    function fecharEConcluir() {
      cancelarTimerAutoClose();
      engenhosidadePmDebitado = false;
      modal.hidden = true;
      modal.style.display = 'none';
      liberarTravamentoScroll();
      if (avaliacao && typeof opts.onConfirm === 'function') {
        opts.onConfirm({
          destinatario,
          aliadoId,
          aliadoNome,
          sucesso: avaliacao.sucesso,
          falhaLeve: avaliacao.falhaLeve,
          falhaCritica: avaliacao.falhaCritica,
          diferenca: avaliacao.diferenca,
          custoDebitar: avaliacao.custoDebitar,
          estragou: avaliacao.estragou,
          totalDado: avaliacao.total
        });
      }
    }

    function calcularAvaliacao(totalDado, calculoTexto) {
      const diferenca = totalDado - opts.cd;
      const sucesso = diferenca >= 0;
      const falhaLeve = !sucesso && diferenca >= -4;
      const falhaCritica = !sucesso && diferenca <= -5;

      let tituloMsg = '';
      let descMsg = '';
      let statusIcon = '';
      let statusColor = '';
      let custoDebitar = 0;
      let estragou = false;

      if (destinatario === 'si') {
        custoDebitar = opts.custoMateriaPrima;
        if (sucesso) {
          statusIcon = 'Sucesso';
          statusColor = '#4ade80';
          tituloMsg = 'Fabricação bem-sucedida!';
          descMsg = opts.isExisting
            ? `A melhoria foi incorporada com êxito ao item. Custo de ${custoText} debitado.`
            : `O item foi forjado com maestria e guardado na sua mochila. Custo de ${custoText} debitado.`;
        } else if (falhaLeve) {
          statusIcon = 'Falha';
          statusColor = '#fbbf24';
          tituloMsg = 'Falha na manufatura';
          descMsg = isEngenhoca
            ? (opts.hasAttachedItem
              ? `A engenhoca não atingiu a calibragem necessária, mas o item base foi preservado intacto. Matérias-primas da engenhoca (${custoText}) consumidas.`
              : `A engenhoca não atingiu a calibragem necessária. As matérias-primas (${custoText}) foram consumidas.`)
            : (opts.isExisting
              ? `O trabalho não alcançou a qualidade necessária, mas o item de base foi preservado. Matéria-prima (${custoText}) consumida.`
              : `As melhorias não surtiram efeito, mas o item básico foi preservado na sua mochila. Custo de ${custoText} debitado.`);
        } else {
          // Falha crítica (por 5 ou mais de diferença)
          if (isEngenhoca && !opts.hasAttachedItem) {
            estragou = false;
            statusIcon = 'Falha';
            statusColor = '#f87171';
            tituloMsg = 'Falha na fabricação da engenhoca';
            descMsg = `A engenhoca não pôde ser concluída. Matéria-prima de ${custoText} consumida.`;
          } else {
            estragou = true;
            statusIcon = 'Falha Crítica';
            statusColor = '#ef4444';
            tituloMsg = 'Falha crítica na manufatura';
            descMsg = (opts.isExisting || opts.hasAttachedItem)
              ? `Falha grave por 5 ou mais da CD. O item sofreu avarias severas na bancada e ficou Estragado (-5 nos testes/defesa, precisando de conserto)! Matérias-primas perdidas.`
              : `Falha grave por 5 ou mais da CD. As matérias-primas foram completamente arruinadas (${custoText} perdidos).`;
          }
        }
      } else {
        // Encomenda para Aliado
        custoDebitar = 0;
        if (sucesso) {
          statusIcon = 'Sucesso';
          statusColor = '#4ade80';
          tituloMsg = 'Encomenda concluída com sucesso!';
          descMsg = `A peça para seu aliado foi entregue com êxito sem custos para você.`;
        } else if (falhaLeve) {
          statusIcon = 'Falha';
          statusColor = '#fbbf24';
          tituloMsg = 'Falha na encomenda do aliado';
          descMsg = `A manufatura falhou por menos de 5. O item básico foi preservado, mas sem as melhorias solicitadas.`;
        } else {
          estragou = !isEngenhoca || Boolean(opts.hasAttachedItem);
          statusIcon = 'Falha Crítica';
          statusColor = '#ef4444';
          tituloMsg = 'Falha crítica na encomenda';
          descMsg = (isEngenhoca && !opts.hasAttachedItem)
            ? `A engenhoca encomendada pelo aliado não funcionou e foi descartada.`
            : `Falha grave por 5 ou mais: o item foi avariado e ficou Estragado (-5 nos testes/defesa).`;
        }
      }

      return {
        total: totalDado,
        calculoTexto: calculoTexto || `${totalDado} vs CD ${opts.cd}`,
        diferenca,
        sucesso,
        falhaLeve,
        falhaCritica,
        estragou,
        custoDebitar,
        statusIcon,
        statusColor,
        tituloMsg,
        descMsg
      };
    }

    function renderModalUI() {
      const todosHerois = typeof CampanhaMesa !== 'undefined' ? CampanhaMesa.listarHeroisMesa() : (typeof window !== 'undefined' && window.CampanhaMesa ? window.CampanhaMesa.listarHeroisMesa() : []);
      const heroiAtualId = typeof state !== 'undefined' && state.identity ? (state.identity.id || state.identity.characterName) : '';
      const aliadosDisponiveis = todosHerois.filter(h => h.id !== heroiAtualId);

      if (!aliadoId && aliadosDisponiveis.length > 0) {
        aliadoId = aliadosDisponiveis[0].id;
        aliadoNome = aliadosDisponiveis[0].nome;
      }

      body.innerHTML = `
        <!-- 1. Destinatário da Fabricação -->
        <div style="background: #101620; border: 1px solid #1e2837; border-radius: 8px; padding: 12px 14px;">
          <label style="display: block; font-size: 0.78rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
            1. Destinatário da Fabricação
          </label>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <label style="display: flex; align-items: flex-start; gap: 8px; padding: 10px; border-radius: 6px; border: 1px solid ${destinatario === 'si' ? '#d4af37' : '#222d3e'}; background: ${destinatario === 'si' ? 'rgba(212, 175, 55, 0.06)' : 'transparent'}; cursor: pointer;">
              <input type="radio" name="testeOficioDest" value="si" ${destinatario === 'si' ? 'checked' : ''} style="margin-top: 3px; accent-color: #d4af37;">
              <div>
                <strong style="display: block; font-size: 0.85rem; color: #f1f5f9;">Para si próprio</strong>
                <span style="display: block; font-size: 0.73rem; color: #94a3b8; line-height: 1.35; margin-top: 2px;">Você custeia a matéria-prima e o item fica na sua mochila.</span>
              </div>
            </label>
            <label style="display: flex; align-items: flex-start; gap: 8px; padding: 10px; border-radius: 6px; border: 1px solid ${destinatario === 'aliado' ? '#d4af37' : '#222d3e'}; background: ${destinatario === 'aliado' ? 'rgba(212, 175, 55, 0.06)' : 'transparent'}; cursor: pointer;">
              <input type="radio" name="testeOficioDest" value="aliado" ${destinatario === 'aliado' ? 'checked' : ''} style="margin-top: 3px; accent-color: #d4af37;">
              <div>
                <strong style="display: block; font-size: 0.85rem; color: #f1f5f9;">Para um aliado</strong>
                <span style="display: block; font-size: 0.73rem; color: #94a3b8; line-height: 1.35; margin-top: 2px;">Sem custo pessoal. O item pode ser transferido à mochila do aliado da mesa.</span>
              </div>
            </label>
          </div>

          <div id="containerSeletorAliado" style="margin-top: 10px; padding: 10px 12px; background: #080c14; border: 1px solid #1e2837; border-radius: 6px; display: ${destinatario === 'aliado' ? 'block' : 'none'};">
            ${aliadosDisponiveis.length > 0 ? `
              <label for="aliadoDestinoSelect" style="display: block; font-size: 0.76rem; font-weight: 600; color: #cbd5e1; margin-bottom: 4px;">
                Selecione o Aliado da Mesa para receber o item na mochila:
              </label>
              <select id="aliadoDestinoSelect" class="select" style="width: 100%; padding: 7px 10px; font-size: 0.82rem; background: #0f1623; border: 1px solid #28364b; color: #f8fafc; border-radius: 4px;">
                ${aliadosDisponiveis.map(h => `<option value="${h.id}" ${h.id === aliadoId ? 'selected' : ''}>${h.nome} (${h.raca} · ${h.classe} Nív. ${h.nivel})</option>`).join('')}
              </select>
            ` : `
              <div style="font-size: 0.74rem; color: #94a3b8; font-style: italic;">
                Nenhum outro herói salvo na mesa local. O item será registrado como entregue ao aliado sem entrar na sua mochila.
              </div>
            `}
          </div>
        </div>

        <!-- 2. Resultado do Teste de Ofício -->
        <div style="background: #101620; border: 1px solid #1e2837; border-radius: 8px; padding: 14px; display: flex; flex-direction: column; gap: 12px;">
          ${!temInstrumento ? `
            <div style="background: rgba(239, 68, 68, 0.12); border: 1px solid #ef4444; border-radius: 6px; padding: 8px 12px; font-size: 0.76rem; color: #fca5a5; display: flex; align-items: center; gap: 8px;">
              <span>Sem Instrumentos de Ofício adequados na mochila: <strong>penalidade de -5</strong> aplicada ao teste de fabricação.</span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap;">
            
            <!-- Campo numérico manual e botão Avaliar -->
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <label for="testeOficioInput" style="font-size: 0.84rem; font-weight: 600; color: #cbd5e1;">
                2. Resultado do Teste de Ofício:
              </label>
              <div style="display: flex; gap: 8px; align-items: center;">
                <input type="number" id="testeOficioInput" min="1" max="100" placeholder="Ex: ${opts.cd}" value="${avaliacao ? avaliacao.total : ''}" style="width: 85px; padding: 7px 10px; border-radius: 4px; border: 1px solid #28364b; background: #090d14; color: #f8fafc; font-size: 0.95rem; font-weight: 700; text-align: center;">
                <button type="button" id="avaliarTesteOficioBtn" class="forge-theme-btn ember" style="padding: 7px 14px;">
                  Avaliar Teste
                </button>
              </div>
            </div>

            <!-- Botões de Rolar D20 e Engenhosidade -->
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
              <button type="button" id="rolarDadoOficioBtn" class="forge-theme-btn ember" style="font-size: 0.8rem; padding: 8px 14px;" title="Rolar 1d20 + Bônus de Ofício">
                Rolar d20 (${bonusVal >= 0 ? '+' : ''}${bonusVal})
              </button>

              <div style="display: flex; flex-direction: column; align-items: flex-end; max-width: 220px; text-align: right;">
                <button type="button" id="toggleEngenhosidadeBtn" class="forge-theme-btn gear ${engenhosidadeAtiva ? 'active' : ''}" ${(d20JaRolado || (!heroHasEngenhosidade()) || (!engenhosidadeAtiva && getHeroCurrentPm() < 2)) ? 'disabled' : ''} style="font-size: 0.75rem; padding: 5px 10px; ${((!heroHasEngenhosidade()) || (!engenhosidadeAtiva && getHeroCurrentPm() < 2)) ? 'opacity: 0.5; cursor: not-allowed;' : ''}" title="${!heroHasEngenhosidade() ? 'Requer a habilidade Engenhosidade (Inventor ou poderes específicos).' : d20JaRolado ? 'Engenhosidade só pode ser ativada antes da rolagem.' : (!engenhosidadeAtiva && getHeroCurrentPm() < 2) ? 'PM insuficiente (requer 2 PM).' : 'Gaste 2 PM para somar sua inteligência no teste.'}">
                  ${engenhosidadeAtiva ? `Engenhosidade Ativa (+${bonusInt})` : `Engenhosidade (+${bonusInt})`}
                </button>
                <span style="font-size: 0.68rem; color: #64748b; margin-top: 3px; line-height: 1.25;">
                  ${!heroHasEngenhosidade() ? 'Requer poder Engenhosidade' : engenhosidadeAtiva ? '2 PM consumidos no teste' : (getHeroCurrentPm() < 2 ? 'PM insuficiente (requer 2 PM)' : 'Gaste 2 PM para somar sua inteligência')}
                </span>
              </div>
            </div>

          </div>

          <!-- Feedback do Teste com cálculo explícito e fechamento em 1,5s -->
          ${avaliacao ? `
            <div style="border-radius: 6px; padding: 12px 14px; margin-top: 4px; border: 1px solid rgba(255, 255, 255, 0.08); background: rgba(12, 17, 24, 0.9); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4); animation: fadeIn 0.2s ease-in-out;">
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 1.15rem; color: ${avaliacao.statusColor}; font-weight: 700;">${avaliacao.statusIcon}</span>
                  <strong style="font-size: 0.92rem; color: ${avaliacao.statusColor};">${avaliacao.tituloMsg}</strong>
                </div>
                <span style="font-size: 0.82rem; font-weight: 700; color: #e2e8f0; background: #161e2b; padding: 2px 8px; border-radius: 4px; border: 1px solid #28364b;">
                  ${avaliacao.calculoTexto}
                </span>
              </div>
              <p style="margin: 0; font-size: 0.78rem; line-height: 1.4; color: #94a3b8;">${avaliacao.descMsg}</p>
              <small style="display: block; margin-top: 6px; font-size: 0.68rem; color: #64748b;">Fechando e registrando resultado em 1,5s...</small>
            </div>
          ` : ''}
        </div>
      `;

      // Footer
      footer.innerHTML = `
        <button type="button" class="forge-theme-btn cancel close-teste-oficio-btn">Cancelar</button>
      `;

      function fecharSemConcluir() {
        if (engenhosidadeAtiva && engenhosidadePmDebitado && !d20JaRolado) {
          refundHeroPm(2);
          engenhosidadePmDebitado = false;
          engenhosidadeAtiva = false;
        }
        cancelarTimerAutoClose();
        modal.hidden = true;
        modal.style.display = 'none';
        liberarTravamentoScroll();
      }

      // Listeners
      modal.querySelectorAll('.close-teste-oficio-btn').forEach(btn => {
        btn.onclick = () => {
          fecharSemConcluir();
        };
      });

      modal.onclick = (e) => {
        if (e.target === modal) {
          fecharSemConcluir();
        }
      };

      body.querySelectorAll('input[name="testeOficioDest"]').forEach(radio => {
        radio.addEventListener('change', (ev) => {
          // @ts-ignore
          destinatario = ev.target.value;
          const inputVal = Number(body.querySelector('#testeOficioInput')?.value);
          if (inputVal > 0) {
            avaliacao = calcularAvaliacao(inputVal, `${inputVal} vs CD ${opts.cd}`);
          }
          renderModalUI();
        });
      });

      const selAliado = body.querySelector('#aliadoDestinoSelect');
      if (selAliado) {
        selAliado.addEventListener('change', () => {
          aliadoId = selAliado.value;
          const enc = aliadosDisponiveis.find(h => h.id === aliadoId);
          aliadoNome = enc ? enc.nome : '';
        });
      }

      // Botão Engenhosidade (toggle antes de rolar)
      const engBtn = body.querySelector('#toggleEngenhosidadeBtn');
      if (engBtn && !d20JaRolado && heroHasEngenhosidade()) {
        engBtn.addEventListener('click', () => {
          if (!engenhosidadeAtiva) {
            const pmAtual = getHeroCurrentPm();
            if (pmAtual < 2) {
              if (typeof toast === 'function') toast('PM insuficiente para ativar Engenhosidade (requer 2 PM).', 'warning');
              return;
            }
            engenhosidadeAtiva = true;
            spendHeroPm(2);
            engenhosidadePmDebitado = true;
            if (typeof toast === 'function') toast('Engenhosidade ativada (-2 PM).', 'info');
          } else {
            engenhosidadeAtiva = false;
            if (engenhosidadePmDebitado) {
              refundHeroPm(2);
              engenhosidadePmDebitado = false;
            }
          }
          renderModalUI();
        });
      }

      // Botão Rolar d20
      const rolarBtn = body.querySelector('#rolarDadoOficioBtn');
      if (rolarBtn) {
        rolarBtn.addEventListener('click', () => {
          d20JaRolado = true;
          engenhosidadePmDebitado = false;
          const d20 = Math.floor(Math.random() * 20) + 1;
          let total = d20 + bonusVal;
          let calculoTexto = temInstrumento
            ? `${d20} + ${bonusVal} = ${total}`
            : `${d20} + ${bonusBase} - 5 [Sem ferramentas] = ${total}`;
          if (engenhosidadeAtiva) {
            total += bonusInt;
            calculoTexto = temInstrumento
              ? `${d20} + ${bonusVal} + ${bonusInt} [Int] = ${total}`
              : `${d20} + ${bonusBase} - 5 [Sem ferramentas] + ${bonusInt} [Int] = ${total}`;
          }
          calculoTexto += ` (vs CD ${opts.cd})`;

          cancelarTimerAutoClose();
          avaliacao = calcularAvaliacao(total, calculoTexto);
          renderModalUI();

          // Auto-fechamento após 1,5 segundos (1500ms)
          autoCloseTimer = setTimeout(() => {
            fecharEConcluir();
          }, 1500);
        });
      }

      // Botão Avaliar Teste (Manual)
      const avaliarBtn = body.querySelector('#avaliarTesteOficioBtn');
      const inputEl = body.querySelector('#testeOficioInput');
      if (avaliarBtn && inputEl) {
        avaliarBtn.addEventListener('click', () => {
          // @ts-ignore
          const val = Number(inputEl.value);
          if (val > 0) {
            d20JaRolado = true;
            engenhosidadePmDebitado = false;
            cancelarTimerAutoClose();
            avaliacao = calcularAvaliacao(val, `Total ${val} vs CD ${opts.cd}`);
            renderModalUI();

            autoCloseTimer = setTimeout(() => {
              fecharEConcluir();
            }, 1500);
          }
        });
      }

      if (inputEl) {
        inputEl.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter') {
            // @ts-ignore
            const val = Number(inputEl.value);
            if (val > 0) {
              d20JaRolado = true;
              cancelarTimerAutoClose();
              avaliacao = calcularAvaliacao(val, `Total ${val} vs CD ${opts.cd}`);
              renderModalUI();

              autoCloseTimer = setTimeout(() => {
                fecharEConcluir();
              }, 1500);
            }
          }
        });
      }
    }

    renderModalUI();
    modal.hidden = false;
    modal.style.display = 'flex';
  }

  // @ts-ignore
  window.liberarTravamentoScroll = liberarTravamentoScroll;
  // @ts-ignore
  window.abrirModalTesteOficio = abrirModalTesteOficio;
})();
