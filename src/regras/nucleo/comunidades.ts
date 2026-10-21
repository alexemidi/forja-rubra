// @ts-check
/**
 * FORJA RUBRA — Módulo de Regras Puras de Comunidades (Tormenta20 / Ameaças de Arton)
 * 
 * Modela os cinco tipos canônicos de comunidades de Arton:
 * 1. Aldeia (Grid 1x1) - Até 1.000 hab.
 * 2. Vila (Grid 2x2) - Até 5.000 hab.
 * 3. Cidade Média (Grid 3x3) - Até 15.000 hab.
 * 4. Cidade Grande (Grid 4x4) - Até 25.000 hab.
 * 5. Metrópole (Grid 5x5) - 100.000 a 1.000.000 hab.
 * 
 * Contém o catálogo canônico de 40 quadros modulares com conectores de estradas nas 4 bordas (N, L, S, O)
 * e o algoritmo procedural de composição coerente de malha urbana.
 */

/**
 * @typedef {'norte' | 'leste' | 'sul' | 'oeste'} PontoCardeal
 * @typedef {'aberta' | 'secundaria' | 'fechada' | 'muralha' | 'rio'} ConectorBorda
 * 
 * @typedef {Object} PontoDeInteresse
 * @property {string} id
 * @property {string} nome
 * @property {string} tipo
 * @property {string} descricao
 * @property {string} [npc]
 * @property {string} [gancho]
 * 
 * @typedef {Object} QuadroModular
 * @property {string} id
 * @property {string} nome
 * @property {string} categoria
 * @property {Object} conectores
 * @property {ConectorBorda} conectores.norte
 * @property {ConectorBorda} conectores.leste
 * @property {ConectorBorda} conectores.sul
 * @property {ConectorBorda} conectores.oeste
 * @property {PontoDeInteresse[]} pontosDeInteresse
 * @property {string} [descricaoVisual]
 */

