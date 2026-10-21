/**
 * FORJA RUBRA — Módulo Puro de Armadura Mecanizada (Tormenta 20)
 *
 * Regra Canônica:
 * "Armadura Mecanizada. Você pode gastar T$ 100 e 1 dia de trabalho para
 * acoplar uma engenhoca em sua armadura. Armaduras leves podem ter uma engenhoca
 * acoplada e armaduras pesadas podem ter até três. Uma engenhoca acoplada não
 * conta em seu limite de itens vestidos e não precisa ser empunhada. Pré-requisito: Engenhoqueiro."
 */

export interface AttachedContraptionSummary {
  id: string;
  nome: string;
  spellId?: string;
  spellName?: string;
  circulo?: number;
  pm?: number;
  cdAtivacao?: number;
  descricao?: string;
  espacos?: number;
  formaUso?: string;
  acopladoEm?: number;
  [key: string]: unknown;
}

export interface ArmorItemLike {
  id?: string;
  itemId?: string;
  instanceId?: string;
  nome?: string;
  tipo?: string;
  categoriaId?: string;
  armadura?: {
    categoriaId?: string;
    defesa?: number;
    penalidade?: number;
    [key: string]: unknown;
  };
  attachedContraptions?: AttachedContraptionSummary[];
  [key: string]: unknown;
}

