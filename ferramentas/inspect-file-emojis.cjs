const fs = require('fs');

const file = process.argv[2];
if (!file) {
  console.error('Passe o caminho do arquivo como argumento.');
  process.exit(1);
}

const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}\u{FE0F}]/u;
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');
console.log(`Linhas com emoji em ${file}:`);
lines.forEach((l, idx) => {
  if (emojiRegex.test(l)) {
    console.log(`L${idx+1}: ${l.trim().slice(0, 110)}`);
  }
});