const RegrasComunidades = (() => {
  'use strict';

  /**
   * Catálogo de 40 Quadros Modulares Conectáveis
   * Cada quadro possui conectores cardeais para encaixe procedural sem quebra de vias.
   * @type {QuadroModular[]}
   */
  const QUADROS_MODULARES = [
    // 1-5: Centros Cívicos e Praças
    {
      id: 'tile_praca_central',
      nome: 'Praça Central e Obelisco',
      categoria: 'civico',
      conectores: { norte: 'aberta', leste: 'aberta', sul: 'aberta', oeste: 'aberta' },
      pontosDeInteresse: [
        { id: 'obelisco', nome: 'Monumento aos Heróis de Arton', tipo: 'monumento', descricao: 'Estátua de mármore e bronze comemorando antigas batalhas contra a Tormenta.', npc: 'Bardo menestrel cantando baladas', gancho: 'Uma mensagem cifrada foi talhada na base da estátua esta madrugada.' },
        { id: 'bancas_mercado', nome: 'Feira Livre dos Camponeses', tipo: 'comercio', descricao: 'Tendas de tecidos coloridos vendendo frutas, temperos e bugigangas.', npc: 'Dona Marta, feirante fofoqueira', gancho: 'Moedas de ouro falsas estão circulando entre os mercadores.' }
      ],
      descricaoVisual: 'Cruzamento com largo pavimentado e fonte central'
    },
    {
      id: 'tile_prefeitura_magistrado',
      nome: 'Prefeitura e Sala do Conselho',
      categoria: 'civico',
      conectores: { norte: 'fechada', leste: 'aberta', sul: 'aberta', oeste: 'aberta' },
      pontosDeInteresse: [
        { id: 'gabinete_prefeito', nome: 'Gabinete do Lorde Prefeito', tipo: 'governo', descricao: 'Edifício com colunas de granito e bandeiras do reino.', npc: 'Conselheiro Valério', gancho: 'O prefeito recebeu uma carta de chantagem com o selo da Guilda dos Ladrões.' }
      ],
      descricaoVisual: 'Edifício público pomposo com pátio calçado'
    },
    {
      id: 'tile_tribunal_justica',
      nome: 'Tribunal da Lei e Pelourinho',
      categoria: 'civico',
      conectores: { norte: 'aberta', leste: 'fechada', sul: 'aberta', oeste: 'aberta' },
      pontosDeInteresse: [
        { id: 'tribunal', nome: 'Casa da Justiça de Khalmyr', tipo: 'governo', descricao: 'Tribunal austero com a balança sagrada na fachada.', npc: 'Magistrado Severo', gancho: 'Um prisioneiro afirma ser inocente e roga por um campeão num julgamento por combate.' }
      ],
      descricaoVisual: 'Tribunal de pedra com praça de execuções e celas no subsolo'
    },
    {
      id: 'tile_mercado_coberto',
      nome: 'Bazar dos Mercadores e Câmbio',
      categoria: 'comercio',
      conectores: { norte: 'aberta', leste: 'aberta', sul: 'aberta', oeste: 'aberta' },
      pontosDeInteresse: [
        { id: 'casa_cambio', nome: 'Casa de Moeda e Câmbio de Tibares', tipo: 'comercio', descricao: 'Guichês reforçados com anões guardando cofres de ferro.', npc: 'Barin Martelo-de-Prata', gancho: 'Um carregamento de gemas de Doherimm não chegou no prazo.' }
      ],
      descricaoVisual: 'Galpão de arcos de pedra com dezenas de lojas e cambistas'
    },
    {
      id: 'tile_praca_artesaos',
      nome: 'Pátio dos Mercadores Ambulantes',
      categoria: 'comercio',
      conectores: { norte: 'secundaria', leste: 'aberta', sul: 'secundaria', oeste: 'aberta' },
      pontosDeInteresse: [
        { id: 'caravanas', nome: 'Pátio de Estacionamento de Carroças', tipo: 'transporte', descricao: 'Mulas e carroças vindas de outras províncias descarregando fardos.', npc: 'Mestre da Caravana Jamil', gancho: 'Uma criatura estranha foi trazida enjaulada do Deserto da Perdição.' }
      ],
      descricaoVisual: 'Pátio de cascalho com baias de carga'
    },

    // 6-12: Oficinas, Guildas e Serviços
    {
      id: 'tile_ferraria_forja',
      nome: 'Grande Forja e Armaria',
      categoria: 'artesanato',
      conectores: { norte: 'secundaria', leste: 'aberta', sul: 'fechada', oeste: 'aberta' },
      pontosDeInteresse: [
        { id: 'forja_rubra_local', nome: 'Ferraria Brasas Eternas', tipo: 'oficina', descricao: 'Fornos incandescentes, bigornas pesadas e martelos incansáveis.', npc: 'Ferreiro Thorgar', gancho: 'Ele precisa de um pedaço de aço-rubi para forjar a espada encomendada por um paladino.' }
      ],
      descricaoVisual: 'Chaminés fumegantes e cheiro característico de carvão e metal fundido'
    },
    {
      id: 'tile_carpintaria_artesanato',
      nome: 'Serraria e Oficina de Carpintaria',
      categoria: 'artesanato',
      conectores: { norte: 'aberta', leste: 'secundaria', sul: 'secundaria', oeste: 'fechada' },
      pontosDeInteresse: [
        { id: 'marcenaria', nome: 'Carpintaria Carvalho Real', tipo: 'oficina', descricao: 'Pilhas de tábuas de madeira de Tollon e ferramentas entalhadoras.', npc: 'Mestre carpinteiro Edgar', gancho: 'Uma encomenda de madeira veio amaldiçoada da floresta.' }
      ],
      descricaoVisual: 'Depósito de madeira aberto com cobertura de telhas'
    },
    {
      id: 'tile_alquimia_laboratorio',
      nome: 'Beco do Alquimista e Boticário',
      categoria: 'artesanato',
      conectores: { norte: 'fechada', leste: 'secundaria', sul: 'aberta', oeste: 'secundaria' },
      pontosDeInteresse: [
        { id: 'botica', nome: 'Frasco de Fogo - Alquimia e Poções', tipo: 'alquimia', descricao: 'Vidros borbulhantes, alambiques de cobre e vapores coloridos.', npc: 'Alquimista Kliren Fizzt', gancho: 'Uma reação química acidental atraiu miasmas do subterrâneo.' }
      ],
      descricaoVisual: 'Casa com janelas de vidro grosso e fumaça arroxeada saindo do duto'
    },
    {
      id: 'tile_engenharia_oficina',
      nome: 'Laboratório de Engenhocas e Autômatos',
      categoria: 'artesanato',
      conectores: { norte: 'secundaria', leste: 'fechada', sul: 'secundaria', oeste: 'aberta' },
      pontosDeInteresse: [
        { id: 'engenhocas_loja', nome: 'Oficina Roda-Dentada de Trobos', tipo: 'engenhoca', descricao: 'Peças de relógio gigantes, engrenagens e pistões a vapor.', npc: 'Engenhoqueiro Varis', gancho: 'Um protótipo de golem escapou pelas vielas vizinhas.' }
      ],
      descricaoVisual: 'Oficina com barulho de engrenagens e faíscas elétricas'
    },
    {
      id: 'tile_alfaiataria_couraria',
      nome: 'Ateliê do Alfaiate e Curtume',
      categoria: 'artesanato',
      conectores: { norte: 'aberta', leste: 'secundaria', sul: 'fechada', oeste: 'secundaria' },
      pontosDeInteresse: [
        { id: 'alfaiate', nome: 'Tecelagem Fio de Seda', tipo: 'oficina', descricao: 'Tecidos nobres, mantos resistentes e armaduras acolchoadas.', npc: 'Costureira Madame Yvone', gancho: 'Couros raros de monstro foram roubados da despensa.' }
      ],
      descricaoVisual: 'Varal com tecidos tingidos e manequins de madeira na vitrine'
    },
    {
      id: 'tile_tatuador_mistico',
      nome: 'Salão de Tatuagens Místicas e Encantos',
      categoria: 'magia',
      conectores: { norte: 'secundaria', leste: 'fechada', sul: 'aberta', oeste: 'fechada' },
      pontosDeInteresse: [
        { id: 'estudio_tatuagem', nome: 'Tinta & Mana - Tatuagens Arcanas', tipo: 'magia', descricao: 'Agulhas de prata, tintas fosforescentes e runas místicas nas paredes.', npc: 'Mestre tatuador Qareen Zephyr', gancho: 'Uma das tintas reagiu com um conjurador e abriu um portal menor.' }
      ],
      descricaoVisual: 'Entrada escura iluminada por lanternas mágicas azuladas'
    },
    {
      id: 'tile_guilda_mercenarios',
      nome: 'Quartel da Guilda dos Mercenários',
      categoria: 'militar',
      conectores: { norte: 'aberta', leste: 'aberta', sul: 'secundaria', oeste: 'fechada' },
      pontosDeInteresse: [
        { id: 'balcao_contratos', nome: 'Mural de Recompensas e Contratos', tipo: 'guilda', descricao: 'Cartazes de procurado, contratos de escolta e recompensas por monstros.', npc: 'Capitão da Guilda Brannigan', gancho: 'Um contrato de alto ND paga 5.000 T$ para quem investigar uma masmorra próxima.' }
      ],
      descricaoVisual: 'Fortaleza com pátio de treinamento de espadas e arqueiros'
    },

    // 13-18: Tavernas, Estalagens e Entretenimento
    {
      id: 'tile_taverna_javali',
      nome: 'Taverna do Javali Saltitante',
      categoria: 'taverna',
      conectores: { norte: 'aberta', leste: 'secundaria', sul: 'aberta', oeste: 'secundaria' },
      pontosDeInteresse: [
        { id: 'salao_taverna', nome: 'Salão Principal da Taverna', tipo: 'taverna', descricao: 'Lareira aconchegante, canecas de cerveja anã e cheiro de assado.', npc: 'Taverneiro Barnabé', gancho: 'Um viajante encapuzado procura aventureiros discretos.' },
        { id: 'quartos_estalagem', nome: 'Aposentos do Andar Superior', tipo: 'estadia', descricao: 'Quartos limpos com camas de palha e banhos quentes.', npc: 'Camareira Liana', gancho: 'Gritos abafados foram ouvidos no quarto número 7.' }
      ],
      descricaoVisual: 'Sobrado de madeira escura com brasão de ferro com javali pintado'
    },
    {
      id: 'tile_estalagem_luxo',
      nome: 'Hospedaria Dragão Dourado',
      categoria: 'taverna',
      conectores: { norte: 'aberta', leste: 'aberta', sul: 'fechada', oeste: 'aberta' },
      pontosDeInteresse: [
        { id: 'salao_nobre', nome: 'Restaurante Fino e Salão de Banquetes', tipo: 'taverna', descricao: 'Vinhos de Deheon, música de harpa e comida servida em prataria.', npc: 'Maitre Claude', gancho: 'Um veneno mortal foi encontrado na taça do embaixador.' }
      ],
      descricaoVisual: 'Edifício de cantaria com janelas envidraçadas e cocheira anexa'
    },
    {
      id: 'tile_casa_jogos',
      nome: 'Antro dos Dados de Nimb',
      categoria: 'entretenimento',
      conectores: { norte: 'secundaria', leste: 'fechada', sul: 'secundaria', oeste: 'aberta' },
      pontosDeInteresse: [
        { id: 'mesas_jogo', nome: 'Salão de Jogatina e Apostas', tipo: 'jogos', descricao: 'Roletas, mesas de dados e apostas altas sob a bênção do Deus do Caos.', npc: 'Crupiê sorridente Nimbita', gancho: 'Um jogador apostou uma chave que diz abrir uma tumba lendária.' }
      ],
      descricaoVisual: 'Fachada discreta com símbolos dos dados de seis faces entalhados'
    },
    {
      id: 'tile_teatro_arena',
      nome: 'Teatro de Valkaria e Arena de Lutas',
      categoria: 'entretenimento',
      conectores: { norte: 'aberta', leste: 'fechada', sul: 'aberta', oeste: 'fechada' },
      pontosDeInteresse: [
        { id: 'palco_arena', nome: 'Fosso de Lutas e Palco de Ópera', tipo: 'arena', descricao: 'Arquibancadas de madeira ao redor de uma arena circular de areia.', npc: 'Mestre de cerimônias Rodolfo', gancho: 'O campeão atual da arena foi hipnotizado por um feiticeiro.' }
      ],
      descricaoVisual: 'Construção semicircular de pedra com arquibancadas elevadas'
    },
    {
      id: 'tile_casa_banhos',
      nome: 'Termas e Casa de Banhos Quentes',
      categoria: 'servico',
      conectores: { norte: 'fechada', leste: 'aberta', sul: 'secundaria', oeste: 'aberta' },
      pontosDeInteresse: [
        { id: 'termas_piscina', nome: 'Piscinas Termais Sulfurosas', tipo: 'banhos', descricao: 'Vapor quente, massagens com óleos perfumados e relaxamento total.', npc: 'Massagista Yulia', gancho: 'Segredos de Estado são cochichados enquanto os nobres relaxam na água.' }
      ],
      descricaoVisual: 'Construção com cúpula de azulejos e canos de vapor quente'
    },
    {
      id: 'tile_estabulos_correios',
      nome: 'Estábulo Central e Pouso de Hipogrifos',
      categoria: 'transporte',
      conectores: { norte: 'aberta', leste: 'secundaria', sul: 'aberta', oeste: 'fechada' },
      pontosDeInteresse: [
        { id: 'cavalaria', nome: 'Cocheiras do Correio Imperial', tipo: 'transporte', descricao: 'Baias com cavalos de guerra, trobos e mensageiros descansando.', npc: 'Mestre dos estábulos Otávio', gancho: 'Um cavalo imperial chegou sozinho, ensanguentado e com ordens secretas na sela.' }
      ],
      descricaoVisual: 'Galpões compridos de madeira com cercados e bebedouros'
    },

    // 19-24: Templos e Lugares Sagrados
    {
      id: 'tile_templo_khalmyr',
      nome: 'Catedral da Justiça (Khalmyr)',
      categoria: 'religioso',
      conectores: { norte: 'fechada', leste: 'aberta', sul: 'aberta', oeste: 'aberta' },
      pontosDeInteresse: [
        { id: 'altar_khalmyr', nome: 'Altar da Espada e da Balança', tipo: 'templo', descricao: 'Naves imponentes, vitrais azuis e clérigos vestidos de branco e azul.', npc: 'Sumo-Sacerdote Marcus', gancho: 'O clérigo oferece cura gratuita se o grupo resgatar relíquias roubadas da cripta.' }
      ],
      descricaoVisual: 'Catedral majestosa de mármore branco com torres gêmeas'
    },
    {
      id: 'tile_templo_lena_marah',
      nome: 'Santuário da Cura e da Paz (Lena & Marah)',
      categoria: 'religioso',
      conectores: { norte: 'secundaria', leste: 'secundaria', sul: 'aberta', oeste: 'fechada' },
      pontosDeInteresse: [
        { id: 'enfermaria_sagrada', nome: 'Casa das Irmãs da Misericórdia', tipo: 'hospital', descricao: 'Leitos organizados, cheiro de ervas medicinais e infusões curativas.', npc: 'Madre Heloísa', gancho: 'Uma peste desconhecida está infectando refugiados dos ermos.' }
      ],
      descricaoVisual: 'Jardim de rosas e fontes de água benta cercados por claustro silencioso'
    },
    {
      id: 'tile_templo_wynna',
      nome: 'Torre da Magia e Altar de Wynna',
      categoria: 'magia',
      conectores: { norte: 'aberta', leste: 'fechada', sul: 'secundaria', oeste: 'aberta' },
      pontosDeInteresse: [
        { id: 'observatorio_arcano', nome: 'Grimório Aberto de Wynna', tipo: 'templo', descricao: 'Torre espiralada que desafia a gravidade, iluminada por runas dançantes.', npc: 'Mago celestial Artonis', gancho: 'Uma fissura na trama mágica está drenando PM dos conjuradores locais.' }
      ],
      descricaoVisual: 'Torre mística com cristais flutuantes na ponta'
    },
    {
      id: 'tile_templo_valkaria',
      nome: 'Capela da Ambição (Valkaria)',
      categoria: 'religioso',
      conectores: { norte: 'aberta', leste: 'aberta', sul: 'aberta', oeste: 'fechada' },
      pontosDeInteresse: [
        { id: 'altar_viajante', nome: 'Altar das Asas Livres', tipo: 'templo', descricao: 'Fogueira acesa constantemente onde aventureiros depositam moedas antes de partir.', npc: 'Sacerdotisa aventureira Karina', gancho: 'Ela abençoa grupos que partem para masmorras inexploradas.' }
      ],
      descricaoVisual: 'Templo aberto com estátua de Valkaria com as mãos voltadas para a estrada'
    },
    {
      id: 'tile_templo_obscuro_tenebra',
      nome: 'Cripta Subterrânea da Deusa da Noite (Tenebra)',
      categoria: 'religioso',
      conectores: { norte: 'fechada', leste: 'secundaria', sul: 'fechada', oeste: 'secundaria' },
      pontosDeInteresse: [
        { id: 'altar_noturno', nome: 'Santuário das Sombras', tipo: 'templo', descricao: 'Velas de sebo negro, silêncio absoluto e mortos que repousam em paz.', npc: 'Irmão das Trevas Malakor', gancho: 'Necromantes rebeldes violaram um sarcófago sagrado.' }
      ],
      descricaoVisual: 'Entrada esculpida na rocha sob arcadas escuras'
    },
    {
      id: 'tile_cemiterio_jardim_mortos',
      nome: 'Cemitério de Arton e Jazigos Familiares',
      categoria: 'religioso',
      conectores: { norte: 'fechada', leste: 'fechada', sul: 'aberta', oeste: 'secundaria' },
      pontosDeInteresse: [
        { id: 'mausoleu', nome: 'Mausoléu dos Fundadores', tipo: 'cemiterio', descricao: 'Túmulos de pedra cinzenta com flores murchas e portões de ferro batido.', npc: 'Coveiro Simão', gancho: 'Luzes azuladas foram vistas dançando sobre as sepulturas à meia-noite.' }
      ],
      descricaoVisual: 'Colina cercada por muros baixos com lápides cobertas de musgo'
    },

    // 25-30: Segurança, Defesa e Muralhas
    {
      id: 'tile_portao_principal_sul',
      nome: 'Portão Fortificado da Cidade (Sul)',
      categoria: 'militar',
      conectores: { norte: 'aberta', leste: 'muralha', sul: 'aberta', oeste: 'muralha' },
      pontosDeInteresse: [
        { id: 'guarita_pedagio', nome: 'Guarita de Inspeção e Pedágio', tipo: 'guarda', descricao: 'Grade levadiça reforçada com virotes e fendas de flecheiro.', npc: 'Sargento da Guarda Boris', gancho: 'A guarda procura contrabandistas com um amuleto que impede detecção mágica.' }
      ],
      descricaoVisual: 'Torres gêmeas de vigia com portão levadiço de madeira e ferro'
    },
    {
      id: 'tile_portao_secundario_norte',
      nome: 'Portão da Fortaleza (Norte)',
      categoria: 'militar',
      conectores: { norte: 'aberta', leste: 'muralha', sul: 'aberta', oeste: 'muralha' },
      pontosDeInteresse: [
        { id: 'posto_vigia', nome: 'Posto de Vigia Avançado', tipo: 'guarda', descricao: 'Plataforma alta vigiando os ermos ao norte contra hordas e monstros.', npc: 'Vigia Elfo Alasse', gancho: 'Ele avistou fumaça de acampamento hobgoblin a duas léguas.' }
      ],
      descricaoVisual: 'Muralha alta de pedra talhada com seteiras e balistas'
    },
    {
      id: 'tile_quartel_armaria',
      nome: 'Quartel da Guarda e Masmorra dos Presos',
      categoria: 'militar',
      conectores: { norte: 'fechada', leste: 'aberta', sul: 'aberta', oeste: 'fechada' },
      pontosDeInteresse: [
        { id: 'celas_guardas', nome: 'Celas de Contenção de Prisioneiros', tipo: 'cadeia', descricao: 'Grades de ferro reforçado com correntes antimagia.', npc: 'Carcereiro Chefe Tobias', gancho: 'Um prisioneiro conspirador promete revelar a localização de um tesouro em troca de fuga.' }
      ],
      descricaoVisual: 'Fortim quadrado com pátio interno cercado por estacas de ferro'
    },
    {
      id: 'tile_trecho_muralha_leste',
      nome: 'Paredão Defensivo e Baluartes (Leste)',
      categoria: 'muralha',
      conectores: { norte: 'muralha', leste: 'fechada', sul: 'muralha', oeste: 'aberta' },
      pontosDeInteresse: [
        { id: 'baluarte_leste', nome: 'Torreão de Artilharia com Catapulta', tipo: 'militar', descricao: 'Arma de cerco apontada para o vale exterior.', npc: 'Engenheiro de Cerco Dwalin', gancho: 'O mecanismo da catapulta foi sabotado com ácido.' }
      ],
      descricaoVisual: 'Muro largo de 4 metros de espessura com adarve de patrulha'
    },
    {
      id: 'tile_trecho_muralha_oeste',
      nome: 'Paredão Defensivo com Troneira (Oeste)',
      categoria: 'militar',
      conectores: { norte: 'muralha', leste: 'aberta', sul: 'muralha', oeste: 'fechada' },
      pontosDeInteresse: [
        { id: 'baluarte_oeste', nome: 'Posto de Sentinela dos Arqueiros', tipo: 'militar', descricao: 'Pilhas de flechas e caldeirões de piche fervente prontos para defesa.', npc: 'Cabo da guarda Janete', gancho: 'Uma passagem secreta foi descoberta sob a base da muralha.' }
      ],
      descricaoVisual: 'Muro alto coroado com ameias e bandeiras da cidade'
    },
    {
      id: 'tile_canto_muralha_noroeste',
      nome: 'Bastião Angular da Fortaleza (Noroeste)',
      categoria: 'muralha',
      conectores: { norte: 'fechada', leste: 'muralha', sul: 'muralha', oeste: 'fechada' },
      pontosDeInteresse: [
        { id: 'bastiao_angulo', nome: 'Torre Angular do Vigia Noturno', tipo: 'militar', descricao: 'Ponto cego da patrulha onde contrabandistas costumam atirar cordas.', npc: 'Sentinela cansado', gancho: 'Um pacote caiu da muralha contendo um mapa de esgotos.' }
      ],
      descricaoVisual: 'Torre redonda de canto com fosso seco do lado de fora'
    },

    // 31-36: Habitações, Bairros e Mansões
    {
      id: 'tile_bairro_nobre_mansao',
      nome: 'Mansão Feudal e Jardim Particular',
      categoria: 'residencial',
      conectores: { norte: 'fechada', leste: 'aberta', sul: 'secundaria', oeste: 'aberta' },
      pontosDeInteresse: [
        { id: 'mansao_conde', nome: 'Residência do Conde de Ahlen', tipo: 'mansao', descricao: 'Muros altos com grades pontiagudas, cães de guarda e carruagens elegantes.', npc: 'Conde Rodolfo', gancho: 'O conde busca mercenários de confiança para escoltar sua filha.' }
      ],
      descricaoVisual: 'Mansão de três andares com jardim decorativo e chafariz particular'
    },
    {
      id: 'tile_vilarejo_casas_plebeus',
      nome: 'Quarteirão Residencial dos Plebeus',
      categoria: 'residencial',
      conectores: { norte: 'secundaria', leste: 'aberta', sul: 'aberta', oeste: 'secundaria' },
      pontosDeInteresse: [
        { id: 'casas_populares', nome: 'Cortiço dos Trabalhadores', tipo: 'moradia', descricao: 'Casas geminadas com roupas estendidas, crianças brincando e fumaça de lenha.', npc: 'Líder dos moradores Tiago', gancho: 'Ratos gigantes estão subindo pelos ralos das casas durante a noite.' }
      ],
      descricaoVisual: 'Casas de adobe e madeira com telhados de palha e barro'
    },
    {
      id: 'tile_becos_escuros_ladroes',
      nome: 'Beco dos Ratos e Gueto Sombrio',
      categoria: 'perigo',
      conectores: { norte: 'secundaria', leste: 'secundaria', sul: 'fechada', oeste: 'secundaria' },
      pontosDeInteresse: [
        { id: 'esconderijo_ladroes', nome: 'Covil da Guilda dos Ladrões', tipo: 'submundo', descricao: 'Alçapão escondido atrás de barris vazios conduzindo ao submundo.', npc: 'Olho-de-Vidro, receptador clandestino', gancho: 'Ele compra itens mágicos e raros sem fazer perguntas indiscretas.' }
      ],
      descricaoVisual: 'Vielas estreitas e úmidas onde a luz do sol quase não alcança'
    },
    {
      id: 'tile_bairro_erudito_biblioteca',
      nome: 'Quarteirão dos Sábios e Biblioteca',
      categoria: 'cultura',
      conectores: { norte: 'aberta', leste: 'fechada', sul: 'aberta', oeste: 'secundaria' },
      pontosDeInteresse: [
        { id: 'biblioteca_publica', nome: 'Arquivo dos Tomos de Tanna-Toh', tipo: 'biblioteca', descricao: 'Estantes repletas de pergaminhos, mapas antigos e cheiro de pergaminho seco.', npc: 'Erudita Mestra Vânia', gancho: 'Uma página arrancada de um atlas contém as coordenadas de uma ruína élfica.' }
      ],
      descricaoVisual: 'Casas com janelas arqueadas e vitrines repletas de manuscritos'
    },
    {
      id: 'tile_hortas_comunitarias',
      nome: 'Hortas Urbanas e Pomar Comunitário',
      categoria: 'rural',
      conectores: { norte: 'secundaria', leste: 'aberta', sul: 'fechada', oeste: 'aberta' },
      pontosDeInteresse: [
        { id: 'pomar_comum', nome: 'Pomar de Maçãs de Deheon', tipo: 'agricultura', descricao: 'Árvores frutíferas e canteiros de ervas medicinais bem cuidados pelos anciãos.', npc: 'Vovô Tonho, agricultor', gancho: 'Plantas carnívoras invasoras começaram a brotar nos canteiros.' }
      ],
      descricaoVisual: 'Canteiros verdejantes cercados por muretas de pedra baixa'
    },
    {
      id: 'tile_bosque_sagrado_druidas',
      nome: 'Bosque Sagrado de Allihanna',
      categoria: 'natureza',
      conectores: { norte: 'fechada', leste: 'secundaria', sul: 'secundaria', oeste: 'fechada' },
      pontosDeInteresse: [
        { id: 'circulo_pedras', nome: 'Círculo dos Menires de Allihanna', tipo: 'sagrado', descricao: 'Carvalhos ancestrais onde animais selvagens convivem em harmonia com druidas.', npc: 'Druida da floresta Silvaris', gancho: 'Ele alerta que o espírito da floresta está furioso com o avanço da cidade.' }
      ],
      descricaoVisual: 'Vegetação densa e clareira com pedras rúnicas cobertas de hera'
    },

    // 37-40: Água, Portos e Periferia
    {
      id: 'tile_porto_docas_pesca',
      nome: 'Docas do Rio e Armazéns Portuários',
      categoria: 'porto',
      conectores: { norte: 'aberta', leste: 'rio', sul: 'aberta', oeste: 'secundaria' },
      pontosDeInteresse: [
        { id: 'ancoradouro', nome: 'Cais das Barcas Mercantes', tipo: 'porto', descricao: 'Guindastes de madeira, cordas grossas e barcos descarregando peixes e salmoura.', npc: 'Capitão do barco Pescador Velho', gancho: 'Uma embarcação fantasma foi vista descendo a correnteza sem tripulação.' }
      ],
      descricaoVisual: 'Trapiches de madeira avançando sobre águas profundas'
    },
    {
      id: 'tile_ponte_pedra_pedagio',
      nome: 'Grande Ponte de Pedra e Moinho de Água',
      categoria: 'transporte',
      conectores: { norte: 'rio', leste: 'aberta', sul: 'rio', oeste: 'aberta' },
      pontosDeInteresse: [
        { id: 'moinho_agua', nome: 'Moinho de Trigo Hidráulico', tipo: 'moinho', descricao: 'Roda gigante de madeira impulsionada pela correnteza do rio.', npc: 'Moleiro Raul', gancho: 'Um cadáver com marcas de garras foi encontrado preso na roda do moinho.' }
      ],
      descricaoVisual: 'Ponte fortificada de arcos de pedra cruzando um rio caudaloso'
    },
    {
      id: 'tile_campo_treinamento_milicia',
      nome: 'Campo de Manobras e Tiro com Arco',
      categoria: 'militar',
      conectores: { norte: 'fechada', leste: 'aberta', sul: 'aberta', oeste: 'fechada' },
      pontosDeInteresse: [
        { id: 'alvos_tiro', nome: 'Carreiras de Tiro e Bonecos de Treino', tipo: 'treino', descricao: 'Bonecos de palha cortados por machados e alvos cravados de flechas.', npc: 'Instrutor Sargento Garen', gancho: 'Ele oferece instrução marcial e testes de arco para quem pagar 10 T$.' }
      ],
      descricaoVisual: 'Campo de terra batida com estacas, bandeiras de tiro e tendas'
    },
    {
      id: 'tile_acampamento_caravanas_externo',
      nome: 'Arredores dos Tropeiros e Pastoreio',
      categoria: 'periferia',
      conectores: { norte: 'aberta', leste: 'aberta', sul: 'fechada', oeste: 'aberta' },
      pontosDeInteresse: [
        { id: 'tendas_ciganos', nome: 'Acampamento dos Nômades Sar-Allan', tipo: 'comercio', descricao: 'Tendas de feltro com camelos, incensos aromáticos e tapetes coloridos.', npc: 'Vidente Zahra', gancho: 'Ela lê a sorte nas cartas e prevê um eclipse que trará calamidade.' }
      ],
      descricaoVisual: 'Campo aberto fora dos muros com fogueiras e tendas móveis'
    }
  ];

  /**
   * Configurações Canônicas por Categoria de Comunidade (Ameaças de Arton / T20)
   */
  const TIPOS_COMUNIDADE = {
    aldeia: {
      id: 'aldeia',
      nome: 'Aldeia',
      tamanhoGrid: 1, // 1x1 = 1 quadro
      populacaoMax: 1000,
      populacaoTexto: 'Até 1.000 habitantes',
      governoPadrao: 'Informal (Conselho de Anciãos ou Sábio da Aldeia)',
      guardaDescricao: '2d10 camponeses armados com forcados e lanças ou 1d4+1 guardas locais',
      limiteCompraItem: 50, // até T$ 50
      itensDisponiveisFormula: '1d6 itens até T$ 50',
      fundosDisponiveisFormula: '1d4 x T$ 100',
      fundosMin: 100,
      fundosMax: 400,
      quadrosObrigatorios: ['tile_praca_central'],
      descricao: 'Pequeno povoado rural cercado por lavouras ou florestas, sem governo formal centralizado.'
    },
    vila: {
      id: 'vila',
      nome: 'Vila',
      tamanhoGrid: 2, // 2x2 = 4 quadros
      populacaoMax: 5000,
      populacaoTexto: 'Até 5.000 habitantes',
      governoPadrao: 'Burgomestre, Feitor ou Barão Local',
      guardaDescricao: 'Milícia organizada de 10d10 guardas e patrulhas a cavalo',
      limiteCompraItem: 1000, // até T$ 1.000
      itensDisponiveisFormula: 'Itens comuns ilimitados, raros 2d6 itens até T$ 1.000',
      fundosDisponiveisFormula: '1d6 x T$ 1.000',
      fundosMin: 1000,
      fundosMax: 6000,
      quadrosObrigatorios: ['tile_praca_central', 'tile_taverna_javali', 'tile_ferraria_forja'],
      descricao: 'Assentamento próspero com comércio ativo, estalagem, ferreiro e autoridade civil constituída.'
    },
    cidade_media: {
      id: 'cidade_media',
      nome: 'Cidade Média',
      tamanhoGrid: 3, // 3x3 = 9 quadros
      populacaoMax: 15000,
      populacaoTexto: '5.001 a 15.000 habitantes',
      governoPadrao: 'Magistrado, Visconde ou Conselho de Mercadores',
      guardaDescricao: 'Guarnição regular de 200 a 500 soldados treinados e arqueiros',
      limiteCompraItem: 5000, // até T$ 5.000
      itensDisponiveisFormula: 'Itens comuns e superiores disponíveis; 3d6 raros até T$ 5.000',
      fundosDisponiveisFormula: '2d6 x T$ 3.000',
      fundosMin: 6000,
      fundosMax: 36000,
      quadrosObrigatorios: ['tile_praca_central', 'tile_prefeitura_magistrado', 'tile_taverna_javali', 'tile_ferraria_forja', 'tile_templo_khalmyr', 'tile_portao_principal_sul'],
      descricao: 'Centro regional urbano murado, polo de artesanato, guildas e templos de múltiplos deuses.'
    },
    cidade_grande: {
      id: 'cidade_grande',
      nome: 'Cidade Grande',
      tamanhoGrid: 4, // 4x4 = 16 quadros
      populacaoMax: 25000,
      populacaoTexto: '15.001 a 25.000 habitantes',
      governoPadrao: 'Lorde Prefeito, Duque ou Alto Sacerdote',
      guardaDescricao: 'Centenas de soldados em muralha, guarnição de 500 a 1.000 guardas de elite',
      limiteCompraItem: 10000, // até T$ 10.000
      itensDisponiveisFormula: 'Praticamente qualquer item comum e superior; 4d6 itens raros e mágicos até T$ 10.000',
      fundosDisponiveisFormula: '2d4 x T$ 10.000',
      fundosMin: 20000,
      fundosMax: 80000,
      quadrosObrigatorios: [
        'tile_praca_central', 'tile_prefeitura_magistrado', 'tile_tribunal_justica',
        'tile_mercado_coberto', 'tile_ferraria_forja', 'tile_alquimia_laboratorio',
        'tile_taverna_javali', 'tile_estalagem_luxo', 'tile_templo_khalmyr',
        'tile_quartel_armaria', 'tile_portao_principal_sul', 'tile_portao_secundario_norte'
      ],
      descricao: 'Poderosa cidade murada com nobres, bairros especializados, guilda de mercenários e alta magia.'
    },
    metropole: {
      id: 'metropole',
      nome: 'Metrópole',
      tamanhoGrid: 5, // 5x5 = 25 quadros
      populacaoMax: 1000000,
      populacaoTexto: '100.000 a 1.000.000+ habitantes (ex: Valkaria)',
      governoPadrao: 'Monarca, Regente ou Alto Conselho dos Triunviros',
      guardaDescricao: 'Exército completo, cavalaria alada, brigada de magos de batalha e guarda palaciana',
      limiteCompraItem: Infinity, // Sem limite
      itensDisponiveisFormula: 'Sem limite para itens comuns, superiores e itens mágicos menores/médios',
      fundosDisponiveisFormula: 'Ilimitado / Cofre Imperial',
      fundosMin: 500000,
      fundosMax: 5000000,
      quadrosObrigatorios: [
        'tile_praca_central', 'tile_prefeitura_magistrado', 'tile_tribunal_justica',
        'tile_mercado_coberto', 'tile_praca_artesaos', 'tile_ferraria_forja',
        'tile_alquimia_laboratorio', 'tile_engenharia_oficina', 'tile_guilda_mercenarios',
        'tile_taverna_javali', 'tile_estalagem_luxo', 'tile_teatro_arena',
        'tile_templo_khalmyr', 'tile_templo_wynna', 'tile_templo_valkaria',
        'tile_portao_principal_sul', 'tile_portao_secundario_norte', 'tile_quartel_armaria',
        'tile_bairro_nobre_mansao', 'tile_bairro_erudito_biblioteca', 'tile_porto_docas_pesca'
      ],
      descricao: 'Colosso civilizacional de Arton, centro do mundo conhecido com todas as raças, produtos e mistérios.'
    }
  };

  /**
   * Tabelas de problemas locais e ganchos de aventura em comunidades
   */
  const PROBLEMAS_LOCAIS = [
    'Ataques frequentes de bandidos ou saqueadores nas estradas comerciais vizinhas.',
    'Surtos de corrupção ou influência silenciosa de cultistas de Aharadak / Sszzaas.',
    'Tensão crescente entre a guarda da cidade e a guilda dos mercenários locais.',
    'Escassez de matérias-primas essenciais (ferro de Doherimm, grãos ou madeira de Tollon).',
    'Aparição de mortos-vivos errantes saídos de catacumbas sob a periferia.',
    'Disputa de sucessão política com suspeitas de envenenamento e traição.',
    'Conflito territorial com tribos selvagens ou homens-lagarto dos pântanos próximos.',
    'Uma criatura monstruosa de Megalokk estabeleceu covil a poucas léguas da muralha.'
  ];

  /**
   * Rola dados simples tipo NdM
   * @param {number} n 
   * @param {number} m 
   * @returns {number}
   */
  function rolarDados(n, m) {
    let tot = 0;
    for (let i = 0; i < n; i++) tot += Math.floor(Math.random() * m) + 1;
    return tot;
  }

  /**
   * Obtém um quadro modular por ID
   * @param {string} id 
   * @returns {QuadroModular | undefined}
   */
  function obterQuadroPorId(id) {
    return QUADROS_MODULARES.find(q => q.id === id);
  }

  /**
   * Calcula compatibilidade entre dois lados conectados
   * @param {ConectorBorda} ladoA 
   * @param {ConectorBorda} ladoB 
   * @returns {boolean}
   */
  function conectoresCompativeis(ladoA, ladoB) {
    if (ladoA === ladoB) return true;
    if ((ladoA === 'aberta' && ladoB === 'secundaria') || (ladoA === 'secundaria' && ladoB === 'aberta')) return true;
    if (ladoA === 'fechada' && (ladoB === 'fechada' || ladoB === 'muralha')) return true;
    return false;
  }

  /**
   * Gera uma comunidade procedural completa com grid tático coerente
   * @param {keyof TIPOS_COMUNIDADE} tipoId 
   * @param {Object} [opcoes]
   * @param {string} [opcoes.nome]
   * @param {string} [opcoes.governo]
   * @param {number} [opcoes.populacao]
   * @returns {Object}
   */
  function gerarComunidade(tipoId = 'vila', opcoes = {}) {
    const config = TIPOS_COMUNIDADE[tipoId] || TIPOS_COMUNIDADE.vila;
    const gridDim = config.tamanhoGrid;
    const totalTiles = gridDim * gridDim;

    // 1. Demografia e Recursos
    const populacao = opcoes.populacao || Math.min(
      config.populacaoMax,
      Math.floor(config.populacaoMax * (0.4 + Math.random() * 0.6))
    );

    let fundosDisponiveis = 0;
    if (tipoId === 'aldeia') fundosDisponiveis = rolarDados(1, 4) * 100;
    else if (tipoId === 'vila') fundosDisponiveis = rolarDados(1, 6) * 1000;
    else if (tipoId === 'cidade_media') fundosDisponiveis = rolarDados(2, 6) * 3000;
    else if (tipoId === 'cidade_grande') fundosDisponiveis = rolarDados(2, 4) * 10000;
    else fundosDisponiveis = 1000000; // Metrópole

    const problemaLocal = PROBLEMAS_LOCAIS[Math.floor(Math.random() * PROBLEMAS_LOCAIS.length)];

    // 2. Seleção de Quadros para preencher o Grid
    /** @type {QuadroModular[]} */
    const tilesEscolhidos = [];
    const pool = [...QUADROS_MODULARES];
    
    // Adiciona obrigatórios primeiro
    for (const obId of config.quadrosObrigatorios) {
      const q = obterQuadroPorId(obId);
      if (q && !tilesEscolhidos.some(t => t.id === q.id)) {
        tilesEscolhidos.push(q);
      }
    }

    // Preenche restantes com base na coerência do tipo
    const poolRestante = pool.filter(p => !tilesEscolhidos.some(t => t.id === p.id));
    // Embaralha pool
    for (let i = poolRestante.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [poolRestante[i], poolRestante[j]] = [poolRestante[j], poolRestante[i]];
    }

    while (tilesEscolhidos.length < totalTiles && poolRestante.length > 0) {
      tilesEscolhidos.push(poolRestante.pop());
    }

    // 3. Montagem da Matriz (Grid [linha][coluna])
    /** @type {QuadroModular[][]} */
    const grid = [];
    let idx = 0;
    for (let r = 0; r < gridDim; r++) {
      grid[r] = [];
      for (let c = 0; c < gridDim; c++) {
        // Se for centro do mapa, prioriza praça central
        if (r === Math.floor(gridDim / 2) && c === Math.floor(gridDim / 2)) {
          const praca = tilesEscolhidos.find(t => t.id === 'tile_praca_central');
          if (praca) {
            grid[r][c] = praca;
            continue;
          }
        }
        grid[r][c] = tilesEscolhidos[idx++] || QUADROS_MODULARES[0];
      }
    }

    // Coleta todos os pontos de interesse da comunidade
    const todosPontosDeInteresse = [];
    for (let r = 0; r < gridDim; r++) {
      for (let c = 0; c < gridDim; c++) {
        const tile = grid[r][c];
        if (tile && Array.isArray(tile.pontosDeInteresse)) {
          for (const p of tile.pontosDeInteresse) {
            todosPontosDeInteresse.push({
              ...p,
              posicaoGrid: { linha: r + 1, coluna: c + 1, coordenada: `[${r + 1},${c + 1}]` },
              nomeQuadro: tile.nome
            });
          }
        }
      }
    }

    return {
      tipo: config.id,
      tipoNome: config.nome,
      nome: opcoes.nome || `${config.nome} de Arton`,
      gridDimensao: `${gridDim}x${gridDim}`,
      tamanhoGrid: gridDim,
      totalQuadros: totalTiles,
      populacao,
      populacaoTexto: `${populacao.toLocaleString('pt-BR')} habitantes`,
      governo: opcoes.governo || config.governoPadrao,
      guarda: config.guardaDescricao,
      limiteCompraItem: config.limiteCompraItem === Infinity ? 'Sem limite' : `T$ ${config.limiteCompraItem.toLocaleString('pt-BR')}`,
      itensDisponiveisFormula: config.itensDisponiveisFormula,
      fundosDisponiveis: config.fundosDisponiveisFormula.includes('Ilimitado') ? 'Ilimitado' : `T$ ${fundosDisponiveis.toLocaleString('pt-BR')}`,
      fundosValorNumerico: fundosDisponiveis,
      problemaLocal,
      grid,
      pontosDeInteresse: todosPontosDeInteresse
    };
  }

  return Object.freeze({
    QUADROS_MODULARES,
    TIPOS_COMUNIDADE,
    PROBLEMAS_LOCAIS,
    obterQuadroPorId,
    gerarComunidade
  });
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = RegrasComunidades;
}
