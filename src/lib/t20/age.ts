/**
 * Regras puras de Idade e Faixas Etárias canônicas de Tormenta 20.
 */

export interface AgeBandDefinition {
  start: number;
  mods?: Record<string, number>;
  [key: string]: unknown;
}

export interface AgeInterval {
  min: number;
  max: number | null;
}

export interface AgeClampResult {
  years: string;
  notice: string;
}

export function multiplicador(_raceId?: string): number {
  return 1;
}

export function intervalos(
  faixas: Record<string, AgeBandDefinition>
): Record<string, AgeInterval> {
  const ids = Object.keys(faixas);
  const inicios: Record<string, number> = {};
  for (const id of ids) {
    inicios[id] = faixas[id].start;
  }
  return Object.fromEntries(
    ids.map((id, i) => [
      id,
      {
        min: inicios[id],
        max: i === ids.length - 1 ? null : inicios[ids[i + 1]] - 1,
      },
    ])
  );
}

export function sobreposicao(): boolean {
  return false;
}

export function modificadores(
  regra?: AgeBandDefinition | null
): Record<string, number> {
  return { ...(regra?.mods || {}) };
}

export function limitar(
  anos: string | number,
  intervalo?: AgeInterval | null
): AgeClampResult | null {
  if (!intervalo || anos === '') return null;
  const antes = Math.round(Number(anos));
  const depois = Math.max(
    intervalo.min,
    intervalo.max === null ? antes : Math.min(intervalo.max, antes)
  );
  return {
    years: String(depois),
    notice:
      antes !== depois ? `Idade ajustada de ${antes} para ${depois}.` : '',
  };
}

export const RegrasIdade = Object.freeze({
  multiplicador,
  intervalos,
  sobreposicao,
  modificadores,
  limitar,
});

export default RegrasIdade;
