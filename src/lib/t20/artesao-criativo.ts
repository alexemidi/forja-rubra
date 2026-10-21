/**
 * Regras canônicas do poder de Inventor: Artesão Criativo (Tormenta 20).
 *
 * "Artesão Criativo. Você pode usar Ofício (artesão) no lugar de qualquer outro
 * Ofício para qualquer fim (como pré-requisitos, por exemplo). Pré-requisito:
 * treinado em Ofício (artesão)."
 *
 * Efeitos práticos no sistema:
 * 1. O personagem é considerado treinado em todos os ofícios para qualquer fim.
 * 2. Tem acesso a todas as oficinas e bancadas de manufatura.
 * 3. Satisfaz qualquer pré-requisito de poder, distinção ou item que exija qualquer Ofício.
 * 4. Pode realizar testes de qualquer Ofício com o bônus de treino de Ofício (artesão).
 */

export const TODOS_OFICIOS_CANONICOS: readonly string[] = Object.freeze([
  'armeiro',
  'alquimista',
  'alfaiate',
  'artesao',
  'carpinteiro',
  'cozinheiro',
  'engenhoqueiro',
  'escriba',
  'escultor',
  'joalheiro',
  'pedreiro',
  'pintor',
  'tatuador',
]);

export const LABELS_OFICIOS_CANONICOS: Readonly<Record<string, string>> = Object.freeze({
  armeiro: 'Ofício (Armeiro)',
  alquimista: 'Ofício (Alquimista)',
  alfaiate: 'Ofício (Alfaiate)',
  artesao: 'Ofício (Artesão)',
  carpinteiro: 'Ofício (Carpinteiro)',
  cozinheiro: 'Ofício (Cozinheiro)',
  culinaria: 'Ofício (Culinária)',
  engenhoqueiro: 'Ofício (Engenhoqueiro)',
  escriba: 'Ofício (Escriba)',
  escultor: 'Ofício (Escultor)',
  joalheiro: 'Ofício (Joalheiro)',
  pedreiro: 'Ofício (Pedreiro)',
  pintor: 'Ofício (Pintor)',
  tatuador: 'Ofício (Tatuador)',
});

