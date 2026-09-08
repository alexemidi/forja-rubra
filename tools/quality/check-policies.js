const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'../..');
const targets=['tools/character-builder','tools/item-catalog/src','grimorio.html','Criador de Ficha T20.html','Arsenal de Arton.html'];
const files=[];
function visit(relative){const absolute=path.join(root,relative),stat=fs.statSync(absolute);if(stat.isDirectory())for(const name of fs.readdirSync(absolute))visit(path.join(relative,name));else if(/\.(?:js|html)$/.test(relative)&&!/(?:test|benchmark)\.js$/.test(relative))files.push(relative)}
targets.forEach(visit);
const nativeDialog=/\b(?:window\s*\.\s*)?(?:alert|confirm|prompt)\s*\(/g;
const violations=[];
for(const file of files){const text=fs.readFileSync(path.join(root,file),'utf8');for(const match of text.matchAll(nativeDialog)){const line=text.slice(0,match.index).split(/\r?\n/).length;violations.push(file+':'+line+' usa diálogo nativo')}}
if(violations.length)throw new Error('Políticas do projeto violadas:\n'+violations.join('\n'));
console.log(JSON.stringify({status:'ok',files:files.length,nativeDialogs:0}));

