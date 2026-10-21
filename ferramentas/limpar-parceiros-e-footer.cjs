const fs = require('fs');

// 1. Limpar 09-parceiros.js
let parc = fs.readFileSync('src/funcionalidades/criador/fases/09-parceiros.js', 'utf8');
parc = parc.replace(/icon:\s*'✦'/g, "icon: ''");
parc = parc.replace(/<strong>🦎 Montaria Tumarkhân:<\/strong>/g, '<strong>Montaria Tumarkhân:</strong>');
parc = parc.replace(/<strong>🐎 Irmão Cavalo:<\/strong>/g, '<strong>Irmão Cavalo:</strong>');
parc = parc.replace(/<strong>🦅 Grifo da Fênix:<\/strong>/g, '<strong>Grifo da Fênix:</strong>');
fs.writeFileSync('src/funcionalidades/criador/fases/09-parceiros.js', parc, 'utf8');
console.log('09-parceiros.js limpo!');

// 2. Limpar footer-ui.js
let foot = fs.readFileSync('src/compartilhado/footer/footer-ui.js', 'utf8');
foot = foot.replace(/>✕<\/button>/g, '>×<\/button>');
foot = foot.replace(/<span>✓<\/span>/g, '<span class="support-check">●</span>');
fs.writeFileSync('src/compartilhado/footer/footer-ui.js', foot, 'utf8');
console.log('footer-ui.js limpo!');
