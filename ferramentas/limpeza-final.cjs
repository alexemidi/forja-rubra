const fs = require('fs');

function clean(file, fn) {
  try {
    let content = fs.readFileSync(file, 'utf8');
    const updated = fn(content);
    if (content !== updated) {
      fs.writeFileSync(file, updated, 'utf8');
      console.log('Limpo:', file);
    }
  } catch (e) {
    console.error('Erro ao limpar', file, e.message);
  }
}

// 1. Equipamento
clean('src/funcionalidades/criador/inventario/equipamento.js', s => {
  return s.replace(/⚔ /g, '')
          .replace(/🛡 /g, '')
          .replace(/🔄 /g, '')
          .replace(/⚙️ /g, '')
          .replace(/💍 /g, '');
});

// 2. Venda
clean('src/funcionalidades/criador/inventario/venda.js', s => {
  return s.replace(/>✕<\/button>/g, '>×<\/button>')
          .replace(/<span>⚙️<\/span> /g, '')
          .replace(/🛡️ <strong>/g, '<strong>')
          .replace(/⚙️ <strong>/g, '<strong>');
});

// 3. Progressao
clean('src/funcionalidades/criador/fases/09-progressao.js', s => {
  return s.replace(/✓ /g, '').replace(/✓/g, '');
});

// 4. Loja 03-02
clean('src/funcionalidades/loja/03-02-current.js', s => {
  return s.replace(/icon:\s*'✦'/g, "icon: ''")
          .replace(/icon:\s*'⚔️'/g, "icon: ''")
          .replace(/icon:\s*'➶'/g, "icon: ''")
          .replace(/icon:\s*'🛡️'/g, "icon: ''");
});

// 5. Loja 05-00
clean('src/funcionalidades/loja/05-00-initialChoice.js', s => {
  return s.replace(/🛡️ Estabilizador/g, 'Estabilizador')
          .replace(/>✕<\/button>/g, '>×<\/button>')
          .replace(/✕/g, '×');
});

// 6. Taverna 03-01
clean('src/funcionalidades/taverna/03-01-renderMercenariesGrid.js', s => {
  return s.replace(/✓ Selecionado/g, 'Selecionado')
          .replace(/sel\?\.icon \|\| '⚔️'/g, "''")
          .replace(/⚠️ Requisito/g, 'Requisito')
          .replace(/⚠️/g, '');
});

// 7. Loja Itens Iniciais (toasts)
clean('src/integracoes/criador/loja-itens-iniciais.js', s => {
  return s.replace(/🧪 Escolha/g, 'Escolha')
          .replace(/📜 Escolha/g, 'Escolha')
          .replace(/✨ Escolha/g, 'Escolha')
          .replace(/⚙️ Escolha/g, 'Escolha');
});

// 8. Oficina
clean('src/funcionalidades/criador/ficha/oficina-oficios.js', s => {
  return s.replace(/✓ /g, '')
          .replace(/>✕<\/button>/g, '>×<\/button>')
          .replace(/✕/g, '×');
});

// 9. Loja 03-05
clean('src/funcionalidades/loja/03-05-persistCharacterProfiles.js', s => {
  return s.replace(/✓ /g, '')
          .replace(/✎/g, 'Editar')
          .replace(/🗑/g, 'Excluir');
});

// 10. Raça atributos
clean('src/funcionalidades/criador/fases/02-raca-atributos.js', s => {
  return s.replace(/✕/g, '×')
          .replace(/✓/g, '');
});

// 11. Origens divindades
clean('src/funcionalidades/criador/fases/04-origens-divindades.js', s => {
  return s.replace(/✓/g, '');
});

// 12. Poderes sequenciais
clean('src/funcionalidades/criador/fases/poderes-sequenciais.js', s => {
  return s.replace(/<span>💡<\/span> /g, '');
});

// 13. Habilidades magias
clean('src/funcionalidades/criador/ficha/habilidades-magias.js', s => {
  return s.replace(/✕/g, '×');
});

// 14. Grimório HTML
clean('src/paginas/grimorio.html', s => {
  return s.replace(/✦ Grimório de Arton ✦/g, 'Grimório de Arton')
          .replace(/data-circ="0">✦<\/button>/g, 'data-circ="0">Todos<\/button>');
});

// 15. Drawer UI
clean('src/compartilhado/drawer/drawer-ui.js', s => {
  return s.replace(/'☰'/g, "''");
});

// 16. Icones.js
clean('src/compartilhado/icones.js', s => {
  return s.replace(/\(☰\)/g, '').replace(/\(X\)/g, '');
});

// 17. Loja 0.css
clean('src/estilos/loja/0.css', s => {
  return s.replace(/content:'⚙';/g, "content:'';");
});

// 18. Fases 01 e 07
clean('src/funcionalidades/criador/fases/01-identidade-escolhas.js', s => s.replace(/✓/g, ''));
clean('src/funcionalidades/criador/fases/07-magias.js', s => s.replace(/✓/g, ''));

// 19. Gerador aleatorio
clean('src/funcionalidades/criador/gerador-aleatorio.js', s => s.replace(/🎲 Herói/g, 'Herói'));

// 20. Portal
clean('src/funcionalidades/index/00-00-portal.js', s => s.replace(/🗑/g, '×'));

// 21. Loja 03-03, 03-04, 03-06, 05-02, 05-03
clean('src/funcionalidades/loja/03-03-prepareCatalogItem.js', s => s.replace(/✎/g, 'Editar'));
clean('src/funcionalidades/loja/03-04-syncFilterUI.js', s => s.replace(/'⚙ ' \+/g, "'' +"));
clean('src/funcionalidades/loja/03-06-magicRuleStatsHtml.js', s => s.replace(/✕/g, '×'));
clean('src/funcionalidades/loja/05-02-applyArsenalContext.js', s => s.replace(/🔨 /g, '').replace(/✨ /g, ''));
clean('src/funcionalidades/loja/05-03-ensureGeneralSaleModal.js', s => s.replace(/<span>🪙<\/span> /g, ''));

// 22. Personagens
clean('src/funcionalidades/personagens/00-00-personagens.js', s => s.replace(/✦ /g, ''));

// 23. Origem cosmopolita
clean('src/regras/criador/origem-cosmopolita.js', s => s.replace(/✕/g, '×'));

// 24. Renderização
clean('src/funcionalidades/criador/ficha/renderizacao.js', s => {
  return s.replace(/✓/g, '')
          .replace(/✦/g, '')
          .replace(/🎲/g, '')
          .replace(/⚔️/g, '')
          .replace(/🛡️/g, '')
          .replace(/🎒/g, '');
});

console.log('Limpeza final concluída!');
