/**
 * Módulo de Código de Compartilhamento de Itens (T20 Item Share Code) em TypeScript.
 * Formato legível, modular e reversível para exportar e importar qualquer item de Tormenta 20.
 */

export interface ShareCodeTypeMeta {
  tipo: string;
  categoriaId: string;
}

export interface ContraptionShareInfo {
  id?: string;
  nome?: string;
  spellId?: string;
  spellName?: string;
  magiaId?: string;
  magia?: string;
  circulo?: number;
  circle?: number;
  pm?: number;
  custoPm?: number;
  cdAtivacao?: number;
  formaUso?: string;
  forma?: string;
  espacos?: number;
  attachedItem?: Record<string, any>;
}

function slugfy(str: unknown): string {
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
export function mapearTipoParaPrefixo(
  tipo?: string,
  categoriaId?: string,
  itemNome?: string
): string {
  const t = String(tipo || '').toLowerCase();
  const c = String(categoriaId || '').toLowerCase();
  const n = String(itemNome || '').toLowerCase();

  if (t === 'engenhoca' || c === 'engenhoca') return 'ENG';
  if (t === 'armadura' || c === 'armaduras' || c === 'armadura') return 'ARMAD';
  if (t === 'escudo' || c === 'escudos' || c === 'escudo') return 'ESC';
  if (t === 'arma' || c === 'armas' || c === 'arma') return 'ARM';
  if (
    t === 'vestuario' ||
    c === 'vestuario' ||
    /traje|camisa|veste|tunica/i.test(n)
  ) {
    return 'VEST';
  }
  if (t === 'esoterico' || c === 'esotericos' || c === 'esoterico') {
    return 'ESOT';
  }
  if (
    t === 'alquimico' ||
    c === 'alquimicos' ||
    t === 'pocao' ||
    c === 'pocoes'
  ) {
    return 'ALQ';
  }
  if (t === 'acessorio' || c === 'acessorios' || c === 'acessorio') {
    return 'ACES';
  }
  if (t === 'especifico' || c === 'especificos' || c === 'especifico') {
    return 'ESP';
  }
  return 'GER';
}

export function mapearPrefixoParaTipo(prefixo: string): ShareCodeTypeMeta {
  switch (String(prefixo || '').toUpperCase()) {
    case 'ARM':
      return { tipo: 'arma', categoriaId: 'armas' };
    case 'ARMAD':
      return { tipo: 'armadura', categoriaId: 'armaduras' };
    case 'ESC':
      return { tipo: 'escudo', categoriaId: 'escudos' };
    case 'VEST':
      return { tipo: 'vestuario', categoriaId: 'vestuario' };
    case 'ACES':
      return { tipo: 'acessorio', categoriaId: 'acessorios' };
    case 'ESOT':
      return { tipo: 'esoterico', categoriaId: 'esotericos' };
    case 'ALQ':
      return { tipo: 'alquimico', categoriaId: 'alquimicos' };
    case 'ENG':
      return { tipo: 'engenhoca', categoriaId: 'engenhoca' };
    case 'ESP':
      return { tipo: 'especifico', categoriaId: 'especificos' };
    default:
      return { tipo: 'item_geral', categoriaId: 'itens_gerais' };
  }
}

export function gerarCodigoEngenhoca(info?: ContraptionShareInfo | null): string {
  if (!info) return 'T20:ENG:CIR1:PM1:adaga-mental:empunhada';
  const cir = Number(info.circulo || info.circle || 1);
  const pm = Number(info.pm || info.custoPm || cir);
  const spell = slugfy(
    info.spellId || info.spellName || info.magiaId || info.magia || 'adaga-mental'
  ).replace(/_/g, '-');
  const forma = String(info.formaUso || info.forma || 'empunhada').toLowerCase();
  return `T20:ENG:CIR${cir}:PM${pm}:${spell}:${forma}`;
}

export function gerarCodigoCompartilhamento(
  item?: Record<string, any> | null,
  entry?: Record<string, any> | null
): string {
  const it = item || {};
  const ent = entry || {};

  const isEng = Boolean(
    ent.isEngenhoca ||
      ent.contraptionId ||
      it.tipo === 'engenhoca' ||
      ent.engenhocaInfo ||
      it.engenhocaInfo
  );
  const attached =
    ent.attachedItem ||
    ent.engenhocaInfo?.attachedItem ||
    it.attachedItem ||
    it.engenhocaInfo?.attachedItem;

  if (isEng && attached) {
    const codigoBase = gerarCodigoCompartilhamento(attached, {
      improvements: attached.improvements || attached.melhorias,
      enchantments: attached.enchantments || attached.encantamentos,
      options: attached.options,
    });
    const engInfo = ent.engenhocaInfo || it.engenhocaInfo || ent;
    const codigoEng = gerarCodigoEngenhoca(engInfo);
    return `${codigoBase}+${codigoEng}`;
  }

  if (isEng) {
    const engInfo = ent.engenhocaInfo || it.engenhocaInfo || ent;
    return gerarCodigoEngenhoca(engInfo);
  }

  const itemId = String(it.id || ent.itemId || ent.id || 'item').toLowerCase();
  const prefixoTipo = mapearTipoParaPrefixo(
    it.tipo || ent.tipo,
    it.categoriaId || ent.categoriaId,
    it.nome || ent.displayName
  );

  const rawImps =
    ent.improvements ||
    it.improvements ||
    ent.melhorias ||
    it.melhorias ||
    [];
  const impsList: string[] = [];
  if (Array.isArray(rawImps)) {
    rawImps.forEach((imp: any) => {
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

  const rawEncs =
    ent.enchantments ||
    it.enchantments ||
    ent.encantamentos ||
    it.encantamentos ||
    [];
  const encsList: string[] = [];
  if (Array.isArray(rawEncs)) {
    rawEncs.forEach((enc: any) => {
      if (!enc) return;
      if (typeof enc === 'string') encsList.push(slugfy(enc));
      else if (enc.id) encsList.push(slugfy(enc.id));
    });
  }

  let grau = 'MUN';
  const isEspecifico = Boolean(
    it.isEspecifico ||
      it.tipo === 'especifico' ||
      it.categoriaId === 'especifico' ||
      it.raridade
  );
  if (isEspecifico) {
    const rar = String(
      it.raridade || it.grau || it.categoriaId || ''
    ).toLowerCase();
    if (rar.includes('maior') || rar.includes('mai')) grau = 'ESP-MAI';
    else if (
      rar.includes('medio') ||
      rar.includes('médio') ||
      rar.includes('med')
    ) {
      grau = 'ESP-MED';
    } else {
      grau = 'ESP-MNR';
    }
  } else if (encsList.length > 0) {
    grau = 'MAG';
  } else if (impsList.length > 0) {
    grau = 'SUP';
  }

  const melStr = impsList.length > 0 ? 'MEL.' + impsList.join('.') : '0';
  const encStr = encsList.length > 0 ? 'ENC.' + encsList.join('.') : '0';

  return `T20:${prefixoTipo}:${slugfy(itemId)}:${grau}:${melStr}:${encStr}`;
}

export function interpretarCodigoCompartilhamento(
  codigoString: string
): Record<string, any> | null {
  if (!codigoString || typeof codigoString !== 'string') return null;
  const limpo = codigoString.trim();

  if (limpo.includes('+')) {
    const partes = limpo.split('+');
    const parteItem = partes[0].trim();
    const parteEng = partes[1].trim();

    const itemBase = interpretarCodigoCompartilhamento(parteItem);
    const engenhoca = interpretarCodigoCompartilhamento(parteEng);

    if (!itemBase || !engenhoca) return null;

    const spellNome =
      engenhoca.engenhocaInfo.spellName || engenhoca.engenhocaInfo.spellId;
    const finalNome = `${itemBase.nome} (${spellNome})`;

    return {
      id: 'engenhoca_' + engenhoca.engenhocaInfo.spellId + '_' + Date.now(),
      itemId: 'engenhoca_' + engenhoca.engenhocaInfo.spellId + '_' + Date.now(),
      instanceId: 'inst_eng_' + Date.now(),
      nome: finalNome,
      displayName: finalNome,
      tipo:
        itemBase.tipo === 'armadura'
          ? 'armadura'
          : itemBase.tipo === 'escudo'
            ? 'escudo'
            : itemBase.tipo === 'arma'
              ? 'arma'
              : engenhoca.formaUso === 'vestida'
                ? 'acessorio'
                : 'engenhoca',
      categoriaId: itemBase.categoriaId || 'engenhoca',
      isEngenhoca: true,
      formaUso: engenhoca.formaUso,
      espacos: (itemBase.espacos || 1) + 1,
      attachedItem: itemBase,
      engenhocaInfo: {
        ...engenhoca.engenhocaInfo,
        attachedItem: itemBase,
      },
      armadura: itemBase.armadura,
      escudo: itemBase.escudo,
      arma: itemBase.arma,
      defesa: itemBase.defesa,
      penalidade: itemBase.penalidade,
    };
  }

  const semPrefixo = limpo.replace(/^T20:/i, '');
  const tokens = semPrefixo.split(':');

  if (tokens[0].toUpperCase() === 'ENG') {
    const cir =
      parseInt((tokens[1] || 'CIR1').replace(/\D/g, ''), 10) || 1;
    const pm =
      parseInt((tokens[2] || 'PM1').replace(/\D/g, ''), 10) || cir;
    const spellId = (tokens[3] || 'adaga-mental').toLowerCase();
    const formaUso =
      (tokens[4] || 'empunhada').toLowerCase() === 'vestida'
        ? 'vestida'
        : 'empunhada';

    const spellNome = spellId
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
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
        espacos: 1,
      },
    };
  }

  if (tokens.length >= 3) {
    const prefixoTipo = tokens[0].toUpperCase();
    const itemId = tokens[1].toLowerCase();
    const grau = tokens[2].toUpperCase();
    const melToken = tokens[3] || '0';
    const encToken = tokens[4] || '0';

    const metaTipo = mapearPrefixoParaTipo(prefixoTipo);

    const improvements: Array<{ id: string; materialId?: string }> = [];
    if (melToken !== '0' && melToken.startsWith('MEL.')) {
      const imps = melToken.slice(4).split('.');
      imps.forEach((impKey) => {
        if (impKey.startsWith('material_')) {
          improvements.push({
            id: 'material_especial',
            materialId: impKey.replace('material_', ''),
          });
        } else {
          improvements.push({ id: impKey });
        }
      });
    }

    const enchantments: Array<{ id: string }> = [];
    if (encToken !== '0' && encToken.startsWith('ENC.')) {
      const encs = encToken.slice(4).split('.');
      encs.forEach((encKey) => {
        enchantments.push({ id: encKey });
      });
    }

    const nomeLimpo = itemId
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

    return {
      id: itemId,
      itemId,
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
      espacos:
        metaTipo.tipo === 'armadura'
          ? 2
          : metaTipo.tipo === 'arma'
            ? 1
            : 1,
    };
  }

  return null;
}

export const ModuloCodigoItem = Object.freeze({
  gerar: gerarCodigoCompartilhamento,
  interpretar: interpretarCodigoCompartilhamento,
  gerarCodigoEngenhoca,
  mapearTipoParaPrefixo,
});

export default ModuloCodigoItem;
