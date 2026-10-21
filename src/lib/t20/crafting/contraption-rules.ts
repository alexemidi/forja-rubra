/**
 * Regras puras de Engenhocas (Inventor) de Tormenta 20 (Jogo do Ano).
 * Inclui cálculo de círculos, custos, CDs, aparatos, espaços, nomenclatura e coerência de acoplamento.
 */

export type FormaEngenhoca = 'empunhada' | 'vestida';

export interface OpcoesFormaEngenhoca {
  sugestoes: string[];
  descricoes: string[];
}

export interface ResultadoOpcoesEngenhoca {
  formaRecomendada: FormaEngenhoca;
  sugestoes: string[];
  descricoes: string[];
  opcoesPorForma: {
    empunhada: OpcoesFormaEngenhoca;
    vestida: OpcoesFormaEngenhoca;
  };
}

export interface ClassificacaoEfeitoMagia {
  categoria: string;
  label: string;
  permitidos: string;
  tiposValidos: string[];
}

export interface ResultadoCoerenciaMagiaItem {
  compativel: boolean;
  motivo?: string;
  classInfo: ClassificacaoEfeitoMagia;
}

export function circuloMaximoEngenhoca(nivelPersonagem: number): number {
  const n = Math.max(1, Number(nivelPersonagem) || 1);
  if (n < 6) return 1;
  if (n < 10) return 2;
  if (n < 14) return 3;
  if (n < 18) return 4;
  return 5;
}

export function custoFabricacaoEngenhoca(custoPm: number): number {
  return 100 * Math.max(1, Number(custoPm) || 1);
}

export function cdFabricacaoEngenhoca(custoPm: number): number {
  return 20 + Math.max(1, Number(custoPm) || 1);
}

export function cdAtivacaoEngenhoca(custoPm: number): number {
  return 15 + Math.max(1, Number(custoPm) || 1);
}

export function calcularBonusCdAparatos(
  numAparatos: number,
  hasPersonalizado = false,
): number {
  const qtd = Math.max(0, Math.min(2, Number(numAparatos) || 0));
  if (qtd === 0) return 0;
  if (hasPersonalizado) {
    return qtd === 1 ? 0 : 3;
  }
  return qtd === 1 ? 2 : 5;
}

export function limiteMelhoriasEngenhoca(item: any): number {
  if (!item) return 0;
  const isEng = Boolean(
    item.isEngenhoca ||
      item.contraptionId ||
      item.tipo === 'engenhoca' ||
      item.categoriaId === 'engenhoca' ||
      item.engenhocaInfo,
  );
  if (!isEng) return 4;
  const info = item.engenhocaInfo || item;
  if (!info.attachedItem && !item.attachedItem) return 0;
  const apparatus: any[] = Array.isArray(info.apparatuses)
    ? info.apparatuses
    : Array.isArray(info.aparatos)
      ? info.aparatos
      : Array.isArray(info.apparatus)
        ? info.apparatus
        : Array.isArray(item.apparatuses)
          ? item.apparatuses
          : Array.isArray(item.aparatos)
            ? item.aparatos
            : Array.isArray(item.apparatus)
              ? item.apparatus
              : [];
  const count = apparatus.filter((a) => {
    const id = typeof a === 'string' ? a : a?.id || '';
    return id === 'espera_para_melhorias' || id.includes('espera');
  }).length;
  return Math.min(2, count);
}

export function calcularEspacosEngenhoca(
  attachedItem: any,
  fallbackEspacos: number | null = null,
): number {
  if (attachedItem) {
    const itemEsp = attachedItem.espacos != null ? Number(attachedItem.espacos) : 0;
    return (Number.isFinite(itemEsp) ? itemEsp : 0) + 1;
  }
  return fallbackEspacos != null && Number.isFinite(Number(fallbackEspacos))
    ? Number(fallbackEspacos)
    : 1;
}

export const SUGESTOES_NOMES_ENGENHOCAS: Record<string, string> = Object.freeze({
  'bola-de-fogo': 'Canhão Pirotécnico',
  relampago: 'Arma de Raios',
  'armadura-arcana': 'Casaco Blindado',
  'curar-ferimentos': 'Injetor de Alívio',
  'conjurar-monstro': 'Guarda-costas Mecânico',
  'criar-ilusao': 'Projetor de Imagens',
  'montaria-arcana': 'Veículo a Vapor',
  'toque-chocante': 'Manopla Chocante',
  'arma-magica': 'Luva do Estrategista',
  'adaga-mental': 'Emissor Psíquico',
  'escudo-da-fe': 'Defletor Cinético',
  'abencoar-alimentos': 'Purificador Térmico',
  luz: 'Lanterna Arcana',
  sono: 'Dispersor de Gás Sedativo',
  'queda-suave': 'Paraquedas Autônomo',
  salto: 'Botas Pneumáticas',
  invisibilidade: 'Manto Refratário',
  velocidade: 'Acelerador Temporal',
  voo: 'Mochila a Jato',
  'explosao-de-chamas': 'Lança-chamas Portátil',
  'seta-infalivel-de-talude': 'Disparador de Microprojéteis',
});

export function formatarNomeEngenhocaAcoplada(
  itemNome: string,
  contraptionName: string,
): string {
  if (!itemNome) return contraptionName || 'Engenhoca';
  if (!contraptionName) return itemNome;

  const cleanContraption = String(contraptionName).replace(/^.*?:\s*/, '').trim();

  const words = itemNome.trim().split(/\s+/);
  let baseItemWord = words[0];
  baseItemWord =
    baseItemWord.charAt(0).toUpperCase() + baseItemWord.slice(1).toLowerCase();

  const femWords = new Set([
    'adaga',
    'espada',
    'maca',
    'maça',
    'armadura',
    'camisa',
    'capa',
    'cota',
    'couraça',
    'manopla',
    'foice',
    'alabarda',
    'pistola',
    'funda',
    'lanca',
    'lança',
    'varinha',
    'tunica',
    'túnica',
    'vestimenta',
    'botas',
    'luvas',
    'faixa',
    'tiara',
    'brunea',
    'brúnea',
    'veste',
    'corrente',
  ]);
  const lowerItemWord = baseItemWord.toLowerCase();
  const isFeminino =
    femWords.has(lowerItemWord) ||
    (lowerItemWord.endsWith('a') && !['dia', 'mapa', 'guia'].includes(lowerItemWord));

  const prepMatch = cleanContraption.match(/^(\S+)\s+(de|da|do|dos|das)\s+(.+)$/i);
  if (prepMatch) {
    const prep = prepMatch[2].toLowerCase();
    const resto = prepMatch[3];
    return `${baseItemWord} ${prep} ${resto}`;
  }

  const parts = cleanContraption.split(/\s+/);
  if (parts.length >= 2) {
    const firstLower = parts[0].toLowerCase();
    const redundantSubsts = new Set([
      'agulha',
      'lamina',
      'lâmina',
      'bastao',
      'bastão',
      'manopla',
      'haste',
      'varinha',
      'arco',
      'fuzil',
      'mosquete',
      'chicote',
      'manto',
      'casaco',
      'colete',
      'peitoral',
      'couraca',
      'couraça',
      'cota',
      'brunea',
      'brúnea',
      'armadura',
      'elmo',
      'tiara',
      'colar',
      'anel',
      'cinto',
      'arnes',
      'arnês',
    ]);

    const flexAdjetivo = (word: string): string => {
      if (!isFeminino) return word;
      if (/or$/i.test(word)) return word + 'a';
      if (/ico$/i.test(word)) return word.slice(0, -3) + 'ica';
      if (/vel$/i.test(word)) return word;
      if (/os$/i.test(word)) return word;
      if (/o$/i.test(word)) return word.slice(0, -1) + 'a';
      return word;
    };

    if (redundantSubsts.has(firstLower)) {
      const adjs = parts.slice(1).map(flexAdjetivo);
      return `${baseItemWord} ${adjs.join(' ')}`;
    }

    const adjetivos = parts.map(flexAdjetivo);
    return `${baseItemWord} ${adjetivos.join(' ')}`;
  }

  return `${baseItemWord} ${cleanContraption}`;
}

