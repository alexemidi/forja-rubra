/**
 * FORJA RUBRA: Sistema de Planejamento de Progressão por Níveis e Dinheiro Hipotético
 * Permite aos jogadores projetarem o futuro de seus heróis nível a nível,
 * calculando o dinheiro hipotético acumulado de recompensas e aplicando escolhas ao subir de nível real.
 */

const STARTING_FUNDS_TABLE: Record<number, number> = {
  2: 300,
  3: 600,
  4: 1000,
  5: 2000,
  6: 3000,
  7: 5000,
  8: 7000,
  9: 10000,
  10: 13000,
  11: 19000,
  12: 27000,
  13: 36000,
  14: 49000,
  15: 66000,
  16: 88000,
  17: 110000,
  18: 150000,
  19: 200000,
  20: 260000
};

interface ProgressionRowChoice {
  classId: string;
  powerId?: string;
  powerChoice?: string;
  previewPowerId?: string;
  previewPowerChoice?: string;
}

interface CharacterPlanning {
  id: string;
  name: string;
  baseLevel: number;
  targetLevel: number;
  progression: ProgressionRowChoice[];
  spellsSelections?: Record<string, string[]>;
  hypotheticalFunds: number;
  createdAt: string;
}

/**
 * Calcula o dinheiro hipotético ganho pelo nível planejado.
 * Regra solicitada:
 * Planejar um personagem para determinado nível concede a ele exatamente os tibares
 * correspondentes àquele nível da tabela, sem somar com os valores dos níveis anteriores.
 * Ex: Nível 2 = 300 T$, Nível 3 = 600 T$, Nível 4 = 1000 T$, Nível 5 = 2000 T$, Nível 10 = 13000 T$.
 */
function calcularDinheiroHipoteticoAdicional(nivelAtual: number, nivelAlvo: number): number {
  const atual = Math.max(1, Number(nivelAtual) || 1);
  const alvo = Math.min(20, Math.max(atual, Number(nivelAlvo) || atual));
  if (alvo <= atual) return 0;
  return STARTING_FUNDS_TABLE[alvo] || 0;
}

/**
 * Retorna o limite de planejamentos permitidos com base no plano/tier do usuário:
 * - Free: 1 planejamento por ficha
 * - Membro Nível 1 (Aventureiro): 3 planejamentos por ficha
 * - Membro Nível 2 (Campeão de Arton / Lenda): 5 planejamentos por ficha
 */
function obterLimiteMaximoPlanejamentos(): number {
  if (typeof window === 'undefined') return 1;
  try {
    const auth = (window as any).ModuloAuth ? (window as any).ModuloAuth.obterServicoAutenticacao() : null;
    const user = auth ? auth.obterUsuarioAtual() : null;
    const tier = user?.user_metadata?.supporter_tier || localStorage.getItem('forja_supporter_tier');

    if (tier === 'lenda' || tier === 'campeao') return 5;
    if (tier === 'aventureiro') return 3;
  } catch {}
  return 1;
}

function obterPlanejamentos(characterState: any): CharacterPlanning[] {
  if (!characterState) return [];
  if (!Array.isArray(characterState.plannings)) {
    characterState.plannings = [];
  }
  return characterState.plannings;
}

function podeCriarPlanejamento(characterState: any): { allowed: boolean; max: number; current: number } {
  const current = obterPlanejamentos(characterState).length;
  const max = obterLimiteMaximoPlanejamentos();
  return {
    allowed: current < max,
    max,
    current
  };
}

