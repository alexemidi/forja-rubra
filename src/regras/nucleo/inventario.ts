const RegrasInventario = Object.freeze({
  vender(backpack, id, quantidade, preco, identificar, arredondamento='centavos') {
    let index=backpack.findIndex((entry,i)=>identificar(entry,i)===id);
    if(index<0 && typeof id==='string'){
      index=backpack.findIndex((entry,i)=>(entry.instanceId===id || entry.uid===id || entry.id===id || (id.includes(':') && entry.itemId===id.split(':')[0] && String(i)===id.split(':')[1])));
    }
    if(index<0 && typeof id==='string'){
      const baseId=id.includes(':')?id.split(':')[0]:id;
      index=backpack.findIndex(entry=>entry.itemId===baseId);
    }
    const unchanged={alterado:false,backpack,quantidade:0,total:0};
    if(index<0||!Number.isFinite(quantidade)||!Number.isFinite(preco)||quantidade<=0||preco<0)return unchanged;
    const entry=backpack[index],available=Number(entry.quantity||1);
    if(!Number.isFinite(available)||available<=0)return unchanged;
    const sold=Math.min(available,quantidade),result=backpack.slice();
    const total=RegrasInventario.totalVenda(sold,preco,arredondamento);
    if(!Number.isFinite(total))return unchanged;
    if(sold>=available)result.splice(index,1);
    else result[index]={...entry,quantity:available-sold};
    return {alterado:true,backpack:result,quantidade:sold,total};
  },
  desequipar(equipment,id) {
    const result={...equipment};
    for(const slot of ['armorId','shieldId','weaponId','offhandId','trailerId'])if(result[slot]===id)result[slot]='none';
    if(Array.isArray(result.wornIds))result.wornIds=result.wornIds.filter(value=>value!==id);
    return result;
  },
  consolidar(backpack) {
    if(!Array.isArray(backpack)||backpack.length===0)return backpack||[];
    const result=[],indices=new Map();
    for(const original of backpack){
      if(!original)continue;
      const entry={...original,acquisition:original.acquisition?{...original.acquisition}:original.acquisition};
      if(entry.acquisition?.additionalGrantIds)entry.acquisition.additionalGrantIds=[...entry.acquisition.additionalGrantIds];
      if([entry.itemId,entry.displayName,entry.itemName].some(value=>/traje_de_viaj/i.test(value))){
        entry.itemId='traje_de_viajante';entry.itemName=entry.displayName='Traje de Viajante';
      }
      // Engenhocas são invenções únicas e nunca devem ser mescladas entre si
      const isEng = Boolean(entry.isEngenhoca || entry.contraptionId || entry.engenhocaInfo || (entry.itemId && String(entry.itemId).startsWith('engenhoca_')) || entry.tipo === 'engenhoca' || entry.categoriaId === 'engenhoca');
      if (isEng) {
        result.push(entry);
        continue;
      }
      let byOptions=indices.get(entry.itemId);
      if(!byOptions){byOptions=new Map();indices.set(entry.itemId,byOptions)}
      const nameKey = String(entry.displayName || entry.itemName || entry.customName || '').trim();
      const isDamaged = Boolean(entry.estragado || entry.isDamaged || entry.damaged);
      const key=JSON.stringify([nameKey, isDamaged, JSON.stringify(entry.options||{}),JSON.stringify(entry.improvements||[]),JSON.stringify(entry.enchantments||[]),entry.mountPartnerId||null,entry.carriedByMountId||null]);
      const existing=byOptions.get(key);
      if(existing){
        existing.quantity=(Number(existing.quantity)||1)+(Number(entry.quantity)||1);
        existing.acquisition=existing.acquisition||{};
        if(entry.acquisition?.source)existing.acquisition.source=entry.acquisition.source;
        if(entry.acquisition?.operationId)existing.acquisition.operationId=entry.acquisition.operationId;
        if(!existing.acquisition.additionalGrantIds)existing.acquisition.additionalGrantIds=[];
        if(entry.acquisition?.grantId)existing.acquisition.additionalGrantIds.push(entry.acquisition.grantId);
        if(entry.acquisition?.additionalGrantIds)existing.acquisition.additionalGrantIds.push(...entry.acquisition.additionalGrantIds);
      }else{result.push(entry);byOptions.set(key,entry)}
    }
    for(const entry of result)if(entry.itemId==='traje_de_viajante')entry.quantity=1;
    return result;
  },
  precoVenda(valor, percentual=50) { return Math.floor(valor*percentual/100); },
  totalVenda(quantidade, preco, arredondamento='centavos') {
    const total=quantidade*preco;
    return arredondamento==='inteiro'?Math.floor(total):Math.round(total*100)/100;
  },
  consumir(backpack, id, tipo, identificar) {
    const index=backpack.findIndex((entry,i)=>identificar(entry,i)===id);
    if(index<0)return {alterado:false,backpack};
    const entry=backpack[index],disparo=tipo==='fire';
    const quantidade=Math.max(0,Number(disparo?(entry.ammoRemaining??entry.quantity??0):(entry.quantity||0)));
    if(!quantidade)return {alterado:false,backpack};
    const result=backpack.slice();
    if(disparo)result[index]={...entry,ammoRemaining:quantidade-1};
    else if(quantidade<=1)result.splice(index,1);
    else result[index]={...entry,quantity:quantidade-1};
    return {alterado:true,backpack:result};
  },
  atualizarPerfis(serializado, atualizar) {
    let profiles;try{profiles=JSON.parse(serializado||'{}')}catch{return null}
    if(!profiles||typeof profiles!=='object')profiles={};
    if(!Array.isArray(profiles.profiles)){
      profiles.profiles=[{id:'ficha-ativa',backpack:[]}];
      profiles.activeId='ficha-ativa';
    }
    let index=profiles.profiles.findIndex(profile=>profile.id==='ficha-ativa'||profile.id===profiles.activeId);
    if(index<0){
      profiles.profiles.push({id:'ficha-ativa',backpack:[]});
      index=profiles.profiles.length-1;
    }
    const backpack=profiles.profiles[index].backpack||(profiles.profiles[index].backpack=[]);
    if(atualizar(backpack)===false)return null;
    return JSON.stringify(profiles);
  }
});
if(typeof module!=='undefined'&&module.exports)module.exports=RegrasInventario;
