const { execSync } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const tests = [
  'testes/regras-puras.cjs',
  'testes/estado-inventario.cjs',
  'testes/venda-integrada.cjs',
  'testes/equipamento-interface.cjs',
  'testes/maos.cjs',
  'testes/operacoes-loja.cjs',
  'testes/itens-origem-e-recompensa.cjs',
  'testes/manufatura-regras.cjs',
  'testes/verificar.cjs',
  'testes/regressoes-criacao.cjs',
  'testes/cosmopolita-beneficio.cjs',
  'testes/novas-solicitacoes-fev2026.cjs',
  'testes/vitals-temp-morte.cjs',
  'testes/arcanista-pre-requisitos.cjs',
  'testes/fases-origem-pericias.cjs',
  'testes/progression-footer-edit.cjs',
  'testes/origens-regionais-parceiros.cjs',
  'testes/parceiros-fase-e-vitals.cjs',
  'testes/origens-regionais-lote2.cjs',
  'testes/origens-regionais-lote3-e-vitals.cjs',
  'testes/origens-regionais-lote4.cjs',
  'testes/origens-regionais-lote5.cjs',
  'testes/origens-completas-validacao.cjs',
  'testes/ajustes-cosmopolita-parceiros-minimalismo.cjs',
  'testes/autenticacao-e-sincronizacao-nuvem.cjs',
  'testes/drawer-icones-e-portal.cjs',
  'testes/limite-origem-e-menus.cjs',
  'testes/parceiros-e-atributos-temporarios.cjs',
  'testes/regras-puras-nimb.cjs',
  'testes/recompensas-t20.cjs',
  'testes/campanha-mesa.cjs',
  'testes/distincoes-e-divindades.cjs',
  'testes/engenhocas-oficios-grimorio.cjs',
  'testes/oficinas-recompensas-padronizacao.cjs',
  'testes/guilda-e-requisitos-atributos.cjs',
  'testes/comunidades-e-masmorras.cjs',
  'testes/poderes-itens-e-pericias.cjs',
  'testes/magias-cancelar-nivel-e-estabulo.cjs',
  'testes/nobre-agente-de-elite.cjs',
  'testes/distincoes-subir-nivel-e-bloco-troca.cjs',
  'testes/ajustes-parceiros-montaria-condicoes.cjs',
  'testes/otimizacao-racas-e-ordenacao.cjs',
  'testes/duende-espolio-materiais.cjs',
  'testes/poderes-lote1.cjs',
  'testes/poderes-lote2.cjs',
  'testes/poderes-lote3.cjs',
  'testes/poderes-lote4.cjs',
  'testes/poderes-lote5.cjs',
  'testes/poderes-lote6.cjs',
  'testes/loja-compra-intermediaria.cjs'
];

console.log(`Executando ${tests.length} suítes de testes legados com suporte a TypeScript...`);
let passed = 0;
for (const testFile of tests) {
  try {
    execSync(`node -r ./ferramentas/ts-node-register.cjs ${testFile}`, {
      cwd: root,
      stdio: 'inherit'
    });
    passed++;
  } catch (err) {
    console.error(`\n❌ Falha no teste: ${testFile}`);
    process.exit(1);
  }
}

console.log(`\n🎉 SUCESSO: Todas as ${passed} suítes de testes foram aprovadas!`);
