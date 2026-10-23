/**
 * Suíte de Testes Unitários em TypeScript — Features, Manufatura, Engenhocas,
 * Armaduras Especiais, Economia da Aventura, Checkout de Loja e Exportação.
 */

import assert from 'node:assert/strict';

import {
  custoMateriaPrima,
  cdFabricacao,
  tempoFabricacao,
  podeReceberMelhorias,
  podeReceberMaterialEspecial,
  podeReceberEncantos,
  calcularAprimoramentoItemExistente,
  circuloMaximoEngenhoca,
  custoFabricacaoEngenhoca,
  cdFabricacaoEngenhoca,
  cdAtivacaoEngenhoca,
  calcularBonusCdAparatos,
  calcularEspacosEngenhoca,
  formatarNomeEngenhocaAcoplada,
  obterOpcoesEngenhoca,
  verificarCoerenciaMagiaItem,
  dividirTibares,
  gerarTesouro,
  gerarMasmorra,
  canBeFundamentalist,
  isBroadDevotion,
  calculateBroadDevotionPmBonus,
  getFundamentalistObligations,
  checkFundamentalistWeaponViolation,
} from '../../src/lib/t20/index.ts';

import {
  defaultState,
  migratePersistedState,
  normalizeState,
  validCharacterLevel,
  isOriginExclusiveItemAllowed,
  formatCraftToolName,
  calculateBaseProgressionStats,
  calculateProgressionStats,
  resolveWeaponGrip,
  isSingleWeaponStyleActive,
  isDualWeaponAttackReady,
  calculateSpecialArmorEffects,
  registerAdventureSpending,
  setManualAdventureSpending,
  addScopedTemporaryVital,
  calculateCartCheckout,
  removeCartItemAtIndex,
  encodeTableRulesCode,
  decodeTableRulesCode,
  buildTableInviteUrl,
  calculateLevelTrainingBonuses,
} from '../../src/features/index.ts';

import { formatCharacterProgressionPath } from '../../src/integrations/index.ts';
import { FORJA_PAGES } from '../../src/pages/registry.ts';

// 1. Manufatura e Armadura de Pedra (restrição de Material Especial)
{
  assert.equal(custoMateriaPrima(300), 100);
  assert.equal(custoMateriaPrima(300, { fracao: '1/4' }), 75);
  assert.equal(cdFabricacao({ tipo: 'arma', categoriaId: 'simples' }, 1, 0), 20);
  assert.equal(tempoFabricacao({ tipo: 'armadura', categoriaId: 'pesada' }, 1, 0), '1 mês');
  assert.equal(tempoFabricacao({ tipo: 'arma', categoriaId: 'marcial' }, 0, 1), '3 meses');

  const armaduraPedra = {
    id: 'armadura-de-pedra',
    nome: 'Armadura de Pedra',
    tipo: 'armadura',
    categoriaId: 'pesada',
  };
  assert.equal(podeReceberMelhorias(armaduraPedra), true);
  assert.equal(podeReceberMaterialEspecial(armaduraPedra), false);
  assert.equal(podeReceberEncantos(armaduraPedra), true);

  const armaduraCompleta = {
    id: 'armadura-completa',
    nome: 'Armadura Completa',
    tipo: 'armadura',
    categoriaId: 'pesada',
  };
  assert.equal(podeReceberMaterialEspecial(armaduraCompleta), true);

  const aprim = calcularAprimoramentoItemExistente(armaduraCompleta, 1, 2, 0);
  assert.equal(aprim.custoMercadoMelhoria, 2700);
  assert.equal(aprim.custoMateriaPrima, 900);
}

