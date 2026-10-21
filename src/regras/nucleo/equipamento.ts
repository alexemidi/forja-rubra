// Transições de equipamento. O adaptador fornece os fatos calculados da ficha.
const RegrasEquipamento=Object.freeze({
  aplicar(original,action,id,context={}){
    const eq={...original},limit=context.limit,count=context.count;
    const reject=message=>({alterado:false,equipment:original,message});
    let message;
    const shield=()=>eq.shieldId&&eq.shieldId!=='none';
    const full=()=>`Limite de ${limit} itens vestidos atingido. Guarde um item antes.`;
    switch(action){
      case 'store-offhand':eq.offhandId='none';message='Item guardado na mochila.';break;
      case 'toggle-dual-attack':
        if(!eq.dualAttack&&!context.dualReady)return reject('Confira os requisitos de Estilo de Duas Armas.');
        eq.dualAttack=!eq.dualAttack;message=eq.dualAttack?'Ataques com ambas ativados até o próximo turno. Desative ao iniciar seu turno.':'Penalidade de duas armas encerrada.';break;
      case 'equip-armor':
        if(!id)return reject('');
        // Mantém a condição legada; a interpretação de "none" não muda nesta extração.
        if(!eq.armorId&&count>=limit)return reject(full());
        eq.armorId=id;message='Armadura vestida.';break;
      case 'swap-armor':if(!id)return reject('');eq.armorId=id;message='Armadura trocada com sucesso.';break;
      case 'store-armor':eq.armorId='none';message='Armadura guardada na mochila. Defesa recalculada.';break;
      case 'equip-shield':
        if(!id)return reject('');
        if(eq.offhandId&&eq.offhandId!=='none')return reject('As duas mãos estão ocupadas. Guarde um item antes.');
        if(context.blocksShield)return reject('Arma de duas mãos empunhada — não é possível usar escudo.');
        eq.shieldId=id;message='Escudo equipado. Bônus de defesa aplicado.';break;
      case 'store-shield':eq.shieldId='none';message='Escudo guardado na mochila. Bônus de defesa removido.';break;
      case 'equip-weapon':
        if(context.handSlot==='offhandId'){
          if(context.blocksShield)return reject('Uma arma de duas mãos exige as duas mãos livres.');
          eq.offhandId=id;message='Item empunhado na outra mão.';break;
        }
        if(!id)return reject('');eq.weaponId=id;message='Arma empunhada.';
        if(context.blocksShield&&shield()){eq.shieldId='none';message='Arma de duas mãos empunhada. Escudo guardado na mochila.'}break;
      case 'store-weapon':eq.weaponId='none';message='Arma guardada na mochila.';break;
      case 'equip-trailer':
        if(!id)return reject('');if(!eq.trailerId&&count>=limit)return reject(full());
        eq.trailerId=id;message='Traje vestido.';break;
      case 'swap-trailer':if(!id)return reject('');eq.trailerId=id;message='Traje trocado com sucesso.';break;
      case 'store-trailer':eq.trailerId='none';message='Traje guardado na mochila.';break;
      case 'reveal-tattoo':case 'equip-accessory':
        if(!id)return reject('');
        if(count>=limit)return reject(`Limite de ${limit} itens vestidos atingido. Desocupe um espaço antes.`);
        eq.wornIds=[...(eq.wornIds||[])];if(!eq.wornIds.includes(id))eq.wornIds.push(id);
        message=context.tattoo?'Tatuagem mística descoberta (ativa como item vestido).':'Item vestido.';break;
      case 'cover-tattoo':case 'store-accessory':
        if(!id)return reject('');if(Array.isArray(eq.wornIds))eq.wornIds=eq.wornIds.filter(value=>value!==id);
        message=action==='cover-tattoo'?'Tatuagem mística coberta com a roupa. Espaço de item vestido liberado.':'Item guardado na mochila.';break;
      case 'set-handedness-one':case 'set-handedness-two':
        if(!id)return reject('');
        if(action==='set-handedness-two'&&eq.offhandId&&eq.offhandId!=='none')return reject('Guarde o item da outra mão antes de usar duas mãos.');
        eq.adaptableHandedness={...eq.adaptableHandedness,[id]:action==='set-handedness-one'?'uma_mao':'duas_maos'};
        message=action==='set-handedness-one'?'Arma adaptável empunhada com uma mão.':'Arma adaptável empunhada com duas mãos.';
        if(action==='set-handedness-two'&&shield()){eq.shieldId='none';message='Arma adaptável empunhada com duas mãos. Escudo guardado na mochila.'}break;
      default:return reject('');
    }
    return {alterado:true,equipment:eq,message};
  }
});
if(typeof module!=='undefined'&&module.exports)module.exports=RegrasEquipamento;
