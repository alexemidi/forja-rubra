const CANONICAL_PARTNERS = [
  {
    id: 'ajudante',
    nome: 'Ajudante',
    role: 'Especialista em Perícias',
    desc: 'Um bardo, nobre ou sábio que ajuda com conselhos rápidos e perícia técnica.',
    iniciante: 'Você recebe +2 em duas perícias definidas pelo parceiro (exceto Luta ou Pontaria).',
    veterano: 'Você recebe +2 em três perícias definidas pelo parceiro (exceto Luta ou Pontaria).',
    mestre: 'Você recebe +4 em três perícias definidas pelo parceiro (exceto Luta ou Pontaria).'
  },
  {
    id: 'assassino',
    nome: 'Assassino',
    role: 'Furtividade & Ataque Letal',
    desc: 'Um ladino ou caçador furtivo especialista em pontos fracos e emboscadas.',
    iniciante: 'Você recebe a habilidade Ataque Furtivo (+1d6). Cumulativo se já a possuir.',
    veterano: 'Ataque Furtivo (+1d6) e concede bônus por flanquear (+2 no ataque corpo a corpo) contra um inimigo por rodada.',
    mestre: 'Ataque Furtivo (+2d6) e concede bônus por flanquear (+2 no ataque corpo a corpo) contra um inimigo por rodada.'
  },
  {
    id: 'atirador',
    nome: 'Atirador',
    role: 'Apoio de Longo Alcance',
    desc: 'Um arqueiro ou besteiro que dispara contra alvos prioritários.',
    iniciante: 'Uma vez por rodada, você recebe +1d6 em uma rolagem de dano à distância.',
    veterano: 'Você recebe +2 em testes de ataque à distância e +1d6 no dano à distância.',
    mestre: 'Você recebe +2 em testes de ataque à distância e +2d6 no dano à distância.'
  },
  {
    id: 'combatente',
    nome: 'Combatente',
    role: 'Linha de Frente',
    desc: 'Um guerreiro experiente dedicado a engajar e quebrar a linha inimiga.',
    iniciante: 'Uma vez por rodada, você recebe +1d8 em uma rolagem de dano corpo a corpo.',
    veterano: 'Você recebe +2 em testes de ataque corpo a corpo e +1d8 no dano corpo a corpo.',
    mestre: 'Você recebe +2 em testes de ataque corpo a corpo e +2d8 no dano corpo a corpo.'
  },
  {
    id: 'curandeiro',
    nome: 'Curandeiro / Médico',
    role: 'Cuidados Médicos & Socorro',
    desc: 'Um boticário ou eremita que cuida dos ferimentos do grupo após combates.',
    iniciante: 'Uma vez por rodada, como ação livre, pode gastar 1 PM para curar 1d8+1 PV de um aliado adjacente.',
    veterano: 'Cura 2d8+2 PV (gasto de 2 PM) e estabiliza automaticamente aliados caídos.',
    mestre: 'Cura 3d8+3 PV (gasto de 3 PM) e pode remover condições de sangramento ou envenenamento.'
  },
  {
    id: 'destruidor',
    nome: 'Destruidor',
    role: 'Dano Massivo & Rompimento',
    desc: 'Um guerreiro com armas pesadas especialista em devastar alvos e estruturas.',
    iniciante: 'Aumenta em um passo o dado de dano de suas armas corpo a corpo.',
    veterano: 'Aumenta em um passo o dano de suas armas e você causa +1d8 contra estruturas ou objetos.',
    mestre: 'Aumenta em dois passos o dado de dano de suas armas corpo a corpo.'
  },
  {
    id: 'fortao',
    nome: 'Fortão',
    role: 'Bloqueio & Força Bruta',
    desc: 'Um aliado corpulento que segura adversários e carrega os suprimentos da jornada.',
    iniciante: 'Você recebe +2 em testes de manobras de combate e +5 espaços de carga suportada.',
    veterano: 'Você recebe +4 em manobras de combate e +10 espaços de carga suportada.',
    mestre: 'Você recebe +6 em manobras de combate e +15 espaços de carga suportada.'
  },
  {
    id: 'guardiao',
    nome: 'Guardião',
    role: 'Defesa & Proteção',
    desc: 'Um escudeiro ou guarda veterano que intercepta golpes direcionados a você.',
    iniciante: 'Você recebe +2 na sua Defesa.',
    veterano: 'Você recebe +3 na Defesa e pode interceptar um ataque por rodada concedendo cobertura leve.',
    mestre: 'Você recebe +4 na Defesa e cobertura contra ataques de longa distância.'
  },
  {
    id: 'magivocador',
    nome: 'Magivocador',
    role: 'Poder Arcano & Feitiços',
    desc: 'Um canalizador que amplifica a potência dos seus feitiços e rituais.',
    iniciante: 'O dano de suas magias aumenta em +1 dado do mesmo tipo.',
    veterano: 'O dano de suas magias aumenta em +1 dado do mesmo tipo e sua CD de resistência aumenta em +1.',
    mestre: 'O dano de suas magias aumenta em +2 dados do mesmo tipo e sua CD de resistência aumenta em +2.'
  },
  {
    id: 'montaria',
    nome: 'Montaria',
    role: 'Mobilidade Tática',
    desc: 'Um cavalo de guerra, pônei treinado ou besta fantástica de investida.',
    iniciante: 'Seu deslocamento aumenta em +3m e você recebe +2 em testes de Cavalgar.',
    veterano: 'Deslocamento aumenta em +6m e +2 nas rolagens de dano em investidas.',
    mestre: 'Deslocamento aumenta em +9m, ignora terreno difícil e +4 de dano em investidas.'
  },
  {
    id: 'perseguidor',
    nome: 'Perseguidor',
    role: 'Rastreamento & Batedor',
    desc: 'Um caçador experiente que lê rastros e descobre caminhos seguros pelos ermos.',
    iniciante: 'Você recebe +2 em Percepção e Sobrevivência, e ignora camuflagem leve de vegetação.',
    veterano: 'Você recebe +3 em Percepção e Sobrevivência, e encontra abrigo e caça em metade do tempo.',
    mestre: 'Você recebe +4 em Percepção e Sobrevivência, e seus aliados não sofrem penalidades por terreno nos ermos.'
  },
  {
    id: 'vigilante',
    nome: 'Vigilante',
    role: 'Alerta & Sentinela',
    desc: 'Uma sentinela atenta de prontidão contínua contra emboscadas e ataques surpresa.',
    iniciante: 'Você recebe +2 em Iniciativa e Percepção, e não fica desprevenido no início de combates.',
    veterano: 'Você recebe +4 em Iniciativa e Percepção, e pode usar a habilidade Esquiva Sobrenatural.',
    mestre: 'Você recebe +6 em Iniciativa e Percepção, e nunca pode ser pego desprevenido ou emboscado.'
  }
];