export function sugerirNomeEngenhoca(
  spellOrNome: any,
  formaOuId?: string,
): string {
  let id = '';
  let nome = '';
  if (spellOrNome && typeof spellOrNome === 'object') {
    id = String(spellOrNome.id || spellOrNome.key || '')
      .toLowerCase()
      .replace(/_/g, '-');
    nome = String(spellOrNome.nome || spellOrNome.name || '').toLowerCase();
  } else {
    nome = String(spellOrNome || '').toLowerCase();
    id = String(formaOuId || '').toLowerCase().replace(/_/g, '-');
  }
  const g = globalThis as any;
  if (g.DATA && Array.isArray(g.DATA.contraptionsCatalog)) {
    const found = g.DATA.contraptionsCatalog.find(
      (c: any) => c.id === id || String(c.name || '').toLowerCase() === nome,
    );
    if (found && found.contraptions?.length) return found.contraptions[0];
  }
  if (id && SUGESTOES_NOMES_ENGENHOCAS[id]) return SUGESTOES_NOMES_ENGENHOCAS[id];
  for (const [k, v] of Object.entries(SUGESTOES_NOMES_ENGENHOCAS)) {
    if (nome.includes(k.replace(/-/g, ' '))) return v;
  }
  const cleanNome =
    spellOrNome && typeof spellOrNome === 'object'
      ? spellOrNome.nome || spellOrNome.name || 'Magia'
      : spellOrNome || 'Magia';
  return 'Aparato de ' + cleanNome;
}

const LEXICO_ENGENHOCAS: Record<
  string,
  {
    empunhados: Array<{ substantivo: string; fem: boolean }>;
    vestidos: Array<{ substantivo: string; fem: boolean }>;
    adjetivos: Array<{ m: string; f: string }>;
    descricoesEmp: string[];
    descricoesVest: string[];
  }
