import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Origem Cosmopolita - Liberação da Fase de Progressão no Nível 1 e Regra de Poder de Classe', () => {
  // 1. Checar shouldSkipPhase(10)
  const catCode = fs.readFileSync(path.resolve('src/compartilhado/criador/estado-e-catalogos.ts'), 'utf8');
  assert.ok(
    catCode.includes("if (typeof hasCosmopolita === 'function' && hasCosmopolita()) return false;"),
    'shouldSkipPhase(10) deve retornar false quando hasCosmopolita() for true'
  );

  // 2. Checar progressionLevelIndices() incluindo nível 0 para Cosmopolita
  const progCode = fs.readFileSync(path.resolve('src/funcionalidades/criador/fases/09-progressao.ts'), 'utf8');
  assert.ok(
    progCode.includes("typeof hasCosmopolita === 'function' && hasCosmopolita() && !indices.includes(0)"),
    'progressionLevelIndices() deve incluir o índice 0 quando hasCosmopolita() for true'
  );

  // 3. Checar classProgressionEligibility para o slot de Cosmopolita (index === 0)
  const powerCode = fs.readFileSync(path.resolve('src/regras/criador/progressao-poderes.ts'), 'utf8');
  assert.ok(
    powerCode.includes('Requer pelo menos 2º nível na classe para a Origem Cosmopolita.'),
    'classProgressionEligibility deve exigir pelo menos nível 2 na classe para liberar poderes de classe na Origem Cosmopolita'
  );
  assert.ok(
    powerCode.includes('Origem Cosmopolita não permite poderes concedidos, raciais ou da Tormenta.'),
    'classProgressionEligibility deve bloquear poderes concedidos, raciais ou da Tormenta'
  );

  // 4. Checar padronização de busca e drawer de filtros na Fase 10
  const browserCode = fs.readFileSync(path.resolve('src/funcionalidades/criador/fases/09-lista-poderes.ts'), 'utf8');
  assert.ok(
    browserCode.includes('power-filter-trigger-btn'),
    'O browser da progressão deve possuir o botão power-filter-trigger-btn'
  );
  assert.ok(
    browserCode.includes('power-filters-drawer'),
    'O browser da progressão deve possuir o drawer power-filters-drawer'
  );
  assert.ok(
    browserCode.includes('power-search-mode-btn'),
    'O browser da progressão deve possuir o botão de pesquisa relativa'
  );
  assert.ok(
    browserCode.includes('power-detail-meta'),
    'O painel de detalhes da progressão deve conter as meta tags douradas minimalistas'
  );
  assert.ok(
    browserCode.includes('Clique em Avançar para confirmar este poder.'),
    'O painel de detalhes da progressão deve conter a dica de confirmação de avanço'
  );

  // 5. Checar correção de navegação por setas na progressão
  const seqCode = fs.readFileSync(path.resolve('src/funcionalidades/criador/fases/poderes-sequenciais.ts'), 'utf8');
  assert.ok(
    seqCode.includes('else if(state.step===10){'),
    'O keydown de navegação por setas deve atender à Fase 10 (Progressão)'
  );
  assert.ok(
    seqCode.includes('previewProgressionPower(activeIndex, targetId, { fromKeyboard: true })'),
    'A navegação por setas na progressão deve usar previewProgressionPower in-place sem delay'
  );

  // 6. Checar que Cosmopolita NÃO cria etapas na Fase 6 (apenas na progressão)
  const phase6StagesCode = fs.readFileSync(path.resolve('src/features/creator/powers/phase6-stages.ts'), 'utf8');
  assert.ok(
    !phase6StagesCode.includes("stages.push({\n      type: 'cosmopolita'"),
    'phase6-stages.ts não deve registrar cosmopolita como subestágio da Fase 6'
  );
  const cosmoCode = fs.readFileSync(path.resolve('src/regras/criador/origem-cosmopolita.ts'), 'utf8');
  assert.ok(
    !cosmoCode.includes("stages.push({ type: 'cosmopolita'"),
    'origem-cosmopolita.ts não deve registrar cosmopolita como subestágio da Fase 6'
  );

  // 7. Checar filtros da Fase de Progressão na ordem correta
  assert.ok(
    browserCode.includes('data-filter="all">Todos os poderes</button>'),
    'O drawer deve conter Todos os poderes'
  );
  assert.ok(
    browserCode.includes('data-filter="class">Poderes de classe</button>'),
    'O drawer deve conter Poderes de classe'
  );
  assert.ok(
    browserCode.includes('data-filter="general">Poderes gerais</button>'),
    'O drawer deve conter Poderes gerais'
  );
  assert.ok(
    browserCode.includes('data-filter="combate">Combate</button>'),
    'O drawer deve conter subfiltro Combate'
  );
  assert.ok(
    browserCode.includes('data-filter="destino">Destino</button>'),
    'O drawer deve conter subfiltro Destino'
  );
  assert.ok(
    browserCode.includes('data-filter="magia">Magia</button>'),
    'O drawer deve conter subfiltro Magia'
  );
  assert.ok(
    browserCode.includes('data-filter="locked">Indisponíveis</button>'),
    'O drawer deve conter o último filtro Indisponíveis'
  );
});