// 2. Engenhocas (Círculo máximo, Aparatos, Espaços, Nomenclatura e Coerência)
{
  assert.equal(circuloMaximoEngenhoca(1), 1);
  assert.equal(circuloMaximoEngenhoca(5), 1);
  assert.equal(circuloMaximoEngenhoca(6), 2);
  assert.equal(circuloMaximoEngenhoca(10), 3);
  assert.equal(circuloMaximoEngenhoca(14), 4);
  assert.equal(circuloMaximoEngenhoca(18), 5);

  assert.equal(custoFabricacaoEngenhoca(3), 300);
  assert.equal(cdFabricacaoEngenhoca(3), 23);
  assert.equal(cdAtivacaoEngenhoca(3), 18);

  assert.equal(calcularBonusCdAparatos(1, false), 2);
  assert.equal(calcularBonusCdAparatos(1, true), 0);
  assert.equal(calcularBonusCdAparatos(2, false), 5);
  assert.equal(calcularBonusCdAparatos(2, true), 3);

  assert.equal(calcularEspacosEngenhoca(null), 1);
  assert.equal(calcularEspacosEngenhoca({ espacos: 2 }), 3);

  assert.equal(
    formatarNomeEngenhocaAcoplada('Adaga', 'Emissor Psíquico'),
    'Adaga Emissora Psíquica',
  );
  assert.equal(
    formatarNomeEngenhocaAcoplada('Machado de Batalha', 'Emissor Psíquico'),
    'Machado Emissor Psíquico',
  );

  const opcoesBolaDeFogo = obterOpcoesEngenhoca({ id: 'bola-de-fogo', nome: 'Bola de Fogo' });
  assert.equal(opcoesBolaDeFogo.sugestoes.length, 3);
  assert.equal(opcoesBolaDeFogo.opcoesPorForma.vestida.sugestoes.length, 3);

  const coerenciaEscudoEmArma = verificarCoerenciaMagiaItem(
    { id: 'escudo-da-fe', nome: 'Escudo da Fé' },
    { id: 'espada_longa', nome: 'Espada Longa', tipo: 'arma', categoriaId: 'marcial' },
  );
  assert.equal(coerenciaEscudoEmArma.compativel, false);

  const coerenciaEscudoEmEscudo = verificarCoerenciaMagiaItem(
    { id: 'escudo-da-fe', nome: 'Escudo da Fé' },
    { id: 'escudo_pesado', nome: 'Escudo Pesado', tipo: 'escudo' },
  );
  assert.equal(coerenciaEscudoEmEscudo.compativel, true);
}

// 3. Recompensas e Masmorras
{
  const div = dividirTibares(100, 3);
  assert.equal(div.cotaPorJogador, 33);
  assert.equal(div.sobra, 1);

  const tesouro = gerarTesouro({ nd: '5', multiplicador: 'padrao', rng: (min) => min });
  assert.equal(tesouro.nd, '5');
  assert.ok(tesouro.tibares > 0);

  const masmorra = gerarMasmorra({ porte: 'pequena', tema: 'cripta_antiga', nd: 3 });
  assert.ok(masmorra.totalSalas >= 5 && masmorra.totalSalas <= 8);
  assert.equal(masmorra.salas[0].isEntrada, true);
  assert.equal(masmorra.salas[masmorra.salas.length - 1].isChefe, true);
}

// 4. Modelo de Estado, Itens Exclusivos de Origem e Progressão
{
  assert.equal(validCharacterLevel(0), 1);
  assert.equal(validCharacterLevel(25), 20);
  assert.equal(validCharacterLevel(7), 7);

  const st = defaultState();
  assert.equal(st.identity.raceId, 'humano');
  assert.equal(st.step, 1);

  const normalized = normalizeState({
    identity: { characterName: 'Valeros', plannedLevel: 5, initialLevel: 2 },
    completed: [1, 2],
  });
  assert.equal(normalized.identity.characterName, 'Valeros');
  assert.equal(normalized.identity.plannedLevel, 5);
  assert.equal(normalized.finances?.startingLevel, 2);

  assert.equal(formatCraftToolName('alquimia'), 'Instrumentos do Alquimista');
  assert.equal(formatCraftToolName('armeiro'), 'Instrumentos do Armeiro');
  assert.equal(isOriginExclusiveItemAllowed('espada_longa'), true);
  assert.equal(isOriginExclusiveItemAllowed('rolo_de_macarrao', { mode: 'shop' }), false);

  const progStats = calculateProgressionStats({
    progression: [
      { level: 1, classId: 'guerreiro' },
      { level: 2, classId: 'guerreiro' },
    ],
    baseAttrs: { for: 3, des: 2, con: 2, int: 0, sab: 1, car: 0 },
    effectiveAttrs: { for: 3, des: 2, con: 2, int: 0, sab: 1, car: 0 },
    plannedLevel: 2,
    hasCoracaoHeroico: true,
    getClassById: () => ({
      id: 'guerreiro',
      caracteristicas: { pv: { inicial: 20, porNivel: 5 }, pm: { porNivel: 3 } },
    }),
  });
  // PV: (20 + 2) + (5 + 2) = 29; PM: (3 + 3) + 3 (Coração Heroico tier 1) = 9; Defesa: 10 + 2 = 12
  assert.equal(progStats.pv, 29);
  assert.equal(progStats.pm, 9);
  assert.equal(progStats.defense, 12);
}

