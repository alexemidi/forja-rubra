/* Regras de idade canônicas de Tormenta20 */
const RegrasIdade = (() => {
  function multiplicador(_id) {
    return 1;
  }
  function intervalos(faixas) {
    const ids = Object.keys(faixas), inicios = {};
    for (const id of ids) inicios[id] = faixas[id].start;
    return Object.fromEntries(ids.map((id,i)=>[id,{min:inicios[id],max:i===ids.length-1?null:inicios[ids[i+1]]-1}]));
  }
  function sobreposicao() {
    return false;
  }
  function modificadores(regra) {
    return { ...(regra?.mods || {}) };
  }
  function limitar(anos, intervalo) {
    if (!intervalo || anos === '') return null;
    const antes=Math.round(Number(anos)),depois=Math.max(intervalo.min,intervalo.max===null?antes:Math.min(intervalo.max,antes));
    return {years:String(depois),notice:antes!==depois?'Idade ajustada de '+antes+' para '+depois+'.':''};
  }
  return Object.freeze({multiplicador,intervalos,sobreposicao,modificadores,limitar});
})();
if(typeof module!=='undefined'&&module.exports)module.exports=RegrasIdade;
