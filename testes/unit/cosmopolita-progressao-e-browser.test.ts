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

  // 7. Checar filtros da Fase de Progressão unificados com a Fase de Poderes
  assert.ok(
    browserCode.includes('data-filter="all">Todos</button>'),
    'O drawer deve conter o filtro Todos igual à Fase de Poderes'
  );
  assert.ok(
    browserCode.includes('Poderes de \' + esc(c.nome) + \'</button>'),
    'O drawer deve exibir Poderes de {Classe} para cada classe elegível'
  );
  assert.ok(
    browserCode.includes("{ id: 'combate', label: 'Combate' }"),
    'O drawer deve conter o filtro Combate'
  );
  assert.ok(
    browserCode.includes("{ id: 'destino', label: 'Destino' }"),
    'O drawer deve conter o filtro Destino'
  );
  assert.ok(
    browserCode.includes("{ id: 'magia', label: 'Magia' }"),
    'O drawer deve conter o filtro Magia'
  );
  assert.ok(
    browserCode.includes("{ id: 'concedido', label: 'Poderes Concedidos' }") &&
    browserCode.includes("{ id: 'tormenta', label: 'Tormenta' }") &&
    browserCode.includes("{ id: 'raca', label: 'Raça' }") &&
    browserCode.includes("{ id: 'grupo', label: 'Grupo' }") &&
    browserCode.includes("{ id: 'escolhido_dos_deuses', label: 'Escolhido dos Deuses' }"),
    'O drawer deve conter todas as categorias da Fase de Poderes mesmo na Origem Cosmopolita'
  );
  assert.ok(
    browserCode.includes("{ id: 'ver_tudo', label: 'Ver tudo' }"),
    'O drawer deve conter o filtro Ver tudo igual à Fase de Poderes'
  );
  assert.ok(
    !browserCode.includes('const generalCategories = isCosmoSlot'),
    'A lista de categorias no drawer de progressão deve ser idêntica à Fase de Poderes sem restringir opções na Cosmopolita'
  );

  // 8. Checar que o CSS de .panel não aplica clip-path quando contém .power-filters-drawer e que a cor da raça/classe na barra superior é igual à do nome
  const cssCode = fs.readFileSync(path.resolve('src/estilos/criador/migration-theme.css'), 'utf8');
  assert.ok(
    cssCode.includes('.panel:has(.power-filters-drawer)'),
    'O CSS deve desativar clip-path em .panel quando contém .power-filters-drawer para não cortar o menu de filtros no topo'
  );
  assert.ok(
    cssCode.includes('.phase-nav-hero-meta {\n  color: var(--cream, #f5eee6) !important;'),
    'A raça e a classe na barra superior devem ter a mesma cor da fonte do nome do personagem'
  );
});
