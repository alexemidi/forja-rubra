const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const cardsPath = path.join(root, 'dados/magias-cards.json');
const cards = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));

// Catálogo das 35 condições de T20 com suas descrições canônicas escapadas para atributos HTML
const CONDITIONS_CATALOG = [
  {
    title: 'Abalado',
    words: ['abalado', 'abalada', 'abalados', 'abaladas'],
    desc: 'O personagem sofre –2 em testes de perícia. Se ficar abalado novamente, em vez disso fica apavorado.'
  },
  {
    title: 'Agarrado',
    words: ['agarrado', 'agarrada', 'agarrados', 'agarradas'],
    desc: 'O personagem fica desprevenido e imóvel, sofre –2 em testes de ataque e só pode atacar com armas leves. Não pode se deslocar e sofre –2 em testes de ataque. Um personagem fazendo um ataque à distância contra um alvo envolvido na manobra agarrar tem 50% de chance de acertar o alvo errado.<div class=&quot;nested-cond&quot;><strong>Desprevenido:</strong> O personagem sofre –5 na Defesa e em Reflexos. Você fica desprevenido contra inimigos que não possa perceber.</div><div class=&quot;nested-cond&quot;><strong>Imóvel:</strong> Todas as formas de deslocamento do personagem são reduzidas a 0m.</div>'
  },
  {
    title: 'Alquebrado',
    words: ['alquebrado', 'alquebrada', 'alquebrados', 'alquebradas'],
    desc: 'O custo em pontos de mana das habilidades do personagem aumenta em +1.'
  },
  {
    title: 'Apavorado',
    words: ['apavorado', 'apavorada', 'apavorados', 'apavoradas'],
    desc: 'O personagem sofre –5 em testes de perícia e deve fugir da fonte do medo da maneira mais rápida e eficaz possível. Se não puder fugir, o personagem pode agir, mas continua apavorado.'
  },
  {
    title: 'Asfixiado',
    words: ['asfixiado', 'asfixiada', 'asfixiados', 'asfixiadas'],
    desc: 'O personagem não pode respirar e começa a sufocar. Ele pode prender a respiração por um número de rodadas igual ao seu modificador de Constituição.'
  },
  {
    title: 'Atordoado',
    words: ['atordoado', 'atordoada', 'atordoados', 'atordoadas'],
    desc: 'O personagem fica desprevenido e não pode fazer ações.<div class=&quot;nested-cond&quot;><strong>Desprevenido:</strong> O personagem sofre –5 na Defesa e em Reflexos. Você fica desprevenido contra inimigos que não possa perceber.</div>'
  },
  {
    title: 'Caído',
    words: ['caído', 'caída', 'caídos', 'caídas', 'caido', 'caida', 'caidos', 'caidas'],
    desc: 'O personagem sofre –5 na Defesa contra ataques corpo a corpo e recebe +5 na Defesa contra ataques à distância (cumulativos com outras condições). Além disso, sofre –5 em ataques corpo a corpo e seu deslocamento é reduzido a 1,5m.'
  },
  {
    title: 'Cego',
    words: ['cego', 'cega', 'cegos', 'cegas'],
    desc: 'O personagem fica desprevenido e lento, não pode fazer testes de Percepção para observar e sofre –5 em testes de perícias baseadas em Força ou Destreza. Todos os alvos de seus ataques recebem camuflagem total. Você é considerado cego enquanto estiver em uma área de escuridão total, a menos que algo lhe permita perceber no escuro.<div class=&quot;nested-cond&quot;><strong>Desprevenido:</strong> O personagem sofre –5 na Defesa e em Reflexos. Você fica desprevenido contra inimigos que não possa perceber.</div><div class=&quot;nested-cond&quot;><strong>Lento:</strong> Todas as formas de deslocamento do personagem são reduzidas à metade (arredonde para baixo para o primeiro incremento de 1,5m) e ele não pode correr ou fazer investidas.</div>'
  },
  {
    title: 'Confuso',
    words: ['confuso', 'confusa', 'confusos', 'confusas'],
    desc: 'O personagem comporta-se de modo aleatório. Role 1d6 no início de seus turnos: 1) Movimenta-se em uma direção escolhida por uma rolagem de 1d8; 2-3) Não pode fazer ações, e fica balbuciando incoerentemente; 4-5) Usa a arma que estiver empunhando para atacar a criatura mais próxima, ou a si mesmo se estiver sozinho (nesse caso, apenas role o dano); 6) A condição termina e pode agir normalmente.'
  },
  {
    title: 'Debilitado',
    words: ['debilitado', 'debilitada', 'debilitados', 'debilitadas'],
    desc: 'O personagem sofre –5 em testes de Força, Destreza e Constituição e de perícias baseadas nesses atributos. Se o personagem ficar debilitado novamente, em vez disso fica inconsciente.<div class=&quot;nested-cond&quot;><strong>Inconsciente:</strong> O personagem fica indefeso e não pode fazer ações, incluindo reações (mas ainda pode fazer testes que sejam naturalmente feitos quando se está inconsciente, como testes de Constituição para estabilizar sangramento). Balançar uma criatura para acordá-la gasta uma ação padrão.</div>'
  },
  {
    title: 'Desprevenido',
    words: ['desprevenido', 'desprevenida', 'desprevenidos', 'desprevenidas'],
    desc: 'O personagem sofre –5 na Defesa e em Reflexos. Você fica desprevenido contra inimigos que não possa perceber.'
  },
  {
    title: 'Doente',
    words: ['doente', 'doentes'],
    desc: 'O personagem está sob efeito de uma doença. O efeito específico varia com a enfermidade contraída.'
  },
  {
    title: 'Em Chamas',
    words: ['em chamas'],
    desc: 'O personagem está pegando fogo. No início de seus turnos, sofre 1d6 pontos de dano de fogo. O personagem pode gastar uma ação padrão para apagar o fogo.'
  },
  {
    title: 'Enfeitiçado',
    words: ['enfeitiçado', 'enfeitiçada', 'enfeitiçados', 'enfeitiçadas', 'enfeiticado', 'enfeiticada', 'enfeiticados', 'enfeiticadas'],
    desc: 'O personagem se torna prestativo em relação à fonte da condição. Ele não fica sob controle da fonte, mas percebe suas palavras e ações da maneira mais favorável possível. A fonte da condição recebe +10 em testes de Diplomacia com o personagem.'
  },
  {
    title: 'Enjoado',
    words: ['enjoado', 'enjoada', 'enjoados', 'enjoadas'],
    desc: 'O personagem só pode realizar uma ação padrão ou de movimento (não ambas) por rodada. Ele pode gastar uma ação padrão para fazer uma investida, mas pode avançar no máximo seu deslocamento (e não o dobro).'
  },
  {
    title: 'Enredado',
    words: ['enredado', 'enredada', 'enredados', 'enredadas'],
    desc: 'O personagem fica lento, vulnerável e sofre –2 em testes de ataque.<div class=&quot;nested-cond&quot;><strong>Vulnerável:</strong> O personagem sofre –2 na Defesa.</div><div class=&quot;nested-cond&quot;><strong>Lento:</strong> Todas as formas de deslocamento do personagem são reduzidas à metade (arredonde para baixo para o primeiro incremento de 1,5m) e ele não pode correr ou fazer investidas.</div>'
  },
  {
    title: 'Envenenado',
    words: ['envenenado', 'envenenada', 'envenenados', 'envenenadas'],
    desc: 'O efeito desta condição varia de acordo com o veneno. Pode ser perda de vida recorrente ou outra condição (como fraco ou enjoado). Perda de vida recorrente por venenos é cumulativa.<div class=&quot;nested-cond&quot;><strong>Enjoado:</strong> O personagem só pode realizar uma ação padrão ou de movimento (não ambas) por rodada. Ele pode gastar uma ação padrão para fazer uma investida, mas pode avançar no máximo seu deslocamento (e não o dobro).</div><div class=&quot;nested-cond&quot;><strong>Fraco:</strong> O personagem sofre –2 em testes de Força, Destreza e Constituição e de perícias baseadas nesses atributos. Se ficar fraco novamente, em vez disso fica debilitado.</div>'
  },
  {
    title: 'Esmorecido',
    words: ['esmorecido', 'esmorecida', 'esmorecidos', 'esmorecidas'],
    desc: 'O personagem sofre –5 em testes de Inteligência, Sabedoria e Carisma e de perícias baseadas nesses atributos.'
  },
  {
    title: 'Exausto',
    words: ['exausto', 'exausta', 'exaustos', 'exaustas'],
    desc: 'O personagem fica debilitado, lento e vulnerável. Se ficar exausto novamente, em vez disso fica inconsciente.<div class=&quot;nested-cond&quot;><strong>Debilitado:</strong> O personagem sofre –5 em testes de Força, Destreza e Constituição e de perícias baseadas nesses atributos. Se o personagem ficar debilitado novamente, em vez disso fica inconsciente.</div><div class=&quot;nested-cond&quot;><strong>Vulnerável:</strong> O personagem sofre –2 na Defesa.</div><div class=&quot;nested-cond&quot;><strong>Lento:</strong> Todas as formas de deslocamento do personagem são reduzidas à metade (arredonde para baixo para o primeiro incremento de 1,5m) e ele não pode correr ou fazer investidas.</div>'
  },
  {
    title: 'Fascinado',
    words: ['fascinado', 'fascinada', 'fascinados', 'fascinadas'],
    desc: 'Com a atenção presa em alguma coisa. O personagem sofre –5 em Percepção e não pode fazer ações, exceto observar aquilo que o fascinou. Esta condição é anulada por ações hostis contra o personagem ou se o que o fascinou não estiver mais visível. Balançar uma criatura fascinada para tirá-la desse estado gasta uma ação padrão.'
  },
  {
    title: 'Fatigado',
    words: ['fatigado', 'fatigada', 'fatigados', 'fatigadas'],
    desc: 'O personagem fica fraco e vulnerável. Se ficar fatigado novamente, em vez disso fica exausto.<div class=&quot;nested-cond&quot;><strong>Vulnerável:</strong> O personagem sofre –2 na Defesa.</div><div class=&quot;nested-cond&quot;><strong>Fraco:</strong> O personagem sofre –2 em testes de Força, Destreza e Constituição e de perícias baseadas nesses atributos. Se ficar fraco novamente, em vez disso fica debilitado.</div>'
  },
  {
    title: 'Fraco',
    words: ['fraco', 'fraca', 'fracos', 'fracas'],
    desc: 'O personagem sofre –2 em testes de Força, Destreza e Constituição e de perícias baseadas nesses atributos. Se ficar fraco novamente, em vez disso fica debilitado.'
  },
  {
    title: 'Frustrado',
    words: ['frustrado', 'frustrada', 'frustrados', 'frustradas'],
    desc: 'O personagem sofre –2 em testes de Inteligência, Sabedoria e Carisma e de perícias baseadas nesses atributos. Se ficar frustrado novamente, em vez disso fica esmorecido.'
  },
  {
    title: 'Imóvel',
    words: ['imóvel', 'imóveis', 'imovel', 'imoveis'],
    desc: 'Todas as formas de deslocamento do personagem são reduzidas a 0m.'
  },
  {
    title: 'Inconsciente',
    words: ['inconsciente', 'inconscientes'],
    desc: 'O personagem fica indefeso e não pode fazer ações, incluindo reações (mas ainda pode fazer testes que sejam naturalmente feitos quando se está inconsciente, como testes de Constituição para estabilizar sangramento). Balançar uma criatura para acordá-la gasta uma ação padrão.<div class=&quot;nested-cond&quot;><strong>Indefeso:</strong> O personagem fica desprevenido, mas sofre –10 na Defesa, falha automaticamente em testes de Reflexos e pode sofrer golpes de misericórdia.</div>'
  },
  {
    title: 'Indefeso',
    words: ['indefeso', 'indefesa', 'indefesos', 'indefesas'],
    desc: 'O personagem fica desprevenido, mas sofre –10 na Defesa, falha automaticamente em testes de Reflexos e pode sofrer golpes de misericórdia.<div class=&quot;nested-cond&quot;><strong>Desprevenido:</strong> O personagem sofre –5 na Defesa e em Reflexos. Você fica desprevenido contra inimigos que não possa perceber.</div>'
  },
  {
    title: 'Lento',
    words: ['lento', 'lenta', 'lentos', 'lentas'],
    desc: 'Todas as formas de deslocamento do personagem são reduzidas à metade (arredonde para baixo para o primeiro incremento de 1,5m) e ele não pode correr ou fazer investidas.'
  },
  {
    title: 'Ofuscado',
    words: ['ofuscado', 'ofuscada', 'ofuscados', 'ofuscadas'],
    desc: 'O personagem sofre –2 em testes de ataque e de Percepção.'
  },
  {
    title: 'Paralisado',
    words: ['paralisado', 'paralisada', 'paralisados', 'paralisadas'],
    desc: 'O personagem fica imóvel e indefeso e só pode realizar ações puramente mentais.<div class=&quot;nested-cond&quot;><strong>Imóvel:</strong> Todas as formas de deslocamento do personagem são reduzidas a 0m.</div><div class=&quot;nested-cond&quot;><strong>Indefeso:</strong> O personagem fica desprevenido, mas sofre –10 na Defesa, falha automaticamente em testes de Reflexos e pode sofrer golpes de misericórdia.</div>'
  },
  {
    title: 'Pasmo',
    words: ['pasmo', 'pasma', 'pasmos', 'pasmas'],
    desc: 'Não pode fazer ações.'
  },
  {
    title: 'Petrificado',
    words: ['petrificado', 'petrificada', 'petrificados', 'petrificadas'],
    desc: 'O personagem fica inconsciente e recebe redução de dano 8.<div class=&quot;nested-cond&quot;><strong>Inconsciente:</strong> O personagem fica indefeso e não pode fazer ações.</div>'
  },
  {
    title: 'Sangrando',
    words: ['sangrando'],
    desc: 'No início de seu turno, o personagem deve fazer um teste de Constituição (CD 15). Se falhar, perde 1d6 pontos de vida e continua sangrando. Se passar, remove essa condição.'
  },
  {
    title: 'Sobrecarregado',
    words: ['sobrecarregado', 'sobrecarregada', 'sobrecarregados', 'sobrecarregadas'],
    desc: 'O personagem sofre penalidade de armadura –5 e seu deslocamento é reduzido em –3m.'
  },
  {
    title: 'Surdo',
    words: ['surdo', 'surda', 'surdos', 'surdas'],
    desc: 'O personagem não pode fazer testes de Percepção para ouvir e sofre –5 em testes de Iniciativa. Além disso, é considerado em condição ruim para lançar magias.'
  },
  {
    title: 'Surpreendido',
    words: ['surpreendido', 'surpreendida', 'surpreendidos', 'surpreendidas'],
    desc: 'O personagem fica desprevenido e não pode fazer ações.<div class=&quot;nested-cond&quot;><strong>Desprevenido:</strong> O personagem sofre –5 na Defesa e em Reflexos. Você fica desprevenido contra inimigos que não possa perceber.</div>'
  },
  {
    title: 'Vulnerável',
    words: ['vulnerável', 'vulneráveis', 'vulneravel', 'vulneraveis'],
    desc: 'O personagem sofre –2 na Defesa.'
  }
];

