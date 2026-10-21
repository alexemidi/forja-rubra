const fs = require('fs');
const path = require('path');

const RAW_DISTINCTIONS = [
  {
    id: "aeronauta_goblin",
    nome: "Aeronauta Goblin",
    livro: "Heróis de Arton",
    admissao: "Para se tornar um aeronauta goblin, primeiramente é preciso... ser um goblin. Embora membros de outras raças possam aprender a construir e operar máquinas voadoras, a combinação de audácia, capacidade de improviso e mentalidade caótica necessária para ser um aeronautas só pode ser encontrada entre os goblins.\n\nUm goblin que deseje ser um aeronauta deve começar construindo uma máquina voadora. De início, pode ser simples — um balão, um planador —, mas deve ser feita com suas próprias mãos. O candidato deve testar a aeronave. Se ela voar da maneira que ele visualizou, o verdadeiro processo para se tornar um aeronauta goblin pode começar.\n\nA partir daqui, as coisas ficam divertidas! O candidato já aprendeu o básico, agora precisa inovar. Ele deve projetar e construir mais três máquinas voadoras, testando cada uma pessoalmente. As aeronaves precisam aumentar em complexidade e funcionalidade a cada nova criação — por exemplo, sendo mais rápidas, capazes de manobras mais arrojadas, com um teto de voo mais alto... É importante que todas essas três máquinas falhem enquanto o candidato as está testando, provocando quedas, explosões e outros desastres! Isso porque o candidato não deve ir pelo caminho seguro, mas levar suas aeronaves até o limite, aprendendo até onde pode forçar suas criações.\n\nDepois de construir, testar e destruir as três máquinas, o candidato deve criar sua aeronave definitiva (pelo menos por enquanto). Deve incorporar todas as inovações das máquinas anteriores: a velocidade da primeira, a manobrabilidade da segunda, a resistência da terceira... Deve levar todas as inovações até o limite, testar a nova aeronave... e dessa vez não cair.\n\nApenas através de um processo de aprendizado, pilotagem, quedas e aperfeiçoamento na prática o candidato pode aprender. Quando estiver singrando os céus com sua obra-prima, desafiando toda a lógica dos povos presos ao chão, ele terá se tornado um legítimo aeronauta goblin.",
    marca: {
      nome: "Combate Aéreo",
      descricao: "O aeronauta goblin sabe se virar contra inimigos nas alturas. Você recebe uma ação de movimento extra por rodada, que só pode ser usada para pilotar sua aeronave, e não sofre penalidades para atacar à distância ou lançar magias por estar a bordo de uma aeronave."
    },
    poderes: [
      {
        id: "cabeca_nas_nuvens",
        nome: "Cabeça nas Nuvens",
        descricao: "O aeronauta goblin se sente em casa nos céus, sua mente inspirada pela liberdade de voar. Quando está pilotando uma aeronave, você recebe +1 em testes de perícia, rolagens de dano e na CD das suas habilidades e itens. Esse bônus aumenta em +1 para cada dois outros poderes da distinção que você possui.",
        preRequisitosTexto: "Int 2, treinado em Ofício (artesão) e Pilotagem."
      },
      {
        id: "engenharia_aeronautica",
        nome: "Engenharia Aeronáutica",
        descricao: "Tendo 'dominado' a fabricação de aeronaves, é hora de aprimorar o ornitóptero. Você pode fabricar ornitópteros superiores e acoplar até duas engenhocas neles, seguindo as regras normais de engenhocas. Elas não contam em seu limite de engenhocas e não precisam ser empunhadas ou vestidas, mas só podem ser ativadas se você estiver pilotando o ornitóptero.",
        preRequisitosTexto: "Cabeça nas Nuvens, Engenhoqueiro."
      },
      {
        id: "estou_bem_pessoal",
        nome: "Estou Bem, Pessoal!",
        descricao: "Mais do que aprender a pilotar, um bom aeronauta aprende a se acidentar. Você recebe redução de fogo e impacto 5 e sofre apenas metade do dano de quedas.",
        preRequisitosTexto: "Cabeça nas Nuvens."
      },
      {
        id: "manobras_defensivas",
        nome: "Manobras Defensivas",
        descricao: "Às vezes, mais importante que preservar a própria vida é proteger a aeronave! Você soma sua Inteligência na Defesa de qualquer aeronave que estiver pilotando. Além disso, quando você ou a aeronave que você está pilotando sofre dano, você pode gastar 2 PM para fazer um teste de Pilotagem e subtrair o resultado do dano sofrido.",
        preRequisitosTexto: "treinado em Reflexos, Estou Bem, Pessoal!."
      },
      {
        id: "senhor_dos_ceus",
        nome: "Senhor dos Céus",
        descricao: "Tendo derrotado inimigos suficientes, o aeronauta se tornou um verdadeiro ás. Uma vez por rodada, enquanto está pilotando uma aeronave, você pode gastar 3 PM para realizar uma ação padrão adicional.",
        preRequisitosTexto: "Manobras Defensivas, derrotar cinco aeronaves e/ou inimigos voadores enquanto pilota uma aeronave."
      }
    ],
    regrasExtras: "Ornitópteros Goblins: Veículo Grande (transporta criatura Pequena e 10 espaços). Voo 15m, Defesa 15 (+ Des piloto), RD 5, PV = metade dos PV do criador. Cobertura leve. Fabricado com Ofício (artesão) CD 20, 1 semana, custo T$ 300."
  },
  {
    id: "algoz_da_tormenta",
    nome: "Algoz da Tormenta",
    livro: "Heróis de Arton",
    admissao: "O processo de corrupção que leva ao surgimento de um novo algoz da Tormenta é a destruição de um indivíduo, a derrocada de um artoniano até o ponto em que sua devoção aos Lordes supera todos os outros pensamentos, todos os outros instintos. O primeiro passo é adentrar uma área de Tormenta e ter contato físico próximo com seu Lorde.\n\nUma vez aceito, deve provar que não deseja mais ser um artoniano, cometendo algum ato terrível, irremediável e imperdoável contra algo ou alguém que ame (como chacinar a própria família ou trair companheiros fiéis). O Lorde designa então várias tarefas profanas.\n\nPor fim, o candidato enfrenta um teste final de lealdade e traição cósmica, sendo levado a perceber a pequenez dos artonianos frente aos lefeu. Ao fim disso tudo, já perdeu sua individualidade e sanidade, transformando-se em um Algoz da Tormenta.",
    marca: {
      nome: "Servo e Senhor",
      descricao: "Após ter sua existência remodelada pela Tormenta, um algoz não questiona seus senhores. Você se torna imune à Insanidade da Tormenta e a efeitos de medo e mentais, exceto aqueles causados pelo lekael a quem serve."
    },
    poderes: [
      {
        id: "lar_infernal_tormenta",
        nome: "Lar Infernal",
        descricao: "Acostumado às áreas de Tormenta, o algoz só se sente em casa nesses infernos. Você se torna imune aos efeitos de áreas de Tormenta. Além disso, nessas áreas você recebe +5 em testes de perícia e seu descanso conta como luxuoso.",
        preRequisitosTexto: "dois poderes da Tormenta."
      },
      {
        id: "ataque_corrupto_tormenta",
        nome: "Ataque Corrupto",
        descricao: "Os golpes do algoz carregam a Tormenta consigo. Seus ataques recebem o benefício de matéria vermelha, cumulativo com melhorias de material especial, mas seus efeitos nocivos não o afetam. Para cada dois outros poderes da distinção que você possui, o dano extra aumenta em +1d6.",
        preRequisitosTexto: "treinado em Luta ou Pontaria, Lar Infernal."
      },
      {
        id: "desprezo_profano_tormenta",
        nome: "Desprezo Profano",
        descricao: "Qualquer forma de magia é patética contra a Anticriação. Você recebe resistência a magia +1 para cada poder da distinção e pode lançar Dissipar Magia, substituindo o teste de Misticismo por Vontade. Esta não é uma habilidade mágica.",
        preRequisitosTexto: "treinado em Vontade, Ataque Corrupto, não ser devoto (exceto de Aharadak)."
      },
      {
        id: "general_rubro_tormenta",
        nome: "General Rubro",
        descricao: "Os lefeu reconhecem o algoz como um deles. Lefeu de ND menor do que o seu nível são prestativos a você, enquanto criaturas tocadas pela Tormenta ficam enfeitiçadas (Vontade CD Sab +2 para cada poder da Tormenta evita). Se possuir parceiro, ele se torna parceiro aberrante iniciante.",
        preRequisitosTexto: "Desprezo Profano, 11º nível."
      },
      {
        id: "abracar_anticriacao_tormenta",
        nome: "Abraçar Anticriação",
        descricao: "O algoz trai tudo que Arton é, tornando-se de corpo e alma como os invasores. Seu tipo muda para monstro (lefeu) e você recebe todas as habilidades lefeu — sua Insanidade da Tormenta causa perda de 1d6 PM para cada poder da distinção (atributo-chave Sabedoria).",
        preRequisitosTexto: "General Rubro, 17º nível."
      }
    ]
  },
  {
    id: "amazona",
    nome: "Amazona",
    livro: "Heróis de Arton",
    admissao: "Existem dois caminhos para se tornar uma amazona: um para quem nasce entre esse povo, outro para quem o busca espontaneamente. Ambos são exigentes e só disponíveis para mulheres.\n\nPara as nativas, exige viver anos no exílio entre outros povos para conhecer o mundo, e ao retornar superar provas de equitação, arco e combate propostas pelas anciãs, relatando a lição aprendida.\n\nPara as de fora, exige localizar o bando no lombo de sua montaria, persistir nas provações sem usar armas sofisticadas ou tocar os pés no chão, desafiar e vencer uma amazona em duelo de perícias e libertar uma mulher de uma situação de opressão.",
    marca: {
      nome: "Armadura das Amazonas",
      descricao: "Orgulhosas, as amazonas vestem sua autoconfiança como uma verdadeira armadura. Se não estiver usando armadura pesada, você recebe +2 na Defesa."
    },
    poderes: [
      {
        id: "predadora",
        nome: "Predadora",
        descricao: "Você pode gastar uma ação de movimento e 2 PM para analisar um inimigo em alcance médio. Até o fim da cena, recebe +1 em testes de perícia e rolagens de dano contra esse inimigo e criaturas do mesmo tipo. Para cada outro poder da distinção, pode gastar +1 PM para aumentar o bônus em +1.",
        preRequisitosTexto: "treinada em Sobrevivência."
      },
      {
        id: "bencao_de_hippion",
        nome: "Bênção de Hippion",
        descricao: "Você recebe um cavalo de guerra parceiro veterano (ou +2 na Destreza da montaria que já possuir). Vínculo emocional sem necessidade de testes de Adestramento.",
        preRequisitosTexto: "Ginete, Predadora."
      },
      {
        id: "arquearia_montada",
        nome: "Arquearia Montada",
        descricao: "Enquanto está montada, você pode aplicar quaisquer bônus em testes de ataque e rolagens de dano fornecidos pela montaria em seus ataques à distância.",
        preRequisitosTexto: "Bênção de Hippion."
      },
      {
        id: "estilo_da_amazona",
        nome: "Estilo da Amazona",
        descricao: "Uma vez por rodada, ao fazer ataque corpo a corpo com uma mão livre ou escudo leve, pode gastar 2 PM para fazer um ataque adicional com arma de arremesso.",
        preRequisitosTexto: "Estilo de Arremesso, Predadora."
      },
      {
        id: "nunca_ceder",
        nome: "Nunca Ceder",
        descricao: "Quando falha em teste de resistência contra efeito de inimigo, pode gastar 2 PM para repetir o teste com bônus igual ao total de poderes da distinção que possui.",
        preRequisitosTexto: "Estilo da Amazona."
      },
      {
        id: "rainha_amazona",
        nome: "Rainha Amazona",
        descricao: "Você recebe +1 em Carisma e, quando usa Predadora, aplica o bônus recebido como RD contra criaturas desse tipo.",
        preRequisitosTexto: "Arquearia Montada, Nunca Ceder, grande feito em nome das amazonas."
      }
    ]
  },
  {
    id: "armadilheiro_mestre",
    nome: "Armadilheiro Mestre",
    livro: "Heróis de Arton",
    admissao: "O candidato deve obter registros sobre engenharia de armadilhas com mentores ou bibliotecas sombrias. Em seguida, deve invadir uma masmorra e, sem ajuda e sem recorrer a força bruta ou magia, desarmar todas as armadilhas do complexo.\n\nPor fim, deve preparar uma área com pelo menos 10 armadilhas próprias e atrair 5 vítimas reais que sejam capturadas, derrotadas ou afugentadas pelas armadilhas.",
    marca: {
      nome: "Armadilheiro Experiente",
      descricao: "Você recebe +2 em testes de perícia relacionados a armadilhas (encontrar, desarmar e resistir). Sempre que desarma uma armadilha que não seja sua, você recupera 1 PM."
    },
    poderes: [
      {
        id: "armadilha_instantanea",
        nome: "Armadilha Instantânea",
        descricao: "Escolha duas armadilhas entre as de armadilheiro e de caçador. Você pode prepará-las sem precisar de ambiente propício e usa Inteligência como atributo-chave da CD. A cada novo poder da distinção, pode escolher uma nova armadilha.",
        preRequisitosTexto: "treinado em Ladinagem e Ofício (artesão)."
      },
      {
        id: "armadilha_distante",
        nome: "Armadilha Distante",
        descricao: "Ao preparar uma armadilha, gaste 1 PM para prepará-la em qualquer espaço desocupado em alcance curto.",
        preRequisitosTexto: "Des 1, Armadilha Instantânea."
      },
      {
        id: "armadilha_furtiva",
        nome: "Armadilha Furtiva",
        descricao: "A CD de suas armadilhas aumenta em +5 e você adiciona o dano do seu Ataque Furtivo ao dano causado por elas em alvos desprevenidos.",
        preRequisitosTexto: "Armadilha Instantânea, Ataque Furtivo."
      },
      {
        id: "armadilha_recarregavel",
        nome: "Armadilha Recarregável",
        descricao: "Quando uma de suas armadilhas em alcance médio é disparada, pode gastar 1 PM para que ela se rearme automaticamente no início do seu próximo turno.",
        preRequisitosTexto: "Armadilha Instantânea."
      },
      {
        id: "aumentar_complexidade",
        nome: "Aumentar Complexidade",
        descricao: "Soma sua Inteligência no dano e na CD de suas armadilhas e elas ocupam área de 4,5m de lado. Em alcance médio, pode dispará-las como ação livre.",
        preRequisitosTexto: "Armadilha Instantânea."
      },
      {
        id: "tripla_ameaca",
        nome: "Tripla Ameaça",
        descricao: "Gaste 10 PM para preparar até 3 armadilhas ao mesmo tempo em pontos diferentes em alcance curto.",
        preRequisitosTexto: "Aumentar Complexidade."
      }
    ]
  },
  {
    id: "arqueiro_de_lenorienn",
    nome: "Arqueiro de Lenórienn",
    livro: "Heróis de Arton",
    admissao: "Requer provar respeito à tradição élfica perante um mentor (não são aceitos aprendizes goblinoides). O candidato deve superar a Provação das Três Setas (atingir um alvo a longa distância três vezes com apenas duas flechas e um arco, usando magia e pontaria).\n\nApós isso, passa uma estação em isolamento estrito com o mentor e realiza uma missão em benefício direto do povo élfico.",
    marca: {
      nome: "O Arco Arcano",
      descricao: "Seu arco se transforma em um arco arcano: conta como item esotérico de sua escolha e pode receber melhorias e encantos tanto de armas quanto de esotéricos."
    },
    poderes: [
      {
        id: "energizar_arco",
        nome: "Energizar Arco",
        descricao: "Aprende Arma Mágica e pode lançá-la em seu arco como ação de movimento. Se já conhecer, o custo diminui em -1 PM.",
        preRequisitosTexto: "treinado em Misticismo e Pontaria, habilidade Magias, Foco em Arma (arco)."
      },
      {
        id: "chuva_de_flechas",
        nome: "Chuva de Flechas",
        descricao: "Ação padrão e 2 PM para disparar contra múltiplos inimigos em alcance, comparando o ataque à Defesa de cada um até o limite de seu atributo-chave arcano.",
        preRequisitosTexto: "Energizar Arco, magias arcanas de 3º círculo."
      },
      {
        id: "encantar_flechas",
        nome: "Encantar Flechas",
        descricao: "Recebe 20 flechas mágicas menores e passa a poder fabricá-las (médias no 3º círculo e maiores no 4º círculo). Ao esgotar o pacote, recupera os PM sacrificados.",
        preRequisitosTexto: "treinado em Ofício (armeiro), Energizar Arco, magias de 2º círculo."
      },
      {
        id: "flecha_de_toque",
        nome: "Flecha de Toque",
        descricao: "Ao lançar magias que realizam ataque corpo a corpo (ex: Toque Chocante), substitui por ataque à distância com seu arco arcano.",
        preRequisitosTexto: "Energizar Arco."
      },
      {
        id: "flecha_explosiva",
        nome: "Flecha Explosiva",
        descricao: "Aprimoramento +2 PM em magias de área para disparar uma flecha como parte da execução; o centro do efeito passa a ser o alvo atingido.",
        preRequisitosTexto: "Flecha de Toque."
      },
      {
        id: "flecha_fantasma",
        nome: "Flecha Fantasma",
        descricao: "Gaste 2 PM para transformar a flecha em munição etérea: +5 no ataque, ignora cobertura leve e 20 pontos de RD do alvo.",
        preRequisitosTexto: "Energizar Arco, Forma Etérea."
      },
      {
        id: "flecha_da_morte",
        nome: "Flecha da Morte",
        descricao: "Gaste 1 dia e T$ 100 para criar uma flecha que causa 1 dado extra de dano, +2 na margem de ameaça e +2 na CD de flechas de toque/explosivas.",
        preRequisitosTexto: "Encantar Flechas, ter feito crítico com arco em criatura de cada tipo."
      }
    ]
  },
  {
    id: "bruxo_da_tormenta",
    nome: "Bruxo da Tormenta",
    livro: "Heróis de Arton",
    admissao: "Exige aceitação em centro arcano avançado (como Academia Arcana), aulas e leitura de tratados corrompidos, contato com espécimes e apresentar uma tese inédita sobre a Tormenta após incursão direta em área de Tormenta ou culto lefeu.",
    marca: {
      nome: "Insanidade Controlada",
      descricao: "Ao lançar magia, você pode receber uma quantidade de pontos de insanidade (PI) limitada pelo círculo da magia. Cada PI recebido paga 1 PM do custo da magia."
    },
    poderes: [
      {
        id: "conjuracao_insana",
        nome: "Conjuração Insana",
        descricao: "Ao lançar magia, receba PI limitados por seus poderes da distinção para aumentar a CD em +1 por PI.",
        preRequisitosTexto: "Int 2, Caminho do Arcanista (Mago ou Bruxo), poder da Tormenta."
      },
      {
        id: "resistencia_a_tormenta",
        nome: "Resistência à Tormenta",
        descricao: "Aprende Resistência a Energia (-1 PM). Aprimoramento +2 PM protege itens e testes contra áreas de Tormenta e Fenômenos Rubros.",
        preRequisitosTexto: "Conjuração Insana."
      },
      {
        id: "magia_antiaberrante",
        nome: "Magia Antiaberrante",
        descricao: "Recebe PI igual ao círculo da magia para ignorar 10 pontos de RD e ignorar imunidades de lefeu.",
        preRequisitosTexto: "Conjuração Insana."
      },
      {
        id: "corromper_magia",
        nome: "Corromper Magia",
        descricao: "Em magias de dano, receba PI para causar +1d6 de dano de essência por PI recebido.",
        preRequisitosTexto: "Magia Antiaberrante, Resistência à Tormenta."
      },
      {
        id: "escudo_rubro",
        nome: "Escudo Rubro",
        descricao: "Ao sofrer dano ou fazer teste de resistência, receba PI para ganhar +2 no teste ou 5 RD por PI (dobrado contra efeitos da Tormenta).",
        preRequisitosTexto: "Resistência à Tormenta."
      }
    ]
  },
  {
    id: "cacador_de_cabecas",
    nome: "Caçador de Cabeças",
    livro: "Heróis de Arton",
    admissao: "Exclusivo para duyshidakk. Exige encontrar um mestre caçador nas florestas de Lamnor, suportar o isolamento, fabricar ferramentas inusitadas, permanecer oculto por um dia inteiro e abater um alvo designado trazendo sua cabeça.",
    marca: {
      nome: "Terror de Lamnor",
      descricao: "Você recebe +2 em Furtividade e +2 na margem de ameaça de ataques contra criaturas desprevenidas."
    },
    poderes: [
      {
        id: "predador_alfa",
        nome: "Predador Alfa",
        descricao: "Ação de movimento e 2 PM para teste de Furtividade oposto à Percepção de alvo em alcance curto; se vencer, surge adjacente e invisível até o próximo turno.",
        preRequisitosTexto: "treinado em Furtividade, Lobo Solitário, ser duyshidakk."
      },
      {
        id: "arsenal_do_cacador",
        nome: "Arsenal do Caçador",
        descricao: "Soma Sabedoria na CD e no dano de preparados e venenos, aumenta o alcance de arremesso e prepara itens que exigem ação de movimento como ação livre.",
        preRequisitosTexto: "Predador Alfa, Saque Rápido."
      },
      {
        id: "camuflagem_do_cacador",
        nome: "Camuflagem do Caçador",
        descricao: "Sob camuflagem, inimigos aplicam a chance de erro por camuflagem a qualquer efeito contra você, não apenas ataques.",
        preRequisitosTexto: "Camuflagem, Predador Alfa."
      },
      {
        id: "exterminar_presa",
        nome: "Exterminar Presa",
        descricao: "Com Marca da Presa, recebe 1 PM temporário por poder da distinção contra o alvo e multiplica dano extra da marca em acertos críticos.",
        preRequisitosTexto: "Espreitar, Predador Alfa."
      },
      {
        id: "sentidos_de_cacada",
        nome: "Sentidos de Caçada",
        descricao: "Enxerga perfeitamente no escuro (inclusive mágico) e ignora camuflagem por fumaça ou névoa.",
        preRequisitosTexto: "Predador Alfa, Sentidos Aguçados."
      }
    ]
  },
  {
    id: "cacador_de_dragoes",
    nome: "Caçador de Dragões",
    livro: "Heróis de Arton",
    admissao: "Exige ingresso em ordem especializada (como Lanças de Sckharshantallas ou Escamas Vivas), seis meses de treinamento tático e caçar, liderar o abate e trazer o troféu de um dragão verdadeiro relevante aprovado pela guilda.",
    marca: {
      nome: "Escama da Honra",
      descricao: "Você recebe um amuleto que não conta no limite de itens vestidos. Causa +1d6 pontos de dano corpo a corpo do tipo de sopro de dragões que já derrotou."
    },
    poderes: [
      {
        id: "destemor_inflamado",
        nome: "Destemor Inflamado",
        descricao: "Imunidade a medo. Ao ser alvo de efeito de medo, recebe +2 em perícias e dano até o fim da cena (+1 para cada dois outros poderes da distinção).",
        preRequisitosTexto: "treinado em Vontade."
      },
      {
        id: "alcar_aos_ceus",
        nome: "Alçar aos Céus",
        descricao: "2 PM e ação completa para saltar em alcance médio; causa dados extras de dano (dobrados contra dragões) e aterrissa sobre ou adjacente ao alvo.",
        preRequisitosTexto: "treinado em Atletismo, Destemor Inflamado."
      },
      {
        id: "danificar_as_asas",
        nome: "Danificar as Asas",
        descricao: "2 PM ao atacar para deixar o alvo caído e lento (Fortitude evita ou reduz). CD aumenta com poderes da distinção (dobrado contra dragões).",
        preRequisitosTexto: "Destemor Inflamado."
      },
      {
        id: "entortar_escamas",
        nome: "Entortar Escamas",
        descricao: "Em acertos críticos, o alvo sofre -2 na Defesa e -5 na RD até o fim da cena (ou -5 na Defesa e -10 na RD com cinco poderes da distinção).",
        preRequisitosTexto: "Destemor Inflamado, outro poder da distinção."
      },
      {
        id: "evasao_do_cacador",
        nome: "Evasão do Caçador",
        descricao: "Evasão clássica em testes de Reflexos e pode se deslocar até metade do deslocamento ao passar no teste.",
        preRequisitosTexto: "treinado em Reflexos, Destemor Inflamado."
      }
    ]
  },
  {
    id: "campeao_de_dojo",
    nome: "Campeão de Dojo",
    livro: "Heróis de Arton",
    admissao: "Exige treino contínuo em dojo tamuraniano tradicional, alcançar graduação máxima e vencer um torneio desafiando todos os alunos graduados em um único dia, e por fim derrotar o próprio mestre do dojo.",
    marca: {
      nome: "Foco Marcial",
      descricao: "Você pode gastar uma ação de movimento para receber +1d8 na rolagem de dano de seu próximo ataque desarmado feito nessa rodada."
    },
    poderes: [
      {
        id: "golpe_concentrado",
        nome: "Golpe Concentrado",
        descricao: "Ação de movimento e 2 PM para receber +1d8 em suas rolagens de dano desarmado até o fim da cena.",
        preRequisitosTexto: "Sab 2, Briga."
      },
      {
        id: "caminho_da_mao_armada",
        nome: "Caminho da Mão Armada",
        descricao: "Escolha três armas corpo a corpo: contam como ataques desarmados para habilidades e você usa o dano da arma ou o desarmado, o que for melhor.",
        preRequisitosTexto: "Golpe Concentrado."
      },
      {
        id: "caminhar_do_dragao",
        nome: "Caminhar do Dragão",
        descricao: "+5 em Atletismo e pode gastar 1 PM para correr no ar por 1 rodada com voo igual ao deslocamento base.",
        preRequisitosTexto: "treinado em Atletismo, Golpe Concentrado."
      },
      {
        id: "controlar_a_respiracao",
        nome: "Controlar a Respiração",
        descricao: "Ação de movimento e PM até sua Sabedoria: recupera 2d6 PV por PM gasto, aumentando dados com outros poderes da distinção.",
        preRequisitosTexto: "Golpe Concentrado."
      },
      {
        id: "sentidos_do_tigre",
        nome: "Sentidos do Tigre",
        descricao: "Soma Sabedoria na Defesa e em Reflexos (requer armadura leve ou sem armadura).",
        preRequisitosTexto: "Golpe Concentrado."
      }
    ]
  },
  {
    id: "capitao_do_conclave_pirata",
    nome: "Capitão do Conclave Pirata",
    livro: "Heróis de Arton",
    admissao: "Exige possuir navio e tripulação leal, cruzar o Mar Negro, apresentar-se à Dupla Coroa a bordo do navio-fortaleza Sentença, jurar combater os puristas e doar pelo menos dez por cento de um grande saque tomado de inimigos.",
    marca: {
      nome: "Membro do Conclave",
      descricao: "Você recebe +2 em Acrobacia e Pilotagem e não sofre penalidades por atacar à distância ou lançar magias a bordo de veículos."
    },
    poderes: [
      {
        id: "icar_a_bandeira_preta",
        nome: "Içar a Bandeira Preta",
        descricao: "Ação de movimento e 5 PM para conceder 5 PV e 1 PM temporários por poder da distinção a aliados em alcance curto, enquanto inimigos ficam abalados.",
        preRequisitosTexto: "treinado em Intimidação e Pilotagem, Audácia."
      },
      {
        id: "lingua_afiada",
        nome: "Língua Afiada",
        descricao: "Ao vencer Enganação contra criatura inteligente, causa 2d6 de dano psíquico não letal por poder da distinção e reduz custo de Audácia social em -1 PM.",
        preRequisitosTexto: "Içar a Bandeira Preta."
      },
      {
        id: "lutar_sujo",
        nome: "Lutar Sujo",
        descricao: "Teste de manobra para aplicar cego, enjoado, lento ou surdo por 1 rodada em truques sujos.",
        preRequisitosTexto: "Içar a Bandeira Preta."
      },
      {
        id: "sentenca_de_bolso",
        nome: "Sentença de Bolso",
        descricao: "+2 em Intimidação e na margem de ameaça de armas de fogo, causando +2d6 de dano contra oponentes desprevenidos.",
        preRequisitosTexto: "proficiência com armas de fogo, Içar a Bandeira Preta."
      },
      {
        id: "vento_em_popa",
        nome: "Vento em Popa",
        descricao: "2 PM para ação de movimento adicional por turno (custo reduzido a bordo de veículos ou com Velocidade Ladina).",
        preRequisitosTexto: "treinado em Pilotagem, Içar a Bandeira Preta, Pernas do Mar."
      }
    ]
  },
  {
    id: "carteador",
    nome: "Carteador",
    livro: "Heróis de Arton",
    admissao: "Exige dominar 3 jogos de azar, vencer três partidas de apostas extremas (dinheiro ruinoso, vida e alma) cumprindo condições de pura habilidade, pura sorte e pura trapaça, e por fim derrotar outro carteador apostando o próprio título.",
    marca: {
      nome: "Sorte de Principiante",
      descricao: "Aprende e pode lançar Orientação (ou Sorriso da Fortuna) apenas em si mesmo para testes de Jogatina como habilidade não mágica."
    },
    poderes: [
      {
        id: "dado_viciado",
        nome: "Dado Viciado",
        descricao: "Recebe 1d6 como dado de auxílio por cena (+1d6 a cada dois outros poderes). Paga 1 PM por dado para somar no teste de perícia e ganha PM temporário em dados iguais.",
        preRequisitosTexto: "treinado em Jogatina."
      },
      {
        id: "as_na_manga",
        nome: "Ás na Manga",
        descricao: "2 PM para substituir qualquer perícia por Jogatina (uma vez por perícia a cada cena).",
        preRequisitosTexto: "Dado Viciado."
      },
      {
        id: "jogo_perigoso",
        nome: "Jogo Perigoso",
        descricao: "Ação completa e aposta com entidades: teste de Jogatina (CD 20 + PM da magia) para lançar qualquer magia escolhida de 1º círculo.",
        preRequisitosTexto: "treinado em Misticismo, Ás na Manga."
      },
      {
        id: "seduzir_a_sorte",
        nome: "Seduzir a Sorte",
        descricao: "Ao rolar dados de auxílio, faz aposta com o mestre para recuperar os dados gastos se adivinhar quem rolou o maior valor.",
        preRequisitosTexto: "Dado Viciado."
      },
      {
        id: "resultado_destinado",
        nome: "Resultado Destinado",
        descricao: "5 PM para receber temporariamente até o fim da cena uma habilidade de classe de até 5º nível de outra classe qualquer.",
        preRequisitosTexto: "Jogo Perigoso, 17º nível."
      }
    ]
  },
  {
    id: "cavaleiro_do_corvo",
    nome: "Cavaleiro do Corvo",
    livro: "Heróis de Arton",
    admissao: "Localizar o Ninho do Corvo nas montanhas Lannestul, fazer juramento inquebrantável de segredo, sobreviver a meses de provações brutais e simulações de corrupção, e receber um codinome funcional de seus superiores.",
    marca: {
      nome: "Não Tenho Nome",
      descricao: "Você aprende a Língua dos Corvos, torna-se imune a medo e perde a habilidade Código de Honra (caso a tenha)."
    },
    poderes: [
      {
        id: "reconhecimento_e_infiltracao",
        nome: "Reconhecimento e Infiltração",
        descricao: "Deslocamento +3m, sem penalidade por armadura e penalidade reduzida para -10 em ações chamativas de Furtividade.",
        preRequisitosTexto: "treinado em Furtividade e Guerra, proficiência com armaduras pesadas."
      },
      {
        id: "a_qualquer_custo",
        nome: "A Qualquer Custo",
        descricao: "Declara uma missão específica e gasta T$ 500 para receber benefícios como arma anticriatura, perícias extras ou uso de Guerra.",
        preRequisitosTexto: "Reconhecimento e Infiltração."
      },
      {
        id: "atras_das_linhas_inimigas",
        nome: "Atrás das Linhas Inimigas",
        descricao: "Imunidade a atordoamento e cansaço, e descanso nunca inferior a normal.",
        preRequisitosTexto: "Reconhecimento e Infiltração."
      },
      {
        id: "das_trevas",
        nome: "Das Trevas",
        descricao: "Ao atacar alvo desprevenido ou flanqueado marcado por Duelo, aumenta os bônus da habilidade em +2.",
        preRequisitosTexto: "Duelo, Atrás das Linhas Inimigas."
      },
      {
        id: "ferramenta_de_morte",
        nome: "Ferramenta de Morte",
        descricao: "Ação de movimento e PM até Inteligência para coordenar ataques de aliados contra o alvo, fornecendo bônus e margem de ameaça.",
        preRequisitosTexto: "A Qualquer Custo, ter liderado grupo em combates vitoriosos."
      },
      {
        id: "postura_tomada_furtiva",
        nome: "Postura de Combate: Tomada Furtiva",
        descricao: "Mirar como ação livre, sem penalidade em Furtividade por mover em velocidade normal e +2 em ataque e dano à distância.",
        preRequisitosTexto: "treinado em Pontaria, Reconhecimento e Infiltração."
      },
      {
        id: "trazemos_a_luz",
        nome: "Trazemos a Luz",
        descricao: "Ação de movimento e 3 PM para teste de Guerra: recebe PV temporários iguais ao resultado e bônus progressivos de ataque e dano.",
        preRequisitosTexto: "Das Trevas."
      }
    ]
  },
  {
    id: "cavaleiro_feerico",
    nome: "Cavaleiro Feérico",
    livro: "Heróis de Arton",
    admissao: "Treinar por um inverno inteiro com um mentor isolado na floresta aprendendo a história élfica e os caminhos das fadas, retornar no inverno seguinte com uma oferenda digna e beber o chá de Lamnor respondendo às perguntas cerimoniais.",
    marca: {
      nome: "Conexão Feérica",
      descricao: "Você recebe a habilidade Empatia Selvagem e +1 PM para cada poder da distinção que possuir."
    },
    poderes: [
      {
        id: "arte_elfica",
        nome: "Arte Élfica",
        descricao: "Ao acertar com espada longa ou florete, gaste 2 PM para ativar Música de bardo ou magia arcana como ação livre.",
        preRequisitosTexto: "habilidade Magias, treinado em Atuação e Luta, Foco em Arma (espada longa ou florete)."
      },
      {
        id: "arma_da_floresta",
        nome: "Arma da Floresta",
        descricao: "1 PM para cobrir espada ou florete de elementos naturais: dano mágico aumentado em um passo.",
        preRequisitosTexto: "Arte Élfica."
      },
      {
        id: "armadura_da_floresta",
        nome: "Armadura da Floresta",
        descricao: "Recebe armadura completa viva de madeira e folhas que não reduz deslocamento, soma Destreza na Defesa e permite lançar magias sem testes de Misticismo.",
        preRequisitosTexto: "Arte Élfica."
      },
      {
        id: "flagelo_dos_duyshidakk",
        nome: "Flagelo dos Duyshidakk",
        descricao: "Soma poderes da distinção no dano contra bandos, enxames e duyshidakk. Ao reduzir inimigo a 0 PV, desloca-se e ataca outro por 2 PM.",
        preRequisitosTexto: "Arte Élfica."
      },
      {
        id: "laminas_feericas",
        nome: "Lâminas Feéricas",
        descricao: "Espadas longas contam como armas ágeis e somam seu círculo máximo de magias ao dano.",
        preRequisitosTexto: "Arte Élfica."
      },
      {
        id: "montaria_feerica",
        nome: "Montaria Feérica",
        descricao: "Recebe parceiro montaria veterano de natureza feérica (+5 em Cavalgar para correr e saltar).",
        preRequisitosTexto: "treinado em Cavalgar, Arte Élfica."
      }
    ]
  },
  {
    id: "chapeu_preto",
    nome: "Chapéu-preto",
    livro: "Heróis de Arton",
    admissao: "Testemunhar ou causar pelo menos três grandes atos de maldade ou perda irremediável, sofrer sequelas profundas na alma e renegar todas as divindades justas e laços benévolos, despertando com seu chapéu amaldiçoado.",
    marca: {
      nome: "Esse Maldito Chapéu",
      descricao: "Você recebe um chapéu preto que concede +2 em Intimidação e na CD de seus efeitos de medo, mas impõe -2 em Adestramento, Atuação e Diplomacia."
    },
    poderes: [
      {
        id: "coracao_duro",
        nome: "Coração Duro",
        descricao: "+2 em dano com armas e imunidade a medo (+2 em Vontade se já for imune).",
        preRequisitosTexto: "treinado em Luta ou Pontaria, Presença Aterradora."
      },
      {
        id: "bala_nas_costas",
        nome: "Bala nas Costas",
        descricao: "1 PM no primeiro ataque da cena para receber +10 na margem de ameaça.",
        preRequisitosTexto: "Coração Duro, dois outros poderes da distinção."
      },
      {
        id: "congelar_o_inferno",
        nome: "Congelar o Inferno",
        descricao: "2 PM ao usar efeito de medo para ignorar imunidades a medo e efeitos mentais dos alvos.",
        preRequisitosTexto: "Coração Duro, dois outros poderes da distinção."
      },
      {
        id: "dance",
        nome: "Dance!",
        descricao: "2 PM em Intimidação para demonstrar habilidade e somar atributo de ataque ao teste.",
        preRequisitosTexto: "Coração Duro."
      },
      {
        id: "olhos_de_chumbo",
        nome: "Olhos de Chumbo",
        descricao: "Aura de medo de 9m: inimigos sofrem -2 em dano e na Defesa (penalidade aumenta com outros poderes).",
        preRequisitosTexto: "Coração Duro, procurado pelas autoridades."
      },
      {
        id: "rapido_ou_morto",
        nome: "Rápido ou Morto",
        descricao: "+2 em Iniciativa e +3m no deslocamento base.",
        preRequisitosTexto: "treinado em Iniciativa, Coração Duro."
      },
      {
        id: "tiro_a_traicao",
        nome: "Tiro à Traição",
        descricao: "O dano de armas contra alvos desprevenidos ou sob medo aumenta em um passo.",
        preRequisitosTexto: "Coração Duro, 3 acertos críticos em alvos desprevenidos."
      }
    ]
  },
  {
    id: "cobaia_dos_medicos_monstros",
    nome: "Cobaia dos Médicos Monstros",
    livro: "Heróis de Arton",
    admissao: "Conseguir indicação de antigo paciente dos Médicos Monstros em Vectora, pagar pelos enxertos e sobreviver à cirurgia de enxerto de tecidos monstruosos no corpo.",
    marca: {
      nome: "Procedimento Inicial",
      descricao: "Você se torna um monstro em adição ao seu tipo, penalidade de implantes reduzida de -2 para -1 e paga 20% a menos por implantes."
    },
    poderes: [
      {
        id: "enxerto_experimental",
        nome: "Enxerto Experimental",
        descricao: "Recebe implante gratuito de até T$ 18.000 (rola 1d4 no início da cena; em resultado 1, não funciona).",
        preRequisitosTexto: "Foco em Perícia (Fortitude)."
      },
      {
        id: "corpo_resiliente",
        nome: "Corpo Resiliente",
        descricao: "Não sofre penalidade em Fortitude por implantes e aumenta o limite de implantes em +1.",
        preRequisitosTexto: "Enxerto Experimental."
      },
      {
        id: "extrapolar_o_proprio_corpo",
        nome: "Extrapolar o Próprio Corpo",
        descricao: "Recebe um poder racial qualquer como implante cirúrgico.",
        preRequisitosTexto: "Implante Exclusivo."
      },
      {
        id: "glandula_de_infusao",
        nome: "Glândula de Infusão",
        descricao: "Lança magia de até 2º círculo como engenhoca biológica usando Constituição e Fortitude.",
        preRequisitosTexto: "Enxerto Experimental."
      },
      {
        id: "implante_exclusivo",
        nome: "Implante Exclusivo",
        descricao: "Ação de movimento e 1 PM para aplicar temporariamente um encanto de arma na arma empunhada.",
        preRequisitosTexto: "Enxerto Experimental."
      }
    ]
  },
  {
    id: "dracomante_real",
    nome: "Dracomante Real",
    livro: "Heróis de Arton",
    admissao: "Ser um mago dedicado ao poder dracônico, analisar resíduos mágicos de uma magia conjurada por um Dragão-Real e ter contato direto a poucos passos do próprio Dragão-Real em sua forma dracônica.",
    marca: {
      nome: "Mestre Dracônico",
      descricao: "Escolha um Dragão-Real (Beluhga, Benthos, Hydora, Mzzileyn, Sckhar, Tarso ou Zadbblein). Magias do elemento do mestre causam +2 de dano ou perda de PV."
    },
    poderes: [
      {
        id: "afinidade_draconica",
        nome: "Afinidade Dracônica",
        descricao: "+2 na CD de magias do elemento dracônico e redução de dano 3 contra esse tipo por poder da distinção.",
        preRequisitosTexto: "5º nível de Mago."
      },
      {
        id: "dracomancia",
        nome: "Dracomancia",
        descricao: "Ao lançar magia, recebe redução de dano 5 e resistência a magia +5 até o próximo turno.",
        preRequisitosTexto: "Afinidade Dracônica."
      },
      {
        id: "majestade_elemental",
        nome: "Majestade Elemental",
        descricao: "Magias do elemento do mestre ignoram até 20 de RD e causam metade do dano em criaturas imunes.",
        preRequisitosTexto: "magias arcanas de 3º círculo, Dracomancia."
      },
      {
        id: "memoria_draconica",
        nome: "Memória Dracônica",
        descricao: "Memoriza magias adicionais por dia iguais ao número de poderes da distinção do elemento de seu mestre.",
        preRequisitosTexto: "Dracomancia."
      },
      {
        id: "verdadeiro_poder",
        nome: "Verdadeiro Poder",
        descricao: "Aprende Metamorfose / Transformação em Dragão e pode lançar magias normalmente na forma dracônica.",
        preRequisitosTexto: "magias arcanas de 4º círculo, quatro poderes da distinção."
      }
    ]
  },
  {
    id: "drogadora",
    nome: "Drogadora",
    livro: "Heróis de Arton",
    admissao: "Exclusivo para mulheres com metabolismo natural. Exige ser aceita em comunidade thera, expor-se a fórmulas químicas e venenos, produzir um antídoto supremo e passar pelo ritual de reclusão e ingestão do antídoto sob visões dolorosas.",
    marca: {
      nome: "Tradição da Cura",
      descricao: "Você pode usar Sabedoria como atributo-chave de Ofício (alquimista) em vez de Inteligência (+2 se já usar)."
    },
    poderes: [
      {
        id: "curandeira_eximia",
        nome: "Curandeira Exímia",
        descricao: "Seu corpo funciona como maleta de medicamentos com bônus por poderes da distinção e soma Constituição na cura de seus preparados.",
        preRequisitosTexto: "treinada em Cura e Ofício (alquimista), Vitalidade."
      },
      {
        id: "aspersao_curativa",
        nome: "Aspersão Curativa",
        descricao: "Ação padrão e 3 PV para secretar líquido curativo que cura 3d6+3 PV ou remove condições em criaturas adjacentes.",
        preRequisitosTexto: "Curandeira Exímia."
      },
      {
        id: "laboratorio_natural",
        nome: "Laboratório Natural",
        descricao: "Fabrica poções ou preparados alquímicos instantaneamente sem gastar tempo pelo número de poderes da distinção ao dia.",
        preRequisitosTexto: "Remédios da Floresta."
      },
      {
        id: "perfume_intoxicante",
        nome: "Perfume Intoxicante",
        descricao: "Feromônios marcam atacantes corpo a corpo, ignorando camuflagem e dando bônus de ataque a aliados.",
        preRequisitosTexto: "Curandeira Exímia."
      },
      {
        id: "remedios_da_floresta",
        nome: "Remédios da Floresta",
        descricao: "Fabrica poções instantâneas gastando PV no lugar de tibares e PM.",
        preRequisitosTexto: "Curandeira Exímia."
      }
    ]
  },
  {
    id: "engenhoqueiro_goblin",
    nome: "Engenhoqueiro Goblin",
    livro: "Heróis de Arton",
    admissao: "Exclusivo para goblins. Construir engenhocas sem medidas de segurança por duas estações, sofrer pelo menos uma explosão monumental de invenção própria, improvisar engenhocas com sucata e construir uma geringonça funcional diante de colegas goblins.",
    marca: {
      nome: "Engenhocaria Goblinoide",
      descricao: "Fabrica engenhocas em 1 dia e pela metade do custo em tibares. Nunca pode escolher 0, 10 ou 20 na ativação; falhas por 5 ou mais explodem causando dano de impacto em 3m."
    },
    poderes: [
      {
        id: "aprimorar_bugiganga",
        nome: "Aprimorar Bugiganga",
        descricao: "Gasta 1 hora e T$ 100 para instalar gambiarras (bateria potente, bobina poderosa, cristal canalizador, etiqueta de instruções, luneta aproximadora).",
        preRequisitosTexto: "Engenhoqueiro, Vitalidade."
      },
      {
        id: "abandonar_geringonca",
        nome: "Abandonar Geringonça",
        descricao: "1 PM em falha grave para arremessar a engenhoca a alcance curto antes que ela exploda em você.",
        preRequisitosTexto: "Aprimorar Bugiganga, ter sofrido dano da própria engenhoca."
      },
      {
        id: "autodestruicao",
        nome: "Autodestruição",
        descricao: "Ação completa e PM para forçar falha crítica e detonar uma engenhoca como granada em alcance curto.",
        preRequisitosTexto: "Abandonar Geringonça."
      },
      {
        id: "enjambracao",
        nome: "Enjambração",
        descricao: "Ação completa para criar engenhoca instantânea sem gastar tibares que dura até o fim da cena.",
        preRequisitosTexto: "Aprimorar Bugiganga, outro poder da distinção."
      },
      {
        id: "manutencao_precaria",
        nome: "Manutenção Precária",
        descricao: "Fabrica engenhocas temporárias em tempos entre aventuras que não contam no limite.",
        preRequisitosTexto: "Aprimorar Bugiganga."
      }
    ]
  },
  {
    id: "escapista_magnifico",
    nome: "Escapista Magnífico",
    livro: "Heróis de Arton",
    admissao: "Ser recrutado pela Guilda sem Nome de Valkaria por possuir um 'defeito' evidente que o torne insuspeito, treinar por seis meses na sede mantendo segredo absoluto de todos os companheiros e nunca tentar corrigir o seu defeito.",
    marca: {
      nome: "Vantagem Secreta",
      descricao: "Escolha uma fonte de penalidade (habilidade racial, poder da Tormenta ou complicação): você ignora as penalidades dessa fonte."
    },
    poderes: [
      {
        id: "nao_ha_ninguem_aqui",
        nome: "Não Há Ninguém Aqui",
        descricao: "2 PM para se esconder sem camuflagem ou cobertura e reduz pela metade a penalidade de ações chamativas.",
        preRequisitosTexto: "Aparência Inofensiva, Escapista."
      },
      {
        id: "aparencia_insignificante",
        nome: "Aparência Insignificante",
        descricao: "Soma poderes da distinção na CD de Aparência Inofensiva e pode usá-lo uma vez contra cada inimigo.",
        preRequisitosTexto: "Não Há Ninguém Aqui."
      },
      {
        id: "fujao",
        nome: "Fujão",
        descricao: "2 PM ao sofrer ataque ou efeito para substituir a Defesa ou o teste de resistência por teste de Acrobacia.",
        preRequisitosTexto: "treinado em Acrobacia, Não Há Ninguém Aqui."
      },
      {
        id: "mao_leve",
        nome: "Mão Leve",
        descricao: "2 PM ao desarmar para usar Ladinagem no lugar de Luta e pegar o item na mão.",
        preRequisitosTexto: "Não Há Ninguém Aqui."
      },
      {
        id: "peguei_um_bobo",
        nome: "Peguei um Bobo",
        descricao: "Ação padrão e 2 PM para efeito de Comando através de pura enganação.",
        preRequisitosTexto: "Aparência Insignificante."
      }
    ]
  },
  {
    id: "gigante_furioso",
    nome: "Gigante Furioso",
    livro: "Heróis de Arton",
    admissao: "Derrotar um gigante em combate corporal, devorar seu coração cru e quente sem vomitá-lo e receber o ritual sangrento de um xamã de Megalokk transferindo a essência titânica.",
    marca: {
      nome: "Desprezar os Pequenos",
      descricao: "Contra atacantes menores que você, você recebe redução de dano 2 por categoria de tamanho de diferença entre os dois."
    },
    poderes: [
      {
        id: "furia_dos_gigantes",
        nome: "Fúria dos Gigantes",
        descricao: "Ao entrar em fúria, 2 PM para aumentar tamanho em uma categoria (+2 Força por categoria, escalando com poderes da distinção).",
        preRequisitosTexto: "Con 3, treinado em Fortitude, Fúria."
      },
      {
        id: "arremesso_de_rochas",
        nome: "Arremesso de Rochas",
        descricao: "Ação de movimento e 1 PM em fúria para arrancar rocha e arremessar em alcance médio atingindo área de 4,5m de lado.",
        preRequisitosTexto: "Fúria dos Gigantes."
      },
      {
        id: "golpes_pesados",
        nome: "Golpes Pesados",
        descricao: "1 PM em ataque corpo a corpo em fúria para empurrar o alvo como ação livre causando dano de impacto se bater em paredes.",
        preRequisitosTexto: "Fúria dos Gigantes."
      },
      {
        id: "terremoto_da_furia",
        nome: "Terremoto da Fúria",
        descricao: "Ação de movimento e 3 PM para pisotear o chão: raio de 9m sofre 1d12+For e fica caído.",
        preRequisitosTexto: "Fúria dos Gigantes."
      },
      {
        id: "salto_tectonico",
        nome: "Salto Tectônico",
        descricao: "Ao usar Terremoto da Fúria, salta para alcance médio e aumenta área e dano com teste de Atletismo.",
        preRequisitosTexto: "treinamento em Atletismo, Terremoto da Fúria."
      }
    ]
  },
  {
    id: "ginete_de_namalkah",
    nome: "Ginete de Namalkah",
    livro: "Heróis de Arton",
    admissao: "Nativo de Namalkah com irmão cavalo desde a infância, viajar pelo reino acompanhando um tropel, passar por três reinos estrangeiros com seu cavalo e vencer uma corrida, domar animal xucro e derrotar monstro ao lado de sua montaria.",
    marca: {
      nome: "Amalkhan",
      descricao: "Você e seu irmão cavalo desenvolvem profundo laço: ele passa a fornecer +1 na Defesa e em Reflexos."
    },
    poderes: [
      {
        id: "irmao_campestre",
        nome: "Irmão Campestre",
        descricao: "1 PM para receber +2 em teste de perícia montado em seu irmão cavalo (+2 por nível de parceiro).",
        preRequisitosTexto: "Ginete, ter um irmão cavalo."
      },
      {
        id: "cavaleiro_rustico",
        nome: "Cavaleiro Rústico",
        descricao: "Soma Sabedoria na Defesa e irmão cavalo ganha parceiro guardião iniciante.",
        preRequisitosTexto: "Sab 1, Irmão Campestre."
      },
      {
        id: "caminho_das_coxilhas",
        nome: "Caminho das Coxilhas",
        descricao: "Aumenta o nível de parceiro do irmão cavalo e substitui perícias de Destreza por Cavalgar.",
        preRequisitosTexto: "Cavaleiro Rústico."
      },
      {
        id: "coice",
        nome: "Coice",
        descricao: "1 PM ao agredir ou investir para ataque extra com cascos (1d8, crítico x2, impacto).",
        preRequisitosTexto: "treinado em Luta ou Pontaria, Irmão Campestre."
      },
      {
        id: "irmaos_inseparaveis",
        nome: "Irmãos Inseparáveis",
        descricao: "Parceiro do cavalo avança para mestre e comunicação telepática em alcance longo.",
        preRequisitosTexto: "Caminho das Coxilhas."
      }
    ]
  },
  {
    id: "guerreiro_magico",
    nome: "Guerreiro Mágico",
    livro: "Heróis de Arton",
    admissao: "Ser arcanista experiente e guerreiro capaz separadamente, ingressar em instituição renomada (Academia Arcana, Wynlla ou Ubani) e ser aprovado no mês intensivo de provas práticas unindo espada e magia.",
    marca: {
      nome: "Arma Arcana",
      descricao: "Ao lançar magia empunhando arma corpo a corpo, recebe +2 no dano da magia e pode usar a mão da arma para executar gestos."
    },
    poderes: [
      {
        id: "estilo_de_combate_arcano",
        nome: "Estilo de Combate Arcano",
        descricao: "Escolha entre Encouraçado Místico (lança magias de armadura sem testes de Misticismo) ou Dançarino Marcial (+1 Defesa e dano).",
        preRequisitosTexto: "habilidade Magias, treinado em Luta."
      },
      {
        id: "fogo_e_aco",
        nome: "Fogo e Aço",
        descricao: "Ao lançar magia, recebe bônus em ataque e dano com armas igual ao círculo da magia até o próximo turno.",
        preRequisitosTexto: "Estilo de Combate Arcano."
      },
      {
        id: "aparar_magia",
        nome: "Aparar Magia",
        descricao: "2 PM ao falhar em resistência contra efeito mágico para usar teste de ataque no lugar do teste.",
        preRequisitosTexto: "Fogo e Aço."
      },
      {
        id: "ataque_arcano",
        nome: "Ataque Arcano",
        descricao: "2 PM ao acertar ataque corpo a corpo para lançar magia de toque ou área como ação livre centrada no alvo.",
        preRequisitosTexto: "Fogo e Aço."
      },
      {
        id: "preparacao_veloz",
        nome: "Preparação Veloz",
        descricao: "Na primeira rodada de combate, lança magia de alcance pessoal como ação livre.",
        preRequisitosTexto: "Fogo e Aço."
      }
    ]
  },
  {
    id: "infiltrador_de_wynlla",
    nome: "Infiltrador de Wynlla",
    livro: "Heróis de Arton",
    admissao: "Conquistar patrono secreto no Reino da Magia, demonstrar talento com magia e ladinagem em armadilhas mágicas e cumprir missões de espionagem fora de Wynlla sem expor seu patrocinador.",
    marca: {
      nome: "Ladinagem Mágica",
      descricao: "Ação de movimento para mover objetos leves em alcance curto telecineticamente e 1 PM para Ladinagem à distância."
    },
    poderes: [
      {
        id: "trapaca_arcana",
        nome: "Trapaça Arcana",
        descricao: "Lança magias arcanas de 1º e 2º círculo vestindo armaduras leves com Inteligência.",
        preRequisitosTexto: "treinado em Enganação, Ladinagem e Misticismo, lançar magia arcana."
      },
      {
        id: "conjuracao_furtiva",
        nome: "Conjuração Furtiva",
        descricao: "Criaturas desprevenidas sofrem -5 em testes de resistência contra suas habilidades mágicas.",
        preRequisitosTexto: "treinado em Furtividade, Magia Traiçoeira."
      },
      {
        id: "criar_armadilha_magica",
        nome: "Criar Armadilha Mágica",
        descricao: "Aprende Conjurar Armadilha como magia arcana (-1 PM se já conhecer).",
        preRequisitosTexto: "Trapaça Arcana."
      },
      {
        id: "disfarce_mental",
        nome: "Disfarce Mental",
        descricao: "Usa Inteligência para Enganação e recebe proteção contra adivinhações mentais com Disfarce Ilusório.",
        preRequisitosTexto: "Trapaça Arcana, Disfarce Ilusório."
      },
      {
        id: "enganar_item_magico",
        nome: "Enganar Item Mágico",
        descricao: "Ativa itens mágicos sem cumprir requisitos de classe/raça e usa aprimoramentos sem conhecer a magia.",
        preRequisitosTexto: "Trapaça Arcana."
      },
      {
        id: "magia_traicoeira",
        nome: "Magia Traiçoeira",
        descricao: "Aprimoramento +2 PM em magias de dano contra alvos desprevenidos para aplicar Ataque Furtivo.",
        preRequisitosTexto: "Ataque Furtivo 3d6, Disfarce Mental."
      }
    ]
  },
  {
    id: "mago_da_ordem_do_vazio",
    nome: "Mago da Ordem do Vazio",
    livro: "Heróis de Arton",
    admissao: "Redescobrir autodidaticamente um componente material único nunca antes utilizado por outros magos do Vazio e superar três grandes desafios arcanos canalizando todas as suas magias exclusivamente por meio dele.",
    marca: {
      nome: "Componente Especial",
      descricao: "Suas magias exigem seu componente especial único; ao usá-lo, a CD para resistir às suas magias aumenta em +2."
    },
    poderes: [
      {
        id: "magia_experimental",
        nome: "Magia Experimental",
        descricao: "Teste de Misticismo ao lançar magia para aplicar aprimoramentos gratuitos ou reduzir custo em -1 PM.",
        preRequisitosTexto: "habilidade Magias, treinado em Misticismo, poder de aprimoramento."
      },
      {
        id: "conhecimento_obscuro",
        nome: "Conhecimento Obscuro",
        descricao: "2 PM para substituir qualquer teste de perícia por Misticismo.",
        preRequisitosTexto: "Magia Experimental."
      },
      {
        id: "exercitar_os_musculos_arcanos",
        nome: "Exercitar os Músculos Arcanos",
        descricao: "Reduz o custo da próxima magia da cena em -1 PM ficando fatigado a cada uso repetido.",
        preRequisitosTexto: "Magia Experimental."
      },
      {
        id: "ingrediente_secreto",
        nome: "Ingrediente Secreto",
        descricao: "Gasta PM até os poderes da distinção para infundir dano de essência bruto na magia.",
        preRequisitosTexto: "Magia Experimental."
      },
      {
        id: "inovacao_particular",
        nome: "Inovação Particular",
        descricao: "Criaturas tentando anular ou dissipar suas magias precisam passar em teste de Vontade contra sua CD.",
        preRequisitosTexto: "Magia Experimental."
      }
    ]
  },
  {
    id: "mago_de_batalha_de_wynlla",
    nome: "Mago de Batalha de Wynlla",
    livro: "Heróis de Arton",
    admissao: "Apresentar-se no Centro de Treinamento Arcano Militar em Sophand, passar na peneira física/arcana rigorosa, concluir seis meses de internato militar e servir ou obter dispensa especial do exército de Wynlla.",
    marca: {
      nome: "Armamento Esotérico",
      descricao: "Quando você usa um item esotérico para lançar uma magia, a CD para resistir a ela aumenta em +1."
    },
    poderes: [
      {
        id: "conjurador_encouracado",
        nome: "Conjurador Encouraçado",
        descricao: "Proficiência com armaduras pesadas e lança magias sem testes de Misticismo com bônus na Defesa.",
        preRequisitosTexto: "habilidade Magias, magias arcanas de 2º círculo, treinado em Misticismo, Arcano de Batalha."
      },
      {
        id: "arsenal_arcano",
        nome: "Arsenal Arcano",
        descricao: "Proficiência com armas marciais e usa armas como itens esotéricos somando melhorias ao Arcano de Batalha.",
        preRequisitosTexto: "treinado em Luta ou Pontaria, Conjurador Encouraçado."
      },
      {
        id: "conjuracao_magibelica",
        nome: "Conjuração Magibélica",
        descricao: "Aprende técnicas especiais magibélicas de impacto corporal e devastação em área.",
        preRequisitosTexto: "Conjurador Encouraçado."
      },
      {
        id: "guarda_magica",
        nome: "Guarda Mágica",
        descricao: "Ao lançar magia arcana, recebe PV temporários iguais aos PM gastos na magia.",
        preRequisitosTexto: "treinado em Fortitude, Conjurador Encouraçado."
      },
      {
        id: "infantaria_arcana",
        nome: "Infantaria Arcana",
        descricao: "Soma poderes da distinção no dano de Arcano de Batalha e causa +50% de dano em falhas críticas do alvo.",
        preRequisitosTexto: "treinado em Guerra, Conjurador Encouraçado, 10 combates com item esotérico."
      }
    ]
  },
  {
    id: "medico_de_salistick",
    nome: "Médico de Salistick",
    livro: "Heróis de Arton",
    admissao: "Não ser devoto de nenhum deus, pagar audiência no Colégio Real de Salistick, apresentar trabalho acadêmico de pesquisa médica perante banca e passar na implacável semana de provas sem reprovar em nenhuma matéria.",
    marca: {
      nome: "Ciências Médicas",
      descricao: "Você pode usar Inteligência como atributo-chave de Cura (em vez de Sabedoria). Se já faz isso, recebe +2 na perícia."
    },
    poderes: [
      {
        id: "medicina_avancada",
        nome: "Medicina Avançada",
        descricao: "Dados de cura de Medicina sobem para d10 e pode usar mais vezes ao dia por criatura.",
        preRequisitosTexto: "Foco em Perícia (Cura), Medicina."
      },
      {
        id: "acompanhamento_medico",
        nome: "Acompanhamento Médico",
        descricao: "Ação de primeiros socorros reduzida e 5 PM para ressuscitar criatura recém-morta com teste de Cura CD 30.",
        preRequisitosTexto: "Medicina Avançada."
      },
      {
        id: "medicina_preventiva",
        nome: "Medicina Preventiva",
        descricao: "1 hora de cuidados concede PV temporários e +1 em testes de resistência a pessoas atendidas.",
        preRequisitosTexto: "Medicina Avançada."
      },
      {
        id: "remedios",
        nome: "Remédios",
        descricao: "Preparados alquímicos que curam ganham +1 por dado e podem ser fabricados em 10 minutos.",
        preRequisitosTexto: "treinado em Ofício (alquimista), Medicina Avançada."
      },
      {
        id: "saude_perfeita",
        nome: "Saúde Perfeita",
        descricao: "+1 em Constituição, imunidade a veneno e +2 PM por poder da distinção.",
        preRequisitosTexto: "treinado em Fortitude, Acompanhamento Médico."
      }
    ]
  },
  {
    id: "mestre_bebado",
    nome: "Mestre Bêbado",
    livro: "Heróis de Arton",
    admissao: "Aprender artes marciais tamuranianas, encontrar um mestre bêbado imprevisível, suportar humilhações e treinos bizarros, tomar três porres lendários (cerveja anã, saquê de Tamu-ra e dilínio de Lamnor) e vencer um combate real embriagado.",
    marca: {
      nome: "Felicidade Engarrafada",
      descricao: "Possui recipiente com bebida mágica que recarrega todo dia: ação de movimento para tomar um gole e ganhar 1 PM temporário."
    },
    poderes: [
      {
        id: "logica_alcoolica",
        nome: "Lógica Alcoólica",
        descricao: "Rola 1d6 no início da rodada para bônus imprevisíveis: ataque, dano, velocidade, Defesa, crítico ou resistência.",
        preRequisitosTexto: "treinado em Fortitude e Luta, Briga ou Estilo Desarmado."
      },
      {
        id: "bafo_de_troll",
        nome: "Bafo de Troll",
        descricao: "Ação padrão e gole para deixar criatura adjacente enjoada com hálito monstruoso.",
        preRequisitosTexto: "Lógica Alcoólica."
      },
      {
        id: "bafo_de_dragao",
        nome: "Bafo de Dragão",
        descricao: "Goles do recipiente para sopro de fogo em cone de 9m causando 2d6 por gole.",
        preRequisitosTexto: "Con 3, Bafo de Troll."
      },
      {
        id: "bebida_revigorante",
        nome: "Bebida Revigorante",
        descricao: "Ação de movimento e gole para curar 4d6 PV ou remover condições debilitantes.",
        preRequisitosTexto: "Lógica Alcoólica."
      },
      {
        id: "luta_ridicula",
        nome: "Luta Ridícula",
        descricao: "Fintar faz o oponente subestimá-lo, impedindo ações hostis complexas contra você.",
        preRequisitosTexto: "treinado em Enganação, Lógica Alcoólica."
      }
    ]
  },
  {
    id: "mestre_cozinheiro",
    nome: "Mestre Cozinheiro",
    livro: "Heróis de Arton",
    admissao: "Explorar pelo menos três masmorras, abater seis monstros e cozinhar com suas partes, obter cópia do Tomo Divino de Deauvorimm e preparar um banquete fantástico puramente com ingredientes de monstros que satisfaça 5 pessoas.",
    marca: {
      nome: "Panela de Estimação",
      descricao: "Recebe arma ou escudo proficiente que funciona como instrumentos de cozinheiro e fornece +2 em Ofício (cozinheiro)."
    },
    poderes: [
      {
        id: "tudo_que_ha_de_bom",
        nome: "Tudo que Há de Bom",
        descricao: "Coleta e adiciona ingredientes monstruosos especiais para conceder efeitos mágicos a pratos fabricados.",
        preRequisitosTexto: "Foco em Perícia (Ofício [cozinheiro])."
      },
      {
        id: "a_moda_da_casa",
        nome: "À Moda da Casa",
        descricao: "Prepara pratos combinando os benefícios de duas receitas diferentes em uma só refeição.",
        preRequisitosTexto: "Tudo que Há de Bom."
      },
      {
        id: "guardar_num_potinho",
        nome: "Guardar num Potinho",
        descricao: "Embala sobras como lanches consumíveis com ação padrão que duram dias.",
        preRequisitosTexto: "À Moda da Casa."
      },
      {
        id: "mise_en_place",
        nome: "Mise en Place",
        descricao: "Usa Ofício (cozinheiro) para identificar criaturas e extrair ingredientes adicionais de monstros abatidos.",
        preRequisitosTexto: "Tudo que Há de Bom."
      },
      {
        id: "banquete_de_aventureiros",
        nome: "Banquete de Aventureiros",
        descricao: "Prepara banquete entre aventuras concedendo dados de auxílio para todo o grupo na próxima jornada.",
        preRequisitosTexto: "três poderes da distinção."
      }
    ]
  },
  {
    id: "mestre_dos_desejos",
    nome: "Mestre dos Desejos",
    livro: "Heróis de Arton",
    admissao: "Exclusivo para qareen. Realizar os anseios inatingíveis de três mortais sem cobrar nada em troca, servir a um gênio elemental e realizar um desejo pessoal do próprio gênio sem ajuda.",
    marca: {
      nome: "Desejo de Servir",
      descricao: "A CD para resistir às magias que você lança com sua habilidade Desejos aumenta em +2."
    },
    poderes: [
      {
        id: "o_primeiro_desejo",
        nome: "O Primeiro Desejo",
        descricao: "A redução de custo de magias lançadas com Desejos melhora para -2 PM.",
        preRequisitosTexto: "treinado em Intuição e Misticismo."
      },
      {
        id: "o_segundo_desejo",
        nome: "O Segundo Desejo",
        descricao: "Aliado pode gastar ação livre para pedir que você lance magia arcana de 1º círculo que você não conhece.",
        preRequisitosTexto: "O Primeiro Desejo."
      },
      {
        id: "genio_da_lampada",
        nome: "Gênio da Lâmpada",
        descricao: "Recebe lâmpada mágica de refúgio: permite lançar Refúgio sem custo e recolhe-se a ela se cair a 0 PV.",
        preRequisitosTexto: "O Primeiro Desejo, Refúgio."
      },
      {
        id: "sempre_disponivel",
        nome: "Sempre Disponível",
        descricao: "Aprende Salto Dimensional e teleporta-se instantaneamente para adjacente a quem esfregar sua lâmpada.",
        preRequisitosTexto: "Gênio da Lâmpada."
      },
      {
        id: "o_ultimo_desejo",
        nome: "O Último Desejo",
        descricao: "Uma vez por aventura, lança a magia suprema Desejo sem pagar o custo em PM em resposta a pedido de aliado.",
        preRequisitosTexto: "O Segundo Desejo, realizar três desejos grandiosos."
      }
    ]
  },
  {
    id: "mestre_mahou_jutsu",
    nome: "Mestre Mahou-Jutsu",
    livro: "Heróis de Arton",
    admissao: "Encontrar um dos raros mestres (como Mestre Chibi ou Masaru Yudai), provar maestria marcial e arcana no Círculo de Luz contra autômatos mashin de fogo e vencer desafio invertido (usar magia para prova física e punhos para prova arcana).",
    marca: {
      nome: "Palma Mística",
      descricao: "Com pelo menos uma mão livre, recebe +2 em testes de ataque de magias e na CD de magias corpo a corpo."
    },
    poderes: [
      {
        id: "mahou_jutsu",
        nome: "Mahou-jutsu",
        descricao: "Ao fazer dois ou mais ataques desarmados, gasta 2 PM para lançar magia arcana como ação livre.",
        preRequisitosTexto: "lançar magias arcanas, treinado em Misticismo, Briga ou Estilo Desarmado."
      },
      {
        id: "defesa_da_magia",
        nome: "Defesa da Magia",
        descricao: "Ao lançar magia arcana, ganha PV temporários iguais a 5x o círculo da magia.",
        preRequisitosTexto: "Mahou-Jutsu."
      },
      {
        id: "determinacao_da_dor",
        nome: "Determinação da Dor",
        descricao: "Soma Constituição em testes de concentração e no limite de PM após sofrer dano.",
        preRequisitosTexto: "Con 1, Mahou-Jutsu."
      },
      {
        id: "punho_arcano",
        nome: "Punho Arcano",
        descricao: "Ao lançar magia de toque, gasta 2 PM para fazer ataque desarmado livre que aumenta a CD da magia.",
        preRequisitosTexto: "Mahou-Jutsu."
      },
      {
        id: "esplendor_vitorioso_inigualavel",
        nome: "Esplendor Vitorioso Inigualável",
        descricao: "Gasta 10 PV em magia de dano para somar Constituição na CD e dano desarmado no total da magia.",
        preRequisitosTexto: "magias arcanas de 2º círculo, Punho Arcano."
      }
    ]
  },
  {
    id: "mosqueteiro_de_rishantor",
    nome: "Mosqueteiro de Rishantor",
    livro: "Heróis de Arton",
    admissao: "Apresentar-se no palácio de Rishantor, superar sabatinas éticas rigorosas comprovando honra imaculada, completar meses de treinamento nos alojamentos do palácio e resistir às tentativas de suborno da nobreza corrupta.",
    marca: {
      nome: "Equipamento Real",
      descricao: "Recebe tabardo, florete/rapieira e chapéu emplumado que concedem +1 em Diplomacia, ataque, dano e Defesa enquanto seguir seu código de conduta moral."
    },
    poderes: [
      {
        id: "mestre_esgrimista",
        nome: "Mestre Esgrimista",
        descricao: "Crítico com florete e rapieira aumenta em +1 e pode gastar 1 PM para rolar dois dados de ataque.",
        preRequisitosTexto: "proficiência com armas marciais, Estilo de Uma Arma."
      },
      {
        id: "um_por_todos",
        nome: "Um por Todos",
        descricao: "Aumenta bônus de ajudar em +2 e usa o resultado de seu ataque para ajudar ataques de aliados.",
        preRequisitosTexto: "Mestre Esgrimista."
      },
      {
        id: "todos_por_um",
        nome: "Todos Por Um",
        descricao: "Ao usar Duelo, compartilha os benefícios com aliados em alcance curto gastando +1 PM por aliado.",
        preRequisitosTexto: "Duelo, Um por Todos."
      },
      {
        id: "heroismo_galante",
        nome: "Heroísmo Galante",
        descricao: "1 PM para interceptar ataque dirigido a aliado adjacente tornando-se o alvo.",
        preRequisitosTexto: "treinado em Reflexos, Mestre Esgrimista."
      },
      {
        id: "valentia",
        nome: "Valentia",
        descricao: "Lança Heroísmo em si mesmo através de galanteria e ousadia altaneira.",
        preRequisitosTexto: "Mestre Esgrimista, dois outros poderes da distinção."
      }
    ]
  },
  {
    id: "mutagenista",
    nome: "Mutagenista",
    livro: "Heróis de Arton",
    admissao: "Explorar o Deserto da Perdição, invadir ruínas zarkhassianas, decifrar as tabuletas antigas, fabricar seu primeiro mutagênico contendo sua própria essência vital e sobreviver à primeira ingestão.",
    marca: {
      nome: "Preparação Corporal",
      descricao: "Você recebe +2 em Fortitude e em Ofício (alquimista)."
    },
    poderes: [
      {
        id: "fabricar_mutagenicos",
        nome: "Fabricar Mutagênicos",
        descricao: "Fabrica e usa preparados tonificantes mutagênicos (e energizantes/despersonalizantes com mais poderes).",
        preRequisitosTexto: "treinado em Fortitude e Ofício (alquimista)."
      },
      {
        id: "ingestao_rapida",
        nome: "Ingestão Rápida",
        descricao: "Uma vez por rodada, ingere poção ou preparado como ação livre.",
        preRequisitosTexto: "Fabricar Mutagênicos."
      },
      {
        id: "mutagenia_adicional",
        nome: "Mutagenia Adicional",
        descricao: "Seu limite de mutagênicos ativos aumenta em +1.",
        preRequisitosTexto: "Fabricar Mutagênicos."
      },
      {
        id: "organismo_reagente",
        nome: "Organismo Reagente",
        descricao: "Bônus e curas de preparados alquímicos ingeridos aumentam em +1 por dado.",
        preRequisitosTexto: "Mutagenia Adicional."
      },
      {
        id: "potencializar_mutagenicos",
        nome: "Potencializar Mutagênicos",
        descricao: "O efeito básico de seus mutagênicos passa a ser seu efeito de exaurir.",
        preRequisitosTexto: "Organismo Reagente."
      }
    ]
  },
  {
    id: "pistoleiro_de_smokestone",
    nome: "Pistoleiro de Smokestone",
    livro: "Heróis de Arton",
    admissao: "Viajar até a Cidade dos Fora da Lei em Smokestone (ou ser nativo), sobreviver aos tiroteios sem lei da cidade, vencer um duelo ao meio-dia contra um pistoleiro veterano e receber a bênção do chumbo das planícies.",
    marca: {
      nome: "Dedo no Gatilho",
      descricao: "Você recebe proficiência com armas de fogo e +2 em testes de Iniciativa e Pontaria ao empunhar armas de fogo."
    },
    poderes: [
      {
        id: "bala_no_tambor",
        nome: "Bala no Tambor",
        descricao: "Recarregar armas de fogo exige uma categoria de ação menor (padrão vira movimento, movimento vira livre).",
        preRequisitosTexto: "treinado em Pontaria, Saque Rápido."
      },
      {
        id: "disparo_certeiro_de_smokestone",
        nome: "Disparo de Smokestone",
        descricao: "Soma sua Destreza nas rolagens de dano com armas de fogo em alcance curto.",
        preRequisitosTexto: "Bala no Tambor."
      },
      {
        id: "pistoleiro_solitario",
        nome: "Pistoleiro Solitário",
        descricao: "Quando não há aliados adjacentes, você recebe +2 em testes de ataque e Defesa.",
        preRequisitosTexto: "Bala no Tambor."
      },
      {
        id: "saque_ultrarrapido",
        nome: "Saque Ultrarrápido",
        descricao: "Na primeira rodada de combate, você pode realizar um ataque com arma de fogo como ação livre.",
        preRequisitosTexto: "Iniciativa 10, Disparo de Smokestone."
      },
      {
        id: "tiroteio_ao_meio_dia",
        nome: "Tiroteio ao Meio-Dia",
        descricao: "2 PM para disparar contra todos os inimigos em alcance curto com uma única ação padrão.",
        preRequisitosTexto: "Saque Ultrarrápido, três poderes da distinção."
      }
    ]
  }
];

const dest = path.join(__dirname, '..', 'dados', 'distincoes.json');
fs.writeFileSync(dest, JSON.stringify(RAW_DISTINCTIONS, null, 2), 'utf8');
console.log(`Sucesso: ${RAW_DISTINCTIONS.length} distinções salvas em ${dest}`);
