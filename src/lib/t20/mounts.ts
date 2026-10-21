/**
 * Regras puras de Montarias, Tamanho de Criatura e Equipamentos Animais (Tormenta 20).
 */

import type { PenalidadesMontaria } from '../../interfaces/companions.ts';

const key = (s: string): string =>
  String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_');

export function especieMontaria(nome: string): string {
  const n = key(nome);
  return (
    [
      'cao_de_caca',
      'lobo_das_cavernas',
      'cavalo',
      'ponei',
      'lobo',
      'grifo',
      'gorlogg',
      'trobo',
    ].find((e) => n.includes(e)) || ''
  );
}

export function tamanhosMontaria(especie: string): string[] {
  return especie === 'cao_de_caca'
    ? ['Pequeno', 'Médio']
    : ['ponei', 'lobo'].includes(especie)
      ? ['Médio']
      : especie
        ? ['Grande']
        : [];
}

export function podeMontar(
  heroi: string,
  montaria: string,
  especie: string,
  patamar: string
): boolean {
  const ordem = ['minusculo', 'pequeno', 'medio', 'grande', 'enorme', 'colossal'];
  const h = ordem.indexOf(key(heroi));
  const m = ordem.indexOf(key(montaria));
  return h >= 0 && m > h && !(especie === 'grifo' && patamar === 'iniciante');
}

export function tipoEquipamentoAnimal(id: string): string {
  const k = key(id);
  return (
    [
      'sela',
      'alforje',
      'arreios_namalkahnianos',
      'armadura_de_montaria_leve',
      'armadura_de_montaria_pesada',
      'caparazao',
      'estribos',
      'ornamento',
    ].find((entry) => k === entry) || ''
  );
}

export function validarEquipamentoMontaria(
  equipamentos: readonly string[],
  novo: string,
  voadora: boolean
): string {
  if (equipamentos.length >= 2) return 'A montaria já usa dois itens vestidos.';
  if (equipamentos.includes(novo)) {
    return 'Este tipo de item já está equipado na montaria.';
  }
  if (
    novo.startsWith('armadura_de_montaria') &&
    equipamentos.some((e) => e.startsWith('armadura_de_montaria'))
  ) {
    return 'A montaria já veste uma armadura.';
  }
  if (novo === 'alforje' && !equipamentos.includes('sela')) {
    return 'Equipe uma sela antes do alforje.';
  }
  if (novo === 'armadura_de_montaria_pesada' && voadora) {
    return 'Montarias voadoras não podem usar armadura pesada.';
  }
  return '';
}

export function penalidadesMontaria(
  sela: boolean,
  ginete: boolean
): PenalidadesMontaria {
  return {
    cavalgar: sela ? 0 : -5,
    ataqueDistancia: ginete ? 0 : -2,
    magiaCondicaoRuim: !ginete,
  };
}

export function bonusArmaduraMontaria(equipamentos: readonly string[]): number {
  return equipamentos.includes('armadura_de_montaria_pesada')
    ? 2
    : equipamentos.includes('armadura_de_montaria_leve')
      ? 1
      : 0;
}
