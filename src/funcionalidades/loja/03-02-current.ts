

[
  { materialEspecialId: 'casco_de_monstro', custos: { arma: 750, armadura_leve: 750, armadura_pesada: 6000, escudo: 750 } },
  { materialEspecialId: 'lanajuste', custos: { arma: 600, armadura_leve: 1500, armadura_pesada: 3000, escudo: 1500 } },
  { materialEspecialId: 'prata', custos: { arma: 600, armadura_leve: 1500, armadura_pesada: 3000, escudo: 1500 } }
].forEach(function(extraCost) {
  const current = (IMPROVEMENT_DATA.custosMateriaisBasicos || []).find(function(entry) {
    return entry.materialEspecialId === extraCost.materialEspecialId;
  });
  if (current) current.custos = Object.assign({}, current.custos || {}, extraCost.custos);
  else IMPROVEMENT_DATA.custosMateriaisBasicos.push(extraCost);
});

function splitMagicIds(value) {
  return String(value || '').split(',').map(function(id) { return id.trim(); }).filter(Boolean);
}

ADDED_MAGIC_CONTENT.enchantments.forEach(function(entry) {
  ENCHANTMENT_DATA.encantamentos.push({
    id: entry.id,
    nome: entry.name,
    aplicacoesIds: splitMagicIds(entry.applications),
    preRequisitosIds: splitMagicIds(entry.requirements),
    categoriasItemIds: splitMagicIds(entry.categories),
    incompatibilidadesIds: splitMagicIds(entry.incompatibilities),
    livrosOrigemIds: ['herois_de_arton'],
    descricao: entry.description,
    efeitos: []
  });
});

['energetica', 'lancinante', 'magnifica', 'guardiao'].forEach(function(id) {
  const enchantment = ENCHANTMENT_DATA.encantamentos.find(function(entry) { return entry.id === id; });
  if (enchantment) enchantment.custoEncantos = 2;
});

const FIXED_IMPROVEMENT_ALIASES = { banhada_a_ouro: 'banhado_a_ouro', macabra: 'macabro' };
const SPECIFIC_ITEM_TEXT_OVERRIDES = {
  armadura_da_luz: 'Esta armadura completa banhada a ouro reforçada guardiã zelosa possui o símbolo de Khalmyr gravado no peitoral. Se você possuir um código de conduta (de honra, do herói...) ou for devoto de uma divindade que canaliza apenas energia positiva, recebe redução de dano igual ao seu Carisma.',
  baluarte_anao: 'Esta armadura completa reforçada defensora de adamante fornece proteção sem igual. Se você não se deslocar em seu turno, a RD que ela fornece aumenta para 10 até seu próximo turno.',
  carapaca_demoniaca: 'Esta armadura completa macabra reforçada guardiã é forjada para fazer com que o usuário pareça um demônio — o elmo tem o formato de uma cabeça demoníaca com chifres e o usuário enxerga através da boca aberta e repleta de dentes. Se você for devoto de uma divindade que canaliza apenas energia negativa, os seus ataques corpo a corpo causam +1d8 de dano de trevas.',
  cota_elfica: 'Composta de anéis finíssimos, esta cota de malha defensora de mitral parece ser feita de seda. Ela permite que você aplique sua Destreza na Defesa como se fosse uma armadura leve.',
  couraca_do_comando: 'Esta couraça banhada a ouro sob medida defensora irradia uma aura de autoridade. Você recebe +1 em Carisma. Se usar o poder Comandar, o bônus fornecido aumenta para +2.',
  couro_de_monstro: 'Usado por chefes bárbaros das Montanhas Sanguinárias, este gibão de peles defensor é feito do couro de monstros, como basiliscos e serpes. Se você usar o poder Ataque Poderoso ou fizer uma investida, recebe um bônus de +2d6 nas rolagens de dano.',
  loriga_do_centuriao: 'Esta loriga segmentada defensora é dourada com detalhes em vermelho e possui o símbolo de Tauron, antigo Deus da Força, gravado no peitoral. Se estiver liderando uma ou mais criaturas (em termos de jogo, se estiver usando o poder Comandar ou similar), seus ataques corpo a corpo causam +2d6 de fogo.',
  manto_da_noite: 'Este couro batido ajustado defensor sombrio é negro com partes metálicas foscas. Quando usa esta armadura, você não sofre penalidade em testes de Furtividade por se mover em seu deslocamento normal e a penalidade que você sofre em testes de Furtividade por atacar diminui para –10.',
  escudo_de_azgher: 'Este escudo pesado guardião é forjado na forma de um sol estilizado. Você pode gastar uma ação padrão e 10 PM para fazê-lo emitir uma luz brilhante e quente num cone com alcance curto. A luz gera os efeitos da magia Visão da Verdade e causa 6d6 pontos de dano de fogo em todos os seus inimigos (mortos-vivos e criaturas vulneráveis a luz solar sofrem 6d8 pontos de dano). Você pode gastar 1 PM no início de cada um de seus turnos para manter a luz.',
  escudo_do_conjurador: 'Este escudo leve defensor tem uma pequena tira de couro na parte interna, sobre a qual um conjurador pode lançar uma magia. A magia não surte efeito na hora; em vez disso, fica inscrita na tira. A tira pode então ser lida como um pergaminho, descarregando a magia em seus alvos/área. Uma vez que a magia seja descarregada, outra pode ser armazenada.',
  escudo_do_eclipse: 'Este escudo pesado defensor é completamente negro e parece absorver a luz. Ele fornece redução de trevas 10 e causa +1d8 de dano de trevas num ataque. Além disso, você pode gastar uma ação de movimento e 2 PM para lançar Escuridão.',
  escudo_espinhoso: 'Este escudo pesado defensor é coberto de espinhos. Você pode gastar uma ação de movimento e 2 PM para disparar um espinho em um alvo em alcance curto. O espinho acerta automaticamente e causa 1d10+2 pontos de dano de perfuração.',
  escudo_do_leao: 'Este escudo pesado defensor é forjado como uma cabeça de leão rugindo. Uma vez por rodada, você pode gastar 2 PM para fazer a cabeça criar vida e morder uma criatura adjacente. A mordida acerta automaticamente e causa 2d6+2 pontos de dano de perfuração.'
};
ITEMS.forEach(function(item) {
  if (!item.magico || !Array.isArray(item.magico.melhoriasFixasIds)) return;
  item.magico.melhoriasFixasIds = item.magico.melhoriasFixasIds.map(function(id) {
    return FIXED_IMPROVEMENT_ALIASES[id] || id;
  });
  const base = item.magico.baseItemId && ITEMS.find(function(candidate) { return candidate.id === item.magico.baseItemId; });
  const baseTexts = base && base.textos || {};
  item.textos = {
    habilidade: baseTexts.habilidade || '',
    variavel: baseTexts.variavel || '',
    descricao: SPECIFIC_ITEM_TEXT_OVERRIDES[item.id] || item.textos && item.textos.descricao || ''
  };
  item.efeitos = (base && base.efeitos || []).slice();
});