const CANONICAL_MERCENARIES = [
  {
    id: 'alquimista_de_batalha',
    name: 'Alquimista de Batalha',
    tier: 'veterano',
    partnerType: 'Destruidor',
    role: 'Destruidor veterano',
    desc: 'Um artesão especializado em preparados alquímicos e no seu uso em combate.',
    benefit: 'Uma vez por rodada, como ação livre, gaste 1 PM para causar 2d6 pontos de dano elemental em alcance curto (2 PM para 4d6).',
    requiresWar: false,
    customChoice: { key: 'elemento', label: 'Elemento:', options: ['Fogo', 'Ácido', 'Eletricidade', 'Frio'] }
  },
  {
    id: 'aprendiz_de_guilda',
    name: 'Aprendiz de Guilda',
    tier: 'iniciante',
    partnerType: 'Ajudante',
    role: 'Ajudante iniciante',
    desc: 'Um auxiliar treinado, capaz de ajudá-lo em seu ofício na oficina.',
    benefit: '+2 em Conhecimento e no Ofício escolhido.',
    requiresWar: false,
    customChoice: {
      key: 'oficio',
      label: 'Ofício:',
      options: ['Alfaiate', 'Alvenaria', 'Artesão', 'Culinária', 'Escriba', 'Estalajadeiro', 'Joalheiro', 'Pescador', 'Alquimia', 'Armeiro', 'Carpinteiro', 'Engenhoqueiro', 'Escultor', 'Fazendeiro', 'Minerador', 'Pintor', 'Tatuador']
    }
  },
  {
    id: 'aprendiz_de_mago',
    name: 'Aprendiz de Mago',
    tier: 'iniciante',
    partnerType: 'Magivocador',
    role: 'Magivocador iniciante',
    desc: 'Um estudioso das artes arcanas que potencializa seus feitiços de combate.',
    benefit: 'O dano de suas magias aumenta em +1 dado do mesmo tipo.',
    requiresWar: false
  },
  {
    id: 'arauto',
    name: 'Arauto',
    tier: 'veterano',
    partnerType: 'Ajudante',
    role: 'Ajudante veterano',
    desc: 'Um servo treinado para anunciá-lo de forma solene em cortes e cidades.',
    benefit: '+2 em Diplomacia, Intuição e Nobreza.',
    requiresWar: false
  },
  {
    id: 'arqueiros',
    name: 'Arqueiros',
    tier: 'veterano',
    partnerType: 'Capangas',
    role: 'Unidade de arqueiros (Capangas)',
    desc: 'Um grupamento de 5 atiradores coordenados de infantaria leve.',
    benefit: 'Cinco arqueiros (deslocamento 9m, Defesa 14, dano 1d6 de perfuração cada). Atacam alvos sem cobertura em alcance curto.',
    requiresWar: true
  },
  {
    id: 'besteiro',
    name: 'Besteiro',
    tier: 'iniciante',
    partnerType: 'Atirador',
    role: 'Atirador iniciante',
    desc: 'Um combatente disciplinado com besta pesada de alta precisão.',
    benefit: 'Uma vez por rodada, você recebe +1d6 em uma rolagem de dano à distância.',
    requiresWar: false
  },
  {
    id: 'bando_de_aldoes',
    name: 'Bando de Aldeões',
    tier: 'iniciante',
    partnerType: 'Capangas',
    role: 'Turba de camponeses (Capangas)',
    desc: 'Grupo de 6 esfarrapados portando ancinhos, porretes e ferramentas agrícolas.',
    benefit: 'Seis camponeses (deslocamento 9m, Defesa 10, dano 1d6 de perfuração cada).',
    requiresWar: true
  },
  {
    id: 'batedor',
    name: 'Batedor',
    tier: 'veterano',
    partnerType: 'Vigilante',
    role: 'Vigilante veterano',
    desc: 'Um guia atento e acostumado a emboscadas nos ermos e masmorras.',
    benefit: '+2 em Percepção e Iniciativa. Você pode usar Esquiva Sobrenatural.',
    requiresWar: false
  },
  {
    id: 'bibliotecario_mistico',
    name: 'Bibliotecário Místico',
    tier: 'veterano',
    partnerType: 'Adepto',
    role: 'Adepto veterano',
    desc: 'Um estudioso de manuscritos antigos, repleto de tomos e rituais.',
    benefit: 'O custo para lançar suas magias de 1º e 2º círculo diminui em –1 PM.',
    requiresWar: false
  },
  {
    id: 'conselheiro',
    name: 'Conselheiro',
    tier: 'veterano',
    partnerType: 'Ajudante',
    role: 'Ajudante veterano',
    desc: 'Um diplomata erudito perito em história de Arton e protocolos nobres.',
    benefit: '+2 em Conhecimento, Misticismo e Nobreza.',
    requiresWar: false
  },
  {
    id: 'guarda_costas',
    name: 'Guarda-Costas',
    tier: 'iniciante',
    partnerType: 'Guardião',
    role: 'Guardião iniciante',
    desc: 'Um mercenário de constituição sólida focado em proteger sua vida.',
    benefit: '+2 na sua Defesa.',
    requiresWar: false
  },
  {
    id: 'herbalista',
    name: 'Herbalista',
    tier: 'iniciante',
    partnerType: 'Médico',
    role: 'Médico iniciante',
    desc: 'Um curandeiro de campo abastecido com pomadas e infusões medicinais.',
    benefit: 'Uma vez por rodada gaste 1 PM para curar 1d8+1 PV de um aliado adjacente.',
    requiresWar: false
  },
  {
    id: 'homem_de_armas',
    name: 'Homem de Armas',
    tier: 'iniciante',
    partnerType: 'Fortão',
    role: 'Fortão iniciante',
    desc: 'Um veterano com armadura média perito em espadas bastardas e alabardas.',
    benefit: 'Uma vez por rodada, você recebe +1d8 em uma rolagem de dano corpo a corpo.',
    requiresWar: false
  },
  {
    id: 'irregulares',
    name: 'Irregulares',
    tier: 'veterano',
    partnerType: 'Capangas',
    role: 'Pelotão de infantaria (Capangas)',
    desc: 'Pelotão de 5 infantes de aluguel treinados em formações militares fechadas.',
    benefit: 'Cinco infantes (deslocamento 9m, Defesa 16, espada curta dano 2d4+1 corte cada).',
    requiresWar: true
  },
  {
    id: 'matador',
    name: 'Matador',
    tier: 'veterano',
    partnerType: 'Assassino',
    role: 'Assassino veterano',
    desc: 'Um especialista de guildas criminosas rápido, silencioso e letal.',
    benefit: 'Ataque Furtivo +1d6 (cumulativo) e concede bônus por flanquear contra um inimigo por rodada.',
    requiresWar: false
  },
  {
    id: 'sombra',
    name: 'Sombra',
    tier: 'veterano',
    partnerType: 'Ajudante',
    role: 'Ajudante veterano',
    desc: 'Um agente secreto perito em infiltração urbana e segredos de taverna.',
    benefit: '+2 em Enganação, Furtividade e Investigação.',
    requiresWar: false
  }
];

