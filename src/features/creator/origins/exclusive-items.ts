/**
 * Regras de Itens Exclusivos de Origem e Formatação de Instrumentos de Ofício.
 */

export const ORIGIN_EXCLUSIVE_ITEM_IDS: ReadonlySet<string> = new Set([
  'rolo_de_macarrao',
  'martelo_de_carne',
  'ferramenta_pesada',
  'ferramenta_pesada_lanca',
  'ferramenta_agricola',
  'animal_nao_combativo',
  'joia_de_familia',
  'joia_falsificada',
  'item_artistico',
  'tatuagem_adereco_gangue',
  'bolas_malabarismo',
  'traje_estrangeiro',
  'item_sem_valor_admirador',
  'apito',
  'insignia_da_milicia',
  'pequeno_animal_estimacao',
  'panela',
  'avental',
  'caneca',
  'pano_sujo',
  'tabardo_khalmyr',
  'cutelo',
  'instrumentos_cozinheiro_aprimorados',
  'instrumentos_barbeiro',
  'faca_de_corte',
  'instrumentos_coureiro',
  'bola_ou_objeto_pintado',
  'bolsa_de_minhocas',
  'instrumentos_pescador',
  'dente_falso',
  'replica_peca_artistica_elfica',
]);

export interface InitialChoiceContext {
  source?: string;
  isOriginGrant?: boolean;
  isBudgetGrant?: boolean;
  names?: string[];
}

export function isOriginExclusiveItemAllowed(
  itemIdOrItem: string | { id?: string; nome?: string; origemExclusiva?: boolean } | null | undefined,
  context?: {
    mode?: string;
    choice?: InitialChoiceContext | null;
    starterKeyFn?: (s: string) => string;
  },
): boolean {
  const id = typeof itemIdOrItem === 'string' ? itemIdOrItem : itemIdOrItem?.id || '';
  const nome = typeof itemIdOrItem === 'object' && itemIdOrItem?.nome ? itemIdOrItem.nome : '';
  const isExclusive =
    ORIGIN_EXCLUSIVE_ITEM_IDS.has(id) ||
    Boolean(typeof itemIdOrItem === 'object' && itemIdOrItem?.origemExclusiva);
  if (!isExclusive) return true;

  const g = globalThis as any;
  const mode = context?.mode ?? g.arsenalInitialState?.mode;
  if (mode !== 'initial') return false;

  const choice: InitialChoiceContext | null =
    context?.choice !== undefined
      ? context.choice
      : typeof g.effectiveInitialChoice === 'function'
        ? g.effectiveInitialChoice()
        : null;

  if (!choice || (choice.source !== 'origin' && !choice.isOriginGrant)) return false;
  if (choice.isBudgetGrant) return false;

  const normalizeKey =
    context?.starterKeyFn ||
    (typeof g.starterKey === 'function'
      ? g.starterKey
      : (s: string) => String(s || '').toLowerCase().trim());

  const names = (choice.names || []).map((n) => normalizeKey(n));
  const targetId = normalizeKey(id);
  const targetName = nome ? normalizeKey(nome) : '';

  return names.some(
    (n) =>
      Boolean(n) &&
      (n === targetId ||
        n === targetName ||
        (targetName && targetName.startsWith(n)) ||
        targetId.includes(n) ||
        n.includes(targetId)),
  );
}

const CRAFT_TOOL_MAP: Readonly<Record<string, string>> = Object.freeze({
  alquimia: 'Instrumentos do Alquimista',
  alquimista: 'Instrumentos do Alquimista',
  armeiro: 'Instrumentos do Armeiro',
  artesao: 'Instrumentos do Artesão',
  artesão: 'Instrumentos do Artesão',
  culinaria: 'Instrumentos do Cozinheiro',
  culinária: 'Instrumentos do Cozinheiro',
  cozinheiro: 'Instrumentos do Cozinheiro',
  alfaiate: 'Instrumentos do Alfaiate',
  alvenaria: 'Instrumentos do Pedreiro',
  pedreiro: 'Instrumentos do Pedreiro',
  carpinteiro: 'Instrumentos do Carpinteiro',
  joalheiro: 'Instrumentos do Joalheiro',
  fazendeiro: 'Instrumentos do Fazendeiro',
  pescador: 'Instrumentos do Pescador',
  estalajadeiro: 'Instrumentos do Estalajadeiro',
  escriba: 'Instrumentos do Escriba',
  escultor: 'Instrumentos do Escultor',
  engenhoqueiro: 'Instrumentos do Engenhoqueiro',
  pintor: 'Instrumentos do Pintor',
  minerador: 'Instrumentos do Minerador',
  tatuador: 'Instrumentos do Tatuador',
  coureiro: 'Instrumentos do Coureiro',
  barbeiro: 'Instrumentos do Barbeiro',
});

export function formatCraftToolName(oficioVal?: string | null): string {
  if (!oficioVal) return 'Instrumentos de Ofício';
  const raw = String(oficioVal).toLowerCase().trim();
  for (const [k, v] of Object.entries(CRAFT_TOOL_MAP)) {
    if (raw === k || raw.includes(k)) return v;
  }
  const match = raw.match(/of[íi]cio\s*\((.*?)\)/i);
  const name = match
    ? match[1].trim()
    : raw
        .replace(/of[íi]cio/i, '')
        .replace(/instrumentos\s*(de|do|da)?/i, '')
        .trim();
  if (name) {
    const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
    return `Instrumentos do ${capitalized}`;
  }
  return 'Instrumentos de Ofício';
}
