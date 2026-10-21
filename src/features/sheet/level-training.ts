/**
 * Sistema de Treinamento entre Aventuras (Adiantamento de Nível - Tormenta 20).
 * Gerencia os 4 treinos de adiantamento do próximo nível:
 * 1. PV do próximo nível
 * 2. PM do próximo nível
 * 3. Perícias (+1 em todas as perícias se nível atual for ímpar indo para par; +0 se par indo para ímpar)
 * 4. Poder de Classe (permite escolher a classe do próximo nível — incluindo multiclasse — e o poder,
 *    recalculando automaticamente o PV/PM adiantado caso a classe escolhida mude).
 */

export interface LevelTrainingState {
  targetLevel?: number;
  pv?: boolean;
  pm?: boolean;
  skills?: boolean;
  power?: boolean;
  nextClassId?: string;
  nextPowerId?: string;
  selectedPowerId?: string;
  nextPowerChoice?: string;
  selectedPowerChoice?: string;
  lockedClassAndPower?: boolean;
}

export interface LevelTrainingBonuses {
  pvAdvance: number;
  pmAdvance: number;
  allSkillsBonus: number;
  completedCount: number;
  readyToLevelUp: boolean;
  effectiveClassId: string;
  trainedPowerId: string;
  trainedPowerChoice: string;
}

export function createDefaultLevelTrainingState(
  currentLevel = 1,
  defaultClassId = ''
): Required<LevelTrainingState> {
  return {
    targetLevel: Math.min(20, Math.max(1, Number(currentLevel) || 1) + 1),
    pv: false,
    pm: false,
    skills: false,
    power: false,
    nextClassId: defaultClassId || '',
    nextPowerId: '',
    selectedPowerId: '',
    nextPowerChoice: '',
    selectedPowerChoice: '',
    lockedClassAndPower: false,
  };
}

export function normalizeLevelTrainingState(
  raw: Partial<LevelTrainingState> | null | undefined,
  currentLevel: number,
  defaultClassId = ''
): Required<LevelTrainingState> {
  const expectedTarget = Math.min(20, Math.max(1, Number(currentLevel) || 1) + 1);
  if (!raw || typeof raw !== 'object' || (raw.targetLevel && raw.targetLevel !== expectedTarget)) {
    return createDefaultLevelTrainingState(currentLevel, defaultClassId);
  }
  const powerId = String(raw.selectedPowerId || raw.nextPowerId || '');
  const powerChoice = String(raw.selectedPowerChoice || raw.nextPowerChoice || '');
  return {
    targetLevel: expectedTarget,
    pv: Boolean(raw.pv),
    pm: Boolean(raw.pm),
    skills: Boolean(raw.skills),
    power: Boolean(raw.power),
    nextClassId: String(raw.nextClassId || defaultClassId || ''),
    nextPowerId: powerId,
    selectedPowerId: powerId,
    nextPowerChoice: powerChoice,
    selectedPowerChoice: powerChoice,
    lockedClassAndPower: Boolean(raw.lockedClassAndPower),
  };
}

export interface ClassProgressionVitalInfo {
  id: string;
  pvPerLevel?: number;
  pvPorNivel?: number;
  pmPerLevel?: number;
  pmPorNivel?: number;
  spellKeyAttrBonus?: number;
  alreadyHasClassInProgression?: boolean;
}

export interface CalculateLevelTrainingParams {
  currentLevel: number;
  defaultClassId: string;
  conModifier: number;
  training: Partial<LevelTrainingState> | null | undefined;
  getClassVitalInfo: (classId: string) => ClassProgressionVitalInfo;
}

/**
 * Calcula os bônus de adiantamento do próximo nível com base nos treinos concluídos
 * e na classe efetiva do próximo nível (recalculando caso haja multiclasse).
 * Suporta tanto chamada por objeto quanto chamada posicional:
 * (training, currentLevel, nextClassRecord, conMod, passivePvPerLevel, passivePmPerLevel).
 */
