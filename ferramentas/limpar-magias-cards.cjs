const fs = require('fs');

const path = 'dados/magias-cards.json';
let content = fs.readFileSync(path, 'utf8');

// Substituir <span class="escola-icon">EMOJI</span> por <span class="escola-icon" aria-hidden="true"></span>
const beforeMatches = (content.match(/<span class=\\"escola-icon\\">[\s\S]*?<\/span>/g) || []).length;
content = content.replace(/<span class=\\"escola-icon\\">[\s\S]*?<\/span>/g, '<span class=\\"escola-icon\\" aria-hidden=\\"true\\"></span>');

// Verificar se restou algum emoji no arquivo
const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}\u{FE0F}]/u;
const lines = content.split('\n');
let remaining = 0;
lines.forEach((l, idx) => {
  if (emojiRegex.test(l)) {
    remaining++;
    console.log(`Linha ${idx+1} ainda tem emoji:`, l.slice(0, 80));
  }
});

fs.writeFileSync(path, content, 'utf8');
console.log(`Substituídos ${beforeMatches} ícones de escola. Emojis restantes: ${remaining}`);
