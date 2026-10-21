/**
 * Gerenciamento seguro de Backup de Fichas e Perfis da Forja T20.
 * Não transporta sessões nem credenciais de autenticação entre ambientes.
 */

export interface StoragePort {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  key: (index: number) => string | null;
  readonly length: number;
}

export interface ForjaBackupPayload {
  formato: 'forja-backup';
  versao: 1;
  criadoEm: string;
  dados: Record<string, string>;
}

/** Verifica se a chave pertence aos dados de personagem/campanha e não contém credenciais. */
export function chavePermitida(key: string): boolean {
  return (
    /^(forja[-_]|t20[-_]|arsenal[-_])/i.test(key) &&
    !/supabase|token|auth|session/i.test(key)
  );
}

/** Exporta todas as chaves permitidas do armazenamento para um objeto de backup versionado. */
export function exportarBackup(storage: StoragePort): ForjaBackupPayload {
  const dados: Record<string, string> = {};
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key && chavePermitida(key)) {
      const value = storage.getItem(key);
      if (value !== null) {
        dados[key] = value;
      }
    }
  }
  return {
    formato: 'forja-backup',
    versao: 1,
    criadoEm: new Date().toISOString(),
    dados,
  };
}

/** Valida a estrutura e integridade das fichas dentro de um payload de backup. */
export function validarBackup(input: unknown): ForjaBackupPayload {
  if (!input || typeof input !== 'object') {
    throw new Error('Arquivo de backup inválido.');
  }
  const b = input as ForjaBackupPayload;
  if (
    b.formato !== 'forja-backup' ||
    b.versao !== 1 ||
    !b.dados ||
    typeof b.dados !== 'object' ||
    Array.isArray(b.dados)
  ) {
    throw new Error('Formato ou versão de backup incompatível.');
  }
  for (const [key, value] of Object.entries(b.dados)) {
    if (!chavePermitida(key) || typeof value !== 'string') {
      throw new Error('Entrada não permitida: ' + key);
    }
    if (key === 'forja-heroi-t20-v1') {
      const hero = JSON.parse(value);
      if (!hero?.identity || typeof hero.identity !== 'object') {
        throw new Error('Ficha ativa inválida; o original deve ser preservado.');
      }
    }
    if (
      ['forja-heroi-t20-personagens-v1', 'forja-roster-t20-v1'].includes(key)
    ) {
      const roster = JSON.parse(value);
      if (
        !Array.isArray(roster) ||
        roster.some(
          (hero: Record<string, any>) =>
            !hero?.id || !hero?.snapshot?.identity
        )
      ) {
        throw new Error('Lista de personagens inválida.');
      }
    }
  }
  return b;
}

/**
 * Importa dados de backup de forma idempotente e atômica (reverte alterações em caso de falha de quota).
 */
export function importarBackup(storage: StoragePort, input: unknown): number {
  const backup = validarBackup(input);
  const previous = new Map<string, string | null>(
    Object.keys(backup.dados).map((key) => [key, storage.getItem(key)])
  );
  try {
    for (const [key, value] of Object.entries(backup.dados)) {
      storage.setItem(key, value);
    }
  } catch (error) {
    const failures: string[] = [];
    for (const [key, value] of previous) {
      try {
        if (value === null) storage.removeItem(key);
        else storage.setItem(key, value);
      } catch {
        failures.push(key);
      }
    }
    if (failures.length) {
      throw new Error(
        'Falha de armazenamento. Não foi possível restaurar: ' +
          failures.join(', ') +
          '. Preserve o backup original.'
      );
    }
    throw error;
  }
  return Object.keys(backup.dados).length;
}
