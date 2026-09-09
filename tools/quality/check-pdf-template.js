const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const {PDFDocument}=require('pdf-lib');
const root=path.resolve(__dirname,'../..');
const relative='output/Ficha T20 Jogo do Ano - Otimizada v1.7.pdf';
const expected={sha256:'e30569b0a3dd0fe29075f78c44ee57ed9bf99f891c7349e3a3c6ba0bfedae26d',bytes:3654333,pages:2,fields:305};
(async()=>{const absolute=path.join(root,relative);if(!fs.existsSync(absolute))throw new Error('PDF modelo não encontrado: '+relative);const bytes=fs.readFileSync(absolute),sha256=crypto.createHash('sha256').update(bytes).digest('hex');const pdf=await PDFDocument.load(bytes,{updateMetadata:false}),actual={sha256,bytes:bytes.length,pages:pdf.getPageCount(),fields:pdf.getForm().getFields().length};for(const key of Object.keys(expected))if(actual[key]!==expected[key])throw new Error('PDF modelo alterado em '+key+': esperado '+expected[key]+', encontrado '+actual[key]);console.log(JSON.stringify({status:'ok',template:relative,...actual}))})().catch(error=>{console.error(error.stack||error);process.exit(1)});
