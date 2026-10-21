/**
 * Memoização restrita a uma única operação síncrona.
 * O cache é descartado no finally, inclusive em falha, e nunca cruza alterações de estado.
 */

export interface OperationCache {
  executar<T>(fn: () => T): T;
  obter<T>(chave: string, calcular: () => T): T;
}

export function criarCalculoPorOperacao(): OperationCache {
  let cache: Map<string, unknown> | null = null;
  return {
    executar<T>(executarFn: () => T): T {
      if (cache) return executarFn();
      cache = new Map();
      try {
        return executarFn();
      } finally {
        cache = null;
      }
    },
    obter<T>(chave: string, calcular: () => T): T {
      if (!cache) return calcular();
      if (!cache.has(chave)) {
        cache.set(chave, calcular());
      }
      return cache.get(chave) as T;
    },
  };
}
