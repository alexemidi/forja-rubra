/**
 * Regras puras de Operações de Transação na Loja (Compra, Fabricação e Escolhas Iniciais).
 */

export interface ShopOperationMessage {
  operationId?: string;
  storage?: Record<string, string>;
  kind?: 'purchase' | 'craft' | 'initial' | string;
  total?: number;
  gift?: boolean;
  grants?: string[];
  unresolved?: unknown[];
  finalize?: boolean;
}

export function preparar(
  arsenal: Record<string, any>,
  finances: Record<string, any>,
  completed: readonly number[],
  message: ShopOperationMessage,
  remainingFunds: number,
  profilesKey: string
): Record<string, any> {
  if (
    !message.operationId ||
    !message.storage ||
    !['purchase', 'craft', 'initial'].includes(String(message.kind || ''))
  ) {
    return { status: 'invalid' };
  }
  const previous = arsenal.operations?.[message.operationId];
  if (previous) return { status: 'repeated', result: previous };

  const total = Math.max(0, Number(message.total) || 0);
  if (!Number.isFinite(total)) return { status: 'invalid' };

  let saved: Record<string, any>;
  try {
    saved = JSON.parse(
      JSON.stringify({ ...arsenal, storage: message.storage })
    );
  } catch {
    return { status: 'invalid' };
  }

  const nextFinances = { ...finances };
  const nextCompleted = [...completed];
  const gift =
    Boolean(message.gift) ||
    (message.kind === 'purchase' && total > remainingFunds);

  if (['purchase', 'craft'].includes(String(message.kind)) && !gift) {
    nextFinances.spent = (Number(nextFinances.spent) || 0) + total;
  }

  if (message.kind === 'purchase') {
    let profiles: Record<string, any>;
    try {
      profiles = JSON.parse(saved.storage[profilesKey] || '{}');
    } catch {
      return { status: 'invalid' };
    }
    if (
      !profiles ||
      typeof profiles !== 'object' ||
      (profiles.profiles !== undefined && !Array.isArray(profiles.profiles))
    ) {
      return { status: 'invalid' };
    }
    for (const profile of profiles.profiles || []) {
      if (
        !profile ||
        (profile.backpack !== undefined && !Array.isArray(profile.backpack))
      ) {
        return { status: 'invalid' };
      }
      for (const item of profile.backpack || []) {
        if (item?.acquisition?.operationId === message.operationId) {
          item.acquisition.source = gift ? 'gift' : 'purchase';
        }
      }
    }
    saved.storage[profilesKey] = JSON.stringify(profiles);
  }

  saved.grants = { ...saved.grants };
  saved.operations = { ...saved.operations };
  for (const grant of message.grants || []) saved.grants[grant] = true;
  saved.grants[message.operationId] = true;

  if (message.kind === 'initial') {
    saved.pending = null;
    saved.unresolved = message.unresolved || [];
    if (message.finalize) {
      saved.complete = true;
      if (!nextCompleted.includes(8)) nextCompleted.push(8);
    } else {
      saved.choiceIndex = (Number(saved.choiceIndex) || 0) + 1;
    }
  }

  const result = { total, gift, kind: message.kind };
  saved.operations[message.operationId] = result;
  return {
    status: 'ready',
    arsenal: saved,
    finances: nextFinances,
    completed: nextCompleted,
    result,
  };
}

export const OperacoesLoja = Object.freeze({ preparar });

export default OperacoesLoja;
