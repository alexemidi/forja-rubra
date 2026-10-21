/**
 * Regras puras de Criação de Personagem: composição de atributos, pontos de compra e níveis por classe.
 */

export function atributos(
  ids: readonly string[],
  base: Record<string, number>,
  bonus: Record<string, number>
): Record<string, number> {
  return Object.fromEntries(
    ids.map((id) => [id, Number(base[id] || 0) + Number(bonus[id] || 0)])
  );
}

export function pontos(
  ids: readonly string[],
  base: Record<string, number>,
  custos: Record<number, number>
): number {
  return ids.reduce((sum, id) => sum + (custos[base[id]] ?? 0), 0);
}

export function nivelClasse(
  progressao: readonly { classId: string }[],
  index: number,
  classId: string
): number {
  return progressao
    .slice(0, index + 1)
    .filter((row) => row.classId === classId).length;
}

export const RegrasCriacao = Object.freeze({
  atributos,
  pontos,
  nivelClasse,
});

export default RegrasCriacao;
