/**
 * Contratos de Poderes Gerais, de Classe, Origem, Raça, Distinções e Golpe Pessoal.
 */

import type { AtributoChave } from './attributes.ts';

export type PowerCategory =
  | 'combate'
  | 'destino'
  | 'magia'
  | 'tormenta'
  | 'concedido'
  | 'classe'
  | 'raca'
  | 'origem'
  | 'distincao'
  | string;

export interface PowerEntry {
  id: string;
  nome: string;
  categoria: PowerCategory;
  descricao?: string;
  preRequisitosTexto?: string;
  classeIds?: string[];
  generalPower?: boolean;
  raceOption?: boolean;
  [key: string]: unknown;
}

export type Phase6StageType =
  | 'race'
  | 'general'
  | 'origin_general'
  | 'duplo_feerico'
  | 'cosmopolita'
  | 'futura_lenda';

export interface Phase6SubStage {
  type: Phase6StageType;
  slot?: number;
  optionId?: string;
  label: string;
}

export interface DistinctionMarkContext {
  heavyArmor?: boolean;
  count?: number;
}

export interface DistinctionMarkEffects {
  skills: Record<string, number>;
  attributes: Record<string, AtributoChave>;
  defense: number;
  pmFlat: number;
}

export interface GolpePessoalEffectDefinition {
  name: string;
  cost: number;
  variableCost?: boolean;
  maxRepeats?: number;
  category?: 'ofensivo' | 'limitador' | 'utilitario' | string;
  description?: string;
  [key: string]: unknown;
}

export interface GolpePessoalBuildStep {
  effectName: string;
  repeats?: number;
  customCost?: number;
  meta?: Record<string, unknown>;
}
