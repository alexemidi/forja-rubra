/**
 * Separação e restauração entre o estado de domínio persistido do personagem
 * e o estado transitório de interface (UI).
 */

export type StateRecord = Record<string, any>;

const UI_FIELDS = Object.freeze({
  raiz: [
    'step',
    'sheetView',
    'previousSheetView',
    'previousCreationStep',
    'progressionActiveIndex',
    'progressionCollapsedIndex',
    'sheetLayoutMode',
    'workshopSection',
    'workshopReadOnly',
  ],
  identity: ['editingLevel'],
  origin: ['previewBenefit'],
  powers: [
    'categoryFilter',
    'statusFilter',
    'previewId',
    'activeSlot',
    'phase6StageIndex',
  ],
  deity: ['previewPower', 'previewDeity', 'activePowerIndex'],
  progression: [
    'previewPowerId',
    'previewPowerChoice',
    'powerSourceFilter',
    'powerCategoryFilter',
    'powerStatusFilter',
  ],
} as const);

const UI_ENVELOPE_KEY = '__forjaInterface';

function isRecord(value: unknown): value is StateRecord {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function cloneJson<T extends StateRecord>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

/**
 * Reconstitui o contrato legado somente na fronteira de leitura.
 * Não sobrescreve dados do personagem com propriedades arbitrárias de interface.
 */
export function restaurarEstadoInterface(value: StateRecord): StateRecord {
  const result = cloneJson(value);
  if (!(UI_ENVELOPE_KEY in result)) return result;

  const saved = result[UI_ENVELOPE_KEY];
  if (!isRecord(saved) || saved.versao !== 1 || !isRecord(saved.valores)) {
    throw new Error('Versão de interface incompatível; preserve o backup.');
  }
  delete result[UI_ENVELOPE_KEY];
  const ui = saved.valores;

  const restore = (
    target: StateRecord,
    source: unknown,
    names: readonly string[]
  ): void => {
    if (isRecord(source)) {
      for (const name of names) {
        if (Object.hasOwn(source, name)) {
          target[name] = source[name];
        }
      }
    }
  };

  restore(result, ui.raiz, UI_FIELDS.raiz);
  for (const key of ['identity', 'origin', 'powers', 'deity'] as const) {
    if (isRecord(ui[key])) {
      if (!isRecord(result[key])) result[key] = {};
      restore(result[key], ui[key], UI_FIELDS[key]);
    }
  }
  if (Array.isArray(result.progression) && Array.isArray(ui.progression)) {
    result.progression.forEach((row: StateRecord, index: number) =>
      restore(row, ui.progression[index], UI_FIELDS.progression)
    );
  }

  Object.defineProperty(result, UI_ENVELOPE_KEY, {
    value: saved,
    enumerable: false,
    configurable: true,
  });
  return result;
}

/**
 * Produz uma ficha persistível com domínio e interface separados, sem mutar a origem.
 */
export function separarEstadoInterface(value: StateRecord): StateRecord {
  const original = value[UI_ENVELOPE_KEY];
  const domain = restaurarEstadoInterface(value);
  const ui: StateRecord =
    isRecord(original) && original.versao === 1
      ? cloneJson(original.valores)
      : {};

  const take = (
    source: StateRecord,
    names: readonly string[],
    previous: StateRecord = {}
  ): StateRecord => {
    const target: StateRecord = { ...previous };
    for (const name of names) {
      delete target[name];
      if (Object.hasOwn(source, name)) {
        target[name] = source[name];
        delete source[name];
      }
    }
    return target;
  };

  ui.raiz = take(domain, UI_FIELDS.raiz, ui.raiz);
  for (const key of ['identity', 'origin', 'powers', 'deity'] as const) {
    if (isRecord(domain[key])) {
      ui[key] = take(domain[key], UI_FIELDS[key], ui[key]);
    }
  }
  if (Array.isArray(domain.progression)) {
    ui.progression = domain.progression.map(
      (row: StateRecord, index: number) =>
        take(row, UI_FIELDS.progression, ui.progression?.[index])
    );
  }

  Object.defineProperty(domain, UI_ENVELOPE_KEY, {
    value: { versao: 1, valores: ui },
    enumerable: true,
    configurable: true,
    writable: true,
  });
  return domain;
}