function normalizeStr(val: unknown): string {
  return String(val || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Normaliza o identificador ou nome de um ofício para sua chave canônica.
 */
export function normalizarChaveOficio(nomeOuToken: string): string {
  const raw = normalizeStr(nomeOuToken)
    .replace(/^oficio\s*[:(]?/i, '')
    .replace(/\)$/, '')
    .trim();
  if (raw.includes('armeir') || raw.includes('ferreir') || raw.includes('forjad')) return 'armeiro';
  if (raw.includes('alfaiat') || raw.includes('tecel') || raw.includes('costur')) return 'alfaiate';
  if (raw.includes('alquim')) return 'alquimista';
  if (raw.includes('engenh') || raw.includes('inventor')) return 'engenhoqueiro';
  if (raw.includes('carpinteir') || raw.includes('marceneir')) return 'carpinteiro';
  if (raw.includes('pedreir') || raw.includes('alvenar') || raw.includes('construt')) return 'pedreiro';
  if (raw.includes('ourive') || raw.includes('joalh')) return 'joalheiro';
  if (raw.includes('escrib') || raw.includes('cartog') || raw.includes('caligr')) return 'escriba';
  if (raw.includes('cozinh') || raw.includes('culin') || raw.includes('gastronom')) return 'cozinheiro';
  if (raw.includes('tatuag') || raw.includes('tatuad')) return 'tatuador';
  if (raw.includes('escult')) return 'escultor';
  if (raw.includes('pint')) return 'pintor';
  if (raw.includes('artes')) return 'artesao';
  return raw || 'artesao';
}

/**
 * Verifica se um personagem possui o poder canônico Artesão Criativo.
 */
export function temPoderArtesaoCriativo(characterOrFeatures: unknown): boolean {
  if (!characterOrFeatures) {
    // Tenta inspecionar o global `state` se disponível
    if (typeof (globalThis as any).state !== 'undefined') {
      return temPoderArtesaoCriativo((globalThis as any).state);
    }
    return false;
  }

  let list: unknown[] = [];

  if (Array.isArray(characterOrFeatures)) {
    list = characterOrFeatures;
  } else if (typeof characterOrFeatures === 'object') {
    const obj = characterOrFeatures as Record<string, unknown>;
    if (Array.isArray(obj.powers)) list = list.concat(obj.powers);
    if (Array.isArray(obj.features)) list = list.concat(obj.features);
    if (Array.isArray(obj.habilidades)) list = list.concat(obj.habilidades);
    if (Array.isArray(obj.progression)) {
      list = list.concat(
        obj.progression.map((p: any) => ({
          id: p?.powerId,
          nome: p?.powerName || p?.powerId || '',
        }))
      );
    }
    if (obj.identity && typeof obj.identity === 'object') {
      const idObj = obj.identity as Record<string, unknown>;
      if (Array.isArray(idObj.powers)) list = list.concat(idObj.powers);
    }
  }

  return list.some((entry: any) => {
    if (!entry) return false;
    const id = normalizeStr(typeof entry === 'string' ? entry : entry.id);
    const nome = normalizeStr(typeof entry === 'object' ? (entry.nome || entry.name || entry.id) : entry);
    return (
      id === 'inventor_artesao_criativo' ||
      id === 'artesao_criativo' ||
      nome === 'artesao criativo' ||
      nome.includes('artesao criativo')
    );
  });
}

/**
 * Verifica se uma perícia de Ofício é considerada treinada para o herói.
 * Se possuir Artesão Criativo, ele é considerado treinado em QUALQUER ofício.
 */
export function isOficioConsideradoTreinado(
  oficioOuToken: string,
  characterOrFeatures?: unknown,
  trainedSkills?: Iterable<string>
): boolean {
  if (temPoderArtesaoCriativo(characterOrFeatures)) {
    return true;
  }
  if (!trainedSkills) return false;
  const set = trainedSkills instanceof Set ? trainedSkills : new Set(trainedSkills);
  const cleanKey = normalizarChaveOficio(oficioOuToken);
  if (set.has(oficioOuToken) || set.has(`oficio:${cleanKey}`) || set.has(`oficio_${cleanKey}`)) {
    return true;
  }
  return false;
}

/**
 * Verifica se um pré-requisito de perícia de Ofício é cumprido.
 * "Você pode usar Ofício (artesão) no lugar de qualquer outro Ofício para qualquer fim (como pré-requisitos, por exemplo)."
 */
export function satisfazPreRequisitoOficio(
  skillRequirementToken: string,
  characterOrFeatures?: unknown,
  trainedSkills?: Iterable<string>
): boolean {
  const token = String(skillRequirementToken || '').toLowerCase();
  const isOficio = token === 'oficio' || token.startsWith('oficio:') || token.startsWith('oficio_');
  if (isOficio && temPoderArtesaoCriativo(characterOrFeatures)) {
    return true;
  }
  return isOficioConsideradoTreinado(skillRequirementToken, characterOrFeatures, trainedSkills);
}

/**
 * Retorna a lista completa de nomes de ofícios aos quais o personagem tem acesso.
 * Se possuir Artesão Criativo, concede acesso a todos os ofícios canônicos.
 */
export function expandirOficiosTreinados(
  baseTrainedOffices: readonly string[],
  characterOrFeatures?: unknown
): string[] {
  const result = [...baseTrainedOffices];
  if (temPoderArtesaoCriativo(characterOrFeatures)) {
    for (const key of TODOS_OFICIOS_CANONICOS) {
      const label = LABELS_OFICIOS_CANONICOS[key] || `Ofício (${key.charAt(0).toUpperCase() + key.slice(1)})`;
      const clean = label.replace(/^Ofício\s*\(|\)$/gi, '').trim();
      const already = result.some((item) => {
        const normExisting = normalizarChaveOficio(item);
        return normExisting === key;
      });
      if (!already) {
        result.push(clean);
      }
    }
  }
  return result;
}
