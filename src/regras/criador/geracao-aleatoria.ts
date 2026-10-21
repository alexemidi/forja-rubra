

  /**
   * Define a hierarquia de atributos recomendada para cada classe.
   * 1º Atributo-chave sempre recebe a pontuação mais alta (4 ou 3).
   * 2º Atributos de pré-requisitos essenciais e defensivos (CON/Defesa).
   * 3º Atributos descartáveis (dump) recebem 0 ou -1.
   */
  function classAttributePriority(classId, subChoices = {}){
    switch(classId){
      case 'nobre':
      case 'burgues':
        // Carisma no topo (Autoconfiança, Inspiração, Orgulho). Int 1 para Guerra. DES e FOR dispensáveis (0 ou -1).
        return ['car', 'int', 'con', 'sab', 'des', 'for'];
      case 'santo':
        // Armadura pesada (DES dispensável). Abençoado usa CAR para PM. Ladainha/Golpe usam CAR. FOR para combate/carga. CON para PV.
        return ['car', 'for', 'con', 'sab', 'int', 'des'];
      case 'paladino':
        // Armadura pesada (DES dispensável). Golpe Divino/Cura usam CAR. FOR para armas marciais. CON para PV.
        return ['for', 'car', 'con', 'sab', 'int', 'des'];
      case 'cavaleiro':
      case 'vassalo':
        // Armadura pesada (DES dispensável). Duelo/Baluarte usam CAR. FOR para combate. CON para PV.
        return ['for', 'con', 'car', 'sab', 'int', 'des'];
      case 'barbaro':
      case 'machado_de_pedra':
        // Fúria usa FOR. Defesa e PV dependem de CON e DES (não usa armadura pesada). Sab 1 ou 2 para poderes xamânicos.
        return ['for', 'con', 'des', 'sab', 'int', 'car'];
      case 'guerreiro':
      case 'inovador':
        // FOR para combate, CON para PV, DES para iniciativa/reflexos/manobras. Sab 1 (Golpe Pessoal/pre-reqs), Int 1 (Guerra).
        return ['for', 'con', 'des', 'sab', 'int', 'car'];
      case 'lutador':
      case 'atleta':
        // Briga/Golpes usam FOR, Casca Grossa usa CON. DES para Acrobacia/Reflexos.
        return ['for', 'con', 'des', 'int', 'sab', 'car'];
      case 'ladino':
      case 'ventanista':
        // Ataque Furtivo usa DES. Perícias e Engenhosidade usam INT. CON para sobrevivência.
        return ['des', 'int', 'con', 'car', 'sab', 'for'];
      case 'bucaneiro':
      case 'duelista':
        // Audácia e Panache usam CAR. Combate/Esgrima usa DES. CON para PV.
        return ['des', 'car', 'con', 'int', 'sab', 'for'];
      case 'cacador':
      case 'seteiro':
        // Disparo e arquearia usam DES. Sobrevivência e poderes de caçador usam SAB. Con para PV, Car 1 para poderes como Companheiro Animal.
        return ['des', 'sab', 'con', 'car', 'int', 'for'];
      case 'arcanista': {
        const caminho = subChoices['arcanista_caminho_do_arcanista'] || '';
        if(caminho === 'Feiticeiro') return ['car', 'con', 'des', 'int', 'sab', 'for'];
        return ['int', 'con', 'des', 'sab', 'car', 'for'];
      }
      case 'inventor':
      case 'alquimista':
        // Engenhosidade e fórmulas usam INT. Percepção/Vontade usam SAB. DES para pontaria/iniciativa.
        return ['int', 'des', 'con', 'sab', 'for', 'car'];
      case 'bardo':
      case 'magimarcialista':
        // Magias e atuação usam CAR. Conhecimento e perícias usam INT. DES para defesa/iniciativa.
        return ['car', 'des', 'int', 'con', 'sab', 'for'];
      case 'clerigo':
      case 'usurpador':
      case 'frade':
        // Magias divinas usam SAB. CON para PV. FOR para armas/armadura ou CAR para canalização.
        return ['sab', 'con', 'for', 'car', 'int', 'des'];
      case 'druida':
      case 'ermitao':
        // Magias e Forma Selvagem usam SAB. CON para PV. FOR/DES para combate.
        return ['sab', 'con', 'for', 'des', 'car', 'int'];
      case 'mistico':
        // Magias e afinidades elementais usam SAB. CON e DES para defesa (Sexto Sentido).
        return ['sab', 'con', 'des', 'car', 'int', 'for'];
      case 'samurai':
        return ['for', 'con', 'des', 'sab', 'int', 'car'];
      default:
        return ['for', 'con', 'des', 'sab', 'int', 'car'];
    }
  }

  function generateRandomAttributes(classId, subChoices = {}){
    const spread = [...pickRandom(BALANCED_SPREADS_10_POINTS)];
    const orderedKeys = classAttributePriority(classId, subChoices);
    const attrs = { for: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 };
    orderedKeys.forEach((key, index) => {
      attrs[key] = spread[index] !== undefined ? spread[index] : 0;
    });
    return attrs;
  }

  const CLASS_FORBIDDEN_SKILLS = {
    santo: ['enganacao', 'ladinagem', 'jogatina'],
    paladino: ['enganacao', 'ladinagem', 'jogatina'],
    clerigo: ['ladinagem', 'jogatina'],
    frade: ['ladinagem', 'jogatina'],
    cavaleiro: ['ladinagem'],
    vassalo: ['ladinagem']
  };

  const CLASS_PREFERRED_SKILLS = {
    santo: ['religiao', 'cura', 'vontade', 'guerra', 'diplomacia', 'nobreza', 'intuicao', 'percepcao', 'atletismo', 'fortitude'],
    paladino: ['luta', 'fortitude', 'vontade', 'cura', 'nobreza', 'religiao', 'diplomacia', 'guerra', 'intuicao', 'percepcao'],
    nobre: ['diplomacia', 'nobreza', 'guerra', 'intuicao', 'iniciativa', 'vontade', 'percepcao', 'investigacao', 'adestramento'],
    burgues: ['diplomacia', 'nobreza', 'guerra', 'intuicao', 'iniciativa', 'vontade', 'percepcao', 'investigacao'],
    guerreiro: ['luta', 'pontaria', 'guerra', 'iniciativa', 'fortitude', 'atletismo', 'percepcao', 'vontade'],
    inovador: ['luta', 'pontaria', 'guerra', 'iniciativa', 'fortitude', 'atletismo', 'percepcao', 'vontade'],
    barbaro: ['luta', 'fortitude', 'atletismo', 'intimidacao', 'iniciativa', 'percepcao', 'sobrevivencia', 'vontade'],
    machado_de_pedra: ['luta', 'fortitude', 'atletismo', 'intimidacao', 'iniciativa', 'percepcao', 'sobrevivencia', 'vontade'],
    cavaleiro: ['luta', 'fortitude', 'guerra', 'nobreza', 'religiao', 'adestramento', 'atletismo', 'vontade', 'percepcao'],
    vassalo: ['luta', 'fortitude', 'guerra', 'nobreza', 'religiao', 'adestramento', 'atletismo', 'vontade', 'percepcao'],
    lutador: ['luta', 'atletismo', 'acrobacia', 'intimidacao', 'fortitude', 'iniciativa', 'percepcao', 'vontade'],
    atleta: ['luta', 'atletismo', 'acrobacia', 'intimidacao', 'fortitude', 'iniciativa', 'percepcao', 'vontade'],
    ladino: ['ladinagem', 'furtividade', 'iniciativa', 'reflexos', 'acrobacia', 'investigacao', 'pontaria', 'luta', 'percepcao'],
    ventanista: ['ladinagem', 'furtividade', 'iniciativa', 'reflexos', 'acrobacia', 'investigacao', 'pontaria', 'luta', 'percepcao'],
    bucaneiro: ['acrobacia', 'luta', 'pontaria', 'iniciativa', 'intimidacao', 'jogatina', 'diplomacia', 'atletismo', 'percepcao'],
    duelista: ['acrobacia', 'luta', 'pontaria', 'iniciativa', 'intimidacao', 'jogatina', 'diplomacia', 'atletismo', 'percepcao'],
    cacador: ['pontaria', 'sobrevivencia', 'furtividade', 'adestramento', 'iniciativa', 'percepcao', 'atletismo', 'fortitude'],
    seteiro: ['pontaria', 'sobrevivencia', 'furtividade', 'adestramento', 'iniciativa', 'percepcao', 'reflexos', 'atletismo', 'fortitude'],
    arcanista: ['misticismo', 'conhecimento', 'vontade', 'iniciativa', 'percepcao', 'oficio'],
    bardo: ['atuacao', 'misticismo', 'enganacao', 'diplomacia', 'iniciativa', 'percepcao', 'vontade', 'intuicao'],
    magimarcialista: ['atuacao', 'misticismo', 'enganacao', 'diplomacia', 'luta', 'iniciativa', 'percepcao', 'vontade'],
    inventor: ['oficio', 'conhecimento', 'investigacao', 'misticismo', 'pontaria', 'pilotagem', 'percepcao', 'vontade'],
    alquimista: ['oficio', 'conhecimento', 'investigacao', 'misticismo', 'pontaria', 'pilotagem', 'percepcao', 'vontade'],
    clerigo: ['religiao', 'cura', 'vontade', 'conhecimento', 'intuicao', 'diplomacia', 'percepcao', 'fortitude'],
    frade: ['religiao', 'cura', 'vontade', 'conhecimento', 'intuicao', 'diplomacia', 'percepcao', 'fortitude'],
    usurpador: ['misticismo', 'religiao', 'conhecimento', 'vontade', 'iniciativa', 'percepcao', 'fortitude'],
    druida: ['sobrevivencia', 'adestramento', 'religiao', 'percepcao', 'cura', 'atletismo', 'fortitude', 'vontade'],
    ermitao: ['sobrevivencia', 'adestramento', 'religiao', 'percepcao', 'cura', 'atletismo', 'fortitude', 'vontade'],
    mistico: ['misticismo', 'vontade', 'pontaria', 'luta', 'iniciativa', 'percepcao', 'conhecimento', 'fortitude'],
    samurai: ['luta', 'vontade', 'intimidacao', 'pontaria', 'iniciativa', 'percepcao', 'atletismo', 'fortitude']
  };

  const CLASS_INCOMPATIBLE_ORIGINS = {
    arcanista: ['soldado', 'gladiador', 'capanga', 'guarda', 'cavaleiro', 'barbaro_das_uivantes', 'tropeiro', 'estivador'],
    cacador: ['acolito', 'cortesa', 'nobre', 'artista'],
    seteiro: ['acolito', 'cortesa', 'nobre', 'artista'],
    santo: ['charlatao', 'ladrao', 'pivete', 'criminoso', 'capanga', 'assistente_de_laboratorio', 'gladiador', 'batedor_de_carteiras'],
    paladino: ['charlatao', 'ladrao', 'pivete', 'criminoso', 'capanga', 'assistente_de_laboratorio', 'gladiador', 'batedor_de_carteiras'],
    clerigo: ['charlatao', 'ladrao', 'gladiador', 'capanga', 'criminoso', 'pivete'],
    frade: ['charlatao', 'ladrao', 'gladiador', 'capanga', 'criminoso', 'pivete'],
    druida: ['charlatao', 'ladrao', 'gladiador', 'capanga', 'nobre', 'cortesa', 'burgues'],
    ermitao: ['charlatao', 'ladrao', 'gladiador', 'capanga', 'nobre', 'cortesa', 'burgues'],
    barbaro: ['estudioso', 'escriba', 'assistente_de_laboratorio', 'nobre', 'cortesa'],
    machado_de_pedra: ['estudioso', 'escriba', 'assistente_de_laboratorio', 'nobre', 'cortesa'],
    lutador: ['estudioso', 'escriba', 'assistente_de_laboratorio'],
    atleta: ['estudioso', 'escriba', 'assistente_de_laboratorio']
  };

  function pickThematicSkills(pool, count, classId, currentAttrs = {}){
    if(count <= 0 || !pool || !pool.length) return [];
    const forbidden = new Set(CLASS_FORBIDDEN_SKILLS[classId] || []);
    const validPool = pool.filter(s => !forbidden.has(s));
    const preferred = CLASS_PREFERRED_SKILLS[classId] || [];

    // Prioriza ao menos uma perícia vinculada ao maior atributo do personagem
    const topAttrEntry = Object.entries(currentAttrs).sort((a,b) => b[1] - a[1])[0];
    const topAttr = topAttrEntry ? topAttrEntry[0] : null;

    const topAttrSkills = {
      sab: ['religiao', 'percepcao', 'cura', 'sobrevivencia', 'intuicao', 'vontade'],
      int: ['conhecimento', 'misticismo', 'investigacao', 'oficio'],
      car: ['diplomacia', 'atuacao', 'nobreza', 'adestramento', 'intimidacao', 'enganacao'],
      des: ['acrobacia', 'furtividade', 'iniciativa', 'ladinagem', 'pilotagem', 'pontaria', 'reflexos'],
      for: ['atletismo', 'luta'],
      con: ['fortitude']
    };

    const highPriority = [];
    if(topAttr && topAttrSkills[topAttr]){
      const match = topAttrSkills[topAttr].find(s => validPool.includes(s) && !forbidden.has(s) && preferred.includes(s));
      if(match) highPriority.push(match);
    }

    const preferredAvailable = preferred.filter(s => validPool.includes(s) && !highPriority.includes(s));
    const otherAvailable = validPool.filter(s => !preferred.includes(s) && !highPriority.includes(s));

    const chosen = [...highPriority.slice(0, count)];
    const pList = [...preferredAvailable];
    while(pList.length && chosen.length < count){
      const idx = Math.floor(Math.random() * pList.length);
      chosen.push(pList.splice(idx, 1)[0]);
    }
    const oList = [...otherAvailable];
    while(oList.length && chosen.length < count){
      const idx = Math.floor(Math.random() * oList.length);
      chosen.push(oList.splice(idx, 1)[0]);
    }
    return chosen;
  }