> = {
  fogo: {
    empunhados: [
      { substantivo: 'Canhão', fem: false },
      { substantivo: 'Disparador', fem: false },
      { substantivo: 'Lança-Chamas', fem: false },
      { substantivo: 'Manopla', fem: true },
      { substantivo: 'Projetor', fem: false },
    ],
    vestidos: [
      { substantivo: 'Manto', fem: false },
      { substantivo: 'Colete', fem: false },
      { substantivo: 'Couraça', fem: true },
      { substantivo: 'Arnês', fem: false },
      { substantivo: 'Peitoral', fem: false },
    ],
    adjetivos: [
      { m: 'Ígneo', f: 'Ígnea' },
      { m: 'Fagulhante', f: 'Fagulhante' },
      { m: 'Térmico', f: 'Térmica' },
      { m: 'Incandescente', f: 'Incandescente' },
      { m: 'Vulcânico', f: 'Vulcânica' },
      { m: 'Calcinante', f: 'Calcinante' },
      { m: 'Comburente', f: 'Comburente' },
      { m: 'Pirotécnico', f: 'Pirotécnica' },
    ],
    descricoesEmp: [
      'Dispositivo portátil de latão com câmara de queima e bocais reguláveis que projetam rajadas concentradas de calor extremo.',
      'Mecanismo pressurizado com serpentinas térmicas e pederneiras giratórias que expelem labaredas controladas sob pressão.',
      'Aparato tubular com cilindros de nafta destilada e ignição piezoelétrica para queima imediata de alvos.',
    ],
    descricoesVest: [
      'Vestimenta reforçada com camadas de amianto e filamentos cerâmicos térmicos que concentram ondas de calor ao redor do usuário.',
      'Colete couraçado com microcaldeiras dorsais que canalizam e irradiam calor intenso em resposta aos movimentos do usuário.',
      'Peitoral laminado com isolamento térmico e válvulas de escape para projetar anéis de chamas protetores.',
    ],
  },
  eletricidade: {
    empunhados: [
      { substantivo: 'Emissor', fem: false },
      { substantivo: 'Bastão', fem: false },
      { substantivo: 'Condutor', fem: false },
      { substantivo: 'Manopla', fem: true },
      { substantivo: 'Disparador', fem: false },
    ],
    vestidos: [
      { substantivo: 'Colete', fem: false },
      { substantivo: 'Manto', fem: false },
      { substantivo: 'Peitoral', fem: false },
      { substantivo: 'Braçadeira', fem: true },
      { substantivo: 'Arnês', fem: false },
    ],
    adjetivos: [
      { m: 'Galvânico', f: 'Galvânica' },
      { m: 'Trovejante', f: 'Trovejante' },
      { m: 'Voltáico', f: 'Voltáica' },
      { m: 'Centelhante', f: 'Centelhante' },
      { m: 'Iônico', f: 'Iônica' },
      { m: 'Fúlgido', f: 'Fúlgida' },
      { m: 'Elétrico', f: 'Elétrica' },
      { m: 'Magnético', f: 'Magnética' },
    ],
    descricoesEmp: [
      'Instrumento com bobinas de cobre e eletrodos de zinco que acumula carga estática antes de disparar arcos elétricos devastadores.',
      'Haste metálica com núcleo de âmbar e discos oscilantes que descarrega relâmpagos contínuos por indução galvânica.',
      'Disparador com acumuladores de alta voltagem e pontas condutoras que canalizam faíscas perfurantes.',
    ],
    descricoesVest: [
      'Indumentária com fiação condutora entrelaçada e dissipadores cerâmicos que acumulam energia eletrostática cinética.',
      'Armadura com bobinas em espiral no torso que armazenam relâmpagos e os descarregam ao menor comando físico.',
      'Peitoral imantado com placas de cobre e acumuladores que neutralizam atrito e desferem descargas fulgurantes.',
    ],
  },
  psiquico: {
    empunhados: [
      { substantivo: 'Emissor', fem: false },
      { substantivo: 'Disparador', fem: false },
      { substantivo: 'Injetor', fem: false },
      { substantivo: 'Ressonador', fem: false },
      { substantivo: 'Foco', fem: false },
    ],
    vestidos: [
      { substantivo: 'Elmo', fem: false },
      { substantivo: 'Tiara', fem: true },
      { substantivo: 'Colar', fem: false },
      { substantivo: 'Manto', fem: false },
      { substantivo: 'Amuleto', fem: false },
    ],
    adjetivos: [
      { m: 'Psíquico', f: 'Psíquica' },
      { m: 'Oscilante', f: 'Oscilante' },
      { m: 'Sináptico', f: 'Sináptica' },
      { m: 'Ressonante', f: 'Ressonante' },
      { m: 'Psiônico', f: 'Psiônica' },
      { m: 'Neural', f: 'Neural' },
      { m: 'Alucinatório', f: 'Alucinatória' },
      { m: 'Hipnótico', f: 'Hipnótica' },
    ],
    descricoesEmp: [
      'Mecanismo com diapasões de prata e cristais de quartzo sintonizados para propagar pulsos de choque direto nas sinapses do alvo.',
      'Aparato de foco mental com discos giratórios e bobinas sutis que emitem frequências sonoras e ondas indutoras de pavor.',
      'Dispositivo de sobrecarga neural que transmite impulsos de atordoamento e ilusão com altíssima precisão.',
    ],
    descricoesVest: [
      'Artefato craniano com filamentos de platina e microeletrodos que amplifica ondas cerebrais e as converte em comando psíquico.',
      'Diadema com prisma central lapidado que vibra em harmonia com a mente do usuário, propagando ondas sugestivas.',
      'Colar com ressonadores oscilantes de mercúrio que filtram e direcionam impulsos mentais perturbadores.',
    ],
  },
  protecao: {
    empunhados: [
      { substantivo: 'Defletor', fem: false },
      { substantivo: 'Gerador', fem: false },
      { substantivo: 'Bastão', fem: false },
      { substantivo: 'Projetor', fem: false },
      { substantivo: 'Emissor', fem: false },
    ],
    vestidos: [
      { substantivo: 'Casaco', fem: false },
      { substantivo: 'Couraça', fem: true },
      { substantivo: 'Peitoral', fem: false },
      { substantivo: 'Colete', fem: false },
      { substantivo: 'Arnês', fem: false },
    ],
    adjetivos: [
      { m: 'Cinético', f: 'Cinética' },
      { m: 'Blindado', f: 'Blindada' },
      { m: 'Prismático', f: 'Prismática' },
      { m: 'Isolante', f: 'Isolante' },
      { m: 'Refratário', f: 'Refratária' },
      { m: 'Fortificado', f: 'Fortificada' },
      { m: 'Amortecedor', f: 'Amortecedora' },
      { m: 'Hermético', f: 'Hermética' },
    ],
    descricoesEmp: [
      'Dispositivo compacto com giroscópios e molas tensoras que gera um campo de repulsão mecânica contra impactos.',
      'Emissor com lentes refratárias e contrapesos magnéticos que projeta barreiras translúcidas protetoras.',
      'Bastão com cúpula de quartzo e molas pneumáticas que amortece impactos e desvia projéteis velozes.',
    ],
    descricoesVest: [
      'Traje reforçado com placas segmentadas de aço e amortecedores hidráulicos sob medida contra ferimentos.',
      'Armadura com exoesqueleto articulado e placas de sobreposição que absorvem golpes brutais sem perda de agilidade.',
      'Peitoral hermético com revestimento duplo de ligas leves que dissipa impacto e desvia agressões.',
    ],
  },
  cura: {
    empunhados: [
      { substantivo: 'Injetor', fem: false },
      { substantivo: 'Dispersor', fem: false },
      { substantivo: 'Vaporizador', fem: false },
      { substantivo: 'Aplicador', fem: false },
      { substantivo: 'Restaurador', fem: false },
    ],
    vestidos: [
      { substantivo: 'Colete', fem: false },
      { substantivo: 'Cinto', fem: false },
      { substantivo: 'Arnês', fem: false },
      { substantivo: 'Faixa', fem: true },
      { substantivo: 'Braçadeira', fem: true },
    ],
    adjetivos: [
      { m: 'Alquímico', f: 'Alquímica' },
      { m: 'Regenerativo', f: 'Regenerativa' },
      { m: 'Osmótico', f: 'Osmótica' },
      { m: 'Revigorante', f: 'Revigorante' },
      { m: 'Biomecânico', f: 'Biomecânica' },
      { m: 'Tônico', f: 'Tônica' },
      { m: 'Purificador', f: 'Purificadora' },
      { m: 'Celular', f: 'Celular' },
    ],
    descricoesEmp: [
      'Instrumento dosador com ampolas de bálsamo e pistão pneumático que injeta compostos regenerativos instantâneos.',
      'Vaporizador sob pressão com microbicos que aspergiram névoa salina esterilizante e restauradora de tecidos.',
      'Aparato de precisão com microagulhas acopladas para infusão rápida de compostos catalisadores de vitalidade.',
    ],
    descricoesVest: [
      'Colete provido de condutores de fluido e bolsas compressoras que ministram tônicos revigorantes no corpo do usuário.',
      'Cinto utilitário com dosadores automáticos de pressão que injetam substâncias cicatrizantes ao sinal de trauma físico.',
      'Arnês articulado com ampolas térmicas que estabilizam sinais vitais e aceleram a coagulação por osmose.',
    ],
  },
  movimento: {
    empunhados: [
      { substantivo: 'Propulsor', fem: false },
      { substantivo: 'Ativador', fem: false },
      { substantivo: 'Disparador', fem: false },
      { substantivo: 'Manipulador', fem: false },
      { substantivo: 'Regulador', fem: false },
    ],
    vestidos: [
      { substantivo: 'Arnês', fem: false },
      { substantivo: 'Cinto', fem: false },
      { substantivo: 'Bota', fem: true },
      { substantivo: 'Mochila', fem: true },
      { substantivo: 'Colete', fem: false },
    ],
    adjetivos: [
      { m: 'Pneumático', f: 'Pneumática' },
      { m: 'Cinético', f: 'Cinética' },
      { m: 'Propulsor', f: 'Propulsora' },
      { m: 'Acelerado', f: 'Acelerada' },
      { m: 'Vetorial', f: 'Vetorial' },
      { m: 'Eólico', f: 'Eólica' },
      { m: 'Flutuante', f: 'Flutuante' },
      { m: 'Veloz', f: 'Veloz' },
    ],
    descricoesEmp: [
      'Aparato de impulsão vetorial com pistões a ar comprimido que desloca pesos e impulsiona corpos com velocidade espantosa.',
      'Instrumento de tração com roldanas de precisão e cabo de aço estendido que projeta forças aceleradas instantâneas.',
      'Regulador portátil com válvulas de escape rápido calibrado para multiplicar a inércia e acelerar manobras.',
    ],
    descricoesVest: [
      'Equipamento corporal articulado com jatos pneumáticos dorsais e molas nas juntas que multiplicam a locomoção.',
      'Cinto cinético com volantes giratórios de alta rotação que geram empuxo vertical e amortecem quedas.',
      'Botas mecânicas providas de calhas de compressão a gás que impulsionam saltos vertiginosos e corridas sobre-humanas.',
    ],
  },
  frio: {
    empunhados: [
      { substantivo: 'Lançador', fem: false },
      { substantivo: 'Condensador', fem: false },
      { substantivo: 'Projetor', fem: false },
      { substantivo: 'Canhão', fem: false },
      { substantivo: 'Bocal', fem: false },
    ],
    vestidos: [
      { substantivo: 'Manto', fem: false },
      { substantivo: 'Sobretudo', fem: false },
      { substantivo: 'Capuz', fem: false },
      { substantivo: 'Peitoral', fem: false },
      { substantivo: 'Bota', fem: true },
    ],
    adjetivos: [
      { m: 'Criogênico', f: 'Criogênica' },
      { m: 'Glacial', f: 'Glacial' },
      { m: 'Gélido', f: 'Gélida' },
      { m: 'Congelante', f: 'Congelante' },
      { m: 'Polar', f: 'Polar' },
      { m: 'Frígido', f: 'Frígida' },
      { m: 'Ártico', f: 'Ártica' },
      { m: 'Condensador', f: 'Condensadora' },
    ],
    descricoesEmp: [
      'Dispositivo com cilindros de gás liquefeito e serpentinas de expansão rápida que projeta ventanias congelantes e geada espessa.',
      'Aparato com câmara de descompressão criogênica e bocais de latão que congela a umidade do ar e expele fragmentos pontiagudos de gelo.',
      'Canhão de gelo pressurizado com válvulas de escape endotérmico que resfria alvos instantaneamente a temperaturas glaciais.',
    ],
    descricoesVest: [
      'Sobretudo forrado com placas térmicas reversas e condensadores de frio que mantêm uma névoa gélida isolante ao redor do corpo.',
      'Manto provido de tecidos isolantes e tubos capilares de fluido refrigerante que absorve calor ambiente e resfria o ar circundante.',
      'Peitoral com placas térmicas compensadoras e serpentinas de amônia que dissipa choques térmicos e projeta rajadas glaciais.',
    ],
  },
  acido: {
    empunhados: [
      { substantivo: 'Aspersor', fem: false },
      { substantivo: 'Injetor', fem: false },
      { substantivo: 'Pulverizador', fem: false },
      { substantivo: 'Disparador', fem: false },
      { substantivo: 'Canhão', fem: false },
    ],
    vestidos: [
      { substantivo: 'Colete', fem: false },
      { substantivo: 'Avental', fem: false },
      { substantivo: 'Arnês', fem: false },
      { substantivo: 'Capa', fem: true },
      { substantivo: 'Luva', fem: true },
    ],
    adjetivos: [
      { m: 'Cáustico', f: 'Cáustica' },
      { m: 'Corrosivo', f: 'Corrosiva' },
      { m: 'Alquímico', f: 'Alquímica' },
      { m: 'Tóxico', f: 'Tóxica' },
      { m: 'Dissolvente', f: 'Dissolvente' },
      { m: 'Ácido', f: 'Ácida' },
      { m: 'Fétido', f: 'Fétida' },
      { m: 'Degradante', f: 'Degradante' },
    ],
    descricoesEmp: [
      'Aparato aspersor de vidro temperado e tubulações de chumbo que dispara jatos sob pressão de ácidos minerais corrosivos.',
      'Pulverizador pneumático com bocal de cerâmica reforçada projetado para expelir névoas cáusticas que dissolvem matéria orgânica e metal.',
      'Injetor de vitríolo com pistões manuais e diafragmas resistentes a solventes para ataque químico concentrado.',
    ],
    descricoesVest: [
      'Vestimenta com forro impermeabilizado de borracha e tanques dorsais selados que borrifa compostos corrosivos em torno do usuário.',
      'Avental reforçado com resinas cerâmicas e tubos de dosagem que neutraliza respingos e expele vapores dissolventes.',
      'Arnês articulado com câmaras de vidro espesso que liberam agentes químicos degradantes contra agressores próximos.',
    ],
  },
  trevas: {
    empunhados: [
      { substantivo: 'Foco', fem: false },
      { substantivo: 'Projetor', fem: false },
      { substantivo: 'Emissor', fem: false },
      { substantivo: 'Condutor', fem: false },
      { substantivo: 'Cetro', fem: false },
    ],
    vestidos: [
      { substantivo: 'Manto', fem: false },
      { substantivo: 'Capuz', fem: false },
      { substantivo: 'Túnica', fem: true },
      { substantivo: 'Máscara', fem: true },
      { substantivo: 'Amuleto', fem: false },
    ],
    adjetivos: [
      { m: 'Sombrio', f: 'Sombria' },
      { m: 'Entrópico', f: 'Entrópica' },
      { m: 'Espectral', f: 'Espectral' },
      { m: 'Noturno', f: 'Noturna' },
      { m: 'Obscuro', f: 'Obscura' },
      { m: 'Necrótico', f: 'Necrótica' },
      { m: 'Sinistro', f: 'Sinistra' },
      { m: 'Fúnebre', f: 'Fúnebre' },
    ],
    descricoesEmp: [
      'Aparato com prismas de obsidiana e espelhos côncavos que aprisiona feixes de luz e projeta trevas densas e asfixiantes.',
      'Instrumento com núcleos de carvão alquímico e diafragmas oscilantes que absorve espectros luminosos e espalha sombras inquietantes.',
      'Foco com ressonadores de ferro frio sintonizados para propagar frequências de decaimento entrópico e pavor.',
    ],
    descricoesVest: [
      'Manto tramado com fios de seda negra e coletores de radiação sombria que obscurece a silhueta e confunde a visão inimiga.',
      'Capuz com lentes de quartzo escurecido e filtros ópticos polarizados que envolve a cabeça em uma mortalha de trevas.',
      'Túnica provida de forro absorvedor de fótons e anéis de retenção de sombra que dissipa luz e intimida atacantes.',
    ],
  },
  luz: {
    empunhados: [
      { substantivo: 'Projetor', fem: false },
      { substantivo: 'Farol', fem: false },
      { substantivo: 'Foco', fem: false },
      { substantivo: 'Bastão', fem: false },
      { substantivo: 'Emissor', fem: false },
    ],
    vestidos: [
      { substantivo: 'Diadema', fem: false },
      { substantivo: 'Peitoral', fem: false },
      { substantivo: 'Colar', fem: false },
      { substantivo: 'Elmo', fem: false },
      { substantivo: 'Tiara', fem: true },
    ],
    adjetivos: [
      { m: 'Solar', f: 'Solar' },
      { m: 'Fotônico', f: 'Fotônica' },
      { m: 'Radiante', f: 'Radiante' },
      { m: 'Luminescente', f: 'Luminescente' },
      { m: 'Prismático', f: 'Prismática' },
      { m: 'Fúlgido', f: 'Fúlgida' },
      { m: 'Cintilante', f: 'Cintilante' },
      { m: 'Auroral', f: 'Auroral' },
    ],
    descricoesEmp: [
      'Aparato com espelhos parabólicos e lâmpada de arco voltaico de magnésio que dispara feixes deslumbrantes de claridade solar.',
      'Projetor com lentes ópticas de quartzo puro e dínamos de corda que concentra luz radiante capaz de cegar ou purificar.',
      'Farol portátil com prismas refratários de cristal que ilumina vastas áreas e dispersa sombras mágicas instantaneamente.',
    ],
    descricoesVest: [
      'Diadema com prisma facetado e coletores de fótons que emite uma aura radiante e dissipa ilusões à visão.',
      'Peitoral polido com espelhos angulares e filamentos fluorescentes que refrata feixes ofuscantes ao redor do usuário.',
      'Colar com gema luminescente lapidada e dínamos piezoelétricos que brilha com intensidade pura ao comando do criador.',
    ],
  },
  terra: {
    empunhados: [
      { substantivo: 'Martelo', fem: false },
      { substantivo: 'Impactador', fem: false },
      { substantivo: 'Ressonador', fem: false },
      { substantivo: 'Canhão', fem: false },
      { substantivo: 'Perfurador', fem: false },
    ],
    vestidos: [
      { substantivo: 'Peitoral', fem: false },
      { substantivo: 'Cinto', fem: false },
      { substantivo: 'Arnês', fem: false },
      { substantivo: 'Manopla', fem: true },
      { substantivo: 'Greva', fem: true },
    ],
    adjetivos: [
      { m: 'Telúrico', f: 'Telúrica' },
      { m: 'Sísmico', f: 'Sísmica' },
      { m: 'Magnético', f: 'Magnética' },
      { m: 'Tectônico', f: 'Tectônica' },
      { m: 'Rochoso', f: 'Rochosa' },
      { m: 'Gravitacional', f: 'Gravitacional' },
      { m: 'Denso', f: 'Densa' },
      { m: 'Titânico', f: 'Titânica' },
    ],
    descricoesEmp: [
      'Aparato de percussão hidráulica com massas oscilantes que transmite ondas de choque telúricas devastadoras pelo solo.',
      'Dispositivo com eletroímãs de neodímio e contrapesos rotativos que manipula campos gravitacionais e arremessa pedras.',
      'Ressonador acústico de baixa frequência com pistões reforçados que racha pedra e abala as estruturas ao redor.',
    ],
    descricoesVest: [
      'Manoplas pesadas de bronze com acionadores de mola interna que multiplicam o impacto físico e esmagam minerais.',
      'Cinto sísmico com lastros de chumbo e estabilizadores inerciais que ancora o inventor com firmeza inabalável ao solo.',
      'Grevas com pinos retráteis e pistões pneumáticos que fincam no terreno para resistir a empurrões e gerar impactos sísmicos.',
    ],
  },
  geral: {
    empunhados: [
      { substantivo: 'Emissor', fem: false },
      { substantivo: 'Disparador', fem: false },
      { substantivo: 'Projetor', fem: false },
      { substantivo: 'Ressonador', fem: false },
      { substantivo: 'Condutor', fem: false },
    ],
    vestidos: [
      { substantivo: 'Manto', fem: false },
      { substantivo: 'Colete', fem: false },
      { substantivo: 'Arnês', fem: false },
      { substantivo: 'Amuleto', fem: false },
      { substantivo: 'Cinto', fem: false },
    ],
    adjetivos: [
      { m: 'Arcano', f: 'Arcana' },
      { m: 'Engenhoso', f: 'Engenhosa' },
      { m: 'Mecânico', f: 'Mecânica' },
      { m: 'Ressonante', f: 'Ressonante' },
      { m: 'Alquímico', f: 'Alquímica' },
      { m: 'Prismático', f: 'Prismática' },
      { m: 'Articulado', f: 'Articulada' },
      { m: 'Harmônico', f: 'Harmônica' },
    ],
    descricoesEmp: [
      'Dispositivo de precisão com cilindros pressurizados e engrenagens de latão que catalisam efeitos energéticos refinados.',
      'Aparato empunhado com carretéis condutores e válvulas de retenção que modulam forças arcanas com grande eficácia.',
      'Instrumento com lentes convergentes e dínamos manuais que manifesta a magia por meio de impulsos mecânicos contínuos.',
    ],
    descricoesVest: [
      'Artefato acoplado ao vestuário dotado de fiação rúnica e amortecedores que sincroniza efeitos com os movimentos do inventor.',
      'Indumentária reforçada com câmaras de compensação e ressonadores que canaliza propriedades especiais ao redor do usuário.',
      'Peça com travas de segurança e anéis reguladores que libera fluxos controlados para replicar os efeitos mágicos desejados.',
    ],
  },
};

