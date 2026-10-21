// Prepara uma transação sem alterar a ficha; persistência e mensagens pertencem ao adaptador.
const OperacoesLoja=Object.freeze({
  preparar(arsenal,finances,completed,message,remainingFunds,profilesKey){
    if(!message.operationId||!message.storage||!['purchase','craft','initial'].includes(message.kind))return {status:'invalid'};
    const previous=arsenal.operations?.[message.operationId];
    if(previous)return {status:'repeated',result:previous};
    const total=Math.max(0,Number(message.total)||0);
    if(!Number.isFinite(total))return {status:'invalid'};
    let saved;try{saved=JSON.parse(JSON.stringify({...arsenal,storage:message.storage}))}catch{return {status:'invalid'}}
    const nextFinances={...finances},nextCompleted=[...completed];
    // Preserva a política legada de transformar compras acima do saldo em recompensa.
    const gift=Boolean(message.gift)||(message.kind==='purchase'&&total>remainingFunds);
    if(['purchase','craft'].includes(message.kind)&&!gift)nextFinances.spent+=total;
    if(message.kind==='purchase'){
      let profiles;try{profiles=JSON.parse(saved.storage[profilesKey]||'{}')}catch{return {status:'invalid'}}
      if(!profiles||typeof profiles!=='object'||(profiles.profiles!==undefined&&!Array.isArray(profiles.profiles)))return {status:'invalid'};
      for(const profile of profiles.profiles||[]){
        if(!profile||profile.backpack!==undefined&&!Array.isArray(profile.backpack))return {status:'invalid'};
        for(const item of profile.backpack||[])if(item?.acquisition?.operationId===message.operationId)item.acquisition.source=gift?'gift':'purchase';
      }
      saved.storage[profilesKey]=JSON.stringify(profiles);
    }
    saved.grants={...saved.grants};saved.operations={...saved.operations};
    for(const grant of message.grants||[])saved.grants[grant]=true;
    saved.grants[message.operationId]=true;
    if(message.kind==='initial'){
      saved.pending=null;saved.unresolved=message.unresolved||[];
      if(message.finalize){saved.complete=true;if(!nextCompleted.includes(8))nextCompleted.push(8)}
      else saved.choiceIndex++;
    }
    const result={total,gift,kind:message.kind};saved.operations[message.operationId]=result;
    return {status:'ready',arsenal:saved,finances:nextFinances,completed:nextCompleted,result};
  }
});
if(typeof module!=='undefined'&&module.exports)module.exports=OperacoesLoja;
