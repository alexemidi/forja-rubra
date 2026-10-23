// @ts-check

/**
 * Regras puras de Manufatura e Ofício (Tormenta 20).
 * Sem dependências de DOM ou estado global do navegador.
 */

const RegrasManufatura = (() => {
  /**
   * Calcula o custo de matéria-prima (1/3 do preço de mercado, arredondado para cima).
   * @param {number} precoMercado
   * @returns {number}
   */
  function custoMateriaPrima(precoMercado, opcoes = {}) {
    const valor = Number(precoMercado) || 0;
    if (valor <= 0) return 0;
    const divisor = opcoes.fracao === '1/4' || opcoes.divisor === 4 || opcoes.isDrogadora ? 4 : 3;
    return Math.ceil(valor / divisor);
  }

  /**
   * Determina a CD do teste de Ofício para fabricar um item.
   * Regra Tormenta 20:
   * - Itens Específicos: CD 30 para menores, CD 40 para médios e CD 50 para maiores.
   * - Itens mundanos: CD 15 para itens simples; CD 20 para itens complexos.
   * @param {any} item
   * @returns {number}
   */
  function cdFabricacao(item) {
    if (!item) return 15;

    // Regra canônica de Itens Específicos (Tormenta 20):
    // CD 30 para itens menores, CD 40 para médios e CD 50 para maiores.
    const isSpecific = Boolean(
      (item.magico && (item.magico.tipo === 'especifico' || item.magico.tipo === 'liturgico')) ||
      item.especifico ||
      item.isSpecific
    );
    if (isSpecific || (item.magico && item.magico.categoriaId)) {
      const cat = String(item.magico?.categoriaId || item.categoriaId || item.tier || '').toLowerCase();
      if (cat.includes('menor')) return 30;
      if (cat.includes('medio') || cat.includes('médio')) return 40;
      if (cat.includes('maior')) return 50;
      return 30;
    }

    const cat = `${item.tipo || ''} ${item.categoriaId || ''} ${item.arma?.combateId || ''}`.toLowerCase();
    const nome = String(item.nome || item.name || '').toLowerCase();
    if (cat.includes('aparato') || item.categoriaId === 'aparato') return 20;
    const isComplex = cat.includes('marcial') || cat.includes('exotica') || cat.includes('alquim') || cat.includes('pesada') || nome.includes('ácido') || nome.includes('fogo alquímico');
    return isComplex ? 20 : 15;
  }

  /**
   * Determina o tempo padrão de manufatura segundo as regras de T20:
   * 1 dia para consumíveis/alquímicos/comidas, 1 semana para itens mundanos comuns, 1 mês para superiores/mágicos/específicos.
   * @param {any} item
   * @returns {string}
   */
  function tempoFabricacao(item) {
    if (!item) return '1 semana';
    const isSpecific = Boolean(
      (item.magico && (item.magico.tipo === 'especifico' || item.magico.tipo === 'liturgico')) ||
      item.especifico ||
      item.isSpecific
    );
    if (isSpecific || item.superior || item.magico) return '1 mês';
    const cat = `${item.tipo || ''} ${item.categoriaId || ''}`.toLowerCase();
    if (cat.includes('aparato') || item.categoriaId === 'aparato') return '1 hora';
    const isConsumable = cat.includes('alquim') || cat.includes('pocao') || cat.includes('poção') || cat.includes('comida') || cat.includes('aliment') || cat.includes('pergaminho');
    if (isConsumable) return '1 dia';
    return '1 semana';
  }

  /**
   * Tabelas canônicas de custos e modificadores de CD de Tormenta 20
   */
  const TABELA_MELHORIAS = [0, 300, 3000, 9000, 18000];
  const CD_MELHORIAS = [0, 5, 10, 15, 20];
  const TABELA_ENCANTOS = [0, 18000, 36000, 72000];
  const CD_ENCANTOS = [0, 10, 15, 20];
  const PM_SACRIFICIO_ENCANTOS = [0, 1, 2, 3];

  /**
   * Retorna os custos e CD de fabricação de uma poção ou pergaminho pelo custo em PM da magia.
   * Regra oficial: Preço = T$ 30 x (PM^2), CD = 20 + PM, Matéria-prima = ⅓ do Preço.
   * @param {number} custoPm
   * @returns {{ pm: number, preco: number, materiaPrima: number, cd: number }}
   */
  function regrasPocaoPergaminho(custoPm) {
    const pm = Math.max(1, Math.floor(Number(custoPm) || 1));
    const preco = 30 * (pm * pm);
    const materiaPrima = 10 * (pm * pm);
    const cd = 20 + pm;
    return { pm, preco, materiaPrima, cd };
  }

  /**
   * Mapeamento canônico das estações de ofício para seus locais e itens compatíveis.
   */
  const secoesOficina = {
    armeiro: {
      id: 'armeiro',
      title: 'Forja do Ferreiro',
      oficioNome: 'Ofício (Armeiro)',
      icon: 'tools',
      description: 'Armas, armaduras e escudos (mundanos, superiores, encantados e específicos). Inventores podem aprimorar e encantar.',
      corresponde: (item) => {
        const cat = String(item.tipo || item.categoriaId || '').toLowerCase();
        return cat.includes('arma') || cat.includes('armadura') || cat.includes('escudo');
      }
    },
    alfaiate: {
      id: 'alfaiate',
      title: 'Ateliê do Alfaiate',
      oficioNome: 'Ofício (Alfaiate)',
      icon: 'tools',
      description: 'Roupas, vestuários, mantos, chapéus e trajes reforçados. Inventores podem aprimorar e encantar.',
      corresponde: (item) => {
        const cat = String(item.tipo || item.categoriaId || '').toLowerCase();
        const nome = String(item.nome || item.name || '').toLowerCase();
        return cat.includes('vestuário') || cat.includes('vestuario') || nome.includes('traje') || nome.includes('manto') || nome.includes('vestimenta') || nome.includes('camisa') || nome.includes('chapeu') || nome.includes('chapéu');
      }
    },
    alquimista: {
      id: 'alquimista',
      title: 'Laboratório do Alquimista',
      oficioNome: 'Ofício (Alquimia)',
      icon: 'tools',
      description: 'Preparados alquímicos, catalisadores, venenos, poções mágicas, óleos e granadas.',
      corresponde: (item) => {
        const tipo = String(item.tipo || '').toLowerCase();
        if (tipo === 'acessorio' || tipo === 'arma' || tipo === 'armadura' || tipo === 'escudo' || tipo === 'servico' || tipo === 'municao' || tipo === 'veiculo') {
          return false;
        }
        const cat = String(item.categoriaId || '').toLowerCase();
        return tipo === 'alquimico' ||
          cat === 'alquimico_catalisador' ||
          cat === 'alquimico_preparado' ||
          cat === 'alquimico_venenoso' ||
          (cat.startsWith('alquimico_') && cat !== 'alquimico');
      }
    },
    artesao: {
      id: 'artesao',
      title: 'Oficina do Artesão',
      oficioNome: 'Ofício (Artesão)',
      icon: 'tools',
      description: 'Equipamentos gerais de aventura, ferramentas, instrumentos, esotéricos e itens utilitários mundanos.',
      corresponde: (item, hero) => {
        // Se possui Artesão Criativo, a oficina do artesão tem acesso pleno a todos os itens de manufatura:
        if (hero) {
          try {
            const list = Array.isArray(hero.powers) ? hero.powers : (Array.isArray(hero.progression) ? hero.progression : []);
            const hasCreative = list.some((p: any) => {
              const id = String(p?.powerId || p?.id || p || '').toLowerCase();
              const nome = String(p?.powerName || p?.nome || p?.name || '').toLowerCase();
              return id.includes('artesao_criativo') || nome.includes('artesão criativo') || nome.includes('artesao criativo');
            });
            if (hasCreative) return true;
          } catch {}
        }
        if (typeof globalThis !== 'undefined') {
          try {
            // @ts-ignore
            const gHero = (globalThis as any).state || (globalThis as any).__FORJA_HERO__;
            if (gHero) {
              const list = Array.isArray(gHero.powers) ? gHero.powers : (Array.isArray(gHero.progression) ? gHero.progression : []);
              const hasCreative = list.some((p: any) => {
                const id = String(p?.powerId || p?.id || p || '').toLowerCase();
                const nome = String(p?.powerName || p?.nome || p?.name || '').toLowerCase();
                return id.includes('artesao_criativo') || nome.includes('artesão criativo') || nome.includes('artesao criativo');
              });
              if (hasCreative) return true;
            }
          } catch {}
        }

        const tipo = String(item.tipo || '').toLowerCase();
        const cat = String(item.categoriaId || '').toLowerCase();
        const nome = String(item.nome || item.name || '').toLowerCase();

        // 1. Exclusões estritas de outros ofícios especializados canônicos:
        // Aparatos (Engenhoqueiro)
        if (cat === 'aparato' || cat === 'aparatos' || tipo === 'engenhoca' || item.isEngenhoca || cat.includes('aparato')) return false;
        // Alquímicos e Venenos (Alquimista)
        if (tipo === 'alquimico' || cat.startsWith('alquimico') || cat.includes('alquim') || cat.includes('venen')) return false;
        // Vestuário e Roupas (Alfaiate)
        if (cat === 'vestuario' || cat === 'vestuário' || cat.includes('vestuario') || cat.includes('vestuário') || nome.includes('traje') || nome.includes('manto') || nome.includes('capa com dragonas') || nome.includes('máscara')) return false;
        // Alimentação e Bebidas (Cozinheiro)
        if (cat === 'alimentacao' || cat === 'alimentação' || cat.includes('aliment') || cat.includes('comida') || cat.includes('bebida') || nome.includes('ração') || nome.includes('refeição')) return false;
        // Armas, Armaduras e Escudos (Armeiro / Carpinteiro)
        if (tipo === 'arma' || tipo === 'armadura' || tipo === 'escudo' || cat.includes('arma') || cat.includes('armadura') || cat.includes('escudo')) return false;
        // Pergaminhos e Livros (Escriba)
        if (cat.includes('pergaminho') || cat.includes('escrita') || nome.includes('pergaminho')) return false;
        // Joias e Adornos Preciosos (Joalheiro / Ourives)
        if (cat === 'joia' || cat === 'precioso' || (cat.includes('joia') && !cat.includes('ferramenta'))) return false;

        // 2. Itens pertinentes ao Ofício de Artesão:
        return cat.includes('aventura') ||
               cat.includes('ferramenta') ||
               cat.includes('instrumento') ||
               cat.includes('esoterico') ||
               cat.includes('esotérico') ||
               cat.includes('utilitario') ||
               cat.includes('utilitário') ||
               cat === 'item_geral' ||
               cat === 'geral' ||
               cat === 'outro' ||
               tipo === 'item_geral' ||
               tipo === 'geral';
      }
    },
    carpinteiro: {
      id: 'carpinteiro',
      title: 'Oficina do Carpinteiro',
      oficioNome: 'Ofício (Carpinteiro)',
      icon: 'tools',
      description: 'Tudo de madeira: arcos, bestas, cajados, escudo leve, barcos, carroças, bordões e varinhas. Inventores podem aprimorar e encantar.',
      corresponde: (item) => {
        const nome = String(item.nome || item.name || '').toLowerCase();
        const cat = String(item.tipo || item.categoriaId || '').toLowerCase();
        return nome.includes('arco') || nome.includes('besta') || nome.includes('cajado') || nome.includes('bordao') || nome.includes('bordão') || nome.includes('varinha') || nome.includes('escudo leve') || nome.includes('carroca') || nome.includes('carroça') || nome.includes('barco') || cat.includes('madeira');
      }
    },
    pedreiro: {
      id: 'pedreiro',
      title: 'Oficina do Pedreiro',
      oficioNome: 'Ofício (Pedreiro)',
      icon: 'tools',
      description: 'Obras em pedra, tijolo e argamassa; reparo de muralhas, estruturas e casas (Origem Construtor).',
      corresponde: (item) => {
        const nome = String(item.nome || item.name || '').toLowerCase();
        const cat = String(item.tipo || item.categoriaId || '').toLowerCase();
        return nome.includes('pedra') || nome.includes('tijolo') || nome.includes('argamassa') || nome.includes('muralha') || cat.includes('alvenaria');
      }
    },
    joalheiro: {
      id: 'joalheiro',
      title: 'Oficina do Joalheiro',
      oficioNome: 'Ofício (Joalheiro)',
      icon: 'tools',
      description: 'Joias em geral, colares, pulseiras, braceletes, brincos e anéis. Inventores podem aprimorar e encantar.',
      corresponde: (item) => {
        const nome = String(item.nome || item.name || '').toLowerCase();
        const cat = String(item.tipo || item.categoriaId || '').toLowerCase();
        return nome.includes('anel') || nome.includes('amuleto') || nome.includes('joia') || nome.includes('colar') || nome.includes('pulseira') || nome.includes('bracelete') || nome.includes('brinco') || cat.includes('joia') || cat.includes('precioso');
      }
    },
    ourives: {
      id: 'ourives',
      title: 'Oficina do Joalheiro',
      oficioNome: 'Ofício (Joalheiro)',
      icon: 'tools',
      description: 'Joias em geral, colares, pulseiras, braceletes, brincos e anéis. Inventores podem aprimorar e encantar.',
      corresponde: (item) => {
        const nome = String(item.nome || item.name || '').toLowerCase();
        const cat = String(item.tipo || item.categoriaId || '').toLowerCase();
        return nome.includes('anel') || nome.includes('amuleto') || nome.includes('joia') || nome.includes('colar') || nome.includes('pulseira') || nome.includes('bracelete') || nome.includes('brinco') || cat.includes('joia') || cat.includes('precioso');
      }
    },
    cozinheiro: {
      id: 'cozinheiro',
      title: 'Cozinha',
      oficioNome: 'Ofício (Culinária)',
      icon: 'tools',
      description: 'Itens consumíveis, alimentos especiais, refeições, bebidas e rações de viagem enriquecidas.',
      corresponde: (item) => {
        const nome = String(item.nome || item.name || '').toLowerCase();
        const cat = String(item.tipo || item.categoriaId || '').toLowerCase();
        return nome.includes('ração') || nome.includes('comida') || nome.includes('banquete') || cat.includes('aliment') || cat.includes('cozinha') || cat.includes('bebida');
      }
    },
    escriba: {
      id: 'escriba',
      title: 'Gabinete do Escriba',
      oficioNome: 'Ofício (Escriba)',
      icon: 'tools',
      description: 'Pergaminhos com magias, mapas, tintas especiais, documentos e livros.',
      corresponde: (item) => {
        const nome = String(item.nome || item.name || '').toLowerCase();
        const cat = String(item.tipo || item.categoriaId || '').toLowerCase();
        return nome.includes('pergaminho') || nome.includes('livro') || nome.includes('mapa') || cat.includes('pergaminho') || cat.includes('escrita');
      }
    },
    tatuador: {
      id: 'tatuador',
      title: 'Estúdio do Tatuador',
      oficioNome: 'Ofício (Tatuador)',
      icon: 'tools',
      description: 'Tatuagens místicas e pigmentos arcanos (itens vestidos com poder de magias de 1º círculo).',
      corresponde: (item) => {
        const nome = String(item.nome || item.name || '').toLowerCase();
        return nome.includes('tatuagem') || nome.includes('pigmento');
      }
    },
    engenhoqueiro: {
      id: 'engenhoqueiro',
      title: 'Oficina do Engenhoqueiro',
      oficioNome: 'Ofício (Engenhoqueiro)',
      icon: 'tools',
      description: 'Engenhocas mundanas que simulam magias arcanas ou divinas (exclusivo de Inventor).',
      corresponde: (item) => {
        const cat = String(item.tipo || item.categoriaId || '').toLowerCase();
        const nome = String(item.nome || item.name || '').toLowerCase();
        return cat.includes('engenhoca') || cat.includes('aparato') || item.categoriaId === 'aparato' || nome.includes('engenhoca') || Boolean(item.isEngenhoca);
      }
    },
    escultor: {
      id: 'escultor',
      title: 'Ateliê do Escultor',
      oficioNome: 'Ofício (Escultor)',
      icon: 'tools',
      description: 'Esculturas, entalhes em pedra ou madeira, estátuas e obras de arte monumentais.',
      corresponde: (item) => {
        const nome = String(item.nome || item.name || '').toLowerCase();
        return nome.includes('estatua') || nome.includes('estátua') || nome.includes('escultura') || nome.includes('busto');
      }
    },
    pintor: {
      id: 'pintor',
      title: 'Ateliê do Pintor',
      oficioNome: 'Ofício (Pintor)',
      icon: 'tools',
      description: 'Pinturas artísticas, telas, murais e pigmentos decorativos (interpretativo).',
      corresponde: (item) => {
        const nome = String(item.nome || item.name || '').toLowerCase();
        return nome.includes('pintura') || nome.includes('quadro') || nome.includes('tinta') || nome.includes('tela');
      }
    },
    minerador: {
      id: 'minerador',
      title: 'Mina do Minerador',
      oficioNome: 'Ofício (Minerador)',
      icon: 'tools',
      description: 'Prospecção e extração de matérias-primas e materiais raros (Aço-Rubi, Adamante, Mitral).',
      corresponde: (item) => {
        const nome = String(item.nome || item.name || '').toLowerCase();
        return nome.includes('minerio') || nome.includes('minério') || nome.includes('pepita') || nome.includes('bruto');
      }
    },
    fazendeiro: {
      id: 'fazendeiro',
      title: 'Fazenda',
      oficioNome: 'Ofício (Fazendeiro)',
      icon: 'tools',
      description: 'Gestão de colheitas, rebanhos e recursos agrícolas (interpretativo/roleplay).',
      corresponde: (item) => {
        const nome = String(item.nome || item.name || '').toLowerCase();
        return nome.includes('semente') || nome.includes('grão') || nome.includes('fardo');
      }
    },
    pescador: {
      id: 'pescador',
      title: 'Cais do Pescador',
      oficioNome: 'Ofício (Pescador)',
      icon: 'tools',
      description: 'Pesca marítima e fluvial, redes e recursos aquáticos (interpretativo/roleplay).',
      corresponde: (item) => {
        const nome = String(item.nome || item.name || '').toLowerCase();
        return nome.includes('peixe') || nome.includes('rede') || nome.includes('anzol');
      }
    },
    estalajadeiro: {
      id: 'estalajadeiro',
      title: 'Estalagem',
      oficioNome: 'Ofício (Estalajadeiro)',
      icon: 'tools',
      description: 'Hospedagem, serviços de pousada, acolhimento e entretenimento (interpretativo/roleplay).',
      corresponde: (item) => {
        const nome = String(item.nome || item.name || '').toLowerCase();
        return nome.includes('quarto') || nome.includes('estadia') || nome.includes('pousada');
      }
    }
  };

  /**
   * Determina o círculo máximo de magia que o personagem pode simular em engenhocas.
   * Regra Tormenta20 p. 70:
   * 1º ao 5º nível: 1º círculo.
   * A partir do 6º nível: 2º círculo, e a cada 4 níveis um círculo maior.
   * @param {number} nivelPersonagem
   * @returns {number}
   */
  function circuloMaximoEngenhoca(nivelPersonagem) {
    const n = Math.max(1, Number(nivelPersonagem) || 1);
    if (n < 6) return 1;
    if (n < 10) return 2;
    if (n < 14) return 3;
    if (n < 18) return 4;
    return 5;
  }

  /**
   * Custo de fabricação da engenhoca: T$ 100 x custo em PM da magia.
   * @param {number} custoPm
   * @returns {number}
   */
  function custoFabricacaoEngenhoca(custoPm) {
    return 100 * Math.max(1, Number(custoPm) || 1);
  }

  /**
   * CD do teste de fabricação de engenhoca: 20 + custo em PM da magia.
   * @param {number} custoPm
   * @returns {number}
   */
  function cdFabricacaoEngenhoca(custoPm) {
    return 20 + Math.max(1, Number(custoPm) || 1);
  }

  /**
   * CD do teste para ativar a engenhoca: 15 + custo em PM da magia.
   * @param {number} custoPm
   * @returns {number}
   */
  function cdAtivacaoEngenhoca(custoPm) {
    return 15 + Math.max(1, Number(custoPm) || 1);
  }

  /**
   * Calcula o aumento de CD na ativação da engenhoca devido aos aparatos acoplados (Tormenta20):
   * - 0 aparatos: +0
   * - 1 aparato: +2 (ou +0 se o inventor possuir o poder Aparato Personalizado)
   * - 2 aparatos: +5 (ou +3 se o inventor possuir o poder Aparato Personalizado)
   * Limite máximo: até 2 aparatos por engenhoca.
   * @param {number} numAparatos
   * @param {boolean} hasPersonalizado
   * @returns {number}
   */
  function calcularBonusCdAparatos(numAparatos, hasPersonalizado = false) {
    const qtd = Math.max(0, Math.min(2, Number(numAparatos) || 0));
    if (qtd === 0) return 0;
    if (hasPersonalizado) {
      return qtd === 1 ? 0 : 3;
    }
    return qtd === 1 ? 2 : 5;
  }

  /**
   * Determina o limite de melhorias permitidas para uma engenhoca.
   * Regra canônica: engenhocas NÃO recebem melhorias normais, EXCETO se possuírem o aparato
   * "Espera para Melhorias", que permite 1 melhoria por espera instalada (máximo de 2 melhorias
   * caso tenha 2 esperas acopladas a um item acoplado).
   * @param {any} item
   * @returns {number}
   */
  function limiteMelhoriasEngenhoca(item) {
    if (!item) return 0;
    const isEng = Boolean(item.isEngenhoca || item.contraptionId || item.tipo === 'engenhoca' || item.categoriaId === 'engenhoca' || item.engenhocaInfo);
    if (!isEng) return 4;
    const info = item.engenhocaInfo || item;
    if (!info.attachedItem && !item.attachedItem) return 0;
    const apparatus = Array.isArray(info.apparatuses) ? info.apparatuses :
      (Array.isArray(info.aparatos) ? info.aparatos :
      (Array.isArray(info.apparatus) ? info.apparatus :
      (Array.isArray(item.apparatuses) ? item.apparatuses :
      (Array.isArray(item.aparatos) ? item.aparatos :
      (Array.isArray(item.apparatus) ? item.apparatus : [])))));
    const count = apparatus.filter(a => {
      const id = typeof a === 'string' ? a : (a?.id || '');
      return id === 'espera_para_melhorias' || id.includes('espera');
    }).length;
    return Math.min(2, count);
  }

  /**
   * Calcula os espaços ocupados por uma engenhoca.
   * Regra canônica:
   * - Se for acoplada a um item mundano (attachedItem):
   *   Soma os espaços do item mundano + 1 espaço da engenhoca.
   *   Exemplo: item de 0 espaços => 0 + 1 = 1 espaço.
   *   Exemplo: item de 1 espaço => 1 + 1 = 2 espaços.
   *   Exemplo: item de 5 espaços => 5 + 1 = 6 espaços.
   * - Se não for acoplada a um item (engenhoca pura/independente):
   *   Ocupa 1 espaço.
   * @param {any} attachedItem - Item acoplado (ou null/undefined)
   * @param {number|null} [fallbackEspacos=null] - Espaço caso não tenha attachedItem
   * @returns {number}
   */
  function calcularEspacosEngenhoca(attachedItem, fallbackEspacos = null) {
    if (attachedItem) {
      const itemEsp = attachedItem.espacos != null ? Number(attachedItem.espacos) : 0;
      return (Number.isFinite(itemEsp) ? itemEsp : 0) + 1;
    }
    return fallbackEspacos != null && Number.isFinite(Number(fallbackEspacos)) ? Number(fallbackEspacos) : 1;
  }

  const SUGESTOES_NOMES_ENGENHOCAS = {
    'bola-de-fogo': 'Canhão Pirotécnico',
    'relampago': 'Arma de Raios',
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
    'luz': 'Lanterna Arcana',
    'sono': 'Dispersor de Gás Sedativo',
    'queda-suave': 'Paraquedas Autônomo',
    'salto': 'Botas Pneumáticas',
    'invisibilidade': 'Manto Refratário',
    'velocidade': 'Acelerador Temporal',
    'voo': 'Mochila a Jato',
    'explosao-de-chamas': 'Lança-chamas Portátil',
    'seta-infalivel-de-talude': 'Disparador de Microprojéteis'
  };

  /**
   * Formata o nome de uma engenhoca acoplada a um item mundano (Regra 3 do usuário).
   * - Extrai o primeiro substantivo do item mundano (ex: "Adaga Oposta" => "Adaga", "Espada Longa" => "Espada").
   * - Substitui o substantivo mecânico base da engenhoca ou flexiona os adjetivos de acordo com o gênero do item.
   * - Exemplos:
   *   "Emissor Psíquico" + "Adaga" => "Adaga Emissora Psíquica"
   *   "Emissor Psíquico" + "Machado" => "Machado Emissor Psíquico"
   *   "Agulha de Indução Neural" + "Adaga" => "Adaga de Indução Neural"
   *   "Lâmina de Ruído Psiônico" + "Adaga" => "Adaga de Ruído Psiônico"
   *   "Lâmina de Ruído Psiônico" + "Adaga Oposta" => "Adaga de Ruído Psiônico"
   * @param {string} itemNome
   * @param {string} contraptionName
   * @returns {string}
   */
  function formatarNomeEngenhocaAcoplada(itemNome, contraptionName) {
    if (!itemNome) return contraptionName || 'Engenhoca';
    if (!contraptionName) return itemNome;

    const cleanContraption = String(contraptionName).replace(/^.*?:\s*/, '').trim();

    // 1. Extrai a primeira palavra do item
    const words = itemNome.trim().split(/\s+/);
    let baseItemWord = words[0];
    baseItemWord = baseItemWord.charAt(0).toUpperCase() + baseItemWord.slice(1).toLowerCase();

    // 2. Determina se é substantivo feminino
    const femWords = new Set([
      'adaga', 'espada', 'maca', 'maça', 'armadura', 'camisa', 'capa', 'cota',
      'couraça', 'manopla', 'foice', 'alabarda', 'pistola', 'funda', 'lanca',
      'lança', 'varinha', 'tunica', 'túnica', 'vestimenta', 'botas', 'luvas',
      'faixa', 'tiara', 'brunea', 'brúnea', 'veste', 'corrente'
    ]);
    const lowerItemWord = baseItemWord.toLowerCase();
    const isFeminino = femWords.has(lowerItemWord) || (lowerItemWord.endsWith('a') && !['dia', 'mapa', 'guia'].includes(lowerItemWord));

    // 3. Estruturas com preposição (ex: "Agulha de Indução Neural", "Lâmina de Ruído Psiônico")
    const prepMatch = cleanContraption.match(/^(\S+)\s+(de|da|do|dos|das)\s+(.+)$/i);
    if (prepMatch) {
      const prep = prepMatch[2].toLowerCase();
      const resto = prepMatch[3];
      return `${baseItemWord} ${prep} ${resto}`;
    }

    // 4. Estruturas adjetivadas (ex: "Emissor Psíquico", "Agulha Sináptica", "Canhão Ígneo Fagulhante")
    const parts = cleanContraption.split(/\s+/);
    if (parts.length >= 2) {
      const firstLower = parts[0].toLowerCase();
      const redundantSubsts = new Set([
        'agulha', 'lamina', 'lâmina', 'bastao', 'bastão', 'manopla', 'haste',
        'varinha', 'arco', 'fuzil', 'mosquete', 'chicote', 'manto', 'casaco',
        'colete', 'peitoral', 'couraca', 'couraça', 'cota', 'brunea', 'brúnea',
        'armadura', 'elmo', 'tiara', 'colar', 'anel', 'cinto', 'arnes', 'arnês'
      ]);

      const flexAdjetivo = (word) => {
        if (!isFeminino) return word;
        let w = word;
        if (/or$/i.test(w)) return w + 'a';
        if (/ico$/i.test(w)) return w.slice(0, -3) + 'ica';
        if (/vel$/i.test(w)) return w;
        if (/os$/i.test(w)) return w;
        if (/o$/i.test(w)) return w.slice(0, -1) + 'a';
        return w;
      };

      // Se a primeira palavra for um substantivo redundantemente físico (ex: "Agulha Sináptica" + "Adaga" => "Adaga Sináptica")
      if (redundantSubsts.has(firstLower)) {
        const adjs = parts.slice(1).map(flexAdjetivo);
        return `${baseItemWord} ${adjs.join(' ')}`;
      }

      // Senão (ex: "Emissor Psíquico" => "Adaga Emissora Psíquica")
      const adjetivos = parts.map(flexAdjetivo);
      return `${baseItemWord} ${adjetivos.join(' ')}`;
    }

    return `${baseItemWord} ${cleanContraption}`;
  }

  function sugerirNomeEngenhoca(spellOrNome, formaOuId) {
    let id = '';
    let nome = '';
    if (spellOrNome && typeof spellOrNome === 'object') {
      id = String(spellOrNome.id || spellOrNome.key || '').toLowerCase().replace(/_/g, '-');
      nome = String(spellOrNome.nome || spellOrNome.name || '').toLowerCase();
    } else {
      nome = String(spellOrNome || '').toLowerCase();
      id = String(formaOuId || '').toLowerCase().replace(/_/g, '-');
    }
    // @ts-ignore
    if (typeof DATA !== 'undefined' && Array.isArray(DATA.contraptionsCatalog)) {
      // @ts-ignore
      const found = DATA.contraptionsCatalog.find(c => c.id === id || String(c.name || '').toLowerCase() === nome);
      if (found && found.contraptions?.length) return found.contraptions[0];
    }
    if (id && SUGESTOES_NOMES_ENGENHOCAS[id]) return SUGESTOES_NOMES_ENGENHOCAS[id];
    for (const [k, v] of Object.entries(SUGESTOES_NOMES_ENGENHOCAS)) {
      if (nome.includes(k.replace(/-/g, ' '))) return v;
    }
    const cleanNome = (spellOrNome && typeof spellOrNome === 'object') ? (spellOrNome.nome || spellOrNome.name || 'Magia') : (spellOrNome || 'Magia');
    return 'Aparato de ' + cleanNome;
  }

  /**
   * Tabelas léxicas para geração canônica de nomes de engenhocas (Regra Oficial da Forja):
   * 6 sugestões para cada magia:
   * - 3 empunhadas: sugestão 1 (Subst + 2 Adjs), sugestão 2 (Subst + 2 Adjs), sugestão 3 (Subst + 1 Adj)
   * - 3 vestidas:   sugestão 1 (Subst + 2 Adjs), sugestão 2 (Subst + 2 Adjs), sugestão 3 (Subst + 1 Adj)
   */
  const LEXICO_ENGENHOCAS = {
    fogo: {
      empunhados: [
        { substantivo: 'Canhão', fem: false },
        { substantivo: 'Disparador', fem: false },
        { substantivo: 'Lança-Chamas', fem: false },
        { substantivo: 'Manopla', fem: true },
        { substantivo: 'Projetor', fem: false }
      ],
      vestidos: [
        { substantivo: 'Manto', fem: false },
        { substantivo: 'Colete', fem: false },
        { substantivo: 'Couraça', fem: true },
        { substantivo: 'Arnês', fem: false },
        { substantivo: 'Peitoral', fem: false }
      ],
      adjetivos: [
        { m: 'Ígneo', f: 'Ígnea' },
        { m: 'Fagulhante', f: 'Fagulhante' },
        { m: 'Térmico', f: 'Térmica' },
        { m: 'Incandescente', f: 'Incandescente' },
        { m: 'Vulcânico', f: 'Vulcânica' },
        { m: 'Calcinante', f: 'Calcinante' },
        { m: 'Comburente', f: 'Comburente' },
        { m: 'Pirotécnico', f: 'Pirotécnica' }
      ],
      descricoesEmp: [
        'Dispositivo portátil de latão com câmara de queima e bocais reguláveis que projetam rajadas concentradas de calor extremo.',
        'Mecanismo pressurizado com serpentinas térmicas e pederneiras giratórias que expelem labaredas controladas sob pressão.',
        'Aparato tubular com cilindros de nafta destilada e ignição piezoelétrica para queima imediata de alvos.'
      ],
      descricoesVest: [
        'Vestimenta reforçada com camadas de amianto e filamentos cerâmicos térmicos que concentram ondas de calor ao redor do usuário.',
        'Colete couraçado com microcaldeiras dorsais que canalizam e irradiam calor intenso em resposta aos movimentos do usuário.',
        'Peitoral laminado com isolamento térmico e válvulas de escape para projetar anéis de chamas protetores.'
      ]
    },
    eletricidade: {
      empunhados: [
        { substantivo: 'Emissor', fem: false },
        { substantivo: 'Bastão', fem: false },
        { substantivo: 'Condutor', fem: false },
        { substantivo: 'Manopla', fem: true },
        { substantivo: 'Disparador', fem: false }
      ],
      vestidos: [
        { substantivo: 'Colete', fem: false },
        { substantivo: 'Manto', fem: false },
        { substantivo: 'Peitoral', fem: false },
        { substantivo: 'Braçadeira', fem: true },
        { substantivo: 'Arnês', fem: false }
      ],
      adjetivos: [
        { m: 'Galvânico', f: 'Galvânica' },
        { m: 'Trovejante', f: 'Trovejante' },
        { m: 'Voltáico', f: 'Voltáica' },
        { m: 'Centelhante', f: 'Centelhante' },
        { m: 'Iônico', f: 'Iônica' },
        { m: 'Fúlgido', f: 'Fúlgida' },
        { m: 'Elétrico', f: 'Elétrica' },
        { m: 'Magnético', f: 'Magnética' }
      ],
      descricoesEmp: [
        'Instrumento com bobinas de cobre e eletrodos de zinco que acumula carga estática antes de disparar arcos elétricos devastadores.',
        'Haste metálica com núcleo de âmbar e discos oscilantes que descarrega relâmpagos contínuos por indução galvânica.',
        'Disparador com acumuladores de alta voltagem e pontas condutoras que canalizam faíscas perfurantes.'
      ],
      descricoesVest: [
        'Indumentária com fiação condutora entrelaçada e dissipadores cerâmicos que acumulam energia eletrostática cinética.',
        'Armadura com bobinas em espiral no torso que armazenam relâmpagos e os descarregam ao menor comando físico.',
        'Peitoral imantado com placas de cobre e acumuladores que neutralizam atrito e desferem descargas fulgurantes.'
      ]
    },
    psiquico: {
      empunhados: [
        { substantivo: 'Emissor', fem: false },
        { substantivo: 'Disparador', fem: false },
        { substantivo: 'Injetor', fem: false },
        { substantivo: 'Ressonador', fem: false },
        { substantivo: 'Foco', fem: false }
      ],
      vestidos: [
        { substantivo: 'Elmo', fem: false },
        { substantivo: 'Tiara', fem: true },
        { substantivo: 'Colar', fem: false },
        { substantivo: 'Manto', fem: false },
        { substantivo: 'Amuleto', fem: false }
      ],
      adjetivos: [
        { m: 'Psíquico', f: 'Psíquica' },
        { m: 'Oscilante', f: 'Oscilante' },
        { m: 'Sináptico', f: 'Sináptica' },
        { m: 'Ressonante', f: 'Ressonante' },
        { m: 'Psiônico', f: 'Psiônica' },
        { m: 'Neural', f: 'Neural' },
        { m: 'Alucinatório', f: 'Alucinatória' },
        { m: 'Hipnótico', f: 'Hipnótica' }
      ],
      descricoesEmp: [
        'Mecanismo com diapasões de prata e cristais de quartzo sintonizados para propagar pulsos de choque direto nas sinapses do alvo.',
        'Aparato de foco mental com discos giratórios e bobinas sutis que emitem frequências sonoras e ondas indutoras de pavor.',
        'Dispositivo de sobrecarga neural que transmite impulsos de atordoamento e ilusão com altíssima precisão.'
      ],
      descricoesVest: [
        'Artefato craniano com filamentos de platina e microeletrodos que amplifica ondas cerebrais e as converte em comando psíquico.',
        'Diadema com prisma central lapidado que vibra em harmonia com a mente do usuário, propagando ondas sugestivas.',
        'Colar com ressonadores oscilantes de mercúrio que filtram e direcionam impulsos mentais perturbadores.'
      ]
    },
    protecao: {
      empunhados: [
        { substantivo: 'Defletor', fem: false },
        { substantivo: 'Gerador', fem: false },
        { substantivo: 'Bastão', fem: false },
        { substantivo: 'Projetor', fem: false },
        { substantivo: 'Emissor', fem: false }
      ],
      vestidos: [
        { substantivo: 'Casaco', fem: false },
        { substantivo: 'Couraça', fem: true },
        { substantivo: 'Peitoral', fem: false },
        { substantivo: 'Colete', fem: false },
        { substantivo: 'Arnês', fem: false }
      ],
      adjetivos: [
        { m: 'Cinético', f: 'Cinética' },
        { m: 'Blindado', f: 'Blindada' },
        { m: 'Prismático', f: 'Prismática' },
        { m: 'Isolante', f: 'Isolante' },
        { m: 'Refratário', f: 'Refratária' },
        { m: 'Fortificado', f: 'Fortificada' },
        { m: 'Amortecedor', f: 'Amortecedora' },
        { m: 'Hermético', f: 'Hermética' }
      ],
      descricoesEmp: [
        'Dispositivo compacto com giroscópios e molas tensoras que gera um campo de repulsão mecânica contra impactos.',
        'Emissor com lentes refratárias e contrapesos magnéticos que projeta barreiras translúcidas protetoras.',
        'Bastão com cúpula de quartzo e molas pneumáticas que amortece impactos e desvia projéteis velozes.'
      ],
      descricoesVest: [
        'Traje reforçado com placas segmentadas de aço e amortecedores hidráulicos sob medida contra ferimentos.',
        'Armadura com exoesqueleto articulado e placas de sobreposição que absorvem golpes brutais sem perda de agilidade.',
        'Peitoral hermético com revestimento duplo de ligas leves que dissipa impacto e desvia agressões.'
      ]
    },
    cura: {
      empunhados: [
        { substantivo: 'Injetor', fem: false },
        { substantivo: 'Dispersor', fem: false },
        { substantivo: 'Vaporizador', fem: false },
        { substantivo: 'Aplicador', fem: false },
        { substantivo: 'Restaurador', fem: false }
      ],
      vestidos: [
        { substantivo: 'Colete', fem: false },
        { substantivo: 'Cinto', fem: false },
        { substantivo: 'Arnês', fem: false },
        { substantivo: 'Faixa', fem: true },
        { substantivo: 'Braçadeira', fem: true }
      ],
      adjetivos: [
        { m: 'Alquímico', f: 'Alquímica' },
        { m: 'Regenerativo', f: 'Regenerativa' },
        { m: 'Osmótico', f: 'Osmótica' },
        { m: 'Revigorante', f: 'Revigorante' },
        { m: 'Biomecânico', f: 'Biomecânica' },
        { m: 'Tônico', f: 'Tônica' },
        { m: 'Purificador', f: 'Purificadora' },
        { m: 'Celular', f: 'Celular' }
      ],
      descricoesEmp: [
        'Instrumento dosador com ampolas de bálsamo e pistão pneumático que injeta compostos regenerativos instantâneos.',
        'Vaporizador sob pressão com microbicos que aspergiram névoa salina esterilizante e restauradora de tecidos.',
        'Aparato de precisão com microagulhas acopladas para infusão rápida de compostos catalisadores de vitalidade.'
      ],
      descricoesVest: [
        'Colete provido de condutores de fluido e bolsas compressoras que ministram tônicos revigorantes no corpo do usuário.',
        'Cinto utilitário com dosadores automáticos de pressão que injetam substâncias cicatrizantes ao sinal de trauma físico.',
        'Arnês articulado com ampolas térmicas que estabilizam sinais vitais e aceleram a coagulação por osmose.'
      ]
    },
    movimento: {
      empunhados: [
        { substantivo: 'Propulsor', fem: false },
        { substantivo: 'Ativador', fem: false },
        { substantivo: 'Disparador', fem: false },
        { substantivo: 'Manipulador', fem: false },
        { substantivo: 'Regulador', fem: false }
      ],
      vestidos: [
        { substantivo: 'Arnês', fem: false },
        { substantivo: 'Cinto', fem: false },
        { substantivo: 'Bota', fem: true },
        { substantivo: 'Mochila', fem: true },
        { substantivo: 'Colete', fem: false }
      ],
      adjetivos: [
        { m: 'Pneumático', f: 'Pneumática' },
        { m: 'Cinético', f: 'Cinética' },
        { m: 'Propulsor', f: 'Propulsora' },
        { m: 'Acelerado', f: 'Acelerada' },
        { m: 'Vetorial', f: 'Vetorial' },
        { m: 'Eólico', f: 'Eólica' },
        { m: 'Flutuante', f: 'Flutuante' },
        { m: 'Veloz', f: 'Veloz' }
      ],
      descricoesEmp: [
        'Aparato de impulsão vetorial com pistões a ar comprimido que desloca pesos e impulsiona corpos com velocidade espantosa.',
        'Instrumento de tração com roldanas de precisão e cabo de aço estendido que projeta forças aceleradas instantâneas.',
        'Regulador portátil com válvulas de escape rápido calibrado para multiplicar a inércia e acelerar manobras.'
      ],
      descricoesVest: [
        'Equipamento corporal articulado com jatos pneumáticos dorsais e molas nas juntas que multiplicam a locomoção.',
        'Cinto cinético com volantes giratórios de alta rotação que geram empuxo vertical e amortecem quedas.',
        'Botas mecânicas providas de calhas de compressão a gás que impulsionam saltos vertiginosos e corridas sobre-humanas.'
      ]
    },
    frio: {
      empunhados: [
        { substantivo: 'Lançador', fem: false },
        { substantivo: 'Condensador', fem: false },
        { substantivo: 'Projetor', fem: false },
        { substantivo: 'Canhão', fem: false },
        { substantivo: 'Bocal', fem: false }
      ],
      vestidos: [
        { substantivo: 'Manto', fem: false },
        { substantivo: 'Sobretudo', fem: false },
        { substantivo: 'Capuz', fem: false },
        { substantivo: 'Peitoral', fem: false },
        { substantivo: 'Bota', fem: true }
      ],
      adjetivos: [
        { m: 'Criogênico', f: 'Criogênica' },
        { m: 'Glacial', f: 'Glacial' },
        { m: 'Gélido', f: 'Gélida' },
        { m: 'Congelante', f: 'Congelante' },
        { m: 'Polar', f: 'Polar' },
        { m: 'Frígido', f: 'Frígida' },
        { m: 'Ártico', f: 'Ártica' },
        { m: 'Condensador', f: 'Condensadora' }
      ],
      descricoesEmp: [
        'Dispositivo com cilindros de gás liquefeito e serpentinas de expansão rápida que projeta ventanias congelantes e geada espessa.',
        'Aparato com câmara de descompressão criogênica e bocais de latão que congela a umidade do ar e expele fragmentos pontiagudos de gelo.',
        'Canhão de gelo pressurizado com válvulas de escape endotérmico que resfria alvos instantaneamente a temperaturas glaciais.'
      ],
      descricoesVest: [
        'Sobretudo forrado com placas térmicas reversas e condensadores de frio que mantêm uma névoa gélida isolante ao redor do corpo.',
        'Manto provido de tecidos isolantes e tubos capilares de fluido refrigerante que absorve calor ambiente e resfria o ar circundante.',
        'Peitoral com placas térmicas compensadoras e serpentinas de amônia que dissipa choques térmicos e projeta rajadas glaciais.'
      ]
    },
    acido: {
      empunhados: [
        { substantivo: 'Aspersor', fem: false },
        { substantivo: 'Injetor', fem: false },
        { substantivo: 'Pulverizador', fem: false },
        { substantivo: 'Disparador', fem: false },
        { substantivo: 'Canhão', fem: false }
      ],
      vestidos: [
        { substantivo: 'Colete', fem: false },
        { substantivo: 'Avental', fem: false },
        { substantivo: 'Arnês', fem: false },
        { substantivo: 'Capa', fem: true },
        { substantivo: 'Luva', fem: true }
      ],
      adjetivos: [
        { m: 'Cáustico', f: 'Cáustica' },
        { m: 'Corrosivo', f: 'Corrosiva' },
        { m: 'Alquímico', f: 'Alquímica' },
        { m: 'Tóxico', f: 'Tóxica' },
        { m: 'Dissolvente', f: 'Dissolvente' },
        { m: 'Ácido', f: 'Ácida' },
        { m: 'Fétido', f: 'Fétida' },
        { m: 'Degradante', f: 'Degradante' }
      ],
      descricoesEmp: [
        'Aparato aspersor de vidro temperado e tubulações de chumbo que dispara jatos sob pressão de ácidos minerais corrosivos.',
        'Pulverizador pneumático com bocal de cerâmica reforçada projetado para expelir névoas cáusticas que dissolvem matéria orgânica e metal.',
        'Injetor de vitríolo com pistões manuais e diafragmas resistentes a solventes para ataque químico concentrado.'
      ],
      descricoesVest: [
        'Vestimenta com forro impermeabilizado de borracha e tanques dorsais selados que borrifa compostos corrosivos em torno do usuário.',
        'Avental reforçado com resinas cerâmicas e tubos de dosagem que neutraliza respingos e expele vapores dissolventes.',
        'Arnês articulado com câmaras de vidro espesso que liberam agentes químicos degradantes contra agressores próximos.'
      ]
    },
    trevas: {
      empunhados: [
        { substantivo: 'Foco', fem: false },
        { substantivo: 'Projetor', fem: false },
        { substantivo: 'Emissor', fem: false },
        { substantivo: 'Condutor', fem: false },
        { substantivo: 'Cetro', fem: false }
      ],
      vestidos: [
        { substantivo: 'Manto', fem: false },
        { substantivo: 'Capuz', fem: false },
        { substantivo: 'Túnica', fem: true },
        { substantivo: 'Máscara', fem: true },
        { substantivo: 'Amuleto', fem: false }
      ],
      adjetivos: [
        { m: 'Sombrio', f: 'Sombria' },
        { m: 'Entrópico', f: 'Entrópica' },
        { m: 'Espectral', f: 'Espectral' },
        { m: 'Noturno', f: 'Noturna' },
        { m: 'Obscuro', f: 'Obscura' },
        { m: 'Necrótico', f: 'Necrótica' },
        { m: 'Sinistro', f: 'Sinistra' },
        { m: 'Fúnebre', f: 'Fúnebre' }
      ],
      descricoesEmp: [
        'Aparato com prismas de obsidiana e espelhos côncavos que aprisiona feixes de luz e projeta trevas densas e asfixiantes.',
        'Instrumento com núcleos de carvão alquímico e diafragmas oscilantes que absorve espectros luminosos e espalha sombras inquietantes.',
        'Foco com ressonadores de ferro frio sintonizados para propagar frequências de decaimento entrópico e pavor.'
      ],
      descricoesVest: [
        'Manto tramado com fios de seda negra e coletores de radiação sombria que obscurece a silhueta e confunde a visão inimiga.',
        'Capuz com lentes de quartzo escurecido e filtros ópticos polarizados que envolve a cabeça em uma mortalha de trevas.',
        'Túnica provida de forro absorvedor de fótons e anéis de retenção de sombra que dissipa luz e intimida atacantes.'
      ]
    },
    luz: {
      empunhados: [
        { substantivo: 'Projetor', fem: false },
        { substantivo: 'Farol', fem: false },
        { substantivo: 'Foco', fem: false },
        { substantivo: 'Bastão', fem: false },
        { substantivo: 'Emissor', fem: false }
      ],
      vestidos: [
        { substantivo: 'Diadema', fem: false },
        { substantivo: 'Peitoral', fem: false },
        { substantivo: 'Colar', fem: false },
        { substantivo: 'Elmo', fem: false },
        { substantivo: 'Tiara', fem: true }
      ],
      adjetivos: [
        { m: 'Solar', f: 'Solar' },
        { m: 'Fotônico', f: 'Fotônica' },
        { m: 'Radiante', f: 'Radiante' },
        { m: 'Luminescente', f: 'Luminescente' },
        { m: 'Prismático', f: 'Prismática' },
        { m: 'Fúlgido', f: 'Fúlgida' },
        { m: 'Cintilante', f: 'Cintilante' },
        { m: 'Auroral', f: 'Auroral' }
      ],
      descricoesEmp: [
        'Aparato com espelhos parabólicos e lâmpada de arco voltaico de magnésio que dispara feixes deslumbrantes de claridade solar.',
        'Projetor com lentes ópticas de quartzo puro e dínamos de corda que concentra luz radiante capaz de cegar ou purificar.',
        'Farol portátil com prismas refratários de cristal que ilumina vastas áreas e dispersa sombras mágicas instantaneamente.'
      ],
      descricoesVest: [
        'Diadema com prisma facetado e coletores de fótons que emite uma aura radiante e dissipa ilusões à visão.',
        'Peitoral polido com espelhos angulares e filamentos fluorescentes que refrata feixes ofuscantes ao redor do usuário.',
        'Colar com gema luminescente lapidada e dínamos piezoelétricos que brilha com intensidade pura ao comando do criador.'
      ]
    },
    terra: {
      empunhados: [
        { substantivo: 'Martelo', fem: false },
        { substantivo: 'Impactador', fem: false },
        { substantivo: 'Ressonador', fem: false },
        { substantivo: 'Canhão', fem: false },
        { substantivo: 'Perfurador', fem: false }
      ],
      vestidos: [
        { substantivo: 'Peitoral', fem: false },
        { substantivo: 'Cinto', fem: false },
        { substantivo: 'Arnês', fem: false },
        { substantivo: 'Manopla', fem: true },
        { substantivo: 'Greva', fem: true }
      ],
      adjetivos: [
        { m: 'Telúrico', f: 'Telúrica' },
        { m: 'Sísmico', f: 'Sísmica' },
        { m: 'Magnético', f: 'Magnética' },
        { m: 'Tectônico', f: 'Tectônica' },
        { m: 'Rochoso', f: 'Rochosa' },
        { m: 'Gravitacional', f: 'Gravitacional' },
        { m: 'Denso', f: 'Densa' },
        { m: 'Titânico', f: 'Titânica' }
      ],
      descricoesEmp: [
        'Aparato de percussão hidráulica com massas oscilantes que transmite ondas de choque telúricas devastadoras pelo solo.',
        'Dispositivo com eletroímãs de neodímio e contrapesos rotativos que manipula campos gravitacionais e arremessa pedras.',
        'Ressonador acústico de baixa frequência com pistões reforçados que racha pedra e abala as estruturas ao redor.'
      ],
      descricoesVest: [
        'Manoplas pesadas de bronze com acionadores de mola interna que multiplicam o impacto físico e esmagam minerais.',
        'Cinto sísmico com lastros de chumbo e estabilizadores inerciais que ancora o inventor com firmeza inabalável ao solo.',
        'Grevas com pinos retráteis e pistões pneumáticos que fincam no terreno para resistir a empurrões e gerar impactos sísmicos.'
      ]
    },
    geral: {
      empunhados: [
        { substantivo: 'Emissor', fem: false },
        { substantivo: 'Disparador', fem: false },
        { substantivo: 'Projetor', fem: false },
        { substantivo: 'Ressonador', fem: false },
        { substantivo: 'Condutor', fem: false }
      ],
      vestidos: [
        { substantivo: 'Manto', fem: false },
        { substantivo: 'Colete', fem: false },
        { substantivo: 'Arnês', fem: false },
        { substantivo: 'Amuleto', fem: false },
        { substantivo: 'Cinto', fem: false }
      ],
      adjetivos: [
        { m: 'Arcano', f: 'Arcana' },
        { m: 'Engenhoso', f: 'Engenhosa' },
        { m: 'Mecânico', f: 'Mecânica' },
        { m: 'Ressonante', f: 'Ressonante' },
        { m: 'Alquímico', f: 'Alquímica' },
        { m: 'Prismático', f: 'Prismática' },
        { m: 'Articulado', f: 'Articulada' },
        { m: 'Harmônico', f: 'Harmônica' }
      ],
      descricoesEmp: [
        'Dispositivo de precisão com cilindros pressurizados e engrenagens de latão que catalisam efeitos energéticos refinados.',
        'Aparato empunhado com carretéis condutores e válvulas de retenção que modulam forças arcanas com grande eficácia.',
        'Instrumento com lentes convergentes e dínamos manuais que manifesta a magia por meio de impulsos mecânicos contínuos.'
      ],
      descricoesVest: [
        'Artefato acoplado ao vestuário dotado de fiação rúnica e amortecedores que sincroniza efeitos com os movimentos do inventor.',
        'Indumentária reforçada com câmaras de compensação e ressonadores que canaliza propriedades especiais ao redor do usuário.',
        'Peça com travas de segurança e anéis reguladores que libera fluxos controlados para replicar os efeitos mágicos desejados.'
      ]
    }
  };

  /**
   * Identifica o tema léxico mais adequado para uma magia com base em seu ID, nome e escola.
   * @param {any} spellOrNome
   * @returns {keyof typeof LEXICO_ENGENHOCAS}
   */
  function identificarTemaMagia(spellOrNome) {
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
    if (/frio|gelo|gead|glacial|neve|congel|inver|tempestade de neve|uivant/i.test(full)) return 'frio';
    if (/acid|ácid|corros|caust|cáust|venen|peconh|peçonh|tox|tóx|dissolv/i.test(full)) return 'acido';
    if (/trev|sombra|escuro|necrom|morte|espectr|morto|cadaver|cadáver|ossos|amaldic|amaldiç/i.test(full) || escola === 'necromancia') return 'trevas';
    if (/luz|ilumin|solar|clar|brilho|radiant|sagrad|abenc|abenç|aurora|farol/i.test(full)) return 'luz';
    if (/terra|pedra|rocha|sism|sísm|gravid|telur|telúr|impacto|metal|ferro|lama|areia/i.test(full)) return 'terra';
    if (/fogo|flam|chama|incend|incênd|calor|sol|combust|piro|explos/i.test(full)) return 'fogo';
    if (/relamp|relâmp|choque|elet|elét|raio|trovao|trovão|trov|volta|ion|iôn/i.test(full)) return 'eletricidade';
    if (/mental|mente|psiqu|psíqu|psion|psiôn|ilus|sonho|hipn|hipnó|medo|pavor|panico|pânico|desespero|sono|sussurro|comando|sugest/i.test(full)) return 'psiquico';
    if (/armadura|escudo|resistencia|resistência|campo|protecao|proteção|barreira|abjur|muralha|tranca|inviol/i.test(full) || escola === 'abjuracao' || escola === 'abjuração') return 'protecao';
    if (/cura|ferimento|purific|vital|alivio|alívio|restaur|vida|repar|sang/i.test(full)) return 'cura';
    if (/voo|velocidade|salto|queda|vento|ar|passo|teletransporte|movimento|patins|levita/i.test(full)) return 'movimento';

    if (escola === 'evocacao' || escola === 'evocação') return 'fogo';
    if (escola === 'encantamento' || escola === 'ilusao' || escola === 'ilusão' || escola === 'adivinhacao' || escola === 'adivinhação') return 'psiquico';
    if (escola === 'transmutacao' || escola === 'transmutação' || escola === 'convocacao' || escola === 'convocação') return 'movimento';
    return 'geral';
  }

  /**
   * Gera uma lista de 3 sugestões seguindo estritamente as regras:
   * - Sugestão 1: Substantivo + Adjetivo 1 + Adjetivo 2
   * - Sugestão 2: Substantivo + Adjetivo 3 + Adjetivo 4
   * - Sugestão 3: Substantivo + Adjetivo 5
   * @param {'empunhada' | 'vestida'} forma
   * @param {keyof typeof LEXICO_ENGENHOCAS} temaKey
   * @returns {{ sugestoes: string[], descricoes: string[] }}
   */
  function gerarTresSugestoesGramaticais(forma, temaKey) {
    const tema = LEXICO_ENGENHOCAS[temaKey] || LEXICO_ENGENHOCAS.geral;
    const isVest = forma === 'vestida';
    const subList = isVest ? tema.vestidos : tema.empunhados;
    const descList = isVest ? tema.descricoesVest : tema.descricoesEmp;
    const adjs = tema.adjetivos;

    // Item 1: Subst1 + Adj1 + Adj2
    const s1 = subList[0];
    const adj1_1 = s1.fem ? adjs[0].f : adjs[0].m;
    const adj1_2 = s1.fem ? adjs[1].f : adjs[1].m;
    const nome1 = `${s1.substantivo} ${adj1_1} ${adj1_2}`;

    // Item 2: Subst2 + Adj3 + Adj4
    const s2 = subList[1] || subList[0];
    const adj2_1 = s2.fem ? adjs[2].f : adjs[2].m;
    const adj2_2 = s2.fem ? adjs[3].f : adjs[3].m;
    const nome2 = `${s2.substantivo} ${adj2_1} ${adj2_2}`;

    // Item 3: Subst3 + Adj5
    const s3 = subList[2] || subList[0];
    const adj3_1 = s3.fem ? adjs[4].f : adjs[4].m;
    const nome3 = `${s3.substantivo} ${adj3_1}`;

    return {
      sugestoes: [nome1, nome2, nome3],
      descricoes: [descList[0], descList[1], descList[2]]
    };
  }

  /**
   * Obtém as 6 sugestões completas de uma magia (3 empunhadas e 3 vestidas) com regra gramatical estrita.
   * - Sugestão 1 e 2: Substantivo + 2 Adjetivos
   * - Sugestão 3: Substantivo + 1 Adjetivo
   * @param {any} spellOrNome
   * @param {string} [formaEspecifica] - Se informado ('empunhada' ou 'vestida'), retorna as opções correspondentes.
   * @returns {{
   *   formaRecomendada: 'empunhada' | 'vestida',
   *   sugestoes: string[],
   *   descricoes: string[],
   *   opcoesPorForma: {
   *     empunhada: { sugestoes: string[], descricoes: string[] },
   *     vestida: { sugestoes: string[], descricoes: string[] }
   *   }
   * }}
   */
  function obterOpcoesEngenhoca(spellOrNome, formaEspecifica) {
    let id = '';
    let nome = '';
    if (spellOrNome && typeof spellOrNome === 'object') {
      id = String(spellOrNome.id || spellOrNome.key || '').toLowerCase().replace(/_/g, '-');
      nome = String(spellOrNome.nome || spellOrNome.name || '').toLowerCase();
    } else {
      nome = String(spellOrNome || '').toLowerCase();
      id = nome.replace(/\s+/g, '-');
    }

    // Identifica forma recomendada (de acordo com catálogo ou heurística)
    let formaRecomendada = 'empunhada';
    // @ts-ignore
    if (typeof DATA !== 'undefined' && Array.isArray(DATA.contraptionsCatalog)) {
      // @ts-ignore
      const found = DATA.contraptionsCatalog.find(c => c.id === id || String(c.name || '').toLowerCase() === nome);
      if (found && found.forma) {
        formaRecomendada = found.forma;
      }
    } else if (/armadura|casaco|peitoral|manto|cinto|elmo|botas|anel|tiara|pingente|amuleto/i.test(nome)) {
      formaRecomendada = 'vestida';
    }

    const temaKey = identificarTemaMagia(spellOrNome);
    const empunhadas = gerarTresSugestoesGramaticais('empunhada', temaKey);
    const vestidas = gerarTresSugestoesGramaticais('vestida', temaKey);

    const formaEscolhida = (formaEspecifica === 'vestida' || formaEspecifica === 'empunhada')
      ? formaEspecifica
      : formaRecomendada;

    const ativas = formaEscolhida === 'vestida' ? vestidas : empunhadas;

    return {
      formaRecomendada: formaEscolhida,
      sugestoes: ativas.sugestoes,
      descricoes: ativas.descricoes,
      opcoesPorForma: {
        empunhada: empunhadas,
        vestida: vestidas
      }
    };
  }

  /**
   * Retorna uma descrição temática detalhada para a engenhoca.
   * @param {any} nomeOuSpell
   * @param {any} [spellOuForma]
   * @param {any} [formaOuIndex]
   * @param {number} [index]
   * @returns {string}
   */
  function gerarDescricaoEngenhoca(nomeOuSpell, spellOuForma, formaOuIndex, index) {
    let nome = '';
    let spell = null;
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
    if (nomeNorm.includes('purificador') || nomeNorm.includes('osmotic') || nomeNorm.includes('filtro') || (spell && String(spell.nome||'').toLowerCase().includes('alimento'))) {
      return 'Aparato hermético com filtros de carvão ativado, membranas de celulose semipermeáveis e serpentinas de condensação para decantação e purificação profunda.';
    }

    const opts = obterOpcoesEngenhoca(spell || nome, forma);
    return (opts.descricoes && opts.descricoes[idx]) || 'Engenhoca engenhosa repleta de pistões, válvulas de escape e filamentos arcanos.';
  }

  /**
   * Normaliza qualquer nome de treino de ofício para a chave canônica da oficina.
   * @param {string} nomeOficio
   * @returns {string}
   */
  function normalizarOficio(nomeOficio) {
    const raw = String(nomeOficio || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (raw.includes('armeir') || raw.includes('ferreir') || raw.includes('forjad')) return 'armeiro';
    if (raw.includes('alfaiat') || raw.includes('tecel') || raw.includes('costur')) return 'alfaiate';
    if (raw.includes('alquim')) return 'alquimista';
    if (raw.includes('engenh') || raw.includes('inventor')) return 'engenhoqueiro';
    if (raw.includes('carpinteir') || raw.includes('marceneir')) return 'carpinteiro';
    if (raw.includes('pedreir') || raw.includes('alvenar') || raw.includes('construt')) return 'pedreiro';
    if (raw.includes('ourive') || raw.includes('joalh')) return 'joalheiro';
    if (raw.includes('escrib') || raw.includes('cartog') || raw.includes('caligr')) return 'escriba';
    if (raw.includes('cozinh') || raw.includes('culinar') || raw.includes('padeir') || raw.includes('cervej')) return 'cozinheiro';
    if (raw.includes('tatuad')) return 'tatuador';
    if (raw.includes('miner') || raw.includes('garimp')) return 'minerador';
    if (raw.includes('fazend') || raw.includes('agricol') || raw.includes('plant')) return 'fazendeiro';
    if (raw.includes('pescad')) return 'pescador';
    if (raw.includes('estalajad') || raw.includes('hosped')) return 'estalajadeiro';
    if (raw.includes('pintor') || raw.includes('pintur') || raw.includes('artist')) return 'pintor';
    if (raw.includes('escult')) return 'escultor';
    if (raw.includes('artes') || raw.includes('coureir')) return 'artesao';
    return 'artesao';
  }

  /**
   * Retorna o nome canônico do local de trabalho (oficina) para um treino de Ofício.
   * Se for um local conhecido usa o nome consagrado (ex: Forja do Ferreiro, Laboratório do Alquimista),
   * senão padroniza como 'Oficina de [Ofício]'.
   * @param {string} nomeOficio
   * @returns {string}
   */
  function obterNomeEstacao(nomeOficio) {
    const norm = normalizarOficio(nomeOficio);
    if (secoesOficina[norm]) {
      return secoesOficina[norm].title;
    }
    const clean = String(nomeOficio || '').replace(/^Ofício\s*\(|\)$/gi, '').trim();
    return clean ? `Oficina de ${clean}` : 'Oficina de Manufatura';
  }

  /**
   * Filtra itens de um catálogo para uma determinada oficina, excluindo itens exclusivos de origem.
   * @param {Array<any>} catalogo
   * @param {string} chaveOficio
   * @param {Set<string>|Array<string>} [itensExclusivos]
   * @returns {Array<any>}
   */
  function filtrarItensPorOficio(catalogo, chaveOficio, itensExclusivos) {
    if (!Array.isArray(catalogo)) return [];
    const secao = secoesOficina[chaveOficio] || secoesOficina.artesao;
    const exclusivos = itensExclusivos instanceof Set ? itensExclusivos : new Set(itensExclusivos || []);

    return catalogo.filter(item => {
      if (!item) return false;
      const preco = Number(item.preco?.valor ?? item.price ?? 0);
      if (preco <= 0) return false;
      if (item.origemExclusiva || exclusivos.has(item.id)) return false;
      return secao.corresponde(item);
    });
  }

  function isArmeiroArmadoWithSuperiorCrafting(item) {
    if (!item || item.tipo !== 'arma') return false;
    if (typeof state === 'undefined' || !state) return false;
    const isArmeiro = state.origin?.mode === 'dual' && (typeof slug === 'function' ? slug(typeof selectedRegionalOrigin === 'function' ? selectedRegionalOrigin()?.nome || '' : state.origin?.regional || '') : '') === 'armeiro_armado';
    if (!isArmeiro) return false;
    const inventorLevel = typeof characterClassLevel === 'function'
      ? characterClassLevel('inventor')
      : (Array.isArray(state.progression) && state.progression.length > 0
          ? state.progression.filter(row => row.classId === 'inventor').length
          : (state.identity?.classId === 'inventor' ? (Number(state.identity?.plannedLevel) || 1) : 0));
    return inventorLevel >= 2;
  }

  /**
   * Calcula o custo e CD para aprimorar um item existente.
   * Custo de matéria-prima é 1/3 da melhoria adicional (ou 1/4 para Armeiro Armado com outra fonte de item superior).
   * @param {any} item
   * @param {number} qtdMelhoriasAtuais
   * @param {number} qtdNovasMelhoriasTotais
   * @param {number} [custoMaterialAdicional]
   * @param {any} [opcoes]
   * @returns {{ custoMercadoMelhoria: number, custoMateriaPrima: number, cdFabricacao: number, cdSuperior: number, cdBase: number }}
   */
  function calcularAprimoramentoItemExistente(item, qtdMelhoriasAtuais, qtdNovasMelhoriasTotais, custoMaterialAdicional = 0, opcoes = {}) {
    const prev = Math.min(4, Math.max(0, Number(qtdMelhoriasAtuais) || 0));
    const next = Math.min(4, Math.max(0, Number(qtdNovasMelhoriasTotais) || 0));
    const baseDiff = Math.max(0, (TABELA_MELHORIAS[next] || 0) - (TABELA_MELHORIAS[prev] || 0));
    const custoMercadoMelhoria = baseDiff + Math.max(0, Number(custoMaterialAdicional) || 0);
    const isQuarterDiscount = opcoes.fracao === '1/4' || isArmeiroArmadoWithSuperiorCrafting(item);
    const materiaPrima = custoMateriaPrima(custoMercadoMelhoria, isQuarterDiscount ? { ...opcoes, fracao: '1/4' } : opcoes);
    const cdBase = cdFabricacao(item);
    const cdSuperior = CD_MELHORIAS[next] || 0;
    const cd = cdBase + cdSuperior;
    return {
      custoMercadoMelhoria,
      custoMateriaPrima: materiaPrima,
      cdFabricacao: cd,
      cdSuperior,
      cdBase
    };
  }

  /**
   * Verifica se um item pode receber melhorias (itens superiores) segundo as regras de T20.
   * Elegíveis: armas, armaduras, escudos, vestuário e esotéricos (incluindo específicos dessas categorias).
   * Proibidos: alquímicos, consumíveis, munições, poções, comidas, engenhocas e itens gerais comuns.
   * @param {any} item
   * @returns {boolean}
   */
  function podeReceberMelhorias(item) {
    if (!item) return false;
    const cat = String(item.categoriaId || '').toLowerCase();
    const tipo = String(item.tipo || '').toLowerCase();
    if (tipo === 'aparato' || cat === 'aparato' || Boolean(item.isAparato)) return false;
    const isEng = Boolean(item.isEngenhoca || item.contraptionId || item.tipo === 'engenhoca' || item.categoriaId === 'engenhoca');
    if (isEng) {
      // Regra T20: Engenhocas NÃO recebem melhorias normais, EXCETO se tiverem o aparato "Espera para Melhorias"
      return limiteMelhoriasEngenhoca(item) > 0;
    }
    const nome = String(item.nome || item.name || '').toLowerCase();

    // Alquímicos nunca recebem melhorias
    if (tipo === 'alquimico' || cat.startsWith('alquimico') || cat === 'veneno' || cat === 'preparado' || cat === 'catalisador') return false;
    // Consumíveis e munição
    if (tipo === 'municao' || cat === 'municao' || tipo === 'pocao' || tipo === 'pergaminho' || tipo === 'comida' || tipo === 'aliment' || cat.includes('pocao') || cat.includes('aliment')) return false;

    // Armas, armaduras e escudos
    if (tipo === 'arma' || tipo === 'armadura' || tipo === 'escudo') return true;
    // Esotéricos
    if (tipo === 'esoterico' || cat === 'esoterico' || nome.includes('esoterico') || nome.includes('esotérico')) return true;
    // Vestuário
    if (cat === 'vestuario' || cat === 'vestuário' || nome.includes('traje') || nome.includes('vestimenta') || nome.includes('manto') || nome.includes('camisa')) return true;

    return false;
  }

  /**
   * Verifica se um item pode receber encantos (itens mágicos) segundo as regras de T20.
   * Elegíveis: armas, armaduras, escudos e esotéricos mundanos/superiores.
   * Proibidos: itens específicos (não recebem novos encantos), alquímicos, vestuários comuns, consumíveis, engenhocas, aparatos.
   * @param {any} item
   * @returns {boolean}
   */
  function podeReceberEncantos(item) {
    if (!item) return false;
    const cat = String(item.categoriaId || '').toLowerCase();
    const tipo = String(item.tipo || '').toLowerCase();
    // Aparatos e engenhocas NUNCA recebem encantos mágicos
    if (tipo === 'aparato' || cat === 'aparato' || Boolean(item.isAparato)) return false;
    if (Boolean(item.isEngenhoca || item.contraptionId || item.tipo === 'engenhoca' || item.categoriaId === 'engenhoca')) return false;
    if (!podeReceberMelhorias(item)) return false;

    // Itens específicos NÃO podem receber encantos adicionais
    const isSpecific = Boolean(
      (item.magico && (item.magico.tipo === 'especifico' || item.magico.tipo === 'liturgico')) ||
      item.especifico ||
      item.isSpecific ||
      item.magico?.caracteristicasFixas?.length
    );
    if (isSpecific) return false;
    const nome = String(item.nome || item.name || '').toLowerCase();

    // Apenas armas, armaduras, escudos e esotéricos recebem encantos mágicos
    if (tipo === 'arma' || tipo === 'armadura' || tipo === 'escudo') return true;
    if (tipo === 'esoterico' || cat === 'esoterico' || nome.includes('esoterico') || nome.includes('esotérico')) return true;

    return false;
  }

  /**
   * Determina qual chave de oficina/ofício é necessária para aprimorar um item.
   * @param {any} item
   * @returns {'armeiro' | 'alfaiate' | 'artesao' | string}
   */
  function oficioNecessarioParaAprimorar(item) {
    if (!item) return 'artesao';
    const tipo = String(item.tipo || '').toLowerCase();
    const cat = String(item.categoriaId || '').toLowerCase();
    const nome = String(item.nome || item.name || '').toLowerCase();

    if (tipo === 'arma' || tipo === 'armadura' || tipo === 'escudo') return 'armeiro';
    if (tipo === 'vestuario' || tipo === 'vestuário' || cat === 'vestuario' || cat === 'vestuário' || nome.includes('traje') || nome.includes('vestimenta') || nome.includes('manto') || nome.includes('camisa')) return 'alfaiate';
    if (tipo === 'esoterico' || cat === 'esoterico' || nome.includes('esoterico') || nome.includes('esotérico')) return 'artesao';
    return 'artesao';
  }

  /**
   * Classifica a função e o nicho de uma magia simulada para determinar
   * itens mundanos compatíveis para acoplamento em engenhocas.
   * @param {any} spell
   * @returns {{ categoria: string, label: string, permitidos: string, tiposValidos: string[] }}
   */
  function classificarEfeitoMagia(spell) {
    if (!spell) {
      return {
        categoria: 'utilitario',
        label: 'Utilitário Geral',
        permitidos: 'Itens de aventura, ferramentas e vestuário',
        tiposValidos: ['equipamento_aventura', 'ferramenta', 'instrumento', 'esoterico', 'vestuario', 'item_geral']
      };
    }
    const id = String(spell.id || spell.key || '').toLowerCase().replace(/_/g, '-');
    const nome = String(spell.nome || spell.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const escola = String(spell.escola || spell.school || '').toLowerCase();
    const alvo = String(spell.alvo || spell.target || '').toLowerCase();

    // 1. Defesa / Proteção
    const isArmaduraArcana = id === 'armadura-arcana' || nome.includes('armadura arcana');
    if (isArmaduraArcana) {
      return {
        categoria: 'defesa_sem_armadura',
        label: 'Defesa Arcana',
        permitidos: 'Vestuário e trajes (Ofício Alfaiate) ou escudo em armaduras (Ofício Armeiro).',
        tiposValidos: ['vestuario', 'escudo', 'armadura']
      };
    }

    const isDefesa = id === 'escudo-da-fe' || id === 'vestimenta-da-fe' ||
      id === 'campo-de-forca' || id === 'resistencia-a-energia' || id === 'pele-de-pedra' ||
      id === 'barreira-mistica' || id === 'manto-de-sombras' || id === 'santuario' ||
      id === 'protecao-contra-magia' || id === 'guardiao-divino' ||
      alvo.includes('armadura') || alvo.includes('escudo') ||
      nome.includes('escudo') || nome.includes('armadura') || nome.includes('vestimenta') ||
      nome.includes('barreira') || nome.includes('campo de forca') || nome.includes('pele de pedra') ||
      (escola === 'abjuracao' && (nome.includes('protec') || nome.includes('resisten') || nome.includes('defes')));

    if (isDefesa) {
      return {
        categoria: 'defesa',
        label: 'Defesa e Proteção',
        permitidos: 'Escudos, armaduras e vestuário protetor (PROIBIDO em armas)',
        tiposValidos: ['escudo', 'armadura', 'vestuario']
      };
    }

    // 2. Ataque / Combate com Arma
    const isAtaqueArma = id === 'arma-magica' || id === 'espada-divina' || id === 'arma-espiritual' ||
      id === 'armamento-da-natureza' || id === 'concentracao-de-combate' || id === 'toque-chocante' ||
      id === 'golpe-divino' || id === 'golpe-flamejante' || id === 'presas-primordiais' ||
      id === 'flecha-de-fogo' || id === 'tiro-certeiro' ||
      alvo.includes('arma') || nome.includes('arma') || nome.includes('espada') ||
      nome.includes('golpe') || nome.includes('lamina') || nome.includes('lâmina') ||
      nome.includes('machado') || nome.includes('flecha');

    if (isAtaqueArma) {
      return {
        categoria: 'ataque_arma',
        label: 'Combate e Ataque',
        permitidos: 'Armas mundanas (PROIBIDO em armaduras e escudos)',
        tiposValidos: ['arma']
      };
    }

    // 3. Mobilidade e Deslocamento
    const isMobilidade = id === 'salto' || id === 'velocidade' || id === 'queda-suave' ||
      id === 'voo' || id === 'passo-sem-pegadas' || id === 'caminhar-sobre-as-aguas' ||
      id === 'teletransporte' || id === 'forma-gasosa' || id === 'pisar-no-vacuo' ||
      nome.includes('salto') || nome.includes('velocidade') || nome.includes('queda') ||
      nome.includes('voo') || nome.includes('passo') || nome.includes('caminhar') ||
      nome.includes('teletransporte') || nome.includes('patins') || nome.includes('andar');

    if (isMobilidade) {
      return {
        categoria: 'mobilidade',
        label: 'Mobilidade e Deslocamento',
        permitidos: 'Vestuário (botas, mantos, cintos) e equipamentos de aventura',
        tiposValidos: ['vestuario', 'equipamento_aventura', 'item_geral']
      };
    }

    // 4. Sentidos, Percepção e Luz
    const isSentidos = id === 'luz' || id === 'visao-mistica' || id === 'visao-no-escuro' ||
      id === 'olho-mistico' || id === 'compreensao' || id === 'detectar-ameacas' ||
      id === 'adivinhacao' || id === 'clarividencia' || id === 'mapear' || id === 'identificacao' ||
      escola === 'adivinhacao' || nome.includes('luz') || nome.includes('visao') ||
      nome.includes('olho') || nome.includes('detectar') || nome.includes('ouvir') ||
      nome.includes('compreensao') || nome.includes('ilumin');

    if (isSentidos) {
      return {
        categoria: 'sentidos',
        label: 'Sentidos, Percepção e Luz',
        permitidos: 'Equipamentos de aventura, ferramentas (óculos, lunetas, tochas) e elmos/capuzes',
        tiposValidos: ['equipamento_aventura', 'ferramenta', 'instrumento', 'vestuario', 'item_geral']
      };
    }

    // 5. Cura e Restauração
    const isCura = id === 'curar-ferimentos' || id === 'purificacao' || id === 'restauracao' ||
      id === 'vitalidade-fantasma' || id === 'abencoar-alimentos' || id === 'folego-concentrado' ||
      nome.includes('curar') || nome.includes('cura') || nome.includes('ferimento') ||
      nome.includes('purific') || nome.includes('restaur') || nome.includes('vitalidade');

    if (isCura) {
      return {
        categoria: 'cura',
        label: 'Cura e Restauração',
        permitidos: 'Equipamentos de aventura, ferramentas (kits médicos, seringas) e vestuário utilitário',
        tiposValidos: ['equipamento_aventura', 'ferramenta', 'vestuario', 'item_geral']
      };
    }

    // 6. Evocação Ofensiva / Raios / Disparo Direto
    const isEvocacao = id === 'bola-de-fogo' || id === 'relampago' || id === 'explosao-de-chamas' ||
      id === 'seta-infalivel-de-talude' || id === 'raio-solar' || id === 'cone-de-frio' ||
      id === 'lanca-ignea' || escola === 'evocacao' || nome.includes('fogo') ||
      nome.includes('raio') || nome.includes('chamas') || nome.includes('explosao');

    if (isEvocacao) {
      return {
        categoria: 'evocacao',
        label: 'Evocação e Disparo Direto',
        permitidos: 'Armas (disparador acoplado) e ferramentas/aparatos portáteis (PROIBIDO em armaduras/escudos)',
        tiposValidos: ['arma', 'equipamento_aventura', 'ferramenta', 'esoterico']
      };
    }

    // Padrão: Utilitário Geral (Artesão / Alfaiate)
    return {
      categoria: 'utilitario',
      label: 'Efeito e Utilitário Geral',
      permitidos: 'Equipamentos de aventura, ferramentas, esotéricos e vestuário',
      tiposValidos: ['equipamento_aventura', 'ferramenta', 'instrumento', 'esoterico', 'vestuario', 'item_geral']
    };
  }

  /**
   * Verifica se um item mundano é coerente com a magia simulada para acoplamento de engenhoca.
   * Regra:
   * - Magias defensivas (como Escudo da Fé) NÃO podem ser acopladas a armas.
   * - Magias ofensivas de arma (como Arma Mágica ou Espada Divina) NÃO podem ser acopladas a armaduras ou escudos.
   * @param {any} spell
   * @param {any} item
   * @returns {{ compativel: boolean, motivo?: string, classInfo: any }}
   */
  function verificarCoerenciaMagiaItem(spell, item) {
    if (!spell || !item) return { compativel: true, classInfo: classificarEfeitoMagia(spell) };
    const classInfo = classificarEfeitoMagia(spell);
    const itemTipo = String(item.tipo || '').toLowerCase();
    const itemCat = String(item.categoriaId || '').toLowerCase();
    const itemNome = String(item.nome || item.name || '').toLowerCase();

    // Regra: Defesa Arcana (Armadura Arcana) x Armas (armadura, escudo e vestuário são permitidos)
    if (classInfo.categoria === 'defesa_sem_armadura') {
      if (itemTipo === 'arma' || itemCat.includes('arma') || ['simples', 'marcial', 'exotica', 'fogo'].includes(itemCat)) {
        return {
          compativel: false,
          motivo: 'Armadura Arcana é uma magia de proteção corporal e não pode ser acoplada em armas.',
          classInfo
        };
      }
      const isValido = itemTipo === 'vestuario' || itemCat === 'vestuario' || itemTipo === 'escudo' || itemCat === 'escudo' || itemTipo === 'armadura' || itemCat.includes('armadura') || ['leve', 'pesada', 'pesado'].includes(itemCat);
      return {
        compativel: isValido,
        motivo: isValido ? undefined : 'Armadura Arcana pode ser acoplada em roupas/vestuário (Ofício Alfaiate) ou em armaduras e escudos (Ofício Armeiro).',
        classInfo
      };
    }

    // Regra estrita: Magia de Defesa x Arma
    if (classInfo.categoria === 'defesa') {
      if (itemTipo === 'arma' || itemCat.includes('arma') || ['simples', 'marcial', 'exotica', 'fogo'].includes(itemCat)) {
        return {
          compativel: false,
          motivo: `Magias defensivas como ${spell.nome || spell.name || 'esta'} não podem ser acopladas em armas. Escolha um escudo, armadura ou vestuário defensivo.`,
          classInfo
        };
      }
      const isValido = itemTipo === 'escudo' || itemTipo === 'armadura' || itemTipo === 'vestuario' ||
        itemCat === 'escudo' || itemCat.includes('armadura') || itemCat === 'vestuario';
      return {
        compativel: isValido,
        motivo: isValido ? undefined : 'Item incompatível com o efeito defensivo da magia.',
        classInfo
      };
    }

    // Regra estrita: Magia de Ataque com Arma x Armadura / Escudo / Vestuário não ofensivo
    if (classInfo.categoria === 'ataque_arma') {
      if (itemTipo === 'armadura' || itemTipo === 'escudo' || itemCat.includes('armadura') || itemCat === 'escudo') {
        return {
          compativel: false,
          motivo: `Magias de aprimoramento de arma como ${spell.nome || spell.name || 'esta'} não podem ser acopladas em armaduras ou escudos. Escolha uma arma mundana.`,
          classInfo
        };
      }
      if (itemTipo === 'vestuario' && !itemNome.includes('manopla')) {
        return {
          compativel: false,
          motivo: `Magias de combate com arma devem ser acopladas em armas, não em vestuário.`,
          classInfo
        };
      }
      const isArma = itemTipo === 'arma' || ['simples', 'marcial', 'exotica', 'fogo'].includes(itemCat);
      return {
        compativel: isArma,
        motivo: isArma ? undefined : 'Esta magia exige uma arma mundana para ser acoplada.',
        classInfo
      };
    }

    // Regra: Mobilidade
    if (classInfo.categoria === 'mobilidade') {
      if (itemTipo === 'arma' || itemTipo === 'escudo' || (itemTipo === 'armadura' && itemCat === 'pesada')) {
        return {
          compativel: false,
          motivo: `Magias de mobilidade e deslocamento não podem ser acopladas em armas ou escudos. Use calçados, mantos ou equipamentos de aventura.`,
          classInfo
        };
      }
      const isValido = itemTipo === 'vestuario' || itemTipo === 'equipamento_aventura' || itemTipo === 'item_geral' || itemCat === 'vestuario' || itemCat === 'equipamento_aventura';
      return {
        compativel: isValido,
        motivo: isValido ? undefined : 'Item incompatível com engenhocas de mobilidade.',
        classInfo
      };
    }

    // Regra: Cura / Restauração
    if (classInfo.categoria === 'cura') {
      if (itemTipo === 'arma' || itemTipo === 'armadura' || itemTipo === 'escudo') {
        return {
          compativel: false,
          motivo: `Magias de cura e restauração devem ser acopladas em kits, ferramentas ou vestuário médico, não em armas ou armaduras de combate.`,
          classInfo
        };
      }
      return { compativel: true, classInfo };
    }

    // Regra: Evocação / Disparo
    if (classInfo.categoria === 'evocacao') {
      if (itemTipo === 'armadura' || itemTipo === 'escudo') {
        return {
          compativel: false,
          motivo: `Engenhocas de evocação e rajadas destrutivas não podem ser acopladas em armaduras corporais ou escudos.`,
          classInfo
        };
      }
      return { compativel: true, classInfo };
    }

    // Regra: Sentidos / Luz
    if (classInfo.categoria === 'sentidos') {
      if (itemTipo === 'arma' || (itemTipo === 'armadura' && itemCat !== 'elmo')) {
        return {
          compativel: false,
          motivo: `Magias de sentidos e iluminação devem ser acopladas em lentes, lanternas, ferramentas ou capacetes/capuzes, não em armas ou couraças.`,
          classInfo
        };
      }
      return { compativel: true, classInfo };
    }

    // Validação genérica contra tipos válidos
    const permitido = classInfo.tiposValidos.includes(itemTipo) || classInfo.tiposValidos.includes(itemCat);
    return {
      compativel: permitido,
      motivo: permitido ? undefined : `Item incompatível com o tipo de magia (${classInfo.label}). Permitidos: ${classInfo.permitidos}.`,
      classInfo
    };
  }

  return Object.freeze({
    custoMateriaPrima,
    cdFabricacao,
    tempoFabricacao,
    secoesOficina,
    normalizarOficio,
    obterNomeEstacao,
    filtrarItensPorOficio,
    calcularAprimoramentoItemExistente,
    podeReceberMelhorias,
    podeReceberEncantos,
    oficioNecessarioParaAprimorar,
    TABELA_MELHORIAS,
    CD_MELHORIAS,
    TABELA_ENCANTOS,
    CD_ENCANTOS,
    PM_SACRIFICIO_ENCANTOS,
    regrasPocaoPergaminho,
    circuloMaximoEngenhoca,
    custoFabricacaoEngenhoca,
    cdFabricacaoEngenhoca,
    cdAtivacaoEngenhoca,
    calcularBonusCdAparatos,
    limiteMelhoriasEngenhoca,
    calcularEspacosEngenhoca,
    sugerirNomeEngenhoca,
    formatarNomeEngenhocaAcoplada,
    obterOpcoesEngenhoca,
    gerarDescricaoEngenhoca,
    SUGESTOES_NOMES_ENGENHOCAS,
    classificarEfeitoMagia,
    verificarCoerenciaMagiaItem
  });
})();

if (typeof window !== 'undefined') {
  // @ts-ignore
  window.RegrasManufatura = RegrasManufatura;
  // @ts-ignore
  window.formatarNomeEngenhocaAcoplada = RegrasManufatura.formatarNomeEngenhocaAcoplada;
  // @ts-ignore
  window.obterOpcoesEngenhoca = RegrasManufatura.obterOpcoesEngenhoca;
  // @ts-ignore
  window.gerarDescricaoEngenhoca = RegrasManufatura.gerarDescricaoEngenhoca;
}

if (typeof globalThis !== 'undefined') {
  // @ts-ignore
  globalThis.RegrasManufatura = RegrasManufatura;
  // @ts-ignore
  globalThis.formatarNomeEngenhocaAcoplada = RegrasManufatura.formatarNomeEngenhocaAcoplada;
  // @ts-ignore
  globalThis.obterOpcoesEngenhoca = RegrasManufatura.obterOpcoesEngenhoca;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = RegrasManufatura;
}