export function calculateLevelTrainingBonuses(
  first: CalculateLevelTrainingParams | Partial<LevelTrainingState> | null | undefined,
  currentLevelArg?: number,
  nextClassRecordArg?: ClassProgressionVitalInfo | null,
  conModArg = 0,
  passivePvPerLevelArg = 0,
  passivePmPerLevelArg = 0
): LevelTrainingBonuses {
  if (first && typeof first === 'object' && 'getClassVitalInfo' in first && typeof first.getClassVitalInfo === 'function') {
    const params = first as CalculateLevelTrainingParams;
    const lvl = Math.max(1, Number(params.currentLevel) || 1);
    if (lvl >= 20) {
      return {
        pvAdvance: 0,
        pmAdvance: 0,
        allSkillsBonus: 0,
        completedCount: 0,
        readyToLevelUp: false,
        effectiveClassId: params.defaultClassId,
        trainedPowerId: '',
        trainedPowerChoice: '',
      };
    }
    const norm = normalizeLevelTrainingState(params.training, lvl, params.defaultClassId);
    const effectiveClassId = norm.nextClassId || params.defaultClassId;
    const classInfo = params.getClassVitalInfo(effectiveClassId);
    const basePv = Number(classInfo.pvPerLevel ?? classInfo.pvPorNivel ?? 0);
    const basePm = Number(classInfo.pmPerLevel ?? classInfo.pmPorNivel ?? 0);
    const pvPerLvl = Math.max(1, basePv + Number(params.conModifier || 0));
    const pmPerLvl =
      Math.max(0, basePm) +
      (!classInfo.alreadyHasClassInProgression ? Math.max(0, Number(classInfo.spellKeyAttrBonus || 0)) : 0);

    const pvAdvance = norm.pv ? pvPerLvl : 0;
    const pmAdvance = norm.pm ? pmPerLvl : 0;
    const isOddLevelGoingToEven = lvl % 2 === 1;
    const allSkillsBonus = norm.skills && isOddLevelGoingToEven ? 1 : 0;
    const completedCount =
      (norm.pv ? 1 : 0) + (norm.pm ? 1 : 0) + (norm.skills ? 1 : 0) + (norm.power ? 1 : 0);

    return {
      pvAdvance,
      pmAdvance,
      allSkillsBonus,
      completedCount,
      readyToLevelUp: completedCount === 4,
      effectiveClassId,
      trainedPowerId: norm.power ? norm.selectedPowerId : '',
      trainedPowerChoice: norm.power ? norm.selectedPowerChoice : '',
    };
  }

  // Chamada posicional: (training, currentLevel, nextClassRecord, conMod, passivePvPerLevel, passivePmPerLevel)
  const training = (first || {}) as Partial<LevelTrainingState>;
  const lvl = Math.max(1, Number(currentLevelArg) || 1);
  const clsId = String(training.nextClassId || nextClassRecordArg?.id || '');
  if (lvl >= 20) {
    return {
      pvAdvance: 0,
      pmAdvance: 0,
      allSkillsBonus: 0,
      completedCount: 0,
      readyToLevelUp: false,
      effectiveClassId: clsId,
      trainedPowerId: '',
      trainedPowerChoice: '',
    };
  }
  const norm = normalizeLevelTrainingState(training, lvl, clsId);
  const basePv = Number(nextClassRecordArg?.pvPorNivel ?? nextClassRecordArg?.pvPerLevel ?? 0);
  const basePm = Number(nextClassRecordArg?.pmPorNivel ?? nextClassRecordArg?.pmPerLevel ?? 0);
  const pvGain = nextClassRecordArg
    ? Math.max(1, basePv + Number(conModArg || 0) + Number(passivePvPerLevelArg || 0))
    : 0;
  const pmGain = nextClassRecordArg
    ? Math.max(0, basePm + Number(passivePmPerLevelArg || 0))
    : 0;

  const pvAdvance = norm.pv ? pvGain : 0;
  const pmAdvance = norm.pm ? pmGain : 0;
  const isOddLevelGoingToEven = lvl % 2 === 1;
  const allSkillsBonus = norm.skills && isOddLevelGoingToEven ? 1 : 0;
  const completedCount =
    (norm.pv ? 1 : 0) + (norm.pm ? 1 : 0) + (norm.skills ? 1 : 0) + (norm.power ? 1 : 0);

  return {
    pvAdvance,
    pmAdvance,
    allSkillsBonus,
    completedCount,
    readyToLevelUp: completedCount === 4,
    effectiveClassId: norm.nextClassId || clsId,
    trainedPowerId: norm.power ? norm.selectedPowerId : '',
    trainedPowerChoice: norm.power ? norm.selectedPowerChoice : '',
  };
}
