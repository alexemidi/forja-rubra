import json
import os

filepath = os.path.join(os.path.dirname(__file__), '..', 'dados', 'distincoes.json')
with open(filepath, 'r', encoding='utf-8') as f:
    distinctions = json.load(f)

existing_ids = {d['id'] for d in distinctions}

menestrel = {
    "id": "menestrel_maldito",
    "nome": "Menestrel Maldito",
    "livro": "Dragão Brasil 206",
    "admissao": "O candidato precisa ter sofrido uma tragédia pessoal terrível. Pode ter sido abandonado por um grande amor, presenciado a morte de um amigo próximo, perdido uma posição de destaque ou algum outro evento similar. Depois disso, deve ir até uma encruzilhada levando seu instrumento musical, cair de joelhos e se lamentar para o vazio. Após horas de choro, surgirá um demônio na forma de um indivíduo alto e esguio, vestindo um manto azul, com longos cabelos que caem por cima de seu rosto, deixando visível apenas o brilho soturno de seus cinco olhos. A figura estenderá a mão, pedindo o instrumento do músico. Caso entregue, o Estranho de Azul afinará o instrumento, usando fragmentos da alma do próprio candidato, e o oferecerá de volta. Se o músico aceitar esse instrumento, se tornará um menestrel maldito até o resto dos seus breves dias.",
    "marca": {
        "nome": "A Maldição do Menestrel",
        "descricao": "Como pagamento pelo pacto com o Estranho de Azul, o menestrel cede uma pequena, mas importante, parte de sua alma.\n\nUm instrumento musical à sua escolha se torna afinado com uma porção de sua própria alma. Quando usa esse instrumento, você recebe +1 em Atuação e a CD para resistir às suas habilidades de bardo aumenta em +1. Se perder seu instrumento, o Estranho de Azul irá afinar outro, desde que você passe uma noite em claro em uma encruzilhada.\n\nTer firmado esse pacto, entretanto, significa que seu tempo em Arton será mais breve que o normal. Sempre que estiver com 0 PV ou menos, sua alma fica à mercê do Estranho de Azul; no início de cada um dos seus turnos, você deve fazer um teste de Sabedoria (CD 15). Se passar, evita o Estranho e não precisa mais fazer esse teste até sofrer dano que o deixe com 0 PV ou menos novamente. Caso termine três rodadas (não necessariamente consecutivas) na mesma cena nessa situação, você morre e é levado pelo Estranho de Azul para as profundezas de Venomia. Lá, passará sua existência em eterna miséria, tocando suas desgraças para o deleite de Sszzaas, e nunca poderá ser revivido."
    },
    "poderes": [
        {
            "id": "tecnica_endiabrada",
            "nome": "Técnica Endiabrada",
            "descricao": "Para um menestrel maldito, sua alma não é apenas uma moeda de barganha; ela é a energia que fortalece suas notas e torna sua música tão poderosa.\n\nQuando usa Inspiração ou uma música de bardo empunhando seu instrumento afinado, o alcance desta habilidade aumenta em um passo (de curto para médio e de médio para longo). Além disso, quando faz um teste de Atuação com seu instrumento afinado, você pode gastar 1 PM para escolher 10, ou 5 PM para escolher 20, em qualquer situação, exceto testes de ataque. Se escolher 20 dessa forma, você fica alquebrado.",
            "preRequisitosTexto": "treinado em Atuação, Inspiração."
        },
        {
            "id": "celeridade_cerulea",
            "nome": "Celeridade Cerúlea",
            "descricao": "Não basta ser mais preciso que qualquer outro músico, um menestrel maldito é também mais rápido.\n\nUma vez por rodada, quando usa uma música de bardo empunhando seu instrumento afinado, você pode gastar 2 PM para usar esta música como uma ação livre.",
            "preRequisitosTexto": "Técnica Endiabrada."
        },
        {
            "id": "composicao_magica",
            "nome": "Composição Mágica",
            "descricao": "O menestrel maldito aprende a entrelaçar suas magias com a tristeza de suas notas musicais.\n\nQuando lança uma magia de bardo com um teste de resistência, você pode gastar 2 PM para fazer um teste de Atuação (CD 10). Se passar, você aumenta a CD da magia em +1, +1 para cada 10 pontos que seu teste de Atuação passar a CD.",
            "preRequisitosTexto": "treinado em Misticismo, Técnica Endiabrada."
        },
        {
            "id": "musica_aria_da_tristeza",
            "nome": "Música: Ária da Tristeza",
            "descricao": "Impregnada por sua própria tragédia, a música do menestrel maldito carrega tanta tristeza que pode até paralisar seus ouvintes.\n\nFaça um teste de Atuação oposto ao teste de Vontade de cada criatura a sua escolha dentro do alcance (você faz um único teste). Alvos que falhem ficam atordoados por uma rodada (uma criatura só pode ser atordoada por este poder uma vez por cena) e frustrados.",
            "preRequisitosTexto": "Técnica Endiabrada."
        },
        {
            "id": "musica_nota_azul",
            "nome": "Música: Nota Azul",
            "descricao": "É um risco se deixar levar pela música de um menestrel maldito. Os acordes hipnóticos podem não apenas conquistar sua atenção, mas também consumir sua mente e levar à morte.\n\nFaça um teste de Atuação oposto pelo teste de Vontade de cada criatura a sua escolha dentro do alcance (você faz um único teste). Alvos que falhem sofrem 1d8 pontos de dano mental (ou 1d12, se estiverem sofrendo alguma condição mental). Para cada outro poder de menestrel maldito que você possui, o dano de sua Nota Azul aumenta em +1d8 ou +1d12, conforme apropriado.",
            "preRequisitosTexto": "Técnica Endiabrada."
        }
    ]
}

