/**
 * Regras puras de Recompensas e Tesouros de Tormenta 20 (Jogo do Ano).
 * Sem DOM, sem armazenamento e sem mutação de estado.
 */

export interface RiquezaEntrada {
  nome: string;
  valorBase: number;
  valor?: number;
}

export interface MaterialEspecialEntrada {
  id: string;
  nome: string;
  mod: string;
}

export interface MelhoriaComumEntrada {
  id: string;
  nome: string;
  tipo: 'arma' | 'armadura';
  desc: string;
}

export interface PocaoPadraoEntrada {
  nome: string;
  preco: number;
  circulo: number;
}

export interface NdConfiguracao {
  baseDinheiro: number;
  probDinheiro: number;
  probItem: number;
  maxMods: number;
  nivelMagico: 'nenhum' | 'menor_pocao' | 'menor' | 'medio' | 'maior';
}

export interface DivisaoTibares {
  total: number;
  jogadores: number;
  cotaPorJogador: number;
  sobra: number;
}

export interface OpcoesGerarTesouro {
  nd?: string;
  multiplicador?: 'padrao' | 'metade' | 'dobro';
  rng?: (min: number, max: number) => number;
}

export interface ResultadoTesouro {
  nd: string;
  multiplicador: string;
  rolagemDinheiroD100: number;
  rolagemItemD100: number;
  tibares: number;
  riqueza: RiquezaEntrada | null;
  itens: any[];
  totalValorEstimado: number;
}

export const NDS: readonly string[] = Object.freeze([
  '1/4',
  '1/2',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
  '13',
  '14',
  '15',
  '16',
  '17',
  '18',
  '19',
  '20',
]);

export const RIQUEZAS_MENORES: readonly RiquezaEntrada[] = Object.freeze([
  { nome: 'Gemas semipreciosas (ágatas, quartzos)', valorBase: 20 },
  { nome: 'Frasco de perfume exótico ou especiarias', valorBase: 35 },
  { nome: 'Pequena estátua esculpida em marfim ou jade', valorBase: 50 },
  { nome: 'Cálice de bronze trabalhado com filigranas', valorBase: 70 },
  { nome: 'Tapeçaria tecida em fios de seda fina', valorBase: 90 },
  { nome: 'Gemas finas (ametistas, granadas lapidadas)', valorBase: 120 },
]);

export const RIQUEZAS_MEDIAS: readonly RiquezaEntrada[] = Object.freeze([
  { nome: 'Pérolas negras de alto valor', valorBase: 250 },
  { nome: 'Conjunto de talheres cerimoniais em prata maciça', valorBase: 400 },
  { nome: 'Joia de ouro encastoada com safira', valorBase: 650 },
  { nome: 'Adorno de rubi polido de antiga linhagem', valorBase: 900 },
  { nome: 'Caixa de música mecânica em madeira nobre e ouro', valorBase: 1200 },
  { nome: 'Estatueta sagrada com incrustações de esmeralda', valorBase: 1600 },
]);

export const RIQUEZAS_MAIORES: readonly RiquezaEntrada[] = Object.freeze([
  { nome: 'Diamante bruto de pureza excepcional', valorBase: 3000 },
  { nome: 'Coroa cerimonial de ouro com esmeraldas e rubis', valorBase: 5000 },
  { nome: 'Cetro imperial trabalhado em platina e safiras', valorBase: 7500 },
  { nome: 'Colar de diamantes lendário de corte impecável', valorBase: 10000 },
  { nome: 'Orbe astrológico de cristal lapidado e mithral fundido', valorBase: 15000 },
  { nome: 'Ídolo relíquia de ouro puro e gemas imperiais ancestrais', valorBase: 25000 },
]);