const GUILD_STORAGE_CONTRACTS = 'forja-taverna-contracts-v1';
const GUILD_STORAGE_WALLET = 'forja-taverna-wallet-v1';

const CANONICAL_MOUNTS = [
  {
    id: 'cavalo',
    nome: 'Cavalo',
    preco: 75,
    role: 'Montaria Terrestre Ágil',
    tamanhos: ['Grande'],
    desc: 'A montaria mais comum do Reinado. Amplo fôlego e velocidade para longas viagens por Arton.',
    iniciante: 'Seu deslocamento muda para 12m e você recebe uma ação de movimento extra por turno (apenas para se deslocar).',
    veterano: 'Seu deslocamento muda para 15m, ação de movimento extra por turno e +2 em testes de ataque corpo a corpo.',
    mestre: 'Deslocamento de 15m, +2 em ataques corpo a corpo e você recebe uma segunda ação de movimento extra por turno (apenas para se deslocar).'
  },
  {
    id: 'ponei',
    nome: 'Pônei',
    preco: 5,
    role: 'Montaria para Pequenos',
    tamanhos: ['Médio'],
    desc: 'Montaria robusta e dócil ideal para heróis de tamanho Pequeno, como anões, goblins e lefou.',
    iniciante: 'Seu deslocamento muda para 12m e você recebe uma ação de movimento extra por turno (apenas para se deslocar).',
    veterano: 'Seu deslocamento muda para 15m, ação de movimento extra por turno e +2 em testes de ataque corpo a corpo.',
    mestre: 'Deslocamento de 15m, +2 em ataques corpo a corpo e você recebe uma segunda ação de movimento extra por turno (apenas para se deslocar).'
  },
  {
    id: 'cao_de_caca',
    nome: 'Cão de Caça',
    preco: 150,
    role: 'Faro & Derrubar',
    tamanhos: ['Pequeno', 'Médio'],
    desc: 'Cães de porte adequado adestrados para rastrear odores, farejar emboscadas e derrubar presas em combate.',
    iniciante: 'Seu deslocamento muda para 9m, você pode usar faro e recebe uma ação de movimento extra por turno (apenas para se deslocar).',
    veterano: 'Seu deslocamento muda para 12m, faro, ação de movimento extra por turno e +2 na Defesa.',
    mestre: 'Deslocamento 12m, faro, +2 na Defesa, ação de movimento extra; ao acertar ataque corpo a corpo pode derrubar como ação livre (1x/rodada).'
  },
  {
    id: 'trobo',
    nome: 'Trobo',
    preco: 60,
    role: 'Resistência & Carga',
    tamanhos: ['Grande'],
    desc: 'Aves corpulentas e plácidas dos campos do Reinado, conhecidas por suportar grande fadiga e cargas pesadas.',
    iniciante: 'Seu deslocamento muda para 9m, uma ação de movimento extra por turno (apenas para se deslocar) e +1 em testes de resistência.',
    veterano: 'Seu deslocamento muda para 12m, ação de movimento extra e o bônus em testes de resistência passa para +2.',
    mestre: 'Seu deslocamento muda para 12m, ação de movimento extra e o bônus em testes de resistência passa para +5.'
  },
  {
    id: 'cavalo_de_guerra',
    nome: 'Cavalo de Guerra',
    preco: 400,
    role: 'Carga Pesada & Blindagem',
    tamanhos: ['Grande'],
    desc: 'Corcel blindado e adestrado nos rigores do campo de batalha, mantendo a serenidade sob saraivadas de flechas.',
    iniciante: 'Seu deslocamento muda para 12m e você recebe uma ação de movimento extra por turno (apenas para se deslocar).',
    veterano: 'Seu deslocamento muda para 15m, ação de movimento extra por turno e +2 em testes de ataque corpo a corpo.',
    mestre: 'Deslocamento de 15m, +2 em ataques corpo a corpo e você recebe uma segunda ação de movimento extra por turno (apenas para se deslocar).'
  },
  {
    id: 'lobo_das_cavernas',
    nome: 'Lobo / Lobo-das-cavernas',
    preco: 200,
    role: 'Fera Predadora & Dano',
    tamanhos: ['Médio', 'Grande'],
    desc: 'Feras predadoras primitivas usadas como montaria por bárbaros, goblinoides e aventureiros de ermos selvagens.',
    iniciante: 'Seu deslocamento muda para 12m e você recebe uma ação de movimento extra por turno (apenas para se deslocar).',
    veterano: 'Seu deslocamento muda para 15m, ação de movimento extra e +1d8 em uma rolagem de dano corpo a corpo por rodada.',
    mestre: 'Deslocamento 15m, +1d8 em dano corpo a corpo, ação de movimento extra e pode derrubar como ação livre ao acertar ataque (1x/rodada).'
  },
  {
    id: 'grifo',
    nome: 'Grifo',
    preco: 300,
    role: 'Montaria Voadora Soberana',
    tamanhos: ['Grande'],
    desc: 'Criatura imponente com corpo de leão e asas de águia. No patamar iniciante é um filhote; veterano e mestre concedem voo real.',
    iniciante: 'Filhote: uma vez por rodada você recebe +1d8 em uma rolagem de dano corpo a corpo (não pode ser montado enquanto filhote).',
    veterano: 'Montaria de elite: muda seu deslocamento para voo 18m e concede +1d8 em uma rolagem de dano corpo a corpo por rodada.',
    mestre: 'Voo 18m, +1d8 de dano corpo a corpo e você recebe uma ação de movimento extra por turno (apenas para se deslocar em voo).'
  },
  {
    id: 'gorlogg',
    nome: 'Gorlogg',
    preco: 400,
    role: 'Besta de Guerra Brutal',
    tamanhos: ['Grande'],
    desc: 'Réptil colossal e couraçado das savanas de Galrasia, empregado como montaria de impacto demolidor.',
    iniciante: 'Seu deslocamento muda para 12m e, uma vez por rodada, você recebe +1d6 em uma rolagem de dano corpo a corpo.',
    veterano: 'Seu deslocamento muda para 12m e o bônus em dano corpo a corpo passa para +1d10 por rodada.',
    mestre: 'Seu deslocamento muda para 15m e o bônus em dano corpo a corpo passa para +2d8 por rodada.'
  }
];

