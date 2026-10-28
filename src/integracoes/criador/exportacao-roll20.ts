type Roll20FeatureLike = {
  id?: string;
  nome?: string;
  name?: string;
  descricao?: string;
  description?: string;
  source?: string;
  origemRegional?: string;
  originDesc?: string;
  cosmoDesc?: string;
  powerDesc?: string;
  aparencia?: string;
  chosenPower?: Roll20FeatureLike | null;
  elementalFamiliarOption?: {
    name?: string;
    shortName?: string;
    description?: string;
  } | null;
};

type Roll20SpellLike = {
  id?: string;
  nome?: string;
  name?: string;
  type?: string;
  circle?: number | string;
  circulo?: number | string;
  circuloMagia?: number | string;
  school?: string;
  escola?: string;
  execution?: string;
  execucao?: string;
  range?: string;
  alcance?: string;
  duration?: string;
  duracao?: string;
  target?: string;
  alvo?: string;
  area?: string;
  effect?: string;
  efeito?: string;
  resistance?: string;
  resistencia?: string;
  description?: string;
  descricao?: string;
};

type Roll20AttackInput = {
  name: string;
  totalAttack: number | string;
  skillTotal?: number | string;
  skill?: string;
  damageDice: string;
  damageExtra: number | string;
  damageAttribute?: string | null;
  extraDice?: string;
  critical?: string;
  damageType?: string;
  range?: string;
  description?: string;
};

type Roll20DefenseInput = {
  defenseAttribute: string;
  totalDefense: number;
  attributeBonus?: number;
  dexterityBonus?: number;
  shieldStyleBonus?: number;
  shieldStyleActive?: boolean;
  armorName: string;
  armorDefense: number;
  armorPenalty: number;
  shieldName: string;
  shieldDefense: number;
  shieldPenalty: number;
};

function roll20FeatureRecord(feature: Roll20FeatureLike, kind: 'ability' | 'power') {
  const name = String(feature.nome || feature.name || feature.id || '').trim();
  if (!name) return null;
  const description = String(feature.descricao || feature.description || '').trim();
  return kind === 'power'
    ? { namepower: name, powerdescription: description }
    : { nameability: name, abilitydescription: description };
}

