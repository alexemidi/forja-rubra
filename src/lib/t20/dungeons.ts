/**
 * Módulo de Regras Puras de Masmorras Modulares (Tormenta20).
 */

export interface ArmadilhaMasmorra {
  id: string;
  nome: string;
  nd: number;
  cdPercepcao: number;
  cdLadinagem: number;
  gatilho: string;
  efeito: string;
  dano: string;
}

export type TipoPassagemSala =
  | 'livre'
  | 'porta_madeira'
  | 'porta_ferro_trancada'
  | 'porta_secreta'
  | 'desabamento';

export interface ConexaoSala {
  paraSalaId: number;
  tipoPassagem: TipoPassagemSala;
  cdLadinagem?: number;
  cdPercepcao?: number;
}

export interface SalaMasmorra {
  id: number;
  nome: string;
  tipo: 'entrada' | 'chefe' | 'comum';
  descricao: string;
  iluminacao: string;
  conexoes: ConexaoSala[];
  armadilha: ArmadilhaMasmorra | null;
  encontro: string | null;
  tesouro: string | null;
  isChefe: boolean;
  isEntrada: boolean;
}

export interface TemaMasmorra {
  id: string;
  nome: string;
  descricao: string;
  tiposSalas: string[];
  monstros: string[];
}

export type PorteMasmorra = 'pequena' | 'media' | 'grande' | 'epica';

export interface OpcoesGerarMasmorra {
  porte?: PorteMasmorra;
  tema?: string;
  nd?: number;
  nome?: string;
}

export interface MasmorraGerada {
  nome: string;
  temaId: string;
  temaNome: string;
  porte: PorteMasmorra;
  nd: number;
  totalSalas: number;
  descricaoGeral: string;
  salas: SalaMasmorra[];
}

export const TEMAS_MASMORRA: Readonly<Record<string, TemaMasmorra>> = Object.freeze({
  cripta_antiga: {
    id: 'cripta_antiga',
    nome: 'Cripta Antiga dos Esquecidos',
    descricao:
      'Catacumbas de pedra cinzenta sob a proteção de antigos mortos-vivos e maldições de Tenebra.',
    tiposSalas: [
      'Vestíbulo das Lamentações',
      'Corredor dos Sarcófagos',
      'Câmara de Embalsamamento',
      'Ossário Comum',
      'Jazigo dos Campeões',
      'Cripta do Sumo-Sacerdote Morto-Vivo',
    ],
    monstros: [
      'Esqueletos armados',
      'Zumbis putrefatos',
      'Ghouls famintos',
      'Múmia amaldiçoada',
      'Cavaleiro da Morte',
    ],
  },
  ruinas_goblinoides: {
    id: 'ruinas_goblinoides',
    nome: 'Ruínas da Aliança Negra',
    descricao:
      'Antiga fortaleza subterrânea em Lamnor, com passagens estreitas, fossos e armadilhas rústicas.',
    tiposSalas: [
      'Pátio de Entrada Escavado',
      'Aposentos dos Guerreiros',
      'Cocheira de Lobos Cavernários',
      'Arsenal de Lanças e Escudos',
      'Sala de Tortura',
      'Trono do Senhor da Guerra Hobgoblin',
    ],
    monstros: [
      'Goblins batedores',
      'Hobgoblins legionários',
      'Bugbears brutamontes',
      'Lobos das cavernas',
      'General hobgoblin de guerra',
    ],
  },
  caverna_megalokk: {
    id: 'caverna_megalokk',
    nome: 'Caverna Primitiva de Megalokk',
    descricao:
      'Labirinto de túneis naturais com estalactites, fungos bioluminescentes e feras territoriais.',
    tiposSalas: [
      'Fosso das Estalactites',
      'Poça de Lama Férvida',
      'Clareira de Fungos Gigantes',
      'Ninho de Ovos Monstruosos',
      'Desfiladeiro Subterrâneo',
      'Covil do Predador Alfa',
    ],
    monstros: [
      'Trolls das cavernas',
      'Aranhas gigantes venenosas',
      'Mantícoras',
      'Quimeras famintas',
      'Vorme da terra titânico',
    ],
  },
  corrupcao_tormenta: {
    id: 'corrupcao_tormenta',
    nome: 'Complexo Maculado pela Tormenta',
    descricao:
      'Masmorra viva com paredes de matéria vermelha pulsante, espirais de quitina e ar ácido.',
    tiposSalas: [
      'Fissura de Sangue Rubro',
      'Galeria dos Olhos Cegos',
      'Casulo de Transformação',
      'Câmara das Espirais Vivas',
      'Vórtice Anticriação',
      'Coração da Aberração Lefeu',
    ],
    monstros: [
      'Larvas lefeu',
      'Gafanhotos rubros',
      'Guerreiros lefeu quitinosos',
      'Mímicos da Tormenta',
      'Lorde lefeu menor',
    ],
  },
  mina_anoes: {
    id: 'mina_anoes',
    nome: 'Minas Abandonadas de Doherimm',
    descricao:
      'Poços verticais, trilhos enferrujados de vagonetes e forjas desativadas tomadas por horrores do subterrâneo.',
    tiposSalas: [
      'Galeria do Elevador de Madeira',
      'Depósito de Minério Bruto',
      'Veio de Mithral Esgotado',
      'Antiga Forja Rúnica',
      'Dormitório dos Mineiros',
      'Abismo da Escavação Profunda',
    ],
    monstros: [
      'Finntrolls do subterrâneo',
      'Gárgulas de pedra',
      'Elementais da terra despertos',
      'Anões corrompidos',
      'Golem de ferro descontrolado',
    ],
  },
  templo_sszzaas: {
    id: 'templo_sszzaas',
    nome: 'Santuário Oculto da Serpente (Sszzaas)',
    descricao:
      'Complexo de corredores simétricos cheios de dardos envenenados, passagens secretas e altares de traição.',
    tiposSalas: [
      'Entrada dos Sete Segredos',
      'Corredor dos Espelhos Falsos',
      'Tanque de Serpentes Peçonhentas',
      'Laboratório de Venenos Raros',
      'Sala dos Juramentos Traídos',
      'Altar Maior da Serpente de Jade',
    ],
    monstros: [
      'Cultistas venenosos',
      'Nagas traiçoeiras',
      'Assassinos das sombras',
      'Hidra serpentina',
      'Avatar espiritual da serpente',
    ],
  },
});