function identificarTemaMagia(spellOrNome: any): string {
  let id = '';
  let nome = '';
  let escola = '';
  if (spellOrNome && typeof spellOrNome === 'object') {
    id = String(spellOrNome.id || spellOrNome.key || '').toLowerCase();
    nome = String(spellOrNome.nome || spellOrNome.name || '').toLowerCase();
    escola = String(spellOrNome.escola || spellOrNome.school || '').toLowerCase();
  } else {
    nome = String(spellOrNome || '').toLowerCase();
    id = nome.replace(/\s+/g, '-');
  }

  const full = `${id} ${nome}`;
  if (/frio|gelo|gead|glacial|neve|congel|inver|tempestade de neve|uivant/i.test(full)) {
    return 'frio';
  }
  if (/acid|ácid|corros|caust|cáust|venen|peconh|peçonh|tox|tóx|dissolv/i.test(full)) {
    return 'acido';
  }
  if (
    /trev|sombra|escuro|necrom|morte|espectr|morto|cadaver|cadáver|ossos|amaldic|amaldiç/i.test(
      full,
    ) ||
    escola === 'necromancia'
  ) {
    return 'trevas';
  }
  if (/luz|ilumin|solar|clar|brilho|radiant|sagrad|abenc|abenç|aurora|farol/i.test(full)) {
    return 'luz';
  }
  if (/terra|pedra|rocha|sism|sísm|gravid|telur|telúr|impacto|metal|ferro|lama|areia/i.test(full)) {
    return 'terra';
  }
  if (/fogo|flam|chama|incend|incênd|calor|sol|combust|piro|explos/i.test(full)) {
    return 'fogo';
  }
  if (/relamp|relâmp|choque|elet|elét|raio|trovao|trovão|trov|volta|ion|iôn/i.test(full)) {
    return 'eletricidade';
  }
  if (
    /mental|mente|psiqu|psíqu|psion|psiôn|ilus|sonho|hipn|hipnó|medo|pavor|panico|pânico|desespero|sono|sussurro|comando|sugest/i.test(
      full,
    )
  ) {
    return 'psiquico';
  }
  if (
    /armadura|escudo|resistencia|resistência|campo|protecao|proteção|barreira|abjur|muralha|tranca|inviol/i.test(
      full,
    ) ||
    escola === 'abjuracao' ||
    escola === 'abjuração'
  ) {
    return 'protecao';
  }
  if (/cura|ferimento|purific|vital|alivio|alívio|restaur|vida|repar|sang/i.test(full)) {
    return 'cura';
  }
  if (/voo|velocidade|salto|queda|vento|ar|passo|teletransporte|movimento|patins|levita/i.test(full)) {
    return 'movimento';
  }

  if (escola === 'evocacao' || escola === 'evocação') return 'fogo';
  if (
    escola === 'encantamento' ||
    escola === 'ilusao' ||
    escola === 'ilusão' ||
    escola === 'adivinhacao' ||
    escola === 'adivinhação'
  ) {
    return 'psiquico';
  }
  if (
    escola === 'transmutacao' ||
    escola === 'transmutação' ||
    escola === 'convocacao' ||
    escola === 'convocação'
  ) {
    return 'movimento';
  }
  return 'geral';
}

