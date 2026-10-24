/**
 * Módulo de Sub-Estágios e Validação da Fase 6 (Poderes) em TypeScript.
 * Garante cobertura unificada para Poderes de Raça, Poderes Gerais, Origem Geral,
 * Duplo Feérico, Cosmopolita e Futura Lenda.
 */

import type { Phase6SubStage } from '../../../interfaces/powers.ts';
import type { CharacterState } from '../../../interfaces/character-sheet.ts';

export interface Phase6StageContext {
  state: CharacterState;
  racePowerGroups?: () => Array<{ id: string; quantity?: number }>;
  generalPowerSlots?: () => number;
  originGeneralPowerOptions?: () => Array<{ id: string; name?: string }>;
  originChoiceSlotsCount?: () => number;
  hasDuploFeerico?: () => boolean;
  hasCosmopolita?: () => boolean;
  hasFuturaLenda?: () => boolean;
  generalPowerDraftAllowed?: () => boolean;
  cosmopolitaEligiblePowers?: () => Array<{
    cosmopolitaKey: string;
    verdict?: { ok?: boolean };
  }>;
  selectedFuturaLendaPower?: () => unknown;
  selectedDuploFeericoPower?: () => unknown;
  isCurrentPhaseComplete?: () => boolean;
  phaseIsComplete?: (step: number) => boolean;
}

export function computePhase6SubStages(
  ctx: Phase6StageContext
): Phase6SubStage[] {
  const stages: Phase6SubStage[] = [];
  const hasRaceGroups =
    typeof ctx.racePowerGroups === 'function' &&
    ctx.racePowerGroups().some((g) => Number(g.quantity || 0) > 0);
  if (hasRaceGroups) {
    stages.push({ type: 'race', label: 'Poderes de Raça' });
  }

  const genSlots =
    typeof ctx.generalPowerSlots === 'function' ? ctx.generalPowerSlots() : 0;
  for (let i = 0; i < genSlots; i++) {
    stages.push({ type: 'general', slot: i, label: `Poder Geral ${i + 1}` });
  }

  const originInGeneralCount =
    typeof ctx.originChoiceSlotsCount === 'function'
      ? ctx.originChoiceSlotsCount()
      : 0;
  if (originInGeneralCount === 0) {
    const originChoices =
      typeof ctx.originGeneralPowerOptions === 'function'
        ? ctx.originGeneralPowerOptions()
        : [];
    originChoices.forEach((opt) => {
      stages.push({
        type: 'origin_general',
        optionId: opt.id,
        label: `Poder da Origem (${opt.name || 'Geral'})`,
      });
    });
  }

  if (typeof ctx.hasDuploFeerico === 'function' && ctx.hasDuploFeerico()) {
    stages.push({ type: 'duplo_feerico', label: 'Duplo Feérico' });
  }
  if (typeof ctx.hasCosmopolita === 'function' && ctx.hasCosmopolita()) {
    stages.push({
      type: 'cosmopolita',
      label: 'Origem Regional (Cosmopolita)',
    });
  }
  if (typeof ctx.hasFuturaLenda === 'function' && ctx.hasFuturaLenda()) {
    stages.push({
      type: 'futura_lenda',
      label: 'Origem Regional (Futura Lenda)',
    });
  }

  return stages;
}

export function checkPhase6StageComplete(
  currentStage: Phase6SubStage | undefined,
  curIdx: number,
  ctx: Phase6StageContext
): boolean {
  const { state } = ctx;
  if (!currentStage) {
    return typeof ctx.isCurrentPhaseComplete === 'function'
      ? ctx.isCurrentPhaseComplete()
      : typeof ctx.phaseIsComplete === 'function'
        ? ctx.phaseIsComplete(6)
        : true;
  }

  if (currentStage.type === 'race') {
    return (
      typeof ctx.racePowerGroups === 'function' &&
      ctx
        .racePowerGroups()
        .every(
          (g) =>
            (state.powers?.raceGroups?.[g.id] || []).length ===
            Number(g.quantity || 0)
        )
    );
  }

  if (currentStage.type === 'general') {
    const curSlot = currentStage.slot ?? curIdx;
    const hasCurrent = Boolean(state.powers?.general?.[curSlot]);
    const isDraft = Boolean(state.powers?.previewId);
    return (
      (isDraft &&
        typeof ctx.generalPowerDraftAllowed === 'function' &&
        ctx.generalPowerDraftAllowed()) ||
      hasCurrent
    );
  }

  if (currentStage.type === 'cosmopolita') {
    const hasCurrent = Boolean(state.powers?.cosmopolitaPower);
    const draftKey = state.powers?.cosmopolitaPreview;
    const draftOk = draftKey
      ? typeof ctx.cosmopolitaEligiblePowers === 'function' &&
        Boolean(
          ctx
            .cosmopolitaEligiblePowers()
            .find((o) => o.cosmopolitaKey === draftKey)?.verdict?.ok
        )
      : false;
    return draftOk || hasCurrent;
  }

  if (currentStage.type === 'futura_lenda') {
    return (
      typeof ctx.selectedFuturaLendaPower === 'function' &&
      Boolean(ctx.selectedFuturaLendaPower())
    );
  }

  if (currentStage.type === 'duplo_feerico') {
    return (
      typeof ctx.selectedDuploFeericoPower === 'function' &&
      Boolean(ctx.selectedDuploFeericoPower())
    );
  }

  if (currentStage.type === 'origin_general') {
    return Boolean(
      currentStage.optionId &&
        state.powers?.originGeneral?.[currentStage.optionId]
    );
  }

  return true;
}
