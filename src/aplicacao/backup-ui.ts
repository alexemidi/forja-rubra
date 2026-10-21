(()=>{
  let selected=null;
  const status=document.getElementById('backupStatus'),preview=document.getElementById('backupPreview'),confirm=document.getElementById('importBackup');
  function download(data,suffix){
    const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download='forja-backup-'+suffix+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  document.getElementById('exportBackup').addEventListener('click',()=>{
    try{download(ForjaUnificada.exportarBackup(localStorage),Date.now());status.textContent='Backup gerado.'}catch(e){status.textContent=e.message}
  });
  document.getElementById('backupFile').addEventListener('change',async event=>{
    selected=null;confirm.disabled=true;
    try{
      const file=event.target.files[0];if(!file)return;
      selected=ForjaUnificada.validarBackup(JSON.parse(await file.text()));
      preview.textContent=Object.keys(selected.dados).length+' entradas válidas. Confira o arquivo antes de importar.';
      confirm.disabled=false;
    }catch(e){preview.textContent='Não foi possível ler o backup: '+e.message}
  });
  confirm.addEventListener('click',()=>{
    try{
      if(!selected)return;
      download(ForjaUnificada.exportarBackup(localStorage),'antes-da-importacao-'+Date.now());
      const count=ForjaUnificada.importarBackup(localStorage,selected);
      status.textContent=count+' entradas importadas. Você já pode abrir seus personagens.';
      selected=null;confirm.disabled=true;
    }catch(e){status.textContent='Importação não concluída: '+e.message}
  });
})();
