/**
 * Regras puras de Sorteios Ponderados e Armaduras Iniciais (Gerador Aleatório T20).
 */

export function ponderado<T>(
  entries: readonly T[],
  weight: (entry: T) => number = () => 1,
  random: () => number = Math.random
): T | null {
  const weights = entries.map((entry) => Math.max(0, Number(weight(entry)) || 0));
  const total = weights.reduce((a, b) => a + b, 0);
  if (!entries.length || !total) return null;
  let cursor = random() * total;
  for (let i = 0; i < entries.length; i++) {
    cursor -= weights[i];
    if (cursor < 0) return entries[i];
  }
  return entries.at(-1) ?? null;
}

export function pesosAtributos(
  attrs: Record<string, number>,
  allowed: readonly string[]
): Record<string, number> {
  const offset = Math.max(0, 1 - Math.min(...Object.values(attrs).map(Number)));
  return Object.fromEntries(
    allowed.map((id) => [id, Math.pow(Number(attrs[id] || 0) + offset, 4)])
  );
}

export function armadurasIniciais<T extends { id: string }>(
  catalog: readonly T[],
  heavy: boolean
): T[] {
  const ids = new Set([
    'armadura_de_couro',
    'couro_batido',
    'gibao_de_peles',
    ...(heavy ? ['brunea'] : []),
  ]);
  return catalog.filter((item) => ids.has(item.id));
}

export const SorteiosPersonagem = Object.freeze({
  ponderado,
  pesosAtributos,
  armadurasIniciais,
});

export default SorteiosPersonagem;
