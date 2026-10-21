const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const projectRoot=path.resolve(__dirname,'..'),port=Number(process.env.PORT||process.argv[2]||4174);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.pdf':'application/pdf','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{
  let root,file;try{root=require('./lib/saida.cjs').diretorioSaida(projectRoot);const url=new URL(req.url,'http://localhost');file=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname))}catch{res.writeHead(400).end();return}
  if(!file.toLowerCase().startsWith((root+path.sep).toLowerCase())){res.writeHead(403).end();return}
  fs.readFile(file,(error,data)=>{if(error){res.writeHead(404,{'Connection':'close'}).end('Arquivo não encontrado');return}res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','Content-Length':data.length,'Connection':'close'});res.end(data)});
});
server.listen(port,'127.0.0.1',()=>console.log(`Forja organizada: http://localhost:${server.address().port}/`));
