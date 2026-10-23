/**
 * Regras de Devotos Fundamentalistas e Devoção Ampla (Deuses de Arton - Tormenta 20).
 * Textos canônicos preservados integralmente conforme diretrizes do projeto.
 */

export const FUNDAMENTALIST_ELIGIBLE_CLASSES = [
  'clerigo',
  'druida',
  'ermitao',
  'frade',
  'paladino',
  'santo',
] as const;

/**
 * Textos canônicos de Fundamentalista para cada divindade do Panteão e culto ao Panteão.
 */
export const FUNDAMENTALIST_TEXTS: Record<string, string> = {
  aharadak:
    'Fundamentalista. Diferente de outros deuses, Aharadak tem mais fundamentalistas que liberais — são os verdadeiros vilões, cultistas maníacos que aterrorizam aldeias, sacrificam vítimas, invocam aberrações. É impossível para tais depravados perder seus poderes; suas almas já pertencem ao Devorador por completo. São obcecados com espalhar a corrupção da Tormenta, não importando quantos precisem sofrer ou morrer. Ainda assim, em suas mentes alucinadas, estão “fazendo o bem”.',
  allihanna:
    'Fundamentalista. Totalmente dedicado à proteção e ao bem-estar de sua comunidade, jamais se ausenta em missões ou aventuras, exceto quando essa comunidade está em risco. Mesmo nesses casos, não deve se ausentar por mais de um mês.',
  arsenal:
    'Fundamentalista. Qualquer mínima derrota deve ser imediatamente corrigida com uma vitória. Isso vale para qualquer teste de perícia, qualquer disputa, até mesmo algo inofensivo como uma discussão ou um jogo amigável. Deixar de fazê-lo é uma violação das Obrigações & Restrições, mesmo quando não houver meio (nesse caso, crie um meio).',
  azgher:
    'Fundamentalista. Não apenas é proibido de se associar a devotos de Tenebra, mas também deve atacar e destruir todos aqueles que encontrar.',
  hyninn:
    'Fundamentalista. Proibido de dizer mais de cinco verdades por dia. Além disso, seu ato de furtividade diário deve ter CD mínima 20 + metade de seu nível.',
  kallyadranoch:
    'Fundamentalista. Deve oferecer servidão a um dragão maligno adulto ou maior (muitos perdem a vida fazendo essa tentativa). Caso consiga, deve cumprir ordens e realizar oferendas regulares a esse patrono, mesmo quando envolvem sacrifícios humanos.',
  khalmyr:
    'Fundamentalista. Em vez de simplesmente esperar por pedidos de ajuda, deve sempre oferecê-la a qualquer pessoa que encontrar. Se houver várias pessoas na cena, oferece ajuda a quem pareça ter mais necessidade. O devoto deve encontrar e ajudar pelo menos um necessitado por dia.',
  lena:
    'Fundamentalista. As mais ferrenhas clérigas de Lena não recusam ajudar qualquer vítima de um conflito, em qualquer dos lados. Sempre que existe uma criatura ferida ao alcance de sua cura, seja aliado ou inimigo, não pode realizar qualquer outra ação exceto curá-la.',
  lin_wu:
    'Fundamentalista. Sem tolerância à incivilidade estrangeira, o shugenja não permite que seus aliados recorram a ações que exigem testes de Enganação, Ladinagem ou Furtividade; qualquer desses atos é uma desonra!',
  marah:
    'Fundamentalista. Nunca participa de um combate, nem mesmo protegendo ou curando aliados. Jamais lança magias que exigem testes de resistência, pois considera isso uma agressão. Recorre a qualquer meio não violento para encerrar um combate, sacrificando a própria vida se necessário. (não recomendado para jogadores)',
  megalokk:
    'Fundamentalista. Recusa qualquer aliança ou contato pacífico com membros de outros povos, exceto o tipo de monstro que protege. Todos os outros merecem apenas violência, servem apenas como comida.',
  nimb:
    'Fundamentalista. Como oferenda a Nimb, entrega a própria vida ao aleatório. Uma vez a cada sessão (ou a cada mês, em tempo de jogo), coloca-se em uma situação com pelo menos 5% de chance de morte (1 em 1d20). Por exemplo, misturando um doce envenenado a outros dezenove inofensivos, então comendo um ao acaso.',
  oceano:
    'Fundamentalista. Jamais pisa em solo firme, exceto quando cercado de água visível em pelo menos três direções (barcos, navios, cais, ilhotas...). Quando absolutamente necessário, deve recorrer a meios especiais, como voo, para evitar que seus pés toquem o chão.',
  sszzaas:
    'Fundamentalista. Conhecidos como sszzaazitas, estes fanáticos são os devotos mais ferrenhos de Sszzaas, não raras vezes traindo e matando seus aliados. Cada vez que sobe de nível, um sszzaazita deve realizar um sacrifício (assassinar um humanoide em ritual) ou um ato de corrupção do bem (fazer fracassar uma causa justa, incriminar um inocente por um crime grave, destruir um item sagrado...).',
  tanna_toh:
    'Fundamentalista. Em vez de esperar perguntas, simplesmente revela tudo que existe para saber, mesmo sem ser perguntado. Também é proibido de fazer testes de Enganação ou Furtividade, ou permitir que sejam feitos em sua presença (caso ocorram, deve revelar a verdade e/ou atrapalhar a ação).',
  tenebra:
    'Fundamentalista. Proibido de recorrer a qualquer forma de iluminação natural, artificial ou mágica; pode apenas usar visão no escuro e outros sentidos. Além disso, não apenas é proibido de associar-se a devotos de Azgher, mas também deve atacar e destruir todos aqueles que encontrar.',
  thyatis:
    'Fundamentalista. Proibido de matar não apenas seres inteligentes, mas quaisquer seres vivos. Além disso, não pode se recusar a ressuscitar nenhuma criatura ao alcance de seus poderes, incluindo inimigos.',
  thwor:
    'Fundamentalista. Atua como protetor de seu povo, mas é um inimigo do Reinado. Suas “missões divinas” se resumem a ataques contra povoados humanos. Todo ser inteligente que recuse devoção a Thwor deve ser destruído.',
  valkaria:
    'Fundamentalista. Nunca permanece mais de uma semana na mesma cidade. Também nunca recusa uma missão ou aventura, por mais perigosa que seja.',
  wynna:
    'Fundamentalista. Jamais impede a execução de uma magia, nem promove seu cancelamento, de aliados ou inimigos. É proibido de usar Dissipar Magia, Campo Antimagia e similares (mas ainda pode interromper suas próprias magias sustentadas).',
  panteao:
    'Fundamentalista. Acredita com fervor que todo o Panteão deve ser cultuado; favorecer este ou aquele deus acaba atraindo o desfavor dos outros dezenove. Não se associa a devotos de deuses específicos. Além de PM adicionais (p. 11), o sacerdote do Panteão fundamentalista recebe um poder de combate ou de destino a sua escolha.',
};