function expandRoll20CharacterFeatures(features: Roll20FeatureLike[]) {
  const abilities: Array<{ nameability: string; abilitydescription: string }> = [];
  const powers: Array<{ namepower: string; powerdescription: string }> = [];
  const seenAbilities = new Set<string>();
  const seenPowers = new Set<string>();

  const toKey = (text: string) =>
    String(text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLocaleLowerCase('pt-BR');

  const pushAbility = (name: string, description: string) => {
    const cleanName = String(name || '').trim();
    if (!cleanName) return;
    const key = toKey(cleanName);
    if (seenAbilities.has(key)) return;
    seenAbilities.add(key);
    abilities.push({
      nameability: cleanName,
      abilitydescription: String(description || '').trim()
    });
  };

  const pushPower = (name: string, description: string) => {
    const cleanName = String(name || '').trim();
    if (!cleanName) return;
    const key = toKey(cleanName);
    if (seenPowers.has(key)) return;
    seenPowers.add(key);
    powers.push({
      namepower: cleanName,
      powerdescription: String(description || '').trim()
    });
  };

  for (const feature of Array.isArray(features) ? features : []) {
    if (!feature) continue;
    const rawId = String(feature.id || '');
    const rawName = String(feature.nome || feature.name || rawId).trim();
    if (!rawName) continue;
    const rawDesc = String(feature.descricao || feature.description || '').trim();
    const source = String(feature.source || '');

    // 1. Cosmopolita
    const isCosmo =
      feature.origemRegional === 'Cosmopolita' ||
      rawId === 'cosmopolita' ||
      rawId.startsWith('cosmopolita:') ||
      /^Cosmopolita\s*\(/i.test(rawName);
    if (isCosmo) {
      const cosmoDesc =
        feature.originDesc ||
        feature.cosmoDesc ||
        'Escolha um poder geral ou de uma classe na qual você tenha pelo menos dois níveis, e cujos requisitos você cumpra (exceto poderes concedidos ou da Tormenta). Você recebe esse poder. Uma vez por aventura, após concluir um descanso (oito horas de sono), pode trocar esse poder por outro.';
      const chosen = feature.chosenPower;
      const chosenName = String(
        chosen?.nome ||
          chosen?.name ||
          (rawName.includes('(') ? rawName.replace(/^[^(]+\(/, '').replace(/\)$/, '') : '')
      ).trim();
      const chosenDesc = String(feature.powerDesc || chosen?.descricao || chosen?.description || '').trim();
      const originFullDesc = chosenName
        ? `${cosmoDesc}\n\nPoder obtido: ${chosenName}.`
        : cosmoDesc;

      pushAbility('Cosmopolita', originFullDesc);
      pushPower('Cosmopolita', originFullDesc);
      if (chosenName) {
        pushPower(chosenName, chosenDesc || rawDesc);
      }
      continue;
    }

    // 2. Duplo Feérico / Futura Lenda
    const isRegionalGrant =
      feature.origemRegional === 'Duplo Feérico' ||
      feature.origemRegional === 'Futura Lenda' ||
      rawId === 'duplo_feerico' ||
      rawId === 'futura_lenda' ||
      rawId.startsWith('duplo_feerico:') ||
      /^(?:Duplo Fe[eé]rico|Futura Lenda)\s*\(/i.test(rawName);
    if (isRegionalGrant) {
      const originTitle =
        feature.origemRegional ||
        (/^Futura Lenda/i.test(rawName) ? 'Futura Lenda' : 'Duplo Feérico');
      const originDesc =
        feature.originDesc ||
        (originTitle === 'Futura Lenda'
          ? 'Você recebe um poder de sua classe cujo pré-requisito de nível seja no máximo 2º nível.'
          : 'Você possui uma ligação mística com outra classe. Escolha um poder de 1º nível de outra classe (exceto poderes concedidos ou da Tormenta). Você recebe esse poder.');
      const chosen = feature.chosenPower;
      const chosenName = String(
        chosen?.nome ||
          chosen?.name ||
          (rawName.includes('(') ? rawName.replace(/^[^(]+\(/, '').replace(/\)$/, '') : '')
      ).trim();
      const chosenDesc = String(feature.powerDesc || chosen?.descricao || chosen?.description || '').trim();
      const originFullDesc = chosenName
        ? `${originDesc}\n\nPoder obtido: ${chosenName}.`
        : originDesc;

      pushAbility(originTitle, originFullDesc);
      pushPower(originTitle, originFullDesc);
      if (chosenName) {
        pushPower(chosenName, chosenDesc || rawDesc);
      }
      continue;
    }

    // 3. Criação dos Deuses
    const isCriacaoDeuses =
      rawId === 'criacao_dos_deuses' ||
      source === 'criacao_dos_deuses' ||
      /^Cria[çc][aã]o dos Deuses/i.test(rawName);
    if (isCriacaoDeuses) {
      const originDesc =
        feature.originDesc ||
        'Você foi criado por um dos deuses maiores de Arton, mas deixou seu plano natal muito cedo. Você se torna um espírito, mas retém as características de seu tipo original e recebe redução de dano 5 conforme a energia canalizada pelo deus. Por fim, recebe o poder Escolhido dos Deuses para a divindade escolhida.';
      const chosen = feature.chosenPower;
      const chosenName = String(
        chosen?.nome ||
          chosen?.name ||
          (rawName.includes('(') ? rawName.replace(/^[^(]+\(/, '').replace(/\)$/, '') : '')
      ).trim();
      const chosenDesc = String(feature.powerDesc || chosen?.descricao || chosen?.description || '').trim();
      const extraParts = [
        originDesc,
        feature.aparencia ? `Aparência física: ${feature.aparencia}` : '',
        chosenName ? `Poder obtido: ${chosenName}.` : ''
      ].filter(Boolean);

      pushAbility('Criação dos Deuses', extraParts.join('\n\n'));
      pushPower('Criação dos Deuses', extraParts.join('\n\n'));
      if (chosenName) {
        pushPower(chosenName, chosenDesc || rawDesc);
      }
      continue;
    }

    // 4. Idade (Já Vi Coisas ou outras faixas) e Complicações
    if (source === 'age' || source === 'complication') {
      const chosen = feature.chosenPower;
      const chosenName = String(chosen?.nome || chosen?.name || '').trim();
      const chosenDesc = String(chosen?.descricao || chosen?.description || '').trim();
      const cleanHeader = rawName.includes('(') && chosenName
        ? rawName.replace(/\([^)]+\)$/, '').trim()
        : rawName;
      const fullHeaderDesc = chosenName
        ? `${rawDesc}${rawDesc.includes(chosenName) ? '' : `\n\nPoder obtido: ${chosenName}.`}`
        : rawDesc;

      pushAbility(cleanHeader, fullHeaderDesc);
      pushPower(cleanHeader, fullHeaderDesc);
      if (chosenName) {
        pushPower(chosenName, chosenDesc || rawDesc);
      }
      continue;
    }

    // 5. Origem padrão (ex: Acólito(Cura/Religião/Membro da Igreja))
    if (source === 'origin' && rawId.startsWith('origem_')) {
      const originBaseName = String((feature as any).originName || rawName.replace(/\([^)]*\)$/, '')).trim();
      const benefitNames: string[] = Array.isArray((feature as any).benefitNames) ? (feature as any).benefitNames : [];
      const fullOriginDesc = benefitNames.length
        ? `Benefícios escolhidos: ${benefitNames.join(', ')}.\n\n${rawDesc}`
        : rawDesc;
      pushAbility(originBaseName || rawName, fullOriginDesc);

      const lines = rawDesc.split(/\n\n+/);
      for (const line of lines) {
        const match = line.match(/^•\s*([^:]+):\s*([\s\S]+)$/);
        if (match) {
          const bName = match[1].trim();
          const bDesc = match[2].trim();
          const isSkillOnly = /^Per[íi]cia treinada pela origem\.?$/i.test(bDesc);
          if (!isSkillOnly && bName && bDesc) {
            pushPower(bName, bDesc);
          }
        }
      }
      continue;
    }

    // 6. Fundamentalista com poder embutido
    if (rawId.startsWith('fundamentalista_') && /^Fundamentalista\s*\(/i.test(rawName)) {
      const parts = rawDesc.split(/\r?\n\r?\n/);
      if (parts.length >= 2) {
        const dogmaText = parts[0].trim();
        const powerLine = parts.slice(1).join('\n\n').trim();
        const pMatch = powerLine.match(/^([^:]+):\s*([\s\S]+)$/);
        if (pMatch) {
          const pName = pMatch[1].trim();
          const pDesc = pMatch[2].trim();
          pushAbility('Fundamentalista', `${dogmaText}\n\nPoder obtido: ${pName}.`);
          pushPower(pName, pDesc);
          continue;
        }
      }
    }

    // 7. Familiar Elemental com opção escolhida
    if (feature.elementalFamiliarOption?.name && feature.elementalFamiliarOption?.description) {
      const opt = feature.elementalFamiliarOption;
      const combinedDesc = `${rawDesc}\n\n${opt.name}: ${opt.description}`;
      if (['race', 'class', 'origin'].includes(source)) {
        pushAbility(rawName, combinedDesc);
      } else {
        pushPower(rawName, combinedDesc);
      }
      continue;
    }

    // 8. Classificação padrão
    if (['race', 'class', 'origin', 'distinction', 'distinction-mark'].includes(source)) {
      pushAbility(rawName, rawDesc);
      if (source === 'origin' || source === 'distinction' || source === 'distinction-mark') {
        pushPower(rawName, rawDesc);
      }
    } else {
      pushPower(rawName, rawDesc);
    }
  }

  return { abilities, powers };
}

function roll20SpellRecord(spell: Roll20SpellLike, cardHtml: string) {
  const schoolNames: Record<string, string> = {
    abjuracao: 'Abjuração',
    adivinhacao: 'Adivinhação',
    convocacao: 'Convocação',
    encantamento: 'Encantamento',
    evocacao: 'Evocação',
    ilusao: 'Ilusão',
    necromancia: 'Necromancia',
    transmutacao: 'Transmutação'
  };
  const typeNames: Record<string, string> = {
    divina: 'Divina',
    arcana: 'Arcana',
    universal: 'Universal'
  };

  let name = String(spell?.nome || spell?.name || spell?.id || '').trim();
  const circle = Number(spell?.circle ?? spell?.circulo ?? spell?.circuloMagia ?? 1);
  const rawTypeKey = String(spell?.type || '').toLocaleLowerCase('pt-BR');
  const rawSchoolKey = String(spell?.school || spell?.escola || '').toLocaleLowerCase('pt-BR');

  let typeLabel = typeNames[rawTypeKey] || String(spell?.type || 'Arcana');
  let schoolLabel = schoolNames[rawSchoolKey] || String(spell?.school || spell?.escola || '').replace(/_/g, ' ');
  let execucao = String(spell?.execucao || spell?.execution || '');
  let alcance = String(spell?.alcance || spell?.range || '');
  let duracao = String(spell?.duracao || spell?.duration || '');
  let alvoArea = String(spell?.alvo || spell?.target || spell?.area || spell?.efeito || spell?.effect || '');
  let resistencia = String(spell?.resistencia || spell?.resistance || '');
  let description = String(spell?.descricao || spell?.description || '');

  if (cardHtml && typeof DOMParser !== 'undefined') {
    const card = new DOMParser().parseFromString(cardHtml, 'text/html');
    name = card.querySelector('.card-title')?.textContent?.trim() || name;

    const normalize = (value: string) =>
      value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/:$/, '')
        .trim()
        .toLocaleLowerCase('pt-BR');

    const property = (labels: string[]) => {
      const wanted = labels.map(normalize);
      for (const row of Array.from(card.querySelectorAll('.prop-row'))) {
        const label = normalize(row.querySelector('.prop-label')?.textContent || '');
        if (wanted.some(value => label === value || label.startsWith(`${value}/`) || label.includes(value))) {
          return row.querySelector('.prop-value')?.textContent?.trim() || '';
        }
      }
      return '';
    };

    typeLabel =
      card.querySelector('.badge-divina, .badge-arcana, .badge-universal')?.textContent?.trim() ||
      typeLabel;
    schoolLabel =
      card.querySelector('.badge-escola')?.textContent?.trim() ||
      schoolLabel;

    execucao = property(['execução', 'execucao']) || execucao;
    alcance = property(['alcance']) || alcance;
    duracao = property(['duração', 'duracao']) || duracao;
    alvoArea = property(['alvo', 'área', 'area', 'efeito', 'alvo ou área', 'alvo/área']) || alvoArea;
    resistencia = property(['resistência', 'resistencia']) || resistencia;

    const baseDescription = card.querySelector('.card-desc')?.textContent?.trim() || '';
    const trick = card.querySelector('.truque-section');
    const trickLabel = trick?.querySelector('.truque-label')?.textContent?.trim().replace(/:$/, '') || 'Truque';
    const rawTrickText = trick?.textContent?.trim() || '';
    const trickText = rawTrickText
      ? rawTrickText.replace(new RegExp(`^${trickLabel}\\s*:?\\s*`, 'i'), '').trim()
      : '';
    const improvements = Array.from(card.querySelectorAll('.apr-list li'))
      .map(item => item.textContent?.trim() || '')
      .filter(Boolean);
    const improvementsText = improvements.length
      ? `Aprimoramentos:\n${improvements.join('\n')}`
      : '';

    description = [
      baseDescription,
      trickText ? `${trickLabel}: ${trickText}` : '',
      improvementsText
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  const cleanExecucao = execucao.replace(/^a[çc][aã]o\s+/i, '').trim();

  return {
    namespell: name,
    spelltipo: `${typeLabel} ${circle}${schoolLabel ? ` (${schoolLabel})` : ''}`,
    spellcd: '0',
    spellexecucao: cleanExecucao,
    spellalcance: alcance,
    spellduracao: duracao,
    spellalvoarea: alvoArea,
    spellresistencia: resistencia,
    spelldescription: description
  };
}

function roll20AttackRecord(input: Roll20AttackInput) {
  const allowedSkills = ['luta', 'pontaria', 'atuacao'];
  const skill = allowedSkills.includes(String(input.skill || '').toLocaleLowerCase('pt-BR'))
    ? String(input.skill).toLocaleLowerCase('pt-BR')
    : 'luta';
  const totalAttack = Number(input.totalAttack) || 0;
  const skillTotal = Number(input.skillTotal) || 0;
  const critical = String(input.critical || '20/x2');
  const criticalParts = critical.match(/(\d+)\s*\/\s*x?\s*(\d+)/i);
  const criticalMultiplier = critical.match(/x\s*(\d+)/i)?.[1] || critical.match(/(\d+)\s*x/i)?.[1];
  const criticalMarginOnly = !criticalParts && !criticalMultiplier ? critical.match(/^(\d{2})$/)?.[1] : undefined;
  const attackSkill = `@{${skill}total}${skill === 'luta' ? '+@{condicaomodataquecc}' : ''}+@{condicaomodataque}`;
  const damageAttribute = ['for', 'des', 'con', 'int', 'sab', 'car'].includes(String(input.damageAttribute || ''))
    ? `@{${input.damageAttribute}_mod}`
    : '0';

  return {
    nomeataque: input.name,
    bonusataque: String(Math.trunc(totalAttack - skillTotal)),
    danoataque: input.damageDice || '0',
    danoextraataque: String(input.damageExtra ?? 0),
    dadoextraataque: input.extraDice || '0',
    margemcriticoataque: criticalParts?.[1] || criticalMarginOnly || '20',
    multiplicadorcriticoataque: criticalParts?.[2] || criticalMultiplier || '2',
    ataquedescricao: input.description || '',
    ataquepericia: attackSkill,
    ataquetipodedano: input.damageType || '',
    ataquealcance: input.range || '',
    modatributodano: damageAttribute,
    tipocritico: '',
    danocriticoataque: '0 + 0 + 0 + 0'
  };
}

function roll20EquipmentRecord(
  name: string,
  quantity: unknown,
  spacesPerUnit: unknown,
  description = '',
  isWornOrEquipped = false
) {
  const qty = Math.max(1, Number(quantity ?? 1) || 1);
  const slotNum = Number(spacesPerUnit ?? 0);
  return {
    equipname: name,
    equipslot: String(Number.isFinite(slotNum) ? slotNum * qty : 0),
    equipquantity: String(qty),
    equipweight: String(Number.isFinite(slotNum) ? slotNum * qty : 0),
    eqpdescription: description,
    sobrevivencia_treinada: isWornOrEquipped ? '1' : '0'
  };
}

function roll20DefenseFields(input: Roll20DefenseInput) {
  const usesAttribute = Boolean(
    input.defenseAttribute &&
    input.defenseAttribute !== 'none' &&
    input.defenseAttribute !== 'nenhum'
  );
  const usesDexterity = input.defenseAttribute === 'des';
  const attrBonus = Number(input.attributeBonus ?? input.dexterityBonus ?? 0);
  const otherDefense = input.totalDefense
    - 10
    - (usesAttribute ? attrBonus : 0)
    - input.armorDefense
    - input.shieldDefense
    - (input.shieldStyleActive ? 0 : Number(input.shieldStyleBonus || 0));
  return {
    defesadestreza: usesDexterity ? '1' : '0',
    defesaatributo: usesAttribute ? '1' : '0',
    modatributodefesa: `${usesAttribute ? input.defenseAttribute : 'des'}_mod`,
    defesaoutros: String(Math.round(otherDefense)),
    armadura1: input.armorName,
    armaduradefesa1: String(input.armorDefense),
    armadurapenalidade1: String(input.armorPenalty),
    armadura2: input.shieldName,
    armaduradefesa2: String(input.shieldDefense),
    armadurapenalidade2: String(input.shieldPenalty)
  };
}

if (typeof window !== 'undefined') {
  Object.assign(window as any, {
    roll20FeatureRecord,
    expandRoll20CharacterFeatures,
    roll20SpellRecord,
    roll20AttackRecord,
    roll20EquipmentRecord,
    roll20DefenseFields
  });
}
if (typeof globalThis !== 'undefined') {
  Object.assign(globalThis as any, {
    roll20FeatureRecord,
    expandRoll20CharacterFeatures,
    roll20SpellRecord,
    roll20AttackRecord,
    roll20EquipmentRecord,
    roll20DefenseFields
  });
}
