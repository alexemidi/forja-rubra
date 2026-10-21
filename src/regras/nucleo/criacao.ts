const RegrasCriacao=Object.freeze({
  atributos(ids,base,bonus){return Object.fromEntries(ids.map(id=>[id,Number(base[id]||0)+Number(bonus[id]||0)]))},
  pontos(ids,base,custos){return ids.reduce((sum,id)=>sum+custos[base[id]],0)},
  nivelClasse(progressao,index,classId){return progressao.slice(0,index+1).filter(row=>row.classId===classId).length}
});
if(typeof module!=='undefined'&&module.exports)module.exports=RegrasCriacao;
