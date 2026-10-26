import test from 'node:test';
import assert from 'node:assert/strict';

// Dicionários canônicos de teste
const RACE_CANONICAL_NAMES: Record<string, string> = {
  humano: 'Humano',
  anao: 'Anão',
  dahllan: 'Dahllan',
  elfo: 'Elfo',
  goblin: 'Goblin',
  lefou: 'Lefou',
  minotauro: 'Minotauro',
  qareen: 'Qareen',
  golem: 'Golem',
  golem_desperto: 'Golem Desperto',
  hynne: 'Hynne',
  kliren: 'Kliren',
  meduza: 'Meduza',
  osteon: 'Osteon',
  sereia_tritao: 'Sereia / Tritão',
  silfide: 'Sílfide',
  suraggel: 'Suraggel',
  trog: 'Trog',
  duende: 'Duende'
};

const CLASS_CANONICAL_NAMES: Record<string, string> = {
  arcanista: 'Arcanista',
  barbaro: 'Bárbaro',
  bardo: 'Bardo',
  bucaneiro: 'Bucaneiro',
  cacador: 'Caçador',
  cavaleiro: 'Cavaleiro',
  clerigo: 'Clérigo',
  druida: 'Druida',
  guerreiro: 'Guerreiro',
  inventor: 'Inventor',
  ladino: 'Ladino',
  lutador: 'Lutador',
  nobre: 'Nobre',
  paladino: 'Paladino',
  samurai: 'Samurai'
};