function magicSlug(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function specificMagicEquipment(row, bookId) {
  const base = ITEMS.find(function(item) { return item.id === row.baseItemId; }) || {
    tipo: 'item_geral',
    categoriaId: 'esoterico',
    espacos: 1,
    equipamento: { equipavel: true, slotsPermitidos: ['mao_direita', 'mao_esquerda'], ocupaMao: true, itemVestido: false },
    efeitos: []
  };
  const item = Object.assign({}, base);
  item.id = 'magico_' + bookId + '_' + magicSlug(row.name);
  item.nome = row.name;
  if (row.type) item.tipo = row.type;
  if (row.categoryId) item.categoriaId = row.categoryId;
  if (row.weapon) item.arma = Object.assign({}, row.weapon);
  if (row.equipment) item.equipamento = Object.assign({}, row.equipment);
  item.livroOrigemId = bookId;
  item.livrosOrigemIds = [bookId];
  item.preco = { valor: Number(row.price) || 0, moeda: 'T$' };
  if (row.spaces != null) item.espacos = Number(row.spaces) || 0;
  if (row.damage && item.arma) {
    item.arma = Object.assign({}, item.arma, {
      dano: Object.assign({}, item.arma.dano || {}, { principal: row.damage })
    });
  }
  const baseTexts = base.textos || {};
  item.textos = {
    habilidade: baseTexts.habilidade || '',
    variavel: baseTexts.variavel || '',
    descricao: row.description || ''
  };
  item.magico = {
    tipo: row.magicType || 'especifico',
    categoriaId: row.tier,
    divindade: row.deity || '',
    manifestacaoLiturgica: row.devotion || '',
    baseItemId: row.baseItemId || null,
    melhoriasFixasIds: splitMagicIds(row.improvements),
    encantosFixosIds: splitMagicIds(row.enchantments),
    materialEspecialId: row.material || undefined,
    caracteristicasFixas: Array.isArray(row.fixedTraits) ? row.fixedTraits.slice() : [],
    encantosEspeciais: Array.isArray(row.specialEnchantments) ? row.specialEnchantments.slice() : [],
    espacosFixos: row.spaces != null ? Number(row.spaces) || 0 : Number(base.espacos || 1),
    fabricavel: row.craftable !== false,
    faixaD100: row.range || ''
  };
  item.efeitos = (base.efeitos || []).slice();
  return item;
}

function specificMagicAccessory(row, bookId) {
  const base = row.baseItemId && ITEMS.find(function(item) { return item.id === row.baseItemId; });
  return {
    id: 'magico_' + bookId + '_' + magicSlug(row.name),
    nome: row.name,
    tipo: 'acessorio',
    categoriaId: 'acessorio_' + row.tier,
    livroOrigemId: bookId,
    livrosOrigemIds: [bookId],
    preco: { valor: Number(row.price) || 0, moeda: 'T$' },
    espacos: row.spaces != null ? Number(row.spaces) || 0 : magicSlug(row.name) === 'mochila_de_carga' ? 0 : Number(base && base.espacos || 1),
    equipamento: base
      ? Object.assign({}, base.equipamento || {})
      : { equipavel: false, slotsPermitidos: [], ocupaMao: false, itemVestido: false },
    textos: { habilidade: '', variavel: '', descricao: row.description || '' },
    magico: {
      tipo: row.magicType || 'especifico',
      categoriaId: row.tier,
      divindade: row.deity || '',
      manifestacaoLiturgica: row.devotion || '',
      baseItemId: row.baseItemId || null,
      melhoriasFixasIds: splitMagicIds(row.improvements),
      encantosFixosIds: splitMagicIds(row.enchantments),
      materialEspecialId: row.material || undefined,
      caracteristicasFixas: Array.isArray(row.fixedTraits) ? row.fixedTraits.slice() : [],
      encantosEspeciais: Array.isArray(row.specialEnchantments) ? row.specialEnchantments.slice() : [],
      espacosFixos: row.spaces != null ? Number(row.spaces) || 0 : Number(base && base.espacos || (magicSlug(row.name) === 'mochila_de_carga' ? 0 : 1)),
      fabricavel: row.craftable !== false,
      faixaD100: row.range || ''
    },
    efeitos: (base && base.efeitos || []).slice()
  };
}

const EXTRA_MAGIC_ITEMS = []
  .concat(ADDED_MAGIC_CONTENT.baseAccessories.map(function(row) { return specificMagicAccessory(row, 'basico'); }))
  .concat(ADDED_MAGIC_CONTENT.baseWeapons.map(function(row) { return specificMagicEquipment(row, 'basico'); }))
  .concat(ADDED_MAGIC_CONTENT.heroWeapons.map(function(row) { return specificMagicEquipment(row, 'herois_de_arton'); }))
  .concat(ADDED_MAGIC_CONTENT.heroArmor.map(function(row) { return specificMagicEquipment(row, 'herois_de_arton'); }))
  .concat(ADDED_MAGIC_CONTENT.heroEsoterics.map(function(row) { return specificMagicEquipment(row, 'herois_de_arton'); }))
  .concat(ADDED_MAGIC_CONTENT.heroAccessories.map(function(row) { return specificMagicAccessory(row, 'herois_de_arton'); }))
  .concat(THREAT_MAGIC_CONTENT.accessories.map(function(row) { return specificMagicAccessory(row, 'ameacas_de_arton'); }))
  .concat(THREAT_MAGIC_CONTENT.equipment.map(function(row) { return specificMagicEquipment(row, 'ameacas_de_arton'); }))
  .concat(LITURGICAL_CONTENT.accessories.map(function(row) {
    return specificMagicAccessory(Object.assign({ magicType: 'liturgico' }, row), 'deuses_de_arton');
  }))
  .concat(LITURGICAL_CONTENT.equipment.map(function(row) {
    const tier = row.tier || 'medio';
    const isArmadura = row.baseItemId === 'armadura_completa' || row.name === 'Armadura do Julgamento';
    const categoryId = isArmadura ? ('armadura_especifica_' + tier) : ('arma_especifica_' + tier);
    return specificMagicEquipment(Object.assign({
      magicType: 'liturgico',
      categoryId: categoryId
    }, row), 'deuses_de_arton');
  }));

const ADDITIONAL_STANDARD_ITEMS = [{
  id: 'joia_de_familia',
  nome: 'Joia de Família',
  tipo: 'item_geral',
  categoriaId: 'vestuario',
  livroOrigemId: 'basico',
  livrosOrigemIds: ['basico'],
  preco: { valor: 300, moeda: 'T$' },
  espacos: 1,
  equipamento: { equipavel: true, slotsPermitidos: ['vestuario'], ocupaMao: false, itemVestido: true },
  textos: { habilidade: '', variavel: '', descricao: 'Uma joia que você recebeu de sua família.' },
  efeitos: []
}, {
  id: 'joia_falsificada',
  nome: 'Joia Falsificada',
  tipo: 'item_geral',
  categoriaId: 'vestuario',
  origemExclusiva: true,
  livroOrigemId: 'basico',
  livrosOrigemIds: ['basico'],
  origem: 'Charlatão',
  preco: { valor: 0, moeda: 'T$' },
  semValorReal: true,
  precoAparente: 100,
  espacos: 1,
  equipamento: { equipavel: true, slotsPermitidos: ['vestuario'], ocupaMao: false, itemVestido: true },
  textos: { habilidade: 'Possui valor aparente de T$ 100, mas não tem valor real.', variavel: '', descricao: 'Uma joia falsificada que faz parte dos pertences de um charlatão.' },
  efeitos: []
}, {
  id: 'animal_nao_combativo', nome: 'Animal Não Combativo', tipo: 'item_geral', categoriaId: 'animal',
  origemExclusiva: true,
  livroOrigemId: 'basico', livrosOrigemIds: ['basico'], origem: 'Fazendeiro',
  preco: { valor: 1, moeda: 'T$' }, espacos: 0,
  equipamento: { equipavel: false, slotsPermitidos: [], ocupaMao: false, itemVestido: false },
  textos: { habilidade: '', variavel: '', descricao: 'Um animal doméstico não treinado para combate, como uma galinha, um porco ou uma ovelha.' }, efeitos: []
}, {
  id: 'instrumento_musical_exotico', nome: 'Instrumento Musical Exótico', tipo: 'item_geral', categoriaId: 'instrumento',
  livroOrigemId: 'basico', livrosOrigemIds: ['basico'], preco: { valor: 35, moeda: 'T$' }, espacos: 0,
  equipamento: { equipavel: true, slotsPermitidos: ['mao_direita', 'mao_esquerda'], ocupaMao: true, itemVestido: false },
  textos: { habilidade: 'Os espaços ocupados são definidos pelo mestre.', variavel: '', descricao: 'Um instrumento musical incomum, de formato ou origem exótica.' }, efeitos: []
}, {
  id: 'tranqueiras_resgatadas_do_mar', nome: 'Tranqueiras resgatadas do mar', tipo: 'item_geral', categoriaId: 'itens_gerais',
  livroOrigemId: 'basico', livrosOrigemIds: ['basico'], preco: { valor: 100, moeda: 'T$' }, espacos: 2,
  origemExclusiva: true,
  equipamento: { equipavel: false, slotsPermitidos: [], ocupaMao: false, itemVestido: false },
  textos: { habilidade: 'Valor de venda integral de T$ 100.', variavel: '', descricao: 'Tranqueiras resgatadas do mar da Cidade Velha que podem ser vendidas por T$ 100 integrais.' }, efeitos: []
}];

const STANDARD_DESCRIPTION_OVERRIDES = {
  alforje: 'Sacos de couro feitos para serem presos em uma sela. Permitem que um parceiro montaria carregue até 10 espaços de item para você.',
  cao_de_caca: 'Este cachorro valente e leal pode ser usado como parceiro perseguidor por personagens treinados em Adestramento ou montaria por personagens Pequenos e Minúsculos.',
  cavalo: 'A montaria mais comum no Reinado. Pode ser usado como parceiro montaria (veja a página 262). Cavalos sem treinamento se assustam facilmente, sendo necessário um teste de Cavalgar (CD 20) por rodada para permanecer montado durante um combate. Cavalos de guerra dispensam esse teste.',
  estabulo_por_dia: 'Inclui alimentação para o animal.',
  ponei: 'A montaria mais comum entre raças Pequenas. Pode ser usado como parceiro montaria (veja a página 262). Pôneis sem treinamento se assustam facilmente, sendo necessário um teste de Cavalgar (CD 20) por rodada para permanecer montado durante um combate. Pôneis de guerra dispensam esse teste.',
  trobo: 'Estas enormes aves, também chamadas de pássaros-touros, são parecidas com avestruzes com chifres, couro e cascos. Não têm asas. Possuem poucas penas, que servem apenas como ornamento. Muito dóceis, trobos são usados em áreas rurais como animais de carga e tração, mas também podem ser usados como montaria (veja a página 262).'
};

ITEMS.forEach(function(item) {
  if (item.id === 'racao_de_viagem') {
    item.preco = { valor: 1, moeda: 'T$' };
    item.espacos = 0.5;
    item.textos = Object.assign({}, item.textos || {}, { descricao: 'Alimento seco e conservado, suficiente para sustentar uma pessoa durante um dia de viagem.' });
  }
  if (!STANDARD_DESCRIPTION_OVERRIDES[item.id]) return;
  item.textos = Object.assign({}, item.textos || {}, { descricao: STANDARD_DESCRIPTION_OVERRIDES[item.id] });
});


const TYPE_META = {
  todos: { label: 'Todos', icon: '' },
  arma: { label: 'Armas', icon: '' },
  municao: { label: 'Munições', icon: '' },
  armadura: { label: 'Armaduras', icon: '◈' },
  escudo: { label: 'Escudos', icon: '' },
  item_geral: { label: 'Itens gerais', icon: '' },
  acessorio: { label: 'Acessórios', icon: '◆' }
};

const BOOK_LABELS = {
  basico: 'Livro Básico',
  herois_de_arton: 'Heróis de Arton',
  ameacas_de_arton: 'Ameaças de Arton',
  deuses_de_arton: 'Deuses de Arton',
  dragao_brasil: 'Dragão Brasil',
  adicionado: 'Adicionado',
  sem_livro: 'Origem não informada'
};
const BOOK_ORDER = ['basico', 'herois_de_arton', 'ameacas_de_arton', 'deuses_de_arton', 'dragao_brasil', 'adicionado', 'sem_livro'];

const CATEGORY_LABELS = {
  simples: 'Simples', marcial: 'Marciais', exotica: 'Exóticas', fogo: 'Armas de fogo', municao: 'Munições',
  leve: 'Leves', pesada: 'Pesadas', pesado: 'Pesados', sem_categoria: 'Outros',
  vestuario: 'Vestuário', equipamento_aventura: 'Equipamento de aventura',
  alquimico_catalisador: 'Alquímicos · Catalisadores', alquimico_preparado: 'Alquímicos · Preparados',
  alquimico_venenoso: 'Alquímicos · Venenos', esoterico: 'Esotéricos', animal: 'Animais',
  servico: 'Serviços', instrumento: 'Instrumentos', alimentacao: 'Alimentação', aparato: 'Aparatos',
  ferramenta: 'Ferramentas', bebida: 'Bebidas', veiculo: 'Veículos',
  acessorio_menor: 'Acessório menor', acessorio_medio: 'Acessório médio', acessorio_maior: 'Acessório maior',
  arma_especifica_menor: 'Arma específica menor', arma_especifica_medio: 'Arma específica média', arma_especifica_media: 'Arma específica média', arma_especifica_maior: 'Arma específica maior',
  armadura_especifica_menor: 'Armadura específica menor', armadura_especifica_medio: 'Armadura específica média', armadura_especifica_media: 'Armadura específica média', armadura_especifica_maior: 'Armadura específica maior'
};

const COMBAT_LABELS = {
  todos: 'Todos', corpo_a_corpo: 'Corpo a corpo', a_distancia: 'À distância',
  corpo_a_corpo_e_distancia: 'Corpo a corpo e à distância'
};
const GRIP_LABELS = { todos: 'Todas', leve: 'Leves', uma_mao: 'Uma mão', duas_maos: 'Duas mãos' };
const RANGE_LABELS = { curto: 'Curto', medio: 'Médio', '3m': '3m', '4_5m': '4,5m', cone_de_6m: 'Cone de 6m' };
const DAMAGE_LABELS = { corte: 'Corte', impacto: 'Impacto', perfuracao: 'Perfuração', acido: 'Ácido' };
const PROPERTY_LABELS = {
  adaptavel: 'Adaptável', agil: 'Ágil', alongada: 'Alongada', arremesso: 'Arremesso',
  desbalanceada: 'Desbalanceada', dupla: 'Dupla', ocultavel: 'Ocultável', versatil: 'Versátil'
};
const WEAPON_GROUP_LABELS = {
  armas_anas: 'Armas anãs',
  armas_de_fogo: 'Armas de fogo'
};
const WEAPON_PROP_DESCRIPTIONS = {
  adaptavel: 'Adaptável. Pode ser empunhada com uma ou duas mãos. Ao usar com duas mãos, o dano aumenta em um passo ou conforme tabela.',
  agil: 'Ágil. Pode ser usada com Destreza em vez de Força nos testes de ataque.',
  alongada: 'Alongada. Dobra seu alcance natural, mas não permite atacar alvos adjacentes.',
  arremesso: 'Arremesso. Pode ser arremessada no alcance indicado.',
  desbalanceada: 'Desbalanceada. Impõe –2 nos testes de ataque quando usada em uma mão sem treinamento.',
  dupla: 'Dupla. Pode ser usada como duas armas para efeitos de combate com duas armas.',
  ocultavel: 'Ocultável. O tamanho e/ou formato da arma tornam mais fácil escondê-la. Ela fornece +5 em testes de Ladinagem para ocultá-la.',
  versatil: 'Versátil. Pode causar dano de corte ou perfuração, à escolha do atacante a cada ataque.'
};
const SLOT_LABELS = {
  mao_direita: 'Mão', mao_esquerda: 'Mão', armadura: 'Armadura', vestuario: 'Vestuário'
};
const CUSTOM_ITEMS_STORAGE_KEY = 'arsenal-arton-custom-items-v1';
const DEBUG_ITEM_OVERRIDES_STORAGE_KEY = 'arsenal-arton-debug-item-overrides-v1';
const BACKPACK_STORAGE_KEY = 'arsenal-arton-backpack-v1';
const CHARACTER_PROFILES_STORAGE_KEY = 'arsenal-arton-character-profiles-v1';
const CART_STORAGE_KEY = 'arsenal-arton-cart-v1';
const BACKPACK_MODE_STORAGE_KEY = 'arsenal-arton-backpack-mode-v1';
const IMPROVEMENT_SURCHARGES = [0, 300, 3000, 9000, 18000];
const IMPROVEMENT_CRAFT_BONUSES = [0, 5, 10, 15, 20];
const MAGIC_RULES = ENCHANTMENT_DATA.regras || {};
const ENCHANTMENT_SURCHARGES = MAGIC_RULES.precosAdicionais || [0, 18000, 36000, 72000];
const ENCHANTMENT_CRAFT_BONUSES = MAGIC_RULES.modificadoresCdFabricacao || [0, 10, 15, 20];
const MAX_ENCHANTMENTS = Number(MAGIC_RULES.maximoEncantos) || 3;
function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[–—−]/g, '-')
    .toLowerCase();
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function humanize(value) {
  const text = String(value || '').replace(/_/g, ' ');
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : 'Outros';
}