function gerarTresSugestoesGramaticais(
  forma: FormaEngenhoca,
  temaKey: string,
): OpcoesFormaEngenhoca {
  const tema = LEXICO_ENGENHOCAS[temaKey] || LEXICO_ENGENHOCAS.geral;
  const isVest = forma === 'vestida';
  const subList = isVest ? tema.vestidos : tema.empunhados;
  const descList = isVest ? tema.descricoesVest : tema.descricoesEmp;
  const adjs = tema.adjetivos;

  const s1 = subList[0];
  const adj1_1 = s1.fem ? adjs[0].f : adjs[0].m;
  const adj1_2 = s1.fem ? adjs[1].f : adjs[1].m;
  const nome1 = `${s1.substantivo} ${adj1_1} ${adj1_2}`;

  const s2 = subList[1] || subList[0];
  const adj2_1 = s2.fem ? adjs[2].f : adjs[2].m;
  const adj2_2 = s2.fem ? adjs[3].f : adjs[3].m;
  const nome2 = `${s2.substantivo} ${adj2_1} ${adj2_2}`;

  const s3 = subList[2] || subList[0];
  const adj3_1 = s3.fem ? adjs[4].f : adjs[4].m;
  const nome3 = `${s3.substantivo} ${adj3_1}`;

  return {
    sugestoes: [nome1, nome2, nome3],
    descricoes: [descList[0], descList[1], descList[2]],
  };
}

