/**
 * Lógica Tipada de Carrinho e Checkout Padronizado (Lojas, Taverna, Guilda e Oficinas).
 * Calcula subtotais, descontos/acréscimos em passos de 10% arredondados para cima,
 * remoção individual de itens e validação de saldo.
 */

import type {
  CartItemEntry,
  TransactionMode,
  TransactionPriceCalculation,
} from '../../interfaces/market.ts';
import { calcularPrecoComModificador } from '../../lib/t20/economy.ts';

export interface CartCheckoutSummary extends TransactionPriceCalculation {
  items: CartItemEntry[];
  totalItemsCount: number;
  availableBalance: number;
  remainingBalance: number;
  deficit: number;
  canAfford: boolean;
}

export function calculateCartCheckout(
  items: CartItemEntry[],
  modifierSteps: number,
  availableBalance: number,
  mode: TransactionMode = 'buy',
): CartCheckoutSummary {
  const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];
  const baseTotal = safeItems.reduce((sum, item) => {
    const qty = Math.max(1, Math.trunc(Number(item.quantity) || 1));
    const unit = Math.max(0, Number(item.basePrice) || 0);
    return sum + unit * qty;
  }, 0);

  const totalItemsCount = safeItems.reduce(
    (sum, item) => sum + Math.max(1, Math.trunc(Number(item.quantity) || 1)),
    0,
  );

  const steps = Math.trunc(Number(modifierSteps) || 0);
  const basePercent = mode === 'sell' ? 50 : 100;
  const percentMultiplier = Math.max(0, basePercent + steps * 10);
  const finalTotal = calcularPrecoComModificador(baseTotal, steps, basePercent);

  if (mode === 'sell') {
    const nextBalance = availableBalance + finalTotal;
    return {
      items: safeItems,
      totalItemsCount,
      baseTotal,
      modifierSteps: steps,
      percentMultiplier,
      finalTotal,
      availableBalance,
      remainingBalance: nextBalance,
      deficit: 0,
      canAfford: true,
    };
  }

  const remainingBalance = availableBalance - finalTotal;
  const deficit = Math.max(0, finalTotal - availableBalance);

  return {
    items: safeItems,
    totalItemsCount,
    baseTotal,
    modifierSteps: steps,
    percentMultiplier,
    finalTotal,
    availableBalance,
    remainingBalance,
    deficit,
    canAfford: remainingBalance >= 0,
  };
}

export function removeCartItemAtIndex<T>(items: T[], index: number): T[] {
  if (!Array.isArray(items)) return [];
  if (index < 0 || index >= items.length) return [...items];
  return items.filter((_, i) => i !== index);
}
