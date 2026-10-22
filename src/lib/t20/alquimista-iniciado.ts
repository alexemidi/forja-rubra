/**
 * Regras puras canônicas para o poder Alquimista Iniciado e restrição de fabricação de poções/pergaminhos.
 */

export interface FormulasAlquimistaResult {
  totalFormulas: number;
  maxCircle: number;
}

/**
 * Calcula a quantidade total de fórmulas e o círculo máximo permitido para o Alquimista Iniciado.
 * Livro básico: "Você aprende três fórmulas de 1º círculo. A cada nível ímpar seguinte (ou nível de inventor além do 1º),
 * aprende mais uma fórmula de qualquer círculo que possa lançar."
 * Círculo máximo: até 2º círculo a partir do 6º nível. Com Mestre Alquimista: 3º no 10º, 4º no 14º, 5º no 18º.
 */
export function calcularFormulasAlquimistaIniciado(
  nivelInventor: number,
  possuiMestreAlquimista: boolean = false
): FormulasAlquimistaResult {
  const nivel = Math.max(1, nivelInventor);
  const totalFormulas = 3 + Math.max(0, nivel - 1);

  let maxCircle = 1;
  if (possuiMestreAlquimista) {
    if (nivel >= 18) maxCircle = 5;
    else if (nivel >= 14) maxCircle = 4;
    else if (nivel >= 10) maxCircle = 3;
    else if (nivel >= 6) maxCircle = 2;
    else maxCircle = 1;
  } else {
    if (nivel >= 6) maxCircle = 2;
    else maxCircle = 1;
  }

  return { totalFormulas, maxCircle };
}

/**
 * Valida se uma magia pode ser utilizada na fabricação de poção ou escrita de pergaminho.
 * O personagem só pode produzir poções e pergaminhos de magias que ele próprio conhece.
 */
export function podeFabricarPocaoOuPergaminho(
  magiaIdOuNome: string,
  magiasConhecidas: string[]
): boolean {
  if (!magiaIdOuNome || !Array.isArray(magiasConhecidas) || magiasConhecidas.length === 0) {
    return false;
  }
  const normalizar = (s: string) =>
    s
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[-_\s]+/g, '_');

  const normAlvo = normalizar(magiaIdOuNome);
  return magiasConhecidas.some(m => normalizar(m) === normAlvo);
}
