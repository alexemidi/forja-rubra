// @ts-check

/**
 * FORJA RUBRA — Módulo de Código de Compartilhamento de Itens (T20 Item Share Code)
 * Formato legível, modular e reversível para exportar, compartilhar e importar qualquer item de Tormenta 20:
 * 
 * Sintaxe canônica:
 * 1. Itens comuns (mundanos, superiores, mágicos, específicos):
 *    T20:[TIPO]:[ID_BASE]:[GRAU]:[MELHORIAS]:[ENCANTAMENTOS]
 *    Exemplos:
 *    - T20:ARM:espada_longa:MUN:0:0
 *    - T20:ARM:espada_longa:SUP:MEL.certeira.pungente:0
 *    - T20:ARMAD:gibao_de_peles:SUP:MEL.material_mitral:0
 *    - T20:ESP:armadura_da_luz:ESP-MAI:0:ENC.defensora
 * 
 * 2. Engenhocas simples:
 *    T20:ENG:[CIR]:[PM]:[SPELL_ID]:[FORMA]
 *    Exemplo:
 *    - T20:ENG:CIR1:PM1:adaga-mental:empunhada
 * 
 * 3. Engenhocas acopladas em item base:
 *    [CÓDIGO_DO_ITEM_BASE]+[CÓDIGO_DA_ENGENHOCA]
 *    Exemplo:
 *    - T20:ARM:espada_longa:SUP:MEL.certeira:0+T20:ENG:CIR1:PM1:adaga-mental:empunhada
 *    - T20:VEST:traje_de_viajante:MUN:0:0+T20:ENG:CIR1:PM1:adaga-mental:vestida
 */