export const ARMADILHAS_CANONICAS: readonly ArmadilhaMasmorra[] = Object.freeze([
  {
    id: 'armadilha_fosso_estacas',
    nome: 'Fosso com Estacas Oculto',
    nd: 1,
    cdPercepcao: 15,
    cdLadinagem: 15,
    gatilho: 'Placa de pressão no piso (5 kg)',
    efeito: 'O chão se abre sob os pés do primeiro aventureiro.',
    dano: '2d6 de perfuração e queda de 3 metros',
  },
  {
    id: 'armadilha_dardos_venenosos',
    nome: 'Fendas de Dardos Envenenados',
    nd: 2,
    cdPercepcao: 16,
    cdLadinagem: 16,
    gatilho: 'Fio de tropeço esticado na altura do tornozelo',
    efeito: 'Dispara uma saraivada de 4 dardos na direção do corredor.',
    dano: '2d4 de perfuração mais veneno fraco (Fortitude CD 14 evita 1d6 de dano de veneno)',
  },
  {
    id: 'armadilha_lamina_pendular',
    nome: 'Lâmina Pendular do Teto',
    nd: 3,
    cdPercepcao: 18,
    cdLadinagem: 18,
    gatilho: 'Abrir porta sem desarmar a trava oculta',
    efeito: 'Lâmina semicircular de foice desce em arco cortando a passagem.',
    dano: '4d8 de corte (Reflexos CD 18 reduz à metade)',
  },
  {
    id: 'armadilha_gas_sufocante',
    nome: 'Nuvem de Gás Asfixiante',
    nd: 6,
    cdPercepcao: 21,
    cdLadinagem: 21,
    gatilho: 'Girar maçaneta do baú sem pronunciar a palavra de passe',
    efeito: 'Válvula libera fumaça verde ácida que preenche a sala por 3 rodadas.',
    dano: '6d6 de dano de veneno por rodada (Fortitude CD 21 reduz à metade)',
  },
  {
    id: 'armadilha_esfera_rolante',
    nome: 'Pedra Gigante Rolante',
    nd: 7,
    cdPercepcao: 22,
    cdLadinagem: 22,
    gatilho: 'Degrau falso em rampa descendente',
    efeito: 'Esfera maciça de granito de 3 metros de diâmetro desce esmagando tudo no corredor.',
    dano: '8d10 de impacto e derruba quem não passar em Atletismo/Reflexos CD 22',
  },
  {
    id: 'armadilha_chamas_alquimicas',
    nome: 'Gêiser de Fogo Alquímico',
    nd: 9,
    cdPercepcao: 24,
    cdLadinagem: 24,
    gatilho: 'Pisar nas lajotas com símbolos errados',
    efeito: 'Bicos de ferro no chão cospem labaredas incandescentes.',
    dano: '10d6 de fogo (Reflexos CD 24 reduz à metade)',
  },
  {
    id: 'armadilha_runa_desintegracao',
    nome: 'Glifo Rúnico de Desintegração',
    nd: 13,
    cdPercepcao: 28,
    cdLadinagem: 28,
    gatilho: 'Aproximação de criatura viva a menos de 1,5m',
    efeito: 'Feixe de energia desintegradora pura de Wynna atinge o intruso.',
    dano: '14d10 de dano de essência (Fortitude CD 28 reduz para 4d10)',
  },
  {
    id: 'armadilha_vortice_tormenta',
    nome: 'Fissura Aberta da Tormenta',
    nd: 18,
    cdPercepcao: 33,
    cdLadinagem: 33,
    gatilho: 'Tentativa de abrir a porta do tesouro final',
    efeito: 'Ruptura no tecido da realidade que suga sanidade e vitalidade.',
    dano: '20d8 de dano psíquico e perda de 4d6 PM (Vontade CD 33 reduz à metade)',
  },
]);