function getBooks(item) {
  let books = Array.isArray(item.livrosOrigemIds) ? item.livrosOrigemIds.filter(Boolean) : [];
  if (!books.length && item.livroOrigemId) books = [item.livroOrigemId];
  return books.length ? Array.from(new Set(books)) : ['sem_livro'];
}

function formatCraftToolName(oficioVal) {
  if (!oficioVal) return 'Instrumentos de Ofício';
  const raw = String(oficioVal).toLowerCase().trim();
  const map = {
    'alquimia': 'Instrumentos do Alquimista',
    'alquimista': 'Instrumentos do Alquimista',
    'armeiro': 'Instrumentos do Armeiro',
    'artesao': 'Instrumentos do Artesão',
    'artesão': 'Instrumentos do Artesão',
    'culinaria': 'Instrumentos do Cozinheiro',
    'culinária': 'Instrumentos do Cozinheiro',
    'cozinheiro': 'Instrumentos do Cozinheiro',
    'alfaiate': 'Instrumentos do Alfaiate',
    'alvenaria': 'Instrumentos do Pedreiro',
    'pedreiro': 'Instrumentos do Pedreiro',
    'carpinteiro': 'Instrumentos do Carpinteiro',
    'joalheiro': 'Instrumentos do Joalheiro',
    'fazendeiro': 'Instrumentos do Fazendeiro',
    'pescador': 'Instrumentos do Pescador',
    'estalajadeiro': 'Instrumentos do Estalajadeiro',
    'escriba': 'Instrumentos do Escriba',
    'escultor': 'Instrumentos do Escultor',
    'engenhoqueiro': 'Instrumentos do Engenhoqueiro',
    'pintor': 'Instrumentos do Pintor',
    'minerador': 'Instrumentos do Minerador',
    'tatuador': 'Instrumentos do Tatuador',
    'coureiro': 'Instrumentos do Coureiro',
    'barbeiro': 'Instrumentos do Barbeiro'
  };
  for (const [k, v] of Object.entries(map)) {
    if (raw === k || raw.includes(k)) return v;
  }
  const match = raw.match(/of[íi]cio\s*\((.*?)\)/i);
  const name = match ? match[1].trim() : raw.replace(/of[íi]cio/i, '').replace(/instrumentos\s*(de|do|da)?/i, '').trim();
  if (name) {
    const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
    return `Instrumentos do ${capitalized}`;
  }
  return 'Instrumentos de Ofício';
}