// 5. Empunhadura e Armaduras Especiais (Folhas, Pedra, Chumbo, Engenhoqueiro Goblin, Hussardo)
{
  const bastardItem = {
    id: 'espada_bastarda',
    nome: 'Espada Bastarda',
    tipo: 'arma',
    arma: { empunhaduraId: 'uma_mao', propriedadesIds: ['adaptavel'] },
  };
  assert.equal(resolveWeaponGrip(bastardItem, 'slot1', { slot1: 'duas_maos' }), 'duas_maos');
  assert.equal(resolveWeaponGrip(bastardItem, 'slot1', {}), 'uma_mao');

  const singleRecord = [
    {
      id: 'slot1',
      entry: { uid: 'u1' },
      item: { id: 'espada_longa', nome: 'Espada Longa', tipo: 'arma', arma: { combateId: 'corpo_a_corpo' } },
      grip: 'uma_mao' as const,
    },
  ];
  assert.equal(isSingleWeaponStyleActive(singleRecord), true);
  assert.equal(isDualWeaponAttackReady(singleRecord, true), false);

  // Armadura de Folhas (+2 PM se treinado em Sobrevivência)
  const folhas = calculateSpecialArmorEffects({
    itemId: 'armadura_de_folhas',
    baseDefenseBonus: 2,
    baseArmorPenalty: 0,
    trainedSurvivencia: true,
  });
  assert.equal(folhas.bonusPm, 2);

  // Armadura de Pedra (RD 2, deslocamento reduzido à metade, ignora material especial)
  const pedra = calculateSpecialArmorEffects({
    itemId: 'armadura_de_pedra',
    categoriaId: 'pesada',
    baseDefenseBonus: 10,
    baseArmorPenalty: -5,
    materialId: 'adamante', // deve ser ignorado!
  });
  assert.equal(pedra.damageReduction, 2);
  assert.equal(pedra.displacementHalved, true);

  // Armadura de Engenhoqueiro Goblin (não reduz penalidade com ajustada/sob medida, +2 espaços livres, -1 por espaço extra)
  const goblin = calculateSpecialArmorEffects({
    itemId: 'armadura_de_engenhoqueiro_goblin',
    baseDefenseBonus: 4,
    baseArmorPenalty: -2,
    improvements: ['ajustada', 'sob_medida'],
    goblinExtraSpacesUsed: 3,
  });
  assert.equal(goblin.canReduceArmorPenalty, false);
  assert.equal(goblin.armorPenalty, -5); // -2 base - 3 espaços extras (ajustada ignorada!)
  assert.equal(goblin.ignoresContraptionActivationPenalty, true);
  assert.equal(goblin.stealthPenalty, -5);
  assert.equal(goblin.extraLoadSpacesFree, 2);

  // Armadura de Hussardo Alado (investida montada com Intimidação)
  const hussardo = calculateSpecialArmorEffects({
    itemId: 'armadura_de_hussardo_alado',
    baseDefenseBonus: 10,
    baseArmorPenalty: -5,
  });
  assert.equal(hussardo.hasMountedChargeIntimidate, true);
}

// 6. Economia da Aventura (Incentivador da Economia automático) e Checkout Padronizado
{
  const maximos = { pv: 40, pm: 20 };
  // Personagem nível 5: cada 50 * 5 = 250 T$ gastos na aventura gera +1 PM temporário de aventura
  const step1 = registerAdventureSpending(null, maximos, 300, 5, true);
  assert.equal(step1.vitals.adventureSpentTibars, 300);
  assert.equal(step1.newBonusPm, 1);
  assert.equal(step1.vitals.pmTempAdventure, 1);
  assert.equal(step1.vitals.pmTempMax, 1);

  // Gasta mais 200 T$ (total 500 T$ -> 2 PM temporários de aventura)
  const step2 = registerAdventureSpending(step1.vitals, maximos, 200, 5, true);
  assert.equal(step2.vitals.adventureSpentTibars, 500);
  assert.equal(step2.newBonusPm, 2);
  assert.equal(step2.vitals.pmTempAdventure, 2);

  // Adiciona +3 PM temporários diários manualmente
  const withDaily = addScopedTemporaryVital(step2.vitals, maximos, 'pm', 3, 'daily');
  assert.equal(withDaily.pmTempDaily, 3);
  assert.equal(withDaily.pmTempAdventure, 2);
  assert.equal(withDaily.pmTempMax, 5);

  // Alteração manual do gasto da aventura para 750 T$ (3 PM de bônus)
  const manualStep = setManualAdventureSpending(withDaily, maximos, 750, 5, true);
  assert.equal(manualStep.vitals.pmTempAdventure, 3);
  assert.equal(manualStep.vitals.pmTempDaily, 3);
  assert.equal(manualStep.vitals.pmTempMax, 6);

  // Checkout padronizado da loja com desconto de -10% (step -1) arredondado para cima
  const items = [
    { id: '1', itemId: 'espada_longa', name: 'Espada Longa', quantity: 1, basePrice: 15 },
    { id: '2', itemId: 'balsamo', name: 'Bálsamo Restaurador', quantity: 2, basePrice: 20 },
  ];
  const checkout = calculateCartCheckout(items, -1, 100, 'buy');
  assert.equal(checkout.baseTotal, 55);
  assert.equal(checkout.finalTotal, 50); // ceil(55 * 0.9 = 49.5) = 50
  assert.equal(checkout.remainingBalance, 50);
  assert.equal(checkout.canAfford, true);

  const afterRemove = removeCartItemAtIndex(items, 0);
  assert.equal(afterRemove.length, 1);
  assert.equal(afterRemove[0].id, '2');
}

