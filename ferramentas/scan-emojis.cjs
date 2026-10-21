const fs = require('fs');
const path = require('path');

// Regex para detectar emojis (Unicode Symbols & Pictographs, Dingbats, etc.)
const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}\u{FE0F}]/u;

function walk(dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.git', '.gemini', 'tmp', 'dist'].includes(entry.name)) continue;
      results = results.concat(walk(fullPath));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (['.js', '.html', '.css', '.json', '.md'].includes(ext)) {
        // NUNCA tocar nem escanear raças.md pela regra do usuário
        if (entry.name.toLowerCase() === 'raças.md' || entry.name.toLowerCase() === 'racas.md') continue;
        results.push(fullPath);
      }
    }
  }
  return results;
}

const files = walk('.');
const found = [];
for (const file of files) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (emojiRegex.test(line)) {
        found.push({ file, line: idx + 1, snippet: line.trim().slice(0, 100) });
      }
    });
  } catch (e) {}
}

console.log('Total de linhas com emoji encontradas (exceto raças.md):', found.length);
const byFile = {};
found.forEach(f => {
  byFile[f.file] = (byFile[f.file] || 0) + 1;
});
console.log('Arquivos afetados:');
Object.entries(byFile).sort((a,b) => b[1] - a[1]).forEach(([f, count]) => {
  console.log(`${count.toString().padStart(4)}: ${f}`);
});
