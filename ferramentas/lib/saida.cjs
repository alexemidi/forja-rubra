const fs=require('node:fs'),path=require('node:path');
function diretorioSaida(root){
  const dist=path.resolve(root,'dist'),pointer=path.join(dist,'atual.json');
  if(!fs.existsSync(pointer))return dist;
  const {diretorio}=JSON.parse(fs.readFileSync(pointer,'utf8'));
  if(typeof diretorio!=='string')throw Error('Referência de build inválida');
  const target=path.resolve(dist,diretorio);
  if(!target.startsWith(dist+path.sep)||!fs.existsSync(path.join(target,'build.json')))throw Error('Build ausente ou fora do diretório de saída');
  return target;
}
module.exports={diretorioSaida};
