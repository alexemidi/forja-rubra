/* Extensão da ficha pronta: moedas, consumo de itens e consulta da mochila. */
(()=>{
  document.documentElement.dataset.sheetInventoryExtension='active';
  // Catálogo estático desta página: construir o índice uma vez, não por clique.
  const itemIndex=new Map((DATA.pdfItems||[]).map(item=>[item.id,item]));
  const catalog=()=>itemIndex;
  const entryId=(entry,index)=>typeof equipEntryId==='function'?equipEntryId(entry,index):(entry.instanceId||entry.id||`${entry.itemId}:${index}`);
  let expandedSheetItemId='';

  function itemText(item,entry){
    const source=item||entry?.itemSnapshot||{};
    return [source?.textos?.descricao,source?.textos?.habilidade,source?.textos?.variavel,source?.descricao,source?.description,source?.efeito,source?.regras]
      .filter(Boolean).join('\n\n')||'Este item não possui descrição cadastrada.';
  }
  function isConsumable(item){
    const key=`${item?.tipo||''} ${item?.categoriaId||''}`.toLowerCase();
    return /(alquim|consum|alimenta|comida|bebida|po[cç][aã]o)/i.test(key);
  }
  function canBeUpgraded(item){
    if(!item) return false;
    const tipo = String(item.tipo||'').toLowerCase();
    return ['arma','armadura','escudo','esoterico','ferramenta','vestuario','item_geral'].includes(tipo);
  }
  const COMBAT_LABELS = {
    corpo_a_corpo: 'Corpo a corpo',
    distancia: 'À distância',
    corpo_a_corpo_e_distancia: 'Corpo a corpo e à distância'
  };
  const GRIP_LABELS = {
    leve: 'Leves',
    uma_mao: 'Uma mão',
    duas_maos: 'Duas mãos'
  };
  const RANGE_LABELS = {
    curto: 'Curto',
    medio: 'Médio',
    longo: 'Longo'
  };
  const DAMAGE_LABELS = {
    corte: 'Corte',
    impacto: 'Impacto',
    perfuracao: 'Perfuração',
    fogo: 'Fogo',
    frio: 'Frio',
    eletricidade: 'Eletricidade',
    acido: 'Ácido',
    trevas: 'Trevas',
    luz: 'Luz',
    essencia: 'Essência'
  };
  const PROPERTY_LABELS = {
    adaptavel:'Adaptável',agil:'Ágil',alongada:'Alongada',arremesso:'Arremesso',
    desbalanceada:'Desbalanceada',dupla:'Dupla',ocultavel:'Ocultável',versatil:'Versátil'
  };
  const WEAPON_PROP_DESCRIPTIONS = {
    adaptavel: 'Adaptável. Pode ser empunhada com uma ou duas mãos. Ao usar com duas mãos, o dano aumenta em um passo ou conforme tabela.',
    agil: 'Ágil. Pode ser usada com Destreza em vez de Força nos testes de ataque.',
    alongada: 'Alongada. Dobra seu alcance natural, mas não permite atacar alvos adjacentes.',
    arremesso: 'Arremesso. Pode ser arremessada no alcance indicado.',
    desbalanceada: 'Desbalanceada. Impõe –2 nos testes de ataque quando usada em uma mão sem treinamento.',
    dupla: 'Dupla. Pode ser usada como duas armas para efeitos de combate com duas armas.',
    ocultavel: 'Ocultável. O tamanho e/ou formato da arma tornam mais fácil escondê-la. Ela fornece +5 em testes de Ladinagem para ocultá-la.',
    versatil: 'Versátil. Pode causar dano de corte ou perfuração, à escolha do atacante a cada ataque.'
  };

  function formatCriticalText(critical){
    if (!critical) return '—';
    if (critical.texto && critical.margem == null && critical.multiplicador == null) {
      return String(critical.texto).replace(/^x(\d+)$/i, '$1x');
    }
    const margin = Number(critical.margem || 20);
    const multiplier = Number(critical.multiplicador || 2);
    if (margin >= 20) return multiplier + 'x';
    if (multiplier <= 2) return String(margin);
    return margin + ',' + multiplier + 'x';
  }
  const TYPE_META = {
    arma: { label: 'ARMAS', icon: '<span class="forja-icon-host">' + (window.IconesForja ? window.IconesForja.get('sword', 'icon-sm') : '') + '</span>' },
    armadura: { label: 'ARMADURAS', icon: '<span class="forja-icon-host">' + (window.IconesForja ? window.IconesForja.get('shield', 'icon-sm') : '') + '</span>' },
    escudo: { label: 'ESCUDOS', icon: '<span class="forja-icon-host">' + (window.IconesForja ? window.IconesForja.get('shield', 'icon-sm') : '') + '</span>' },
    item_geral: { label: 'ITENS GERAIS', icon: '<span class="forja-icon-host">' + (window.IconesForja ? window.IconesForja.get('backpack', 'icon-sm') : '') + '</span>' },
    acessorio: { label: 'ACESSÓRIOS', icon: '<span class="forja-icon-host">' + (window.IconesForja ? window.IconesForja.get('crown', 'icon-sm') : '') + '</span>' },
    municao: { label: 'MUNIÇÕES', icon: '<span class="forja-icon-host">' + (window.IconesForja ? window.IconesForja.get('bow', 'icon-sm') : '') + '</span>' },
    esoterico: { label: 'ESOTÉRICOS', icon: '<span class="forja-icon-host">' + (window.IconesForja ? window.IconesForja.get('sparkles', 'icon-sm') : '') + '</span>' },
    engenhoca: { label: 'ENGENHOCAS', icon: '<span class="forja-icon-host">' + (window.IconesForja ? window.IconesForja.get('gear', 'icon-sm') : '') + '</span>' }
  };

  function statTileHtml(value){
    return '<span class="item-stat-val">' + esc(value == null || value === '' ? '—' : value) + '</span>';
  }
  function itemStatsInfo(item, entry){
    const source=item||entry?.itemSnapshot||{};
    const stats = [];

    const priceVal = Number(entry?.customPrice ?? entry?.price ?? entry?.preco?.valor ?? source?.preco?.valor ?? source?.price ?? 0);
    const priceFormatted = typeof formatTibars === 'function' ? formatTibars(priceVal) : `T$ ${priceVal}`;
    const attached = entry?.attachedItem || entry?.engenhocaInfo?.attachedItem || source?.attachedItem || source?.engenhocaInfo?.attachedItem;
    const isEng = Boolean(entry?.isEngenhoca || entry?.contraptionId || source?.tipo === 'engenhoca' || /engenhoca/i.test(entry?.itemId || '') || entry?.origem === 'engenhoca');
    const spacesVal = attached
      ? ((attached.espacos != null ? Number(attached.espacos) : 0) + 1)
      : Number(entry?.espacos ?? source?.espacos ?? (isEng ? 1 : 0));
    const spacesFormatted = `${spacesVal} esp.`;

    stats.push(statTileHtml(priceFormatted));
    stats.push(statTileHtml(spacesFormatted));

    if (source.tipo === 'arma' && source.arma) {
      const damage = source.arma.dano?.principal || '—';
      const alternatives = Array.isArray(source.arma.dano?.alternativas) ? source.arma.dano.alternativas.filter(Boolean) : [];
      stats.push(statTileHtml(alternatives.length ? damage + ' / ' + alternatives.join(' / ') : damage));
      stats.push(statTileHtml(formatCriticalText(source.arma.critico)));
      stats.push(statTileHtml(GRIP_LABELS[source.arma.empunhaduraId] || source.arma.empunhaduraId || '—'));
      stats.push(statTileHtml(COMBAT_LABELS[source.arma.combateId] || source.arma.combateId || '—'));
      const damageTypes = (source.arma.tipoDanoIds || []).map(t => DAMAGE_LABELS[t] || (String(t).charAt(0).toUpperCase() + String(t).slice(1))).join(' / ') || '—';
      stats.push(statTileHtml(damageTypes));
      stats.push(statTileHtml(RANGE_LABELS[source.arma.alcanceId] || (source.arma.alcanceId ? String(source.arma.alcanceId).charAt(0).toUpperCase() + String(source.arma.alcanceId).slice(1) : '—')));
    } else if (source.tipo === 'armadura' && source.armadura) {
      stats.push(statTileHtml('Def. +' + Number(source.armadura.defesa || 0)));
      stats.push(statTileHtml('Pen. ' + (Number(source.armadura.penalidade || 0) <= 0 ? Number(source.armadura.penalidade || 0) : '-' + Number(source.armadura.penalidade || 0))));
      const isLeve = source.armadura.categoriaId === 'leve' || source.categoriaId === 'leve' || Boolean(source.armadura.usaDestrezaNaDefesa);
      stats.push(statTileHtml(isLeve ? 'Soma Atributo de Defesa' : 'NÃO Soma Atributo de Defesa'));
    } else if (source.tipo === 'escudo' && source.escudo) {
      stats.push(statTileHtml('Def. +' + Number(source.escudo.bonusDefesa || 0)));
      stats.push(statTileHtml('Pen. ' + (Number(source.escudo.penalidade || 0) <= 0 ? Number(source.escudo.penalidade || 0) : '-' + Number(source.escudo.penalidade || 0))));
      if (source.escudo.ataque) {
        stats.push(statTileHtml(source.escudo.ataque.dano?.principal || source.escudo.ataque.dano?.texto || '—'));
        stats.push(statTileHtml(formatCriticalText(source.escudo.ataque.critico)));
      }
    } else {
      const slots = source.equipamento?.slotsPermitidos || [];
      if (slots.length) stats.push(statTileHtml(slots.join(' / ')));
      if (source.equipamento?.itemVestido) stats.push(statTileHtml('Item vestido'));
    }
    return { html: stats.join(''), count: stats.length };
  }
  function itemStatsHtml(item, entry){
    return itemStatsInfo(item, entry).html;
  }

  function inlineDetails(entry,item){
    const source=item||entry?.itemSnapshot||{};
    const title=entry.displayName||entry.itemName||source.nome||'Item';
    const isEngenhoca = Boolean(entry?.isEngenhoca || entry?.contraptionId || source?.tipo === 'engenhoca' || /engenhoca/i.test(entry?.itemId || '') || entry?.origem === 'engenhoca');
    const rawImps = entry.improvements || [];
    const improvements = rawImps.map(choice => {
      if (!choice) return '';
      if (choice.id === 'material_especial' || choice.materialId) {
        const mat = typeof materialById !== 'undefined' ? materialById.get(choice.materialId) : null;
        if (mat) return mat.nome.replace(/_/g, ' ');
        const matCatalog = {
          mitral: 'Mitral',
          adamante: 'Adamante',
          aco_rubi: 'Aço-rubi',
          gelo_eterno: 'Gelo eterno',
          madeira_tollon: 'Madeira de Tollon',
          materia_vermelha: 'Matéria vermelha'
        };
        return (matCatalog[choice.materialId] || choice.materialId || 'Mitral').replace(/_/g, ' ');
      }
      let name = choice.nome || choice.name;
      if (!name && typeof improvementById !== 'undefined') {
        const imp = improvementById.get(choice.id || choice);
        if (imp) name = imp.nome;
      }
      if (!name) name = String(choice.id || choice || '');
      return name.replace(/_/g, ' ');
    }).filter(Boolean);
    const enchantments=(entry.enchantments||[]).map(choice=>choice?.nome||choice?.name||choice?.id).filter(Boolean);

    const typeKey = source.tipo || (isEngenhoca ? 'engenhoca' : 'item_geral');
    const meta = TYPE_META[typeKey] || { label: String(typeKey).replace(/_/g, ' ').toUpperCase(), icon: isEngenhoca ? (window.IconesForja ? window.IconesForja.get('gear', 'icon-sm') : '') : (window.IconesForja ? window.IconesForja.get('backpack', 'icon-sm') : '') };
    const rawCat = source.arma?.categoriaId || source.categoriaId || '';
    const catLabel = rawCat ? String(rawCat).replace(/_/g, ' ').toUpperCase() : '';
    const bookLabel = String(source.livro || source.fonte || 'LIVRO BÁSICO').toUpperCase();

    const priceVal = Number(entry?.customPrice ?? entry?.price ?? entry?.preco?.valor ?? source?.preco?.valor ?? source?.price ?? 0);
    const priceFormatted = typeof formatTibars === 'function' ? formatTibars(priceVal) : `T$ ${priceVal}`;
    const attachedSource = entry?.attachedItem || entry?.engenhocaInfo?.attachedItem || source?.attachedItem || source?.engenhocaInfo?.attachedItem;
    const spacesVal = attachedSource
      ? ((attachedSource.espacos != null ? Number(attachedSource.espacos) : 0) + 1)
      : Number(entry?.espacos ?? source?.espacos ?? (isEngenhoca ? 1 : 0));
    const spacesFormatted = `${spacesVal} esp.`;

    // Tags de propriedades
    let propTags = '';
    let propDescs = '';
    if (source.arma?.propriedadesIds?.length) {
      propTags = '<div class="properties-row">' +
        source.arma.propriedadesIds.map(p => `<span class="property-tag">${esc(String(PROPERTY_LABELS[p] || p).toUpperCase())}</span>`).join('') +
      '</div>';

      source.arma.propriedadesIds.forEach(p => {
        const desc = WEAPON_PROP_DESCRIPTIONS[p];
        if (desc) {
          propDescs += `<div class="info-block info-grant"><p>${esc(desc)}</p></div>`;
        }
      });
    }

    let infoBlocks = '';
    const feats = typeof selectedCharacterFeatures === 'function' ? selectedCharacterFeatures() : [];
    const temArmaduraMecanizada = (typeof RegrasArmaduraMecanizada !== 'undefined' && typeof RegrasArmaduraMecanizada.temPoderArmaduraMecanizada === 'function')
      ? RegrasArmaduraMecanizada.temPoderArmaduraMecanizada(feats)
      : feats.some(f => (f.id === 'inventor_armadura_mecanizada' || f.id === 'armadura_mecanizada' || /armadura mecanizada/i.test(f.nome || '')));

    const eq = typeof equipmentState === 'function' ? equipmentState() : {};
    const isEquippedArmor = typeof matchEquipmentEntry === 'function' ? matchEquipmentEntry(entry, -1, eq.armorId) : eq.armorId === expandedSheetItemId;
    const isEquippedTrailer = typeof matchEquipmentEntry === 'function' ? matchEquipmentEntry(entry, -1, eq.trailerId) : eq.trailerId === expandedSheetItemId;
    const isEquippedShield = typeof matchEquipmentEntry === 'function' ? matchEquipmentEntry(entry, -1, eq.shieldId) : eq.shieldId === expandedSheetItemId;
    const isEquippedWeapon = typeof matchEquipmentEntry === 'function' ? (matchEquipmentEntry(entry, -1, eq.weaponId) || matchEquipmentEntry(entry, -1, eq.offhandId)) : (eq.weaponId === expandedSheetItemId || eq.offhandId === expandedSheetItemId);
    const isEquippedWorn = Array.isArray(eq.wornIds) && (typeof matchEquipmentEntry === 'function' ? eq.wornIds.some(wId => matchEquipmentEntry(entry, -1, wId)) : eq.wornIds.includes(expandedSheetItemId));

    const isAttachedToArmor = Boolean(entry.attachedToArmorId || source.attachedToArmorId);
    const attachedArmorName = entry.attachedToArmorName || source.attachedToArmorName;

    if (isEngenhoca) {
      const info = entry.engenhocaInfo || source.engenhocaInfo || {};
      const desc = info.descricao || source.descricao || source.textos?.descricao || `Aparato inventivo calibrado para reproduzir os efeitos de ${info.spellName || source.nome || 'magia'}.`;
      const spellName = info.spellName || source.nome || 'Magia';
      const circulo = info.circulo ? ` (${info.circulo}º Círculo)` : '';
      const pvTotal = Number(info.inventorPv || (typeof progressionStats === 'function' && progressionStats().pv) || 20);
      const halfPv = Math.max(1, Math.floor(pvTotal / 2));
      const attached = info.attachedItem || source.attachedItem || null;

      const totalEspacos = 1;
      const espacosTexto = '1 espaço';

      const armorIsWornForContraption = isAttachedToArmor && Boolean(eq.armorId && eq.armorId !== 'none');

      infoBlocks = `
        <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 4px;">
          <div class="contraption-block">
            <strong style="color: #f1f5f9; display: block; margin-bottom: 2px; font-size: 0.82rem;">Descrição:</strong>
            <div style="color: #94a3b8; font-size: 0.8rem; line-height: 1.45;">${esc(desc)}</div>
          </div>
          <div class="contraption-block">
            <strong style="color: #f1f5f9; display: block; margin-bottom: 2px; font-size: 0.82rem;">Magia simulada:</strong>
            <div style="color: #cbd5e1; font-size: 0.8rem;">${esc(spellName)}${esc(circulo)}</div>
          </div>
          <div class="contraption-block">
            <strong style="color: #f1f5f9; display: block; margin-bottom: 2px; font-size: 0.82rem;">Atributos:</strong>
            <div style="color: #94a3b8; font-size: 0.76rem; line-height: 1.45;">
              ${espacosTexto} · Minúsculo · RD 5 · Defesa 15 · Ativação: ação padrão · <strong style="color: #f1f5f9;">PV ${halfPv}</strong>
            </div>
          </div>
          ${isAttachedToArmor ? `
            <div class="contraption-block" style="border: 1px solid #7f1d1d; background: rgba(30,14,18,0.7); padding: 8px 10px; border-radius: 6px;">
              <strong style="color: #fca5a5; display: block; font-size: 0.82rem; font-family: Cinzel, serif;">Armadura Mecanizada</strong>
              <div style="color: #e2e8f0; font-size: 0.78rem; margin-top: 2px;">
                Acoplada em: <strong>${esc(attachedArmorName || 'Armadura')}</strong>
              </div>
              <div style="color: #94a3b8; font-size: 0.74rem; margin-top: 4px;">
                ${armorIsWornForContraption
                  ? '<span style="color: #22c55e; font-weight: 700;">● Pronta para ativação</span> · Não ocupa as mãos nem limite de itens vestidos.'
                  : '<span style="color: #f59e0b;">Armadura não está vestida</span> · Vista a armadura para deixar a engenhoca pronta.'}
              </div>
            </div>
          ` : ''}
          ${attached ? `
            <div class="contraption-block">
              <strong style="color: #f1f5f9; display: block; margin-bottom: 2px; font-size: 0.82rem;">Atributos do item: ${esc(attached.nome || 'Item Acoplado')}</strong>
              <div style="color: #cbd5e1; font-size: 0.78rem; line-height: 1.45;">${esc(attached.atributosTexto || 'Item mundano acoplado à engenhoca.')}</div>
            </div>
          ` : ''}
        </div>
      `;
    } else {
      if (source.textos?.habilidade && !source.arma?.propriedadesIds?.length) {
        infoBlocks += `<div class="info-block info-grant"><span class="info-block-title">HABILIDADE CONCEDIDA</span><p>${esc(source.textos.habilidade)}</p></div>`;
      }
      if (source.textos?.variavel) {
        infoBlocks += `<div class="info-block info-rule"><span class="info-block-title">REGRAS E USO</span><p>${esc(source.textos.variavel)}</p></div>`;
      }
      if (source.textos?.descricao || source.descricao) {
        infoBlocks += `<p class="description"><span class="description-label">Descrição</span>${esc(source.textos?.descricao || source.descricao)}</p>`;
      }
    }

    let currentUpgradesHtml = '';
    if (improvements.length || enchantments.length) {
      currentUpgradesHtml = '<div class="info-block" style="border:1px solid #1e293b;background:#0c1118;font-size:0.8rem;padding:8px 10px;">' +
        (improvements.length ? `<div style="color:#60a5fa;margin-bottom:3px;"><span class="icon-host" style="display:inline-flex;vertical-align:middle;margin-right:3px;">${window.IconesForja ? window.IconesForja.get('tools', 'icon-xs') : ''}</span> <strong>Melhorias (${improvements.length}/4):</strong> ${esc(improvements.join(' · '))}</div>` : '') +
        (enchantments.length ? `<div style="color:#c084fc;"><span class="icon-host" style="display:inline-flex;vertical-align:middle;margin-right:3px;">${window.IconesForja ? window.IconesForja.get('sparkles', 'icon-xs') : ''}</span> <strong>Encantos:</strong> ${esc(enchantments.join(' · '))}</div>` : '') +
      '</div>';
    }

    // Identifica tipos considerando engenhocas acopladas
    const attached = entry?.attachedItem || entry?.engenhocaInfo?.attachedItem || source?.attachedItem || source?.engenhocaInfo?.attachedItem;
    const attachedTipo = (attached?.tipo || attached?.categoriaId || '').toLowerCase();
    const isAttachedArmor = attachedTipo === 'armadura' || Boolean(attached?.armadura) || /armadura|gibao|gibão|cota|couraça|couraca|brunea|brúnea/i.test(attached?.nome || '');
    const isAttachedTrailer = attachedTipo === 'vestuario' || /traje|camisa|vestimenta|tunica/i.test(attached?.nome || '');
    const isAttachedShield = attachedTipo === 'escudo' || Boolean(attached?.escudo);
    const isAttachedWeapon = attachedTipo === 'arma' || Boolean(attached?.arma);

    const isArma = (!isEngenhoca && source.tipo === 'arma') || isAttachedWeapon;
    const isEsoterico = !isEngenhoca && (source.tipo === 'esoterico' || source.categoriaId === 'esoterico');
    const isInstrumento = !isEngenhoca && (source.tipo === 'instrumento' || source.categoriaId === 'instrumento' || /instrumento/i.test(source.nome || '') || /instrumento/i.test(title));
    const isArmadura = (!isEngenhoca && source.tipo === 'armadura') || isAttachedArmor;
    const isEscudo = (!isEngenhoca && source.tipo === 'escudo') || isAttachedShield;
    const isMochila = !isEngenhoca && (/mochila/i.test(source.nome || '') || /mochila/i.test(title));
    const isTatuagem = !isEngenhoca && (typeof isTattooItem === 'function' ? isTattooItem(source, entry) : false);
    const isTraje = ((!isEngenhoca && (source.categoriaId === 'vestuario' || source.tipo === 'vestuario' || /(traje|camisa|vestimenta|tunica)/i.test(source.nome || '') || /(traje|camisa|vestimenta|tunica)/i.test(title))) || isAttachedTrailer) && !isMochila && !isTatuagem;
    const isOutroVestivel = !isEngenhoca && !isArmadura && !isEscudo && !isArma && !isEsoterico && !isInstrumento && !isTraje && !isTatuagem && (typeof isWearableItem === 'function' ? isWearableItem(source, entry) : false);

    // Bloco de Armadura Mecanizada
    if (isArmadura && temArmaduraMecanizada) {
      const maxEngArmadura = (typeof RegrasArmaduraMecanizada !== 'undefined' && typeof RegrasArmaduraMecanizada.limiteEngenhocasArmadura === 'function')
        ? RegrasArmaduraMecanizada.limiteEngenhocasArmadura(source)
        : (String(source.categoriaId || source.armadura?.categoriaId || '').includes('pesad') ? 3 : 1);
      const attachedContraptions = Array.isArray(entry.attachedContraptions) ? entry.attachedContraptions : (Array.isArray(source.attachedContraptions) ? source.attachedContraptions : []);

      infoBlocks += `
        <div class="info-block" style="border: 1px solid #7f1d1d; background: rgba(20, 10, 14, 0.7); padding: 10px 12px; margin-top: 8px; border-radius: 6px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <strong style="font-size: 0.78rem; font-family: Cinzel, serif; color: var(--gold2); letter-spacing: 0.5px; text-transform: uppercase;">
              Mecanização (${attachedContraptions.length}/${maxEngArmadura} engenhocas)
            </strong>
            ${attachedContraptions.length < maxEngArmadura ? `
              <button type="button" class="button small primary" data-action="mecanizar-armadura" data-entry-id="${esc(expandedSheetItemId)}" style="font-size: 0.65rem; padding: 2px 8px; min-height: 22px; height: 22px; line-height: 1; border-radius: 4px; cursor: pointer;">
                + Acoplar Engenhoca (T$ 100)
              </button>
            ` : '<span style="font-size: 0.68rem; color: #94a3b8;">Limite de engenhocas atingido</span>'}
          </div>
          ${attachedContraptions.length > 0 ? `
            <div style="display: flex; flex-direction: column; gap: 6px; margin-top: 6px;">
              ${attachedContraptions.map(c => `
                <div style="display: flex; justify-content: space-between; align-items: center; background: #0e1219; border: 1px solid #233146; padding: 6px 8px; border-radius: 4px;">
                  <div>
                    <strong style="font-size: 0.8rem; color: #f1f5f9; display: block;">${esc(c.nome)}</strong>
                    <span style="font-size: 0.72rem; color: #94a3b8;">
                      ${c.spellName ? `${esc(c.spellName)} · ` : ''}CD ${c.cdAtivacao || 15} · ${isEquippedArmor ? '<span style="color: #22c55e; font-weight: 600;">Pronta para uso</span>' : '<span style="color: #cbd5e1;">Armadura não vestida</span>'}
                    </span>
                  </div>
                  <button type="button" class="button small" data-action="desacoplar-engenhoca-armadura" data-armor-entry-id="${esc(expandedSheetItemId)}" data-contraption-id="${esc(c.id)}" style="background: transparent; border: 1px solid #ef4444; color: #fca5a5; font-size: 0.65rem; padding: 2px 6px; border-radius: 4px; cursor: pointer;">
                    Desacoplar
                  </button>
                </div>
              `).join('')}
            </div>
          ` : `
            <div style="font-size: 0.75rem; color: #94a3b8; line-height: 1.4;">
              Você pode gastar T$ 100 e 1 dia de trabalho para acoplar uma engenhoca nesta armadura. Engenhocas acopladas não contam no limite de itens vestidos e não precisam ser empunhadas.
            </div>
          `}
        </div>
      `;
    }

    let bottomSecondaryActions = '';
    const secBtnStyle = 'font-size:0.65rem;padding:2px 8px;min-height:22px;height:22px;line-height:1;background:#141b27;border:1px solid #263345;color:#cbd5e1;border-radius:4px;cursor:pointer;display:inline-flex;align-items:center;gap:4px;';

    if (isArmadura) {
      if (isEquippedArmor) {
        bottomSecondaryActions += `<button type="button" data-equip-action="store-armor" data-entry-id="${esc(expandedSheetItemId)}" style="${secBtnStyle}">${window.IconesForja ? window.IconesForja.get('shield', 'icon-xs') : ''} Guardar</button>`;
      } else if (eq.armorId && eq.armorId !== 'none') {
        bottomSecondaryActions += `<button type="button" data-equip-action="swap-armor" data-entry-id="${esc(expandedSheetItemId)}" style="${secBtnStyle}">${window.IconesForja ? window.IconesForja.get('sync', 'icon-xs') : ''} Trocar</button>`;
      } else {
        bottomSecondaryActions += `<button type="button" data-equip-action="equip-armor" data-entry-id="${esc(expandedSheetItemId)}" style="${secBtnStyle}">${window.IconesForja ? window.IconesForja.get('shield', 'icon-xs') : ''} Vestir</button>`;
      }
    } else if (isEscudo) {
      if (isEquippedShield) {
        bottomSecondaryActions += `<button type="button" data-equip-action="store-shield" data-entry-id="${esc(expandedSheetItemId)}" style="${secBtnStyle}">${window.IconesForja ? window.IconesForja.get('shield', 'icon-xs') : ''} Guardar</button>`;
      } else if (typeof equippedWeaponBlocksShield === 'function' && equippedWeaponBlocksShield()) {
        bottomSecondaryActions += `<span class="tag dim" style="font-size:0.6rem;">Bloqueado</span>`;
      } else {
        bottomSecondaryActions += `<button type="button" data-equip-action="equip-shield" data-entry-id="${esc(expandedSheetItemId)}" style="${secBtnStyle}">${window.IconesForja ? window.IconesForja.get('shield', 'icon-xs') : ''} Equipar</button>`;
      }
    } else if (isTraje) {
      if (isEquippedTrailer) {
        bottomSecondaryActions += `<button type="button" data-equip-action="store-trailer" data-entry-id="${esc(expandedSheetItemId)}" style="${secBtnStyle}">Guardar</button>`;
      } else if (eq.trailerId && eq.trailerId !== 'none') {
        bottomSecondaryActions += `<button type="button" data-equip-action="swap-trailer" data-entry-id="${esc(expandedSheetItemId)}" style="${secBtnStyle}">Trocar</button>`;
      } else {
        bottomSecondaryActions += `<button type="button" data-equip-action="equip-trailer" data-entry-id="${esc(expandedSheetItemId)}" style="${secBtnStyle}">Vestir</button>`;
      }
    } else if (isEngenhoca && isAttachedToArmor) {
      bottomSecondaryActions += `<button type="button" data-action="desacoplar-engenhoca-armadura" data-contraption-id="${esc(expandedSheetItemId)}" style="${secBtnStyle}">${window.IconesForja ? window.IconesForja.get('gear', 'icon-xs') : ''} Desacoplar da Armadura</button>`;
    } else if (isArma || isEsoterico || isInstrumento || (isEngenhoca && (entry.formaUso === 'empunhada' || entry.engenhocaInfo?.formaUso === 'empunhada' || !entry.formaUso))) {
      if (isEquippedWeapon) {
        bottomSecondaryActions += `<button type="button" data-equip-action="store-weapon" data-entry-id="${esc(expandedSheetItemId)}" style="${secBtnStyle}">Guardar</button>`;
      } else {
        bottomSecondaryActions += `<button type="button" data-equip-action="equip-weapon" data-entry-id="${esc(expandedSheetItemId)}" style="${secBtnStyle}">Empunhar</button>`;
      }
    } else if (isTatuagem) {
      if (isEquippedWorn) {
        bottomSecondaryActions += `<button type="button" data-equip-action="cover-tattoo" data-entry-id="${esc(expandedSheetItemId)}" style="${secBtnStyle}">Cobrir</button>`;
      } else {
        bottomSecondaryActions += `<button type="button" data-equip-action="reveal-tattoo" data-entry-id="${esc(expandedSheetItemId)}" style="${secBtnStyle}">Descobrir</button>`;
      }
    } else if (isOutroVestivel || (isEngenhoca && (entry.formaUso === 'vestida' || entry.engenhocaInfo?.formaUso === 'vestida'))) {
      if (isEquippedWorn) {
        bottomSecondaryActions += `<button type="button" data-equip-action="store-accessory" data-entry-id="${esc(expandedSheetItemId)}" style="${secBtnStyle}">Guardar</button>`;
      } else {
        bottomSecondaryActions += `<button type="button" data-equip-action="equip-accessory" data-entry-id="${esc(expandedSheetItemId)}" style="${secBtnStyle}">Vestir</button>`;
      }
    } else if (isConsumable(source)) {
      bottomSecondaryActions += `<button type="button" data-item-spend="use" data-entry-id="${esc(expandedSheetItemId)}" style="${secBtnStyle}" ${Number(entry.quantity || 0) < 1 ? 'disabled' : ''}>Usar</button>`;
    } else if (source.tipo === 'municao') {
      const remaining = Math.max(0, Number(entry.ammoRemaining ?? entry.quantity ?? 0));
      bottomSecondaryActions += `<button type="button" data-item-spend="fire" data-entry-id="${esc(expandedSheetItemId)}" style="${secBtnStyle}" ${remaining < 1 ? 'disabled' : ''}>Disparar ${remaining}</button>`;
    }

    const isAnimalGear = (typeof RegrasMontarias !== 'undefined' && RegrasMontarias.tipoEquipamentoAnimal(source.id || entry.itemId)) || ['sela', 'alforje', 'armadura_de_montaria_leve', 'armadura_de_montaria_pesada'].includes(source.id || entry.itemId);
    const hasMountPartner = (typeof state !== 'undefined' && Array.isArray(state?.partners)) ? state.partners.some(p => typeof mountRecord === 'function' && mountRecord(p)) : false;

    if (isAnimalGear && hasMountPartner) {
      if (entry.mountPartnerId) {
        bottomSecondaryActions += `<button type="button" data-equip-action="unequip-mount-gear" data-entry-id="${esc(expandedSheetItemId)}" style="${secBtnStyle}">Desequipar da Montaria</button>`;
      } else {
        bottomSecondaryActions += `<button type="button" data-equip-action="equip-mount-gear" data-entry-id="${esc(expandedSheetItemId)}" style="${secBtnStyle}">Equipar na Montaria</button>`;
      }
    }

    if (isEngenhoca) {
      bottomSecondaryActions += `<button type="button" data-backpack-action="disassemble" data-entry-id="${esc(expandedSheetItemId)}" style="${secBtnStyle}">${window.IconesForja ? window.IconesForja.get('gear', 'icon-xs') : ''} Desmanchar</button>`;
    } else {
      bottomSecondaryActions += `<button type="button" data-backpack-action="sell" data-entry-id="${esc(expandedSheetItemId)}" title="Vender item" aria-label="Vender item" style="${secBtnStyle};font-size:0.65rem;padding:2px 8px;min-height:22px;height:22px;line-height:1">${window.IconesForja ? window.IconesForja.get('coin', 'icon-xs') : '🪙'}</button>`;
    }

    // @ts-ignore
    const rules = typeof RegrasManufatura !== 'undefined' ? RegrasManufatura : null;
    const canReceiveImprovements = rules && typeof rules.podeReceberMelhorias === 'function' ? rules.podeReceberMelhorias(source) : false;
    const canReceiveEnchantments = rules && typeof rules.podeReceberEncantos === 'function' ? rules.podeReceberEncantos(source) : false;

    // Código de Compartilhamento T20 (Apenas ícone elegante)
    const shareCodeModule = typeof CodigoCompartilhamentoItem !== 'undefined' ? CodigoCompartilhamentoItem : null;
    const shareCode = (shareCodeModule && typeof shareCodeModule.gerar === 'function') ? shareCodeModule.gerar(source, entry) : '';
    let copyCodeBtn = '';
    if (shareCode) {
      copyCodeBtn = `<button type="button" class="square-action-btn btn-copy-share-code" data-share-code="${esc(shareCode)}" title="Copiar código T20 do item" style="color:#38bdf8;">${window.IconesForja ? window.IconesForja.get('copy', 'icon-sm') : '<svg class="forja-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'}</button>`;
    }

    let upgradeActionBtns = '';
    if (canReceiveImprovements || canReceiveEnchantments || copyCodeBtn) {
      upgradeActionBtns = '<div style="display:flex;gap:8px;">' +
        (canReceiveImprovements ? `<button type="button" class="square-action-btn" data-sheet-upgrade-item="${esc(expandedSheetItemId)}" title="Adicionar melhorias">${window.IconesForja ? window.IconesForja.get('tools', 'icon-sm') : 'M'}</button>` : '') +
        (canReceiveEnchantments ? `<button type="button" class="square-action-btn" data-sheet-enchant-item="${esc(expandedSheetItemId)}" title="Adicionar encantos mágicos" style="color:#f59e0b;">${window.IconesForja ? window.IconesForja.get('sparkles', 'icon-sm') : 'E'}</button>` : '') +
        copyCodeBtn +
      '</div>';
    }

    const info=isEngenhoca?{html:'',count:0}:itemStatsInfo(source,entry);
    return ForjaUnificada.renderCardInventario({
      id:expandedSheetItemId,itemId:source.id||entry.itemId,tipo:source.tipo||'item',
      titulo:title,tipoLabel:meta.label,categoria:catLabel,livro:bookLabel,iconeHtml:meta.icon,
      statsHtml:info.html?`<div class="item-stats ${info.count>=5?'has-many-stats':'has-few-stats'}">${info.html}</div>`:'',
      propriedadesHtml:propTags,corpoHtml:propDescs+infoBlocks+currentUpgradesHtml,
      melhoriasHtml:upgradeActionBtns,acoesHtml:bottomSecondaryActions
    });
  }

  function saveInventory(mutator){
    const saved=arsenalState(),updated=RegrasInventario.atualizarPerfis(saved.storage[ARSENAL_PROFILES_KEY],mutator);
    if(updated===null)return false;
    saved.storage[ARSENAL_PROFILES_KEY]=updated;
    persistNow();if(state.finished&&typeof scheduleSaveFinishedCharacter==='function')scheduleSaveFinishedCharacter();
    if(typeof updateSheetEquipmentAndDefenseOnly==='function'&&updateSheetEquipmentAndDefenseOnly())return true;
    renderStage();return true;
  }

  window.isItemConsumable = isConsumable;
  window.isConsumable = isConsumable;
  window.renderItemInlineDetails = inlineDetails;
  window.inlineDetails = inlineDetails;
  try {
    Object.defineProperty(window, 'expandedSheetItemId', {
      get: () => expandedSheetItemId,
      set: (v) => { expandedSheetItemId = v; },
      configurable: true
    });
  } catch (_) {
    window.expandedSheetItemId = expandedSheetItemId;
  }

  const baseRenderEquipmentPanel=renderEquipmentPanel;
  renderEquipmentPanel=function(){
    const host=document.createElement('div');host.innerHTML=baseRenderEquipmentPanel();
    // Garante que não haja botões legados soltos de recompensa
    host.querySelectorAll('.sheet-equipment-backpack > div > button[data-sheet-action="reward"]').forEach(node=>node.remove());
    // Garante classes modernas na lista
    const list=host.querySelector('.sheet-backpack-grid');
    if(list){
      list.classList.add('sheet-general-backpack-list','list-mode');
    }
    // Garante barra de ações rápidas se ainda não estiver presente
    const header=host.querySelector('.sheet-equipment-backpack > div');
    if(header && !header.querySelector('.equipment-quick-actions')){
      const hasCraft=typeof allTrainedOffices==='function'&&allTrainedOffices().length>0;
      const craftBtn=hasCraft?'<button class="button small primary equipment-compact-btn" type="button" data-sheet-action="workshop" title="Oficinas de Fabricação do Herói">Fabricar</button>':'';
      header.insertAdjacentHTML('beforeend','<div class="equipment-quick-actions" style="display:flex;gap:4px;align-items:center;">'+craftBtn+'<button class="button small primary equipment-compact-btn" type="button" data-sheet-action="shop" title="Loja · Arsenal de Arton">Loja</button><button class="button small primary equipment-compact-btn" type="button" data-sheet-action="tavern" title="Taverna de Arton">Taverna</button><button class="button small equipment-compact-btn" type="button" data-sheet-action="reward" title="Adicionar Recompensa">Recompensa</button><button class="button small equipment-compact-btn" type="button" data-sheet-action="import-code" title="Importar Item por Código">Código</button></div>');
    }
    // Converte eventuais cards legados se presentes
    const inventory=characterInventory(),items=catalog();
    host.querySelectorAll('.equip-backpack-card').forEach(card=>{
      const action=card.querySelector('[data-entry-id]');if(!action)return;
      const id=action.dataset.entryId;
      const index=inventory.findIndex((entry,i)=>entryId(entry,i)===id),entry=inventory[index];
      if(!entry)return;const item=items.get(entry.itemId),actions=card.querySelector('.equip-card-actions');
      const info=card.querySelector('.equip-card-info');
      if(info){info.tabIndex=0;info.setAttribute('role','button');info.dataset.itemDetails=id;info.title='Abrir detalhes do item';}
      if(item?.tipo==='municao'){
        const remaining=Math.max(0,Number(entry.ammoRemaining??entry.quantity??0));
        actions?.insertAdjacentHTML('afterbegin',`<button class="button small" type="button" data-item-spend="fire" data-entry-id="${esc(id)}" ${remaining<1?'disabled':''}>Disparar <b>${remaining}</b></button>`);
      }else if(isConsumable(item)){
        actions?.insertAdjacentHTML('afterbegin',`<button class="button small" type="button" data-item-spend="use" data-entry-id="${esc(id)}" ${Number(entry.quantity||0)<1?'disabled':''}>Usar</button>`);
      }
      if(expandedSheetItemId===id){
        card.insertAdjacentHTML('beforeend',inlineDetails(entry,item));
        card.classList.add('is-expanded');
      }
      card.classList.add('backpack-compact-entry');card.dataset.instanceId=id;
      const detail=card.querySelector('.sheet-item-inline-details'),row=document.createElement('div');row.className='backpack-compact-row';
      row.dataset.itemDetails=id;
      row.tabIndex=0;
      row.setAttribute('role','button');
      row.title='Abrir detalhes do item';
      [...card.children].filter(node=>node!==detail).forEach(node=>row.appendChild(node));card.prepend(row);
    });
    // Se um card compacto já existir mas estiver com o id expandido e sem o detalhe:
    if(expandedSheetItemId){
      const expCard=host.querySelector(`.backpack-compact-entry[data-instance-id="${expandedSheetItemId}"]`);
      if(expCard && !expCard.querySelector('.sheet-item-inline-details')){
        const index=inventory.findIndex((entry,i)=>entryId(entry,i)===expandedSheetItemId);
        if(index>=0){
          const entry=inventory[index];
          expCard.insertAdjacentHTML('beforeend',inlineDetails(entry,items.get(entry.itemId)));
          expCard.classList.add('is-expanded');
        }
      }
    }
    return host.innerHTML;
  };

  characterCoins=function(){
    const f=financesState(),result=RegrasPersonagem.moedas(remainingFunds(),f);
    Object.assign(f,result.financas);
    return result.moedas;
  };
  coinSpaces=function(){return RegrasPersonagem.espacosMoedas(characterCoins())};
  sheetMoneyAndLoad=function(){
    const load=sheetInventoryLoad(),c=characterCoins(),space=coinSpaces(),fmt=n=>Number(n).toLocaleString('pt-BR',{maximumFractionDigits:2});
    const arrows=(up,down,canUp,canDown)=>`<div class="coin-arrows"><button type="button" data-coin-action="${up}" title="${canUp?'Converter tudo para cima':'Saldo insuficiente para converter'}" ${canUp?'':'disabled'}>→</button><button type="button" data-coin-action="${down}" title="${canDown?'Converter uma moeda para baixo':'Não há moeda para converter'}" ${canDown?'':'disabled'}>←</button></div>`;
    const loadTooltip = (load.bonusSpaces && load.bonusSpaces > 0)
      ? `title="Limite: ${fmt(load.limit)} espaços (${fmt(load.baseLimit)} base + ${fmt(load.bonusSpaces)} bônus de espaços)"`
      : '';
    const moneyLoadHtml = `<div class="sheet-money-load compact-money-load"><div><small>TC</small><strong>${fmt(c.tc)}</strong></div>${arrows('tc-up','ts-down',c.tc>=10,c.ts>=1)}<div><small>T$</small><strong>${fmt(c.ts)}</strong></div>${arrows('ts-up','to-down',c.ts>=10,c.to>=1)}<div><small>TO</small><strong>${fmt(c.to)}</strong></div><div><small>Moedas</small><strong>${fmt(space)} esp.</strong></div><div ${loadTooltip}><small>Lim. carga</small><strong>${fmt(load.limit)}</strong></div><div><small>Usada</small><strong>${fmt(load.used)}</strong></div><div ${loadTooltip}><small>Máx.</small><strong>${fmt(load.maximum)}</strong></div></div>`;
    const partnersHtml = typeof renderSheetPartnersBlock === 'function' ? renderSheetPartnersBlock() : '';
    return `<div class="sheet-money-load-partners-row">${moneyLoadHtml}</div>`;
  };

  function updateSheetMoneyAndLoadOnly(){
    const row = document.querySelector('.sheet-money-load-partners-row');
    if(row){
      row.outerHTML = sheetMoneyAndLoad();
      return true;
    }
    const containers=document.querySelectorAll('.sheet-money-load');
    if(!containers.length)return false;
    const html=sheetMoneyAndLoad();
    containers.forEach(container=>{
      container.outerHTML=html;
    });
    return true;
  }
  if(typeof window !== 'undefined'){
    window.updateSheetMoneyAndLoadOnly = updateSheetMoneyAndLoadOnly;
  }

  function openDetails(id,trigger){
    expandedSheetItemId=expandedSheetItemId===id?'':id;
    const list=trigger?.closest('.sheet-equipment-sections')||trigger?.closest('.sheet-general-backpack-list')||document.querySelector('.sheet-equipment-sections, .sheet-general-backpack-list');
    if(!list){renderStage();return}
    list.querySelectorAll('.is-expanded').forEach(card=>card.classList.remove('is-expanded'));
    list.querySelectorAll('.sheet-item-inline-details').forEach(detail=>detail.remove());
    if(!expandedSheetItemId)return;
    const inventory=characterInventory(),index=inventory.findIndex((entry,i)=>entryId(entry,i)===id);
    const card=trigger?.closest('.equip-worn-item')||[...list.querySelectorAll('[data-instance-id]')].find(card=>card.dataset.instanceId===id);
    if(index<0||!card){expandedSheetItemId='';return}
    card.classList.add('is-expanded');
    const entry=inventory[index];card.insertAdjacentHTML('beforeend',inlineDetails(entry,catalog().get(entry.itemId)));
  }
  document.addEventListener('click',event=>{
    const expandTrigger = event.target.closest?.('[data-sheet-card-expand]');
    if (expandTrigger) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const card = expandTrigger.closest('.item-card');
      const inlineDetails = expandTrigger.closest('.sheet-item-inline-details');
      if (card) {
        if (card.classList.contains('expanded')) {
          expandedSheetItemId = '';
          inlineDetails?.closest('.backpack-compact-entry')?.classList.remove('is-expanded');
          inlineDetails?.remove();
        } else {
          card.classList.add('expanded');
          const arrow = expandTrigger.querySelector('.expand-arrow');
          const txt = expandTrigger.querySelector('.expand-text');
          if (arrow) arrow.textContent = '▴';
          if (txt) txt.textContent = 'Recolher item';
        }
      }
      return;
    }
    const copyShareBtn = event.target.closest?.('[data-share-code]');
    if (copyShareBtn) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const code = copyShareBtn.dataset.shareCode || '';
      if (code) {
        const copySuccess = () => {
          const originalText = copyShareBtn.innerHTML;
          copyShareBtn.innerHTML = 'Copiado!';
          copyShareBtn.style.color = '#4ade80';
          setTimeout(() => {
            copyShareBtn.innerHTML = originalText;
            copyShareBtn.style.color = '';
          }, 1800);
          if (typeof toast === 'function') toast('Código do item copiado para a área de transferência!');
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(code).then(copySuccess).catch(() => {
            const ta = document.createElement('textarea');
            ta.value = code;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            ta.remove();
            copySuccess();
          });
        } else {
          const ta = document.createElement('textarea');
          ta.value = code;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          ta.remove();
          copySuccess();
        }
      }
      return;
    }

    const detailsTrigger = event.target.closest?.('[data-item-details]');
    if (detailsTrigger&&!event.target.closest?.('[data-equip-action], [data-backpack-action], [data-action], [data-item-spend], [data-share-code], input, select, textarea')) {
      event.preventDefault();
      openDetails(detailsTrigger.dataset.itemDetails,detailsTrigger);
      return;
    }
    const actionClick = event.target.closest?.('button, a, input, select, textarea, [data-equip-action], [data-backpack-action], [data-action], [data-item-spend], [data-sheet-upgrade-item], [data-sheet-enchant-item]');
    if (!actionClick) {
      const compactCard = event.target.closest?.('.backpack-compact-row, .backpack-compact-entry:not(.is-expanded)');
      if (compactCard && !event.target.closest?.('.sheet-item-inline-details')) {
        const id = compactCard.dataset.itemDetails || compactCard.dataset.instanceId || compactCard.closest('.backpack-compact-entry')?.dataset.instanceId;
        if (id) {
          event.preventDefault();
          openDetails(id);
          return;
        }
      }
    }
    const spend=event.target.closest('[data-item-spend]');if(spend){
      event.preventDefault();event.stopImmediatePropagation();const id=spend.dataset.entryId,kind=spend.dataset.itemSpend;
      saveInventory(backpack=>{const result=RegrasInventario.consumir(backpack,id,kind,entryId);if(!result.alterado)return false;
        backpack.splice(0,backpack.length,...result.backpack);
      });toast(kind==='fire'?'Munição disparada.':'Item usado.');return;
    }
    const coin=event.target.closest('[data-coin-action]');if(!coin)return;
    event.preventDefault();event.stopImmediatePropagation();const f=financesState(),c=characterCoins();
    if(coin.dataset.coinAction==='tc-up'){if(c.tc<10)return toast('Não há 10 TC para converter.');f.brokenSilver=0;}
    if(coin.dataset.coinAction==='ts-down'){if(c.ts<1)return toast('Não há T$ para converter.');f.brokenSilver=(f.brokenSilver||0)+1;}
    if(coin.dataset.coinAction==='ts-up'){if(c.ts<10)return toast('Não há T$ 10 para converter.');f.goldCoins=(f.goldCoins||0)+Math.floor(c.ts/10);f.brokenSilver=0;}
    if(coin.dataset.coinAction==='to-down'){if(c.to<1)return toast('Não há TO para converter.');f.goldCoins=Math.max(0,(f.goldCoins||0)-1);}
    persist();
    if(state.finished&&typeof scheduleSaveFinishedCharacter==='function')scheduleSaveFinishedCharacter();
    if(updateSheetMoneyAndLoadOnly())return;
    renderStage();
  },true);

  // ── Modal de Aprimoramento e Encantamento Padronizado (Compra vs Ofício) ─────
  let sheetUpgradeDraft = { itemId: '', entryId: '', mode: 'purchase', kind: 'improvements', improvements: [], enchantments: [] };

  function isCharacterInventor() {
    // @ts-ignore
    const char = typeof state !== 'undefined' ? state : null;
    if (!char) return false;
    if (char.identity?.classId === 'inventor' || char.classe?.id === 'inventor' || char.class?.id === 'inventor') return true;
    if (Array.isArray(char.progression) && char.progression.some(p => p?.classId === 'inventor')) return true;
    if (Array.isArray(char.classes) && char.classes.some(c => c?.id === 'inventor')) return true;
    return false;
  }

  function getAvailableImprovementsForCategory(category){
    const cat = String(category || 'arma').toLowerCase();
    const impData = (typeof DATA !== 'undefined' && DATA.improvementData) ? DATA.improvementData.melhorias : [];
    if (impData && impData.length) {
      return impData.filter(imp => {
        if (!imp.categoriasIds || !imp.categoriasIds.length) return true;
        return imp.categoriasIds.includes(cat) || imp.categoriasIds.includes('geral');
      });
    }
    return [
      { id: 'certeira', nome: 'Certeira', resumo: '+1 nos testes de ataque.' },
      { id: 'pungente', nome: 'Pungente', resumo: '+2 nos testes de ataque.' },
      { id: 'cruel', nome: 'Cruel', resumo: '+1 nas rolagens de dano.' },
      { id: 'atroz', nome: 'Atroz', resumo: '+2 nas rolagens de dano.' },
      { id: 'macica', nome: 'Maciça', resumo: 'Multiplicador de crítico aumenta em +1.' },
      { id: 'precisa', nome: 'Precisa', resumo: 'Margem de ameaça aumenta em +1.' },
      { id: 'equilibrada', nome: 'Equilibrada', resumo: '+2 em manobras de combate.' },
      { id: 'alcance', nome: 'Alongada', resumo: 'Aumenta o alcance da arma em uma categoria.' },
      { id: 'reforcada', nome: 'Reforçada', resumo: '+1 na Defesa ou RD.' },
      { id: 'sob_medida', nome: 'Sob Medida', resumo: 'Penalidade de armadura diminui em 1.' },
      { id: 'ajustada', nome: 'Ajustada', resumo: 'Penalidade de armadura diminui em 1.' },
      { id: 'polida', nome: 'Polida', resumo: '+1 na Defesa no primeiro turno de combate.' },
      { id: 'espinhos', nome: 'Com Espinhos', resumo: 'Pode ser usada para causar dano de perfuração.' },
      { id: 'leve', nome: 'Leve', resumo: 'Ocupa -1 espaço na mochila (mínimo 1).' },
      { id: 'discreta', nome: 'Discreta', resumo: '+5 em testes para ocultar.' },
      { id: 'material_especial', nome: 'Material Especial', resumo: 'Aplica as regras do material especial escolhido.' }
    ];
  }

  function getMaterialsForCategory(category){
    const cat = String(category || 'arma').toLowerCase();
    return [
      { id: 'aco_rubi', nome: 'Aço-Rubi', resumo: 'Ignora 10 pontos de redução de dano e a imunidade a acertos críticos de lefeu.', custo: 6000 },
      { id: 'adamante', nome: 'Adamante', resumo: 'Aumenta o dano da arma em um passo ou fornece RD 2.', custo: cat === 'armadura' ? 18000 : 3000 },
      { id: 'gelo_eterno', nome: 'Gelo Eterno', resumo: 'Armas causam +1d6 de dano de frio.', custo: 1500 },
      { id: 'madeira_tollon', nome: 'Madeira de Tollon', resumo: 'Reduz o custo em PM de magias em 1 (mínimo 1 PM).', custo: 1500 },
      { id: 'materia_vermelha', nome: 'Matéria Vermelha', resumo: 'Recebe +1 na margem de ameaça ou em rolagens de dano.', custo: 1500 },
      { id: 'mitral', nome: 'Mitral', resumo: 'Margem de ameaça +1 ou penalidade de armadura reduzida em 2.', custo: cat === 'armadura' ? 12000 : 1500 }
    ];
  }

  function getAvailableEnchantmentsForCategory(category){
    const cat = String(category || 'arma').toLowerCase();
    const encData = (typeof DATA !== 'undefined' && DATA.enchantmentData) ? DATA.enchantmentData.encantamentos : [];
    if (encData && encData.length) {
      return encData.filter(enc => {
        if (!enc.categoriasItemIds || !enc.categoriasItemIds.length) return true;
        return enc.categoriasItemIds.includes(cat) || enc.categoriasItemIds.includes('geral');
      });
    }
    // Catálogo canônico de encantos de Tormenta 20
    if (cat === 'arma') {
      return [
        { id: 'afiada', nome: 'Afiada', resumo: 'Margem de ameaça aumenta em +1 (cumulativo com outras melhorias).' },
        { id: 'ameacadora', nome: 'Ameaçadora', resumo: 'Margem de ameaça e multiplicador de crítico aumentam em +1.' },
        { id: 'anticriatura', nome: 'Anti-Criatura', resumo: '+2 em testes de ataque e +2d6 em rolagens de dano contra um tipo de criatura.' },
        { id: 'arremesso', nome: 'Arremesso', resumo: 'Pode ser arremessada com alcance médio e retorna à mão do atacante.' },
        { id: 'assassina', nome: 'Assassina', resumo: 'Causa +2d6 de dano extra em ataques furtivos ou emboscadas.' },
        { id: 'congelante', nome: 'Congelante', resumo: 'A arma causa +1d6 pontos de dano de frio.' },
        { id: 'corrosiva', nome: 'Corrosiva', resumo: 'A arma causa +1d6 pontos de dano de ácido.' },
        { id: 'dancarina', nome: 'Dançarina', resumo: 'Pode lutar flutuando por conta própria como uma ação livre.' },
        { id: 'defensora', nome: 'Defensora', resumo: 'Fornece +2 na Defesa enquanto empunhada.' },
        { id: 'destruidora', nome: 'Destruidora', resumo: 'Adiciona dois dados extras ao dano da arma.' },
        { id: 'drenante', nome: 'Drenante', resumo: 'Recupera PV temporários iguais à metade do dano causado.' },
        { id: 'eletrica', nome: 'Elétrica', resumo: 'A arma causa +1d6 pontos de dano de eletricidade.' },
        { id: 'energetica', nome: 'Energética', resumo: 'Ataques são de toque, ignora RD e atinge criaturas incorpóreas (conta como 2 encantos).' },
        { id: 'flamejante', nome: 'Flamejante', resumo: 'A arma causa +1d6 pontos de dano de fogo.' },
        { id: 'formidavel', nome: 'Formidável', resumo: '+2 em testes de ataque e +2 em rolagens de dano.' },
        { id: 'guardiao', nome: 'Guardião', resumo: 'Fornece +4 na Defesa enquanto empunhada (conta como 2 encantos).' },
        { id: 'lancinante', nome: 'Lancinante', resumo: 'Multiplica todos os bônus numéricos de dano no crítico (conta como 2 encantos).' },
        { id: 'magnifica', nome: 'Magnífica', resumo: '+4 em testes de ataque e +4 em rolagens de dano (conta como 2 encantos).' },
        { id: 'trovejante', nome: 'Trovejante', resumo: 'Causa +1d6 de dano de trovão e atordoa em acertos críticos.' },
        { id: 'veloz', nome: 'Veloz', resumo: 'Permite realizar um ataque corpo a corpo adicional por rodada.' }
      ];
    }
    return [
      { id: 'abascanto', nome: 'Abascanto', resumo: 'Fornece +2 em todos os testes de resistência contra magias.' },
      { id: 'aceleradora', nome: 'Aceleradora', resumo: 'Concede uma ação de movimento adicional por rodada.' },
      { id: 'animada', nome: 'Animada', resumo: 'O escudo flutua e protege o usuário sem ocupar as mãos.' },
      { id: 'bastiao', nome: 'Bastião', resumo: 'Aumenta o bônus de Defesa da armadura ou escudo em +2.' },
      { id: 'blindada', nome: 'Blindada', resumo: 'Fornece redução de dano (RD) 5.' },
      { id: 'defensora', nome: 'Defensora', resumo: 'Fornece +2 na Defesa.' },
      { id: 'espinhosa', nome: 'Espinhosa', resumo: 'Causa 2d6 de dano de perfuração ao sofrer manobra ou atacar com escudo.' },
      { id: 'guardiao', nome: 'Guardião', resumo: 'Fornece +4 na Defesa (conta como 2 encantos).' },
      { id: 'invulneravel', nome: 'Invulnerável', resumo: 'Fornece redução de dano (RD) 10 (conta como 2 encantos).' },
      { id: 'polida', nome: 'Polida', resumo: '+2 na Defesa no primeiro turno de combate.' },
      { id: 'refletora', nome: 'Refletora', resumo: 'Pode refletir magias de alvo de volta ao conjurador.' },
      { id: 'sombria', nome: 'Sombria', resumo: '+5 em testes de Furtividade e ignora penalidade de armadura em Furtividade.' }
    ];
  }

  function openInventorUpgradeChoiceModal(entry, item, kind, id) {
    let modal = document.getElementById('sheetInventorChoiceModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'sheetInventorChoiceModal';
      modal.className = 'app-modal';
      document.body.appendChild(modal);
    }

    // @ts-ignore
    const rules = typeof RegrasManufatura !== 'undefined' ? RegrasManufatura : null;
    const reqOffice = rules ? rules.oficioNecessarioParaAprimorar(item) : 'artesao';
    const officeTitle = (rules?.secoesOficina?.[reqOffice]?.title) || `Ofício (${reqOffice})`;
    // @ts-ignore
    const trainedList = typeof allTrainedOffices === 'function' ? allTrainedOffices() : [];
    const hasOffice = trainedList.some(o => (rules ? rules.normalizarOficio(o) : '') === reqOffice);

    // @ts-ignore
    const lvl = typeof effectiveCharacterLevel === 'function' ? effectiveCharacterLevel() : 1;
    // @ts-ignore
    const craftCaps = typeof craftingCapabilities === 'function' ? craftingCapabilities() : { magic: 0, improvements: 4 };

    let canCraft = false;
    let reason = '';
    const isEnchant = kind === 'enchantments';

    if (isEnchant) {
      const hasMagicReq = craftCaps.magic > 0 || lvl >= 9;
      if (!hasOffice) {
        canCraft = false;
        reason = `Requer treino em ${officeTitle}`;
      } else if (!hasMagicReq) {
        canCraft = false;
        reason = `Requer o poder de Inventor "Fabricar Item Mágico" (Nível 9+)`;
      } else {
        canCraft = true;
      }
    } else {
      if (!hasOffice) {
        canCraft = false;
        reason = `Requer treino em ${officeTitle}`;
      } else {
        canCraft = true;
      }
    }

    const titleAction = isEnchant ? 'Encantar' : 'Aprimorar';
    const itemName = entry.displayName || item.nome;

    modal.innerHTML = `
      <section class="modal-panel purchase-upgrade-panel" role="dialog" aria-modal="true" style="width:min(580px,calc(100vw - 24px));background:#0d121a;border:1px solid #2b384e;border-radius:10px;box-shadow:0 16px 40px rgba(0,0,0,0.8);overflow:hidden;">
        <header class="modal-header" style="display:flex;justify-content:space-between;align-items:center;padding:14px 18px;border-bottom:1px solid #1e293b;background:#111620;">
          <h2 style="margin:0;font-size:1.1rem;color:var(--gold2,#ffd700);">${titleAction} · ${esc(itemName)}</h2>
          <button class="modal-close" type="button" data-inventor-choice-close aria-label="Fechar" style="background:transparent;border:0;color:#94a3b8;font-size:1.4rem;cursor:pointer;">×</button>
        </header>

        <div class="modal-body" style="padding:18px;display:flex;flex-direction:column;gap:14px;">
          <p style="margin:0;font-size:0.85rem;color:#cbd5e1;line-height:1.45;">
            Como membro da classe <strong>Inventor</strong>, escolha como deseja obter este benefício:
          </p>

          <div style="display:flex;flex-direction:column;gap:10px;">
            <div style="background:#131a26;border:1px solid #2b384e;border-radius:8px;padding:12px;display:flex;flex-direction:column;gap:8px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <strong style="color:#f8fafc;font-size:0.92rem;">Comprar no Mercado</strong>
                <span class="badge" style="background:#1e293b;color:#94a3b8;font-size:0.7rem;">Preço de Mercado</span>
              </div>
              <p style="margin:0;font-size:0.78rem;color:#94a3b8;line-height:1.4;">
                Adquira a melhoria pronta de artífices e comerciantes de Arton. Você paga o preço integral de mercado em tibares e não precisa fazer teste de perícia.
              </p>
              <div style="display:flex;justify-content:flex-end;">
                <button type="button" class="button small primary" data-inventor-choose-mode="purchase" data-entry-id="${esc(id)}" data-kind="${esc(kind)}" style="padding:6px 14px;font-size:0.78rem;">
                  Comprar no Mercado
                </button>
              </div>
            </div>

            <div style="background:#131a26;border:1px solid ${canCraft ? '#10b981' : '#475569'};border-radius:8px;padding:12px;display:flex;flex-direction:column;gap:8px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <strong style="color:${canCraft ? '#4ade80' : '#94a3b8'};font-size:0.92rem;">Manufaturar com Ofício</strong>
                <span class="badge" style="background:${canCraft ? '#064e3b' : '#1e293b'};color:${canCraft ? '#6ee7b7' : '#94a3b8'};font-size:0.7rem;">⅓ do Custo + Teste</span>
              </div>
              <p style="margin:0;font-size:0.78rem;color:#94a3b8;line-height:1.4;">
                Use suas próprias ferramentas e bancada de trabalho. Pague apenas ⅓ em matéria-prima e realize um teste de Ofício com a CD correspondente.
              </p>
              ${reason ? `<div style="font-size:0.74rem;color:#ef4444;background:rgba(239,68,68,0.1);padding:6px 8px;border-radius:4px;border:1px solid rgba(239,68,68,0.2);">${esc(reason)}</div>` : ''}
              <div style="display:flex;justify-content:flex-end;">
                <button type="button" class="button small" data-inventor-choose-mode="craft" data-entry-id="${esc(id)}" data-kind="${esc(kind)}" ${canCraft ? '' : 'disabled'} style="padding:6px 14px;font-size:0.78rem;${canCraft ? 'background:#059669;border-color:#10b981;color:#fff;' : ''}">
                  Fabricar com Ofício
                </button>
              </div>
            </div>
          </div>
        </div>

        <footer class="modal-actions" style="display:flex;justify-content:flex-end;padding:12px 18px;border-top:1px solid #1e293b;background:#111620;">
          <button class="button secondary" type="button" data-inventor-choice-close style="padding:6px 14px;font-size:0.78rem;">Cancelar</button>
        </footer>
      </section>
    `;

    modal.hidden = false;
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.zIndex = '99999';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.background = 'rgba(5, 7, 11, 0.88)';
    modal.style.backdropFilter = 'blur(6px)';
    modal.style.padding = '12px';
    modal.style.boxSizing = 'border-box';
    modal.style.overflow = 'auto';
    document.body.style.overflow = 'hidden';
  }

  function handleSheetUpgradeClick(id, kind = 'improvements') {
    const inventory = characterInventory();
    const entry = inventory.find((it, i) => entryId(it, i) === id);
    if (!entry) return;
    const item = catalog().get(entry.itemId);
    if (!item) return;

    if (isCharacterInventor()) {
      openInventorUpgradeChoiceModal(entry, item, kind, id);
    } else {
      openSheetUpgradeModal(id, { mode: 'purchase', kind });
    }
  }

  function renderSheetUpgradeModalContent(entry, item){
    const isEnchant = sheetUpgradeDraft.kind === 'enchantments';
    const isCraftMode = sheetUpgradeDraft.mode === 'craft';
    const cat = String(item.tipo || 'arma').toLowerCase();
    // @ts-ignore
    const rules = typeof RegrasManufatura !== 'undefined' ? RegrasManufatura : null;

    if (isEnchant) {
      const currentList = sheetUpgradeDraft.enchantments || [];
      const count = currentList.length;
      const available = getAvailableEnchantmentsForCategory(cat);
      const chosenIds = new Set(currentList.map(c => c.id || c));

      const TABELA_ENCANTOS = rules?.TABELA_ENCANTOS || [0, 18000, 36000, 72000];
      const prevEncCount = (entry.enchantments || []).length;
      const encMarketDiff = Math.max(0, (TABELA_ENCANTOS[count] || 0) - (TABELA_ENCANTOS[prevEncCount] || 0));
      const encMpCost = Math.ceil(encMarketDiff / 3);
      const cdEnc = 20 + count * 5;

      const slotsHtml = [0, 1, 2].map(idx => {
        const choice = currentList[idx];
        if (choice) {
          const encObj = available.find(x => x.id === (choice.id || choice)) || { nome: choice.nome || choice.id || choice, resumo: '' };
          return `
            <div class="upgrade-slot-card filled">
              <div class="slot-badge">${idx + 1}º ENCANTO</div>
              <div class="slot-info">
                <strong>${esc(encObj.nome)}</strong>
                <small>${esc(encObj.resumo || (encObj as any).descricao || '')}</small>
              </div>
              <button type="button" class="slot-remove-btn" data-sheet-enchant-remove="${idx}" title="Remover este encanto">×</button>
            </div>
          `;
        }
        return `
          <div class="upgrade-slot-card empty">
            <div class="slot-badge">${idx + 1}º ENCANTO</div>
            <div class="slot-info">
              <span style="color:var(--muted,#c9b2aa);font-style:italic">Vazio · Selecione um encanto na barra lateral</span>
            </div>
          </div>
        `;
      }).join('');

      const sidebarHtml = available.map(enc => {
        const isChosen = chosenIds.has(enc.id);
        const isFull = count >= 3 && !isChosen;
        return `
          <div class="sidebar-improvement-item ${isChosen ? 'is-active' : ''} ${isFull ? 'is-blocked' : ''}">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:6px;">
              <strong style="font-size:0.82rem;color:${isChosen ? 'var(--gold2,#f5c879)' : 'var(--cream,#f5eee6)'};">${esc(enc.nome)}</strong>
              ${isChosen ? '<span class="tag" style="font-size:0.68rem;">Selecionado</span>' : (isFull ? '<span class="tag" style="font-size:0.68rem;">Limite atingido</span>' : '')}
            </div>
            <p style="font-size:0.73rem;color:var(--muted,#c9b2aa);margin:4px 0 6px 0;line-height:1.35;">${esc(enc.resumo || enc.descricao || '')}</p>
            <div style="display:flex;justify-content:flex-end;">
              ${isChosen
                ? `<button type="button" class="button small danger" data-sheet-enchant-remove-id="${esc(enc.id)}" style="padding:2px 8px;font-size:0.72rem;">Remover</button>`
                : `<button type="button" class="button small primary" data-sheet-enchant-add-id="${esc(enc.id)}" ${isFull ? 'disabled' : ''} style="padding:2px 8px;font-size:0.72rem;">+ Adicionar</button>`}
            </div>
          </div>
        `;
      }).join('');

      const btnActionLabel = isCraftMode
        ? `Encantar na Oficina (T$ ${encMpCost})`
        : (encMarketDiff > 0 ? `Comprar Encantos (+T$ ${encMarketDiff})` : 'Confirmar Encantos');

      return `
        <section class="modal-panel purchase-upgrade-panel" role="dialog" aria-modal="true">
          <header class="modal-header">
            <h2>Encantos · ${esc(entry.displayName || item.nome)}</h2>
            <button class="modal-close" type="button" data-sheet-upgrade-close aria-label="Fechar">×</button>
          </header>

          <div class="modal-body">
            <div class="purchase-improvements-layout">
              <div class="improvements-config-main">
                <div class="item-summary-strip">
                  <div>
                    <strong style="font-size:1rem;color:var(--gold2,#f5c879);">${esc(item.nome)}</strong>
                    <div style="font-size:0.75rem;color:var(--muted,#c9b2aa);">Encantos Atuais: ${prevEncCount}/3 · ${isCraftMode ? 'Modo: Manufatura do Inventor' : 'Modo: Compra no Mercado'}</div>
                  </div>
                  <div style="text-align:right;">
                    <span class="improvement-counter" style="font-size:0.85rem;font-weight:700;color:var(--gold2,#f5c879);">${count}/3 Encantos</span>
                    <div style="font-size:0.95rem;font-weight:700;color:var(--gold2,#f5c879);margin-top:4px;">${isCraftMode ? `Matéria-prima: T$ ${encMpCost} · CD: ${cdEnc}` : `Custo de mercado: +T$ ${encMarketDiff}`}</div>
                  </div>
                </div>

                <div class="slots-container">
                  ${slotsHtml}
                </div>

                <div class="improvements-cost-callout">
                  <strong>Regras de Encantamento:</strong> Um item pode receber até 3 encantos. Cada encanto transforma o item em mágico menor (1º), médio (2º) ou maior (3º).
                </div>
              </div>

              <aside class="improvements-sidebar">
                <div class="sidebar-header">
                  <h3>Encantamentos Disponíveis</h3>
                  <input type="search" class="sidebar-search-input" placeholder="Filtrar encantos..." id="sheetImpSearchInput">
                </div>
                <div class="sidebar-list" id="sheetImpSidebarList">
                  ${sidebarHtml}
                </div>
              </aside>
            </div>
          </div>

          <footer class="modal-actions">
            <button class="secondary-button" type="button" data-sheet-upgrade-close>Voltar</button>
            <div style="display:flex;align-items:center;gap:12px;">
              ${(() => {
                const currentFunds = typeof remainingFunds === 'function' ? remainingFunds() : 0;
                const encCost = isCraftMode ? encMpCost : encMarketDiff;
                if (encCost > currentFunds) {
                  return `<span style="color:#ef4444;font-size:0.85rem;font-weight:700;">Saldo insuficiente (Você tem T$ ${currentFunds}, faltam T$ ${encCost - currentFunds})</span>`;
                }
                return '';
              })()}
              <button class="primary-button" type="button" data-sheet-upgrade-confirm ${(() => {
                const currentFunds = typeof remainingFunds === 'function' ? remainingFunds() : 0;
                const encCost = isCraftMode ? encMpCost : encMarketDiff;
                return encCost > currentFunds ? 'disabled' : '';
              })()}>
                ${btnActionLabel}
              </button>
            </div>
          </footer>
        </section>
      `;
    }

    // Caso de Melhorias Mundanas e Materiais Especiais
    const currentList = sheetUpgradeDraft.improvements || [];
    const count = currentList.length;
    const available = getAvailableImprovementsForCategory(cat);
    const materials = getMaterialsForCategory(cat);
    const chosenIds = new Set(currentList.map(c => c.id));
    const selectedMat = currentList.find(c => c.id === 'material_especial')?.materialId || '';

    // Slots
    const slotsHtml = [0, 1, 2, 3].map(idx => {
      const choice = currentList[idx];
      if (choice) {
        let label = choice.nome || choice.id;
        const impObj = available.find(x => x.id === choice.id);
        if (choice.id === 'material_especial') {
          const m = materials.find(x => x.id === choice.materialId);
          label = m ? 'Material: ' + m.nome : 'Material Especial';
        }
        return `
          <div class="upgrade-slot-card filled">
            <div class="slot-badge">${idx + 1}ª MELHORIA</div>
            <div class="slot-info">
              <strong>${esc(label)}</strong>
              <small>${esc(impObj?.resumo || '')}</small>
            </div>
            <button type="button" class="slot-remove-btn" data-sheet-upgrade-remove="${idx}" title="Remover esta melhoria">×</button>
          </div>
        `;
      }
      return `
        <div class="upgrade-slot-card empty">
          <div class="slot-badge">${idx + 1}ª MELHORIA</div>
          <div class="slot-info">
            <span style="color:var(--muted,#c9b2aa);font-style:italic">Espaço vazio (selecione na barra lateral)</span>
          </div>
        </div>
      `;
    }).join('');

    // Materiais
    const materialCards = materials.map(mat => {
      const isSelected = selectedMat === mat.id;
      return `
        <div class="material-choice-card ${isSelected ? 'selected' : ''}" data-sheet-upgrade-material="${esc(mat.id)}" style="cursor:pointer;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <strong style="color:var(--gold2,#f5c879);">${esc(mat.nome)}</strong>
            <span class="badge" style="font-weight:700;">+T$ ${mat.custo}</span>
          </div>
          <p style="font-size:0.75rem;margin:0;color:var(--muted,#c9b2aa);line-height:1.35;">${esc(mat.resumo)}</p>
        </div>
      `;
    }).join('');

    // Catálogo lateral
    const sidebarHtml = available.map(imp => {
      const isChosen = chosenIds.has(imp.id);
      const isFull = count >= 4 && !isChosen;
      return `
        <div class="sidebar-improvement-item ${isChosen ? 'is-active' : ''} ${isFull ? 'is-blocked' : ''}">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:6px;">
            <strong style="font-size:0.82rem;color:${isChosen ? 'var(--gold2,#f5c879)' : 'var(--cream,#f5eee6)'};">${esc(imp.nome)}</strong>
            ${isChosen ? '<span class="tag" style="font-size:0.68rem;">Selecionada</span>' : (isFull ? '<span class="tag" style="font-size:0.68rem;">Limite atingido</span>' : '')}
          </div>
          <p style="font-size:0.73rem;color:var(--muted,#c9b2aa);margin:4px 0 6px 0;line-height:1.35;">${esc(imp.resumo || '')}</p>
          <div style="display:flex;justify-content:flex-end;">
            ${isChosen
              ? `<button type="button" class="button small danger" data-sheet-upgrade-remove-id="${esc(imp.id)}" style="padding:2px 8px;font-size:0.72rem;">Remover</button>`
              : `<button type="button" class="button small primary" data-sheet-upgrade-add-id="${esc(imp.id)}" ${isFull ? 'disabled' : ''} style="padding:2px 8px;font-size:0.72rem;">+ Adicionar</button>`}
          </div>
        </div>
      `;
    }).join('');

    // Preços
    const originalCount = (entry.improvements || []).length;
    let materialCostDiff = 0;
    if (selectedMat) {
      const matObj = materials.find(m => m.id === selectedMat);
      if (matObj) materialCostDiff = matObj.custo;
    }
    const TABELA_MELHORIAS = [0, 300, 900, 3000, 9000];
    const diffMelhoriasFallback = Math.max(0, (TABELA_MELHORIAS[count] || 0) - (TABELA_MELHORIAS[originalCount] || 0));
    const aprimoramentoInfo = rules
      ? rules.calcularAprimoramentoItemExistente(item, originalCount, count, materialCostDiff)
      : { custoMercadoMelhoria: diffMelhoriasFallback + materialCostDiff, custoMateriaPrima: Math.ceil((diffMelhoriasFallback + materialCostDiff) / 3), cdFabricacao: 20 + count * 5 };

    const hasSpecialMaterialSlot = currentList.some(c => c.id === 'material_especial');
    const needsMaterialChoice = hasSpecialMaterialSlot && !selectedMat;

    const currentFunds = typeof remainingFunds === 'function' ? remainingFunds() : 0;
    const cost = isCraftMode ? aprimoramentoInfo.custoMateriaPrima : aprimoramentoInfo.custoMercadoMelhoria;
    const hasInsufficientFunds = cost > currentFunds;

    let canConfirm = true;
    let confirmLabel = isCraftMode
      ? `Forjar com Ofício (T$ ${aprimoramentoInfo.custoMateriaPrima})`
      : (aprimoramentoInfo.custoMercadoMelhoria > 0 ? `Comprar Melhorias (+T$ ${aprimoramentoInfo.custoMercadoMelhoria})` : 'Confirmar Melhorias');

    if (needsMaterialChoice) {
      canConfirm = false;
      confirmLabel = 'Escolha um Material Especial';
    } else if (hasInsufficientFunds) {
      canConfirm = false;
      confirmLabel = `${confirmLabel} (Saldo Insuficiente)`;
    }

    const titleText = `MELHORIAS · ${(entry.displayName || item.nome).toUpperCase()}`;

    return `
      <section class="modal-panel purchase-upgrade-panel" role="dialog" aria-modal="true">
        <header class="modal-header">
          <h2>${esc(titleText)}</h2>
          <button class="modal-close" type="button" data-sheet-upgrade-close aria-label="Fechar">×</button>
        </header>

        <div class="modal-body">
          <div class="purchase-improvements-layout">
            <div class="improvements-config-main">
              <div class="item-summary-strip" style="background:var(--panel2,#181114);padding:10px 14px;border-radius:6px;border:1px solid var(--line,#4a252a);margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;">
                <div>
                  <strong style="font-size:1rem;color:var(--gold2,#f5c879);">${esc(item.nome)}</strong>
                  <div style="font-size:0.75rem;color:var(--muted,#c9b2aa);">Preço base: T$ ${Number(item.preco?.valor || 0)} · Tipo: ${esc(item.tipo)}</div>
                </div>
                <div style="text-align:right;">
                  <span class="improvement-counter" style="font-size:0.85rem;font-weight:700;color:var(--gold2,#f5c879);">${count}/4 melhorias</span>
                  <div style="font-size:0.95rem;font-weight:700;color:var(--gold2,#f5c879);margin-top:2px;">${isCraftMode ? `Matéria-prima: T$ ${aprimoramentoInfo.custoMateriaPrima} · CD: ${aprimoramentoInfo.cdFabricacao}` : `Total: T$ ${Number(item.preco?.valor || 0) + aprimoramentoInfo.custoMercadoMelhoria}`}</div>
                </div>
              </div>

              <div class="slots-container" style="display:flex;flex-direction:column;gap:8px;">
                ${slotsHtml}
              </div>

              <div class="improvements-cost-callout" style="margin-top:14px;padding:10px 12px;border-radius:6px;background:var(--panel2,#181114);border:1px solid var(--line,#4a252a);font-size:0.8rem;color:var(--cream,#f5eee6);">
                Escolha até 4 melhorias na barra lateral para aprimorar seu item. Ao aprimorar um item já existente, você paga apenas a diferença pelo valor das novas melhorias adicionadas.
              </div>

              <div class="special-material-panel ${needsMaterialChoice ? 'needs-material-selection' : ''}" style="margin-top:14px;padding:12px;background:var(--panel2,#181114);border:1px solid var(--line,#4a252a);border-radius:8px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                  <h4 style="margin:0;font-size:0.9rem;color:var(--gold2,#f5c879);">Escolha o Material Especial</h4>
                  ${needsMaterialChoice
                    ? `<span style="color:#facc15;font-weight:700;font-size:0.76rem;">Selecione um material abaixo para preencher o slot</span>`
                    : `<small style="color:var(--muted,#c9b2aa);font-size:0.72rem;">Clique para selecionar</small>`}
                </div>
                ${needsMaterialChoice ? `<div style="background:rgba(234,179,8,0.15);border:1px solid rgba(234,179,8,0.35);border-radius:6px;padding:6px 10px;margin-bottom:10px;font-size:0.78rem;color:#fef08a;">Você ativou a melhoria <strong>Material Especial</strong>. Escolha um dos materiais abaixo para continuar:</div>` : ''}
                <div class="material-cards-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px;">
                  ${materialCards}
                </div>
              </div>
            </div>

            <aside class="improvements-sidebar">
              <div class="sidebar-header">
                <h3>MELHORIAS DISPONÍVEIS</h3>
                <input type="search" class="sidebar-search-input" placeholder="Filtrar melhorias..." id="sheetImpSearchInput">
              </div>
              <div class="sidebar-list" id="sheetImpSidebarList">
                ${sidebarHtml}
              </div>
            </aside>
          </div>
        </div>

        <footer class="modal-actions">
          <button class="secondary-button" type="button" data-sheet-upgrade-close>Voltar</button>
          <div style="display:flex;align-items:center;gap:12px;">
            ${needsMaterialChoice ? `<span style="color:#facc15;font-size:0.82rem;font-weight:700;">Selecione um material especial no painel à esquerda.</span>` : ''}
            ${!needsMaterialChoice && hasInsufficientFunds ? `<span style="color:#ef4444;font-size:0.85rem;font-weight:700;">Saldo insuficiente (Você tem T$ ${currentFunds}, faltam T$ ${cost - currentFunds})</span>` : ''}
            <button class="primary-button" type="button" data-sheet-upgrade-confirm ${!canConfirm ? 'disabled' : ''}>
              ${confirmLabel}
            </button>
          </div>
        </footer>
      </section>
    `;
  }

  function openSheetUpgradeModal(id, options = {}){
    const inventory = characterInventory();
    const entry = inventory.find((it, i) => entryId(it, i) === id);
    if (!entry) return;
    const item = catalog().get(entry.itemId);
    if (!item) return;

    sheetUpgradeDraft = {
      itemId: item.id,
      entryId: id,
      mode: options.mode || 'purchase',
      kind: options.kind || 'improvements',
      improvements: (entry.improvements || []).map(imp => ({ ...imp })),
      enchantments: (entry.enchantments || []).map(enc => (typeof enc === 'object' ? { ...enc } : enc))
    };

    let modal = document.getElementById('sheetUpgradeModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'sheetUpgradeModal';
      modal.className = 'app-modal';
      document.body.appendChild(modal);
    }
    modal.innerHTML = renderSheetUpgradeModalContent(entry, item);
    modal.hidden = false;
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.zIndex = '99999';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.background = 'rgba(5, 7, 11, 0.88)';
    modal.style.backdropFilter = 'blur(6px)';
    modal.style.padding = '12px';
    modal.style.boxSizing = 'border-box';
    modal.style.overflow = 'auto';
    document.body.style.overflow = 'hidden';

    // Busca rápida
    const searchInput = modal.querySelector('#sheetImpSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        // @ts-ignore
        const q = String(e.target.value || '').toLowerCase();
        modal.querySelectorAll('.sidebar-improvement-item').forEach(el => {
          // @ts-ignore
          el.style.display = el.textContent.toLowerCase().includes(q) ? '' : 'none';
        });
      });
    }
  }

  function closeInventorChoiceModal(){
    const modal = document.getElementById('sheetInventorChoiceModal');
    if (modal) {
      modal.hidden = true;
      modal.style.display = 'none';
    }
    if (typeof window.liberarTravamentoScroll === 'function') {
      window.liberarTravamentoScroll();
    } else {
      document.body.style.overflow = '';
    }
  }

  function closeSheetUpgradeModal(){
    const modal = document.getElementById('sheetUpgradeModal');
    if (modal) {
      modal.hidden = true;
      modal.style.display = 'none';
    }
    if (typeof window.liberarTravamentoScroll === 'function') {
      window.liberarTravamentoScroll();
    } else {
      document.body.style.overflow = '';
    }
  }

  // @ts-ignore
  window.openInventorUpgradeChoiceModal = openInventorUpgradeChoiceModal;
  // @ts-ignore
  window.closeInventorChoiceModal = closeInventorChoiceModal;
  // @ts-ignore
  window.openSheetUpgradeModal = openSheetUpgradeModal;
  // @ts-ignore
  window.closeSheetUpgradeModal = closeSheetUpgradeModal;
  // @ts-ignore
  window.renderSheetUpgradeModalContent = renderSheetUpgradeModalContent;
  // @ts-ignore
  window.getSheetUpgradeDraft = () => sheetUpgradeDraft;
  // @ts-ignore
  window.setSheetUpgradeDraft = (d) => { sheetUpgradeDraft = d; };

  // Tecla Escape para fechar modais
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      const invM = document.getElementById('sheetInventorChoiceModal');
      if (invM && !invM.hidden && invM.style.display !== 'none') {
        closeInventorChoiceModal();
        return;
      }
      const upM = document.getElementById('sheetUpgradeModal');
      if (upM && !upM.hidden && upM.style.display !== 'none') {
        closeSheetUpgradeModal();
        return;
      }
      const mecM = document.getElementById('sheetMecanizarArmaduraModal');
      if (mecM && !mecM.hidden && mecM.style.display !== 'none') {
        closeMecanizarModal();
        return;
      }
    }
  });

  // ── Armadura Mecanizada (Poder de Inventor) ──────────────────────────────────
  function closeMecanizarModal() {
    const modal = document.getElementById('sheetMecanizarArmaduraModal');
    if (modal) {
      modal.hidden = true;
      modal.style.display = 'none';
    }
  }

  function abrirModalMecanizarArmadura(armorEntryId) {
    const inv = characterInventory();
    const armorEntry = inv.find((e, i) => entryId(e, i) === armorEntryId);
    if (!armorEntry) return;

    const item = catalog().get(armorEntry.itemId) || armorEntry;
    // @ts-ignore
    const armRules = typeof RegrasArmaduraMecanizada !== 'undefined' ? RegrasArmaduraMecanizada : (window as any).RegrasArmaduraMecanizada;
    const maxSlots = armRules ? armRules.limiteEngenhocasArmadura(armorEntry, item) : (item?.armadura?.categoriaId === 'pesada' ? 3 : 1);
    const currentAttached = Array.isArray(armorEntry.attachedContraptions) ? armorEntry.attachedContraptions : [];

    if (currentAttached.length >= maxSlots) {
      if (typeof toast === 'function') toast('Esta armadura ja atingiu o limite maximo de engenhocas acopladas.');
      return;
    }

    const todasEngenhocasAcopladas = new Set();
    inv.forEach(e => {
      if (Array.isArray(e.attachedContraptions)) {
        e.attachedContraptions.forEach(ac => {
          const cId = typeof ac === 'string' ? ac : (ac?.id || ac?.contraptionId);
          if (cId) todasEngenhocasAcopladas.add(String(cId));
        });
      }
    });

    const engenhocasDisponiveis = inv.filter((e, i) => {
      const isEng = armRules ? armRules.isEngenhoca(e, catalog().get(e.itemId)) : (e.tipo === 'engenhoca' || e.isEngenhoca || catalog().get(e.itemId)?.tipo === 'engenhoca');
      if (!isEng) return false;
      const eId = entryId(e, i);
      const cId = e.contraptionId || e.id || e.instanceId || eId;
      if (todasEngenhocasAcopladas.has(String(eId)) || todasEngenhocasAcopladas.has(String(cId))) return false;
      return true;
    });

    if (engenhocasDisponiveis.length === 0) {
      if (typeof toast === 'function') toast('Voce nao possui engenhocas livres na mochila para acoplar.');
      return;
    }

    const currentFunds = typeof remainingFunds === 'function' ? remainingFunds() : 0;
    const custo = armRules?.CUSTO_ACOPLAMENTO_TIBAR ?? 100;
    const temSaldo = currentFunds >= custo;

    let modal = document.getElementById('sheetMecanizarArmaduraModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'sheetMecanizarArmaduraModal';
      modal.className = 'app-modal';
      document.body.appendChild(modal);
    }

    const armorName = armorEntry.displayName || item.nome || 'Armadura';

    modal.innerHTML = `
      <section class="modal-panel" role="dialog" aria-modal="true" style="width:min(520px,calc(100vw - 24px));background:var(--panel,#110d0f);border:1px solid var(--line,#4a252a);border-radius:10px;box-shadow:0 16px 40px rgba(0,0,0,0.85);overflow:hidden;color:var(--cream,#f5eee6);">
        <header class="modal-header" style="display:flex;justify-content:space-between;align-items:center;padding:12px 18px;border-bottom:1px solid var(--line,#4a252a);background:var(--panel2,#181114);">
          <h2 style="margin:0;font-size:1.05rem;color:var(--gold2,#f5c879);font-family:var(--font-title,sans-serif);">Armadura Mecanizada · Acoplar Engenhoca</h2>
          <button class="modal-close" type="button" data-mecanizar-close aria-label="Fechar" style="background:transparent;border:0;color:var(--muted,#c9b2aa);font-size:1.3rem;cursor:pointer;line-height:1;">&times;</button>
        </header>

        <div class="modal-body" style="padding:16px;display:flex;flex-direction:column;gap:12px;">
          <p style="margin:0;font-size:0.83rem;color:var(--muted,#c9b2aa);line-height:1.45;">
            Voce pode gastar <strong>T$ 100</strong> e <strong>1 dia de trabalho</strong> para acoplar uma engenhoca em sua armadura. Uma engenhoca acoplada nao conta em seu limite de itens vestidos e nao precisa ser empunhada.
          </p>

          <div style="background:var(--bg2,#100b0d);border:1px solid var(--line,#4a252a);border-radius:6px;padding:10px 12px;font-size:0.8rem;display:flex;justify-content:space-between;align-items:center;">
            <span>Armadura: <strong style="color:var(--cream,#f5eee6);">${esc(armorName)}</strong></span>
            <span style="color:var(--gold2,#f5c879);">${currentAttached.length} / ${maxSlots} engenhocas acopladas</span>
          </div>

          <div style="display:flex;flex-direction:column;gap:8px;">
            <label style="font-size:0.8rem;color:var(--gold2,#f5c879);font-weight:600;">Selecione a engenhoca para acoplar:</label>
            <div style="max-height:200px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;padding-right:4px;">
              ${engenhocasDisponiveis.map((eng, idx) => {
                const engId = entryId(eng, inv.indexOf(eng));
                const engNome = eng.displayName || eng.nome || eng.itemName || 'Engenhoca';
                const engSpells = (eng.engenhocaInfo?.spells || []).map(s => s.nome || s.name || s).join(', ');
                const subtxt = engSpells ? `Efeito: ${engSpells}` : (eng.categoriaId || 'Engenhoca autonoma');
                return `
                  <label style="display:flex;align-items:flex-start;gap:10px;padding:8px 10px;border-radius:6px;background:var(--panel2,#181114);border:1px solid var(--line,#4a252a);cursor:pointer;">
                    <input type="radio" name="mecanizar_contraption_select" value="${esc(engId)}" ${idx === 0 ? 'checked' : ''} style="margin-top:2px;accent-color:var(--red,#c51f2c);">
                    <div style="display:flex;flex-direction:column;gap:2px;">
                      <strong style="font-size:0.83rem;color:var(--cream,#f5eee6);">${esc(engNome)}</strong>
                      <span style="font-size:0.72rem;color:var(--muted,#c9b2aa);">${esc(subtxt)}</span>
                    </div>
                  </label>
                `;
              }).join('')}
            </div>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:var(--bg2,#100b0d);border:1px solid var(--line,#4a252a);border-radius:6px;font-size:0.8rem;">
            <div>
              <span>Custo: <strong style="color:var(--gold2,#f5c879);">T$ ${custo}</strong></span>
              <span style="margin-left:12px;color:var(--muted,#c9b2aa);">Tempo: <strong>1 dia de trabalho</strong></span>
            </div>
            <span style="color:${temSaldo ? 'var(--cream,#f5eee6)' : 'var(--red2,#ea3948)'};">
              Saldo: T$ ${currentFunds}
            </span>
          </div>

          ${!temSaldo ? `
            <div style="color:var(--red2,#ea3948);font-size:0.75rem;padding:6px 10px;background:rgba(197,31,44,0.15);border:1px solid var(--red,#c51f2c);border-radius:4px;">
              Voce nao possui tibares suficientes (necessario T$ ${custo}).
            </div>
          ` : ''}
        </div>

        <footer class="modal-footer" style="display:flex;justify-content:flex-end;gap:8px;padding:12px 16px;border-top:1px solid var(--line,#4a252a);background:var(--panel2,#181114);">
          <button class="button small" type="button" data-mecanizar-close style="background:transparent;border:1px solid var(--line,#4a252a);color:var(--muted,#c9b2aa);">Cancelar</button>
          <button class="button small primary" type="button" data-mecanizar-confirm data-armor-entry-id="${esc(armorEntryId)}" ${!temSaldo ? 'disabled' : ''} style="background:var(--red,#c51f2c);color:#fff;border:0;padding:6px 14px;font-weight:600;border-radius:4px;cursor:${temSaldo ? 'pointer' : 'not-allowed'};">
            Acoplar Engenhoca (T$ ${custo})
          </button>
        </footer>
      </section>
    `;

    modal.hidden = false;
    modal.style.display = 'flex';
  }

  function executarAcoplamentoArmadura(armorEntryId, contraptionEntryId) {
    const inv = characterInventory();
    const armorEntry = inv.find((e, i) => entryId(e, i) === armorEntryId);
    const contEntry = inv.find((e, i) => entryId(e, i) === contraptionEntryId);
    if (!armorEntry || !contEntry) return;

    const currentFunds = typeof remainingFunds === 'function' ? remainingFunds() : 0;
    // @ts-ignore
    const armRules = typeof RegrasArmaduraMecanizada !== 'undefined' ? RegrasArmaduraMecanizada : (window as any).RegrasArmaduraMecanizada;
    const custo = armRules?.CUSTO_ACOPLAMENTO_TIBAR ?? 100;

    if (currentFunds < custo) {
      if (typeof toast === 'function') toast('Saldo insuficiente de tibares.');
      return;
    }

    const f = financesState();
    f.spent = (f.spent || 0) + custo;
    if (typeof (window as any).registrarDespesaAventura === 'function') {
      (window as any).registrarDespesaAventura(custo);
    }

    if (armRules && typeof armRules.acoplarEngenhocaEmArmadura === 'function') {
      armRules.acoplarEngenhocaEmArmadura(armorEntry, contEntry);
    } else {
      armorEntry.attachedContraptions = armorEntry.attachedContraptions || [];
      armorEntry.attachedContraptions.push({
        id: contEntry.contraptionId || contEntry.id || contEntry.instanceId || contraptionEntryId,
        nome: contEntry.displayName || contEntry.itemName || contEntry.nome || 'Engenhoca',
        spells: contEntry.engenhocaInfo?.spells || []
      });
    }

    const eq = equipmentState();
    if (eq.weaponId === contraptionEntryId) eq.weaponId = 'none';
    if (eq.offhandId === contraptionEntryId) eq.offhandId = 'none';
    if (Array.isArray(eq.wornIds)) {
      eq.wornIds = eq.wornIds.filter(wId => wId !== contraptionEntryId);
    }

    closeMecanizarModal();
    persist();
    if (state.finished && typeof scheduleSaveFinishedCharacter === 'function') {
      scheduleSaveFinishedCharacter();
    }
    if (typeof toast === 'function') {
      toast(`Engenhoca acoplada a armadura! T$ ${custo} debitados e 1 dia de trabalho registrado.`);
    }
    renderStage();
  }

  function executarDesacoplamentoArmadura(contraptionId, optArmorEntryId) {
    const inv = characterInventory();
    // @ts-ignore
    const armRules = typeof RegrasArmaduraMecanizada !== 'undefined' ? RegrasArmaduraMecanizada : (window as any).RegrasArmaduraMecanizada;

    let desacoplou = false;
    inv.forEach((entry, i) => {
      if (optArmorEntryId && entryId(entry, i) !== optArmorEntryId) return;
      if (Array.isArray(entry.attachedContraptions)) {
        const idx = entry.attachedContraptions.findIndex(ac => {
          const id = typeof ac === 'string' ? ac : (ac?.id || ac?.contraptionId);
          return id === contraptionId;
        });
        if (idx >= 0) {
          if (armRules && typeof armRules.desacoplarEngenhocaDaArmadura === 'function') {
            armRules.desacoplarEngenhocaDaArmadura(entry, contraptionId);
          } else {
            entry.attachedContraptions.splice(idx, 1);
          }
          desacoplou = true;
        }
      }
    });

    if (desacoplou) {
      persist();
      if (state.finished && typeof scheduleSaveFinishedCharacter === 'function') {
        scheduleSaveFinishedCharacter();
      }
      if (typeof toast === 'function') {
        toast('Engenhoca desacoplada da armadura com sucesso!');
      }
      renderStage();
    }
  }

  // Eventos de Aprimoramento e Encanto na Mochila
  document.addEventListener('click', event => {
    if (event.target === document.getElementById('sheetMecanizarArmaduraModal')) {
      closeMecanizarModal();
      return;
    }
    const mecanizarCloseBtn = event.target.closest?.('[data-mecanizar-close]');
    if (mecanizarCloseBtn) {
      event.preventDefault();
      closeMecanizarModal();
      return;
    }
    const mecanizarConfirmBtn = event.target.closest?.('[data-mecanizar-confirm]');
    if (mecanizarConfirmBtn) {
      event.preventDefault();
      if (mecanizarConfirmBtn.disabled) return;
      const armorEntryId = mecanizarConfirmBtn.dataset.armorEntryId;
      const selectedRadio = document.querySelector('input[name="mecanizar_contraption_select"]:checked');
      if (armorEntryId && selectedRadio) {
        executarAcoplamentoArmadura(armorEntryId, (selectedRadio as HTMLInputElement).value);
      }
      return;
    }
    const mecanizarTrigger = event.target.closest?.('[data-action="mecanizar-armadura"]');
    if (mecanizarTrigger) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const aId = mecanizarTrigger.dataset.entryId || mecanizarTrigger.dataset.armorEntryId;
      if (aId) abrirModalMecanizarArmadura(aId);
      return;
    }
    const desacoplarTrigger = event.target.closest?.('[data-action="desacoplar-engenhoca-armadura"]');
    if (desacoplarTrigger) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const cId = desacoplarTrigger.dataset.contraptionId;
      const aId = desacoplarTrigger.dataset.armorEntryId;
      if (cId) executarDesacoplamentoArmadura(cId, aId);
      return;
    }

    if (event.target === document.getElementById('sheetInventorChoiceModal')) {
      closeInventorChoiceModal();
      return;
    }
    if (event.target === document.getElementById('sheetUpgradeModal')) {
      closeSheetUpgradeModal();
      return;
    }

    const invClose = event.target.closest?.('[data-inventor-choice-close]');
    if (invClose) {
      event.preventDefault();
      closeInventorChoiceModal();
      return;
    }

    const invChoice = event.target.closest?.('[data-inventor-choose-mode]');
    if (invChoice) {
      event.preventDefault();
      const mode = invChoice.dataset.inventorChooseMode || 'purchase';
      const id = invChoice.dataset.entryId;
      const kind = invChoice.dataset.kind || 'improvements';
      const m = document.getElementById('sheetInventorChoiceModal');
      if (m) { m.hidden = true; m.style.display = 'none'; }
      openSheetUpgradeModal(id, { mode, kind });
      return;
    }

    const enchantTrigger = event.target.closest?.('[data-sheet-enchant-item]');
    if (enchantTrigger) {
      event.preventDefault();
      event.stopImmediatePropagation();
      handleSheetUpgradeClick(enchantTrigger.dataset.sheetEnchantItem, 'enchantments');
      return;
    }

    const upgradeTrigger = event.target.closest?.('[data-sheet-upgrade-item]');
    if (upgradeTrigger) {
      event.preventDefault();
      event.stopImmediatePropagation();
      handleSheetUpgradeClick(upgradeTrigger.dataset.sheetUpgradeItem, 'improvements');
      return;
    }

    const closeBtn = event.target.closest?.('[data-sheet-upgrade-close]');
    if (closeBtn) {
      event.preventDefault();
      closeSheetUpgradeModal();
      return;
    }

    // Ações dentro do modal de melhorias e encantos
    const modal = document.getElementById('sheetUpgradeModal');
    if (modal && !modal.hidden) {
      // 1. Encantos
      const addEncBtn = event.target.closest?.('[data-sheet-enchant-add-id]');
      if (addEncBtn) {
        event.preventDefault();
        const encId = addEncBtn.dataset.sheetEnchantAddId;
        const available = getAvailableEnchantmentsForCategory('arma');
        const enc = available.find(x => x.id === encId) || { id: encId, nome: encId };
        sheetUpgradeDraft.enchantments = sheetUpgradeDraft.enchantments || [];
        if (sheetUpgradeDraft.enchantments.length < 3 && !sheetUpgradeDraft.enchantments.some(x => (x.id || x) === encId)) {
          sheetUpgradeDraft.enchantments.push({ id: enc.id, nome: enc.nome });
          const inv = characterInventory();
          const entry = inv.find((it, i) => entryId(it, i) === sheetUpgradeDraft.entryId);
          const item = catalog().get(sheetUpgradeDraft.itemId);
          if (entry && item) modal.innerHTML = renderSheetUpgradeModalContent(entry, item);
        }
        return;
      }

      const removeEncIdxBtn = event.target.closest?.('[data-sheet-enchant-remove]');
      if (removeEncIdxBtn) {
        event.preventDefault();
        const idx = Number(removeEncIdxBtn.dataset.sheetEnchantRemove);
        sheetUpgradeDraft.enchantments = sheetUpgradeDraft.enchantments || [];
        sheetUpgradeDraft.enchantments.splice(idx, 1);
        const inv = characterInventory();
        const entry = inv.find((it, i) => entryId(it, i) === sheetUpgradeDraft.entryId);
        const item = catalog().get(sheetUpgradeDraft.itemId);
        if (entry && item) modal.innerHTML = renderSheetUpgradeModalContent(entry, item);
        return;
      }

      const removeEncIdBtn = event.target.closest?.('[data-sheet-enchant-remove-id]');
      if (removeEncIdBtn) {
        event.preventDefault();
        const encId = removeEncIdBtn.dataset.sheetEnchantRemoveId;
        sheetUpgradeDraft.enchantments = (sheetUpgradeDraft.enchantments || []).filter(x => (x.id || x) !== encId);
        const inv = characterInventory();
        const entry = inv.find((it, i) => entryId(it, i) === sheetUpgradeDraft.entryId);
        const item = catalog().get(sheetUpgradeDraft.itemId);
        if (entry && item) modal.innerHTML = renderSheetUpgradeModalContent(entry, item);
        return;
      }

      // 2. Melhorias
      const addImpBtn = event.target.closest?.('[data-sheet-upgrade-add-id]');
      if (addImpBtn) {
        event.preventDefault();
        const impId = addImpBtn.dataset.sheetUpgradeAddId;
        const inv = characterInventory();
        const entry = inv.find((it, i) => entryId(it, i) === sheetUpgradeDraft.entryId);
        const item = catalog().get(sheetUpgradeDraft.itemId);
        const available = getAvailableImprovementsForCategory(item?.tipo || 'arma');
        const imp = available.find(x => x.id === impId) || { id: impId, nome: impId };
        if (sheetUpgradeDraft.improvements.length < 4 && !sheetUpgradeDraft.improvements.some(x => x.id === impId)) {
          sheetUpgradeDraft.improvements.push({ id: imp.id, nome: imp.nome });
          if (entry && item) modal.innerHTML = renderSheetUpgradeModalContent(entry, item);
        }
        return;
      }

      const removeIdxBtn = event.target.closest?.('[data-sheet-upgrade-remove]');
      if (removeIdxBtn) {
        event.preventDefault();
        const idx = Number(removeIdxBtn.dataset.sheetUpgradeRemove);
        sheetUpgradeDraft.improvements.splice(idx, 1);
        const inv = characterInventory();
        const entry = inv.find((it, i) => entryId(it, i) === sheetUpgradeDraft.entryId);
        const item = catalog().get(sheetUpgradeDraft.itemId);
        if (entry && item) modal.innerHTML = renderSheetUpgradeModalContent(entry, item);
        return;
      }

      const removeIdBtn = event.target.closest?.('[data-sheet-upgrade-remove-id]');
      if (removeIdBtn) {
        event.preventDefault();
        const impId = removeIdBtn.dataset.sheetUpgradeRemoveId;
        sheetUpgradeDraft.improvements = sheetUpgradeDraft.improvements.filter(x => x.id !== impId);
        const inv = characterInventory();
        const entry = inv.find((it, i) => entryId(it, i) === sheetUpgradeDraft.entryId);
        const item = catalog().get(sheetUpgradeDraft.itemId);
        if (entry && item) modal.innerHTML = renderSheetUpgradeModalContent(entry, item);
        return;
      }

      const materialCard = event.target.closest?.('[data-sheet-upgrade-material]');
      if (materialCard) {
        event.preventDefault();
        const matId = materialCard.dataset.sheetUpgradeMaterial;
        const existingIdx = sheetUpgradeDraft.improvements.findIndex(x => x.id === 'material_especial');
        if (existingIdx >= 0) {
          if (sheetUpgradeDraft.improvements[existingIdx].materialId === matId) {
            sheetUpgradeDraft.improvements.splice(existingIdx, 1);
          } else {
            sheetUpgradeDraft.improvements[existingIdx] = { id: 'material_especial', materialId: matId };
          }
        } else if (sheetUpgradeDraft.improvements.length < 4) {
          sheetUpgradeDraft.improvements.push({ id: 'material_especial', materialId: matId });
        }
        const inv = characterInventory();
        const entry = inv.find((it, i) => entryId(it, i) === sheetUpgradeDraft.entryId);
        const item = catalog().get(sheetUpgradeDraft.itemId);
        if (entry && item) modal.innerHTML = renderSheetUpgradeModalContent(entry, item);
        return;
      }

      // 3. Botão de Confirmação (Compra ou Fabricação)
      const confirmBtn = event.target.closest?.('[data-sheet-upgrade-confirm]');
      if (confirmBtn) {
        event.preventDefault();
        if (confirmBtn.disabled || confirmBtn.getAttribute('disabled') !== null) return;
        const inv = characterInventory();
        const entry = inv.find((it, i) => entryId(it, i) === sheetUpgradeDraft.entryId);
        const item = catalog().get(sheetUpgradeDraft.itemId);
        if (!entry || !item) return;

        const currentFunds = typeof remainingFunds === 'function' ? remainingFunds() : 0;
        // @ts-ignore
        const rules = typeof RegrasManufatura !== 'undefined' ? RegrasManufatura : null;
        const isEnchant = sheetUpgradeDraft.kind === 'enchantments';
        const isCraft = sheetUpgradeDraft.mode === 'craft';

        if (isEnchant) {
          const prevCount = (entry.enchantments || []).length;
          const newCount = (sheetUpgradeDraft.enchantments || []).length;
          const TABELA_ENCANTOS = rules?.TABELA_ENCANTOS || [0, 18000, 36000, 72000];
          const custoMercado = Math.max(0, (TABELA_ENCANTOS[newCount] || 0) - (TABELA_ENCANTOS[prevCount] || 0));
          const custoMateriaPrima = Math.ceil(custoMercado / 3);
          const encCost = isCraft ? custoMateriaPrima : custoMercado;

          if (encCost > currentFunds) {
            toast(`Saldo insuficiente. Você possui T$ ${currentFunds}, faltam T$ ${encCost - currentFunds}.`);
            return;
          }

          if (isCraft) {
            closeSheetUpgradeModal();
            // @ts-ignore
            const lvl = typeof effectiveCharacterLevel === 'function' ? effectiveCharacterLevel() : 1;
            // @ts-ignore
            const attrs = typeof finalAttrs === 'function' ? finalAttrs() : { int: 0 };
            const intMod = Number(attrs.int) || 0;
            const halfLevel = Math.floor(lvl / 2);
            // @ts-ignore
            const trainedList = typeof allTrainedOffices === 'function' ? allTrainedOffices() : [];
            const reqOffice = rules ? rules.oficioNecessarioParaAprimorar(item) : 'armeiro';
            const officeTitle = (rules?.secoesOficina?.[reqOffice]?.title) || `Ofício (${reqOffice})`;
            const isTrained = trainedList.some(o => (rules ? rules.normalizarOficio(o) : '') === reqOffice);
            const trainBonus = isTrained ? (lvl >= 15 ? 6 : (lvl >= 7 ? 4 : 2)) : 0;
            const craftBonus = halfLevel + intMod + trainBonus;
            const cdCalculada = 20 + newCount * 5;

            if (typeof window.abrirModalTesteOficio === 'function') {
              window.abrirModalTesteOficio({
                titulo: `Encantar · ${entry.displayName || item.nome}`,
                subtitulo: officeTitle,
                oficioNome: officeTitle,
                cd: cdCalculada,
                custoMateriaPrima,
                bonusOficio: craftBonus,
                isExisting: true,
                onConfirm: (resultado) => {
                  if (resultado.destinatario === 'si') {
                    if (resultado.sucesso) {
                      const f = financesState();
                      if (resultado.custoDebitar > 0) {
                        f.spent = (f.spent || 0) + resultado.custoDebitar;
                        if (typeof window.registrarDespesaAventura === 'function') window.registrarDespesaAventura(resultado.custoDebitar);
                      }
                      saveInventory(backpack => {
                        const draftId = sheetUpgradeDraft.entryId;
                        const target = backpack.find((it, i) => (it.instanceId && it.instanceId === draftId) || (it.uid && it.uid === draftId) || (it.id && it.id === draftId) || entryId(it, i) === draftId) || (sheetUpgradeDraft.itemId ? backpack.find(it => it.itemId === sheetUpgradeDraft.itemId) : null);
                        if (target) {
                          const itObj = catalog().get(target.itemId) || item;
                          const newPrice = Number(target.customPrice || itObj?.preco?.valor || 0) + custoMercado;
                          const newEncs = (sheetUpgradeDraft.enchantments || []).map(enc => (typeof enc === 'object' ? { ...enc } : enc));
                          if ((target.quantity || 1) > 1) {
                            target.quantity -= 1;
                            const newUpgraded = {
                              ...target,
                              instanceId: typeof createInstanceId === 'function' ? createInstanceId() : ('item_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7)),
                              quantity: 1,
                              enchantments: newEncs,
                              customPrice: newPrice,
                              price: newPrice,
                              preco: { valor: newPrice, moeda: 'T$' },
                              unitValue: newPrice
                            };
                            newUpgraded.displayName = typeof configuredItemName === 'function' ? configuredItemName(newUpgraded, itObj) : (target.displayName || itObj?.nome || target.itemId);
                            backpack.push(newUpgraded);
                          } else {
                            target.enchantments = newEncs;
                            target.customPrice = newPrice;
                            target.price = newPrice;
                            target.preco = { valor: newPrice, moeda: 'T$' };
                            target.unitValue = newPrice;
                            if (typeof configuredItemName === 'function') {
                              target.displayName = configuredItemName(target, itObj);
                            }
                          }
                        }
                      });
                      toast(`Item encantado com sucesso! ${resultado.custoDebitar > 0 ? `T$ ${resultado.custoDebitar} debitados.` : ''}`);
                    } else if (resultado.falhaLeve) {
                      const f = financesState();
                      if (resultado.custoDebitar > 0) {
                        f.spent = (f.spent || 0) + resultado.custoDebitar;
                        if (typeof window.registrarDespesaAventura === 'function') window.registrarDespesaAventura(resultado.custoDebitar);
                      }
                      toast(`O encantamento falhou. O item base foi mantido, mas T$ ${resultado.custoDebitar} em matérias-primas foram gastos.`);
                    } else if (resultado.estragou) {
                      const f = financesState();
                      if (resultado.custoDebitar > 0) {
                        f.spent = (f.spent || 0) + resultado.custoDebitar;
                        if (typeof window.registrarDespesaAventura === 'function') window.registrarDespesaAventura(resultado.custoDebitar);
                      }
                      saveInventory(backpack => {
                        const draftId = sheetUpgradeDraft.entryId;
                        const idx = backpack.findIndex((it, i) => (it.instanceId && it.instanceId === draftId) || (it.uid && it.uid === draftId) || (it.id && it.id === draftId) || entryId(it, i) === draftId);
                        if (idx >= 0) backpack.splice(idx, 1);
                      });
                      toast('Falha crítica por 5 ou mais: o item foi estragado e perdido.');
                    }
                  }
                  persistNow();
                  if (state.finished && typeof saveFinishedCharacter === 'function') saveFinishedCharacter();
                  if (typeof window.liberarTravamentoScroll === 'function') window.liberarTravamentoScroll();
                  renderStage();
                }
              });
            }
          } else {
            // Modo de compra de mercado
            if (custoMercado > 0 && remainingFunds() < custoMercado) {
              toast(`Fundos insuficientes. Você possui T$ ${remainingFunds()} e o custo é T$ ${custoMercado}.`);
              return;
            }
            if (custoMercado > 0) {
              const f = financesState();
              f.spent = (f.spent || 0) + custoMercado;
              if (typeof window.registrarDespesaAventura === 'function') window.registrarDespesaAventura(custoMercado);
            }
            saveInventory(backpack => {
              const draftId = sheetUpgradeDraft.entryId;
              const target = backpack.find((it, i) => (it.instanceId && it.instanceId === draftId) || (it.uid && it.uid === draftId) || (it.id && it.id === draftId) || entryId(it, i) === draftId) || (sheetUpgradeDraft.itemId ? backpack.find(it => it.itemId === sheetUpgradeDraft.itemId) : null);
              if (target) {
                const itObj = catalog().get(target.itemId) || item;
                const newPrice = Number(target.customPrice || itObj?.preco?.valor || 0) + custoMercado;
                const newEncs = (sheetUpgradeDraft.enchantments || []).map(enc => (typeof enc === 'object' ? { ...enc } : enc));
                if ((target.quantity || 1) > 1) {
                  target.quantity -= 1;
                  const newUpgraded = {
                    ...target,
                    instanceId: typeof createInstanceId === 'function' ? createInstanceId() : ('item_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7)),
                    quantity: 1,
                    enchantments: newEncs,
                    customPrice: newPrice,
                    price: newPrice,
                    preco: { valor: newPrice, moeda: 'T$' },
                    unitValue: newPrice
                  };
                  newUpgraded.displayName = typeof configuredItemName === 'function' ? configuredItemName(newUpgraded, itObj) : (target.displayName || itObj?.nome || target.itemId);
                  backpack.push(newUpgraded);
                } else {
                  target.enchantments = newEncs;
                  target.customPrice = newPrice;
                  target.price = newPrice;
                  target.preco = { valor: newPrice, moeda: 'T$' };
                  target.unitValue = newPrice;
                  if (typeof configuredItemName === 'function') {
                    target.displayName = configuredItemName(target, itObj);
                  }
                }
              }
            });
            closeSheetUpgradeModal();
            toast(`Encantos adquiridos com sucesso! ${custoMercado > 0 ? `T$ ${custoMercado} debitados.` : ''}`);
            persistNow();
            if (state.finished && typeof saveFinishedCharacter === 'function') saveFinishedCharacter();
            renderStage();
          }
          return;
        }

        // Caso de Melhorias
        const prevCount = (entry.improvements || []).length;
        const newCount = sheetUpgradeDraft.improvements.length;
        let matExtra = 0;
        const chosenMat = sheetUpgradeDraft.improvements.find(x => x.id === 'material_especial')?.materialId;
        const prevMat = (entry.improvements || []).find(x => x.id === 'material_especial')?.materialId;
        if (chosenMat && chosenMat !== prevMat) {
          const matObj = getMaterialsForCategory(item.tipo).find(m => m.id === chosenMat);
          if (matObj) matExtra = matObj.custo;
        }

        const aprimoramento = rules
          ? rules.calcularAprimoramentoItemExistente(item, prevCount, newCount, matExtra)
          : { custoMercadoMelhoria: 300 * Math.max(0, newCount - prevCount) + matExtra, custoMateriaPrima: Math.ceil((300 * Math.max(0, newCount - prevCount) + matExtra) / 3), cdFabricacao: 20 + newCount * 5 };

        const hasMatSlot = sheetUpgradeDraft.improvements.some(x => x.id === 'material_especial');
        if (hasMatSlot && !chosenMat) {
          toast('Por favor, escolha um Material Especial antes de continuar.');
          return;
        }

        const cost = isCraft ? aprimoramento.custoMateriaPrima : aprimoramento.custoMercadoMelhoria;
        if (cost > currentFunds) {
          toast(`Saldo insuficiente. Você possui T$ ${currentFunds}, faltam T$ ${cost - currentFunds}.`);
          return;
        }

        if (aprimoramento.custoMercadoMelhoria <= 0 && newCount === prevCount && chosenMat === prevMat) {
          toast('Nenhuma nova melhoria foi selecionada.');
          closeSheetUpgradeModal();
          return;
        }

        if (isCraft) {
          closeSheetUpgradeModal();
          // @ts-ignore
          const lvl = typeof effectiveCharacterLevel === 'function' ? effectiveCharacterLevel() : 1;
          // @ts-ignore
          const attrs = typeof finalAttrs === 'function' ? finalAttrs() : { int: 0 };
          const intMod = Number(attrs.int) || 0;
          const halfLevel = Math.floor(lvl / 2);
          // @ts-ignore
          const trainedList = typeof allTrainedOffices === 'function' ? allTrainedOffices() : [];
          const reqOffice = rules ? rules.oficioNecessarioParaAprimorar(item) : 'armeiro';
          const officeTitle = (rules?.secoesOficina?.[reqOffice]?.title) || `Ofício (${reqOffice})`;
          const isTrained = trainedList.some(o => (rules ? rules.normalizarOficio(o) : '') === reqOffice);
          const trainBonus = isTrained ? (lvl >= 15 ? 6 : (lvl >= 7 ? 4 : 2)) : 0;
          const craftBonus = halfLevel + intMod + trainBonus;
          const cdCalculada = aprimoramento.cdFabricacao || (20 + (newCount * 5));

          if (typeof window.abrirModalTesteOficio === 'function') {
            window.abrirModalTesteOficio({
              titulo: `Aprimorar · ${entry.displayName || item.nome}`,
              subtitulo: officeTitle,
              oficioNome: officeTitle,
              cd: cdCalculada,
              custoMateriaPrima: aprimoramento.custoMateriaPrima,
              bonusOficio: craftBonus,
              isExisting: true,
              onConfirm: (resultado) => {
                if (resultado.destinatario === 'si') {
                  if (resultado.sucesso) {
                    const f = financesState();
                    if (resultado.custoDebitar > 0) {
                      f.spent = (f.spent || 0) + resultado.custoDebitar;
                      if (typeof window.registrarDespesaAventura === 'function') window.registrarDespesaAventura(resultado.custoDebitar);
                    }
                    saveInventory(backpack => {
                      const draftId = sheetUpgradeDraft.entryId;
                      const target = backpack.find((it, i) => (it.instanceId && it.instanceId === draftId) || (it.uid && it.uid === draftId) || (it.id && it.id === draftId) || entryId(it, i) === draftId) || (sheetUpgradeDraft.itemId ? backpack.find(it => it.itemId === sheetUpgradeDraft.itemId) : null);
                      if (target) {
                        const itObj = catalog().get(target.itemId) || item;
                        const eff = typeof effectiveItemForOptions === 'function' ? effectiveItemForOptions(itObj, target) : itObj;
                        const vInfo = typeof entryValueInfo === 'function' ? entryValueInfo(target, eff) : null;
                        const newPrice = vInfo?.unitKnown ?? (Number(itObj?.preco?.valor || 0) + aprimoramento.custoMercadoMelhoria);
                        const newImps = sheetUpgradeDraft.improvements.map(imp => ({ ...imp }));
                        if ((target.quantity || 1) > 1) {
                          target.quantity -= 1;
                          const newUpgraded = {
                            ...target,
                            instanceId: typeof createInstanceId === 'function' ? createInstanceId() : ('item_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7)),
                            quantity: 1,
                            improvements: newImps,
                            customPrice: newPrice,
                            price: newPrice,
                            preco: { valor: newPrice, moeda: 'T$' },
                            unitValue: newPrice
                          };
                          newUpgraded.displayName = typeof configuredItemName === 'function' ? configuredItemName(newUpgraded, itObj) : (target.displayName || itObj?.nome || target.itemId);
                          backpack.push(newUpgraded);
                        } else {
                          target.improvements = newImps;
                          target.customPrice = newPrice;
                          target.price = newPrice;
                          target.preco = { valor: newPrice, moeda: 'T$' };
                          target.unitValue = newPrice;
                          if (typeof configuredItemName === 'function') {
                            target.displayName = configuredItemName(target, itObj);
                          }
                        }
                      }
                    });
                    toast(`Item aprimorado com sucesso! ${resultado.custoDebitar > 0 ? `T$ ${resultado.custoDebitar} debitados.` : ''}`);
                  } else if (resultado.falhaLeve) {
                    const f = financesState();
                    if (resultado.custoDebitar > 0) {
                      f.spent = (f.spent || 0) + resultado.custoDebitar;
                      if (typeof window.registrarDespesaAventura === 'function') window.registrarDespesaAventura(resultado.custoDebitar);
                    }
                    toast(`Falha no aprimoramento. O item base foi mantido, mas T$ ${resultado.custoDebitar} em matérias-primas foram gastos.`);
                  } else if (resultado.estragou) {
                    const f = financesState();
                    if (resultado.custoDebitar > 0) {
                      f.spent = (f.spent || 0) + resultado.custoDebitar;
                      if (typeof window.registrarDespesaAventura === 'function') window.registrarDespesaAventura(resultado.custoDebitar);
                    }
                    saveInventory(backpack => {
                      const draftId = sheetUpgradeDraft.entryId;
                      const idx = backpack.findIndex((it, i) => (it.instanceId && it.instanceId === draftId) || (it.uid && it.uid === draftId) || (it.id && it.id === draftId) || entryId(it, i) === draftId);
                      if (idx >= 0) backpack.splice(idx, 1);
                    });
                    toast('Falha crítica por 5 ou mais: o item foi estragado e perdido.');
                  }
                } else {
                  if (resultado.sucesso) {
                    saveInventory(backpack => {
                      const draftId = sheetUpgradeDraft.entryId;
                      const idx = backpack.findIndex((it, i) => (it.instanceId && it.instanceId === draftId) || (it.uid && it.uid === draftId) || (it.id && it.id === draftId) || entryId(it, i) === draftId);
                      if (idx >= 0) backpack.splice(idx, 1);
                    });
                    toast('Item aprimorado e entregue ao aliado com sucesso!');
                  } else if (resultado.falhaLeve) {
                    toast('O aprimoramento para o aliado falhou por menos de 5. O item base foi mantido.');
                  } else {
                    saveInventory(backpack => {
                      const draftId = sheetUpgradeDraft.entryId;
                      const idx = backpack.findIndex((it, i) => (it.instanceId && it.instanceId === draftId) || (it.uid && it.uid === draftId) || (it.id && it.id === draftId) || entryId(it, i) === draftId);
                      if (idx >= 0) backpack.splice(idx, 1);
                    });
                    toast('Falha crítica por 5 ou mais: o item do aliado foi estragado e perdido.');
                  }
                }
                persistNow();
                if (state.finished && typeof saveFinishedCharacter === 'function') saveFinishedCharacter();
                if (typeof window.liberarTravamentoScroll === 'function') window.liberarTravamentoScroll();
                renderStage();
              }
            });
          }
        } else {
          // Modo de compra de mercado
          const custo = aprimoramento.custoMercadoMelhoria;
          if (custo > 0 && remainingFunds() < custo) {
            toast(`Fundos insuficientes. Você possui T$ ${remainingFunds()} e o custo é T$ ${custo}.`);
            return;
          }
          if (custo > 0) {
            const f = financesState();
            f.spent = (f.spent || 0) + custo;
            if (typeof window.registrarDespesaAventura === 'function') window.registrarDespesaAventura(custo);
          }
          saveInventory(backpack => {
            const draftId = sheetUpgradeDraft.entryId;
            const target = backpack.find((it, i) => (it.instanceId && it.instanceId === draftId) || (it.uid && it.uid === draftId) || (it.id && it.id === draftId) || entryId(it, i) === draftId) || (sheetUpgradeDraft.itemId ? backpack.find(it => it.itemId === sheetUpgradeDraft.itemId) : null);
            if (target) {
              const itObj = catalog().get(target.itemId) || item;
              const eff = typeof effectiveItemForOptions === 'function' ? effectiveItemForOptions(itObj, target) : itObj;
              const vInfo = typeof entryValueInfo === 'function' ? entryValueInfo(target, eff) : null;
              const newPrice = vInfo?.unitKnown ?? (Number(itObj?.preco?.valor || 0) + custo);
              const newImps = sheetUpgradeDraft.improvements.map(imp => ({ ...imp }));
              if ((target.quantity || 1) > 1) {
                target.quantity -= 1;
                const newUpgraded = {
                  ...target,
                  instanceId: typeof createInstanceId === 'function' ? createInstanceId() : ('item_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7)),
                  quantity: 1,
                  improvements: newImps,
                  customPrice: newPrice,
                  price: newPrice,
                  preco: { valor: newPrice, moeda: 'T$' },
                  unitValue: newPrice
                };
                newUpgraded.displayName = typeof configuredItemName === 'function' ? configuredItemName(newUpgraded, itObj) : (target.displayName || itObj?.nome || target.itemId);
                backpack.push(newUpgraded);
              } else {
                target.improvements = newImps;
                target.customPrice = newPrice;
                target.price = newPrice;
                target.preco = { valor: newPrice, moeda: 'T$' };
                target.unitValue = newPrice;
                if (typeof configuredItemName === 'function') {
                  target.displayName = configuredItemName(target, itObj);
                }
              }
            }
          });
          closeSheetUpgradeModal();
          toast(`Melhorias compradas com sucesso! ${custo > 0 ? `T$ ${custo} debitados.` : ''}`);
          persistNow();
          if (state.finished && typeof saveFinishedCharacter === 'function') saveFinishedCharacter();
          renderStage();
        }
      }
    }
  }, true);
  document.addEventListener('keydown',event=>{const target=event.target.closest?.('[data-item-details]');if(target&&!event.target.closest?.('[data-equip-action], [data-backpack-action], [data-item-spend], input, select, textarea')&&(event.key==='Enter'||event.key===' ')){event.preventDefault();openDetails(target.dataset.itemDetails,target)}});
})();