export interface ContraptionItemLike {
  id?: string;
  itemId?: string;
  instanceId?: string;
  nome?: string;
  displayName?: string;
  itemName?: string;
  tipo?: string;
  categoriaId?: string;
  isEngenhoca?: boolean;
  contraptionId?: string;
  attachedToArmorId?: string;
  attachedToArmorName?: string;
  engenhocaInfo?: {
    id?: string;
    spellId?: string;
    spellName?: string;
    circulo?: number;
    pm?: number;
    cdAtivacao?: number;
    descricao?: string;
    formaUso?: string;
    espacos?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface CharacterLike {
  powers?: Array<{ id?: string; nome?: string; name?: string; [key: string]: unknown }>;
  features?: Array<{ id?: string; nome?: string; name?: string; [key: string]: unknown }>;
  finances?: { spent?: number; [key: string]: unknown };
  tibares?: number;
  [key: string]: unknown;
}

export const CUSTO_ACOPLAMENTO_TIBAR = 100;
export const TEMPO_ACOPLAMENTO_DIAS = 1;

/**
 * Normaliza strings para comparações seguras sem acentos.
 */
function normalizeStr(val: unknown): string {
  return String(val || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Verifica se o personagem possui o poder canônico Armadura Mecanizada.
 */
export function temPoderArmaduraMecanizada(characterOrFeatures: unknown): boolean {
  if (!characterOrFeatures) return false;
  let list: unknown[] = [];

  if (Array.isArray(characterOrFeatures)) {
    list = characterOrFeatures;
  } else if (typeof characterOrFeatures === 'object') {
    const obj = characterOrFeatures as Record<string, unknown>;
    if (Array.isArray(obj.powers)) list = list.concat(obj.powers);
    if (Array.isArray(obj.features)) list = list.concat(obj.features);
    if (Array.isArray(obj.progression)) {
      list = list.concat(
        obj.progression.map((p: any) => ({ id: p?.powerId, nome: p?.powerName || p?.powerId }))
      );
    }
  }

  return list.some((entry: any) => {
    if (!entry) return false;
    const id = normalizeStr(entry.id);
    const nome = normalizeStr(entry.nome || entry.name || '');
    return (
      id === 'inventor_armadura_mecanizada' ||
      id === 'armadura_mecanizada' ||
      nome === 'armadura mecanizada' ||
      nome.includes('armadura mecanizada')
    );
  });
}

/**
 * Retorna o limite canônico de engenhocas que a armadura pode acoplar.
 * Armaduras leves: 1.
 * Armaduras pesadas: 3.
 * Trajes, escudos, armas ou outros itens: 0 (não permitido).
 */
export function limiteEngenhocasArmadura(armor: ArmorItemLike | null | undefined): number {
  if (!armor) return 0;

  const tipo = normalizeStr(armor.tipo);
  const cat = normalizeStr(armor.categoriaId || armor.armadura?.categoriaId || '');
  const nome = normalizeStr(armor.nome);

  // Deve ser estritamente do tipo armadura
  const isArmorType =
    tipo === 'armadura' ||
    Boolean(armor.armadura) ||
    cat === 'leve' ||
    cat === 'pesada' ||
    cat === 'armadura' ||
    cat === 'armaduras';

  if (!isArmorType) {
    return 0;
  }

  // Trajes, roupas e vestimentas NÃO são armaduras
  if (tipo === 'vestuario' || cat === 'vestuario' || /traje|tunica|camisa|veste|manto/i.test(nome)) {
    return 0;
  }
  // Escudos NÃO são armaduras para armadura mecanizada
  if (tipo === 'escudo' || cat === 'escudo' || cat === 'escudos' || /escudo/i.test(nome)) {
    return 0;
  }

  // Pesada: limite 3
  if (cat.includes('pesad') || /pesad/i.test(nome) || /cota de malha|placas|completa|brunea|brúnea/i.test(nome)) {
    return 3;
  }

  // Leve: limite 1 (padrão para armaduras leves como couro, gibão, couraça etc.)
  return 1;
}

/**
 * Obtém a lista de engenhocas acopladas em uma armadura.
 */
export function obterEngenhocasAcopladas(armor: ArmorItemLike | null | undefined): AttachedContraptionSummary[] {
  if (!armor || !Array.isArray(armor.attachedContraptions)) {
    return [];
  }
  return armor.attachedContraptions;
}

/**
 * Verifica se um item é uma engenhoca válida.
 */
export function isEngenhocaItem(item: ContraptionItemLike | null | undefined): boolean {
  if (!item) return false;
  const tipo = normalizeStr(item.tipo);
  const cat = normalizeStr(item.categoriaId);
  const id = normalizeStr(item.id || item.itemId);
  const nome = normalizeStr(item.nome || item.displayName || item.itemName);

  return Boolean(
    item.isEngenhoca ||
    item.contraptionId ||
    item.engenhocaInfo ||
    tipo === 'engenhoca' ||
    cat === 'engenhoca' ||
    id.startsWith('engenhoca_') ||
    id.startsWith('contraption_') ||
    nome.includes('engenhoca')
  );
}

/**
 * Validação pura se uma engenhoca pode ser acoplada em uma armadura.
 */
export function podeAcoplarEngenhocaEmArmadura(
  character: CharacterLike | null | undefined,
  armor: ArmorItemLike | null | undefined,
  contraption: ContraptionItemLike | null | undefined
): { permitido: boolean; motivo?: string } {
  if (!character || !temPoderArmaduraMecanizada(character)) {
    return {
      permitido: false,
      motivo: 'Exige o poder canônico Armadura Mecanizada (Inventor).'
    };
  }

  if (!armor) {
    return { permitido: false, motivo: 'Nenhuma armadura selecionada.' };
  }

  const maxContraptions = limiteEngenhocasArmadura(armor);
  if (maxContraptions <= 0) {
    return {
      permitido: false,
      motivo: 'Engenhocas só podem ser acopladas em armaduras leves ou pesadas (proibido em trajes, armas ou escudos).'
    };
  }

  const currentAttached = obterEngenhocasAcopladas(armor);
  if (currentAttached.length >= maxContraptions) {
    return {
      permitido: false,
      motivo: `Limite atingido: esta armadura ${maxContraptions === 1 ? 'leve permite apenas 1 engenhoca' : 'pesada permite até 3 engenhocas'}.`
    };
  }

  if (!contraption || !isEngenhocaItem(contraption)) {
    return { permitido: false, motivo: 'O item selecionado não é uma engenhoca.' };
  }

  // Checa se a engenhoca já está acoplada nesta ou em outra armadura
  const contraptionId = contraption.id || contraption.instanceId || contraption.contraptionId || contraption.itemId;
  if (currentAttached.some(c => c.id === contraptionId)) {
    return { permitido: false, motivo: 'Esta engenhoca já está acoplada nesta armadura.' };
  }

  if (contraption.attachedToArmorId) {
    return { permitido: false, motivo: 'Esta engenhoca já se encontra acoplada a outra armadura.' };
  }

  return { permitido: true };
}

/**
 * Cria a estrutura de resumo de engenhoca para anexar à armadura.
 */
export function criarResumoEngenhocaAcoplada(contraption: ContraptionItemLike): AttachedContraptionSummary {
  const cId = String(contraption.id || contraption.instanceId || contraption.contraptionId || contraption.itemId || '');
  const info = contraption.engenhocaInfo || {};
  const nome = String(contraption.displayName || contraption.itemName || contraption.nome || info.spellName || 'Engenhoca');
  const spellId = info.spellId || (contraption as any).spellId;
  const spellName = info.spellName || (contraption as any).spellName;
  const circulo = Number(info.circulo || (contraption as any).circulo || 1);
  const pm = Number(info.pm || (contraption as any).pm || 1);
  const cdAtivacao = Number(info.cdAtivacao || (contraption as any).cdAtivacao || 15);
  const descricao = String(info.descricao || contraption.descricao || (contraption as any).textos?.descricao || '');
  const formaUso = String(info.formaUso || (contraption as any).formaUso || 'vestida');

  return {
    id: cId,
    nome,
    spellId,
    spellName,
    circulo,
    pm,
    cdAtivacao,
    descricao,
    formaUso,
    espacos: 1,
    acopladoEm: Date.now()
  };
}

/**
 * Acopla uma engenhoca em uma armadura (operação pura e imutável).
 */
export function acoplarEngenhocaEmArmadura(
  armor: ArmorItemLike,
  contraption: ContraptionItemLike
): {
  armorAtualizada: ArmorItemLike;
  contraptionAtualizada: ContraptionItemLike;
} {
  const summary = criarResumoEngenhocaAcoplada(contraption);
  const attached = Array.isArray(armor.attachedContraptions) ? [...armor.attachedContraptions] : [];
  attached.push(summary);

  const armorId = String(armor.instanceId || armor.itemId || armor.id || 'armadura');
  const armorNome = String(armor.nome || 'Armadura');

  const armorAtualizada: ArmorItemLike = {
    ...armor,
    attachedContraptions: attached
  };

  const contraptionAtualizada: ContraptionItemLike = {
    ...contraption,
    attachedToArmorId: armorId,
    attachedToArmorName: armorNome
  };

  return { armorAtualizada, contraptionAtualizada };
}

/**
 * Desacopla uma engenhoca de uma armadura (operação pura e imutável).
 */
export function desacoplarEngenhocaDaArmadura(
  armor: ArmorItemLike,
  contraptionId: string
): {
  armorAtualizada: ArmorItemLike;
  engenhocaRemovida: AttachedContraptionSummary | null;
} {
  if (!Array.isArray(armor.attachedContraptions)) {
    return { armorAtualizada: { ...armor, attachedContraptions: [] }, engenhocaRemovida: null };
  }

  const encontrada = armor.attachedContraptions.find(c => c.id === contraptionId) || null;
  const restantes = armor.attachedContraptions.filter(c => c.id !== contraptionId);

  return {
    armorAtualizada: {
      ...armor,
      attachedContraptions: restantes
    },
    engenhocaRemovida: encontrada
  };
}

/**
 * Verifica se uma engenhoca acoplada está pronta/ativa devido à armadura estar vestida.
 * Regra: Quando a armadura está vestida, as engenhocas acopladas nela contam
 * automaticamente como equipadas, sem ocupar as mãos nem limite de itens vestidos.
 */
export function isEngenhocaAcopladaAtiva(
  contraption: ContraptionItemLike,
  armor: ArmorItemLike | null | undefined,
  isArmorEquipped: boolean
): boolean {
  if (!isArmorEquipped || !armor) return false;
  const attached = obterEngenhocasAcopladas(armor);
  const cId = contraption.id || contraption.instanceId || contraption.contraptionId || contraption.itemId;
  return attached.some(c => c.id === cId);
}