function salvarPlanejamento(characterState: any, nome: string, planningId?: string): CharacterPlanning | null {
  if (!characterState) return null;
  const plannings = obterPlanejamentos(characterState);
  const max = obterLimiteMaximoPlanejamentos();
  
  const baseLevel = Number(characterState.planningBaseLevel || characterState.identity?.initialLevel || 1);
  const targetLevel = Number(characterState.identity?.plannedLevel || (characterState.progression || []).length || 1);
  const hypotheticalFunds = Number(characterState.finances?.hypotheticalPlanningFunds || calcularDinheiroHipoteticoAdicional(baseLevel, targetLevel));

  const progressionCopy: ProgressionRowChoice[] = JSON.parse(JSON.stringify(characterState.progression || []));
  let spellsCopy: Record<string, string[]> | undefined;
  try {
    if (typeof (window as any).spellState === 'function') {
      spellsCopy = JSON.parse(JSON.stringify((window as any).spellState()?.selections || {}));
    }
  } catch {}

  const targetId = planningId || characterState.currentPlanningId || (max === 1 && plannings.length > 0 ? plannings[0].id : null);
  const existingIndex = targetId ? plannings.findIndex((p: CharacterPlanning) => p.id === targetId) : -1;

  const planning: CharacterPlanning = {
    id: existingIndex >= 0 ? plannings[existingIndex].id : ('plan_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)),
    name: (nome || '').trim() || (existingIndex >= 0 ? plannings[existingIndex].name : `Plano até Nível ${targetLevel}`),
    baseLevel,
    targetLevel,
    progression: progressionCopy,
    spellsSelections: spellsCopy,
    hypotheticalFunds,
    createdAt: existingIndex >= 0 ? plannings[existingIndex].createdAt : new Date().toISOString()
  };

  if (existingIndex >= 0) {
    plannings[existingIndex] = planning;
  } else if (plannings.length >= max) {
    plannings[plannings.length - 1] = planning;
  } else {
    plannings.push(planning);
  }

  characterState.currentPlanningId = planning.id;

  if (characterState.planningSnapshot) {
    characterState.planningSnapshot.plannings = JSON.parse(JSON.stringify(plannings));
    try {
      sessionStorage.setItem('forja_planning_snapshot', JSON.stringify(characterState.planningSnapshot));
    } catch {}
  }

  return planning;
}

function excluirPlanejamento(characterState: any, planningId: string): boolean {
  if (!characterState || !Array.isArray(characterState.plannings)) return false;
  const index = characterState.plannings.findIndex((p: CharacterPlanning) => p.id === planningId);
  if (index >= 0) {
    characterState.plannings.splice(index, 1);
    if (characterState.planningSnapshot) {
      characterState.planningSnapshot.plannings = JSON.parse(JSON.stringify(characterState.plannings));
      try {
        sessionStorage.setItem('forja_planning_snapshot', JSON.stringify(characterState.planningSnapshot));
      } catch {}
    }
    return true;
  }
  return false;
}

/**
 * Inicia o Modo de Planejamento (Simulação de Progressão).
 * Guarda o snapshot original do herói e projeta o estado futuro com o dinheiro hipotético.
 */
function iniciarModoPlanejamento(characterState: any, nivelAlvo: number, nomePlanejamento: string = '', planningId?: string): boolean {
  if (!characterState) return false;
  const nivelAtual = Math.max(1, Number(characterState.identity?.plannedLevel) || 1);
  const target = Math.min(20, Math.max(nivelAtual + 1, Number(nivelAlvo) || (nivelAtual + 1)));

  let existingBackupRaw: string | null = null;
  try {
    existingBackupRaw = (typeof localStorage !== 'undefined' ? localStorage.getItem('forja_planning_real_hero_backup') : null)
      || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('forja_planning_snapshot') : null);
  } catch {}

  if (!characterState.isPlanningMode && !existingBackupRaw) {
    const snapshot = JSON.parse(JSON.stringify(characterState));
    characterState.planningSnapshot = snapshot;
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem('forja_planning_real_hero_backup', JSON.stringify(snapshot));
      if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('forja_planning_snapshot', JSON.stringify(snapshot));
    } catch {}
  } else if (existingBackupRaw && !characterState.planningSnapshot) {
    try {
      characterState.planningSnapshot = JSON.parse(existingBackupRaw);
    } catch {}
  }

  const realBaseLevel = Number(characterState.planningSnapshot?.identity?.plannedLevel || characterState.planningBaseLevel || nivelAtual);
  characterState.isPlanningMode = true;
  characterState.planningBaseLevel = realBaseLevel;
  characterState.planningTargetLevel = target;
  characterState.planningName = (nomePlanejamento || '').trim() || (characterState.planningName || `Plano até Nível ${target}`);
  if (planningId) {
    characterState.currentPlanningId = planningId;
  }

  const bonus = calcularDinheiroHipoteticoAdicional(realBaseLevel, target);
  characterState.finances = characterState.finances || {};
  characterState.finances.hypotheticalPlanningFunds = bonus;
  const originalRewardFunds = Number(characterState.planningSnapshot?.finances?.rewardFunds || 0);
  characterState.finances.rewardFunds = originalRewardFunds + bonus;

  characterState.identity = characterState.identity || {};
  characterState.identity.plannedLevel = target;

  return true;
}

