// @ts-check

/**
 * FORJA RUBRA — Módulo Dedicado da Bancada de Engenhocas
 * Página Ampla para criação, calibração, acoplamento de itens e testes de manufatura de Tormenta 20.
 * Layout consagrado e alinhado ao design Dark Fantasy / Chanfrado da Forja Rubra.
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

  function inicializarBancadaEngenhoca() {
    // @ts-ignore
    const rawData = window.__FORJA_DATA__ || {};
    const spells = rawData.DATA?.spells || rawData.spells || [];
    // @ts-ignore
    const rules = (typeof window !== 'undefined' && window.RegrasManufatura) ||
                  (typeof globalThis !== 'undefined' && globalThis.RegrasManufatura) ||
                  (typeof RegrasManufatura !== 'undefined' ? RegrasManufatura : null);

    // Recupera dados do Herói Ativo
    let heroProfile = null;
    let persistedHero = null;
    try {
      persistedHero = JSON.parse(localStorage.getItem('forja-heroi-t20-v1') || 'null');
      const stored = persistedHero?.arsenal?.storage?.['arsenal-arton-character-profiles-v1'] || localStorage.getItem('arsenal-arton-character-profiles-v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        heroProfile = parsed.profiles?.find(p => p.id === 'ficha-ativa') || parsed.profiles?.find(p => p.id === parsed.activeId) || parsed.profiles?.[0];
      }
    } catch {}

    // @ts-ignore
    const heroState = window.state || persistedHero || heroProfile || (typeof forjaStorage !== 'undefined' ? forjaStorage.get('active_character') : null) || {};

    // Inteligência real do Herói Ativo (inclui baseAttrs, raça, progressão e modificadores temporários)
    function resolverInteligenciaHeroi(st, prof, pers) {
      if (typeof finalAttrs === 'function') {
        try {
          const fa = finalAttrs();
          if (fa && fa.int != null) return Number(fa.int);
        } catch {}
      }
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

    const intMod = resolverInteligenciaHeroi(heroState, heroProfile, persistedHero) || 5;

    const isInventor = (heroState.identity?.classId === 'inventor') ||
                       (heroProfile?.classId === 'inventor') ||
                       (Array.isArray(heroState.progression) && heroState.progression.some(p => p && p.classId === 'inventor'));

    // Nível do Herói Ativo
    // @ts-ignore
    const heroLvl = typeof effectiveCharacterLevel === 'function' ? effectiveCharacterLevel() : (Number(heroState.identity?.plannedLevel) || Number(heroState.level) || Number(heroProfile?.level) || 5);
    const halfLevel = Math.floor(heroLvl / 2);
    const maxCirculoEngenhoca = rules && typeof rules.circuloMaximoEngenhoca === 'function'
      ? rules.circuloMaximoEngenhoca(heroLvl)
      : (heroLvl >= 18 ? 5 : (heroLvl >= 14 ? 4 : (heroLvl >= 10 ? 3 : (heroLvl >= 6 ? 2 : 1))));

    // Treino de Ofício
    // @ts-ignore
    const trainedList = typeof allTrainedOffices === 'function' ? allTrainedOffices() : (heroState.offices || heroProfile?.offices || ['engenhoqueiro']);
    // @ts-ignore
    const trainedSkills = typeof allTrainedSkills === 'function' ? allTrainedSkills() : (heroState.trainedSkills || heroProfile?.trainedSkills || ['oficio']);
    const isTrained = true;

    function resolverPericiaOficio(st, pers, prof, ofKey, lvl, heroInt) {
      if (typeof calculatedSkillTotal === 'function') {
        try {
          const tot = calculatedSkillTotal(`oficio:${ofKey}`) || calculatedSkillTotal(`oficio_${ofKey}`) || calculatedSkillTotal('oficio');
          if (tot != null && !isNaN(tot)) return Number(tot);
        } catch {}
      }
      const skills = st?.calculatedSkills || pers?.calculatedSkills || prof?.calculatedSkills || {};
      if (skills[`oficio:${ofKey}`] != null) return Number(skills[`oficio:${ofKey}`]);
      if (skills[`oficio_${ofKey}`] != null) return Number(skills[`oficio_${ofKey}`]);
      if (skills['oficio'] != null) return Number(skills['oficio']);

      const halfLvl = Math.floor(lvl / 2);
      const train = lvl >= 15 ? 6 : (lvl >= 7 ? 4 : 2);
      const extra = Number(st?.tempManualBonuses?.skills?.[`oficio:${ofKey}`] || st?.tempManualBonuses?.skills?.['oficio'] || pers?.tempManualBonuses?.skills?.[`oficio:${ofKey}`] || 0);
      return halfLvl + heroInt + train + extra;
    }

    const craftBonus = resolverPericiaOficio(heroState, persistedHero, heroProfile, 'engenhoqueiro', heroLvl, intMod);

    // @ts-ignore
    const heroPv = typeof progressionStats === 'function' ? progressionStats().pv : (heroState.pv || 20);
    const halfPv = Math.max(1, Math.floor(heroPv / 2));

    // Determina magia inicial pela URL se fornecida
    const urlParams = new URLSearchParams(window.location.search);
    const paramSpell = urlParams.get('magia') || urlParams.get('spell');

    function normalizarId(s) {
      return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    }

    let selectedSpell = null;
    if (paramSpell) {
      const normParam = normalizarId(paramSpell);
      selectedSpell = (spells || []).find(s => {
        const sId = normalizarId(s.id || s.key || '');
        const sNome = normalizarId(s.nome || s.name || '');
        return sId === normParam || sNome === normParam;
      });

      if (!selectedSpell && typeof DATA !== 'undefined' && Array.isArray(DATA.spells)) {
        selectedSpell = DATA.spells.find(s => {
          const sId = normalizarId(s.id || s.key || '');
          const sNome = normalizarId(s.nome || s.name || '');
          return sId === normParam || sNome === normParam;
        });
      }

      if (!selectedSpell) {
        const titleName = paramSpell.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        selectedSpell = { id: paramSpell, nome: titleName, circulo: 1 };
      }

      // Regra canônica T20: Pré-requisito de círculo de engenhoca segundo o nível do personagem
      const circuloInicial = Number(selectedSpell.circulo || selectedSpell.circle || 1);
      if (circuloInicial > maxCirculoEngenhoca) {
        selectedSpell = null;
      }
    }


    // Forma de uso inicial
    const paramForma = urlParams.get('forma');
    let formaUso = (paramForma === 'vestida' || paramForma === 'empunhada') ? paramForma : 'empunhada';

    let selectedSuggestionIndex = 0;
    let currentSuggestedNames = [];
    let currentSuggestedDescs = [];
    let customName = '';
    let customDesc = '';

    // Elementos DOM da página
    const spellBadgeLabel = document.getElementById('engenhocaSpellBadgeLabel');
    const btnTrocarMagia = document.getElementById('btnTrocarMagiaSimulada');
    const radioEmpunhada = /** @type {HTMLInputElement|null} */ (document.getElementById('radioEmpunhada'));
    const radioVestida = /** @type {HTMLInputElement|null} */ (document.getElementById('radioVestida'));
    const recFormaUsoText = document.getElementById('recFormaUsoText');
    const nameInputEl = /** @type {HTMLInputElement|null} */ (document.getElementById('engenhocaNameInput'));
    const descInputEl = /** @type {HTMLTextAreaElement|null} */ (document.getElementById('engenhocaDescInput'));
    const suggestionsListEl = document.getElementById('nameSuggestionsList');
    const specCustoMateria = document.getElementById('specCustoMateria');
    const specTempo = document.getElementById('specTempo');
    const specCdFab = document.getElementById('specCdFabricacao');
    const specStatsLine = document.getElementById('specStatsLine');
    const btnForjarEngenhoca = document.getElementById('btnForjarEngenhoca');

    function formatarNomeComItem(sugestaoBase) {
      return sugestaoBase;
    }

    function recalcularOpcoesMagia() {

      if (!selectedSpell) {
        currentSuggestedNames = [];
        currentSuggestedDescs = [];
        customName = '';
        customDesc = '';
        if (nameInputEl) nameInputEl.value = '';
        if (descInputEl) descInputEl.value = '';
        return;
      }

      const spellNome = selectedSpell.nome || selectedSpell.name || 'Magia';

      const getOptionsFn = (rules && typeof rules.obterOpcoesEngenhoca === 'function')
        ? rules.obterOpcoesEngenhoca
        : (typeof window !== 'undefined' && typeof window.obterOpcoesEngenhoca === 'function'
            ? window.obterOpcoesEngenhoca
            : (typeof globalThis !== 'undefined' && typeof globalThis.obterOpcoesEngenhoca === 'function'
                ? globalThis.obterOpcoesEngenhoca
                : (typeof obterOpcoesEngenhoca === 'function' ? obterOpcoesEngenhoca : null)));

      const optsInfo = getOptionsFn ? getOptionsFn(selectedSpell, formaUso) : null;

      if (!attachedItem && !paramForma && optsInfo && optsInfo.formaRecomendada) {
        formaUso = optsInfo.formaRecomendada || formaUso;
      }

      if (optsInfo && Array.isArray(optsInfo.sugestoes) && optsInfo.sugestoes.length >= 3) {
        currentSuggestedNames = optsInfo.sugestoes;
        currentSuggestedDescs = optsInfo.descricoes || [];
      } else {
        const isVest = formaUso === 'vestida';
        currentSuggestedNames = isVest
          ? [`Elmo de ${spellNome} Calibrado`, `Peitoral de ${spellNome} Ressonante`, `Amuleto de ${spellNome}`]
          : [`Emissor de ${spellNome} Portátil`, `Disparador de ${spellNome} Galvanizado`, `Injetor de ${spellNome}`];
        currentSuggestedDescs = currentSuggestedNames.map(n => `Aparato calibrado para reproduzir com maestria os efeitos arcanomecânicos de ${spellNome}.`);
      }

      selectedSuggestionIndex = 0;
      customName = formatarNomeComItem(currentSuggestedNames[0]);
      customDesc = currentSuggestedDescs[0];

      if (nameInputEl) nameInputEl.value = customName;
      if (descInputEl) descInputEl.value = customDesc;
    }

    function renderTelaFabricacao() {
      if (radioEmpunhada) {
        radioEmpunhada.checked = formaUso === 'empunhada';
        radioEmpunhada.disabled = false;
        if (radioEmpunhada.parentElement) {
          radioEmpunhada.parentElement.style.opacity = '1';
          radioEmpunhada.parentElement.style.cursor = 'pointer';
        }
      }
      if (radioVestida) {
        radioVestida.checked = formaUso === 'vestida';
        radioVestida.disabled = false;
        if (radioVestida.parentElement) {
          radioVestida.parentElement.style.opacity = '1';
          radioVestida.parentElement.style.cursor = 'pointer';
        }
      }
      if (recFormaUsoText) {
        recFormaUsoText.textContent = formaUso === 'vestida' ? 'Vestida' : 'Empunhada';
      }

      const totalEspacos = 1;
      const espacosTexto = '1 ESPAÇO';

      if (!selectedSpell) {
        if (spellBadgeLabel) {
          spellBadgeLabel.textContent = 'Nenhuma magia selecionada · Escolha uma magia para simular';
        }
        if (btnTrocarMagia) {
          btnTrocarMagia.textContent = 'ESCOLHER MAGIA';
          btnTrocarMagia.style.borderColor = '#ef4444';
          btnTrocarMagia.style.color = '#fca5a5';
        }
        if (suggestionsListEl) {
          suggestionsListEl.innerHTML = `
            <div style="padding: 12px; background: rgba(30, 41, 59, 0.35); border: 1px dashed #334155; border-radius: 6px; text-align: center;">
              <span style="color: #94a3b8; font-size: 0.85rem;">Nenhuma magia selecionada. Clique em <strong>[ESCOLHER MAGIA]</strong> acima para selecionar a magia no Grimório.</span>
            </div>
          `;
        }
        if (nameInputEl) {
          nameInputEl.value = customName || '';
          nameInputEl.placeholder = 'Escolha uma magia para definir a engenhoca...';
        }
        if (descInputEl) {
          descInputEl.value = customDesc || '';
          descInputEl.placeholder = 'Descrição dos mecanismos, lentes e ressonadores...';
        }
        if (specCustoMateria) specCustoMateria.textContent = '—';
        if (specTempo) specTempo.textContent = '—';
        if (specCdFab) specCdFab.textContent = '—';
        if (specStatsLine) specStatsLine.textContent = `DEF 15 · RD 5 · PV ${halfPv} · 1 ESPAÇO`;
        if (btnForjarEngenhoca) {
          btnForjarEngenhoca.innerHTML = 'ESCOLHER MAGIA NO GRIMÓRIO &rarr;';
        }
        return;
      }

      const spellNome = selectedSpell.nome || selectedSpell.name || 'Magia';
      const circulo = Number(selectedSpell.circulo || selectedSpell.circle || 1);
      const pm = circulo === 1 ? 1 : (circulo === 2 ? 3 : (circulo === 3 ? 6 : (circulo === 4 ? 10 : 15)));

      const custoBase = rules ? rules.custoFabricacaoEngenhoca(pm) : (100 * pm);
      const cdFab = rules ? rules.cdFabricacaoEngenhoca(pm) : (20 + pm);
      const cdAtiv = rules ? rules.cdAtivacaoEngenhoca(pm) : (15 + pm);

      const custoTotal = custoBase;
      const tempoTotal = '1 SEMANA';

      // Atualiza badge de magia simulada
      if (spellBadgeLabel) {
        spellBadgeLabel.textContent = `Simulando: ${spellNome} (${circulo}º Círculo · ${pm} PM)`;
      }
      if (btnTrocarMagia) {
        btnTrocarMagia.textContent = 'TROCAR MAGIA';
        btnTrocarMagia.style.borderColor = '';
        btnTrocarMagia.style.color = '';
      }

      // Sugestões de nomes com sublinhado elegante (Print 1)
      if (suggestionsListEl) {
        suggestionsListEl.innerHTML = currentSuggestedNames.map((sug, idx) => {
          const nomeFormatado = formatarNomeComItem(sug);
          const isSelected = idx === selectedSuggestionIndex;
          return `
            <span class="engenhoca-suggestion-item ${isSelected ? 'is-selected' : ''}" data-index="${idx}" data-raw-name="${esc(sug)}">
              ${esc(nomeFormatado)}
            </span>
          `;
        }).join('');

        suggestionsListEl.querySelectorAll('.engenhoca-suggestion-item').forEach(el => {
          el.addEventListener('click', () => {
            const idx = Number(el.getAttribute('data-index') || 0);
            selectedSuggestionIndex = idx;
            customName = formatarNomeComItem(currentSuggestedNames[idx]);
            customDesc = currentSuggestedDescs[idx] || customDesc;
            if (nameInputEl) nameInputEl.value = customName;
            if (descInputEl) descInputEl.value = customDesc;
            renderTelaFabricacao();
          });
        });
      }

      // Métricas e Estatísticas
      if (specCustoMateria) specCustoMateria.textContent = `T$ ${custoTotal}`;
      if (specTempo) specTempo.textContent = tempoTotal;
      if (specCdFab) specCdFab.textContent = `CD ${cdFab}`;
      if (specStatsLine) specStatsLine.textContent = `DEF 15 · RD 5 · PV ${halfPv} · 1 ESPAÇO`;
      if (btnForjarEngenhoca) {
        btnForjarEngenhoca.innerHTML = 'PROSSEGUIR PARA O TESTE DE FABRICAÇÃO &rarr;';
      }
    }



    // Receptor de seleção de magia disparada pelo Grimório
    window.addEventListener('message', (event) => {
      if (event.data?.channel === 'forja-t20-grimoire-v1' && event.data.type === 'choose' && event.data.id) {
        const spellId = event.data.id;
        const chosen = (spells || []).find(s => s.id === spellId || normalizarId(s.id) === normalizarId(spellId));
        if (chosen) {
          const chosenCirc = Number(chosen.circulo || chosen.circle || 1);
          if (chosenCirc <= maxCirculoEngenhoca) {
            selectedSpell = chosen;
            recalcularOpcoesMagia();
            renderTelaFabricacao();
            fecharModalMagias();
          } else {
            // @ts-ignore
            if (typeof toast === 'function') toast(`Magia de ${chosenCirc}º Círculo não permitida para o seu nível (máximo: ${maxCirculoEngenhoca}º Círculo).`);
          }
        }
      }
    });


    if (btnTrocarMagia) {
      btnTrocarMagia.addEventListener('click', () => {
        window.location.href = `grimorio.html?modo=engenhoca&circuloMax=${maxCirculoEngenhoca}&forma=${encodeURIComponent(formaUso)}`;
      });
    }

    // Input listeners
    if (nameInputEl) {
      nameInputEl.addEventListener('input', () => { customName = nameInputEl.value; });
    }
    if (descInputEl) {
      descInputEl.addEventListener('input', () => { customDesc = descInputEl.value; });
    }

    // Quando o usuário alterna entre Empunhada e Vestida:
    if (radioEmpunhada) {
      radioEmpunhada.addEventListener('change', () => {
        formaUso = 'empunhada';
        recalcularOpcoesMagia();
        renderTelaFabricacao();
      });
    }
    if (radioVestida) {
      radioVestida.addEventListener('change', () => {
        formaUso = 'vestida';
        recalcularOpcoesMagia();
        renderTelaFabricacao();
      });
    }

    // Botão Principal: Prosseguir para o Teste de Fabricação
    if (btnForjarEngenhoca) {
      btnForjarEngenhoca.addEventListener('click', () => {
        if (!selectedSpell) {
          window.location.href = `grimorio.html?modo=engenhoca&circuloMax=${maxCirculoEngenhoca}&forma=${encodeURIComponent(formaUso)}`;
          return;
        }

        const spellNome = selectedSpell.nome || selectedSpell.name || 'Magia';
        const circulo = Number(selectedSpell.circulo || selectedSpell.circle || 1);
        const pm = circulo === 1 ? 1 : (circulo === 2 ? 3 : (circulo === 3 ? 6 : (circulo === 4 ? 10 : 15)));
        const custoBase = rules ? rules.custoFabricacaoEngenhoca(pm) : (100 * pm);
        const cdFab = rules ? rules.cdFabricacaoEngenhoca(pm) : (20 + pm);
        const cdAtiv = rules ? rules.cdAtivacaoEngenhoca(pm) : (15 + pm);
        const custoFinal = custoBase;
        const finalName = (nameInputEl?.value || customName || `Engenhoca de ${spellNome}`).trim();
        const finalDesc = (descInputEl?.value || customDesc || `Aparato calibrado para ${spellNome}`).trim();

        // @ts-ignore
        if (typeof window.abrirModalTesteOficio === 'function') {
          // @ts-ignore
          window.abrirModalTesteOficio({
            titulo: `Fabricar Engenhoca · ${finalName}`,
            subtitulo: `Ofício (engenhoqueiro) · ${circulo}º Círculo`,
            oficioNome: 'Ofício (engenhoqueiro)',
            isEngenhoca: true,
            hasAttachedItem: false,
            cd: cdFab,
            cdAtivacao: cdAtiv,
            custoMateriaPrima: custoFinal,
            bonusOficio: craftBonus,
            bonusInt: intMod,
            hasEngenhosidade: isInventor,
            onConfirm: (resultado) => {
              sessionStorage.removeItem('forja_attached_item');
              if(persistedHero?.finances && resultado.destinatario !== 'aliado'){
                const debit=Math.max(0, Number(resultado.custoDebitar) || 0);
                persistedHero.finances.spent = Math.max(0, Number(persistedHero.finances.spent) || 0) + debit;
                localStorage.setItem('forja-heroi-t20-v1', JSON.stringify(persistedHero));
                try{
                  const key='forja-saldo-personagem-ativo-v1';
                  const published=JSON.parse(localStorage.getItem(key)||'null');
                  if(published?.id===persistedHero.identity?.characterId){
                    published.funds=Math.max(0,Number(published.funds)-debit);
                    localStorage.setItem(key,JSON.stringify(published));
                  }
                }catch(e){}
              }
              if (resultado.sucesso) {
                const customId = 'engenhoca_' + selectedSpell.id + '_' + Date.now();
                const contraptionEntry = {
                  id: customId,
                  nome: finalName,
                  descricao: finalDesc,
                  spellId: selectedSpell.id,
                  spellName: spellNome,
                  circulo,
                  pm,
                  cdAtivacao: cdAtiv,
                  formaUso,
                  espacos: 1,
                  destinatario: resultado.destinatario || 'si',
                  attachedItem: null,
                  inventorPv: halfPv * 2,
                  criadoEm: Date.now()
                };

                const itemTipo = formaUso === 'vestida' ? 'acessorio' : 'engenhoca';
                const itemCat = 'engenhoca';
                const extraProps = formaUso === 'vestida' ? { equipamento: { itemVestido: true } } : {};

                const customItem = {
                  id: customId,
                  contraptionId: customId,
                  nome: finalName,
                  tipo: itemTipo,
                  categoriaId: itemCat,
                  formaUso,
                  espacos: 1,
                  preco: { valor: custoFinal * 3, moeda: 'T$' },
                  descricao: `${finalDesc} (${formaUso === 'empunhada' ? 'Empunhada' : 'Vestida'}). Simula ${spellNome} (${circulo}º Círculo). Ativação: ação padrão, Teste de Ofício (engenhoqueiro) CD ${cdAtiv}. Tamanho Minúsculo, RD 5, Defesa 15, PV ${halfPv}, 1 espaço.`,
                  attachedItem: null,
                  engenhocaInfo: contraptionEntry,
                  ...extraProps
                };

                // Salva no perfil ativo do localStorage
                try {
                  const profKey = 'arsenal-arton-character-profiles-v1';
                  const stored = persistedHero?.arsenal?.storage?.[profKey] || localStorage.getItem(profKey);
                  if (stored) {
                    const parsed = JSON.parse(stored);
                    const activeP = parsed.profiles?.find(p => p.id === 'ficha-ativa') || parsed.profiles?.find(p => p.id === parsed.activeId) || parsed.profiles?.[0];
                    if (activeP) {
                      activeP.contraptions = Array.isArray(activeP.contraptions) ? activeP.contraptions : [];
                      activeP.contraptions.push(contraptionEntry);
                      activeP.customItems = Array.isArray(activeP.customItems) ? activeP.customItems : [];
                      activeP.customItems.push(customItem);
                      activeP.backpack = Array.isArray(activeP.backpack) ? activeP.backpack : [];

                      // Adiciona a engenhoca fabricada na mochila
                      activeP.backpack.push({
                        itemId: customId,
                        instanceId: 'inst_' + customId,
                        quantity: 1,
                        itemName: finalName,
                        displayName: finalName,
                        tipo: itemTipo,
                        categoriaId: itemCat,
                        espacos: 1,
                        isEngenhoca: true,
                        formaUso,
                        contraptionId: customId,
                        attachedItem: null,
                        engenhocaInfo: contraptionEntry,
                        ...extraProps
                      });

                      localStorage.setItem(profKey, JSON.stringify(parsed));
                      if(persistedHero?.arsenal?.storage){
                        persistedHero.arsenal.storage[profKey]=JSON.stringify(parsed);
                        localStorage.setItem('forja-heroi-t20-v1', JSON.stringify(persistedHero));
                      }
                    }
                  }
                  sessionStorage.removeItem('forja_attached_item');
                } catch (e) {
                  console.error('Erro ao salvar engenhoca no profile:', e);
                }

                // @ts-ignore
                if (typeof showToast === 'function') {
                  // @ts-ignore
                  showToast(`Engenhoca "${finalName}" forjada com sucesso!`);
                }
                setTimeout(() => {
                  window.location.href = 'ficha.html';
                }, 900);
              }
            }
          });
        }
      });
    }

    // Inicialização
    if (typeof window !== 'undefined' && window.ForjaTopBar) {
      window.ForjaTopBar.renderTopbar();
      window.ForjaTopBar.aplicarAutohideScroll();
    }
    recalcularOpcoesMagia();
    renderTelaFabricacao();

    // Configura botões de saída para limpar o acoplamento temporário
    document.querySelectorAll('.engenhoca-close-screen-btn, .engenhoca-cancel-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        sessionStorage.removeItem('forja_attached_item');
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarBancadaEngenhoca);
  } else {
    inicializarBancadaEngenhoca();
  }
})();
