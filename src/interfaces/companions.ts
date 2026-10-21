/**
 * Contratos de Parceiros, Montarias, Familiares e Mercenários.
 */

export type PatamarParceiro = 'iniciante' | 'veterano' | 'mestre';

export type TamanhoCriatura =
  | 'Minúsculo'
  | 'Pequeno'
  | 'Médio'
  | 'Grande'
  | 'Enorme'
  | 'Colossal';

export interface PenalidadesMontaria {
  cavalgar: number;
  ataqueDistancia: number;
  magiaCondicaoRuim: boolean;
}

export interface PartnerEntry {
  id: string;
  name?: string;
  nome?: string;
  type?: string;
  tier?: PatamarParceiro;
  size?: TamanhoCriatura;
  isMount?: boolean;
  flying?: boolean;
  duration?: 'adventure' | 'permanent';
  source?: string;
  [key: string]: unknown;
}
