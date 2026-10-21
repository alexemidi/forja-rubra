/**
 * Regras puras de Inventário: venda, consolidação de pilhas, desequipar e consumo de munição/itens.
 */

import type { BackpackItem } from '../../interfaces/equipment.ts';
import type { EquipmentSlotState } from './equipment-slots.ts';

export type RoundingMode = 'centavos' | 'inteiro';

export interface SellResult {
  alterado: boolean;
  backpack: BackpackItem[];
  quantidade: number;
  total: number;
}

export interface ConsumeResult {
  alterado: boolean;
  backpack: BackpackItem[];
}

export function precoVenda(valor: number, percentual = 50): number {
  return Math.floor((valor * percentual) / 100);
}

export function totalVenda(
  quantidade: number,
  preco: number,
  arredondamento: RoundingMode = 'centavos'
): number {
  const total = quantidade * preco;
  return arredondamento === 'inteiro'
    ? Math.floor(total)
    : Math.round(total * 100) / 100;
}

export function vender(
  backpack: readonly BackpackItem[],
  id: string,
  quantidade: number,
  preco: number,
  identificar: (entry: BackpackItem, index: number) => string,
  arredondamento: RoundingMode = 'centavos'
): SellResult {
  let index = backpack.findIndex((entry, i) => identificar(entry, i) === id);
  if (index < 0 && typeof id === 'string') {
    index = backpack.findIndex(
      (entry, i) =>
        entry.instanceId === id ||
        entry.uid === id ||
        entry.id === id ||
        (id.includes(':') &&
          entry.itemId === id.split(':')[0] &&
          String(i) === id.split(':')[1])
    );
  }
  if (index < 0 && typeof id === 'string') {
    const baseId = id.includes(':') ? id.split(':')[0] : id;
    index = backpack.findIndex((entry) => entry.itemId === baseId);
  }
  const unchanged: SellResult = {
    alterado: false,
    backpack: [...backpack],
    quantidade: 0,
    total: 0,
  };
  if (
    index < 0 ||
    !Number.isFinite(quantidade) ||
    !Number.isFinite(preco) ||
    quantidade <= 0 ||
    preco < 0
  ) {
    return unchanged;
  }
  const entry = backpack[index];
  const available = Number(entry.quantity || 1);
  if (!Number.isFinite(available) || available <= 0) return unchanged;
  const sold = Math.min(available, quantidade);
  const result = backpack.slice();
  const total = totalVenda(sold, preco, arredondamento);
  if (!Number.isFinite(total)) return unchanged;
  if (sold >= available) result.splice(index, 1);
  else result[index] = { ...entry, quantity: available - sold };
  return { alterado: true, backpack: result, quantidade: sold, total };
}

export function desequipar(
  equipment: EquipmentSlotState,
  id: string
): EquipmentSlotState {
  const result: EquipmentSlotState = { ...equipment };
  for (const slot of [
    'armorId',
    'shieldId',
    'weaponId',
    'offhandId',
    'trailerId',
  ] as const) {
    if (result[slot] === id) result[slot] = 'none';
  }
  if (Array.isArray(result.wornIds)) {
    result.wornIds = result.wornIds.filter((value) => value !== id);
  }
  return result;
}