(function () {
  'use strict';

  function slugfy(str) {
    return String(str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  /**
   * Mapeia tipos de item para prefixos canônicos de 3 a 5 letras.
   */
  function mapearTipoParaPrefixo(tipo, categoriaId, itemNome) {
    const t = String(tipo || '').toLowerCase();
    const c = String(categoriaId || '').toLowerCase();
    const n = String(itemNome || '').toLowerCase();

    if (t === 'engenhoca' || c === 'engenhoca') return 'ENG';
    if (t === 'armadura' || c === 'armaduras' || c === 'armadura') return 'ARMAD';
    if (t === 'escudo' || c === 'escudos' || c === 'escudo') return 'ESC';
    if (t === 'arma' || c === 'armas' || c === 'arma') return 'ARM';
    if (t === 'vestuario' || c === 'vestuario' || /traje|camisa|veste|tunica/i.test(n)) return 'VEST';
    if (t === 'esoterico' || c === 'esotericos' || c === 'esoterico') return 'ESOT';
    if (t === 'alquimico' || c === 'alquimicos' || t === 'pocao' || c === 'pocoes') return 'ALQ';
    if (t === 'acessorio' || c === 'acessorios' || c === 'acessorio') return 'ACES';
    if (t === 'especifico' || c === 'especificos' || c === 'especifico') return 'ESP';
    return 'GER';
  }

  /**
   * Mapeia prefixo canônico de volta para tipo e categoria.
   */
  function mapearPrefixoParaTipo(prefixo) {
    switch (String(prefixo || '').toUpperCase()) {
      case 'ARM': return { tipo: 'arma', categoriaId: 'armas' };
      case 'ARMAD': return { tipo: 'armadura', categoriaId: 'armaduras' };
      case 'ESC': return { tipo: 'escudo', categoriaId: 'escudos' };
      case 'VEST': return { tipo: 'vestuario', categoriaId: 'vestuario' };
      case 'ACES': return { tipo: 'acessorio', categoriaId: 'acessorios' };
      case 'ESOT': return { tipo: 'esoterico', categoriaId: 'esotericos' };
      case 'ALQ': return { tipo: 'alquimico', categoriaId: 'alquimicos' };
      case 'ENG': return { tipo: 'engenhoca', categoriaId: 'engenhoca' };
      case 'ESP': return { tipo: 'especifico', categoriaId: 'especificos' };
      default: return { tipo: 'item_geral', categoriaId: 'itens_gerais' };
    }
  }

  /**
   * Gera o código de compartilhamento para uma engenhoca isolada.
   */
  function gerarCodigoEngenhoca(info) {
    if (!info) return 'T20:ENG:CIR1:PM1:adaga-mental:empunhada';
    const cir = Number(info.circulo || info.circle || 1);
    const pm = Number(info.pm || info.custoPm || cir);
    const spell = slugfy(info.spellId || info.spellName || info.magiaId || info.magia || 'adaga-mental').replace(/_/g, '-');
    const forma = String(info.formaUso || info.forma || 'empunhada').toLowerCase();
    return `T20:ENG:CIR${cir}:PM${pm}:${spell}:${forma}`;
  }

  /**
   * Gera o código de compartilhamento universal para qualquer item.
   * @param {Object} item Dados do catálogo ou snapshot
   * @param {Object} [entry] Entrada na mochila ou opções customizadas
   * @returns {string} Código de compartilhamento formatado
   */
  function gerarCodigoCompartilhamento(item, entry) {
    const it = item || {};
    const ent = entry || {};

    const isEng = Boolean(ent.isEngenhoca || ent.contraptionId || it.tipo === 'engenhoca' || ent.engenhocaInfo || it.engenhocaInfo);
    const attached = ent.attachedItem || ent.engenhocaInfo?.attachedItem || it.attachedItem || it.engenhocaInfo?.attachedItem;

    // Se for uma engenhoca acoplada em item base
    if (isEng && attached) {
      const codigoBase = gerarCodigoCompartilhamento(attached, {
        improvements: attached.improvements || attached.melhorias,
        enchantments: attached.enchantments || attached.encantamentos,
        options: attached.options
      });
      const engInfo = ent.engenhocaInfo || it.engenhocaInfo || ent;
      const codigoEng = gerarCodigoEngenhoca(engInfo);
      return `${codigoBase}+${codigoEng}`;
    }

    // Se for uma engenhoca simples desvinculada
    if (isEng) {
      const engInfo = ent.engenhocaInfo || it.engenhocaInfo || ent;
      return gerarCodigoEngenhoca(engInfo);
    }

    // Item convencional (Mundano, Superior, Mágico ou Específico)
    const itemId = String(it.id || ent.itemId || ent.id || 'item').toLowerCase();
    const prefixoTipo = mapearTipoParaPrefixo(it.tipo || ent.tipo, it.categoriaId || ent.categoriaId, it.nome || ent.displayName);

    // Melhorias
    const rawImps = ent.improvements || it.improvements || ent.melhorias || it.melhorias || [];
    const impsList = [];
    if (Array.isArray(rawImps)) {
      rawImps.forEach(imp => {
        if (!imp) return;
        if (typeof imp === 'string') {
          impsList.push(slugfy(imp));
        } else if (imp.id === 'material_especial' || imp.materialId) {
          impsList.push('material_' + slugfy(imp.materialId || 'mitral'));
        } else if (imp.id) {
          impsList.push(slugfy(imp.id));
        }
      });
    }

    // Encantamentos
    const rawEncs = ent.enchantments || it.enchantments || ent.encantamentos || it.encantamentos || [];
    const encsList = [];
    if (Array.isArray(rawEncs)) {
      rawEncs.forEach(enc => {
        if (!enc) return;
        if (typeof enc === 'string') encsList.push(slugfy(enc));
        else if (enc.id) encsList.push(slugfy(enc.id));
      });
    }

    // Determina o Grau
    let grau = 'MUN';
    const isEspecifico = Boolean(it.isEspecifico || it.tipo === 'especifico' || it.categoriaId === 'especifico' || it.raridade);
    if (isEspecifico) {
      const rar = String(it.raridade || it.grau || it.categoriaId || '').toLowerCase();
      if (rar.includes('maior') || rar.includes('mai')) grau = 'ESP-MAI';
      else if (rar.includes('medio') || rar.includes('médio') || rar.includes('med')) grau = 'ESP-MED';
      else grau = 'ESP-MNR';
    } else if (encsList.length > 0) {
      grau = 'MAG';
    } else if (impsList.length > 0) {
      grau = 'SUP';
    }

    const melStr = impsList.length > 0 ? ('MEL.' + impsList.join('.')) : '0';
    const encStr = encsList.length > 0 ? ('ENC.' + encsList.join('.')) : '0';

    return `T20:${prefixoTipo}:${slugfy(itemId)}:${grau}:${melStr}:${encStr}`;
  }

  /**
   * Interpreta um código de compartilhamento e devolve os dados estruturados do item.
   * @param {string} codigoString Código no formato T20
   * @returns {Object|null} Objeto com dados do item interpretado ou null se inválido
   */
  function interpretarCodigoCompartilhamento(codigoString) {
    if (!codigoString || typeof codigoString !== 'string') return null;
    const limpo = codigoString.trim();

    // Caso seja Engenhoca Acoplada: [CÓDIGO_ITEM]+[CÓDIGO_ENGENHOCA]
    if (limpo.includes('+')) {
      const partes = limpo.split('+');
      const parteItem = partes[0].trim();
      const parteEng = partes[1].trim();

      const itemBase = interpretarCodigoCompartilhamento(parteItem);
      const engenhoca = interpretarCodigoCompartilhamento(parteEng);

      if (!itemBase || !engenhoca) return null;

      const spellNome = engenhoca.engenhocaInfo.spellName || engenhoca.engenhocaInfo.spellId;
      const finalNome = `${itemBase.nome} (${spellNome})`;

      return {
        id: 'engenhoca_' + engenhoca.engenhocaInfo.spellId + '_' + Date.now(),
        itemId: 'engenhoca_' + engenhoca.engenhocaInfo.spellId + '_' + Date.now(),
        instanceId: 'inst_eng_' + Date.now(),
        nome: finalNome,
        displayName: finalNome,
        tipo: itemBase.tipo === 'armadura' ? 'armadura' : (itemBase.tipo === 'escudo' ? 'escudo' : (itemBase.tipo === 'arma' ? 'arma' : (engenhoca.formaUso === 'vestida' ? 'acessorio' : 'engenhoca'))),
        categoriaId: itemBase.categoriaId || 'engenhoca',
        isEngenhoca: true,
        formaUso: engenhoca.formaUso,
        espacos: (itemBase.espacos || 1) + 1,
        attachedItem: itemBase,
        engenhocaInfo: {
          ...engenhoca.engenhocaInfo,
          attachedItem: itemBase
        },
        armadura: itemBase.armadura,
        escudo: itemBase.escudo,
        arma: itemBase.arma,
        defesa: itemBase.defesa,
        penalidade: itemBase.penalidade
      };
    }

    // Valida prefixo T20
    const semPrefixo = limpo.replace(/^T20:/i, '');
    const tokens = semPrefixo.split(':');

    // Caso de Engenhoca Simples: ENG:[CIR]:[PM]:[SPELL_ID]:[FORMA]
    if (tokens[0].toUpperCase() === 'ENG') {
      const cir = parseInt((tokens[1] || 'CIR1').replace(/\D/g, ''), 10) || 1;
      const pm = parseInt((tokens[2] || 'PM1').replace(/\D/g, ''), 10) || cir;
      const spellId = (tokens[3] || 'adaga-mental').toLowerCase();
      const formaUso = (tokens[4] || 'empunhada').toLowerCase() === 'vestida' ? 'vestida' : 'empunhada';

      const spellNome = spellId.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const customId = 'engenhoca_' + spellId + '_' + Date.now();

      return {
        id: customId,
        itemId: customId,
        instanceId: 'inst_' + customId,
        nome: `Engenhoca de ${spellNome}`,
        displayName: `Engenhoca de ${spellNome}`,
        tipo: formaUso === 'vestida' ? 'acessorio' : 'engenhoca',
        categoriaId: 'engenhoca',
        isEngenhoca: true,
        formaUso,
        espacos: 1,
        engenhocaInfo: {
          id: customId,
          nome: `Engenhoca de ${spellNome}`,
          spellId,
          spellName: spellNome,
          circulo: cir,
          pm,
          cdAtivacao: 15 + pm,
          formaUso,
          espacos: 1
        }
      };
    }

    // Item Convencional: [TIPO]:[ID_BASE]:[GRAU]:[MELHORIAS]:[ENCANTOS]
    if (tokens.length >= 3) {
      const prefixoTipo = tokens[0].toUpperCase();
      const itemId = tokens[1].toLowerCase();
      const grau = tokens[2].toUpperCase();
      const melToken = tokens[3] || '0';
      const encToken = tokens[4] || '0';

      const metaTipo = mapearPrefixoParaTipo(prefixoTipo);

      // Interpreta melhorias
      const improvements = [];
      if (melToken !== '0' && melToken.startsWith('MEL.')) {
        const imps = melToken.slice(4).split('.');
        imps.forEach(impKey => {
          if (impKey.startsWith('material_')) {
            improvements.push({ id: 'material_especial', materialId: impKey.replace('material_', '') });
          } else {
            improvements.push({ id: impKey });
          }
        });
      }

      // Interpreta encantamentos
      const enchantments = [];
      if (encToken !== '0' && encToken.startsWith('ENC.')) {
        const encs = encToken.slice(4).split('.');
        encs.forEach(encKey => {
          enchantments.push({ id: encKey });
        });
      }

      const nomeLimpo = itemId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

      return {
        id: itemId,
        itemId: itemId,
        instanceId: 'inst_' + itemId + '_' + Date.now(),
        nome: nomeLimpo,
        displayName: nomeLimpo,
        tipo: metaTipo.tipo,
        categoriaId: metaTipo.categoriaId,
        grau,
        isEspecifico: grau.startsWith('ESP'),
        improvements,
        enchantments,
        quantity: 1,
        espacos: (metaTipo.tipo === 'armadura' ? 2 : (metaTipo.tipo === 'arma' ? 1 : 1))
      };
    }

    return null;
  }

  const ModuloCodigoItem = Object.freeze({
    gerar: gerarCodigoCompartilhamento,
    interpretar: interpretarCodigoCompartilhamento,
    gerarCodigoEngenhoca,
    mapearTipoParaPrefixo
  });

  if (typeof window !== 'undefined') {
    // @ts-ignore
    window.CodigoCompartilhamentoItem = ModuloCodigoItem;
    // @ts-ignore
    window.gerarCodigoCompartilhamento = gerarCodigoCompartilhamento;
    // @ts-ignore
    window.interpretarCodigoCompartilhamento = interpretarCodigoCompartilhamento;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModuloCodigoItem;
  }
})();
