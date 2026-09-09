const assert=require('assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm'),PDFLib=require('pdf-lib');
(async()=>{
  const bytes=fs.readFileSync(path.join(__dirname,'../../output/Ficha T20 Jogo do Ano - Otimizada v1.7.pdf'));
  const pdf=await PDFLib.PDFDocument.load(bytes,{updateMetadata:false}),form=pdf.getForm();
  const context=vm.createContext({PDFLib,console,document:{addEventListener(){}}});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'pdf-export.js'),'utf8'),context);
  const protectedFields=form.getFields().filter(field=>field.isReadOnly()),before=protectedFields.map(field=>field.acroField.dict.toString());
  for(const field of protectedFields)context.pdfSetText(form,field.getName(),'999');
  assert.deepEqual(protectedFields.map(field=>field.acroField.dict.toString()),before);
  const name=form.getTextField('Nome'),keys=['DA','Q','Ff','AA','AP','DV'],properties=keys.map(key=>name.acroField.dict.get(PDFLib.PDFName.of(key))?.toString());
  context.pdfSetText(form,'Nome','Teste de preservação');
  assert.equal(name.getText(),'Teste de preservação');
  assert.deepEqual(keys.map(key=>name.acroField.dict.get(PDFLib.PDFName.of(key))?.toString()),properties);
  const reopened=await PDFLib.PDFDocument.load(await pdf.save({updateFieldAppearances:false}),{updateMetadata:false});
  assert.equal(reopened.getForm().getTextField('Nome').getText(),'Teste de preservação');
  assert.equal(reopened.getForm().getFields().filter(field=>field.isReadOnly()).length,43);
  console.log('PDF: 43 campos protegidos; propriedades e valor editável preservados após serialização.');
})().catch(error=>{console.error(error);process.exitCode=1});
