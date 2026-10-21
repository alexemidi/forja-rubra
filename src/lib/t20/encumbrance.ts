/**
 * Regras puras de capacidade de carga, mochilas, armação e poderes de carga (Tormenta 20).
 */

import type { AtributoChave } from '../../interfaces/attributes.ts';
import type { TipoMochila, BeneficiosMochila } from '../../interfaces/equipment.ts';

const chave = (valor: string): string =>
  String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

/** Identifica mochilas e armação por identificador ou nome canônico. */
export function tipoMochila(id: string, nome = ''): TipoMochila {
  const values = [chave(id), chave(nome)];
  for (const v of values) {
    if (v === 'mochila') return 'comum';
    if (v.includes('mochila_de_aventureiro')) return 'aventureiro';
    if (v.includes('mochila_discreta')) return 'discreta';
    if (v.includes('mochila_de_carga') || v === 'mochila_carga') return 'carga';
    if (v.includes('armacao_para_mochila')) return 'armacao';
  }
  return '';
}

export function possuiPoderCarga(poderes: readonly string[], nome: string): boolean {
  const target = chave(nome);
  return poderes.some((p) => chave(p).includes(target));
}

export function mochilaIsenta(tipo: string, poderes: readonly string[]): boolean {
  return (
    tipo === 'armacao' ||
    tipo === 'comum' ||
    (tipo === 'aventureiro' && possuiPoderCarga(poderes, 'andarilho_carregado'))
  );
}

/** Bônus não se multiplica por exemplares do mesmo equipamento. */
export function beneficiosMochilas(
  vestidos: readonly string[],
  poderes: readonly string[],
  atributos: Record<string, number>
): BeneficiosMochila {
  const aventureiro = vestidos.includes('aventureiro');
  let atributo: AtributoChave = 'for';
  let valor = Number(atributos.for) || 0;
  const candidatos: AtributoChave[] = ['for'];
  if (possuiPoderCarga(poderes, 'organizadinhos')) candidatos.push('des');
  if (aventureiro && possuiPoderCarga(poderes, 'andarilho_carregado')) {
    candidatos.push('sab');
  }
  for (const a of candidatos) {
    if (Number(atributos[a]) > valor) {
      atributo = a;
      valor = Number(atributos[a]);
    }
  }
  const bonus =
    (aventureiro ? (vestidos.includes('armacao') ? 6 : 2) : 0) +
    (vestidos.includes('carga') ? 10 : 0);
  return {
    bonus,
    atributo,
    valor,
    vestidosExtras: possuiPoderCarga(poderes, 'organizadinhos') ? 1 : 0,
  };
}

/** Bônus de poderes, contando cada poder da Tormenta uma vez. */
export function bonusPoderesCarga(
  poderes: readonly { id?: string; nome?: string; categoria?: string }[]
): number {
  const unicos = [
    ...new Map(poderes.map((p) => [p.id || p.nome || '', p])).values(),
  ];
  const possui = (nome: string): boolean =>
    unicos.some((p) => chave(p.id || p.nome || '').includes(nome));
  const tormenta = unicos.filter(
    (p) => chave(p.categoria || '') === 'tormenta'
  ).length;
  return (
    (possui('soldado_de_infantaria') ? 6 : 0) +
    (possui('bolsoes_insanos') ? 2 + Math.max(0, tormenta - 1) : 0) +
    (possui('mochileiro') ? 5 : 0) +
    (possui('grandao') ? 5 : 0)
  );
}
