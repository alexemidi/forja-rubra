/**
 * Módulo puro de regras de Tormenta 20: Origem Criação dos Deuses e Poderes Escolhido dos Deuses
 */

export interface CriacaoDeusOption {
  id: string;
  nome: string;
  powerId: string;
  powerNome: string;
  energia: 'positiva' | 'negativa' | 'qualquer';
  rdDefault: 'trevas' | 'luz' | 'escolha';
  aparencia: string;
  descricao: string;
}

export const CRIACAO_DEUSES_CATALOG: readonly CriacaoDeusOption[] = Object.freeze([
  {
    id: 'aharadak',
    nome: 'Aharadak',
    powerId: 'escolhido_de_aharadak',
    powerNome: 'Escolhido de Aharadak',
    energia: 'negativa',
    rdDefault: 'luz',
    aparencia: 'Alterações físicas grotescas semelhantes às de um lefou.',
    descricao: 'Você possui alterações físicas grotescas, semelhantes às de um lefou (Tormenta20, p. 24). Você se torna imune a metamorfose e recebe +2 em uma perícia a sua escolha (não cumulativo com a habilidade Deformidade dos lefou). Este poder conta como um poder da Tormenta.'
  },
  {
    id: 'allihanna',
    nome: 'Allihanna',
    powerId: 'escolhido_de_allihanna',
    powerNome: 'Escolhido de Allihanna',
    energia: 'positiva',
    rdDefault: 'trevas',
    aparencia: 'Característica física de um animal, como orelhas de lobo, cauda de raposa ou bico no lugar do nariz.',
    descricao: 'Você possui uma característica física de um animal, como orelhas de lobo, cauda de raposa ou um bico no lugar do nariz. Você pode falar com animais (como a magia Voz Divina; se já faz isso, recebe +2 em Adestramento) e, se estiver em terreno natural, pode gastar uma ação completa e 2 PM para invocar um animal à sua escolha. O animal invocado surge em 1d4 minutos e atua como um parceiro iniciante de um tipo a sua escolha até ser dispensado ou até o fim do dia. O mestre tem a palavra final sobre quais animais e tipos de parceiros estão disponíveis em uma determinada área.'
  },
  {
    id: 'arsenal',
    nome: 'Arsenal/Keen',
    powerId: 'escolhido_de_arsenal',
    powerNome: 'Escolhido de Arsenal/Keen',
    energia: 'qualquer',
    rdDefault: 'escolha',
    aparencia: 'Aura pesada de austeridade e perigo bélico.',
    descricao: 'Você projeta uma aura de austeridade e perigo que pode ser incômoda aos demais; você sofre –2 em Diplomacia. Entretanto, você recebe +1 em testes de ataque e na margem de ameaça com armas. Estes bônus são dobrados enquanto você estiver com menos da metade de seus PV.'
  },
  {
    id: 'azgher',
    nome: 'Azgher',
    powerId: 'escolhido_de_azgher',
    powerNome: 'Escolhido de Azgher',
    energia: 'positiva',
    rdDefault: 'trevas',
    aparencia: 'Pupilas com a aparência de chamas solares em constante movimento.',
    descricao: 'Suas pupilas possuem a aparência de chamas em constante movimento. Você pode gastar uma ação de movimento e 1 PM para gerar uma aura com 9m de raio a partir de você e duração sustentada. Esta aura ilumina como a luz do sol e, no início de seus turnos, causa 1d6 pontos de dano de fogo a criaturas a sua escolha dentro dela. Se for um paladino de Azgher e usar esta aura junto com sua Aura Sagrada, você pode sustentar ambas por apenas 1 PM.'
  },
  {
    id: 'glorienn',
    nome: 'Glórienn',
    powerId: 'escolhido_de_glorienn',
    powerNome: 'Escolhido de Glórienn',
    energia: 'positiva',
    rdDefault: 'trevas',
    aparencia: 'Perfeição estética élfica quase divina.',
    descricao: 'Você possui uma perfeição que quase se iguala à dos elfos. Você recebe +2 em testes de perícias baseadas em Carisma contra não elfos e, uma vez por cena, se passar em um teste de perícia baseada em Carisma, recebe 2 PM temporários.'
  },
  {
    id: 'hyninn',
    nome: 'Hyninn',
    powerId: 'escolhido_de_hyninn',
    powerNome: 'Escolhido de Hyninn',
    energia: 'qualquer',
    rdDefault: 'escolha',
    aparencia: 'Olhar maroto e permanente companhia de uma raposa astuta.',
    descricao: 'Você possui um familiar raposa (veja Tormenta20, p. 38). Ela tem deslocamento 12m e fornece +2 em Furtividade e, uma vez por rodada, você pode gastar 1 PM para trocar de lugar com ela, desde que esteja a no máximo 30m dela e possa vê-la. Se perder sua raposa, ela reaparece após 24 horas.'
  },
  {
    id: 'kallyadranoch',
    nome: 'Kallyadranoch',
    powerId: 'escolhido_de_kallyadranoch',
    powerNome: 'Escolhido de Kallyadranoch',
    energia: 'qualquer',
    rdDefault: 'escolha',
    aparencia: 'Parte do corpo coberta por escamas dracônicas brilhantes.',
    descricao: 'Uma parte de seu corpo possui escamas em um padrão de cores à sua escolha. Além disso, você aprende e pode lançar uma magia de 1º círculo de ácido, eletricidade, fogo, frio, luz ou trevas a sua escolha (atributo-chave Carisma). Caso aprenda novamente essa magia, seu custo diminui em –1 PM.'
  },
  {
    id: 'khalmyr',
    nome: 'Khalmyr',
    powerId: 'escolhido_de_khalmyr',
    powerNome: 'Escolhido de Khalmyr',
    energia: 'positiva',
    rdDefault: 'trevas',
    aparencia: 'Porte nobre, altivo e olhar sereno da justiça.',
    descricao: 'Você possui uma aparência altiva e nobre. Você tem imunidade a encantamento e efeitos de confusão e efeitos que causam perda de vida contínua (como sangramento) em você causam apenas metade do efeito máximo (arredondado para baixo).'
  },
  {
    id: 'lena',
    nome: 'Lena',
    powerId: 'escolhido_de_lena',
    powerNome: 'Escolhido de Lena',
    energia: 'positiva',
    rdDefault: 'trevas',
    aparencia: 'Permanentemente acompanhado por uma pequena esfera de luz cálida e flutuante.',
    descricao: 'Você é permanentemente acompanhado por uma pequena esfera de luz que flutua ao seu redor. Ao seu comando, essa esfera pode emanar luz como uma tocha. Além disso, sempre que uma criatura em alcance curto sofre dano, você pode transferir até 5 pontos desse dano para a esfera. A esfera pode armazenar um total de pontos de dano igual à metade dos seus PV, e elimina uma quantidade de dano armazenado a cada dia igual ao total de PV que você recuperar por descanso.'
  },
  {
    id: 'lin_wu',
    nome: 'Lin-Wu',
    powerId: 'escolhido_de_lin_wu',
    powerNome: 'Escolhido de Lin-Wu',
    energia: 'positiva',
    rdDefault: 'trevas',
    aparencia: 'Cabelos prateados reluzentes como os de um dragão celestial.',
    descricao: 'Seus cabelos, ou o equivalente, são prateados como os de um dragão celestial. Infundido com a essência do que é ser honrado, você é incapaz de mentir ou enganar outros seres (em termos de jogo, você segue as Obrigações & Restrições de Lin-Wu). Entretanto, você projeta uma aura de honradez de 9m de raio. Criaturas nessa área sofrem –5 em Enganação e Furtividade e você e seus aliados na área recebem +2 em Vontade.'
  },
  {
    id: 'marah',
    nome: 'Marah',
    powerId: 'escolhido_de_marah',
    powerNome: 'Escolhido de Marah',
    energia: 'positiva',
    rdDefault: 'trevas',
    aparencia: 'Voz suave, gestos delicados e beleza celestial radiante.',
    descricao: 'Sua aparência, sua voz e seus movimentos são dotados de beleza e graça celestiais. Você recebe +2 em Adestramento, Atuação e Diplomacia. Além disso, você emana uma aura de calmaria de 9m de raio; criaturas nessa área sofrem –2 em testes de ataque e rolagens de dano.'
  },
  {
    id: 'megalokk',
    nome: 'Megalokk',
    powerId: 'escolhido_de_megalokk',
    powerNome: 'Escolhido de Megalokk',
    energia: 'negativa',
    rdDefault: 'luz',
    aparencia: 'Aparência feral monstruosa, com pelos eriçados, carapaça, cauda, chifres ou presas.',
    descricao: 'Seu corpo assume uma aparência feral, com pelos, carapaça ou outra característica monstruosa. Além disso, você recebe uma arma natural (dano 1d6, crítico x2) escolhida entre cauda (impacto), chifres (perfuração) ou mordida (perfuração). Uma vez por rodada, quando usa a ação agredir para atacar com outra arma, pode gastar 1 PM para fazer um ataque corpo a corpo extra com essa arma.'
  },
  {
    id: 'nimb',
    nome: 'Nimb',
    powerId: 'escolhido_de_nimb',
    powerNome: 'Escolhido de Nimb',
    energia: 'qualquer',
    rdDefault: 'escolha',
    aparencia: 'Traços estéticos que mudam sozinhos de tempos em tempos (cor dos olhos, cabelo, marca ou voz).',
    descricao: 'Uma característica estética de seu corpo se altera de tempos em tempos. Pode ser a cor dos seus cabelos ou olhos, uma marca ou tatuagem na pele, ou mesmo sua própria voz. Além disso, você pode gastar 1 PM para receber +2 em um atributo, determinado aleatoriamente ao usar este poder, até o fim da cena (esse aumento não oferece PV, PM ou perícias adicionais). Você pode usar este poder múltiplas vezes na mesma cena, mas bônus no mesmo atributo não são cumulativos.'
  },
  {
    id: 'oceano',
    nome: 'Oceano',
    powerId: 'escolhido_de_oceano',
    powerNome: 'Escolhido de Oceano',
    energia: 'qualquer',
    rdDefault: 'escolha',
    aparencia: 'Guelras no pescoço e membranas translúcidas entre os dedos.',
    descricao: 'Você possui guelras e membranas entre os dedos. Você pode respirar debaixo d’água e recebe deslocamento de natação igual ao seu deslocamento normal (se já tem um deslocamento de natação, em vez disso recebe camuflagem total dentro d’água).'
  },
  {
    id: 'ragnar',
    nome: 'Ragnar',
    powerId: 'escolhido_de_ragnar',
    powerNome: 'Escolhido de Ragnar',
    energia: 'negativa',
    rdDefault: 'luz',
    aparencia: 'Traços físicos goblinoides perceptíveis.',
    descricao: 'Você possui traços físicos goblinoides perceptíveis, como se tivesse um antepassado desta raça. Você recebe +1 em rolagens de dano. Além disso, uma vez por rodada, quando você reduz um inimigo a 0 PV, recupera 1 PM.'
  },
  {
    id: 'sszzaas',
    nome: 'Sszzaas',
    powerId: 'escolhido_de_sszzaas',
    powerNome: 'Escolhido de Sszzaas',
    energia: 'negativa',
    rdDefault: 'luz',
    aparencia: 'Olhos amarelados com pupilas verticais na escuridão; de resto, exageradamente comum.',
    descricao: 'Sob escuridão total, seus olhos se tornam amarelados e suas pupilas verticais e alongadas, como as de serpentes. Exceto por isso, você é “comum”. De fato, exageradamente comum. Você recebe +2 em Furtividade e, sempre que passa por 10 ou mais num teste de Furtividade oposto a uma criatura lacaio, ela esquece que você esteve presente na cena.'
  },
  {
    id: 'tanna_toh',
    nome: 'Tanna-Toh',
    powerId: 'escolhido_de_tanna_toh',
    powerNome: 'Escolhido de Tanna-Toh',
    energia: 'positiva',
    rdDefault: 'trevas',
    aparencia: 'Uma distinta mecha de cabelos puramente brancos.',
    descricao: 'Você possui uma mecha branca em seus cabelos (ou equivalente). Uma vez por cena, se passar em um teste de Conhecimento, Guerra, Misticismo, Nobreza ou Religião, você recebe +1d6 que pode ser usado como bônus em outro teste de perícia na mesma cena, relacionado a esse teste.'
  },
  {
    id: 'tauron',
    nome: 'Tauron',
    powerId: 'escolhido_de_tauron',
    powerNome: 'Escolhido de Tauron',
    energia: 'qualquer',
    rdDefault: 'escolha',
    aparencia: 'Pés em forma de cascos fortes de minotauro.',
    descricao: 'Seus pés são cascos, como os de um minotauro. Quando faz um teste de Força ou de perícia baseada em Força, você pode gastar 2 PM para receber +4 nesse teste. Se você estiver adjacente a um aliado indefeso, o custo deste poder é reduzido em –1 PM.'
  },
  {
    id: 'tenebra',
    nome: 'Tenebra',
    powerId: 'escolhido_de_tenebra',
    powerNome: 'Escolhido de Tenebra',
    energia: 'negativa',
    rdDefault: 'luz',
    aparencia: 'Parte do corpo (cabelos, olhos, asas ou chifres) é negra como uma noite sem luar.',
    descricao: 'Uma parte do seu corpo, como seus cabelos, olhos, asas ou chifres (se os tiver) é negra como uma noite sem luar. Você pode pagar 2 PM para emanar uma aura de sombras em um raio de 9m com duração sustentada. Você e seus aliados na área recebem camuflagem leve por escuridão leve, redução de luz 5 e +5 em Furtividade.'
  },
  {
    id: 'thwor',
    nome: 'Thwor',
    powerId: 'escolhido_de_thwor',
    powerNome: 'Escolhido de Thwor',
    energia: 'qualquer',
    rdDefault: 'escolha',
    aparencia: 'A Roda do Akzath gravada nas costas como tatuagem ou cicatriz sagrada.',
    descricao: 'Você possui a Roda do Akzath gravada em suas costas, como uma tatuagem, cicatriz ou outra forma apropriada à sua pele. Uma vez por cena, você pode receber +2 em um teste de uma perícia que esteja usando pela primeira vez naquela cena.'
  },
  {
    id: 'thyatis',
    nome: 'Thyatis',
    powerId: 'escolhido_de_thyatis',
    powerNome: 'Escolhido de Thyatis',
    energia: 'positiva',
    rdDefault: 'trevas',
    aparencia: 'Cabelos vermelhos e ondulados como chamas crepitantes da fênix.',
    descricao: 'Seus cabelos são vermelhos e ondulados, como chamas crepitantes. Você aprende e pode lançar Orientação, mas apenas em você. Se aprender novamente esta magia, seu custo é reduzido em –1 PM.'
  },
  {
    id: 'valkaria',
    nome: 'Valkaria',
    powerId: 'escolhido_de_valkaria',
    powerNome: 'Escolhido de Valkaria',
    energia: 'positiva',
    rdDefault: 'trevas',
    aparencia: 'Pele com marcas divinas e olhos ou cabelos em tom avermelhado da ambição.',
    descricao: 'Sua pele possui marcas semelhantes às da pele da deusa e seus olhos, ou seu cabelo, exibem o mesmo tom avermelhado dos cabelos dela. Além disso, em seu coração arde a chama da ambição. No início de cada aventura, você pode escolher um objetivo específico (que pode ser algo pessoal ou relacionado à própria aventura) e uma perícia relacionada a este objetivo. Até o fim da aventura, você se torna treinado na perícia escolhida ou, se já for treinado, recebe +2 nela. O mestre deve aprovar tanto o objetivo quanto a perícia escolhidos.'
  },
  {
    id: 'wynna',
    nome: 'Wynna',
    powerId: 'escolhido_de_wynna',
    powerNome: 'Escolhido de Wynna',
    energia: 'qualquer',
    rdDefault: 'escolha',
    aparencia: 'Runa mística pessoal de Wynna tatuada em algum lugar do corpo.',
    descricao: 'Você possui uma runa mística, que representa o nome que Wynna lhe deu, tatuada em algum lugar do seu corpo. Escolha um de seus atributos entre Inteligência, Sabedoria ou Carisma. Você soma o atributo escolhido em seu total de PM (limitado por seu nível).'
  }
]);

function toKey(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

export function getCriacaoDeusOption(idOrPowerId: string): CriacaoDeusOption | undefined {
  if (!idOrPowerId) return undefined;
  const raw = idOrPowerId.trim().replace(/^escolhido_de_/i, '');
  const key = toKey(raw);
  return CRIACAO_DEUSES_CATALOG.find(d => {
    return d.id === key ||
      d.id === raw.toLowerCase() ||
      d.powerId === idOrPowerId ||
      toKey(d.nome) === key ||
      toKey(d.powerNome) === toKey(idOrPowerId);
  });
}

export function normalizeCriacaoDeusId(id: string): string {
  const opt = getCriacaoDeusOption(id);
  return opt ? opt.id : '';
}
