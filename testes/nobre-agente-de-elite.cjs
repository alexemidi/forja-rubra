const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

// Carrega o módulo do Agente de Elite
const agenteEliteModule = require('../src/regras/criador/nobre-agente-de-elite.js');

test('Agente de Elite: Catálogos canônicos de parceiros veteranos e montarias', () => {
  assert.ok(Array.isArray(agenteEliteModule.CANONICAL_AGENTE_PARTNERS), 'Deve possuir lista de parceiros canônicos');
  assert.ok(agenteEliteModule.CANONICAL_AGENTE_PARTNERS.length >= 10, 'Deve ter os parceiros veteranos do livro');

  const ajudante = agenteEliteModule.CANONICAL_AGENTE_PARTNERS.find(p => p.id === 'ajudante');
  assert.ok(ajudante, 'Deve conter Ajudante');
  assert.match(ajudante.benefit, /\+2 em três perícias/i);

  const combatente = agenteEliteModule.CANONICAL_AGENTE_PARTNERS.find(p => p.id === 'combatente');
  assert.ok(combatente, 'Deve conter Combatente');
  assert.match(combatente.benefit, /\+2 em testes de ataque/i);

  assert.ok(Array.isArray(agenteEliteModule.CANONICAL_AGENTE_MOUNTS), 'Deve possuir lista de montarias canônicas');
  const cavalo = agenteEliteModule.CANONICAL_AGENTE_MOUNTS.find(m => m.id === 'cavalo');
  assert.ok(cavalo, 'Deve conter Cavalo');
  assert.match(cavalo.benefit, /15m/i);
});

test('Agente de Elite: Cálculo de nível de nobre e nível efetivo (Nobre − 4)', () => {
  global.state = {
    identity: { classId: 'nobre' },
    progression: [
      { level: 1, classId: 'nobre' },
      { level: 2, classId: 'nobre' },
      { level: 3, classId: 'nobre' },
      { level: 4, classId: 'nobre' },
      { level: 5, classId: 'nobre' },
      { level: 6, classId: 'nobre' },
      { level: 7, classId: 'nobre' },
      { level: 8, classId: 'nobre' },
      { level: 9, classId: 'nobre' },
      { level: 10, classId: 'nobre' },
      { level: 11, classId: 'nobre', powerId: 'nobre_agente_de_elite' }
    ]
  };

  const nobreLvl = agenteEliteModule.nobreClassLevel();
  assert.equal(nobreLvl, 11, 'Deve reconhecer nível 11 de nobre');

  const effLvl = agenteEliteModule.agenteEliteEffectiveClassLevel();
  assert.equal(effLvl, 7, 'Nível efetivo na outra classe deve ser Nobre − 4 = 11 − 4 = 7');
});

test('Agente de Elite: Elegibilidade de poderes de outra classe', () => {
  const effLvl = 7; // Nobre 11 -> nível 7

  // Poder da própria classe Nobre deve ser recusado
  const poderNobre = {
    id: 'nobre_presenca_aristocratica',
    nome: 'Presença Aristocrática',
    classeIds: ['nobre'],
    preRequisitosTexto: 'Nobre 1º'
  };
  const resNobre = agenteEliteModule.agenteElitePowerEligibility(poderNobre, effLvl);
  assert.equal(resNobre.ok, false, 'Não pode conceder poderes da classe Nobre');
  assert.match(resNobre.reasons[0], /outra classe/i);

  // Poder de Guerreiro de nível 6 (deve ser permitido para nível efetivo 7)
  const poderGuerreiroLvl6 = {
    id: 'guerreiro_golpe_pessoal',
    nome: 'Golpe Pessoal',
    classeIds: ['guerreiro'],
    preRequisitosTexto: 'Guerreiro 5º nível'
  };
  global.parsePowerRequirements = () => ({ level: 5, attrs: [], skills: [] });
  global.finalAttrs = () => ({ for: 2, des: 2, con: 2, int: 2, sab: 2, car: 3 });
  global.allTrainedSkills = () => ['luta', 'diplomacia'];

  const resGuerreiroOk = agenteEliteModule.agenteElitePowerEligibility(poderGuerreiroLvl6, effLvl);
  assert.equal(resGuerreiroOk.ok, true, 'Deve aprovar poder de guerreiro de nível 5 para nível efetivo 7');

  // Poder de Guerreiro de nível 8 (deve ser bloqueado para nível efetivo 7)
  const poderGuerreiroLvl8 = {
    id: 'guerreiro_mestre_em_arma',
    nome: 'Mestre em Arma',
    classeIds: ['guerreiro'],
    preRequisitosTexto: 'Guerreiro 8º nível'
  };
  global.parsePowerRequirements = () => ({ level: 8, attrs: [], skills: [] });
  const resGuerreiroBloqueado = agenteEliteModule.agenteElitePowerEligibility(poderGuerreiroLvl8, effLvl);
  assert.equal(resGuerreiroBloqueado.ok, false, 'Deve bloquear poder que requer nível 8');
  assert.match(resGuerreiroBloqueado.reasons[0], /Requer nível 8/i);
});

test('Agente de Elite: Sincronização de Parceiro Especial consumindo limite padrão', () => {
  global.state = {
    partners: [
      { name: 'Parceiro Normal', tipo: 'guardiao', tier: 'iniciante' }
    ]
  };

  const choicePartner = {
    mode: 'partner',
    id: 'combatente',
    name: 'Combatente',
    role: 'Linha de Frente',
    isMount: false,
    benefit: 'Você recebe +2 em testes de ataque corpo a corpo e +1d8 no dano corpo a corpo.'
  };

  agenteEliteModule.syncAgenteElitePartnerInState(choicePartner);

  assert.equal(global.state.partners.length, 2, 'Deve manter o parceiro normal e adicionar o parceiro de elite');
  const elitePartner = global.state.partners.find(p => p.isAgenteElite);
  assert.ok(elitePartner, 'Deve existir parceiro com isAgenteElite=true');
  assert.equal(elitePartner.countsTowardsLimit, true, 'Deve contar para o limite comum de parceiros por regra oficial');
  assert.equal(elitePartner.tier, 'veterano', 'Grau deve ser veterano');
  assert.equal(elitePartner.name, 'Combatente');
});

test('Agente de Elite: Integração no arquivo de habilidades e manifesto', () => {
  const habCode = fs.readFileSync(path.join(__dirname, '../src/funcionalidades/criador/ficha/habilidades-magias.js'), 'utf8');
  assert.ok(habCode.includes('isAgenteElite'), 'habilidades-magias.js deve conter detecção de isAgenteElite');
  assert.ok(habCode.includes('data-action="open-agente-elite-swap"'), 'habilidades-magias.js deve conter botão open-agente-elite-swap');

  const manifestoCode = fs.readFileSync(path.join(__dirname, '../src/paginas/manifesto.json'), 'utf8');
  const manifesto = JSON.parse(manifestoCode);
  const criadorScripts = (manifesto.criador?.scripts || []).flat();
  const fichaScripts = (manifesto.ficha?.scripts || []).flat();
  assert.ok(criadorScripts.some(s => s.includes('nobre-agente-de-elite')), 'manifesto deve conter nobre-agente-de-elite no criador');
  assert.ok(fichaScripts.some(s => s.includes('nobre-agente-de-elite')), 'manifesto deve conter nobre-agente-de-elite na ficha');
});