const MATERIAIS_ESPECIAIS: readonly MaterialEspecialEntrada[] = [
  { id: 'aco_rubi', nome: 'Aço-rubi', mod: 'Arma: ignora 10 de RD; Armadura: RD 2/ácido' },
  { id: 'adamante', nome: 'Adamante', mod: 'Arma: aumenta passo de dano; Armadura: RD 2' },
  { id: 'gelo_eterno', nome: 'Gelo Eterno', mod: 'Arma: +1d6 frio; Armadura: resistência a fogo 5' },
  { id: 'madeira_tollon', nome: 'Madeira de Tollon', mod: 'Arma/Cajado: reduz custo de magias em 1 PM' },
  { id: 'materia_vermelha', nome: 'Matéria Vermelha', mod: 'Arma: +1 margem ou dano; Armadura: +1 Defesa' },
  { id: 'mitral', nome: 'Mitral', mod: 'Arma: margem +1; Armadura: penalidade de armadura reduzida em 2' },
];

const MELHORIAS_COMUNS: readonly MelhoriaComumEntrada[] = [
  { id: 'certeira', nome: 'Certeira', tipo: 'arma', desc: '+1 em testes de ataque' },
  { id: 'pujante', nome: 'Pujante', tipo: 'arma', desc: '+2 nas rolagens de dano' },
  { id: 'cruel', nome: 'Cruel', tipo: 'arma', desc: '+1 nas rolagens de dano' },
  { id: 'equilibrada', nome: 'Equilibrada', tipo: 'arma', desc: '+2 em manobras de combate' },
  { id: 'alongada', nome: 'Alongada', tipo: 'arma', desc: 'Aumenta a margem de ameaça em +1' },
  { id: 'reforcada', nome: 'Reforçada', tipo: 'armadura', desc: '+1 na Defesa' },
  { id: 'sob_medida', nome: 'Sob Medida', tipo: 'armadura', desc: 'Reduz a penalidade de armadura em 1' },
  { id: 'ajustada', nome: 'Ajustada', tipo: 'armadura', desc: 'Reduz a penalidade de armadura em 1' },
];

const POCOES_PADRAO: readonly PocaoPadraoEntrada[] = [
  { nome: 'Poção de Curar Ferimentos (1d8+1 PV)', preco: 30, circulo: 1 },
  { nome: 'Poção de Foco Mental (+2 em concentração)', preco: 45, circulo: 1 },
  { nome: 'Poção de Resistência a Energia (10 RD)', preco: 60, circulo: 1 },
  { nome: 'Poção de Velocidade (Ação extra)', preco: 300, circulo: 2 },
  { nome: 'Poção de Curar Ferimentos Moderados (3d8+3 PV)', preco: 270, circulo: 2 },
  { nome: 'Poção de Invisibilidade', preco: 350, circulo: 2 },
  { nome: 'Poção de Heroísmo (+2 em ataques e testes)', preco: 600, circulo: 3 },
  { nome: 'Poção de Cura Completa (Recupera todos os PV)', preco: 1500, circulo: 4 },
];