const wordMap = new Map();
for (const item of CONDITIONS_CATALOG) {
  for (const w of item.words) {
    wordMap.set(w.toLowerCase(), { title: item.title, desc: item.desc });
  }
}

// Palavras ordenadas por comprimento decrescente
const sortedWords = Array.from(wordMap.keys()).sort((a, b) => b.length - a.length);
const alternation = sortedWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
const combinedRegex = new RegExp(`(?<=^|[^a-zA-ZáàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ])(${alternation})(?=[^a-zA-ZáàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]|$)`, 'gi');

function highlightText(text) {
  return text.replace(combinedRegex, (match) => {
    const key = match.toLowerCase();
    const info = wordMap.get(key);
    if (!info) return match;
    return `<span class="cond-link" data-title="${info.title}" data-desc="${info.desc}">${match}</span>`;
  });
}

function processCardHtml(html) {
  const tokens = html.split(/(<[^>]+>)/g);
  let insideCondLink = 0;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.startsWith('<')) {
      if (/^<span\b[^>]*class=["'][^"']*\bcond-link\b/i.test(token)) {
        insideCondLink++;
      } else if (/^<\/span>/i.test(token) && insideCondLink > 0) {
        insideCondLink--;
      }
      continue;
    }

    if (insideCondLink === 0 && token.trim()) {
      tokens[i] = highlightText(token);
    }
  }

  return tokens.join('');
}

let beforeTotal = 0;
let afterTotal = 0;
const processed = {};

for (const [key, html] of Object.entries(cards)) {
  beforeTotal += (html.match(/class="cond-link"/g) || []).length;
  const newHtml = processCardHtml(html);
  afterTotal += (newHtml.match(/class="cond-link"/g) || []).length;
  processed[key] = newHtml;
}

fs.writeFileSync(cardsPath, JSON.stringify(processed, null, 2), 'utf8');
console.log(`Destaques de condições nas magias atualizados com sucesso em ${cardsPath}!`);
console.log(`Total antes: ${beforeTotal} | Total depois: ${afterTotal} (+${afterTotal - beforeTotal} novos destaques)`);
