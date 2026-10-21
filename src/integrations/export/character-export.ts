/**
 * Formatação Tipada de Exportação de Personagem (Caminho da Classe, Poderes e Magias).
 * Separada da UI, downloads e biblioteca PDF.
 */

export interface ExportClassAbility {
  nivel: number;
  nome: string;
  descricao?: string;
}

export interface ExportClassEntry {
  id: string;
  nome: string;
  habilidades?: ExportClassAbility[];
}

export interface ExportFeatureEntry {
  id?: string;
  nome?: string;
  descricao?: string;
  source?: string;
  efeitos?: Array<{
    tipo?: string;
    condicao?: unknown;
    condicoes?: unknown;
  }>;
}

export interface ExportSpellEntry {
  name?: string;
  description?: string;
  descricao?: string;
  text?: string;
}

export interface ExportPathInput {
  identity: {
    characterName?: string;
    playerName?: string;
    classId?: string;
  };
  progression?: Array<{ classId?: string; powerId?: string }>;
  classes: ExportClassEntry[];
  powerById: (id: string) => { id?: string; nome?: string; descricao?: string } | null | undefined;
  features: ExportFeatureEntry[];
  spells: Array<ExportSpellEntry | null | undefined>;
  age?: {
    enabled?: boolean;
    years?: number;
    complications?: string[];
  } | null;
  ageRule?: {
    name: string;
    min: number;
    notes?: string[];
  } | null;
  complications?: Array<[string, string, string]>;
}

export function formatFeatureTitle(feature?: { nome?: string } | null): string {
  return feature?.nome || '';
}