let guildState = {
  activeTab: 'parceiros', // 'parceiros' | 'mercenarios' | 'estabulo'
  filterTier: 'todos',    // 'todos' | 'iniciante' | 'veterano' | 'mestre'
  search: '',
  funds: 100,
  characterName: 'Herói',
  level: 1,
  contracts: [],
  partners: [],
  trainedSkills: [],
  mercenaryChoices: {},
  mountChoices: {}
};

function getGuildPartnerLimit(level) {
  const lvl = Number(level) || 1;
  let baseLimit = 1;
  if (lvl >= 17) baseLimit = 3;
  else if (lvl >= 5) baseLimit = 2;

  let bonusLimit = 0;
  if (guildState.hasComitiva && guildState.nobreLevel >= 5) {
    bonusLimit += 1;
    if (guildState.nobreLevel >= 11) {
      bonusLimit += 1;
    }
  }

  const maxPartners = baseLimit + bonusLimit;
  const maxVeterans = lvl >= 17 ? 2 : (lvl >= 5 ? 1 : 0);
  const maxMasters = lvl >= 17 ? 1 : 0;
  return { maxPartners, maxVeterans, maxMasters, baseLimit, bonusLimit };
}

function getActiveGuildCounts() {
  const contracts = Array.isArray(guildState.contracts) ? guildState.contracts : [];
  const partners = Array.isArray(guildState.partners) ? guildState.partners : [];
  let normalCount = 0;
  let veteranCount = 0;
  let masterCount = 0;

  for (const c of contracts) {
    if (c.category === 'mercenario' || c.category === 'parceiro' || c.partnerCategory === 'parceiros' || String(c.itemId || '').startsWith('parceiro_')) {
      if (c.countsTowardsLimit === false || c.ignoraLimite) continue;
      normalCount++;
      const isVet = c.tier === 'veterano' || /veterano/i.test(c.itemName || '') || /veterano/i.test(c.description || '');
      const isMestre = c.tier === 'mestre' || /mestre/i.test(c.itemName || '');
      if (isMestre) masterCount++;
      else if (isVet) veteranCount++;
    }
  }

  for (const p of partners) {
    if (p.countsTowardsLimit === false || p.ignoraLimite || p.special) continue;
    normalCount++;
    if (p.grau === 'mestre' || p.tier === 'mestre') masterCount++;
    else if (p.grau === 'veterano' || p.tier === 'veterano') veteranCount++;
  }

  const limit = getGuildPartnerLimit(guildState.level);
  return { normalCount, veteranCount, masterCount, limit };
}