/**
 * Mapeamento das armas favoritas de cada divindade para verificação de violação de dogma.
 */
export const DEITY_FAVORITE_WEAPON_SLUGS: Record<string, string[]> = {
  aharadak: ['corrente_de_espinhos'],
  allihanna: ['bordao'],
  arsenal: ['martelo_de_guerra'],
  azgher: ['cimitarra', 'espada_solar', 'magico_herois_de_arton_espada_solar'],
  hyninn: ['adaga'],
  kallyadranoch: ['lanca'],
  khalmyr: ['espada_longa'],
  lena: [],
  lin_wu: ['katana'],
  marah: [],
  megalokk: ['maca'],
  nimb: ['*'],
  oceano: ['tridente'],
  sszzaas: ['adaga'],
  tanna_toh: ['bordao'],
  tenebra: ['adaga'],
  thyatis: ['espada_longa'],
  thwor: ['machado_de_guerra'],
  valkaria: ['mangual'],
  wynna: ['adaga'],
  gwendolynn: ['cajado_de_batalha', 'bordao'],
  mauziell: ['clava', 'bengala'],
  tibar: [],
};

export function normalizeDeitySlug(nameOrId: string): string {
  return String(nameOrId || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Verifica se a classe pode optar por ser devoto fundamentalista (qualquer classe).
 */
export function canBeFundamentalist(classId: string): boolean {
  return Boolean(classId);
}

/**
 * Retorna o texto canônico de fundamentalista para uma divindade ou para o Panteão.
 */
export function getFundamentalistText(deityNameOrMode: string): string {
  const key = normalizeDeitySlug(deityNameOrMode);
  if (key === 'pantheon' || key === 'panteao') return FUNDAMENTALIST_TEXTS.panteao;
  return FUNDAMENTALIST_TEXTS[key] || '';
}

export const getFundamentalistObligations = getFundamentalistText;

/**
 * Verifica se o personagem se enquadra em Devoção Ampla (Deuses de Arton):
 * Clérigos e frades do Panteão, druidas de Arton e paladinos do bem.
 */
export function isBroadDevotion(classId: string, deityMode: string): boolean {
  const normClass = normalizeDeitySlug(classId);
  return (
    deityMode === 'pantheon' &&
    (FUNDAMENTALIST_ELIGIBLE_CLASSES as readonly string[]).includes(normClass)
  );
}

/**
 * Retorna o título temático da Devoção Ampla conforme a classe.
 */
export function getBroadDevotionTitle(classId: string): string {
  const normClass = normalizeDeitySlug(classId);
  if (normClass === 'druida' || normClass === 'ermitao') return 'Devoção Ampla (Druida de Arton)';
  if (normClass === 'paladino' || normClass === 'santo') return 'Devoção Ampla (Paladino do Bem)';
  return 'Devoção Ampla (Devoto do Panteão)';
}

/**
 * Calcula o bônus de PM concedido pela Devoção Ampla (+2 PM por patamar).
 */
export function calculateBroadDevotionPmBonus(
  classId: string,
  deityMode: string,
  level: number,
  ruleEnabled = true
): number {
  if (!ruleEnabled || !isBroadDevotion(classId, deityMode)) return 0;
  const lvl = Math.max(1, Number(level) || 1);
  const tier = lvl >= 17 ? 4 : lvl >= 11 ? 3 : lvl >= 5 ? 2 : 1;
  return 2 * tier;
}

export interface FundamentalistWeaponCheckResult {
  violated: boolean;
  offendingWeaponName: string;
  favoriteWeaponLabel: string;
  violatingWeapons: string[];
  allowedWeapons: string[];
  reason: string;
}

export interface FundamentalistWeaponCheckParams {
  isFundamentalist: boolean;
  classId?: string;
  deityMode?: string;
  deityName: string;
  favoriteWeaponLabel?: string;
  equippedWeapons: Array<{ id?: string; itemId?: string; nome?: string; displayName?: string }>;
}

/**
 * Verifica se um devoto fundamentalista está equipando alguma arma que viole o dogma
 * de usar apenas a arma favorita de sua divindade.
 * Suporta tanto chamada por objeto quanto chamada posicional (deityId, isFundamentalist, equippedWeapons).
 */
export function checkFundamentalistWeaponViolation(
  deityOrParams: string | FundamentalistWeaponCheckParams,
  isFundamentalistArg?: boolean,
  equippedWeaponsArg?: Array<{ id?: string; itemId?: string; nome?: string; displayName?: string }>
): FundamentalistWeaponCheckResult {
  let isFundamentalist = false;
  let classId = 'clerigo';
  let deityMode = 'deity';
  let deityName = '';
  let favoriteWeaponLabel = '';
  let equippedWeapons: Array<{ id?: string; itemId?: string; nome?: string; displayName?: string }> = [];

  if (typeof deityOrParams === 'string') {
    deityName = deityOrParams;
    isFundamentalist = Boolean(isFundamentalistArg);
    equippedWeapons = Array.isArray(equippedWeaponsArg) ? equippedWeaponsArg : [];
  } else if (deityOrParams && typeof deityOrParams === 'object') {
    isFundamentalist = Boolean(deityOrParams.isFundamentalist);
    classId = deityOrParams.classId || 'clerigo';
    deityMode = deityOrParams.deityMode || 'deity';
    deityName = deityOrParams.deityName || '';
    favoriteWeaponLabel = deityOrParams.favoriteWeaponLabel || '';
    equippedWeapons = Array.isArray(deityOrParams.equippedWeapons) ? deityOrParams.equippedWeapons : [];
  }

  if (
    !isFundamentalist ||
    !canBeFundamentalist(classId) ||
    (deityMode !== 'devout' && deityMode !== 'deity') ||
    !deityName
  ) {
    return {
      violated: false,
      offendingWeaponName: '',
      favoriteWeaponLabel,
      violatingWeapons: [],
      allowedWeapons: [],
      reason: '',
    };
  }

  const deityKey = normalizeDeitySlug(deityName);
  const allowedSlugs = DEITY_FAVORITE_WEAPON_SLUGS[deityKey] || [];
  if (!DEITY_FAVORITE_WEAPON_SLUGS[deityKey] || allowedSlugs.includes('*')) {
    return {
      violated: false,
      offendingWeaponName: '',
      favoriteWeaponLabel,
      violatingWeapons: [],
      allowedWeapons: allowedSlugs,
      reason: '',
    };
  }

  const violating: string[] = [];
  for (const w of equippedWeapons) {
    const wId = normalizeDeitySlug(w.itemId || w.id || '');
    const wName = normalizeDeitySlug(w.nome || w.displayName || '');
    if (!wId && !wName) continue;
    if (wId === 'ataque_desarmado' || wName === 'ataque_desarmado' || wId === 'desarmado' || wName === 'desarmado') {
      continue;
    }

    const isAllowed = allowedSlugs.some(
      (allowed) =>
        wId === allowed ||
        wName === allowed ||
        wId.includes(allowed) ||
        wName.includes(allowed)
    );
    if (!isAllowed) {
      violating.push(w.displayName || w.nome || w.itemId || w.id || 'Arma não permitida');
    }
  }

  if (violating.length > 0) {
    const favText = favoriteWeaponLabel || (allowedSlugs.length ? allowedSlugs.join(', ') : 'Nenhuma');
    return {
      violated: true,
      offendingWeaponName: violating[0],
      favoriteWeaponLabel: favText,
      violatingWeapons: violating,
      allowedWeapons: allowedSlugs,
      reason: `Violação de Dogma Fundamentalista (${deityName}): fundamentalistas usam apenas a arma favorita de sua divindade (${favText}). Equipar ${violating.join(', ')} zera seus PM atuais.`,
    };
  }

  return {
    violated: false,
    offendingWeaponName: '',
    favoriteWeaponLabel,
    violatingWeapons: [],
    allowedWeapons: allowedSlugs,
    reason: '',
  };
}
