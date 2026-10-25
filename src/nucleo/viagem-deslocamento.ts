/**
 * Regras Canônicas de Deslocamento e Marcha de Viagem (Tormenta 20)
 * 
 * Regra básica de marcha diária:
 * Deslocamento em metros multiplicado por 4 resulta na quilometragem percorrida por dia (8 horas de marcha).
 * 
 * Modificadores por PM:
 * Magias como Primor Atlético e Velocidade aumentam o deslocamento em passos de +3m por cada 1 PM investido.
 * Esses aumentos podem ser aplicados tanto a pé quanto aos animais de tração de veículos (carroça e carruagem).
 */

export type TipoTransporteViagem = 'pe' | 'cavalo' | 'carroca' | 'carruagem' | 'balao';

export interface OpcaoVelocidadeViagem {
  deslocamentoMetros: number;
  kmPorDia: number;
  pmInvestidos: number;
  rotulo: string;
}

/**
 * Calcula a velocidade diária em km/dia a partir do deslocamento em metros.
 */
export function calcularKmPorDia(deslocamentoMetros: number): number {
  return deslocamentoMetros * 4;
}

/**
 * Calcula os dias de viagem para um trecho terrestre dado a distância em km e a velocidade diária.
 */
export function calcularDiasViagemTerrestre(kmTotal: number, kmPorDia: number, kmDificil = 0): number {
  if (kmTotal <= 0 || kmPorDia <= 0) return 0;
  return Math.max(0.1, (kmTotal + kmDificil) / kmPorDia);
}

/**
 * Retorna as opções de deslocamento disponíveis para um transporte, considerando os PM disponíveis do personagem.
 */
export function gerarOpcoesDeslocamentoViagem(
  tipoTransporte: TipoTransporteViagem,
  pmDisponivel: number
): OpcaoVelocidadeViagem[] {
  const maxPm = Math.max(0, Math.floor(pmDisponivel));
  const opcoes: OpcaoVelocidadeViagem[] = [];

  if (tipoTransporte === 'carroca' || tipoTransporte === 'carruagem') {
    // Veículos de tração terrestre: base 9m (36 km/dia)
    opcoes.push({
      deslocamentoMetros: 9,
      kmPorDia: 36,
      pmInvestidos: 0,
      rotulo: '9m · 36 km/dia (Base)'
    });
    for (let pm = 1; pm <= maxPm; pm++) {
      const m = 9 + pm * 3;
      const km = m * 4;
      opcoes.push({
        deslocamentoMetros: m,
        kmPorDia: km,
        pmInvestidos: pm,
        rotulo: `${m}m · ${km} km/dia (+${pm * 3}m · ${pm} PM)`
      });
    }
  } else if (tipoTransporte === 'pe') {
    // Marcha a pé
    opcoes.push({ deslocamentoMetros: 4.5, kmPorDia: 18, pmInvestidos: 0, rotulo: '4,5m · 18 km/dia' });
    opcoes.push({ deslocamentoMetros: 6, kmPorDia: 24, pmInvestidos: 0, rotulo: '6m · 24 km/dia' });
    opcoes.push({ deslocamentoMetros: 7.5, kmPorDia: 30, pmInvestidos: 0, rotulo: '7,5m · 30 km/dia' });
    opcoes.push({ deslocamentoMetros: 9, kmPorDia: 36, pmInvestidos: 0, rotulo: '9m · 36 km/dia (Base)' });
    for (let pm = 1; pm <= maxPm; pm++) {
      const m = 9 + pm * 3;
      const km = m * 4;
      opcoes.push({
        deslocamentoMetros: m,
        kmPorDia: km,
        pmInvestidos: pm,
        rotulo: `${m}m · ${km} km/dia (+${pm * 3}m · ${pm} PM)`
      });
    }
  }

  return opcoes;
}
