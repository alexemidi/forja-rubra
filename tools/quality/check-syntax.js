const fs=require('fs');
const path=require('path');
const {spawnSync}=require('child_process');
const root=path.resolve(__dirname,'../..');
const roots=['tools'];
const files=new Set();
function visit(relative){const absolute=path.join(root,relative);for(const entry of fs.readdirSync(absolute,{withFileTypes:true})){const child=path.join(relative,entry.name);if(entry.isDirectory()){if(entry.name!=='node_modules')visit(child)}else if(entry.name.endsWith('.js'))files.add(child)}}
for(const directory of roots)if(fs.existsSync(path.join(root,directory)))visit(directory);
const failures=[];
for(const file of [...files].sort()){
  if(file.endsWith('arsenal-storage-bridge.js')){
    const source=fs.readFileSync(path.join(root,file),'utf8').replace('/*__ARSENAL_STATE__*/','null');
    try{new Function(source)}catch(error){failures.push(file+'\n'+error.stack)}
    continue;
  }
  const result=spawnSync(process.execPath,['--check',path.join(root,file)],{encoding:'utf8'});
  if(result.status)failures.push(file+'\n'+(result.stderr||result.stdout));
}
if(failures.length)throw new Error('Falhas de sintaxe:\n'+failures.join('\n'));
console.log(JSON.stringify({status:'ok',javascript:files.size}));