export const ND_CONFIG: Readonly<Record<string, NdConfiguracao>> = Object.freeze({
  '1/4': { baseDinheiro: 10, probDinheiro: 0.65, probItem: 0.4, maxMods: 0, nivelMagico: 'nenhum' },
  '1/2': { baseDinheiro: 25, probDinheiro: 0.7, probItem: 0.5, maxMods: 0, nivelMagico: 'nenhum' },
  '1': { baseDinheiro: 50, probDinheiro: 0.75, probItem: 0.55, maxMods: 1, nivelMagico: 'nenhum' },
  '2': { baseDinheiro: 100, probDinheiro: 0.8, probItem: 0.6, maxMods: 1, nivelMagico: 'menor_pocao' },
  '3': { baseDinheiro: 180, probDinheiro: 0.8, probItem: 0.65, maxMods: 1, nivelMagico: 'menor_pocao' },
  '4': { baseDinheiro: 300, probDinheiro: 0.85, probItem: 0.7, maxMods: 2, nivelMagico: 'menor_pocao' },
  '5': { baseDinheiro: 500, probDinheiro: 0.85, probItem: 0.75, maxMods: 2, nivelMagico: 'menor' },
  '6': { baseDinheiro: 750, probDinheiro: 0.85, probItem: 0.75, maxMods: 2, nivelMagico: 'menor' },
  '7': { baseDinheiro: 1100, probDinheiro: 0.9, probItem: 0.8, maxMods: 3, nivelMagico: 'menor' },
  '8': { baseDinheiro: 1600, probDinheiro: 0.9, probItem: 0.8, maxMods: 3, nivelMagico: 'menor' },
  '9': { baseDinheiro: 2300, probDinheiro: 0.9, probItem: 0.85, maxMods: 3, nivelMagico: 'medio' },
  '10': { baseDinheiro: 3200, probDinheiro: 0.95, probItem: 0.85, maxMods: 3, nivelMagico: 'medio' },
  '11': { baseDinheiro: 4500, probDinheiro: 0.95, probItem: 0.9, maxMods: 4, nivelMagico: 'medio' },
  '12': { baseDinheiro: 6000, probDinheiro: 0.95, probItem: 0.9, maxMods: 4, nivelMagico: 'medio' },
  '13': { baseDinheiro: 8500, probDinheiro: 0.95, probItem: 0.9, maxMods: 4, nivelMagico: 'maior' },
  '14': { baseDinheiro: 12000, probDinheiro: 0.98, probItem: 0.95, maxMods: 4, nivelMagico: 'maior' },
  '15': { baseDinheiro: 16000, probDinheiro: 0.98, probItem: 0.95, maxMods: 4, nivelMagico: 'maior' },
  '16': { baseDinheiro: 22000, probDinheiro: 0.98, probItem: 0.95, maxMods: 4, nivelMagico: 'maior' },
  '17': { baseDinheiro: 30000, probDinheiro: 1.0, probItem: 0.98, maxMods: 4, nivelMagico: 'maior' },
  '18': { baseDinheiro: 40000, probDinheiro: 1.0, probItem: 0.98, maxMods: 4, nivelMagico: 'maior' },
  '19': { baseDinheiro: 55000, probDinheiro: 1.0, probItem: 1.0, maxMods: 4, nivelMagico: 'maior' },
  '20': { baseDinheiro: 80000, probDinheiro: 1.0, probItem: 1.0, maxMods: 4, nivelMagico: 'maior' },
});