function loadGuildStorage() {
  if (typeof window !== 'undefined' && window.__INITIAL_GUILDA_STATE__) {
    const init = window.__INITIAL_GUILDA_STATE__;
    if (init.funds !== undefined) guildState.funds = Number(init.funds) || 0;
    if (init.characterName !== undefined) guildState.characterName = init.characterName;
    if (init.level !== undefined) guildState.level = Number(init.level) || 1;
    if (Array.isArray(init.contracts)) guildState.contracts = init.contracts;
    if (Array.isArray(init.partners)) guildState.partners = init.partners;
  }

  if (typeof window !== 'undefined' && window.location) {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['parceiros', 'mercenarios', 'estabulo'].includes(tabParam)) {
        guildState.activeTab = tabParam;
      }
    } catch (e) {}
  }

  if (typeof window !== 'undefined' && window.__INITIAL_GUILDA_STATE__) {
    return;
  }

  try {
    const rawHero = localStorage.getItem('forja-heroi-t20-v1');
    if (rawHero) {
      const hero = JSON.parse(rawHero);
      if (hero.identity?.characterName) guildState.characterName = hero.identity.characterName;
      const lvl = Number(hero.identity?.plannedLevel || hero.identity?.initialLevel || hero.level || (Array.isArray(hero.progression) ? hero.progression.length + 1 : 1));
      if (lvl > 0) guildState.level = lvl;
      if (Array.isArray(hero.partners)) guildState.partners = hero.partners;
      if (Array.isArray(hero.tavernContracts)) guildState.contracts = hero.tavernContracts;

      // Detecção de poderes/habilidades (ex: Comitiva de Nobre)
      const prog = Array.isArray(hero.progression) ? hero.progression : [];
      const powersGeneral = Array.isArray(hero.powers?.general) ? hero.powers.general : [];
      const powersSelected = Array.isArray(hero.powers?.selected) ? hero.powers.selected : [];
      const hasComitiva = prog.some(r => r.powerId === 'nobre_comitiva' || r.powerId === 'comitiva') ||
        powersGeneral.includes('nobre_comitiva') || powersGeneral.includes('comitiva') ||
        powersSelected.includes('nobre_comitiva') || powersSelected.includes('comitiva');
      const nobreLvl = prog.filter(r => r.classId === 'nobre').length || (hero.identity?.classId === 'nobre' ? lvl : 0);
      guildState.hasComitiva = hasComitiva;
      guildState.nobreLevel = nobreLvl;
    }
  } catch (e) {}

  try {
    const published = JSON.parse(localStorage.getItem('forja-saldo-personagem-ativo-v1') || 'null');
    if (published && Number.isFinite(Number(published.funds)) && Number(published.funds) > 0) {
      guildState.funds = Number(published.funds);
    }
  } catch (e) {}

  try {
    const saved = localStorage.getItem(GUILD_STORAGE_CONTRACTS);
    if (saved && (!guildState.contracts || !guildState.contracts.length)) guildState.contracts = JSON.parse(saved);
  } catch (e) {}

  try {
    const savedW = localStorage.getItem(GUILD_STORAGE_WALLET);
    if (savedW !== null && guildState.funds <= 0) guildState.funds = Number(savedW) || 0;
  } catch (e) {}
}

