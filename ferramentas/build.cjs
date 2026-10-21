const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {gerarProjecoes}=require('./lib/projecoes.cjs');
const {obterCatalogoCanonicaItems}=require('./lib/catalogo-itens.cjs');
const esbuild=require('esbuild');
const root=path.resolve(__dirname,'..'),out=path.join(root,'dist','versoes',Date.now()+'-'+process.pid);
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const readScript=p=>{
  const tsCandidate=p.endsWith('.ts')?p:p.replace(/\.(m?js)$/,'.ts');
  const resolvedPath=fs.existsSync(path.join(root,tsCandidate))?tsCandidate:p;
  const raw=read(resolvedPath);
  if(resolvedPath.endsWith('.ts')){
    return esbuild.transformSync(raw,{loader:'ts',target:'es2022',sourcefile:resolvedPath,legalComments:'none'}).code;
  }
  return raw;
};
const write=(p,s)=>{const f=path.join(out,p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,s)};
// Deliberadamente sem importação, cópia ou leitura da raiz antiga.
fs.mkdirSync(out,{recursive:true});
const runtimeEntry=fs.existsSync(path.join(root,'src/aplicacao/runtime.ts'))
  ? path.join(root,'src/aplicacao/runtime.ts')
  : path.join(root,'src/aplicacao/runtime.mjs');
esbuild.buildSync({entryPoints:[runtimeEntry],bundle:true,format:'iife',target:'es2022',legalComments:'none',outfile:path.join(out,'js/runtime.js'),sourcemap:true});
const source=JSON.parse(read('src/paginas/manifesto.json')),manifest={};
const sharedDialogs=read('src/ui/templates/dialogos-personagem.html');
const creationControls=read('src/ui/templates/navegacao-criacao.html');
const creationFooter=read('src/ui/templates/rodape-criacao.html');
const cards=JSON.parse(read('dados/magias-cards.json'));
for(const dir of ['assets','src/estilos'])fs.cpSync(path.join(root,dir),path.join(out,dir),{recursive:true});
// Fontes JSON continuam legíveis; publicar somente dados consumidos, sem indentação.
const usedData=new Set(Object.values(source).flatMap(entry=>Object.values(entry.data)));
for(const file of usedData)if(fs.existsSync(path.join(root,file)))write(file,JSON.stringify(JSON.parse(read(file))));
write('src/compartilhado/inicializar.js',readScript('src/compartilhado/inicializar.js'));
// Projeções para consumidores antigos: gera o catálogo canônico completo de 750 itens com preços.
const canonicalItems=obterCatalogoCanonicaItems(root),improvements=JSON.parse(read('dados/improvement_data.json'));
for(const [name,value] of Object.entries(gerarProjecoes(canonicalItems,improvements,cards)))write('dados/'+name+'.json',JSON.stringify(value));
for(const [page,entry] of Object.entries(source)){
  const scripts=entry.scripts.map((parts,i)=>{
    const code=parts.map(p=>readScript(p)).join('\n');
    const file=`js/${page}-${i}.js`;write(file,code);return file;
  });
  manifest[page]={scripts,data:entry.data};write(page+'.html',read('src/paginas/'+page+'.html').replace('<!--FORJA-SHARED-DIALOGS-->',sharedDialogs).replace('<!--FORJA-CREATION-NAV-->',creationControls).replace('<!--FORJA-CREATION-FOOTER-->',creationFooter).replace(/<!--FORJA-SPELL:([^>]+)-->/g,(_,id)=>{if(!cards[id])throw Error('Magia ausente: '+id);return cards[id]}));
}
write('paginas.json',JSON.stringify(manifest));
write('build.json',JSON.stringify({generatedAt:new Date().toISOString(),sourceHash:sourceHash(),pages:Object.keys(source)},null,2));
console.log('Compilação independente concluída em '+out);


function sourceHash(){
  const hash=crypto.createHash('sha256');
  function scan(dir){
    for(const entry of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
      const file=path.join(dir,entry.name);
      if(entry.isDirectory())scan(file);
      else{hash.update(path.relative(root,file));hash.update(fs.readFileSync(file))}
    }
  }
  for(const name of ['src','dados','assets','ferramentas'])scan(path.join(root,name));
  return hash.digest('hex');
}
const pointer=path.join(root,'dist','atual.json');
const temporary=pointer+'.'+process.pid+'.tmp';
fs.writeFileSync(temporary,JSON.stringify({diretorio:path.relative(path.join(root,'dist'),out).replaceAll('\\','/')}));
fs.renameSync(temporary,pointer);

// Rotaciona versões antigas em dist/versoes, preservando apenas as 2 mais recentes para recuperação
try {
  const versoesDir = path.join(root, 'dist', 'versoes');
  if (fs.existsSync(versoesDir)) {
    const list = fs.readdirSync(versoesDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => ({ name: d.name, time: fs.statSync(path.join(versoesDir, d.name)).mtimeMs }))
      .sort((a, b) => b.time - a.time);
    for (const oldVersion of list.slice(2)) {
      fs.rmSync(path.join(versoesDir, oldVersion.name), { recursive: true, force: true });
    }
  }
  // Limpa pastas temporárias .build-* órfãs na raiz do projeto
  for (const item of fs.readdirSync(root, { withFileTypes: true })) {
    if (item.isDirectory() && item.name.startsWith('.build-') && item.name !== path.basename(out)) {
      fs.rmSync(path.join(root, item.name), { recursive: true, force: true });
    }
  }
} catch {}

// Sincroniza a versão publicada diretamente na raiz de dist/ para uso local imediato
const distDir = path.join(root, 'dist');
for (const entry of fs.readdirSync(out, { withFileTypes: true })) {
  if (entry.name === 'versoes') continue;
  const srcPath = path.join(out, entry.name);
  const destPath = path.join(distDir, entry.name);
  fs.cpSync(srcPath, destPath, { recursive: true, force: true });
}

console.log('Versão unificada publicada em '+out+' e sincronizada em '+distDir);