export function obterOpcoesEngenhoca(
  spellOrNome: any,
  formaEspecifica?: string,
): ResultadoOpcoesEngenhoca {
  let id = '';
  let nome = '';
  if (spellOrNome && typeof spellOrNome === 'object') {
    id = String(spellOrNome.id || spellOrNome.key || '')
      .toLowerCase()
      .replace(/_/g, '-');
    nome = String(spellOrNome.nome || spellOrNome.name || '').toLowerCase();
  } else {
    nome = String(spellOrNome || '').toLowerCase();
    id = nome.replace(/\s+/g, '-');
  }

  let formaRecomendada: FormaEngenhoca = 'empunhada';
  const g = globalThis as any;
  if (g.DATA && Array.isArray(g.DATA.contraptionsCatalog)) {
    const found = g.DATA.contraptionsCatalog.find(
      (c: any) => c.id === id || String(c.name || '').toLowerCase() === nome,
    );
    if (found && (found.forma === 'vestida' || found.forma === 'empunhada')) {
      formaRecomendada = found.forma;
    }
  } else if (
    /armadura|casaco|peitoral|manto|cinto|elmo|botas|anel|tiara|pingente|amuleto/i.test(nome)
  ) {
    formaRecomendada = 'vestida';
  }

  const temaKey = identificarTemaMagia(spellOrNome);
  const empunhadas = gerarTresSugestoesGramaticais('empunhada', temaKey);
  const vestidas = gerarTresSugestoesGramaticais('vestida', temaKey);

  const formaEscolhida: FormaEngenhoca =
    formaEspecifica === 'vestida' || formaEspecifica === 'empunhada'
      ? formaEspecifica
      : formaRecomendada;

  const ativas = formaEscolhida === 'vestida' ? vestidas : empunhadas;

  return {
    formaRecomendada: formaEscolhida,
    sugestoes: ativas.sugestoes,
    descricoes: ativas.descricoes,
    opcoesPorForma: {
      empunhada: empunhadas,
      vestida: vestidas,
    },
  };
}

export function gerarDescricaoEngenhoca(
  nomeOuSpell: any,
  spellOuForma?: any,
  formaOuIndex?: any,
  index?: number,
): string {
  let nome = '';
  let spell: any = null;
  let forma = 'empunhada';
  let idx = 0;

  if (typeof nomeOuSpell === 'string') {
    nome = nomeOuSpell;
    if (typeof spellOuForma === 'object') spell = spellOuForma;
    else if (typeof spellOuForma === 'string') forma = spellOuForma;
    if (typeof formaOuIndex === 'string') forma = formaOuIndex;
    else if (typeof formaOuIndex === 'number') idx = formaOuIndex;
    if (typeof index === 'number') idx = index;
  } else if (typeof nomeOuSpell === 'object') {
    spell = nomeOuSpell;
    if (typeof spellOuForma === 'string') forma = spellOuForma;
    if (typeof formaOuIndex === 'number') idx = formaOuIndex;
    if (typeof index === 'number') idx = index;
  }

  const nomeNorm = (nome || (spell && (spell.nome || spell.name)) || '').toLowerCase();
  if (
    nomeNorm.includes('purificador') ||
    nomeNorm.includes('osmotic') ||
    nomeNorm.includes('filtro') ||
    (spell && String(spell.nome || '').toLowerCase().includes('alimento'))
  ) {
    return 'Aparato hermético com filtros de carvão ativado, membranas de celulose semipermeáveis e serpentinas de condensação para decantação e purificação profunda.';
  }

  const opts = obterOpcoesEngenhoca(spell || nome, forma);
  return (
    (opts.descricoes && opts.descricoes[idx]) ||
    'Engenhoca engenhosa repleta de pistões, válvulas de escape e filamentos arcanos.'
  );
}

