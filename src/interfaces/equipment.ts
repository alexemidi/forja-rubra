/**
 * Contratos de Equipamentos, Armas, Armaduras, Mochilas, Melhorias e Encantamentos.
 */

import type { AtributoChave } from './attributes.ts';

export type TipoMochila = 'comum' | 'aventureiro' | 'carga' | 'discreta' | 'armacao' | '';

export interface BeneficiosMochila {
  bonus: number;
  vestidosExtras: number;
  atributo: AtributoChave;
  valor: number;
}

export interface ImprovementApplied {
  id: string;
  materialId?: string;
  name?: string;
  [key: string]: unknown;
}

export interface EnchantmentApplied {
  id: string;
  spellId?: string;
  name?: string;
  [key: string]: unknown;
}

export interface ItemOptionsConfig {
  improvements?: ImprovementApplied[];
  enchantments?: EnchantmentApplied[];
  specialMaterial?: string;
  customName?: string;
  [key: string]: unknown;
}

export interface BackpackItem {
  instanceId?: string;
  itemId: string;
  nome?: string;
  quantity: number;
  spaces?: number;
  equipped?: boolean;
  mountPartnerId?: string;
  carriedByMountId?: string;
  grants?: string[];
  options?: ItemOptionsConfig;
  [key: string]: unknown;
}

export interface CatalogItem {
  id: string;
  nome: string;
  categoria?: string;
  subcategoria?: string;
  preco?: number;
  espacos?: number;
  descricao?: string;
  livro?: string;
  armadura?: {
    defesa: number;
    penalidade: number;
  };
  arma?: {
    dano?: string;
    critico?: string;
    alcance?: string;
    tipo?: string;
    empunhadura?: string;
    proposito?: string;
    proficiencia?: string;
  };
  [key: string]: unknown;
}

export interface InventoryCardRenderProps {
  id?: string;
  itemId?: string;
  tipo?: string;
  titulo?: string;
  tipoLabel?: string;
  categoria?: string;
  livro?: string;
  iconeHtml?: string;
  statsHtml?: string;
  propriedadesHtml?: string;
  corpoHtml?: string;
  melhoriasHtml?: string;
  acoesHtml?: string;
  expandido?: boolean;
  selecionado?: boolean;
  equipado?: boolean;
  meta?: string;
  acaoCard?: string;
  acaoResumo?: string;
}
