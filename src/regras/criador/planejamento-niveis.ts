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
 * Calcula o dinheiro hipotético ganho somando cumulativamente o adicional de cada nível planejado.
 * Regra canônica solicitada:
 * A cada nível planejado ganha o valor em dinheiro do nível como adicional cumulativo somado ao que já tinha.
 * Ex: Do nível 1 para o 2 = +300; para o 3 = +300 + 600 = +900; para o 4 = +300 + 600 + 1000 = +1900.
 */
function calcularDinheiroHipoteticoAdicional(nivelAtual: number, nivelAlvo: number): number {
  const atual = Math.max(1, Number(nivelAtual) || 1);
  const alvo = Math.min(20, Math.max(atual, Number(nivelAlvo) || atual));
  let totalAdicional = 0;
  for (let lvl = atual + 1; lvl <= alvo; lvl++) {
    totalAdicional += (STARTING_FUNDS_TABLE[lvl] || 0);
  }
  return totalAdicional;
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

  if (!characterState.isPlanningMode) {
    const snapshot = JSON.parse(JSON.stringify(characterState));
    characterState.planningSnapshot = snapshot;
    try {
      sessionStorage.setItem('forja_planning_snapshot', JSON.stringify(snapshot));
    } catch {}
  }

  characterState.isPlanningMode = true;
  if (!characterState.planningBaseLevel) {
    characterState.planningBaseLevel = nivelAtual;
  }
  characterState.planningTargetLevel = target;
  characterState.planningName = (nomePlanejamento || '').trim() || (characterState.planningName || `Plano até Nível ${target}`);
  if (planningId) {
    characterState.currentPlanningId = planningId;
  }

  const baseLvl = Number(characterState.planningBaseLevel) || nivelAtual;
  const bonus = calcularDinheiroHipoteticoAdicional(baseLvl, target);
  characterState.finances = characterState.finances || {};
  characterState.finances.hypotheticalPlanningFunds = bonus;
  characterState.finances.rewardFunds = (Number(characterState.finances.rewardFunds) || 0) + bonus;

  characterState.identity = characterState.identity || {};
  characterState.identity.plannedLevel = target;

  return true;
}

/**
 * Encerra o Modo de Planejamento e restaura a ficha original exatamente no nível real que tinha.
 */
function encerrarModoPlanejamento(characterState: any): any {
  if (!characterState || !characterState.isPlanningMode) return characterState;

  let original = characterState.planningSnapshot;
  if (!original) {
    try {
      const raw = sessionStorage.getItem('forja_planning_snapshot');
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
    if (characterState.finances) {
      delete characterState.finances.hypotheticalPlanningFunds;
    }
  } else {
    delete characterState.isPlanningMode;
    delete characterState.planningSnapshot;
    delete characterState.currentPlanningId;
  }

  try {
    sessionStorage.removeItem('forja_planning_snapshot');
  } catch {}

  return characterState;
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
  aplicarPlanejamentoProximoNivel
};

if (typeof window !== 'undefined') {
  (window as any).ForjaPlanejamento = ForjaPlanejamentoExports;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ForjaPlanejamentoExports;
}
