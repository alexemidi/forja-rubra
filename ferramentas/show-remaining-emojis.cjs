const fs = require('fs');

const files = [
  'src/funcionalidades/criador/ficha/renderizacao.js',
  'src/funcionalidades/criador/inventario/equipamento.js',
  'src/funcionalidades/criador/inventario/venda.js',
  'src/funcionalidades/criador/fases/09-progressao.js',
  'src/funcionalidades/loja/03-02-current.js',
  'src/funcionalidades/loja/05-00-initialChoice.js',
  'src/funcionalidades/taverna/03-01-renderMercenariesGrid.js',
  'src/integracoes/criador/loja-itens-iniciais.js',
  'src/funcionalidades/criador/ficha/oficina-oficios.js',
  'src/funcionalidades/loja/03-05-persistCharacterProfiles.js',
  'src/funcionalidades/criador/fases/02-raca-atributos.js',
  'src/funcionalidades/criador/fases/04-origens-divindades.js',
  'src/funcionalidades/criador/fases/poderes-sequenciais.js',
  'src/funcionalidades/criador/ficha/habilidades-magias.js',
  'src/paginas/grimorio.html',
  'src/compartilhado/drawer/drawer-ui.js',
  'src/compartilhado/icones.js',
  'src/estilos/loja/0.css',
  'src/funcionalidades/criador/fases/01-identidade-escolhas.js',
  'src/funcionalidades/criador/fases/07-magias.js',
  'src/funcionalidades/criador/gerador-aleatorio.js',
  'src/funcionalidades/index/00-00-portal.js',
  'src/funcionalidades/loja/03-03-prepareCatalogItem.js',
  'src/funcionalidades/loja/03-04-syncFilterUI.js',
  'src/funcionalidades/loja/03-06-magicRuleStatsHtml.js',
  'src/funcionalidades/loja/05-02-applyArsenalContext.js',
  'src/funcionalidades/loja/05-03-ensureGeneralSaleModal.js',
  'src/funcionalidades/personagens/00-00-personagens.js',
  'src/regras/criador/origem-cosmopolita.js'
];

const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}\u{FE0F}]/u;

files.forEach(f => {
  try {
    const lines = fs.readFileSync(f, 'utf8').split('\n');
    lines.forEach((l, idx) => {
      if (emojiRegex.test(l)) {
        console.log(`${f}:L${idx+1}: ${l.trim().slice(0, 90)}`);
      }
    });
  } catch (e) {}
});
