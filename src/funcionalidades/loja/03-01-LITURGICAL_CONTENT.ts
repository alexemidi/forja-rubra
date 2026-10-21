

const LITURGICAL_CONTENT = {
  accessories: [
    {
      name: 'Cilício Vivo', deity: 'Aharadak', tier: 'maior', price: 37000,
      devotion: 'Para devotos de Aharadak, o bônus em testes aumenta para +2. Em patamar campeão ou superior, também aumenta os PM máximos em +1 por nível.',
      description: 'Esta cinta de couro possui anzóis enferrujados e afiados. Para usar o cilício vivo, você deve amarrá-lo em sua coxa ou braço (ele conta como um item vestido), de forma a cravar os anzóis em sua carne. O cilício então bebe de seu sangue, adquirindo uma consistência úmida e pulsante. Isso reduz seus PV máximos em 1 por nível. Porém, a dor constante o mantém vigilante, fornecendo um bônus de +1 em todos os seus testes (cumulativo com outros bônus de itens). Se você for um devoto de Aharadak, o bônus aumenta para +2. Se for um devoto de Aharadak de patamar campeão ou superior, o cilício vivo também aumenta seus PM máximos em +1 por nível.'
    },
    {
      name: 'Coração Corrompido', deity: 'Aharadak', tier: 'maior', price: 45000,
      devotion: 'Seu poder só pode ser ativado por um devoto de Aharadak mediante o sacrifício descrito.',
      description: 'Este pequeno baú de madeira esconde um coração cinzento e ressequido. Se um devoto de Aharadak matar uma criatura inteligente e derramar um pouco do sangue dela no coração, ele volta à “vida”, ficando vermelho e pulsante. Enquanto o coração corrompido estiver vivo, qualquer dano ou condição causado ao devoto será absorvido pelo item. O coração pode absorver até 100 pontos de dano e três condições. Quando isso acontecer, volta ao seu estado “morto”... até um novo sacrifício ser feito. O devoto não precisa estar em posse do coração para o efeito funcionar, apenas saber onde ele está. Isso significa que o devoto pode deixar o item escondido, mas, claro, quanto mais longe ele estiver, mais difícil será “revivê-lo” se necessário.'
    },
    {
      name: 'Coroa de Flores', deity: 'Allihanna', tier: 'menor', price: 9000,
      devotion: 'Para devotos de Allihanna, fornece +1 em Sabedoria após 1 dia de uso e +1 por dado nos efeitos numéricos variáveis de suas magias.',
      description: 'Este adereço é feito com ramos verdejantes e flores brancas, rosas, amarelas e lilases e, abençoado pela magia da natureza, permanece sempre vistoso. Se você for um devoto de Allihanna e vestir a coroa de flores, recebe +1 em Sabedoria (apenas após 1 dia de uso) e suas magias com efeitos numéricos variáveis recebem um bônus de +1 por dado (por exemplo, Curar Ferimentos lançada para curar 4d8+4 PV irá curar 4d8+8 PV).'
    },
    {
      name: 'Tapeçaria da Guerra', deity: 'Arsenal', tier: 'maior', price: 35000, improvements: 'aprimorado',
      devotion: 'Em combate, um devoto de Arsenal pode analisá-la com uma ação completa e um teste de Guerra (CD 20) para estender o bônus conforme o resultado.',
      description: 'Esta tapeçaria velha e manchada de sangue mostra um campo de batalha, com imagens representando terreno, tropas e objetivos. Analisar a tapeçaria aguça a sua percepção estratégica — ela funciona como uma ferramenta aprimorada, fornecendo +2 em Guerra. Se você for um devoto de Arsenal, estiver em combate e gastar uma ação completa para analisar a tapeçaria, a magia do item se revela, com as imagens se movendo para representar a batalha na qual você está. Como parte da ação completa, você faz um teste de Guerra (CD 20). Se você passar, o bônus em Guerra se estende para todos os testes de perícia, seus e de seus aliados em alcance curto, até o fim da cena. Se passar por 20 ou mais (ou seja, se somar 40 ou mais no teste de Guerra), você e seus aliados em alcance curto recebem uma ação padrão adicional, cada um em seu próximo turno (apenas uma vez por cena). Analisar a tapeçaria requer as duas mãos.'
    },
    {
      name: 'Cubo Armadilha', deity: 'Hyninn', tier: 'medio', price: 25000,
      devotion: 'Somente um devoto de Hyninn pode ativá-lo. Um devoto de Hyninn que encontre a armadilha pode fazer o cubo adotá-lo como novo dono.',
      description: 'Este pequeno cubo de metal possui diversos botões em sua superfície, mas se você apertá-los nada acontece… Exceto se você for um devoto de Hyninn. Um devoto da Trapaça pode gastar uma ação padrão para apertar os botões e escolher um espaço desocupado em alcance curto. O cubo então flutua até esse espaço e desaparece, ficando invisível e intangível. O primeiro inimigo que entrar nesse espaço é atingido por diversas serras e lâminas que surgem do nada, sofrendo 10d8 pontos de dano de corte (Ref CD Int reduz à metade). Para cada dado de dano que rolar um resultado mínimo ou máximo (ou seja, “1” ou “8”), role 1d8 extra, repetindo o processo a cada resultado mínimo ou máximo. O cubo então reaparece e flutua para seu dono (se ele estiver até alcance longo) ou fica parado no chão (se ele estiver mais longe do que isso). Uma criatura que veja o cubo armadilha sendo ativado pode simplesmente evitar o espaço para onde ele foi, de modo que este item funciona melhor quando usado com preparação. Além disso, uma criatura que procure por armadilhas tem direito a um teste de Investigação (CD 30 + Int do usuário). Se passar, percebe a forma etérea do cubo e pode passar por ele sem ativá-lo (embora não consiga desarmá-lo ou pegá-lo). Se passar e for devota de Hyninn, o cubo reaparece e flutua para ela, adotando-a como nova dona!'
    },
    {
      name: 'Ossos Dracônicos', deity: 'Kallyadranoch', tier: 'maior', price: 90000,
      devotion: 'Para devotos de Kallyadranoch, também fornece +2 em Força, +2 em Carisma e +2 na CD de todas as suas habilidades.',
      description: 'Este item possui a forma de um acessório — como um colar, máscara, colete ou par de brincos — feito de ossos especialmente densos e duros. Qualquer um que toque nos ossos dracônicos sente que eles emanam uma tênue energia — calor, frio, estática ou outra, conforme a natureza do dragão a partir do qual foram feitos. A energia é desconfortável, mas não a ponto de causar dano ou impor qualquer penalidade. Se forem vestidos, os ossos dracônicos fornecem +4 em Intimidação e –2 em Diplomacia. Se forem vestidos por um devoto de Kallyadranoch, emprestam o poder armazenado neles, fornecendo também +2 em Força, +2 em Carisma e +2 na CD de todas as habilidades do devoto.'
    },
    {
      name: 'Caldeirão da Vida', deity: 'Lena', tier: 'medio', price: 25000,
      devotion: 'Devotos de Lena que comerem a refeição também recebem 10 PV temporários.',
      description: 'Esta grande panela de ferro é abençoada com o poder de Lena, e permite preparar refeições únicas. Para isso, você precisa gastar 1 hora, T$ 5 e fazer um teste de Ofício (cozinheiro) contra CD 15. Se você passar, faz comida suficiente para até 5 criaturas Médias ou Pequenas (uma criatura Minúscula come o equivalente à metade de uma criatura Média, uma criatura Grande ou Enorme come o dobro e uma criatura Colossal come o quádruplo). Todos que se alimentarem dela recebem +2 nos testes de resistência por um dia e, se forem devotos de Lena, recebem também 10 PV temporários. Também é possível preparar um prato especial no caldeirão. Nesse caso, faça um único teste de Ofício (cozinheiro) com a CD do prato especial +5 e some o custo da comida do caldeirão ao do prato especial. Se você passar, os benefícios do prato se acumulam com os da comida do caldeirão.'
    },
    {
      name: 'Instrumento da Alegria', deity: 'Marah', tier: 'medio', price: 10500, baseItemId: 'instrumento_musical', improvements: 'aprimorado',
      devotion: 'Um devoto de Marah que usar um poder de Música pode ativar o efeito do item com uma ação livre.',
      description: 'Um instrumento musical comum, como um bandolim, flauta ou tambor, aprimorado (+1 em Atuação). Se você for treinado em Atuação e estiver empunhando o instrumento da alegria, pode gastar uma ação padrão e 1 PM para tocar uma música envolvente, que fornece +2 em testes de perícia para você e seus aliados em alcance médio até o fim da cena (cumulativo com outros bônus de itens). Se você for devoto de Marah e usar um poder de Música, pode ativar o efeito do item com uma ação livre.'
    },
    {
      name: 'Véu Diáfano', deity: 'Marah', tier: 'medio', price: 13500, baseItemId: 'veste_de_seda', improvements: 'aprimorado',
      devotion: 'Para devotos de Marah, fornece +1 em Carisma após 1 dia de uso e +2 na Defesa.',
      description: 'Esta roupa leve e semitransparente conta como uma veste de seda aprimorada. Se você for um devoto de Marah, o véu diáfano torna sua aparência misteriosa e sedutora, fornecendo +1 em Carisma (apenas após 1 dia de uso) e +2 na Defesa (cumulativo com outros bônus de itens).'
    },
    {
      name: 'Colar de Presas', deity: 'Megalokk', tier: 'medio', price: 21000,
      devotion: 'Para devotos de Megalokk, também fornece +2 em testes de ataque e rolagens de dano com armas naturais.',
      description: 'Este adereço é feito com dentes e garras de monstros unidos por tendões. Se for vestido, fornece +2 em Intimidação, mas impõe –2 em Diplomacia. Mais do que isso, carrega em seu âmago o instinto brutal das feras e, se você for um devoto de Megalokk, fornece também +2 em testes de ataque e rolagens de dano com armas naturais.'
    },
    {
      name: 'Jarro das Profundezas', deity: 'Oceano', tier: 'menor', price: 9000,
      devotion: 'Um devoto do Oceano pode empunhá-lo e gastar PM para criar água salgada, disparar uma onda ou invocar um elemental da água.',
      description: 'Este vaso de madrepérola é coberto de imagens de animais marítimos. Se você for um devoto do Oceano e estiver empunhando o jarro das profundezas, pode gastar uma ação padrão e PM para gerar alguns efeitos. Por 1 PM, cria 2 litros de água salgada. Essa água não pode ser bebida pela maioria dos seres, mas serve para cumprir suas Obrigações & Restrições de se manter em contato com o mar. Também por 1 PM, dispara uma onda de água que se derrama em um cone de 6m à sua frente e derruba quaisquer criaturas na área (Ref CD Sab evita). Por fim, por 2 PM você invoca um elemental da água que atua como um parceiro destruidor (dano de frio) ou guardião veterano até o fim da cena.'
    },
    {
      name: 'Escrivaninha Consagrada', deity: 'Tanna-Toh', tier: 'menor', price: 9000, spaces: 2,
      devotion: 'Um devoto de Tanna-Toh que estudar nela por 1 hora dobra por 1 dia seu bônus de treinamento em uma perícia baseada em Int ou Sab.',
      description: 'Esta caixa de madeira repleta de dobradiças possui o símbolo de Tanna-Toh pintado na tampa. Ela pode ser aberta e desdobrada para virar uma escrivaninha portátil, útil para aventureiros que querem ter um espaço para ler e escrever mesmo nos ermos. Se você for um devoto da Deusa do Conhecimento e usar a escrivaninha consagrada para estudar por 1 hora, dobra seu bônus de treinamento em uma perícia baseada em Int ou Sab a sua escolha por 1 dia. Além disso, caso possa fabricar pergaminhos, uma vez por aventura recebe 1d3 pergaminhos que poderia ter criado. Considere que você escreveu esses pergaminhos durante seu tempo livre. A escrivaninha consagrada ocupa 2 espaços.'
    },
    {
      name: 'Vestido Noturno', deity: 'Tenebra', tier: 'medio', price: 21000, baseItemId: 'veste_de_seda', improvements: 'aprimorado,cravejado_de_gemas',
      devotion: 'Um devoto de Tenebra pode gastar uma ação padrão e 5 PM para ficar invisível até o fim da cena, conforme a descrição.',
      description: 'Este vestido negro possui pequenos diamantes costurados em seu tecido, que cintilam como as estrelas do céu noturno. Conta como uma veste de seda aprimorada cravejada de gemas, fornecendo +2 em Enganação e Reflexos. Se você for um devoto de Tenebra e vestir este item, pode gastar uma ação padrão e 5 PM para ficar invisível até o fim da cena (recebe camuflagem total e +10 em testes de Furtividade contra ouvir, e criaturas que não possam vê-lo ficam desprevenidas contra seus ataques). Esse efeito termina se você fizer uma ação hostil direta contra uma criatura.'
    },
    {
      name: 'Pira Póstera', deity: 'Thyatis', tier: 'medio', price: 15000,
      devotion: 'Para devotos de Thyatis, fornece +1 em Sabedoria após 1 dia de posse e uma repetição diária de um teste de Iniciativa, Percepção ou resistência.',
      description: 'Esta pequena bacia de cerâmica negra possui linhas rajadas vermelhas. Se você for um devoto de Thyatis e estiver em posse da pira póstera, recebe +1 em Sabedoria (apenas após 1 dia de posse). Além disso, uma vez por dia pode enchê-la de água e olhar dentro dela para ter visões de possíveis perigos futuros. Uma vez até o fim do dia, quando faz um teste de Iniciativa, Percepção ou de resistência, você pode rolar novamente esse teste.'
    },
    {
      name: 'Botas Inquietas', deity: 'Valkaria', tier: 'medio', price: 15000,
      devotion: 'Para devotos de Valkaria, fornece +1 em Constituição após 1 dia de uso, +5 em Fortitude para marcha forçada e PM temporários por investidas.',
      description: 'Esse par de botas reforçadas é bastante surrado, com marcas dos diversos terrenos pelos quais já passou: carrapichos de florestas, manchas das águas escuras de pântanos, pequenos rasgos das pedras afiadas de montanhas… Se você for um devoto de Valkaria e vestir as botas inquietas, sente um grande desejo de viajar e desbravar o mundo — e a disposição para tal empreitada! Você recebe +1 em Constituição (apenas após 1 dia de uso) e +5 em testes de Fortitude para marcha forçada. Além disso, sempre que realizar uma investida durante um combate, recebe 1 PM temporário cumulativo (até um máximo de 3 PM por patamar por dia).'
    },
    {
      name: 'Argolas Místicas', deity: 'Wynna', tier: 'medio', price: 25500,
      devotion: 'Quando um devoto de Wynna lança uma magia usando as argolas, recebe +2 PM para aprimoramentos, podendo ultrapassar seu limite de gasto de mana.',
      description: 'Esta peculiar peça de vestuário consiste de tiras de couro cru conectadas por pequenas argolas metálicas. O conjunto é costurado, tratado com óleos alquímicos e abençoado por louvores a Wynna. Teria sido criada por arcanistas élficos da antiga Lenórienn inspirados por visões da própria Deusa da Magia, que usaria uma indumentária parecida. Seja qual for sua origem, as argolas místicas geram um efeito espantoso. Quando um devoto de Wynna lança uma magia, a energia flui pelas tiras (que funcionam como canais) em direção às argolas (que funcionam como um tipo de ímã místico), acumulando-se nelas. Normalmente, quando um arcanista conjura um feitiço, quantidades residuais da mana canalizada se dissipam na natureza. As argolas impedem isso, potencializando o esforço do conjurador. Em termos de regras, se você estiver vestindo as argolas místicas, for um devoto de Wynna e lançar uma magia, recebe +2 PM para gastar em aprimoramentos. Esses PM podem ultrapassar o limite de gasto de mana do devoto. As argolas podem ser usadas sobre outras roupas (respeitando-se o limite de quatro itens vestidos), mas sabe-se de pelo menos uma famosa arquimaga élfica que vestia apenas elas. Na época, ninguém acreditava quando a elfa explicava a função da peça, mas talvez ela estivesse falando a verdade o tempo inteiro.'
    },
    {
      name: 'Varinha da Generosidade', deity: 'Wynna', tier: 'medio', price: 30000, baseItemId: 'varinha_arcana', improvements: 'poderoso,material_especial', material: 'madeira_tollon',
      devotion: 'Para devotos de Wynna, fornece redução de dano 5 e transfere ao aliado escolhido 1 PM temporário por círculo da magia lançada.',
      description: 'Esta varinha arcana poderosa de madeira Tollon tem várias runas que emanam um brilho púrpura quando encontram a luz da lua. Se você for um devoto de Wynna, a varinha gera um campo de força que fornece redução de dano 5. Além disso, sempre que você lança uma magia, a mana usada na conjuração flui através da varinha para um aliado em alcance curto a sua escolha. Esse aliado recebe 1 PM temporário por círculo da magia lançada (limitado pelo total de PM gastos na magia). Cada aliado só pode receber mana de uma varinha da generosidade uma vez por dia.'
    }
  ],
  equipment: [
    {
      name: 'Cajado das Matas', deity: 'Allihanna', tier: 'menor', price: 27000, baseItemId: 'bordao',
      devotion: 'Para devotos de Allihanna, torna-se um bordão formidável e fornece +2 na Defesa ao ar livre, pisando sobre terra. Em patamar campeão ou superior, torna-se magnífico.',
      description: 'Este bordão é feito com galhos retorcidos e trançados com couro. Se você for devoto de Allihanna, ele se torna um bordão formidável e, enquanto você estiver ao ar livre e pisando sobre terra, fornece +2 na Defesa (cumulativo com outros bônus de itens). Se for um devoto de patamar campeão ou superior, a arma se torna um bordão magnífico.'
    },
    {
      name: 'Machado da Bravura', deity: 'Arsenal', tier: 'menor', price: 25000, baseItemId: 'machado_de_batalha', improvements: 'certeira,cruel',
      devotion: 'Para devotos de Arsenal, torna-se formidável. Cada investida fornece 1 PM temporário cumulativo, até o limite diário de Sabedoria.',
      description: 'Este machado de batalha certeiro e cruel tem cabo de madeira marrom escura com um reforço de metal nas laterais e lâmina única, feita de aço com muitos entalhes representando batalhas e monstros. Se você for um devoto de Arsenal, ele se torna um machado de batalha certeiro cruel formidável. Sempre que você fizer uma investida, recebe 1 PM temporário cumulativo. Você pode ganhar um número máximo de PM temporários por dia igual a sua Sabedoria.'
    },
    {
      name: 'Alfange Dourado', deity: 'Azgher', tier: 'medio', price: 36000, baseItemId: 'alfange', improvements: 'macica', damage: '2d6',
      devotion: 'Um devoto de Azgher pode sacrificar ouro para remover a penalidade de –2 e receber bônus de +2 a +5 em ataque e dano até o fim do dia.',
      fixedTraits: [{ name: 'Ouro alquímico', description: 'A lâmina pesada impõe –2 em testes de ataque e muda o dano base para 2d6.' }],
      description: 'A lâmina deste alfange maciço é feita de ouro alquimicamente tratado para ser duro como aço. Isso o torna muito pesado (–2 em testes de ataque), mas muda seu dano base para 2d6. Se você for um devoto de Azgher, pode gastar uma ação completa para entoar palavras sagradas e encostar ouro (itens ou tibares) na lâmina do alfange dourado. Se fizer isso, o ouro derrete e a arma brilha com energia mágica. Até o fim do dia, o alfange dourado perde sua penalidade em testes de ataque e recebe um bônus em testes de ataque e rolagens de dano de acordo com o sacrifício: bônus de +2 para T$ 10, +3 para T$ 100, +4 para T$ 500 e +5 para T$ 1.000.'
    },
    {
      name: 'Cimitarra Solar', deity: 'Azgher', tier: 'medio', price: 54000, baseItemId: 'cimitarra', improvements: 'pungente',
      devotion: 'Para devotos de Azgher, torna-se pungente, flamejante e formidável; sob a luz solar, a bola de fogo causa 12d6. Em patamar campeão ou superior, torna-se precisa, flamejante e magnífica.',
      description: 'Esta cimitarra pungente tem cabo de marfim e lâmina de aço reluzente. Quando reflete a luz do sol, o aço tem um brilho dourado. Se você for um devoto de Azgher, a arma se torna uma cimitarra pungente flamejante formidável. Sob a luz do sol, a cimitarra reluz mais forte, com um brilho dourado, e aumenta o dano da bola de fogo que dispara (pelo encanto flamejante) para 12d6. Se você for de patamar campeão ou superior, a arma se torna uma cimitarra precisa flamejante magnífica.'
    },
    {
      name: 'Adaga Sorrateira', deity: 'Hyninn', tier: 'menor', price: 22500, baseItemId: 'adaga',
      devotion: 'Para devotos de Hyninn, torna-se formidável e concede +5 em um teste ou rolagem após o primeiro sucesso em Enganação ou Furtividade de cada cena. Em patamar campeão ou superior, torna-se magnífica.',
      description: 'Esta adaga é feita do que parece ser metal enferrujado. Se você for um devoto de Hyninn, ela se torna uma adaga formidável. Além disso, na primeira vez em que você passar em um teste de Enganação ou Furtividade em cada cena, você recebe +5 em um teste ou rolagem a sua escolha até o fim da cena (cumulativo com outros bônus de itens). Se você for de patamar campeão ou superior, a arma se torna uma adaga magnífica.'
    },
    {
      name: 'Lança da Dominação', deity: 'Kallyadranoch', tier: 'medio', price: 45000, baseItemId: 'lanca', improvements: 'macica',
      devotion: 'Para devotos de Kallyadranoch, fornece bônus progressivo de +1 a +6 em ataque e dano e causa +1d10 de ácido, eletricidade, fogo ou frio por acerto.',
      description: 'Esta lança maciça é feita de uma única haste de metal cinza escuro, e tem um tênue brilho alaranjado. Se você for um devoto de Kallyadranoch, torna-se uma lança maciça que fornece +1 em testes de ataque e rolagens de dano e, a cada acerto, causa +1d10 pontos de dano de ácido, eletricidade, fogo ou frio (a escolha do usuário a cada golpe). Cada vez que você sobe de nível enquanto estiver com a lança, os bônus que ela fornece em ataque e dano aumentam em +1 (até um máximo de +6). Entretanto, a cada mês que você passar separado da lança da dominação, os bônus dela diminuem em –1 (até um mínimo de +1).'
    },
    {
      name: 'Espada Monástica', deity: 'Khalmyr', tier: 'medio', price: 54000, baseItemId: 'espada_longa', improvements: 'certeira',
      devotion: 'Um devoto de Khalmyr pode gastar uma ação de movimento e testar Religião (CD 20): sucesso a torna formidável; por 10 ou mais, também gera Oração; por 20 ou mais, torna-se magnífica.',
      description: 'Esta espada longa certeira possui lâmina de aço reluzente e cabo de ouro com orações ao Deus da Justiça inscritas. Se você for um devoto de Khalmyr e estiver empunhando a espada monástica, pode gastar uma ação de movimento para ler um dos versículos inscritos nela e fazer um teste de Religião (CD 20). Se passar, a arma se torna formidável. Se passar por 10 ou mais, ela gera o efeito básico de Oração. Se passar por 20 ou mais, a arma se torna magnífica. Estes efeitos duram até o fim da cena.'
    },
    {
      name: 'Armadura do Julgamento', deity: 'Khalmyr', tier: 'medio', price: 54000, baseItemId: 'armadura_completa', improvements: 'polida,reforcada',
      devotion: 'Para devotos de Khalmyr, torna-se defensora e permite gastar 2 PM para punir um atacante. Em patamar campeão ou superior, torna-se guardiã.',
      description: 'Esta armadura completa polida reforçada é feita de aço reluzente quase tão reflexivo quanto um espelho. Se você for um devoto de Khalmyr, ela se torna uma armadura completa polida reforçada defensora. Sempre que uma criatura atacá-lo, você pode gastar 2 PM para fazê-la ver seus pecados refletidos na armadura. A criatura fica pasma por 1 rodada (apenas uma vez por cena) e frustrada (Von CD Sab reduz para apenas frustrada). Note que a penalidade em testes mentais imposta pela frustração pode tornar mais fácil convencer a criatura a abandonar a luta através de Diplomacia ou outros efeitos que exijam testes de Vontade — um caminho digno para devotos do Deus da Justiça que queiram julgar seus inimigos em vez de apenas executá-los sumariamente! Se você for um devoto de patamar campeão ou superior, a armadura se torna uma armadura completa polida reforçada guardiã.'
    },
    {
      name: 'Alabarda da Coragem', deity: 'Lin-Wu', tier: 'medio', price: 36000, baseItemId: 'alabarda', improvements: 'certeira,precisa',
      devotion: 'Para devotos de Lin-Wu, torna-se formidável, fornece +5 em Iniciativa e, se o portador for o primeiro a agir, concede 2 PM temporários por nível até o fim da cena.',
      description: 'Esta alabarda certeira precisa possui fitas decorativas que dançam como a cauda de um dragão quando ela é usada em batalha. Se você for um devoto de Lin-Wu, ela se torna uma alabarda certeira precisa formidável que fornece +5 em Iniciativa. Sempre que você for o primeiro a agir em um combate, recebe 2 PM temporários por nível, que duram até o fim da cena.'
    },
    {
      name: 'Katana da Determinação', deity: 'Lin-Wu', tier: 'medio', price: 54000, baseItemId: 'katana', improvements: 'precisa,pungente',
      devotion: 'Para devotos de Lin-Wu, torna-se formidável, ignora imunidade a críticos de lefeu e recompensa derrotá-los. Em patamar campeão ou superior, torna-se magnífica.',
      description: 'Esta katana precisa e pungente é feita de aço tamuraniano e tem cabo coberto de tiras de couro trançadas. A lâmina tem coloração avermelhada, sinal de Lin-Wu para que seus devotos nunca se esqueçam da tragédia que se abateu sobre seu povo. Se você for um devoto de Lin-Wu, a arma se torna uma katana precisa pungente formidável que ignora a imunidade a acertos críticos de lefeu. Sempre que você derrotar um lefeu com a katana, cura 2d8+2 PV e recebe +2 nas rolagens de dano (cumulativo com esse efeito e de outros itens) até o fim da cena. Se você for um devoto de patamar campeão ou superior, ela se torna uma katana precisa pungente magnífica.'
    },
    {
      name: 'Maça Monstruosa', deity: 'Megalokk', tier: 'menor', price: 27000, baseItemId: 'maca', improvements: 'atroz',
      devotion: 'Para devotos de Megalokk, torna-se formidável e seu dano aumenta em dois passos; em patamar campeão ou superior, aumenta em quatro passos ao todo.',
      description: 'Esta maça atroz é feita de rocha vulcânica pontiaguda e afiada. Se você for um devoto de Megalokk, ela se torna uma arma formidável e seu dano aumenta em dois passos. Se você for de patamar campeão ou superior, seu dano aumenta em mais dois passos (para um total de quatro).'
    },
    {
      name: 'Alguma Coisa de Nimb...', deity: 'Nimb', tier: 'medio', price: 54000, type: 'arma', categoryId: 'simples', spaces: 1,
      equipment: { equipavel: true, slotsPermitidos: ['mao_direita', 'mao_esquerda'], ocupaMao: true, itemVestido: false },
      weapon: { combateId: 'corpo_a_corpo', empunhaduraId: 'uma_mao', dano: { principal: '3d8', alternativas: [] }, critico: { margem: 20, multiplicador: 2 }, alcanceId: null, tipoDanoIds: ['corte', 'impacto', 'perfuracao'], propriedadesIds: [], gruposArmaIds: [] },
      devotion: 'Nas mãos de um devoto de Nimb, funciona como uma arma corpo a corpo simples de uma mão, formidável e veloz, com o efeito caótico descrito.',
      description: 'Uma frigideira. Um salame. Uma pluma de avestruz prateada. Todos esses objetos, e quaisquer outros, podem ser itens litúrgicos de Nimb. Esses itens só aparecem para devotos do Caos e sempre em momentos inesperados. O devoto sabe instintivamente que a adaga na bota do guarda, a espiga de milho caída no campo ou a panela do cozinheiro goblin é um item sagrado de seu deus. Nas mãos de um devoto de Nimb, o item funciona como uma arma corpo a corpo simples de uma mão formidável veloz. Independente da forma do item, causa 3d8 pontos de dano (se necessário, role 1d3 para cada ataque, sendo 1 = corte, 2 = impacto e 3 = perfuração), com crítico x2. Quando faz um ataque com o item litúrgico, você pode gastar 1 PM. Se fizer isso e acertar, para cada resultado ímpar que rolar em um dado de dano, rola um dado extra de dano do mesmo tipo, repetindo o processo a cada resultado ímpar.'
    },
    {
      name: 'Tridente Aquoso', deity: 'Oceano', tier: 'medio', price: 54000, baseItemId: 'tridente', improvements: 'pungente',
      devotion: 'Para devotos do Oceano, torna-se congelante e formidável. Se for mergulhado em água, torna-se magnífico até o fim da cena.',
      description: 'Este tridente pungente é feito de coral azulado, e suas três pontas emanam uma tênue névoa gelada. Se você for um devoto do Oceano, ele se torna um tridente pungente congelante formidável. Se o tridente aquoso for mergulhado em água (exige uma ação de movimento e um reservatório de água grande o suficiente, como uma tina, cocho, banheira, rio…), torna-se magnífico até o fim da cena.'
    },
    {
      name: 'Adaga Ofídica', deity: 'Sszzaas', tier: 'medio', price: 36000, baseItemId: 'adaga', improvements: 'cruel',
      devotion: 'Para devotos de Sszzaas, torna-se formidável e ignora resistência ou imunidade a veneno. Em patamar campeão ou superior, sua peçonha torna-se potente.',
      description: 'Esta adaga cruel é feita da presa de uma serpente gigantesca. Possui um compartimento oco no cabo com veneno (peçonha concentrada) que é magicamente reposto a cada golpe. Se você for um devoto de Sszzaas, ela se torna uma adaga cruel formidável que ignora qualquer resistência ou imunidade a veneno de uma criatura atingida. Se você for de patamar campeão ou superior, o veneno vira peçonha potente.'
    },
    {
      name: 'Bordão Sabichão', deity: 'Tanna-Toh', tier: 'maior', price: 72000, baseItemId: 'bordao', improvements: 'macica',
      devotion: 'Para devotos de Tanna-Toh, torna-se formidável e piedoso. Ao gastar 2 PM em um teste de perícia, permite somar Sabedoria ao teste.',
      description: 'Este bordão maciço é feito de metal e cravejado de gemas, todas da mesma cor (cada cajado individual tem sua cor). Se você for um devoto de Tanna-Toh, ele se torna um bordão maciço formidável piedoso. Além disso, sempre que você faz um teste de perícia, pode gastar 2 PM. Nesse caso, o item sussurra um conselho ou lembrete, permitindo que você some sua Sabedoria ao teste.'
    },
    {
      name: 'Machado Lamnoriano', deity: 'Thwor', tier: 'menor', price: 22500, baseItemId: 'machado_de_guerra', improvements: 'atroz',
      devotion: 'Para devotos de Thwor, torna-se formidável. Ao entrar em fúria, seu dano aumenta em um passo; em patamar campeão ou superior, aumenta em dois passos ao todo.',
      description: 'Este machado de guerra atroz possui cabo feito da madeira de árvores milenares, que nascem apenas no continente sul, e lâmina de aço regado pelo sangue dos incontáveis massacres que já ocorreram nessa terra bestial. Se você for um devoto de Thwor, ele se torna um machado de guerra atroz formidável. Sempre que você entrar em fúria, o machado lamnoriano se retorce e cresce, energizado pela sua raiva, e seu dano aumenta em um passo. Se você for de patamar campeão ou superior, o dano aumenta em mais um passo (dois passos ao todo).'
    },
    {
      name: 'Espada Imaculada', deity: 'Thyatis', tier: 'medio', price: 45000, baseItemId: 'espada_longa', improvements: 'precisa',
      devotion: 'Para devotos de Thyatis, torna-se formidável e pode assumir uma forma de plasma vermelho por 2 PM, conforme a descrição.',
      description: 'Esta espada longa precisa tem cabo de aço tingido de vermelho vivo, com asas de pássaro servindo de guarda-mão. Se você for um devoto de Thyatis, ela se torna uma espada longa precisa formidável e você pode gastar 2 PM para fazer a lâmina dela se tornar plasma vermelho até o fim da cena. Nesse estado, o bônus de ataque da espada muda para +4 e seu dano aumenta em dois passos, muda para fogo não letal e ignora 20 pontos de redução de dano.'
    },
    {
      name: 'Mangual Aventureiro', deity: 'Valkaria', tier: 'medio', price: 40000, baseItemId: 'mangual', improvements: 'certeira,cruel',
      devotion: 'Para devotos de Valkaria, torna-se dançarino e formidável. Em um lugar nunca visitado, seu dano aumenta em dois passos.',
      description: 'Este mangual certeiro e cruel tem o cabo e a cabeça feitos de aço, interligados por uma corrente folheada a ouro. Se você for um devoto de Valkaria, ele se torna um mangual dançarino formidável. Se você estiver lutando em um lugar no qual nunca esteve antes, o dano do mangual aventureiro aumenta em dois passos.'
    }
  ]
};