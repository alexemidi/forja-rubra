/**
 * Modelo de Estado Tipado do Criador de Personagens (Forja T20).
 * Define o estado padrão, normalização e migração de esquemas persistidos.
 */

import type { CharacterState } from '../../../interfaces/character-sheet.ts';
import { restaurarEstadoInterface } from '../../../lib/storage/ui-state.ts';

export const STATE_SCHEMA_VERSION = 1;

export function validCharacterLevel(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) ? Math.max(1, Math.min(20, Math.trunc(num) || 1)) : 1;
}

export function defaultState(): CharacterState {
  return {
    stateSchemaVersion: STATE_SCHEMA_VERSION,
    layoutVersion: 5,
    step: 1,
    completed: [],
    attributes: { for: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 },
    identity: {
      characterName: '',
      playerName: '',
      raceId: 'humano',
      classId: 'arcanista',
      initialLevel: 1,
      plannedLevel: 1,
      editingLevel: 1,
      openRaceBonusEnabled: false,
      openRaceAllocations: {},
      baseAttrs: { for: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 },
      raceAttrs: [],
      raceSpecialAttrs: {},
      raceSubAttrs: {},
      raceChoices: {},
      classChoices: {},
      classRequiredChoices: {},
      classRequiredOffices: {},
    },
    finances: {
      startingLevel: 1,
      levelOneTibars: 0,
      spent: 0,
    },
    origin: {
      mode: 'single',
      standard: '',
      regional: '',
      benefits: [],
      officeSpecialties: {},
      previewBenefit: '',
    },
    skills: {
      class: [],
      int: [],
      race: [],
      duplicate: [],
    },
    powers: {
      general: [],
      originGeneral: {},
      raceGroups: {},
      categoryFilter: 'all',
      statusFilter: 'available',
      sidebarCollapsed: false,
      previewId: '',
      activeSlot: 0,
    },
    deity: {
      mode: '',
      name: '',
      power: '',
      previewPower: '',
      previewDeity: '',
      activePowerIndex: 0,
      strictAcceptedOnly: false,
      masterPermission: false,
    },
    distinctions: {
      activeIds: [],
      selectedId: '',
    },
    partners: [],
    partnerChoices: {},
    progression: [],
    prereqConfirm: {
      attributes: '',
      skills: '',
    },
    equipment: {
      armorId: null,
      shieldId: null,
      weaponId: null,
      trailerId: null,
      backpackId: null,
      wornIds: [],
      adaptableHandedness: {},
    },
  };
}

export function migratePersistedState(rawValue: any): CharacterState {
  let value = rawValue;
  if (value && typeof value === 'object') {
    value = restaurarEstadoInterface(value);
  }
  if (!value?.identity) return defaultState();

  const migrated: any = {
    ...value,
    identity: { ...value.identity },
    finances:
      value.finances && typeof value.finances === 'object' ? { ...value.finances } : null,
  };

  if (!migrated.layoutVersion) {
    migrated.step = migrated.step === 1 ? 1 : Math.min(9, (Number(migrated.step) || 1) + 1);
    migrated.completed = (migrated.completed || []).map((step: number) =>
      step === 1 ? 1 : Math.min(9, step + 1),
    );
    migrated.layoutVersion = 2;
  }

  const planned = validCharacterLevel(migrated.identity.plannedLevel);
  const initial = validCharacterLevel(
    migrated.identity.initialLevel ?? migrated.finances?.startingLevel ?? planned,
  );
  migrated.identity.initialLevel = initial;
  migrated.identity.plannedLevel = planned;
  migrated.identity.editingLevel = Math.min(
    migrated.identity.plannedLevel,
    validCharacterLevel(migrated.identity.editingLevel),
  );
  migrated.finances = Object.assign(
    { startingLevel: initial, levelOneTibars: 0, spent: 0 },
    migrated.finances || {},
    { startingLevel: initial },
  );
  migrated.stateSchemaVersion = STATE_SCHEMA_VERSION;
  return migrated as CharacterState;
}

