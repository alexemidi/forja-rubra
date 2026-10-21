
const ITEMS = window.__FORJA_DATA__.ITEMS;
const IMPROVEMENT_DATA = window.__FORJA_DATA__.IMPROVEMENT_DATA;
const ENCHANTMENT_DATA = window.__FORJA_DATA__.ENCHANTMENT_DATA;


const ADDED_MAGIC_CONTENT = window.__FORJA_DATA__.ADDED_MAGIC_CONTENT;

const THREAT_MAGIC_CONTENT = {
  accessories: [
    {
      name: 'Chifre de Unicórnio',
      tier: 'maior',
      price: 120000,
      baseItemId: 'espada_curta',
      enchantments: 'formidavel',
      craftable: false,
      description: 'Um chifre de unicórnio é um poderoso item mágico de cura. Se estiver empunhando o chifre, você pode lançar Curar Ferimentos e Purificação; caso já conheça essas magias, seu custo diminui em –1 PM, cumulativo com outras reduções. Ele também pode ser usado para lançar a magia Segunda Chance, mas perde todos os poderes após isso. Por fim, ele pode ser empunhado como uma espada curta formidável. Mesmo sem seus poderes, o chifre pode ser transformado em 12 doses de pó de chifre, um poderoso ingrediente para preparados e poções. Misturar uma dose desse pó aos ingredientes de um preparado ou poção aumenta cada dado de cura do efeito do item em dois passos (até um máximo de d12). Ainda que o simples ato de portar um chifre de unicórnio não seja necessariamente maligno, muitos devotos, sobretudo de Allihanna e Marah, poderão questionar a origem do chifre. Chifres de unicórnio não podem ser fabricados, e são obtidos apenas de um unicórnio morto.'
    },
    {
      name: 'Fragmento de Filactério',
      tier: 'maior',
      price: 90000,
      baseItemId: 'costela_de_lich',
      improvements: 'poderoso',
      craftable: false,
      description: 'Mesmo após a destruição do filactério de um lich, uma parte do poder mágico da criatura pode permanecer, geralmente em seu maior fragmento. Um fragmento de filactério conta como uma costela de lich poderosa que fornece +20 PM (somente após um dia de uso). Um fragmento só pode ser obtido de um filactério estilhaçado e não pode ser fabricado.'
    },
    {
      name: 'Pilão Conspurcado',
      tier: 'medio',
      price: 21000,
      baseItemId: 'costela_de_lich',
      description: 'Este pequeno pilão de madeira de aparência sinistra é decorado com símbolos místicos entalhados e fragmentos de ossos encravados. Conta como uma costela de lich. Além dos benefícios desse esotérico, o custo de suas magias de encantamento e necromancia lançadas pela varinha diminui em –1 PM e a CD para resistir a elas aumenta em +2.'
    }
  ],
  equipment: [
    {
      name: 'Grilhão de Descrença',
      tier: 'menor',
      price: 24000,
      baseItemId: 'armadura_completa',
      improvements: 'reforcada,selada',
      craftable: false,
      description: 'Esta armadura completa reforçada e selada contém uma forte maldição divina: uma vez vestida, não pode ser retirada. Qualquer criatura que chegue a 0 PV vestindo esta armadura não pode ser ressuscitada e se torna um guerreiro perpétuo. Se de alguma forma a maldição for removida (como por dissipar o item ou quebrar a maldição), ela se transforma numa armadura completa reforçada e selada com um encanto aleatório. Uma armadura grilhão de descrença não pode ser fabricada e é encontrada apenas em guerreiros perpétuos.'
    },
    {
      name: 'Pistola Demoníaca',
      tier: 'medio',
      price: 72250,
      baseItemId: 'pistola',
      enchantments: 'ameacadora,formidavel,profana',
      craftable: false,
      description: 'Esta pistola ameaçadora formidável e profana não pode ser fabricada por nenhum meio conhecido por mortais e só pode ser obtida através de um pacto com um demônio da pólvora. Uma pistola demoníaca está sempre carregada e não precisa de munição. Uma vez por dia, em um momento escolhido pelo mestre (ou na primeira ocasião em que houver outras pessoas próximas), o portador da arma é atingido pelo impulso homicida de disparar contra uma criatura inteligente aleatória à vista (incluindo aliados). O portador pode resistir a esse impulso por este dia passando em um teste de Vontade (CD 25). Qualquer medida para evitar acidentes (manter a pistola guardada, descarregada ou mesmo trancada e fora de alcance) fracassa automaticamente; quando o portador cede ao impulso assassino, a arma surge magicamente em suas mãos. Caso o portador da pistola seja morto, a arma desaparece.'
    },
    {
      name: 'Uyzrrak Da’ukthra',
      tier: 'medio',
      price: 78050,
      baseItemId: 'machado_de_guerra',
      improvements: 'atroz,material_especial',
      material: 'adamante',
      enchantments: 'magnifica',
      damage: '4d6',
      spaces: 3,
      fixedTraits: [{ name: 'Aumentado', description: 'Arma feita para uma categoria de tamanho maior: aumenta o dano em um passo e ocupa 1 espaço adicional. Somado ao passo de dano fornecido pelo adamante, o dano final é 4d6.' }],
      specialEnchantments: [{ name: 'Encanto variável do Akzath', slotCost: 1, description: 'Conforme o elemento do círculo intermediário mais próximo: Luz — Sagrado; Nós — Piedoso; Dentro — Defensor; Estagnação — Excruciante; Trevas — Profano; Fora — Arremesso; Eles — Dilacerante; Movimento — Energético.' }],
      description: 'Este machado de guerra magnífico aumentado atroz de adamante é marcado com escrita goblinoide em sua lâmina e aparenta já ter visto inúmeras batalhas. Quando empunhado por um duyshidakk, causa +2d8 pontos de dano contra qualquer criatura não duyshidakk e recebe um encanto adicional, conforme o elemento do círculo intermediário do Akzath mais próximo do portador: Luz, Sagrado; Nós, Piedoso; Dentro, Defensor; Estagnação, Excruciante; Trevas, Profano; Fora, Arremesso; Eles, Dilacerante; Movimento, Energético. A critério do mestre, se o portador do machado se tornar mais próximo de outro elemento, o encanto muda de acordo.'
    }
  ]
};

const LITURGICAL_IDENTIFICATION_RULE = 'Itens litúrgicos não podem ser identificados com Misticismo, apenas com Religião. Se você for devoto do deus associado ao item, recebe +5 em testes para identificá-lo.';