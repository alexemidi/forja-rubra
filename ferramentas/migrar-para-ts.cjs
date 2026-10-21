const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'src');

function walk(d) {
  let results = [];
  for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
    const fullPath = path.join(d, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(fullPath));
    } else if (/\.(js|mjs)$/.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = walk(srcDir);
console.log(`Encontrados ${files.length} arquivos .js/.mjs em src/`);

let renamedCount = 0;
for (const f of files) {
  const rel = path.relative(root, f).replace(/\\/g, '/');
  if (rel === 'src/aplicacao/runtime.mjs') {
    fs.unlinkSync(f);
    console.log(`Removido arquivo redundante: ${rel}`);
    continue;
  }
  const targetTs = f.replace(/\.(js|mjs)$/, '.ts');
  if (!fs.existsSync(targetTs)) {
    fs.renameSync(f, targetTs);
    renamedCount++;
  } else {
    console.log(`Alvo já existe: ${targetTs}`);
  }
}
console.log(`Renomeados com sucesso ${renamedCount} arquivos para .ts.`);

// Atualiza manifesto.json
const manifestoPath = path.join(root, 'src', 'paginas', 'manifesto.json');
let manifestoRaw = fs.readFileSync(manifestoPath, 'utf8');
manifestoRaw = manifestoRaw.replace(/\.js"/g, '.ts"').replace(/\.mjs"/g, '.ts"');
fs.writeFileSync(manifestoPath, manifestoRaw);
console.log('src/paginas/manifesto.json atualizado com extensões .ts!');

// Atualiza tsconfig.json
const tsconfigPath = path.join(root, 'tsconfig.json');
let tsconfigRaw = fs.readFileSync(tsconfigPath, 'utf8');
const tsconfigObj = JSON.parse(tsconfigRaw);
tsconfigObj.include = [
  "src/**/*.ts",
  "src/tipos/**/*.d.ts",
  "testes/unit/**/*.ts"
];
fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfigObj, null, 2) + '\n');
console.log('tsconfig.json atualizado!');