const ITEM_CHOICE_DEFINITIONS = {
  instrumentos_de_oficio: {
    fields: [{ id: 'oficio', label: 'Ofício', type: 'select', options: [
      ['', 'Selecione o ofício'],
      ['alquimia', 'Alquimista'], ['armeiro', 'Armeiro'], ['artesao', 'Artesão'],
      ['culinaria', 'Cozinheiro'], ['alfaiate', 'Alfaiate'], ['alvenaria', 'Pedreiro'],
      ['carpinteiro', 'Carpinteiro'], ['joalheiro', 'Joalheiro'], ['fazendeiro', 'Fazendeiro'],
      ['pescador', 'Pescador'], ['estalajadeiro', 'Estalajadeiro'], ['escriba', 'Escriba'],
      ['escultor', 'Escultor'], ['engenhoqueiro', 'Engenhoqueiro'], ['pintor', 'Pintor'],
      ['minerador', 'Minerador'], ['tatuador', 'Tatuador']
    ] }]
  },
  ferramenta_pesada: {
    fields: [{ id: 'customName', label: 'Nome da ferramenta', type: 'text', placeholder: 'Ex. Malho' }]
  },
  ferramenta_pesada_lanca: {
    fields: [
      { id: 'customName', label: 'Nome da ferramenta', type: 'text', placeholder: 'Ex. Picareta' },
      { id: 'weaponModel', label: 'Usar estatísticas de', type: 'select', options: [['lanca', 'Lança'], ['maca', 'Maça']] }
    ]
  },
  ferramenta_agricola: {
    fields: [{ id: 'customName', label: 'Nome da ferramenta', type: 'text', placeholder: 'Ex. Forcado' }]
  },
  colecao_de_livros: {
    fields: [{ id: 'knowledge', label: 'Perícia beneficiada', type: 'select', options: [
      ['', 'Escolha a perícia…'], ['conhecimento', 'Conhecimento'], ['guerra', 'Guerra'], ['misticismo', 'Misticismo'], ['nobreza', 'Nobreza'], ['religiao', 'Religião']
    ] }]
  },
  instrumento_musical: {
    fields: [{ id: 'customName', label: 'Nome do instrumento', type: 'text', placeholder: 'Ex. Bandolim, flauta ou lira' }]
  },
  instrumento_musical_exotico: {
    fields: [
      { id: 'customName', label: 'Nome do instrumento', type: 'text', placeholder: 'Ex. Sanfona' },
      { id: 'customSpaces', label: 'Espaços definidos pelo mestre', type: 'number', placeholder: 'Ex. 2' }
    ]
  },
  animal_nao_combativo: {
    fields: [{ id: 'customName', label: 'Nome do animal', type: 'text', placeholder: 'Ex. Galinha, porco ou ovelha' }]
  },
  joia_de_familia: {
    fields: [{ id: 'customName', label: 'Nome da joia', type: 'text', placeholder: 'Ex. Colar, pingente, bracelete ou anel' }]
  },
  joia_falsificada: {
    fields: [{ id: 'customName', label: 'Nome da joia falsificada', type: 'text', placeholder: 'Ex. Colar falso, anel de latão ou broche dourado' }]
  },
  item_artistico: {
    fields: [{ id: 'customName', label: 'Nome do item artístico', type: 'text', placeholder: 'Ex. Escultura minotauro, tapeçaria antiga, vaso élfico' }]
  },
  tatuagem_adereco_gangue: {
    fields: [{ id: 'customName', label: 'Nome ou estilo da tatuagem / adereço', type: 'text', placeholder: 'Ex. Tatuagem da Serpente, Brinco de Osso' }]
  },
  item_sem_valor_admirador: {
    fields: [{ id: 'customName', label: 'Nome da lembrança do admirador', type: 'text', placeholder: 'Ex. Fita de seda azul, carta perfumada' }]
  },
  pequeno_animal_estimacao: {
    fields: [{ id: 'customName', label: 'Nome ou espécie do animal', type: 'text', placeholder: 'Ex. Pássaro azul, esquilo serelepe' }]
  },
  instrumentos_cozinheiro_aprimorados: {
    fields: [{ id: 'customName', label: 'Nome dos instrumentos de cozinha', type: 'text', placeholder: 'Ex. Facas de Chef, jogo de temperos raros' }]
  },
  instrumentos_barbeiro: {
    fields: [{ id: 'customName', label: 'Nome dos instrumentos de barbeiro', type: 'text', placeholder: 'Ex. Navalhas de prata, maleta de corte' }]
  },
  instrumentos_coureiro: {
    fields: [{ id: 'customName', label: 'Nome dos instrumentos de coureiro', type: 'text', placeholder: 'Ex. Sovelas de marfim, raspadeiras afiadas' }]
  },
  bola_ou_objeto_pintado: {
    fields: [{ id: 'customName', label: 'Nome do objeto companheiro', type: 'text', placeholder: 'Ex. Wilson, Coco Tagarela' }]
  },
  instrumentos_pescador: {
    fields: [{ id: 'customName', label: 'Nome dos instrumentos de pescador', type: 'text', placeholder: 'Ex. Vara de bambu reforçada, anzóis de osso' }]
  },
  tranqueiras_resgatadas_do_mar: {
    fields: [
      {
        id: 'customName',
        label: 'Tipo ou sugestão da tranqueira resgatada',
        type: 'select',
        options: [
          ['', 'Selecione uma sugestão ou personalize abaixo…'],
          ['Estatueta de ouro com conchas incrustadas', 'Estatueta de ouro com conchas incrustadas'],
          ['Garrafa com pergaminho ilegível', 'Garrafa com pergaminho ilegível'],
          ['Colar de dentes de tubarão gigante', 'Colar de dentes de tubarão gigante'],
          ['outro', 'Outro (digitar nome personalizado abaixo)']
        ]
      },
      {
        id: 'customDetails',
        label: 'Nome personalizado (se escolheu "Outro" ou queira detalhar)',
        type: 'text',
        placeholder: 'Ex: Caixa com bússola enferrujada, relíquia marinha...'
      }
    ]
  }
};