export function normalizeState(rawState: any): CharacterState {
  const state: any = migratePersistedState(rawState);
  const d: any = defaultState();

  state.identity = Object.assign(d.identity, state.identity || {});
  state.identity.openRaceBonusEnabled = Boolean(state.identity.openRaceBonusEnabled);
  state.identity.openRaceAllocations =
    state.identity.openRaceAllocations && typeof state.identity.openRaceAllocations === 'object'
      ? state.identity.openRaceAllocations
      : {};
  state.identity.baseAttrs = Object.assign(d.identity.baseAttrs, state.identity.baseAttrs || {});
  state.attributes = Object.assign(d.attributes, state.attributes || state.identity.baseAttrs);
  state.identity.raceAttrs = Array.isArray(state.identity.raceAttrs)
    ? state.identity.raceAttrs
    : [];

  for (const key of [
    'raceSpecialAttrs',
    'raceSubAttrs',
    'raceChoices',
    'classChoices',
    'classRequiredChoices',
  ]) {
    state.identity[key] =
      state.identity[key] && typeof state.identity[key] === 'object' ? state.identity[key] : {};
  }

  state.origin = Object.assign(d.origin, state.origin || {});
  state.skills = Object.assign(d.skills, state.skills || {});
  state.skills.duplicate = Array.isArray(state.skills.duplicate) ? state.skills.duplicate : [];
  state.powers = Object.assign(d.powers, state.powers || {});
  state.powers.originGeneral =
    state.powers.originGeneral && typeof state.powers.originGeneral === 'object'
      ? state.powers.originGeneral
      : {};
  state.deity = Object.assign(d.deity, state.deity || {});
  if (state.deity?.power) {
    const pParts = String(state.deity.power).split('|').map(p => (p === 'Troças Duyshidakk' || p === 'trocas_duyshidakk') ? 'Tropas Duyshidakk' : p);
    state.deity.power = Array.from(new Set(pParts.filter(Boolean))).join('|');
  }
  state.distinctions =
    state.distinctions && typeof state.distinctions === 'object'
      ? state.distinctions
      : { activeIds: [], selectedId: '' };
  state.distinctions.activeIds = Array.isArray(state.distinctions.activeIds)
    ? state.distinctions.activeIds
    : [];
  state.partners = Array.isArray(state.partners) ? state.partners : [];
  state.partnerChoices =
    state.partnerChoices && typeof state.partnerChoices === 'object' ? state.partnerChoices : {};
  state.prereqConfirm = Object.assign(d.prereqConfirm, state.prereqConfirm || {});
  state.completed = Array.isArray(state.completed) ? state.completed : [];
  state.progression = Array.isArray(state.progression) ? state.progression : [];
  state.step = Math.max(1, Math.min(10, Number(state.step) || 1));

  if (
    state.finished ||
    (state.finished !== false &&
      Array.isArray(state.completed) &&
      state.completed.includes(10) &&
      Number(state.step) === 10)
  ) {
    state.finished = true;
    state.step = 10;
    state.sheetView = state.sheetView || 'sheet';
  }

  state.identity.initialLevel = validCharacterLevel(state.identity.initialLevel);
  state.identity.plannedLevel = validCharacterLevel(state.identity.plannedLevel);
  state.identity.editingLevel = Math.min(
    state.identity.plannedLevel,
    validCharacterLevel(state.identity.editingLevel),
  );
  state.finances = Object.assign(d.finances, state.finances || {}, {
    startingLevel: state.identity.initialLevel,
  });
  state.stateSchemaVersion = STATE_SCHEMA_VERSION;
  return state as CharacterState;
}

export const ModeloEstado = Object.freeze({
  defaultState,
  migratePersistedState,
  normalizeState,
  validCharacterLevel,
});
