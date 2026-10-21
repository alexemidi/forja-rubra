const ORIGIN_EXCLUSIVE_ITEM_IDS = new Set([
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
  'dente_falso'
]);

function isOriginExclusiveItemAllowed(itemIdOrItem) {
  const id = typeof itemIdOrItem === 'string' ? itemIdOrItem : (itemIdOrItem?.id || '');
  const nome = typeof itemIdOrItem === 'object' && itemIdOrItem?.nome ? itemIdOrItem.nome : '';
  const isExclusive = ORIGIN_EXCLUSIVE_ITEM_IDS.has(id) || (typeof itemIdOrItem === 'object' && itemIdOrItem?.origemExclusiva);
  if (!isExclusive) return true;
  if (typeof arsenalInitialState === 'undefined' || arsenalInitialState.mode !== 'initial') return false;
  if (typeof effectiveInitialChoice !== 'function') return false;
  const choice = effectiveInitialChoice();
  if (!choice || (choice.source !== 'origin' && !choice.isOriginGrant)) return false;
  if (choice.isBudgetGrant) return false;
  const names = (choice.names || []).map(n => typeof starterKey === 'function' ? starterKey(n) : String(n).toLowerCase().trim());
  const targetId = typeof starterKey === 'function' ? starterKey(id) : String(id).toLowerCase().trim();
  const targetName = nome ? (typeof starterKey === 'function' ? starterKey(nome) : String(nome).toLowerCase().trim()) : '';
  return names.some(n => n && (n === targetId || n === targetName || (targetName && targetName.startsWith(n)) || targetId.includes(n) || n.includes(targetId)));
}

(function(){
  if (typeof document === 'undefined') return;
  function hideExclusiveItems(){
    document.querySelectorAll('[data-item-id]').forEach(card=>{
      const id = card.dataset.itemId;
      if (ORIGIN_EXCLUSIVE_ITEM_IDS.has(id) && !isOriginExclusiveItemAllowed(id)) {
        card.remove();
      }
    });
  }
  if(typeof applyFilters==='function'){const base=applyFilters;applyFilters=function(loadMore){const result=base(loadMore);hideExclusiveItems();return result}}
  document.addEventListener('click',()=>queueMicrotask(hideExclusiveItems),true);
  hideExclusiveItems();
})();

function formatCraftToolName(oficioVal) {
  if (!oficioVal) return 'Instrumentos de Ofício';
  const raw = String(oficioVal).toLowerCase().trim();
  const map = {
    'alquimia': 'Instrumentos do Alquimista',
    'alquimista': 'Instrumentos do Alquimista',
    'armeiro': 'Instrumentos do Armeiro',
    'artesao': 'Instrumentos do Artesão',
    'artesão': 'Instrumentos do Artesão',
    'culinaria': 'Instrumentos do Cozinheiro',
    'culinária': 'Instrumentos do Cozinheiro',
    'cozinheiro': 'Instrumentos do Cozinheiro',
    'alfaiate': 'Instrumentos do Alfaiate',
    'alvenaria': 'Instrumentos do Pedreiro',
    'pedreiro': 'Instrumentos do Pedreiro',
    'carpinteiro': 'Instrumentos do Carpinteiro',
    'joalheiro': 'Instrumentos do Joalheiro',
    'fazendeiro': 'Instrumentos do Fazendeiro',
    'pescador': 'Instrumentos do Pescador',
    'estalajadeiro': 'Instrumentos do Estalajadeiro',
    'escriba': 'Instrumentos do Escriba',
    'escultor': 'Instrumentos do Escultor',
    'engenhoqueiro': 'Instrumentos do Engenhoqueiro',
    'pintor': 'Instrumentos do Pintor',
    'minerador': 'Instrumentos do Minerador',
    'tatuador': 'Instrumentos do Tatuador',
    'coureiro': 'Instrumentos do Coureiro',
    'barbeiro': 'Instrumentos do Barbeiro'
  };
  for (const [k, v] of Object.entries(map)) {
    if (raw === k || raw.includes(k)) return v;
  }
  const match = raw.match(/of[íi]cio\s*\((.*?)\)/i);
  const name = match ? match[1].trim() : raw.replace(/of[íi]cio/i, '').replace(/instrumentos\s*(de|do|da)?/i, '').trim();
  if (name) {
    const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
    return `Instrumentos do ${capitalized}`;
  }
  return 'Instrumentos de Ofício';
}

if (typeof globalThis !== 'undefined') {
  globalThis.formatCraftToolName = formatCraftToolName;
  globalThis.isOriginExclusiveItemAllowed = isOriginExclusiveItemAllowed;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ORIGIN_EXCLUSIVE_ITEM_IDS, isOriginExclusiveItemAllowed, formatCraftToolName };
}