presa = {
    "id": "presa_de_coral",
    "nome": "Presa de Coral",
    "livro": "Dragão Brasil 206",
    "admissao": "Para começar o processo de admissão, um candidato deve impressionar um capitão dos Presas de Coral e ser convidado pessoalmente a integrar a ordem. Feitos que normalmente impressionam os capitães incluem derrotar um grande número de oponentes desafiadores sozinho, ou vencer, sozinho ou em grupo, um oponente de poder claramente superior. Uma vez que tenha atraído a atenção de um capitão e aceito o convite, o candidato passa a treinar com um grupo de candidatos ou, dependendo das circunstâncias, com outros Presas de Coral. Este treinamento inclui testes de coragem, aptidão física, habilidade marcial e comprometimento com Khubar e pode se estender por várias semanas. Por fim, após participar do treinamento, o candidato é enviado em uma missão em que deverá provar sua lealdade a Benthos, ao arquipélago e, sobretudo, aos Presas de Coral. Se for bem-sucedido nessa missão, o candidato é convidado a passar pela cerimônia de iniciação, que envolve consumo de sangue do Dragão-Rei (veja caixa). Se sobreviver, se tornará um Presa de Coral.",
    "marca": {
        "nome": "Sangue do Dragão-Rei",
        "descricao": "Parte do ritual de iniciação de um Presa de Coral, o consumo de Sangue do Dragão-Rei é também a etapa mais perigosa da preparação destes combatentes.\n\nA poção alquímica conhecida como Sangue do Dragão-Rei é feita com veneno de serpentes marinhas, ervas locais de Khubar, água do mar e (dizem) uma gota de sangue de dragão. Sua fórmula exata, entretanto, é o segredo mais bem guardado dos Presas de Coral. Como parte do ritual de iniciação, você deve ingerir um gole de Sangue do Dragão-Rei e fazer um teste estendido de Fortitude (CD 20, 3 sucessos). Para cada falha, você perde 2d12 pontos de vida por veneno e, em uma falha total, sofre uma morte agonizante e dolorida. Se passar no teste estendido, completa o ritual de iniciação e recebe a capacidade de imbuir suas armas com poder dracônico. Você pode gastar 2 PM e uma ação de movimento para que as armas que você empunha causem +1d4 pontos de dano de ácido até o fim da cena."
    },
    "poderes": [
        {
            "id": "arsenal_de_coral",
            "nome": "Arsenal de Coral",
            "descricao": "O Presa de Coral se torna mestre no uso das armas tradicionais de sua ordem.\n\nVocê recebe +1 na margem de ameaça com armas do arsenal de coral (cimitarras, espadas curtas, espadas longas, azagaias e lanças). Além disso, quando usa Sangue do Dragão-Rei, o dano extra de ácido com essas armas aumenta em 1 passo, +1 passo para cada três outros poderes de Presa de Coral que você possuir.",
            "preRequisitosTexto": "treinado em Atletismo e Luta."
        },
        {
            "id": "presa_distante_azagaia_de_agua",
            "nome": "Presa Distante: Azagaia de Água",
            "descricao": "Os Presas de Coral aprendem a usar lanças e azagaias para invocar a fúria do mar.\n\nVocê não sofre a penalidade em ataque por empunhar azagaias como armas corpo a corpo e o alcance de seus ataques à distância com azagaias e lanças aumenta em um passo. Além disso, se estiver empunhando uma dessas armas, você pode gastar uma ação padrão e 2 PM para disparar uma rajada de água salgada que percorre uma linha de 9m e usa as mesmas características da arma empunhada. Faça um teste de ataque à distância com a arma e compare o resultado com a Defesa de cada criatura nesta área. Então, faça uma rolagem de dano e aplique o resultado a cada inimigo atingido. Criaturas que sofram dano dessa forma também ficam lentas por 1 rodada.",
            "preRequisitosTexto": "Arsenal de Coral, Estilo de Arremesso."
        },
        {
            "id": "presa_dupla_corte_da_correnteza",
            "nome": "Presa Dupla: Corte da Correnteza",
            "descricao": "Os Presas de Coral aprendem a usar armas em pares para atacar de forma implacável e replicar a intensidade da correnteza marítima.\n\nSe estiver empunhando duas armas do arsenal de coral, você não sofre a penalidade em testes de ataque pelo poder Estilo de Duas Armas. Além disso, você pode gastar uma ação padrão e 3 PM para girar suas armas em um arco e invocar um redemoinho de água salgada. Faça um ataque corpo a corpo com cada uma das armas e compare-os com a Defesa de cada inimigo em seu alcance natural. Então, faça uma rolagem de dano para cada ataque e aplique o resultado correspondente a cada inimigo atingido. Criaturas atingidas por ambos os ataques ficam sangrando.",
            "preRequisitosTexto": "Arsenal de Coral, Estilo de Duas Armas."
        },
        {
            "id": "salto_oceanico",
            "nome": "Salto Oceânico",
            "descricao": "Os Presas de Coral são tão integrados ao oceano que podem nadar até mesmo em terra firme.\n\nVocê recebe deslocamento de natação igual ao seu deslocamento (se já tiver deslocamento de natação, em vez disso ele aumenta em 3 metros). Além disso, você aprende e pode lançar a magia Salto Dimensional (apenas em você). Caso esteja sob a chuva ou com pelo menos metade do corpo imerso em água, você pode lançar esta magia como uma ação de movimento.",
            "preRequisitosTexto": "Arsenal de Coral."
        },
        {
            "id": "tres_se_tornam_um",
            "nome": "Três Se Tornam Um",
            "descricao": "O estilo de luta dos Presas de Coral usa lanças e espadas. Os mais habilidosos entre esses guerreiros de elite aprendem a extrair o máximo de cada uma dessas armas.\n\nVocê pode gastar uma ação de movimento e 1 PM para combinar suas técnicas de luta. Até o fim da cena, cada arma do arsenal de coral que você empunhar recebe as habilidades adaptável, alongada, ágil e/ou arremessável (curto), à sua escolha, e se beneficia de bônus específicos de armas que você possua para qualquer arma do arsenal (como a habilidade Mestre do Tridente).",
            "preRequisitosTexto": "Arsenal de Coral."
        },
        {
            "id": "manobra_maremoto",
            "nome": "Manobra Maremoto",
            "descricao": "Quando um guerreiro khubariano de elite decide que vai atingir um alvo, nada pode detê-lo.\n\nQuando faz uma investida empunhando pelo menos uma arma de seu arsenal de coral, você pode gastar 3 PM para se transformar em um maremoto vivo. Durante esta investida, seu deslocamento aumenta em +6m e você ignora terreno difícil natural. Além disso, pode passar por objetos como se fosse água e empurra criaturas em seu caminho; faça um teste da manobra empurrar e compare o resultado com o teste de cada criatura afetada. Criaturas que perderem o teste de manobra são empurradas 1,5m para um lado à sua escolha.",
            "preRequisitosTexto": "Salto Oceânico."
        },
        {
            "id": "presa_suprema_arquipelago_de_dor",
            "nome": "Presa Suprema: Arquipélago de Dor",
            "descricao": "Da mesma forma que o mar envolve Khubar, um Presa de Coral pode se mover em volta de um oponente, preparando um golpe feroz.\n\nVocê pode gastar uma ação completa e 3 PM para desferir um ataque especial contra um oponente adjacente. Você pode percorrer qualquer distância, até o seu deslocamento, desde que se mantenha sempre adjacente ao alvo e não passe pelo mesmo espaço mais de uma vez. Ao final deste movimento, você faz uma ação agredir contra o alvo com um bônus de +1 no teste de ataque, na rolagem de dano e na margem de ameaça de seus ataques com armas do arsenal de coral para cada 1,5m percorrido desta forma.",
            "preRequisitosTexto": "Três Se Tornam Um."
        }
    ]
}

if 'menestrel_maldito' not in existing_ids:
    distinctions.append(menestrel)
    print("Menestrel Maldito adicionado!")
else:
    for i, d in enumerate(distinctions):
        if d['id'] == 'menestrel_maldito':
            distinctions[i] = menestrel
            print("Menestrel Maldito atualizado!")

if 'presa_de_coral' not in existing_ids:
    distinctions.append(presa)
    print("Presa de Coral adicionado!")
else:
    for i, d in enumerate(distinctions):
        if d['id'] == 'presa_de_coral':
            distinctions[i] = presa
            print("Presa de Coral atualizado!")

with open(filepath, 'w', encoding='utf-8') as f:
    json.dump(distinctions, f, ensure_ascii=False, indent=2)

print(f"Total final de distinções: {len(distinctions)}")
