/**
 * Efeitos fixos das Marcas de Distinção (Tormenta 20).
 * Condições de uso são entradas explícitas, nunca inferidas por texto livre.
 */

export interface DistinctionMarkContextInput {
  car?: number;
  sab?: number;
  curaAttr?: string;
  alquimiaAttr?: string;
  heavyArmor?: boolean;
  powerCounts?: Record<string, number>;
}

export interface DistinctionDamageReduction {
  tipo: string;
  danoTipo?: string;
  valor: number;
}

export interface DistinctionEffectsResult {
  skills: Record<string, number>;
  attributes: Record<string, string>;
  defense: number;
  pm: number;
  movement: number;
  reductions: DistinctionDamageReduction[];
}

export function efeitosMarcas(
  ids: readonly string[],
  context: DistinctionMarkContextInput = {}
): DistinctionEffectsResult {
  const active = new Set(ids);
  const skills: Record<string, number> = {};
  const attributes: Record<string, string> = {};
  const reductions: DistinctionDamageReduction[] = [];
  let defense = 0;
  let pm = 0;
  const movement = 0;

  const add = (id: string, value: number): void => {
    skills[id] = (skills[id] || 0) + value;
  };

  const bonuses: Record<string, Record<string, number>> = {
    cacador_de_cabecas: { furtividade: 2 },
    capitao_do_conclave_pirata: { acrobacia: 2, pilotagem: 2 },
    mutagenista: { fortitude: 2, 'oficio:alquimista': 2 },
    senador: { nobreza: 2 },
    detetive_de_tanna_toh: { intuicao: 5, investigacao: 5 },
    cavaleiro_de_khalmyr: { fortitude: 2, vontade: 2 },
    guardiao_da_realidade: { fortitude: 5, reflexos: 5, vontade: 5 },
    forjador_liturgico: { 'oficio:armeiro': 2 },
    chapeu_preto: { intimidacao: 2, adestramento: -2, atuacao: -2, diplomacia: -2 },
  };

  for (const [id, values] of Object.entries(bonuses)) {
    if (active.has(id)) {
      for (const [skill, value] of Object.entries(values)) {
        add(skill, value);
      }
    }
  }

  if (active.has('senador')) attributes.nobreza = 'car';
  if (active.has('medico_de_salistick')) {
    attributes.cura = 'int';
    if (context.curaAttr === 'int') add('cura', 2);
  }
  if (active.has('drogadora')) {
    attributes['oficio:alquimista'] = 'sab';
    if (context.alquimiaAttr === 'sab') add('oficio:alquimista', 2);
  }
  if (active.has('dancarina_de_marah')) {
    add('atuacao', Number(context.sab) || 0);
  }
  if (active.has('cavaleiro_da_luz')) {
    for (const skill of ['guerra', 'nobreza']) {
      add(skill, Number(context.car) || 0);
    }
  }
  if (active.has('amazona') && !context.heavyArmor) defense += 2;
  if (active.has('cavaleiro_feerico')) {
    pm += context.powerCounts?.cavaleiro_feerico || 0;
  }
  if (skills['oficio:alquimista'] !== undefined) {
    skills['oficio:alquimia'] = skills['oficio:alquimista'];
  }
  if (attributes['oficio:alquimista']) {
    attributes['oficio:alquimia'] = attributes['oficio:alquimista'];
  }

  return { skills, attributes, defense, pm, movement, reductions };
}
