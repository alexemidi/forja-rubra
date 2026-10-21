/**
 * Registro Tipado de Páginas da Forja T20 (`src/pages/`).
 * Centraliza metadados de roteamento, títulos e chaves de páginas.
 */

export type ForjaPageKey =
  | 'index'
  | 'personagens'
  | 'criador'
  | 'ficha'
  | 'loja'
  | 'taverna'
  | 'guilda'
  | 'estabulo'
  | 'oficina'
  | 'engenhoca'
  | 'grimorio'
  | 'distincoes'
  | 'recompensas'
  | 'resgatar-recompensas'
  | 'mapa'
  | 'termos';

export interface ForjaPageMeta {
  key: ForjaPageKey;
  title: string;
  fileName: string;
  requiresCharacter?: boolean;
}

export const FORJA_PAGES: Readonly<Record<ForjaPageKey, ForjaPageMeta>> = Object.freeze({
  index: { key: 'index', title: 'Portal da Forja', fileName: 'index.html' },
  personagens: { key: 'personagens', title: 'Meus Personagens', fileName: 'personagens.html' },
  criador: { key: 'criador', title: 'Criador de Personagem', fileName: 'criador.html' },
  ficha: { key: 'ficha', title: 'Ficha do Herói', fileName: 'ficha.html', requiresCharacter: true },
  loja: { key: 'loja', title: 'Arsenal e Mercado', fileName: 'loja.html', requiresCharacter: true },
  taverna: { key: 'taverna', title: 'Taverna e Estalagem', fileName: 'taverna.html', requiresCharacter: true },
  guilda: { key: 'guilda', title: 'Guilda e Parceiros', fileName: 'guilda.html', requiresCharacter: true },
  estabulo: { key: 'estabulo', title: 'Estábulo', fileName: 'estabulo.html', requiresCharacter: true },
  oficina: { key: 'oficina', title: 'Oficina de Manufatura', fileName: 'oficina.html', requiresCharacter: true },
  engenhoca: { key: 'engenhoca', title: 'Bancada de Engenhocas', fileName: 'engenhoca.html', requiresCharacter: true },
  grimorio: { key: 'grimorio', title: 'Grimório Arcano e Divino', fileName: 'grimorio.html' },
  distincoes: { key: 'distincoes', title: 'Distinções Heroicas', fileName: 'distincoes.html' },
  recompensas: { key: 'recompensas', title: 'Gerador de Recompensas', fileName: 'recompensas.html' },
  'resgatar-recompensas': {
    key: 'resgatar-recompensas',
    title: 'Resgatar Recompensas',
    fileName: 'resgatar-recompensas.html',
    requiresCharacter: true,
  },
  mapa: { key: 'mapa', title: 'Atlas de Arton', fileName: 'mapa.html' },
  termos: { key: 'termos', title: 'Termos e Licença', fileName: 'termos.html' },
});
