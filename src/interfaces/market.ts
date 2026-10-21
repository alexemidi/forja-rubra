/**
 * Contratos de Transações de Mercado (Loja, Taverna, Grimório, Oficinas) e Modais Padronizados.
 */

export type TransactionMode = 'buy' | 'sell' | 'craft';

export interface CartItemEntry {
  id: string;
  itemId: string;
  name: string;
  basePrice: number;
  quantity: number;
  category?: string;
  details?: string;
  [key: string]: unknown;
}

export interface TransactionPriceCalculation {
  baseTotal: number;
  modifierSteps: number; // Cada step = +10% ou -10%
  percentMultiplier: number; // Ex: 100%, 90%, 110% (na compra base 100%) ou 50% (na venda base 50%)
  finalTotal: number; // Sempre arredondado para cima (Math.ceil)
}

export type StandardModalType = 'transaction' | 'confirm' | 'choice';

export interface StandardModalAction {
  id: string;
  label: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}