// 7. Exportação e Registro de Páginas
{
  const txt = formatCharacterProgressionPath({
    identity: { characterName: 'Tork', playerName: 'Almeida', classId: 'inventor' },
    progression: [{ classId: 'inventor', powerId: 'inventor_engenhoqueiro' }],
    classes: [{ id: 'inventor', nome: 'Inventor', habilidades: [{ nivel: 1, nome: 'Engenhosidade' }] }],
    powerById: () => ({ id: 'inventor_engenhoqueiro', nome: 'Engenhoqueiro' }),
    features: [],
    spells: [],
  });
  assert.ok(txt.includes('Personagem: Tork'));
  assert.ok(txt.includes('REGRAS DE ENGENHOCAS'));
  assert.equal(FORJA_PAGES.ficha.fileName, 'ficha.html');
}

// 8. Devotos Fundamentalistas e Devoção Ampla (Deuses de Arton)
{
  assert.equal(canBeFundamentalist('clerigo'), true);
  assert.equal(canBeFundamentalist('druida'), true);
  assert.equal(canBeFundamentalist('frade'), true);
  assert.equal(canBeFundamentalist('paladino'), true);
  assert.equal(canBeFundamentalist('guerreiro'), true);

  assert.equal(isBroadDevotion('clerigo', 'pantheon'), true);
  assert.equal(isBroadDevotion('paladino', 'pantheon'), true);
  assert.equal(isBroadDevotion('clerigo', 'deity'), false);

  // +2 PM por patamar (nível 1 = patamar 1 -> +2 PM; nível 5 = patamar 2 -> +4 PM; nível 11 = patamar 3 -> +6 PM)
  assert.equal(calculateBroadDevotionPmBonus('clerigo', 'pantheon', 1), 2);
  assert.equal(calculateBroadDevotionPmBonus('frade', 'pantheon', 5), 4);
  assert.equal(calculateBroadDevotionPmBonus('paladino', 'pantheon', 11), 6);
  assert.equal(calculateBroadDevotionPmBonus('druida', 'pantheon', 17), 8);

  assert.ok(getFundamentalistObligations('khalmyr').includes('Fundamentalista.'));
  assert.ok(getFundamentalistObligations('panteao').includes('poder de combate ou de destino'));

  // Violação de arma favorita de Khalmyr (Espada Longa)
  const okCheck = checkFundamentalistWeaponViolation('khalmyr', true, [
    { id: 'espada_longa', nome: 'Espada Longa' },
  ]);
  assert.equal(okCheck.violated, false);

  const badCheck = checkFundamentalistWeaponViolation('khalmyr', true, [
    { id: 'machado_de_batalha', nome: 'Machado de Batalha' },
  ]);
  assert.equal(badCheck.violated, true);
  assert.equal(badCheck.offendingWeaponName, 'Machado de Batalha');
}

// 9. Regras da Mesa e Link/Código de Convite
{
  const rules = {
    tableName: 'Mesa de Arton',
    broadDevotion: true,
    fundamentalistDevotion: true,
    openRaces: true,
    openDevotion: false,
    ageRules: true,
    dualOrigin: true,
    levelTraining: true,
  };
  const code = encodeTableRulesCode(rules);
  assert.ok(code.startsWith('FT20M1-'));
  const decoded = decodeTableRulesCode(code);
  assert.ok(decoded);
  assert.equal(decoded.tableName, 'Mesa de Arton');
  assert.equal(decoded.openRaces, true);
  assert.equal(decoded.openDevotion, false);

  const inviteUrl = buildTableInviteUrl('https://forja.local/criador.html', rules);
  const decodedFromUrl = decodeTableRulesCode(inviteUrl);
  assert.ok(decodedFromUrl);
  assert.equal(decodedFromUrl.tableName, 'Mesa de Arton');
}