function saveGuildStorage() {
  try {
    localStorage.setItem(GUILD_STORAGE_CONTRACTS, JSON.stringify(guildState.contracts));
    localStorage.setItem(GUILD_STORAGE_WALLET, String(guildState.funds));
  } catch (e) {}

  try {
    const rawHero = localStorage.getItem('forja-heroi-t20-v1');
    if (rawHero) {
      const hero = JSON.parse(rawHero);
      hero.partners = guildState.partners;
      hero.tavernContracts = guildState.contracts;
      localStorage.setItem('forja-heroi-t20-v1', JSON.stringify(hero));
    }
  } catch (e) {}

  try {
    const rosterRaw = localStorage.getItem('forja-heroi-t20-personagens-v1') || localStorage.getItem('forja-roster-t20-v1');
    if (rosterRaw) {
      const roster = JSON.parse(rosterRaw);
      if (Array.isArray(roster) && roster.length > 0) {
        const activeChar = roster.find(c => c.active || (c.snapshot && c.snapshot.identity?.characterName === guildState.characterName)) || roster[0];
        if (activeChar && activeChar.snapshot) {
          activeChar.snapshot.partners = guildState.partners;
          activeChar.snapshot.tavernContracts = guildState.contracts;
          const k = localStorage.getItem('forja-heroi-t20-personagens-v1') ? 'forja-heroi-t20-personagens-v1' : 'forja-roster-t20-v1';
          localStorage.setItem(k, JSON.stringify(roster));
        }
      }
    }
  } catch (e) {}

  try {
    localStorage.setItem('forja-saldo-personagem-ativo-v1', JSON.stringify({ funds: guildState.funds }));
  } catch (e) {}
}

function formatGuildPrice(val) {
  const num = Number(val) || 0;
  if (num < 1) return 'T$ ' + num.toFixed(1).replace('.', ',');
  return 'T$ ' + num.toLocaleString('pt-BR');
}

function hasGuildWarTraining() {
  const skills = Array.isArray(guildState.trainedSkills) ? guildState.trainedSkills : [];
  return skills.some(s => {
    const norm = String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return norm === 'guerra' || norm.includes('guerra');
  });
}
