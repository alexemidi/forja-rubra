/**
 * Porta de armazenamento injetável e segura para leitura e salvamento de fichas.
 * Nunca sobrescreve fichas corrompidas/inválidas com uma ficha vazia.
 */

import { restaurarEstadoInterface, separarEstadoInterface } from './ui-state.ts';

export interface SimpleStorage {
  getItem: (key: string) => string | null | undefined;
  setItem: (key: string, value: string) => void;
}

export interface ForjaStorageAdapter {
  ler<T>(key: string, fallback: () => T): T;
  salvar(key: string, value: unknown): void;
}

const ROSTER_KEYS = new Set([
  'forja-heroi-t20-personagens-v1',
  'forja-roster-t20-v1',
]);

export const ArmazenamentoForja = Object.freeze({
  criar(storage: SimpleStorage): ForjaStorageAdapter {
    return Object.freeze({
      ler<T>(key: string, fallback: () => T): T {
        try {
          const raw = storage.getItem(key);
          const value = JSON.parse(raw || 'null');
          if (value === null) return fallback();
          if (
            key === 'forja-heroi-t20-v1' &&
            (!value.identity || typeof value.identity !== 'object')
          ) {
            throw new Error('Identidade ausente');
          }
          if (ROSTER_KEYS.has(key) && !Array.isArray(value)) {
            throw new Error('Lista inválida');
          }
          if (key === 'forja-heroi-t20-v1') {
            return restaurarEstadoInterface(value) as T;
          }
          if (ROSTER_KEYS.has(key)) {
            return value.map((hero: Record<string, any>) => ({
              ...hero,
              snapshot: restaurarEstadoInterface(hero.snapshot),
            })) as T;
          }
          return value as T;
        } catch {
          if (key === 'forja-heroi-t20-v1' || ROSTER_KEYS.has(key)) {
            throw new Error(
              'Dados de personagem inválidos em ' +
                key +
                '. Exporte o backup antes de recuperar a ficha.'
            );
          }
          return fallback();
        }
      },
      salvar(key: string, value: unknown): void {
        let payload = value;
        if (
          key === 'forja-heroi-t20-v1' &&
          payload &&
          typeof payload === 'object'
        ) {
          payload = separarEstadoInterface(payload as Record<string, any>);
        } else if (ROSTER_KEYS.has(key) && Array.isArray(payload)) {
          payload = payload.map((hero: Record<string, any>) => ({
            ...hero,
            snapshot: separarEstadoInterface(hero.snapshot),
          }));
        }
        storage.setItem(key, JSON.stringify(payload));
      },
    });
  },
});

export default ArmazenamentoForja;
