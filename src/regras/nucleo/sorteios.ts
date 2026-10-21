const SorteiosPersonagem=Object.freeze({
  ponderado(entries,weight=()=>1,random=Math.random){
    const weights=entries.map(entry=>Math.max(0,Number(weight(entry))||0)),total=weights.reduce((a,b)=>a+b,0);
    if(!entries.length||!total)return null;
    let cursor=random()*total;
    for(let i=0;i<entries.length;i++){cursor-=weights[i];if(cursor<0)return entries[i]}
    return entries.at(-1);
  },
  pesosAtributos(attrs,allowed){
    const offset=Math.max(0,1-Math.min(...Object.values(attrs).map(Number)));
    return Object.fromEntries(allowed.map(id=>[id,Math.pow(Number(attrs[id]||0)+offset,4)]));
  },
  armadurasIniciais(catalog,heavy){
    const ids=new Set(['armadura_de_couro','couro_batido','gibao_de_peles',...(heavy?['brunea']:[])]);
    return catalog.filter(item=>ids.has(item.id));
  }
});
if(typeof module!=='undefined'&&module.exports)module.exports=SorteiosPersonagem;