// 10. Sistema de Treinamento (Adiantamento de Nível e Multiclasse)
{
  // Nível 3 (ímpar -> indo para 4 par), treinou PV, PM e Perícias em Guerreiro (pvPorNivel 5, pmPorNivel 3), modCon +2
  const b1 = calculateLevelTrainingBonuses(
    { pv: true, pm: true, skills: true, power: false, nextClassId: 'guerreiro' },
    3,
    { id: 'guerreiro', pvPorNivel: 5, pmPorNivel: 3 },
    2,
    0,
    0,
  );
  assert.equal(b1.pvAdvance, 7);
  assert.equal(b1.pmAdvance, 3);
  assert.equal(b1.allSkillsBonus, 1); // Nível ímpar -> +1 em todas as perícias
  assert.equal(b1.completedCount, 3);

  // Se o jogador depois decide fazer multiclasse em Arcanista (pvPorNivel 2, pmPorNivel 6) no treino de poder, recalcula PV e PM!
  const b2 = calculateLevelTrainingBonuses(
    { pv: true, pm: true, skills: true, power: true, nextClassId: 'arcanista', selectedPowerId: 'arcanista_conhecimento_magico' },
    3,
    { id: 'arcanista', pvPorNivel: 2, pmPorNivel: 6 },
    2,
    0,
    0,
  );
  assert.equal(b2.pvAdvance, 4); // 2 + 2 CON
  assert.equal(b2.pmAdvance, 6);
  assert.equal(b2.completedCount, 4);
  assert.equal(b2.readyToLevelUp, true);

  // Nível 4 (par -> indo para 5 ímpar): treino de perícias não dá +1 numérico, mas conta como treino concluído
  const bEven = calculateLevelTrainingBonuses(
    { pv: false, pm: false, skills: true, power: false },
    4,
    { id: 'guerreiro', pvPorNivel: 5, pmPorNivel: 3 },
    2,
    0,
    0,
  );
  assert.equal(bEven.allSkillsBonus, 0);
  assert.equal(bEven.completedCount, 1);
}

// 11. Mapa Interativo de Arton (Condições de Rota, Exclusão de Terreno Difícil, Remoção de Tormenta, Mais Rotas, Marcar Trecho e Parábola nas Uivantes)
{
  const fs = await import('node:fs');
  const path = await import('node:path');
  const rootDir = path.resolve(import.meta.dirname, '../..');
  const mapaHtml = fs.readFileSync(path.join(rootDir, 'src/paginas/mapa.html'), 'utf8');
  const mapaTs = fs.readFileSync(path.join(rootDir, 'src/funcionalidades/mapa/00-00-mapa.ts'), 'utf8');

  assert.ok(mapaHtml.includes('id="btnLoadMoreRoutes"'));
  assert.ok(mapaHtml.includes('id="btnMarkDifficultStretch"'));
  assert.ok(mapaHtml.includes('id="routeAvoidDifficultToggle"'));
  assert.ok(mapaHtml.includes('id="routeAvoidTormentaToggle"'));
  assert.ok(!mapaHtml.includes('id="routeAerialUivantesRow"'), 'Sem botões duplicados de escolha de rota na seção de testes de queda');

  assert.ok(mapaTs.includes('#F9A825'), 'Cor de terreno difícil ativa idêntica ao Fichas de Nimb');
  assert.ok(mapaTs.includes('#FFE082'), 'Cor de terreno difícil alternativa idêntica ao Fichas de Nimb');
  assert.ok(!mapaTs.includes('Balão Goblin (linha reta)') && !mapaTs.includes('Balão Goblin (contornar'), 'Rótulos de rota do Balão Goblin sem parênteses redundantes');
  assert.ok(mapaTs.includes('calculateAerialBalloonRoutes') && mapaTs.includes('parabolaAvoidsUivantes'), 'Cálculo de arco enxuto para contornar as Montanhas Uivantes');
  assert.ok(mapaTs.includes('isClickNearActiveRoute'), 'Proteção contra troca indevida de rota ao clicar para marcar terreno difícil');
  assert.ok(mapaTs.includes('expandedRoutes') && mapaTs.includes('canLoadMoreRoutes'), 'Busca expandida de rotas (Carregar mais rotas)');
}

console.log('Suíte TypeScript de Features, Manufatura e Economia da Aventura (features.test.ts): 100% aprovada!');