export function classificarEfeitoMagia(spell: any): ClassificacaoEfeitoMagia {
  if (!spell) {
    return {
      categoria: 'utilitario',
      label: 'Utilitário Geral',
      permitidos: 'Itens de aventura, ferramentas e vestuário',
      tiposValidos: [
        'equipamento_aventura',
        'ferramenta',
        'instrumento',
        'esoterico',
        'vestuario',
        'item_geral',
      ],
    };
  }
  const id = String(spell.id || spell.key || '')
    .toLowerCase()
    .replace(/_/g, '-');
  const nome = String(spell.nome || spell.name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const escola = String(spell.escola || spell.school || '').toLowerCase();
  const alvo = String(spell.alvo || spell.target || '').toLowerCase();

  const isArmaduraArcana = id === 'armadura-arcana' || nome.includes('armadura arcana');
  if (isArmaduraArcana) {
    return {
      categoria: 'defesa_sem_armadura',
      label: 'Defesa Arcana',
      permitidos: 'Vestuário e trajes (Ofício Alfaiate) ou escudo em armaduras (Ofício Armeiro).',
      tiposValidos: ['vestuario', 'escudo', 'armadura'],
    };
  }

  const isDefesa =
    id === 'escudo-da-fe' ||
    id === 'vestimenta-da-fe' ||
    id === 'campo-de-forca' ||
    id === 'resistencia-a-energia' ||
    id === 'pele-de-pedra' ||
    id === 'barreira-mistica' ||
    id === 'manto-de-sombras' ||
    id === 'santuario' ||
    id === 'protecao-contra-magia' ||
    id === 'guardiao-divino' ||
    alvo.includes('armadura') ||
    alvo.includes('escudo') ||
    nome.includes('escudo') ||
    nome.includes('armadura') ||
    nome.includes('vestimenta') ||
    nome.includes('barreira') ||
    nome.includes('campo de forca') ||
    nome.includes('pele de pedra') ||
    (escola === 'abjuracao' &&
      (nome.includes('protec') || nome.includes('resisten') || nome.includes('defes')));

  if (isDefesa) {
    return {
      categoria: 'defesa',
      label: 'Defesa e Proteção',
      permitidos: 'Escudos, armaduras e vestuário protetor (PROIBIDO em armas)',
      tiposValidos: ['escudo', 'armadura', 'vestuario'],
    };
  }

  const isAtaqueArma =
    id === 'arma-magica' ||
    id === 'espada-divina' ||
    id === 'arma-espiritual' ||
    id === 'armamento-da-natureza' ||
    id === 'concentracao-de-combate' ||
    id === 'toque-chocante' ||
    id === 'golpe-divino' ||
    id === 'golpe-flamejante' ||
    id === 'presas-primordiais' ||
    id === 'flecha-de-fogo' ||
    id === 'tiro-certeiro' ||
    alvo.includes('arma') ||
    nome.includes('arma') ||
    nome.includes('espada') ||
    nome.includes('golpe') ||
    nome.includes('lamina') ||
    nome.includes('lâmina') ||
    nome.includes('machado') ||
    nome.includes('flecha');

  if (isAtaqueArma) {
    return {
      categoria: 'ataque_arma',
      label: 'Combate e Ataque',
      permitidos: 'Armas mundanas (PROIBIDO em armaduras e escudos)',
      tiposValidos: ['arma'],
    };
  }

  const isMobilidade =
    id === 'salto' ||
    id === 'velocidade' ||
    id === 'queda-suave' ||
    id === 'voo' ||
    id === 'passo-sem-pegadas' ||
    id === 'caminhar-sobre-as-aguas' ||
    id === 'teletransporte' ||
    id === 'forma-gasosa' ||
    id === 'pisar-no-vacuo' ||
    nome.includes('salto') ||
    nome.includes('velocidade') ||
    nome.includes('queda') ||
    nome.includes('voo') ||
    nome.includes('passo') ||
    nome.includes('caminhar') ||
    nome.includes('teletransporte') ||
    nome.includes('patins') ||
    nome.includes('andar');

  if (isMobilidade) {
    return {
      categoria: 'mobilidade',
      label: 'Mobilidade e Deslocamento',
      permitidos: 'Vestuário (botas, mantos, cintos) e equipamentos de aventura',
      tiposValidos: ['vestuario', 'equipamento_aventura', 'item_geral'],
    };
  }

  const isSentidos =
    id === 'luz' ||
    id === 'visao-mistica' ||
    id === 'visao-no-escuro' ||
    id === 'olho-mistico' ||
    id === 'compreensao' ||
    id === 'detectar-ameacas' ||
    id === 'adivinhacao' ||
    id === 'clarividencia' ||
    id === 'mapear' ||
    id === 'identificacao' ||
    escola === 'adivinhacao' ||
    nome.includes('luz') ||
    nome.includes('visao') ||
    nome.includes('olho') ||
    nome.includes('detectar') ||
    nome.includes('ouvir') ||
    nome.includes('compreensao') ||
    nome.includes('ilumin');

  if (isSentidos) {
    return {
      categoria: 'sentidos',
      label: 'Sentidos, Percepção e Luz',
      permitidos: 'Equipamentos de aventura, ferramentas (óculos, lunetas, tochas) e elmos/capuzes',
      tiposValidos: [
        'equipamento_aventura',
        'ferramenta',
        'instrumento',
        'vestuario',
        'item_geral',
      ],
    };
  }

  const isCura =
    id === 'curar-ferimentos' ||
    id === 'purificacao' ||
    id === 'restauracao' ||
    id === 'vitalidade-fantasma' ||
    id === 'abencoar-alimentos' ||
    id === 'folego-concentrado' ||
    nome.includes('curar') ||
    nome.includes('cura') ||
    nome.includes('ferimento') ||
    nome.includes('purific') ||
    nome.includes('restaur') ||
    nome.includes('vitalidade');

  if (isCura) {
    return {
      categoria: 'cura',
      label: 'Cura e Restauração',
      permitidos: 'Equipamentos de aventura, ferramentas (kits médicos, seringas) e vestuário utilitário',
      tiposValidos: ['equipamento_aventura', 'ferramenta', 'vestuario', 'item_geral'],
    };
  }

  const isEvocacao =
    id === 'bola-de-fogo' ||
    id === 'relampago' ||
    id === 'explosao-de-chamas' ||
    id === 'seta-infalivel-de-talude' ||
    id === 'raio-solar' ||
    id === 'cone-de-frio' ||
    id === 'lanca-ignea' ||
    escola === 'evocacao' ||
    nome.includes('fogo') ||
    nome.includes('raio') ||
    nome.includes('chamas') ||
    nome.includes('explosao');

  if (isEvocacao) {
    return {
      categoria: 'evocacao',
      label: 'Evocação e Disparo Direto',
      permitidos: 'Armas (disparador acoplado) e ferramentas/aparatos portáteis (PROIBIDO em armaduras/escudos)',
      tiposValidos: ['arma', 'equipamento_aventura', 'ferramenta', 'esoterico'],
    };
  }

  return {
    categoria: 'utilitario',
    label: 'Efeito e Utilitário Geral',
    permitidos: 'Equipamentos de aventura, ferramentas, esotéricos e vestuário',
    tiposValidos: [
      'equipamento_aventura',
      'ferramenta',
      'instrumento',
      'esoterico',
      'vestuario',
      'item_geral',
    ],
  };
}

export function verificarCoerenciaMagiaItem(
  spell: any,
  item: any,
): ResultadoCoerenciaMagiaItem {
  if (!spell || !item) return { compativel: true, classInfo: classificarEfeitoMagia(spell) };
  const classInfo = classificarEfeitoMagia(spell);
  const itemTipo = String(item.tipo || '').toLowerCase();
  const itemCat = String(item.categoriaId || '').toLowerCase();
  const itemNome = String(item.nome || item.name || '').toLowerCase();

  if (classInfo.categoria === 'defesa_sem_armadura') {
    if (
      itemTipo === 'arma' ||
      itemCat.includes('arma') ||
      ['simples', 'marcial', 'exotica', 'fogo'].includes(itemCat)
    ) {
      return {
        compativel: false,
        motivo:
          'Armadura Arcana é uma magia de proteção corporal e não pode ser acoplada em armas.',
        classInfo,
      };
    }
    const isValido =
      itemTipo === 'vestuario' ||
      itemCat === 'vestuario' ||
      itemTipo === 'escudo' ||
      itemCat === 'escudo' ||
      itemTipo === 'armadura' ||
      itemCat.includes('armadura') ||
      ['leve', 'pesada', 'pesado'].includes(itemCat);
    return {
      compativel: isValido,
      motivo: isValido
        ? undefined
        : 'Armadura Arcana pode ser acoplada em roupas/vestuário (Ofício Alfaiate) ou em armaduras e escudos (Ofício Armeiro).',
      classInfo,
    };
  }

  if (classInfo.categoria === 'defesa') {
    if (
      itemTipo === 'arma' ||
      itemCat.includes('arma') ||
      ['simples', 'marcial', 'exotica', 'fogo'].includes(itemCat)
    ) {
      return {
        compativel: false,
        motivo: `Magias defensivas como ${spell.nome || spell.name || 'esta'} não podem ser acopladas em armas. Escolha um escudo, armadura ou vestuário defensivo.`,
        classInfo,
      };
    }
    const isValido =
      itemTipo === 'escudo' ||
      itemTipo === 'armadura' ||
      itemTipo === 'vestuario' ||
      itemCat === 'escudo' ||
      itemCat.includes('armadura') ||
      itemCat === 'vestuario';
    return {
      compativel: isValido,
      motivo: isValido ? undefined : 'Item incompatível com o efeito defensivo da magia.',
      classInfo,
    };
  }

  if (classInfo.categoria === 'ataque_arma') {
    if (
      itemTipo === 'armadura' ||
      itemTipo === 'escudo' ||
      itemCat.includes('armadura') ||
      itemCat === 'escudo'
    ) {
      return {
        compativel: false,
        motivo: `Magias de aprimoramento de arma como ${spell.nome || spell.name || 'esta'} não podem ser acopladas em armaduras ou escudos. Escolha uma arma mundana.`,
        classInfo,
      };
    }
    if (itemTipo === 'vestuario' && !itemNome.includes('manopla')) {
      return {
        compativel: false,
        motivo: 'Magias de combate com arma devem ser acopladas em armas, não em vestuário.',
        classInfo,
      };
    }
    const isArma =
      itemTipo === 'arma' || ['simples', 'marcial', 'exotica', 'fogo'].includes(itemCat);
    return {
      compativel: isArma,
      motivo: isArma ? undefined : 'Esta magia exige uma arma mundana para ser acoplada.',
      classInfo,
    };
  }

  if (classInfo.categoria === 'mobilidade') {
    if (
      itemTipo === 'arma' ||
      itemTipo === 'escudo' ||
      (itemTipo === 'armadura' && itemCat === 'pesada')
    ) {
      return {
        compativel: false,
        motivo:
          'Magias de mobilidade e deslocamento não podem ser acopladas em armas ou escudos. Use calçados, mantos ou equipamentos de aventura.',
        classInfo,
      };
    }
    const isValido =
      itemTipo === 'vestuario' ||
      itemTipo === 'equipamento_aventura' ||
      itemTipo === 'item_geral' ||
      itemCat === 'vestuario' ||
      itemCat === 'equipamento_aventura';
    return {
      compativel: isValido,
      motivo: isValido ? undefined : 'Item incompatível com engenhocas de mobilidade.',
      classInfo,
    };
  }

  if (classInfo.categoria === 'cura') {
    if (itemTipo === 'arma' || itemTipo === 'armadura' || itemTipo === 'escudo') {
      return {
        compativel: false,
        motivo:
          'Magias de cura e restauração devem ser acopladas em kits, ferramentas ou vestuário médico, não em armas ou armaduras de combate.',
        classInfo,
      };
    }
    return { compativel: true, classInfo };
  }

  if (classInfo.categoria === 'evocacao') {
    if (itemTipo === 'armadura' || itemTipo === 'escudo') {
      return {
        compativel: false,
        motivo:
          'Engenhocas de evocação e rajadas destrutivas não podem ser acopladas em armaduras corporais ou escudos.',
        classInfo,
      };
    }
    return { compativel: true, classInfo };
  }

  if (classInfo.categoria === 'sentidos') {
    if (itemTipo === 'arma' || (itemTipo === 'armadura' && itemCat !== 'elmo')) {
      return {
        compativel: false,
        motivo:
          'Magias de sentidos e iluminação devem ser acopladas em lentes, lanternas, ferramentas ou capacetes/capuzes, não em armas ou couraças.',
        classInfo,
      };
    }
    return { compativel: true, classInfo };
  }

  const permitido =
    classInfo.tiposValidos.includes(itemTipo) || classInfo.tiposValidos.includes(itemCat);
  return {
    compativel: permitido,
    motivo: permitido
      ? undefined
      : `Item incompatível com o tipo de magia (${classInfo.label}). Permitidos: ${classInfo.permitidos}.`,
    classInfo,
  };
}