/**
 * Encerra o Modo de Planejamento e restaura a ficha original exatamente no nível real que tinha.
 */
function encerrarModoPlanejamento(characterState: any): any {
  if (!characterState) return characterState;

  let original = characterState.planningSnapshot;
  if (!original) {
    try {
      const rawLocal = typeof localStorage !== 'undefined' ? localStorage.getItem('forja_planning_real_hero_backup') : null;
      const rawSession = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('forja_planning_snapshot') : null;
      const raw = rawLocal || rawSession;
      if (raw) original = JSON.parse(raw);
    } catch {}
  }

  if (original) {
    const currentPlannings = Array.isArray(characterState.plannings) ? characterState.plannings : (original.plannings || []);
    
    Object.keys(characterState).forEach(key => delete characterState[key]);
    Object.assign(characterState, original);
    
    characterState.plannings = currentPlannings;
    delete characterState.isPlanningMode;
    delete characterState.planningSnapshot;
    delete characterState.planningBaseLevel;
    delete characterState.planningTargetLevel;
    delete characterState.planningName;
    delete characterState.currentPlanningId;
    delete characterState.levelUpBefore;
    delete characterState.editingCharacter;
    if (characterState.finances) {
      delete characterState.finances.hypotheticalPlanningFunds;
    }
    characterState.finished = true;
    characterState.isLevelingUp = false;
    characterState.isEditingFinishedSheet = false;
    characterState.step = 10;
    characterState.sheetView = 'sheet';

    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('forja-heroi-t20-v1', JSON.stringify(characterState));
        localStorage.removeItem('forja_planning_real_hero_backup');
      }
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('forja_planning_snapshot');
      }
    } catch {}
  } else {
    delete characterState.isPlanningMode;
    delete characterState.planningSnapshot;
    delete characterState.currentPlanningId;
    delete characterState.planningBaseLevel;
    delete characterState.planningTargetLevel;
    delete characterState.planningName;
  }

  return characterState;
}

/**
 * Avalia se um planejamento salvo é compatível com a evolução real do personagem até o nível especificado.
 * Detecta duplicidade de poderes já escolhidos ou inconsistência de pré-requisitos.
 */
function avaliarCompatibilidadePlanejamento(characterState: any, planning: CharacterPlanning, targetLevel: number): { compativel: boolean; divergencia?: string; choice?: ProgressionRowChoice } {
  if (!characterState || !planning || !Array.isArray(planning.progression)) {
    return { compativel: false, divergencia: 'Planejamento inválido ou incompleto.' };
  }
  const choice = planning.progression[targetLevel - 1];
  if (!choice || !choice.classId) {
    return { compativel: false, divergencia: 'Planejamento não possui escolhas para o Nível ' + targetLevel + '.' };
  }

  if (choice.powerId) {
    // 1. Checa se o poder já foi adquirido pelo herói em níveis anteriores
    const acquiredPowers = new Set<string>();
    (characterState.progression || []).slice(0, targetLevel - 1).forEach((row: any) => {
      if (row.powerId) acquiredPowers.add(row.powerId);
    });
    (characterState.powers?.general || []).forEach((p: any) => {
      const id = typeof p === 'string' ? p : p?.id || p?.nome;
      if (id) acquiredPowers.add(id);
    });

    if (acquiredPowers.has(choice.powerId)) {
      let pwrName = choice.powerId;
      try {
        if (typeof (window as any).progressionPowerById === 'function') {
          pwrName = (window as any).progressionPowerById(choice.powerId)?.nome || choice.powerId;
        }
      } catch {}
      return {
        compativel: false,
        divergencia: 'O poder "' + pwrName + '" já foi adquirido anteriormente.',
        choice
      };
    }

    // 2. Checa pré-requisitos do poder no contexto do herói atual
    try {
      if (typeof (window as any).progressionPowerById === 'function') {
        const pwrObj = (window as any).progressionPowerById(choice.powerId);
        if (pwrObj && typeof (window as any).progressionPowerVerdict === 'function') {
          const verdict = (window as any).progressionPowerVerdict(pwrObj, targetLevel - 1);
          if (verdict && verdict.ok === false && Array.isArray(verdict.reasons) && verdict.reasons.length > 0) {
            return {
              compativel: false,
              divergencia: 'Pré-requisitos não cumpridos: ' + verdict.reasons.join(', ') + '.',
              choice
            };
          }
        }
      }
    } catch {}
  }

  return { compativel: true, choice };
}

