/**
 * Sistema Unificado dos 3 Modelos Padronizados de Janela (Modal) da Forja T20:
 * 1. TransactionModal: Compras e Vendas (Loja, Taverna, Grimório, Oficinas) com carrinho, remoção por item (X) e modificador ±10%.
 * 2. ConfirmModal: Confirmações diretas (Subir de Nível, Descanso, Fim da Aventura).
 * 3. ChoiceModal: Escolhas rápidas (Temporários para o Dia vs. para a Aventura).
 */

import type {
  CartItemEntry,
  StandardModalAction,
} from '../../interfaces/market.ts';
import { calcularPrecoComModificador } from '../../lib/t20/economy.ts';
import { escapeHtml } from './inventory-card.ts';

export interface TransactionModalProps {
  title: string;
  mode: 'buy' | 'sell';
  items: readonly CartItemEntry[];
  modifierSteps?: number;
  basePercent?: number;
  confirmLabel?: string;
  cancelLabel?: string;
}

export interface ConfirmModalProps {
  title: string;
  messageHtml: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export interface ChoiceModalProps {
  title: string;
  subtitle?: string;
  choices: readonly StandardModalAction[];
}

export function renderTransactionModalHtml(
  props: TransactionModalProps
): string {
  const basePercent =
    props.basePercent ?? (props.mode === 'sell' ? 50 : 100);
  const steps = props.modifierSteps ?? 0;
  const activePercent = Math.max(0, basePercent + steps * 10);
  const baseSum = props.items.reduce(
    (acc, item) => acc + item.basePrice * item.quantity,
    0
  );
  const finalTotal = calcularPrecoComModificador(
    baseSum,
    steps,
    basePercent
  );

  const itemsHtml = props.items
    .map(
      (item) => `<div class="forja-tx-cart-row" data-cart-row="${escapeHtml(item.id)}">
        <div class="forja-tx-cart-info">
          <strong class="forja-tx-cart-name">${escapeHtml(item.name)}</strong>
          ${item.quantity > 1 ? `<span class="forja-tx-cart-qty">×${item.quantity}</span>` : ''}
        </div>
        <div class="forja-tx-cart-right">
          <span class="forja-tx-cart-price">T$ ${calcularPrecoComModificador(item.basePrice * item.quantity, steps, basePercent)}</span>
          <button type="button" class="forja-tx-remove-btn" data-remove-cart-item="${escapeHtml(item.id)}" aria-label="Remover item" title="Remover item">×</button>
        </div>
      </div>`
    )
    .join('');

  return `<div class="forja-modal-standard forja-modal-transaction" role="dialog" aria-modal="true">
    <header class="forja-modal-header">
      <h3 class="forja-modal-title">${escapeHtml(props.title)}</h3>
    </header>
    <div class="forja-tx-cart-list">${itemsHtml}</div>
    <div class="forja-tx-mod-controls">
      <button type="button" class="forja-tx-mod-btn" data-tx-mod="-1">-10%</button>
      <span class="forja-tx-mod-value">${activePercent}%</span>
      <button type="button" class="forja-tx-mod-btn" data-tx-mod="+1">+10%</button>
    </div>
    <div class="forja-tx-total-bar">
      <span>Total</span>
      <strong data-tx-final-total="${finalTotal}">T$ ${finalTotal}</strong>
    </div>
    <footer class="forja-modal-footer">
      <button type="button" class="button ghost" data-modal-action="cancel">${escapeHtml(props.cancelLabel || 'Cancelar')}</button>
      <button type="button" class="button primary" data-modal-action="confirm">${escapeHtml(props.confirmLabel || 'Confirmar')}</button>
    </footer>
  </div>`;
}

export function renderConfirmModalHtml(props: ConfirmModalProps): string {
  return `<div class="forja-modal-standard forja-modal-confirm" role="dialog" aria-modal="true">
    <header class="forja-modal-header">
      <h3 class="forja-modal-title">${escapeHtml(props.title)}</h3>
    </header>
    <div class="forja-modal-body">${props.messageHtml}</div>
    <footer class="forja-modal-footer">
      <button type="button" class="button ghost" data-modal-action="cancel">${escapeHtml(props.cancelLabel || 'Cancelar')}</button>
      <button type="button" class="button primary" data-modal-action="confirm">${escapeHtml(props.confirmLabel || 'Confirmar')}</button>
    </footer>
  </div>`;
}

export function renderChoiceModalHtml(props: ChoiceModalProps): string {
  const buttonsHtml = props.choices
    .map(
      (c) =>
        `<button type="button" class="forja-choice-option-btn" data-choice-id="${escapeHtml(c.id)}">${escapeHtml(c.label)}</button>`
    )
    .join('');

  return `<div class="forja-modal-standard forja-modal-choice" role="dialog" aria-modal="true">
    <header class="forja-modal-header">
      <h3 class="forja-modal-title">${escapeHtml(props.title)}</h3>
      ${props.subtitle ? `<p class="forja-modal-subtitle">${escapeHtml(props.subtitle)}</p>` : ''}
    </header>
    <div class="forja-choice-options">${buttonsHtml}</div>
  </div>`;
}
