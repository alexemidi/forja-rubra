const fs = require('fs');

function clean(file, fn) {
  try {
    let content = fs.readFileSync(file, 'utf8');
    const updated = fn(content);
    if (content !== updated) {
      fs.writeFileSync(file, updated, 'utf8');
      console.log('Purge Ultimate Limpo:', file);
    }
  } catch (e) {
    console.error('Erro em', file, e.message);
  }
}

// 1. Renderização
clean('src/funcionalidades/criador/ficha/renderizacao.js', s => {
  return s.replace(/aria-label="Descansar 8 horas">🌙<\/button>/g, `aria-label="Descansar 8 horas">\${window.IconesForja ? window.IconesForja.get('bed', 'icon-sm') : 'Zzz'}<\/button>`)
          .replace(/toggleBtn\.innerHTML='✕ Fechar Temp';/g, "toggleBtn.innerHTML='× Fechar Temp';");
});

// 2. Progressão
clean('src/funcionalidades/criador/fases/09-progressao.js', s => {
  return s.replace(/⚔️ Arma Ancestral/g, 'Arma Ancestral')
          .replace(/✨ Katana Ancestral/g, 'Katana Ancestral')
          .replace(/⚙️ Fabricar Item Superior/g, 'Fabricar Item Superior')
          .replace(/🎁 /g, '');
});

// 3. Habilidades Magias
clean('src/funcionalidades/criador/ficha/habilidades-magias.js', s => {
  return s.replace(/✎ Trocar/g, 'Trocar')
          .replace(/<span aria-label="Exige treinamento">❌<\/span>/g, '<span aria-label="Exige treinamento" style="color:var(--red,#ef4444);font-weight:700">—</span>');
});

// 4. Fases 01 e 02
clean('src/funcionalidades/criador/fases/01-identidade-escolhas.js', s => {
  return s.replace(/\(isLocked\?'🔒':visualNum\)/g, "(isLocked?'#':visualNum)");
});
clean('src/funcionalidades/criador/fases/02-raca-atributos.js', s => {
  return s.replace(/\(isLocked\?'🔒':visualNum\)/g, "(isLocked?'#':visualNum)");
});

// 5. Origens divindades
clean('src/funcionalidades/criador/fases/04-origens-divindades.js', s => {
  return s.replace(/\+\(powerMeetsAttrs\(p\)\?'':' ⚠'\)/g, "+(powerMeetsAttrs(p)?'':' (!)')");
});

// 6. Oficina
clean('src/funcionalidades/criador/ficha/oficina-oficios.js', s => {
  return s.replace(/✅ Oficina Ativa/g, 'Oficina Ativa')
          .replace(/👁️ Consulta/g, 'Consulta');
});

// 7. Venda
clean('src/funcionalidades/criador/inventario/venda.js', s => {
  return s.replace(/⚙️ Desmanchar/g, 'Desmanchar');
});

// 8. Portal
clean('src/funcionalidades/index/00-00-portal.js', s => {
  return s.replace(/: '✕'\}/g, ": '×'}");
});

// 9. Loja 03-05 e 05-02
clean('src/funcionalidades/loja/03-05-persistCharacterProfiles.js', s => {
  return s.replace(/<span aria-hidden="true">✦<\/span> /g, '');
});
clean('src/funcionalidades/loja/05-02-applyArsenalContext.js', s => {
  return s.replace(/🛠️ Simulação de Fabricação/g, 'Simulação de Fabricação');
});

console.log('Purge Ultimate finalizado!');