/**
 * Verifica se há algum planejamento salvo que possua escolha configurada para o próximo nível real do personagem.
 */
function obterPlanejamentoParaProximoNivel(characterState: any): { planning: CharacterPlanning; nextChoice: ProgressionRowChoice; nextLevel: number } | null {
  if (!characterState) return null;
  const currentLvl = Math.max(1, Number(characterState.identity?.plannedLevel) || 1);
  const nextLvl = currentLvl + 1;
  if (nextLvl > 20) return null;

  const plannings = obterPlanejamentos(characterState);
  for (const plan of plannings) {
    if (plan.targetLevel >= nextLvl && Array.isArray(plan.progression)) {
      const choice = plan.progression[nextLvl - 1];
      if (choice && choice.classId) {
        return {
          planning: plan,
          nextChoice: choice,
          nextLevel: nextLvl
        };
      }
    }
  }
  return null;
}

/**
 * Aplica as escolhas do planejamento para a subida de nível real.
 */
function aplicarPlanejamentoProximoNivel(characterState: any, planningId?: string): boolean {
  if (!characterState) return false;
  const currentLvl = Math.max(1, Number(characterState.identity?.plannedLevel) || 1);
  const nextLvl = currentLvl + 1;
  if (nextLvl > 20) return false;

  const plannings = obterPlanejamentos(characterState);
  const plan = planningId ? plannings.find((p: any) => p.id === planningId) : (obterPlanejamentoParaProximoNivel(characterState)?.planning || plannings[0]);
  if (!plan || !Array.isArray(plan.progression)) return false;

  const choice = plan.progression[nextLvl - 1];
  if (!choice || !choice.classId) return false;

  characterState.identity = characterState.identity || {};
  characterState.identity.plannedLevel = nextLvl;
  characterState.progression = Array.isArray(characterState.progression) ? characterState.progression : [];

  if (characterState.progression.length >= nextLvl) {
    characterState.progression[nextLvl - 1] = {
      classId: choice.classId,
      powerId: choice.powerId || '',
      powerChoice: choice.powerChoice || ''
    };
  } else {
    characterState.progression.push({
      classId: choice.classId,
      powerId: choice.powerId || '',
      powerChoice: choice.powerChoice || ''
    });
  }

  if (plan.spellsSelections && typeof (window as any).spellState === 'function') {
    try {
      const spState = (window as any).spellState();
      spState.selections = Object.assign({}, spState.selections, plan.spellsSelections);
    } catch {}
  }

  return true;
}

const ForjaPlanejamentoExports = {
  STARTING_FUNDS_TABLE,
  calcularDinheiroHipoteticoAdicional,
  obterLimiteMaximoPlanejamentos,
  obterPlanejamentos,
  podeCriarPlanejamento,
  salvarPlanejamento,
  excluirPlanejamento,
  iniciarModoPlanejamento,
  encerrarModoPlanejamento,
  obterPlanejamentoParaProximoNivel,
  aplicarPlanejamentoProximoNivel,
  avaliarCompatibilidadePlanejamento
};

if (typeof window !== 'undefined') {
  (window as any).ForjaPlanejamento = ForjaPlanejamentoExports;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ForjaPlanejamentoExports;
}