function defaultRng(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function dividirTibares(total: number, numJogadores: number): DivisaoTibares {
  const seguroTotal = Math.max(0, Math.round(Number(total) || 0));
  const qtd = Math.max(1, Math.floor(Number(numJogadores) || 1));
  const cotaPorJogador = Math.floor(seguroTotal / qtd);
  const sobra = seguroTotal - cotaPorJogador * qtd;
  return {
    total: seguroTotal,
    jogadores: qtd,
    cotaPorJogador,
    sobra,
  };
}

export function gerarTesouro(opcoes: OpcoesGerarTesouro = {}): ResultadoTesouro {
  const { nd = '1', multiplicador = 'padrao', rng = defaultRng } = opcoes;
  const config = ND_CONFIG[nd] || ND_CONFIG['1'];
  let multFator = 1.0;
  if (multiplicador === 'metade') multFator = 0.5;
  if (multiplicador === 'dobro') multFator = 2.0;

  const rolagemDinheiroD100 = rng(1, 100);
  const rolagemItemD100 = rng(1, 100);

  let tibaresDiretos = 0;
  let riquezaSorteada: RiquezaEntrada | null = null;
  const itensSorteados: any[] = [];

  const ndNum = parseFloat(nd.includes('/') ? String(1 / parseInt(nd.split('/')[1], 10)) : nd);

  if (rolagemDinheiroD100 <= config.probDinheiro * 100) {
    const variacao = rng(70, 130) / 100;
    const valorCalculado = Math.round(config.baseDinheiro * variacao * multFator);

    if (ndNum >= 1 && rng(1, 100) > 60) {
      if (ndNum >= 10) {
        const idx = rng(0, RIQUEZAS_MAIORES.length - 1);
        riquezaSorteada = { ...RIQUEZAS_MAIORES[idx] };
        riquezaSorteada.valor = Math.round(riquezaSorteada.valorBase * multFator);
      } else if (ndNum >= 4) {
        const idx = rng(0, RIQUEZAS_MEDIAS.length - 1);
        riquezaSorteada = { ...RIQUEZAS_MEDIAS[idx] };
        riquezaSorteada.valor = Math.round(riquezaSorteada.valorBase * multFator);
      } else {
        const idx = rng(0, RIQUEZAS_MENORES.length - 1);
        riquezaSorteada = { ...RIQUEZAS_MENORES[idx] };
        riquezaSorteada.valor = Math.round(riquezaSorteada.valorBase * multFator);
      }
    }
    tibaresDiretos = valorCalculado;
  }

  if (rolagemItemD100 <= config.probItem * 100) {
    const tipoItemRoll = rng(1, 100);

    if (
      config.nivelMagico === 'maior' ||
      (config.nivelMagico === 'medio' && tipoItemRoll > 70)
    ) {
      const mat = MATERIAIS_ESPECIAIS[rng(0, MATERIAIS_ESPECIAIS.length - 1)];
      const numMods = Math.min(config.maxMods, rng(2, 4));
      const melhorias: MelhoriaComumEntrada[] = [];
      for (let i = 0; i < numMods; i++) {
        const mel = MELHORIAS_COMUNS[rng(0, MELHORIAS_COMUNS.length - 1)];
        if (!melhorias.some((m) => m.id === mel.id)) melhorias.push(mel);
      }
      itensSorteados.push({
        tipo: 'superior',
        categoria: 'arma',
        nome: `Arma Superior em ${mat.nome}`,
        material: mat,
        melhorias,
        espacos: 1,
        precoAproximado: 3000 + melhorias.length * 1000,
      });
    } else if (
      config.nivelMagico === 'menor' ||
      (config.nivelMagico === 'menor_pocao' && tipoItemRoll > 50)
    ) {
      if (rng(1, 2) === 1) {
        const pocao =
          POCOES_PADRAO[rng(0, Math.min(POCOES_PADRAO.length - 1, Math.floor(ndNum / 2) + 2))];
        itensSorteados.push({
          tipo: 'pocao',
          categoria: 'consumivel',
          nome: pocao.nome,
          preco: pocao.preco,
          espacos: 0.5,
        });
      } else {
        const mel = MELHORIAS_COMUNS[rng(0, MELHORIAS_COMUNS.length - 1)];
        itensSorteados.push({
          tipo: 'superior',
          categoria: mel.tipo,
          nome: `${mel.tipo === 'arma' ? 'Espada Longa' : 'Cota de Malha'} ${mel.nome}`,
          melhorias: [mel],
          espacos: mel.tipo === 'arma' ? 1 : 2,
          precoAproximado: (mel.tipo === 'arma' ? 15 : 150) + 300,
        });
      }
    } else {
      const pocao = POCOES_PADRAO[rng(0, 2)];
      itensSorteados.push({
        tipo: 'pocao',
        categoria: 'consumivel',
        nome: pocao.nome,
        preco: pocao.preco,
        espacos: 0.5,
      });
    }
  }

  return {
    nd,
    multiplicador,
    rolagemDinheiroD100,
    rolagemItemD100,
    tibares: tibaresDiretos,
    riqueza: riquezaSorteada,
    itens: itensSorteados,
    totalValorEstimado:
      tibaresDiretos +
      (riquezaSorteada?.valor || 0) +
      itensSorteados.reduce((acc, i) => acc + (i.preco || i.precoAproximado || 0), 0),
  };
}