export const TESOUROS_POR_ND: Readonly<Record<number, string>> = Object.freeze({
  1: '1d6 x T$ 10, gemas pequenas (T$ 50), 1 poção comum (Cura Menor)',
  2: '2d6 x T$ 20, 1 arma superior com 1 melhoria ou elixir alquímico',
  3: '3d6 x T$ 30, joias (T$ 150), 2 poções comuns',
  4: '4d6 x T$ 50, item superior com 1 melhoria e T$ 300 em moedas',
  5: '1d6 x T$ 200, 1 item mágico menor (armadura +1 ou acessório menor)',
  7: '2d6 x T$ 300, 1 arma mágica menor (+1 ou com encantamento menor)',
  10: '3d6 x T$ 500, 1 item mágico médio e T$ 2.000 em ouro',
  15: '5d6 x T$ 1.000, 2 itens mágicos médios ou 1 item mágico maior',
  20: '1d4 x T$ 20.000, artefato ou 2 itens mágicos maiores de Arton',
});

function rolar(n: number, m: number): number {
  let tot = 0;
  for (let i = 0; i < n; i++) tot += Math.floor(Math.random() * m) + 1;
  return tot;
}

export function gerarMasmorra(opcoes: OpcoesGerarMasmorra = {}): MasmorraGerada {
  const porte: PorteMasmorra = opcoes.porte || 'media';
  const nd = Math.max(1, Math.min(20, Number(opcoes.nd) || 3));
  const temaKey = opcoes.tema && TEMAS_MASMORRA[opcoes.tema] ? opcoes.tema : 'cripta_antiga';
  const tema = TEMAS_MASMORRA[temaKey];

  const limitesSalas =
    {
      pequena: { min: 5, max: 8 },
      media: { min: 9, max: 15 },
      grande: { min: 16, max: 25 },
      epica: { min: 26, max: 40 },
    }[porte] || { min: 9, max: 15 };

  const totalSalas =
    Math.floor(Math.random() * (limitesSalas.max - limitesSalas.min + 1)) + limitesSalas.min;

  const armadilhasCompativeis = ARMADILHAS_CANONICAS.filter((a) => Math.abs(a.nd - nd) <= 3);
  const armadilhaPadrao =
    armadilhasCompativeis.length > 0 ? armadilhasCompativeis[0] : ARMADILHAS_CANONICAS[0];

  const salas: SalaMasmorra[] = [];

  for (let i = 1; i <= totalSalas; i++) {
    const isEntrada = i === 1;
    const isChefe = i === totalSalas;

    const nomeSala = isEntrada
      ? `Entrada: ${tema.tiposSalas[0]}`
      : isChefe
        ? `Câmara Final: ${tema.tiposSalas[tema.tiposSalas.length - 1]}`
        : `${tema.tiposSalas[((i - 2) % (tema.tiposSalas.length - 2)) + 1]} (${i})`;

    let armadilha: ArmadilhaMasmorra | null = null;
    if (!isEntrada && Math.random() < 0.35) {
      armadilha =
        armadilhasCompativeis[Math.floor(Math.random() * armadilhasCompativeis.length)] ||
        armadilhaPadrao;
    }

    let encontro: string | null = null;
    if (!isEntrada) {
      if (isChefe) {
        encontro = `Chefe da Masmorra: ${tema.monstros[tema.monstros.length - 1]} (ND ${nd + 2}) acompanhado por 2 lacaios`;
      } else if (Math.random() < 0.6) {
        const monstro = tema.monstros[Math.floor(Math.random() * (tema.monstros.length - 1))];
        encontro = `Guarnição: ${rolar(1, 4)}x ${monstro} (ND aproximado ${nd})`;
      }
    }

    let tesouro: string | null = null;
    if (isChefe) {
      const ndChave = [20, 15, 10, 7, 5, 4, 3, 2, 1].find((k) => nd >= k) || 1;
      tesouro = `Tesouro do Chefe: ${TESOUROS_POR_ND[ndChave]}`;
    } else if (Math.random() < 0.3) {
      tesouro = `Baú Oculto: ${rolar(2, 6) * 10 * nd} T$ e suprimentos de viagem`;
    }

    const iluminacao = isEntrada
      ? 'Luz natural fraca vinda da entrada'
      : Math.random() < 0.4
        ? 'Tochas acesas em arandelas de ferro'
        : 'Escuridão total';

    salas.push({
      id: i,
      nome: nomeSala,
      tipo: isEntrada ? 'entrada' : isChefe ? 'chefe' : 'comum',
      descricao: `Sala esculpida em rocha com ${rolar(4, 4)}x${rolar(4, 4)} metros de área. ${tema.descricao}`,
      iluminacao,
      conexoes: [],
      armadilha,
      encontro,
      tesouro,
      isChefe,
      isEntrada,
    });
  }

  for (let i = 0; i < salas.length - 1; i++) {
    const atual = salas[i];
    const proxima = salas[i + 1];

    const r = Math.random();
    let tipoPassagem: TipoPassagemSala = 'porta_madeira';
    let cdLadinagem: number | undefined;
    let cdPercepcao: number | undefined;

    if (r < 0.3) {
      tipoPassagem = 'livre';
    } else if (r < 0.65) {
      tipoPassagem = 'porta_madeira';
    } else if (r < 0.85) {
      tipoPassagem = 'porta_ferro_trancada';
      cdLadinagem = 15 + Math.floor(nd / 2);
    } else {
      tipoPassagem = 'porta_secreta';
      cdPercepcao = 18 + Math.floor(nd / 2);
    }

    atual.conexoes.push({
      paraSalaId: proxima.id,
      tipoPassagem,
      cdLadinagem,
      cdPercepcao,
    });

    proxima.conexoes.push({
      paraSalaId: atual.id,
      tipoPassagem,
      cdLadinagem,
      cdPercepcao,
    });
  }

  const conexoesExtras = Math.min(3, Math.floor(salas.length / 4));
  for (let c = 0; c < conexoesExtras; c++) {
    const idxA = Math.floor(Math.random() * (salas.length - 2)) + 1;
    const idxB = Math.min(salas.length - 1, idxA + 2);
    if (idxA !== idxB && !salas[idxA].conexoes.some((con) => con.paraSalaId === salas[idxB].id)) {
      salas[idxA].conexoes.push({
        paraSalaId: salas[idxB].id,
        tipoPassagem: 'porta_secreta',
        cdPercepcao: 20 + nd,
      });
      salas[idxB].conexoes.push({
        paraSalaId: salas[idxA].id,
        tipoPassagem: 'porta_secreta',
        cdPercepcao: 20 + nd,
      });
    }
  }

  return {
    nome: opcoes.nome || `${tema.nome} (ND ${nd})`,
    temaId: tema.id,
    temaNome: tema.nome,
    porte,
    nd,
    totalSalas: salas.length,
    descricaoGeral: tema.descricao,
    salas,
  };
}
