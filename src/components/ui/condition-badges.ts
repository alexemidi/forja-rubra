/**
 * Ícones vetoriais SVG de condições de Tormenta 20 (sem emojis).
 */

const traco = (d: string): string =>
  `<path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="${d}"/>`;

const ponto = (x: number, y: number, r: number): string =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="currentColor" stroke="none"/>`;

const DESENHOS_CONDICOES: Record<string, string> = Object.freeze({
  abalado:
    '<circle cx="12" cy="7.5" r="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
    traco('M7 21v-4.5c0-1.8 1.4-3 3-3.5 M17 21v-4.5c0-1.8-1.4-3-3-3.5 M7 16.5l3.5-2 1.5 1 1.5-1 3.5 2') +
    traco('M4 14c-.6.7-.6 1.8 0 2.5s.6 1.8 0 2.5 M20 14c.6.7.6 1.8 0 2.5s-.6 1.8 0 2.5') +
    traco('M5 5v3 M5 10v.1 M19 5v3 M19 10v.1'),
  agarrado:
    '<circle cx="12" cy="11.5" r="2.6" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
    traco('M7 21v-3c0-2 2.2-3.5 5-3.5s5 1.5 5 3.5v3') +
    traco('M3 2v4.5c0 1.2.8 2 2 2h1 M3 6h3 M6 2v4 M8 2v4.5') +
    traco('M21 2v4.5c0 1.2-.8 2-2 2h-1 M21 6h-3 M18 2v4 M16 2v4.5'),
  alquebrado:
    '<circle cx="18" cy="8" r="2.2" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
    traco('M18 10.5c-2 0-4 1-5 3l-3 4H5 M14 13.5l-2.5 5.5 M10 21h-5l-2-2') +
    traco('M10 2L6 9h4l-2 7'),
  apavorado:
    '<circle cx="12" cy="11" r="3" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
    traco('M6 21v-4.5l2.5-4 2-1 M18 21v-4.5l-2.5-4-2-1') +
    traco('M3 13c-.6.7-.6 1.8 0 2.5s.6 1.8 0 2.5 M21 13c.6.7.6 1.8 0 2.5s-.6 1.8 0 2.5') +
    traco('M8 3v2.5 M8 7.5v.1 M12 2v3 M12 7v.1 M16 3v2.5 M16 7.5v.1'),
  atordoado:
    '<circle cx="12" cy="13" r="2.8" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
    traco('M7 21v-2a5 5 0 0110 0v2 M16 18l1.5-4-3-1') +
    traco('M5 7.5c2-2.5 12-2.5 14 0s-12 2.5-14 0') +
    traco('M6 3.5l.5 1 1 .5-1 .5-.5 1-.5-1-1-.5 1-.5z M18 3.5l.5 1 1 .5-1 .5-.5 1-.5-1-1-.5 1-.5z') +
    traco('M12 3a1.5 1.5 0 011.5 1.5c0 1-1 1.5-1.5 1.5'),
  caido:
    traco('M18 3v7m-2.5-2.5L18 10l2.5-2.5') +
    traco('M2 21h20') +
    '<circle cx="6" cy="16.5" r="2.2" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
    traco('M8.5 17.5h5l3.5 2 M10 16l3-2h4l2 3.5'),
  cego:
    traco('M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z') +
    '<circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
    traco('M3 3l18 18'),
  confuso:
    '<circle cx="11" cy="13.5" r="3.2" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
    traco('M6 21v-2c0-2.5 2-4 5-4s5 1.5 5 4v2') +
    traco('M6 18l2-5 3-1') +
    traco('M11 12a1.2 1.2 0 011.2 1.2c0 .8-.8 1.2-1.2 1.2') +
    traco('M18 5a2 2 0 012 2c0 1.2-1.5 1.8-1.5 2.5 M18.5 11.5v.1'),
  debilitado:
    traco('M10 2v5m-1.5-1.5L10 7l1.5-1.5 M14 2v5m-1.5-1.5L14 7l1.5-1.5 M18 3v5m-1.5-1.5L18 8l1.5-1.5') +
    '<circle cx="6" cy="16" r="2.2" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
    traco('M6 18.5c1.5-2.5 4.5-4 8-3l3 3 M14 15.5l-1.5 5.5 M17 18.5l2 2.5'),
  desprevenido:
    '<circle cx="10" cy="9" r="2.6" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
    traco('M5 21v-3.5c0-2.2 2-3.5 5-3.5 M9 14l2 1') +
    traco('M4 4a1.8 1.8 0 012 1.8c0 1.2-1.5 1.5-1.5 2.2 M4.5 10v.1') +
    traco('M15 11l4-2v4.5c0 3-2 5-4 6z') +
    traco('M21 5l-6 6 M20 5h-4v4'),
  doente:
    traco('M4 3h2v10.5a2.5 2.5 0 11-2 0V3z M4 6h2 M4 9h2') +
    '<circle cx="5" cy="16" r="1" fill="currentColor"/>' +
    '<circle cx="15" cy="8" r="2.4" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
    traco('M12 21v-4c0-2 2-3 4-3 M15 11l-3 2 1.5 1') +
    traco('M19 4c1 0 2 1 2 2 M18 9c1.5 0 2 1 2 2') +
    ponto(21, 13, 1),
  em_chamas:
    traco('M12 2c1.5 3 6 5.5 6 11.5a6 6 0 01-12 0c0-3.5 3.5-6.5 4.5-9.5 1 2 2.5 3 3.5 3.5-.5-2.5-1.5-4.5-2-5.5z') +
    traco('M12 12c1.2 1.5 2 2.5 2 4.5a2 2 0 01-4 0c0-1.5 1-2.5 2-4.5z'),
  enfeiticado:
    '<circle cx="12" cy="7.5" r="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
    traco('M7 21v-4a4 4 0 017-2.5 M7 16l3-2 2 1') +
    traco('M12 18s-2.5-1.8-2.5-3.2a1.4 1.4 0 012.5-.8 1.4 1.4 0 012.5.8c0 1.4-2.5 3.2-2.5 3.2z') +
    traco('M4.5 8s-1.2-.8-1.2-1.5a.7.7 0 011.2-.4.7.7 0 011.2.4c0 .7-1.2 1.5-1.2 1.5z') +
    traco('M19.5 7s-1.2-.8-1.2-1.5a.7.7 0 011.2-.4.7.7 0 011.2.4c0 .7-1.2 1.5-1.2 1.5z'),
  enjoado:
    '<circle cx="12" cy="7.5" r="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
    traco('M10.5 8.5q1.5-1 3 0') +
    traco('M6 21v-5a4 4 0 014-3h4a4 4 0 014 3v5 M7 16.5l4 1 M17 16.5l-4 1') +
    traco('M3 14c-.7.7-.7 1.8 0 2.5s.7 1.8 0 2.5 M21 14c.7.7.7 1.8 0 2.5s-.7 1.8 0 2.5'),
  enredado:
    traco('M2 6q10 3 20-1 M2 12q10-4 20 1 M2 18q10 3 20-1 M6 2q3 10-1 20 M12 2q-4 10 1 20 M18 2q3 10-2 20 M3 4l18 16 M21 4L3 20') +
    ponto(12, 12, 1.4) + ponto(7, 8, 1) + ponto(17, 16, 1),
  envenenado:
    traco('M3 6l12 12 M15 6L3 18 M2 5a1 1 0 012 0 M14 5a1 1 0 012 0 M2 19a1 1 0 012 0 M14 19a1 1 0 012 0') +
    traco('M5 9a4 4 0 018 0c0 2-1 3-1 4h-6c0-1-1-2-1-4z M6 15h4v1.5H6z') +
    ponto(7.5, 9, 0.9) + ponto(10.5, 9, 0.9) +
    traco('M17 12h4 M18 12v2l-2 4a2 2 0 002 3h4a2 2 0 002-3l-2-4v-2') +
    ponto(20, 18, 1.2),
  esmorecido:
    traco('M8 3h8v4H8z M16 4.5h1.5v1H16 M10 4.5v1') +
    '<circle cx="12" cy="11.5" r="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
    traco('M12 14c-2 1-4 3-4 6v1 M12 14c2 1 4 3 4 6v1 M10 18l2 3 M14 18l-2 3'),
  exausto:
    '<circle cx="10" cy="8.5" r="2.4" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
    traco('M10 11c-1 2-2 4-2 7v3 M10 13.5l-3 4 M9 18l-2 3') +
    traco('M15 16h5l2 5h-9z M16 16v-2a1.5 1.5 0 013 0v2'),
  fascinado:
    '<circle cx="12" cy="9" r="2.5" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
    traco('M7 21v-4a4 4 0 018 0v4 M7 15l-3-4 2-1 M17 15l3-4-2-1') +
    traco('M5 4l.5 1 1 .5-1 .5-.5 1-.5-1-1-.5 1-.5z M19 4l.5 1 1 .5-1 .5-.5 1-.5-1-1-.5 1-.5z M12 2l.4.8.8.4-.8.4-.4.8-.4-.8-.8-.4.8-.4z'),
  fraco:
    traco('M4 19v-4a3 3 0 013-3h3l2-3 3 1-1 4-3 2v3') +
    traco('M12 17h5v3h-5z M17 18h1v1h-1') +
    traco('M19 13v6m-2-2l2 2 2-2'),
  fatigado:
    '<circle cx="10" cy="9" r="2.3" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
    traco('M10 11.3c-2 2-3 4-3 7h7 M8 15l3-2v3') +
    traco('M15 4h2.5l-2.5 3h2.5 M17 8h2l-2 2h2') +
    traco('M7 4v2 M7 7.5v.1 M9 4v2 M9 7.5v.1'),
  frustrado:
    traco('M6 13c-2.2 0-4-1.8-4-4 0-2 1.5-3.6 3.5-3.9A5 5 0 0115 4a4.5 4.5 0 014.5 4.5c0 .5-.1 1-.3 1.5A3.5 3.5 0 0118 13H6z') +
    traco('M12 13l-3 4h4l-2 5'),
  imovel:
    '<circle cx="12" cy="5" r="1.8" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
    traco('M12 7v11 M8 9h8 M4 14c0 4.5 4 7 8 7s8-2.5 8-7 M4 14l-1.5-1.5 M20 14l1.5-1.5') +
    traco('M6 19h12 M8 19a1.5 1 0 103 0 M13 19a1.5 1 0 103 0'),
  inconsciente:
    '<circle cx="7" cy="15" r="3" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
    traco('M9 16c2-1 5-1 8 0l4 2 M10 18h11') +
    traco('M14 6h3l-3 3h3 M17 10h2.5l-2.5 2.5h2.5 M19 13h2l-2 2h2'),
  indefeso:
    traco('M12 3L5 6v6c0 5 3.5 8 7 9.5 M12 3l7 3v6c0 5-3.5 8-7 9.5') +
    traco('M10 6l-2 4 4 3-3 4 2 3 M4 11h3 M17 11h3'),
  lento:
    traco('M10 13a4.5 4.5 0 104.5 4.5 M10 13a2.5 2.5 0 102.5 2.5') +
    traco('M3 19c2 0 5-1 9-1h6a3 3 0 003-3c0-1.5-1-2.5-2.5-2.5l-1.5 2') +
    traco('M18 12.5l2-3 M19 12.5l2-2.5') +
    ponto(20.5, 9.5, 0.7) + ponto(21.5, 10, 0.7),
  ofuscado:
    traco('M8 7a5 5 0 018 0 M12 1v2 M6 3l1.5 1.5 M18 3l-1.5 1.5 M3 7h2 M21 7h-2') +
    '<circle cx="12" cy="13" r="2.8" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
    traco('M8 15l4-3 4 1 M8 21v-3 M16 21v-3'),
  paralisado:
    '<circle cx="12" cy="5" r="2" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
    traco('M12 7v10 M8 11h8 M9 21l3-4 3 4') +
    traco('M4 9l3 2-2 3 3 2 M20 9l-3 2 2 3-3 2'),
  pasmo:
    traco('M8 11c0-3 2-5 4-5s4 2 4 5c0 4-1 6-4 6s-4-2-4-6z') +
    ponto(10, 9.5, 0.8) + ponto(14, 9.5, 0.8) +
    traco('M12 13a1.2 1.8 0 100 3.6 1.2 1.8 0 100-3.6z') +
    traco('M6 14c0-2 1-4 2-5 M18 14c0-2-1-4-2-5 M6 14l2 7 M18 14l-2 7') +
    traco('M7 3l1 2 M17 3l-1 2 M12 2v2 M5 5v2.5 M5 9v.1'),
  petrificado:
    '<circle cx="12" cy="6" r="2.3" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
    traco('M9 20v-8a3 3 0 016 0v8 M12 9l-1 3 2 2-1 3 M11 12l2 1') +
    traco('M4 21l3-7 3 7z M6 21l2-4 2 4z M14 21l3-7 3 7z M16 21l2-4 2 4z'),
  sangrando:
    traco('M12 4c0 0-4 5.5-4 9a4 4 0 008 0c0-3.5-4-9-4-9z') +
    traco('M6 11c0 0-2 2.5-2 4.5a2 2 0 004 0c0-2-2-4.5-2-4.5z') +
    traco('M18 11c0 0-2 2.5-2 4.5a2 2 0 004 0c0-2-2-4.5-2-4.5z'),
  sobrecarregado:
    '<circle cx="18" cy="9" r="2" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
    traco('M14 21l2-4 2 4 M16 17l-3-4 M15 13l3 2') +
    traco('M7 6c-2.5 0-4.5 2-4.5 5 0 4 3 6.5 7 7 3 .4 5-1.5 5.5-4 .6-3-1.5-6-4-7.5l-4-.5z'),
  surdo:
    traco('M8 12c0-4 2.5-7 6-7 3 0 4.5 2 4.5 4.5 0 3-2.5 5-2.5 7.5 0 1.5-1 2-2 2-1.5 0-2-1-2-2 M12 11c0-2 1-3 2-3s1 .5 1 1.5-1 2-1 3') +
    traco('M4 4l16 16'),
  surpreendido:
    traco('M9 8v5 M9 15.5v.1 M12 7v6 M12 15.5v.1 M15 8v5 M15 15.5v.1') +
    traco('M12 2v2 M12 20v2 M4 7l2 1 M18 8l2-1 M4 17l2-1 M18 16l2 1 M7 3l1 2 M17 3l-1 2'),
  vulneravel:
    traco('M12 3L5 6v6c0 5 3.5 8 7 9.5 3.5-1.5 7-4.5 7-9.5V6z') +
    traco('M12 7l-2 3 3 3-2 3 1 2') +
    traco('M19 2l-6 6 M18 2h-4v4'),
  amarrado:
    traco('M4 8q8 3 16 0M4 12q8 3 16 0M4 16q8 3 16 0M9 6v12M15 6v12'),
});

export function tracosCondicao(id: string): string {
  const key = String(id || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\s-]/g, '_');
  return (
    DESENHOS_CONDICOES[key] ||
    traco('M12 3a9 9 0 100 18 9 9 0 000-18M9 9q3-3 5 0t-2 4m0 4h.1')
  );
}