export function consolidar(backpack: readonly BackpackItem[]): BackpackItem[] {
  if (!Array.isArray(backpack) || backpack.length === 0) {
    return (backpack as BackpackItem[]) || [];
  }
  const result: BackpackItem[] = [];
  const indices = new Map<string, Map<string, BackpackItem>>();

  for (const original of backpack) {
    if (!original) continue;
    const acq = original.acquisition as Record<string, any> | undefined;
    const entry: BackpackItem = {
      ...original,
      acquisition: acq ? { ...acq } : acq,
    };
    const entryAcq = entry.acquisition as Record<string, any> | undefined;
    if (entryAcq?.additionalGrantIds) {
      entryAcq.additionalGrantIds = [...entryAcq.additionalGrantIds];
    }
    if (
      [entry.itemId, entry.displayName, entry.itemName].some((value) =>
        /traje_de_viaj/i.test(String(value || ''))
      )
    ) {
      entry.itemId = 'traje_de_viajante';
      entry.itemName = entry.displayName = 'Traje de Viajante';
    }
    const isEng = Boolean(
      entry.isEngenhoca ||
        entry.contraptionId ||
        entry.engenhocaInfo ||
        (entry.itemId && String(entry.itemId).startsWith('engenhoca_')) ||
        entry.tipo === 'engenhoca' ||
        entry.categoriaId === 'engenhoca'
    );
    if (isEng) {
      result.push(entry);
      continue;
    }
    let byOptions = indices.get(entry.itemId);
    if (!byOptions) {
      byOptions = new Map();
      indices.set(entry.itemId, byOptions);
    }
    const nameKey = String(
      entry.displayName || entry.itemName || entry.customName || ''
    ).trim();
    const isDamaged = Boolean(
      entry.estragado || entry.isDamaged || entry.damaged
    );
    const key = JSON.stringify([
      nameKey,
      isDamaged,
      JSON.stringify(entry.options || {}),
      JSON.stringify(entry.improvements || []),
      JSON.stringify(entry.enchantments || []),
      entry.mountPartnerId || null,
      entry.carriedByMountId || null,
    ]);
    const existing = byOptions.get(key);
    if (existing) {
      existing.quantity =
        (Number(existing.quantity) || 1) + (Number(entry.quantity) || 1);
      const exAcq = (existing.acquisition || {}) as Record<string, any>;
      existing.acquisition = exAcq;
      if (entryAcq?.source) exAcq.source = entryAcq.source;
      if (entryAcq?.operationId) exAcq.operationId = entryAcq.operationId;
      if (!exAcq.additionalGrantIds) exAcq.additionalGrantIds = [];
      if (entryAcq?.grantId) exAcq.additionalGrantIds.push(entryAcq.grantId);
      if (entryAcq?.additionalGrantIds) {
        exAcq.additionalGrantIds.push(...entryAcq.additionalGrantIds);
      }
    } else {
      result.push(entry);
      byOptions.set(key, entry);
    }
  }
  for (const entry of result) {
    if (entry.itemId === 'traje_de_viajante') entry.quantity = 1;
  }
  return result;
}

export function consumir(
  backpack: readonly BackpackItem[],
  id: string,
  tipo: string,
  identificar: (entry: BackpackItem, index: number) => string
): ConsumeResult {
  const index = backpack.findIndex((entry, i) => identificar(entry, i) === id);
  if (index < 0) return { alterado: false, backpack: [...backpack] };
  const entry = backpack[index];
  const disparo = tipo === 'fire';
  const quantidade = Math.max(
    0,
    Number(
      disparo
        ? (entry.ammoRemaining ?? entry.quantity ?? 0)
        : (entry.quantity || 0)
    )
  );
  if (!quantidade) return { alterado: false, backpack: [...backpack] };
  const result = backpack.slice();
  if (disparo) {
    result[index] = { ...entry, ammoRemaining: quantidade - 1 };
  } else if (quantidade <= 1) {
    result.splice(index, 1);
  } else {
    result[index] = { ...entry, quantity: quantidade - 1 };
  }
  return { alterado: true, backpack: result };
}

export function atualizarPerfis(
  serializado: string | null | undefined,
  atualizar: (backpack: BackpackItem[]) => boolean | void
): string | null {
  let profiles: Record<string, any>;
  try {
    profiles = JSON.parse(serializado || '{}');
  } catch {
    return null;
  }
  if (!profiles || typeof profiles !== 'object') profiles = {};
  if (!Array.isArray(profiles.profiles)) {
    profiles.profiles = [{ id: 'ficha-ativa', backpack: [] }];
    profiles.activeId = 'ficha-ativa';
  }
  let index = profiles.profiles.findIndex(
    (profile: Record<string, any>) =>
      profile.id === 'ficha-ativa' || profile.id === profiles.activeId
  );
  if (index < 0) {
    profiles.profiles.push({ id: 'ficha-ativa', backpack: [] });
    index = profiles.profiles.length - 1;
  }
  const backpack: BackpackItem[] =
    profiles.profiles[index].backpack ||
    (profiles.profiles[index].backpack = []);
  if (atualizar(backpack) === false) return null;
  return JSON.stringify(profiles);
}

export const RegrasInventario = Object.freeze({
  vender,
  desequipar,
  consolidar,
  precoVenda,
  totalVenda,
  consumir,
  atualizarPerfis,
});

export default RegrasInventario;
