/**
 * Card padronizado de item no inventário (compartilhado entre Ficha e Loja).
 * Textos e identificadores são escapados contra injeção XSS.
 */

export interface InventoryCardData {
  id: string;
  itemId: string;
  tipo: string;
  titulo: string;
  tipoLabel: string;
  categoria: string;
  livro: string;
  iconeHtml: string;
  statsHtml: string;
  propriedadesHtml: string;
  corpoHtml: string;
  extraHtml?: string;
  melhoriasHtml: string;
  acoesHtml: string;
}

export function escapeHtml(value: string): string {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (char) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[char] ?? char
  );
}

export function renderCardInventario(card: InventoryCardData): string {
  return `<div class="sheet-item-inline-details" data-inline-details="${escapeHtml(card.id)}">
    <article class="item-card" data-type="${escapeHtml(card.tipo)}" data-item-id="${escapeHtml(card.itemId)}" data-instance-id="${escapeHtml(card.id)}">
      <div class="card-header">
        <div class="title-row"><div style="display:flex;align-items:center;gap:8px;">
          <span class="item-icon" aria-hidden="true">${card.iconeHtml}</span><h3 class="item-title">${escapeHtml(card.titulo)}</h3>
        </div></div>
        <div class="badges"><span class="badge badge-type-${escapeHtml(card.tipo)}">${escapeHtml(card.tipoLabel)}</span>
          ${card.categoria ? `<span class="badge">${escapeHtml(card.categoria)}</span>` : ''}
          <span class="badge badge-book">${escapeHtml(card.livro)}</span>
        </div>
      </div>
      ${card.statsHtml}
      <div class="item-card-detail">${card.propriedadesHtml}<div class="card-body">${card.corpoHtml}</div>${card.extraHtml ?? ''}</div>
      <div class="card-overlay">
        <button class="expand-item-button" type="button" data-sheet-card-expand="${escapeHtml(card.id)}"><span class="expand-arrow">▾</span> <span class="expand-text">Ver item completo</span></button>
        <div class="card-bottom-actions">${card.melhoriasHtml}<div style="display:flex;gap:6px;align-items:center;margin-left:auto;">${card.acoesHtml}</div></div>
      </div>
    </article>
  </div>`;
}
