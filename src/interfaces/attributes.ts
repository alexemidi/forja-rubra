/**
 * Contratos de Atributos de Tormenta 20
 * Baseado na modelagem de domínio do Fichas de Nimb e nas regras do Livro Básico T20.
 */

export type AtributoChave = 'for' | 'des' | 'con' | 'int' | 'sab' | 'car';

export interface Atributos {
  for: number;
  des: number;
  con: number;
  int: number;
  sab: number;
  car: number;
}

export type ModificadoresAtributo = Partial<Record<AtributoChave, number>>;

export type CustosCompraAtributo = Record<number, number>;

export const ATRIBUTOS_ORDEM: readonly AtributoChave[] = Object.freeze([
  'for',
  'des',
  'con',
  'int',
  'sab',
  'car',
]);
