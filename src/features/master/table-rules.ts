/**
 * Módulo de Regras da Mesa do Mestre (Configuração de Campanha e Link de Convite).
 * Permite ao Mestre definir quais regras opcionais de Tormenta 20 estão ativas
 * e gerar um link/código que pré-configura o Criador de Personagens para os jogadores.
 */

export const TABLE_RULES_STORAGE_KEY = 'forja-t20-table-rules-v1';

export interface TableRulesConfig {
  tableName: string;
  broadDevotion: boolean;
  fundamentalistDevotion: boolean;
  broadDevotionAndFundamentalist: boolean;
  openRaces: boolean;
  openDevotion: boolean;
  ageRules: boolean;
  dualOrigin: boolean;
  levelTraining: boolean;
  updatedAt?: string;
}

export const DEFAULT_TABLE_RULES: TableRulesConfig = {
  tableName: 'Mesa de Tormenta 20',
  broadDevotion: true,
  fundamentalistDevotion: true,
  broadDevotionAndFundamentalist: true,
  openRaces: true,
  openDevotion: false,
  ageRules: true,
  dualOrigin: true,
  levelTraining: true,
};

export function normalizeTableRules(raw?: Partial<TableRulesConfig> | null): TableRulesConfig {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_TABLE_RULES };
  }
  const broad =
    raw.broadDevotion !== undefined
      ? Boolean(raw.broadDevotion)
      : raw.broadDevotionAndFundamentalist !== undefined
        ? Boolean(raw.broadDevotionAndFundamentalist)
        : DEFAULT_TABLE_RULES.broadDevotion;
  const fund =
    raw.fundamentalistDevotion !== undefined
      ? Boolean(raw.fundamentalistDevotion)
      : raw.broadDevotionAndFundamentalist !== undefined
        ? Boolean(raw.broadDevotionAndFundamentalist)
        : DEFAULT_TABLE_RULES.fundamentalistDevotion;

  return {
    tableName: String(raw.tableName ?? DEFAULT_TABLE_RULES.tableName).trim() || 'Mesa de Tormenta 20',
    broadDevotion: broad,
    fundamentalistDevotion: fund,
    broadDevotionAndFundamentalist: broad || fund,
    openRaces: raw.openRaces !== undefined ? Boolean(raw.openRaces) : DEFAULT_TABLE_RULES.openRaces,
    openDevotion:
      raw.openDevotion !== undefined ? Boolean(raw.openDevotion) : DEFAULT_TABLE_RULES.openDevotion,
    ageRules: raw.ageRules !== undefined ? Boolean(raw.ageRules) : DEFAULT_TABLE_RULES.ageRules,
    dualOrigin:
      raw.dualOrigin !== undefined ? Boolean(raw.dualOrigin) : DEFAULT_TABLE_RULES.dualOrigin,
    levelTraining:
      raw.levelTraining !== undefined
        ? Boolean(raw.levelTraining)
        : DEFAULT_TABLE_RULES.levelTraining,
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
}

export function loadActiveTableRules(): TableRulesConfig {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(TABLE_RULES_STORAGE_KEY);
      if (raw) {
        return normalizeTableRules(JSON.parse(raw));
      }
    }
  } catch {}
  return { ...DEFAULT_TABLE_RULES };
}

export function saveActiveTableRules(rules: Partial<TableRulesConfig>): TableRulesConfig {
  const normalized = normalizeTableRules({
    ...loadActiveTableRules(),
    ...rules,
    updatedAt: new Date().toISOString(),
  });
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TABLE_RULES_STORAGE_KEY, JSON.stringify(normalized));
    }
  } catch {}
  return normalized;
}

/**
 * Codifica as regras da mesa em um token compacto seguro para URL (FT20M1-...).
 */
export function encodeTableRulesCode(rules: Partial<TableRulesConfig>): string {
  const r = normalizeTableRules(rules);
  const compact = {
    n: r.tableName,
    b: r.broadDevotion ? 1 : 0,
    f: r.fundamentalistDevotion ? 1 : 0,
    or: r.openRaces ? 1 : 0,
    od: r.openDevotion ? 1 : 0,
    ag: r.ageRules ? 1 : 0,
    do: r.dualOrigin ? 1 : 0,
    lt: r.levelTraining ? 1 : 0,
  };
  const json = JSON.stringify(compact);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `FT20M1-${base64}`;
}

/**
 * Decodifica um token FT20M1-... ou URL contendo ?mesa=...
 */
export function decodeTableRulesCode(codeOrUrl: string): TableRulesConfig | null {
  try {
    let token = String(codeOrUrl || '').trim();
    if (!token) return null;
    if (token.includes('mesa=')) {
      const match = token.match(/[?&]mesa=([^&#\s]+)/);
      if (match?.[1]) token = decodeURIComponent(match[1]);
    }
    if (token.startsWith('FT20M1-')) {
      token = token.slice('FT20M1-'.length);
    }
    const padded = token.replace(/-/g, '+').replace(/_/g, '/');
    const padLen = (4 - (padded.length % 4)) % 4;
    const base64 = padded + '='.repeat(padLen);
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    if (!parsed || typeof parsed !== 'object') return null;
    return normalizeTableRules({
      tableName: parsed.n || 'Mesa de Tormenta 20',
      broadDevotion: Boolean(parsed.b),
      fundamentalistDevotion: parsed.f !== undefined ? Boolean(parsed.f) : Boolean(parsed.b),
      broadDevotionAndFundamentalist: Boolean(parsed.b),
      openRaces: Boolean(parsed.or),
      openDevotion: Boolean(parsed.od),
      ageRules: Boolean(parsed.ag),
      dualOrigin: Boolean(parsed.do),
      levelTraining: parsed.lt !== undefined ? Boolean(parsed.lt) : true,
    });
  } catch {
    return null;
  }
}

/**
 * Gera a URL completa de convite para o Criador de Personagens.
 * Aceita (baseHref, rules) ou (rules, baseHref).
 */
export function buildTableInviteUrl(
  first: string | Partial<TableRulesConfig>,
  second?: Partial<TableRulesConfig> | string
): string {
  const isFirstString = typeof first === 'string';
  const rules = (isFirstString ? second : first) as Partial<TableRulesConfig>;
  const baseHref = (isFirstString ? first : second) as string | undefined;
  const code = encodeTableRulesCode(rules || {});
  const originUrl =
    baseHref ||
    (typeof window !== 'undefined' && window.location
      ? window.location.href
      : 'http://localhost/criador.html');
  try {
    const url = new URL('criador.html', originUrl);
    url.searchParams.set('mesa', code);
    return url.toString();
  } catch {
    return `criador.html?mesa=${encodeURIComponent(code)}`;
  }
}