function normalizeItemOptions(itemId, raw) {
  const definition = ITEM_CHOICE_DEFINITIONS[itemId];
  if (!definition) return {};
  const source = raw && typeof raw === 'object' ? raw : {};
  return definition.fields.reduce(function(result, field) {
    if (field.type === 'select') {
      const allowed = field.options.map(function(option) { return option[0]; });
      result[field.id] = allowed.includes(source[field.id]) ? source[field.id] : allowed[0];
    } else if (field.type === 'number') {
      result[field.id] = source[field.id] === '' || source[field.id] == null ? '' : Math.max(0, Number(source[field.id]) || 0);
    } else {
      result[field.id] = String(source[field.id] || '').trim().slice(0, 80);
    }
    return result;
  }, {});
}

function itemOptionsKey(itemId, raw) {
  const options = normalizeItemOptions(itemId, raw);
  return Object.keys(options).sort().map(function(key) { return key + ':' + options[key]; }).join('|');
}

function loadCustomItems() {
  try {
    const parsed = JSON.parse(forjaArsenalStorage.getItem(CUSTOM_ITEMS_STORAGE_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    const allowedTypes = new Set(['arma', 'municao', 'armadura', 'escudo', 'item_geral', 'acessorio']);
    return parsed.filter(function(item) {
      return item && String(item.id || '').startsWith('adicionado_') && item.nome && allowedTypes.has(item.tipo);
    }).map(function(item) {
      item.adicionado = true;
      item.livroOrigemId = 'adicionado';
      item.livrosOrigemIds = ['adicionado'];
      item.preco = { valor: Math.max(0, Number(item.preco && item.preco.valor) || 0), moeda: 'T$' };
      item.espacos = Math.max(0, Number(item.espacos) || 0);
      return item;
    });
  } catch (error) {
    return [];
  }
}

function loadDebugItemOverrides() {
  try {
    const parsed = JSON.parse(forjaArsenalStorage.getItem(DEBUG_ITEM_OVERRIDES_STORAGE_KEY) || '{}');
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') return {};
    return Object.keys(parsed).reduce(function(result, itemId) {
      const patch = parsed[itemId];
      if (!patch || typeof patch !== 'object') return result;
      result[itemId] = {
        nome: String(patch.nome || '').trim().slice(0, 100),
        textos: {
          habilidade: String(patch.textos && patch.textos.habilidade || '').slice(0, 4000),
          variavel: String(patch.textos && patch.textos.variavel || '').slice(0, 8000),
          descricao: String(patch.textos && patch.textos.descricao || '').slice(0, 8000)
        }
      };
      return result;
    }, {});
  } catch (error) {
    return {};
  }
}

function applyDebugItemOverride(sourceItem) {
  const patch = debugItemOverrides[sourceItem.id];
  if (!patch) return sourceItem;
  return Object.assign({}, sourceItem, {
    nome: patch.nome || sourceItem.nome,
    textos: Object.assign({}, sourceItem.textos || {}, patch.textos || {}),
    debugEdited: true
  });
}