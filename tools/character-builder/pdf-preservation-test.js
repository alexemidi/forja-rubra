const assert=require('assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm'),PDFLib=require('pdf-lib');
(async()=>{
  const bytes=fs.readFileSync(path.join(__dirname,'../../output/Ficha T20 Jogo do Ano - Otimizada v1.7.pdf'));
  const pdf=await PDFLib.PDFDocument.load(bytes,{updateMetadata:false}),form=pdf.getForm();
  // Resolve indirect objects: comparing reference numbers alone misses changed scripts.
  function resolve(doc,value,seen=new Set()){
    if(value instanceof PDFLib.PDFRef){const id=value.toString();if(seen.has(id))return id;return resolve(doc,doc.context.lookup(value),new Set([...seen,id]))}
    if(value instanceof PDFLib.PDFRawStream)return {dict:resolve(doc,value.dict,seen),bytes:Buffer.from(value.contents).toString('base64')};
    if(value instanceof PDFLib.PDFDict)return Object.fromEntries(value.entries().map(([key,item])=>[key.toString(),resolve(doc,item,seen)]));
    if(value instanceof PDFLib.PDFArray)return value.asArray().map(item=>resolve(doc,item,seen));
    return value?.toString()??null;
  }
  function snapshot(doc){return doc.getForm().getFields().map(field=>({name:field.getName(),properties:[field.acroField.dict,...field.acroField.getWidgets().map(widget=>widget.dict)].map(dict=>Object.fromEntries(['AA','DA','Q','Ff','Opt','AP','DV'].map(key=>[key,resolve(doc,dict.get(PDFLib.PDFName.of(key)))])))}))}
  const original=snapshot(pdf);
  const context=vm.createContext({PDFLib,console,document:{addEventListener(){}}});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'pdf-export.js'),'utf8'),context);
  const protectedFields=form.getFields().filter(field=>field.isReadOnly()),before=protectedFields.map(field=>field.acroField.dict.toString());
  for(const field of protectedFields)context.pdfSetText(form,field.getName(),'999');
  assert.deepEqual(protectedFields.map(field=>field.acroField.dict.toString()),before);
  const name=form.getTextField('Nome'),keys=['DA','Q','Ff','AA','AP','DV'],properties=keys.map(key=>name.acroField.dict.get(PDFLib.PDFName.of(key))?.toString());
  context.pdfSetText(form,'Nome','Teste de preservação');
  context.pdfSetChoice(form,'ModAtributoDef','car');
  context.pdfSetCheck(form,'CheckNobreza',true);
  assert.equal(name.getText(),'Teste de preservação');
  assert.deepEqual(keys.map(key=>name.acroField.dict.get(PDFLib.PDFName.of(key))?.toString()),properties);
  context.pdfScheduleInitialCalculation(pdf);
  const reopened=await PDFLib.PDFDocument.load(await pdf.save({updateFieldAppearances:false}),{updateMetadata:false});
  const opening=reopened.context.lookup(reopened.catalog.get(PDFLib.PDFName.of('OpenAction')));
  assert.equal(opening.get(PDFLib.PDFName.of('JS')).decodeText(),'this.calculateNow();');
  assert.equal(reopened.getForm().getTextField('Nome').getText(),'Teste de preservação');
  assert.deepEqual(reopened.getForm().getDropdown('ModAtributoDef').getSelected(),['car']);
  assert(reopened.getForm().getCheckBox('CheckNobreza').isChecked());
  for(const field of protectedFields)assert.equal(reopened.getForm().getField(field.getName()).acroField.dict.toString(),before[protectedFields.indexOf(field)]);
  assert.equal(reopened.getForm().getFields().filter(field=>field.isReadOnly()).length,43);
  assert.deepEqual(snapshot(reopened),original);
  // CO contains references to changed field values, so compare its ordered references only.
  assert.equal(reopened.getForm().acroForm.dict.get(PDFLib.PDFName.of('CO')).toString(),form.acroForm.dict.get(PDFLib.PDFName.of('CO')).toString());
  assert(form.acroForm.dict.get(PDFLib.PDFName.of('CO')).size()>0);
  console.log('PDF: propriedades, aparências e scripts de todos os campos/widgets preservados; 43 campos protegidos e ordem de cálculo intacta.');
})().catch(error=>{console.error(error);process.exitCode=1});