export function formatCharacterProgressionPath(input: ExportPathInput): string {
  const {
    identity,
    progression,
    classes,
    powerById,
    features,
    spells,
    age,
    ageRule,
    complications = [],
  } = input;

  const lines: string[] = [
    'Personagem: ' + (identity.characterName || 'Sem nome'),
    'Jogador: ' + (identity.playerName || 'Não informado'),
    '',
    'CAMINHO DA CLASSE',
  ];

  const rows = progression?.length ? progression : [{ classId: identity.classId }];
  const classLevels = new Map<string, number>();

  rows.forEach((row, index) => {
    const cls = classes.find((c) => c.id === (row.classId || identity.classId));
    if (!cls) return;
    lines.push('', `Nível ${index + 1} — ${cls.nome}`);
    const classLevel = (classLevels.get(cls.id) || 0) + 1;
    classLevels.set(cls.id, classLevel);

    (cls.habilidades || [])
      .filter((a) => Number(a.nivel) === classLevel)
      .forEach((a) => lines.push(a.nome, a.descricao || ''));

    if (row.powerId) {
      const power = powerById(row.powerId);
      lines.push(power?.nome || row.powerId, power?.descricao || '');
      if (row.powerId === 'inventor_engenhoqueiro' || power?.id === 'inventor_engenhoqueiro') {
        lines.push(
          '',
          'REGRAS DE ENGENHOCAS (Tormenta20, p. 70):',
          'Uma engenhoca é uma invenção que simula o efeito de uma magia. Exemplos incluem um canhão (simula o efeito da magia Bola de Fogo), uma arma de raios (Relâmpago), um casaco blindado (Armadura Arcana), um emplastro curativo (Curar Ferimentos), um guarda-costas mecânico (Conjurar Monstro), um projetor de imagens (Criar Ilusão), um veículo a vapor (Montaria Arcana) etc.',
          'Uma engenhoca é um item mundano Minúsculo que ocupa 1 espaço e possui Defesa 15, pontos de vida iguais à metade dos PV de seu fabricante e RD 5. Quando é fabricada, escolha se ela será empunhada (precisa estar na sua mão para ser ativada) ou vestida (precisa estar vestida para ser ativada, conta para seu limite de itens vestidos). Ao ser ativada, uma engenhoca pode assumir outra forma. Por exemplo, uma engenhoca que simula Montaria Arcana pode ser uma caixinha de engrenagens que se desdobra na forma de uma moto de madeira. Suas estatísticas não mudam.',
          'Fabricação. Para fabricar uma engenhoca, escolha uma magia arcana ou divina de 1º círculo. Essa será a magia que a engenhoca irá simular. A partir do 6º nível, você pode criar engenhocas com magias de 2º círculo e, a cada quatro níveis, pode criar engenhocas de um círculo maior. O custo de fabricação da engenhoca é T$ 100 x o custo em PM da magia que ela simula e a CD do teste é 20 + o custo em PM da magia. Assim, para fabricar uma engenhoca que simula o efeito de uma magia de 2º círculo (3 PM) você precisa gastar T$ 300 e passar em um teste de Ofício (engenhoqueiro) contra CD 23. O tempo de fabricação é uma semana.',
          'Limite de Engenhocas. Engenhocas são itens complexos e delicados, que exigem manutenção constante. O máximo de engenhocas que você pode ter ao mesmo tempo é igual a sua Inteligência.',
          'Ativação. Apenas o fabricante de uma engenhoca pode ativá-la. Ativar uma engenhoca exige uma ação padrão (ou a execução da magia, o que for maior) e um teste de Ofício (engenhoqueiro) contra CD 15 + custo em PM da magia. Se você passar, a engenhoca gera o efeito da magia (atributo-chave Int). Se falhar, ela enguiça e não pode ser utilizada até ser consertada, o que exige uma hora de trabalho. Cada nova ativação da engenhoca no mesmo dia aumenta a CD do teste de Ofício em +5.',
          'Quando ativa uma engenhoca, você pode usar quaisquer aprimoramentos da magia que ela simula, até um custo igual a sua Inteligência. A CD para ativar a engenhoca aumenta em +1 por PM e você paga o custo em PM dos aprimoramentos.',
          'Se a engenhoca simula o efeito de uma magia com custo especial, esse custo deve ser pago a cada ativação. Para outros custos e limitações, o efeito gerado pela engenhoca funciona como uma magia. Por exemplo, para manter um efeito com duração sustentada gerado por uma engenhoca, o inventor deve pagar 1 PM no início de cada um de seus turnos. Da mesma forma, só pode manter um efeito sustentado de engenhoca por vez. Se a magia simulada exigir um teste de Misticismo, use Ofício (engenhoqueiro) em seu lugar.',
          'Efeito Mundano. O efeito de uma engenhoca não é mágico. Isso significa que ele não pode ser dissipado, funciona em áreas de antimagia etc.',
          'Penalidade de Armadura. A ativação de uma engenhoca exige movimentos rápidos e precisos. Por isso, o teste de Ofício (engenhoqueiro) para ativar engenhocas sofre penalidade de armadura. Porém, você pode ativar engenhocas que geram magias arcanas enquanto usa armadura sem precisar fazer testes de Misticismo.',
          'Efeitos que Impedem Conjuração. Um efeito que especificamente impeça um personagem de lançar magias (como a Fúria de um bárbaro ou a magia Transformação de Guerra) também impede um inventor de ativar engenhocas.',
        );
      }
    }
  });

  lines.push('', 'HABILIDADES, PODERES E BENEFÍCIOS');
  features
    .filter((feature) => !['class', 'class-power'].includes(feature.source || ''))
    .forEach((feature) => lines.push('', feature.nome || '', feature.descricao || ''));

  lines.push('', 'MAGIAS');
  for (const spell of spells) {
    if (spell) {
      lines.push('', spell.name || '', spell.description || spell.descricao || spell.text || '');
    }
  }

  if (age?.enabled) {
    lines.push(
      '',
      'IDADE',
      ageRule ? `${ageRule.name}: ${age.years || ageRule.min} anos` : 'Faixa pendente',
      ...(ageRule?.notes || []),
    );
    const chosenComplications = age.complications || [];
    complications
      .filter((c) => chosenComplications.includes(c[0]))
      .forEach((c) => lines.push(`${c[1]}: ${c[2]}`));
  }

  lines.push(
    '',
    'ESCOLHAS PENDENTES',
    'Leia todo o caminho e procure escolhas ainda não preenchidas antes de continuar.',
  );

  const combatNames = features.map((f) => f.nome || '');
  if (combatNames.some((name) => /Estilo de Duas Armas/i.test(name))) {
    lines.push(
      'Estilo de Duas Armas: ative atacar com ambas somente ao usar a ação agredir com duas armas, sendo uma leve. Encerre o efeito no próximo turno. A penalidade é −2 em todos os ataques, ou zero com Ambidestria. O avanço de turnos é manual.',
    );
  }

  for (const feature of features) {
    if (/Estilo de (Uma|Duas) Arma/i.test(feature.nome || '')) continue;
    if (
      !feature.efeitos?.length ||
      feature.efeitos.some(
        (effect) =>
          Boolean(effect.condicao) ||
          Boolean(effect.condicoes) ||
          /condicional|ativar|ataque_extra/.test(effect.tipo || ''),
      )
    ) {
      lines.push(
        `${feature.nome || 'Poder'}: confira a descrição completa; efeitos situacionais sem controle específico devem ser aplicados manualmente na ficha. Não considere o poder integralmente automatizado.`,
      );
    }
  }

  return lines.join('\n');
}

export const ExportacaoPersonagem = Object.freeze({
  titulo: formatFeatureTitle,
  caminho: formatCharacterProgressionPath,
});