function resolveRaceName(snap: any, isFinished: boolean): string {
  const raceId = snap.identity?.raceId || snap.raceId || snap.race || '';
  if (!raceId) {
    return isFinished ? 'Humano' : 'Raça a definir';
  }
  const key = String(raceId).toLowerCase().trim();
  if (RACE_CANONICAL_NAMES[key]) return RACE_CANONICAL_NAMES[key];
  return key.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function resolveClassName(snap: any, isFinished: boolean): string {
  if (Array.isArray(snap.progression) && snap.progression.length > 0) {
    const classIds = [...new Set(snap.progression.map((r: any) => r.classId).filter(Boolean))];
    if (classIds.length > 0) {
      const names = classIds.map((cid: any) => {
        const key = String(cid).toLowerCase().trim();
        if (CLASS_CANONICAL_NAMES[key]) return CLASS_CANONICAL_NAMES[key];
        return key.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      });
      return names.join(' / ');
    }
  }

  const classId = snap.identity?.classId || snap.classId || '';
  if (!classId) {
    return isFinished ? 'Aventureiro' : 'Classe a definir';
  }
  const key = String(classId).toLowerCase().trim();
  if (CLASS_CANONICAL_NAMES[key]) return CLASS_CANONICAL_NAMES[key];
  return key.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getPendingCreationStep(snap: any): number {
  const completed = Array.isArray(snap.completed) ? snap.completed.map(Number) : [];
  const currentStep = Number(snap.step);

  if (currentStep >= 1 && currentStep <= 9) {
    if (!completed.includes(currentStep)) {
      return currentStep;
    }
  }

  for (let s = 1; s <= 9; s++) {
    if (!completed.includes(s)) return s;
  }

  return (currentStep >= 1 && currentStep <= 9) ? currentStep : 1;
}

test('Resolução Canônica de Raça e Classe em Heróis Salvos', () => {
  // Cenário 1: Personagem pronto (Zahir Marcelion) com identity.raceId e progression
  const zahirSnap = {
    finished: true,
    identity: { characterName: 'Zahir Marcelion', raceId: 'qareen', plannedLevel: 20 },
    progression: [{ classId: 'arcanista' }, { classId: 'arcanista' }]
  };
  assert.equal(resolveRaceName(zahirSnap, true), 'Qareen');
  assert.equal(resolveClassName(zahirSnap, true), 'Arcanista');

  // Cenário 2: Personagem pronto Guerreirão d'Pedrão (Golem / Guerreiro)
  const pedraoSnap = {
    finished: true,
    identity: { characterName: "Guerreirão d'Pedrão", raceId: 'golem', plannedLevel: 5 },
    progression: [{ classId: 'guerreiro' }, { classId: 'guerreiro' }]
  };
  assert.equal(resolveRaceName(pedraoSnap, true), 'Golem');
  assert.equal(resolveClassName(pedraoSnap, true), 'Guerreiro');

  // Cenário 3: Multiclasse (Guerreiro / Arcanista)
  const multiclasseSnap = {
    finished: true,
    identity: { characterName: 'Eldrin', raceId: 'elfo', plannedLevel: 6 },
    progression: [
      { classId: 'guerreiro' },
      { classId: 'guerreiro' },
      { classId: 'arcanista' }
    ]
  };
  assert.equal(resolveRaceName(multiclasseSnap, true), 'Elfo');
  assert.equal(resolveClassName(multiclasseSnap, true), 'Guerreiro / Arcanista');

  // Cenário 4: Rascunho sem raça nem classe escolhidas
  const rascunhoVazio = {
    finished: false,
    identity: { characterName: 'Iniciado de Valkaria' },
    progression: []
  };
  assert.equal(resolveRaceName(rascunhoVazio, false), 'Raça a definir');
  assert.equal(resolveClassName(rascunhoVazio, false), 'Classe a definir');
});

test('Detecção da Etapa Pendente em Criações Abandonadas no Meio', () => {
  // Usuário abandonou na Fase 4 (Perícias) tendo completado 1, 2 e 3
  const snapPericias = {
    finished: false,
    step: 4,
    completed: [1, 2, 3]
  };
  assert.equal(getPendingCreationStep(snapPericias), 4);

  // Usuário estava na Fase 2 (Atributos) mas sem completar a Fase 2
  const snapAtributos = {
    finished: false,
    step: 2,
    completed: [1]
  };
  assert.equal(getPendingCreationStep(snapAtributos), 2);

  // Usuário avançou até a Fase 7 de Magias
  const snapMagias = {
    finished: false,
    step: 7,
    completed: [1, 2, 3, 4, 5, 6]
  };
  assert.equal(getPendingCreationStep(snapMagias), 7);
});

test('Regra de Obrigatoriedade do Nome: Rascunho sem nome é descartado do roster', () => {
  const rosterMock = [
    { id: '1', name: 'Zahir Marcelion', finished: true, snapshot: { finished: true } },
    { id: '2', name: '', finished: false, snapshot: { finished: false, identity: { characterName: '   ' } } },
    { id: '3', name: 'Guerreirão', finished: true, snapshot: { finished: true } },
    { id: '4', name: 'Rascunho com Nome', finished: false, snapshot: { finished: false, identity: { characterName: 'Rascunho com Nome' } } },
    { id: '5', name: undefined, finished: false, snapshot: { finished: false } }
  ];

  // Filtro de roster
  const valid = rosterMock.filter(item => {
    const name = String(item?.name || item?.snapshot?.identity?.characterName || '').trim();
    return name.length > 0;
  });

  assert.equal(valid.length, 3);
  assert.deepEqual(valid.map(h => h.id), ['1', '3', '4']);
});

test('Roteamento de Abertura: Rascunhos abrem criador na fase pendente e prontas na ficha', () => {
  const heroes = [
    {
      id: 'h1',
      finished: true,
      snapshot: { finished: true, identity: { characterName: 'Pronto' } }
    },
    {
      id: 'h2',
      finished: false,
      snapshot: { finished: false, step: 5, completed: [1, 2, 3, 4], identity: { characterName: 'Incompleto' } }
    }
  ];

  function getTargetNavigation(hero: any) {
    const isFinished = Boolean(hero.finished || hero.snapshot?.finished);
    if (!isFinished) {
      const pendingStep = getPendingCreationStep(hero.snapshot);
      return {
        url: 'criador.html',
        step: pendingStep,
        finished: false,
        sheetView: 'creator'
      };
    }
    return {
      url: 'ficha.html',
      finished: true,
      sheetView: 'sheet'
    };
  }

  const navPronto = getTargetNavigation(heroes[0]);
  assert.equal(navPronto.url, 'ficha.html');
  assert.equal(navPronto.finished, true);

  const navIncompleto = getTargetNavigation(heroes[1]);
  assert.equal(navIncompleto.url, 'criador.html');
  assert.equal(navIncompleto.step, 5);
  assert.equal(navIncompleto.finished, false);
});
